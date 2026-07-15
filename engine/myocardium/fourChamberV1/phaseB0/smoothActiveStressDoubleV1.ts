import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B0_SMOOTH_ACTIVE_STRESS_DOUBLE_V1_ID =
  "four-chamber-phase-b0-smooth-periodic-active-stress-double-v1" as const;

export type PhaseB0SmoothActiveStressWallParametersV1 = Readonly<{
  baselineStressPa: number;
  pulseAmplitudePa: number;
  peakPhaseFraction: number;
}>;

export type PhaseB0SmoothActiveStressDoubleParametersV1 = Readonly<{
  parameterSetId: string;
  evidenceClass: "project-synthetic-test-only";
  periodSec: number;
  walls: Readonly<Record<FourChamberWallId, PhaseB0SmoothActiveStressWallParametersV1>>;
  testOnly: true;
  releaseRuntimeReachable: false;
}>;

export type PhaseB0SmoothActiveStressWallEvaluationV1 = Readonly<{
  wallId: FourChamberWallId;
  scalarKirchhoffFiberStressPa: number;
  scalarKirchhoffFiberStressTimeDerivativePaPerSec: number;
  phaseFromPeakFraction: number;
  normalizedPulse: number;
}>;

export type PhaseB0SmoothActiveStressDoubleEvaluationV1 = Readonly<{
  modelId: typeof PHASE_B0_SMOOTH_ACTIVE_STRESS_DOUBLE_V1_ID;
  parameterSetId: string;
  evidenceClass: "project-synthetic-test-only";
  regularity: "C-infinity-periodic";
  stressMeasure: "scalar-kirchhoff-fiber-stress";
  testOnly: true;
  releaseRuntimeReachable: false;
  timeSec: number;
  periodSec: number;
  walls: Readonly<Record<FourChamberWallId, PhaseB0SmoothActiveStressWallEvaluationV1>>;
  stressClampApplied: false;
  fallbackApplied: false;
  units: Readonly<{
    time: "s";
    stress: "Pa";
    stressTimeDerivative: "Pa/s";
    phase: "1";
  }>;
}>;

/**
 * Synthetic C-infinity waveform used only to exercise Phase B0 mechanics:
 * tau(t) = tau_0 + A[1 + cos(2*pi*(t/T - phi_peak))]/2.
 */
export function evaluatePhaseB0SmoothActiveStressDoubleV1(
  timeSec: number,
  parameters: PhaseB0SmoothActiveStressDoubleParametersV1,
): PhaseB0SmoothActiveStressDoubleEvaluationV1 {
  validateSmoothActiveStressParametersV1(parameters);
  const time = requireNonNegativeFinite(timeSec, "timeSec");
  const periodSec = parameters.periodSec;
  const wallEntries = WALL_IDS.map((wallId) => {
    const wall = parameters.walls[wallId];
    const unwrappedPhaseFromPeak = time / periodSec - wall.peakPhaseFraction;
    const phaseFromPeakFraction = wrapUnitInterval(unwrappedPhaseFromPeak);
    const angle = 2 * Math.PI * phaseFromPeakFraction;
    const normalizedPulse = 0.5 * (1 + Math.cos(angle));
    const scalarKirchhoffFiberStressPa = wall.baselineStressPa
      + wall.pulseAmplitudePa * normalizedPulse;
    const scalarKirchhoffFiberStressTimeDerivativePaPerSec = -wall.pulseAmplitudePa
      * Math.PI / periodSec
      * Math.sin(angle);
    [
      phaseFromPeakFraction,
      normalizedPulse,
      scalarKirchhoffFiberStressPa,
      scalarKirchhoffFiberStressTimeDerivativePaPerSec,
    ].forEach((value, index) => requireFinite(value, `${wallId}.derived[${index}]`));
    if (scalarKirchhoffFiberStressPa < 0 || normalizedPulse < 0 || normalizedPulse > 1) {
      throw new Error(`${wallId} synthetic active stress left its declared nonnegative domain`);
    }
    const evaluation: PhaseB0SmoothActiveStressWallEvaluationV1 = Object.freeze({
      wallId,
      scalarKirchhoffFiberStressPa,
      scalarKirchhoffFiberStressTimeDerivativePaPerSec,
      phaseFromPeakFraction,
      normalizedPulse,
    });
    return [wallId, evaluation] as const;
  });

  return Object.freeze({
    modelId: PHASE_B0_SMOOTH_ACTIVE_STRESS_DOUBLE_V1_ID,
    parameterSetId: parameters.parameterSetId,
    evidenceClass: "project-synthetic-test-only",
    regularity: "C-infinity-periodic",
    stressMeasure: "scalar-kirchhoff-fiber-stress",
    testOnly: true,
    releaseRuntimeReachable: false,
    timeSec: time,
    periodSec,
    walls: Object.freeze(Object.fromEntries(wallEntries)) as Readonly<
      Record<FourChamberWallId, PhaseB0SmoothActiveStressWallEvaluationV1>
    >,
    stressClampApplied: false,
    fallbackApplied: false,
    units: Object.freeze({
      time: "s",
      stress: "Pa",
      stressTimeDerivative: "Pa/s",
      phase: "1",
    }),
  });
}

export function validatePhaseB0SmoothActiveStressDoubleParametersV1(
  parameters: PhaseB0SmoothActiveStressDoubleParametersV1,
): PhaseB0SmoothActiveStressDoubleParametersV1 {
  validateSmoothActiveStressParametersV1(parameters);
  return parameters;
}

function validateSmoothActiveStressParametersV1(
  parameters: PhaseB0SmoothActiveStressDoubleParametersV1,
): void {
  assertExactPlainRecordV1(parameters, [
    "parameterSetId",
    "evidenceClass",
    "periodSec",
    "walls",
    "testOnly",
    "releaseRuntimeReachable",
  ], "parameters");
  requireNonEmptyString(parameters.parameterSetId, "parameters.parameterSetId");
  if (parameters.evidenceClass !== "project-synthetic-test-only") {
    throw new Error("parameters.evidenceClass must be project-synthetic-test-only");
  }
  requirePositiveFinite(parameters.periodSec, "parameters.periodSec");
  if (parameters.testOnly !== true || parameters.releaseRuntimeReachable !== false) {
    throw new Error("Smooth active stress double must remain test-only and unreachable from release runtime");
  }
  assertExactPlainRecordV1(parameters.walls, WALL_IDS, "parameters.walls");
  for (const wallId of WALL_IDS) {
    const wall = parameters.walls[wallId];
    assertExactPlainRecordV1(wall, [
      "baselineStressPa",
      "pulseAmplitudePa",
      "peakPhaseFraction",
    ], `parameters.walls.${wallId}`);
    requireNonNegativeFinite(wall.baselineStressPa, `parameters.walls.${wallId}.baselineStressPa`);
    requireNonNegativeFinite(wall.pulseAmplitudePa, `parameters.walls.${wallId}.pulseAmplitudePa`);
    if (
      !Number.isFinite(wall.peakPhaseFraction)
      || wall.peakPhaseFraction < 0
      || wall.peakPhaseFraction >= 1
    ) {
      throw new Error(`parameters.walls.${wallId}.peakPhaseFraction must lie in [0, 1)`);
    }
  }
}

function wrapUnitInterval(value: number): number {
  requireFinite(value, "unwrappedPhaseFromPeak");
  const wrapped = value - Math.floor(value);
  return wrapped === 1 ? 0 : wrapped;
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
  return value;
}

function requireNonEmptyString(value: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}
