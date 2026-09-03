import { describe, expect, it } from "vitest";

import standard70CheckpointJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-settled-baseline-checkpoint.json";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineV1";
import type {
  MainWireIntegratedModelStandard70CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  evaluateMainWireStandard70BaselineCalibrationCandidateV1,
  MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";

const checkpoint = standard70CheckpointJson as unknown as
  MainWireIntegratedModelStandard70CheckpointV1;

describe("Standard70 baseline calibration evaluator", () => {
  it("rejects a non-enumerated calibration heart rate before execution", async () => {
    const result =
      await evaluateMainWireStandard70BaselineCalibrationCandidateV1({
        hemodynamicResearchInputs: {
          ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
          heartRateBpm: 65,
        },
      });

    expect(result).toMatchObject({
      evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
      status: "invalid-or-physical",
      phase: "request-validation",
      requestIdentitySha256: null,
    });
  });

  it("reconfirms the current exact checkpoint and separates objectives from safety sentinels", async () => {
    const result =
      await evaluateMainWireStandard70BaselineCalibrationCandidateV1({
        initialization: Object.freeze({
          kind: "standard70-exact-checkpoint" as const,
          checkpoint,
        }),
      });

    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") return;
    expect(result.initializationKind).toBe("standard70-exact-checkpoint");
    expect(result.exactResult.completedCycleCount).toBe(3);
    expect(result.exactResult.classification.status).toBe("period1-converged");
    expect(result.objectiveChecks).toHaveLength(28);
    expect(result.safetySentinelChecks).toHaveLength(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1.length,
    );
    expect(result.objectiveGateStatus).toBe("passed");
    expect(result.safetySentinelStatus).toBe("passed");
    expect(result.constructionGateStatus).toBe("passed");
    expect(result.failedConstructionCheckIds).toEqual([]);
    expect(result.requestIdentitySha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.constructionPolicyIdentitySha256)
      .toMatch(/^[0-9a-f]{64}$/);
  }, 15_000);

  it("classifies a corrupted same-model checkpoint as initialization failure", async () => {
    const corrupted = structuredClone(checkpoint);
    (corrupted as { checkpointSha256: string }).checkpointSha256 = "0".repeat(64);
    const result =
      await evaluateMainWireStandard70BaselineCalibrationCandidateV1({
        initialization: Object.freeze({
          kind: "standard70-exact-checkpoint" as const,
          checkpoint: corrupted,
        }),
      });

    expect(result).toMatchObject({
      status: "invalid-or-physical",
      phase: "initialization",
    });
  });
});
