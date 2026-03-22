import type { ExportSemanticData } from "../../types/export";
import { InsightCardGrid } from "../modules/InsightCardGrid";
import { ScenarioPathBlock } from "../modules/ScenarioPathBlock";
import { StrategicImplicationBlock } from "../modules/StrategicImplicationBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function ExecutiveBriefPageTakeaways({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Takeaways" title="Key takeaways" subtitle="The dominant path, the live alternatives, and the operating read they imply." />
      <ScenarioPathBlock title="Dominant path and alternate path" insights={data.scenarioPaths.slice(0, 2)} mode="executive-brief" />
      <div className="export-grid-2">
        <InsightCardGrid insights={data.keyInsights.slice(0, 2)} columns={2} className="executive-support-grid" mode="executive-brief" fitMode="support" />
        <StrategicImplicationBlock title="Operating implications" insights={data.implications.slice(0, 3)} label="Implications" mode="executive-brief" />
      </div>
    </div>
  );
}
