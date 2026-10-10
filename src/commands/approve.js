/**
 * Command: behaviorlock approve <id> --reason "..."
 * Adds authorized behavior to behavior.lock with an audit trail
 */

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { Runner } from '../engine/runner.js';
import { Differ } from '../engine/differ.js';
import { stringifyLockfile, validateLockfile } from '../types/schema.js';
import { Visualizer } from '../engine/visualizer.js';

export async function commandApprove(id, options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const lockfilePath = path.join(cwd, 'behavior.lock');

  if (!id) {
    console.error('\x1b[31m\x1b[1mError:\x1b[0m Missing violation ID to approve.');
    console.error('Usage: behaviorlock approve <id> --reason "Why this is allowed"\n');
    process.exit(1);
  }

  if (!options.reason) {
    console.error('\x1b[31m\x1b[1mError:\x1b[0m A written --reason is strictly required for audit trails.');
    console.error(`Example: behaviorlock approve ${id} --reason "Vendor telemetry verified by secops"\n`);
    process.exit(1);
  }

  if (!fs.existsSync(lockfilePath)) {
    console.error(`\x1b[31m\x1b[1mError:\x1b[0m No behavior.lock found in ${cwd}\n`);
    process.exit(1);
  }

  const lockfileRaw = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  validateLockfile(lockfileRaw);

  Visualizer.printBanner();

  // Re-run to locate the violation matching the ID
  const runner = new Runner({ cwd, engine: options.engine });
  let cmd = 'npm';
  let args = ['test', '--if-present'];
  if (options.cmd) {
    const parts = options.cmd.split(' ');
    cmd = parts[0];
    args = parts.slice(1);
  }

  const runResult = runner.runPhase('runtime', cmd, args, { silent: true });
  const differ = new Differ(lockfileRaw);
  const diffResult = differ.diff(runResult.contract);

  const targetViolation = diffResult.violations.find((v) => v.id === id);

  if (!targetViolation) {
    console.error(`\x1b[31m\x1b[1mError:\x1b[0m No active violation found with ID '${id}'.`);
    console.error(`Run \x1b[36mbehaviorlock check\x1b[0m to list current violation IDs.\n`);
    process.exit(1);
  }

  const signalKey = targetViolation.type.startsWith('NETWORK')
    ? 'network'
    : targetViolation.type.startsWith('FS')
    ? 'fs_read'
    : targetViolation.type.startsWith('PROCESS')
    ? 'exec'
    : 'other';

  const approvalRecord = {
    id: targetViolation.id,
    package: targetViolation.package,
    allow: {
      [signalKey]: [targetViolation.target]
    },
    reason: options.reason,
    approved_by: process.env.USER || process.env.USERNAME || os.userInfo().username || 'developer',
    approved_at: new Date().toISOString().split('T')[0],
    expires: options.expires || null
  };

  lockfileRaw.approvals = lockfileRaw.approvals || [];
  lockfileRaw.approvals.push(approvalRecord);

  fs.writeFileSync(lockfilePath, stringifyLockfile(lockfileRaw), 'utf8');

  Visualizer.renderApprovalReceipt(approvalRecord);
}
