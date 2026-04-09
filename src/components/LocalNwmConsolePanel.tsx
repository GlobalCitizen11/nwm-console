import { useMemo, useState } from "react";
import type { SimulationResult, ViewSnapshot, WorldStatePoint } from "../types";
import { buildLocalNwmConsolePayload, type LocalNwmConsoleTabId } from "../lib/buildLocalNwmConsole";
import { downloadLocalNwmConsolePdf } from "../lib/localNwmConsolePdf";

export function LocalNwmConsolePanel({
  scenarioLabel,
  result,
  point,
  currentView,
}: {
  scenarioLabel: string;
  result: SimulationResult;
  point: WorldStatePoint;
  currentView: ViewSnapshot;
}) {
  const [activeTab, setActiveTab] = useState<LocalNwmConsoleTabId>("executive");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [downloadState, setDownloadState] = useState<"idle" | "working">("idle");

  const payload = useMemo(
    () =>
      buildLocalNwmConsolePayload({
        scenarioName: scenarioLabel,
        result,
        point,
        currentView,
      }),
    [currentView, point, result, scenarioLabel],
  );

  const activeOutput = payload.tabs.find((tab) => tab.id === activeTab) ?? payload.tabs[0]!;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeOutput.text);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1400);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadState("working");
    try {
      await downloadLocalNwmConsolePdf({
        scenarioLabel,
        scenarioId: currentView.scenarioId,
        result,
        point,
        currentView,
        tabId: activeOutput.id,
      });
    } finally {
      setDownloadState("idle");
    }
  };

  return (
    <section className="surface-panel">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="section-kicker">Local NWM Console</p>
            <p className="mt-2 text-sm leading-7 text-muted">
              Local orientation output derived from the live bounded-world state. This panel stays inside the console and does not call an external model.
            </p>
          </div>
          <div className={`surface-panel-subtle grid w-full gap-2 text-sm text-ink xl:max-w-[320px] ${payload.briefStatus === "Withheld" ? "border-phaseYellow/40" : ""}`}>
            <p>Mode: <span className="text-muted">Orientation</span></p>
            <p>Validity: <span className="text-muted">{payload.validity}</span></p>
            <p>Brief status: <span className="text-muted">{payload.briefStatus}</span></p>
            <p>Adjudication: <span className="text-muted">{payload.adjudicationStatus}</span></p>
          </div>
        </div>

        {payload.withheldReason ? (
          <p className="text-xs leading-6 text-muted">
            Current gate block: <span className="text-ink">{payload.withheldReason}</span>
          </p>
        ) : null}

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="segmented-control">
            {payload.tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  activeTab === tab.id ? "bg-panel text-ink" : "text-muted hover:text-ink"
                }`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCopyState("idle");
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{activeOutput.label} Output</p>
            <button type="button" className="action-button text-left" onClick={handleDownloadPdf} disabled={downloadState === "working"}>
              {downloadState === "working" ? "Preparing PDF" : `Download ${activeOutput.label} PDF`}
            </button>
            <button type="button" className="action-button text-left" onClick={handleCopy}>
              {copyState === "copied" ? "Copied" : copyState === "error" ? "Retry Copy" : `Copy ${activeOutput.label}`}
            </button>
          </div>
        </div>

        <div className="surface-panel-subtle p-0">
          <pre className="max-h-[34rem] overflow-auto px-4 py-4 font-mono text-[12px] leading-6 text-ink whitespace-pre-wrap">
            {activeOutput.text}
          </pre>
        </div>
      </div>
    </section>
  );
}
