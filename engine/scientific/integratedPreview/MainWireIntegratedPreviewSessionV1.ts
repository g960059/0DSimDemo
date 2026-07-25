import {
  createDynamicMechanicalSupportAcceptedStateV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import type {
  MechanicalSupportConfigV1,
} from "@/engine/devices/typesV1";
import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointContextV3,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  wrapMainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffRecipeV3,
  mainWireIntegratedModelPeriodicFixtureIdentityV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  type MainWireIntegratedModelRegularSinusAllOffRecipeV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  loadMainWireAdultFiveWallIntegratedPreviewReleaseV1,
  MAIN_WIRE_INTEGRATED_PREVIEW_MECHANICAL_SUPPORT_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1,
} from "@/engine/scientific/assembly";
import {
  canonicalJsonStringify,
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  createRunArtifactV1,
  loadBuildArtifactRefV1,
  type RunArtifactV1,
} from "@/engine/scientific/records";
import {
  loadMainWireIntegratedPreviewSeedRunV1,
  type MainWireIntegratedPreviewSeedRunV1,
} from "@/engine/scientific/integratedPreview/MainWireIntegratedPreviewSeedRunV1";

export const MAIN_WIRE_INTEGRATED_PREVIEW_SESSION_V1_ID =
  "circleheart-main-wire-integrated-preview-session-v1" as const;

export const MAIN_WIRE_INTEGRATED_PREVIEW_MCS_PRESET_IDS_V1 = Object.freeze([
  "all-off",
  "lvad-hmii-9000-one-beat-transient",
] as const);
export type MainWireIntegratedPreviewMcsPresetIdV1 =
  typeof MAIN_WIRE_INTEGRATED_PREVIEW_MCS_PRESET_IDS_V1[number];

export type MainWireIntegratedPreviewSimulationInputSpecV1 = Readonly<{
  schemaId: "circleheart-integrated-simulation-input-spec-v1";
  schemaVersion: 1;
  releaseRef: SimulationReleaseRef;
  modelAssembly: "base+coronary-v3+dynamic-mcs+composed-rhythm-v2";
  fixedGlobalTotalBloodVolumeMl: 5_600;
  rhythm: Readonly<{
    presetId: "composed-regular-sinus-60-v1";
    heartRateBpm: 60;
    cycleLengthSec: 1;
    externalAfOwnerIncluded: false;
  }>;
  mechanicalSupport: Readonly<{
    presetId: MainWireIntegratedPreviewMcsPresetIdV1;
    activeDeviceIds: readonly [] | readonly ["LVAD"];
    interpretation:
      | "numerically-periodic-all-off-seed"
      | "one-unsteady-post-activation-beat";
    canonicalProfileSha256: string;
    canonicalConfigSha256: string;
  }>;
  nominalDtSec: 0.002;
  seedRunPayloadSha256: string;
  sourceProtocolIdentityHash: string;
  periodicFixtureIdentitySha256: string;
}>;

export type MainWireIntegratedPreviewRunRecordV2 = Readonly<{
  artifactId: "circleheart-main-wire-integrated-preview-run-record-v2";
  schemaVersion: 2;
  releaseRef: SimulationReleaseRef;
  simulationInputSpec: MainWireIntegratedPreviewSimulationInputSpecV1;
  simulationInputSpecSha256: string;
  sourceSeed: Readonly<{
    payloadSha256: string;
    startCheckpointSha256: string;
    terminalCheckpointSha256: string;
    protocolIdentityHash: string;
    periodicFixtureIdentitySha256: string;
    numericalPeriod1Established: true;
  }>;
  run: Readonly<{
    kind: "bundled-p1-seed" | "one-beat-continuation";
    execution:
      | Readonly<{
        operation: "project-bundled-p1-seed";
        continuationBeatCountFromSeed: 0;
      }>
      | Readonly<{
        operation: "advance-one-fixed-sinus-cycle";
        requestedDurationSec: 1;
        continuationBeatOrdinalFromSeed: number;
      }>;
    startAcceptedTimeSec: number;
    endAcceptedTimeSec: number;
    acceptedStepCount: number;
    trace: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
    allValuesFinite: true;
    maximumTotalBloodVolumeErrorMl: number;
    maximumCoronaryBloodVolumeLedgerResidualMl: number;
    maximumDynamicMcsConservationResidualMlPerSec: number;
    numericalPeriod1Established:
      | true
      | "not-assessed-for-this-continuation";
    physiologicalAcceptanceEstablished: false;
    clinicalValidationClaimed: false;
  }>;
  startModelState: MainWireIntegratedModelCheckpointV3;
  terminalModelState: MainWireIntegratedModelCheckpointV3;
  replayCompleteness: Readonly<{
    stateTransitionInputIdentitiesIncluded: true;
    exactStartCheckpointIncluded: true;
    exactTerminalCheckpointIncluded: true;
    executableBuildProvenanceAttached: false;
    standaloneReplayCompleteArtifactClaimed: false;
    promotionEligibility:
      | "eligible-with-current-runtime-exact-replay"
      | "blocked-missing-complete-seed-lineage";
    upgradePath:
      | "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1"
      | null;
  }>;
  recordSha256: string;
}>;

export type MainWireIntegratedPreviewRunPresentationV2 = Readonly<{
  artifactId: MainWireIntegratedPreviewRunRecordV2["artifactId"];
  schemaVersion: 2;
  recordSha256: string;
  releaseRef: SimulationReleaseRef;
  simulationInputSpec: MainWireIntegratedPreviewSimulationInputSpecV1;
  simulationInputSpecSha256: string;
  sourceSeed: MainWireIntegratedPreviewRunRecordV2["sourceSeed"];
  run: Omit<MainWireIntegratedPreviewRunRecordV2["run"], "trace">;
  trace: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  startModelStateRef: Readonly<{
    checkpointId: MainWireIntegratedModelCheckpointV3["checkpointId"];
    schemaVersion: 3;
    checkpointSha256: string;
    acceptedTimeSec: number;
    revision: number;
  }>;
  terminalModelStateRef: Readonly<{
    checkpointId: MainWireIntegratedModelCheckpointV3["checkpointId"];
    schemaVersion: 3;
    checkpointSha256: string;
    acceptedTimeSec: number;
    revision: number;
  }>;
}>;

type Recipe = MainWireIntegratedModelRegularSinusAllOffRecipeV3;
type AcceptedState = MainWireIntegratedModelAcceptedStateV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;
type SuccessfulStep = MainWireIntegratedModelStepSuccessV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

export class MainWireIntegratedPreviewSessionV1 {
  readonly sessionId = MAIN_WIRE_INTEGRATED_PREVIEW_SESSION_V1_ID;
  readonly releaseRef: SimulationReleaseRef;
  readonly inputSpec: MainWireIntegratedPreviewSimulationInputSpecV1;
  readonly inputSpecSha256: string;

  private readonly recipe: Recipe;
  private readonly seed: MainWireIntegratedPreviewSeedRunV1;
  private readonly dynamicProfile: DynamicMechanicalSupportInertanceProfileV1;
  private readonly dynamicConfig: MechanicalSupportConfigV1;
  private acceptedState: AcceptedState;
  private continuationBeatCountFromSeed = 0;

  private constructor(
    releaseRef: SimulationReleaseRef,
    inputSpec: MainWireIntegratedPreviewSimulationInputSpecV1,
    inputSpecSha256: string,
    recipe: Recipe,
    seed: MainWireIntegratedPreviewSeedRunV1,
    dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
    dynamicConfig: MechanicalSupportConfigV1,
    acceptedState: AcceptedState,
  ) {
    this.releaseRef = releaseRef;
    this.inputSpec = inputSpec;
    this.inputSpecSha256 = inputSpecSha256;
    this.recipe = recipe;
    this.seed = seed;
    this.dynamicProfile = dynamicProfile;
    this.dynamicConfig = dynamicConfig;
    this.acceptedState = acceptedState;
  }

  static async create(
    mcsPresetId: MainWireIntegratedPreviewMcsPresetIdV1 = "all-off",
  ): Promise<MainWireIntegratedPreviewSessionV1> {
    if (!MAIN_WIRE_INTEGRATED_PREVIEW_MCS_PRESET_IDS_V1.includes(mcsPresetId)) {
      throw new Error("integrated preview MCS preset is not allowlisted");
    }
    const [release, seed] = await Promise.all([
      loadMainWireAdultFiveWallIntegratedPreviewReleaseV1(),
      loadMainWireIntegratedPreviewSeedRunV1(),
    ]);
    const recipe =
      createMainWireIntegratedModelRegularSinusAllOffRecipeV3();
    const periodicFixtureIdentitySha256 = await sha256CanonicalJsonHex(
      await mainWireIntegratedModelPeriodicFixtureIdentityV3(recipe),
    );
    const seedState = await restoreMainWireIntegratedModelV3(
      checkpointContext(
        recipe,
        recipe.dynamicMechanicalSupport.profile,
        recipe.dynamicMechanicalSupport.config,
      ),
      seed.payload.terminalModelState,
    );
    const active = mcsPresetId === "lvad-hmii-9000-one-beat-transient";
    const supportDefinition =
      MAIN_WIRE_INTEGRATED_PREVIEW_MECHANICAL_SUPPORT_INPUTS_V1[mcsPresetId];
    if (supportDefinition.previewPresetId !== mcsPresetId) {
      throw new Error("integrated preview MCS definition identity differs");
    }
    const dynamicProfile = supportDefinition.profile;
    const dynamicConfig = supportDefinition.config;
    const [canonicalProfileSha256, canonicalConfigSha256] = await Promise.all([
      sha256CanonicalJsonHex(dynamicProfile),
      sha256CanonicalJsonHex(dynamicConfig),
    ]);
    const acceptedState = active
      ? wrapMainWireIntegratedModelAcceptedStateV3(
        seedState.coronary,
        seedState.composedRhythm,
        createDynamicMechanicalSupportAcceptedStateV1(
          dynamicProfile,
          dynamicConfig,
        ),
        { configuration: recipe.rhythm.configuration },
        dynamicProfile,
        dynamicConfig,
      )
      : seedState;
    const inputSpec = cloneAndFreezeCanonicalJson({
      schemaId: "circleheart-integrated-simulation-input-spec-v1",
      schemaVersion: 1,
      releaseRef: release.ref,
      modelAssembly:
        "base+coronary-v3+dynamic-mcs+composed-rhythm-v2",
      fixedGlobalTotalBloodVolumeMl: recipe.fixedGlobalTotalBloodVolumeMl,
      rhythm: {
        presetId: "composed-regular-sinus-60-v1",
        heartRateBpm: 60,
        cycleLengthSec: 1,
        externalAfOwnerIncluded: false,
      },
      mechanicalSupport: {
        presetId: mcsPresetId,
        activeDeviceIds: supportDefinition.activeDeviceIds,
        interpretation: supportDefinition.interpretation,
        canonicalProfileSha256,
        canonicalConfigSha256,
      },
      nominalDtSec:
        MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1.nominalDtSec,
      seedRunPayloadSha256: seed.payloadSha256,
      sourceProtocolIdentityHash:
        seed.payload.sourceEvidence.protocolIdentityHash,
      periodicFixtureIdentitySha256,
    }) as unknown as MainWireIntegratedPreviewSimulationInputSpecV1;
    return new MainWireIntegratedPreviewSessionV1(
      release.ref,
      inputSpec,
      await sha256CanonicalJsonHex(inputSpec),
      recipe,
      seed,
      dynamicProfile,
      dynamicConfig,
      acceptedState,
    );
  }

  static async replayOneBeatRecord(
    input: unknown,
  ): Promise<MainWireIntegratedPreviewRunRecordV2> {
    const expected = await loadMainWireIntegratedPreviewRunRecordEnvelopeV2(
      input,
    );
    if (
      expected.run.kind !== "one-beat-continuation"
      || expected.run.execution.operation
        !== "advance-one-fixed-sinus-cycle"
      || !Number.isInteger(
        expected.run.execution.continuationBeatOrdinalFromSeed,
      )
      || expected.run.execution.continuationBeatOrdinalFromSeed < 1
    ) {
      throw new Error(
        "integrated preview replay requires a one-beat continuation record",
      );
    }
    const session = await MainWireIntegratedPreviewSessionV1.create(
      expected.simulationInputSpec.mechanicalSupport.presetId,
    );
    assertCurrentSessionIdentity(session, expected);
    session.acceptedState = await restoreMainWireIntegratedModelV3(
      checkpointContext(
        session.recipe,
        session.dynamicProfile,
        session.dynamicConfig,
      ),
      expected.startModelState,
    );
    session.continuationBeatCountFromSeed =
      expected.run.execution.continuationBeatOrdinalFromSeed - 1;
    const replayed = await session.runNextBeatRecord();
    if (
      canonicalJsonStringify(replayed) !== canonicalJsonStringify(expected)
    ) {
      throw new Error(
        "integrated preview replay differs from the expected run record",
      );
    }
    return replayed;
  }

  static async loadReplayVerifiedRunRecordForPromotion(
    input: unknown,
  ): Promise<MainWireIntegratedPreviewRunRecordV2> {
    const record = await loadMainWireIntegratedPreviewRunRecordEnvelopeV2(
      input,
    );
    if (
      record.replayCompleteness.promotionEligibility
        !== "eligible-with-current-runtime-exact-replay"
      || record.replayCompleteness.upgradePath
        !== "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1"
    ) {
      throw new Error(
        "integrated preview record is not promotion-eligible without "
          + "complete seed lineage",
      );
    }
    const session = await MainWireIntegratedPreviewSessionV1.create(
      record.simulationInputSpec.mechanicalSupport.presetId,
    );
    assertCurrentSessionIdentity(session, record);
    if (
      canonicalJsonStringify(session.sourceSeedIdentity())
        !== canonicalJsonStringify(record.sourceSeed)
    ) {
      throw new Error(
        "integrated preview source seed differs from the current runtime",
      );
    }
    const context = checkpointContext(
      session.recipe,
      session.dynamicProfile,
      session.dynamicConfig,
    );
    const [restoredStart] = await Promise.all([
      restoreMainWireIntegratedModelV3(context, record.startModelState),
      restoreMainWireIntegratedModelV3(context, record.terminalModelState),
    ]);

    if (record.run.kind === "one-beat-continuation") {
      if (
        record.run.execution.operation
          !== "advance-one-fixed-sinus-cycle"
      ) throw new Error("integrated preview continuation execution differs");
      const ordinal =
        record.run.execution.continuationBeatOrdinalFromSeed;
      if (ordinal !== 1) {
        throw new Error(
          "integrated preview promotion supports only the first exact "
            + "continuation from the current seed fork",
        );
      }
      const seedTerminalAcceptedTimeSec =
        session.seed.payload.terminalModelState.acceptedTimeSec;
      if (
        record.run.startAcceptedTimeSec
          !== seedTerminalAcceptedTimeSec + ordinal - 1
        || record.run.endAcceptedTimeSec
          !== seedTerminalAcceptedTimeSec + ordinal
      ) {
        throw new Error(
          "integrated preview continuation ordinal differs from its seed time",
        );
      }
      const currentFirstContinuationStart =
        await checkpointMainWireIntegratedModelV3(
          context,
          session.acceptedState,
        );
      if (
        canonicalJsonStringify(currentFirstContinuationStart)
          !== canonicalJsonStringify(record.startModelState)
      ) {
        throw new Error(
          "integrated preview first continuation does not start at "
            + "the current seed fork",
        );
      }
      session.acceptedState = restoredStart;
      session.continuationBeatCountFromSeed =
        ordinal - 1;
      const replayed = await session.runNextBeatRecord();
      if (
        canonicalJsonStringify(replayed) !== canonicalJsonStringify(record)
      ) {
        throw new Error(
          "integrated preview continuation record is not exactly reproducible",
        );
      }
      return record;
    }

    const currentSeedRecord = await session.seedRunRecord();
    if (
      canonicalJsonStringify(currentSeedRecord)
        !== canonicalJsonStringify(record)
    ) {
      throw new Error(
        "integrated preview bundled seed record differs from the current seed",
      );
    }

    session.acceptedState = restoredStart;
    session.continuationBeatCountFromSeed = 0;
    const replayedTransition = await session.runNextBeatRecord();
    if (
      canonicalJsonStringify(replayedTransition.run.trace)
        !== canonicalJsonStringify(record.run.trace)
      || canonicalJsonStringify(replayedTransition.startModelState)
        !== canonicalJsonStringify(record.startModelState)
      || canonicalJsonStringify(replayedTransition.terminalModelState)
        !== canonicalJsonStringify(record.terminalModelState)
    ) {
      throw new Error(
        "integrated preview bundled seed transition is not exactly "
          + "reproducible in the current execution runtime; cross-runtime "
          + "bitwise equivalence is not claimed",
      );
    }
    return record;
  }

  async seedRunRecord(): Promise<MainWireIntegratedPreviewRunRecordV2> {
    if (this.inputSpec.mechanicalSupport.presetId !== "all-off") {
      throw new Error("active MCS session has no periodic seed presentation");
    }
    return this.buildArtifact({
      kind: "bundled-p1-seed",
      execution: Object.freeze({
        operation: "project-bundled-p1-seed",
        continuationBeatCountFromSeed: 0,
      }),
      startAcceptedTimeSec:
        this.seed.payload.displaySeed.terminalCycleTrace.startTimeSec,
      endAcceptedTimeSec:
        this.seed.payload.displaySeed.terminalCycleTrace.endTimeSec,
      trace: this.seed.payload.displaySeed.terminalCycleTrace.samples,
      numericalPeriod1Established: true,
      startModelState: this.seed.payload.startModelState,
      terminalModelState: this.seed.payload.terminalModelState,
    });
  }

  async runNextBeatRecord():
  Promise<MainWireIntegratedPreviewRunRecordV2> {
    const retainedAcceptedState = this.acceptedState;
    const retainedContinuationBeatCount = this.continuationBeatCountFromSeed;
    try {
      const runRecord = await this.advanceOneBeatRecord();
      this.continuationBeatCountFromSeed += 1;
      return runRecord;
    } catch (error) {
      this.acceptedState = retainedAcceptedState;
      this.continuationBeatCountFromSeed = retainedContinuationBeatCount;
      throw error;
    }
  }

  private sourceSeedIdentity():
  MainWireIntegratedPreviewRunRecordV2["sourceSeed"] {
    return Object.freeze({
      payloadSha256: this.seed.payloadSha256,
      startCheckpointSha256:
        this.seed.payload.startModelState.checkpointSha256,
      terminalCheckpointSha256:
        this.seed.payload.terminalModelState.checkpointSha256,
      protocolIdentityHash:
        this.seed.payload.sourceEvidence.protocolIdentityHash,
      periodicFixtureIdentitySha256:
        this.inputSpec.periodicFixtureIdentitySha256,
      numericalPeriod1Established: true,
    });
  }

  private async advanceOneBeatRecord():
  Promise<MainWireIntegratedPreviewRunRecordV2> {
    const startAcceptedTimeSec = this.acceptedState.acceptedTimeSec;
    const endAcceptedTimeSec = startAcceptedTimeSec + 1;
    const startModelState = await checkpointMainWireIntegratedModelV3(
      checkpointContext(
        this.recipe,
        this.dynamicProfile,
        this.dynamicConfig,
      ),
      this.acceptedState,
    );
    const trace: MainWireIntegratedModelPeriodicTerminalTraceSampleV3[] = [];
    let acceptedStepCount = 0;
    let nominalGridIndex = 1;
    while (this.acceptedState.acceptedTimeSec < endAcceptedTimeSec) {
      if (
        acceptedStepCount >=
          MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1
            .maximumAcceptedStepCountPerBeat
      ) throw new Error("integrated preview beat exceeded its step bound");
      const nominalTarget = Math.min(
        endAcceptedTimeSec,
        startAcceptedTimeSec
          + nominalGridIndex
            * MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1.nominalDtSec,
      );
      const requestedStepSec =
        nominalTarget - this.acceptedState.acceptedTimeSec;
      if (!(requestedStepSec > 0)) {
        nominalGridIndex += 1;
        continue;
      }
      const candidateTimeLimit = limitMainWireIntegratedModelCandidateTimeV3(
        this.acceptedState,
        nominalTarget,
        {
          configuration: this.recipe.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
        },
        this.dynamicProfile,
        this.dynamicConfig,
      );
      const acceptedDtSec = candidateTimeLimit.candidateTimeSec
        - this.acceptedState.acceptedTimeSec;
      const stepped = stepMainWireIntegratedModelV3(
        this.recipe.provider,
        this.acceptedState,
        {
          candidateTimeSec: candidateTimeLimit.candidateTimeSec,
          coronary: this.recipe.coronaryStepInput,
          rhythm: {
            configuration: this.recipe.rhythm.configuration,
            externalAfNextBoundaryTimeSec: null,
            externalAtrialSourceBatch: null,
          },
          dynamicMechanicalSupport: {
            config: this.dynamicConfig,
            profile: this.dynamicProfile,
          },
        },
      );
      if (stepped.converged === false) {
        throw new Error(`integrated preview step failed: ${stepped.message}`);
      }
      this.acceptedState = stepped.acceptedState;
      acceptedStepCount += 1;
      trace.push(traceSample(
        Math.floor(startAcceptedTimeSec) + 1,
        acceptedStepCount,
        startAcceptedTimeSec,
        acceptedDtSec,
        stepped,
      ));
      if (
        Math.abs(this.acceptedState.acceptedTimeSec - nominalTarget) <= 1e-14
      ) nominalGridIndex += 1;
    }
    const terminalModelState = await checkpointMainWireIntegratedModelV3(
      checkpointContext(
        this.recipe,
        this.dynamicProfile,
        this.dynamicConfig,
      ),
      this.acceptedState,
    );
    return this.buildArtifact({
      kind: "one-beat-continuation",
      execution: Object.freeze({
        operation: "advance-one-fixed-sinus-cycle",
        requestedDurationSec: 1,
        continuationBeatOrdinalFromSeed:
          this.continuationBeatCountFromSeed + 1,
      }),
      startAcceptedTimeSec,
      endAcceptedTimeSec,
      trace,
      numericalPeriod1Established:
        "not-assessed-for-this-continuation",
      startModelState,
      terminalModelState,
    });
  }

  private async buildArtifact(input: Readonly<{
    kind: MainWireIntegratedPreviewRunRecordV2["run"]["kind"];
    execution: MainWireIntegratedPreviewRunRecordV2["run"]["execution"];
    startAcceptedTimeSec: number;
    endAcceptedTimeSec: number;
    trace: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
    numericalPeriod1Established:
      MainWireIntegratedPreviewRunRecordV2["run"]["numericalPeriod1Established"];
    startModelState: MainWireIntegratedModelCheckpointV3;
    terminalModelState: MainWireIntegratedModelCheckpointV3;
  }>): Promise<MainWireIntegratedPreviewRunRecordV2> {
    if (input.trace.length === 0 || !allNumericLeavesFinite(input.trace)) {
      throw new Error("integrated preview run trace is empty or nonfinite");
    }
    const run = Object.freeze({
      kind: input.kind,
      execution: input.execution,
      startAcceptedTimeSec: input.startAcceptedTimeSec,
      endAcceptedTimeSec: input.endAcceptedTimeSec,
      acceptedStepCount: input.trace.length,
      trace: Object.freeze([...input.trace]),
      allValuesFinite: true as const,
      maximumTotalBloodVolumeErrorMl: maximumAbsolute(
        input.trace,
        (sample) => sample.diagnostics.totalBloodVolumeErrorMl,
      ),
      maximumCoronaryBloodVolumeLedgerResidualMl: maximumAbsolute(
        input.trace,
        (sample) => sample.diagnostics.coronaryBloodVolumeLedgerResidualMl,
      ),
      maximumDynamicMcsConservationResidualMlPerSec: maximumAbsolute(
        input.trace,
        (sample) =>
          sample.diagnostics.dynamicMcsConservationResidualMlPerSec,
      ),
      numericalPeriod1Established: input.numericalPeriod1Established,
      physiologicalAcceptanceEstablished: false as const,
      clinicalValidationClaimed: false as const,
    });
    if (
      input.startModelState.acceptedTimeSec !== input.startAcceptedTimeSec
      || input.terminalModelState.acceptedTimeSec !== input.endAcceptedTimeSec
    ) {
      throw new Error(
        "integrated preview checkpoint boundaries differ from the run ledger",
      );
    }
    const promotionEligible =
      input.kind === "bundled-p1-seed"
      || (
        input.execution.operation === "advance-one-fixed-sinus-cycle"
        && input.execution.continuationBeatOrdinalFromSeed === 1
      );
    const payload = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
      artifactId:
        "circleheart-main-wire-integrated-preview-run-record-v2",
      schemaVersion: 2,
      releaseRef: this.releaseRef,
      simulationInputSpec: this.inputSpec,
      simulationInputSpecSha256: this.inputSpecSha256,
      sourceSeed: this.sourceSeedIdentity(),
      run,
      startModelState: input.startModelState,
      terminalModelState: input.terminalModelState,
      replayCompleteness: {
        stateTransitionInputIdentitiesIncluded: true,
        exactStartCheckpointIncluded: true,
        exactTerminalCheckpointIncluded: true,
        executableBuildProvenanceAttached: false,
        standaloneReplayCompleteArtifactClaimed: false,
        promotionEligibility: promotionEligible
          ? "eligible-with-current-runtime-exact-replay"
          : "blocked-missing-complete-seed-lineage",
        upgradePath: promotionEligible
          ? "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1"
          : null,
      },
    });
    return cloneAndFreezeCanonicalJson({
      ...payload,
      recordSha256: await sha256CanonicalJsonHex(payload),
    }) as unknown as MainWireIntegratedPreviewRunRecordV2;
  }
}

export function projectMainWireIntegratedPreviewRunV2(
  record: MainWireIntegratedPreviewRunRecordV2,
): MainWireIntegratedPreviewRunPresentationV2 {
  const { trace, ...run } = record.run;
  return Object.freeze({
    artifactId: record.artifactId,
    schemaVersion: record.schemaVersion,
    recordSha256: record.recordSha256,
    releaseRef: record.releaseRef,
    simulationInputSpec: record.simulationInputSpec,
    simulationInputSpecSha256: record.simulationInputSpecSha256,
    sourceSeed: record.sourceSeed,
    run,
    trace,
    startModelStateRef: Object.freeze({
      checkpointId: record.startModelState.checkpointId,
      schemaVersion: record.startModelState.schemaVersion,
      checkpointSha256: record.startModelState.checkpointSha256,
      acceptedTimeSec: record.startModelState.acceptedTimeSec,
      revision: record.startModelState.revision,
    }),
    terminalModelStateRef: Object.freeze({
      checkpointId: record.terminalModelState.checkpointId,
      schemaVersion: record.terminalModelState.schemaVersion,
      checkpointSha256: record.terminalModelState.checkpointSha256,
      acceptedTimeSec: record.terminalModelState.acceptedTimeSec,
      revision: record.terminalModelState.revision,
    }),
  });
}

async function loadMainWireIntegratedPreviewRunRecordEnvelopeV2(
  input: unknown,
): Promise<MainWireIntegratedPreviewRunRecordV2> {
  let safe: CanonicalJsonObject;
  try {
    safe = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(input);
  } catch (error) {
    throw new Error(
      "integrated preview run record is not canonical JSON data: "
        + (error instanceof Error ? error.message : String(error)),
    );
  }
  assertExactRecordKeys(safe, [
    "artifactId",
    "schemaVersion",
    "releaseRef",
    "simulationInputSpec",
    "simulationInputSpecSha256",
    "sourceSeed",
    "run",
    "startModelState",
    "terminalModelState",
    "replayCompleteness",
    "recordSha256",
  ], "integrated preview run record");
  if (
    safe.artifactId
      !== "circleheart-main-wire-integrated-preview-run-record-v2"
    || safe.schemaVersion !== 2
  ) throw new Error("integrated preview run record schema is unsupported");

  assertReleaseRef(safe.releaseRef, "integrated preview run record releaseRef");
  assertSimulationInputSpec(safe.simulationInputSpec, safe.releaseRef);
  assertDigest(
    safe.simulationInputSpecSha256,
    "integrated preview input spec SHA-256",
  );
  assertSourceSeed(safe.sourceSeed, safe.simulationInputSpec);
  assertRunLedger(safe.run);
  assertCheckpointBoundary(
    safe.startModelState,
    safe.run,
    "start",
  );
  assertCheckpointBoundary(
    safe.terminalModelState,
    safe.run,
    "terminal",
  );
  assertReplayCompleteness(safe.replayCompleteness, safe.run);
  assertDigest(safe.recordSha256, "integrated preview run record SHA-256");

  const record = safe as unknown as MainWireIntegratedPreviewRunRecordV2;
  const { recordSha256, ...recordPayload } = record;
  const [expectedRecordSha256, expectedInputSpecSha256] = await Promise.all([
    sha256CanonicalJsonHex(recordPayload),
    sha256CanonicalJsonHex(record.simulationInputSpec),
  ]);
  if (
    recordSha256 !== expectedRecordSha256
    || record.simulationInputSpecSha256 !== expectedInputSpecSha256
  ) throw new Error("integrated preview run record content identity differs");
  if (
    canonicalJsonStringify(record.releaseRef)
      !== canonicalJsonStringify(record.simulationInputSpec.releaseRef)
    || record.sourceSeed.payloadSha256
      !== record.simulationInputSpec.seedRunPayloadSha256
    || record.sourceSeed.protocolIdentityHash
      !== record.simulationInputSpec.sourceProtocolIdentityHash
    || record.sourceSeed.periodicFixtureIdentitySha256
      !== record.simulationInputSpec.periodicFixtureIdentitySha256
    || record.startModelState.acceptedTimeSec
      !== record.run.startAcceptedTimeSec
    || record.terminalModelState.acceptedTimeSec
      !== record.run.endAcceptedTimeSec
    || record.run.acceptedStepCount !== record.run.trace.length
    || record.terminalModelState.revision - record.startModelState.revision
      !== record.run.acceptedStepCount
  ) throw new Error("integrated preview run record internal identity differs");

  if (record.run.kind === "bundled-p1-seed") {
    if (
      record.run.execution.operation !== "project-bundled-p1-seed"
      || record.run.execution.continuationBeatCountFromSeed !== 0
      || record.run.numericalPeriod1Established !== true
      || record.simulationInputSpec.mechanicalSupport.presetId !== "all-off"
      || record.startModelState.checkpointSha256
        !== record.sourceSeed.startCheckpointSha256
      || record.terminalModelState.checkpointSha256
        !== record.sourceSeed.terminalCheckpointSha256
    ) throw new Error("integrated preview bundled seed record relation differs");
  } else if (
    record.run.execution.operation !== "advance-one-fixed-sinus-cycle"
    || record.run.execution.requestedDurationSec !== 1
    || !Number.isInteger(
      record.run.execution.continuationBeatOrdinalFromSeed,
    )
    || record.run.execution.continuationBeatOrdinalFromSeed < 1
    || record.run.numericalPeriod1Established
      !== "not-assessed-for-this-continuation"
  ) {
    throw new Error("integrated preview continuation record relation differs");
  }
  return record;
}

function assertCurrentSessionIdentity(
  session: MainWireIntegratedPreviewSessionV1,
  record: MainWireIntegratedPreviewRunRecordV2,
): void {
  if (
    session.inputSpecSha256 !== record.simulationInputSpecSha256
    || canonicalJsonStringify(session.inputSpec)
      !== canonicalJsonStringify(record.simulationInputSpec)
    || canonicalJsonStringify(session.releaseRef)
      !== canonicalJsonStringify(record.releaseRef)
  ) {
    throw new Error(
      "integrated preview run record identity differs from the current runtime",
    );
  }
}

function assertSimulationInputSpec(
  value: unknown,
  outerReleaseRef: unknown,
): asserts value is MainWireIntegratedPreviewSimulationInputSpecV1 {
  assertExactRecordKeys(value, [
    "schemaId",
    "schemaVersion",
    "releaseRef",
    "modelAssembly",
    "fixedGlobalTotalBloodVolumeMl",
    "rhythm",
    "mechanicalSupport",
    "nominalDtSec",
    "seedRunPayloadSha256",
    "sourceProtocolIdentityHash",
    "periodicFixtureIdentitySha256",
  ], "integrated preview simulation input spec");
  if (
    value.schemaId !== "circleheart-integrated-simulation-input-spec-v1"
    || value.schemaVersion !== 1
    || value.modelAssembly
      !== "base+coronary-v3+dynamic-mcs+composed-rhythm-v2"
    || value.fixedGlobalTotalBloodVolumeMl !== 5_600
    || value.nominalDtSec !== 0.002
  ) throw new Error("integrated preview simulation input schema differs");
  assertReleaseRef(value.releaseRef, "integrated preview input releaseRef");
  if (
    canonicalJsonStringify(value.releaseRef)
      !== canonicalJsonStringify(outerReleaseRef)
  ) throw new Error("integrated preview input releaseRef differs");
  assertExactRecordKeys(value.rhythm, [
    "presetId",
    "heartRateBpm",
    "cycleLengthSec",
    "externalAfOwnerIncluded",
  ], "integrated preview rhythm input");
  if (
    value.rhythm.presetId !== "composed-regular-sinus-60-v1"
    || value.rhythm.heartRateBpm !== 60
    || value.rhythm.cycleLengthSec !== 1
    || value.rhythm.externalAfOwnerIncluded !== false
  ) throw new Error("integrated preview rhythm input differs");
  assertExactRecordKeys(value.mechanicalSupport, [
    "presetId",
    "activeDeviceIds",
    "interpretation",
    "canonicalProfileSha256",
    "canonicalConfigSha256",
  ], "integrated preview mechanical-support input");
  const support = value.mechanicalSupport;
  if (
    !MAIN_WIRE_INTEGRATED_PREVIEW_MCS_PRESET_IDS_V1.includes(
      support.presetId as MainWireIntegratedPreviewMcsPresetIdV1,
    )
    || !Array.isArray(support.activeDeviceIds)
  ) throw new Error("integrated preview mechanical-support preset differs");
  if (
    support.presetId === "all-off"
      ? support.activeDeviceIds.length !== 0
        || support.interpretation !== "numerically-periodic-all-off-seed"
      : support.activeDeviceIds.length !== 1
        || support.activeDeviceIds[0] !== "LVAD"
        || support.interpretation !== "one-unsteady-post-activation-beat"
  ) throw new Error("integrated preview mechanical-support relation differs");
  assertDigest(
    support.canonicalProfileSha256,
    "integrated preview MCS profile SHA-256",
  );
  assertDigest(
    support.canonicalConfigSha256,
    "integrated preview MCS config SHA-256",
  );
  assertDigest(
    value.seedRunPayloadSha256,
    "integrated preview seed payload SHA-256",
  );
  assertDigest(
    value.sourceProtocolIdentityHash,
    "integrated preview source protocol SHA-256",
  );
  assertDigest(
    value.periodicFixtureIdentitySha256,
    "integrated preview fixture identity SHA-256",
  );
}

function assertSourceSeed(
  value: unknown,
  inputSpec: unknown,
): asserts value is MainWireIntegratedPreviewRunRecordV2["sourceSeed"] {
  assertExactRecordKeys(value, [
    "payloadSha256",
    "startCheckpointSha256",
    "terminalCheckpointSha256",
    "protocolIdentityHash",
    "periodicFixtureIdentitySha256",
    "numericalPeriod1Established",
  ], "integrated preview source seed");
  assertSimulationInputSpecShapeOnly(inputSpec);
  for (const [field, label] of [
    ["payloadSha256", "payload"],
    ["startCheckpointSha256", "start checkpoint"],
    ["terminalCheckpointSha256", "terminal checkpoint"],
    ["protocolIdentityHash", "protocol identity"],
    ["periodicFixtureIdentitySha256", "fixture identity"],
  ] as const) {
    assertDigest(value[field], `integrated preview source seed ${label} SHA-256`);
  }
  if (
    value.numericalPeriod1Established !== true
    || value.payloadSha256 !== inputSpec.seedRunPayloadSha256
    || value.protocolIdentityHash !== inputSpec.sourceProtocolIdentityHash
    || value.periodicFixtureIdentitySha256
      !== inputSpec.periodicFixtureIdentitySha256
  ) throw new Error("integrated preview source seed relation differs");
}

function assertSimulationInputSpecShapeOnly(
  value: unknown,
): asserts value is MainWireIntegratedPreviewSimulationInputSpecV1 {
  if (
    typeof value !== "object"
    || value === null
    || Array.isArray(value)
  ) throw new Error("integrated preview input spec is required");
}

function assertRunLedger(
  value: unknown,
): asserts value is MainWireIntegratedPreviewRunRecordV2["run"] {
  assertExactRecordKeys(value, [
    "kind",
    "execution",
    "startAcceptedTimeSec",
    "endAcceptedTimeSec",
    "acceptedStepCount",
    "trace",
    "allValuesFinite",
    "maximumTotalBloodVolumeErrorMl",
    "maximumCoronaryBloodVolumeLedgerResidualMl",
    "maximumDynamicMcsConservationResidualMlPerSec",
    "numericalPeriod1Established",
    "physiologicalAcceptanceEstablished",
    "clinicalValidationClaimed",
  ], "integrated preview run ledger");
  assertFiniteNumber(value.startAcceptedTimeSec, "run start accepted time");
  assertFiniteNumber(value.endAcceptedTimeSec, "run end accepted time");
  assertNonnegativeInteger(value.acceptedStepCount, "run accepted step count");
  if (
    value.endAcceptedTimeSec - value.startAcceptedTimeSec !== 1
    || value.acceptedStepCount < 1
    || value.acceptedStepCount
      > MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1
        .maximumAcceptedStepCountPerBeat
    || !Array.isArray(value.trace)
    || value.trace.length !== value.acceptedStepCount
    || value.allValuesFinite !== true
    || value.physiologicalAcceptanceEstablished !== false
    || value.clinicalValidationClaimed !== false
    || !allNumericLeavesFinite(value.trace)
  ) throw new Error("integrated preview run ledger relation differs");
  assertFiniteNonnegative(
    value.maximumTotalBloodVolumeErrorMl,
    "run maximum total blood-volume error",
  );
  assertFiniteNonnegative(
    value.maximumCoronaryBloodVolumeLedgerResidualMl,
    "run maximum coronary ledger residual",
  );
  assertFiniteNonnegative(
    value.maximumDynamicMcsConservationResidualMlPerSec,
    "run maximum dynamic-MCS conservation residual",
  );
  if (
    value.kind !== "bundled-p1-seed"
    && value.kind !== "one-beat-continuation"
  ) throw new Error("integrated preview run kind differs");
  assertExactRecordKeys(value.execution, value.kind === "bundled-p1-seed"
    ? ["operation", "continuationBeatCountFromSeed"]
    : [
      "operation",
      "requestedDurationSec",
      "continuationBeatOrdinalFromSeed",
    ], "integrated preview run execution");
  const run = value as unknown as
    MainWireIntegratedPreviewRunRecordV2["run"];
  if (run.kind === "bundled-p1-seed") {
    if (
      run.execution.operation !== "project-bundled-p1-seed"
      || run.execution.continuationBeatCountFromSeed !== 0
      || run.numericalPeriod1Established !== true
    ) throw new Error("integrated preview run execution differs");
  } else if (
    run.execution.operation !== "advance-one-fixed-sinus-cycle"
    || run.execution.requestedDurationSec !== 1
    || typeof run.execution.continuationBeatOrdinalFromSeed !== "number"
    || !Number.isInteger(
      run.execution.continuationBeatOrdinalFromSeed,
    )
    || run.execution.continuationBeatOrdinalFromSeed < 1
    || run.numericalPeriod1Established
      !== "not-assessed-for-this-continuation"
  ) throw new Error("integrated preview run execution differs");
  assertTraceRelations(run);
}

function assertTraceRelations(
  run: MainWireIntegratedPreviewRunRecordV2["run"],
): void {
  let priorAcceptedTimeSec = run.startAcceptedTimeSec;
  let traceCycleIndex: number | undefined;
  let durationSec = 0;
  let maximumTotalBloodVolumeErrorMl = 0;
  let maximumCoronaryBloodVolumeLedgerResidualMl = 0;
  let maximumDynamicMcsConservationResidualMlPerSec = 0;
  run.trace.forEach((sample, index) => {
    assertExactRecordKeys(sample, [
      "cycleIndex",
      "acceptedStepIndexWithinCycle",
      "acceptedTimeSec",
      "cyclePhase01",
      "acceptedDtSec",
      "chamberVolumeMl",
      "absolutePressureMmHg",
      "valveFlowMlPerSec",
      "pulmonaryCirculation",
      "coronary",
      "freeCalciumUMByWall",
      "dynamicMcsAcceptedFlowMlPerSec",
      "acceptedEventIdentity",
      "diagnostics",
    ], `integrated preview trace sample ${index}`);
    assertFiniteNumber(sample.acceptedTimeSec, "trace accepted time");
    assertFiniteNumber(sample.acceptedDtSec, "trace accepted dt");
    assertFiniteNumber(sample.cyclePhase01, "trace cycle phase");
    assertNonnegativeInteger(sample.cycleIndex, "trace cycle index");
    assertNonnegativeInteger(
      sample.acceptedStepIndexWithinCycle,
      "trace accepted step index",
    );
    assertTraceSamplePayload(sample, index);
    traceCycleIndex ??= sample.cycleIndex;
    if (
      sample.acceptedStepIndexWithinCycle !== index + 1
      || sample.cycleIndex !== traceCycleIndex
      || sample.acceptedTimeSec <= priorAcceptedTimeSec
      || !(sample.acceptedDtSec > 0)
      || sample.acceptedTimeSec - priorAcceptedTimeSec
        !== sample.acceptedDtSec
      || !(sample.cyclePhase01 > 0 && sample.cyclePhase01 <= 1)
      || sample.cyclePhase01
        !== sample.acceptedTimeSec - run.startAcceptedTimeSec
    ) throw new Error("integrated preview trace coordinate differs");
    assertExactRecordKeys(sample.diagnostics, [
      "mechanicsResidualNorm",
      "circulationScaledResidualInfinityNorm",
      "maximumContinuityResidualMl",
      "totalBloodVolumeErrorMl",
      "coronaryBloodVolumeLedgerResidualMl",
      "dynamicMcsConservationResidualMlPerSec",
    ], `integrated preview trace diagnostics ${index}`);
    for (const diagnostic of Object.values(sample.diagnostics)) {
      assertFiniteNumber(diagnostic, "integrated preview trace diagnostic");
    }
    durationSec += sample.acceptedDtSec;
    maximumTotalBloodVolumeErrorMl = Math.max(
      maximumTotalBloodVolumeErrorMl,
      Math.abs(sample.diagnostics.totalBloodVolumeErrorMl),
    );
    maximumCoronaryBloodVolumeLedgerResidualMl = Math.max(
      maximumCoronaryBloodVolumeLedgerResidualMl,
      Math.abs(sample.diagnostics.coronaryBloodVolumeLedgerResidualMl),
    );
    maximumDynamicMcsConservationResidualMlPerSec = Math.max(
      maximumDynamicMcsConservationResidualMlPerSec,
      Math.abs(sample.diagnostics.dynamicMcsConservationResidualMlPerSec),
    );
    priorAcceptedTimeSec = sample.acceptedTimeSec;
  });
  if (
    priorAcceptedTimeSec !== run.endAcceptedTimeSec
    || traceCycleIndex !== Math.floor(run.startAcceptedTimeSec) + 1
    || Math.abs(durationSec - 1) > 1e-12
    || maximumTotalBloodVolumeErrorMl
      !== run.maximumTotalBloodVolumeErrorMl
    || maximumCoronaryBloodVolumeLedgerResidualMl
      !== run.maximumCoronaryBloodVolumeLedgerResidualMl
    || maximumDynamicMcsConservationResidualMlPerSec
      !== run.maximumDynamicMcsConservationResidualMlPerSec
  ) throw new Error("integrated preview trace summary differs");
}

function assertTraceSamplePayload(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  index: number,
): void {
  const label = `integrated preview trace sample ${index}`;
  assertExactFiniteNumberRecord(
    sample.chamberVolumeMl,
    ["LA", "LV", "RA", "RV"],
    `${label} chamber volume`,
  );
  assertExactFiniteNumberRecord(
    sample.absolutePressureMmHg,
    ["LA", "LV", "RA", "RV", "Ao", "PA", "PVein"],
    `${label} absolute pressure`,
  );
  assertExactFiniteNumberRecord(
    sample.valveFlowMlPerSec,
    ["MV", "AoV", "TV", "PV"],
    `${label} valve flow`,
  );
  assertExactRecordKeys(sample.pulmonaryCirculation, [
    "nodeVolumeMl",
    "absolutePressureMmHg",
    "edgeFlowMlPerSec",
  ], `${label} pulmonary circulation`);
  assertExactFiniteNumberRecord(
    sample.pulmonaryCirculation.nodeVolumeMl,
    ["PA", "PArt", "PCap", "PVen", "PVein"],
    `${label} pulmonary node volume`,
  );
  assertExactFiniteNumberRecord(
    sample.pulmonaryCirculation.absolutePressureMmHg,
    ["PA", "PArt", "PCap", "PVen", "PVein"],
    `${label} pulmonary absolute pressure`,
  );
  assertExactFiniteNumberRecord(
    sample.pulmonaryCirculation.edgeFlowMlPerSec,
    ["PV", "PA_PArt", "PArt_PCap", "PCap_PVen", "PVen_PVein", "PVein_LA"],
    `${label} pulmonary edge flow`,
  );
  assertExactFiniteNumberRecord(
    sample.coronary,
    ["totalInletFlowMlPerSec", "ladSubendocardialQmFlowMlPerSec"],
    `${label} coronary projection`,
  );
  assertExactFiniteNumberRecord(
    sample.freeCalciumUMByWall,
    ["LA", "LVFW", "SEP", "RVFW", "RA"],
    `${label} free calcium`,
  );
  assertExactFiniteNumberRecord(
    sample.dynamicMcsAcceptedFlowMlPerSec,
    ["IMPELLA", "LVAD", "VA_ECMO", "VV_ECMO"],
    `${label} dynamic-MCS flow`,
  );
  assertExactRecordKeys(sample.acceptedEventIdentity, [
    "atrialCapturedActivationId",
    "ventricularCapturedActivationId",
    "deliveredCalciumDepositIds",
    "scheduledCalciumDepositIds",
  ], `${label} accepted event identity`);
  for (const field of [
    "atrialCapturedActivationId",
    "ventricularCapturedActivationId",
  ] as const) {
    const value = sample.acceptedEventIdentity[field];
    if (value !== null && typeof value !== "string") {
      throw new Error(`${label} ${field} differs`);
    }
  }
  for (const field of [
    "deliveredCalciumDepositIds",
    "scheduledCalciumDepositIds",
  ] as const) {
    const value = sample.acceptedEventIdentity[field];
    if (
      !Array.isArray(value)
      || value.some((id) => typeof id !== "string")
    ) throw new Error(`${label} ${field} differs`);
  }
}

function assertExactFiniteNumberRecord(
  value: unknown,
  expectedKeys: readonly string[],
  label: string,
): asserts value is Readonly<Record<string, number>> {
  assertExactRecordKeys(value, expectedKeys, label);
  for (const key of expectedKeys) {
    assertFiniteNumber(value[key], `${label}.${key}`);
  }
}

function assertCheckpointBoundary(
  value: unknown,
  run: unknown,
  boundary: "start" | "terminal",
): asserts value is MainWireIntegratedModelCheckpointV3 {
  assertPlainRecord(value, `integrated preview ${boundary} checkpoint`);
  assertRunLedgerShapeOnly(run);
  assertDigest(
    value.checkpointSha256,
    `integrated preview ${boundary} checkpoint SHA-256`,
  );
  assertFiniteNumber(
    value.acceptedTimeSec,
    `integrated preview ${boundary} checkpoint accepted time`,
  );
  assertNonnegativeInteger(
    value.revision,
    `integrated preview ${boundary} checkpoint revision`,
  );
  const expectedTime = boundary === "start"
    ? run.startAcceptedTimeSec
    : run.endAcceptedTimeSec;
  if (value.acceptedTimeSec !== expectedTime) {
    throw new Error(`integrated preview ${boundary} checkpoint time differs`);
  }
}

function assertRunLedgerShapeOnly(
  value: unknown,
): asserts value is MainWireIntegratedPreviewRunRecordV2["run"] {
  if (
    typeof value !== "object"
    || value === null
    || Array.isArray(value)
  ) throw new Error("integrated preview run ledger is required");
}

function assertReplayCompleteness(
  value: unknown,
  run: MainWireIntegratedPreviewRunRecordV2["run"],
): asserts value is MainWireIntegratedPreviewRunRecordV2[
  "replayCompleteness"
] {
  assertExactRecordKeys(value, [
    "stateTransitionInputIdentitiesIncluded",
    "exactStartCheckpointIncluded",
    "exactTerminalCheckpointIncluded",
    "executableBuildProvenanceAttached",
    "standaloneReplayCompleteArtifactClaimed",
    "promotionEligibility",
    "upgradePath",
  ], "integrated preview replay completeness");
  const promotionEligible =
    run.kind === "bundled-p1-seed"
    || (
      run.execution.operation === "advance-one-fixed-sinus-cycle"
      && run.execution.continuationBeatOrdinalFromSeed === 1
    );
  if (
    value.stateTransitionInputIdentitiesIncluded !== true
    || value.exactStartCheckpointIncluded !== true
    || value.exactTerminalCheckpointIncluded !== true
    || value.executableBuildProvenanceAttached !== false
    || value.standaloneReplayCompleteArtifactClaimed !== false
    || value.promotionEligibility !== (
      promotionEligible
        ? "eligible-with-current-runtime-exact-replay"
        : "blocked-missing-complete-seed-lineage"
    )
    || value.upgradePath !== (
      promotionEligible
        ? "createMainWireIntegratedPreviewRunArtifactV1-with-external-BuildArtifactRefV1"
        : null
    )
  ) throw new Error("integrated preview replay-completeness claim differs");
}

function assertReleaseRef(
  value: unknown,
  label: string,
): asserts value is SimulationReleaseRef {
  assertExactRecordKeys(value, ["id", "version", "sha256"], label);
  if (
    typeof value.id !== "string"
    || value.id.length === 0
    || typeof value.version !== "string"
    || value.version.length === 0
  ) throw new Error(`${label} is invalid`);
  assertDigest(value.sha256, `${label} SHA-256`);
}

function assertExactRecordKeys(
  value: unknown,
  expectedKeys: readonly string[],
  label: string,
): asserts value is Record<string, unknown> {
  assertPlainRecord(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) throw new Error(`${label} keys differ`);
}

function assertPlainRecord(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (
    typeof value !== "object"
    || value === null
    || Array.isArray(value)
  ) throw new Error(`${label} must be an object`);
}

function assertDigest(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} is invalid`);
  }
}

function assertFiniteNumber(
  value: unknown,
  label: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
}

function assertFiniteNonnegative(
  value: unknown,
  label: string,
): asserts value is number {
  assertFiniteNumber(value, label);
  if (value < 0) throw new Error(`${label} must be nonnegative`);
}

function assertNonnegativeInteger(
  value: unknown,
  label: string,
): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
}

/**
 * Promotes a browser-produced run record to a replay-complete RunArtifactV1.
 * The executable BuildArtifactRefV1 must come from CI/build provenance; the
 * browser session deliberately does not invent it.
 */
export async function createMainWireIntegratedPreviewRunArtifactV1(
  recordInput: unknown,
  buildArtifactRefInput: unknown,
): Promise<RunArtifactV1> {
  const buildArtifactRef = loadBuildArtifactRefV1(buildArtifactRefInput);
  const currentRelease =
    await loadMainWireAdultFiveWallIntegratedPreviewReleaseV1();
  if (
    buildArtifactRef.numericalRuntimeAbi.id
      !== currentRelease.manifest.numericalRuntime.runtimeId
    || buildArtifactRef.numericalRuntimeAbi.version
      !== currentRelease.manifest.numericalRuntime.runtimeVersion
  ) {
    throw new Error(
      "integrated preview build artifact numerical runtime ABI differs "
        + "from the current release",
    );
  }
  const record = await MainWireIntegratedPreviewSessionV1
    .loadReplayVerifiedRunRecordForPromotion(recordInput);
  if (
    buildArtifactRef.simulationReleaseRef.id !== record.releaseRef.id
    || buildArtifactRef.simulationReleaseRef.version
      !== record.releaseRef.version
    || buildArtifactRef.simulationReleaseRef.sha256
      !== record.releaseRef.sha256
  ) {
    throw new Error(
      "integrated preview run record cannot be promoted with mismatched "
        + "record, input, state-boundary, or build identity",
    );
  }
  return createRunArtifactV1({
    buildArtifactRef,
    protocolDescriptor: cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
      protocolId:
        MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1.protocolId,
      protocolVersion:
        MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1.protocolVersion,
      releaseRef: record.releaseRef,
      simulationInputSpec: record.simulationInputSpec,
      simulationInputSpecSha256: record.simulationInputSpecSha256,
    }),
    initializationIdentity: Object.freeze({
      kind: "exact-checkpoint" as const,
      checkpointSha256: record.startModelState.checkpointSha256,
    }),
    executionLedger: cloneAndFreezeCanonicalJson([
      {
        execution: record.run.execution,
        startAcceptedTimeSec: record.run.startAcceptedTimeSec,
        endAcceptedTimeSec: record.run.endAcceptedTimeSec,
        acceptedStepCount: record.run.acceptedStepCount,
        terminalCheckpointSha256:
          record.terminalModelState.checkpointSha256,
      },
    ]),
    outputs: cloneAndFreezeCanonicalJson({
      integratedPreviewRunRecord: record,
    }),
    audits: cloneAndFreezeCanonicalJson({
      exactStartCheckpointIncluded: true,
      exactTerminalCheckpointIncluded: true,
      buildArtifactRefAttached: true,
      sourceSeedProtocolIdentityHash:
        record.sourceSeed.protocolIdentityHash,
    }),
  });
}

function checkpointContext(
  recipe: Recipe,
  dynamicMechanicalSupportProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicMechanicalSupportConfig: MechanicalSupportConfigV1,
): MainWireIntegratedModelCheckpointContextV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
> {
  return createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
    recipe,
    dynamicMechanicalSupportProfile,
    dynamicMechanicalSupportConfig,
  );
}

function traceSample(
  cycleIndex: number,
  acceptedStepIndexWithinCycle: number,
  cycleStartTimeSec: number,
  acceptedDtSec: number,
  stepped: SuccessfulStep,
): MainWireIntegratedModelPeriodicTerminalTraceSampleV3 {
  const base = stepped.coronaryStep.baseStep;
  const circulation = base.circulationTrial;
  const pressures = circulation.nodeAbsolutePressuresMmHg;
  const volumes = circulation.candidateNodeVolumesMl;
  const valves = circulation.valveEvaluations;
  const hydraulics = base.coronaryTrial.diagnostics.hydraulics;
  const candidate = stepped.composedRhythmCandidate;
  return cloneAndFreezeCanonicalJson({
    cycleIndex,
    acceptedStepIndexWithinCycle,
    acceptedTimeSec: stepped.acceptedState.acceptedTimeSec,
    cyclePhase01: stepped.acceptedState.acceptedTimeSec - cycleStartTimeSec,
    acceptedDtSec,
    chamberVolumeMl: {
      LA: volumes.LA,
      LV: volumes.LV,
      RA: volumes.RA,
      RV: volumes.RV,
    },
    absolutePressureMmHg: {
      LA: pressures.LA,
      LV: pressures.LV,
      RA: pressures.RA,
      RV: pressures.RV,
      Ao: pressures.Ao,
      PA: pressures.PA,
      PVein: pressures.PVein,
    },
    valveFlowMlPerSec: {
      MV: valves.MV.flowMlPerSec,
      AoV: valves.AoV.flowMlPerSec,
      TV: valves.TV.flowMlPerSec,
      PV: valves.PV.flowMlPerSec,
    },
    pulmonaryCirculation: {
      nodeVolumeMl: {
        PA: volumes.PA,
        PArt: volumes.PArt,
        PCap: volumes.PCap,
        PVen: volumes.PVen,
        PVein: volumes.PVein,
      },
      absolutePressureMmHg: {
        PA: pressures.PA,
        PArt: pressures.PArt,
        PCap: pressures.PCap,
        PVen: pressures.PVen,
        PVein: pressures.PVein,
      },
      edgeFlowMlPerSec: {
        PV: valves.PV.flowMlPerSec,
        PA_PArt: circulation.edgeFlowsMlPerSec.PA_PArt,
        PArt_PCap: circulation.edgeFlowsMlPerSec.PArt_PCap,
        PCap_PVen: circulation.edgeFlowsMlPerSec.PCap_PVen,
        PVen_PVein: circulation.edgeFlowsMlPerSec.PVen_PVein,
        PVein_LA: circulation.edgeFlowsMlPerSec.PVein_LA,
      },
    },
    coronary: {
      totalInletFlowMlPerSec: hydraulics.totalInletFlowMlPerSec,
      ladSubendocardialQmFlowMlPerSec:
        hydraulics.layerQmInternalFlowMlPerSecByTerritory.LAD.subendocardial,
    },
    freeCalciumUMByWall: stepped.calciumDrive.freeCalciumUMByWall,
    dynamicMcsAcceptedFlowMlPerSec:
      stepped.acceptedState.dynamicMechanicalSupport.acceptedFlowMlPerSec,
    acceptedEventIdentity: {
      atrialCapturedActivationId:
        candidate.capturedAtrialActivation?.capturedActivationId ?? null,
      ventricularCapturedActivationId:
        candidate.capturedVentricularActivation?.capturedActivationId ?? null,
      deliveredCalciumDepositIds: candidate.deliveredCalciumDeposits.map(
        (deposit) => deposit.depositId,
      ),
      scheduledCalciumDepositIds: candidate.scheduledCalciumDeposits.map(
        (deposit) => deposit.depositId,
      ),
    },
    diagnostics: {
      mechanicsResidualNorm: base.mechanicsTrial.diagnostics.residualNorm,
      circulationScaledResidualInfinityNorm:
        circulation.diagnostics.finalScaledResidualInfinityNorm,
      maximumContinuityResidualMl:
        circulation.diagnostics.finalMaximumContinuityResidualMl,
      totalBloodVolumeErrorMl: circulation.diagnostics.totalBloodVolumeErrorMl,
      coronaryBloodVolumeLedgerResidualMl:
        base.coronaryTrial.diagnostics.exactBloodVolumeLedgerResidualMl,
      dynamicMcsConservationResidualMlPerSec:
        stepped.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
    },
  }) as unknown as MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
}

function maximumAbsolute(
  trace: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  read: (sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3) => number,
): number {
  return Math.max(...trace.map((sample) => Math.abs(read(sample))));
}

function allNumericLeavesFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allNumericLeavesFinite);
  if (typeof value !== "object" || value === null) return true;
  return Object.values(value).every(allNumericLeavesFinite);
}
