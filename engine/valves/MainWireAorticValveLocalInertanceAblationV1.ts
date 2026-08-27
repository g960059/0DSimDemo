import {
  evaluateMainWireValveOpeningTargetAndTangentV2,
  idealBernoulliLossFromEffectiveOrificeAreaV2,
  solveExactSignedLinearQuadraticValveFlowV2,
  validateMainWireQuasiSteadyOrificeValveParamsV2,
  type MainWireQuasiSteadyOrificeValveEvaluationV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_ABLATION_V1_ID =
  "main-wire-aortic-valve-local-inertance-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1 =
  Object.freeze({
    profileId: "historical-topology-local-inertance" as const,
    valveId: "AoV" as const,
    inertanceSource: "AoV-topology-L" as const,
    parameterSearchOrFitting: false as const,
  });

export type MainWireAorticValveLocalInertanceProfileV1 =
  typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1;

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_ABLATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-profile-source-research-ablation" as const,
    valve: "AoV" as const,
    acceptedFlowStateOwner:
      "research-runner-external-atomic-promotion" as const,
    timeDiscretization: "backward-Euler" as const,
    pressureFlowLaw:
      "topology-L-plus-current-linear-and-EOA-derived-quadratic-loss" as const,
    competentValveConstraint:
      "semismooth-q-greater-than-or-equal-to-zero" as const,
    openingStateOwnerChanged: false as const,
    rootInertanceOwnerChanged: false as const,
    canonicalAcceptedStateOrCheckpointChanged: false as const,
    pressureRecoveryApplied: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

type SharedValveEvaluationV2 = Omit<
  MainWireQuasiSteadyOrificeValveEvaluationV2,
  | "modelId"
  | "claim"
  | "tangentBranch"
  | "openOrificeResidualMmHg"
  | "powerBalanceResidualMmHgMlPerSec"
>;

export type MainWireAorticValveLocalInertanceEvaluationV1 =
  SharedValveEvaluationV2 & Readonly<{
    modelId: typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_ABLATION_V1_ID;
    researchProfileId:
      typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1.profileId;
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
    /** Delta-p minus inertia and signed dissipative pressure. */
    openOrificeResidualMmHg: number;
    /** Includes kinetic storage and BE numerical dissipation. */
    powerBalanceResidualMmHgMlPerSec: number;
    claim: typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_ABLATION_CLAIM_V1;
  }>;

export function validateMainWireAorticValveLocalInertanceProfileV1(
  value: MainWireAorticValveLocalInertanceProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze(["AoV local-inertance profile must be an object"]);
  }
  const expected = MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1;
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(expectedKeys) !== JSON.stringify(actualKeys)) {
    issues.push(
      "AoV local-inertance profile fields differ from the fixed profile",
    );
  }
  for (const key of expectedKeys) {
    if (
      value[key as keyof MainWireAorticValveLocalInertanceProfileV1]
      !== expected[key as keyof MainWireAorticValveLocalInertanceProfileV1]
    ) {
      issues.push(
        `AoV local-inertance profile ${key} differs from its fixed value`,
      );
    }
  }
  return Object.freeze(issues);
}

export function stepMainWireAorticValveLocalInertanceScalarsV1(
  previousLeafletOpeningFraction01: number,
  previousAcceptedFlowMlPerSec: number,
  dtSec: number,
  upstreamPressureMmHg: number,
  downstreamPressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  localInertanceMmHgSec2PerMl: number,
  profile: MainWireAorticValveLocalInertanceProfileV1,
): MainWireAorticValveLocalInertanceEvaluationV1 {
  const issues = [
    ...validateMainWireQuasiSteadyOrificeValveParamsV2(params),
    ...validateMainWireAorticValveLocalInertanceProfileV1(profile),
  ];
  if (params.valveId !== "AoV") issues.push("local inertance requires AoV params");
  if (params.closedReverseEroaCm2 !== 0) {
    issues.push("local inertance research requires a competent AoV");
  }
  if (
    !Number.isFinite(previousLeafletOpeningFraction01)
    || previousLeafletOpeningFraction01 < 0
    || previousLeafletOpeningFraction01 > 1
  ) issues.push("previous AoV opening must be finite in [0, 1]");
  if (
    !(previousAcceptedFlowMlPerSec >= 0)
    || !Number.isFinite(previousAcceptedFlowMlPerSec)
  ) {
    issues.push("previous AoV flow must be finite and nonnegative");
  }
  if (!(dtSec > 0) || !Number.isFinite(dtSec)) {
    issues.push("AoV local-inertance dt must be positive and finite");
  }
  if (
    !Number.isFinite(upstreamPressureMmHg)
    || !Number.isFinite(downstreamPressureMmHg)
  ) {
    issues.push("AoV local-inertance pressures must be finite");
  }
  if (
    !(localInertanceMmHgSec2PerMl > 0)
    || !Number.isFinite(localInertanceMmHgSec2PerMl)
  ) {
    issues.push("AoV local inertance must be positive and finite");
  }
  if (issues.length > 0) {
    throw new Error(`invalid AoV local-inertance step: ${issues.join("; ")}`);
  }

  const pressureGradientMmHg = upstreamPressureMmHg - downstreamPressureMmHg;
  const targetAndTangent = evaluateMainWireValveOpeningTargetAndTangentV2(
    pressureGradientMmHg,
    params,
  );
  const openingTarget01 = targetAndTangent.openingTarget01;
  const tau = openingTarget01 > previousLeafletOpeningFraction01
    ? params.openingTimeConstantSec
    : params.closingTimeConstantSec;
  const ratio = dtSec / tau;
  const unclampedOpening01 = (
    previousLeafletOpeningFraction01 + ratio * openingTarget01
  ) / (1 + ratio);
  const opening01 = clamp(unclampedOpening01, 0, 1);
  const dOpeningDGradient = unclampedOpening01 <= 0 || unclampedOpening01 >= 1
    ? 0
    : dtSec / (tau + dtSec)
      * targetAndTangent.dOpeningTargetDPressureGradientPerMmHg;
  const forwardActiveEoaCm2 = opening01 * params.maximumForwardEoaCm2;
  const openingEquationResidual01 = opening01
    - previousLeafletOpeningFraction01
    - dtSec * (openingTarget01 - opening01) / tau;
  const resistance = forwardActiveEoaCm2 === 0
    ? 0
    : params.backgroundLinearResistanceMmHgSecPerMl;
  const bernoulli = forwardActiveEoaCm2 === 0
    ? 0
    : idealBernoulliLossFromEffectiveOrificeAreaV2(forwardActiveEoaCm2);
  const effectiveGradient = pressureGradientMmHg
    + localInertanceMmHgSec2PerMl * previousAcceptedFlowMlPerSec / dtSec;
  const effectiveResistance = resistance
    + localInertanceMmHgSec2PerMl / dtSec;
  const rawMomentumRootMlPerSec = forwardActiveEoaCm2 === 0
    ? 0
    : solveExactSignedLinearQuadraticValveFlowV2(
      effectiveGradient,
      effectiveResistance,
      bernoulli,
    );
  const flowMlPerSec = Math.max(0, rawMomentumRootMlPerSec);
  const constrained = flowMlPerSec !== rawMomentumRootMlPerSec
    || forwardActiveEoaCm2 === 0;
  const activeDirection = flowMlPerSec > 0 || pressureGradientMmHg > 0
    ? "forward" as const
    : pressureGradientMmHg < 0
      ? "reverse" as const
      : "zero-gradient" as const;
  const activeEoaCm2 = flowMlPerSec > 0 || pressureGradientMmHg >= 0
    ? forwardActiveEoaCm2
    : 0;
  const dAreaDGradient = params.maximumForwardEoaCm2 * dOpeningDGradient;
  const dBernoulliDGradient = forwardActiveEoaCm2 === 0
    ? 0
    : -2 * bernoulli * dAreaDGradient / forwardActiveEoaCm2;
  const tangentDenominator = effectiveResistance
    + 2 * bernoulli * Math.abs(flowMlPerSec);
  const dFlowDGradient = constrained || !(tangentDenominator > 0)
    ? 0
    : (1 - flowMlPerSec * Math.abs(flowMlPerSec)
      * dBernoulliDGradient) / tangentDenominator;
  const inertialPressureMmHg = localInertanceMmHgSec2PerMl
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
  const kineticEnergyChangeRateMmHgMlPerSec =
    0.5 * localInertanceMmHgSec2PerMl
    * (flowMlPerSec ** 2 - previousAcceptedFlowMlPerSec ** 2) / dtSec;
  const backwardEulerNumericalDissipationMmHgMlPerSec =
    0.5 * localInertanceMmHgSec2PerMl
    * (flowMlPerSec - previousAcceptedFlowMlPerSec) ** 2 / dtSec;
  const hydraulicPowerInputMmHgMlPerSec = pressureGradientMmHg * flowMlPerSec;
  const dissipativePowerMmHgMlPerSec = dissipativePressureMmHg * flowMlPerSec;
  const hydraulicSupportPowerMmHgMlPerSec =
    signedHydraulicSupportReactionMmHg * flowMlPerSec;
  const powerBalanceResidualMmHgMlPerSec =
    hydraulicPowerInputMmHgMlPerSec - dissipativePowerMmHgMlPerSec
    - kineticEnergyChangeRateMmHgMlPerSec
    - backwardEulerNumericalDissipationMmHgMlPerSec
    + hydraulicSupportPowerMmHgMlPerSec;
  const evaluation = Object.freeze({
    modelId: MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_ABLATION_V1_ID,
    researchProfileId: profile.profileId,
    state: Object.freeze({ leafletOpeningFraction01: opening01 }),
    flowMlPerSec,
    pressureGradientMmHg,
    activeDirection,
    openingTarget01,
    openingEquationResidual01,
    forwardActiveEoaCm2,
    reverseActiveEoaCm2: 0,
    activeEoaCm2,
    dLeafletOpeningFractionDPressureGradientPerMmHg: dOpeningDGradient,
    dFlowDPressureGradientMlPerSecPerMmHg: dFlowDGradient,
    tangentMode: "backward-euler-opening-state-eliminated" as const,
    tangentBranch: constrained
      ? "unilateral-flow-contact" as const
      : "forward-inertial-open-orifice" as const,
    resistanceMmHgSecPerMl: resistance,
    bernoulliMmHgSec2PerMl2: bernoulli,
    dissipativePressureMmHg,
    openOrificeResidualMmHg,
    competentReverseClosureReactionMmHg:
      competentReverseClosureActive ? signedHydraulicSupportReactionMmHg : 0,
    subthresholdForwardSupportReactionMmHg: subthresholdForwardSupportActive
      ? -signedHydraulicSupportReactionMmHg
      : 0,
    signedHydraulicSupportReactionMmHg,
    hydraulicBalanceResidualMmHg:
      openOrificeResidualMmHg + signedHydraulicSupportReactionMmHg,
    hydraulicPowerInputMmHgMlPerSec,
    dissipativePowerMmHgMlPerSec,
    hydraulicSupportPowerMmHgMlPerSec,
    powerBalanceResidualMmHgMlPerSec,
    competentReverseClosureActive,
    subthresholdForwardSupportActive,
    leafletMechanicalContactModeled: false as const,
    reverseRegurgitantFlowEnabled: false,
    valid: true,
    finite: true,
    issues: Object.freeze([]),
    localInertanceMmHgSec2PerMl,
    previousAcceptedFlowMlPerSec,
    rawMomentumRootMlPerSec,
    closureProjectionDeltaMlPerSec:
      flowMlPerSec - rawMomentumRootMlPerSec,
    inertialPressureMmHg,
    kineticEnergyChangeRateMmHgMlPerSec,
    backwardEulerNumericalDissipationMmHgMlPerSec,
    claim: MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_ABLATION_CLAIM_V1,
  } satisfies MainWireAorticValveLocalInertanceEvaluationV1);
  if (!numericReadbackIsFinite(evaluation)) {
    throw new Error("AoV local-inertance evaluation produced non-finite readback");
  }
  return evaluation;
}

function numericReadbackIsFinite(
  value: MainWireAorticValveLocalInertanceEvaluationV1,
): boolean {
  return Object.values(value).every((entry) =>
    typeof entry !== "number" || Number.isFinite(entry));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
