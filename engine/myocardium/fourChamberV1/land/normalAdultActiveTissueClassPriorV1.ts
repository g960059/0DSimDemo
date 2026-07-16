import {
  validateExactEventCalciumParametersV1,
  type ExactEventCalciumParametersV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  buildIsolatedLandTargetPackV1,
  initializeLand2017IsometricSteadyStateV1,
} from "@/engine/myocardium/fourChamberV1/land/isolatedLandTargetPackV1";
import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildAtrialHumanPriorLandEquationParametersV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  evaluateLand2017ContinuousOutput,
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2,
  stableHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017";

export const NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_ID =
  "normal-adult-active-tissue-class-prior-v1" as const;
export const NORMAL_ADULT_ATRIAL_ACTIVE_LAND_PARAMETER_SET_V1_ID =
  "normal-adult-atrial-shared-land-lewalle-force-scale-v1" as const;
export const NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_CLAIM_BOUNDARY =
  "component-metric-reconstruction-and-skinned-la-force-scale-not-pv-fit-not-intact-twitch-validation" as const;

export const NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_PINNED_HASHES = Object.freeze({
  audit: "7c9d619818a88792c7e475588ba23d625e954bdfb9c9e0a05d60ff11c1cb99a8",
  atrialParameterSetStableHash: "6771c89b",
  atrialTargetPack: "d7882821f6b872bd78c6d648742bd28fcdf8a8599c80d5b37ec00996f7208be3",
  ventricularTargetPack: "382e4f0c38828af15dd1afd7ccb3bd768a3ec5bcce8c0f393b5a5cd1bcc05b8b",
} as const);

export const NORMAL_ADULT_ATRIAL_SATURATION_MAPPING_V1 = deepFreeze({
  sourceTitle:
    "Human atrial skinned muscle fibers exhibit reduced length-dependent activation but show faster force development kinetics than ventricular muscle",
  sourceDoi: "10.1016/j.yjmcc.2025.12.001" as const,
  preparation: "chemically-permeabilized-human-left-atrial-muscle-fiber" as const,
  temperatureC: 37 as const,
  mixedEffectsSarcomereLengthUM: 2.05 as const,
  measuredMaximumActiveStressPa: 11_600 as const,
  measuredReportedUncertaintyPa: 900 as const,
  sourcePca: 4.5 as const,
  landLambda: 1 as const,
  freeCalciumUM: Math.pow(10, 6 - 4.5),
  mappingRule:
    "divide measured pCa4.5 active stress by the replayed six-state Land steady-state stress/Tref factor at lambda=1" as const,
});

/**
 * These are low-order two-exponential candidate reconstructions of published
 * component timing metrics. They are not digitized calcium traces and they do
 * not represent conserved calcium cycling. The 12 ms electrical-to-calcium
 * delay is retained from the existing exact-event scheduling convention; it is
 * not identified by the isolated twitch timing reconstruction.
 */
export const NORMAL_ADULT_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1:
Readonly<ExactEventCalciumParametersV1> = deepFreeze({
  tauRiseSec: 0.0125,
  tauDecaySec: 0.3,
  calciumDiastolicUM: 0.1,
  calciumAmplitudeUM: 0.5,
  electricalToCalciumDelaySec: 0.012,
  status: "candidate-prior",
  evidenceId:
    "land-niederer-2018-output-timing-low-order-component-metric-reconstruction-not-digitized-waveform-v1",
});

export const NORMAL_ADULT_VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1:
Readonly<ExactEventCalciumParametersV1> = deepFreeze({
  tauRiseSec: 0.07,
  tauDecaySec: 0.11,
  calciumDiastolicUM: 0.11,
  calciumAmplitudeUM: 0.89,
  electricalToCalciumDelaySec: 0.012,
  status: "candidate-prior",
  evidenceId:
    "land-coppini-2017-output-timing-low-order-component-metric-reconstruction-not-digitized-waveform-v1",
});

export const NORMAL_ADULT_ACTIVE_TISSUE_CLASS_BY_WALL_V1 = deepFreeze({
  LA: "atrial-shared",
  RA: "atrial-shared",
  LVFW: "ventricular-shared",
  SEP: "ventricular-shared",
  RVFW: "ventricular-shared",
} as const);

export type NormalAdultActiveTissueClassPriorAuditV1 = {
  readonly schemaId: typeof NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_ID;
  readonly status: "candidate-prior";
  readonly claimBoundary: typeof NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_CLAIM_BOUNDARY;
  readonly tissueClassByWall: typeof NORMAL_ADULT_ACTIVE_TISSUE_CLASS_BY_WALL_V1;
  readonly atrialClass: {
    readonly sharedBy: readonly ["LA", "RA"];
    readonly rightAtriumEvidenceBoundary:
      "la-derived-class-prior-extrapolated-to-ra-without-independent-ra-force-scale";
    readonly parameterSetId: typeof NORMAL_ADULT_ATRIAL_ACTIVE_LAND_PARAMETER_SET_V1_ID;
    readonly parameterSetStableHash: string;
    readonly changedPrimitiveParameters: readonly ["Tref"];
    readonly allOtherPrimitiveValuesBitExact: boolean;
    readonly derivedKineticsBitExact: boolean;
    readonly saturationMapping: {
      readonly targetActiveStressPa: 11600;
      readonly pca: 4.5;
      readonly freeCalciumUM: number;
      readonly lambdaLand: 1;
      readonly steadyState: readonly number[];
      readonly steadyStateRhsResidualBoundPerSec: 1e-9;
      readonly replayedLegacyStressPa: number;
      readonly legacyTrefPa: number;
      readonly replayedSaturationFactor: number;
      readonly mappedTrefPa: number;
      readonly replayedCandidateStressPa: number;
      readonly absoluteReplayErrorPa: number;
    };
  };
  readonly calciumTiming: {
    readonly reconstructionClass:
      "low-order-component-metric-reconstruction-not-measured-waveform";
    readonly digitizedCalciumTraceUsed: false;
    readonly atrial: {
      readonly parameters: typeof NORMAL_ADULT_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1;
      readonly sourceContext: {
        readonly sourceDoi: "10.1002/cnm.2931";
        readonly timeToPeakMs: 82;
        readonly relaxationTime50Ms: 75;
        readonly interpretation: "adjusted-model-output-context-not-independent-measurement";
      };
      readonly replay: IsolatedTwitchMetricAuditV1;
    };
    readonly ventricular: {
      readonly parameters: typeof NORMAL_ADULT_VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1;
      readonly sourceContext: {
        readonly sourceDoi: "10.1016/j.yjmcc.2017.03.008";
        readonly timeToPeakMs: 171;
        readonly relaxationTime50Ms: 122;
        readonly relaxationTime90Ms: 281;
        readonly interpretation: "land-model-coppini-twitch-context";
      };
      readonly replay: IsolatedTwitchMetricAuditV1 & {
        readonly rt90ContextReproduced: false;
        readonly rt90FailureReason:
          "replayed-rt90-is-about-224ms-and-does-not-reproduce-281ms-context";
      };
    };
  };
  readonly componentAudit: {
    readonly generatorId: "buildIsolatedLandTargetPackV1";
    readonly atrialTargetPackSha256: string;
    readonly ventricularTargetPackSha256: string;
    readonly isolatedProtocolDtSec: 0.001;
    readonly isolatedProtocolDurationSec: 1.2;
  };
  readonly exclusionBoundary: {
    readonly pvLoopOrPvMorphologyFitUsed: false;
    readonly moyerPassiveMaterialUsed: false;
    readonly passiveMaterialCalibrationUsed: false;
    readonly chamberSpecificActiveGainUsed: false;
    readonly lewalleMicroscopicParameterVectorTransplanted: false;
    readonly closedLoopPhysiologyValidated: false;
  };
  readonly provenance: {
    readonly activeEquationSourceDoi: "10.1016/j.yjmcc.2017.03.008";
    readonly atrialKineticsSourceDoi: "10.1002/cnm.2931";
    readonly atrialForceScaleSourceDoi: "10.1016/j.yjmcc.2025.12.001";
    readonly transformationRules: readonly string[];
  };
  readonly hashAlgorithm: "sha256-canonical-json-v1";
  readonly contentSha256: string;
};

type IsolatedTwitchMetricAuditV1 = {
  readonly timeToPeakMs: number;
  readonly relaxationTime50Ms: number;
  readonly relaxationTime90Ms: number;
  readonly peakAmplitudePa: number;
  readonly targetPackStatus: "source-regression-oracle-only";
};

/**
 * Builds one immutable atrial active material class shared by LA and RA. Only
 * Tref changes from the existing atrial six-state Land candidate. The change
 * maps the Lewalle et al. central pCa4.5 LA force scale through the actual Land
 * steady-state saturation factor; no chamber PV observable participates.
 */
export function buildNormalAdultAtrialActiveLandParameterSetV1(): Land2017SourceParameterSet {
  const legacy = buildAtrialHumanPriorLandEquationParametersV1();
  const replay = replayAtrialSaturationMapping(legacy);
  const values: Land2017RuntimeParameters = {
    ...legacy.values,
    Tref: NORMAL_ADULT_ATRIAL_SATURATION_MAPPING_V1.measuredMaximumActiveStressPa
      / replay.saturationFactor,
  };
  const sourceParameters = legacy.sourceParameters.map((entry) => entry.parameter === "Tref"
    ? {
        ...entry,
        location:
          `${entry.location}; runtime Tref reconstructed from Lewalle et al. 2026 `
          + `DOI ${NORMAL_ADULT_ATRIAL_SATURATION_MAPPING_V1.sourceDoi} central LA pCa4.5 `
          + "active stress via the replayed six-state saturation factor at lambda=1",
        runtime: {
          ...entry.runtime,
          value: values.Tref,
        },
      }
    : entry);
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: NORMAL_ADULT_ATRIAL_ACTIVE_LAND_PARAMETER_SET_V1_ID,
    sourceId: legacy.sourceId,
    doi: legacy.doi,
    values,
    derived: legacy.derived,
    sourceParameters,
    derivedParameters: legacy.derivedParameters,
  };
  return deepFreeze({
    ...hashInput,
    parameterSetStableHash: stableHash(hashInput),
  });
}

export function buildNormalAdultActiveTissueClassPriorAuditV1(
  sha256Hex: CanonicalSha256HexProvider,
): NormalAdultActiveTissueClassPriorAuditV1 {
  validateExactEventCalciumParametersV1(
    NORMAL_ADULT_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  );
  validateExactEventCalciumParametersV1(
    NORMAL_ADULT_VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  );
  const legacy = buildAtrialHumanPriorLandEquationParametersV1();
  const atrial = buildNormalAdultAtrialActiveLandParameterSetV1();
  const saturation = replayAtrialSaturationMapping(atrial);
  const atrialPack = buildIsolatedLandTargetPackV1(
    "atrial-human-prior-v1",
    atrial,
    NORMAL_ADULT_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
    sha256Hex,
  );
  const ventricularPack = buildIsolatedLandTargetPackV1(
    "ventricular-human-37c-v1",
    LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2,
    NORMAL_ADULT_VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
    sha256Hex,
  );
  const primitiveNames = Object.keys(legacy.values) as Array<keyof Land2017RuntimeParameters>;
  const allOtherPrimitiveValuesBitExact = primitiveNames
    .filter((name) => name !== "Tref")
    .every((name) => Object.is(legacy.values[name], atrial.values[name]));
  const derivedKineticsBitExact = typedEntries(legacy.derived)
    .every(([name, value]) => Object.is(value, atrial.derived[name]));
  const ventricularReplay = twitchMetrics(ventricularPack.isolatedTwitchTarget);
  const payload: Omit<NormalAdultActiveTissueClassPriorAuditV1, "contentSha256"> = {
    schemaId: NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_ID,
    status: "candidate-prior",
    claimBoundary: NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_CLAIM_BOUNDARY,
    tissueClassByWall: NORMAL_ADULT_ACTIVE_TISSUE_CLASS_BY_WALL_V1,
    atrialClass: {
      sharedBy: ["LA", "RA"],
      rightAtriumEvidenceBoundary:
        "la-derived-class-prior-extrapolated-to-ra-without-independent-ra-force-scale",
      parameterSetId: NORMAL_ADULT_ATRIAL_ACTIVE_LAND_PARAMETER_SET_V1_ID,
      parameterSetStableHash: atrial.parameterSetStableHash,
      changedPrimitiveParameters: ["Tref"],
      allOtherPrimitiveValuesBitExact,
      derivedKineticsBitExact,
      saturationMapping: {
        targetActiveStressPa: 11_600,
        pca: 4.5,
        freeCalciumUM: NORMAL_ADULT_ATRIAL_SATURATION_MAPPING_V1.freeCalciumUM,
        lambdaLand: 1,
        steadyState: Array.from(saturation.steadyState),
        steadyStateRhsResidualBoundPerSec: 1e-9,
        replayedLegacyStressPa: saturation.replayedStressPa
          * legacy.values.Tref / atrial.values.Tref,
        legacyTrefPa: legacy.values.Tref,
        replayedSaturationFactor: saturation.saturationFactor,
        mappedTrefPa: atrial.values.Tref,
        replayedCandidateStressPa: saturation.replayedStressPa,
        absoluteReplayErrorPa: Math.abs(saturation.replayedStressPa - 11_600),
      },
    },
    calciumTiming: {
      reconstructionClass: "low-order-component-metric-reconstruction-not-measured-waveform",
      digitizedCalciumTraceUsed: false,
      atrial: {
        parameters: NORMAL_ADULT_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
        sourceContext: {
          sourceDoi: "10.1002/cnm.2931",
          timeToPeakMs: 82,
          relaxationTime50Ms: 75,
          interpretation: "adjusted-model-output-context-not-independent-measurement",
        },
        replay: twitchMetrics(atrialPack.isolatedTwitchTarget),
      },
      ventricular: {
        parameters: NORMAL_ADULT_VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
        sourceContext: {
          sourceDoi: "10.1016/j.yjmcc.2017.03.008",
          timeToPeakMs: 171,
          relaxationTime50Ms: 122,
          relaxationTime90Ms: 281,
          interpretation: "land-model-coppini-twitch-context",
        },
        replay: {
          ...ventricularReplay,
          rt90ContextReproduced: false,
          rt90FailureReason:
            "replayed-rt90-is-about-224ms-and-does-not-reproduce-281ms-context",
        },
      },
    },
    componentAudit: {
      generatorId: "buildIsolatedLandTargetPackV1",
      atrialTargetPackSha256: atrialPack.contentSha256,
      ventricularTargetPackSha256: ventricularPack.contentSha256,
      isolatedProtocolDtSec: 0.001,
      isolatedProtocolDurationSec: 1.2,
    },
    exclusionBoundary: {
      pvLoopOrPvMorphologyFitUsed: false,
      moyerPassiveMaterialUsed: false,
      passiveMaterialCalibrationUsed: false,
      chamberSpecificActiveGainUsed: false,
      lewalleMicroscopicParameterVectorTransplanted: false,
      closedLoopPhysiologyValidated: false,
    },
    provenance: {
      activeEquationSourceDoi: "10.1016/j.yjmcc.2017.03.008",
      atrialKineticsSourceDoi: "10.1002/cnm.2931",
      atrialForceScaleSourceDoi: "10.1016/j.yjmcc.2025.12.001",
      transformationRules: [
        "retain every atrial-human-prior-v1 primitive except Tref bit-exactly",
        "retain all Land-derived kinetic values bit-exactly because Tref is an output scale",
        "map 11.6 kPa at pCa4.5 and lambda=1 through the actual six-state steady-state saturation factor",
        "share one active parameter set between LA and RA; RA use is an explicit LA-derived extrapolation",
        "reconstruct only source component timing metrics with two exponentials; do not claim a measured calcium waveform",
      ],
    },
    hashAlgorithm: "sha256-canonical-json-v1",
  };
  const result = deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  assertCanonicalSha256(payload, result.contentSha256, sha256Hex);
  return result;
}

export function normalAdultActiveTissueClassPriorAuditHashPayloadV1(
  audit: NormalAdultActiveTissueClassPriorAuditV1,
): Omit<NormalAdultActiveTissueClassPriorAuditV1, "contentSha256"> {
  const { contentSha256: _contentSha256, ...payload } = audit;
  return payload;
}

function replayAtrialSaturationMapping(parameterSet: Land2017SourceParameterSet): {
  readonly steadyState: Float64Array;
  readonly replayedStressPa: number;
  readonly saturationFactor: number;
} {
  const freeCalciumUM = NORMAL_ADULT_ATRIAL_SATURATION_MAPPING_V1.freeCalciumUM;
  const steadyState = initializeLand2017IsometricSteadyStateV1(1, freeCalciumUM, parameterSet);
  const replayedStressPa = evaluateLand2017ContinuousOutput(steadyState, {
    freeCalciumUM,
    fiberEngineeringStrain: 0,
    fiberEngineeringStrainRatePerSec: 0,
  }, parameterSet).sourceActiveFiberStressPa;
  const saturationFactor = replayedStressPa / parameterSet.values.Tref;
  if (!(saturationFactor > 0) || !Number.isFinite(saturationFactor)) {
    throw new Error("Atrial Land saturation replay must produce a positive finite stress/Tref factor");
  }
  return { steadyState, replayedStressPa, saturationFactor };
}

function twitchMetrics(target: {
  readonly timeToPeakSec: number;
  readonly relaxationTime50Sec: number;
  readonly relaxationTime90Sec: number;
  readonly peakAmplitudePa: number;
}): IsolatedTwitchMetricAuditV1 {
  return {
    timeToPeakMs: target.timeToPeakSec * 1000,
    relaxationTime50Ms: target.relaxationTime50Sec * 1000,
    relaxationTime90Ms: target.relaxationTime90Sec * 1000,
    peakAmplitudePa: target.peakAmplitudePa,
    targetPackStatus: "source-regression-oracle-only",
  };
}

function typedEntries<T extends Record<string, unknown>>(
  value: T,
): Array<{ [K in keyof T]: [K, T[K]] }[keyof T]> {
  return Object.entries(value) as Array<{ [K in keyof T]: [K, T[K]] }[keyof T]>;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
