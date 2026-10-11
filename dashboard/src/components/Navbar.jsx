import React from "react";
import { 
  LockKey, 
  ArrowsClockwise, 
  MagnifyingGlass, 
  GitBranch,
  ShieldCheck, 
  WarningOctagon,
  Sun,
  Moon
} from "@phosphor-icons/react";
import { Button } from "./ui/button";

export function Navbar({ 
  data, 
  onRecheck, 
  isRechecking, 
  onOpenSearch, 
  theme = "dark",
  onToggleTheme,
  currentEnv = "prod",
  onSwitchEnv
}) {
  const { diffResult = {}, targetName = "app" } = data;
  const passed = diffResult.passed ?? (diffResult.violations?.length === 0);
  const violationCount = diffResult.violations?.length || 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px] tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">behavior.lock</span>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-sans ml-2.5 pl-2.5 border-l border-zinc-200 dark:border-zinc-800">
              <GitBranch size={12} className="text-zinc-400 dark:text-zinc-500" />
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{targetName}</span>
            </div>
          </div>
        </div>

        {/* Global Actions: Search, Theme & Verify */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSearch}
            className="hidden sm:flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-sans h-8 px-3 text-xs"
          >
            <MagnifyingGlass size={13} className="text-zinc-400 dark:text-zinc-500" />
            <span>Search incidents...</span>
            <kbd className="ml-1.5 font-mono text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1 py-0.2 rounded text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
              Ctrl K
            </kbd>
          </Button>

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer h-8 w-8 flex items-center justify-center"
            >
              {theme === "dark" ? <Sun size={14} weight="bold" className="text-amber-400" /> : <Moon size={14} weight="bold" className="text-zinc-700" />}
            </button>
          )}

          {/* Premium Segmented Environment Switcher */}
          {onSwitchEnv && (
            <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 h-8 shadow-inner">
              <button
                type="button"
                onClick={() => onSwitchEnv("prod")}
                className={`relative px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-md transition-all duration-150 cursor-pointer ${
                  currentEnv === "prod"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                PROD
              </button>
              <button
                type="button"
                onClick={() => onSwitchEnv("non-prod")}
                className={`relative px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-md transition-all duration-150 cursor-pointer ${
                  currentEnv === "non-prod"
                    ? "bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                NON-PROD
              </button>
            </div>
          )}

          {/* Breach Alert Pill (Only shown when active security violations exist) */}
          {!passed && violationCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-sans h-8">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-semibold text-[11px] text-rose-600 dark:text-rose-400">
                {violationCount} Breach{violationCount > 1 ? "es" : ""}
              </span>
            </div>
          )}

          {/* Re-verify Sandbox Button */}
          {onRecheck && (
            <Button
              variant="zinc"
              size="sm"
              onClick={onRecheck}
              disabled={isRechecking}
              className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white font-sans text-xs h-8 px-3 font-semibold shadow-sm cursor-pointer"
              title="Re-run sandbox capability check"
            >
              <ArrowsClockwise size={13} className={isRechecking ? "animate-spin text-cyan-400 dark:text-cyan-600" : ""} />
              <span>{isRechecking ? "Verifying..." : "Verify Sandbox"}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
