import {
  buildNonCoronaryCirculationGraphV1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryNodeNameV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  vascularPvLawFromNodeV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import type {
  MainWireFiveWallNonCoronaryAcceptedStateV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  complianceFromPtm,
  MAIN_WIRE_ARTERIAL_MINIMUM_LOG_STRAIN,
  MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG,
  stressedVolumeFromPtm,
  type VascularPvLaw,
} from "@/engine/vascularPv";

export const MAIN_WIRE_SCIENTIFIC_TBV_CONTINUATION_SEED_PREDICTOR_V1_ID =
  "main-wire-scientific-tbv-continuation-seed-predictor-v1" as const;

const VASCULAR_NODE_NAMES = Object.freeze([
  "Ao", "SA", "Art", "Cap", "SV", "VC",
  "PA", "PArt", "PCap", "PVen", "PVein",
] as const satisfies readonly NonCoronaryNodeNameV1[]);

const CHAMBER_NODE_NAMES = Object.freeze([
  "LV", "LA", "RV", "RA",
] as const satisfies readonly NonCoronaryNodeNameV1[]);

const PHYSICAL_VOLUME_EPSILON_ML = 1e-6;
const TBV_TOLERANCE_ML = 1e-6;
const MAXIMUM_SECANT_EXTRAPOLATION_RATIO = 1.5;

type AcceptedState = MainWireFiveWallNonCoronaryAcceptedStateV1<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

export type MainWireScientificTbvSeedInitializationKindV1 =
  | "identity"
  | "shared-sv-vc-pressure-offset"
  | "baseline-vascular-compliance-projection"
  | "provisional-vascular-secant-compliance-projection"
  | "p1-vascular-secant-compliance-projection";

export type MainWireScientificTbvSeedInitializationDiagnosticsV1 = Readonly<{
  predictorId:
    typeof MAIN_WIRE_SCIENTIFIC_TBV_CONTINUATION_SEED_PREDICTOR_V1_ID;
  predictorVersion: "1.0.0";
  referenceEvidence: "trusted-p1" | "provisional-fast-preview";
  kind: MainWireScientificTbvSeedInitializationKindV1;
  currentReferenceTbvMl: number;
  previousReferenceTbvMl: number | null;
  targetTbvMl: number;
  secantExtrapolationRatio: number | null;
  sameCyclePhase: boolean | null;
  maximumNormalizedProjectionCorrection: number | null;
  clampedVascularNodeNames: readonly NonCoronaryNodeNameV1[];
  fallbackUsed: boolean;
  fallbackReason: string | null;
  targetTbvProjectionErrorMl: number;
  chamberVolumesChanged: false;
  mechanicsStateChanged: false;
  dynamicFlowMemoryChanged: false;
  valveMemoryChanged: false;
}>;

export type MainWireScientificTbvSeedInitializationV1 = Readonly<{
  state: AcceptedState;
  diagnostics: MainWireScientificTbvSeedInitializationDiagnosticsV1;
}>;

/**
 * Fast-preview initializer. The target TBV increment is distributed across
 * the eleven vascular nodes in the local constitutive-compliance metric, then
 * box-projected exactly. Its source may be the baseline P1 endpoint or the
 * previous provisional endpoint; neither use creates a P1 claim.
 */
export function initializeMainWireScientificFastTbvPreviewSeedV1(input: Readonly<{
  sourceState: AcceptedState;
  targetTbvMl: number;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
}>): MainWireScientificTbvSeedInitializationV1 {
  validateTargetTbv(input.targetTbvMl);
  const sourceTbvMl = input.sourceState.circulation.totalBloodVolumeMl;
  if (Math.abs(input.targetTbvMl - sourceTbvMl) <= 1e-10) {
    return freezeResult(input.sourceState, diagnostics({
      kind: "identity",
      currentReferenceTbvMl: sourceTbvMl,
      previousReferenceTbvMl: null,
      targetTbvMl: input.targetTbvMl,
      secantExtrapolationRatio: null,
      sameCyclePhase: null,
      maximumNormalizedProjectionCorrection: 0,
      clampedVascularNodeNames: Object.freeze([]),
      fallbackUsed: false,
      fallbackReason: null,
      targetTbvProjectionErrorMl: 0,
    }));
  }
  try {
    const predicted = projectBaselineComplianceToTargetTbv(input);
    return freezeResult(predicted.state, diagnostics({
      kind: "baseline-vascular-compliance-projection",
      currentReferenceTbvMl: sourceTbvMl,
      previousReferenceTbvMl: null,
      targetTbvMl: input.targetTbvMl,
      secantExtrapolationRatio: null,
      sameCyclePhase: true,
      maximumNormalizedProjectionCorrection:
        predicted.maximumNormalizedProjectionCorrection,
      clampedVascularNodeNames: predicted.clampedVascularNodeNames,
      fallbackUsed: false,
      fallbackReason: null,
      targetTbvProjectionErrorMl: predicted.targetTbvProjectionErrorMl,
    }));
  } catch (error) {
    return safeFallback({
      currentP1State: input.sourceState,
      previousP1State: null,
      targetTbvMl: input.targetTbvMl,
      runtime: input.runtime,
    }, `fast-preview compliance projection failed: ${errorMessage(error)}`, null, true);
  }
}

/**
 * Initializes the next fixed-TBV continuation target without making a
 * periodicity claim. When two trusted, same-lane P1 endpoints are available,
 * only vascular physical volumes are extrapolated. A compliance-metric box
 * projection then restores exact TBV while preserving the current chamber,
 * Land/SLS/TriSeg, flow-memory and valve-memory states.
 *
 * Every trust or feasibility failure deterministically falls back to the
 * conservative shared-SV/VC transmural-pressure fork used by the original
 * protocol. Natural integration and the canonical P1/P2 classifier remain the
 * sole owners of endpoint evidence.
 */
export function initializeMainWireScientificTbvTargetSeedV1(input: Readonly<{
  currentP1State: AcceptedState;
  previousP1State: AcceptedState | null;
  targetTbvMl: number;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  cycleLengthSec?: number;
  referenceEvidence?: "trusted-p1" | "provisional-fast-preview";
}>): MainWireScientificTbvSeedInitializationV1 {
  validateTargetTbv(input.targetTbvMl);
  const currentTbvMl = input.currentP1State.circulation.totalBloodVolumeMl;
  const referenceEvidence = input.referenceEvidence ?? "trusted-p1";
  const endpointLabel = referenceEvidence === "provisional-fast-preview"
    ? "provisional endpoint"
    : "trusted P1 endpoint";
  if (Math.abs(input.targetTbvMl - currentTbvMl) <= 1e-10) {
    return freezeResult(
      input.currentP1State,
      diagnostics({
        kind: "identity",
        currentReferenceTbvMl: currentTbvMl,
        previousReferenceTbvMl:
          input.previousP1State?.circulation.totalBloodVolumeMl ?? null,
        targetTbvMl: input.targetTbvMl,
        secantExtrapolationRatio: null,
        sameCyclePhase: null,
        maximumNormalizedProjectionCorrection: 0,
        clampedVascularNodeNames: Object.freeze([]),
        fallbackUsed: false,
        fallbackReason: null,
        targetTbvProjectionErrorMl: 0,
      }, referenceEvidence),
    );
  }

  const previous = input.previousP1State;
  if (previous === null) {
    return safeFallback(
      input,
      `previous ${endpointLabel} is unavailable`,
      null,
      null,
    );
  }
  const previousTbvMl = previous.circulation.totalBloodVolumeMl;
  const secantDenominatorMl = currentTbvMl - previousTbvMl;
  const targetStepMl = input.targetTbvMl - currentTbvMl;
  const cycleLengthSec = input.cycleLengthSec ?? 1;
  const sameCyclePhase = statesShareCyclePhase(
    previous,
    input.currentP1State,
    cycleLengthSec,
  );
  const extrapolationRatio = Math.abs(targetStepMl / secantDenominatorMl);
  if (!(input.currentP1State.acceptedTimeSec > previous.acceptedTimeSec)) {
    return safeFallback(
      input,
      `previous ${endpointLabel} is not earlier than the current endpoint`,
      extrapolationRatio,
      sameCyclePhase,
    );
  }
  if (!sameCyclePhase) {
    return safeFallback(
      input,
      `${endpointLabel}s do not share the requested cardiac-cycle phase`,
      extrapolationRatio,
      false,
    );
  }
  if (
    !Number.isFinite(secantDenominatorMl)
    || Math.abs(secantDenominatorMl) <= TBV_TOLERANCE_ML
  ) {
    return safeFallback(
      input,
      `${endpointLabel} TBVs do not define a finite secant`,
      null,
      true,
    );
  }
  if (!(targetStepMl * secantDenominatorMl > 0)) {
    return safeFallback(
      input,
      `target does not continue outward along the ${endpointLabel} lane`,
      extrapolationRatio,
      true,
    );
  }
  if (
    !Number.isFinite(extrapolationRatio)
    || extrapolationRatio > MAXIMUM_SECANT_EXTRAPOLATION_RATIO
  ) {
    return safeFallback(
      input,
      `secant extrapolation ratio exceeds ${MAXIMUM_SECANT_EXTRAPOLATION_RATIO}`,
      extrapolationRatio,
      true,
    );
  }

  try {
    const predicted = projectVascularSecantToTargetTbv({
      previousState: previous,
      currentState: input.currentP1State,
      targetTbvMl: input.targetTbvMl,
      runtime: input.runtime,
    });
    return freezeResult(predicted.state, diagnostics({
      kind: input.referenceEvidence === "provisional-fast-preview"
        ? "provisional-vascular-secant-compliance-projection"
        : "p1-vascular-secant-compliance-projection",
      currentReferenceTbvMl: currentTbvMl,
      previousReferenceTbvMl: previousTbvMl,
      targetTbvMl: input.targetTbvMl,
      secantExtrapolationRatio: extrapolationRatio,
      sameCyclePhase: true,
      maximumNormalizedProjectionCorrection:
        predicted.maximumNormalizedProjectionCorrection,
      clampedVascularNodeNames: predicted.clampedVascularNodeNames,
      fallbackUsed: false,
      fallbackReason: null,
      targetTbvProjectionErrorMl: predicted.targetTbvProjectionErrorMl,
    }, referenceEvidence));
  } catch (error) {
    return safeFallback(
      input,
      `predictor projection failed: ${errorMessage(error)}`,
      extrapolationRatio,
      true,
    );
  }
}

/** Conservative source fork retained as the fail-closed initializer. */
export function forkMainWireScientificTbvStateWithSharedSvVcOffsetV1(
  sourceState: AcceptedState,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  targetTbvMl: number,
): AcceptedState {
  validateTargetTbv(targetTbvMl);
  const sourceTbvMl = sourceState.circulation.totalBloodVolumeMl;
  const targetVenousVolumeDeltaMl = targetTbvMl - sourceTbvMl;
  if (Math.abs(targetVenousVolumeDeltaMl) <= 1e-10) return sourceState;

  const graph = buildNonCoronaryCirculationGraphV1();
  const reservoirs = (["SV", "VC"] as const).map((nodeName) => {
    const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
    const law = vascularPvLawFromNodeV1(node, runtime.vascular);
    const sourceVolumeMl = sourceState.circulation.nodeVolumesMl[nodeName];
    const sourcePtmMmHg = vascularTransmuralPressureFromPhysicalVolumeV1(
      node,
      sourceVolumeMl,
      runtime.vascular,
      "adaptive-volume-tolerance",
    );
    return Object.freeze({ nodeName, law, sourceVolumeMl, sourcePtmMmHg });
  });
  const changedVolumeMl = (offsetMmHg: number): number => reservoirs.reduce(
    (sum, reservoir) => sum
      + reservoir.law.Vu
      + stressedVolumeFromPtm(
        reservoir.law,
        reservoir.sourcePtmMmHg + offsetMmHg,
      )
      - reservoir.sourceVolumeMl,
    0,
  );
  const residualMl = (offsetMmHg: number): number =>
    changedVolumeMl(offsetMmHg) - targetVenousVolumeDeltaMl;

  let lowerMmHg = -1;
  let upperMmHg = 1;
  for (let expansion = 0; expansion < 32 && residualMl(lowerMmHg) > 0;
    expansion += 1) lowerMmHg *= 2;
  for (let expansion = 0; expansion < 32 && residualMl(upperMmHg) < 0;
    expansion += 1) upperMmHg *= 2;
  if (!(residualMl(lowerMmHg) <= 0 && residualMl(upperMmHg) >= 0)) {
    throw new Error("protocol TBV target is outside the SV/VC PV-law bracket");
  }
  for (let iteration = 0; iteration < 96; iteration += 1) {
    const midpointMmHg = 0.5 * (lowerMmHg + upperMmHg);
    if (residualMl(midpointMmHg) < 0) lowerMmHg = midpointMmHg;
    else upperMmHg = midpointMmHg;
  }
  const offsetMmHg = 0.5 * (lowerMmHg + upperMmHg);
  const changed = Object.fromEntries(reservoirs.map((reservoir) => [
    reservoir.nodeName,
    reservoir.law.Vu + stressedVolumeFromPtm(
      reservoir.law,
      reservoir.sourcePtmMmHg + offsetMmHg,
    ),
  ])) as Readonly<Record<"SV" | "VC", number>>;
  if (!(changed.SV > 0) || !(changed.VC > 0)) {
    throw new Error("protocol TBV fork produced a non-positive venous volume");
  }
  const nodeVolumesMl = Object.freeze({
    ...sourceState.circulation.nodeVolumesMl,
    SV: changed.SV,
    VC: changed.VC,
  });
  return stateWithTargetVolumes(sourceState, nodeVolumesMl, targetTbvMl);
}

function projectVascularSecantToTargetTbv(input: Readonly<{
  previousState: AcceptedState;
  currentState: AcceptedState;
  targetTbvMl: number;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
}>): Readonly<{
  state: AcceptedState;
  maximumNormalizedProjectionCorrection: number;
  clampedVascularNodeNames: readonly NonCoronaryNodeNameV1[];
  targetTbvProjectionErrorMl: number;
}> {
  const previousTbvMl = input.previousState.circulation.totalBloodVolumeMl;
  const currentTbvMl = input.currentState.circulation.totalBloodVolumeMl;
  const denominatorMl = currentTbvMl - previousTbvMl;
  const targetStepMl = input.targetTbvMl - currentTbvMl;
  const graph = buildNonCoronaryCirculationGraphV1();
  const chambersTotalMl = CHAMBER_NODE_NAMES.reduce((sum, name) =>
    sum + input.currentState.circulation.nodeVolumesMl[name], 0);
  const targetVascularTotalMl = input.targetTbvMl - chambersTotalMl;
  const nodes = VASCULAR_NODE_NAMES.map((name) => {
    const node = graph.nodes[graph.nodeIndex.get(name)!]!;
    const law = vascularPvLawFromNodeV1(node, input.runtime.vascular);
    const previousVolumeMl = input.previousState.circulation.nodeVolumesMl[name];
    const currentVolumeMl = input.currentState.circulation.nodeVolumesMl[name];
    const rawVolumeMl = currentVolumeMl
      + targetStepMl * (currentVolumeMl - previousVolumeMl) / denominatorMl;
    const currentPtmMmHg = vascularTransmuralPressureFromPhysicalVolumeV1(
      node,
      currentVolumeMl,
      input.runtime.vascular,
      "adaptive-volume-tolerance",
    );
    const complianceMlPerMmHg = complianceFromPtm(law, currentPtmMmHg);
    const bounds = vascularPhysicalVolumeBounds(law);
    if (
      !Number.isFinite(rawVolumeMl)
      || !Number.isFinite(complianceMlPerMmHg)
      || !(complianceMlPerMmHg > 0)
      || !(bounds.lowerMl > 0)
      || !(bounds.upperMl > bounds.lowerMl)
    ) throw new Error(`non-finite predictor input for ${name}`);
    return Object.freeze({
      name,
      rawVolumeMl,
      complianceMlPerMmHg,
      lowerMl: bounds.lowerMl,
      upperMl: bounds.upperMl,
    });
  });
  const minimumTotalMl = nodes.reduce((sum, node) => sum + node.lowerMl, 0);
  const maximumTotalMl = nodes.reduce((sum, node) => sum + node.upperMl, 0);
  if (
    targetVascularTotalMl < minimumTotalMl - TBV_TOLERANCE_ML
    || targetVascularTotalMl > maximumTotalMl + TBV_TOLERANCE_ML
  ) throw new Error("target vascular volume is outside constitutive box bounds");

  const projected = weightedBoxProjection(nodes, targetVascularTotalMl);
  const nodeVolumesMl = Object.freeze({
    ...input.currentState.circulation.nodeVolumesMl,
    ...Object.fromEntries(projected.values.map(({ name, volumeMl }) => [
      name,
      volumeMl,
    ])),
  });
  const state = stateWithTargetVolumes(
    input.currentState,
    nodeVolumesMl,
    input.targetTbvMl,
  );
  const normalizationMl = Math.max(Math.abs(targetStepMl), 1);
  const maximumNormalizedProjectionCorrection = projected.values.reduce(
    (maximum, value, index) => Math.max(
      maximum,
      Math.abs(value.volumeMl - nodes[index]!.rawVolumeMl) / normalizationMl,
    ),
    0,
  );
  return Object.freeze({
    state,
    maximumNormalizedProjectionCorrection,
    clampedVascularNodeNames: Object.freeze(projected.values.flatMap((value, index) => {
      const node = nodes[index]!;
      return Math.abs(value.volumeMl - node.lowerMl) <= 1e-8
        || Math.abs(value.volumeMl - node.upperMl) <= 1e-8
        ? [value.name]
        : [];
    })),
    targetTbvProjectionErrorMl:
      totalVolumeMl(state) - input.targetTbvMl,
  });
}

function projectBaselineComplianceToTargetTbv(input: Readonly<{
  sourceState: AcceptedState;
  targetTbvMl: number;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
}>): Readonly<{
  state: AcceptedState;
  maximumNormalizedProjectionCorrection: number;
  clampedVascularNodeNames: readonly NonCoronaryNodeNameV1[];
  targetTbvProjectionErrorMl: number;
}> {
  const graph = buildNonCoronaryCirculationGraphV1();
  const sourceTbvMl = input.sourceState.circulation.totalBloodVolumeMl;
  const targetStepMl = input.targetTbvMl - sourceTbvMl;
  const chamberTotalMl = CHAMBER_NODE_NAMES.reduce((sum, name) =>
    sum + input.sourceState.circulation.nodeVolumesMl[name], 0);
  const targetVascularTotalMl = input.targetTbvMl - chamberTotalMl;
  const currentNodes = VASCULAR_NODE_NAMES.map((name) => {
    const node = graph.nodes[graph.nodeIndex.get(name)!]!;
    const law = vascularPvLawFromNodeV1(node, input.runtime.vascular);
    const currentVolumeMl = input.sourceState.circulation.nodeVolumesMl[name];
    const currentPtmMmHg = vascularTransmuralPressureFromPhysicalVolumeV1(
      node,
      currentVolumeMl,
      input.runtime.vascular,
      "adaptive-volume-tolerance",
    );
    const complianceMlPerMmHg = complianceFromPtm(law, currentPtmMmHg);
    const bounds = vascularPhysicalVolumeBounds(law);
    if (!Number.isFinite(complianceMlPerMmHg) || !(complianceMlPerMmHg > 0)) {
      throw new Error(`non-finite preview compliance for ${name}`);
    }
    return Object.freeze({
      name,
      currentVolumeMl,
      complianceMlPerMmHg,
      lowerMl: bounds.lowerMl,
      upperMl: bounds.upperMl,
    });
  });
  const complianceTotal = currentNodes.reduce((sum, node) =>
    sum + node.complianceMlPerMmHg, 0);
  if (!(complianceTotal > 0) || !Number.isFinite(complianceTotal)) {
    throw new Error("preview vascular compliance metric is unavailable");
  }
  const nodes = currentNodes.map((node) => Object.freeze({
    name: node.name,
    rawVolumeMl: node.currentVolumeMl
      + targetStepMl * node.complianceMlPerMmHg / complianceTotal,
    complianceMlPerMmHg: node.complianceMlPerMmHg,
    lowerMl: node.lowerMl,
    upperMl: node.upperMl,
  }));
  const projected = weightedBoxProjection(nodes, targetVascularTotalMl);
  const nodeVolumesMl = Object.freeze({
    ...input.sourceState.circulation.nodeVolumesMl,
    ...Object.fromEntries(projected.values.map(({ name, volumeMl }) => [
      name,
      volumeMl,
    ])),
  });
  const state = stateWithTargetVolumes(
    input.sourceState,
    nodeVolumesMl,
    input.targetTbvMl,
  );
  const normalizationMl = Math.max(Math.abs(targetStepMl), 1);
  return Object.freeze({
    state,
    maximumNormalizedProjectionCorrection: projected.values.reduce(
      (maximum, value, index) => Math.max(
        maximum,
        Math.abs(value.volumeMl - nodes[index]!.rawVolumeMl) / normalizationMl,
      ),
      0,
    ),
    clampedVascularNodeNames: Object.freeze(projected.values.flatMap((value, index) => {
      const node = nodes[index]!;
      return Math.abs(value.volumeMl - node.lowerMl) <= 1e-8
        || Math.abs(value.volumeMl - node.upperMl) <= 1e-8
        ? [value.name]
        : [];
    })),
    targetTbvProjectionErrorMl: totalVolumeMl(state) - input.targetTbvMl,
  });
}

function weightedBoxProjection(
  nodes: readonly Readonly<{
    name: NonCoronaryNodeNameV1;
    rawVolumeMl: number;
    complianceMlPerMmHg: number;
    lowerMl: number;
    upperMl: number;
  }>[],
  targetTotalMl: number,
): Readonly<{
  values: readonly Readonly<{
    name: NonCoronaryNodeNameV1;
    volumeMl: number;
  }>[];
}> {
  const volumeAt = (lambdaMmHg: number, node: typeof nodes[number]): number =>
    clamp(
      node.rawVolumeMl + lambdaMmHg * node.complianceMlPerMmHg,
      node.lowerMl,
      node.upperMl,
    );
  const residual = (lambdaMmHg: number): number => nodes.reduce(
    (sum, node) => sum + volumeAt(lambdaMmHg, node),
    -targetTotalMl,
  );
  let lowerLambda = -1;
  let upperLambda = 1;
  for (let index = 0; index < 96 && residual(lowerLambda) > 0; index += 1) {
    lowerLambda *= 2;
  }
  for (let index = 0; index < 96 && residual(upperLambda) < 0; index += 1) {
    upperLambda *= 2;
  }
  if (!(residual(lowerLambda) <= 0 && residual(upperLambda) >= 0)) {
    throw new Error("compliance projection could not bracket exact vascular volume");
  }
  for (let iteration = 0; iteration < 96; iteration += 1) {
    const midpoint = 0.5 * (lowerLambda + upperLambda);
    if (residual(midpoint) < 0) lowerLambda = midpoint;
    else upperLambda = midpoint;
  }
  const lambda = 0.5 * (lowerLambda + upperLambda);
  const mutable = nodes.map((node) => ({
    name: node.name,
    volumeMl: volumeAt(lambda, node),
  }));
  let remainderMl = targetTotalMl - mutable.reduce(
    (sum, value) => sum + value.volumeMl,
    0,
  );
  if (Math.abs(remainderMl) > 1e-12) {
    const correctionIndex = nodes.reduce((bestIndex, node, index) => {
      const current = mutable[index]!.volumeMl;
      const hasHeadroom = remainderMl > 0
        ? current < node.upperMl - 1e-12
        : current > node.lowerMl + 1e-12;
      if (!hasHeadroom) return bestIndex;
      return bestIndex < 0
        || node.complianceMlPerMmHg
          > nodes[bestIndex]!.complianceMlPerMmHg
        ? index
        : bestIndex;
    }, -1);
    if (correctionIndex < 0) {
      throw new Error("compliance projection has no active headroom");
    }
    mutable[correctionIndex]!.volumeMl += remainderMl;
    remainderMl = targetTotalMl - mutable.reduce(
      (sum, value) => sum + value.volumeMl,
      0,
    );
  }
  if (Math.abs(remainderMl) > TBV_TOLERANCE_ML) {
    throw new Error(`compliance projection residual ${remainderMl} mL`);
  }
  return Object.freeze({
    values: Object.freeze(mutable.map((value) => Object.freeze(value))),
  });
}

function vascularPhysicalVolumeBounds(law: VascularPvLaw): Readonly<{
  lowerMl: number;
  upperMl: number;
}> {
  if (law.kind === "arterial") {
    return Object.freeze({
      lowerMl: Math.max(
        PHYSICAL_VOLUME_EPSILON_ML,
        law.Vu + law.VsEff * MAIN_WIRE_ARTERIAL_MINIMUM_LOG_STRAIN,
      ),
      upperMl: Number.POSITIVE_INFINITY,
    });
  }
  if (law.kind === "linear") {
    return Object.freeze({
      lowerMl: PHYSICAL_VOLUME_EPSILON_ML,
      upperMl: Number.POSITIVE_INFINITY,
    });
  }
  return Object.freeze({
    lowerMl: Math.max(
      PHYSICAL_VOLUME_EPSILON_ML,
      law.Vu + stressedVolumeFromPtm(
        law,
        MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.minimum,
      ),
    ),
    upperMl: law.Vu + stressedVolumeFromPtm(
      law,
      MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.maximum,
    ),
  });
}

function safeFallback(
  input: Readonly<{
    currentP1State: AcceptedState;
    previousP1State: AcceptedState | null;
    targetTbvMl: number;
    runtime: NonCoronaryCirculationRuntimeParamsV1;
    referenceEvidence?: "trusted-p1" | "provisional-fast-preview";
  }>,
  reason: string,
  secantExtrapolationRatio: number | null,
  sameCyclePhase: boolean | null,
): MainWireScientificTbvSeedInitializationV1 {
  const state = forkMainWireScientificTbvStateWithSharedSvVcOffsetV1(
    input.currentP1State,
    input.runtime,
    input.targetTbvMl,
  );
  return freezeResult(state, diagnostics({
    kind: "shared-sv-vc-pressure-offset",
    currentReferenceTbvMl:
      input.currentP1State.circulation.totalBloodVolumeMl,
    previousReferenceTbvMl:
      input.previousP1State?.circulation.totalBloodVolumeMl ?? null,
    targetTbvMl: input.targetTbvMl,
    secantExtrapolationRatio,
    sameCyclePhase,
    maximumNormalizedProjectionCorrection: null,
    clampedVascularNodeNames: Object.freeze([]),
    fallbackUsed: true,
    fallbackReason: reason,
    targetTbvProjectionErrorMl: totalVolumeMl(state) - input.targetTbvMl,
  }, input.referenceEvidence ?? "trusted-p1"));
}

function stateWithTargetVolumes(
  sourceState: AcceptedState,
  nodeVolumesMl: AcceptedState["circulation"]["nodeVolumesMl"],
  targetTbvMl: number,
): AcceptedState {
  const resolvedTbvMl = Object.values(nodeVolumesMl).reduce(
    (sum, volumeMl) => sum + volumeMl,
    0,
  );
  if (Math.abs(resolvedTbvMl - targetTbvMl) > TBV_TOLERANCE_ML) {
    throw new Error(
      `protocol TBV seed missed target by ${resolvedTbvMl - targetTbvMl} mL`,
    );
  }
  if (Object.values(nodeVolumesMl).some((volumeMl) =>
    !Number.isFinite(volumeMl) || !(volumeMl > 0))) {
    throw new Error("protocol TBV seed produced a non-positive node volume");
  }
  return Object.freeze({
    ...sourceState,
    circulation: Object.freeze({
      ...sourceState.circulation,
      totalBloodVolumeMl: targetTbvMl,
      nodeVolumesMl,
    }),
  });
}

function statesShareCyclePhase(
  previous: AcceptedState,
  current: AcceptedState,
  cycleLengthSec: number,
): boolean {
  if (!(cycleLengthSec > 0) || !Number.isFinite(cycleLengthSec)) return false;
  const elapsedCycles =
    (current.acceptedTimeSec - previous.acceptedTimeSec) / cycleLengthSec;
  return Number.isFinite(elapsedCycles)
    && Math.abs(elapsedCycles - Math.round(elapsedCycles)) <= 1e-6;
}

function diagnostics(input: Omit<
  MainWireScientificTbvSeedInitializationDiagnosticsV1,
  | "predictorId"
  | "predictorVersion"
  | "referenceEvidence"
  | "chamberVolumesChanged"
  | "mechanicsStateChanged"
  | "dynamicFlowMemoryChanged"
  | "valveMemoryChanged"
>, referenceEvidence: MainWireScientificTbvSeedInitializationDiagnosticsV1[
  "referenceEvidence"
] = "trusted-p1"): MainWireScientificTbvSeedInitializationDiagnosticsV1 {
  return Object.freeze({
    predictorId: MAIN_WIRE_SCIENTIFIC_TBV_CONTINUATION_SEED_PREDICTOR_V1_ID,
    predictorVersion: "1.0.0" as const,
    referenceEvidence,
    ...input,
    chamberVolumesChanged: false as const,
    mechanicsStateChanged: false as const,
    dynamicFlowMemoryChanged: false as const,
    valveMemoryChanged: false as const,
  });
}

function freezeResult(
  state: AcceptedState,
  initializationDiagnostics: MainWireScientificTbvSeedInitializationDiagnosticsV1,
): MainWireScientificTbvSeedInitializationV1 {
  return Object.freeze({ state, diagnostics: initializationDiagnostics });
}

function totalVolumeMl(state: AcceptedState): number {
  return Object.values(state.circulation.nodeVolumesMl).reduce(
    (sum, volumeMl) => sum + volumeMl,
    0,
  );
}

function validateTargetTbv(targetTbvMl: number): void {
  if (!(targetTbvMl > 0) || !Number.isFinite(targetTbvMl)) {
    throw new Error("protocol fixed TBV must be positive and finite");
  }
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.min(upper, Math.max(lower, value));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
