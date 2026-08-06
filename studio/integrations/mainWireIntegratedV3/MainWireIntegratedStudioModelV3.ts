import {
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
  type MainWireIntegratedModelHemodynamicResearchInputKeyV3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  buildMainWireIntegratedModelGuytonStarlingOrientationV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
  runMainWireIntegratedModelFormalPressureVolumeProtocolV3,
  runMainWireIntegratedModelResponsiveStarlingProtocolV3,
  type MainWireIntegratedModelResponsiveStarlingPartitionV3,
} from "@/engine/myocardium/MainWireIntegratedModelResponsiveStarlingProtocolV3";
import { MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID,
  projectMainWireIntegratedModelAdvancedFrameV3,
  projectMainWireIntegratedModelObservationV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_DT_SEC_V3,
  MAIN_WIRE_INTEGRATED_MODEL_SESSION_V3_ID,
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
  type MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_ADMISSION_V3_ID,
  admitMainWireIntegratedModelSnapshotV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelSnapshotAdmissionV3";
import type {
  ExperimentCaptureResultV2,
  ExperimentSnapshotAdmissionResultV2,
} from "@/studio/contracts/v2/authoring";
import type {
  ExperimentContentV2,
  ScenarioCaptureV2,
  ScenarioCheckpointV2,
} from "@/studio/contracts/v2/content";
import type { RegisteredModelExecutableBundleV2 } from "@/studio/contracts/v2/executable";
import {
  STUDIO_REGISTERED_MODEL_PACKAGE_V2_SCHEMA_ID,
  assertRegisteredModelPackageManifestV2,
  type ControlDefinitionV2,
  type ModelContractV2,
  type RegisteredModelPackageManifestV2,
} from "@/studio/contracts/v2/model";
import { studioNumericControlValueIssueV2 } from "@/studio/contracts/v2/control";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import { validateAndOwnStudioSimulationPortableJsonV2 } from "@/studio/contracts/v2/simulation";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type {
  StudioControlActionV2,
  StudioFixturePatchV2,
} from "@/studio/contracts/v2/runtime";
import {
  cloneAndFreezeStudioJson,
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";
import type { RegisterExactModelPackageInputV2 } from "@/studio/infrastructure/model/InMemoryRegisteredModelStoreV2";
import { importExactExecutableArtifactModuleV2 } from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";

export const MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3 =
  "circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.development-36" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3 =
  "circleheart.main-wire-integrated-transaction" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_HOT_PATH_INTEGRITY_TIER_V3 =
  "hot-path-lean" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3 =
  "circleheart.main-wire-integrated-v3-regular-sinus-all-off-fixture.v5" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3 =
  "circleheart.main-wire-integrated-v3-studio-checkpoint-codec.v5" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_SNAPSHOT_GATE_ID_V3 =
  "main-wire-integrated-studio-snapshot-admission-v6" as const;

export const MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3 = Object.freeze({
  systemicResistance: "hemodynamics.systemic-resistance",
  pulmonaryResistance: "hemodynamics.pulmonary-resistance",
  venousTone: "hemodynamics.venous-tone",
  arterialStiffness: "hemodynamics.arterial-stiffness",
  heartRateBpm: "rhythm.heart-rate-bpm",
  totalBloodVolumeMl: "hemodynamics.total-blood-volume-ml",
  peepCmH2O: "ventilation.peep-cm-h2o",
} as const);

export type MainWireIntegratedStudioControlIdV3 =
  (typeof MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3)[MainWireIntegratedModelHemodynamicResearchInputKeyV3];

export type MainWireIntegratedStudioFixtureV3 = Readonly<{
  schemaId: typeof MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3;
  rhythm: Readonly<{ mode: "regular-sinus-v3" }>;
  coronary: Readonly<{ diseaseProfile: "normal-coronary-v2" }>;
  dynamicMechanicalSupport: Readonly<{
    mode: "all-off-zero-inertance-v3";
  }>;
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3;
}>;

export const MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3: MainWireIntegratedStudioFixtureV3 =
  Object.freeze({
    schemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
    rhythm: Object.freeze({ mode: "regular-sinus-v3" }),
    coronary: Object.freeze({ diseaseProfile: "normal-coronary-v2" }),
    dynamicMechanicalSupport: Object.freeze({
      mode: "all-off-zero-inertance-v3",
    }),
    hemodynamicResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  });

export type MainWireIntegratedStudioLiveScenarioInputV3 = Readonly<{
  scenarioId: string;
  fixture: StudioJsonValueV2;
  checkpoint?: ScenarioCheckpointV2;
}>;

export type MainWireIntegratedStudioLiveFrameV3 = StudioSimulationFrameV2;

export type MainWireIntegratedStudioControlTransitionResultV3 = Readonly<{
  transition: "accepted-state-warm-start";
  inputEpoch: number;
  frame: MainWireIntegratedStudioLiveFrameV3;
}>;

type RuntimeScenarioV3 = {
  fixture: MainWireIntegratedStudioFixtureV3;
  inputEpoch: number;
  modelSession: MainWireIntegratedModelSessionV3;
  presentationOriginSec: number;
  presentationOrdinal: number;
};

type RuntimeSessionV3 = {
  scenarios: Map<string, RuntimeScenarioV3>;
};

/**
 * Engine-integration owner for the registered V3 package. Its ephemeral
 * runtime is deliberately separate
 * from Experiment persistence: session IDs, input epochs, accepted steps, and
 * output frames never enter Experiment or Snapshot content.
 */
export class MainWireIntegratedStudioRuntimeHostV3 {
  readonly #sessions = new Map<string, RuntimeSessionV3>();
  readonly #retiredSessionIds = new Set<string>();

  async createSession(
    runtimeSessionId: string,
    scenarioInputs: readonly MainWireIntegratedStudioLiveScenarioInputV3[],
  ): Promise<void> {
    requiredId(runtimeSessionId, "runtimeSessionId");
    if (
      this.#sessions.has(runtimeSessionId) ||
      this.#retiredSessionIds.has(runtimeSessionId)
    ) {
      throw new Error(
        `V3 runtime session ID is active or retired: ${runtimeSessionId}`,
      );
    }
    if (scenarioInputs.length === 0) {
      throw new Error("V3 runtime session requires at least one Scenario");
    }
    const scenarios = new Map<string, RuntimeScenarioV3>();
    for (const input of scenarioInputs) {
      requiredId(input.scenarioId, "scenarioId");
      if (scenarios.has(input.scenarioId)) {
        throw new Error(`duplicate V3 runtime Scenario: ${input.scenarioId}`);
      }
      const fixture = validateAndOwnFixtureV3(input.fixture);
      const modelSession =
        input.checkpoint === undefined
          ? await MainWireIntegratedModelSessionV3.create(
              fixture.hemodynamicResearchInputs,
            )
          : await MainWireIntegratedModelSessionV3.restoreOperationalCheckpoint(
              validateScenarioCheckpointV3(input.checkpoint).payload,
              fixture.hemodynamicResearchInputs,
            );
      if (
        input.checkpoint !== undefined &&
        (modelSession.currentAcceptedState().revision !==
          input.checkpoint.acceptedRevision ||
          modelSession.currentAcceptedState().acceptedTimeSec !==
            input.checkpoint.acceptedTimeSec)
      ) {
        throw new Error(
          `V3 runtime Scenario ${input.scenarioId} checkpoint clock mismatch`,
        );
      }
      scenarios.set(input.scenarioId, {
        fixture,
        inputEpoch: 0,
        modelSession,
        presentationOriginSec:
          modelSession.currentAcceptedState().acceptedTimeSec,
        presentationOrdinal: 0,
      });
    }
    this.#sessions.set(runtimeSessionId, { scenarios });
  }

  closeSession(runtimeSessionId: string): void {
    if (this.#sessions.delete(runtimeSessionId)) {
      this.#retiredSessionIds.add(runtimeSessionId);
    }
  }

  currentInputEpoch(runtimeSessionId: string, scenarioId: string): number {
    return this.#requiredScenario(runtimeSessionId, scenarioId).inputEpoch;
  }

  currentFixture(
    runtimeSessionId: string,
    scenarioId: string,
  ): MainWireIntegratedStudioFixtureV3 {
    return this.#requiredScenario(runtimeSessionId, scenarioId).fixture;
  }

  currentFrame(
    runtimeSessionId: string,
    scenarioId: string,
  ): MainWireIntegratedStudioLiveFrameV3 {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const observation = scenario.modelSession.observe();
    const accepted = observation.acceptedState;
    return toStudioSimulationFrameV3({
      runtimeSessionId,
      scenarioId,
      inputEpoch: scenario.inputEpoch,
      acceptedRevision: accepted.revision,
      acceptedTimeSec: accepted.acceptedTimeSec,
      frame: projectMainWireIntegratedModelObservationV3(observation),
    });
  }

  advanceOnePresentationStep(
    runtimeSessionId: string,
    scenarioId: string,
  ): MainWireIntegratedStudioLiveFrameV3 {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const nextPresentationOrdinal = scenario.presentationOrdinal + 1;
    const presentationTimeSec =
      scenario.presentationOriginSec +
      mainWireIntegratedModelPresentationTargetTimeSecV3(
        nextPresentationOrdinal,
      );
    const advance =
      scenario.modelSession.advanceToPresentationTime(presentationTimeSec);
    if (advance.status !== "advanced") {
      throw new Error(advanceFailureMessageV3(advance));
    }
    scenario.presentationOrdinal = nextPresentationOrdinal;
    return toStudioSimulationFrameV3({
      runtimeSessionId,
      scenarioId,
      inputEpoch: scenario.inputEpoch,
      acceptedRevision: advance.acceptedRevision,
      acceptedTimeSec: advance.acceptedTimeSec,
      frame: projectMainWireIntegratedModelAdvancedFrameV3(advance),
    });
  }

  async applyControl(
    runtimeSessionId: string,
    scenarioId: string,
    controlId: string,
    value: number,
    expectedInputEpoch: number,
  ): Promise<MainWireIntegratedStudioControlTransitionResultV3> {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (scenario.inputEpoch !== expectedInputEpoch) {
      throw new Error(
        `V3 control input epoch is stale: expected ${expectedInputEpoch}, ` +
          `current ${scenario.inputEpoch}`,
      );
    }
    const fixture = reduceControlToCompleteFixtureV3(
      scenario.fixture,
      Object.freeze({
        kind: "control",
        controlId,
        value,
      }),
    );
    return this.#warmStartFixtureAtomically(
      runtimeSessionId,
      scenarioId,
      fixture,
      expectedInputEpoch,
    );
  }

  async requestAnalysis(
    runtimeSessionId: string,
    scenarioId: string,
    analysisId: string,
    expectedInputEpoch: number,
    expectedAcceptedRevision: number,
    expectedAcceptedTimeSec: number,
    analysisPartition?: string,
    onProgress?: (analysis: StudioSimulationAnalysisV2) => void,
  ): Promise<StudioSimulationAnalysisV2> {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const observation = scenario.modelSession.observe();
    const accepted = observation.acceptedState;
    if (
      scenario.inputEpoch !== expectedInputEpoch ||
      accepted.revision !== expectedAcceptedRevision ||
      accepted.acceptedTimeSec !== expectedAcceptedTimeSec
    ) {
      throw new Error("V3 analysis source clocks are stale");
    }
    if (
      analysisId !==
        MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID &&
      analysisId !==
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
    ) {
      throw new Error(`V3 analysis is not registered: ${analysisId}`);
    }
    const responsivePartition:
      MainWireIntegratedModelResponsiveStarlingPartitionV3 | undefined =
      analysisPartition === undefined
        ? undefined
        : analysisPartition ===
              MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3 ||
            analysisPartition ===
              MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3
          ? analysisPartition
          : (() => {
              throw new Error(
                `V3 analysis partition is not registered: ${analysisPartition}`,
              );
            })();
    const toAnalysis = (
      starling: Awaited<ReturnType<
        typeof runMainWireIntegratedModelResponsiveStarlingProtocolV3
      >> | Awaited<ReturnType<
        typeof runMainWireIntegratedModelFormalPressureVolumeProtocolV3
      >> | null,
    ): StudioSimulationAnalysisV2 => {
      const payload = validateAndOwnStudioSimulationPortableJsonV2(
        buildMainWireIntegratedModelGuytonStarlingOrientationV3(
          starling?.anchorObservation ?? observation,
          scenario.fixture.hemodynamicResearchInputs,
          starling === null
            ? undefined
            : Object.freeze({
                right: starling.right,
                left: starling.left,
              }),
        ),
        "$.mainWireIntegratedV3Analysis.payload",
      );
      return Object.freeze({
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
        runtimeSessionId,
        scenarioId,
        inputEpoch: scenario.inputEpoch,
        sourceAcceptedRevision: accepted.revision,
        sourceAcceptedTimeSec: accepted.acceptedTimeSec,
        analysisId,
        payload,
      });
    };
    const starling = analysisId ===
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
      ? await runMainWireIntegratedModelFormalPressureVolumeProtocolV3(
          scenario.modelSession,
          scenario.fixture.hemodynamicResearchInputs,
          (progress) => onProgress?.(toAnalysis(progress)),
          responsivePartition,
        )
      : runMainWireIntegratedModelResponsiveStarlingProtocolV3(
          scenario.modelSession,
          (progress) => onProgress?.(toAnalysis(progress)),
          responsivePartition,
        );
    return toAnalysis(starling);
  }

  /** Full-fixture replacement preserves the current accepted boundary. */
  async replaceFixture(
    runtimeSessionId: string,
    scenarioId: string,
    fixtureValue: StudioJsonValueV2,
  ): Promise<number> {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const fixture = validateAndOwnFixtureV3(fixtureValue);
    const result = await this.#warmStartFixtureAtomically(
      runtimeSessionId,
      scenarioId,
      fixture,
      scenario.inputEpoch,
    );
    return result.inputEpoch;
  }

  async captureDesiredContent(
    input: Readonly<{
      experimentId: string;
      model: ModelContractV2;
      desiredContent: Readonly<{
        modelId: string;
        scenarios: readonly Readonly<{
          scenarioId: string;
          label: string;
          fixture: StudioJsonValueV2;
        }>[];
        surface: ExperimentContentV2["surface"];
      }>;
      correlation: Readonly<{
        runtimeSessionId: string;
        scenarios: readonly Readonly<{
          scenarioId: string;
          expectedInputEpoch: number;
        }>[];
      }>;
    }>,
  ): Promise<ExperimentCaptureResultV2> {
    assertExactModelV3(input.model);
    const runtimeSession = this.#requiredSession(
      input.correlation.runtimeSessionId,
    );
    if (
      input.desiredContent.scenarios.length !==
      input.correlation.scenarios.length
    ) {
      throw new Error("V3 Experiment capture Scenario correlation length mismatch");
    }

    const captured = input.desiredContent.scenarios.map((desired, index) => {
      const expected = input.correlation.scenarios[index];
      if (expected?.scenarioId !== desired.scenarioId) {
        throw new Error("V3 Experiment capture Scenario order mismatch");
      }
      const runtime = runtimeSession.scenarios.get(desired.scenarioId);
      if (runtime === undefined) {
        throw new Error(
          `V3 Experiment capture Scenario not found: ${desired.scenarioId}`,
        );
      }
      const desiredFixture = validateAndOwnFixtureV3(desired.fixture);
      if (
        studioCanonicalJsonStringify(runtime.fixture) !==
        studioCanonicalJsonStringify(desiredFixture)
      ) {
        throw new Error(
          `V3 Experiment capture fixture is not current for ${desired.scenarioId}`,
        );
      }
      if (runtime.inputEpoch !== expected.expectedInputEpoch) {
        throw new Error(
          `V3 Experiment capture input epoch is stale for ${desired.scenarioId}`,
        );
      }
      return {
        desired,
        expectedInputEpoch: expected.expectedInputEpoch,
        runtime,
      };
    });

    const checkpoints = await Promise.all(
      captured.map(async ({ runtime }) =>
        runtime.modelSession.checkpointOperational(),
      ),
    );

    const scenarios = captured.map((entry, index) => {
      if (
        entry.runtime.inputEpoch !== entry.expectedInputEpoch ||
        studioCanonicalJsonStringify(entry.runtime.fixture) !==
          studioCanonicalJsonStringify(entry.desired.fixture)
      ) {
        throw new Error(
          `V3 Experiment capture became stale for ${entry.desired.scenarioId}`,
        );
      }
      const payload = checkpoints[index]!;
      const checkpoint = Object.freeze({
        acceptedRevision: payload.revision,
        acceptedTimeSec: payload.acceptedTimeSec,
        payload: cloneAndFreezeStudioJson(payload),
      });
      return Object.freeze({
        scenarioId: entry.desired.scenarioId,
        label: entry.desired.label,
        capture: Object.freeze({
          fixture: entry.runtime.fixture,
          checkpoint,
        }),
      });
    });

    return Object.freeze({
      content: Object.freeze({
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
        scenarios: Object.freeze(scenarios),
        surface: input.desiredContent.surface,
      }),
      confirmation: Object.freeze({
        experimentId: input.experimentId,
        runtimeSessionId: input.correlation.runtimeSessionId,
        scenarios: Object.freeze(
          input.correlation.scenarios.map(
            ({ scenarioId, expectedInputEpoch }) =>
              Object.freeze({
                scenarioId,
                expectedInputEpoch,
              }),
          ),
        ),
      }),
    });
  }

  #requiredSession(runtimeSessionId: string): RuntimeSessionV3 {
    const session = this.#sessions.get(runtimeSessionId);
    if (session === undefined) {
      throw new Error(`V3 runtime session not found: ${runtimeSessionId}`);
    }
    return session;
  }

  #requiredScenario(
    runtimeSessionId: string,
    scenarioId: string,
  ): RuntimeScenarioV3 {
    const scenario =
      this.#requiredSession(runtimeSessionId).scenarios.get(scenarioId);
    if (scenario === undefined) {
      throw new Error(
        `V3 runtime Scenario not found: ${runtimeSessionId}/${scenarioId}`,
      );
    }
    return scenario;
  }

  async #warmStartFixtureAtomically(
    runtimeSessionId: string,
    scenarioId: string,
    fixture: MainWireIntegratedStudioFixtureV3,
    expectedInputEpoch: number,
  ): Promise<MainWireIntegratedStudioControlTransitionResultV3> {
    const original = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (original.inputEpoch !== expectedInputEpoch) {
      throw new Error(
        `V3 fixture warm start input epoch is stale: expected ` +
          `${expectedInputEpoch}, current ${original.inputEpoch}`,
      );
    }

    const candidateSession =
      await original.modelSession.warmStartWithHemodynamicResearchInputs(
        fixture.hemodynamicResearchInputs,
      );
    const nextInputEpoch = expectedInputEpoch + 1;
    const candidateObservation = candidateSession.observe();
    const candidateAccepted = candidateObservation.acceptedState;
    const originalAccepted = original.modelSession.currentAcceptedState();
    if (
      candidateAccepted.revision !== originalAccepted.revision ||
      candidateAccepted.acceptedTimeSec !== originalAccepted.acceptedTimeSec
    ) {
      throw new Error("V3 fixture warm start changed the accepted clock");
    }
    const candidateFrame = toStudioSimulationFrameV3({
      runtimeSessionId,
      scenarioId,
      inputEpoch: nextInputEpoch,
      acceptedRevision: candidateAccepted.revision,
      acceptedTimeSec: candidateAccepted.acceptedTimeSec,
      frame: projectMainWireIntegratedModelObservationV3(candidateObservation),
    });

    const current = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (current !== original || current.inputEpoch !== expectedInputEpoch) {
      throw new Error("V3 fixture warm start became stale before atomic swap");
    }
    current.fixture = fixture;
    current.modelSession = candidateSession;
    current.presentationOriginSec = candidateAccepted.acceptedTimeSec;
    current.presentationOrdinal = 0;
    current.inputEpoch = nextInputEpoch;
    return Object.freeze({
      transition: "accepted-state-warm-start" as const,
      inputEpoch: nextInputEpoch,
      frame: candidateFrame,
    });
  }
}

export type MainWireIntegratedStudioModelPackageV3 = Readonly<{
  manifest: RegisteredModelPackageManifestV2;
  createRegistryAdmission(
    executableArtifact: Uint8Array,
  ): RegisterExactModelPackageInputV2;
  defaultFixture: MainWireIntegratedStudioFixtureV3;
}>;

export type MainWireIntegratedStudioExecutableReleaseV3 = Readonly<{
  manifest: RegisteredModelPackageManifestV2;
  executables: RegisteredModelExecutableBundleV2;
  defaultFixture: MainWireIntegratedStudioFixtureV3;
}>;

const MAIN_WIRE_INTEGRATED_STUDIO_ARTIFACT_FACTORY_EXPORT_V3 =
  "createMainWireIntegratedStudioExecutableReleaseV3" as const;

export function createMainWireIntegratedStudioModelPackageV3(): MainWireIntegratedStudioModelPackageV3 {
  const manifest = mainWireIntegratedStudioManifestV3();
  const canonicalManifest = studioCanonicalJsonStringify(manifest);
  const canonicalDefaultFixture = studioCanonicalJsonStringify(
    MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3,
  );
  return Object.freeze({
    manifest,
    createRegistryAdmission(executableArtifact: Uint8Array) {
      if (
        !(executableArtifact instanceof Uint8Array) ||
        executableArtifact.byteLength === 0
      ) {
        throw new Error(
          "V3 registry admission requires nonempty exact build artifact bytes",
        );
      }
      const admittedArtifact = new Uint8Array(executableArtifact);
      return Object.freeze({
        manifest,
        executableArtifact: admittedArtifact,
        async loadExecutables(candidate) {
          if (!sameBytesV3(candidate, admittedArtifact)) {
            throw new Error("V3 exact executable artifact bytes differ");
          }
          const release =
            await loadMainWireIntegratedStudioExecutableReleaseV3(candidate);
          if (
            studioCanonicalJsonStringify(release.manifest) !==
              canonicalManifest ||
            studioCanonicalJsonStringify(release.defaultFixture) !==
              canonicalDefaultFixture
          ) {
            throw new Error(
              "V3 executable artifact release differs from its admission package",
            );
          }
          return release.executables;
        },
      });
    },
    defaultFixture: MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3,
  });
}

/** The sole executable factory consumed from the deterministic ESM artifact. */
export function createMainWireIntegratedStudioExecutableReleaseV3(): MainWireIntegratedStudioExecutableReleaseV3 {
  return Object.freeze({
    manifest: mainWireIntegratedStudioManifestV3(),
    executables: mainWireIntegratedExecutableBundleV3(
      new MainWireIntegratedStudioRuntimeHostV3(),
    ),
    defaultFixture: MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3,
  });
}

/**
 * Materializes the V3 release by evaluating the exact self-contained artifact
 * bytes and invoking the factory exported by that evaluated module.
 */
export async function loadMainWireIntegratedStudioExecutableReleaseV3(
  executableArtifact: Uint8Array,
): Promise<MainWireIntegratedStudioExecutableReleaseV3> {
  const artifactModule =
    await importExactExecutableArtifactModuleV2(executableArtifact);
  if (
    !Object.prototype.hasOwnProperty.call(
      artifactModule,
      MAIN_WIRE_INTEGRATED_STUDIO_ARTIFACT_FACTORY_EXPORT_V3,
    ) ||
    typeof artifactModule[
      MAIN_WIRE_INTEGRATED_STUDIO_ARTIFACT_FACTORY_EXPORT_V3
    ] !== "function"
  ) {
    throw new Error(
      `V3 executable artifact must export ${MAIN_WIRE_INTEGRATED_STUDIO_ARTIFACT_FACTORY_EXPORT_V3}`,
    );
  }
  const factory = artifactModule[
    MAIN_WIRE_INTEGRATED_STUDIO_ARTIFACT_FACTORY_EXPORT_V3
  ] as () => unknown;
  const release = exactExecutableReleaseRecordV3(factory());
  const manifest = cloneAndFreezeStudioJson(release.manifest);
  assertRegisteredModelPackageManifestV2(manifest);
  const defaultFixture = validateAndOwnFixtureV3(release.defaultFixture);
  if (
    release.executables === null ||
    typeof release.executables !== "object" ||
    Array.isArray(release.executables)
  ) {
    throw new Error("V3 executable artifact returned an invalid bundle");
  }
  return Object.freeze({
    manifest,
    executables: release.executables as RegisteredModelExecutableBundleV2,
    defaultFixture,
  });
}

function scalarGraphSeriesV3(seriesId: string, outputId: string) {
  return Object.freeze({
    kind: "scalar" as const,
    seriesId,
    outputId,
  });
}

function pressureVolumeGraphSeriesV3(chamber: "LV" | "RV" | "RA" | "LA") {
  return Object.freeze({
    kind: "pressure-volume" as const,
    seriesId: chamber,
    volumeOutputId: `hemodynamics.volume.${chamber}`,
    pressureOutputId: `hemodynamics.pressure.transmural.${chamber}`,
    pressureBasis: "transmural" as const,
    cyclePhaseOutputId: "rhythm.phase.regular-sinus",
  });
}

function mainWireIntegratedStudioManifestV3(): RegisteredModelPackageManifestV2 {
  const outputCatalog = MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.map(
    (output) =>
      output.kind === "signal"
        ? Object.freeze({
            outputId: output.outputId,
            kind: "signal" as const,
            unit: output.unit,
            shape: "scalar" as const,
            sampling: "accepted-step" as const,
          })
        : Object.freeze({
            outputId: output.outputId,
            kind: "metric" as const,
            unit: output.unit,
            shape: "scalar" as const,
            scope: "beat" as const,
            dependencies: Object.freeze([...(output.dependencies ?? [])]),
          }),
  );
  return Object.freeze({
    schemaId: STUDIO_REGISTERED_MODEL_PACKAGE_V2_SCHEMA_ID,
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    modelFamilyId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
    displayName: "Main Wire Integrated Model V3",
    equations: Object.freeze({
      transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
      coronaryOwner: "main-wire-five-wall-coronary-transaction-v3",
      rhythmOwner: "accepted-composed-rhythm-transaction-v2",
      dynamicMechanicalSupportOwner:
        "circleheart-dynamic-mechanical-support-network-v1",
    }),
    runtime: Object.freeze({
      numericalSessionId: MAIN_WIRE_INTEGRATED_MODEL_SESSION_V3_ID,
      presentationDtSec: MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_DT_SEC_V3,
      hotPathIntegrityTier:
        MAIN_WIRE_INTEGRATED_STUDIO_HOT_PATH_INTEGRITY_TIER_V3,
      acceptedBoundaryCapture: true,
      runtimeFixtureCommands: Object.freeze([
        ...Object.values(MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3),
      ]),
      fixtureChangeSemantics:
        "atomic-accepted-state-warm-start-same-clock-new-fixture-epoch",
      scope:
        "variable-rate-regular-sinus-normal-coronary-all-off-zero-inertance-with-bounded-core-research-inputs",
    }),
    solver: Object.freeze({
      candidateSemantics:
        "event-limited-atomic-composed-rhythm-coronary-dynamic-mcs",
      acceptedStateMutation: false,
      failureRollback: "previous-accepted-tuple",
    }),
    fixtureSchema: Object.freeze({
      fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
      definition: Object.freeze({
        schemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
        exactKeys: Object.freeze([
          "schemaId",
          "rhythm",
          "coronary",
          "dynamicMechanicalSupport",
          "hemodynamicResearchInputs",
        ]),
        rhythmMode: "regular-sinus-v3",
        coronaryDiseaseProfile: "normal-coronary-v2",
        dynamicMechanicalSupportMode: "all-off-zero-inertance-v3",
        hemodynamicResearchInputRanges:
          MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
      }),
    }),
    checkpointCodec: Object.freeze({
      checkpointCodecId: MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3,
      definition: Object.freeze({
        checkpointId: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
        schemaVersion: 5,
        fixturePairing:
          "regular-sinus-all-off-zero-inertance-and-complete-core-input-identity",
        restoreSemantics: "exact-no-migration-no-clock-rebase",
      }),
    }),
    snapshotGate: Object.freeze({
      snapshotGateId: MAIN_WIRE_INTEGRATED_STUDIO_SNAPSHOT_GATE_ID_V3,
      definition: Object.freeze({
        status: "public-executable-admission",
        acceptedOutcome: "one-cycle-numerical-safety",
        admissionId: MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_ADMISSION_V3_ID,
        settlementRequired: false,
        physiologicalValidationClaimed: false,
        clinicalValidationClaimed: false,
      }),
    }),
    catalogs: Object.freeze({
      controlCatalog: Object.freeze(
        (
          Object.keys(
            MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3,
          ) as MainWireIntegratedModelHemodynamicResearchInputKeyV3[]
        ).map(mainWireIntegratedStudioControlDefinitionV3),
      ),
      outputCatalog: Object.freeze(outputCatalog),
      graphCatalog: Object.freeze([
        Object.freeze({
          graphId: "hemodynamics.pressure.waveform",
          renderer: "sweep" as const,
          seriesCatalog: Object.freeze([
            scalarGraphSeriesV3("LVP", "hemodynamics.pressure.absolute.LV"),
            scalarGraphSeriesV3("LAP", "hemodynamics.pressure.absolute.LA"),
            scalarGraphSeriesV3("AoP", "hemodynamics.pressure.absolute.Ao"),
            scalarGraphSeriesV3("RAP", "hemodynamics.pressure.absolute.RA"),
            scalarGraphSeriesV3("RVP", "hemodynamics.pressure.absolute.RV"),
            scalarGraphSeriesV3("PAP", "hemodynamics.pressure.absolute.PA"),
            scalarGraphSeriesV3(
              "PVeinP",
              "hemodynamics.pressure.absolute.PVein",
            ),
            scalarGraphSeriesV3("VCP", "hemodynamics.pressure.absolute.VC"),
            scalarGraphSeriesV3("Pperi", "pericardium.pressure.excess"),
            scalarGraphSeriesV3("Ppl", "respiration.pressure.pleural"),
            scalarGraphSeriesV3("Palv", "respiration.pressure.alveolar"),
          ]),
          defaultSeriesIds: Object.freeze(["LVP", "LAP", "AoP"]),
        }),
        Object.freeze({
          graphId: "hemodynamics.flow.waveform",
          renderer: "sweep" as const,
          seriesCatalog: Object.freeze([
            scalarGraphSeriesV3("MV", "hemodynamics.flow.valve.MV"),
            scalarGraphSeriesV3("AoV", "hemodynamics.flow.valve.AoV"),
            scalarGraphSeriesV3("TV", "hemodynamics.flow.valve.TV"),
            scalarGraphSeriesV3("PV", "hemodynamics.flow.valve.PV"),
            scalarGraphSeriesV3("Coronary", "coronary.flow.total"),
            scalarGraphSeriesV3("LAD", "coronary.flow.inlet.LAD"),
            scalarGraphSeriesV3("LCx", "coronary.flow.inlet.LCx"),
            scalarGraphSeriesV3("RCA", "coronary.flow.inlet.RCA"),
            scalarGraphSeriesV3("LVAD", "device.LVAD.flow"),
            scalarGraphSeriesV3("SA_Art", "hemodynamics.flow.systemic.SA_Art"),
            scalarGraphSeriesV3(
              "PA_PArt",
              "hemodynamics.flow.pulmonary.PA_PArt",
            ),
            scalarGraphSeriesV3("VC_RA", "hemodynamics.flow.venous.VC_RA"),
            scalarGraphSeriesV3(
              "PVein_LA",
              "hemodynamics.flow.venous.PVein_LA",
            ),
          ]),
          defaultSeriesIds: Object.freeze(["MV", "AoV", "TV", "PV"]),
        }),
        Object.freeze({
          graphId: "hemodynamics.pressure-volume",
          renderer: "pressure-volume" as const,
          seriesCatalog: Object.freeze(
            (["LV", "RV", "RA", "LA"] as const).map((chamber) =>
              pressureVolumeGraphSeriesV3(chamber),
            ),
          ),
          defaultSeriesIds: Object.freeze(["LV"]),
        }),
        Object.freeze({
          graphId: "hemodynamics.guyton-starling",
          renderer: "structural-return" as const,
          analysisId:
            MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
          side: "both" as const,
        }),
      ]),
    }),
  });
}

function mainWireIntegratedExecutableBundleV3(
  runtimeHost: MainWireIntegratedStudioRuntimeHostV3,
): RegisteredModelExecutableBundleV2 {
  const captureAdapter = Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
    checkpointCodecId: MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3,
    validateFixture(
      input: Readonly<{
        model: ModelContractV2;
        fixture: StudioJsonValueV2;
      }>,
    ) {
      assertExactModelV3(input.model);
      validateAndOwnFixtureV3(input.fixture);
      return undefined;
    },
    async validateCapture(
      input: Readonly<{
        model: ModelContractV2;
        capture: ScenarioCaptureV2;
      }>,
    ): Promise<void> {
      assertExactModelV3(input.model);
      const fixture = validateAndOwnFixtureV3(input.capture.fixture);
      const checkpoint = validateScenarioCheckpointV3(input.capture.checkpoint);
      const restored =
        await MainWireIntegratedModelSessionV3.restoreOperationalCheckpoint(
          checkpoint.payload,
          fixture.hemodynamicResearchInputs,
        );
      const accepted = restored.currentAcceptedState();
      if (
        accepted.revision !== checkpoint.acceptedRevision ||
        accepted.acceptedTimeSec !== checkpoint.acceptedTimeSec
      ) {
        throw new Error("V3 exact checkpoint restore clock mismatch");
      }
      const roundTrip = await restored.checkpointOperational();
      if (
        studioCanonicalJsonStringify(roundTrip) !==
        studioCanonicalJsonStringify(checkpoint.payload)
      ) {
        throw new Error("V3 exact checkpoint restore is not canonical");
      }
    },
  });
  const fixtureAdapter = Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
    validateCompleteFixture(
      input: Readonly<{
        context: Readonly<{ scenarioId: string; modelId: string }>;
        fixture: StudioJsonValueV2;
      }>,
    ) {
      if (input.context.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3) {
        throw new Error("V3 fixture runtime context modelId mismatch");
      }
      requiredId(input.context.scenarioId, "scenarioId");
      validateAndOwnFixtureV3(input.fixture);
      return undefined;
    },
    reduceControlAction(
      input: Readonly<{
        context: Readonly<{ scenarioId: string; modelId: string }>;
        fixture: StudioJsonValueV2;
        action: StudioControlActionV2;
      }>,
    ) {
      if (input.context.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3) {
        throw new Error("V3 fixture reduction modelId mismatch");
      }
      requiredId(input.context.scenarioId, "scenarioId");
      return controlPatchV3(
        validateAndOwnFixtureV3(input.fixture),
        input.action,
      );
    },
  });
  const simulationAdapter = Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
    checkpointCodecId: MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3,
    createSession(
      input: Readonly<{
        runtimeSessionId: string;
        scenarios: readonly MainWireIntegratedStudioLiveScenarioInputV3[];
      }>,
    ) {
      return runtimeHost.createSession(input.runtimeSessionId, input.scenarios);
    },
    disposeSession(runtimeSessionId: string) {
      runtimeHost.closeSession(runtimeSessionId);
    },
    currentFrame(
      input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
      }>,
    ) {
      return runtimeHost.currentFrame(input.runtimeSessionId, input.scenarioId);
    },
    async advanceOnePresentationStep(
      input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
      }>,
    ) {
      return runtimeHost.advanceOnePresentationStep(
        input.runtimeSessionId,
        input.scenarioId,
      );
    },
    async applyControl(
      input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
        controlId: string;
        value: number;
        expectedInputEpoch: number;
      }>,
    ) {
      const result = await runtimeHost.applyControl(
        input.runtimeSessionId,
        input.scenarioId,
        input.controlId,
        input.value,
        input.expectedInputEpoch,
      );
      return result.frame;
    },
    async requestAnalysis(
      input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
        analysisId: string;
        expectedInputEpoch: number;
        expectedAcceptedRevision: number;
        expectedAcceptedTimeSec: number;
        analysisPartition?: string;
        onProgress?: (analysis: StudioSimulationAnalysisV2) => void;
      }>,
    ) {
      return runtimeHost.requestAnalysis(
        input.runtimeSessionId,
        input.scenarioId,
        input.analysisId,
        input.expectedInputEpoch,
        input.expectedAcceptedRevision,
        input.expectedAcceptedTimeSec,
        input.analysisPartition,
        input.onProgress,
      );
    },
    async replaceFixture(
      input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
        fixture: StudioJsonValueV2;
      }>,
    ) {
      return runtimeHost.replaceFixture(
        input.runtimeSessionId,
        input.scenarioId,
        input.fixture,
      );
    },
    currentInputEpoch(
      input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
      }>,
    ) {
      return runtimeHost.currentInputEpoch(
        input.runtimeSessionId,
        input.scenarioId,
      );
    },
  });
  return Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
    checkpointCodecId: MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3,
    snapshotGateId: MAIN_WIRE_INTEGRATED_STUDIO_SNAPSHOT_GATE_ID_V3,
    captureAdapter,
    experimentCapture: Object.freeze({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
      fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
      checkpointCodecId: MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3,
      captureAcceptedCandidate:
        runtimeHost.captureDesiredContent.bind(runtimeHost),
    }),
    snapshotGate: Object.freeze({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
      snapshotGateId: MAIN_WIRE_INTEGRATED_STUDIO_SNAPSHOT_GATE_ID_V3,
      async admitFrozenCandidate(
        input: Readonly<{
          model: ModelContractV2;
          content: ExperimentContentV2;
        }>,
      ): Promise<ExperimentSnapshotAdmissionResultV2> {
        assertExactModelV3(input.model);
        for (const scenario of input.content.scenarios) {
          await captureAdapter.validateCapture({
            model: input.model,
            capture: scenario.capture,
          });
          const fixture = validateAndOwnFixtureV3(scenario.capture.fixture);
          const admission = await admitMainWireIntegratedModelSnapshotV3({
            candidateCheckpoint: scenario.capture.checkpoint.payload,
            hemodynamicResearchInputs: fixture.hemodynamicResearchInputs,
          });
          if (admission.status !== "accepted") {
            return Object.freeze({
              status: "rejected" as const,
              reason:
                `Scenario ${scenario.scenarioId} failed ` +
                `${admission.admissionId}: ${admission.reason}`,
            });
          }
        }
        return Object.freeze({ status: "passed" as const });
      },
    }),
    fixtureAdapter,
    simulationAdapter,
  });
}

function validateAndOwnFixtureV3(
  value: unknown,
): MainWireIntegratedStudioFixtureV3 {
  const fixture = cloneAndFreezeStudioJson(value);
  plainExactRecordV3(
    fixture,
    [
      "schemaId",
      "rhythm",
      "coronary",
      "dynamicMechanicalSupport",
      "hemodynamicResearchInputs",
    ],
    "V3 fixture",
  );
  if (fixture.schemaId !== MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3) {
    throw new Error("V3 fixture schemaId mismatch");
  }
  plainExactRecordV3(fixture.rhythm, ["mode"], "V3 fixture rhythm");
  if (fixture.rhythm.mode !== "regular-sinus-v3") {
    throw new Error("V3 fixture rhythm mode mismatch");
  }
  plainExactRecordV3(
    fixture.coronary,
    ["diseaseProfile"],
    "V3 fixture coronary",
  );
  if (fixture.coronary.diseaseProfile !== "normal-coronary-v2") {
    throw new Error("V3 fixture coronary disease profile mismatch");
  }
  plainExactRecordV3(
    fixture.dynamicMechanicalSupport,
    ["mode"],
    "V3 fixture dynamicMechanicalSupport",
  );
  if (fixture.dynamicMechanicalSupport.mode !== "all-off-zero-inertance-v3") {
    throw new Error("V3 fixture dynamic MCS mode mismatch");
  }
  const hemodynamicResearchInputs =
    validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
      fixture.hemodynamicResearchInputs,
    );
  return Object.freeze({
    schemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
    rhythm: fixture.rhythm,
    coronary: fixture.coronary,
    dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
    hemodynamicResearchInputs,
  }) as MainWireIntegratedStudioFixtureV3;
}

function reduceControlToCompleteFixtureV3(
  fixture: MainWireIntegratedStudioFixtureV3,
  action: StudioControlActionV2,
): MainWireIntegratedStudioFixtureV3 {
  const inputKey = controlInputKeyV3(action.controlId);
  const definition = mainWireIntegratedStudioControlDefinitionV3(inputKey);
  const valueIssue = studioNumericControlValueIssueV2(action.value, definition);
  if (valueIssue !== undefined) {
    throw new Error(`V3 control ${action.controlId} value ${valueIssue}`);
  }
  return validateAndOwnFixtureV3({
    ...fixture,
    hemodynamicResearchInputs: {
      ...fixture.hemodynamicResearchInputs,
      [inputKey]: action.value,
    },
  });
}

function mainWireIntegratedStudioControlDefinitionV3(
  inputKey: MainWireIntegratedModelHemodynamicResearchInputKeyV3,
): ControlDefinitionV2 {
  const range =
    MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3[inputKey];
  return Object.freeze({
    controlId: MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3[inputKey],
    valueType: "number",
    unit: controlUnitV3(inputKey),
    minimum: range.minimum,
    maximum: range.maximum,
    step: range.step,
    defaultValue:
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3[
        inputKey
      ],
    changeSemantics: "accepted-state-warm-start",
  });
}

function controlUnitV3(
  inputKey: MainWireIntegratedModelHemodynamicResearchInputKeyV3,
): string {
  if (inputKey === "heartRateBpm") return "bpm";
  if (inputKey === "totalBloodVolumeMl") return "mL";
  if (inputKey === "peepCmH2O") return "cmH2O";
  return "1";
}

function controlPatchV3(
  fixture: MainWireIntegratedStudioFixtureV3,
  action: StudioControlActionV2,
): StudioFixturePatchV2 {
  const reduced = reduceControlToCompleteFixtureV3(fixture, action);
  const inputKey = controlInputKeyV3(action.controlId);
  return Object.freeze({
    changes: Object.freeze([
      Object.freeze({
        path: Object.freeze([
          "hemodynamicResearchInputs",
          inputKey,
        ]) as readonly [string, string],
        value: reduced.hemodynamicResearchInputs[inputKey],
      }),
    ]),
  });
}

function controlInputKeyV3(
  controlId: string,
): MainWireIntegratedModelHemodynamicResearchInputKeyV3 {
  for (const [inputKey, registeredControlId] of Object.entries(
    MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3,
  )) {
    if (registeredControlId === controlId) {
      return inputKey as MainWireIntegratedModelHemodynamicResearchInputKeyV3;
    }
  }
  throw new Error(`unsupported V3 control: ${controlId}`);
}

function validateScenarioCheckpointV3(value: unknown): ScenarioCheckpointV2 {
  plainExactRecordV3(
    value,
    ["acceptedRevision", "acceptedTimeSec", "payload"],
    "V3 Scenario checkpoint",
  );
  nonnegativeSafeInteger(value.acceptedRevision, "checkpoint.acceptedRevision");
  nonnegativeFinite(value.acceptedTimeSec, "checkpoint.acceptedTimeSec");
  const payload = cloneAndFreezeStudioJson(value.payload);
  plainExactRecordV3(
    payload,
    [
      "checkpointId",
      "schemaVersion",
      "transactionId",
      "revision",
      "acceptedTimeSec",
      "composedRhythmConfigurationIdentitySha256",
      "dynamicMechanicalSupportProfileIdentitySha256",
      "dynamicMechanicalSupportStructuralHydraulicIdentitySha256",
      "hemodynamicResearchInputIdentitySha256",
      "coronary",
      "composedRhythm",
      "dynamicMechanicalSupport",
      "checkpointSha256",
    ],
    "V3 checkpoint payload",
  );
  if (
    payload.checkpointId !== MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID ||
    payload.schemaVersion !== 5 ||
    payload.transactionId !== MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID
  ) {
    throw new Error("V3 checkpoint payload identity mismatch");
  }
  nonnegativeSafeInteger(payload.revision, "checkpoint.payload.revision");
  nonnegativeFinite(
    payload.acceptedTimeSec,
    "checkpoint.payload.acceptedTimeSec",
  );
  if (
    payload.revision !== value.acceptedRevision ||
    payload.acceptedTimeSec !== value.acceptedTimeSec
  ) {
    throw new Error("V3 checkpoint wrapper and payload clocks differ");
  }
  for (const key of [
    "composedRhythmConfigurationIdentitySha256",
    "dynamicMechanicalSupportProfileIdentitySha256",
    "dynamicMechanicalSupportStructuralHydraulicIdentitySha256",
    "hemodynamicResearchInputIdentitySha256",
    "checkpointSha256",
  ]) {
    if (
      typeof payload[key] !== "string" ||
      !/^[0-9a-f]{64}$/.test(payload[key])
    ) {
      throw new Error(`V3 checkpoint ${key} is invalid`);
    }
  }
  return Object.freeze({
    acceptedRevision: value.acceptedRevision as number,
    acceptedTimeSec: value.acceptedTimeSec as number,
    payload,
  });
}

function assertExactModelV3(model: ModelContractV2): void {
  if (
    model.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3 ||
    model.fixtureSchemaId !==
      MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3 ||
    model.checkpointCodecId !==
      MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3 ||
    model.snapshotGateId !== MAIN_WIRE_INTEGRATED_STUDIO_SNAPSHOT_GATE_ID_V3
  ) {
    throw new Error("Main Wire V3 exact model contract mismatch");
  }
}

function exactExecutableReleaseRecordV3(value: unknown): Readonly<{
  manifest: unknown;
  executables: unknown;
  defaultFixture: unknown;
}> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    throw new Error("V3 executable artifact release must be a plain object");
  }
  const expected = ["defaultFixture", "executables", "manifest"];
  const actual = Object.keys(value).sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(
      `V3 executable artifact release must contain exactly ${expected.join(", ")}`,
    );
  }
  const record = value as Record<string, unknown>;
  const owned: Record<string, unknown> = {};
  for (const key of expected) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    if (
      descriptor === undefined ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    ) {
      throw new Error(
        `V3 executable artifact release ${key} must be an enumerable data property`,
      );
    }
    owned[key] = descriptor.value;
  }
  return Object.freeze({
    manifest: owned.manifest,
    executables: owned.executables,
    defaultFixture: owned.defaultFixture,
  });
}

function plainExactRecordV3(
  value: unknown,
  keys: readonly string[],
  label: string,
): asserts value is Record<string, StudioJsonValueV2> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    throw new Error(`${label} must be a plain object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} must contain exactly ${expected.join(", ")}`);
  }
}

function nonnegativeSafeInteger(value: unknown, label: string): void {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a nonnegative safe integer`);
  }
}

function nonnegativeFinite(value: unknown, label: string): void {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    Object.is(value, -0) ||
    value < 0
  ) {
    throw new Error(`${label} must be a nonnegative finite number`);
  }
}

function requiredId(value: unknown, label: string): asserts value is string {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/.test(value)
  ) {
    throw new Error(`${label} must be a portable ID`);
  }
}

function advanceFailureMessageV3(
  advance: Exclude<
    MainWireIntegratedModelPresentationAdvanceV3,
    { status: "advanced" }
  >,
): string {
  return advance.status === "failed"
    ? `V3 presentation step failed: ${advance.reason}: ${advance.message}`
    : "V3 presentation step did not advance";
}

function toStudioSimulationFrameV3(
  input: Readonly<{
    runtimeSessionId: string;
    scenarioId: string;
    inputEpoch: number;
    acceptedRevision: number;
    acceptedTimeSec: number;
    frame: ReturnType<typeof projectMainWireIntegratedModelObservationV3>;
  }>,
): StudioSimulationFrameV2 {
  const outputs = Object.fromEntries(
    Object.values(input.frame.values).map((value) => [
      value.outputId,
      Object.freeze({
        outputId: value.outputId,
        value: value.value,
        availability: value.availability,
        quality: value.quality,
      }),
    ]),
  );
  return Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    inputEpoch: input.inputEpoch,
    acceptedRevision: input.acceptedRevision,
    acceptedTimeSec: input.acceptedTimeSec,
    outputs: Object.freeze(outputs),
  });
}

function sameBytesV3(left: Uint8Array, right: Uint8Array): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export type { MainWireIntegratedModelCheckpointV3 };
