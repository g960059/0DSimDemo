import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const TERRITORY_IDS = ["LAD", "LCx", "RCA"] as const;
const LAYER_IDS = ["subepicardial", "subendocardial"] as const;

type TerritoryId = typeof TERRITORY_IDS[number];
type LayerId = typeof LAYER_IDS[number];
type JsonObject = Record<string, unknown>;

const inputPaths = inputArguments("--input");
const outputPath = requiredPathArgument("--output");
const focusTerritory = enumArgument(
  "--territory",
  TERRITORY_IDS,
  "LAD",
);
const focusLayer = enumArgument(
  "--layer",
  LAYER_IDS,
  "subendocardial",
);
const retainWaveformSamples = process.argv.includes("--retain-waveform-samples");

if (inputPaths.length === 0) {
  throw new Error(
    "At least one --input report is required (comma-separated paths are supported)",
  );
}
if (inputPaths.some((inputPath) => inputPath === outputPath)) {
  throw new Error("--output must not overwrite an --input report");
}

const rows = inputPaths.map((inputPath, inputIndex) =>
  summarizeReport(
    inputPath,
    inputIndex,
    focusTerritory,
    focusLayer,
    retainWaveformSamples,
  ));
const output = Object.freeze({
  schema: "circleheart.coronary-v2-factorial-comparison-summary.v1" as const,
  completed: true as const,
  claim: Object.freeze({
    role: "compact-cross-report-mechanism-comparison" as const,
    sourceWaveformSamplesRetained: retainWaveformSamples,
    fullSourceArtifactsRequiredForRendering: false as const,
    parameterFit: false as const,
    rowOrder: "explicit-input-order" as const,
  }),
  reproduction: Object.freeze({
    boundaryReportGenerator:
      "tools/coronary/runMainWireFiveWallCoronaryValidationV1.ts" as const,
    shadowReportGenerator:
      "tools/coronary/runCoronaryV2TerminalBoundaryShadow.ts" as const,
    compactSummarizer:
      "tools/coronary/summarizeCoronaryV2Reports.ts" as const,
    htmlRenderer:
      "tools/coronary/renderCoronaryV2TransportFactorial.ts" as const,
    beatingReferenceProtocol: Object.freeze({
      target: "accepted-cycle-mean-qm-only" as const,
      waveformObjectiveUsed: false as const,
      toneMode: "accepted-layer-autoregulation" as const,
    }),
    waveformIsolationProtocol: Object.freeze({
      toneMode: "fixed" as const,
      r1ReferenceMode: "rebased-accepted-tone" as const,
      retainedCycle: "terminal-cycle" as const,
    }),
    intermediateFullReports: "transient-hash-recorded" as const,
  }),
  focus: Object.freeze({
    territory: focusTerritory,
    layer: focusLayer,
  }),
  sourceCount: rows.length,
  rows: Object.freeze(rows),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`${outputPath}\n`);

function summarizeReport(
  inputPath: string,
  inputIndex: number,
  territoryId: TerritoryId,
  layerId: LayerId,
  retainSamples: boolean,
): Readonly<Record<string, unknown>> {
  const sourceText = readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(sourceText) as unknown;
  if (!isObject(parsed)) {
    throw new Error(`Expected a JSON object: ${inputPath}`);
  }

  const summary = objectAt(parsed, "finalSummary", "summary");
  const territorySummary = objectAt(summary, "territory", territoryId);
  const layerSummary = objectAt(territorySummary, "layers", layerId);
  const configuration = objectAt(parsed, "configuration");
  const descriptor = objectAt(
    configuration,
    "r1ReferenceCalibration",
    "descriptor",
  );
  const referenceSource = objectAt(
    configuration,
    "r1ReferenceCalibration",
    "source",
  );
  const referenceReportPath = stringAt(
    configuration,
    "r1ReferenceReportPath",
  );

  return Object.freeze({
    inputIndex,
    source: Object.freeze({
      path: displayPath(inputPath),
      sha256: createHash("sha256").update(sourceText).digest("hex"),
      schema: stringAt(parsed, "schema"),
      completed: booleanAt(parsed, "completed"),
      finalBeatIndex: numberAt(parsed, "finalSummary", "beatIndex"),
    }),
    provenance: Object.freeze({
      claimRole: stringAt(parsed, "claim", "role"),
      sourceSchema: stringAt(configuration, "sourceSchema"),
      sourcePath: nullableBasename(stringAt(configuration, "sourcePath")),
      sourceTerminalBeatIndex:
        numberAt(configuration, "sourceTerminalBeatIndex"),
      boundaryFingerprint: stringAt(configuration, "boundaryFingerprint"),
      backwardEulerBoundaryConvention:
        stringAt(configuration, "backwardEulerBoundaryConvention"),
      dtSec: numberAt(configuration, "dtSec"),
      cycleLengthSec: numberAt(configuration, "cycleLengthSec"),
      aorticClosurePhase01:
        numberAt(configuration, "phaseDefinition", "aorticClosurePhase01"),
      topologyId: stringAt(configuration, "topologyId"),
    }),
    construction: Object.freeze({
      resistancePartitionMode:
        stringAt(configuration, "resistancePartitionMode"),
      largeArterialComplianceScale:
        numberAt(configuration, "largeArterialComplianceScale"),
      intramyocardialComplianceScale: Object.freeze({
        c1Proximal: firstNumber(
          numberAt(
            configuration,
            "intramyocardialComplianceScale",
            "c1Proximal",
          ),
          numberAt(configuration, "intramyocardialC1ComplianceScale"),
        ) ?? 1,
        c2Distal: firstNumber(
          numberAt(
            configuration,
            "intramyocardialComplianceScale",
            "c2Distal",
          ),
          numberAt(configuration, "intramyocardialC2ComplianceScale"),
        ) ?? 1,
      }),
      impMechanism: stringAt(configuration, "impMechanism"),
      shorteningImpTargetPeakMmHg:
        numberAt(
          configuration,
          "shorteningImpReference",
          "targetPeakShorteningPressureMmHg",
        ),
      collapseMode: stringAt(configuration, "collapseMode"),
      collapseResidualHydraulicAreaFraction:
        numberAt(configuration, "collapseResidualHydraulicAreaFraction"),
    }),
    r1Reference: Object.freeze({
      mode: stringAt(configuration, "r1ReferenceMode"),
      calibrationId: stringAt(descriptor, "calibrationId"),
      objective: stringAt(descriptor, "objective"),
      waveformObjectiveUsed:
        booleanAt(descriptor, "waveformObjectiveUsed"),
      sourceReport: optionalFileFingerprint(referenceReportPath),
      sourceRequestedBeatCount:
        numberAt(referenceSource, "sourceRequestedBeatCount"),
      sourceToneLaw: stringAt(referenceSource, "sourceToneLaw"),
      sourceToneUpdateWindowSec:
        numberAt(referenceSource, "sourceToneUpdateWindowSec"),
      sourceMaximumRelativeMeanQmTargetError01:
        numberAt(
          referenceSource,
          "sourceMaximumRelativeMeanQmTargetError01",
        ),
      sourceNonInteriorLayerCount:
        numberAt(referenceSource, "sourceNonInteriorLayerCount"),
      structuralScaleByTerritoryLayer: territoryLayerNumberMap(
        valueAt(descriptor, "proximalArteriolarScaleByTerritoryLayer"),
      ),
      finalToneMode: stringAt(configuration, "toneMode"),
      finalToneScaleByTerritoryLayer: territoryLayerNumberMap(
        valueAt(
          parsed,
          "finalSummary",
          "toneResistanceScaleByTerritoryLayer",
        ),
      ),
    }),
    meanFlow: Object.freeze({
      totalInletMlPerMin: numberAt(summary, "meanTotalInletMlPerMin"),
      massNormalizedInletMlPerMinPerG:
        numberAt(summary, "massNormalizedMeanInletMlPerMinPerG"),
    }),
    totalInlet: compactLedger(objectAt(summary, "totalInlet")),
    territory: territoryHeadline(summary),
    focusEdges: Object.freeze({
      territory: territoryId,
      layer: layerId,
      inlet: compactLedger(objectAt(territorySummary, "inlet")),
      q1: compactLedger(objectAt(layerSummary, "r1")),
      qmInternal: compactLedger(
        objectAt(layerSummary, "qmInternal")
          ?? objectAt(layerSummary, "tissue"),
      ),
      q2: compactLedger(objectAt(layerSummary, "r2")),
    }),
    endocardialToEpicardialMeanQmInternalRatio: territoryNumberMap(
      valueAt(summary, "endocardialToEpicardialMeanQmInternalRatio")
        ?? valueAt(summary, "endocardialToEpicardialTissueFlowRatio"),
    ),
    ...(retainSamples
      ? {
        waveformSamples: compactWaveformSamples(
          parsed,
          territoryId,
          layerId,
        ),
      }
      : {}),
    numericalAudit: Object.freeze({
      periodicClosure: Object.freeze({
        maximumAbsoluteMl:
          numberAt(parsed, "finalSummary", "closure", "maximumAbsoluteMl"),
        maximumRelative01:
          numberAt(parsed, "finalSummary", "closure", "maximumRelative01"),
        signedTotalMl:
          numberAt(parsed, "finalSummary", "closure", "signedTotalMl"),
      }),
      toneClosure: Object.freeze({
        maximumAbsoluteLogResistanceScaleChange: numberAt(
          parsed,
          "finalSummary",
          "toneClosure",
          "maximumAbsoluteLogResistanceScaleChange",
        ),
        maximumRelativeResistanceScaleChange01: numberAt(
          parsed,
          "finalSummary",
          "toneClosure",
          "maximumRelativeResistanceScaleChange01",
        ),
      }),
      minimumEdgeDissipatedPowerMmHgMlPerSec:
        numberAt(
          parsed,
          "runHealth",
          "minimumEdgeDissipatedPowerMmHgMlPerSec",
        ),
      allPassiveEdgesNonnegativePower:
        booleanAt(parsed, "runHealth", "allPassiveEdgesNonnegativePower"),
      maximumAbsoluteLedgerResidualMl:
        numberAt(parsed, "runHealth", "maximumAbsoluteLedgerResidualMl"),
      maximumNewtonIterations:
        numberAt(summary, "maximumNewtonIterations"),
      maximumSolverResidualInfinityNormMl:
        numberAt(summary, "maximumSolverResidualInfinityNormMl"),
    }),
  });
}

function compactWaveformSamples(
  report: JsonObject,
  territoryId: TerritoryId,
  layerId: LayerId,
): ReadonlyArray<Readonly<Record<string, number | null>>> {
  const samples = arrayAt(report, "samples");
  if (samples === null || samples.length < 4) {
    throw new Error("full shadow report lacks a retained terminal waveform");
  }
  return Object.freeze(samples.map((sample, index) => Object.freeze({
    phase01: requiredNumberAt(sample, `sample ${index} phase`, "cyclePhase01"),
    totalInlet: requiredNumberAt(
      sample,
      `sample ${index} total inlet`,
      "flowMlPerSec",
      "totalInlet",
    ),
    territoryInlet: requiredNumberAt(
      sample,
      `sample ${index} ${territoryId} inlet`,
      "flowMlPerSec",
      "inletByTerritory",
      territoryId,
    ),
    q1: requiredNumberAt(
      sample,
      `sample ${index} Q1`,
      "flowMlPerSec",
      "r1ByTerritoryLayer",
      territoryId,
      layerId,
    ),
    qmInternal: requiredFirstNumber(
      `sample ${index} internal Qm`,
      numberAt(
        sample,
        "flowMlPerSec",
        "qmInternalByTerritoryLayer",
        territoryId,
        layerId,
      ),
      numberAt(
        sample,
        "flowMlPerSec",
        "tissueByTerritoryLayer",
        territoryId,
        layerId,
      ),
    ),
    q2: requiredNumberAt(
      sample,
      `sample ${index} Q2`,
      "flowMlPerSec",
      "r2ByTerritoryLayer",
      territoryId,
      layerId,
    ),
    ao: requiredNumberAt(
      sample,
      `sample ${index} aortic pressure`,
      "boundaryPressureMmHg",
      "Ao",
    ),
    imp: numberAt(
      sample,
      "boundaryPressureMmHg",
      "intramyocardialByTerritoryLayer",
      territoryId,
      layerId,
    ),
  })));
}

function territoryHeadline(
  summary: JsonObject | null,
): Readonly<Record<TerritoryId, unknown>> {
  return Object.freeze(Object.fromEntries(TERRITORY_IDS.map((territoryId) => {
    const value = objectAt(summary, "territory", territoryId);
    return [territoryId, Object.freeze({
      inlet: compactLedger(objectAt(value, "inlet")),
      endocardialToEpicardialMeanQmInternalRatio: firstNumber(
        numberAt(
          summary,
          "endocardialToEpicardialMeanQmInternalRatio",
          territoryId,
        ),
        numberAt(
          summary,
          "endocardialToEpicardialTissueFlowRatio",
          territoryId,
        ),
      ),
    })];
  })) as Record<TerritoryId, unknown>);
}

function compactLedger(
  ledger: JsonObject | null,
): Readonly<Record<string, unknown>> {
  const systole = objectAt(ledger, "systole");
  const diastole = objectAt(ledger, "diastole");
  const systolicReverseVolumeMl = numberAt(systole, "reverseVolumeMl");
  const diastolicReverseVolumeMl = numberAt(diastole, "reverseVolumeMl");
  const systolicReverseDurationSec = numberAt(systole, "reverseDurationSec");
  const diastolicReverseDurationSec = numberAt(diastole, "reverseDurationSec");

  return Object.freeze({
    diastolicForwardVolumeFraction01:
      numberAt(ledger, "diastolicForwardVolumeFraction01"),
    peakDiastolicToSystolicForwardFlowRatio:
      numberAt(ledger, "peakDiastolicToSystolicForwardFlowRatio"),
    diastolicPeakDelayAfterAorticClosureSec:
      numberAt(ledger, "diastolicPeakDelayAfterAorticClosureSec"),
    earlyDiastolicForwardVolumeFractionOfDiastole01:
      numberAt(
        ledger,
        "earlyDiastolicForwardVolumeFractionOfDiastole01",
      ),
    reverse: Object.freeze({
      totalVolumeMl:
        nullableSum(systolicReverseVolumeMl, diastolicReverseVolumeMl),
      totalDurationSec:
        nullableSum(systolicReverseDurationSec, diastolicReverseDurationSec),
      systolicVolumeMl: systolicReverseVolumeMl,
      systolicDurationSec: systolicReverseDurationSec,
      diastolicVolumeMl: diastolicReverseVolumeMl,
      diastolicDurationSec: diastolicReverseDurationSec,
    }),
  });
}

function territoryLayerNumberMap(
  value: unknown,
): Readonly<Record<TerritoryId, Readonly<Record<LayerId, number | null>>>> {
  return Object.freeze(Object.fromEntries(TERRITORY_IDS.map((territoryId) => [
    territoryId,
    Object.freeze(Object.fromEntries(LAYER_IDS.map((layerId) => [
      layerId,
      numberAt(value, territoryId, layerId),
    ])) as Record<LayerId, number | null>),
  ])) as Record<TerritoryId, Readonly<Record<LayerId, number | null>>>);
}

function territoryNumberMap(
  value: unknown,
): Readonly<Record<TerritoryId, number | null>> {
  return Object.freeze(Object.fromEntries(TERRITORY_IDS.map((territoryId) => [
    territoryId,
    numberAt(value, territoryId),
  ])) as Record<TerritoryId, number | null>);
}

function nullableSum(...values: ReadonlyArray<number | null>): number | null {
  return values.every((value) => value === null)
    ? null
    : values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

function firstNumber(...values: ReadonlyArray<number | null>): number | null {
  return values.find((value): value is number => value !== null) ?? null;
}

function requiredFirstNumber(
  label: string,
  ...values: ReadonlyArray<number | null>
): number {
  const value = firstNumber(...values);
  if (value === null) throw new Error(`Missing finite ${label}`);
  return value;
}

function valueAt(value: unknown, ...keys: ReadonlyArray<string>): unknown {
  let cursor = value;
  for (const key of keys) {
    if (!isObject(cursor)) return null;
    cursor = cursor[key];
  }
  return cursor ?? null;
}

function objectAt(
  value: unknown,
  ...keys: ReadonlyArray<string>
): JsonObject | null {
  const candidate = valueAt(value, ...keys);
  return isObject(candidate) ? candidate : null;
}

function arrayAt(
  value: unknown,
  ...keys: ReadonlyArray<string>
): ReadonlyArray<unknown> | null {
  const candidate = valueAt(value, ...keys);
  return Array.isArray(candidate) ? candidate : null;
}

function numberAt(
  value: unknown,
  ...keys: ReadonlyArray<string>
): number | null {
  const candidate = valueAt(value, ...keys);
  return typeof candidate === "number" && Number.isFinite(candidate)
    ? candidate
    : null;
}

function requiredNumberAt(
  value: unknown,
  label: string,
  ...keys: ReadonlyArray<string>
): number {
  const found = numberAt(value, ...keys);
  if (found === null) throw new Error(`Missing finite ${label}`);
  return found;
}

function stringAt(
  value: unknown,
  ...keys: ReadonlyArray<string>
): string | null {
  const candidate = valueAt(value, ...keys);
  return typeof candidate === "string" ? candidate : null;
}

function booleanAt(
  value: unknown,
  ...keys: ReadonlyArray<string>
): boolean | null {
  const candidate = valueAt(value, ...keys);
  return typeof candidate === "boolean" ? candidate : null;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableBasename(value: string | null): string | null {
  return value === null ? null : path.basename(value);
}

function displayPath(absolutePath: string): string {
  const relative = path.relative(process.cwd(), absolutePath);
  return relative !== "" && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative)
    ? relative
    : absolutePath;
}

function optionalFileFingerprint(
  absolutePath: string | null,
): Readonly<{ path: string; sha256: string }> | null {
  if (absolutePath === null || !existsSync(absolutePath)) return null;
  const text = readFileSync(absolutePath, "utf8");
  return Object.freeze({
    path: displayPath(absolutePath),
    sha256: createHash("sha256").update(text).digest("hex"),
  });
}

function inputArguments(flag: string): ReadonlyArray<string> {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] !== flag) continue;
    const raw = process.argv[index + 1];
    if (raw === undefined || raw.startsWith("--")) {
      throw new Error(`${flag} requires one or more comma-separated paths`);
    }
    for (const entry of raw.split(",")) {
      const trimmed = entry.trim();
      if (trimmed.length > 0) values.push(path.resolve(trimmed));
    }
  }
  return Object.freeze([...new Set(values)]);
}

function requiredPathArgument(flag: string): string {
  const index = process.argv.indexOf(flag);
  const raw = index < 0 ? undefined : process.argv[index + 1];
  if (raw === undefined || raw.startsWith("--")) {
    throw new Error(`${flag} is required`);
  }
  return path.resolve(raw);
}

function enumArgument<const T extends readonly string[]>(
  flag: string,
  accepted: T,
  fallback: T[number],
): T[number] {
  const index = process.argv.indexOf(flag);
  const raw = index < 0 ? fallback : process.argv[index + 1];
  if (raw === undefined || !accepted.includes(raw)) {
    throw new Error(`${flag} must be one of: ${accepted.join(", ")}`);
  }
  return raw as T[number];
}
