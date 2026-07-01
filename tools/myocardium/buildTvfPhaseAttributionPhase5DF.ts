import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, OverrideBlock, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckResult,
} from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";
import { lastCompleteBeat, phaseInWindow, phaseOf, positiveValvePeaksDetailed } from "@/engine/verification/shapeMetrics";

export const TVF_PHASE_ATTRIBUTION_PHASE5DF_ID = "tvf-phase-attribution-phase5df-result-v1" as const;
export const TVF_PHASE_ATTRIBUTION_PHASE5DF_RESULT_PATH =
  "data/myocardium/protocols/tvf-phase-attribution-phase5df-result-v1.json" as const;

type PointId = "normal-hr75" | "contractility-low-hr75";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type AtrialAvPlaneActiveOverride = {
  readonly avPlaneDescentRiseTauSec?: number;
  readonly avPlaneDescentReleaseTauSec?: number;
  readonly avPlaneDescentMaxRiseVelocity01PerSec?: number;
  readonly avPlaneDescentMaxReleaseVelocity01PerSec?: number;
  readonly avPlaneDescentReleaseInletOpenHold?: number;
  readonly avPlaneDescentReleaseInletOpenThreshold?: number;
};

type PeakDigest = {
  readonly theta: number;
  readonly value: number;
  readonly role: "E-window" | "A-window" | "mid-diastolic-extra";
  readonly raActiveAtPeak: number;
  readonly rapAtPeak: number;
  readonly rvpAtPeak: number;
  readonly acceptedGradientMmHg: number | null;
  readonly acceptedValveState01: number | null;
  readonly acceptedAreaRatio: number | null;
};

type PointResult = {
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly badges: MorphologyBadgeSummary | null;
  readonly failedLabels: readonly string[];
  readonly tvfMetrics: Record<string, number | null> | null;
  readonly rapWaveformMetrics: Record<string, number | null> | null;
  readonly rightAvDelayMetrics: Record<string, number | null> | null;
  readonly qtvPeaks: readonly PeakDigest[];
  readonly classification:
    | "clean-biphasic"
    | "mid-diastolic-extra-wave"
    | "a-window-missing-or-shifted"
    | "not-measured"
    | "exception";
  readonly errorMessage: string | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof TVF_PHASE_ATTRIBUTION_PHASE5DF_ID;
  readonly phase: "5DF";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly diagnosticQuestion:
      "whether the remaining contractility-low TVF failure is a true mid-diastolic third wave or an atrial-kick/pressure-timing phase classification issue";
  };
  readonly upstreamEvidence: {
    readonly phase5DCArtifactId: "post-hygiene-pressure-flow-envelope-phase5dc-result-v1";
    readonly phase5DDArtifactId: "right-av-energy-coasting-phase5dd-result-v1";
    readonly phase5DEArtifactId: "tv-pressure-deadband-phase5de-result-v1";
  };
  readonly variant: {
    readonly id: "pressure-flow-user0-inlet-held-release";
    readonly closurePath: "current-user0-all-chamber-landatrial";
  };
  readonly points: readonly PointSpec[];
  readonly results: readonly PointResult[];
  readonly interpretation: {
    readonly decision:
      | "true-mid-diastolic-extra-wave-not-phase-window-artifact"
      | "likely-atrial-kick-phase-window-issue"
      | "measurement-gap";
    readonly notes: readonly string[];
  };
  readonly recommendedNext: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noValveQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

const profile = resolveVerificationProfile("fitFast");

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", targetTBVMl: 5600, params: { HR: 75 } },
  { id: "contractility-low-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.82 } },
];

const INLET_HELD_RELEASE = {
  avPlaneDescentRiseTauSec: 0.018,
  avPlaneDescentReleaseTauSec: 0.140,
  avPlaneDescentMaxRiseVelocity01PerSec: 24,
  avPlaneDescentMaxReleaseVelocity01PerSec: 7,
  avPlaneDescentReleaseInletOpenHold: 1,
  avPlaneDescentReleaseInletOpenThreshold: 0.08,
} as const;

export function buildTvfPhaseAttributionPhase5DFEvidence(): Evidence {
  const experimentalOptions = pressureFlowUser0Options(INLET_HELD_RELEASE);
  const results = POINTS.map((point) => runPoint(point, experimentalOptions));
  const interpretation = interpret(results);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: TVF_PHASE_ATTRIBUTION_PHASE5DF_ID,
    phase: "5DF",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      diagnosticQuestion:
        "whether the remaining contractility-low TVF failure is a true mid-diastolic third wave or an atrial-kick/pressure-timing phase classification issue",
    },
    upstreamEvidence: {
      phase5DCArtifactId: "post-hygiene-pressure-flow-envelope-phase5dc-result-v1",
      phase5DDArtifactId: "right-av-energy-coasting-phase5dd-result-v1",
      phase5DEArtifactId: "tv-pressure-deadband-phase5de-result-v1",
    },
    variant: {
      id: "pressure-flow-user0-inlet-held-release",
      closurePath: "current-user0-all-chamber-landatrial",
    },
    points: POINTS,
    results,
    interpretation,
    recommendedNext: recommendation(interpretation.decision),
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noOfficialMorphologyAcceptance: true,
      noLandAtrialParameterTuningUnlock: true,
      noValveQdotRootZcTrefSourceStressTuning: true,
      noClinicalScientificValidation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return { ...evidenceWithoutHash, normalizedSha256: hashStable(evidenceWithoutHash) };
}

function pressureFlowUser0Options(override: AtrialAvPlaneActiveOverride): ModelCoreExperimentalOptions {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  const withPatch = withAtrialAvPlaneOverride(resolved.experimentalOptions, override);
  return {
    ...withPatch,
    ventricularChamberTransactionStep: {
      mechanismId: "phase5df-pressure-flow-user0-inlet-held-release",
      iterations: 4,
      relaxation: 0.7,
      providerStateCouplingChambers: ["LV", "RV"],
      includeAdjacentLoadNodes: true,
      avValveBoundaryMode: "accepted-state-valve-pressure-flow",
      avValveBoundaryTargetValves: ["MV", "TV"],
      avValveBoundaryPressureRefitIterations: 2,
      avValveBoundaryPressureRefitRelaxation: 1,
    },
  };
}

function withAtrialAvPlaneOverride(
  experimentalOptions: ModelCoreExperimentalOptions,
  override: AtrialAvPlaneActiveOverride,
): ModelCoreExperimentalOptions {
  const basePatch = experimentalOptions.runtimeParameterPatch ?? {};
  const baseNodes = (basePatch.nodeOverrides ?? {}) as OverrideBlock;
  const nodeOverrides: OverrideBlock = { ...baseNodes };
  for (const side of ["LA", "RA"] as const) {
    const baseNode = baseNodes[side] ?? {};
    nodeOverrides[side] = {
      ...baseNode,
      active: { ...activeOverride(baseNode), ...override },
    };
  }
  return {
    ...experimentalOptions,
    runtimeParameterPatch: {
      ...basePatch,
      nodeOverrides,
    },
  };
}

function activeOverride(node: OverrideBlock[string] | undefined): Record<string, number | string> {
  const active = node?.active;
  return active && typeof active === "object" && !Array.isArray(active)
    ? active as Record<string, number | string>
    : {};
}

function runPoint(point: PointSpec, experimentalOptions: ModelCoreExperimentalOptions): PointResult {
  try {
    const params = { ...DEFAULT_PARAMS, ...point.params };
    const settle = settleToSteadyState(params, {
      targetTBV: point.targetTBVMl,
      dt: profile.dt,
      sampleHz: profile.sampleHz,
      settlePolicy: profile.settlePolicy,
      measureBeats: profile.measureBeats,
      requireProjectorQuiet: profile.requireProjectorQuiet,
      experimentalOptions,
    });
    const measurement = settle.ok
      ? measureSteady(settle.core, settle.settleStatus, {
        targetTBV: point.targetTBVMl,
        dt: profile.dt,
        sampleHz: profile.sampleHz,
        settlePolicy: profile.settlePolicy,
        measureBeats: profile.measureBeats,
        requireProjectorQuiet: profile.requireProjectorQuiet,
        experimentalOptions,
      })
      : null;
    const morphology = measurement ? morphologyCheckSummaryFromSamples(measurement.samples) : null;
    const beat = measurement ? lastCompleteBeat([...measurement.samples]) : [];
    const results = morphology?.results ?? [];
    return {
      pointId: point.id,
      settled: settle.settleStatus.settled,
      settleReason: settle.settleStatus.reason,
      healthStatus: measurement?.health.status ?? settle.core.health().status,
      badges: morphology?.badges ?? null,
      failedLabels: morphology
        ? morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
        : ["not-measured"],
      tvfMetrics: metricsFor(results, "tvf"),
      rapWaveformMetrics: metricsFor(results, "rap-waveform"),
      rightAvDelayMetrics: metricsFor(results, "right-av-delay"),
      qtvPeaks: beat.length > 0 ? qtvPeakDigest(beat) : [],
      classification: morphology ? classifyPoint(results, beat) : "not-measured",
      errorMessage: null,
    };
  } catch (error) {
    return {
      pointId: point.id,
      settled: false,
      settleReason: "exception",
      healthStatus: "exception",
      badges: null,
      failedLabels: ["exception"],
      tvfMetrics: null,
      rapWaveformMetrics: null,
      rightAvDelayMetrics: null,
      qtvPeaks: [],
      classification: "exception",
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function qtvPeakDigest(samples: readonly SimSample[]): readonly PeakDigest[] {
  return positiveValvePeaksDetailed([...samples], "QTV", 0.12, 20)
    .filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12))
    .sort((a, b) => a.theta - b.theta)
    .map((peak) => {
      const sample = nearestSample(samples, peak.theta);
      return {
        theta: round(peak.theta),
        value: round(peak.value),
        role: phaseInWindow(peak.theta, 0.30, 0.75)
          ? "E-window"
          : phaseInWindow(peak.theta, 0.85, 0.08)
            ? "A-window"
            : "mid-diastolic-extra",
        raActiveAtPeak: round(sample?.aRA ?? NaN),
        rapAtPeak: round(sample?.RAP ?? NaN),
        rvpAtPeak: round(sample?.RVP ?? NaN),
        acceptedGradientMmHg: roundNullable(sample?.TV_acceptedBoundaryPressureGradientMmHg ?? null),
        acceptedValveState01: roundNullable(sample?.TV_acceptedBoundaryValveState01 ?? null),
        acceptedAreaRatio: roundNullable(sample?.TV_acceptedBoundaryAreaRatio ?? null),
      };
    });
}

function classifyPoint(results: readonly MorphologyCheckResult[], samples: readonly SimSample[]): PointResult["classification"] {
  const tvf = results.find((result) => result.id === "tvf");
  if (!tvf) return "not-measured";
  if (tvf.status === "ok") return "clean-biphasic";
  const tvfMetrics = tvf.metrics;
  const extraTheta = tvfMetrics.extraPeakTheta;
  const aTheta = tvfMetrics.aPeakTheta;
  if (typeof extraTheta === "number" && phaseInWindow(extraTheta, 0.75, 0.85)) {
    const activePeakTheta = activePeakPhase(samples, "aRA");
    if (activePeakTheta != null && circularDistance(extraTheta, activePeakTheta) <= 0.08) {
      return "a-window-missing-or-shifted";
    }
    return "mid-diastolic-extra-wave";
  }
  return aTheta == null ? "a-window-missing-or-shifted" : "mid-diastolic-extra-wave";
}

function interpret(results: readonly PointResult[]): Evidence["interpretation"] {
  const failed = results.find((result) => result.pointId === "contractility-low-hr75");
  if (!failed || failed.classification === "not-measured" || failed.classification === "exception") {
    return {
      decision: "measurement-gap",
      notes: ["Contractility-low HR75 was not measured cleanly enough to classify the remaining TVF residual."],
    };
  }
  if (failed.classification === "a-window-missing-or-shifted") {
    return {
      decision: "likely-atrial-kick-phase-window-issue",
      notes: [
        "The remaining TVF failure aligns with the RA active/pressure timing window rather than a separate mid-diastolic wave.",
        `Contractility-low TVF metrics: ${JSON.stringify(failed.tvfMetrics)}`,
        `Right AV delay metrics: ${JSON.stringify(failed.rightAvDelayMetrics)}`,
      ],
    };
  }
  return {
    decision: "true-mid-diastolic-extra-wave-not-phase-window-artifact",
    notes: [
      "The remaining TVF failure remains classified as a separate mid-diastolic extra wave, not merely an A-wave phase-window artifact.",
      `Contractility-low TVF metrics: ${JSON.stringify(failed.tvfMetrics)}`,
      `RAP waveform metrics: ${JSON.stringify(failed.rapWaveformMetrics)}`,
      `QTV peaks: ${JSON.stringify(failed.qtvPeaks)}`,
    ],
  };
}

function recommendation(decision: Evidence["interpretation"]["decision"]): readonly string[] {
  if (decision === "likely-atrial-kick-phase-window-issue") {
    return [
      "Do not tune TV valve thresholds; next work should refine atrial/AV timing profile semantics or pressure waveform timing before model adoption.",
      "Keep the deterministic morphology gate strict until profile-specific disease rules are added.",
    ];
  }
  if (decision === "true-mid-diastolic-extra-wave-not-phase-window-artifact") {
    return [
      "Do not continue scalar deadband/coasting variants; move to a broader right AV valve/load/atrial-pressure boundary contract.",
      "Keep LandAtrial parameter tuning locked until TVF and atrial pressure timing are no longer the representative-envelope blocker.",
    ];
  }
  return ["Repeat the targeted measurement with trace export if classification remains ambiguous."];
}

function metricsFor(results: readonly MorphologyCheckResult[], id: MorphologyCheckResult["id"]): Record<string, number | null> | null {
  return results.find((result) => result.id === id)?.metrics ?? null;
}

function nearestSample(samples: readonly SimSample[], theta: number): SimSample | null {
  return samples.reduce((best, sample) => {
    return circularDistance(phaseOf(sample), theta) < circularDistance(phaseOf(best), theta) ? sample : best;
  }, samples[0] ?? null as SimSample | null);
}

function activePeakPhase(samples: readonly SimSample[], key: "aRA" | "aLA"): number | null {
  if (samples.length === 0) return null;
  return phaseOf(samples.reduce((best, sample) => sample[key] > best[key] ? sample : best, samples[0]));
}

function circularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 1;
  return Math.min(d, 1 - d);
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function roundNullable(value: number | null): number | null {
  return value == null ? null : round(value);
}

function stable(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, sortJson(entry)]),
  );
}

export function writeTvfPhaseAttributionPhase5DFEvidence(): Evidence {
  const evidence = buildTvfPhaseAttributionPhase5DFEvidence();
  const outPath = path.resolve(process.cwd(), TVF_PHASE_ATTRIBUTION_PHASE5DF_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeTvfPhaseAttributionPhase5DFEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    interpretation: evidence.interpretation,
    results: evidence.results,
    resultPath: TVF_PHASE_ATTRIBUTION_PHASE5DF_RESULT_PATH,
  }, null, 2));
}
