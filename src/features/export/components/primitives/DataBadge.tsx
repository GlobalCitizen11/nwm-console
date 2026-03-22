export function DataBadge({ children, tone = "neutral" }: { children: string; tone?: "neutral" | "attention" | "stable" }) {
  return <span className={`export-badge export-badge--${tone}`}>{children}</span>;
}
