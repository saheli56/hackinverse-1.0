import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlass, ArrowRight, X } from "@phosphor-icons/react";
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
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="relative w-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden">
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 gap-3 bg-zinc-50/70 dark:bg-zinc-950/50">
              <MagnifyingGlass size={16} className="text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by package, syscall path, or incident ID..."
                className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none font-sans"
              />
              <button
                onClick={onClose}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                title="Close (Esc)"
              >
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
                  ESC
                </kbd>
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-100 dark:divide-zinc-850">
              {results.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 font-sans">
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
                    className="w-full text-left p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">#{v.id}</span>
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 font-sans">{v.package}</span>
                        <Badge variant={v.severity === "CRITICAL" ? "critical" : "high"} className="text-[10px] py-0 px-1.5">
                          {v.severity}
                        </Badge>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-1 truncate max-w-md">
                        {v.target}
                      </div>
                    </div>
                    <ArrowRight size={13} className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                  </button>
                ))
              )}
            </div>

            <div className="p-2.5 px-4 bg-zinc-50/70 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-sans">
              <span>Click outside or press <kbd className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-[10px]">ESC</kbd> to close</span>
              <span>Press <kbd className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-[10px]">Enter</kbd> to inspect</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
