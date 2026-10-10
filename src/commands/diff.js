/**
 * Command: behaviorlock diff
 * Inspects behavior divergence between current sandbox and behavior.lock
 */

import path from 'node:path';
import fs from 'node:fs';
import { Runner } from '../engine/runner.js';
import { Differ } from '../engine/differ.js';
import { validateLockfile } from '../types/schema.js';
import { Visualizer } from '../engine/visualizer.js';

export async function commandDiff(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const lockfilePath = path.join(cwd, 'behavior.lock');

  if (!fs.existsSync(lockfilePath)) {
    console.error(`\x1b[31mError: No behavior.lock found in ${cwd}\x1b[0m`);
    process.exit(1);
  }

  const lockfileRaw = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  validateLockfile(lockfileRaw);

  Visualizer.printBanner();
  console.log(`\x1b[36mComparing observed behavior against lockfile:\x1b[0m ${cwd}\n`);

  const runner = new Runner({ cwd, engine: options.engine });
  let cmd = 'npm';
  let args = ['test', '--if-present'];
  if (options.cmd) {
    const parts = options.cmd.split(' ');
    cmd = parts[0];
    args = parts.slice(1);
  }

  const runResult = runner.runPhase('runtime', cmd, args, { silent: options.silent });
  const differ = new Differ(lockfileRaw);
  const diffResult = differ.diff(runResult.contract);

  Visualizer.renderTerminalReport(diffResult, path.basename(cwd));
}
