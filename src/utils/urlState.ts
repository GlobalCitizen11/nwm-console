import type { CounterfactualScenario, NamedCounterfactualScenario } from "../types";

export interface AppUrlState {
  scenario?: string;
  compareScenario?: string | null;
  role?: string;
  presentation?: boolean;
  month?: number;
  event?: string | null;
  transition?: string | null;
  guide?: boolean;
  guideExpanded?: boolean;
  sandboxDraft?: CounterfactualScenario;
  sandboxSaved?: NamedCounterfactualScenario[];
  sandboxSelectedId?: string | null;
}

export const readUrlState = (): AppUrlState => {
  const params = new URLSearchParams(window.location.search);
  const sandboxDraftRaw = params.get("sandboxDraft");
  const sandboxSavedRaw = params.get("sandboxSaved");

  return {
    scenario: params.get("scenario") ?? undefined,
    compareScenario: params.get("compareScenario"),
    role: params.get("role") ?? undefined,
    presentation: params.get("presentation") === "1",
    month: params.get("month") ? Number(params.get("month")) : undefined,
    event: params.get("event"),
    transition: params.get("transition"),
    guide: params.get("guide") === "1",
    guideExpanded: params.get("guideExpanded") !== "0",
    sandboxDraft: sandboxDraftRaw ? (JSON.parse(sandboxDraftRaw) as CounterfactualScenario) : [],
    sandboxSaved: sandboxSavedRaw ? (JSON.parse(sandboxSavedRaw) as NamedCounterfactualScenario[]) : [],
    sandboxSelectedId: params.get("sandboxSelectedId"),
  };
};

export const writeUrlState = (state: AppUrlState) => {
  const params = new URLSearchParams();

  if (state.role) {
    params.set("role", state.role);
  }
  if (state.scenario) {
    params.set("scenario", state.scenario);
  }
  if (state.presentation) {
    params.set("presentation", "1");
  }
  if (state.compareScenario) {
    params.set("compareScenario", state.compareScenario);
  }
  if (state.month !== undefined) {
    params.set("month", String(state.month));
  }
  if (state.event) {
    params.set("event", state.event);
  }
  if (state.transition) {
    params.set("transition", state.transition);
  }
  if (state.guide) {
    params.set("guide", "1");
  }
  if (state.guideExpanded === false) {
    params.set("guideExpanded", "0");
  }
  if (state.sandboxDraft && state.sandboxDraft.length > 0) {
    params.set("sandboxDraft", JSON.stringify(state.sandboxDraft));
  }
  if (state.sandboxSaved && state.sandboxSaved.length > 0) {
    params.set("sandboxSaved", JSON.stringify(state.sandboxSaved));
  }
  if (state.sandboxSelectedId) {
    params.set("sandboxSelectedId", state.sandboxSelectedId);
  }

  const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  window.history.replaceState({}, "", next);
};
