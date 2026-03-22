import type { ExportInsight } from "../../types/export";
import { RiskMonitoringBlock } from "../modules/RiskMonitoringBlock";

export function SlideRisks({ insights }: { insights: ExportInsight[] }) {
  return <RiskMonitoringBlock title="Watch indicators" insights={insights} mode="presentation-brief" />;
}
