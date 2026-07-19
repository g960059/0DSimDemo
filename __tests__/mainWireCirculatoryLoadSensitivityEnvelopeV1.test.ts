import { describe, expect, it } from "vitest";

import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINT_IDS_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINTS_V1,
  resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import {
  runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  runMainWireCirculatoryLoadSensitivityEnvelopeV1,
} from "@/engine/scientific/validation/MainWireCirculatoryLoadSensitivityEnvelopeV1";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

describe("main-wire circulatory load sensitivity envelope V1", () => {
  it("locks the one-factor-at-a-time grid and changes only resistance owners", () => {
    const baseline = normalAdultMainWireRuntimeV1();

    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINT_IDS_V1)
      .toEqual([
        "baseline",
        "systemic-resistance-low",
        "systemic-resistance-high",
        "pulmonary-resistance-low",
        "pulmonary-resistance-high",
      ]);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINTS_V1
      .map(({ systemicResistanceScaleFromBaseline }) =>
        systemicResistanceScaleFromBaseline)).toEqual([
      1,
      0.75,
      1.3333333333333333,
      1,
      1,
    ]);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINTS_V1
      .map(({ pulmonaryResistanceScaleFromBaseline }) =>
        pulmonaryResistanceScaleFromBaseline)).toEqual([
      1,
      1,
      1,
      0.75,
      1.3333333333333333,
    ]);

    for (const pointId of
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINT_IDS_V1) {
      const runtime =
        resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(pointId);
      expect(runtime.vascular).toEqual(baseline.vascular);
      expect(runtime.respiratory).toEqual(baseline.respiratory);
      expect(runtime.valvePreset).toEqual(baseline.valvePreset);
    }
  });

  it("rejects a generic parameter patch at the research runner boundary", () => {
    expect(() => runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1(
      {
        dtSec: 0.01,
        maximumBeatCount: 1,
        warmStart: null,
      } as never,
      "baseline",
    )).toThrow("reject unsupported field: warmStart");
  });

  it("runs five independent periodic cold starts and reports robust load directions", async () => {
    const report = await runMainWireCirculatoryLoadSensitivityEnvelopeV1({
      dtSec: 0.004,
      maximumBeatCount: 32,
    });

    expect(report.runs).toHaveLength(5);
    expect(report.protocolSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(report.envelopeSha256).toMatch(/^[0-9a-f]{64}$/);
    const { envelopeSha256: _digest, ...payload } = report;
    expect(report.envelopeSha256).toBe(await sha256CanonicalJsonHex(payload));
    expect(report.claim).toMatchObject({
      researchOnly: true,
      authoritativeFiveWallTransactionReused: true,
      secondBackendIntroduced: false,
      sourceResearchRunnerOnly: true,
      simulationReleaseRefBound: false,
      releaseResolvedSessionInputUsed: false,
      workerOrCaseDocumentExecutionUsed: false,
      approvedTwoMillisecondProtocolClaimed: false,
      executableBuildIdentityRecorded: false,
      productionCutoverEvidenceEligible: false,
      eachPointStartedFromIndependentCanonicalColdState: true,
      warmStartAcrossPointsApplied: false,
      totalBloodVolumePerturbed: false,
      arbitraryParameterPatchAccepted: false,
      parameterSearchOrFittingPerformed: false,
      directionalAcceptanceThresholdApplied: false,
    });

    for (const run of report.runs) {
      expect(run.pointDefinitionSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(run.resolvedRuntimeSha256).toBe(
        await sha256CanonicalJsonHex(run.resolvedRuntime),
      );
      expect(run.runnerCirculationRuntimeStableHash).toMatch(/^[0-9a-f]{8}$/);
      expect(run.outcome.integrationCompletedWithoutFailure).toBe(true);
      expect(run.outcome.terminationReason).toBe("period1-converged");
      expect(run.cycleMetrics.availability).toBe("available");
      expect(run.initializationAudit.totalBloodVolumeDifferenceMl).toBe(0);
      expect(run.initializationAudit.chamberVolumesChanged).toBe(false);
      expect(run.initializationAudit.dynamicEdgeFlowsChanged).toBe(false);
      expect(run.initializationAudit.valveOpeningStatesChanged).toBe(false);
      expect(run.initializationAudit.warmStartSourceProtocolIdentityHash)
        .toBeNull();
    }

    const baseline = find(report, "baseline");
    const systemicLow = find(report, "systemic-resistance-low");
    const systemicHigh = find(report, "systemic-resistance-high");
    const pulmonaryLow = find(report, "pulmonary-resistance-low");
    const pulmonaryHigh = find(report, "pulmonary-resistance-high");
    expect(Object.values(baseline.responseDeltaFromBaseline.values)
      .every((value) => value === 0)).toBe(true);

    expect(value(systemicLow, "aorticMeanPressureMmHg"))
      .toBeLessThan(value(baseline, "aorticMeanPressureMmHg"));
    expect(value(systemicHigh, "aorticMeanPressureMmHg"))
      .toBeGreaterThan(value(baseline, "aorticMeanPressureMmHg"));
    expect(value(systemicLow, "netAorticCardiacOutputLPerMin"))
      .toBeGreaterThan(value(baseline, "netAorticCardiacOutputLPerMin"));
    expect(value(systemicHigh, "netAorticCardiacOutputLPerMin"))
      .toBeLessThan(value(baseline, "netAorticCardiacOutputLPerMin"));
    expect(value(systemicLow, "leftVentricularEjectionFraction01"))
      .toBeGreaterThan(value(baseline, "leftVentricularEjectionFraction01"));
    expect(value(systemicHigh, "leftVentricularEjectionFraction01"))
      .toBeLessThan(value(baseline, "leftVentricularEjectionFraction01"));

    expect(value(pulmonaryLow, "pulmonaryArteryMeanPressureMmHg"))
      .toBeLessThan(value(baseline, "pulmonaryArteryMeanPressureMmHg"));
    expect(value(pulmonaryHigh, "pulmonaryArteryMeanPressureMmHg"))
      .toBeGreaterThan(value(baseline, "pulmonaryArteryMeanPressureMmHg"));
    expect(value(pulmonaryLow, "rightVentricularEjectionFraction01"))
      .toBeGreaterThan(value(baseline, "rightVentricularEjectionFraction01"));
    expect(value(pulmonaryHigh, "rightVentricularEjectionFraction01"))
      .toBeLessThan(value(baseline, "rightVentricularEjectionFraction01"));
  }, 90_000);
});

type Report = Awaited<
  ReturnType<typeof runMainWireCirculatoryLoadSensitivityEnvelopeV1>
>;
type Run = Report["runs"][number];
type NumericMetric = Exclude<keyof Run["cycleMetrics"], "availability">;

function find(
  report: Report,
  pointId: Run["point"]["pointId"],
): Run {
  const run = report.runs.find((candidate) => candidate.point.pointId === pointId);
  if (run === undefined) throw new Error(`missing run ${pointId}`);
  return run;
}

function value(run: Run, metric: NumericMetric): number {
  const measured = run.cycleMetrics[metric];
  if (measured === null) throw new Error(`metric ${metric} is unavailable`);
  return measured;
}
