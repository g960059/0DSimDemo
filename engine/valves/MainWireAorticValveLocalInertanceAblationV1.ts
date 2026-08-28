import {
  evaluateMainWireValveOpeningTargetAndTangentV2,
  idealBernoulliLossFromEffectiveOrificeAreaV2,
  solveExactSignedLinearQuadraticValveFlowV2,
  validateMainWireQuasiSteadyOrificeValveParamsV2,
  type MainWireQuasiSteadyOrificeValveEvaluationV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import {
  evaluateMainWireAorticValveForwardConvectiveCoefficientsV1,
  validateMainWireAorticValveResearchProfileV1,
  type MainWireAorticValveResearchProfileIdV1,
  type MainWireAorticValveResearchProfileV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_ABLATION_V1_ID =
  "main-wire-aortic-valve-local-inertance-ablation-v1" as const;

const BLOOD_DENSITY_KG_PER_M3 = 1_060;
const FIXED_LVOT_DIAMETER_CM = 2.3;
const FIXED_LVOT_AREA_CM2 = Math.PI * (FIXED_LVOT_DIAMETER_CM / 2) ** 2;
const HIGH_EFFECTIVE_COLUMN_LENGTH_CM = 7;
const PASCAL_PER_MMHG = 133.32236842105263;
const HIGH_PHYSICAL_LOCAL_INERTANCE_MMHG_SEC2_PER_ML =
  BLOOD_DENSITY_KG_PER_M3
  * (HIGH_EFFECTIVE_COLUMN_LENGTH_CM / 100)
  / (FIXED_LVOT_AREA_CM2 / 10_000)
  * 1e-6
  / PASCAL_PER_MMHG;

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_IDS_V1 =
  Object.freeze([
    "historical-topology-local-inertance",
    "fixed-lvot-d2p3cm-column-l7cm-local-inertance",
  ] as const);

export type MainWireAorticValveLocalInertanceProfileIdV1 =
  (typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_IDS_V1)[number];

export type MainWireAorticValveLocalInertanceProfileV1 = Readonly<{
  profileId: MainWireAorticValveLocalInertanceProfileIdV1;
  valveId: "AoV";
  inertanceSource: "AoV-topology-L" | "rho-length-over-fixed-LVOT-area";
  /** Null means that the exact graph-owned AoV topology value is used. */
  fixedLocalInertanceMmHgSec2PerMl: number | null;
  bloodDensityKgPerM3: number | null;
  effectiveColumnLengthCm: number | null;
  fixedFlowAreaDiameterCm: number | null;
  fixedFlowAreaCm2: number | null;
  parameterSearchOrFitting: false;
}>;

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILES_V1 =
  Object.freeze({
    "historical-topology-local-inertance": Object.freeze({
      profileId: "historical-topology-local-inertance" as const,
      valveId: "AoV" as const,
      inertanceSource: "AoV-topology-L" as const,
      fixedLocalInertanceMmHgSec2PerMl: null,
      bloodDensityKgPerM3: null,
      effectiveColumnLengthCm: null,
      fixedFlowAreaDiameterCm: null,
      fixedFlowAreaCm2: null,
      parameterSearchOrFitting: false as const,
    }),
    "fixed-lvot-d2p3cm-column-l7cm-local-inertance": Object.freeze({
      profileId:
        "fixed-lvot-d2p3cm-column-l7cm-local-inertance" as const,
      valveId: "AoV" as const,
      inertanceSource: "rho-length-over-fixed-LVOT-area" as const,
      fixedLocalInertanceMmHgSec2PerMl:
        HIGH_PHYSICAL_LOCAL_INERTANCE_MMHG_SEC2_PER_ML,
      bloodDensityKgPerM3: BLOOD_DENSITY_KG_PER_M3,
      effectiveColumnLengthCm: HIGH_EFFECTIVE_COLUMN_LENGTH_CM,
      fixedFlowAreaDiameterCm: FIXED_LVOT_DIAMETER_CM,
      fixedFlowAreaCm2: FIXED_LVOT_AREA_CM2,
      parameterSearchOrFitting: false as const,
    }),
  } satisfies Readonly<Record<
    MainWireAorticValveLocalInertanceProfileIdV1,
    MainWireAorticValveLocalInertanceProfileV1
  >>);

/** Backward-compatible name for the historical coupled retest. */
export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1 =
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILES_V1[
    "historical-topology-local-inertance"
  ];

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_ABLATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-profile-source-research-ablation" as const,
    valve: "AoV" as const,
    acceptedFlowStateOwner:
      "research-runner-external-atomic-promotion" as const,
    timeDiscretization: "backward-Euler" as const,
    pressureFlowLaw:
      "fixed-local-L-plus-linear-and-station-explicit-convective-pressure" as const,
    competentValveConstraint:
      "semismooth-q-greater-than-or-equal-to-zero" as const,
    openingStateOwnerChanged: false as const,
    rootInertanceOwnerChanged: false as const,
    canonicalAcceptedStateOrCheckpointChanged: false as const,
    pressureRecoveryAddsState: false as const,
    pressureRecoveryMayBeCombinedBySeparateFixedProfile: true as const,
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
      MainWireAorticValveLocalInertanceProfileIdV1;
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
    pressureRecoveryResearchProfileId:
      MainWireAorticValveResearchProfileIdV1 | null;
    pressureRecoveryApplied: boolean;
    ascendingAorticAreaCm2: number | null;
    energyLossCoefficientAreaCm2: number;
    portConvectivePressureMmHgSec2PerMl2: number;
    downstreamKineticPressureMmHg: number;
    downstreamKineticPowerMmHgMlPerSec: number;
    netStaticConvectivePressureMmHg: number;
    venaContractaBernoulliMmHgSec2PerMl2: number;
    venaContractaBernoulliPressureMmHg: number;
    netIrreversibleBernoulliPressureMmHg: number;
    recoveredStaticPressureMmHg: number;
    pressureRecoveryFraction01: number;
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
  const expected = MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILES_V1[
    value.profileId
  ];
  const issues: string[] = [];
  if (expected === undefined) {
    return Object.freeze(["AoV local-inertance profileId is unsupported"]);
  }
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

export function resolveMainWireAorticValveLocalInertanceProfileV1(
  profileId: MainWireAorticValveLocalInertanceProfileIdV1,
): MainWireAorticValveLocalInertanceProfileV1 {
  const profile = MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILES_V1[profileId];
  if (profile === undefined) {
    throw new Error(`unsupported AoV local-inertance profile: ${String(profileId)}`);
  }
  return profile;
}

export function resolveMainWireAorticValveLocalInertanceValueV1(
  profile: MainWireAorticValveLocalInertanceProfileV1,
  topologyLocalInertanceMmHgSec2PerMl: number,
): number {
  const issues = validateMainWireAorticValveLocalInertanceProfileV1(profile);
  if (issues.length > 0) {
    throw new Error(`invalid AoV local-inertance profile: ${issues.join("; ")}`);
  }
  if (
    !(topologyLocalInertanceMmHgSec2PerMl > 0)
    || !Number.isFinite(topologyLocalInertanceMmHgSec2PerMl)
  ) {
    throw new Error("AoV topology local inertance must be positive and finite");
  }
  return profile.fixedLocalInertanceMmHgSec2PerMl
    ?? topologyLocalInertanceMmHgSec2PerMl;
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
  pressureRecoveryProfile?: MainWireAorticValveResearchProfileV1,
): MainWireAorticValveLocalInertanceEvaluationV1 {
  const issues = [
    ...validateMainWireQuasiSteadyOrificeValveParamsV2(params),
    ...validateMainWireAorticValveLocalInertanceProfileV1(profile),
    ...(pressureRecoveryProfile === undefined
      ? []
      : validateMainWireAorticValveResearchProfileV1(pressureRecoveryProfile)),
  ];
  if (params.valveId !== "AoV") issues.push("local inertance requires AoV params");
  if (params.closedReverseEroaCm2 !== 0) {
    issues.push("local inertance research requires a competent AoV");
  }
  if (
    pressureRecoveryProfile !== undefined
    && (
      pressureRecoveryProfile.openingMode
        !== "bounded-backward-euler-memory"
      || pressureRecoveryProfile.forwardConvectivePressureMode
        !== "garcia-energy-loss-plus-downstream-kinetic-flux"
    )
  ) {
    issues.push(
      "local inertance combines only with bounded-memory Garcia pressure recovery",
    );
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
  const venaContractaBernoulli = forwardActiveEoaCm2 === 0
    ? 0
    : idealBernoulliLossFromEffectiveOrificeAreaV2(forwardActiveEoaCm2);
  const convective = pressureRecoveryProfile === undefined
    ? Object.freeze({
      pressureRecoveryApplied: false,
      ascendingAorticAreaCm2: null,
      energyLossCoefficientAreaCm2: forwardActiveEoaCm2,
      venaContractaBernoulliMmHgSec2PerMl2: venaContractaBernoulli,
      irreversibleBernoulliMmHgSec2PerMl2: venaContractaBernoulli,
      downstreamKineticMmHgSec2PerMl2: 0,
      portConvectivePressureMmHgSec2PerMl2: venaContractaBernoulli,
      pressureRecoveryFraction01: 0,
    })
    : evaluateMainWireAorticValveForwardConvectiveCoefficientsV1(
      forwardActiveEoaCm2,
      pressureRecoveryProfile,
      true,
    );
  const bernoulli = convective.irreversibleBernoulliMmHgSec2PerMl2;
  const portConvective = convective.portConvectivePressureMmHgSec2PerMl2;
  const effectiveGradient = pressureGradientMmHg
    + localInertanceMmHgSec2PerMl * previousAcceptedFlowMlPerSec / dtSec;
  const effectiveResistance = resistance
    + localInertanceMmHgSec2PerMl / dtSec;
  const rawMomentumRootMlPerSec = forwardActiveEoaCm2 === 0
    ? 0
    : solveExactSignedLinearQuadraticValveFlowV2(
      effectiveGradient,
      effectiveResistance,
      portConvective,
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
  const dPortConvectiveDGradient = forwardActiveEoaCm2 === 0
    ? 0
    : convective.pressureRecoveryApplied
      ? -2 * bernoulli * convective.ascendingAorticAreaCm2!
        * dAreaDGradient
        / (
          forwardActiveEoaCm2
          * (convective.ascendingAorticAreaCm2! - forwardActiveEoaCm2)
        )
      : -2 * portConvective * dAreaDGradient / forwardActiveEoaCm2;
  const tangentDenominator = effectiveResistance
    + 2 * portConvective * Math.abs(flowMlPerSec);
  const dFlowDGradient = constrained || !(tangentDenominator > 0)
    ? 0
    : (1 - flowMlPerSec * Math.abs(flowMlPerSec)
      * dPortConvectiveDGradient) / tangentDenominator;
  const inertialPressureMmHg = localInertanceMmHgSec2PerMl
    * (flowMlPerSec - previousAcceptedFlowMlPerSec) / dtSec;
  const signedQuadraticFlow = flowMlPerSec * Math.abs(flowMlPerSec);
  const netIrreversibleBernoulliPressureMmHg =
    bernoulli * signedQuadraticFlow;
  const downstreamKineticPressureMmHg =
    convective.downstreamKineticMmHgSec2PerMl2 * signedQuadraticFlow;
  const netStaticConvectivePressureMmHg =
    portConvective * signedQuadraticFlow;
  const dissipativePressureMmHg = resistance * flowMlPerSec
    + netIrreversibleBernoulliPressureMmHg;
  const venaContractaBernoulliPressureMmHg =
    convective.venaContractaBernoulliMmHgSec2PerMl2 * signedQuadraticFlow;
  const recoveredStaticPressureMmHg = convective.pressureRecoveryApplied
    ? venaContractaBernoulliPressureMmHg - netStaticConvectivePressureMmHg
    : 0;
  const openOrificeResidualMmHg = pressureGradientMmHg
    - inertialPressureMmHg - dissipativePressureMmHg
    - downstreamKineticPressureMmHg;
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
  const downstreamKineticPowerMmHgMlPerSec =
    downstreamKineticPressureMmHg * flowMlPerSec;
  const hydraulicSupportPowerMmHgMlPerSec =
    signedHydraulicSupportReactionMmHg * flowMlPerSec;
  const powerBalanceResidualMmHgMlPerSec =
    hydraulicPowerInputMmHgMlPerSec - dissipativePowerMmHgMlPerSec
    - downstreamKineticPowerMmHgMlPerSec
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
    pressureRecoveryResearchProfileId:
      pressureRecoveryProfile?.profileId ?? null,
    pressureRecoveryApplied: convective.pressureRecoveryApplied,
    ascendingAorticAreaCm2: convective.ascendingAorticAreaCm2,
    energyLossCoefficientAreaCm2:
      convective.energyLossCoefficientAreaCm2,
    portConvectivePressureMmHgSec2PerMl2: portConvective,
    downstreamKineticPressureMmHg,
    downstreamKineticPowerMmHgMlPerSec,
    netStaticConvectivePressureMmHg,
    venaContractaBernoulliMmHgSec2PerMl2:
      convective.venaContractaBernoulliMmHgSec2PerMl2,
    venaContractaBernoulliPressureMmHg,
    netIrreversibleBernoulliPressureMmHg,
    recoveredStaticPressureMmHg,
    pressureRecoveryFraction01: convective.pressureRecoveryFraction01,
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
