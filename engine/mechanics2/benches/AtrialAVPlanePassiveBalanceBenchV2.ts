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
};

export type AtrialAVPlaneForcePointV2 = {
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

export const AV_PLANE_DIASTASIS_THRESHOLDS_V2 = {
  maxAbsVelocityCmPerSec: 0.1,
  maxMitralFlowFractionOfPeak: 0.1,
  maxAbsDampingForceN: 1,
  maxAbsInertialForceN: 1,
} as const;

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
    readonly diastaticPassiveHydraulicOppositionPass: boolean;
    readonly passiveCandidateBloodVolumeTopologyPass: boolean;
    readonly passiveCandidateMitralWavePass: boolean;
    readonly laContractilityBracketMitralPass: boolean;
    readonly laContractilityBracketBloodVolumeTopologyPass: boolean;
    readonly jointMechanisticCandidatePass: boolean;
    readonly k0NegativeControlRetained: boolean;
    readonly passiveNeutralIdentifiabilityWarningPresent: boolean;
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
  const envelopeTraces = runEnvelopeTraces();
  const envelope = envelopeTraces.map(({ result, ...row }) => ({
    ...row,
    profile: stripSamples(result),
  }));
  const numericalRows = variants.filter((row) => row.variantId !== "k0-negative-control");
  const numericalPass = numericalRows.every((row) => numericallyValid(row.profile));
  const conservationPass = numericalRows.every((row) => conserved(row.profile));
  const passiveCandidateObservationPass =
    passive.profile.avPlaneDisplacementCm >= 0.8 &&
    passive.profile.avPlaneDisplacementCm <= 1.8 &&
    passive.prime.sPrimeCmPerSec >= 5 && passive.prime.sPrimeCmPerSec <= 15 &&
    passive.prime.ePrimeCmPerSec >= 4 && passive.prime.ePrimeCmPerSec <= 15 &&
    passive.profile.xDescentDepthMmHg >= baseline.profile.xDescentDepthMmHg + 0.5;
  const activeForceProjectionWithinPublishedInputBracket =
    passive.forceRangesN.ventricularActive[1] >= 60 &&
    passive.forceRangesN.ventricularActive[1] <= 130 &&
    passive.forceRangesN.atrialActive[1] >= 10 &&
    passive.forceRangesN.atrialActive[1] <= 25;
  const diastaticPassiveHydraulicOppositionPass =
    passive.diastasis.quasiStaticAvPlanePass &&
    passive.diastasis.hydraulicForceN * passive.diastasis.springForceN < 0 &&
    Math.abs(passive.diastasis.hydraulicForceN) >= 1 &&
    Math.abs(passive.diastasis.hydraulicForceN) <= 3 &&
    Math.abs(passive.diastasis.quasiStaticResidualN) <= 1;
  const passiveCandidateBloodVolumeTopologyPass = bloodVolumeTopologyPass(passive.profile);
  const passiveCandidateMitralWavePass = passive.profile.mitralGateReadback.hardAcceptancePass;
  const laContractilityBracketMitralPass = bracket.profile.mitralGateReadback.hardAcceptancePass;
  const laContractilityBracketBloodVolumeTopologyPass = bloodVolumeTopologyPass(
    bracket.profile,
  );
  const jointMechanisticCandidatePass = passiveCandidateObservationPass &&
    diastaticPassiveHydraulicOppositionPass &&
    passiveCandidateBloodVolumeTopologyPass && passiveCandidateMitralWavePass;
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
      diastaticPassiveHydraulicOppositionPass,
      passiveCandidateBloodVolumeTopologyPass,
      passiveCandidateMitralWavePass,
      laContractilityBracketMitralPass,
      laContractilityBracketBloodVolumeTopologyPass,
      jointMechanisticCandidatePass,
      k0NegativeControlRetained: k0.params.avPlane.stiffnessNPerCm === 0 &&
        Math.max(...trace("k0-negative-control").samples.map((sample) =>
          Math.abs(sample.springForceN)
        )) === 0,
      passiveNeutralIdentifiabilityWarningPresent:
        neutralShapeDifference <= 0.10 && Math.abs(neutralVolumeMidpointChange) >= 10,
    },
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
      acceptedFinding: "Replacing V1 damper-dominant restraint with an underdamped elastic balance can oppose the 1-3 N diastatic hydraulic force and improve AVPD, prime velocity, and x descent without adding a state; the changed trajectory also amplifies length-dependent active force and is not a pure passive attribution.",
      rejectedShortcut: "The passive-neutral coordinate and atrial contractility are not accepted as shape-fitting knobs: neutral shifts are weakly identifiable, and the contractility bracket repairs E/A while moving the blood-volume crossing outside the preferred window.",
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
  return {
    sPrimeCmPerSec: rounded(Math.max(...systolic.map((sample) =>
      sample.avPlaneVelocityCmPerSec
    ))),
    ePrimeCmPerSec: rounded(Math.max(...early.map((sample) =>
      Math.max(0, -sample.avPlaneVelocityCmPerSec)
    ))),
    aPrimeCmPerSec: rounded(Math.max(...atrial.map((sample) =>
      Math.abs(sample.avPlaneVelocityCmPerSec)
    ))),
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
  return profile.figureEightCrossingInPreferredWindow &&
    profile.figureEightCrossingAngleDeg >= 10 &&
    profile.conduitBeforeCrossingBelowReservoirPathFraction >= 0.95 &&
    profile.pumpingAfterCrossingAboveReservoirPathFraction >= 0.95 &&
    profile.opposedLobeOrientation &&
    profile.aLoopAreaMmHgMl >= 5 && profile.vLoopAreaMmHgMl >= 10 &&
    profile.reservoirSecondaryPeakCount <= 1;
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
