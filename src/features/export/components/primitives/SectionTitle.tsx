export function SectionTitle({ label, title, subtitle }: { label?: string; title: string; subtitle?: string }) {
  return (
    <div className="export-section-title">
      {label ? <p className="export-meta-label">{label}</p> : null}
      <h3>{title}</h3>
      {subtitle ? <p className="export-subtitle">{subtitle}</p> : null}
    </div>
  );
}
