import protocolDescriptor from
  "@/data/mechanics2/protocols/five-patch-model-envelope-v1.json";
import {
  DETERMINISTIC_MAXIMIN_LHS_ALGORITHM_ID_V1,
  generateDeterministicMaximinLhsV1,
} from "@/engine/mechanics2/envelope/DeterministicMaximinLhsV1";

export const FIVE_PATCH_MODEL_ENVELOPE_DEFINITION_ID_V1 =
  "five-patch-model-envelope-definition-v1" as const;

export const FIVE_PATCH_ENVELOPE_WALL_IDS_V1 = Object.freeze([
  "leftAtrium",
  "rightAtrium",
  "leftFreeWall",
  "septum",
  "rightFreeWall",
] as const);

export type FivePatchEnvelopeWallIdV1 =
  typeof FIVE_PATCH_ENVELOPE_WALL_IDS_V1[number];
export type FivePatchEnvelopeOwnerGroupV1 = "atrial" | "ventricular";
export type FivePatchEnvelopeSlsTopologyV1 = "off" | "atrial-only" | "all-patch";
export type FivePatchEnvelopeArmIdV1 =
  | "land-equilibrium-passive-sls-off"
  | "land-equilibrium-passive-sls-atrial-only"
  | "land-equilibrium-passive-sls-all-patch";
export type FivePatchEnvelopeTransformV1 = "linear" | "log";

export type FivePatchEnvelopeDimensionIdV1 =
  | "atrialActiveScale"
  | "ventricularActiveScale"
  | "atrialPassiveTangentScale"
  | "atrialPassiveExponentScale"
  | "ventricularPassiveTangentScale"
  | "ventricularPassiveExponentScale"
  | "atrialSlsModulusOverEquilibriumTangent"
  | "atrialSlsRelaxationTimeSec"
  | "ventricularSlsModulusOverEquilibriumTangent"
  | "ventricularSlsRelaxationTimeSec"
  | "atrialCalciumAmplitudeScale"
  | "atrialCalciumDecayScale"
  | "atrialCalciumOnsetOffsetCycleFraction"
  | "ventricularCalciumAmplitudeScale"
  | "ventricularCalciumDecayScale"
  | "ventricularCalciumOnsetOffsetCycleFraction";

export type FivePatchEnvelopeParameterDimensionV1 = {
  readonly dimensionId: FivePatchEnvelopeDimensionIdV1;
  readonly ownerGroup: FivePatchEnvelopeOwnerGroupV1;
  readonly sharedByPatches: readonly FivePatchEnvelopeWallIdV1[];
  readonly transform: FivePatchEnvelopeTransformV1;
  readonly minimum: number;
  readonly maximum: number;
  readonly unit: string;
  readonly role: string;
};

export type FivePatchEnvelopeStructuralArmV1 = {
  readonly armId: FivePatchEnvelopeArmIdV1;
  readonly activeLaw: "Land2017-active-only";
  readonly passiveLaw: "equilibrium-passive";
  readonly slsTopology: FivePatchEnvelopeSlsTopologyV1;
  readonly slsEnabledPatches: readonly FivePatchEnvelopeWallIdV1[];
};

export type FivePatchEnvelopeScenarioV1 = {
  readonly scenarioId: string;
  readonly heartRateBpm: number;
  readonly bloodVolumeScale: number;
  readonly systemicResistanceScale: number;
  readonly pulmonaryResistanceScale: number;
};

type FivePatchEnvelopeProtocolDescriptorV1 = {
  readonly protocolId: string;
  readonly evidenceStatus: string;
  readonly design: {
    readonly algorithmId: string;
    readonly sampleCount: number;
    readonly dimensionCount: number;
    readonly candidateSeeds: readonly number[];
    readonly selectedSeed: number;
    readonly selectedMinimumPairwiseDistance: number;
    readonly selectionUsesSimulationOutcomes: boolean;
    readonly sameUnitPointsAcrossStructuralArms: boolean;
  };
  readonly structuralArms: readonly FivePatchEnvelopeStructuralArmV1[];
  readonly parameterDimensions: readonly FivePatchEnvelopeParameterDimensionV1[];
  readonly protocolMatrix: readonly FivePatchEnvelopeScenarioV1[];
  readonly executionPolicy: {
    readonly initialization: string;
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
    readonly fullStateReturnMapMaxAbsDimensionlessTolerance: number | null;
    readonly settleAndAssess: {
      readonly appliesToPhases: readonly [
        "screening",
        "stress-validation",
        "dt-refinement",
      ];
      readonly singleContinuousRun: boolean;
      readonly resultDependentExtensionAllowed: boolean;
      readonly calciumAmplitudeRamp: {
        readonly beatNumbers: readonly [1, 2, 3, 4];
        readonly commonMultipliers: readonly [0.25, 0.5, 0.75, 1];
      };
      readonly discardSettleBeatNumbersInclusive: readonly [5, 29];
      readonly assessmentBeatNumbersInclusive: readonly [30, 32];
      readonly retainedAssessmentCycleBoundaryStateCount: 3;
      readonly retainedRawCycleCount: 2;
      readonly consecutiveFullStateReturnMapCount: 2;
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
    readonly armNumericalReadiness: {
      readonly selection: string;
      readonly candidateIndices: readonly number[];
      readonly scenarioIds: readonly string[];
      readonly beats: number;
      readonly dtSec: number;
      readonly retainEveryEndpointOfFinalCycle: boolean;
      readonly requiredBeforeFullEnvelope: boolean;
      readonly failureInterpretation: string;
    };
    readonly stressValidation: {
      readonly selection: string;
      readonly candidateIndices: readonly number[];
      readonly scenarioIds: readonly string[];
      readonly beats: number;
      readonly dtSec: number;
      readonly retainEveryEndpointOfFinalCycle: boolean;
    };
    readonly dtRefinement: {
      readonly selection: string;
      readonly candidateIndices: readonly number[];
      readonly scenarioIds: readonly string[];
      readonly dtSec: readonly number[];
      readonly beats: number;
      readonly retainEveryEndpointOfFinalCycle: boolean;
    };
  };
  readonly claimBoundary: {
    readonly runtimeAdoption: boolean;
    readonly patientFit: boolean;
    readonly normalHumanCalibration: boolean;
    readonly physiologyAcceptance: boolean;
    readonly structuralWinnerDeclared: boolean;
    readonly designMayBeChangedAfterResults: boolean;
  };
};

const protocol = protocolDescriptor as unknown as
  FivePatchEnvelopeProtocolDescriptorV1;
validateProtocol(protocol);
deepFreeze(protocol);

export const FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_V1 = protocol;
export const FIVE_PATCH_MODEL_ENVELOPE_SAMPLE_COUNT_V1 =
  protocol.design.sampleCount;
export const FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1 =
  protocol.parameterDimensions;
export const FIVE_PATCH_MODEL_ENVELOPE_STRUCTURAL_ARMS_V1 =
  protocol.structuralArms;
export const FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_MATRIX_V1 =
  protocol.protocolMatrix;

export const FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1 =
  generateDeterministicMaximinLhsV1({
    sampleCount: protocol.design.sampleCount,
    dimensionCount: protocol.design.dimensionCount,
    candidateSeeds: protocol.design.candidateSeeds,
  });

validateGeneratedDesign(protocol, FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1);

export type FivePatchEnvelopeParameterVectorV1 = Readonly<
  Record<FivePatchEnvelopeDimensionIdV1, number>
>;

export type FivePatchEnvelopeArmDesignV1 = FivePatchEnvelopeStructuralArmV1 & {
  /** All arms intentionally share this exact object, not copied point sets. */
  readonly unitPoints: typeof FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1.points;
  readonly inactiveSlsDimensionIds: readonly FivePatchEnvelopeDimensionIdV1[];
};

export const FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1:
readonly FivePatchEnvelopeArmDesignV1[] = Object.freeze(
  FIVE_PATCH_MODEL_ENVELOPE_STRUCTURAL_ARMS_V1.map((arm) => Object.freeze({
    ...arm,
    unitPoints: FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1.points,
    inactiveSlsDimensionIds: inactiveSlsDimensionIds(arm.slsTopology),
  })),
);

export const FIVE_PATCH_MODEL_ENVELOPE_STRESS_VALIDATION_INDICES_V1 =
  protocol.executionPolicy.stressValidation.candidateIndices;
export const FIVE_PATCH_MODEL_ENVELOPE_DT_REFINEMENT_INDICES_V1 =
  protocol.executionPolicy.dtRefinement.candidateIndices;

export const FIVE_PATCH_MODEL_ENVELOPE_DEFINITION_V1 = Object.freeze({
  definitionId: FIVE_PATCH_MODEL_ENVELOPE_DEFINITION_ID_V1,
  evidenceStatus: protocol.evidenceStatus,
  protocol,
  unitDesign: FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1,
  armDesigns: FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1,
  selectionPolicy: Object.freeze({
    type: "pre-registered-space-filling-envelope-with-fixed-subsets" as const,
    usesSimulationOutcomeToChoosePoints: false as const,
    localOptimizationAvailable: false as const,
    automaticWinnerSelectionAvailable: false as const,
  }),
});

export function mapFivePatchEnvelopeUnitPointV1(
  unitPoint: readonly number[],
): FivePatchEnvelopeParameterVectorV1 {
  if (
    unitPoint.length !==
      FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1.length
  ) {
    throw new Error(
      `unit point has ${unitPoint.length} dimensions; expected ` +
        FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1.length,
    );
  }
  const entries = FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1.map(
    (dimension, index) => {
      const unit = unitPoint[index]!;
      if (!Number.isFinite(unit) || unit <= 0 || unit >= 1) {
        throw new Error("unit point coordinates must be finite and strictly inside (0, 1)");
      }
      return [dimension.dimensionId, transformUnit(unit, dimension)] as const;
    },
  );
  return Object.freeze(Object.fromEntries(entries)) as
    FivePatchEnvelopeParameterVectorV1;
}

export function fivePatchEnvelopeParametersAtIndexV1(
  candidateIndex: number,
): FivePatchEnvelopeParameterVectorV1 {
  if (
    !Number.isInteger(candidateIndex) ||
    candidateIndex < 0 ||
    candidateIndex >= FIVE_PATCH_MODEL_ENVELOPE_SAMPLE_COUNT_V1
  ) {
    throw new Error("candidateIndex is outside the pre-registered design");
  }
  return mapFivePatchEnvelopeUnitPointV1(
    FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1.points[candidateIndex]!,
  );
}

export function fivePatchEnvelopeCandidateIdV1(
  armId: FivePatchEnvelopeArmIdV1,
  candidateIndex: number,
): string {
  if (!FIVE_PATCH_MODEL_ENVELOPE_STRUCTURAL_ARMS_V1.some(
    (arm) => arm.armId === armId,
  )) {
    throw new Error("unknown structural arm");
  }
  if (
    !Number.isInteger(candidateIndex) ||
    candidateIndex < 0 ||
    candidateIndex >= FIVE_PATCH_MODEL_ENVELOPE_SAMPLE_COUNT_V1
  ) {
    throw new Error("candidateIndex is outside the pre-registered design");
  }
  return `${armId}::lhs-${String(candidateIndex).padStart(2, "0")}`;
}

function inactiveSlsDimensionIds(
  topology: FivePatchEnvelopeSlsTopologyV1,
): readonly FivePatchEnvelopeDimensionIdV1[] {
  const atrial: readonly FivePatchEnvelopeDimensionIdV1[] = [
    "atrialSlsModulusOverEquilibriumTangent",
    "atrialSlsRelaxationTimeSec",
  ];
  const ventricular: readonly FivePatchEnvelopeDimensionIdV1[] = [
    "ventricularSlsModulusOverEquilibriumTangent",
    "ventricularSlsRelaxationTimeSec",
  ];
  return topology === "off"
    ? Object.freeze([...atrial, ...ventricular])
    : topology === "atrial-only"
      ? Object.freeze([...ventricular])
      : Object.freeze([]);
}

function transformUnit(
  unit: number,
  dimension: FivePatchEnvelopeParameterDimensionV1,
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

function validateProtocol(
  descriptor: FivePatchEnvelopeProtocolDescriptorV1,
): void {
  if (descriptor.protocolId !== "five-patch-model-envelope-v1") {
    throw new Error("unexpected five-patch envelope protocol id");
  }
  if (
    descriptor.design.algorithmId !==
      DETERMINISTIC_MAXIMIN_LHS_ALGORITHM_ID_V1 ||
    descriptor.design.sampleCount !== 64 ||
    descriptor.design.dimensionCount !== 16 ||
    descriptor.parameterDimensions.length !== 16
  ) {
    throw new Error("five-patch envelope design must be the pinned 64 x 16 LHS");
  }
  requireUnique(
    descriptor.parameterDimensions.map((dimension) => dimension.dimensionId),
    "parameter dimension ids",
  );
  requireUnique(
    descriptor.structuralArms.map((arm) => arm.armId),
    "structural arm ids",
  );
  requireUnique(
    descriptor.protocolMatrix.map((scenario) => scenario.scenarioId),
    "scenario ids",
  );
  for (const dimension of descriptor.parameterDimensions) {
    if (
      !Number.isFinite(dimension.minimum) ||
      !Number.isFinite(dimension.maximum) ||
      dimension.minimum >= dimension.maximum ||
      (dimension.transform === "log" && dimension.minimum <= 0)
    ) {
      throw new Error(`invalid prior bounds: ${dimension.dimensionId}`);
    }
    const expectedPatches = dimension.ownerGroup === "atrial"
      ? ["leftAtrium", "rightAtrium"]
      : ["leftFreeWall", "septum", "rightFreeWall"];
    if (JSON.stringify(dimension.sharedByPatches) !== JSON.stringify(expectedPatches)) {
      throw new Error(
        `${dimension.dimensionId} must use one shared ${dimension.ownerGroup} prior`,
      );
    }
  }
  const policy = descriptor.executionPolicy;
  if (
    policy.initialization !== "independent-cold-start-each-arm-point-scenario" ||
    policy.crossCandidateWarmStartAllowed ||
    policy.simulationOutcomeAdaptiveSamplingAllowed ||
    policy.gradientOrLocalOptimizerAllowed ||
    policy.scalarWinnerScoreAllowed ||
    policy.automaticWinnerSelectionAllowed ||
    policy.parameterRangeChangeAfterOutcomeInspectionAllowed ||
    descriptor.design.selectionUsesSimulationOutcomes ||
    !descriptor.design.sameUnitPointsAcrossStructuralArms
  ) {
    throw new Error("protocol violates the non-local-search policy");
  }
  if (
    policy.bloodVolumeAllocation.meaning !==
      "exact-total-blood-volume-scale-with-fixed-compliant-venous-allocation" ||
    JSON.stringify(policy.bloodVolumeAllocation.mutableCompartments) !==
      JSON.stringify(["systemicVeinMl", "pulmonaryVeinMl"]) ||
    policy.bloodVolumeAllocation.systemicVeinWeight !== 60 ||
    policy.bloodVolumeAllocation.pulmonaryVeinWeight !== 13 ||
    JSON.stringify(policy.bloodVolumeAllocation.preservedCompartments) !==
      JSON.stringify([
        "leftAtriumMl",
        "leftVentricleMl",
        "systemicArteryMl",
        "rightAtriumMl",
        "rightVentricleMl",
        "pulmonaryArteryMl",
      ])
  ) {
    throw new Error("blood-volume challenges must use the predeclared 60:13 venous allocation");
  }
  if (
    policy.fullStateReturnMapMaxAbsDimensionlessTolerance !== 1e-4
  ) {
    throw new Error("the settle-and-assess return-map tolerance must be fixed at 1e-4");
  }
  const settleAndAssess = policy.settleAndAssess;
  if (
    JSON.stringify(settleAndAssess.appliesToPhases) !==
      JSON.stringify(["screening", "stress-validation", "dt-refinement"]) ||
    !settleAndAssess.singleContinuousRun ||
    settleAndAssess.resultDependentExtensionAllowed ||
    JSON.stringify(settleAndAssess.calciumAmplitudeRamp.beatNumbers) !==
      JSON.stringify([1, 2, 3, 4]) ||
    JSON.stringify(settleAndAssess.calciumAmplitudeRamp.commonMultipliers) !==
      JSON.stringify([0.25, 0.5, 0.75, 1]) ||
    JSON.stringify(settleAndAssess.discardSettleBeatNumbersInclusive) !==
      JSON.stringify([5, 29]) ||
    JSON.stringify(settleAndAssess.assessmentBeatNumbersInclusive) !==
      JSON.stringify([30, 32]) ||
    settleAndAssess.retainedAssessmentCycleBoundaryStateCount !== 3 ||
    settleAndAssess.retainedRawCycleCount !== 2 ||
    settleAndAssess.consecutiveFullStateReturnMapCount !== 2 ||
    !settleAndAssess.evaluationRequiresCompletedRun ||
    settleAndAssess.morphologyMetricsUsedAsSettlingGate
  ) {
    throw new Error("settle-and-assess schedule must match the fixed audited protocol");
  }
  if (
    policy.screening.beats !== 32 ||
    policy.stressValidation.beats !== 32 ||
    policy.dtRefinement.beats !== 32
  ) {
    throw new Error("settle-and-assess phases must each run exactly 32 beats");
  }
  if (
    !policy.screening.retainEveryEndpointOfFinalCycle ||
    !policy.armNumericalReadiness.retainEveryEndpointOfFinalCycle ||
    !policy.stressValidation.retainEveryEndpointOfFinalCycle ||
    !policy.dtRefinement.retainEveryEndpointOfFinalCycle
  ) {
    throw new Error("every protocol phase must retain the final-cycle endpoint grid");
  }
  requireFixedSubset(
    policy.armNumericalReadiness.candidateIndices,
    descriptor.design.sampleCount,
    "arm numerical readiness",
  );
  requireFixedSubset(
    policy.stressValidation.candidateIndices,
    descriptor.design.sampleCount,
    "stress validation",
  );
  requireFixedSubset(
    policy.dtRefinement.candidateIndices,
    descriptor.design.sampleCount,
    "dt refinement",
  );
  const scenarioIds = new Set(
    descriptor.protocolMatrix.map((scenario) => scenario.scenarioId),
  );
  for (const scenarioId of [
    ...policy.screening.scenarioIds,
    ...policy.armNumericalReadiness.scenarioIds,
    ...policy.stressValidation.scenarioIds,
    ...policy.dtRefinement.scenarioIds,
  ]) {
    if (!scenarioIds.has(scenarioId)) {
      throw new Error(`execution policy references unknown scenario: ${scenarioId}`);
    }
  }
}

function validateGeneratedDesign(
  descriptor: FivePatchEnvelopeProtocolDescriptorV1,
  design: ReturnType<typeof generateDeterministicMaximinLhsV1>,
): void {
  if (
    design.selectedSeed !== descriptor.design.selectedSeed ||
    Math.abs(
      design.selectedMinimumPairwiseDistance -
        descriptor.design.selectedMinimumPairwiseDistance,
    ) > 1e-14
  ) {
    throw new Error("generated LHS does not match the committed design lock");
  }
}

function requireUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique`);
  }
}

function requireFixedSubset(
  indices: readonly number[],
  sampleCount: number,
  label: string,
): void {
  if (
    indices.length === 0 ||
    new Set(indices).size !== indices.length ||
    indices.some((index) =>
      !Number.isInteger(index) || index < 0 || index >= sampleCount
    )
  ) {
    throw new Error(`${label} indices must be a nonempty fixed subset`);
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
