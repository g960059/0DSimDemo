import {
  evaluateHillPassiveEquilibriumV1,
  type HillCeSeeSlsParamsV1,
} from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";
import {
  solveTriSegAlgebraicEquilibriumV1,
  triSegWallTensionsFromFiberStressesV1,
  type TriSegAlgebraicCoordinatesV1,
  type TriSegGeometryBaseInputV1,
  type TriSegGeometryValidOutputV1,
  type TriSegVirtualWorkValidOutputV1,
  type TriSegWallIdV1,
} from "@/engine/mechanics2/geometry/TriSegGeometryV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  type NoAvpdFourChamberHillTriSegParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

const WALL_IDS = ["leftFreeWall", "septum", "rightFreeWall"] as const;

export const NO_AVPD_PASSIVE_LV_EDPVR_VOLUME_GRID_ML_V1 = Object.freeze(
  Array.from({ length: 25 }, (_, index) => 60 + 5 * index),
);

export type NoAvpdPassiveLvEdpvrBoundaryV1 = {
  readonly targetRvTransmuralPressureMmHg: number;
  readonly externalPressureMmHg: 0;
  readonly rvVolumeSearchMl: readonly [number, number];
  readonly rvVolumeScanStepMl: number;
  readonly rvPressureToleranceMmHg: number;
  readonly rvVolumeToleranceMl: number;
  readonly maximumOuterIterations: number;
  readonly triSegRelativeResidualTolerance: number;
  readonly triSegMaximumIterations: number;
};

export const DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1:
NoAvpdPassiveLvEdpvrBoundaryV1 = Object.freeze({
  targetRvTransmuralPressureMmHg: 5,
  externalPressureMmHg: 0,
  rvVolumeSearchMl: Object.freeze([20, 400] as const),
  rvVolumeScanStepMl: 10,
  rvPressureToleranceMmHg: 1e-4,
  rvVolumeToleranceMl: 1e-6,
  maximumOuterIterations: 64,
  triSegRelativeResidualTolerance: 1e-9,
  triSegMaximumIterations: 80,
});

export const NO_AVPD_PASSIVE_LV_EDPVR_PROTOCOL_V1 = Object.freeze({
  protocolId: "no-avpd-passive-lv-edpvr-fixed-rv-load-v1",
  evidenceStatus: "component-mechanics-only-not-clinical-edpvr-validation",
  chamberRelation:
    "P_LV_transmural(V_LV | declared-fixed-P_RV_transmural, external-pressure=0)",
  activation: "exactly-zero-all-three-ventricular-walls",
  serialActiveBranch: "unloaded-zero-tension",
  sls: "fully-relaxed-zero-overstress-independent-at-each-volume",
  septum: "free-algebraic-triseg-equilibrium-not-fixed-position",
  circulation: "absent-no-valves-no-atria-no-vascular-load",
  volumeGridMl: NO_AVPD_PASSIVE_LV_EDPVR_VOLUME_GRID_ML_V1,
  curveDerivative:
    "centered-secant-of-independent-relaxed-pressure-points-not-algorithmic-sls-tangent",
  outerRootUniqueness:
    "single-sign-change-or-exact-root-on-declared-discrete-rv-scan-with-no-inner-failures-and-monotone-sampled-pressure-not-global-proof",
  claimBoundary:
    "passive-biventricular-triseg-chamber-slice-not-isolated-lv-wall-and-not-dynamic-filling",
});

export type NoAvpdPassiveWallReadbackV1 = {
  readonly fiberNaturalStrain: number;
  readonly passiveEquilibriumStressPa: number;
  readonly passiveEquilibriumTangentPa: number;
  readonly passiveEquilibriumStorageJPerM3: number;
  readonly passiveEquilibriumStorageJ: number;
  readonly contractileElementTensionPa: 0;
  readonly seriesElasticTensionPa: 0;
  readonly slsOverstressPa: 0;
  readonly totalTransmittedPa: number;
  readonly activation01: 0;
};

export type NoAvpdPassiveLvEdpvrOuterScanSampleV1 = {
  readonly rvVolumeMl: number;
  readonly status: "available" | "inner-unavailable";
  readonly rvTransmuralPressureMmHg: number | null;
  readonly targetResidualMmHg: number | null;
  readonly failureReason: string | null;
};

export type NoAvpdPassiveLvEdpvrBracketV1 = {
  readonly lowerRvVolumeMl: number;
  readonly upperRvVolumeMl: number;
  readonly lowerTargetResidualMmHg: number;
  readonly upperTargetResidualMmHg: number;
};

type NoAvpdPassiveLvEdpvrPointCommonV1 = {
  readonly lvVolumeMl: number;
  readonly targetRvTransmuralPressureMmHg: number;
  readonly externalPressureMmHg: 0;
  readonly centeredSecantPressureSlopeMmHgPerMl: number | null;
  readonly outerDiagnostics: {
    readonly scan: readonly NoAvpdPassiveLvEdpvrOuterScanSampleV1[];
    readonly validScanPointCount: number;
    readonly innerFailureCount: number;
    readonly sampledRvPressureMonotoneNondecreasing: boolean;
    readonly brackets: readonly NoAvpdPassiveLvEdpvrBracketV1[];
    readonly outerIterations: number;
    readonly innerTriSegSolveCount: number;
  };
};

export type NoAvpdPassiveLvEdpvrAvailablePointV1 =
NoAvpdPassiveLvEdpvrPointCommonV1 & {
  readonly status: "available";
  readonly failureReason: null;
  readonly rvVolumeMl: number;
  readonly lvTransmuralPressureMmHg: number;
  readonly rvTransmuralPressureMmHg: number;
  readonly rvPressureTargetResidualMmHg: number;
  readonly triSegCoordinates: TriSegAlgebraicCoordinatesV1;
  readonly triSegRelativeResidual: number;
  readonly triSegVirtualWorkIdentityResiduals: TriSegVirtualWorkValidOutputV1[
  "virtualWorkIdentityResiduals"
  ];
  readonly triSegIterations: number;
  readonly triSegFunctionEvaluations: number;
  readonly walls: Readonly<Record<TriSegWallIdV1, NoAvpdPassiveWallReadbackV1>>;
  readonly totalPassiveStoredEnergyJ: number;
};

export type NoAvpdPassiveLvEdpvrFailedPointV1 =
NoAvpdPassiveLvEdpvrPointCommonV1 & {
  readonly status: "unavailable" | "ambiguous";
  readonly failureReason: string;
  readonly rvVolumeMl: null;
  readonly lvTransmuralPressureMmHg: null;
  readonly rvTransmuralPressureMmHg: null;
  readonly rvPressureTargetResidualMmHg: null;
  readonly triSegCoordinates: null;
  readonly triSegRelativeResidual: null;
  readonly triSegVirtualWorkIdentityResiduals: null;
  readonly triSegIterations: null;
  readonly triSegFunctionEvaluations: null;
  readonly walls: null;
  readonly totalPassiveStoredEnergyJ: null;
};

export type NoAvpdPassiveLvEdpvrPointV1 =
  | NoAvpdPassiveLvEdpvrAvailablePointV1
  | NoAvpdPassiveLvEdpvrFailedPointV1;

export type NoAvpdPassiveLvEdpvrReportV1 = {
  readonly protocol: typeof NO_AVPD_PASSIVE_LV_EDPVR_PROTOCOL_V1;
  readonly boundary: NoAvpdPassiveLvEdpvrBoundaryV1;
  readonly parameterSnapshot: NoAvpdFourChamberHillTriSegParamsV1;
  readonly points: readonly NoAvpdPassiveLvEdpvrPointV1[];
  readonly summary: {
    readonly requestedPointCount: number;
    readonly availablePointCount: number;
    readonly unavailablePointCount: number;
    readonly ambiguousPointCount: number;
    readonly allPointsAvailable: boolean;
    readonly pressureNondecreasingAcrossAvailableAdjacentPoints: boolean;
    readonly minimumCenteredSecantSlopeMmHgPerMl: number | null;
    readonly maximumCenteredSecantSlopeMmHgPerMl: number | null;
  };
};

type FixedVolumeAvailable = {
  readonly status: "available";
  readonly rvVolumeMl: number;
  readonly triSegCoordinates: TriSegAlgebraicCoordinatesV1;
  readonly virtualWork: TriSegVirtualWorkValidOutputV1;
  readonly triSegRelativeResidual: number;
  readonly triSegIterations: number;
  readonly triSegFunctionEvaluations: number;
  readonly walls: Readonly<Record<TriSegWallIdV1, NoAvpdPassiveWallReadbackV1>>;
  readonly totalPassiveStoredEnergyJ: number;
};

type FixedVolumeUnavailable = {
  readonly status: "unavailable";
  readonly rvVolumeMl: number;
  readonly failureReason: string;
};

type FixedVolumeEvaluation = FixedVolumeAvailable | FixedVolumeUnavailable;

export function evaluateNoAvpdPassiveLvEdpvrPointV1(
  lvVolumeMl: number,
  params: NoAvpdFourChamberHillTriSegParamsV1 =
    DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  boundary: NoAvpdPassiveLvEdpvrBoundaryV1 =
    DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1,
): NoAvpdPassiveLvEdpvrPointV1 {
  const boundaryFailure = validatePointInput(lvVolumeMl, boundary);
  if (boundaryFailure !== null) {
    return failedPoint(
      "unavailable",
      boundaryFailure,
      lvVolumeMl,
      boundary,
      [],
      [],
      0,
      0,
    );
  }

  let innerTriSegSolveCount = 0;
  const evaluate = (rvVolumeMl: number): FixedVolumeEvaluation => {
    innerTriSegSolveCount += 1;
    return evaluateFixedVolumes(lvVolumeMl, rvVolumeMl, params, boundary);
  };
  const scanEvaluations: FixedVolumeEvaluation[] = [];
  const [minimumRvVolumeMl, maximumRvVolumeMl] = boundary.rvVolumeSearchMl;
  for (
    let rvVolumeMl = minimumRvVolumeMl;
    rvVolumeMl < maximumRvVolumeMl - 1e-12;
    rvVolumeMl += boundary.rvVolumeScanStepMl
  ) {
    scanEvaluations.push(evaluate(rvVolumeMl));
  }
  scanEvaluations.push(evaluate(maximumRvVolumeMl));

  const scan = scanEvaluations.map((sample): NoAvpdPassiveLvEdpvrOuterScanSampleV1 => {
    if (sample.status === "unavailable") {
      return {
        rvVolumeMl: sample.rvVolumeMl,
        status: "inner-unavailable",
        rvTransmuralPressureMmHg: null,
        targetResidualMmHg: null,
        failureReason: sample.failureReason,
      };
    }
    const pressure = sample.virtualWork.pressures.rightVentricleTransmuralMmHg;
    return {
      rvVolumeMl: sample.rvVolumeMl,
      status: "available",
      rvTransmuralPressureMmHg: pressure,
      targetResidualMmHg: pressure - boundary.targetRvTransmuralPressureMmHg,
      failureReason: null,
    };
  });
  const validScanPointCount = scan.filter((sample) => sample.status === "available").length;
  const innerFailureCount = scan.length - validScanPointCount;
  const brackets = findUniquePressureBrackets(scan, boundary.rvPressureToleranceMmHg);
  const sampledRvPressureMonotoneNondecreasing = scanIsPressureMonotone(scan);

  if (innerFailureCount > 0) {
    return failedPoint(
      "unavailable",
      "RV-pressure scan contains inner TriSeg failures, so root uniqueness cannot be established",
      lvVolumeMl,
      boundary,
      scan,
      brackets,
      0,
      innerTriSegSolveCount,
      sampledRvPressureMonotoneNondecreasing,
    );
  }
  if (!sampledRvPressureMonotoneNondecreasing) {
    return failedPoint(
      "ambiguous",
      "sampled RV pressure is non-monotone over the declared search interval",
      lvVolumeMl,
      boundary,
      scan,
      brackets,
      0,
      innerTriSegSolveCount,
      false,
    );
  }

  if (brackets.length === 0) {
    return failedPoint(
      "unavailable",
      "no RV-volume bracket reaches the prescribed RV transmural pressure",
      lvVolumeMl,
      boundary,
      scan,
      brackets,
      0,
      innerTriSegSolveCount,
      sampledRvPressureMonotoneNondecreasing,
    );
  }
  if (brackets.length > 1) {
    return failedPoint(
      "ambiguous",
      `multiple RV-volume brackets (${brackets.length}) reach the prescribed RV pressure`,
      lvVolumeMl,
      boundary,
      scan,
      brackets,
      0,
      innerTriSegSolveCount,
      sampledRvPressureMonotoneNondecreasing,
    );
  }

  const bracket = brackets[0]!;
  let selected: FixedVolumeAvailable | null = null;
  let outerIterations = 0;
  if (bracket.lowerRvVolumeMl === bracket.upperRvVolumeMl) {
    const exact = scanEvaluations.find((sample) =>
      sample.status === "available" && sample.rvVolumeMl === bracket.lowerRvVolumeMl
    );
    selected = exact?.status === "available" ? exact : null;
  } else {
    let lowerVolume = bracket.lowerRvVolumeMl;
    let upperVolume = bracket.upperRvVolumeMl;
    let lowerResidual = bracket.lowerTargetResidualMmHg;
    for (let iteration = 1; iteration <= boundary.maximumOuterIterations; iteration += 1) {
      outerIterations = iteration;
      const midpointVolume = 0.5 * (lowerVolume + upperVolume);
      const midpoint = evaluate(midpointVolume);
      if (midpoint.status === "unavailable") {
        return failedPoint(
          "unavailable",
          `inner TriSeg solve failed inside the RV-pressure bracket: ${midpoint.failureReason}`,
          lvVolumeMl,
          boundary,
          scan,
          brackets,
          outerIterations,
          innerTriSegSolveCount,
          sampledRvPressureMonotoneNondecreasing,
        );
      }
      const midpointResidual = midpoint.virtualWork.pressures.rightVentricleTransmuralMmHg
        - boundary.targetRvTransmuralPressureMmHg;
      if (
        Math.abs(midpointResidual) <= boundary.rvPressureToleranceMmHg
        || upperVolume - lowerVolume <= boundary.rvVolumeToleranceMl
      ) {
        selected = midpoint;
        break;
      }
      if (Math.sign(midpointResidual) === Math.sign(lowerResidual)) {
        lowerVolume = midpointVolume;
        lowerResidual = midpointResidual;
      } else {
        upperVolume = midpointVolume;
      }
    }
  }

  if (selected === null) {
    return failedPoint(
      "unavailable",
      "RV-pressure bisection did not converge",
      lvVolumeMl,
      boundary,
      scan,
      brackets,
      outerIterations,
      innerTriSegSolveCount,
      sampledRvPressureMonotoneNondecreasing,
    );
  }
  const rvPressure = selected.virtualWork.pressures.rightVentricleTransmuralMmHg;
  const rvPressureResidual = rvPressure - boundary.targetRvTransmuralPressureMmHg;
  if (Math.abs(rvPressureResidual) > boundary.rvPressureToleranceMmHg) {
    return failedPoint(
      "unavailable",
      `RV pressure residual ${rvPressureResidual} exceeded tolerance`,
      lvVolumeMl,
      boundary,
      scan,
      brackets,
      outerIterations,
      innerTriSegSolveCount,
      sampledRvPressureMonotoneNondecreasing,
    );
  }

  return {
    status: "available",
    failureReason: null,
    lvVolumeMl,
    targetRvTransmuralPressureMmHg: boundary.targetRvTransmuralPressureMmHg,
    externalPressureMmHg: 0,
    centeredSecantPressureSlopeMmHgPerMl: null,
    rvVolumeMl: selected.rvVolumeMl,
    lvTransmuralPressureMmHg: selected.virtualWork.pressures.leftVentricleTransmuralMmHg,
    rvTransmuralPressureMmHg: rvPressure,
    rvPressureTargetResidualMmHg: rvPressureResidual,
    triSegCoordinates: selected.triSegCoordinates,
    triSegRelativeResidual: selected.triSegRelativeResidual,
    triSegVirtualWorkIdentityResiduals: selected.virtualWork.virtualWorkIdentityResiduals,
    triSegIterations: selected.triSegIterations,
    triSegFunctionEvaluations: selected.triSegFunctionEvaluations,
    walls: selected.walls,
    totalPassiveStoredEnergyJ: selected.totalPassiveStoredEnergyJ,
    outerDiagnostics: {
      scan,
      validScanPointCount,
      innerFailureCount,
      sampledRvPressureMonotoneNondecreasing,
      brackets,
      outerIterations,
      innerTriSegSolveCount,
    },
  };
}

export function runNoAvpdPassiveLvEdpvrBenchV1(
  params: NoAvpdFourChamberHillTriSegParamsV1 =
    DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  boundary: NoAvpdPassiveLvEdpvrBoundaryV1 =
    DEFAULT_NO_AVPD_PASSIVE_LV_EDPVR_BOUNDARY_V1,
): NoAvpdPassiveLvEdpvrReportV1 {
  const rawPoints = NO_AVPD_PASSIVE_LV_EDPVR_VOLUME_GRID_ML_V1.map((volume) =>
    evaluateNoAvpdPassiveLvEdpvrPointV1(volume, params, boundary)
  );
  const points = rawPoints.map((point, index): NoAvpdPassiveLvEdpvrPointV1 => {
    const previous = rawPoints[index - 1];
    const next = rawPoints[index + 1];
    if (
      point.status !== "available"
      || previous?.status !== "available"
      || next?.status !== "available"
    ) {
      return point;
    }
    return {
      ...point,
      centeredSecantPressureSlopeMmHgPerMl:
        (next.lvTransmuralPressureMmHg - previous.lvTransmuralPressureMmHg)
        / (next.lvVolumeMl - previous.lvVolumeMl),
    };
  });
  const availablePoints = points.filter(
    (point): point is NoAvpdPassiveLvEdpvrAvailablePointV1 => point.status === "available",
  );
  const slopes = availablePoints
    .map((point) => point.centeredSecantPressureSlopeMmHgPerMl)
    .filter((value): value is number => value !== null);
  const pressureNondecreasing = points.every((point, index) => {
    if (index === 0) return true;
    const previous = points[index - 1]!;
    return point.status !== "available"
      || previous.status !== "available"
      || point.lvTransmuralPressureMmHg >= previous.lvTransmuralPressureMmHg - 1e-9;
  });

  return {
    protocol: NO_AVPD_PASSIVE_LV_EDPVR_PROTOCOL_V1,
    boundary,
    parameterSnapshot: params,
    points,
    summary: {
      requestedPointCount: points.length,
      availablePointCount: availablePoints.length,
      unavailablePointCount: points.filter((point) => point.status === "unavailable").length,
      ambiguousPointCount: points.filter((point) => point.status === "ambiguous").length,
      allPointsAvailable: availablePoints.length === points.length,
      pressureNondecreasingAcrossAvailableAdjacentPoints: pressureNondecreasing,
      minimumCenteredSecantSlopeMmHgPerMl: slopes.length > 0 ? Math.min(...slopes) : null,
      maximumCenteredSecantSlopeMmHgPerMl: slopes.length > 0 ? Math.max(...slopes) : null,
    },
  };
}

function evaluateFixedVolumes(
  lvVolumeMl: number,
  rvVolumeMl: number,
  params: NoAvpdFourChamberHillTriSegParamsV1,
  boundary: NoAvpdPassiveLvEdpvrBoundaryV1,
): FixedVolumeEvaluation {
  const input = triSegBaseInput(lvVolumeMl, rvVolumeMl, params);
  const solution = solveTriSegAlgebraicEquilibriumV1(
    input,
    (geometry) => {
      const stresses = passiveWallStresses(geometry, params);
      const tensions = triSegWallTensionsFromFiberStressesV1(geometry, stresses);
      if (tensions === null) throw new Error("passive stress-to-tension mapping failed");
      return tensions;
    },
    undefined,
    {
      maxIterations: boundary.triSegMaximumIterations,
      relativeResidualTolerance: boundary.triSegRelativeResidualTolerance,
    },
  );
  if (!solution.converged || !solution.geometry.valid || solution.virtualWork === null) {
    return {
      status: "unavailable",
      rvVolumeMl,
      failureReason: solution.diagnostics.failureReason
        ?? `TriSeg terminated with ${solution.diagnostics.termination}`,
    };
  }
  try {
    const walls = passiveWallReadbacks(solution.geometry, params);
    return {
      status: "available",
      rvVolumeMl,
      triSegCoordinates: solution.coordinates,
      virtualWork: solution.virtualWork,
      triSegRelativeResidual: solution.diagnostics.relativeResidualMagnitude,
      triSegIterations: solution.diagnostics.iterations,
      triSegFunctionEvaluations: solution.diagnostics.functionEvaluations,
      walls,
      totalPassiveStoredEnergyJ: WALL_IDS.reduce(
        (sum, wallId) => sum + walls[wallId].passiveEquilibriumStorageJ,
        0,
      ),
    };
  } catch (error) {
    return {
      status: "unavailable",
      rvVolumeMl,
      failureReason: error instanceof Error ? error.message : String(error),
    };
  }
}

function passiveWallStresses(
  geometry: TriSegGeometryValidOutputV1,
  params: NoAvpdFourChamberHillTriSegParamsV1,
): Readonly<Record<TriSegWallIdV1, number>> {
  return {
    leftFreeWall: requirePassiveEvaluation(
      geometry.walls.leftFreeWall.fiberNaturalStrain,
      params.triSeg.leftFreeWall.material,
    ).stressPa,
    septum: requirePassiveEvaluation(
      geometry.walls.septum.fiberNaturalStrain,
      params.triSeg.septum.material,
    ).stressPa,
    rightFreeWall: requirePassiveEvaluation(
      geometry.walls.rightFreeWall.fiberNaturalStrain,
      params.triSeg.rightFreeWall.material,
    ).stressPa,
  };
}

function passiveWallReadbacks(
  geometry: TriSegGeometryValidOutputV1,
  params: NoAvpdFourChamberHillTriSegParamsV1,
): Readonly<Record<TriSegWallIdV1, NoAvpdPassiveWallReadbackV1>> {
  const wallReadback = (wallId: TriSegWallIdV1): NoAvpdPassiveWallReadbackV1 => {
    const wall = geometry.walls[wallId];
    const passive = requirePassiveEvaluation(wall.fiberNaturalStrain, params.triSeg[wallId].material);
    return {
      fiberNaturalStrain: wall.fiberNaturalStrain,
      passiveEquilibriumStressPa: passive.stressPa,
      passiveEquilibriumTangentPa: passive.tangentPa,
      passiveEquilibriumStorageJPerM3: passive.storageJPerM3,
      passiveEquilibriumStorageJ: passive.storageJPerM3 * wall.wallVolumeM3,
      contractileElementTensionPa: 0,
      seriesElasticTensionPa: 0,
      slsOverstressPa: 0,
      totalTransmittedPa: passive.stressPa,
      activation01: 0,
    };
  };
  return {
    leftFreeWall: wallReadback("leftFreeWall"),
    septum: wallReadback("septum"),
    rightFreeWall: wallReadback("rightFreeWall"),
  };
}

function requirePassiveEvaluation(
  strain: number,
  material: HillCeSeeSlsParamsV1,
): { readonly stressPa: number; readonly tangentPa: number; readonly storageJPerM3: number } {
  const passive = evaluateHillPassiveEquilibriumV1(strain, material);
  if (!passive.valid) {
    throw new Error(passive.failureReason ?? "passive equilibrium evaluation failed");
  }
  return {
    stressPa: passive.stressPa,
    tangentPa: passive.tangentPa,
    storageJPerM3: passive.storageJPerM3,
  };
}

function triSegBaseInput(
  lvVolumeMl: number,
  rvVolumeMl: number,
  params: NoAvpdFourChamberHillTriSegParamsV1,
): TriSegGeometryBaseInputV1 {
  const wall = (wallId: TriSegWallIdV1) => ({
    wallVolumeMl: params.triSeg[wallId].wallVolumeMl,
    referenceMidwallAreaCm2: params.triSeg[wallId].referenceMidwallAreaCm2,
  });
  return {
    leftVentricleCavityVolumeMl: lvVolumeMl,
    rightVentricleCavityVolumeMl: rvVolumeMl,
    walls: {
      leftFreeWall: wall("leftFreeWall"),
      septum: wall("septum"),
      rightFreeWall: wall("rightFreeWall"),
    },
  };
}

function findUniquePressureBrackets(
  scan: readonly NoAvpdPassiveLvEdpvrOuterScanSampleV1[],
  pressureToleranceMmHg: number,
): readonly NoAvpdPassiveLvEdpvrBracketV1[] {
  const brackets: NoAvpdPassiveLvEdpvrBracketV1[] = [];
  for (const sample of scan) {
    if (
      sample.status === "available"
      && sample.targetResidualMmHg !== null
      && Math.abs(sample.targetResidualMmHg) <= pressureToleranceMmHg
    ) {
      brackets.push({
        lowerRvVolumeMl: sample.rvVolumeMl,
        upperRvVolumeMl: sample.rvVolumeMl,
        lowerTargetResidualMmHg: sample.targetResidualMmHg,
        upperTargetResidualMmHg: sample.targetResidualMmHg,
      });
    }
  }
  for (let index = 1; index < scan.length; index += 1) {
    const left = scan[index - 1]!;
    const right = scan[index]!;
    if (
      left.status !== "available"
      || right.status !== "available"
      || left.targetResidualMmHg === null
      || right.targetResidualMmHg === null
      || Math.abs(left.targetResidualMmHg) <= pressureToleranceMmHg
      || Math.abs(right.targetResidualMmHg) <= pressureToleranceMmHg
      || Math.sign(left.targetResidualMmHg) === Math.sign(right.targetResidualMmHg)
    ) {
      continue;
    }
    brackets.push({
      lowerRvVolumeMl: left.rvVolumeMl,
      upperRvVolumeMl: right.rvVolumeMl,
      lowerTargetResidualMmHg: left.targetResidualMmHg,
      upperTargetResidualMmHg: right.targetResidualMmHg,
    });
  }
  return brackets;
}

function scanIsPressureMonotone(
  scan: readonly NoAvpdPassiveLvEdpvrOuterScanSampleV1[],
): boolean {
  let previous: NoAvpdPassiveLvEdpvrOuterScanSampleV1 | null = null;
  for (const sample of scan) {
    if (sample.status !== "available" || sample.rvTransmuralPressureMmHg === null) {
      previous = null;
      continue;
    }
    if (
      previous !== null
      && previous.rvTransmuralPressureMmHg !== null
      && sample.rvTransmuralPressureMmHg < previous.rvTransmuralPressureMmHg - 1e-9
    ) {
      return false;
    }
    previous = sample;
  }
  return true;
}

function failedPoint(
  status: "unavailable" | "ambiguous",
  failureReason: string,
  lvVolumeMl: number,
  boundary: NoAvpdPassiveLvEdpvrBoundaryV1,
  scan: readonly NoAvpdPassiveLvEdpvrOuterScanSampleV1[],
  brackets: readonly NoAvpdPassiveLvEdpvrBracketV1[],
  outerIterations: number,
  innerTriSegSolveCount: number,
  sampledRvPressureMonotoneNondecreasing = false,
): NoAvpdPassiveLvEdpvrFailedPointV1 {
  return {
    status,
    failureReason,
    lvVolumeMl,
    targetRvTransmuralPressureMmHg: boundary.targetRvTransmuralPressureMmHg,
    externalPressureMmHg: 0,
    centeredSecantPressureSlopeMmHgPerMl: null,
    rvVolumeMl: null,
    lvTransmuralPressureMmHg: null,
    rvTransmuralPressureMmHg: null,
    rvPressureTargetResidualMmHg: null,
    triSegCoordinates: null,
    triSegRelativeResidual: null,
    triSegVirtualWorkIdentityResiduals: null,
    triSegIterations: null,
    triSegFunctionEvaluations: null,
    walls: null,
    totalPassiveStoredEnergyJ: null,
    outerDiagnostics: {
      scan,
      validScanPointCount: scan.filter((sample) => sample.status === "available").length,
      innerFailureCount: scan.filter((sample) => sample.status === "inner-unavailable").length,
      sampledRvPressureMonotoneNondecreasing,
      brackets,
      outerIterations,
      innerTriSegSolveCount,
    },
  };
}

function validatePointInput(
  lvVolumeMl: number,
  boundary: NoAvpdPassiveLvEdpvrBoundaryV1,
): string | null {
  if (!Number.isFinite(lvVolumeMl) || lvVolumeMl <= 0) return "LV volume must be finite and positive";
  if (
    !Number.isFinite(boundary.targetRvTransmuralPressureMmHg)
    || !Number.isFinite(boundary.externalPressureMmHg)
    || boundary.externalPressureMmHg !== 0
  ) {
    return "target RV pressure must be finite and external pressure must be exactly zero";
  }
  const [minimumRvVolumeMl, maximumRvVolumeMl] = boundary.rvVolumeSearchMl;
  if (
    !Number.isFinite(minimumRvVolumeMl)
    || !Number.isFinite(maximumRvVolumeMl)
    || minimumRvVolumeMl <= 0
    || maximumRvVolumeMl <= minimumRvVolumeMl
  ) {
    return "RV volume search bounds must be finite, positive, and ordered";
  }
  if (
    !Number.isFinite(boundary.rvVolumeScanStepMl)
    || boundary.rvVolumeScanStepMl <= 0
    || !Number.isFinite(boundary.rvPressureToleranceMmHg)
    || boundary.rvPressureToleranceMmHg <= 0
    || !Number.isFinite(boundary.rvVolumeToleranceMl)
    || boundary.rvVolumeToleranceMl <= 0
    || !Number.isInteger(boundary.maximumOuterIterations)
    || boundary.maximumOuterIterations < 1
    || !Number.isFinite(boundary.triSegRelativeResidualTolerance)
    || boundary.triSegRelativeResidualTolerance <= 0
    || !Number.isInteger(boundary.triSegMaximumIterations)
    || boundary.triSegMaximumIterations < 1
  ) {
    return "solver steps, tolerances, and iteration counts must be finite and positive";
  }
  return null;
}
