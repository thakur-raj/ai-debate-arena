const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const CHROME_UA = (() => {
  const os = process.platform;
  if (os === 'win32') return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  if (os === 'linux') return 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
})();
const CSP_OVERRIDE = ["default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"];

function configureSession(ses, isWebview = false) {
  // Spoof user-agent so sites don't detect Electron
  ses.setUserAgent(CHROME_UA);

  // Remove restrictive CSP headers so embedded webview pages render correctly
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

function createWindow() {
  // Configure webview partition sessions BEFORE the window is created
  const partitions = ['persist:chatgpt', 'persist:gemini', 'persist:deepseek', 'persist:perplexity'];
  
  partitions.forEach((partition) => {
    configureSession(session.fromPartition(partition), true);
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

  // Also configure the main session (no CSP override — keep app security)
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
