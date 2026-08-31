/**
 * Shared utility for resolving ADB and scrcpy executable paths.
 */
const path = require('path');
const fs = require('fs');

function getAdbPath() {
  const commonPaths = [
    '/opt/homebrew/bin/adb',
    '/usr/local/bin/adb',
    '/usr/bin/adb',
    '/bin/adb',
    path.join(process.env.HOME || '', 'Library/Android/sdk/platform-tools/adb'),
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getScrcpyPath() {
  const commonPaths = [
    '/opt/homebrew/bin/scrcpy',
    '/usr/local/bin/scrcpy',
    '/usr/bin/scrcpy',
    '/bin/scrcpy',
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

module.exports = {
  getAdbPath,
  getScrcpyPath
};
