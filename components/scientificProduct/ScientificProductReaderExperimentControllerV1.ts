import type {
  ScientificWorkbenchDisplayedEvidenceV0,
  ScientificWorkbenchResearchControlSnapshotV0,
  ScientificWorkbenchResearchControlStoreV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
  type ScientificObservableAvailabilityV1,
} from "@/engine/scientific/observables";
import type {
  ReaderBriefV1,
  ReaderControlSpecV1,
  ReaderInstantaneousReadbackSpecV1,
  ReaderSignalSpecV1,
} from "@/studio/contracts/v1/content";

import type {
  ScientificProductStudioScenarioRuntimeV1,
} from "./ScientificProductStudioScenarioRegistryV1";

const SYSTEMIC_PARAMETER_KEY_V1 =
  "circulation.systemic-vascular-resistance-scale" as const;

const SUPPORTED_SIGNAL_IDS_V1 = new Set<string>(
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1,
);

export type ScientificProductReaderRuntimePortV1 = Readonly<{
  scenarioId: ScientificProductStudioScenarioRuntimeV1["scenarioId"];
  controlStore: ScientificProductStudioScenarioRuntimeV1["controlStore"];
  controller: Readonly<
    Pick<ScientificProductStudioScenarioRuntimeV1["controller"], "status">
  >;
}>;

export type ScientificProductReaderExperimentPhaseV1 =
  | "seed"
  | "running"
  | "updating"
  | "paused"
  | "failed";

export type ScientificProductReaderStrictActivityV1 =
  | "source-settled"
  | "running"
  | "settled"
  | "failed";

export type ScientificProductReaderSignalAvailabilityV1 =
  | ScientificObservableAvailabilityV1
  | "missing-from-runtime-frame";

export type ScientificProductReaderSignalPointV1 = Readonly<{
  acceptedTimeSec: number;
  values: Readonly<Record<string, number | null>>;
  availability: Readonly<Record<
    string,
    ScientificProductReaderSignalAvailabilityV1
  >>;
}>;

export type ScientificProductReaderSelectedSignalSeriesV1 = Readonly<{
  signals: readonly ReaderSignalSpecV1[];
  points: readonly ScientificProductReaderSignalPointV1[];
}>;

export type ScientificProductReaderInstantaneousReadbackV1 = Readonly<{
  readbackId: string;
  signalId: string;
  label: string;
  unit: string;
  value: number | null;
  availability: ScientificProductReaderSignalAvailabilityV1;
}>;

export type ScientificProductReaderAllowedControlV1 = Readonly<{
  controlId: string;
  label: string;
  unit: string;
  parameterKey: string;
  value: number;
  allowedValues: readonly number[];
}>;

export type ScientificProductReaderExperimentSnapshotV1 = Readonly<{
  phase: ScientificProductReaderExperimentPhaseV1;
  message: string;
  errorMessage: string | null;
  timeScale: 1;
  canonicalSeedPointCount: 1;
  startedFromOnePoint: true;
  targetGeneration: number;
  strictActivity: ScientificProductReaderStrictActivityV1;
  evidence: ScientificWorkbenchDisplayedEvidenceV0;
  selectedSignalSeries: ScientificProductReaderSelectedSignalSeriesV1;
  instantaneousReadbacks:
    readonly ScientificProductReaderInstantaneousReadbackV1[];
  allowedControls: readonly ScientificProductReaderAllowedControlV1[];
}>;

/**
 * Reader-only presentation boundary around one Studio scenario.
 *
 * The facade intentionally does not expose the Workbench store, mutable draft,
 * candidate lifecycle, pinning, promotion, or persistence. Its first snapshot
 * is always projected from the canonical one-point source. Live presentation
 * begins only when the Reader surface explicitly calls `startPresentation`.
 */
export class ScientificProductReaderExperimentControllerV1 {
  private readonly runtime: ScientificProductReaderRuntimePortV1;
  private readonly graphSignals: readonly ReaderSignalSpecV1[];
  private readonly readbackSpecs:
    readonly ReaderInstantaneousReadbackSpecV1[];
  private readonly controls: readonly ReaderControlSpecV1[];
  private readonly controlsByParameterKey:
    ReadonlyMap<string, ReaderControlSpecV1>;
  private readonly listeners = new Set<() => void>();
  private snapshot: ScientificProductReaderExperimentSnapshotV1;
  private unsubscribeRuntime: (() => void) | null = null;
  private disposed = false;

  private constructor(
    brief: ReaderBriefV1,
    runtime: ScientificProductReaderRuntimePortV1,
  ) {
    this.runtime = runtime;
    const normalized = validateAndNormalizeBriefV1(brief, runtime);
    this.graphSignals = normalized.graphSignals;
    this.readbackSpecs = normalized.readbackSpecs;
    this.controls = normalized.controls;
    this.controlsByParameterKey = normalized.controlsByParameterKey;

    const runtimeSnapshot = runtime.controlStore.getSnapshot();
    const seedFrames = runtimeSnapshot.source.frames;
    if (seedFrames.length !== 1 || seedFrames[0] === undefined) {
      throw new Error(
        "Reader Preview requires exactly one canonical source point",
      );
    }
    assertSourceControlAlignmentV1(this.controls, runtimeSnapshot);
    this.snapshot = this.projectSnapshotV1(
      runtimeSnapshot,
      seedFrames,
      "seed",
      0,
      "source-settled",
      "Ready to start from the canonical one-point source.",
      null,
      "settled-snapshot-one-point",
      true,
    );
  }

  static create(input: Readonly<{
    brief: ReaderBriefV1;
    runtime: ScientificProductReaderRuntimePortV1;
  }>): ScientificProductReaderExperimentControllerV1 {
    return new ScientificProductReaderExperimentControllerV1(
      input.brief,
      input.runtime,
    );
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot =
    (): ScientificProductReaderExperimentSnapshotV1 => this.snapshot;

  /**
   * Opens the deterministic first-render seam. Subscription is installed
   * before reading the current snapshot, so no runtime publication is lost.
   */
  startPresentation(): void {
    this.assertActiveV1("start presentation");
    if (this.unsubscribeRuntime !== null) return;
    this.unsubscribeRuntime = this.runtime.controlStore.subscribe(
      this.onRuntimeStoreChangeV1,
    );
    this.publishCurrentRuntimeV1();
  }

  /** Stops observing runtime state and leaves the last accepted view frozen. */
  stopPresentation(): void {
    this.unsubscribeRuntime?.();
    this.unsubscribeRuntime = null;
  }

  /**
   * Commits only an article-allowlisted absolute parameter value. The brief is
   * immutable content; the mutation is delegated solely to this runtime
   * session's control owner.
   */
  commitControl(parameterKey: string, value: number): void {
    this.assertActiveV1("commit a control");
    const control = this.controlsByParameterKey.get(parameterKey);
    if (control === undefined) {
      throw new Error(
        `Reader Preview does not allow parameter ${parameterKey}`,
      );
    }
    if (
      !Number.isFinite(value)
      || !control.allowedValues.some((allowed) => allowed === value)
    ) {
      throw new Error(
        `Reader Preview value ${String(value)} is not allowed for ${parameterKey}`,
      );
    }
    switch (parameterKey) {
      case SYSTEMIC_PARAMETER_KEY_V1:
        this.runtime.controlStore.actions.commitControlValue(
          SYSTEMIC_PARAMETER_KEY_V1,
          value,
        );
        return;
      default:
        throw new Error(
          `Reader Preview has no runtime mapping for ${parameterKey}`,
        );
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.stopPresentation();
    this.disposed = true;
    this.listeners.clear();
  }

  private readonly onRuntimeStoreChangeV1 = (): void => {
    if (this.disposed || this.unsubscribeRuntime === null) return;
    this.publishCurrentRuntimeV1();
  };

  private publishCurrentRuntimeV1(): void {
    const runtimeSnapshot = this.runtime.controlStore.getSnapshot();
    const status = this.runtime.controller.status;
    const phase = readerPhaseV1(runtimeSnapshot);
    const next = this.projectSnapshotV1(
      runtimeSnapshot,
      runtimeSnapshot.frames,
      phase,
      status.targetGeneration,
      readerStrictActivityV1(status.strictPhase),
      runtimeSnapshot.message,
      runtimeSnapshot.errorMessage,
      runtimeSnapshot.provenance.displayedEvidence,
      false,
    );
    this.snapshot = next;
    for (const listener of [...this.listeners]) listener();
  }

  private projectSnapshotV1(
    runtimeSnapshot: ScientificWorkbenchResearchControlSnapshotV0,
    frames: readonly MainWireScientificObservableFrameV1[],
    phase: ScientificProductReaderExperimentPhaseV1,
    targetGeneration: number,
    strictActivity: ScientificProductReaderStrictActivityV1,
    message: string,
    errorMessage: string | null,
    evidence: ScientificWorkbenchDisplayedEvidenceV0,
    useSourceControlValues: boolean,
  ): ScientificProductReaderExperimentSnapshotV1 {
    const selectedSignalSeries = Object.freeze({
      signals: this.graphSignals,
      points: Object.freeze(frames.map((frame) =>
        projectSignalPointV1(frame, this.graphSignals)
      )),
    });
    const lastFrame = frames.at(-1);
    const instantaneousReadbacks = Object.freeze(
      this.readbackSpecs.map((spec) =>
        projectReadbackV1(lastFrame, spec)
      ),
    );
    const allowedControls = Object.freeze(
      this.controls.map((control) => Object.freeze({
        controlId: control.controlId,
        label: control.label,
        unit: control.unit,
        parameterKey: control.binding.parameterKey,
        value: useSourceControlValues
          ? sourceControlValueV1(runtimeSnapshot, control.binding.parameterKey)
          : currentControlValueV1(
            runtimeSnapshot,
            control.binding.parameterKey,
          ),
        allowedValues: control.allowedValues,
      })),
    );
    return Object.freeze({
      phase,
      message,
      errorMessage,
      timeScale: 1 as const,
      canonicalSeedPointCount: 1 as const,
      startedFromOnePoint: true as const,
      targetGeneration,
      strictActivity,
      evidence,
      selectedSignalSeries,
      instantaneousReadbacks,
      allowedControls,
    });
  }

  private assertActiveV1(action: string): void {
    if (this.disposed) {
      throw new Error(`Reader Preview cannot ${action} after disposal`);
    }
  }
}

type NormalizedReaderBriefV1 = Readonly<{
  graphSignals: readonly ReaderSignalSpecV1[];
  readbackSpecs: readonly ReaderInstantaneousReadbackSpecV1[];
  controls: readonly ReaderControlSpecV1[];
  controlsByParameterKey: ReadonlyMap<string, ReaderControlSpecV1>;
}>;

function validateAndNormalizeBriefV1(
  brief: ReaderBriefV1,
  runtime: ScientificProductReaderRuntimePortV1,
): NormalizedReaderBriefV1 {
  const graphSignals = normalizeSignalsV1(brief.graph.signals);
  const readbackSpecs = normalizeReadbacksV1(
    brief.instantaneousReadbacks,
  );
  const controls = normalizeControlsV1(brief.controls, runtime.scenarioId);
  return Object.freeze({
    graphSignals,
    readbackSpecs,
    controls,
    controlsByParameterKey: new Map(
      controls.map((control) => [
        control.binding.parameterKey,
        control,
      ]),
    ),
  });
}

function normalizeSignalsV1(
  signals: readonly ReaderSignalSpecV1[],
): readonly ReaderSignalSpecV1[] {
  const ids = new Set<string>();
  return Object.freeze(signals.map((signal) => {
    assertSupportedSignalV1(signal.signalId);
    if (ids.has(signal.signalId)) {
      throw new Error(
        `Reader Preview graph repeats signal ${signal.signalId}`,
      );
    }
    ids.add(signal.signalId);
    return Object.freeze({ ...signal });
  }));
}

function normalizeReadbacksV1(
  readbacks: readonly ReaderInstantaneousReadbackSpecV1[],
): readonly ReaderInstantaneousReadbackSpecV1[] {
  const ids = new Set<string>();
  return Object.freeze(readbacks.map((readback) => {
    assertSupportedSignalV1(readback.signalId);
    if (ids.has(readback.readbackId)) {
      throw new Error(
        `Reader Preview repeats readback ${readback.readbackId}`,
      );
    }
    ids.add(readback.readbackId);
    return Object.freeze({ ...readback });
  }));
}

function normalizeControlsV1(
  controls: readonly ReaderControlSpecV1[],
  scenarioId: string,
): readonly ReaderControlSpecV1[] {
  const controlIds = new Set<string>();
  const parameterKeys = new Set<string>();
  return Object.freeze(controls.map((control) => {
    if (controlIds.has(control.controlId)) {
      throw new Error(
        `Reader Preview repeats control ${control.controlId}`,
      );
    }
    controlIds.add(control.controlId);
    const parameterKey = control.binding.parameterKey;
    if (
      parameterKey !== SYSTEMIC_PARAMETER_KEY_V1
      || parameterKeys.has(parameterKey)
    ) {
      throw new Error(
        `Reader Preview has no unique runtime mapping for ${parameterKey}`,
      );
    }
    parameterKeys.add(parameterKey);
    if (
      control.binding.target.scenarioIds.length !== 1
      || control.binding.target.scenarioIds[0] !== scenarioId
    ) {
      throw new Error(
        `Reader Preview control ${control.controlId} must target only scenario ${scenarioId}`,
      );
    }
    if (
      control.allowedValues.length === 0
      || control.allowedValues.some((value) => !Number.isFinite(value))
      || new Set(control.allowedValues).size !== control.allowedValues.length
      || !control.allowedValues.some((value) =>
        value === control.initialValue
      )
    ) {
      throw new Error(
        `Reader Preview control ${control.controlId} has an invalid value allowlist`,
      );
    }
    if (control.binding.readbackSignalId !== null) {
      assertSupportedSignalV1(control.binding.readbackSignalId);
    }
    return Object.freeze({
      ...control,
      allowedValues: Object.freeze([...control.allowedValues]),
      binding: Object.freeze({
        ...control.binding,
        target: Object.freeze({
          ...control.binding.target,
          scenarioIds: Object.freeze([
            ...control.binding.target.scenarioIds,
          ]),
        }),
      }),
    });
  }));
}

function assertSourceControlAlignmentV1(
  controls: readonly ReaderControlSpecV1[],
  snapshot: ScientificWorkbenchResearchControlSnapshotV0,
): void {
  for (const control of controls) {
    const sourceValue = sourceControlValueV1(
      snapshot,
      control.binding.parameterKey,
    );
    if (sourceValue !== control.initialValue) {
      throw new Error(
        `Reader Preview control ${control.controlId} initial value does not match the runtime source`,
      );
    }
  }
}

function assertSupportedSignalV1(signalId: string): void {
  if (!SUPPORTED_SIGNAL_IDS_V1.has(signalId)) {
    throw new Error(
      `Reader Preview signal ${signalId} is not in the runtime registry`,
    );
  }
}

function projectSignalPointV1(
  frame: MainWireScientificObservableFrameV1,
  signals: readonly ReaderSignalSpecV1[],
): ScientificProductReaderSignalPointV1 {
  const values: Record<string, number | null> = {};
  const availability: Record<
    string,
    ScientificProductReaderSignalAvailabilityV1
  > = {};
  for (const signal of signals) {
    const observable = frame.values[
      signal.signalId as MainWireScientificObservableIdV1
    ];
    values[signal.signalId] = observable?.value ?? null;
    availability[signal.signalId] =
      observable?.availability ?? "missing-from-runtime-frame";
  }
  return Object.freeze({
    acceptedTimeSec: frame.acceptedTimeSec,
    values: Object.freeze(values),
    availability: Object.freeze(availability),
  });
}

function projectReadbackV1(
  frame: MainWireScientificObservableFrameV1 | undefined,
  spec: ReaderInstantaneousReadbackSpecV1,
): ScientificProductReaderInstantaneousReadbackV1 {
  const observable = frame?.values[
    spec.signalId as MainWireScientificObservableIdV1
  ];
  return Object.freeze({
    readbackId: spec.readbackId,
    signalId: spec.signalId,
    label: spec.label,
    unit: spec.unit,
    value: observable?.value ?? null,
    availability:
      observable?.availability ?? "missing-from-runtime-frame",
  });
}

function sourceControlValueV1(
  snapshot: ScientificWorkbenchResearchControlSnapshotV0,
  parameterKey: string,
): number {
  switch (parameterKey) {
    case SYSTEMIC_PARAMETER_KEY_V1:
      return snapshot.source.context.controlState.controls[
        SYSTEMIC_PARAMETER_KEY_V1
      ];
    default:
      throw new Error(
        `Reader Preview has no source mapping for ${parameterKey}`,
      );
  }
}

function currentControlValueV1(
  snapshot: ScientificWorkbenchResearchControlSnapshotV0,
  parameterKey: string,
): number {
  switch (parameterKey) {
    case SYSTEMIC_PARAMETER_KEY_V1:
      return snapshot.draft.systemic;
    default:
      throw new Error(
        `Reader Preview has no current-value mapping for ${parameterKey}`,
      );
  }
}

function readerPhaseV1(
  snapshot: ScientificWorkbenchResearchControlSnapshotV0,
): ScientificProductReaderExperimentPhaseV1 {
  if (snapshot.phase === "failed" || snapshot.errorMessage !== null) {
    return "failed";
  }
  switch (snapshot.phase) {
    case "live-retargeting":
    case "live-forking":
    case "resetting":
      return "updating";
    case "live-paused":
    case "live-pause-requested":
      return "paused";
    default:
      return "running";
  }
}

function readerStrictActivityV1(
  phase: ScientificProductStudioScenarioRuntimeV1["controller"]["status"]["strictPhase"],
): ScientificProductReaderStrictActivityV1 {
  switch (phase) {
    case "source-settled":
      return "source-settled";
    case "running":
      return "running";
    case "candidate-ready":
    case "settled-in-use":
      return "settled";
    case "failed":
      return "failed";
  }
}
