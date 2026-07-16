import protocolDescriptor from
  "@/data/mechanics2/protocols/five-patch-physiology-envelope-v2.json";
import {
  DETERMINISTIC_MAXIMIN_LHS_ALGORITHM_ID_V1,
  generateDeterministicMaximinLhsV1,
} from "@/engine/mechanics2/envelope/DeterministicMaximinLhsV1";
import type { SmoothInertialValveParamsV2 } from
  "@/engine/mechanics2/valve/SmoothInertialValveV2";

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DEFINITION_ID_V2 =
  "five-patch-physiology-envelope-definition-v2" as const;

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DIMENSION_IDS_V2 = Object.freeze([
  "atrialActiveScale",
  "ventricularActiveScale",
  "atrialCalciumDecayScale",
  "ventricularCalciumDecayScale",
  "avDelaySec",
  "ventricularPassiveTangentScale",
  "mitralHydraulicAreaScale",
  "pulmonaryVenousResistanceScale",
  "pulmonaryVenousInertanceScale",
  "pulmonaryVeinComplianceScale",
  "bloodVolumeScale",
  "systemicResistanceScale",
] as const);

export type FivePatchPhysiologyEnvelopeDimensionIdV2 =
  typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DIMENSION_IDS_V2[number];
export type FivePatchPhysiologyEnvelopeTransformV2 = "linear" | "log";

export type FivePatchPhysiologyEnvelopeParameterDimensionV2 = {
  readonly dimensionId: FivePatchPhysiologyEnvelopeDimensionIdV2;
  readonly transform: FivePatchPhysiologyEnvelopeTransformV2;
  readonly minimum: number;
  readonly maximum: number;
  readonly unit: string;
  readonly role: string;
};

export type FivePatchPhysiologyEnvelopeScenarioV2 = {
  readonly scenarioId: string;
  readonly heartRateBpm: number;
  readonly bloodVolumeScale: number;
  readonly systemicResistanceScale: number;
  readonly pulmonaryResistanceScale: number;
};

export type FivePatchPhysiologyEnvelopeParameterVectorV2 = Readonly<
  Record<FivePatchPhysiologyEnvelopeDimensionIdV2, number>
>;

export type FivePatchPhysiologyEnvelopeMitralHydraulicsV2 =
  SmoothInertialValveParamsV2;

export type FivePatchPhysiologyEnvelopePlanPointV2 = {
  readonly phase:
    | "arm-numerical-readiness"
    | "screening"
    | "stress-validation"
    | "dt-refinement";
  readonly candidateIndex: number;
  readonly scenarioId: string;
  readonly beats: number;
  readonly dtSec: number;
};

type FixedIndexExecutionPhaseV2 = {
  readonly selection: string;
  readonly candidateIndices: readonly number[];
  readonly scenarioIds: readonly string[];
  readonly beats: number;
  readonly dtSec: number;
  readonly retainEveryEndpointOfFinalCycle: boolean;
};

type FivePatchPhysiologyEnvelopeProtocolDescriptorV2 = {
  readonly protocolId: string;
  readonly evidenceStatus: string;
  readonly modelClass: {
    readonly activeLaw: string;
    readonly passiveLaw: string;
    readonly slsTopology: string;
    readonly slsEnabledPatches: readonly string[];
    readonly slsParametersFixed: boolean;
    readonly landCellularParametersFixed: boolean;
    readonly calciumAmplitudeFixed: boolean;
    readonly dynamicAvPlaneState: boolean;
    readonly shapeCoordinate: boolean;
    readonly pericardium: boolean;
  };
  readonly design: {
    readonly algorithmId: string;
    readonly sampleCount: number;
    readonly dimensionCount: number;
    readonly candidateSeeds: readonly number[];
    readonly selectedSeed: number;
    readonly selectedMinimumPairwiseDistance: number;
    readonly selectionUsesSimulationOutcomes: boolean;
  };
  readonly structuralArm: {
    readonly armId: string;
    readonly activeLaw: string;
    readonly passiveLaw: string;
    readonly slsTopology: string;
    readonly slsParametersVaryInEnvelope: boolean;
  };
  readonly parameterDimensions:
    readonly FivePatchPhysiologyEnvelopeParameterDimensionV2[];
  readonly coupledTransforms: {
    readonly mitralHydraulics: {
      readonly scaleDimensionId: string;
      readonly openAreaExponent: number;
      readonly leakAreaExponent: number;
      readonly openResistanceExponent: number;
      readonly openInertanceExponent: number;
      readonly openBernoulliExponent: number;
      readonly openingMidpointExponent: number;
      readonly openingWidthExponent: number;
      readonly flowSmoothingExponent: number;
    };
    readonly activationTiming: {
      readonly scaleDimensionId: string;
      readonly meaning: string;
      readonly preserveExistingWithinAtrialAndWithinVentricularOffsets: boolean;
      readonly heartRateInvariantPhysicalTime: boolean;
    };
  };
  readonly protocolMatrix: readonly FivePatchPhysiologyEnvelopeScenarioV2[];
  readonly executionPolicy: {
    readonly initialization: string;
    readonly scenarioComposition: string;
    readonly bloodVolumeAllocation: {
      readonly meaning: string;
      readonly mutableCompartments: readonly string[];
      readonly systemicVeinWeight: number;
      readonly pulmonaryVeinWeight: number;
      readonly preservedCompartments: readonly string[];
    };
    readonly crossCandidateWarmStartAllowed: boolean;
    readonly simulationOutcomeAdaptiveSamplingAllowed: boolean;
    readonly gradientOrLocalOptimizerAllowed: boolean;
    readonly scalarWinnerScoreAllowed: boolean;
    readonly automaticWinnerSelectionAllowed: boolean;
    readonly parameterRangeChangeAfterOutcomeInspectionAllowed: boolean;
    readonly resultDependentRunExtensionAllowed: boolean;
    readonly vLoopMetricsAffectEligibility: boolean;
    readonly vLoopMetricsAffectSelection: boolean;
    readonly fullStateReturnMapMaxAbsDimensionlessTolerance: number;
    readonly settleAndAssess: {
      readonly appliesToPhases: readonly string[];
      readonly singleContinuousRun: boolean;
      readonly calciumAmplitudeRamp: {
        readonly beatNumbers: readonly number[];
        readonly commonMultipliers: readonly number[];
      };
      readonly discardSettleBeatNumbersInclusive: readonly number[];
      readonly assessmentBeatNumbersInclusive: readonly number[];
      readonly retainedAssessmentCycleBoundaryStateCount: number;
      readonly retainedRawCycleCount: number;
      readonly consecutiveFullStateReturnMapCount: number;
      readonly evaluationRequiresCompletedRun: boolean;
      readonly morphologyMetricsUsedAsSettlingGate: boolean;
    };
    readonly screening: {
      readonly candidateIndices: string;
      readonly scenarioIds: readonly string[];
      readonly beats: number;
      readonly dtSec: number;
      readonly retainEveryEndpointOfFinalCycle: boolean;
    };
    readonly armNumericalReadiness: FixedIndexExecutionPhaseV2 & {
      readonly requiredBeforeFullEnvelope: boolean;
      readonly failureInterpretation: string;
    };
    readonly stressValidation: FixedIndexExecutionPhaseV2 & {
      readonly scheduledInFirstSlice: boolean;
    };
    readonly dtRefinement: Omit<FixedIndexExecutionPhaseV2, "dtSec"> & {
      readonly dtSec: readonly number[];
      readonly scheduledInFirstSlice: boolean;
    };
  };
  readonly eligibilityPolicy: {
    readonly predeclaredBeforeSimulationResults: boolean;
    readonly numerical: {
      readonly requiresCompletedRun: boolean;
      readonly requiresAllAcceptedOutputsFinite: boolean;
      readonly requiresAllCompartmentVolumesPositive: boolean;
      readonly maximumAbsoluteBloodVolumeResidualMl: number;
      readonly periodicity: {
        readonly requiredPhases: readonly string[];
        readonly notRequiredPhases: readonly string[];
        readonly consecutiveFullStateReturnMapCount: number;
        readonly maximumAbsoluteDimensionlessResidual: number;
      };
      readonly excludedMetrics: readonly string[];
    };
    readonly broadOperatingPoint: {
      readonly role: string;
      readonly assessmentSource: string;
      readonly leftAtrialPressureMmHg: NumericRangeV2;
      readonly leftVentricularPeakPressureMmHg: NumericRangeV2;
      readonly aorticPressureMmHg: NumericRangeV2;
      readonly cardiacOutputLPerMin: NumericRangeV2;
      readonly leftVentricularEjectionFraction: NumericRangeV2;
      readonly pulmonaryVeinPressureMmHg: NumericRangeV2;
      readonly valveReverseFlow: {
        readonly valveIds: readonly string[];
        readonly maximumReverseVolumeMl: {
          readonly absoluteFloorMl: number;
          readonly forwardVolumeFraction: number;
          readonly combination: string;
        };
        readonly reverseFlowDuty: {
          readonly status: string;
          readonly eligibilityThreshold: null;
        };
      };
      readonly excludedMetrics: readonly string[];
    };
  };
  readonly reportingPolicy: {
    readonly vLoopStatus: string;
    readonly vLoopMetrics: readonly string[];
    readonly excludedFromSettling: boolean;
    readonly excludedFromOperatingPointEligibility: boolean;
    readonly excludedFromCandidateSelection: boolean;
    readonly excludedFromRangeRevision: boolean;
  };
  readonly claimBoundary: {
    readonly runtimeAdoption: boolean;
    readonly patientFit: boolean;
    readonly normalHumanCalibration: boolean;
    readonly physiologyAcceptance: boolean;
    readonly structuralWinnerDeclared: boolean;
    readonly vLoopMechanismDeclared: boolean;
    readonly designMayBeChangedAfterResults: boolean;
  };
};

type NumericRangeV2 = {
  readonly minimum: number;
  readonly maximum: number;
};

const protocol = protocolDescriptor as unknown as
  FivePatchPhysiologyEnvelopeProtocolDescriptorV2;
validateProtocol(protocol);
deepFreeze(protocol);

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2 = protocol;
export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SAMPLE_COUNT_V2 =
  protocol.design.sampleCount;
export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_DIMENSIONS_V2 =
  protocol.parameterDimensions;
export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_MATRIX_V2 =
  protocol.protocolMatrix;
export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_ELIGIBILITY_POLICY_V2 =
  protocol.eligibilityPolicy;

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2 =
  generateDeterministicMaximinLhsV1({
    sampleCount: protocol.design.sampleCount,
    dimensionCount: protocol.design.dimensionCount,
    candidateSeeds: protocol.design.candidateSeeds,
  });

validateGeneratedDesign(protocol, FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2);

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_INDICES_V2 =
  Object.freeze(Array.from({ length: protocol.design.sampleCount }, (_, index) => index));
export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_READINESS_INDICES_V2 =
  protocol.executionPolicy.armNumericalReadiness.candidateIndices;
export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_STRESS_INDICES_V2 =
  protocol.executionPolicy.stressValidation.candidateIndices;
export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DT_REFINEMENT_INDICES_V2 =
  protocol.executionPolicy.dtRefinement.candidateIndices;

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_READINESS_PLAN_V2 =
  expandFixedDtPlan(
    "arm-numerical-readiness",
    protocol.executionPolicy.armNumericalReadiness,
  );
export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_PLAN_V2 =
  expandFixedDtPlan(
    "screening",
    {
      candidateIndices: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_INDICES_V2,
      scenarioIds: protocol.executionPolicy.screening.scenarioIds,
      beats: protocol.executionPolicy.screening.beats,
      dtSec: protocol.executionPolicy.screening.dtSec,
    },
  );
export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_STRESS_PLAN_V2 =
  expandFixedDtPlan(
    "stress-validation",
    protocol.executionPolicy.stressValidation,
  );
export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DT_REFINEMENT_PLAN_V2 =
  expandDtRefinementPlan(protocol.executionPolicy.dtRefinement);

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DEFINITION_V2 = Object.freeze({
  definitionId: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DEFINITION_ID_V2,
  evidenceStatus: protocol.evidenceStatus,
  protocol,
  unitDesign: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2,
  plans: Object.freeze({
    readiness: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_READINESS_PLAN_V2,
    screening: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_PLAN_V2,
    stressValidation: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_STRESS_PLAN_V2,
    dtRefinement: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DT_REFINEMENT_PLAN_V2,
  }),
  selectionPolicy: Object.freeze({
    type: "pre-registered-space-filling-envelope-with-fixed-subsets" as const,
    usesSimulationOutcomeToChoosePoints: false as const,
    localOptimizationAvailable: false as const,
    automaticWinnerSelectionAvailable: false as const,
    vLoopMetricsAreReportOnly: true as const,
  }),
});

export function mapFivePatchPhysiologyEnvelopeUnitPointV2(
  unitPoint: readonly number[],
): FivePatchPhysiologyEnvelopeParameterVectorV2 {
  if (unitPoint.length !== protocol.design.dimensionCount) {
    throw new Error(
      `unit point has ${unitPoint.length} dimensions; expected ` +
        protocol.design.dimensionCount,
    );
  }
  const entries = protocol.parameterDimensions.map((dimension, index) => {
    const unit = unitPoint[index]!;
    if (!Number.isFinite(unit) || unit <= 0 || unit >= 1) {
      throw new Error(
        "unit point coordinates must be finite and strictly inside (0, 1)",
      );
    }
    return [dimension.dimensionId, transformUnit(unit, dimension)] as const;
  });
  return Object.freeze(Object.fromEntries(entries)) as
    FivePatchPhysiologyEnvelopeParameterVectorV2;
}

export function fivePatchPhysiologyEnvelopeParametersAtIndexV2(
  candidateIndex: number,
): FivePatchPhysiologyEnvelopeParameterVectorV2 {
  requireCandidateIndex(candidateIndex);
  return mapFivePatchPhysiologyEnvelopeUnitPointV2(
    FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2.points[candidateIndex]!,
  );
}

export function fivePatchPhysiologyEnvelopeCandidateIdV2(
  candidateIndex: number,
): string {
  requireCandidateIndex(candidateIndex);
  return `${protocol.structuralArm.armId}::lhs-${
    String(candidateIndex).padStart(2, "0")
  }`;
}

/**
 * Apply the one identifiable MV hydraulic axis committed by the protocol.
 * Area and leak area share scale s; linear resistance and Bernoulli loss use
 * s^-2; inertance uses s^-1. Valve opening thresholds remain unchanged.
 */
export function mapFivePatchPhysiologyEnvelopeMitralHydraulicsV2(
  baseline: FivePatchPhysiologyEnvelopeMitralHydraulicsV2,
  scale: number,
): FivePatchPhysiologyEnvelopeMitralHydraulicsV2 {
  if (baseline.valveId !== "MV") {
    throw new Error("the coupled mitral hydraulic transform requires valveId MV");
  }
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error("mitral hydraulic area scale must be finite and positive");
  }
  return Object.freeze({
    ...baseline,
    openAreaCm2: baseline.openAreaCm2 * scale,
    leakAreaCm2: baseline.leakAreaCm2 * scale,
    openResistanceMmHgSecPerMl:
      baseline.openResistanceMmHgSecPerMl / scale ** 2,
    openInertanceMmHgSec2PerMl:
      baseline.openInertanceMmHgSec2PerMl / scale,
    openBernoulliMmHgSec2PerMl2:
      baseline.openBernoulliMmHgSec2PerMl2 / scale ** 2,
  });
}

function transformUnit(
  unit: number,
  dimension: FivePatchPhysiologyEnvelopeParameterDimensionV2,
): number {
  if (dimension.transform === "linear") {
    return dimension.minimum + unit *
      (dimension.maximum - dimension.minimum);
  }
  return Math.exp(
    Math.log(dimension.minimum) + unit *
      (Math.log(dimension.maximum) - Math.log(dimension.minimum)),
  );
}

function expandFixedDtPlan(
  phase: FivePatchPhysiologyEnvelopePlanPointV2["phase"],
  definition: {
    readonly candidateIndices: readonly number[];
    readonly scenarioIds: readonly string[];
    readonly beats: number;
    readonly dtSec: number;
  },
): readonly FivePatchPhysiologyEnvelopePlanPointV2[] {
  return Object.freeze(definition.candidateIndices.flatMap((candidateIndex) =>
    definition.scenarioIds.map((scenarioId) => Object.freeze({
      phase,
      candidateIndex,
      scenarioId,
      beats: definition.beats,
      dtSec: definition.dtSec,
    }))
  ));
}

function expandDtRefinementPlan(
  definition: FivePatchPhysiologyEnvelopeProtocolDescriptorV2["executionPolicy"]["dtRefinement"],
): readonly FivePatchPhysiologyEnvelopePlanPointV2[] {
  return Object.freeze(definition.candidateIndices.flatMap((candidateIndex) =>
    definition.scenarioIds.flatMap((scenarioId) =>
      definition.dtSec.map((dtSec) => Object.freeze({
        phase: "dt-refinement" as const,
        candidateIndex,
        scenarioId,
        beats: definition.beats,
        dtSec,
      }))
    )
  ));
}

function requireCandidateIndex(candidateIndex: number): void {
  if (
    !Number.isInteger(candidateIndex) ||
    candidateIndex < 0 ||
    candidateIndex >= protocol.design.sampleCount
  ) {
    throw new Error("candidateIndex is outside the pre-registered design");
  }
}

function validateProtocol(
  descriptor: FivePatchPhysiologyEnvelopeProtocolDescriptorV2,
): void {
  if (descriptor.protocolId !== "five-patch-physiology-envelope-v2") {
    throw new Error("unexpected five-patch physiology envelope protocol id");
  }
  if (
    descriptor.design.algorithmId !==
      DETERMINISTIC_MAXIMIN_LHS_ALGORITHM_ID_V1 ||
    descriptor.design.sampleCount !== 64 ||
    descriptor.design.dimensionCount !== 12 ||
    descriptor.parameterDimensions.length !== 12
  ) {
    throw new Error("physiology envelope design must be the pinned 64 x 12 LHS");
  }
  const expectedDimensions = [
    ["atrialActiveScale", "log", 0.15, 0.9],
    ["ventricularActiveScale", "log", 0.8, 2.5],
    ["atrialCalciumDecayScale", "log", 0.4, 1.2],
    ["ventricularCalciumDecayScale", "log", 0.45, 1.25],
    ["avDelaySec", "linear", 0.12, 0.22],
    ["ventricularPassiveTangentScale", "log", 0.6, 2.5],
    ["mitralHydraulicAreaScale", "log", 0.7, 1.5],
    ["pulmonaryVenousResistanceScale", "log", 0.5, 2],
    ["pulmonaryVenousInertanceScale", "log", 0.25, 4],
    ["pulmonaryVeinComplianceScale", "log", 0.5, 2],
    ["bloodVolumeScale", "linear", 0.85, 1.15],
    ["systemicResistanceScale", "log", 0.7, 1.4],
  ] as const;
  if (
    JSON.stringify(descriptor.parameterDimensions.map((dimension) => [
      dimension.dimensionId,
      dimension.transform,
      dimension.minimum,
      dimension.maximum,
    ])) !== JSON.stringify(expectedDimensions)
  ) {
    throw new Error("physiology envelope dimensions or bounds changed");
  }
  if (
    descriptor.modelClass.slsTopology !== "all-patch" ||
    !descriptor.modelClass.slsParametersFixed ||
    !descriptor.modelClass.landCellularParametersFixed ||
    !descriptor.modelClass.calciumAmplitudeFixed ||
    descriptor.modelClass.dynamicAvPlaneState ||
    descriptor.modelClass.shapeCoordinate ||
    descriptor.modelClass.pericardium ||
    descriptor.structuralArm.armId !==
      "land-equilibrium-passive-sls-all-patch-fixed" ||
    descriptor.structuralArm.slsParametersVaryInEnvelope
  ) {
    throw new Error("V2 must retain the one fixed all-patch-SLS model class");
  }
  const mv = descriptor.coupledTransforms.mitralHydraulics;
  if (
    mv.scaleDimensionId !== "mitralHydraulicAreaScale" ||
    JSON.stringify([
      mv.openAreaExponent,
      mv.leakAreaExponent,
      mv.openResistanceExponent,
      mv.openInertanceExponent,
      mv.openBernoulliExponent,
      mv.openingMidpointExponent,
      mv.openingWidthExponent,
      mv.flowSmoothingExponent,
    ]) !== JSON.stringify([1, 1, -2, -1, -2, 0, 0, 0])
  ) {
    throw new Error("coupled MV hydraulic transform changed");
  }
  if (
    descriptor.coupledTransforms.activationTiming.scaleDimensionId !==
      "avDelaySec" ||
    !descriptor.coupledTransforms.activationTiming.heartRateInvariantPhysicalTime
  ) {
    throw new Error("AV delay must remain an HR-invariant physical-time axis");
  }
  validateNonLocalSearchPolicy(descriptor);
  validateExecutionPlan(descriptor);
  validateEligibilityPolicy(descriptor);
}

function validateNonLocalSearchPolicy(
  descriptor: FivePatchPhysiologyEnvelopeProtocolDescriptorV2,
): void {
  const policy = descriptor.executionPolicy;
  if (
    policy.initialization !== "independent-cold-start-each-point-scenario" ||
    policy.crossCandidateWarmStartAllowed ||
    policy.simulationOutcomeAdaptiveSamplingAllowed ||
    policy.gradientOrLocalOptimizerAllowed ||
    policy.scalarWinnerScoreAllowed ||
    policy.automaticWinnerSelectionAllowed ||
    policy.parameterRangeChangeAfterOutcomeInspectionAllowed ||
    policy.resultDependentRunExtensionAllowed ||
    descriptor.design.selectionUsesSimulationOutcomes ||
    descriptor.claimBoundary.designMayBeChangedAfterResults
  ) {
    throw new Error("protocol violates the non-local-search policy");
  }
  if (
    policy.vLoopMetricsAffectEligibility ||
    policy.vLoopMetricsAffectSelection ||
    descriptor.reportingPolicy.vLoopStatus !== "report-only" ||
    !descriptor.reportingPolicy.excludedFromSettling ||
    !descriptor.reportingPolicy.excludedFromOperatingPointEligibility ||
    !descriptor.reportingPolicy.excludedFromCandidateSelection ||
    !descriptor.reportingPolicy.excludedFromRangeRevision
  ) {
    throw new Error("V-loop metrics must remain report-only");
  }
}

function validateExecutionPlan(
  descriptor: FivePatchPhysiologyEnvelopeProtocolDescriptorV2,
): void {
  const policy = descriptor.executionPolicy;
  if (
    policy.scenarioComposition !==
      "scenario-scales-multiply-mapped-candidate-scales" ||
    policy.fullStateReturnMapMaxAbsDimensionlessTolerance !== 1e-4 ||
    policy.bloodVolumeAllocation.meaning !==
      "exact-total-blood-volume-scale-with-fixed-compliant-venous-allocation" ||
    JSON.stringify(policy.bloodVolumeAllocation.mutableCompartments) !==
      JSON.stringify(["systemicVeinMl", "pulmonaryVeinMl"]) ||
    policy.bloodVolumeAllocation.systemicVeinWeight !== 60 ||
    policy.bloodVolumeAllocation.pulmonaryVeinWeight !== 13
  ) {
    throw new Error("fixed execution or blood-volume allocation policy changed");
  }
  const settle = policy.settleAndAssess;
  if (
    JSON.stringify(settle.appliesToPhases) !==
      JSON.stringify(["screening", "stress-validation", "dt-refinement"]) ||
    !settle.singleContinuousRun ||
    JSON.stringify(settle.calciumAmplitudeRamp.beatNumbers) !==
      JSON.stringify([1, 2, 3, 4]) ||
    JSON.stringify(settle.calciumAmplitudeRamp.commonMultipliers) !==
      JSON.stringify([0.25, 0.5, 0.75, 1]) ||
    JSON.stringify(settle.discardSettleBeatNumbersInclusive) !==
      JSON.stringify([5, 29]) ||
    JSON.stringify(settle.assessmentBeatNumbersInclusive) !==
      JSON.stringify([30, 32]) ||
    settle.retainedAssessmentCycleBoundaryStateCount !== 3 ||
    settle.retainedRawCycleCount !== 2 ||
    settle.consecutiveFullStateReturnMapCount !== 2 ||
    !settle.evaluationRequiresCompletedRun ||
    settle.morphologyMetricsUsedAsSettlingGate
  ) {
    throw new Error("settle-and-assess schedule changed");
  }
  const screening = policy.screening;
  if (
    screening.candidateIndices !== "all-64" ||
    JSON.stringify(screening.scenarioIds) !== JSON.stringify(["hr60-reference"]) ||
    screening.beats !== 32 ||
    screening.dtSec !== 0.002
  ) {
    throw new Error("screening must remain all 64 HR60 points at 2 ms for 32 beats");
  }
  requireExactSubset(
    policy.armNumericalReadiness.candidateIndices,
    [0, 16, 32, 48],
    "readiness",
  );
  if (
    policy.armNumericalReadiness.beats !== 1 ||
    policy.armNumericalReadiness.dtSec !== 0.002 ||
    JSON.stringify(policy.armNumericalReadiness.scenarioIds) !==
      JSON.stringify(["hr60-reference"])
  ) {
    throw new Error("readiness plan changed");
  }
  requireExactSubset(
    policy.stressValidation.candidateIndices,
    Array.from({ length: 16 }, (_, index) => index * 4),
    "stress validation",
  );
  if (
    policy.stressValidation.beats !== 32 ||
    policy.stressValidation.dtSec !== 0.002 ||
    policy.stressValidation.scheduledInFirstSlice
  ) {
    throw new Error("stress-validation plan changed");
  }
  requireExactSubset(
    policy.dtRefinement.candidateIndices,
    [0, 16, 32, 48],
    "dt refinement",
  );
  if (
    policy.dtRefinement.beats !== 32 ||
    JSON.stringify(policy.dtRefinement.dtSec) !== JSON.stringify([0.002, 0.001]) ||
    policy.dtRefinement.scheduledInFirstSlice
  ) {
    throw new Error("dt-refinement plan changed");
  }
  const expectedScenarios = [
    ["hr50-reference", 50, 1, 1, 1],
    ["hr60-reference", 60, 1, 1, 1],
    ["hr75-reference", 75, 1, 1, 1],
    ["hr100-reference", 100, 1, 1, 1],
    ["hr60-blood-volume-low", 60, 0.85, 1, 1],
    ["hr60-blood-volume-high", 60, 1.15, 1, 1],
    ["hr60-afterload-low", 60, 1, 0.75, 1],
    ["hr60-afterload-high", 60, 1, 1.35, 1],
    ["hr60-pvr-low", 60, 1, 1, 0.65],
    ["hr60-pvr-high", 60, 1, 1, 1.5],
  ] as const;
  const actualScenarios = descriptor.protocolMatrix.map((scenario) => [
    scenario.scenarioId,
    scenario.heartRateBpm,
    scenario.bloodVolumeScale,
    scenario.systemicResistanceScale,
    scenario.pulmonaryResistanceScale,
  ]);
  const expectedScenarioIds = expectedScenarios.map(([scenarioId]) => scenarioId);
  if (
    JSON.stringify(actualScenarios) !== JSON.stringify(expectedScenarios) ||
    JSON.stringify(policy.stressValidation.scenarioIds) !==
      JSON.stringify(expectedScenarioIds)
  ) {
    throw new Error("predeclared stress scenario matrix changed");
  }
}

function validateEligibilityPolicy(
  descriptor: FivePatchPhysiologyEnvelopeProtocolDescriptorV2,
): void {
  const eligibility = descriptor.eligibilityPolicy;
  const numerical = eligibility.numerical;
  const periodicity = numerical.periodicity;
  if (
    !eligibility.predeclaredBeforeSimulationResults ||
    !numerical.requiresCompletedRun ||
    !numerical.requiresAllAcceptedOutputsFinite ||
    !numerical.requiresAllCompartmentVolumesPositive ||
    numerical.maximumAbsoluteBloodVolumeResidualMl !== 1e-6 ||
    JSON.stringify(periodicity.requiredPhases) !==
      JSON.stringify(["screening", "stress-validation", "dt-refinement"]) ||
    JSON.stringify(periodicity.notRequiredPhases) !==
      JSON.stringify(["arm-numerical-readiness"]) ||
    periodicity.consecutiveFullStateReturnMapCount !== 2 ||
    periodicity.maximumAbsoluteDimensionlessResidual !== 1e-4 ||
    JSON.stringify(numerical.excludedMetrics) !== JSON.stringify(["v-loop"])
  ) {
    throw new Error("predeclared numerical eligibility policy changed");
  }
  const broad = eligibility.broadOperatingPoint;
  if (
    broad.role !== "plausibility-screen-not-normal-human-calibration" ||
    broad.assessmentSource !== "raw-final-assessment-cycle" ||
    !sameRange(broad.leftAtrialPressureMmHg, -3, 30) ||
    !sameRange(broad.leftVentricularPeakPressureMmHg, 80, 200) ||
    !sameRange(broad.aorticPressureMmHg, 45, 180) ||
    !sameRange(broad.cardiacOutputLPerMin, 3, 8) ||
    !sameRange(broad.leftVentricularEjectionFraction, 0.4, 0.75) ||
    !sameRange(broad.pulmonaryVeinPressureMmHg, 0.1, 40) ||
    JSON.stringify(broad.valveReverseFlow.valveIds) !==
      JSON.stringify(["MV", "AoV", "TV", "PV"]) ||
    broad.valveReverseFlow.maximumReverseVolumeMl.absoluteFloorMl !== 1 ||
    broad.valveReverseFlow.maximumReverseVolumeMl.forwardVolumeFraction !== 0.05 ||
    broad.valveReverseFlow.maximumReverseVolumeMl.combination !==
      "maximum-of-absolute-floor-and-forward-fraction" ||
    broad.valveReverseFlow.reverseFlowDuty.status !== "report-only" ||
    broad.valveReverseFlow.reverseFlowDuty.eligibilityThreshold !== null ||
    JSON.stringify(broad.excludedMetrics) !== JSON.stringify(["v-loop"])
  ) {
    throw new Error("predeclared broad operating-point policy changed");
  }
}

function sameRange(
  range: NumericRangeV2,
  minimum: number,
  maximum: number,
): boolean {
  return range.minimum === minimum && range.maximum === maximum;
}

function validateGeneratedDesign(
  descriptor: FivePatchPhysiologyEnvelopeProtocolDescriptorV2,
  design: ReturnType<typeof generateDeterministicMaximinLhsV1>,
): void {
  if (
    design.selectedSeed !== descriptor.design.selectedSeed ||
    Math.abs(
      design.selectedMinimumPairwiseDistance -
        descriptor.design.selectedMinimumPairwiseDistance,
    ) > 1e-14
  ) {
    throw new Error("generated 64 x 12 LHS does not match the committed lock");
  }
}

function requireExactSubset(
  actual: readonly number[],
  expected: readonly number[],
  label: string,
): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} indices changed`);
  }
}

function deepFreeze(value: unknown): void {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) {
    return;
  }
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
}
