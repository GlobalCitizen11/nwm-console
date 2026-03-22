import type { ExportSemanticData } from "../../types/export";
import { StrategicImplicationBlock } from "../modules/StrategicImplicationBlock";
import { RiskMonitoringBlock } from "../modules/RiskMonitoringBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function ExecutiveBriefPageInterpretation({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Page 4" title="Strategic Interpretation" subtitle="Structural reading, implications, and monitoring priorities." />
      <div className="export-grid-2 executive-interpretation-grid">
        <StrategicImplicationBlock title="Strategic implications" insights={data.implications.slice(0, 3)} label="Interpretation" />
        <RiskMonitoringBlock title="Monitoring priorities" insights={data.monitoringPriorities.slice(0, 3)} />
      </div>
      <StrategicImplicationBlock title="Sensitivities and watchlist" insights={data.risks.slice(0, 3)} label="Sensitivity watch" variant="risk" />
    </div>
  );
}
