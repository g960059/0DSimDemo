import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmIdV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelV1";
import {
  resolveMainWireAorticRecoveredRootPortValveProfileV1,
  type MainWireAorticRecoveredRootPortValveProfileIdV1,
  type MainWireAorticRecoveredRootPortValveProfileV1,
} from "@/engine/valves/MainWireAorticRecoveredRootPortValveV1";
import {
  resolveMainWireAorticValveResearchProfileV1,
  type MainWireAorticValveResearchProfileIdV1,
  type MainWireAorticValveResearchProfileV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-pressure-recovery-geometry-sentinel-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_IDS_V1 =
  Object.freeze(["d2p5", "d3p0", "d3p8"] as const);

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_IDS_V1)[number];

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryNewGeometryIdV1 =
  Exclude<
    MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryIdV1,
    "d3p0"
  >;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1 =
  `${MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmIdV1}__aa-${MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryIdV1}`;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryNewExactSimulationCellIdV1 =
  `${MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmIdV1}__aa-${MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryNewGeometryIdV1}`;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryProfileV1 =
  Readonly<{
    geometryId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryIdV1;
    ascendingAorticDiameterCm: 2.5 | 3 | 3.8;
    ascendingAorticAreaCm2: number;
    pressureRecoveryProfileId: MainWireAorticValveResearchProfileIdV1;
    recoveredRootPortValveProfileId: MainWireAorticRecoveredRootPortValveProfileIdV1;
    pressureRecoveryProfile: MainWireAorticValveResearchProfileV1;
    recoveredRootPortValveProfile: MainWireAorticRecoveredRootPortValveProfileV1;
    fixedMaximumForwardEoaCm2: 3.5;
    ascendingAorticAreaExceedsMaximumForwardEoa: true;
    geometryRole:
      | "retained-v10-d3p0-reference"
      | "literature-context-anchored-research-stress";
    geometryProvenance:
      | "rounded-2p5cm-stress-endpoint-informed-by-Garcia-2003-2p54cm-in-vitro-aorta"
      | "retained-current-model-d3p0cm-reference-with-ASE-small-aorta-pressure-recovery-context"
      | "Garcia-2003-3p8cm-in-vitro-aorta";
    subjectSpecificMeasurement: false;
    populationNormalRangeClaimed: false;
    parameterSearchOrFitting: false;
  }>;

type GeometryDefinitionV1 = Readonly<{
  geometryId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryIdV1;
  ascendingAorticDiameterCm: 2.5 | 3 | 3.8;
  pressureRecoveryProfileId:
    | "pressure-recovery-aa-d2p5cm"
    | "pressure-recovery-aa-d3p0cm"
    | "pressure-recovery-aa-d3p8cm";
  recoveredRootPortValveProfileId:
    | "Land2017-Zc-Garcia-AA-d2p5cm-local-opening"
    | "Land2017-Zc-Garcia-AA-d3p0cm-local-opening"
    | "Land2017-Zc-Garcia-AA-d3p8cm-local-opening";
  geometryProvenance: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryProfileV1["geometryProvenance"];
}>;

const GEOMETRY_DEFINITIONS_V1 = Object.freeze([
  Object.freeze({
    geometryId: "d2p5" as const,
    ascendingAorticDiameterCm: 2.5 as const,
    pressureRecoveryProfileId: "pressure-recovery-aa-d2p5cm" as const,
    recoveredRootPortValveProfileId:
      "Land2017-Zc-Garcia-AA-d2p5cm-local-opening" as const,
    geometryProvenance:
      "rounded-2p5cm-stress-endpoint-informed-by-Garcia-2003-2p54cm-in-vitro-aorta" as const,
  }),
  Object.freeze({
    geometryId: "d3p0" as const,
    ascendingAorticDiameterCm: 3 as const,
    pressureRecoveryProfileId: "pressure-recovery-aa-d3p0cm" as const,
    recoveredRootPortValveProfileId:
      "Land2017-Zc-Garcia-AA-d3p0cm-local-opening" as const,
    geometryProvenance:
      "retained-current-model-d3p0cm-reference-with-ASE-small-aorta-pressure-recovery-context" as const,
  }),
  Object.freeze({
    geometryId: "d3p8" as const,
    ascendingAorticDiameterCm: 3.8 as const,
    pressureRecoveryProfileId: "pressure-recovery-aa-d3p8cm" as const,
    recoveredRootPortValveProfileId:
      "Land2017-Zc-Garcia-AA-d3p8cm-local-opening" as const,
    geometryProvenance: "Garcia-2003-3p8cm-in-vitro-aorta" as const,
  }),
] satisfies readonly GeometryDefinitionV1[]);

function geometryProfile(
  definition: GeometryDefinitionV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryProfileV1 {
  const pressureRecoveryProfile = resolveMainWireAorticValveResearchProfileV1(
    definition.pressureRecoveryProfileId,
  );
  const recoveredRootPortValveProfile =
    resolveMainWireAorticRecoveredRootPortValveProfileV1(
      definition.recoveredRootPortValveProfileId,
    );
  const expectedAreaCm2 =
    Math.PI * (definition.ascendingAorticDiameterCm / 2) ** 2;
  if (
    pressureRecoveryProfile.openingMode !== "bounded-backward-euler-memory" ||
    pressureRecoveryProfile.forwardConvectivePressureMode !==
      "garcia-energy-loss-plus-downstream-kinetic-flux" ||
    pressureRecoveryProfile.ascendingAorticDiameterCm !==
      definition.ascendingAorticDiameterCm ||
    pressureRecoveryProfile.ascendingAorticAreaCm2 !== expectedAreaCm2 ||
    recoveredRootPortValveProfile.pressureRecoveryProfileId !==
      pressureRecoveryProfile.profileId ||
    !(expectedAreaCm2 > 3.5)
  ) {
    throw new Error(
      `${definition.geometryId} pressure-recovery geometry/profile identity is invalid for AVA 3.5 cm2`,
    );
  }
  return Object.freeze({
    geometryId: definition.geometryId,
    ascendingAorticDiameterCm: definition.ascendingAorticDiameterCm,
    ascendingAorticAreaCm2: expectedAreaCm2,
    pressureRecoveryProfileId: pressureRecoveryProfile.profileId,
    recoveredRootPortValveProfileId: recoveredRootPortValveProfile.profileId,
    pressureRecoveryProfile,
    recoveredRootPortValveProfile,
    fixedMaximumForwardEoaCm2: 3.5 as const,
    ascendingAorticAreaExceedsMaximumForwardEoa: true as const,
    geometryRole:
      definition.geometryId === "d3p0"
        ? ("retained-v10-d3p0-reference" as const)
        : ("literature-context-anchored-research-stress" as const),
    geometryProvenance: definition.geometryProvenance,
    subjectSpecificMeasurement: false as const,
    populationNormalRangeClaimed: false as const,
    parameterSearchOrFitting: false as const,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_PROFILES_V1 =
  Object.freeze(GEOMETRY_DEFINITIONS_V1.map(geometryProfile));

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellV1 =
  Readonly<{
    cellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1;
    sourceFixedHorizonSentinelArm: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmV1;
    geometryProfile: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryProfileV1;
    executionRoute:
      | "existing-d3p0-fixed-horizon-sentinel"
      | "new-pressure-recovery-geometry-fixed-horizon-sentinel";
    newExactSimulationRequired: boolean;
    existingD3p0ExactSimulationReused: boolean;
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1 =
  Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.flatMap(
      (sourceFixedHorizonSentinelArm) =>
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_PROFILES_V1.map(
          (geometryProfile) => {
            const existingD3p0ExactSimulationReused =
              geometryProfile.geometryId === "d3p0";
            return Object.freeze({
              cellId:
                `${sourceFixedHorizonSentinelArm.sentinelArmId}__aa-${geometryProfile.geometryId}` as MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1,
              sourceFixedHorizonSentinelArm,
              geometryProfile,
              executionRoute: existingD3p0ExactSimulationReused
                ? ("existing-d3p0-fixed-horizon-sentinel" as const)
                : ("new-pressure-recovery-geometry-fixed-horizon-sentinel" as const),
              newExactSimulationRequired: !existingD3p0ExactSimulationReused,
              existingD3p0ExactSimulationReused,
            });
          },
        ),
    ),
  );

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELL_IDS_V1 =
  Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1.map(
      (cell) => cell.cellId,
    ),
  );

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_NEW_EXACT_SIMULATION_CELL_IDS_V1 =
  Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1.filter(
      (cell) => cell.newExactSimulationRequired,
    ).map(
      (cell) =>
        cell.cellId as MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryNewExactSimulationCellIdV1,
    ),
  );

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1 =
  Object.freeze({
    role: "fixed-AA-geometry-stress-on-frozen-V10-limiting-union" as const,
    sourceFrozenLimitingArmCount: 6 as const,
    fixedAscendingAorticDiameterCmCount: 3 as const,
    closedGeometryCellCount: 18 as const,
    retainedD3p0ExistingExactSimulationCount: 6 as const,
    newExactSimulationCount: 12 as const,
    d3p0CellsRouteToExistingFixedHorizonSentinel: true as const,
    newGeometryRunnerAcceptsD3p0Cells: false as const,
    fixedAscendingAorticDiametersCm: Object.freeze([2.5, 3, 3.8] as const),
    diameterBracketRole:
      "literature-context-anchored-research-stress-not-population-normal-range" as const,
    garciaInVitroTwoAortaSource:
      "Garcia-et-al-JACC-2003-DOI-10.1016/S0735-1097(02)02764-X" as const,
    garciaPublishedAscendingAorticDiametersCm: Object.freeze([
      2.54, 3.8,
    ] as const),
    d2p5IsPrespecifiedRoundedStressEndpointInformedByPublished2p54Cm:
      true as const,
    d3p8MatchesPublishedExperimentalDiameter: true as const,
    d3p0IsRetainedCurrentModelReferenceWithAseSmallAortaPressureRecoveryContext:
      true as const,
    threePointBracketClaimedAsPopulationInterval: false as const,
    subjectSpecificAscendingAorticGeometryUsed: false as const,
    populationNormalRangeClaimed: false as const,
    aorticMaximumForwardEoaHeldAtCm2: 3.5 as const,
    everyAscendingAorticAreaExceedsMaximumForwardEoa: true as const,
    geometryAxisChangesOnlyFixedAscendingAorticPressureRecoveryStationArea:
      true as const,
    aorticCharacteristicImpedanceChangedByGeometryAxis: false as const,
    arterialComplianceChangedByGeometryAxis: false as const,
    vascularVolumeOrUnstressedVolumeChangedByGeometryAxis: false as const,
    wholeVesselGeometryChangeModeled: false as const,
    pressureRecoveryLaw:
      "Garcia-ELCo-irreversible-loss-plus-fixed-AA-kinetic-transport" as const,
    boundedLeafletOpeningMemoryRetained: true as const,
    flowMemoryAddedByGeometryAxis: false as const,
    localValveOrRootInertanceAddedByGeometryAxis: false as const,
    pressureOrFlowSmoothingAddedByGeometryAxis: false as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    fixedPhysicalHorizonSec: 48 as const,
    fixedStepsPerCycle: 4_000 as const,
    independentCanonicalColdStartPerNewExecution: true as const,
    arbitraryNumericGeometryOrExecutionOverrideAccepted: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellV1(
  cellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1.find(
      (candidate) => candidate.cellId === cellId,
    );
  if (resolved === undefined) {
    throw new Error(
      `unsupported V10 pressure-recovery geometry sentinel cell: ${String(cellId)}`,
    );
  }
  return resolved;
}
