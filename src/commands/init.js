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
  console.log(`\x1b[36mInitializing behavior contract for:\x1b[0m ${cwd}`);

  const runner = new Runner({ cwd, engine: options.engine });

  // Determine run target: npm test or custom script or node entry
  let cmd = 'npm';
  let args = ['test', '--if-present'];

  if (options.cmd) {
    const parts = options.cmd.split(' ');
    cmd = parts[0];
    args = parts.slice(1);
  }

  console.log(`\x1b[2mExecuting target under sandbox tracer (${cmd} ${args.join(' ')})...\x1b[0m\n`);

  const runResult = runner.runPhase('runtime', cmd, args, { silent: options.silent });

  const lockfile = createEmptyLockfile({ engine: options.engine });
  lockfile.packages = runResult.contract;

  fs.writeFileSync(lockfilePath, stringifyLockfile(lockfile), 'utf8');

  const pkgCount = Object.keys(lockfile.packages).length;
  console.log(`
\x1b[32m\x1b[1m✓ SUCCESS: behavior.lock initialized successfully!\x1b[0m
  \x1b[2mPath:\x1b[0m             ${lockfilePath}
  \x1b[2mPackages Traced:\x1b[0m  ${pkgCount}
  \x1b[2mRaw Events:\x1b[0m       ${runResult.rawEventsCount}

\x1b[33mNext step:\x1b[0m Commit \x1b[1mbehavior.lock\x1b[0m to your git repository.
Run \x1b[36mbehaviorlock check\x1b[0m in CI to enforce the contract on every update.
`);
}
