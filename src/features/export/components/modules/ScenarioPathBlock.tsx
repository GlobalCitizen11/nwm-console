import type { ExportInsight } from "../../types/export";
import { InsightCardGrid } from "./InsightCardGrid";
import { SectionTitle } from "../primitives/SectionTitle";

export function ScenarioPathBlock({ title, insights }: { title: string; insights: ExportInsight[] }) {
  return (
    <section className="export-section">
      <SectionTitle label="Scenario Paths" title={title} />
      <InsightCardGrid insights={insights} columns={2} />
    </section>
  );
}
