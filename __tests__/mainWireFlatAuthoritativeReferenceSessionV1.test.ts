import { describe, expect, it } from "vitest";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  projectMainWireIntegratedModelSelectedValuesV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  createMainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  limitMainWireIntegratedModelCandidateTimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  decodeCanonicalFlatCheckpointV1,
  decodeCanonicalFlatDataV1,
  encodeCanonicalFlatCheckpointV1,
  encodeCanonicalFlatDataIntoV1,
  measureCanonicalFlatDataV1,
} from "@/engine/vnext/CanonicalFlatDataV1";
import {
  FlatAcceptedStateAuthorityV1,
} from "@/engine/vnext/FlatAcceptedStateAuthorityV1";
import {
  MainWireFlatAuthoritativeReferenceSessionV1,
} from "@/engine/vnext/MainWireFlatAuthoritativeReferenceSessionV1";
import {
  limitMainWireAcceptedTypedCandidateTimeV1,
  readMainWireAcceptedTypedClockV1,
} from "@/engine/vnext/MainWireAcceptedTypedBoundaryV1";
import {
  createMainWireAcceptedTypedStateManifestV1,
} from "@/engine/vnext/MainWireAcceptedTypedStateV1";
import {
  createTransactionalScalarSlotManifestV1,
  TransactionalScalarSlotsV1,
} from "@/engine/vnext/TransactionalScalarSlotsV1";
import {
  createTransactionalTypedStateManifestV1,
  TransactionalTypedStateImageV1,
} from "@/engine/vnext/TransactionalTypedStateImageV1";

describe("CanonicalFlatDataV1", () => {
  it("owns one canonical encoding without invoking accessors", async () => {
    const first = Object.freeze({
      z: Object.freeze([true, null, "循環"]),
      a: new Float64Array([0, -0, 1.25]),
      nested: Object.freeze({ count: 3 }),
    });
    const second = Object.freeze({
      nested: Object.freeze({ count: 3 }),
      a: new Float64Array([0, -0, 1.25]),
      z: Object.freeze([true, null, "循環"]),
    });
    const length = measureCanonicalFlatDataV1(first);
    const firstBytes = new Uint8Array(length);
    const secondBytes = new Uint8Array(length);
    expect(encodeCanonicalFlatDataIntoV1(first, firstBytes)).toBe(length);
    expect(encodeCanonicalFlatDataIntoV1(second, secondBytes)).toBe(length);
    expect(firstBytes).toEqual(secondBytes);
    expect(() => decodeCanonicalFlatDataV1(
      new Uint8Array([...firstBytes, 0]),
    )).toThrow("trailing bytes");
    const duplicateKey = new Uint8Array(64);
    const duplicateLength = encodeCanonicalFlatDataIntoV1(
      Object.freeze({ a: 1, b: 2 }),
      duplicateKey,
    );
    const lastB = duplicateKey.lastIndexOf("b".charCodeAt(0));
    expect(lastB).toBeGreaterThan(0);
    duplicateKey[lastB] = "a".charCodeAt(0);
    expect(() => decodeCanonicalFlatDataV1(duplicateKey, duplicateLength))
      .toThrow("not strictly ordered");
    const decoded = decodeCanonicalFlatDataV1(firstBytes) as typeof first;
    expect(decoded.z).toEqual(first.z);
    expect(decoded.a).toEqual(first.a);
    expect(Object.is(decoded.a[1], -0)).toBe(true);
    expect(Object.isFrozen(decoded)).toBe(true);
    expect(Object.isFrozen(decoded.z)).toBe(true);

    const checkpoint = await encodeCanonicalFlatCheckpointV1(first);
    expect(await decodeCanonicalFlatCheckpointV1(checkpoint)).toEqual(decoded);
    const tampered = checkpoint.slice();
    tampered[tampered.length - 1] ^= 1;
    await expect(decodeCanonicalFlatCheckpointV1(tampered))
      .rejects.toThrow("SHA-256 mismatch");

    let getterCalls = 0;
    const accessor = Object.defineProperty({}, "value", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 1;
      },
    });
    expect(() => measureCanonicalFlatDataV1(accessor)).toThrow("is an accessor");
    expect(getterCalls).toBe(0);
  });
});

describe("FlatAcceptedStateAuthorityV1", () => {
  it("keeps the accepted buffer atomic and poisons a failed candidate", () => {
    type State = Readonly<{ value: string }>;
    const validate = (candidate: unknown): State => {
      if (
        typeof candidate !== "object"
        || candidate === null
        || Object.keys(candidate).join(",") !== "value"
        || typeof (candidate as State).value !== "string"
      ) {
        throw new Error("state is invalid");
      }
      return candidate as State;
    };
    const authority = new FlatAcceptedStateAuthorityV1<State>(
      Object.freeze({ value: "accepted" }),
      validate,
      64,
    );
    expect(authority.commit(Object.freeze({ value: "next" }))).toEqual({
      value: "next",
    });
    expect(authority.report()).toMatchObject({
      activeBufferIndex: 1,
      commitCount: 1,
    });
    const before = authority.snapshotCurrentBytes();
    expect(() => authority.commit(Object.freeze({ value: "x".repeat(100) })))
      .toThrow("is poisoned");
    expect(authority.report()).toMatchObject({
      commitCount: 1,
      currentLengthBytes: before.byteLength,
      fixedBufferCount: 2,
      poisonedReason: expect.stringContaining("fixed capacity"),
    });
    expect(() => authority.current()).toThrow("is poisoned");
  });
});

describe("TransactionalScalarSlotsV1", () => {
  it("stages into the inactive buffer and promotes atomically", () => {
    type State = Readonly<{
      value: number;
      enabled: boolean;
      diagnostic: string;
      pending: readonly number[];
    }>;
    const initial: State = Object.freeze({
      value: 1,
      enabled: false,
      diagnostic: "initial",
      pending: Object.freeze([]),
    });
    const manifest = createTransactionalScalarSlotManifestV1(
      "test-scalar-layout",
      initial,
    );
    const slots = new TransactionalScalarSlotsV1(manifest, initial);
    expect(slots.report()).toMatchObject({
      continuousSlotCount: 1,
      booleanSlotCount: 1,
      excludedDynamicRootCount: 1,
      excludedStringSlotCount: 1,
      commitCount: 0,
      staged: false,
    });
    const before = slots.snapshot();
    const candidate: State = Object.freeze({
      value: 2,
      enabled: true,
      diagnostic: "next",
      pending: Object.freeze([3]),
    });
    slots.stage(candidate);
    expect(slots.snapshot()).toEqual(before);
    expect(slots.report().staged).toBe(true);
    slots.abort();
    expect(slots.snapshot()).toEqual(before);
    slots.stage(candidate);
    slots.promote();
    expect(slots.snapshot()).toEqual({
      continuous: new Float64Array([2]),
      booleans: new Uint8Array([1]),
    });
    expect(slots.report()).toMatchObject({ commitCount: 1, staged: false });
    slots.assertCurrentMatches(candidate);

    expect(() => slots.stage(Object.freeze({
      ...candidate,
      value: Number.NaN,
    }))).toThrow("must be finite");
    expect(slots.snapshot()).toEqual({
      continuous: new Float64Array([2]),
      booleans: new Uint8Array([1]),
    });
  });
});

describe("TransactionalTypedStateImageV1", () => {
  it("round-trips all leaf classes and keeps failed candidates inactive", () => {
    type State = Readonly<{
      value: number;
      enabled: boolean;
      label: string;
      fixed: Readonly<{ samples: Float64Array }>;
      optional: Readonly<{ count: number }> | null;
      queue: readonly Readonly<{ id: string; at: number }>[];
    }>;
    const initial: State = Object.freeze({
      value: 1,
      enabled: false,
      label: "initial",
      fixed: Object.freeze({ samples: new Float64Array([2, 3]) }),
      optional: null,
      queue: Object.freeze([]),
    });
    const manifest = createTransactionalTypedStateManifestV1(
      "test-typed-state",
      initial,
      32,
      128,
    );
    const image = new TransactionalTypedStateImageV1(manifest, initial);
    const cursor = image.currentCursor();
    const valueSlot = manifest.numericalLayout.continuousSlots.findIndex(
      ({ pointer }) => pointer === "/value",
    );
    const labelSlot = manifest.numericalLayout.stringSlots.findIndex(
      ({ pointer }) => pointer === "/label",
    );
    const optionalSlot = manifest.numericalLayout.excludedDynamicRoots.findIndex(
      ({ pointer }) => pointer === "/optional",
    );
    const queueSlot = manifest.numericalLayout.excludedDynamicRoots.findIndex(
      ({ pointer }) => pointer === "/queue",
    );
    expect(cursor.readContinuous(valueSlot)).toBe(1);
    expect(cursor.readBoolean(0)).toBe(false);
    expect(cursor.readString(labelSlot)).toBe("initial");
    expect(cursor.readDynamic(optionalSlot)).toBeNull();
    expect(cursor.readDynamic(queueSlot)).toEqual([]);
    expect(image.rehydrateCurrent()).toEqual(initial);
    expect(image.report()).toMatchObject({
      continuousSlotCount: 3,
      booleanSlotCount: 1,
      stringSlotCount: 1,
      dynamicRootCount: 2,
      fixedImageCount: 2,
      commitCount: 0,
      staged: false,
    });

    const candidate: State = Object.freeze({
      value: 4,
      enabled: true,
      label: "next",
      fixed: Object.freeze({ samples: new Float64Array([5, 6]) }),
      optional: Object.freeze({ count: 7 }),
      queue: Object.freeze([Object.freeze({ id: "impulse-1", at: 0.25 })]),
    });
    image.stage(candidate);
    expect(cursor.readContinuous(valueSlot)).toBe(1);
    expect(cursor.readString(labelSlot)).toBe("initial");
    expect(image.rehydrateCurrent()).toEqual(initial);
    expect(image.rehydrateStaged()).toEqual(candidate);
    image.promote();
    expect(image.currentCursor()).toBe(cursor);
    expect(cursor.readContinuous(valueSlot)).toBe(4);
    expect(cursor.readBoolean(0)).toBe(true);
    expect(cursor.readString(labelSlot)).toBe("next");
    const escapedOptional = cursor.readDynamic(optionalSlot) as { count: number };
    expect(escapedOptional).toEqual({ count: 7 });
    expect(() => cursor.readContinuous(-1)).toThrow("slot index is invalid");
    expect(image.rehydrateCurrent()).toEqual(candidate);
    expect(image.report()).toMatchObject({ commitCount: 1, staged: false });

    const escaped = image.snapshot();
    escaped.continuous[0] = 99;
    escaped.stringBytes[0] = 0;
    expect(image.rehydrateCurrent()).toEqual(candidate);

    expect(() => image.stage(Object.freeze({
      ...candidate,
      unexpected: 1,
    }) as State)).toThrow("changed record shape");
    expect(image.rehydrateCurrent()).toEqual(candidate);
    expect(image.report().staged).toBe(false);

    const extendedSamples = new Float64Array([5, 6]);
    Object.defineProperty(extendedSamples, "unexpected", {
      enumerable: true,
      value: 1,
    });
    expect(() => image.stage(Object.freeze({
      ...candidate,
      fixed: Object.freeze({ samples: extendedSamples }),
    }))).toThrow("changed typed-array shape");
    expect(image.rehydrateCurrent()).toEqual(candidate);

    const alternatePrototype = Object.create(null) as { constructor: ObjectConstructor };
    alternatePrototype.constructor = Object;
    const foreignFixed = Object.create(alternatePrototype) as {
      samples: Float64Array;
    };
    foreignFixed.samples = new Float64Array([5, 6]);
    Object.freeze(foreignFixed);
    expect(() => image.stage(Object.freeze({
      ...candidate,
      fixed: foreignFixed,
    }))).toThrow("changed record prototype");
    expect(image.rehydrateCurrent()).toEqual(candidate);

    expect(() => image.stage(Object.freeze({
      ...candidate,
      label: "bad\ud800",
    }))).toThrow("unpaired surrogate");
    expect(image.rehydrateCurrent()).toEqual(candidate);
    expect(image.report().staged).toBe(false);

    expect(() => image.stage(Object.freeze({
      ...candidate,
      queue: Object.freeze(Array.from({ length: 20 }, (_, index) =>
        Object.freeze({ id: `impulse-${index}`, at: index / 10 }))),
    }))).toThrow("dynamic arena capacity exceeded");
    expect(image.rehydrateCurrent()).toEqual(candidate);
    expect(image.report()).toMatchObject({ commitCount: 1, staged: false });
  });
});

describe("MainWireFlatAuthoritativeReferenceSessionV1", () => {
  it("matches the admitted object limiter from direct typed boundary slots", async () => {
    const runtime = await createMainWireIntegratedModelRuntimeV3();
    const oracle = await MainWireIntegratedModelSessionV3.create();
    for (let tick = 1; tick <= 96; tick += 1) {
      const state = oracle.currentAcceptedState();
      const image = new TransactionalTypedStateImageV1(
        createMainWireAcceptedTypedStateManifestV1(
          runtime.cold.acceptedState,
        ),
        state,
      );
      const cursor = image.currentCursor();
      expect(readMainWireAcceptedTypedClockV1(cursor)).toEqual({
        acceptedTimeSec: state.acceptedTimeSec,
        revision: state.revision,
      });
      const target = mainWireIntegratedModelPresentationTargetTimeSecV3(tick);
      const actual = limitMainWireAcceptedTypedCandidateTimeV1(
        cursor,
        target,
        null,
      );
      const expected = limitMainWireIntegratedModelCandidateTimeV3(
        state,
        target,
        {
          configuration: runtime.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
        },
        runtime.profile,
        runtime.config,
      );
      expect(actual).toEqual(expected);
      expect(oracle.advanceToPresentationTime(target).status).toBe("advanced");
    }
  }, 30_000);

  it("forbids continuation after a post-solver authority failure", async () => {
    let commitCalls = 0;
    let poisoned = false;
    const session = await MainWireFlatAuthoritativeReferenceSessionV1
      .createWithAcceptedStateAuthorityForTestV1(
        (initial) => {
          let current = initial;
          return Object.freeze({
            current: () => {
              if (poisoned) throw new Error("injected authority is poisoned");
              return current;
            },
            snapshot: () => current,
            commit: (candidate: typeof initial) => {
              current = candidate;
              commitCalls += 1;
              poisoned = true;
              throw new Error("injected candidate commit failed");
            },
          });
        },
      );
    const target = mainWireIntegratedModelPresentationTargetTimeSecV3(1);
    expect(() => session.advanceToPresentationTime(target))
      .toThrow("injected candidate commit failed");
    expect(commitCalls).toBe(1);
    expect(session.scalarSlotsReport()).toMatchObject({
      commitCount: 0,
      staged: false,
    });
    expect(() => session.advanceToPresentationTime(target))
      .toThrow("injected authority is poisoned");
    expect(commitCalls).toBe(1);
  });

  it("uses fixed typed-state authority for 1,024 ticks without scientific drift", async () => {
    const reference = await MainWireFlatAuthoritativeReferenceSessionV1.create();
    const oracle = await MainWireIntegratedModelSessionV3.create();
    const initialReport = reference.authorityReport();
    expect(initialReport).toMatchObject({
      authorityId: "main-wire-integrated-accepted-typed-state-authority-v1",
      fingerprint: "fnv1a32-9657ecbf",
      bufferByteLength: 267_668,
      fixedImageCount: 2,
      continuousSlotCount: 440,
      booleanSlotCount: 4,
      stringSlotCount: 205,
      dynamicRootCount: 45,
      containerCount: 158,
      commitCount: 0,
      poisonedReason: null,
    });
    expect(reference.scalarSlotsReport()).toMatchObject({
      fingerprint: "fnv1a32-8c218aa1",
      continuousSlotCount: 440,
      booleanSlotCount: 4,
      excludedDynamicRootCount: 45,
      excludedStringSlotCount: 205,
      containerCount: 158,
      commitCount: 0,
      staged: false,
    });
    const escapedScalarSlots = reference.snapshotScalarSlots();
    const scalarBefore = escapedScalarSlots.continuous[0]!;
    escapedScalarSlots.continuous[0] = scalarBefore + 10_000;
    expect(reference.snapshotScalarSlots().continuous[0]).toBe(scalarBefore);
    const escapedState = reference.currentAcceptedState();
    const escapedTypedArray = firstFloat64Array(escapedState);
    if (escapedTypedArray === null || escapedTypedArray.length === 0) {
      throw new Error("accepted state contains no Float64Array");
    }
    const authoritativeValue = escapedTypedArray[0]!;
    escapedTypedArray[0] = authoritativeValue + 10_000;
    expect(firstFloat64Array(reference.currentAcceptedState())?.[0])
      .toBe(authoritativeValue);

    let sawCompletedBeat = false;
    for (let tick = 1; tick <= 1_024; tick += 1) {
      const target = mainWireIntegratedModelPresentationTargetTimeSecV3(tick);
      const actual = reference.advanceToPresentationTime(target);
      const expected = oracle.advanceToPresentationTime(target);
      expect(actual.status).toBe("advanced");
      expect(expected.status).toBe("advanced");
      if (actual.status !== "advanced" || expected.status !== "advanced") {
        throw new Error(`reference or oracle failed at tick ${tick}`);
      }
      expect(actual.acceptedRevision).toBe(expected.acceptedRevision);
      expect(projectMainWireIntegratedModelSelectedValuesV3(
        actual.observation,
        MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
      )).toEqual(projectMainWireIntegratedModelSelectedValuesV3(
        expected.observation,
        MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
      ));
      sawCompletedBeat ||= actual.observation.completedBeatMetrics !== null;
    }

    const finalReport = reference.authorityReport();
    expect(finalReport.commitCount).toBeGreaterThanOrEqual(1_024);
    expect(finalReport.highWaterStringBytes).toBeLessThanOrEqual(
      finalReport.stringArenaCapacityBytes,
    );
    expect(finalReport.highWaterDynamicBytes).toBeLessThanOrEqual(
      finalReport.dynamicArenaCapacityBytes,
    );
    expect(finalReport.poisonedReason).toBeNull();
    expect(reference.scalarSlotsReport()).toMatchObject({
      commitCount: finalReport.commitCount,
      staged: false,
    });
    expect(decodeCanonicalFlatDataV1(reference.snapshotAcceptedStateBytes()))
      .toEqual(reference.currentAcceptedState());
    expect(sawCompletedBeat).toBe(true);
    const completedBeatRestore =
      await MainWireFlatAuthoritativeReferenceSessionV1.restoreCanonicalBinary(
        await reference.checkpointCanonicalBinary(),
      );
    expect(completedBeatRestore.observe().completedBeatMetrics)
      .toEqual(reference.observe().completedBeatMetrics);
  }, 120_000);

  it("restores a tamper-evident binary checkpoint with exact continuation", async () => {
    const source = await MainWireFlatAuthoritativeReferenceSessionV1.create();
    for (let tick = 1; tick <= 377; tick += 1) {
      const result = source.advanceToPresentationTime(
        mainWireIntegratedModelPresentationTargetTimeSecV3(tick),
      );
      expect(result.status).toBe("advanced");
    }
    const first = await source.checkpointCanonicalBinary();
    const second = await source.checkpointCanonicalBinary();
    expect(first).toEqual(second);
    const restored =
      await MainWireFlatAuthoritativeReferenceSessionV1
        .restoreCanonicalBinary(first);
    expect(restored.currentAcceptedState()).toEqual(source.currentAcceptedState());

    for (let tick = 378; tick <= 544; tick += 1) {
      const target = mainWireIntegratedModelPresentationTargetTimeSecV3(tick);
      const expected = source.advanceToPresentationTime(target);
      const actual = restored.advanceToPresentationTime(target);
      expect(actual).toEqual(expected);
    }
    expect(restored.authorityReport()).toMatchObject({
      fixedImageCount: 2,
      poisonedReason: null,
    });

    const tampered = first.slice();
    tampered[20] ^= 0x80;
    await expect(
      MainWireFlatAuthoritativeReferenceSessionV1.restoreCanonicalBinary(
        tampered,
      ),
    ).rejects.toThrow("SHA-256 mismatch");
  }, 120_000);
});

function firstFloat64Array(value: unknown): Float64Array | null {
  if (value instanceof Float64Array) return value;
  if (value === null || typeof value !== "object") return null;
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
    if (!("value" in descriptor)) continue;
    const nested = firstFloat64Array(descriptor.value);
    if (nested !== null) return nested;
  }
  return null;
}
