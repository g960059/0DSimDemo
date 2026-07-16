import { describe, expect, it } from "vitest";
import type {
  BloodCompartmentId,
  FourChamberFlowId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  NORMAL_ADULT_TARGET_PACK_V1,
} from "@/engine/myocardium/fourChamberV1/physiology/normalAdultTargetPackV1";
import {
  PHASE_B1_PHYSIOLOGY_ENVELOPE_REQUIRED_NORMAL_TARGET_METRICS_V1,
  PHASE_B1_PHYSIOLOGY_ENVELOPE_UNIMPLEMENTED_NORMAL_TARGET_PATHS_V1,
  buildPhaseB1PhysiologyEnvelopeNormalTargetSetV1,
  evaluatePhaseB1PhysiologyEnvelopeMetricsFromCommittedEvaluationsV1,
  evaluatePhaseB1PhysiologyEnvelopeMetricsFromTerminalWaveformV1,
  evaluatePhaseB1PhysiologyEnvelopeMetricsV1,
  phaseB1PhysiologyEnvelopeMetricSamplesFromCommittedEvaluationsV1,
  type PhaseB1PhysiologyEnvelopeFillingPhaseWindowsV1,
  type PhaseB1PhysiologyEnvelopeMetricSampleV1,
  type PhaseB1PhysiologyEnvelopeNormalTargetSetV1,
} from "@/tools/myocardium/phaseB1PhysiologyEnvelopeMetricsV1";
import type {
  PhaseB1TerminalWaveformSeriesV1,
} from "@/tools/myocardium/phaseB1TerminalWaveformArtifactV1";

const WINDOWS: PhaseB1PhysiologyEnvelopeFillingPhaseWindowsV1 = Object.freeze({
  mitralEarly: Object.freeze({
    windowId: "test-mv-e",
    startPhaseSec: 0.4,
    endPhaseSec: 0.65,
  }),
  mitralAtrial: Object.freeze({
    windowId: "test-mv-a",
    startPhaseSec: 0.05,
    endPhaseSec: 0.3,
  }),
  pulmonaryVenousSystolic: Object.freeze({
    windowId: "test-pv-s",
    startPhaseSec: 0.05,
    endPhaseSec: 0.35,
  }),
  pulmonaryVenousDiastolic: Object.freeze({
    windowId: "test-pv-d",
    startPhaseSec: 0.4,
    endPhaseSec: 0.65,
  }),
  pulmonaryVenousAtrialReversal: Object.freeze({
    windowId: "test-pv-ar-wrap",
    startPhaseSec: 0.7,
    endPhaseSec: 0.1,
  }),
});

describe("Phase B1 physiology-envelope metrics", () => {
  it("evaluates a complete BE-left-limit cycle without letting PV morphology select it", () => {
    const result = evaluatePhaseB1PhysiologyEnvelopeMetricsV1({
      cycleStartTimeSec: 10,
      cycleLengthSec: 1,
      samples: completeCycleSamples(),
      integrationSource: "committed-backward-euler-left-limit-evaluations",
      phaseWindows: WINDOWS,
      periodEndpointMaximumNormalizedDistance: 1e-3,
      normalTargets: normalTargets(),
    });

    expect(result.totalBloodVolume.status).toBe("available");
    expect(result.totalBloodVolume.maximumRelativeDrift).toBeLessThan(1e-15);
    expect(result.volumeByChamber.LV.minimumM3).toBeCloseTo(50e-6, 14);
    expect(result.volumeByChamber.LV.maximumM3).toBeCloseTo(120e-6, 14);
    expect(result.volumeByChamber.LV.strokeVolumeM3).toBeCloseTo(70e-6, 14);
    expect(result.volumeByChamber.LV.ejectionFractionFromExtrema)
      .toBeCloseTo(70 / 120, 12);
    expect(result.volumeByChamber.RV.ejectionFractionFromExtrema)
      .toBeCloseTo(75 / 130, 12);
    expect(result.circulation.left.volumeCardiacOutputLPerMin)
      .toBeCloseTo(4.2, 12);
    expect(result.circulation.right.volumeCardiacOutputLPerMin)
      .toBeCloseTo(4.5, 12);
    expect(result.circulation.left.signedOutflowCardiacOutputLPerMin)
      .toBeCloseTo(4.2, 12);
    expect(result.circulation.right.signedOutflowCardiacOutputLPerMin)
      .toBeCloseTo(4.5, 12);
    expect(result.flowById.Q_AoV.forwardVolumeM3).toBeCloseTo(70e-6, 14);
    expect(result.flowById.Q_AoV.regurgitantVolumeM3).toBe(0);
    expect(result.circulation.left.forwardOutflowMinusVolumeStrokeVolumeM3)
      .toBeCloseTo(0, 14);

    expect(result.filling.mitral.eToAPeakRatio).toBeCloseTo(2, 12);
    expect(result.filling.mitral.eToAForwardVolumeRatio)
      .toBeCloseTo(27.5 / 30, 12);
    expect(result.filling.pulmonaryVenous.sToDPeakRatio)
      .toBeCloseTo(0.8, 12);
    expect(result.filling.pulmonaryVenous.sToDForwardVolumeRatio)
      .toBeCloseTo(2.6, 12);
    expect(result.filling.pulmonaryVenous.atrialReversalVolumeM3)
      .toBeCloseTo(5.5e-6, 14);
    expect(result.filling.pulmonaryVenous.atrialReversal.wrapsCycleBoundary)
      .toBe(true);

    expect(result.terminalCycleClosure).toMatchObject({
      status: "complete-all-eight-compartments",
      integrationRule: "backward-euler-right-endpoint-rectangle",
      missingCompartmentIds: [],
      maximumAbsoluteStorageDeltaM3: 0,
    });
    expect(result.terminalCycleClosure.incidenceIntegratedVolumeChangeM3ByCompartment.LA)
      .toBeCloseTo(-50e-6, 14);
    expect(result.terminalCycleClosure.incidenceIntegralResidualM3ByCompartment.LA)
      .toBeCloseTo(50e-6, 14);
    expect(result.terminalCycleClosure.maximumAbsoluteIncidenceIntegralResidualM3)
      .toBeCloseTo(50e-6, 14);
    expect(result.terminalCycleClosure.summedIncidenceIntegratedVolumeChangeM3)
      .toBeCloseTo(0, 14);

    expect(result.normalTargetGate).toMatchObject({
      requiredTargetCoveragePass: true,
      periodTargetPass: true,
      inputEligibilityPass: true,
      physiologyBandComparisonStatus: "eligible-after-period-target-pass",
      physiologyBandComparisonsAreProvisional: false,
      everyHardTargetPass: true,
      pass: true,
      scalarScoreComputed: false,
      candidateRankingPerformed: false,
    });
    expect(result.atrialPvLoopMorphology).toEqual({
      status: "held-out-not-evaluated-by-operating-point-metrics",
      selectable: false,
      contributesToNormalTargetGate: false,
      contributesToScalarScore: false,
    });
    expect(result.claimBoundary.atrialPvShapeFittingPerformed).toBe(false);
    expect(result.claimBoundary).toMatchObject({
      stageOneHardCardiacOutputUsesSignedValveFlowIntegral: true,
      chamberVolumeAndEjectionFractionAreStageTwoSupportiveReadback: true,
      fixedFillingWindowReadbackIsSecondary: true,
      fixedFillingWindowClinicalDopplerMappingValidated: false,
      fixedFillingWindowReadbackContributesToGate: false,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("fails the normal target gate when conserved TBV is perturbed", () => {
    const samples = completeCycleSamples().map((sample, index, all) =>
      index === all.length - 1
        ? Object.freeze({
          ...sample,
          bloodVolumesM3: Object.freeze({
            ...sample.bloodVolumesM3,
            PV: sample.bloodVolumesM3.PV! + 100e-6,
          }),
        })
        : sample);
    const result = evaluatePhaseB1PhysiologyEnvelopeMetricsV1({
      cycleStartTimeSec: 10,
      cycleLengthSec: 1,
      samples,
      integrationSource: "committed-backward-euler-left-limit-evaluations",
      phaseWindows: WINDOWS,
      periodEndpointMaximumNormalizedDistance: 1e-3,
      normalTargets: normalTargets(),
    });

    expect(result.totalBloodVolume.maximumRelativeDrift).toBeGreaterThan(0.02);
    expect(result.terminalCycleClosure.maximumAbsoluteStorageDeltaM3)
      .toBeCloseTo(100e-6, 14);
    expect(result.normalTargetGate.targetResults.find((gate) =>
      gate.metricId === "tbv.maximumRelativeDrift")?.pass).toBe(false);
    expect(result.normalTargetGate.pass).toBe(false);
  });

  it("uses signed semilunar-valve flow CO for Stage 1 while retaining volume excursion diagnostics", () => {
    const samples = completeCycleSamples().map((sample, index) => {
      if (index !== 2) return sample;
      return Object.freeze({
        ...sample,
        bloodVolumesM3: Object.freeze({
          ...sample.bloodVolumesM3,
          LV: 30e-6,
          SA: sample.bloodVolumesM3.SA! + 20e-6,
          RV: 30e-6,
          PA: sample.bloodVolumesM3.PA! + 25e-6,
        }),
      });
    });
    const result = evaluatePhaseB1PhysiologyEnvelopeMetricsV1({
      cycleStartTimeSec: 10,
      cycleLengthSec: 1,
      samples,
      integrationSource: "committed-backward-euler-left-limit-evaluations",
      phaseWindows: WINDOWS,
      periodEndpointMaximumNormalizedDistance: 1e-3,
      normalTargets: normalTargets(),
    });

    expect(result.circulation.left.volumeCardiacOutputLPerMin)
      .toBeCloseTo(5.4, 12);
    expect(result.circulation.right.volumeCardiacOutputLPerMin)
      .toBeCloseTo(6, 12);
    expect(result.circulation.left.signedOutflowCardiacOutputLPerMin)
      .toBeCloseTo(4.2, 12);
    expect(result.circulation.right.signedOutflowCardiacOutputLPerMin)
      .toBeCloseTo(4.5, 12);
    const leftOutputGate = result.normalTargetGate.targetResults.find((gate) =>
      gate.gateId === "co-left");
    expect(leftOutputGate).toMatchObject({
      metricId: "circulation.left.signedOutflowCardiacOutputLPerMin",
      pass: true,
    });
    expect(leftOutputGate?.observed).toBeCloseTo(4.2, 12);
    expect(result.normalTargetGate.everyHardTargetPass).toBe(true);
    expect(result.normalTargetGate.everySupportiveTargetPass).toBe(false);
    expect(result.normalTargetGate.pass).toBe(true);
  });

  it("marks all physiology-band comparisons provisional until the period target actually passes", () => {
    const result = evaluatePhaseB1PhysiologyEnvelopeMetricsV1({
      cycleStartTimeSec: 10,
      cycleLengthSec: 1,
      samples: completeCycleSamples(),
      integrationSource: "committed-backward-euler-left-limit-evaluations",
      phaseWindows: WINDOWS,
      periodEndpointMaximumNormalizedDistance: 0.02,
      normalTargets: normalTargets(),
    });

    expect(result.periodicity).toMatchObject({
      available: true,
      maximumNormalizedDistance: 0.02,
    });
    expect(result.normalTargetGate).toMatchObject({
      periodTargetPass: false,
      inputEligibilityPass: false,
      physiologyBandComparisonStatus: "provisional-period-target-not-passed",
      physiologyBandComparisonsAreProvisional: true,
      everyHardTargetPass: false,
      pass: false,
    });
    expect(result.normalTargetGate.targetResults.find((gate) =>
      gate.gateId === "co-left")?.pass).toBe(true);
  });

  it("adapts the existing waveform projection while refusing a physiology gate", () => {
    const result = evaluatePhaseB1PhysiologyEnvelopeMetricsFromTerminalWaveformV1({
      waveform: terminalWaveform(completeCycleSamples()),
      cycleStartTimeSec: 10,
      cycleLengthSec: 1,
      phaseWindows: WINDOWS,
      normalTargets: normalTargets(),
    });

    expect(result.totalBloodVolume).toMatchObject({
      status: "unavailable-missing-vascular-volumes",
      initialM3: null,
      maximumRelativeDrift: null,
    });
    expect(result.totalBloodVolume.missingCompartmentIds)
      .toEqual(["SA", "SV", "PA", "PV"]);
    expect(result.pressureByCompartment.SA.maximumPa).toBeGreaterThan(0);
    expect(result.flowById.Q_AoV.forwardVolumeM3).toBeCloseTo(70e-6, 14);
    expect(result.filling.mitral.eToAPeakRatio).toBeCloseTo(2, 12);
    expect(result.cycle.committedLeftLimitIntegrationSource).toBe(false);
    expect(result.periodicity.available).toBe(false);
    expect(result.normalTargetGate.inputEligibilityPass).toBe(false);
    expect(result.normalTargetGate).toMatchObject({
      periodTargetPass: false,
      physiologyBandComparisonStatus: "provisional-period-target-not-passed",
      physiologyBandComparisonsAreProvisional: true,
    });
    expect(result.terminalCycleClosure).toMatchObject({
      status: "partial-missing-endpoint-volume-compartments",
      availableCompartmentIds: ["LA", "LV", "RA", "RV"],
      missingCompartmentIds: ["SA", "SV", "PA", "PV"],
    });
    expect(result.normalTargetGate.pass).toBe(false);
  });

  it("projects initial plus committed left-limit evaluations for the runner", () => {
    const samples = completeCycleSamples();
    const result = evaluatePhaseB1PhysiologyEnvelopeMetricsFromCommittedEvaluationsV1({
      cycleStartTimeSec: 10,
      cycleLengthSec: 1,
      initialEvaluation: evaluationFromSample(samples[0]!),
      acceptedEndLeftLimitEvaluations: samples.slice(1).map(evaluationFromSample),
      phaseWindows: WINDOWS,
      periodEndpointMaximumNormalizedDistance: 1e-3,
      normalTargets: normalTargets(),
    });

    expect(result.cycle).toMatchObject({
      sampleCount: 5,
      committedLeftLimitIntegrationSource: true,
      fullCycleCoveragePass: true,
    });
    expect(result.totalBloodVolume.status).toBe("available");
    expect(result.flowById.Q_AoV.forwardVolumeM3).toBeCloseTo(70e-6, 14);
    expect(result.normalTargetGate.pass).toBe(true);
  });

  it("requires strict one-cycle chronology and prospective target units", () => {
    const repeated = completeCycleSamples();
    expect(() => evaluatePhaseB1PhysiologyEnvelopeMetricsV1({
      cycleStartTimeSec: 10,
      cycleLengthSec: 1,
      samples: [repeated[0]!, repeated[0]!],
      integrationSource: "committed-backward-euler-left-limit-evaluations",
      phaseWindows: WINDOWS,
      periodEndpointMaximumNormalizedDistance: 0,
      normalTargets: normalTargets(),
    })).toThrow(/strictly increasing/i);

    expect(() => evaluatePhaseB1PhysiologyEnvelopeMetricsV1({
      cycleStartTimeSec: 10,
      cycleLengthSec: 1,
      samples: repeated.map((sample, index) => index === 1
        ? { ...sample, phaseSec: sample.phaseSec - 0.05 }
        : sample),
      integrationSource: "committed-backward-euler-left-limit-evaluations",
      phaseWindows: WINDOWS,
      periodEndpointMaximumNormalizedDistance: 0,
      normalTargets: normalTargets(),
    })).toThrow(/phaseSec must equal/i);

    const targets = normalTargets();
    expect(() => evaluatePhaseB1PhysiologyEnvelopeMetricsV1({
      cycleStartTimeSec: 10,
      cycleLengthSec: 1,
      samples: completeCycleSamples(),
      integrationSource: "committed-backward-euler-left-limit-evaluations",
      phaseWindows: WINDOWS,
      periodEndpointMaximumNormalizedDistance: 0,
      normalTargets: {
        ...targets,
        targets: targets.targets.map((target, index) => index === 0
          ? { ...target, unit: "Pa" as const }
          : target),
      },
    })).toThrow(/unit .* does not match/i);

    for (const gateId of ["lvef", "mv-ea"] as const) {
      expect(() => evaluatePhaseB1PhysiologyEnvelopeMetricsV1({
        cycleStartTimeSec: 10,
        cycleLengthSec: 1,
        samples: completeCycleSamples(),
        integrationSource: "committed-backward-euler-left-limit-evaluations",
        phaseWindows: WINDOWS,
        periodEndpointMaximumNormalizedDistance: 0,
        normalTargets: {
          ...targets,
          targets: targets.targets.map((target) => target.gateId === gateId
            ? { ...target, role: "hard" as const }
            : target),
        },
      })).toThrow(/cannot enter the Stage 1 hard gate/i);
    }
  });

  it("accepts an endpoint-derived late-cycle duration within binary64 tolerance", () => {
    const source = completeCycleSamples();
    const startTimeSec = 8.8;
    const endTimeSec = 9.600000000000001;
    const initial = {
      ...source[0]!,
      absoluteTimeSec: startTimeSec,
      phaseSec: 0,
    };
    const final = {
      ...source[source.length - 1]!,
      absoluteTimeSec: endTimeSec,
      phaseSec: endTimeSec - startTimeSec,
    };
    expect(() => phaseB1PhysiologyEnvelopeMetricSamplesFromCommittedEvaluationsV1({
      cycleStartTimeSec: startTimeSec,
      cycleLengthSec: 0.8,
      initialEvaluation: evaluationFromSample(initial),
      acceptedEndLeftLimitEvaluations: [evaluationFromSample(final)],
    })).not.toThrow();
  });

  it("projects the literature target pack with explicit SI conversion and omissions", () => {
    const targetSet = buildPhaseB1PhysiologyEnvelopeNormalTargetSetV1({
      pack: NORMAL_ADULT_TARGET_PACK_V1,
      numericalPolicy: {
        maximumRelativeTotalBloodVolumeDrift: 1e-10,
        maximumPeriodEndpointNormalizedDistance: 1e-6,
      },
    });
    const byId = new Map(targetSet.targets.map((target) => [target.gateId, target]));

    expect(byId.get("numerical-tbv-drift")).toMatchObject({
      role: "hard",
      evidenceSourceId: "project",
      upperInclusive: 1e-10,
    });
    expect(byId.get("systemic-systolic-pressure")?.lowerInclusive)
      .toBeCloseTo(100 * 133.322387415, 9);
    expect(byId.get("systemic-systolic-pressure")?.upperInclusive)
      .toBeCloseTo(130 * 133.322387415, 9);
    expect(byId.get("lv-end-diastolic-volume")).toMatchObject({
      role: "supportive",
      lowerInclusive: 78e-6,
      upperInclusive: 215e-6,
    });
    expect(byId.get("left-cardiac-output")).toMatchObject({
      metricId: "circulation.left.signedOutflowCardiacOutputLPerMin",
      role: "hard",
    });
    expect(byId.get("right-cardiac-output")).toMatchObject({
      metricId: "circulation.right.signedOutflowCardiacOutputLPerMin",
      role: "hard",
    });
    expect(byId.get("lv-ejection-fraction")?.role).toBe("supportive");
    expect(byId.get("rv-ejection-fraction")?.role).toBe("supportive");
    expect(byId.get("pulmonary-mean-pressure")?.role).toBe("hard");
    expect(byId.get("pulmonary-systolic-pressure")?.role).toBe("supportive");
    const hardMetricIds = new Set(targetSet.targets
      .filter((target) => target.role === "hard")
      .map((target) => target.metricId));
    expect(PHASE_B1_PHYSIOLOGY_ENVELOPE_REQUIRED_NORMAL_TARGET_METRICS_V1
      .filter((metricId) => !hardMetricIds.has(metricId)))
      .toEqual([]);
    expect(byId.get("mitral-net-forward-volume")?.role).toBe("supportive");
    expect(byId.get("mitral-e-to-a")?.role).toBe("supportive");
    expect(byId.get("pulmonary-venous-systolic-forward-fraction")?.role)
      .toBe("supportive");
    expect([...hardMetricIds].some((metricId) =>
      metricId.startsWith("volume.") || metricId.startsWith("filling.")))
      .toBe(false);
    expect(targetSet.atrialPvLoopMorphologyMaySelectOrGate).toBe(false);
    expect(PHASE_B1_PHYSIOLOGY_ENVELOPE_UNIMPLEMENTED_NORMAL_TARGET_PATHS_V1)
      .toContain(
        "targets.globalHemodynamics.leftVentricularEndDiastolicPressureMmHg:event-local-LVEDP-requires-a-declared-valve-event-sample",
      );
    expect(targetSet.targets.some((target) =>
      target.gateId.toLowerCase().includes("pv-loop"))).toBe(false);
  });
});

function completeCycleSamples(): readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[] {
  const phase = [0, 0.25, 0.5, 0.75, 1];
  const la = [60, 50, 55, 65, 60];
  const lv = [120, 100, 50, 80, 120];
  const ra = [70, 60, 65, 75, 70];
  const rv = [130, 110, 55, 85, 130];
  const qMv = [0, 100, 200, 50, 0];
  const qAov = [0, 140, 140, 0, 0];
  const qTv = [0, 100, 180, 40, 0];
  const qPuv = [0, 150, 150, 0, 0];
  const qPv = [0, 80, 100, -10, -20];
  return Object.freeze(phase.map((phaseSec, index) => {
    const volumesMl = {
      LA: la[index]!,
      LV: lv[index]!,
      SA: 800 + (120 - lv[index]!),
      SV: 2_500,
      RA: ra[index]!,
      RV: rv[index]!,
      PA: 300 + (130 - rv[index]!),
      PV: 500 + (60 - la[index]!) + (70 - ra[index]!),
    } satisfies Record<BloodCompartmentId, number>;
    return Object.freeze({
      absoluteTimeSec: 10 + phaseSec,
      phaseSec,
      bloodVolumesM3: mapRecord(volumesMl, (value) => value * 1e-6),
      compartmentAbsolutePressurePa: mapRecord({
        LA: 1_000,
        LV: 1_100 + index * 100,
        SA: 12_000 + index * 100,
        SV: 700,
        RA: 500,
        RV: 900 + index * 100,
        PA: 2_200 + index * 50,
        PV: 1_100,
      }, (value) => value),
      allFlowsM3PerSec: mapRecord({
        Q_PV: qPv[index]!,
        Q_MV: qMv[index]!,
        Q_AoV: qAov[index]!,
        Q_sys: 70,
        Q_VC: 75,
        Q_TV: qTv[index]!,
        Q_PuV: qPuv[index]!,
        Q_pul: 75,
      }, (value) => value * 1e-6),
    });
  }));
}

function normalTargets(): PhaseB1PhysiologyEnvelopeNormalTargetSetV1 {
  const source = "test-prospective-source";
  return Object.freeze({
    targetSetId: "test-normal-targets-v1",
    status: "prospective-targets-not-physiological-validation" as const,
    scalarScoreOrRankingAllowed: false as const,
    atrialPvLoopMorphologyMaySelectOrGate: false as const,
    targets: Object.freeze([
      target("heart-rate", "cycle.heartRateBpm", "bpm", 60, 60, "hard", source),
      target("tbv", "tbv.maximumRelativeDrift", "1", 0, 1e-10, "hard", source),
      target("period", "period.maximumNormalizedDistance", "1", 0, 0.01, "hard", source),
      target("co-left", "circulation.left.signedOutflowCardiacOutputLPerMin", "L/min", 4, 5, "hard", source),
      target("co-right", "circulation.right.signedOutflowCardiacOutputLPerMin", "L/min", 4, 5, "hard", source),
      target("output-mismatch", "circulation.leftRightSignedOutputMismatchFraction", "1", 0, 0.1, "hard", source),
      target("sap-diastolic", "pressure.SA.minimumPa", "Pa", 0, 20_000, "hard", source),
      target("sap-systolic", "pressure.SA.maximumPa", "Pa", 0, 20_000, "hard", source),
      target("map", "pressure.SA.meanPa", "Pa", 0, 20_000, "hard", source),
      target("mpap", "pressure.PA.meanPa", "Pa", 0, 5_000, "hard", source),
      target("lap", "pressure.LA.meanPa", "Pa", 0, 2_000, "hard", source),
      target("rap", "pressure.RA.meanPa", "Pa", 0, 2_000, "hard", source),
      target("rv-peak", "pressure.RV.maximumPa", "Pa", 0, 10_000, "hard", source),
      target("lvef", "volume.LV.ejectionFraction", "1", 0.5, 0.7, "supportive", source),
      target("rvef", "volume.RV.ejectionFraction", "1", 0.5, 0.7, "supportive", source),
      target("mv-ea", "filling.mitral.eToAPeakRatio", "1", 1.5, 2.5, "supportive", source),
      target("pv-sd", "filling.pulmonaryVenous.sToDPeakRatio", "1", 0.5, 1, "supportive", source),
    ]),
  });
}

function target(
  gateId: string,
  metricId: Parameters<typeof typedMetricId>[0],
  unit: Parameters<typeof typedMetricId>[1],
  lowerInclusive: number | null,
  upperInclusive: number | null,
  role: "hard" | "supportive",
  evidenceSourceId: string,
) {
  typedMetricId(metricId, unit);
  return Object.freeze({
    gateId,
    metricId,
    unit,
    lowerInclusive,
    upperInclusive,
    role,
    evidenceSourceId,
  });
}

function typedMetricId(
  metricId: import("@/tools/myocardium/phaseB1PhysiologyEnvelopeMetricsV1")
    .PhaseB1PhysiologyEnvelopeNormalTargetMetricIdV1,
  unit: import("@/tools/myocardium/phaseB1PhysiologyEnvelopeMetricsV1")
    .PhaseB1PhysiologyEnvelopeMetricUnitV1,
) {
  return { metricId, unit };
}

function terminalWaveform(
  samples: readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[],
): PhaseB1TerminalWaveformSeriesV1 {
  const chamberIds = ["LA", "LV", "RA", "RV"] as const;
  const compartmentIds = ["LA", "LV", "SA", "SV", "RA", "RV", "PA", "PV"] as const;
  const flowIds = ["Q_PV", "Q_MV", "Q_AoV", "Q_sys", "Q_VC", "Q_TV", "Q_PuV", "Q_pul"] as const;
  return Object.freeze({
    sampleIndex: Object.freeze(samples.map((_, index) => index)),
    phaseSec: Object.freeze(samples.map((sample) => sample.phaseSec)),
    nominalGridIndex: Object.freeze(samples.map((_, index) => index)),
    sourceKind: Object.freeze(samples.map((_, index) => index === 0
      ? "run-initial-endpoint" as const
      : "requested-segment-exit-endpoint" as const)),
    eventKeysAtEnd: Object.freeze(samples.map(() => Object.freeze([]))),
    chamberBloodVolumeM3: mapRecordFromIds(chamberIds, (id) =>
      samples.map((sample) => sample.bloodVolumesM3[id]!)),
    compartmentAbsolutePressurePa: mapRecordFromIds(compartmentIds, (id) =>
      samples.map((sample) => sample.compartmentAbsolutePressurePa[id])),
    valveFlowM3PerSec: mapRecordFromIds(
      ["Q_MV", "Q_AoV", "Q_TV", "Q_PuV"] as const,
      (id) => samples.map((sample) => sample.allFlowsM3PerSec[id]),
    ),
    allClosedLoopFlowM3PerSec: mapRecordFromIds(flowIds, (id) =>
      samples.map((sample) => sample.allFlowsM3PerSec[id])),
  });
}

function evaluationFromSample(sample: PhaseB1PhysiologyEnvelopeMetricSampleV1) {
  return {
    endpoint: {
      timeSec: sample.absoluteTimeSec,
      differentialState: { bloodVolumesM3: sample.bloodVolumesM3 },
    },
    closedLoop: {
      compartmentAbsolutePressurePa: sample.compartmentAbsolutePressurePa,
      allFlowsM3PerSec: sample.allFlowsM3PerSec,
    },
  } as unknown as import(
    "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1"
  ).PhaseB1EventFreeEndpointEvaluationV1;
}

function mapRecord<K extends string>(
  input: Record<K, number>,
  map: (value: number) => number,
): Readonly<Record<K, number>> {
  return Object.freeze(Object.fromEntries(Object.entries(input).map(([key, value]) =>
    [key, map(value as number)])) as Record<K, number>);
}

function mapRecordFromIds<K extends string, V>(
  ids: readonly K[],
  map: (id: K) => V,
): Readonly<Record<K, V>> {
  return Object.freeze(Object.fromEntries(ids.map((id) => [id, map(id)])) as Record<K, V>);
}
