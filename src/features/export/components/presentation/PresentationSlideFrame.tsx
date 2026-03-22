import type { PropsWithChildren } from "react";
import type { ExportMetadata } from "../../types/export";
import { ExportPage } from "../primitives/ExportPage";

export function PresentationSlideFrame({
  children,
  metadata,
  pageNumber,
  totalPages,
}: PropsWithChildren<{ metadata: ExportMetadata; pageNumber: number; totalPages: number }>) {
  return (
    <ExportPage metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} className="presentation-slide">
      {children}
    </ExportPage>
  );
}
