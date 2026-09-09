import { canonicalJsonStringify, cloneAndFreezeCanonicalJson, sha256CanonicalJsonHex } from "@/engine/integrity";
import { hotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStandardIdentityV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD72_IDENTITY_V1 as exactIdentity,
  type MainWireIntegratedModelStandard72CheckpointV1 as Checkpoint } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import { createMainWireIntegratedModelStandard71FixtureV1 as createFixture,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as referenceMechanism } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as periodicPolicy,
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3 as numericalPolicy } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 as scales } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1 as measure } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { buildMainWireProspectiveBaselineChecksV1 as buildChecks } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineChecksV1";
import { observeMainWireStandard70TimingAndInletV2 as observeTiming } from "./MainWireStandard70BaselineAssessmentV2";
import { MAIN_WIRE_BASELINE_OBSERVATION_V2_ID } from "./MainWireBaselineObservationV2";
import { MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineGateRolesV1";
import gateEvidence from "@/data/physiology/main-wire-prospective-reference-evidence-v1.json";
import { MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1 as observationBounds } from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_POLICY_V1 as rightHeartBounds } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import { assessMainWireProspectiveRestV1 as assessRest,
  MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 as restPolicy } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1 as referenceProfile } from "@/analysis/registry/MainWireRestingReferenceProfileV1";
import { MAIN_WIRE_FITTING_SEED_V1 as fittingSeed } from "@/analysis/registry/MainWireFittingSeedV1";
import { validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3 as ownHemodynamics } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3 as ownMechanism } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import { assertMainWireUnextendedFiveWallMechanicsDomainV1 as assertOriginalDomain } from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import { assertUnaliasedMainWireFittingCandidateV1, type MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { settleMainWireFittingSessionV1, MAIN_WIRE_FITTING_OBSERVATION_WINDOW_V1_ID } from "./MainWireFittingCycleV1";

export const MAIN_WIRE_STANDARD72_BASELINE_CALIBRATION_EVALUATOR_V1_ID = "main-wire-standard72-baseline-calibration-evaluator-v1";
const evaluatorId = MAIN_WIRE_STANDARD72_BASELINE_CALIBRATION_EVALUATOR_V1_ID;
export type MainWireStandard72FittingNominalDtV1 = .002 | .001;
export type MainWireStandard72FittingInitializationV1 =
  | Readonly<{ kind: "cold" }>
  | Readonly<{ kind: "standard72-exact-checkpoint"; checkpoint: Checkpoint; sourceNominalDtSec?: MainWireStandard72FittingNominalDtV1 }>
  | Readonly<{ kind: "standard72-parameter-continuation"; checkpoint: Checkpoint; sourceCandidateInputs: Candidate;
    sourceNominalDtSec?: MainWireStandard72FittingNominalDtV1 }>;
export type MainWireStandard72BaselineCalibrationRequestV1 = Readonly<{
  candidateInputs?: Candidate;
  initialization?: MainWireStandard72FittingInitializationV1;
  nominalDtSec?: MainWireStandard72FittingNominalDtV1;
  /** Retain only the terminal measurement windows for post-fit assessment. */
  retainTerminalDiagnostics?: boolean;
  abortSignal?: AbortSignal;
}>;

/** A bounded resting assessment, not an optimizer or post-fit envelope approval.
 * Historical checks supply observations/retained guards; the reviewed prospective
 * policy decides their roles. In particular, old70 all-pass is never required.
 */
export async function evaluateMainWireStandard72BaselineCalibrationCandidateV1(
  request: MainWireStandard72BaselineCalibrationRequestV1 = {},
) {
  const startedAt = performance.now();
  // Keep observation choices owned across the first asynchronous boundary.
  const retainTerminalDiagnostics = request.retainTerminalDiagnostics;
  const execution = await executeMainWireStandard72FittingCandidateV1(request);
  if (execution.status !== "accepted") return execution;
  const { diagnostics, ...core } = execution;
  try {
    const measurements = measure({ ...diagnostics, timingAndInletObserver: observeTiming });
    const checks = buildChecks(measurements, true);
    const rest = assessRest(diagnostics.completedBeat, checks, measurements.cardiacSizeAndFunction.bodySurfaceAreaM2);
    return { ...core, rest, checks, ...(retainTerminalDiagnostics ? { diagnostics } : {}),
      qualification: { scope: "periodic-rest-assessment" as const, restStatus: rest.status,
        pairedGridPressureRateAndTau: "not-evaluated" as const, preloadReserve: "not-evaluated" as const,
        postFitEnvelopeQualified: false as const, clinicalValidationClaimed: false as const,
        publicBaselinePromotionAuthorized: false as const },
      wallTimeMs: performance.now() - startedAt };
  } catch (error) {
    return { evaluatorId, modelId, status: "nonsettled-or-event-change" as const, phase: "observation",
      requestIdentitySha256: core.requestIdentitySha256,
      message: error instanceof Error ? error.message : String(error), wallTimeMs: performance.now() - startedAt };
  }
}

/** Shared exact execution/periodic evidence. No healthy or disease physiology
 * verdict and no requirement that optional inflow peaks be separable. */
export async function executeMainWireStandard72FittingCandidateV1(
  request: MainWireStandard72BaselineCalibrationRequestV1 = {},
) {
  const startedAt = performance.now();
  const abortSignal = request.abortSignal;
  let phase = "request-validation";
  let requestIdentitySha256: string | null = null;
  const fail = (status: "invalid-or-physical" | "numerical-unresolved" | "nonsettled-or-event-change" | "operational-interrupted", message: string) => ({
    evaluatorId, modelId, status, phase, requestIdentitySha256, message, wallTimeMs: performance.now() - startedAt,
  });
  try {
    if (abortSignal?.aborted) return fail("operational-interrupted", "Evaluation interrupted");
    const candidateInputs = ownCandidate(request.candidateInputs
      ?? fittingSeed.candidateInputs);
    const nominalDtSec = request.nominalDtSec ?? .002;
    if (nominalDtSec !== .002 && nominalDtSec !== .001) throw new Error("Standard72 fitting supports only 2ms or 1ms schedules");
    if (hotPathIntegrityTierV1() !== "hot-path-lean") throw new Error("Standard72 fitting requires the admitted hot-path-lean entry point");
    // Own before the first asynchronous digest; caller mutations cannot alter execution.
    const initialization = cloneAndFreezeCanonicalJson(request.initialization ?? { kind: "cold" }) as MainWireStandard72FittingInitializationV1;
    if (!["cold", "standard72-exact-checkpoint", "standard72-parameter-continuation"].includes(initialization.kind)) {
      throw new Error("Standard72 fitting initialization is unregistered");
    }
    if (initialization.kind !== "cold" && initialization.sourceNominalDtSec !== undefined
      && initialization.sourceNominalDtSec !== .002 && initialization.sourceNominalDtSec !== .001) {
      throw new Error("Invalid source analysis step; checkpoints do not authenticate a nominal schedule");
    }
    const policyIdentitySha256 = await buildMainWireStandard72FittingPolicyIdentityV1();
    const identity = { evaluatorId, modelId, exactIdentity, candidateInputs, nominalDtSec,
      policyIdentitySha256, initialization: initialization.kind === "cold" ? initialization : {
        kind: initialization.kind, checkpointSha256: initialization.checkpoint.checkpointSha256,
        sourceNominalDtSec: initialization.sourceNominalDtSec ?? null,
        ...(initialization.kind === "standard72-parameter-continuation"
          ? { sourceCandidateInputs: ownCandidate(initialization.sourceCandidateInputs) } : {}),
      } };
    requestIdentitySha256 = await sha256CanonicalJsonHex(identity);
    phase = "initialization";
    const source = initialization.kind === "standard72-parameter-continuation"
      ? ownCandidate(initialization.sourceCandidateInputs) : candidateInputs;
    let session = initialization.kind === "cold"
      ? await Session.create(candidateInputs.hemodynamicResearchInputs, candidateInputs.ventricularContractilityScale, undefined, candidateInputs.mechanismResearchInputs)
      : await Session.restoreStandard72ExactCheckpoint(initialization.checkpoint,
        source.hemodynamicResearchInputs, source.ventricularContractilityScale, undefined, source.mechanismResearchInputs);
    if (initialization.kind === "standard72-parameter-continuation") {
      session = await session.warmStartWithHemodynamicResearchInputs(candidateInputs.hemodynamicResearchInputs,
        candidateInputs.ventricularContractilityScale, undefined, candidateInputs.mechanismResearchInputs);
    }
    const fixture = createFixture(candidateInputs.hemodynamicResearchInputs,
      candidateInputs.ventricularContractilityScale, candidateInputs.mechanismResearchInputs);
    const respiratory = Object.freeze({ ...fixture.runtime.respiratory });
    if (!(["PEEP", "Pth0", "respAmpTh", "respAmpAlv", "respRate"] as const)
      .every(key => respiratory[key] === 0)) {
      throw new Error("Resting reference qualification requires zero pressure reference and no respiration");
    }
    if ([fixture.config.lvad, fixture.config.impella, fixture.config.vaEcmo,
      fixture.config.vvEcmo, fixture.config.iabp].some(control => control.enabled)) {
      throw new Error("Baseline qualification requires disabled assistance controls");
    }
    const settled = await settleMainWireFittingSessionV1({ session, fixture, nominalDtSec, abortSignal,
      requestIdentitySha256, checkpoint: () => session.checkpointStandard72Exact(), onPhase: p => { phase = p; } });
    if (settled.status !== "accepted") return fail(settled.status, settled.message);
    const { completedCycleCount, classification, checkpoint, diagnostics } = settled;
    const { completedBeat } = diagnostics;
    const applicability = Object.freeze({ respiratory,
      bodySurfaceAreaM2: referenceProfile.subject.bodySurfaceAreaM2,
      requestedHeartRateBpm: candidateInputs.hemodynamicResearchInputs.heartRateBpm,
      observedHeartRateBpm: 60 / completedBeat.durationSec });
    if (applicability.bodySurfaceAreaM2 !== 1.9 || !Number.isFinite(applicability.observedHeartRateBpm)
      || Math.abs(applicability.observedHeartRateBpm - applicability.requestedHeartRateBpm) >= 1e-7) {
      throw new Error("Resting reference qualification requires BSA1.9 and the requested beat heart rate");
    }
    return {
      evaluatorId, modelId, status: "accepted" as const, requestIdentitySha256, policyIdentitySha256,
      candidateInputs, nominalDtSec, initializationKind: initialization.kind,
      initialization: identity.initialization,
      executionPath: "standard72-selected-output-projection" as const,
      completedCycleCount, classification, checkpoint,
      diagnostics: {
        ...diagnostics, applicability,
      },
      wallTimeMs: performance.now() - startedAt,
    };
  } catch (error) {
    return fail(phase === "request-validation" || phase === "initialization" ? "invalid-or-physical"
      : phase === "observation" ? "nonsettled-or-event-change" : "numerical-unresolved",
    error instanceof Error ? error.message : String(error));
  }
}

export async function buildMainWireStandard72FittingPolicyIdentityV1() {
  return sha256CanonicalJsonHex({ evaluatorId, periodicPolicy, scales, numericalPolicy, restPolicy, referenceProfile,
    observationBounds, rightHeartBounds, gateRoles: gateEvidence.checkGroups,
    executionPath: "standard72-selected-output-projection", hotPathIntegrityTier: "hot-path-lean",
    analysisSchedule: "explicit-2ms-or-1ms-with-same-grid-lookahead-and-conservation-v1",
    observationWindowId: MAIN_WIRE_FITTING_OBSERVATION_WINDOW_V1_ID,
    observationMethodId: MAIN_WIRE_BASELINE_OBSERVATION_V2_ID, gateRolesId: MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID });
}

export type MainWireStandard72BaselineCalibrationEvaluationV1 = Awaited<ReturnType<typeof evaluateMainWireStandard72BaselineCalibrationCandidateV1>>;
export type MainWireStandard72AcceptedCalibrationEvaluationV1 = Extract<MainWireStandard72BaselineCalibrationEvaluationV1, { status: "accepted" }>;

function ownCandidate(value: Candidate): Candidate {
  assertUnaliasedMainWireFittingCandidateV1(value);
  const candidate = Object.freeze({ hemodynamicResearchInputs: ownHemodynamics(value.hemodynamicResearchInputs),
    ventricularContractilityScale: value.ventricularContractilityScale, mechanismResearchInputs: ownMechanism(value.mechanismResearchInputs) });
  assertOriginalDomain(candidate.mechanismResearchInputs.chamberMechanics);
  if (![60, 70].includes(candidate.hemodynamicResearchInputs.heartRateBpm)
    || candidate.hemodynamicResearchInputs.peepCmH2O !== 0
    || !(candidate.ventricularContractilityScale > 0) || !Number.isFinite(candidate.ventricularContractilityScale)) {
    throw new Error("Resting fitting requires HR60 or70, zero PEEP and positive finite contractility");
  }
  // Applicability is a property of this resting assessment, not its mutable seed.
  for (const key of ["valveAreas", "pericardium", "coronaryDisease", "oxygenTransport"] as const) {
    if (canonicalJsonStringify(candidate.mechanismResearchInputs[key]) !== canonicalJsonStringify(referenceMechanism[key])) {
      throw new Error(`Resting fitting does not qualify changed ${key}`);
    }
  }
  createFixture(candidate.hemodynamicResearchInputs, candidate.ventricularContractilityScale, candidate.mechanismResearchInputs);
  return candidate;
}

export { collectMainWireFittingCycleV1 as collectMainWireStandard72FittingCycleV1 } from "./MainWireFittingCycleV1";
