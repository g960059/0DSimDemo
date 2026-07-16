import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_EVENT_FREE_MONOLITHIC_MODEL_IDS_V1,
  PHASE_B1_EVENT_FREE_PHYSIOLOGY_ENVELOPE_CANDIDATE_MODEL_V1_ID,
  PHASE_B1_EVENT_FREE_PROJECT_SYNTHETIC_MODEL_V1_ID,
  assertPhaseB1EventFreeMonolithicModelIdV1,
  evaluatePhaseB1EventFreeEndpointV1,
  type PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  runPhaseB1BackwardEulerEventScheduleRunnerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";

describe("Phase B1 physiology-envelope model boundary", () => {
  const source = buildPhaseB1SyntheticEventFreeMonolithicCaseV1("off", sha256);
  const physiologyEnvelopeModel: PhaseB1EventFreeMonolithicModelV1 =
    Object.freeze({
      ...source.model,
      modelId: PHASE_B1_EVENT_FREE_PHYSIOLOGY_ENVELOPE_CANDIDATE_MODEL_V1_ID,
    });

  it("pins the additive two-ID candidate allowlist", () => {
    expect(PHASE_B1_EVENT_FREE_MONOLITHIC_MODEL_IDS_V1).toEqual([
      PHASE_B1_EVENT_FREE_PROJECT_SYNTHETIC_MODEL_V1_ID,
      PHASE_B1_EVENT_FREE_PHYSIOLOGY_ENVELOPE_CANDIDATE_MODEL_V1_ID,
    ]);
    expect(() => assertPhaseB1EventFreeMonolithicModelIdV1(
      PHASE_B1_EVENT_FREE_PROJECT_SYNTHETIC_MODEL_V1_ID,
    )).not.toThrow();
    expect(() => assertPhaseB1EventFreeMonolithicModelIdV1(
      PHASE_B1_EVENT_FREE_PHYSIOLOGY_ENVELOPE_CANDIDATE_MODEL_V1_ID,
    )).not.toThrow();
    expect(() => assertPhaseB1EventFreeMonolithicModelIdV1(
      "four-chamber-phase-b1-undeclared-candidate-v1",
    )).toThrow(/explicitly supported candidate ID/);
  });

  it("retains the project-synthetic path and accepts the declared envelope candidate", () => {
    expect(source.model.modelId).toBe(
      PHASE_B1_EVENT_FREE_PROJECT_SYNTHETIC_MODEL_V1_ID,
    );
    expect(() => evaluatePhaseB1EventFreeEndpointV1(
      source.model,
      source.wallMaterialBinding,
      source.warmStart.endpoint,
    )).not.toThrow();
    expect(() => evaluatePhaseB1EventFreeEndpointV1(
      physiologyEnvelopeModel,
      source.wallMaterialBinding,
      source.warmStart.endpoint,
    )).not.toThrow();
  });

  it("uses the same explicit allowlist in the event-schedule preflight", () => {
    const result = runPhaseB1BackwardEulerEventScheduleRunnerV1({
      model: physiologyEnvelopeModel,
      wallMaterialBinding: source.wallMaterialBinding,
      previousEndpoint: source.warmStart.endpoint,
      endTimeSec: 0.25e-3,
      nominalDtSec: 0.25e-3,
      orderedEvents: [],
    });
    expect(result.completed).toBe(true);

    const invalid = Object.freeze({
      ...physiologyEnvelopeModel,
      modelId: "four-chamber-phase-b1-undeclared-candidate-v1",
    }) as unknown as PhaseB1EventFreeMonolithicModelV1;
    expect(() => runPhaseB1BackwardEulerEventScheduleRunnerV1({
      model: invalid,
      wallMaterialBinding: source.wallMaterialBinding,
      previousEndpoint: source.warmStart.endpoint,
      endTimeSec: 0.25e-3,
      nominalDtSec: 0.25e-3,
      orderedEvents: [],
    })).toThrow(/explicitly supported candidate ID/);
  });
});

function sha256(canonicalJsonUtf8: string): string {
  return createHash("sha256").update(canonicalJsonUtf8).digest("hex");
}
