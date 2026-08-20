import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID,
} from "@/engine/myocardium/experiments/MainWireNormalAdultPassiveEquilibriumCandidateEngineeringV1";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonDefinitionV1";
import {
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICIES_V3,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3,
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonEngineeringV1";
import { ENERGY_CONJUGATE_TRISEG_V1_ID } from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import { EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID } from "@/engine/myocardium/mechanics/equilibriumOneFiberPassiveV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1_ID } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_V1_ID =
  "main-wire-normal-adult-intrinsic-ventricular-passive-reduced-surface-pilot-v1" as const;

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_V1_ID =
  "main-wire-normal-adult-intrinsic-ventricular-passive-reduced-surface-pilot-protocol-v1" as const;

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_REPORT_V1_ID =
  "main-wire-normal-adult-intrinsic-ventricular-passive-reduced-surface-pilot-report-v1" as const;

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DECLARATION_V1 =
  deepFreezeV1({
    declarationId:
      "integrated-model-0027-intrinsic-ventricular-passive-reduced-surface-pilot",
    commitSha: "e93801ed221c9b3c74b9d837c8d89920c90cbe35",
    treeSha: "23b4bba59a59d332b4855f0d44aa19f9212f7b1f",
    documentPath:
      "docs/scientific-runtime/INTEGRATED-MODEL-0027-intrinsic-ventricular-passive-reduced-surface-pilot.md",
    documentGitBlobSha1: "42fc0c01e3b27f69e40d6365d42fabc62999ada6",
    documentRawSha256:
      "5bfc2704813548094952a9f6aea18f3ca487240e3e31e5450854f78b1de2ba56",
    documentSizeBytes: 14_854,
    declarationStatus:
      "committed-before-first-normal-adult-pilot-evaluation" as const,
  });

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PREDECESSOR_V1 =
  deepFreezeV1({
    mergedPredecessorCommitSha: "402ad89f486a9c71bd5d3134fdb1c845cdcd0cf5",
    comparisonDeclarationCommitSha: "b5f929e20820e5cf3e7a54dc23f96e4666ed67f4",
    comparisonImplementationCommitSha:
      "a87637f6e8070b8d1eb0c0bd0d78464d4d23393f",
    comparisonReportPayloadSha256:
      "d30ca8cd148affb8d5f3964769b24dacf21afc38dcfa596fc25fbb0c1d3bb433",
    comparisonReportRawFileSha256:
      "a48c49fd1b187bd0f625d6292123f5b686b5ba99b56bb675a2fefd2dfe4cbe2b",
    comparisonEngineeringLeaderOnly: true as const,
    historicalQualificationTransferred: false as const,
  });

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_AXIS_INDICES_V1 =
  Object.freeze([0, 1, 2, 3, 4] as const);

export type MainWireIntrinsicVentricularPassiveReducedSurfacePilotAxisIndexV1 =
  (typeof MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_AXIS_INDICES_V1)[number];

export type MainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointDefinitionV1 =
  Readonly<{
    pointId: string;
    leftVentricularIndex: MainWireIntrinsicVentricularPassiveReducedSurfacePilotAxisIndexV1;
    rightVentricularIndex: MainWireIntrinsicVentricularPassiveReducedSurfacePilotAxisIndexV1;
    leftVentricularFraction: number;
    rightVentricularFraction: number;
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    referencePoint: boolean;
  }>;

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_GRID_V1 =
  Object.freeze(
    MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_AXIS_INDICES_V1.flatMap(
      (leftVentricularIndex) =>
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_AXIS_INDICES_V1.map(
          (rightVentricularIndex) =>
            deepFreezeV1({
              pointId: `grid-lv-${leftVentricularIndex}-rv-${rightVentricularIndex}`,
              leftVentricularIndex,
              rightVentricularIndex,
              leftVentricularFraction: leftVentricularIndex / 32,
              rightVentricularFraction: rightVentricularIndex / 32,
              chamberVolumesM3: {
                LV: volumeAtIndexV1("LV", leftVentricularIndex),
                RV: volumeAtIndexV1("RV", rightVentricularIndex),
              },
              referencePoint:
                leftVentricularIndex === 0 && rightVentricularIndex === 0,
            }),
        ),
    ),
  ) satisfies readonly MainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointDefinitionV1[];

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DIAGNOSTIC_TARGETS_V1 =
  deepFreezeV1([
    {
      diagnosticId: "center",
      leftVentricularIndex: 2,
      rightVentricularIndex: 2,
    },
    {
      diagnosticId: "lv-heavy",
      leftVentricularIndex: 4,
      rightVentricularIndex: 1,
    },
    {
      diagnosticId: "rv-heavy",
      leftVentricularIndex: 1,
      rightVentricularIndex: 4,
    },
    {
      diagnosticId: "far-corner",
      leftVentricularIndex: 4,
      rightVentricularIndex: 4,
    },
  ] as const);

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_RECTANGLES_V1 =
  deepFreezeV1([
    {
      rectangleId: "rectangle-lv-0-rv-0",
      leftVentricularIndex: 0,
      rightVentricularIndex: 0,
    },
    {
      rectangleId: "rectangle-lv-0-rv-2",
      leftVentricularIndex: 0,
      rightVentricularIndex: 2,
    },
    {
      rectangleId: "rectangle-lv-2-rv-0",
      leftVentricularIndex: 2,
      rightVentricularIndex: 0,
    },
    {
      rectangleId: "rectangle-lv-2-rv-2",
      leftVentricularIndex: 2,
      rightVentricularIndex: 2,
    },
  ] as const);

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1 =
  deepFreezeV1({
    primaryHomotopyStageCount: 32,
    terminalScaledForceInfinityMaximum: 1e-10,
    minimumScaledInternalHessianEigenvalueExclusive: 1e-10,
    minimumJunctionRadiusMExclusive: 1e-5,
    analyticScaledAntisymmetryNormalizedMaximum: 1e-12,
    analyticScaledAntisymmetryFloor: 1e-12,
    energyGradientPressureFloorPa: 1_000,
    energyGradientNormalizedErrorMaximum: 5e-3,
    reducedHessianFloorPaPerM3: 1e6,
    reducedHessianNormalizedErrorMaximum: 2e-2,
    pressureFiniteDifferenceMaxwellNormalizedErrorMaximum: 2e-2,
    pathWorkAbsoluteFloorJ: 1e-12,
    pathLoopRefinedNormalizedMaximum: 1e-3,
    pathRefinementRatioMaximum: 0.6,
    pathRefinementAbsoluteFloorJ: 1e-10,
    diagnosticScaledCoordinateInfinityDistanceMaximum: 1e-7,
    diagnosticAbsoluteStoredEnergyDifferenceMaximumJ: 1e-10,
    diagnosticPressureAbsoluteDifferenceMaximumPa: 1e-7,
    maximumCommittedArtifactBytes: 524_288,
  });

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_NEGATIVE_CLAIMS_V1 =
  deepFreezeV1({
    productionPointSolverSelected: false as const,
    officialQualificationEstablished: false as const,
    confirmatoryEligibilityEstablished: false as const,
    continuousSurfaceEstablished: false as const,
    continuousBranchEstablished: false as const,
    alternatePathAgreementEstablished: false as const,
    multiSeedRobustnessEstablished: false as const,
    globalUniquenessEstablished: false as const,
    atriaIncluded: false as const,
    pericardiumIncluded: false as const,
    activeStressIncluded: false as const,
    slsHistoryIncluded: false as const,
    circulationIncluded: false as const,
    edpvrEstablished: false as const,
    peEstablished: false as const,
    passiveReferenceForPvaEstablished: false as const,
    pvaEstablished: false as const,
    oxygenOrMetabolicClaimEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationEstablished: false as const,
    publicCatalogEligibilityEstablished: false as const,
  });

export const MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_PAYLOAD_V1 =
  deepFreezeV1({
    protocolId:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PROTOCOL_V1_ID,
    ownerId:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_V1_ID,
    declaration:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DECLARATION_V1,
    predecessor:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_PREDECESSOR_V1,
    candidateOwnerId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID,
    candidateClaim:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM,
    candidateSourceBindings: {
      priorId: NORMAL_ADULT_FIVE_WALL_PRIOR_V1_ID,
      geometryId: ENERGY_CONJUGATE_TRISEG_V1_ID,
      materialId: EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID,
    },
    selectedSolverPolicyId:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID,
    selectedSolverPolicy: {
      shared: MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_SHARED_POLICY_V3,
      residualArmijoNewton:
        MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICIES_V3[
          MAIN_WIRE_PASSIVE_EQUILIBRIUM_RESIDUAL_ARMIJO_NEWTON_V3_ID
        ],
      automaticFallbackPolicyId: null,
      levenbergMarquardtEscalationIncluded: false,
    },
    chamberScope: ["LV", "RV"],
    coordinateOrder: ["LV", "RV", "VS", "y"],
    internalCoordinateOrder: ["VS", "y"],
    wallOrder: ["LVFW", "SEP", "RVFW"],
    referenceVolumesM3:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3,
    minimumVolumesM3:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3,
    axisIndices:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_AXIS_INDICES_V1,
    grid: MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_GRID_V1,
    primaryLineage: {
      referenceRootSolvedOnceFromLoadedCoordinates: true,
      nonreferenceStageCount: 32,
      formula:
        "V_k=V_ref+(k/32)*(V_target-V_ref);k=1,...,32;each-target-independent-from-reference-root",
      neighbourWarmStartIncluded: false,
      failedPointInterpolationIncluded: false,
    },
    diagnosticTargets:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_DIAGNOSTIC_TARGETS_V1,
    diagnosticLineages: [
      "primary-diagonal",
      "lv-first-32-plus-rv-second-32",
      "rv-first-32-plus-lv-second-32",
      "fixed-neighbour-direct-continuation",
      "target-to-reference-reverse-return-32",
    ],
    schurProjection:
      "Hred=Hzz-Hzq*inverse(Hqq)*Hqz;z=[LV,RV];q=[VS,y];no-shift-or-regularization",
    derivativeAudits: {
      energyGradientInteriorIndices: [1, 2, 3],
      reducedHessianInteriorIndices: [1, 2, 3],
      centeredDifferenceOrientation:
        "[value(index-1)-value(index+1)]/(2*(Vref-Vmin)/32)",
      pressureBasis: "intrinsic-equilibrium-passive",
    },
    rectangles:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_RECTANGLES_V1,
    thresholds:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1,
    resultRule: [
      "all-25-primary-lineages-pass",
      "all-25-terminal-and-analytic-projection-gates-pass",
      "all-30-energy-gradient-audits-pass",
      "all-36-reduced-hessian-component-audits-pass",
      "all-9-pressure-fd-maxwell-audits-pass",
      "all-4-rectangular-path-refinement-audits-pass",
      "all-source-protocol-and-report-hashes-replay",
      "no-execution-or-integrity-exception",
    ],
    output: {
      path: "artifacts/passive-equilibrium/intrinsic-ventricular-passive-reduced-surface-pilot-v1.json",
      createOnly: true,
      maximumBytes:
        MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_THRESHOLDS_V1.maximumCommittedArtifactBytes,
      fullIterationTraceCommitted: false,
      runtimeInput: false,
    },
    claims:
      MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_NEGATIVE_CLAIMS_V1,
  });

export function mainWireIntrinsicVentricularPassiveReducedSurfacePilotGridPointIdV1(
  leftVentricularIndex: number,
  rightVentricularIndex: number,
): string {
  return `grid-lv-${leftVentricularIndex}-rv-${rightVentricularIndex}`;
}

function volumeAtIndexV1(
  chamber: "LV" | "RV",
  index: MainWireIntrinsicVentricularPassiveReducedSurfacePilotAxisIndexV1,
): number {
  const reference =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3[chamber];
  const minimum =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3[chamber];
  return reference + (index / 32) * (minimum - reference);
}

function deepFreezeV1<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreezeV1(child);
    Object.freeze(value);
  }
  return value;
}
