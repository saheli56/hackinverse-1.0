/**
 * behavior.lock Visualizer & Reporter
 * High-polish Terminal UI + Interactive HTML Graph Report Generator
 */

import fs from 'node:fs';
import path from 'node:path';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  white: '\x1b[37m'
};

export class Visualizer {
  static printBanner() {
    console.log(`
${ANSI.cyan}${ANSI.bold}┌─────────────────────────────────────────────────────────────┐
│  🔒 behavior.lock v1.0                                       │
│  "Your lockfile pins the code. Ours pins the behavior."     │
└─────────────────────────────────────────────────────────────┘${ANSI.reset}
`);
  }

  static renderTerminalReport(diffResult, targetName = 'app') {
    if (diffResult.passed) {
      console.log(`
${ANSI.green}${ANSI.bold}✓ BEHAVIOR CONTRACT VERIFIED${ANSI.reset} [Target: ${targetName}]
${ANSI.dim}All observed execution matches approved contract in behavior.lock.${ANSI.reset}
${ANSI.green}No unexpected network, file access, or process spawns detected.${ANSI.reset}
`);
      return;
    }

    console.log(`
${ANSI.bgRed}${ANSI.white}${ANSI.bold} 🚨 BEHAVIOR CONTRACT BREACH DETECTED ── ${targetName} ${ANSI.reset}
`);

    console.log(`${ANSI.bold}Violations Summary:${ANSI.reset} ${ANSI.red}${diffResult.summary.critical} Critical${ANSI.reset} | ${ANSI.yellow}${diffResult.summary.high} High${ANSI.reset} | ${ANSI.cyan}${diffResult.summary.medium} Medium${ANSI.reset}\n`);

    for (const v of diffResult.violations) {
      let badge = '';
      if (v.severity === 'CRITICAL') {
        badge = `${ANSI.bgRed}${ANSI.white}${ANSI.bold} CRITICAL ${ANSI.reset}`;
      } else if (v.severity === 'HIGH') {
        badge = `${ANSI.yellow}${ANSI.bold}[HIGH]${ANSI.reset}`;
      } else {
        badge = `${ANSI.cyan}${ANSI.bold}[MEDIUM]${ANSI.reset}`;
      }

      console.log(`${badge} ${ANSI.bold}${v.type}${ANSI.reset} (ID: ${ANSI.magenta}${v.id}${ANSI.reset})`);
      console.log(`  ${ANSI.dim}Package:${ANSI.reset}     ${ANSI.bold}${v.package}${ANSI.reset} (phase: ${v.phase})`);
      console.log(`  ${ANSI.dim}Target:${ANSI.reset}      ${v.target}`);
      console.log(`  ${ANSI.dim}Details:${ANSI.reset}     ${v.message}`);
      console.log(`  ${ANSI.dim}Remedy:${ANSI.reset}      ${ANSI.dim}${v.remediation}${ANSI.reset}\n`);
    }

    console.log(`${ANSI.bold}── Suggested Actions ───────────────────────────────────────────${ANSI.reset}`);
    console.log(`  ${ANSI.cyan}behaviorlock approve <id> --reason "..."${ANSI.reset}   Authorize legitimate change`);
    console.log(`  ${ANSI.red}npm rollback / git checkout${ANSI.reset}                 Reject compromised package update\n`);
  }

  static generateHtmlReport(diffResult, contract, outputPath) {
    const violationsJson = JSON.stringify(diffResult.violations, null, 2);
    const contractJson = JSON.stringify(contract, null, 2);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>behavior.lock Security Report</title>
  <style>
    :root {
      --bg: #0d1117;
      --card: #161b22;
      --border: #30363d;
      --text: #c9d1d9;
      --text-muted: #8b949e;
      --accent: #58a6ff;
      --danger: #f85149;
      --danger-bg: rgba(248, 81, 73, 0.15);
      --warning: #d29922;
      --success: #3fb950;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; }
    body { background: var(--bg); color: var(--text); padding: 2rem; line-height: 1.5; }
    .container { max-width: 1100px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; margin-bottom: 2rem; }
    .logo { font-size: 1.6rem; font-weight: 700; color: #fff; }
    .logo span { color: var(--accent); }
    .status-badge { padding: 0.4rem 1rem; border-radius: 999px; font-weight: 600; font-size: 0.9rem; }
    .status-badge.failed { background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger); }
    .status-badge.passed { background: rgba(63, 185, 80, 0.15); color: var(--success); border: 1px solid var(--success); }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.2rem; }
    .stat-val { font-size: 2rem; font-weight: bold; margin-bottom: 0.2rem; }
    .stat-label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .section-title { font-size: 1.2rem; margin-bottom: 1rem; color: #fff; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
    .violation-row { border-left: 4px solid var(--danger); background: rgba(255,255,255,0.02); padding: 1rem; margin-bottom: 1rem; border-radius: 0 6px 6px 0; }
    .violation-row.HIGH { border-left-color: var(--warning); }
    .violation-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .v-title { font-weight: bold; font-size: 1.05rem; }
    .v-id { background: #21262d; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; color: var(--accent); }
    .v-meta { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.4rem; }
    .v-target { font-family: monospace; background: #000; padding: 0.3rem 0.6rem; border-radius: 4px; display: inline-block; font-size: 0.9rem; color: #ff7b72; }
    .graph-view { display: flex; align-items: center; justify-content: center; min-height: 220px; background: #000; border-radius: 6px; padding: 1rem; }
    pre { background: #000; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.85rem; color: #7ee787; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">behavior<span>.lock</span> <small style="font-size: 0.9rem; color: var(--text-muted); font-weight: normal;">| Runtime Contract Inspector</small></div>
      <div class="status-badge ${diffResult.passed ? 'passed' : 'failed'}">
        ${diffResult.passed ? '✓ CONTRACT SATISFIED' : '🚨 CONTRACT VIOLATION DETECTED'}
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val" style="color: ${diffResult.summary.critical > 0 ? 'var(--danger)' : 'var(--text)'};">${diffResult.summary.critical}</div>
        <div class="stat-label">Critical Alerts</div>
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
        <div class="stat-label">Approved Overrides</div>
      </div>
    </div>

    <h2 class="section-title">Execution Breach Log</h2>
    <div class="card">
      ${
        diffResult.violations.length === 0
          ? '<p style="color: var(--success);">No violations found. System executed completely within approved boundaries.</p>'
          : diffResult.violations
              .map(
                (v) => `
        <div class="violation-row ${v.severity}">
          <div class="violation-header">
            <div class="v-title">${v.type} <span style="font-size: 0.85rem; font-weight: normal; color: var(--text-muted);">&bull; ${v.severity}</span></div>
            <div class="v-id">ID: ${v.id}</div>
          </div>
          <div class="v-meta">Package: <b>${v.package}</b> &bull; Phase: <b>${v.phase}</b></div>
          <div style="margin-bottom: 0.5rem;"><span class="v-target">${v.target}</span></div>
          <div style="font-size: 0.9rem; color: var(--text);">${v.message}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem;">Remediation: ${v.remediation}</div>
        </div>
      `
              )
              .join('')
      }
    </div>

    <h2 class="section-title">Visual Contract Flow</h2>
    <div class="card">
      <div class="graph-view">
        <svg width="100%" height="160" viewBox="0 0 800 160" xmlns="http://www.w3.org/2000/svg">
          <style>
            .node { font-size: 12px; fill: #fff; font-family: monospace; }
            .node-box { rx: 6; }
            .edge { stroke: #30363d; stroke-width: 2; stroke-dasharray: 4; }
            .edge-danger { stroke: #f85149; stroke-width: 2.5; }
          </style>
          <!-- Nodes -->
          <rect x="30" y="55" width="140" height="50" fill="#21262d" stroke="#58a6ff" class="node-box" />
          <text x="100" y="85" text-anchor="middle" class="node">Target Project</text>

          <line x1="170" y1="80" x2="310" y2="80" class="edge" />

          <rect x="310" y="55" width="160" height="50" fill="#21262d" stroke="#d29922" class="node-box" />
          <text x="390" y="85" text-anchor="middle" class="node">Dependency Runtime</text>

          <line x1="470" y1="80" x2="610" y2="40" class="${diffResult.summary.critical > 0 ? 'edge-danger' : 'edge'}" />
          <line x1="470" y1="80" x2="610" y2="120" class="${diffResult.summary.high > 0 ? 'edge-danger' : 'edge'}" />

          <rect x="610" y="15" width="170" height="50" fill="${diffResult.summary.critical > 0 ? '#490202' : '#21262d'}" stroke="${diffResult.summary.critical > 0 ? '#f85149' : '#30363d'}" class="node-box" />
          <text x="695" y="45" text-anchor="middle" class="node">Bait Credentials [🚨]</text>

          <rect x="610" y="95" width="170" height="50" fill="${diffResult.summary.high > 0 ? '#4d3000' : '#21262d'}" stroke="${diffResult.summary.high > 0 ? '#d29922' : '#30363d'}" class="node-box" />
          <text x="695" y="125" text-anchor="middle" class="node">Outbound Network</text>
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
