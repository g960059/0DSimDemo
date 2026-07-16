import {
  deriveLand2017DerivedParameters,
  stableHash,
  type Land2017DerivedParameterName,
  type Land2017SourceParameterName,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const ATRIAL_POPULATION_ONLY_LAND_V1_ID =
  "atrial-land-population-only-no-global-volume-rate-distortion-v1" as const;

export type AtrialPopulationOnlyLandAuditV1 = Readonly<{
  reductionId: typeof ATRIAL_POPULATION_ONLY_LAND_V1_ID;
  sourceParameterSetId: string;
  sourceParameterSetStableHash: string;
  runtimeParameterSetId: string;
  runtimeParameterSetStableHash: string;
  changedPrimitiveParameters: readonly ["Aeff"];
  changedDerivedParameters: readonly ["As", "Aw"];
  retainedPopulationStates: readonly ["CaTRPN", "B", "W", "S"];
  dormantCompatibilityStates: readonly ["xiW", "xiS"];
  globalAtrialVolumeRateUsedAsSarcomereRate: false;
  microscopicForceVelocityIdentifiedForRuntime: false;
  activeSeriesElementPresent: false;
  aEff: 0;
  aw: 0;
  as: 0;
  allOtherPrimitiveValuesBitExact: true;
  allOtherDerivedValuesBitExact: true;
  pvLoopMorphologyUsedForReduction: false;
  claimBoundary:
    "reduced-organ-scale-active-closure-not-a-human-atrial-force-velocity-identification";
}>;

export type AtrialPopulationOnlyLandV1 = Readonly<{
  parameterSet: Land2017SourceParameterSet;
  audit: AtrialPopulationOnlyLandAuditV1;
}>;

/**
 * Removes only Land's distortion drive from the atrial organ-scale closure.
 *
 * In the one-fiber chamber, cavity-volume rate is not an observed sarcomere
 * shortening rate: annular motion, non-self-similar wall deformation, and
 * regional fibre recruitment are unresolved.  Setting Aeff=0 therefore keeps
 * the calcium/troponin and B/W/S population kinetics while refusing to infer a
 * microscopic force-velocity signal from global atrial volume.  The same
 * reduction is shared by LA and RA and no chamber PV observable is consumed.
 *
 * The six-slot numerical state is retained temporarily so this causal
 * reduction can be compared in the existing monolithic solver.  xiW/xiS are
 * exponentially driven to the zero source-distortion manifold and have no
 * active-stress contribution when Aeff=0.
 */
export function buildAtrialPopulationOnlyLandV1(
  source: Land2017SourceParameterSet,
): AtrialPopulationOnlyLandV1 {
  const values = Object.freeze({ ...source.values, Aeff: 0 });
  const derived = Object.freeze(deriveLand2017DerivedParameters(values));
  const sourceParameters = Object.freeze(source.sourceParameters.map((entry) =>
    entry.parameter === "Aeff"
      ? Object.freeze({
          ...entry,
          location: `${entry.location}; ${ATRIAL_POPULATION_ONLY_LAND_V1_ID}: organ-scale atrial volume rate is not identified as sarcomere shortening rate`,
          runtime: Object.freeze({ ...entry.runtime, value: 0 }),
        })
      : entry));
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: `${source.parameterSetId}:${ATRIAL_POPULATION_ONLY_LAND_V1_ID}`,
    sourceId: source.sourceId,
    doi: source.doi,
    values,
    derived,
    sourceParameters,
    derivedParameters: source.derivedParameters,
  };
  const parameterSet = deepFreeze({
    ...hashInput,
    parameterSetStableHash: stableHash(hashInput),
  });
  const changedPrimitiveParameters = changedKeys(
    source.values,
    parameterSet.values,
  );
  const changedDerivedParameters = changedKeys(
    source.derived,
    parameterSet.derived,
  );
  if (
    changedPrimitiveParameters.length !== 1
    || changedPrimitiveParameters[0] !== "Aeff"
    || changedDerivedParameters.length !== 2
    || changedDerivedParameters[0] !== "As"
    || changedDerivedParameters[1] !== "Aw"
    || !Object.is(parameterSet.values.Aeff, 0)
    || !Object.is(parameterSet.derived.Aw, 0)
    || !Object.is(parameterSet.derived.As, 0)
  ) {
    throw new Error("atrial population-only Land reduction changed an undeclared parameter");
  }
  const audit = deepFreeze<AtrialPopulationOnlyLandAuditV1>({
    reductionId: ATRIAL_POPULATION_ONLY_LAND_V1_ID,
    sourceParameterSetId: source.parameterSetId,
    sourceParameterSetStableHash: source.parameterSetStableHash,
    runtimeParameterSetId: parameterSet.parameterSetId,
    runtimeParameterSetStableHash: parameterSet.parameterSetStableHash,
    changedPrimitiveParameters: ["Aeff"],
    changedDerivedParameters: ["As", "Aw"],
    retainedPopulationStates: ["CaTRPN", "B", "W", "S"],
    dormantCompatibilityStates: ["xiW", "xiS"],
    globalAtrialVolumeRateUsedAsSarcomereRate: false,
    microscopicForceVelocityIdentifiedForRuntime: false,
    activeSeriesElementPresent: false,
    aEff: 0,
    aw: 0,
    as: 0,
    allOtherPrimitiveValuesBitExact: true,
    allOtherDerivedValuesBitExact: true,
    pvLoopMorphologyUsedForReduction: false,
    claimBoundary:
      "reduced-organ-scale-active-closure-not-a-human-atrial-force-velocity-identification",
  });
  return Object.freeze({ parameterSet, audit });
}

function changedKeys<T extends Record<string, number>>(
  before: T,
  after: T,
): string[] {
  return (Object.keys(before) as Array<keyof T>)
    .filter((key) => !Object.is(before[key], after[key]))
    .map(String)
    .sort();
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

// Compile-time guards: the declared reduction keys must remain Land keys.
const _primitiveKey: Land2017SourceParameterName = "Aeff";
const _derivedKeys: readonly Land2017DerivedParameterName[] = ["As", "Aw"];
void _primitiveKey;
void _derivedKeys;
