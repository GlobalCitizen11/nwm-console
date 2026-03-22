import type { PropsWithChildren } from "react";

export function Panel({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <section className={`export-panel ${className}`.trim()}>{children}</section>;
}
