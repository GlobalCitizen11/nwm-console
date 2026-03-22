import type { ExportSemanticData } from "../../types/export";
import { RiskMonitoringBlock } from "../modules/RiskMonitoringBlock";

export function BoardOnePagerRiskBlock({ data }: { data: ExportSemanticData }) {
  return <RiskMonitoringBlock title="Risks and forward indicators" insights={data.risks.slice(0, 3)} />;
}
