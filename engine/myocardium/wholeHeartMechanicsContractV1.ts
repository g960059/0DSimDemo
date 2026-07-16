/**
 * Joint four-chamber mechanics boundary for ModelCore.
 *
 * Main wire owns blood/vascular nodes, edges, and valves. One mechanics
 * provider jointly maps the four candidate chamber volumes to four transmural
 * pressures while owning all coupled Land/passive/Maxwell/TriSeg/long-axis
 * history. Trials are pure; only an explicitly accepted trial advances state.
 */

export const WHOLE_HEART_MECHANICS_CONTRACT_V1_ID =
  "whole-heart-mechanics-contract-v1" as const;

export const WHOLE_HEART_MECHANICS_OWNERSHIP_V1 = Object.freeze({
  evaluationScope: "joint-LA-LV-RA-RV" as const,
  mainWireOwns: Object.freeze([
    "vascular-node-state",
    "vascular-edge-state",
    "valve-state-and-law",
    "blood-volume-ledger",
  ] as const),
  providerOwns: Object.freeze([
    "four-chamber-transmural-pressure",
    "Land-passive-Maxwell-material-state",
    "TriSeg-state",
    "trace-free-long-axis-state",
  ] as const),
  trialSemantics: "pure-candidate-evaluation" as const,
  commitSemantics: "explicit-accepted-trial-promotion" as const,
});

export type WholeHeartMechanicsChamberValuesV1 = {
  readonly LA: number;
  readonly LV: number;
  readonly RA: number;
  readonly RV: number;
};

export type WholeHeartMechanicsSerializableValueV1 =
  | null
  | boolean
  | number
  | string
  | readonly WholeHeartMechanicsSerializableValueV1[]
  | { readonly [key: string]: WholeHeartMechanicsSerializableValueV1 };

/** Allows efficient internal arrays without exposing their layout to ModelCore. */
export type WholeHeartMechanicsStateCodecV1<TState> = {
  clone(state: TState): TState;
  encode(state: TState): WholeHeartMechanicsSerializableValueV1;
  decode(encoded: WholeHeartMechanicsSerializableValueV1): TState;
};

export type WholeHeartMechanicsDiagnosticsV1 = {
  readonly converged: boolean;
  readonly finite: boolean;
  readonly iterationCount: number;
  readonly residualNorm: number;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly readback: WholeHeartMechanicsSerializableValueV1 | null;
};

export type WholeHeartMechanicsAcceptedStateV1<TState> = {
  readonly contractId: typeof WHOLE_HEART_MECHANICS_CONTRACT_V1_ID;
  readonly providerId: string;
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly stateSchemaVersion: number;
  readonly revision: number;
  readonly acceptedTimeSec: number;
  readonly acceptedVolumesMl: WholeHeartMechanicsChamberValuesV1;
  readonly materialState: TState;
  /** Detects mutation of arrays/objects exposed through the public snapshot. */
  readonly materialStateFingerprint: string;
};

export type WholeHeartMechanicsColdInputV1<TDrive> = {
  readonly timeSec: number;
  readonly volumesMl: WholeHeartMechanicsChamberValuesV1;
  /** Calcium/excitation/environment input; never valve or vascular state. */
  readonly drivingInputs: TDrive;
};

export type WholeHeartMechanicsProviderEvaluationV1<TState> = {
  readonly materialState: TState;
  readonly transmuralPressuresMmHg: WholeHeartMechanicsChamberValuesV1;
  readonly diagnostics: WholeHeartMechanicsDiagnosticsV1;
};

export type WholeHeartMechanicsTrialInputV1<TState, TDrive> = {
  /** Defensive clone of the last accepted whole-heart state. */
  readonly previousAcceptedState: WholeHeartMechanicsAcceptedStateV1<TState>;
  readonly candidateTimeSec: number;
  readonly stepDtSec: number;
  readonly candidateVolumesMl: WholeHeartMechanicsChamberValuesV1;
  readonly drivingInputs: TDrive;
};

/** One provider, not four chamber-local providers sharing hidden mutable state. */
export type WholeHeartMechanicsProviderV1<TState, TDrive> = {
  readonly contractId: typeof WHOLE_HEART_MECHANICS_CONTRACT_V1_ID;
  readonly providerId: string;
  /** Human-readable prior/case identity plus a stable hash of all effective parameters. */
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly stateSchemaVersion: number;
  readonly stateCodec: WholeHeartMechanicsStateCodecV1<TState>;
  initializeCold(
    input: WholeHeartMechanicsColdInputV1<TDrive>,
  ): WholeHeartMechanicsProviderEvaluationV1<TState>;
  evaluateTrial(
    input: WholeHeartMechanicsTrialInputV1<TState, TDrive>,
  ): WholeHeartMechanicsProviderEvaluationV1<TState>;
};

export type WholeHeartMechanicsColdResultV1<TState> = {
  readonly acceptedState: WholeHeartMechanicsAcceptedStateV1<TState>;
  readonly transmuralPressuresMmHg: WholeHeartMechanicsChamberValuesV1;
  readonly diagnostics: WholeHeartMechanicsDiagnosticsV1;
};

export type WholeHeartMechanicsTrialV1<TState> = {
  readonly contractId: typeof WHOLE_HEART_MECHANICS_CONTRACT_V1_ID;
  readonly providerId: string;
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly stateSchemaVersion: number;
  readonly baseRevision: number;
  readonly baseAcceptedTimeSec: number;
  readonly candidateTimeSec: number;
  readonly stepDtSec: number;
  readonly candidateVolumesMl: WholeHeartMechanicsChamberValuesV1;
  readonly candidateMaterialState: TState;
  readonly candidateMaterialStateFingerprint: string;
  readonly transmuralPressuresMmHg: WholeHeartMechanicsChamberValuesV1;
  readonly diagnostics: WholeHeartMechanicsDiagnosticsV1;
};

export type WholeHeartMechanicsCheckpointV1 = {
  readonly contractId: typeof WHOLE_HEART_MECHANICS_CONTRACT_V1_ID;
  readonly providerId: string;
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly stateSchemaVersion: number;
  readonly revision: number;
  readonly acceptedTimeSec: number;
  readonly acceptedVolumesMl: WholeHeartMechanicsChamberValuesV1;
  readonly materialState: WholeHeartMechanicsSerializableValueV1;
  readonly materialStateFingerprint: string;
};

export function initializeWholeHeartMechanicsColdV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  input: WholeHeartMechanicsColdInputV1<TDrive>,
): WholeHeartMechanicsColdResultV1<TState> {
  validateProvider(provider);
  validateTime(input.timeSec, "timeSec");
  validateVolumes(input.volumesMl, "volumesMl");
  const result = provider.initializeCold({
    ...input,
    volumesMl: copyChambers(input.volumesMl),
  });
  assertReady(result, "cold initialization");
  return Object.freeze({
    acceptedState: acceptedState(provider, {
      revision: 0,
      timeSec: input.timeSec,
      volumesMl: input.volumesMl,
      materialState: result.materialState,
    }),
    transmuralPressuresMmHg: copyChambers(result.transmuralPressuresMmHg),
    diagnostics: copyDiagnostics(result.diagnostics),
  });
}

export function evaluateWholeHeartMechanicsTrialV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  input: WholeHeartMechanicsTrialInputV1<TState, TDrive>,
): WholeHeartMechanicsTrialV1<TState> {
  validateProvider(provider);
  validateAccepted(provider, input.previousAcceptedState);
  validatePositive(input.stepDtSec, "stepDtSec");
  validateTime(input.candidateTimeSec, "candidateTimeSec");
  validateCandidateTime(input.previousAcceptedState, input.candidateTimeSec, input.stepDtSec);
  validateVolumes(input.candidateVolumesMl, "candidateVolumesMl");

  const result = provider.evaluateTrial({
    ...input,
    previousAcceptedState: cloneWholeHeartMechanicsAcceptedStateV1(
      provider,
      input.previousAcceptedState,
    ),
    candidateVolumesMl: copyChambers(input.candidateVolumesMl),
  });
  validateDiagnostics(result.diagnostics);
  validateSerializable(
    provider.stateCodec.encode(provider.stateCodec.clone(result.materialState)),
    "candidate material state",
  );
  const candidateMaterialState = provider.stateCodec.clone(result.materialState);
  const candidateMaterialStateFingerprint = fingerprintMaterialState(
    provider,
    candidateMaterialState,
  );
  return Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
    baseRevision: input.previousAcceptedState.revision,
    baseAcceptedTimeSec: input.previousAcceptedState.acceptedTimeSec,
    candidateTimeSec: input.candidateTimeSec,
    stepDtSec: input.stepDtSec,
    candidateVolumesMl: copyChambers(input.candidateVolumesMl),
    candidateMaterialState,
    candidateMaterialStateFingerprint,
    transmuralPressuresMmHg: copyChambers(result.transmuralPressuresMmHg),
    diagnostics: copyDiagnostics(result.diagnostics),
  });
}

/** Pure state promotion: no provider callback is allowed during commit. */
export function commitWholeHeartMechanicsTrialV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  previous: WholeHeartMechanicsAcceptedStateV1<TState>,
  trial: WholeHeartMechanicsTrialV1<TState>,
): WholeHeartMechanicsAcceptedStateV1<TState> {
  validateProvider(provider);
  validateAccepted(provider, previous);
  if (
    trial.contractId !== WHOLE_HEART_MECHANICS_CONTRACT_V1_ID ||
    trial.providerId !== provider.providerId ||
    trial.parameterSetId !== provider.parameterSetId ||
    trial.parameterIdentityHash !== provider.parameterIdentityHash ||
    trial.stateSchemaVersion !== provider.stateSchemaVersion
  ) throw new Error("whole-heart mechanics trial identity mismatch");
  if (
    trial.baseRevision !== previous.revision ||
    !nearlyEqual(trial.baseAcceptedTimeSec, previous.acceptedTimeSec)
  ) throw new Error("stale whole-heart mechanics trial cannot be committed");
  validateCandidateTime(previous, trial.candidateTimeSec, trial.stepDtSec);
  validateMaterialStateFingerprint(
    provider,
    trial.candidateMaterialState,
    trial.candidateMaterialStateFingerprint,
    "candidate material state",
  );
  assertReady({
    materialState: trial.candidateMaterialState,
    transmuralPressuresMmHg: trial.transmuralPressuresMmHg,
    diagnostics: trial.diagnostics,
  }, "trial commit");
  return acceptedState(provider, {
    revision: previous.revision + 1,
    timeSec: trial.candidateTimeSec,
    volumesMl: trial.candidateVolumesMl,
    materialState: trial.candidateMaterialState,
  });
}

export function cloneWholeHeartMechanicsAcceptedStateV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: WholeHeartMechanicsAcceptedStateV1<TState>,
): WholeHeartMechanicsAcceptedStateV1<TState> {
  validateProvider(provider);
  validateAccepted(provider, state);
  return acceptedState(provider, {
    revision: state.revision,
    timeSec: state.acceptedTimeSec,
    volumesMl: state.acceptedVolumesMl,
    materialState: state.materialState,
  });
}

/** JSON.stringify(checkpoint) is the stable ModelCore snapshot payload. */
export function checkpointWholeHeartMechanicsStateV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: WholeHeartMechanicsAcceptedStateV1<TState>,
): WholeHeartMechanicsCheckpointV1 {
  validateProvider(provider);
  validateAccepted(provider, state);
  const materialState = provider.stateCodec.encode(
    provider.stateCodec.clone(state.materialState),
  );
  validateSerializable(materialState, "checkpoint material state");
  return Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: state.providerId,
    parameterSetId: state.parameterSetId,
    parameterIdentityHash: state.parameterIdentityHash,
    stateSchemaVersion: state.stateSchemaVersion,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    acceptedVolumesMl: copyChambers(state.acceptedVolumesMl),
    materialState,
    materialStateFingerprint: fingerprintSerializable(materialState),
  });
}

export function restoreWholeHeartMechanicsStateV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  checkpoint: WholeHeartMechanicsCheckpointV1,
): WholeHeartMechanicsAcceptedStateV1<TState> {
  validateProvider(provider);
  if (
    checkpoint.contractId !== WHOLE_HEART_MECHANICS_CONTRACT_V1_ID ||
    checkpoint.providerId !== provider.providerId ||
    checkpoint.parameterSetId !== provider.parameterSetId ||
    checkpoint.parameterIdentityHash !== provider.parameterIdentityHash ||
    checkpoint.stateSchemaVersion !== provider.stateSchemaVersion
  ) throw new Error("whole-heart mechanics checkpoint identity mismatch");
  validateInteger(checkpoint.revision, "checkpoint revision");
  validateTime(checkpoint.acceptedTimeSec, "checkpoint acceptedTimeSec");
  validateVolumes(checkpoint.acceptedVolumesMl, "checkpoint acceptedVolumesMl");
  validateSerializable(checkpoint.materialState, "checkpoint material state");
  if (fingerprintSerializable(checkpoint.materialState) !== checkpoint.materialStateFingerprint) {
    throw new Error("checkpoint material state fingerprint mismatch");
  }
  return acceptedState(provider, {
    revision: checkpoint.revision,
    timeSec: checkpoint.acceptedTimeSec,
    volumesMl: checkpoint.acceptedVolumesMl,
    materialState: provider.stateCodec.decode(checkpoint.materialState),
  });
}

function acceptedState<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  input: {
    revision: number;
    timeSec: number;
    volumesMl: WholeHeartMechanicsChamberValuesV1;
    materialState: TState;
  },
): WholeHeartMechanicsAcceptedStateV1<TState> {
  validateInteger(input.revision, "revision");
  validateTime(input.timeSec, "acceptedTimeSec");
  validateVolumes(input.volumesMl, "acceptedVolumesMl");
  const materialState = provider.stateCodec.clone(input.materialState);
  const materialStateFingerprint = fingerprintMaterialState(provider, materialState);
  return Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
    revision: input.revision,
    acceptedTimeSec: input.timeSec,
    acceptedVolumesMl: copyChambers(input.volumesMl),
    materialState,
    materialStateFingerprint,
  });
}

function assertReady<TState>(
  result: WholeHeartMechanicsProviderEvaluationV1<TState>,
  label: string,
): void {
  validateDiagnostics(result.diagnostics);
  if (
    !result.diagnostics.converged ||
    !result.diagnostics.finite ||
    result.diagnostics.errors.length > 0 ||
    !chamberNumbers(result.transmuralPressuresMmHg).every(Number.isFinite)
  ) throw new Error(`${label} is not ready`);
}

function validateProvider<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
): void {
  if (provider.contractId !== WHOLE_HEART_MECHANICS_CONTRACT_V1_ID) {
    throw new Error("whole-heart mechanics provider contractId mismatch");
  }
  if (!provider.providerId.trim()) throw new Error("providerId must be non-empty");
  if (!provider.parameterSetId.trim()) throw new Error("parameterSetId must be non-empty");
  if (!provider.parameterIdentityHash.trim()) {
    throw new Error("parameterIdentityHash must be non-empty");
  }
  validateInteger(provider.stateSchemaVersion, "stateSchemaVersion");
}

function validateAccepted<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: WholeHeartMechanicsAcceptedStateV1<TState>,
): void {
  if (
    state.contractId !== WHOLE_HEART_MECHANICS_CONTRACT_V1_ID ||
    state.providerId !== provider.providerId ||
    state.parameterSetId !== provider.parameterSetId ||
    state.parameterIdentityHash !== provider.parameterIdentityHash ||
    state.stateSchemaVersion !== provider.stateSchemaVersion
  ) throw new Error("accepted whole-heart mechanics state identity mismatch");
  validateInteger(state.revision, "accepted revision");
  validateTime(state.acceptedTimeSec, "acceptedTimeSec");
  validateVolumes(state.acceptedVolumesMl, "acceptedVolumesMl");
  validateMaterialStateFingerprint(
    provider,
    state.materialState,
    state.materialStateFingerprint,
    "accepted material state",
  );
}

function validateCandidateTime<TState>(
  previous: WholeHeartMechanicsAcceptedStateV1<TState>,
  candidateTimeSec: number,
  stepDtSec: number,
): void {
  validatePositive(stepDtSec, "stepDtSec");
  const expected = previous.acceptedTimeSec + stepDtSec;
  if (!nearlyEqual(candidateTimeSec, expected)) {
    throw new Error(`candidateTimeSec must equal ${expected}`);
  }
}

function validateDiagnostics(value: WholeHeartMechanicsDiagnosticsV1): void {
  validateInteger(value.iterationCount, "diagnostics.iterationCount");
  if (!Number.isFinite(value.residualNorm) || value.residualNorm < 0) {
    throw new Error("diagnostics.residualNorm must be finite and nonnegative");
  }
  if (!value.errors.every((entry) => typeof entry === "string")) {
    throw new Error("diagnostics.errors must contain strings");
  }
  if (!value.warnings.every((entry) => typeof entry === "string")) {
    throw new Error("diagnostics.warnings must contain strings");
  }
  validateSerializable(value.readback, "diagnostics.readback");
}

function validateVolumes(
  value: WholeHeartMechanicsChamberValuesV1,
  label: string,
): void {
  if (!value || typeof value !== "object") throw new Error(`${label} is required`);
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    const volume = value[chamber];
    if (!Number.isFinite(volume) || volume < 0) {
      throw new Error(`${label}.${chamber} must be finite and nonnegative`);
    }
  }
}

function validateSerializable(value: unknown, label: string): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} contains a non-finite number`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateSerializable(item, `${label}[${index}]`));
    return;
  }
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    Object.entries(value).forEach(([key, item]) => validateSerializable(item, `${label}.${key}`));
    return;
  }
  throw new Error(`${label} is not JSON-serializable`);
}

function fingerprintMaterialState<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: TState,
): string {
  const encoded = provider.stateCodec.encode(provider.stateCodec.clone(state));
  validateSerializable(encoded, "material state");
  return fingerprintSerializable(encoded);
}

function validateMaterialStateFingerprint<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: TState,
  expected: string,
  label: string,
): void {
  if (fingerprintMaterialState(provider, state) !== expected) {
    throw new Error(`${label} fingerprint mismatch; snapshot was mutated or decoded inconsistently`);
  }
}

function fingerprintSerializable(value: WholeHeartMechanicsSerializableValueV1): string {
  const text = canonicalSerializableString(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function canonicalSerializableString(
  value: WholeHeartMechanicsSerializableValueV1,
): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("cannot fingerprint a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalSerializableString).join(",")}]`;
  }
  const record = value as { readonly [key: string]: WholeHeartMechanicsSerializableValueV1 };
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalSerializableString(record[key]!)}`
  ).join(",")}}`;
}

function copyChambers(
  value: WholeHeartMechanicsChamberValuesV1,
): WholeHeartMechanicsChamberValuesV1 {
  return Object.freeze({ LA: value.LA, LV: value.LV, RA: value.RA, RV: value.RV });
}

function copyDiagnostics(
  value: WholeHeartMechanicsDiagnosticsV1,
): WholeHeartMechanicsDiagnosticsV1 {
  return Object.freeze({
    ...value,
    errors: Object.freeze([...value.errors]),
    warnings: Object.freeze([...value.warnings]),
  });
}

function chamberNumbers(value: WholeHeartMechanicsChamberValuesV1): number[] {
  return [value.LA, value.LV, value.RA, value.RV];
}

function validateInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a nonnegative integer`);
}

function validateTime(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be finite and nonnegative`);
}

function validatePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be finite and positive`);
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
}
