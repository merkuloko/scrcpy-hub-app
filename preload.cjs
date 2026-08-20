/**
 * Scrcpy Hub - Electron Preload Script
 * Exposes a secure contextBridge API to the React Renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Device & Connection management
  getDevices: () => ipcRenderer.invoke('get-devices'),
  connectWireless: (data) => ipcRenderer.invoke('connect-wireless', data),
  disconnectWireless: (target) => ipcRenderer.invoke('disconnect-wireless', target),

  // Scrcpy Session control
  startScrcpy: (config) => ipcRenderer.invoke('start-scrcpy', config),
  stopScrcpy: (serial) => ipcRenderer.invoke('stop-scrcpy', serial),

  // Environment checks & helper utilities
  checkBinaries: () => ipcRenderer.invoke('check-binaries'),
  openRecordingsFolder: () => ipcRenderer.invoke('open-recordings-folder'),

  // Event Listeners from Main process
  onScrcpyLog: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('scrcpy-log', handler);
    return () => ipcRenderer.removeListener('scrcpy-log', handler);
  },

  onSessionStatusChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('session-status-changed', handler);
    return () => ipcRenderer.removeListener('session-status-changed', handler);
  },
});
