import { SectionHeader } from "./SectionHeader";

export function SectionTitle({ label, title, subtitle }: { label?: string; title: string; subtitle?: string }) {
  return <SectionHeader className="export-section-title" label={label} title={title} subtitle={subtitle} />;
}
