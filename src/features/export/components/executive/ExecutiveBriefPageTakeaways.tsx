import type { ExportSemanticData } from "../../types/export";
import { SectionTitle } from "../primitives/SectionTitle";
import { composeExecutiveNarrative } from "../../utils/composeExecutiveNarrative";

export function ExecutiveBriefPageTakeaways({ data }: { data: ExportSemanticData }) {
  const narrative = composeExecutiveNarrative(data.sourceState);

  return (
    <section className="executive-brief-section">
      <SectionTitle title={narrative.development.title} subtitle={narrative.development.subtitle} />
      <div className="executive-brief-prose">
        {narrative.development.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
