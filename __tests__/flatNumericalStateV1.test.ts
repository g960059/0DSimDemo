import { describe, expect, it } from "vitest";

import {
  createFlatNumericalStateBufferV1,
  createFlatNumericalStateLayoutV1,
  createFlatNumericalStringTableV1,
  writeFlatNumericalStateV1,
} from "@/engine/vnext/FlatNumericalStateV1";

describe("FlatNumericalStateV1", () => {
  it("owns a deterministic flat layout and keeps a failed write atomic", () => {
    const state = Object.freeze({
      clock: 0,
      active: true,
      label: "baseline",
      secondaryLabel: "fixed",
      nested: Object.freeze({ values: new Float64Array([1, 2, 3]) }),
      optional: null,
    });
    const layout = createFlatNumericalStateLayoutV1("test-layout", state);
    const table = createFlatNumericalStringTableV1();
    const buffer = createFlatNumericalStateBufferV1(layout);
    writeFlatNumericalStateV1(layout, state, buffer, table);
    const before = {
      continuous: buffer.continuous.slice(),
      booleans: buffer.booleans.slice(),
      strings: buffer.strings.slice(),
    };

    expect(layout.continuousSlots.map(({ pointer }) => pointer)).toEqual([
      "/clock",
      "/nested/values/0",
      "/nested/values/1",
      "/nested/values/2",
    ]);
    expect(() => writeFlatNumericalStateV1(
      layout,
      { ...state, nested: { values: new Float64Array([1, Number.NaN, 3]) } },
      buffer,
      table,
    )).toThrow("/nested/values/1 must be finite");
    expect(buffer.continuous).toEqual(before.continuous);
    expect(buffer.booleans).toEqual(before.booleans);
    expect(buffer.strings).toEqual(before.strings);
    const stringTableBefore = [...table.valuesByCode];
    expect(() => writeFlatNumericalStateV1(
      layout,
      { ...state, label: "changed", secondaryLabel: 4 },
      buffer,
      table,
    )).toThrow("/secondaryLabel must be a string");
    expect(table.valuesByCode).toEqual(stringTableBefore);
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
