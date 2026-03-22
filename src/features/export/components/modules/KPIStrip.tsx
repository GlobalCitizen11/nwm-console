import type { ExportStat } from "../../types/export";
import { KPIStat } from "./KPIStat";

export function KPIStrip({ stats }: { stats: ExportStat[] }) {
  return (
    <div className="kpi-strip">
      {stats.map((stat) => (
        <KPIStat key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
