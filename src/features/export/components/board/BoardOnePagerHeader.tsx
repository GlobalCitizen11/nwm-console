import type { ExportSemanticData } from "../../types/export";

export function BoardOnePagerHeader({ data }: { data: ExportSemanticData }) {
  return (
    <header className="board-header-band">
      <div className="board-header-copy">
        <h1>{data.title}</h1>
        <p>{data.metadata.boundedWorld}</p>
      </div>
      <div className="board-header-meta">
        <span>{data.metadata.phase}</span>
        <span>{data.metadata.asOf}</span>
        <span>{data.metadata.confidentiality}</span>
      </div>
    </header>
  );
}
