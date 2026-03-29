import type { ReactNode } from "react";
import type { ExecutiveBriefContent } from "../../types/export";
import { ExportPage } from "../primitives/ExportPage";
import { StatusChip } from "../primitives/StatusChip";
import { EvidenceStrip } from "../primitives/EvidenceStrip";
import { InsightRailCard } from "../primitives/InsightRailCard";

function ExecutivePanel({
  label,
  title,
  toneClass,
  children,
}: {
  label: string;
  title: string;
  toneClass: string;
  children: ReactNode;
}) {
  return (
    <section className={`executive-reset-panel ${toneClass}`.trim()}>
      <div className="executive-reset-panel-topline">
        <span className="executive-reset-panel-label">{label}</span>
        <h2 className="executive-reset-panel-title">{title}</h2>
        <span className="executive-reset-panel-rule" />
      </div>
      <div className="executive-reset-panel-body">{children}</div>
    </section>
  );
}

function ExecutiveParagraphStack({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="executive-reset-paragraph-stack">
      {paragraphs.filter(Boolean).map((paragraph) => (
        <p key={paragraph} className="executive-reset-paragraph">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function ExecutiveSignalList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="executive-reset-signal-list">
      <p className="executive-reset-signal-title">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function ExecutiveNarrativeBlock({
  label,
  paragraph,
}: {
  label: string;
  paragraph: string;
}) {
  return (
    <div className="executive-reset-narrative-block">
      <div className="executive-reset-narrative-marker">{label}</div>
      <p>{paragraph}</p>
    </div>
  );
}

export function ExecutiveBriefDocument({ content }: { content: ExecutiveBriefContent }) {
  const { spec, fieldPack } = content;
  const metadata = {
    scenarioName: spec.header.scenarioName.value,
    boundedWorld: spec.header.boundedWorld.value,
    phase: spec.header.currentPhase.value,
    asOf: spec.header.asOfLabel.value,
    generatedAt: content.timestamp,
    confidentiality: content.confidentialityLabel,
    currentViewName: "Executive Brief",
  };

  const headerMeta = fieldPack.headerMeta.map((item) => ({
    key: item.label,
    value: item.value,
    tone: item.label === "Phase" ? ("accent" as const) : ("default" as const),
  }));

  return (
    <>
      <ExportPage metadata={metadata} pageNumber={1} totalPages={2} className="executive-brief-page executive-brief-page--reset executive-brief-page--reset-page1">
        <header className="executive-reset-document-header">
          <div className="executive-reset-document-header-topline">
            <p className="executive-reset-document-kicker">Executive Brief</p>
            <div className="executive-reset-document-meta">
              {headerMeta.map((item) => (
                <StatusChip key={`${item.key}-${item.value}`} label={item.key} value={item.value} tone={item.tone} />
              ))}
            </div>
          </div>

          <div className="executive-reset-document-header-main">
            <div className="executive-reset-document-copy">
              <h1 className="executive-reset-document-title">{spec.header.executiveHeadline.value}</h1>
              <p className="executive-reset-document-subtitle">{spec.header.executiveSubline.value}</p>
            </div>

            <div className="executive-reset-document-stats">
              <div className="executive-reset-header-stat">
                <span>Current phase</span>
                <strong>{spec.header.currentPhase.value}</strong>
              </div>
              <div className="executive-reset-header-stat">
                <span>As of</span>
                <strong>{spec.header.asOfLabel.value}</strong>
              </div>
              <div className="executive-reset-header-stat">
                <span>Bounded world</span>
                <strong>{spec.header.boundedWorld.value}</strong>
              </div>
            </div>
          </div>

          <div className="executive-reset-document-insights">
            {spec.systemStateOverview.sidebarInsight?.value ? (
              <InsightRailCard
                label="Operating read"
                value={spec.systemStateOverview.sidebarInsight.value}
                className="executive-reset-insight executive-reset-insight--system"
              />
            ) : null}
            <InsightRailCard
              label="Briefing frame"
              value={spec.header.boundedWorld.value}
              support={content.timestamp}
              className="executive-reset-insight executive-reset-insight--neutral"
            />
          </div>
        </header>

        <section className="executive-reset-spread executive-reset-spread--page1">
          <div className="executive-reset-page1-left">
            <ExecutivePanel
              label="Section 1"
              title={spec.systemStateOverview.sectionTitle.value}
              toneClass="is-system"
            >
              <ExecutiveParagraphStack
                paragraphs={[
                  spec.systemStateOverview.currentConditionParagraph.value,
                  spec.systemStateOverview.meaningParagraph.value,
                ]}
              />
            </ExecutivePanel>

            <ExecutivePanel
              label="Evidence"
              title={spec.evidenceBase.sectionTitle.value}
              toneClass="is-evidence"
            >
              <ExecutiveParagraphStack paragraphs={[spec.evidenceBase.intro.value]} />
              <EvidenceStrip
                items={spec.evidenceBase.items.value.map((item) => ({
                  id: item.code,
                  code: item.code,
                  text: `${item.signal} ${item.significance}`.trim(),
                }))}
                className="executive-reset-evidence"
              />
            </ExecutivePanel>
          </div>

          <ExecutivePanel
            label="Section 2"
            title={spec.narrativeDevelopment.sectionTitle.value}
            toneClass="is-narrative"
          >
            <div className="executive-reset-narrative-stack">
              <ExecutiveNarrativeBlock label="Early signals" paragraph={spec.narrativeDevelopment.earlySignalsParagraph.value} />
              <ExecutiveNarrativeBlock label="Systemic uptake" paragraph={spec.narrativeDevelopment.systemicUptakeParagraph.value} />
              <ExecutiveNarrativeBlock label="Current condition" paragraph={spec.narrativeDevelopment.currentConditionParagraph.value} />
            </div>
            {spec.narrativeDevelopment.sidebarInsight?.value ? (
              <InsightRailCard
                label="Narrative insight"
                value={spec.narrativeDevelopment.sidebarInsight.value}
                className="executive-reset-insight executive-reset-insight--narrative"
              />
            ) : null}
          </ExecutivePanel>
        </section>
      </ExportPage>

      <ExportPage metadata={metadata} pageNumber={2} totalPages={2} className="executive-brief-page executive-brief-page--reset executive-brief-page--reset-page2">
        <section className="executive-reset-closing">
          <div className="executive-reset-two-up executive-reset-two-up--page2">
            <ExecutivePanel
              label="Section 3"
              title={spec.structuralInterpretation.sectionTitle.value}
              toneClass="is-structural"
            >
              <ExecutiveParagraphStack
                paragraphs={[
                  spec.structuralInterpretation.interpretationParagraph1.value,
                  spec.structuralInterpretation.interpretationParagraph2?.value ?? "",
                ]}
              />
              {spec.structuralInterpretation.sidebarInsight?.value ? (
                <InsightRailCard
                  label="Structural read"
                  value={spec.structuralInterpretation.sidebarInsight.value}
                  className="executive-reset-insight executive-reset-insight--structural"
                />
              ) : null}
            </ExecutivePanel>

            <ExecutivePanel
              label="Section 4"
              title={spec.forwardOrientation.sectionTitle.value}
              toneClass="is-forward"
            >
              <ExecutiveParagraphStack
                paragraphs={[
                  spec.forwardOrientation.primaryPathParagraph.value,
                  spec.forwardOrientation.alternatePathParagraph.value,
                ]}
              />
              {spec.forwardOrientation.sidebarInsight?.value ? (
                <InsightRailCard
                  label="Path signal"
                  value={spec.forwardOrientation.sidebarInsight.value}
                  className="executive-reset-insight executive-reset-insight--forward"
                />
              ) : null}
            </ExecutivePanel>
          </div>

          <ExecutivePanel
            label="Section 5"
            title={spec.strategicPositioning.sectionTitle.value}
            toneClass="is-positioning"
          >
            <ExecutiveParagraphStack
              paragraphs={[
                spec.strategicPositioning.positioningParagraph1.value,
                spec.strategicPositioning.positioningParagraph2?.value ?? "",
              ]}
            />
            <div className="executive-reset-support-grid">
              <ExecutiveSignalList title="Priority Areas" items={spec.strategicPositioning.priorityAreas?.value ?? []} />
              <ExecutiveSignalList title="Sensitivity Points" items={spec.strategicPositioning.sensitivityPoints?.value ?? []} />
              <ExecutiveSignalList title="Visibility Needs" items={spec.strategicPositioning.visibilityNeeds?.value ?? []} />
            </div>
            {spec.strategicPositioning.sidebarInsight?.value ? (
              <InsightRailCard
                label="Positioning read"
                value={spec.strategicPositioning.sidebarInsight.value}
                className="executive-reset-insight executive-reset-insight--positioning"
              />
            ) : null}
          </ExecutivePanel>
        </section>
      </ExportPage>
    </>
  );
}
