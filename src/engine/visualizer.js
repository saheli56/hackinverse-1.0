/**
 * behavior.lock Visualizer & Reporter
 * Minimalist, Enterprise-Grade Terminal UI & HTML Security Dashboard
 */

import fs from 'node:fs';
import path from 'node:path';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  
  // Semantic Foregrounds
  red: '\x1b[31m',
  green: '\x1b[32m',
  amber: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
};

export class Visualizer {
  static printBanner() {
    console.log(`\n${ANSI.bold}behavior.lock${ANSI.reset} ${ANSI.gray}v1.0.0${ANSI.reset}`);
  }

  static printSessionContext(info = {}) {
    const cwd = info.cwd || process.cwd();
    const cmd = info.cmd || 'npm test';
    const engine = info.engine === 'kernel-strace' ? 'kernel-strace (Linux)' : 'runtime-hook (V8)';

    console.log(`${ANSI.gray}Target:  ${ANSI.reset}${path.basename(cwd)} ${ANSI.gray}(${cwd})${ANSI.reset}`);
    console.log(`${ANSI.gray}Command: ${ANSI.reset}${cmd}`);
    console.log(`${ANSI.gray}Engine:  ${ANSI.reset}${engine}\n`);
  }

  static printTargetFrameStart(cmdStr) {
    console.log(`${ANSI.gray}--- Sandbox output start ---${ANSI.reset}`);
  }

  static printTargetFrameEnd() {
    console.log(`${ANSI.gray}--- Sandbox output end ---\n${ANSI.reset}`);
  }

  /**
   * Renders a clean tabular view of violations
   */
  static renderViolationsTable(violations) {
    if (!violations || violations.length === 0) return;

    console.log(`${ANSI.gray}┌──────┬──────────┬──────────────────┬─────────────────────────────┬──────────────────────────┐${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset} ${ANSI.bold}ID${ANSI.reset}   ${ANSI.gray}│${ANSI.reset} ${ANSI.bold}Severity${ANSI.reset} ${ANSI.gray}│${ANSI.reset} ${ANSI.bold}Package${ANSI.reset}          ${ANSI.gray}│${ANSI.reset} ${ANSI.bold}Target / Syscall${ANSI.reset}            ${ANSI.gray}│${ANSI.reset} ${ANSI.bold}Rule Class${ANSI.reset}                 ${ANSI.gray}│${ANSI.reset}`);
    console.log(`${ANSI.gray}├──────┼──────────┼──────────────────┼─────────────────────────────┼──────────────────────────┤${ANSI.reset}`);

    for (const v of violations) {
      let sev = `${ANSI.red}critical${ANSI.reset}`;
      if (v.severity === 'HIGH') sev = `${ANSI.amber}high    ${ANSI.reset}`;
      else if (v.severity === 'MEDIUM') sev = `${ANSI.cyan}medium  ${ANSI.reset}`;

      const id = String(v.id || '').padEnd(4, ' ');
      const pkg = String(v.package || '').slice(0, 16).padEnd(16, ' ');
      const target = String(v.target || '').slice(0, 27).padEnd(27, ' ');
      const type = String(v.type || '').slice(0, 24).padEnd(24, ' ');

      console.log(`${ANSI.gray}│${ANSI.reset} ${ANSI.bold}${id}${ANSI.reset} ${ANSI.gray}│${ANSI.reset} ${sev} ${ANSI.gray}│${ANSI.reset} ${pkg} ${ANSI.gray}│${ANSI.reset} ${target} ${ANSI.gray}│${ANSI.reset} ${type} ${ANSI.gray}│${ANSI.reset}`);
    }

    console.log(`${ANSI.gray}└──────┴──────────┴──────────────────┴─────────────────────────────┴──────────────────────────┘${ANSI.reset}\n`);
  }

  /**
   * Renders a capability matrix table for packages in lockfile
   */
  static renderCapabilityMatrix(packages) {
    console.log(`${ANSI.gray}┌──────────────────────┬─────────────┬─────────────┬─────────────┬─────────────┐${ANSI.reset}`);
    console.log(`${ANSI.gray}│${ANSI.reset} ${ANSI.bold}Package${ANSI.reset}              ${ANSI.gray}│${ANSI.reset} ${ANSI.bold}Network${ANSI.reset}     ${ANSI.gray}│${ANSI.reset} ${ANSI.bold}FS Read${ANSI.reset}     ${ANSI.gray}│${ANSI.reset} ${ANSI.bold}FS Write${ANSI.reset}    ${ANSI.gray}│${ANSI.reset} ${ANSI.bold}Exec${ANSI.reset}          ${ANSI.gray}│${ANSI.reset}`);
    console.log(`${ANSI.gray}├──────────────────────┼─────────────┼─────────────┼─────────────┼─────────────┤${ANSI.reset}`);

    for (const [pkg, data] of Object.entries(packages)) {
      const pName = pkg.slice(0, 20).padEnd(20, ' ');
      const net = (data.runtime?.network?.length ? `${data.runtime.network.length} host(s)` : 'none').padEnd(11, ' ');
      const fsR = (data.runtime?.fs_read?.length ? `${data.runtime.fs_read.length} file(s)` : 'none').padEnd(11, ' ');
      const fsW = (data.runtime?.fs_write?.length ? `${data.runtime.fs_write.length} file(s)` : 'none').padEnd(11, ' ');
      const exec = (data.runtime?.exec?.length ? `${data.runtime.exec.length} cmd(s)` : 'none').padEnd(11, ' ');

      console.log(`${ANSI.gray}│${ANSI.reset} ${pName} ${ANSI.gray}│${ANSI.reset} ${net} ${ANSI.gray}│${ANSI.reset} ${fsR} ${ANSI.gray}│${ANSI.reset} ${fsW} ${ANSI.gray}│${ANSI.reset} ${exec} ${ANSI.gray}│${ANSI.reset}`);
    }

    console.log(`${ANSI.gray}└──────────────────────┴─────────────┴─────────────┴─────────────┴─────────────┘${ANSI.reset}\n`);
  }

  static renderTerminalReport(diffResult, targetName = 'app') {
    if (diffResult.passed) {
      console.log(`${ANSI.green}${ANSI.bold}✔ Verified:${ANSI.reset} Behavior contract satisfied for ${ANSI.bold}${targetName}${ANSI.reset}`);
      console.log(`${ANSI.gray}  All observed operations match the committed rules in behavior.lock.${ANSI.reset}`);
      
      if (diffResult.approvedMatches?.length > 0) {
        console.log(`${ANSI.gray}  Active overrides: ${diffResult.approvedMatches.length} approved rule(s)${ANSI.reset}`);
      }
      console.log('');
      return;
    }

    // BREACH REPORT
    console.log(`${ANSI.red}${ANSI.bold}✖ Breach detected:${ANSI.reset} Runtime contract violated in ${ANSI.bold}${targetName}${ANSI.reset}`);
    
    const summaryParts = [];
    if (diffResult.summary.critical > 0) summaryParts.push(`${ANSI.red}${diffResult.summary.critical} critical${ANSI.reset}`);
    if (diffResult.summary.high > 0) summaryParts.push(`${ANSI.amber}${diffResult.summary.high} high${ANSI.reset}`);
    if (diffResult.summary.medium > 0) summaryParts.push(`${ANSI.cyan}${diffResult.summary.medium} medium${ANSI.reset}`);
    
    console.log(`${ANSI.gray}  Summary: ${summaryParts.join(' · ')}\n${ANSI.reset}`);

    // Tabular overview
    this.renderViolationsTable(diffResult.violations);

    // Clean, structured violation list
    for (let i = 0; i < diffResult.violations.length; i++) {
      const v = diffResult.violations[i];
      let tag = `${ANSI.red}[critical]${ANSI.reset}`;
      if (v.severity === 'HIGH') tag = `${ANSI.amber}[high]${ANSI.reset}`;
      else if (v.severity === 'MEDIUM') tag = `${ANSI.cyan}[medium]${ANSI.reset}`;

      console.log(`  ${tag} ${ANSI.bold}${v.type}${ANSI.reset} ${ANSI.gray}(id: ${v.id})${ANSI.reset}`);
      console.log(`    ${ANSI.gray}Package:${ANSI.reset}     ${v.package} ${ANSI.gray}(phase: ${v.phase})${ANSI.reset}`);
      console.log(`    ${ANSI.gray}Target:${ANSI.reset}      ${v.target}`);
      console.log(`    ${ANSI.gray}Details:${ANSI.reset}     ${v.message}`);
      console.log(`    ${ANSI.gray}Remediation:${ANSI.reset} ${ANSI.dim}${v.remediation}${ANSI.reset}\n`);
    }

    const firstId = diffResult.violations[0]?.id || '<id>';
    console.log(`${ANSI.bold}Remediation options:${ANSI.reset}`);
    console.log(`  ${ANSI.gray}• Approve change:${ANSI.reset}  behaviorlock approve ${firstId} --reason "Reviewed and authorized"`);
    console.log(`  ${ANSI.gray}• Reject update:${ANSI.reset}   git restore package.json package-lock.json\n`);
  }

  static renderApprovalReceipt(approvalRecord) {
    console.log(`${ANSI.green}${ANSI.bold}✔ Approved:${ANSI.reset} Behavior authorized and signed into ${ANSI.bold}behavior.lock${ANSI.reset}\n`);
    console.log(`  ${ANSI.gray}ID:${ANSI.reset}       ${approvalRecord.id}`);
    console.log(`  ${ANSI.gray}Package:${ANSI.reset}  ${approvalRecord.package}`);
    console.log(`  ${ANSI.gray}Rule:${ANSI.reset}     ${JSON.stringify(approvalRecord.allow)}`);
    console.log(`  ${ANSI.gray}Reason:${ANSI.reset}   "${approvalRecord.reason}"`);
    console.log(`  ${ANSI.gray}Author:${ANSI.reset}   ${approvalRecord.approved_by} on ${approvalRecord.approved_at}\n`);
    console.log(`${ANSI.gray}Commit ${ANSI.reset}${ANSI.bold}behavior.lock${ANSI.reset}${ANSI.gray} to your repository with your pull request.${ANSI.reset}\n`);
  }

  static renderInitSuccess(meta = {}, packages = {}) {
    console.log(`${ANSI.green}${ANSI.bold}✔ Initialized:${ANSI.reset} Baseline behavior recorded to ${ANSI.bold}${meta.lockfilePath}${ANSI.reset}\n`);
    
    this.renderCapabilityMatrix(packages);

    console.log(`  ${ANSI.gray}Packages:${ANSI.reset} ${meta.packageCount}`);
    console.log(`  ${ANSI.gray}Events:${ANSI.reset}   ${meta.rawEventsCount}`);
    console.log(`  ${ANSI.gray}Engine:${ANSI.reset}   ${meta.engine || 'runtime-hook'}\n`);
    console.log(`${ANSI.gray}Commit ${ANSI.reset}${ANSI.bold}behavior.lock${ANSI.reset}${ANSI.gray} to version control to enforce runtime contracts in CI.${ANSI.reset}\n`);
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
      --card: #111722;
      --card-alt: #161e2e;
      --border: #212c3d;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --danger: #ef4444;
      --danger-bg: rgba(239, 68, 68, 0.08);
      --warning: #f59e0b;
      --warning-bg: rgba(245, 158, 11, 0.08);
      --success: #10b981;
      --success-bg: rgba(16, 185, 129, 0.08);
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: var(--font-sans); }
    body { background: var(--bg); color: var(--text); padding: 2.5rem; line-height: 1.5; }
    .container { max-width: 1040px; margin: 0 auto; }
    
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; margin-bottom: 2rem; }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .brand-title { font-size: 1.25rem; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
    .brand-title span { color: var(--text-muted); font-weight: 400; font-size: 0.9rem; margin-left: 0.5rem; }

    .status-badge { padding: 0.35rem 0.85rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; letter-spacing: 0.02em; }
    .status-badge.failed { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.25); }
    .status-badge.passed { background: var(--success-bg); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.25); }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; }
    .stat-val { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; }
    .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }

    .section-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #fff; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem; }
    
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th { text-align: left; padding: 0.65rem 0.75rem; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
    td { padding: 0.65rem 0.75rem; border-bottom: 1px solid var(--border); }
    tr:last-child td { border-bottom: none; }
    
    code { font-family: var(--font-mono); font-size: 0.825rem; background: rgba(0,0,0,0.3); padding: 0.2rem 0.4rem; border-radius: 4px; border: 1px solid var(--border); }
    .tag-id { font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); }

    .violation-card { border: 1px solid var(--border); background: var(--card-alt); border-radius: 6px; padding: 1rem; margin-bottom: 0.75rem; }
    .violation-card.CRITICAL { border-left: 3px solid var(--danger); }
    .violation-card.HIGH { border-left: 3px solid var(--warning); }
    .violation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .v-type { font-weight: 600; font-size: 0.9rem; }
    .v-meta { color: var(--text-muted); font-size: 0.825rem; margin-bottom: 0.5rem; }
    .v-msg { font-size: 0.875rem; color: var(--text); }
    .v-remedy { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem; }

    .graph-view { display: flex; align-items: center; justify-content: center; min-height: 180px; background: #070a10; border-radius: 6px; padding: 1rem; border: 1px solid var(--border); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="brand-title">behavior.lock <span>Runtime Security Contract Report</span></div>
      </div>
      <div class="status-badge ${diffResult.passed ? 'passed' : 'failed'}">
        ${diffResult.passed ? 'Contract Satisfied' : 'Breach Detected'}
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

    <h2 class="section-title">Signals Overview</h2>
    <div class="card">
      ${
        diffResult.violations.length === 0
          ? '<p style="color: var(--success); font-size: 0.9rem;">Zero unauthorized activities detected. System executed completely within approved boundaries.</p>'
          : `
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Package</th>
                <th>Target / Syscall</th>
                <th>Rule Class</th>
              </tr>
            </thead>
            <tbody>
              ${diffResult.violations
                .map(
                  (v) => `
                <tr>
                  <td><span class="tag-id">${v.id}</span></td>
                  <td><span style="font-weight: 600; color: ${v.severity === 'CRITICAL' ? 'var(--danger)' : v.severity === 'HIGH' ? 'var(--warning)' : 'var(--accent)'}">${v.severity.toLowerCase()}</span></td>
                  <td>${v.package}</td>
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

    <h2 class="section-title">Breach Details</h2>
    <div class="card">
      ${
        diffResult.violations.length === 0
          ? '<p style="color: var(--text-muted); font-size: 0.875rem;">No breaches recorded.</p>'
          : diffResult.violations
              .map(
                (v) => `
        <div class="violation-card ${v.severity}">
          <div class="violation-header">
            <div class="v-type">${v.type}</div>
            <div class="tag-id">id: ${v.id}</div>
          </div>
          <div class="v-meta">Package: <b>${v.package}</b> &bull; Phase: <b>${v.phase}</b></div>
          <div style="margin-bottom: 0.5rem;"><code>${v.target}</code></div>
          <div class="v-msg">${v.message}</div>
          <div class="v-remedy">Remediation: ${v.remediation}</div>
        </div>
      `
              )
              .join('')
      }
    </div>

    <h2 class="section-title">Execution Topology</h2>
    <div class="card">
      <div class="graph-view">
        <svg width="100%" height="140" viewBox="0 0 740 140" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="45" width="130" height="46" rx="6" fill="#161e2e" stroke="#212c3d" />
          <text x="85" y="73" text-anchor="middle" font-size="12" fill="#e2e8f0" font-family="var(--font-sans)">Target Project</text>

          <line x1="150" y1="68" x2="270" y2="68" stroke="#212c3d" stroke-width="1.5" stroke-dasharray="3" />

          <rect x="270" y="45" width="150" height="46" rx="6" fill="#161e2e" stroke="#212c3d" />
          <text x="345" y="73" text-anchor="middle" font-size="12" fill="#e2e8f0" font-family="var(--font-sans)">Dependencies</text>

          <line x1="420" y1="68" x2="540" y2="35" stroke="${diffResult.summary.critical > 0 ? '#ef4444' : '#212c3d'}" stroke-width="1.5" />
          <line x1="420" y1="68" x2="540" y2="100" stroke="${diffResult.summary.high > 0 ? '#f59e0b' : '#212c3d'}" stroke-width="1.5" />

          <rect x="540" y="15" width="160" height="42" rx="6" fill="#161e2e" stroke="${diffResult.summary.critical > 0 ? '#ef4444' : '#212c3d'}" />
          <text x="620" y="41" text-anchor="middle" font-size="12" fill="${diffResult.summary.critical > 0 ? '#ef4444' : '#94a3b8'}" font-family="var(--font-sans)">Canary Credentials</text>

          <rect x="540" y="80" width="160" height="42" rx="6" fill="#161e2e" stroke="${diffResult.summary.high > 0 ? '#f59e0b' : '#212c3d'}" />
          <text x="620" y="106" text-anchor="middle" font-size="12" fill="${diffResult.summary.high > 0 ? '#f59e0b' : '#94a3b8'}" font-family="var(--font-sans)">Network Sockets</text>
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
