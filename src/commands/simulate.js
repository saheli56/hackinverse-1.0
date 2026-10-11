/**
 * Command: behaviorlock simulate <attack|clean>
 * Creates standalone simulated attack payload in current repo for testing,
 * and cleans it up with a single command.
 */

import fs from 'node:fs';
import path from 'node:path';

const PAYLOAD_FILENAME = '_behaviorlock_test.js';

const ATTACK_TEMPLATE = `/**
 * =========================================================================
 * behavior.lock Simulated Supply-Chain Payload (Security Testing Only)
 * =========================================================================
 * This file was automatically generated for offline security testing.
 * It simulates common supply-chain attacks:
 *   1. Accessing decoy credentials (~/.aws/credentials honeypot)
 *   2. Initiating unauthorized outbound socket connection (example.com:443)
 *   3. Spawning an unexpected child process (whoami)
 */

import fs from 'node:fs';
import os from 'node:os';
import https from 'node:https';
import { execSync } from 'node:child_process';

console.log('[test-payload] Running target application code...');

// --- 1. TRIPWIRE: Read Decoy AWS Credentials ---
try {
  const canaryPath = process.env.AWS_SHARED_CREDENTIALS_FILE || (os.homedir() + '/.aws/credentials');
  if (fs.existsSync(canaryPath)) {
    fs.readFileSync(canaryPath, 'utf8');
  }
} catch {
  // silent fail
}

// --- 2. ANOMALY: Outbound Network Ping ---
try {
  const req = https.get('https://example.com/telemetry-collect');
  req.on('error', () => {});
} catch {
  // silent fail
}

// --- 3. ANOMALY: Child Process Execution ---
try {
  execSync('whoami', { stdio: 'pipe' });
} catch {
  // silent fail
}

console.log('[test-payload] Application executed. (Attack behaviors triggered)');
`;

export async function commandSimulate(subCommand = 'attack', options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const filePath = path.join(cwd, PAYLOAD_FILENAME);

  if (subCommand === 'clean' || subCommand === 'reset' || subCommand === 'clear') {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`\n\x1b[32m\x1b[1m✔ CLEANUP COMPLETE:\x1b[0m Removed \x1b[36m${PAYLOAD_FILENAME}\x1b[0m from ${cwd}\n`);
    } else {
      console.log(`\n\x1b[90mNo test payload found in ${cwd}. Working tree is clean.\x1b[0m\n`);
    }
    return;
  }

  // Create attack test file
  fs.writeFileSync(filePath, ATTACK_TEMPLATE, 'utf8');

  console.log(`
\x1b[35m\x1b[1m═══════════════════════════════════════════════════════════════════\x1b[0m
\x1b[36m\x1b[1m  behavior.lock Test Payload Created\x1b[0m
\x1b[35m\x1b[1m═══════════════════════════════════════════════════════════════════\x1b[0m

\x1b[32m✔ File generated:\x1b[0m \x1b[1m${PAYLOAD_FILENAME}\x1b[0m in ${cwd}

\x1b[1mHow to test behaviorlock now:\x1b[0m
  \x1b[33mbehaviorlock check\x1b[0m \x1b[90m(auto-detects simulation payload)\x1b[0m

\x1b[1mWhen you are done testing, clean up with:\x1b[0m
  \x1b[36mbehaviorlock simulate clean\x1b[0m
`);
}
