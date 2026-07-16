import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  runPhaseB0TriSegFiniteSupportedEnvelopeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/triSegFiniteSupportedEnvelopeV1";
import {
  PHASE_B1_EVENT_FREE_PHYSIOLOGY_ENVELOPE_CANDIDATE_MODEL_V1_ID,
  PHASE_B1_EVENT_FREE_PROJECT_SYNTHETIC_MODEL_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaZeroBridgeV1";
import {
  stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB0CenterToPhaseB1EtaOneMaterialBranchStitchV1";
import {
  runPhaseB1BackwardEulerEventScheduleRunnerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import {
  runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EtaOneLandCoupledFiniteVolumeGraphV1";
import {
  buildPhaseB1PhysiologyEnvelopeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeCaseV1";
import {
  buildPhaseB1PhysiologyEnvelopeCenterOverlayV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1PhysiologyEnvelopeProtocolV1";
import {
  runPhaseB1QuiescentPressureReferenceInverseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentPressureReferenceInverseV1";
import {
  buildPhaseB1QuiescentReferenceEventFreeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import {
  runPhaseB1ProjectSyntheticColdInitializationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticColdInitializationMaterialHomotopyV1";
import {
  BLOOD_COMPARTMENT_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const B0_NUMERICAL_EVIDENCE_SHA256 =
  "1832e54d6b2d8e91707dff7af71553620950c942c970e00968a39219eedbf9c1";

describe.skipIf(
  process.env.CIRCLEHEART_PHYSIOLOGY_ENVELOPE_CASE_HEAVY_TESTS !== "1",
)("Phase B1 physiology-envelope case", () => {
  it("uses the SV residual only as a pressure-preserving bootstrap and advances the new candidate ID", () => {
    const slsMode = "on" as const;
    const bridge = bridgePhaseB0FiniteEnvelopeCenterToPhaseB1EtaZeroV1(
      runPhaseB0TriSegFiniteSupportedEnvelopeV1(slsMode, sha256),
      B0_NUMERICAL_EVIDENCE_SHA256,
      sha256,
    );
    const cold = runPhaseB1ProjectSyntheticColdInitializationV1(slsMode, sha256);
    const stitch = stitchPhaseB0CenterBridgeToPhaseB1EtaOneMaterialBranchV1(
      bridge,
      cold,
    );
    const graph = runPhaseB1EtaOneLandCoupledFiniteVolumeGraphV1(stitch, sha256);
    const inverse = runPhaseB1QuiescentPressureReferenceInverseV1(graph, sha256);
    const sourceCase = buildPhaseB1QuiescentReferenceEventFreeCaseV1(
      inverse,
      sha256,
    );
    const overlay = buildPhaseB1PhysiologyEnvelopeCenterOverlayV1(sourceCase);
    const candidate = buildPhaseB1PhysiologyEnvelopeCaseV1({
      sourceCase,
      overlay,
      sha256Hex: sha256,
    });

    expect(sourceCase.model.modelId).toBe(
      PHASE_B1_EVENT_FREE_PROJECT_SYNTHETIC_MODEL_V1_ID,
    );
    expect(candidate.model.modelId).toBe(
      PHASE_B1_EVENT_FREE_PHYSIOLOGY_ENVELOPE_CANDIDATE_MODEL_V1_ID,
    );
    expect(candidate.totalBloodVolumeAudit.pass).toBe(true);
    expect(candidate.totalBloodVolumeAudit.assignedSvResidualVolumeM3)
      .toBe(candidate.initialEndpoint.differentialState.bloodVolumesM3.SV);
    expect(candidate.totalBloodVolumeAudit.residualAllocationRole)
      .toBe("initial-pressure-preserving-bootstrap-only");
    expect(candidate.totalBloodVolumeAudit.physiologicalBloodVolumeDistributionClaimed)
      .toBe(false);
    expect(candidate.totalBloodVolumeAudit.destinationTotalBloodVolumeM3)
      .toBeCloseTo(overlay.totalBloodVolumeM3, 15);
    expect(candidate.registryAudit.pass).toBe(true);
    expect(candidate.registryAudit.registryContentHashChanged).toBe(true);
    expect(candidate.initialStationarityAudit.initialStationarityPass).toBe(true);
    expect(candidate.initialStationarityAudit.vascularPressureReplayPass).toBe(true);
    expect(candidate.initialStationarityAudit.volumeRateStationarityPass).toBe(true);
    expect(candidate.initialStationarityAudit.inertialMomentumStationarityPass)
      .toBe(true);
    expect(candidate.provenance.failedPressureOrVolumeGateAction)
      .toBe("reject-candidate-and-rebuild-declared-multicompartment-initial-allocation");
    expect(candidate.provenance.physiologicalDistributionEstablishedBySvResidual)
      .toBe(false);
    expect(candidate.physiologicalValidationPass).toBe(false);

    const run = runPhaseB1BackwardEulerEventScheduleRunnerV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.initialEndpoint,
      endTimeSec: 0.25e-3,
      nominalDtSec: 0.25e-3,
      orderedEvents: [],
    });
    if (run.completed === false) {
      throw new Error(`${run.failureStage}: ${run.failureReason}`);
    }
    const terminalTotalBloodVolumeM3 = BLOOD_COMPARTMENT_IDS.reduce(
      (sum, id) => sum + run.finalEndpoint.differentialState.bloodVolumesM3[id],
      0,
    );
    expect(Math.abs(terminalTotalBloodVolumeM3 - overlay.totalBloodVolumeM3))
      .toBeLessThan(1e-15);
  }, 1_800_000);
});

function sha256(canonicalJsonUtf8: string): string {
  return createHash("sha256").update(canonicalJsonUtf8).digest("hex");
}
