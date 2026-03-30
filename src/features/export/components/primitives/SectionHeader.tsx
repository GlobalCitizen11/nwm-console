export function SectionHeader({
  label,
  title,
  subtitle,
  className = "",
}: {
  label?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`artifact-section-header ${className}`.trim()}>
      {label ? <p className="artifact-kicker">{label}</p> : null}
      <h3 className="artifact-section-title">{title}</h3>
      {subtitle ? <p className="artifact-section-subtitle">{subtitle}</p> : null}
    </div>
  );
}
