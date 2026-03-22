import type { ExportInsight } from "../../types/export";
import { RiskMonitoringBlock } from "../modules/RiskMonitoringBlock";

export function SlideRisks({ insights }: { insights: ExportInsight[] }) {
  return <RiskMonitoringBlock title="Risk and monitoring priorities" insights={insights} mode="presentation-brief" />;
}
