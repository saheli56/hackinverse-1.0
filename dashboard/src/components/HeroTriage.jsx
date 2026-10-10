import React, { useState } from "react";
import { 
  ShieldCheck, 
  ShieldWarning, 
  Pulse, 
  Cpu, 
  Terminal, 
  Copy, 
  Check 
} from "@phosphor-icons/react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { BorderBeam } from "./effects/BorderBeam";

export function HeroTriage({ data, onApproveClick }) {
  const { diffResult = {}, contract = {}, targetName = "app" } = data;
  const summary = diffResult.summary || { critical: 0, high: 0, medium: 0, total: 0 };
  const passed = diffResult.passed ?? (diffResult.violations?.length === 0);
  const violations = diffResult.violations || [];
  const sandbox = contract.sandbox || {};

  const [copied, setCopied] = useState(false);

  const handleCopyFirstApproval = () => {
    if (violations.length === 0) return;
    const cmd = `behaviorlock approve ${violations[0].id} --reason "Reviewed & verified"`;
    navigator.clipboard?.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900/50 backdrop-blur-xl mb-6 shadow-md">
      {/* Magic UI Subtle Border Beam */}
      <BorderBeam size={240} duration={12} delay={0} colorFrom="#71717a" colorTo="#27272a" />

      <CardContent className="p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            {/* Status Chip */}
            <div className="flex items-center gap-2 mb-2.5">
              <Badge variant={passed ? "success" : "critical"} className="gap-1.5 py-0.5">
                {passed ? (
                  <ShieldCheck size={13} weight="fill" />
                ) : (
                  <ShieldWarning size={13} weight="fill" />
                )}
                <span>{passed ? "Contract Satisfied" : "Contract Breach Detected"}</span>
              </Badge>
              <span className="text-xs text-zinc-500 font-mono">• Target: {targetName}</span>
            </div>

            {/* High-impact Typography */}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mb-2">
              {passed ? (
                "Runtime Behavior Verified & Sandboxed"
              ) : (
                <span>
                  {summary.total} Unauthorized Behavior{summary.total > 1 ? "s" : ""} Intercepted
                </span>
              )}
            </h1>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              {passed ? (
                "All observed runtime system calls, network sockets, and filesystem activities conform strictly to policy in behavior.lock."
              ) : (
                "The sandbox intercepted runtime system anomalies not declared in the baseline contract. Pull request blocked from production merge."
              )}
            </p>

            {/* Engine Metadata Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-950 border border-zinc-850 font-mono text-[11px]">
                <Cpu size={12} className="text-zinc-500" />
                <span>Engine: {sandbox.engine || "runtime-hook (V8)"}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-950 border border-zinc-850 font-mono text-[11px]">
                <Terminal size={12} className="text-zinc-500" />
                <span>Node: {sandbox.node || process.version || "v22"}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-950 border border-zinc-850 font-mono text-[11px]">
                <Pulse size={12} className="text-zinc-400" />
                <span>Isolation: Active</span>
              </div>
            </div>
          </div>

          {/* Metric Stats Boxes */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              <div className="px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex flex-col items-center justify-center min-w-[76px]">
                <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider font-mono">Critical</span>
                <span className="text-xl font-bold text-rose-400 font-mono mt-0.5">{summary.critical}</span>
              </div>
              <div className="px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex flex-col items-center justify-center min-w-[76px]">
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider font-mono">High</span>
                <span className="text-xl font-bold text-amber-400 font-mono mt-0.5">{summary.high}</span>
              </div>
              <div className="px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex flex-col items-center justify-center min-w-[76px]">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">Medium</span>
                <span className="text-xl font-bold text-zinc-300 font-mono mt-0.5">{summary.medium}</span>
              </div>
            </div>

            {!passed && violations.length > 0 && (
              <Button
                variant="shimmer"
                size="sm"
                onClick={handleCopyFirstApproval}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? "Copied Command" : `Copy Approve #${violations[0].id}`}</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
