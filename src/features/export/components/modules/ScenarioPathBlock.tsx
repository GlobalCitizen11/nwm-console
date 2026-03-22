import type { ExportInsight, ExportMode } from "../../types/export";
import { InsightCardGrid } from "./InsightCardGrid";
import { SectionTitle } from "../primitives/SectionTitle";

export function ScenarioPathBlock({ title, insights, mode = "executive-brief" }: { title: string; insights: ExportInsight[]; mode?: ExportMode }) {
  return (
    <section className="export-section scenario-path-block">
      <SectionTitle label="Scenario paths" title={title} />
      <InsightCardGrid insights={insights} columns={2} className="scenario-path-grid" leadFirst mode={mode} fitMode="scenario" />
    </section>
  );
}
