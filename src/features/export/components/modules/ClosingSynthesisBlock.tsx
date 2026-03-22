import { ContextPanel } from "./ContextPanel";

export function ClosingSynthesisBlock({ text }: { text: string }) {
  return <ContextPanel label="Closing Synthesis" title="Executive conclusion" text={text} />;
}
