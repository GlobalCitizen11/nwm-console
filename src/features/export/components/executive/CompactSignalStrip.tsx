import type { ExportSemanticData } from "../../types/export";

const pick = (data: ExportSemanticData, label: string, fallback: string) =>
  data.systemStats.find((stat) => stat.label === label)?.value ?? fallback;

export function CompactSignalStrip({ data }: { data: ExportSemanticData }) {
  const items = [
    { label: "Phase", value: data.metadata.phase },
    { label: "Density", value: pick(data, "Narrative Density", data.sourceState.narrativeDensity) },
    { label: "Momentum", value: pick(data, "Structural Momentum", data.sourceState.structuralMomentum) },
    { label: "Reversibility", value: pick(data, "Reversibility", data.sourceState.reversibility) },
  ];

  return (
    <section className="compact-signal-strip">
      {items.map((item) => (
        <div key={item.label} className="compact-signal-box">
          <span className="compact-signal-label">{item.label}</span>
          <strong className="compact-signal-value">{item.value}</strong>
        </div>
      ))}
    </section>
  );
}
