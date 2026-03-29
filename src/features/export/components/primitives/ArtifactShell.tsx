import type { PropsWithChildren } from "react";

export function ArtifactShell({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return <div className={`artifact-shell ${className}`.trim()}>{children}</div>;
}
