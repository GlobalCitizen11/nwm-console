import type { ExportMetadata } from "../../types/export";

export function ExportFooter({ metadata, pageNumber, totalPages }: { metadata: ExportMetadata; pageNumber: number; totalPages: number }) {
  return (
    <footer className="export-footer">
      <div className="export-footer-block">
        <span>{metadata.confidentiality}</span>
        <span>{metadata.scenarioName}</span>
      </div>
      <div className="export-footer-block">
        <span>{metadata.generatedAt}</span>
        <span>
          Page {pageNumber} / {totalPages}
        </span>
      </div>
    </footer>
  );
}
