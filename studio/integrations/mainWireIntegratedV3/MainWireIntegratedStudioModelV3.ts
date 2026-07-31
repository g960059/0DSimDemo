import {
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
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
  MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_V3_ID,
  qualifyMainWireIntegratedModelSnapshotV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelSnapshotQualificationV3";
import type {
  ExperimentDraftCaptureResultV2,
  ExperimentSnapshotGateResultV2,
} from "@/studio/contracts/v2/authoring";
import type {
  ExperimentContentV2,
  ScenarioCaptureV2,
  ScenarioCheckpointV2,
} from "@/studio/contracts/v2/content";
import type {
  RegisteredModelExecutableBundleV2,
} from "@/studio/contracts/v2/executable";
import {
  STUDIO_REGISTERED_MODEL_PACKAGE_V2_SCHEMA_ID,
  type ModelContractV2,
  type RegisteredModelPackageManifestV2,
} from "@/studio/contracts/v2/model";
import type {
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import type {
  StudioJsonValueV2,
} from "@/studio/contracts/v2/json";
import {
  cloneAndFreezeStudioJson,
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";
import type {
  RegisterExactModelPackageInputV2,
} from "@/studio/infrastructure/model/InMemoryRegisteredModelStoreV2";

export const MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3 =
  "circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.development-1" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3 =
  "circleheart.main-wire-integrated-transaction" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3 =
  "circleheart.main-wire-integrated-v3-regular-sinus-all-off-fixture.v3" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3 =
  "circleheart.main-wire-integrated-v3-studio-checkpoint-codec.v3" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_SNAPSHOT_GATE_ID_V3 =
  MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_V3_ID;

export type MainWireIntegratedStudioFixtureV3 = Readonly<{
  schemaId: typeof MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3;
  rhythm: Readonly<{ mode: "regular-sinus-v3" }>;
  coronary: Readonly<{ diseaseProfile: "normal-coronary-v2" }>;
  dynamicMechanicalSupport: Readonly<{
    mode: "all-off-zero-inertance-v3";
  }>;
}>;

export const MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3:
MainWireIntegratedStudioFixtureV3 = Object.freeze({
  schemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
  rhythm: Object.freeze({ mode: "regular-sinus-v3" }),
  coronary: Object.freeze({ diseaseProfile: "normal-coronary-v2" }),
  dynamicMechanicalSupport: Object.freeze({
    mode: "all-off-zero-inertance-v3",
  }),
});

export type MainWireIntegratedStudioLiveScenarioInputV3 = Readonly<{
  scenarioId: string;
  fixture: StudioJsonValueV2;
  checkpoint?: ScenarioCheckpointV2;
}>;

export type MainWireIntegratedStudioLiveFrameV3 = StudioSimulationFrameV2;

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
 * output frames never enter Workspace or Snapshot content.
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
      this.#sessions.has(runtimeSessionId)
      || this.#retiredSessionIds.has(runtimeSessionId)
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
      const modelSession = input.checkpoint === undefined
        ? await MainWireIntegratedModelSessionV3.create()
        : await MainWireIntegratedModelSessionV3.restoreOperationalCheckpoint(
          validateScenarioCheckpointV3(input.checkpoint).payload,
        );
      if (
        input.checkpoint !== undefined
        && (
          modelSession.currentAcceptedState().revision
            !== input.checkpoint.acceptedRevision
          || modelSession.currentAcceptedState().acceptedTimeSec
            !== input.checkpoint.acceptedTimeSec
        )
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
    const presentationTimeSec = scenario.presentationOriginSec
      + mainWireIntegratedModelPresentationTargetTimeSecV3(
        nextPresentationOrdinal,
      );
    const advance = scenario.modelSession.advanceToPresentationTime(
      presentationTimeSec,
    );
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

  /**
   * Replaces the complete fixture at an accepted boundary. The action that
   * produced this fixture is already over; only the new fixture and epoch live
   * in runtime memory.
   */
  replaceFixture(
    runtimeSessionId: string,
    scenarioId: string,
    fixtureValue: StudioJsonValueV2,
  ): number {
    const scenario = this.#requiredScenario(runtimeSessionId, scenarioId);
    const fixture = validateAndOwnFixtureV3(fixtureValue);
    scenario.fixture = fixture;
    scenario.inputEpoch += 1;
    return scenario.inputEpoch;
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
  }>): Promise<ExperimentDraftCaptureResultV2> {
    assertExactModelV3(input.model);
    const runtimeSession = this.#requiredSession(
      input.correlation.runtimeSessionId,
    );
    if (
      input.desiredContent.scenarios.length
        !== input.correlation.scenarios.length
    ) {
      throw new Error("V3 Draft capture Scenario correlation length mismatch");
    }

    const captured = input.desiredContent.scenarios.map((desired, index) => {
      const expected = input.correlation.scenarios[index];
      if (expected?.scenarioId !== desired.scenarioId) {
        throw new Error("V3 Draft capture Scenario order mismatch");
      }
      const runtime = runtimeSession.scenarios.get(desired.scenarioId);
      if (runtime === undefined) {
        throw new Error(
          `V3 Draft capture Scenario not found: ${desired.scenarioId}`,
        );
      }
      const desiredFixture = validateAndOwnFixtureV3(desired.fixture);
      if (
        studioCanonicalJsonStringify(runtime.fixture)
          !== studioCanonicalJsonStringify(desiredFixture)
      ) {
        throw new Error(
          `V3 Draft capture fixture is not current for ${desired.scenarioId}`,
        );
      }
      if (runtime.inputEpoch !== expected.expectedInputEpoch) {
        throw new Error(
          `V3 Draft capture input epoch is stale for ${desired.scenarioId}`,
        );
      }
      return {
        desired,
        expectedInputEpoch: expected.expectedInputEpoch,
        runtime,
      };
    });

    const checkpoints = await Promise.all(captured.map(async ({ runtime }) =>
      runtime.modelSession.checkpointOperational()));

    const scenarios = captured.map((entry, index) => {
      if (
        entry.runtime.inputEpoch !== entry.expectedInputEpoch
        || studioCanonicalJsonStringify(entry.runtime.fixture)
          !== studioCanonicalJsonStringify(entry.desired.fixture)
      ) {
        throw new Error(
          `V3 Draft capture became stale for ${entry.desired.scenarioId}`,
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
        scenarios: Object.freeze(input.correlation.scenarios.map(
          ({ scenarioId, expectedInputEpoch }) => Object.freeze({
            scenarioId,
            expectedInputEpoch,
          }),
        )),
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
    const scenario = this.#requiredSession(runtimeSessionId)
      .scenarios.get(scenarioId);
    if (scenario === undefined) {
      throw new Error(
        `V3 runtime Scenario not found: ${runtimeSessionId}/${scenarioId}`,
      );
    }
    return scenario;
  }
}

export type MainWireIntegratedStudioModelPackageV3 = Readonly<{
  manifest: RegisteredModelPackageManifestV2;
  executables: RegisteredModelExecutableBundleV2;
  createRegistryAdmission(
    executableArtifact: Uint8Array,
  ): RegisterExactModelPackageInputV2;
  defaultFixture: MainWireIntegratedStudioFixtureV3;
}>;

export function createMainWireIntegratedStudioModelPackageV3():
MainWireIntegratedStudioModelPackageV3 {
  const runtimeHost = new MainWireIntegratedStudioRuntimeHostV3();
  const manifest = mainWireIntegratedStudioManifestV3();
  const executables = mainWireIntegratedExecutableBundleV3(runtimeHost);
  return Object.freeze({
    manifest,
    executables,
    createRegistryAdmission(executableArtifact: Uint8Array) {
      if (
        !(executableArtifact instanceof Uint8Array)
        || executableArtifact.byteLength === 0
      ) {
        throw new Error(
          "V3 registry admission requires nonempty exact build artifact bytes",
        );
      }
      const admittedArtifact = new Uint8Array(executableArtifact);
      return Object.freeze({
        manifest,
        executableArtifact: admittedArtifact,
        loadExecutables(candidate) {
          if (!sameBytesV3(candidate, admittedArtifact)) {
            throw new Error("V3 exact executable artifact bytes differ");
          }
          return executables;
        },
      });
    },
    defaultFixture: MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3,
  });
}

function mainWireIntegratedStudioManifestV3():
RegisteredModelPackageManifestV2 {
  const outputCatalog = MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.map(
    (output) => Object.freeze({
      outputId: output.outputId,
      kind: "signal" as const,
      unit: output.unit,
      shape: "scalar" as const,
      sampling: "accepted-step" as const,
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
      acceptedBoundaryCapture: true,
      runtimeFixtureCommands: Object.freeze([]),
      scope:
        "regular-sinus-normal-coronary-all-off-zero-inertance",
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
        ]),
        rhythmMode: "regular-sinus-v3",
        coronaryDiseaseProfile: "normal-coronary-v2",
        dynamicMechanicalSupportMode: "all-off-zero-inertance-v3",
      }),
    }),
    checkpointCodec: Object.freeze({
      checkpointCodecId:
        MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3,
      definition: Object.freeze({
        checkpointId: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
        schemaVersion: 3,
        fixturePairing:
          "canonical-regular-sinus-all-off-zero-inertance-context",
        restoreSemantics: "exact-no-migration-no-clock-rebase",
      }),
    }),
    snapshotGate: Object.freeze({
      snapshotGateId: MAIN_WIRE_INTEGRATED_STUDIO_SNAPSHOT_GATE_ID_V3,
      definition: Object.freeze({
        status: "candidate-periodic-qualification",
        acceptedOutcome: "period1-converged-only",
        qualificationId:
          MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_V3_ID,
        physiologicalValidationClaimed: false,
        clinicalValidationClaimed: false,
      }),
    }),
    catalogs: Object.freeze({
      parameterCatalog: Object.freeze([]),
      controlCatalog: Object.freeze([]),
      outputCatalog: Object.freeze(outputCatalog),
      graphCatalog: Object.freeze([
        Object.freeze({
          graphId: "hemodynamics.pressure.lv-aorta",
          outputIds: Object.freeze([
            "hemodynamics.pressure.absolute.LV",
            "hemodynamics.pressure.absolute.Ao",
          ]),
        }),
        Object.freeze({
          graphId: "coronary.flow.inlet-territories",
          outputIds: Object.freeze([
            "coronary.flow.inlet.LAD",
            "coronary.flow.inlet.LCx",
            "coronary.flow.inlet.RCA",
          ]),
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
    checkpointCodecId:
      MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3,
    validateFixture(input: Readonly<{
      model: ModelContractV2;
      fixture: StudioJsonValueV2;
    }>) {
      assertExactModelV3(input.model);
      validateAndOwnFixtureV3(input.fixture);
    },
    async validateCapture(input: Readonly<{
      model: ModelContractV2;
      capture: ScenarioCaptureV2;
    }>): Promise<void> {
      assertExactModelV3(input.model);
      validateAndOwnFixtureV3(input.capture.fixture);
      const checkpoint = validateScenarioCheckpointV3(
        input.capture.checkpoint,
      );
      const restored =
        await MainWireIntegratedModelSessionV3.restoreOperationalCheckpoint(
          checkpoint.payload,
        );
      const accepted = restored.currentAcceptedState();
      if (
        accepted.revision !== checkpoint.acceptedRevision
        || accepted.acceptedTimeSec !== checkpoint.acceptedTimeSec
      ) {
        throw new Error("V3 exact checkpoint restore clock mismatch");
      }
      const roundTrip = await restored.checkpointOperational();
      if (
        studioCanonicalJsonStringify(roundTrip)
          !== studioCanonicalJsonStringify(checkpoint.payload)
      ) {
        throw new Error("V3 exact checkpoint restore is not canonical");
      }
    },
  });
  const fixtureAdapter = Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
    validateCompleteFixture(input: Readonly<{
      context: Readonly<{ scenarioId: string; modelId: string }>;
      fixture: StudioJsonValueV2;
    }>) {
      if (input.context.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3) {
        throw new Error("V3 fixture runtime context modelId mismatch");
      }
      requiredId(input.context.scenarioId, "scenarioId");
      validateAndOwnFixtureV3(input.fixture);
    },
  });
  const simulationAdapter = Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
    checkpointCodecId:
      MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3,
    createSession(input: Readonly<{
      runtimeSessionId: string;
      scenarios: readonly MainWireIntegratedStudioLiveScenarioInputV3[];
    }>) {
      return runtimeHost.createSession(
        input.runtimeSessionId,
        input.scenarios,
      );
    },
    disposeSession(runtimeSessionId: string) {
      runtimeHost.closeSession(runtimeSessionId);
    },
    currentFrame(input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
    }>) {
      return runtimeHost.currentFrame(
        input.runtimeSessionId,
        input.scenarioId,
      );
    },
    async advanceOnePresentationStep(input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
    }>) {
      return runtimeHost.advanceOnePresentationStep(
        input.runtimeSessionId,
        input.scenarioId,
      );
    },
    async replaceFixture(input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
      fixture: StudioJsonValueV2;
    }>) {
      return runtimeHost.replaceFixture(
        input.runtimeSessionId,
        input.scenarioId,
        input.fixture,
      );
    },
    currentInputEpoch(input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
    }>) {
      return runtimeHost.currentInputEpoch(
        input.runtimeSessionId,
        input.scenarioId,
      );
    },
  });
  return Object.freeze({
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
    checkpointCodecId:
      MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3,
    snapshotGateId: MAIN_WIRE_INTEGRATED_STUDIO_SNAPSHOT_GATE_ID_V3,
    captureAdapter,
    draftCapture: Object.freeze({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
      fixtureSchemaId: MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3,
      checkpointCodecId:
        MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3,
      captureAcceptedCandidate: runtimeHost.captureDesiredContent.bind(
        runtimeHost,
      ),
    }),
    snapshotGate: Object.freeze({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
      snapshotGateId: MAIN_WIRE_INTEGRATED_STUDIO_SNAPSHOT_GATE_ID_V3,
      async qualifyFrozenCandidate(input: Readonly<{
        model: ModelContractV2;
        content: ExperimentContentV2;
      }>): Promise<ExperimentSnapshotGateResultV2> {
        assertExactModelV3(input.model);
        const qualifiedScenarios:
          ExperimentContentV2["scenarios"][number][] = [];
        for (const scenario of input.content.scenarios) {
          await captureAdapter.validateCapture({
            model: input.model,
            capture: scenario.capture,
          });
          const qualification =
            await qualifyMainWireIntegratedModelSnapshotV3({
              candidateCheckpoint: scenario.capture.checkpoint.payload,
            });
          if (
            qualification.status !== "accepted"
            || qualification.terminalCheckpoint === null
          ) {
            return Object.freeze({
              status: "rejected" as const,
              reason:
                `Scenario ${scenario.scenarioId} failed `
                + `${MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_V3_ID}: `
                + `${qualification.reason}`
                + (qualification.message === null
                  ? ""
                  : ` (${qualification.message})`),
            });
          }
          qualifiedScenarios.push(Object.freeze({
            scenarioId: scenario.scenarioId,
            label: scenario.label,
            capture: Object.freeze({
              fixture: scenario.capture.fixture,
              checkpoint: Object.freeze({
                acceptedRevision:
                  qualification.terminalCheckpoint.revision,
                acceptedTimeSec:
                  qualification.terminalCheckpoint.acceptedTimeSec,
                payload: cloneAndFreezeStudioJson(
                  qualification.terminalCheckpoint,
                ),
              }),
            }),
          }));
        }
        return Object.freeze({
          status: "passed" as const,
          qualifiedContent: Object.freeze({
            modelId: input.content.modelId,
            scenarios: Object.freeze(qualifiedScenarios),
            surface: input.content.surface,
          }),
        });
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
    ["schemaId", "rhythm", "coronary", "dynamicMechanicalSupport"],
    "V3 fixture",
  );
  if (fixture.schemaId !== MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3) {
    throw new Error("V3 fixture schemaId mismatch");
  }
  plainExactRecordV3(
    fixture.rhythm,
    ["mode"],
    "V3 fixture rhythm",
  );
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
  if (
    fixture.dynamicMechanicalSupport.mode
      !== "all-off-zero-inertance-v3"
  ) {
    throw new Error("V3 fixture dynamic MCS mode mismatch");
  }
  return fixture as MainWireIntegratedStudioFixtureV3;
}

function validateScenarioCheckpointV3(
  value: unknown,
): ScenarioCheckpointV2 {
  plainExactRecordV3(
    value,
    ["acceptedRevision", "acceptedTimeSec", "payload"],
    "V3 Scenario checkpoint",
  );
  nonnegativeSafeInteger(
    value.acceptedRevision,
    "checkpoint.acceptedRevision",
  );
  nonnegativeFinite(value.acceptedTimeSec, "checkpoint.acceptedTimeSec");
  const payload = cloneAndFreezeStudioJson(value.payload);
  plainExactRecordV3(payload, [
    "checkpointId",
    "schemaVersion",
    "transactionId",
    "revision",
    "acceptedTimeSec",
    "composedRhythmConfigurationIdentitySha256",
    "dynamicMechanicalSupportProfileIdentitySha256",
    "dynamicMechanicalSupportStructuralHydraulicIdentitySha256",
    "coronary",
    "composedRhythm",
    "dynamicMechanicalSupport",
    "checkpointSha256",
  ], "V3 checkpoint payload");
  if (
    payload.checkpointId !== MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID
    || payload.schemaVersion !== 3
    || payload.transactionId !== MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID
  ) {
    throw new Error("V3 checkpoint payload identity mismatch");
  }
  nonnegativeSafeInteger(payload.revision, "checkpoint.payload.revision");
  nonnegativeFinite(
    payload.acceptedTimeSec,
    "checkpoint.payload.acceptedTimeSec",
  );
  if (
    payload.revision !== value.acceptedRevision
    || payload.acceptedTimeSec !== value.acceptedTimeSec
  ) {
    throw new Error("V3 checkpoint wrapper and payload clocks differ");
  }
  for (const key of [
    "composedRhythmConfigurationIdentitySha256",
    "dynamicMechanicalSupportProfileIdentitySha256",
    "dynamicMechanicalSupportStructuralHydraulicIdentitySha256",
    "checkpointSha256",
  ]) {
    if (
      typeof payload[key] !== "string"
      || !/^[0-9a-f]{64}$/.test(payload[key])
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
    model.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3
    || model.fixtureSchemaId
      !== MAIN_WIRE_INTEGRATED_STUDIO_FIXTURE_SCHEMA_ID_V3
    || model.checkpointCodecId
      !== MAIN_WIRE_INTEGRATED_STUDIO_CHECKPOINT_CODEC_ID_V3
    || model.snapshotGateId
      !== MAIN_WIRE_INTEGRATED_STUDIO_SNAPSHOT_GATE_ID_V3
  ) {
    throw new Error("Main Wire V3 exact model contract mismatch");
  }
}

function plainExactRecordV3(
  value: unknown,
  keys: readonly string[],
  label: string,
): asserts value is Record<string, StudioJsonValueV2> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (
      Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null
    )
  ) {
    throw new Error(`${label} must be a plain object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
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
    typeof value !== "number"
    || !Number.isFinite(value)
    || Object.is(value, -0)
    || value < 0
  ) {
    throw new Error(`${label} must be a nonnegative finite number`);
  }
}

function requiredId(value: unknown, label: string): asserts value is string {
  if (
    typeof value !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/.test(value)
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

function toStudioSimulationFrameV3(input: Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
  inputEpoch: number;
  acceptedRevision: number;
  acceptedTimeSec: number;
  frame: ReturnType<typeof projectMainWireIntegratedModelObservationV3>;
}>): StudioSimulationFrameV2 {
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
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

export type {
  MainWireIntegratedModelCheckpointV3,
};
