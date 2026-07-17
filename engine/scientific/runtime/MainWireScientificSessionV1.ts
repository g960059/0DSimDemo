import type {
  NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  checkpointMainWireFiveWallNonCoronaryV1,
  initializeMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
  type MainWireFiveWallNonCoronaryAcceptedStateV1,
  type MainWireFiveWallNonCoronaryCheckpointV1,
  type MainWireFiveWallNonCoronaryColdResultV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  sampleMainWireNormalAdultFiveWallDiagnosticStepV2,
  type MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  normalAdultMainWireRuntimeV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  resolveMainWireNormalAdultBloodVolumeOperatingPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import type {
  MainWireCommonPericardiumBindingV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  createMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  loadSimulationReleaseV1,
  sameSimulationReleaseRef,
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
  simulationReleaseRefIssuesV1,
  type SimulationReleaseV1,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

export const MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID =
  "main-wire-scientific-session-v1" as const;

export const MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V1_ID =
  "main-wire-scientific-session-exact-checkpoint-v1" as const;

/**
 * Transitional vertical slice: one fixed, healthy, five-wall/noncoronary
 * assembly hosted through a release-bound session. The equations remain owned
 * by the accepted main-wire kernels; this host deliberately does not copy them.
 */
export const MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM = Object.freeze({
  assembly: "fixed-normal-adult-five-wall-noncoronary" as const,
  mechanics:
    "full-Land-parallel-SLS-membrane-TriSeg-common-pericardium" as const,
  circulation: "main-wire-derived-15-node-noncoronary" as const,
  valvePreset: "healthy-quasi-steady-V2" as const,
  commonPericardium: "healthy-slack-on" as const,
  coronaryCirculationIncluded: false as const,
  deviceGraphIncluded: false as const,
  multipatchIncluded: false as const,
  currentDependencyBoundary:
    "transitional-imports-from-authoritative-main-wire-kernels" as const,
  equationDuplicationInSession: false as const,
  acceptedStateOwner: "session-private" as const,
  stepCommit: "atomic-circulation-and-mechanics" as const,
  failureSemantics: "retain-last-accepted-session-state" as const,
  checkpointKind: "exact-resume-not-warm-start-seed" as const,
  checkpointOuterIntegrity: "canonical-json-sha256" as const,
  legacyInnerTransactionFingerprint:
    "transition-compatibility-only-non-authoritative" as const,
});

type MechanicsState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireFiveWallNonCoronaryAcceptedStateV1<MechanicsState>;

export type MainWireScientificSessionSignalAvailabilityV1 =
  | "available"
  | "not-evaluated-at-accepted-state";

export type MainWireScientificSessionObservationV1 = Readonly<{
  observationId: "main-wire-scientific-session-observation-v1";
  sessionId: typeof MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  source: "cold-initialization" | "accepted-step" | "exact-checkpoint-restore";
  chamber: Readonly<Record<"LA" | "LV" | "RA" | "RV", Readonly<{
    volumeMl: number;
    absolutePressureMmHg: number | null;
    transmuralPressureMmHg: number | null;
    pressureAvailability: MainWireScientificSessionSignalAvailabilityV1;
  }>>>;
  vascularPressure: Readonly<Record<"Ao" | "PA" | "PVein", Readonly<{
    absolutePressureMmHg: number | null;
    pressureAvailability: MainWireScientificSessionSignalAvailabilityV1;
  }>>>;
  valve: Readonly<Record<"MV" | "AoV" | "TV" | "PV", Readonly<{
    flowMlPerSec: number | null;
    openingFraction01: number;
    flowAvailability: MainWireScientificSessionSignalAvailabilityV1;
  }>>>;
  pulmonaryVenousFlowMlPerSec: number | null;
  pulmonaryVenousFlowAvailability:
    MainWireScientificSessionSignalAvailabilityV1;
  diagnostics: Readonly<{
    mechanicsResidualNorm: number | null;
    mechanicsIterations: number | null;
    circulationScaledResidualInfinityNorm: number | null;
    maximumContinuityResidualMl: number | null;
    totalBloodVolumeErrorMl: number;
    mechanicsCallbackCount: number | null;
    mechanicsCallbackCacheHits: number | null;
    commonPericardialExcessPressureMmHg: number | null;
  }>;
}>;

export type MainWireScientificSessionExactCheckpointV1 = Readonly<{
  checkpointId:
    typeof MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  releaseRef: SimulationReleaseRef;
  assembly: typeof MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM.assembly;
  transaction: MainWireFiveWallNonCoronaryCheckpointV1;
  claim: Readonly<{
    exactReleaseRequired: true;
    semanticReresolutionAllowedHere: false;
    derivedObservationStored: false;
    outerIntegrity: "canonical-json-sha256";
    innerTransactionFingerprint:
      "transition-compatibility-only-non-authoritative";
  }>;
  checkpointSha256: string;
}>;

type MainWireScientificSessionExactCheckpointPayloadV1 = Omit<
  MainWireScientificSessionExactCheckpointV1,
  "checkpointSha256"
>;

export type MainWireScientificSessionStepResultV1 =
  | Readonly<{
    converged: true;
    observation: MainWireScientificSessionObservationV1;
  }>
  | Readonly<{
    converged: false;
    reason:
      | "circulation-or-mechanics-trial-failed"
      | "step-evaluation-threw";
    message: string;
    acceptedStateUnchanged: true;
    observation: MainWireScientificSessionObservationV1;
  }>;

export type MainWireScientificSessionTransientResultV1 = Readonly<{
  completed: boolean;
  requestedStepCount: number;
  completedStepCount: number;
  observations: readonly MainWireScientificSessionObservationV1[];
  finalObservation: MainWireScientificSessionObservationV1;
  failure: null | Extract<
    MainWireScientificSessionStepResultV1,
    Readonly<{ converged: false }>
  >;
}>;

type FixedAssemblyDependencies = Readonly<{
  provider: MainWireNormalAdultFiveWallProviderV1;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  pericardium: MainWireCommonPericardiumBindingV1;
}>;

export class MainWireScientificSessionV1 {
  readonly sessionId = MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID;
  readonly releaseRef: SimulationReleaseRef;
  readonly claim = MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM;

  private readonly dependencies: FixedAssemblyDependencies;
  private acceptedState: AcceptedState;
  private lastObservation: MainWireScientificSessionObservationV1;

  private constructor(
    releaseRef: SimulationReleaseRef,
    dependencies: FixedAssemblyDependencies,
    acceptedState: AcceptedState,
    observation: MainWireScientificSessionObservationV1,
  ) {
    this.releaseRef = copyReleaseRef(releaseRef);
    this.dependencies = dependencies;
    this.acceptedState = acceptedState;
    this.lastObservation = observation;
  }

  static async initialize(
    untrustedRelease: unknown,
  ): Promise<MainWireScientificSessionV1> {
    const release = await loadFixedAssemblyRelease(untrustedRelease);
    return MainWireScientificSessionV1.constructCold(release);
  }

  static async createCanonical(): Promise<MainWireScientificSessionV1> {
    const release = await createMainWireAdultFiveWallNonCoronaryReleaseV1();
    return MainWireScientificSessionV1.constructCold(release);
  }

  static async restoreExact(
    untrustedRelease: unknown,
    checkpoint: unknown,
  ): Promise<MainWireScientificSessionV1> {
    const release = await loadFixedAssemblyRelease(untrustedRelease);
    const validatedCheckpoint = await validateExactCheckpointEnvelope(
      release.ref,
      checkpoint,
    );
    const dependencies = buildFixedAssemblyDependencies();
    const acceptedState = restoreMainWireFiveWallNonCoronaryV1(
      dependencies.provider,
      validatedCheckpoint.transaction,
    );
    return new MainWireScientificSessionV1(
      release.ref,
      dependencies,
      acceptedState,
      restoredObservation(acceptedState),
    );
  }

  stateIdentity(): Readonly<{
    revision: number;
    acceptedTimeSec: number;
    totalBloodVolumeMl: number;
  }> {
    return Object.freeze({
      revision: this.acceptedState.revision,
      acceptedTimeSec: this.acceptedState.acceptedTimeSec,
      totalBloodVolumeMl: this.acceptedState.circulation.totalBloodVolumeMl,
    });
  }

  observe(): MainWireScientificSessionObservationV1 {
    return this.lastObservation;
  }

  step(dtSec: number): MainWireScientificSessionStepResultV1 {
    const before = this.acceptedState;
    let stepped;
    try {
      stepped = stepMainWireFiveWallNonCoronaryV1(
        this.dependencies.provider,
        before,
        {
          dtSec,
          runtime: this.dependencies.runtime,
          calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
          pericardium: this.dependencies.pericardium,
        },
      );
    } catch (error) {
      assertSessionStateNotPromoted(this.acceptedState, before);
      return Object.freeze({
        converged: false as const,
        reason: "step-evaluation-threw" as const,
        message: errorMessage(error),
        acceptedStateUnchanged: true as const,
        observation: this.lastObservation,
      });
    }
    if (stepped.converged === false) {
      assertSessionStateNotPromoted(this.acceptedState, before);
      if (
        stepped.rollbackState.revision !== before.revision
        || stepped.rollbackState.acceptedTimeSec !== before.acceptedTimeSec
      ) throw new Error("atomic transaction returned a mismatched rollback state");
      return Object.freeze({
        converged: false as const,
        reason: "circulation-or-mechanics-trial-failed" as const,
        message: stepped.message,
        acceptedStateUnchanged: true as const,
        observation: this.lastObservation,
      });
    }

    const observation = acceptedStepObservation(
      sampleMainWireNormalAdultFiveWallDiagnosticStepV2(stepped),
      stepped.acceptedState.revision,
    );
    this.acceptedState = stepped.acceptedState;
    this.lastObservation = observation;
    return Object.freeze({
      converged: true as const,
      observation,
    });
  }

  runTransient(input: Readonly<{
    dtSec: number;
    stepCount: number;
  }>): MainWireScientificSessionTransientResultV1 {
    if (!Number.isInteger(input.stepCount) || input.stepCount < 0) {
      throw new Error("stepCount must be a non-negative integer");
    }
    const observations: MainWireScientificSessionObservationV1[] = [];
    for (let index = 0; index < input.stepCount; index += 1) {
      const result = this.step(input.dtSec);
      if (result.converged === false) {
        return Object.freeze({
          completed: false,
          requestedStepCount: input.stepCount,
          completedStepCount: observations.length,
          observations: Object.freeze(observations),
          finalObservation: this.lastObservation,
          failure: result,
        });
      }
      observations.push(result.observation);
    }
    return Object.freeze({
      completed: true,
      requestedStepCount: input.stepCount,
      completedStepCount: observations.length,
      observations: Object.freeze(observations),
      finalObservation: this.lastObservation,
      failure: null,
    });
  }

  async checkpointExact(): Promise<MainWireScientificSessionExactCheckpointV1> {
    const payload = exactCheckpointPayload({
      checkpointId: MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V1_ID,
      schemaVersion: 1 as const,
      releaseRef: copyReleaseRef(this.releaseRef),
      assembly: MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM.assembly,
      transaction: checkpointMainWireFiveWallNonCoronaryV1(
        this.dependencies.provider,
        this.acceptedState,
      ),
      claim: Object.freeze({
        exactReleaseRequired: true as const,
        semanticReresolutionAllowedHere: false as const,
        derivedObservationStored: false as const,
        outerIntegrity: "canonical-json-sha256" as const,
        innerTransactionFingerprint:
          "transition-compatibility-only-non-authoritative" as const,
      }),
    });
    return Object.freeze({
      ...payload,
      checkpointSha256: await sha256CanonicalJsonHex(payload),
    });
  }

  private static constructCold(
    release: SimulationReleaseV1,
  ): MainWireScientificSessionV1 {
    const dependencies = buildFixedAssemblyDependencies();
    const bloodVolume = resolveMainWireNormalAdultBloodVolumeOperatingPointV1(
      dependencies.runtime,
    );
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider: dependencies.provider,
      runtime: dependencies.runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: dependencies.pericardium,
      circulationInitial: Object.freeze({
        fixedTotalBloodVolumeMl: bloodVolume.fixedTotalBloodVolumeMl,
        nodeVolumesMl: bloodVolume.nodeVolumesMl,
      }),
    });
    return new MainWireScientificSessionV1(
      release.ref,
      dependencies,
      cold.acceptedState,
      coldObservation(cold),
    );
  }
}

export async function createMainWireScientificSessionV1():
Promise<MainWireScientificSessionV1> {
  return MainWireScientificSessionV1.createCanonical();
}

export async function initializeMainWireScientificSessionV1(
  untrustedRelease: unknown,
): Promise<MainWireScientificSessionV1> {
  return MainWireScientificSessionV1.initialize(untrustedRelease);
}

export async function restoreMainWireScientificSessionExactV1(
  untrustedRelease: unknown,
  checkpoint: unknown,
): Promise<MainWireScientificSessionV1> {
  return MainWireScientificSessionV1.restoreExact(
    untrustedRelease,
    checkpoint,
  );
}

async function loadFixedAssemblyRelease(
  untrustedRelease: unknown,
): Promise<SimulationReleaseV1> {
  const [loaded, canonical] = await Promise.all([
    loadSimulationReleaseV1(untrustedRelease),
    createMainWireAdultFiveWallNonCoronaryReleaseV1(),
  ]);
  if (!sameSimulationReleaseRef(loaded.ref, canonical.ref)) {
    throw new Error(
      "scientific session release is valid but does not identify the fixed canonical assembly",
    );
  }
  return loaded;
}

function buildFixedAssemblyDependencies(): FixedAssemblyDependencies {
  return Object.freeze({
    provider: createCanonicalMainWireNormalAdultFiveWallProviderV1("on"),
    runtime: normalAdultMainWireRuntimeV1(),
    pericardium: createMainWireNormalAdultCommonPericardiumV1(
      "on",
      "healthy-slack",
    ),
  });
}

function coldObservation(
  cold: MainWireFiveWallNonCoronaryColdResultV1<MechanicsState>,
): MainWireScientificSessionObservationV1 {
  const state = cold.acceptedState;
  const pressureOffsetMmHg = cold.commonIntrathoracicPressureMmHg
    + cold.pericardium.excessPressureMmHg;
  return Object.freeze({
    observationId: "main-wire-scientific-session-observation-v1" as const,
    sessionId: MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    source: "cold-initialization" as const,
    chamber: chamberRecord((chamber) => Object.freeze({
      volumeMl: state.circulation.nodeVolumesMl[chamber],
      absolutePressureMmHg:
        cold.transmuralPressuresMmHg[chamber] + pressureOffsetMmHg,
      transmuralPressureMmHg: cold.transmuralPressuresMmHg[chamber],
      pressureAvailability: "available" as const,
    })),
    vascularPressure: vascularPressureRecord(() => Object.freeze({
      absolutePressureMmHg: null,
      pressureAvailability: "not-evaluated-at-accepted-state" as const,
    })),
    valve: valveRecord((valve) => Object.freeze({
      flowMlPerSec: null,
      openingFraction01:
        state.circulation.valveStates[valve].leafletOpeningFraction01,
      flowAvailability: "not-evaluated-at-accepted-state" as const,
    })),
    pulmonaryVenousFlowMlPerSec: null,
    pulmonaryVenousFlowAvailability:
      "not-evaluated-at-accepted-state" as const,
    diagnostics: Object.freeze({
      mechanicsResidualNorm: null,
      mechanicsIterations: null,
      circulationScaledResidualInfinityNorm: null,
      maximumContinuityResidualMl: null,
      totalBloodVolumeErrorMl: 0,
      mechanicsCallbackCount: null,
      mechanicsCallbackCacheHits: null,
      commonPericardialExcessPressureMmHg:
        cold.pericardium.excessPressureMmHg,
    }),
  });
}

function acceptedStepObservation(
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV2,
  revision: number,
): MainWireScientificSessionObservationV1 {
  return Object.freeze({
    observationId: "main-wire-scientific-session-observation-v1" as const,
    sessionId: MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID,
    revision,
    acceptedTimeSec: sample.timeSec,
    source: "accepted-step" as const,
    chamber: chamberRecord((chamber) => Object.freeze({
      volumeMl: sample.nodeVolumeMl[chamber],
      absolutePressureMmHg: sample.nodeAbsolutePressureMmHg[chamber],
      transmuralPressureMmHg: sample.chamberTransmuralPressureMmHg[chamber],
      pressureAvailability: "available" as const,
    })),
    vascularPressure: vascularPressureRecord((node) => Object.freeze({
      absolutePressureMmHg: sample.nodeAbsolutePressureMmHg[node],
      pressureAvailability: "available" as const,
    })),
    valve: valveRecord((valve) => Object.freeze({
      flowMlPerSec: sample.flowMlPerSec[valve],
      openingFraction01: sample.valveOpeningFraction01[valve],
      flowAvailability: "available" as const,
    })),
    pulmonaryVenousFlowMlPerSec: sample.flowMlPerSec.PVein_LA,
    pulmonaryVenousFlowAvailability: "available" as const,
    diagnostics: Object.freeze({
      mechanicsResidualNorm: sample.diagnostics.mechanicsResidualNorm,
      mechanicsIterations: sample.diagnostics.mechanicsIterations,
      circulationScaledResidualInfinityNorm:
        sample.diagnostics.circulationScaledResidualInfinityNorm,
      maximumContinuityResidualMl:
        sample.diagnostics.maximumContinuityResidualMl,
      totalBloodVolumeErrorMl: sample.diagnostics.totalBloodVolumeErrorMl,
      mechanicsCallbackCount: sample.diagnostics.mechanicsCallbackCount,
      mechanicsCallbackCacheHits:
        sample.diagnostics.mechanicsCallbackCacheHits,
      commonPericardialExcessPressureMmHg:
        sample.commonPericardium.excessPressureMmHg,
    }),
  });
}

function restoredObservation(
  state: AcceptedState,
): MainWireScientificSessionObservationV1 {
  return Object.freeze({
    observationId: "main-wire-scientific-session-observation-v1" as const,
    sessionId: MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    source: "exact-checkpoint-restore" as const,
    chamber: chamberRecord((chamber) => Object.freeze({
      volumeMl: state.circulation.nodeVolumesMl[chamber],
      absolutePressureMmHg: null,
      transmuralPressureMmHg: null,
      pressureAvailability: "not-evaluated-at-accepted-state" as const,
    })),
    vascularPressure: vascularPressureRecord(() => Object.freeze({
      absolutePressureMmHg: null,
      pressureAvailability: "not-evaluated-at-accepted-state" as const,
    })),
    valve: valveRecord((valve) => Object.freeze({
      flowMlPerSec: null,
      openingFraction01:
        state.circulation.valveStates[valve].leafletOpeningFraction01,
      flowAvailability: "not-evaluated-at-accepted-state" as const,
    })),
    pulmonaryVenousFlowMlPerSec: null,
    pulmonaryVenousFlowAvailability:
      "not-evaluated-at-accepted-state" as const,
    diagnostics: Object.freeze({
      mechanicsResidualNorm: null,
      mechanicsIterations: null,
      circulationScaledResidualInfinityNorm: null,
      maximumContinuityResidualMl: null,
      totalBloodVolumeErrorMl: 0,
      mechanicsCallbackCount: null,
      mechanicsCallbackCacheHits: null,
      commonPericardialExcessPressureMmHg: null,
    }),
  });
}

async function validateExactCheckpointEnvelope(
  expectedReleaseRef: SimulationReleaseRef,
  checkpoint: unknown,
): Promise<MainWireScientificSessionExactCheckpointV1> {
  if (
    !isRecord(checkpoint)
    || !hasExactKeys(checkpoint, [
      "checkpointId",
      "schemaVersion",
      "releaseRef",
      "assembly",
      "transaction",
      "claim",
      "checkpointSha256",
    ])
    || !isRecord(checkpoint.transaction)
    || !isRecord(checkpoint.claim)
    || !hasExactKeys(checkpoint.claim, [
      "exactReleaseRequired",
      "semanticReresolutionAllowedHere",
      "derivedObservationStored",
      "outerIntegrity",
      "innerTransactionFingerprint",
    ])
  ) {
    throw new Error("scientific session exact-checkpoint envelope mismatch");
  }
  const releaseIssues = simulationReleaseRefIssuesV1(checkpoint.releaseRef);
  if (
    checkpoint.checkpointId
      !== MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V1_ID
    || checkpoint.schemaVersion !== 1
    || checkpoint.assembly !== MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM.assembly
    || checkpoint.claim.exactReleaseRequired !== true
    || checkpoint.claim.semanticReresolutionAllowedHere !== false
    || checkpoint.claim.derivedObservationStored !== false
    || checkpoint.claim.outerIntegrity !== "canonical-json-sha256"
    || checkpoint.claim.innerTransactionFingerprint
      !== "transition-compatibility-only-non-authoritative"
    || typeof checkpoint.checkpointSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(checkpoint.checkpointSha256)
    || releaseIssues.length > 0
  ) throw new Error("scientific session exact-checkpoint envelope mismatch");
  if (!sameSimulationReleaseRef(
    expectedReleaseRef,
    checkpoint.releaseRef as SimulationReleaseRef,
  )) {
    throw new Error("scientific session release identity mismatch");
  }
  const typed = checkpoint as unknown as
    MainWireScientificSessionExactCheckpointV1;
  const { checkpointSha256, ...payload } = typed;
  const expectedCheckpointSha256 = await sha256CanonicalJsonHex(payload);
  if (checkpointSha256 !== expectedCheckpointSha256) {
    throw new Error("scientific session exact-checkpoint outer SHA-256 mismatch");
  }
  return typed;
}

function exactCheckpointPayload(
  payload: MainWireScientificSessionExactCheckpointPayloadV1,
): MainWireScientificSessionExactCheckpointPayloadV1 {
  return Object.freeze(payload);
}

function copyReleaseRef(ref: SimulationReleaseRef): SimulationReleaseRef {
  return Object.freeze({
    id: ref.id,
    version: ref.version,
    sha256: ref.sha256,
  });
}

function assertSessionStateNotPromoted(
  current: AcceptedState,
  before: AcceptedState,
): void {
  if (
    current !== before
    || current.revision !== before.revision
    || current.acceptedTimeSec !== before.acceptedTimeSec
  ) throw new Error("failed scientific step promoted session state");
}

function chamberRecord<T>(
  build: (chamber: "LA" | "LV" | "RA" | "RV") => T,
): Readonly<Record<"LA" | "LV" | "RA" | "RV", T>> {
  return Object.freeze(Object.fromEntries(
    (["LA", "LV", "RA", "RV"] as const)
      .map((chamber) => [chamber, build(chamber)]),
  )) as Readonly<Record<"LA" | "LV" | "RA" | "RV", T>>;
}

function valveRecord<T>(
  build: (valve: "MV" | "AoV" | "TV" | "PV") => T,
): Readonly<Record<"MV" | "AoV" | "TV" | "PV", T>> {
  return Object.freeze(Object.fromEntries(
    (["MV", "AoV", "TV", "PV"] as const)
      .map((valve) => [valve, build(valve)]),
  )) as Readonly<Record<"MV" | "AoV" | "TV" | "PV", T>>;
}

function vascularPressureRecord<T>(
  build: (node: "Ao" | "PA" | "PVein") => T,
): Readonly<Record<"Ao" | "PA" | "PVein", T>> {
  return Object.freeze(Object.fromEntries(
    (["Ao", "PA", "PVein"] as const)
      .map((node) => [node, build(node)]),
  )) as Readonly<Record<"Ao" | "PA" | "PVein", T>>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}
