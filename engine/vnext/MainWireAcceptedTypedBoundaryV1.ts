import type {
  MainWireIntegratedModelCandidateTimeLimitV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type {
  AcceptedComposedRhythmTransactionCandidateTimeLimitV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import {
  MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_FINGERPRINT,
  MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_ID,
} from "@/engine/vnext/MainWireAcceptedTypedStateV1";
import type {
  TransactionalTypedStateCurrentCursorV1,
} from "@/engine/vnext/TransactionalTypedStateImageV1";

export const MAIN_WIRE_ACCEPTED_TYPED_BOUNDARY_V1_ID =
  "main-wire-integrated-accepted-typed-boundary-v1" as const;

export type MainWireAcceptedTypedClockV1 = Readonly<{
  acceptedTimeSec: number;
  revision: number;
}>;

type Boundary = Readonly<{ owner: string; timeSec: number }>;

// Generated against fnv1a32-9657ecbf. The manifest admission in
// MainWireAcceptedTypedStateV1 rejects any topology change before these slots
// can be observed.
const F64 = Object.freeze({
  acceptedTimeSec: 0,
  composedAcceptedTimeSec: 2,
  authoredEctopyCursor: 8,
  regularAtrialNextActivationTimeSec: 144,
  composedRevision: 148,
  ventricularBackupNextIntrinsicEscapeDueTimeSec: 163,
  ventricularBackupNextVviPaceDueTimeSec: 164,
  coronaryAcceptedTimeSec: 198,
  autoregulationWindowIndex: 276,
  autoregulationWindowOriginAcceptedTimeSec: 277,
  autoregulationWindowStartAcceptedTimeSec: 278,
  autoregulationWindowDurationSec: 280,
  autoregulationBindingOriginAcceptedTimeSec: 281,
  coronaryRevision: 343,
  revision: 439,
});

const STRING = Object.freeze({
  atrialSourceMode: 7,
});

const DYNAMIC = Object.freeze({
  authoredEctopyEvents: 0,
  authoredVentricularPacingReplayState: 1,
  pendingCalciumDeposits: 16,
  pendingDistalVentricularImpulses: 17,
  pendingProximalAvOutputs: 18,
});

/** Reads the authoritative outer clock without rebuilding the object graph. */
export function readMainWireAcceptedTypedClockV1(
  cursor: TransactionalTypedStateCurrentCursorV1,
): MainWireAcceptedTypedClockV1 {
  assertCursor(cursor);
  const acceptedTimeSec = finiteNonnegative(
    cursor.readContinuous(F64.acceptedTimeSec),
    "outer accepted time",
  );
  const revision = nonnegativeSafeInteger(
    cursor.readContinuous(F64.revision),
    "outer revision",
  );
  const composedAcceptedTimeSec = cursor.readContinuous(
    F64.composedAcceptedTimeSec,
  );
  const coronaryAcceptedTimeSec = cursor.readContinuous(
    F64.coronaryAcceptedTimeSec,
  );
  const composedRevision = cursor.readContinuous(F64.composedRevision);
  const coronaryRevision = cursor.readContinuous(F64.coronaryRevision);
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

/**
 * Determines the next accepted boundary from the active typed image. This is
 * the first scheduling path that no longer treats the rehydrated legacy state
 * object as authority. Dynamic queues are decoded independently from their
 * bounded slots; the rest are fixed-offset reads.
 */
export function limitMainWireAcceptedTypedCandidateTimeV1(
  cursor: TransactionalTypedStateCurrentCursorV1,
  requestedCandidateTimeSec: number,
  externalAfNextBoundaryTimeSec: number | null,
): MainWireIntegratedModelCandidateTimeLimitV3 {
  const clock = readMainWireAcceptedTypedClockV1(cursor);
  const requestedCandidateTime = finiteNonnegative(
    requestedCandidateTimeSec,
    "requested candidate time",
  );
  if (!(requestedCandidateTime > clock.acceptedTimeSec)) {
    throw new Error("Main Wire typed requested endpoint must advance");
  }

  const windowIndex = nonnegativeSafeInteger(
    cursor.readContinuous(F64.autoregulationWindowIndex),
    "autoregulation window index",
  );
  const stateWindowOrigin = finiteNonnegative(
    cursor.readContinuous(F64.autoregulationWindowOriginAcceptedTimeSec),
    "autoregulation state window origin",
  );
  const bindingWindowOrigin = finiteNonnegative(
    cursor.readContinuous(F64.autoregulationBindingOriginAcceptedTimeSec),
    "autoregulation binding window origin",
  );
  const windowDurationSec = positiveFinite(
    cursor.readContinuous(F64.autoregulationWindowDurationSec),
    "autoregulation window duration",
  );
  if (stateWindowOrigin !== bindingWindowOrigin) {
    throw new Error("Main Wire typed autoregulation origins diverged");
  }
  const expectedWindowStart = bindingWindowOrigin
    + windowIndex * windowDurationSec;
  if (
    cursor.readContinuous(F64.autoregulationWindowStartAcceptedTimeSec)
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
    clock.acceptedTimeSec,
    coronaryCappedEndTimeSec,
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

function limitTypedRhythmBoundary(
  cursor: TransactionalTypedStateCurrentCursorV1,
  acceptedTimeSec: number,
  requestedCandidateTimeSec: number,
  externalAfNextBoundaryTimeSec: number | null,
): AcceptedComposedRhythmTransactionCandidateTimeLimitV2 {
  const boundaries: Boundary[] = [];
  const atrialSourceMode = cursor.readString(STRING.atrialSourceMode);
  if (atrialSourceMode === "regular") {
    boundaries.push(boundary(
      "regular-atrial-source",
      cursor.readContinuous(F64.regularAtrialNextActivationTimeSec),
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
    cursor.readDynamic(DYNAMIC.authoredEctopyEvents),
    "authored ectopy events",
  );
  const authoredEctopyCursor = nonnegativeSafeInteger(
    cursor.readContinuous(F64.authoredEctopyCursor),
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
    DYNAMIC.authoredVentricularPacingReplayState,
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
    cursor.readDynamic(DYNAMIC.pendingProximalAvOutputs),
    "pending-proximal-av-output",
    "proximalArrivalTimeSec",
    acceptedTimeSec,
  );
  pushFirstArrayBoundary(
    boundaries,
    cursor.readDynamic(DYNAMIC.pendingDistalVentricularImpulses),
    "pending-distal-ventricular-impulse",
    "activationTimeSec",
    acceptedTimeSec,
  );
  boundaries.push(boundary(
    "ventricular-backup",
    Math.min(
      cursor.readContinuous(
        F64.ventricularBackupNextIntrinsicEscapeDueTimeSec,
      ),
      cursor.readContinuous(F64.ventricularBackupNextVviPaceDueTimeSec),
    ),
    acceptedTimeSec,
  ));
  pushFirstArrayBoundary(
    boundaries,
    cursor.readDynamic(DYNAMIC.pendingCalciumDeposits),
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

function assertCursor(cursor: TransactionalTypedStateCurrentCursorV1): void {
  if (
    cursor.layoutId !== MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_ID
    || cursor.fingerprint
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_FINGERPRINT
  ) {
    throw new Error("Main Wire typed boundary cursor has the wrong layout");
  }
}
