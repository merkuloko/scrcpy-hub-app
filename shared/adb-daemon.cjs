const net = require('net');
const { execFile } = require('child_process');

const ADB_SERVER_HOST = '127.0.0.1';
const ADB_SERVER_PORT = 5037;
const ADB_PROBE_TIMEOUT_MS = 1500;
const ADB_START_TIMEOUT_MS = 8000;

let adbStartupPromise = null;

function encodeAdbRequest(command) {
  return `${command.length.toString(16).padStart(4, '0')}${command}`;
}

function isAdbDaemonHealthy() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: ADB_SERVER_HOST, port: ADB_SERVER_PORT });
    let settled = false;
    let response = '';

    const finish = (healthy) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(healthy);
    };

    socket.setTimeout(ADB_PROBE_TIMEOUT_MS);
    socket.once('connect', () => {
      socket.write(encodeAdbRequest('host:version'));
    });
    socket.on('data', (chunk) => {
      response += chunk.toString('ascii');
      if (response.length >= 4) {
        finish(response.startsWith('OKAY'));
      }
    });
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.once('close', () => finish(response.startsWith('OKAY')));
  });
}

async function ensureAdbServer(adbPath) {
  if (await isAdbDaemonHealthy()) return;
  if (adbStartupPromise) return adbStartupPromise;

  adbStartupPromise = new Promise((resolve, reject) => {
    execFile(adbPath, ['start-server'], { timeout: ADB_START_TIMEOUT_MS }, async (error, stdout, stderr) => {
      adbStartupPromise = null;

      if (await isAdbDaemonHealthy()) {
        resolve();
        return;
      }

      if (error) {
        const details = stderr || stdout || error.message;
        reject(new Error(details.trim ? details.trim() : details));
        return;
      }

      reject(new Error('ADB daemon did not become healthy after start-server'));
    });
  });

  return adbStartupPromise;
}

async function execAdb(adbPath, args, callback) {
  try {
    await ensureAdbServer(adbPath);
  } catch (error) {
    callback(error, '', error.message);
    return;
  }

  execFile(adbPath, args, callback);
}

module.exports = {
  ensureAdbServer,
  execAdb,
  isAdbDaemonHealthy,
};
