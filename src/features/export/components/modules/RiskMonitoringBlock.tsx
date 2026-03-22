import type { ExportInsight } from "../../types/export";
import { StrategicImplicationBlock } from "./StrategicImplicationBlock";

export function RiskMonitoringBlock({ title, insights }: { title: string; insights: ExportInsight[] }) {
  return <StrategicImplicationBlock label="Monitor" title={title} insights={insights} />;
}
