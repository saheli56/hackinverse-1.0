/**
 * behavior.lock Differ and Risk Scoring Engine
 * Compares observed behavior against the committed lockfile and signed approvals.
 */

import crypto from 'node:crypto';

export class Differ {
  constructor(baselineLockfile) {
    this.baseline = baselineLockfile || { packages: {}, approvals: [] };
    this.approvals = this.baseline.approvals || [];
  }

  diff(observedContract) {
    const violations = [];
    const approvedMatches = [];

    for (const [pkgName, observedData] of Object.entries(observedContract)) {
      const baselineData = this.baseline.packages?.[pkgName];

      // 1. Check for Canary Breaches (Instant CRITICAL)
      if (Array.isArray(observedData.secrets) && observedData.secrets.length > 0) {
        for (const breach of observedData.secrets) {
          const id = this.generateId(pkgName, 'canary', breach.target);
          violations.push({
            id,
            package: pkgName,
            phase: breach.phase,
            type: 'SECRET_CANARY_TRIPWIRE',
            severity: 'CRITICAL',
            target: breach.target,
            message: `Decoy credential breached: ${breach.detail} (${breach.target})`,
            remediation: 'Supply chain compromise suspected. Reject this package version.'
          });
        }
      }

      // Check each phase: install, runtime
      for (const phase of ['install', 'runtime']) {
        const obsPhase = observedData[phase] || { network: [], fs_read: [], fs_write: [], exec: [] };
        const basePhase = baselineData?.[phase] || { network: [], fs_read: [], fs_write: [], exec: [] };

        // Network Diff
        for (const netTarget of obsPhase.network) {
          if (!basePhase.network.includes(netTarget)) {
            if (this.isApproved(pkgName, phase, 'network', netTarget)) {
              approvedMatches.push({ package: pkgName, type: 'network', target: netTarget });
            } else {
              const severity = phase === 'install' ? 'CRITICAL' : 'HIGH';
              violations.push({
                id: this.generateId(pkgName, phase, 'network', netTarget),
                package: pkgName,
                phase,
                type: 'NETWORK_ANOMALY',
                severity,
                target: netTarget,
                message: `New outbound connection to ${netTarget} during ${phase} phase`,
                remediation: `Review network endpoint. Run 'behaviorlock approve <id> --reason "..."' if intended.`
              });
            }
          }
        }

        // Process Spawn Diff
        for (const execTarget of obsPhase.exec) {
          if (!basePhase.exec.includes(execTarget)) {
            if (this.isApproved(pkgName, phase, 'exec', execTarget)) {
              approvedMatches.push({ package: pkgName, type: 'exec', target: execTarget });
            } else {
              const isShell = /sh|bash|powershell|cmd|curl|wget/i.test(execTarget);
              const severity = isShell ? 'HIGH' : 'MEDIUM';
              violations.push({
                id: this.generateId(pkgName, phase, 'exec', execTarget),
                package: pkgName,
                phase,
                type: 'PROCESS_SPAWN',
                severity,
                target: execTarget,
                message: `Spawned unexpected process: ${execTarget}`,
                remediation: `Inspect script trigger. Approve if required for native build.`
              });
            }
          }
        }

        // Filesystem Read Diff (Outside project)
        for (const readTarget of obsPhase.fs_read) {
          if (!basePhase.fs_read.includes(readTarget)) {
            if (this.isApproved(pkgName, phase, 'fs_read', readTarget)) {
              approvedMatches.push({ package: pkgName, type: 'fs_read', target: readTarget });
            } else {
              const isSensitive = /credentials|\.ssh|\.env/i.test(readTarget);
              const severity = isSensitive ? 'CRITICAL' : 'MEDIUM';
              violations.push({
                id: this.generateId(pkgName, phase, 'fs_read', readTarget),
                package: pkgName,
                phase,
                type: 'FS_READ_ANOMALY',
                severity,
                target: readTarget,
                message: `Read path outside baseline: ${readTarget}`,
                remediation: `Check why package accesses external system path.`
              });
            }
          }
        }
      }
    }

    // Sort violations by severity: CRITICAL > HIGH > MEDIUM > LOW
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    violations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      passed: violations.length === 0,
      violations,
      approvedMatches,
      summary: {
        totalViolations: violations.length,
        critical: violations.filter((v) => v.severity === 'CRITICAL').length,
        high: violations.filter((v) => v.severity === 'HIGH').length,
        medium: violations.filter((v) => v.severity === 'MEDIUM').length
      }
    };
  }

  isApproved(pkgName, phase, signalType, target) {
    for (const app of this.approvals) {
      if (app.package === pkgName || app.package === '*') {
        const allowedTargets = app.allow?.[signalType] || [];
        if (allowedTargets.includes(target) || allowedTargets.includes('*')) {
          // Check expiration
          if (app.expires && new Date(app.expires) < new Date()) {
            return false; // approval expired
          }
          return true;
        }
      }
    }
    return false;
  }

  generateId(pkg, phase, type, target = '') {
    const raw = `${pkg}:${phase}:${type}:${target}`;
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 4);
  }
}
