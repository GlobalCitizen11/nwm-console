import type { PropsWithChildren } from "react";

export function ExportSection({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <section className={`export-section ${className}`.trim()}>{children}</section>;
}
