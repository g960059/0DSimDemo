import { smoothMax } from "@/engine/math";
import type { GuytonCurve, GuytonCurvePoint, GuytonSide } from "@/engine/guytonStarling";
import type { VascularPvLaw } from "@/engine/vascularPv";

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
