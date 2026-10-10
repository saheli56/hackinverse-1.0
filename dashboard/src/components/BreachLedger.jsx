import React, { useState } from "react";
import { 
  WarningOctagon, 
  ShieldWarning, 
  CheckCircle, 
  Copy, 
  Check, 
  MagnifyingGlass,
  Key
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
      <Card className="p-2.5 border-zinc-800 bg-zinc-900/40">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Severity Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map(sev => {
              const isActive = severityFilter === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                  }`}
                >
                  {sev}
                </button>
              );
            })}
          </div>

          {/* Filter Search */}
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              type="text"
              placeholder="Filter by package, syscall, id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
        </div>
      </Card>

      {/* Incidents List */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-zinc-800 bg-zinc-900/30">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={20} weight="duotone" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">Zero Matching Incidents</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {violations.length === 0 
              ? "All runtime system calls conform strictly to the committed behavior contract."
              : "No incidents match your active filters or search terms."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => {
            const isCrit = v.severity === "CRITICAL";
            const isHigh = v.severity === "HIGH";
            
            const stripeColor = isCrit 
              ? "bg-rose-500" 
              : isHigh 
                ? "bg-amber-500" 
                : "bg-zinc-500";

            return (
              <Card 
                key={v.id}
                className="relative overflow-hidden border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all flex shadow-sm"
              >
                {/* Left accent stripe */}
                <div className={`w-1 shrink-0 ${stripeColor}`} />

                <CardContent className="p-5 flex-1 space-y-3">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={isCrit ? "critical" : isHigh ? "high" : "medium"}>
                        {v.severity}
                      </Badge>
                      <span className="text-xs font-semibold text-zinc-100 tracking-wide">
                        {v.type}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        #{v.id}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                      <span className="text-zinc-200 font-semibold">{v.package}</span>
                      <span className="text-zinc-500">• phase: {v.phase || "runtime"}</span>
                    </div>
                  </div>

                  {/* Target and Message Box */}
                  <div className="bg-zinc-950 border border-zinc-850 rounded-md p-3 text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 shrink-0 font-medium">Syscall Target:</span>
                      <span className="font-mono text-zinc-200 font-medium select-all break-all">{v.target}</span>
                    </div>
                    {v.message && (
                      <div className="flex items-start gap-2 pt-1.5 border-t border-zinc-900 text-zinc-300">
                        <span className="text-zinc-500 shrink-0 font-medium">Anomaly:</span>
                        <span>{v.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Remediation & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-zinc-400 italic">
                      {v.remediation || "Inspect package origin. Approve if intended or reject pull request."}
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="zinc"
                        size="sm"
                        onClick={() => handleCopyCmd(v.id)}
                        className="flex items-center gap-1.5 text-zinc-300"
                        title="Copy CLI approval command to clipboard"
                      >
                        {copiedId === v.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedId === v.id ? "Copied" : "Copy CLI"}</span>
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onOpenApproveModal(v)}
                        className="flex items-center gap-1.5"
                      >
                        <Key size={13} weight="bold" />
                        <span>Approve & Sign</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
