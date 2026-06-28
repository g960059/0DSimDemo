import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

type SamplingMode = "raw" | "uniformBeatGrid" | "eventAlignedCore" | "coarseSensitivity";
type TransitionPolicy = "transition-inclusive" | "transition-excluded-core";
type Chamber = "LV" | "RV";

type CliOptions = {
  readonly inputDir: string;
  readonly outDir: string;
};

export type ComparatorMetricRow = {
  readonly caseId: string;
  readonly branchId: string;
  readonly branchName: string;
  readonly beatIndex: number;
  readonly chamber: Chamber | "LV/RV";
  readonly metricId: string;
  readonly samplingMode: SamplingMode;
  readonly transitionPolicy: TransitionPolicy;
  readonly value: number | null;
  readonly unit: string;
  readonly samplingInvarianceDelta: number | null;
  readonly classificationLabels: readonly string[];
};

export type ComparatorReadoutStatus = "available" | "missing";

export type ComparatorReadout = {
  readonly name: string;
  readonly status: ComparatorReadoutStatus;
  readonly sourceMetricId: string | null;
  readonly value: number | null;
  readonly unit: string | null;
  readonly note: string;
};

export type MissingNoProxySignalRecord = {
  readonly name: typeof REQUIRED_NO_PROXY_SIGNALS[number];
  readonly status: "missing-no-proxy";
  readonly sourceMetricId: null;
  readonly value: null;
  readonly unit: null;
  readonly proxyPolicy: "forbidden";
  readonly promotesHypothesis: false;
  readonly note: string;
};

export type ComparatorGroup = {
  readonly caseId: string;
  readonly branchId: string;
  readonly branchName: string;
  readonly beatIndex: number;
  readonly chamber: Chamber;
  readonly identity: {
    readonly requiredFields: readonly string[];
    readonly rowsHaveRequiredIdentity: boolean;
    readonly rawBeforeResampled: boolean;
    readonly hasRawTransitionInclusive: boolean;
    readonly hasRawTransitionExcludedCore: boolean;
    readonly resampledModes: readonly SamplingMode[];
    readonly matchedResampledEvidence: boolean;
    readonly transitionInclusiveAndExcluded: boolean;
    readonly explicitMissingSignalRecords: boolean;
  };
  readonly evidence: {
    readonly primaryMetricIds: readonly string[];
    readonly rawTransitionExcludedCore: Record<string, number | null>;
    readonly rawTransitionInclusive: Record<string, number | null>;
    readonly resampled: Record<string, Record<string, number | null>>;
    readonly classificationLabels: readonly string[];
  };
  readonly missingNoProxySignals: readonly MissingNoProxySignalRecord[];
  readonly antiGamingReadouts: readonly ComparatorReadout[];
  readonly hypothesisPromotion: "not-promoted-no-proxy";
  readonly interpretable: boolean;
  readonly uninterpretableReasons: readonly string[];
};

export type ArterialLoadZcReflectionDiagnosticComparatorSummary = {
  readonly schemaVersion: 1;
  readonly comparatorId: "arterial-load-zc-reflection-diagnostic-comparator-v1";
  readonly claimBoundary: "off-by-default-diagnostic-comparison-only";
  readonly generatedAt: string;
  readonly input: {
    readonly inputDir: string;
    readonly summaryPath: string;
    readonly metricPath: string;
    readonly sourceRunnerVersion: string | null;
    readonly sourceClaimBoundary: string | null;
  };
  readonly readinessBoundaryReference: {
    readonly protocolPath: string;
    readonly docPath: string;
    readonly role: "future-readiness-reference-only";
  };
  readonly identityRequirements: {
    readonly requiredFields: readonly string[];
  };
  readonly primaryEjectionMetricIds: readonly string[];
  readonly noProxySignalRequirements: readonly string[];
  readonly antiGamingReadoutRequirements: readonly string[];
  readonly rowCount: number;
  readonly groupCount: number;
  readonly interpretableGroupCount: number;
  readonly groups: readonly ComparatorGroup[];
  readonly warnings: readonly string[];
};

const COMPARATOR_ID = "arterial-load-zc-reflection-diagnostic-comparator-v1";
const CLAIM_BOUNDARY = "off-by-default-diagnostic-comparison-only";
const READINESS_PROTOCOL_PATH = "data/myocardium/protocols/arterial-load-zc-reflection-comparator-v1.json";
const READINESS_DOC_PATH = "docs/myocardium/verification/arterial-load-zc-reflection-comparator-v1.md";

const REQUIRED_IDENTITY_FIELDS = [
  "caseId",
  "branchId",
  "beatIndex",
  "chamber",
  "samplingMode",
  "transitionPolicy",
] as const;

const PRIMARY_EJECTION_METRICS = [
  "semilunarOpenEjectionSquareness",
  "ejectionPlateauFraction",
  "ejectionTopCurvature",
  "cornerSharpnessAtOpen",
  "cornerSharpnessAtClose",
  "incisuraPresenceScore",
  "arterialPressureIncisuraDepth",
  "peakPressureTimingAsFractionOfEjection",
  "eventCorrelationWindowHitFraction",
] as const;

const REQUIRED_NO_PROXY_SIGNALS = [
  "characteristicImpedancePaSecPerM3",
  "arterialReflectionCoefficient",
  "arterialReflectionDelaySec",
] as const;

const REQUIRED_ANTI_GAMING_READOUTS = [
  "strokeVolumeM3",
  "cardiacOutputM3PerSec",
  "strokeWorkJ",
  "peakPressurePa",
  "ejectionDurationSec",
  "semilunarForwardVolumeM3",
  "semilunarReverseVolumeM3",
  "qDotClampHitFraction",
  "valveDiodeClampHitFraction",
  "dynamicFlowClampHitFraction",
] as const;

const RESAMPLED_MODES: readonly SamplingMode[] = [
  "uniformBeatGrid",
  "eventAlignedCore",
  "coarseSensitivity",
];

type SourceSummary = {
  readonly runnerVersion?: unknown;
  readonly claimBoundary?: unknown;
};

type MetricLookup = Map<string, ComparatorMetricRow[]>;

export function buildArterialLoadZcReflectionDiagnosticComparison(
  metricRows: readonly ComparatorMetricRow[],
  options: {
    readonly inputDir?: string;
    readonly sourceSummary?: SourceSummary;
  } = {},
): ArterialLoadZcReflectionDiagnosticComparatorSummary {
  const ejectionRows = metricRows.filter((row) => (
    (row.chamber === "LV" || row.chamber === "RV")
    && PRIMARY_EJECTION_METRICS.includes(row.metricId as typeof PRIMARY_EJECTION_METRICS[number])
  ));
  const groupKeys = uniqueSorted(ejectionRows.map(groupKey));
  const groups = groupKeys.map((key) => buildGroup(
    key,
    metricRows.filter((row) => groupKey(row) === key),
  ));
  const warnings: string[] = [];
  if (groups.length === 0) {
    warnings.push("No LV/RV arterial-load Zc/reflection diagnostic comparator groups were found in per-case-metrics.csv.");
  }
  return {
    schemaVersion: 1,
    comparatorId: COMPARATOR_ID,
    claimBoundary: CLAIM_BOUNDARY,
    generatedAt: new Date().toISOString(),
    input: {
      inputDir: options.inputDir ?? "",
      summaryPath: "summary.json",
      metricPath: "per-case-metrics.csv",
      sourceRunnerVersion: stringOrNull(options.sourceSummary?.runnerVersion),
      sourceClaimBoundary: stringOrNull(options.sourceSummary?.claimBoundary),
    },
    readinessBoundaryReference: {
      protocolPath: READINESS_PROTOCOL_PATH,
      docPath: READINESS_DOC_PATH,
      role: "future-readiness-reference-only",
    },
    identityRequirements: {
      requiredFields: REQUIRED_IDENTITY_FIELDS,
    },
    primaryEjectionMetricIds: PRIMARY_EJECTION_METRICS,
    noProxySignalRequirements: REQUIRED_NO_PROXY_SIGNALS,
    antiGamingReadoutRequirements: REQUIRED_ANTI_GAMING_READOUTS,
    rowCount: metricRows.length,
    groupCount: groups.length,
    interpretableGroupCount: groups.filter((group) => group.interpretable).length,
    groups,
    warnings,
  };
}

export function loadMetricRowsFromCsv(csvText: string): ComparatorMetricRow[] {
  const records = parseCsv(csvText);
  return records.map((record) => ({
    caseId: requiredString(record, "caseId"),
    branchId: requiredString(record, "branchId"),
    branchName: requiredString(record, "branchName"),
    beatIndex: requiredNumber(record, "beatIndex"),
    chamber: chamberValue(requiredString(record, "chamber")),
    metricId: requiredString(record, "metricId"),
    samplingMode: samplingModeValue(requiredString(record, "samplingMode")),
    transitionPolicy: transitionPolicyValue(requiredString(record, "transitionPolicy")),
    value: optionalNumber(record, "value"),
    unit: requiredString(record, "unit"),
    samplingInvarianceDelta: optionalNumber(record, "samplingInvarianceDelta"),
    classificationLabels: requiredString(record, "classificationLabels")
      .split("|")
      .filter((label) => label.length > 0),
  }));
}

export function writeArterialLoadZcReflectionDiagnosticComparisonArtifacts(
  outDir: string,
  summary: ArterialLoadZcReflectionDiagnosticComparatorSummary,
): void {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  writeFileSync(path.join(outDir, "summary.md"), summaryToMarkdown(summary));
  writeFileSync(path.join(outDir, "arterial-load-zc-reflection-comparator-groups.csv"), groupsToCsv(summary.groups));
  writeFileSync(path.join(outDir, "command.txt"), `${process.argv.join(" ")}\n`);
}

function buildGroup(
  key: string,
  rows: readonly ComparatorMetricRow[],
): ComparatorGroup {
  const [caseId, branchId, beatIndexText, chamberText] = key.split("\t");
  const chamberCandidate = chamberValue(chamberText);
  if (chamberCandidate === "LV/RV") {
    throw new Error("Arterial-load Zc/reflection comparator groups must be chamber-local LV or RV rows.");
  }
  const chamber = chamberCandidate;
  const branchName = rows[0]?.branchName ?? "";
  const lookup = metricLookup(rows);
  const rawTransitionExcludedCore = metricValues(lookup, "raw", "transition-excluded-core");
  const rawTransitionInclusive = metricValues(lookup, "raw", "transition-inclusive");
  const resampled: Record<string, Record<string, number | null>> = Object.fromEntries(
    RESAMPLED_MODES.map((mode) => [mode, metricValues(lookup, mode, "transition-excluded-core")]),
  );
  const resampledModes = RESAMPLED_MODES.filter((mode) => (
    hasSharedFiniteMetric(rawTransitionExcludedCore, resampled[mode])
  ));
  const noProxyRecords = REQUIRED_NO_PROXY_SIGNALS.map(noProxySignalRecord);
  const readouts = REQUIRED_ANTI_GAMING_READOUTS.map((name) => antiGamingReadout(name, rows));
  const identity = {
    requiredFields: REQUIRED_IDENTITY_FIELDS,
    rowsHaveRequiredIdentity: rows.every(rowHasRequiredIdentity),
    rawBeforeResampled: hasAnyPrimaryMetric(rawTransitionExcludedCore),
    hasRawTransitionInclusive: hasAnyPrimaryMetric(rawTransitionInclusive),
    hasRawTransitionExcludedCore: hasAnyPrimaryMetric(rawTransitionExcludedCore),
    resampledModes,
    matchedResampledEvidence: resampledModes.length === RESAMPLED_MODES.length,
    transitionInclusiveAndExcluded: hasSharedFiniteMetric(rawTransitionInclusive, rawTransitionExcludedCore),
    explicitMissingSignalRecords: noProxyRecords.length === REQUIRED_NO_PROXY_SIGNALS.length
      && noProxyRecords.every((record) => record.status === "missing-no-proxy" && record.proxyPolicy === "forbidden"),
  };
  const missingReadouts = readouts
    .filter((readout) => readout.status !== "available")
    .map((readout) => readout.name);
  const reasons = [
    ...(identity.rowsHaveRequiredIdentity ? [] : ["one or more metric rows are missing required identity fields"]),
    ...(identity.rawBeforeResampled ? [] : ["raw transition-excluded ejection evidence is missing"]),
    ...(identity.matchedResampledEvidence ? [] : [`matched resampled ejection evidence is missing for: ${missingResampledModes(resampledModes).join(", ")}`]),
    ...(identity.transitionInclusiveAndExcluded ? [] : ["transition-inclusive and transition-excluded ejection evidence are not both available"]),
    ...(identity.explicitMissingSignalRecords ? [] : ["explicit missing/no-proxy Zc/reflection signal records are missing"]),
    ...(missingReadouts.length === 0 ? [] : [`missing anti-gaming readouts: ${missingReadouts.join(", ")}`]),
  ];
  return {
    caseId,
    branchId,
    branchName,
    beatIndex: Number(beatIndexText),
    chamber,
    identity,
    evidence: {
      primaryMetricIds: PRIMARY_EJECTION_METRICS,
      rawTransitionExcludedCore,
      rawTransitionInclusive,
      resampled,
      classificationLabels: uniqueSorted(rows.flatMap((row) => row.classificationLabels)),
    },
    missingNoProxySignals: noProxyRecords,
    antiGamingReadouts: readouts,
    hypothesisPromotion: "not-promoted-no-proxy",
    interpretable: reasons.length === 0,
    uninterpretableReasons: reasons,
  };
}

function antiGamingReadout(
  name: typeof REQUIRED_ANTI_GAMING_READOUTS[number],
  rows: readonly ComparatorMetricRow[],
): ComparatorReadout {
  const metric = metricForReadout(name);
  const row = bestMetricRow(rows, metric.metricId);
  if (!row || row.value == null) {
    return missingReadout(name, `Source metric ${metric.metricId} is unavailable from the raw transition-excluded-core row.`);
  }
  if (row.unit !== metric.expectedInputUnit) {
    return missingReadout(
      name,
      `Source metric ${metric.metricId} unit ${row.unit} does not match expected ${metric.expectedInputUnit}.`,
    );
  }
  return {
    name,
    status: "available",
    sourceMetricId: metric.metricId,
    value: metric.convert(row.value),
    unit: metric.unit,
    note: metric.note,
  };
}

function metricForReadout(
  name: typeof REQUIRED_ANTI_GAMING_READOUTS[number],
): {
  readonly metricId: string;
  readonly expectedInputUnit: string;
  readonly unit: string;
  readonly note: string;
  readonly convert: (value: number) => number;
} {
  switch (name) {
    case "strokeVolumeM3":
      return { metricId: "SV", expectedInputUnit: "mL", unit: "m3", note: "Converted from SV mL.", convert: mlToM3 };
    case "cardiacOutputM3PerSec":
      return { metricId: "CO", expectedInputUnit: "L/min", unit: "m3/s", note: "Converted from CO L/min.", convert: litersPerMinToM3PerSec };
    case "strokeWorkJ":
      return { metricId: "strokeWork", expectedInputUnit: "J", unit: "J", note: "Direct runner metric; strokeWork is already J.", convert: identity };
    case "peakPressurePa":
      return { metricId: "peakPressure", expectedInputUnit: "mmHg", unit: "Pa", note: "Converted from peakPressure mmHg.", convert: mmHgToPa };
    case "ejectionDurationSec":
      return {
        metricId: "ejectionDuration",
        expectedInputUnit: "sec",
        unit: "sec",
        note: "Direct runner metric for observed ejection core sample span; not a physiologic valve-open duration claim.",
        convert: identity,
      };
    case "semilunarForwardVolumeM3":
      return { metricId: "semilunarForwardVolume", expectedInputUnit: "mL", unit: "m3", note: "Converted from semilunarForwardVolume mL.", convert: mlToM3 };
    case "semilunarReverseVolumeM3":
      return { metricId: "semilunarReverseVolume", expectedInputUnit: "mL", unit: "m3", note: "Converted from semilunarReverseVolume mL.", convert: mlToM3 };
    case "qDotClampHitFraction":
      return { metricId: "qDotClampHitFraction", expectedInputUnit: "dimensionless", unit: "dimensionless", note: "Direct semilunar outlet runner metric.", convert: identity };
    case "valveDiodeClampHitFraction":
      return { metricId: "semilunarValveDiodeClampHitFraction", expectedInputUnit: "dimensionless", unit: "dimensionless", note: "Direct semilunar outlet runner metric.", convert: identity };
    case "dynamicFlowClampHitFraction":
      return { metricId: "semilunarDynamicFlowClampHitFraction", expectedInputUnit: "dimensionless", unit: "dimensionless", note: "Direct semilunar outlet runner metric.", convert: identity };
  }
}

function bestMetricRow(rows: readonly ComparatorMetricRow[], metricId: string): ComparatorMetricRow | undefined {
  return rows.find((row) => (
    row.metricId === metricId
    && row.samplingMode === "raw"
    && row.transitionPolicy === "transition-excluded-core"
    && row.value != null
  ));
}

function missingReadout(name: string, note: string): ComparatorReadout {
  return {
    name,
    status: "missing",
    sourceMetricId: null,
    value: null,
    unit: null,
    note,
  };
}

function noProxySignalRecord(name: typeof REQUIRED_NO_PROXY_SIGNALS[number]): MissingNoProxySignalRecord {
  return {
    name,
    status: "missing-no-proxy",
    sourceMetricId: null,
    value: null,
    unit: null,
    proxyPolicy: "forbidden",
    promotesHypothesis: false,
    note: `${name} is unavailable in current runtime morphology output and must not be inferred from pressure, flow, compliance, resistance, inertance, or waveform shape.`,
  };
}

function metricLookup(rows: readonly ComparatorMetricRow[]): MetricLookup {
  const lookup: MetricLookup = new Map();
  for (const row of rows) {
    const key = [row.metricId, row.samplingMode, row.transitionPolicy].join("\t");
    const bucket = lookup.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      lookup.set(key, [row]);
    }
  }
  return lookup;
}

function metricValues(
  lookup: MetricLookup,
  samplingMode: SamplingMode,
  transitionPolicy: TransitionPolicy,
): Record<string, number | null> {
  return Object.fromEntries(PRIMARY_EJECTION_METRICS.map((metricId) => {
    const row = lookup.get([metricId, samplingMode, transitionPolicy].join("\t"))?.[0];
    return [metricId, row?.value ?? null];
  }));
}

function hasAnyPrimaryMetric(metrics: Record<string, number | null>): boolean {
  return Object.values(metrics).some((value) => value != null && Number.isFinite(value));
}

function hasSharedFiniteMetric(
  left: Record<string, number | null>,
  right: Record<string, number | null>,
): boolean {
  return PRIMARY_EJECTION_METRICS.some((metricId) => (
    left[metricId] != null
    && Number.isFinite(left[metricId])
    && right[metricId] != null
    && Number.isFinite(right[metricId])
  ));
}

function rowHasRequiredIdentity(row: ComparatorMetricRow): boolean {
  return row.caseId.length > 0
    && row.branchId.length > 0
    && Number.isFinite(row.beatIndex)
    && (row.chamber === "LV" || row.chamber === "RV")
    && row.samplingMode.length > 0
    && row.transitionPolicy.length > 0;
}

function groupKey(row: ComparatorMetricRow): string {
  return [row.caseId, row.branchId, row.beatIndex, row.chamber].join("\t");
}

function missingResampledModes(observed: readonly SamplingMode[]): SamplingMode[] {
  return RESAMPLED_MODES.filter((mode) => !observed.includes(mode));
}

function groupsToCsv(groups: readonly ComparatorGroup[]): string {
  const header = [
    "caseId",
    "branchId",
    "branchName",
    "beatIndex",
    "chamber",
    "rowsHaveRequiredIdentity",
    "rawBeforeResampled",
    "transitionInclusiveAndExcluded",
    "matchedResampledEvidence",
    "explicitMissingSignalRecords",
    "allAntiGamingReadoutsAvailable",
    "interpretable",
    "missingAntiGamingReadouts",
    "missingNoProxySignals",
    "uninterpretableReasons",
  ];
  const rows = groups.map((group) => {
    const missing = group.antiGamingReadouts
      .filter((readout) => readout.status !== "available")
      .map((readout) => readout.name);
    return [
      group.caseId,
      group.branchId,
      group.branchName,
      group.beatIndex,
      group.chamber,
      group.identity.rowsHaveRequiredIdentity,
      group.identity.rawBeforeResampled,
      group.identity.transitionInclusiveAndExcluded,
      group.identity.matchedResampledEvidence,
      group.identity.explicitMissingSignalRecords,
      missing.length === 0,
      group.interpretable,
      missing.join("|"),
      group.missingNoProxySignals.map((record) => record.name).join("|"),
      group.uninterpretableReasons.join("|"),
    ];
  });
  return rowsToCsv(header, rows);
}

function summaryToMarkdown(summary: ArterialLoadZcReflectionDiagnosticComparatorSummary): string {
  const lines = [
    "# Arterial-load Zc/reflection diagnostic comparator summary",
    "",
    `Generated: ${summary.generatedAt}`,
    `Comparator: \`${summary.comparatorId}\``,
    `Claim boundary: \`${summary.claimBoundary}\``,
    "",
    "This artifact is off-by-default diagnostic comparison evidence only. It does not accept a root cause or fix, does not indicate runtime adoption, does not serve as morphology acceptance evidence, and does not infer Zc/reflection values.",
    "",
    "## Input",
    "",
    `- inputDir: \`${summary.input.inputDir}\``,
    `- source runner: \`${summary.input.sourceRunnerVersion ?? "unknown"}\``,
    `- source claim boundary: \`${summary.input.sourceClaimBoundary ?? "unknown"}\``,
    "",
    "## Result",
    "",
    `- groups: ${summary.groupCount}`,
    `- interpretable groups: ${summary.interpretableGroupCount}`,
    "",
    "| case | branch | beat | chamber | interpretable | reasons |",
    "| --- | --- | ---: | --- | --- | --- |",
    ...summary.groups.map((group) => (
      `| ${group.caseId} | ${group.branchId} ${group.branchName} | ${group.beatIndex} | ${group.chamber} | ${group.interpretable} | ${group.uninterpretableReasons.join("; ")} |`
    )),
    "",
    "## Missing Zc/Reflection Signals",
    "",
    ...summary.groups.flatMap((group) => [
      `- ${group.caseId}/${group.branchId}/beat-${group.beatIndex}/${group.chamber}: ${group.missingNoProxySignals.map((record) => `${record.name} (${record.status}, ${record.proxyPolicy})`).join(", ")}`,
    ]),
    "",
    "## Missing Anti-Gaming Readouts",
    "",
    ...summary.groups.flatMap((group) => {
      const missing = group.antiGamingReadouts
        .filter((readout) => readout.status === "missing")
        .map((readout) => readout.name);
      return [`- ${group.caseId}/${group.branchId}/beat-${group.beatIndex}/${group.chamber}: ${missing.join(", ") || "none"}`];
    }),
  ];
  if (summary.warnings.length > 0) {
    lines.push("", "## Warnings", "", ...summary.warnings.map((warning) => `- ${warning}`));
  }
  return `${lines.join("\n")}\n`;
}

function parseArgs(args: readonly string[]): CliOptions {
  let inputDir = "artifacts/myocardium/pv-loop-morphology/latest";
  let outDir = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
    if (arg === "--input") {
      inputDir = args[++index] ?? inputDir;
    } else if (arg.startsWith("--input=")) {
      inputDir = arg.slice("--input=".length);
    } else if (arg === "--out") {
      outDir = args[++index] ?? outDir;
    } else if (arg.startsWith("--out=")) {
      outDir = arg.slice("--out=".length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return {
    inputDir,
    outDir: outDir || path.join(inputDir, "arterial-load-zc-reflection-diagnostic-comparator"),
  };
}

function runCli(options: CliOptions): ArterialLoadZcReflectionDiagnosticComparatorSummary {
  const summaryPath = path.join(options.inputDir, "summary.json");
  const metricPath = path.join(options.inputDir, "per-case-metrics.csv");
  const sourceSummary = JSON.parse(readFileSync(summaryPath, "utf8")) as SourceSummary;
  const metricRows = loadMetricRowsFromCsv(readFileSync(metricPath, "utf8"));
  const summary = buildArterialLoadZcReflectionDiagnosticComparison(metricRows, {
    inputDir: options.inputDir,
    sourceSummary,
  });
  writeArterialLoadZcReflectionDiagnosticComparisonArtifacts(options.outDir, summary);
  return summary;
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(header.map((column, index) => [column, values[index] ?? ""]));
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (quoted) {
      if (char === "\"" && line[index + 1] === "\"") {
        current += "\"";
        index++;
      } else if (char === "\"") {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function rowsToCsv(header: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return [
    header.join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n") + "\n";
}

function csvCell(value: unknown): string {
  if (value == null) return "";
  const raw = String(value);
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, "\"\"")}"` : raw;
}

function requiredString(record: Record<string, string>, key: string): string {
  const value = record[key];
  if (value == null) throw new Error(`CSV is missing column ${key}`);
  return value;
}

function requiredNumber(record: Record<string, string>, key: string): number {
  const value = Number(requiredString(record, key));
  if (!Number.isFinite(value)) throw new Error(`CSV column ${key} is not numeric`);
  return value;
}

function optionalNumber(record: Record<string, string>, key: string): number | null {
  const raw = record[key];
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function chamberValue(value: string): Chamber | "LV/RV" {
  if (value === "LV" || value === "RV" || value === "LV/RV") return value;
  throw new Error(`Unknown chamber: ${value}`);
}

function samplingModeValue(value: string): SamplingMode {
  if (
    value === "raw"
    || value === "uniformBeatGrid"
    || value === "eventAlignedCore"
    || value === "coarseSensitivity"
  ) {
    return value;
  }
  throw new Error(`Unknown samplingMode: ${value}`);
}

function transitionPolicyValue(value: string): TransitionPolicy {
  if (value === "transition-inclusive" || value === "transition-excluded-core") return value;
  throw new Error(`Unknown transitionPolicy: ${value}`);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function identity(value: number): number {
  return value;
}

function mlToM3(value: number): number {
  return value * 1e-6;
}

function litersPerMinToM3PerSec(value: number): number {
  return value * 1e-3 / 60;
}

function mmHgToPa(value: number): number {
  return value * 133.322;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npx vite-node tools/myocardium/buildArterialLoadZcReflectionDiagnosticComparator.ts -- --input=DIR [--out=DIR]",
    "",
    "Builds an off-by-default arterial-load Zc/reflection diagnostic comparator artifact",
    "from an existing PV-loop morphology diagnostic output directory. This does not",
    "run or wire official cases and does not infer unavailable Zc/reflection signals.",
  ].join("\n"));
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  const normalizedScriptPath = path.normalize("tools/myocardium/buildArterialLoadZcReflectionDiagnosticComparator.ts");
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const isViteNodeEntrypoint = Boolean(entrypoint) && path.basename(entrypoint) === "vite-node";
  const isThisModule = path.normalize(new URL(import.meta.url).pathname).endsWith(normalizedScriptPath);
  const hasComparatorCliArgs = process.argv.slice(2).some((arg) => (
    arg === "--help"
    || arg === "-h"
    || arg === "--input"
    || arg === "--out"
    || arg.startsWith("--input=")
    || arg.startsWith("--out=")
  ));
  return isViteNodeEntrypoint && isThisModule && hasComparatorCliArgs;
}

if (isDirectExecution()) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const summary = runCli(options);
    // eslint-disable-next-line no-console
    console.log(
      `Arterial-load Zc/reflection diagnostic comparator wrote groups=${summary.groupCount} `
      + `interpretable=${summary.interpretableGroupCount} out=${options.outDir}`,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error((err as Error).message);
    process.exitCode = 1;
  }
}
