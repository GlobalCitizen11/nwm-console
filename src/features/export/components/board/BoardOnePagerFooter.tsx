import type { ExportSemanticData } from "../../types/export";

export function BoardOnePagerFooter({ data }: { data: ExportSemanticData }) {
  return <p className="board-footer-note">{data.closingSynthesis}</p>;
}
