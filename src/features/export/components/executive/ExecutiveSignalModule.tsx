export function ExecutiveSignalModule({
  label,
  value,
  support,
}: {
  label: string;
  value: string;
  support?: string;
}) {
  return (
    <aside className="executive-signal-module">
      <p className="executive-signal-label">{label}</p>
      <h4 className="executive-signal-value">{value}</h4>
      {support ? <p className="executive-signal-support">{support}</p> : null}
    </aside>
  );
}
