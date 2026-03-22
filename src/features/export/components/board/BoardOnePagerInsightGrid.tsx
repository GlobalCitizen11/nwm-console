import type { ExportSemanticData } from "../../types/export";
import { DominantStateBlock } from "./DominantStateBlock";
import { BoardOnePagerImplications } from "./BoardOnePagerImplications";

export function BoardOnePagerInsightGrid({ data }: { data: ExportSemanticData }) {
  const [dominant] = data.keyInsights.slice(0, 1);

  return (
    <div className="board-left-column">
      {dominant ? <DominantStateBlock insight={dominant} /> : null}
      <BoardOnePagerImplications data={data} />
    </div>
  );
}
