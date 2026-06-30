import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState, type SteadyMeasurement } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  createModelCoreRuntimeExperimentalOptions,
  resolveModelCoreRuntimeActiveSource,
  type ModelCoreRuntimeActiveSourceMode,
} from "@/engine/myocardium/runtimeActiveSource";
import {
  MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
  type ModelCoreRuntimeRootZcMode,
} from "@/engine/myocardium/runtimeRootZc";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettleStatus } from "@/engine/settling";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import {
  lastCompleteBeat,
  localExtrema,
  phaseOf,
  positiveValvePeaksDetailed,
} from "@/engine/verification/shapeMetrics";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const MORPHOLOGY_ATTRIBUTION_PHASE5BO_ID =
  "morphology-attribution-phase5bo-result-v1" as const;
export const MORPHOLOGY_ATTRIBUTION_PHASE5BO_RESULT_PATH =
  "data/myocardium/protocols/morphology-attribution-phase5bo-result-v1.json" as const;

type VariantId =
  | "user0-default"
  | "user0-root-current"
  | "user0-avplane-off"
  | "lv-rv-land-root-default"
  | "lv-rv-land-root-current"
  | "lv-land-root-default"
  | "lv-land-root-current"
  | "legacy-frozen-reference";

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode;
  readonly rootZcMode?: ModelCoreRuntimeRootZcMode;
  readonly atrialAvPlane: "runtime-default" | "off" | "legacy-atria";
  readonly activeChambers: readonly ("LV" | "RV" | "LA" | "RA")[];
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type VariantResult = {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode;
  readonly rootZcMode: ModelCoreRuntimeRootZcMode | null;
  readonly atrialAvPlane: VariantSpec["atrialAvPlane"];
  readonly activeChambers: VariantSpec["activeChambers"];
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"];
  readonly actualSeconds: number | null;
  readonly healthStatus: SimulationHealth["status"] | null;
  readonly metrics: MetricDigest | null;
  readonly morphology: MorphologyCheckSummary | null;
  readonly failureDigest: FailureDigest | null;
  readonly timingDigest: TimingDigest | null;
  readonly signalDigest: SignalDigest | null;
};

type MetricDigest = Pick<
  SimMetrics,
  | "AoPMean"
  | "CO_L"
  | "CO_R"
  | "LAPMean"
  | "RAPMean"
  | "LVEDPApprox"
  | "EF_LApprox"
  | "EF_RApprox"
>;

type FailureDigest = {
  readonly badges: MorphologyBadgeSummary;
  readonly failedLabels: readonly string[];
  readonly lvDome: Record<string, number | null> | null;
  readonly rvDome: Record<string, number | null> | null;
  readonly mvf: Record<string, number | null> | null;
  readonly tvf: Record<string, number | null> | null;
  readonly lap: Record<string, number | null> | null;
  readonly rap: Record<string, number | null> | null;
};

type TimingDigest = {
  readonly activeAPeakTheta: {
    readonly LA: number | null;
    readonly RA: number | null;
  };
  readonly pressureAPeakTheta: {
    readonly LA: number | null;
    readonly RA: number | null;
  };
  readonly caPulseOnsetTheta: {
    readonly LA: number | null;
    readonly RA: number | null;
  };
};

type SignalDigest = {
  readonly lvPressurePeaks: readonly PeakDigest[];
  readonly lvPressureTroughs: readonly PeakDigest[];
  readonly lvActivePeaks: readonly PeakDigest[];
  readonly lvAorticFlowPeaks: readonly PeakDigest[];
  readonly mvFlowPeaks: readonly PeakDigest[];
  readonly laPressurePeaks: readonly PeakDigest[];
  readonly laPressureTroughs: readonly PeakDigest[];
};

type PeakDigest = {
  readonly theta: number;
  readonly value: number;
};

type Attribution = {
  readonly lvDoubleDome:
    | "root-zc-associated"
    | "lv-land-valve-load-associated"
    | "root-zc-not-primary"
    | "unclassified";
  readonly mvfExtraWave:
    | "lv-land-filling-coupling-associated"
    | "landatrial-associated"
    | "avplane-associated"
    | "not-isolated"
    | "unclassified";
  readonly lapTiming:
    | "landatrial-associated"
    | "avplane-associated"
    | "not-specific-to-landatrial"
    | "not-isolated"
    | "unclassified";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MORPHOLOGY_ATTRIBUTION_PHASE5BO_ID;
  readonly phase: "Phase 5BO";
  readonly generatedAt: string;
  readonly claimBoundary: "morphology-attribution-diagnostic-no-physiology-or-morphology-acceptance";
  readonly protocol: {
    readonly profile: "fitFast";
    readonly gateSet: "normalBaseline";
    readonly morphologyCheckVersion: "morphology-check-v1";
    readonly comparedVariants: readonly VariantId[];
    readonly noA1A2GainSweep: true;
    readonly noLandAtrialParameterTuning: true;
    readonly noRootZcRetuning: true;
    readonly noValveThresholdTuning: true;
    readonly noRuntimeDefaultChange: true;
    readonly noPermanentNpmScriptAdded: true;
  };
  readonly variants: readonly VariantResult[];
  readonly attribution: Attribution;
  readonly summary: {
    readonly diagnosticStatus:
      | "attribution-recorded"
      | "attribution-incomplete-settle-blocked";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noOfficialMorphologyAcceptance: true;
    readonly noAtrialPhysiologyAcceptance: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noQDotClampRemovalClaim: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

const profile = resolveVerificationProfile("fitFast");
const variants: readonly VariantSpec[] = [
  runtimeVariant(
    "user0-default",
    "User-0 default: LV+RV+LA+RA LandAtrial plus sourced root/Zc",
    "Records the current education-visible failure surface.",
    MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    "runtime-default",
  ),
  runtimeVariant(
    "user0-root-current",
    "User-0 active sources with current/no-boundary root/Zc",
    "If LV/RV systolic double dome disappears, sourced root/Zc is implicated.",
    MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
    "runtime-default",
  ),
  avPlaneOffVariant(),
  runtimeVariant(
    "lv-rv-land-root-default",
    "LV+RV Land plus legacy atria and sourced root/Zc",
    "Separates atrial LandAtrial from ventricular/root morphology.",
    MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    "legacy-atria",
  ),
  runtimeVariant(
    "lv-rv-land-root-current",
    "LV+RV Land plus legacy atria and current/no-boundary root/Zc",
    "Clean root/Zc ablation with the atria held on legacy active stress.",
    MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
    "legacy-atria",
  ),
  runtimeVariant(
    "lv-land-root-default",
    "LV-only Land plus legacy RV/atria and sourced root/Zc",
    "Tests whether LV Land alone is enough to produce the LV dome and MVF failures.",
    MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
    MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    "legacy-atria",
  ),
  runtimeVariant(
    "lv-land-root-current",
    "LV-only Land plus legacy RV/atria and current/no-boundary root/Zc",
    "Clean LV-only Land root/Zc ablation.",
    MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
    MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
    "legacy-atria",
  ),
  legacyVariant(),
];

export function buildMorphologyAttributionPhase5BOEvidence(): Evidence {
  const startedAt = new Date().toISOString();
  const results = variants.map(runVariant);
  const attribution = classifyAttribution(results);
  const incomplete = results.some((result) => !result.settled || result.morphology == null);
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: MORPHOLOGY_ATTRIBUTION_PHASE5BO_ID,
    phase: "Phase 5BO",
    generatedAt: startedAt,
    claimBoundary: "morphology-attribution-diagnostic-no-physiology-or-morphology-acceptance",
    protocol: {
      profile: "fitFast",
      gateSet: "normalBaseline",
      morphologyCheckVersion: "morphology-check-v1",
      comparedVariants: variants.map((variant) => variant.id),
      noA1A2GainSweep: true,
      noLandAtrialParameterTuning: true,
      noRootZcRetuning: true,
      noValveThresholdTuning: true,
      noRuntimeDefaultChange: true,
      noPermanentNpmScriptAdded: true,
    },
    variants: results,
    attribution,
    summary: {
      diagnosticStatus: incomplete ? "attribution-incomplete-settle-blocked" : "attribution-recorded",
      currentInterpretation: interpretation(attribution, results),
      recommendedNext: recommendedNext(attribution),
      blockers: [
        "This is a closure-local attribution matrix, not a morphology fix or physiology acceptance.",
        "A1/A2 remain frozen diagnostic scaffolds; this runner does not sweep or select them.",
        "Any follow-up fix must preserve output health and rerun morphology-check-v1 over the same profile.",
      ],
    },
    boundary: {
      noOfficialMorphologyAcceptance: true,
      noAtrialPhysiologyAcceptance: true,
      noValveLoadTimingAcceptance: true,
      noQDotClampRemovalClaim: true,
      noClinicalScientificValidation: true,
    },
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runtimeVariant(
  id: VariantId,
  label: string,
  hypothesis: string,
  runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode,
  rootZcMode: ModelCoreRuntimeRootZcMode,
  atrialAvPlane: VariantSpec["atrialAvPlane"],
): VariantSpec {
  return {
    id,
    label,
    hypothesis,
    runtimeActiveSourceMode,
    rootZcMode,
    atrialAvPlane,
    activeChambers: runtimeActiveSourceMode === MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE
      ? ["LV"]
      : runtimeActiveSourceMode === MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE
      ? ["LV", "RV"]
      : ["LV", "RV", "LA", "RA"],
    experimentalOptions: createModelCoreRuntimeExperimentalOptions({
      mode: runtimeActiveSourceMode,
      rootZcMode,
      runtimeParams: DEFAULT_PARAMS,
    }),
  };
}

function avPlaneOffVariant(): VariantSpec {
  const experimentalOptions = createModelCoreRuntimeExperimentalOptions({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "user0-avplane-off",
    label: "User-0 active sources with LandAtrial AV-plane gain disabled",
    hypothesis: "If MVF/LAP failures improve, AV-plane recoil/effective geometry is implicated.",
    runtimeActiveSourceMode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    atrialAvPlane: "off",
    activeChambers: ["LV", "RV", "LA", "RA"],
    experimentalOptions: {
      ...experimentalOptions,
      runtimeParameterPatch: {
        ...(experimentalOptions.runtimeParameterPatch ?? {}),
        nodeOverrides: {
          ...(experimentalOptions.runtimeParameterPatch?.nodeOverrides ?? {}),
          LA: { active: { avPlaneGainMl: 0 } },
          RA: { active: { avPlaneGainMl: 0 } },
        },
      },
    },
  };
}

function legacyVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  });
  return {
    id: "legacy-frozen-reference",
    label: "Frozen legacy active-stress rollback/reference",
    hypothesis: "Reference path for gross morphology failures under the same fitFast normal baseline.",
    runtimeActiveSourceMode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
    rootZcMode: undefined,
    atrialAvPlane: "legacy-atria",
    activeChambers: [],
    experimentalOptions: resolved.experimentalOptions,
  };
}

function runVariant(spec: VariantSpec): VariantResult {
  const settle = settleToSteadyState(DEFAULT_PARAMS, {
    targetTBV: profile.targetTBV,
    dt: profile.dt,
    sampleHz: profile.sampleHz,
    settlePolicy: profile.settlePolicy,
    measureBeats: profile.measureBeats,
    requireProjectorQuiet: profile.requireProjectorQuiet,
    experimentalOptions: spec.experimentalOptions,
  });
  const measurement = settle.ok
    ? measureSteady(settle.core, settle.settleStatus, {
      targetTBV: profile.targetTBV,
      dt: profile.dt,
      sampleHz: profile.sampleHz,
      settlePolicy: profile.settlePolicy,
      measureBeats: profile.measureBeats,
      requireProjectorQuiet: profile.requireProjectorQuiet,
      experimentalOptions: spec.experimentalOptions,
    })
    : null;
  const morphology = measurement ? morphologyCheckSummaryFromSamples(measurement.samples) : null;
  return {
    id: spec.id,
    label: spec.label,
    hypothesis: spec.hypothesis,
    runtimeActiveSourceMode: spec.runtimeActiveSourceMode,
    rootZcMode: spec.rootZcMode ?? null,
    atrialAvPlane: spec.atrialAvPlane,
    activeChambers: spec.activeChambers,
    settled: settle.settleStatus.settled,
    settleReason: settle.settleStatus.reason,
    actualSeconds: "actualSeconds" in settle.settleStatus ? settle.settleStatus.actualSeconds : null,
    healthStatus: measurement?.health.status ?? settle.core.health().status,
    metrics: measurement ? metricDigest(measurement.metrics) : null,
    morphology,
    failureDigest: morphology ? failureDigest(morphology) : null,
    timingDigest: measurement ? timingDigest(measurement) : null,
    signalDigest: measurement ? signalDigest(measurement) : null,
  };
}

function metricDigest(metrics: SimMetrics): MetricDigest {
  return {
    AoPMean: round(metrics.AoPMean),
    CO_L: round(metrics.CO_L),
    CO_R: round(metrics.CO_R),
    LAPMean: round(metrics.LAPMean),
    RAPMean: round(metrics.RAPMean),
    LVEDPApprox: round(metrics.LVEDPApprox),
    EF_LApprox: round(metrics.EF_LApprox),
    EF_RApprox: round(metrics.EF_RApprox),
  };
}

function failureDigest(morphology: MorphologyCheckSummary): FailureDigest {
  return {
    badges: morphology.badges,
    failedLabels: morphology.results
      .filter((result) => result.status === "failed")
      .map((result) => result.label),
    lvDome: metricsFor(morphology, "lv-pv-loop"),
    rvDome: metricsFor(morphology, "rv-pv-loop"),
    mvf: metricsFor(morphology, "mvf"),
    tvf: metricsFor(morphology, "tvf"),
    lap: metricsFor(morphology, "lap-waveform"),
    rap: metricsFor(morphology, "rap-waveform"),
  };
}

function metricsFor(
  morphology: MorphologyCheckSummary,
  id: MorphologyCheckSummary["results"][number]["id"],
): Record<string, number | null> | null {
  return morphology.results.find((result) => result.id === id)?.metrics ?? null;
}

function timingDigest(measurement: SteadyMeasurement): TimingDigest {
  return {
    activeAPeakTheta: {
      LA: nullableRound(measurement.phaseTiming.activeAPeakTheta.LA),
      RA: nullableRound(measurement.phaseTiming.activeAPeakTheta.RA),
    },
    pressureAPeakTheta: {
      LA: nullableRound(measurement.phaseTiming.pressureAPeakTheta.LA),
      RA: nullableRound(measurement.phaseTiming.pressureAPeakTheta.RA),
    },
    caPulseOnsetTheta: {
      LA: nullableRound(measurement.phaseTiming.caPulseOnsetTheta.LA),
      RA: nullableRound(measurement.phaseTiming.caPulseOnsetTheta.RA),
    },
  };
}

function signalDigest(measurement: SteadyMeasurement): SignalDigest {
  const beat = lastCompleteBeat([...measurement.samples]);
  const lvPressureRange = range(beat.map((sample) => sample.LVP));
  const laPressureRange = range(beat.map((sample) => sample.LAP));
  const lvActiveRange = range(beat.map((sample) => sample.aLV));
  return {
    lvPressurePeaks: extremaDigest(localExtrema([...beat], "LVP", "max", Math.max(0.5, 0.08 * lvPressureRange))),
    lvPressureTroughs: extremaDigest(localExtrema([...beat], "LVP", "min", Math.max(0.5, 0.08 * lvPressureRange))),
    lvActivePeaks: extremaDigest(localExtrema([...beat], "aLV", "max", Math.max(0.02, 0.08 * lvActiveRange))),
    lvAorticFlowPeaks: extremaDigest(positiveFlowPeaksDetailed(beat, "QAo", 0.05, 20)),
    mvFlowPeaks: extremaDigest(positiveValvePeaksDetailed([...beat], "QMV", 0.12, 20)),
    laPressurePeaks: extremaDigest(localExtrema([...beat], "LAP", "max", Math.max(0.25, 0.08 * laPressureRange))),
    laPressureTroughs: extremaDigest(localExtrema([...beat], "LAP", "min", Math.max(0.25, 0.08 * laPressureRange))),
  };
}

function extremaDigest(peaks: readonly { readonly theta: number; readonly value: number }[]): readonly PeakDigest[] {
  return peaks.map((peak) => ({
    theta: round(peak.theta),
    value: round(peak.value),
  }));
}

function positiveFlowPeaksDetailed(
  samples: readonly SimSample[],
  key: "QAo" | "QPV",
  relativeThreshold: number,
  absoluteThreshold: number,
): readonly PeakDigest[] {
  const maxFlow = Math.max(0, ...samples.map((sample) => sample[key]));
  const threshold = Math.max(absoluteThreshold, relativeThreshold * maxFlow);
  const raw: PeakDigest[] = [];
  for (let i = 1; i < samples.length - 1; i++) {
    const prev = samples[i - 1][key];
    const cur = samples[i][key];
    const next = samples[i + 1][key];
    if (cur <= threshold || cur < prev || cur <= next) continue;
    raw.push({ theta: phaseOf(samples[i]), value: cur });
  }
  return mergeNearbyPeaks(raw, 0.045);
}

function mergeNearbyPeaks(peaks: readonly PeakDigest[], minSeparationTheta: number): readonly PeakDigest[] {
  const out: PeakDigest[] = [];
  for (const peak of [...peaks].sort((a, b) => a.theta - b.theta)) {
    const last = out.at(-1);
    if (!last || peak.theta - last.theta > minSeparationTheta) {
      out.push(peak);
    } else if (peak.value > last.value) {
      out[out.length - 1] = peak;
    }
  }
  return out;
}

function classifyAttribution(results: readonly VariantResult[]): Attribution {
  const user0 = requiredResult(results, "user0-default");
  const user0RootCurrent = requiredResult(results, "user0-root-current");
  const user0AvPlaneOff = requiredResult(results, "user0-avplane-off");
  const lvRvRootDefault = requiredResult(results, "lv-rv-land-root-default");
  const lvRvRootCurrent = requiredResult(results, "lv-rv-land-root-current");
  const lvRootDefault = requiredResult(results, "lv-land-root-default");
  const lvRootCurrent = requiredResult(results, "lv-land-root-current");
  const legacy = requiredResult(results, "legacy-frozen-reference");

  const user0LvFails = failed(user0, "lvPv");
  const user0RootCurrentLvFails = failed(user0RootCurrent, "lvPv");
  const lvRvRootDefaultLvFails = failed(lvRvRootDefault, "lvPv");
  const lvRvRootCurrentLvFails = failed(lvRvRootCurrent, "lvPv");
  const lvRootDefaultLvFails = failed(lvRootDefault, "lvPv");
  const lvRootCurrentLvFails = failed(lvRootCurrent, "lvPv");
  const lvDoubleDome = user0LvFails && !user0RootCurrentLvFails && lvRvRootDefaultLvFails && !lvRvRootCurrentLvFails
    ? "root-zc-associated"
    : user0LvFails && user0RootCurrentLvFails && lvRootDefaultLvFails && lvRootCurrentLvFails && !failed(legacy, "lvPv")
      ? "lv-land-valve-load-associated"
    : user0LvFails && user0RootCurrentLvFails && (lvRootDefaultLvFails || lvRootCurrentLvFails)
      ? "root-zc-not-primary"
      : "unclassified";

  const user0MvfFails = failed(user0, "mvf");
  const avPlaneOffMvfFails = failed(user0AvPlaneOff, "mvf");
  const lvRvMvfFails = failed(lvRvRootDefault, "mvf");
  const lvMvfFails = failed(lvRootDefault, "mvf");
  const legacyMvfFails = failed(legacy, "mvf");
  const mvfExtraWave = user0MvfFails && !lvRvMvfFails && !legacyMvfFails
    ? (!avPlaneOffMvfFails ? "avplane-associated" : "landatrial-associated")
    : user0MvfFails && lvMvfFails && !legacyMvfFails
      ? "lv-land-filling-coupling-associated"
    : user0MvfFails
      ? "not-isolated"
      : "unclassified";

  const user0LapFails = failed(user0, "lapWaveform");
  const avPlaneOffLapFails = failed(user0AvPlaneOff, "lapWaveform");
  const lvRvLapFails = failed(lvRvRootDefault, "lapWaveform");
  const legacyLapFails = failed(legacy, "lapWaveform");
  const lapTiming = user0LapFails && !lvRvLapFails && !legacyLapFails
    ? (!avPlaneOffLapFails ? "avplane-associated" : "landatrial-associated")
    : user0LapFails && legacyLapFails
      ? "not-specific-to-landatrial"
    : user0LapFails
      ? "not-isolated"
      : "unclassified";

  return {
    lvDoubleDome,
    mvfExtraWave,
    lapTiming,
    notes: [
      `LV default/root-current/lv-rv-root-default/lv-rv-root-current/lv-root-default/lv-root-current failures=${user0LvFails}/${user0RootCurrentLvFails}/${lvRvRootDefaultLvFails}/${lvRvRootCurrentLvFails}/${lvRootDefaultLvFails}/${lvRootCurrentLvFails}.`,
      `MVF user0/avplane-off/lv-rv/lv-only/legacy failures=${user0MvfFails}/${avPlaneOffMvfFails}/${lvRvMvfFails}/${lvMvfFails}/${legacyMvfFails}.`,
      `LAP user0/avplane-off/lv-rv/legacy failures=${user0LapFails}/${avPlaneOffLapFails}/${lvRvLapFails}/${legacyLapFails}.`,
    ],
  };
}

function requiredResult(results: readonly VariantResult[], id: VariantId): VariantResult {
  const result = results.find((entry) => entry.id === id);
  if (!result) throw new Error(`Missing Phase 5BO result ${id}.`);
  return result;
}

function failed(result: VariantResult, badge: keyof MorphologyBadgeSummary): boolean {
  return result.failureDigest?.badges[badge] === "failed";
}

function interpretation(attribution: Attribution, results: readonly VariantResult[]): string {
  const user0 = requiredResult(results, "user0-default");
  const failedLabels = user0.failureDigest?.failedLabels.join(", ") || "none";
  return [
    `Current user-0 default failed labels: ${failedLabels}.`,
    `LV double-dome attribution: ${attribution.lvDoubleDome}.`,
    `MVF extra-wave attribution: ${attribution.mvfExtraWave}.`,
    `LAP timing/readability attribution: ${attribution.lapTiming}.`,
  ].join(" ");
}

function recommendedNext(attribution: Attribution): readonly string[] {
  const next = [
    "rerun morphology-check-v1 after any model fix; do not continue closed-loop LandAtrial parameter tuning while LV/MVF/LAP badges fail",
  ];
  if (attribution.lvDoubleDome === "root-zc-associated") {
    next.push("inspect sourced root/Zc damping or valve/load timing before further LandAtrial changes; root-current ablation removes the LV double dome");
  } else if (attribution.lvDoubleDome === "lv-land-valve-load-associated") {
    next.push("treat the LV double dome as an LV Land plus valve/load coupling problem; LV-only Land reproduces it and root-current ablation does not remove it");
  } else if (attribution.lvDoubleDome === "root-zc-not-primary") {
    next.push("localize LV dome upstream of root/Zc by inspecting LV/RV Land source, valve events, and ejection-window classifier metrics");
  }
  if (attribution.mvfExtraWave === "lv-land-filling-coupling-associated") {
    next.push("treat the MVF third wave as LV Land/filling coupling until disproven; LV-only Land reproduces it while frozen legacy does not");
  }
  if (attribution.mvfExtraWave === "avplane-associated") {
    next.push("inspect LandAtrial AV-plane recoil/effective-volume timing before atrial active-source parameter changes");
  } else if (attribution.mvfExtraWave === "landatrial-associated") {
    next.push("inspect LandAtrial activation/pressure-adapter output and valve interaction with AV-plane held fixed/off");
  } else if (attribution.mvfExtraWave === "not-isolated") {
    next.push("MVF remains non-biphasic outside the full LandAtrial path; inspect valve/load timing diagnostics before attributing it to atrial Land");
  }
  if (attribution.lapTiming === "avplane-associated") {
    next.push("treat LAP readability as AV-plane/effective-wall geometry timing until disproven by direct readbacks");
  } else if (attribution.lapTiming === "landatrial-associated") {
    next.push("treat LAP readability as a LandAtrial pressure-source or active timing issue, not an A1/A2 bridge tuning issue");
  } else if (attribution.lapTiming === "not-specific-to-landatrial") {
    next.push("tighten or split the LAP/RAP pressure timing checker before using it as a LandAtrial tuning signal; frozen legacy also fails the current pressure extrema rule");
  }
  return next;
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function nullableRound(value: number | null): number | null {
  return value == null ? null : round(value);
}

function range(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return Math.max(...finite) - Math.min(...finite);
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortForHash(value))).digest("hex");
}

function sortForHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForHash);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortForHash(entry)]),
  );
}

function writeEvidence(): Evidence {
  const evidence = buildMorphologyAttributionPhase5BOEvidence();
  const outPath = path.resolve(process.cwd(), MORPHOLOGY_ATTRIBUTION_PHASE5BO_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

const isDirectRun = process.argv[1] != null
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const evidence = writeEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    hash: evidence.normalizedSha256,
    diagnosticStatus: evidence.summary.diagnosticStatus,
    attribution: evidence.attribution,
    variants: evidence.variants.map((variant) => ({
      id: variant.id,
      settled: variant.settled,
      healthStatus: variant.healthStatus,
      morphology: variant.morphology?.status ?? null,
      badges: variant.failureDigest?.badges ?? null,
      failedLabels: variant.failureDigest?.failedLabels ?? null,
      lvDome: variant.failureDigest?.lvDome ?? null,
      mvf: variant.failureDigest?.mvf ?? null,
      lap: variant.failureDigest?.lap ?? null,
      signalDigest: variant.signalDigest,
    })),
  }, null, 2));
}
