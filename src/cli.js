/**
 * behaviorlock CLI Dispatcher
 */

import { commandInit } from './commands/init.js';
import { commandCheck } from './commands/check.js';
import { commandApprove } from './commands/approve.js';
import { commandDiff } from './commands/diff.js';

export async function runCLI(args = process.argv.slice(2)) {
  const parsed = parseArgs(args);

  if (parsed.flags.version || parsed.flags.v) {
    console.log('behaviorlock v1.0.0 (October 2026)');
    return;
  }

  if (parsed.flags.help || parsed.flags.h || parsed.command === 'help' || !parsed.command) {
    printHelp();
    return;
  }

  const options = {
    cwd: parsed.flags.cwd || process.cwd(),
    engine: parsed.flags.engine || 'runtime-hook',
    cmd: parsed.flags.cmd,
    silent: parsed.flags.silent || false,
    reason: parsed.flags.reason,
    expires: parsed.flags.expires,
    visual: parsed.flags.visual ?? true
  };

  switch (parsed.command) {
    case 'init':
      await commandInit(options);
      break;
    case 'check':
      await commandCheck(options);
      break;
    case 'approve':
      await commandApprove(parsed.positionals[0], options);
      break;
    case 'diff':
      await commandDiff(options);
      break;
    default:
      console.error(`\x1b[31mUnknown command: ${parsed.command}\x1b[0m\n`);
      printHelp();
      process.exit(1);
  }
}

function parseArgs(args) {
  const flags = {};
  const positionals = [];
  let command = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const equalIndex = arg.indexOf('=');
      if (equalIndex !== -1) {
        const key = arg.slice(2, equalIndex);
        flags[key] = arg.slice(equalIndex + 1);
      } else {
        const key = arg.slice(2);
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          flags[key] = args[i + 1];
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      flags[key] = true;
    } else if (!command) {
      command = arg;
    } else {
      positionals.push(arg);
    }
  }

  return { command, positionals, flags };
}

function printHelp() {
  console.log(`
\x1b[36m\x1b[1mbehaviorlock\x1b[0m - A lockfile for what your software does.

\x1b[1mUSAGE:\x1b[0m
  behaviorlock <command> [options]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[36minit\x1b[0m                  Runs the target in sandbox, records baseline behavior, and writes behavior.lock
  \x1b[36mcheck\x1b[0m                 Re-runs in sandbox and verifies against behavior.lock (fails with exit 1 on violation)
  \x1b[36mapprove <id>\x1b[0m          Signs an authorized behavior into behavior.lock with a required audit reason
  \x1b[36mdiff\x1b[0m                  Inspects divergences between observed behavior and behavior.lock without blocking

\x1b[1mOPTIONS:\x1b[0m
  --cwd <path>          Working directory of target project (default: current directory)
  --cmd "<command>"     Target test or execution command (default: "npm test --if-present")
  --engine <engine>     Sandbox engine: 'runtime-hook' (fast, cross-platform) or 'kernel-strace' (Linux/WSL)
  --reason "<text>"     Audit justification required when approving a violation
  --expires "<date>"    Optional expiration date for approval (e.g. 2027-01-01)
  --silent              Suppress target stdout during tracing
  -v, --version         Show CLI version
  -h, --help            Show help documentation

\x1b[1mEXAMPLES:\x1b[0m
  behaviorlock init
  behaviorlock check
  behaviorlock approve a1f3 --reason "Vendor documents opt-out telemetry; reviewed by dev lead"
`);
}
