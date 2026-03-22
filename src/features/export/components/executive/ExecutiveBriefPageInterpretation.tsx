import type { ExportSemanticData } from "../../types/export";
import { StrategicImplicationBlock } from "../modules/StrategicImplicationBlock";
import { RiskMonitoringBlock } from "../modules/RiskMonitoringBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function ExecutiveBriefPageInterpretation({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Strategic interpretation" title="Strategic interpretation" subtitle="What the current structure means, where it is most sensitive, and what deserves closer visibility." />
      <div className="export-grid-2 executive-interpretation-grid">
        <StrategicImplicationBlock title="Strategic implications" insights={data.implications.slice(0, 3)} label="Interpretation" mode="executive-brief" />
        <RiskMonitoringBlock title="Monitoring priorities" insights={data.monitoringPriorities.slice(0, 3)} mode="executive-brief" />
      </div>
      <StrategicImplicationBlock title="Sensitivities and watchlist" insights={data.risks.slice(0, 3)} label="Sensitivity watch" variant="risk" mode="executive-brief" />
    </div>
  );
}
