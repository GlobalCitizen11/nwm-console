import { ContextPanel } from "./ContextPanel";

export function ClosingSynthesisBlock({ text }: { text: string }) {
  return <ContextPanel className="closing-panel" label="Closing synthesis" title="Executive conclusion" text={text} />;
}
