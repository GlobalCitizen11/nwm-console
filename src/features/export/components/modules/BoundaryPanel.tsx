import { ContextPanel } from "./ContextPanel";

export function BoundaryPanel({ boundary }: { boundary: string }) {
  return <ContextPanel label="Bounded World" title="Boundary definition" text={boundary} />;
}
