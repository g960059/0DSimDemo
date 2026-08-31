import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1,
  validateMainWireAorticRecoveredRootProfileV1,
  type MainWireAorticRecoveredRootProfileV1,
} from "@/engine/valves/MainWireAorticRecoveredRootProfileV1";
import {
  idealBernoulliLossFromEffectiveOrificeAreaV2,
  validateMainWireQuasiSteadyOrificeValveParamsV2,
  type MainWireQuasiSteadyOrificeValveDirectionV2,
  type MainWireQuasiSteadyOrificeValveEvaluationV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
  type MainWireQuasiSteadyOrificeValveTangentBranchV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID =
  "main-wire-aortic-recovered-root-port-valve-v1" as const;

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1 =
  Object.freeze({
    topology: "algebraic-flow-and-bounded-opening-memory" as const,
    acceptedMemory: "leaflet-opening-fraction-only" as const,
    flowMemory: false as const,
    localValveInertance: false as const,
    newContinuousStateAdded: false as const,
    rawNodePressureGradient:
      "LV-chamber-node-minus-Ao-compliance-node" as const,
    proximalConstitutivePortPressure:
      "Ao-compliance-node-plus-characteristic-impedance-times-signed-flow" as const,
    localValvePressureGradient:
      "raw-node-gradient-minus-characteristic-impedance-pressure" as const,
    openingDrivePressureStation:
      "LV-minus-proximal-constitutive-port" as const,
    forwardPressureLaw:
      "source-linear-valve-loss-plus-Garcia-ELCo-irreversible-loss-plus-fixed-AA-kinetic-transport-plus-arterial-characteristic-load" as const,
    reversePressureLaw:
      "source-linear-valve-loss-plus-full-reverse-EROA-loss-plus-arterial-characteristic-load" as const,
    characteristicWaveLoadClassifiedAsValveDissipation: false as const,
    downstreamKineticTransportClassifiedAsValveDissipation: false as const,
    pressureRecoveryAppliedToReverseFlow: false as const,
    coupledSolve:
      "backward-euler-opening-memory-and-algebraic-flow-monotone-bisection" as const,
    pressureOrFlowSmoothingAdded: false as const,
    parameterSearchOrFitting: false as const,
    clinicalMeasurementEquivalenceClaimed: false as const,
  });

type SharedValveEvaluationV2 = Omit<
  MainWireQuasiSteadyOrificeValveEvaluationV2,
  "modelId" | "claim" | "openOrificeResidualMmHg"
>;

export type MainWireAorticRecoveredRootPortValveEvaluationV1 =
  SharedValveEvaluationV2 & Readonly<{
    modelId: typeof MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID;
    recoveredRootProfileId:
      MainWireAorticRecoveredRootProfileV1["profileId"];
    openingDrivePressureStation:
      MainWireAorticRecoveredRootProfileV1["openingDrivePressureStation"];
    openingCouplingIterationCount: number;
    openingCouplingResidual01: number;
    sourceValveLinearResistanceMmHgSecPerMl: number;
    characteristicImpedanceResistanceMmHgSecPerMl: number;
    characteristicImpedancePressureMmHg: number;
    characteristicWaveLoadPowerMmHgMlPerSec: number;
    aorticComplianceNodePressureMmHg: number;
    algebraicProximalConstitutivePortPressureMmHg: number;
    localValvePressureGradientMmHg: number;
    energyLossCoefficientAreaCm2: number;
    ascendingAorticAreaCm2: number;
    venaContractaBernoulliMmHgSec2PerMl2: number;
    venaContractaBernoulliPressureMmHg: number;
    portConvectivePressureMmHgSec2PerMl2: number;
    netIrreversibleBernoulliPressureMmHg: number;
    downstreamKineticPressureMmHg: number;
    downstreamKineticPowerMmHgMlPerSec: number;
    /** Full raw-node port balance after Zc, loss, and downstream kinetic head. */
    openOrificeResidualMmHg: number;
    /** Static-pressure recovery from vena contracta to the fixed AA station. */
    pressureRecoveryFromVenaContractaMmHg: number;
    pressureRecoveryFraction01: number;
    claim: typeof MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1;
  }>;

type ForwardConvectiveCoefficientsV1 = Readonly<{
  energyLossCoefficientAreaCm2: number;
  venaContractaBernoulliMmHgSec2PerMl2: number;
  irreversibleBernoulliMmHgSec2PerMl2: number;
  downstreamKineticMmHgSec2PerMl2: number;
  portConvectivePressureMmHgSec2PerMl2: number;
  pressureRecoveryFraction01: number;
}>;

type CoupledOpeningPointV1 = Readonly<{
  opening01: number;
  flowMlPerSec: number;
  localValvePressureGradientMmHg: number;
  openingTarget01: number;
  backwardEulerOpening01: number;
  openingResidual01: number;
  openingTimeConstantSec: number;
  forwardActiveEoaCm2: number;
  reverseActiveEoaCm2: number;
  activeEoaCm2: number;
  sourceValveLinearResistanceMmHgSecPerMl: number;
  venaContractaBernoulliMmHgSec2PerMl2: number;
  irreversibleBernoulliMmHgSec2PerMl2: number;
  downstreamKineticMmHgSec2PerMl2: number;
  portConvectivePressureMmHgSec2PerMl2: number;
  energyLossCoefficientAreaCm2: number;
  pressureRecoveryFraction01: number;
}>;

/**
 * Fixed recovered-root aortic port. Flow is algebraic; the sole accepted
 * memory is the existing bounded leaflet-opening fraction. Opening and flow
 * are solved together because opening is driven by LV minus the proximal
 * constitutive-port pressure rather than by the raw LV-to-Ao-node difference.
 */
export function stepMainWireAorticRecoveredRootPortValveScalarsV1(
  previousLeafletOpeningFraction01: number,
  dtSec: number,
  upstreamPressureMmHg: number,
  downstreamAorticComplianceNodePressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  profile: MainWireAorticRecoveredRootProfileV1,
): MainWireAorticRecoveredRootPortValveEvaluationV1 {
  const profileIssues = validateMainWireAorticRecoveredRootProfileV1(profile);
  const invalidReadbackProfile = profileIssues.length === 0
    ? profile
    : MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1;
  const issues = [
    ...validateMainWireQuasiSteadyOrificeValveParamsV2(params),
    ...profileIssues,
  ];
  if (params.valveId !== "AoV") {
    issues.push("recovered-root port requires valveId AoV");
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
    || !Number.isFinite(downstreamAorticComplianceNodePressureMmHg)
  ) {
    issues.push("valve input must have positive dtSec and finite pressures");
  }
  if (
    !(
      invalidReadbackProfile.ascendingAorticAreaCm2
        > params.maximumForwardEoaCm2
    )
    || !Number.isFinite(invalidReadbackProfile.ascendingAorticAreaCm2)
  ) {
    issues.push(
      "ascending-aortic area must exceed maximum forward EOA",
    );
  }
  if (issues.length > 0) {
    return invalidEvaluation(
      previousLeafletOpeningFraction01,
      upstreamPressureMmHg,
      downstreamAorticComplianceNodePressureMmHg,
      params,
      invalidReadbackProfile,
      issues,
    );
  }

  const rawNodePressureGradientMmHg =
    upstreamPressureMmHg - downstreamAorticComplianceNodePressureMmHg;
  const activeDirection = directionFromGradient(rawNodePressureGradientMmHg);
  const characteristicImpedanceResistanceMmHgSecPerMl =
    profile.characteristicImpedanceResistanceMmHgSecPerMl;

  const evaluateOpening = (opening01: number): CoupledOpeningPointV1 => {
    const forwardActiveEoaCm2 = params.closedReverseEroaCm2
      + opening01
        * (params.maximumForwardEoaCm2 - params.closedReverseEroaCm2);
    const reverseActiveEoaCm2 = params.closedReverseEroaCm2;
    const activeEoaCm2 = activeDirection === "reverse"
      ? reverseActiveEoaCm2
      : forwardActiveEoaCm2;
    const sourceValveLinearResistanceMmHgSecPerMl = activeEoaCm2 === 0
      ? 0
      : params.backgroundLinearResistanceMmHgSecPerMl;
    const convective = evaluateForwardConvectiveCoefficientsV1(
      activeEoaCm2,
      profile.ascendingAorticAreaCm2,
      activeDirection !== "reverse",
    );
    const flowMlPerSec = activeEoaCm2 === 0
      ? 0
      : solveExactSignedRecoveredRootFlowV1(
        rawNodePressureGradientMmHg,
        sourceValveLinearResistanceMmHgSecPerMl
          + characteristicImpedanceResistanceMmHgSecPerMl,
        convective.portConvectivePressureMmHgSec2PerMl2,
      );
    const localValvePressureGradientMmHg = rawNodePressureGradientMmHg
      - characteristicImpedanceResistanceMmHgSecPerMl * flowMlPerSec;
    const openingTarget01 =
      evaluateRecoveredRootOpeningTargetAndTangentV1(
        localValvePressureGradientMmHg,
        params,
      ).openingTarget01;
    const openingTimeConstantSec =
      openingTarget01 > previousLeafletOpeningFraction01
        ? params.openingTimeConstantSec
        : params.closingTimeConstantSec;
    const timeRatio = dtSec / openingTimeConstantSec;
    const backwardEulerOpening01 =
      (previousLeafletOpeningFraction01 + timeRatio * openingTarget01)
      / (1 + timeRatio);
    return Object.freeze({
      opening01,
      flowMlPerSec,
      localValvePressureGradientMmHg,
      openingTarget01,
      backwardEulerOpening01,
      openingResidual01: opening01 - backwardEulerOpening01,
      openingTimeConstantSec,
      forwardActiveEoaCm2,
      reverseActiveEoaCm2,
      activeEoaCm2,
      sourceValveLinearResistanceMmHgSecPerMl,
      ...convective,
    });
  };

  let point: CoupledOpeningPointV1;
  let openingCouplingIterationCount = 0;
  if (activeDirection !== "forward") {
    const probe = evaluateOpening(previousLeafletOpeningFraction01);
    point = evaluateOpening(probe.backwardEulerOpening01);
  } else {
    let lower = 0;
    let upper = 1;
    let lowerPoint = evaluateOpening(lower);
    let upperPoint = evaluateOpening(upper);
    if (
      lowerPoint.openingResidual01 > profile.openingResidualTolerance01
      || upperPoint.openingResidual01 < -profile.openingResidualTolerance01
    ) {
      return invalidEvaluation(
        previousLeafletOpeningFraction01,
        upstreamPressureMmHg,
        downstreamAorticComplianceNodePressureMmHg,
        params,
        profile,
        ["coupled opening root is not bracketed on [0, 1]"],
      );
    }
    point = lowerPoint.openingResidual01 === 0 ? lowerPoint : upperPoint;
    if (
      lowerPoint.openingResidual01 !== 0
      && upperPoint.openingResidual01 !== 0
    ) {
      for (
        let iteration = 1;
        iteration <= profile.maximumBisectionIterations;
        iteration += 1
      ) {
        const midpoint = 0.5 * (lower + upper);
        if (midpoint === lower || midpoint === upper) break;
        point = evaluateOpening(midpoint);
        openingCouplingIterationCount = iteration;
        if (
          Math.abs(point.openingResidual01)
          <= profile.openingResidualTolerance01
        ) break;
        if (point.openingResidual01 > 0) {
          upper = midpoint;
          upperPoint = point;
        } else {
          lower = midpoint;
          lowerPoint = point;
        }
      }
    }
  }
  if (
    Math.abs(point.openingResidual01) > profile.openingResidualTolerance01
  ) {
    return invalidEvaluation(
      previousLeafletOpeningFraction01,
      upstreamPressureMmHg,
      downstreamAorticComplianceNodePressureMmHg,
      params,
      profile,
      ["coupled opening solve did not converge to its fixed tolerance"],
    );
  }

  const leafletOpeningFraction01 = point.opening01;
  const flowMlPerSec = point.flowMlPerSec;
  const activeEoaCm2 = point.activeEoaCm2;
  const signedQuadraticFlow = flowMlPerSec * Math.abs(flowMlPerSec);
  const targetAndTangent = evaluateRecoveredRootOpeningTargetAndTangentV1(
    point.localValvePressureGradientMmHg,
    params,
  );
  const unclampedBackwardEulerOpening01 =
    (previousLeafletOpeningFraction01
      + dtSec / point.openingTimeConstantSec * point.openingTarget01)
    / (1 + dtSec / point.openingTimeConstantSec);
  const dBackwardEulerOpeningDLocalPressurePerMmHg =
    unclampedBackwardEulerOpening01 <= 0
      || unclampedBackwardEulerOpening01 >= 1
      ? 0
      : dtSec / (point.openingTimeConstantSec + dtSec)
        * targetAndTangent.dOpeningTargetDPressureGradientPerMmHg;
  const dActiveEoaDOpeningCm2 = activeDirection === "reverse"
    ? 0
    : params.maximumForwardEoaCm2 - params.closedReverseEroaCm2;
  const bernoulliAreaConstant = activeEoaCm2 === 0
    ? 0
    : idealBernoulliLossFromEffectiveOrificeAreaV2(activeEoaCm2)
      * activeEoaCm2 ** 2;
  const dPortConvectivePressureDActiveEoa = activeEoaCm2 === 0
    ? 0
    : activeDirection !== "reverse"
      ? -2 * bernoulliAreaConstant
        * (1 / activeEoaCm2 - 1 / profile.ascendingAorticAreaCm2)
        / activeEoaCm2 ** 2
      : -2 * point.portConvectivePressureMmHgSec2PerMl2 / activeEoaCm2;
  const dPortConvectivePressureDOpening =
    dPortConvectivePressureDActiveEoa * dActiveEoaDOpeningCm2;
  const pressureLawFlowDerivative =
    point.sourceValveLinearResistanceMmHgSecPerMl
    + characteristicImpedanceResistanceMmHgSecPerMl
    + 2 * point.portConvectivePressureMmHgSec2PerMl2
      * Math.abs(flowMlPerSec);
  const tangentDenominator = pressureLawFlowDerivative
    - dBackwardEulerOpeningDLocalPressurePerMmHg
      * characteristicImpedanceResistanceMmHgSecPerMl
      * dPortConvectivePressureDOpening * signedQuadraticFlow;
  if (
    activeEoaCm2 !== 0
    && (!Number.isFinite(tangentDenominator) || !(tangentDenominator > 0))
  ) {
    return invalidEvaluation(
      previousLeafletOpeningFraction01,
      upstreamPressureMmHg,
      downstreamAorticComplianceNodePressureMmHg,
      params,
      profile,
      ["coupled opening-flow tangent denominator must be positive and finite"],
    );
  }

  let dLeafletOpeningFractionDPressureGradientPerMmHg: number;
  let dFlowDPressureGradientMlPerSecPerMmHg: number;
  let tangentBranch: Exclude<
    MainWireQuasiSteadyOrificeValveTangentBranchV2,
    "invalid"
  >;
  if (activeEoaCm2 === 0) {
    dLeafletOpeningFractionDPressureGradientPerMmHg =
      dBackwardEulerOpeningDLocalPressurePerMmHg;
    dFlowDPressureGradientMlPerSecPerMmHg = 0;
    tangentBranch = "exact-zero-area-hydraulic-support";
  } else {
    dLeafletOpeningFractionDPressureGradientPerMmHg =
      dBackwardEulerOpeningDLocalPressurePerMmHg
      * (
        point.sourceValveLinearResistanceMmHgSecPerMl
        + 2 * point.portConvectivePressureMmHgSec2PerMl2
          * Math.abs(flowMlPerSec)
      ) / tangentDenominator;
    dFlowDPressureGradientMlPerSecPerMmHg =
      (1
        - dPortConvectivePressureDOpening * signedQuadraticFlow
          * dBackwardEulerOpeningDLocalPressurePerMmHg)
      / tangentDenominator;
    tangentBranch = activeDirection === "reverse"
      ? "reverse-regurgitant-orifice"
      : activeDirection === "zero-gradient"
        ? "zero-gradient-forward-open-orifice"
        : "forward-open-orifice";
  }

  const sourceValveLinearPressureMmHg =
    point.sourceValveLinearResistanceMmHgSecPerMl * flowMlPerSec;
  const characteristicImpedancePressureMmHg =
    characteristicImpedanceResistanceMmHgSecPerMl * flowMlPerSec;
  const netIrreversibleBernoulliPressureMmHg =
    point.irreversibleBernoulliMmHgSec2PerMl2 * signedQuadraticFlow;
  const downstreamKineticPressureMmHg =
    point.downstreamKineticMmHgSec2PerMl2 === 0
      ? 0
      : point.downstreamKineticMmHgSec2PerMl2 * signedQuadraticFlow;
  const dissipativePressureMmHg = sourceValveLinearPressureMmHg
    + netIrreversibleBernoulliPressureMmHg;
  const venaContractaBernoulliPressureMmHg =
    point.venaContractaBernoulliMmHgSec2PerMl2 * signedQuadraticFlow;
  const pressureRecoveryFromVenaContractaMmHg =
    activeDirection === "forward"
    ? venaContractaBernoulliPressureMmHg
      - netIrreversibleBernoulliPressureMmHg
      - downstreamKineticPressureMmHg
    : 0;
  const openOrificeResidualMmHg = rawNodePressureGradientMmHg
    - characteristicImpedancePressureMmHg
    - dissipativePressureMmHg
    - downstreamKineticPressureMmHg;
  const competentReverseClosureActive =
    activeDirection === "reverse" && activeEoaCm2 === 0;
  const subthresholdForwardSupportActive =
    activeDirection === "forward" && activeEoaCm2 === 0;
  const competentReverseClosureReactionMmHg = competentReverseClosureActive
    ? -rawNodePressureGradientMmHg
    : 0;
  const subthresholdForwardSupportReactionMmHg =
    subthresholdForwardSupportActive ? rawNodePressureGradientMmHg : 0;
  const signedHydraulicSupportReactionMmHg =
    competentReverseClosureReactionMmHg
    - subthresholdForwardSupportReactionMmHg;
  const hydraulicBalanceResidualMmHg =
    openOrificeResidualMmHg + signedHydraulicSupportReactionMmHg;
  const hydraulicPowerInputMmHgMlPerSec = flowMlPerSec === 0
    ? 0
    : rawNodePressureGradientMmHg * flowMlPerSec;
  const dissipativePowerMmHgMlPerSec =
    dissipativePressureMmHg * flowMlPerSec;
  const downstreamKineticPowerMmHgMlPerSec =
    downstreamKineticPressureMmHg * flowMlPerSec;
  const characteristicWaveLoadPowerMmHgMlPerSec =
    characteristicImpedancePressureMmHg * flowMlPerSec;
  const hydraulicSupportPowerMmHgMlPerSec =
    signedHydraulicSupportReactionMmHg === 0 || flowMlPerSec === 0
      ? 0
      : signedHydraulicSupportReactionMmHg * flowMlPerSec;
  const powerBalanceResidualMmHgMlPerSec =
    hydraulicPowerInputMmHgMlPerSec
    - dissipativePowerMmHgMlPerSec
    - downstreamKineticPowerMmHgMlPerSec
    - characteristicWaveLoadPowerMmHgMlPerSec
    + hydraulicSupportPowerMmHgMlPerSec;
  const openingEquationResidual01 =
    leafletOpeningFraction01 - previousLeafletOpeningFraction01
    - dtSec * (point.openingTarget01 - leafletOpeningFraction01)
      / point.openingTimeConstantSec;

  const result = Object.freeze({
    modelId: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID,
    recoveredRootProfileId: profile.profileId,
    state: Object.freeze({ leafletOpeningFraction01 }),
    flowMlPerSec,
    pressureGradientMmHg: rawNodePressureGradientMmHg,
    activeDirection,
    openingTarget01: point.openingTarget01,
    openingEquationResidual01,
    forwardActiveEoaCm2: point.forwardActiveEoaCm2,
    reverseActiveEoaCm2: point.reverseActiveEoaCm2,
    activeEoaCm2,
    dLeafletOpeningFractionDPressureGradientPerMmHg,
    dFlowDPressureGradientMlPerSecPerMmHg,
    tangentMode: "backward-euler-opening-state-eliminated" as const,
    tangentBranch,
    resistanceMmHgSecPerMl:
      point.sourceValveLinearResistanceMmHgSecPerMl,
    bernoulliMmHgSec2PerMl2:
      point.irreversibleBernoulliMmHgSec2PerMl2,
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
    openingDrivePressureStation: profile.openingDrivePressureStation,
    openingCouplingIterationCount,
    openingCouplingResidual01: point.openingResidual01,
    sourceValveLinearResistanceMmHgSecPerMl:
      point.sourceValveLinearResistanceMmHgSecPerMl,
    characteristicImpedanceResistanceMmHgSecPerMl,
    characteristicImpedancePressureMmHg,
    characteristicWaveLoadPowerMmHgMlPerSec,
    aorticComplianceNodePressureMmHg:
      downstreamAorticComplianceNodePressureMmHg,
    algebraicProximalConstitutivePortPressureMmHg:
      downstreamAorticComplianceNodePressureMmHg
      + characteristicImpedancePressureMmHg,
    localValvePressureGradientMmHg:
      point.localValvePressureGradientMmHg,
    energyLossCoefficientAreaCm2: point.energyLossCoefficientAreaCm2,
    ascendingAorticAreaCm2: profile.ascendingAorticAreaCm2,
    venaContractaBernoulliMmHgSec2PerMl2:
      point.venaContractaBernoulliMmHgSec2PerMl2,
    venaContractaBernoulliPressureMmHg,
    portConvectivePressureMmHgSec2PerMl2:
      point.portConvectivePressureMmHgSec2PerMl2,
    netIrreversibleBernoulliPressureMmHg,
    downstreamKineticPressureMmHg,
    downstreamKineticPowerMmHgMlPerSec,
    pressureRecoveryFromVenaContractaMmHg,
    pressureRecoveryFraction01: point.pressureRecoveryFraction01,
    valid: true,
    finite: true,
    issues: Object.freeze([]),
    claim: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1,
  } satisfies MainWireAorticRecoveredRootPortValveEvaluationV1);
  return numericReadbackIsFinite(result)
    ? result
    : Object.freeze({
      ...result,
      valid: false,
      finite: false,
      issues: Object.freeze([
        "recovered-root port evaluation produced non-finite readback",
      ]),
    });
}

function evaluateForwardConvectiveCoefficientsV1(
  activeEoaCm2: number,
  ascendingAorticAreaCm2: number,
  favorableFlow: boolean,
): ForwardConvectiveCoefficientsV1 {
  if (activeEoaCm2 === 0) {
    return Object.freeze({
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
  if (!favorableFlow) {
    return Object.freeze({
      energyLossCoefficientAreaCm2: activeEoaCm2,
      venaContractaBernoulliMmHgSec2PerMl2,
      irreversibleBernoulliMmHgSec2PerMl2:
        venaContractaBernoulliMmHgSec2PerMl2,
      downstreamKineticMmHgSec2PerMl2: 0,
      portConvectivePressureMmHgSec2PerMl2:
        venaContractaBernoulliMmHgSec2PerMl2,
      pressureRecoveryFraction01: 0,
    });
  }
  const energyLossCoefficientAreaCm2 =
    activeEoaCm2 * ascendingAorticAreaCm2
    / (ascendingAorticAreaCm2 - activeEoaCm2);
  const irreversibleBernoulliMmHgSec2PerMl2 =
    idealBernoulliLossFromEffectiveOrificeAreaV2(
      energyLossCoefficientAreaCm2,
    );
  const downstreamKineticMmHgSec2PerMl2 =
    idealBernoulliLossFromEffectiveOrificeAreaV2(ascendingAorticAreaCm2);
  const portConvectivePressureMmHgSec2PerMl2 =
    irreversibleBernoulliMmHgSec2PerMl2
    + downstreamKineticMmHgSec2PerMl2;
  return Object.freeze({
    energyLossCoefficientAreaCm2,
    venaContractaBernoulliMmHgSec2PerMl2,
    irreversibleBernoulliMmHgSec2PerMl2,
    downstreamKineticMmHgSec2PerMl2,
    portConvectivePressureMmHgSec2PerMl2,
    pressureRecoveryFraction01:
      1 - portConvectivePressureMmHgSec2PerMl2
        / venaContractaBernoulliMmHgSec2PerMl2,
  });
}

function evaluateRecoveredRootOpeningTargetAndTangentV1(
  pressureGradientMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
): Readonly<{
  openingTarget01: number;
  dOpeningTargetDPressureGradientPerMmHg: number;
}> {
  const openingDriveMmHg = pressureGradientMmHg
    - params.openingDriveDeadbandMmHg
    - params.openingPressureOffsetMmHg;
  const positiveOpeningDriveMmHg = openingDriveMmHg <= 0
    ? 0
    : openingDriveMmHg >= params.openingDriveSmoothingMmHg
      ? openingDriveMmHg - 0.5 * params.openingDriveSmoothingMmHg
      : openingDriveMmHg ** 2
        / (2 * params.openingDriveSmoothingMmHg);
  const openingTarget01 =
    1 - Math.exp(-params.openingGainPerMmHg * positiveOpeningDriveMmHg);
  const dPositiveOpeningDriveDPressureGradient = openingDriveMmHg <= 0
    ? 0
    : openingDriveMmHg >= params.openingDriveSmoothingMmHg
      ? 1
      : openingDriveMmHg / params.openingDriveSmoothingMmHg;
  return Object.freeze({
    openingTarget01,
    dOpeningTargetDPressureGradientPerMmHg:
      params.openingGainPerMmHg * (1 - openingTarget01)
      * dPositiveOpeningDriveDPressureGradient,
  });
}

/** Stable closed-form root of delta-p = R q + B q |q|. */
function solveExactSignedRecoveredRootFlowV1(
  pressureGradientMmHg: number,
  resistanceMmHgSecPerMl: number,
  bernoulliMmHgSec2PerMl2: number,
): number {
  if (pressureGradientMmHg === 0) return 0;
  const pressureMagnitude = Math.abs(pressureGradientMmHg);
  const discriminant = Math.sqrt(
    resistanceMmHgSecPerMl ** 2
    + 4 * bernoulliMmHgSec2PerMl2 * pressureMagnitude,
  );
  const flowMagnitude = 2 * pressureMagnitude
    / (resistanceMmHgSecPerMl + discriminant);
  return Math.sign(pressureGradientMmHg) * flowMagnitude;
}

function invalidEvaluation(
  previousLeafletOpeningFraction01: number,
  upstreamPressureMmHg: number,
  downstreamPressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  profile: MainWireAorticRecoveredRootProfileV1,
  issues: readonly string[],
): MainWireAorticRecoveredRootPortValveEvaluationV1 {
  const nan = Number.NaN;
  return Object.freeze({
    modelId: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID,
    recoveredRootProfileId: profile.profileId,
    state: Object.freeze({
      leafletOpeningFraction01: previousLeafletOpeningFraction01,
    }),
    flowMlPerSec: nan,
    pressureGradientMmHg: upstreamPressureMmHg - downstreamPressureMmHg,
    activeDirection: "invalid" as const,
    openingTarget01: nan,
    openingEquationResidual01: nan,
    forwardActiveEoaCm2: nan,
    reverseActiveEoaCm2: nan,
    activeEoaCm2: nan,
    dLeafletOpeningFractionDPressureGradientPerMmHg: nan,
    dFlowDPressureGradientMlPerSecPerMmHg: nan,
    tangentMode: "invalid" as const,
    tangentBranch: "invalid" as const,
    resistanceMmHgSecPerMl: nan,
    bernoulliMmHgSec2PerMl2: nan,
    dissipativePressureMmHg: nan,
    openOrificeResidualMmHg: nan,
    competentReverseClosureReactionMmHg: nan,
    subthresholdForwardSupportReactionMmHg: nan,
    signedHydraulicSupportReactionMmHg: nan,
    hydraulicBalanceResidualMmHg: nan,
    hydraulicPowerInputMmHgMlPerSec: nan,
    dissipativePowerMmHgMlPerSec: nan,
    hydraulicSupportPowerMmHgMlPerSec: nan,
    powerBalanceResidualMmHgMlPerSec: nan,
    competentReverseClosureActive: false,
    subthresholdForwardSupportActive: false,
    leafletMechanicalContactModeled: false as const,
    reverseRegurgitantFlowEnabled: params.closedReverseEroaCm2 > 0,
    openingDrivePressureStation: profile.openingDrivePressureStation,
    openingCouplingIterationCount: 0,
    openingCouplingResidual01: nan,
    sourceValveLinearResistanceMmHgSecPerMl: nan,
    characteristicImpedanceResistanceMmHgSecPerMl:
      profile.characteristicImpedanceResistanceMmHgSecPerMl,
    characteristicImpedancePressureMmHg: nan,
    characteristicWaveLoadPowerMmHgMlPerSec: nan,
    aorticComplianceNodePressureMmHg: downstreamPressureMmHg,
    algebraicProximalConstitutivePortPressureMmHg: nan,
    localValvePressureGradientMmHg: nan,
    energyLossCoefficientAreaCm2: nan,
    ascendingAorticAreaCm2: profile.ascendingAorticAreaCm2,
    venaContractaBernoulliMmHgSec2PerMl2: nan,
    venaContractaBernoulliPressureMmHg: nan,
    portConvectivePressureMmHgSec2PerMl2: nan,
    netIrreversibleBernoulliPressureMmHg: nan,
    downstreamKineticPressureMmHg: nan,
    downstreamKineticPowerMmHgMlPerSec: nan,
    pressureRecoveryFromVenaContractaMmHg: nan,
    pressureRecoveryFraction01: nan,
    valid: false,
    finite: false,
    issues: Object.freeze([...issues]),
    claim: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1,
  });
}

function directionFromGradient(
  pressureGradientMmHg: number,
): Exclude<MainWireQuasiSteadyOrificeValveDirectionV2, "invalid"> {
  if (pressureGradientMmHg > 0) return "forward";
  if (pressureGradientMmHg < 0) return "reverse";
  return "zero-gradient";
}

function numericReadbackIsFinite(
  value: MainWireAorticRecoveredRootPortValveEvaluationV1,
): boolean {
  return Number.isFinite(value.state.leafletOpeningFraction01)
    && Number.isFinite(value.flowMlPerSec)
    && Number.isFinite(value.pressureGradientMmHg)
    && Number.isFinite(value.openingTarget01)
    && Number.isFinite(value.openingEquationResidual01)
    && Number.isFinite(value.forwardActiveEoaCm2)
    && Number.isFinite(value.reverseActiveEoaCm2)
    && Number.isFinite(value.activeEoaCm2)
    && Number.isFinite(
      value.dLeafletOpeningFractionDPressureGradientPerMmHg,
    )
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
    && Number.isFinite(value.openingCouplingResidual01)
    && Number.isFinite(value.sourceValveLinearResistanceMmHgSecPerMl)
    && Number.isFinite(
      value.characteristicImpedanceResistanceMmHgSecPerMl,
    )
    && Number.isFinite(value.characteristicImpedancePressureMmHg)
    && Number.isFinite(value.characteristicWaveLoadPowerMmHgMlPerSec)
    && Number.isFinite(value.aorticComplianceNodePressureMmHg)
    && Number.isFinite(
      value.algebraicProximalConstitutivePortPressureMmHg,
    )
    && Number.isFinite(value.localValvePressureGradientMmHg)
    && Number.isFinite(value.energyLossCoefficientAreaCm2)
    && Number.isFinite(value.ascendingAorticAreaCm2)
    && Number.isFinite(value.venaContractaBernoulliMmHgSec2PerMl2)
    && Number.isFinite(value.venaContractaBernoulliPressureMmHg)
    && Number.isFinite(value.portConvectivePressureMmHgSec2PerMl2)
    && Number.isFinite(value.netIrreversibleBernoulliPressureMmHg)
    && Number.isFinite(value.downstreamKineticPressureMmHg)
    && Number.isFinite(value.downstreamKineticPowerMmHgMlPerSec)
    && Number.isFinite(value.pressureRecoveryFromVenaContractaMmHg)
    && Number.isFinite(value.pressureRecoveryFraction01);
}
