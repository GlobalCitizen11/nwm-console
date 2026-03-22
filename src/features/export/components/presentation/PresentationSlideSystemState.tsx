import type { ExportSemanticData } from "../../types/export";
import { KPIStrip } from "../modules/KPIStrip";
import { ExecutiveSummaryBlock } from "../modules/ExecutiveSummaryBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function PresentationSlideSystemState({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Slide 2" title="System State" subtitle="Current operating posture at a glance." />
      <KPIStrip stats={data.systemStats.slice(0, 4)} className="presentation-kpi-strip" />
      <ExecutiveSummaryBlock text={data.executiveLead} />
    </div>
  );
}
