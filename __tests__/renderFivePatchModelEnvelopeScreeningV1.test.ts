import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  buildFivePatchEnvelopeProtocolSpecV1,
  buildFivePatchModelEnvelopeScreeningPlanV1,
  type FivePatchEnvelopeAcceptedStepSampleV1,
  type FivePatchEnvelopeProtocolRunRequestV1,
  type FivePatchEnvelopeProtocolRunResultV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1";
import {
  loadFivePatchModelEnvelopeScreeningV1,
  renderFivePatchModelEnvelopeScreeningFilesV1,
  renderFivePatchModelEnvelopeScreeningHtmlV1,
  summarizeFivePatchModelEnvelopeScreeningV1,
} from "@/tools/mechanics2/renderFivePatchModelEnvelopeScreeningV1";
import {
  runFivePatchModelEnvelopeProtocolStreamingToDiskV1,
} from "@/tools/mechanics2/runFivePatchModelEnvelopeV1";

describe("renderFivePatchModelEnvelopeScreeningV1", () => {
  const directory = mkdtempSync(join(tmpdir(), "five-patch-screening-render-"));

  beforeAll(() => {
    runFivePatchModelEnvelopeProtocolStreamingToDiskV1(
      buildFivePatchModelEnvelopeScreeningPlanV1(),
      directory,
      {},
      { executeRun: syntheticProtocolResult },
    );
  }, 30_000);

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it("validates and restores the exact 192-run canonical screening assembly", () => {
    const loaded = loadFivePatchModelEnvelopeScreeningV1(directory);
    const summary = summarizeFivePatchModelEnvelopeScreeningV1(loaded);

    expect(loaded.results).toHaveLength(192);
    expect(loaded.manifest.artifactCount).toBe(192);
    expect(summary.canonicalRunCount).toBe(192);
    expect(summary.runs.map((run) => run.runId)).toEqual(
      buildFivePatchModelEnvelopeScreeningPlanV1().map(
        (request) => buildFivePatchEnvelopeProtocolSpecV1(request).runId,
      ),
    );
    expect(summary.countsByArm).toEqual(summary.countsByArm.map((count) => ({
      ...count,
      total: 64,
      protocolRunComplete: 2,
      numericalFailure: 62,
      periodicityEstablished: 1,
      periodicityNotEstablished: 1,
      periodicityUnavailable: 62,
      rawTrueLobesMeasurable: 2,
      morphologyDisplayEligible: 1,
    })));
    expect(JSON.stringify(summary)).not.toContain("finalCycleSamples");
    expect(summary.interpretation).toContain("no-ranking-selection");
  });

  it("embeds only selected raw fields and suppresses unsteady A/V morphology display", () => {
    const loaded = loadFivePatchModelEnvelopeScreeningV1(directory);
    const summary = summarizeFivePatchModelEnvelopeScreeningV1(loaded);
    const html = renderFivePatchModelEnvelopeScreeningHtmlV1(
      summary,
      loaded.results,
    );

    expect(html).toContain("Evaluation-eligible raw true A-lobe area vs V-lobe area");
    expect(html).toContain("run.evaluationEligible &&");
    expect(html).toContain("true-lobe morphology display suppressed");
    expect(html).toContain("No ranking, winner selection, physiology gate, smoothing, resampling");
    expect(html).toContain("raw-path");
    expect(html).toContain("const initialOrdinal =");
    expect(html).toContain("selectRun(initialOrdinal)");
    expect(html).toContain("canonical #");
    expect(html).toContain("LA blood-volume PV");
    expect(html).toContain("LV blood-volume PV");
    expect(html).toContain("Mitral flow vs phase");
    expect(html).toContain("PV, LA, and LV pressures");
    expect(html).toContain("LA work-conjugate pressure components");
    expect(html).toContain("Pulmonary venous and mitral flows");
    expect(html).toContain("LA fiber strain-rate proxy");
    expect(html).toContain("Mitral open fraction");
    expect(html).toContain("LV pressure-rate relaxation proxy");
    expect(html).toContain("deferred-no-interpolation");
    expect(html).toContain("not a fitted &tau;");
    expect(html).not.toContain("systemicArteryMl");
    expect(html).not.toContain("freeCalciumUm");
    expect(html).not.toContain("activations01");
    expect(html).not.toContain("fetch(");
  });

  it("atomically writes compact JSON plus standalone HTML", () => {
    const output = mkdtempSync(join(tmpdir(), "five-patch-screening-output-"));
    const summaryPath = join(output, "summary.json");
    const htmlPath = join(output, "visual.html");
    try {
      const rendered = renderFivePatchModelEnvelopeScreeningFilesV1(
        directory,
        summaryPath,
        htmlPath,
      );
      expect(rendered.artifactCount).toBe(192);
      expect(JSON.parse(readFileSync(summaryPath, "utf8"))).toMatchObject({
        sourcePhase: "screening",
        canonicalRunCount: 192,
      });
      expect(readFileSync(htmlPath, "utf8")).toContain(
        "Five-patch fixed screening raw explorer V1",
      );
      expect(readdirSync(output).some((name) => name.endsWith(".tmp"))).toBe(false);
    } finally {
      rmSync(output, { recursive: true, force: true });
    }
  });

  it("rejects a missing or extra JSON artifact before rendering", () => {
    const names = readdirSync(directory).filter((name) => name.endsWith(".json"));
    const removedPath = join(directory, names[0]!);
    const removed = readFileSync(removedPath, "utf8");
    unlinkSync(removedPath);
    try {
      expect(() => loadFivePatchModelEnvelopeScreeningV1(directory)).toThrow(
        "exactly 192 JSON artifacts; found 191",
      );
    } finally {
      writeFileSync(removedPath, removed, "utf8");
    }
    const extraPath = join(directory, "extra.json");
    writeFileSync(extraPath, removed, "utf8");
    try {
      expect(() => loadFivePatchModelEnvelopeScreeningV1(directory)).toThrow(
        "exactly 192 JSON artifacts; found 193",
      );
    } finally {
      unlinkSync(extraPath);
    }
  });
});

function syntheticProtocolResult(
  request: FivePatchEnvelopeProtocolRunRequestV1,
): FivePatchEnvelopeProtocolRunResultV1 {
  const spec = buildFivePatchEnvelopeProtocolSpecV1(request);
  const complete = request.candidateIndex <= 1;
  const evaluationEligible = request.candidateIndex === 0;
  const endpointsPerCycle = request.stepCount / request.beats;
  const samples = complete
    ? Array.from({ length: endpointsPerCycle }, (_unused, index) =>
        syntheticSample(index, endpointsPerCycle, request.candidateIndex)
      )
    : [];
  const lobeDiagnostics = complete
    ? {
        measurementStatus: "measurable",
        steadyStateInterpretationEligible: evaluationEligible,
        aLobe: { absoluteAreaMmHgMl: 2 + request.candidateIndex },
        vLobe: { absoluteAreaMmHgMl: 3 + request.candidateIndex },
        aToVAbsoluteAreaRatioUnbounded:
          (2 + request.candidateIndex) / (3 + request.candidateIndex),
      }
    : null;
  return {
    runnerId: spec.runnerId,
    runId: spec.runId,
    request,
    slsVariant: spec.slsVariant,
    unitPoint: spec.unitPoint,
    parameterVector: spec.parameterVector,
    parameterIdentityCanonicalJson: spec.parameterIdentityCanonicalJson,
    initialVolumeOverridesMl: spec.initialVolumeOverridesMl,
    initialization: "independent-cold-start",
    requestedStepsAttemptedUnlessRejected: request.stepCount,
    stepsAttempted: complete ? request.stepCount : 1,
    stepsAccepted: complete ? request.stepCount : 0,
    failureReasons: complete ? [] : ["synthetic-numerical-failure"],
    initialTotalBloodVolumeMl: 5_000,
    finalTotalBloodVolumeMl: 5_000,
    maximumAbsoluteBloodVolumeResidualMl: 0,
    minimumCompartmentVolumeMl: 20,
    finalTimeSec: complete ? request.beats : 0,
    finalCycleSamples: samples,
    retainedRawCycles: complete
      ? [
          { beatNumber: 31, complete: true, samples },
          { beatNumber: 32, complete: true, samples },
        ]
      : [],
    cycleEndpointRetention: {
      policy:
        "every-accepted-endpoint-of-final-complete-cycle-or-partial-current-cycle-on-failure",
      exactEndpointsPerCycle: endpointsPerCycle,
      retainedEndpointCount: samples.length,
      retainedCycleKind: complete ? "latest-complete-cycle" : "none",
      boundedToAtMostOneCycle: true,
    },
    settleAndAssess: {
      applicable: true,
      singleContinuousRun: true,
      independentColdStart: true,
      sourceStateAcceptedFromAnotherRun: false,
      resultDependentExtensionAllowed: false,
      calciumAmplitudeRampBeatNumbers: [1, 2, 3, 4],
      calciumAmplitudeRampCommonMultipliers: [0.25, 0.5, 0.75, 1],
      discardSettleBeatNumbersInclusive: [5, 29],
      assessmentBeatNumbersInclusive: [30, 32],
      completedRun: complete,
      retainedRawCycleBeatNumbers: complete ? [31, 32] : [],
      rawCycleEvaluationUsesAssessmentWindowOnly: true,
      morphologyMetricsUsedAsSettlingGate: false,
      evaluationEligible,
    },
    periodicity: {
      exactCycleBoundaryStates: [],
      consecutiveNormalizedReturnMaps: [],
      normalizedReturnMap: null,
      maxAbsDimensionlessTolerance: 0.001,
      toleranceSource: "predeclared",
      periodicityEstablished: complete ? evaluationEligible : null,
      completedRun: complete,
      requiredConsecutiveReturnMapCount: 2,
      bothConsecutiveReturnMapsPass: evaluationEligible,
      status: evaluationEligible
        ? "established"
        : complete
          ? "not-established"
          : "unavailable-fewer-than-three-exact-cycle-boundaries",
      evaluationEligible,
      morphologyMetricsUsedAsSettlingGate: false,
    },
    reportOnlyRawCycleDiagnostics: {
      leftAtrialPvLobes: lobeDiagnostics,
    },
    reportOnlyVLoopMechanismAttribution: {
      role:
        "report-only-no-score-ranking-gate-smoothing-or-reference-fitting",
      retainedRawTraceStatus: complete ? "available" : "unavailable",
      retainedRawSampleCount: samples.length,
      pressureComponentSource:
        "same-one-fiber-work-conjugate-map-as-la-cavity-equation",
      leftVentricularRelaxationReadback:
        "accepted-endpoint-backward-pressure-difference-not-fitted-tau",
      matchedVolumeReservoirMinusConduit: {
        status: "deferred-no-interpolation",
        reason:
          "raw-endpoint-reservoir-and-conduit-volumes-do-not-generally-form-exact-matched-volume-pairs",
      },
    },
    status: complete ? "protocol-run-complete" : "numerical-failure",
    contributesToPhysiologyOrModelClassPassFraction: false,
  } as unknown as FivePatchEnvelopeProtocolRunResultV1;
}

function syntheticSample(
  index: number,
  count: number,
  candidateIndex: number,
): FivePatchEnvelopeAcceptedStepSampleV1 {
  const phase01 = (index + 1) / count;
  const angle = 2 * Math.PI * phase01;
  return {
    acceptedStepIndex: index + 1,
    beatNumber: 8,
    timeSec: 7 + phase01,
    phase01,
    volumesMl: {
      leftAtriumMl: 70 + 8 * Math.cos(angle),
      leftVentricleMl: 120 - 30 * Math.cos(angle),
      systemicArteryMl: 700,
      systemicVeinMl: 3_000,
      rightAtriumMl: 80,
      rightVentricleMl: 120,
      pulmonaryArteryMl: 250,
      pulmonaryVeinMl: 660,
    },
    pressuresMmHg: {
      leftAtriumMmHg: 8 + (2 + candidateIndex) * Math.sin(angle),
      leftVentricleMmHg: 60 + 50 * Math.sin(angle),
      systemicArteryMmHg: 90,
      systemicVeinMmHg: 4,
      rightAtriumMmHg: 3,
      rightVentricleMmHg: 20,
      pulmonaryArteryMmHg: 15,
      pulmonaryVeinMmHg: 8,
    },
    flowsMlPerSec: {
      mitralMlPerSec: 300 * Math.max(0, Math.sin(angle)),
      aorticMlPerSec: 0,
      tricuspidMlPerSec: 0,
      pulmonaryValveMlPerSec: 0,
      systemicPeripheralMlPerSec: 0,
      systemicVenousMlPerSec: 0,
      pulmonaryPeripheralMlPerSec: 0,
      pulmonaryVenousMlPerSec: 0,
    },
    freeCalciumUm: {},
    activations01: {},
    reportOnlyMechanismReadback: {
      leftAtrium: {
        fiberLogStrain: 0.05 * Math.cos(angle),
        fiberLogStrainBackwardDifferenceRatePerSec: -0.3 * Math.sin(angle),
        pressureComponentsMmHg: {
          equilibriumPassiveMmHg: 3 + 0.5 * Math.sin(angle),
          effectiveLandActiveMmHg:
            5 + (1.5 + candidateIndex) * Math.sin(angle),
          slsOverstressMmHg: 0,
          totalMmHg: 8 + (2 + candidateIndex) * Math.sin(angle),
          componentSumMinusTotalMmHg: 0,
        },
      },
      mitralValve: {
        pressureGradientMmHg:
          8 + (2 + candidateIndex) * Math.sin(angle) -
          (60 + 50 * Math.sin(angle)),
        openFraction01: Math.max(0, Math.sin(angle)),
      },
      leftVentricularPressureBackwardDifferenceRateMmHgPerSec:
        50 * Math.cos(angle),
      leftVentricularPressureDecayRatePositiveMmHgPerSec:
        Math.max(0, -50 * Math.cos(angle)),
    },
    totalBloodVolumeResidualMl: 0,
  } as unknown as FivePatchEnvelopeAcceptedStepSampleV1;
}
