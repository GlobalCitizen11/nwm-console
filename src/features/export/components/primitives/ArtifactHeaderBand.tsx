import type { ReactNode } from "react";
import { StatusChip } from "./StatusChip";

export function ArtifactHeaderBand({
  title,
  subtitle,
  label,
  meta,
  side,
  className = "",
}: {
  title: string;
  subtitle?: string;
  label?: string;
  meta: Array<{ key: string; value: string; tone?: "default" | "accent" | "warning" }>;
  side?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`artifact-header-band ${className}`.trim()}>
      <div className="artifact-header-copy">
        {label ? <p className="artifact-kicker">{label}</p> : null}
        <h1 className="artifact-header-title">{title}</h1>
        {subtitle ? <p className="artifact-header-subtitle">{subtitle}</p> : null}
      </div>
      <div className="artifact-header-rail">
        <div className="artifact-header-meta-rail">
          {meta.map((item) => (
            <StatusChip key={`${item.key}-${item.value}`} label={item.key} value={item.value} tone={item.tone} />
          ))}
        </div>
        {side ? <div className="artifact-header-side">{side}</div> : null}
      </div>
    </header>
  );
}
