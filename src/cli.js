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
    console.log('\x1b[36m\x1b[1mbehaviorlock\x1b[0m v1.0.0 (October 2026)');
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
      console.error(`\x1b[31m\x1b[1mUnknown command:\x1b[0m ${parsed.command}\n`);
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
\x1b[36m\x1b[1m🔒 behavior.lock\x1b[0m \x1b[90m·\x1b[0m \x1b[2mRuntime Behavioral Contract Sandbox\x1b[0m

\x1b[1mUSAGE:\x1b[0m
  \x1b[36mbehaviorlock\x1b[0m \x1b[33m<command>\x1b[0m [options]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[36minit\x1b[0m                  Runs sandbox baseline, captures behavior, and writes \x1b[1mbehavior.lock\x1b[0m
  \x1b[36mcheck\x1b[0m                 Verifies current execution against contract (\x1b[31mfails CI on breach\x1b[0m)
  \x1b[36mapprove\x1b[0m \x1b[33m<id>\x1b[0m          Cryptographically signs approved behavior with a written audit reason
  \x1b[36mdiff\x1b[0m                  Non-blocking behavioral inspection and divergence diffing

\x1b[1mOPTIONS:\x1b[0m
  \x1b[33m--cwd\x1b[0m \x1b[2m<path>\x1b[0m          Target project directory \x1b[90m(default: current directory)\x1b[0m
  \x1b[33m--cmd\x1b[0m \x1b[2m"<command>"\x1b[0m     Custom execution/test command \x1b[90m(default: "npm test --if-present")\x1b[0m
  \x1b[33m--engine\x1b[0m \x1b[2m<name>\x1b[0m       Sandbox engine: \x1b[36m'runtime-hook'\x1b[0m (fast) or \x1b[36m'kernel-strace'\x1b[0m (Linux/WSL)
  \x1b[33m--reason\x1b[0m \x1b[2m"<text>"\x1b[0m     Audit justification required when running \x1b[36mapprove\x1b[0m
  \x1b[33m--expires\x1b[0m \x1b[2m"<date>"\x1b[0m   Optional expiration date for approval \x1b[90m(e.g. 2027-01-01)\x1b[0m
  \x1b[33m--silent\x1b[0m              Suppress target application stdout during tracing
  \x1b[33m-v, --version\x1b[0m         Show version information
  \x1b[33m-h, --help\x1b[0m            Show this help guide

\x1b[1mEXAMPLES:\x1b[0m
  \x1b[90m$ \x1b[0m\x1b[36mbehaviorlock init\x1b[0m
  \x1b[90m$ \x1b[0m\x1b[36mbehaviorlock check\x1b[0m
  \x1b[90m$ \x1b[0m\x1b[36mbehaviorlock approve 4163 --reason "Documented vendor telemetry reviewed by SecOps"\x1b[0m
`);
}
