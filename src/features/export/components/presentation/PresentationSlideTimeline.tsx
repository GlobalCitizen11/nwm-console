import type { ExportSemanticData } from "../../types/export";
import { InsightCardGrid } from "../modules/InsightCardGrid";
import { SectionTitle } from "../primitives/SectionTitle";

export function PresentationSlideTimeline({ data }: { data: ExportSemanticData }) {
  const grouped = [
    {
      id: "early-signals",
      headline: "Early Signals",
      support: data.sourceState.earlySignals[0] ?? "Initial movement remains concentrated in the earliest evidence layer.",
      signalTag: "Early Signals",
      emphasis: "neutral" as const,
    },
    {
      id: "systemic-uptake",
      headline: "Systemic Uptake",
      support: data.sourceState.systemicUptake[0] ?? "Uptake is still developing across institutions and adjacent domains.",
      signalTag: "Systemic Uptake",
      emphasis: "attention" as const,
    },
    {
      id: "current-state",
      headline: "Current State",
      support: data.sourceState.latestDevelopments[0] ?? data.sourceState.currentCondition,
      signalTag: "Current State",
      emphasis: "attention" as const,
    },
  ];

  return (
    <div className="export-stack-lg">
      <SectionTitle label="Slide 4" title="Narrative Progression" subtitle="The sequence from emergence to the current condition." />
      <InsightCardGrid insights={grouped} columns={3} className="presentation-progression-grid" />
    </div>
  );
}
