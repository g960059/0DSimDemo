import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_TBV_RATIOS_V1,
  assessMainWireIntegratedModelPeriodicValveEventLocusV1,
  extractMainWireIntegratedModelPeriodicValveEventsV1,
  type MainWireIntegratedModelPeriodicValveEventLocusRunV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicValveEventLocusV1";
import type {
  MainWireIntegratedModelPeriodicTerminalCycleTraceV3,
  MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

describe("periodic valve-event PV locus V1", () => {
  it("interpolates exact accepted-segment closure events and preserves both pressure bases", () => {
    const run = syntheticRun(1, 4);
    const extracted = extractMainWireIntegratedModelPeriodicValveEventsV1(
      run.terminalCycleStartTraceSample,
      run.terminalCycleTrace,
    );

    expect(extracted.status).toBe("qualified-biventricular");
    expect(extracted.sourceAcceptedSegmentCount).toBe(4);
    expect(extracted.leftVentricle).toMatchObject({
      inletClosureCrossingCount: 1,
      semilunarClosureCrossingCount: 1,
      eventSequenceQualified: true,
    });
    expect(extracted.leftVentricle.endDiastolic).toMatchObject({
      valveId: "MV",
      crossingFraction: 0.5,
      timeSec: 4.125,
    });
    expect(extracted.leftVentricle.endEjection).toMatchObject({
      valveId: "AoV",
      crossingFraction: 0.5,
      timeSec: 4.625,
    });
    expect(
      extracted.leftVentricle.endEjection!.absolutePressureMmHg -
        extracted.leftVentricle.endEjection!.transmuralPressureMmHg,
    ).toBeCloseTo(5, 12);
  });

  it("qualifies the frozen bilateral load set without promoting its loci to ESPVR, EDPVR, or PVA", () => {
    const runs =
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_TBV_RATIOS_V1.map(
        (ratio, index) => syntheticRun(ratio, 10 + index),
      );
    const assessment =
      assessMainWireIntegratedModelPeriodicValveEventLocusV1(runs);

    expect(assessment).toMatchObject({
      pointCount: 9,
      expectedLoadSetComplete: true,
      loadMagnitudesMatchBaselineRatios: true,
      bilateralLoadCoverage: true,
      conditionIdentitiesDistinct: true,
      protocolIdentitySharedAcrossLoads: true,
      allRunsQualified: true,
      allValveEventSequencesQualified: true,
      eventDefinedLocusEstablished: true,
      biventricularBothPressureBasesLinearDiagnosticPassed: true,
      officialExperimentEventLocusEligible: true,
      publicLiveOutputCatalogAdmissionEstablished: false,
      espvrAdmissionEstablished: false,
      edpvrAdmissionEstablished: false,
      potentialEnergyAdmissionEstablished: false,
      pvaAdmissionEstablished: false,
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
    });
    expect(assessment.endEjectionLinearDiagnostics).toHaveLength(4);
    expect(assessment.endEjectionLinearDiagnostics.every((diagnostic) =>
      diagnostic.diagnosticPassed &&
      diagnostic.mayDefinePva === false &&
      diagnostic.rSquared !== null &&
      diagnostic.rSquared > 0.999999
    )).toBe(true);
    expect(assessment.endDiastolicLocusDiagnostics).toHaveLength(4);
    expect(assessment.endDiastolicLocusDiagnostics.every((diagnostic) =>
      diagnostic.volumeStrictlyIncreasesWithTbv &&
      diagnostic.pressureNondecreasesWithTbv &&
      diagnostic.interpolationAdmitted === false &&
      diagnostic.extrapolationAdmitted === false
    )).toBe(true);
  });

  it("fails closed when the terminal start segment is unavailable", () => {
    const run = syntheticRun(1, 20);
    const extracted = extractMainWireIntegratedModelPeriodicValveEventsV1(
      null,
      run.terminalCycleTrace,
    );

    expect(extracted.status).toBe("not-qualified");
    expect(extracted.sourceTraceComplete).toBe(false);
    expect(extracted.failureReasons).toContain(
      "terminal cycle lacks a complete exact start-to-end accepted trace",
    );
  });

  it("rejects ambiguous multiple valve-closure crossings", () => {
    const run = syntheticRun(1, 30, true);
    const assessment = assessMainWireIntegratedModelPeriodicValveEventLocusV1([
      ...MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_TBV_RATIOS_V1.map(
        (ratio, index) =>
          ratio === 1 ? run : syntheticRun(ratio, 31 + index),
      ),
    ]);

    expect(assessment.allValveEventSequencesQualified).toBe(false);
    expect(assessment.eventDefinedLocusEstablished).toBe(false);
    expect(assessment.officialExperimentEventLocusEligible).toBe(false);
    expect(assessment.endEjectionLinearDiagnostics).toEqual([]);
    const baseline = assessment.points.find((point) =>
      point.totalBloodVolumeRatio === 1
    )!;
    expect(baseline.events.leftVentricle.inletClosureCrossingCount).toBe(2);
  });
});

function syntheticRun(
  ratio: number,
  cycleStartTimeSec: number,
  duplicateInletClosure = false,
): MainWireIntegratedModelPeriodicValveEventLocusRunV1 {
  const cycleIndex = 80;
  const lvEndDiastolicVolumeMl = 118 + 45 * ratio;
  const rvEndDiastolicVolumeMl = 105 + 38 * ratio;
  const lvEndEjectionVolumeMl = 42 + 22 * ratio;
  const rvEndEjectionVolumeMl = 48 + 18 * ratio;
  const lvEndDiastolicTransmuralPressureMmHg = 2 + 8 * ratio;
  const rvEndDiastolicTransmuralPressureMmHg = 1 + 5 * ratio;
  const lvEndEjectionTransmuralPressureMmHg =
    2.2 * lvEndEjectionVolumeMl - 35;
  const rvEndEjectionTransmuralPressureMmHg =
    0.9 * rvEndEjectionVolumeMl - 18;
  const definitions = [
    {
      timeOffsetSec: 0,
      lvVolumeMl: lvEndDiastolicVolumeMl,
      rvVolumeMl: rvEndDiastolicVolumeMl,
      lvPressureMmHg: lvEndDiastolicTransmuralPressureMmHg,
      rvPressureMmHg: rvEndDiastolicTransmuralPressureMmHg,
      MV: 1,
      TV: 1,
      AoV: -1,
      PV: -1,
    },
    {
      timeOffsetSec: 0.25,
      lvVolumeMl: lvEndDiastolicVolumeMl,
      rvVolumeMl: rvEndDiastolicVolumeMl,
      lvPressureMmHg: lvEndDiastolicTransmuralPressureMmHg,
      rvPressureMmHg: rvEndDiastolicTransmuralPressureMmHg,
      MV: -1,
      TV: -1,
      AoV: 1,
      PV: 1,
    },
    {
      timeOffsetSec: 0.5,
      lvVolumeMl: lvEndEjectionVolumeMl + 4,
      rvVolumeMl: rvEndEjectionVolumeMl + 4,
      lvPressureMmHg: lvEndEjectionTransmuralPressureMmHg + 2,
      rvPressureMmHg: rvEndEjectionTransmuralPressureMmHg + 2,
      MV: duplicateInletClosure ? 1 : -1,
      TV: -1,
      AoV: 1,
      PV: 1,
    },
    {
      timeOffsetSec: 0.75,
      lvVolumeMl: lvEndEjectionVolumeMl - 4,
      rvVolumeMl: rvEndEjectionVolumeMl - 4,
      lvPressureMmHg: lvEndEjectionTransmuralPressureMmHg - 2,
      rvPressureMmHg: rvEndEjectionTransmuralPressureMmHg - 2,
      MV: -1,
      TV: -1,
      AoV: -1,
      PV: -1,
    },
    {
      timeOffsetSec: 1,
      lvVolumeMl: lvEndDiastolicVolumeMl,
      rvVolumeMl: rvEndDiastolicVolumeMl,
      lvPressureMmHg: lvEndDiastolicTransmuralPressureMmHg,
      rvPressureMmHg: rvEndDiastolicTransmuralPressureMmHg,
      MV: -1,
      TV: -1,
      AoV: -1,
      PV: -1,
    },
  ] as const;
  const samples = definitions.map((definition, index) =>
    traceSample(
      cycleIndex,
      index,
      cycleStartTimeSec,
      definition,
    )
  );
  const start = Object.freeze({
    ...samples[0]!,
    cycleIndex: cycleIndex - 1,
    acceptedStepIndexWithinCycle: 1_000,
    cyclePhase01: 1,
  });
  const terminalSamples = samples.slice(1);
  const trace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3 =
    Object.freeze({
      cycleIndex,
      startTimeSec: cycleStartTimeSec,
      endTimeSec: cycleStartTimeSec + 1,
      sampleCount: terminalSamples.length,
      samples: Object.freeze(terminalSamples),
      retainedForGraphShapeInspection: true as const,
      resamplingApplied: false as const,
      shapeAcceptanceClaimed: false as const,
      interpretation:
        "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance" as const,
    });
  const ratioIndex =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_TBV_RATIOS_V1.findIndex(
      (candidate) => Math.abs(candidate - ratio) <= 1e-12,
    );
  return Object.freeze({
    totalBloodVolumeRatio: ratio,
    totalBloodVolumeMl: 5_000 * ratio,
    nominalDtSec: 0.001,
    executionPurpose: "canonical-evidence" as const,
    modelConditionIdentityHash: sha256Fixture(ratioIndex + 1),
    protocolIdentityHash: "a".repeat(64),
    numericalPeriod1Established: true,
    allCyclesFiniteConservedAndEventExact: true,
    terminalCheckpointSha256: sha256Fixture(ratioIndex + 20),
    terminalCheckpointExactRoundTripVerified: true,
    terminalCycleStartTraceSample: start,
    terminalCycleTrace: trace,
  });
}

function traceSample(
  cycleIndex: number,
  index: number,
  cycleStartTimeSec: number,
  definition: Readonly<{
    timeOffsetSec: number;
    lvVolumeMl: number;
    rvVolumeMl: number;
    lvPressureMmHg: number;
    rvPressureMmHg: number;
    MV: number;
    AoV: number;
    TV: number;
    PV: number;
  }>,
): MainWireIntegratedModelPeriodicTerminalTraceSampleV3 {
  const externalPressureMmHg = 5;
  return Object.freeze({
    cycleIndex,
    acceptedStepIndexWithinCycle: index,
    acceptedTimeSec: cycleStartTimeSec + definition.timeOffsetSec,
    cyclePhase01: definition.timeOffsetSec,
    acceptedDtSec: index === 0 ? 0.001 : 0.25,
    chamberVolumeMl: {
      LA: 40,
      LV: definition.lvVolumeMl,
      RA: 45,
      RV: definition.rvVolumeMl,
    },
    absolutePressureMmHg: {
      LA: 10,
      LV: definition.lvPressureMmHg + externalPressureMmHg,
      RA: 7,
      RV: definition.rvPressureMmHg + externalPressureMmHg,
      Ao: 90,
      PA: 20,
      PVein: 8,
    },
    transmuralPressureMmHg: {
      LV: definition.lvPressureMmHg,
      RV: definition.rvPressureMmHg,
    },
    valveFlowMlPerSec: {
      MV: definition.MV,
      AoV: definition.AoV,
      TV: definition.TV,
      PV: definition.PV,
    },
    coronary: {
      totalInletFlowMlPerSec: 1,
      ladSubendocardialQmFlowMlPerSec: 0.1,
    },
    freeCalciumUMByWall: { LA: 0, LVFW: 0, SEP: 0, RVFW: 0, RA: 0 },
    dynamicMcsAcceptedFlowMlPerSec: {
      LVAD: 0,
      IMPELLA: 0,
      VA_ECMO: 0,
      VV_ECMO: 0,
    },
    acceptedEventIdentity: {
      atrialCapturedActivationId: null,
      ventricularCapturedActivationId: null,
      deliveredCalciumDepositIds: [],
      scheduledCalciumDepositIds: [],
    },
    diagnostics: {
      mechanicsResidualNorm: 0,
      circulationScaledResidualInfinityNorm: 0,
      maximumContinuityResidualMl: 0,
      totalBloodVolumeErrorMl: 0,
      coronaryBloodVolumeLedgerResidualMl: 0,
      dynamicMcsConservationResidualMlPerSec: 0,
    },
  });
}

function sha256Fixture(value: number): string {
  return Math.max(0, value).toString(16).padStart(64, "0");
}
