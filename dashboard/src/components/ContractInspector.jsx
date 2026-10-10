import React, { useState } from "react";
import { Copy, Check, FileCode } from "@phosphor-icons/react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function ContractInspector({ contract = {} }) {
  const [copied, setCopied] = useState(false);
  const jsonStr = JSON.stringify(contract, null, 2);
  const lines = jsonStr.split("\n");

  const handleCopy = () => {
    navigator.clipboard?.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const packageCount = Object.keys(contract.packages || {}).length;
  const approvalCount = (contract.approvals || []).length;

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-lg overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <FileCode size={15} />
          </div>
          <div>
            <CardTitle className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 font-sans">
              <span>behavior.lock Specification</span>
              <span className="font-mono text-[10px] text-zinc-500 font-normal">v{contract.version || 1}</span>
            </CardTitle>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans">Committed JSON capability contract for CI/CD enforcement</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-sans">
          <Badge variant="zinc" className="text-[10px]">
            {packageCount} Packages Pinned
          </Badge>
          <Badge variant={approvalCount > 0 ? "high" : "zinc"} className="text-[10px]">
            {approvalCount} Overrides
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-850 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 ml-2 h-7 font-sans"
          >
            {copied ? <Check size={12} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy Contract"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 bg-zinc-950 dark:bg-[#070709]">
        <div className="flex overflow-x-auto max-h-[520px] font-mono text-xs leading-relaxed select-all">
          {/* Line Numbers Gutter */}
          <div className="py-4 pl-4 pr-3 text-right text-zinc-600 bg-zinc-900 dark:bg-zinc-950/80 select-none border-r border-zinc-800 dark:border-zinc-850 shrink-0 font-mono text-[11px]">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* JSON Syntax Content */}
          <pre className="p-4 pl-4 text-zinc-300 overflow-x-auto flex-1 font-mono text-[11px]">
            <code>
              {lines.map((line, idx) => {
                const isApproval = line.includes('"approvals":') || line.includes('"allow":');
                const isPackage = line.includes('"slug-lib') || line.includes('"[project]"');
                
                return (
                  <div key={idx} className={isApproval ? "text-amber-300/90 font-medium" : isPackage ? "text-cyan-300/90" : "text-zinc-300"}>
                    {line}
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
