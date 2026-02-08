import Store from 'electron-store';
import { app } from 'electron';
import path from 'path';

interface User {
  id: number;
  master_password_hash: string;
  salt: string;
  created_at: string;
  updated_at: string;
}

interface PasswordRecord {
  id: number;
  software_name: string;
  username?: string;
  encrypted_password: string;
  url?: string;
  notes?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface AppConfig {
  ollama: {
    enabled: boolean;
    host: string;
    model: string;
    timeout: number;
  };
  autoLock: {
    enabled: boolean;
    timeout: number; // 分钟
  };
  clipboard: {
    autoClear: boolean;
    timeout: number; // 秒
  };
  displayCategories: {
    enabled: boolean;
    categories: string[]; // 要显示的分类列表
    maxDisplayCount: number; // 最大显示数量，默认4个
  };
  dangerousOperations: {
    enableClearAll: boolean; // 是否启用全部清除按钮
  };
}

interface StoreSchema {
  users: User[];
  passwords: PasswordRecord[];
  categories: string[];
  config: AppConfig;
}

export class DatabaseService {
  private store: Store<StoreSchema>;
  private currentId: number = 1;
  private passwordId: number = 1;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'password-manager-data',
      cwd: '密码管家',
      defaults: {
        users: [],
        passwords: [],
        categories: ['社交', '工作', '银行', '邮箱', '购物', '其他'],
        config: {
          ollama: {
            enabled: false,
            host: 'http://localhost:11434',
            model: 'llama3.2',
            timeout: 30000,
          },
          autoLock: {
            enabled: true,
            timeout: 5,
          },
          clipboard: {
            autoClear: true,
            timeout: 30,
          },
          displayCategories: {
            enabled: true,
            categories: ['社交', '工作', '银行', '邮箱'], // 默认显示4个常用分类
            maxDisplayCount: 4,
          },
          dangerousOperations: {
            enableClearAll: false, // 默认不启用全部清除，需要在设置中手动开启
          },
        },
      },
    });
    
    // 恢复ID计数器
    const passwords = this.store.get('passwords');
    if (passwords.length > 0) {
      this.passwordId = Math.max(...passwords.map(p => p.id)) + 1;
    }
    const users = this.store.get('users');
    if (users.length > 0) {
      this.currentId = Math.max(...users.map(u => u.id)) + 1;
    }
  }

  async init() {
    // 检查并迁移配置
    const config = this.store.get('config');
    let needsUpdate = false;
    
    // 如果缺少 displayCategories 配置，添加默认值
    if (!config.displayCategories) {
      config.displayCategories = {
        enabled: true,
        categories: this.store.get('categories').slice(0, 4),
        maxDisplayCount: 4,
      };
      needsUpdate = true;
      console.log('初始化 displayCategories 配置');
    }
    
    // 如果缺少 ollama 配置，添加默认值
    if (!config.ollama) {
      config.ollama = {
        enabled: false,
        host: 'http://localhost:11434',
        model: 'llama3.2',
        timeout: 30000,
      };
      needsUpdate = true;
    }
    
    // 如果缺少 autoLock 配置，添加默认值
    if (!config.autoLock) {
      config.autoLock = {
        enabled: true,
        timeout: 5,
      };
      needsUpdate = true;
    }
    
    // 如果缺少 clipboard 配置，添加默认值
    if (!config.clipboard) {
      config.clipboard = {
        autoClear: true,
        timeout: 30,
      };
      needsUpdate = true;
    }
    
    // 如果缺少 dangerousOperations 配置，添加默认值
    if (!config.dangerousOperations) {
      config.dangerousOperations = {
        enableClearAll: false,
      };
      needsUpdate = true;
      console.log('初始化 dangerousOperations 配置');
    }
    
    // 保存更新后的配置
    if (needsUpdate) {
      this.store.set('config', config);
      console.log('配置已更新');
    }
    
    console.log('数据库已就绪');
  }

  hasUser(): boolean {
    return this.store.get('users').length > 0;
  }

  async createUser(hashedPassword: string, salt: string): Promise<number> {
    const user: User = {
      id: this.currentId++,
      master_password_hash: hashedPassword,
      salt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const users = this.store.get('users');
    users.push(user);
    this.store.set('users', users);
    
    return user.id;
  }

  async getUser(): Promise<User | null> {
    const users = this.store.get('users');
    return users.length > 0 ? users[0] : null;
  }

  async updateUserPassword(hashedPassword: string, salt: string): Promise<void> {
    const users = this.store.get('users');
    if (users.length > 0) {
      users[0].master_password_hash = hashedPassword;
      users[0].salt = salt;
      users[0].updated_at = new Date().toISOString();
      this.store.set('users', users);
    }
  }

  // 密码相关操作
  async addPassword(data: {
    softwareName: string;
    username?: string;
    encryptedPassword: string;
    url?: string;
    notes?: string;
    category: string;
  }): Promise<number> {
    const password: PasswordRecord = {
      id: this.passwordId++,
      software_name: data.softwareName,
      username: data.username,
      encrypted_password: data.encryptedPassword,
      url: data.url,
      notes: data.notes,
      category: data.category || '未分类',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const passwords = this.store.get('passwords');
    passwords.push(password);
    this.store.set('passwords', passwords);
    
    return password.id;
  }

  async getPasswords(filters?: { search?: string; category?: string }): Promise<Omit<PasswordRecord, 'encrypted_password'>[]> {
    let passwords = this.store.get('passwords');
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      passwords = passwords.filter(p => 
        p.software_name.toLowerCase().includes(searchLower) ||
        (p.username && p.username.toLowerCase().includes(searchLower)) ||
        (p.url && p.url.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters?.category && filters.category !== '全部') {
      passwords = passwords.filter(p => p.category === filters.category);
    }
    
    // 按更新时间倒序
    passwords.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    // 移除加密密码字段
    return passwords.map(({ encrypted_password, ...rest }) => rest);
  }

  async getPasswordById(id: number): Promise<PasswordRecord | null> {
    const passwords = this.store.get('passwords');
    return passwords.find(p => p.id === id) || null;
  }

  async updatePassword(id: number, data: Partial<{
    softwareName: string;
    username: string;
    encryptedPassword: string;
    url: string;
    notes: string;
    category: string;
  }>): Promise<void> {
    const passwords = this.store.get('passwords');
    const index = passwords.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('密码记录不存在');
    }
    
    if (data.softwareName !== undefined) {
      passwords[index].software_name = data.softwareName;
    }
    if (data.username !== undefined) {
      passwords[index].username = data.username;
    }
    if (data.encryptedPassword !== undefined) {
      passwords[index].encrypted_password = data.encryptedPassword;
    }
    if (data.url !== undefined) {
      passwords[index].url = data.url;
    }
    if (data.notes !== undefined) {
      passwords[index].notes = data.notes;
    }
    if (data.category !== undefined && data.category !== '') {
      passwords[index].category = data.category;
    }
    
    passwords[index].updated_at = new Date().toISOString();
    this.store.set('passwords', passwords);
  }

  async deletePassword(id: number): Promise<void> {
    const passwords = this.store.get('passwords');
    const filtered = passwords.filter(p => p.id !== id);
    this.store.set('passwords', filtered);
  }

  async getCategories(): Promise<string[]> {
    // 返回纯数组的副本，避免 electron-store 的代理对象问题
    const categories = this.store.get('categories');
    return JSON.parse(JSON.stringify(categories));
  }

  // 获取所有密码（包含加密字段，用于导出）
  async getAllPasswords(): Promise<PasswordRecord[]> {
    const passwords = this.store.get('passwords');
    // 按更新时间倒序
    return passwords.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  // 清除所有密码
  async clearAllPasswords(): Promise<void> {
    this.store.set('passwords', []);
    // 重置密码ID计数器
    this.passwordId = 1;
  }

  // 重置主密码（忘记密码时使用）
  async resetMasterPassword(newHashedPassword: string, newSalt: string): Promise<void> {
    // 清空所有密码
    await this.clearAllPasswords();
    
    // 删除所有用户
    this.store.set('users', []);
    this.currentId = 1;
    
    // 创建新用户
    await this.createUser(newHashedPassword, newSalt);
    
    console.log('主密码已重置，所有数据已清空');
  }

  // 添加新分类
  async addCategory(name: string): Promise<void> {
    const categories = this.store.get('categories');
    if (!categories.includes(name)) {
      categories.push(name);
      this.store.set('categories', categories);
    }
  }

  // 删除分类
  async deleteCategory(name: string): Promise<void> {
    const categories = this.store.get('categories');
    const filtered = categories.filter(c => c !== name);
    this.store.set('categories', filtered);
    
    // 将该分类下的密码移动到"未分类"
    const passwords = this.store.get('passwords');
    passwords.forEach(p => {
      if (p.category === name) {
        p.category = '未分类';
        p.updated_at = new Date().toISOString();
      }
    });
    this.store.set('passwords', passwords);
  }

  // 重命名分类
  async renameCategory(oldName: string, newName: string): Promise<void> {
    const categories = this.store.get('categories');
    const index = categories.indexOf(oldName);
    if (index !== -1) {
      categories[index] = newName;
      this.store.set('categories', categories);
      
      // 更新所有使用该分类的密码
      const passwords = this.store.get('passwords');
      passwords.forEach(p => {
        if (p.category === oldName) {
          p.category = newName;
          p.updated_at = new Date().toISOString();
        }
      });
      this.store.set('passwords', passwords);
    }
  }

  // 获取配置
  getConfig(): AppConfig {
    const config = this.store.get('config');
    // 返回纯数据对象的副本，避免引用问题
    return JSON.parse(JSON.stringify(config));
  }

  // 更新配置
  updateConfig(config: Partial<AppConfig>): void {
    const currentConfig = this.store.get('config');
    this.store.set('config', { ...currentConfig, ...config });
  }

  // 获取要显示的分类列表
  getDisplayCategories(): string[] {
    const config = this.store.get('config');
    const allCategories = [...this.store.get('categories')];
    
    // 如果配置中没有 displayCategories，初始化默认值
    if (!config.displayCategories) {
      config.displayCategories = {
        enabled: true,
        categories: allCategories.slice(0, 4),
        maxDisplayCount: 4,
      };
      this.store.set('config', config);
    }
    
    if (!config.displayCategories?.enabled) {
      // 如果功能未启用，返回所有分类
      return JSON.parse(JSON.stringify(allCategories));
    }
    
    // 获取配置中指定的显示分类
    const displayCategories = [...(config.displayCategories.categories || [])];
    
    // 过滤掉已不存在的分类，并限制数量
    const validCategories = displayCategories.filter(cat => allCategories.includes(cat));
    const maxCount = config.displayCategories.maxDisplayCount || 4;
    
    return JSON.parse(JSON.stringify(validCategories.slice(0, maxCount)));
  }

  // 更新显示的分类配置
  updateDisplayCategories(categories: string[]): void {
    const config = this.store.get('config');
    // 如果配置中没有 displayCategories，先初始化
    if (!config.displayCategories) {
      config.displayCategories = {
        enabled: true,
        categories: categories,
        maxDisplayCount: 4,
      };
    } else {
      config.displayCategories.categories = categories;
    }
    this.store.set('config', config);
  }
}
