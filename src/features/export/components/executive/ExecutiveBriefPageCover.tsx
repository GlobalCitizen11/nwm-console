import type { ExportSemanticData } from "../../types/export";
import { BoundaryPanel } from "../modules/BoundaryPanel";
import { ExportHeader } from "../primitives/ExportHeader";
import { HeroStateCard } from "./HeroStateCard";
import { InsightGrid } from "./InsightGrid";
import { KPIBar } from "./KPIBar";

export function ExecutiveBriefPageCover({ data }: { data: ExportSemanticData }) {
  return (
    <>
      <ExportHeader title={data.title} subtitle={data.subtitle} metadata={data.metadata} modeLabel="Executive Brief" />
      <div className="export-stack-lg executive-cover-layout">
        <div className="executive-12-grid executive-cover-top">
          <div className="grid-span-8">
            <HeroStateCard text={data.executiveLead} />
          </div>
          <div className="grid-span-4">
            <BoundaryPanel boundary={data.boundary} />
          </div>
        </div>
        <KPIBar stats={data.systemStats} className="executive-kpi-strip" />
        <InsightGrid insights={data.keyInsights.slice(0, 3)} className="executive-cover-grid executive-cover-grid--three" />
      </div>
    </>
  );
}
