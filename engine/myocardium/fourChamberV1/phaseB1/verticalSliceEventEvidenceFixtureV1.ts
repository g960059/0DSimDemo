import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_VERTICAL_SLICE_EVENT_EVIDENCE_FIXTURE_V1 =
  Object.freeze({
    fixtureId: "phase-b1-vertical-slice-exact-event-evidence-fixture-v1",
    slsModes: Object.freeze(["on", "off"] as const),
    dtSec: 0.00025,
    causalEvent: Object.freeze({
      wallId: "LVFW" as const,
      eventIdPrefix: "vertical-slice-causal-event",
      calciumDriveTimeSec: 0.00025,
      strength: 0.2,
      timingOwner:
        "tissue-manifest-electrical-to-calcium-delay" as const,
      followingIntervalEndTimeMultiplier: 2,
    }),
    fiveWallCanonicalBatch: Object.freeze({
      wallOrder: WALL_IDS,
      firstEventIdSuffix: "a",
      firstStrengthPerOneBasedWallIndex: 0.01,
      secondEventIdSuffix: "b",
      secondStrengthPerOneBasedWallIndex: 0.02,
      reverseInputOrderCompared: true,
    }),
    overflowPreflight: Object.freeze({
      wallId: "LVFW" as const,
      eventId: "overflow",
      startRiseDrive: Number.MAX_VALUE,
      startDecayDrive: Number.MAX_VALUE,
      eventStrength: Number.MAX_VALUE,
      expectedAtomicStepCallCount: 0,
    }),
    emptyBatchRegressedInBothTopologies: true,
    testOnly: true,
    phaseB1Acceptance: false,
    releaseRuntimeReachable: false,
  } as const);

export function phaseB1VerticalSliceEventEvidenceFixtureSha256V1(
  sha256Hex: CanonicalSha256HexProvider,
): string {
  return computeCanonicalSha256(
    PHASE_B1_VERTICAL_SLICE_EVENT_EVIDENCE_FIXTURE_V1,
    sha256Hex,
  );
}
