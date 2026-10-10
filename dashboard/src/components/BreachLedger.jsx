import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  Copy, 
  Check, 
  MagnifyingGlass,
  Key,
  ArrowRight
} from "@phosphor-icons/react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function BreachLedger({ violations = [], onOpenApproveModal }) {
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const filtered = violations.filter(v => {
    const matchesSev = severityFilter === "ALL" || v.severity === severityFilter;
    const query = search.toLowerCase();
    const matchesSearch = !query || 
      (v.package && v.package.toLowerCase().includes(query)) ||
      (v.type && v.type.toLowerCase().includes(query)) ||
      (v.target && v.target.toLowerCase().includes(query)) ||
      (v.message && v.message.toLowerCase().includes(query)) ||
      (v.id && v.id.toLowerCase().includes(query));
    return matchesSev && matchesSearch;
  });

  const handleCopyCmd = (id) => {
    const cmd = `behaviorlock approve ${id} --reason "Reviewed & verified"`;
    navigator.clipboard?.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <Card className="p-3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Severity Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-0.5">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map(sev => {
              const isActive = severityFilter === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`relative px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap font-sans ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <span>{sev}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Search */}
          <div className="relative w-full sm:w-72">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <Input
              type="text"
              placeholder="Filter by package, syscall, id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-700"
            />
          </div>
        </div>
      </Card>

      {/* Incidents List */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="p-12 text-center border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
              <div className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={22} weight="duotone" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">Zero Matching Incidents</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed font-sans">
                {violations.length === 0 
                  ? "All runtime system calls conform strictly to the committed behavior contract."
                  : "No incidents match your active filters or search terms."}
              </p>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((v, idx) => {
              const isCrit = v.severity === "CRITICAL";
              const isHigh = v.severity === "HIGH";
              
              const stripeColor = isCrit 
                ? "bg-rose-500" 
                : isHigh 
                  ? "bg-amber-500" 
                  : "bg-zinc-400 dark:bg-zinc-500";

              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                >
                  <Card 
                    className="relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex shadow-sm"
                  >
                    {/* Left solid accent stripe */}
                    <div className={`w-1.5 shrink-0 ${stripeColor}`} />

                    <CardContent className="p-5 flex-1 space-y-3">
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Badge variant={isCrit ? "critical" : isHigh ? "high" : "medium"}>
                            {v.severity}
                          </Badge>
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide font-sans">
                            {v.type}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                            #{v.id}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 font-sans">
                          <span className="text-zinc-900 dark:text-zinc-200 font-semibold">{v.package}</span>
                          <span className="text-zinc-400 dark:text-zinc-500">• phase: <span className="text-zinc-700 dark:text-zinc-400">{v.phase || "runtime"}</span></span>
                        </div>
                      </div>

                      {/* Target and Message Box */}
                      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg p-3 text-xs space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 shrink-0 font-medium font-sans">Syscall Target:</span>
                          <span className="font-mono text-zinc-900 dark:text-zinc-200 text-[11px] select-all break-all bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                            {v.target}
                          </span>
                        </div>
                        {v.message && (
                          <div className="flex items-start gap-2 pt-1.5 border-t border-zinc-200 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300">
                            <span className="text-zinc-500 shrink-0 font-medium font-sans">Anomaly:</span>
                            <span className="font-sans leading-relaxed">{v.message}</span>
                          </div>
                        )}
                      </div>

                      {/* Remediation & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic font-sans flex items-center gap-1.5">
                          <ArrowRight size={12} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                          <span>{v.remediation || "Inspect package origin. Approve if intended or reject pull request."}</span>
                        </p>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="zinc"
                            size="sm"
                            onClick={() => handleCopyCmd(v.id)}
                            className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 font-sans text-xs"
                            title="Copy CLI approval command to clipboard"
                          >
                            {copiedId === v.id ? <Check size={12} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedId === v.id ? "Copied" : "Copy CLI"}</span>
                          </Button>

                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onOpenApproveModal(v)}
                            className="flex items-center gap-1.5 font-sans font-semibold text-xs"
                          >
                            <Key size={13} weight="bold" />
                            <span>Approve & Sign</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
