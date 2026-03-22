import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { composeExecutiveNarrative } from "../../utils/composeExecutiveNarrative";

export function ExecutiveBriefPageEvidence({ data }: { data: ExportSemanticData }) {
  const narrative = composeExecutiveNarrative(data.sourceState);

  return (
    <section className="executive-brief-section">
      <SectionTitle title={narrative.positioning.title} subtitle={narrative.positioning.subtitle} />
      <div className="executive-brief-prose">
        {narrative.positioning.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
