import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { HeroTriage } from "./components/HeroTriage";
import { BentoGrid } from "./components/BentoGrid";
import { BreachLedger } from "./components/BreachLedger";
import { TopologyView } from "./components/TopologyView";
import { ContractInspector } from "./components/ContractInspector";
import { ApproveModal } from "./components/ApproveModal";
import { CommandPalette } from "./components/CommandPalette";
import { Spotlight } from "./components/effects/Spotlight";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Stack, GitFork, FileCode } from "@phosphor-icons/react";

// Fallback initial state if static or running standalone
const DEFAULT_DATA = {
  diffResult: {
    passed: false,
    summary: { critical: 1, high: 1, medium: 0, total: 2 },
    violations: [
      {
        id: "5826",
        type: "SECRET_CANARY_TRIPWIRE",
        severity: "CRITICAL",
        package: "slug-lib",
        phase: "runtime",
        target: "[CANARY_ZONE]/.aws/credentials",
        message: "Decoy credential read intercepted: attempted read of canary file",
        remediation: "Supply chain compromise suspected. Reject this package version."
      },
      {
        id: "4163",
        type: "NETWORK_ANOMALY",
        severity: "HIGH",
        package: "slug-lib",
        phase: "runtime",
        target: "stats.slug-analytics.com:443",
        message: "New outbound connection to stats.slug-analytics.com:443 during runtime phase",
        remediation: "Review network endpoint. Run behaviorlock approve 4163 if intended."
      }
    ],
    approvedMatches: []
  },
  contract: {
    version: 1,
    generated: new Date().toISOString().split("T")[0],
    sandbox: {
      engine: "runtime-hook (V8)",
      node: "v22",
      os: "win32"
    },
    packages: {
      "slug-lib": {
        runtime: {
          network: ["stats.slug-analytics.com:443"]
        }
      }
    },
    approvals: []
  },
  targetName: "demo-app"
};

export function App() {
  const [data, setData] = useState(() => {
    if (typeof window !== "undefined" && window.__BEHAVIORLOCK_DATA__) {
      return window.__BEHAVIORLOCK_DATA__;
    }
    return DEFAULT_DATA;
  });

  const [activeTab, setActiveTab] = useState("ledger");
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [activeScenario, setActiveScenario] = useState(() => {
    if (typeof window !== "undefined" && window.__BEHAVIORLOCK_DATA__?.scenario) {
      return window.__BEHAVIORLOCK_DATA__.scenario;
    }
    return "safe";
  });
  const [isSwitchingScenario, setIsSwitchingScenario] = useState(false);

  // Poll or fetch live API if server is running
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveData() {
      try {
        const res = await fetch("/api/data");
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json && json.diffResult) {
            setData(json);
            if (json.scenario) setActiveScenario(json.scenario);
          }
        }
      } catch {
        // Standalone file mode
      }
    }

    fetchLiveData();

    // Auto-sync every 3s and on window focus
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchLiveData();
      }
    }, 3000);

    const onFocus = () => fetchLiveData();
    window.addEventListener("focus", onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRecheck = async () => {
    setIsRechecking(true);
    try {
      const res = await fetch("/api/check", { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
      }
    } catch {
      setTimeout(() => setIsRechecking(false), 600);
      return;
    }
    setIsRechecking(false);
  };

  const handleSelectScenario = async (scenario) => {
    setIsSwitchingScenario(true);
    setActiveScenario(scenario);
    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario })
      });
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
      }
    } catch {
      // Fallback for static demo
    } finally {
      setIsSwitchingScenario(false);
    }
  };

  const handleConfirmApproval = async ({ id, reason, approved_by }) => {
    setIsSubmittingApproval(true);
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reason, approved_by })
      });
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
        setSelectedViolation(null);
      } else {
        // Fallback for static mode
        setData(prev => {
          const violations = (prev.diffResult?.violations || []).filter(v => v.id !== id);
          return {
            ...prev,
            diffResult: {
              ...prev.diffResult,
              violations,
              passed: violations.length === 0,
              summary: {
                ...prev.diffResult.summary,
                total: violations.length
              }
            }
          };
        });
        setSelectedViolation(null);
      }
    } catch {
      setData(prev => {
        const violations = (prev.diffResult?.violations || []).filter(v => v.id !== id);
        return {
          ...prev,
          diffResult: {
            ...prev.diffResult,
            violations,
            passed: violations.length === 0,
            summary: {
              ...prev.diffResult.summary,
              total: violations.length
            }
          }
        };
      });
      setSelectedViolation(null);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const violations = data.diffResult?.violations || [];

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Aceternity Subtle Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-30 z-0 bg-grid-zinc [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      {/* Aceternity Subtle Spotlight */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#ffffff" />

      {/* Application Shell */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar 
          data={data}
          onRecheck={handleRecheck}
          isRechecking={isRechecking}
          onOpenSearch={() => setIsSearchOpen(true)}
          onSelectScenario={handleSelectScenario}
          activeScenario={activeScenario}
          isSwitchingScenario={isSwitchingScenario}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero Triage */}
          <HeroTriage 
            data={data} 
            onApproveClick={(v) => setSelectedViolation(v)}
          />

          {/* Aceternity Bento Grid */}
          <BentoGrid data={data} />

          {/* Radix UI + shadcn Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-center mb-6">
              <TabsList className="bg-zinc-900 border-zinc-800">
                <TabsTrigger value="ledger" className="gap-2">
                  <Stack size={14} weight={activeTab === "ledger" ? "fill" : "regular"} />
                  <span>Incident Ledger</span>
                  {violations.length > 0 && (
                    <Badge variant="critical" className="ml-1 text-[10px] py-0 px-1.5">
                      {violations.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger value="topology" className="gap-2">
                  <GitFork size={14} weight={activeTab === "topology" ? "fill" : "regular"} />
                  <span>Process Topology</span>
                </TabsTrigger>

                <TabsTrigger value="contract" className="gap-2">
                  <FileCode size={14} weight={activeTab === "contract" ? "fill" : "regular"} />
                  <span>behavior.lock</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="ledger">
              <BreachLedger 
                violations={violations} 
                onOpenApproveModal={(v) => setSelectedViolation(v)}
              />
            </TabsContent>

            <TabsContent value="topology">
              <TopologyView data={data} />
            </TabsContent>

            <TabsContent value="contract">
              <ContractInspector contract={data.contract} />
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
          behavior.lock · Runtime Capability Sandbox · HackInverse 2026
        </footer>
      </div>

      {/* Modals & Dialogs */}
      <ApproveModal
        violation={selectedViolation}
        onClose={() => setSelectedViolation(null)}
        onConfirm={handleConfirmApproval}
        isSubmitting={isSubmittingApproval}
      />

      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        violations={violations}
        onSelectViolation={(v) => setSelectedViolation(v)}
      />
    </div>
  );
}

export default App;
