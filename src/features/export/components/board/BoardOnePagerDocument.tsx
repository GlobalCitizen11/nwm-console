import type { ExportSemanticData } from "../../types/export";
import { ExportPage } from "../primitives/ExportPage";
import { BoardOnePagerEvidenceRow } from "./BoardOnePagerEvidenceRow";
import { BoardOnePagerFooter } from "./BoardOnePagerFooter";
import { BoardOnePagerHeader } from "./BoardOnePagerHeader";
import { BoardOnePagerImplications } from "./BoardOnePagerImplications";
import { BoardOnePagerInsightGrid } from "./BoardOnePagerInsightGrid";
import { BoardOnePagerRiskBlock } from "./BoardOnePagerRiskBlock";
import { BoardOnePagerSystemStrip } from "./BoardOnePagerSystemStrip";

export function BoardOnePagerDocument({ data }: { data: ExportSemanticData }) {
  return (
    <ExportPage metadata={data.metadata} pageNumber={1} totalPages={1} className="board-onepager">
      <BoardOnePagerHeader data={data} />
      <div className="export-stack-md">
        <BoardOnePagerInsightGrid data={data} />
        <BoardOnePagerSystemStrip data={data} />
        <div className="export-grid-2">
          <BoardOnePagerImplications data={data} />
          <BoardOnePagerRiskBlock data={data} />
        </div>
        <BoardOnePagerEvidenceRow data={data} />
        <BoardOnePagerFooter data={data} />
      </div>
    </ExportPage>
  );
}
