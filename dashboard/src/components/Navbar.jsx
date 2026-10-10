import React from "react";
import { 
  LockKey, 
  ArrowsClockwise, 
  MagnifyingGlass, 
  GitBranch,
  ShieldCheck,
  WarningOctagon
} from "@phosphor-icons/react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function Navbar({ data, onRecheck, isRechecking, onOpenSearch }) {
  const { diffResult = {}, targetName = "app" } = data;
  const passed = diffResult.passed ?? (diffResult.violations?.length === 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm">
            <LockKey size={18} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs tracking-tight text-zinc-100 font-mono">behavior.lock</span>
              <Badge variant="zinc" className="text-[10px] px-1.5 py-0">v1.0</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
              <GitBranch size={11} className="text-zinc-500" />
              <span>{targetName}</span>
            </div>
          </div>
        </div>

        {/* Global Search & Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSearch}
            className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-zinc-100 border-zinc-800 bg-zinc-900/50"
          >
            <MagnifyingGlass size={13} className="text-zinc-500" />
            <span>Search breaches, syscalls...</span>
            <kbd className="ml-2 font-mono text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-700">
              Ctrl K
            </kbd>
          </Button>

          {/* Real-time Status Badge */}
          <Badge 
            variant={passed ? "success" : "critical"}
            className="hidden sm:inline-flex items-center gap-1.5 py-1 px-2.5"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                passed ? "bg-emerald-400" : "bg-rose-400"
              }`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                passed ? "bg-emerald-500" : "bg-rose-500"
              }`} />
            </span>
            <span>{passed ? "Contract Verified" : "Breach Detected"}</span>
          </Badge>

          {/* Re-verify Sandbox Button */}
          {onRecheck && (
            <Button
              variant="zinc"
              size="sm"
              onClick={onRecheck}
              disabled={isRechecking}
              className="flex items-center gap-1.5 text-zinc-200"
              title="Re-run sandbox capability check"
            >
              <ArrowsClockwise size={13} className={isRechecking ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Verify Sandbox</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
