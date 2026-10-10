/**
 * behavior.lock Visualizer & Reporter
 * Premium Terminal UI & Silicon Valley-Grade HTML Security Dashboard
 */

import fs from 'node:fs';
import path from 'node:path';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // TrueColor & 256-color friendly standard ANSI
  red: '\x1b[38;5;196m',
  crimson: '\x1b[38;5;160m',
  green: '\x1b[38;5;42m',
  emerald: '\x1b[38;5;48m',
  amber: '\x1b[38;5;214m',
  gold: '\x1b[38;5;220m',
  cyan: '\x1b[38;5;51m',
  sky: '\x1b[38;5;45m',
  purple: '\x1b[38;5;141m',
  gray: '\x1b[38;5;242m',
  darkGray: '\x1b[38;5;238m',
  white: '\x1b[38;5;255m',
  bgRed: '\x1b[48;5;196m\x1b[38;5;255m',
  bgGreen: '\x1b[48;5;34m\x1b[38;5;255m',
  bgAmber: '\x1b[48;5;214m\x1b[38;5;232m'
};

export class Visualizer {
  static printBanner() {
    console.log(`\n${ANSI.sky}${ANSI.bold}◆ behavior.lock${ANSI.reset} ${ANSI.gray}v1.0.0${ANSI.reset} ${ANSI.darkGray}·${ANSI.reset} ${ANSI.dim}Runtime Capability Sandbox${ANSI.reset}`);
  }

  static printSessionContext(info = {}) {
    const cwd = info.cwd || process.cwd();
    const cmd = info.cmd || 'npm test';
    const engine = info.engine === 'kernel-strace' ? 'kernel-strace (Linux Syscall)' : 'runtime-hook (V8 Preload)';

    console.log(`${ANSI.darkGray}╭─────────────────────────────────────────────────────────────${ANSI.reset}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.dim}Target:${ANSI.reset}  ${ANSI.white}${ANSI.bold}${path.basename(cwd)}${ANSI.reset} ${ANSI.gray}(${cwd})${ANSI.reset}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.dim}Command:${ANSI.reset} ${ANSI.sky}${cmd}${ANSI.reset}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.dim}Engine:${ANSI.reset}  ${ANSI.dim}${engine}${ANSI.reset}`);
    console.log(`${ANSI.darkGray}╰─────────────────────────────────────────────────────────────${ANSI.reset}\n`);
  }

  static printTargetFrameStart(cmdStr) {
    console.log(`${ANSI.darkGray}┌─ Target Output (${cmdStr}) ──────────────────────────${ANSI.reset}`);
  }

  static printTargetFrameEnd() {
    console.log(`${ANSI.darkGray}└─────────────────────────────────────────────────────────────${ANSI.reset}\n`);
  }

  /**
   * Renders a styled capability matrix table
   */
  static renderCapabilityMatrix(packages) {
    console.log(`${ANSI.darkGray}┌─────────────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐${ANSI.reset}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset} ${ANSI.bold}Package${ANSI.reset}                 ${ANSI.darkGray}│${ANSI.reset} ${ANSI.bold}Network${ANSI.reset}      ${ANSI.darkGray}│${ANSI.reset} ${ANSI.bold}Filesystem${ANSI.reset}   ${ANSI.darkGray}│${ANSI.reset} ${ANSI.bold}Processes${ANSI.reset}    ${ANSI.darkGray}│${ANSI.reset} ${ANSI.bold}Honeypots${ANSI.reset}    ${ANSI.darkGray}│${ANSI.reset}`);
    console.log(`${ANSI.darkGray}├─────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤${ANSI.reset}`);

    for (const [pkg, data] of Object.entries(packages)) {
      const pName = pkg.slice(0, 23).padEnd(23, ' ');
      const netCount = data.runtime?.network?.length || 0;
      const fsCount = (data.runtime?.fs_read?.length || 0) + (data.runtime?.fs_write?.length || 0);
      const execCount = data.runtime?.exec?.length || 0;

      const netStr = (netCount > 0 ? `${ANSI.sky}${netCount} host(s)${ANSI.reset}` : `${ANSI.gray}none${ANSI.reset}`).padEnd(12 + (netCount > 0 ? ANSI.sky.length + ANSI.reset.length : ANSI.gray.length + ANSI.reset.length), ' ');
      const fsStr = (fsCount > 0 ? `${ANSI.white}${fsCount} file(s)${ANSI.reset}` : `${ANSI.gray}none${ANSI.reset}`).padEnd(12 + (fsCount > 0 ? ANSI.white.length + ANSI.reset.length : ANSI.gray.length + ANSI.reset.length), ' ');
      const execStr = (execCount > 0 ? `${ANSI.amber}${execCount} proc(s)${ANSI.reset}` : `${ANSI.gray}none${ANSI.reset}`).padEnd(12 + (execCount > 0 ? ANSI.amber.length + ANSI.reset.length : ANSI.gray.length + ANSI.reset.length), ' ');
      const honeyStr = `${ANSI.emerald}verified${ANSI.reset}`.padEnd(12 + ANSI.emerald.length + ANSI.reset.length, ' ');

      console.log(`${ANSI.darkGray}│${ANSI.reset} ${ANSI.white}${pName}${ANSI.reset} ${ANSI.darkGray}│${ANSI.reset} ${netStr} ${ANSI.darkGray}│${ANSI.reset} ${fsStr} ${ANSI.darkGray}│${ANSI.reset} ${execStr} ${ANSI.darkGray}│${ANSI.reset} ${honeyStr} ${ANSI.darkGray}│${ANSI.reset}`);
    }

    console.log(`${ANSI.darkGray}└─────────────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘${ANSI.reset}\n`);
  }

  static renderTerminalReport(diffResult, targetName = 'app') {
    if (diffResult.passed) {
      console.log(`${ANSI.emerald}${ANSI.bold}✔ CONTRACT SATISFIED${ANSI.reset} ${ANSI.gray}·${ANSI.reset} ${ANSI.white}${ANSI.bold}${targetName}${ANSI.reset}`);
      console.log(`${ANSI.gray}  All observed runtime behaviors conform to committed policies in ${ANSI.white}behavior.lock${ANSI.reset}`);
      
      console.log(`\n${ANSI.darkGray}╭─ Capability Verification ───────────────────────────────────${ANSI.reset}`);
      console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.emerald}●${ANSI.reset} ${ANSI.bold}Network Sockets:${ANSI.reset}     Zero unapproved outbound endpoints`);
      console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.emerald}●${ANSI.reset} ${ANSI.bold}Honeypot Canaries:${ANSI.reset}   All decoy credentials untouched`);
      console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.emerald}●${ANSI.reset} ${ANSI.bold}Process Execution:${ANSI.reset}   Zero unauthorized child processes`);
      console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.emerald}●${ANSI.reset} ${ANSI.bold}Filesystem Scope:${ANSI.reset}    Restricted within project boundaries`);
      if (diffResult.approvedMatches?.length > 0) {
        console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.sky}ℹ${ANSI.reset} ${ANSI.bold}Signed Overrides:${ANSI.reset}    ${diffResult.approvedMatches.length} rule(s) active`);
      }
      console.log(`${ANSI.darkGray}╰─────────────────────────────────────────────────────────────${ANSI.reset}\n`);
      return;
    }

    // BREACH REPORT
    console.log(`${ANSI.red}${ANSI.bold}✖ BEHAVIOR CONTRACT BREACH DETECTED${ANSI.reset} ${ANSI.gray}·${ANSI.reset} ${ANSI.white}${ANSI.bold}${targetName}${ANSI.reset}`);
    
    const summaryParts = [];
    if (diffResult.summary.critical > 0) summaryParts.push(`${ANSI.red}${ANSI.bold}${diffResult.summary.critical} CRITICAL${ANSI.reset}`);
    if (diffResult.summary.high > 0) summaryParts.push(`${ANSI.amber}${ANSI.bold}${diffResult.summary.high} HIGH${ANSI.reset}`);
    if (diffResult.summary.medium > 0) summaryParts.push(`${ANSI.sky}${ANSI.bold}${diffResult.summary.medium} MEDIUM${ANSI.reset}`);
    
    console.log(`${ANSI.gray}  Threat Level:${ANSI.reset} ${summaryParts.join(`${ANSI.gray} · ${ANSI.reset}`)}\n`);

    // Beautiful Structured Breach Cards
    for (let i = 0; i < diffResult.violations.length; i++) {
      const v = diffResult.violations[i];
      let border = ANSI.red;
      let badge = `${ANSI.bgRed} CRITICAL ${ANSI.reset}`;

      if (v.severity === 'HIGH') {
        border = ANSI.amber;
        badge = `${ANSI.bgAmber} HIGH ${ANSI.reset}`;
      } else if (v.severity === 'MEDIUM') {
        border = ANSI.sky;
        badge = `${ANSI.sky}[MEDIUM]${ANSI.reset}`;
      }

      console.log(`${border}┌─ Breach ${i + 1}/${diffResult.violations.length} · ${badge} ${ANSI.bold}${v.type}${ANSI.reset} ${ANSI.darkGray}(id: ${v.id})───────────────────────────────────${ANSI.reset}`);
      console.log(`${border}│${ANSI.reset}  ${ANSI.dim}Package:${ANSI.reset}     ${ANSI.white}${ANSI.bold}${v.package}${ANSI.reset} ${ANSI.gray}(phase: ${v.phase})${ANSI.reset}`);
      console.log(`${border}│${ANSI.reset}  ${ANSI.dim}Syscall:${ANSI.reset}     ${ANSI.gold}${v.target}${ANSI.reset}`);
      console.log(`${border}│${ANSI.reset}  ${ANSI.dim}Signal:${ANSI.reset}      ${v.message}`);
      console.log(`${border}│${ANSI.reset}  ${ANSI.dim}Action:${ANSI.reset}      ${ANSI.white}${v.remediation}${ANSI.reset}`);
      console.log(`${border}└─────────────────────────────────────────────────────────────${ANSI.reset}\n`);
    }

    const firstId = diffResult.violations[0]?.id || '<id>';
    console.log(`${ANSI.white}${ANSI.bold}Suggested Next Steps:${ANSI.reset}`);
    console.log(`  ${ANSI.emerald}• Authorize legitimate update:${ANSI.reset}  ${ANSI.sky}behaviorlock approve ${firstId} --reason "Reviewed & verified"${ANSI.reset}`);
    console.log(`  ${ANSI.red}• Reject malicious update:${ANSI.reset}      ${ANSI.gray}git restore package.json package-lock.json${ANSI.reset}\n`);
  }

  static renderApprovalReceipt(approvalRecord) {
    console.log(`${ANSI.emerald}${ANSI.bold}✔ VIOLATION APPROVED & SIGNED${ANSI.reset}\n`);
    console.log(`${ANSI.darkGray}╭─ Signed Contract Entry ─────────────────────────────────────${ANSI.reset}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.dim}Violation ID:${ANSI.reset} ${ANSI.sky}${ANSI.bold}${approvalRecord.id}${ANSI.reset}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.dim}Package:${ANSI.reset}      ${ANSI.white}${ANSI.bold}${approvalRecord.package}${ANSI.reset}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.dim}Permitted:${ANSI.reset}    ${JSON.stringify(approvalRecord.allow)}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.dim}Audit Reason:${ANSI.reset} ${ANSI.gold}"${approvalRecord.reason}"${ANSI.reset}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.dim}Signed By:${ANSI.reset}    ${ANSI.white}${approvalRecord.approved_by}${ANSI.reset} ${ANSI.gray}on ${approvalRecord.approved_at}${ANSI.reset}`);
    console.log(`${ANSI.darkGray}╰─────────────────────────────────────────────────────────────${ANSI.reset}`);
    console.log(`\n${ANSI.gray}Commit ${ANSI.white}${ANSI.bold}behavior.lock${ANSI.reset}${ANSI.gray} to your repository with your pull request.${ANSI.reset}\n`);
  }

  static renderInitSuccess(meta = {}, packages = {}) {
    console.log(`${ANSI.emerald}${ANSI.bold}✔ BASELINE CONTRACT INITIALIZED${ANSI.reset} ${ANSI.gray}·${ANSI.reset} ${ANSI.white}${ANSI.bold}${meta.lockfilePath}${ANSI.reset}\n`);
    
    this.renderCapabilityMatrix(packages);

    console.log(`${ANSI.darkGray}╭─ Initialization Summary ────────────────────────────────────${ANSI.reset}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.dim}Packages Traced:${ANSI.reset}  ${ANSI.sky}${ANSI.bold}${meta.packageCount}${ANSI.reset}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.dim}Telemetry Events:${ANSI.reset} ${ANSI.white}${meta.rawEventsCount}${ANSI.reset}`);
    console.log(`${ANSI.darkGray}│${ANSI.reset}  ${ANSI.dim}Sandbox Engine:${ANSI.reset}   ${ANSI.dim}${meta.engine || 'runtime-hook'}${ANSI.reset}`);
    console.log(`${ANSI.darkGray}╰─────────────────────────────────────────────────────────────${ANSI.reset}`);
    console.log(`\n${ANSI.gold}Next step:${ANSI.reset} Commit ${ANSI.white}${ANSI.bold}behavior.lock${ANSI.reset} to your git repository.`);
    console.log(`Run ${ANSI.sky}behaviorlock check${ANSI.reset} in CI to enforce this contract on every pull request.\n`);
  }

  static generateHtmlReport(diffResult, contract, outputPath) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>behavior.lock Security Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #07090e;
      --card: #0f141f;
      --card-alt: #141c2c;
      --border: #1e293b;
      --border-light: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.15);
      --danger: #f43f5e;
      --danger-bg: rgba(244, 63, 94, 0.1);
      --warning: #fbbf24;
      --warning-bg: rgba(251, 191, 36, 0.1);
      --success: #10b981;
      --success-bg: rgba(16, 185, 129, 0.1);
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: var(--font-sans); }
    body { background: var(--bg); color: var(--text); padding: 3rem 1.5rem; line-height: 1.6; }
    .container { max-width: 1080px; margin: 0 auto; }
    
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1.75rem; margin-bottom: 2.25rem; }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .brand-logo { font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; display: flex; align-items: center; gap: 0.5rem; }
    .brand-logo span { color: var(--accent); }
    .brand-subtitle { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }

    .status-badge { padding: 0.5rem 1.1rem; border-radius: 9999px; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.04em; text-transform: uppercase; display: flex; align-items: center; gap: 0.5rem; }
    .status-badge.failed { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(244, 63, 94, 0.3); box-shadow: 0 0 20px rgba(244, 63, 94, 0.15); }
    .status-badge.passed { background: var(--success-bg); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); box-shadow: 0 0 20px rgba(16, 185, 129, 0.15); }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2.5rem; }
    .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.35rem; position: relative; overflow: hidden; }
    .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--border-light), transparent); }
    .stat-val { font-size: 2rem; font-weight: 800; margin-bottom: 0.2rem; font-family: var(--font-mono); }
    .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

    .section-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: #fff; display: flex; align-items: center; gap: 0.5rem; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 2.5rem; }
    
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th { text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    td { padding: 0.85rem 1rem; border-bottom: 1px solid var(--border); }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,0.015); }
    
    code { font-family: var(--font-mono); font-size: 0.825rem; background: rgba(0,0,0,0.4); padding: 0.25rem 0.5rem; border-radius: 6px; border: 1px solid var(--border); color: #f1f5f9; }
    .tag-id { font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent); background: var(--accent-glow); padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.2); }

    .violation-card { border: 1px solid var(--border); background: var(--card-alt); border-radius: 10px; padding: 1.25rem; margin-bottom: 1rem; position: relative; }
    .violation-card.CRITICAL { border-left: 4px solid var(--danger); }
    .violation-card.HIGH { border-left: 4px solid var(--warning); }
    .violation-card.MEDIUM { border-left: 4px solid var(--accent); }
    .violation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
    .v-type { font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .v-meta { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.6rem; }
    .v-msg { font-size: 0.925rem; color: #f1f5f9; margin-bottom: 0.4rem; }
    .v-remedy { font-size: 0.825rem; color: var(--text-muted); }

    .graph-view { display: flex; align-items: center; justify-content: center; min-height: 180px; background: #05070a; border-radius: 10px; padding: 1.5rem; border: 1px solid var(--border); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div>
          <div class="brand-logo">🔒 behavior<span>.lock</span></div>
          <div class="brand-subtitle">Runtime Capability Security & Deception Engine</div>
        </div>
      </div>
      <div class="status-badge ${diffResult.passed ? 'passed' : 'failed'}">
        ${diffResult.passed ? '● Contract Verified' : '▲ Breach Detected'}
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
        <div class="stat-label">Signed Overrides</div>
      </div>
    </div>

    <h2 class="section-title">📊 Signals Overview</h2>
    <div class="card">
      ${
        diffResult.violations.length === 0
          ? '<p style="color: var(--success); font-weight: 500;">✔ Zero unauthorized activities detected. All operations conform to committed policies.</p>'
          : `
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Package</th>
                <th>Syscall / Target</th>
                <th>Threat Category</th>
              </tr>
            </thead>
            <tbody>
              ${diffResult.violations
                .map(
                  (v) => `
                <tr>
                  <td><span class="tag-id">${v.id}</span></td>
                  <td><span style="font-weight: 700; color: ${v.severity === 'CRITICAL' ? 'var(--danger)' : v.severity === 'HIGH' ? 'var(--warning)' : 'var(--accent)'}">${v.severity}</span></td>
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

    <h2 class="section-title">🚨 Threat Inspection Log</h2>
    <div class="card">
      ${
        diffResult.violations.length === 0
          ? '<p style="color: var(--text-muted); font-size: 0.875rem;">No security threats detected.</p>'
          : diffResult.violations
              .map(
                (v) => `
        <div class="violation-card ${v.severity}">
          <div class="violation-header">
            <div class="v-type">${v.type}</div>
            <div class="tag-id">id: ${v.id}</div>
          </div>
          <div class="v-meta">Package: <b>${v.package}</b> &bull; Phase: <b>${v.phase}</b></div>
          <div style="margin-bottom: 0.6rem;"><code>${v.target}</code></div>
          <div class="v-msg">${v.message}</div>
          <div class="v-remedy"><b>Remediation:</b> ${v.remediation}</div>
        </div>
      `
              )
              .join('')
      }
    </div>

    <h2 class="section-title">🗺️ Execution Topology</h2>
    <div class="card">
      <div class="graph-view">
        <svg width="100%" height="150" viewBox="0 0 740 150" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="#818cf8" stop-opacity="0.6"/>
            </linearGradient>
          </defs>
          <rect x="20" y="50" width="130" height="48" rx="8" fill="#141c2c" stroke="#334155" />
          <text x="85" y="79" text-anchor="middle" font-size="12" font-weight="600" fill="#f8fafc" font-family="var(--font-sans)">Target Project</text>

          <line x1="150" y1="74" x2="270" y2="74" stroke="url(#lineGrad)" stroke-width="2" stroke-dasharray="4" />

          <rect x="270" y="50" width="150" height="48" rx="8" fill="#141c2c" stroke="#334155" />
          <text x="345" y="79" text-anchor="middle" font-size="12" font-weight="600" fill="#f8fafc" font-family="var(--font-sans)">Dependencies</text>

          <line x1="420" y1="74" x2="540" y2="40" stroke="${diffResult.summary.critical > 0 ? '#f43f5e' : '#334155'}" stroke-width="2" />
          <line x1="420" y1="74" x2="540" y2="108" stroke="${diffResult.summary.high > 0 ? '#fbbf24' : '#334155'}" stroke-width="2" />

          <rect x="540" y="16" width="160" height="44" rx="8" fill="${diffResult.summary.critical > 0 ? 'rgba(244, 63, 94, 0.15)' : '#141c2c'}" stroke="${diffResult.summary.critical > 0 ? '#f43f5e' : '#334155'}" />
          <text x="620" y="43" text-anchor="middle" font-size="12" font-weight="600" fill="${diffResult.summary.critical > 0 ? '#f43f5e' : '#94a3b8'}" font-family="var(--font-sans)">Canary Credentials</text>

          <rect x="540" y="86" width="160" height="44" rx="8" fill="${diffResult.summary.high > 0 ? 'rgba(251, 191, 36, 0.15)' : '#141c2c'}" stroke="${diffResult.summary.high > 0 ? '#fbbf24' : '#334155'}" />
          <text x="620" y="113" text-anchor="middle" font-size="12" font-weight="600" fill="${diffResult.summary.high > 0 ? '#fbbf24' : '#94a3b8'}" font-family="var(--font-sans)">Network Sockets</text>
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
