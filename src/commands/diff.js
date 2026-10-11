/**
 * Command: behaviorlock diff
 * Inspects behavior divergence between current sandbox and behavior.lock
 */

import path from 'node:path';
import fs from 'node:fs';
import { Runner, resolveExecutionCommand } from '../engine/runner.js';
import { Differ } from '../engine/differ.js';
import { validateLockfile, normalizeEnv } from '../types/schema.js';
import { Visualizer } from '../engine/visualizer.js';

export async function commandDiff(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const lockfilePath = path.join(cwd, 'behavior.lock');
  const env = normalizeEnv(options.env || 'prod');
  const instance = options.instance || options.instanceId;

  if (!fs.existsSync(lockfilePath)) {
    console.error(`\x1b[31m\x1b[1mError:\x1b[0m No \x1b[1mbehavior.lock\x1b[0m found in ${cwd}`);
    process.exit(1);
  }

  const lockfileRaw = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  validateLockfile(lockfileRaw);

  const { cmd, args, display } = resolveExecutionCommand(cwd, options.cmd);

  Visualizer.printBanner();
  Visualizer.printSessionContext({ cwd, cmd: display, engine: options.engine, env, instance });

  const runner = new Runner({ cwd, engine: options.engine, env, instanceId: instance });

  if (!options.silent) {
    Visualizer.printTargetFrameStart(`${cmd} ${args.join(' ')}`);
  }

  const runResult = runner.runPhase('runtime', cmd, args, { silent: options.silent });

  if (!options.silent) {
    Visualizer.printTargetFrameEnd();
  }

  const differ = new Differ(lockfileRaw, env);
  const diffResult = differ.diff(runResult.contract);

  Visualizer.renderTerminalReport(diffResult, path.basename(cwd));
}
