export function StatPill({
  label,
  value,
  support,
  status = "neutral",
}: {
  label: string;
  value: string;
  support?: string;
  status?: "neutral" | "attention" | "stable";
}) {
  return (
    <div className={`export-stat-pill export-stat-pill--${status}`}>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      {support ? <span className="support">{support}</span> : null}
    </div>
  );
}
