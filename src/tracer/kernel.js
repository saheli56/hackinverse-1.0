/**
 * behavior.lock Kernel Tracer (Engine 2)
 * Orchestrates Linux syscall tracing via strace (native Linux or WSL2).
 */

import { spawnSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export class KernelTracer {
  constructor(options = {}) {
    this.wslDistro = options.wslDistro || 'Ubuntu-24.04';
    this.isLinux = os.platform() === 'linux';
    this.hasWSL = false;

    if (!this.isLinux && os.platform() === 'win32') {
      try {
        const check = execSync('wsl --status', { stdio: 'pipe', encoding: 'utf8' });
        this.hasWSL = check.length > 0;
      } catch {
        this.hasWSL = false;
      }
    }
  }

  isAvailable() {
    return this.isLinux || this.hasWSL;
  }

  runTracedCommand(command, cwd, env = {}, outputFile) {
    const rawLog = outputFile + '.strace.raw';

    if (this.isLinux) {
      const args = [
        '-f',
        '-s', '512',
        '-e', 'trace=open,openat,connect,execve',
        '-o', rawLog,
        'sh', '-c', command
      ];
      spawnSync('strace', args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit' });
    } else if (this.hasWSL) {
      // Map Windows path to WSL /mnt/...
      const wslCwd = cwd.replace(/^[a-zA-Z]:/, (m) => `/mnt/${m[0].toLowerCase()}`).replace(/\\/g, '/');
      const wslLog = rawLog.replace(/^[a-zA-Z]:/, (m) => `/mnt/${m[0].toLowerCase()}`).replace(/\\/g, '/');

      const wslCmd = `strace -f -s 512 -e trace=open,openat,connect,execve -o "${wslLog}" sh -c "cd '${wslCwd}' && ${command}"`;
      spawnSync('wsl', ['-d', this.wslDistro, '--', 'sh', '-c', wslCmd], { stdio: 'inherit' });
    }

    if (fs.existsSync(rawLog)) {
      const events = this.parseStraceLog(rawLog);
      return events;
    }
    return [];
  }

  parseStraceLog(logPath) {
    if (!fs.existsSync(logPath)) return [];
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');
    const events = [];

    for (const line of lines) {
      // Parse connect syscall
      // e.g.: connect(3, {sa_family=AF_INET, sin_port=htons(443), sin_addr=inet_addr("1.2.3.4")}, 16) = ...
      const connectMatch = line.match(/connect\(.*sin_port=htons\((\d+)\).*sin_addr=inet_addr\("([^"]+)"\)/);
      if (connectMatch) {
        events.push({
          type: 'net_outbound',
          target: `${connectMatch[2]}:${connectMatch[1]}`,
          details: { ip: connectMatch[2], port: connectMatch[1] },
          source: 'kernel_strace'
        });
      }

      // Parse open / openat syscall
      // e.g.: openat(AT_FDCWD, "/home/user/.aws/credentials", O_RDONLY) = 3
      const openMatch = line.match(/open(?:at)?\([^,]*,\s*"([^"]+)"/);
      if (openMatch) {
        const filePath = openMatch[1];
        events.push({
          type: 'fs_read',
          target: filePath,
          source: 'kernel_strace'
        });
      }

      // Parse execve syscall
      // e.g.: execve("/bin/curl", ["curl", "http://..."], ...)
      const execMatch = line.match(/execve\("([^"]+)",\s*\[([^\]]+)\]/);
      if (execMatch) {
        events.push({
          type: 'exec_spawn',
          target: `${execMatch[1]} ${execMatch[2]}`,
          source: 'kernel_strace'
        });
      }
    }

    return events;
  }
}
