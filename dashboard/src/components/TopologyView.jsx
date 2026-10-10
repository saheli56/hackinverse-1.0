import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

export function TopologyView({ data }) {
  const { diffResult = {}, contract = {}, targetName = "app" } = data;
  const violations = diffResult.violations || [];
  const packages = contract.packages || diffResult.observed?.packages || {};
  const packageList = Object.keys(packages).filter(p => p !== "[project]").slice(0, 5);
  if (packageList.length === 0 && violations.length > 0) {
    violations.forEach(v => {
      if (v.package && !packageList.includes(v.package)) packageList.push(v.package);
    });
  }

  const hasNetworkBreach = violations.some(v => v.type?.includes("NETWORK") || v.target?.includes(":"));
  const hasCanaryBreach = violations.some(v => v.type?.includes("CANARY") || v.target?.includes(".aws"));
  const hasExecBreach = violations.some(v => v.type?.includes("PROCESS") || v.type?.includes("EXEC"));

  return (
    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardHeader className="p-6 border-b border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-100">
              Process & Capability Topology
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time graph connecting sandbox runtime interceptors to outbound system sinks.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <span>Permitted</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span>Intercepted Breach</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* SVG Interactive Canvas */}
        <div className="relative overflow-x-auto bg-zinc-950 rounded-lg p-6 border border-zinc-850 flex items-center justify-center min-h-[350px]">
          <svg viewBox="0 0 880 340" className="w-full max-w-[880px] h-auto select-none">
            <defs>
              <linearGradient id="zinc-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#71717a" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#71717a" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="rose-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Bezier: Sandbox -> Package */}
            <path
              d="M 170 170 C 260 170, 260 170, 350 170"
              fill="none"
              stroke="#71717a"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Bezier: Package -> Network */}
            <path
              d="M 530 170 C 620 170, 620 70, 710 70"
              fill="none"
              stroke={hasNetworkBreach ? "url(#rose-flow)" : "url(#zinc-flow)"}
              strokeWidth={hasNetworkBreach ? "3" : "2"}
            />
            {/* Bezier: Package -> Canary/FS */}
            <path
              d="M 530 170 C 620 170, 620 170, 710 170"
              fill="none"
              stroke={hasCanaryBreach ? "url(#rose-flow)" : "url(#zinc-flow)"}
              strokeWidth={hasCanaryBreach ? "3" : "2"}
            />
            {/* Bezier: Package -> Process Exec */}
            <path
              d="M 530 170 C 620 170, 620 270, 710 270"
              fill="none"
              stroke={hasExecBreach ? "url(#rose-flow)" : "url(#zinc-flow)"}
              strokeWidth={hasExecBreach ? "3" : "2"}
            />

            {/* Node 1: Kernel Sandbox */}
            <g transform="translate(50, 130)">
              <rect width="130" height="80" rx="8" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
              <text x="65" y="38" textAnchor="middle" fill="#fafafa" fontSize="12" fontWeight="600" fontFamily="sans-serif">
                Node Sandbox
              </text>
              <text x="65" y="56" textAnchor="middle" fill="#a1a1aa" fontSize="10" fontFamily="monospace">
                V8 Preload Hook
              </text>
            </g>

            {/* Node 2: Traced Package */}
            <g transform="translate(350, 130)">
              <rect 
                width="180" 
                height="80" 
                rx="8" 
                fill="#18181b" 
                stroke={violations.length > 0 ? "#f43f5e" : "#27272a"} 
                strokeWidth={violations.length > 0 ? "2" : "1.5"} 
              />
              <text x="90" y="36" textAnchor="middle" fill="#fafafa" fontSize="13" fontWeight="600" fontFamily="sans-serif">
                {packageList[0] || "slug-lib"}
              </text>
              <text x="90" y="55" textAnchor="middle" fill={violations.length > 0 ? "#f43f5e" : "#d4d4d8"} fontSize="11" fontFamily="monospace">
                {violations.length > 0 ? `${violations.length} Anomaly Intercepted` : "Baseline Compliant"}
              </text>
            </g>

            {/* Node 3A: Network Sink */}
            <g transform="translate(710, 35)">
              <rect 
                width="150" 
                height="70" 
                rx="8" 
                fill="#18181b" 
                stroke={hasNetworkBreach ? "#f43f5e" : "#27272a"} 
                strokeWidth="1.5" 
              />
              <text x="75" y="32" textAnchor="middle" fill="#fafafa" fontSize="12" fontWeight="600" fontFamily="sans-serif">
                Outbound Sockets
              </text>
              <text x="75" y="50" textAnchor="middle" fill={hasNetworkBreach ? "#f43f5e" : "#a1a1aa"} fontSize="10" fontFamily="monospace">
                {hasNetworkBreach ? "stats.slug-analytics:443" : "Zero Sockets"}
              </text>
            </g>

            {/* Node 3B: Decoy Honeypot */}
            <g transform="translate(710, 135)">
              <rect 
                width="150" 
                height="70" 
                rx="8" 
                fill="#18181b" 
                stroke={hasCanaryBreach ? "#f43f5e" : "#27272a"} 
                strokeWidth="1.5" 
              />
              <text x="75" y="32" textAnchor="middle" fill="#fafafa" fontSize="12" fontWeight="600" fontFamily="sans-serif">
                Decoy Canaries
              </text>
              <text x="75" y="50" textAnchor="middle" fill={hasCanaryBreach ? "#f43f5e" : "#10b981"} fontSize="10" fontFamily="monospace">
                {hasCanaryBreach ? ".aws/credentials READ" : "Canary Bait Intact"}
              </text>
            </g>

            {/* Node 3C: Process Exec */}
            <g transform="translate(710, 235)">
              <rect 
                width="150" 
                height="70" 
                rx="8" 
                fill="#18181b" 
                stroke={hasExecBreach ? "#f43f5e" : "#27272a"} 
                strokeWidth="1.5" 
              />
              <text x="75" y="32" textAnchor="middle" fill="#fafafa" fontSize="12" fontWeight="600" fontFamily="sans-serif">
                Child Processes
              </text>
              <text x="75" y="50" textAnchor="middle" fill={hasExecBreach ? "#f43f5e" : "#a1a1aa"} fontSize="10" fontFamily="monospace">
                {hasExecBreach ? "Unauthorized Spawn" : "No Subprocesses"}
              </text>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
