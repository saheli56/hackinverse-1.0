/**
 * Command: behaviorlock check
 * Re-runs target in sandbox, compares to behavior.lock, and blocks CI on violation
 */

import path from 'node:path';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import { Runner } from '../engine/runner.js';
import { Differ } from '../engine/differ.js';
import { validateLockfile } from '../types/schema.js';
import { Visualizer } from '../engine/visualizer.js';

export async function commandCheck(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const lockfilePath = path.join(cwd, 'behavior.lock');

  if (!fs.existsSync(lockfilePath)) {
    console.error(`\x1b[31m\x1b[1mError:\x1b[0m No \x1b[1mbehavior.lock\x1b[0m found in ${cwd}`);
    console.error(`Run \x1b[36mbehaviorlock init\x1b[0m first to establish the baseline contract.\n`);
    process.exit(1);
  }

  const lockfileRaw = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  validateLockfile(lockfileRaw);

  Visualizer.printBanner();
  Visualizer.printSessionContext({ cwd, cmd: options.cmd || 'npm test', engine: options.engine });

  const runner = new Runner({ cwd, engine: options.engine });

  let cmd = 'npm';
  let args = ['test', '--if-present'];

  if (options.cmd) {
    const parts = options.cmd.split(' ');
    cmd = parts[0];
    args = parts.slice(1);
  }

  if (!options.silent) {
    Visualizer.printTargetFrameStart(`${cmd} ${args.join(' ')}`);
  }

  const runResult = runner.runPhase('runtime', cmd, args, { silent: options.silent });

  if (!options.silent) {
    Visualizer.printTargetFrameEnd();
  }

  const differ = new Differ(lockfileRaw);
  const diffResult = differ.diff(runResult.contract);

  const targetName = path.basename(cwd);
  Visualizer.renderTerminalReport(diffResult, targetName);

  if (options.open) {
    const { commandUi } = await import('./ui.js');
    await commandUi({ cwd, engine: options.engine, cmd: options.cmd });
  }

  if (!diffResult.passed) {
    process.exitCode = 1;
    return false;
  }

  process.exitCode = 0;
  return true;
}
