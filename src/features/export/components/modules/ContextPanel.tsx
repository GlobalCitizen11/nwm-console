import { Panel } from "../primitives/Panel";
import { SectionTitle } from "../primitives/SectionTitle";

export function ContextPanel({ title, text, label }: { title: string; text: string; label?: string }) {
  return (
    <Panel>
      <SectionTitle label={label} title={title} />
      <p>{text}</p>
    </Panel>
  );
}
