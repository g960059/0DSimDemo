import { describe, expect, it } from "vitest";

import {
  assertFlatNumericalStateShapeV1,
  createFlatNumericalStateLayoutV1,
} from "@/engine/vnext/FlatNumericalStateV1";

describe("FlatNumericalStateV1", () => {
  it("owns a deterministic flat layout and rejects topology drift", () => {
    const state = Object.freeze({
      clock: 0,
      active: true,
      label: "baseline",
      secondaryLabel: "fixed",
      nested: Object.freeze({ values: new Float64Array([1, 2, 3]) }),
      optional: null,
    });
    const layout = createFlatNumericalStateLayoutV1("test-layout", state);

    expect(layout.continuousSlots.map(({ pointer }) => pointer)).toEqual([
      "/clock",
      "/nested/values/0",
      "/nested/values/1",
      "/nested/values/2",
    ]);
    expect(() => assertFlatNumericalStateShapeV1(
      layout,
      { ...state, nested: { values: new Float64Array([1, 2]) } },
    )).toThrow("/nested/values changed typed-array shape");
  });

  it("rejects accessors without invoking them", () => {
    let calls = 0;
    const state = Object.defineProperty({ clock: 0 }, "hidden", {
      enumerable: true,
      get() {
        calls += 1;
        return 1;
      },
    });
    expect(() => createFlatNumericalStateLayoutV1("accessor", state))
      .toThrow("is an accessor");
    expect(calls).toBe(0);
  });
});
