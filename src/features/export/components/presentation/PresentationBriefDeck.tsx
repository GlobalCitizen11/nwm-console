import type { PresentationBriefContent } from "../../types/export";
import { PresentationSlideFrame } from "./PresentationSlideFrame";
import { ExportHeader } from "../primitives/ExportHeader";
import { DecisionBox } from "../primitives/DecisionBox";
import { SignalCard } from "../primitives/SignalCard";

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
          <div className={`presentation-slide-section presentation-slide-section--${slide.id}`.trim()}>
            <div className="presentation-slide-shell-surface">
              <div className="presentation-slide-header">
                <div className="export-section-title">
                  <p className="export-meta-label">Slide {index + 1}</p>
                  <h3>{slide.title}</h3>
                </div>
                <div className="presentation-slide-headline">{slide.headline}</div>
              </div>
              <div className="presentation-slide-body">
                {slide.signalStrip?.length ? (
                  <div className="presentation-signal-strip">
                    {slide.signalStrip.map((item) => (
                      <SignalCard
                        key={`${slide.id}-${item.label}`}
                        title={item.label}
                        strength={item.value}
                        insight="Signal state active."
                        tag="confirmation"
                        className="presentation-signal-chip"
                      />
                    ))}
                  </div>
                ) : null}
                {index === totalSlides - 1 ? (
                  <DecisionBox headline={slide.headline} actions={slide.bullets} className="presentation-final-decision-box" />
                ) : (
                  <ul className="presentation-slide-bullets">
                    {slide.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </PresentationSlideFrame>
      ))}
    </>
  );
}
