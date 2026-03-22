import type { ExportStat } from "../../types/export";
import { KPIStat } from "./KPIStat";

export function KPIStrip({ stats, className = "" }: { stats: ExportStat[]; className?: string }) {
  return (
    <div className={`kpi-strip ${className}`.trim()}>
      {stats.map((stat) => (
        <KPIStat key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
