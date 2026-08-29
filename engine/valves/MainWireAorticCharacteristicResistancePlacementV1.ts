import { buildEdges } from "@/engine/core/topology";
import {
  validateMainWireQuasiSteadyOrificeValveParamsV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_CHARACTERISTIC_RESISTANCE_PLACEMENT_V1_ID =
  "main-wire-aortic-characteristic-resistance-placement-v1" as const;

export const MAIN_WIRE_AORTIC_CHARACTERISTIC_RESISTANCE_PLACEMENT_PROFILE_IDS_V1 =
  Object.freeze([
    "half-Ao-SA-resistance-upstream-of-root-compliance",
    "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
    "Land2017-characteristic-impedance-matched",
    "all-Ao-SA-resistance-upstream-of-root-compliance",
  ] as const);

export type MainWireAorticCharacteristicResistancePlacementProfileIdV1 =
  (typeof MAIN_WIRE_AORTIC_CHARACTERISTIC_RESISTANCE_PLACEMENT_PROFILE_IDS_V1)[number];

export type MainWireAorticCharacteristicResistancePlacementProfileV1 =
  Readonly<{
    profileId:
      MainWireAorticCharacteristicResistancePlacementProfileIdV1;
    sourceDynamicEdgeId: "Ao_SA";
    sourceTopologyResistanceMmHgSecPerMl: number;
    fractionMovedUpstreamOfAorticRootCompliance01: number;
    upstreamValveLinearResistanceAdditionMmHgSecPerMl: number;
    downstreamDynamicEdgeResistanceScaleFromTopology: number;
    derivation:
      | "fixed-fraction-research-bracket"
      | "Land2017-source-characteristic-impedance"
      | "source-topology-proximal-characteristic-impedance-reinterpretation";
    sourceCharacteristicImpedanceMmHgSecPerMl: number | null;
    sourceDoi:
      | "10.1016/j.yjmcc.2017.03.008"
      | "10.1152/ajpheart.01207.2005"
      | null;
    healthyHumanAscendingAorticCharacteristicImpedanceContext:
      Readonly<{
        meanMmHgSecPerMl: 0.065;
        standardDeviationMmHgSecPerMl: 0.019;
      }> | null;
    parameterSearchOrFitting: false;
    hemodynamicOutcomeUsedToDeriveProfile: false;
  }>;

const SOURCE_AO_SA_EDGE = buildEdges().find((edge) => edge.name === "Ao_SA");
if (
  SOURCE_AO_SA_EDGE === undefined
  || SOURCE_AO_SA_EDGE.kind !== "dynamic"
  || !(SOURCE_AO_SA_EDGE.R > 0)
) throw new Error("Ao_SA topology source must have positive dynamic resistance");
const SOURCE_AO_SA_RESISTANCE_MMHG_SEC_PER_ML = SOURCE_AO_SA_EDGE.R;
const LAND2017_SOURCE_CHARACTERISTIC_IMPEDANCE_MMHG_SEC_PER_ML = 0.035;

function profile(
  profileId: MainWireAorticCharacteristicResistancePlacementProfileIdV1,
  fractionMovedUpstreamOfAorticRootCompliance01: number,
  derivation: MainWireAorticCharacteristicResistancePlacementProfileV1[
    "derivation"
  ] = "fixed-fraction-research-bracket",
): MainWireAorticCharacteristicResistancePlacementProfileV1 {
  const sourceMatched =
    derivation === "Land2017-source-characteristic-impedance";
  const topologyReinterpreted = derivation
    === "source-topology-proximal-characteristic-impedance-reinterpretation";
  return Object.freeze({
    profileId,
    sourceDynamicEdgeId: "Ao_SA" as const,
    sourceTopologyResistanceMmHgSecPerMl:
      SOURCE_AO_SA_RESISTANCE_MMHG_SEC_PER_ML,
    fractionMovedUpstreamOfAorticRootCompliance01,
    upstreamValveLinearResistanceAdditionMmHgSecPerMl:
      SOURCE_AO_SA_RESISTANCE_MMHG_SEC_PER_ML
      * fractionMovedUpstreamOfAorticRootCompliance01,
    downstreamDynamicEdgeResistanceScaleFromTopology:
      1 - fractionMovedUpstreamOfAorticRootCompliance01,
    derivation,
    sourceCharacteristicImpedanceMmHgSecPerMl: sourceMatched
      ? LAND2017_SOURCE_CHARACTERISTIC_IMPEDANCE_MMHG_SEC_PER_ML
      : topologyReinterpreted
        ? SOURCE_AO_SA_RESISTANCE_MMHG_SEC_PER_ML
        : null,
    sourceDoi: sourceMatched
      ? "10.1016/j.yjmcc.2017.03.008" as const
      : topologyReinterpreted
        ? "10.1152/ajpheart.01207.2005" as const
        : null,
    healthyHumanAscendingAorticCharacteristicImpedanceContext:
      topologyReinterpreted
        ? Object.freeze({
          meanMmHgSecPerMl: 0.065 as const,
          standardDeviationMmHgSecPerMl: 0.019 as const,
        })
        : null,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_AORTIC_CHARACTERISTIC_RESISTANCE_PLACEMENT_PROFILES_V1 =
  Object.freeze({
    "half-Ao-SA-resistance-upstream-of-root-compliance": profile(
      "half-Ao-SA-resistance-upstream-of-root-compliance",
      0.5,
    ),
    "three-quarters-Ao-SA-resistance-upstream-of-root-compliance": profile(
      "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
      0.75,
    ),
    "Land2017-characteristic-impedance-matched": profile(
      "Land2017-characteristic-impedance-matched",
      LAND2017_SOURCE_CHARACTERISTIC_IMPEDANCE_MMHG_SEC_PER_ML
        / SOURCE_AO_SA_RESISTANCE_MMHG_SEC_PER_ML,
      "Land2017-source-characteristic-impedance",
    ),
    "all-Ao-SA-resistance-upstream-of-root-compliance": profile(
      "all-Ao-SA-resistance-upstream-of-root-compliance",
      1,
      "source-topology-proximal-characteristic-impedance-reinterpretation",
    ),
  } satisfies Readonly<Record<
    MainWireAorticCharacteristicResistancePlacementProfileIdV1,
    MainWireAorticCharacteristicResistancePlacementProfileV1
  >>);

export const MAIN_WIRE_AORTIC_CHARACTERISTIC_RESISTANCE_PLACEMENT_CLAIM_V1 =
  Object.freeze({
    role: "fixed-profile-source-research-ablation" as const,
    sourceDynamicEdge: "Ao_SA" as const,
    movedResistanceDestination:
      "AoV-linear-series-term-upstream-of-Ao-root-compliance" as const,
    sourceTopologyLinearResistanceSumPreservedExactly: true as const,
    sourceMatchedProfileDefinition:
      "moved-Ao-SA-resistance-equals-Land2017-arterial-characteristic-impedance" as const,
    allResistanceProfileDefinition:
      "source-Ao-SA-resistance-reinterpreted-as-proximal-characteristic-impedance" as const,
    allResistanceProfileMagnitudeContext:
      "healthy-human-ascending-aorta-characteristic-impedance-mean-plus-or-minus-standard-deviation" as const,
    physiologicalMagnitudeContextUsedAsFitTarget: false as const,
    preExistingValveLinearResistanceExcludedFromArterialImpedanceMatch:
      true as const,
    pulsatileCircuitEquivalenceClaimed: false as const,
    aorticValveEffectiveOrificeAreaChanged: false as const,
    aorticValveOpeningLawChanged: false as const,
    aorticRootComplianceChanged: false as const,
    aorticRootInertanceChanged: false as const,
    newStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveSourceMatchedProfile: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireAorticCharacteristicResistancePlacementProfileV1(
  profileId: MainWireAorticCharacteristicResistancePlacementProfileIdV1,
): MainWireAorticCharacteristicResistancePlacementProfileV1 {
  const resolved =
    MAIN_WIRE_AORTIC_CHARACTERISTIC_RESISTANCE_PLACEMENT_PROFILES_V1[profileId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported aortic characteristic-resistance placement profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function validateMainWireAorticCharacteristicResistancePlacementProfileV1(
  value: MainWireAorticCharacteristicResistancePlacementProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze([
      "aortic characteristic-resistance placement profile must be an object",
    ]);
  }
  const expected =
    MAIN_WIRE_AORTIC_CHARACTERISTIC_RESISTANCE_PLACEMENT_PROFILES_V1[
      value.profileId
    ];
  if (expected === undefined) {
    return Object.freeze([
      "aortic characteristic-resistance placement profileId is unsupported",
    ]);
  }
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push(
      "aortic characteristic-resistance placement fields differ from the fixed profile",
    );
  }
  for (const key of expectedKeys) {
    if (
      value[
        key as keyof MainWireAorticCharacteristicResistancePlacementProfileV1
      ] !== expected[
        key as keyof MainWireAorticCharacteristicResistancePlacementProfileV1
      ]
    ) {
      issues.push(
        `aortic characteristic-resistance placement ${key} differs from its fixed value`,
      );
    }
  }
  return Object.freeze(issues);
}

const RESOLVED_AORTIC_VALVE_PARAMS_CACHE_V1 = new WeakMap<
  object,
  Map<
    MainWireAorticCharacteristicResistancePlacementProfileIdV1,
    MainWireQuasiSteadyOrificeValveParamsV2
  >
>();

export function resolveMainWireAorticCharacteristicResistanceValveParamsV1(
  source: MainWireQuasiSteadyOrificeValveParamsV2,
  placement: MainWireAorticCharacteristicResistancePlacementProfileV1,
): MainWireQuasiSteadyOrificeValveParamsV2 {
  const profileIssues =
    validateMainWireAorticCharacteristicResistancePlacementProfileV1(
      placement,
    );
  if (profileIssues.length > 0) {
    throw new Error(
      `invalid aortic characteristic-resistance placement: ${profileIssues.join("; ")}`,
    );
  }
  if (source.valveId !== "AoV") {
    throw new Error("characteristic-resistance placement requires AoV params");
  }
  let byProfile = RESOLVED_AORTIC_VALVE_PARAMS_CACHE_V1.get(source);
  if (byProfile === undefined) {
    byProfile = new Map();
    RESOLVED_AORTIC_VALVE_PARAMS_CACHE_V1.set(source, byProfile);
  }
  const cached = byProfile.get(placement.profileId);
  if (cached !== undefined) return cached;
  const resolved = Object.freeze({
    ...source,
    parameterSetId: `${source.parameterSetId}+${placement.profileId}`,
    backgroundLinearResistanceMmHgSecPerMl:
      source.backgroundLinearResistanceMmHgSecPerMl
      + placement.upstreamValveLinearResistanceAdditionMmHgSecPerMl,
  });
  const valveIssues = validateMainWireQuasiSteadyOrificeValveParamsV2(resolved);
  if (valveIssues.length > 0) {
    throw new Error(
      `resolved aortic characteristic-resistance valve params are invalid: ${valveIssues.join("; ")}`,
    );
  }
  byProfile.set(placement.profileId, resolved);
  return resolved;
}
