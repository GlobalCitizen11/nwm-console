import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { SlideImplications } from "./SlideImplications";

export function PresentationSlideImplications({ data }: { data: ExportSemanticData }) {
  return (
    <div className="export-stack-lg">
      <SectionTitle label="Slide 6" title="Strategic Implications" subtitle="What changes in the operating environment if the current path persists." />
      <SlideImplications left={data.implications.slice(0, 3)} right={data.crossDomainEffects.slice(0, 3)} />
    </div>
  );
}
