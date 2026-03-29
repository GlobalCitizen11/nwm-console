export function DecisionBox({
  headline,
  actions,
  className = "",
}: {
  headline: string;
  actions: string[];
  className?: string;
}) {
  return (
    <section className={`decision-box ${className}`.trim()}>
      <div className="decision-box-shell">
        <div className="decision-box-header">
          <p className="export-meta-label">Action required</p>
          <h2 className="decision-box-headline">{headline}</h2>
        </div>
        <ul className="decision-box-actions">
          {actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
