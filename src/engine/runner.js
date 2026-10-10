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

export class Runner {
  constructor(options = {}) {
    this.cwd = path.resolve(options.cwd || process.cwd());
    this.engine = options.engine || 'runtime-hook';
    this.hookPath = path.resolve(__dirname, '../tracer/hook.cjs');
    this.kernelTracer = new KernelTracer(options);
  }

  runPhase(phaseName, command, args = [], options = {}) {
    const traceDir = path.join(this.cwd, '.behaviorlock');
    fs.mkdirSync(traceDir, { recursive: true });
    const traceFile = path.join(traceDir, `trace-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jsonl`);

    const canary = new CanaryEngine();
    const canarySetup = canary.plant();

    const normalizedHook = this.hookPath.replace(/\\/g, '/');
    const env = {
      ...process.env,
      ...canarySetup.envOverrides,
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
          const parts = command.split(' ');
          execCmd = parts[0];
          execArgs = parts.slice(1);
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
