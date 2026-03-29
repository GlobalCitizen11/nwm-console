import type { ExportMetadata } from "../../types/export";
import { DataBadge } from "./DataBadge";
import { ArtifactHeaderBand } from "./ArtifactHeaderBand";

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
  const meta = [
    { key: "Scenario", value: metadata.scenarioName },
    { key: "Role", value: modeLabel, tone: "accent" as const },
    { key: "Replay Month", value: metadata.asOf },
    { key: "Phase", value: metadata.phase },
  ];

  return (
    <ArtifactHeaderBand
      className="export-header"
      label={modeLabel}
      title={title}
      subtitle={subtitle}
      meta={meta}
      side={
        <>
          <DataBadge tone="neutral">{metadata.confidentiality}</DataBadge>
          <div className="export-header-meta-grid">
            <div className="export-header-meta">
              <span>Boundary</span>
              <span>{metadata.boundedWorld}</span>
            </div>
            <div className="export-header-meta">
              <span>Generated</span>
              <span>{metadata.generatedAt}</span>
            </div>
          </div>
        </>
      }
    />
  );
}
