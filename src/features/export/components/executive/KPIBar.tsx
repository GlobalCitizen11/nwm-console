import type { ExportStat } from "../../types/export";
import { KPIStrip } from "../modules/KPIStrip";

export function KPIBar({ stats, className = "" }: { stats: ExportStat[]; className?: string }) {
  return <KPIStrip stats={stats} className={className} />;
}
