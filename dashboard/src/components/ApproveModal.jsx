import React, { useState } from "react";
import { X, Key, ShieldCheck } from "@phosphor-icons/react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function ApproveModal({ violation, onClose, onConfirm, isSubmitting }) {
  if (!violation) return null;

  const [reason, setReason] = useState("Reviewed and verified legitimate capability change");
  const [signer, setSigner] = useState("dev-lead");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm({
      id: violation.id,
      reason: reason.trim(),
      approved_by: signer.trim() || "engineer"
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className="relative w-full max-w-lg border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center">
              <Key size={16} weight="bold" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-100">
                Sign Cryptographic Override
              </CardTitle>
              <p className="text-xs text-zinc-400">Append audited exception to behavior.lock</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </CardHeader>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <CardContent className="p-5 space-y-4">
            <div className="p-3 rounded-md bg-zinc-900/60 border border-zinc-850 font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Violation ID:</span>
                <span className="text-zinc-200 font-bold">#{violation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Package:</span>
                <span className="text-zinc-300">{violation.package}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Syscall Target:</span>
                <span className="text-amber-300 truncate max-w-[280px]">{violation.target}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Mandatory Audit Reason
              </label>
              <Input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Documented telemetry endpoint for analytics v2"
                className="border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Recorded in the git-trackable audit trail and visible to PR reviewers.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Approver Signature
              </label>
              <Input
                type="text"
                required
                value={signer}
                onChange={(e) => setSigner(e.target.value)}
                className="border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
          </CardContent>

          <CardFooter className="p-4 border-t border-zinc-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-zinc-800 text-zinc-400 hover:text-zinc-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSubmitting || !reason.trim()}
              className="flex items-center gap-1.5"
            >
              <ShieldCheck size={14} weight="bold" />
              <span>{isSubmitting ? "Signing..." : "Sign & Allow in Contract"}</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
