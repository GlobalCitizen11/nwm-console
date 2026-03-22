import { Panel } from "../primitives/Panel";
import { SectionTitle } from "../primitives/SectionTitle";

export function ContextPanel({ title, text, label, className = "" }: { title: string; text: string; label?: string; className?: string }) {
  return (
    <Panel className={`context-panel ${className}`.trim()}>
      <SectionTitle label={label} title={title} />
      <p>{text}</p>
    </Panel>
  );
}
