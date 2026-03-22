import type { ExportSemanticData } from "../../types/export";
import { RiskMonitoringBlock } from "../modules/RiskMonitoringBlock";

export function BoardOnePagerRiskBlock({ data }: { data: ExportSemanticData }) {
  return <RiskMonitoringBlock title="Monitoring and watchpoints" insights={data.risks.slice(0, 2)} mode="board-onepager" />;
}
