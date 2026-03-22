import type { ExportSemanticData } from "../../types/export";
import { TimelineBand } from "../modules/TimelineBand";
import { SectionTitle } from "../primitives/SectionTitle";

export function PresentationSlideTimeline({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Slide 4" title="Narrative Progression" />
      <TimelineBand items={data.timeline.slice(0, 5)} />
    </div>
  );
}
