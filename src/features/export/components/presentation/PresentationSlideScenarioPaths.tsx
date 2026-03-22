import type { ExportSemanticData } from "../../types/export";
import { ScenarioPathBlock } from "../modules/ScenarioPathBlock";

export function PresentationSlideScenarioPaths({ data }: { data: ExportSemanticData }) {
  return <ScenarioPathBlock title="Scenario Paths" insights={data.scenarioPaths.slice(0, 2)} />;
}
