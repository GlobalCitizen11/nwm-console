import type { ExportInsight, ExportMode } from "../../types/export";
import { InsightCardGrid } from "./InsightCardGrid";

export function SignalDriverGrid({ insights, mode = "executive-brief" }: { insights: ExportInsight[]; mode?: ExportMode }) {
  return <InsightCardGrid insights={insights} columns={2} compact className="signal-driver-grid" mode={mode} fitMode="support" />;
}
