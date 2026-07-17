import { beforeAll, describe, expect, it } from "vitest";

import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV2";
import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV3,
  type MainWireNormalAdultFiveWallPeriodicResultV3,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";

describe("main-wire normal-adult five-wall periodic summary V2", () => {
  let result: MainWireNormalAdultFiveWallPeriodicResultV3;
  let analyticResult: MainWireNormalAdultFiveWallPeriodicResultV3;

  beforeAll(() => {
    result = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.02,
      maximumBeatCount: 2,
      initialization: "canonical",
      calciumRepresentation: "exact-event-state",
    });
    analyticResult = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.02,
      maximumBeatCount: 2,
      initialization: "canonical",
      calciumRepresentation:
        "analytic-periodic-control-with-exact-event-shadow",
    });
  }, 90_000);

  it("summarizes a complete exact-event beat on accepted physical intervals", () => {
    const selected = result.retainedCompleteBeats.at(-1)!;
    const beforeHash = stableHash(sanitizeForStableHash(selected.samples));
    const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2(result);

    expect(summary.status).toBe("complete");
    if (summary.status !== "complete") throw new Error("expected complete");
    expect(summary.selectedCycle).toMatchObject({
      beatIndex: 2,
      nominalGridCount: 50,
      acceptedIntervalCount: 52,
      acceptedEventCount: 2,
      precedingAcceptedSampleAvailable: true,
      rangeBoundaryCoverage: "real-predecessor-and-accepted-endpoints",
    });
    expect(summary.selectedCycle.durationSec).toBeCloseTo(1, 12);
    expect(summary.selectedCycle.minimumAcceptedDtSec).toBeLessThan(0.02);
    expect(summary.selectedCycle.maximumAcceptedDtSec).toBeCloseTo(0.02, 12);
    expect(summary.cyclePhysiology.status).toBe("measurable");
    expect(summary.physiologyAvailability.status).toBe("measurable");
    expect(summary.workEnergy).not.toBeNull();
    expect(summary.laPvMorphology.status).toBe("measured");
    expect(summary.protocol).toEqual({
      identity: result.protocolIdentity,
      identityHash: result.protocolIdentityHash,
      componentHashes: result.protocolComponentHashes,
    });
    expect(summary.bloodVolumeOperatingPoint).toMatchObject({
      status: "available",
      unavailableReason: null,
      ownerId: "main-wire-normal-adult-blood-volume-operating-point-v1",
      fixedTotalBloodVolumeMl: 5522.11,
      resolvedTotalBloodVolumeMl: 5522.11,
    });
    expect(summary.source).toMatchObject({
      pericardiumMode: result.pericardiumMode,
      pericardiumCase: result.pericardiumCase,
      pericardiumParameterSetId: result.pericardiumParameterSetId,
      valvePreset: result.valvePreset,
    });
    expect("calciumDrivePriorVariant" in summary.source).toBe(false);
    expect("bloodVolumePriorVariant" in summary.source).toBe(false);
    expect("bloodVolumePriorAudit" in summary.source).toBe(false);
    expect("variant" in summary.fixedActivationPrior).toBe(false);
    expect(summary.claim.laPvMorphologyPressureCoordinate)
      .toBe("intracavitary-absolute-pressure");
    expect(summary.claim
      .transmuralPressureReservedForWallWorkAndConstitutiveDiagnostics)
      .toBe(true);
    expect(summary.claim.bloodVolumeOperatingPointReadbackOnly).toBe(true);
    expect(stableHash(sanitizeForStableHash(selected.samples))).toBe(beforeHash);
  });

  it("uses accepted durations for Ao integration, cardiac output, and MAP", () => {
    const selected = result.retainedCompleteBeats.at(-1)!;
    const trace = selected.acceptedIntervalTrace;
    if (trace.status !== "complete") throw new Error("expected complete trace");
    const manualAorticStrokeVolumeMl = trace.intervals.reduce(
      (total, interval) => total
        + interval.endpointSample.sample.flowMlPerSec.AoV
          * interval.durationSec,
      0,
    );
    const manualForwardAorticStrokeVolumeMl = trace.intervals.reduce(
      (total, interval) => total
        + Math.max(interval.endpointSample.sample.flowMlPerSec.AoV, 0)
          * interval.durationSec,
      0,
    );
    const manualMapMmHg = trace.intervals.reduce(
      (total, interval) => total
        + interval.endpointSample.sample.nodeAbsolutePressureMmHg.Ao
          * interval.durationSec,
      0,
    ) / trace.durationSec;
    const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2(result);
    if (summary.status !== "complete") throw new Error("expected complete");

    expect(new Set(trace.intervals.map((interval) => interval.durationSec)).size)
      .toBeGreaterThan(1);
    expect(summary.flowLedgers.AoV.signedVolumeMl)
      .toBeCloseTo(manualAorticStrokeVolumeMl, 12);
    expect(summary.flowLedgers.AoV.forwardVolumeMl)
      .toBeCloseTo(manualForwardAorticStrokeVolumeMl, 12);
    expect(summary.hemodynamics.netAorticStrokeVolumeMl)
      .toBeCloseTo(manualAorticStrokeVolumeMl, 12);
    expect(summary.hemodynamics.netAorticCardiacOutputLPerMin)
      .toBeCloseTo(manualAorticStrokeVolumeMl / trace.durationSec * 60 / 1000, 12);
    expect(summary.hemodynamics.meanAorticAbsolutePressureMmHg)
      .toBeCloseTo(manualMapMmHg, 12);
    expect(summary.flowLedgers.MV.durationSec).toBeCloseTo(trace.durationSec, 12);
    expect(summary.flowLedgers.PV.durationSec).toBeCloseTo(trace.durationSec, 12);
  });

  it("includes the real preceding boundary in complete extrema", () => {
    const selected = result.retainedCompleteBeats.at(-1)!;
    const trace = selected.acceptedIntervalTrace;
    if (trace.status !== "complete") throw new Error("expected complete trace");
    const volumes = [
      trace.precedingSample.sample.nodeVolumeMl.LA,
      ...trace.intervals.map((interval) =>
        interval.endpointSample.sample.nodeVolumeMl.LA),
    ];
    const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2(result);
    if (summary.status !== "complete") throw new Error("expected complete");
    expect(summary.rawRanges.chamberVolumeMl.LA).toEqual({
      minimum: Math.min(...volumes),
      maximum: Math.max(...volumes),
    });
  });

  it("keeps cold endpoint readbacks but withholds difference-based outputs", () => {
    const first = result.retainedCompleteBeats[0]!;
    expect(first.acceptedIntervalTrace.status)
      .toBe("missing-preceding-diagnostic");
    const coldOnly = Object.freeze({
      ...result,
      retainedCompleteBeats: Object.freeze([first]),
    });
    const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2(coldOnly);

    expect(summary).toMatchObject({
      status: "not-measurable",
      reason: "missing-preceding-diagnostic",
      selectedCycle: {
        beatIndex: 1,
        nominalGridCount: 50,
        acceptedIntervalCount: 52,
        precedingAcceptedSampleAvailable: false,
        rangeBoundaryCoverage: "accepted-endpoints-only",
      },
      physiologyAvailability: {
        status: "not-measurable",
        reason: "missing-preceding-diagnostic",
        detail: "cold-start",
      },
      flowLedgers: null,
      hemodynamics: null,
      cyclePhysiology: null,
      workEnergy: null,
      laPvMorphology: null,
    });
    expect(summary.rawRanges.chamberVolumeMl.LA.maximum)
      .toBeGreaterThan(summary.rawRanges.chamberVolumeMl.LA.minimum);
  });

  it("uses absolute LA pressure for PV shape but transmural pressure for wall work", () => {
    const baseline = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2(result);
    const selectedBeat = result.retainedCompleteBeats.at(-1)!;
    const retainedCompleteBeats = Object.freeze([
      ...result.retainedCompleteBeats.slice(0, -1),
      shiftAcceptedBeatExternalPressure(selectedBeat),
    ]);
    const shifted = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2({
      ...result,
      retainedCompleteBeats,
    });
    if (baseline.status !== "complete" || shifted.status !== "complete") {
      throw new Error("expected complete summaries");
    }
    if (
      baseline.cyclePhysiology.status !== "measurable"
      || shifted.cyclePhysiology.status !== "measurable"
      || baseline.workEnergy === null
      || shifted.workEnergy === null
    ) throw new Error("expected measurable cycle work");

    expect(shifted.laPvMorphology).not.toEqual(baseline.laPvMorphology);
    expect(shifted.rawRanges.chamberTransmuralPressureMmHg.LA)
      .toEqual(baseline.rawRanges.chamberTransmuralPressureMmHg.LA);
    expect(shifted.workEnergy.cavityWorkOnWallMilliJ.LA)
      .toBe(baseline.workEnergy.cavityWorkOnWallMilliJ.LA);
  });

  it("keeps the uniform analytic control on its 50 accepted intervals", () => {
    const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2(
      analyticResult,
    );
    expect(summary.status).toBe("complete");
    if (summary.status !== "complete") throw new Error("expected complete");
    expect(summary.selectedCycle).toMatchObject({
      nominalGridCount: 50,
      acceptedIntervalCount: 50,
      acceptedEventCount: 2,
    });
    expect(summary.selectedCycle.minimumAcceptedDtSec).toBeCloseTo(0.02, 12);
    expect(summary.selectedCycle.maximumAcceptedDtSec).toBeCloseTo(0.02, 12);
    expect(summary.cyclePhysiology.status).toBe("measurable");
  });
});

type RetainedBeatV3 =
  MainWireNormalAdultFiveWallPeriodicResultV3["retainedCompleteBeats"][number];
type DiagnosticSampleV2 = RetainedBeatV3["samples"][number];

function shiftAcceptedBeatExternalPressure(
  beat: RetainedBeatV3,
): RetainedBeatV3 {
  const trace = beat.acceptedIntervalTrace;
  if (trace.status !== "complete") {
    throw new Error("external-pressure regression requires a complete trace");
  }
  const samples = Object.freeze(beat.samples.map(shiftExternalPressure));
  const intervals = Object.freeze(trace.intervals.map((interval, index) =>
    Object.freeze({
      ...interval,
      endpointSample: Object.freeze({
        ...interval.endpointSample,
        sample: samples[index]!,
      }),
    })));
  return Object.freeze({
    ...beat,
    samples,
    acceptedIntervalTrace: Object.freeze({
      ...trace,
      precedingSample: Object.freeze({
        ...trace.precedingSample,
        sample: shiftExternalPressure(trace.precedingSample.sample),
      }),
      intervals,
    }),
  });
}

function shiftExternalPressure(
  sample: DiagnosticSampleV2,
): DiagnosticSampleV2 {
  const externalOffsetMmHg = 3 * Math.sin(
    2 * Math.PI * sample.cyclePhase01 + 0.37,
  );
  return Object.freeze({
    ...sample,
    nodeAbsolutePressureMmHg: Object.freeze({
      ...sample.nodeAbsolutePressureMmHg,
      LA: sample.nodeAbsolutePressureMmHg.LA + externalOffsetMmHg,
      LV: sample.nodeAbsolutePressureMmHg.LV + externalOffsetMmHg,
      RA: sample.nodeAbsolutePressureMmHg.RA + externalOffsetMmHg,
      RV: sample.nodeAbsolutePressureMmHg.RV + externalOffsetMmHg,
    }),
    commonPericardium: Object.freeze({
      ...sample.commonPericardium,
      excessPressureMmHg:
        sample.commonPericardium.excessPressureMmHg + externalOffsetMmHg,
    }),
  });
}
