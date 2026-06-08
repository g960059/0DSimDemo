import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";

function finiteValues(record: Record<string, number>): boolean {
  return Object.values(record).every((value) => Number.isFinite(value));
}

describe("ModelCore state contract", () => {
  it("packs a finite serialized state with schema, hashes, time, vector, and phase", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.05, 0.001, 120);

    const snapshot = core.packState();

    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.modelVersion).toBe("0dsim-modelcore-v1");
    expect(snapshot.stateLayoutHash).toMatch(/^[0-9a-f]{8}$/);
    expect(snapshot.paramsHash).toMatch(/^[0-9a-f]{8}$/);
    expect(snapshot.targetParamsHash).toMatch(/^[0-9a-f]{8}$/);
    expect(Number.isFinite(snapshot.t)).toBe(true);
    expect(Number.isFinite(snapshot.phi)).toBe(true);
    expect(snapshot.x.length).toBeGreaterThan(0);
    expect(snapshot.x.every(Number.isFinite)).toBe(true);
  });

  it("round-trips through unpackState without changing comparable values", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.1, 0.001, 120);
    const snapshot = core.packState();
    const before = core.getComparableState();

    const restored = new ModelCore(DEFAULT_PARAMS);
    restored.unpackState(snapshot);
    const after = restored.getComparableState();

    expect(after.stateLayoutHash).toBe(before.stateLayoutHash);
    expect(after.paramsHash).toBe(before.paramsHash);
    for (const [key, value] of Object.entries(before.values)) {
      expect(after.values[key]).toBeCloseTo(value, 10);
    }
  });

  it("rejects schema and layout mismatches", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    const snapshot = core.packState();

    expect(() => core.unpackState({ ...snapshot, schemaVersion: 999 as 1 })).toThrow(/schema mismatch/);
    expect(() => core.unpackState({ ...snapshot, modelVersion: "other-model" as "0dsim-modelcore-v1" })).toThrow(/model version mismatch/);
    expect(() => core.unpackState({ ...snapshot, stateLayoutHash: "bad-layout" })).toThrow(/layout hash mismatch/);
  });

  it("rejects parameter hash mismatches unless explicitly allowed", () => {
    const source = new ModelCore(DEFAULT_PARAMS);
    const snapshot = source.packState();

    const differentParams = new ModelCore({ ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 5 });

    expect(() => differentParams.unpackState(snapshot)).toThrow(/params hash mismatch/);
    expect(() => differentParams.unpackState(snapshot, { allowParameterMismatch: true })).not.toThrow();
  });

  it("rejects invalid state vectors and inconsistent phase metadata", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    const snapshot = core.packState();

    expect(() => core.unpackState({ ...snapshot, x: snapshot.x.slice(1) })).toThrow(/vector size mismatch/);
    expect(() => core.unpackState({ ...snapshot, x: [Number.NaN, ...snapshot.x.slice(1)] })).toThrow(/finite number/);
    expect(() => core.unpackState({ ...snapshot, initialTBV: Number.POSITIVE_INFINITY })).toThrow(/finite number/);
    expect(() => core.unpackState({ ...snapshot, phi: snapshot.phi + 0.01 })).toThrow(/phi mismatch/);
  });

  it("returns a finite comparable state without advancing steady beat tracking", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.1, 0.001, 120);
    const beatsBefore = core.assessSteadyState().beats;

    const comparable = core.getComparableState();

    expect(finiteValues(comparable.values)).toBe(true);
    expect(Object.keys(comparable.values)).toContain("P.Ao");
    expect(Object.keys(comparable.values)).toContain("QAo");
    expect(Object.keys(comparable.values)).toContain("xi.MV");
    expect(core.assessSteadyState().beats).toBe(beatsBefore);
  });

  it("unpacks dynamic state without reusing settled beat tracking", () => {
    const source = new ModelCore(DEFAULT_PARAMS);
    source.initializeVenousPressuresForTargetTBV(5600);
    source.runFor(4, 0.001, 240);
    expect(source.assessSteadyState().beats).toBeGreaterThan(0);
    const snapshot = source.packState();

    const restored = new ModelCore(DEFAULT_PARAMS);
    restored.unpackState(snapshot);
    expect(restored.assessSteadyState().beats).toBe(0);

    restored.runFor(0.1, 0.001, 120);
    const comparable = restored.getComparableState();
    expect(finiteValues(comparable.values)).toBe(true);
    expect(Number.isFinite(comparable.t)).toBe(true);
    expect(Number.isFinite(comparable.phi)).toBe(true);
  });

  it("collects samples by default when running", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.initializeVenousPressuresForTargetTBV(5600);

    const samples = core.runFor(0.2, 0.001, 120);

    expect(samples.length).toBeGreaterThan(0);
    expect(samples.every((sample) => Number.isFinite(sample.t))).toBe(true);
  });

  it("can skip returned samples while retaining bounded history for beat metrics", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.initializeVenousPressuresForTargetTBV(5600);

    const samples = core.runFor(4, 0.001, 60, {
      collectSamples: false,
      recordHistory: true,
      historyLimit: 180,
    });
    const metrics = core.metrics();

    expect(samples).toEqual([]);
    expect(core.assessSteadyState().beats).toBeGreaterThan(0);
    expect(Number.isFinite(metrics.RAPMean)).toBe(true);
    expect(Number.isFinite(metrics.CO_R)).toBe(true);
    expect(Number.isFinite(metrics.LAPMean)).toBe(true);
    expect(Number.isFinite(metrics.CO_L)).toBe(true);
  });
});
