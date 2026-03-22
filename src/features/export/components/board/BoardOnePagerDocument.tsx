import type { ExportSemanticData } from "../../types/export";
import { ExportPage } from "../primitives/ExportPage";
import { BoardOnePagerEvidenceRow } from "./BoardOnePagerEvidenceRow";
import { BoardOnePagerFooter } from "./BoardOnePagerFooter";
import { BoardOnePagerHeader } from "./BoardOnePagerHeader";
import { BoardOnePagerInsightGrid } from "./BoardOnePagerInsightGrid";
import { BoardOnePagerRiskBlock } from "./BoardOnePagerRiskBlock";
import { BoardOnePagerSignalStack } from "./BoardOnePagerSignalStack";
import { BoardOnePagerSystemStrip } from "./BoardOnePagerSystemStrip";

export function BoardOnePagerDocument({ data }: { data: ExportSemanticData }) {
  return (
    <ExportPage metadata={data.metadata} pageNumber={1} totalPages={1} className="board-onepager">
      <div className="board-onepager-shell">
        <BoardOnePagerHeader data={data} />
        <div className="board-main-grid">
          <div className="board-left-stack">
            <BoardOnePagerSystemStrip data={data} />
            <BoardOnePagerInsightGrid data={data} />
          </div>
          <BoardOnePagerSignalStack data={data} />
        </div>
        <div className="board-bottom-grid">
          <BoardOnePagerRiskBlock data={data} />
          <BoardOnePagerEvidenceRow data={data} />
        </div>
        <BoardOnePagerFooter />
      </div>
    </ExportPage>
  );
}
