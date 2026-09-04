import { describe, expect, it, vi } from "vitest";
import validation from "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import { MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1 } from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1 } from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import { MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID } from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import { buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1,
  buildMainWireStandard70BaselineCalibrationRequestIdentityV1, initializationIdentityV1 } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import { MAIN_WIRE_BASELINE_SYNTHETIC_RECOVERY_V1 as policy, assessMainWireBaselineSyntheticEvaluationV1,
  recoveryNeighborsV1, recoveryDiagonalNeighborsV1, recoveryResidualV1, searchMainWireBaselineSyntheticTargetV1,
  runMainWireBaselineSyntheticRecoveryV1, type RecoveryPointV1 } from
  "@/analysis/methods/mainWire/MainWireBaselineSyntheticRecoveryV1";
import type { MainWireStandard70BaselineCalibrationAcceptedEvaluationV1 as Accepted,
  MainWireStandard70BaselineCalibrationEvaluationRequestV1 as Request,
  MainWireStandard70BaselineCalibrationEvaluationV1 as Evaluation } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";

const admitted = { status: "admitted" as const, reasons: [] };
function observations(point: RecoveryPointV1) {
  const x = (point[0] - 4950) / 50, y = (point[1] - 1.29) * 100;
  return policy.observationIds.map((checkId, i) => ({ checkId, unit: "synthetic-unit", minimum: -100, maximum: 100,
    actual: [x * 10, y * 10, (x + y) * 5, (x - y) * 5, (2 * x + y) * 3][i]! }));
}

describe("current-reference synthetic recovery policy", () => {
  it("binds the selected baseline and freezes two non-truth starts and interior truths", () => {
    const reference = resolveMainWireFittingReferenceV1("baseline").selectedConstruction;
    expect(reference.baselineId).toBe(policy.baselineId);
    expect(reference.candidateInputs.hemodynamicResearchInputs.heartRateBpm).toBe(70);
    expect(reference.candidateInputs.hemodynamicResearchInputs.totalBloodVolumeMl).toBe(policy.starts.reference[0]);
    for (const point of Object.values(policy.controls)) {
      point.forEach((value, axis) => {
        expect(value).toBeGreaterThan(policy.bounds[axis]![0]);
        expect(value).toBeLessThan(policy.bounds[axis]![1]);
      });
      expect(Object.values(policy.starts)).not.toContainEqual(point);
    }
    expect(Object.isFrozen(policy.controls.A)).toBe(true);
    expect(policy.afterload).toBe("not-required");
    expect(Object.values(policy.claims).every((value) => value === false)).toBe(true);
    expect(policy.qualificationPending).toContain("condition-order-comparison");
    expect(policy.maximumNormalizedTwoStartOutputSpread).toBe(2 * policy.maximumNormalizedTargetResidual);
  });

  it("changes policy identity when the reference binding changes", async () => {
    expect(await sha256CanonicalJsonHex(policy)).not.toBe(await sha256CanonicalJsonHex({ ...policy, baselineId: "other" }));
  });

  it.each([[4900, 1.27], [5150, 1.32], [5050, 1.31]])("keeps axis neighbors on the frozen lattice at %s/%s", (tbv, active) => {
    for (const neighbor of recoveryNeighborsV1([tbv, active])) {
      expect(neighbor[0]).toBeGreaterThanOrEqual(4900); expect(neighbor[0]).toBeLessThanOrEqual(5150);
      expect(neighbor[1]).toBeGreaterThanOrEqual(1.27); expect(neighbor[1]).toBeLessThanOrEqual(1.32);
      expect(Number.isInteger(neighbor[0] / 50)).toBe(true);
      expect(Math.abs(neighbor[1] * 100 - Math.round(neighbor[1] * 100))).toBeLessThan(1e-10);
      expect(Number(neighbor[0] !== tbv) + Number(neighbor[1] !== active)).toBe(1);
    }
  });

  it.each([[4999, 1.30], [5000, 1.305], [5200, 1.30], [5000, 1.33], [5000, NaN], [5000, 1.30, 0.15]])(
    "refuses out-of-lattice, out-of-scope and extra coordinates: %s", (...point) => {
      expect(() => recoveryNeighborsV1(point as unknown as RecoveryPointV1)).toThrow(/frozen lattice/);
    });
});

describe("bounded derivative-free target matching", () => {
  for (const [control, truth] of Object.entries(policy.controls)) for (const [startName, start] of Object.entries(policy.starts)) {
    it(`recovers the deterministic synthetic control ${control} from ${startName}`, async () => {
      const calls: { point: RecoveryPointV1; incumbent: RecoveryPointV1 | null }[] = [];
      const result = await searchMainWireBaselineSyntheticTargetV1(start, observations(truth), async (point, incumbent) => {
        if (incumbent !== null) expect(calls.some((call) => JSON.stringify(call.point) === JSON.stringify(incumbent))).toBe(true);
        calls.push({ point, incumbent });
        return { assessment: admitted, observations: observations(point) };
      });
      expect(result.best.point).toEqual(truth);
      expect(result.stopReason).toBe("target-residual-reached");
      expect(result.evaluationCount).toBeLessThanOrEqual(policy.maximumSearchEvaluations);
      expect(calls[0]).toEqual({ point: start, incumbent: null });
    });
  }

  it("does not silently raise the evaluation budget for an unreachable target", async () => {
    const result = await searchMainWireBaselineSyntheticTargetV1(policy.starts.alternate, observations([6000, 1.6]),
      async (point) => ({ assessment: admitted, observations: observations(point) }));
    expect(result.evaluationCount).toBeLessThanOrEqual(17);
    expect(result.stopReason).not.toBe("target-residual-reached");
  });

  it("probes paired moves only after an axis feasibility stall, keeping the same budget", async () => {
    const start: RecoveryPointV1 = [5050, 1.31], truth = policy.controls.A;
    const result = await searchMainWireBaselineSyntheticTargetV1(start, observations(truth), async (point) => {
      const axisOnly = Number(point[0] !== start[0]) + Number(point[1] !== start[1]) === 1;
      return { assessment: axisOnly ? { status: "construction-deviation", reasons: ["timing.tei-index"] } : admitted,
        observations: observations(point) };
    });
    expect(result.best.point).toEqual(truth);
    expect(result.evaluations.slice(1, 5).every((row) => row.proposalKind === "axis")).toBe(true);
    expect(result.evaluations.slice(5).every((row) => row.proposalKind === "diagonal-after-axis-stall")).toBe(true);
    expect(result.evaluationCount).toBeLessThanOrEqual(17);
    expect(result.evaluations.filter((row) => row.evaluation.assessment.status === "construction-deviation")).toHaveLength(4);
  });

  it("does not spend diagonal probes while axis moves still improve", async () => {
    const result = await searchMainWireBaselineSyntheticTargetV1(policy.starts.reference, observations(policy.controls.B), async (point) => ({
      assessment: admitted, observations: observations(point),
    }));
    expect(result.evaluations.some((row) => row.proposalKind === "diagonal-after-axis-stall")).toBe(false);
    expect(recoveryDiagonalNeighborsV1([4900, 1.27])).toEqual([[4950, 1.28]]);
  });

  it("retains rejected trials, never selecting them as zero-residual solutions", async () => {
    const result = await searchMainWireBaselineSyntheticTargetV1(policy.starts.reference, observations(policy.controls.A), async (point, incumbent) => ({
      assessment: incumbent === null ? admitted : { status: "scientific-invalid", reasons: ["ringing"] },
      observations: incumbent === null ? observations(point) : observations(policy.controls.A),
    }));
    expect(result.best.point).toEqual(policy.starts.reference);
    expect(result.evaluations.slice(1).every((row) => row.residual === null)).toBe(true);
    expect(result.stopReason).toBe("local-lattice-stall");
  });

  it("stops at invalid initialization without hiding an operational failure as target mismatch", async () => {
    const evaluate = vi.fn(async () => ({ assessment: { status: "execution-failure" as const, reasons: ["numerical-unresolved"] }, observations: [] }));
    const result = await searchMainWireBaselineSyntheticTargetV1(policy.starts.reference, observations(policy.controls.A), evaluate);
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(result.stopReason).toBe("initialization-rejected");
    expect(result.best.residual).toBeNull();
  });

  it("does not call a construction-deviant match an admitted solution", async () => {
    const result = await searchMainWireBaselineSyntheticTargetV1(policy.starts.reference, observations(policy.controls.A), async () => ({
      assessment: { status: "construction-deviation", reasons: ["aortic-pressure.maximum"] }, observations: observations(policy.controls.A),
    }));
    expect(result.stopReason).toBe("local-lattice-stall");
    expect(result.best.evaluation.assessment.status).toBe("construction-deviation");
  });

  it("matches rows by identity, not execution/array order", () => {
    expect(recoveryResidualV1(observations(policy.controls.A).reverse(), observations(policy.controls.A))).toBe(0);
    for (const rows of [observations(policy.controls.A).slice(1), [...observations(policy.controls.A), observations(policy.controls.A)[0]!]]) {
      expect(() => recoveryResidualV1(rows, observations(policy.controls.A))).toThrow(/inventory/);
    }
    const rows = observations(policy.controls.A); rows[0]!.unit = "different-unit";
    expect(() => recoveryResidualV1(rows, observations(policy.controls.A))).toThrow(/definition/);
  });
});

describe("admission and scope", () => {
  it("retains reference warnings without treating them as numerical failures", () => {
    const e = fixture();
    const rate = e.objectiveChecks.find((check) => check.checkId === "left-ventricle.maximum-dpdt")!;
    const warned = { ...e, referenceWarningCheckIds: [rate.checkId], objectiveChecks: e.objectiveChecks.map((check) =>
      check === rate ? { ...check, actual: 4000, status: "failed" as const } : check) };
    expect(assessMainWireBaselineSyntheticEvaluationV1(warned).status).toBe("admitted");
  });
  it("separates continuous construction deviations from invalidity", () => {
    const e = fixture();
    const changed = { ...e, objectiveChecks: e.objectiveChecks.map((row) => row.checkId === "aortic-pressure.maximum"
      ? { ...row, actual: row.maximum + 1, status: "failed" as const } : row) };
    expect(assessMainWireBaselineSyntheticEvaluationV1(changed).status).toBe("construction-deviation");
    expect(assessMainWireBaselineSyntheticEvaluationV1({ ...e, safetySentinelStatus: "failed" }).status).toBe("scientific-invalid");
  });
  it("rejects partial, nonfinite and mispartitioned observations", () => {
    const e = fixture();
    for (const changed of [
      { ...e, objectiveChecks: e.objectiveChecks.slice(1) },
      { ...e, objectiveChecks: e.objectiveChecks.map((row, i) => i === 0 ? { ...row, actual: NaN } : row) },
      { ...e, objectiveChecks: e.safetySentinelChecks, safetySentinelChecks: e.objectiveChecks },
    ]) expect(assessMainWireBaselineSyntheticEvaluationV1(changed as Accepted).status).toBe("scientific-invalid");
  });
  it("stops at target execution failure and makes no search/final claims", async () => {
    const failure: Evaluation = { evaluatorId: "main-wire-standard70-baseline-calibration-evaluator-v3", status: "numerical-unresolved",
      phase: "exact-execution", requestIdentitySha256: null, wallTimeMs: 1, message: "fixture failure", partial: null };
    const evaluate = vi.fn(async () => failure);
    const result = await runMainWireBaselineSyntheticRecoveryV1({ controlId: "A", startId: "reference" }, evaluate);
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("target-rejected");
    expect(result.finalQualification).toBeNull();
    expect("search" in result).toBe(false);
  });
  it("rejects mislabeled accepted evaluator results rather than trusting their status", async () => {
    const record = vi.fn(async () => undefined);
    await expect(runMainWireBaselineSyntheticRecoveryV1({ controlId: "A", startId: "reference" }, async () => fixture(), record))
      .rejects.toThrow(/actual request/);
    expect(record).toHaveBeenCalledTimes(1); // Retain the evidence even when verification rejects it.
  });
  it("uses the target checkpoint only for its refined target, never for cold start or search continuation", async () => {
    const seen: Request[] = [];
    const construction = await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
    const exactModelIdentitySha256 = await sha256CanonicalJsonHex(MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1);
    const selected = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
    await expect(runMainWireBaselineSyntheticRecoveryV1({ controlId: "A", startId: "reference" }, async (request) => {
      seen.push(request);
      if (seen.length === 4) throw new Error("fixture-stop-after-continuation-request");
      const e = fixture();
      const point = seen.length <= 2 ? policy.controls.A : policy.starts.reference;
      const response = observations(point);
      return { ...e, ...construction, exactModelIdentitySha256,
        objectiveAnalysisMethodId: MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
        safetyAnalysisMethodId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
        nominalDtSec: request.nominalDtSec!, initializationKind: request.initialization!.kind,
        requestIdentitySha256: await buildMainWireStandard70BaselineCalibrationRequestIdentityV1({
          ...selected, ...request, nominalDtSec: request.nominalDtSec!,
          constructionPolicyIdentitySha256: construction.constructionPolicyIdentitySha256,
          initialization: initializationIdentityV1(request.initialization!),
        }),
        objectiveChecks: e.objectiveChecks.map((row) => {
          const value = response.find((other) => other.checkId === row.checkId);
          return value ? { ...row, actual: (row.minimum + row.maximum) / 2 + value.actual / 200 * (row.maximum - row.minimum) } : row;
        }),
        exactResult: { ...e.exactResult, nominalDtSec: request.nominalDtSec, initializationKind: request.initialization!.kind,
          checkpoint: { checkpointSha256: (seen.length === 1 ? "a" : seen.length === 2 ? "b" : "c").repeat(64) } },
      } as unknown as Accepted; // Plumbing fixture, not a valid exact checkpoint or trajectory.
    })).rejects.toThrow("fixture-stop-after-continuation-request");
    expect(seen[0]!.initialization).toEqual({ kind: "cold" });
    expect(seen[1]!.nominalDtSec).toBe(0.001);
    expect(seen[1]!.initialization).toMatchObject({ kind: "standard70-exact-checkpoint", checkpoint: { checkpointSha256: "a".repeat(64) } });
    expect(seen[2]!.initialization).toEqual({ kind: "cold" });
    expect(seen[3]!.initialization).toMatchObject({ kind: "standard70-parameter-continuation",
      sourceCheckpoint: { checkpointSha256: "c".repeat(64) }, sourceHemodynamicResearchInputs: selected.hemodynamicResearchInputs,
      sourceMechanismResearchInputs: selected.mechanismResearchInputs, sourceVentricularContractilityScale: selected.ventricularContractilityScale });
    expect(JSON.stringify(seen[3]!.initialization)).not.toContain("a".repeat(64));
    expect(JSON.stringify(seen[3]!.initialization)).not.toContain("b".repeat(64));
  });
});

function fixture(): Accepted {
  const objective = new Set<string>(MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1.flatMap((group) => group.checkIds));
  const safety = new Set<string>(MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1);
  const checks = validation.checks.map((check) => ({ ...check, actual: (check.minimum + check.maximum) / 2, status: "passed" as const }));
  return { status: "accepted", evaluatorId: "main-wire-standard70-baseline-calibration-evaluator-v3",
    requestIdentitySha256: "wrong", objectiveChecks: checks.filter((row) => objective.has(row.checkId)),
    safetySentinelChecks: checks.filter((row) => safety.has(row.checkId)),
    constructionGateStatus: "passed", objectiveGateStatus: "passed", safetySentinelStatus: "passed",
    failedConstructionCheckIds: [], failedObjectiveCheckIds: [], failedSafetySentinelCheckIds: [], referenceWarningCheckIds: [],
    exactResult: { classification: { status: "period1-converged" }, nominalDtSec: 0.002, initializationKind: "cold" },
  } as unknown as Accepted;
}
