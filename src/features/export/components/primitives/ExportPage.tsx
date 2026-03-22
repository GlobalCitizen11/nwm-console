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
  const isLandscape = className.includes("presentation-slide");
  const pageHeight = isLandscape ? "calc(8.5in - 2px)" : "calc(11in - 2px)";
  const pageStyle = {
    width: isLandscape ? "11in" : "8.5in",
    minHeight: pageHeight,
    height: pageHeight,
    maxHeight: pageHeight,
    boxSizing: "border-box" as const,
  };

  return (
    <article
      className={`export-page-frame ${className}`.trim()}
      data-page={`${pageNumber}-${totalPages}`}
      data-page-number={pageNumber}
      data-total-pages={totalPages}
      style={pageStyle}
    >
      <div className="export-page-inner">{children}</div>
      <ExportFooter metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} />
    </article>
  );
}
