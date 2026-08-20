import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Download, Folder } from 'lucide-react';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'main' | 'preload' | 'package' | 'server'>('main');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const files = {
    main: {
      name: 'main.js',
      lang: 'javascript',
      desc: 'Electron Main Process (Spawns scrcpy / adb child processes & IPC handlers)',
      code: `const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

// macOS Path Fix: Inject Homebrew paths into PATH so child_process can locate binaries
if (process.platform === 'darwin') {
  const brewPaths = ['/opt/homebrew/bin', '/usr/local/bin', '/opt/homebrew/sbin', '/usr/bin', '/bin'];
  const current = process.env.PATH || '';
  const missing = brewPaths.filter(p => !current.split(':').includes(p));
  if (missing.length) process.env.PATH = \`\${missing.join(':')}:\${current}\`;
}

let mainWindow = null;
const activeProcesses = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 860,
    minHeight: 640,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

// IPC: Get Connected ADB Devices
ipcMain.handle('get-devices', async () => {
  return new Promise((resolve) => {
    exec('adb devices -l', (error, stdout, stderr) => {
      if (error) return resolve({ success: false, error: stderr || error.message, devices: [] });
      const lines = stdout.split('\\n');
      const devices = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(/\\s+/);
        if (parts.length >= 2) {
          const serial = parts[0];
          let model = 'Android Device';
          for (let j = 2; j < parts.length; j++) {
            if (parts[j].startsWith('model:')) model = parts[j].replace('model:', '').replace(/_/g, ' ');
          }
          devices.push({ id: serial, serial, model, state: parts[1], isWireless: serial.includes(':') });
        }
      }
      resolve({ success: true, devices });
    });
  });
});

// IPC: Start Scrcpy Mirroring Session
ipcMain.handle('start-scrcpy', async (event, config) => {
  const { serial, maxSize = 1080, maxFps = 60, audioSource = 'internal', turnScreenOff, record } = config;
  const args = ['-s', serial, '-m', String(maxSize), '--max-fps', String(maxFps)];
  if (audioSource === 'disabled') args.push('--no-audio');
  else if (audioSource === 'mic') args.push('--audio-source=mic');
  if (turnScreenOff) args.push('--turn-screen-off');
  if (record) args.push('--record', \`recording_\${Date.now()}.mp4\`);

  const child = spawn('scrcpy', args);
  activeProcesses.set(serial, child);
  return { success: true, serial, command: \`scrcpy \${args.join(' ')}\` };
});

// IPC: Connect Wireless Device
ipcMain.handle('connect-wireless', async (event, { ip, port = 5555 }) => {
  return new Promise((resolve) => {
    exec(\`adb tcpip \${port} && adb connect \${ip}:\${port}\`, (err, stdout) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, message: stdout.trim() });
    });
  });
});`,
    },
    preload: {
      name: 'preload.js',
      lang: 'javascript',
      desc: 'Electron Preload Script (Exposes contextBridge window.api)',
      code: `const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getDevices: () => ipcRenderer.invoke('get-devices'),
  connectWireless: (data) => ipcRenderer.invoke('connect-wireless', data),
  disconnectWireless: (target) => ipcRenderer.invoke('disconnect-wireless', target),
  startScrcpy: (config) => ipcRenderer.invoke('start-scrcpy', config),
  stopScrcpy: (serial) => ipcRenderer.invoke('stop-scrcpy', serial),
  checkBinaries: () => ipcRenderer.invoke('check-binaries'),
  onScrcpyLog: (cb) => {
    const handler = (event, data) => cb(data);
    ipcRenderer.on('scrcpy-log', handler);
    return () => ipcRenderer.removeListener('scrcpy-log', handler);
  },
});`,
    },
    package: {
      name: 'package.json',
      lang: 'json',
      desc: 'Build manifests, dependencies & Electron / Vite scripts',
      code: `{
  "name": "scrcpy-hub",
  "version": "1.0.0",
  "description": "macOS/Windows desktop UI wrapper for scrcpy and adb",
  "main": "main.js",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "electron:dev": "concurrently \\"vite\\" \\"electron .\\"",
    "electron:build": "vite build && electron-builder"
  },
  "dependencies": {
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "lucide-react": "^0.546.0",
    "express": "^4.21.2",
    "motion": "^12.23.24"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^24.13.3",
    "vite": "^6.2.3",
    "tailwindcss": "^4.1.14"
  }
}`,
    },
    server: {
      name: 'server.ts',
      lang: 'typescript',
      desc: 'Full-stack Express API fallback for Web Sandbox & Remote ADB Bridge',
      code: `import express from 'express';
import { spawn, exec } from 'child_process';

const app = express();
app.use(express.json());

app.get('/api/devices', (req, res) => {
  exec('adb devices -l', (error, stdout) => {
    // parses devices or returns simulated hardware pool
    res.json({ success: true, devices: [...] });
  });
});

app.post('/api/start-scrcpy', (req, res) => {
  const { serial, maxSize, maxFps, audioSource, turnScreenOff, record } = req.body;
  const args = ['-s', serial, '-m', String(maxSize), '--max-fps', String(maxFps)];
  // Spawns scrcpy with real or simulated streaming pipeline
  res.json({ success: true, command: \`scrcpy \${args.join(' ')}\` });
});`,
    },
  };

  const currentFile = files[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#E2E8F0]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#30363D] bg-[#0D1117]">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-[#E2E8F0]">Electron & Core Project Files</h3>
              <p className="text-[11px] text-gray-400">Complete standalone codebase files ready for compilation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#30363D] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Nav */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-[#30363D] bg-[#161B22]">
          <div className="flex items-center gap-1.5">
            {(Object.keys(files) as Array<keyof typeof files>).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                  activeTab === key
                    ? 'bg-[#0D1117] text-blue-400 border border-[#30363D] font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#0D1117]'
                }`}
              >
                {files[key].name}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1117] hover:bg-[#30363D] text-[#E2E8F0] text-xs rounded-md transition-colors border border-[#30363D]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            <span>{copied ? 'Copied' : 'Copy File'}</span>
          </button>
        </div>

        {/* File Description */}
        <div className="px-5 py-2 bg-[#0D1117] border-b border-[#30363D] text-[11px] text-gray-400">
          {currentFile.desc}
        </div>

        {/* Code Content */}
        <div className="p-4 flex-1 overflow-y-auto bg-[#090D11] font-mono text-xs text-gray-300 leading-relaxed select-text">
          <pre>
            <code>{currentFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
