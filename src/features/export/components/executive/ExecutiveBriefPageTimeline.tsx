import type { ExportSemanticData } from "../../types/export";
import { ContextPanel } from "../modules/ContextPanel";
import { InsightCardGrid } from "../modules/InsightCardGrid";
import { SectionTitle } from "../primitives/SectionTitle";

export function ExecutiveBriefPageTimeline({ data }: { data: ExportSemanticData }) {
  const progression = [
    {
      id: "progression-early",
      headline: "Early Signals",
      support: data.sourceState.earlySignals[0] ?? "Initial signal formation remains visible at the edge of the bounded world.",
      signalTag: "Early Signals",
      emphasis: "neutral" as const,
    },
    {
      id: "progression-systemic",
      headline: "Systemic Uptake",
      support: data.sourceState.systemicUptake[0] ?? "Institutional uptake is still uneven across the system.",
      signalTag: "Systemic Uptake",
      emphasis: "attention" as const,
    },
    {
      id: "progression-current",
      headline: "Current State",
      support: data.sourceState.latestDevelopments[0] ?? data.sourceState.currentCondition,
      signalTag: "Current State",
      emphasis: "attention" as const,
    },
  ];

  return (
    <div className="export-stack-lg">
      <SectionTitle label="Page 3" title="Narrative Evolution" subtitle="Development path from early signals through current condition." />
      <InsightCardGrid insights={progression} columns={3} className="executive-progression-grid" />
      <ContextPanel
        className="executive-transition-panel"
        label="Key transition"
        title="Latest transition in context"
        text={`${data.sourceState.currentCondition} ${data.sourceState.structuralShift}`}
      />
    </div>
  );
}
