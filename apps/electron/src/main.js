const { app, BrowserWindow, Menu, globalShortcut, Tray, dialog, ipcMain, shell } = require('electron');
const path = require('path');

const { getApplicationMenu } = require('./menu/applicationMenu.js');
const { getTrayMenu } = require('./menu/trayMenu.js');

const electronConfig = require('./electron.config.js');
const {
  env,
  isProduction,
  isWindows,
  nodePath,
  getClientUrl,
  trayIcon,
  appIcon,
  getServerUrl,
} = require('./externals.js');

if (!isProduction) {
  console.log(`Electron running in ${env} environment`);
  console.log(`Ontime server at ${nodePath}`);
  process.traceProcessWarnings = true;
}

/** Flag holds server loading state */
let loaded = 'Ontime starting';

/**
 * Flag whether user has requested a quit
 * Used to coordinate window closes without exit
 */
let isQuitting = false;

// initialise
let win;
let splash;
let tray = null;

/**
 * Coordinates the node process startup
 * @returns {number} server port - the port at which the backend has been started at
 */
async function startBackend() {
  // in dev mode, we expect both UI and server to be running
  if (!isProduction) {
    return;
  }

  const ontimeServer = require(nodePath);
  const { initAssets, startServer, startIntegrations } = ontimeServer;

  await initAssets(escalateError);

  const result = await startServer();
  loaded = result.message;

  await startIntegrations();

  return result.serverPort;
}

/**
 * Terminate node service and close electron app.
 *
 * The server runs inside this process, so its shutdown must finish before the app
 * can exit: quitting while its HTTP/WebSocket handles are still open leaves a
 * windowless process behind - the app "quits" but keeps running. A timeout guards
 * against a shutdown that never resolves, and a forced exit covers the case where
 * some other handle still blocks the way out.
 */
let isShuttingDown = false;

async function appShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  isQuitting = true;

  // The window goes immediately so the close feels instant; the process follows.
  try {
    tray?.destroy();
    tray = null;
  } catch (error) {
    console.log('ERROR: failed to destroy tray', error);
  }
  if (win && !win.isDestroyed()) {
    win.destroy();
  }

  try {
    if (isProduction) {
      const ontimeServer = require(nodePath);
      if (typeof ontimeServer.shutdown === 'function') {
        await Promise.race([
          ontimeServer.shutdown(electronConfig.appIni.shutdownCode),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      }
    }
  } catch (error) {
    console.log('ERROR: server shutdown failed', error);
  }

  app.quit();

  // A pending handle can still hold the process open after quit(); do not leave
  // the user with an app that is gone from the screen but alive in Activity Monitor.
  const forceExit = setTimeout(() => app.exit(0), 2000);
  forceExit.unref?.();
}

/**
 * Sets Ontime window in focus
 */
function bringToFront() {
  win.show();
  win.focus();
}

/**
 * Coordinates the shutdown process
 */
function askToQuit() {
  bringToFront();
  win.send('user-request-shutdown');
}

/**
 * Allows processes to escalate errors to be shown in electron
 * @param {string} error
 */
function escalateError(error, unrecoverable = false) {
  if (unrecoverable) {
    dialog.showErrorBox('An unrecoverable error occurred', error);
    appShutdown();
  } else {
    dialog.showErrorBox('An error occurred', error);
  }
}

/**
 * Allows electron to ask the react app to redirect
 * @param {string} location
 */
function redirectWindow(location) {
  win.webContents.send('request-editor-location', location);
}

/**
 * Asks the react app to show a user dialog
 * @param {string} name
 */
function showDialog(name) {
  win.webContents.send('dialog', name);
}

// Ensure there isn't another instance of the app running already
const lock = app.requestSingleInstanceLock();
if (!lock) {
  dialog.showErrorBox('Multiple instances', 'An instance of the App is already running.');
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }
      bringToFront();
    }
  });
}

/**
 * Coordinates creation of electron windows (splash and main)
 */
function createWindow() {
  splash = new BrowserWindow({
    width: 333,
    height: 333,
    transparent: true,
    icon: appIcon,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
  });
  splash.setIgnoreMouseEvents(true);
  const splashPath = path.join('file://', __dirname, '/splash/splash.html');
  splash.loadURL(splashPath);

  win = new BrowserWindow({
    width: 1920,
    height: 1000,
    minWidth: 525,
    minHeight: 405,
    backgroundColor: '#101010', // $gray-1350
    icon: appIcon,
    show: false,
    textAreasAreResizable: false,
    enableWebSQL: false,
    darkTheme: true,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      // Hardened: renderer code (including whatever page an operator feeds
      // into the <webview> below) no longer has Node/require access or a
      // shared JS context with the preload script - only the specific,
      // narrow API contextBridge exposes in preload.js. webviewTag is what
      // actually lets UrlFeedOverlay/FeedFrame render an arbitrary operator-
      // supplied URL; doing that safely is exactly why this hardening came
      // first instead of just flipping webviewTag on over the old
      // nodeIntegration:true/contextIsolation:false setup.
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  win.setMenu(null);
}

app.disableHardwareAcceleration();
app.whenReady().then(() => {
  // Set app title in windows
  if (isWindows) {
    app.setAppUserModelId(app.name);
  }

  createWindow();
  startBackend()
    .then((port) => {
      const clientUrl = getClientUrl(port);
      const serverUrl = getServerUrl(port);
      const menu = getApplicationMenu(askToQuit, clientUrl, serverUrl, redirectWindow, showDialog, (url) =>
        win.webContents.downloadURL(url),
      );
      Menu.setApplicationMenu(menu);

      win
        .loadURL(`${clientUrl}/editor`)
        .then(() => {
          win.webContents.setBackgroundThrottling(false);

          win.show();
          win.focus();

          splash.destroy();

          if (typeof loaded === 'string') {
            tray.setToolTip(loaded);
          } else {
            tray.setToolTip('Initialising error: please restart Ontime');
          }
        })
        .catch((error) => {
          console.log('ERROR: Ontime failed to reach server', error);
        });
    })
    .catch((error) => {
      console.log('ERROR: Ontime failed to start', error);
    });

  /**
   * recreate window if no others open
   */
  app.on('activate', () => {
    if (win && !win.isDestroyed()) {
      win.show();
    }
  });

  /**
   * Closing the window fully quits the app - including the embedded server and tray icon -
   * rather than hiding to the background, so there is no lingering instance after close.
   */
  win.on('close', function (event) {
    if (!isQuitting) {
      event.preventDefault();
      appShutdown();
    }
  });

  // create tray and set its context menu
  tray = new Tray(trayIcon);
  const trayContextMenu = getTrayMenu(bringToFront, askToQuit);
  tray.setContextMenu(trayContextMenu);
});

/**
 * Unregister shortcuts before quitting
 */
app.once('will-quit', () => {
  globalShortcut.unregisterAll();
});

/**
 * Cmd+Q and the app menu quit straight away. Without this flag the window's close
 * handler would treat that quit as a plain window close and preventDefault it,
 * which is how a quit request could end up doing nothing at all.
 */
/**
 * Cmd+Q, the app menu and the system quit all arrive here rather than through the
 * window's close handler. Take the same shutdown path, or the server keeps its
 * handles and the process outlives the window. appShutdown() calls quit() itself
 * once the server is down, which re-enters here - the isShuttingDown guard lets
 * that second pass through instead of looping.
 */
app.on('before-quit', (event) => {
  isQuitting = true;
  if (isShuttingDown) return;
  event.preventDefault();
  appShutdown();
});

/**
 * Closing the last window quits the app on every platform. Without a handler here
 * the behaviour differs between macOS and Windows/Linux, and on macOS the process
 * stays alive with no window - the "it remains opened" case.
 */
app.on('window-all-closed', () => {
  // appShutdown() destroys the window itself, which fires this event before its
  // awaited server shutdown has finished. Let that path own the quit, or we exit
  // with the server handles still open - the lingering-process bug all over again.
  if (!isShuttingDown) {
    app.quit();
  }
});

// Ask for main window reload
// Test message
ipcMain.on('reload', () => {
  win?.reload();
});

// Terminate
ipcMain.on('shutdown', () => {
  console.log('Electron got IPC shutdown');
  appShutdown();
});

/**
 * Handles requests to set window properties
 */
ipcMain.on('set-window', (_event, arg) => {
  switch (arg) {
    case 'show-dev':
      win.webContents.openDevTools({ mode: 'detach' });
      break;
    default:
      console.log('Electron unhandled window request', arg);
  }
});

/**
 * Handles requests to open external links
 */
ipcMain.on('send-to-link', (_event, arg) => {
  try {
    shell.openExternal(arg);
  } catch (_error) {
    /** unhandled error */
  }
});
