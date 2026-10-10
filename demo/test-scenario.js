#!/usr/bin/env node
/**
 * behavior.lock Instant Scenario Tester & Auto-Reverter
 * Usage: node demo/test-scenario.js <safe|attack|telemetry>
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const demoAppDir = path.resolve(__dirname, 'demo-app');
const targetModule = path.resolve(demoAppDir, 'node_modules/slug-lib/index.js');
const cliBin = path.resolve(rootDir, 'bin/behaviorlock.js');

const safePkg = path.resolve(__dirname, 'packages/safe-slug/index.js');
const compromisedPkg = path.resolve(__dirname, 'packages/compromised-slug/index.js');
const telemetryPkg = path.resolve(__dirname, 'packages/telemetry-slug/index.js');

const scenario = process.argv[2]?.toLowerCase();

if (!['safe', 'attack', 'telemetry'].includes(scenario)) {
  console.log(`
\x1b[1mUsage:\x1b[0m node demo/test-scenario.js \x1b[36m<safe | attack | telemetry>\x1b[0m

\x1b[1mScenarios:\x1b[0m
  \x1b[32msafe\x1b[0m        Tests benign package baseline (Should pass exit 0)
  \x1b[31mattack\x1b[0m      Tests credential theft & C2 networking (Should fail exit 1)
  \x1b[33mtelemetry\x1b[0m   Tests unapproved analytics endpoint & auto-approval flow

\x1b[90mAll scenarios automatically restore clean state on exit.\x1b[0m
`);
  process.exit(0);
}

function run(cmd, args) {
  return spawnSync(cmd, args, { cwd: rootDir, stdio: 'inherit' });
}

function resetClean() {
  fs.copyFileSync(safePkg, targetModule);
  run('node', [cliBin, 'init', '--cwd', demoAppDir, '--cmd', 'node test.js', '--silent']);
}

console.log(`\n\x1b[38;5;45m\x1b[1m◆ Running Scenario:\x1b[0m \x1b[1m${scenario.toUpperCase()}\x1b[0m \x1b[90m(Auto-reverting on completion)\x1b[0m\n`);

try {
  if (scenario === 'safe') {
    resetClean();
    run('node', [cliBin, 'check', '--cwd', demoAppDir, '--cmd', 'node test.js']);
  } else if (scenario === 'attack') {
    resetClean();
    fs.copyFileSync(compromisedPkg, targetModule);
    console.log('\x1b[90mInjected compromised-slug. Running behaviorlock check...\x1b[0m\n');
    run('node', [cliBin, 'check', '--cwd', demoAppDir, '--cmd', 'node test.js']);
  } else if (scenario === 'telemetry') {
    resetClean();
    fs.copyFileSync(telemetryPkg, targetModule);
    console.log('\x1b[90mInjected telemetry-slug. Running behaviorlock check (flags new domain)...\x1b[0m\n');
    run('node', [cliBin, 'check', '--cwd', demoAppDir, '--cmd', 'node test.js']);
    
    console.log('\x1b[90m\nApproving new telemetry endpoint with reason...\x1b[0m');
    run('node', [
      cliBin,
      'approve',
      '4163',
      '--cwd',
      demoAppDir,
      '--cmd',
      'node test.js',
      '--reason',
      'Vendor analytics reviewed and authorized by Dev Lead'
    ]);

    console.log('\x1b[90mRe-verifying against updated contract...\x1b[0m\n');
    run('node', [cliBin, 'check', '--cwd', demoAppDir, '--cmd', 'node test.js']);
  }
} finally {
  // Always safely revert to clean state
  resetClean();
  console.log(`\x1b[38;5;48m✔ State automatically reverted to clean safe baseline.\x1b[0m\n`);
}
