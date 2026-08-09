import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V1_ID } from
  "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import {
  buildMainWireIntegratedModelGuytonStarlingOrientationV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
  type MainWireIntegratedModelHemodynamicResearchInputKeyV3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
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
  runMainWireIntegratedModelFormalPressureVolumeProtocolV3,
  runMainWireIntegratedModelResponsiveStarlingProtocolV3,
  type MainWireIntegratedModelResponsiveStarlingPartitionV3,
} from "@/engine/myocardium/MainWireIntegratedModelResponsiveStarlingProtocolV3";
import { MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID } from
  "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  admitMainWireIntegratedModelSnapshotV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelSnapshotAdmissionV3";
import {
  MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_CONTRACTILITY_SCALE_RANGE_V1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  ExperimentCaptureResultV2,
  ExperimentSnapshotAdmissionResultV2,
} from "@/studio/contracts/v2/authoring";
import type {
  ExperimentContentV2,
  ScenarioCaptureV2,
  ScenarioCheckpointV2,
} from "@/studio/contracts/v2/content";
import type { RegisteredModelExecutableBundleV2 } from
  "@/studio/contracts/v2/executable";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type {
  ControlDefinitionV2,
  MetricOutputDefinitionV2,
  ModelContractV2,
  SignalOutputDefinitionV2,
} from "@/studio/contracts/v2/model";
import { studioNumericControlValueIssueV2 } from
  "@/studio/contracts/v2/control";
import {
  STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
  STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID,
  assertExactModelKernelManifestV3,
  type ExactModelKernelManifestV3,
} from "@/studio/contracts/v2/modelSurface";
import type { StudioControlActionV2, StudioFixturePatchV2 } from
  "@/studio/contracts/v2/runtime";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  validateAndOwnStudioSimulationPortableJsonV2,
} from "@/studio/contracts/v2/simulation";
import {
  cloneAndFreezeStudioJson,
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
} from "./MainWireIntegratedStudioModelIdentityV3";

export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1 =
  "circleheart.main-wire-integrated-v3-regular-sinus-all-off-fixture.standard-v1" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1 =
  "circleheart.main-wire-integrated-v3-studio-checkpoint-codec.standard-v2" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_HOT_PATH_INTEGRITY_TIER_V1 =
  "hot-path-lean" as const;

export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1 =
  Object.freeze({
    systemicResistance: "hemodynamics.systemic-resistance",
    pulmonaryResistance: "hemodynamics.pulmonary-resistance",
    venousTone: "hemodynamics.venous-tone",
    arterialStiffness: "hemodynamics.arterial-stiffness",
    heartRateBpm: "rhythm.heart-rate-bpm",
    totalBloodVolumeMl: "hemodynamics.total-blood-volume-ml",
    peepCmH2O: "ventilation.peep-cm-h2o",
    ventricularContractilityScale: "myocardium.contractility",
  } as const);

export type MainWireIntegratedStudioStandardFixtureV1 = Readonly<{
  schemaId: typeof MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1;
  rhythm: Readonly<{ mode: "regular-sinus-v3" }>;
  coronary: Readonly<{ diseaseProfile: "normal-coronary-v2" }>;
  dynamicMechanicalSupport: Readonly<{
    mode: "all-off-zero-inertance-v3";
  }>;
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3;
  ventricularContractilityScale: number;
}>;

export type MainWireIntegratedStudioStandardExactReleaseV1 = Readonly<{
  manifest: ExactModelKernelManifestV3;
  executables: RegisteredModelExecutableBundleV2;
}>;

export type MainWireIntegratedStudioStandardAbsoluteControlAssignmentV1 =
  Readonly<{ controlId: string; value: number }>;

export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1:
MainWireIntegratedStudioStandardFixtureV1 = Object.freeze({
  schemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
  rhythm: Object.freeze({ mode: "regular-sinus-v3" }),
  coronary: Object.freeze({ diseaseProfile: "normal-coronary-v2" }),
  dynamicMechanicalSupport: Object.freeze({
    mode: "all-off-zero-inertance-v3",
  }),
  hemodynamicResearchInputs:
    MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  ventricularContractilityScale:
    MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_CONTRACTILITY_SCALE_RANGE_V1.defaultValue,
});

type RuntimeScenarioV1 = {
  fixture: MainWireIntegratedStudioStandardFixtureV1;
  inputEpoch: number;
  modelSession: MainWireIntegratedModelSessionV3;
  presentationOriginSec: number;
  presentationOrdinal: number;
};

type RuntimeSessionV1 = {
  scenarios: Map<string, RuntimeScenarioV1>;
};

const STANDARD_CONTROL_INPUT_KEYS_V1 = Object.freeze(
  Object.entries(MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1)
    .filter(([key]) => key !== "ventricularContractilityScale")
    .map(([key, controlId]) => Object.freeze({
      inputKey: key as MainWireIntegratedModelHemodynamicResearchInputKeyV3,
      controlId,
    })),
);

const STANDARD_PRIMITIVE_SIGNAL_DEFINITIONS_V1 = Object.freeze(
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3
    .filter((definition) => definition.kind === "signal")
    .map((definition): SignalOutputDefinitionV2 => Object.freeze({
      outputId: definition.outputId,
      kind: "signal",
      unit: definition.unit,
      shape: "scalar",
      sampling: "accepted-step",
    })),
);

const STANDARD_PRIMITIVE_SIGNAL_IDS_V1 = new Set(
  STANDARD_PRIMITIVE_SIGNAL_DEFINITIONS_V1.map(({ outputId }) => outputId),
);

const STANDARD_MODEL_METRIC_DEFINITIONS_V1 = Object.freeze(
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3
    .filter((definition) => definition.kind === "metric")
    .map((definition): MetricOutputDefinitionV2 => Object.freeze({
      outputId: definition.outputId,
      kind: "metric",
      unit: definition.unit,
      shape: "scalar",
      scope: "beat",
      dependencies: Object.freeze([...(definition.dependencies ?? [])]),
    })),
);

const STANDARD_EXACT_OUTPUT_IDS_V1 = new Set([
  ...STANDARD_PRIMITIVE_SIGNAL_IDS_V1,
  ...STANDARD_MODEL_METRIC_DEFINITIONS_V1.map(({ outputId }) => outputId),
]);

/** Standard numerical runtime. Legacy development-36 remains artifact-only. */
export class MainWireIntegratedStudioStandardRuntimeHostV1 {
  readonly #sessions = new Map<string, RuntimeSessionV1>();
  readonly #retiredSessionIds = new Set<string>();

  async createSession(
    runtimeSessionId: string,
    scenarioInputs: readonly Readonly<{
      scenarioId: string;
      fixture: StudioJsonValueV2;
      checkpoint?: ScenarioCheckpointV2;
    }>[],
  ): Promise<void> {
    requiredIdV1(runtimeSessionId, "runtimeSessionId");
    if (
      this.#sessions.has(runtimeSessionId)
      || this.#retiredSessionIds.has(runtimeSessionId)
    ) {
      throw new Error(`Standard runtime session ID is active or retired: ${runtimeSessionId}`);
    }
    if (scenarioInputs.length === 0) {
      throw new Error("Standard runtime session requires at least one Scenario");
    }
    const scenarios = new Map<string, RuntimeScenarioV1>();
    for (const input of scenarioInputs) {
      requiredIdV1(input.scenarioId, "scenarioId");
      if (scenarios.has(input.scenarioId)) {
        throw new Error(`duplicate Standard runtime Scenario: ${input.scenarioId}`);
      }
      const fixture = validateAndOwnStandardFixtureV1(input.fixture);
      const checkpoint = input.checkpoint === undefined
        ? undefined
        : validateScenarioCheckpointV1(input.checkpoint);
      const modelSession = checkpoint === undefined
        ? await MainWireIntegratedModelSessionV3.create(
            fixture.hemodynamicResearchInputs,
            fixture.ventricularContractilityScale,
          )
        : await MainWireIntegratedModelSessionV3.restoreStandardExactCheckpoint(
            checkpoint.payload,
            fixture.hemodynamicResearchInputs,
            fixture.ventricularContractilityScale,
          );
      if (
        checkpoint !== undefined
        && (
          modelSession.currentAcceptedState().revision
            !== checkpoint.acceptedRevision
          || modelSession.currentAcceptedState().acceptedTimeSec
            !== checkpoint.acceptedTimeSec
        )
      ) {
        throw new Error(`Standard Scenario ${input.scenarioId} checkpoint clock mismatch`);
      }
      scenarios.set(input.scenarioId, {
        fixture,
        inputEpoch: 0,
        modelSession,
        presentationOriginSec: modelSession.currentAcceptedState().acceptedTimeSec,
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

  currentFrame(runtimeSessionId: string, scenarioId: string): StudioSimulationFrameV2 {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const observation = scenario.modelSession.observe();
    const accepted = observation.acceptedState;
    return standardFrameV1({
      runtimeSessionId,
      scenarioId,
      inputEpoch: scenario.inputEpoch,
      acceptedRevision: accepted.revision,
      acceptedTimeSec: accepted.acceptedTimeSec,
      projected: projectMainWireIntegratedModelObservationV3(observation),
    });
  }

  advanceOnePresentationStep(
    runtimeSessionId: string,
    scenarioId: string,
  ): StudioSimulationFrameV2 {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const nextOrdinal = scenario.presentationOrdinal + 1;
    const targetTimeSec = scenario.presentationOriginSec
      + mainWireIntegratedModelPresentationTargetTimeSecV3(nextOrdinal);
    const advance = scenario.modelSession.advanceToPresentationTime(targetTimeSec);
    if (advance.status !== "advanced") {
      throw new Error(advanceFailureMessageV1(advance));
    }
    scenario.presentationOrdinal = nextOrdinal;
    return standardFrameV1({
      runtimeSessionId,
      scenarioId,
      inputEpoch: scenario.inputEpoch,
      acceptedRevision: advance.acceptedRevision,
      acceptedTimeSec: advance.acceptedTimeSec,
      projected: projectMainWireIntegratedModelAdvancedFrameV3(advance),
    });
  }

  async applyControl(
    runtimeSessionId: string,
    scenarioId: string,
    controlId: string,
    value: number,
    expectedInputEpoch: number,
  ): Promise<StudioSimulationFrameV2> {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (scenario.inputEpoch !== expectedInputEpoch) {
      throw new Error(
        `Standard control input epoch is stale: expected ${expectedInputEpoch}, current ${scenario.inputEpoch}`,
      );
    }
    const fixture = applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
      scenario.fixture,
      [Object.freeze({ controlId, value })],
    );
    return this.#warmStartFixtureAtomically(
      runtimeSessionId,
      scenarioId,
      fixture,
      expectedInputEpoch,
    );
  }

  async replaceFixture(
    runtimeSessionId: string,
    scenarioId: string,
    fixtureValue: StudioJsonValueV2,
  ): Promise<number> {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    await this.#warmStartFixtureAtomically(
      runtimeSessionId,
      scenarioId,
      validateAndOwnStandardFixtureV1(fixtureValue),
      scenario.inputEpoch,
    );
    return scenario.inputEpoch;
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
      scenario.inputEpoch !== expectedInputEpoch
      || accepted.revision !== expectedAcceptedRevision
      || accepted.acceptedTimeSec !== expectedAcceptedTimeSec
    ) {
      throw new Error("Standard analysis source clocks are stale");
    }
    if (
      analysisId !== MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID
      && analysisId
        !== MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
    ) {
      throw new Error(`Standard exact model analysis is not registered: ${analysisId}`);
    }
    const responsivePartition:
      MainWireIntegratedModelResponsiveStarlingPartitionV3 | undefined =
      analysisPartition === undefined
        ? undefined
        : analysisPartition
            === MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3
          || analysisPartition
            === MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3
          ? analysisPartition
          : (() => {
              throw new Error(
                `Standard analysis partition is not registered: ${analysisPartition}`,
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
        "$.mainWireIntegratedStandardAnalysis.payload",
      );
      return Object.freeze({
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
        runtimeSessionId,
        scenarioId,
        inputEpoch: scenario.inputEpoch,
        sourceAcceptedRevision: accepted.revision,
        sourceAcceptedTimeSec: accepted.acceptedTimeSec,
        analysisId,
        payload,
      });
    };
    const starling = analysisId
        === MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
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

  async captureDesiredContent(input: Readonly<{
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
  }>): Promise<ExperimentCaptureResultV2> {
    assertStandardModelV1(input.model);
    if (input.desiredContent.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1) {
      throw new Error("Standard capture desired modelId mismatch");
    }
    const runtime = this.#requiredSession(input.correlation.runtimeSessionId);
    if (input.desiredContent.scenarios.length !== input.correlation.scenarios.length) {
      throw new Error("Standard capture Scenario correlation length mismatch");
    }
    const candidates = input.desiredContent.scenarios.map((desired, index) => {
      const correlation = input.correlation.scenarios[index];
      if (correlation?.scenarioId !== desired.scenarioId) {
        throw new Error("Standard capture Scenario order mismatch");
      }
      const current = runtime.scenarios.get(desired.scenarioId);
      if (current === undefined) {
        throw new Error(`Standard capture Scenario not found: ${desired.scenarioId}`);
      }
      const desiredFixture = validateAndOwnStandardFixtureV1(desired.fixture);
      if (studioCanonicalJsonStringify(current.fixture)
        !== studioCanonicalJsonStringify(desiredFixture)) {
        throw new Error(`Standard capture fixture is stale: ${desired.scenarioId}`);
      }
      if (current.inputEpoch !== correlation.expectedInputEpoch) {
        throw new Error(`Standard capture input epoch is stale: ${desired.scenarioId}`);
      }
      return Object.freeze({ desired, correlation, current });
    });
    const payloads = await Promise.all(
      candidates.map(({ current }) => current.modelSession.checkpointStandardExact()),
    );
    const scenarios = candidates.map(({ desired, correlation, current }, index) => {
      if (current.inputEpoch !== correlation.expectedInputEpoch) {
        throw new Error(`Standard capture changed while freezing: ${desired.scenarioId}`);
      }
      const payload = payloads[index]!;
      return Object.freeze({
        scenarioId: desired.scenarioId,
        label: desired.label,
        capture: Object.freeze({
          fixture: current.fixture,
          checkpoint: Object.freeze({
            acceptedRevision: payload.revision,
            acceptedTimeSec: payload.acceptedTimeSec,
            payload: cloneAndFreezeStudioJson(payload),
          }),
        }),
      });
    });
    return Object.freeze({
      content: Object.freeze({
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
        scenarios: Object.freeze(scenarios),
        surface: input.desiredContent.surface,
      }),
      confirmation: Object.freeze({
        experimentId: input.experimentId,
        runtimeSessionId: input.correlation.runtimeSessionId,
        scenarios: Object.freeze(input.correlation.scenarios.map((value) =>
          Object.freeze({ ...value }))),
      }),
    });
  }

  #requiredSession(runtimeSessionId: string): RuntimeSessionV1 {
    const session = this.#sessions.get(runtimeSessionId);
    if (session === undefined) {
      throw new Error(`Standard runtime session not found: ${runtimeSessionId}`);
    }
    return session;
  }

  #requiredScenario(runtimeSessionId: string, scenarioId: string): RuntimeScenarioV1 {
    const scenario = this.#requiredSession(runtimeSessionId).scenarios.get(scenarioId);
    if (scenario === undefined) {
      throw new Error(`Standard runtime Scenario not found: ${runtimeSessionId}/${scenarioId}`);
    }
    return scenario;
  }

  async #warmStartFixtureAtomically(
    runtimeSessionId: string,
    scenarioId: string,
    fixture: MainWireIntegratedStudioStandardFixtureV1,
    expectedInputEpoch: number,
  ): Promise<StudioSimulationFrameV2> {
    const original = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (original.inputEpoch !== expectedInputEpoch) {
      throw new Error("Standard fixture warm start input epoch is stale");
    }
    const candidate = await original.modelSession.warmStartWithHemodynamicResearchInputs(
      fixture.hemodynamicResearchInputs,
      fixture.ventricularContractilityScale,
    );
    const accepted = candidate.currentAcceptedState();
    const sourceAccepted = original.modelSession.currentAcceptedState();
    if (
      accepted.revision !== sourceAccepted.revision
      || accepted.acceptedTimeSec !== sourceAccepted.acceptedTimeSec
    ) {
      throw new Error("Standard fixture warm start changed the accepted clock");
    }
    const current = this.#requiredScenario(runtimeSessionId, scenarioId);
    if (current !== original || current.inputEpoch !== expectedInputEpoch) {
      throw new Error("Standard fixture warm start became stale before swap");
    }
    current.fixture = fixture;
    current.modelSession = candidate;
    current.presentationOriginSec = accepted.acceptedTimeSec;
    current.presentationOrdinal = 0;
    current.inputEpoch += 1;
    return this.currentFrame(runtimeSessionId, scenarioId);
  }
}

export function createCircleHeartExactModelReleaseV1():
MainWireIntegratedStudioStandardExactReleaseV1 {
  const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
  return Object.freeze({
    manifest: createMainWireIntegratedStudioExactKernelV1(),
    executables: standardExecutableBundleV1(host),
  });
}

export function createMainWireIntegratedStudioExactKernelV1():
ExactModelKernelManifestV3 {
  const primitiveControlCatalog = standardControlCatalogV1();
  const manifest: ExactModelKernelManifestV3 = Object.freeze({
    schemaId: STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID,
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    modelFamilyId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
    equations: Object.freeze({
      transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
      coronaryOwner: "main-wire-five-wall-coronary-transaction-v3",
      rhythmOwner: "accepted-composed-rhythm-transaction-v2",
      dynamicMechanicalSupportOwner:
        "circleheart-dynamic-mechanical-support-network-v1",
      ventricularContractilityOwner:
        "land-2017-tref-global-lvfw-sep-rvfw-scale-v1",
    }),
    runtime: Object.freeze({
      numericalSessionId: MAIN_WIRE_INTEGRATED_MODEL_SESSION_V3_ID,
      presentationDtSec: MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_DT_SEC_V3,
      hotPathIntegrityTier:
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_HOT_PATH_INTEGRITY_TIER_V1,
      acceptedBoundaryCapture: true,
      fixtureChangeSemantics:
        "atomic-accepted-state-warm-start-same-clock-new-fixture-epoch",
      scope:
        "regular-sinus-normal-coronary-all-off-zero-inertance-with-bounded-standard-controls",
    }),
    solver: Object.freeze({
      candidateSemantics:
        "event-limited-atomic-composed-rhythm-coronary-dynamic-mcs",
      acceptedStateMutation: false,
      failureRollback: "previous-accepted-tuple",
    }),
    fixtureSchema: Object.freeze({
      fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
      definition: Object.freeze({
        schemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
        exactKeys: Object.freeze([
          "schemaId",
          "rhythm",
          "coronary",
          "dynamicMechanicalSupport",
          "hemodynamicResearchInputs",
          "ventricularContractilityScale",
        ]),
        hemodynamicResearchInputRanges:
          MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
        ventricularContractilityScaleRange:
          MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_CONTRACTILITY_SCALE_RANGE_V1,
      }),
    }),
    checkpointCodec: Object.freeze({
      checkpointCodecId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1,
      definition: Object.freeze({
        checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V1_ID,
        schemaVersion: 1,
        fixturePairing:
          "regular-sinus-all-off-and-complete-standard-fixture-identity",
        restoreSemantics: "exact-no-migration-no-clock-rebase",
      }),
    }),
    primitiveControlCatalog,
    primitiveSignalCatalog: STANDARD_PRIMITIVE_SIGNAL_DEFINITIONS_V1,
    modelMetricCatalog: STANDARD_MODEL_METRIC_DEFINITIONS_V1,
    capabilities: Object.freeze([
      ...primitiveControlCatalog.map(({ controlId }) => `control/${controlId}`),
      ...STANDARD_PRIMITIVE_SIGNAL_DEFINITIONS_V1
        .map(({ outputId }) => `output/${outputId}`),
      ...STANDARD_MODEL_METRIC_DEFINITIONS_V1
        .map(({ outputId }) => `output/${outputId}`),
      `analysis/${MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID}`,
      `analysis/${MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID}`,
    ]),
  });
  assertExactModelKernelManifestV3(manifest);
  return manifest;
}

export function applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
  fixture: MainWireIntegratedStudioStandardFixtureV1,
  assignments: readonly MainWireIntegratedStudioStandardAbsoluteControlAssignmentV1[],
): MainWireIntegratedStudioStandardFixtureV1 {
  return assignments.reduce((current, assignment) => {
    const definition = requiredControlDefinitionV1(assignment.controlId);
    const issue = studioNumericControlValueIssueV2(assignment.value, definition);
    if (issue !== undefined) {
      throw new Error(`Standard control ${assignment.controlId} value ${issue}`);
    }
    if (
      assignment.controlId
      === MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1
        .ventricularContractilityScale
    ) {
      return validateAndOwnStandardFixtureV1({
        ...current,
        ventricularContractilityScale: assignment.value,
      });
    }
    const binding = STANDARD_CONTROL_INPUT_KEYS_V1.find(
      ({ controlId }) => controlId === assignment.controlId,
    );
    if (binding === undefined) {
      throw new Error(`Standard control is not registered: ${assignment.controlId}`);
    }
    return validateAndOwnStandardFixtureV1({
      ...current,
      hemodynamicResearchInputs: {
        ...current.hemodynamicResearchInputs,
        [binding.inputKey]: assignment.value,
      },
    });
  }, validateAndOwnStandardFixtureV1(fixture));
}

function standardExecutableBundleV1(
  host: MainWireIntegratedStudioStandardRuntimeHostV1,
): RegisteredModelExecutableBundleV2 {
  const captureAdapter = Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
    checkpointCodecId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1,
    validateFixture(input: Readonly<{ model: ModelContractV2; fixture: StudioJsonValueV2 }>) {
      assertStandardModelV1(input.model);
      validateAndOwnStandardFixtureV1(input.fixture);
      return undefined;
    },
    async validateCapture(input: Readonly<{
      model: ModelContractV2;
      capture: ScenarioCaptureV2;
    }>): Promise<void> {
      assertStandardModelV1(input.model);
      const fixture = validateAndOwnStandardFixtureV1(input.capture.fixture);
      const checkpoint = validateScenarioCheckpointV1(input.capture.checkpoint);
      const restored = await MainWireIntegratedModelSessionV3
        .restoreStandardExactCheckpoint(
          checkpoint.payload,
          fixture.hemodynamicResearchInputs,
          fixture.ventricularContractilityScale,
        );
      const accepted = restored.currentAcceptedState();
      if (
        accepted.revision !== checkpoint.acceptedRevision
        || accepted.acceptedTimeSec !== checkpoint.acceptedTimeSec
      ) {
        throw new Error("Standard exact checkpoint restore clock mismatch");
      }
      const roundTrip = await restored.checkpointStandardExact();
      if (studioCanonicalJsonStringify(roundTrip)
        !== studioCanonicalJsonStringify(checkpoint.payload)) {
        throw new Error("Standard exact checkpoint restore is not canonical");
      }
    },
  });
  const fixtureAdapter = Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
    validateCompleteFixture(input: Readonly<{
      context: Readonly<{ scenarioId: string; modelId: string }>;
      fixture: StudioJsonValueV2;
    }>) {
      assertRuntimeContextV1(input.context);
      validateAndOwnStandardFixtureV1(input.fixture);
      return undefined;
    },
    reduceControlAction(input: Readonly<{
      context: Readonly<{ scenarioId: string; modelId: string }>;
      fixture: StudioJsonValueV2;
      action: StudioControlActionV2;
    }>): StudioFixturePatchV2 {
      assertRuntimeContextV1(input.context);
      const fixture = validateAndOwnStandardFixtureV1(input.fixture);
      const next = applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        fixture,
        [input.action],
      );
      const contractility = input.action.controlId
        === MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1
          .ventricularContractilityScale;
      const binding = STANDARD_CONTROL_INPUT_KEYS_V1.find(
        ({ controlId }) => controlId === input.action.controlId,
      );
      return Object.freeze({
        changes: Object.freeze([Object.freeze({
          path: contractility
            ? Object.freeze(["ventricularContractilityScale"] as const)
            : Object.freeze([
                "hemodynamicResearchInputs",
                binding!.inputKey,
              ] as const),
          value: contractility
            ? next.ventricularContractilityScale
            : next.hemodynamicResearchInputs[binding!.inputKey],
        })]),
      });
    },
  });
  const simulationAdapter = Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
    checkpointCodecId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1,
    createSession: (input: Readonly<{
      runtimeSessionId: string;
      scenarios: readonly Readonly<{
        scenarioId: string;
        fixture: StudioJsonValueV2;
        checkpoint?: ScenarioCheckpointV2;
      }>[];
    }>) => host.createSession(input.runtimeSessionId, input.scenarios),
    disposeSession: (runtimeSessionId: string) => host.closeSession(runtimeSessionId),
    currentFrame: (input: Readonly<{ runtimeSessionId: string; scenarioId: string }>) =>
      host.currentFrame(input.runtimeSessionId, input.scenarioId),
    advanceOnePresentationStep: async (
      input: Readonly<{ runtimeSessionId: string; scenarioId: string }>,
    ) => host.advanceOnePresentationStep(input.runtimeSessionId, input.scenarioId),
    applyControl: async (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
      controlId: string;
      value: number;
      expectedInputEpoch: number;
    }>) => host.applyControl(
      input.runtimeSessionId,
      input.scenarioId,
      input.controlId,
      input.value,
      input.expectedInputEpoch,
    ),
    requestAnalysis: (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
      analysisId: string;
      expectedInputEpoch: number;
      expectedAcceptedRevision: number;
      expectedAcceptedTimeSec: number;
      analysisPartition?: string;
      onProgress?: (analysis: StudioSimulationAnalysisV2) => void;
    }>) => host.requestAnalysis(
      input.runtimeSessionId,
      input.scenarioId,
      input.analysisId,
      input.expectedInputEpoch,
      input.expectedAcceptedRevision,
      input.expectedAcceptedTimeSec,
      input.analysisPartition,
      input.onProgress,
    ),
    replaceFixture: (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
      fixture: StudioJsonValueV2;
    }>) => host.replaceFixture(
      input.runtimeSessionId,
      input.scenarioId,
      input.fixture,
    ),
    currentInputEpoch: (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
    }>) => host.currentInputEpoch(input.runtimeSessionId, input.scenarioId),
  });
  return Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
    checkpointCodecId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1,
    snapshotGateId: STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
    captureAdapter,
    experimentCapture: Object.freeze({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
      fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
      checkpointCodecId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1,
      captureAcceptedCandidate: host.captureDesiredContent.bind(host),
    }),
    snapshotGate: Object.freeze({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
      snapshotGateId: STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
      async admitFrozenCandidate(input: Readonly<{
        model: ModelContractV2;
        content: ExperimentContentV2;
      }>): Promise<ExperimentSnapshotAdmissionResultV2> {
        assertStandardModelV1(input.model);
        if (input.content.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1) {
          return Object.freeze({ status: "rejected", reason: "content modelId mismatch" });
        }
        for (const scenario of input.content.scenarios) {
          await captureAdapter.validateCapture({
            model: input.model,
            capture: scenario.capture,
          });
          const fixture = validateAndOwnStandardFixtureV1(scenario.capture.fixture);
          const admission = await admitMainWireIntegratedModelSnapshotV3({
            candidateCheckpoint: scenario.capture.checkpoint.payload,
            hemodynamicResearchInputs: fixture.hemodynamicResearchInputs,
            ventricularContractilityScale:
              fixture.ventricularContractilityScale,
          });
          if (admission.status !== "accepted") {
            return Object.freeze({
              status: "rejected",
              reason: `${scenario.scenarioId}: ${admission.reason}`,
            });
          }
        }
        return Object.freeze({ status: "passed" });
      },
    }),
    fixtureAdapter,
    simulationAdapter,
  });
}

function standardControlCatalogV1(): readonly ControlDefinitionV2[] {
  return Object.freeze([
    ...STANDARD_CONTROL_INPUT_KEYS_V1.map(({ inputKey, controlId }) => {
      const range = MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3[inputKey];
      return Object.freeze({
        controlId,
        valueType: "number" as const,
        unit: standardUnitV1(inputKey),
        minimum: range.minimum,
        maximum: range.maximum,
        step: range.step,
        defaultValue:
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3[inputKey],
        changeSemantics: "accepted-state-warm-start" as const,
      });
    }),
    Object.freeze({
      controlId:
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1
          .ventricularContractilityScale,
      valueType: "number" as const,
      unit: "1",
      minimum:
        MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_CONTRACTILITY_SCALE_RANGE_V1.minimum,
      maximum:
        MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_CONTRACTILITY_SCALE_RANGE_V1.maximum,
      step: 0.01,
      defaultValue:
        MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_CONTRACTILITY_SCALE_RANGE_V1.defaultValue,
      changeSemantics: "accepted-state-warm-start" as const,
    }),
  ]);
}

function requiredControlDefinitionV1(controlId: string): ControlDefinitionV2 {
  const matches = standardControlCatalogV1()
    .filter((definition) => definition.controlId === controlId);
  if (matches.length !== 1) {
    throw new Error(`Standard control is not registered: ${controlId}`);
  }
  return matches[0]!;
}

function standardUnitV1(
  inputKey: MainWireIntegratedModelHemodynamicResearchInputKeyV3,
): string {
  switch (inputKey) {
    case "heartRateBpm": return "bpm";
    case "totalBloodVolumeMl": return "mL";
    case "peepCmH2O": return "cmH2O";
    default: return "1";
  }
}

function validateAndOwnStandardFixtureV1(
  value: unknown,
): MainWireIntegratedStudioStandardFixtureV1 {
  const record = exactRecordV1(value, [
    "coronary",
    "dynamicMechanicalSupport",
    "hemodynamicResearchInputs",
    "rhythm",
    "schemaId",
    "ventricularContractilityScale",
  ], "Standard fixture");
  if (record.schemaId !== MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1) {
    throw new Error("Standard fixture schemaId mismatch");
  }
  exactLiteralRecordV1(record.rhythm, "mode", "regular-sinus-v3", "rhythm");
  exactLiteralRecordV1(
    record.coronary,
    "diseaseProfile",
    "normal-coronary-v2",
    "coronary",
  );
  exactLiteralRecordV1(
    record.dynamicMechanicalSupport,
    "mode",
    "all-off-zero-inertance-v3",
    "dynamicMechanicalSupport",
  );
  const hemodynamicResearchInputs =
    validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
      record.hemodynamicResearchInputs,
    );
  const contractility = record.ventricularContractilityScale;
  if (typeof contractility !== "number") {
    throw new Error(
      "Standard fixture ventricularContractilityScale must be a number",
    );
  }
  const contractilityDefinition = standardControlCatalogV1().at(-1)!;
  const issue = studioNumericControlValueIssueV2(
    contractility,
    contractilityDefinition,
  );
  if (issue !== undefined) {
    throw new Error(`Standard fixture ventricularContractilityScale ${issue}`);
  }
  return Object.freeze({
    schemaId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1,
    rhythm: Object.freeze({ mode: "regular-sinus-v3" }),
    coronary: Object.freeze({ diseaseProfile: "normal-coronary-v2" }),
    dynamicMechanicalSupport: Object.freeze({
      mode: "all-off-zero-inertance-v3",
    }),
    hemodynamicResearchInputs,
    ventricularContractilityScale: contractility as number,
  });
}

function validateScenarioCheckpointV1(value: unknown): ScenarioCheckpointV2 {
  const record = exactRecordV1(
    value,
    ["acceptedRevision", "acceptedTimeSec", "payload"],
    "Standard checkpoint",
  );
  if (!Number.isSafeInteger(record.acceptedRevision) || (record.acceptedRevision as number) < 0) {
    throw new Error("Standard checkpoint acceptedRevision is invalid");
  }
  if (!Number.isFinite(record.acceptedTimeSec) || (record.acceptedTimeSec as number) < 0) {
    throw new Error("Standard checkpoint acceptedTimeSec is invalid");
  }
  const payload = cloneAndFreezeStudioJson<StudioJsonValueV2>(record.payload);
  const payloadRecord = payload as Record<string, unknown>;
  if (
    payloadRecord.revision !== record.acceptedRevision
    || payloadRecord.acceptedTimeSec !== record.acceptedTimeSec
  ) {
    throw new Error("Standard checkpoint wrapper and payload clocks differ");
  }
  return Object.freeze({
    acceptedRevision: record.acceptedRevision as number,
    acceptedTimeSec: record.acceptedTimeSec as number,
    payload,
  });
}

function standardFrameV1(input: Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
  inputEpoch: number;
  acceptedRevision: number;
  acceptedTimeSec: number;
  projected: ReturnType<typeof projectMainWireIntegratedModelObservationV3>;
}>): StudioSimulationFrameV2 {
  const outputs = Object.fromEntries(
    Object.values(input.projected.values)
      .filter(({ outputId }) => STANDARD_EXACT_OUTPUT_IDS_V1.has(outputId))
      .map((value) => [value.outputId, Object.freeze({
        outputId: value.outputId,
        value: value.value,
        availability: value.availability,
        quality: value.quality,
      })]),
  );
  return Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    inputEpoch: input.inputEpoch,
    acceptedRevision: input.acceptedRevision,
    acceptedTimeSec: input.acceptedTimeSec,
    outputs: Object.freeze(outputs),
  });
}

function assertStandardModelV1(model: ModelContractV2): void {
  if (
    model.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1
    || model.fixtureSchemaId
      !== MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_FIXTURE_SCHEMA_ID_V1
    || model.checkpointCodecId
      !== MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CHECKPOINT_CODEC_ID_V1
    || model.snapshotGateId !== STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1
  ) {
    throw new Error("Main Wire Standard exact model contract mismatch");
  }
}

function assertRuntimeContextV1(
  context: Readonly<{ scenarioId: string; modelId: string }>,
): void {
  if (context.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1) {
    throw new Error("Standard fixture runtime modelId mismatch");
  }
  requiredIdV1(context.scenarioId, "scenarioId");
}

function requiredIdV1(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/.test(value)) {
    throw new Error(`Standard ${label} is invalid`);
  }
}

function exactRecordV1(
  value: unknown,
  expectedKeys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`${label} must be a plain object`);
  }
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [...expectedKeys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} keys must be exactly ${expected.join(", ")}`);
  }
  return record;
}

function exactLiteralRecordV1(
  value: unknown,
  key: string,
  literal: string,
  label: string,
): void {
  const record = exactRecordV1(value, [key], `Standard fixture ${label}`);
  if (record[key] !== literal) {
    throw new Error(`Standard fixture ${label}.${key} mismatch`);
  }
}

function advanceFailureMessageV1(
  advance: Exclude<
    MainWireIntegratedModelPresentationAdvanceV3,
    { status: "advanced" }
  >,
): string {
  return advance.status === "failed"
    ? `Standard presentation step failed: ${advance.reason}: ${advance.message}`
    : "Standard presentation step did not advance";
}
