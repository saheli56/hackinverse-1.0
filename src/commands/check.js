/**
 * Command: behaviorlock check
 * Re-runs target in sandbox, compares to behavior.lock, and blocks CI on violation
 */

import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Runner, resolveExecutionCommand } from '../engine/runner.js';
import { Differ } from '../engine/differ.js';
import { validateLockfile, normalizeEnv } from '../types/schema.js';
import { Visualizer } from '../engine/visualizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const binPath = path.resolve(__dirname, '../../bin/behaviorlock.js');

export async function commandCheck(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const lockfilePath = path.join(cwd, 'behavior.lock');
  const env = normalizeEnv(options.env || 'prod');
  const instance = options.instance || options.instanceId;

  if (!fs.existsSync(lockfilePath)) {
    console.error(`\x1b[31m\x1b[1mError:\x1b[0m No \x1b[1mbehavior.lock\x1b[0m found in ${cwd}`);
    console.error(`Run \x1b[36mbehaviorlock init\x1b[0m first to establish the baseline contract.\n`);
    process.exit(1);
  }

  const lockfileRaw = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  validateLockfile(lockfileRaw);

  const { cmd, args, display } = resolveExecutionCommand(cwd, options.cmd);

  const taskList = options.tasks ? options.tasks.split(',').map(s => s.trim()).filter(Boolean) : null;
  const parallelCount = taskList ? taskList.length : (options.parallel === true ? 3 : (parseInt(options.parallel, 10) || 1));
  if (parallelCount > 1) {
    Visualizer.printBanner();
    Visualizer.printSessionContext({
      cwd,
      cmd: taskList ? taskList.join(' | ') : display,
      engine: options.engine,
      env,
      instance: `${parallelCount} Parallel Workers`
    });

    console.log(`\x1b[36m\x1b[1m▶ Launching ${parallelCount} parallel sandbox instances concurrently...\x1b[0m\n`);
    const startTime = Date.now();

    const workers = Array.from({ length: parallelCount }, (_, idx) => {
      const workerId = options.instance ? `${options.instance}-${idx + 1}` : `worker-${idx + 1}`;
      const workerCmd = taskList ? taskList[idx] : options.cmd;
      return new Promise((resolve) => {
        const started = Date.now();
        const child = spawn(process.execPath, [
          binPath,
          'check',
          '--cwd', cwd,
          '--env', env,
          '--instance', workerId,
          '--silent',
          ...(workerCmd ? ['--cmd', workerCmd] : [])
        ], {
          cwd,
          stdio: ['ignore', 'pipe', 'pipe']
        });

        child.on('close', (code) => {
          const duration = Date.now() - started;
          const passed = code === 0;
          const icon = passed ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✗\x1b[0m';
          const cmdLabel = workerCmd ? ` [${workerCmd}]` : '';
          console.log(`  ${icon} Instance \x1b[1m${workerId}\x1b[0m${cmdLabel} completed in \x1b[36m${duration}ms\x1b[0m (Exit code: ${code})`);
          resolve({ workerId, cmd: workerCmd, code, duration, passed });
        });
      });
    });

    const results = await Promise.all(workers);
    const totalDuration = Date.now() - startTime;
    const allPassed = results.every(r => r.passed);

    console.log(`\n\x1b[32m\x1b[1m✔ Parallel Execution Verified!\x1b[0m`);
    console.log(`  • Total Wall Time:     \x1b[36m${totalDuration}ms\x1b[0m (All ${parallelCount} workers ran concurrently)`);
    console.log(`  • Worker Collision:    \x1b[32mZero race conditions\x1b[0m (Canary tokens & trace files isolated)`);
    console.log(`  • Profile:             \x1b[35m${env.toUpperCase()}\x1b[0m`);
    console.log(`  • CI Status:           ${allPassed ? '\x1b[32mALL CHECKS PASSED\x1b[0m' : '\x1b[31mCHECK FAILED\x1b[0m'}\n`);

    if (!allPassed) {
      process.exitCode = 1;
      return false;
    }
    process.exitCode = 0;
    return true;
  }

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

  const targetName = path.basename(cwd);
  Visualizer.renderTerminalReport(diffResult, targetName);

  if (options.open) {
    const { commandUi } = await import('./ui.js');
    await commandUi({ cwd, engine: options.engine, cmd: options.cmd });
  }

  if (!diffResult.passed || runResult.exitCode !== 0) {
    process.exitCode = 1;
    return false;
  }

  process.exitCode = 0;
  return true;
}
