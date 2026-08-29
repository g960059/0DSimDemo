import { buildEdges } from "@/engine/core/topology";
import {
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILES_V1,
  stepMainWireAorticValveLocalInertanceScalarsV1,
  type MainWireAorticValveLocalInertanceEvaluationV1,
} from "@/engine/valves/MainWireAorticValveLocalInertanceAblationV1";
import {
  validateMainWireQuasiSteadyOrificeValveParamsV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_RESEARCH_V1_ID =
  "main-wire-aortic-root-flow-state-relocation-research-v1" as const;

export const MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_PROFILE_IDS_V1 =
  Object.freeze([
    "Ao-SA-state-at-AoV-r50-l1",
    "Ao-SA-state-at-AoV-r50-lhalf",
    "Ao-SA-state-at-AoV-r75-l1",
    "Ao-SA-state-at-AoV-r75-lhalf",
  ] as const);

export type MainWireAorticRootFlowStateRelocationProfileIdV1 =
  (typeof MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_PROFILE_IDS_V1)[number];

export type MainWireAorticRootFlowStateRelocationProfileV1 = Readonly<{
  profileId: MainWireAorticRootFlowStateRelocationProfileIdV1;
  sourceDynamicEdgeId: "Ao_SA";
  relocatedFlowStateSemantics: "AoV-inflow-through-root-RL";
  sourceTopologyResistanceMmHgSecPerMl: number;
  sourceTopologyInertanceMmHgSec2PerMl: number;
  resistanceFractionUpstreamOfAorticCompliance01: number;
  upstreamValveLinearResistanceAdditionMmHgSecPerMl: number;
  downstreamAlgebraicResistanceScaleFromTopology: number;
  relocatedInertanceScaleFromTopology: number;
  relocatedInertanceMmHgSec2PerMl: number;
  stateDimensionChanged: false;
  checkpointStateSlotCountChanged: false;
  checkpointStateSlotSemanticsChanged: true;
  parameterSearchOrFitting: false;
}>;

const SOURCE_AO_SA_EDGE = buildEdges().find((edge) => edge.name === "Ao_SA");
if (
  SOURCE_AO_SA_EDGE === undefined
  || SOURCE_AO_SA_EDGE.kind !== "dynamic"
  || !(SOURCE_AO_SA_EDGE.R > 0)
  || !((SOURCE_AO_SA_EDGE.L ?? 0) > 0)
) {
  throw new Error("Ao_SA topology source must have positive dynamic R and L");
}
const SOURCE_RESISTANCE_MMHG_SEC_PER_ML = SOURCE_AO_SA_EDGE.R;
const SOURCE_INERTANCE_MMHG_SEC2_PER_ML = SOURCE_AO_SA_EDGE.L!;

function profile(
  profileId: MainWireAorticRootFlowStateRelocationProfileIdV1,
  resistanceFractionUpstreamOfAorticCompliance01: number,
  relocatedInertanceScaleFromTopology: number,
): MainWireAorticRootFlowStateRelocationProfileV1 {
  return Object.freeze({
    profileId,
    sourceDynamicEdgeId: "Ao_SA" as const,
    relocatedFlowStateSemantics: "AoV-inflow-through-root-RL" as const,
    sourceTopologyResistanceMmHgSecPerMl:
      SOURCE_RESISTANCE_MMHG_SEC_PER_ML,
    sourceTopologyInertanceMmHgSec2PerMl:
      SOURCE_INERTANCE_MMHG_SEC2_PER_ML,
    resistanceFractionUpstreamOfAorticCompliance01,
    upstreamValveLinearResistanceAdditionMmHgSecPerMl:
      SOURCE_RESISTANCE_MMHG_SEC_PER_ML
      * resistanceFractionUpstreamOfAorticCompliance01,
    downstreamAlgebraicResistanceScaleFromTopology:
      1 - resistanceFractionUpstreamOfAorticCompliance01,
    relocatedInertanceScaleFromTopology,
    relocatedInertanceMmHgSec2PerMl:
      SOURCE_INERTANCE_MMHG_SEC2_PER_ML
      * relocatedInertanceScaleFromTopology,
    stateDimensionChanged: false as const,
    checkpointStateSlotCountChanged: false as const,
    checkpointStateSlotSemanticsChanged: true as const,
    parameterSearchOrFitting: false as const,
  });
}

export const MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_PROFILES_V1 =
  Object.freeze({
    "Ao-SA-state-at-AoV-r50-l1": profile(
      "Ao-SA-state-at-AoV-r50-l1",
      0.5,
      1,
    ),
    "Ao-SA-state-at-AoV-r50-lhalf": profile(
      "Ao-SA-state-at-AoV-r50-lhalf",
      0.5,
      0.5,
    ),
    "Ao-SA-state-at-AoV-r75-l1": profile(
      "Ao-SA-state-at-AoV-r75-l1",
      0.75,
      1,
    ),
    "Ao-SA-state-at-AoV-r75-lhalf": profile(
      "Ao-SA-state-at-AoV-r75-lhalf",
      0.75,
      0.5,
    ),
  } satisfies Readonly<Record<
    MainWireAorticRootFlowStateRelocationProfileIdV1,
    MainWireAorticRootFlowStateRelocationProfileV1
  >>);

export const MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-profile-source-research-ablation" as const,
    acceptedFlowStateSlot: "Ao_SA" as const,
    acceptedFlowStateSemantics:
      "AoV-inflow-through-root-RL-instead-of-Ao-to-SA-flow" as const,
    aorticRootMassBalance:
      "relocated-RL-inflow-minus-algebraic-residual-R-outflow" as const,
    sourceTopologyLinearResistanceSumPreservedExactly: true as const,
    sourceTopologyInertanceRelocatedNotDuplicated: true as const,
    aorticValveEffectiveOrificeAreaChanged: false as const,
    aorticValveOpeningLawChanged: false as const,
    newStateAdded: false as const,
    acceptedStateSlotCountChanged: false as const,
    acceptedStateSlotSemanticsChanged: true as const,
    canonicalCheckpointCompatible: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

type RelocatedEvaluationBaseV1 = Omit<
  MainWireAorticValveLocalInertanceEvaluationV1,
  "modelId" | "researchProfileId" | "claim"
>;

export type MainWireAorticRootFlowStateRelocationEvaluationV1 =
  RelocatedEvaluationBaseV1 & Readonly<{
    modelId:
      typeof MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_RESEARCH_V1_ID;
    rootFlowStateRelocationProfileId:
      MainWireAorticRootFlowStateRelocationProfileIdV1;
    acceptedFlowStateSlot: "Ao_SA";
    acceptedFlowStateSemantics: "AoV-inflow-through-root-RL";
    claim: typeof MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_CLAIM_V1;
  }>;

export function resolveMainWireAorticRootFlowStateRelocationProfileV1(
  profileId: MainWireAorticRootFlowStateRelocationProfileIdV1,
): MainWireAorticRootFlowStateRelocationProfileV1 {
  const resolved = MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_PROFILES_V1[
    profileId
  ];
  if (resolved === undefined) {
    throw new Error(
      `unsupported aortic-root flow-state relocation profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function validateMainWireAorticRootFlowStateRelocationProfileV1(
  value: MainWireAorticRootFlowStateRelocationProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze([
      "aortic-root flow-state relocation profile must be an object",
    ]);
  }
  const expected = MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_PROFILES_V1[
    value.profileId
  ];
  if (expected === undefined) {
    return Object.freeze([
      "aortic-root flow-state relocation profileId is unsupported",
    ]);
  }
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push(
      "aortic-root flow-state relocation fields differ from the fixed profile",
    );
  }
  for (const key of expectedKeys) {
    if (
      value[key as keyof MainWireAorticRootFlowStateRelocationProfileV1]
      !== expected[key as keyof MainWireAorticRootFlowStateRelocationProfileV1]
    ) {
      issues.push(
        `aortic-root flow-state relocation ${key} differs from its fixed value`,
      );
    }
  }
  return Object.freeze(issues);
}

const RESOLVED_VALVE_PARAMS_CACHE_V1 = new WeakMap<
  object,
  Map<
    MainWireAorticRootFlowStateRelocationProfileIdV1,
    MainWireQuasiSteadyOrificeValveParamsV2
  >
>();

export function resolveMainWireAorticRootFlowStateRelocationValveParamsV1(
  source: MainWireQuasiSteadyOrificeValveParamsV2,
  profileValue: MainWireAorticRootFlowStateRelocationProfileV1,
): MainWireQuasiSteadyOrificeValveParamsV2 {
  const profileIssues =
    validateMainWireAorticRootFlowStateRelocationProfileV1(profileValue);
  if (profileIssues.length > 0) {
    throw new Error(
      `invalid aortic-root flow-state relocation: ${profileIssues.join("; ")}`,
    );
  }
  if (source.valveId !== "AoV") {
    throw new Error("aortic-root flow-state relocation requires AoV params");
  }
  let byProfile = RESOLVED_VALVE_PARAMS_CACHE_V1.get(source);
  if (byProfile === undefined) {
    byProfile = new Map();
    RESOLVED_VALVE_PARAMS_CACHE_V1.set(source, byProfile);
  }
  const cached = byProfile.get(profileValue.profileId);
  if (cached !== undefined) return cached;
  const resolved = Object.freeze({
    ...source,
    parameterSetId: `${source.parameterSetId}+${profileValue.profileId}`,
    backgroundLinearResistanceMmHgSecPerMl:
      source.backgroundLinearResistanceMmHgSecPerMl
      + profileValue.upstreamValveLinearResistanceAdditionMmHgSecPerMl,
  });
  const issues = validateMainWireQuasiSteadyOrificeValveParamsV2(resolved);
  if (issues.length > 0) {
    throw new Error(
      `resolved aortic-root relocation valve params are invalid: ${issues.join("; ")}`,
    );
  }
  byProfile.set(profileValue.profileId, resolved);
  return resolved;
}

export function stepMainWireAorticRootFlowStateRelocationScalarsV1(
  previousLeafletOpeningFraction01: number,
  previousAcceptedRootInflowMlPerSec: number,
  dtSec: number,
  upstreamPressureMmHg: number,
  downstreamRootPressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  profileValue: MainWireAorticRootFlowStateRelocationProfileV1,
): MainWireAorticRootFlowStateRelocationEvaluationV1 {
  const profileIssues =
    validateMainWireAorticRootFlowStateRelocationProfileV1(profileValue);
  if (profileIssues.length > 0) {
    throw new Error(
      `invalid aortic-root flow-state relocation: ${profileIssues.join("; ")}`,
    );
  }
  const local = stepMainWireAorticValveLocalInertanceScalarsV1(
    previousLeafletOpeningFraction01,
    previousAcceptedRootInflowMlPerSec,
    dtSec,
    upstreamPressureMmHg,
    downstreamRootPressureMmHg,
    params,
    profileValue.relocatedInertanceMmHgSec2PerMl,
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILES_V1[
      "historical-topology-local-inertance"
    ],
  );
  const {
    modelId: _discardedModelId,
    researchProfileId: _discardedKernelProfileId,
    claim: _discardedClaim,
    ...shared
  } = local;
  return Object.freeze({
    ...shared,
    modelId:
      MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_RESEARCH_V1_ID,
    rootFlowStateRelocationProfileId: profileValue.profileId,
    acceptedFlowStateSlot: "Ao_SA" as const,
    acceptedFlowStateSemantics: "AoV-inflow-through-root-RL" as const,
    claim: MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_CLAIM_V1,
  });
}
