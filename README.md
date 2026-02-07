# 密码管家 (Password Manager)

一个安全、开源的本地密码管理工具，使用 Electron + React + TypeScript 构建。所有数据本地存储，无需网络连接，确保您的密码安全。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.txt)
[![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)

## ✨ 功能特性

### 🔐 核心安全功能
- **主密码保护** - 使用 PBKDF2 (100,000 轮迭代) 哈希保护主密码
- **AES-256-GCM 加密** - 所有密码使用军用级加密标准存储
- **密钥派生** - 加密密钥从主密码动态派生，从不存储在磁盘上
- **本地存储** - 所有数据保存在本地，无需网络连接

### 🛡️ 安全增强功能
- **自动锁定** - 无操作一段时间后自动锁定应用（可配置）
- **剪贴板自动清除** - 复制密码后自动清除剪贴板（可配置）
- **安全复制** - 通过 IPC 安全通道复制密码，防止剪贴板监控
- **忘记密码重置** - 支持重置密码（将清除所有数据）

### 📝 密码管理
- **添加密码** - 记录软件名称、用户名、密码、网址、备注
- **编辑密码** - 随时修改密码信息
- **删除密码** - 删除单条密码记录
- **全部清除** - 一键清除所有密码（需设置中启用）
- **查看密码** - 点击眼睛图标显示/隐藏密码
- **复制密码** - 一键复制到剪贴板（带自动清除）
- **搜索密码** - 支持按名称、用户名、网址搜索

### 📂 分类管理
- **自定义分类** - 支持添加、删除、重命名分类
- **智能分类** - 默认分类：社交、工作、银行、邮箱、购物、其他
- **分类显示设置** - 可选择侧边栏显示哪些分类
- **分类筛选** - 按分类查看密码

### 🤖 AI 智能导入
- **自动识别** - 集成 Ollama 本地 AI，自动识别文件中的密码信息
- **智能分类** - AI 自动根据软件类型分类
- **URL 推断** - 自动补全网站地址
- **多格式支持** - 支持 CSV、JSON、TXT、浏览器导出文件等

### 💾 备份与导出
- **JSON 导出** - 导出加密格式备份文件
- **CSV 导出** - 导出纯文本 CSV 文件（用于迁移）
- **本地备份** - 数据自动保存在应用数据目录

### ⚙️ 设置功能

#### Ollama AI 配置
- 启用/禁用 AI 功能
- 配置服务地址（默认: http://localhost:11434）
- 选择 AI 模型（支持 llama3.2、qwen2.5 等）
- 连接测试功能

#### 安全设置
- **自动锁定** - 可设置 1-60 分钟无操作后自动锁定
- **剪贴板清除** - 可设置 5-300 秒后自动清除剪贴板

#### 显示设置
- **分类显示** - 自定义侧边栏显示的分类
- **分类数量** - 限制显示的分类数量

#### 危险操作
- **启用"全部清除"** - 在侧边栏显示一键清除所有密码按钮
- **清除确认** - 需要输入主密码确认，防止误操作

### 🔑 主密码管理
- **修改主密码** - 随时更改主密码（需要重新登录）
- **忘记密码** - 支持重置主密码（将清除所有数据）
- **密码强度** - 建议使用 12 位以上强密码

## 🚀 快速开始

### 方式一：安装包（推荐）

1. 下载最新版本的安装程序
   - `密码管家 Setup 1.0.0.exe` - 安装版（推荐）
   - `密码管家-Portable-1.0.0.exe` - 便携版

2. 运行安装程序，按向导完成安装

3. 从开始菜单或桌面快捷方式启动

### 方式二：源码运行

#### 环境要求
- Node.js 18+
- npm 9+ 或 yarn 1.22+

#### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/lihammer/password-manager.git
cd password-manager

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### 首次使用

1. **设置主密码** - 首次打开需要设置主密码（建议 12 位以上）
2. **解锁应用** - 之后每次打开需要输入主密码解锁
3. **添加密码** - 点击右上角"添加密码"按钮
4. **查看密码** - 点击眼睛图标查看，点击复制按钮复制
5. **分类管理** - 点击左侧"管理分类"自定义分类

### AI 智能导入配置

#### 1. 安装 Ollama
```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# 访问 https://ollama.com 下载安装程序
```

#### 2. 下载 AI 模型
```bash
# 推荐 llama3.2（轻量快速）
ollama pull llama3.2

# 或 qwen2.5（中文更好）
ollama pull qwen2.5
```

#### 3. 启动 Ollama 服务
```bash
ollama serve
```

#### 4. 应用内配置
- 打开应用 → 设置 → Ollama AI
- 启用 Ollama AI
- 配置服务地址（默认: http://localhost:11434）
- 选择模型名称（如: llama3.2）
- 点击"测试连接"验证

#### 5. 使用智能导入
- 点击左侧"AI智能导入"按钮
- 选择要导入的文件（CSV、JSON、TXT、浏览器导出等）
- AI 自动解析并识别密码信息
- 审核识别结果，确认导入

## 🛠️ 开发指南

### 可用命令

```bash
# 开发模式（热更新）
npm run dev

# 构建生产版本（含安装包）
npm run build

# 代码检查
npm run lint

# 类型检查
npm run typecheck

# 预览生产构建
npm run preview
```

### 项目结构

```
password-manager/
├── build/                  # 构建资源
│   └── uninstaller.nsh     # 自定义卸载脚本
├── electron/               # Electron 主进程
│   ├── main.ts            # 主进程入口
│   ├── preload.ts         # 预加载脚本（IPC 通信）
│   └── services/          # 服务层
│       ├── database.ts    # 数据库服务
│       ├── crypto.ts      # 加密服务
│       ├── password.ts    # 密码管理服务
│       └── ollama.ts      # Ollama AI 服务
├── src/                   # React 前端
│   ├── components/        # UI 组件
│   ├── pages/            # 页面
│   ├── stores/           # 状态管理
│   ├── types/            # TypeScript 类型定义
│   └── lib/              # 工具函数
├── dist/                 # 前端构建输出
├── dist-electron/        # 主进程构建输出
├── release/              # 最终安装包输出
└── package.json          # 项目配置
```

### 技术栈

- **桌面框架**: [Electron 28](https://electronjs.org/)
- **前端框架**: [React 18](https://reactjs.org/) + [TypeScript 5](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **构建工具**: [Vite 5](https://vitejs.dev/)
- **图标**: [Lucide React](https://lucide.dev/)
- **数据存储**: [electron-store](https://github.com/sindresorhus/electron-store)
- **打包工具**: [electron-builder](https://www.electron.build/)

## 🔒 安全架构

### 密码加密流程

```
用户主密码
    ↓
PBKDF2 (100,000 轮迭代 + 随机 Salt)
    ↓
主密码哈希（存储到数据库用于验证）
    ↓
派生加密密钥
    ↓
AES-256-GCM 加密（随机 IV）
    ↓
加密后的密码（存储到数据库）
```

### 安全特性说明

| 特性 | 实现方式 | 安全性 |
|------|----------|--------|
| 主密码存储 | PBKDF2-SHA256, 100,000 轮迭代 | 防范暴力破解 |
| 密码加密 | AES-256-GCM | 军用级加密标准 |
| 密钥管理 | 内存派生，不存储磁盘 | 密钥泄露防护 |
| 数据存储 | 本地 JSON | 无网络传输风险 |
| 剪贴板安全 | IPC 通道 + 自动清除 | 防范剪贴板监控 |

## 📦 打包与分发

### 构建安装包

```bash
# 构建所有版本（安装版 + 便携版）
npm run build

# 输出文件
# release/密码管家 Setup 1.0.0.exe    - 安装程序
# release/密码管家-Portable-1.0.0.exe - 便携版
```

## 🔧 常见问题

### Q: 忘记主密码怎么办？
A: 由于没有密码找回机制，忘记密码意味着无法访问已保存的密码。您可以在登录页面点击"忘记密码"重置，但这会清除所有数据。

### Q: 如何备份密码？
A: 点击左侧"导出备份"按钮，可以导出 JSON（加密格式）或 CSV（明文格式）文件。

### Q: 数据存储在哪里？
A: 
- **安装版**: `%APPDATA%/password-manager/`
- **便携版**: 程序所在目录

### Q: 如何完全卸载？
A: 运行卸载程序时选择"删除所有密码数据"，将清除程序文件和应用数据。

### Q: AI 导入需要联网吗？
A: 不需要。Ollama 在本地运行，所有数据都在本地处理。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 [MIT](LICENSE.txt) 许可证开源。

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [Ollama](https://ollama.com/) - 本地 AI 模型运行环境
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架

---

**注意**: 请妥善保管您的主密码，密码管家无法找回或重置您的主密码而不清除所有数据。

Made with ❤️ by [lihammer](https://github.com/lihammer)
