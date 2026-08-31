const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const nativeImage = require('electron').nativeImage;
const { isValidSerial, isValidIpv4, normalizePort, parseCustomArgs } = require('./shared/adb-utils.cjs');
const { getAdbPath, getScrcpyPath } = require('./shared/binary-paths.cjs');
const { execAdb } = require('./shared/adb-daemon.cjs');

const adbPath = getAdbPath();
const scrcpyPath = getScrcpyPath();

// macOS Path Fix: Inject standard Homebrew and local binary paths into process.env.PATH
if (process.platform === 'darwin') {
  const brewPaths = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/opt/homebrew/sbin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ];
  const currentPath = process.env.PATH || '';
  const currentPathsArray = currentPath.split(':');
  const missingPaths = brewPaths.filter((p) => !currentPathsArray.includes(p));
  if (missingPaths.length > 0) {
    process.env.PATH = `${missingPaths.join(':')}:${currentPath}`;
  }
}

let mainWindow = null;
const activeProcesses = new Map();

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'ikon.png');
  const appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 640,
    minHeight: 640,
    titleBarStyle: 'hiddenInset', 
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: '#0d1117', 
    icon: appIcon, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load from Vite dev server or production dist
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    for (const [serial, proc] of activeProcesses.entries()) {
      try {
        proc.kill('SIGTERM');
      } catch (err) {
        console.error(`Failed to kill process for ${serial}:`, err);
      }
    }
    activeProcesses.clear();
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function emitLog(level, message, serial = null) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('scrcpy-log', {
      timestamp: new Date().toISOString(),
      level,
      message,
      serial,
    });
  }
}

ipcMain.handle('get-devices', async () => {
  return new Promise((resolve) => {
    execAdb(adbPath, ['devices', '-l'], (error, stdout, stderr) => {
      if (error) {
        emitLog('error', `ADB error: ${stderr || error.message}`);
        resolve({ success: false, error: stderr || error.message, devices: [] });
        return;
      }
      const lines = stdout.split('\n');
      const devices = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const serial = parts[0];
          const state = parts[1];
          let model = 'Android Device';
          for (let j = 2; j < parts.length; j++) {
            if (parts[j].startsWith('model:')) {
              model = parts[j].replace('model:', '').replace(/_/g, ' ');
            }
          }
          devices.push({
            id: serial,
            serial,
            model,
            state,
            isWireless: serial.includes(':'),
            isMirroring: activeProcesses.has(serial),
          });
        }
      }
      resolve({ success: true, devices });
    });
  });
});

ipcMain.handle('start-scrcpy', async (event, config) => {
  const {
    serial, maxSize = 1080, maxFps = 60, audioSource = 'internal',
    turnScreenOff = false, stayAwake = false, alwaysOnTop = false,
    showTouches = false, readOnly = false, record = false,
    recordFileName = '', videoBitRate = 8, videoCodec = 'h264', customArgs = '',
  } = config || {};

  if (!serial || !isValidSerial(serial)) return { success: false, error: 'Invalid device serial provided' };
  if (activeProcesses.has(serial)) return { success: false, error: `Mirroring session already active for ${serial}` };

  const args = ['-s', serial];
  if (maxSize && Number(maxSize) > 0) args.push('-m', String(maxSize));
  if (maxFps && Number(maxFps) > 0) args.push('--max-fps', String(maxFps));
  if (videoBitRate && Number(videoBitRate) > 0) args.push('-b', `${videoBitRate}M`);
  if (videoCodec && videoCodec !== 'default') args.push('--video-codec', videoCodec);
  
  if (audioSource === 'disabled') args.push('--no-audio');
  else if (audioSource === 'mic') args.push('--audio-source=mic');

  if (turnScreenOff) args.push('--turn-screen-off');
  if (stayAwake) args.push('--stay-awake');
  if (alwaysOnTop) args.push('--always-on-top');
  if (showTouches) args.push('--show-touches');
  if (readOnly) args.push('--no-control');

  if (record) {
    const recordingsDir = path.join(app.getPath('videos') || app.getPath('documents'), 'ScrcpyRecordings');
    if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });
    const safeName = recordFileName ? recordFileName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : `record_${Date.now()}`;
    args.push('--record', path.join(recordingsDir, `${safeName}.mp4`));
  }

  if (customArgs && customArgs.trim().length > 0) {
    args.push(...parseCustomArgs(customArgs));
  }

  try {
    const child = spawn(scrcpyPath, args, { shell: false, env: process.env });
    activeProcesses.set(serial, child);

    child.stdout.on('data', (data) => emitLog('stdout', data.toString().trim(), serial));
    child.stderr.on('data', (data) => emitLog('stderr', data.toString().trim(), serial));
    child.on('error', (err) => {
      emitLog('error', `Process error: ${err.message}`, serial);
      activeProcesses.delete(serial);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('session-status-changed', { serial, status: 'error', error: err.message });
      }
    });
    child.on('close', (code) => {
      activeProcesses.delete(serial);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('session-status-changed', { serial, status: 'stopped', exitCode: code });
      }
    });

    return { success: true, serial, command: `scrcpy ${args.join(' ')}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('stop-scrcpy', async (event, serial) => {
  if (!serial) {
    for (const [id, proc] of activeProcesses.entries()) {
      try { proc.kill('SIGTERM'); } catch (e) {}
    }
    activeProcesses.clear();
    return { success: true };
  }
  const proc = activeProcesses.get(serial);
  if (proc) {
    try {
      proc.kill('SIGTERM');
      activeProcesses.delete(serial);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'No active session found for device' };
});

ipcMain.handle('connect-wireless', async (event, { ip, port = 5555 }) => {
  if (!ip || !isValidIpv4(ip)) return { success: false, error: 'Please enter a valid IPv4 address' };
  const normalizedPort = normalizePort(port);
  if (!normalizedPort) return { success: false, error: 'Invalid port number' };

  return new Promise((resolve) => {
    execAdb(adbPath, ['tcpip', normalizedPort], (tcpErr) => {
      if (tcpErr) {
        resolve({ success: false, error: tcpErr.message });
        return;
      }
      execAdb(adbPath, ['connect', `${ip}:${normalizedPort}`], (err, stdout) => {
        if (err) resolve({ success: false, error: err.message });
        else resolve({ success: true, message: stdout.trim() });
      });
    });
  });
});

ipcMain.handle('disconnect-wireless', async (event, target) => {
  if (!target || (!isValidSerial(target) && !isValidIpv4(target.split(':')[0]))) {
    return { success: false, error: 'Invalid target' };
  }
  return new Promise((resolve) => {
    execAdb(adbPath, ['disconnect', target], (error, stdout) => {
      resolve({ success: !error, message: stdout ? stdout.trim() : '' });
    });
  });
});

ipcMain.handle('open-recordings-folder', async () => {
  const recordingsDir = path.join(app.getPath('videos') || app.getPath('documents'), 'ScrcpyRecordings');
  if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });
  await shell.openPath(recordingsDir);
  return { success: true, path: recordingsDir };
});
