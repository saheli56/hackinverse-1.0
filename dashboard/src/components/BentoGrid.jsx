import React from "react";
import { 
  Crosshair, 
  Globe, 
  TerminalWindow, 
  FolderLock, 
  Key, 
  CheckCircle 
} from "@phosphor-icons/react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
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
      <Card className="flex flex-col justify-between border-zinc-800 bg-zinc-900/40 backdrop-blur-md">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Crosshair size={14} className="text-rose-400" />
              <span>Decoy Honeypots</span>
            </span>
            <Badge variant={canaryBreached ? "critical" : "success"}>
              {canaryBreached ? "TRIPWIRE BREACHED" : "ARMED & SILENT"}
            </Badge>
          </div>
          <CardTitle className="text-sm font-semibold text-zinc-100 mt-2">
            {canaryBreached ? "Decoy Token Access Attempt" : "Zero Honeypot Contacts"}
          </CardTitle>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
            {canaryBreached 
              ? "Supply chain attacker attempted to read decoy credentials. Honeypot caught unauthorized read."
              : "Decoy credentials planted in canary zone. Any unauthorized filesystem read triggers an instant breach alert."}
          </p>
        </CardHeader>
        <CardFooter className="p-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Target:</span>
          <span className="text-zinc-300 truncate max-w-[170px] font-mono text-[11px]">[CANARY_ZONE]/.aws</span>
        </CardFooter>
      </Card>

      {/* 2. Sandbox Capability Boundary */}
      <Card className="flex flex-col justify-between border-zinc-800 bg-zinc-900/40 backdrop-blur-md">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Globe size={14} className="text-zinc-300" />
              <span>Capability Matrix</span>
            </span>
            <Badge variant="zinc">
              {packageCount} Packages
            </Badge>
          </div>
          <div className="space-y-2 mt-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Globe size={13} className="text-zinc-500" /> Network Sockets
              </span>
              <span className="text-zinc-200 text-xs font-medium">Strict Baseline</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <TerminalWindow size={13} className="text-zinc-500" /> Child Processes
              </span>
              <span className="text-zinc-200 text-xs font-medium">Blocked by Default</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <FolderLock size={13} className="text-zinc-500" /> Filesystem Scope
              </span>
              <span className="text-zinc-200 text-xs font-medium">Project Boundaries</span>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="p-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Interceptor:</span>
          <span className="text-zinc-200 font-medium">V8 Hook v1.0</span>
        </CardFooter>
      </Card>

      {/* 3. Cryptographic Policy Overrides */}
      <Card className="flex flex-col justify-between border-zinc-800 bg-zinc-900/40 backdrop-blur-md">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Key size={14} className="text-amber-400" />
              <span>Signed Overrides</span>
            </span>
            <Badge variant={approvals.length > 0 ? "high" : "zinc"}>
              {approvals.length} Approved
            </Badge>
          </div>
          <CardTitle className="text-sm font-semibold text-zinc-100 mt-2">
            {approvals.length > 0 ? "Audited Policy Signatures" : "Zero Drift Overrides"}
          </CardTitle>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
            {approvals.length > 0
              ? "Developer authorized behavioral exemptions with mandatory cryptographic audit receipts."
              : "No unverified overrides. All packages must conform to the committed behavior.lock contract."}
          </p>
        </CardHeader>
        <CardFooter className="p-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Integrity:</span>
          <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-medium">
            <CheckCircle size={12} weight="fill" /> SHA-256 Pinned
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
