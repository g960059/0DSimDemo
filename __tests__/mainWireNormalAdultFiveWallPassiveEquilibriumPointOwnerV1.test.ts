import { beforeAll, describe, expect, it, vi } from "vitest";

import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  assertMainWireNormalAdultPassiveEquilibratedPointV1,
  assertMainWireNormalAdultPassiveEquilibriumPointFailureV1,
  createMainWireNormalAdultPassiveEquilibriumPointOwnerV1,
  evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1,
  type MainWireNormalAdultPassiveChamberVolumesM3V1,
  type MainWireNormalAdultPassiveEquilibratedPointV1,
  type MainWireNormalAdultPassiveEquilibriumPointOwnerV1,
  type MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1";
import {
  assertMainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_PREREGISTRATION_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
  type MainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointProvenanceV1";
import * as triSegGeometry from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import {
  evaluateNormalAdultAtrialPassivePressureReplayV1,
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

const TARGET_VOLUMES_M3 = Object.freeze({
  LA: 57.95e-6,
  LV: 144.4e-6,
  RA: 72.58e-6,
  RV: 155.8e-6,
});

const INTERIOR_VOLUMES_M3 = Object.freeze({
  LA: 57.95e-6,
  LV: 98.8e-6,
  RA: 72.58e-6,
  RV: 111.15e-6,
});

const ADJACENT_GRID_VOLUMES_M3 = Object.freeze({
  LA: 57.95e-6,
  LV: (53.2 + (31 / 32) * (144.4 - 53.2)) * 1e-6,
  RA: 72.58e-6,
  RV: (66.5 + (31 / 32) * (155.8 - 66.5)) * 1e-6,
});

describe("normal-adult five-wall passive equilibrium point owner V1", () => {
  let owner: MainWireNormalAdultPassiveEquilibriumPointOwnerV1;
  let referenceRoot: MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1;
  let targetPoint: MainWireNormalAdultPassiveEquilibratedPointV1;

  beforeAll(async () => {
    owner = await createMainWireNormalAdultPassiveEquilibriumPointOwnerV1();
    const rootResult = await owner.solveReferenceRoot();
    expect(rootResult.status).toBe("sealed-reference-root");
    if (rootResult.status !== "sealed-reference-root") {
      throw new Error(
        `${rootResult.failureReason}: ${rootResult.failureDetail}`,
      );
    }
    referenceRoot = rootResult;
    const pointResult = owner.solvePoint(TARGET_VOLUMES_M3, referenceRoot);
    if (pointResult.status !== "equilibrated") {
      throw new Error(
        `${pointResult.failureReason}: ${pointResult.failureDetail}`,
      );
    }
    targetPoint = pointResult;
  });

  it("owns three canonical SHA-256 payloads without using the broad prior hash as passive identity", async () => {
    const provenance = owner.provenance;
    assertMainWireNormalAdultPassiveEquilibriumPointProvenanceV1(provenance);
    expect(provenance.sourceProvenance).toEqual({
      priorId: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.priorId,
      parameterIdentityHash:
        NORMAL_ADULT_FIVE_WALL_PRIOR_V1.parameterIdentityHash,
    });
    expect(provenance.passiveMaterialGeometryBindingSha256).toBe(
      await sha256CanonicalJsonHex(
        provenance.passiveMaterialGeometryBindingPayload,
      ),
    );
    expect(provenance.pointSolverBranchProtocolSha256).toBe(
      await sha256CanonicalJsonHex(provenance.pointSolverBranchProtocolPayload),
    );
    expect(provenance.surfaceVerificationProtocolSha256).toBe(
      await sha256CanonicalJsonHex(
        provenance.surfaceVerificationProtocolPayload,
      ),
    );
    for (const digest of [
      provenance.passiveMaterialGeometryBindingSha256,
      provenance.pointSolverBranchProtocolSha256,
      provenance.surfaceVerificationProtocolSha256,
    ])
      expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(
      JSON.stringify(provenance.passiveMaterialGeometryBindingPayload),
    ).not.toContain(NORMAL_ADULT_FIVE_WALL_PRIOR_V1.parameterIdentityHash);
    expect(
      provenance.surfaceVerificationProtocolPayload.preregistrationOwner,
    ).toEqual(MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_PREREGISTRATION_V1);
    expect(provenance.passiveMaterialGeometryBindingPayload).toMatchObject({
      namedWallTuple: ["LA", "LVFW", "SEP", "RVFW", "RA"],
      equilibriumPassiveOnly: true,
      landActiveIncluded: false,
      parallelSlsIncluded: false,
      frozenMaterialStateMembranePotentialIncluded: false,
      dynamicProviderIncluded: false,
    });
    expect(
      provenance.pointSolverBranchProtocolPayload.branchPolicy,
    ).toMatchObject({
      agreementParticipantOrder:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1,
      agreementPairOrder:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1,
      collectionOrders: {
        forward: expect.arrayContaining([
          expect.stringContaining("LV-axis-index-0-through-32"),
        ]),
        reverse: expect.arrayContaining([
          expect.stringContaining("LV-axis-index-32-through-0"),
        ]),
        serpentine: expect.arrayContaining([
          expect.stringContaining("when-LV-index-even"),
        ]),
      },
      collectionSortedPayloadKey: {
        componentOrder: ["LA-slice", "ventricles", "RA-slice"],
        ventricles: [
          "component-order",
          "leftVentricularAxisIndex-ascending-numeric",
          "rightVentricularAxisIndex-ascending-numeric",
        ],
      },
    });
    expect(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1,
    ).toHaveLength(12);
    expect(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1,
    ).toHaveLength(66);

    const forged = structuredClone(provenance);
    expect(() =>
      assertMainWireNormalAdultPassiveEquilibriumPointProvenanceV1(
        forged as MainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
      ),
    ).toThrow(/freshly created by its canonical owner/i);
  });

  it("evaluates constitutive U, gradient, and analytic ordered H4 without requiring positive-definite Hqq", () => {
    const center = owner.evaluateCandidate(
      INTERIOR_VOLUMES_M3,
      referenceRoot.rootPoint.candidate.internalCoordinates,
    );
    const orderScales = [1e-6, 1e-6, 42e-6, 0.033] as const;
    const steps = [1e-10, 1e-10, 1e-10, 1e-7] as const;
    let maximumScaledGradientError = 0;
    let maximumScaledHessianError = 0;

    for (let column = 0; column < 4; column += 1) {
      const lower = perturbCandidateInputV1(
        center.chamberVolumesM3,
        center.internalCoordinates,
        column,
        -steps[column],
      );
      const upper = perturbCandidateInputV1(
        center.chamberVolumesM3,
        center.internalCoordinates,
        column,
        steps[column],
      );
      const energyDerivative =
        (upper.rawStoredEnergyJ.canonicalFactorizedTotal -
          lower.rawStoredEnergyJ.canonicalFactorizedTotal) /
        (2 * steps[column]);
      maximumScaledGradientError = Math.max(
        maximumScaledGradientError,
        Math.abs(energyDerivative - center.rawCoupledGradient.values[column]) *
          orderScales[column],
      );
      for (let row = 0; row < 4; row += 1) {
        const finiteDifference =
          (upper.rawCoupledGradient.values[row] -
            lower.rawCoupledGradient.values[row]) /
          (2 * steps[column]);
        maximumScaledHessianError = Math.max(
          maximumScaledHessianError,
          Math.abs(
            finiteDifference - center.rawCoupledHessian.values[row][column],
          ) *
            orderScales[row] *
            orderScales[column],
        );
      }
    }

    expect(maximumScaledGradientError).toBeLessThan(2e-8);
    expect(maximumScaledHessianError).toBeLessThan(2e-7);
    expect(center.rawCoupledGradient.values.slice(0, 2)).toEqual([
      center.intrinsicMyocardialTransmuralPressuresPa.LV,
      center.intrinsicMyocardialTransmuralPressuresPa.RV,
    ]);
    expect(
      Math.abs(center.rawStoredEnergyJ.directMinusCanonicalFactorized),
    ).toBeLessThanOrEqual(1e-12);

    const nonqualifiedCandidate = owner.evaluateCandidate(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
      {
        ...center.internalCoordinates,
        junctionRadiusM: 9e-6,
      },
    );
    expect(nonqualifiedCandidate.status).toBe("candidate-evaluated");
    expect(
      nonqualifiedCandidate.internalEquilibriumEvidence.junctionRadiusPassed,
    ).toBe(false);
    expect(
      nonqualifiedCandidate.internalEquilibriumEvidence
        .strictLocalStabilityPassed,
    ).toBe(false);
  });

  it("seals one stable stage-0 root and traverses every primary homotopy stage", async () => {
    expect(referenceRoot.stageZeroRootSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(
      await sha256CanonicalJsonHex(referenceRoot.stageZeroRootPayload),
    ).toBe(referenceRoot.stageZeroRootSha256);
    expect(referenceRoot.stageZeroRootPayload).toMatchObject({
      passiveMaterialGeometryBindingSha256:
        owner.provenance.passiveMaterialGeometryBindingSha256,
      pointSolverBranchProtocolSha256:
        owner.provenance.pointSolverBranchProtocolSha256,
    });
    expect(referenceRoot.rootPoint.referenceRelativeStoredEnergyJ).toBe(0);
    expect(referenceRoot.rootPoint.solverEvidence).toMatchObject({
      lineageKind: "stage-zero-reference-root",
    });
    expect(referenceRoot.rootPoint.solverEvidence.stages).toHaveLength(1);
    expect(referenceRoot.rootPoint.qualificationScope).toMatchObject({
      pointLocalStableRootEstablished: true,
      primary32StageDiagonalLineageEstablished: false,
      alternatePathAndNineSeedBranchAuditEstablished: false,
    });
    expect(
      referenceRoot.rootPoint.candidate.internalEquilibriumEvidence,
    ).toMatchObject({
      strictLocalStabilityPassed: true,
      junctionRadiusPassed: true,
    });
    expect(targetPoint.stageZeroRootSha256).toBe(
      referenceRoot.stageZeroRootSha256,
    );
    assertMainWireNormalAdultPassiveEquilibratedPointV1(targetPoint);
    expect(targetPoint.solverEvidence.lineageKind).toBe(
      "primary-32-stage-diagonal",
    );
    expect(targetPoint.solverEvidence.stages).toHaveLength(32);
    expect(targetPoint.qualificationScope).toMatchObject({
      pointLocalStableRootEstablished: true,
      primary32StageDiagonalLineageEstablished: true,
      alternatePathAndNineSeedBranchAuditEstablished: false,
    });
    expect(
      targetPoint.solverEvidence.stages.every(
        (stage) =>
          stage.strictLocalStabilityPassed &&
          stage.terminalScaledForceInfinityNorm <= 1e-10,
      ),
    ).toBe(true);
    expect(targetPoint.solverEvidence.stages[31]).toMatchObject({
      stageIndex: 32,
      leftVentricularCavityVolumeM3: TARGET_VOLUMES_M3.LV,
      rightVentricularCavityVolumeM3: TARGET_VOLUMES_M3.RV,
    });
    expect(targetPoint.candidate.claim).toEqual({
      equilibriumPassiveOnly: true,
      dynamicProviderUsed: false,
      landActiveStressUsed: false,
      parallelSlsUsed: false,
      frozenMaterialStateMembranePotentialUsed: false,
      pericardiumUsed: false,
    });
    expect(() =>
      assertMainWireNormalAdultPassiveEquilibratedPointV1(
        structuredClone(targetPoint),
      ),
    ).toThrow(/immutable result of the canonical point owner/i);
  });

  it("runs all fixed branch participants at the reference lattice point and retains the frozen V1 seed failures", () => {
    const audit = owner.auditBranchAtPoint(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
      referenceRoot,
    );
    expect(audit.status).toBe("branch-audit-failed");
    if (audit.status !== "branch-audit-failed") return;
    expect(audit).toMatchObject({
      branchAgreementEstablished: false,
      failureReason: "required-participant-failed",
      firstFailedParticipantId: "seed-zero-plus-0.25",
      firstMismatchPair: null,
    });
    expect(audit.auditLatticeIndices).toEqual({ LV: 32, RV: 32 });
    expect(
      audit.participants.map((participant) => participant.participantId),
    ).toEqual(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1,
    );
    expect(audit.participants).toHaveLength(12);
    expect(audit.pairwiseComparisons).toHaveLength(66);
    const comparedPairs = audit.pairwiseComparisons.filter(
      (comparison) => comparison.status === "compared",
    );
    expect(comparedPairs).toHaveLength(45);
    expect(comparedPairs.every((comparison) => comparison.pairPassed)).toBe(
      true,
    );
    expect(audit.participants[0]).toMatchObject({
      status: "participant-equilibrated",
      lineageKind: "primary-32-stage-diagonal",
      homotopyStages: { length: 32 },
    });
    expect(audit.participants[1]).toMatchObject({
      status: "participant-equilibrated",
      lineageKind: "alternate-lv-first-64-stage",
      homotopyStages: { length: 64 },
    });
    expect(audit.participants[2]).toMatchObject({
      status: "participant-equilibrated",
      lineageKind: "alternate-rv-first-64-stage",
      homotopyStages: { length: 64 },
    });
    for (const participant of audit.participants.slice(3)) {
      expect(participant.lineageKind).toBe(
        "independent-seed-stage-zero-then-primary-32-stage",
      );
    }
    const failedParticipants = audit.participants.filter(
      (participant) => participant.status === "participant-failed",
    );
    expect(
      failedParticipants.map((participant) => participant.participantId),
    ).toEqual(["seed-zero-plus-0.25", "seed-plus-0.25-plus-0.25"]);
    for (const participant of failedParticipants) {
      if (participant.status !== "participant-failed") continue;
      assertMainWireNormalAdultPassiveEquilibriumPointFailureV1(
        participant.failure,
      );
      expect(participant.failure).toMatchObject({
        failureReason: "scaled-update-stagnated",
        failedStageIndex: 0,
        completedStages: [],
        failedStageEvidence: {
          stageIndex: 0,
          completedNewtonUpdates: 9,
          lastAcceptedStepDiagnostics: expect.objectContaining({
            currentEnergyJ: expect.any(Number),
            acceptedEnergyJ: expect.any(Number),
            directionalDerivative: expect.any(Number),
          }),
        },
      });
    }
    expect(failedParticipants[0]).toMatchObject({
      failure: {
        failedStageEvidence: {
          lineSearchBacktracks: 7,
          lastAcceptedStepDiagnostics: {
            acceptedBacktracks: 5,
            scaledUpdateInfinityNorm: 6.574519288468698e-12,
            currentScaledForceInfinityNorm: 2.1387347493018185e-10,
            acceptedScaledForceInfinityNorm: 2.0719038451577632e-10,
            currentEnergyJ: 0.026393309255454297,
            acceptedEnergyJ: 0.026393309255454266,
            directionalDerivative: -4.093735823433198e-20,
          },
        },
      },
    });
    expect(audit.maximumScaledCoordinateDifference).toBeLessThanOrEqual(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1
        .branchAgreement.maximumScaledCoordinateDifference,
    );
    expect(audit.maximumAbsoluteStoredEnergyDifferenceJ).not.toBeNull();
    expect(
      audit.maximumAbsoluteStoredEnergyDifferenceJ ?? Infinity,
    ).toBeLessThanOrEqual(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1
        .branchAgreement.maximumAbsoluteStoredEnergyDifferenceJ,
    );
    expect(audit.maximumScaledPressureDifference).not.toBeNull();
    expect(
      audit.maximumScaledPressureDifference ?? Infinity,
    ).toBeLessThanOrEqual(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1
        .branchAgreement.maximumScaledPressureDifference,
    );
    expect(targetPoint.qualificationScope).toMatchObject({
      alternatePathAndNineSeedBranchAuditEstablished: false,
      continuousBranchEstablished: false,
    });
  });

  it("equilibrates the preregistered adjacent LV/RV grid point through a nontrivial homotopy", () => {
    const result = owner.solvePoint(ADJACENT_GRID_VOLUMES_M3, referenceRoot);
    if (result.status !== "equilibrated") {
      throw new Error(
        JSON.stringify({
          reason: result.failureReason,
          phase: result.failurePhase,
          failedStageIndex: result.failedStageIndex,
          completedStageCount: result.completedStages.length,
          lastCandidateEvidence: result.lastCandidateEvidence,
        }),
      );
    }
    expect(result.solverEvidence.stages).toHaveLength(32);
    expect(result.solverEvidence.totalNewtonIterations).toBeGreaterThan(0);
    expect(result.solverEvidence.stages.at(-1)).toMatchObject({
      leftVentricularCavityVolumeM3: ADJACENT_GRID_VOLUMES_M3.LV,
      rightVentricularCavityVolumeM3: ADJACENT_GRID_VOLUMES_M3.RV,
    });
    assertMainWireNormalAdultPassiveEquilibratedPointV1(result);
  });

  it("retains the preregistered interior grid failure without relaxing its numerical policy", () => {
    const result = owner.solvePoint(INTERIOR_VOLUMES_M3, referenceRoot);
    expect(result.status).toBe("not-equilibrated");
    if (result.status !== "not-equilibrated") return;
    expect(result).toMatchObject({
      failurePhase: "stage-solve",
      failureReason: "scaled-update-stagnated",
      failedStageIndex: 2,
    });
    expect(result.completedStages).toHaveLength(1);
    expect(result.failedStageEvidence).toMatchObject({
      stageIndex: 2,
      rejectionCause: "scaled-update-stagnated",
      lastAcceptedStepDiagnostics: {
        acceptedBacktracks: 24,
        scaledUpdateInfinityNorm: 5.023638240098982e-16,
        currentEnergyJ: 0.022765537857069962,
        acceptedEnergyJ: 0.022765537857069935,
        directionalDerivative: -5.788005699503025e-17,
      },
    });
    expect(
      result.failedStageEvidence?.lastAcceptedStepDiagnostics,
    ).toMatchObject({
      currentScaledForceInfinityNorm: 7.555575135209658e-9,
      acceptedScaledForceInfinityNorm: 7.555574794482212e-9,
    });
    expect(
      result.lastCandidateEvidence?.scaledForceInfinityNorm,
    ).toBeGreaterThan(1e-10);
  });

  it("matches the terminal Schur tangent to relaxed independent pressure differences and SI atrial tangents", () => {
    const stepM3 = 0.01e-6;
    const tangent =
      targetPoint.reducedFourChamberPressureVolumeTangentPaPerM3.values;
    for (const [column, chamber] of [
      [1, "LV"],
      [3, "RV"],
    ] as const) {
      const lowerOne = solveRequiredPointV1(owner, referenceRoot, {
        ...TARGET_VOLUMES_M3,
        [chamber]: TARGET_VOLUMES_M3[chamber] - stepM3,
      });
      const lowerTwo = solveRequiredPointV1(owner, referenceRoot, {
        ...TARGET_VOLUMES_M3,
        [chamber]: TARGET_VOLUMES_M3[chamber] - 2 * stepM3,
      });
      for (const [row, pressureChamber] of [
        [1, "LV"],
        [3, "RV"],
      ] as const) {
        const finiteDifference =
          (3 *
            targetPoint.candidate.intrinsicMyocardialTransmuralPressuresPa[
              pressureChamber
            ] -
            4 *
              lowerOne.candidate.intrinsicMyocardialTransmuralPressuresPa[
                pressureChamber
              ] +
            lowerTwo.candidate.intrinsicMyocardialTransmuralPressuresPa[
              pressureChamber
            ]) /
          (2 * stepM3);
        expect(
          scaledErrorV1(tangent[row][column], finiteDifference, 1e6),
        ).toBeLessThan(2e-5);
      }
    }
    for (const [index, atrium] of [
      [0, "LA"],
      [2, "RA"],
    ] as const) {
      const centerVolumeM3 = TARGET_VOLUMES_M3[atrium];
      const lower = evaluateNormalAdultAtrialPassivePressureReplayV1(
        atrium,
        (centerVolumeM3 - stepM3) / 1e-6,
      );
      const upper = evaluateNormalAdultAtrialPassivePressureReplayV1(
        atrium,
        (centerVolumeM3 + stepM3) / 1e-6,
      );
      const finiteDifference =
        (upper.transmuralPressurePa - lower.transmuralPressurePa) /
        (2 * stepM3);
      expect(
        scaledErrorV1(tangent[index][index], finiteDifference, 1e6),
      ).toBeLessThan(2e-7);
    }
    expect(tangent[0]).toEqual([tangent[0][0], 0, 0, 0]);
    expect(tangent[2]).toEqual([0, 0, tangent[2][2], 0]);
    expect(tangent[1][3]).toBe(tangent[3][1]);
  });

  it("rejects copied or hash-tampered reference roots without returning a qualified point", () => {
    const forged = structuredClone(referenceRoot) as {
      stageZeroRootSha256: string;
    };
    forged.stageZeroRootSha256 = "0".repeat(64);
    const result = owner.solvePoint(
      TARGET_VOLUMES_M3,
      forged as MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1,
    );
    expect(result).toMatchObject({
      status: "not-equilibrated",
      failureReason: "reference-root-binding-invalid",
      completedStages: [],
      lastCandidateEvidence: null,
    });
    expect(result).not.toHaveProperty("candidate");
    expect(result).not.toHaveProperty(
      "reducedFourChamberPressureVolumeTangentPaPerM3",
    );
    if (result.status !== "not-equilibrated") return;
    assertMainWireNormalAdultPassiveEquilibriumPointFailureV1(result);
    expect(() =>
      assertMainWireNormalAdultPassiveEquilibriumPointFailureV1(
        structuredClone(result),
      ),
    ).toThrow(/immutable result of the canonical point owner/i);

    const audit = owner.auditBranchAtPoint(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
      forged as MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1,
    );
    expect(audit).toMatchObject({
      status: "branch-audit-failed",
      branchAgreementEstablished: false,
      failureReason: "reference-root-binding-invalid",
      participants: [],
    });
  });

  it("fails a non-audit lattice target before running any branch participant", () => {
    const audit = owner.auditBranchAtPoint(
      ADJACENT_GRID_VOLUMES_M3,
      referenceRoot,
    );
    expect(audit).toMatchObject({
      status: "branch-audit-failed",
      branchAgreementEstablished: false,
      failureReason: "target-outside-branch-audit-lattice",
      auditLatticeIndices: null,
      participants: [],
      pairwiseComparisons: [],
    });
  });

  it("retains branded canonical participant failures and denies branch eligibility", () => {
    const original = triSegGeometry.evaluateTriSegGeometryV1;
    const geometrySpy = vi
      .spyOn(triSegGeometry, "evaluateTriSegGeometryV1")
      .mockImplementation((input) => {
        if (input.coordinates.junctionRadiusM < 0.03) {
          throw new Error("synthetic negative-radius-seed rejection");
        }
        return original(input);
      });
    try {
      const audit = owner.auditBranchAtPoint(
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
        referenceRoot,
      );
      expect(audit.status).toBe("branch-audit-failed");
      if (audit.status !== "branch-audit-failed") return;
      expect(audit).toMatchObject({
        branchAgreementEstablished: false,
        failureReason: "required-participant-failed",
      });
      expect(audit.participants).toHaveLength(12);
      expect(audit.pairwiseComparisons).toHaveLength(66);
      const failedParticipants = audit.participants.filter(
        (participant) => participant.status === "participant-failed",
      );
      expect(failedParticipants.length).toBeGreaterThan(0);
      for (const participant of failedParticipants) {
        if (participant.status !== "participant-failed") continue;
        assertMainWireNormalAdultPassiveEquilibriumPointFailureV1(
          participant.failure,
        );
        expect(() =>
          assertMainWireNormalAdultPassiveEquilibriumPointFailureV1(
            structuredClone(participant.failure),
          ),
        ).toThrow(/immutable result of the canonical point owner/i);
      }
    } finally {
      geometrySpy.mockRestore();
    }
  });

  it("carries the preceding accepted-step diagnostics into a later candidate failure", () => {
    const original = triSegGeometry.evaluateTriSegGeometryV1;
    let previousInputKey: string | null = null;
    const geometrySpy = vi
      .spyOn(triSegGeometry, "evaluateTriSegGeometryV1")
      .mockImplementation((input) => {
        const key = JSON.stringify({
          LV: input.leftVentricularCavityVolumeM3,
          RV: input.rightVentricularCavityVolumeM3,
          q: input.coordinates,
        });
        if (
          input.leftVentricularCavityVolumeM3 <
            MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1.LV &&
          key === previousInputKey
        ) {
          throw new Error("synthetic next-iteration candidate failure");
        }
        previousInputKey = key;
        return original(input);
      });
    try {
      const result = owner.solvePoint(ADJACENT_GRID_VOLUMES_M3, referenceRoot);
      expect(result.status).toBe("not-equilibrated");
      if (result.status !== "not-equilibrated") return;
      expect(result).toMatchObject({
        failureReason: "candidate-evaluation-failed",
        failedStageEvidence: {
          rejectionCause: "candidate-evaluation-failed",
          lastAcceptedStepDiagnostics: {
            acceptedBacktracks: expect.any(Number),
            currentEnergyJ: expect.any(Number),
            acceptedEnergyJ: expect.any(Number),
          },
        },
      });
      assertMainWireNormalAdultPassiveEquilibriumPointFailureV1(result);
    } finally {
      geometrySpy.mockRestore();
    }
  });

  it("retains completed homotopy stages when a later pure candidate evaluation fails", () => {
    const original = triSegGeometry.evaluateTriSegGeometryV1;
    const geometrySpy = vi
      .spyOn(triSegGeometry, "evaluateTriSegGeometryV1")
      .mockImplementation((input) => {
        if (input.leftVentricularCavityVolumeM3 < 140e-6) {
          throw new Error("synthetic late-stage geometry failure");
        }
        return original(input);
      });
    try {
      const result = owner.solvePoint(
        {
          ...TARGET_VOLUMES_M3,
          LV: 53.2e-6,
        },
        referenceRoot,
      );
      expect(result.status).toBe("not-equilibrated");
      if (result.status !== "not-equilibrated") return;
      expect(result.failureReason).toBe("candidate-evaluation-failed");
      expect(result.failedStageIndex).toBeGreaterThan(1);
      expect(result.completedStages.length).toBeGreaterThan(0);
      expect(result.completedStages.at(-1)?.stageIndex).toBe(
        (result.failedStageIndex ?? 1) - 1,
      );
      expect(result.failedStageEvidence).toMatchObject({
        stageIndex: result.failedStageIndex,
        rejectionCause: "candidate-evaluation-failed",
      });
      expect(
        result.failedStageEvidence?.completedNewtonUpdates,
      ).toBeGreaterThanOrEqual(0);
      expect(result.stageZeroRootSha256).toBe(
        referenceRoot.stageZeroRootSha256,
      );
      expect(result.ownerId).toBe(owner.ownerId);
      expect(result.provenanceHashes).toEqual(targetPoint.provenanceHashes);
      expect(result).not.toHaveProperty("candidate");
    } finally {
      geometrySpy.mockRestore();
    }
  });

  it("fails out-of-domain requests through the versioned union", () => {
    const result = owner.solvePoint(
      {
        ...TARGET_VOLUMES_M3,
        LA: 35.72e-6 - 1e-12,
      },
      referenceRoot,
    );
    expect(result).toMatchObject({
      status: "not-equilibrated",
      failureVersion:
        "main-wire-normal-adult-passive-equilibrium-point-failure-v1",
      failureReason: "input-outside-declared-domain",
      failedStageIndex: null,
      completedStages: [],
    });
    expect(result).not.toHaveProperty("candidate");
    if (result.status !== "not-equilibrated") return;
    assertMainWireNormalAdultPassiveEquilibriumPointFailureV1(result);
    expect(() =>
      assertMainWireNormalAdultPassiveEquilibriumPointFailureV1(
        structuredClone(result),
      ),
    ).toThrow(/immutable result of the canonical point owner/i);
  });
});

function perturbCandidateInputV1(
  volumes: MainWireNormalAdultPassiveChamberVolumesM3V1,
  coordinates: Readonly<{
    septalMidwallCapVolumeM3: number;
    junctionRadiusM: number;
  }>,
  coordinateIndex: number,
  delta: number,
) {
  const nextVolumes = { ...volumes };
  const nextCoordinates = { ...coordinates };
  if (coordinateIndex === 0) nextVolumes.LV += delta;
  else if (coordinateIndex === 1) nextVolumes.RV += delta;
  else if (coordinateIndex === 2) {
    nextCoordinates.septalMidwallCapVolumeM3 += delta;
  } else if (coordinateIndex === 3) nextCoordinates.junctionRadiusM += delta;
  else throw new RangeError("unsupported coupled coordinate index");
  return evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1(
    nextVolumes,
    nextCoordinates,
  );
}

function solveRequiredPointV1(
  owner: MainWireNormalAdultPassiveEquilibriumPointOwnerV1,
  referenceRoot: MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1,
  volumes: MainWireNormalAdultPassiveChamberVolumesM3V1,
): MainWireNormalAdultPassiveEquilibratedPointV1 {
  const result = owner.solvePoint(volumes, referenceRoot);
  if (result.status !== "equilibrated") {
    throw new Error(`${result.failureReason}: ${result.failureDetail}`);
  }
  return result;
}

function scaledErrorV1(left: number, right: number, floor: number): number {
  return (
    Math.abs(left - right) / Math.max(Math.abs(left), Math.abs(right), floor)
  );
}
