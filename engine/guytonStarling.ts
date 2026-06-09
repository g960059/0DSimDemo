import { clamp, smoothMax } from "@/engine/math";
import {
  buildVolumeConstrainedGuytonCurve,
  solveFillingPressureAbs,
  solveReturnFlowAtDownstreamPressure,
  structuralLinearGuyton,
  type VascularReturnSnapshot,
} from "@/engine/guytonVascular";
import type {
  CoreRuntimeParams,
  SimMetrics,
  SimObservables,
  SimulationHealthStatus,
} from "@/engine/protocol";

export type GuytonSide = "right" | "left";

export type StarlingSweepPointQuality = "reliable" | "stress" | "invalid";
export type StarlingSweepMode = "calibrated" | "full7" | "custom";

export type GuytonCurvePoint = {
  x: number;
  y: number;
  label?: string;
  flags?: string[];
  settled?: boolean;
  status?: SimulationHealthStatus;
  deltaVolumeMl?: number;
  quality?: StarlingSweepPointQuality;
};

export type GuytonCurve = {
  id: string;
  label: string;
  source: "instant-linearized" | "waterfall-linearized" | "structural-linearized" | "volume-constrained" | "local-starling-surrogate" | "preload-sweep";
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
  returnOperatingPoint: {
    pressure: number;
    flow: number;
  };
  guytonDiagnostics: GuytonDiagnostics;
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

export type GuytonMismatchDiagnostic = {
  pressure: number;
  observedFlow: number;
  guytonFlow: number;
  mismatchLMin: number;
  mismatchFraction: number;
  exceedsThreshold: boolean;
};

export type GuytonDiagnostics = {
  source: "exact-solver" | "curve-interpolation";
  pump: GuytonMismatchDiagnostic;
  return: GuytonMismatchDiagnostic;
};

export type GuytonAxisDomain = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type GuytonLiveOperatingPoint = {
  pressure: number;
  flow: number;
};

export type StarlingSweepCurve = {
  side: GuytonSide;
  points: GuytonCurvePoint[];
  fit?: StarlingSweepFit;
  calibration?: StarlingCalibrationSummary;
  interpretation?: StarlingSweepInterpretation;
  warnings: string[];
};

export type StarlingSweepFit = {
  kind: "monotone-pchip";
  mode?: "measured" | "calibrated";
  points: GuytonCurvePoint[];
  sourcePointCount: number;
  warnings: string[];
  extrapolatedLeft?: GuytonCurvePoint[];
  extrapolatedRight?: GuytonCurvePoint[];
};

export type StarlingCalibrationSummary = {
  mode: StarlingSweepMode | "full7-fallback" | "full7-reference";
  plannedDeltasMl: number[];
  anchorDeltasMl: number[];
  fallbackReasons: string[];
  holdoutMaxFlowErrorLMin?: number;
};

export type StarlingSweepInterpretation = {
  xAxis: "RAP" | "LAP";
  yAxis: "CO";
  sweepVariable: "TBV delta";
  fitBasis: "calibrated anchors" | "measured full7" | "custom anchors" | "full7 fallback";
  anchorDeltasMl: number[];
  measuredRangeMmHg: { min: number; max: number } | null;
  extrapolation: "final-only dashed" | "none";
  zeroFlowConstrained: false;
  zeroFlowConstraintReason: string;
};

export type StarlingSweepRequest = {
  requestId: string;
  signature: string;
  instanceId: string;
  params: CoreRuntimeParams;
  targetVolumeMl: number;
  deltasMl?: number[];
  sweepMode?: StarlingSweepMode;
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

export type GuytonBaseMapTiming = {
  baselineMs: number;
  baseMapMs: number;
  totalMs: number;
  baselineSource: "cold" | "warm-retarget" | "warm-retarget-fallback";
};

export type StarlingSweepTiming = {
  positiveChainMs: number;
  negativeChainMs: number;
  assembleMs: number;
  totalMs: number;
  retargetFallbackCount: number;
  parallel?: boolean;
  parallelFallback?: string;
  chainWallMs?: number;
  plannedPointCount?: number;
  mode?: StarlingSweepMode | "full7-fallback" | "full7-reference";
  anchorCount?: number;
  fallbackReasons?: string[];
  full7ReferenceMs?: number;
  holdoutMaxFlowErrorLMin?: number;
};

export type GuytonStarlingBrowserTiming = {
  workerCreateMs: number;
  baseMapMs: number | null;
  firstProgressMs: number | null;
  firstFitMs: number | null;
  finalSweepMs: number | null;
  totalMs: number;
};

export type GuytonBaseMapResponse = {
  type: "base-map";
  requestId: string;
  signature: string;
  instanceId: string;
  right?: GuytonPaneData;
  left?: GuytonPaneData;
  warnings: string[];
  error?: string;
  timing?: GuytonBaseMapTiming;
};

export type StarlingSweepWorkerMessage = StarlingSweepResponse & {
  type: "starling-sweep";
  timing?: StarlingSweepTiming;
};

export type StarlingSweepProgressMessage = StarlingSweepResponse & {
  type: "starling-sweep-progress";
  completedPoints: number;
  totalPoints: number;
};

export type GuytonStarlingWorkerMessage = GuytonBaseMapResponse | StarlingSweepProgressMessage | StarlingSweepWorkerMessage;

const FLOW_FLOOR_L_MIN = 0.15;
const RESISTANCE_MIN = 0.05;
const RESISTANCE_MAX = 20;
const GUYTON_MISMATCH_FLOW_THRESHOLD_L_MIN = 0.5;
const GUYTON_MISMATCH_FRACTION_THRESHOLD = 0.1;
const DEFAULT_GUYTON_AXIS: Record<GuytonSide, GuytonAxisDomain> = {
  right: { xMin: -5, xMax: 20, yMin: 0, yMax: 10 },
  left: { xMin: 0, xMax: 30, yMin: 0, yMax: 10 },
};
const DISPLAY_X_MIN_FLOOR: Record<GuytonSide, number> = {
  right: -8,
  left: -5,
};
const DISPLAY_X_FOCUS_DEFAULT_MAX: Record<GuytonSide, number> = {
  right: 12,
  left: 14,
};
const DISPLAY_X_FOCUS_HARD_MAX: Record<GuytonSide, number> = {
  right: 18,
  left: 24,
};
const DISPLAY_X_MEASURED_MARGIN = 1;
const DISPLAY_Y_DEFAULT_MAX = 8;

export function buildGuytonPaneData(
  side: GuytonSide,
  metrics: SimMetrics,
  obs: SimObservables,
  vascularSnapshot?: VascularReturnSnapshot,
): GuytonPaneData {
  const isRight = side === "right";
  const pressure = isRight ? metrics.RAPMean : metrics.LAPMean;
  const flow = Math.max(isRight ? metrics.CO_R : metrics.CO_L, 0);
  const returnFlow = Math.max(isRight ? metrics.systemicVenousReturnLMin : metrics.pulmonaryVenousReturnLMin, 0);
  const structuralPreview = vascularSnapshot ? structuralLinearGuyton(vascularSnapshot, []) : undefined;
  const fillingPressure = structuralPreview?.fillingPressureAbsMmHg ?? (isRight ? obs.PmsfAbs : obs.PmpfAbs);
  const fillingPressureLabel = isRight ? "Pmsf" : "Pmpf";
  const gradient = fillingPressure - pressure;
  const collapsePressure = isRight ? obs.Pth : obs.Palv;
  const resistance = structuralPreview?.resistanceMmHgPerLMin ?? effectiveResistanceMmHgPerLMin(gradient, flow);
  const xRange = pressureRange(side, pressure, fillingPressure, collapsePressure);
  const xGrid = pressureGrid(xRange.min, xRange.max, 120);
  const structural = vascularSnapshot ? structuralLinearGuyton(vascularSnapshot, xGrid) : undefined;
  const warnings = paneWarnings(side, gradient, flow, resistance, metrics, obs);
  const venousReturn = structural?.curve ?? {
    id: `${side}-waterfall-vr`,
    label: isRight ? "Waterfall-aware venous return" : "Alveolar waterfall-aware return",
    source: "waterfall-linearized" as const,
    stroke: "venous" as const,
    points: sampleVenousReturnCurve({
      fillingPressure,
      resistanceMmHgPerLMin: resistance,
      collapsePressure,
      xMin: xRange.min,
      xMax: xRange.max,
      waterfall: true,
    }),
  };
  const guytonDiagnostics = buildGuytonDiagnostics({
    venousReturn,
    vascularSnapshot,
    pumpPoint: { pressure, flow },
    returnPoint: { pressure, flow: returnFlow },
  });
  warnings.push(...guytonMismatchWarnings(guytonDiagnostics));

  return {
    side,
    title: paneTitle(side),
    xLabel: isRight ? "RAP / CVP (mmHg)" : "LAP / PCWP (mmHg)",
    yLabel: "Flow (L/min)",
    operatingPoint: { pressure, flow },
    returnOperatingPoint: { pressure, flow: returnFlow },
    guytonDiagnostics,
    fillingPressure,
    fillingPressureLabel,
    gradient,
    collapsePressure,
    venousReturn,
    classicVenousReturn: {
      id: `${side}-classic-vr`,
      label: "Classic straight-line estimate",
      source: structural ? "structural-linearized" : "instant-linearized",
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
      stressedVolumeMl: structural?.totalStressedVolumeMl ?? (isRight ? obs.stressedVolumeSystemic : obs.pulmonaryVenousStressedVolume),
      unstressedVolumeMl: structural?.totalUnstressedVolumeMl ?? (isRight ? obs.unstressedVolumeSystemic : obs.pulmonaryVenousUnstressedVolume),
      effectiveComplianceMlPerMmHg: structural?.totalComplianceMlPerMmHg ?? (isRight ? obs.systemicComplianceEff : obs.pulmonaryVenousComplianceEff),
      externalPressureWeightedMmHg: structural?.externalPressureWeightedMmHg ?? (isRight ? obs.systemicExternalPressureWeighted : obs.pulmonaryVenousExternalPressureWeighted),
      effectiveResistanceMmHgPerLMin: resistance,
    },
    warnings,
  };
}

export function buildCommittedGuytonPaneData(
  side: GuytonSide,
  metrics: SimMetrics,
  obs: SimObservables,
  vascularSnapshot: VascularReturnSnapshot,
): GuytonPaneData {
  const isRight = side === "right";
  const pressure = isRight ? metrics.RAPMean : metrics.LAPMean;
  const flow = Math.max(isRight ? metrics.CO_R : metrics.CO_L, 0);
  const returnFlow = Math.max(isRight ? metrics.systemicVenousReturnLMin : metrics.pulmonaryVenousReturnLMin, 0);
  const structural = structuralLinearGuyton(vascularSnapshot, []);
  const fillingPressure = solveFillingPressureAbs(vascularSnapshot);
  const fillingPressureLabel = isRight ? "Pmsf" : "Pmpf";
  const gradient = fillingPressure - pressure;
  const collapsePressure = isRight ? obs.Pth : obs.Palv;
  const resistance = structural.resistanceMmHgPerLMin;
  const xRange = pressureRange(side, pressure, fillingPressure, collapsePressure);
  const xGrid = pressureGrid(xRange.min, xRange.max, 120);
  const venousReturn = buildVolumeConstrainedGuytonCurve(vascularSnapshot, xGrid);
  const warnings = paneWarnings(side, gradient, flow, resistance, metrics, obs);
  const guytonDiagnostics = buildGuytonDiagnostics({
    venousReturn,
    vascularSnapshot,
    pumpPoint: { pressure, flow },
    returnPoint: { pressure, flow: returnFlow },
  });
  warnings.push(...guytonMismatchWarnings(guytonDiagnostics));

  return {
    side,
    title: paneTitle(side),
    xLabel: isRight ? "RAP / CVP (mmHg)" : "LAP / PCWP (mmHg)",
    yLabel: "Flow (L/min)",
    operatingPoint: { pressure, flow },
    returnOperatingPoint: { pressure, flow: returnFlow },
    guytonDiagnostics,
    fillingPressure,
    fillingPressureLabel,
    gradient,
    collapsePressure,
    venousReturn,
    classicVenousReturn: {
      id: `${side}-classic-vr`,
      label: "Classic straight-line estimate",
      source: "structural-linearized",
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
      stressedVolumeMl: structural.totalStressedVolumeMl,
      unstressedVolumeMl: structural.totalUnstressedVolumeMl,
      effectiveComplianceMlPerMmHg: structural.totalComplianceMlPerMmHg,
      externalPressureWeightedMmHg: structural.externalPressureWeightedMmHg,
      effectiveResistanceMmHgPerLMin: resistance,
    },
    warnings,
  };
}

export function defaultGuytonAxis(side: GuytonSide): GuytonAxisDomain {
  return { ...DEFAULT_GUYTON_AXIS[side] };
}

export function boundedGuytonDisplayAxis(side: GuytonSide, axis: GuytonAxisDomain): GuytonAxisDomain {
  const xMin = Math.max(axis.xMin, DISPLAY_X_MIN_FLOOR[side]);
  return {
    xMin,
    xMax: Math.max(axis.xMax, xMin + 1),
    yMin: 0,
    yMax: Math.max(axis.yMax, 1),
  };
}

export function focusedGuytonDisplayAxis(
  side: GuytonSide,
  axis: GuytonAxisDomain,
  pane?: GuytonPaneData,
  sweep?: StarlingSweepResponse,
): GuytonAxisDomain {
  const bounded = boundedGuytonDisplayAxis(side, axis);
  if (!pane) return bounded;

  const activeSweep = side === "right" ? sweep?.right : sweep?.left;
  const measuredStarling = [
    ...(activeSweep?.points ?? []),
    ...(activeSweep?.fit?.points ?? []),
  ].filter(isFinitePoint);
  const references = [
    { x: pane.operatingPoint.pressure, y: pane.operatingPoint.flow },
    { x: pane.returnOperatingPoint.pressure, y: pane.returnOperatingPoint.flow },
    { x: pane.guytonDiagnostics.pump.pressure, y: pane.guytonDiagnostics.pump.guytonFlow },
    { x: pane.guytonDiagnostics.return.pressure, y: pane.guytonDiagnostics.return.guytonFlow },
    { x: pane.fillingPressure, y: 0 },
  ].filter(isFinitePoint);

  const focusXPoints = [...measuredStarling, ...references];
  const xMin = Math.max(
    Math.min(
      bounded.xMin,
      focusXPoints.length > 0 ? Math.min(...focusXPoints.map((point) => point.x)) - DISPLAY_X_MEASURED_MARGIN : bounded.xMin,
    ),
    DISPLAY_X_MIN_FLOOR[side],
  );
  const measuredMaxX = measuredStarling.length > 0 ? Math.max(...measuredStarling.map((point) => point.x)) : Number.NEGATIVE_INFINITY;
  const referenceMaxX = references.length > 0 ? Math.max(...references.map((point) => point.x)) : Number.NEGATIVE_INFINITY;
  const desiredXMax = Math.max(
    DISPLAY_X_FOCUS_DEFAULT_MAX[side],
    referenceMaxX + DISPLAY_X_MEASURED_MARGIN,
    measuredMaxX + DISPLAY_X_MEASURED_MARGIN,
    xMin + 1,
  );
  const cappedXMax = Math.min(desiredXMax, DISPLAY_X_FOCUS_HARD_MAX[side]);
  const xMax = Math.max(
    xMin + 1,
    cappedXMax,
    Number.isFinite(measuredMaxX) ? measuredMaxX + DISPLAY_X_MEASURED_MARGIN : Number.NEGATIVE_INFINITY,
  );

  const focusYPoints = [...measuredStarling, ...references];
  const focusYMax = focusYPoints.length > 0
    ? Math.max(...focusYPoints.map((point) => point.y))
    : bounded.yMax;
  const yMax = Math.max(
    1,
    DISPLAY_Y_DEFAULT_MAX,
    focusYMax + Math.max(0.75, focusYMax * 0.18),
  );

  return {
    xMin,
    xMax,
    yMin: 0,
    yMax,
  };
}

export function liveGuytonOperatingPoint(side: GuytonSide, metrics: SimMetrics): GuytonLiveOperatingPoint {
  return {
    pressure: side === "right" ? metrics.RAPMean : metrics.LAPMean,
    flow: Math.max(side === "right" ? metrics.CO_R : metrics.CO_L, 0),
  };
}

export function expandGuytonAxisToFit(
  current: GuytonAxisDomain,
  points: GuytonCurvePoint[],
  options: { marginFraction?: number } = {},
): GuytonAxisDomain {
  if (points.length === 0) return current;
  const marginFraction = options.marginFraction ?? 0.12;
  const finite = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (finite.length === 0) return current;
  const xMin = Math.min(...finite.map((point) => point.x));
  const xMax = Math.max(...finite.map((point) => point.x));
  const yMin = Math.min(...finite.map((point) => point.y));
  const yMax = Math.max(...finite.map((point) => point.y));
  const xPad = Math.max((xMax - xMin) * marginFraction, 0.5);
  const yPad = Math.max((yMax - yMin) * marginFraction, 0.5);
  return {
    xMin: Math.min(current.xMin, xMin - xPad),
    xMax: Math.max(current.xMax, xMax + xPad),
    yMin: Math.min(current.yMin, yMin - yPad),
    yMax: Math.max(current.yMax, yMax + yPad),
  };
}

export function guytonSnapshotPoints(
  pane: GuytonPaneData,
  sweep: StarlingSweepResponse | undefined,
): GuytonCurvePoint[] {
  const activeSweep = pane.side === "right" ? sweep?.right : sweep?.left;
  return [
    ...pane.venousReturn.points,
    ...pane.classicVenousReturn.points,
    ...(activeSweep?.points ?? []),
    ...(activeSweep?.fit?.points ?? []),
    ...(activeSweep?.fit?.extrapolatedLeft ?? []),
    ...(activeSweep?.fit?.extrapolatedRight ?? []),
    { x: pane.operatingPoint.pressure, y: pane.operatingPoint.flow },
    { x: pane.returnOperatingPoint.pressure, y: pane.returnOperatingPoint.flow },
    { x: pane.guytonDiagnostics.pump.pressure, y: pane.guytonDiagnostics.pump.guytonFlow },
    { x: pane.guytonDiagnostics.return.pressure, y: pane.guytonDiagnostics.return.guytonFlow },
    { x: pane.fillingPressure, y: 0 },
  ];
}

function isFinitePoint(point: GuytonCurvePoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export function buildGuytonDiagnostics(args: {
  venousReturn: GuytonCurve;
  vascularSnapshot?: VascularReturnSnapshot;
  pumpPoint: { pressure: number; flow: number };
  returnPoint: { pressure: number; flow: number };
}): GuytonDiagnostics {
  const source = args.vascularSnapshot ? "exact-solver" : "curve-interpolation";
  const flowAtPressure = (pressure: number): number => {
    if (args.vascularSnapshot) {
      return solveReturnFlowAtDownstreamPressure(args.vascularSnapshot, pressure).y;
    }
    return interpolateCurveY(args.venousReturn.points, pressure);
  };
  return {
    source,
    pump: buildGuytonMismatchDiagnostic(args.pumpPoint, flowAtPressure(args.pumpPoint.pressure)),
    return: buildGuytonMismatchDiagnostic(args.returnPoint, flowAtPressure(args.returnPoint.pressure)),
  };
}

export function interpolateCurveY(points: GuytonCurvePoint[], x: number): number {
  const finite = points
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => a.x - b.x);
  if (finite.length === 0) return Number.NaN;
  if (finite.length === 1 || x <= finite[0].x) return finite[0].y;
  const last = finite[finite.length - 1];
  if (x >= last.x) return last.y;
  for (let i = 1; i < finite.length; i++) {
    const lo = finite[i - 1];
    const hi = finite[i];
    if (x > hi.x) continue;
    const span = hi.x - lo.x;
    if (Math.abs(span) <= 1e-12) return hi.y;
    const alpha = (x - lo.x) / span;
    return lo.y + alpha * (hi.y - lo.y);
  }
  return last.y;
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

function pressureGrid(xMin: number, xMax: number, n: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < n; i++) {
    points.push(xMin + (xMax - xMin) * i / Math.max(n - 1, 1));
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
  void side;
  const p = params as unknown as Record<string, unknown>;
  const keys = [
    "HR", "contractility", "relaxation", "systemicResistance", "pulmonaryResistance",
    "venousTone", "arterialStiffness", "PEEP", "Pth0", "respAmpTh", "respAmpAlv",
    "heartModel", "lvTmaxScale", "rvTmaxScale", "lvGeomScale", "rvGeomScale",
    "caReleaseScale", "rvCaReleaseScale", "pericardiumEnabled", "pericardialFluidMl",
    "pericardialPressureScaleMmHg", "septalCouplingEnabled", "septalStiffnessScale",
    "MV_Aref", "MV_Amax", "MV_Aleak", "MV_R", "MV_L", "MV_B",
    "AoV_Aref", "AoV_Amax", "AoV_Aleak", "AoV_R", "AoV_L", "AoV_B",
    "TV_Aref", "TV_Amax", "TV_Aleak", "TV_R", "TV_L", "TV_B",
    "PV_Aref", "PV_Amax", "PV_Aleak", "PV_R", "PV_L", "PV_B",
    "nodeOverrides", "edgeOverrides",
  ];
  const picked: Record<string, unknown> = {};
  for (const key of keys) picked[key] = p[key];
  return JSON.stringify({
    instanceId,
    targetVolumeMl: Math.round(targetVolumeMl),
    params: picked,
  });
}

export function classifyStarlingSweepPoint(
  point: Pick<GuytonCurvePoint, "settled" | "status" | "quality">,
): StarlingSweepPointQuality {
  if (point.quality) return point.quality;
  if (point.status === "failed") return "invalid";
  if (point.status === "warning") return "stress";
  if (point.settled === false) return "stress";
  return "reliable";
}

function effectiveResistanceMmHgPerLMin(gradient: number, flowLMin: number): number {
  if (!(flowLMin > FLOW_FLOOR_L_MIN) || !Number.isFinite(gradient)) return 1;
  return clamp(Math.abs(gradient) / Math.max(flowLMin, FLOW_FLOOR_L_MIN), RESISTANCE_MIN, RESISTANCE_MAX);
}

function paneTitle(side: GuytonSide): string {
  return side === "right"
    ? "Systemic Guyton / RV Starling"
    : "Pulmonary venous return / LV preload sweep";
}

function buildGuytonMismatchDiagnostic(
  point: { pressure: number; flow: number },
  guytonFlow: number,
): GuytonMismatchDiagnostic {
  const observedFlow = point.flow;
  const mismatchLMin = guytonFlow - observedFlow;
  const mismatchFraction = mismatchLMin / Math.max(Math.abs(observedFlow), 0.1);
  const exceedsThreshold = Number.isFinite(mismatchLMin)
    && (
      Math.abs(mismatchLMin) > GUYTON_MISMATCH_FLOW_THRESHOLD_L_MIN
      || Math.abs(mismatchFraction) > GUYTON_MISMATCH_FRACTION_THRESHOLD
    );
  return {
    pressure: point.pressure,
    observedFlow,
    guytonFlow,
    mismatchLMin,
    mismatchFraction,
    exceedsThreshold,
  };
}

function guytonMismatchWarnings(diagnostics: GuytonDiagnostics): string[] {
  const warnings: string[] = [];
  if (diagnostics.pump.exceedsThreshold) {
    warnings.push(`Guyton pump mismatch ${formatSignedFlow(diagnostics.pump.mismatchLMin)} L/min`);
  }
  if (diagnostics.return.exceedsThreshold) {
    warnings.push(`Guyton return mismatch ${formatSignedFlow(diagnostics.return.mismatchLMin)} L/min`);
  }
  return warnings;
}

function formatSignedFlow(value: number): string {
  if (!Number.isFinite(value)) return "NaN";
  const fixed = Math.abs(value).toFixed(1);
  return value >= 0 ? `+${fixed}` : `-${fixed}`;
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
