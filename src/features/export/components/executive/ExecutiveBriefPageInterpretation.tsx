import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { composeExecutiveNarrative } from "../../utils/composeExecutiveNarrative";

export function ExecutiveBriefPageInterpretation({ data }: { data: ExportSemanticData }) {
  const narrative = composeExecutiveNarrative(data.sourceState);

  return (
    <section className="executive-brief-section">
      <SectionTitle title={narrative.forward.title} subtitle={narrative.forward.subtitle} />
      <div className="executive-brief-prose">
        {narrative.forward.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
