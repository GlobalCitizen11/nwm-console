import { useEffect, useMemo, useState } from "react";
import type { NarrativeEvent } from "../types";

interface ArtifactIngressRibbonProps {
  events: NarrativeEvent[];
  currentMonth: number;
}

const sourceLabel: Record<NarrativeEvent["sourceType"], string> = {
  policy: "POLICY",
  media: "MEDIA",
  market: "MARKET",
  legal: "LEGAL",
  infrastructure: "INFRA",
  sovereign: "SOVEREIGN",
};

const effectLabel: Record<NarrativeEvent["structuralEffect"], string> = {
  reinforce: "REINFORCE",
  destabilize: "DESTABILIZE",
  reclassify: "RECLASSIFY",
};

const effectClass: Record<NarrativeEvent["structuralEffect"], string> = {
  reinforce: "text-phaseYellow",
  destabilize: "text-phaseOrange",
  reclassify: "text-phaseRed",
};

const labelEffectClass: Record<NarrativeEvent["structuralEffect"], string> = {
  reinforce: "artifact-ribbon-label-yellow",
  destabilize: "artifact-ribbon-label-orange",
  reclassify: "artifact-ribbon-label-red",
};

const pageSize = 3;
const desktopMinimumRotation = 20;

export function ArtifactIngressRibbon({ events, currentMonth }: ArtifactIngressRibbonProps) {
  const visibleArtifacts = useMemo(
    () =>
      events
        .filter((event) => event.month <= currentMonth)
        .sort((left, right) => left.month - right.month || left.title.localeCompare(right.title)),
    [currentMonth, events],
  );

  const newestArtifactId = visibleArtifacts[visibleArtifacts.length - 1]?.id ?? null;
  const newestArtifact = visibleArtifacts[visibleArtifacts.length - 1] ?? null;
  const [mobilePage, setMobilePage] = useState(0);

  const mobilePages = Math.max(1, Math.ceil(visibleArtifacts.length / pageSize));

  useEffect(() => {
    setMobilePage(0);
  }, [currentMonth]);

  useEffect(() => {
    if (mobilePages <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setMobilePage((value) => (value + 1) % mobilePages);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [mobilePages]);

  const mobileArtifacts = visibleArtifacts.slice(mobilePage * pageSize, mobilePage * pageSize + pageSize);
  const desktopRepeatCount =
    visibleArtifacts.length > 0 ? Math.max(2, Math.ceil(desktopMinimumRotation / visibleArtifacts.length)) : 0;
  const desktopArtifacts =
    visibleArtifacts.length > 0
      ? Array.from({ length: desktopRepeatCount }, () => visibleArtifacts).flat()
      : [];
  const animationDuration = `${Math.max(28, desktopArtifacts.length * 2.4)}s`;
  const labelClass = newestArtifact ? labelEffectClass[newestArtifact.structuralEffect] : "artifact-ribbon-label-neutral";

  return (
    <section className="border-b border-edge/80 bg-shell/90">
      <div className="mx-auto max-w-[1600px] px-4 py-2">
        <div className="hidden items-center gap-3 md:flex">
          <div className="artifact-ribbon-label shrink-0">
            <span className={labelClass}>Artifact Ingress</span>
            <span className="text-muted">filtered to M{currentMonth}</span>
          </div>
          {visibleArtifacts.length > 0 ? (
            <div className="artifact-ribbon-track">
              <div
                className="artifact-ribbon-marquee"
                style={{ ["--artifact-ribbon-duration" as string]: animationDuration }}
              >
                {desktopArtifacts.map((artifact, index) => (
                  <div
                    key={`${artifact.id}-${index}`}
                    className={`artifact-ribbon-item ${
                      artifact.id === newestArtifactId && index % Math.max(1, visibleArtifacts.length) === visibleArtifacts.length - 1
                        ? "artifact-ribbon-item-latest"
                        : ""
                    }`}
                  >
                    <span className="artifact-ribbon-month">M{artifact.month}</span>
                    <span className="artifact-ribbon-source">{sourceLabel[artifact.sourceType]}</span>
                    <span className="artifact-ribbon-title">{artifact.title}</span>
                    <span className={`artifact-ribbon-effect ${effectClass[artifact.structuralEffect]}`}>
                      {effectLabel[artifact.structuralEffect]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="artifact-ribbon-empty">No artifacts are visible at the current replay month.</div>
          )}
        </div>

        <div className="md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="artifact-ribbon-label">
              <span className={labelClass}>Artifact Ingress</span>
              <span className="text-muted">M{currentMonth}</span>
            </div>
            {mobilePages > 1 ? (
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
                Page {mobilePage + 1} / {mobilePages}
              </div>
            ) : null}
          </div>
          <div className="mt-2 grid gap-2">
            {(mobileArtifacts.length > 0 ? mobileArtifacts : [null]).map((artifact, index) =>
              artifact ? (
                <div
                  key={artifact.id}
                  className={`artifact-mobile-card ${artifact.id === newestArtifactId ? "artifact-mobile-card-latest" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-muted">
                    <span>M{artifact.month}</span>
                    <span>{sourceLabel[artifact.sourceType]}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-ink">{artifact.title}</p>
                  <p className={`mt-1 text-[10px] uppercase tracking-[0.16em] ${effectClass[artifact.structuralEffect]}`}>
                    {effectLabel[artifact.structuralEffect]}
                  </p>
                </div>
              ) : (
                <div key={`empty-${index}`} className="artifact-mobile-card text-sm text-muted">
                  No artifacts are visible at the current replay month.
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
