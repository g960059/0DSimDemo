import {
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_RECTANGLES_V1,
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1,
  mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1,
} from "@/engine/myocardium/experiments/MainWireIntrinsicVentricularPassiveReducedSurfacePilotDefinitionV1";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonDefinitionV1";
import type { MainWireNormalAdultPassiveEquilibriumMatrix4V3 } from "@/engine/myocardium/experiments/MainWireNormalAdultPassiveEquilibriumCandidateEngineeringV1";
import type { MainWireNormalAdultPassiveEquilibriumMatrix2V3 } from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonDefinitionV1";

export type MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1 =
  Readonly<{
    pointId: string;
    leftVentricularIndex: number;
    rightVentricularIndex: number;
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    status: "point-available" | "point-unavailable";
    rawStoredEnergyJ: number | null;
    intrinsicPressuresPa: Readonly<{ LV: number; RV: number }> | null;
    reducedHessianPaPerM3: MainWireNormalAdultPassiveEquilibriumMatrix2V3 | null;
    terminalGatesPassed: boolean;
    analyticProjectionPassed: boolean;
  }>;

export type MainWireIntrinsicVentricularPassiveReducedHessianProjectionV1 =
  | Readonly<{
      status: "reduced-hessian-projected";
      reducedHessianPaPerM3: MainWireNormalAdultPassiveEquilibriumMatrix2V3;
      scaledReducedHessian: MainWireNormalAdultPassiveEquilibriumMatrix2V3;
      normalizedScaledAntisymmetry: number;
      analyticAntisymmetryPassed: boolean;
      failureReason: null;
    }>
  | Readonly<{
      status: "reduced-hessian-projection-failed";
      reducedHessianPaPerM3: null;
      scaledReducedHessian: null;
      normalizedScaledAntisymmetry: null;
      analyticAntisymmetryPassed: false;
      failureReason:
        "non-finite-input" | "singular-internal-block" | "non-finite-result";
    }>;

export type MainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1 =
  Readonly<{
    pointAudits: readonly Readonly<{
      pointId: string;
      available: boolean;
      terminalGatesPassed: boolean;
      analyticProjectionPassed: boolean;
      passed: boolean;
    }>[];
    energyGradientAudits: readonly Readonly<{
      auditId: string;
      pointId: string;
      chamber: "LV" | "RV";
      available: boolean;
      analyticPressurePa: number | null;
      finiteDifferencePressurePa: number | null;
      normalizedError: number | null;
      passed: boolean;
    }>[];
    reducedHessianAudits: readonly Readonly<{
      auditId: string;
      pointId: string;
      rowChamber: "LV" | "RV";
      differentiatedByChamber: "LV" | "RV";
      available: boolean;
      analyticPaPerM3: number | null;
      pressureFiniteDifferencePaPerM3: number | null;
      normalizedError: number | null;
      passed: boolean;
    }>[];
    maxwellAudits: readonly Readonly<{
      auditId: string;
      pointId: string;
      available: boolean;
      dLeftPressureDRightVolumePaPerM3: number | null;
      dRightPressureDLeftVolumePaPerM3: number | null;
      normalizedError: number | null;
      passed: boolean;
    }>[];
    rectangularPathAudits: readonly Readonly<{
      rectangleId: string;
      available: boolean;
      coarseLoopWorkJ: number | null;
      refinedLoopWorkJ: number | null;
      coarseNormalizedLoopError: number | null;
      refinedNormalizedLoopError: number | null;
      refinementTrendPassed: boolean;
      refinedAbsoluteGatePassed: boolean;
      refinedLegResidualsJ: readonly number[];
      passed: boolean;
    }>[];
    counts: Readonly<{
      pointAudits: number;
      energyGradientAudits: number;
      reducedHessianAudits: number;
      maxwellAudits: number;
      rectangularPathAudits: number;
    }>;
    pointAndProjectionAuditsPassed: boolean;
    energyGradientAuditsPassed: boolean;
    reducedHessianAuditsPassed: boolean;
    maxwellAuditsPassed: boolean;
    rectangularPathAuditsPassed: boolean;
  }>;

export function projectMainWireIntrinsicVentricularPassiveReducedHessianV1(
  coupledHessian: MainWireNormalAdultPassiveEquilibriumMatrix4V3,
): MainWireIntrinsicVentricularPassiveReducedHessianProjectionV1 {
  const h = coupledHessian.values;
  if (h.flat().some((value) => !Number.isFinite(value)))
    return failedProjectionV1("non-finite-input");
  const determinant = h[2][2] * h[3][3] - h[2][3] * h[3][2];
  if (!Number.isFinite(determinant) || determinant === 0)
    return failedProjectionV1("singular-internal-block");

  const inverseInternal = [
    [h[3][3] / determinant, -h[2][3] / determinant],
    [-h[3][2] / determinant, h[2][2] / determinant],
  ] as const;
  const projected = [
    [0, 0],
    [0, 0],
  ];
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const internalProduct0 =
        inverseInternal[0][0] * h[2][column] +
        inverseInternal[0][1] * h[3][column];
      const internalProduct1 =
        inverseInternal[1][0] * h[2][column] +
        inverseInternal[1][1] * h[3][column];
      projected[row]![column] =
        h[row][column] -
        (h[row][2] * internalProduct0 + h[row][3] * internalProduct1);
    }
  }
  if (projected.flat().some((value) => !Number.isFinite(value)))
    return failedProjectionV1("non-finite-result");

  const spans = [
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV -
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3.LV,
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV -
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3.RV,
  ] as const;
  const scaled = freezeMatrix2V1(
    projected[0]![0]! * spans[0] * spans[0],
    projected[0]![1]! * spans[0] * spans[1],
    projected[1]![0]! * spans[1] * spans[0],
    projected[1]![1]! * spans[1] * spans[1],
  );
  const maximumAbsoluteScaledComponent = Math.max(
    ...scaled.flat().map((value) => Math.abs(value)),
  );
  const normalizedScaledAntisymmetry =
    Math.abs(scaled[0][1] - scaled[1][0]) /
    Math.max(
      maximumAbsoluteScaledComponent,
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.analyticScaledAntisymmetryFloor,
    );
  return deepFreezeV1({
    status: "reduced-hessian-projected" as const,
    reducedHessianPaPerM3: freezeMatrix2V1(
      projected[0]![0]!,
      projected[0]![1]!,
      projected[1]![0]!,
      projected[1]![1]!,
    ),
    scaledReducedHessian: scaled,
    normalizedScaledAntisymmetry,
    analyticAntisymmetryPassed:
      normalizedScaledAntisymmetry <=
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.analyticScaledAntisymmetryNormalizedMaximum,
    failureReason: null,
  });
}

export function evaluateMainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1(
  points: readonly MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1[],
): MainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1 {
  const pointById = new Map(points.map((point) => [point.pointId, point]));
  const pointAudits = points.map((point) =>
    deepFreezeV1({
      pointId: point.pointId,
      available: point.status === "point-available",
      terminalGatesPassed: point.terminalGatesPassed,
      analyticProjectionPassed: point.analyticProjectionPassed,
      passed:
        point.status === "point-available" &&
        point.terminalGatesPassed &&
        point.analyticProjectionPassed,
    }),
  );

  const energyGradientAudits = [];
  for (const chamber of ["LV", "RV"] as const) {
    for (let leftIndex = 0; leftIndex <= 4; leftIndex += 1) {
      for (let rightIndex = 0; rightIndex <= 4; rightIndex += 1) {
        const differentiatedIndex = chamber === "LV" ? leftIndex : rightIndex;
        if (differentiatedIndex < 1 || differentiatedIndex > 3) continue;
        const center = pointAtV1(pointById, leftIndex, rightIndex);
        const minusIndex = pointAtV1(
          pointById,
          chamber === "LV" ? leftIndex - 1 : leftIndex,
          chamber === "RV" ? rightIndex - 1 : rightIndex,
        );
        const plusIndex = pointAtV1(
          pointById,
          chamber === "LV" ? leftIndex + 1 : leftIndex,
          chamber === "RV" ? rightIndex + 1 : rightIndex,
        );
        const available = pointsAvailableV1(center, minusIndex, plusIndex);
        const analyticPressurePa = available
          ? center!.intrinsicPressuresPa![chamber]
          : null;
        const stepM3 = gridStepV1(chamber);
        const finiteDifferencePressurePa = available
          ? (minusIndex!.rawStoredEnergyJ! - plusIndex!.rawStoredEnergyJ!) /
            (2 * stepM3)
          : null;
        const normalizedError =
          analyticPressurePa !== null && finiteDifferencePressurePa !== null
            ? Math.abs(finiteDifferencePressurePa - analyticPressurePa) /
              Math.max(
                Math.abs(analyticPressurePa),
                MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.energyGradientPressureFloorPa,
              )
            : null;
        energyGradientAudits.push(
          deepFreezeV1({
            auditId: `energy-gradient-${chamber.toLowerCase()}-lv-${leftIndex}-rv-${rightIndex}`,
            pointId:
              mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1(
                leftIndex,
                rightIndex,
              ),
            chamber,
            available,
            analyticPressurePa,
            finiteDifferencePressurePa,
            normalizedError,
            passed:
              normalizedError !== null &&
              Number.isFinite(normalizedError) &&
              normalizedError <=
                MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.energyGradientNormalizedErrorMaximum,
          }),
        );
      }
    }
  }

  const reducedHessianAudits = [];
  const maxwellAudits = [];
  for (let leftIndex = 1; leftIndex <= 3; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= 3; rightIndex += 1) {
      const center = pointAtV1(pointById, leftIndex, rightIndex);
      const leftMinus = pointAtV1(pointById, leftIndex - 1, rightIndex);
      const leftPlus = pointAtV1(pointById, leftIndex + 1, rightIndex);
      const rightMinus = pointAtV1(pointById, leftIndex, rightIndex - 1);
      const rightPlus = pointAtV1(pointById, leftIndex, rightIndex + 1);
      const available = pointsAvailableV1(
        center,
        leftMinus,
        leftPlus,
        rightMinus,
        rightPlus,
      );
      const derivativeByColumn = {
        LV: available
          ? pressureDerivativeV1(leftMinus!, leftPlus!, "LV")
          : null,
        RV: available
          ? pressureDerivativeV1(rightMinus!, rightPlus!, "RV")
          : null,
      };
      for (const [rowIndex, rowChamber] of ["LV", "RV"].entries()) {
        for (const [columnIndex, differentiatedByChamber] of [
          "LV",
          "RV",
        ].entries()) {
          const analyticPaPerM3 = available
            ? center!.reducedHessianPaPerM3![rowIndex]![columnIndex]!
            : null;
          const pressureFiniteDifferencePaPerM3 = available
            ? derivativeByColumn[differentiatedByChamber as "LV" | "RV"]![
                rowChamber as "LV" | "RV"
              ]
            : null;
          const normalizedError =
            analyticPaPerM3 !== null && pressureFiniteDifferencePaPerM3 !== null
              ? Math.abs(pressureFiniteDifferencePaPerM3 - analyticPaPerM3) /
                Math.max(
                  Math.abs(analyticPaPerM3),
                  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.reducedHessianFloorPaPerM3,
                )
              : null;
          reducedHessianAudits.push(
            deepFreezeV1({
              auditId: `reduced-hessian-${rowChamber.toLowerCase()}-by-${differentiatedByChamber.toLowerCase()}-lv-${leftIndex}-rv-${rightIndex}`,
              pointId:
                mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1(
                  leftIndex,
                  rightIndex,
                ),
              rowChamber: rowChamber as "LV" | "RV",
              differentiatedByChamber: differentiatedByChamber as "LV" | "RV",
              available,
              analyticPaPerM3,
              pressureFiniteDifferencePaPerM3,
              normalizedError,
              passed:
                normalizedError !== null &&
                Number.isFinite(normalizedError) &&
                normalizedError <=
                  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.reducedHessianNormalizedErrorMaximum,
            }),
          );
        }
      }
      const leftByRight = available ? derivativeByColumn.RV!.LV : null;
      const rightByLeft = available ? derivativeByColumn.LV!.RV : null;
      const normalizedMaxwellError =
        leftByRight !== null && rightByLeft !== null
          ? Math.abs(leftByRight - rightByLeft) /
            Math.max(
              Math.abs(leftByRight),
              Math.abs(rightByLeft),
              MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.reducedHessianFloorPaPerM3,
            )
          : null;
      maxwellAudits.push(
        deepFreezeV1({
          auditId: `maxwell-pressure-fd-lv-${leftIndex}-rv-${rightIndex}`,
          pointId:
            mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1(
              leftIndex,
              rightIndex,
            ),
          available,
          dLeftPressureDRightVolumePaPerM3: leftByRight,
          dRightPressureDLeftVolumePaPerM3: rightByLeft,
          normalizedError: normalizedMaxwellError,
          passed:
            normalizedMaxwellError !== null &&
            Number.isFinite(normalizedMaxwellError) &&
            normalizedMaxwellError <=
              MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.pressureFiniteDifferenceMaxwellNormalizedErrorMaximum,
        }),
      );
    }
  }

  const rectangularPathAudits =
    MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_RECTANGLES_V1.map(
      (rectangle) =>
        rectangularPathAuditV1(
          pointById,
          rectangle.rectangleId,
          rectangle.leftVentricularIndex,
          rectangle.rightVentricularIndex,
        ),
    );

  return deepFreezeV1({
    pointAudits,
    energyGradientAudits,
    reducedHessianAudits,
    maxwellAudits,
    rectangularPathAudits,
    counts: {
      pointAudits: pointAudits.length,
      energyGradientAudits: energyGradientAudits.length,
      reducedHessianAudits: reducedHessianAudits.length,
      maxwellAudits: maxwellAudits.length,
      rectangularPathAudits: rectangularPathAudits.length,
    },
    pointAndProjectionAuditsPassed:
      pointAudits.length === 25 && pointAudits.every((audit) => audit.passed),
    energyGradientAuditsPassed:
      energyGradientAudits.length === 30 &&
      energyGradientAudits.every((audit) => audit.passed),
    reducedHessianAuditsPassed:
      reducedHessianAudits.length === 36 &&
      reducedHessianAudits.every((audit) => audit.passed),
    maxwellAuditsPassed:
      maxwellAudits.length === 9 &&
      maxwellAudits.every((audit) => audit.passed),
    rectangularPathAuditsPassed:
      rectangularPathAudits.length === 4 &&
      rectangularPathAudits.every((audit) => audit.passed),
  });
}

function rectangularPathAuditV1(
  pointById: ReadonlyMap<
    string,
    MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1
  >,
  rectangleId: string,
  leftIndex: number,
  rightIndex: number,
): MainWireIntrinsicVentricularPassiveReducedSurfaceMathematicalAuditsV1["rectangularPathAudits"][number] {
  const a = pointAtV1(pointById, leftIndex, rightIndex);
  const ab = pointAtV1(pointById, leftIndex + 1, rightIndex);
  const b = pointAtV1(pointById, leftIndex + 2, rightIndex);
  const bc = pointAtV1(pointById, leftIndex + 2, rightIndex + 1);
  const c = pointAtV1(pointById, leftIndex + 2, rightIndex + 2);
  const cd = pointAtV1(pointById, leftIndex + 1, rightIndex + 2);
  const d = pointAtV1(pointById, leftIndex, rightIndex + 2);
  const da = pointAtV1(pointById, leftIndex, rightIndex + 1);
  const available = pointsAvailableV1(a, ab, b, bc, c, cd, d, da);
  if (!available)
    return deepFreezeV1({
      rectangleId,
      available: false,
      coarseLoopWorkJ: null,
      refinedLoopWorkJ: null,
      coarseNormalizedLoopError: null,
      refinedNormalizedLoopError: null,
      refinementTrendPassed: false,
      refinedAbsoluteGatePassed: false,
      refinedLegResidualsJ: [],
      passed: false,
    });

  const coarseSegments = [
    segmentV1(a!, b!, "LV"),
    segmentV1(b!, c!, "RV"),
    segmentV1(c!, d!, "LV"),
    segmentV1(d!, a!, "RV"),
  ];
  const refinedSegments = [
    segmentV1(a!, ab!, "LV"),
    segmentV1(ab!, b!, "LV"),
    segmentV1(b!, bc!, "RV"),
    segmentV1(bc!, c!, "RV"),
    segmentV1(c!, cd!, "LV"),
    segmentV1(cd!, d!, "LV"),
    segmentV1(d!, da!, "RV"),
    segmentV1(da!, a!, "RV"),
  ];
  const coarseLoopWorkJ = coarseSegments.reduce(
    (sum, segment) => sum + segment.workJ,
    0,
  );
  const refinedLoopWorkJ = refinedSegments.reduce(
    (sum, segment) => sum + segment.workJ,
    0,
  );
  const coarseNormalizedLoopError =
    Math.abs(coarseLoopWorkJ) /
    Math.max(
      coarseSegments.reduce((sum, segment) => sum + Math.abs(segment.workJ), 0),
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.pathWorkAbsoluteFloorJ,
    );
  const refinedNormalizedLoopError =
    Math.abs(refinedLoopWorkJ) /
    Math.max(
      refinedSegments.reduce(
        (sum, segment) => sum + Math.abs(segment.workJ),
        0,
      ),
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.pathWorkAbsoluteFloorJ,
    );
  const refinementTrendPassed =
    Math.abs(refinedLoopWorkJ) <=
    Math.max(
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.pathRefinementRatioMaximum *
        Math.abs(coarseLoopWorkJ),
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.pathRefinementAbsoluteFloorJ,
    );
  const refinedAbsoluteGatePassed =
    refinedNormalizedLoopError <=
    MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.pathLoopRefinedNormalizedMaximum;
  return deepFreezeV1({
    rectangleId,
    available: true,
    coarseLoopWorkJ,
    refinedLoopWorkJ,
    coarseNormalizedLoopError,
    refinedNormalizedLoopError,
    refinementTrendPassed,
    refinedAbsoluteGatePassed,
    refinedLegResidualsJ: refinedSegments.map(
      (segment) => segment.workJ - segment.energyDifferenceJ,
    ),
    passed: refinementTrendPassed && refinedAbsoluteGatePassed,
  });
}

function segmentV1(
  start: MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1,
  end: MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1,
  chamber: "LV" | "RV",
): Readonly<{ workJ: number; energyDifferenceJ: number }> {
  const deltaVolumeM3 =
    end.chamberVolumesM3[chamber] - start.chamberVolumesM3[chamber];
  return {
    workJ:
      0.5 *
      (start.intrinsicPressuresPa![chamber] +
        end.intrinsicPressuresPa![chamber]) *
      deltaVolumeM3,
    energyDifferenceJ: end.rawStoredEnergyJ! - start.rawStoredEnergyJ!,
  };
}

function pressureDerivativeV1(
  minusIndex: MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1,
  plusIndex: MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1,
  differentiatedByChamber: "LV" | "RV",
): Readonly<{ LV: number; RV: number }> {
  const denominator = 2 * gridStepV1(differentiatedByChamber);
  return {
    LV:
      (minusIndex.intrinsicPressuresPa!.LV -
        plusIndex.intrinsicPressuresPa!.LV) /
      denominator,
    RV:
      (minusIndex.intrinsicPressuresPa!.RV -
        plusIndex.intrinsicPressuresPa!.RV) /
      denominator,
  };
}

function gridStepV1(chamber: "LV" | "RV"): number {
  return (
    (MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3[
      chamber
    ] -
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3[
        chamber
      ]) /
    32
  );
}

function pointAtV1(
  pointById: ReadonlyMap<
    string,
    MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1
  >,
  leftIndex: number,
  rightIndex: number,
): MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1 | undefined {
  return pointById.get(
    mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1(
      leftIndex,
      rightIndex,
    ),
  );
}

function pointsAvailableV1(
  ...points: readonly (
    MainWireIntrinsicVentricularPassiveReducedSurfaceMathPointV1 | undefined
  )[]
): boolean {
  return points.every(
    (point) =>
      point !== undefined &&
      point.status === "point-available" &&
      point.rawStoredEnergyJ !== null &&
      point.intrinsicPressuresPa !== null &&
      point.reducedHessianPaPerM3 !== null,
  );
}

function failedProjectionV1(
  failureReason: Extract<
    MainWireIntrinsicVentricularPassiveReducedHessianProjectionV1,
    { status: "reduced-hessian-projection-failed" }
  >["failureReason"],
): MainWireIntrinsicVentricularPassiveReducedHessianProjectionV1 {
  return deepFreezeV1({
    status: "reduced-hessian-projection-failed" as const,
    reducedHessianPaPerM3: null,
    scaledReducedHessian: null,
    normalizedScaledAntisymmetry: null,
    analyticAntisymmetryPassed: false as const,
    failureReason,
  });
}

function freezeMatrix2V1(
  h00: number,
  h01: number,
  h10: number,
  h11: number,
): MainWireNormalAdultPassiveEquilibriumMatrix2V3 {
  return Object.freeze([
    Object.freeze([h00, h01] as const),
    Object.freeze([h10, h11] as const),
  ] as const);
}

function deepFreezeV1<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreezeV1(child);
    Object.freeze(value);
  }
  return value;
}
