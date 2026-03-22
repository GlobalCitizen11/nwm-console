import type { PresentationBriefContent } from "../../types/export";
import { PresentationSlideFrame } from "./PresentationSlideFrame";
import { ExportHeader } from "../primitives/ExportHeader";

export function PresentationBriefDeck({ content }: { content: PresentationBriefContent }) {
  const totalSlides = content.slides.length;
  return (
    <>
      {content.slides.map((slide, index) => (
        <PresentationSlideFrame
          key={slide.id}
          metadata={{
            scenarioName: content.title,
            boundedWorld: "Presentation Brief",
            phase: content.replayMonth,
            asOf: content.replayMonth,
            generatedAt: content.timestamp,
            confidentiality: content.confidentialityLabel,
            currentViewName: "Presentation Brief",
          }}
          pageNumber={index + 1}
          totalPages={totalSlides}
        >
          {index === 0 ? (
            <ExportHeader
              title={content.title}
              subtitle={content.replayMonth}
              metadata={{
                scenarioName: content.title,
                boundedWorld: "Presentation Brief",
                phase: content.replayMonth,
                asOf: content.replayMonth,
                generatedAt: content.timestamp,
                confidentiality: content.confidentialityLabel,
                currentViewName: "Presentation Brief",
              }}
              modeLabel="Presentation Brief"
            />
          ) : null}
          <div className="presentation-slide-section">
            <div className="export-section-title">
              <p className="export-meta-label">Slide {index + 1}</p>
              <h3>{slide.title}</h3>
            </div>
            <div className="presentation-slide-headline">{slide.headline}</div>
            <ul className="presentation-slide-bullets">
              {slide.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        </PresentationSlideFrame>
      ))}
    </>
  );
}
