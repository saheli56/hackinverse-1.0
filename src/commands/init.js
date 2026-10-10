/**
 * Command: behaviorlock init
 * Runs target in sandbox, records baseline behavior, and writes behavior.lock
 */

import path from 'node:path';
import fs from 'node:fs';
import { Runner } from '../engine/runner.js';
import { createEmptyLockfile, stringifyLockfile } from '../types/schema.js';
import { Visualizer } from '../engine/visualizer.js';

export async function commandInit(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const lockfilePath = path.join(cwd, 'behavior.lock');

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

  const lockfile = createEmptyLockfile({ engine: options.engine });
  lockfile.packages = runResult.contract;

  fs.writeFileSync(lockfilePath, stringifyLockfile(lockfile), 'utf8');

  const pkgCount = Object.keys(lockfile.packages).length;
  Visualizer.renderInitSuccess(
    {
      lockfilePath,
      packageCount: pkgCount,
      rawEventsCount: runResult.rawEventsCount,
      engine: options.engine
    },
    lockfile.packages
  );
}
