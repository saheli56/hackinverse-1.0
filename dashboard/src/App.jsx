import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { HeroTriage } from "./components/HeroTriage";
import { BentoGrid } from "./components/BentoGrid";
import { BreachLedger } from "./components/BreachLedger";
import { TopologyView } from "./components/TopologyView";
import { ContractInspector } from "./components/ContractInspector";
import { ArchitectureExplainer } from "./components/ArchitectureExplainer";
import { ApproveModal } from "./components/ApproveModal";
import { CommandPalette } from "./components/CommandPalette";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Stack, GitFork, FileCode, BookOpen, MagnifyingGlassPlus, MagnifyingGlassMinus } from "@phosphor-icons/react";

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
      os: "linux"
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

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("behaviorlock_theme");
      if (saved) return saved;
    }
    return "dark";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("behaviorlock_theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const [activeTab, setActiveTab] = useState("ledger");
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
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

  const handleZoomIn = () => setZoomLevel(prev => Math.min(150, prev + 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(70, prev - 10));
  const handleZoomReset = () => setZoomLevel(100);

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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* Application Shell */}
      <div className="flex flex-col min-h-screen">
        <Navbar 
          data={data}
          onRecheck={handleRecheck}
          isRechecking={isRechecking}
          onOpenSearch={() => setIsSearchOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main 
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-150 origin-top"
          style={{ zoom: `${zoomLevel}%` }}
        >
          {/* Hero Triage with Embedded Scenario Playground */}
          <HeroTriage 
            data={data} 
            onApproveClick={(v) => setSelectedViolation(v)}
            onSelectScenario={handleSelectScenario}
            activeScenario={activeScenario}
            isSwitchingScenario={isSwitchingScenario}
          />

          {/* Bento Grid */}
          <BentoGrid data={data} />

          {/* Radix UI + shadcn Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-center mb-6">
              <TabsList className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1">
                <TabsTrigger value="ledger" className="gap-2 font-sans font-medium text-xs">
                  <Stack size={14} weight={activeTab === "ledger" ? "fill" : "regular"} />
                  <span>Incident Ledger</span>
                  {violations.length > 0 && (
                    <Badge variant="critical" className="ml-1 text-[10px] py-0 px-1.5 font-mono">
                      {violations.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger value="topology" className="gap-2 font-sans font-medium text-xs">
                  <GitFork size={14} weight={activeTab === "topology" ? "fill" : "regular"} />
                  <span>Process Topology</span>
                </TabsTrigger>

                <TabsTrigger value="contract" className="gap-2 font-sans font-medium text-xs">
                  <FileCode size={14} weight={activeTab === "contract" ? "fill" : "regular"} />
                  <span>behavior.lock</span>
                </TabsTrigger>

                <TabsTrigger value="explainer" className="gap-2 font-sans font-medium text-xs">
                  <BookOpen size={14} weight={activeTab === "explainer" ? "fill" : "regular"} />
                  <span>Architecture & Explainer</span>
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

            <TabsContent value="explainer">
              <ArchitectureExplainer />
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-850 py-6 text-center text-xs text-zinc-500 font-sans">
          behavior.lock · Runtime Capability Sandbox · HackInverse 2026
        </footer>
      </div>

      {/* Floating Canvas Zoom Controls (Bottom-Right, Figma/Linear style) */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-lg shadow-black/10">
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 70}
          title="Zoom Out (-10%)"
          className="p-1 px-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors disabled:opacity-30 cursor-pointer"
        >
          <MagnifyingGlassMinus size={14} />
        </button>

        <button
          onClick={handleZoomReset}
          title="Reset Zoom (100%)"
          className="px-2 py-0.5 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
        >
          {zoomLevel}%
        </button>

        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 150}
          title="Zoom In (+10%)"
          className="p-1 px-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors disabled:opacity-30 cursor-pointer"
        >
          <MagnifyingGlassPlus size={14} />
        </button>
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
