import type { ExportSemanticData } from "../../types/export";
import { ScenarioPathBlock } from "../modules/ScenarioPathBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function PresentationSlideScenarioPaths({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg presentation-slide-section">
      <SectionTitle label="Slide 6" title="Scenario paths" />
      <ScenarioPathBlock title="Scenario paths" insights={data.scenarioPaths.slice(0, 2)} mode="presentation-brief" />
    </div>
  );
}
