import {
  runMechanisticAtrialProfileV1,
  type MechanisticAtrialProfileResultV1,
  type MechanisticAtrialSampleV1,
} from "@/engine/mechanics2/benches/MechanisticAtrialOneFiberBench";
import {
  DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1,
  type OneFiberAVPlaneLeftHeartParamsV1,
} from "@/engine/mechanics2/subsystems/OneFiberAVPlaneLeftHeartV1";

export const ATRIAL_AV_PLANE_PASSIVE_BALANCE_REPORT_ID_V2 =
  "atrial-av-plane-passive-balance-report-v2" as const;

export type AtrialAVPlanePassiveBalanceVariantIdV2 =
  | "v1-baseline"
  | "passive-balance"
  | "passive-balance-la-contractility-bracket"
  | "topology-only-comparator"
  | "k0-negative-control"
  | "passive-neutral-shift-control";

export type AtrialAVPlanePrimeReadbackV2 = {
  readonly sPrimeCmPerSec: number;
  readonly ePrimeCmPerSec: number;
  readonly aPrimeCmPerSec: number;
  readonly aPrimeBasewardCmPerSec: number;
  readonly aPrimeApexwardCmPerSec: number;
  readonly aPrimeDominantDirection: "baseward" | "apexward" | "balanced";
};

export type AtrialAVPlaneForcePointV2 = {
  readonly diagnosticRole: "legacy-best-point-not-acceptance";
  readonly theta: number;
  readonly positionCm: number;
  readonly velocityCmPerSec: number;
  readonly mitralFlowMlPerSec: number;
  readonly mitralFlowFractionOfPeak: number;
  readonly ventricularActiveForceN: number;
  readonly atrialActiveForceN: number;
  readonly hydraulicForceN: number;
  readonly springForceN: number;
  readonly dampingForceN: number;
  readonly inertialForceN: number;
  readonly quasiStaticResidualN: number;
  readonly fullDynamicResidualN: number;
  readonly quasiStaticAvPlanePass: boolean;
};

export type AtrialAVPlaneWindowApplicabilityReasonV2 =
  | "measurable"
  | "insufficient-conduit-window"
  | "insufficient-samples"
  | "insufficient-duration"
  | "activation-overlap";

export type AtrialAVPlaneWindowSignedForceStatsV2 = {
  readonly median: number;
  readonly medianAbs: number;
  readonly p95Abs: number;
  readonly maxAbs: number;
};

export type AtrialAVPlaneWindowAbsStatsV2 = {
  readonly median: number;
  readonly p95: number;
  readonly max: number;
};

export type AtrialAVPlaneLateDiastolicWindowReadbackV2 = {
  readonly diagnosticRole: "predeclared-continuous-late-diastolic-window";
  readonly applicability: "measurable" | "not-applicable";
  readonly applicabilityReason: AtrialAVPlaneWindowApplicabilityReasonV2;
  readonly targetDurationSec: number;
  readonly minimumDurationSec: number;
  readonly minimumSampleCount: number;
  readonly sampleCount: number;
  readonly durationSec: number;
  readonly tStartSec: number;
  readonly tEndSec: number;
  readonly thetaStart: number;
  readonly thetaEnd: number;
  readonly preATheta: number;
  readonly peakMitralFlowMlPerSec: number;
  readonly mitralFlowFractionOfPeak: AtrialAVPlaneWindowAbsStatsV2;
  readonly velocityAbsCmPerSec: AtrialAVPlaneWindowAbsStatsV2;
  readonly hydraulicForceN: AtrialAVPlaneWindowSignedForceStatsV2;
  readonly springForceN: AtrialAVPlaneWindowSignedForceStatsV2;
  readonly dampingForceAbsN: AtrialAVPlaneWindowAbsStatsV2;
  readonly inertialForceAbsN: AtrialAVPlaneWindowAbsStatsV2;
  readonly quasiStaticResidualAbsN: AtrialAVPlaneWindowAbsStatsV2;
  readonly fullDynamicResidualAbsN: AtrialAVPlaneWindowAbsStatsV2;
  readonly dynamicToHydraulicForceRatio: AtrialAVPlaneWindowAbsStatsV2;
  readonly passiveHydraulicMedianOpposed: boolean;
  readonly passiveHydraulicOpposedSampleFraction: number;
  readonly quasiStaticAvPlanePass: boolean;
};

export const ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2 = {
  observation: {
    avpdRangeCm: [0.8, 1.8] as const,
    sPrimeRangeCmPerSec: [5, 15] as const,
    ePrimeRangeCmPerSec: [4, 15] as const,
    minimumXDepthGainMmHg: 0.5,
    minimumStrokeVolumeRatioToV1: 0.9,
    minimumCardiacOutputRatioToV1: 0.9,
    minimumAPrimeMagnitudeRatioToV1: 0.5,
    role: "engineering-observation-readback-not-clinical-normal-range",
  },
  lateDiastolicWindow: {
    targetDurationSec: 0.035,
    minimumDurationSec: 0.030,
    maximumDurationSec: 0.040,
    preActivationGuardSec: 0.001,
    minimumSampleCount: 20,
    activationCeiling01: 0.05,
    maxAbsVelocityCmPerSec: 0.1,
    maxMitralFlowFractionOfPeak: 0.1,
    maxAbsDampingForceN: 1,
    maxAbsInertialForceN: 1,
    maxAbsQuasiStaticResidualN: 1,
    maxDynamicToHydraulicForceRatioP95: 1.25,
    minimumPassiveHydraulicOpposedFraction: 0.95,
    medianAbsHydraulicForceRangeN: [1, 3] as const,
    role: "engineering-late-diastolic-mechanics-window-not-literature-normal-range",
  },
  pressureSanity: {
    peakLaPressureCeilingMmHg: 30,
    role: "engineering-pressure-sanity-not-clinical-cutoff",
  },
  mitralWave: {
    peakEToARange: [0.69, 2.07] as const,
  },
  bloodVolumeTopologyEngineering: {
    minimumTrueLobeIntersectionAngleDeg: 10,
    minimumConduitBeforeCrossingBelowReservoirPathFraction: 0.95,
    minimumPumpingAfterCrossingAboveReservoirPathFraction: 0.95,
    minimumALoopAreaMmHgMl: 5,
    minimumVLoopAreaMmHgMl: 10,
    maximumReservoirSecondaryPeakCount: 1,
    requireTrueLobePhaseCrossingMatch: true,
    role: "engineering-anti-degeneracy-diagnostic-not-clinical-cutoff",
  },
} as const;

export const AV_PLANE_DIASTASIS_THRESHOLDS_V2 =
  ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.lateDiastolicWindow;

export type AtrialAVPlanePassiveBalanceAcceptanceFlagsV2 = {
  readonly numericalPass: boolean;
  readonly conservationPass: boolean;
  readonly avpdPass: boolean;
  readonly sPrimePass: boolean;
  readonly ePrimePass: boolean;
  readonly xDepthGainPass: boolean;
  readonly nonCollapsePass: boolean;
  readonly aPrimeMagnitudeNonCollapsePass: boolean;
  readonly pressureSanityPass: boolean;
  readonly candidateObservationPass: boolean;
  readonly lobeMeasurementPass: boolean;
  readonly opposedLobeOrientationPass: boolean;
  readonly trueLobeIntersectionAnglePass: boolean;
  readonly trueLobePhaseCrossingMatchPass: boolean;
  readonly legacyPhaseCrossingWindowPass: boolean;
  readonly pathOrdering95Pass: boolean;
  readonly loopAreaFloorPass: boolean;
  readonly reservoirSecondaryPeakPass: boolean;
  readonly bloodVolumeTopologyEngineeringPass: boolean;
  readonly mitralWavePass: boolean;
  readonly lateDiastolicWindowApplicablePass: boolean;
  readonly lateDiastolicQuasiStaticPass: boolean;
  readonly lateDiastolicOpposedForcePass: boolean;
  readonly lateDiastolicHydraulicMagnitudePass: boolean;
  readonly lateDiastolicResidualPass: boolean;
  readonly lateDiastolicDynamicRatioPass: boolean;
  readonly mechanicsPass: boolean;
  readonly jointCandidatePass: boolean;
};

export type AtrialAVPlanePassiveBalanceVariantV2 = {
  readonly variantId: AtrialAVPlanePassiveBalanceVariantIdV2;
  readonly role:
    | "historical-control"
    | "mechanistic-candidate"
    | "physiologic-parameter-bracket"
    | "morphology-comparator"
    | "negative-control"
    | "identifiability-control";
  readonly params: OneFiberAVPlaneLeftHeartParamsV1;
  readonly profile: Omit<MechanisticAtrialProfileResultV1, "samples">;
  readonly prime: AtrialAVPlanePrimeReadbackV2;
  readonly diastasis: AtrialAVPlaneForcePointV2;
  readonly lateDiastolicWindow: AtrialAVPlaneLateDiastolicWindowReadbackV2;
  readonly acceptanceFlags?: AtrialAVPlanePassiveBalanceAcceptanceFlagsV2;
  readonly forceRangesN: {
    readonly ventricularActive: readonly [number, number];
    readonly atrialActive: readonly [number, number];
    readonly hydraulic: readonly [number, number];
    readonly spring: readonly [number, number];
    readonly damping: readonly [number, number];
    readonly inertial: readonly [number, number];
  };
};

export type AtrialAVPlanePassiveBalanceEnvelopeCaseV2 = {
  readonly caseId: string;
  readonly axis: "dt" | "heart-rate" | "preload" | "afterload" | "la-stiffness";
  readonly profile: Omit<MechanisticAtrialProfileResultV1, "samples">;
};

export type AtrialAVPlanePassiveBalanceReportV2 = {
  readonly reportId: typeof ATRIAL_AV_PLANE_PASSIVE_BALANCE_REPORT_ID_V2;
  readonly acceptanceDefinition: typeof ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2;
  readonly model: {
    readonly atrialBloodVolumeOwner: "Q_PV-minus-Q_MV";
    readonly geometryReference: "wall-deformation-only";
    readonly passiveNeutral: "spring-force-only";
    readonly activeForceSource: "same-one-fiber-active-wall-stress";
    readonly forbiddenPressureHooks: readonly ["P_mem", "P_relief", "P_LV_recv"];
    readonly addedStateCount: 0;
  };
  readonly variants: readonly AtrialAVPlanePassiveBalanceVariantV2[];
  readonly envelope: readonly AtrialAVPlanePassiveBalanceEnvelopeCaseV2[];
  readonly gates: {
    readonly numericalPass: boolean;
    readonly conservationPass: boolean;
    readonly dtParityPass: boolean;
    readonly passiveCandidateObservationPass: boolean;
    readonly passiveCandidateNonCollapsePass: boolean;
    readonly passiveCandidateAPrimeMagnitudeNonCollapsePass: boolean;
    readonly diastaticPassiveHydraulicOppositionPass: boolean;
    readonly passiveCandidateBloodVolumeTopologyPass: boolean;
    readonly passiveCandidateMitralWavePass: boolean;
    readonly laContractilityBracketMitralPass: boolean;
    readonly laContractilityBracketBloodVolumeTopologyPass: boolean;
    readonly jointMechanisticCandidatePass: boolean;
    readonly k0NegativeControlRetained: boolean;
    readonly passiveNeutralIdentifiabilityWarningPresent: boolean;
  };
  readonly negativeControlDiagnostics: {
    readonly k0ZeroStiffnessPass: boolean;
    readonly k0ZeroSpringForcePass: boolean;
    readonly k0NonPeriodicPass: boolean;
    readonly k0ClosureDriftMl: number;
    readonly k0ClosureDriftPass: boolean;
    readonly k0AllStepsConverged: boolean;
    readonly k0SolverFailureObserved: boolean;
    readonly k0MaxAbsAvPlaneForceResidualN: number;
    readonly k0MaxNonlinearResidual: number;
  };
  readonly supportingEvidence: {
    readonly activeForceProjectionWithinPublishedInputBracket: boolean;
    readonly ventricularActiveForceBracketN: readonly [60, 130];
    readonly atrialActiveForceBracketN: readonly [10, 25];
    readonly role: "non-blocking-model-input-comparison";
  };
  readonly comparisons: {
    readonly passiveCandidateXDepthGainMmHg: number;
    readonly passiveCandidateAvpdGainCm: number;
    readonly passiveCandidatePeakVelocityGainCmPerSec: number;
    readonly passiveCandidateStrokeVolumeRatioToV1: number;
    readonly passiveCandidateCardiacOutputRatioToV1: number;
    readonly passiveCandidateAPrimeMagnitudeRatioToV1: number;
    readonly passiveCandidatePeakVentricularActiveForceRatioToV1: number;
    readonly contractilityBracketALoopGainMmHgMl: number;
    readonly neutralShiftShapeMaxRelativeDifference: number;
    readonly neutralShiftLaVolumeMidpointChangeMl: number;
  };
  readonly envelopeDiagnostics: {
    readonly allNumerical: boolean;
    readonly morphologyPassCount: number;
    readonly caseCount: number;
    readonly dtRelativeErrors: Readonly<Record<string, number>>;
    readonly directionalChecks: Readonly<Record<string, boolean>>;
  };
  readonly decision: {
    readonly status: "mechanistic-tradeoff-no-joint-candidate";
    readonly acceptedFinding: string;
    readonly rejectedShortcut: string;
    readonly nextAction: string;
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly defaultSelection: false;
    readonly fullFourChamberValidation: false;
    readonly patientSpecificIdentifiability: false;
  };
};

type VariantSpec = {
  readonly variantId: AtrialAVPlanePassiveBalanceVariantIdV2;
  readonly role: AtrialAVPlanePassiveBalanceVariantV2["role"];
  readonly params: OneFiberAVPlaneLeftHeartParamsV1;
};

type EnvelopeSpec = {
  readonly caseId: string;
  readonly axis: AtrialAVPlanePassiveBalanceEnvelopeCaseV2["axis"];
  readonly params?: OneFiberAVPlaneLeftHeartParamsV1;
  readonly heartRateBpm?: number;
  readonly dtSec?: number;
};

const base = DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1;

export const PASSIVE_BALANCE_PARAMS_V2: OneFiberAVPlaneLeftHeartParamsV1 = {
  ...base,
  avPlane: {
    ...base.avPlane,
    passiveNeutralPositionCm: base.avPlane.referencePositionCm,
    inertiaNSec2PerCm: 0.3,
    dampingNSecPerCm: 8,
    stiffnessNPerCm: 80,
  },
};

export const PASSIVE_BALANCE_LA_CONTRACTILITY_BRACKET_PARAMS_V2:
OneFiberAVPlaneLeftHeartParamsV1 = {
  ...PASSIVE_BALANCE_PARAMS_V2,
  laWall: { ...PASSIVE_BALANCE_PARAMS_V2.laWall, activeStressMaxKPa: 12 },
};

export const MORPHOLOGY_RETAINED_COMPARATOR_PARAMS_V2:
OneFiberAVPlaneLeftHeartParamsV1 = {
  ...base,
  avPlane: {
    ...base.avPlane,
    passiveNeutralPositionCm: base.avPlane.referencePositionCm,
    inertiaNSec2PerCm: 0.5,
    dampingNSecPerCm: 16,
    stiffnessNPerCm: 80,
  },
};

const variantSpecs: readonly VariantSpec[] = [
  { variantId: "v1-baseline", role: "historical-control", params: base },
  {
    variantId: "passive-balance",
    role: "mechanistic-candidate",
    params: PASSIVE_BALANCE_PARAMS_V2,
  },
  {
    variantId: "passive-balance-la-contractility-bracket",
    role: "physiologic-parameter-bracket",
    params: PASSIVE_BALANCE_LA_CONTRACTILITY_BRACKET_PARAMS_V2,
  },
  {
    variantId: "topology-only-comparator",
    role: "morphology-comparator",
    params: MORPHOLOGY_RETAINED_COMPARATOR_PARAMS_V2,
  },
  {
    variantId: "k0-negative-control",
    role: "negative-control",
    params: {
      ...PASSIVE_BALANCE_PARAMS_V2,
      avPlane: { ...PASSIVE_BALANCE_PARAMS_V2.avPlane, stiffnessNPerCm: 0 },
    },
  },
  {
    variantId: "passive-neutral-shift-control",
    role: "identifiability-control",
    params: {
      ...PASSIVE_BALANCE_PARAMS_V2,
      avPlane: {
        ...PASSIVE_BALANCE_PARAMS_V2.avPlane,
        passiveNeutralPositionCm: 1,
      },
    },
  },
];

export function runAtrialAVPlanePassiveBalanceTracesV2(): readonly {
  readonly variantId: AtrialAVPlanePassiveBalanceVariantIdV2;
  readonly result: MechanisticAtrialProfileResultV1;
}[] {
  return variantSpecs.map((spec) => ({
    variantId: spec.variantId,
    result: runMechanisticAtrialProfileV1({
      profileId: spec.variantId,
      params: spec.params,
    }),
  }));
}

export function runAtrialAVPlanePassiveBalanceBenchV2():
AtrialAVPlanePassiveBalanceReportV2 {
  const traces = runAtrialAVPlanePassiveBalanceTracesV2();
  const trace = (variantId: AtrialAVPlanePassiveBalanceVariantIdV2) =>
    traces.find((row) => row.variantId === variantId)!.result;
  const variants = variantSpecs.map((spec) => summarizeVariant(
    spec,
    trace(spec.variantId),
  ));
  const summary = (variantId: AtrialAVPlanePassiveBalanceVariantIdV2) =>
    variants.find((row) => row.variantId === variantId)!;
  const baseline = summary("v1-baseline");
  const passive = summary("passive-balance");
  const bracket = summary("passive-balance-la-contractility-bracket");
  const k0 = summary("k0-negative-control");
  const neutralShift = summary("passive-neutral-shift-control");
  const passiveAcceptance = evaluateAtrialAVPlanePassiveBalanceAcceptanceV2({
    profile: passive.profile,
    prime: passive.prime,
    lateDiastolicWindow: passive.lateDiastolicWindow,
    baselineProfile: baseline.profile,
    baselinePrime: baseline.prime,
  });
  const bracketAcceptance = evaluateAtrialAVPlanePassiveBalanceAcceptanceV2({
    profile: bracket.profile,
    prime: bracket.prime,
    lateDiastolicWindow: bracket.lateDiastolicWindow,
    baselineProfile: baseline.profile,
    baselinePrime: baseline.prime,
  });
  const envelopeTraces = runEnvelopeTraces();
  const envelope = envelopeTraces.map(({ result, ...row }) => ({
    ...row,
    profile: stripSamples(result),
  }));
  const numericalRows = variants.filter((row) => row.variantId !== "k0-negative-control");
  const numericalPass = numericalRows.every((row) => numericallyValid(row.profile));
  const conservationPass = numericalRows.every((row) => conserved(row.profile));
  const passiveCandidateObservationPass =
    passiveAcceptance.candidateObservationPass;
  const activeForceProjectionWithinPublishedInputBracket =
    passive.forceRangesN.ventricularActive[1] >= 60 &&
    passive.forceRangesN.ventricularActive[1] <= 130 &&
    passive.forceRangesN.atrialActive[1] >= 10 &&
    passive.forceRangesN.atrialActive[1] <= 25;
  const diastaticPassiveHydraulicOppositionPass =
    passiveAcceptance.mechanicsPass;
  const passiveCandidateBloodVolumeTopologyPass =
    passiveAcceptance.bloodVolumeTopologyEngineeringPass;
  const passiveCandidateMitralWavePass = passiveAcceptance.mitralWavePass;
  const laContractilityBracketMitralPass = bracketAcceptance.mitralWavePass;
  const laContractilityBracketBloodVolumeTopologyPass =
    bracketAcceptance.bloodVolumeTopologyEngineeringPass;
  const jointMechanisticCandidatePass = passiveAcceptance.jointCandidatePass;
  const k0Diagnostics = k0NegativeControlDiagnostics(
    k0,
    trace("k0-negative-control"),
  );
  const dtRelativeErrors = envelopeDtErrors(envelope);
  const dtParityPass = Object.values(dtRelativeErrors).every((value) => value <= 0.08);
  const envelopeDiagnostics = {
    allNumerical: envelope.every((row) => numericallyValid(row.profile)),
    morphologyPassCount: envelope.filter((row) => bloodVolumeTopologyPass(row.profile)).length,
    caseCount: envelope.length,
    dtRelativeErrors,
    directionalChecks: envelopeDirectionalChecks(envelope),
  };
  const neutralShapeDifference = maxRelativeDifference([
    [passive.profile.xDescentDepthMmHg, neutralShift.profile.xDescentDepthMmHg],
    [passive.profile.yDescentDepthMmHg, neutralShift.profile.yDescentDepthMmHg],
    [passive.profile.avPlaneDisplacementCm, neutralShift.profile.avPlaneDisplacementCm],
    [passive.profile.mitralPeakVelocityEToARatio,
      neutralShift.profile.mitralPeakVelocityEToARatio],
    [passive.profile.aLoopAreaMmHgMl, neutralShift.profile.aLoopAreaMmHgMl],
    [passive.profile.vLoopAreaMmHgMl, neutralShift.profile.vLoopAreaMmHgMl],
  ]);
  const neutralVolumeMidpointChange = midpoint(neutralShift.profile.volumeRangeLaMl) -
    midpoint(passive.profile.volumeRangeLaMl);
  return {
    reportId: ATRIAL_AV_PLANE_PASSIVE_BALANCE_REPORT_ID_V2,
    acceptanceDefinition: ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2,
    model: {
      atrialBloodVolumeOwner: "Q_PV-minus-Q_MV",
      geometryReference: "wall-deformation-only",
      passiveNeutral: "spring-force-only",
      activeForceSource: "same-one-fiber-active-wall-stress",
      forbiddenPressureHooks: ["P_mem", "P_relief", "P_LV_recv"],
      addedStateCount: 0,
    },
    variants,
    envelope,
    gates: {
      numericalPass,
      conservationPass,
      dtParityPass,
      passiveCandidateObservationPass,
      passiveCandidateNonCollapsePass: passiveAcceptance.nonCollapsePass,
      passiveCandidateAPrimeMagnitudeNonCollapsePass:
        passiveAcceptance.aPrimeMagnitudeNonCollapsePass,
      diastaticPassiveHydraulicOppositionPass,
      passiveCandidateBloodVolumeTopologyPass,
      passiveCandidateMitralWavePass,
      laContractilityBracketMitralPass,
      laContractilityBracketBloodVolumeTopologyPass,
      jointMechanisticCandidatePass,
      k0NegativeControlRetained: k0Diagnostics.k0ZeroStiffnessPass &&
        k0Diagnostics.k0ZeroSpringForcePass &&
        k0Diagnostics.k0NonPeriodicPass &&
        k0Diagnostics.k0ClosureDriftPass,
      passiveNeutralIdentifiabilityWarningPresent:
        neutralShapeDifference <= 0.10 && Math.abs(neutralVolumeMidpointChange) >= 10,
    },
    negativeControlDiagnostics: k0Diagnostics,
    supportingEvidence: {
      activeForceProjectionWithinPublishedInputBracket,
      ventricularActiveForceBracketN: [60, 130],
      atrialActiveForceBracketN: [10, 25],
      role: "non-blocking-model-input-comparison",
    },
    comparisons: {
      passiveCandidateXDepthGainMmHg: rounded(
        passive.profile.xDescentDepthMmHg - baseline.profile.xDescentDepthMmHg,
      ),
      passiveCandidateAvpdGainCm: rounded(
        passive.profile.avPlaneDisplacementCm - baseline.profile.avPlaneDisplacementCm,
      ),
      passiveCandidatePeakVelocityGainCmPerSec: rounded(
        passive.profile.peakAvPlaneVelocityCmPerSec -
        baseline.profile.peakAvPlaneVelocityCmPerSec,
      ),
      passiveCandidateStrokeVolumeRatioToV1: rounded(
        passive.profile.strokeVolumeMl / Math.max(baseline.profile.strokeVolumeMl, 1e-9),
      ),
      passiveCandidateCardiacOutputRatioToV1: rounded(
        passive.profile.cardiacOutputLPerMin /
        Math.max(baseline.profile.cardiacOutputLPerMin, 1e-9),
      ),
      passiveCandidateAPrimeMagnitudeRatioToV1: rounded(
        passive.prime.aPrimeCmPerSec / Math.max(baseline.prime.aPrimeCmPerSec, 1e-9),
      ),
      passiveCandidatePeakVentricularActiveForceRatioToV1: rounded(
        passive.forceRangesN.ventricularActive[1] /
        Math.max(baseline.forceRangesN.ventricularActive[1], 1e-9),
      ),
      contractilityBracketALoopGainMmHgMl: rounded(
        bracket.profile.aLoopAreaMmHgMl - passive.profile.aLoopAreaMmHgMl,
      ),
      neutralShiftShapeMaxRelativeDifference: rounded(neutralShapeDifference),
      neutralShiftLaVolumeMidpointChangeMl: rounded(neutralVolumeMidpointChange),
    },
    envelopeDiagnostics,
    decision: {
      status: "mechanistic-tradeoff-no-joint-candidate",
      acceptedFinding: "Replacing V1 damper-dominant restraint with an underdamped elastic balance preserves an opposed late-diastolic passive/hydraulic signal and improves AVPD, early prime velocity, and x descent without adding a state; the continuous window exposes dynamic-force contamination, and the V1-relative a-prime magnitude collapses, so this is not an observation or diastasis acceptance.",
      rejectedShortcut: "The passive-neutral coordinate and atrial contractility are not accepted as shape-fitting knobs: neutral shifts are weakly identifiable, and the contractility bracket repairs E/A while the blood-volume topology still fails engineering anti-degeneracy diagnostics.",
      nextAction: "Measure or constrain absolute chamber volumes and AV-plane coordinates in the full circulation, then test whether valve/receiver loading resolves conduit ordering before changing the wall law or adding state.",
    },
    claimBoundary: {
      runtimeWiring: false,
      defaultSelection: false,
      fullFourChamberValidation: false,
      patientSpecificIdentifiability: false,
    },
  };
}

function summarizeVariant(
  spec: VariantSpec,
  result: MechanisticAtrialProfileResultV1,
): AtrialAVPlanePassiveBalanceVariantV2 {
  const samples = result.samples;
  return {
    variantId: spec.variantId,
    role: spec.role,
    params: spec.params,
    profile: stripSamples(result),
    prime: atrialAVPlanePrimeReadbackV2(result),
    diastasis: atrialAVPlaneDiastasisReadbackV2(result),
    lateDiastolicWindow: atrialAVPlaneLateDiastolicWindowReadbackV2(result),
    forceRangesN: {
      ventricularActive: range(samples.map((sample) => sample.ventricularActiveForceN)),
      atrialActive: range(samples.map((sample) => sample.atrialActiveForceN)),
      hydraulic: range(samples.map((sample) => sample.hydraulicForceN)),
      spring: range(samples.map((sample) => sample.springForceN)),
      damping: range(samples.map((sample) => sample.dampingForceN)),
      inertial: range(samples.map((sample) => sample.inertialForceN)),
    },
  };
}

function runEnvelopeTraces(): readonly {
  readonly caseId: string;
  readonly axis: AtrialAVPlanePassiveBalanceEnvelopeCaseV2["axis"];
  readonly result: MechanisticAtrialProfileResultV1;
}[] {
  const specs: readonly EnvelopeSpec[] = [
    { caseId: "normal-dt1", axis: "dt" },
    { caseId: "normal-dt0p5", axis: "dt", dtSec: 0.0005 },
    { caseId: "normal-dt2", axis: "dt", dtSec: 0.002 },
    { caseId: "hr60", axis: "heart-rate", heartRateBpm: 60 },
    { caseId: "hr100", axis: "heart-rate", heartRateBpm: 100 },
    {
      caseId: "preload-low",
      axis: "preload",
      params: { ...PASSIVE_BALANCE_PARAMS_V2, initialReturnReservoirPressureMmHg: 13.5 },
    },
    {
      caseId: "preload-high",
      axis: "preload",
      params: { ...PASSIVE_BALANCE_PARAMS_V2, initialReturnReservoirPressureMmHg: 21.5 },
    },
    {
      caseId: "afterload-low",
      axis: "afterload",
      params: { ...PASSIVE_BALANCE_PARAMS_V2, systemicResistanceMmHgSecPerMl: 0.90 },
    },
    {
      caseId: "afterload-high",
      axis: "afterload",
      params: { ...PASSIVE_BALANCE_PARAMS_V2, systemicResistanceMmHgSecPerMl: 1.45 },
    },
    {
      caseId: "la-stiffness-low",
      axis: "la-stiffness",
      params: {
        ...PASSIVE_BALANCE_PARAMS_V2,
        laWall: { ...PASSIVE_BALANCE_PARAMS_V2.laWall, passiveStiffnessKPa: 18 },
      },
    },
    {
      caseId: "la-stiffness-high",
      axis: "la-stiffness",
      params: {
        ...PASSIVE_BALANCE_PARAMS_V2,
        laWall: { ...PASSIVE_BALANCE_PARAMS_V2.laWall, passiveStiffnessKPa: 60 },
      },
    },
  ];
  return specs.map((spec) => ({
    caseId: spec.caseId,
    axis: spec.axis,
    result: runMechanisticAtrialProfileV1({
      profileId: spec.caseId,
      params: spec.params ?? PASSIVE_BALANCE_PARAMS_V2,
      heartRateBpm: spec.heartRateBpm,
      dtSec: spec.dtSec,
    }),
  }));
}

export function atrialAVPlanePrimeReadbackV2(
  result: MechanisticAtrialProfileResultV1,
): AtrialAVPlanePrimeReadbackV2 {
  const opening = result.events.mitralOpeningTheta;
  const preA = result.events.preATheta;
  const systolic = result.samples.filter((sample) => sample.theta >= 0.97 || sample.theta < opening);
  const early = result.samples.filter((sample) => sample.theta >= opening && sample.theta < preA);
  const atrial = result.samples.filter((sample) => sample.theta >= preA && sample.theta < 0.97);
  const aPrimeBasewardCmPerSec = Math.max(0, ...atrial.map((sample) =>
    sample.avPlaneVelocityCmPerSec
  ));
  const aPrimeApexwardCmPerSec = Math.max(0, ...atrial.map((sample) =>
    -sample.avPlaneVelocityCmPerSec
  ));
  return {
    sPrimeCmPerSec: rounded(Math.max(...systolic.map((sample) =>
      sample.avPlaneVelocityCmPerSec
    ))),
    ePrimeCmPerSec: rounded(Math.max(...early.map((sample) =>
      Math.max(0, -sample.avPlaneVelocityCmPerSec)
    ))),
    aPrimeCmPerSec: rounded(Math.max(aPrimeBasewardCmPerSec, aPrimeApexwardCmPerSec)),
    aPrimeBasewardCmPerSec: rounded(aPrimeBasewardCmPerSec),
    aPrimeApexwardCmPerSec: rounded(aPrimeApexwardCmPerSec),
    aPrimeDominantDirection: dominantPrimeDirection(
      aPrimeBasewardCmPerSec,
      aPrimeApexwardCmPerSec,
    ),
  };
}

export function atrialAVPlaneDiastasisReadbackV2(
  result: MechanisticAtrialProfileResultV1,
): AtrialAVPlaneForcePointV2 {
  const opening = result.events.mitralOpeningTheta;
  const preA = result.events.preATheta;
  const start = opening + 0.45 * (preA - opening);
  const peakMitralFlowMlPerSec = Math.max(
    ...result.samples.map((sample) => Math.abs(sample.qMitralMlPerSec)),
    1e-9,
  );
  const candidates = result.samples.filter((sample) =>
    sample.theta >= start && sample.theta <= preA &&
    sample.laActivation01 < 0.05 && sample.lvActivation01 < 0.05
  );
  const sample = candidates.reduce((best, row) =>
    diastasisScore(row, peakMitralFlowMlPerSec) <
      diastasisScore(best, peakMitralFlowMlPerSec) ? row : best,
  candidates[0] ?? result.samples[0]!);
  const mitralFlowFractionOfPeak = Math.abs(sample.qMitralMlPerSec) /
    peakMitralFlowMlPerSec;
  const quasiStaticResidualN = sample.ventricularActiveForceN -
    sample.atrialActiveForceN + sample.hydraulicForceN + sample.springForceN;
  const quasiStaticAvPlanePass =
    Math.abs(sample.avPlaneVelocityCmPerSec) <=
      AV_PLANE_DIASTASIS_THRESHOLDS_V2.maxAbsVelocityCmPerSec &&
    mitralFlowFractionOfPeak <=
      AV_PLANE_DIASTASIS_THRESHOLDS_V2.maxMitralFlowFractionOfPeak &&
    Math.abs(sample.dampingForceN) <=
      AV_PLANE_DIASTASIS_THRESHOLDS_V2.maxAbsDampingForceN &&
    Math.abs(sample.inertialForceN) <=
      AV_PLANE_DIASTASIS_THRESHOLDS_V2.maxAbsInertialForceN;
  return {
    diagnosticRole: "legacy-best-point-not-acceptance",
    theta: rounded(sample.theta),
    positionCm: rounded(sample.avPlanePositionCm),
    velocityCmPerSec: rounded(sample.avPlaneVelocityCmPerSec),
    mitralFlowMlPerSec: rounded(sample.qMitralMlPerSec),
    mitralFlowFractionOfPeak: rounded(mitralFlowFractionOfPeak),
    ventricularActiveForceN: rounded(sample.ventricularActiveForceN),
    atrialActiveForceN: rounded(sample.atrialActiveForceN),
    hydraulicForceN: rounded(sample.hydraulicForceN),
    springForceN: rounded(sample.springForceN),
    dampingForceN: rounded(sample.dampingForceN),
    inertialForceN: rounded(sample.inertialForceN),
    quasiStaticResidualN: rounded(quasiStaticResidualN),
    fullDynamicResidualN: rounded(quasiStaticResidualN + sample.dampingForceN +
      sample.inertialForceN),
    quasiStaticAvPlanePass,
  };
}

export function atrialAVPlaneLateDiastolicWindowReadbackV2(
  result: MechanisticAtrialProfileResultV1,
): AtrialAVPlaneLateDiastolicWindowReadbackV2 {
  const rule = ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2.lateDiastolicWindow;
  const samples = result.samples;
  const dtSec = estimateSampleIntervalSec(samples);
  const cycleLengthSec = samples.length > 0 ? samples.at(-1)!.tSec + dtSec : 0;
  const preASec = result.events.preATheta * cycleLengthSec;
  const openingSec = result.events.mitralOpeningTheta * cycleLengthSec;
  const guardSec = Math.max(rule.preActivationGuardSec, dtSec);
  const endSec = preASec - guardSec;
  const startSec = Math.max(openingSec, endSec - rule.targetDurationSec);
  const rawWindow = samples.filter((sample) =>
    sample.tSec >= startSec - 1e-12 && sample.tSec <= endSec + 1e-12
  );
  const durationSec = rawWindow.length > 0
    ? rawWindow.at(-1)!.tSec - rawWindow[0]!.tSec + dtSec
    : 0;
  const activationFree = rawWindow.every((sample) =>
    sample.laActivation01 < rule.activationCeiling01 &&
    sample.lvActivation01 < rule.activationCeiling01
  );
  const applicabilityReason: AtrialAVPlaneWindowApplicabilityReasonV2 =
    endSec <= openingSec ? "insufficient-conduit-window"
      : rawWindow.length < rule.minimumSampleCount ? "insufficient-samples"
      : durationSec < rule.minimumDurationSec ? "insufficient-duration"
      : !activationFree ? "activation-overlap"
      : "measurable";
  const peakMitralFlowMlPerSec = Math.max(
    ...samples.map((sample) => Math.abs(sample.qMitralMlPerSec)),
    1e-9,
  );
  const quasiStaticResiduals = rawWindow.map((sample) =>
    quasiStaticResidualN(sample)
  );
  const fullDynamicResiduals = rawWindow.map((sample, index) =>
    quasiStaticResiduals[index]! + sample.dampingForceN + sample.inertialForceN
  );
  const dynamicToHydraulicRatios = rawWindow.map((sample) =>
    (Math.abs(sample.dampingForceN) + Math.abs(sample.inertialForceN)) /
    Math.max(Math.abs(sample.hydraulicForceN), 1e-9)
  );
  const velocityAbsCmPerSec = absStats(rawWindow.map((sample) =>
    sample.avPlaneVelocityCmPerSec
  ));
  const mitralFlowFractionOfPeak = absStats(rawWindow.map((sample) =>
    sample.qMitralMlPerSec / peakMitralFlowMlPerSec
  ));
  const dampingForceAbsN = absStats(rawWindow.map((sample) => sample.dampingForceN));
  const inertialForceAbsN = absStats(rawWindow.map((sample) => sample.inertialForceN));
  const hydraulicForceN = signedForceStats(rawWindow.map((sample) =>
    sample.hydraulicForceN
  ));
  const springForceN = signedForceStats(rawWindow.map((sample) =>
    sample.springForceN
  ));
  const quasiStaticResidualAbsN = absStats(quasiStaticResiduals);
  const fullDynamicResidualAbsN = absStats(fullDynamicResiduals);
  const dynamicToHydraulicForceRatio = positiveStats(dynamicToHydraulicRatios);
  const passiveHydraulicMedianOpposed =
    hydraulicForceN.median * springForceN.median < 0;
  const passiveHydraulicOpposedSampleFraction = rawWindow.length > 0
    ? rawWindow.filter((sample) => sample.hydraulicForceN * sample.springForceN < 0)
      .length / rawWindow.length
    : 0;
  const quasiStaticAvPlanePass = applicabilityReason === "measurable" &&
    velocityAbsCmPerSec.max <= rule.maxAbsVelocityCmPerSec &&
    mitralFlowFractionOfPeak.max <= rule.maxMitralFlowFractionOfPeak &&
    dampingForceAbsN.max <= rule.maxAbsDampingForceN &&
    inertialForceAbsN.max <= rule.maxAbsInertialForceN;

  return {
    diagnosticRole: "predeclared-continuous-late-diastolic-window",
    applicability: applicabilityReason === "measurable" ? "measurable" : "not-applicable",
    applicabilityReason,
    targetDurationSec: rule.targetDurationSec,
    minimumDurationSec: rule.minimumDurationSec,
    minimumSampleCount: rule.minimumSampleCount,
    sampleCount: rawWindow.length,
    durationSec: rounded(durationSec),
    tStartSec: rounded(startSec),
    tEndSec: rounded(endSec),
    thetaStart: rounded(cycleLengthSec > 0 ? startSec / cycleLengthSec : 0),
    thetaEnd: rounded(cycleLengthSec > 0 ? endSec / cycleLengthSec : 0),
    preATheta: result.events.preATheta,
    peakMitralFlowMlPerSec: rounded(peakMitralFlowMlPerSec),
    mitralFlowFractionOfPeak,
    velocityAbsCmPerSec,
    hydraulicForceN,
    springForceN,
    dampingForceAbsN,
    inertialForceAbsN,
    quasiStaticResidualAbsN,
    fullDynamicResidualAbsN,
    dynamicToHydraulicForceRatio,
    passiveHydraulicMedianOpposed,
    passiveHydraulicOpposedSampleFraction: rounded(passiveHydraulicOpposedSampleFraction),
    quasiStaticAvPlanePass,
  };
}

export function evaluateAtrialAVPlanePassiveBalanceAcceptanceV2(input: {
  readonly profile: Omit<MechanisticAtrialProfileResultV1, "samples">;
  readonly prime: AtrialAVPlanePrimeReadbackV2;
  readonly lateDiastolicWindow: AtrialAVPlaneLateDiastolicWindowReadbackV2;
  readonly baselineProfile: Omit<MechanisticAtrialProfileResultV1, "samples">;
  readonly baselinePrime: AtrialAVPlanePrimeReadbackV2;
}): AtrialAVPlanePassiveBalanceAcceptanceFlagsV2 {
  const definition = ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2;
  const observation = definition.observation;
  const topology = definition.bloodVolumeTopologyEngineering;
  const mechanics = definition.lateDiastolicWindow;
  const pressureSanity = definition.pressureSanity;
  const profile = input.profile;
  const window = input.lateDiastolicWindow;
  const strokeVolumeRatioToV1 = profile.strokeVolumeMl /
    Math.max(input.baselineProfile.strokeVolumeMl, 1e-9);
  const cardiacOutputRatioToV1 = profile.cardiacOutputLPerMin /
    Math.max(input.baselineProfile.cardiacOutputLPerMin, 1e-9);
  const aPrimeMagnitudeRatioToV1 = input.prime.aPrimeCmPerSec /
    Math.max(input.baselinePrime.aPrimeCmPerSec, 1e-9);
  const avpdPass = withinInclusive(
    profile.avPlaneDisplacementCm,
    observation.avpdRangeCm,
  );
  const sPrimePass = withinInclusive(
    input.prime.sPrimeCmPerSec,
    observation.sPrimeRangeCmPerSec,
  );
  const ePrimePass = withinInclusive(
    input.prime.ePrimeCmPerSec,
    observation.ePrimeRangeCmPerSec,
  );
  const xDepthGainPass = profile.xDescentDepthMmHg >=
    input.baselineProfile.xDescentDepthMmHg + observation.minimumXDepthGainMmHg;
  const nonCollapsePass =
    strokeVolumeRatioToV1 >= observation.minimumStrokeVolumeRatioToV1 &&
    cardiacOutputRatioToV1 >= observation.minimumCardiacOutputRatioToV1;
  const aPrimeMagnitudeNonCollapsePass = aPrimeMagnitudeRatioToV1 >=
    observation.minimumAPrimeMagnitudeRatioToV1;
  const pressureSanityPass = profile.pressureRangeLaMmHg[1] <=
    pressureSanity.peakLaPressureCeilingMmHg;
  const candidateObservationPass = avpdPass && sPrimePass && ePrimePass &&
    xDepthGainPass && nonCollapsePass && aPrimeMagnitudeNonCollapsePass &&
    pressureSanityPass;
  const lobeMeasurementPass = profile.lobeMeasurementStatus === "measurable";
  const opposedLobeOrientationPass = profile.opposedLobeOrientation;
  const trueLobeIntersectionAnglePass = lobeMeasurementPass &&
    profile.lobeSelfIntersectionAngleDeg >= topology.minimumTrueLobeIntersectionAngleDeg;
  const trueLobePhaseCrossingMatchPass =
    topology.requireTrueLobePhaseCrossingMatch
      ? profile.lobePhaseCrossingMatchPass
      : true;
  const legacyPhaseCrossingWindowPass = profile.figureEightCrossingInPreferredWindow;
  const pathOrdering95Pass =
    profile.conduitBeforeCrossingBelowReservoirPathFraction >=
      topology.minimumConduitBeforeCrossingBelowReservoirPathFraction &&
    profile.pumpingAfterCrossingAboveReservoirPathFraction >=
      topology.minimumPumpingAfterCrossingAboveReservoirPathFraction;
  const loopAreaFloorPass =
    profile.aLoopAreaMmHgMl >= topology.minimumALoopAreaMmHgMl &&
    profile.vLoopAreaMmHgMl >= topology.minimumVLoopAreaMmHgMl;
  const reservoirSecondaryPeakPass =
    profile.reservoirSecondaryPeakCount <= topology.maximumReservoirSecondaryPeakCount;
  const bloodVolumeTopologyEngineeringPass =
    lobeMeasurementPass &&
    opposedLobeOrientationPass &&
    trueLobeIntersectionAnglePass &&
    trueLobePhaseCrossingMatchPass &&
    legacyPhaseCrossingWindowPass &&
    pathOrdering95Pass &&
    loopAreaFloorPass &&
    reservoirSecondaryPeakPass;
  const mitralWavePass = profile.mitralGateReadback.hardAcceptancePass;
  const lateDiastolicWindowApplicablePass = window.applicability === "measurable";
  const lateDiastolicQuasiStaticPass = window.quasiStaticAvPlanePass;
  const lateDiastolicOpposedForcePass =
    window.passiveHydraulicOpposedSampleFraction >=
      mechanics.minimumPassiveHydraulicOpposedFraction;
  const lateDiastolicHydraulicMagnitudePass = withinInclusive(
    window.hydraulicForceN.medianAbs,
    mechanics.medianAbsHydraulicForceRangeN,
  );
  const lateDiastolicResidualPass =
    window.quasiStaticResidualAbsN.max <= mechanics.maxAbsQuasiStaticResidualN;
  const lateDiastolicDynamicRatioPass =
    window.dynamicToHydraulicForceRatio.p95 <=
      mechanics.maxDynamicToHydraulicForceRatioP95;
  const mechanicsPass =
    lateDiastolicWindowApplicablePass &&
    lateDiastolicQuasiStaticPass &&
    lateDiastolicOpposedForcePass &&
    lateDiastolicHydraulicMagnitudePass &&
    lateDiastolicResidualPass &&
    lateDiastolicDynamicRatioPass;
  const numericalPass = numericallyValid(profile);
  const conservationPass = conserved(profile);

  return {
    numericalPass,
    conservationPass,
    avpdPass,
    sPrimePass,
    ePrimePass,
    xDepthGainPass,
    nonCollapsePass,
    aPrimeMagnitudeNonCollapsePass,
    pressureSanityPass,
    candidateObservationPass,
    lobeMeasurementPass,
    opposedLobeOrientationPass,
    trueLobeIntersectionAnglePass,
    trueLobePhaseCrossingMatchPass,
    legacyPhaseCrossingWindowPass,
    pathOrdering95Pass,
    loopAreaFloorPass,
    reservoirSecondaryPeakPass,
    bloodVolumeTopologyEngineeringPass,
    mitralWavePass,
    lateDiastolicWindowApplicablePass,
    lateDiastolicQuasiStaticPass,
    lateDiastolicOpposedForcePass,
    lateDiastolicHydraulicMagnitudePass,
    lateDiastolicResidualPass,
    lateDiastolicDynamicRatioPass,
    mechanicsPass,
    jointCandidatePass: numericalPass &&
      conservationPass &&
      candidateObservationPass &&
      mechanicsPass &&
      bloodVolumeTopologyEngineeringPass &&
      mitralWavePass,
  };
}

function diastasisScore(
  sample: MechanisticAtrialSampleV1,
  peakMitralFlowMlPerSec: number,
): number {
  return Math.abs(sample.qMitralMlPerSec) /
      peakMitralFlowMlPerSec /
      AV_PLANE_DIASTASIS_THRESHOLDS_V2.maxMitralFlowFractionOfPeak +
    Math.abs(sample.avPlaneVelocityCmPerSec) /
      AV_PLANE_DIASTASIS_THRESHOLDS_V2.maxAbsVelocityCmPerSec +
    Math.abs(sample.dampingForceN) /
      AV_PLANE_DIASTASIS_THRESHOLDS_V2.maxAbsDampingForceN +
    Math.abs(sample.inertialForceN) /
      AV_PLANE_DIASTASIS_THRESHOLDS_V2.maxAbsInertialForceN;
}

function bloodVolumeTopologyPass(
  profile: Omit<MechanisticAtrialProfileResultV1, "samples">,
): boolean {
  const topology = ATRIAL_AV_PLANE_PASSIVE_BALANCE_ACCEPTANCE_V2
    .bloodVolumeTopologyEngineering;
  return profile.lobeMeasurementStatus === "measurable" &&
    profile.lobeSelfIntersectionAngleDeg >= topology.minimumTrueLobeIntersectionAngleDeg &&
    (!topology.requireTrueLobePhaseCrossingMatch || profile.lobePhaseCrossingMatchPass) &&
    profile.figureEightCrossingInPreferredWindow &&
    profile.conduitBeforeCrossingBelowReservoirPathFraction >=
      topology.minimumConduitBeforeCrossingBelowReservoirPathFraction &&
    profile.pumpingAfterCrossingAboveReservoirPathFraction >=
      topology.minimumPumpingAfterCrossingAboveReservoirPathFraction &&
    profile.opposedLobeOrientation &&
    profile.aLoopAreaMmHgMl >= topology.minimumALoopAreaMmHgMl &&
    profile.vLoopAreaMmHgMl >= topology.minimumVLoopAreaMmHgMl &&
    profile.reservoirSecondaryPeakCount <= topology.maximumReservoirSecondaryPeakCount;
}

function k0NegativeControlDiagnostics(
  k0: AtrialAVPlanePassiveBalanceVariantV2,
  trace: MechanisticAtrialProfileResultV1,
): AtrialAVPlanePassiveBalanceReportV2["negativeControlDiagnostics"] {
  const maxAbsSpringForceN = Math.max(...trace.samples.map((sample) =>
    Math.abs(sample.springForceN)
  ));
  const k0ClosureDriftMl = Math.max(
    Math.abs(k0.profile.cycleClosureLaVolumeMl),
    Math.abs(k0.profile.cycleClosureLvVolumeMl),
  );
  return {
    k0ZeroStiffnessPass: k0.params.avPlane.stiffnessNPerCm === 0,
    k0ZeroSpringForcePass: maxAbsSpringForceN === 0,
    k0NonPeriodicPass: !k0.profile.periodicSteadyState,
    k0ClosureDriftMl: rounded(k0ClosureDriftMl),
    k0ClosureDriftPass: k0ClosureDriftMl >= 1,
    k0AllStepsConverged: k0.profile.allStepsConverged,
    k0SolverFailureObserved: !k0.profile.allStepsConverged ||
      k0.profile.maxAbsAvPlaneForceResidualN >= 1 ||
      k0.profile.maxNonlinearResidual >= 1,
    k0MaxAbsAvPlaneForceResidualN: k0.profile.maxAbsAvPlaneForceResidualN,
    k0MaxNonlinearResidual: rounded(k0.profile.maxNonlinearResidual),
  };
}

function numericallyValid(
  profile: Omit<MechanisticAtrialProfileResultV1, "samples">,
): boolean {
  return profile.allFinite && profile.allStepsConverged && profile.periodicSteadyState &&
    profile.maxNonlinearResidual <= 1e-7;
}

function conserved(
  profile: Omit<MechanisticAtrialProfileResultV1, "samples">,
): boolean {
  return profile.maxAbsMassResidualMl <= 1e-6 &&
    profile.maxAbsClosedCircuitVolumeResidualMl <= 1e-6 &&
    profile.maxAbsAvPlaneKinematicResidualCm <= 1e-7 &&
    profile.maxAbsAvPlaneForceResidualN <= 1e-5;
}

function envelopeDtErrors(
  cases: readonly AtrialAVPlanePassiveBalanceEnvelopeCaseV2[],
): Readonly<Record<string, number>> {
  const row = (caseId: string) => cases.find((entry) => entry.caseId === caseId)!.profile;
  const reference = row("normal-dt1");
  return {
    halfCardiacOutput: relativeError(row("normal-dt0p5").cardiacOutputLPerMin,
      reference.cardiacOutputLPerMin),
    halfLaPeakPressure: relativeError(row("normal-dt0p5").pressureRangeLaMmHg[1],
      reference.pressureRangeLaMmHg[1]),
    halfAvpd: relativeError(row("normal-dt0p5").avPlaneDisplacementCm,
      reference.avPlaneDisplacementCm),
    doubleCardiacOutput: relativeError(row("normal-dt2").cardiacOutputLPerMin,
      reference.cardiacOutputLPerMin),
    doubleLaPeakPressure: relativeError(row("normal-dt2").pressureRangeLaMmHg[1],
      reference.pressureRangeLaMmHg[1]),
    doubleAvpd: relativeError(row("normal-dt2").avPlaneDisplacementCm,
      reference.avPlaneDisplacementCm),
  };
}

function envelopeDirectionalChecks(
  cases: readonly AtrialAVPlanePassiveBalanceEnvelopeCaseV2[],
): Readonly<Record<string, boolean>> {
  const row = (caseId: string) => cases.find((entry) => entry.caseId === caseId)!.profile;
  return {
    preloadRaisesLaPressure:
      row("preload-high").pressureRangeLaMmHg[1] > row("preload-low").pressureRangeLaMmHg[1],
    preloadRaisesOutput:
      row("preload-high").cardiacOutputLPerMin > row("preload-low").cardiacOutputLPerMin,
    afterloadRaisesAorticPressure:
      row("afterload-high").pressureRangeAorticMmHg[1] >
      row("afterload-low").pressureRangeAorticMmHg[1],
    afterloadReducesOutput:
      row("afterload-high").cardiacOutputLPerMin < row("afterload-low").cardiacOutputLPerMin,
    laStiffnessRaisesPressure:
      row("la-stiffness-high").pressureRangeLaMmHg[1] >
      row("la-stiffness-low").pressureRangeLaMmHg[1],
  };
}

function dominantPrimeDirection(
  basewardCmPerSec: number,
  apexwardCmPerSec: number,
): AtrialAVPlanePrimeReadbackV2["aPrimeDominantDirection"] {
  const toleranceRatio = 1.05;
  if (basewardCmPerSec > apexwardCmPerSec * toleranceRatio) return "baseward";
  if (apexwardCmPerSec > basewardCmPerSec * toleranceRatio) return "apexward";
  return "balanced";
}

function quasiStaticResidualN(sample: MechanisticAtrialSampleV1): number {
  return sample.ventricularActiveForceN -
    sample.atrialActiveForceN +
    sample.hydraulicForceN +
    sample.springForceN;
}

function estimateSampleIntervalSec(
  samples: readonly MechanisticAtrialSampleV1[],
): number {
  if (samples.length < 2) return 0;
  return Math.max(samples[1]!.tSec - samples[0]!.tSec, 0);
}

function signedForceStats(
  values: readonly number[],
): AtrialAVPlaneWindowSignedForceStatsV2 {
  return {
    median: rounded(percentile(values, 0.5)),
    medianAbs: rounded(percentile(values.map(Math.abs), 0.5)),
    p95Abs: rounded(percentile(values.map(Math.abs), 0.95)),
    maxAbs: rounded(Math.max(...values.map(Math.abs), 0)),
  };
}

function absStats(values: readonly number[]): AtrialAVPlaneWindowAbsStatsV2 {
  return positiveStats(values.map(Math.abs));
}

function positiveStats(values: readonly number[]): AtrialAVPlaneWindowAbsStatsV2 {
  return {
    median: rounded(percentile(values, 0.5)),
    p95: rounded(percentile(values, 0.95)),
    max: rounded(Math.max(...values, 0)),
  };
}

function percentile(values: readonly number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower]!;
  const weight = position - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

function withinInclusive(
  value: number,
  rangeValue: readonly [number, number],
): boolean {
  return value >= rangeValue[0] && value <= rangeValue[1];
}

function stripSamples(
  result: MechanisticAtrialProfileResultV1,
): Omit<MechanisticAtrialProfileResultV1, "samples"> {
  const { samples: _samples, ...summary } = result;
  return summary;
}

function range(values: readonly number[]): readonly [number, number] {
  return [rounded(Math.min(...values)), rounded(Math.max(...values))];
}

function relativeError(value: number, reference: number): number {
  return rounded(Math.abs(value - reference) / Math.max(Math.abs(reference), 1e-9));
}

function maxRelativeDifference(pairs: readonly (readonly [number, number])[]): number {
  return Math.max(...pairs.map(([a, b]) => Math.abs(a - b) /
    Math.max(Math.abs(a), Math.abs(b), 1e-9)));
}

function midpoint(value: readonly [number, number]): number {
  return 0.5 * (value[0] + value[1]);
}

function rounded(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}
