import type { ExportInsight } from "../../types/export";
import { InsightCardGrid } from "./InsightCardGrid";

export function SignalDriverGrid({ insights }: { insights: ExportInsight[] }) {
  return <InsightCardGrid insights={insights} columns={2} compact className="signal-driver-grid" />;
}
