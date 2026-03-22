import type { ExportInsight } from "../../types/export";
import { StrategicImplicationBlock } from "../modules/StrategicImplicationBlock";

export function SlideImplications({ left, right }: { left: ExportInsight[]; right: ExportInsight[] }) {
  return (
    <div className="export-grid-2 presentation-two-column">
      <StrategicImplicationBlock title="Strategic implications" insights={left} mode="presentation-brief" />
      <StrategicImplicationBlock title="Cross-domain effects" insights={right} mode="presentation-brief" />
    </div>
  );
}
