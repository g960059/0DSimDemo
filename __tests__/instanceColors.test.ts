import { describe, expect, it } from "vitest";
import { INSTANCE_COLORS, pickDistinctInstanceColor } from "@/features/workbench/workbenchDefaults";

const [PURPLE, GREEN, AMBER, CYAN, PINK] = INSTANCE_COLORS;

describe("pickDistinctInstanceColor", () => {
  it("returns the first unused palette color", () => {
    expect(pickDistinctInstanceColor([PURPLE])).toBe(GREEN);
    expect(pickDistinctInstanceColor([PURPLE, GREEN])).toBe(AMBER);
  });

  it("hands a duplicate a different color than its source (purple -> green)", () => {
    // Duplicating Heart A (purple): purple is in use AND is the avoidColor.
    expect(pickDistinctInstanceColor([PURPLE], PURPLE)).toBe(GREEN);
  });

  it("matches used colors case-insensitively", () => {
    expect(pickDistinctInstanceColor([PURPLE.toUpperCase()])).toBe(GREEN);
  });

  it("is deletion-order independent — fills the freed slot", () => {
    // green was deleted; the freed green slot is reused before later colors.
    expect(pickDistinctInstanceColor([PURPLE, AMBER, CYAN, PINK])).toBe(GREEN);
  });

  it("falls back to a distinct, non-source color once the palette is exhausted", () => {
    const all = [...INSTANCE_COLORS];
    const picked = pickDistinctInstanceColor(all, PURPLE);
    // Must NOT collapse to INSTANCE_COLORS[0]/source, and must be a real palette color.
    expect(picked).not.toBe(PURPLE);
    expect(INSTANCE_COLORS).toContain(picked);
  });

  it("never returns the avoided source color even when all colors are used", () => {
    for (const source of INSTANCE_COLORS) {
      expect(pickDistinctInstanceColor(INSTANCE_COLORS, source)).not.toBe(source);
    }
  });
});
