import { describe, expect, it } from "vitest";
import { resolveControllerTargetId } from "@/features/workbench/controllerBinding";
import type { SimInstance } from "@/types";

const instances = [
  { id: "a", name: "A", color: "#a855f7", params: {} as SimInstance["params"], targetVolume: 5000, isVisible: true },
  { id: "b", name: "B", color: "#22c55e", params: {} as SimInstance["params"], targetVolume: 5000, isVisible: true },
] satisfies SimInstance[];

describe("resolveControllerTargetId", () => {
  it("keeps active-slot controller views bound to the active scenario", () => {
    expect(resolveControllerTargetId({ kind: "active" }, "b", instances)).toBe("b");
  });

  it("uses an explicit scenario binding when the scenario exists", () => {
    expect(resolveControllerTargetId({ kind: "scenario", scenarioId: "a" }, "b", instances)).toBe("a");
  });

  it("falls back to active when an explicit scenario binding is missing or absent", () => {
    expect(resolveControllerTargetId({ kind: "scenario", scenarioId: "missing" }, "b", instances)).toBe("b");
    expect(resolveControllerTargetId(undefined, "b", instances)).toBe("b");
  });

  it("falls back to the first scenario when the active id is not present", () => {
    expect(resolveControllerTargetId({ kind: "active" }, "missing", instances)).toBe("a");
  });
});
