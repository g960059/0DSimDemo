import type { ActiveStressDebugTerms, Chamber } from "@/engine/chambers";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";
import {
  MODELCORE_EXPERIMENTAL_LAND2017_LA_SOURCE_ONLY_PROVIDER_ID,
  MODELCORE_EXPERIMENTAL_LAND2017_RA_SOURCE_ONLY_PROVIDER_ID,
  calciumScaledLand2017LaSourceOnlyProvider,
  calciumScaledLand2017RaSourceOnlyProvider,
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvCalciumScaledSourceProviderOptions,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_SOURCE_DOI,
  LAND2017_SOURCE_ID,
  deriveLand2017DerivedParameters,
  stableHash,
  type Land2017EquationParameters,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017";

export type AtrialLandChamber = "LA" | "RA";

export const LANDATRIAL_PARAMETER_PACK_ID =
  "landatrial-parameter-pack-v1" as const;
export const LANDATRIAL_LA_SOURCE_PROVIDER_ID =
  `${MODELCORE_EXPERIMENTAL_LAND2017_LA_SOURCE_ONLY_PROVIDER_ID}:landatrial-runtime-v1` as const;
export const LANDATRIAL_RA_SOURCE_PROVIDER_ID =
  `${MODELCORE_EXPERIMENTAL_LAND2017_RA_SOURCE_ONLY_PROVIDER_ID}:landatrial-runtime-v1` as const;

export type AtrialLandParameterPack = {
  readonly parameterPackId: typeof LANDATRIAL_PARAMETER_PACK_ID;
  readonly sourceCore: "Land2017";
  readonly scope: "current-runtime";
  readonly sourceTrefUnchanged: true;
  readonly chamberParameterSets: {
    readonly LA: Land2017SourceParameterSet;
    readonly RA: Land2017SourceParameterSet;
  };
  readonly calibrationNotes: readonly string[];
};

export type AtrialLandParameterSetOptions = {
  readonly parameterSetIdSuffix?: string;
  readonly runtimeValueOverrides?: Partial<Land2017RuntimeParameters>;
};

export type AtrialLandSourceProviderOptions =
  Omit<ModelCoreLand2017LvCalciumScaledSourceProviderOptions, "parameterSet" | "sourceProviderId"> & {
    readonly sourceProviderId?: string;
    readonly parameterSet?: Land2017EquationParameters;
    readonly signedPressureAdapter?: boolean;
  };

export const LANDATRIAL_PARAMETER_PACK: AtrialLandParameterPack = deepFreeze({
  parameterPackId: LANDATRIAL_PARAMETER_PACK_ID,
  sourceCore: "Land2017",
  scope: "current-runtime",
  sourceTrefUnchanged: true,
  chamberParameterSets: {
    LA: makeAtrialParameterSet("LA"),
    RA: makeAtrialParameterSet("RA"),
  },
  calibrationNotes: [
    "The runtime pack keeps Land2017 Tref unchanged.",
    "Atrial differences are limited to calcium sensitivity and kinetic-rate parameters.",
    "The RA parameterization is the conservative desensitized runtime configuration.",
    "Atrial provider pressure assembly accepts signed source stress.",
  ],
});

export function createAtrialLandSourceProvider(
  chamber: AtrialLandChamber,
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation =
    createModelCoreLand2017LvSourceProviderInstrumentation(),
  options: AtrialLandSourceProviderOptions,
): ModelCoreExperimentalActiveSourceProvider {
  const sourceProviderId = options.sourceProviderId
    ?? (chamber === "LA" ? LANDATRIAL_LA_SOURCE_PROVIDER_ID : LANDATRIAL_RA_SOURCE_PROVIDER_ID);
  const parameterSet = options.parameterSet ?? LANDATRIAL_PARAMETER_PACK.chamberParameterSets[chamber];
  const providerOptions: ModelCoreLand2017LvCalciumScaledSourceProviderOptions = {
    ...options,
    sourceProviderId,
    parameterSet,
  };
  const base = chamber === "LA"
    ? calciumScaledLand2017LaSourceOnlyProvider(instrumentation, providerOptions)
    : calciumScaledLand2017RaSourceOnlyProvider(instrumentation, providerOptions);
  return options.signedPressureAdapter === false
    ? base
    : signedAtrialLandPressureAdapterProvider(chamber, base);
}

function signedAtrialLandPressureAdapterProvider(
  chamber: AtrialLandChamber,
  sourceProvider: ModelCoreExperimentalActiveSourceProvider,
): ModelCoreExperimentalActiveSourceProvider {
  if (!sourceProvider.sourceActiveStressPa) {
    throw new Error(`LandAtrial ${chamber} provider requires a source-stress provider.`);
  }
  return {
    sourceProviderId: `${sourceProvider.sourceProviderId}:signed-atrial-pressure-adapter`,
    initialInternal: sourceProvider.initialInternal,
    initialProviderState: sourceProvider.initialProviderState,
    cloneProviderState: sourceProvider.cloneProviderState,
    debugProviderState: sourceProvider.debugProviderState,
    commitProviderStateAfterStep: sourceProvider.commitProviderStateAfterStep,
    internalDerivatives: sourceProvider.internalDerivatives,
    pressure: (call) => call.activeModel.pressureFromSignedActiveFiberStress(
      call.volumeMl,
      call.internal,
      call.chamberCtx,
      readSourceStress(sourceProvider, call, chamber),
    ),
    debugPressureTerms: (call) => call.activeModel.debugPressureTermsFromSignedActiveFiberStress(
      call.volumeMl,
      call.internal,
      call.chamberCtx,
      readSourceStress(sourceProvider, call, chamber),
    ),
    debugActiveStressTerms: (call) =>
      signedDebugActiveStressTerms(call, readSourceStress(sourceProvider, call, chamber)),
  };
}

function readSourceStress(
  sourceProvider: ModelCoreExperimentalActiveSourceProvider,
  call: ModelCoreActiveSourceProviderCall,
  chamber: AtrialLandChamber,
): number {
  const value = sourceProvider.sourceActiveStressPa?.(call);
  if (!Number.isFinite(value)) {
    throw new Error(`LandAtrial ${chamber} source stress must be finite.`);
  }
  return value;
}

function signedDebugActiveStressTerms(
  call: ModelCoreActiveSourceProviderCall,
  sourceActiveStressPa: number,
): ActiveStressDebugTerms {
  const baselineTerms = call.activeModel.debugActiveStressTerms(call.volumeMl, call.internal, call.chamberCtx);
  const signedPressureTerms = call.activeModel.debugPressureTermsFromSignedActiveFiberStress(
    call.volumeMl,
    call.internal,
    call.chamberCtx,
    sourceActiveStressPa,
  );
  return {
    ...baselineTerms,
    ...signedPressureTerms,
    sigmaActTargetRaw: sourceActiveStressPa,
    sigmaActTarget: sourceActiveStressPa,
    sigmaAct: sourceActiveStressPa,
    activeTargetLimiter: 1,
    lowStretchLimiterGate: 0,
    lowStretchLimiterStrength: 0,
  };
}

function makeAtrialParameterSet(chamber: AtrialLandChamber): Land2017SourceParameterSet {
  return createAtrialLandParameterSet(chamber);
}

export function createAtrialLandParameterSet(
  chamber: AtrialLandChamber,
  options: AtrialLandParameterSetOptions = {},
): Land2017SourceParameterSet {
  const base = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
  const values = {
    ...atrialRuntimeValues(chamber, base.values),
    ...(options.runtimeValueOverrides ?? {}),
    // Keep source Tref fixed; chamber pressure scaling comes from chamber geometry.
    Tref: base.values.Tref,
  };
  const derived = deriveLand2017DerivedParameters(values);
  const suffix = options.parameterSetIdSuffix ? `:${options.parameterSetIdSuffix}` : "";
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: `${LANDATRIAL_PARAMETER_PACK_ID}:${chamber}${suffix}`,
    sourceId: LAND2017_SOURCE_ID,
    doi: LAND2017_SOURCE_DOI,
    values,
    derived,
    sourceParameters: base.sourceParameters,
    derivedParameters: base.derivedParameters,
  };
  return deepFreeze({
    ...hashInput,
    parameterSetStableHash: stableHash(hashInput),
  });
}

function atrialRuntimeValues(
  chamber: AtrialLandChamber,
  base: Land2017RuntimeParameters,
): Land2017RuntimeParameters {
  const right = chamber === "RA";
  return {
    ...base,
    kTRPN: right ? 110 : 140,
    CaT50Ref: right ? 0.90 : 0.72,
    ku: right ? 750 : 1200,
    kuw: right ? 150 : 240,
    kws: right ? 10 : 18,
    gammaS: right ? 8 : 12,
    gammaW: right ? 500 : 760,
    TRPN50: right ? 0.46 : 0.34,
    // Keep source Tref fixed; chamber pressure scaling comes from chamber geometry.
    Tref: base.Tref,
  };
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const entry of Object.values(value as Record<string, unknown>)) {
    if (entry && typeof entry === "object" && !Object.isFrozen(entry)) {
      deepFreeze(entry);
    }
  }
  return value;
}

export function isAtrialLandProviderId(providerId: string | undefined): boolean {
  return providerId?.includes("landatrial-runtime-v1") ?? false;
}

export function atrialLandProviderScope(
  providers: Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>>,
): readonly AtrialLandChamber[] {
  return (["LA", "RA"] as const).filter((chamber) =>
    isAtrialLandProviderId(providers[chamber]?.sourceProviderId)
  );
}
