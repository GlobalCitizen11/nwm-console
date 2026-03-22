import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { composeExecutiveNarrative } from "../../utils/composeExecutiveNarrative";

export function ExecutiveBriefPageTimeline({ data }: { data: ExportSemanticData }) {
  const narrative = composeExecutiveNarrative(data.sourceState);

  return (
    <section className="executive-brief-section">
      <SectionTitle title={narrative.interpretation.title} subtitle={narrative.interpretation.subtitle} />
      <div className="executive-brief-prose">
        {narrative.interpretation.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
