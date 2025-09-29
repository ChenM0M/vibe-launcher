# VibeCoding Project Gallery 安装配置指南

## 系统要求

- Node.js 14.0 或更高版本
- Windows 操作系统（推荐）
- Git Bash（用于VibeCoding项目）

## 详细安装步骤

### 1. 环境准备

确保您的系统已安装：

- [Node.js](https://nodejs.org/) (推荐LTS版本)
- [Git](https://git-scm.com/) (包含Git Bash)

### 2. 下载项目

```bash
git clone <repository-url>
cd VibeCodingProjectGallery
```

### 3. 环境配置

1. 复制环境配置文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置以下关键参数：

```env
# 服务器配置
PORT=5000
NODE_ENV=production

# 数据库配置
DATABASE_PATH=./database.db

# CORS配置
CORS_ORIGIN=http://localhost:3000

# 默认环境变量（用于新项目）
DEFAULT_ANTHROPIC_BASE_URL=https://api.anthropic.com
DEFAULT_ANTHROPIC_AUTH_TOKEN=your_api_key_here
DEFAULT_CLAUDE_CODE_GIT_BASH_PATH=C:\Program Files\Git\bin\bash.exe
```

**重要提示：**
- 请将 `your_api_key_here` 替换为您的实际Claude API密钥
- 根据您的Git安装路径调整 `DEFAULT_CLAUDE_CODE_GIT_BASH_PATH`

### 4. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

或者使用便捷命令：
```bash
npm run install-all
```

### 5. 启动应用

#### 生产模式（推荐）
```bash
# 方式1：使用批处理文件（Windows）
start.bat

# 方式2：使用npm命令
npm run build
npm start
```

#### 开发模式
```bash
npm run dev
```

## 配置说明

### API密钥获取

1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 创建账户并获取API密钥
3. 将密钥填入 `.env` 文件的 `DEFAULT_ANTHROPIC_AUTH_TOKEN` 字段

### Git Bash路径配置

常见的Git Bash路径：
- `C:\Program Files\Git\bin\bash.exe`
- `C:\Program Files (x86)\Git\bin\bash.exe`
- `C:\Users\{用户名}\AppData\Local\Programs\Git\bin\bash.exe`

### 端口配置

如果默认端口5000被占用，可以修改 `.env` 文件中的 `PORT` 值：

```env
PORT=3001
```

## 验证安装

1. 启动应用后，浏览器应自动打开 `http://localhost:5000`
2. 界面应显示项目管理页面
3. 尝试创建一个测试项目验证功能

## 常见问题

### Q: 启动时提示端口被占用
A: 修改 `.env` 文件中的 `PORT` 值，或关闭占用端口的程序

### Q: API调用失败
A: 检查 `.env` 文件中的API密钥是否正确，网络连接是否正常

### Q: Git Bash无法找到
A: 确认Git已正确安装，并更新 `.env` 文件中的路径

### Q: 前端页面无法加载
A: 确保已运行 `npm run build` 构建前端，检查控制台错误信息

## 安全建议

1. **不要提交 `.env` 文件**到版本控制系统
2. **定期更新依赖**以修复安全漏洞
3. **使用HTTPS**（生产环境）
4. **限制API密钥权限**

## 升级指南

### 更新代码
```bash
git pull origin main
npm install
cd frontend && npm install && cd ..
npm run build
```

### 数据库迁移
数据库会自动创建和更新，无需手动操作。

## 技术支持

如遇到问题，请检查：
1. Node.js版本是否符合要求
2. 环境变量配置是否正确
3. 网络连接是否正常
4. 控制台错误信息

更多帮助请参考项目README.md文件。
