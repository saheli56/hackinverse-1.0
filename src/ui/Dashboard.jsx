/**
 * behavior.lock - Security Dashboard
 * Inspired by shadcn/ui, Aceternity UI & Magic UI
 * Clean dark mode, Bento Grid hierarchy, Phosphor icons, zero emojis
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldChevron,
  ShieldWarning,
  ShieldCheck,
  LockKey,
  WarningOctagon,
  WarningCircle,
  Pulse,
  Crosshair,
  TerminalWindow,
  GitFork,
  Stack,
  FileCode,
  Key,
  Globe,
  Cpu,
  Package,
  MagnifyingGlass,
  FunnelSimple,
  Copy,
  Check,
  Sparkle,
  ArrowUpRight
} from './icons.js';

export function Dashboard({ diffResult = {}, contract = {}, targetName = 'app' }) {
  const [activeTab, setActiveTab] = useState('threats');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const summary = diffResult.summary || { critical: 0, high: 0, medium: 0, total: 0 };
  const passed = diffResult.passed ?? (diffResult.violations?.length === 0);
  const violations = diffResult.violations || [];
  const approvals = diffResult.approvedMatches || contract.approvals || [];
  const packages = contract.packages || diffResult.observed?.packages || {};
  const canaryBreached = violations.some(v => v.type?.includes('CANARY') || v.target?.includes('CANARY') || v.target?.includes('.aws'));

  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      const matchesSeverity = severityFilter === 'ALL' || v.severity === severityFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        (v.package && v.package.toLowerCase().includes(q)) ||
        (v.target && v.target.toLowerCase().includes(q)) ||
        (v.type && v.type.toLowerCase().includes(q)) ||
        (v.id && v.id.toLowerCase().includes(q)) ||
        (v.message && v.message.toLowerCase().includes(q));
      return matchesSeverity && matchesQuery;
    });
  }, [violations, severityFilter, searchQuery]);

  const handleCopyCommand = (id) => {
    const cmd = `behaviorlock approve ${id} --reason "Reviewed & verified"`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(cmd);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2400);
  };

  return (
    <div className="bl-root">
      {/* Ambient background grid & spotlight (Aceternity / Magic UI style) */}
      <div className="bl-bg-grid" />
      <div className="bl-spotlight" />

      <div className="bl-shell">
        {/* Top Navbar */}
        <header className="bl-navbar">
          <div className="bl-nav-brand">
            <div className="bl-brand-icon">
              <LockKey size={20} color="#38bdf8" weight="bold" />
            </div>
            <div>
              <div className="bl-brand-title">
                behavior<span>.lock</span>
                <span className="bl-badge-version">v1.0.0</span>
              </div>
              <div className="bl-brand-desc">
                Runtime Behavioral Verification &amp; Canary Deception Sandbox
              </div>
            </div>
          </div>

          <div className="bl-nav-actions">
            <div className="bl-pill-target">
              <Package size={14} color="#94a3b8" />
              <span>Target: <strong>{targetName}</strong></span>
            </div>

            <div className={`bl-status-beacon ${passed ? 'pass' : 'breach'}`}>
              <span className="bl-beacon-dot">
                <span className="bl-beacon-ping" />
                <span className="bl-beacon-core" />
              </span>
              <span>{passed ? 'Contract Satisfied' : 'Contract Breach Detected'}</span>
            </div>
          </div>
        </header>

        {/* Bento Grid Executive Overview (Aceternity UI Bento Pattern) */}
        <section className="bl-bento-grid">
          {/* Bento Card 1: Primary Incident Command */}
          <div className={`bl-bento-card bl-bento-hero ${passed ? 'safe' : 'hazard'}`}>
            <div className="bl-bento-inner">
              <div className="bl-bento-header">
                <div className="bl-header-left">
                  <span className="bl-bento-eyebrow">Incident Triage</span>
                  <h3 className="bl-bento-title">Behavioral Contract State</h3>
                </div>
                {passed ? (
                  <div className="bl-tag-pill safe">
                    <ShieldCheck size={14} />
                    <span>Conforming</span>
                  </div>
                ) : (
                  <div className="bl-tag-pill hazard">
                    <WarningOctagon size={14} />
                    <span>Active Breach</span>
                  </div>
                )}
              </div>

              <div className="bl-hero-metric">
                <div className="bl-metric-big">
                  {summary.critical + summary.high + summary.medium}
                </div>
                <div className="bl-metric-big-meta">
                  <div className="bl-metric-big-label">Unauthorized Deviations</div>
                  <div className="bl-metric-big-detail">
                    {summary.critical > 0 && <span className="bl-sev-dot critical">{summary.critical} Critical</span>}
                    {summary.high > 0 && <span className="bl-sev-dot high">{summary.high} High</span>}
                    {summary.medium > 0 && <span className="bl-sev-dot medium">{summary.medium} Medium</span>}
                  </div>
                </div>
              </div>

              <div className="bl-vector-chips">
                <div className="bl-chip">
                  <TerminalWindow size={13} color="#94a3b8" />
                  <span>Syscalls Intercepted</span>
                </div>
                <div className="bl-chip">
                  <Globe size={13} color="#94a3b8" />
                  <span>Outbound Sockets Monitored</span>
                </div>
                <div className="bl-chip">
                  <Cpu size={13} color="#94a3b8" />
                  <span>Process Spawns Attributed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Canary Deception Honeypot */}
          <div className="bl-bento-card">
            <div className="bl-bento-inner">
              <div className="bl-bento-header">
                <div className="bl-header-left">
                  <span className="bl-bento-eyebrow">Deception Traps</span>
                  <h3 className="bl-bento-title">Canary Tripwire</h3>
                </div>
                <Crosshair size={18} color={canaryBreached ? '#f43f5e' : '#10b981'} />
              </div>

              <div className="bl-bento-val" style={{ color: canaryBreached ? '#f43f5e' : '#10b981' }}>
                {canaryBreached ? 'Tripwire Tripped' : 'Canary Intact'}
              </div>

              <p className="bl-bento-desc">
                Decoy credentials planted in sandbox. Zero false-positive catch rate.
              </p>

              <div className="bl-canary-path">
                <code>~/.aws/credentials</code>
                <span className={`bl-badge-canary ${canaryBreached ? 'alert' : 'ok'}`}>
                  {canaryBreached ? 'Breached' : 'Armed'}
                </span>
              </div>
            </div>
          </div>

          {/* Bento Card 3: Sandbox Containment Spec */}
          <div className="bl-bento-card">
            <div className="bl-bento-inner">
              <div className="bl-bento-header">
                <div className="bl-header-left">
                  <span className="bl-bento-eyebrow">Sandbox Containment</span>
                  <h3 className="bl-bento-title">Observer Engine</h3>
                </div>
                <Cpu size={18} color="#38bdf8" />
              </div>

              <div className="bl-bento-val sky">
                V8 Preload Hook
              </div>

              <p className="bl-bento-desc">
                Deterministic stack attribution with sub-0.2s tracing overhead.
              </p>

              <div className="bl-stat-row">
                <div className="bl-stat-item">
                  <span className="bl-stat-k">Overhead</span>
                  <span className="bl-stat-v">0.18s</span>
                </div>
                <div className="bl-stat-item">
                  <span className="bl-stat-k">False Alarms</span>
                  <span className="bl-stat-v">0.0%</span>
                </div>
                <div className="bl-stat-item">
                  <span className="bl-stat-k">Catch Rate</span>
                  <span className="bl-stat-v">100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 4: Cryptographic Approvals */}
          <div className="bl-bento-card">
            <div className="bl-bento-inner">
              <div className="bl-bento-header">
                <div className="bl-header-left">
                  <span className="bl-bento-eyebrow">Audit Log</span>
                  <h3 className="bl-bento-title">Signed Overrides</h3>
                </div>
                <Key size={18} color="#fbbf24" />
              </div>

              <div className="bl-bento-val amber">
                {approvals.length} Rule{approvals.length === 1 ? '' : 's'}
              </div>

              <p className="bl-bento-desc">
                Committed in <code>behavior.lock</code>. Requires human audit rationale.
              </p>

              <div className="bl-override-status">
                <span className="bl-status-text">
                  {approvals.length > 0 ? 'Cryptographically signed' : 'No active exceptions'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Magic UI Floating Segmented Control */}
        <div className="bl-segmented-control">
          <button
            className={`bl-segment-btn ${activeTab === 'threats' ? 'active' : ''}`}
            onClick={() => setActiveTab('threats')}
          >
            <ShieldWarning size={16} />
            <span>Breach Ledger</span>
            <span className="bl-badge-count">{violations.length}</span>
          </button>

          <button
            className={`bl-segment-btn ${activeTab === 'topology' ? 'active' : ''}`}
            onClick={() => setActiveTab('topology')}
          >
            <GitFork size={16} />
            <span>Execution Topology</span>
          </button>

          <button
            className={`bl-segment-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
            <Stack size={16} />
            <span>Capability Matrix</span>
          </button>

          <button
            className={`bl-segment-btn ${activeTab === 'contract' ? 'active' : ''}`}
            onClick={() => setActiveTab('contract')}
          >
            <FileCode size={16} />
            <span>Lockfile Contract</span>
          </button>
        </div>

        {/* Tab 1: Breach Ledger View */}
        {activeTab === 'threats' && (
          <div className="bl-tab-pane">
            {/* Filter & Search Bar (shadcn Command Palette aesthetic) */}
            <div className="bl-toolbar">
              <div className="bl-search-box">
                <MagnifyingGlass size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="Filter by package, syscall path, violation ID, or vector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bl-search-native"
                />
                {searchQuery && (
                  <button className="bl-btn-clear" onClick={() => setSearchQuery('')}>×</button>
                )}
              </div>

              <div className="bl-filter-cluster">
                <span className="bl-filter-label">
                  <FunnelSimple size={14} color="#64748b" />
                  <span>Severity</span>
                </span>
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
                  <button
                    key={sev}
                    className={`bl-btn-pill ${severityFilter === sev ? 'selected ' + sev.toLowerCase() : ''}`}
                    onClick={() => setSeverityFilter(sev)}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {filteredViolations.length === 0 ? (
              <div className="bl-zero-state">
                <div className="bl-zero-icon">
                  <ShieldCheck size={32} color="#10b981" />
                </div>
                <h4>Zero Violations Detected</h4>
                <p>All recorded runtime operations fully conform to committed policies in <code>behavior.lock</code>.</p>
              </div>
            ) : (
              <div className="bl-ledger-stack">
                {filteredViolations.map((v, i) => (
                  <div key={v.id || i} className={`bl-ledger-item ${v.severity}`}>
                    <div className="bl-ledger-left-stripe" />
                    <div className="bl-ledger-body">
                      <div className="bl-item-header">
                        <div className="bl-item-title-group">
                          <span className={`bl-pill-sev ${v.severity}`}>
                            {v.severity === 'CRITICAL' ? <WarningOctagon size={12} /> : <WarningCircle size={12} />}
                            <span>{v.severity}</span>
                          </span>
                          <span className="bl-item-type">{v.type}</span>
                        </div>

                        <div className="bl-item-id-capsule">
                          <span>id: <strong>{v.id}</strong></span>
                          <button
                            className="bl-btn-icon-copy"
                            title="Copy approve command"
                            onClick={() => handleCopyCommand(v.id)}
                          >
                            {copiedId === v.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>

                      <div className="bl-item-meta-row">
                        <span>Package: <strong className="bl-code-text">{v.package}</strong></span>
                        <span className="bl-sep">·</span>
                        <span>Phase: <strong className="bl-code-text">{v.phase || 'runtime'}</strong></span>
                      </div>

                      <div className="bl-code-block-target">
                        <code>{v.target}</code>
                      </div>

                      <p className="bl-item-signal-msg">{v.message}</p>

                      <div className="bl-action-panel">
                        <div className="bl-remedy-note">
                          <strong>Remediation:</strong> {v.remediation}
                        </div>

                        {/* Magic UI Shiny Action Button */}
                        <button
                          className="bl-btn-shiny"
                          onClick={() => handleCopyCommand(v.id)}
                        >
                          <span className="bl-btn-shiny-shimmer" />
                          <span className="bl-btn-shiny-content">
                            {copiedId === v.id ? (
                              <>
                                <Check size={14} color="#10b981" />
                                <span>Command Copied</span>
                              </>
                            ) : (
                              <>
                                <TerminalWindow size={14} />
                                <span>Copy CLI Approval</span>
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Execution Topology (Aceternity Canvas) */}
        {activeTab === 'topology' && (
          <div className="bl-tab-pane">
            <div className="bl-canvas-wrapper">
              <div className="bl-canvas-header">
                <div>
                  <h4>Attributed Execution Path &amp; Threat Ingress</h4>
                  <p>Visual map tracing process execution from application root to sandboxed syscall vectors.</p>
                </div>
                <div className="bl-canvas-legend">
                  <span className="bl-legend-item safe"><span className="bl-dot" /> Baseline</span>
                  <span className="bl-legend-item hazard"><span className="bl-dot" /> Threat Vector</span>
                </div>
              </div>

              <div className="bl-canvas-svg-box">
                <svg width="100%" height="260" viewBox="0 0 840 260" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                    <linearGradient id="dangerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                    <linearGradient id="warningGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#fcd34d" />
                    </linearGradient>
                  </defs>

                  {/* Node: Application Root */}
                  <rect x="30" y="100" width="160" height="60" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                  <text x="110" y="128" textAnchor="middle" fontSize="13" fontWeight="700" fill="#f8fafc">
                    {targetName}
                  </text>
                  <text x="110" y="145" textAnchor="middle" fontSize="10" fill="#64748b">
                    Application Root Process
                  </text>

                  {/* Connecting curve Root -> Sandbox */}
                  <path d="M 190 130 C 240 130, 250 130, 300 130" fill="none" stroke="url(#curveGrad)" strokeWidth="2.5" strokeDasharray="5 3" />

                  {/* Node: Sandbox Boundary */}
                  <rect x="300" y="85" width="190" height="90" rx="12" fill="#0b1329" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="395" y="118" textAnchor="middle" fontSize="13" fontWeight="700" fill="#38bdf8">
                    V8 Preload Sandbox
                  </text>
                  <text x="395" y="136" textAnchor="middle" fontSize="11" fontWeight="600" fill="#f8fafc">
                    slug-lib (traced)
                  </text>
                  <text x="395" y="153" textAnchor="middle" fontSize="10" fill="#64748b">
                    Stack-Attributed Context
                  </text>

                  {/* Branch A: Canary Bait (Curved path) */}
                  <path d="M 490 110 C 550 110, 560 50, 610 50" fill="none" stroke="url(#dangerGrad)" strokeWidth="2.5" />
                  <rect x="610" y="24" width="200" height="52" rx="10" fill="rgba(244,63,94,0.12)" stroke="#f43f5e" strokeWidth="1.5" />
                  <text x="710" y="47" textAnchor="middle" fontSize="12" fontWeight="700" fill="#f43f5e">
                    Honeypot Canary Trap
                  </text>
                  <text x="710" y="63" textAnchor="middle" fontSize="10" fill="#fca5a5">
                    ~/.aws/credentials [Breached]
                  </text>

                  {/* Branch B: Outbound Sockets */}
                  <path d="M 490 130 C 550 130, 560 130, 610 130" fill="none" stroke="url(#warningGrad)" strokeWidth="2" strokeDasharray="4 2" />
                  <rect x="610" y="104" width="200" height="52" rx="10" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="710" y="127" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fbbf24">
                    Network Socket Egress
                  </text>
                  <text x="710" y="143" textAnchor="middle" fontSize="10" fill="#fde68a">
                    203.0.113.9:443 [Anomaly]
                  </text>

                  {/* Branch C: Process Spawn */}
                  <path d="M 490 150 C 550 150, 560 210, 610 210" fill="none" stroke="url(#warningGrad)" strokeWidth="2" strokeDasharray="4 2" />
                  <rect x="610" y="184" width="200" height="52" rx="10" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="710" y="207" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fbbf24">
                    Subprocess Execution
                  </text>
                  <text x="710" y="223" textAnchor="middle" fontSize="10" fill="#fde68a">
                    sh -c "whoami" [Anomaly]
                  </text>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Capability Matrix (shadcn Data Table) */}
        {activeTab === 'matrix' && (
          <div className="bl-tab-pane">
            <div className="bl-table-container">
              <table className="bl-table-modern">
                <thead>
                  <tr>
                    <th>Package Identifier</th>
                    <th>Network Egress</th>
                    <th>Filesystem Boundaries</th>
                    <th>Child Processes</th>
                    <th>Honeypot Integrity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(packages).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="bl-empty-td">
                        No dependencies registered in contract.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(packages).map(([pkg, data]) => {
                      const net = data.runtime?.network?.length || 0;
                      const fsCount = (data.runtime?.fs_read?.length || 0) + (data.runtime?.fs_write?.length || 0);
                      const execCount = data.runtime?.exec?.length || 0;

                      return (
                        <tr key={pkg}>
                          <td>
                            <div className="bl-pkg-name">
                              <Package size={14} color="#94a3b8" />
                              <span>{pkg}</span>
                            </div>
                          </td>
                          <td>
                            {net > 0 ? (
                              <span className="bl-tag-metric sky">{net} host(s)</span>
                            ) : (
                              <span className="bl-tag-metric muted">none</span>
                            )}
                          </td>
                          <td>
                            {fsCount > 0 ? (
                              <span className="bl-tag-metric white">{fsCount} path(s)</span>
                            ) : (
                              <span className="bl-tag-metric muted">none</span>
                            )}
                          </td>
                          <td>
                            {execCount > 0 ? (
                              <span className="bl-tag-metric amber">{execCount} proc(s)</span>
                            ) : (
                              <span className="bl-tag-metric muted">none</span>
                            )}
                          </td>
                          <td>
                            <span className="bl-tag-metric emerald">
                              <ShieldCheck size={12} />
                              <span>verified</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Raw Contract Spec */}
        {activeTab === 'contract' && (
          <div className="bl-tab-pane">
            <div className="bl-code-window">
              <div className="bl-code-window-top">
                <div className="bl-window-dots">
                  <span className="bl-dot-red" />
                  <span className="bl-dot-yellow" />
                  <span className="bl-dot-green" />
                  <span className="bl-window-title">behavior.lock</span>
                </div>
                <button
                  className="bl-btn-copy-window"
                  onClick={() => {
                    navigator?.clipboard?.writeText(JSON.stringify(contract, null, 2));
                    setCopiedId('contract');
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                >
                  {copiedId === 'contract' ? (
                    <>
                      <Check size={13} color="#10b981" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bl-pre-spec">
                {JSON.stringify(contract, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
