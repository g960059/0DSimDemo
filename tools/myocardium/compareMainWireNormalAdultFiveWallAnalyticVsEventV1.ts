import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  validateRetainedAcceptedIntervalWindowV1,
} from "@/engine/myocardium/diagnostics/AcceptedIntervalTimebaseV1";
import {
  readMainWireNormalAdultBloodVolumeOperatingPointReportV1,
  type MainWireNormalAdultBloodVolumeOperatingPointReportV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultBloodVolumeOperatingPointReportV1";
import {
  assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1,
  type MainWireNormalAdultFiveWallPeriodicResultV3,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  composeMainWireFourValveDiseasePresetV1,
  validateMainWireFourValveDiseasePresetV1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";

const COMPARISON_ID =
  "main-wire-normal-adult-five-wall-analytic-vs-event-v1" as const;
const ANALYTIC_REPRESENTATION =
  "analytic-periodic-control-with-exact-event-shadow" as const;
const EXACT_EVENT_REPRESENTATION = "exact-event-state" as const;
const FIXED_TOTAL_BLOOD_VOLUME_ML = 5522.11 as const;
const BLOOD_VOLUME_OWNER_ID =
  "main-wire-normal-adult-blood-volume-operating-point-v1" as const;
const BLOOD_VOLUME_PARAMETER_SET_ID =
  "main-wire-normal-adult-noncoronary-fixed-tbv-5522p11ml-v1" as const;
const RELATIVE_TIME_TOLERANCE_SEC = 1e-10;
const DT_2MS_SEC = 0.002;
const DT_2MS_ENDPOINT_COUNT = 500;

const CLAIM = Object.freeze({
  input: "periodic-result-v3-raw-json" as const,
  selectedCycle: "terminal-retained-complete-beat" as const,
  pairingCoordinate:
    "accepted-endpoint-relative-physical-time" as const,
  parameterFittingApplied: false as const,
  timeSeriesSmoothingApplied: false as const,
  timeSeriesResamplingOrInterpolationApplied: false as const,
  laPvMorphologyPressureCoordinate:
    "intracavitary-absolute-pressure" as const,
  wallWorkPressureCoordinate: "transmural-pressure" as const,
  transmuralPressureReservedForWallWorkAndConstitutiveDiagnostics:
    true as const,
  bloodVolumeOperatingPointReadbackOnly: true as const,
});

type AvailableOperatingPoint = Extract<
  MainWireNormalAdultBloodVolumeOperatingPointReportV1,
  { status: "available" }
>;
type RetainedBeat =
  MainWireNormalAdultFiveWallPeriodicResultV3["retainedCompleteBeats"][number];
type CompleteTrace = Extract<
  RetainedBeat["acceptedIntervalTrace"],
  { status: "complete" }
>;
type DiagnosticSample = RetainedBeat["samples"][number];
type SelectedTerminalBeat = Readonly<{
  beat: RetainedBeat;
  trace: CompleteTrace;
  endpoints: readonly Readonly<{
    relativeTimeSec: number;
    sample: DiagnosticSample;
  }>[];
}>;
type PairedEndpoint = Readonly<{
  relativeTimeSec: number;
  relativeTimeMismatchSec: number;
  analyticSample: DiagnosticSample;
  eventSample: DiagnosticSample;
}>;
type DifferencePoint = Readonly<{
  maximumAbsoluteDifference: number;
  relativeTimeSec: number;
  analyticValue: number;
  eventValue: number;
}>;
type MutableDifferencePoint = {
  maximumAbsoluteDifference: number;
  relativeTimeSec: number;
  analyticValue: number;
  eventValue: number;
};
type SignalGroup = Readonly<{
  key: string;
  select: (sample: DiagnosticSample) => unknown;
  ignoreBooleanLeaves?: boolean;
}>;

const SIGNAL_GROUPS: readonly SignalGroup[] = Object.freeze([
  Object.freeze({
    key: "nodeVolumeMl",
    select: (sample: DiagnosticSample) => sample.nodeVolumeMl,
  }),
  Object.freeze({
    key: "nodeAbsolutePressureMmHg",
    select: (sample: DiagnosticSample) => sample.nodeAbsolutePressureMmHg,
  }),
  Object.freeze({
    key: "chamberTransmuralPressureMmHg",
    select: (sample: DiagnosticSample) =>
      sample.chamberTransmuralPressureMmHg,
  }),
  Object.freeze({
    key: "flowMlPerSec",
    select: (sample: DiagnosticSample) => sample.flowMlPerSec,
  }),
  Object.freeze({
    key: "freeCalciumUM",
    select: (sample: DiagnosticSample) => sample.freeCalciumUM,
  }),
  Object.freeze({
    key: "wallStressPa",
    select: (sample: DiagnosticSample) => sample.wallStressPa,
  }),
  Object.freeze({
    key: "wallEnergyLedgerDensity",
    select: (sample: DiagnosticSample) => sample.wallEnergyLedgerDensity,
    ignoreBooleanLeaves: true,
  }),
]);

const analyticInputPath = path.resolve(requiredArgument("--analytic"));
const eventInputPath = path.resolve(requiredArgument("--event"));
const outputPath = path.resolve(requiredArgument("--output"));
if (outputPath === analyticInputPath || outputPath === eventInputPath) {
  throw new Error("--output must not overwrite either raw input");
}

const analytic = readResult(analyticInputPath, "analytic");
const event = readResult(eventInputPath, "event");
const analyticOperatingPoint = validateHealthyResult(
  "analytic",
  analytic,
  ANALYTIC_REPRESENTATION,
);
const eventOperatingPoint = validateHealthyResult(
  "event",
  event,
  EXACT_EVENT_REPRESENTATION,
);
validateRepresentationOnlyProtocolDifference(analytic, event);

const analyticSelected = selectTerminalCompleteBeat("analytic", analytic);
const eventSelected = selectTerminalCompleteBeat("event", event);
const pairing = pairAcceptedEndpoints(
  analytic,
  analyticSelected,
  event,
  eventSelected,
);
const signalDifferences = Object.freeze(Object.fromEntries(
  SIGNAL_GROUPS.map((group) => [
    group.key,
    compareSignalGroup(group, pairing.pairs),
  ]),
));
const headline = Object.freeze({
  pairedEndpointCount: pairing.pairs.length,
  maximumRelativeTimeMismatchSec: pairing.maximumRelativeTimeMismatchSec,
  maximumAbsoluteDifferenceBySignalGroup: Object.freeze(Object.fromEntries(
    Object.entries(signalDifferences).map(([key, value]) => [
      key,
      value.maximumAbsoluteDifference,
    ]),
  )),
});
const sharedComponentHashes = protocolComponentHashesWithoutRepresentation(
  analytic,
);
const comparison = Object.freeze({
  comparisonId: COMPARISON_ID,
  schemaVersion: 1 as const,
  inputs: Object.freeze({
    analytic: inputMetadata(analyticInputPath, analytic, analyticOperatingPoint),
    event: inputMetadata(eventInputPath, event, eventOperatingPoint),
  }),
  operatingPoint: Object.freeze({
    ownerId: BLOOD_VOLUME_OWNER_ID,
    parameterSetId: BLOOD_VOLUME_PARAMETER_SET_ID,
    fixedTotalBloodVolumeMl: FIXED_TOTAL_BLOOD_VOLUME_ML,
    analyticResolvedTotalBloodVolumeMl:
      analyticOperatingPoint.resolvedTotalBloodVolumeMl,
    eventResolvedTotalBloodVolumeMl:
      eventOperatingPoint.resolvedTotalBloodVolumeMl,
    readbackOnly: true as const,
  }),
  protocol: Object.freeze({
    representationOnlyDifferenceValidated: true as const,
    sharedComponentHashes,
    analytic: Object.freeze({
      representation: analytic.calciumRepresentation,
      protocolIdentityHash: analytic.protocolIdentityHash,
      calciumStateContractStableHash:
        analytic.protocolComponentHashes.calciumStateContractStableHash,
    }),
    event: Object.freeze({
      representation: event.calciumRepresentation,
      protocolIdentityHash: event.protocolIdentityHash,
      calciumStateContractStableHash:
        event.protocolComponentHashes.calciumStateContractStableHash,
    }),
  }),
  acceptedEndpointPairing: Object.freeze({
    coordinate: "relative-physical-time-from-beat-start" as const,
    matching: "one-to-one-without-resampling" as const,
    timeToleranceSec: RELATIVE_TIME_TOLERANCE_SEC,
    analyticEndpointCount: analyticSelected.endpoints.length,
    eventEndpointCount: eventSelected.endpoints.length,
    pairedEndpointCount: pairing.pairs.length,
    maximumRelativeTimeMismatchSec: pairing.maximumRelativeTimeMismatchSec,
    analyticBeat: selectedBeatMetadata(analyticSelected),
    eventBeat: selectedBeatMetadata(eventSelected),
  }),
  signalDifferences,
  convergence: Object.freeze({
    analytic: convergenceMetadata(analytic, analyticSelected),
    event: convergenceMetadata(event, eventSelected),
  }),
  headline,
  claim: CLAIM,
});

const serialized = `${JSON.stringify(comparison, null, 2)}\n`;
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, serialized);
process.stdout.write(`${JSON.stringify({
  outputPath,
  comparisonId: COMPARISON_ID,
  analyticInputPath,
  eventInputPath,
  dtSec: analytic.dtSec,
  analyticBeatIndex: analyticSelected.beat.beatIndex,
  eventBeatIndex: eventSelected.beat.beatIndex,
  pairedEndpointCount: pairing.pairs.length,
  maximumRelativeTimeMismatchSec: pairing.maximumRelativeTimeMismatchSec,
  maximumAbsoluteDifferenceBySignalGroup:
    headline.maximumAbsoluteDifferenceBySignalGroup,
  analyticConvergenceStatus: analytic.periodicity.status,
  eventConvergenceStatus: event.periodicity.status,
  bytes: Buffer.byteLength(serialized),
}, null, 2)}\n`);

function readResult(
  inputPath: string,
  label: "analytic" | "event",
): MainWireNormalAdultFiveWallPeriodicResultV3 {
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(inputPath, "utf8")) as unknown;
  } catch (error) {
    throw new Error(
      `${label} input is not readable ResultV3 JSON: ${errorMessage(error)}`,
    );
  }
  const record = requireRecord(value, `${label} input`);
  expectEqual(
    record.experimentId,
    "main-wire-normal-adult-five-wall-periodic-steady-v3",
    `${label}.experimentId`,
  );
  expectEqual(record.schemaVersion, 3, `${label}.schemaVersion`);
  if (!Array.isArray(record.retainedCompleteBeats)) {
    throw new Error(`${label}.retainedCompleteBeats must be an array`);
  }
  return value as MainWireNormalAdultFiveWallPeriodicResultV3;
}

function validateHealthyResult(
  label: "analytic" | "event",
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
  expectedRepresentation:
    | typeof ANALYTIC_REPRESENTATION
    | typeof EXACT_EVENT_REPRESENTATION,
): AvailableOperatingPoint {
  expectEqual(result.mode, "canonical", `${label}.mode`);
  expectEqual(result.initialization, "canonical", `${label}.initialization`);
  expectEqual(
    result.calciumRepresentation,
    expectedRepresentation,
    `${label}.calciumRepresentation`,
  );
  expectEqual(
    result.protocolIdentity.calciumDrive.representation,
    expectedRepresentation,
    `${label}.protocolIdentity.calciumDrive.representation`,
  );
  expectEqual(result.laSlsMode, "on", `${label}.laSlsMode`);
  expectEqual(result.pericardiumMode, "on", `${label}.pericardiumMode`);
  expectEqual(
    result.pericardiumCase,
    "healthy-slack",
    `${label}.pericardiumCase`,
  );
  expectEqual(
    result.pericardiumMode,
    result.protocolIdentity.commonPericardium.mode,
    `${label} pericardium mode identity`,
  );
  expectEqual(
    result.pericardiumParameterSetId,
    result.protocolIdentity.commonPericardium.parameterSetId,
    `${label} pericardium parameter identity`,
  );
  expectEqual(
    result.integrationCompletedWithoutFailure,
    true,
    `${label}.integrationCompletedWithoutFailure`,
  );
  expectEqual(result.failure, null, `${label}.failure`);
  expectEqual(result.claim.parameterSearch, false, `${label} parameter search`);
  expectEqual(
    result.claim.smoothingAppliedToSamples,
    false,
    `${label} sample smoothing`,
  );

  try {
    assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1({
      identity: result.protocolIdentity,
      identityHash: result.protocolIdentityHash,
      componentHashes: result.protocolComponentHashes,
      periodicPolicy: result.policy,
    });
  } catch (error) {
    throw new Error(
      `${label} protocol identity integrity failed: ${errorMessage(error)}`,
    );
  }

  const presetIssues = validateMainWireFourValveDiseasePresetV1(
    result.valvePreset,
  );
  if (presetIssues.length > 0) {
    throw new Error(`${label} valve preset invalid: ${presetIssues.join("; ")}`);
  }
  const healthyValvePreset = composeMainWireFourValveDiseasePresetV1([]);
  assertDeepEqual(
    `${label} healthy normal valve preset`,
    result.valvePreset,
    healthyValvePreset,
  );
  assertDeepEqual(
    `${label} valve preset identity snapshot`,
    result.valvePreset,
    result.protocolIdentity.circulation.valvePresetSnapshot,
  );

  const operatingPoint =
    readMainWireNormalAdultBloodVolumeOperatingPointReportV1(result);
  if (operatingPoint.status !== "available") {
    throw new Error(
      `${label} blood-volume operating point is unavailable: `
        + operatingPoint.unavailableReason,
    );
  }
  expectEqual(operatingPoint.ownerId, BLOOD_VOLUME_OWNER_ID, `${label} TBV owner`);
  expectEqual(
    operatingPoint.parameterSetId,
    BLOOD_VOLUME_PARAMETER_SET_ID,
    `${label} TBV parameter set`,
  );
  expectEqual(
    operatingPoint.fixedTotalBloodVolumeMl,
    FIXED_TOTAL_BLOOD_VOLUME_ML,
    `${label} fixed TBV`,
  );
  expectEqual(
    operatingPoint.resolvedTotalBloodVolumeMl,
    FIXED_TOTAL_BLOOD_VOLUME_ML,
    `${label} resolved TBV`,
  );
  return operatingPoint;
}

function validateRepresentationOnlyProtocolDifference(
  analytic: MainWireNormalAdultFiveWallPeriodicResultV3,
  event: MainWireNormalAdultFiveWallPeriodicResultV3,
): void {
  expectEqual(analytic.dtSec, event.dtSec, "shared dtSec");
  if (!(analytic.dtSec > 0) || !Number.isFinite(analytic.dtSec)) {
    throw new Error("shared dtSec must be positive and finite");
  }
  expectEqual(analytic.stepsPerBeat, event.stepsPerBeat, "shared nominal grid");
  expectEqual(
    analytic.requestedMaximumBeatCount,
    event.requestedMaximumBeatCount,
    "shared requested maximum beat count",
  );
  assertDeepEqual(
    "shared canonical initialization audit",
    analytic.initializationAudit,
    event.initializationAudit,
  );
  expectEqual(analytic.laSlsMode, event.laSlsMode, "shared LA SLS mode");
  expectEqual(
    analytic.pericardiumMode,
    event.pericardiumMode,
    "shared pericardium mode",
  );
  expectEqual(
    analytic.pericardiumCase,
    event.pericardiumCase,
    "shared pericardium case",
  );
  expectEqual(
    analytic.pericardiumParameterSetId,
    event.pericardiumParameterSetId,
    "shared pericardium parameter set",
  );
  assertDeepEqual("shared periodic policy", analytic.policy, event.policy);
  assertDeepEqual(
    "shared blood-volume construction audit",
    analytic.bloodVolumeOperatingPointAudit,
    event.bloodVolumeOperatingPointAudit,
  );
  assertDeepEqual("shared healthy valve preset", analytic.valvePreset, event.valvePreset);
  assertDeepEqual(
    "protocol identity excluding calcium representation",
    protocolIdentityWithoutRepresentation(analytic),
    protocolIdentityWithoutRepresentation(event),
  );
  assertDeepEqual(
    "protocol component hashes excluding calcium representation",
    protocolComponentHashesWithoutRepresentation(analytic),
    protocolComponentHashesWithoutRepresentation(event),
  );
  if (
    analytic.protocolComponentHashes.calciumStateContractStableHash
      === event.protocolComponentHashes.calciumStateContractStableHash
  ) {
    throw new Error(
      "calcium representation change must change its state-contract hash",
    );
  }
  if (analytic.protocolIdentityHash === event.protocolIdentityHash) {
    throw new Error(
      "distinct calcium representations must not share a protocol identity hash",
    );
  }
}

function protocolIdentityWithoutRepresentation(
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
) {
  const {
    representation: _representation,
    stateContractStableHash: _stateContractStableHash,
    ...sharedCalciumDrive
  } = result.protocolIdentity.calciumDrive;
  return Object.freeze({
    ...result.protocolIdentity,
    calciumDrive: Object.freeze(sharedCalciumDrive),
  });
}

function protocolComponentHashesWithoutRepresentation(
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
) {
  const {
    calciumStateContractStableHash: _calciumStateContractStableHash,
    ...sharedComponentHashes
  } = result.protocolComponentHashes;
  return Object.freeze(sharedComponentHashes);
}

function selectTerminalCompleteBeat(
  label: "analytic" | "event",
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
): SelectedTerminalBeat {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined) {
    throw new Error(`${label} result has no retained complete beat`);
  }
  if (beat.beatIndex !== result.completedBeatCount) {
    throw new Error(`${label} final retained beat is not the terminal beat`);
  }
  const trace = beat.acceptedIntervalTrace;
  if (trace.status !== "complete") {
    throw new Error(`${label} terminal beat has no real preceding diagnostic`);
  }
  try {
    validateRetainedAcceptedIntervalWindowV1(trace);
  } catch (error) {
    throw new Error(
      `${label} accepted interval trace invalid: ${errorMessage(error)}`,
    );
  }
  if (
    trace.intervals.length !== beat.acceptedIntervalCount
    || beat.samples.length !== beat.acceptedIntervalCount
  ) {
    throw new Error(`${label} terminal accepted endpoint count is inconsistent`);
  }
  const endpoints = Object.freeze(trace.intervals.map((interval, index) => {
    const sample = interval.endpointSample.sample;
    expectEqual(
      sample.diagnosticSampleId,
      "main-wire-normal-adult-five-wall-diagnostic-sample-v2",
      `${label} endpoint[${index}] diagnostic schema`,
    );
    assertNear(
      sample.timeSec,
      interval.endpointSample.timeSec,
      RELATIVE_TIME_TOLERANCE_SEC,
      `${label} endpoint[${index}] sample time`,
    );
    const relativeTimeSec = interval.endpointSample.timeSec - beat.startTimeSec;
    if (!(relativeTimeSec > 0) || !Number.isFinite(relativeTimeSec)) {
      throw new Error(`${label} endpoint[${index}] relative time is invalid`);
    }
    if (index > 0) {
      const previousTimeSec = trace.intervals[index - 1]!.endpointSample.timeSec
        - beat.startTimeSec;
      if (!(relativeTimeSec > previousTimeSec)) {
        throw new Error(`${label} accepted endpoints are not strictly monotone`);
      }
    }
    return Object.freeze({ relativeTimeSec, sample });
  }));
  assertNear(
    endpoints.at(-1)!.relativeTimeSec,
    trace.durationSec,
    RELATIVE_TIME_TOLERANCE_SEC,
    `${label} terminal endpoint duration`,
  );
  return Object.freeze({ beat, trace, endpoints });
}

function pairAcceptedEndpoints(
  analyticResult: MainWireNormalAdultFiveWallPeriodicResultV3,
  analytic: SelectedTerminalBeat,
  eventResult: MainWireNormalAdultFiveWallPeriodicResultV3,
  event: SelectedTerminalBeat,
) {
  expectEqual(
    analytic.endpoints.length,
    event.endpoints.length,
    "accepted endpoint count",
  );
  assertNear(
    analytic.trace.durationSec,
    event.trace.durationSec,
    RELATIVE_TIME_TOLERANCE_SEC,
    "selected beat duration",
  );
  if (Object.is(analyticResult.dtSec, DT_2MS_SEC)) {
    expectEqual(
      analytic.endpoints.length,
      DT_2MS_ENDPOINT_COUNT,
      "analytic 2 ms endpoint count",
    );
    expectEqual(
      event.endpoints.length,
      DT_2MS_ENDPOINT_COUNT,
      "event 2 ms endpoint count",
    );
  }
  let maximumRelativeTimeMismatchSec = 0;
  const pairs = Object.freeze(analytic.endpoints.map((analyticEndpoint, index) => {
    const eventEndpoint = event.endpoints[index]!;
    const relativeTimeMismatchSec = Math.abs(
      analyticEndpoint.relativeTimeSec - eventEndpoint.relativeTimeSec,
    );
    if (relativeTimeMismatchSec > RELATIVE_TIME_TOLERANCE_SEC) {
      throw new Error(
        `accepted endpoint[${index}] relative times do not match: `
          + `${analyticEndpoint.relativeTimeSec} vs `
          + `${eventEndpoint.relativeTimeSec}`,
      );
    }
    maximumRelativeTimeMismatchSec = Math.max(
      maximumRelativeTimeMismatchSec,
      relativeTimeMismatchSec,
    );
    return Object.freeze({
      relativeTimeSec: analyticEndpoint.relativeTimeSec,
      relativeTimeMismatchSec,
      analyticSample: analyticEndpoint.sample,
      eventSample: eventEndpoint.sample,
    });
  }));
  return Object.freeze({ pairs, maximumRelativeTimeMismatchSec });
}

function compareSignalGroup(
  group: SignalGroup,
  pairs: readonly PairedEndpoint[],
) {
  if (pairs.length === 0) throw new Error(`${group.key} has no endpoint pairs`);
  let signalPaths: readonly string[] | null = null;
  const maxima = new Map<string, MutableDifferencePoint>();
  let worstPath: string | null = null;
  let worst: MutableDifferencePoint | null = null;

  for (const [index, pair] of pairs.entries()) {
    const analyticValues = numericLeafRecord(
      group.select(pair.analyticSample),
      `analytic ${group.key} endpoint[${index}]`,
      group.ignoreBooleanLeaves ?? false,
    );
    const eventValues = numericLeafRecord(
      group.select(pair.eventSample),
      `event ${group.key} endpoint[${index}]`,
      group.ignoreBooleanLeaves ?? false,
    );
    const currentPaths = Object.freeze(Object.keys(analyticValues).sort());
    assertStringArraysEqual(
      currentPaths,
      Object.keys(eventValues).sort(),
      `${group.key} analytic/event signal schema`,
    );
    if (signalPaths === null) {
      signalPaths = currentPaths;
    } else {
      assertStringArraysEqual(
        currentPaths,
        signalPaths,
        `${group.key} endpoint signal schema`,
      );
    }
    for (const signalPath of currentPaths) {
      const analyticValue = analyticValues[signalPath]!;
      const eventValue = eventValues[signalPath]!;
      const difference = Math.abs(analyticValue - eventValue);
      const prior = maxima.get(signalPath);
      if (prior === undefined || difference > prior.maximumAbsoluteDifference) {
        maxima.set(signalPath, {
          maximumAbsoluteDifference: difference,
          relativeTimeSec: pair.relativeTimeSec,
          analyticValue,
          eventValue,
        });
      }
      if (worst === null || difference > worst.maximumAbsoluteDifference) {
        worstPath = signalPath;
        worst = {
          maximumAbsoluteDifference: difference,
          relativeTimeSec: pair.relativeTimeSec,
          analyticValue,
          eventValue,
        };
      }
    }
  }
  if (signalPaths === null || signalPaths.length === 0 || worst === null) {
    throw new Error(`${group.key} has no finite numeric signals`);
  }
  const bySignal = Object.freeze(Object.fromEntries(signalPaths.map(
    (signalPath) => [
      signalPath,
      Object.freeze(maxima.get(signalPath)!) satisfies DifferencePoint,
    ],
  )));
  return Object.freeze({
    signalCount: signalPaths.length,
    maximumAbsoluteDifference: worst.maximumAbsoluteDifference,
    worstSignalPath: worstPath!,
    worstRelativeTimeSec: worst.relativeTimeSec,
    analyticValueAtWorst: worst.analyticValue,
    eventValueAtWorst: worst.eventValue,
    bySignal,
  });
}

function numericLeafRecord(
  value: unknown,
  label: string,
  ignoreBooleanLeaves: boolean,
): Readonly<Record<string, number>> {
  const values: Record<string, number> = {};
  visitNumericLeaves(value, "", label, ignoreBooleanLeaves, values);
  if (Object.keys(values).length === 0) {
    throw new Error(`${label} contains no numeric leaves`);
  }
  return Object.freeze(values);
}

function visitNumericLeaves(
  value: unknown,
  prefix: string,
  label: string,
  ignoreBooleanLeaves: boolean,
  output: Record<string, number>,
): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`${label}.${prefix} must be finite`);
    }
    if (prefix.length === 0) throw new Error(`${label} must be a record`);
    output[prefix] = value;
    return;
  }
  if (typeof value === "boolean" && ignoreBooleanLeaves) return;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}.${prefix} must be a finite-number record`);
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) throw new Error(`${label}.${prefix} is empty`);
  for (const [key, child] of entries) {
    visitNumericLeaves(
      child,
      prefix.length === 0 ? key : `${prefix}.${key}`,
      label,
      ignoreBooleanLeaves,
      output,
    );
  }
}

function inputMetadata(
  inputPath: string,
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
  operatingPoint: AvailableOperatingPoint,
) {
  return Object.freeze({
    path: path.basename(inputPath),
    experimentId: result.experimentId,
    schemaVersion: result.schemaVersion,
    initialization: result.initialization,
    calciumRepresentation: result.calciumRepresentation,
    dtSec: result.dtSec,
    stepsPerBeat: result.stepsPerBeat,
    laSlsMode: result.laSlsMode,
    pericardiumMode: result.pericardiumMode,
    pericardiumCase: result.pericardiumCase,
    pericardiumParameterSetId: result.pericardiumParameterSetId,
    valvePresetParameterSetId: result.valvePreset.parameterSetId,
    protocolIdentityHash: result.protocolIdentityHash,
    bloodVolumeOperatingPoint: operatingPoint,
  });
}

function selectedBeatMetadata(selected: SelectedTerminalBeat) {
  return Object.freeze({
    beatIndex: selected.beat.beatIndex,
    startTimeSec: selected.beat.startTimeSec,
    endTimeSec: selected.beat.endTimeSec,
    durationSec: selected.trace.durationSec,
    acceptedIntervalCount: selected.trace.intervals.length,
    precedingAcceptedSampleAvailable: true as const,
  });
}

function convergenceMetadata(
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
  selected: SelectedTerminalBeat,
) {
  return Object.freeze({
    initialization: result.initialization,
    requestedMaximumBeatCount: result.requestedMaximumBeatCount,
    completedBeatCount: result.completedBeatCount,
    terminationReason: result.terminationReason,
    integrationCompletedWithoutFailure:
      result.integrationCompletedWithoutFailure,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    period2OrbitSuspected: result.period2OrbitSuspected,
    classifier: result.periodicity,
    latestClosure: result.beatClosure.at(-1) ?? null,
    selectedTerminalCompleteBeat: selectedBeatMetadata(selected),
  });
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function expectEqual(actual: unknown, expected: unknown, label: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${label} must be ${JSON.stringify(expected)}; got ${JSON.stringify(actual)}`,
    );
  }
}

function assertNear(
  actual: number,
  expected: number,
  tolerance: number,
  label: string,
): void {
  if (
    !Number.isFinite(actual)
    || !Number.isFinite(expected)
    || Math.abs(actual - expected) > tolerance
  ) {
    throw new Error(
      `${label} must match within ${tolerance}; got ${actual} vs ${expected}`,
    );
  }
}

function assertDeepEqual(label: string, left: unknown, right: unknown): void {
  if (canonicalJson(left) !== canonicalJson(right)) {
    throw new Error(`${label} must be identical`);
  }
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error("cannot compare undefined value");
    return serialized;
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([left], [right]) => left.localeCompare(right),
  );
  return `{${entries.map(([key, child]) =>
    `${JSON.stringify(key)}:${canonicalJson(child)}`).join(",")}}`;
}

function assertStringArraysEqual(
  left: readonly string[],
  right: readonly string[],
  label: string,
): void {
  if (
    left.length !== right.length
    || left.some((value, index) => value !== right[index])
  ) throw new Error(`${label} must be identical`);
}

function requiredArgument(name: string): string {
  const indices = process.argv.flatMap((value, index) =>
    value === name ? [index] : []);
  if (indices.length !== 1) {
    throw new Error(`${name} must be supplied exactly once`);
  }
  const value = process.argv[indices[0]! + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
