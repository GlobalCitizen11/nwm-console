import type { ExportSemanticData } from "../../types/export";
import { RiskMonitoringBlock } from "../modules/RiskMonitoringBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function PresentationSlideRisk({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Slide 8" title="Risk & Monitoring" subtitle="What merits closer visibility if the environment continues to tighten." />
      <RiskMonitoringBlock title="Risk and monitoring priorities" insights={data.risks.slice(0, 3)} />
    </div>
  );
}
