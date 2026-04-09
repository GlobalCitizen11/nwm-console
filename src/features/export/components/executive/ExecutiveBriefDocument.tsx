import type { ReactNode } from "react";
import type { ExecutiveBriefContent } from "../../types/export";
import { getAdjudicationStatusDisplay, getPhaseResolutionReasonDisplay, SYSTEM_LABELS } from "../../../../lib/systemLabels";
import { ExportPage } from "../primitives/ExportPage";
import { StatusChip } from "../primitives/StatusChip";

function ExecutivePanel({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="executive-reset-panel">
      <div className="executive-reset-panel-topline">
        <span className="executive-reset-panel-label">{label}</span>
        <h2 className="executive-reset-panel-title">{title}</h2>
        <span className="executive-reset-panel-rule" />
      </div>
      <div className="executive-reset-panel-body">{children}</div>
    </section>
  );
}

function MetricGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`} className="surface-panel-subtle p-4">
          <p className="section-kicker">{item.label}</p>
          <p className="mt-2 text-sm text-ink">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function TextList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="surface-panel-subtle p-4">
      <p className="section-kicker">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-ink">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function MappingTable({
  rows,
}: {
  rows: ExecutiveBriefContent["v2"]["artifactStateMapping"];
}) {
  return (
    <div className="surface-panel-subtle overflow-hidden p-0">
      <table className="w-full border-collapse text-left text-sm text-ink">
        <thead>
          <tr className="border-b border-edge">
            <th className="px-4 py-3 font-medium text-muted">Artifact</th>
            <th className="px-4 py-3 font-medium text-muted">Primary Function</th>
            <th className="px-4 py-3 font-medium text-muted">State Effect</th>
            <th className="px-4 py-3 font-medium text-muted">Interpretive Role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.artifactId} className="border-b border-edge/70 align-top">
              <td className="px-4 py-3">{row.artifact}</td>
              <td className="px-4 py-3 text-muted">{row.primaryFunction}</td>
              <td className="px-4 py-3 text-muted">{row.stateEffect}</td>
              <td className="px-4 py-3 text-muted">{row.interpretiveRole}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExecutiveBriefDocument({ content }: { content: ExecutiveBriefContent }) {
  const metadata = {
    scenarioName: content.title,
    boundedWorld: content.boundedWorld,
    phase: content.v2.phaseResolution.phase,
    asOf: content.replayMonth,
    generatedAt: content.timestamp,
    confidentiality: content.confidentialityLabel,
    currentViewName: "Executive Brief",
  };

  const { phaseResolution, preGcsSensitivity, stateVector } = content.v2;
  const adjudicationStatus = getAdjudicationStatusDisplay(phaseResolution.adjudicationStatus);
  const phaseResolutionReason = getPhaseResolutionReasonDisplay(phaseResolution.rationale);
  const normalizedPreGcsReason = getPhaseResolutionReasonDisplay(preGcsSensitivity.reason);
  const preGcsReason = normalizedPreGcsReason.endsWith(".")
    ? normalizedPreGcsReason
    : `${normalizedPreGcsReason}.`;
  const visibleMappings = content.v2.artifactStateMapping.slice(0, 6);
  const visibleSpine = content.v2.temporalSpine.slice(0, 5);

  return (
    <>
      <ExportPage metadata={metadata} pageNumber={1} totalPages={3} className="executive-brief-page executive-brief-page--reset">
        <header className="executive-reset-document-header">
          <div className="executive-reset-document-header-topline">
            <p className="executive-reset-document-kicker">Executive Brief</p>
            <div className="executive-reset-document-meta">
              <StatusChip label="Phase" value={phaseResolution.phase} tone="accent" />
              <StatusChip label={SYSTEM_LABELS.PAL} value={adjudicationStatus} tone="accent" />
              <StatusChip label="Confidence" value={stateVector.confidence.toFixed(1)} />
              <StatusChip label="Basis" value={stateVector.basis} />
            </div>
          </div>

          <div className="executive-reset-document-header-main">
            <div className="executive-reset-document-copy">
              <h1 className="executive-reset-document-title">{content.title}</h1>
              <p className="executive-reset-document-subtitle">{content.v2.boundedWorldDefinition}</p>
            </div>
            <div className="executive-reset-document-stats">
              <div className="executive-reset-header-stat">
                <span>Replay month</span>
                <strong>{content.replayMonth}</strong>
              </div>
              <div className="executive-reset-header-stat">
                <span>Bounded world</span>
                <strong>{content.boundedWorld}</strong>
              </div>
              <div className="executive-reset-header-stat">
                <span>Proof status</span>
                <strong>Pre-governance-grade</strong>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5">
          <ExecutivePanel label="Section 1" title="Bounded World Definition">
            <p className="executive-reset-paragraph">{content.v2.boundedWorldDefinition}</p>
          </ExecutivePanel>

          <ExecutivePanel label="Section 2" title="Artifact Set Summary">
            <p className="executive-reset-paragraph">{content.v2.artifactSetSummary}</p>
          </ExecutivePanel>

          <ExecutivePanel label="Section 3" title="System State Overview">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <p className="executive-reset-paragraph">{content.spec.systemStateOverview.currentConditionParagraph.value}</p>
                <p className="executive-reset-paragraph">{content.spec.systemStateOverview.meaningParagraph.value}</p>
              </div>
              <MetricGrid
                items={[
                  { label: "Velocity", value: stateVector.velocity.toFixed(1) },
                  { label: "Density", value: stateVector.density.toFixed(1) },
                  { label: "Coherence", value: stateVector.coherence.toFixed(1) },
                  { label: "Reversibility", value: stateVector.reversibility.toFixed(1) },
                  { label: "Confidence", value: stateVector.confidence.toFixed(1) },
                  { label: "Basis", value: stateVector.basis },
                ]}
              />
            </div>
          </ExecutivePanel>
        </section>
      </ExportPage>

      <ExportPage metadata={metadata} pageNumber={2} totalPages={3} className="executive-brief-page executive-brief-page--reset">
        <section className="grid gap-5">
          <ExecutivePanel label="Section 4" title="Narrative Development">
            <div className="space-y-3">
              <p className="executive-reset-paragraph">{content.spec.narrativeDevelopment.earlySignalsParagraph.value}</p>
              <p className="executive-reset-paragraph">{content.spec.narrativeDevelopment.systemicUptakeParagraph.value}</p>
              <p className="executive-reset-paragraph">{content.spec.narrativeDevelopment.currentConditionParagraph.value}</p>
            </div>
          </ExecutivePanel>

          <ExecutivePanel label="Section 5" title="Temporal Spine">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleSpine.map((entry) => (
                <div key={entry.id} className="surface-panel-subtle p-4">
                  <p className="section-kicker">{entry.label}</p>
                  <p className="mt-2 text-sm text-ink">{entry.summary}</p>
                  <p className="mt-2 text-xs text-muted">
                    Month {entry.month} | Phase {entry.phase} | Effect {entry.structuralEffect}
                  </p>
                </div>
              ))}
            </div>
          </ExecutivePanel>

          <div className="grid gap-5 xl:grid-cols-2">
            <ExecutivePanel label="Section 6" title={`Phase and ${SYSTEM_LABELS.PAL} Status`}>
              <div className="space-y-3">
                <p className="executive-reset-paragraph">
                  Current phase <strong>{phaseResolution.phase}</strong> is resolved as{" "}
                  <strong>{adjudicationStatus}</strong>. This remains threshold-driven adjudication rather than a full
                  institutional {` ${SYSTEM_LABELS.PAL}`}.
                </p>
                <p className="executive-reset-paragraph">{phaseResolutionReason}</p>
              </div>
              <TextList title="Threshold Conditions" items={phaseResolution.thresholdConditions.slice(0, 4)} />
            </ExecutivePanel>

            <ExecutivePanel label="Section 7" title="Forward Orientation">
              <div className="space-y-3">
                <p className="executive-reset-paragraph">{content.spec.forwardOrientation.primaryPathParagraph.value}</p>
                <p className="executive-reset-paragraph">{content.spec.forwardOrientation.alternatePathParagraph.value}</p>
              </div>
            </ExecutivePanel>
          </div>
        </section>
      </ExportPage>

      <ExportPage metadata={metadata} pageNumber={3} totalPages={3} className="executive-brief-page executive-brief-page--reset">
        <section className="grid gap-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <ExecutivePanel label="Section 8" title="Traceability Summary">
              <p className="executive-reset-paragraph">{content.v2.traceabilitySummary}</p>
            </ExecutivePanel>

            <ExecutivePanel label="Section 9" title="Proof-Object Summary">
              <p className="executive-reset-paragraph">{content.v2.proofSummary}</p>
              <TextList
                title="Proof Scaffold Status"
                items={[
                  "Proof status is pre-governance-grade.",
                  "Linked transitions remain visible through the proof scaffold.",
                  "Oversight state remains explicit in audit-facing output.",
                ]}
              />
            </ExecutivePanel>
          </div>

          <ExecutivePanel label="Section 10" title="Artifact to State Mapping">
            <MappingTable rows={visibleMappings} />
          </ExecutivePanel>

          <ExecutivePanel label="Section 11" title="Pre-GCS Sensitivity">
            <div className="grid gap-4 xl:grid-cols-2">
              <TextList title="Primary Sensitivities" items={preGcsSensitivity.primarySensitivities} />
              <TextList title="Counterweight Conditions" items={preGcsSensitivity.counterweightConditions} />
              <TextList title="Non-Effect Zones" items={preGcsSensitivity.nonEffectZones} />
              <TextList title="Reversibility Constraints" items={preGcsSensitivity.reversibilityConstraints} />
            </div>
            <p className="mt-4 text-sm text-muted">
              {preGcsReason} This layer is provisional and remains separate from replay, projection, and
              counterfactual mutation.
            </p>
          </ExecutivePanel>
        </section>
      </ExportPage>
    </>
  );
}
