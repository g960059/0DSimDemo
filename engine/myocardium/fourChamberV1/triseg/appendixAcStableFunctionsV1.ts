export const TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1 = Object.freeze({
  policyId: "triseg-appendix-ac-stable-function-policy-v1",
  analyticalAbsoluteArgumentLimit: 1,
  seriesAbsoluteArgumentLimit: 0.125,
  maximumSeriesOrder: 64,
  terminationRule: "abs(term) <= Number.EPSILON * max(abs(partial_sum), Number.MIN_VALUE)",
  overlapAuditArguments: Object.freeze([0.1, 0.11, 0.12, 0.125] as const),
  maximumOverlapRelativeDifference: 5e-13,
  fitAllowed: false,
} as const);

export type TriSegAppendixAcStableFunctionEvaluationV1 = Readonly<{
  value: number;
  branch: "exact-limit" | "even-power-series" | "direct-log1p";
  highestIncludedSeriesOrder: number | null;
  nextTermsAbsoluteRemainderUpperBound: number | null;
}>;

export type TriSegAppendixAcSeriesOverlapAuditV1 = Readonly<{
  policyId: typeof TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1.policyId;
  samples: readonly Readonly<{
    absoluteArgument: number;
    gMinusTwoRelativeDifference: number;
    zTimesGPrimeRelativeDifference: number;
    atanhOverArgumentRelativeDifference: number;
  }>[];
  maximumRelativeDifference: number;
  accepted: boolean;
}>;

/** Appendix-C G(u)-G(0), where G(0)=2, using an even zero-curvature series. */
export function evaluateTriSegAppendixCGMinusTwoV1(argument: number): number {
  return evaluateTriSegAppendixCGMinusTwoWithDiagnosticsV1(argument).value;
}

export function evaluateTriSegAppendixCGMinusTwoWithDiagnosticsV1(
  argument: number,
): TriSegAppendixAcStableFunctionEvaluationV1 {
  const absoluteArgument = assertOpenUnitDomain("G argument", argument);
  if (absoluteArgument === 0) {
    return Object.freeze({
      value: 0,
      branch: "exact-limit",
      highestIncludedSeriesOrder: 0,
      nextTermsAbsoluteRemainderUpperBound: 0,
    });
  }
  if (absoluteArgument <= TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1.seriesAbsoluteArgumentLimit) {
    return evaluateGSeries(absoluteArgument);
  }
  return Object.freeze({
    value: evaluateGDirect(absoluteArgument),
    branch: "direct-log1p",
    highestIncludedSeriesOrder: null,
    nextTermsAbsoluteRemainderUpperBound: null,
  });
}

/** Stable even continuation of Appendix-A4/C7 atanh(z)/z at z=0. */
export function evaluateTriSegAppendixCAtanhOverArgumentV1(argument: number): number {
  return evaluateTriSegAppendixCAtanhOverArgumentWithDiagnosticsV1(argument).value;
}

export function evaluateTriSegAppendixCAtanhOverArgumentWithDiagnosticsV1(
  argument: number,
): TriSegAppendixAcStableFunctionEvaluationV1 {
  const absoluteArgument = assertOpenUnitDomain("atanh argument", argument);
  if (absoluteArgument === 0) {
    return Object.freeze({
      value: 1,
      branch: "exact-limit",
      highestIncludedSeriesOrder: 0,
      nextTermsAbsoluteRemainderUpperBound: 0,
    });
  }
  if (absoluteArgument <= TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1.seriesAbsoluteArgumentLimit) {
    return evaluateAtanhSeries(absoluteArgument);
  }
  return Object.freeze({
    value: evaluateAtanhDirect(absoluteArgument),
    branch: "direct-log1p",
    highestIncludedSeriesOrder: null,
    nextTermsAbsoluteRemainderUpperBound: null,
  });
}

/** Stable even continuation of z*G'(z), used to differentiate C5a independently of A4. */
export function evaluateTriSegAppendixCZTimesGPrimeV1(argument: number): number {
  return evaluateTriSegAppendixCZTimesGPrimeWithDiagnosticsV1(argument).value;
}

export function evaluateTriSegAppendixCZTimesGPrimeWithDiagnosticsV1(
  argument: number,
): TriSegAppendixAcStableFunctionEvaluationV1 {
  const absoluteArgument = assertOpenUnitDomain("z*G'(z) argument", argument);
  if (absoluteArgument === 0) {
    return Object.freeze({
      value: 0,
      branch: "exact-limit",
      highestIncludedSeriesOrder: 0,
      nextTermsAbsoluteRemainderUpperBound: 0,
    });
  }
  if (absoluteArgument <= TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1.seriesAbsoluteArgumentLimit) {
    return evaluateZTimesGPrimeSeries(absoluteArgument);
  }
  return Object.freeze({
    value: evaluateZTimesGPrimeDirect(absoluteArgument),
    branch: "direct-log1p",
    highestIncludedSeriesOrder: null,
    nextTermsAbsoluteRemainderUpperBound: null,
  });
}

export function auditTriSegAppendixAcSeriesOverlapV1(): TriSegAppendixAcSeriesOverlapAuditV1 {
  const samples = TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1.overlapAuditArguments.map(
    (absoluteArgument) => {
      const gSeries = evaluateGSeries(absoluteArgument).value;
      const gDirect = evaluateGDirect(absoluteArgument);
      const zTimesGPrimeSeries = evaluateZTimesGPrimeSeries(absoluteArgument).value;
      const zTimesGPrimeDirect = evaluateZTimesGPrimeDirect(absoluteArgument);
      const atanhSeries = evaluateAtanhSeries(absoluteArgument).value;
      const atanhDirect = evaluateAtanhDirect(absoluteArgument);
      return Object.freeze({
        absoluteArgument,
        gMinusTwoRelativeDifference: relativeDifference(gSeries, gDirect),
        zTimesGPrimeRelativeDifference: relativeDifference(
          zTimesGPrimeSeries,
          zTimesGPrimeDirect,
        ),
        atanhOverArgumentRelativeDifference: relativeDifference(atanhSeries, atanhDirect),
      });
    },
  );
  const maximumRelativeDifference = Math.max(...samples.flatMap((sample) => [
    sample.gMinusTwoRelativeDifference,
    sample.zTimesGPrimeRelativeDifference,
    sample.atanhOverArgumentRelativeDifference,
  ]));
  return Object.freeze({
    policyId: TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1.policyId,
    samples: Object.freeze(samples),
    maximumRelativeDifference,
    accepted: maximumRelativeDifference
      <= TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1.maximumOverlapRelativeDifference,
  });
}

function evaluateZTimesGPrimeSeries(
  absoluteArgument: number,
): TriSegAppendixAcStableFunctionEvaluationV1 {
  const squared = absoluteArgument * absoluteArgument;
  let power = squared;
  let sum = 0;
  let highestIncludedSeriesOrder = 0;
  for (
    let order = 1;
    order <= TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1.maximumSeriesOrder;
    order += 1
  ) {
    const term = -2 * power / (2 * order + 1);
    sum += term;
    highestIncludedSeriesOrder = order;
    if (Math.abs(term) <= Number.EPSILON * Math.max(Math.abs(sum), Number.MIN_VALUE)) break;
    power *= squared;
  }
  const nextOrder = highestIncludedSeriesOrder + 1;
  const remainder = 2 * absoluteArgument ** (2 * nextOrder)
    / ((2 * nextOrder + 1) * (1 - squared));
  assertFinite("z*G'(z) series", sum);
  assertNonNegativeFinite("z*G'(z) series remainder bound", remainder);
  return Object.freeze({
    value: sum,
    branch: "even-power-series",
    highestIncludedSeriesOrder,
    nextTermsAbsoluteRemainderUpperBound: remainder,
  });
}

function evaluateGSeries(absoluteArgument: number): TriSegAppendixAcStableFunctionEvaluationV1 {
  const squared = absoluteArgument * absoluteArgument;
  let power = squared;
  let sum = 0;
  let highestIncludedSeriesOrder = 0;
  for (
    let order = 1;
    order <= TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1.maximumSeriesOrder;
    order += 1
  ) {
    const term = -power / (order * (2 * order + 1));
    sum += term;
    highestIncludedSeriesOrder = order;
    if (Math.abs(term) <= Number.EPSILON * Math.max(Math.abs(sum), Number.MIN_VALUE)) break;
    power *= squared;
  }
  const nextOrder = highestIncludedSeriesOrder + 1;
  const remainder = absoluteArgument ** (2 * nextOrder)
    / (nextOrder * (2 * nextOrder + 1) * (1 - squared));
  assertFinite("G series", sum);
  assertNonNegativeFinite("G series remainder bound", remainder);
  return Object.freeze({
    value: sum,
    branch: "even-power-series",
    highestIncludedSeriesOrder,
    nextTermsAbsoluteRemainderUpperBound: remainder,
  });
}

function evaluateAtanhSeries(absoluteArgument: number): TriSegAppendixAcStableFunctionEvaluationV1 {
  const squared = absoluteArgument * absoluteArgument;
  let power = squared;
  let sum = 1;
  let highestIncludedSeriesOrder = 0;
  for (
    let order = 1;
    order <= TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1.maximumSeriesOrder;
    order += 1
  ) {
    const term = power / (2 * order + 1);
    sum += term;
    highestIncludedSeriesOrder = order;
    if (Math.abs(term) <= Number.EPSILON * Math.abs(sum)) break;
    power *= squared;
  }
  const nextOrder = highestIncludedSeriesOrder + 1;
  const remainder = absoluteArgument ** (2 * nextOrder)
    / ((2 * nextOrder + 1) * (1 - squared));
  assertPositiveFinite("atanh series", sum);
  assertNonNegativeFinite("atanh series remainder bound", remainder);
  return Object.freeze({
    value: sum,
    branch: "even-power-series",
    highestIncludedSeriesOrder,
    nextTermsAbsoluteRemainderUpperBound: remainder,
  });
}

function evaluateGDirect(absoluteArgument: number): number {
  const result = (
    (1 + absoluteArgument) * Math.log1p(absoluteArgument)
    - (1 - absoluteArgument) * Math.log1p(-absoluteArgument)
  ) / absoluteArgument - 2;
  assertFinite("G(argument)-2 direct formula", result);
  return result;
}

function evaluateAtanhDirect(absoluteArgument: number): number {
  const result = 0.5
    * (Math.log1p(absoluteArgument) - Math.log1p(-absoluteArgument))
    / absoluteArgument;
  assertPositiveFinite("atanh(argument)/argument direct formula", result);
  return result;
}

function evaluateZTimesGPrimeDirect(absoluteArgument: number): number {
  const result = Math.log1p(-absoluteArgument * absoluteArgument)
    - evaluateGDirect(absoluteArgument);
  assertFinite("z*G'(z) direct formula", result);
  return result;
}

function assertOpenUnitDomain(label: string, value: number): number {
  const absolute = Math.abs(value);
  if (!Number.isFinite(value) || !(absolute < 1)) {
    throw new Error(`${label} must satisfy abs(value) < 1, got ${value}`);
  }
  return absolute;
}

function relativeDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

function assertFinite(label: string, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite, got ${value}`);
}

function assertPositiveFinite(label: string, value: number): void {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and > 0, got ${value}`);
  }
}

function assertNonNegativeFinite(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and >= 0, got ${value}`);
  }
}
