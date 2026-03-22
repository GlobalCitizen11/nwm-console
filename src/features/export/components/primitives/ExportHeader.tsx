import type { ExportMetadata } from "../../types/export";
import { DataBadge } from "./DataBadge";

export function ExportHeader({
  title,
  subtitle,
  metadata,
  modeLabel,
}: {
  title: string;
  subtitle: string;
  metadata: ExportMetadata;
  modeLabel: string;
}) {
  return (
    <header className="export-header">
      <div>
        <p className="export-meta-label">{modeLabel}</p>
        <h1>{title}</h1>
        <p className="export-subtitle">{subtitle}</p>
      </div>
      <div className="export-header-side">
        <DataBadge tone="neutral">{metadata.confidentiality}</DataBadge>
        <div className="export-header-meta">
          <span>{metadata.phase}</span>
          <span>{metadata.asOf}</span>
        </div>
      </div>
    </header>
  );
}
