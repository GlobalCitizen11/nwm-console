export function SignalCard({
  title,
  insight,
  implication,
  strength,
  tag,
  children,
  className = "",
}: {
  title: string;
  insight: string;
  implication?: string;
  strength: string;
  tag?: "risk" | "shift" | "confirmation";
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`signal-card ${tag ? `signal-card--${tag}` : ""} ${className}`.trim()}>
      <div className="signal-card-header">
        <p className="signal-card-title">{title}</p>
        {tag ? <span className="signal-card-tag">{tag}</span> : null}
      </div>
      <div className="signal-card-strength">{strength}</div>
      <p className="signal-card-insight">{insight}</p>
      {implication ? <p className="signal-card-implication">{implication}</p> : null}
      {children}
    </section>
  );
}
