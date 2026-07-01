export type MechanicsFixedPointOptionsV2 = {
  readonly iterations: number;
  readonly relaxation: number;
  readonly residualTolerance: number;
};

export type MechanicsFixedPointIterationV2 = {
  readonly iteration: number;
  readonly residualNorm: number;
};

export type MechanicsFixedPointResultV2<TCandidate, TAccepted> = {
  readonly accepted: TAccepted;
  readonly candidate: TCandidate;
  readonly iterationsUsed: number;
  readonly converged: boolean;
  readonly residualNorm: number;
  readonly iterationLog: readonly MechanicsFixedPointIterationV2[];
};

export function runMechanicsFixedPointTransactionV2<TCandidate, TAccepted>(
  initialCandidate: TCandidate,
  options: MechanicsFixedPointOptionsV2,
  acceptCandidate: (candidate: TCandidate, iteration: number) => TAccepted,
  residualNorm: (candidate: TCandidate, accepted: TAccepted) => number,
  blendCandidate: (candidate: TCandidate, accepted: TAccepted, relaxation: number) => TCandidate,
): MechanicsFixedPointResultV2<TCandidate, TAccepted> {
  const iterations = Math.max(1, Math.floor(options.iterations));
  const relaxation = clamp(options.relaxation, 0, 1);
  const tolerance = Math.max(0, options.residualTolerance);
  let candidate = initialCandidate;
  let accepted = acceptCandidate(candidate, 0);
  let residual = residualNorm(candidate, accepted);
  const iterationLog: MechanicsFixedPointIterationV2[] = [{ iteration: 0, residualNorm: residual }];
  let iterationsUsed = 1;
  for (let iteration = 1; iteration < iterations; iteration++) {
    if (residual <= tolerance) break;
    candidate = blendCandidate(candidate, accepted, relaxation);
    accepted = acceptCandidate(candidate, iteration);
    residual = residualNorm(candidate, accepted);
    iterationLog.push({ iteration, residualNorm: residual });
    iterationsUsed = iteration + 1;
  }
  const converged = residual <= tolerance;
  return { accepted, candidate, iterationsUsed, converged, residualNorm: residual, iterationLog };
}

export function rootMeanSquareResidualV2(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}

export function lerpV2(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
