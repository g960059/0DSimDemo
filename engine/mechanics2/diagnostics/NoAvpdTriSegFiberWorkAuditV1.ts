import {
  TRISEG_WALL_IDS_V1,
  evaluateTriSegGeometryV1,
  evaluateTriSegVirtualWorkV1,
  triSegWallTensionsFromFiberStressesV1,
  type TriSegGeometryCoordinateSIV1,
  type TriSegGeometryInputV1,
  type TriSegGeometryValidOutputV1,
  type TriSegWallFiberStressesPaV1,
  type TriSegWallIdV1,
} from "@/engine/mechanics2/geometry/TriSegGeometryV1";

export const NO_AVPD_TRISEG_FIBER_WORK_AUDIT_ID_V1 =
  "no-avpd-triseg-fiber-work-audit-v1" as const;

export const NO_AVPD_TRISEG_FIBER_WORK_AUDIT_CLAIM_BOUNDARY_V1 = Object.freeze({
  evidenceStatus:
    "report-only-generalized-force-mapping-definition-comparison" as const,
  changesPhysicsEquilibrium: false as const,
  changesParameters: false as const,
  physiologyAcceptanceGate: false as const,
  winnerSelectionApplied: false as const,
  comparison:
    "literature-faithful-lumens-2009-representative-tension-area-work-vs-opt-in-full-fiber-energy-gradient" as const,
  lumens2009RepresentativeTensionAreaWorkIsLiteratureFaithful: true as const,
  fullFiberEnergyGradientIsOptInVariationalAlternative: true as const,
  fullFiberEnergyGradientIsCorrectionToLumens2009: false as const,
  activeStressStoredEnergyPotentialClaimed: false as const,
  numericalDifferenceAloneIsBlockingStructuralFailure: false as const,
  sameGeometryAndFiberStressRequired: true as const,
  quadraticPotentialIdentityIsMathematicalNotPhysiologicEdpvr: true as const,
});

export const NO_AVPD_TRISEG_WORK_COORDINATES_V1 = [
  "leftVentricleCavityVolumeM3",
  "rightVentricleCavityVolumeM3",
  "septalCapVolumeM3",
  "junctionRadiusM",
] as const satisfies readonly TriSegGeometryCoordinateSIV1[];

export const NO_AVPD_TRISEG_QUADRATIC_PASSIVE_MODULUS_PA_V1 = Object.freeze({
  leftFreeWall: 100_000,
  septum: 100_000,
  rightFreeWall: 100_000,
}) satisfies Readonly<Record<TriSegWallIdV1, number>>;

const NUMERICAL_FLOOR_BY_COORDINATE: Readonly<
  Record<TriSegGeometryCoordinateSIV1, number>
> = Object.freeze({
  leftVentricleCavityVolumeM3: 1e-9,
  rightVentricleCavityVolumeM3: 1e-9,
  septalCapVolumeM3: 1e-9,
  junctionRadiusM: 1e-12,
});

const FINITE_DIFFERENCE_STEP_SI: Readonly<
  Record<TriSegGeometryCoordinateSIV1, number>
> = Object.freeze({
  leftVentricleCavityVolumeM3: 1e-9,
  rightVentricleCavityVolumeM3: 1e-9,
  septalCapVolumeM3: 1e-9,
  junctionRadiusM: 1e-7,
});

export type NoAvpdTriSegFiberWorkAuditPointV1 = ReturnType<
  typeof evaluateNoAvpdTriSegFiberWorkAuditPointV1
>;

export function evaluateNoAvpdTriSegFiberWorkAuditPointV1(
  geometry: TriSegGeometryValidOutputV1,
  fiberStressesPa: TriSegWallFiberStressesPaV1,
) {
  requireFiniteStresses(fiberStressesPa);
  const tensionsNPerM = triSegWallTensionsFromFiberStressesV1(
    geometry,
    fiberStressesPa,
  );
  if (tensionsNPerM === null) {
    throw new Error("TriSeg representative tension mapping was unavailable");
  }
  const currentVirtualWork = evaluateTriSegVirtualWorkV1(
    geometry,
    tensionsNPerM,
  );
  if (!currentVirtualWork.valid) {
    throw new Error(currentVirtualWork.failureReason);
  }
  const currentGeneralizedValues = {
    leftVentricleCavityVolumeM3:
      currentVirtualWork.pressures.leftVentricleTransmuralPa,
    rightVentricleCavityVolumeM3:
      currentVirtualWork.pressures.rightVentricleTransmuralPa,
    septalCapVolumeM3: currentVirtualWork.residuals.septalCapPressurePa,
    junctionRadiusM: currentVirtualWork.residuals.junctionRadiusForceN,
  } satisfies Readonly<Record<TriSegGeometryCoordinateSIV1, number>>;

  const coordinates = Object.fromEntries(
    NO_AVPD_TRISEG_WORK_COORDINATES_V1.map((coordinateId) => {
      const contributionsByWall = Object.fromEntries(
        TRISEG_WALL_IDS_V1.map((wallId) => {
          const wall = geometry.walls[wallId];
          const derivative = wall.derivativesSI[coordinateId];
          const currentAreaWork =
            tensionsNPerM[wallId] * derivative.dMidwallAreaM2;
          const declaredHillFiberWork =
            wall.wallVolumeM3 *
            fiberStressesPa[wallId] *
            derivative.dFiberNaturalStrain;
          return [
            wallId,
            {
              currentAreaWork,
              declaredHillFiberWork,
              signedMismatchDeclaredMinusCurrent:
                declaredHillFiberWork - currentAreaWork,
            },
          ];
        }),
      ) as Readonly<
        Record<
          TriSegWallIdV1,
          {
            readonly currentAreaWork: number;
            readonly declaredHillFiberWork: number;
            readonly signedMismatchDeclaredMinusCurrent: number;
          }
        >
      >;
      const currentAreaWorkSum = sumWallField(
        contributionsByWall,
        "currentAreaWork",
      );
      const declaredHillFiberWorkSum = sumWallField(
        contributionsByWall,
        "declaredHillFiberWork",
      );
      const currentGeneralizedValue = currentGeneralizedValues[coordinateId];
      const signedMismatch = declaredHillFiberWorkSum - currentGeneralizedValue;
      const absoluteMismatch = Math.abs(signedMismatch);
      const numericalFloor = NUMERICAL_FLOOR_BY_COORDINATE[coordinateId];
      const symmetricScale = Math.max(
        Math.abs(currentGeneralizedValue),
        Math.abs(declaredHillFiberWorkSum),
        numericalFloor,
      );
      const contributionScale = Math.max(
        TRISEG_WALL_IDS_V1.reduce(
          (sum, wallId) =>
            sum + Math.abs(contributionsByWall[wallId].currentAreaWork),
          0,
        ),
        TRISEG_WALL_IDS_V1.reduce(
          (sum, wallId) =>
            sum + Math.abs(contributionsByWall[wallId].declaredHillFiberWork),
          0,
        ),
        numericalFloor,
      );
      const pressureReadbackMmHg =
        coordinateId === "junctionRadiusM"
          ? null
          : {
              current: currentGeneralizedValue / 133.322,
              declaredHill: declaredHillFiberWorkSum / 133.322,
              signedMismatchDeclaredMinusCurrent: signedMismatch / 133.322,
              absoluteMismatch: absoluteMismatch / 133.322,
            };
      return [
        coordinateId,
        {
          quantity:
            coordinateId === "leftVentricleCavityVolumeM3"
              ? "left-ventricle-pressure"
              : coordinateId === "rightVentricleCavityVolumeM3"
                ? "right-ventricle-pressure"
                : coordinateId === "septalCapVolumeM3"
                  ? "septal-cap-generalized-pressure-residual"
                  : "junction-radius-generalized-force-residual",
          unit: coordinateId === "junctionRadiusM" ? "N" : "Pa",
          currentRepresentativeAreaWorkValue: currentGeneralizedValue,
          currentAreaWorkSum,
          currentAreaWorkIdentityResidual:
            currentGeneralizedValue - currentAreaWorkSum,
          declaredHillFiberWorkValue: declaredHillFiberWorkSum,
          signedMismatchDeclaredMinusCurrent: signedMismatch,
          absoluteMismatch,
          symmetricRelativeMismatch: absoluteMismatch / symmetricScale,
          contributionScaleRelativeMismatch:
            absoluteMismatch / contributionScale,
          pressureReadbackMmHg,
          contributionsByWall,
        },
      ];
    }),
  ) as Readonly<
    Record<
      TriSegGeometryCoordinateSIV1,
      {
        readonly quantity:
          | "left-ventricle-pressure"
          | "right-ventricle-pressure"
          | "septal-cap-generalized-pressure-residual"
          | "junction-radius-generalized-force-residual";
        readonly unit: "Pa" | "N";
        readonly currentRepresentativeAreaWorkValue: number;
        readonly currentAreaWorkSum: number;
        readonly currentAreaWorkIdentityResidual: number;
        readonly declaredHillFiberWorkValue: number;
        readonly signedMismatchDeclaredMinusCurrent: number;
        readonly absoluteMismatch: number;
        readonly symmetricRelativeMismatch: number;
        readonly contributionScaleRelativeMismatch: number;
        readonly pressureReadbackMmHg: {
          readonly current: number;
          readonly declaredHill: number;
          readonly signedMismatchDeclaredMinusCurrent: number;
          readonly absoluteMismatch: number;
        } | null;
        readonly contributionsByWall: Readonly<
          Record<
            TriSegWallIdV1,
            {
              readonly currentAreaWork: number;
              readonly declaredHillFiberWork: number;
              readonly signedMismatchDeclaredMinusCurrent: number;
            }
          >
        >;
      }
    >
  >;

  return {
    auditId: NO_AVPD_TRISEG_FIBER_WORK_AUDIT_ID_V1,
    claimBoundary: NO_AVPD_TRISEG_FIBER_WORK_AUDIT_CLAIM_BOUNDARY_V1,
    geometryInput: geometry.input,
    fiberStressesPa,
    representativeTensionsNPerM: tensionsNPerM,
    coordinates,
    currentVirtualWorkIdentityResiduals:
      currentVirtualWork.virtualWorkIdentityResiduals,
    currentEquilibriumReadback: {
      septalCapPressurePa: currentVirtualWork.residuals.septalCapPressurePa,
      junctionRadiusForceN: currentVirtualWork.residuals.junctionRadiusForceN,
      relativeMagnitude: currentVirtualWork.residuals.relativeMagnitude,
    },
  };
}

export type NoAvpdTriSegQuadraticEnergyIdentityV1 = ReturnType<
  typeof evaluateNoAvpdTriSegQuadraticEnergyIdentityV1
>;

export function evaluateNoAvpdTriSegQuadraticEnergyIdentityV1(
  geometryInput: TriSegGeometryInputV1,
  moduliPa: Readonly<
    Record<TriSegWallIdV1, number>
  > = NO_AVPD_TRISEG_QUADRATIC_PASSIVE_MODULUS_PA_V1,
) {
  requireFinitePositiveModuli(moduliPa);
  const geometry = requireValidGeometry(geometryInput);
  const stressesPa = Object.fromEntries(
    TRISEG_WALL_IDS_V1.map((wallId) => [
      wallId,
      moduliPa[wallId] * geometry.walls[wallId].fiberNaturalStrain,
    ]),
  ) as TriSegWallFiberStressesPaV1;
  const audit = evaluateNoAvpdTriSegFiberWorkAuditPointV1(geometry, stressesPa);
  const coordinates = Object.fromEntries(
    NO_AVPD_TRISEG_WORK_COORDINATES_V1.map((coordinateId) => {
      const stepSI = FINITE_DIFFERENCE_STEP_SI[coordinateId];
      const energyMinusJ = quadraticFiberEnergyJ(
        requireValidGeometry(
          perturbGeometryInput(geometryInput, coordinateId, -stepSI),
        ),
        moduliPa,
      );
      const energyPlusJ = quadraticFiberEnergyJ(
        requireValidGeometry(
          perturbGeometryInput(geometryInput, coordinateId, stepSI),
        ),
        moduliPa,
      );
      const finiteDifferenceEnergyGradient =
        (energyPlusJ - energyMinusJ) / (2 * stepSI);
      const directHillFiberWorkGradient =
        audit.coordinates[coordinateId].declaredHillFiberWorkValue;
      const signedResidual =
        finiteDifferenceEnergyGradient - directHillFiberWorkGradient;
      const absoluteResidual = Math.abs(signedResidual);
      const scale = Math.max(
        Math.abs(finiteDifferenceEnergyGradient),
        Math.abs(directHillFiberWorkGradient),
        NUMERICAL_FLOOR_BY_COORDINATE[coordinateId],
      );
      return [
        coordinateId,
        {
          unit: coordinateId === "junctionRadiusM" ? "N" : "Pa",
          finiteDifferenceStepSI: stepSI,
          finiteDifferenceEnergyGradient,
          directHillFiberWorkGradient,
          signedResidualFiniteDifferenceMinusDirect: signedResidual,
          absoluteResidual,
          relativeResidual: absoluteResidual / scale,
          currentAreaWorkGradient:
            audit.coordinates[coordinateId].currentRepresentativeAreaWorkValue,
          currentAreaWorkMismatchFromEnergyGradient:
            finiteDifferenceEnergyGradient -
            audit.coordinates[coordinateId].currentRepresentativeAreaWorkValue,
        },
      ];
    }),
  ) as Readonly<
    Record<
      TriSegGeometryCoordinateSIV1,
      {
        readonly unit: "Pa" | "N";
        readonly finiteDifferenceStepSI: number;
        readonly finiteDifferenceEnergyGradient: number;
        readonly directHillFiberWorkGradient: number;
        readonly signedResidualFiniteDifferenceMinusDirect: number;
        readonly absoluteResidual: number;
        readonly relativeResidual: number;
        readonly currentAreaWorkGradient: number;
        readonly currentAreaWorkMismatchFromEnergyGradient: number;
      }
    >
  >;
  return {
    identityId: "triseg-quadratic-fiber-energy-gradient-identity-v1" as const,
    evidenceStatus:
      "mathematical-identity-only-not-physiologic-passive-law" as const,
    potentialDefinition:
      "Psi_total=sum(V_wall*0.5*K_wall*fiberNaturalStrain^2)" as const,
    workPairDefinition:
      "dPsi/dq=sum(V_wall*sigma_wall*dFiberNaturalStrain/dq)" as const,
    moduliPa,
    geometryInput,
    energyJ: quadraticFiberEnergyJ(geometry, moduliPa),
    stressesPa,
    coordinates,
  };
}

function quadraticFiberEnergyJ(
  geometry: TriSegGeometryValidOutputV1,
  moduliPa: Readonly<Record<TriSegWallIdV1, number>>,
): number {
  return TRISEG_WALL_IDS_V1.reduce((sum, wallId) => {
    const wall = geometry.walls[wallId];
    return (
      sum +
      0.5 * wall.wallVolumeM3 * moduliPa[wallId] * wall.fiberNaturalStrain ** 2
    );
  }, 0);
}

function perturbGeometryInput(
  input: TriSegGeometryInputV1,
  coordinateId: TriSegGeometryCoordinateSIV1,
  incrementSI: number,
): TriSegGeometryInputV1 {
  switch (coordinateId) {
    case "leftVentricleCavityVolumeM3":
      return {
        ...input,
        leftVentricleCavityVolumeMl:
          input.leftVentricleCavityVolumeMl + incrementSI / 1e-6,
      };
    case "rightVentricleCavityVolumeM3":
      return {
        ...input,
        rightVentricleCavityVolumeMl:
          input.rightVentricleCavityVolumeMl + incrementSI / 1e-6,
      };
    case "septalCapVolumeM3":
      return {
        ...input,
        algebraic: {
          ...input.algebraic,
          septalCapVolumeMl:
            input.algebraic.septalCapVolumeMl + incrementSI / 1e-6,
        },
      };
    case "junctionRadiusM":
      return {
        ...input,
        algebraic: {
          ...input.algebraic,
          junctionRadiusCm:
            input.algebraic.junctionRadiusCm + incrementSI / 1e-2,
        },
      };
  }
}

function requireValidGeometry(
  input: TriSegGeometryInputV1,
): TriSegGeometryValidOutputV1 {
  const geometry = evaluateTriSegGeometryV1(input);
  if (!geometry.valid) throw new Error(geometry.failureReason);
  return geometry;
}

function sumWallField(
  values: Readonly<
    Record<
      TriSegWallIdV1,
      {
        readonly currentAreaWork: number;
        readonly declaredHillFiberWork: number;
      }
    >
  >,
  field: "currentAreaWork" | "declaredHillFiberWork",
): number {
  return TRISEG_WALL_IDS_V1.reduce(
    (sum, wallId) => sum + values[wallId][field],
    0,
  );
}

function requireFiniteStresses(stressesPa: TriSegWallFiberStressesPaV1): void {
  for (const wallId of TRISEG_WALL_IDS_V1) {
    if (!Number.isFinite(stressesPa[wallId])) {
      throw new Error(`${wallId} fiber stress must be finite`);
    }
  }
}

function requireFinitePositiveModuli(
  moduliPa: Readonly<Record<TriSegWallIdV1, number>>,
): void {
  for (const wallId of TRISEG_WALL_IDS_V1) {
    if (!Number.isFinite(moduliPa[wallId]) || moduliPa[wallId] <= 0) {
      throw new Error(`${wallId} modulus must be positive and finite`);
    }
  }
}
