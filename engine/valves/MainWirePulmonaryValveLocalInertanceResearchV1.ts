import {
  stepMainWireQuasiSteadyOrificeValveScalarsV2,
  validateMainWireQuasiSteadyOrificeValveParamsV2,
  type MainWireQuasiSteadyOrificeValveEvaluationV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_V1_ID =
  "main-wire-pulmonary-valve-local-inertance-research-v1" as const;

const BLOOD_DENSITY_KG_PER_M3 = 1_060;
const FIXED_RVOT_FLOW_AREA_CM2 = 4;
const PASCAL_PER_MMHG = 133.322387415;

export const MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_PROFILE_IDS_V1 =
  Object.freeze([
    "rvot-2cm-column-local-inertance",
    "rvot-4cm-column-local-inertance",
    "rvot-7cm-column-local-inertance",
  ] as const);

export type MainWirePulmonaryValveLocalInertanceResearchProfileIdV1 =
  (typeof MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_PROFILE_IDS_V1)[number];

export type MainWirePulmonaryValveLocalInertanceResearchProfileV1 = Readonly<{
  profileId: MainWirePulmonaryValveLocalInertanceResearchProfileIdV1;
  valveId: "PV";
  inertanceSource: "rho-length-over-fixed-rvot-flow-area";
  bloodDensityKgPerM3: typeof BLOOD_DENSITY_KG_PER_M3;
  effectiveColumnLengthCm: 2 | 4 | 7;
  fixedFlowAreaCm2: typeof FIXED_RVOT_FLOW_AREA_CM2;
  localInertanceMmHgSec2PerMl: number;
  parameterSearchOrFitting: false;
}>;

function fixedProfile(
  effectiveColumnLengthCm: 2 | 4 | 7,
): MainWirePulmonaryValveLocalInertanceResearchProfileV1 {
  return Object.freeze({
    profileId:
      `rvot-${effectiveColumnLengthCm}cm-column-local-inertance` as
        MainWirePulmonaryValveLocalInertanceResearchProfileIdV1,
    valveId: "PV" as const,
    inertanceSource: "rho-length-over-fixed-rvot-flow-area" as const,
    bloodDensityKgPerM3: BLOOD_DENSITY_KG_PER_M3,
    effectiveColumnLengthCm,
    fixedFlowAreaCm2: FIXED_RVOT_FLOW_AREA_CM2,
    localInertanceMmHgSec2PerMl:
      BLOOD_DENSITY_KG_PER_M3
      * (effectiveColumnLengthCm / 100)
      / (FIXED_RVOT_FLOW_AREA_CM2 / 10_000)
      * 1e-6
      / PASCAL_PER_MMHG,
    parameterSearchOrFitting: false as const,
  });
}

export const MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_PROFILES_V1 =
  Object.freeze({
    "rvot-2cm-column-local-inertance": fixedProfile(2),
    "rvot-4cm-column-local-inertance": fixedProfile(4),
    "rvot-7cm-column-local-inertance": fixedProfile(7),
  } satisfies Readonly<Record<
    MainWirePulmonaryValveLocalInertanceResearchProfileIdV1,
    MainWirePulmonaryValveLocalInertanceResearchProfileV1
  >>);

export const MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_CLAIM_V1 =
  Object.freeze({
    role: "fixed-physical-bracket-coupled-research" as const,
    valve: "PV" as const,
    acceptedFlowStateOwner:
      "research-runner-external-atomic-promotion" as const,
    timeDiscretization: "backward-Euler" as const,
    pressureFlowLaw:
      "fixed-local-L-plus-linear-and-EOA-derived-quadratic-loss" as const,
    competentValveConstraint:
      "semismooth-q-greater-than-or-equal-to-zero" as const,
    openingStateOwnerChanged: false as const,
    pulmonaryRootModeRequired: "resistive-root" as const,
    canonicalAcceptedStateOrCheckpointChanged: false as const,
    physicalColumnLengthIsMechanisticBracketNotMeasuredAnatomy: true as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

type SharedEvaluation = Omit<
  MainWireQuasiSteadyOrificeValveEvaluationV2,
  "modelId" | "claim" | "tangentBranch" | "openOrificeResidualMmHg"
    | "powerBalanceResidualMmHgMlPerSec"
>;

export type MainWirePulmonaryValveLocalInertanceEvaluationV1 =
  SharedEvaluation & Readonly<{
    modelId: typeof MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_V1_ID;
    researchProfileId:
      MainWirePulmonaryValveLocalInertanceResearchProfileIdV1;
    tangentBranch:
      | MainWireQuasiSteadyOrificeValveEvaluationV2["tangentBranch"]
      | "forward-inertial-open-orifice"
      | "unilateral-flow-contact";
    localInertanceMmHgSec2PerMl: number;
    previousAcceptedFlowMlPerSec: number;
    rawMomentumRootMlPerSec: number;
    closureProjectionDeltaMlPerSec: number;
    inertialPressureMmHg: number;
    kineticEnergyChangeRateMmHgMlPerSec: number;
    backwardEulerNumericalDissipationMmHgMlPerSec: number;
    openOrificeResidualMmHg: number;
    powerBalanceResidualMmHgMlPerSec: number;
    claim: typeof MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_CLAIM_V1;
  }>;

export function resolveMainWirePulmonaryValveLocalInertanceResearchProfileV1(
  profileId: MainWirePulmonaryValveLocalInertanceResearchProfileIdV1,
): MainWirePulmonaryValveLocalInertanceResearchProfileV1 {
  const profile =
    MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_PROFILES_V1[profileId];
  if (profile === undefined) {
    throw new Error(`unsupported PV local-inertance profile: ${String(profileId)}`);
  }
  return profile;
}

export function validateMainWirePulmonaryValveLocalInertanceResearchProfileV1(
  input: MainWirePulmonaryValveLocalInertanceResearchProfileV1,
): readonly string[] {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return Object.freeze(["PV local-inertance profile must be an object"]);
  }
  const expected =
    MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_PROFILES_V1[
      input.profileId
    ];
  if (expected === undefined) {
    return Object.freeze(["PV local-inertance profileId is unsupported"]);
  }
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(input).sort();
  const issues: string[] = [];
  if (
    expectedKeys.length !== actualKeys.length
    || expectedKeys.some((key, index) => key !== actualKeys[index])
  ) {
    issues.push("PV local-inertance profile fields differ from fixed profile");
  }
  for (const key of expectedKeys) {
    if (
      input[key as keyof typeof input]
      !== expected[key as keyof typeof expected]
    ) {
      issues.push(`PV local-inertance profile ${key} differs from fixed value`);
    }
  }
  return Object.freeze(issues);
}

export function stepMainWirePulmonaryValveLocalInertanceScalarsV1(
  previousLeafletOpeningFraction01: number,
  previousAcceptedFlowMlPerSec: number,
  dtSec: number,
  upstreamPressureMmHg: number,
  downstreamPressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  profile: MainWirePulmonaryValveLocalInertanceResearchProfileV1,
): MainWirePulmonaryValveLocalInertanceEvaluationV1 {
  const issues = [
    ...validateMainWireQuasiSteadyOrificeValveParamsV2(params),
    ...validateMainWirePulmonaryValveLocalInertanceResearchProfileV1(profile),
  ];
  if (params.valveId !== "PV") issues.push("local inertance requires PV params");
  if (params.closedReverseEroaCm2 !== 0) {
    issues.push("PV local-inertance research requires a competent valve");
  }
  if (
    !(previousAcceptedFlowMlPerSec >= 0)
    || !Number.isFinite(previousAcceptedFlowMlPerSec)
  ) issues.push("previous PV flow must be finite and nonnegative");
  if (issues.length > 0) {
    throw new Error(`invalid PV local-inertance step: ${issues.join("; ")}`);
  }
  const base = stepMainWireQuasiSteadyOrificeValveScalarsV2(
    previousLeafletOpeningFraction01,
    dtSec,
    upstreamPressureMmHg,
    downstreamPressureMmHg,
    params,
  );
  if (!base.valid || !base.finite) {
    throw new Error(`PV opening step failed: ${base.issues.join("; ")}`);
  }
  const pressureGradientMmHg = base.pressureGradientMmHg;
  const inertance = profile.localInertanceMmHgSec2PerMl;
  const resistance = base.forwardActiveEoaCm2 === 0
    ? 0
    : params.backgroundLinearResistanceMmHgSecPerMl;
  const bernoulli = base.forwardActiveEoaCm2 === 0
    ? 0
    : base.bernoulliMmHgSec2PerMl2;
  const effectiveGradient = pressureGradientMmHg
    + inertance * previousAcceptedFlowMlPerSec / dtSec;
  const effectiveResistance = resistance + inertance / dtSec;
  const rawMomentumRootMlPerSec = base.forwardActiveEoaCm2 === 0
    ? 0
    : solveExactSignedQAbsQRoot(
        effectiveGradient,
        effectiveResistance,
        bernoulli,
      );
  const flowMlPerSec = Math.max(0, rawMomentumRootMlPerSec);
  const constrained = flowMlPerSec !== rawMomentumRootMlPerSec
    || base.forwardActiveEoaCm2 === 0;
  const dAreaDGradient = params.maximumForwardEoaCm2
    * base.dLeafletOpeningFractionDPressureGradientPerMmHg;
  const dBernoulliDGradient = base.forwardActiveEoaCm2 === 0
    ? 0
    : -2 * bernoulli * dAreaDGradient / base.forwardActiveEoaCm2;
  const tangentDenominator = effectiveResistance
    + 2 * bernoulli * Math.abs(flowMlPerSec);
  const dFlowDGradient = constrained || !(tangentDenominator > 0)
    ? 0
    : (1 - flowMlPerSec * Math.abs(flowMlPerSec)
      * dBernoulliDGradient) / tangentDenominator;
  const inertialPressureMmHg = inertance
    * (flowMlPerSec - previousAcceptedFlowMlPerSec) / dtSec;
  const dissipativePressureMmHg = resistance * flowMlPerSec
    + bernoulli * flowMlPerSec * Math.abs(flowMlPerSec);
  const openOrificeResidualMmHg = pressureGradientMmHg
    - inertialPressureMmHg - dissipativePressureMmHg;
  const signedHydraulicSupportReactionMmHg = constrained
    ? -openOrificeResidualMmHg
    : 0;
  const competentReverseClosureActive = constrained
    && signedHydraulicSupportReactionMmHg > 0;
  const subthresholdForwardSupportActive = constrained
    && signedHydraulicSupportReactionMmHg < 0;
  const kineticEnergyChangeRateMmHgMlPerSec = 0.5 * inertance
    * (flowMlPerSec ** 2 - previousAcceptedFlowMlPerSec ** 2) / dtSec;
  const backwardEulerNumericalDissipationMmHgMlPerSec = 0.5 * inertance
    * (flowMlPerSec - previousAcceptedFlowMlPerSec) ** 2 / dtSec;
  const hydraulicPowerInputMmHgMlPerSec =
    pressureGradientMmHg * flowMlPerSec;
  const dissipativePowerMmHgMlPerSec =
    dissipativePressureMmHg * flowMlPerSec;
  const hydraulicSupportPowerMmHgMlPerSec =
    signedHydraulicSupportReactionMmHg * flowMlPerSec;
  const powerBalanceResidualMmHgMlPerSec =
    hydraulicPowerInputMmHgMlPerSec - dissipativePowerMmHgMlPerSec
    - kineticEnergyChangeRateMmHgMlPerSec
    - backwardEulerNumericalDissipationMmHgMlPerSec
    + hydraulicSupportPowerMmHgMlPerSec;
  const evaluation = Object.freeze({
    ...base,
    modelId: MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_V1_ID,
    researchProfileId: profile.profileId,
    flowMlPerSec,
    activeDirection: flowMlPerSec > 0 || pressureGradientMmHg > 0
      ? "forward" as const
      : pressureGradientMmHg < 0
        ? "reverse" as const
        : "zero-gradient" as const,
    activeEoaCm2: flowMlPerSec > 0 || pressureGradientMmHg >= 0
      ? base.forwardActiveEoaCm2
      : 0,
    dFlowDPressureGradientMlPerSecPerMmHg: dFlowDGradient,
    tangentBranch: constrained
      ? "unilateral-flow-contact" as const
      : "forward-inertial-open-orifice" as const,
    resistanceMmHgSecPerMl: resistance,
    bernoulliMmHgSec2PerMl2: bernoulli,
    dissipativePressureMmHg,
    openOrificeResidualMmHg,
    competentReverseClosureReactionMmHg:
      competentReverseClosureActive ? signedHydraulicSupportReactionMmHg : 0,
    subthresholdForwardSupportReactionMmHg:
      subthresholdForwardSupportActive ? -signedHydraulicSupportReactionMmHg : 0,
    signedHydraulicSupportReactionMmHg,
    hydraulicBalanceResidualMmHg:
      openOrificeResidualMmHg + signedHydraulicSupportReactionMmHg,
    hydraulicPowerInputMmHgMlPerSec,
    dissipativePowerMmHgMlPerSec,
    hydraulicSupportPowerMmHgMlPerSec,
    powerBalanceResidualMmHgMlPerSec,
    competentReverseClosureActive,
    subthresholdForwardSupportActive,
    localInertanceMmHgSec2PerMl: inertance,
    previousAcceptedFlowMlPerSec,
    rawMomentumRootMlPerSec,
    closureProjectionDeltaMlPerSec: flowMlPerSec - rawMomentumRootMlPerSec,
    inertialPressureMmHg,
    kineticEnergyChangeRateMmHgMlPerSec,
    backwardEulerNumericalDissipationMmHgMlPerSec,
    claim: MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_RESEARCH_CLAIM_V1,
  } satisfies MainWirePulmonaryValveLocalInertanceEvaluationV1);
  if (!numericLeavesFinite(evaluation)) {
    throw new Error("PV local-inertance evaluation produced nonfinite readback");
  }
  return evaluation;
}

function solveExactSignedQAbsQRoot(
  gradientMmHg: number,
  resistanceMmHgSecPerMl: number,
  bernoulliMmHgSec2PerMl2: number,
): number {
  if (gradientMmHg === 0) return 0;
  const magnitude = Math.abs(gradientMmHg);
  const discriminant = Math.sqrt(
    resistanceMmHgSecPerMl ** 2
      + 4 * bernoulliMmHgSec2PerMl2 * magnitude,
  );
  return Math.sign(gradientMmHg)
    * 2 * magnitude / (resistanceMmHgSecPerMl + discriminant);
}

function numericLeavesFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(numericLeavesFinite);
  if (value !== null && typeof value === "object") {
    return Object.values(value).every(numericLeavesFinite);
  }
  return true;
}
