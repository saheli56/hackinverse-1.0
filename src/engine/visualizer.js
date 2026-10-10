/**
 * behavior.lock Visualizer & Reporter
 * High-polish Terminal UI + Table/Chart Matrix + Interactive HTML Graph Report
 */

import fs from 'node:fs';
import path from 'node:path';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  
  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Bright Foreground
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgDarkGray: '\x1b[100m'
};

export class Visualizer {
  static printBanner() {
    console.log(`\n${ANSI.brightCyan}${ANSI.bold}🔒 behavior.lock${ANSI.reset} ${ANSI.gray}·${ANSI.reset} ${ANSI.dim}Runtime Behavioral Contract Sandbox v1.0${ANSI.reset}`);
  }

  static printSessionContext(info = {}) {
    const cwd = info.cwd || process.cwd();
    const cmd = info.cmd || 'npm test';
    const engine = info.engine === 'kernel-strace' ? 'Kernel strace (Linux/WSL2)' : 'V8 Runtime Preload Hook';

    console.log(`${ANSI.gray}╭─ Execution Context ───────────────────────────────────────────${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Target:${ANSI.reset}  ${ANSI.bold}${path.basename(cwd)}${ANSI.reset} ${ANSI.gray}(${cwd})${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Command:${ANSI.reset} ${ANSI.cyan}${cmd}${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Engine:${ANSI.reset}  ${ANSI.dim}${engine}${ANSI.reset}`);
    console.log(`${ANSI.gray}╰───────────────────────────────────────────────────────────────${ANSI.reset}\n`);
  }

  static printTargetFrameStart(cmdStr) {
    console.log(`${ANSI.gray}┌── Sandbox Execution Output ────────────────────────────────────${ANSI.reset}`);
  }

  static printTargetFrameEnd() {
    console.log(`${ANSI.gray}└── End Sandbox Output ──────────────────────────────────────────${ANSI.reset}\n`);
  }

  /**
   * Renders an ASCII horizontal metric bar chart
   */
  static renderChartBar(label, count, maxCount = 10, isDanger = false, isWarn = false) {
    const width = 14;
    const filled = Math.min(width, Math.max(0, Math.round((count / (maxCount || 1)) * width)));
    const empty = width - filled;
    
    let color = ANSI.green;
    if (isDanger) color = ANSI.brightRed;
    else if (isWarn) color = ANSI.brightYellow;

    const bar = `${color}${'■'.repeat(filled)}${ANSI.gray}${'░'.repeat(empty)}${ANSI.reset}`;
    const paddedLabel = label.padEnd(18, ' ');
    return `  ${ANSI.dim}${paddedLabel}${ANSI.reset} [${bar}] ${color}${ANSI.bold}${count}${ANSI.reset}`;
  }

  /**
   * Renders a structured Unicode Table for Violations
   */
  static renderViolationsTable(violations) {
    if (!violations || violations.length === 0) return;

    console.log(`${ANSI.bold}┌────────┬──────────┬──────────────────┬─────────────────────────────┬───────────────────────────┐${ANSI.reset}`);
    console.log(`${ANSI.bold}│ ID     │ SEVERITY │ PACKAGE          │ TARGET / SYSCALL            │ CAPABILITY THREAT CLASS   │${ANSI.reset}`);
    console.log(`${ANSI.bold}├────────┼──────────┼──────────────────┼─────────────────────────────┼───────────────────────────┤${ANSI.reset}`);

    for (const v of violations) {
      let sevColor = ANSI.brightRed;
      let sevText = 'CRITICAL';
      if (v.severity === 'HIGH') {
        sevColor = ANSI.brightYellow;
        sevText = 'HIGH    ';
      } else if (v.severity === 'MEDIUM') {
        sevColor = ANSI.cyan;
        sevText = 'MEDIUM  ';
      }

      const id = String(v.id || '').padEnd(6, ' ');
      const pkg = String(v.package || '').slice(0, 16).padEnd(16, ' ');
      const target = String(v.target || '').slice(0, 27).padEnd(27, ' ');
      const type = String(v.type || '').slice(0, 25).padEnd(25, ' ');

      console.log(`│ ${ANSI.brightCyan}${id}${ANSI.reset} │ ${sevColor}${sevText}${ANSI.reset} │ ${ANSI.bold}${pkg}${ANSI.reset} │ ${target} │ ${type} │`);
    }

    console.log(`${ANSI.bold}└────────┴──────────┴──────────────────┴─────────────────────────────┴───────────────────────────┘${ANSI.reset}\n`);
  }

  /**
   * Renders a capability matrix table for packages in lockfile
   */
  static renderCapabilityMatrix(packages) {
    console.log(`${ANSI.bold}┌──────────────────────┬─────────────┬─────────────┬─────────────┬─────────────┐${ANSI.reset}`);
    console.log(`${ANSI.bold}│ Package              │ Network     │ FS Read     │ FS Write    │ Child Exec  │${ANSI.reset}`);
    console.log(`${ANSI.bold}├──────────────────────┼─────────────┼─────────────┼─────────────┼─────────────┤${ANSI.reset}`);

    for (const [pkg, data] of Object.entries(packages)) {
      const pName = pkg.slice(0, 20).padEnd(20, ' ');
      const net = (data.runtime?.network?.length ? `${data.runtime.network.length} host(s)` : 'none').padEnd(11, ' ');
      const fsR = (data.runtime?.fs_read?.length ? `${data.runtime.fs_read.length} file(s)` : 'none').padEnd(11, ' ');
      const fsW = (data.runtime?.fs_write?.length ? `${data.runtime.fs_write.length} file(s)` : 'none').padEnd(11, ' ');
      const exec = (data.runtime?.exec?.length ? `${data.runtime.exec.length} cmd(s)` : 'none').padEnd(11, ' ');

      console.log(`│ ${ANSI.cyan}${pName}${ANSI.reset} │ ${net} │ ${fsR} │ ${fsW} │ ${exec} │`);
    }

    console.log(`${ANSI.bold}└──────────────────────┴─────────────┴─────────────┴─────────────┴─────────────┘${ANSI.reset}\n`);
  }

  static renderTerminalReport(diffResult, targetName = 'app') {
    if (diffResult.passed) {
      console.log(`${ANSI.bgGreen}${ANSI.black}${ANSI.bold}  ✔ BEHAVIOR CONTRACT VERIFIED  ${ANSI.reset} ${ANSI.bold}${targetName}${ANSI.reset}`);
      console.log(`${ANSI.green}Zero unauthorized behavioral drift detected.${ANSI.reset}`);
      
      console.log(`\n${ANSI.gray}╭─ Runtime Capability Breakdown (Chart) ────────────────────────${ANSI.reset}`);
      console.log(this.renderChartBar('Outbound Network', 0, 5, false, false));
      console.log(this.renderChartBar('Decoy Canaries', 0, 5, false, false));
      console.log(this.renderChartBar('Process Spawns', 0, 5, false, false));
      console.log(this.renderChartBar('File System Access', 0, 5, false, false));
      console.log(`${ANSI.gray}╰───────────────────────────────────────────────────────────────${ANSI.reset}\n`);

      console.log(`${ANSI.gray}╭─ Verification Summary ─────────────────────────────────────────${ANSI.reset}`);
      console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.green}✔${ANSI.reset} ${ANSI.bold}Network:${ANSI.reset}     All outbound requests match approved endpoints`);
      console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.green}✔${ANSI.reset} ${ANSI.bold}Filesystem:${ANSI.reset}  No external/sensitive paths accessed`);
      console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.green}✔${ANSI.reset} ${ANSI.bold}Processes:${ANSI.reset}   No unapproved child processes spawned`);
      console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.green}✔${ANSI.reset} ${ANSI.bold}Canaries:${ANSI.reset}    Decoy credentials untouched (0 breaches)`);
      if (diffResult.approvedMatches?.length > 0) {
        console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.cyan}ℹ${ANSI.reset} ${ANSI.bold}Overrides:${ANSI.reset}   ${diffResult.approvedMatches.length} approved rule(s) active`);
      }
      console.log(`${ANSI.gray}╰───────────────────────────────────────────────────────────────${ANSI.reset}\n`);
      return;
    }

    // BREACH REPORT
    console.log(`${ANSI.bgRed}${ANSI.brightWhite}${ANSI.bold}  🚨 BEHAVIOR CONTRACT BREACH DETECTED  ${ANSI.reset} ${ANSI.bold}${targetName}${ANSI.reset}`);
    
    // Summary Pills
    const critBadge = diffResult.summary.critical > 0
      ? `${ANSI.bgRed}${ANSI.brightWhite}${ANSI.bold} ${diffResult.summary.critical} CRITICAL ${ANSI.reset}`
      : `${ANSI.gray}0 Critical${ANSI.reset}`;
    const highBadge = diffResult.summary.high > 0
      ? `${ANSI.bgYellow}${ANSI.black}${ANSI.bold} ${diffResult.summary.high} HIGH ${ANSI.reset}`
      : `${ANSI.gray}0 High${ANSI.reset}`;
    const medBadge = diffResult.summary.medium > 0
      ? `${ANSI.bgCyan}${ANSI.black}${ANSI.bold} ${diffResult.summary.medium} MEDIUM ${ANSI.reset}`
      : `${ANSI.gray}0 Medium${ANSI.reset}`;

    console.log(`\n${ANSI.bold}Violations Summary:${ANSI.reset}  ${critBadge}  ${highBadge}  ${medBadge}\n`);

    // 1. Table View of Threat Signals
    console.log(`${ANSI.bold}Threat Signals Table:${ANSI.reset}`);
    this.renderViolationsTable(diffResult.violations);

    // 2. Chart View of Threat Vectors
    console.log(`${ANSI.gray}╭─ Threat Vector Distribution (Chart) ──────────────────────────${ANSI.reset}`);
    console.log(this.renderChartBar('Canary Breaches', diffResult.summary.critical, Math.max(5, diffResult.summary.critical), true));
    console.log(this.renderChartBar('Network Anomaly', diffResult.summary.high, Math.max(5, diffResult.summary.high), false, true));
    console.log(this.renderChartBar('Process Spawns', diffResult.violations.filter(v => v.type === 'PROCESS_SPAWN').length, 5, false, true));
    console.log(this.renderChartBar('Filesystem Access', diffResult.violations.filter(v => v.type === 'FS_READ_ANOMALY').length, 5, false, false));
    console.log(`${ANSI.gray}╰───────────────────────────────────────────────────────────────${ANSI.reset}\n`);

    // 3. Detailed Per-Violation Breakdown Cards
    for (let i = 0; i < diffResult.violations.length; i++) {
      const v = diffResult.violations[i];
      let headerBorder = ANSI.red;
      let badge = `${ANSI.bgRed}${ANSI.brightWhite}${ANSI.bold} CRITICAL ${ANSI.reset}`;

      if (v.severity === 'HIGH') {
        headerBorder = ANSI.yellow;
        badge = `${ANSI.bgYellow}${ANSI.black}${ANSI.bold} HIGH ${ANSI.reset}`;
      } else if (v.severity === 'MEDIUM') {
        headerBorder = ANSI.cyan;
        badge = `${ANSI.bgCyan}${ANSI.black}${ANSI.bold} MEDIUM ${ANSI.reset}`;
      }

      console.log(`${headerBorder}╭─ Breach #${i + 1} ${badge} ${ANSI.bold}${v.type}${ANSI.reset} ${ANSI.gray}(ID: ${ANSI.brightCyan}${v.id}${ANSI.gray})${headerBorder}───${ANSI.reset}`);
      console.log(`${headerBorder}│${ANSI.reset}  ${ANSI.dim}Package:${ANSI.reset}     ${ANSI.bold}${v.package}${ANSI.reset} ${ANSI.gray}(phase: ${v.phase})${ANSI.reset}`);
      console.log(`${headerBorder}│${ANSI.reset}  ${ANSI.dim}Syscall/Path:${ANSI.reset} ${ANSI.brightYellow}${v.target}${ANSI.reset}`);
      console.log(`${headerBorder}│${ANSI.reset}  ${ANSI.dim}Message:${ANSI.reset}     ${v.message}`);
      console.log(`${headerBorder}│${ANSI.reset}  ${ANSI.dim}Remediation:${ANSI.reset} ${ANSI.italic}${v.remediation}${ANSI.reset}`);
      console.log(`${headerBorder}╰───────────────────────────────────────────────────────────────${ANSI.reset}\n`);
    }

    console.log(`${ANSI.gray}╭─ Action Plan & Resolution ────────────────────────────────────${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.brightCyan}${ANSI.bold}1. Authorize legitimate change:${ANSI.reset}`);
    const firstId = diffResult.violations[0]?.id || '<id>';
    console.log(`${ANSI.gray}│${ANSI.reset}     ${ANSI.cyan}behaviorlock approve ${firstId} --reason "Documented vendor telemetry"${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.brightRed}${ANSI.bold}2. Reject malicious dependency update:${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}     ${ANSI.red}npm rollback / git restore package.json package-lock.json${ANSI.reset}`);
    console.log(`${ANSI.gray}╰───────────────────────────────────────────────────────────────${ANSI.reset}\n`);
  }

  static renderApprovalReceipt(approvalRecord) {
    console.log(`${ANSI.bgGreen}${ANSI.black}${ANSI.bold}  ✔ VIOLATION APPROVED & RECORDED  ${ANSI.reset}\n`);
    console.log(`${ANSI.gray}╭─ Signed Contract Entry ───────────────────────────────────────${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Violation ID:${ANSI.reset} ${ANSI.brightCyan}${approvalRecord.id}${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Package:${ANSI.reset}      ${ANSI.bold}${approvalRecord.package}${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Allowed Rule:${ANSI.reset} ${JSON.stringify(approvalRecord.allow)}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Audit Reason:${ANSI.reset} ${ANSI.brightYellow}"${approvalRecord.reason}"${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Approved By:${ANSI.reset}  ${ANSI.bold}${approvalRecord.approved_by}${ANSI.reset} on ${approvalRecord.approved_at}`);
    console.log(`${ANSI.gray}╰───────────────────────────────────────────────────────────────${ANSI.reset}`);
    console.log(`\n${ANSI.dim}Next step:${ANSI.reset} Review ${ANSI.bold}git diff behavior.lock${ANSI.reset} and commit along with your PR.\n`);
  }

  static renderInitSuccess(meta = {}, packages = {}) {
    console.log(`${ANSI.bgGreen}${ANSI.black}${ANSI.bold}  ✔ CONTRACT INITIALIZED  ${ANSI.reset}\n`);
    
    console.log(`${ANSI.bold}Recorded Capability Matrix Table:${ANSI.reset}`);
    this.renderCapabilityMatrix(packages);

    console.log(`${ANSI.gray}╭─ Baseline Contract Summary ───────────────────────────────────${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Lockfile:${ANSI.reset}        ${ANSI.bold}${meta.lockfilePath}${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Packages Traced:${ANSI.reset} ${ANSI.brightCyan}${meta.packageCount}${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Raw Events:${ANSI.reset}      ${ANSI.dim}${meta.rawEventsCount}${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset}  ${ANSI.dim}Sandbox Engine:${ANSI.reset}  ${meta.engine || 'runtime-hook'}`);
    console.log(`${ANSI.gray}╰───────────────────────────────────────────────────────────────${ANSI.reset}`);
    console.log(`\n${ANSI.brightYellow}Next step:${ANSI.reset} Commit ${ANSI.bold}behavior.lock${ANSI.reset} to your git repository.`);
    console.log(`Add ${ANSI.cyan}behaviorlock check${ANSI.reset} to CI to block unauthorized drift.\n`);
  }

  static generateHtmlReport(diffResult, contract, outputPath) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>behavior.lock Security Report</title>
  <style>
    :root {
      --bg: #090d13;
      --card: #121820;
      --card-inner: #18222e;
      --border: #232f3e;
      --text: #e6edf3;
      --text-muted: #8b949e;
      --accent: #38bdf8;
      --danger: #f85149;
      --danger-bg: rgba(248, 81, 73, 0.12);
      --warning: #fbbf24;
      --warning-bg: rgba(251, 191, 36, 0.12);
      --success: #34d399;
      --success-bg: rgba(52, 211, 153, 0.12);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; }
    body { background: var(--bg); color: var(--text); padding: 2.5rem; line-height: 1.6; }
    .container { max-width: 1100px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; margin-bottom: 2rem; }
    .logo { font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
    .logo span { color: var(--accent); }
    .status-badge { padding: 0.45rem 1.2rem; border-radius: 999px; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase; }
    .status-badge.failed { background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger); }
    .status-badge.passed { background: var(--success-bg); color: var(--success); border: 1px solid var(--success); }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.2rem; margin-bottom: 2.5rem; }
    .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 1.4rem; }
    .stat-val { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.2rem; }
    .stat-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
    .section-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem; color: #fff; display: flex; align-items: center; gap: 0.5rem; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 1.5rem; margin-bottom: 2.5rem; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.9rem; }
    th { text-align: left; padding: 0.8rem; border-bottom: 2px solid var(--border); color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
    td { padding: 0.8rem; border-bottom: 1px solid var(--border); }
    tr:hover { background: rgba(255,255,255,0.02); }

    .violation-row { border-left: 4px solid var(--danger); background: var(--card-inner); padding: 1.2rem; margin-bottom: 1rem; border-radius: 0 8px 8px 0; }
    .violation-row.HIGH { border-left-color: var(--warning); }
    .violation-row.MEDIUM { border-left-color: var(--accent); }
    .violation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
    .v-title { font-weight: 700; font-size: 1.05rem; }
    .v-id { background: rgba(56, 189, 248, 0.15); color: var(--accent); border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-family: monospace; }
    .v-meta { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.6rem; }
    .v-target { font-family: monospace; background: #000; padding: 0.35rem 0.7rem; border-radius: 6px; display: inline-block; font-size: 0.9rem; color: #ff7b72; border: 1px solid #30363d; }
    .graph-view { display: flex; align-items: center; justify-content: center; min-height: 200px; background: #070b10; border-radius: 8px; padding: 1.5rem; border: 1px solid var(--border); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔒 behavior<span>.lock</span> <small style="font-size: 0.85rem; color: var(--text-muted); font-weight: 400; margin-left: 0.5rem;">Runtime Contract Inspector</small></div>
      <div class="status-badge ${diffResult.passed ? 'passed' : 'failed'}">
        ${diffResult.passed ? '✔ CONTRACT SATISFIED' : '🚨 BREACH DETECTED'}
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val" style="color: ${diffResult.summary.critical > 0 ? 'var(--danger)' : 'var(--text)'};">${diffResult.summary.critical}</div>
        <div class="stat-label">Critical Breaches</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: var(--warning);">${diffResult.summary.high}</div>
        <div class="stat-label">High Severity</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: var(--accent);">${diffResult.summary.medium}</div>
        <div class="stat-label">Medium Severity</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: var(--success);">${diffResult.approvedMatches?.length || 0}</div>
        <div class="stat-label">Approved Rules</div>
      </div>
    </div>

    <h2 class="section-title">📊 Threat & Capability Signals Table</h2>
    <div class="card">
      ${
        diffResult.violations.length === 0
          ? '<p style="color: var(--success); font-weight: 500;">✔ Zero violations detected. All processes and network endpoints match approved behavior.lock.</p>'
          : `
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Package</th>
                <th>Target / Syscall</th>
                <th>Threat Type</th>
              </tr>
            </thead>
            <tbody>
              ${diffResult.violations
                .map(
                  (v) => `
                <tr>
                  <td><span class="v-id">${v.id}</span></td>
                  <td><b style="color: ${v.severity === 'CRITICAL' ? 'var(--danger)' : v.severity === 'HIGH' ? 'var(--warning)' : 'var(--accent)'}">${v.severity}</b></td>
                  <td><b>${v.package}</b></td>
                  <td><code>${v.target}</code></td>
                  <td>${v.type}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          `
      }
    </div>

    <h2 class="section-title">🔍 Detailed Behavioral Breach Log</h2>
    <div class="card">
      ${
        diffResult.violations.length === 0
          ? '<p style="color: var(--success);">All target code executed cleanly within authorized capability envelopes.</p>'
          : diffResult.violations
              .map(
                (v) => `
        <div class="violation-row ${v.severity}">
          <div class="violation-header">
            <div class="v-title">${v.type} <span style="font-size: 0.85rem; font-weight: normal; color: var(--text-muted);">&bull; ${v.severity}</span></div>
            <div class="v-id">ID: ${v.id}</div>
          </div>
          <div class="v-meta">Package: <b>${v.package}</b> &bull; Execution Phase: <b>${v.phase}</b></div>
          <div style="margin-bottom: 0.6rem;"><span class="v-target">${v.target}</span></div>
          <div style="font-size: 0.92rem; color: var(--text);">${v.message}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem;">Remediation: ${v.remediation}</div>
        </div>
      `
              )
              .join('')
      }
    </div>

    <h2 class="section-title">🗺️ Visual Capability & Threat Graph</h2>
    <div class="card">
      <div class="graph-view">
        <svg width="100%" height="160" viewBox="0 0 800 160" xmlns="http://www.w3.org/2000/svg">
          <rect x="30" y="55" width="140" height="50" rx="6" fill="#18222e" stroke="#38bdf8" />
          <text x="100" y="85" text-anchor="middle" font-size="12" fill="#fff" font-family="monospace">Target Project</text>

          <line x1="170" y1="80" x2="310" y2="80" stroke="#232f3e" stroke-width="2" stroke-dasharray="4" />

          <rect x="310" y="55" width="160" height="50" rx="6" fill="#18222e" stroke="#fbbf24" />
          <text x="390" y="85" text-anchor="middle" font-size="12" fill="#fff" font-family="monospace">Dependency Runtime</text>

          <line x1="470" y1="80" x2="610" y2="40" stroke="${diffResult.summary.critical > 0 ? '#f85149' : '#232f3e'}" stroke-width="2.5" />
          <line x1="470" y1="80" x2="610" y2="120" stroke="${diffResult.summary.high > 0 ? '#fbbf24' : '#232f3e'}" stroke-width="2.5" />

          <rect x="610" y="15" width="170" height="50" rx="6" fill="${diffResult.summary.critical > 0 ? '#490202' : '#18222e'}" stroke="${diffResult.summary.critical > 0 ? '#f85149' : '#232f3e'}" />
          <text x="695" y="45" text-anchor="middle" font-size="12" fill="#fff" font-family="monospace">Bait Credentials [🚨]</text>

          <rect x="610" y="95" width="170" height="50" rx="6" fill="${diffResult.summary.high > 0 ? '#4d3000' : '#18222e'}" stroke="${diffResult.summary.high > 0 ? '#fbbf24' : '#232f3e'}" />
          <text x="695" y="125" text-anchor="middle" font-size="12" fill="#fff" font-family="monospace">Outbound Network</text>
        </svg>
      </div>
    </div>
  </div>
</body>
</html>`;

    fs.writeFileSync(outputPath, html, 'utf8');
    return outputPath;
  }
}
