import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ShieldWarning, 
  Cpu, 
  Terminal, 
  Copy, 
  Check, 
  Fingerprint,
  Broadcast,
  WarningOctagon
} from "@phosphor-icons/react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function HeroTriage({ 
  data, 
  onApproveClick, 
  onSelectScenario, 
  activeScenario = "safe", 
  isSwitchingScenario = false 
}) {
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

  const isCritical = summary.critical > 0;

  const scenarios = [
    { id: "safe", label: "Safe Baseline", icon: ShieldCheck, color: "text-emerald-500 dark:text-emerald-400" },
    { id: "attack", label: "Zero-Day Attack", icon: WarningOctagon, color: "text-rose-500 dark:text-rose-400" },
    { id: "telemetry", label: "Telemetry Drift", icon: Broadcast, color: "text-amber-500 dark:text-amber-400" },
  ];

  return (
    <div className="relative mb-6">
      <Card className="relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm dark:shadow-md">
        {/* Crisp status accent line */}
        <div className={`h-[2px] w-full ${
          passed 
            ? "bg-emerald-500" 
            : isCritical 
              ? "bg-rose-500" 
              : "bg-amber-500"
        }`} />

        <CardContent className="p-6 sm:p-7">
          {/* Top Row: Status Chip & Interactive Scenario Simulator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge variant={passed ? "success" : "critical"} className="gap-1.5 py-1 px-3 shadow-none">
                {passed ? (
                  <ShieldCheck size={14} weight="fill" />
                ) : (
                  <ShieldWarning size={14} weight="fill" />
                )}
                <span>{passed ? "Contract Satisfied · Zero Drift" : "Security Breach Intercepted"}</span>
              </Badge>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1 font-sans">
                <span className="text-zinc-300 dark:text-zinc-700">•</span> Target: <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{targetName}</span>
              </span>
            </div>

            {/* Interactive Scenario Switcher */}
            {onSelectScenario && (
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-1 rounded-lg text-xs self-start sm:self-auto">
                {scenarios.map((sc) => {
                  const Icon = sc.icon;
                  const isActive = activeScenario === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => onSelectScenario(sc.id)}
                      disabled={isSwitchingScenario}
                      className={`relative px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 z-10 font-sans ${
                        isActive 
                          ? "text-zinc-900 dark:text-white font-semibold bg-white dark:bg-zinc-800 shadow-sm" 
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <Icon size={13} weight={isActive ? "fill" : "regular"} className={isActive ? sc.color : "text-zinc-400 dark:text-zinc-500"} />
                      <span>{sc.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              {/* High-impact Typography */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={passed ? "passed" : `breach-${summary.total}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2 font-sans">
                    {passed ? (
                      <span>Runtime Behavior Sealed & Permitted</span>
                    ) : (
                      <span>
                        {summary.total} Unauthorized Behavior{summary.total > 1 ? "s" : ""} Flagged
                      </span>
                    )}
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed font-sans">
                    {passed ? (
                      "All observed network calls, honeypot decoys, and child processes conform strictly to committed policies in behavior.lock."
                    ) : (
                      "The V8 sandbox intercepted runtime capability drift outside approved baseline. CI build is halted to protect downstream consumers."
                    )}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Engine Metadata Tags */}
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-sans">
                  <Cpu size={13} className="text-cyan-600 dark:text-cyan-400" />
                  <span>Engine: {sandbox.engine || "runtime-hook (V8)"}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-sans">
                  <Terminal size={13} className="text-zinc-500 dark:text-zinc-400" />
                  <span>Node: {sandbox.node || "v22"}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400 font-sans">
                  <Fingerprint size={13} />
                  <span>Canary Traps: Active</span>
                </div>
              </div>
            </div>

            {/* Metric Stats Boxes */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                <div className="px-4 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center min-w-[80px]">
                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider font-sans">Critical</span>
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5 font-sans">{summary.critical}</span>
                </div>
                <div className="px-4 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center min-w-[80px]">
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-sans">High</span>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 font-sans">{summary.high}</span>
                </div>
                <div className="px-4 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center min-w-[80px]">
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-sans">Medium</span>
                  <span className="text-2xl font-bold text-zinc-700 dark:text-zinc-300 mt-0.5 font-sans">{summary.medium}</span>
                </div>
              </div>

              {!passed && violations.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyFirstApproval}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-sans text-xs"
                  >
                    {copied ? <Check size={13} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? "Copied Command" : `Copy Approve #${violations[0].id}`}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
