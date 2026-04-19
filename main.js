const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const CSP_OVERRIDE = ["default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"];

function configureSession(ses) {
  // Spoof user-agent so sites don't detect Electron
  ses.setUserAgent(CHROME_UA);

  // Remove restrictive CSP headers so embedded pages render correctly
  ses.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    delete headers['content-security-policy'];
    delete headers['Content-Security-Policy'];
    headers['Content-Security-Policy'] = CSP_OVERRIDE;
    callback({ responseHeaders: headers });
  });
}

function createWindow() {
  // Configure webview partition sessions BEFORE the window is created
  const partitions = ['persist:chatgpt', 'persist:gemini', 'persist:deepseek'];
  
  partitions.forEach((partition) => {
    configureSession(session.fromPartition(partition));
  });

  const win = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 1200,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: false,
    },
  });

  // Also configure the main session (for the React app)
  configureSession(win.webContents.session);

  const port = process.env.VITE_PORT || 5173;
  const url = isDev
    ? `http://localhost:${port}`
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  win.loadURL(url).catch(err => console.error('[main] loadURL failed:', err));

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  win.webContents.on('did-fail-load', (e, code, desc) => {
    console.error(`[main] did-fail-load: ${code} - ${desc}`);
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
