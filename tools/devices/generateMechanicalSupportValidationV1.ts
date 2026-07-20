import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  runMainWireMechanicalSupportSimulationV1,
  type MainWireMechanicalSupportBeatMetricsV1,
  type MainWireMechanicalSupportSampleV1,
  type MainWireMechanicalSupportSimulationResultV1,
} from "@/engine/devices/MainWireMechanicalSupportSimulationV1";
import { createMechanicalSupportConfigV1 } from "@/engine/devices/defaultsV1";
import { evaluateEcmoGasExchangeV1 } from "@/engine/devices/gasExchangeV1";
import {
  mechanicalSupportPresetV1,
  updateMechanicalSupportConfigV1,
  type MechanicalSupportPatientCaseIdV1,
  type MechanicalSupportPresetIdV1,
} from "@/engine/devices/presetsV1";
import type { MechanicalSupportConfigV1 } from "@/engine/devices/typesV1";

type ScenarioSpec = Readonly<{
  id: string;
  label: string;
  patientCaseId: MechanicalSupportPatientCaseIdV1;
  presetId: MechanicalSupportPresetIdV1;
  support?: MechanicalSupportConfigV1;
}>;

const SCENARIOS: readonly ScenarioSpec[] = Object.freeze([
  {
    id: "lv-failure-lvad-hm3",
    label: "LV failure + LVAD (HM3 5200 rpm)",
    patientCaseId: "lv-systolic-failure",
    presetId: "lvad-hm3-5200",
  },
  {
    id: "lv-failure-impella-cp-p6",
    label: "LV failure + Impella CP P6",
    patientCaseId: "lv-systolic-failure",
    presetId: "impella-cp-p6",
  },
  {
    id: "lv-failure-va-ecmo",
    label: "LV failure + peripheral VA-ECMO 3200 rpm",
    patientCaseId: "lv-systolic-failure",
    presetId: "va-ecmo-peripheral-3200",
  },
  {
    id: "lv-failure-iabp",
    label: "LV failure + IABP 40 cc 1:1",
    patientCaseId: "lv-systolic-failure",
    presetId: "iabp-40cc-1-1",
  },
  {
    id: "ards-vv-ecmo",
    label: "High native-lung shunt + VV-ECMO 3200 rpm",
    patientCaseId: "normal",
    presetId: "vv-ecmo-3200",
    support: updateMechanicalSupportConfigV1(
      mechanicalSupportPresetV1("vv-ecmo-3200"),
      { gasExchange: { nativeLungShuntFraction01: 0.8 } },
    ),
  },
  {
    id: "lv-failure-lung-shunt-va-ecmo",
    label: "LV failure + high native-lung shunt + peripheral VA-ECMO",
    patientCaseId: "lv-systolic-failure",
    presetId: "va-ecmo-peripheral-3200",
    support: updateMechanicalSupportConfigV1(
      mechanicalSupportPresetV1("va-ecmo-peripheral-3200"),
      { gasExchange: { nativeLungShuntFraction01: 0.8 } },
    ),
  },
  {
    id: "biv-failure-lvad",
    label: "Biventricular failure + LVAD (preload-limited challenge)",
    patientCaseId: "biventricular-failure",
    presetId: "lvad-hm3-5200",
  },
  {
    id: "lv-failure-pht-va-ecmo",
    label: "LV failure + pulmonary hypertension + VA-ECMO",
    patientCaseId: "lv-failure-pulmonary-hypertension",
    presetId: "va-ecmo-peripheral-3200",
  },
  {
    id: "lv-failure-ar-va-ecmo",
    label: "LV failure + severe AR bracket + VA-ECMO",
    patientCaseId: "lv-failure-aortic-regurgitation",
    presetId: "va-ecmo-peripheral-3200",
  },
]);

const root = process.cwd();
const outputDirectory = path.join(root, "data/devices/validation/v1");
mkdirSync(outputDirectory, { recursive: true });

const results: Record<string, MainWireMechanicalSupportSimulationResultV1> = {};
for (const scenario of SCENARIOS) {
  process.stdout.write(`running ${scenario.id}\n`);
  const result = runMainWireMechanicalSupportSimulationV1({
    patientCaseId: scenario.patientCaseId,
    support: scenario.support ?? mechanicalSupportPresetV1(scenario.presetId),
    dtSec: 0.005,
    baselineBeats: 20,
    supportBeats: 40,
    sampleEverySteps: 1,
  });
  if (!result.completed || result.baselineMetrics === null
      || result.supportMetrics === null) {
    throw new Error(`${scenario.id} failed: ${result.failure?.message ?? "missing metrics"}`);
  }
  if (result.supportMetrics.maximumAbsoluteTotalBloodVolumeErrorMl > 1e-6) {
    throw new Error(`${scenario.id} exceeded the TBV conservation gate`);
  }
  results[scenario.id] = result;
}

const controls: Partial<Record<
  MechanicalSupportPatientCaseIdV1,
  MainWireMechanicalSupportSimulationResultV1
>> = {};
for (const patientCaseId of [...new Set(SCENARIOS.map(
  (scenario) => scenario.patientCaseId,
))]) {
  process.stdout.write(`running ${patientCaseId} no-support continuation\n`);
  const control = runMainWireMechanicalSupportSimulationV1({
    patientCaseId,
    support: mechanicalSupportPresetV1("all-off"),
    dtSec: 0.005,
    baselineBeats: 20,
    supportBeats: 40,
    sampleEverySteps: 1,
  });
  if (!control.completed || control.supportMetrics === null) {
    throw new Error(
      `${patientCaseId} control failed: ${control.failure?.message ?? "missing metrics"}`,
    );
  }
  controls[patientCaseId] = control;
}

const halvedDt = runMainWireMechanicalSupportSimulationV1({
  patientCaseId: "lv-systolic-failure",
  support: mechanicalSupportPresetV1("lvad-hm3-5200"),
  dtSec: 0.0025,
  baselineBeats: 20,
  supportBeats: 40,
  sampleEverySteps: 2,
});
if (!halvedDt.completed || halvedDt.supportMetrics === null) {
  throw new Error(`dt-halving scenario failed: ${halvedDt.failure?.message ?? "missing metrics"}`);
}

const oxygenCurves = buildOxygenCurves();
const summary = SCENARIOS.map((scenario) => summarize(
  scenario,
  results[scenario.id]!,
  controls[scenario.patientCaseId]!.supportMetrics!,
));
const checks = buildDirectionalChecks(results, controls, halvedDt, oxygenCurves);
const failedChecks = checks.filter((entry) => !entry.passed);
if (failedChecks.length > 0) {
  throw new Error(
    `mechanical-support validation failed: ${failedChecks.map(
      (entry) => entry.label,
    ).join("; ")}`,
  );
}
const artifact = Object.freeze({
  schema: "circleheart-mechanical-support-validation-v1",
  generatedAt: new Date().toISOString(),
  simulationSettings: Object.freeze({
    dtSec: 0.005,
    baselineBeats: 20,
    supportBeats: 40,
    waveformSampleEverySteps: 1,
  }),
  scenarios: SCENARIOS,
  summary,
  directionalChecks: checks,
  dtHalving: Object.freeze({
    referenceDtSec: 0.005,
    halvedDtSec: 0.0025,
    reference: results["lv-failure-lvad-hm3"]!.supportMetrics,
    halved: halvedDt.supportMetrics,
  }),
  oxygenCurves,
  controls,
  results,
});

writeFileSync(
  path.join(outputDirectory, "mechanical-support-validation-v1.json"),
  `${JSON.stringify(artifact, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  path.join(outputDirectory, "mechanical-support-summary-v1.svg"),
  summarySvg(summary),
  "utf8",
);
writeFileSync(
  path.join(outputDirectory, "mechanical-support-pv-loops-v1.svg"),
  pvLoopSvg(SCENARIOS.slice(0, 4).map((scenario) => Object.freeze({
    scenario,
    result: results[scenario.id]!,
    control: controls[scenario.patientCaseId]!,
  }))),
  "utf8",
);
writeFileSync(
  path.join(outputDirectory, "mechanical-support-waveforms-v1.svg"),
  waveformSvg(SCENARIOS.slice(0, 5).map((scenario) => Object.freeze({
    scenario,
    result: results[scenario.id]!,
    control: controls[scenario.patientCaseId]!,
  }))),
  "utf8",
);
writeFileSync(
  path.join(outputDirectory, "ecmo-oxygen-content-v1.svg"),
  oxygenSvg(oxygenCurves),
  "utf8",
);
writeFileSync(
  path.join(outputDirectory, "README.md"),
  markdownReport(summary, checks, results, controls, halvedDt),
  "utf8",
);

process.stdout.write(`wrote ${outputDirectory}\n`);

function summarize(
  scenario: ScenarioSpec,
  result: MainWireMechanicalSupportSimulationResultV1,
  noSupportContinuation: MainWireMechanicalSupportBeatMetricsV1,
) {
  const baseline = noSupportContinuation;
  const support = result.supportMetrics!;
  return Object.freeze({
    id: scenario.id,
    label: scenario.label,
    patientCaseId: scenario.patientCaseId,
    presetId: scenario.presetId,
    baseline,
    support,
    change: Object.freeze({
      mapMmHg: support.meanSystemicArterialPressureMmHg
        - baseline.meanSystemicArterialPressureMmHg,
      pulsePressureMmHg: support.systemicPulsePressureMmHg
        - baseline.systemicPulsePressureMmHg,
      nativeCardiacOutputLMin: support.nativeCardiacOutputLMin
        - baseline.nativeCardiacOutputLMin,
      grossForwardAorticFlowLMin: support.grossForwardAorticFlowLMin
        - baseline.grossForwardAorticFlowLMin,
      aorticRegurgitantFlowLMin: support.aorticRegurgitantFlowLMin
        - baseline.aorticRegurgitantFlowLMin,
      aorticRegurgitantFraction01: support.aorticRegurgitantFraction01
        - baseline.aorticRegurgitantFraction01,
      totalSystemicFlowLMin: support.totalSystemicFlowLMin
        - baseline.totalSystemicFlowLMin,
      lvedvMl: support.leftVentricularEndDiastolicVolumeMl
        - baseline.leftVentricularEndDiastolicVolumeMl,
      lvedpMmHg: support.leftVentricularEndDiastolicPressureMmHg
        - baseline.leftVentricularEndDiastolicPressureMmHg,
      meanLapMmHg: support.meanLeftAtrialPressureMmHg
        - baseline.meanLeftAtrialPressureMmHg,
      meanRapMmHg: support.meanRightAtrialPressureMmHg
        - baseline.meanRightAtrialPressureMmHg,
      pvLoopAreaMmHgMl: support.leftVentricularPressureVolumeLoopAreaMmHgMl
        - baseline.leftVentricularPressureVolumeLoopAreaMmHgMl,
    }),
    gasExchange: result.gasExchange,
    alertCodes: result.alerts.map((entry) => entry.code),
  });
}

function buildDirectionalChecks(
  all: Readonly<Record<string, MainWireMechanicalSupportSimulationResultV1>>,
  controlByCase: Readonly<Partial<Record<
    MechanicalSupportPatientCaseIdV1,
    MainWireMechanicalSupportSimulationResultV1
  >>>,
  dtHalf: MainWireMechanicalSupportSimulationResultV1,
  oxygenCurves: ReturnType<typeof buildOxygenCurves>,
) {
  const lvad = all["lv-failure-lvad-hm3"]!;
  const impella = all["lv-failure-impella-cp-p6"]!;
  const va = all["lv-failure-va-ecmo"]!;
  const iabp = all["lv-failure-iabp"]!;
  const vv = all["ards-vv-ecmo"]!;
  const highShuntVa = all["lv-failure-lung-shunt-va-ecmo"]!;
  const bivLvad = all["biv-failure-lvad"]!;
  const phtVa = all["lv-failure-pht-va-ecmo"]!;
  const arVa = all["lv-failure-ar-va-ecmo"]!;
  const lvControl = controlByCase["lv-systolic-failure"]!.supportMetrics!;
  const lvControlSamples = controlByCase["lv-systolic-failure"]!.supportSamples;
  const normalControl = controlByCase.normal!.supportMetrics!;
  const phtControl = controlByCase["lv-failure-pulmonary-hypertension"]!
    .supportMetrics!;
  const arControl = controlByCase["lv-failure-aortic-regurgitation"]!
    .supportMetrics!;
  const iabpInflationPhase01 = mechanicalSupportPresetV1("iabp-40cc-1-1")
    .iabp.inflationPhase01;
  const lvAorticClosurePhase01 = lastForwardAorticValvePhase(lvControlSamples);
  const vvSix = oxygenCurves.find((entry) =>
    entry.ecmoFlowLMin === 6
      && Math.abs(entry.configuredVvRecirculationFraction01 - 0.15) < 1e-9
  )!;
  const vvSeven = oxygenCurves.find((entry) =>
    entry.ecmoFlowLMin === 7
      && Math.abs(entry.configuredVvRecirculationFraction01 - 0.15) < 1e-9
  )!;
  const checks = [
    check("LVAD has forward support flow", lvad.supportMetrics!.meanPumpFlowLMin.LVAD > 0),
    check("LVAD reduces mean LAP", lvad.supportMetrics!.meanLeftAtrialPressureMmHg
      < lvControl.meanLeftAtrialPressureMmHg - 1),
    check("LVAD reduces LVEDV by at least 5 mL",
      lvad.supportMetrics!.leftVentricularEndDiastolicVolumeMl
        < lvControl.leftVentricularEndDiastolicVolumeMl - 5),
    check("LVAD reduces LV PV-loop area",
      lvad.supportMetrics!.leftVentricularPressureVolumeLoopAreaMmHgMl
        < lvControl.leftVentricularPressureVolumeLoopAreaMmHgMl),
    check("LVAD reduces native aortic output", lvad.supportMetrics!.nativeCardiacOutputLMin
      < lvControl.nativeCardiacOutputLMin),
    check("Impella has forward support flow", impella.supportMetrics!.meanPumpFlowLMin.IMPELLA > 0),
    check("Impella reduces mean LAP", impella.supportMetrics!.meanLeftAtrialPressureMmHg
      < lvControl.meanLeftAtrialPressureMmHg),
    check("VA-ECMO raises MAP", va.supportMetrics!.meanSystemicArterialPressureMmHg
      > lvControl.meanSystemicArterialPressureMmHg),
    check("VA-ECMO reduces native aortic output", va.supportMetrics!.nativeCardiacOutputLMin
      < lvControl.nativeCardiacOutputLMin),
    check("VA-ECMO reduces native pulse pressure", va.supportMetrics!.systemicPulsePressureMmHg
      < lvControl.systemicPulsePressureMmHg),
    check("High-shunt peripheral VA has lower right-radial than femoral saturation",
      highShuntVa.gasExchange !== null
        && highShuntVa.gasExchange.femoralArterialSaturation01
          - highShuntVa.gasExchange.rightRadialArterialSaturation01 > 0.05),
    check("High-shunt peripheral VA reports differential hypoxemia",
      highShuntVa.alerts.some((entry) => entry.code === "VA_DIFFERENTIAL_HYPOXEMIA")),
    check("VV oxygenation exceeds native-lung-only estimate", vv.gasExchange !== null
      && vv.gasExchange.estimatedSystemicArterialSaturation01
        > vv.gasExchange.nativeArterialSaturation01),
    check("VV closes configured VO2 with the steady Fick balance",
      vv.gasExchange !== null
        && vv.gasExchange.oxygenDemandMetFraction01 > 1 - 1e-9
        && Math.abs(vv.gasExchange.oxygenConsumptionResidualMlPerMin) < 1e-6),
    check("VV surfaces a critical low oxygen-delivery ratio",
      vv.gasExchange !== null
        && vv.gasExchange.oxygenDeliveryToConsumptionRatio < 2
        && vv.alerts.some((entry) =>
          entry.code === "LOW_OXYGEN_DELIVERY_RATIO"
            && entry.severity === "critical"
        )),
    check("VV oxygenation plateaus once effective flow reaches cardiac output",
      vvSix.effectiveEcmoFlowLMin === 5
        && vvSeven.effectiveEcmoFlowLMin === 5
        && Math.abs(
          vvSeven.estimatedSystemicArterialSaturation01
            - vvSix.estimatedSystemicArterialSaturation01,
        ) < 1e-12),
    check("Well-mixed VV hemodynamic MAP is unchanged",
      Math.abs(vv.supportMetrics!.meanSystemicArterialPressureMmHg
        - normalControl.meanSystemicArterialPressureMmHg) < 1e-10),
    check("IABP augments diastolic aortic pressure",
      phaseMean(iabp.supportSamples, 0.45, 0.85)
        > phaseMean(lvControlSamples, 0.45, 0.85)),
    check("IABP lowers pre-systolic aortic pressure after deflation",
      phaseMean(iabp.supportSamples, 0.95, 0.999)
        < phaseMean(lvControlSamples, 0.95, 0.999)),
    check("IABP lowers assisted systolic aortic pressure",
      iabp.supportMetrics!.systemicSystolicPressureMmHg
        < lvControl.systemicSystolicPressureMmHg),
    check("IABP augmented-diastolic peak is not labeled as systolic pressure",
      iabp.supportMetrics!.augmentedDiastolicPressureMmHg
        > iabp.supportMetrics!.systemicSystolicPressureMmHg
        && Math.abs(
          iabp.supportMetrics!.globalSystemicArterialPeakMmHg
            - iabp.supportMetrics!.augmentedDiastolicPressureMmHg,
        ) < 1e-9),
    check("IABP inflation starts within 50 ms after modeled aortic-valve closure",
      iabpInflationPhase01 >= lvAorticClosurePhase01
        && iabpInflationPhase01 - lvAorticClosurePhase01 <= 0.05),
    check("Biventricular failure lowers the LVAD flow ceiling",
      bivLvad.supportMetrics!.meanPumpFlowLMin.LVAD
        < lvad.supportMetrics!.meanPumpFlowLMin.LVAD),
    check("Preload-limited biventricular LVAD run reports inlet collapse",
      bivLvad.alerts.some((entry) => entry.code === "INLET_COLLAPSE")),
    check("Pulmonary-hypertension VA-ECMO raises MAP",
      phtVa.supportMetrics!.meanSystemicArterialPressureMmHg
        > phtControl.meanSystemicArterialPressureMmHg),
    check("Pulmonary-hypertension control has mPAP above 20 mmHg",
      phtControl.meanPulmonaryArterialPressureMmHg > 20),
    check("Pulmonary-hypertension control has PVR above 2 WU",
      phtControl.pulmonaryVascularResistanceWoodUnits > 2),
    check("Severe-AR VA stress test increases LVEDV",
      arVa.supportMetrics!.leftVentricularEndDiastolicVolumeMl
        > arControl.leftVentricularEndDiastolicVolumeMl + 5),
    check("Severe-AR VA stress test increases LVEDP",
      arVa.supportMetrics!.leftVentricularEndDiastolicPressureMmHg
        > arControl.leftVentricularEndDiastolicPressureMmHg + 5),
    check("Severe-AR VA stress test increases mean LAP",
      arVa.supportMetrics!.meanLeftAtrialPressureMmHg
        > arControl.meanLeftAtrialPressureMmHg + 1),
    check("Severe-AR VA stress test increases regurgitant flow",
      arVa.supportMetrics!.aorticRegurgitantFlowLMin
        > arControl.aorticRegurgitantFlowLMin + 0.5),
    check("Severe-AR VA stress test increases regurgitant fraction",
      arVa.supportMetrics!.aorticRegurgitantFraction01
        > arControl.aorticRegurgitantFraction01 + 0.05),
    check("Severe-AR VA stress test lowers net native output",
      arVa.supportMetrics!.nativeCardiacOutputLMin
        < arControl.nativeCardiacOutputLMin),
    check("Severe-AR VA stress test emits the critical contextual alert",
      arVa.alerts.some((entry) =>
        entry.code === "VA_ECMO_SEVERE_AORTIC_REGURGITATION"
          && entry.severity === "critical"
      )),
    check("Severe-AR VA stress test suppresses invalid territorial gas mixing",
      arVa.gasExchange === null),
    check("All support runs conserve TBV below 1e-6 mL", Object.values(all).every(
      (result) => result.supportMetrics!.maximumAbsoluteTotalBloodVolumeErrorMl < 1e-6,
    )),
    check("All support runs close within 0.01% maximum node-volume change per beat",
      Object.values(all).every((result) =>
        result.supportMetrics!.closureMaximumRelativeNodeVolumeDifference !== null
          && result.supportMetrics!.closureMaximumRelativeNodeVolumeDifference! < 1e-4
      )),
    check("All support runs keep nonlinear continuity residual below 1e-6 mL",
      Object.values(all).every((result) =>
        result.supportMetrics!.maximumContinuityResidualMl < 1e-6
      )),
    check("LVAD dt-halving MAP differs by under 3%", relativeDifference(
      lvad.supportMetrics!.meanSystemicArterialPressureMmHg,
      dtHalf.supportMetrics!.meanSystemicArterialPressureMmHg,
    ) < 0.03),
    check("LVAD dt-halving mean flow differs by under 3%", relativeDifference(
      lvad.supportMetrics!.meanPumpFlowLMin.LVAD,
      dtHalf.supportMetrics!.meanPumpFlowLMin.LVAD,
    ) < 0.03),
  ];
  return Object.freeze(checks);
}

function buildOxygenCurves() {
  const base = createMechanicalSupportConfigV1().gasExchange;
  return Object.freeze([0, 0.5, 1, 2, 3, 4, 5, 6, 7].flatMap((flowLMin) =>
    [0.15, 0.50].map((recirculation) => {
      const config = Object.freeze({
        ...base,
        nativeLungShuntFraction01: 0.8,
        vvRecirculationFraction01: recirculation,
      });
      return evaluateEcmoGasExchangeV1({
        mode: "VV",
        ecmoFlowLMin: flowLMin,
        nativeCardiacOutputLMin: 5,
        config,
      });
    }),
  ));
}

function check(label: string, passed: boolean) {
  return Object.freeze({ label, passed });
}

function relativeDifference(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-9);
}

function phaseMean(
  samples: readonly MainWireMechanicalSupportSampleV1[],
  lowerPhase01: number,
  upperPhase01: number,
): number {
  const values = samples
    .filter((entry) => entry.cyclePhase01 >= lowerPhase01
      && entry.cyclePhase01 <= upperPhase01)
    .map((entry) => entry.pressureMmHg.SA);
  if (values.length === 0) throw new Error("phase window contains no samples");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function lastForwardAorticValvePhase(
  samples: readonly MainWireMechanicalSupportSampleV1[],
): number {
  const forward = samples.filter((entry) => entry.nativeFlowLMin.AoV > 1e-6);
  if (forward.length === 0) throw new Error("control beat has no forward aortic flow");
  return Math.max(...forward.map((entry) => entry.cyclePhase01));
}

function summarySvg(rows: readonly ReturnType<typeof summarize>[]): string {
  const width = 1280;
  const height = 720;
  const metricsToPlot = [
    ["MAP", (row: typeof rows[number]) => row.change.mapMmHg, "mmHg"],
    ["Total flow", (row: typeof rows[number]) => row.change.totalSystemicFlowLMin, "L/min"],
    ["LVEDV", (row: typeof rows[number]) => row.change.lvedvMl, "mL"],
    ["Mean LAP", (row: typeof rows[number]) => row.change.meanLapMmHg, "mmHg"],
  ] as const;
  const panelWidth = (width - 100) / metricsToPlot.length;
  const panels = metricsToPlot.map(([title, accessor, unit], panelIndex) => {
    const values = rows.map(accessor);
    const extent = Math.max(...values.map(Math.abs), 1e-9);
    const x0 = 70 + panelIndex * panelWidth;
    const yMid = 330;
    const scale = 250 / extent;
    const bars = values.map((value, index) => {
      const x = x0 + 20 + index * ((panelWidth - 40) / rows.length);
      const barWidth = Math.max(8, (panelWidth - 50) / rows.length - 5);
      const y = value >= 0 ? yMid - value * scale : yMid;
      const h = Math.abs(value * scale);
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="${value >= 0 ? "#2563eb" : "#dc2626"}"/><text x="${x + barWidth / 2}" y="${value >= 0 ? y - 6 : y + h + 14}" text-anchor="middle" font-size="10">${fmt(value)}</text>`;
    }).join("");
    return `<g><text x="${x0 + panelWidth / 2}" y="42" text-anchor="middle" font-size="17" font-weight="600">Δ ${title} (${unit})</text><line x1="${x0}" y1="${yMid}" x2="${x0 + panelWidth - 18}" y2="${yMid}" stroke="#475569"/>${bars}</g>`;
  }).join("");
  const legend = rows.map((row, index) =>
    `<text x="80" y="${510 + index * 25}" font-size="13">${index + 1}. ${escapeXml(row.label)}</text>`,
  ).join("");
  return svgDocument(width, height, `<rect width="100%" height="100%" fill="#fff"/><text x="40" y="28" font-size="20" font-weight="700">Mechanical-support changes versus same-case no-support continuation</text>${panels}${legend}`);
}

function pvLoopSvg(rows: readonly Readonly<{
  scenario: ScenarioSpec;
  result: MainWireMechanicalSupportSimulationResultV1;
  control: MainWireMechanicalSupportSimulationResultV1;
}>[]): string {
  const width = 1200;
  const height = 840;
  const panelWidth = 540;
  const panelHeight = 320;
  const panels = rows.map((row, index) => {
    const x0 = 70 + (index % 2) * 590;
    const y0 = 65 + Math.floor(index / 2) * 390;
    const all = [...row.control.supportSamples, ...row.result.supportSamples];
    const xs = all.map((entry) => entry.volumeMl.LV);
    const ys = all.map((entry) => entry.pressureMmHg.LV);
    const mapPoint = scale2d(Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), x0, y0, panelWidth, panelHeight);
    const baseline = polyline(row.control.supportSamples.map((entry) => mapPoint(entry.volumeMl.LV, entry.pressureMmHg.LV)), "#64748b");
    const support = polyline(row.result.supportSamples.map((entry) => mapPoint(entry.volumeMl.LV, entry.pressureMmHg.LV)), "#dc2626");
    return `<g><text x="${x0}" y="${y0 - 20}" font-size="16" font-weight="600">${escapeXml(row.scenario.label)}</text><rect x="${x0}" y="${y0}" width="${panelWidth}" height="${panelHeight}" fill="none" stroke="#cbd5e1"/>${baseline}${support}<text x="${x0 + 8}" y="${y0 + 20}" font-size="12" fill="#64748b">no-support</text><text x="${x0 + 87}" y="${y0 + 20}" font-size="12" fill="#dc2626">support</text><text x="${x0}" y="${y0 + panelHeight + 13}" font-size="10">${fmt(Math.min(...xs))}</text><text x="${x0 + panelWidth}" y="${y0 + panelHeight + 13}" text-anchor="end" font-size="10">${fmt(Math.max(...xs))}</text><text x="${x0 - 6}" y="${y0 + panelHeight}" text-anchor="end" font-size="10">${fmt(Math.min(...ys))}</text><text x="${x0 - 6}" y="${y0 + 10}" text-anchor="end" font-size="10">${fmt(Math.max(...ys))}</text></g>`;
  }).join("");
  return svgDocument(width, height, `<rect width="100%" height="100%" fill="#fff"/><text x="32" y="30" font-size="21" font-weight="700">LV pressure–volume loops (unsmoothed final beats)</text><text x="${width / 2}" y="${height - 3}" text-anchor="middle" font-size="12">LV volume (mL)</text><text x="13" y="${height / 2}" transform="rotate(-90 13 ${height / 2})" text-anchor="middle" font-size="12">LV pressure (mmHg)</text>${panels}`);
}

function waveformSvg(rows: readonly Readonly<{
  scenario: ScenarioSpec;
  result: MainWireMechanicalSupportSimulationResultV1;
  control: MainWireMechanicalSupportSimulationResultV1;
}>[]): string {
  const width = 1280;
  const height = 970;
  const plotX = 310;
  const plotWidth = 900;
  const panelHeight = 155;
  const panels = rows.map((row, index) => {
    const y0 = 70 + index * 175;
    const baseline = row.control.supportSamples;
    const support = row.result.supportSamples;
    const values = [...baseline, ...support].flatMap((entry) => [
      entry.pressureMmHg.SA,
      entry.pressureMmHg.LV,
    ]);
    const yMin = Math.min(...values);
    const yMax = Math.max(...values);
    const map = scale2d(0, 1, yMin, yMax, plotX, y0, plotWidth, panelHeight);
    const baselineSa = polyline(waveformPoints(
      baseline,
      (entry) => entry.pressureMmHg.SA,
      map,
    ), "#94a3b8");
    const supportSa = polyline(waveformPoints(
      support,
      (entry) => entry.pressureMmHg.SA,
      map,
    ), "#2563eb");
    const supportLv = polyline(waveformPoints(
      support,
      (entry) => entry.pressureMmHg.LV,
      map,
    ), "#dc2626");
    return `<g><text x="24" y="${y0 + 22}" font-size="15" font-weight="600">${escapeXml(row.scenario.label)}</text><text x="24" y="${y0 + 45}" font-size="12">SA no-support gray · SA support blue · LV support red</text><rect x="${plotX}" y="${y0}" width="${plotWidth}" height="${panelHeight}" fill="none" stroke="#cbd5e1"/>${baselineSa}${supportSa}${supportLv}<text x="${plotX + 5}" y="${y0 + 15}" font-size="11">${fmt(yMax)} mmHg</text><text x="${plotX + 5}" y="${y0 + panelHeight - 5}" font-size="11">${fmt(yMin)} mmHg</text><text x="${plotX}" y="${y0 + panelHeight + 13}" font-size="10">0</text><text x="${plotX + plotWidth}" y="${y0 + panelHeight + 13}" text-anchor="end" font-size="10">1</text></g>`;
  }).join("");
  return svgDocument(width, height, `<rect width="100%" height="100%" fill="#fff"/><text x="25" y="30" font-size="21" font-weight="700">Pressure waveforms (final simulated beat)</text><text x="${plotX + plotWidth / 2}" y="${height - 4}" text-anchor="middle" font-size="12">Cardiac-cycle phase</text>${panels}`);
}

function waveformPoints(
  samples: readonly MainWireMechanicalSupportSampleV1[],
  value: (sample: MainWireMechanicalSupportSampleV1) => number,
  map: (x: number, y: number) => readonly [number, number],
): readonly (readonly [number, number])[] {
  const firstPhase = samples[0]?.cyclePhase01 ?? 0;
  return samples.map((entry, index) => {
    const isWrappedFinalBoundary = index === samples.length - 1
      && entry.cyclePhase01 < firstPhase;
    return map(isWrappedFinalBoundary ? 1 : entry.cyclePhase01, value(entry));
  });
}

function oxygenSvg(curves: ReturnType<typeof buildOxygenCurves>): string {
  const width = 900;
  const height = 580;
  const x0 = 90;
  const y0 = 70;
  const plotWidth = 740;
  const plotHeight = 420;
  const map = scale2d(0, 7, 0, 1, x0, y0, plotWidth, plotHeight);
  const groups = [0.15, 0.5].map((recirculation, index) => {
    const points = curves.filter((entry) =>
      Math.abs(entry.configuredVvRecirculationFraction01 - recirculation) < 1e-6);
    return polyline(points.map((entry) => map(
      entry.ecmoFlowLMin,
      entry.estimatedSystemicArterialSaturation01,
    )), index === 0 ? "#2563eb" : "#dc2626");
  }).join("");
  const xTicks = [0, 1, 2, 3, 4, 5, 6, 7].map((value) => {
    const [x] = map(value, 0);
    return `<line x1="${x}" y1="${y0 + plotHeight}" x2="${x}" y2="${y0 + plotHeight + 5}" stroke="#475569"/><text x="${x}" y="${y0 + plotHeight + 20}" text-anchor="middle" font-size="11">${value}</text>`;
  }).join("");
  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 1].map((value) => {
    const [, y] = map(0, value);
    return `<line x1="${x0 - 5}" y1="${y}" x2="${x0}" y2="${y}" stroke="#475569"/><text x="${x0 - 10}" y="${y + 4}" text-anchor="end" font-size="11">${value.toFixed(1)}</text>`;
  }).join("");
  return svgDocument(width, height, `<rect width="100%" height="100%" fill="#fff"/><text x="35" y="32" font-size="21" font-weight="700">VV-ECMO oxygenation response (CO 5 L/min, shunt 0.8)</text><rect x="${x0}" y="${y0}" width="${plotWidth}" height="${plotHeight}" fill="none" stroke="#cbd5e1"/>${groups}${xTicks}${yTicks}<line x1="${x0}" y1="${map(0, 0.9)[1]}" x2="${x0 + plotWidth}" y2="${map(0, 0.9)[1]}" stroke="#94a3b8" stroke-dasharray="5 5"/><text x="${x0 + plotWidth - 8}" y="${map(0, 0.9)[1] - 6}" text-anchor="end" font-size="11" fill="#64748b">90% reference</text><text x="${x0 + 12}" y="${y0 + 24}" fill="#2563eb">recirculation 15%</text><text x="${x0 + 12}" y="${y0 + 45}" fill="#dc2626">recirculation 50%</text><text x="${x0 + plotWidth / 2}" y="${height - 30}" text-anchor="middle">Circuit blood flow (L/min)</text><text x="25" y="${y0 + plotHeight / 2}" transform="rotate(-90 25 ${y0 + plotHeight / 2})" text-anchor="middle">Estimated systemic SaO₂</text>`);
}

function markdownReport(
  rows: readonly ReturnType<typeof summarize>[],
  checks: readonly Readonly<{ label: string; passed: boolean }>[],
  all: Readonly<Record<string, MainWireMechanicalSupportSimulationResultV1>>,
  controlByCase: Readonly<Partial<Record<
    MechanicalSupportPatientCaseIdV1,
    MainWireMechanicalSupportSimulationResultV1
  >>>,
  dtHalf: MainWireMechanicalSupportSimulationResultV1,
): string {
  const header = "| Scenario | Pump flow | ΔMAP | Δnet native CO | ΔLVEDV | ΔLAP | AoV open | AR flow | AR fraction | SaO2 | DO2/VO2 | Alerts | ΔPV area |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|";
  const table = rows.map((row) => {
    const pump = Object.values(row.support.meanPumpFlowLMin)
      .find((value) => Math.abs(value) > 1e-6) ?? 0;
    const saturation = row.gasExchange === null
      ? "—"
      : `${fmt(100 * row.gasExchange.estimatedSystemicArterialSaturation01)}%`;
    const deliveryRatio = row.gasExchange === null
      ? "—"
      : fmt(row.gasExchange.oxygenDeliveryToConsumptionRatio);
    const alerts = row.alertCodes.length > 0 ? row.alertCodes.join(", ") : "none";
    return `| ${row.label} | ${fmt(pump)} L/min | ${signed(row.change.mapMmHg)} | ${signed(row.change.nativeCardiacOutputLMin)} | ${signed(row.change.lvedvMl)} | ${signed(row.change.meanLapMmHg)} | ${fmt(row.support.nativeAorticValveOpenFraction01)} | ${fmt(row.support.aorticRegurgitantFlowLMin)} L/min | ${fmt(row.support.aorticRegurgitantFraction01)} | ${saturation} | ${deliveryRatio} | ${alerts} | ${signed(row.change.pvLoopAreaMmHgMl)} |`;
  }).join("\n");
  const checklist = checks.map((entry) =>
    `- ${entry.passed ? "PASS" : "REVIEW"}: ${entry.label}`,
  ).join("\n");
  const lvadReference = all["lv-failure-lvad-hm3"]!.supportMetrics!;
  const vv = all["ards-vv-ecmo"]!;
  const phtControl = controlByCase["lv-failure-pulmonary-hypertension"]!
    .supportMetrics!;
  const ar = all["lv-failure-ar-va-ecmo"]!.supportMetrics!;
  const safetyReadbacks = `- LVAD 5200 rpm: AoV-open fraction ${fmt(lvadReference.nativeAorticValveOpenFraction01)}, pulse pressure ${fmt(lvadReference.systemicPulsePressureMmHg)} mmHg; alerts ${all["lv-failure-lvad-hm3"]!.alerts.map((entry) => entry.code).join(", ") || "none"}.\n- High-shunt VV: SaO2 ${fmt(100 * vv.gasExchange!.estimatedSystemicArterialSaturation01)}%, SvO2 ${fmt(100 * vv.gasExchange!.resolvedMixedVenousSaturation01)}%, DO2/VO2 ${fmt(vv.gasExchange!.oxygenDeliveryToConsumptionRatio)}; alerts ${vv.alerts.map((entry) => entry.code).join(", ") || "none"}.\n- Pulmonary-hypertension control: mPAP ${fmt(phtControl.meanPulmonaryArterialPressureMmHg)} mmHg, PVR ${fmt(phtControl.pulmonaryVascularResistanceWoodUnits)} WU, peak RV pressure ${fmt(phtControl.peakRightVentricularPressureMmHg)} mmHg.\n- Severe-AR VA contraindication stress test: LVEDV ${fmt(ar.leftVentricularEndDiastolicVolumeMl)} mL, LVEDP ${fmt(ar.leftVentricularEndDiastolicPressureMmHg)} mmHg, regurgitant flow ${fmt(ar.aorticRegurgitantFlowLMin)} L/min, regurgitant fraction ${fmt(ar.aorticRegurgitantFraction01)}; territorial gas output suppressed.`;
  return `# Mechanical-support validation V1\n\nGenerated by \`tools/devices/generateMechanicalSupportValidationV1.ts\`. These are mechanistic direction/range checks, not patient calibration or a clinical-device certification. Each comparison branches after twenty common no-support beats, then compares the final unsmoothed beat after forty support beats with a same-case forty-beat no-support continuation at dt=5 ms.\n\n${header}\n${table}\n\n## Directional and numerical gates\n\n${checklist}\n\n## Safety-significant readbacks\n\n${safetyReadbacks}\n\n## Time-step sensitivity\n\nFor LVAD, dt 5 ms versus 2.5 ms gave MAP ${fmt(lvadReference.meanSystemicArterialPressureMmHg)} versus ${fmt(dtHalf.supportMetrics!.meanSystemicArterialPressureMmHg)} mmHg and pump flow ${fmt(lvadReference.meanPumpFlowLMin.LVAD)} versus ${fmt(dtHalf.supportMetrics!.meanPumpFlowLMin.LVAD)} L/min.\n\n## Interpretation boundary\n\nThe cardiovascular state is fully dynamic and volume conservative. Rotary pump flow is a same-candidate quasi-static H–Q solution; circuit inertance is omitted from V1. ECMO O₂/CO₂ is a beat-mean content model with steady Fick closure and does not create dynamic blood-gas states. Peripheral VA differential oxygenation is a two-territory conservative mixer; central VA is well mixed. Patient cases perturb prescribed activation and loads; they are research brackets, not diagnoses.\n`;
}

function scale2d(
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  x0: number,
  y0: number,
  width: number,
  height: number,
) {
  const dx = Math.max(xMax - xMin, 1e-9);
  const dy = Math.max(yMax - yMin, 1e-9);
  return (x: number, y: number): readonly [number, number] => Object.freeze([
    x0 + (x - xMin) / dx * width,
    y0 + height - (y - yMin) / dy * height,
  ] as const);
}

function polyline(points: readonly (readonly [number, number])[], color: string): string {
  return `<polyline points="${points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
}

function svgDocument(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">${body}</svg>\n`;
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function fmt(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : String(value);
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : ""}${fmt(value)}`;
}
