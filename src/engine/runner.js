/**
 * behavior.lock Runner Orchestrator
 * Sets up sandbox environment, plants canaries, runs target, and collects traces.
 */

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CanaryEngine } from '../canary/index.js';
import { Normalizer } from './normalizer.js';
import { KernelTracer } from '../tracer/kernel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function parseCommandLineArgs(cmdString) {
  if (!cmdString) return { cmd: 'npm', args: [] };
  const args = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < cmdString.length; i++) {
    const char = cmdString[i];
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current.length > 0) {
    args.push(current);
  }

  return {
    cmd: args[0] || 'node',
    args: args.slice(1)
  };
}

export function resolveExecutionCommand(cwd, requestedCmd) {
  if (requestedCmd) {
    const { cmd, args } = parseCommandLineArgs(requestedCmd.trim());
    return { cmd, args, display: requestedCmd };
  }

  // 1. Active simulation test payload
  const simFile = path.join(cwd, '_behaviorlock_test.js');
  if (fs.existsSync(simFile)) {
    return { cmd: 'node', args: ['_behaviorlock_test.js'], display: 'node _behaviorlock_test.js' };
  }

  // 2. Local test.js or index.js
  if (fs.existsSync(path.join(cwd, 'test.js'))) {
    const pkgJsonPath = path.join(cwd, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        if (pkg.scripts?.test && !pkg.scripts.test.includes('no test specified')) {
          return { cmd: 'npm', args: ['test'], display: 'npm test' };
        }
      } catch {}
    }
    return { cmd: 'node', args: ['test.js'], display: 'node test.js' };
  }

  if (!fs.existsSync(path.join(cwd, 'package.json'))) {
    if (fs.existsSync(path.join(cwd, 'index.js'))) {
      return { cmd: 'node', args: ['index.js'], display: 'node index.js' };
    }
    if (fs.existsSync(path.join(cwd, 'app.js'))) {
      return { cmd: 'node', args: ['app.js'], display: 'node app.js' };
    }
  }

  return { cmd: 'npm', args: ['test', '--if-present'], display: 'npm test --if-present' };
}

export class Runner {
  constructor(options = {}) {
    this.cwd = path.resolve(options.cwd || process.cwd());
    this.engine = options.engine || 'runtime-hook';
    this.instanceId = options.instanceId || options.instance || Math.random().toString(36).substring(2, 9);
    this.env = options.env || 'prod';
    this.hookPath = path.resolve(__dirname, '../tracer/hook.cjs');
    this.kernelTracer = new KernelTracer(options);
  }

  runPhase(phaseName, command, args = [], options = {}) {
    const traceDir = path.join(this.cwd, '.behaviorlock');
    fs.mkdirSync(traceDir, { recursive: true });
    const traceFile = path.join(traceDir, `trace-${this.instanceId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jsonl`);

    const canary = new CanaryEngine(undefined, this.instanceId);
    const canarySetup = canary.plant();

    const normalizedHook = this.hookPath.replace(/\\/g, '/');
    const env = {
      ...process.env,
      ...canarySetup.envOverrides,
      BEHAVIORLOCK_INSTANCE: this.instanceId,
      BEHAVIORLOCK_ENV: this.env,
      BEHAVIORLOCK_TRACE_FILE: traceFile,
      BEHAVIORLOCK_PHASE: phaseName,
      BEHAVIORLOCK_CANARY_DIR: canarySetup.canaryDir,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require "${normalizedHook}"`.trim()
    };

    let exitCode = 0;
    try {
      if (this.engine === 'kernel-strace' && this.kernelTracer.isAvailable()) {
        const fullCmd = [command, ...args].join(' ');
        this.kernelTracer.runTracedCommand(fullCmd, this.cwd, env, traceFile);
      } else {
        // Execute cleanly without shell parsing issues
        let execCmd = command;
        let execArgs = [...args];
        if (args.length === 0 && command.includes(' ')) {
          const parsed = parseCommandLineArgs(command);
          execCmd = parsed.cmd;
          execArgs = parsed.args;
        }

        const result = spawnSync(execCmd, execArgs, {
          cwd: this.cwd,
          env,
          stdio: options.silent ? 'pipe' : 'inherit'
        });
        exitCode = result.status ?? 0;
      }
    } finally {
      canary.cleanup();
    }

    // Read recorded trace events
    let rawEvents = [];
    if (fs.existsSync(traceFile)) {
      const content = fs.readFileSync(traceFile, 'utf8');
      rawEvents = content
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      // Clean up raw trace file unless DEBUG is set
      if (!process.env.DEBUG) {
        try {
          fs.unlinkSync(traceFile);
        } catch {
          // ignore
        }
      }
    }

    const normalizer = new Normalizer({
      projectDir: this.cwd,
      canaryDir: canarySetup.canaryDir
    });

    const normalizedContract = normalizer.normalizeEvents(rawEvents);

    return {
      exitCode,
      rawEventsCount: rawEvents.length,
      contract: normalizedContract,
      canaryAlerts: rawEvents.filter((e) => e.canary)
    };
  }
}
