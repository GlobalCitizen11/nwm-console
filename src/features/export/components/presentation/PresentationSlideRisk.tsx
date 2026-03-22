import type { ExportSemanticData } from "../../types/export";
import { RiskMonitoringBlock } from "../modules/RiskMonitoringBlock";

export function PresentationSlideRisk({ data }: { data: ExportSemanticData }) {
  return <RiskMonitoringBlock title="Risk + Monitoring" insights={data.risks.slice(0, 4)} />;
}
