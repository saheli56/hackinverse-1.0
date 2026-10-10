import React from "react";
import { GitFork } from "@phosphor-icons/react";
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

  const networkTarget = violations.find(v => v.type?.includes("NETWORK"))?.target || "203.0.113.9:443";
  const canaryTarget = violations.find(v => v.type?.includes("CANARY"))?.target || "~/.aws/credentials";
  const execTarget = violations.find(v => v.type?.includes("PROCESS"))?.target || "sh -c 'whoami'";

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-lg overflow-hidden">
      <CardHeader className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <GitFork size={16} className="text-cyan-600 dark:text-cyan-400" />
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                Runtime Capability Topology
              </CardTitle>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-sans">
              Real-time telemetry stream connecting sandbox hooks to outbound system sinks.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans">
            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span>Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Breach Tripped</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* SVG Interactive Canvas */}
        <div className="relative overflow-x-auto bg-zinc-50 dark:bg-[#070709] rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center min-h-[360px]">
          <svg viewBox="0 0 920 340" className="w-full max-w-[920px] h-auto select-none">
            {/* Bezier: Sandbox -> Package */}
            <path
              d="M 190 170 C 270 170, 270 170, 350 170"
              fill="none"
              stroke="#71717a"
              strokeWidth="2"
              strokeDasharray="6 4"
            >
              <animate attributeName="stroke-dashoffset" values="20;0" dur="1.5s" repeatCount="indefinite" />
            </path>

            {/* Bezier: Package -> Network */}
            <path
              d="M 540 170 C 630 170, 630 70, 720 70"
              fill="none"
              stroke={hasNetworkBreach ? "#f43f5e" : "#a1a1aa"}
              strokeWidth={hasNetworkBreach ? "2.5" : "1.5"}
              strokeDasharray={hasNetworkBreach ? "8 4" : "none"}
            >
              {hasNetworkBreach && (
                <animate attributeName="stroke-dashoffset" values="30;0" dur="0.8s" repeatCount="indefinite" />
              )}
            </path>

            {/* Bezier: Package -> Canary/FS */}
            <path
              d="M 540 170 C 630 170, 630 170, 720 170"
              fill="none"
              stroke={hasCanaryBreach ? "#f43f5e" : "#10b981"}
              strokeWidth={hasCanaryBreach ? "2.5" : "2"}
              strokeDasharray={hasCanaryBreach ? "8 4" : "4 4"}
            >
              <animate attributeName="stroke-dashoffset" values="24;0" dur={hasCanaryBreach ? "0.6s" : "2s"} repeatCount="indefinite" />
            </path>

            {/* Bezier: Package -> Process Exec */}
            <path
              d="M 540 170 C 630 170, 630 270, 720 270"
              fill="none"
              stroke={hasExecBreach ? "#f43f5e" : "#a1a1aa"}
              strokeWidth={hasExecBreach ? "2.5" : "1.5"}
              strokeDasharray={hasExecBreach ? "8 4" : "none"}
            >
              {hasExecBreach && (
                <animate attributeName="stroke-dashoffset" values="30;0" dur="0.8s" repeatCount="indefinite" />
              )}
            </path>

            {/* Node 1: Kernel Sandbox */}
            <g transform="translate(40, 125)">
              <rect width="150" height="90" rx="8" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
              <rect x="0" y="0" width="150" height="3" rx="1.5" fill="#38bdf8" />
              <text x="75" y="42" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                Node.js Sandbox
              </text>
              <text x="75" y="62" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">
                V8 Preload Kernel
              </text>
            </g>

            {/* Node 2: Traced Package */}
            <g transform="translate(350, 125)">
              <rect 
                width="190" 
                height="90" 
                rx="8" 
                fill="#18181b" 
                stroke={violations.length > 0 ? "#f43f5e" : "#10b981"} 
                strokeWidth="1.5"
              />
              <rect 
                x="0" 
                y="0" 
                width="190" 
                height="3" 
                rx="1.5" 
                fill={violations.length > 0 ? "#f43f5e" : "#10b981"} 
              />
              <text x="95" y="40" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                {packageList[0] || "slug-lib"}
              </text>
              <text 
                x="95" 
                y="62" 
                textAnchor="middle" 
                fill={violations.length > 0 ? "#f43f5e" : "#34d399"} 
                fontSize="11" 
                fontWeight="500"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {violations.length > 0 ? `✖ ${violations.length} Anomalies Flagged` : "✔ Contract Permitted"}
              </text>
            </g>

            {/* Node 3A: Outbound Sockets */}
            <g transform="translate(720, 25)">
              <rect 
                width="170" 
                height="80" 
                rx="8" 
                fill="#18181b" 
                stroke={hasNetworkBreach ? "#f43f5e" : "#3f3f46"} 
                strokeWidth={hasNetworkBreach ? "2" : "1.5"}
              />
              <text x="85" y="34" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                Outbound Sockets
              </text>
              <text 
                x="85" 
                y="54" 
                textAnchor="middle" 
                fill={hasNetworkBreach ? "#f43f5e" : "#a1a1aa"} 
                fontSize="10" 
                fontWeight={hasNetworkBreach ? "600" : "400"}
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {hasNetworkBreach ? networkTarget : "Zero Sockets"}
              </text>
            </g>

            {/* Node 3B: Decoy Canaries */}
            <g transform="translate(720, 130)">
              <rect 
                width="170" 
                height="80" 
                rx="8" 
                fill="#18181b" 
                stroke={hasCanaryBreach ? "#f43f5e" : "#10b981"} 
                strokeWidth={hasCanaryBreach ? "2" : "1.5"}
              />
              <text x="85" y="34" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                Decoy Honeypots
              </text>
              <text 
                x="85" 
                y="54" 
                textAnchor="middle" 
                fill={hasCanaryBreach ? "#f43f5e" : "#34d399"} 
                fontSize="10" 
                fontWeight={hasCanaryBreach ? "600" : "400"}
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {hasCanaryBreach ? "BREACH: " + canaryTarget : "Bait Secret Untouched"}
              </text>
            </g>

            {/* Node 3C: Process Exec */}
            <g transform="translate(720, 235)">
              <rect 
                width="170" 
                height="80" 
                rx="8" 
                fill="#18181b" 
                stroke={hasExecBreach ? "#f43f5e" : "#3f3f46"} 
                strokeWidth={hasExecBreach ? "2" : "1.5"}
              />
              <text x="85" y="34" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                Child Processes
              </text>
              <text 
                x="85" 
                y="54" 
                textAnchor="middle" 
                fill={hasExecBreach ? "#f43f5e" : "#a1a1aa"} 
                fontSize="10" 
                fontWeight={hasExecBreach ? "600" : "400"}
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {hasExecBreach ? execTarget : "No Spawn Activity"}
              </text>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
