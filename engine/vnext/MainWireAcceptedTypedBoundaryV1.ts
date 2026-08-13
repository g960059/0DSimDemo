import type {
  MainWireIntegratedModelCandidateTimeLimitV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type {
  AcceptedComposedRhythmTransactionConfigurationV2,
  AcceptedComposedRhythmTransactionCandidateTimeLimitV2,
  ComposedRhythmCalciumParametersByWallV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  advanceExactEventCalciumV1,
  type ExactEventCalciumEventV1,
  type ExactEventCalciumParametersV1,
  type ExactEventCalciumStateV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_FINGERPRINT,
  MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_ID,
} from "@/engine/vnext/MainWireAcceptedTypedStateV1";
import type {
  TransactionalTypedStateCandidateCursorV1,
  TransactionalTypedStateCurrentCursorV1,
  TransactionalTypedStateManifestV1,
} from "@/engine/vnext/TransactionalTypedStateImageV1";

export const MAIN_WIRE_ACCEPTED_TYPED_BOUNDARY_V1_ID =
  "main-wire-integrated-accepted-typed-boundary-v1" as const;

export type MainWireAcceptedTypedClockV1 = Readonly<{
  acceptedTimeSec: number;
  revision: number;
}>;

type Boundary = Readonly<{ owner: string; timeSec: number }>;

const CALCIUM_WALLS = Object.freeze([
  "LA", "LVFW", "RA", "RVFW", "SEP",
] as const);
type CalciumWall = (typeof CALCIUM_WALLS)[number];

type ContinuousBinding = Readonly<{
  acceptedTimeSec: number;
  composedAcceptedTimeSec: number;
  authoredEctopyCursor: number;
  regularAtrialNextActivationTimeSec: number;
  composedRevision: number;
  ventricularBackupNextIntrinsicEscapeDueTimeSec: number;
  ventricularBackupNextVviPaceDueTimeSec: number;
  coronaryAcceptedTimeSec: number;
  autoregulationWindowIndex: number;
  autoregulationWindowOriginAcceptedTimeSec: number;
  autoregulationWindowStartAcceptedTimeSec: number;
  autoregulationWindowDurationSec: number;
  autoregulationBindingOriginAcceptedTimeSec: number;
  coronaryRevision: number;
  revision: number;
}>;

type DynamicBinding = Readonly<{
  authoredVentricularPacingReplayState: number;
}>;

type BoundedArrayBinding = Readonly<{
  pendingCalciumDeposits: number;
  pendingDistalVentricularImpulses: number;
  pendingProximalAvOutputs: number;
}>;

export type MainWireAcceptedTypedBoundaryBindingV1 = Readonly<{
  layoutId: typeof MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_ID;
  fingerprint: typeof MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_FINGERPRINT;
  continuous: ContinuousBinding;
  dynamic: DynamicBinding;
  boundedArray: BoundedArrayBinding;
  calcium: Readonly<Record<CalciumWall, Readonly<{
    state: readonly [number, number];
  }>>>;
  directContinuousSlots: readonly number[];
}>;

/** Resolves model paths once; the accepted hot loop performs no string lookup. */
export function createMainWireAcceptedTypedBoundaryBindingV1(
  manifest: TransactionalTypedStateManifestV1,
): MainWireAcceptedTypedBoundaryBindingV1 {
  if (
    manifest.layoutId !== MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_ID
    || manifest.fingerprint
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_FINGERPRINT
  ) {
    throw new Error("Main Wire typed boundary manifest identity is unsupported");
  }
  const continuous = Object.freeze({
    acceptedTimeSec: continuousSlot(manifest, "/acceptedTimeSec"),
    composedAcceptedTimeSec:
      continuousSlot(manifest, "/composedRhythm/acceptedTimeSec"),
    authoredEctopyCursor:
      continuousSlot(manifest, "/composedRhythm/authoredEctopyState/cursor"),
    regularAtrialNextActivationTimeSec: continuousSlot(
      manifest,
      "/composedRhythm/regularAtrialSourceState/nextActivationTimeSec",
    ),
    composedRevision: continuousSlot(manifest, "/composedRhythm/revision"),
    ventricularBackupNextIntrinsicEscapeDueTimeSec: continuousSlot(
      manifest,
      "/composedRhythm/ventricularBackupState/nextIntrinsicEscapeDueTimeSec",
    ),
    ventricularBackupNextVviPaceDueTimeSec: continuousSlot(
      manifest,
      "/composedRhythm/ventricularBackupState/nextVviPaceDueTimeSec",
    ),
    coronaryAcceptedTimeSec:
      continuousSlot(manifest, "/coronary/acceptedTimeSec"),
    autoregulationWindowIndex: continuousSlot(
      manifest,
      "/coronary/coronaryAutoregulation/windowIndex",
    ),
    autoregulationWindowOriginAcceptedTimeSec: continuousSlot(
      manifest,
      "/coronary/coronaryAutoregulation/windowOriginAcceptedTimeSec",
    ),
    autoregulationWindowStartAcceptedTimeSec: continuousSlot(
      manifest,
      "/coronary/coronaryAutoregulation/windowStartAcceptedTimeSec",
    ),
    autoregulationWindowDurationSec: continuousSlot(
      manifest,
      "/coronary/coronaryAutoregulationBinding/windowPolicy/durationSec",
    ),
    autoregulationBindingOriginAcceptedTimeSec: continuousSlot(
      manifest,
      "/coronary/coronaryAutoregulationBinding/windowPolicy/originAcceptedTimeSec",
    ),
    coronaryRevision: continuousSlot(manifest, "/coronary/revision"),
    revision: continuousSlot(manifest, "/revision"),
  });
  const dynamic = Object.freeze({
    authoredVentricularPacingReplayState: dynamicSlot(
      manifest,
      "/composedRhythm/authoredVentricularPacingReplayState",
    ),
  });
  const boundedArray = Object.freeze({
    pendingCalciumDeposits:
      boundedArraySlot(manifest, "/composedRhythm/pendingCalciumDeposits"),
    pendingDistalVentricularImpulses: boundedArraySlot(
      manifest,
      "/composedRhythm/pendingDistalVentricularImpulses",
    ),
    pendingProximalAvOutputs:
      boundedArraySlot(manifest, "/composedRhythm/pendingProximalAvOutputs"),
  });
  const calcium = Object.freeze(Object.fromEntries(CALCIUM_WALLS.map((wall) => [
    wall,
    Object.freeze({
      state: Object.freeze([
        continuousSlot(
          manifest,
          `/composedRhythm/calciumStateByWall/${wall}/0`,
        ),
        continuousSlot(
          manifest,
          `/composedRhythm/calciumStateByWall/${wall}/1`,
        ),
      ]) as readonly [number, number],
    }),
  ])) as Record<CalciumWall, Readonly<{
    state: readonly [number, number];
  }>>);
  const clockSlots = Object.freeze([
    continuous.acceptedTimeSec,
    continuous.composedAcceptedTimeSec,
    continuous.coronaryAcceptedTimeSec,
    continuous.composedRevision,
    continuous.coronaryRevision,
    continuous.revision,
  ]);
  const calciumSlots = Object.freeze(CALCIUM_WALLS.flatMap((wall) =>
    [...calcium[wall].state]));
  return Object.freeze({
    layoutId: MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_ID,
    fingerprint: MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_FINGERPRINT,
    continuous,
    dynamic,
    boundedArray,
    calcium,
    directContinuousSlots: Object.freeze([...clockSlots, ...calciumSlots]),
  });
}

/** Reads the authoritative outer clock without rebuilding the object graph. */
export function readMainWireAcceptedTypedClockV1(
  cursor: TransactionalTypedStateCurrentCursorV1,
  binding: MainWireAcceptedTypedBoundaryBindingV1,
): MainWireAcceptedTypedClockV1 {
  assertCursor(cursor, binding);
  const f64 = binding.continuous;
  const acceptedTimeSec = finiteNonnegative(
    cursor.readContinuous(f64.acceptedTimeSec),
    "outer accepted time",
  );
  const revision = nonnegativeSafeInteger(
    cursor.readContinuous(f64.revision),
    "outer revision",
  );
  const composedAcceptedTimeSec = cursor.readContinuous(
    f64.composedAcceptedTimeSec,
  );
  const coronaryAcceptedTimeSec = cursor.readContinuous(
    f64.coronaryAcceptedTimeSec,
  );
  const composedRevision = cursor.readContinuous(f64.composedRevision);
  const coronaryRevision = cursor.readContinuous(f64.coronaryRevision);
  if (
    composedAcceptedTimeSec !== acceptedTimeSec
    || coronaryAcceptedTimeSec !== acceptedTimeSec
    || composedRevision !== revision
    || coronaryRevision !== revision
  ) {
    throw new Error("Main Wire typed accepted owner clocks diverged");
  }
  return Object.freeze({ acceptedTimeSec, revision });
}

/** Writes the exact six-slot outer/composed/coronary clock tuple. */
export function stageMainWireAcceptedTypedClockCandidateV1(
  current: TransactionalTypedStateCurrentCursorV1,
  candidate: TransactionalTypedStateCandidateCursorV1,
  binding: MainWireAcceptedTypedBoundaryBindingV1,
  candidateTimeSec: number,
): MainWireAcceptedTypedClockV1 {
  assertCursor(current, binding);
  assertCandidateCursor(candidate, binding);
  const previous = readMainWireAcceptedTypedClockV1(current, binding);
  const f64 = binding.continuous;
  const acceptedTimeSec = finiteNonnegative(
    candidateTimeSec,
    "clock candidate time",
  );
  if (!(acceptedTimeSec > previous.acceptedTimeSec)) {
    throw new Error("Main Wire typed clock candidate must advance");
  }
  if (previous.revision === Number.MAX_SAFE_INTEGER) {
    throw new Error("Main Wire typed clock revision cannot increment safely");
  }
  const revision = previous.revision + 1;
  candidate.writeContinuous(f64.acceptedTimeSec, acceptedTimeSec);
  candidate.writeContinuous(f64.composedAcceptedTimeSec, acceptedTimeSec);
  candidate.writeContinuous(f64.coronaryAcceptedTimeSec, acceptedTimeSec);
  candidate.writeContinuous(f64.revision, revision);
  candidate.writeContinuous(f64.composedRevision, revision);
  candidate.writeContinuous(f64.coronaryRevision, revision);
  return Object.freeze({ acceptedTimeSec, revision });
}

/**
 * Determines the next accepted boundary from the active typed image. This is
 * the first scheduling path that no longer treats the rehydrated legacy state
 * object as authority. Dynamic queues are decoded independently from their
 * bounded slots; the rest are fixed-offset reads.
 */
export function limitMainWireAcceptedTypedCandidateTimeV1(
  cursor: TransactionalTypedStateCurrentCursorV1,
  binding: MainWireAcceptedTypedBoundaryBindingV1,
  requestedCandidateTimeSec: number,
  configuration: AcceptedComposedRhythmTransactionConfigurationV2,
  externalAfNextBoundaryTimeSec: number | null,
): MainWireIntegratedModelCandidateTimeLimitV3 {
  const clock = readMainWireAcceptedTypedClockV1(cursor, binding);
  const f64 = binding.continuous;
  const requestedCandidateTime = finiteNonnegative(
    requestedCandidateTimeSec,
    "requested candidate time",
  );
  if (!(requestedCandidateTime > clock.acceptedTimeSec)) {
    throw new Error("Main Wire typed requested endpoint must advance");
  }

  const windowIndex = nonnegativeSafeInteger(
    cursor.readContinuous(f64.autoregulationWindowIndex),
    "autoregulation window index",
  );
  const stateWindowOrigin = finiteNonnegative(
    cursor.readContinuous(f64.autoregulationWindowOriginAcceptedTimeSec),
    "autoregulation state window origin",
  );
  const bindingWindowOrigin = finiteNonnegative(
    cursor.readContinuous(f64.autoregulationBindingOriginAcceptedTimeSec),
    "autoregulation binding window origin",
  );
  const windowDurationSec = positiveFinite(
    cursor.readContinuous(f64.autoregulationWindowDurationSec),
    "autoregulation window duration",
  );
  if (stateWindowOrigin !== bindingWindowOrigin) {
    throw new Error("Main Wire typed autoregulation origins diverged");
  }
  const expectedWindowStart = bindingWindowOrigin
    + windowIndex * windowDurationSec;
  if (
    cursor.readContinuous(f64.autoregulationWindowStartAcceptedTimeSec)
      !== expectedWindowStart
  ) {
    throw new Error("Main Wire typed autoregulation window start diverged");
  }
  const windowEnd = bindingWindowOrigin
    + (windowIndex + 1) * windowDurationSec;
  const windowTolerance = timeTolerance(
    windowEnd,
    clock.acceptedTimeSec,
  );
  const windowRemaining = windowEnd - clock.acceptedTimeSec;
  if (windowRemaining < -windowTolerance) {
    throw new Error("Main Wire typed accepted clock passed its coronary window");
  }
  const coronaryWindowMaximumStepSec = windowRemaining <= windowTolerance
    ? 0
    : windowRemaining;
  const requestedStepSec = requestedCandidateTime - clock.acceptedTimeSec;
  const tolerance = timeTolerance(clock.acceptedTimeSec, requestedStepSec);
  const clippedByCoronaryWindow =
    coronaryWindowMaximumStepSec < requestedStepSec - tolerance;
  const coronaryCappedEndTimeSec = clippedByCoronaryWindow
    ? clock.acceptedTimeSec + coronaryWindowMaximumStepSec
    : requestedCandidateTime;
  if (!(coronaryCappedEndTimeSec > clock.acceptedTimeSec)) {
    throw new Error("Main Wire typed coronary-capped step must be positive");
  }

  const rhythm = limitTypedRhythmBoundary(
    cursor,
    binding,
    clock.acceptedTimeSec,
    coronaryCappedEndTimeSec,
    configuration,
    externalAfNextBoundaryTimeSec,
  );
  const boundaryTime = rhythm.boundaryTimeSec;
  return Object.freeze({
    requestedCandidateTimeSec: requestedCandidateTime,
    coronaryWindowMaximumStepSec,
    coronaryCappedEndTimeSec,
    rhythm,
    candidateTimeSec: rhythm.candidateTimeSec,
    clippedByCoronaryWindow,
    clippedByRhythmBoundary:
      boundaryTime !== null
      && boundaryTime < coronaryCappedEndTimeSec - tolerance,
    rhythmBoundaryTimeSec: boundaryTime,
    rhythmBoundaryOwners: rhythm.boundaryOwners,
    coronaryWindowAndRhythmBoundaryTie:
      boundaryTime !== null
      && boundaryTime === coronaryCappedEndTimeSec
      && coronaryWindowMaximumStepSec <= requestedStepSec + tolerance,
  });
}

/** Exact-event calcium readback from ten fixed state slots. */
export function evaluateMainWireAcceptedTypedCalciumDriveV1(
  cursor: TransactionalTypedStateCurrentCursorV1,
  binding: MainWireAcceptedTypedBoundaryBindingV1,
  parametersByWall: ComposedRhythmCalciumParametersByWallV2,
): MainWireFiveWallFreeCalciumDriveV1 {
  assertCursor(cursor, binding);
  const values = Object.fromEntries(
    CALCIUM_WALLS.map((wall) => {
      const slots = binding.calcium[wall];
      const riseDrive = cursor.readContinuous(slots.state[0]);
      const decayDrive = cursor.readContinuous(slots.state[1]);
      const parameters = parametersByWall[wall];
      const gain = parameters.calciumGainUMPerUnitDrive;
      const calciumRestUM = parameters.calciumRestUM;
      const freeCalciumUM = calciumRestUM + gain * (decayDrive - riseDrive);
      if (!Number.isFinite(freeCalciumUM) || freeCalciumUM < 0) {
        throw new Error(`Main Wire typed ${wall} calcium is invalid`);
      }
      return [wall, freeCalciumUM];
    }),
  ) as MainWireFiveWallFreeCalciumDriveV1["freeCalciumUMByWall"];
  return Object.freeze({ freeCalciumUMByWall: Object.freeze(values) });
}

/**
 * First direct state-owner write: exact-event calcium advances from fixed
 * current slots into a generation-bound inactive candidate cursor. Other
 * owners remain byte-identical until their own typed transaction runs.
 */
export function stageMainWireAcceptedTypedCalciumCandidateV1(
  current: TransactionalTypedStateCurrentCursorV1,
  candidate: TransactionalTypedStateCandidateCursorV1,
  binding: MainWireAcceptedTypedBoundaryBindingV1,
  candidateTimeSec: number,
  parametersByWall: ComposedRhythmCalciumParametersByWallV2,
): void {
  assertCursor(current, binding);
  assertCandidateCursor(candidate, binding);
  const f64 = binding.continuous;
  const startTimeSec = finiteNonnegative(
    current.readContinuous(f64.composedAcceptedTimeSec),
    "calcium start time",
  );
  const endTimeSec = finiteNonnegative(
    candidateTimeSec,
    "calcium candidate time",
  );
  if (!(endTimeSec > startTimeSec)) {
    throw new Error("Main Wire typed calcium candidate must advance");
  }
  const pendingDeposits = requiredArray(
    current.readBoundedArray(binding.boundedArray.pendingCalciumDeposits),
    "pending calcium deposits",
  );

  for (const wall of CALCIUM_WALLS) {
    const slots = binding.calcium[wall];
    const state = Object.freeze([
      current.readContinuous(slots.state[0]),
      current.readContinuous(slots.state[1]),
    ]) as ExactEventCalciumStateV1;
    const parameters: ExactEventCalciumParametersV1 = parametersByWall[wall];
    const events = pendingDeposits.flatMap((deposit): ExactEventCalciumEventV1[] => {
      const record = requiredRecord(deposit, "pending calcium deposit");
      const depositTimeSec = numberProperty(
        record,
        "depositTimeSec",
        "pending calcium deposit",
      );
      if (depositTimeSec !== endTimeSec) return [];
      const strengths = requiredRecord(
        ownValue(record, "strengthByWall"),
        "pending calcium strengths",
      );
      return [Object.freeze({
        timeSec: depositTimeSec,
        strength: finiteNonnegative(
          ownValue(strengths, wall),
          `pending ${wall} calcium strength`,
        ),
      })];
    });
    const next = advanceExactEventCalciumV1(
      state,
      startTimeSec,
      endTimeSec,
      events,
      parameters,
    );
    candidate.writeContinuous(slots.state[0], next[0]);
    candidate.writeContinuous(slots.state[1], next[1]);
  }
}

function limitTypedRhythmBoundary(
  cursor: TransactionalTypedStateCurrentCursorV1,
  binding: MainWireAcceptedTypedBoundaryBindingV1,
  acceptedTimeSec: number,
  requestedCandidateTimeSec: number,
  configuration: AcceptedComposedRhythmTransactionConfigurationV2,
  externalAfNextBoundaryTimeSec: number | null,
): AcceptedComposedRhythmTransactionCandidateTimeLimitV2 {
  const boundaries: Boundary[] = [];
  const atrialSourceMode = configuration.atrialSource.mode;
  if (atrialSourceMode === "regular") {
    boundaries.push(boundary(
      "regular-atrial-source",
      cursor.readContinuous(
        binding.continuous.regularAtrialNextActivationTimeSec,
      ),
      acceptedTimeSec,
    ));
    if (externalAfNextBoundaryTimeSec !== null) {
      throw new Error("Main Wire typed regular atrial mode rejects external AF boundary");
    }
  } else if (atrialSourceMode === "external-af") {
    boundaries.push(boundary(
      "external-af",
      finiteNonnegative(
        externalAfNextBoundaryTimeSec,
        "external AF next boundary",
      ),
      acceptedTimeSec,
    ));
  } else {
    throw new Error("Main Wire typed atrial source mode is unsupported");
  }

  const authoredEctopyEvents = requiredArray(
    configuration.authoredEctopySchedule.events,
    "authored ectopy events",
  );
  const authoredEctopyCursor = nonnegativeSafeInteger(
    cursor.readContinuous(binding.continuous.authoredEctopyCursor),
    "authored ectopy cursor",
  );
  const ectopy = authoredEctopyEvents[authoredEctopyCursor];
  if (ectopy !== undefined) {
    boundaries.push(boundary(
      "authored-ectopy",
      numberProperty(ectopy, "activationTimeSec", "authored ectopy event"),
      acceptedTimeSec,
    ));
  }

  const authoredPacing = cursor.readDynamic(
    binding.dynamic.authoredVentricularPacingReplayState,
  );
  if (authoredPacing !== null) {
    const pacingRecord = requiredRecord(
      authoredPacing,
      "authored ventricular pacing state",
    );
    const pacingConfiguration = requiredRecord(
      ownValue(pacingRecord, "configuration"),
      "authored ventricular pacing configuration",
    );
    const events = requiredArray(
      ownValue(pacingConfiguration, "events"),
      "authored ventricular pacing events",
    );
    const pacingCursor = nonnegativeSafeInteger(
      ownValue(pacingRecord, "cursor"),
      "authored ventricular pacing cursor",
    );
    const event = events[pacingCursor];
    if (event !== undefined) {
      boundaries.push(boundary(
        "authored-ventricular-pacing-replay",
        numberProperty(
          event,
          "activationTimeSec",
          "authored ventricular pacing event",
        ),
        acceptedTimeSec,
      ));
    }
  }

  pushFirstArrayBoundary(
    boundaries,
    cursor.readBoundedArray(binding.boundedArray.pendingProximalAvOutputs),
    "pending-proximal-av-output",
    "proximalArrivalTimeSec",
    acceptedTimeSec,
  );
  pushFirstArrayBoundary(
    boundaries,
    cursor.readBoundedArray(
      binding.boundedArray.pendingDistalVentricularImpulses,
    ),
    "pending-distal-ventricular-impulse",
    "activationTimeSec",
    acceptedTimeSec,
  );
  boundaries.push(boundary(
    "ventricular-backup",
    Math.min(
      cursor.readContinuous(
        binding.continuous.ventricularBackupNextIntrinsicEscapeDueTimeSec,
      ),
      cursor.readContinuous(
        binding.continuous.ventricularBackupNextVviPaceDueTimeSec,
      ),
    ),
    acceptedTimeSec,
  ));
  pushFirstArrayBoundary(
    boundaries,
    cursor.readBoundedArray(binding.boundedArray.pendingCalciumDeposits),
    "pending-calcium-deposit",
    "depositTimeSec",
    acceptedTimeSec,
  );

  const earliest = Math.min(
    requestedCandidateTimeSec,
    ...boundaries.map(({ timeSec }) => timeSec),
  );
  const boundaryOwners = Object.freeze(
    boundaries
      .filter(({ timeSec }) => timeSec === earliest)
      .map(({ owner }) => owner)
      .sort(),
  );
  return Object.freeze({
    requestedCandidateTimeSec,
    candidateTimeSec: earliest,
    boundaryTimeSec: boundaryOwners.length === 0 ? null : earliest,
    boundaryOwners,
  });
}

function pushFirstArrayBoundary(
  destination: Boundary[],
  value: unknown,
  owner: string,
  timeProperty: string,
  acceptedTimeSec: number,
): void {
  const items = requiredArray(value, owner);
  const first = items[0];
  if (first === undefined) return;
  destination.push(boundary(
    owner,
    numberProperty(first, timeProperty, owner),
    acceptedTimeSec,
  ));
}

function boundary(
  owner: string,
  timeSec: number,
  acceptedTimeSec: number,
): Boundary {
  const acceptedBoundary = finiteNonnegative(timeSec, `${owner} boundary`);
  if (!(acceptedBoundary > acceptedTimeSec)) {
    throw new Error(`Main Wire typed ${owner} boundary must be future`);
  }
  return Object.freeze({ owner, timeSec: acceptedBoundary });
}

function numberProperty(
  value: unknown,
  property: string,
  owner: string,
): number {
  return finiteNonnegative(
    ownValue(requiredRecord(value, owner), property),
    `${owner} ${property}`,
  );
}

function ownValue(record: Record<string, unknown>, property: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, property);
  if (descriptor === undefined || !("value" in descriptor)) {
    throw new Error(`Main Wire typed ${property} is unavailable`);
  }
  return descriptor.value;
}

function requiredRecord(
  value: unknown,
  owner: string,
): Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)
  ) {
    throw new Error(`Main Wire typed ${owner} must be a plain record`);
  }
  return value as Record<string, unknown>;
}

function requiredArray(value: unknown, owner: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Main Wire typed ${owner} must be an array`);
  }
  return value;
}

function finiteNonnegative(value: unknown, owner: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Main Wire typed ${owner} must be nonnegative and finite`);
  }
  return value;
}

function positiveFinite(value: unknown, owner: string): number {
  const accepted = finiteNonnegative(value, owner);
  if (!(accepted > 0)) {
    throw new Error(`Main Wire typed ${owner} must be positive`);
  }
  return accepted;
}

function nonnegativeSafeInteger(value: unknown, owner: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`Main Wire typed ${owner} must be a nonnegative safe integer`);
  }
  return value as number;
}

function timeTolerance(left: number, right: number): number {
  return 64 * Number.EPSILON
    * Math.max(1, Math.abs(left), Math.abs(right));
}

function assertCursor(
  cursor: TransactionalTypedStateCurrentCursorV1,
  binding: MainWireAcceptedTypedBoundaryBindingV1,
): void {
  if (
    cursor.layoutId !== MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_ID
    || cursor.fingerprint
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_FINGERPRINT
    || cursor.layoutId !== binding.layoutId
    || cursor.fingerprint !== binding.fingerprint
  ) {
    throw new Error("Main Wire typed boundary cursor has the wrong layout");
  }
}

function assertCandidateCursor(
  cursor: TransactionalTypedStateCandidateCursorV1,
  binding: MainWireAcceptedTypedBoundaryBindingV1,
): void {
  if (
    cursor.layoutId !== MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_ID
    || cursor.fingerprint
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_FINGERPRINT
    || cursor.layoutId !== binding.layoutId
    || cursor.fingerprint !== binding.fingerprint
  ) {
    throw new Error("Main Wire typed candidate cursor has the wrong layout");
  }
}

function continuousSlot(
  manifest: TransactionalTypedStateManifestV1,
  pointer: string,
): number {
  return requiredBindingSlot(
    manifest.numericalLayout.continuousSlots,
    pointer,
    "continuous",
  );
}

function dynamicSlot(
  manifest: TransactionalTypedStateManifestV1,
  pointer: string,
): number {
  return requiredBindingSlot(
    manifest.numericalLayout.excludedDynamicRoots,
    pointer,
    "dynamic",
  );
}

function boundedArraySlot(
  manifest: TransactionalTypedStateManifestV1,
  pointer: string,
): number {
  return requiredBindingSlot(
    manifest.numericalLayout.boundedArrayRoots,
    pointer,
    "bounded array",
  );
}

function requiredBindingSlot(
  slots: readonly Readonly<{ pointer: string }>[],
  pointer: string,
  owner: string,
): number {
  const matches: number[] = [];
  for (let index = 0; index < slots.length; index += 1) {
    if (slots[index]?.pointer === pointer) matches.push(index);
  }
  if (matches.length !== 1) {
    throw new Error(
      `Main Wire typed ${owner} binding ${pointer} must resolve exactly once`,
    );
  }
  return matches[0]!;
}
