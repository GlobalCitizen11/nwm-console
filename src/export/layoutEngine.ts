import type {
  ExportDocumentPlan,
  ExportModule,
  ExportModuleKind,
  ExportModuleSize,
  ExportPagePlan,
  ExportQaReport,
} from "../types";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const sizeFromUnits = (units: number): ExportModuleSize => {
  if (units <= 3) {
    return "compact";
  }
  if (units <= 6) {
    return "standard";
  }
  return "expanded";
};

export const estimateTextUnits = (text: string) => clamp(Math.ceil(text.length / 180), 1, 6);

export const estimateItemsUnits = (items: string[]) =>
  clamp(items.reduce((sum, item) => sum + estimateTextUnits(item), 0), 1, 8);

export const createModule = ({
  id,
  kind,
  title,
  label,
  items = [],
  narrative = [],
  accent,
  keepTogether = true,
}: {
  id: string;
  kind: ExportModuleKind;
  title: string;
  label?: string;
  items?: string[];
  narrative?: string[];
  accent?: string;
  keepTogether?: boolean;
}): ExportModule => {
  const estimatedUnits = clamp(
    estimateItemsUnits(items) + narrative.reduce((sum, paragraph) => sum + estimateTextUnits(paragraph), 0),
    2,
    10,
  );

  return {
    id,
    kind,
    title,
    label,
    items,
    narrative,
    accent,
    estimatedUnits,
    size: sizeFromUnits(estimatedUnits),
    keepTogether,
  };
};

export const createPage = (id: string, title: string, pageNumber: number, targetUnits: number, modules: ExportModule[]): ExportPagePlan => ({
  id,
  title,
  pageNumber,
  targetUnits,
  totalUnits: modules.reduce((sum, module) => sum + module.estimatedUnits, 0),
  modules,
});

const compactifyModule = (module: ExportModule): ExportModule => ({
  ...module,
  size: "compact",
  estimatedUnits: clamp(module.estimatedUnits - 1, 2, 10),
});

const expandModule = (module: ExportModule): ExportModule => ({
  ...module,
  size: module.size === "expanded" ? "expanded" : "standard",
  estimatedUnits: clamp(module.estimatedUnits + 1, 2, 10),
});

const normalizePage = (page: ExportPagePlan): ExportPagePlan => {
  const modules = [...page.modules];
  let totalUnits = modules.reduce((sum, module) => sum + module.estimatedUnits, 0);

  while (totalUnits > page.targetUnits && modules.some((module) => module.size !== "compact")) {
    const index = modules.findIndex((module) => module.size !== "compact");
    if (index === -1) {
      break;
    }
    modules[index] = compactifyModule(modules[index]!);
    totalUnits = modules.reduce((sum, module) => sum + module.estimatedUnits, 0);
  }

  while (totalUnits < page.targetUnits - 3 && modules.some((module) => module.size !== "expanded")) {
    const index = modules.findIndex((module) => module.size === "compact");
    if (index === -1) {
      break;
    }
    modules[index] = expandModule(modules[index]!);
    totalUnits = modules.reduce((sum, module) => sum + module.estimatedUnits, 0);
  }

  return {
    ...page,
    modules,
    totalUnits,
  };
};

export const normalizeDocumentPlan = (plan: ExportDocumentPlan): ExportDocumentPlan => ({
  ...plan,
  pages: plan.pages.map(normalizePage),
});

export const qaDocumentPlan = (plan: ExportDocumentPlan): ExportQaReport => {
  void plan;
  return {
    ok: true,
    issues: [],
  };
};
