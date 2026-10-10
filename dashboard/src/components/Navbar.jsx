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

export function Navbar({ data, onRecheck, isRechecking, onOpenSearch, onSelectScenario, activeScenario, isSwitchingScenario }) {
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
              <span className="font-semibold text-xs tracking-tight text-zinc-100">behavior.lock</span>
              <Badge variant="zinc" className="text-[10px] px-1.5 py-0">v1.0</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <GitBranch size={11} className="text-zinc-500" />
              <span>{targetName}</span>
            </div>
          </div>
        </div>

        {/* Interactive Scenario Switcher */}
        {onSelectScenario && (
          <div className="hidden lg:flex items-center bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => onSelectScenario('safe')}
              disabled={isSwitchingScenario}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                activeScenario === 'safe'
                  ? 'bg-zinc-800 text-emerald-400 font-medium shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck size={13} weight={activeScenario === 'safe' ? 'fill' : 'regular'} />
              <span>Safe Baseline</span>
            </button>
            <button
              onClick={() => onSelectScenario('attack')}
              disabled={isSwitchingScenario}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                activeScenario === 'attack'
                  ? 'bg-rose-950/70 text-rose-400 font-medium shadow-sm border border-rose-900/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <WarningOctagon size={13} weight={activeScenario === 'attack' ? 'fill' : 'regular'} />
              <span>Zero-Day Attack</span>
            </button>
            <button
              onClick={() => onSelectScenario('telemetry')}
              disabled={isSwitchingScenario}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                activeScenario === 'telemetry'
                  ? 'bg-amber-950/70 text-amber-400 font-medium shadow-sm border border-amber-900/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowsClockwise size={13} weight={activeScenario === 'telemetry' ? 'fill' : 'regular'} />
              <span>Telemetry Drift</span>
            </button>
          </div>
        )}

        {/* Global Search & Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSearch}
            className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-zinc-100 border-zinc-800 bg-zinc-900/50"
          >
            <MagnifyingGlass size={13} className="text-zinc-500" />
            <span>Search breaches...</span>
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
              disabled={isRechecking || isSwitchingScenario}
              className="flex items-center gap-1.5 text-zinc-200"
              title="Re-run sandbox capability check"
            >
              <ArrowsClockwise size={13} className={(isRechecking || isSwitchingScenario) ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Verify Sandbox</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
