import type { ExportStat } from "../../types/export";
import { StatPill } from "../primitives/StatPill";

export function KPIStat({ stat }: { stat: ExportStat }) {
  return <StatPill label={stat.label} value={stat.value} support={stat.support} status={stat.status} />;
}
