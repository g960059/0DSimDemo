import { MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1 } from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { describe, expect, it } from "vitest";

import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import standard70ValidationJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
  type MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import {
  buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1,
  MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import {
  assertMainWireStandard70BaselineNumericalFloorAuditV1,
  MAIN_WIRE_STANDARD70_BASELINE_NUMERICAL_FLOOR_AUDIT_V1_ID,
  verifyMainWireStandard70BaselineNumericalFloorAuditV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineNumericalFloorAuditV1";

describe("Standard70 baseline numerical-floor evidence", () => {
  it("accepts complete model-bound objective floors with all safety runs admitted", async () => {
    const audit = await completeAuditV1();

    expect(() => assertMainWireStandard70BaselineNumericalFloorAuditV1(audit))
      .not.toThrow();
    await expect(verifyMainWireStandard70BaselineNumericalFloorAuditV1(audit))
      .resolves.toEqual(audit);
  });

  it("rejects stale identity, incomplete floors, and a safety-rejected run", async () => {
    const audit = await completeAuditV1();
    expect(() => assertMainWireStandard70BaselineNumericalFloorAuditV1({
      ...audit,
      target: {
        ...audit.target,
        exactModelIdentity: {
          ...audit.target.exactModelIdentity,
          pulmonaryArterialRootConstruction: "stale-construction",
        },
      },
    })).toThrow(/target identity differs/);
    expect(() => assertMainWireStandard70BaselineNumericalFloorAuditV1({
      ...audit,
      metricFloors: audit.metricFloors.slice(1),
    })).toThrow(/do not cover objective checks/);
    expect(() => assertMainWireStandard70BaselineNumericalFloorAuditV1({
      ...audit,
      metricFloors: [audit.metricFloors[0], ...audit.metricFloors.slice(0, -1)],
    })).toThrow(/duplicated/);
    expect(() => assertMainWireStandard70BaselineNumericalFloorAuditV1({
      ...audit,
      fineDtSec: 0.0015,
    })).toThrow(/must halve coarseDtSec/);
    expect(() => assertMainWireStandard70BaselineNumericalFloorAuditV1({
      ...audit,
      runs: {
        ...audit.runs,
        fineCold: {
          ...audit.runs.fineCold,
          safetySentinelStatus: "failed",
          failedSafetySentinelCheckIds: ["right-timing.tei-index"],
        },
      },
    })).toThrow(/fineCold differs from its declared contract/);
    await expect(verifyMainWireStandard70BaselineNumericalFloorAuditV1({
      ...audit,
      target: {
        ...audit.target,
        constructionPolicyIdentitySha256: "f".repeat(64),
      },
      runs: Object.fromEntries(Object.entries(audit.runs).map(
        ([label, run]) => [label, {
          ...run,
          constructionPolicyIdentitySha256: "f".repeat(64),
        }],
      )),
    })).rejects.toThrow(/content identity differs/);
  });
});

async function completeAuditV1() {
  const objectiveIds = new Set(MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1.flatMap(
    ({ checkIds }) => checkIds,
  ));
  const objectiveChecks = standard70ValidationJson.checks.filter(({ checkId }) =>
    objectiveIds.has(checkId)) as MainWireIntegratedModelBaselineValidationCheckV1[];
  const metricFloors = objectiveChecks.map((check) => {
    const constructionCorridorWidth = check.maximum - check.minimum;
    return Object.freeze({
      checkId: check.checkId,
      unit: check.unit,
      constructionMinimum: check.minimum,
      constructionMaximum: check.maximum,
      constructionCorridorWidth,
      coldRepeatAbsoluteDifference: 0,
      coldCheckpointAbsoluteDifference: 0,
      dtHalvingAbsoluteDifference: 0,
      numericalFloorAbsolute: 0,
      numericalFloorFractionOfCorridor:
        constructionCorridorWidth > 0 ? 0 : null,
    });
  });
  const exactModelIdentitySha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
  );
  const constructionPolicy =
    await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
  const constructionPolicyIdentitySha256 =
    constructionPolicy.constructionPolicyIdentitySha256;
  const acceptedRun = (
    nominalDtSec: number,
    initializationKind: "cold" | "standard70-exact-checkpoint",
  ) => Object.freeze({
    evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
    status: "accepted",
    phase: null,
    requestIdentitySha256: "c".repeat(64),
    exactModelIdentitySha256,
    constructionPolicyRevisionId:
      normalReferenceEvidenceV1.evaluationPolicyId,
    constructionPolicyIdentitySha256,
    initializationKind,
    nominalDtSec,
    wallTimeMs: 1,
    completedCycleCount: 3,
    classificationStatus: "period1-converged",
    constructionGateStatus: "passed",
    objectiveGateStatus: "passed",
    safetySentinelStatus: "passed",
    failedObjectiveCheckIds: [],
    failedSafetySentinelCheckIds: [],
    measurementSha256: "d".repeat(64),
    checkpointSha256: "e".repeat(64),
    message: null,
  });
  return Object.freeze({
    auditId: MAIN_WIRE_STANDARD70_BASELINE_NUMERICAL_FLOOR_AUDIT_V1_ID,
    target: Object.freeze({
      exactModelIdentity: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
      exactModelIdentitySha256,
      objectiveAnalysisMethodId:
        MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
      safetyAnalysisMethodId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
      evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
      constructionPolicyRevisionId:
        normalReferenceEvidenceV1.evaluationPolicyId,
      constructionPolicyIdentitySha256,
    }),
    status: "completed",
    coarseDtSec: 0.002,
    fineDtSec: 0.001,
    runs: Object.freeze({
      coldA: acceptedRun(0.002, "cold"),
      coldB: acceptedRun(0.002, "cold"),
      compatibleCheckpoint: acceptedRun(
        0.002,
        "standard70-exact-checkpoint",
      ),
      fineCold: acceptedRun(0.001, "cold"),
    }),
    repeatDeterministic: true,
    safetyAdmissionPassed: true,
    metricFloors: Object.freeze(metricFloors),
    unresolvedRunLabels: Object.freeze([]),
    safetyRejectedRunLabels: Object.freeze([]),
    claim: Object.freeze({
      comparisonKind: "difference-audit-not-convergence-order",
      objectiveChecksFloored: true,
      objectivePhysiologicalThresholdApplied: false,
      safetySentinelAdmissionRequired: true,
      safetySentinelNumericalFloorsClaimed: false,
      optimizerApplied: false,
      fineGridUsedAsDifferenceReference: true,
    }),
  });
}
