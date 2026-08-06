import {
  buildNonCoronaryCirculationGraphV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  nonValveEdgeLossV1,
  vascularPvLawFromNodeV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import { smoothMax } from "@/engine/math";
import type {
  MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import type {
  MainWireIntegratedModelObservationV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  complianceFromPtm,
  stressedVolumeFromPtm,
  type VascularPvLaw,
} from "@/engine/vascularPv";

export const MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID =
  "main-wire-integrated-v3-guyton-starling-structural-orientation-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_STRUCTURAL_RETURN_SEMANTICS_V3 =
  "frozen-accepted-step-volume-constrained-structural-orientation-not-simulated-response" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_STARLING_PROTOCOL_REQUIREMENT_V3 =
  "independent-fixed-tbv-fixture-forks-with-per-point-settlement-and-numerical-qualification" as const;

export type MainWireIntegratedModelGuytonSideV3 = "right" | "left";

export type MainWireIntegratedModelGuytonPointV3 = Readonly<{
  downstreamPressureMmHg: number;
  returnFlowLPerMin: number;
  flowLimited: boolean;
}>;

export type MainWireIntegratedModelStarlingLocusV3 =
  | Readonly<{
      status: "requires-protocol";
      requirement:
        typeof MAIN_WIRE_INTEGRATED_MODEL_STARLING_PROTOCOL_REQUIREMENT_V3;
      points: readonly [];
    }>
  | Readonly<{
      status: "measured-fixed-tbv-protocol";
      requirement:
        typeof MAIN_WIRE_INTEGRATED_MODEL_STARLING_PROTOCOL_REQUIREMENT_V3;
      points: readonly Readonly<{
        totalBloodVolumeMl: number;
        fillingPressureMmHg: number;
        cardiacOutputLPerMin: number;
        settled: true;
        numericalQualificationPassed: true;
      }>[];
    }>;

export type MainWireIntegratedModelStructuralReturnOrientationV3 = Readonly<{
  side: MainWireIntegratedModelGuytonSideV3;
  semantics:
    typeof MAIN_WIRE_INTEGRATED_MODEL_STRUCTURAL_RETURN_SEMANTICS_V3;
  pressureBasis: "absolute";
  sourceAcceptedRevision: number;
  sourceAcceptedTimeSec: number;
  downstreamNode: "RA" | "LA";
  downstreamPressureLabel: "RAP" | "LAP";
  fillingPressureLabel: "Pmsf orientation" | "Pmpf orientation";
  fillingPressureMmHg: number;
  operatingPoint: Readonly<{
    downstreamPressureMmHg: number;
    returnFlowLPerMin: number;
    returnPath: "VC_RA" | "PVein_LA";
  }>;
  curve: readonly MainWireIntegratedModelGuytonPointV3[];
  starlingLocus: MainWireIntegratedModelStarlingLocusV3;
  limitations: readonly string[];
}>;

export type MainWireIntegratedModelGuytonStarlingOrientationV3 =
  | Readonly<{
      analysisId:
        typeof MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID;
      status: "accepted-step-readback-required";
      sourceAcceptedRevision: number;
      sourceAcceptedTimeSec: number;
      right: null;
      left: null;
    }>
  | Readonly<{
      analysisId:
        typeof MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID;
      status: "available";
      sourceAcceptedRevision: number;
      sourceAcceptedTimeSec: number;
      right: MainWireIntegratedModelStructuralReturnOrientationV3;
      left: MainWireIntegratedModelStructuralReturnOrientationV3;
    }>;

type StructuralNodeV3 = Readonly<{
  name: string;
  externalPressureMmHg: number;
  stressedVolumeMl: number;
  complianceMlPerMmHg: number;
  law: VascularPvLaw;
}>;

type StructuralEdgeV3 = Readonly<{
  upstreamNode: string;
  resistanceMmHgSecPerMl: number;
  quadraticLossMmHgSec2PerMl2: number;
  waterfall: boolean;
  collapsePressureMmHg: number;
}>;

type StructuralPathV3 = Readonly<{
  nodes: readonly StructuralNodeV3[];
  edges: readonly StructuralEdgeV3[];
  totalStressedVolumeMl: number;
}>;

const SYSTEMIC_NODE_PATH_V3 = Object.freeze([
  "VC", "SV", "Cap", "Art", "SA", "Ao",
] as const);
const SYSTEMIC_EDGE_PATH_V3 = Object.freeze([
  "VC_RA", "SV_VC", "Cap_SV", "Art_Cap", "SA_Art", "Ao_SA",
] as const);
const PULMONARY_NODE_PATH_V3 = Object.freeze([
  "PVein", "PVen", "PCap",
] as const);
const PULMONARY_EDGE_PATH_V3 = Object.freeze([
  "PVein_LA", "PVen_PVein", "PCap_PVen",
] as const);

const CURVE_SAMPLE_COUNT_V3 = 121;
const MAXIMUM_ORIENTATION_FLOW_ML_PER_SEC_V3 = 350;
const ROOT_TOLERANCE_ML_V3 = 1e-4;

/**
 * Read-only side analysis of one exact accepted V3 step.
 *
 * The vascular-return curve freezes the current accepted volume ledger, PV
 * laws, external pressures, and local edge-loss coefficients. It then solves
 * the corresponding steady volume-constrained return map. It neither forks
 * nor advances the supplied numerical session and deliberately does not
 * manufacture a Frank-Starling response curve from one operating point.
 */
export function buildMainWireIntegratedModelGuytonStarlingOrientationV3(
  observation: MainWireIntegratedModelObservationV3,
  hemodynamicInputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
): MainWireIntegratedModelGuytonStarlingOrientationV3 {
  const accepted = observation.acceptedState;
  const step = observation.lastAcceptedStep;
  if (step === null) {
    return Object.freeze({
      analysisId:
        MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
      status: "accepted-step-readback-required" as const,
      sourceAcceptedRevision: accepted.revision,
      sourceAcceptedTimeSec: accepted.acceptedTimeSec,
      right: null,
      left: null,
    });
  }
  assertObservationPairV3(observation);
  return Object.freeze({
    analysisId:
      MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
    status: "available" as const,
    sourceAcceptedRevision: accepted.revision,
    sourceAcceptedTimeSec: accepted.acceptedTimeSec,
    right: buildSideOrientationV3("right", observation, hemodynamicInputs),
    left: buildSideOrientationV3("left", observation, hemodynamicInputs),
  });
}

function buildSideOrientationV3(
  side: MainWireIntegratedModelGuytonSideV3,
  observation: MainWireIntegratedModelObservationV3,
  hemodynamicInputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
): MainWireIntegratedModelStructuralReturnOrientationV3 {
  const accepted = observation.acceptedState;
  const circulation = observation.lastAcceptedStep!.coronaryStep.baseStep
    .circulationTrial;
  const path = structuralPathV3(side, observation, hemodynamicInputs);
  const downstreamNode = side === "right" ? "RA" : "LA";
  const returnPath = side === "right" ? "VC_RA" : "PVein_LA";
  const downstreamPressureMmHg =
    circulation.nodeAbsolutePressuresMmHg[downstreamNode];
  const returnFlowLPerMin =
    circulation.edgeFlowsMlPerSec[returnPath] * 60 / 1_000;
  const fillingPressureMmHg = solveUniformFillingPressureV3(path);
  const [domainMinimum, domainMaximum] = pressureDomainV3(
    side,
    downstreamPressureMmHg,
    fillingPressureMmHg,
  );
  const curve = Object.freeze(Array.from(
    { length: CURVE_SAMPLE_COUNT_V3 },
    (_, index) => {
      const ratio = index / (CURVE_SAMPLE_COUNT_V3 - 1);
      return solveStructuralReturnAtPressureV3(
        path,
        domainMinimum + ratio * (domainMaximum - domainMinimum),
      );
    },
  ));
  return Object.freeze({
    side,
    semantics:
      MAIN_WIRE_INTEGRATED_MODEL_STRUCTURAL_RETURN_SEMANTICS_V3,
    pressureBasis: "absolute" as const,
    sourceAcceptedRevision: accepted.revision,
    sourceAcceptedTimeSec: accepted.acceptedTimeSec,
    downstreamNode,
    downstreamPressureLabel: side === "right" ? "RAP" : "LAP",
    fillingPressureLabel:
      side === "right" ? "Pmsf orientation" : "Pmpf orientation",
    fillingPressureMmHg,
    operatingPoint: Object.freeze({
      downstreamPressureMmHg,
      returnFlowLPerMin,
      returnPath,
    }),
    curve,
    starlingLocus: Object.freeze({
      status: "requires-protocol" as const,
      requirement:
        MAIN_WIRE_INTEGRATED_MODEL_STARLING_PROTOCOL_REQUIREMENT_V3,
      points: Object.freeze([] as const),
    }),
    limitations: Object.freeze([
      "Structural return orientation only; not a simulated pressure intervention.",
      "Edge losses and external pressures are frozen at the accepted step; inertance is omitted from the steady map.",
      side === "right"
        ? "The non-coronary VC-to-RA return path is shown; the parallel coronary-sinus return branch is not included."
        : "The pulmonary venous PCap-to-LA return path is shown.",
      "A Starling locus requires independent fixed-TBV V3 fixture forks, settlement, and numerical qualification at every point.",
    ]),
  });
}

function structuralPathV3(
  side: MainWireIntegratedModelGuytonSideV3,
  observation: MainWireIntegratedModelObservationV3,
  hemodynamicInputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
): StructuralPathV3 {
  const graph = buildNonCoronaryCirculationGraphV1();
  const acceptedVolumes =
    observation.acceptedState.coronary.circulation.nodeVolumesMl;
  const readback = observation.lastAcceptedStep!.coronaryStep.baseStep
    .circulationTrial;
  const nodeNames = side === "right"
    ? SYSTEMIC_NODE_PATH_V3
    : PULMONARY_NODE_PATH_V3;
  const edgeNames = side === "right"
    ? SYSTEMIC_EDGE_PATH_V3
    : PULMONARY_EDGE_PATH_V3;
  const nodes = Object.freeze(nodeNames.map((name): StructuralNodeV3 => {
    const node = graph.nodes[graph.nodeIndex.get(name)!];
    const volumeMl = acceptedVolumes[name];
    const law = vascularPvLawFromNodeV1(node, hemodynamicInputs);
    const transmuralPressureMmHg =
      vascularTransmuralPressureFromPhysicalVolumeV1(
        node,
        volumeMl,
        hemodynamicInputs,
        "adaptive-volume-tolerance",
      );
    const externalPressureMmHg =
      readback.nodeAbsolutePressuresMmHg[name] - transmuralPressureMmHg;
    return Object.freeze({
      name,
      externalPressureMmHg,
      stressedVolumeMl: volumeMl - law.Vu,
      complianceMlPerMmHg:
        complianceFromPtm(law, transmuralPressureMmHg),
      law,
    });
  }));
  const nodeByName = new Map(nodes.map((node) => [node.name, node]));
  const edges = Object.freeze(edgeNames.map((name): StructuralEdgeV3 => {
    const edge = graph.edges[graph.edgeIndex.get(name)!];
    const externalPressureMmHg = edge.ext === "palv"
      ? nodeByName.get("PCap")?.externalPressureMmHg ?? 0
      : edge.ext === "pth"
        ? inferThoracicPressureV3(observation)
        : 0;
    const loss = nonValveEdgeLossV1({
      edge,
      params: hemodynamicInputs,
      upstreamPressureMmHg:
        readback.nodeAbsolutePressuresMmHg[edge.up],
      downstreamPressureMmHg:
        readback.nodeAbsolutePressuresMmHg[edge.down],
      edgeExternalPressureMmHg: externalPressureMmHg,
    });
    return Object.freeze({
      upstreamNode: edge.up,
      resistanceMmHgSecPerMl: loss.resistanceMmHgSecPerMl,
      quadraticLossMmHgSec2PerMl2:
        loss.quadraticLossMmHgSec2PerMl2,
      waterfall: Boolean(edge.waterfall),
      collapsePressureMmHg:
        externalPressureMmHg + (edge.Pcrit ?? 0),
    });
  }));
  if (
    edges.length !== nodes.length
    || edges.some((edge, index) => edge.upstreamNode !== nodes[index]?.name)
  ) throw new Error("integrated V3 structural return path topology changed");
  const totalStressedVolumeMl = nodes.reduce(
    (sum, node) => sum + node.stressedVolumeMl,
    0,
  );
  if (!(totalStressedVolumeMl > 0)) {
    throw new Error("integrated V3 structural return path has no stressed volume");
  }
  return Object.freeze({ nodes, edges, totalStressedVolumeMl });
}

function inferThoracicPressureV3(
  observation: MainWireIntegratedModelObservationV3,
): number {
  const step = observation.lastAcceptedStep!;
  const absoluteRa = step.coronaryStep.baseStep.circulationTrial
    .nodeAbsolutePressuresMmHg.RA;
  const transmuralRa = step.coronaryStep.baseStep.mechanicsTrial
    .transmuralPressuresMmHg.RA;
  return absoluteRa - transmuralRa;
}

function solveUniformFillingPressureV3(path: StructuralPathV3): number {
  return bisectOrNearestV3(
    (pressureMmHg) => totalStressedVolumeAtUniformPressureV3(
      path,
      pressureMmHg,
    ) - path.totalStressedVolumeMl,
    -40,
    120,
    1e-7,
    96,
  );
}

function solveStructuralReturnAtPressureV3(
  path: StructuralPathV3,
  downstreamPressureMmHg: number,
): MainWireIntegratedModelGuytonPointV3 {
  const residual = (flowMlPerSec: number) =>
    totalStressedVolumeAtFlowV3(
      path,
      downstreamPressureMmHg,
      flowMlPerSec,
    ) - path.totalStressedVolumeMl;
  if (residual(0) >= 0) {
    return Object.freeze({
      downstreamPressureMmHg,
      returnFlowLPerMin: 0,
      flowLimited: false,
    });
  }
  if (residual(MAXIMUM_ORIENTATION_FLOW_ML_PER_SEC_V3) < 0) {
    return Object.freeze({
      downstreamPressureMmHg,
      returnFlowLPerMin:
        MAXIMUM_ORIENTATION_FLOW_ML_PER_SEC_V3 * 60 / 1_000,
      flowLimited: true,
    });
  }
  const flowMlPerSec = bisectOrNearestV3(
    residual,
    0,
    MAXIMUM_ORIENTATION_FLOW_ML_PER_SEC_V3,
    ROOT_TOLERANCE_ML_V3,
    80,
  );
  return Object.freeze({
    downstreamPressureMmHg,
    returnFlowLPerMin: flowMlPerSec * 60 / 1_000,
    flowLimited: false,
  });
}

function totalStressedVolumeAtUniformPressureV3(
  path: StructuralPathV3,
  absolutePressureMmHg: number,
): number {
  return path.nodes.reduce((sum, node) => sum + stressedVolumeFromPtm(
    node.law,
    absolutePressureMmHg - node.externalPressureMmHg,
  ), 0);
}

function totalStressedVolumeAtFlowV3(
  path: StructuralPathV3,
  downstreamPressureMmHg: number,
  flowMlPerSec: number,
): number {
  let currentDownstreamPressureMmHg = downstreamPressureMmHg;
  let totalStressedVolumeMl = 0;
  for (let index = 0; index < path.edges.length; index += 1) {
    const edge = path.edges[index]!;
    const node = path.nodes[index]!;
    const effectiveDownstreamPressureMmHg = edge.waterfall
      ? smoothMax(
          currentDownstreamPressureMmHg,
          edge.collapsePressureMmHg,
          0.25,
        )
      : currentDownstreamPressureMmHg;
    const upstreamPressureMmHg = effectiveDownstreamPressureMmHg
      + edge.resistanceMmHgSecPerMl * flowMlPerSec
      + edge.quadraticLossMmHgSec2PerMl2
        * flowMlPerSec * Math.abs(flowMlPerSec);
    totalStressedVolumeMl += stressedVolumeFromPtm(
      node.law,
      upstreamPressureMmHg - node.externalPressureMmHg,
    );
    currentDownstreamPressureMmHg = upstreamPressureMmHg;
  }
  return totalStressedVolumeMl;
}

function pressureDomainV3(
  side: MainWireIntegratedModelGuytonSideV3,
  operatingPressureMmHg: number,
  fillingPressureMmHg: number,
): readonly [number, number] {
  const baselineMinimum = side === "right" ? -8 : -5;
  const baselineMaximum = side === "right" ? 20 : 30;
  return Object.freeze([
    Math.min(baselineMinimum, operatingPressureMmHg - 4),
    Math.max(baselineMaximum, fillingPressureMmHg + 4),
  ]);
}

function bisectOrNearestV3(
  evaluate: (value: number) => number,
  lower: number,
  upper: number,
  tolerance: number,
  maximumIterations: number,
): number {
  let low = lower;
  let high = upper;
  let lowResidual = evaluate(low);
  let highResidual = evaluate(high);
  if (!Number.isFinite(lowResidual) || !Number.isFinite(highResidual)) {
    throw new Error("integrated V3 structural return root is not finite");
  }
  if (Math.abs(lowResidual) <= tolerance) return low;
  if (Math.abs(highResidual) <= tolerance) return high;
  if (Math.sign(lowResidual) === Math.sign(highResidual)) {
    return Math.abs(lowResidual) <= Math.abs(highResidual) ? low : high;
  }
  for (let iteration = 0; iteration < maximumIterations; iteration += 1) {
    const midpoint = 0.5 * (low + high);
    const midpointResidual = evaluate(midpoint);
    if (!Number.isFinite(midpointResidual)) {
      throw new Error("integrated V3 structural return midpoint is not finite");
    }
    if (
      Math.abs(midpointResidual) <= tolerance
      || Math.abs(high - low) <= tolerance
    ) return midpoint;
    if (Math.sign(midpointResidual) === Math.sign(lowResidual)) {
      low = midpoint;
      lowResidual = midpointResidual;
    } else {
      high = midpoint;
      highResidual = midpointResidual;
    }
  }
  return Math.abs(lowResidual) <= Math.abs(highResidual) ? low : high;
}

function assertObservationPairV3(
  observation: MainWireIntegratedModelObservationV3,
): void {
  const accepted = observation.acceptedState;
  const step = observation.lastAcceptedStep!;
  if (
    step.acceptedState.revision !== accepted.revision
    || step.acceptedState.acceptedTimeSec !== accepted.acceptedTimeSec
    || step.coronaryStep.baseStep.circulationTrial.candidateTimeSec
      !== accepted.acceptedTimeSec
  ) {
    throw new Error(
      "integrated V3 structural return observation/readback clocks differ",
    );
  }
}
