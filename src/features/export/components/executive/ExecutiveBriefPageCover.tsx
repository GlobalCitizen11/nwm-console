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
      <div className="export-stack-lg executive-cover-layout">
        <div className="export-grid-2 executive-cover-top">
          <BoundaryPanel boundary={data.boundary} />
          <ExecutiveSummaryBlock text={data.executiveLead} />
        </div>
        <KPIStrip stats={data.systemStats} className="executive-kpi-strip" />
        <InsightCardGrid insights={data.keyInsights} columns={2} className="executive-cover-grid" leadFirst />
      </div>
    </>
  );
}
