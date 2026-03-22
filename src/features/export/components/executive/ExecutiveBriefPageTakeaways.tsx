import type { ExportSemanticData } from "../../types/export";
import { InsightCardGrid } from "../modules/InsightCardGrid";
import { ScenarioPathBlock } from "../modules/ScenarioPathBlock";
import { StrategicImplicationBlock } from "../modules/StrategicImplicationBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function ExecutiveBriefPageTakeaways({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Page 2" title="Key Takeaways" subtitle="The highest-signal takeaways and the immediate forward orientation." />
      <ScenarioPathBlock title="Dominant path and alternate path" insights={data.scenarioPaths.slice(0, 2)} />
      <div className="export-grid-2">
        <InsightCardGrid insights={data.keyInsights.slice(0, 2)} columns={2} className="executive-support-grid" />
        <StrategicImplicationBlock title="Operating implications" insights={data.implications.slice(0, 3)} label="Implications" />
      </div>
    </div>
  );
}
