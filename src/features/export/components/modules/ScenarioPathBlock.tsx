import type { ExportInsight } from "../../types/export";
import { InsightCardGrid } from "./InsightCardGrid";
import { SectionTitle } from "../primitives/SectionTitle";

export function ScenarioPathBlock({ title, insights }: { title: string; insights: ExportInsight[] }) {
  return (
    <section className="export-section scenario-path-block">
      <SectionTitle label="Scenario paths" title={title} />
      <InsightCardGrid insights={insights} columns={2} className="scenario-path-grid" leadFirst />
    </section>
  );
}
