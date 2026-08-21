export const MAIN_WIRE_INTEGRATED_MODEL_PVA_REFERENCE_V1_ID =
  "main-wire-integrated-model-canonical-normal-adult-pva-reference-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PVA_METHOD_V1_ID =
  "suga-compatible-pva-estimate-phase-wise-venous-occlusion-fixed-passive-slice-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_PROVENANCE_V1 =
  Object.freeze({
    sourceResearchTag: "research-pva-mvo2-558-573-final" as const,
    sourceCommitSha: "7fa68a21607107db0e766c3449788d9d90d59e60" as const,
    sourceStudyId:
      "main-wire-integrated-model-phase-wise-pva-qualification-v2" as const,
    referenceRevision: "normal-adult-pva-reference-v1" as const,
    pressureBasis: "ventricular-transmural" as const,
    externalWorkSource:
      "accepted-periodic-pv-path-work-research-reference" as const,
    methodId: MAIN_WIRE_INTEGRATED_MODEL_PVA_METHOD_V1_ID,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_PVA_OUTPUT_IDS_V1 = Object.freeze([
  "protocol-analysis.pva-estimate.phase-wise-venous-occlusion-v1.LV",
  "protocol-analysis.pva-estimate.phase-wise-venous-occlusion-v1.RV",
] as const);

const MMHG_ML_TO_JOULE_V1 = 1.33322e-4;

export type MainWireIntegratedModelPvaVentricleV1 = "LV" | "RV";

export type MainWireIntegratedModelPvaLimitationV1 =
  | "systolic-relation-extrapolation"
  | "protocol-direction-sensitivity"
  | "phase-resolution-sensitivity"
  | "fixed-contralateral-passive-reference";

export type MainWireIntegratedModelPvaReferenceInputV1 = Readonly<{
  ventricleId: MainWireIntegratedModelPvaVentricleV1;
  externalWorkJ: number;
  systolicEndpoint: Readonly<{
    volumeMl: number;
    fittedPressureMmHg: number;
  }>;
  systolicRelation: Readonly<{
    phaseSampleCount: 64;
    phaseIndex: number;
    phase01: number;
    elastanceMmHgPerMl: number;
    volumeAxisInterceptMl: number;
    measuredVolumeRangeMl: readonly [number, number];
    rSquared: number;
    rootMeanSquaredResidualMmHg: number;
  }>;
  passiveReference: Readonly<{
    referenceId: "fixed-contralateral-intrinsic-passive-center-slice-v1";
    fixedContralateralVentricleId: MainWireIntegratedModelPvaVentricleV1;
    fixedContralateralVolumeMl: number;
    supportedVolumeRangeMl: readonly [number, number];
    zeroPressureVolumeMl: number;
    positivePressureAreaBelowSystolicEndpointJ: number;
  }>;
  sensitivity: Readonly<{
    systolicAreaOutsideMeasuredRangeFraction: number;
    releaseSlopeDifferenceFraction: number;
    phaseResolutionRelativeDifference: number;
    externalWorkCoarseFineDifferenceJ: number;
  }>;
  limitations: readonly MainWireIntegratedModelPvaLimitationV1[];
}>;

export type MainWireIntegratedModelPvaOutputV1 =
  | Readonly<{
      outputId: (typeof MAIN_WIRE_INTEGRATED_MODEL_PVA_OUTPUT_IDS_V1)[number];
      methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_PVA_METHOD_V1_ID;
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      status: "limited";
      unit: "J";
      externalWorkJ: number;
      potentialEnergyEquivalentJ: number;
      pvaEstimateJ: number;
      externalWorkFraction: number;
      systolicEndpoint: MainWireIntegratedModelPvaReferenceInputV1["systolicEndpoint"];
      systolicRelation: MainWireIntegratedModelPvaReferenceInputV1["systolicRelation"];
      passiveReference: MainWireIntegratedModelPvaReferenceInputV1["passiveReference"];
      sensitivity: MainWireIntegratedModelPvaReferenceInputV1["sensitivity"];
      limitations: readonly MainWireIntegratedModelPvaLimitationV1[];
    }>
  | Readonly<{
      outputId: (typeof MAIN_WIRE_INTEGRATED_MODEL_PVA_OUTPUT_IDS_V1)[number];
      methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_PVA_METHOD_V1_ID;
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      status: "unavailable";
      unit: "J";
      reason: string;
    }>;

export type MainWireIntegratedModelPvaReferenceV1 = Readonly<{
  referenceId: typeof MAIN_WIRE_INTEGRATED_MODEL_PVA_REFERENCE_V1_ID;
  methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_PVA_METHOD_V1_ID;
  status: "limited" | "unavailable";
  scope: "canonical-normal-adult-reference";
  targetSurface: "precomputed-completed-protocol-reference";
  pressureBasis: "ventricular-transmural";
  provenance: typeof MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_PROVENANCE_V1;
  outputs: readonly MainWireIntegratedModelPvaOutputV1[];
  interpretation: Readonly<{
    methodSpecificEstimateAvailable: boolean;
    scenarioSpecificEstimate: false;
    genericPvaEstablished: false;
    clinicalPvaEstablished: false;
    liveSingleBeatOutput: false;
    myocardialOxygenConsumptionEstablished: false;
  }>;
}>;

/**
 * Compact production projection of the final normal-adult research result.
 * The full experimental lineage remains on the research branch; production
 * retains only the method inputs needed to reproduce the displayed estimate.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_INPUTS_V1 =
  Object.freeze([
    Object.freeze({
      ventricleId: "LV" as const,
      externalWorkJ: 1.2864541324474803,
      systolicEndpoint: Object.freeze({
        volumeMl: 64.78495422919205,
        fittedPressureMmHg: 89.25036469032824,
      }),
      systolicRelation: Object.freeze({
        phaseSampleCount: 64 as const,
        phaseIndex: 8,
        phase01: 0.125,
        elastanceMmHgPerMl: 1.7997034535053218,
        volumeAxisInterceptMl: 15.193248153119717,
        measuredVolumeRangeMl: Object.freeze([
          48.5300477639526, 64.82378564087709,
        ] as const),
        rSquared: 0.999644563151442,
        rootMeanSquaredResidualMmHg: 0.18507017898395536,
      }),
      passiveReference: Object.freeze({
        referenceId:
          "fixed-contralateral-intrinsic-passive-center-slice-v1" as const,
        fixedContralateralVentricleId: "RV" as const,
        fixedContralateralVolumeMl: 150.21875,
        supportedVolumeRangeMl: Object.freeze([
          53.199999999999996, 144.4,
        ] as const),
        zeroPressureVolumeMl: 69.16366862150763,
        positivePressureAreaBelowSystolicEndpointJ: 0,
      }),
      sensitivity: Object.freeze({
        systolicAreaOutsideMeasuredRangeFraction: 0.4518868571139322,
        releaseSlopeDifferenceFraction: 0.3165487054843358,
        phaseResolutionRelativeDifference: 0,
        externalWorkCoarseFineDifferenceJ: 0.004339933917046013,
      }),
      limitations: Object.freeze([
        "systolic-relation-extrapolation",
        "protocol-direction-sensitivity",
        "fixed-contralateral-passive-reference",
      ] as const),
    }),
    Object.freeze({
      ventricleId: "RV" as const,
      externalWorkJ: 0.42431207785891467,
      systolicEndpoint: Object.freeze({
        volumeMl: 86.14275881988328,
        fittedPressureMmHg: 33.83844704726138,
      }),
      systolicRelation: Object.freeze({
        phaseSampleCount: 64 as const,
        phaseIndex: 7,
        phase01: 0.109375,
        elastanceMmHgPerMl: 0.4651694927806835,
        volumeAxisInterceptMl: 13.39842031010182,
        measuredVolumeRangeMl: Object.freeze([
          39.10619348547927, 86.14275881988328,
        ] as const),
        rSquared: 0.9827499096307943,
        rootMeanSquaredResidualMmHg: 1.0253401365720534,
      }),
      passiveReference: Object.freeze({
        referenceId:
          "fixed-contralateral-intrinsic-passive-center-slice-v1" as const,
        fixedContralateralVentricleId: "LV" as const,
        fixedContralateralVolumeMl: 138.70000000000002,
        supportedVolumeRangeMl: Object.freeze([
          66.5, 155.79999999999998,
        ] as const),
        zeroPressureVolumeMl: 103.1326929494056,
        positivePressureAreaBelowSystolicEndpointJ: 0,
      }),
      sensitivity: Object.freeze({
        systolicAreaOutsideMeasuredRangeFraction: 0.12489082104389465,
        releaseSlopeDifferenceFraction: -0.013987115331836634,
        phaseResolutionRelativeDifference: 0.04147103571838847,
        externalWorkCoarseFineDifferenceJ: 0.0022527979052508473,
      }),
      limitations: Object.freeze([
        "systolic-relation-extrapolation",
        "phase-resolution-sensitivity",
        "fixed-contralateral-passive-reference",
      ] as const),
    }),
  ] satisfies readonly MainWireIntegratedModelPvaReferenceInputV1[]);

let cachedNormalAdultReferenceV1: MainWireIntegratedModelPvaReferenceV1 | null =
  null;

export function evaluateMainWireIntegratedModelPvaOutputV1(
  input: MainWireIntegratedModelPvaReferenceInputV1,
): MainWireIntegratedModelPvaOutputV1 {
  const outputId =
    `protocol-analysis.pva-estimate.phase-wise-venous-occlusion-v1.${input.ventricleId}` as const;
  const unavailable = (reason: string): MainWireIntegratedModelPvaOutputV1 =>
    Object.freeze({
      outputId,
      methodId: MAIN_WIRE_INTEGRATED_MODEL_PVA_METHOD_V1_ID,
      ventricleId: input.ventricleId,
      status: "unavailable" as const,
      unit: "J" as const,
      reason,
    });

  if (!allNumericLeavesFiniteV1(input)) {
    return unavailable("PVA reference contains a non-finite value");
  }
  const relation = input.systolicRelation;
  const endpoint = input.systolicEndpoint;
  if (
    relation.phaseIndex < 0 ||
    relation.phaseIndex >= relation.phaseSampleCount ||
    relation.phase01 !== relation.phaseIndex / relation.phaseSampleCount ||
    !(relation.elastanceMmHgPerMl > 0) ||
    !(endpoint.volumeMl > relation.volumeAxisInterceptMl) ||
    !(input.externalWorkJ >= 0) ||
    !orderedRangeV1(relation.measuredVolumeRangeMl) ||
    !orderedRangeV1(input.passiveReference.supportedVolumeRangeMl) ||
    !(input.passiveReference.positivePressureAreaBelowSystolicEndpointJ >= 0)
  ) {
    return unavailable("PVA reference does not define an admissible relation");
  }

  const systolicTriangleJ =
    0.5 *
    relation.elastanceMmHgPerMl *
    (endpoint.volumeMl - relation.volumeAxisInterceptMl) ** 2 *
    MMHG_ML_TO_JOULE_V1;
  const potentialEnergyEquivalentJ =
    systolicTriangleJ -
    input.passiveReference.positivePressureAreaBelowSystolicEndpointJ;
  const pvaEstimateJ = input.externalWorkJ + potentialEnergyEquivalentJ;
  if (
    !Number.isFinite(systolicTriangleJ) ||
    !Number.isFinite(potentialEnergyEquivalentJ) ||
    !Number.isFinite(pvaEstimateJ) ||
    !(potentialEnergyEquivalentJ >= 0) ||
    !(pvaEstimateJ > 0)
  ) {
    return unavailable("PVA energy decomposition is not positive and finite");
  }

  return Object.freeze({
    outputId,
    methodId: MAIN_WIRE_INTEGRATED_MODEL_PVA_METHOD_V1_ID,
    ventricleId: input.ventricleId,
    status: "limited" as const,
    unit: "J" as const,
    externalWorkJ: input.externalWorkJ,
    potentialEnergyEquivalentJ,
    pvaEstimateJ,
    externalWorkFraction: input.externalWorkJ / pvaEstimateJ,
    systolicEndpoint: input.systolicEndpoint,
    systolicRelation: input.systolicRelation,
    passiveReference: input.passiveReference,
    sensitivity: input.sensitivity,
    limitations: input.limitations,
  });
}

export function buildMainWireIntegratedModelNormalAdultPvaReferenceV1(): MainWireIntegratedModelPvaReferenceV1 {
  const outputs = Object.freeze(
    MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_INPUTS_V1.map(
      evaluateMainWireIntegratedModelPvaOutputV1,
    ),
  );
  const available = outputs.every(({ status }) => status === "limited");
  return Object.freeze({
    referenceId: MAIN_WIRE_INTEGRATED_MODEL_PVA_REFERENCE_V1_ID,
    methodId: MAIN_WIRE_INTEGRATED_MODEL_PVA_METHOD_V1_ID,
    status: available ? ("limited" as const) : ("unavailable" as const),
    scope: "canonical-normal-adult-reference" as const,
    targetSurface: "precomputed-completed-protocol-reference" as const,
    pressureBasis: "ventricular-transmural" as const,
    provenance:
      MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_PROVENANCE_V1,
    outputs,
    interpretation: Object.freeze({
      methodSpecificEstimateAvailable: available,
      scenarioSpecificEstimate: false as const,
      genericPvaEstablished: false as const,
      clinicalPvaEstablished: false as const,
      liveSingleBeatOutput: false as const,
      myocardialOxygenConsumptionEstablished: false as const,
    }),
  });
}

/** Loads the compact precomputed reference; it does not run a model protocol. */
export function loadMainWireIntegratedModelNormalAdultPvaReferenceV1(): MainWireIntegratedModelPvaReferenceV1 {
  if (cachedNormalAdultReferenceV1 === null) {
    cachedNormalAdultReferenceV1 =
      buildMainWireIntegratedModelNormalAdultPvaReferenceV1();
  }
  return cachedNormalAdultReferenceV1;
}

function orderedRangeV1(range: readonly [number, number]): boolean {
  return (
    Number.isFinite(range[0]) &&
    Number.isFinite(range[1]) &&
    range[1] > range[0]
  );
}

function allNumericLeavesFiniteV1(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allNumericLeavesFiniteV1);
  if (value !== null && typeof value === "object") {
    return Object.values(value).every(allNumericLeavesFiniteV1);
  }
  return true;
}
