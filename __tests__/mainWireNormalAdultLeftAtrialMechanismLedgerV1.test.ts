import { beforeAll, describe, expect, it } from "vitest";

import {
  MAIN_WIRE_NORMAL_ADULT_LEFT_ATRIAL_MECHANISM_LEDGER_V1_CLAIM,
  measureMainWireNormalAdultLeftAtrialMechanismLedgerV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultLeftAtrialMechanismLedgerV1";
import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const DT_SEC = 0.02;

describe("main-wire normal-adult LA mechanism ledger V1", () => {
  let precedingSample: MainWireNormalAdultFiveWallDiagnosticSampleV2;
  let source: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];

  beforeAll(() => {
    const run = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: DT_SEC,
      maximumBeatCount: 2,
      pericardiumMode: "on",
      pericardiumCase: "healthy-slack",
    });
    if (!run.integrationCompletedWithoutFailure) {
      throw new Error("stable two-beat LA-ledger fixture did not complete");
    }
    const currentBeat = run.retainedCompleteBeats.at(-1);
    const precedingBeat = run.retainedCompleteBeats.at(-2);
    if (
      currentBeat === undefined
      || precedingBeat === undefined
      || precedingBeat.beatIndex + 1 !== currentBeat.beatIndex
    ) throw new Error("stable LA-ledger fixture did not retain adjacent beats");
    const acceptedBeforeBeat = precedingBeat.samples.at(-1);
    if (acceptedBeforeBeat === undefined) {
      throw new Error("stable LA-ledger fixture has no preceding accepted sample");
    }
    precedingSample = acceptedBeforeBeat;
    source = currentBeat.samples;
  }, 30_000);

  it("exactly attributes all accepted pressure increments and BE flow intervals", () => {
    const ledger = measure(precedingSample, source);

    expect(ledger.samples).toHaveLength(source.length);
    expect(ledger.intervals).toHaveLength(source.length);
    expect(ledger.intervals[0]).toMatchObject({
      previousSampleIndex: -1,
      currentSampleIndex: 0,
      dtSec: DT_SEC,
    });
    expect(ledger.audit.maximumAbsoluteTransmuralPressureAssemblyResidualMmHg)
      .toBeLessThan(1e-10);
    expect(ledger.audit.maximumAbsoluteAbsolutePressureAssemblyResidualMmHg)
      .toBeLessThan(1e-10);
    expect(ledger.audit.maximumAbsolutePressureIncrementAssemblyResidualMmHg)
      .toBeLessThan(1e-9);
    expect(ledger.samples.some((sample) =>
      Math.abs(sample.pressureComponentsMmHg.parallelSls) > 0)).toBe(true);
    expect(ledger.samples.every((sample, index) =>
      sample.pressureComponentsMmHg.commonIntrathoracic
        === source[index]!.commonIntrathoracicPressureMmHg)).toBe(true);

    for (const interval of ledger.intervals) {
      const sourceAtEnd = source[interval.currentSampleIndex]!;
      expect(Math.abs(interval.continuityResidualMl)).toBeLessThanOrEqual(
        sourceAtEnd.diagnostics.maximumContinuityResidualMl + 1e-12,
      );
      const area = interval
        .trapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl;
      expect(
        area.equilibriumPassive + area.landActive + area.parallelSls
          + area.commonIntrathoracic + area.commonPericardium,
      ).toBeCloseTo(area.reconstructedAbsolute, 10);
      expect(area.reportedAbsolute - area.reconstructedAbsolute)
        .toBe(area.assemblyResidual);
    }
    const total = ledger.audit
      .totalTrapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl;
    expect(total.reportedAbsolute).toBeCloseTo(
      ledger.intervals.reduce((sum, interval) =>
        sum + interval
          .trapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl
          .reportedAbsolute, 0),
      12,
    );
    expect(MAIN_WIRE_NORMAL_ADULT_LEFT_ATRIAL_MECHANISM_LEDGER_V1_CLAIM
      .trajectoryAreaStoredEnergyClaimed).toBe(false);
    expect(MAIN_WIRE_NORMAL_ADULT_LEFT_ATRIAL_MECHANISM_LEDGER_V1_CLAIM
      .commonPericardialBagWorkPartitionClaimed).toBe(false);
  });

  it("uses authoritative Pth and keeps synthetic Pperi separate from myocardium", () => {
    const pthOffsetMmHg = 1.25;
    const pericardialOffsetMmHg = 3;
    const shiftedPreceding = shiftExternalPressures(
      precedingSample,
      pthOffsetMmHg,
      pericardialOffsetMmHg,
    );
    const shifted = source.map((sample) => shiftExternalPressures(
      sample,
      pthOffsetMmHg,
      pericardialOffsetMmHg,
    ));
    const baseline = measure(precedingSample, source);
    const ledger = measure(shiftedPreceding, shifted);

    expect(ledger.samples.every((sample, index) =>
      sample.pressureComponentsMmHg.commonIntrathoracic
        === source[index]!.commonIntrathoracicPressureMmHg + pthOffsetMmHg))
      .toBe(true);
    expect(ledger.samples.every((sample, index) =>
      sample.pressureComponentsMmHg.commonPericardium
        === source[index]!.commonPericardium.excessPressureMmHg
          + pericardialOffsetMmHg)).toBe(true);
    expect(ledger.audit.maximumAbsoluteAbsolutePressureAssemblyResidualMmHg)
      .toBeLessThan(1e-10);
    expect(ledger.samples.map((sample) =>
      sample.pressureComponentsMmHg.equilibriumPassive)).toEqual(
      baseline.samples.map((sample) =>
        sample.pressureComponentsMmHg.equilibriumPassive),
    );
  });

  it("keeps a closed full-cycle trajectory area invariant to a constant gauge", () => {
    const closedPreceding = withTime(
      source.at(-1)!,
      source[0]!.timeSec - DT_SEC,
    );
    const baseline = measure(closedPreceding, source);
    const gaugeOffsetMmHg = 17;
    const shifted = measure(
      shiftExternalPressures(closedPreceding, gaugeOffsetMmHg, 0),
      source.map((sample) =>
        shiftExternalPressures(sample, gaugeOffsetMmHg, 0)),
    );
    const baselineArea = baseline.audit
      .totalTrapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl;
    const shiftedArea = shifted.audit
      .totalTrapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl;

    expect(shiftedArea.reportedAbsolute)
      .toBeCloseTo(baselineArea.reportedAbsolute, 10);
    expect(shiftedArea.reconstructedAbsolute)
      .toBeCloseTo(baselineArea.reconstructedAbsolute, 10);
  });

  it("rejects missing or decimated accepted-step adjacency", () => {
    expect(() => measureMainWireNormalAdultLeftAtrialMechanismLedgerV1({
      precedingSample,
      samples: [],
      dtSec: DT_SEC,
    })).toThrow("requires accepted samples");
    expect(() => measure(precedingSample, source.slice(1)))
      .toThrow("contiguous accepted steps");
    expect(() => measure(precedingSample, [source[0]!, source[2]!]))
      .toThrow("contiguous accepted steps");
    expect(() => measureMainWireNormalAdultLeftAtrialMechanismLedgerV1({
      precedingSample,
      samples: source,
      dtSec: 0,
    })).toThrow("dtSec must be positive and finite");
  });
});

function measure(
  precedingSample: MainWireNormalAdultFiveWallDiagnosticSampleV2,
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
) {
  return measureMainWireNormalAdultLeftAtrialMechanismLedgerV1({
    precedingSample,
    samples,
    dtSec: DT_SEC,
  });
}

function shiftExternalPressures(
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV2,
  commonIntrathoracicOffsetMmHg: number,
  commonPericardialOffsetMmHg: number,
): MainWireNormalAdultFiveWallDiagnosticSampleV2 {
  const absolute = sample.nodeAbsolutePressureMmHg;
  const chamberOffsetMmHg = commonIntrathoracicOffsetMmHg
    + commonPericardialOffsetMmHg;
  return Object.freeze({
    ...sample,
    commonIntrathoracicPressureMmHg:
      sample.commonIntrathoracicPressureMmHg
      + commonIntrathoracicOffsetMmHg,
    nodeAbsolutePressureMmHg: Object.freeze({
      LA: absolute.LA + chamberOffsetMmHg,
      LV: absolute.LV + chamberOffsetMmHg,
      RA: absolute.RA + chamberOffsetMmHg,
      RV: absolute.RV + chamberOffsetMmHg,
      Ao: absolute.Ao + commonIntrathoracicOffsetMmHg,
      PA: absolute.PA + commonIntrathoracicOffsetMmHg,
      PVein: absolute.PVein + commonIntrathoracicOffsetMmHg,
    }),
    commonPericardium: Object.freeze({
      ...sample.commonPericardium,
      excessPressureMmHg: sample.commonPericardium.excessPressureMmHg
        + commonPericardialOffsetMmHg,
    }),
  });
}

function withTime(
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV2,
  timeSec: number,
): MainWireNormalAdultFiveWallDiagnosticSampleV2 {
  return Object.freeze({ ...sample, timeSec });
}
