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
    readonly comparableRawVsResampled: boolean;
    readonly transitionInclusiveAndExcluded: boolean;
  };
  readonly evidence: {
    readonly primaryMetricIds: readonly string[];
    readonly rawTransitionExcludedCore: Record<string, number | null>;
    readonly rawTransitionInclusive: Record<string, number | null>;
    readonly resampled: Record<string, Record<string, number | null>>;
    readonly classificationLabels: readonly string[];
  };
  readonly antiGamingReadouts: readonly ComparatorReadout[];
  readonly interpretable: boolean;
  readonly uninterpretableReasons: readonly string[];
};

export type FillingLimbDiagnosticComparatorSummary = {
  readonly schemaVersion: 1;
  readonly comparatorId: "filling-limb-diagnostic-comparator-v1";
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
    readonly role: "constraint-reference-only";
  };
  readonly identityRequirements: {
    readonly requiredFields: readonly string[];
  };
  readonly antiGamingReadoutRequirements: readonly string[];
  readonly rowCount: number;
  readonly groupCount: number;
  readonly interpretableGroupCount: number;
  readonly groups: readonly ComparatorGroup[];
  readonly warnings: readonly string[];
};

const COMPARATOR_ID = "filling-limb-diagnostic-comparator-v1";
const CLAIM_BOUNDARY = "off-by-default-diagnostic-comparison-only";
const READINESS_PROTOCOL_PATH = "data/myocardium/protocols/filling-limb-correlation-readiness-v1.json";
const READINESS_DOC_PATH = "docs/myocardium/verification/filling-limb-correlation-readiness-v1.md";

const REQUIRED_IDENTITY_FIELDS = [
  "caseId",
  "branchId",
  "beatIndex",
  "chamber",
  "samplingMode",
  "transitionPolicy",
] as const;

const PRIMARY_FILLING_METRICS = [
  "mvOpenLowerLimbRoughness",
  "tvOpenLowerLimbRoughness",
  "lowerLimbKinkCount",
  "valveOpenCloseChatterCount",
  "eventCorrelationWindowHitFraction",
] as const;

const REQUIRED_ANTI_GAMING_READOUTS = [
  "endDiastolicVolumeM3",
  "strokeVolumeM3",
  "cardiacOutputM3PerSec",
  "meanLeftAtrialPressurePa",
  "meanRightAtrialPressurePa",
  "eaLikeInflowProxy",
  "inletForwardVolumeM3",
  "inletReverseVolumeM3",
  "qDotClampHitFraction",
  "valveDiodeClampHitFraction",
  "dynamicFlowClampHitFraction",
  "pressureFloorHitFraction",
  "atrialKickBoosterPreservation",
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

export function buildFillingLimbDiagnosticComparison(
  metricRows: readonly ComparatorMetricRow[],
  options: {
    readonly inputDir?: string;
    readonly sourceSummary?: SourceSummary;
  } = {},
): FillingLimbDiagnosticComparatorSummary {
  const fillingRows = metricRows.filter((row) => (
    (row.chamber === "LV" || row.chamber === "RV")
    && PRIMARY_FILLING_METRICS.includes(row.metricId as typeof PRIMARY_FILLING_METRICS[number])
  ));
  const groupKeys = uniqueSorted(fillingRows.map(groupKey));
  const groups = groupKeys.map((key) => buildGroup(
    key,
    metricRows.filter((row) => groupKey(row) === key),
  ));
  const warnings: string[] = [];
  if (groups.length === 0) {
    warnings.push("No LV/RV filling-limb comparator groups were found in per-case-metrics.csv.");
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
      role: "constraint-reference-only",
    },
    identityRequirements: {
      requiredFields: REQUIRED_IDENTITY_FIELDS,
    },
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

export function writeFillingLimbDiagnosticComparisonArtifacts(
  outDir: string,
  summary: FillingLimbDiagnosticComparatorSummary,
): void {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  writeFileSync(path.join(outDir, "summary.md"), summaryToMarkdown(summary));
  writeFileSync(path.join(outDir, "filling-limb-comparator-groups.csv"), groupsToCsv(summary.groups));
  writeFileSync(path.join(outDir, "command.txt"), `${process.argv.join(" ")}\n`);
}

function buildGroup(key: string, rows: readonly ComparatorMetricRow[]): ComparatorGroup {
  const [caseId, branchId, beatIndexText, chamberText] = key.split("\t");
  const chamberCandidate = chamberValue(chamberText);
  if (chamberCandidate === "LV/RV") {
    throw new Error("Filling-limb comparator groups must be chamber-local LV or RV rows.");
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
  const readouts = REQUIRED_ANTI_GAMING_READOUTS.map((name) => antiGamingReadout(name, rows, chamber));
  const identity = {
    requiredFields: REQUIRED_IDENTITY_FIELDS,
    rowsHaveRequiredIdentity: rows.every(rowHasRequiredIdentity),
    rawBeforeResampled: hasAnyPrimaryMetric(rawTransitionExcludedCore),
    hasRawTransitionInclusive: hasAnyPrimaryMetric(rawTransitionInclusive),
    hasRawTransitionExcludedCore: hasAnyPrimaryMetric(rawTransitionExcludedCore),
    resampledModes,
    comparableRawVsResampled: resampledModes.length > 0,
    transitionInclusiveAndExcluded: hasSharedFiniteMetric(rawTransitionInclusive, rawTransitionExcludedCore),
  };
  const missingReadouts = readouts
    .filter((readout) => readout.status !== "available")
    .map((readout) => readout.name);
  const reasons = [
    ...(identity.rowsHaveRequiredIdentity ? [] : ["one or more metric rows are missing required identity fields"]),
    ...(identity.rawBeforeResampled ? [] : ["raw transition-excluded filling-limb evidence is missing"]),
    ...(identity.comparableRawVsResampled ? [] : ["no matched resampled filling-limb evidence is available"]),
    ...(identity.transitionInclusiveAndExcluded ? [] : ["transition-inclusive and transition-excluded filling-limb evidence are not both available"]),
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
      primaryMetricIds: PRIMARY_FILLING_METRICS,
      rawTransitionExcludedCore,
      rawTransitionInclusive,
      resampled,
      classificationLabels: uniqueSorted(rows.flatMap((row) => row.classificationLabels)),
    },
    antiGamingReadouts: readouts,
    interpretable: reasons.length === 0,
    uninterpretableReasons: reasons,
  };
}

function antiGamingReadout(
  name: typeof REQUIRED_ANTI_GAMING_READOUTS[number],
  rows: readonly ComparatorMetricRow[],
  chamber: Chamber,
): ComparatorReadout {
  const metric = metricForReadout(name, chamber);
  if (!metric) {
    return missingReadout(name, "No chamber-local source metric is emitted by the morphology runner.");
  }
  const row = bestMetricRow(rows, metric.metricId);
  if (!row || row.value == null) {
    return missingReadout(name, `Source metric ${metric.metricId} is unavailable.`);
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
  chamber: Chamber,
): {
  readonly metricId: string;
  readonly unit: string;
  readonly note: string;
  readonly convert: (value: number) => number;
} | null {
  switch (name) {
    case "endDiastolicVolumeM3":
      return { metricId: "EDV", unit: "m3", note: "Converted from EDV mL.", convert: mlToM3 };
    case "strokeVolumeM3":
      return { metricId: "SV", unit: "m3", note: "Converted from SV mL.", convert: mlToM3 };
    case "cardiacOutputM3PerSec":
      return { metricId: "CO", unit: "m3/s", note: "Converted from CO L/min.", convert: litersPerMinToM3PerSec };
    case "meanLeftAtrialPressurePa":
      return chamber === "LV"
        ? { metricId: "meanAtrialPressure", unit: "Pa", note: "LV chamber row uses LA pressure.", convert: mmHgToPa }
        : null;
    case "meanRightAtrialPressurePa":
      return chamber === "RV"
        ? { metricId: "meanAtrialPressure", unit: "Pa", note: "RV chamber row uses RA pressure.", convert: mmHgToPa }
        : null;
    case "eaLikeInflowProxy":
      return { metricId: "EAInflowProxy", unit: "dimensionless", note: "Direct runner metric.", convert: identity };
    case "inletForwardVolumeM3":
      return { metricId: "inletForwardVolume", unit: "m3", note: "Converted from inletForwardVolume mL.", convert: mlToM3 };
    case "inletReverseVolumeM3":
      return { metricId: "inletReverseVolume", unit: "m3", note: "Converted from inletReverseVolume mL.", convert: mlToM3 };
    case "pressureFloorHitFraction":
      return { metricId: "pressureFloorHitFraction", unit: "dimensionless", note: "Direct runner metric.", convert: identity };
    case "qDotClampHitFraction":
    case "valveDiodeClampHitFraction":
    case "dynamicFlowClampHitFraction":
    case "atrialKickBoosterPreservation":
      return null;
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
  return Object.fromEntries(PRIMARY_FILLING_METRICS.map((metricId) => {
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
  return PRIMARY_FILLING_METRICS.some((metricId) => (
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
    "comparableRawVsResampled",
    "interpretable",
    "missingAntiGamingReadouts",
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
      group.identity.comparableRawVsResampled,
      group.interpretable,
      missing.join("|"),
      group.uninterpretableReasons.join("|"),
    ];
  });
  return rowsToCsv(header, rows);
}

function summaryToMarkdown(summary: FillingLimbDiagnosticComparatorSummary): string {
  const lines = [
    "# Filling-limb diagnostic comparator summary",
    "",
    `Generated: ${summary.generatedAt}`,
    `Comparator: \`${summary.comparatorId}\``,
    `Claim boundary: \`${summary.claimBoundary}\``,
    "",
    "This artifact is off-by-default diagnostic comparison evidence only. It does not accept a root cause or fix, does not indicate runtime adoption, and does not serve as morphology acceptance evidence.",
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
    "## Missing Readouts",
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
    outDir: outDir || path.join(inputDir, "filling-limb-diagnostic-comparator"),
  };
}

function runCli(options: CliOptions): FillingLimbDiagnosticComparatorSummary {
  const summaryPath = path.join(options.inputDir, "summary.json");
  const metricPath = path.join(options.inputDir, "per-case-metrics.csv");
  const sourceSummary = JSON.parse(readFileSync(summaryPath, "utf8")) as SourceSummary;
  const metricRows = loadMetricRowsFromCsv(readFileSync(metricPath, "utf8"));
  const summary = buildFillingLimbDiagnosticComparison(metricRows, {
    inputDir: options.inputDir,
    sourceSummary,
  });
  writeFillingLimbDiagnosticComparisonArtifacts(options.outDir, summary);
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
    "Usage: npx vite-node tools/myocardium/buildFillingLimbDiagnosticComparator.ts -- --input=DIR [--out=DIR]",
    "",
    "Builds an off-by-default filling-limb diagnostic comparator artifact from an existing",
    "PV-loop morphology diagnostic output directory. This does not run or wire official cases.",
  ].join("\n"));
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  const normalizedScriptPath = path.normalize("tools/myocardium/buildFillingLimbDiagnosticComparator.ts");
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
      `Filling-limb diagnostic comparator wrote groups=${summary.groupCount} `
      + `interpretable=${summary.interpretableGroupCount} out=${options.outDir}`,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error((err as Error).message);
    process.exitCode = 1;
  }
}
