import type { ExportSemanticData } from "../../types/export";
import { StrategicImplicationBlock } from "../modules/StrategicImplicationBlock";

export function BoardOnePagerImplications({ data }: { data: ExportSemanticData }) {
  return <StrategicImplicationBlock title="Strategic implications" insights={data.implications.slice(0, 3)} label="Implications" />;
}
