# 🚀 使用指南 - VibeCoding Project Gallery

## 📦 发布新版本

### 快速发布

使用自动化脚本发布新版本：

```bash
# 补丁版本 (1.0.0 -> 1.0.1)
npm run release patch

# 次要版本 (1.0.0 -> 1.1.0)
npm run release minor

# 主要版本 (1.0.0 -> 2.0.0)
npm run release major

# 指定具体版本
npm run release 1.2.3
```

### 发布流程说明

1. **版本检查**: 脚本会检查当前版本并计算新版本号
2. **工作区检查**: 确保没有未提交的更改
3. **构建测试**: 运行测试构建确保代码正常工作
4. **版本更新**: 自动更新 `package.json` 文件中的版本号
5. **提交更改**: 创建版本提交和标签
6. **推送代码**: 推送到 GitHub 触发自动构建

### GitHub Actions 自动化

推送版本标签后，GitHub Actions 会自动：

1. **多平台构建**:
   - Windows: 生成 `.exe` 安装包
   - macOS: 生成 `.dmg` 安装包  
   - Linux: 生成 `.AppImage` 安装包

2. **创建 Release**:
   - 自动创建 GitHub Release
   - 上传构建产物
   - 生成更新日志

3. **构建状态**:
   - 可在 Actions 页面查看构建进度
   - 构建完成后自动发布到 Releases

## 🛠️ 手动构建

如果需要手动构建应用：

### 构建前端
```bash
cd frontend
npm run build
```

### 构建桌面应用

```bash
# 构建当前平台
npm run dist

# 仅打包（不分发）
npm run pack

# 构建特定平台
npx electron-builder --win
npx electron-builder --mac  
npx electron-builder --linux
```

## 🔧 开发模式

### Web 开发模式
```bash
# 启动前端和后端
npm run dev

# 仅启动前端 (需要单独启动后端)
npm run frontend

# 仅启动后端
npm run backend
```

### Electron 开发模式
```bash
# 启动 Electron 开发模式
npm run electron-dev

# 或分别启动
npm run dev        # 终端1
npm run electron   # 终端2（等前端启动后）
```

## 📋 版本管理

### 检查版本
```bash
npm run version-check
```

### 版本同步
脚本会自动同步以下文件的版本号：
- `/package.json`
- `/frontend/package.json`

## 🚀 部署建议

### 开发环境
1. 使用 `npm run dev` 进行开发
2. 使用 `npm run electron-dev` 测试桌面版本

### 测试环境  
1. 使用 `npm run pack` 测试打包
2. 验证所有功能正常工作

### 生产环境
1. 使用 `npm run release` 发布正式版本
2. GitHub Actions 自动构建和发布

## ⚠️ 注意事项

1. **权限要求**: Windows 下构建可能需要管理员权限
2. **网络要求**: 首次构建需要下载 Electron 二进制文件
3. **磁盘空间**: 构建过程需要足够的临时存储空间
4. **Node.js 版本**: 建议使用 Node.js 18 或更高版本

## 🐛 故障排除

### SQLite3 构建问题
如果遇到 SQLite3 编译错误：

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install

# 重建 native 模块
npm run postinstall
```

### Electron 下载问题
如果 Electron 下载失败：

```bash
# 设置镜像源
npm config set electron_mirror https://cdn.npm.taobao.org/dist/electron/
```

### 构建缓存问题
清理构建缓存：

```bash
# 清理 dist 目录
rm -rf dist

# 清理 Electron 缓存
npx electron-builder install-app-deps --force
```
