import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import standard70CheckpointJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-settled-baseline-checkpoint.json";
import standard70ValidationJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import { MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1 } from
  "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1,
  type MainWireIntegratedModelStandard70RightHeartCheckV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import type { MainWireIntegratedModelBaselineValidationCheckV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import { designQualificationPathV1, validateDesignQualificationResultV1, qualifyMeasuredDesignReserveV1,
  designReservePolicyV1,
  reserveCandidateIdentityV1, mapDesignInOrderV1, designRateInitializationV1, designEarlyRateInitializationV1,
  type DesignReserveResultV1 } from
  "@/tools/scientific/mainWireBaselineDesignExecutionV1";
import {
  scoreMainWireBaselineOperatingPointV1,
  mainWireBaselineDesignBetterV1,
  combineMainWireBaselineConditionScoreV1,
  mainWireBaselineDesignNeighborsV1,
  mainWireBaselineDesignQualificationPassedV1,
  mainWireBaselineDesignSeedV1,
  scoreMainWireBaselineReserveAwareV1,
  mainWireBaselineArterialStorageMlV1,
  MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1,
} from "@/analysis/methods/mainWire/MainWireBaselineOperatingPointDesignV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID,
  qualifyMainWireIntegratedModelFormalPreloadReserveMeasurementV1,
  type MainWireIntegratedModelFormalPreloadReserveMeasurementV2,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2 } from
  "@/analysis/methods/mainWire/MainWireFixedToneSettlementV2";
import { evaluateMainWireBaselinePressureRateQualityV1,
  type MainWireBaselinePressureRateQualificationV1 } from
  "@/analysis/methods/mainWire/MainWireBaselinePressureRateQualityV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";

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
  type MainWireStandard70BaselineCalibrationEvaluationV1,
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
  it("binds the prospective research bounds into the design policy", () => {
    expect(MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1.policyId)
      .toBe("main-wire-baseline-operating-point-design-v5");
    expect(MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1.parameterPolicyId)
      .toBe("main-wire-baseline-calibration-parameter-policy-v2");
    expect(MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1.parameterDomains.find(
      (row) => row.parameterId === "hemodynamics.arterial-stiffness"))
      .toMatchObject({ minimum: 0.5, maximum: 2.2, releaseStep: 0.01 });
    expect(MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1.earlyRateInitialization).toEqual({
      seed: "same-clock-official-checkpoint-otherwise-cold",
      neighborhood: "fixed-incumbent-same-clock-counterpart-checkpoint-with-actual-source-inputs",
      sourceEligibility: "exact-accepted-and-numerical-event-safety-resolved",
      fallback: "same-clock-official-checkpoint-otherwise-cold",
    });
    expect(MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1.rateConditionInitialization)
      .toBe("same-clock-official-checkpoint-otherwise-cold");
  });

  it("adds lattice-bounded storage-compensated directions without replacing axial proposals", () => {
    const base = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const nodes = { Ao: 100, SA: 250, Art: 80, PA: 25, PArt: 35 };
    const storage = mainWireBaselineArterialStorageMlV1(base, nodes);
    expect(storage).toBe(490); // Include both pulmonary arteries, not only PA.
    const axial = mainWireBaselineDesignNeighborsV1(base, base, 1);
    const all = mainWireBaselineDesignNeighborsV1(base, base, 1, storage);
    expect(all.slice(0, axial.length)).toEqual(axial);
    const coupled = all.slice(axial.length);
    expect(coupled.map((row) => [row.hemodynamicResearchInputs.arterialStiffness,
      row.hemodynamicResearchInputs.totalBloodVolumeMl])).toEqual([[1.5, 4850], [1.1, 5000]]);
    for (const row of coupled) {
      expect(row.mechanismResearchInputs).toEqual(base.mechanismResearchInputs);
      expect(row.hemodynamicResearchInputs.heartRateBpm).toBe(60);
      expect(row.hemodynamicResearchInputs.venousTone).toBe(base.hemodynamicResearchInputs.venousTone);
    }
    expect(() => mainWireBaselineArterialStorageMlV1(base, { ...nodes, PArt: NaN })).toThrow();
    expect(() => mainWireBaselineDesignNeighborsV1(base, base, 1, Infinity)).toThrow();
    const edge = applyMainWireBaselineCalibrationParametersV1(base,
      [{ parameterId: "hemodynamics.arterial-stiffness", value: 2.2 }]);
    expect(mainWireBaselineDesignNeighborsV1(base, edge, 1, storage).every(
      (row) => row.hemodynamicResearchInputs.arterialStiffness <= 2.2)).toBe(true);
  });

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
  it("requires every one of the 28 objective and 13 sentinel checks before scoring feasibility", async () => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const good = await acceptedV1({ ...anchor, nominalDtSec: 0.002 });
    expect(good.objectiveChecks).toHaveLength(28);
    expect(good.safetySentinelChecks).toHaveLength(13);
    expect(new Set([...good.objectiveChecks, ...good.safetySentinelChecks].map(({ checkId }) => checkId)).size).toBe(41);
    expect(new Set(good.objectiveChecks.map(({ checkId }) => checkId))).toEqual(new Set(
      MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1.flatMap(({ checkIds }) => checkIds)));
    expect(new Set(good.safetySentinelChecks.map(({ checkId }) => checkId))).toEqual(new Set(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1));
    expect(scoreMainWireBaselineOperatingPointV1(good).feasible).toBe(true);
    for (const partition of ["objectiveChecks", "safetySentinelChecks"] as const) {
      for (const removed of good[partition]) {
        const missing = { ...good, [partition]: good[partition].filter(({ checkId }) => checkId !== removed.checkId) };
        expect(scoreMainWireBaselineOperatingPointV1(missing), removed.checkId).toMatchObject({
          feasible: false, minimumMargin: -Infinity, pressureFlowTargetGap: Infinity,
        });
        expect(mainWireBaselineDesignQualificationPassedV1(missing, true, "passed"), removed.checkId).toBe(false);
        expect(scoreMainWireBaselineReserveAwareV1(missing, reserveFixtureV1()).minimumMargin, removed.checkId).toBe(-Infinity);
      }
    }
  });

  it("rejects duplicate, unknown, malformed, or misplaced checks despite passed summary labels", async () => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const good = await acceptedV1({ ...anchor, nominalDtSec: 0.002 });
    const objectives = good.objectiveChecks;
    const sentinels = good.safetySentinelChecks;
    for (const changed of [
      { objectiveChecks: objectives.filter(({ checkId }) => ["aortic-pressure.maximum", "systemic-forward-flow.cardiac-index"].includes(checkId)),
        safetySentinelChecks: [] },
      { objectiveChecks: [objectives[0], objectives[0], ...objectives.slice(2)] },
      { safetySentinelChecks: [sentinels[0], sentinels[0], ...sentinels.slice(2)] },
      { objectiveChecks: [...objectives, objectives[0]] },
      { objectiveChecks: [{ ...objectives[0], checkId: "unregistered-check" }, ...objectives.slice(1)] },
      { objectiveChecks: null }, { safetySentinelChecks: undefined },
      { objectiveChecks: [null, ...objectives.slice(1)] },
      // Full unique inventory and unchanged 28/13 sizes still cannot excuse a
      // same-count swap that places a right-heart guard in the scoring subset.
      { objectiveChecks: [sentinels[0], ...objectives.slice(1)],
        safetySentinelChecks: [objectives[0], ...sentinels.slice(1)] },
      { objectiveChecks: [...objectives, sentinels[0]], safetySentinelChecks: sentinels.slice(1) },
    ]) {
      const corrupted = { ...good, ...changed } as unknown as MainWireStandard70BaselineCalibrationAcceptedEvaluationV1;
      expect(scoreMainWireBaselineOperatingPointV1(corrupted)).toMatchObject({ feasible: false, minimumMargin: -Infinity });
      expect(mainWireBaselineDesignQualificationPassedV1(corrupted, true, "passed")).toBe(false);
    }
    const reordered = { ...good, objectiveChecks: [...objectives].reverse(), safetySentinelChecks: [...sentinels].reverse() };
    expect(scoreMainWireBaselineOperatingPointV1(reordered).feasible).toBe(true);
    expect(scoreMainWireBaselineOperatingPointV1(reordered).minimumMargin)
      .toBe(scoreMainWireBaselineOperatingPointV1(good).minimumMargin);
  });

  it("keeps complete, valid pressure-rate reference warnings nonblocking in either partition", async () => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const good = await acceptedV1({ ...anchor, nominalDtSec: 0.002 });
    const warned = { ...good,
      referenceWarningCheckIds: ["left-ventricle.maximum-dpdt", "right-ventricle.maximum-dpdt"],
      objectiveChecks: good.objectiveChecks.map((check) => check.checkId === "left-ventricle.maximum-dpdt"
        ? { ...check, actual: check.minimum / 2, status: "failed" as const } : check),
      safetySentinelChecks: good.safetySentinelChecks.map((check) => check.checkId === "right-ventricle.maximum-dpdt"
        ? { ...check, actual: check.minimum / 2, status: "failed" as const } : check),
    };
    expect(scoreMainWireBaselineOperatingPointV1(warned)).toEqual(scoreMainWireBaselineOperatingPointV1(good));
    expect(mainWireBaselineDesignQualificationPassedV1(warned, true, "passed")).toBe(true);
  });

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
    expect(mainWireBaselineDesignBetterV1({ ...score, minimumMargin: 0.001,
      pressureFlowTargetGap: score.pressureFlowTargetGap - 0.01 }, score)).toBe(true);
    expect(mainWireBaselineDesignBetterV1({ ...score, minimumMargin: score.minimumMargin + 0.1,
      pressureFlowTargetGap: score.pressureFlowTargetGap + 0.01 }, score)).toBe(false);
    const outside = { ...score, feasible: false, minimumMargin: -0.1 };
    const nearer = { ...outside, minimumMargin: -0.05 };
    expect(mainWireBaselineDesignBetterV1(nearer, outside)).toBe(true);
    expect(mainWireBaselineDesignBetterV1(nearer, score)).toBe(false);
    const combinedCondition = combineMainWireBaselineConditionScoreV1(score, nearer);
    expect(combinedCondition.feasible).toBe(false);
    expect(combinedCondition.minimumMargin).toBe(nearer.minimumMargin);
    expect(combinedCondition.pressureFlowTargetGap).toBe(score.pressureFlowTargetGap);
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
      candidateIdentitySha256: await reserveCandidateIdentityV1(anchor, 0.002), reservePolicyIdentity: "b".repeat(64),
      sourceGlobalTbvMl: anchor.hemodynamicResearchInputs.totalBloodVolumeMl };
    const result: DesignReserveResultV1 = { ...expected, executionTier: "full-invariant",
      sourceEvaluationExecutionTier: "hot-path-lean",
      reserve: reserveFixtureV1(), failure: null, wallTimeMs: 1 };
    expect(qualifyMeasuredDesignReserveV1(result, expected).status).toBe("passed");
    for (const key of ["sourceCheckpointSha256", "candidateIdentitySha256", "reservePolicyIdentity"] as const) {
      expect(() => qualifyMeasuredDesignReserveV1({ ...result, [key]: "f".repeat(64) }, expected)).toThrow(/incompatible/);
    }
    for (const invalid of [{ ...result, reserve: null }, { ...result, failure: "unresolved" },
      { ...result, executionTier: "hot-path-lean" as "full-invariant" },
      { ...result, sourceEvaluationExecutionTier: "unknown" as "full-invariant" }]) {
      expect(() => qualifyMeasuredDesignReserveV1(invalid, expected)).toThrow(/missing, failed, or incompatible/);
    }
    expect(designReservePolicyV1.endDiastolicDefinition).toBe("inlet-valve-closure");
    for (const override of [{ protocolId: "other" },
      { protocolId: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID }, { sourceGlobalTbvMl: 5000 },
      { endDiastolicDefinition: undefined }, { endDiastolicDefinition: "maximum-volume" },
      { hypovolemicGlobalTbvScale: 0.9 }, { hypervolemicGlobalTbvScale: 1.1 },
      { hypovolemicGlobalTbvMl: 4450 }, { hypervolemicGlobalTbvMl: NaN }]) {
      const invalid = { ...result, reserve: { ...result.reserve!, ...override } } as DesignReserveResultV1;
      expect(() => qualifyMeasuredDesignReserveV1(invalid, expected)).toThrow(/incompatible/);
    }
    for (const override of [{ maximumRecentRedistributedVolumeMl: 0.051 },
      { maximumRecentRedistributedVolumeMl: undefined }, { maximumRecentNormalizedOutputDelta: NaN },
      { maximumRecentNormalizedLandmarkDelta: 1.1 }, { completedBeatCount: 3 },
      { measurementDurationSec: 61 }, { policyId: "old" }]) {
      const invalid = { ...result, reserve: { ...result.reserve!, settlement: { ...result.reserve!.settlement,
        hypervolemic: { ...result.reserve!.settlement.hypervolemic, ...override } } } } as DesignReserveResultV1;
      expect(() => qualifyMeasuredDesignReserveV1(invalid, expected)).toThrow(/incompatible/);
    }
    expect(() => qualifyMeasuredDesignReserveV1(result, { ...expected, sourceGlobalTbvMl: NaN })).toThrow(/incompatible/);
    const { endDiastolicDefinition: _, ...historicalReserve } = reserveFixtureV1();
    Object.freeze(historicalReserve);
    expect(() => qualifyMeasuredDesignReserveV1({ ...result,
      reserve: historicalReserve as MainWireIntegratedModelFormalPreloadReserveMeasurementV2 }, expected)).toThrow(/incompatible/);
    expect(historicalReserve).not.toHaveProperty("endDiastolicDefinition");
    const failed = reserveFixtureV1();
    failed.left.hypervolemic = { ...failed.left.hypervolemic, directionalCardiacOutputChangeFraction01: 0.025 };
    expect(() => qualifyMeasuredDesignReserveV1({ ...result, reserve: failed }, expected)).toThrow(/Standard70/);
    failed.left.hypervolemic = { ...failed.left.hypervolemic, endpointCardiacOutputLPerMin: NaN };
    expect(() => qualifyMeasuredDesignReserveV1({ ...result, reserve: failed }, expected)).toThrow(/incompatible/);
    expect(await reserveCandidateIdentityV1(anchor, 0.001)).not.toBe(expected.candidateIdentitySha256);
    expect(await reserveCandidateIdentityV1({ ...anchor, hemodynamicResearchInputs: {
      ...anchor.hemodynamicResearchInputs, totalBloodVolumeMl: 4950 } }, 0.002)).not.toBe(expected.candidateIdentitySha256);
  });

  it("uses the official same-rate checkpoint without relabelling a different clock", () => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    // Only initialization routing is under test; exact restore validates the actual checkpoint.
    const checkpoint = {} as Parameters<typeof designRateInitializationV1>[2];
    expect(designRateInitializationV1(60, anchor, checkpoint)).toEqual({
      kind: "standard70-parameter-continuation", sourceCheckpoint: checkpoint,
      sourceHemodynamicResearchInputs: anchor.hemodynamicResearchInputs,
      sourceMechanismResearchInputs: anchor.mechanismResearchInputs,
      sourceVentricularContractilityScale: anchor.ventricularContractilityScale,
    });
    expect(designRateInitializationV1(70, anchor, checkpoint)).toEqual({ kind: "cold" });
  });

  it.each([60, 70])("uses the accepted HR%s counterpart's actual inputs, including outside normal corridors", async (rate) => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const officialCheckpoint = { checkpointSha256: "b".repeat(64) } as Parameters<typeof designRateInitializationV1>[2];
    const inputs = applyMainWireBaselineCalibrationParametersV1(anchor, [
      { parameterId: "hemodynamics.total-blood-volume-ml", value: 4950 },
      { parameterId: "myocardium.common-ventricular-active-tension-scale", value: 1.24 },
      { parameterId: "myocardium.common-ventricular-passive-stiffness-scale", value: 1.1 },
    ]);
    const rateRequest = { ...inputs,
      hemodynamicResearchInputs: { ...inputs.hemodynamicResearchInputs, heartRateBpm: rate },
      ventricularContractilityScale: 1.02,
      nominalDtSec: 0.002, initialization: designRateInitializationV1(rate, anchor, officialCheckpoint) };
    const good = await acceptedV1(rateRequest);
    const outside = { ...good, constructionGateStatus: "failed" as const, objectiveGateStatus: "failed" as const,
      failedConstructionCheckIds: ["systemic-forward-flow.cardiac-index" as const],
      failedObjectiveCheckIds: ["systemic-forward-flow.cardiac-index" as const],
      objectiveChecks: good.objectiveChecks.map((check) => check.checkId === "systemic-forward-flow.cardiac-index"
        ? { ...check, actual: check.minimum - 0.1, status: "failed" as const } : check) };
    expect(scoreMainWireBaselineOperatingPointV1(outside).feasible).toBe(false);
    for (const evaluation of [good, outside]) {
      const initialization = designEarlyRateInitializationV1(rate, anchor, officialCheckpoint,
        { request: rateRequest, evaluation });
      expect(initialization).toEqual({ kind: "standard70-parameter-continuation",
        sourceCheckpoint: evaluation.exactResult.checkpoint,
        sourceHemodynamicResearchInputs: rateRequest.hemodynamicResearchInputs,
        sourceMechanismResearchInputs: rateRequest.mechanismResearchInputs,
        sourceVentricularContractilityScale: rateRequest.ventricularContractilityScale });
      // The persisted request retains the actual source, not the official
      // ancestor's inputs or the primary candidate's differently clocked inputs.
      expect(JSON.parse(JSON.stringify({ ...rateRequest, initialization })).initialization).toEqual(initialization);
      expect(initialization).not.toEqual(rateRequest.initialization);
    }
  });

  it.each([60, 70])("falls back for missing, differently clocked, or unresolved HR%s counterparts", async (rate) => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const officialCheckpoint = { checkpointSha256: "b".repeat(64) } as Parameters<typeof designRateInitializationV1>[2];
    const rateRequest = { ...anchor,
      hemodynamicResearchInputs: { ...anchor.hemodynamicResearchInputs, heartRateBpm: rate }, nominalDtSec: 0.002 };
    const good = await acceptedV1(rateRequest);
    const fallback = designRateInitializationV1(rate, anchor, officialCheckpoint);
    expect(designEarlyRateInitializationV1(rate, anchor, officialCheckpoint)).toEqual(fallback);
    expect(designEarlyRateInitializationV1(rate, anchor, officialCheckpoint, {
      request: { ...rateRequest, hemodynamicResearchInputs: {
        ...rateRequest.hemodynamicResearchInputs, heartRateBpm: rate === 60 ? 70 : 60 } }, evaluation: good,
    })).toEqual(fallback);
    const invalid: MainWireStandard70BaselineCalibrationEvaluationV1[] = [
      ...(["numerical-unresolved", "nonsettled-or-event-change", "invalid-or-physical", "operational-interrupted"] as const)
        .map((status) => ({ evaluatorId: good.evaluatorId, status, phase: "exact-execution" as const,
          requestIdentitySha256: null, wallTimeMs: 1, message: "fixture failure", partial: null })),
      { ...good, safetySentinelStatus: "failed" },
      { ...good, exactResult: { ...good.exactResult,
        classification: { ...good.exactResult.classification, status: "not-converged" } } },
      { ...good, objectiveChecks: [...good.objectiveChecks, { checkId: "settlement.period1",
        minimum: 1, maximum: 1, actual: 0, unit: "bool", status: "failed" }] },
      { ...good, objectiveChecks: good.objectiveChecks.map((check, index) => index === 0 ? { ...check, actual: NaN } : check) },
    ];
    for (const evaluation of invalid) {
      expect(designEarlyRateInitializationV1(rate, anchor, officialCheckpoint,
        { request: rateRequest, evaluation })).toEqual(fallback);
    }
  });

  it.each(["hemodynamicResearchInputs", "mechanismResearchInputs", "ventricularContractilityScale"] as const)(
    "leaves exact restore to reject counterpart checkpoint ownership drift in %s", async (key) => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const checkpoint = standard70CheckpointJson as unknown as Parameters<typeof designRateInitializationV1>[2];
    const alternate = { ...applyMainWireBaselineCalibrationParametersV1(anchor, [
      { parameterId: "hemodynamics.total-blood-volume-ml", value: 4950 },
      { parameterId: "myocardium.common-ventricular-passive-stiffness-scale", value: 1.1 },
    ]), ventricularContractilityScale: 1.02 };
    const rateRequest = { ...anchor, [key]: alternate[key], nominalDtSec: 0.002 };
    const fixture = await acceptedV1(rateRequest);
    const initialization = designEarlyRateInitializationV1(60, anchor, checkpoint, {
      request: rateRequest, evaluation: { ...fixture, exactResult: { ...fixture.exactResult, checkpoint } },
    });
    const { evaluateMainWireStandard70BaselineCalibrationCandidateV1: exactEvaluate } = await vi.importActual<
      typeof import("@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1")
    >("@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1");
    expect(await exactEvaluate({ ...anchor, nominalDtSec: 0.002, initialization }))
      .toMatchObject({ status: "invalid-or-physical", phase: "initialization" });
  });

  it("completes a finalist artifact handoff without overwriting its search reserve", async () => {
    const directory = await mkdtemp(join(tmpdir(), "baseline-finalist-artifacts-"));
    try {
      const reservePath = join(directory, "7.reserve.json");
      const measured = { reserve: reserveFixtureV1(), qualified: undefined };
      await writeFile(reservePath, JSON.stringify(measured), { flag: "wx" });
      const expected = { mode: "reserve", sourceRequestPath: "7.request.json",
        sourceEvaluationPath: "7.result.json", executionCommit: "commit" };
      const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
      const result = { ...expected, qualified: true, baselineAdopted: false, executionTier: "full-invariant",
        evaluation: await acceptedV1({ ...anchor, nominalDtSec: 0.002 }),
        reserveExecutionTier: "full-invariant", reserveStatus: "passed", reserveFailure: null,
        conditionHemodynamicResearchInputs: anchor.hemodynamicResearchInputs,
        reserve: qualifyMainWireIntegratedModelFormalPreloadReserveMeasurementV1(measured.reserve) };
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

  it.each(["cold", "hr60", "hr70", "afterload"])("requires complete feasible evidence for cached qualified %s", async (mode) => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const evaluation = await acceptedV1({ ...anchor, nominalDtSec: 0.002 });
    const expected = { mode, sourceRequestPath: "7.request.json", sourceEvaluationPath: "7.result.json", executionCommit: "commit" };
    const result = { ...expected, qualified: true, baselineAdopted: false, executionTier: "full-invariant", evaluation };
    expect(validateDesignQualificationResultV1(result, expected)).toBe(true);
    expect(() => validateDesignQualificationResultV1({ ...result, mode: "unknown" }, { ...expected, mode: "unknown" }))
      .toThrow(/shape or provenance/);
    for (const invalid of [undefined, null, {}, { ...evaluation, status: "numerical-unresolved" },
      { ...evaluation, objectiveChecks: evaluation.objectiveChecks.slice(1) },
      { ...evaluation, safetySentinelChecks: [] }, { ...evaluation, constructionGateStatus: "failed" }]) {
      expect(() => validateDesignQualificationResultV1({ ...result, evaluation: invalid }, expected)).toThrow(/feasible evaluation/);
    }
    expect(validateDesignQualificationResultV1({ ...result, qualified: false, evaluation: undefined }, expected)).toBe(false);
  });

  it("binds cached refined quality to the fine evaluation's dt, checkpoint, and all four extrema", async () => {
    const { evaluation, pressureRateQuality } = await refinedQualificationFixtureV1();
    const expected = { mode: "refined", sourceRequestPath: "7.request.json", sourceEvaluationPath: "7.result.json", executionCommit: "commit" };
    const result = { ...expected, qualified: true, baselineAdopted: false, executionTier: "full-invariant", evaluation, pressureRateQuality };
    expect(validateDesignQualificationResultV1(JSON.parse(JSON.stringify(result)), expected)).toBe(true);
    const exact = evaluation.exactResult;
    const beat = exact.checkpoint.baseStandardCheckpointV2.completedBeatMetrics!;
    for (const override of [
      { pressureRateQuality: undefined }, { pressureRateQuality: { ...pressureRateQuality, checks: [] } },
      { pressureRateQuality: { ...pressureRateQuality, status: "failed" } },
      { pressureRateQuality: { ...pressureRateQuality, grids: { ...pressureRateQuality.grids,
        fine: { ...pressureRateQuality.grids.fine, checkpointSha256: "9".repeat(64) } } } },
      { evaluation: { ...evaluation, nominalDtSec: 0.002 } },
      { evaluation: { ...evaluation, exactResult: { ...exact, nominalDtSec: 0.002 } } },
      { evaluation: { ...evaluation, exactResult: { ...exact, checkpoint: { ...exact.checkpoint, checkpointSha256: "9".repeat(64) } } } },
      { evaluation: { ...evaluation, exactResult: { ...exact, checkpoint: { ...exact.checkpoint,
        modelIdentity: { ...exact.checkpoint.modelIdentity, ventricularMaterialParameterHash: "another-model" } } } } },
      { evaluation: { ...evaluation, exactResult: null } },
    ]) expect(() => validateDesignQualificationResultV1({ ...result, ...override }, expected)).toThrow();
    for (const check of pressureRateQuality.checks) {
      const ventricle = check.checkId.startsWith("left-") ? "LV" : "RV";
      const chamber = ventricle === "LV" ? "leftVentricle" : "rightVentricle";
      const isMaximum = check.checkId.includes(".maximum-");
      const field = isMaximum ? "maximumMmHgPerSec" : "minimumMmHgPerSec";
      const measurementField = isMaximum ? "maximumDpDtMmHgPerSec" : "minimumDpDtMmHgPerSec";
      const changed = check.fine.reportedMmHgPerSec! + 1;
      const observations = (rows: typeof evaluation.objectiveChecks | typeof evaluation.safetySentinelChecks) =>
        rows.map((row) => row.checkId === check.checkId ? { ...row, actual: changed } : row);
      for (const mismatched of [
        { ...evaluation, objectiveChecks: observations(evaluation.objectiveChecks), safetySentinelChecks: observations(evaluation.safetySentinelChecks) },
        { ...evaluation, exactResult: { ...exact, measurements: { ...exact.measurements,
          [chamber]: { ...exact.measurements[chamber], [measurementField]: changed } } } },
        { ...evaluation, exactResult: { ...exact, checkpoint: { ...exact.checkpoint,
          baseStandardCheckpointV2: { ...exact.checkpoint.baseStandardCheckpointV2, completedBeatMetrics: { ...beat,
            ventricularAbsolutePressureRateExtrema: { ...beat.ventricularAbsolutePressureRateExtrema,
              [ventricle]: { ...beat.ventricularAbsolutePressureRateExtrema[ventricle], [field]: changed } } } } } } },
      ]) expect(() => validateDesignQualificationResultV1({ ...result, evaluation: mismatched }, expected)).toThrow(/does not bind/);
    }
  });

  it("rechecks cached reserve settlement, observation definition and full physiological policy", async () => {
    const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    const evaluation = await acceptedV1({ ...anchor, nominalDtSec: 0.002 });
    const reserve = qualifyMainWireIntegratedModelFormalPreloadReserveMeasurementV1(reserveFixtureV1());
    const expected = { mode: "reserve", sourceRequestPath: "7.request.json", sourceEvaluationPath: "7.result.json", executionCommit: "commit" };
    const result = { ...expected, qualified: true, baselineAdopted: false, executionTier: "full-invariant", evaluation,
      reserveExecutionTier: "full-invariant", reserveStatus: "passed", reserveFailure: null,
      conditionHemodynamicResearchInputs: anchor.hemodynamicResearchInputs, reserve };
    expect(validateDesignQualificationResultV1(result, expected)).toBe(true);
    for (const override of [
      { reserve: undefined }, { reserveStatus: "not-run" }, { reserveFailure: "unresolved" }, { reserveExecutionTier: "hot-path-lean" },
      { conditionHemodynamicResearchInputs: undefined },
      { conditionHemodynamicResearchInputs: { ...anchor.hemodynamicResearchInputs, totalBloodVolumeMl: 5000 } },
      { reserve: { ...reserve, qualificationId: "old" } }, { reserve: { ...reserve, status: "failed" } },
      { reserve: { ...reserve, endDiastolicDefinition: undefined } }, { reserve: { ...reserve, protocolId: "old" } },
      { reserve: { ...reserve, hypervolemicGlobalTbvScale: 1.1 } },
      { reserve: { ...reserve, hypervolemicGlobalTbvMl: reserve.hypervolemicGlobalTbvMl + 1 } },
      { reserve: { ...reserve, settlement: { ...reserve.settlement, center: undefined } } },
      { reserve: { ...reserve, settlement: { ...reserve.settlement,
        hypervolemic: { ...reserve.settlement.hypervolemic, maximumRecentRedistributedVolumeMl: 0.051 } } } },
      { reserve: { ...reserve, right: { ...reserve.right, hypervolemic: { ...reserve.right.hypervolemic,
        endpointCardiacOutputLPerMin: NaN } } } },
      { reserve: { ...reserve, right: { ...reserve.right, hypervolemic: { ...reserve.right.hypervolemic,
        directionalCardiacOutputChangeLPerMin: 0.4 } } } },
      // Arithmetic and the base policy pass; Standard70's preserved 3% floor does not.
      { reserve: { ...reserve, right: { ...reserve.right, hypervolemic: { ...reserve.right.hypervolemic,
        endpointCardiacOutputLPerMin: 5.1, directionalCardiacOutputChangeLPerMin: 0.1,
        directionalCardiacOutputChangeFraction01: 0.02, cardiacOutputSlopeLPerMinPerMmHg: 0.025 } } } },
    ]) expect(() => validateDesignQualificationResultV1({ ...result, ...override }, expected)).toThrow();
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
  const evidence = { policyId: MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2.policyId, completedBeatCount: 30,
    maximumRecentRedistributedVolumeMl: 0.03, maximumRecentNormalizedOutputDelta: 0.02,
    maximumRecentNormalizedLandmarkDelta: 0.4, measurementDurationSec: 30 };
  return { protocolId: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID,
    endDiastolicDefinition: "inlet-valve-closure",
    sourceGlobalTbvMl: 4900, hypovolemicGlobalTbvMl: 4900 * 0.88, hypervolemicGlobalTbvMl: 4900 * 1.12,
    hypovolemicGlobalTbvScale: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1.hypovolemicGlobalTbvScale,
    hypervolemicGlobalTbvScale: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1.hypervolemicGlobalTbvScale,
    left: structuredClone(side), right: structuredClone(side),
    settlement: { center: evidence, hypovolemic: evidence, hypervolemic: evidence } } satisfies MainWireIntegratedModelFormalPreloadReserveMeasurementV2;
}

async function refinedQualificationFixtureV1() {
  const anchor = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
  const accepted = await acceptedV1({ ...anchor, nominalDtSec: 0.001 });
  const rates = [0, 900, 1500, 900, 0, -900, -1500, -900, 0];
  const qualification = (dt: number, steps: number[], hash: string): MainWireBaselinePressureRateQualificationV1 => {
    let pressure = 10;
    const terminalTrace = [0, ...steps].map((rate, index) => {
      pressure += rate * dt;
      return { acceptedTimeSec: index * dt, acceptedDtSec: dt, absolutePressureMmHg: { LV: pressure, RV: pressure / 3 } };
    });
    return { nominalDtSec: dt, classification: { status: "period1-converged" }, terminalTrace,
      checkpoint: { modelIdentity: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1, checkpointSha256: hash,
        baseStandardCheckpointV2: { completedBeatMetrics: { startTimeSec: 0, endTimeSec: steps.length * dt,
          durationSec: steps.length * dt, ventricularAbsolutePressureRateExtrema: {
            LV: { maximumMmHgPerSec: 1500, minimumMmHgPerSec: -1500 }, RV: { maximumMmHgPerSec: 500, minimumMmHgPerSec: -500 },
          } } } } };
  };
  const coarse = qualification(0.002, rates, "c".repeat(64));
  const fine = qualification(0.001, rates.flatMap((rate) => [rate, rate]), "f".repeat(64));
  const pressureRateQuality = evaluateMainWireBaselinePressureRateQualityV1({
    coarse: { qualification: coarse, candidateIdentitySha256: "a".repeat(64) },
    fine: { qualification: fine, candidateIdentitySha256: "a".repeat(64) },
  });
  const observedChecks = [...accepted.objectiveChecks, ...accepted.safetySentinelChecks].map((check) => ({ ...check,
    actual: pressureRateQuality.checks.find(({ checkId }) => checkId === check.checkId)?.fine.reportedMmHgPerSec ?? check.actual,
  }));
  const exactResult = { ...accepted.exactResult, ...fine, measurements: {
    leftVentricle: { maximumDpDtMmHgPerSec: 1500, minimumDpDtMmHgPerSec: -1500 },
    rightVentricle: { maximumDpDtMmHgPerSec: 500, minimumDpDtMmHgPerSec: -500 },
  } } as MainWireStandard70BaselineCalibrationAcceptedEvaluationV1["exactResult"];
  const evaluation = { ...accepted, exactResult,
    objectiveChecks: observedChecks.slice(0, 28) as typeof accepted.objectiveChecks,
    safetySentinelChecks: observedChecks.slice(28) as typeof accepted.safetySentinelChecks };
  return { evaluation, pressureRateQuality };
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
  const modeledChecks = source.basis.rows.map((row, index) => ({
    ...source.centerObservations[index]!, status: "passed" as const,
    actual: source.centerObservations[index]!.actual
      + row.halfStepNormalizedDerivatives.reduce((sum, derivative, col) =>
        sum + derivative * offsets[col]!, 0) * (row.maximum - row.minimum),
  }));
  const objectiveIds = new Set(MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1.flatMap(({ checkIds }) => checkIds));
  const sentinelIds = new Set<string>(MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1);
  // Retain the local response model's ordering, then fill its unmodeled checks
  // with passing midpoints. This is complete synthetic evidence, not a replay
  // or reinterpretation of the historical published measurements.
  const additionalChecks = standard70ValidationJson.checks
    .filter(({ checkId }) => !modeledChecks.some((check) => check.checkId === checkId))
    .map((check) => ({ ...check, status: "passed" as const, actual: (check.minimum + check.maximum) / 2 }));
  const objectiveChecks = [...modeledChecks,
    ...additionalChecks.filter(({ checkId }) => objectiveIds.has(checkId))] as MainWireIntegratedModelBaselineValidationCheckV1[];
  const safetySentinelChecks = additionalChecks.filter(({ checkId }) => sentinelIds.has(checkId)) as
    MainWireIntegratedModelStandard70RightHeartCheckV1[];
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
    referenceWarningCheckIds: [],
    objectiveChecks, safetySentinelChecks,
    exactResult: {
      nominalDtSec: input.nominalDtSec, initializationKind: "cold", completedCycleCount: 3,
      classification: { status: "period1-converged" }, checkpoint: { checkpointSha256: "a".repeat(64) },
    } as unknown as MainWireStandard70BaselineCalibrationAcceptedEvaluationV1["exactResult"],
  };
}
