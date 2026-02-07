# 密码管家

一个安全的本地密码管理工具，使用 Electron + React + TypeScript 构建。

## 功能特性

- 🔐 **主密码保护** - 使用 PBKDF2 哈希保护主密码
- 🔒 **AES-256-GCM 加密** - 所有密码均使用军用级加密
- 📱 **跨平台** - 支持 Windows、macOS 和 Linux
- 🔍 **快速搜索** - 支持按名称、分类搜索
- 📂 **分类管理** - 支持自定义分类（添加、删除、重命名）
- 🤖 **AI智能导入** - 集成 Ollama 本地AI，自动识别和分类导入的密码
- 🎲 **密码生成器** - 一键生成强密码
- 📋 **剪贴板复制** - 快速复制密码到剪贴板
- 💾 **本地存储** - 数据完全存储在本地，无需网络
- 📤 **导出备份** - 支持导出 JSON/CSV 格式备份文件
- ⚙️ **应用设置** - 可配置 Ollama AI、自动锁定、剪贴板清除等

## 技术栈

- **桌面框架**: Electron 28
- **前端**: React 18 + TypeScript 5
- **样式**: Tailwind CSS 3.4
- **状态管理**: Zustand
- **数据库**: SQLite (better-sqlite3)
- **构建工具**: Vite 5

## 安全特性

- ✅ 主密码使用 PBKDF2 (100,000 轮迭代) 哈希
- ✅ 所有密码使用 AES-256-GCM 加密存储
- ✅ 加密密钥从主密码派生，不存储在磁盘上
- ✅ 数据库文件存储在用户数据目录，隔离保护
- ✅ 支持密码强度检测
- ✅ 一键显示/隐藏密码

## 快速开始

### 启动应用

```bash
# 进入项目目录
cd password-manager

# 安装依赖（首次运行只需执行一次）
npm install

# 启动应用
npm run dev
```

### 首次使用

1. **设置主密码** - 首次打开需要设置主密码（建议12位以上，包含大小写字母、数字和符号）
2. **解锁应用** - 之后每次打开需要输入主密码解锁
3. **添加密码** - 点击右上角"添加密码"按钮开始记录
4. **查看密码** - 点击眼睛图标查看，点击复制按钮复制到剪贴板

### 开发命令

```bash
# 开发模式（热更新）
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 类型检查
npm run typecheck
```

## AI 智能导入（Ollama 集成）

本应用支持接入本地 Ollama AI 模型，实现智能密码导入：

### 功能特点
- 🤖 **自动识别** - AI 自动识别文件中的用户名、密码、网址等信息
- 🏷️ **智能分类** - 根据软件类型自动分类（社交、银行、邮箱等）
- 🔗 **URL 推断** - 自动推断和补全网站地址
- 📁 **多格式支持** - 支持 CSV、JSON、TXT 等任意文本格式

### 配置步骤

1. **安装 Ollama**
   ```bash
   # 访问 https://ollama.com 下载安装
   # 或在命令行安装
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **下载 AI 模型**
   ```bash
   # 推荐使用 llama3.2 或 qwen2.5
   ollama pull llama3.2
   # 或
   ollama pull qwen2.5
   ```

3. **启动 Ollama 服务**
   ```bash
   ollama serve
   ```

4. **在应用中配置**
   - 打开应用 → 设置 → Ollama AI
   - 启用 Ollama AI
   - 配置服务地址（默认: http://localhost:11434）
   - 选择模型名称（如: llama3.2）
   - 点击"测试连接"验证

### 使用智能导入
1. 点击左侧"AI智能导入"按钮
2. 选择要导入的文件（支持浏览器导出、Excel、文本等）
3. AI 自动解析并识别密码信息
4. 审核识别结果，确认导入

## 目录结构

```
password-manager/
├── electron/              # Electron 主进程
│   ├── main.ts           # 主进程入口
│   ├── preload.ts        # 预加载脚本
│   └── services/         # 服务层
│       ├── database.ts   # 数据库服务
│       ├── crypto.ts     # 加密服务
│       ├── password.ts   # 密码管理服务
│       └── ollama.ts     # Ollama AI 服务
├── src/                  # React 前端
│   ├── components/       # 组件
│   ├── pages/            # 页面
│   ├── stores/           # 状态管理
│   ├── types/            # TypeScript 类型
│   └── lib/              # 工具函数
└── package.json
```

## 许可证

MIT
