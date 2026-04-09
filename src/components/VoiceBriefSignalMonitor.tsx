import type { VoiceBriefIntelligence } from "../types/voiceBriefIntelligence";

export function VoiceBriefSignalMonitor({
  intelligence,
}: {
  intelligence?: VoiceBriefIntelligence;
}) {
  if (!intelligence?.intelligenceSchema) {
    return null;
  }

  return (
    <section className="surface-panel">
      <div className="mb-3">
        <p className="section-kicker">Signal Monitor</p>
        <p className="mt-1 text-sm text-muted">
          Key signals, risks, and triggers anchored to the bounded narrative world. Useful for operating review, committee prep, or classroom case discussion because the active watchlist stays explicit.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="surface-panel-subtle min-w-0 p-4">
          <p className="section-kicker">Key Signals</p>
          <div className="mt-3 grid gap-2 text-sm text-muted">
            {intelligence.intelligenceSchema.keySignals.slice(0, 3).map((signal) => (
              <div key={`${signal.label}-${signal.statement}`} className="surface-panel-subtle min-w-0 px-3 py-2">
                <p className="truncate text-[10px] uppercase tracking-[0.18em] text-muted">{signal.label}</p>
                <p className="mt-1 text-sm leading-5 text-ink">{signal.statement}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel-subtle min-w-0 p-4">
          <p className="section-kicker">Risks</p>
          <div className="mt-3 grid gap-2 text-sm text-muted">
            {intelligence.intelligenceSchema.risks.slice(0, 3).map((risk) => (
              <div key={`${risk.area}-${risk.statement}`} className="surface-panel-subtle min-w-0 px-3 py-2">
                <p className="truncate text-[10px] uppercase tracking-[0.18em] text-muted">{risk.area}</p>
                <p className="mt-1 text-sm leading-5 text-ink">{risk.statement}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel-subtle min-w-0 p-4">
          <p className="section-kicker">Triggers</p>
          <div className="mt-3 grid gap-2 text-sm text-muted">
            {intelligence.intelligenceSchema.triggers.slice(0, 3).map((trigger) => (
              <div key={trigger.statement} className="surface-panel-subtle min-w-0 px-3 py-2">
                <p className="text-sm leading-5 text-ink">{trigger.statement}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
