const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('==========================================');
console.log('密码管家 - 数据清空工具');
console.log('==========================================\n');

// 获取数据目录路径
const getDataDir = () => {
  const homeDir = os.homedir();
  
  switch (process.platform) {
    case 'win32':
      return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'password-manager');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', 'password-manager');
    case 'linux':
      return path.join(process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config'), 'password-manager');
    default:
      return path.join(homeDir, '.password-manager');
  }
};

const dataDir = getDataDir();

console.log('数据目录:', dataDir);
console.log('操作系统:', process.platform);
console.log('');

if (fs.existsSync(dataDir)) {
  console.log('[1/2] 正在删除应用数据...');
  
  try {
    // 读取目录内容
    const files = fs.readdirSync(dataDir);
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
      console.log(`  已删除: ${file}`);
    }
    
    console.log('✓ 数据已清空\n');
  } catch (error) {
    console.error('✗ 删除失败:', error.message);
    process.exit(1);
  }
} else {
  console.log('[1/2] 数据目录不存在，创建新目录...');
}

console.log('[2/2] 确保数据目录存在...');
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  console.log('✓ 数据目录已就绪\n');
} catch (error) {
  console.error('✗ 创建目录失败:', error.message);
  process.exit(1);
}

console.log('==========================================');
console.log('✓ 数据库清空完成！');
console.log('==========================================\n');
console.log('现在您可以重新启动应用，');
console.log('它将恢复到第一次使用的初始状态。\n');
