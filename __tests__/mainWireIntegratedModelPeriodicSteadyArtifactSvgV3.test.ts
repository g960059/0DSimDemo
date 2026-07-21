import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_CLAIM_V3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_UNAVAILABLE_COLUMNS_V3,
  renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3,
} from "@/engine/myocardium/diagnostics/MainWireIntegratedModelPeriodicSteadyArtifactSvgV3";
import { renderMainWireIntegratedModelPeriodicSteadyArtifactSvgCliV3 } from "@/tools/scientific/renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3";

describe("integrated V3 periodic raw-evidence artifact SVG", () => {
  it("plots each artifact endpoint and accepted event without resampling, smoothing, fitting, or health promotion", () => {
    const artifact = artifactFixture("bounded-smoke", false);
    const before = JSON.stringify(artifact);
    const svg =
      renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3(artifact);

    expect(JSON.stringify(artifact)).toBe(before);
    expect(svg).toContain(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_V3_ID,
    );
    expect(svg).toContain("RAW ACCEPTED ENDPOINTS ONLY — NO RESAMPLING");
    expect(svg).toContain("EXPLORATORY — NOT A HEALTH WAVEFORM ASSESSMENT");
    expect(svg).toContain("executionPurpose: bounded-smoke");
    expect(svg).toContain("numerical classification: not-converged");
    expect(svg).toContain(
      "NOT ASSESSED: executionPurpose=bounded-smoke is exploratory",
    );
    expect(svg).toContain("0 pass / 0 fail / 6 not-assessed");
    expect(svg).toContain("Ao / LV absolute pressure");
    expect(svg).toContain("LV chamber blood volume");
    expect(svg).toContain("Native valve flow");
    expect(svg).toContain("Coronary flow at two artifact stations");
    expect(svg).toContain(
      "Five lumped wall free-calcium signals with accepted event guides",
    );
    expect(svg).toContain("Accepted event identity timeline");
    for (const seriesId of [
      "aortic-pressure",
      "left-ventricular-pressure",
      "left-ventricular-volume",
      "aortic-valve-flow",
      "mitral-valve-flow",
      "total-coronary-inlet-flow",
      "lad-subendocardial-qm-flow",
      "calcium-LA",
      "calcium-LVFW",
      "calcium-SEP",
      "calcium-RVFW",
      "calcium-RA",
    ]) {
      expect(svg).toContain(`data-series="${seriesId}"`);
    }
    const polylinePoints = [
      ...svg.matchAll(/<polyline[^>]* points="([^"]+)"/g),
    ];
    expect(polylinePoints).toHaveLength(12);
    expect(
      polylinePoints.every(
        (match) => match[1]!.trim().split(/\s+/).length === 4,
      ),
    ).toBe(true);
    expect(svg.match(/data-event-marker=/g)).toHaveLength(6);
    expect(svg.match(/data-event-guide=/g)).toHaveLength(6);
    expect(svg).toContain("atrial&lt;&amp;&gt;");
    expect(svg).not.toContain("atrial<&>");
    expect(svg).toContain("a separate LAD-total inlet column is absent");
    expect(svg).toContain("Deposit class is not inferred from identity text");
    expect(svg).not.toMatch(/NaN|Infinity/);
    expect(svg).not.toContain("<script");
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_CLAIM_V3,
    ).toMatchObject({
      interpolationApplied: false,
      resamplingApplied: false,
      smoothingApplied: false,
      shapeFittingApplied: false,
      inferredMissingSignals: false,
      noncanonicalArtifactMayBeShownAsHealthy: false,
    });
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_UNAVAILABLE_COLUMNS_V3,
    ).toContain("separate-LAD-total-inlet-flow");
  });

  it("labels only canonical numerical P1 as reference-context assessment eligible and fails closed for inconsistent or malformed artifacts", () => {
    const eligible = artifactFixture("canonical-evidence", true);
    const eligibleSvg =
      renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3(eligible);
    expect(eligibleSvg).toContain(
      "REFERENCE-CONTEXT ASSESSMENT ELIGIBLE — NOT PHYSIOLOGICAL VALIDATION",
    );
    expect(eligibleSvg).toContain("5 pass / 1 fail / 0 not-assessed");
    expect(eligibleSvg).toContain(
      "construction context, not independent validation",
    );

    const canonicalUnsettled = artifactFixture("canonical-evidence", false);
    expect(
      renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3(
        canonicalUnsettled,
      ),
    ).toContain(
      "NOT ASSESSED: canonical evidence has not established numerical P1 convergence",
    );
    const fixed = artifactFixture("fixed-horizon-characterization", false);
    expect(
      renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3(fixed),
    ).toContain(
      "executionPurpose=fixed-horizon-characterization is exploratory",
    );

    const inconsistent = structuredClone(
      artifactFixture("bounded-smoke", false),
    );
    inconsistent.terminalHealthyReferenceProjection.assessmentEligibility.eligible = true;
    expect(() =>
      renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3(inconsistent),
    ).toThrow(/health eligibility is inconsistent/);

    const resampled = structuredClone(artifactFixture("bounded-smoke", false));
    resampled.terminalCycleTrace.resamplingApplied = true as never;
    expect(() =>
      renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3(resampled),
    ).toThrow(/raw endpoint provenance/);

    const nonfinite = structuredClone(artifactFixture("bounded-smoke", false));
    nonfinite.terminalCycleTrace.samples[1]!.freeCalciumUMByWall.SEP =
      Number.NaN;
    expect(() =>
      renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3(nonfinite),
    ).toThrow(/freeCalciumUMByWall.SEP must be finite/);

    const missingColumn = structuredClone(
      artifactFixture("bounded-smoke", false),
    );
    delete (
      missingColumn.terminalCycleTrace.samples[0]!.coronary as {
        ladSubendocardialQmFlowMlPerSec?: number;
      }
    ).ladSubendocardialQmFlowMlPerSec;
    expect(() =>
      renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3(missingColumn),
    ).toThrow(/ladSubendocardialQmFlowMlPerSec must be finite/);

    const countMismatch = structuredClone(
      artifactFixture("bounded-smoke", false),
    );
    countMismatch.terminalCycleTrace.sampleCount += 1;
    expect(() =>
      renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3(countMismatch),
    ).toThrow(/match sampleCount/);
  });

  it("renders an existing serialized periodic artifact through the CLI without executing the numerical model", () => {
    const temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), "circleheart-integrated-v3-periodic-svg-"),
    );
    try {
      const inputPath = path.join(temporaryDirectory, "periodic-v3.json");
      const outputPath = path.join(temporaryDirectory, "periodic-v3.svg");
      writeFileSync(
        inputPath,
        JSON.stringify(artifactFixture("bounded-smoke", false)),
      );

      const rendered =
        renderMainWireIntegratedModelPeriodicSteadyArtifactSvgCliV3([
          "--input",
          inputPath,
          "--output",
          outputPath,
        ]);

      expect(rendered).toMatchObject({
        artifactId:
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_V3_ID,
        inputPath,
        outputPath,
      });
      expect(rendered.byteLength).toBeGreaterThan(1_000);
      expect(readFileSync(outputPath, "utf8")).toContain(
        "EXPLORATORY — NOT A HEALTH WAVEFORM ASSESSMENT",
      );
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});

type Purpose =
  "canonical-evidence" | "bounded-smoke" | "fixed-horizon-characterization";

function artifactFixture(purpose: Purpose, numericalP1: boolean) {
  if (numericalP1 && purpose !== "canonical-evidence") {
    throw new Error("test fixture only permits canonical numerical P1");
  }
  const eligible = numericalP1;
  const gateStatuses = eligible
    ? (["pass", "pass", "pass", "pass", "pass", "fail"] as const)
    : ([
        "not-assessed",
        "not-assessed",
        "not-assessed",
        "not-assessed",
        "not-assessed",
        "not-assessed",
      ] as const);
  return {
    artifactSchemaVersion: 3,
    experimentId:
      "main-wire-integrated-composed-regular-sinus-all-off-periodic-steady-v3",
    executionPurpose: purpose,
    protocolIdentityHash: "a".repeat(64),
    requestedMaximumCycleCount: 1,
    completedCycleCount: 1,
    terminationReason: numericalP1
      ? "period1-converged"
      : "maximum-cycles-reached",
    classification: {
      status: numericalP1 ? "period1-converged" : "not-converged",
    },
    numericalPeriod1Established: numericalP1,
    allCyclesFiniteConservedAndEventExact: true,
    physiologicalAcceptanceEstablished: false,
    independentValidationEstablished: false,
    releaseAcceptanceEstablished: false,
    terminalHealthyReferenceProjection: {
      assessmentEligibility: {
        eligible,
        requirement: "canonical-evidence-and-numerical-period1-converged",
        numericalPeriod1Established: numericalP1,
        executionPurpose: purpose,
      },
      gateResults: gateStatuses.map((status, index) => ({
        gateId: `gate-${index + 1}`,
        status,
      })),
      physiologyValidated: false,
      clinicalValidationClaimed: false,
      comparisonRole: "construction-context-not-independent-validation",
    },
    terminalCheckpoint: {
      checkpointSha256: "b".repeat(64),
    },
    terminalCheckpointExactRoundTripVerified: true,
    terminalCycleTrace: {
      cycleIndex: 1,
      startTimeSec: 0,
      endTimeSec: 1,
      sampleCount: 4,
      samples: [0.25, 0.5, 0.75, 1].map((phase, index) => ({
        cycleIndex: 1,
        acceptedStepIndexWithinCycle: index + 1,
        acceptedTimeSec: phase,
        cyclePhase01: phase,
        acceptedDtSec: 0.25,
        absolutePressureMmHg: {
          Ao: [72, 88, 80, 68][index]!,
          LV: [8, 96, 34, 6][index]!,
        },
        chamberVolumeMl: { LV: [135, 112, 82, 128][index]! },
        valveFlowMlPerSec: {
          AoV: [0, 620, 0, 0][index]!,
          MV: [190, 0, 0, 220][index]!,
        },
        coronary: {
          totalInletFlowMlPerSec: [1.2, 0.8, 1.7, 1.5][index]!,
          ladSubendocardialQmFlowMlPerSec: [0.2, 0.1, 0.5, 0.4][index]!,
        },
        freeCalciumUMByWall: {
          LA: [0.1, 0.7, 0.3, 0.12][index]!,
          LVFW: [0.1, 0.15, 0.9, 0.4][index]!,
          SEP: [0.1, 0.14, 0.8, 0.35][index]!,
          RVFW: [0.1, 0.13, 0.7, 0.3][index]!,
          RA: [0.1, 0.65, 0.28, 0.11][index]!,
        },
        acceptedEventIdentity: eventIdentity(index),
      })),
      retainedForGraphShapeInspection: true,
      resamplingApplied: false,
      shapeAcceptanceClaimed: false,
      interpretation:
        "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance",
    },
  };
}

function eventIdentity(index: number) {
  if (index === 0) {
    return {
      atrialCapturedActivationId: "atrial<&>",
      ventricularCapturedActivationId: null,
      deliveredCalciumDepositIds: [],
      scheduledCalciumDepositIds: ["deposit-a"],
    };
  }
  if (index === 1) {
    return {
      atrialCapturedActivationId: null,
      ventricularCapturedActivationId: null,
      deliveredCalciumDepositIds: ["deposit-a"],
      scheduledCalciumDepositIds: [],
    };
  }
  if (index === 2) {
    return {
      atrialCapturedActivationId: null,
      ventricularCapturedActivationId: "ventricular-1",
      deliveredCalciumDepositIds: [],
      scheduledCalciumDepositIds: ["deposit-v"],
    };
  }
  return {
    atrialCapturedActivationId: null,
    ventricularCapturedActivationId: null,
    deliveredCalciumDepositIds: ["deposit-v"],
    scheduledCalciumDepositIds: [],
  };
}
