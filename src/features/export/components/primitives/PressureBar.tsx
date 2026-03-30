export function PressureBar({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={`pressure-bar ${className}`.trim()} role="img" aria-label={`${label} ${clamped} of 100`}>
      <div className="pressure-bar-header">
        <span className="pressure-bar-label">{label}</span>
        <span className="pressure-bar-value">{clamped}</span>
      </div>
      <progress className="pressure-bar-track" max={100} value={clamped} />
    </div>
  );
}
