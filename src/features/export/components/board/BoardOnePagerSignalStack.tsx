import type { ExportSemanticData } from "../../types/export";

const findStat = (data: ExportSemanticData, label: string, fallback: string) =>
  data.systemStats.find((stat) => stat.label === label)?.value ?? fallback;

export function BoardOnePagerSignalStack({ data }: { data: ExportSemanticData }) {
  const dominantPath = data.scenarioPaths[0]?.headline ?? data.sourceState.primaryPath;
  const primaryPressure = data.sourceState.pressurePoints[0] ?? "Pressure remains concentrated inside the active boundary.";

  const items = [
    { label: "Phase", value: data.metadata.phase },
    { label: "Density", value: findStat(data, "Narrative Density", data.sourceState.narrativeDensity) },
    { label: "Momentum", value: findStat(data, "Structural Momentum", data.sourceState.structuralMomentum) },
    { label: "Reversibility", value: findStat(data, "Reversibility", data.sourceState.reversibility) },
    { label: "Dominant path", value: dominantPath, support: "Continuation if the present trajectory holds." },
    { label: "Primary pressure", value: primaryPressure, support: "Most active source of current constraint." },
  ];

  return (
    <aside className="board-signal-stack">
      {items.map((item) => (
        <section key={item.label} className="board-signal-module">
          <p className="signal-module-label">{item.label}</p>
          <h4 className="signal-module-value">{item.value}</h4>
          {item.support ? <p className="signal-module-support">{item.support}</p> : null}
        </section>
      ))}
    </aside>
  );
}
