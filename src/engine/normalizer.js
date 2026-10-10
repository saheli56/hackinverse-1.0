/**
 * behavior.lock Normalizer Engine
 * Converts raw trace logs into deterministic, normalized behavior contracts.
 */

import path from 'node:path';
import os from 'node:os';

export class Normalizer {
  constructor(options = {}) {
    this.projectDir = path.resolve(options.projectDir || process.cwd());
    this.homeDir = os.homedir();
    this.tmpDir = os.tmpdir();
    this.canaryDir = options.canaryDir || '';
  }

  normalizePath(rawPath) {
    if (!rawPath || typeof rawPath !== 'string') return '';
    let p = rawPath.replace(/\\/g, '/');

    // 1. Canary directory detection
    if (this.canaryDir) {
      const normCanary = this.canaryDir.replace(/\\/g, '/');
      if (p.startsWith(normCanary)) {
        return p.replace(normCanary, '[CANARY_ZONE]');
      }
    }

    // 2. Sensitive locations
    if (p.includes('/.aws/credentials') || p.endsWith('.aws/credentials')) return '~/.aws/credentials';
    if (p.includes('/.ssh/id_') || p.includes('/.ssh/authorized_keys')) return '~/.ssh/id_*';
    if (p.includes('/.env.production')) return '.env.production';

    // 3. Project dir collapse
    const normProj = this.projectDir.replace(/\\/g, '/');
    if (p.startsWith(normProj)) {
      const rel = p.slice(normProj.length).replace(/^\//, '');
      return `[PROJECT]/${rel}`;
    }

    // 4. User home dir collapse
    const normHome = this.homeDir.replace(/\\/g, '/');
    if (p.startsWith(normHome)) {
      const rel = p.slice(normHome.length).replace(/^\//, '');
      return `~/${rel}`;
    }

    // 5. Temp dir collapse
    const normTmp = this.tmpDir.replace(/\\/g, '/');
    if (p.startsWith(normTmp)) {
      return '[TMP]/**';
    }

    return p;
  }

  normalizeEvents(rawEvents) {
    const packages = {};

    for (const evt of rawEvents) {
      const pkgName = evt.package || '[project]';
      const phase = evt.phase || 'runtime';

      if (!packages[pkgName]) {
        packages[pkgName] = {
          install: { network: new Set(), fs_read: new Set(), fs_write: new Set(), exec: new Set() },
          runtime: { network: new Set(), fs_read: new Set(), fs_write: new Set(), exec: new Set() },
          canary_breaches: []
        };
      }

      const targetPhase = packages[pkgName][phase] || packages[pkgName].runtime;

      if (evt.canary) {
        packages[pkgName].canary_breaches.push({
          phase,
          type: evt.type,
          target: this.normalizePath(evt.target),
          detail: evt.canaryDetail || 'Unauthorized canary access'
        });
      }

      switch (evt.type) {
        case 'net_outbound':
        case 'net_http': {
          let host = evt.target;
          // Extract hostname:port if URL
          try {
            if (host.startsWith('http://') || host.startsWith('https://')) {
              const u = new URL(host);
              host = `${u.hostname}:${u.port || (u.protocol === 'https:' ? '443' : '80')}`;
            }
          } catch {
            // keep raw target
          }
          targetPhase.network.add(host);
          break;
        }

        case 'fs_read': {
          const norm = this.normalizePath(evt.target);
          if (norm && !this.isIgnoredFsRead(norm)) {
            targetPhase.fs_read.add(norm);
          }
          break;
        }

        case 'fs_write': {
          const norm = this.normalizePath(evt.target);
          if (norm) {
            targetPhase.fs_write.add(norm);
          }
          break;
        }

        case 'exec_spawn': {
          if (evt.target) {
            targetPhase.exec.add(evt.target.trim());
          }
          break;
        }
      }
    }

    // Convert sets to sorted arrays
    const contract = {};
    for (const [pkg, data] of Object.entries(packages)) {
      contract[pkg] = {
        install: {
          network: Array.from(data.install.network).sort(),
          fs_read: Array.from(data.install.fs_read).sort(),
          fs_write: Array.from(data.install.fs_write).sort(),
          exec: Array.from(data.install.exec).sort()
        },
        runtime: {
          network: Array.from(data.runtime.network).sort(),
          fs_read: Array.from(data.runtime.fs_read).sort(),
          fs_write: Array.from(data.runtime.fs_write).sort(),
          exec: Array.from(data.runtime.exec).sort()
        },
        secrets: data.canary_breaches.length > 0 ? data.canary_breaches : 'none'
      };
    }

    return contract;
  }

  isIgnoredFsRead(normalizedPath) {
    // Ignore internal node_modules reads within standard scope
    if (normalizedPath.startsWith('[PROJECT]/node_modules')) return true;
    if (normalizedPath.startsWith('node:')) return true;
    return false;
  }
}
