import { pressureVolumePathIntegralIncrementV3 } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1";
import type { MainWireIntegratedModelPeriodicTerminalTraceSampleV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_V1_ID =
  "main-wire-integrated-model-periodic-pressure-basis-decomposition-engineering-projection-v1" as const;

/**
 * Engineering-only pressure-basis decomposition.
 *
 * This projector owns only three signed line integrals over one caller-supplied
 * volume path and their algebraic residual. It does not establish that the
 * points are accepted solver endpoints, that the path is a canonical periodic
 * orbit, or that any upstream model/protocol identity is authentic.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_POLICY_V1 =
  Object.freeze({
    policyId:
      "main-wire-integrated-model-periodic-pressure-basis-decomposition-engineering-projection-policy-v1" as const,
    pressureDefinitions: Object.freeze({
      cavityAbsolutePressure: "cavity-absolute-pressure" as const,
      ventricularTransmuralPressure: "ventricular-transmural-pressure" as const,
      externalConstraintPressure:
        "cavity-absolute-minus-ventricular-transmural-pressure" as const,
    }),
    workDefinition:
      "negative-caller-ordered-endpoint-trapezoidal-line-integral-of-pressure-against-volume" as const,
    algebraicIdentity:
      "cavity-absolute-work-equals-ventricular-transmural-work-plus-external-constraint-exchange" as const,
    maximumAbsoluteDecompositionResidualMmHgMl: 1e-8,
    closure:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1.closure,
    signConvention:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1.signConvention,
    syntheticEndToStartClosingSegmentApplied: false as const,
    acceptedEndpointIdentityVerifiedByProjector: false as const,
    periodicityEstablishedByProjector: false as const,
    sourceProvenanceEstablishedByProjector: false as const,
    commonPericardiumStoredEnergyEstablishedByProjector: false as const,
    perChamberPericardialEnergyAllocationEstablishedByProjector: false as const,
    wholeHeartExternalConstraintWorkEstablishedByProjector: false as const,
    pvaEstablishedByProjector: false as const,
    physiologicalValidationEstablishedByProjector: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireIntegratedModelPeriodicPressureBasisV1 =
  | "cavity-absolute-pressure"
  | "ventricular-transmural-pressure"
  | "external-constraint-pressure";

export type MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1 =
  Readonly<{
    source: "caller-projected-pressure-basis-point";
    chamberVolumeMl: Readonly<{ LV: number; RV: number }>;
    absolutePressureMmHg: Readonly<{ LV: number; RV: number }>;
    transmuralPressureMmHg: Readonly<{ LV: number; RV: number }>;
  }>;

export type MainWireIntegratedModelPeriodicPressureBasisDecompositionInputV1 =
  Readonly<{
    startPoint: MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1 | null;
    orderedEndpointCandidates: readonly MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1[];
  }>;

export type MainWireIntegratedModelPeriodicPressureBasisWorkDirectionV1 =
  "net-work-by-ventricle" | "net-work-on-ventricle" | "zero-net-work";

export type MainWireIntegratedModelPeriodicPressureBasisEndpointClosureV1 =
  Readonly<{
    start: Readonly<{ volumeMl: number; pressureMmHg: number }> | null;
    end: Readonly<{ volumeMl: number; pressureMmHg: number }> | null;
    absoluteVolumeDeltaMl: number | null;
    absolutePressureDeltaMmHg: number | null;
    normalizedVolumeDelta: number | null;
    normalizedPressureDelta: number | null;
    maximumNormalizedDelta: number | null;
    metricsFinite: boolean;
    withinTolerance: boolean;
  }>;

export type MainWireIntegratedModelPeriodicPressureBasisDecompositionFailureReasonV1 =
  | "start-point-not-provided"
  | "ordered-endpoint-candidates-empty"
  | "pressure-volume-path-non-finite"
  | "pressure-volume-boundary-not-closed"
  | "pressure-work-decomposition-non-finite"
  | "pressure-work-decomposition-residual-exceeded";

type PressureBasisRecordV1<T> = Readonly<
  Record<MainWireIntegratedModelPeriodicPressureBasisV1, T>
>;

export type MainWireIntegratedModelPeriodicVentricularPressureBasisDecompositionV1 =
  Readonly<{
    chamber: "LV" | "RV";
    pathWorkMmHgMl: PressureBasisRecordV1<number | null>;
    boundaryWorkMmHgMl: PressureBasisRecordV1<number | null>;
    pathWorkDirection: PressureBasisRecordV1<MainWireIntegratedModelPeriodicPressureBasisWorkDirectionV1 | null>;
    endpointClosure: PressureBasisRecordV1<MainWireIntegratedModelPeriodicPressureBasisEndpointClosureV1>;
    cavityAbsoluteBoundaryWorkMmHgMl: number | null;
    ventricularTransmuralBoundaryWorkMmHgMl: number | null;
    externalConstraintExchangeMmHgMl: number | null;
    decompositionResidualMmHgMl: number | null;
    decompositionResidualWithinNumericalTolerance: boolean;
    pressureBasisBoundaryWorkComputed: boolean;
    failureReasons: readonly MainWireIntegratedModelPeriodicPressureBasisDecompositionFailureReasonV1[];
  }>;

export type MainWireIntegratedModelPeriodicPressureBasisDecompositionEngineeringResultV1 =
  Readonly<{
    projectionId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_V1_ID;
    status:
      | "projection-computed-biventricular"
      | "projection-computed-left-ventricular-only"
      | "projection-computed-right-ventricular-only"
      | "projection-not-computed";
    pathSegmentCandidateCount: number;
    leftVentricle: MainWireIntegratedModelPeriodicVentricularPressureBasisDecompositionV1;
    rightVentricle: MainWireIntegratedModelPeriodicVentricularPressureBasisDecompositionV1;
    biventricularPressureBasisBoundaryWorkComputed: boolean;
    syntheticEndToStartClosingSegmentApplied: false;
    engineeringProjectionOnly: true;
    acceptedEndpointIdentityVerified: false;
    periodicityEstablished: false;
    sourceProvenanceVerified: false;
    historicalQualificationTransferred: false;
    officialQualificationEstablished: false;
    publicOutputEstablished: false;
    commonPericardiumStoredEnergyEstablished: false;
    perChamberPericardialEnergyAllocationEstablished: false;
    wholeHeartExternalConstraintWorkEstablished: false;
    pvaEstablished: false;
    physiologicalValidationEstablished: false;
    clinicalValidationClaimed: false;
    policy: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_POLICY_V1;
  }>;

export function projectMainWireIntegratedModelPeriodicPressureBasisDecompositionEngineeringV1(
  input: MainWireIntegratedModelPeriodicPressureBasisDecompositionInputV1,
): MainWireIntegratedModelPeriodicPressureBasisDecompositionEngineeringResultV1 {
  const leftVentricle = chamberDecompositionV1(
    "LV",
    input.startPoint,
    input.orderedEndpointCandidates,
  );
  const rightVentricle = chamberDecompositionV1(
    "RV",
    input.startPoint,
    input.orderedEndpointCandidates,
  );
  const leftComputed = leftVentricle.pressureBasisBoundaryWorkComputed;
  const rightComputed = rightVentricle.pressureBasisBoundaryWorkComputed;
  const status =
    leftComputed && rightComputed
      ? ("projection-computed-biventricular" as const)
      : leftComputed
        ? ("projection-computed-left-ventricular-only" as const)
        : rightComputed
          ? ("projection-computed-right-ventricular-only" as const)
          : ("projection-not-computed" as const);

  return Object.freeze({
    projectionId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_V1_ID,
    status,
    pathSegmentCandidateCount:
      input.startPoint === null ? 0 : input.orderedEndpointCandidates.length,
    leftVentricle,
    rightVentricle,
    biventricularPressureBasisBoundaryWorkComputed:
      leftComputed && rightComputed,
    syntheticEndToStartClosingSegmentApplied: false as const,
    engineeringProjectionOnly: true as const,
    acceptedEndpointIdentityVerified: false as const,
    periodicityEstablished: false as const,
    sourceProvenanceVerified: false as const,
    historicalQualificationTransferred: false as const,
    officialQualificationEstablished: false as const,
    publicOutputEstablished: false as const,
    commonPericardiumStoredEnergyEstablished: false as const,
    perChamberPericardialEnergyAllocationEstablished: false as const,
    wholeHeartExternalConstraintWorkEstablished: false as const,
    pvaEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
    policy:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_POLICY_V1,
  });
}

export function pressureBasisPathPointCandidateFromAcceptedTraceSampleV1(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
): MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1 {
  const point = Object.freeze({
    source: "caller-projected-pressure-basis-point" as const,
    chamberVolumeMl: Object.freeze({
      LV: sample.chamberVolumeMl.LV,
      RV: sample.chamberVolumeMl.RV,
    }),
    absolutePressureMmHg: Object.freeze({
      LV: sample.absolutePressureMmHg.LV,
      RV: sample.absolutePressureMmHg.RV,
    }),
    transmuralPressureMmHg: Object.freeze({
      LV: sample.transmuralPressureMmHg.LV,
      RV: sample.transmuralPressureMmHg.RV,
    }),
  });
  if (!pressureBasisPointIsFiniteV1(point)) {
    throw new Error("pressure-basis path point contains a nonfinite value");
  }
  if (
    !Number.isFinite(
      point.absolutePressureMmHg.LV - point.transmuralPressureMmHg.LV,
    ) ||
    !Number.isFinite(
      point.absolutePressureMmHg.RV - point.transmuralPressureMmHg.RV,
    )
  ) {
    throw new Error(
      "pressure-basis path point produces a nonfinite external-constraint pressure",
    );
  }
  return point;
}

function chamberDecompositionV1(
  chamber: "LV" | "RV",
  startPoint: MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1 | null,
  orderedEndpointCandidates: readonly MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1[],
): MainWireIntegratedModelPeriodicVentricularPressureBasisDecompositionV1 {
  const endPoint = orderedEndpointCandidates.at(-1) ?? null;
  const pathWorkMmHgMl = basisRecordV1((basis) =>
    pathWorkV1(chamber, startPoint, orderedEndpointCandidates, basis),
  );
  const endpointClosure = basisRecordV1((basis) =>
    endpointClosureV1(
      pressureVolumePointV1(startPoint, chamber, basis),
      pressureVolumePointV1(endPoint, chamber, basis),
    ),
  );
  const pathWorkDirection = basisRecordV1((basis) => {
    const value = pathWorkMmHgMl[basis];
    return value === null ? null : workDirectionV1(value);
  });
  const cavityAbsolutePathWorkMmHgMl =
    pathWorkMmHgMl["cavity-absolute-pressure"];
  const ventricularTransmuralPathWorkMmHgMl =
    pathWorkMmHgMl["ventricular-transmural-pressure"];
  const externalConstraintPathWorkMmHgMl =
    pathWorkMmHgMl["external-constraint-pressure"];
  const decompositionResidualMmHgMl = decompositionResidualV1(
    cavityAbsolutePathWorkMmHgMl,
    ventricularTransmuralPathWorkMmHgMl,
    externalConstraintPathWorkMmHgMl,
  );
  const decompositionResidualWithinNumericalTolerance =
    decompositionResidualMmHgMl !== null &&
    Math.abs(decompositionResidualMmHgMl) <=
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_POLICY_V1.maximumAbsoluteDecompositionResidualMmHgMl;
  const allPathWorkFinite = PRESSURE_BASES_V1.every(
    (basis) => pathWorkMmHgMl[basis] !== null,
  );
  const allBoundariesClosed = PRESSURE_BASES_V1.every(
    (basis) => endpointClosure[basis].withinTolerance,
  );
  const pressureBasisBoundaryWorkComputed =
    startPoint !== null &&
    orderedEndpointCandidates.length > 0 &&
    allPathWorkFinite &&
    allBoundariesClosed &&
    decompositionResidualWithinNumericalTolerance;
  const boundaryWorkMmHgMl = basisRecordV1((basis) =>
    pressureBasisBoundaryWorkComputed ? pathWorkMmHgMl[basis] : null,
  );
  const failureReasons: MainWireIntegratedModelPeriodicPressureBasisDecompositionFailureReasonV1[] =
    [];
  if (startPoint === null) failureReasons.push("start-point-not-provided");
  if (orderedEndpointCandidates.length === 0) {
    failureReasons.push("ordered-endpoint-candidates-empty");
  }
  if (
    startPoint !== null &&
    orderedEndpointCandidates.length > 0 &&
    !allPathWorkFinite
  ) {
    failureReasons.push("pressure-volume-path-non-finite");
  }
  if (
    startPoint !== null &&
    orderedEndpointCandidates.length > 0 &&
    !allBoundariesClosed
  ) {
    failureReasons.push("pressure-volume-boundary-not-closed");
  }
  if (allPathWorkFinite && decompositionResidualMmHgMl === null) {
    failureReasons.push("pressure-work-decomposition-non-finite");
  }
  if (
    decompositionResidualMmHgMl !== null &&
    !decompositionResidualWithinNumericalTolerance
  ) {
    failureReasons.push("pressure-work-decomposition-residual-exceeded");
  }

  return Object.freeze({
    chamber,
    pathWorkMmHgMl,
    boundaryWorkMmHgMl,
    pathWorkDirection,
    endpointClosure,
    cavityAbsoluteBoundaryWorkMmHgMl:
      boundaryWorkMmHgMl["cavity-absolute-pressure"],
    ventricularTransmuralBoundaryWorkMmHgMl:
      boundaryWorkMmHgMl["ventricular-transmural-pressure"],
    externalConstraintExchangeMmHgMl:
      boundaryWorkMmHgMl["external-constraint-pressure"],
    decompositionResidualMmHgMl,
    decompositionResidualWithinNumericalTolerance,
    pressureBasisBoundaryWorkComputed,
    failureReasons: Object.freeze(failureReasons),
  });
}

const PRESSURE_BASES_V1 = Object.freeze([
  "cavity-absolute-pressure",
  "ventricular-transmural-pressure",
  "external-constraint-pressure",
] as const satisfies readonly MainWireIntegratedModelPeriodicPressureBasisV1[]);

function basisRecordV1<T>(
  valueForBasis: (basis: MainWireIntegratedModelPeriodicPressureBasisV1) => T,
): PressureBasisRecordV1<T> {
  return Object.freeze({
    "cavity-absolute-pressure": valueForBasis("cavity-absolute-pressure"),
    "ventricular-transmural-pressure": valueForBasis(
      "ventricular-transmural-pressure",
    ),
    "external-constraint-pressure": valueForBasis(
      "external-constraint-pressure",
    ),
  });
}

function pathWorkV1(
  chamber: "LV" | "RV",
  startPoint: MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1 | null,
  orderedEndpointCandidates: readonly MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1[],
  basis: MainWireIntegratedModelPeriodicPressureBasisV1,
): number | null {
  if (startPoint === null || orderedEndpointCandidates.length === 0)
    return null;
  let previousVolumeMl = startPoint.chamberVolumeMl[chamber];
  let previousPressureMmHg = pressureForBasisV1(startPoint, chamber, basis);
  if (!Number.isFinite(previousVolumeMl) || previousPressureMmHg === null) {
    return null;
  }
  let pathIntegralMmHgMl = 0;
  for (const point of orderedEndpointCandidates) {
    const nextVolumeMl = point.chamberVolumeMl[chamber];
    const nextPressureMmHg = pressureForBasisV1(point, chamber, basis);
    if (!Number.isFinite(nextVolumeMl) || nextPressureMmHg === null)
      return null;
    const incrementMmHgMl = pressureVolumePathIntegralIncrementV3(
      previousVolumeMl,
      previousPressureMmHg,
      nextVolumeMl,
      nextPressureMmHg,
    );
    if (!Number.isFinite(incrementMmHgMl)) return null;
    const nextIntegralMmHgMl = pathIntegralMmHgMl + incrementMmHgMl;
    if (!Number.isFinite(nextIntegralMmHgMl)) return null;
    pathIntegralMmHgMl = nextIntegralMmHgMl;
    previousVolumeMl = nextVolumeMl;
    previousPressureMmHg = nextPressureMmHg;
  }
  const workMmHgMl = -pathIntegralMmHgMl;
  if (!Number.isFinite(workMmHgMl)) return null;
  return Object.is(workMmHgMl, -0) ? 0 : workMmHgMl;
}

function pressureForBasisV1(
  point: MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1,
  chamber: "LV" | "RV",
  basis: MainWireIntegratedModelPeriodicPressureBasisV1,
): number | null {
  const pressureMmHg =
    basis === "cavity-absolute-pressure"
      ? point.absolutePressureMmHg[chamber]
      : basis === "ventricular-transmural-pressure"
        ? point.transmuralPressureMmHg[chamber]
        : point.absolutePressureMmHg[chamber] -
          point.transmuralPressureMmHg[chamber];
  return Number.isFinite(pressureMmHg) ? pressureMmHg : null;
}

function pressureVolumePointV1(
  point: MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1 | null,
  chamber: "LV" | "RV",
  basis: MainWireIntegratedModelPeriodicPressureBasisV1,
): Readonly<{ volumeMl: number; pressureMmHg: number }> | null {
  if (point === null) return null;
  const pressureMmHg = pressureForBasisV1(point, chamber, basis);
  if (
    !Number.isFinite(point.chamberVolumeMl[chamber]) ||
    pressureMmHg === null
  ) {
    return null;
  }
  return Object.freeze({
    volumeMl: point.chamberVolumeMl[chamber],
    pressureMmHg,
  });
}

function endpointClosureV1(
  start: Readonly<{ volumeMl: number; pressureMmHg: number }> | null,
  end: Readonly<{ volumeMl: number; pressureMmHg: number }> | null,
): MainWireIntegratedModelPeriodicPressureBasisEndpointClosureV1 {
  if (start === null || end === null) return unavailableClosureV1(start, end);
  const absoluteVolumeDeltaMl = Math.abs(end.volumeMl - start.volumeMl);
  const absolutePressureDeltaMmHg = Math.abs(
    end.pressureMmHg - start.pressureMmHg,
  );
  const normalizedVolumeDelta =
    absoluteVolumeDeltaMl /
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_POLICY_V1
      .closure.volumeReferenceScaleMl;
  const normalizedPressureDelta =
    absolutePressureDeltaMmHg /
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_POLICY_V1
      .closure.pressureReferenceScaleMmHg;
  const maximumNormalizedDelta = Math.max(
    normalizedVolumeDelta,
    normalizedPressureDelta,
  );
  if (
    ![
      absoluteVolumeDeltaMl,
      absolutePressureDeltaMmHg,
      normalizedVolumeDelta,
      normalizedPressureDelta,
      maximumNormalizedDelta,
    ].every(Number.isFinite)
  ) {
    return unavailableClosureV1(start, end);
  }
  return Object.freeze({
    start,
    end,
    absoluteVolumeDeltaMl,
    absolutePressureDeltaMmHg,
    normalizedVolumeDelta,
    normalizedPressureDelta,
    maximumNormalizedDelta,
    metricsFinite: true,
    withinTolerance:
      maximumNormalizedDelta <=
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_POLICY_V1
        .closure.maximumNormalizedBoundaryDelta,
  });
}

function unavailableClosureV1(
  start: Readonly<{ volumeMl: number; pressureMmHg: number }> | null,
  end: Readonly<{ volumeMl: number; pressureMmHg: number }> | null,
): MainWireIntegratedModelPeriodicPressureBasisEndpointClosureV1 {
  return Object.freeze({
    start,
    end,
    absoluteVolumeDeltaMl: null,
    absolutePressureDeltaMmHg: null,
    normalizedVolumeDelta: null,
    normalizedPressureDelta: null,
    maximumNormalizedDelta: null,
    metricsFinite: false,
    withinTolerance: false,
  });
}

function decompositionResidualV1(
  cavityAbsolutePathWorkMmHgMl: number | null,
  ventricularTransmuralPathWorkMmHgMl: number | null,
  externalConstraintPathWorkMmHgMl: number | null,
): number | null {
  if (
    cavityAbsolutePathWorkMmHgMl === null ||
    ventricularTransmuralPathWorkMmHgMl === null ||
    externalConstraintPathWorkMmHgMl === null
  ) {
    return null;
  }
  const componentSumMmHgMl =
    ventricularTransmuralPathWorkMmHgMl + externalConstraintPathWorkMmHgMl;
  if (!Number.isFinite(componentSumMmHgMl)) return null;
  const residualMmHgMl = cavityAbsolutePathWorkMmHgMl - componentSumMmHgMl;
  if (!Number.isFinite(residualMmHgMl)) return null;
  return Object.is(residualMmHgMl, -0) ? 0 : residualMmHgMl;
}

function pressureBasisPointIsFiniteV1(
  point: MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1,
): boolean {
  return [
    point.chamberVolumeMl.LV,
    point.chamberVolumeMl.RV,
    point.absolutePressureMmHg.LV,
    point.absolutePressureMmHg.RV,
    point.transmuralPressureMmHg.LV,
    point.transmuralPressureMmHg.RV,
  ].every(Number.isFinite);
}

function workDirectionV1(
  workMmHgMl: number,
): MainWireIntegratedModelPeriodicPressureBasisWorkDirectionV1 {
  if (workMmHgMl > 0) return "net-work-by-ventricle";
  if (workMmHgMl < 0) return "net-work-on-ventricle";
  return "zero-net-work";
}
