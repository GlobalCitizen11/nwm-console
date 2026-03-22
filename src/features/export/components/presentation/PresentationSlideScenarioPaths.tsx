import type { ExportSemanticData } from "../../types/export";
import { ScenarioPathBlock } from "../modules/ScenarioPathBlock";
import { SectionTitle } from "../primitives/SectionTitle";

export function PresentationSlideScenarioPaths({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg presentation-slide-section">
      <SectionTitle label="Slide 7" title="Scenario Paths" subtitle="The continuation path and the condition that would redirect it." />
      <ScenarioPathBlock title="Scenario paths" insights={data.scenarioPaths.slice(0, 2)} mode="presentation-brief" />
    </div>
  );
}
