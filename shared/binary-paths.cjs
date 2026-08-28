/**
 * Shared utility for resolving ADB and scrcpy executable paths.
 */
const path = require('path');
const fs = require('fs');

function getAdbPath() {
  if (process.platform === 'darwin') {
    const commonPaths = [
      '/opt/homebrew/bin/adb',
      '/usr/local/bin/adb',
      '/usr/bin/adb',
      '/bin/adb',
      path.join(process.env.HOME || '', 'Library/Android/sdk/platform-tools/adb')
    ];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) return p;
    }
  }
  // Fallback to searching in PATH if not found in common locations, 
  // but we prefer absolute paths.
  return 'adb';
}

function getScrcpyPath() {
  if (process.platform === 'darwin') {
    const commonPaths = [
      '/opt/homebrew/bin/scrcpy',
      '/usr/local/bin/scrcpy',
      '/usr/bin/scrcpy',
      '/bin/scrcpy'
    ];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) return p;
    }
  }
  return 'scrcpy';
}

module.exports = {
  getAdbPath,
  getScrcpyPath
};
