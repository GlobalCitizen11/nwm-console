import type { PropsWithChildren } from "react";
import type { ExportMetadata } from "../../types/export";
import { ExportFooter } from "./ExportFooter";
import { ArtifactShell } from "./ArtifactShell";

export function ExportPage({
  children,
  metadata,
  pageNumber,
  totalPages,
  className = "",
}: PropsWithChildren<{ metadata: ExportMetadata; pageNumber: number; totalPages: number; className?: string }>) {
  return (
    <article
      className={`export-page-frame ${className}`.trim()}
      data-page={`${pageNumber}-${totalPages}`}
      data-page-number={pageNumber}
      data-total-pages={totalPages}
    >
      <ArtifactShell className="export-page-inner">{children}</ArtifactShell>
      <ExportFooter metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} />
    </article>
  );
}
