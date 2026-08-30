import {
  validateMainWireAorticCharacteristicResistancePlacementProfileV1,
  type MainWireAorticCharacteristicResistancePlacementProfileV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";
import {
  evaluateMainWireAorticValveForwardConvectiveCoefficientsV1,
  validateMainWireAorticValveResearchProfileV1,
  type MainWireAorticValveResearchProfileV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";
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

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID =
  "main-wire-aortic-recovered-root-port-valve-v1" as const;

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_PROFILE_IDS_V1 =
  Object.freeze([
    "Land2017-Zc-Garcia-AA-d3p0cm-local-opening",
    "Land2017-Zc-Garcia-AA-d2p5cm-local-opening",
    "Land2017-Zc-Garcia-AA-d3p8cm-local-opening",
  ] as const);

export type MainWireAorticRecoveredRootPortValveProfileIdV1 =
  (typeof MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_PROFILE_IDS_V1)[number];

export type MainWireAorticRecoveredRootPortValveProfileV1 = Readonly<{
  profileId: MainWireAorticRecoveredRootPortValveProfileIdV1;
  valveId: "AoV";
  characteristicResistancePlacementProfileId:
    "Land2017-characteristic-impedance-matched";
  pressureRecoveryProfileId:
    | "pressure-recovery-aa-d2p5cm"
    | "pressure-recovery-aa-d3p0cm"
    | "pressure-recovery-aa-d3p8cm";
  openingDrivePressureStation: "LV-minus-proximal-constitutive-port";
  coupledUnknowns: "leaflet-opening-and-algebraic-flow";
  reducedSolve: "monotone-bisection-on-bounded-opening";
  maximumBisectionIterations: 80;
  openingResidualTolerance01: 1e-13;
  parameterSearchOrFitting: false;
}>;

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_PROFILES_V1 =
  Object.freeze({
    "Land2017-Zc-Garcia-AA-d3p0cm-local-opening": Object.freeze({
      profileId: "Land2017-Zc-Garcia-AA-d3p0cm-local-opening" as const,
      valveId: "AoV" as const,
      characteristicResistancePlacementProfileId:
        "Land2017-characteristic-impedance-matched" as const,
      pressureRecoveryProfileId: "pressure-recovery-aa-d3p0cm" as const,
      openingDrivePressureStation:
        "LV-minus-proximal-constitutive-port" as const,
      coupledUnknowns: "leaflet-opening-and-algebraic-flow" as const,
      reducedSolve: "monotone-bisection-on-bounded-opening" as const,
      maximumBisectionIterations: 80 as const,
      openingResidualTolerance01: 1e-13 as const,
      parameterSearchOrFitting: false as const,
    }),
    "Land2017-Zc-Garcia-AA-d2p5cm-local-opening": Object.freeze({
      profileId: "Land2017-Zc-Garcia-AA-d2p5cm-local-opening" as const,
      valveId: "AoV" as const,
      characteristicResistancePlacementProfileId:
        "Land2017-characteristic-impedance-matched" as const,
      pressureRecoveryProfileId: "pressure-recovery-aa-d2p5cm" as const,
      openingDrivePressureStation:
        "LV-minus-proximal-constitutive-port" as const,
      coupledUnknowns: "leaflet-opening-and-algebraic-flow" as const,
      reducedSolve: "monotone-bisection-on-bounded-opening" as const,
      maximumBisectionIterations: 80 as const,
      openingResidualTolerance01: 1e-13 as const,
      parameterSearchOrFitting: false as const,
    }),
    "Land2017-Zc-Garcia-AA-d3p8cm-local-opening": Object.freeze({
      profileId: "Land2017-Zc-Garcia-AA-d3p8cm-local-opening" as const,
      valveId: "AoV" as const,
      characteristicResistancePlacementProfileId:
        "Land2017-characteristic-impedance-matched" as const,
      pressureRecoveryProfileId: "pressure-recovery-aa-d3p8cm" as const,
      openingDrivePressureStation:
        "LV-minus-proximal-constitutive-port" as const,
      coupledUnknowns: "leaflet-opening-and-algebraic-flow" as const,
      reducedSolve: "monotone-bisection-on-bounded-opening" as const,
      maximumBisectionIterations: 80 as const,
      openingResidualTolerance01: 1e-13 as const,
      parameterSearchOrFitting: false as const,
    }),
  } satisfies Readonly<Record<
    MainWireAorticRecoveredRootPortValveProfileIdV1,
    MainWireAorticRecoveredRootPortValveProfileV1
  >>);

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1 =
  Object.freeze({
    role: "exact-research-candidate-constitutive-port" as const,
    acceptedMemory: "leaflet-opening-fraction-only" as const,
    flowMemory: false as const,
    localValveInertance: false as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    rawNodePressureGradient:
      "LV-chamber-node-minus-Ao-compliance-node" as const,
    proximalConstitutivePortPressure:
      "Ao-compliance-node-plus-characteristic-impedance-times-signed-flow" as const,
    localValvePressureGradient:
      "raw-node-gradient-minus-characteristic-impedance-pressure" as const,
    openingDrivePressureStation:
      "LV-minus-proximal-constitutive-port" as const,
    forwardPressureLaw:
      "source-linear-valve-loss-plus-ELCo-irreversible-loss-plus-fixed-AA-kinetic-transport-plus-arterial-characteristic-load" as const,
    reversePressureLaw:
      "source-linear-valve-loss-plus-full-reverse-EROA-loss-plus-arterial-characteristic-load" as const,
    characteristicWaveLoadClassifiedAsValveDissipation: false as const,
    downstreamKineticTransportClassifiedAsValveDissipation: false as const,
    pressureRecoveryAppliedToReverseFlow: false as const,
    openingFlowCoupling:
      "backward-euler-opening-memory-and-algebraic-flow-solved-simultaneously" as const,
    coupledSolveUniqueness:
      "monotone-bounded-scalar-root-for-passive-positive-characteristic-load" as const,
    pressureOrFlowSmoothingAdded: false as const,
    parameterSearchOrFitting: false as const,
    clinicalMeasurementEquivalenceClaimed: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

type SharedValveEvaluationV2 = Omit<
  MainWireQuasiSteadyOrificeValveEvaluationV2,
  "modelId" | "claim"
>;

export type MainWireAorticRecoveredRootPortValveEvaluationV1 =
  SharedValveEvaluationV2 & Readonly<{
    modelId: typeof MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID;
    recoveredRootPortProfileId:
      MainWireAorticRecoveredRootPortValveProfileIdV1;
    characteristicResistancePlacementProfileId:
      MainWireAorticCharacteristicResistancePlacementProfileV1["profileId"];
    pressureRecoveryProfileId: MainWireAorticValveResearchProfileV1["profileId"];
    openingDrivePressureStation: "LV-minus-proximal-constitutive-port";
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
    recoveredStaticPressureMmHg: number;
    pressureRecoveryFraction01: number;
    claim: typeof MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_CLAIM_V1;
  }>;

export function resolveMainWireAorticRecoveredRootPortValveProfileV1(
  profileId: MainWireAorticRecoveredRootPortValveProfileIdV1,
): MainWireAorticRecoveredRootPortValveProfileV1 {
  const resolved =
    MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_PROFILES_V1[profileId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported recovered-root-port valve profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function validateMainWireAorticRecoveredRootPortValveProfileV1(
  value: MainWireAorticRecoveredRootPortValveProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze([
      "recovered-root-port valve profile must be an object",
    ]);
  }
  const expected =
    MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_PROFILES_V1[value.profileId];
  if (expected === undefined) {
    return Object.freeze([
      "recovered-root-port valve profileId is unsupported",
    ]);
  }
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push(
      "recovered-root-port valve profile fields differ from the fixed profile",
    );
  }
  for (const key of expectedKeys) {
    if (
      value[key as keyof MainWireAorticRecoveredRootPortValveProfileV1]
      !== expected[key as keyof MainWireAorticRecoveredRootPortValveProfileV1]
    ) {
      issues.push(
        `recovered-root-port valve profile ${key} differs from its fixed value`,
      );
    }
  }
  return Object.freeze(issues);
}

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
 * State-free aortic port composition. The only accepted valve memory remains
 * the bounded leaflet-opening fraction. For each pressure trial, opening and
 * algebraic flow are solved together so the opening target sees the local
 * LV-to-proximal-port pressure rather than the reservoir-node difference.
 */
export function stepMainWireAorticRecoveredRootPortValveScalarsV1(
  previousLeafletOpeningFraction01: number,
  dtSec: number,
  upstreamPressureMmHg: number,
  downstreamAorticComplianceNodePressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  placementProfile: MainWireAorticCharacteristicResistancePlacementProfileV1,
  pressureRecoveryProfile: MainWireAorticValveResearchProfileV1,
  recoveredRootPortProfile: MainWireAorticRecoveredRootPortValveProfileV1,
): MainWireAorticRecoveredRootPortValveEvaluationV1 {
  const issues = [
    ...validateMainWireQuasiSteadyOrificeValveParamsV2(params),
    ...validateMainWireAorticCharacteristicResistancePlacementProfileV1(
      placementProfile,
    ),
    ...validateMainWireAorticValveResearchProfileV1(pressureRecoveryProfile),
    ...validateMainWireAorticRecoveredRootPortValveProfileV1(
      recoveredRootPortProfile,
    ),
  ];
  if (params.valveId !== "AoV") {
    issues.push("recovered-root-port valve profile requires valveId AoV");
  }
  if (
    placementProfile.profileId
      !== recoveredRootPortProfile.characteristicResistancePlacementProfileId
  ) {
    issues.push(
      "recovered-root-port profile requires its fixed characteristic-resistance placement",
    );
  }
  if (
    pressureRecoveryProfile.profileId
      !== recoveredRootPortProfile.pressureRecoveryProfileId
    || pressureRecoveryProfile.openingMode
      !== "bounded-backward-euler-memory"
    || pressureRecoveryProfile.forwardConvectivePressureMode
      !== "garcia-energy-loss-plus-downstream-kinetic-flux"
  ) {
    issues.push(
      "recovered-root-port profile requires bounded-memory Garcia pressure recovery",
    );
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
  const ascendingAorticAreaCm2 =
    pressureRecoveryProfile.ascendingAorticAreaCm2;
  if (
    ascendingAorticAreaCm2 === null
    || !(ascendingAorticAreaCm2 > params.maximumForwardEoaCm2)
    || !Number.isFinite(ascendingAorticAreaCm2)
  ) {
    issues.push(
      "recovered-root-port pressure recovery requires fixed ascending-aortic area greater than maximum forward EOA",
    );
  }
  const characteristicImpedanceResistanceMmHgSecPerMl =
    placementProfile.upstreamValveLinearResistanceAdditionMmHgSecPerMl;
  if (
    !(characteristicImpedanceResistanceMmHgSecPerMl > 0)
    || !Number.isFinite(
      characteristicImpedanceResistanceMmHgSecPerMl,
    )
  ) {
    issues.push(
      "recovered-root-port coupling requires positive finite characteristic impedance",
    );
  }
  if (issues.length > 0) {
    return invalidEvaluation(
      previousLeafletOpeningFraction01,
      upstreamPressureMmHg,
      downstreamAorticComplianceNodePressureMmHg,
      params,
      placementProfile,
      pressureRecoveryProfile,
      recoveredRootPortProfile,
      issues,
    );
  }

  const rawNodePressureGradientMmHg =
    upstreamPressureMmHg - downstreamAorticComplianceNodePressureMmHg;
  const activeDirection = directionFromGradient(rawNodePressureGradientMmHg);
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
    const convective =
      evaluateMainWireAorticValveForwardConvectiveCoefficientsV1(
        activeEoaCm2,
        pressureRecoveryProfile,
        activeDirection !== "reverse",
      );
    const flowMlPerSec = activeEoaCm2 === 0
      ? 0
      : solveExactSignedLinearQuadraticValveFlowV2(
        rawNodePressureGradientMmHg,
        sourceValveLinearResistanceMmHgSecPerMl
          + characteristicImpedanceResistanceMmHgSecPerMl,
        convective.portConvectivePressureMmHgSec2PerMl2,
      );
    const localValvePressureGradientMmHg = rawNodePressureGradientMmHg
      - characteristicImpedanceResistanceMmHgSecPerMl * flowMlPerSec;
    const openingTarget01 =
      evaluateMainWireValveOpeningTargetAndTangentV2(
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
      venaContractaBernoulliMmHgSec2PerMl2:
        convective.venaContractaBernoulliMmHgSec2PerMl2,
      irreversibleBernoulliMmHgSec2PerMl2:
        convective.irreversibleBernoulliMmHgSec2PerMl2,
      downstreamKineticMmHgSec2PerMl2:
        convective.downstreamKineticMmHgSec2PerMl2,
      portConvectivePressureMmHgSec2PerMl2:
        convective.portConvectivePressureMmHgSec2PerMl2,
      energyLossCoefficientAreaCm2:
        convective.energyLossCoefficientAreaCm2,
      pressureRecoveryFraction01: convective.pressureRecoveryFraction01,
    });
  };

  let point: CoupledOpeningPointV1;
  let openingCouplingIterationCount = 0;
  if (activeDirection !== "forward") {
    // Reverse-flow area is independent of opening, while zero-gradient flow
    // is exactly zero. Their BE update is therefore explicit.
    const probe = evaluateOpening(previousLeafletOpeningFraction01);
    point = evaluateOpening(probe.backwardEulerOpening01);
  } else {
    let lower = 0;
    let upper = 1;
    let lowerPoint = evaluateOpening(lower);
    let upperPoint = evaluateOpening(upper);
    if (
      lowerPoint.openingResidual01
        > recoveredRootPortProfile.openingResidualTolerance01
      || upperPoint.openingResidual01
        < -recoveredRootPortProfile.openingResidualTolerance01
    ) {
      return invalidEvaluation(
        previousLeafletOpeningFraction01,
        upstreamPressureMmHg,
        downstreamAorticComplianceNodePressureMmHg,
        params,
        placementProfile,
        pressureRecoveryProfile,
        recoveredRootPortProfile,
        ["coupled opening root is not bracketed on [0, 1]"],
      );
    }
    point = lowerPoint.openingResidual01 === 0
      ? lowerPoint
      : upperPoint;
    if (
      lowerPoint.openingResidual01 !== 0
      && upperPoint.openingResidual01 !== 0
    ) {
      for (
        let iteration = 1;
        iteration <= recoveredRootPortProfile.maximumBisectionIterations;
        iteration += 1
      ) {
        const midpoint = 0.5 * (lower + upper);
        if (midpoint === lower || midpoint === upper) break;
        point = evaluateOpening(midpoint);
        openingCouplingIterationCount = iteration;
        if (
          Math.abs(point.openingResidual01)
            <= recoveredRootPortProfile.openingResidualTolerance01
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
    Math.abs(point.openingResidual01)
      > recoveredRootPortProfile.openingResidualTolerance01
  ) {
    return invalidEvaluation(
      previousLeafletOpeningFraction01,
      upstreamPressureMmHg,
      downstreamAorticComplianceNodePressureMmHg,
      params,
      placementProfile,
      pressureRecoveryProfile,
      recoveredRootPortProfile,
      ["coupled opening solve did not converge to its fixed tolerance"],
    );
  }

  const leafletOpeningFraction01 = point.opening01;
  const flowMlPerSec = point.flowMlPerSec;
  const activeEoaCm2 = point.activeEoaCm2;
  const signedQuadraticFlow = flowMlPerSec * Math.abs(flowMlPerSec);
  const targetAndTangent = evaluateMainWireValveOpeningTargetAndTangentV2(
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
        * (1 / activeEoaCm2 - 1 / ascendingAorticAreaCm2!)
        / activeEoaCm2 ** 2
      : -2 * point.portConvectivePressureMmHgSec2PerMl2
        / activeEoaCm2;
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
    && (
      !Number.isFinite(tangentDenominator)
      || !(tangentDenominator > 0)
    )
  ) {
    return invalidEvaluation(
      previousLeafletOpeningFraction01,
      upstreamPressureMmHg,
      downstreamAorticComplianceNodePressureMmHg,
      params,
      placementProfile,
      pressureRecoveryProfile,
      recoveredRootPortProfile,
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
    dLeafletOpeningFractionDPressureGradientPerMmHg = 0;
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
  const recoveredStaticPressureMmHg = activeDirection === "forward"
    ? venaContractaBernoulliPressureMmHg
      - (
        netIrreversibleBernoulliPressureMmHg
        + downstreamKineticPressureMmHg
      )
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
    recoveredRootPortProfileId: recoveredRootPortProfile.profileId,
    characteristicResistancePlacementProfileId: placementProfile.profileId,
    pressureRecoveryProfileId: pressureRecoveryProfile.profileId,
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
    openingDrivePressureStation:
      recoveredRootPortProfile.openingDrivePressureStation,
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
    ascendingAorticAreaCm2: ascendingAorticAreaCm2!,
    venaContractaBernoulliMmHgSec2PerMl2:
      point.venaContractaBernoulliMmHgSec2PerMl2,
    venaContractaBernoulliPressureMmHg,
    portConvectivePressureMmHgSec2PerMl2:
      point.portConvectivePressureMmHgSec2PerMl2,
    netIrreversibleBernoulliPressureMmHg,
    downstreamKineticPressureMmHg,
    downstreamKineticPowerMmHgMlPerSec,
    recoveredStaticPressureMmHg,
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
        "recovered-root-port valve evaluation is non-finite",
      ]),
    });
}

function invalidEvaluation(
  previousLeafletOpeningFraction01: number,
  upstreamPressureMmHg: number,
  downstreamPressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  placementProfile: MainWireAorticCharacteristicResistancePlacementProfileV1,
  pressureRecoveryProfile: MainWireAorticValveResearchProfileV1,
  recoveredRootPortProfile: MainWireAorticRecoveredRootPortValveProfileV1,
  issues: readonly string[],
): MainWireAorticRecoveredRootPortValveEvaluationV1 {
  const nan = Number.NaN;
  return Object.freeze({
    modelId: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID,
    recoveredRootPortProfileId: recoveredRootPortProfile.profileId,
    characteristicResistancePlacementProfileId: placementProfile.profileId,
    pressureRecoveryProfileId: pressureRecoveryProfile.profileId,
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
    leafletMechanicalContactModeled: false,
    reverseRegurgitantFlowEnabled: params.closedReverseEroaCm2 > 0,
    openingDrivePressureStation: "LV-minus-proximal-constitutive-port" as const,
    openingCouplingIterationCount: 0,
    openingCouplingResidual01: nan,
    sourceValveLinearResistanceMmHgSecPerMl: nan,
    characteristicImpedanceResistanceMmHgSecPerMl:
      placementProfile.upstreamValveLinearResistanceAdditionMmHgSecPerMl,
    characteristicImpedancePressureMmHg: nan,
    characteristicWaveLoadPowerMmHgMlPerSec: nan,
    aorticComplianceNodePressureMmHg: downstreamPressureMmHg,
    algebraicProximalConstitutivePortPressureMmHg: nan,
    localValvePressureGradientMmHg: nan,
    energyLossCoefficientAreaCm2: nan,
    ascendingAorticAreaCm2:
      pressureRecoveryProfile.ascendingAorticAreaCm2 ?? nan,
    venaContractaBernoulliMmHgSec2PerMl2: nan,
    venaContractaBernoulliPressureMmHg: nan,
    portConvectivePressureMmHgSec2PerMl2: nan,
    netIrreversibleBernoulliPressureMmHg: nan,
    downstreamKineticPressureMmHg: nan,
    downstreamKineticPowerMmHgMlPerSec: nan,
    recoveredStaticPressureMmHg: nan,
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
    && Number.isFinite(value.sourceValveLinearResistanceMmHgSecPerMl)
    && Number.isFinite(
      value.characteristicImpedanceResistanceMmHgSecPerMl,
    )
    && Number.isFinite(value.characteristicImpedancePressureMmHg)
    && Number.isFinite(value.characteristicWaveLoadPowerMmHgMlPerSec)
    && Number.isFinite(value.aorticComplianceNodePressureMmHg)
    && Number.isFinite(value.energyLossCoefficientAreaCm2)
    && Number.isFinite(value.ascendingAorticAreaCm2)
    && Number.isFinite(value.venaContractaBernoulliMmHgSec2PerMl2)
    && Number.isFinite(value.venaContractaBernoulliPressureMmHg)
    && Number.isFinite(value.portConvectivePressureMmHgSec2PerMl2)
    && Number.isFinite(value.netIrreversibleBernoulliPressureMmHg)
    && Number.isFinite(value.downstreamKineticPressureMmHg)
    && Number.isFinite(value.downstreamKineticPowerMmHgMlPerSec)
    && Number.isFinite(value.recoveredStaticPressureMmHg)
    && Number.isFinite(value.pressureRecoveryFraction01)
    && Number.isFinite(value.powerBalanceResidualMmHgMlPerSec)
    && Number.isFinite(value.openingCouplingResidual01)
    && Number.isFinite(value.localValvePressureGradientMmHg)
    && Number.isFinite(
      value.algebraicProximalConstitutivePortPressureMmHg,
    );
}
