import { createHash } from "node:crypto";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  loadOfficialHealthyPeriodicCheckpointPresetDocumentV1,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_SCHEMA_ID,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
  type OfficialHealthyPeriodicBeatEvidenceV1,
  type OfficialHealthyPeriodicCheckpointPresetDocumentV1,
  type OfficialHealthyPeriodicClosureSummaryV1,
} from "@/engine/scientific/presets";
import { canonicalJsonStringify } from "@/engine/scientific/release";
import {
  MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1,
  MainWireScientificSessionV1,
  type MainWireScientificPeriodicClosureSummaryV1,
  type MainWireScientificPeriodicSettlementResultV1,
  type MainWireScientificSessionExactCheckpointV2,
} from "@/engine/scientific/runtime";

export type BuiltOfficialHealthyPeriodicCheckpointPresetV1 = Readonly<{
  document: OfficialHealthyPeriodicCheckpointPresetDocumentV1;
  checkpoint: MainWireScientificSessionExactCheckpointV2;
  checkpointBytes: Uint8Array;
}>;

/**
 * Deterministically advances the fixed canonical healthy session one bounded
 * beat per call until the declared P1 classifier succeeds. No parameter search
 * or fitting occurs here.
 */
export async function buildOfficialHealthyPeriodicCheckpointPresetV1():
Promise<BuiltOfficialHealthyPeriodicCheckpointPresetV1> {
  const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
  const session = await MainWireScientificSessionV1.initialize(release);
  const settlement = settleHealthyPeriod1(session);
  const checkpoint = await session.checkpointExact();
  if (checkpoint.periodicSettlementTracker === null) {
    throw new Error("healthy periodic checkpoint lacks its settlement tracker");
  }
  if (checkpoint.periodicSettlementTracker.completedBeatCount
    !== settlement.completedBeatCount) {
    throw new Error("healthy periodic checkpoint tracker count drifted");
  }
  const checkpointBytes = new TextEncoder().encode(
    `${canonicalJsonStringify(checkpoint)}\n`,
  );
  const rawFileSha256 = createHash("sha256")
    .update(checkpointBytes)
    .digest("hex");
  const document = loadOfficialHealthyPeriodicCheckpointPresetDocumentV1({
    schema: {
      id: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_SCHEMA_ID,
      version: 1,
    },
    preset: {
      id: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
      version: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
      displayName: "Healthy periodic baseline",
      catalogVisibility: "official",
      caseClass: "healthy-reference",
    },
    releaseRef: release.ref,
    intent: {
      role: "application-catalog-healthy-periodic-research-baseline",
      subject: "normal-adult-periodic-steady",
      modelScope: "five-wall-noncoronary",
    },
    parameterDocument: {
      kind: "simulation-release-embedded-snapshot",
      releaseSection: "scientificModel.snapshot",
      fixedCanonicalParameterizationOnly: true,
      independentParameterOverridesApplied: false,
    },
    protocol: {
      id: settlement.executionProtocol.protocolId,
      version: settlement.executionProtocol.protocolVersion,
      commandProgression: settlement.executionProtocol.commandProgression,
      dtSec: settlement.executionProtocol.dtSec,
      stepsPerBeat: settlement.executionProtocol.stepsPerBeat,
      maximumBeatCount: settlement.executionProtocol.maximumBeatCount,
      result: {
        status: settlement.status,
        periodicSteadyStateClaimed: true,
        period2OrbitSuspected: false,
        completedBeatCount: settlement.completedBeatCount,
        anchorAcceptedTimeSec: settlement.anchorAcceptedTimeSec,
        anchorPhase01: settlement.anchorPhase01,
        terminalAcceptedTimeSec: settlement.finalObservation.acceptedTimeSec,
        terminalRevision: settlement.finalObservation.revision,
        evidenceBeatIndices: settlement.periodicity.evidenceBeatIndices,
        latestPeriod1MaximumNormalizedDelta:
          requireNumber(
            settlement.periodicity.latestPeriod1MaximumNormalizedDelta,
            "latest P1 closure",
          ),
        latestPeriod2MaximumNormalizedDelta:
          settlement.periodicity.latestPeriod2MaximumNormalizedDelta,
        retainedBeatClosure:
          settlement.retainedBeatClosure.map(compactBeatEvidence),
        terminalTotalBloodVolumeErrorMl:
          settlement.finalObservation.diagnostics.totalBloodVolumeErrorMl,
      },
    },
    initialization: {
      kind: "exact-checkpoint",
      checkpoint: {
        path: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
        mediaType: "application/json",
        byteLength: checkpointBytes.byteLength,
        rawFileSha256,
        rawFileDigestSemantics: "raw-file-bytes-sha256",
        checkpointId: checkpoint.checkpointId,
        checkpointSchemaVersion: checkpoint.schemaVersion,
        checkpointEnvelopeSha256: checkpoint.checkpointSha256,
      },
      compatibility: "identical-full-simulation-release-ref-only",
      semanticReresolutionAllowed: false,
      warmStart: false,
      periodicTrackerIncluded: true,
    },
    claims: {
      officialDesignation: "application-catalog-only",
      numericalPeriod1ClassificationOnly: true,
      exactCheckpointContinuation: true,
      fixedCanonicalParameterizationOnly: true,
      diseasePresetGeneralizationAllowed: false,
      parameterizedCheckpointRequiresV3SessionInputSha256Binding: true,
      parameterSearchPerformed: false,
      parameterFittingPerformed: false,
      clinicalValidationClaimed: false,
      patientSpecificFitClaimed: false,
      populationReferenceRangeValidated: false,
    },
    limitations: [
      "exact restore requires the identical complete SimulationReleaseRef",
      "numerical period-1 closure is not clinical validation",
      "no coronary circulation, device graph, or multipatch physiology",
      "not a patient-specific or population-reference fit",
      "checkpoint V2 must not be reused for valve-disease or other parameterized presets",
    ],
  });
  return Object.freeze({ document, checkpoint, checkpointBytes });
}

function settleHealthyPeriod1(
  session: MainWireScientificSessionV1,
): Extract<MainWireScientificPeriodicSettlementResultV1, { completed: true }> {
  for (
    let callIndex = 0;
    callIndex < MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.maximumBeatCount;
    callIndex += 1
  ) {
    const result = session.settlePeriodic();
    if (result.completed === false) {
      throw new Error(
        `healthy periodic settlement failed after ${result.completedStepCountThisCall} steps: ${result.message}`,
      );
    }
    if (result.status === "tracking") continue;
    if (
      result.status !== "period1-converged"
      || !result.periodicSteadyStateClaimed
      || result.period2OrbitSuspected
      || result.periodicity.status !== "period1-converged"
    ) {
      throw new Error(
        `healthy periodic settlement terminated without P1 convergence: ${result.status}`,
      );
    }
    return result;
  }
  throw new Error("healthy periodic settlement exceeded its bounded call budget");
}

function compactBeatEvidence(
  beat: Readonly<{
    beatIndex: number;
    period1: MainWireScientificPeriodicClosureSummaryV1 | null;
    period2: MainWireScientificPeriodicClosureSummaryV1 | null;
  }>,
): OfficialHealthyPeriodicBeatEvidenceV1 {
  if (beat.period1 === null) {
    throw new Error(`retained beat ${beat.beatIndex} lacks its P1 closure`);
  }
  return Object.freeze({
    beatIndex: beat.beatIndex,
    period1: compactClosure(beat.period1),
    period2: beat.period2 === null ? null : compactClosure(beat.period2),
  });
}

function compactClosure(
  closure: MainWireScientificPeriodicClosureSummaryV1,
): OfficialHealthyPeriodicClosureSummaryV1 {
  return Object.freeze({
    elapsedTimeSec: closure.elapsedTimeSec,
    maximumNormalizedDelta: closure.maximumNormalizedDelta,
    worstGroup: closure.worstGroup,
    worstPath: closure.worstPath,
  });
}

function requireNumber(value: number | null, label: string): number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error(`${label} is unavailable`);
  }
  return value;
}
