import { afterEach, describe, expect, it, vi } from "vitest";
import * as original from "@/engine/validationStampModeV1";
import { isTransitivelyFrozenPlainDataV1 as prove, validationStampIssuanceEligibleV1 as eligible }
  from "@/engine/immutableValidationProofV1";

const initialMode = original.validationStampModeV1();
afterEach(() => { original.selectValidationStampModeV1(initialMode); vi.restoreAllMocks(); });

describe("candidate immutable proof reuse", () => {
  it("reuses complete roots and descendants without another traversal", () => {
    original.selectValidationStampModeV1("validation-stamps-enabled");
    const child = Object.freeze({ pressure: 1 }), root = Object.freeze({ child });
    const inspect = vi.spyOn(Reflect, "ownKeys");
    expect(prove(root)).toBe(true);
    const count = inspect.mock.calls.length;
    expect(count).toBe(2);
    expect(prove(root)).toBe(true);
    expect(prove(child)).toBe(true);
    expect(eligible(root, child, null, 1)).toBe(true);
    expect(inspect).toHaveBeenCalledTimes(count);
    original.selectValidationStampModeV1("validation-stamps-disabled");
    expect(eligible(root)).toBe(false);
    expect(prove(root)).toBe(true);
    expect(prove(root)).toBe(true);
    expect(inspect).toHaveBeenCalledTimes(count + 4);
  });

  it("never blesses a partial cyclic graph or shallow-frozen mutable children", () => {
    const child: Record<string, unknown> = {}, root = Object.freeze({ child, invalid: () => 1 });
    child.parent = root; Object.freeze(child);
    expect(prove(root)).toBe(false);
    expect(prove(child)).toBe(false);
    const mutable = { pressure: 1 }, outer = Object.freeze({ mutable });
    expect(prove(outer)).toBe(false);
    mutable.pressure = 2;
    expect(prove(outer)).toBe(false);
    Object.freeze(mutable);
    expect(prove(outer)).toBe(true);
  });

  it.each(["validation-stamps-enabled", "validation-stamps-disabled"] as const)(
    "matches the original graph contract in %s", mode => {
      original.selectValidationStampModeV1(mode);
      let getters = 0;
      const accessor = Object.freeze({ get value() { getters++; return 1; } });
      const cycle: Record<string, unknown> = {}; cycle.self = cycle; Object.freeze(cycle);
      const values = [null, undefined, 1, NaN, Infinity, -0, "心臓", true, Symbol("x"), 1n,
        () => 1, Object.freeze(() => 1), {}, [], Object.freeze([, 1]), cycle, accessor,
        Object.freeze({ value: Object.freeze([1, null]) }), Object.freeze(Object.create(null)),
        Object.freeze(new Date(0)), Object.freeze(new Map()),
        Object.freeze(Object.create(Object.freeze({ x: 1 }))),
        Object.freeze(Object.defineProperty({}, "hidden", { value: { mutable: 1 } })),
        Object.freeze({ [Symbol("hidden")]: Object.freeze({ x: 1 }) })];
      for (const value of values) {
        const expected = original.isTransitivelyFrozenPlainDataV1(value);
        expect(prove(value)).toBe(expected);
        expect(prove(value)).toBe(expected);
        expect(eligible(value)).toBe(mode === "validation-stamps-enabled" && expected);
      }
      expect(getters).toBe(0);
    });
});
