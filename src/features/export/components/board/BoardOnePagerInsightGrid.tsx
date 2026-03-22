import type { ExportSemanticData } from "../../types/export";
import { InsightCardGrid } from "../modules/InsightCardGrid";

export function BoardOnePagerInsightGrid({ data }: { data: ExportSemanticData }) {
  return <InsightCardGrid insights={data.keyInsights.slice(0, 4)} columns={4} compact />;
}
