import type { ExportSemanticData } from "../../types/export";
import { KPIStrip } from "../modules/KPIStrip";

export function BoardOnePagerSystemStrip({ data }: { data: ExportSemanticData }) {
  return <KPIStrip stats={data.systemStats.slice(0, 4)} className="board-kpi-strip board-kpi-strip--compact" />;
}
