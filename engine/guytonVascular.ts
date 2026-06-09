import { smoothMax } from "@/engine/math";
import type { GuytonCurve, GuytonCurvePoint, GuytonSide } from "@/engine/guytonStarling";
import {
  stressedVolumeFromPtm,
  type VascularPvLaw,
} from "@/engine/vascularPv";

export type VascularNodeSnapshot = {
  name: string;
  kind: "arterial" | "linear" | "venousPressure";
  Pabs: number;
  Ptm: number;
  Pext: number;
  volumeMl: number;
  unstressedVolumeMl: number;
  stressedVolumeMl: number;
  complianceEffMlPerMmHg: number;
  law: VascularPvLaw;
};

export type VascularEdgeSnapshot = {
  name: string;
  up: string;
  down: string;
  R_mmHg_s_per_mL: number;
  B_mmHg_s2_per_mL2: number;
  waterfall: boolean;
  Pext: number;
  Pcrit: number;
};

export type VascularReturnSnapshot = {
  side: GuytonSide;
  downstreamNode: "RA" | "LA";
  nodesDownstreamToUpstream: VascularNodeSnapshot[];
  edgesDownstreamToUpstream: VascularEdgeSnapshot[];
  totalStressedVolumeMl: number;
  totalUnstressedVolumeMl: number;
  totalComplianceMlPerMmHg: number;
  externalPressureWeightedMmHg: number;
  mode?: "instant" | "cycle-mean";
  sampleCount?: number;
  durationSeconds?: number;
};

export type StructuralLinearGuytonResult = {
  fillingPressureAbsMmHg: number;
  resistanceMmHgPerLMin: number;
  totalComplianceMlPerMmHg: number;
  totalStressedVolumeMl: number;
  totalUnstressedVolumeMl: number;
  externalPressureWeightedMmHg: number;
  curve: GuytonCurve;
};

export function structuralLinearGuyton(
  snapshot: VascularReturnSnapshot,
  xGridMmHg: number[],
): StructuralLinearGuytonResult {
  const cTotal = snapshot.totalComplianceMlPerMmHg > 0
    ? snapshot.totalComplianceMlPerMmHg
    : sum(snapshot.nodesDownstreamToUpstream.map((node) => Math.max(node.complianceEffMlPerMmHg, 0)));
  const externalWeighted = Number.isFinite(snapshot.externalPressureWeightedMmHg)
    ? snapshot.externalPressureWeightedMmHg
    : weightedExternalPressure(snapshot.nodesDownstreamToUpstream, cTotal);
  const stressedVolume = Number.isFinite(snapshot.totalStressedVolumeMl)
    ? snapshot.totalStressedVolumeMl
    : sum(snapshot.nodesDownstreamToUpstream.map((node) => node.stressedVolumeMl));
  const unstressedVolume = Number.isFinite(snapshot.totalUnstressedVolumeMl)
    ? snapshot.totalUnstressedVolumeMl
    : sum(snapshot.nodesDownstreamToUpstream.map((node) => node.unstressedVolumeMl));
  const fillingPressureAbs = cTotal > 1e-9
    ? stressedVolume / cTotal + externalWeighted
    : 0;

  let cumulativeResistance = 0;
  let weightedResistance = 0;
  for (let i = 0; i < snapshot.nodesDownstreamToUpstream.length; i++) {
    const edge = snapshot.edgesDownstreamToUpstream[i];
    cumulativeResistance += edge?.R_mmHg_s_per_mL ?? 0;
    weightedResistance += Math.max(snapshot.nodesDownstreamToUpstream[i].complianceEffMlPerMmHg, 0) * cumulativeResistance;
  }
  const resistanceMmHgPerLMin = cTotal > 1e-9
    ? (weightedResistance / cTotal) * 1000 / 60
    : 1;
  const collapsePressure = downstreamCollapsePressure(snapshot);
  const points = sampleStructuralVenousReturn(
    xGridMmHg,
    fillingPressureAbs,
    resistanceMmHgPerLMin,
    collapsePressure,
  );

  return {
    fillingPressureAbsMmHg: fillingPressureAbs,
    resistanceMmHgPerLMin,
    totalComplianceMlPerMmHg: cTotal,
    totalStressedVolumeMl: stressedVolume,
    totalUnstressedVolumeMl: unstressedVolume,
    externalPressureWeightedMmHg: externalWeighted,
    curve: {
      id: `${snapshot.side}-structural-linear-vr`,
      label: snapshot.side === "right"
        ? "Structural systemic venous return"
        : "Structural pulmonary venous return",
      source: "structural-linearized",
      stroke: "venous",
      points,
    },
  };
}

export function solveFillingPressureAbs(snapshot: VascularReturnSnapshot): number {
  const residual = (pAbs: number) => totalStressedVolumeAtUniformPressure(snapshot, pAbs) - snapshot.totalStressedVolumeMl;
  return bisectClamped(residual, -30, 100, 1e-5, 80);
}

export function solveReturnFlowAtDownstreamPressure(
  snapshot: VascularReturnSnapshot,
  pDownAbs: number,
): GuytonCurvePoint {
  const residual = (qMlPerSec: number) =>
    totalStressedVolumeAtFlow(snapshot, pDownAbs, qMlPerSec) - snapshot.totalStressedVolumeMl;

  if (residual(0) >= 0) {
    return { x: pDownAbs, y: 0, flags: ["zero-flow"] };
  }

  const qMaxMlPerSec = 350;
  if (residual(qMaxMlPerSec) < 0) {
    return { x: pDownAbs, y: qMaxMlPerSec * 60 / 1000, flags: ["qmax"] };
  }

  const qMlPerSec = bisectClamped(residual, 0, qMaxMlPerSec, 1e-4, 64);
  return { x: pDownAbs, y: qMlPerSec * 60 / 1000 };
}

export function buildVolumeConstrainedGuytonCurve(
  snapshot: VascularReturnSnapshot,
  xGridMmHg: number[],
): GuytonCurve {
  return {
    id: `${snapshot.side}-volume-constrained-vr`,
    label: snapshot.side === "right"
      ? "Volume-constrained systemic venous return"
      : "Volume-constrained pulmonary venous return",
    source: "volume-constrained",
    stroke: "venous",
    points: xGridMmHg.map((x) => solveReturnFlowAtDownstreamPressure(snapshot, x)),
  };
}

function totalStressedVolumeAtUniformPressure(snapshot: VascularReturnSnapshot, pAbs: number): number {
  return sum(snapshot.nodesDownstreamToUpstream.map((node) => (
    stressedVolumeFromPtm(node.law, pAbs - node.Pext)
  )));
}

function totalStressedVolumeAtFlow(
  snapshot: VascularReturnSnapshot,
  pDownAbs: number,
  qMlPerSec: number,
): number {
  const pressures = reconstructPressuresFromDownstream(snapshot, pDownAbs, qMlPerSec);
  return sum(snapshot.nodesDownstreamToUpstream.map((node) => {
    const pAbs = pressures[node.name] ?? pDownAbs;
    return stressedVolumeFromPtm(node.law, pAbs - node.Pext);
  }));
}

function reconstructPressuresFromDownstream(
  snapshot: VascularReturnSnapshot,
  pDownAbs: number,
  qMlPerSec: number,
): Record<string, number> {
  let downstreamPressure = pDownAbs;
  const pressures: Record<string, number> = {};

  for (const edge of snapshot.edgesDownstreamToUpstream) {
    const downstreamEffective = edge.waterfall
      ? smoothMax(downstreamPressure, edge.Pext + edge.Pcrit, 0.25)
      : downstreamPressure;
    const pressureDrop = edge.R_mmHg_s_per_mL * qMlPerSec
      + edge.B_mmHg_s2_per_mL2 * qMlPerSec * Math.abs(qMlPerSec);
    const upstreamPressure = downstreamEffective + pressureDrop;
    pressures[edge.up] = upstreamPressure;
    downstreamPressure = upstreamPressure;
  }

  return pressures;
}

function bisectClamped(
  f: (x: number) => number,
  lo: number,
  hi: number,
  tolerance: number,
  maxIterations: number,
): number {
  let fLo = f(lo);
  let fHi = f(hi);
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi)) return lo;
  if (fLo === 0) return lo;
  if (fHi === 0) return hi;
  if (fLo > 0 && fHi > 0) return Math.abs(fLo) <= Math.abs(fHi) ? lo : hi;
  if (fLo < 0 && fHi < 0) return Math.abs(fLo) <= Math.abs(fHi) ? lo : hi;

  let a = lo;
  let b = hi;
  for (let i = 0; i < maxIterations; i++) {
    const mid = 0.5 * (a + b);
    const fMid = f(mid);
    if (!Number.isFinite(fMid) || Math.abs(fMid) <= tolerance || Math.abs(b - a) <= tolerance) return mid;
    if ((fLo <= 0 && fMid <= 0) || (fLo >= 0 && fMid >= 0)) {
      a = mid;
      fLo = fMid;
    } else {
      b = mid;
    }
  }
  return 0.5 * (a + b);
}

function sampleStructuralVenousReturn(
  xGridMmHg: number[],
  fillingPressureAbsMmHg: number,
  resistanceMmHgPerLMin: number,
  collapsePressureMmHg: number | null,
): GuytonCurvePoint[] {
  const resistance = Math.max(resistanceMmHgPerLMin, 1e-6);
  return xGridMmHg.map((x) => {
    const effectiveDownstream = collapsePressureMmHg === null
      ? x
      : smoothMax(x, collapsePressureMmHg, 0.25);
    return {
      x,
      y: Math.max(0, (fillingPressureAbsMmHg - effectiveDownstream) / resistance),
      flags: collapsePressureMmHg !== null && x < collapsePressureMmHg ? ["waterfall"] : undefined,
    };
  });
}

function downstreamCollapsePressure(snapshot: VascularReturnSnapshot): number | null {
  const waterfallEdge = snapshot.edgesDownstreamToUpstream.find((edge) => edge.waterfall);
  if (!waterfallEdge) return null;
  return waterfallEdge.Pext + waterfallEdge.Pcrit;
}

function weightedExternalPressure(nodes: VascularNodeSnapshot[], cTotal: number): number {
  if (cTotal <= 1e-9) return 0;
  return sum(nodes.map((node) => Math.max(node.complianceEffMlPerMmHg, 0) * node.Pext)) / cTotal;
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}
