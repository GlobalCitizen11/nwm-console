export function InsightRailCard({
  label,
  value,
  support,
  className = "",
}: {
  label: string;
  value: string;
  support?: string;
  className?: string;
}) {
  return (
    <section className={`insight-rail-card ${className}`.trim()}>
      <p className="insight-rail-card-label">{label}</p>
      <h4 className="insight-rail-card-value">{value}</h4>
      {support ? <p className="insight-rail-card-support">{support}</p> : null}
    </section>
  );
}
