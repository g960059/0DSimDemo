import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_ARTIFACT_SVG_V1_CLAIM,
  CORONARY_V3_REDUCED_PRESSURE_STEP_ARTIFACT_SVG_V1_ID,
  renderCoronaryV3ReducedPressureStepArtifactsSvgV1,
} from "@/engine/coronary/diagnostics/CoronaryV3ReducedPressureStepArtifactSvgV1";
import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V1_ID,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepNumericalCharacterizationV1";
import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V2_ID,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2,
  type CoronaryV3ReducedPressureStepArmIdV2,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepNumericalCharacterizationV2";
import {
  CORONARY_V3_STEP_RESPONSE_METRICS_V1_ID,
} from "@/engine/coronary/experiments/CoronaryV3StepResponseMetricsV1";
import {
  renderCoronaryV3ReducedPressureStepArtifactsSvgCliV1,
} from "@/tools/scientific/renderCoronaryV3ReducedPressureStepArtifactsSvgV1";

describe("coronary V3 reduced pressure-step raw artifact SVG", () => {
  it("renders four fail-closed panels from every V1/V2 coarse/fine raw window", () => {
    const v1 = fixtureArtifact("v1");
    const v2 = fixtureArtifact("v2");
    const beforeV1 = JSON.stringify(v1);
    const beforeV2 = JSON.stringify(v2);
    const svg = renderCoronaryV3ReducedPressureStepArtifactsSvgV1(v1, v2);

    expect(JSON.stringify(v1)).toBe(beforeV1);
    expect(JSON.stringify(v2)).toBe(beforeV2);
    expect(svg).toContain(CORONARY_V3_REDUCED_PRESSURE_STEP_ARTIFACT_SVG_V1_ID);
    expect(svg).toContain("biology=false · physiology=false · shape acceptance=false");
    expect(svg).toContain("no interpolation, resampling, smoothing, or fitting");
    expect(svg).toContain("Pgradient / aggregate inlet flow");
    expect(svg).toContain("seconds after own intervention (window end)");
    expect(svg).toContain("80 → 100 mmHg · active tone");
    expect(svg).toContain("80 → 100 mmHg · frozen tone");
    expect(svg).toContain("100 → 80 mmHg · active tone");
    expect(svg).toContain("100 → 80 mmHg · frozen tone");
    expect(svg).toContain("V1 failed gates recorded by artifact");
    expect(svg).toContain(
      "100-to-80:tone-frozen.passiveOppositeAmplitude — coarse and fine opposite-direction passive excursions are both required",
    );
    expect(svg).toContain("V2 metric identity recorded by artifact");
    expect(svg).toContain("firstFiveWindowMaximumAbsoluteTransient");
    expect(svg).toContain("direction-independent-maximum-absolute-transient-from-baseline");
    expect(svg).toContain("cross-dt 5%");
    expect(svg.match(/data-panel-arm=/g)).toHaveLength(4);
    for (const seriesId of ["v1:coarse", "v1:fine", "v2:coarse", "v2:fine"]) {
      expect(svg.match(new RegExp(`data-series="${seriesId}"`, "g")))
        .toHaveLength(4);
    }
    expect(svg.match(/data-raw-window-point=/g)).toHaveLength(112);
    expect(svg.match(/data-guide="intervention"/g)).toHaveLength(4);
    expect(svg.match(/data-guide="[^"]+:baseline"/g)).toHaveLength(16);
    expect(svg.match(/data-guide="[^"]+:final"/g)).toHaveLength(16);
    expect(svg.match(/data-guide="[^"]+:half-response"/g)).toHaveLength(16);
    expect(svg).toContain("&quot;biologicalAcceptanceClaimed&quot;:false");
    expect(svg).toContain("&quot;physiologicalAcceptanceClaimed&quot;:false");
    expect(svg).toContain("&quot;shapeAcceptanceClaimed&quot;:false");
    expect(svg).not.toMatch(/NaN|Infinity/);
    expect(svg).not.toContain("<script");
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_ARTIFACT_SVG_V1_CLAIM)
      .toMatchObject({
        interpolationApplied: false,
        resamplingApplied: false,
        smoothingApplied: false,
        fittingApplied: false,
        biologicalAcceptanceClaimed: false,
        physiologicalAcceptanceClaimed: false,
        shapeAcceptanceClaimed: false,
        originalPaperT50ReproductionClaimed: false,
      });
  });

  it("rejects unknown identity, nonfinite data, missing arms, or arm mismatches", () => {
    const unknownSchema = structuredClone(fixtureArtifact("v1"));
    unknownSchema.characterizationId = "unknown-characterization";
    expect(() => renderCoronaryV3ReducedPressureStepArtifactsSvgV1(
      unknownSchema,
      fixtureArtifact("v2"),
    )).toThrow(/characterizationId is unsupported/);

    const unknownPolicy = structuredClone(fixtureArtifact("v2"));
    unknownPolicy.policy.policyId = "unknown-policy";
    expect(() => renderCoronaryV3ReducedPressureStepArtifactsSvgV1(
      fixtureArtifact("v1"),
      unknownPolicy,
    )).toThrow(/policyId is unsupported/);

    const nonfinite = structuredClone(fixtureArtifact("v1"));
    nonfinite.coarse.armSamples["80-to-100:tone-active"]
      .metrics.beatObservables[0]!.pressureFlowMmHgSecPerMl = Number.NaN;
    expect(() => renderCoronaryV3ReducedPressureStepArtifactsSvgV1(
      nonfinite,
      fixtureArtifact("v2"),
    )).toThrow(/P\/Q must be finite/);

    const missingArm = structuredClone(fixtureArtifact("v2"));
    delete (missingArm.fine.armSamples as Partial<FixtureArmRecord>)[
      "100-to-80:tone-frozen"
    ];
    expect(() => renderCoronaryV3ReducedPressureStepArtifactsSvgV1(
      fixtureArtifact("v1"),
      missingArm,
    )).toThrow(/exactly the four declared arm ids/);

    const armMismatch = structuredClone(fixtureArtifact("v2"));
    armMismatch.coarse.armSamples["100-to-80:tone-frozen"].armId =
      "80-to-100:tone-frozen";
    expect(() => renderCoronaryV3ReducedPressureStepArtifactsSvgV1(
      fixtureArtifact("v1"),
      armMismatch,
    )).toThrow(/armId is unsupported/);

    const missingWindow = structuredClone(fixtureArtifact("v2"));
    missingWindow.fine.armSamples["80-to-100:tone-frozen"]
      .metrics.beatObservables.splice(3, 1);
    expect(() => renderCoronaryV3ReducedPressureStepArtifactsSvgV1(
      fixtureArtifact("v1"),
      missingWindow,
    )).toThrow(/not consecutive|first five accepted windows/);
  });

  it("CLI validates both complete artifacts before writing the SVG", () => {
    const temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), "circleheart-coronary-step-svg-"),
    );
    try {
      const v1Path = path.join(temporaryDirectory, "v1.json");
      const v2Path = path.join(temporaryDirectory, "v2.json");
      const outputPath = path.join(temporaryDirectory, "diagnostic.svg");
      writeFileSync(v1Path, JSON.stringify(fixtureArtifact("v1")));
      writeFileSync(v2Path, JSON.stringify(fixtureArtifact("v2")));

      const rendered = renderCoronaryV3ReducedPressureStepArtifactsSvgCliV1([
        "--v1-input",
        v1Path,
        "--v2-input",
        v2Path,
        "--output",
        outputPath,
      ]);
      expect(rendered).toEqual({
        v1InputPath: v1Path,
        v2InputPath: v2Path,
        outputPath,
      });
      expect(readFileSync(outputPath, "utf8")).toContain(
        CORONARY_V3_REDUCED_PRESSURE_STEP_ARTIFACT_SVG_V1_ID,
      );

      const rejectedOutput = path.join(temporaryDirectory, "rejected.svg");
      const invalidV2 = fixtureArtifact("v2");
      invalidV2.characterizationId = "unknown";
      writeFileSync(v2Path, JSON.stringify(invalidV2));
      expect(() => renderCoronaryV3ReducedPressureStepArtifactsSvgCliV1([
        "--v1-input",
        v1Path,
        "--v2-input",
        v2Path,
        "--output",
        rejectedOutput,
      ])).toThrow(/characterizationId is unsupported/);
      expect(existsSync(rejectedOutput)).toBe(false);
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});

type ArmId = CoronaryV3ReducedPressureStepArmIdV2;

type FixtureBeat = {
  beatIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  meanUpstreamPressureMmHg: number;
  meanDownstreamReferencePressureMmHg: number;
  meanObservedFlowMlPerSec: number;
  meanCoronaryBloodVolumeMl: number;
  pressureGradientMmHg: number;
  pressureFlowMmHgSecPerMl: number;
};

type FixtureSample = {
  armId: ArmId;
  dtSec: number;
  interventionTimeSec: number;
  metrics: {
    metricsId: string;
    measurementStation: { kind: string };
    exactDankelmanMeasurementStationEstablished: boolean;
    eligibleForDirectOriginalPaperT50ReproductionClaim: boolean;
    physiologicalAcceptanceEstablished: boolean;
    independentValidationEstablished: boolean;
    baseline: FixtureSummary;
    final: FixtureSummary;
    halfwayTargetPressureFlowMmHgSecPerMl: number;
    beatObservables: FixtureBeat[];
  };
  allFinite: boolean;
  conservationToleranceSatisfied: boolean;
};

type FixtureSummary = {
  startTimeSec: number;
  endTimeSec: number;
  contributingBeatCount: number;
  contributingDurationSec: number;
  meanUpstreamPressureMmHg: number;
  meanDownstreamReferencePressureMmHg: number;
  meanPressureGradientMmHg: number;
  meanObservedFlowMlPerSec: number;
  meanPressureFlowMmHgSecPerMl: number;
};

type FixtureArmRecord = Record<ArmId, FixtureSample>;
type FixtureIntegration = {
  role: "coarse" | "fine";
  dtSec: number;
  allFiniteAndConserved: boolean;
  armSamples: FixtureArmRecord;
};

type FixtureArtifact = {
  characterizationId: string;
  policy: Record<string, unknown>;
  numericalQaPassed: boolean;
  biologicalValidationEstablished: boolean;
  physiologicalAcceptanceEstablished: boolean;
  releaseAcceptanceEstablished: boolean;
  coarse: FixtureIntegration;
  fine: FixtureIntegration;
  comparisonByArm: Record<ArmId, Record<string, unknown>>;
};

function fixtureArtifact(version: "v1" | "v2"): FixtureArtifact {
  const coarseDt = version === "v1" ? 0.002 : 0.001;
  const fineDt = version === "v1" ? 0.001 : 0.0005;
  const comparisons = Object.fromEntries(
    CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2.map((armId) => [
      armId,
      version === "v1" ? fixtureV1Comparison(armId) : fixtureV2Comparison(armId),
    ]),
  ) as Record<ArmId, Record<string, unknown>>;
  return {
    characterizationId: version === "v1"
      ? CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V1_ID
      : CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V2_ID,
    policy: version === "v1"
      ? {
        policyId:
          CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1.policyId,
        coarseDtSec: coarseDt,
        fineDtSec: fineDt,
        acceptedWindowDurationSec: 1,
        comparisonTimeOrigin: "seconds-after-own-intervention",
        originalPaperT50ComparisonApplied: false,
        biologicalTolerance: false,
      }
      : {
        policyId:
          CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2.policyId,
        coarseDtSec: coarseDt,
        fineDtSec: fineDt,
        acceptedWindowDurationSec: 1,
        comparisonTimeOrigin: "seconds-after-own-intervention",
        originalPaperT50ComparisonApplied: false,
        biologicalTolerance: false,
        physiologicalThresholdsDefined: false,
        firstFiveAcceptedWindowCount: 5,
        firstFiveAcceptedWindowTransientDefinition:
          CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2
            .firstFiveAcceptedWindowTransientDefinition,
      },
    numericalQaPassed: version === "v2",
    biologicalValidationEstablished: false,
    physiologicalAcceptanceEstablished: false,
    releaseAcceptanceEstablished: false,
    coarse: fixtureIntegration(version, "coarse", coarseDt),
    fine: fixtureIntegration(version, "fine", fineDt),
    comparisonByArm: comparisons,
  };
}

function fixtureIntegration(
  version: "v1" | "v2",
  role: "coarse" | "fine",
  dtSec: number,
): FixtureIntegration {
  return {
    role,
    dtSec,
    allFiniteAndConserved: true,
    armSamples: Object.fromEntries(
      CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2.map((armId, index) => [
        armId,
        fixtureSample(
          armId,
          dtSec,
          100 + index * 10 + (version === "v2" ? 3 : 0),
          role === "fine" ? 0.04 : 0,
        ),
      ]),
    ) as FixtureArmRecord,
  };
}

function fixtureSample(
  armId: ArmId,
  dtSec: number,
  interventionTimeSec: number,
  offset: number,
): FixtureSample {
  const baseline = 10 + offset;
  const final = 12 + offset;
  const values = [
    baseline,
    baseline,
    11 + offset,
    11.5 + offset,
    final,
    final,
    final,
  ];
  return {
    armId,
    dtSec,
    interventionTimeSec,
    metrics: {
      metricsId: CORONARY_V3_STEP_RESPONSE_METRICS_V1_ID,
      measurementStation: {
        kind: "venous-boundary-pressure-flow-surrogate",
      },
      exactDankelmanMeasurementStationEstablished: false,
      eligibleForDirectOriginalPaperT50ReproductionClaim: false,
      physiologicalAcceptanceEstablished: false,
      independentValidationEstablished: false,
      baseline: {
        startTimeSec: interventionTimeSec - 2,
        endTimeSec: interventionTimeSec,
        contributingBeatCount: 2,
        contributingDurationSec: 2,
        meanUpstreamPressureMmHg: 5 + baseline * 2,
        meanDownstreamReferencePressureMmHg: 5,
        meanPressureGradientMmHg: baseline * 2,
        meanObservedFlowMlPerSec: 2,
        meanPressureFlowMmHgSecPerMl: baseline,
      },
      final: {
        startTimeSec: interventionTimeSec + 3,
        endTimeSec: interventionTimeSec + 5,
        contributingBeatCount: 2,
        contributingDurationSec: 2,
        meanUpstreamPressureMmHg: 5 + final * 2,
        meanDownstreamReferencePressureMmHg: 5,
        meanPressureGradientMmHg: final * 2,
        meanObservedFlowMlPerSec: 2,
        meanPressureFlowMmHgSecPerMl: final,
      },
      halfwayTargetPressureFlowMmHgSecPerMl: (baseline + final) / 2,
      beatObservables: values.map((pressureFlow, index) => {
        const startTimeSec = interventionTimeSec - 2 + index;
        const flow = 2;
        const downstream = 5;
        const gradient = pressureFlow * flow;
        return {
          beatIndex: index,
          startTimeSec,
          endTimeSec: startTimeSec + 1,
          meanUpstreamPressureMmHg: downstream + gradient,
          meanDownstreamReferencePressureMmHg: downstream,
          meanObservedFlowMlPerSec: flow,
          meanCoronaryBloodVolumeMl: 30,
          pressureGradientMmHg: gradient,
          pressureFlowMmHgSecPerMl: pressureFlow,
        };
      }),
    },
    allFinite: true,
    conservationToleranceSatisfied: true,
  };
}

function fixtureV1Comparison(armId: ArmId): Record<string, unknown> {
  const passivePassed = armId !== "100-to-80:tone-frozen";
  return {
    armId,
    coarseDtSec: 0.002,
    fineDtSec: 0.001,
    dtBindingPassed: true,
    integrity: { passed: true },
    surrogateBoundary: { passed: true },
    crossing: { passed: true },
    finalNormalizedResponse: { passed: true },
    passiveOppositeAmplitude: {
      passed: passivePassed,
      failureReason: passivePassed
        ? null
        : "coarse and fine opposite-direction passive excursions are both required",
    },
    numericalQaPassed: passivePassed,
  };
}

function fixtureV2Comparison(armId: ArmId): Record<string, unknown> {
  return {
    armId,
    coarseDtSec: 0.001,
    fineDtSec: 0.0005,
    dtBindingPassed: true,
    integrity: { passed: true },
    surrogateBoundary: { passed: true },
    crossing: { passed: true },
    finalNormalizedResponse: { passed: true },
    firstFiveWindowMaximumAbsoluteTransient: {
      definition:
        "direction-independent-maximum-absolute-transient-from-baseline",
      requiredAcceptedWindowCount: 5,
      maximumAllowedRelativeDifference: 0.05,
      oppositeDirectionExcursionRequired: false,
      passed: true,
    },
    numericalQaPassed: true,
  };
}
