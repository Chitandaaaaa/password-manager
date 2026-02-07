import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import iconv from 'iconv-lite';
import { DatabaseService } from './services/database';
import { CryptoService } from './services/crypto';
import { PasswordService } from './services/password';
import { OllamaService } from './services/ollama';
import { OllamaConfig } from './services/ollama';

// 保持对window对象的全局引用，防止JavaScript对象被垃圾回收
let mainWindow: BrowserWindow | null = null;

// 初始化服务
const dbService = new DatabaseService();
const cryptoService = new CryptoService();
const ollamaService = new OllamaService(dbService);
let passwordService: PasswordService | null = null;

// 安全功能变量
let lastActivityTime = Date.now();
let autoLockTimer: NodeJS.Timeout | null = null;
let clipboardClearTimer: NodeJS.Timeout | null = null;
let lastClipboardContent = '';

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // 加载应用
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // 开发模式下如需调试可取消下面这行的注释
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 监听用户活动，更新最后活动时间
  mainWindow.webContents.on('before-input-event', () => {
    lastActivityTime = Date.now();
  });

  mainWindow.on('focus', () => {
    lastActivityTime = Date.now();
  });

  // 启动安全功能
  startSecurityFeatures();

  // 拦截新窗口打开请求，使用默认浏览器打开外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 在默认浏览器中打开链接
    shell.openExternal(url);
    return { action: 'deny' }; // 阻止在 Electron 中打开新窗口
  });

  // 处理页面内链接点击，使用默认浏览器打开外部链接
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // 如果是开发服务器URL或本地文件，允许正常导航
    if (process.env.VITE_DEV_SERVER_URL && url.startsWith(process.env.VITE_DEV_SERVER_URL)) {
      return;
    }
    if (url.startsWith('file://')) {
      return;
    }
    
    // 阻止默认导航行为
    event.preventDefault();
    // 在默认浏览器中打开链接
    shell.openExternal(url);
  });
}

// Electron初始化完成后创建窗口
app.whenReady().then(async () => {
  // 初始化数据库
  await dbService.init();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ===== 安全功能 =====

// 启动安全功能（自动锁定和剪贴板清除）
function startSecurityFeatures() {
  const config = dbService.getConfig();
  
  // 启动自动锁定检查
  if (config.autoLock?.enabled) {
    startAutoLockTimer();
  }
}

// 启动自动锁定定时器
function startAutoLockTimer() {
  if (autoLockTimer) {
    clearInterval(autoLockTimer);
  }
  
  // 每分钟检查一次
  autoLockTimer = setInterval(() => {
    const config = dbService.getConfig();
    if (!config.autoLock?.enabled) return;
    
    const timeoutMinutes = config.autoLock.timeout || 5;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const inactiveTime = Date.now() - lastActivityTime;
    
    if (inactiveTime > timeoutMs) {
      console.log('自动锁定：用户空闲超过', timeoutMinutes, '分钟');
      lockApplication();
    }
  }, 60000); // 每分钟检查一次
}

// 锁定应用（发送锁定事件到渲染进程）
function lockApplication() {
  if (mainWindow && passwordService) {
    mainWindow.webContents.send('app:lock');
  }
}

// 设置剪贴板清除定时器
function setClipboardClearTimer(content: string) {
  // 清除之前的定时器
  if (clipboardClearTimer) {
    clearTimeout(clipboardClearTimer);
  }
  
  const config = dbService.getConfig();
  if (!config.clipboard?.autoClear) return;
  
  lastClipboardContent = content;
  const timeoutSeconds = config.clipboard.timeout || 30;
  
  clipboardClearTimer = setTimeout(() => {
    // 检查剪贴板内容是否还是我们设置的那个
    const currentClipboard = require('electron').clipboard.readText();
    if (currentClipboard === lastClipboardContent) {
      // 清空剪贴板
      require('electron').clipboard.clear();
      console.log('剪贴板已自动清除');
    }
  }, timeoutSeconds * 1000);
}

// IPC：复制密码到剪贴板
ipcMain.handle('clipboard:copyPassword', (event, password: string) => {
  const { clipboard } = require('electron');
  clipboard.writeText(password);
  
  // 设置自动清除定时器
  setClipboardClearTimer(password);
  
  return { success: true };
});

// ===== IPC 处理器 =====

// 检查是否已设置主密码
ipcMain.handle('auth:checkSetup', async () => {
  return await dbService.hasUser();
});

// 初始化主密码
ipcMain.handle('auth:setup', async (event, password: string) => {
  try {
    const salt = cryptoService.generateSalt();
    const hashedPassword = cryptoService.hashMasterPassword(password, salt);
    
    await dbService.createUser(hashedPassword, salt);
    
    // 初始化密码服务
    const key = cryptoService.deriveKey(password, salt);
    passwordService = new PasswordService(dbService, key);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 登录验证
ipcMain.handle('auth:login', async (event, password: string) => {
  try {
    const user = await dbService.getUser();
    if (!user) {
      return { success: false, error: '用户不存在' };
    }
    
    const hashedPassword = cryptoService.hashMasterPassword(password, user.salt);
    
    if (hashedPassword !== user.master_password_hash) {
      return { success: false, error: '密码错误' };
    }
    
    // 初始化密码服务
    const key = cryptoService.deriveKey(password, user.salt);
    passwordService = new PasswordService(dbService, key);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 退出登录
ipcMain.handle('auth:logout', async () => {
  try {
    // 清除密码服务，表示用户已退出
    passwordService = null;
    console.log('用户已退出登录');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 添加密码
ipcMain.handle('password:add', async (event, data) => {
  if (!passwordService) {
    return { success: false, error: '未登录' };
  }
  
  try {
    const id = await passwordService.addPassword(data);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 获取密码列表
ipcMain.handle('password:list', async (event, filters = {}) => {
  if (!passwordService) {
    return { success: false, error: '未登录' };
  }
  
  try {
    const passwords = await passwordService.getPasswords(filters);
    return { success: true, passwords };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 清除所有密码
ipcMain.handle('password:clearAll', async () => {
  if (!passwordService) {
    return { success: false, error: '未登录' };
  }
  
  try {
    await dbService.clearAllPasswords();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 重置主密码（忘记密码时使用）
ipcMain.handle('auth:resetPassword', async (event, newPassword: string) => {
  try {
    const salt = cryptoService.generateSalt();
    const hashedPassword = cryptoService.hashMasterPassword(newPassword, salt);
    
    await dbService.resetMasterPassword(hashedPassword, salt);
    
    // 重置后初始化密码服务
    const key = cryptoService.deriveKey(newPassword, salt);
    passwordService = new PasswordService(dbService, key);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 解密密码
ipcMain.handle('password:decrypt', async (event, id: number) => {
  if (!passwordService) {
    return { success: false, error: '未登录' };
  }
  
  try {
    const password = await passwordService.decryptPassword(id);
    return { success: true, password };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 更新密码
ipcMain.handle('password:update', async (event, id: number, data: any) => {
  console.log('接收到更新密码请求:', { id, data });
  if (!passwordService) {
    return { success: false, error: '未登录' };
  }
  
  try {
    console.log('notes 字段:', data.notes, typeof data.notes);
    await passwordService.updatePassword(id, {
      softwareName: data.softwareName,
      username: data.username,
      password: data.password,
      url: data.url,
      notes: data.notes,
      category: data.category,
    });
    console.log('密码更新成功');
    return { success: true };
  } catch (error) {
    console.error('密码更新失败:', error);
    return { success: false, error: (error as Error).message };
  }
});

// 删除密码
ipcMain.handle('password:delete', async (event, id: number) => {
  if (!passwordService) {
    return { success: false, error: '未登录' };
  }
  
  try {
    await passwordService.deletePassword(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 生成随机密码
ipcMain.handle('password:generate', (event, options) => {
  return cryptoService.generateRandomPassword(options);
});

// 导出所有密码
ipcMain.handle('password:export', async () => {
  if (!passwordService) {
    return { success: false, error: '未登录' };
  }

  try {
    const passwords = await passwordService.exportAllPasswords();
    return { success: true, passwords };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// ===== 分类管理 =====

// 获取分类列表
ipcMain.handle('category:list', async () => {
  try {
    const categories = await dbService.getCategories();
    return { success: true, categories };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 添加分类
ipcMain.handle('category:add', async (event, name: string) => {
  try {
    await dbService.addCategory(name);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 删除分类
ipcMain.handle('category:delete', async (event, name: string) => {
  try {
    await dbService.deleteCategory(name);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 重命名分类
ipcMain.handle('category:rename', async (event, oldName: string, newName: string) => {
  try {
    await dbService.renameCategory(oldName, newName);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// ===== 修改主密码 =====

ipcMain.handle('auth:changePassword', async (event, oldPassword: string, newPassword: string) => {
  if (!passwordService) {
    return { success: false, error: '未登录' };
  }

  try {
    // 1. 验证旧密码
    const user = await dbService.getUser();
    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    const hashedOldPassword = cryptoService.hashMasterPassword(oldPassword, user.salt);
    if (hashedOldPassword !== user.master_password_hash) {
      return { success: false, error: '旧密码错误' };
    }

    // 2. 导出所有密码（使用旧密钥解密）
    const passwords = await passwordService.exportAllPasswords();

    // 3. 生成新密钥
    const newSalt = cryptoService.generateSalt();
    const newHashedPassword = cryptoService.hashMasterPassword(newPassword, newSalt);
    const newKey = cryptoService.deriveKey(newPassword, newSalt);

    // 4. 更新用户主密码
    await dbService.updateUserPassword(newHashedPassword, newSalt);

    // 5. 重新加密所有密码
    const newPasswordService = new PasswordService(dbService, newKey);
    for (const pwd of passwords) {
      await newPasswordService.updatePassword(pwd.id, { password: pwd.password });
    }

    // 6. 更新当前密码服务
    passwordService = newPasswordService;

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// ===== Ollama AI 服务 =====

// 获取Ollama配置
ipcMain.handle('ollama:getConfig', () => {
  return { success: true, config: ollamaService.getConfig() };
});

// 更新Ollama配置
ipcMain.handle('ollama:updateConfig', (event, config) => {
  try {
    ollamaService.updateConfig(config);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// 检查Ollama可用性（支持传入临时配置进行测试）
ipcMain.handle('ollama:check', async (event, testConfig?: any) => {
  if (testConfig) {
    // 使用传入的临时配置进行测试
    const tempService = new OllamaService(dbService);
    // 临时覆盖配置进行检查
    const originalConfig = ollamaService.getConfig();
    if (testConfig.enabled !== undefined) {
      // 创建一个临时方法来检查
      return await tempService.checkAvailabilityWithConfig(testConfig);
    }
  }
  return await ollamaService.checkAvailability();
});

// AI解析密码
ipcMain.handle('ollama:parse', async (event, text: string) => {
  return await ollamaService.parsePasswords(text);
});

// ===== 文件导入 =====

// 检测文件编码
function detectEncoding(buffer: Buffer): string {
  // 检查 BOM
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'utf-8'; // UTF-8 with BOM
  }
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'utf-16le';
  }
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'utf-16be';
  }

  // 检查是否包含中文（GBK/GB2312）
  let hasGBK = false;
  let hasUTF8 = false;

  for (let i = 0; i < buffer.length - 1; i++) {
    const byte = buffer[i];
    const nextByte = buffer[i + 1];

    // GBK/GB2312 双字节字符 (0x81-0xFE, 0x40-0xFE)
    if (byte >= 0x81 && byte <= 0xFE && nextByte >= 0x40 && nextByte <= 0xFE) {
      hasGBK = true;
      i++;
    }

    // UTF-8 多字节字符
    if (byte >= 0xC0 && byte <= 0xFD) {
      hasUTF8 = true;
    }
  }

  // 如果包含GBK特征，优先使用GBK
  if (hasGBK && !hasUTF8) {
    return 'gbk';
  }

  // 默认使用 UTF-8
  return 'utf-8';
}

// 选择文件
ipcMain.handle('file:select', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: '所有文件', extensions: ['*'] },
      { name: '文本文件', extensions: ['txt', 'csv', 'json'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, cancelled: true };
  }

  try {
    const filePath = result.filePaths[0];
    const buffer = fs.readFileSync(filePath);
    const encoding = detectEncoding(buffer);

    let content: string;

    if (encoding === 'utf-8') {
      // 处理 BOM
      if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        content = buffer.slice(3).toString('utf-8');
      } else {
        content = buffer.toString('utf-8');
      }
    } else {
      // 使用 iconv-lite 转换编码
      content = iconv.decode(buffer, encoding);
    }

    return { success: true, content, filename: path.basename(filePath), encoding };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// ===== 应用配置 =====

// 获取配置
ipcMain.handle('config:get', () => {
  return { success: true, config: dbService.getConfig() };
});

// 更新配置
ipcMain.handle('config:update', (event, config) => {
  try {
    dbService.updateConfig(config);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// ===== 显示分类配置 =====

// 获取要显示的分类列表
ipcMain.handle('category:getDisplay', async () => {
  try {
    // 注意：getDisplayCategories 和 getCategories 都是异步函数，需要用 await
    const categories = await dbService.getDisplayCategories();
    const allCategories = await dbService.getCategories();
    const config = dbService.getConfig();
    
    // 只提取可序列化的数据
    const displayConfig = {
      enabled: Boolean(config.displayCategories?.enabled ?? true),
      categories: config.displayCategories?.categories || categories,
      maxDisplayCount: Number(config.displayCategories?.maxDisplayCount || 4)
    };
    
    const result = { 
      success: true, 
      categories,
      allCategories,
      displayConfig
    };
    
    console.log('getDisplayCategories result:', result);
    return result;
  } catch (error) {
    console.error('获取显示分类失败:', error);
    return { success: false, error: String(error) };
  }
});

// 更新显示的分类配置
ipcMain.handle('category:updateDisplay', (event, categories: string[]) => {
  try {
    dbService.updateDisplayCategories(categories);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});
