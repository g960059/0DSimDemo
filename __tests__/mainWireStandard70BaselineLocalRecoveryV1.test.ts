import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  scoreMainWireBaselineOperatingPointV1,
  mainWireBaselineDesignBetterV1,
  mainWireBaselineDesignNeighborsV1,
} from "@/analysis/methods/mainWire/MainWireBaselineOperatingPointDesignV1";

import {
  buildMainWireBaselineConditioningSyntheticArtifactsV1,
} from "./fixtures/mainWireBaselineConditioningSyntheticFixtureV1";
import {
  buildMainWireBaselineConditioningCenterCandidateV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  buildMainWireStandard70BaselineLocalProposalSourceV1,
  type MainWireStandard70BaselineLocalProposalSourceV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineLocalProposalSourceV1";
import {
  runMainWireStandard70BaselineLocalRecoveryV1,
  type MainWireStandard70BaselineLocalRecoveryRequestV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineLocalRecoveryV1";
import {
  buildMainWireStandard70BaselineCalibrationRequestIdentityV1,
  evaluateMainWireStandard70BaselineCalibrationCandidateV1,
  MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
  type MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
  type MainWireStandard70BaselineCalibrationEvaluationRequestV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import {
  applyMainWireBaselineCalibrationParametersV1,
  readMainWireBaselineCalibrationParameterV1,
  transformMainWireBaselineCalibrationParameterV1,
  type MainWireBaselineCalibrationCandidateInputsV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import {
  resolveMainWireFittingReferenceV1,
} from "@/analysis/registry/MainWireFittingReferenceRegistryV1";

vi.mock("@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1",
  async (importOriginal) => ({
    ...await importOriginal<typeof import(
      "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1"
    )>(),
    evaluateMainWireStandard70BaselineCalibrationCandidateV1: vi.fn(),
  }));

const evaluate = vi.mocked(evaluateMainWireStandard70BaselineCalibrationCandidateV1);
let request: MainWireStandard70BaselineLocalRecoveryRequestV1;
let source: MainWireStandard70BaselineLocalProposalSourceV1;

beforeAll(async () => {
  const artifacts = await buildMainWireBaselineConditioningSyntheticArtifactsV1(1.02);
  request = {
    referenceId: "baseline",
    sourceArtifacts: {
      coarseArtifact: artifacts.coarse, refinedArtifact: artifacts.refined,
      perturbationAttributionArtifact: artifacts.attribution,
      stageArtifact: artifacts.stage,
    },
    syntheticTruthValues: [4_950, 1.25],
  };
  source = await buildMainWireStandard70BaselineLocalProposalSourceV1(request.sourceArtifacts);
});
beforeEach(() => {
  evaluate.mockReset();
  evaluate.mockImplementation(acceptedV1);
});

describe("baseline reference and executable local recovery", () => {
  it("registers the baseline target policy separately from selected parameters", () => {
    const reference = resolveMainWireFittingReferenceV1("baseline");
    expect(reference.label).toBe("baseline");
    expect(reference.target).toMatchObject({
      kind: "construction-corridors", referenceOutputsAreTargets: false,
    });
    expect(reference.selectedConstruction.candidateInputs).toEqual(
      buildMainWireBaselineConditioningCenterCandidateV1("rest-hr60"),
    );
    expect(() => resolveMainWireFittingReferenceV1("hfref")).toThrow(/unregistered/);
  });

  it("owns the source, runs a cold target and only the projected candidate, then compares", async () => {
    const progress: string[] = [];
    const result = await runMainWireStandard70BaselineLocalRecoveryV1(request,
      (stage) => progress.push(stage));
    expect(progress).toEqual(["source", "target", "proposal", "replay"]);
    expect(evaluate).toHaveBeenCalledTimes(2);
    const expected = applyMainWireBaselineCalibrationParametersV1(
      resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs,
      source.coordinates.map(({ parameterId }, index) => ({
        parameterId, value: request.syntheticTruthValues[index]!,
      })),
    );
    for (const [call] of evaluate.mock.calls) {
      expect(call).toEqual({
        ...expected, nominalDtSec: 0.001, initialization: { kind: "cold" },
      });
    }
    expect(result.status).toBe("replayed");
    if (result.status !== "replayed") return;
    expect(result.proposal.projectedDeclaredTruthMatchStatus).toBe("matched");
    expect(result.comparison.rows).toHaveLength(9);
    expect(result.comparison.maximumAbsoluteNormalizedDifference).toBe(0);
    expect(result.target).not.toHaveProperty("exactResult");
    expect(result.claim).toMatchObject({
      syntheticControlOnly: true, optimizerExecuted: false,
      postFitEnvelopeQualified: false, presetOrCaseFittingQualified: false,
    });
    expect(result.sourceIdentitySha256).toBe(source.sourceIdentitySha256);
  });

  it.each([[4_925, 1.25], [5_000, 1.25]])(
    "rejects invalid or nonlocal truth %s/%s before exact execution", async (tbv, active) => {
      await expect(runMainWireStandard70BaselineLocalRecoveryV1({
        ...request, syntheticTruthValues: [tbv, active],
      })).rejects.toThrow(/release lattice|local radius/);
      expect(evaluate).not.toHaveBeenCalled();
    },
  );

  it("replays the projected candidate even when it differs from the declared truth", async () => {
    evaluate.mockImplementationOnce(async (input = {}) => {
      const target = await acceptedV1(input);
      const otherCandidate = applyMainWireBaselineCalibrationParametersV1(
        input as MainWireBaselineCalibrationCandidateInputsV1,
        [{ parameterId: source.coordinates[1].parameterId, value: 1.23 }],
      );
      const otherResponse = await acceptedV1({ ...input, ...otherCandidate });
      return { ...target, objectiveChecks: otherResponse.objectiveChecks };
    });
    const result = await runMainWireStandard70BaselineLocalRecoveryV1(request);
    expect(result.status).toBe("replayed");
    if (result.status !== "replayed") return;
    expect(result.proposal.projectedDeclaredTruthMatchStatus).toBe("mismatched");
    expect(readMainWireBaselineCalibrationParameterV1(
      evaluate.mock.calls[1]![0] as MainWireBaselineCalibrationCandidateInputsV1,
      source.coordinates[1].parameterId,
    )).toBe(1.23);
    expect(result.comparison.maximumAbsoluteNormalizedDifference).toBe(0);
  });

  it("snapshots caller input before any await or progress callback", async () => {
    const mutable = structuredClone(request);
    const pending = runMainWireStandard70BaselineLocalRecoveryV1(mutable);
    (mutable.syntheticTruthValues as [number, number])[0] = 5_000;
    (mutable.sourceArtifacts as { stageArtifact: unknown }).stageArtifact = {};
    const result = await pending;
    expect(result.status).toBe("replayed");
    expect(result.syntheticTruthValues).toEqual([4_950, 1.25]);
  });

  it("preserves execution failure without invoking proposal or replay", async () => {
    evaluate.mockResolvedValueOnce({
      evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
      status: "numerical-unresolved", phase: "exact-execution",
      requestIdentitySha256: null, wallTimeMs: 1, message: "fixture failure", partial: null,
    });
    const result = await runMainWireStandard70BaselineLocalRecoveryV1(request);
    expect(result).toMatchObject({
      status: "stopped", stoppedAt: "target", target: { status: "numerical-unresolved" },
    });
    expect(evaluate).toHaveBeenCalledTimes(1);
  });

  it.each(["constructionGateStatus", "objectiveGateStatus", "safetySentinelStatus"] as const)(
    "stops on target %s failure", async (key) => {
      evaluate.mockImplementationOnce(async (input) => ({ ...await acceptedV1(input), [key]: "failed" }));
      expect(await runMainWireStandard70BaselineLocalRecoveryV1(request))
        .toMatchObject({ status: "stopped", stoppedAt: "target" });
      expect(evaluate).toHaveBeenCalledTimes(1);
    },
  );

  it("stops on replay failed IDs even when status labels claim passed", async () => {
    evaluate.mockImplementationOnce(acceptedV1).mockImplementationOnce(async (input) => ({
      ...await acceptedV1(input), failedObjectiveCheckIds: ["aortic-pressure.maximum"],
    }));
    expect(await runMainWireStandard70BaselineLocalRecoveryV1(request))
      .toMatchObject({ status: "stopped", stoppedAt: "replay" });
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it("does not replay a refused local proposal", async () => {
    evaluate.mockImplementationOnce(async (input) => {
      const value = await acceptedV1(input);
      return { ...value, objectiveChecks: value.objectiveChecks.map((check, index) =>
        index === 0 ? { ...check, actual: check.actual + 10 } : check) };
    });
    expect(await runMainWireStandard70BaselineLocalRecoveryV1(request))
      .toMatchObject({ status: "stopped", stoppedAt: "proposal",
        proposal: { status: "refused", reason: "residual-fraction-exceeded" } });
    expect(evaluate).toHaveBeenCalledTimes(1);
  });

  it.each(["requestIdentitySha256", "exactModelIdentitySha256", "constructionPolicyIdentitySha256"] as const)(
    "rejects evaluator %s drift", async (key) => {
      evaluate.mockImplementationOnce(async (input) => ({
        ...await acceptedV1(input), [key]: "f".repeat(64),
      }));
      await expect(runMainWireStandard70BaselineLocalRecoveryV1(request))
        .rejects.toThrow(/evaluator context differs/);
      expect(evaluate).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["unit", "minimum", "inventory"])("rejects replay %s drift", async (kind) => {
    evaluate.mockImplementationOnce(acceptedV1).mockImplementationOnce(async (input) => {
      const value = await acceptedV1(input);
      return { ...value, objectiveChecks: kind === "inventory" ? value.objectiveChecks.slice(1)
        : value.objectiveChecks.map((check, index) => index === 0
          ? { ...check, ...(kind === "unit" ? { unit: "bad" } : { minimum: -1 }) } : check) };
    });
    await expect(runMainWireStandard70BaselineLocalRecoveryV1(request))
      .rejects.toThrow(/observation differs/);
  });
});

describe("bounded baseline operating-point design", () => {
  it("changes only declared coordinates on the release lattice and keeps HR fixed", () => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const neighbors = mainWireBaselineDesignNeighborsV1(anchor, anchor, 1);
    expect(neighbors).toHaveLength(8);
    for (const point of neighbors) {
      expect(point.hemodynamicResearchInputs.heartRateBpm).toBe(60);
      expect(point.hemodynamicResearchInputs.venousTone).toBe(anchor.hemodynamicResearchInputs.venousTone);
      expect(point.hemodynamicResearchInputs.arterialStiffness).toBe(anchor.hemodynamicResearchInputs.arterialStiffness);
      expect(point.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall)
        .toEqual(anchor.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall);
      expect(point.hemodynamicResearchInputs.totalBloodVolumeMl % 50).toBe(0);
    }
    const edge = applyMainWireBaselineCalibrationParametersV1(anchor, [
      { parameterId: "hemodynamics.total-blood-volume-ml", value: 5200 },
    ]);
    expect(mainWireBaselineDesignNeighborsV1(anchor, edge, 1).every((point) =>
      point.hemodynamicResearchInputs.totalBloodVolumeMl <= 5200)).toBe(true);
    expect(mainWireBaselineDesignNeighborsV1(anchor, anchor, 0.25).every((point) =>
      point.hemodynamicResearchInputs.totalBloodVolumeMl % 50 === 0)).toBe(true);
  });

  it("does not trade a failed safety gate for a better pressure/flow score", async () => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const good = await acceptedV1({ ...anchor, nominalDtSec: 0.002 });
    // This synthetic fixture exercises the ordering, not model physiology.
    const score = scoreMainWireBaselineOperatingPointV1(good);
    expect(score.feasible).toBe(true);
    for (const property of ["constructionGateStatus", "objectiveGateStatus", "safetySentinelStatus"] as const) {
      const rejected = scoreMainWireBaselineOperatingPointV1({ ...good, [property]: "failed" });
      expect(rejected.feasible).toBe(false);
      expect(mainWireBaselineDesignBetterV1(rejected, score)).toBe(false);
      expect(mainWireBaselineDesignBetterV1(score, rejected)).toBe(true);
    }
    const malformed = { ...good, objectiveChecks: good.objectiveChecks.map((check, index) =>
      index === 0 ? { ...check, actual: NaN } : check) };
    expect(scoreMainWireBaselineOperatingPointV1(malformed).feasible).toBe(false);
    expect(mainWireBaselineDesignBetterV1({ ...score, minimumMargin: score.minimumMargin + 0.01 }, score))
      .toBe(true);
    expect(mainWireBaselineDesignBetterV1({ ...score, minimumMargin: score.minimumMargin + 0.00001 }, score))
      .toBe(false);
  });
});

// The exact evaluator is covered independently; this fixture exercises only
// runner wiring, stop boundaries and provenance without expensive trajectories.
async function acceptedV1(input: MainWireStandard70BaselineCalibrationEvaluationRequestV1 = {}):
  Promise<MainWireStandard70BaselineCalibrationAcceptedEvaluationV1> {
  const candidate = input as MainWireBaselineCalibrationCandidateInputsV1;
  const offsets = source.coordinates.map(({ parameterId, centerValue }) =>
    transformMainWireBaselineCalibrationParameterV1(parameterId,
      readMainWireBaselineCalibrationParameterV1(candidate, parameterId))
      - transformMainWireBaselineCalibrationParameterV1(parameterId, centerValue));
  const objectiveChecks = source.basis.rows.map((row, index) => ({
    ...source.centerObservations[index]!, status: "passed" as const,
    actual: source.centerObservations[index]!.actual
      + row.halfStepNormalizedDerivatives.reduce((sum, derivative, col) =>
        sum + derivative * offsets[col]!, 0) * (row.maximum - row.minimum),
  }));
  return {
    evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
    status: "accepted",
    ...source.provenance,
    requestIdentitySha256: await buildMainWireStandard70BaselineCalibrationRequestIdentityV1({
      ...candidate, constructionPolicyIdentitySha256: source.provenance.constructionPolicyIdentitySha256,
      nominalDtSec: input.nominalDtSec!, initialization: { kind: "cold" },
    }),
    constructionPolicyRevisionId: "fixture", initializationKind: "cold",
    nominalDtSec: input.nominalDtSec!, wallTimeMs: 1,
    constructionGateStatus: "passed", objectiveGateStatus: "passed", safetySentinelStatus: "passed",
    failedConstructionCheckIds: [], failedObjectiveCheckIds: [], failedSafetySentinelCheckIds: [],
    objectiveChecks, safetySentinelChecks: [],
    exactResult: {
      nominalDtSec: input.nominalDtSec, initializationKind: "cold", completedCycleCount: 3,
      classification: { status: "period1-converged" }, checkpoint: { checkpointSha256: "a".repeat(64) },
    } as unknown as MainWireStandard70BaselineCalibrationAcceptedEvaluationV1["exactResult"],
  };
}
