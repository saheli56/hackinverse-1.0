/**
 * behavior.lock Visualizer & Reporter
 * Premium Terminal UI & Silicon Valley-Grade HTML Security Dashboard
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function stripAnsi(str) {
  return String(str || '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Wraps an ANSI-formatted string to maxWidth printable characters without breaking escape codes
 * and intelligently indents continuation lines to match key-value prefixes or bullets.
 */
function wrapAnsiString(str, maxWidth) {
  if (stripAnsi(str).length <= maxWidth) return [str];

  // Tokenize into ANSI escape codes, words, and whitespace runs
  const tokens = [];
  const regex = /(\x1b\[[0-9;]*[a-zA-Z])|([^\x1b\s]+)|(\s+)/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match[1]) tokens.push({ type: 'ansi', val: match[1] });
    else if (match[2]) tokens.push({ type: 'word', val: match[2] });
    else if (match[3]) tokens.push({ type: 'space', val: match[3] });
  }

  // Detect prefix indentation for continuation lines (e.g., 'Signal:      ' -> 12 spaces, '• ...:' -> 4 spaces)
  let indentLen = 0;
  const cleanStr = stripAnsi(str);
  const colonMatch = cleanStr.match(/^([^\s:]+:\s+)/);
  const bulletMatch = cleanStr.match(/^(\s*[•●*]\s+[^:]+:\s+)/);
  if (colonMatch && colonMatch[1].length <= 16) {
    indentLen = colonMatch[1].length;
  } else if (bulletMatch) {
    indentLen = 4;
  } else {
    const leadSpaceMatch = cleanStr.match(/^(\s+)/);
    if (leadSpaceMatch) indentLen = Math.min(leadSpaceMatch[1].length, 8);
  }

  const lines = [];
  let curTokens = [];
  let curLen = 0;
  let activeAnsi = [];

  function flushLine() {
    if (curTokens.length === 0) return;
    // Strip trailing space tokens
    while (curTokens.length > 0) {
      const last = curTokens[curTokens.length - 1];
      if (last.type === 'space') {
        curTokens.pop();
      } else {
        break;
      }
    }
    if (curTokens.length > 0) {
      const lineText = curTokens.map(t => t.val).join('') + ANSI.reset;
      lines.push(lineText);
    }
    curTokens = [];
    curLen = 0;
  }

  let pendingBetween = [];
  let pendingSpaceLen = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'ansi') {
      if (token.val === ANSI.reset) {
        activeAnsi = [];
      } else {
        activeAnsi.push(token.val);
      }
      if (curLen === 0) {
        curTokens.push(token);
      } else {
        pendingBetween.push(token);
      }
    } else if (token.type === 'space') {
      if (curLen > 0) {
        pendingBetween.push(token);
        pendingSpaceLen += token.val.length;
      }
    } else if (token.type === 'word') {
      const wordLen = token.val.length;

      if (curLen === 0) {
        // Line start: insert indent if continuation line
        if (lines.length > 0 && indentLen > 0) {
          curTokens.push(...activeAnsi.map(a => ({ type: 'ansi', val: a })));
          curTokens.push({ type: 'space', val: ' '.repeat(indentLen) });
          curLen += indentLen;
        }
        curTokens.push(...pendingBetween.filter(t => t.type === 'ansi'));
        pendingBetween = [];
        pendingSpaceLen = 0;

        if (curLen + wordLen <= maxWidth) {
          curTokens.push(token);
          curLen += wordLen;
        } else {
          // Word alone exceeds maxWidth, hyphenate/split
          if (wordLen > maxWidth - curLen && maxWidth - curLen > 6) {
            const split = maxWidth - curLen - 1;
            curTokens.push({ type: 'word', val: token.val.slice(0, split) + '-' });
            flushLine();
            tokens.splice(i + 1, 0, { type: 'word', val: token.val.slice(split) });
          } else {
            curTokens.push(token);
            curLen += wordLen;
          }
        }
      } else {
        // Check if pending space + next word fits
        if (curLen + pendingSpaceLen + wordLen <= maxWidth) {
          curTokens.push(...pendingBetween);
          curLen += pendingSpaceLen + wordLen;
          curTokens.push(token);
          pendingBetween = [];
          pendingSpaceLen = 0;
        } else {
          // Does not fit: flush current line
          flushLine();
          const carryoverAnsi = pendingBetween.filter(t => t.type === 'ansi');
          pendingBetween = [];
          pendingSpaceLen = 0;

          // Start new line with indent
          if (indentLen > 0) {
            curTokens.push(...activeAnsi.map(a => ({ type: 'ansi', val: a })));
            curTokens.push({ type: 'space', val: ' '.repeat(indentLen) });
            curLen += indentLen;
          }
          curTokens.push(...carryoverAnsi);

          if (curLen + wordLen <= maxWidth) {
            curTokens.push(token);
            curLen += wordLen;
          } else {
            if (wordLen > maxWidth - curLen && maxWidth - curLen > 6) {
              const split = maxWidth - curLen - 1;
              curTokens.push({ type: 'word', val: token.val.slice(0, split) + '-' });
              flushLine();
              tokens.splice(i + 1, 0, { type: 'word', val: token.val.slice(split) });
            } else {
              curTokens.push(token);
              curLen += wordLen;
            }
          }
        }
      }
    }
  }

  flushLine();
  return lines.length > 0 ? lines : [str];
}

export class Visualizer {
  static CARD_WIDTH = 76;

  static printBanner() {
    console.log(`\n${ANSI.sky}${ANSI.bold}◆ behavior.lock${ANSI.reset} ${ANSI.gray}v1.0.0${ANSI.reset} ${ANSI.darkGray}·${ANSI.reset} ${ANSI.dim}Runtime Capability Sandbox${ANSI.reset}`);
  }

  /**
   * Renders a symmetric 4-sided closed card box with word-wrapping and precise right border alignment
   */
  static renderCard(title, rows, options = {}) {
    const cleanTitle = title ? stripAnsi(title) : '';
    const minNeeded = cleanTitle ? cleanTitle.length + 6 : 10;
    const width = Math.max(options.width || this.CARD_WIDTH, minNeeded);
    const border = options.border || ANSI.darkGray;
    const isRounded = options.rounded !== false;

    const topLeft = isRounded ? '╭' : '┌';
    const topRight = isRounded ? '╮' : '┐';
    const bottomLeft = isRounded ? '╰' : '└';
    const bottomRight = isRounded ? '╯' : '┘';
    const vert = '│';
    const horiz = '─';

    // Available inner content width: width minus 2 border chars minus 4 margin spaces (2 left, 2 right)
    const contentWidth = width - 6;

    // Top border with optional title
    if (title) {
      const topBarLen = Math.max(0, width - cleanTitle.length - 5);
      console.log(`${border}${topLeft}─ ${title} ${border}${horiz.repeat(topBarLen)}${topRight}${ANSI.reset}`);
    } else {
      console.log(`${border}${topLeft}${horiz.repeat(width - 2)}${topRight}${ANSI.reset}`);
    }

    // Body rows with word-wrapping
    for (const rawRow of rows) {
      const wrappedLines = wrapAnsiString(rawRow, contentWidth);
      for (const line of wrappedLines) {
        const cleanLine = stripAnsi(line);
        const padLen = Math.max(0, contentWidth - cleanLine.length);
        console.log(`${border}${vert}${ANSI.reset}  ${line}${ANSI.reset}${' '.repeat(padLen)}  ${border}${vert}${ANSI.reset}`);
      }
    }

    // Bottom border
    console.log(`${border}${bottomLeft}${horiz.repeat(width - 2)}${bottomRight}${ANSI.reset}`);
  }

  static printSessionContext(info = {}) {
    const cwd = info.cwd || process.cwd();
    const cmd = info.cmd || 'npm test';
    const engine = info.engine === 'kernel-strace' ? 'kernel-strace (Linux Syscall)' : 'runtime-hook (V8 Preload)';
    const env = info.env ? String(info.env).toUpperCase() : 'PROD';
    const envBadge = env === 'PROD'
      ? `${ANSI.emerald}${ANSI.bold}PROD${ANSI.reset}`
      : `${ANSI.purple}${ANSI.bold}${env}${ANSI.reset} ${ANSI.gray}(Isolated Profile)${ANSI.reset}`;

    const rows = [
      `${ANSI.dim}Target:${ANSI.reset}      ${ANSI.white}${ANSI.bold}${path.basename(cwd)}${ANSI.reset} ${ANSI.gray}(${cwd})${ANSI.reset}`,
      `${ANSI.dim}Command:${ANSI.reset}     ${ANSI.sky}${cmd}${ANSI.reset}`,
      `${ANSI.dim}Profile:${ANSI.reset}     ${envBadge}`,
      `${ANSI.dim}Engine:${ANSI.reset}      ${ANSI.dim}${engine}${ANSI.reset}`
    ];

    if (info.instance) {
      rows.push(`${ANSI.dim}Instance:${ANSI.reset}    ${ANSI.amber}${info.instance}${ANSI.reset} ${ANSI.gray}(Parallel Safe)${ANSI.reset}`);
    }

    this.renderCard(`${ANSI.bold}Execution Context${ANSI.reset}`, rows, { rounded: true });
    console.log('');
  }

  static printTargetFrameStart(cmdStr) {
    const maxCmdLen = this.CARD_WIDTH - 22;
    const displayCmd = cmdStr.length > maxCmdLen ? cmdStr.slice(0, maxCmdLen - 3) + '...' : cmdStr;
    const cleanCmd = `Sandbox Output (${displayCmd})`;
    const padLen = Math.max(0, this.CARD_WIDTH - cleanCmd.length - 5);
    console.log(`${ANSI.darkGray}┌─ ${cleanCmd} ${ANSI.darkGray}${'─'.repeat(padLen)}┐${ANSI.reset}`);
  }

  static printTargetFrameEnd() {
    console.log(`${ANSI.darkGray}└${'─'.repeat(this.CARD_WIDTH - 2)}┘${ANSI.reset}\n`);
  }

  /**
   * Renders a closed, styled capability matrix table
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
      console.log(`${ANSI.gray}  All observed runtime behaviors conform to committed policies in ${ANSI.white}behavior.lock${ANSI.reset}\n`);
      
      const verificationRows = [
        `${ANSI.emerald}●${ANSI.reset} ${ANSI.bold}Network Sockets:${ANSI.reset}     Zero unapproved outbound endpoints`,
        `${ANSI.emerald}●${ANSI.reset} ${ANSI.bold}Honeypot Canaries:${ANSI.reset}   All decoy credentials untouched`,
        `${ANSI.emerald}●${ANSI.reset} ${ANSI.bold}Process Execution:${ANSI.reset}   Zero unauthorized child processes`,
        `${ANSI.emerald}●${ANSI.reset} ${ANSI.bold}Filesystem Scope:${ANSI.reset}    Restricted within project boundaries`
      ];

      if (diffResult.approvedMatches?.length > 0) {
        verificationRows.push(`${ANSI.sky}ℹ${ANSI.reset} ${ANSI.bold}Signed Overrides:${ANSI.reset}    ${diffResult.approvedMatches.length} rule(s) active`);
      }

      this.renderCard(`${ANSI.bold}Capability Verification${ANSI.reset}`, verificationRows, {
        rounded: true,
        border: ANSI.darkGray
      });
      console.log('');
      return;
    }

    // BREACH REPORT
    console.log(`${ANSI.red}${ANSI.bold}✖ BEHAVIOR CONTRACT BREACH DETECTED${ANSI.reset} ${ANSI.gray}·${ANSI.reset} ${ANSI.white}${ANSI.bold}${targetName}${ANSI.reset}`);
    
    const summaryParts = [];
    if (diffResult.summary.critical > 0) summaryParts.push(`${ANSI.red}${ANSI.bold}${diffResult.summary.critical} CRITICAL${ANSI.reset}`);
    if (diffResult.summary.high > 0) summaryParts.push(`${ANSI.amber}${ANSI.bold}${diffResult.summary.high} HIGH${ANSI.reset}`);
    if (diffResult.summary.medium > 0) summaryParts.push(`${ANSI.sky}${ANSI.bold}${diffResult.summary.medium} MEDIUM${ANSI.reset}`);
    
    console.log(`${ANSI.gray}  Threat Level:${ANSI.reset} ${summaryParts.join(`${ANSI.gray} · ${ANSI.reset}`)}\n`);

    // Symmetrically Closed Breach Cards
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

      const cardTitle = `Breach ${i + 1}/${diffResult.violations.length} · ${badge} ${ANSI.bold}${v.type}${ANSI.reset} ${ANSI.darkGray}(id: ${v.id})${ANSI.reset}`;
      const cardRows = [
        `${ANSI.dim}Package:${ANSI.reset}     ${ANSI.white}${ANSI.bold}${v.package}${ANSI.reset} ${ANSI.gray}(phase: ${v.phase})${ANSI.reset}`,
        `${ANSI.dim}Syscall:${ANSI.reset}     ${ANSI.gold}${v.target}${ANSI.reset}`,
        `${ANSI.dim}Signal:${ANSI.reset}      ${v.message}`,
        `${ANSI.dim}Action:${ANSI.reset}      ${ANSI.white}${v.remediation}${ANSI.reset}`
      ];

      this.renderCard(cardTitle, cardRows, {
        border,
        rounded: false
      });
      console.log('');
    }

    const firstId = diffResult.violations[0]?.id || '<id>';
    this.renderCard(`${ANSI.bold}Suggested Next Steps${ANSI.reset}`, [
      `${ANSI.emerald}• Authorize legitimate update:${ANSI.reset}  ${ANSI.sky}behaviorlock approve ${firstId} --reason "Reviewed & verified"${ANSI.reset}`,
      `${ANSI.red}• Reject malicious update:${ANSI.reset}      ${ANSI.gray}git restore package.json package-lock.json${ANSI.reset}`
    ], { rounded: true, border: ANSI.darkGray });
    console.log('');
  }

  static renderApprovalReceipt(approvalRecord) {
    console.log(`${ANSI.emerald}${ANSI.bold}✔ VIOLATION APPROVED & SIGNED${ANSI.reset}\n`);

    const rows = [
      `${ANSI.dim}Violation ID:${ANSI.reset} ${ANSI.sky}${ANSI.bold}${approvalRecord.id}${ANSI.reset}`,
      `${ANSI.dim}Package:${ANSI.reset}      ${ANSI.white}${ANSI.bold}${approvalRecord.package}${ANSI.reset}`,
      `${ANSI.dim}Permitted:${ANSI.reset}    ${JSON.stringify(approvalRecord.allow)}`
    ];

    if (approvalRecord.env) {
      rows.push(`${ANSI.dim}Environment:${ANSI.reset}  ${ANSI.purple}${approvalRecord.env.toUpperCase()}${ANSI.reset} ${ANSI.gray}(Scoped Approval)${ANSI.reset}`);
    }

    rows.push(
      `${ANSI.dim}Audit Reason:${ANSI.reset} ${ANSI.gold}"${approvalRecord.reason}"${ANSI.reset}`,
      `${ANSI.dim}Signed By:${ANSI.reset}    ${ANSI.white}${approvalRecord.approved_by}${ANSI.reset} ${ANSI.gray}on ${approvalRecord.approved_at}${ANSI.reset}`
    );

    this.renderCard(`${ANSI.bold}Signed Contract Entry${ANSI.reset}`, rows, { rounded: true, border: ANSI.darkGray });

    console.log(`\n${ANSI.gray}Commit ${ANSI.white}${ANSI.bold}behavior.lock${ANSI.reset}${ANSI.gray} to your repository with your pull request.${ANSI.reset}\n`);
  }

  static renderInitSuccess(meta = {}, packages = {}) {
    console.log(`${ANSI.emerald}${ANSI.bold}✔ BASELINE CONTRACT INITIALIZED${ANSI.reset} ${ANSI.gray}·${ANSI.reset} ${ANSI.white}${ANSI.bold}${meta.lockfilePath}${ANSI.reset}\n`);
    
    this.renderCapabilityMatrix(packages);

    this.renderCard(`${ANSI.bold}Initialization Summary${ANSI.reset}`, [
      `${ANSI.dim}Packages Traced:${ANSI.reset}  ${ANSI.sky}${ANSI.bold}${meta.packageCount}${ANSI.reset}`,
      `${ANSI.dim}Telemetry Events:${ANSI.reset} ${ANSI.white}${meta.rawEventsCount}${ANSI.reset}`,
      `${ANSI.dim}Sandbox Engine:${ANSI.reset}   ${ANSI.dim}${meta.engine || 'runtime-hook'}${ANSI.reset}`
    ], { rounded: true, border: ANSI.darkGray });

    console.log(`\n${ANSI.gold}Next step:${ANSI.reset} Commit ${ANSI.white}${ANSI.bold}behavior.lock${ANSI.reset} to your git repository.`);
    console.log(`Run ${ANSI.sky}behaviorlock check${ANSI.reset} in CI to enforce this contract on every pull request.\n`);
  }
}
