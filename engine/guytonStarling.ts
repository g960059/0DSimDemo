import { clamp, smoothMax } from "@/engine/math";
import type {
  CoreRuntimeParams,
  SimMetrics,
  SimObservables,
  SimulationHealthStatus,
} from "@/engine/protocol";

export type GuytonSide = "right" | "left";

export type GuytonCurvePoint = {
  x: number;
  y: number;
  label?: string;
  flags?: string[];
  settled?: boolean;
  status?: SimulationHealthStatus;
  deltaVolumeMl?: number;
};

export type GuytonCurve = {
  id: string;
  label: string;
  source: "instant-linearized" | "waterfall-linearized" | "local-starling-surrogate" | "preload-sweep";
  points: GuytonCurvePoint[];
  stroke: "venous" | "classic" | "starling" | "sweep";
  dashed?: boolean;
};

export type GuytonPaneData = {
  side: GuytonSide;
  title: string;
  xLabel: string;
  yLabel: string;
  operatingPoint: {
    pressure: number;
    flow: number;
  };
  fillingPressure: number;
  fillingPressureLabel: string;
  gradient: number;
  collapsePressure: number;
  venousReturn: GuytonCurve;
  classicVenousReturn: GuytonCurve;
  localStarling: GuytonCurve;
  summary: {
    stressedVolumeMl: number;
    unstressedVolumeMl: number;
    effectiveComplianceMlPerMmHg: number;
    externalPressureWeightedMmHg: number;
    effectiveResistanceMmHgPerLMin: number;
  };
  warnings: string[];
};

export type StarlingSweepCurve = {
  side: GuytonSide;
  points: GuytonCurvePoint[];
  warnings: string[];
};

export type StarlingSweepRequest = {
  requestId: string;
  signature: string;
  instanceId: string;
  params: CoreRuntimeParams;
  targetVolumeMl: number;
  deltasMl?: number[];
};

export type StarlingSweepResponse = {
  requestId: string;
  signature: string;
  instanceId: string;
  right?: StarlingSweepCurve;
  left?: StarlingSweepCurve;
  warnings: string[];
  error?: string;
};

const FLOW_FLOOR_L_MIN = 0.15;
const RESISTANCE_MIN = 0.05;
const RESISTANCE_MAX = 20;

export function buildGuytonPaneData(
  side: GuytonSide,
  metrics: SimMetrics,
  obs: SimObservables,
): GuytonPaneData {
  const isRight = side === "right";
  const pressure = isRight ? metrics.RAPMean : metrics.LAPMean;
  const flow = Math.max(isRight ? metrics.CO_R : metrics.CO_L, 0);
  const fillingPressure = isRight ? obs.PmsfAbs : obs.PmpfAbs;
  const fillingPressureLabel = isRight ? "Pmsf" : "Pmpf";
  const gradient = fillingPressure - pressure;
  const collapsePressure = isRight ? obs.Pth : obs.Palv;
  const resistance = effectiveResistanceMmHgPerLMin(gradient, flow);
  const xRange = pressureRange(side, pressure, fillingPressure, collapsePressure);
  const warnings = paneWarnings(side, gradient, flow, resistance, metrics, obs);

  return {
    side,
    title: isRight ? "Systemic Guyton / RV Starling" : "Pulmonary Guyton / LV Starling",
    xLabel: isRight ? "RAP / CVP (mmHg)" : "LAP / PCWP (mmHg)",
    yLabel: "Flow (L/min)",
    operatingPoint: { pressure, flow },
    fillingPressure,
    fillingPressureLabel,
    gradient,
    collapsePressure,
    venousReturn: {
      id: `${side}-waterfall-vr`,
      label: isRight ? "Waterfall-aware venous return" : "Alveolar waterfall-aware return",
      source: "waterfall-linearized",
      stroke: "venous",
      points: sampleVenousReturnCurve({
        fillingPressure,
        resistanceMmHgPerLMin: resistance,
        collapsePressure,
        xMin: xRange.min,
        xMax: xRange.max,
        waterfall: true,
      }),
    },
    classicVenousReturn: {
      id: `${side}-classic-vr`,
      label: "Classic straight-line estimate",
      source: "instant-linearized",
      stroke: "classic",
      dashed: true,
      points: sampleVenousReturnCurve({
        fillingPressure,
        resistanceMmHgPerLMin: resistance,
        collapsePressure,
        xMin: xRange.min,
        xMax: xRange.max,
        waterfall: false,
      }),
    },
    localStarling: {
      id: `${side}-local-starling`,
      label: "Local Starling-like pump response",
      source: "local-starling-surrogate",
      stroke: "starling",
      dashed: true,
      points: sampleLocalStarlingSurrogate({
        side,
        operatingPressure: pressure,
        operatingFlow: flow,
        xMin: xRange.min,
        xMax: xRange.max,
      }),
    },
    summary: {
      stressedVolumeMl: isRight ? obs.stressedVolumeSystemic : obs.pulmonaryVenousStressedVolume,
      unstressedVolumeMl: isRight ? obs.unstressedVolumeSystemic : obs.pulmonaryVenousUnstressedVolume,
      effectiveComplianceMlPerMmHg: isRight ? obs.systemicComplianceEff : obs.pulmonaryVenousComplianceEff,
      externalPressureWeightedMmHg: isRight ? obs.systemicExternalPressureWeighted : obs.pulmonaryVenousExternalPressureWeighted,
      effectiveResistanceMmHgPerLMin: resistance,
    },
    warnings,
  };
}

export function sampleVenousReturnCurve(args: {
  fillingPressure: number;
  resistanceMmHgPerLMin: number;
  collapsePressure: number;
  xMin: number;
  xMax: number;
  n?: number;
  waterfall: boolean;
}): GuytonCurvePoint[] {
  const n = args.n ?? 120;
  const resistance = clamp(args.resistanceMmHgPerLMin, RESISTANCE_MIN, RESISTANCE_MAX);
  const points: GuytonCurvePoint[] = [];
  for (let i = 0; i < n; i++) {
    const x = args.xMin + (args.xMax - args.xMin) * i / Math.max(n - 1, 1);
    const effectiveDownstream = args.waterfall ? smoothMax(x, args.collapsePressure, 0.25) : x;
    const y = Math.max(0, (args.fillingPressure - effectiveDownstream) / resistance);
    points.push({
      x,
      y,
      flags: args.waterfall && x < args.collapsePressure ? ["waterfall"] : undefined,
    });
  }
  return points;
}

export function sampleLocalStarlingSurrogate(args: {
  side: GuytonSide;
  operatingPressure: number;
  operatingFlow: number;
  xMin: number;
  xMax: number;
  n?: number;
}): GuytonCurvePoint[] {
  const n = args.n ?? 100;
  const floorPressure = args.side === "right" ? -2 : 0;
  const q0 = Math.max(args.operatingFlow, FLOW_FLOOR_L_MIN);
  const qMax = Math.max(q0 + 0.75, q0 * 1.55);
  const preloadAtOp = Math.max(args.operatingPressure - floorPressure, 0.5);
  const opFraction = clamp(q0 / qMax, 0.05, 0.92);
  const tau = clamp(-preloadAtOp / Math.log(1 - opFraction), 1.5, 18);
  const points: GuytonCurvePoint[] = [];

  for (let i = 0; i < n; i++) {
    const x = args.xMin + (args.xMax - args.xMin) * i / Math.max(n - 1, 1);
    const preload = Math.max(x - floorPressure, 0);
    const y = qMax * (1 - Math.exp(-preload / tau));
    points.push({ x, y: Math.max(0, y) });
  }
  return points;
}

export function starlingSweepSignature(
  side: GuytonSide,
  instanceId: string,
  params: CoreRuntimeParams,
  targetVolumeMl: number,
): string {
  const p = params as unknown as Record<string, unknown>;
  const keys = [
    "HR", "contractility", "relaxation", "systemicResistance", "pulmonaryResistance",
    "venousTone", "arterialStiffness", "PEEP", "Pth0", "respAmpTh", "respAmpAlv",
    "heartModel", "lvTmaxScale", "rvTmaxScale", "lvGeomScale", "rvGeomScale",
    "caReleaseScale", "rvCaReleaseScale", "pericardiumEnabled", "pericardialFluidMl",
    "pericardialPressureScaleMmHg", "septalCouplingEnabled", "septalStiffnessScale",
    "MV_Amax", "MV_Aleak", "MV_R", "AoV_Amax", "AoV_Aleak", "AoV_R",
    "TV_Amax", "TV_Aleak", "TV_R", "PV_Amax", "PV_Aleak", "PV_R",
    "nodeOverrides", "edgeOverrides",
  ];
  const picked: Record<string, unknown> = {};
  for (const key of keys) picked[key] = p[key];
  return JSON.stringify({
    side,
    instanceId,
    targetVolumeMl: Math.round(targetVolumeMl),
    params: picked,
  });
}

function effectiveResistanceMmHgPerLMin(gradient: number, flowLMin: number): number {
  if (!(flowLMin > FLOW_FLOOR_L_MIN) || !Number.isFinite(gradient)) return 1;
  return clamp(Math.abs(gradient) / Math.max(flowLMin, FLOW_FLOOR_L_MIN), RESISTANCE_MIN, RESISTANCE_MAX);
}

function pressureRange(
  side: GuytonSide,
  operatingPressure: number,
  fillingPressure: number,
  collapsePressure: number,
): { min: number; max: number } {
  const defaultMin = side === "right" ? -8 : -2;
  const defaultMax = side === "right" ? 22 : 32;
  const min = Math.min(defaultMin, operatingPressure - 8, collapsePressure - 4);
  const max = Math.max(defaultMax, operatingPressure + 10, fillingPressure + 6);
  return { min, max };
}

function paneWarnings(
  side: GuytonSide,
  gradient: number,
  flow: number,
  resistance: number,
  metrics: SimMetrics,
  obs: SimObservables,
): string[] {
  const warnings: string[] = [];
  if (gradient <= 0) warnings.push(side === "right" ? "Pmsf <= RAP" : "Pmpf <= LAP");
  if (flow < 0.5) warnings.push("Low-flow state");
  if (resistance <= RESISTANCE_MIN + 1e-9 || resistance >= RESISTANCE_MAX - 1e-9) warnings.push("Rvr estimate clamped");
  if (Math.abs(metrics.CO_L - metrics.CO_R) > 1.0) warnings.push("Left/right CO mismatch");
  if (Math.abs(obs.tbvErrorMl) > 25) warnings.push("TBV projector active");
  return warnings;
}
