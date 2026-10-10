import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { X, Key, GitDiff, CheckCircle } from "@phosphor-icons/react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function ApproveModal({ violation, onClose, onConfirm, isSubmitting }) {
  if (!violation) return null;

  const [reason, setReason] = useState("Reviewed and authorized legitimate capability change");
  const [signer, setSigner] = useState("dev-lead");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#10b981", "#38bdf8", "#f59e0b", "#ffffff"]
      });
    } catch {}

    onConfirm({
      id: violation.id,
      reason: reason.trim(),
      approved_by: signer.trim() || "engineer"
    });
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="relative w-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden">
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                  <Key size={16} weight="bold" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                    Authorize Capability Drift
                  </CardTitle>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">Cryptographically signs policy override into behavior.lock</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </CardHeader>

            {/* Form & Live Diff */}
            <form onSubmit={handleSubmit}>
              <CardContent className="p-5 space-y-4">
                {/* Violation Target Metadata */}
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5 font-sans">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Violation ID:</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-200 font-bold">#{violation.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Package:</span>
                    <span className="text-zinc-900 dark:text-zinc-200 font-medium">{violation.package}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Syscall Target:</span>
                    <span className="font-mono text-amber-600 dark:text-amber-300 font-medium truncate max-w-[280px]">{violation.target}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 font-sans">
                    Mandatory Audit Justification
                  </label>
                  <Input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Verified vendor analytics endpoint"
                    className="border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs h-9 font-sans"
                  />
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Committed to git history so PR reviewers can audit your approval.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 font-sans">
                    Approver Signature / Handle
                  </label>
                  <Input
                    type="text"
                    required
                    value={signer}
                    onChange={(e) => setSigner(e.target.value)}
                    className="border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs h-9 font-sans"
                  />
                </div>

                {/* Live Git Diff Preview */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-1.5 font-sans">
                    <GitDiff size={13} className="text-emerald-500 dark:text-emerald-400" />
                    <span>Live Git Diff Preview (behavior.lock):</span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 font-mono text-[11px] leading-relaxed select-all text-emerald-600 dark:text-emerald-400 max-h-36 overflow-y-auto">
                    <span className="text-emerald-600 dark:text-emerald-400">+ "approvals": [</span><br />
                    <span className="text-emerald-600 dark:text-emerald-400">+   &#123;</span><br />
                    <span className="text-emerald-600 dark:text-emerald-400">+     "id": "{violation.id}",</span><br />
                    <span className="text-emerald-600 dark:text-emerald-400">+     "package": "{violation.package}",</span><br />
                    <span className="text-emerald-600 dark:text-emerald-400">+     "reason": "{reason.trim() || "..."}",</span><br />
                    <span className="text-emerald-600 dark:text-emerald-400">+     "approved_by": "{signer.trim() || "engineer"}",</span><br />
                    <span className="text-emerald-600 dark:text-emerald-400">+     "created_at": "{today}"</span><br />
                    <span className="text-emerald-600 dark:text-emerald-400">+   &#125;</span><br />
                    <span className="text-emerald-600 dark:text-emerald-400">+ ]</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 bg-zinc-50/70 dark:bg-zinc-950/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-sans"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={isSubmitting || !reason.trim()}
                  className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium font-sans"
                >
                  <CheckCircle size={14} weight="bold" />
                  <span>{isSubmitting ? "Signing Contract..." : "Authorize & Sign in Contract"}</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
