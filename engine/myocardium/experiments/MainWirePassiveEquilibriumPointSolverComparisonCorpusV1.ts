import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_LOADED_COORDINATES_V3,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3,
  type MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonDefinitionV1";
import type {
  MainWirePassiveEquilibriumCandidateEvaluatorV3,
  MainWirePassiveEquilibriumSolverCandidateInputV3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonEngineeringV1";

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_CORPUS_V1_ID =
  "main-wire-normal-adult-passive-equilibrium-point-solver-comparison-corpus-v1" as const;

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_DECLARATION_V1 =
  deepFreezeV3({
    declarationId:
      "integrated-model-0025-passive-equilibrium-point-solver-v3-engineering-comparison",
    commitSha: "b5f929e20820e5cf3e7a54dc23f96e4666ed67f4",
    treeSha: "2738907cf98fdf5c6be3a7a390919d5431805121",
    documentPath:
      "docs/scientific-runtime/INTEGRATED-MODEL-0025-passive-equilibrium-point-solver-v3-engineering-comparison.md",
    documentGitBlobSha1: "467119a25c578903c32f480903c760982e68506a",
    documentRawSha256:
      "82f6fdd9ce79d7d23022f8a0896d1823d0b55965d396171702ea70dbb7a99a92",
    declarationStatus: "committed-before-first-v3-normal-adult-evaluation",
  });

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_MANUFACTURED_CASE_IDS_V1 =
  Object.freeze([
    "quadratic-spd",
    "near-flat-quartic",
    "magnitude-imbalanced",
    "large-energy-offset-0",
    "large-energy-offset-1e8",
    "large-energy-offset-1e16",
    "saddle-control",
    "constant-residual-control",
  ] as const);

export type MainWirePassiveEquilibriumManufacturedCaseIdV1 =
  (typeof MAIN_WIRE_PASSIVE_EQUILIBRIUM_MANUFACTURED_CASE_IDS_V1)[number];

export type MainWirePassiveEquilibriumManufacturedCaseV1 = Readonly<{
  caseId: MainWirePassiveEquilibriumManufacturedCaseIdV1;
  expectedOutcome: "point-local-stable-root-established" | "point-solve-failed";
  initialCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3;
  evaluateCandidate: MainWirePassiveEquilibriumCandidateEvaluatorV3;
}>;

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_RANKED_NEIGHBOURHOOD_FRACTIONS_V1 =
  Object.freeze([0, 1 / 32, 2 / 32, 4 / 32] as const);

export type MainWirePassiveEquilibriumRankedTargetV1 = Readonly<{
  caseId: string;
  leftVentricularFraction: number;
  rightVentricularFraction: number;
  chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
  referenceCase: boolean;
}>;

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_RANKED_TARGETS_V1 = Object.freeze(
  MAIN_WIRE_PASSIVE_EQUILIBRIUM_RANKED_NEIGHBOURHOOD_FRACTIONS_V1.flatMap(
    (leftVentricularFraction, leftIndex) =>
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_RANKED_NEIGHBOURHOOD_FRACTIONS_V1.map(
        (rightVentricularFraction, rightIndex) =>
          deepFreezeV3({
            caseId: `ranked-neighbourhood-lv-${leftIndex}-rv-${rightIndex}`,
            leftVentricularFraction,
            rightVentricularFraction,
            chamberVolumesM3: {
              LV:
                MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV -
                leftVentricularFraction *
                  (MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV -
                    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3.LV),
              RV:
                MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV -
                rightVentricularFraction *
                  (MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV -
                    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3.RV),
            },
            referenceCase: leftIndex === 0 && rightIndex === 0,
          }),
      ),
  ),
) satisfies readonly MainWirePassiveEquilibriumRankedTargetV1[];

const literalMidpoint = Object.freeze({ LV: 98.8e-6, RV: 111.15e-6 });
const canonicalIndexedMidpoint = Object.freeze({
  LV:
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3.LV +
    (16 / 32) *
      (MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.LV -
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3.LV),
  RV:
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3.RV +
    (16 / 32) *
      (MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3.RV -
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3.RV),
});

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_ARCHIVE_DIAGNOSTIC_CASES_V1 =
  deepFreezeV3({
    homotopyTargets: [
      {
        caseId: "archive-literal-midpoint-homotopy",
        chamberVolumesM3: literalMidpoint,
      },
      {
        caseId: "archive-canonical-indexed-midpoint-homotopy",
        chamberVolumesM3: canonicalIndexedMidpoint,
      },
    ],
    directPointStates: [
      {
        caseId: "archive-midpoint-stage-2-state",
        chamberVolumesM3: {
          LV: 141.55000000000003e-6,
          RV: 153.009375e-6,
        },
        initialCoordinates: {
          septalMidwallCapVolumeM3: 37.30367803529229e-6,
          junctionRadiusM: 0.03399501819258049,
        },
      },
      {
        caseId: "archive-reference-seed-zero-plus-0.25",
        chamberVolumesM3:
          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3,
        initialCoordinates: {
          septalMidwallCapVolumeM3:
            MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_LOADED_COORDINATES_V3.septalMidwallCapVolumeM3,
          junctionRadiusM:
            MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_LOADED_COORDINATES_V3.junctionRadiusM +
            0.25 *
              MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3.junctionRadiusM,
        },
      },
      {
        caseId: "archive-reference-seed-plus-0.25-plus-0.25",
        chamberVolumesM3:
          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3,
        initialCoordinates: {
          septalMidwallCapVolumeM3:
            MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_LOADED_COORDINATES_V3.septalMidwallCapVolumeM3 +
            0.25 *
              MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3.septalMidwallCapVolumeM3,
          junctionRadiusM:
            MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_LOADED_COORDINATES_V3.junctionRadiusM +
            0.25 *
              MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3.junctionRadiusM,
        },
      },
    ],
    historicalBoundary: {
      archiveTag: "research-archive/passive-equilibrium-v2-failed-2026-08-19",
      archiveHeadCommitSha: "73a0d7008e49f451bf0062b48502295086be52a0",
      archivedArtifactConsumedAtRuntime: false,
      historicalQualificationTransferred: false,
      casesAffectRanking: false,
    },
  });

export const MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_CORPUS_PAYLOAD_V1 =
  deepFreezeV3({
    corpusId:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_CORPUS_V1_ID,
    declaration:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_POINT_SOLVER_COMPARISON_DECLARATION_V1,
    manufacturedCases: [
      { caseId: "quadratic-spd", expected: "root" },
      { caseId: "near-flat-quartic", expected: "root" },
      { caseId: "magnitude-imbalanced", expected: "root" },
      { caseId: "large-energy-offset-0", expected: "root" },
      { caseId: "large-energy-offset-1e8", expected: "root" },
      { caseId: "large-energy-offset-1e16", expected: "root" },
      { caseId: "saddle-control", expected: "strict-stability-failure" },
      { caseId: "constant-residual-control", expected: "no-root" },
    ],
    referenceVolumesM3:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3,
    minimumVolumesM3:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3,
    loadedCoordinates:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_LOADED_COORDINATES_V3,
    rankedNeighbourhoodFractions:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_RANKED_NEIGHBOURHOOD_FRACTIONS_V1,
    rankedTargets: MAIN_WIRE_PASSIVE_EQUILIBRIUM_RANKED_TARGETS_V1,
    primaryHomotopy: {
      stageCount: 32,
      formula:
        "V_k=V_ref+(k/32)*(V_target-V_ref);k=1,...,32;independent-from-neighbours",
    },
    archiveDiagnostics:
      MAIN_WIRE_PASSIVE_EQUILIBRIUM_ARCHIVE_DIAGNOSTIC_CASES_V1,
    rankingRule: [
      "reject-manufactured-outcome-violation",
      "maximize-completed-ranked-normal-adult-cases",
      "minimize-ranked-candidate-evaluations",
      "minimize-ranked-accepted-updates",
      "tie-residual-armijo-newton-then-residual-lm-then-component-energy-terminal-root-guard",
    ],
  });

export function createMainWirePassiveEquilibriumManufacturedCasesV1(): readonly MainWirePassiveEquilibriumManufacturedCaseV1[] {
  return deepFreezeV3([
    rootCaseV3(
      "quadratic-spd",
      coordinatesV3(0.5, 0.5),
      quadraticEvaluatorV3({
        root: [0.125, 0.25],
        hessian: [
          [1, 0],
          [0, 1],
        ],
      }),
    ),
    rootCaseV3(
      "near-flat-quartic",
      coordinatesV3(0.25, 0.5),
      nearFlatQuarticEvaluatorV3(),
    ),
    rootCaseV3(
      "magnitude-imbalanced",
      coordinatesV3(0.75, -0.25),
      quadraticEvaluatorV3({
        root: [0.125, 0.25],
        hessian: [
          [1e-3, 0],
          [0, 100],
        ],
      }),
    ),
    ...([0, 1e8, 1e16] as const).map((wallEnergyOffsetJ, index) =>
      rootCaseV3(
        [
          "large-energy-offset-0",
          "large-energy-offset-1e8",
          "large-energy-offset-1e16",
        ][index]! as MainWirePassiveEquilibriumManufacturedCaseIdV1,
        coordinatesV3(0.5, 0.5),
        quadraticEvaluatorV3({
          root: [0.125, 0.25],
          hessian: [
            [1, 0],
            [0, 1],
          ],
          wallEnergyOffsetJ,
        }),
      ),
    ),
    {
      caseId: "saddle-control",
      expectedOutcome: "point-solve-failed",
      initialCoordinates: coordinatesV3(0, 0),
      evaluateCandidate: quadraticEvaluatorV3({
        root: [0, 0],
        hessian: [
          [1, 0],
          [0, -1],
        ],
      }),
    },
    {
      caseId: "constant-residual-control",
      expectedOutcome: "point-solve-failed",
      initialCoordinates: coordinatesV3(0.5, 0.5),
      evaluateCandidate: (internalCoordinates) => ({
        internalCoordinates,
        wallStoredEnergyJ: { LVFW: 1, SEP: 1, RVFW: 1 },
        scaledGradient: [1, 1],
        scaledInternalHessian: [
          [1, 0],
          [0, 1],
        ],
      }),
    },
  ]);
}

function rootCaseV3(
  caseId: MainWirePassiveEquilibriumManufacturedCaseIdV1,
  initialCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
  evaluateCandidate: MainWirePassiveEquilibriumCandidateEvaluatorV3,
): MainWirePassiveEquilibriumManufacturedCaseV1 {
  return {
    caseId,
    expectedOutcome: "point-local-stable-root-established",
    initialCoordinates,
    evaluateCandidate,
  };
}

function coordinatesV3(
  scaledVolume: number,
  scaledRadius: number,
): MainWireNormalAdultPassiveEquilibriumCoordinatesV3 {
  return Object.freeze({
    septalMidwallCapVolumeM3:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3.septalMidwallCapVolumeM3 *
      scaledVolume,
    junctionRadiusM:
      0.033 +
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3.junctionRadiusM *
        scaledRadius,
  });
}

function scaledCoordinatesV3(
  coordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
): readonly [number, number] {
  return [
    coordinates.septalMidwallCapVolumeM3 /
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3.septalMidwallCapVolumeM3,
    (coordinates.junctionRadiusM - 0.033) /
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3.junctionRadiusM,
  ];
}

function quadraticEvaluatorV3(
  input: Readonly<{
    root: readonly [number, number];
    hessian: readonly [readonly [number, number], readonly [number, number]];
    wallEnergyOffsetJ?: number;
  }>,
): MainWirePassiveEquilibriumCandidateEvaluatorV3 {
  return (internalCoordinates) => {
    const x = scaledCoordinatesV3(internalCoordinates);
    const dx0 = x[0] - input.root[0];
    const dx1 = x[1] - input.root[1];
    const h00 = input.hessian[0][0];
    const h01 = input.hessian[0][1];
    const h11 = input.hessian[1][1];
    const g0 = h00 * dx0 + h01 * dx1;
    const g1 = h01 * dx0 + h11 * dx1;
    const energy = 0.5 * (dx0 * g0 + dx1 * g1);
    const offset = input.wallEnergyOffsetJ ?? 0;
    return candidateInputV3(
      internalCoordinates,
      { LVFW: offset + 0.5 * energy, SEP: offset, RVFW: offset + 0.5 * energy },
      [g0, g1],
      [
        [h00, h01],
        [h01, h11],
      ],
    );
  };
}

function nearFlatQuarticEvaluatorV3(): MainWirePassiveEquilibriumCandidateEvaluatorV3 {
  return (internalCoordinates) => {
    const [x, y] = scaledCoordinatesV3(internalCoordinates);
    return candidateInputV3(
      internalCoordinates,
      {
        LVFW: 0.5e-9 * x * x + 0.25 * x ** 4,
        SEP: 0,
        RVFW: 0.5 * y * y,
      },
      [1e-9 * x + x ** 3, y],
      [
        [1e-9 + 3 * x * x, 0],
        [0, 1],
      ],
    );
  };
}

function candidateInputV3(
  internalCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
  wallStoredEnergyJ: MainWirePassiveEquilibriumSolverCandidateInputV3["wallStoredEnergyJ"],
  scaledGradient: readonly [number, number],
  scaledInternalHessian: MainWirePassiveEquilibriumSolverCandidateInputV3["scaledInternalHessian"],
): MainWirePassiveEquilibriumSolverCandidateInputV3 {
  return {
    internalCoordinates,
    wallStoredEnergyJ,
    scaledGradient,
    scaledInternalHessian,
  };
}

function deepFreezeV3<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreezeV3(child);
    Object.freeze(value);
  }
  return value;
}
