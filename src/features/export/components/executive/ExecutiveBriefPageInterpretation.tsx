import type { ExportSemanticData } from "../../types/export";
import { StrategicImplicationBlock } from "../modules/StrategicImplicationBlock";
import { RiskMonitoringBlock } from "../modules/RiskMonitoringBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function ExecutiveBriefPageInterpretation({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Page 4" title="Strategic Interpretation" subtitle="Structural reading, implications, and monitoring priorities." />
      <div className="export-grid-2">
        <StrategicImplicationBlock title="Strategic implications" insights={data.implications} label="Interpretation" />
        <RiskMonitoringBlock title="Monitoring priorities" insights={data.monitoringPriorities} />
      </div>
      <StrategicImplicationBlock title="Sensitivities and watchlist" insights={data.risks} label="Risk + monitoring" />
    </div>
  );
}
