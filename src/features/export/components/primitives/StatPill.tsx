export function StatPill({ label, value, status = "neutral" }: { label: string; value: string; status?: "neutral" | "attention" | "stable" }) {
  return (
    <div className={`export-stat-pill export-stat-pill--${status}`}>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}
