import React, { useState, useEffect } from "react";
import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

export function CommandPalette({ isOpen, onClose, violations = [], onSelectViolation }) {
  if (!isOpen) return null;

  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const results = violations.filter(v => {
    const q = query.toLowerCase();
    return !q ||
      v.package?.toLowerCase().includes(q) ||
      v.target?.toLowerCase().includes(q) ||
      v.type?.toLowerCase().includes(q) ||
      v.id?.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-sm">
      <Card className="relative w-full max-w-xl border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-800 gap-3">
          <MagnifyingGlass size={16} className="text-zinc-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a package name, syscall, or breach ID..."
            className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-mono"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-900">
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No matching incidents found for "{query}".
            </div>
          ) : (
            results.map(v => (
              <button
                key={v.id}
                onClick={() => {
                  onSelectViolation?.(v);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-md hover:bg-zinc-900/60 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-100">#{v.id}</span>
                    <span className="text-xs font-semibold text-zinc-300">{v.package}</span>
                    <Badge variant={v.severity === "CRITICAL" ? "critical" : "high"} className="text-[10px] py-0 px-1.5">
                      {v.severity}
                    </Badge>
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-1 truncate max-w-md">
                    {v.target}
                  </div>
                </div>
                <ArrowRight size={13} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
