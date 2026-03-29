export function StatusChip({
  label,
  value,
  tone = "default",
  className = "",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning";
  className?: string;
}) {
  return (
    <div className={`status-chip status-chip--${tone} ${className}`.trim()}>
      <span className="status-chip-label">{label}</span>
      <strong className="status-chip-value">{value}</strong>
    </div>
  );
}
