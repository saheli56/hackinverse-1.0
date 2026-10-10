/**
 * behavior.lock Runtime Preload Hook (Engine 1)
 * Loaded via NODE_OPTIONS="--require ..."
 * Intercepts fs, child_process, net, http, dns and attributes events to packages.
 */

const fs = require('node:fs');
const path = require('node:path');
const child_process = require('node:child_process');
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');
const dns = require('node:dns');

const traceFile = process.env.BEHAVIORLOCK_TRACE_FILE;
const currentPhase = process.env.BEHAVIORLOCK_PHASE || 'runtime';
const canaryDir = process.env.BEHAVIORLOCK_CANARY_DIR || '';

// Re-entrancy guard to prevent recursive self-tracing
let isRecording = false;

// Canary tokens for leak detection
const CANARY_TOKENS = [
  'BL_CANARY_AWS_KEY_7739',
  'BL_CANARY_AWS_SECRET_8812',
  'BL_CANARY_SSH_ED25519_9910',
  'BL_CANARY_DATABASE_PW_4401',
  'BL_CANARY_NPM_TOKEN_2209'
];

// Cache original un-hooked methods
const origReadFile = fs.readFile;
const origReadFileSync = fs.readFileSync;
const origWriteFile = fs.writeFile;
const origWriteFileSync = fs.writeFileSync;
const origOpen = fs.open;
const origOpenSync = fs.openSync;
const origExec = child_process.exec;
const origExecSync = child_process.execSync;
const origSpawn = child_process.spawn;
const origSpawnSync = child_process.spawnSync;
const origConnect = net.Socket.prototype.connect;
const origDnsLookup = dns.lookup;
const origHttpRequest = http.request;
const origHttpsRequest = https.request;

function recordEvent(type, target, details = {}) {
  if (!traceFile || isRecording) return;

  const targetStr = String(target || '');
  // Never trace the trace file itself or node internals
  if (targetStr.includes('.behaviorlock') || targetStr.includes('trace-')) return;

  isRecording = true;
  try {
    const stack = new Error().stack || '';
    const pkg = attributePackage(stack);

    let canaryHit = false;
    let canaryDetail = null;

    if (canaryDir && targetStr.includes(canaryDir)) {
      canaryHit = true;
      canaryDetail = 'Access to canary bait directory';
    } else if (/(\.aws[/\\]credentials|\.ssh[/\\]id_|\.env\.production)/i.test(targetStr)) {
      canaryHit = true;
      canaryDetail = 'Target matches protected credential pattern';
    }

    for (const token of CANARY_TOKENS) {
      if (targetStr.includes(token) || JSON.stringify(details).includes(token)) {
        canaryHit = true;
        canaryDetail = `Exfiltration payload contains canary token ${token}`;
        break;
      }
    }

    const record = {
      timestamp: Date.now(),
      phase: currentPhase,
      type,
      package: pkg,
      target: targetStr,
      canary: canaryHit,
      canaryDetail,
      ...details
    };

    // Use original unhooked writeFileSync
    origWriteFileSync.call(fs, traceFile, JSON.stringify(record) + '\n', { flag: 'a', encoding: 'utf8' });
  } catch {
    // Fail silently
  } finally {
    isRecording = false;
  }
}

function attributePackage(stack) {
  const lines = stack.split('\n');
  for (const line of lines) {
    if (line.includes('hook.cjs') || line.includes('node:internal') || line.includes('internal/modules')) continue;

    const match = line.match(/node_modules[/\\]((?:@[^/\\]+[/\\])?[^/\\]+)/);
    if (match) {
      return match[1].replace(/\\/g, '/');
    }
  }
  return '[project]';
}

// 1. Hook node:fs
fs.readFile = function (filePath, ...args) {
  recordEvent('fs_read', filePath);
  return origReadFile.apply(this, [filePath, ...args]);
};

fs.readFileSync = function (filePath, ...args) {
  recordEvent('fs_read', filePath);
  return origReadFileSync.apply(this, [filePath, ...args]);
};

fs.writeFile = function (filePath, data, ...args) {
  recordEvent('fs_write', filePath, { size: typeof data === 'string' ? data.length : 0 });
  return origWriteFile.apply(this, [filePath, data, ...args]);
};

fs.writeFileSync = function (filePath, data, ...args) {
  recordEvent('fs_write', filePath, { size: typeof data === 'string' ? data.length : 0 });
  return origWriteFileSync.apply(this, [filePath, data, ...args]);
};

fs.open = function (filePath, flags, ...args) {
  if (typeof flags === 'string' && (flags.includes('w') || flags.includes('a'))) {
    recordEvent('fs_write', filePath);
  } else {
    recordEvent('fs_read', filePath);
  }
  return origOpen.apply(this, [filePath, flags, ...args]);
};

fs.openSync = function (filePath, flags, ...args) {
  if (typeof flags === 'string' && (flags.includes('w') || flags.includes('a'))) {
    recordEvent('fs_write', filePath);
  } else {
    recordEvent('fs_read', filePath);
  }
  return origOpenSync.apply(this, [filePath, flags, ...args]);
};

// 2. Hook node:child_process
child_process.exec = function (command, ...args) {
  recordEvent('exec_spawn', command, { method: 'exec' });
  return origExec.apply(this, [command, ...args]);
};

child_process.execSync = function (command, ...args) {
  recordEvent('exec_spawn', command, { method: 'execSync' });
  return origExecSync.apply(this, [command, ...args]);
};

child_process.spawn = function (command, cmdArgs, ...args) {
  const fullCmd = [command, ...(Array.isArray(cmdArgs) ? cmdArgs : [])].join(' ');
  recordEvent('exec_spawn', fullCmd, { binary: command, method: 'spawn' });
  return origSpawn.apply(this, [command, cmdArgs, ...args]);
};

child_process.spawnSync = function (command, cmdArgs, ...args) {
  const fullCmd = [command, ...(Array.isArray(cmdArgs) ? cmdArgs : [])].join(' ');
  recordEvent('exec_spawn', fullCmd, { binary: command, method: 'spawnSync' });
  return origSpawnSync.apply(this, [command, cmdArgs, ...args]);
};

// 3. Hook node:net
net.Socket.prototype.connect = function (...args) {
  let host = 'localhost';
  let port = 0;

  if (typeof args[0] === 'object' && args[0] !== null) {
    port = args[0].port || 0;
    host = args[0].host || args[0].hostname || 'localhost';
  } else if (typeof args[0] === 'number') {
    port = args[0];
    if (typeof args[1] === 'string') {
      host = args[1];
    }
  }

  const endpoint = `${host}:${port}`;
  recordEvent('net_outbound', endpoint, { host, port });
  return origConnect.apply(this, args);
};

// 4. Hook node:dns
dns.lookup = function (hostname, ...args) {
  recordEvent('dns_lookup', hostname);
  return origDnsLookup.apply(this, [hostname, ...args]);
};

// 5. Hook http and https
http.request = function (...args) {
  let url = '';
  if (typeof args[0] === 'string') {
    url = args[0];
  } else if (args[0] instanceof URL) {
    url = args[0].href;
  } else if (typeof args[0] === 'object' && args[0] !== null) {
    const h = args[0].host || args[0].hostname || 'unknown';
    const p = args[0].port || 80;
    const pathStr = args[0].path || '/';
    url = `http://${h}:${p}${pathStr}`;
  }
  recordEvent('net_http', url, { protocol: 'http' });
  return origHttpRequest.apply(this, args);
};

https.request = function (...args) {
  let url = '';
  if (typeof args[0] === 'string') {
    url = args[0];
  } else if (args[0] instanceof URL) {
    url = args[0].href;
  } else if (typeof args[0] === 'object' && args[0] !== null) {
    const h = args[0].host || args[0].hostname || 'unknown';
    const p = args[0].port || 443;
    const pathStr = args[0].path || '/';
    url = `https://${h}:${p}${pathStr}`;
  }
  recordEvent('net_http', url, { protocol: 'https' });
  return origHttpsRequest.apply(this, args);
};
