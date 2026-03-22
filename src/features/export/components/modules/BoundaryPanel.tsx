import { ContextPanel } from "./ContextPanel";

export function BoundaryPanel({ boundary }: { boundary: string }) {
  return <ContextPanel className="boundary-panel" label="Bounded world" title="Boundary definition" text={boundary} />;
}
