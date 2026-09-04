import type { ScenarioCaptureV2, ScenarioCheckpointV2 } from "@/studio/contracts/v2/content";
import type { StudioJsonObjectV2, StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import { cloneAndFreezeStudioJson, studioCanonicalJsonStringify } from "@/domain/json/CanonicalJson";
import { MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1 } from
  "@/domain/model/MainWireStandardIdentityV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 } from
  "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type { MainWireIntegratedModelStandard70CheckpointV1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import type { MainWireIntegratedStudioStandard70BaselineValidationV1 } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard70BaselineValidationV1";
import descriptor from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.client.json";
import launchJson from
  "@/data/model-baselines/standard70-launch-baseline.json";

export type MainWireStandard70LaunchBaselineV1 = Readonly<{
  schemaId: "circleheart-standard70-launch-baseline-v1";
  baselineId: string;
  modelId: typeof MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1;
  candidateInputs: MainWireBaselineCalibrationCandidateInputsV1;
  /** Periodic research seed; the presentation-prepared capture may be later. */
  qualificationCheckpoint: MainWireIntegratedModelStandard70CheckpointV1;
  capture: ScenarioCaptureV2 & Readonly<{ fixture: StudioJsonObjectV2 }>;
  validationReport: MainWireIntegratedStudioStandard70BaselineValidationV1;
  provenance: Readonly<{
    candidateIdentitySha256: string;
    executionCommit: string;
    qualificationEvidencePaths: readonly string[];
    clinicalValidationClaimed: false;
    launchPreparation: Readonly<{
      sourceCheckpointSha256: string;
      sourceAcceptedTimeSec: number;
      targetCheckpointSha256: string;
      targetAcceptedTimeSec: number;
      advancedDurationSec: number;
      completedBeatUnchanged: true;
    }>;
  }>;
}>;

/** Bind checked-in launch metadata, not a second physiological qualification.
 * The adoption tool verifies final evidence and hashes; the unchanged exact
 * adapter owns full fixture/checkpoint validation when the capture is restored. */
export function validateMainWireStandard70LaunchBaselineV1(input: unknown): MainWireStandard70LaunchBaselineV1 {
  const value = cloneAndFreezeStudioJson(input) as unknown as MainWireStandard70LaunchBaselineV1;
  const reject = (): never => { throw new Error("Standard70 launch metadata is not bound to its selected capture"); };
  if (!value || value.schemaId !== "circleheart-standard70-launch-baseline-v1"
    || value.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1
    || typeof value.baselineId !== "string" || !value.baselineId.trim()
    || !value.candidateInputs || !value.capture || !value.validationReport || !value.provenance) reject();
  const candidate = value.candidateInputs;
  // The exposed material scales own contractility. No hidden multiplier is
  // added to the existing launch fixture schema by this baseline search.
  if (candidate.ventricularContractilityScale !== 1
    || ![60, 70].includes(candidate.hemodynamicResearchInputs?.heartRateBpm)
    || studioCanonicalJsonStringify(value.capture.fixture) !== studioCanonicalJsonStringify({
      ...descriptor.defaultFixture,
      hemodynamicResearchInputs: candidate.hemodynamicResearchInputs,
      mechanismResearchInputs: candidate.mechanismResearchInputs,
    })) reject();
  const checkpoint = value.capture.checkpoint;
  const raw = checkpoint?.payload as unknown as {
    checkpointId?: string; revision?: number; acceptedTimeSec?: number; checkpointSha256?: string;
    modelIdentity?: unknown;
    baseStandardCheckpointV2?: { completedBeatMetrics?: unknown };
  } | undefined;
  const source = value.qualificationCheckpoint;
  const report = value.validationReport;
  const expected = report.checkpoint;
  const quality = report.assessment?.pressureRateQuality;
  // Qualification remains attached to its original cycle. Launch may take a
  // real step to the presentation grid; it never relabels that source clock.
  const preparation = value.provenance.launchPreparation;
  if (!checkpoint || !raw || !source || !expected || !quality || !preparation || report.status !== "passed"
    || report.modelId !== value.modelId
    || !Number.isSafeInteger(checkpoint.acceptedRevision) || checkpoint.acceptedRevision < 0
    || !Number.isFinite(checkpoint.acceptedTimeSec) || checkpoint.acceptedTimeSec < 0
    || raw.checkpointId !== expected.checkpointId
    || source.checkpointId !== expected.checkpointId || source.revision !== expected.revision
    || source.acceptedTimeSec !== expected.acceptedTimeSec || source.checkpointSha256 !== expected.checkpointSha256
    || !source.baseStandardCheckpointV2?.completedBeatMetrics || !raw.baseStandardCheckpointV2?.completedBeatMetrics
    || studioCanonicalJsonStringify(source.baseStandardCheckpointV2.completedBeatMetrics)
      !== studioCanonicalJsonStringify(raw.baseStandardCheckpointV2.completedBeatMetrics)
    || studioCanonicalJsonStringify(source.modelIdentity) !== studioCanonicalJsonStringify(raw.modelIdentity)
    || raw.revision !== checkpoint.acceptedRevision
    || raw.acceptedTimeSec !== checkpoint.acceptedTimeSec
    || raw.checkpointSha256 !== preparation.targetCheckpointSha256
    || checkpoint.acceptedTimeSec !== preparation.targetAcceptedTimeSec
    || preparation.sourceCheckpointSha256 !== expected.checkpointSha256
    || preparation.sourceAcceptedTimeSec !== expected.acceptedTimeSec
    || !Number.isFinite(preparation.advancedDurationSec) || preparation.advancedDurationSec < 0
    || preparation.advancedDurationSec !== preparation.targetAcceptedTimeSec - preparation.sourceAcceptedTimeSec
    || preparation.advancedDurationSec > 0.002 + 128 * Number.EPSILON * Math.max(1, Math.abs(preparation.targetAcceptedTimeSec))
    || preparation.completedBeatUnchanged !== true
    || (preparation.advancedDurationSec === 0
      ? checkpoint.acceptedRevision !== expected.revision || preparation.targetCheckpointSha256 !== preparation.sourceCheckpointSha256
      : checkpoint.acceptedRevision <= expected.revision)
    || !/^[0-9a-f]{64}$/.test(expected.checkpointSha256)
    || !/^[0-9a-f]{64}$/.test(preparation.targetCheckpointSha256)
    || !/^[0-9a-f]{64}$/.test(value.provenance.candidateIdentitySha256)
    || quality.grids?.coarse?.candidateIdentitySha256 !== value.provenance.candidateIdentitySha256
    || quality.grids?.fine?.candidateIdentitySha256 !== value.provenance.candidateIdentitySha256
    || quality.grids.coarse.checkpointSha256 !== expected.checkpointSha256
    || !/^[0-9a-f]{40}$/.test(value.provenance.executionCommit)
    || value.provenance.clinicalValidationClaimed !== false
    || !Array.isArray(value.provenance.qualificationEvidencePaths)
    || value.provenance.qualificationEvidencePaths.length === 0
    || value.provenance.qualificationEvidencePaths.some((path) => typeof path !== "string" || !path.trim())
    || report.preloadReserve?.sourceGlobalTbvMl !== candidate.hemodynamicResearchInputs.totalBloodVolumeMl) reject();
  return value;
}

export const REGISTERED_STANDARD70_LAUNCH_BASELINE_V1 =
  validateMainWireStandard70LaunchBaselineV1(launchJson);

/** A stale or unrelated remote launch fixture never receives this checkpoint. */
export function resolveRegisteredModelLaunchCheckpointV1(
  modelId: string, defaultFixture: StudioJsonValueV2,
): ScenarioCheckpointV2 | undefined {
  const launch = REGISTERED_STANDARD70_LAUNCH_BASELINE_V1;
  return modelId === launch.modelId
    && studioCanonicalJsonStringify(defaultFixture) === studioCanonicalJsonStringify(launch.capture.fixture)
    ? launch.capture.checkpoint : undefined;
}
