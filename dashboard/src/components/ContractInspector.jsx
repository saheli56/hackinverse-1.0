import React, { useState } from "react";
import { Copy, Check, FileCode } from "@phosphor-icons/react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";

export function ContractInspector({ contract = {} }) {
  const [copied, setCopied] = useState(false);
  const jsonStr = JSON.stringify(contract, null, 2);

  const handleCopy = () => {
    navigator.clipboard?.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 px-6 border-b border-zinc-800 bg-zinc-950/70">
        <div className="flex items-center gap-2">
          <FileCode size={16} className="text-zinc-400" />
          <CardTitle className="font-mono text-xs font-semibold text-zinc-100">
            behavior.lock Contract Specification
          </CardTitle>
        </div>

        <Button
          variant="zinc"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-1.5 font-mono text-xs text-zinc-300"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy JSON"}</span>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <pre className="p-6 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[500px] leading-relaxed select-all bg-zinc-950">
          {jsonStr}
        </pre>
      </CardContent>
    </Card>
  );
}
