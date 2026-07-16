import type { Land2017DerivedParameters } from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const LAND_RATE_FREE_DISTORTION_TRANSFORM_V1_ID =
  "land2017-zeta-to-rate-free-xi-v1" as const;

export type LandDistortionPairV1 = {
  readonly w: number;
  readonly s: number;
};

export type LandDistortionEquivalenceParametersV1 = {
  readonly A: LandDistortionPairV1;
  readonly cPerSec: LandDistortionPairV1;
};

export type LandContinuousDistortionEquivalenceV1 = {
  readonly transformId: typeof LAND_RATE_FREE_DISTORTION_TRANSFORM_V1_ID;
  readonly xi: LandDistortionPairV1;
  readonly sourceZetaDotPerSec: LandDistortionPairV1;
  readonly rateFreeXiDotPerSec: LandDistortionPairV1;
  readonly reconstructedZetaDotPerSec: LandDistortionPairV1;
  readonly residualPerSec: LandDistortionPairV1;
};

export type LandBackwardEulerDistortionEquivalenceV1 = {
  readonly transformId: typeof LAND_RATE_FREE_DISTORTION_TRANSFORM_V1_ID;
  readonly sourceZetaNext: LandDistortionPairV1;
  readonly rateFreeXiPrevious: LandDistortionPairV1;
  readonly rateFreeXiNext: LandDistortionPairV1;
  readonly reconstructedZetaNext: LandDistortionPairV1;
  readonly sourceResidual: LandDistortionPairV1;
  readonly rateFreeResidual: LandDistortionPairV1;
  readonly reconstructionResidual: LandDistortionPairV1;
};

export function landDistortionEquivalenceParametersV1(
  derived: Pick<Land2017DerivedParameters, "Aw" | "As" | "cw" | "cs">,
): Readonly<LandDistortionEquivalenceParametersV1> {
  return deepFreeze({
    A: {
      w: requireNonNegativeFinite(derived.Aw, "derived.Aw"),
      s: requireNonNegativeFinite(derived.As, "derived.As"),
    },
    cPerSec: {
      w: requirePositiveFinite(derived.cw, "derived.cw"),
      s: requirePositiveFinite(derived.cs, "derived.cs"),
    },
  });
}

export function sourceZetaToRateFreeXiV1(
  zeta: LandDistortionPairV1,
  lambdaLand: number,
  parameters: LandDistortionEquivalenceParametersV1,
): Readonly<LandDistortionPairV1> {
  const z = validatePair(zeta, "zeta");
  const lambda = requirePositiveFinite(lambdaLand, "lambdaLand");
  const p = validateParameters(parameters);
  return frozenPair(z.w - p.A.w * lambda, z.s - p.A.s * lambda);
}

export function rateFreeXiToSourceZetaV1(
  xi: LandDistortionPairV1,
  lambdaLand: number,
  parameters: LandDistortionEquivalenceParametersV1,
): Readonly<LandDistortionPairV1> {
  const x = validatePair(xi, "xi");
  const lambda = requirePositiveFinite(lambdaLand, "lambdaLand");
  const p = validateParameters(parameters);
  return frozenPair(x.w + p.A.w * lambda, x.s + p.A.s * lambda);
}

export function evaluateLandContinuousDistortionEquivalenceV1(
  zeta: LandDistortionPairV1,
  lambdaLand: number,
  lambdaLandRatePerSec: number,
  parameters: LandDistortionEquivalenceParametersV1,
): Readonly<LandContinuousDistortionEquivalenceV1> {
  const z = validatePair(zeta, "zeta");
  const lambda = requirePositiveFinite(lambdaLand, "lambdaLand");
  const lambdaDot = requireFinite(lambdaLandRatePerSec, "lambdaLandRatePerSec");
  const p = validateParameters(parameters);
  const xi = sourceZetaToRateFreeXiV1(z, lambda, p);

  const sourceZetaDotPerSec = frozenPair(
    p.A.w * lambdaDot - p.cPerSec.w * z.w,
    p.A.s * lambdaDot - p.cPerSec.s * z.s,
  );
  const rateFreeXiDotPerSec = frozenPair(
    -p.cPerSec.w * (xi.w + p.A.w * lambda),
    -p.cPerSec.s * (xi.s + p.A.s * lambda),
  );
  const reconstructedZetaDotPerSec = frozenPair(
    rateFreeXiDotPerSec.w + p.A.w * lambdaDot,
    rateFreeXiDotPerSec.s + p.A.s * lambdaDot,
  );
  return deepFreeze({
    transformId: LAND_RATE_FREE_DISTORTION_TRANSFORM_V1_ID,
    xi,
    sourceZetaDotPerSec,
    rateFreeXiDotPerSec,
    reconstructedZetaDotPerSec,
    residualPerSec: {
      w: reconstructedZetaDotPerSec.w - sourceZetaDotPerSec.w,
      s: reconstructedZetaDotPerSec.s - sourceZetaDotPerSec.s,
    },
  });
}

/**
 * Backward-Euler source form uses lambdaDot=(lambdaNext-lambdaPrevious)/dt.
 * The returned rate-free step is algebraically identical, not an approximation.
 */
export function evaluateLandBackwardEulerDistortionEquivalenceV1(
  zetaPrevious: LandDistortionPairV1,
  lambdaLandPrevious: number,
  lambdaLandNext: number,
  dtSec: number,
  parameters: LandDistortionEquivalenceParametersV1,
): Readonly<LandBackwardEulerDistortionEquivalenceV1> {
  const previous = validatePair(zetaPrevious, "zetaPrevious");
  const lambdaPrevious = requirePositiveFinite(lambdaLandPrevious, "lambdaLandPrevious");
  const lambdaNext = requirePositiveFinite(lambdaLandNext, "lambdaLandNext");
  const dt = requirePositiveFinite(dtSec, "dtSec");
  const p = validateParameters(parameters);
  const rateFreeXiPrevious = sourceZetaToRateFreeXiV1(previous, lambdaPrevious, p);

  const sourceZetaNext = frozenPair(
    (previous.w + p.A.w * (lambdaNext - lambdaPrevious)) / (1 + dt * p.cPerSec.w),
    (previous.s + p.A.s * (lambdaNext - lambdaPrevious)) / (1 + dt * p.cPerSec.s),
  );
  const rateFreeXiNext = frozenPair(
    (rateFreeXiPrevious.w - dt * p.cPerSec.w * p.A.w * lambdaNext)
      / (1 + dt * p.cPerSec.w),
    (rateFreeXiPrevious.s - dt * p.cPerSec.s * p.A.s * lambdaNext)
      / (1 + dt * p.cPerSec.s),
  );
  const reconstructedZetaNext = rateFreeXiToSourceZetaV1(rateFreeXiNext, lambdaNext, p);
  const lambdaRate = (lambdaNext - lambdaPrevious) / dt;
  const sourceResidual = frozenPair(
    sourceZetaNext.w - previous.w
      - dt * (p.A.w * lambdaRate - p.cPerSec.w * sourceZetaNext.w),
    sourceZetaNext.s - previous.s
      - dt * (p.A.s * lambdaRate - p.cPerSec.s * sourceZetaNext.s),
  );
  const rateFreeResidual = frozenPair(
    rateFreeXiNext.w - rateFreeXiPrevious.w
      + dt * p.cPerSec.w * (rateFreeXiNext.w + p.A.w * lambdaNext),
    rateFreeXiNext.s - rateFreeXiPrevious.s
      + dt * p.cPerSec.s * (rateFreeXiNext.s + p.A.s * lambdaNext),
  );
  return deepFreeze({
    transformId: LAND_RATE_FREE_DISTORTION_TRANSFORM_V1_ID,
    sourceZetaNext,
    rateFreeXiPrevious,
    rateFreeXiNext,
    reconstructedZetaNext,
    sourceResidual,
    rateFreeResidual,
    reconstructionResidual: {
      w: reconstructedZetaNext.w - sourceZetaNext.w,
      s: reconstructedZetaNext.s - sourceZetaNext.s,
    },
  });
}

function validateParameters(
  parameters: LandDistortionEquivalenceParametersV1,
): LandDistortionEquivalenceParametersV1 {
  assertExactKeys(parameters, ["A", "cPerSec"], "parameters");
  const A = validatePair(parameters.A, "parameters.A");
  const cPerSec = validatePair(parameters.cPerSec, "parameters.cPerSec");
  requireNonNegativeFinite(A.w, "parameters.A.w");
  requireNonNegativeFinite(A.s, "parameters.A.s");
  requirePositiveFinite(cPerSec.w, "parameters.cPerSec.w");
  requirePositiveFinite(cPerSec.s, "parameters.cPerSec.s");
  return { A, cPerSec };
}

function validatePair(pair: LandDistortionPairV1, field: string): LandDistortionPairV1 {
  assertExactKeys(pair, ["w", "s"], field);
  return frozenPair(requireFinite(pair.w, `${field}.w`), requireFinite(pair.s, `${field}.s`));
}

function frozenPair(w: number, s: number): Readonly<LandDistortionPairV1> {
  if (!Number.isFinite(w) || !Number.isFinite(s)) throw new Error("Land distortion pair must remain finite");
  return Object.freeze({ w, s });
}

function assertExactKeys(value: object, keys: readonly string[], field: string): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error(`${field} must be a plain object`);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) throw new Error(`${field} must not contain symbol keys`);
  const expected = new Set(keys);
  const actual = ownKeys as string[];
  const unknown = actual.filter((key) => !expected.has(key));
  const missing = keys.filter((key) => !Object.hasOwn(value, key));
  if (unknown.length > 0) throw new Error(`${field} contains unknown fields: ${unknown.join(", ")}`);
  if (missing.length > 0) throw new Error(`${field} is missing fields: ${missing.join(", ")}`);
  for (const key of actual) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
      throw new Error(`${field}.${key} must be an enumerable data property`);
    }
  }
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite <= 0) throw new Error(`${field} must be positive`);
  return finite;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be nonnegative`);
  return finite;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
