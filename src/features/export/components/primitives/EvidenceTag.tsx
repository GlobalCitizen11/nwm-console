export function EvidenceTag({ code, className = "" }: { code: string; className?: string }) {
  return <span className={`evidence-tag ${className}`.trim()}>{code}</span>;
}
