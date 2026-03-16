import { describe, expect, it, vi } from "vitest";
import { readUrlState, writeUrlState } from "./urlState";

describe("url state", () => {
  it("round-trips sandbox draft and saved scenarios", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        pathname: "/",
        search: "",
      },
      history: {
        replaceState,
      },
    });

    writeUrlState({
      scenario: "capital-fragmentation",
      compareScenario: "supply-chain-realignment",
      role: "Sandbox",
      sandboxDraft: [
        { eventId: "A10", mode: "remove", delayMonths: 2, strengthMultiplier: 0.55 },
      ],
      sandboxSaved: [
        {
          id: "scenario-1",
          name: "Stress Case",
          operations: [{ eventId: "A12", mode: "delay", delayMonths: 2, strengthMultiplier: 0.55 }],
        },
      ],
      sandboxSelectedId: "scenario-1",
    });

    const calledUrl = replaceState.mock.calls[0]?.[2] as string;
    const query = calledUrl.split("?")[1] ?? "";
    vi.stubGlobal("window", {
      location: {
        pathname: "/",
        search: `?${query}`,
      },
      history: {
        replaceState,
      },
    });

    const state = readUrlState();
    expect(state.scenario).toBe("capital-fragmentation");
    expect(state.compareScenario).toBe("supply-chain-realignment");
    expect(state.role).toBe("Sandbox");
    expect(state.sandboxDraft?.[0]?.eventId).toBe("A10");
    expect(state.sandboxSaved?.[0]?.name).toBe("Stress Case");
    expect(state.sandboxSelectedId).toBe("scenario-1");
  });
});
