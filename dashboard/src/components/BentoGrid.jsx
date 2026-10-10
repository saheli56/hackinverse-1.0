import React from "react";
import { 
  Crosshair, 
  Globe, 
  TerminalWindow, 
  FolderLock, 
  Key, 
  CheckCircle
} from "@phosphor-icons/react";
import { Card, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";

export function BentoGrid({ data }) {
  const { diffResult = {}, contract = {} } = data;
  const violations = diffResult.violations || [];
  const approvals = diffResult.approvedMatches || contract.approvals || [];
  const packages = contract.packages || diffResult.observed?.packages || {};
  const packageCount = Object.keys(packages).length;

  const canaryBreached = violations.some(v => 
    v.type?.includes("CANARY") || v.target?.includes("CANARY") || v.target?.includes(".aws")
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* 1. Canary Honeypot Card */}
      <Card className="flex flex-col justify-between border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 h-full shadow-sm dark:shadow-md">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-sans">
              <Crosshair size={14} className={canaryBreached ? "text-rose-500 dark:text-rose-400 animate-pulse" : "text-emerald-500 dark:text-emerald-400"} />
              <span>Decoy Honeypots</span>
            </span>
            <Badge variant={canaryBreached ? "critical" : "success"}>
              {canaryBreached ? "TRIPWIRE BREACHED" : "ARMED & SILENT"}
            </Badge>
          </div>
          <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2.5 font-sans">
            {canaryBreached ? "Decoy Token Access Intercepted" : "Zero Honeypot Contacts"}
          </CardTitle>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1.5 font-sans">
            {canaryBreached 
              ? "Untrusted package attempted to read decoy secrets. Honeypot tripwire intercepted read with 100% certainty."
              : "Active deception baits planted in canary sandbox. Any unauthorized filesystem read triggers an immediate breach alert."}
          </p>
        </CardHeader>
        <CardFooter className="p-5 pt-3 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-sans">
          <span>Canary Trap:</span>
          <span className="text-zinc-800 dark:text-zinc-300 truncate max-w-[170px] font-mono text-[11px] bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
            ~/.aws/credentials
          </span>
        </CardFooter>
      </Card>

      {/* 2. Sandbox Capability Boundary */}
      <Card className="flex flex-col justify-between border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 h-full shadow-sm dark:shadow-md">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-sans">
              <Globe size={14} className="text-cyan-600 dark:text-cyan-400" />
              <span>Capability Matrix</span>
            </span>
            <Badge variant="zinc">
              {packageCount} Packages Traced
            </Badge>
          </div>
          <div className="space-y-2.5 mt-3 text-xs font-sans">
            <div className="flex items-center justify-between py-1 border-b border-zinc-150 dark:border-zinc-850">
              <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Globe size={13} className="text-zinc-400 dark:text-zinc-500" /> Network Sockets
              </span>
              <span className="text-zinc-900 dark:text-zinc-200 text-xs font-medium">Strict Baseline</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-zinc-150 dark:border-zinc-850">
              <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <TerminalWindow size={13} className="text-zinc-400 dark:text-zinc-500" /> Child Processes
              </span>
              <span className="text-zinc-900 dark:text-zinc-200 text-xs font-medium">Blocked by Default</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <FolderLock size={13} className="text-zinc-400 dark:text-zinc-500" /> Filesystem Scope
              </span>
              <span className="text-zinc-900 dark:text-zinc-200 text-xs font-medium">Project Boundaries</span>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="p-5 pt-3 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-sans">
          <span>Interceptor:</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-medium text-xs">V8 Hook Kernel v1.0</span>
        </CardFooter>
      </Card>

      {/* 3. Cryptographic Policy Overrides */}
      <Card className="flex flex-col justify-between border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 h-full shadow-sm dark:shadow-md">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-sans">
              <Key size={14} className="text-amber-500 dark:text-amber-400" />
              <span>Signed Approvals</span>
            </span>
            <Badge variant={approvals.length > 0 ? "high" : "zinc"}>
              {approvals.length} Approved
            </Badge>
          </div>
          <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2.5 font-sans">
            {approvals.length > 0 ? "Audited Policy Signatures" : "Zero Drift Overrides"}
          </CardTitle>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1.5 font-sans">
            {approvals.length > 0
              ? "Developer authorized behavioral exemptions with mandatory cryptographic audit justification."
              : "No unreviewed overrides. All packages must conform to the committed behavior.lock contract."}
          </p>
        </CardHeader>
        <CardFooter className="p-5 pt-3 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-sans">
          <span>Integrity:</span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px] font-medium font-sans">
            <CheckCircle size={12} weight="fill" /> SHA-256 Pinned
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
