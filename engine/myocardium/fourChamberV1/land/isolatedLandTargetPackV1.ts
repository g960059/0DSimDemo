import {
  applyExactCalciumDriveEventV1,
  evaluateExactEventCalciumV1,
  propagateExactEventCalciumV1,
  validateExactEventCalciumParametersV1,
  zeroExactEventCalciumStateV1,
  type ExactEventCalciumParametersV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  evaluateLand2017AlgebraicTerms,
  land2017CaTRPNUnblockingFactor,
  writeLand2017Rhs,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import { evaluateLand2017ContinuousOutput } from "@/engine/myocardium/myofilament/land2017/outputs";
import { solveLand2017BackwardEulerStep } from "@/engine/myocardium/myofilament/land2017/solver";
import {
  LAND2017_EQUATIONS_VERSION,
  LAND2017_STATE_INDEX,
} from "@/engine/myocardium/myofilament/land2017/types";

export const ISOLATED_LAND_TARGET_PACK_SCHEMA_V1_ID =
  "isolated-land-source-target-pack-v1" as const;
export const ISOLATED_LAND_TARGET_PACK_GENERATOR_V1_ID =
  "land2017-source-equations-generated-oracle-v1" as const;

export type TissueFamilyV1 = "ventricular-human-37c-v1" | "atrial-human-prior-v1";

export type LandSteadyForceCalciumTargetV1 = {
  readonly lambdaLand: number;
  readonly freeCalciumUM: number;
  readonly steadyState: readonly number[];
  readonly sourceActiveStressPa: number;
  readonly rhsMaxAbsPerSec: number;
};

export type LandBackwardEulerSourceTargetV1 = {
  readonly dtSec: number;
  readonly freeCalciumUM: number;
  readonly lambdaLandPrevious: number;
  readonly lambdaLandNext: number;
  readonly previousState: readonly number[];
  readonly nextState: readonly number[];
  readonly sourceActiveStressPa: number;
  readonly residualNorm: number;
};

export type LandIsolatedTwitchTargetV1 = {
  readonly protocolId: "exact-event-calcium-isometric-be-v1";
  readonly durationSec: number;
  readonly dtSec: number;
  readonly lambdaLand: 1;
  readonly eventStrength: 1;
  readonly baselineStressPa: number;
  readonly peakStressPa: number;
  readonly peakAmplitudePa: number;
  readonly timeToPeakSec: number;
  readonly relaxationTime50Sec: number;
  readonly relaxationTime90Sec: number;
  readonly halfAmplitudeWidthSec: number;
  readonly finalStressPa: number;
  readonly minimumPopulation: number;
  readonly finalState: readonly number[];
};

export type IsolatedLandTargetPackV1 = {
  readonly schemaId: typeof ISOLATED_LAND_TARGET_PACK_SCHEMA_V1_ID;
  readonly packId: string;
  readonly tissueFamilyId: TissueFamilyV1;
  readonly status: "source-regression-oracle-only";
  readonly equationsVersion: typeof LAND2017_EQUATIONS_VERSION;
  readonly generatorId: typeof ISOLATED_LAND_TARGET_PACK_GENERATOR_V1_ID;
  readonly parameterValuesSha256: string;
  readonly calciumParametersSha256: string;
  readonly forceCalciumTargets: readonly LandSteadyForceCalciumTargetV1[];
  readonly backwardEulerTargets: readonly LandBackwardEulerSourceTargetV1[];
  readonly isolatedTwitchTarget: LandIsolatedTwitchTargetV1;
  readonly releaseGate: {
    readonly closedLoopReleaseEligible: false;
    readonly experimentalValidation: "not-claimed";
    readonly missingAcceptanceEvidence: readonly string[];
  };
  readonly hashAlgorithm: "sha256-canonical-json-v1";
  readonly contentSha256: string;
};

export function buildIsolatedLandTargetPackV1(
  tissueFamilyId: TissueFamilyV1,
  parameterSet: Land2017EquationParameters,
  calciumParameters: ExactEventCalciumParametersV1,
  sha256Hex: CanonicalSha256HexProvider,
): IsolatedLandTargetPackV1 {
  const payload = createIsolatedLandTargetPackPayloadV1(
    tissueFamilyId,
    parameterSet,
    calciumParameters,
    sha256Hex,
  );
  const targetPack = deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  assertCanonicalSha256(payload, targetPack.contentSha256, sha256Hex);
  return targetPack;
}

export function validateIsolatedLandTargetPackV1(
  targetPack: IsolatedLandTargetPackV1,
  parameterSet: Land2017EquationParameters,
  calciumParameters: ExactEventCalciumParametersV1,
  sha256Hex: CanonicalSha256HexProvider,
): IsolatedLandTargetPackV1 {
  const { contentSha256, ...payload } = targetPack;
  assertCanonicalSha256(payload, contentSha256, sha256Hex);
  const expected = createIsolatedLandTargetPackPayloadV1(
    targetPack.tissueFamilyId,
    parameterSet,
    calciumParameters,
    sha256Hex,
  );
  if (canonicalizeJson(payload) !== canonicalizeJson(expected)) {
    throw new Error("Isolated Land target pack does not match its normative source-generated payload");
  }
  return targetPack;
}

export function isolatedLandTargetPackHashPayloadV1(
  targetPack: IsolatedLandTargetPackV1,
): Omit<IsolatedLandTargetPackV1, "contentSha256"> {
  const { contentSha256: _contentSha256, ...payload } = targetPack;
  return payload;
}

function createIsolatedLandTargetPackPayloadV1(
  tissueFamilyId: TissueFamilyV1,
  parameterSet: Land2017EquationParameters,
  calciumParameters: ExactEventCalciumParametersV1,
  sha256Hex: CanonicalSha256HexProvider,
): Omit<IsolatedLandTargetPackV1, "contentSha256"> {
  if (tissueFamilyId !== "ventricular-human-37c-v1" && tissueFamilyId !== "atrial-human-prior-v1") {
    throw new Error("Unknown tissue family for isolated Land target pack");
  }
  validateExactEventCalciumParametersV1(calciumParameters);
  const parameterValuesSha256 = computeCanonicalSha256({
    values: parameterSet.values,
    derived: parameterSet.derived,
  }, sha256Hex);
  const calciumParametersSha256 = computeCanonicalSha256(calciumParameters, sha256Hex);
  const forceCalciumTargets = [0.87, 1, 1.2].flatMap((lambdaLand) =>
    [0.2, 0.4, 0.8, 1.2].map((freeCalciumUM) =>
      generateSteadyForceCalciumTarget(lambdaLand, freeCalciumUM, parameterSet)));
  const backwardEulerTargets = [
    generateBackwardEulerTarget(0.0005, 0.65, 0.98, 1.015, parameterSet),
    generateBackwardEulerTarget(0.0005, 1.05, 1.035, 0.995, parameterSet),
  ];
  return {
    schemaId: ISOLATED_LAND_TARGET_PACK_SCHEMA_V1_ID,
    packId: `${tissueFamilyId}:isolated-land-source-target-pack-v1`,
    tissueFamilyId,
    status: "source-regression-oracle-only",
    equationsVersion: LAND2017_EQUATIONS_VERSION,
    generatorId: ISOLATED_LAND_TARGET_PACK_GENERATOR_V1_ID,
    parameterValuesSha256,
    calciumParametersSha256,
    forceCalciumTargets,
    backwardEulerTargets,
    isolatedTwitchTarget: generateIsolatedTwitchTarget(parameterSet, calciumParameters),
    releaseGate: {
      closedLoopReleaseEligible: false,
      experimentalValidation: "not-claimed",
      missingAcceptanceEvidence: [
        "digitized force-calcium and twitch target acceptance",
        "rapid stretch-release and force-velocity target acceptance",
        "one-sided kink tangent and SDIRK2 convergence acceptance",
        "closed-loop physiology and numerical acceptance gates",
      ],
    },
    hashAlgorithm: "sha256-canonical-json-v1",
  };
}

function generateSteadyForceCalciumTarget(
  lambdaLand: number,
  freeCalciumUM: number,
  parameterSet: Land2017EquationParameters,
): LandSteadyForceCalciumTargetV1 {
  const state = initializeLand2017IsometricSteadyStateV1(
    lambdaLand,
    freeCalciumUM,
    parameterSet,
  );
  const input = {
    freeCalciumUM,
    fiberEngineeringStrain: lambdaLand - 1,
    fiberEngineeringStrainRatePerSec: 0,
  };
  const rhs = writeLand2017Rhs(state, input, parameterSet);
  const output = evaluateLand2017ContinuousOutput(state, input, parameterSet);
  if (!output.health.finite) throw new Error("Generated force-calcium target left the Land source domain");
  return {
    lambdaLand,
    freeCalciumUM,
    steadyState: Array.from(state),
    sourceActiveStressPa: output.sourceActiveFiberStressPa,
    rhsMaxAbsPerSec: maxAbs(rhs),
  };
}

/**
 * Strict, deterministic source-coordinate initializer for a Land isometric
 * steady state. It is shared by target-pack generation and geometry-consistent
 * whole-heart warm starts so those paths cannot drift onto separate formulas.
 */
export function initializeLand2017IsometricSteadyStateV1(
  lambdaLand: number,
  freeCalciumUM: number,
  parameterSet: Land2017EquationParameters,
): Float64Array {
  if (!(lambdaLand > 0) || !Number.isFinite(lambdaLand)) throw new Error("lambdaLand must be positive and finite");
  if (!(freeCalciumUM > 0) || !Number.isFinite(freeCalciumUM)) {
    throw new Error("freeCalciumUM must be positive and finite");
  }
  const p = parameterSet.values;
  const d = parameterSet.derived;
  const empty = Float64Array.from([0.5, 0, 0, 0, 0, 0]);
  const terms = evaluateLand2017AlgebraicTerms(empty, {
    fiberEngineeringStrain: lambdaLand - 1,
  }, parameterSet);
  const caDrive = Math.pow(freeCalciumUM / terms.CaT50, p.nTRPN);
  const CaTRPN = caDrive / (1 + caDrive);
  const bCoefficient = d.kb * land2017CaTRPNUnblockingFactor(CaTRPN, p)
    / (p.ku * Math.pow(CaTRPN, p.nTm / 2));
  const wCoefficient = p.kuw / (d.kwu + p.kws);
  const sCoefficient = p.kws * wCoefficient / d.ksu;
  const U = 1 / (1 + bCoefficient + wCoefficient + sCoefficient);
  const state = Float64Array.from([
    CaTRPN,
    bCoefficient * U,
    wCoefficient * U,
    sCoefficient * U,
    0,
    0,
  ]);
  if (!Array.from(state).every(Number.isFinite)) {
    throw new Error("Generated Land steady state must be finite");
  }
  if (!(minimumPopulation(state) > 0)) {
    throw new Error(
      "Generated Land steady state must be strictly inside the population simplex",
    );
  }
  const rhs = writeLand2017Rhs(state, {
    freeCalciumUM,
    fiberEngineeringStrain: lambdaLand - 1,
    fiberEngineeringStrainRatePerSec: 0,
    zetaDriveFiberEngineeringStrainRatePerSec: 0,
  }, parameterSet);
  if (maxAbs(rhs) > 1e-9) {
    throw new Error("Generated Land isometric state failed its steady-state residual");
  }
  return state;
}

function generateBackwardEulerTarget(
  dtSec: number,
  freeCalciumUM: number,
  lambdaLandPrevious: number,
  lambdaLandNext: number,
  parameterSet: Land2017EquationParameters,
): LandBackwardEulerSourceTargetV1 {
  const previousState = initializeLand2017IsometricSteadyStateV1(
    lambdaLandPrevious,
    0.2,
    parameterSet,
  );
  const input = {
    freeCalciumUM,
    previousFiberEngineeringStrain: lambdaLandPrevious - 1,
    stageFiberEngineeringStrain: lambdaLandNext - 1,
    dtSec,
    stage: { scheme: "BE" as const, stageIndex: 0 as const },
  };
  const result = solveLand2017BackwardEulerStep(previousState, input, {
    maxIterations: 20,
    residualTolerance: 1e-11,
    lineSearchMinStep: 1 / 4096,
  }, parameterSet);
  if (!result.ok || result.output === undefined) {
    throw new Error(`Normative Land source failed to generate BE target: ${result.failureReason ?? "unknown"}`);
  }
  return {
    dtSec,
    freeCalciumUM,
    lambdaLandPrevious,
    lambdaLandNext,
    previousState: Array.from(previousState),
    nextState: Array.from(result.nextState),
    sourceActiveStressPa: result.output.sourceActiveFiberStressPa,
    residualNorm: result.residualNorm,
  };
}

function generateIsolatedTwitchTarget(
  parameterSet: Land2017EquationParameters,
  calciumParameters: ExactEventCalciumParametersV1,
): LandIsolatedTwitchTargetV1 {
  const durationSec = 1.2;
  const dtSec = 0.001;
  const lambdaLand = 1 as const;
  let calciumState = applyExactCalciumDriveEventV1(zeroExactEventCalciumStateV1(), {
    eventId: "isolated-unit-event",
    calciumDriveTimeSec: 0,
    strength: 1,
    timingOwner: "tissue-manifest-electrical-to-calcium-delay",
  });
  let landState = initializeLand2017IsometricSteadyStateV1(
    lambdaLand,
    calciumParameters.calciumDiastolicUM,
    parameterSet,
  );
  const baselineStressPa = sourceStressAt(landState, calciumParameters.calciumDiastolicUM, parameterSet);
  const samples: Array<{ timeSec: number; stressPa: number; minimumPopulation: number }> = [
    { timeSec: 0, stressPa: baselineStressPa, minimumPopulation: minimumPopulation(landState) },
  ];

  const stepCount = Math.round(durationSec / dtSec);
  for (let step = 1; step <= stepCount; step += 1) {
    calciumState = propagateExactEventCalciumV1(calciumState, dtSec, calciumParameters);
    const freeCalciumUM = evaluateExactEventCalciumV1(calciumState, calciumParameters).freeCalciumUM;
    const result = solveLand2017BackwardEulerStep(landState, {
      freeCalciumUM,
      previousFiberEngineeringStrain: 0,
      stageFiberEngineeringStrain: 0,
      dtSec,
      stage: { scheme: "BE", stageIndex: 0 },
    }, {
      maxIterations: 20,
      residualTolerance: 1e-10,
      lineSearchMinStep: 1 / 4096,
    }, parameterSet);
    if (!result.ok || result.output === undefined) {
      throw new Error(`Normative Land source failed isolated twitch at step ${step}: ${result.failureReason ?? "unknown"}`);
    }
    landState = result.nextState;
    samples.push({
      timeSec: step * dtSec,
      stressPa: result.output.sourceActiveFiberStressPa,
      minimumPopulation: result.output.health.minimumPopulation,
    });
  }

  const peakIndex = indexOfMaximum(samples.map((sample) => sample.stressPa));
  const peakStressPa = samples[peakIndex].stressPa;
  const peakAmplitudePa = peakStressPa - baselineStressPa;
  if (!(peakAmplitudePa > 0)) throw new Error("Generated isolated twitch requires a positive stress amplitude");
  const halfLevel = baselineStressPa + 0.5 * peakAmplitudePa;
  const tenPercentLevel = baselineStressPa + 0.1 * peakAmplitudePa;
  const firstHalfIndex = samples.findIndex((sample) => sample.stressPa >= halfLevel);
  const relaxation50Index = firstIndexAtOrBelow(samples, peakIndex, halfLevel);
  const relaxation90Index = firstIndexAtOrBelow(samples, peakIndex, tenPercentLevel);
  if (firstHalfIndex < 0 || relaxation50Index < 0 || relaxation90Index < 0) {
    throw new Error("Generated isolated twitch did not complete relaxation inside its declared duration");
  }
  return {
    protocolId: "exact-event-calcium-isometric-be-v1",
    durationSec,
    dtSec,
    lambdaLand,
    eventStrength: 1,
    baselineStressPa,
    peakStressPa,
    peakAmplitudePa,
    timeToPeakSec: samples[peakIndex].timeSec,
    relaxationTime50Sec: samples[relaxation50Index].timeSec - samples[peakIndex].timeSec,
    relaxationTime90Sec: samples[relaxation90Index].timeSec - samples[peakIndex].timeSec,
    halfAmplitudeWidthSec: samples[relaxation50Index].timeSec - samples[firstHalfIndex].timeSec,
    finalStressPa: samples[samples.length - 1].stressPa,
    minimumPopulation: Math.min(...samples.map((sample) => sample.minimumPopulation)),
    finalState: Array.from(landState),
  };
}

function sourceStressAt(
  state: ArrayLike<number>,
  freeCalciumUM: number,
  parameterSet: Land2017EquationParameters,
): number {
  return evaluateLand2017ContinuousOutput(state, {
    freeCalciumUM,
    fiberEngineeringStrain: 0,
    fiberEngineeringStrainRatePerSec: 0,
  }, parameterSet).sourceActiveFiberStressPa;
}

function minimumPopulation(state: ArrayLike<number>): number {
  const B = state[LAND2017_STATE_INDEX.B];
  const W = state[LAND2017_STATE_INDEX.W];
  const S = state[LAND2017_STATE_INDEX.S];
  return Math.min(
    state[LAND2017_STATE_INDEX.CaTRPN],
    1 - state[LAND2017_STATE_INDEX.CaTRPN],
    B,
    W,
    S,
    1 - B - W - S,
  );
}

function firstIndexAtOrBelow(
  samples: readonly { readonly stressPa: number }[],
  startIndex: number,
  threshold: number,
): number {
  for (let index = startIndex; index < samples.length; index += 1) {
    if (samples[index].stressPa <= threshold) return index;
  }
  return -1;
}

function indexOfMaximum(values: readonly number[]): number {
  let result = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] > values[result]) result = index;
  }
  return result;
}

function maxAbs(values: ArrayLike<number>): number {
  let maximum = 0;
  for (let index = 0; index < values.length; index += 1) {
    maximum = Math.max(maximum, Math.abs(values[index]));
  }
  return maximum;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
