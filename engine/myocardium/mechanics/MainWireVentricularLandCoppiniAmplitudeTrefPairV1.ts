import {
  resolveMainWireVentricularCalciumLandCoppiniAmplitudeProfileV1,
  type MainWireVentricularCalciumLandCoppiniAmplitudeProfileIdV1,
  type MainWireVentricularCalciumLandCoppiniAmplitudeProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumLandCoppiniAmplitudeBracketV1";
import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1,
  type MainWireVentricularLandSarcomereReferenceProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSarcomereReferenceBracketV1";
import type {
  MainWireVentricularLandWholeOrganKuwProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";
import {
  deriveLand2017DerivedParameters,
  stableHash as stableLandParameterHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_LAND_COPPINI_AMPLITUDE_TREF_PAIR_V1_ID =
  "main-wire-ventricular-land-coppini-amplitude-tref-pair-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_COPPINI_AMPLITUDE_TREF_PAIR_IDS_V1 =
  Object.freeze([
    "source-amplitude-source-tref",
    "five-quarters-amplitude-isometric-peak-compensated-tref",
    "three-halves-amplitude-isometric-peak-compensated-tref",
    "seven-quarters-amplitude-isometric-peak-compensated-tref",
    "twofold-amplitude-isometric-peak-compensated-tref",
  ] as const);

export type MainWireVentricularLandCoppiniAmplitudeTrefPairIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_COPPINI_AMPLITUDE_TREF_PAIR_IDS_V1)[number];

export type MainWireVentricularLandCoppiniAmplitudeTrefPairV1 = Readonly<{
  pairId: MainWireVentricularLandCoppiniAmplitudeTrefPairIdV1;
  calciumAmplitudeProfileId:
    MainWireVentricularCalciumLandCoppiniAmplitudeProfileIdV1;
  calciumAmplitudeProfile:
    MainWireVentricularCalciumLandCoppiniAmplitudeProfileV1;
  ventricularTrefScaleFromSource: number;
  resolvedTrefKPa: number;
  sourceOnlyIsometricTargetPeakStressKPa: 51;
  sourceOnlyDerivationDtSec: 0.001;
  hemodynamicOutcomeUsedToDerivePair: false;
}>;

function pair(
  pairId: MainWireVentricularLandCoppiniAmplitudeTrefPairIdV1,
  calciumAmplitudeProfileId:
    MainWireVentricularCalciumLandCoppiniAmplitudeProfileIdV1,
  ventricularTrefScaleFromSource: number,
): MainWireVentricularLandCoppiniAmplitudeTrefPairV1 {
  return Object.freeze({
    pairId,
    calciumAmplitudeProfileId,
    calciumAmplitudeProfile:
      resolveMainWireVentricularCalciumLandCoppiniAmplitudeProfileV1(
        calciumAmplitudeProfileId,
      ),
    ventricularTrefScaleFromSource,
    resolvedTrefKPa: 120 * ventricularTrefScaleFromSource,
    sourceOnlyIsometricTargetPeakStressKPa: 51 as const,
    sourceOnlyDerivationDtSec: 0.001 as const,
    hemodynamicOutcomeUsedToDerivePair: false as const,
  });
}

const PAIRS = Object.freeze({
  "source-amplitude-source-tref": pair(
    "source-amplitude-source-tref",
    "land-coppini-amplitude-source",
    1,
  ),
  "five-quarters-amplitude-isometric-peak-compensated-tref": pair(
    "five-quarters-amplitude-isometric-peak-compensated-tref",
    "land-coppini-amplitude-five-quarters",
    0.638661905001863,
  ),
  "three-halves-amplitude-isometric-peak-compensated-tref": pair(
    "three-halves-amplitude-isometric-peak-compensated-tref",
    "land-coppini-amplitude-three-halves",
    0.5282595181838108,
  ),
  "seven-quarters-amplitude-isometric-peak-compensated-tref": pair(
    "seven-quarters-amplitude-isometric-peak-compensated-tref",
    "land-coppini-amplitude-seven-quarters",
    0.48463649704506584,
  ),
  "twofold-amplitude-isometric-peak-compensated-tref": pair(
    "twofold-amplitude-isometric-peak-compensated-tref",
    "land-coppini-amplitude-twofold",
    0.4639701744822141,
  ),
} satisfies Readonly<Record<
  MainWireVentricularLandCoppiniAmplitudeTrefPairIdV1,
  MainWireVentricularLandCoppiniAmplitudeTrefPairV1
>>);

export const MAIN_WIRE_VENTRICULAR_LAND_COPPINI_AMPLITUDE_TREF_PAIR_CLAIM_V1 =
  Object.freeze({
    role: "source-only-isometric-amplitude-tref-identifiability-pairs" as const,
    sourceTraceShapeAndPhaseHeldExactly: true as const,
    sourceLandParametersExceptTrefHeldExactly: true as const,
    targetPeakStressKPa: 51 as const,
    targetSource:
      "Land-2017-published-final-intact-human-isometric-peak" as const,
    compensationDefinition:
      "target-peak-divided-by-uncompensated-peak-at-lambda-one" as const,
    exactTrefStressLinearityUsed: true as const,
    twitchTimingUsedToDeriveTref: false as const,
    loadedOrHemodynamicOutcomeUsedToDerivePairs: false as const,
    fixedPairsNotContinuousHemodynamicFit: true as const,
    stateCountChanged: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireVentricularLandCoppiniAmplitudeTrefPairV1(
  pairId: MainWireVentricularLandCoppiniAmplitudeTrefPairIdV1,
): MainWireVentricularLandCoppiniAmplitudeTrefPairV1 {
  const resolved = PAIRS[pairId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported Land/Coppini amplitude-Tref pair: ${String(pairId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularLandCoppiniAmplitudeTrefWallMaterialV1(
  pairId: MainWireVentricularLandCoppiniAmplitudeTrefPairIdV1,
  sarcomereReferenceProfileId:
    MainWireVentricularLandSarcomereReferenceProfileIdV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
): LandSlsWallMaterialParamsV1 {
  const resolved = resolveMainWireVentricularLandCoppiniAmplitudeTrefPairV1(
    pairId,
  );
  const base = resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1(
    sarcomereReferenceProfileId,
    kuwProfileId,
  );
  if (resolved.ventricularTrefScaleFromSource === 1) return base;
  const source = base.landEquationParameters;
  const values: Land2017RuntimeParameters = Object.freeze({
    ...source.values,
    Tref: source.values.Tref * resolved.ventricularTrefScaleFromSource,
  });
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: `${source.parameterSetId}-${pairId}`,
    sourceId: source.sourceId,
    doi: source.doi,
    values,
    derived: Object.freeze(deriveLand2017DerivedParameters(values)),
    sourceParameters: Object.freeze(source.sourceParameters.map((entry) =>
      entry.parameter === "Tref"
        ? Object.freeze({
          ...entry,
          location:
            "source-only isometric 51-kPa amplitude compensation research pair",
          original: Object.freeze({ ...entry.original }),
          runtime: Object.freeze({ ...entry.runtime, value: values.Tref }),
        })
        : Object.freeze({
          ...entry,
          original: Object.freeze({ ...entry.original }),
          runtime: Object.freeze({ ...entry.runtime }),
        }))),
    derivedParameters: Object.freeze(
      source.derivedParameters.map((entry) => Object.freeze({ ...entry })),
    ),
  };
  const parameterSet: Land2017SourceParameterSet = Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableLandParameterHash(hashInput),
  });
  return Object.freeze({
    ...base,
    parameterSetId: `${base.parameterSetId}-${pairId}`,
    landEquationParameters: parameterSet,
  });
}
