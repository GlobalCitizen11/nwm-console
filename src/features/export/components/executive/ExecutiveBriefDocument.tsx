import type { ExecutiveBriefContent } from "../../types/export";
import { ExportPage } from "../primitives/ExportPage";
import { ExportHeader } from "../primitives/ExportHeader";

export function ExecutiveBriefDocument({ content }: { content: ExecutiveBriefContent }) {
  const totalPages = content.sections.length;

  return (
    <>
      {content.sections.map((section, index) => (
        <ExportPage
          key={section.id}
          metadata={{
            scenarioName: content.title,
            boundedWorld: content.boundedWorld,
            phase: content.systemStrip[0]?.value ?? "Unknown",
            asOf: content.replayMonth,
            generatedAt: content.timestamp,
            confidentiality: content.confidentialityLabel,
            currentViewName: "Executive Brief",
          }}
          pageNumber={index + 1}
          totalPages={totalPages}
          className="executive-brief-page"
        >
          {index === 0 ? (
            <ExportHeader
              title={content.title}
              subtitle={`${content.boundedWorld} | ${content.replayMonth}`}
              metadata={{
                scenarioName: content.title,
                boundedWorld: content.boundedWorld,
                phase: content.systemStrip[0]?.value ?? "Unknown",
                asOf: content.replayMonth,
                generatedAt: content.timestamp,
                confidentiality: content.confidentialityLabel,
                currentViewName: "Executive Brief",
              }}
              modeLabel="Executive Brief"
            />
          ) : null}
          {index === 0 ? (
            <section className="compact-signal-strip">
              {content.systemStrip.map((item) => (
                <div key={item.label} className="compact-signal-box">
                  <span className="compact-signal-label">{item.label}</span>
                  <strong className="compact-signal-value">{item.value}</strong>
                </div>
              ))}
            </section>
          ) : null}
          <section className="executive-brief-section">
            <div className="export-section-title">
              <h3>{section.title}</h3>
            </div>
            <div className="executive-page-grid">
              <div className="executive-page-main">
                <div className="executive-brief-prose">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul className="executive-evidence-list">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
              <aside className="executive-page-rail">
                <section className="executive-signal-module">
                  <p className="executive-signal-label">{section.insightCard.label}</p>
                  <h4 className="executive-signal-value">{section.insightCard.value}</h4>
                  {section.insightCard.support ? <p className="executive-signal-support">{section.insightCard.support}</p> : null}
                </section>
              </aside>
            </div>
          </section>
        </ExportPage>
      ))}
    </>
  );
}
