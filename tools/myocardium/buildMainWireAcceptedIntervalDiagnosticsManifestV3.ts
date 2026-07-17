import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import type {
  MainWireNormalAdultFiveWallPeriodicSummaryV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV2";

const MANIFEST_ID =
  "main-wire-accepted-interval-diagnostics-evidence-manifest-v3" as const;
const COMPARISON_ID =
  "main-wire-normal-adult-five-wall-analytic-vs-event-v1" as const;
const SUMMARY_ID =
  "main-wire-normal-adult-five-wall-periodic-summary-v2" as const;
const FIXED_TOTAL_BLOOD_VOLUME_ML = 5522.11 as const;
const BLOOD_VOLUME_PARAMETER_SET_ID =
  "main-wire-normal-adult-noncoronary-fixed-tbv-5522p11ml-v1" as const;
const BLOOD_VOLUME_OWNER_ID =
  "main-wire-normal-adult-blood-volume-operating-point-v1" as const;
const ANALYTIC_REPRESENTATION =
  "analytic-periodic-control-with-exact-event-shadow" as const;
const EXACT_EVENT_REPRESENTATION = "exact-event-state" as const;
const COMPARISON_DT_SEC = 0.002 as const;
const COMPARISON_ENDPOINT_COUNT = 500 as const;
const COMPARISON_TIME_TOLERANCE_SEC = 1e-10 as const;
const COMPARISON_SIGNAL_GROUPS = Object.freeze([
  "nodeVolumeMl",
  "nodeAbsolutePressureMmHg",
  "chamberTransmuralPressureMmHg",
  "flowMlPerSec",
  "freeCalciumUM",
  "wallStressPa",
  "wallEnergyLedgerDensity",
] as const);

type JsonRecord = Record<string, unknown>;

type CaseSpec = Readonly<{
  caseId: string;
  calciumRepresentation:
    | typeof ANALYTIC_REPRESENTATION
    | typeof EXACT_EVENT_REPRESENTATION;
  nominalDtSec: 0.001 | 0.002;
  laSlsMode: "on" | "exact-off";
  pericardiumCase: "healthy-slack" | "effusion-300ml-positive-control";
  initialization: "canonical" | "cycle-boundary-warm-start";
}>;

const CASE_SPECS: readonly CaseSpec[] = Object.freeze([
  Object.freeze({
    caseId: "healthy-analytic-dt2ms",
    calciumRepresentation: ANALYTIC_REPRESENTATION,
    nominalDtSec: 0.002,
    laSlsMode: "on",
    pericardiumCase: "healthy-slack",
    initialization: "cycle-boundary-warm-start",
  }),
  Object.freeze({
    caseId: "healthy-analytic-dt1ms",
    calciumRepresentation: ANALYTIC_REPRESENTATION,
    nominalDtSec: 0.001,
    laSlsMode: "on",
    pericardiumCase: "healthy-slack",
    initialization: "cycle-boundary-warm-start",
  }),
  Object.freeze({
    caseId: "healthy-exact-dt2ms",
    calciumRepresentation: EXACT_EVENT_REPRESENTATION,
    nominalDtSec: 0.002,
    laSlsMode: "on",
    pericardiumCase: "healthy-slack",
    initialization: "canonical",
  }),
  Object.freeze({
    caseId: "sls-off-analytic-dt2ms",
    calciumRepresentation: ANALYTIC_REPRESENTATION,
    nominalDtSec: 0.002,
    laSlsMode: "exact-off",
    pericardiumCase: "healthy-slack",
    initialization: "canonical",
  }),
  Object.freeze({
    caseId: "effusion-analytic-dt2ms",
    calciumRepresentation: ANALYTIC_REPRESENTATION,
    nominalDtSec: 0.002,
    laSlsMode: "on",
    pericardiumCase: "effusion-300ml-positive-control",
    initialization: "cycle-boundary-warm-start",
  }),
  Object.freeze({
    caseId: "effusion-analytic-dt1ms",
    calciumRepresentation: ANALYTIC_REPRESENTATION,
    nominalDtSec: 0.001,
    laSlsMode: "on",
    pericardiumCase: "effusion-300ml-positive-control",
    initialization: "cycle-boundary-warm-start",
  }),
]);

const verificationDirectory = path.resolve(requiredArgument("--verification"));
const visualDirectory = path.resolve(requiredArgument("--visuals"));
const outputPath = path.resolve(requiredArgument("--output"));
const sourceRevision = requiredArgument("--source-revision");

const cases = Object.freeze(Object.fromEntries(CASE_SPECS.map((spec) => {
  const summaryPath = verificationPath(`${spec.caseId}-summary-v2.json`);
  const reviewBaseName =
    `mainwire-accepted-interval-diagnostics-v3-${spec.caseId}-review-v2`;
  const reviewHtmlPath = visualPath(`${reviewBaseName}.html`);
  const reviewSvgPath = visualPath(`${reviewBaseName}.svg`);
  const rawPath = verificationPath(`${spec.caseId}-raw.json`);
  const summaryValue = readJson(summaryPath);
  const summary = validateSummary(summaryValue, spec);
  return [spec.caseId, Object.freeze({
    protocol: Object.freeze({
      calciumRepresentation: summary.source.calciumRepresentation,
      nominalDtSec: summary.source.nominalDtSec,
      initialization: summary.source.initialization,
      laSlsMode: summary.source.laSlsMode,
      pericardiumMode: summary.source.pericardiumMode,
      pericardiumCase: summary.source.pericardiumCase,
      protocolIdentityHash: summary.protocol.identityHash,
      protocolComponentHashes: summary.protocol.componentHashes,
    }),
    bloodVolumeOperatingPoint: Object.freeze({
      parameterSetId: summary.bloodVolumeOperatingPoint.parameterSetId,
      fixedTotalBloodVolumeMl:
        summary.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl,
      resolvedTotalBloodVolumeMl:
        summary.bloodVolumeOperatingPoint.resolvedTotalBloodVolumeMl,
      readbackOnly: summary.claim.bloodVolumeOperatingPointReadbackOnly,
    }),
    pressureOwnership: Object.freeze({
      laPvMorphologyPressureCoordinate:
        summary.claim.laPvMorphologyPressureCoordinate,
      transmuralPressureReservedForWallWorkAndConstitutiveDiagnostics:
        summary.claim
          .transmuralPressureReservedForWallWorkAndConstitutiveDiagnostics,
    }),
    integration: Object.freeze({
      completedWithoutFailure:
        summary.source.integrationCompletedWithoutFailure,
      failure: summary.source.failure,
      requestedMaximumBeatCount: summary.source.requestedMaximumBeatCount,
      completedBeatCount: summary.source.completedBeatCount,
      terminationReason: summary.source.terminationReason,
      summaryStatus: summary.status,
      summaryReason: summary.reason,
    }),
    convergence: Object.freeze({
      periodicSteadyStateClaimed:
        summary.convergence.periodicSteadyStateClaimed,
      period2OrbitSuspected: summary.convergence.period2OrbitSuspected,
      classifier: summary.convergence.classifier,
    }),
    morphologyInterpretation: summary.morphologyInterpretation,
    acceptedTimebase: Object.freeze({
      selectedBeatIndex: summary.selectedCycle.beatIndex,
      nominalGridCount: summary.selectedCycle.nominalGridCount,
      acceptedIntervalCount: summary.selectedCycle.acceptedIntervalCount,
      acceptedEventCount: summary.selectedCycle.acceptedEventCount,
      minimumAcceptedDtSec: summary.selectedCycle.minimumAcceptedDtSec,
      maximumAcceptedDtSec: summary.selectedCycle.maximumAcceptedDtSec,
      precedingAcceptedSampleAvailable:
        summary.selectedCycle.precedingAcceptedSampleAvailable,
    }),
    artifacts: Object.freeze({
      summary: trackedArtifact(summaryPath),
      reviewHtml: trackedArtifact(reviewHtmlPath),
      reviewSvg: trackedArtifact(reviewSvgPath),
      raw: localRawArtifact(rawPath),
    }),
  })];
})));

const comparisonPath = verificationPath("analytic-vs-event-dt2ms-v1.json");
const comparison = requireRecord(readJson(comparisonPath), "comparison");
const comparisonSummary = validateAndExtractComparisonSummary(comparison);

const manifest = Object.freeze({
  manifestId: MANIFEST_ID,
  sourceRevision,
  evidenceScope: Object.freeze({
    modelCoreRuntimeAdoptionClaimed: false,
    parameterSearchOrFitting: false,
    smoothingOrResampling: false,
    rawResultsCommitted: false,
    fixedTotalBloodVolumeMl: FIXED_TOTAL_BLOOD_VOLUME_ML,
    pressureOwnership: Object.freeze({
      pvMorphology: "intracavitary-absolute-pressure" as const,
      wallWorkAndConstitutiveDiagnostics: "transmural-pressure" as const,
    }),
    bloodVolumeOperatingPointUse: "readback-only" as const,
  }),
  bootstrap: Object.freeze({
    role: "shared-cycle-boundary-warm-start-source" as const,
    artifact: localRawArtifact(
      verificationPath("bootstrap-analytic-dt4ms-raw.json"),
    ),
  }),
  cases,
  analyticVsEventComparison: Object.freeze({
    artifact: trackedArtifact(comparisonPath),
    rawInputs: Object.freeze({
      analyticControl: localRawArtifact(
        verificationPath("healthy-analytic-control-dt2ms-raw.json"),
      ),
      exactEvent: localRawArtifact(
        verificationPath("healthy-exact-dt2ms-raw.json"),
      ),
    }),
    summary: comparisonSummary,
  }),
});

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, serialized);
process.stdout.write(`${JSON.stringify({
  outputPath,
  manifestId: MANIFEST_ID,
  sourceRevision,
  caseCount: CASE_SPECS.length,
  trackedArtifactCount: CASE_SPECS.length * 3 + 1,
  comparisonId: COMPARISON_ID,
  manifestBytes: Buffer.byteLength(serialized),
})}\n`);

function validateSummary(
  value: unknown,
  spec: CaseSpec,
): MainWireNormalAdultFiveWallPeriodicSummaryV2 {
  const label = `summary ${spec.caseId}`;
  const summary = requireRecord(value, label);
  expectEqual(summary.summaryId, SUMMARY_ID, `${label}.summaryId`);
  expectEqual(summary.status, "complete", `${label}.status`);
  expectEqual(summary.reason, "complete-accepted-window", `${label}.reason`);

  const source = requireRecord(summary.source, `${label}.source`);
  expectEqual(
    source.calciumRepresentation,
    spec.calciumRepresentation,
    `${label}.source.calciumRepresentation`,
  );
  expectEqual(
    source.initialization,
    spec.initialization,
    `${label}.source.initialization`,
  );
  expectEqual(
    source.nominalDtSec,
    spec.nominalDtSec,
    `${label}.source.nominalDtSec`,
  );
  expectEqual(source.laSlsMode, spec.laSlsMode, `${label}.source.laSlsMode`);
  expectEqual(source.pericardiumMode, "on", `${label}.source.pericardiumMode`);
  expectEqual(
    source.pericardiumCase,
    spec.pericardiumCase,
    `${label}.source.pericardiumCase`,
  );
  expectEqual(
    source.integrationCompletedWithoutFailure,
    true,
    `${label}.source.integrationCompletedWithoutFailure`,
  );
  expectEqual(source.failure, null, `${label}.source.failure`);

  const operatingPoint = requireRecord(
    summary.bloodVolumeOperatingPoint,
    `${label}.bloodVolumeOperatingPoint`,
  );
  expectEqual(
    operatingPoint.status,
    "available",
    `${label}.bloodVolumeOperatingPoint.status`,
  );
  expectEqual(
    operatingPoint.parameterSetId,
    BLOOD_VOLUME_PARAMETER_SET_ID,
    `${label}.bloodVolumeOperatingPoint.parameterSetId`,
  );
  expectEqual(
    operatingPoint.fixedTotalBloodVolumeMl,
    FIXED_TOTAL_BLOOD_VOLUME_ML,
    `${label}.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl`,
  );
  expectEqual(
    operatingPoint.resolvedTotalBloodVolumeMl,
    FIXED_TOTAL_BLOOD_VOLUME_ML,
    `${label}.bloodVolumeOperatingPoint.resolvedTotalBloodVolumeMl`,
  );

  const protocol = requireRecord(summary.protocol, `${label}.protocol`);
  const identity = requireRecord(protocol.identity, `${label}.protocol.identity`);
  const protocolOperatingPoint = requireRecord(
    identity.bloodVolumeOperatingPoint,
    `${label}.protocol.identity.bloodVolumeOperatingPoint`,
  );
  expectEqual(
    protocolOperatingPoint.parameterSetId,
    BLOOD_VOLUME_PARAMETER_SET_ID,
    `${label}.protocol.identity.bloodVolumeOperatingPoint.parameterSetId`,
  );
  expectEqual(
    protocolOperatingPoint.fixedTotalBloodVolumeMl,
    FIXED_TOTAL_BLOOD_VOLUME_ML,
    `${label}.protocol.identity.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl`,
  );
  const calciumDrive = requireRecord(
    identity.calciumDrive,
    `${label}.protocol.identity.calciumDrive`,
  );
  expectEqual(
    calciumDrive.representation,
    spec.calciumRepresentation,
    `${label}.protocol.identity.calciumDrive.representation`,
  );

  const claim = requireRecord(summary.claim, `${label}.claim`);
  expectEqual(
    claim.laPvMorphologyPressureCoordinate,
    "intracavitary-absolute-pressure",
    `${label}.claim.laPvMorphologyPressureCoordinate`,
  );
  expectEqual(
    claim.transmuralPressureReservedForWallWorkAndConstitutiveDiagnostics,
    true,
    `${label}.claim.transmuralPressureReservedForWallWorkAndConstitutiveDiagnostics`,
  );
  expectEqual(
    claim.bloodVolumeOperatingPointReadbackOnly,
    true,
    `${label}.claim.bloodVolumeOperatingPointReadbackOnly`,
  );

  requireRecord(summary.convergence, `${label}.convergence`);
  requireRecord(
    summary.morphologyInterpretation,
    `${label}.morphologyInterpretation`,
  );
  const selectedCycle = requireRecord(
    summary.selectedCycle,
    `${label}.selectedCycle`,
  );
  requireNonNegativeInteger(
    selectedCycle.nominalGridCount,
    `${label}.selectedCycle.nominalGridCount`,
  );
  requireNonNegativeInteger(
    selectedCycle.acceptedIntervalCount,
    `${label}.selectedCycle.acceptedIntervalCount`,
  );
  requireNonNegativeInteger(
    selectedCycle.acceptedEventCount,
    `${label}.selectedCycle.acceptedEventCount`,
  );
  return value as MainWireNormalAdultFiveWallPeriodicSummaryV2;
}

function validateAndExtractComparisonSummary(comparison: JsonRecord) {
  expectEqual(comparison.comparisonId, COMPARISON_ID, "comparison.comparisonId");
  expectEqual(comparison.schemaVersion, 1, "comparison.schemaVersion");

  const inputs = requireRecord(comparison.inputs, "comparison.inputs");
  validateComparisonInput(
    requireRecord(inputs.analytic, "comparison.inputs.analytic"),
    "analytic",
    "healthy-analytic-control-dt2ms-raw.json",
    ANALYTIC_REPRESENTATION,
  );
  validateComparisonInput(
    requireRecord(inputs.event, "comparison.inputs.event"),
    "event",
    "healthy-exact-dt2ms-raw.json",
    EXACT_EVENT_REPRESENTATION,
  );

  const operatingPoint = requireRecord(
    comparison.operatingPoint,
    "comparison.operatingPoint",
  );
  validateComparisonOperatingPoint(operatingPoint);

  const protocol = requireRecord(comparison.protocol, "comparison.protocol");
  validateComparisonProtocol(protocol);

  const acceptedEndpointPairing = requireRecord(
    comparison.acceptedEndpointPairing,
    "comparison.acceptedEndpointPairing",
  );
  validateAcceptedEndpointPairing(acceptedEndpointPairing);

  const signalDifferences = requireRecord(
    comparison.signalDifferences,
    "comparison.signalDifferences",
  );
  expectExactKeys(
    signalDifferences,
    COMPARISON_SIGNAL_GROUPS,
    "comparison.signalDifferences",
  );
  const compactSignalDifferences = Object.freeze(Object.fromEntries(
    COMPARISON_SIGNAL_GROUPS.map((groupId) => {
      const group = requireRecord(
        signalDifferences[groupId],
        `comparison.signalDifferences.${groupId}`,
      );
      const signalCount = requirePositiveInteger(
        group.signalCount,
        `comparison.signalDifferences.${groupId}.signalCount`,
      );
      const maximumAbsoluteDifference = requireNonNegativeFiniteNumber(
        group.maximumAbsoluteDifference,
        `comparison.signalDifferences.${groupId}.maximumAbsoluteDifference`,
      );
      const worstSignalPath = requireString(
        group.worstSignalPath,
        `comparison.signalDifferences.${groupId}.worstSignalPath`,
      );
      const worstRelativeTimeSec = requireFiniteNumber(
        group.worstRelativeTimeSec,
        `comparison.signalDifferences.${groupId}.worstRelativeTimeSec`,
      );
      return [groupId, Object.freeze({
        signalCount,
        maximumAbsoluteDifference,
        worstSignalPath,
        worstRelativeTimeSec,
        analyticValueAtWorst: requireFiniteNumber(
          group.analyticValueAtWorst,
          `comparison.signalDifferences.${groupId}.analyticValueAtWorst`,
        ),
        eventValueAtWorst: requireFiniteNumber(
          group.eventValueAtWorst,
          `comparison.signalDifferences.${groupId}.eventValueAtWorst`,
        ),
      })];
    }),
  ));

  const convergence = requireRecord(
    comparison.convergence,
    "comparison.convergence",
  );
  const compactConvergence = Object.freeze({
    analytic: validateComparisonConvergence(
      requireRecord(convergence.analytic, "comparison.convergence.analytic"),
      "analytic",
    ),
    event: validateComparisonConvergence(
      requireRecord(convergence.event, "comparison.convergence.event"),
      "event",
    ),
  });

  const headline = requireRecord(comparison.headline, "comparison.headline");
  expectEqual(
    headline.pairedEndpointCount,
    COMPARISON_ENDPOINT_COUNT,
    "comparison.headline.pairedEndpointCount",
  );
  expectEqual(
    headline.maximumRelativeTimeMismatchSec,
    acceptedEndpointPairing.maximumRelativeTimeMismatchSec,
    "comparison headline/pairing maximumRelativeTimeMismatchSec",
  );
  const maximumByGroup = requireRecord(
    headline.maximumAbsoluteDifferenceBySignalGroup,
    "comparison.headline.maximumAbsoluteDifferenceBySignalGroup",
  );
  expectExactKeys(
    maximumByGroup,
    COMPARISON_SIGNAL_GROUPS,
    "comparison.headline.maximumAbsoluteDifferenceBySignalGroup",
  );
  for (const groupId of COMPARISON_SIGNAL_GROUPS) {
    expectEqual(
      maximumByGroup[groupId],
      compactSignalDifferences[groupId].maximumAbsoluteDifference,
      `comparison headline/signal difference ${groupId}`,
    );
  }

  const claim = requireRecord(comparison.claim, "comparison.claim");
  validateComparisonClaim(claim);
  return Object.freeze({
    comparisonId: COMPARISON_ID,
    operatingPoint,
    protocol,
    acceptedEndpointPairing,
    convergence: compactConvergence,
    signalDifferences: compactSignalDifferences,
    headline,
    claim,
  });
}

function validateComparisonInput(
  input: JsonRecord,
  label: "analytic" | "event",
  expectedFileName: string,
  expectedRepresentation:
    | typeof ANALYTIC_REPRESENTATION
    | typeof EXACT_EVENT_REPRESENTATION,
): void {
  const prefix = `comparison.inputs.${label}`;
  const inputPath = requireString(input.path, `${prefix}.path`);
  expectEqual(path.basename(inputPath), expectedFileName, `${prefix}.path`);
  expectEqual(input.schemaVersion, 3, `${prefix}.schemaVersion`);
  expectEqual(input.initialization, "canonical", `${prefix}.initialization`);
  expectEqual(
    input.calciumRepresentation,
    expectedRepresentation,
    `${prefix}.calciumRepresentation`,
  );
  expectEqual(input.dtSec, COMPARISON_DT_SEC, `${prefix}.dtSec`);
  expectEqual(
    input.stepsPerBeat,
    COMPARISON_ENDPOINT_COUNT,
    `${prefix}.stepsPerBeat`,
  );
  expectEqual(input.laSlsMode, "on", `${prefix}.laSlsMode`);
  expectEqual(input.pericardiumMode, "on", `${prefix}.pericardiumMode`);
  expectEqual(input.pericardiumCase, "healthy-slack", `${prefix}.pericardiumCase`);
  const operatingPoint = requireRecord(
    input.bloodVolumeOperatingPoint,
    `${prefix}.bloodVolumeOperatingPoint`,
  );
  expectEqual(operatingPoint.status, "available", `${prefix} TBV status`);
  expectEqual(
    operatingPoint.parameterSetId,
    BLOOD_VOLUME_PARAMETER_SET_ID,
    `${prefix} TBV parameter set`,
  );
  expectEqual(
    operatingPoint.fixedTotalBloodVolumeMl,
    FIXED_TOTAL_BLOOD_VOLUME_ML,
    `${prefix} fixed TBV`,
  );
  expectEqual(
    operatingPoint.resolvedTotalBloodVolumeMl,
    FIXED_TOTAL_BLOOD_VOLUME_ML,
    `${prefix} resolved TBV`,
  );
}

function validateComparisonOperatingPoint(operatingPoint: JsonRecord): void {
  expectEqual(
    operatingPoint.ownerId,
    BLOOD_VOLUME_OWNER_ID,
    "comparison.operatingPoint.ownerId",
  );
  expectEqual(
    operatingPoint.parameterSetId,
    BLOOD_VOLUME_PARAMETER_SET_ID,
    "comparison.operatingPoint.parameterSetId",
  );
  expectEqual(
    operatingPoint.fixedTotalBloodVolumeMl,
    FIXED_TOTAL_BLOOD_VOLUME_ML,
    "comparison.operatingPoint.fixedTotalBloodVolumeMl",
  );
  expectEqual(
    operatingPoint.analyticResolvedTotalBloodVolumeMl,
    FIXED_TOTAL_BLOOD_VOLUME_ML,
    "comparison.operatingPoint.analyticResolvedTotalBloodVolumeMl",
  );
  expectEqual(
    operatingPoint.eventResolvedTotalBloodVolumeMl,
    FIXED_TOTAL_BLOOD_VOLUME_ML,
    "comparison.operatingPoint.eventResolvedTotalBloodVolumeMl",
  );
  expectEqual(
    operatingPoint.readbackOnly,
    true,
    "comparison.operatingPoint.readbackOnly",
  );
}

function validateComparisonProtocol(protocol: JsonRecord): void {
  expectEqual(
    protocol.representationOnlyDifferenceValidated,
    true,
    "comparison.protocol.representationOnlyDifferenceValidated",
  );
  const sharedComponentHashes = requireRecord(
    protocol.sharedComponentHashes,
    "comparison.protocol.sharedComponentHashes",
  );
  if (Object.keys(sharedComponentHashes).length === 0) {
    throw new Error("comparison.protocol.sharedComponentHashes must not be empty");
  }
  const analytic = requireRecord(
    protocol.analytic,
    "comparison.protocol.analytic",
  );
  const event = requireRecord(protocol.event, "comparison.protocol.event");
  expectEqual(
    analytic.representation,
    ANALYTIC_REPRESENTATION,
    "comparison.protocol.analytic.representation",
  );
  expectEqual(
    event.representation,
    EXACT_EVENT_REPRESENTATION,
    "comparison.protocol.event.representation",
  );
  const analyticStateHash = requireString(
    analytic.calciumStateContractStableHash,
    "comparison.protocol.analytic.calciumStateContractStableHash",
  );
  const eventStateHash = requireString(
    event.calciumStateContractStableHash,
    "comparison.protocol.event.calciumStateContractStableHash",
  );
  if (analyticStateHash === eventStateHash) {
    throw new Error("comparison calcium state contract hashes must differ");
  }
}

function validateAcceptedEndpointPairing(pairing: JsonRecord): void {
  expectEqual(
    pairing.coordinate,
    "relative-physical-time-from-beat-start",
    "comparison.acceptedEndpointPairing.coordinate",
  );
  expectEqual(
    pairing.matching,
    "one-to-one-without-resampling",
    "comparison.acceptedEndpointPairing.matching",
  );
  expectEqual(
    pairing.timeToleranceSec,
    COMPARISON_TIME_TOLERANCE_SEC,
    "comparison.acceptedEndpointPairing.timeToleranceSec",
  );
  for (const field of [
    "analyticEndpointCount",
    "eventEndpointCount",
    "pairedEndpointCount",
  ] as const) {
    expectEqual(
      pairing[field],
      COMPARISON_ENDPOINT_COUNT,
      `comparison.acceptedEndpointPairing.${field}`,
    );
  }
  const mismatch = requireNonNegativeFiniteNumber(
    pairing.maximumRelativeTimeMismatchSec,
    "comparison.acceptedEndpointPairing.maximumRelativeTimeMismatchSec",
  );
  if (mismatch > COMPARISON_TIME_TOLERANCE_SEC) {
    throw new Error(
      "comparison accepted endpoint mismatch exceeds the stated tolerance",
    );
  }
  for (const label of ["analyticBeat", "eventBeat"] as const) {
    const beat = requireRecord(
      pairing[label],
      `comparison.acceptedEndpointPairing.${label}`,
    );
    expectEqual(
      beat.durationSec,
      1,
      `comparison.acceptedEndpointPairing.${label}.durationSec`,
    );
    expectEqual(
      beat.acceptedIntervalCount,
      COMPARISON_ENDPOINT_COUNT,
      `comparison.acceptedEndpointPairing.${label}.acceptedIntervalCount`,
    );
    expectEqual(
      beat.precedingAcceptedSampleAvailable,
      true,
      `comparison.acceptedEndpointPairing.${label}.precedingAcceptedSampleAvailable`,
    );
  }
}

function validateComparisonConvergence(
  convergence: JsonRecord,
  label: "analytic" | "event",
) {
  const prefix = `comparison.convergence.${label}`;
  expectEqual(convergence.initialization, "canonical", `${prefix}.initialization`);
  expectEqual(
    convergence.integrationCompletedWithoutFailure,
    true,
    `${prefix}.integrationCompletedWithoutFailure`,
  );
  expectEqual(
    convergence.terminationReason,
    "period1-converged",
    `${prefix}.terminationReason`,
  );
  expectEqual(
    convergence.periodicSteadyStateClaimed,
    true,
    `${prefix}.periodicSteadyStateClaimed`,
  );
  expectEqual(
    convergence.period2OrbitSuspected,
    false,
    `${prefix}.period2OrbitSuspected`,
  );
  return Object.freeze({
    initialization: convergence.initialization,
    requestedMaximumBeatCount: requirePositiveInteger(
      convergence.requestedMaximumBeatCount,
      `${prefix}.requestedMaximumBeatCount`,
    ),
    completedBeatCount: requirePositiveInteger(
      convergence.completedBeatCount,
      `${prefix}.completedBeatCount`,
    ),
    terminationReason: convergence.terminationReason,
    integrationCompletedWithoutFailure:
      convergence.integrationCompletedWithoutFailure,
    periodicSteadyStateClaimed: convergence.periodicSteadyStateClaimed,
    period2OrbitSuspected: convergence.period2OrbitSuspected,
  });
}

function validateComparisonClaim(claim: JsonRecord): void {
  expectEqual(
    claim.parameterFittingApplied,
    false,
    "comparison.claim.parameterFittingApplied",
  );
  expectEqual(
    claim.timeSeriesSmoothingApplied,
    false,
    "comparison.claim.timeSeriesSmoothingApplied",
  );
  expectEqual(
    claim.timeSeriesResamplingOrInterpolationApplied,
    false,
    "comparison.claim.timeSeriesResamplingOrInterpolationApplied",
  );
  expectEqual(
    claim.laPvMorphologyPressureCoordinate,
    "intracavitary-absolute-pressure",
    "comparison.claim.laPvMorphologyPressureCoordinate",
  );
  expectEqual(
    claim.wallWorkPressureCoordinate,
    "transmural-pressure",
    "comparison.claim.wallWorkPressureCoordinate",
  );
  expectEqual(
    claim.transmuralPressureReservedForWallWorkAndConstitutiveDiagnostics,
    true,
    "comparison.claim.transmuralPressureReservedForWallWorkAndConstitutiveDiagnostics",
  );
  expectEqual(
    claim.bloodVolumeOperatingPointReadbackOnly,
    true,
    "comparison.claim.bloodVolumeOperatingPointReadbackOnly",
  );
}

function trackedArtifact(inputPath: string) {
  const bytes = readFileSync(inputPath);
  if (bytes.byteLength === 0) {
    throw new Error(`tracked artifact is empty: ${inputPath}`);
  }
  return Object.freeze({
    path: path.relative(process.cwd(), inputPath),
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    repositoryDisposition: "commit" as const,
  });
}

function localRawArtifact(inputPath: string) {
  const bytes = statSync(inputPath).size;
  if (bytes === 0) {
    throw new Error(`local raw artifact is empty: ${inputPath}`);
  }
  return Object.freeze({
    path: path.relative(process.cwd(), inputPath),
    bytes,
    repositoryDisposition: "local-not-committed" as const,
    sha256: null,
    integrity: "not-hashed-reproducible-intermediate" as const,
  });
}

function readJson(inputPath: string): unknown {
  return JSON.parse(readFileSync(inputPath, "utf8")) as unknown;
}

function verificationPath(fileName: string): string {
  return path.join(verificationDirectory, fileName);
}

function visualPath(fileName: string): string {
  return path.join(visualDirectory, fileName);
}

function requireRecord(value: unknown, label: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value as JsonRecord;
}

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value as number;
}

function requirePositiveInteger(value: unknown, label: string): number {
  const integer = requireNonNegativeInteger(value, label);
  if (integer === 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return integer;
}

function requireFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requireNonNegativeFiniteNumber(
  value: unknown,
  label: string,
): number {
  const finite = requireFiniteNumber(value, label);
  if (finite < 0) {
    throw new Error(`${label} must be non-negative`);
  }
  return finite;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function expectEqual(actual: unknown, expected: unknown, label: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${label} must be ${JSON.stringify(expected)}; got ${JSON.stringify(actual)}`,
    );
  }
}

function expectExactKeys(
  record: JsonRecord,
  expectedKeys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(record).sort();
  const expected = [...expectedKeys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label} keys must be ${JSON.stringify(expected)}; got ${JSON.stringify(actual)}`,
    );
  }
}

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
