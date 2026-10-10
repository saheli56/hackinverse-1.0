/**
 * behaviorlock CLI Dispatcher
 */

import { commandInit } from './commands/init.js';
import { commandCheck } from './commands/check.js';
import { commandApprove } from './commands/approve.js';
import { commandDiff } from './commands/diff.js';
import { commandUi } from './commands/ui.js';

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
    case 'ui':
    case 'dashboard':
      await commandUi(options);
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
\x1b[1mbehavior.lock\x1b[0m \x1b[90m- Runtime security capability lockfile\x1b[0m

\x1b[1mUSAGE:\x1b[0m
  behaviorlock \x1b[90m<command> [flags]\x1b[0m

\x1b[1mCOMMANDS:\x1b[0m
  init            Run target in sandbox and record baseline behavior.lock
  check           Verify execution against behavior.lock (fails CI on breach)
  approve <id>    Sign an approved behavioral change with an audit reason
  diff            Inspect behavioral drift without blocking
  ui              Open interactive React Security Dashboard in browser

\x1b[1mFLAGS:\x1b[0m
  --cwd <path>          Target directory \x1b[90m(default: .)\x1b[0m
  --cmd "<command>"     Execution/test command \x1b[90m(default: "npm test --if-present")\x1b[0m
  --engine <name>       Sandbox engine: \x1b[90m'runtime-hook' or 'kernel-strace'\x1b[0m
  --reason "<text>"     Audit justification required for approve
  --expires "<date>"    Optional expiration date \x1b[90m(e.g. 2027-01-01)\x1b[0m
  --open                Open the React Security Report in browser automatically
  --silent              Suppress target stdout during tracing
  -v, --version         Show version
  -h, --help            Show help

\x1b[1mEXAMPLES:\x1b[0m
  \x1b[90m$ \x1b[0mbehaviorlock init
  \x1b[90m$ \x1b[0mbehaviorlock check
  \x1b[90m$ \x1b[0mbehaviorlock approve 4163 --reason "Vendor analytics reviewed and authorized"
`);
}
