import { describe, expect, it } from "vitest";
import { decomposeMainWireAorticStorageIntervalV1, splitMainWireAcceptedProductV1,
  type MainWireAorticStorageIntervalInputV1 } from
  "@/analysis/methods/mainWire/MainWireEjectionBalanceDecompositionV1";

describe("research-only accepted-interval ejection balance decomposition V1", () => {
  it("splits a finite product change exactly without dropping the cross term", () => {
    const result = splitMainWireAcceptedProductV1({ startTimeSec: 10, endTimeSec: 10.125,
      acceptedDtSec: 0.125, aStart: 2, aEnd: 5, bStart: 7, bEnd: 3 });
    expect(result).toMatchObject({ aChange: 3, bChange: -4, aMean: 3.5, bMean: 5,
      productStart: 14, productEnd: 15, productChange: 1,
      aChangeContribution: 15, bChangeContribution: -14, reconstructedChange: 1, residual: 0 });
    expect(result.rates).toMatchObject({ basis: "accepted-interval-difference-not-instantaneous-derivative",
      productPerSec: 8, aChangeContributionPerSec: 120, bChangeContributionPerSec: -112 });
    // Using either endpoint for both coefficients would miss the cross term.
    expect(7 * result.aChange + 2 * result.bChange).not.toBe(result.productChange);
  });

  it("uses actual accepted timestamps and preserves signed or constant factors", () => {
    for (const duration of [0.037, 0.013]) {
      const input = { startTimeSec: 100, endTimeSec: 100 + duration, acceptedDtSec: duration,
        aStart: -2, aEnd: 3, bStart: 4, bEnd: 4 };
      const before = JSON.stringify(input);
      const result = splitMainWireAcceptedProductV1(input);
      expect(result.interval.dtSec).toBe(input.acceptedDtSec);
      expect(result.interval.elapsedTimeSec).toBe(input.endTimeSec - input.startTimeSec);
      expect(result.aChangeContribution).toBe(20);
      expect(result.bChangeContribution).toBe(0);
      expect(result.rates.productPerSec).toBe(20 / result.interval.dtSec);
      expect(result.residual).toBe(0);
      expect(JSON.stringify(input)).toBe(before);
    }
  });

  it("rejects invalid accepted clocks, nonfinite factors and derived overflow", () => {
    const input = { startTimeSec: 10, endTimeSec: 10.125, acceptedDtSec: 0.125,
      aStart: 2, aEnd: 5, bStart: 7, bEnd: 3 };
    for (const replacement of [{ endTimeSec: 10 }, { endTimeSec: 9 }, { startTimeSec: -1 },
      { acceptedDtSec: 0 }, { acceptedDtSec: 0.1 }, { endTimeSec: NaN },
      { aEnd: Infinity }, { bStart: NaN }, { aEnd: Number.MAX_VALUE }]) {
      expect(() => splitMainWireAcceptedProductV1({ ...input, ...replacement })).toThrow();
    }
  });

  it("accounts for every signed Ao branch using the same accepted endpoint and isolates external pressure", () => {
    const input = storageFixtureV1(), before = JSON.stringify(input);
    const result = decomposeMainWireAorticStorageIntervalV1(input);
    expect(result.flowBasis).toBe("backward-euler-same-accepted-endpoint-signed-node-flows");
    expect(result.branches).toEqual([
      { branchId: "AoV", endpointNetInflowMlPerSec: 20, volumeChangeMl: 2.5, transmuralPressureChangeMmHg: 5 },
      { branchId: "Ao_SA", endpointNetInflowMlPerSec: -10, volumeChangeMl: -1.25, transmuralPressureChangeMmHg: -2.5 },
      { branchId: "coronary", endpointNetInflowMlPerSec: -3, volumeChangeMl: -0.375, transmuralPressureChangeMmHg: -0.75 },
      { branchId: "support", endpointNetInflowMlPerSec: -2, volumeChangeMl: -0.25, transmuralPressureChangeMmHg: -0.5 },
    ]);
    expect(result.volume).toEqual({ observedChangeMl: 0.625, fromFlowsChangeMl: 0.625,
      netInflowAtEndMlPerSec: 5, continuityResidualMl: 0 });
    expect(result.pressure).toMatchObject({ observedTransmuralChangeMmHg: 1.25,
      observedAbsoluteChangeMmHg: 1.75, externalChangeMmHg: 0.5,
      secantMmHgPerMl: 2, secantSource: "observed-endpoint-pressure-volume-ratio",
      secantIssue: null, complianceMlPerMmHg: 0.5, constitutiveResidualMmHg: 0,
      flowStorageChangeMmHg: 1.25, continuityResidualContributionMmHg: 0,
      reconstructedAbsoluteChangeMmHg: 1.75, absoluteClosureResidualMmHg: 0 });
    expect(result.pressure.secantMmHgPerMl).not.toBe(1.75 / 0.625);
    expect(JSON.stringify(input)).toBe(before);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.interval)).toBe(true);
    expect(Object.isFrozen(result.volume)).toBe(true);
    expect(Object.isFrozen(result.pressure)).toBe(true);
    expect(Object.isFrozen(result.branches)).toBe(true);
    expect(result.branches.every(Object.isFrozen)).toBe(true);
  });

  it("uses the solver's recorded h at a large clock without manufacturing a storage residual", () => {
    const input = storageFixtureV1();
    const startTimeSec = 100_000_000, acceptedDtSec = 0.001;
    const endTimeSec = startTimeSec + acceptedDtSec;
    expect(endTimeSec - startTimeSec).not.toBe(acceptedDtSec);
    const result = decomposeMainWireAorticStorageIntervalV1({ ...input,
      previous: { ...input.previous, timeSec: startTimeSec },
      next: { ...input.next, timeSec: endTimeSec, acceptedDtSec, volumeMl: 100.5,
        transmuralPressureMmHg: 81, absolutePressureMmHg: 86 },
      endFlows: { aorticValveMlPerSec: 1000, aortaToSystemicMlPerSec: 400,
        coronary: { connected: true, inletFlowMlPerSec: 100 }, otherNetInflowMlPerSecByBranch: {} },
      constitutiveSecantMmHgPerMl: 2 });
    expect(result.interval).toEqual({ startTimeSec, endTimeSec, dtSec: acceptedDtSec,
      elapsedTimeSec: endTimeSec - startTimeSec });
    expect(result.volume.continuityResidualMl).toBe(0);
    expect(result.pressure.constitutiveResidualMmHg).toBe(0);
    expect(result.pressure.flowStorageChangeMmHg).toBe(1);
    expect((endTimeSec - startTimeSec) * 500).not.toBe(result.volume.fromFlowsChangeMl);
    const split = splitMainWireAcceptedProductV1({ startTimeSec, endTimeSec, acceptedDtSec,
      aStart: 1, aEnd: 2, bStart: 1, bEnd: 1 });
    expect(split.rates.productPerSec).toBe(1000);
    expect(() => decomposeMainWireAorticStorageIntervalV1({ ...input,
      previous: { ...input.previous, timeSec: startTimeSec },
      next: { ...input.next, timeSec: endTimeSec, acceptedDtSec: 0.002 } })).toThrow(/matching actual accepted dt/);
  });

  it("retains independent continuity and caller-law residuals instead of hiding missing balance", () => {
    const input = storageFixtureV1();
    const result = decomposeMainWireAorticStorageIntervalV1({ ...input, constitutiveSecantMmHgPerMl: 2,
      next: { ...input.next, volumeMl: 100.75, transmuralPressureMmHg: 81.75, absolutePressureMmHg: 87.25 } });
    expect(result.volume.continuityResidualMl).toBe(0.125);
    expect(result.pressure).toMatchObject({ secantSource: "caller-supplied-constitutive-secant",
      constitutiveResidualMmHg: 0.25, continuityResidualContributionMmHg: 0.25,
      flowStorageChangeMmHg: 1.25, externalChangeMmHg: 0.5,
      reconstructedAbsoluteChangeMmHg: 2.25, absoluteClosureResidualMmHg: 0 });
    const withoutCoronary = decomposeMainWireAorticStorageIntervalV1({ ...input,
      endFlows: { ...input.endFlows, coronary: { connected: false } } });
    expect(withoutCoronary.volume.continuityResidualMl).toBe(-0.375);
    // This arithmetic exposes the mismatch but does not diagnose its cause.
    expect(withoutCoronary.pressure.continuityResidualContributionMmHg).toBe(-0.75);
  });

  it("accepts a caller's finite-law secant without substituting an endpoint tangent", () => {
    const input = storageFixtureV1();
    const p0 = 50, scaleVolume = 100, volumeStart = 100, volumeEnd = 100.625;
    const pressureStart = p0 * Math.expm1(volumeStart / scaleVolume);
    const pressureEnd = p0 * Math.expm1(volumeEnd / scaleVolume);
    const scaledChange = (volumeEnd - volumeStart) / scaleVolume;
    const secant = ((p0 + pressureStart) / scaleVolume) * Math.expm1(scaledChange) / scaledChange;
    const result = decomposeMainWireAorticStorageIntervalV1({ ...input,
      previous: { ...input.previous, volumeMl: volumeStart,
        transmuralPressureMmHg: pressureStart, absolutePressureMmHg: pressureStart },
      next: { ...input.next, volumeMl: volumeEnd,
        transmuralPressureMmHg: pressureEnd, absolutePressureMmHg: pressureEnd },
      constitutiveSecantMmHgPerMl: secant });
    expect(result.pressure.secantMmHgPerMl).toBe(secant);
    expect(result.pressure.constitutiveResidualMmHg).toBeCloseTo(0, 11);
    expect(result.pressure.flowStorageChangeMmHg).toBeCloseTo(pressureEnd - pressureStart, 11);
    expect(secant).not.toBeCloseTo((p0 + pressureEnd) / scaleVolume, 4);
  });

  it("does not infer a tangent at zero volume change but can use an explicitly supplied limiting secant", () => {
    const fixture = storageFixtureV1();
    const input: MainWireAorticStorageIntervalInputV1 = { ...fixture,
      next: { ...fixture.next, volumeMl: 100, transmuralPressureMmHg: 80, absolutePressureMmHg: 85.5 },
      endFlows: { ...fixture.endFlows, aorticValveMlPerSec: 13, otherNetInflowMlPerSecByBranch: {} } };
    const unavailable = decomposeMainWireAorticStorageIntervalV1(input);
    expect(unavailable.volume.continuityResidualMl).toBe(0);
    expect(unavailable.pressure).toMatchObject({ secantMmHgPerMl: null, complianceMlPerMmHg: null,
      secantIssue: "zero-volume-change-no-secant-inferred", externalChangeMmHg: 0.5,
      flowStorageChangeMmHg: null, constitutiveResidualMmHg: null, reconstructedAbsoluteChangeMmHg: null });
    expect(unavailable.branches.every((branch) => branch.transmuralPressureChangeMmHg === null)).toBe(true);
    const supplied = decomposeMainWireAorticStorageIntervalV1({ ...input, constitutiveSecantMmHgPerMl: 2 });
    expect(supplied.branches.map((branch) => branch.transmuralPressureChangeMmHg)).toEqual([3.25, -2.5, -0.75]);
    expect(supplied.pressure).toMatchObject({ flowStorageChangeMmHg: 0, constitutiveResidualMmHg: 0,
      reconstructedAbsoluteChangeMmHg: 0.5, absoluteClosureResidualMmHg: 0 });
    expect(JSON.stringify(unavailable)).not.toMatch(/NaN|Infinity/);
  });

  it("preserves reverse branch flow and does not clip flat or negative observed secants into positive compliance", () => {
    const input = storageFixtureV1();
    const reverse = decomposeMainWireAorticStorageIntervalV1({ ...input,
      endFlows: { ...input.endFlows, coronary: { connected: true, inletFlowMlPerSec: -3 } } });
    expect(reverse.branches[2]).toMatchObject({ endpointNetInflowMlPerSec: 3,
      volumeChangeMl: 0.375, transmuralPressureChangeMmHg: 0.75 });
    const flat = decomposeMainWireAorticStorageIntervalV1({ ...input,
      next: { ...input.next, transmuralPressureMmHg: input.previous.transmuralPressureMmHg } });
    expect(flat.pressure.secantMmHgPerMl).toBe(0);
    expect(flat.pressure.complianceMlPerMmHg).toBeNull();
    const negative = decomposeMainWireAorticStorageIntervalV1({ ...input,
      next: { ...input.next, transmuralPressureMmHg: 79 } });
    expect(negative.pressure).toMatchObject({ secantMmHgPerMl: null, complianceMlPerMmHg: null,
      secantIssue: "nonfinite-or-negative-observed-secant", observedTransmuralChangeMmHg: -1 });
  });

  it("requires explicit topology contributions and finite valid accepted inputs", () => {
    const input = storageFixtureV1();
    for (const coronary of [undefined, { connected: true }, { connected: false, inletFlowMlPerSec: 0 }]) {
      const malformed = { ...input, endFlows: { ...input.endFlows, coronary } } as MainWireAorticStorageIntervalInputV1;
      expect(() => decomposeMainWireAorticStorageIntervalV1(malformed)).toThrow();
    }
    for (const otherNetInflowMlPerSecByBranch of [undefined, null, [], { AoV: 0 }, { coronary: 0 }, { " ": 0 }, { support: NaN }]) {
      const malformed = { ...input, endFlows: { ...input.endFlows, otherNetInflowMlPerSecByBranch } } as
        MainWireAorticStorageIntervalInputV1;
      expect(() => decomposeMainWireAorticStorageIntervalV1(malformed)).toThrow();
    }
    for (const constitutiveSecantMmHgPerMl of [0, -1, NaN, Infinity]) {
      expect(() => decomposeMainWireAorticStorageIntervalV1({ ...input, constitutiveSecantMmHgPerMl })).toThrow();
    }
    for (const replacement of [{ acceptedDtSec: 0.1 }, { timeSec: 10 }, { volumeMl: 0 },
      { absolutePressureMmHg: NaN }, { transmuralPressureMmHg: Infinity }]) {
      expect(() => decomposeMainWireAorticStorageIntervalV1({ ...input, next: { ...input.next, ...replacement } })).toThrow();
    }
    expect(() => decomposeMainWireAorticStorageIntervalV1({ ...input,
      endFlows: { ...input.endFlows, aorticValveMlPerSec: Infinity } })).toThrow();
  });
});

function storageFixtureV1(): MainWireAorticStorageIntervalInputV1 {
  return { previous: { timeSec: 10, volumeMl: 100, transmuralPressureMmHg: 80, absolutePressureMmHg: 85 },
    next: { timeSec: 10.125, acceptedDtSec: 0.125, volumeMl: 100.625,
      transmuralPressureMmHg: 81.25, absolutePressureMmHg: 86.75 },
    endFlows: { aorticValveMlPerSec: 20, aortaToSystemicMlPerSec: 10,
      coronary: { connected: true, inletFlowMlPerSec: 3 }, otherNetInflowMlPerSecByBranch: { support: -2 } } };
}
