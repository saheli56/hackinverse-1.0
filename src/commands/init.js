/**
 * Command: behaviorlock init
 * Runs target in sandbox, records baseline behavior, and writes behavior.lock
 */

import path from 'node:path';
import fs from 'node:fs';
import { Runner, resolveExecutionCommand } from '../engine/runner.js';
import { createEmptyLockfile, stringifyLockfile, setPackagesForEnvironment, getPackagesForEnvironment, normalizeEnv } from '../types/schema.js';
import { Visualizer } from '../engine/visualizer.js';

export async function commandInit(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const lockfilePath = path.join(cwd, 'behavior.lock');
  const env = normalizeEnv(options.env || 'prod');
  const instance = options.instance || options.instanceId;

  const { cmd, args, display } = resolveExecutionCommand(cwd, options.cmd);

  if (!options.silent) {
    Visualizer.printBanner();
    Visualizer.printSessionContext({ cwd, cmd: display, engine: options.engine, env, instance });
  }

  const runner = new Runner({ cwd, engine: options.engine, env, instanceId: instance });

  if (!options.silent) {
    Visualizer.printTargetFrameStart(`${cmd} ${args.join(' ')}`);
  }

  const runResult = runner.runPhase('runtime', cmd, args, { silent: options.silent });

  if (!options.silent) {
    Visualizer.printTargetFrameEnd();
  }

  let lockfile;
  if (fs.existsSync(lockfilePath)) {
    try {
      lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
    } catch {
      lockfile = createEmptyLockfile({ engine: options.engine });
    }
  } else {
    lockfile = createEmptyLockfile({ engine: options.engine });
  }

  setPackagesForEnvironment(lockfile, env, runResult.contract);
  fs.writeFileSync(lockfilePath, stringifyLockfile(lockfile), 'utf8');

  if (!options.silent) {
    const packages = getPackagesForEnvironment(lockfile, env);
    const pkgCount = Object.keys(packages).length;
    Visualizer.renderInitSuccess(
      {
        lockfilePath,
        packageCount: pkgCount,
        rawEventsCount: runResult.rawEventsCount,
        engine: options.engine
      },
      packages
    );
  }
}
