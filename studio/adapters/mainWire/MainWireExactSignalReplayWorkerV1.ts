import {
  loadMainWireScientificResolvedSessionInputEnvelopeV1,
  type MainWireScientificResolvedSessionInputV1,
} from "@/engine/scientific/inputs";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireScientificBrowserRuntimeLimitsV1";
import {
  EXACT_SIGNAL_EXPORT_LIMITS_V1,
  EXACT_SIGNAL_REPLAY_COVERAGE_V1,
  type ArtifactStorePortV1,
  type ExactSignalExportCommandV1,
  type ExactSignalExportResultV1,
  type ExactSignalReplayRecipeV1,
  type ExactSignalSampleV1,
  type RuntimeExecutionIdentityV1,
  type StudioRunArtifactContentV1,
} from "@/studio/contracts/v1";
import {
  loadStudioRunArtifactContentV1,
} from "@/studio/infrastructure/artifacts/StudioRunArtifactContentLoaderV1";
import type {
  MainWireExactSignalExportWriterInternalPortV1,
} from "@/studio/infrastructure/artifacts/StudioExactSignalExportWriterV1";
import {
  loadMainWireExactSignalReplayOriginEnvelopeV1,
  sameMainWireExactSignalReplayRecipeV1,
  sameMainWireReplayOriginCorrelationV1,
  type MainWireExactSignalReplayOriginEnvelopeContentV1,
  type MainWireRetainedExactSignalReplayOriginV1,
} from "./MainWireExactSignalReplayOriginEnvelopeV1";
import type {
  MainWireStudioHostedSessionV1,
  MainWireStudioSessionHostV1,
} from "./MainWireStudioSessionHostV1";
import {
  loadMainWireStudioReplayCheckpointEnvelopeV1,
  MAIN_WIRE_STUDIO_REPLAY_CHECKPOINT_ENVELOPE_V1_SCHEMA_ID,
} from "./MainWireStudioReplayCheckpointEnvelopeV1";
import {
  loadMainWireStudioSnapshotEnvelopeV1,
  mainWireStudioExecutionIdentityV1,
} from "./MainWireStudioSnapshotEnvelopeV1";
import {
  mainWireStudioTargetInputSha256V1,
} from "./MainWireStudioTargetResolverV1";

export const MAIN_WIRE_EXACT_SIGNAL_DT_SEC_V1 = 0.002 as const;
const TIME_TOLERANCE_SEC_V1 = 1e-11;
const VERIFIED_REPLAY_MINT_TOKEN_V1 = Object.freeze({});

export type MainWireExactSignalReplayWorkerOptionsV1 = Readonly<{
  artifacts: ArtifactStorePortV1;
  writer: MainWireExactSignalExportWriterInternalPortV1;
  host: MainWireStudioSessionHostV1;
  replaySessionId: string;
}>;

export class MainWireExactSignalReplayErrorV1 extends Error {
  constructor(message: string) {
    super(`MainWire exact signal replay failed: ${message}`);
    this.name = "MainWireExactSignalReplayErrorV1";
  }
}

/**
 * Runtime capability consumed by the internal writer. Its constructor token is
 * module-private, and it is minted only after the origin DTO, source-run
 * binding, checkpoint, dedicated restore receipt and command arithmetic have
 * all been validated.
 */
export class MainWireVerifiedExactSignalReplayV1 {
  private constructor(
    readonly recipe: ExactSignalReplayRecipeV1,
  ) {}

  static mintInternalV1(
    token: object,
    recipe: ExactSignalReplayRecipeV1,
  ): MainWireVerifiedExactSignalReplayV1 {
    if (token !== VERIFIED_REPLAY_MINT_TOKEN_V1) {
      throw replayErrorV1("verified replay capability mint denied");
    }
    return new MainWireVerifiedExactSignalReplayV1(recipe);
  }
}

/**
 * Internal one-job worker. It is deliberately absent from public barrels.
 * Every command runs on a dedicated host and is bounded and cancellable.
 */
export class MainWireExactSignalReplayWorkerV1 {
  private readonly artifacts: ArtifactStorePortV1;
  private readonly writer: MainWireExactSignalExportWriterInternalPortV1;
  private readonly host: MainWireStudioSessionHostV1;
  private readonly replaySessionId: string;

  constructor(options: MainWireExactSignalReplayWorkerOptionsV1) {
    this.artifacts = options.artifacts;
    this.writer = options.writer;
    this.host = options.host;
    this.replaySessionId = options.replaySessionId;
  }

  async exportExactSignals(
    retained: MainWireRetainedExactSignalReplayOriginV1,
    command: ExactSignalExportCommandV1,
    signal: AbortSignal,
  ): Promise<ExactSignalExportResultV1> {
    try {
      assertNotAbortedV1(signal);
      const loaded = await this.loadOriginV1(retained, command, signal);
      assertNotAbortedV1(signal);
      const restored = await this.host.restoreV4({
        sessionId: this.replaySessionId,
        resolvedSessionInput: loaded.resolvedSessionInput,
        checkpointV4: loaded.checkpointV4,
      });
      assertNotAbortedV1(signal);
      assertRestoreBindingV1(loaded.recipe, loaded, restored);
      const capability =
        MainWireVerifiedExactSignalReplayV1.mintInternalV1(
          VERIFIED_REPLAY_MINT_TOKEN_V1,
          loaded.recipe,
        );
      return await this.writer.writeExactSignalExportV1({
        capability,
        recipe: loaded.recipe,
        intervalStartOffsetSec: command.intervalStartOffsetSec,
        intervalDurationSec: command.intervalDurationSec,
        samples: this.streamSamplesV1(
          restored,
          command,
          loaded.cycleLengthSec,
          signal,
        ),
        signal,
      });
    } catch (error) {
      if (error instanceof MainWireExactSignalReplayErrorV1) throw error;
      throw replayErrorV1(errorMessageV1(error));
    }
  }

  private async loadOriginV1(
    retained: MainWireRetainedExactSignalReplayOriginV1,
    command: ExactSignalExportCommandV1,
    signal: AbortSignal,
  ): Promise<LoadedReplayOriginV1> {
    assertNotAbortedV1(signal);
    const originValue = await this.artifacts.readJson(retained.originRef);
    assertNotAbortedV1(signal);
    const origin =
      loadMainWireExactSignalReplayOriginEnvelopeV1(originValue);
    if (
      !sameMainWireReplayOriginCorrelationV1(
        origin.correlation,
        retained.correlation,
      )
      || !sameMainWireExactSignalReplayRecipeV1(
        origin.recipe,
        retained.recipe,
      )
    ) throw replayErrorV1("retained origin index does not match its envelope");
    assertCommandOriginBindingV1(origin, command);
    assertReplayResourceArithmeticV1(origin.recipe, command);

    const [inputValue, snapshotValue, sourceRunValue] =
      await Promise.all([
        this.artifacts.readJson(origin.recipe.simulationInputRef),
        this.artifacts.readJson(origin.recipe.replayCheckpointRef),
        this.artifacts.readJson(origin.sourceRunRef),
      ]);
    assertNotAbortedV1(signal);
    const resolvedSessionInput =
      await loadMainWireScientificResolvedSessionInputEnvelopeV1(
        inputValue,
      );
    const sourceRun = loadStudioRunArtifactContentV1(sourceRunValue);
    await assertSourceRunBindingV1(
      this.artifacts,
      origin,
      sourceRun,
    );
    assertNotAbortedV1(signal);
    const snapshotRecord = recordV1(snapshotValue, "snapshot");
    const loaded = snapshotRecord.schemaId
        === MAIN_WIRE_STUDIO_REPLAY_CHECKPOINT_ENVELOPE_V1_SCHEMA_ID
      ? await loadMainWireStudioReplayCheckpointEnvelopeV1(
        snapshotValue,
        {
          simulationInputRef: origin.recipe.simulationInputRef,
          resolvedSessionInput,
        },
      )
      : await loadMainWireStudioSnapshotEnvelopeV1(
        snapshotValue,
        {
          simulationInputRef: origin.recipe.simulationInputRef,
          baseSessionInputSha256:
            resolvedSessionInput.sessionInputSha256,
        },
      );
    assertNotAbortedV1(signal);
    const checkpointV4 = loaded.checkpointV4;
    const expectedTargetInputSha256 =
      await mainWireStudioTargetInputSha256V1(
        checkpointV4.controlTargetState,
        resolvedSessionInput.sessionInputSha256,
      );
    const execution = mainWireStudioExecutionIdentityV1(checkpointV4);
    if (
      expectedTargetInputSha256 !== origin.recipe.targetInputSha256
      || checkpointV4.transaction.revision
        !== origin.recipe.boundaryRevision
      || !sameTimeV1(
        checkpointV4.transaction.acceptedTimeSec,
        origin.recipe.boundaryTimeSec,
      )
      || !sameExecutionIdentityV1(execution, origin.recipe.execution)
      || !sameTimeV1(
        checkpointV4.canonicalPhase.cycleLengthSec,
        origin.recipe.cycleLengthSec,
      )
      || !sameSimulationReleaseRef(
        checkpointV4.releaseRef,
        resolvedSessionInput.releaseRef,
      )
    ) throw replayErrorV1("retained origin identity mismatch");
    return Object.freeze({
      recipe: origin.recipe,
      resolvedSessionInput,
      checkpointV4,
      cycleLengthSec: checkpointV4.canonicalPhase.cycleLengthSec,
    });
  }

  private async *streamSamplesV1(
    restored: MainWireStudioHostedSessionV1,
    command: ExactSignalExportCommandV1,
    cycleLengthSec: number,
    signal: AbortSignal,
  ): AsyncGenerator<ExactSignalSampleV1> {
    let session = restored;
    let boundaryFrame = restored.observableFrame;
    let remainingFastForwardSteps =
      gridStepCountV1(command.intervalStartOffsetSec);
    while (remainingFastForwardSteps > 0) {
      assertNotAbortedV1(signal);
      const stepCount = Math.min(
        remainingFastForwardSteps,
        MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .maximumTransientStepCountPerCommand,
      );
      const chunk = await this.host.runTransient({
        session,
        dtSec: MAIN_WIRE_EXACT_SIGNAL_DT_SEC_V1,
        stepCount,
        observationStride: stepCount,
      });
      assertNotAbortedV1(signal);
      assertTransientChunkV1(session, chunk, stepCount, stepCount);
      session = chunk.session;
      boundaryFrame = chunk.observableFrames.at(-1)!;
      remainingFastForwardSteps -= stepCount;
    }

    const boundaryProvenance =
      command.intervalStartOffsetSec === 0
        ? "checkpoint-boundary" as const
        : "accepted-step" as const;
    yield exactSampleFromFrameV1(
      boundaryFrame,
      boundaryProvenance,
      cycleLengthSec,
    );

    let remainingIntervalSteps =
      gridStepCountV1(command.intervalDurationSec);
    while (remainingIntervalSteps > 0) {
      assertNotAbortedV1(signal);
      const stepCount = Math.min(
        remainingIntervalSteps,
        MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .maximumTransientStepCountPerCommand,
      );
      const chunk = await this.host.runTransient({
        session,
        dtSec: MAIN_WIRE_EXACT_SIGNAL_DT_SEC_V1,
        stepCount,
        observationStride: 1,
      });
      assertNotAbortedV1(signal);
      assertTransientChunkV1(session, chunk, stepCount, 1);
      session = chunk.session;
      for (const frame of chunk.observableFrames) {
        assertNotAbortedV1(signal);
        yield exactSampleFromFrameV1(
          frame,
          "accepted-step",
          cycleLengthSec,
        );
      }
      remainingIntervalSteps -= stepCount;
    }
  }
}

type LoadedReplayOriginV1 = Readonly<{
  recipe: ExactSignalReplayRecipeV1;
  resolvedSessionInput: MainWireScientificResolvedSessionInputV1;
  checkpointV4: Parameters<
    MainWireStudioSessionHostV1["restoreV4"]
  >[0]["checkpointV4"];
  cycleLengthSec: number;
}>;

function assertCommandOriginBindingV1(
  origin: MainWireExactSignalReplayOriginEnvelopeContentV1,
  command: ExactSignalExportCommandV1,
): void {
  const correlation = origin.correlation;
  if (
    correlation.sessionId !== command.sessionId
    || correlation.scenarioId !== command.scenarioId
    || correlation.liveBranchId !== command.liveBranchId
    || correlation.targetGeneration !== command.targetGeneration
    || correlation.presentationRevision !== command.presentationRevision
    || !finiteGridDurationV1(command.intervalStartOffsetSec, true)
    || !finiteGridDurationV1(command.intervalDurationSec, false)
  ) throw replayErrorV1("command and retained origin do not match");
}

function assertReplayResourceArithmeticV1(
  recipe: ExactSignalReplayRecipeV1,
  command: ExactSignalExportCommandV1,
): void {
  const startSteps = gridStepCountV1(command.intervalStartOffsetSec);
  const intervalSteps = gridStepCountV1(command.intervalDurationSec);
  const maximumStepsPerRequest =
    MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
      .maximumTransientStepCountPerCommand;
  const workerRequestCount = 1
    + Math.ceil(startSteps / maximumStepsPerRequest)
    + Math.ceil(intervalSteps / maximumStepsPerRequest);
  if (
    startSteps > EXACT_SIGNAL_EXPORT_LIMITS_V1
      .maximumStartOffsetStepCount
    || intervalSteps + 1
      > EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumSampleCount
    || workerRequestCount
      > EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumWorkerRequestCount
    || !Number.isSafeInteger(recipe.boundaryRevision + startSteps)
    || !Number.isSafeInteger(
      recipe.boundaryRevision + startSteps + intervalSteps,
    )
    || !Number.isFinite(
      recipe.boundaryTimeSec
        + command.intervalStartOffsetSec
        + command.intervalDurationSec,
    )
  ) throw replayErrorV1("exact export exceeds its resource budget");
}

async function assertSourceRunBindingV1(
  artifacts: ArtifactStorePortV1,
  origin: MainWireExactSignalReplayOriginEnvelopeContentV1,
  sourceRun: StudioRunArtifactContentV1,
): Promise<void> {
  if (
    !sameArtifactRefV1(
      sourceRun.simulationInputRef,
      origin.recipe.simulationInputRef,
    )
    || !sameExecutionIdentityV1(
      sourceRun.execution,
      origin.recipe.execution,
    )
    || (
      origin.correlation.originKind === "opened-run"
      && (
        !sameArtifactRefV1(
          sourceRun.snapshotRef,
          origin.recipe.replayCheckpointRef,
        )
        || sourceRun.targetInputSha256
          !== origin.recipe.targetInputSha256
      )
    )
    || !await artifacts.has(sourceRun.sourceRunRef)
  ) throw replayErrorV1("source run and retained origin do not match");
}

function assertRestoreBindingV1(
  recipe: ExactSignalReplayRecipeV1,
  loaded: LoadedReplayOriginV1,
  restored: MainWireStudioHostedSessionV1,
): void {
  if (
    restored.hostId.length === 0
    || restored.sessionId.length === 0
    || restored.baseSessionInputSha256
      !== loaded.resolvedSessionInput.sessionInputSha256
    || restored.controlState.targetStateSha256
      !== loaded.checkpointV4.controlTargetStateSha256
    || restored.parameterEpoch !== loaded.checkpointV4.parameterEpoch
    || restored.stateIdentity.revision !== recipe.boundaryRevision
    || !sameTimeV1(
      restored.stateIdentity.acceptedTimeSec,
      recipe.boundaryTimeSec,
    )
    || restored.observableFrame.revision !== recipe.boundaryRevision
    || restored.observableFrame.source !== "exact-checkpoint-restore"
    || !sameTimeV1(
      restored.observableFrame.acceptedTimeSec,
      recipe.boundaryTimeSec,
    )
  ) throw replayErrorV1("dedicated worker restore receipt mismatch");
}

function assertTransientChunkV1(
  source: MainWireStudioHostedSessionV1,
  chunk: Awaited<ReturnType<MainWireStudioSessionHostV1["runTransient"]>>,
  stepCount: number,
  observationStride: number,
): void {
  const expectedFrameCount = Math.ceil(stepCount / observationStride);
  if (
    chunk.session.sessionId !== source.sessionId
    || chunk.session.hostId !== source.hostId
    || chunk.observableFrames.length !== expectedFrameCount
    || chunk.session.stateIdentity.revision
      !== source.stateIdentity.revision + stepCount
    || !sameTimeV1(
      chunk.session.stateIdentity.acceptedTimeSec,
      source.stateIdentity.acceptedTimeSec
        + stepCount * MAIN_WIRE_EXACT_SIGNAL_DT_SEC_V1,
    )
  ) throw replayErrorV1("transient chunk receipt mismatch");
  let previousRevision = source.stateIdentity.revision;
  let previousTimeSec = source.stateIdentity.acceptedTimeSec;
  for (let index = 0; index < chunk.observableFrames.length; index += 1) {
    const frame = chunk.observableFrames[index]!;
    const offset = Math.min(
      (index + 1) * observationStride,
      stepCount,
    );
    const expectedRevision = source.stateIdentity.revision + offset;
    const expectedTimeSec = source.stateIdentity.acceptedTimeSec
      + offset * MAIN_WIRE_EXACT_SIGNAL_DT_SEC_V1;
    if (
      frame.source !== "accepted-step"
      || frame.revision !== expectedRevision
      || !sameTimeV1(frame.acceptedTimeSec, expectedTimeSec)
      || (
        observationStride === 1
        && (
          frame.revision !== previousRevision + 1
          || !sameTimeV1(
            frame.acceptedTimeSec,
            previousTimeSec + MAIN_WIRE_EXACT_SIGNAL_DT_SEC_V1,
          )
        )
      )
    ) throw replayErrorV1("accepted-step continuity mismatch");
    previousRevision = frame.revision;
    previousTimeSec = frame.acceptedTimeSec;
  }
}

function exactSampleFromFrameV1(
  frame: MainWireScientificObservableFrameV1,
  provenance: ExactSignalSampleV1["provenance"],
  cycleLengthSec: number,
): ExactSignalSampleV1 {
  const values = Object.fromEntries(
    Object.entries(frame.values).map(([observableId, value]) => [
      observableId,
      Object.freeze({
        observableId: value.observableId,
        value: value.value,
        availability: value.availability,
        quality: value.quality,
      }),
    ]),
  );
  return Object.freeze({
    coverage: EXACT_SIGNAL_REPLAY_COVERAGE_V1,
    provenance,
    revision: frame.revision,
    simulationTimeSec: frame.acceptedTimeSec,
    phase01: phase01V1(frame.acceptedTimeSec, cycleLengthSec),
    values: Object.freeze(values),
  }) as unknown as ExactSignalSampleV1;
}

function phase01V1(timeSec: number, cycleLengthSec: number): number {
  const raw = timeSec / cycleLengthSec;
  const phase = raw - Math.floor(raw);
  return phase >= 1 - 1e-12 || phase < 1e-12 ? 0 : phase;
}

function finiteGridDurationV1(value: number, zeroAllowed: boolean): boolean {
  return Number.isFinite(value)
    && (zeroAllowed ? value >= 0 : value > 0)
    && Number.isSafeInteger(gridStepCountV1(value))
    && sameTimeV1(
      value,
      gridStepCountV1(value) * MAIN_WIRE_EXACT_SIGNAL_DT_SEC_V1,
    );
}

function gridStepCountV1(value: number): number {
  return Math.round(value / MAIN_WIRE_EXACT_SIGNAL_DT_SEC_V1);
}

function sameExecutionIdentityV1(
  left: RuntimeExecutionIdentityV1,
  right: RuntimeExecutionIdentityV1,
): boolean {
  return left.modelRef === right.modelRef
    && left.runtimeRef === right.runtimeRef
    && left.solverRef === right.solverRef
    && left.stateCodecRef === right.stateCodecRef
    && left.protocolRef === right.protocolRef;
}

function sameArtifactRefV1(
  left: Readonly<{
    schemaId: string;
    kind: string;
    sha256: string;
    mediaType: string;
    byteLength: number;
  }>,
  right: Readonly<{
    schemaId: string;
    kind: string;
    sha256: string;
    mediaType: string;
    byteLength: number;
  }>,
): boolean {
  return left.schemaId === right.schemaId
    && left.kind === right.kind
    && left.sha256 === right.sha256
    && left.mediaType === right.mediaType
    && left.byteLength === right.byteLength;
}

function sameTimeV1(left: number, right: number): boolean {
  return Math.abs(left - right) <= TIME_TOLERANCE_SEC_V1;
}

function assertNotAbortedV1(signal: AbortSignal): void {
  if (signal.aborted) throw replayErrorV1("export was cancelled");
}

function recordV1(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw replayErrorV1(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function replayErrorV1(message: string): MainWireExactSignalReplayErrorV1 {
  return new MainWireExactSignalReplayErrorV1(message);
}
