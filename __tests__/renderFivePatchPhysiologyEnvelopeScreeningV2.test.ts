import { createHash } from "node:crypto";
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

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type {
  FivePatchEnvelopeAcceptedStepSampleV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1";
import {
  buildFivePatchPhysiologyEnvelopePlanV2,
  buildFivePatchPhysiologyEnvelopeResolvedRunV2,
  type FivePatchPhysiologyEnvelopeRunResultV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeRunnerV2";
import {
  loadFivePatchPhysiologyEnvelopeScreeningV2,
  renderFivePatchPhysiologyEnvelopeScreeningFileV2,
  renderFivePatchPhysiologyEnvelopeScreeningHtmlV2,
  summarizeFivePatchPhysiologyEnvelopeScreeningV2,
} from "@/tools/mechanics2/renderFivePatchPhysiologyEnvelopeScreeningV2";
import {
  runFivePatchPhysiologyEnvelopeCliV2,
} from "@/tools/mechanics2/runFivePatchPhysiologyEnvelopeV2";

describe("renderFivePatchPhysiologyEnvelopeScreeningV2", () => {
  const directory = mkdtempSync(join(tmpdir(), "physiology-v2-render-"));

  beforeAll(() => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );
    try {
      runFivePatchPhysiologyEnvelopeCliV2([
        "--phase",
        "screening",
        "--output-dir",
        directory,
      ], { executeRun: syntheticRun });
    } finally {
      stdout.mockRestore();
    }
  }, 30_000);

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it("validates the canonical manifest and 64 artifacts in canonical order", () => {
    const loaded = loadFivePatchPhysiologyEnvelopeScreeningV2(directory);
    const summary = summarizeFivePatchPhysiologyEnvelopeScreeningV2(
      loaded.results,
      loaded.manifest,
    );
    expect(readdirSync(directory)).toContain("_assembly-manifest.json");
    expect(loaded.artifactNames).toHaveLength(64);
    expect(loaded.results).toHaveLength(64);
    expect(loaded.results.map((result) => result.request)).toEqual(
      buildFivePatchPhysiologyEnvelopePlanV2("screening"),
    );
    expect(summary).toMatchObject({
      sourcePhase: "screening",
      sourceScenario: "hr60-reference",
      canonicalRunCount: 64,
      sourceTreatment: "raw-retained-endpoints-no-smoothing-no-resampling",
      interpretation: "canonical-order-no-ranking-winner-score-or-v-loop-gate",
      counts: {
        total: 64,
        runComplete: 60,
        integrationFailure: 4,
        numericalEligible: 30,
        broadOperatingPointEligible: 22,
        combinedEligible: 10,
        measurableVLoop: 13,
      },
    });
    expect(summary.assemblySha256).toBe(loaded.manifest.assemblySha256);
    expect(JSON.stringify(summary)).not.toContain("finalCycleSamples");
    expect(JSON.stringify(summary)).not.toContain("samples");
  });

  it("embeds unsmoothed requested traces and keeps V-loop use report-only", () => {
    const loaded = loadFivePatchPhysiologyEnvelopeScreeningV2(directory);
    const summary = summarizeFivePatchPhysiologyEnvelopeScreeningV2(
      loaded.results,
      loaded.manifest,
    );
    const html = renderFivePatchPhysiologyEnvelopeScreeningHtmlV2(
      summary,
      loaded.results,
    );
    expect(html).toContain("LA blood-volume PV");
    expect(html).toContain("LV blood-volume PV");
    expect(html).toContain("Mitral and pulmonary-venous flow");
    expect(html).toContain("LAP and pulmonary-vein pressure");
    expect(html).toContain("LVP and aortic pressure");
    expect(html).toContain("LA pressure components");
    expect(html).toContain("Prescribed free calcium");
    expect(html).toContain("Land activation readback");
    expect(html).toContain("Cardiac output (L/min)");
    expect(html).toContain("Preferred tau (s)");
    expect(html).toContain("Mitral E/A");
    expect(html).toContain("Mean reservoir-conduit gap (mmHg)");
    expect(html).toContain("Report-only explorer");
    expect(html).toContain("canonicalOrdinal\":0");
    expect(html).toContain(".phase-reservoir");
    expect(html).toContain("--sidebar-width");
    expect(html).toContain("dataset.tooltip");
    expect(html).not.toContain("fetch(");
    expect(html).not.toContain("XMLHttpRequest");
    expect(html).not.toContain("WebSocket");
    const embeddedPolicy = html.match(
      /"vLoopUsePolicy":\{"status":"report-only"[^}]+\}/,
    )?.[0];
    expect(embeddedPolicy).toContain('"affectsSelection":false');
    expect(embeddedPolicy).toContain('"affectsRangeRevision":false');
  });

  it("writes the default-style standalone file atomically", () => {
    const outputDirectory = mkdtempSync(join(tmpdir(), "physiology-v2-html-"));
    const outputPath = join(outputDirectory, "screening.html");
    try {
      const rendered = renderFivePatchPhysiologyEnvelopeScreeningFileV2(
        directory,
        outputPath,
      );
      expect(rendered).toMatchObject({
        outputPath,
        artifactCount: 64,
      });
      const html = readFileSync(outputPath, "utf8");
      expect(html).toContain("Five-patch physiology envelope V2 screening");
      expect(html).toContain("height:100vh");
      expect(html).toContain("overflow:auto");
      expect(
        readdirSync(outputDirectory).some((name) => name.endsWith(".tmp")),
      ).toBe(false);
    } finally {
      rmSync(outputDirectory, { recursive: true, force: true });
    }
  });

  it("rejects a missing or extra run artifact before rendering", () => {
    const artifactNames = readdirSync(directory)
      .filter((name) => name.endsWith(".json") && !name.startsWith("_"));
    const removedPath = join(directory, artifactNames[0]!);
    const removed = readFileSync(removedPath, "utf8");
    unlinkSync(removedPath);
    try {
      expect(() => loadFivePatchPhysiologyEnvelopeScreeningV2(directory))
        .toThrow(/exactly 64 validated run artifacts.*found 63/);
    } finally {
      writeFileSync(removedPath, removed, "utf8");
    }
    const extraPath = join(directory, "extra.json");
    writeFileSync(extraPath, removed, "utf8");
    try {
      expect(() => loadFivePatchPhysiologyEnvelopeScreeningV2(directory))
        .toThrow(/exactly 64 validated run artifacts.*found 65/);
    } finally {
      unlinkSync(extraPath);
    }
  });

  it("rejects a corrupt or noncanonical screening manifest", () => {
    const manifestPath = join(directory, "_assembly-manifest.json");
    const original = readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(original) as Record<string, unknown>;
    writeFileSync(manifestPath, JSON.stringify({
      ...manifest,
      assemblySha256: "0".repeat(64),
    }), "utf8");
    try {
      expect(() => loadFivePatchPhysiologyEnvelopeScreeningV2(directory))
        .toThrow(/assembly hash mismatch/);
    } finally {
      writeFileSync(manifestPath, original, "utf8");
    }

    const { assemblySha256: _assembly, ...body } = manifest as {
      assemblySha256: string;
    } & Record<string, unknown>;
    const wrongHashes = [...body.orderedArtifactSha256s as string[]];
    wrongHashes[0] = "0".repeat(64);
    const mismatchedBody = { ...body, orderedArtifactSha256s: wrongHashes };
    writeFileSync(manifestPath, JSON.stringify({
      ...mismatchedBody,
      assemblySha256: sha256Json(mismatchedBody),
    }), "utf8");
    try {
      expect(() => loadFivePatchPhysiologyEnvelopeScreeningV2(directory))
        .toThrow(/does not match canonical run IDs and artifact hashes/);
    } finally {
      writeFileSync(manifestPath, original, "utf8");
    }
  });
});

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value), "utf8")
    .digest("hex");
}

function syntheticRun(
  request: ReturnType<typeof buildFivePatchPhysiologyEnvelopePlanV2>[number],
): FivePatchPhysiologyEnvelopeRunResultV2 {
  const spec = buildFivePatchPhysiologyEnvelopeResolvedRunV2(request);
  const index = request.candidateIndex;
  const failed = index >= 60;
  const numericalEligible = !failed && index % 2 === 0;
  const broadEligible = index % 3 === 0;
  const combinedEligible = numericalEligible && broadEligible;
  const measurable = index % 5 === 0;
  const samples = Array.from({ length: 24 }, (_unused, sampleIndex) =>
    syntheticSample(sampleIndex, 24, index)
  );
  const rawLobes = {
    measurementStatus: measurable ? "measurable" : "not-measurable",
    selfIntersectionCount: measurable ? 1 : 0,
    aLobe: measurable
      ? { signedAreaMmHgMl: 18, absoluteAreaMmHgMl: 18 }
      : null,
    vLobe: measurable
      ? { signedAreaMmHgMl: -4, absoluteAreaMmHgMl: 4 }
      : null,
    aToVAbsoluteAreaRatioUnbounded: measurable ? 4.5 : null,
  };
  return {
    runnerId: spec.runnerId,
    protocolId: spec.protocolId,
    runId: spec.runId,
    request: spec.request,
    stepCount: spec.stepCount,
    candidateId: spec.candidateId,
    unitPoint: spec.unitPoint,
    parameterVector: spec.parameterVector,
    effectiveAxisReadback: spec.scenarioConfig.effectiveAxisReadback,
    scenarioReadback: spec.scenarioConfig.scenarioReadback,
    parameterIdentityCanonicalJson: spec.parameterIdentityCanonicalJson,
    initialVolumeOverridesMl: spec.scenarioConfig.initialVolumeOverridesMl,
    status: failed ? "integration-failure" : "run-complete",
    stepsAttempted: failed ? 100 : spec.stepCount,
    stepsAccepted: failed ? 99 : spec.stepCount,
    failureReasons: failed ? ["synthetic-integration-failure"] : [],
    initialTotalBloodVolumeMl: 5_000,
    finalTotalBloodVolumeMl: 5_000,
    maximumAbsoluteBloodVolumeResidualMl: 0,
    minimumCompartmentVolumeMl: 20,
    finalTimeSec: failed ? 0.2 : 32,
    finalCycleSamples: samples,
    retainedRawCycles: [],
    exactCycleBoundaryStates: [],
    periodicity: {
      status: numericalEligible ? "established" : "not-established",
      periodicityEstablished: numericalEligible,
    },
    numericalEligibility: {
      policySource: "predeclared-protocol-v2",
      periodicityRequired: true,
      checks: {
        completedRun: !failed,
        allAcceptedOutputsFinite: true,
        allCompartmentVolumesPositive: true,
        bloodVolumeLedgerWithinTolerance: true,
        requiredPeriodicityEstablished: numericalEligible,
      },
      passed: numericalEligible,
      failureReasons: numericalEligible ? [] : ["requiredPeriodicityEstablished"],
      excludedMetrics: ["v-loop"],
    },
    reportOnlyRawCycleDiagnostics: {
      availability: "available",
      events: {
        mitralOpeningGradientUpCrossingProxyPhase01: 0.56,
        leftAtrialPrescribedCalciumEventOnsetPhase01: 0.78,
        mitralClosureGradientDownCrossingProxyPhase01: 0.04,
      },
      pressureWaves: {
        xTrough: { pressureMmHg: 5.5 },
        vPeak: { pressureMmHg: 9.5 },
        yTrough: { pressureMmHg: 6.3 },
      },
      leftAtrialPvLobes: rawLobes,
    },
    fillingRelaxationDiagnostics: {
      availability: "available",
      eligibility: { eligible: combinedEligible },
      broadOperatingPointEligibility: {
        applied: true,
        eligible: broadEligible,
        checks: [
          {
            id: "cardiac-output",
            eligible: broadEligible,
            observed: broadEligible ? 5.2 : 2.4,
            boundsOrLimit: { minimum: 3, maximum: 8 },
          },
        ],
      },
      operatingPoint: {
        cardiacOutputLPerMin: broadEligible ? 5.2 : 2.4,
        leftVentricle: {
          ejectionFractionProxy01: 0.58,
          endDiastolicVolumeProxyMl: 135,
          endSystolicVolumeProxyMl: 57,
        },
      },
      detailedPhysiologyReportOnly: {
        lvRelaxation: {
          preferredTauSec: 0.036,
          preferredFitValidity: "valid",
          peakNegativeDpDtMmHgPerSec: -1_420,
        },
        mitral: {
          ePeakMlPerSec: 410,
          aPeakMlPerSec: 300,
          eToA: 1.37,
          interpeakValleyMlPerSec: 90,
        },
        pulmonaryVenous: { sToD: 1.2 },
        leftAtrialPhasicVolumes: {
          reservoirFillingMl: 31,
          conduitEmptyingMl: 21,
          pumpEmptyingMl: 10,
        },
      },
      leftAtrialVLoopReportOnly: {
        rawLobeMeasurement: rawLobes,
        strictMatchedVolume: {
          availability: "available",
          overlapVolumeMl: 16,
          normalizedOverlapWidth01: 0.55,
          gapMmHg: { mean: 1.4 },
          integratedGapMmHgMl: 22,
          normalizedIntegratedGap: 0.08,
        },
      },
    },
    vLoopUsePolicy: {
      status: "report-only",
      affectsSettling: false,
      affectsNumericalEligibility: false,
      affectsOperatingPointEligibility: false,
      affectsSelection: false,
      affectsRangeRevision: false,
    },
  } as unknown as FivePatchPhysiologyEnvelopeRunResultV2;
}

function syntheticSample(
  index: number,
  count: number,
  candidateIndex: number,
): FivePatchEnvelopeAcceptedStepSampleV1 {
  const phase01 = (index + 1) / count;
  const angle = 2 * Math.PI * phase01;
  const lap = 8 + 2.2 * Math.sin(angle) + candidateIndex * 0.01;
  const lvp = 65 + 58 * Math.sin(angle - 0.25);
  const leftAtriumMl = 76 + 13 * Math.cos(angle);
  return {
    acceptedStepIndex: index + 1,
    timeSec: 31 + phase01,
    phase01,
    volumesMl: {
      leftAtriumMl,
      leftVentricleMl: 100 - 35 * Math.cos(angle),
      systemicArteryMl: 700,
      systemicVeinMl: 3_000,
      rightAtriumMl: 70,
      rightVentricleMl: 120,
      pulmonaryArteryMl: 230,
      pulmonaryVeinMl: 650,
    },
    pressuresMmHg: {
      leftAtriumMmHg: lap,
      leftVentricleMmHg: lvp,
      systemicArteryMmHg: 95 + 25 * Math.sin(angle - 0.2),
      systemicVeinMmHg: 4,
      rightAtriumMmHg: 3,
      rightVentricleMmHg: 20,
      pulmonaryArteryMmHg: 15,
      pulmonaryVeinMmHg: 9 + 1.3 * Math.sin(angle - 0.1),
    },
    flowsMlPerSec: {
      mitralMlPerSec:
        360 * Math.max(0, Math.sin(2 * Math.PI * (phase01 - 0.56))),
      aorticMlPerSec: 280 * Math.max(0, Math.sin(angle)),
      tricuspidMlPerSec: 0,
      pulmonaryValveMlPerSec: 0,
      systemicPeripheralMlPerSec: 0,
      systemicVenousMlPerSec: 0,
      pulmonaryPeripheralMlPerSec: 0,
      pulmonaryVenousMlPerSec: 90 + 55 * Math.sin(angle - 0.3),
    },
    freeCalciumUm: {
      leftAtrium: 0.2 + Math.max(0, Math.sin(angle - 4.8)),
      rightAtrium: 0.2 + Math.max(0, Math.sin(angle - 4.7)),
      leftFreeWall: 0.2 + Math.max(0, Math.sin(angle)),
      septum: 0.2 + Math.max(0, Math.sin(angle)),
      rightFreeWall: 0.2 + Math.max(0, Math.sin(angle - 0.1)),
    },
    activations01: {
      leftAtrium: Math.max(0, Math.sin(angle - 4.8)),
      rightAtrium: Math.max(0, Math.sin(angle - 4.7)),
      leftFreeWall: Math.max(0, Math.sin(angle)),
      septum: Math.max(0, Math.sin(angle)),
      rightFreeWall: Math.max(0, Math.sin(angle - 0.1)),
    },
    reportOnlyMechanismReadback: {
      leftAtrium: {
        fiberLogStrain: 0.04 * Math.cos(angle),
        fiberLogStrainBackwardDifferenceRatePerSec: -0.25 * Math.sin(angle),
        pressureComponentsMmHg: {
          equilibriumPassiveMmHg: 3.2 + 0.4 * Math.cos(angle),
          effectiveLandActiveMmHg: 4.5 + 1.4 * Math.sin(angle),
          slsOverstressMmHg: 0.3 * Math.cos(angle - 0.4),
          totalMmHg: lap,
          componentSumMinusTotalMmHg: 0,
        },
      },
      mitralValve: {
        pressureGradientMmHg: lap - lvp,
        openFraction01: Math.max(0, Math.sin(angle)),
      },
      leftVentricularPressureBackwardDifferenceRateMmHgPerSec:
        58 * Math.cos(angle - 0.25),
      leftVentricularPressureDecayRatePositiveMmHgPerSec:
        Math.max(0, -58 * Math.cos(angle - 0.25)),
    },
    totalBloodVolumeResidualMl: 0,
  } as unknown as FivePatchEnvelopeAcceptedStepSampleV1;
}
