import { ContextPanel } from "./ContextPanel";

export function ExecutiveSummaryBlock({ text }: { text: string }) {
  return <ContextPanel label="Executive Summary" title="Top-line interpretation" text={text} />;
}
