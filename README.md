# 🚀 VibeCoding Project Gallery

**强大的项目管理和启动工具** - 一站式项目管理解决方案，支持多种开发工具和环境配置。

![Version](https://img.shields.io/github/v/release/your-username/VibeCodingProjectGallery)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 主要特性

- 🎯 **项目管理**: 可视化管理所有项目，支持分组和标签
- 🚀 **一键启动**: 配置开发工具和环境，一键启动项目
- 🌐 **Web + 桌面**: 支持Web版本和跨平台桌面应用
- 🎨 **现代界面**: 响应式设计，流畅动画，支持深色/浅色主题
- 🔧 **灵活配置**: 支持多种CLI工具、环境变量和IDE配置
- 📁 **智能扫描**: 自动识别和导入项目
- 🌍 **国际化**: 支持中英文界面切换

## 🖼️ 截图预览

<!-- 你可以在这里添加应用截图 -->

## 📥 下载安装

### 方式一：下载发布版本（推荐）

访问 [Releases 页面](https://github.com/your-username/VibeCodingProjectGallery/releases) 下载对应平台的安装包：

- **Windows**: 下载 `.exe` 文件
- **macOS**: 下载 `.dmg` 文件  
- **Linux**: 下载 `.AppImage` 文件

### 方式二：从源码构建

```bash
# 克隆仓库
git clone https://github.com/your-username/VibeCodingProjectGallery.git
cd VibeCodingProjectGallery

# 安装所有依赖
npm run install-all

# 开发模式运行
npm run dev

# 构建桌面应用
npm run dist
```

## 🚀 快速开始

### Web 版本

1. **安装依赖**
   ```bash
   npm run install-all
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **访问应用**
   - 前端: http://localhost:3000
   - 后端API: http://localhost:5000

### 桌面版本

1. **开发模式**
   ```bash
   npm run electron-dev
   ```

2. **构建发布版**
   ```bash
   npm run dist
   ```

## 🛠️ 开发指南

### 项目结构

```
VibeCodingProjectGallery/
├── frontend/              # React 前端应用
│   ├── src/
│   │   ├── components/   # React 组件
│   │   ├── services/     # API 服务
│   │   └── i18n/         # 国际化文件
│   └── build/            # 构建输出
├── backend/              # Node.js 后端
│   └── server.js         # Express 服务器
├── electron.js           # Electron 主进程
├── scripts/              # 构建和发布脚本
└── .github/workflows/    # GitHub Actions
```

### 环境配置

1. **创建环境变量文件**
   ```bash
   # 根目录
   cp .env.example .env
   
   # 前端目录
   cd frontend && cp .env.example .env
   ```

2. **配置数据库**
   ```bash
   # SQLite 数据库会自动创建
   # 位置: ./database.db
   ```

### 可用脚本

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器（前端+后端） |
| `npm run frontend` | 仅启动前端开发服务器 |
| `npm run backend` | 仅启动后端服务器 |
| `npm run build` | 构建前端应用 |
| `npm run electron-dev` | Electron 开发模式 |
| `npm run dist` | 构建桌面应用 |
| `npm run release` | 发布新版本 |

## 📦 构建和发布

### 本地构建

```bash
# 构建前端
npm run build

# 打包桌面应用（所有平台）
npm run dist

# 仅打包（不分发）
npm run pack
```

### 自动发布

项目配置了 GitHub Actions 自动化发布流程：

1. **创建新版本**
   ```bash
   # 自动升级版本并发布
   npm run release patch    # 1.0.0 -> 1.0.1
   npm run release minor    # 1.0.0 -> 1.1.0
   npm run release major    # 1.0.0 -> 2.0.0
   
   # 或指定具体版本
   npm run release 1.2.3
   ```

2. **自动构建**: 推送标签后，GitHub Actions 会自动：
   - 在多个平台构建应用
   - 创建 GitHub Release
   - 上传构建产物

### 发布流程

1. 确保所有更改已提交
2. 运行 `npm run release <version-type>`
3. 脚本会自动：
   - 更新版本号
   - 创建提交和标签
   - 推送到 GitHub
   - 触发自动构建和发布

## 🔧 配置说明

### 支持的工具

- **CLI工具**: Claude Code, Windsurf, Cursor, VS Code
- **环境变量**: 支持自定义环境变量配置
- **IDE集成**: 支持各种编辑器和IDE

### 数据存储

- **本地模式**: 数据存储在 SQLite 数据库
- **云同步**: 支持配置云端同步（可选）

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 使用 ESLint 和 Prettier 进行代码格式化
- 提交信息遵循 [Conventional Commits](https://conventionalcommits.org/)
- 测试覆盖新功能

## 🐛 问题反馈

如果遇到问题或有功能建议：

1. 查看 [Issues](https://github.com/your-username/VibeCodingProjectGallery/issues) 是否已有相关讨论
2. 创建新的 Issue，详细描述问题或建议
3. 提供必要的环境信息和重现步骤

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面框架
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [Ant Design](https://ant.design/) - 企业级UI设计语言
- [Express](https://expressjs.com/) - 后端服务框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库

---

<div align="center">
  <strong>如果这个项目对你有帮助，请给它一个 ⭐！</strong>
</div>