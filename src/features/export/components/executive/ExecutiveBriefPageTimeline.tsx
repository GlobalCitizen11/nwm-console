import type { ExportSemanticData } from "../../types/export";
import { TimelineBand } from "../modules/TimelineBand";
import { ContextPanel } from "../modules/ContextPanel";
import { SectionTitle } from "../primitives/SectionTitle";

export function ExecutiveBriefPageTimeline({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Page 3" title="Narrative Evolution" subtitle="Development path from early signals through current condition." />
      <TimelineBand items={data.timeline} />
      <ContextPanel
        label="Interpretation"
        title="Narrative development read"
        text={`${data.sourceState.currentCondition} ${data.sourceState.structuralShift}`}
      />
    </div>
  );
}
