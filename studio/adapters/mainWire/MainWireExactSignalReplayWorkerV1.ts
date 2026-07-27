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
  EXACT_SIGNAL_EXPORT_MANIFEST_V1_SCHEMA_ID,
  EXACT_SIGNAL_REPLAY_COVERAGE_V1,
  type ArtifactStorePortV1,
  type ExactSignalExportCommandV1,
  type ExactSignalExportManifestDraftV1,
  type ExactSignalExportResultV1,
  type ExactSignalExportWriterPortV1,
  type ExactSignalSampleV1,
  type RuntimeExecutionIdentityV1,
  type RuntimeReplayOriginV1,
  type SnapshotEnvelopeRefV1,
} from "@/studio/contracts/v1";
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

export type MainWireExactSignalReplayWorkerOptionsV1 = Readonly<{
  artifacts: ArtifactStorePortV1;
  writer: ExactSignalExportWriterPortV1;
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
 * One instance owns one exclusive execution host. It never touches the live
 * host token: all fast-forward and exact-step commands run against a restored
 * replay session and flow directly into the writer's async iterable.
 */
export class MainWireExactSignalReplayWorkerV1 {
  private readonly artifacts: ArtifactStorePortV1;
  private readonly writer: ExactSignalExportWriterPortV1;
  private readonly host: MainWireStudioSessionHostV1;
  private readonly replaySessionId: string;

  constructor(options: MainWireExactSignalReplayWorkerOptionsV1) {
    this.artifacts = options.artifacts;
    this.writer = options.writer;
    this.host = options.host;
    this.replaySessionId = options.replaySessionId;
  }

  async exportExactSignals(
    origin: RuntimeReplayOriginV1,
    command: ExactSignalExportCommandV1,
  ): Promise<ExactSignalExportResultV1> {
    try {
      assertCommandOriginBindingV1(origin, command);
      const loaded = await this.loadOriginV1(origin);
      const restored = await this.host.restoreV4({
        sessionId: this.replaySessionId,
        resolvedSessionInput: loaded.resolvedSessionInput,
        checkpointV4: loaded.checkpointV4,
      });
      assertRestoreBindingV1(origin, loaded, restored);
      const intervalCount = gridStepCountV1(
        command.intervalDurationSec,
      );
      const manifest = Object.freeze({
        schemaId: EXACT_SIGNAL_EXPORT_MANIFEST_V1_SCHEMA_ID,
        schemaVersion: 1 as const,
        origin,
        intervalStartOffsetSec: command.intervalStartOffsetSec,
        intervalDurationSec: command.intervalDurationSec,
        coverage: Object.freeze({
          kind: EXACT_SIGNAL_REPLAY_COVERAGE_V1,
          dtSec: MAIN_WIRE_EXACT_SIGNAL_DT_SEC_V1,
          observationStride: 1 as const,
          intervalCount,
          sampleCount: intervalCount + 1,
        }),
        claims: Object.freeze({
          onDemandResimulation: true as const,
          fastForwardIntermediateObservationsRetained:
            false as const,
          restoredBoundaryProvenance:
            "checkpoint-boundary" as const,
          acceptedStepRevisionAndTimeContinuityValidated:
            true as const,
          smoothingOrInterpolationApplied: false as const,
          presentationSamplesConsumed: false as const,
          liveRuntimeBranchMutated: false as const,
        }),
      }) satisfies ExactSignalExportManifestDraftV1;
      return await this.writer.writeExactSignalExport({
        manifest,
        samples: this.streamSamplesV1(
          restored,
          command,
          loaded.cycleLengthSec,
        ),
      });
    } catch (error) {
      if (error instanceof MainWireExactSignalReplayErrorV1) throw error;
      throw replayErrorV1(errorMessageV1(error));
    }
  }

  private async loadOriginV1(
    origin: RuntimeReplayOriginV1,
  ): Promise<LoadedReplayOriginV1> {
    const snapshotRef = replaySnapshotRefV1(origin);
    const [inputValue, snapshotValue] = await Promise.all([
      this.artifacts.readJson(origin.simulationInputRef),
      this.artifacts.readJson(snapshotRef),
    ]);
    const resolvedSessionInput =
      await loadMainWireScientificResolvedSessionInputEnvelopeV1(
        inputValue,
      );
    const snapshotRecord = recordV1(snapshotValue, "snapshot");
    const loaded = snapshotRecord.schemaId
        === MAIN_WIRE_STUDIO_REPLAY_CHECKPOINT_ENVELOPE_V1_SCHEMA_ID
      ? await loadMainWireStudioReplayCheckpointEnvelopeV1(
        snapshotValue,
        {
          simulationInputRef: origin.simulationInputRef,
          resolvedSessionInput,
        },
      )
      : await loadMainWireStudioSnapshotEnvelopeV1(
        snapshotValue,
        {
          simulationInputRef: origin.simulationInputRef,
          baseSessionInputSha256:
            resolvedSessionInput.sessionInputSha256,
        },
      );
    const checkpointV4 = loaded.checkpointV4;
    const expectedTargetInputSha256 =
      await mainWireStudioTargetInputSha256V1(
        checkpointV4.controlTargetState,
        resolvedSessionInput.sessionInputSha256,
      );
    const execution = mainWireStudioExecutionIdentityV1(checkpointV4);
    if (
      expectedTargetInputSha256 !== origin.targetInputSha256
      || checkpointV4.transaction.revision
        !== origin.boundaryRevision
      || !sameTimeV1(
        checkpointV4.transaction.acceptedTimeSec,
        origin.boundaryTimeSec,
      )
      || !sameExecutionIdentityV1(execution, origin.execution)
      || !sameSimulationReleaseRef(
        checkpointV4.releaseRef,
        resolvedSessionInput.releaseRef,
      )
    ) throw replayErrorV1("retained origin identity mismatch");
    return Object.freeze({
      resolvedSessionInput,
      checkpointV4,
      cycleLengthSec: checkpointV4.canonicalPhase.cycleLengthSec,
    });
  }

  private async *streamSamplesV1(
    restored: MainWireStudioHostedSessionV1,
    command: ExactSignalExportCommandV1,
    cycleLengthSec: number,
  ): AsyncGenerator<ExactSignalSampleV1> {
    let session = restored;
    let boundaryFrame = restored.observableFrame;
    let remainingFastForwardSteps =
      gridStepCountV1(command.intervalStartOffsetSec);
    while (remainingFastForwardSteps > 0) {
      const stepCount = Math.min(
        remainingFastForwardSteps,
        MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .maximumTransientStepCountPerCommand,
      );
      const chunk = await this.host.runTransient({
        session,
        dtSec: MAIN_WIRE_EXACT_SIGNAL_DT_SEC_V1,
        stepCount,
        // The command protocol always returns its final observation. Asking
        // for only that boundary keeps fast-forward history out of export.
        observationStride: stepCount,
      });
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
      assertTransientChunkV1(session, chunk, stepCount, 1);
      session = chunk.session;
      for (const frame of chunk.observableFrames) {
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
  resolvedSessionInput: MainWireScientificResolvedSessionInputV1;
  checkpointV4: Parameters<
    MainWireStudioSessionHostV1["restoreV4"]
  >[0]["checkpointV4"];
  cycleLengthSec: number;
}>;

function assertCommandOriginBindingV1(
  origin: RuntimeReplayOriginV1,
  command: ExactSignalExportCommandV1,
): void {
  if (
    origin.sessionId !== command.sessionId
    || origin.scenarioId !== command.scenarioId
    || origin.liveBranchId !== command.liveBranchId
    || origin.targetGeneration !== command.targetGeneration
    || origin.presentationRevision !== command.presentationRevision
    || !finiteGridDurationV1(command.intervalStartOffsetSec, true)
    || !finiteGridDurationV1(command.intervalDurationSec, false)
  ) throw replayErrorV1("command and retained origin do not match");
}

function assertRestoreBindingV1(
  origin: RuntimeReplayOriginV1,
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
    || restored.stateIdentity.revision !== origin.boundaryRevision
    || !sameTimeV1(
      restored.stateIdentity.acceptedTimeSec,
      origin.boundaryTimeSec,
    )
    || restored.observableFrame.revision !== origin.boundaryRevision
    || restored.observableFrame.source !== "exact-checkpoint-restore"
    || !sameTimeV1(
      restored.observableFrame.acceptedTimeSec,
      origin.boundaryTimeSec,
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
  });
}

function replaySnapshotRefV1(
  origin: RuntimeReplayOriginV1,
): SnapshotEnvelopeRefV1 {
  switch (origin.kind) {
    case "opened-run":
      return origin.sourceSnapshotRef;
    case "live-transition":
      return origin.replayCheckpointRef;
    case "promoted-steady-candidate":
      return origin.promotedSnapshotRef;
  }
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

function sameTimeV1(left: number, right: number): boolean {
  return Math.abs(left - right) <= TIME_TOLERANCE_SEC_V1;
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
