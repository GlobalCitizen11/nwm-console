import type { ExportInsight, ExportMode } from "../../types/export";
import { StrategicImplicationBlock } from "./StrategicImplicationBlock";

export function RiskMonitoringBlock({ title, insights, mode = "executive-brief" }: { title: string; insights: ExportInsight[]; mode?: ExportMode }) {
  return <StrategicImplicationBlock label="Monitoring" title={title} insights={insights} variant="risk" mode={mode} />;
}
