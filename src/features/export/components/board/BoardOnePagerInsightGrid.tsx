import type { ExportSemanticData } from "../../types/export";
import { InsightCardGrid } from "../modules/InsightCardGrid";
import { DominantStateBlock } from "./DominantStateBlock";

export function BoardOnePagerInsightGrid({ data }: { data: ExportSemanticData }) {
  const [dominant, ...supporting] = data.keyInsights.slice(0, 4);
  return (
    <div className="board-insight-grid">
      {dominant ? <DominantStateBlock insight={dominant} /> : null}
      <InsightCardGrid insights={supporting.slice(0, 2)} columns={3} compact className="board-supporting-grid" mode="board-onepager" fitMode="support" />
    </div>
  );
}
