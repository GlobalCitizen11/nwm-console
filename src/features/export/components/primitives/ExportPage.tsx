import type { PropsWithChildren } from "react";
import type { ExportMetadata } from "../../types/export";
import { ExportFooter } from "./ExportFooter";

export function ExportPage({
  children,
  metadata,
  pageNumber,
  totalPages,
  className = "",
}: PropsWithChildren<{ metadata: ExportMetadata; pageNumber: number; totalPages: number; className?: string }>) {
  return (
    <article className={`export-page-frame ${className}`.trim()} data-page={`${pageNumber}-${totalPages}`}>
      <div className="export-page-inner">{children}</div>
      <ExportFooter metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} />
    </article>
  );
}
