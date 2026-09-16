import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkpointMainWireFiveWallCoupledPredictorV1 as checkpoint,
  createMainWireFiveWallCoupledPredictorWorkspaceV1 as create,
  reportMainWireFiveWallCoupledPredictorV1 as report,
  restoreMainWireFiveWallCoupledPredictorV1 as restore,
  tryRestoreEmptyMainWireFiveWallCoupledPredictorV1 as restoreEmpty,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledPredictorV1";
import { createScaledPassiveIdentityV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { MAIN_WIRE_FIVE_WALL_IDS_V1 } from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import { sanitizeForStableHash, stableHash } from "@/engine/integrity/stableHash";
import * as hashes from "@/engine/integrity/stableHash";
import { selectValidationStampModeV1, validationStampModeV1 } from "@/engine/validationStampModeV1";

const mode = validationStampModeV1();
afterEach(() => { vi.restoreAllMocks(); selectValidationStampModeV1(mode); });
const accepted = { revision: 7, acceptedTimeSec: .014, unknownsMl: new Float64Array(30).fill(1) };
function populated() {
  const workspace = create();
  restore({ ...checkpoint(workspace), historyDepth: 2,
    expectedBaseRevision: accepted.revision, expectedBaseAcceptedTimeSec: accepted.acceptedTimeSec,
    previousAcceptedMl: new Array(30).fill(.9), currentAcceptedMl: new Array(30).fill(1),
  }, accepted, workspace);
  return workspace;
}

describe("TBV sweep computation without changing continuation", () => {
  it("restores empty history exactly, including reports and serialized scratch", () => {
    const original = populated(), fast = populated(), empty = checkpoint(create());
    restore(empty, accepted, original);
    expect(restoreEmpty(empty, fast)).toBe(true);
    expect(checkpoint(fast)).toEqual(checkpoint(original));
    expect(report(fast)).toEqual(report(original));
    // Reusing the same proof in a different owner must still clear that owner.
    const other = populated();
    expect(restoreEmpty(empty, other)).toBe(true);
    expect(checkpoint(other)).toEqual(checkpoint(original));
    expect(report(other)).toEqual(report(original));
  });

  it("leaves nonempty histories to the clock/root-validated restore", () => {
    const workspace = populated(), before = checkpoint(workspace);
    expect(restoreEmpty(before, workspace)).toBe(false);
    expect(checkpoint(workspace)).toEqual(before);
    expect(() => restore(before, { ...accepted, revision: 8 }, workspace)).toThrow(/clock differs/);
  });

  it("rejects malformed empty histories before mutating an owner", () => {
    const workspace = populated(), before = checkpoint(workspace), empty = checkpoint(create());
    for (const input of [
      { ...empty, schemaVersion: 3 }, { ...empty, expectedBaseRevision: 0 },
      { ...empty, extra: true }, { ...empty, currentAcceptedMl: [0] },
      { ...empty, currentAcceptedMl: new Array(30).fill(1) },
      { ...empty, currentAcceptedMl: new Array(30).fill(NaN) },
      Object.defineProperty({ ...empty }, "oldestAcceptedMl", { get: () => { throw new Error("getter invoked"); } }),
    ]) {
      expect(() => restoreEmpty(input, workspace)).toThrow();
      expect(checkpoint(workspace)).toEqual(before);
    }
    const getter = vi.fn(() => 0);
    expect(restoreEmpty(Object.defineProperty({}, "historyDepth", { get: getter }), workspace)).toBe(false);
    expect(getter).not.toHaveBeenCalled();
    for (const input of [null, undefined, 0, "", []]) expect(restoreEmpty(input, workspace)).toBe(false);
  });

  it.each([false, true])("never caches a mutable descendant (frozen root: %s)", frozen => {
    const input = { ...checkpoint(create()), currentAcceptedMl: new Array(30).fill(0) };
    if (frozen) Object.freeze(input);
    const workspace = populated();
    expect(restoreEmpty(input, workspace)).toBe(true);
    input.currentAcceptedMl[0] = 1;
    expect(() => restoreEmpty(input, workspace)).toThrow(/not canonical/);
  });

  it("reuses only immutable proofs and honors full verification mode", () => {
    selectValidationStampModeV1("validation-stamps-enabled");
    const empty = checkpoint(create()), workspace = create();
    expect(restoreEmpty(empty, workspace)).toBe(true);
    const keys = vi.spyOn(Reflect, "ownKeys");
    restoreEmpty(empty, workspace);
    expect(keys).not.toHaveBeenCalled();
    selectValidationStampModeV1("validation-stamps-disabled");
    restoreEmpty(empty, workspace);
    expect(keys).toHaveBeenCalledWith(empty);
  });

  it("reuses scaled identities while keeping source, wall, and scale distinct", () => {
    for (const wallId of MAIN_WIRE_FIVE_WALL_IDS_V1) {
      for (const scale of [.25, 1, 1.5, 3]) {
        const identity = createScaledPassiveIdentityV1(scale, wallId);
        for (const sourceParameterIdentityHash of ["", "source-a", "source-a", "source-b", "source-a"]) {
          expect(identity(sourceParameterIdentityHash)).toBe(stableHash(sanitizeForStableHash({
            sourceParameterIdentityHash, wallId, equilibriumPassiveScale: scale,
          })));
        }
      }
    }
  });

  it("does not serialize/hash the same constitutive identity on each trial", () => {
    const hash = vi.spyOn(hashes, "stableHash");
    const identity = createScaledPassiveIdentityV1(1.5, "LVFW");
    const initial = identity("source-a");
    for (let trial = 0; trial < 100; trial++) expect(identity("source-a")).toBe(initial);
    expect(hash).toHaveBeenCalledTimes(1);
    identity("source-b");
    expect(hash).toHaveBeenCalledTimes(2);
    expect(identity("source-a")).toBe(initial);
    expect(hash).toHaveBeenCalledTimes(3);
  });
});
