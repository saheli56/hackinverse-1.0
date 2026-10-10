/**
 * Command: behaviorlock check
 * Re-runs target in sandbox, compares to behavior.lock, and blocks CI on violation
 */

import path from 'node:path';
import fs from 'node:fs';
import { Runner } from '../engine/runner.js';
import { Differ } from '../engine/differ.js';
import { validateLockfile } from '../types/schema.js';
import { Visualizer } from '../engine/visualizer.js';

export async function commandCheck(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const lockfilePath = path.join(cwd, 'behavior.lock');

  if (!fs.existsSync(lockfilePath)) {
    console.error(`\x1b[31mError: No behavior.lock found in ${cwd}\x1b[0m`);
    console.error(`Run \x1b[36mbehaviorlock init\x1b[0m first to establish the baseline.`);
    process.exit(1);
  }

  const lockfileRaw = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  validateLockfile(lockfileRaw);

  Visualizer.printBanner();
  console.log(`\x1b[36mChecking behavior contract in:\x1b[0m ${cwd}`);

  const runner = new Runner({ cwd, engine: options.engine });

  let cmd = 'npm';
  let args = ['test', '--if-present'];

  if (options.cmd) {
    const parts = options.cmd.split(' ');
    cmd = parts[0];
    args = parts.slice(1);
  }

  console.log(`\x1b[2mExecuting target under sandbox tracer (${cmd} ${args.join(' ')})...\x1b[0m\n`);

  const runResult = runner.runPhase('runtime', cmd, args, { silent: options.silent });

  const differ = new Differ(lockfileRaw);
  const diffResult = differ.diff(runResult.contract);

  const targetName = path.basename(cwd);
  Visualizer.renderTerminalReport(diffResult, targetName);

  // Generate visual HTML report
  const htmlPath = path.join(cwd, 'behavior.html');
  Visualizer.generateHtmlReport(diffResult, runResult.contract, htmlPath);
  console.log(`\x1b[2mVisual graph report generated at: file://${htmlPath.replace(/\\/g, '/')}\x1b[0m\n`);

  if (!diffResult.passed) {
    process.exitCode = 1;
    return false;
  }

  process.exitCode = 0;
  return true;
}
