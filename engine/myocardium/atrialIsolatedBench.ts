import {
  ActiveStressChamberModel,
  defaultActiveLA,
  defaultActiveRA,
  type ActiveStressDebugTerms,
  type ChamberCtx,
  type ChamberGeometryTerms,
  type ChamberInternal,
  type ChamberPressureTerms,
} from "@/engine/chambers";
import { defaultParams } from "@/engine/core/params";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";
import {
  LANDATRIAL_RUNTIME_SELECTED_CONFIGURATION_ID,
  LANDATRIAL_RUNTIME_CONTRACT_V1,
} from "@/engine/myocardium/landAtrialRuntimeContract";
import {
  createLandAtrialRuntimeInstrumentation,
  createLandAtrialRuntimeProviders,
  type LandAtrialRuntimeInstrumentation,
} from "@/engine/myocardium/landAtrialRuntime";
import type { ModelCoreLand2017LvSourceProviderInstrumentation } from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";

export type AtrialIsolatedBenchChamber = "LA" | "RA";
export type AtrialIsolatedBenchVariant = "landatrial-floor-avplane-on" | "landatrial-floor-avplane-off";

export type AtrialIsolatedBenchSample = {
  readonly tSec: number;
  readonly theta: number;
  readonly volumeMl: number;
  readonly volumeRateMlPerSec: number;
  readonly avPlaneDescent01: number;
  readonly avPlaneDescentVelocity01PerSec: number;
  readonly pressureMmHg: number;
  readonly pressureUnclampedMmHg: number;
  readonly passivePressureMmHg: number;
  readonly activePressureMmHg: number;
  readonly avPlanePressureDeltaMmHg: number;
  readonly sourceActiveFiberStressPa: number;
  readonly freeCalciumUM: number;
  readonly wallVolumeMl: number;
  readonly wallVolumeWithoutAvPlaneMl: number;
  readonly effectiveVolumeCorrectionMl: number;
  readonly effectiveVolumeCorrectionVelocityMlPerSec: number;
  readonly wallLambda: number;
  readonly wallLambdaWithoutAvPlane: number;
  readonly wallLambdaAvPlaneDelta: number;
  readonly wallEngineeringStrain: number;
  readonly wallEngineeringStrainWithoutAvPlane: number;
  readonly wallEngineeringStrainAvPlaneDelta: number;
};

export type AtrialIsolatedBenchSummary = {
  readonly chamber: AtrialIsolatedBenchChamber;
  readonly variant: AtrialIsolatedBenchVariant;
  readonly sourceCandidateId: typeof LANDATRIAL_RUNTIME_SELECTED_CONFIGURATION_ID;
  readonly sampleCount: number;
  readonly measuredBeatCount: number;
  readonly providerId: string;
  readonly pressureMmHg: RangeCompact;
  readonly passivePressureMmHg: RangeCompact;
  readonly activePressureMmHg: RangeCompact;
  readonly avPlanePressureDeltaMmHg: RangeCompact;
  readonly sourceActiveFiberStressPa: RangeCompact;
  readonly freeCalciumUM: RangeCompact;
  readonly wallLambda: RangeCompact;
  readonly wallLambdaWithoutAvPlane: RangeCompact;
  readonly wallLambdaAvPlaneDelta: RangeCompact;
  readonly effectiveVolumeCorrectionMl: RangeCompact;
  readonly effectiveVolumeCorrectionVelocityMlPerSec: RangeCompact;
  readonly reservoirStrain: number | null;
  readonly conduitStrain: number | null;
  readonly contractileStrain: number | null;
  readonly loopSignedAreaMmHgMl: number | null;
  readonly loopAbsAreaMmHgMl: number | null;
  readonly landSolveFailureCount: number;
  readonly maxSolverResidualNorm: number;
};

export type AtrialIsolatedBenchResult = {
  readonly benchId: "landatrial-isolated-prescribed-volume-avplane-bench-v1";
  readonly protocol: {
    readonly candidateId: typeof LANDATRIAL_RUNTIME_SELECTED_CONFIGURATION_ID;
    readonly hr: 75;
    readonly dtSec: 0.001;
    readonly warmupBeats: 2;
    readonly measureBeats: 3;
    readonly variants: readonly AtrialIsolatedBenchVariant[];
    readonly chambers: readonly AtrialIsolatedBenchChamber[];
    readonly noClosedLoopValveRootPreloadCoupling: true;
    readonly noA1A2BridgeTuning: true;
  };
  readonly summaries: readonly AtrialIsolatedBenchSummary[];
  readonly avPlaneSensitivity: {
    readonly LA: AtrialIsolatedBenchSensitivity;
    readonly RA: AtrialIsolatedBenchSensitivity;
  };
};

export type AtrialIsolatedBenchSensitivity = {
  readonly deltaReservoirStrainOnMinusOff: number | null;
  readonly deltaLoopAbsAreaOnMinusOffMmHgMl: number | null;
  readonly minAvPlanePressureDeltaMmHg: number | null;
  readonly maxEffectiveVolumeCorrectionMl: number | null;
};

type RangeCompact = {
  readonly min: number | null;
  readonly max: number | null;
};

const HR = 75 as const;
const DT_SEC = 0.001 as const;
const WARMUP_BEATS = 2 as const;
const MEASURE_BEATS = 3 as const;
const TOTAL_BEATS = WARMUP_BEATS + MEASURE_BEATS;

export function runLandAtrialIsolatedBench(): AtrialIsolatedBenchResult {
  const summaries = (["LA", "RA"] as const).flatMap((chamber) =>
    (["landatrial-floor-avplane-on", "landatrial-floor-avplane-off"] as const)
      .map((variant) => runChamberVariant(chamber, variant)));
  return {
    benchId: "landatrial-isolated-prescribed-volume-avplane-bench-v1",
    protocol: {
      candidateId: LANDATRIAL_RUNTIME_SELECTED_CONFIGURATION_ID,
      hr: HR,
      dtSec: DT_SEC,
      warmupBeats: WARMUP_BEATS,
      measureBeats: MEASURE_BEATS,
      variants: ["landatrial-floor-avplane-on", "landatrial-floor-avplane-off"],
      chambers: ["LA", "RA"],
      noClosedLoopValveRootPreloadCoupling: true,
      noA1A2BridgeTuning: true,
    },
    summaries,
    avPlaneSensitivity: {
      LA: sensitivity("LA", summaries),
      RA: sensitivity("RA", summaries),
    },
  };
}

function runChamberVariant(
  chamber: AtrialIsolatedBenchChamber,
  variant: AtrialIsolatedBenchVariant,
): AtrialIsolatedBenchSummary {
  const instrumentation = createLandAtrialRuntimeInstrumentation();
  const providers = createLandAtrialRuntimeProviders(instrumentation);
  const provider = providers[chamber];
  if (!provider) throw new Error(`Missing LandAtrial runtime provider for ${chamber}.`);
  const activeModel = activeModelFor(chamber, variant);
  let internal = provider.initialInternal({ chamber, activeModel });
  let providerState = provider.initialProviderState?.({ chamber, activeModel });
  let providerStateVersion = 0;
  const samples: AtrialIsolatedBenchSample[] = [];
  const steps = Math.round(TOTAL_BEATS * beatPeriodSec() / DT_SEC);

  for (let i = 0; i < steps; i++) {
    const tSec = i * DT_SEC;
    const nextTSec = (i + 1) * DT_SEC;
    const before = stateAt(chamber, tSec);
    const after = stateAt(chamber, nextTSec);
    const beforeCtx = chamberCtx(chamber, before);
    const afterCtx = chamberCtx(chamber, after);
    const call = activeCall(chamber, activeModel, provider, before.volumeMl, internal, beforeCtx, providerState, providerStateVersion);
    const pressureTerms = debugPressureTerms(provider, call);
    const noAvPlaneTerms = activeModel.debugPressureTermsFromSignedActiveFiberStress(
      before.volumeMl,
      internal,
      { ...beforeCtx, pairedVentricleShortening01: 0, pairedVentricleShorteningVelocity01PerSec: 0 },
      pressureTerms.sigmaAct,
    );
    const passivePressure = splitPassivePressure(pressureTerms);
    const activePressure = pressureTerms.pressureUnclampedMmHg - passivePressure;
    const debugTerms = debugActiveStressTerms(provider, call);
    const geometry = activeModel.debugGeometryTerms(before.volumeMl, beforeCtx);

    if (tSec >= WARMUP_BEATS * beatPeriodSec()) {
      samples.push(sampleFrom({
        state: before,
        pressureTerms,
        debugTerms,
        geometry,
        passivePressure,
        activePressure,
        avPlanePressureDeltaMmHg: pressureTerms.pressureUnclampedMmHg - noAvPlaneTerms.pressureUnclampedMmHg,
      }));
    }

    const derivatives = provider.internalDerivatives(call);
    const nextInternal = {
      c: clamp(internal.c + derivatives.cDot * DT_SEC, 0, 10),
      a: clamp(internal.a + derivatives.aDot * DT_SEC, 0, 1),
      r: clamp(internal.r + derivatives.rDot * DT_SEC, 0, 1000),
      tensionPa: internal.tensionPa == null || derivatives.tensionPaDot == null
        ? internal.tensionPa
        : clamp(internal.tensionPa + derivatives.tensionPaDot * DT_SEC, 0, 500000),
      lambdaAct: internal.lambdaAct == null || derivatives.lambdaActDot == null
        ? internal.lambdaAct
        : clamp(internal.lambdaAct + derivatives.lambdaActDot * DT_SEC, 0.25, 2.5),
    } satisfies ChamberInternal;

    if (provider.commitProviderStateAfterStep) {
      providerState = provider.commitProviderStateAfterStep({
        chamber,
        activeModel,
        stepDtSec: DT_SEC,
        previousProviderState: providerState,
        previousProviderStateVersion: providerStateVersion,
        beforeStep: {
          tSec,
          phi: before.phi,
          rawVolumeMl: before.volumeMl,
          effectiveVolumeMl: before.volumeMl,
          internal,
          chamberCtx: beforeCtx,
        },
        afterStep: {
          tSec: nextTSec,
          phi: after.phi,
          rawVolumeMl: after.volumeMl,
          effectiveVolumeMl: after.volumeMl,
          internal: nextInternal,
          chamberCtx: afterCtx,
        },
      });
      providerStateVersion += 1;
    }
    internal = nextInternal;
  }

  return summarize(chamber, variant, provider, instrumentationFor(chamber, instrumentation), samples);
}

function activeModelFor(
  chamber: AtrialIsolatedBenchChamber,
  variant: AtrialIsolatedBenchVariant,
): ActiveStressChamberModel {
  const base = chamber === "LA" ? defaultActiveLA : defaultActiveRA;
  const floorOverride = LANDATRIAL_RUNTIME_CONTRACT_V1.atrialActiveOverrides[chamber];
  return new ActiveStressChamberModel({
    ...base,
    ...floorOverride,
    avPlaneGainMl: variant === "landatrial-floor-avplane-on"
      ? floorOverride.avPlaneGainMl
      : 0,
  });
}

type PrescribedState = {
  readonly tSec: number;
  readonly phi: number;
  readonly theta: number;
  readonly volumeMl: number;
  readonly volumeRateMlPerSec: number;
  readonly avPlaneDescent01: number;
  readonly avPlaneDescentVelocity01PerSec: number;
};

function stateAt(chamber: AtrialIsolatedBenchChamber, tSec: number): PrescribedState {
  const phi = tSec / beatPeriodSec();
  const theta = frac(phi);
  const dtTheta = DT_SEC / beatPeriodSec();
  const volumeMl = prescribedVolume(chamber, theta);
  const previousVolume = prescribedVolume(chamber, frac(theta - dtTheta));
  const avPlaneDescent01 = prescribedAvPlaneDescent(theta);
  const previousDescent = prescribedAvPlaneDescent(frac(theta - dtTheta));
  return {
    tSec,
    phi,
    theta,
    volumeMl,
    volumeRateMlPerSec: (volumeMl - previousVolume) / DT_SEC,
    avPlaneDescent01,
    avPlaneDescentVelocity01PerSec: (avPlaneDescent01 - previousDescent) / DT_SEC,
  };
}

function prescribedVolume(chamber: AtrialIsolatedBenchChamber, theta: number): number {
  const profile = chamber === "LA"
    ? { min: 25.4, preA: 43.9, max: 64.5 }
    : { min: 36.5, preA: 63.4, max: 80.7 };
  if (theta < 0.45) {
    return smoothInterpolate(profile.min, profile.max, theta / 0.45);
  }
  if (theta < 0.76) {
    return smoothInterpolate(profile.max, profile.preA, (theta - 0.45) / 0.31);
  }
  return smoothInterpolate(profile.preA, profile.min, (theta - 0.76) / 0.24);
}

function prescribedAvPlaneDescent(theta: number): number {
  if (theta < 0.06 || theta >= 0.55) return 0;
  if (theta < 0.30) return smoothInterpolate(0, 1, (theta - 0.06) / 0.24);
  return smoothInterpolate(1, 0, (theta - 0.30) / 0.25);
}

function chamberCtx(chamber: AtrialIsolatedBenchChamber, state: PrescribedState): ChamberCtx {
  const params = defaultParams();
  const inletOpen01 = state.theta >= 0.48 && state.theta < 0.76 ? 1 : 0;
  return {
    HR,
    contractility: params.contractility,
    relaxation: params.relaxation,
    phi: state.phi,
    chamber,
    avDelaySec: params.avDelaySec,
    atrialElectromechanicalDelaySec: params.atrialElectromechanicalDelaySec,
    ventricularElectromechanicalDelaySec: params.ventricularElectromechanicalDelaySec,
    tmaxScale: 1,
    geomScale: 1,
    caReleaseScale: 1,
    pairedVentricleVolumeMl: 0,
    pairedVentricleShortening01: state.avPlaneDescent01,
    pairedVentricleShorteningVelocity01PerSec: state.avPlaneDescentVelocity01PerSec,
    selfChamberVolumeRateMlPerSec: state.volumeRateMlPerSec,
    inletValveOpen01: inletOpen01,
    outletValveOpen01: 1 - inletOpen01,
    side: chamber === "LA" ? "left" : "right",
    systolicGate: state.avPlaneDescent01 > 0 ? 1 : 0,
  };
}

function activeCall(
  chamber: AtrialIsolatedBenchChamber,
  activeModel: ActiveStressChamberModel,
  provider: ModelCoreExperimentalActiveSourceProvider,
  volumeMl: number,
  internal: ChamberInternal,
  chamberCtxValue: ChamberCtx,
  providerState: unknown,
  providerStateVersion: number,
): ModelCoreActiveSourceProviderCall {
  return {
    chamber,
    activeModel,
    volumeMl,
    internal,
    chamberCtx: chamberCtxValue,
    providerState: provider.cloneProviderState ? provider.cloneProviderState(providerState) : providerState,
    providerStateVersion,
  };
}

function debugPressureTerms(
  provider: ModelCoreExperimentalActiveSourceProvider,
  call: ModelCoreActiveSourceProviderCall,
): ChamberPressureTerms {
  if (!provider.debugPressureTerms) {
    throw new Error(`${provider.sourceProviderId} does not expose debugPressureTerms.`);
  }
  return provider.debugPressureTerms(call);
}

function debugActiveStressTerms(
  provider: ModelCoreExperimentalActiveSourceProvider,
  call: ModelCoreActiveSourceProviderCall,
): ActiveStressDebugTerms {
  if (!provider.debugActiveStressTerms) {
    throw new Error(`${provider.sourceProviderId} does not expose debugActiveStressTerms.`);
  }
  return provider.debugActiveStressTerms(call);
}

function sampleFrom(input: {
  readonly state: PrescribedState;
  readonly pressureTerms: ChamberPressureTerms;
  readonly debugTerms: ActiveStressDebugTerms;
  readonly geometry: ChamberGeometryTerms;
  readonly passivePressure: number;
  readonly activePressure: number;
  readonly avPlanePressureDeltaMmHg: number;
}): AtrialIsolatedBenchSample {
  return {
    tSec: round(input.state.tSec),
    theta: round(input.state.theta),
    volumeMl: round(input.state.volumeMl),
    volumeRateMlPerSec: round(input.state.volumeRateMlPerSec),
    avPlaneDescent01: round(input.geometry.avPlaneDescent01),
    avPlaneDescentVelocity01PerSec: round(input.geometry.avPlaneDescentVelocity01PerSec),
    pressureMmHg: round(input.pressureTerms.pressureMmHg),
    pressureUnclampedMmHg: round(input.pressureTerms.pressureUnclampedMmHg),
    passivePressureMmHg: round(input.passivePressure),
    activePressureMmHg: round(input.activePressure),
    avPlanePressureDeltaMmHg: round(input.avPlanePressureDeltaMmHg),
    sourceActiveFiberStressPa: round(input.pressureTerms.sigmaAct),
    freeCalciumUM: round(input.debugTerms.c),
    wallVolumeMl: round(input.geometry.wallVolumeMl),
    wallVolumeWithoutAvPlaneMl: round(input.geometry.wallVolumeWithoutAvPlaneMl),
    effectiveVolumeCorrectionMl: round(input.geometry.effectiveVolumeCorrectionMl),
    effectiveVolumeCorrectionVelocityMlPerSec: round(input.geometry.effectiveVolumeCorrectionVelocityMlPerSec),
    wallLambda: round(input.geometry.lambda),
    wallLambdaWithoutAvPlane: round(input.geometry.lambdaWithoutAvPlane),
    wallLambdaAvPlaneDelta: round(input.geometry.lambdaAvPlaneDelta),
    wallEngineeringStrain: round(input.geometry.wallEngineeringStrain),
    wallEngineeringStrainWithoutAvPlane: round(input.geometry.wallEngineeringStrainWithoutAvPlane),
    wallEngineeringStrainAvPlaneDelta: round(input.geometry.wallEngineeringStrainAvPlaneDelta),
  };
}

function summarize(
  chamber: AtrialIsolatedBenchChamber,
  variant: AtrialIsolatedBenchVariant,
  provider: ModelCoreExperimentalActiveSourceProvider,
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
  samples: readonly AtrialIsolatedBenchSample[],
): AtrialIsolatedBenchSummary {
  const strain = strainSummary(samples);
  const loop = loopArea(samples);
  return {
    chamber,
    variant,
    sourceCandidateId: LANDATRIAL_RUNTIME_SELECTED_CONFIGURATION_ID,
    sampleCount: samples.length,
    measuredBeatCount: MEASURE_BEATS,
    providerId: provider.sourceProviderId,
    pressureMmHg: range(samples.map((sample) => sample.pressureMmHg)),
    passivePressureMmHg: range(samples.map((sample) => sample.passivePressureMmHg)),
    activePressureMmHg: range(samples.map((sample) => sample.activePressureMmHg)),
    avPlanePressureDeltaMmHg: range(samples.map((sample) => sample.avPlanePressureDeltaMmHg)),
    sourceActiveFiberStressPa: range(samples.map((sample) => sample.sourceActiveFiberStressPa)),
    freeCalciumUM: range(samples.map((sample) => sample.freeCalciumUM)),
    wallLambda: range(samples.map((sample) => sample.wallLambda)),
    wallLambdaWithoutAvPlane: range(samples.map((sample) => sample.wallLambdaWithoutAvPlane)),
    wallLambdaAvPlaneDelta: range(samples.map((sample) => sample.wallLambdaAvPlaneDelta)),
    effectiveVolumeCorrectionMl: range(samples.map((sample) => sample.effectiveVolumeCorrectionMl)),
    effectiveVolumeCorrectionVelocityMlPerSec: range(samples.map((sample) =>
      sample.effectiveVolumeCorrectionVelocityMlPerSec)),
    reservoirStrain: strain.reservoir,
    conduitStrain: strain.conduit,
    contractileStrain: strain.contractile,
    loopSignedAreaMmHgMl: loop.signed,
    loopAbsAreaMmHgMl: loop.abs,
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    maxSolverResidualNorm: round(instrumentation.maxSolverResidualNorm),
  };
}

function strainSummary(samples: readonly AtrialIsolatedBenchSample[]): {
  readonly reservoir: number | null;
  readonly conduit: number | null;
  readonly contractile: number | null;
} {
  if (samples.length === 0) return { reservoir: null, conduit: null, contractile: null };
  const lambdaMin = Math.min(...samples.map((sample) => sample.wallLambda));
  const lambdaMax = Math.max(...samples.map((sample) => sample.wallLambda));
  const preA = nearestTheta(samples, 0.76)?.wallLambda ?? null;
  if (preA == null || lambdaMin <= 0) return { reservoir: null, conduit: null, contractile: null };
  return {
    reservoir: round((lambdaMax - lambdaMin) / lambdaMin),
    conduit: round((lambdaMax - preA) / lambdaMin),
    contractile: round((preA - lambdaMin) / lambdaMin),
  };
}

function loopArea(samples: readonly AtrialIsolatedBenchSample[]): { readonly signed: number | null; readonly abs: number | null } {
  if (samples.length < 3) return { signed: null, abs: null };
  let signed = 0;
  let abs = 0;
  for (let i = 0; i < samples.length - 1; i++) {
    const current = samples[i];
    const next = samples[i + 1];
    const term = current.volumeMl * next.pressureMmHg - next.volumeMl * current.pressureMmHg;
    signed += term;
    abs += Math.abs(term);
  }
  return { signed: round(0.5 * signed), abs: round(0.5 * abs) };
}

function sensitivity(
  chamber: AtrialIsolatedBenchChamber,
  summaries: readonly AtrialIsolatedBenchSummary[],
): AtrialIsolatedBenchSensitivity {
  const on = summaries.find((summary) => summary.chamber === chamber && summary.variant === "landatrial-floor-avplane-on");
  const off = summaries.find((summary) => summary.chamber === chamber && summary.variant === "landatrial-floor-avplane-off");
  if (!on || !off) throw new Error(`Missing ${chamber} AV-plane sensitivity pair.`);
  return {
    deltaReservoirStrainOnMinusOff: delta(on.reservoirStrain, off.reservoirStrain),
    deltaLoopAbsAreaOnMinusOffMmHgMl: delta(on.loopAbsAreaMmHgMl, off.loopAbsAreaMmHgMl),
    minAvPlanePressureDeltaMmHg: on.avPlanePressureDeltaMmHg.min,
    maxEffectiveVolumeCorrectionMl: on.effectiveVolumeCorrectionMl.max,
  };
}

function instrumentationFor(
  chamber: AtrialIsolatedBenchChamber,
  instrumentation: LandAtrialRuntimeInstrumentation,
): ModelCoreLand2017LvSourceProviderInstrumentation {
  return chamber === "LA" ? instrumentation.LA : instrumentation.RA;
}

function splitPassivePressure(terms: ChamberPressureTerms): number {
  const sigmaTotal = terms.sigmaPas + terms.sigmaAct;
  return Math.abs(sigmaTotal) > 1e-12
    ? terms.pressureUnclampedMmHg * terms.sigmaPas / sigmaTotal
    : 0;
}

function nearestTheta(samples: readonly AtrialIsolatedBenchSample[], targetTheta: number): AtrialIsolatedBenchSample | null {
  return samples
    .slice()
    .sort((left, right) => thetaDistance(left.theta, targetTheta) - thetaDistance(right.theta, targetTheta))[0]
    ?? null;
}

function range(values: readonly number[]): RangeCompact {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return { min: null, max: null };
  return { min: round(Math.min(...finite)), max: round(Math.max(...finite)) };
}

function delta(left: number | null, right: number | null): number | null {
  return left == null || right == null ? null : round(left - right);
}

function smoothInterpolate(from: number, to: number, rawX: number): number {
  const x = clamp(rawX, 0, 1);
  const s = x * x * (3 - 2 * x);
  return from + (to - from) * s;
}

function thetaDistance(theta: number, targetTheta: number): number {
  const distance = Math.abs(frac(theta) - targetTheta);
  return Math.min(distance, 1 - distance);
}

function beatPeriodSec(): number {
  return 60 / HR;
}

function frac(value: number): number {
  return value - Math.floor(value);
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}
