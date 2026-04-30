const { app, BrowserWindow, session, shell, ipcMain } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Hide automation flags
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');

const CHROME_UA = (() => {
  const os = process.platform;
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  if (os === 'win32') return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  if (os === 'linux') return 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  return ua;
})();

app.userAgentFallback = CHROME_UA;

const CH_CLIENT_HINTS = (() => {
  const os = process.platform;
  const platform = os === 'darwin' ? 'macOS' : os === 'win32' ? 'Windows' : 'Linux';
  return {
    'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': platform,
    'Sec-CH-UA-Full-Version': '131.0.6778.69',
  };
})();

const CSP_OVERRIDE = ["default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"];
const PARTITIONS = ['persist:chatgpt', 'persist:gemini', 'persist:deepseek', 'persist:perplexity'];

function configureSession(ses, isWebview = false) {
  ses.setUserAgent(CHROME_UA);
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    delete headers['X-Client-Data'];
    delete headers['X-Compression-Mode'];
    Object.assign(headers, CH_CLIENT_HINTS);
    callback({ requestHeaders: headers });
  });

  if (isWebview) {
    ses.webRequest.onHeadersReceived((details, callback) => {
      const headers = { ...details.responseHeaders };
      delete headers['content-security-policy'];
      delete headers['Content-Security-Policy'];
      headers['Content-Security-Policy'] = CSP_OVERRIDE;
      callback({ responseHeaders: headers });
    });
  }
}

ipcMain.handle('open-external', (_, url) => shell.openExternal(url));

function createWindow() {
  const webviewPreload = path.join(__dirname, 'preload-webview.js');
  const preloads = [webviewPreload];
  if (isDev) {
    preloads.push(path.join(__dirname, 'preload-webview-debug.js'));
  }
  PARTITIONS.forEach((partition) => {
    const ses = session.fromPartition(partition);
    configureSession(ses, true);
    ses.setPreloads(preloads);
  });

  const isMac = process.platform === 'darwin';
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'assets/icon.ico'),
    autoHideMenuBar: true,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    backgroundColor: '#f5f5f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: false,
    },
  });

  win.webContents.setZoomFactor(1);
  configureSession(win.webContents.session, false);

  const port = process.env.VITE_PORT || 5173;
  const url = isDev
    ? `http://localhost:${port}`
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  win.loadURL(url).catch(err => console.error('[main] loadURL failed:', err));

  if (isDev && process.env.OPEN_DEVTOOLS) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  win.webContents.on('did-fail-load', (e, code, desc) => {
    console.error(`[main] did-fail-load: ${code} - ${desc}`);
  });
}

app.setAppUserModelId('Ai Debate Arena');
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
