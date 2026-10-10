import React from "react";
import { 
  Cpu, 
  Crosshair, 
  GitFork, 
  ShieldCheck, 
  LockKey, 
  WarningOctagon,
  ArrowsClockwise
} from "@phosphor-icons/react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

export function ArchitectureExplainer() {
  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm dark:shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <LockKey size={18} className="text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
                How behavior.lock Works
              </h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-sans leading-relaxed">
              Deterministic runtime capability locking and zero-day supply chain containment for Node.js.
            </p>
          </div>
          <Badge variant="zinc" className="text-xs px-3 py-1 font-sans">
            V8 Preload Engine · Version 1.0
          </Badge>
        </div>

        {/* The Core Paradigm Shift */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-mono font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Traditional package-lock.json
            </span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed">
              Pins dependency versions and tarball hashes. Ensures identical code is downloaded, but gives that code unrestricted access to system APIs.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-emerald-500/30 space-y-1.5">
            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              behavior.lock Paradigm
            </span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed">
              Pins actual runtime capabilities (network endpoints, filesystem paths, child processes, decoy honeypots). Blocks unapproved drift in CI.
            </p>
          </div>
        </div>
      </Card>

      {/* 4-Stage Runtime Pipeline */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm dark:shadow-lg">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans mb-4 flex items-center gap-2">
          <ArrowsClockwise size={16} className="text-cyan-600 dark:text-cyan-400" />
          <span>4-Stage Dynamic Verification Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Step 1 */}
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800/40">
                  STAGE 01
                </span>
                <Cpu size={16} className="text-zinc-500 dark:text-zinc-400" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-sans">V8 Preload Interception</h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1.5 font-sans leading-relaxed">
                Hooks Node.js built-in modules (fs, net, http, child_process) before packages load. Inspects the call stack to attribute every system call to its originating package.
              </p>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-200 dark:border-zinc-900">
              Stack-Frame Attribution
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/40">
                  STAGE 02
                </span>
                <Crosshair size={16} className="text-zinc-500 dark:text-zinc-400" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-sans">Active Canary Deception</h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1.5 font-sans leading-relaxed">
                Provisions synthetic decoy files (~/.aws/credentials, ~/.ssh, .env.production). Touching these artificial honeypots triggers an immediate, zero-false-positive alert.
              </p>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-200 dark:border-zinc-900">
              0.0% False Positive Rate
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/40">
                  STAGE 03
                </span>
                <GitFork size={16} className="text-zinc-500 dark:text-zinc-400" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-sans">Telemetry Normalization</h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1.5 font-sans leading-relaxed">
                Filters noise, dynamic socket ports, and OS initialization paths into a clean, deterministic Capability Graph.
              </p>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-200 dark:border-zinc-900">
              Deterministic Graph
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/40">
                  STAGE 04
                </span>
                <ShieldCheck size={16} className="text-zinc-500 dark:text-zinc-400" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-sans">Diff & CI Enforcement</h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1.5 font-sans leading-relaxed">
                Compares observed telemetry against behavior.lock. Fails CI with exit code 1 if unauthorized network, process, or honeypot drift is detected.
              </p>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-200 dark:border-zinc-900">
              CI/CD Pipeline Gate
            </div>
          </div>
        </div>
      </Card>

      {/* Attack Defense Matrix */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm dark:shadow-lg">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans mb-4 flex items-center gap-2">
          <WarningOctagon size={16} className="text-rose-600 dark:text-rose-400" />
          <span>Real-World Supply Chain Attack Defense Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px]">
                <th className="pb-3 font-semibold">Attack Vector</th>
                <th className="pb-3 font-semibold">Real Attack Precedent</th>
                <th className="pb-3 font-semibold">Standard Scanners (Snyk / npm audit)</th>
                <th className="pb-3 font-semibold">behavior.lock Defense</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-200">Credential Harvesting</td>
                <td className="py-3 text-zinc-500 dark:text-zinc-400">event-stream, ua-parser-js</td>
                <td className="py-3 text-rose-600 dark:text-rose-400">Missed (Obfuscated Base64)</td>
                <td className="py-3 text-emerald-600 dark:text-emerald-400 font-medium">Intercepted by Active Canary Traps</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-200">C2 Network Exfiltration</td>
                <td className="py-3 text-zinc-500 dark:text-zinc-400">node-ipc, PyTorch dependency confusion</td>
                <td className="py-3 text-rose-600 dark:text-rose-400">Missed (Zero-day endpoint)</td>
                <td className="py-3 text-emerald-600 dark:text-emerald-400 font-medium">Blocked: Unlisted socket address</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-200">Shell Process Spawning</td>
                <td className="py-3 text-zinc-500 dark:text-zinc-400">XZ Utils backdoor, malicious install scripts</td>
                <td className="py-3 text-rose-600 dark:text-rose-400">Missed (Runtime eval spawn)</td>
                <td className="py-3 text-emerald-600 dark:text-emerald-400 font-medium">Blocked: Unauthorized child process</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-200">Telemetry Drift</td>
                <td className="py-3 text-zinc-500 dark:text-zinc-400">Unannounced vendor analytics in minor updates</td>
                <td className="py-3 text-zinc-500">Not monitored</td>
                <td className="py-3 text-amber-600 dark:text-amber-400 font-medium">Flagged for Cryptographic Audit Signature</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
