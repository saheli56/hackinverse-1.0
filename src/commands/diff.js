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
    console.error(`\x1b[31m\x1b[1mError:\x1b[0m No \x1b[1mbehavior.lock\x1b[0m found in ${cwd}`);
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

  Visualizer.renderTerminalReport(diffResult, path.basename(cwd));
}
