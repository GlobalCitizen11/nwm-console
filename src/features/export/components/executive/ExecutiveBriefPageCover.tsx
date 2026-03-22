import type { ExportSemanticData } from "../../types/export";
import { BoundaryPanel } from "../modules/BoundaryPanel";
import { ExecutiveSummaryBlock } from "../modules/ExecutiveSummaryBlock";
import { InsightCardGrid } from "../modules/InsightCardGrid";
import { KPIStrip } from "../modules/KPIStrip";
import { ExportHeader } from "../primitives/ExportHeader";

export function ExecutiveBriefPageCover({ data }: { data: ExportSemanticData }) {
  return (
    <>
      <ExportHeader title={data.title} subtitle={data.subtitle} metadata={data.metadata} modeLabel="Executive Brief" />
      <div className="export-stack-lg">
        <BoundaryPanel boundary={data.boundary} />
        <KPIStrip stats={data.systemStats} />
        <ExecutiveSummaryBlock text={data.executiveLead} />
        <InsightCardGrid insights={data.keyInsights} columns={2} />
      </div>
    </>
  );
}
