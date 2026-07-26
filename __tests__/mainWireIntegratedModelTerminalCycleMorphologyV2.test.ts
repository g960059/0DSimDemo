import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_MORPHOLOGY_V2_CLAIM,
  MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_MORPHOLOGY_V2_ID,
  MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_STATIONS_V2,
  describeMainWireIntegratedModelTerminalCycleMorphologyV2,
} from "@/engine/myocardium/diagnostics/MainWireIntegratedModelTerminalCycleMorphologyV2";
import type {
  MainWireIntegratedModelTerminalCycleTraceV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";
import {
  describeMainWireIntegratedModelTerminalCycleMorphologyCliV2,
} from "@/tools/scientific/describeMainWireIntegratedModelTerminalCycleMorphologyV2";

describe("integrated V2 raw terminal-cycle morphology descriptor", () => {
  it("reports event-defined volumes, signed flow ledgers, phase integrals, and raw loop descriptors without acceptance", () => {
    const trace = fixtureTrace();
    const before = JSON.stringify(trace);
    const descriptor =
      describeMainWireIntegratedModelTerminalCycleMorphologyV2(trace);

    expect(JSON.stringify(trace)).toBe(before);
    expect(descriptor.descriptorId).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_MORPHOLOGY_V2_ID,
    );
    expect(descriptor.claim).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_MORPHOLOGY_V2_CLAIM,
    );
    expect(descriptor.stations).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_STATIONS_V2,
    );
    expect(descriptor.pressure.aortic.timeWeightedMean).toBe(82.5);
    expect(descriptor.pressure.leftVentricular.timeWeightedMean).toBe(50.25);
    expect(descriptor.pressure.lvMinusAoCrossings.count).toBe(2);
    expect(descriptor.pressure.lvMinusAoCrossings.order.map(
      (event) => event.direction,
    )).toEqual(["LV-rises-above-Ao", "LV-falls-below-Ao"]);
    expect(descriptor.pressure.lvMinusAoCrossings.detection)
      .toContain("no-interpolation");

    expect(descriptor.valveEvents.systolicWindow.available).toBe(true);
    expect(descriptor.valveEvents.systolicWindow.wrapsTraceBoundary).toBe(false);
    expect(descriptor.valveEvents.systolicWindow.startMitralClosure
      ?.acceptedStepIndexWithinCycle).toBe(2);
    expect(descriptor.valveEvents.systolicWindow.aorticOpening
      ?.acceptedStepIndexWithinCycle).toBe(3);
    expect(descriptor.valveEvents.systolicWindow.aorticClosure
      ?.acceptedStepIndexWithinCycle).toBe(5);
    expect(descriptor.valveEvents.systolicWindow.endMitralOpening
      ?.acceptedStepIndexWithinCycle).toBe(6);
    expect(descriptor.leftVentricularVolume.endDiastolic).toMatchObject({
      available: true,
      valueMl: 130,
    });
    expect(descriptor.leftVentricularVolume.endSystolic).toMatchObject({
      available: true,
      valueMl: 70,
    });
    expect(descriptor.leftVentricularVolume.lvefReported).toBe(false);
    expect(descriptor.leftVentricularVolume.rawExtremaRelabeledAsEdvOrEsv)
      .toBe(false);

    expect(descriptor.flowLedger.nativeAorticValve).toEqual({
      forwardStrokeVolumeMl: 30,
      reverseVolumeMagnitudeMl: 0,
      netStrokeVolumeMl: 30,
    });
    expect(descriptor.flowLedger.lvad).toEqual({
      signedBeatVolumeMl: 45,
      forwardBeatVolumeMl: 46.25,
      reverseBeatVolumeMagnitudeMl: 1.25,
    });
    expect(descriptor.flowLedger.combined.forwardBeatVolumeMl).toBe(76.25);
    expect(descriptor.flowLedger.combined.netBeatVolumeMl).toBe(75);
    expect(descriptor.flowLedger.combined.forwardOutputLMin).toBe(4.575);
    expect(descriptor.flowLedger.combined.netOutputLMin).toBe(4.5);
    expect(descriptor.flowLedger.combined.lvadForwardSupportFraction01)
      .toBeCloseTo(46.25 / 76.25, 15);

    expect(descriptor.lvadFlow.timeWeightedMeanMlPerSec).toBe(45);
    expect(descriptor.lvadFlow.minimumMlPerSec).toBe(-10);
    expect(descriptor.lvadFlow.maximumMlPerSec).toBe(80);
    expect(descriptor.lvadFlow.forwardResidenceFraction01).toBe(0.875);
    expect(descriptor.lvadFlow.reverseResidenceFraction01).toBe(0.125);
    expect(descriptor.lvadFlow.zeroResidenceFraction01).toBe(0);
    expect(descriptor.lvadFlow.literatureFlowResidenceFraction01)
      .toMatchObject({
        below3LMin: 0.5,
        below3Point8LMin: 0.75,
        above10LMin: 0,
      });
    expect(descriptor.lvadFlow.rawPulsatilityIndex).toBe(2);
    expect(descriptor.lvadFlow.rawPulsatilityFormula).toContain("maximum");
    expect(descriptor.lvadFlow.commercialPumpPiClaimed).toBe(false);
    expect(descriptor.lvadFlow.evidenceDomainResidenceFraction01).toEqual({
      "not-declared": 0,
      "non-forward-flow-not-applicable": 0.125,
      "within-published-experimental-domain": 0.625,
      "above-published-experimental-domain-within-advertised-capacity": 0.125,
      "above-advertised-capacity": 0.125,
    });
    expect(descriptor.lvadFlow.publishedExperimentalTraversalUpperLMin).toBe(9);
    expect(descriptor.lvadFlow.advertisedCapacityLMin).toBe(10);
    expect(descriptor.lvadFlow.pumpPressureReadback
      .maximumAbsolutePostMinusPreIdentityResidualMmHg).toBe(0);

    expect(Number.isFinite(
      descriptor.pressureVolumeLoop.signedClosedPolygonAreaMmHgMl,
    )).toBe(true);
    expect(["clockwise", "counterclockwise", "degenerate"])
      .toContain(descriptor.pressureVolumeLoop.orientation);
    expect(typeof descriptor.pressureVolumeLoop.selfIntersection.present)
      .toBe("boolean");
    expect(descriptor.lvadHeadFlowLoop.traversal).toMatchObject({
      flowMinimumMlPerSec: -10,
      flowMaximumMlPerSec: 80,
      flowRangeMlPerSec: 90,
      pressureRiseMinimumMmHg: 50,
      pressureRiseMaximumMmHg: 85,
      pressureRiseRangeMmHg: 35,
    });
    expect(descriptor.lvadHeadFlowLoop.traversal
      .pressureMaximumMinusFlowMaximumLagSec).toBe(0.125);
    expect(descriptor.lvadHeadFlowLoop.traversal
      .pressureMaximumMinusFlowMaximumLagPhase01).toBe(0.125);
    expect(Number.isFinite(
      descriptor.lvadHeadFlowLoop.signedClosedPolygonAreaMmHgMlPerSec,
    )).toBe(true);

    expect(descriptor.coronaryPhaseLedger.aggregateAorticInlet).toMatchObject({
      available: true,
      systolicDurationSec: 0.5,
      diastolicDurationSec: 0.5,
      systolicSignedIntegralMl: 1.125,
      diastolicSignedIntegralMl: 1.625,
      systolicForwardIntegralMl: 1.125,
      diastolicForwardIntegralMl: 1.625,
    });
    expect(descriptor.coronaryPhaseLedger.aggregateAorticInlet
      .diastolicToSystolicMeanFlowRatio)
      .toBeCloseTo(3.25 / 2.25, 15);
    expect(descriptor.coronaryPhaseLedger.ladSubendocardialInternalQm
      .diastolicToSystolicMeanFlowRatio).toBeCloseTo(3.25 / 2.25, 15);
    expect(descriptor.coronaryPhaseLedger.directCrossStationRatioOrAcceptanceAllowed)
      .toBe(false);
    expect(descriptor.allReportedNumbersFinite).toBe(true);
    expect(descriptor.physiologicalAcceptanceEstablished).toBe(false);
    expect(descriptor.shapeAcceptanceEstablished).toBe(false);
    expect(descriptor.claim.isovolumicPhasesRequiredForDeviceOnDescription)
      .toBe(false);
    expect(descriptor.claim.physiologicalAcceptanceClaimed).toBe(false);
    expect(descriptor.claim.shapeAcceptanceClaimed).toBe(false);
  });

  it("makes event-defined EDV/ESV and coronary phase metrics explicitly unavailable when valve transitions are absent", () => {
    const trace = mutableFixtureTrace();
    for (const sample of trace.samples) {
      for (const valveId of ["MV", "AoV"] as const) {
        sample.valve[valveId].openingTarget01 = 0.5;
        sample.valve[valveId].openingDriveState = "positive-opening-target";
      }
    }
    const descriptor = describeMainWireIntegratedModelTerminalCycleMorphologyV2(
      trace as unknown as MainWireIntegratedModelTerminalCycleTraceV2,
    );
    expect(descriptor.valveEvents.systolicWindow.available).toBe(false);
    expect(descriptor.leftVentricularVolume.endDiastolic.available).toBe(false);
    expect(descriptor.leftVentricularVolume.endSystolic.available).toBe(false);
    expect(descriptor.coronaryPhaseLedger.aggregateAorticInlet.available)
      .toBe(false);
    expect(descriptor.coronaryPhaseLedger.ladSubendocardialInternalQm.available)
      .toBe(false);
    expect(descriptor.coronaryPhaseLedger.aggregateAorticInlet
      .diastolicToSystolicMeanFlowRatio)
      .toBeNull();
  });

  it("resolves an accepted-endpoint valve-event systolic window that wraps the trace boundary without interpolation", () => {
    const trace = mutableFixtureTrace();
    const mvTargets = [0, 0, 0, 0, 0, 0.5, 0, 0];
    const aovTargets = [0, 0.5, 0.5, 0, 0, 0, 0, 0];
    for (const [index, sample] of trace.samples.entries()) {
      for (const [valveId, targets] of [
        ["MV", mvTargets],
        ["AoV", aovTargets],
      ] as const) {
        sample.valve[valveId].openingTarget01 = targets[index]!;
        sample.valve[valveId].openingDriveState = targets[index]! === 0
          ? "zero-opening-target" : "positive-opening-target";
      }
    }
    const descriptor = describeMainWireIntegratedModelTerminalCycleMorphologyV2(
      trace as unknown as MainWireIntegratedModelTerminalCycleTraceV2,
    );
    const window = descriptor.valveEvents.systolicWindow;
    expect(window.available).toBe(true);
    expect(window.wrapsTraceBoundary).toBe(true);
    expect(window.startMitralClosure?.acceptedStepIndexWithinCycle).toBe(7);
    expect(window.aorticOpening?.acceptedStepIndexWithinCycle).toBe(2);
    expect(window.aorticClosure?.acceptedStepIndexWithinCycle).toBe(4);
    expect(window.endMitralOpening?.acceptedStepIndexWithinCycle).toBe(6);
    expect(descriptor.leftVentricularVolume.endSystolic.available).toBe(true);
    expect(descriptor.coronaryPhaseLedger.aggregateAorticInlet.available)
      .toBe(true);
    expect((descriptor.coronaryPhaseLedger.aggregateAorticInlet
      .systolicDurationSec ?? 0)
      + (descriptor.coronaryPhaseLedger.aggregateAorticInlet
        .diastolicDurationSec ?? 0)).toBeCloseTo(1, 14);
  });

  it("fails closed for inconsistent model-branch labels or changing evidence limits", () => {
    const badOpeningState = mutableFixtureTrace();
    badOpeningState.samples[0]!.valve.MV.openingDriveState =
      "zero-opening-target";
    expect(() => describeMainWireIntegratedModelTerminalCycleMorphologyV2(
      badOpeningState as unknown as MainWireIntegratedModelTerminalCycleTraceV2,
    )).toThrow(/openingDriveState/);

    const changingEvidenceLimit = mutableFixtureTrace();
    changingEvidenceLimit.samples[3]!.lvad
      .forwardFlowAdvertisedCapacityLMin = 11;
    expect(() => describeMainWireIntegratedModelTerminalCycleMorphologyV2(
      changingEvidenceLimit as unknown as MainWireIntegratedModelTerminalCycleTraceV2,
    )).toThrow(/evidence limits changed/);

    const reverseMislabeledAsForwardEvidence = mutableFixtureTrace();
    reverseMislabeledAsForwardEvidence.samples[5]!.lvad
      .forwardFlowEvidenceStatus = "within-published-experimental-domain";
    expect(() => describeMainWireIntegratedModelTerminalCycleMorphologyV2(
      reverseMislabeledAsForwardEvidence as unknown as
        MainWireIntegratedModelTerminalCycleTraceV2,
    )).toThrow(/non-forward LVAD flow/);
  });

  it("derives a morphology JSON artifact from a serialized periodic-result envelope without rerunning the model", () => {
    const temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), "circleheart-integrated-morphology-"),
    );
    try {
      const inputPath = path.join(temporaryDirectory, "periodic.json");
      const outputPath = path.join(temporaryDirectory, "morphology.json");
      writeFileSync(inputPath, JSON.stringify({
        terminalCycleTrace: fixtureTrace(),
      }));

      const result =
        describeMainWireIntegratedModelTerminalCycleMorphologyCliV2([
          "--input",
          inputPath,
          "--output",
          outputPath,
        ]);
      expect(result).toEqual({ inputPath, outputPath });
      const written = JSON.parse(readFileSync(outputPath, "utf8")) as {
        descriptorId: string;
        physiologicalAcceptanceEstablished: boolean;
      };
      expect(written.descriptorId).toBe(
        MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_MORPHOLOGY_V2_ID,
      );
      expect(written.physiologicalAcceptanceEstablished).toBe(false);
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});

function fixtureTrace(): MainWireIntegratedModelTerminalCycleTraceV2 {
  const dtSec = 0.125;
  const lvPressure = [8, 20, 100, 110, 65, 35, 30, 34];
  const aoPressure = [75, 78, 85, 95, 90, 82, 79, 76];
  const lvVolume = [125, 130, 120, 95, 70, 75, 100, 120];
  const aovFlow = [0, 0, 80, 100, 60, 0, 0, 0];
  const mvFlow = [40, 0, 0, 0, 0, 30, 50, 45];
  const lvadFlow = [40, 50, 60, 70, 80, -10, 30, 40];
  const lvadHead = [70, 65, 55, 50, 60, 85, 80, 75];
  const coronaryFlow = [2, 2, 1, 1, 3, 4, 5, 4];
  const mvTarget = [0.6, 0, 0, 0, 0, 0.5, 0.7, 0.6];
  const aovTarget = [0, 0, 0.7, 0.8, 0, 0, 0, 0];
  return Object.freeze({
    cycleIndex: 7,
    startTimeSec: 0,
    endTimeSec: 1,
    sampleCount: 8,
    samples: Object.freeze(Array.from({ length: 8 }, (_, index) => {
      const step = index + 1;
      return Object.freeze({
        cycleIndex: 7,
        acceptedStepIndexWithinCycle: step,
        acceptedTimeSec: step * dtSec,
        cyclePhase01: step * dtSec,
        acceptedDtSec: dtSec,
        signal: Object.freeze({
          lvadFlowMlPerSec: lvadFlow[index]!,
          lvadPressureRiseMmHg: lvadHead[index]!,
          aorticPressureMmHg: aoPressure[index]!,
          leftVentricularPressureMmHg: lvPressure[index]!,
          leftVentricularVolumeMl: lvVolume[index]!,
          totalCoronaryInletFlowMlPerSec: coronaryFlow[index]!,
          ladSubendocardialQmFlowMlPerSec: coronaryFlow[index]! / 5,
        }),
        valve: Object.freeze({
          MV: valveEndpoint(mvFlow[index]!, mvTarget[index]!),
          AoV: valveEndpoint(aovFlow[index]!, aovTarget[index]!),
        }),
        lvad: Object.freeze({
          unrestrictedFlowMlPerSec: lvadFlow[index]!,
          flowAccelerationMlPerSec2: 0,
          inletAvailability01: 1,
          constraintOwner: "none" as const,
          constraintReactionMmHg: 0,
          forwardFlowEvidenceStatus:
            index === 5
              ? "non-forward-flow-not-applicable" as const
              : index < 6
              ? "within-published-experimental-domain" as const
              : index === 6
                ? "above-published-experimental-domain-within-advertised-capacity" as const
                : "above-advertised-capacity" as const,
          forwardFlowPublishedExperimentalTraversalUpperLMin: 9,
          forwardFlowAdvertisedCapacityLMin: 10,
          prePumpPressureMmHg: 5,
          postPumpPressureMmHg: 5 + lvadHead[index]!,
          deliveredPumpPressureRiseMmHg: lvadHead[index]!,
        }),
        acceptedEffectiveActivationEventIds: Object.freeze([]),
      });
    })),
    retainedForGraphShapeInspection: true as const,
    eligibleForNumericalOrPhysiologicalShapeGate: false as const,
    interpretation:
      "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance" as const,
  });
}

function valveEndpoint(signedFlowMlPerSec: number, openingTarget01: number) {
  const positive = openingTarget01 > 0;
  return Object.freeze({
    signedFlowMlPerSec,
    leafletOpeningFraction01: positive ? 0.7 : 0.1,
    openingTarget01,
    openingDriveState: positive
      ? "positive-opening-target" as const
      : "zero-opening-target" as const,
    activeDirection: signedFlowMlPerSec > 0
      ? "forward" as const
      : signedFlowMlPerSec < 0 ? "reverse" as const : "zero-gradient" as const,
    activeEffectiveOrificeAreaCm2: positive ? 2 : 0.1,
    forwardEffectiveOrificeAreaCm2: positive ? 2 : 0.1,
    reverseEffectiveOrificeAreaCm2: 0.1,
  });
}

type MutableFixtureTrace = Readonly<{
  samples: Array<{
    valve: Record<"MV" | "AoV", {
      openingTarget01: number;
      openingDriveState: "zero-opening-target" | "positive-opening-target";
    }>;
    lvad: {
      forwardFlowAdvertisedCapacityLMin: number | null;
      forwardFlowEvidenceStatus:
        | "not-declared"
        | "non-forward-flow-not-applicable"
        | "within-published-experimental-domain"
        | "above-published-experimental-domain-within-advertised-capacity"
        | "above-advertised-capacity";
    };
  }>;
}>;

function mutableFixtureTrace(): MutableFixtureTrace {
  return structuredClone(fixtureTrace()) as unknown as MutableFixtureTrace;
}
