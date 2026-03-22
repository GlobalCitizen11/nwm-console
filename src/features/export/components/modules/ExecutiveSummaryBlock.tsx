import { ContextPanel } from "./ContextPanel";

export function ExecutiveSummaryBlock({ text }: { text: string }) {
  return <ContextPanel className="summary-panel" label="Executive summary" title="Top-line interpretation" text={text} />;
}
