import { createHash } from "node:crypto";

import type {
  CoronaryHydraulicBoundaryInputV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
  resolveMainWireCoronaryBoundaryV2,
  weightedMainWireCoronaryFractionalShorteningV2,
  type MainWireCoronaryImpMechanismV2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
} from "@/engine/coronary/typesV2";

export type CoronaryV2ShadowWallNumbers = Readonly<{
  LVFW: number;
  SEP: number;
  RVFW: number;
}>;

export type CoronaryV2ShadowImpMechanism = MainWireCoronaryImpMechanismV2;

export type CoronaryV2ShadowPhaseDefinition = Readonly<{
  mitralClosurePhase01: number;
  aorticOpeningPhase01: number;
  aorticClosurePhase01: number;
}>;

export type CoronaryV2ShadowSourceSample = Readonly<{
  cyclePhase01: number;
  pressureMmHg: Readonly<{
    Ao: number;
    LV: number;
    RV: number;
    RA: number;
    perivascularExternal: number;
    intramyocardialByTerritoryLayer:
      CoronaryTerritoryLayerRecordV2<number>;
  }>;
  mechanics: Readonly<{
    chamberTransmuralPressureMmHg: Readonly<{ LV: number; RV: number }>;
    effectiveFiberLogStrainByWall: CoronaryV2ShadowWallNumbers;
    landActiveFiberStressPaByWall: CoronaryV2ShadowWallNumbers;
  }>;
}>;

export type CoronaryV2ShorteningImpReference = Readonly<{
  referenceEvent: "accepted-mitral-closure";
  referencePhase01: number;
  referenceFiberLogStrainByWall: CoronaryV2ShadowWallNumbers;
  positivePartSmoothingWidthFraction: number;
  targetPeakShorteningPressureMmHg: 15;
  peakWeightedFractionalShorteningByTerritory:
    CoronaryTerritoryRecordV2<number>;
  pressureGainMmHgPerUnitShorteningByTerritory:
    CoronaryTerritoryRecordV2<number>;
  amplitudePriorOwner:
    "algranati-normal-peak-weak-prior-not-waveform-fit";
}>;

export type CoronaryV2ShadowBoundarySnapshot = Readonly<{
  Ao: number;
  RA: number;
  perivascularExternal: number;
  intramyocardialByTerritoryLayer:
    CoronaryTerritoryLayerRecordV2<number>;
}>;

export type CoronaryV2R1ReferenceNumericalReport = Readonly<{
  completed: boolean;
  finalSummary: Readonly<{
    closure: Readonly<{
      maximumAbsoluteMl: number;
      maximumRelative01: number;
    }>;
    summary: Readonly<{
      maximumSolverResidualInfinityNormMl: number;
    }>;
    toneStep: Readonly<{
      layerStepByTerritoryLayer: CoronaryTerritoryLayerRecordV2<Readonly<{
        achievedMeanTissueFlowMlPerSec: number;
        demandTargetFlowMlPerSec: number;
        boundedAt: "minimum" | "maximum" | "interior";
      }>>;
    }>;
  }>;
  runHealth: Readonly<{
    maximumAbsoluteLedgerResidualMl: number;
    minimumEdgeDissipatedPowerMmHgMlPerSec: number;
    allPassiveEdgesNonnegativePower: boolean;
  }>;
}>;

export const CORONARY_V2_R1_REFERENCE_NUMERICAL_GATES = Object.freeze({
  maximumRelativeVolumeClosure01: 1e-5,
  maximumAbsoluteLedgerResidualMl: 1e-6,
  maximumSolverResidualInfinityNormMl: 1e-6,
  minimumPassivePowerToleranceMmHgMlPerSec: -1e-10,
  maximumRelativeMeanQmTargetError01: 1e-3,
});

export type CoronaryV2R1ReferenceNumericalAudit = Readonly<{
  maximumRelativeMeanQmTargetError01: number;
  nonInteriorLayerCount: number;
}>;

export function resolveCoronaryV2ShadowBoundary(
  sample: CoronaryV2ShadowSourceSample,
  impMechanism: CoronaryV2ShadowImpMechanism,
  shorteningReference: CoronaryV2ShorteningImpReference | null,
): CoronaryHydraulicBoundaryInputV2 {
  return resolveMainWireCoronaryBoundaryV2(Object.freeze({
    absoluteAorticPressureMmHg: sample.pressureMmHg.Ao,
    absoluteRightAtrialPressureMmHg: sample.pressureMmHg.RA,
    sourceIntramyocardialPressureMmHgByTerritoryLayer:
      sample.pressureMmHg.intramyocardialByTerritoryLayer,
    mechanicsInput: Object.freeze({
      externalPressureMmHg: sample.pressureMmHg.perivascularExternal,
      chamberTransmuralPressureMmHg: Object.freeze({
        LV: sample.mechanics.chamberTransmuralPressureMmHg.LV,
        RV: sample.mechanics.chamberTransmuralPressureMmHg.RV,
      }),
      landActiveFiberStressPaByWall:
        sample.mechanics.landActiveFiberStressPaByWall,
    }),
    effectiveFiberLogStrainByWall:
      sample.mechanics.effectiveFiberLogStrainByWall,
  }), impMechanism, shorteningReference);
}

/** Report exactly the boundary passed to the hydraulic solver. */
export function snapshotCoronaryV2ShadowBoundary(
  boundary: CoronaryHydraulicBoundaryInputV2,
): CoronaryV2ShadowBoundarySnapshot {
  return Object.freeze({
    Ao: boundary.absoluteAorticPressureMmHg,
    RA: boundary.absoluteRightAtrialPressureMmHg,
    perivascularExternal: boundary.perivascularExternalPressureMmHg,
    intramyocardialByTerritoryLayer: copyLayers(
      boundary.intramyocardialPressureMmHgByTerritoryLayer,
    ),
  });
}

export function buildCoronaryV2ShorteningImpReference(
  sourceReport: Readonly<{ samples: readonly CoronaryV2ShadowSourceSample[] }>,
  phase: CoronaryV2ShadowPhaseDefinition,
): CoronaryV2ShorteningImpReference {
  const referenceSample = [...sourceReport.samples].sort((a, b) =>
    cyclicDistance(a.cyclePhase01, phase.mitralClosurePhase01)
    - cyclicDistance(b.cyclePhase01, phase.mitralClosurePhase01))[0]!;
  const referenceFiberLogStrainByWall = Object.freeze({
    ...referenceSample.mechanics.effectiveFiberLogStrainByWall,
  });
  const smoothingWidth =
    NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2
      .positivePartSmoothingWidthFraction;
  const peakWeightedFractionalShorteningByTerritory = copyTerritory(
    Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Math.max(...sourceReport.samples.map((sample) =>
        weightedMainWireCoronaryFractionalShorteningV2(
          sample.mechanics.effectiveFiberLogStrainByWall,
          referenceFiberLogStrainByWall,
          territoryId,
          smoothingWidth,
        ))),
    ])) as CoronaryTerritoryRecordV2<number>,
  );
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    const peak = peakWeightedFractionalShorteningByTerritory[territoryId];
    if (!Number.isFinite(peak) || peak <= 0) {
      throw new Error(`${territoryId} has no positive shortening after MVC`);
    }
  }
  const targetPeakShorteningPressureMmHg =
    NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2
      .normalReferenceCalibration.targetPeakShorteningPressureMmHg;
  const pressureGainMmHgPerUnitShorteningByTerritory = copyTerritory(
    NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2
      .pressureGainMmHgPerUnitShorteningByTerritory,
  );
  return Object.freeze({
    referenceEvent: "accepted-mitral-closure" as const,
    referencePhase01: referenceSample.cyclePhase01,
    referenceFiberLogStrainByWall,
    positivePartSmoothingWidthFraction: smoothingWidth,
    targetPeakShorteningPressureMmHg,
    peakWeightedFractionalShorteningByTerritory,
    pressureGainMmHgPerUnitShorteningByTerritory,
    amplitudePriorOwner:
      "algranati-normal-peak-weak-prior-not-waveform-fit" as const,
  });
}

export function fingerprintCoronaryV2ShadowBoundarySource(
  sourceReport: Readonly<{
    schema: string;
    configuration: Readonly<{ dtSec: number; cycleLengthSec: number }>;
    samples: readonly CoronaryV2ShadowSourceSample[];
  }>,
  protocol: Readonly<{
    phaseDefinition: CoronaryV2ShadowPhaseDefinition;
    impMechanism: CoronaryV2ShadowImpMechanism;
    shorteningReference: CoronaryV2ShorteningImpReference | null;
  }>,
): string {
  return createHash("sha256").update(JSON.stringify({
    sourceSchema: sourceReport.schema,
    dtSec: sourceReport.configuration.dtSec,
    cycleLengthSec: sourceReport.configuration.cycleLengthSec,
    phaseDefinition: protocol.phaseDefinition,
    impMechanism: protocol.impMechanism,
    shorteningReference: protocol.shorteningReference,
    samples: sourceReport.samples.map((sample) => ({
      cyclePhase01: sample.cyclePhase01,
      pressureMmHg: sample.pressureMmHg,
      mechanics: sample.mechanics,
      resolvedBoundary: snapshotCoronaryV2ShadowBoundary(
        resolveCoronaryV2ShadowBoundary(
          sample,
          protocol.impMechanism,
          protocol.shorteningReference,
        ),
      ),
    })),
  })).digest("hex");
}

export function validateCoronaryV2R1ReferenceNumerics(
  report: CoronaryV2R1ReferenceNumericalReport,
): CoronaryV2R1ReferenceNumericalAudit {
  const values = Object.freeze({
    relativeClosure: report.finalSummary.closure.maximumRelative01,
    absoluteClosure: report.finalSummary.closure.maximumAbsoluteMl,
    ledgerResidual: report.runHealth.maximumAbsoluteLedgerResidualMl,
    solverResidual:
      report.finalSummary.summary.maximumSolverResidualInfinityNormMl,
    minimumPassivePower:
      report.runHealth.minimumEdgeDissipatedPowerMmHgMlPerSec,
  });
  for (const [name, value] of Object.entries(values)) {
    if (!Number.isFinite(value)) {
      throw new Error(`R1 reference report has non-finite ${name}`);
    }
  }
  if (!report.completed) {
    throw new Error("R1 reference report is incomplete");
  }
  if (
    values.relativeClosure
      > CORONARY_V2_R1_REFERENCE_NUMERICAL_GATES
        .maximumRelativeVolumeClosure01
  ) {
    throw new Error("R1 reference report has not reached volume periodicity");
  }
  if (
    values.ledgerResidual
      > CORONARY_V2_R1_REFERENCE_NUMERICAL_GATES
        .maximumAbsoluteLedgerResidualMl
    || values.solverResidual
      > CORONARY_V2_R1_REFERENCE_NUMERICAL_GATES
        .maximumSolverResidualInfinityNormMl
  ) {
    throw new Error("R1 reference report fails its numerical residual gate");
  }
  if (
    !report.runHealth.allPassiveEdgesNonnegativePower
    || values.minimumPassivePower
      < CORONARY_V2_R1_REFERENCE_NUMERICAL_GATES
        .minimumPassivePowerToleranceMmHgMlPerSec
  ) {
    throw new Error("R1 reference report fails passive-edge dissipation");
  }
  let maximumRelativeMeanQmTargetError01 = 0;
  let nonInteriorLayerCount = 0;
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      const layer = report.finalSummary.toneStep
        .layerStepByTerritoryLayer[territoryId][layerId];
      const achieved = layer.achievedMeanTissueFlowMlPerSec;
      const target = layer.demandTargetFlowMlPerSec;
      if (
        !Number.isFinite(achieved)
        || achieved <= 0
        || !Number.isFinite(target)
        || target <= 0
      ) {
        throw new Error("R1 reference report has invalid mean-Qm target audit");
      }
      maximumRelativeMeanQmTargetError01 = Math.max(
        maximumRelativeMeanQmTargetError01,
        Math.abs(achieved / target - 1),
      );
      if (layer.boundedAt !== "interior") nonInteriorLayerCount += 1;
    }
  }
  if (
    maximumRelativeMeanQmTargetError01
      > CORONARY_V2_R1_REFERENCE_NUMERICAL_GATES
        .maximumRelativeMeanQmTargetError01
  ) {
    throw new Error("R1 reference report has not reached its mean-Qm target");
  }
  if (nonInteriorLayerCount > 0) {
    throw new Error("R1 reference report lacks interior resistance reserve");
  }
  return Object.freeze({
    maximumRelativeMeanQmTargetError01,
    nonInteriorLayerCount,
  });
}

function cyclicDistance(a: number, b: number): number {
  const difference = Math.abs(a - b);
  return Math.min(difference, 1 - difference);
}

function copyTerritory(
  input: CoronaryTerritoryRecordV2<number>,
): CoronaryTerritoryRecordV2<number> {
  return Object.freeze({ ...input });
}

function copyLayers(
  input: CoronaryTerritoryLayerRecordV2<number>,
): CoronaryTerritoryLayerRecordV2<number> {
  return Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Object.freeze({ ...input[territoryId] }),
    ]),
  )) as CoronaryTerritoryLayerRecordV2<number>;
}
