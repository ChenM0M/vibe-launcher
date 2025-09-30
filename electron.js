const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// 判断是否为开发环境（不依赖electron-is-dev）
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let backendProcess;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#f5f5f5',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'frontend/public/favicon.ico'),
    title: 'VibeCoding Project Gallery',
    show: false, // 先不显示，等加载完成后再显示
    autoHideMenuBar: true, // 自动隐藏菜单栏，更简洁
    titleBarStyle: 'default', // 使用系统默认标题栏
    frame: true // 保留标题栏和窗口控制按钮
  });

  // 在开发环境中加载开发服务器
  // 在生产环境中加载静态文件
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, 'frontend/build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // 窗口准备好后再显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      // 开发环境打开开发者工具
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 设置菜单
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click() {
            app.quit();
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '重新加载',
          accelerator: 'CmdOrCtrl+R',
          click() {
            mainWindow.reload();
          }
        },
        {
          label: '开发者工具',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click() {
            mainWindow.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: '实际大小',
          accelerator: 'CmdOrCtrl+0',
          click() {
            mainWindow.webContents.zoomLevel = 0;
          }
        },
        {
          label: '放大',
          accelerator: 'CmdOrCtrl+Plus',
          click() {
            mainWindow.webContents.zoomLevel += 0.5;
          }
        },
        {
          label: '缩小',
          accelerator: 'CmdOrCtrl+-',
          click() {
            mainWindow.webContents.zoomLevel -= 0.5;
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click() {
            require('electron').dialog.showMessageBox({
              type: 'info',
              title: '关于',
              message: 'VibeCoding Project Gallery',
              detail: '版本: 1.0.0\n强大的项目管理和启动工具'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startBackend() {
  if (isDev) {
    // 开发环境中，后端应该已经在运行
    console.log('开发模式：跳过后端启动');
    return;
  }

  const fs = require('fs');

  // 生产环境中启动后端服务器
  // 处理 electron-builder 的多种打包结构
  let backendPath;
  let workingDir;

  if (app.isPackaged) {
    // 尝试多个可能的路径，按优先级排序
    const possiblePaths = [
      // 方案1: app.asar.unpacked 结构（最常见）
      {
        backend: path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'server.js'),
        workDir: path.join(process.resourcesPath, 'app.asar.unpacked')
      },
      // 方案2: app 目录结构（asar完全禁用时）
      {
        backend: path.join(process.resourcesPath, 'app', 'backend', 'server.js'),
        workDir: path.join(process.resourcesPath, 'app')
      },
      // 方案3: 直接在 resources 下
      {
        backend: path.join(process.resourcesPath, 'backend', 'server.js'),
        workDir: process.resourcesPath
      }
    ];

    console.log('====== 路径诊断开始 ======');
    console.log('process.resourcesPath:', process.resourcesPath);

    // 尝试找到存在的路径
    for (const pathConfig of possiblePaths) {
      console.log('检查路径:', pathConfig.backend);
      try {
        if (fs.existsSync(pathConfig.backend)) {
          backendPath = pathConfig.backend;
          workingDir = pathConfig.workDir;
          console.log('✓ 找到后端文件:', backendPath);
          break;
        } else {
          console.log('✗ 路径不存在');
        }
      } catch (err) {
        console.log('✗ 检查失败:', err.message);
      }
    }

    if (!backendPath) {
      console.error('❌ 错误：无法找到后端文件！');
      console.error('已检查的所有路径：');
      possiblePaths.forEach(p => console.error('  -', p.backend));

      // 列出实际存在的目录结构
      try {
        console.log('\n实际 resources 目录内容：');
        const resourcesContent = fs.readdirSync(process.resourcesPath);
        resourcesContent.forEach(item => {
          const itemPath = path.join(process.resourcesPath, item);
          const isDir = fs.statSync(itemPath).isDirectory();
          console.log(`  ${isDir ? '📁' : '📄'} ${item}`);
        });
      } catch (err) {
        console.error('无法读取 resources 目录:', err.message);
      }

      return;
    }
  } else {
    // 开发模式路径
    backendPath = path.join(__dirname, 'backend', 'server.js');
    workingDir = __dirname;
  }

  const nodePath = path.join(workingDir, 'node_modules');
  const dbPath = path.join(app.getPath('userData'), 'database.db');

  console.log('\n====== 后端启动配置 ======');
  console.log('后端路径:', backendPath);
  console.log('工作目录:', workingDir);
  console.log('NODE_PATH:', nodePath);
  console.log('数据库路径:', dbPath);
  console.log('node_modules 存在:', fs.existsSync(nodePath));
  console.log('========================\n');

  backendProcess = spawn('node', [backendPath], {
    cwd: workingDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '5000',
      DATABASE_PATH: dbPath,
      NODE_PATH: nodePath
    },
    stdio: ['ignore', 'pipe', 'pipe'] // 捕获输出用于调试
  });

  backendProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`[Backend] ${output}`);
  });

  backendProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    console.error(`[Backend Error] ${output}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`[Backend] 进程退出，退出码: ${code}`);
    if (code !== 0) {
      console.error('[Backend] ❌ 后端异常退出！');
    }
  });

  backendProcess.on('error', (err) => {
    console.error('[Backend] ❌ 启动失败:', err.message);
    console.error('完整错误:', err);
  });

  // 添加启动成功检测
  setTimeout(() => {
    if (backendProcess && !backendProcess.killed) {
      console.log('[Backend] ✓ 后端进程运行中 (PID:', backendProcess.pid, ')');
    }
  }, 2000);
}

// 这个方法将在 Electron 初始化完成并准备创建浏览器窗口时调用
app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，
    // 通常会在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户使用 Cmd + Q 显式退出，
  // 否则应用程序及其菜单栏保持活动状态
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出时清理后端进程
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('activate', () => {
  // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，
  // 通常会在应用程序中重新创建一个窗口。
  if (mainWindow === null) {
    createWindow();
  }
});
