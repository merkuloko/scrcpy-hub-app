/**
 * Shared validation logic for ADB and Scrcpy
 */

function isValidSerial(value) {
  if (typeof value !== 'string' || !value) return false;
  // Allow only safe device serial characters: /^[a-zA-Z0-9.:_-]+$/
  return /^[a-zA-Z0-9.:_-]+$/.test(value);
}

function isValidIpv4(value) {
  if (typeof value !== 'string') return false;
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part;
  });
}

function normalizePort(value) {
  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) return null;
  return String(port);
}

function parseCustomArgs(value) {
  if (typeof value !== 'string' || !value.trim()) return [];

  const args = [];
  let current = '';
  let quote = null;
  let escaping = false;
  let hasValue = false;

  for (const character of value.trim()) {
    if (escaping) {
      current += character;
      escaping = false;
      hasValue = true;
    } else if (character === '\\') {
      escaping = true;
      hasValue = true;
    } else if (quote) {
      if (character === quote) quote = null;
      else current += character;
      hasValue = true;
    } else if (character === '"' || character === "'") {
      quote = character;
      hasValue = true;
    } else if (/\s/.test(character)) {
      if (hasValue) {
        args.push(current);
        current = '';
        hasValue = false;
      }
    } else {
      current += character;
      hasValue = true;
    }
  }

  if (escaping) current += '\\';
  if (hasValue) args.push(current);
  return args;
}

module.exports = {
  isValidSerial,
  isValidIpv4,
  normalizePort,
  parseCustomArgs
};
