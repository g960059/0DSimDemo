import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  ATRIAL_LAND_LATE_STRETCH_ARM_IDS_V1,
  ATRIAL_LAND_LATE_STRETCH_COMPONENT_CLAIM_BOUNDARY_V1,
  ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1,
  ATRIAL_LAND_LATE_STRETCH_TIMING_V1,
  runAtrialLandLateStretchComponentProtocolV1,
  type AtrialLandLateStretchComponentReportV1,
  type AtrialLandLateStretchRunV1,
} from "@/engine/myocardium/fourChamberV1/protocols/atrialLandLateStretchComponentProtocolV1";
import {
  PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";

describe("manifest-bound atrial Land late-stretch component protocol v1", () => {
  it("binds the unmodified atrial manifest, target pack, Land prior, and exact 12 ms Ca delay", () => {
    const report = protocolReport();

    expect(report.modelBinding.tissueManifestBundleSha256)
      .toBe(PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1.bundle);
    expect(report.modelBinding.atrialTissueManifestSha256)
      .toBe(PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1.atrialManifest);
    expect(report.modelBinding.atrialTargetPackSha256)
      .toBe(PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1.atrialTargetPack);
    expect(report.modelBinding.wallAdapterTissueManifestSha256)
      .toBe(PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1.atrialManifest);
    expect(report.modelBinding.atrialLandParameterSetId)
      .toBe("atrial-human-prior-v1:land2017-equation-parameters");
    expect(report.modelBinding.electricalToCalciumDelaySec).toBe(0.012);
    expect(report.timing.calciumDriveDelaySec).toBe(0.012);
  });

  it("forks every arm and dt from one bit-exact pre-event Land and calcium state", () => {
    const report = protocolReport();

    expect(report.runs).toHaveLength(12);
    expect(new Set(report.runs.map((run) => `${run.dtSec}:${run.armId}`)).size).toBe(12);
    expect(report.diagnosticGate.completeFourByThreeMatrix).toBe(true);
    expect(report.diagnosticGate.bitExactCommonPreEventState).toBe(true);
    for (const run of report.runs) {
      expect(run.commonPreEventStateSha256)
        .toBe(report.provenance.commonPreEventStateSha256);
      expect(arraysBitExact(run.sourceLandStateAtStart, report.commonPreEventState.sourceLandState))
        .toBe(true);
      expect(arraysBitExact(run.calciumStateAtStart, report.commonPreEventState.calciumState))
        .toBe(true);
      expect(run.calciumDriveTimeSec).toBe(0.012);
      expect(run.calciumEventAppliedCount).toBe(1);
    }
    expect(report.commonPreEventState.burnInStepCount).toBe(8_000);
    expect(report.commonPreEventState.burnInLastStateMaximumAbsoluteChange).toBe(0);
  });

  it("executes the declared four-arm trajectories at 1, 0.5, and 0.25 ms", () => {
    const report = protocolReport();

    expect(report.dtFamilySec).toEqual(Array.from(ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1));
    expect(report.armDefinitions.map((arm) => arm.armId))
      .toEqual(Array.from(ATRIAL_LAND_LATE_STRETCH_ARM_IDS_V1));
    for (const dtSec of ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1) {
      const expectedSteps = Math.round(ATRIAL_LAND_LATE_STRETCH_TIMING_V1.durationSec / dtSec);
      const isometric = requiredRun(report, dtSec, "isometric");
      const hold = requiredRun(report, dtSec, "shortening-hold");
      const restretch = requiredRun(report, dtSec, "shortening-restretch");
      const activeOff = requiredRun(report, dtSec, "active-off");

      for (const run of [isometric, hold, restretch, activeOff]) {
        expect(run.ok).toBe(true);
        expect(run.samples).toHaveLength(expectedSteps);
        expect(run.expectedStepCount).toBe(expectedSteps);
      }
      expect(isometric.samples.every((sample) => sample.fiberLogStrain === 0.02)).toBe(true);
      expect(last(hold.samples).fiberLogStrain).toBe(-0.015);
      expect(last(restretch.samples).fiberLogStrain).toBe(0.02);
      expect(last(activeOff.samples).fiberLogStrain).toBe(0.02);
      expect(activeOff.samples.every((sample) => sample.freeCalciumUM === 0.1)).toBe(true);
      expect(restretch.trajectoryProvenanceSha256).toBe(activeOff.trajectoryProvenanceSha256);
      expect(restretch.inputProvenanceSha256).not.toBe(activeOff.inputProvenanceSha256);
    }
  });

  it("reports healthy populations, conservation, and solver status without projection", () => {
    const report = protocolReport();

    expect(report.commonPreEventState.burnInAllHealthFinite).toBe(true);
    expect(report.commonPreEventState.burnInAnyProjectionUsed).toBe(false);
    expect(report.commonPreEventState.burnInMinimumPopulation).toBeGreaterThanOrEqual(0);
    expect(report.commonPreEventState.burnInMaximumAbsoluteStateConservationResidual)
      .toBeLessThanOrEqual(1e-12);
    for (const run of report.runs) {
      expect(run.failureReason).toBeNull();
      expect(run.failureMessage).toBeNull();
      expect(run.metrics).not.toBeNull();
      expect(run.metrics!.allSourceHealthFinite).toBe(true);
      expect(run.metrics!.anyProjectionUsed).toBe(false);
      expect(run.metrics!.minimumPopulation).toBeGreaterThanOrEqual(0);
      expect(run.metrics!.maximumAbsoluteStateConservationResidual).toBeLessThanOrEqual(1e-12);
      expect(run.samples.every((sample) => sample.healthFinite)).toBe(true);
    }
    expect(report.diagnosticGate.allRunsSolved).toBe(true);
    expect(report.diagnosticGate.allPopulationAndConservationHealthPassed).toBe(true);
  });

  it("separates visible total-stress re-rise from the matched hold-subtracted Land component", () => {
    const report = protocolReport();

    expect(report.secondaryComponents).toHaveLength(3);
    for (const component of report.secondaryComponents) {
      expect(component.available).toBe(true);
      expect(component.morphologyUsedAsGate).toBe(false);
      const restretch = requiredRun(report, component.dtSec, "shortening-restretch");
      const hold = requiredRun(report, component.dtSec, "shortening-hold");
      const matchedDifferences = restretch.samples.map((sample, index) => ({
        timeSec: sample.timeSec,
        value: sample.wallActiveKirchhoffStressPa
          - hold.samples[index].wallActiveKirchhoffStressPa,
      })).filter((sample) =>
        sample.timeSec >= ATRIAL_LAND_LATE_STRETCH_TIMING_V1.restretchOnsetSec
        && sample.timeSec <= ATRIAL_LAND_LATE_STRETCH_TIMING_V1.lateMetricWindowEndSec);
      const directPeak = matchedDifferences.reduce((selected, sample) =>
        sample.value > selected.value ? sample : selected);

      expect(component.peakRestretchMinusMatchedHoldPa).toBeCloseTo(directPeak.value, 12);
      expect(component.peakRestretchMinusMatchedHoldTimeSec).toBe(directPeak.timeSec);
      expect(component.positiveRestretchMinusMatchedHoldImpulsePaSec).toBeGreaterThanOrEqual(0);
      expect(component.activeOffSelfReRisePa).toBeGreaterThanOrEqual(0);
    }

    const fine = report.secondaryComponents.find((component) => component.dtSec === 0.00025)!;
    expect(fine.totalStressSecondarySpikeDetected).toBe(false);
    expect(fine.matchedCounterfactualComponentDetected).toBe(true);
    expect(report.diagnosticGate.secondarySpikeMorphologyUsedAsGate).toBe(false);
    expect(report.diagnosticGate.pass).toBe(true);
  });

  it("records trajectory, solver, input, and result hashes and replays deterministically", () => {
    const first = protocolReport();
    const second = runAtrialLandLateStretchComponentProtocolV1(sha256);
    const hashes = [
      first.provenance.manifestBindingSha256,
      first.provenance.calciumInputSha256,
      first.provenance.solverPolicySha256,
      first.provenance.burnInPolicySha256,
      first.provenance.commonPreEventStateSha256,
      first.provenance.protocolInputSha256,
      first.resultSummarySha256,
      ...first.runs.flatMap((run) => [
        run.trajectoryProvenanceSha256,
        run.solverProvenanceSha256,
        run.inputProvenanceSha256,
      ]),
    ];

    expect(hashes.every((hash) => /^[0-9a-f]{64}$/.test(hash))).toBe(true);
    expect(second.provenance).toEqual(first.provenance);
    expect(second.resultSummarySha256).toBe(first.resultSummarySha256);
    expect(second.secondaryComponents).toEqual(first.secondaryComponents);
    expect(first.dtComparisons.every((comparison) => comparison.available)).toBe(true);
    expect(first.diagnosticGate.allDtComparisonMetricsFinite).toBe(true);
    expect(first.diagnosticGate.allSecondaryComponentMetricsFinite).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.runs[0].samples)).toBe(true);
  });

  it("keeps the protocol explicitly diagnostic-only and outside closed-loop acceptance", () => {
    const report = protocolReport();
    const serialized = JSON.stringify(report);

    expect(report.claimBoundary)
      .toBe(ATRIAL_LAND_LATE_STRETCH_COMPONENT_CLAIM_BOUNDARY_V1);
    expect(report.diagnosticOnly).toBe(true);
    expect(report.closedLoopReleaseEligible).toBe(false);
    expect(report.physiologicalValidationClaimed).toBe(false);
    expect(report.morphologyAcceptanceThresholdUsed).toBe(false);
    expect(serialized).not.toMatch(/physiologicalValidationClaimed":true/);
    expect(serialized).not.toMatch(/closedLoopReleaseEligible":true/);
  });
});

let cachedReport: AtrialLandLateStretchComponentReportV1 | undefined;

function protocolReport(): AtrialLandLateStretchComponentReportV1 {
  cachedReport ??= runAtrialLandLateStretchComponentProtocolV1(sha256);
  return cachedReport;
}

function requiredRun(
  report: AtrialLandLateStretchComponentReportV1,
  dtSec: number,
  armId: AtrialLandLateStretchRunV1["armId"],
): AtrialLandLateStretchRunV1 {
  const run = report.runs.find((candidate) =>
    candidate.dtSec === dtSec && candidate.armId === armId);
  expect(run).toBeDefined();
  return run!;
}

function last<T>(values: readonly T[]): T {
  return values[values.length - 1];
}

function arraysBitExact(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
