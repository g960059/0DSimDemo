import {
  solveLand2017BackwardEulerSubsteps,
  type Land2017EquationParameters,
  type Land2017StepSolveResult,
  type Land2017SubstepSolveOptions,
  type LandSourceOutput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";

export const SERIES_ELASTIC_FIBER_ADAPTER_V1_ID = "series-elastic-fiber-adapter-v1" as const;

export type SeriesElasticFiberParameters = {
  readonly seriesStiffnessPa: number;
  readonly seriesDampingPaSec: number;
  readonly referenceLambdaSe: number;
  readonly maxLambdaSeAbs: number;
  readonly maxForceBalanceIterations: number;
  readonly forceBalanceTolerancePa: number;
  readonly landSolveOptions: Land2017SubstepSolveOptions;
};

export type SeriesElasticFiberState = {
  readonly landState: Float64Array;
  readonly lambdaSi: number;
  readonly lambdaSe: number;
  readonly sigmaCePa: number;
  readonly sigmaSePa: number;
  readonly elasticEnergyJm3: number;
};

export type SeriesElasticFiberStepInput = {
  readonly freeCalciumUM: number;
  readonly previousFreeCalciumUM: number;
  readonly previousLambdaTotal: number;
  readonly stageLambdaTotal: number;
  readonly dtSec: number;
};

export type SeriesElasticFiberStepResult = {
  readonly ok: boolean;
  readonly nextState: SeriesElasticFiberState;
  readonly landOutput?: LandSourceOutput;
  readonly lambdaTotal: number;
  readonly lambdaTotalDotPerSec: number;
  readonly lambdaSi: number;
  readonly lambdaSiDotPerSec: number;
  readonly lambdaSe: number;
  readonly lambdaSeDotPerSec: number;
  readonly sigmaCePa: number;
  readonly sigmaSePa: number;
  readonly sigmaMismatchPa: number;
  readonly elasticEnergyJm3: number;
  readonly elasticEnergyDeltaJm3: number;
  readonly sePowerDensityWPerM3: number;
  readonly cePowerDensityWPerM3: number;
  readonly seDissipationDensityWPerM3: number;
  readonly solverIterations: number;
  readonly forceBalanceIterations: number;
  readonly forceBalanceConverged: boolean;
  readonly landSolveOk: boolean;
  readonly failureReason?: string;
  readonly failureMessage?: string;
};

type CandidateEvaluation = {
  readonly ok: boolean;
  readonly lambdaSi: number;
  readonly lambdaSiDotPerSec: number;
  readonly lambdaSe: number;
  readonly lambdaSeDotPerSec: number;
  readonly sigmaCePa: number;
  readonly sigmaSePa: number;
  readonly sigmaMismatchPa: number;
  readonly landSolve: Land2017StepSolveResult;
};

const DEFAULT_LAND_SOLVE_OPTIONS: Land2017SubstepSolveOptions = {
  maxIterations: 12,
  residualTolerance: 1e-8,
  lineSearchMinStep: 1 / 2048,
  substeps: 2,
};

export const DEFAULT_SERIES_ELASTIC_FIBER_PARAMETERS: SeriesElasticFiberParameters = {
  seriesStiffnessPa: 800_000,
  seriesDampingPaSec: 0,
  referenceLambdaSe: 0,
  maxLambdaSeAbs: 0.08,
  maxForceBalanceIterations: 12,
  forceBalanceTolerancePa: 250,
  landSolveOptions: DEFAULT_LAND_SOLVE_OPTIONS,
};

export function initialSeriesElasticFiberState(
  initialLandState: ArrayLike<number>,
  initialLambdaTotal: number,
): SeriesElasticFiberState {
  return {
    landState: Float64Array.from(initialLandState),
    lambdaSi: initialLambdaTotal,
    lambdaSe: 0,
    sigmaCePa: 0,
    sigmaSePa: 0,
    elasticEnergyJm3: 0,
  };
}

export function stepLandWithoutSeriesElastic(
  previousLandState: ArrayLike<number>,
  input: SeriesElasticFiberStepInput,
  options: Land2017SubstepSolveOptions = DEFAULT_LAND_SOLVE_OPTIONS,
  parameterSet?: Land2017EquationParameters,
  stageZetaDriveFiberEngineeringStrainRatePerSec?: number,
): Land2017StepSolveResult {
  const landInput: LandStepInput = {
    freeCalciumUM: input.freeCalciumUM,
    previousFiberEngineeringStrain: input.previousLambdaTotal - 1,
    stageFiberEngineeringStrain: input.stageLambdaTotal - 1,
    ...(stageZetaDriveFiberEngineeringStrainRatePerSec !== undefined
      ? { stageZetaDriveFiberEngineeringStrainRatePerSec }
      : {}),
    dtSec: input.dtSec,
    stage: { scheme: "BE", stageIndex: 0 },
  };
  return solveLand2017BackwardEulerSubsteps(
    previousLandState,
    landInput,
    { ...options, previousFreeCalciumUM: input.previousFreeCalciumUM },
    parameterSet,
  );
}

export function stepSeriesElasticLandFiberV1(
  previous: SeriesElasticFiberState,
  input: SeriesElasticFiberStepInput,
  parameters: SeriesElasticFiberParameters = DEFAULT_SERIES_ELASTIC_FIBER_PARAMETERS,
  parameterSet?: Land2017EquationParameters,
): SeriesElasticFiberStepResult {
  const lambdaTotalDotPerSec = (input.stageLambdaTotal - input.previousLambdaTotal) / input.dtSec;
  const lower = Math.max(
    0.55,
    input.stageLambdaTotal - parameters.maxLambdaSeAbs,
    previous.lambdaSi - 0.08,
  );
  const upper = Math.min(
    1.35,
    input.stageLambdaTotal + parameters.maxLambdaSeAbs,
    previous.lambdaSi + 0.08,
  );

  let left = evaluateCandidate(previous, input, parameters, lower, parameterSet);
  let right = evaluateCandidate(previous, input, parameters, upper, parameterSet);
  const evaluated: CandidateEvaluation[] = [];
  if (left.ok) evaluated.push(left);
  if (right.ok) evaluated.push(right);

  let best = bestCandidate(evaluated);
  let forceBalanceConverged = best ? Math.abs(best.sigmaMismatchPa) <= parameters.forceBalanceTolerancePa : false;
  let forceBalanceIterations = evaluated.length;

  if (left.ok && right.ok && Math.sign(left.sigmaMismatchPa) !== Math.sign(right.sigmaMismatchPa)) {
    for (let iteration = 0; iteration < parameters.maxForceBalanceIterations; iteration += 1) {
      const mid = 0.5 * (left.lambdaSi + right.lambdaSi);
      const candidate = evaluateCandidate(previous, input, parameters, mid, parameterSet);
      forceBalanceIterations += 1;
      if (!candidate.ok) break;
      evaluated.push(candidate);
      best = bestCandidate(evaluated);
      if (Math.abs(candidate.sigmaMismatchPa) <= parameters.forceBalanceTolerancePa) {
        best = candidate;
        forceBalanceConverged = true;
        break;
      }
      if (Math.sign(candidate.sigmaMismatchPa) === Math.sign(left.sigmaMismatchPa)) {
        left = candidate;
      } else {
        right = candidate;
      }
    }
  } else {
    for (let iteration = 0; iteration < parameters.maxForceBalanceIterations; iteration += 1) {
      const current = best ?? left;
      const denominator = Math.max(1, parameters.seriesStiffnessPa + parameters.seriesDampingPaSec / input.dtSec);
      const correction = clamp(
        current.sigmaMismatchPa / denominator,
        -0.012,
        0.012,
      );
      const nextLambdaSi = clamp(current.lambdaSi - correction, lower, upper);
      const candidate = evaluateCandidate(previous, input, parameters, nextLambdaSi, parameterSet);
      forceBalanceIterations += 1;
      if (!candidate.ok) break;
      evaluated.push(candidate);
      best = bestCandidate(evaluated);
      if (Math.abs(candidate.sigmaMismatchPa) <= parameters.forceBalanceTolerancePa) {
        best = candidate;
        forceBalanceConverged = true;
        break;
      }
    }
  }

  if (!best?.ok || !best.landSolve.output) {
    const failedSolve = best?.landSolve ?? left.landSolve;
    return failed(previous, input, failedSolve, lambdaTotalDotPerSec, forceBalanceIterations);
  }

  const elasticEnergyJm3 = seriesElasticEnergy(best.lambdaSe, parameters);
  const elasticEnergyDeltaJm3 = elasticEnergyJm3 - previous.elasticEnergyJm3;
  const seDissipationDensityWPerM3 =
    parameters.seriesDampingPaSec * best.lambdaSeDotPerSec * best.lambdaSeDotPerSec;
  const nextState: SeriesElasticFiberState = {
    landState: best.landSolve.nextState,
    lambdaSi: best.lambdaSi,
    lambdaSe: best.lambdaSe,
    sigmaCePa: best.sigmaCePa,
    sigmaSePa: best.sigmaSePa,
    elasticEnergyJm3,
  };

  return {
    ok: true,
    nextState,
    landOutput: best.landSolve.output,
    lambdaTotal: input.stageLambdaTotal,
    lambdaTotalDotPerSec,
    lambdaSi: best.lambdaSi,
    lambdaSiDotPerSec: best.lambdaSiDotPerSec,
    lambdaSe: best.lambdaSe,
    lambdaSeDotPerSec: best.lambdaSeDotPerSec,
    sigmaCePa: best.sigmaCePa,
    sigmaSePa: best.sigmaSePa,
    sigmaMismatchPa: best.sigmaMismatchPa,
    elasticEnergyJm3,
    elasticEnergyDeltaJm3,
    sePowerDensityWPerM3: best.sigmaSePa * best.lambdaSeDotPerSec,
    cePowerDensityWPerM3: best.sigmaCePa * best.lambdaSiDotPerSec,
    seDissipationDensityWPerM3,
    solverIterations: best.landSolve.iterations,
    forceBalanceIterations,
    forceBalanceConverged,
    landSolveOk: best.landSolve.ok,
  };
}

function evaluateCandidate(
  previous: SeriesElasticFiberState,
  input: SeriesElasticFiberStepInput,
  parameters: SeriesElasticFiberParameters,
  lambdaSi: number,
  parameterSet?: Land2017EquationParameters,
): CandidateEvaluation {
  const lambdaSiDotPerSec = (lambdaSi - previous.lambdaSi) / input.dtSec;
  const lambdaTotalDotPerSec = (input.stageLambdaTotal - input.previousLambdaTotal) / input.dtSec;
  const lambdaSe = input.stageLambdaTotal - lambdaSi;
  const lambdaSeDotPerSec = lambdaTotalDotPerSec - lambdaSiDotPerSec;
  const landInput: LandStepInput = {
    freeCalciumUM: input.freeCalciumUM,
    previousFiberEngineeringStrain: previous.lambdaSi - 1,
    stageFiberEngineeringStrain: lambdaSi - 1,
    stageZetaDriveFiberEngineeringStrainRatePerSec: lambdaSiDotPerSec,
    dtSec: input.dtSec,
    stage: { scheme: "BE", stageIndex: 0 },
  };
  const landSolve = solveLand2017BackwardEulerSubsteps(
    previous.landState,
    landInput,
    { ...parameters.landSolveOptions, previousFreeCalciumUM: input.previousFreeCalciumUM },
    parameterSet,
  );
  const sigmaCePa = landSolve.output?.sourceActiveFiberStressPa ?? Number.NaN;
  const sigmaSePa =
    parameters.seriesStiffnessPa * (lambdaSe - parameters.referenceLambdaSe)
    + parameters.seriesDampingPaSec * lambdaSeDotPerSec;
  return {
    ok: landSolve.ok && !!landSolve.output && Number.isFinite(sigmaCePa) && Number.isFinite(sigmaSePa),
    lambdaSi,
    lambdaSiDotPerSec,
    lambdaSe,
    lambdaSeDotPerSec,
    sigmaCePa,
    sigmaSePa,
    sigmaMismatchPa: sigmaCePa - sigmaSePa,
    landSolve,
  };
}

function bestCandidate(candidates: readonly CandidateEvaluation[]): CandidateEvaluation | null {
  let best: CandidateEvaluation | null = null;
  for (const candidate of candidates) {
    if (!candidate.ok) continue;
    if (!best || Math.abs(candidate.sigmaMismatchPa) < Math.abs(best.sigmaMismatchPa)) {
      best = candidate;
    }
  }
  return best;
}

function failed(
  previous: SeriesElasticFiberState,
  input: SeriesElasticFiberStepInput,
  landSolve: Land2017StepSolveResult,
  lambdaTotalDotPerSec: number,
  forceBalanceIterations: number,
): SeriesElasticFiberStepResult {
  return {
    ok: false,
    nextState: previous,
    lambdaTotal: input.stageLambdaTotal,
    lambdaTotalDotPerSec,
    lambdaSi: previous.lambdaSi,
    lambdaSiDotPerSec: 0,
    lambdaSe: previous.lambdaSe,
    lambdaSeDotPerSec: 0,
    sigmaCePa: previous.sigmaCePa,
    sigmaSePa: previous.sigmaSePa,
    sigmaMismatchPa: previous.sigmaCePa - previous.sigmaSePa,
    elasticEnergyJm3: previous.elasticEnergyJm3,
    elasticEnergyDeltaJm3: 0,
    sePowerDensityWPerM3: 0,
    cePowerDensityWPerM3: 0,
    seDissipationDensityWPerM3: 0,
    solverIterations: landSolve.iterations,
    forceBalanceIterations,
    forceBalanceConverged: false,
    landSolveOk: landSolve.ok,
    failureReason: landSolve.failureReason ?? "series-elastic-force-balance",
    failureMessage: landSolve.failureMessage,
  };
}

function seriesElasticEnergy(lambdaSe: number, parameters: SeriesElasticFiberParameters): number {
  const displacement = lambdaSe - parameters.referenceLambdaSe;
  return 0.5 * parameters.seriesStiffnessPa * displacement * displacement;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
