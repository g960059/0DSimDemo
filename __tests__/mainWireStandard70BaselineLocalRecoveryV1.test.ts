import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { designQualificationPathV1, validateDesignQualificationResultV1, qualifyMeasuredDesignReserveV1,
  reserveCandidateIdentityV1, mapDesignInOrderV1, type DesignReserveResultV1 } from
  "@/tools/scientific/mainWireBaselineDesignExecutionV1";
import {
  scoreMainWireBaselineOperatingPointV1,
  mainWireBaselineDesignBetterV1,
  mainWireBaselineDesignNeighborsV1,
  mainWireBaselineDesignQualificationPassedV1,
  mainWireBaselineDesignSeedV1,
  scoreMainWireBaselineReserveAwareV1,
} from "@/analysis/methods/mainWire/MainWireBaselineOperatingPointDesignV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID,
  type MainWireIntegratedModelFormalPreloadReserveMeasurementV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";

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
    expect(neighbors).toHaveLength(10);
    for (const point of neighbors) {
      expect(point.hemodynamicResearchInputs.heartRateBpm).toBe(60);
      expect(point.hemodynamicResearchInputs.venousTone).toBe(anchor.hemodynamicResearchInputs.venousTone);
      expect(point.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall.LA)
        .toBe(anchor.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall.LA);
      expect(point.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall.RA)
        .toBe(anchor.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall.RA);
      expect(point.mechanismResearchInputs.chamberMechanics.calciumDecayTimeScaleByWall)
        .toEqual(anchor.mechanismResearchInputs.chamberMechanics.calciumDecayTimeScaleByWall);
      expect(point.hemodynamicResearchInputs.totalBloodVolumeMl % 50).toBe(0);
    }
    expect(neighbors.some((point) => point.hemodynamicResearchInputs.arterialStiffness
      !== anchor.hemodynamicResearchInputs.arterialStiffness)).toBe(true);
    expect(neighbors.some((point) => point.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall.LVFW
      !== anchor.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall.LVFW)).toBe(true);
    const edge = applyMainWireBaselineCalibrationParametersV1(anchor, [
      { parameterId: "hemodynamics.total-blood-volume-ml", value: 5200 },
    ]);
    expect(mainWireBaselineDesignNeighborsV1(anchor, edge, 1).every((point) =>
      point.hemodynamicResearchInputs.totalBloodVolumeMl <= 5200)).toBe(true);
    expect(mainWireBaselineDesignNeighborsV1(anchor, anchor, 0.25).every((point) =>
      point.hemodynamicResearchInputs.totalBloodVolumeMl % 50 === 0)).toBe(true);
    const upperActive = applyMainWireBaselineCalibrationParametersV1(anchor, [
      { parameterId: "myocardium.common-ventricular-active-tension-scale", value: 1.33 },
    ]);
    expect(() => mainWireBaselineDesignNeighborsV1(anchor, upperActive, 1)).not.toThrow();
    expect(mainWireBaselineDesignNeighborsV1(anchor, upperActive, 1).every((point) =>
      point.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall.LVFW <= 1.33)).toBe(true);
    expect(mainWireBaselineDesignSeedV1(anchor, anchor)).toEqual(anchor);
    const offLattice = applyMainWireBaselineCalibrationParametersV1(anchor, [
      { parameterId: "myocardium.common-ventricular-active-tension-scale", value: 1.235 },
    ]);
    expect(() => mainWireBaselineDesignSeedV1(anchor, offLattice)).toThrow(/release lattice/);
    const hr70 = { ...anchor, hemodynamicResearchInputs: { ...anchor.hemodynamicResearchInputs, heartRateBpm: 70 } };
    expect(mainWireBaselineDesignNeighborsV1(hr70, hr70, 1).every((point) =>
      point.hemodynamicResearchInputs.heartRateBpm === 70)).toBe(true);
    expect(() => mainWireBaselineDesignNeighborsV1(hr70, anchor, 1)).toThrow(/one allowed HR/);
  });

  it("does not trade a failed safety gate for a better pressure/flow score", async () => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const good = await acceptedV1({ ...anchor, nominalDtSec: 0.002 });
    // This synthetic fixture exercises the ordering, not model physiology.
    const score = scoreMainWireBaselineOperatingPointV1(good);
    expect(score.feasible).toBe(true);
    expect(mainWireBaselineDesignQualificationPassedV1(good, false, "not-run")).toBe(true);
    expect(mainWireBaselineDesignQualificationPassedV1(good, true, "not-run")).toBe(false);
    expect(mainWireBaselineDesignQualificationPassedV1(good, true, "failed")).toBe(false);
    expect(mainWireBaselineDesignQualificationPassedV1(good, true, "passed")).toBe(true);
    for (const property of ["constructionGateStatus", "objectiveGateStatus", "safetySentinelStatus"] as const) {
      const rejected = scoreMainWireBaselineOperatingPointV1({ ...good, [property]: "failed" });
      expect(rejected.feasible).toBe(false);
      expect(mainWireBaselineDesignBetterV1(rejected, score)).toBe(false);
      expect(mainWireBaselineDesignBetterV1(score, rejected)).toBe(true);
      expect(mainWireBaselineDesignQualificationPassedV1({ ...good, [property]: "failed" }, false, "not-run"))
        .toBe(false);
      expect(mainWireBaselineDesignQualificationPassedV1({ ...good, [property]: "failed" }, true, "passed"))
        .toBe(false);
    }
    const malformed = { ...good, objectiveChecks: good.objectiveChecks.map((check, index) =>
      index === 0 ? { ...check, actual: NaN } : check) };
    expect(scoreMainWireBaselineOperatingPointV1(malformed).feasible).toBe(false);
    expect(mainWireBaselineDesignBetterV1({ ...score, minimumMargin: score.minimumMargin + 0.01 }, score))
      .toBe(true);
    expect(mainWireBaselineDesignBetterV1({ ...score, minimumMargin: score.minimumMargin + 0.00001 }, score))
      .toBe(false);
    const outside = { ...score, feasible: false, minimumMargin: -0.1 };
    const nearer = { ...outside, minimumMargin: -0.05 };
    expect(mainWireBaselineDesignBetterV1(nearer, outside)).toBe(true);
    expect(mainWireBaselineDesignBetterV1(nearer, score)).toBe(false);
    expect(mainWireBaselineDesignBetterV1({ ...outside, minimumMargin: -Infinity }, outside)).toBe(false);
    const continuous = { ...good, constructionGateStatus: "failed" as const,
      objectiveGateStatus: "failed" as const,
      failedConstructionCheckIds: ["systemic-forward-flow.cardiac-index" as const],
      failedObjectiveCheckIds: ["systemic-forward-flow.cardiac-index" as const],
      objectiveChecks: good.objectiveChecks.map((check) => check.checkId === "systemic-forward-flow.cardiac-index"
        ? { ...check, actual: check.minimum - 0.01 * (check.maximum - check.minimum), status: "failed" as const } : check) };
    const continuousScore = scoreMainWireBaselineOperatingPointV1(continuous);
    expect(continuousScore.feasible).toBe(false);
    expect(continuousScore.minimumMargin).toBeCloseTo(-0.01, 12);
    expect(scoreMainWireBaselineOperatingPointV1({ ...continuous,
      objectiveChecks: [...continuous.objectiveChecks, { checkId: "settlement.period1",
        minimum: 1, maximum: 1, actual: 0, unit: "bool", status: "failed" }] }).minimumMargin)
      .toBe(-Infinity);
    expect(scoreMainWireBaselineOperatingPointV1({ ...continuous, safetySentinelStatus: "failed" }).minimumMargin)
      .toBe(-Infinity);
  });

  it("scores settled reserve failures continuously but never qualifies missing reserve", async () => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const good = await acceptedV1({ ...anchor, nominalDtSec: 0.002 });
    const measurement = reserveFixtureV1();
    const rest = scoreMainWireBaselineOperatingPointV1(good);
    const combined = scoreMainWireBaselineReserveAwareV1(good, measurement);
    expect(combined.feasible).toBe(true);
    expect(combined.minimumMargin).toBeLessThanOrEqual(rest.minimumMargin);
    expect(scoreMainWireBaselineReserveAwareV1(good, null).minimumMargin).toBe(-Infinity);
    const failed = structuredClone(measurement);
    failed.left.hypervolemic = { ...failed.left.hypervolemic,
      directionalCardiacOutputChangeFraction01: 0.02 };
    const lostReserve = scoreMainWireBaselineReserveAwareV1(good, failed);
    expect(lostReserve.feasible).toBe(false);
    expect(lostReserve.minimumMargin).toBeCloseTo(-1 / 3, 12);
    expect(lostReserve.activeConstraints).toContain("preload-reserve.left.hypervolemic.directionalCardiacOutputChangeFraction01");
    expect(mainWireBaselineDesignBetterV1(lostReserve, combined)).toBe(false);
    failed.left.hypervolemic = { ...failed.left.hypervolemic, endpointCardiacOutputLPerMin: NaN };
    expect(scoreMainWireBaselineReserveAwareV1(good, failed).minimumMargin).toBe(-Infinity);
  });

  it("uses rest-only scores as optimistic bounds, including around the comparison tolerance", async () => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const good = await acceptedV1({ ...anchor, nominalDtSec: 0.002 });
    const rest = scoreMainWireBaselineOperatingPointV1(good);
    for (const fraction of [0.02, 0.02999, 0.03, 0.03001, 0.03003, 0.04, 0.2]) {
      const reserve = reserveFixtureV1();
      reserve.left.hypervolemic = { ...reserve.left.hypervolemic,
        directionalCardiacOutputChangeFraction01: fraction };
      const combined = scoreMainWireBaselineReserveAwareV1(good, reserve);
      for (const offset of [-0.002, -0.001, -0.0009, 0, 0.0009, 0.001, 0.002]) {
        for (const feasible of [false, true]) {
          const incumbent = { ...rest, feasible, minimumMargin: rest.minimumMargin + offset,
            pressureFlowMargin: rest.pressureFlowMargin - 0.01 };
          if (!mainWireBaselineDesignBetterV1(rest, incumbent)) {
            expect(mainWireBaselineDesignBetterV1(combined, incumbent)).toBe(false);
          }
        }
      }
    }
  });

  it("reuses only full measured reserve bound to the candidate, checkpoint, and policy", async () => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const expected = { sourceCheckpointSha256: "a".repeat(64),
      candidateIdentitySha256: await reserveCandidateIdentityV1(anchor, 0.002), reservePolicyIdentity: "b".repeat(64) };
    const result: DesignReserveResultV1 = { ...expected, executionTier: "full-invariant",
      reserve: reserveFixtureV1(), failure: null, wallTimeMs: 1 };
    expect(qualifyMeasuredDesignReserveV1(result, expected).status).toBe("passed");
    for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
      expect(() => qualifyMeasuredDesignReserveV1({ ...result, [key]: "f".repeat(64) }, expected)).toThrow(/incompatible/);
    }
    for (const invalid of [{ ...result, reserve: null }, { ...result, failure: "unresolved" },
      { ...result, executionTier: "hot-path-lean" as "full-invariant" }]) {
      expect(() => qualifyMeasuredDesignReserveV1(invalid, expected)).toThrow(/missing, failed, or incompatible/);
    }
    const failed = reserveFixtureV1();
    failed.left.hypervolemic = { ...failed.left.hypervolemic, directionalCardiacOutputChangeFraction01: 0.025 };
    expect(() => qualifyMeasuredDesignReserveV1({ ...result, reserve: failed }, expected)).toThrow(/Standard70/);
    failed.left.hypervolemic = { ...failed.left.hypervolemic, endpointCardiacOutputLPerMin: NaN };
    expect(() => qualifyMeasuredDesignReserveV1({ ...result, reserve: failed }, expected)).toThrow(/incompatible/);
    expect(await reserveCandidateIdentityV1(anchor, 0.001)).not.toBe(expected.candidateIdentitySha256);
    expect(await reserveCandidateIdentityV1({ ...anchor, hemodynamicResearchInputs: {
      ...anchor.hemodynamicResearchInputs, totalBloodVolumeMl: 4950 } }, 0.002)).not.toBe(expected.candidateIdentitySha256);
  });

  it("completes a finalist artifact handoff without overwriting its search reserve", async () => {
    const directory = await mkdtemp(join(tmpdir(), "baseline-finalist-artifacts-"));
    try {
      const reservePath = join(directory, "7.reserve.json");
      const measured = { reserve: reserveFixtureV1(), qualified: undefined };
      await writeFile(reservePath, JSON.stringify(measured), { flag: "wx" });
      const expected = { mode: "reserve", sourceRequestPath: "7.request.json",
        sourceEvaluationPath: "7.result.json", executionCommit: "commit" };
      const result = { ...expected, qualified: true, baselineAdopted: false, executionTier: "full-invariant" };
      const path = join(directory, designQualificationPathV1(7, "reserve"));
      expect(path).not.toBe(reservePath);
      await writeFile(path, JSON.stringify(result), { flag: "wx" });
      expect(validateDesignQualificationResultV1(JSON.parse(await readFile(path, "utf8")), expected)).toBe(true);
      expect(validateDesignQualificationResultV1({ ...result, qualified: false }, expected)).toBe(false);
      expect(JSON.parse(await readFile(reservePath, "utf8"))).toEqual({ reserve: measured.reserve });
      for (const malformed of [measured, { ...result, qualified: "true" }, { ...result, mode: "cold" },
        { ...result, sourceRequestPath: "another-request" }, { ...result, executionCommit: "another-commit" },
        { ...result, executionTier: "hot-path-lean" }, { ...result, baselineAdopted: true }]) {
        expect(() => validateDesignQualificationResultV1(malformed, expected)).toThrow(/shape or provenance/);
      }
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  it("keeps bounded queue indices and results independent of completion order", async () => {
    let active = 0;
    let maximumActive = 0;
    const assigned: number[] = [];
    const finished: number[] = [];
    const run = await mapDesignInOrderV1([30, 1, 1, 1, 1], 2, async (delay, index) => {
      assigned.push(index);
      maximumActive = Math.max(maximumActive, ++active);
      await new Promise((done) => setTimeout(done, delay));
      finished.push(index);
      active--;
      return index;
    });
    expect(maximumActive).toBe(2);
    expect(assigned).toEqual([0, 1, 2, 3, 4]);
    expect(finished[0]).toBe(1);
    expect(run).toEqual([0, 1, 2, 3, 4]);
    await expect(mapDesignInOrderV1([], 0, async () => 0)).rejects.toThrow(/parallelism/);
  });
});

function reserveFixtureV1() {
  const response = { endpointDirection: "hypovolemic" as const,
    baselineFillingPressureMmHg: 8, endpointFillingPressureMmHg: 4, directionalFillingPressureChangeMmHg: 4,
    baselineCardiacOutputLPerMin: 5, endpointCardiacOutputLPerMin: 4.7,
    directionalCardiacOutputChangeLPerMin: 0.3, directionalCardiacOutputChangeFraction01: 0.06,
    cardiacOutputSlopeLPerMinPerMmHg: 0.075, baselineEndDiastolicVolumeMl: 140,
    endpointEndDiastolicVolumeMl: 126, directionalEndDiastolicVolumeChangeMl: 14,
    directionalEndDiastolicVolumeChangeFraction01: 0.1, baselineEndDiastolicTransmuralPressureMmHg: 8,
    endpointEndDiastolicTransmuralPressureMmHg: 6, directionalEndDiastolicTransmuralPressureChangeMmHg: 2,
    endDiastolicVolumeResponseMlPerMmHg: 7 };
  const side = { hypovolemic: response, hypervolemic: { ...response, endpointDirection: "hypervolemic" as const,
    endpointFillingPressureMmHg: 12, endpointCardiacOutputLPerMin: 5.3,
    endpointEndDiastolicVolumeMl: 154, endpointEndDiastolicTransmuralPressureMmHg: 10 } };
  return { protocolId: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID,
    sourceGlobalTbvMl: 5000, hypovolemicGlobalTbvMl: 4400, hypervolemicGlobalTbvMl: 5600,
    hypovolemicGlobalTbvScale: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1.hypovolemicGlobalTbvScale,
    hypervolemicGlobalTbvScale: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1.hypervolemicGlobalTbvScale,
    left: structuredClone(side), right: structuredClone(side) } satisfies MainWireIntegratedModelFormalPreloadReserveMeasurementV1;
}

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
