const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');

let mainWindow;
let backendProcess;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'frontend/public/favicon.ico'),
    title: 'VibeCoding Project Gallery',
    show: false // 先不显示，等加载完成后再显示
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
    return;
  }

  // 生产环境中启动后端服务器
  const backendPath = path.join(__dirname, 'backend/server.js');
  backendProcess = spawn('node', [backendPath], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '5000'
    }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend error: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
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
