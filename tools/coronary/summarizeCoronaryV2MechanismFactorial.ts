import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const REPORT_DIR = path.resolve("data/myocardium/reports");
const paths = Object.freeze({
  baseline: argument(
    "--baseline",
    path.join(REPORT_DIR, "mainwire-coronary-v2-autoregulated-terminal-boundary-shadow-v1.json"),
  ),
  resistance: argument(
    "--resistance",
    path.join(REPORT_DIR, "mainwire-coronary-v2-transmural-resistance-ablation-v1.json"),
  ),
  compliance: argument(
    "--compliance",
    path.join(REPORT_DIR, "mainwire-coronary-v2-low-proximal-compliance-ablation-v1.json"),
  ),
  combined: argument(
    "--combined",
    path.join(REPORT_DIR, "mainwire-coronary-v2-resistance-compliance-factorial-v1.json"),
  ),
});
const outputPath = argument(
  "--output",
  path.join(
    REPORT_DIR,
    "mainwire-coronary-v2-resistance-compliance-factorial-summary-v1.json",
  ),
);

const inputs = Object.freeze({
  baseline: readReport(paths.baseline),
  resistance: readReport(paths.resistance),
  compliance: readReport(paths.compliance),
  combined: readReport(paths.combined),
});
const sourceReports = Object.freeze(Object.fromEntries(
  Object.entries(paths).map(([key, filePath]) => [
    key,
    repositoryRelativePath(filePath),
  ]),
));
const summary = Object.freeze({
  schema: "circleheart.coronary-v2-mechanism-factorial-summary.v1" as const,
  completed: true as const,
  claim: Object.freeze({
    role: "compact-mechanism-ablation-evidence" as const,
    waveformSamplesRetained: false as const,
    allRowsShareTerminalBoundary: true as const,
    parameterFit: false as const,
  }),
  sourceReports,
  reproduction: Object.freeze({
    runner:
      "npx vite-node --script tools/coronary/runCoronaryV2TerminalBoundaryShadow.ts",
    note: "Generate the four full reports named in sourceReports, summarize, then full ablation samples may be discarded.",
  }),
  rows: Object.freeze([
    row("Symmetric 60:30:10", "1.0×", inputs.baseline),
    row("Directional ENDO 70:15:15", "1.0×", inputs.resistance),
    row("Symmetric 60:30:10", "0.4×", inputs.compliance),
    row("Directional ENDO 70:15:15", "0.4×", inputs.combined),
  ]),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${outputPath}\n`);

type ShadowReport = Readonly<{
  completed: boolean;
  configuration: Readonly<{
    sourceTerminalBeatIndex: number;
    dtSec: number;
    toneMode: string;
  }>;
  finalSummary: Readonly<{
    toneResistanceScaleByTerritoryLayer: Readonly<{
      LAD: Readonly<{ subendocardial: number }>;
    }>;
    summary: Readonly<{
      massNormalizedMeanInletMlPerMinPerG: number;
      territory: Readonly<Record<"LAD" | "LCx" | "RCA", Readonly<{
        inlet: PhaseLedger;
        layers: Readonly<Record<"subepicardial" | "subendocardial", Readonly<{
          r1: PhaseLedger;
          tissue: PhaseLedger;
          r2: PhaseLedger;
        }>>>;
      }>>>;
      commonVenousOutlet: PhaseLedger;
      endocardialToEpicardialTissueFlowRatio:
        Readonly<Record<"LAD" | "LCx" | "RCA", number>>;
    }>;
  }>;
}>;

type PhasePeriod = Readonly<{
  durationSec: number;
  forwardVolumeMl: number;
  reverseVolumeMl: number;
  reverseDurationSec: number;
}>;

type PhaseLedger = Readonly<{
  systole: PhasePeriod;
  diastole: PhasePeriod;
  ejection: PhasePeriod;
  diastolicForwardVolumeFraction01: number;
  peakDiastolicToSystolicForwardFlowRatio: number;
  peakDiastolicToEjectionForwardFlowRatio: number;
  diastolicToSystolicMeanNetFlowRatio: number;
  earlyDiastolicForwardVolumeFractionOfDiastole01: number;
  diastolicPeakDelayAfterAorticClosureSec: number;
}>;

function readReport(filePath: string): ShadowReport {
  const report = JSON.parse(readFileSync(filePath, "utf8")) as ShadowReport;
  if (
    !report.completed
    || report.configuration.toneMode !== "accepted-layer-autoregulation"
    || !report.finalSummary?.summary?.territory?.LAD?.inlet
  ) {
    throw new Error(`incomplete accepted-tone report: ${filePath}`);
  }
  return report;
}

function row(
  partition: string,
  compliance: string,
  report: ShadowReport,
): Readonly<Record<string, unknown>> {
  const summary = report.finalSummary.summary;
  const inlet = summary.territory.LAD.inlet;
  return Object.freeze({
    partition,
    compliance,
    meanFlow: summary.massNormalizedMeanInletMlPerMinPerG,
    diastolicFraction: inlet.diastolicForwardVolumeFraction01,
    peakRatio: inlet.peakDiastolicToSystolicForwardFlowRatio,
    ejectionPeakRatio: inlet.peakDiastolicToEjectionForwardFlowRatio,
    peakDelaySec: inlet.diastolicPeakDelayAfterAorticClosureSec,
    systolicReverseMl: inlet.systole.reverseVolumeMl,
    endocardialTone:
      report.finalSummary.toneResistanceScaleByTerritoryLayer.LAD.subendocardial,
    edgeAudit: Object.freeze({
      inletByTerritory: Object.freeze(Object.fromEntries(
        (["LAD", "LCx", "RCA"] as const).map((territoryId) => [
          territoryId,
          compactPhase(report.finalSummary.summary.territory[territoryId].inlet),
        ]),
      )),
      ladLayer: Object.freeze(Object.fromEntries(
        (["subepicardial", "subendocardial"] as const).map((layerId) => {
          const layer = report.finalSummary.summary.territory.LAD.layers[layerId];
          return [layerId, Object.freeze({
            q1: compactPhase(layer.r1),
            qm: compactPhase(layer.tissue),
            q2: compactPhase(layer.r2),
          })];
        }),
      )),
      commonVenousOutlet:
        compactPhase(report.finalSummary.summary.commonVenousOutlet),
      endocardialToEpicardialTissueFlowRatio:
        report.finalSummary.summary.endocardialToEpicardialTissueFlowRatio,
    }),
  });
}

function compactPhase(value: PhaseLedger): Readonly<Record<string, number>> {
  return Object.freeze({
    diastolicForwardVolumeFraction01: value.diastolicForwardVolumeFraction01,
    peakDiastolicToFullSystolicForwardFlowRatio:
      value.peakDiastolicToSystolicForwardFlowRatio,
    peakDiastolicToEjectionForwardFlowRatio:
      value.peakDiastolicToEjectionForwardFlowRatio,
    diastolicToSystolicMeanNetFlowRatio:
      value.diastolicToSystolicMeanNetFlowRatio,
    earlyDiastolicForwardVolumeFractionOfDiastole01:
      value.earlyDiastolicForwardVolumeFractionOfDiastole01,
    diastolicPeakDelayAfterAorticClosureSec:
      value.diastolicPeakDelayAfterAorticClosureSec,
    systolicForwardVolumeMl: value.systole.forwardVolumeMl,
    systolicReverseVolumeMl: value.systole.reverseVolumeMl,
    systolicReverseDurationSec: value.systole.reverseDurationSec,
    diastolicReverseVolumeMl: value.diastole.reverseVolumeMl,
    diastolicReverseDurationSec: value.diastole.reverseDurationSec,
  });
}

function argument(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag);
  return index < 0 ? fallback : path.resolve(process.argv[index + 1]!);
}

function repositoryRelativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join("/");
}
