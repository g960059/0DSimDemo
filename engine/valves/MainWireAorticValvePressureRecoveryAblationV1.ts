import {
  evaluateMainWireValveOpeningTargetAndTangentV2,
  idealBernoulliLossFromEffectiveOrificeAreaV2,
  solveExactSignedLinearQuadraticValveFlowV2,
  validateMainWireQuasiSteadyOrificeValveParamsV2,
  type MainWireQuasiSteadyOrificeValveDirectionV2,
  type MainWireQuasiSteadyOrificeValveEvaluationV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
  type MainWireQuasiSteadyOrificeValveTangentBranchV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_ABLATION_V1_ID =
  "main-wire-aortic-valve-pressure-recovery-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILE_IDS_V1 = Object.freeze([
  "pressure-recovery-aa-d3p0cm",
  "instantaneous-opening",
  "pressure-recovery-aa-d3p0cm-instantaneous-opening",
  "pressure-recovery-aa-d2p5cm",
  "pressure-recovery-aa-d3p8cm",
] as const);

export type MainWireAorticValveResearchProfileIdV1 =
  (typeof MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILE_IDS_V1)[number];

/**
 * Closed arm catalog for the original d3p0 pressure-recovery/opening
 * ablation. Geometry stress profiles belong to the separate geometry
 * sentinel and must not silently expand this V1 experiment.
 */
export const MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_OPENING_ABLATION_PROFILE_IDS_V1 =
  Object.freeze([
    "pressure-recovery-aa-d3p0cm",
    "instantaneous-opening",
    "pressure-recovery-aa-d3p0cm-instantaneous-opening",
  ] as const satisfies readonly MainWireAorticValveResearchProfileIdV1[]);

export type MainWireAorticValveOpeningModeV1 =
  | "bounded-backward-euler-memory"
  | "instantaneous-pressure-target";

export type MainWireAorticValveForwardConvectivePressureModeV1 =
  | "full-vena-contracta-drop"
  | "garcia-energy-loss-plus-downstream-kinetic-flux";

export type MainWireAorticValveResearchProfileV1 = Readonly<{
  profileId: MainWireAorticValveResearchProfileIdV1;
  valveId: "AoV";
  openingMode: MainWireAorticValveOpeningModeV1;
  forwardConvectivePressureMode:
    MainWireAorticValveForwardConvectivePressureModeV1;
  /** Fixed geometry at the pressure-recovery station; null when disabled. */
  ascendingAorticDiameterCm: number | null;
  /** Derived once from the fixed diameter, never a fitted hydraulic area. */
  ascendingAorticAreaCm2: number | null;
  parameterSearchOrFitting: false;
}>;

const ASCENDING_AORTIC_DIAMETER_CM = 3;
const ASCENDING_AORTIC_AREA_CM2 =
  Math.PI * (ASCENDING_AORTIC_DIAMETER_CM / 2) ** 2;

function profile(
  profileId: MainWireAorticValveResearchProfileIdV1,
  openingMode: MainWireAorticValveOpeningModeV1,
  forwardConvectivePressureMode:
    MainWireAorticValveForwardConvectivePressureModeV1,
  ascendingAorticDiameterCm = ASCENDING_AORTIC_DIAMETER_CM,
): MainWireAorticValveResearchProfileV1 {
  const pressureRecoveryEnabled =
    forwardConvectivePressureMode
      === "garcia-energy-loss-plus-downstream-kinetic-flux";
  return Object.freeze({
    profileId,
    valveId: "AoV" as const,
    openingMode,
    forwardConvectivePressureMode,
    ascendingAorticDiameterCm: pressureRecoveryEnabled
      ? ascendingAorticDiameterCm
      : null,
    ascendingAorticAreaCm2: pressureRecoveryEnabled
      ? ascendingAorticDiameterCm === ASCENDING_AORTIC_DIAMETER_CM
        ? ASCENDING_AORTIC_AREA_CM2
        : Math.PI * (ascendingAorticDiameterCm / 2) ** 2
      : null,
    parameterSearchOrFitting: false as const,
  });
}

export const MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILES_V1 = Object.freeze({
  "pressure-recovery-aa-d3p0cm": profile(
    "pressure-recovery-aa-d3p0cm",
    "bounded-backward-euler-memory",
    "garcia-energy-loss-plus-downstream-kinetic-flux",
  ),
  "instantaneous-opening": profile(
    "instantaneous-opening",
    "instantaneous-pressure-target",
    "full-vena-contracta-drop",
  ),
  "pressure-recovery-aa-d3p0cm-instantaneous-opening": profile(
    "pressure-recovery-aa-d3p0cm-instantaneous-opening",
    "instantaneous-pressure-target",
    "garcia-energy-loss-plus-downstream-kinetic-flux",
  ),
  "pressure-recovery-aa-d2p5cm": profile(
    "pressure-recovery-aa-d2p5cm",
    "bounded-backward-euler-memory",
    "garcia-energy-loss-plus-downstream-kinetic-flux",
    2.5,
  ),
  "pressure-recovery-aa-d3p8cm": profile(
    "pressure-recovery-aa-d3p8cm",
    "bounded-backward-euler-memory",
    "garcia-energy-loss-plus-downstream-kinetic-flux",
    3.8,
  ),
} satisfies Readonly<Record<
  MainWireAorticValveResearchProfileIdV1,
  MainWireAorticValveResearchProfileV1
>>);

export const MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_ABLATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-profile-source-research-ablation" as const,
    valve: "AoV" as const,
    flowMemory: false as const,
    localValveInertance: false as const,
    rootInertanceOwnerChanged: false as const,
    pressureRecoveryAddsState: false as const,
    pressureRecoveryLaw:
      "ELCo-irreversible-loss-plus-fixed-AA-outflow-kinetic-flux" as const,
    pressureStationSemantics:
      "Ao-node-is-recovered-root-static-pressure-vena-contracta-is-readback" as const,
    upstreamKineticFlux:
      "LV-chamber-control-volume-velocity-neglected" as const,
    downstreamKineticFlux:
      "fixed-ascending-aortic-area-carried-through-port-ledger" as const,
    reverseFlowPressureRecoveryApplied: false as const,
    instantaneousOpeningAcceptedSlotSemantics:
      "compatible-algebraic-readback-previous-value-not-consumed" as const,
    ascendingAorticGeometry:
      "fixed-three-centimeter-diameter-research-point" as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export const MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_GEOMETRY_CLAIM_V1 =
  Object.freeze({
    ...MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_ABLATION_CLAIM_V1,
    ascendingAorticGeometry:
      "fixed-profile-catalog-diameters-2p5-3p0-3p8cm" as const,
  });

type MainWireAorticValvePressureRecoveryClaimV1 =
  | typeof MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_ABLATION_CLAIM_V1
  | typeof MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_GEOMETRY_CLAIM_V1;

type SharedValveEvaluationV2 = Omit<
  MainWireQuasiSteadyOrificeValveEvaluationV2,
  | "modelId"
  | "claim"
  | "tangentMode"
  | "openOrificeResidualMmHg"
  | "powerBalanceResidualMmHgMlPerSec"
>;

export type MainWireAorticValvePressureRecoveryAblationEvaluationV1 =
  SharedValveEvaluationV2 & Readonly<{
    modelId: typeof MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_ABLATION_V1_ID;
    researchProfileId: MainWireAorticValveResearchProfileIdV1;
    openingMode: MainWireAorticValveOpeningModeV1;
    openingMemoryUsed: boolean;
    tangentMode:
      | "backward-euler-opening-state-eliminated"
      | "instantaneous-opening-constraint-eliminated"
      | "invalid";
    /** Delta-p minus irreversible loss, linear loss, and downstream kinetic flux. */
    openOrificeResidualMmHg: number;
    /** Static pressure work minus dissipation and downstream kinetic-energy flux. */
    powerBalanceResidualMmHgMlPerSec: number;
    forwardConvectivePressureMode:
      MainWireAorticValveForwardConvectivePressureModeV1;
    ascendingAorticAreaCm2: number | null;
    energyLossCoefficientAreaCm2: number;
    /** Irreversible ELCo loss coefficient plus downstream kinetic flux. */
    portConvectivePressureMmHgSec2PerMl2: number;
    /** Kinetic-energy flux carried through the fixed ascending-aortic station. */
    downstreamKineticPressureMmHg: number;
    downstreamKineticPowerMmHgMlPerSec: number;
    netStaticConvectivePressureMmHg: number;
    venaContractaBernoulliMmHgSec2PerMl2: number;
    venaContractaBernoulliPressureMmHg: number;
    netIrreversibleBernoulliPressureMmHg: number;
    recoveredStaticPressureMmHg: number;
    pressureRecoveryFraction01: number;
    claim: MainWireAorticValvePressureRecoveryClaimV1;
  }>;

export type MainWireValveEvaluationWithAorticResearchV1 =
  | MainWireQuasiSteadyOrificeValveEvaluationV2
  | MainWireAorticValvePressureRecoveryAblationEvaluationV1;

export function resolveMainWireAorticValveResearchProfileV1(
  profileId: MainWireAorticValveResearchProfileIdV1,
): MainWireAorticValveResearchProfileV1 {
  const resolved = MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILES_V1[profileId];
  if (resolved === undefined) {
    throw new Error(`unsupported aortic-valve research profile: ${String(profileId)}`);
  }
  return resolved;
}

export function validateMainWireAorticValveResearchProfileV1(
  value: MainWireAorticValveResearchProfileV1,
): readonly string[] {
  const issues: string[] = [];
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) return Object.freeze(["aortic-valve research profile must be an object"]);
  const expected = MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILES_V1[
    value.profileId
  ];
  if (expected === undefined) {
    return Object.freeze(["aortic-valve research profileId is unsupported"]);
  }
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push("aortic-valve research profile fields differ from the fixed profile");
  }
  for (const key of expectedKeys) {
    if (
      value[key as keyof MainWireAorticValveResearchProfileV1]
      !== expected[key as keyof MainWireAorticValveResearchProfileV1]
    ) {
      issues.push(`aortic-valve research profile ${key} differs from its fixed value`);
    }
  }
  return Object.freeze(issues);
}

export type MainWireAorticValveForwardConvectiveCoefficientsV1 = Readonly<{
  pressureRecoveryApplied: boolean;
  ascendingAorticAreaCm2: number | null;
  energyLossCoefficientAreaCm2: number;
  venaContractaBernoulliMmHgSec2PerMl2: number;
  irreversibleBernoulliMmHgSec2PerMl2: number;
  downstreamKineticMmHgSec2PerMl2: number;
  portConvectivePressureMmHgSec2PerMl2: number;
  pressureRecoveryFraction01: number;
}>;

/**
 * Shared algebraic coefficient map for pressure-recovery-only and
 * local-inertance-plus-pressure-recovery research arms. It owns no state and
 * does not solve flow.
 */
export function evaluateMainWireAorticValveForwardConvectiveCoefficientsV1(
  activeEoaCm2: number,
  researchProfile: MainWireAorticValveResearchProfileV1,
  favorableFlow: boolean,
): MainWireAorticValveForwardConvectiveCoefficientsV1 {
  const issues = [
    ...validateMainWireAorticValveResearchProfileV1(researchProfile),
  ];
  if (!(activeEoaCm2 >= 0) || !Number.isFinite(activeEoaCm2)) {
    issues.push("active AoV EOA must be finite and nonnegative");
  }
  const pressureRecoveryApplied = activeEoaCm2 > 0
    && favorableFlow
    && researchProfile.forwardConvectivePressureMode
      === "garcia-energy-loss-plus-downstream-kinetic-flux";
  const ascendingAorticAreaCm2 = researchProfile.ascendingAorticAreaCm2;
  if (
    pressureRecoveryApplied
    && (
      ascendingAorticAreaCm2 === null
      || !(ascendingAorticAreaCm2 > activeEoaCm2)
      || !Number.isFinite(ascendingAorticAreaCm2)
    )
  ) {
    issues.push(
      "pressure recovery requires fixed ascending-aortic area greater than active EOA",
    );
  }
  if (issues.length > 0) {
    throw new Error(`invalid AoV convective coefficient map: ${issues.join("; ")}`);
  }
  if (activeEoaCm2 === 0) {
    return Object.freeze({
      pressureRecoveryApplied: false,
      ascendingAorticAreaCm2,
      energyLossCoefficientAreaCm2: 0,
      venaContractaBernoulliMmHgSec2PerMl2: 0,
      irreversibleBernoulliMmHgSec2PerMl2: 0,
      downstreamKineticMmHgSec2PerMl2: 0,
      portConvectivePressureMmHgSec2PerMl2: 0,
      pressureRecoveryFraction01: 0,
    });
  }
  const venaContractaBernoulliMmHgSec2PerMl2 =
    idealBernoulliLossFromEffectiveOrificeAreaV2(activeEoaCm2);
  const energyLossCoefficientAreaCm2 = pressureRecoveryApplied
    ? activeEoaCm2 * ascendingAorticAreaCm2!
      / (ascendingAorticAreaCm2! - activeEoaCm2)
    : activeEoaCm2;
  const irreversibleBernoulliMmHgSec2PerMl2 =
    idealBernoulliLossFromEffectiveOrificeAreaV2(
      energyLossCoefficientAreaCm2,
    );
  const downstreamKineticMmHgSec2PerMl2 = pressureRecoveryApplied
    ? idealBernoulliLossFromEffectiveOrificeAreaV2(ascendingAorticAreaCm2!)
    : 0;
  const portConvectivePressureMmHgSec2PerMl2 =
    irreversibleBernoulliMmHgSec2PerMl2
    + downstreamKineticMmHgSec2PerMl2;
  return Object.freeze({
    pressureRecoveryApplied,
    ascendingAorticAreaCm2,
    energyLossCoefficientAreaCm2,
    venaContractaBernoulliMmHgSec2PerMl2,
    irreversibleBernoulliMmHgSec2PerMl2,
    downstreamKineticMmHgSec2PerMl2,
    portConvectivePressureMmHgSec2PerMl2,
    pressureRecoveryFraction01: pressureRecoveryApplied
      ? 1 - portConvectivePressureMmHgSec2PerMl2
        / venaContractaBernoulliMmHgSec2PerMl2
      : 0,
  });
}

/**
 * Fixed-profile AoV research port. It changes neither flow-state topology nor
 * root inertance ownership. For favorable flow, the chamber-to-static-root
 * pressure port is the Garcia ELCo irreversible loss plus the kinetic-energy
 * flux at the fixed ascending-aortic station. Reverse EROA retains the
 * canonical law.
 */
export function stepMainWireAorticValvePressureRecoveryAblationScalarsV1(
  previousLeafletOpeningFraction01: number,
  dtSec: number,
  upstreamPressureMmHg: number,
  downstreamPressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  researchProfile: MainWireAorticValveResearchProfileV1,
): MainWireAorticValvePressureRecoveryAblationEvaluationV1 {
  const issues = [
    ...validateMainWireQuasiSteadyOrificeValveParamsV2(params),
    ...validateMainWireAorticValveResearchProfileV1(researchProfile),
  ];
  if (params.valveId !== "AoV") {
    issues.push("aortic-valve research profile requires valveId AoV");
  }
  if (
    !Number.isFinite(previousLeafletOpeningFraction01)
    || previousLeafletOpeningFraction01 < 0
    || previousLeafletOpeningFraction01 > 1
  ) {
    issues.push(
      "previous valve state must have finite leafletOpeningFraction01 in [0, 1]",
    );
  }
  if (
    !(dtSec > 0)
    || !Number.isFinite(dtSec)
    || !Number.isFinite(upstreamPressureMmHg)
    || !Number.isFinite(downstreamPressureMmHg)
  ) {
    issues.push("valve input must have positive dtSec and finite pressures");
  }
  const ascendingAorticAreaCm2 = researchProfile.ascendingAorticAreaCm2;
  if (
    researchProfile.forwardConvectivePressureMode
      === "garcia-energy-loss-plus-downstream-kinetic-flux"
    && (
      ascendingAorticAreaCm2 === null
      || !(ascendingAorticAreaCm2 > params.maximumForwardEoaCm2)
      || !Number.isFinite(ascendingAorticAreaCm2)
    )
  ) {
    issues.push(
      "pressure recovery requires fixed ascending-aortic area greater than maximum forward EOA",
    );
  }
  if (issues.length > 0) {
    return invalidEvaluation(
      previousLeafletOpeningFraction01,
      upstreamPressureMmHg,
      downstreamPressureMmHg,
      params,
      researchProfile,
      issues,
    );
  }

  const pressureGradientMmHg = upstreamPressureMmHg - downstreamPressureMmHg;
  const targetAndTangent = evaluateMainWireValveOpeningTargetAndTangentV2(
    pressureGradientMmHg,
    params,
  );
  const openingTarget01 = targetAndTangent.openingTarget01;
  const openingMemoryUsed =
    researchProfile.openingMode === "bounded-backward-euler-memory";
  let leafletOpeningFraction01: number;
  let dLeafletOpeningFractionDPressureGradientPerMmHg: number;
  let openingEquationResidual01: number;
  let tangentMode:
    | "backward-euler-opening-state-eliminated"
    | "instantaneous-opening-constraint-eliminated";
  if (openingMemoryUsed) {
    const tau = openingTarget01 > previousLeafletOpeningFraction01
      ? params.openingTimeConstantSec
      : params.closingTimeConstantSec;
    const timeRatio = dtSec / tau;
    const unclampedOpening01 =
      (previousLeafletOpeningFraction01 + timeRatio * openingTarget01)
      / (1 + timeRatio);
    leafletOpeningFraction01 = clamp(unclampedOpening01, 0, 1);
    dLeafletOpeningFractionDPressureGradientPerMmHg =
      unclampedOpening01 <= 0 || unclampedOpening01 >= 1
        ? 0
        : dtSec / (tau + dtSec)
          * targetAndTangent.dOpeningTargetDPressureGradientPerMmHg;
    openingEquationResidual01 =
      leafletOpeningFraction01 - previousLeafletOpeningFraction01
      - dtSec * (openingTarget01 - leafletOpeningFraction01) / tau;
    tangentMode = "backward-euler-opening-state-eliminated";
  } else {
    leafletOpeningFraction01 = openingTarget01;
    dLeafletOpeningFractionDPressureGradientPerMmHg =
      targetAndTangent.dOpeningTargetDPressureGradientPerMmHg;
    openingEquationResidual01 = leafletOpeningFraction01 - openingTarget01;
    tangentMode = "instantaneous-opening-constraint-eliminated";
  }

  const activeDirection = directionFromGradient(pressureGradientMmHg);
  const forwardActiveEoaCm2 = params.closedReverseEroaCm2
    + leafletOpeningFraction01
      * (params.maximumForwardEoaCm2 - params.closedReverseEroaCm2);
  const reverseActiveEoaCm2 = params.closedReverseEroaCm2;
  const activeEoaCm2 = activeDirection === "reverse"
    ? reverseActiveEoaCm2
    : forwardActiveEoaCm2;
  const dActiveEoaDPressureGradientCm2PerMmHg =
    activeDirection === "reverse"
      ? 0
      : (params.maximumForwardEoaCm2 - params.closedReverseEroaCm2)
        * dLeafletOpeningFractionDPressureGradientPerMmHg;
  const resistanceMmHgSecPerMl = activeEoaCm2 === 0
    ? 0
    : params.backgroundLinearResistanceMmHgSecPerMl;
  const convective =
    evaluateMainWireAorticValveForwardConvectiveCoefficientsV1(
      activeEoaCm2,
      researchProfile,
      activeDirection !== "reverse",
    );
  const pressureRecoveryApplied = convective.pressureRecoveryApplied;
  const energyLossCoefficientAreaCm2 =
    convective.energyLossCoefficientAreaCm2;
  const venaContractaBernoulliMmHgSec2PerMl2 =
    convective.venaContractaBernoulliMmHgSec2PerMl2;
  // This field remains the irreversible convective-loss coefficient so the
  // existing dissipated-energy analysis keeps its exact meaning.
  const bernoulliMmHgSec2PerMl2 =
    convective.irreversibleBernoulliMmHgSec2PerMl2;
  const downstreamKineticMmHgSec2PerMl2 =
    convective.downstreamKineticMmHgSec2PerMl2;
  const portConvectivePressureMmHgSec2PerMl2 =
    convective.portConvectivePressureMmHgSec2PerMl2;
  const flowMlPerSec = activeEoaCm2 === 0
    ? 0
    : solveExactSignedLinearQuadraticValveFlowV2(
      pressureGradientMmHg,
      resistanceMmHgSecPerMl,
      portConvectivePressureMmHgSec2PerMl2,
    );

  let dFlowDPressureGradientMlPerSecPerMmHg: number;
  let tangentBranch: Exclude<
    MainWireQuasiSteadyOrificeValveTangentBranchV2,
    "invalid"
  >;
  if (activeEoaCm2 === 0) {
    dFlowDPressureGradientMlPerSecPerMmHg = 0;
    tangentBranch = "exact-zero-area-hydraulic-support";
  } else {
    const denominator = resistanceMmHgSecPerMl
      + 2 * portConvectivePressureMmHgSec2PerMl2
        * Math.abs(flowMlPerSec);
    if (denominator === 0) {
      dFlowDPressureGradientMlPerSecPerMmHg = 0;
      tangentBranch = "zero-gradient-non-lipschitz-zero-linear-resistance";
    } else {
      const dPortConvectivePressureDPressureGradient = pressureRecoveryApplied
        ? -2 * bernoulliMmHgSec2PerMl2 * ascendingAorticAreaCm2!
          * dActiveEoaDPressureGradientCm2PerMmHg
          / (
            activeEoaCm2
            * (ascendingAorticAreaCm2! - activeEoaCm2)
          )
        : -2 * bernoulliMmHgSec2PerMl2
          * dActiveEoaDPressureGradientCm2PerMmHg / activeEoaCm2;
      dFlowDPressureGradientMlPerSecPerMmHg = (
        1 - flowMlPerSec * Math.abs(flowMlPerSec)
          * dPortConvectivePressureDPressureGradient
      ) / denominator;
      tangentBranch = activeDirection === "reverse"
        ? "reverse-regurgitant-orifice"
        : activeDirection === "zero-gradient"
          ? "zero-gradient-forward-open-orifice"
          : "forward-open-orifice";
    }
  }

  const signedQuadraticFlow = flowMlPerSec * Math.abs(flowMlPerSec);
  const linearPressureMmHg = resistanceMmHgSecPerMl * flowMlPerSec;
  const netIrreversibleBernoulliPressureMmHg =
    bernoulliMmHgSec2PerMl2 * signedQuadraticFlow;
  const downstreamKineticPressureMmHg = pressureRecoveryApplied
    ? downstreamKineticMmHgSec2PerMl2 * signedQuadraticFlow
    : 0;
  const netStaticConvectivePressureMmHg =
    portConvectivePressureMmHgSec2PerMl2 * signedQuadraticFlow;
  const dissipativePressureMmHg =
    linearPressureMmHg + netIrreversibleBernoulliPressureMmHg;
  const venaContractaBernoulliPressureMmHg =
    venaContractaBernoulliMmHgSec2PerMl2 * signedQuadraticFlow;
  const recoveredStaticPressureMmHg = pressureRecoveryApplied
    ? venaContractaBernoulliPressureMmHg
      - netStaticConvectivePressureMmHg
    : 0;
  const pressureRecoveryFraction01 = convective.pressureRecoveryFraction01;
  const openOrificeResidualMmHg =
    pressureGradientMmHg
    - dissipativePressureMmHg
    - downstreamKineticPressureMmHg;
  const competentReverseClosureActive =
    activeDirection === "reverse" && activeEoaCm2 === 0;
  const subthresholdForwardSupportActive =
    activeDirection === "forward" && activeEoaCm2 === 0;
  const competentReverseClosureReactionMmHg = competentReverseClosureActive
    ? -pressureGradientMmHg
    : 0;
  const subthresholdForwardSupportReactionMmHg =
    subthresholdForwardSupportActive ? pressureGradientMmHg : 0;
  const signedHydraulicSupportReactionMmHg =
    competentReverseClosureReactionMmHg
    - subthresholdForwardSupportReactionMmHg;
  const hydraulicBalanceResidualMmHg =
    openOrificeResidualMmHg + signedHydraulicSupportReactionMmHg;
  const hydraulicPowerInputMmHgMlPerSec =
    pressureGradientMmHg * flowMlPerSec;
  const dissipativePowerMmHgMlPerSec =
    dissipativePressureMmHg * flowMlPerSec;
  const downstreamKineticPowerMmHgMlPerSec = pressureRecoveryApplied
    ? downstreamKineticPressureMmHg * flowMlPerSec
    : 0;
  const hydraulicSupportPowerMmHgMlPerSec =
    signedHydraulicSupportReactionMmHg === 0 || flowMlPerSec === 0
      ? 0
      : signedHydraulicSupportReactionMmHg * flowMlPerSec;
  const powerBalanceResidualMmHgMlPerSec =
    hydraulicPowerInputMmHgMlPerSec
    - dissipativePowerMmHgMlPerSec
    - downstreamKineticPowerMmHgMlPerSec
    + hydraulicSupportPowerMmHgMlPerSec;

  const result = Object.freeze({
    modelId: MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_ABLATION_V1_ID,
    researchProfileId: researchProfile.profileId,
    state: Object.freeze({ leafletOpeningFraction01 }),
    flowMlPerSec,
    pressureGradientMmHg,
    activeDirection,
    openingTarget01,
    openingEquationResidual01,
    forwardActiveEoaCm2,
    reverseActiveEoaCm2,
    activeEoaCm2,
    dLeafletOpeningFractionDPressureGradientPerMmHg,
    dFlowDPressureGradientMlPerSecPerMmHg,
    tangentMode,
    tangentBranch,
    resistanceMmHgSecPerMl,
    bernoulliMmHgSec2PerMl2,
    dissipativePressureMmHg,
    openOrificeResidualMmHg,
    competentReverseClosureReactionMmHg,
    subthresholdForwardSupportReactionMmHg,
    signedHydraulicSupportReactionMmHg,
    hydraulicBalanceResidualMmHg,
    hydraulicPowerInputMmHgMlPerSec,
    dissipativePowerMmHgMlPerSec,
    hydraulicSupportPowerMmHgMlPerSec,
    powerBalanceResidualMmHgMlPerSec,
    competentReverseClosureActive,
    subthresholdForwardSupportActive,
    leafletMechanicalContactModeled: false as const,
    reverseRegurgitantFlowEnabled: params.closedReverseEroaCm2 > 0,
    openingMode: researchProfile.openingMode,
    openingMemoryUsed,
    forwardConvectivePressureMode:
      researchProfile.forwardConvectivePressureMode,
    ascendingAorticAreaCm2,
    energyLossCoefficientAreaCm2,
    portConvectivePressureMmHgSec2PerMl2,
    downstreamKineticPressureMmHg,
    downstreamKineticPowerMmHgMlPerSec,
    netStaticConvectivePressureMmHg,
    venaContractaBernoulliMmHgSec2PerMl2,
    venaContractaBernoulliPressureMmHg,
    netIrreversibleBernoulliPressureMmHg,
    recoveredStaticPressureMmHg,
    pressureRecoveryFraction01,
    valid: true,
    finite: true,
    issues: Object.freeze([]),
    claim: pressureRecoveryClaim(researchProfile),
  } satisfies MainWireAorticValvePressureRecoveryAblationEvaluationV1);
  return numericReadbackIsFinite(result)
    ? result
    : Object.freeze({
      ...result,
      valid: false,
      finite: false,
      issues: Object.freeze(["aortic-valve research evaluation is non-finite"]),
    });
}

function invalidEvaluation(
  previousLeafletOpeningFraction01: number,
  upstreamPressureMmHg: number,
  downstreamPressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  researchProfile: MainWireAorticValveResearchProfileV1,
  issues: readonly string[],
): MainWireAorticValvePressureRecoveryAblationEvaluationV1 {
  return Object.freeze({
    modelId: MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_ABLATION_V1_ID,
    researchProfileId: researchProfile.profileId,
    state: Object.freeze({
      leafletOpeningFraction01: previousLeafletOpeningFraction01,
    }),
    flowMlPerSec: Number.NaN,
    pressureGradientMmHg: upstreamPressureMmHg - downstreamPressureMmHg,
    activeDirection: "invalid" as const,
    openingTarget01: Number.NaN,
    openingEquationResidual01: Number.NaN,
    forwardActiveEoaCm2: Number.NaN,
    reverseActiveEoaCm2: Number.NaN,
    activeEoaCm2: Number.NaN,
    dLeafletOpeningFractionDPressureGradientPerMmHg: Number.NaN,
    dFlowDPressureGradientMlPerSecPerMmHg: Number.NaN,
    tangentMode: "invalid" as const,
    tangentBranch: "invalid" as const,
    resistanceMmHgSecPerMl: Number.NaN,
    bernoulliMmHgSec2PerMl2: Number.NaN,
    dissipativePressureMmHg: Number.NaN,
    openOrificeResidualMmHg: Number.NaN,
    competentReverseClosureReactionMmHg: Number.NaN,
    subthresholdForwardSupportReactionMmHg: Number.NaN,
    signedHydraulicSupportReactionMmHg: Number.NaN,
    hydraulicBalanceResidualMmHg: Number.NaN,
    hydraulicPowerInputMmHgMlPerSec: Number.NaN,
    dissipativePowerMmHgMlPerSec: Number.NaN,
    hydraulicSupportPowerMmHgMlPerSec: Number.NaN,
    powerBalanceResidualMmHgMlPerSec: Number.NaN,
    competentReverseClosureActive: false,
    subthresholdForwardSupportActive: false,
    leafletMechanicalContactModeled: false as const,
    reverseRegurgitantFlowEnabled: params.closedReverseEroaCm2 > 0,
    openingMode: researchProfile.openingMode,
    openingMemoryUsed:
      researchProfile.openingMode === "bounded-backward-euler-memory",
    forwardConvectivePressureMode:
      researchProfile.forwardConvectivePressureMode,
    ascendingAorticAreaCm2: researchProfile.ascendingAorticAreaCm2,
    energyLossCoefficientAreaCm2: Number.NaN,
    portConvectivePressureMmHgSec2PerMl2: Number.NaN,
    downstreamKineticPressureMmHg: Number.NaN,
    downstreamKineticPowerMmHgMlPerSec: Number.NaN,
    netStaticConvectivePressureMmHg: Number.NaN,
    venaContractaBernoulliMmHgSec2PerMl2: Number.NaN,
    venaContractaBernoulliPressureMmHg: Number.NaN,
    netIrreversibleBernoulliPressureMmHg: Number.NaN,
    recoveredStaticPressureMmHg: Number.NaN,
    pressureRecoveryFraction01: Number.NaN,
    valid: false,
    finite: false,
    issues: Object.freeze([...issues]),
    claim: pressureRecoveryClaim(researchProfile),
  });
}

function pressureRecoveryClaim(
  researchProfile: MainWireAorticValveResearchProfileV1,
): MainWireAorticValvePressureRecoveryClaimV1 {
  return researchProfile.profileId === "pressure-recovery-aa-d2p5cm"
    || researchProfile.profileId === "pressure-recovery-aa-d3p8cm"
    ? MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_GEOMETRY_CLAIM_V1
    : MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_ABLATION_CLAIM_V1;
}

function directionFromGradient(
  pressureGradientMmHg: number,
): Exclude<MainWireQuasiSteadyOrificeValveDirectionV2, "invalid"> {
  if (pressureGradientMmHg > 0) return "forward";
  if (pressureGradientMmHg < 0) return "reverse";
  return "zero-gradient";
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function numericReadbackIsFinite(
  value: MainWireAorticValvePressureRecoveryAblationEvaluationV1,
): boolean {
  return Number.isFinite(value.state.leafletOpeningFraction01)
    && Number.isFinite(value.flowMlPerSec)
    && Number.isFinite(value.pressureGradientMmHg)
    && Number.isFinite(value.openingTarget01)
    && Number.isFinite(value.openingEquationResidual01)
    && Number.isFinite(value.forwardActiveEoaCm2)
    && Number.isFinite(value.reverseActiveEoaCm2)
    && Number.isFinite(value.activeEoaCm2)
    && Number.isFinite(value.dLeafletOpeningFractionDPressureGradientPerMmHg)
    && Number.isFinite(value.dFlowDPressureGradientMlPerSecPerMmHg)
    && Number.isFinite(value.resistanceMmHgSecPerMl)
    && Number.isFinite(value.bernoulliMmHgSec2PerMl2)
    && Number.isFinite(value.dissipativePressureMmHg)
    && Number.isFinite(value.openOrificeResidualMmHg)
    && Number.isFinite(value.competentReverseClosureReactionMmHg)
    && Number.isFinite(value.subthresholdForwardSupportReactionMmHg)
    && Number.isFinite(value.signedHydraulicSupportReactionMmHg)
    && Number.isFinite(value.hydraulicBalanceResidualMmHg)
    && Number.isFinite(value.hydraulicPowerInputMmHgMlPerSec)
    && Number.isFinite(value.dissipativePowerMmHgMlPerSec)
    && Number.isFinite(value.hydraulicSupportPowerMmHgMlPerSec)
    && Number.isFinite(value.powerBalanceResidualMmHgMlPerSec)
    && Number.isFinite(value.energyLossCoefficientAreaCm2)
    && Number.isFinite(value.portConvectivePressureMmHgSec2PerMl2)
    && Number.isFinite(value.downstreamKineticPressureMmHg)
    && Number.isFinite(value.downstreamKineticPowerMmHgMlPerSec)
    && Number.isFinite(value.netStaticConvectivePressureMmHg)
    && Number.isFinite(value.venaContractaBernoulliMmHgSec2PerMl2)
    && Number.isFinite(value.venaContractaBernoulliPressureMmHg)
    && Number.isFinite(value.netIrreversibleBernoulliPressureMmHg)
    && Number.isFinite(value.recoveredStaticPressureMmHg)
    && Number.isFinite(value.pressureRecoveryFraction01);
}
