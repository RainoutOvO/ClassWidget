// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');



const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 180,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },

    frame: false, //取消window自带的关闭最小化等
    resizable: false //禁止改变主窗口尺寸

  })
  // 开机是否自启动
  const isDevelopment = process.env.NODE_ENV == "development";
  //注意：非开发环境
  if (!isDevelopment) {
    if (process.platform === "darwin") {
      app.setLoginItemSettings({
        openAtLogin: true,//是否开机启动
        openAsHidden: false//是否隐藏主窗体，保留托盘位置
      });
    } else {
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: false,
      });
    }
  }

  // 加载 index.html
  mainWindow.loadFile('index.html')

  // 打开开发工具
  // mainWindow.webContents.openDevTools()
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // 在 macOS 系统内, 如果没有已开启的应用窗口
    // 点击托盘图标时通常会重新创建一个新窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此, 通常
// 对应用程序和它们的菜单栏来说应该时刻保持激活状态, 
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 在当前文件中你可以引入所有的主进程代码
// 也可以拆分成几个文件，然后用 require 导入。

// 获取用户的应用程序数据目录
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'cwConfig.json');
console.error (configPath);
// 读取配置文件
ipcMain.handle('read-config', async () => {
  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading config file: ${error.message}`);
    return { status: 'error', message: error.message };
  }
});

// 写入配置文件
ipcMain.handle('write-config', async (event, newConfig) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    return { status: 'success' };
  } catch (error) {
    console.error(`Error writing config file: ${error.message}`);
    return { status: 'error', message: error.message };
  }
});