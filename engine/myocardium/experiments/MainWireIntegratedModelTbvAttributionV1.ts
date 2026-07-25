import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
} from "@/engine/coronary/typesV2";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3,
  mainWireIntegratedModelPeriodicFixtureIdentityV3,
  runMainWireIntegratedModelPeriodicKernelV3,
  type MainWireIntegratedModelPeriodicKernelResultV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1,
  MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

export const MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_V1_ID =
  "main-wire-integrated-model-global-tbv-attribution-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1 =
  deepFreeze({
    protocolVersion: 1 as const,
    primaryNominalDtSec: 0.002,
    primaryMaximumCycleCount:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.maximumCycleCount,
    convergencePolicy:
      "unchanged-v3-periodic-classifier-stop-on-first-p1-or-p2-classification" as const,
    primaryClassifierEvidenceRole: "canonical-periodic-protocol" as const,
    primaryClassifierEvidenceRoleInterpretation:
      "canonical-numerical-periodic-method-under-an-arm-specific-protocol-hash-not-a-canonical-physiology-claim" as const,
    boundedSmokeClassifierEvidenceRole: "bounded-exploration-only" as const,
    armOrder: ["current-5600ml", "base-ledger-5535p899898ml"] as const,
    arms: {
      "current-5600ml": {
        armId: "current-5600ml" as const,
        fixedGlobalTotalBloodVolumeMl:
          MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1.fullGraphReferenceTotalBloodVolumeMl,
        interpretation: "current-integrated-v3-global-ledger" as const,
      },
      "base-ledger-5535p899898ml": {
        armId: "base-ledger-5535p899898ml" as const,
        fixedGlobalTotalBloodVolumeMl: 5535.899898304685,
        declaredBaseNonCoronaryVolumeMl:
          MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1.fixedTotalBloodVolumeMl,
        acceptedPressureConsistentColdCoronaryVolumeMl: 13.789898304684712,
        interpretation:
          "base-noncoronary-ledger-plus-accepted-pressure-consistent-cold-coronary-volume" as const,
      },
    },
    inputLedgerAmendment: {
      amendmentTiming:
        "after-bounded-cold-fixture-audit-before-primary-outcome-inspection" as const,
      supersededAlternateGlobalTotalBloodVolumeMl: 5539.666,
      supersededStructuralPriorColdCoronaryVolumeMl: 17.556,
      observedAcceptedPressureConsistentColdCoronaryVolumeMl: 13.789898304684712,
      structuralPriorMinusAcceptedColdCoronaryVolumeMl: 3.766101695315289,
      reason:
        "17p556ml-is-the-structural-prior-seed-not-the-pressure-consistent-accepted-v3-cold-ledger" as const,
      outputMetricOrHealthGateUsedForAmendment: false as const,
      fitObjectiveUsedForAmendment: false as const,
    },
    onlyChangedInput: "fixed-global-total-blood-volume-ml" as const,
    coldDistributionPolicy:
      "same-shared-SV-VC-transmural-pressure-offset" as const,
    heldFixed: [
      "canonical-five-wall-provider",
      "coronary-topology-prior-disease-collapse-and-autoregulation",
      "accepted-composed-regular-sinus-rhythm",
      "all-four-MCS-devices-off-with-zero-inertance",
      "material-laws-resistances-and-valves",
      "numerical-policy-reference-scales-and-event-clipping",
    ] as const,
    pairedDeltaDirection: "base-ledger-minus-current-ledger" as const,
    healthThresholdApplied: false as const,
    fitObjectiveApplied: false as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_CLAIM_V1 = deepFreeze({
  purpose:
    "single-factor-global-blood-volume-ledger-attribution-before-any-parameter-bracket" as const,
  primaryProtocolAmendedBeforePrimaryOutcomeInspection: true as const,
  amendmentBasedOnlyOnExecutableColdLedgerIdentity: true as const,
  parameterOrWaveformFittingApplied: false as const,
  outputDependentThresholdChangeAllowed: false as const,
  numericalPeriodicityRequiredForPrimaryAttribution: true as const,
  healthyReferenceGateUsedAsAcceptance: false as const,
  graphShapeAcceptanceClaimed: false as const,
  physiologicalAcceptanceEstablished: false as const,
  independentValidationEstablished: false as const,
  clinicalValidationClaimed: false as const,
  releaseAcceptanceEstablished: false as const,
});

export type MainWireIntegratedModelTbvAttributionExecutionPurposeV1 =
  "primary-attribution-evidence" | "bounded-smoke";

export type MainWireIntegratedModelTbvAttributionOptionsV1 = Readonly<{
  executionPurpose?: MainWireIntegratedModelTbvAttributionExecutionPurposeV1;
  maximumCycleCount?: number;
}>;

export type MainWireIntegratedModelTbvHemodynamicsV1 = Readonly<{
  lvEndDiastolicVolumeMl: number;
  lvEndSystolicVolumeMl: number;
  lvEjectionFraction01: number;
  nativeAorticForwardVolumeMl: number;
  nativePulmonaryForwardVolumeMl: number;
  nativeAorticCardiacOutputLPerMin: number;
  nativeAorticCardiacIndexLPerMinPerM2: number;
  leftAtrialTimeWeightedMeanPressureMmHg: number;
  rightAtrialTimeWeightedMeanPressureMmHg: number;
  pulmonaryVeinTimeWeightedMeanPressureMmHg: number;
  pulmonaryArterySystolicPressureMmHg: number;
  pulmonaryArteryDiastolicPressureMmHg: number;
  pulmonaryArteryTimeWeightedMeanPressureMmHg: number;
  pulmonaryArteryPulsePressureMmHg: number;
  pulmonaryArterialComplianceProxyMlPerMmHg: number;
  pulmonaryVascularResistanceProxyWoodUnits: number;
  aorticSystolicPressureMmHg: number;
  aorticDiastolicPressureMmHg: number;
  aorticTimeWeightedMeanPressureMmHg: number;
  aorticPulsePressureMmHg: number;
}>;

export type MainWireIntegratedModelTbvCoronaryV1 = Readonly<{
  terminalTotalBloodVolumeMl: number;
  terminalCycleTimeWeightedMeanInletFlowMlPerSec: number;
  terminalCycleTimeWeightedMeanInletFlowMlPerMin: number;
  terminalToneResistanceScaleMean: number;
  terminalToneResistanceScaleByTerritoryLayer: CoronaryTerritoryLayerRecordV2<number>;
}>;

export type MainWireIntegratedModelTbvLedgerV1 = Readonly<{
  fixedGlobalTotalBloodVolumeMl: number;
  coldNonCoronaryBloodVolumeMl: number;
  coldCoronaryBloodVolumeMl: number;
  coldGlobalReconstructionResidualMl: number;
  coldNonCoronaryResidualFromBaseLedgerMl: number;
  coldGlobalResidualFromBasePlusAcceptedCoronaryTargetMl: number;
  terminalNonCoronaryBloodVolumeMl: number;
  terminalCoronaryBloodVolumeMl: number;
  terminalGlobalReconstructionResidualMl: number;
}>;

export type MainWireIntegratedModelTbvNumericsV1 = Readonly<{
  classificationStatus: MainWireIntegratedModelPeriodicKernelResultV3["classification"]["status"];
  numericalPeriod1Observed: boolean;
  completedCycleCount: number;
  terminationReason: MainWireIntegratedModelPeriodicKernelResultV3["terminationReason"];
  terminalPeriod1MaximumNormalizedDelta: number;
  terminalPeriod2MaximumNormalizedDelta: number | null;
  terminalWorstPeriod1Group: string;
  terminalWorstPeriod1Path: string;
  maximumGlobalTotalBloodVolumeErrorMl: number;
  maximumCoronaryBloodVolumeLedgerResidualMl: number;
  maximumDynamicMcsConservationResidualMlPerSec: number;
  allCyclesFiniteConservedAndEventExact: boolean;
  terminalCheckpointExactRoundTripVerified: true;
}>;

export type MainWireIntegratedModelTbvMorphologyDiagnosticsV1 = Readonly<{
  terminalTraceSampleCount: number;
  terminalTraceDurationSec: number;
  minimumAcceptedDtSec: number;
  maximumAcceptedDtSec: number;
  lvPvLoopSignedAreaMmHgMl: number;
  lvPvLoopTraversal: "counter-clockwise" | "clockwise" | "degenerate";
  minimumNativeValveFlowMlPerSec: Readonly<{
    MV: number;
    AoV: number;
    TV: number;
    PV: number;
  }>;
  coronaryMeanInletFlowDuringAorticEjectionMlPerSec: number;
  coronaryMeanInletFlowOutsideAorticEjectionMlPerSec: number;
  coronaryOutsideToEjectionMeanFlowRatio: number;
  graphShapeAcceptanceClaimed: false;
}>;

export type MainWireIntegratedModelTbvAttributionArmV1 = Readonly<{
  armId: (typeof MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.armOrder)[number];
  armProtocolIdentityHash: string;
  hemodynamics: MainWireIntegratedModelTbvHemodynamicsV1;
  coronary: MainWireIntegratedModelTbvCoronaryV1;
  ledger: MainWireIntegratedModelTbvLedgerV1;
  numerics: MainWireIntegratedModelTbvNumericsV1;
  morphologyDiagnostics: MainWireIntegratedModelTbvMorphologyDiagnosticsV1;
  terminalCycleTrace: MainWireIntegratedModelPeriodicKernelResultV3["terminalCycleTrace"];
}>;

export type MainWireIntegratedModelTbvPairedDeltaV1 = Readonly<{
  direction: "base-ledger-minus-current-ledger";
  fixedGlobalTotalBloodVolumeMl: number;
  hemodynamics: MainWireIntegratedModelTbvHemodynamicsV1;
  coronary: MainWireIntegratedModelTbvCoronaryV1;
}>;

export type MainWireIntegratedModelTbvAttributionResultV1 = Readonly<{
  experimentId: typeof MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_V1_ID;
  executionPurpose: MainWireIntegratedModelTbvAttributionExecutionPurposeV1;
  protocolIdentityHash: string;
  nominalDtSec: number;
  requestedMaximumCycleCountPerArm: number;
  armOrder: typeof MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.armOrder;
  arms: Readonly<
    Record<
      MainWireIntegratedModelTbvAttributionArmV1["armId"],
      MainWireIntegratedModelTbvAttributionArmV1
    >
  >;
  pairedDelta: MainWireIntegratedModelTbvPairedDeltaV1;
  primaryAttributionNumericallyEstablished: boolean;
  healthThresholdApplied: false;
  fitObjectiveApplied: false;
  physiologicalAcceptanceEstablished: false;
  independentValidationEstablished: false;
  releaseAcceptanceEstablished: false;
  protocol: typeof MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1;
  claim: typeof MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_CLAIM_V1;
}>;

export async function runMainWireIntegratedModelTbvAttributionV1(
  options: MainWireIntegratedModelTbvAttributionOptionsV1 = {},
): Promise<MainWireIntegratedModelTbvAttributionResultV1> {
  const resolved = resolveOptions(options);
  const protocolIdentityHash = await sha256CanonicalJsonHex({
    experimentId: MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_V1_ID,
    executionPurpose: resolved.executionPurpose,
    nominalDtSec: resolved.nominalDtSec,
    maximumCycleCountPerArm: resolved.maximumCycleCount,
    protocol: MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1,
    claim: MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_CLAIM_V1,
    inheritedPeriodicPolicy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
    inheritedPeriodicReferenceScales:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
  });

  const armEntries: [
    MainWireIntegratedModelTbvAttributionArmV1["armId"],
    MainWireIntegratedModelTbvAttributionArmV1,
  ][] = [];
  for (const armId of MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.armOrder) {
    const armProtocol =
      MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.arms[armId];
    const fixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureForGlobalBloodVolumeV3(
        armProtocol.fixedGlobalTotalBloodVolumeMl,
      );
    const armProtocolIdentityHash = await sha256CanonicalJsonHex({
      parentProtocolIdentityHash: protocolIdentityHash,
      armProtocol,
      fixtureIdentity:
        await mainWireIntegratedModelPeriodicFixtureIdentityV3(fixture),
    });
    const kernel = await runMainWireIntegratedModelPeriodicKernelV3(fixture, {
      protocolIdentityHash: armProtocolIdentityHash,
      nominalDtSec: resolved.nominalDtSec,
      maximumCycleCount: resolved.maximumCycleCount,
      stopAfterClassification: true,
      evidenceRole: resolved.evidenceRole,
    });
    armEntries.push([
      armId,
      summarizeArm(
        armId,
        armProtocolIdentityHash,
        fixture.cold.acceptedState,
        kernel,
      ),
    ]);
  }
  const arms = deepFreeze(
    Object.fromEntries(armEntries),
  ) as MainWireIntegratedModelTbvAttributionResultV1["arms"];
  const current = arms["current-5600ml"];
  const base = arms["base-ledger-5535p899898ml"];
  const primaryAttributionNumericallyEstablished =
    resolved.executionPurpose === "primary-attribution-evidence" &&
    current.numerics.numericalPeriod1Observed &&
    base.numerics.numericalPeriod1Observed &&
    current.numerics.allCyclesFiniteConservedAndEventExact &&
    base.numerics.allCyclesFiniteConservedAndEventExact;

  return deepFreeze({
    experimentId: MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_V1_ID,
    executionPurpose: resolved.executionPurpose,
    protocolIdentityHash,
    nominalDtSec: resolved.nominalDtSec,
    requestedMaximumCycleCountPerArm: resolved.maximumCycleCount,
    armOrder: MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.armOrder,
    arms,
    pairedDelta: pairedDelta(base, current),
    primaryAttributionNumericallyEstablished,
    healthThresholdApplied: false as const,
    fitObjectiveApplied: false as const,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    protocol: MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1,
    claim: MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_CLAIM_V1,
  });
}

function summarizeArm(
  armId: MainWireIntegratedModelTbvAttributionArmV1["armId"],
  armProtocolIdentityHash: string,
  cold: MainWireIntegratedModelPeriodicKernelResultV3["terminalAcceptedState"],
  kernel: MainWireIntegratedModelPeriodicKernelResultV3,
): MainWireIntegratedModelTbvAttributionArmV1 {
  const terminalCycle = kernel.cycles.at(-1);
  if (terminalCycle === undefined) {
    throw new Error("TBV attribution arm has no completed cycle");
  }
  const terminal = kernel.terminalAcceptedState;
  return deepFreeze({
    armId,
    armProtocolIdentityHash,
    hemodynamics: hemodynamics(
      kernel.terminalCycleTrace.samples,
      terminalCycle.rawHealthyMetrics,
    ),
    coronary: coronarySummary(kernel),
    ledger: {
      fixedGlobalTotalBloodVolumeMl:
        cold.coronary.fixedGlobalTotalBloodVolumeMl,
      coldNonCoronaryBloodVolumeMl:
        cold.coronary.circulation.totalBloodVolumeMl,
      coldCoronaryBloodVolumeMl: coronaryBloodVolumeMl(cold),
      coldGlobalReconstructionResidualMl:
        cold.coronary.circulation.totalBloodVolumeMl +
        coronaryBloodVolumeMl(cold) -
        cold.coronary.fixedGlobalTotalBloodVolumeMl,
      coldNonCoronaryResidualFromBaseLedgerMl:
        cold.coronary.circulation.totalBloodVolumeMl -
        MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1.fixedTotalBloodVolumeMl,
      coldGlobalResidualFromBasePlusAcceptedCoronaryTargetMl:
        cold.coronary.fixedGlobalTotalBloodVolumeMl -
        (MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1.fixedTotalBloodVolumeMl +
          MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.arms[
            "base-ledger-5535p899898ml"
          ].acceptedPressureConsistentColdCoronaryVolumeMl),
      terminalNonCoronaryBloodVolumeMl:
        terminal.coronary.circulation.totalBloodVolumeMl,
      terminalCoronaryBloodVolumeMl: coronaryBloodVolumeMl(terminal),
      terminalGlobalReconstructionResidualMl:
        terminal.coronary.circulation.totalBloodVolumeMl +
        coronaryBloodVolumeMl(terminal) -
        terminal.coronary.fixedGlobalTotalBloodVolumeMl,
    },
    numerics: {
      classificationStatus: kernel.classification.status,
      numericalPeriod1Observed:
        kernel.classification.status === "period1-converged",
      completedCycleCount: kernel.completedCycleCount,
      terminationReason: kernel.terminationReason,
      terminalPeriod1MaximumNormalizedDelta:
        terminalCycle.period1MaximumNormalizedDelta,
      terminalPeriod2MaximumNormalizedDelta:
        terminalCycle.period2MaximumNormalizedDelta,
      terminalWorstPeriod1Group: terminalCycle.worstPeriod1Group,
      terminalWorstPeriod1Path: terminalCycle.worstPeriod1Path,
      maximumGlobalTotalBloodVolumeErrorMl: maximumCycleDiagnostic(
        kernel,
        "maximumGlobalTotalBloodVolumeErrorMl",
      ),
      maximumCoronaryBloodVolumeLedgerResidualMl: maximumCycleDiagnostic(
        kernel,
        "maximumCoronaryBloodVolumeLedgerResidualMl",
      ),
      maximumDynamicMcsConservationResidualMlPerSec: maximumCycleDiagnostic(
        kernel,
        "maximumDynamicMcsConservationResidualMlPerSec",
      ),
      allCyclesFiniteConservedAndEventExact:
        kernel.allCyclesFiniteConservedAndEventExact,
      terminalCheckpointExactRoundTripVerified:
        kernel.terminalCheckpointExactRoundTripVerified,
    },
    morphologyDiagnostics: morphologyDiagnostics(
      kernel.terminalCycleTrace.samples,
    ),
    terminalCycleTrace: kernel.terminalCycleTrace,
  });
}

function morphologyDiagnostics(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
): MainWireIntegratedModelTbvMorphologyDiagnosticsV1 {
  const durationSec = duration(samples);
  const signedArea =
    samples.reduce((sum, sample, index) => {
      const next = samples[(index + 1) % samples.length]!;
      return (
        sum +
        sample.chamberVolumeMl.LV * next.absolutePressureMmHg.LV -
        next.chamberVolumeMl.LV * sample.absolutePressureMmHg.LV
      );
    }, 0) / 2;
  const ejectionSamples = samples.filter(
    (sample) => sample.valveFlowMlPerSec.AoV > 0,
  );
  const outsideEjectionSamples = samples.filter(
    (sample) => sample.valveFlowMlPerSec.AoV === 0,
  );
  if (ejectionSamples.length === 0 || outsideEjectionSamples.length === 0) {
    throw new Error(
      "TBV attribution morphology requires open and closed aortic-valve samples",
    );
  }
  const coronaryDuringEjection = timeWeightedCoronaryInletFlow(ejectionSamples);
  const coronaryOutsideEjection = timeWeightedCoronaryInletFlow(
    outsideEjectionSamples,
  );
  if (coronaryDuringEjection === 0) {
    throw new Error(
      "TBV attribution morphology cannot divide by zero ejection coronary flow",
    );
  }
  return deepFreeze({
    terminalTraceSampleCount: samples.length,
    terminalTraceDurationSec: durationSec,
    minimumAcceptedDtSec: Math.min(
      ...samples.map((sample) => sample.acceptedDtSec),
    ),
    maximumAcceptedDtSec: Math.max(
      ...samples.map((sample) => sample.acceptedDtSec),
    ),
    lvPvLoopSignedAreaMmHgMl: signedArea,
    lvPvLoopTraversal:
      signedArea > 0
        ? ("counter-clockwise" as const)
        : signedArea < 0
          ? ("clockwise" as const)
          : ("degenerate" as const),
    minimumNativeValveFlowMlPerSec: {
      MV: Math.min(...samples.map((sample) => sample.valveFlowMlPerSec.MV)),
      AoV: Math.min(...samples.map((sample) => sample.valveFlowMlPerSec.AoV)),
      TV: Math.min(...samples.map((sample) => sample.valveFlowMlPerSec.TV)),
      PV: Math.min(...samples.map((sample) => sample.valveFlowMlPerSec.PV)),
    },
    coronaryMeanInletFlowDuringAorticEjectionMlPerSec: coronaryDuringEjection,
    coronaryMeanInletFlowOutsideAorticEjectionMlPerSec: coronaryOutsideEjection,
    coronaryOutsideToEjectionMeanFlowRatio:
      coronaryOutsideEjection / coronaryDuringEjection,
    graphShapeAcceptanceClaimed: false as const,
  });
}

function timeWeightedCoronaryInletFlow(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
): number {
  const sampleDurationSec = samples.reduce(
    (sum, sample) => sum + sample.acceptedDtSec,
    0,
  );
  if (!(sampleDurationSec > 0)) {
    throw new Error("TBV attribution morphology phase has zero duration");
  }
  return (
    samples.reduce(
      (sum, sample) =>
        sum + sample.coronary.totalInletFlowMlPerSec * sample.acceptedDtSec,
      0,
    ) / sampleDurationSec
  );
}

function hemodynamics(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  raw: MainWireIntegratedModelPeriodicKernelResultV3["cycles"][number]["rawHealthyMetrics"],
): MainWireIntegratedModelTbvHemodynamicsV1 {
  const durationSec = duration(samples);
  const pulmonaryArterySystolicPressureMmHg = maximumPressure(samples, "PA");
  const pulmonaryArteryDiastolicPressureMmHg = minimumPressure(samples, "PA");
  const pulmonaryArteryPulsePressureMmHg =
    pulmonaryArterySystolicPressureMmHg - pulmonaryArteryDiastolicPressureMmHg;
  const nativePulmonaryForwardVolumeMl = samples.reduce(
    (sum, sample) =>
      sum + Math.max(0, sample.valveFlowMlPerSec.PV) * sample.acceptedDtSec,
    0,
  );
  if (!(pulmonaryArteryPulsePressureMmHg > 0)) {
    throw new Error(
      "TBV attribution requires positive pulmonary pulse pressure",
    );
  }
  const pulmonaryArteryTimeWeightedMeanPressureMmHg = weightedPressure(
    samples,
    "PA",
    durationSec,
  );
  const leftAtrialTimeWeightedMeanPressureMmHg =
    raw.leftAtrialTimeWeightedMeanPressureMmHg;
  const aorticSystolicPressureMmHg = maximumPressure(samples, "Ao");
  const aorticDiastolicPressureMmHg = minimumPressure(samples, "Ao");
  return deepFreeze({
    lvEndDiastolicVolumeMl: raw.lvEndDiastolicVolumeMl,
    lvEndSystolicVolumeMl: raw.lvEndSystolicVolumeMl,
    lvEjectionFraction01: raw.lvEjectionFraction01,
    nativeAorticForwardVolumeMl: raw.nativeAorticForwardVolumeMl,
    nativePulmonaryForwardVolumeMl,
    nativeAorticCardiacOutputLPerMin: raw.nativeAorticCardiacOutputLPerMin,
    nativeAorticCardiacIndexLPerMinPerM2:
      raw.nativeAorticCardiacIndexLPerMinPerM2,
    leftAtrialTimeWeightedMeanPressureMmHg,
    rightAtrialTimeWeightedMeanPressureMmHg: weightedPressure(
      samples,
      "RA",
      durationSec,
    ),
    pulmonaryVeinTimeWeightedMeanPressureMmHg: weightedPressure(
      samples,
      "PVein",
      durationSec,
    ),
    pulmonaryArterySystolicPressureMmHg,
    pulmonaryArteryDiastolicPressureMmHg,
    pulmonaryArteryTimeWeightedMeanPressureMmHg,
    pulmonaryArteryPulsePressureMmHg,
    pulmonaryArterialComplianceProxyMlPerMmHg:
      nativePulmonaryForwardVolumeMl / pulmonaryArteryPulsePressureMmHg,
    pulmonaryVascularResistanceProxyWoodUnits:
      (pulmonaryArteryTimeWeightedMeanPressureMmHg -
        leftAtrialTimeWeightedMeanPressureMmHg) /
      raw.nativeAorticCardiacOutputLPerMin,
    aorticSystolicPressureMmHg,
    aorticDiastolicPressureMmHg,
    aorticTimeWeightedMeanPressureMmHg: weightedPressure(
      samples,
      "Ao",
      durationSec,
    ),
    aorticPulsePressureMmHg:
      aorticSystolicPressureMmHg - aorticDiastolicPressureMmHg,
  });
}

function coronarySummary(
  kernel: MainWireIntegratedModelPeriodicKernelResultV3,
): MainWireIntegratedModelTbvCoronaryV1 {
  const samples = kernel.terminalCycleTrace.samples;
  const durationSec = duration(samples);
  const meanInletFlowMlPerSec =
    samples.reduce(
      (sum, sample) =>
        sum + sample.coronary.totalInletFlowMlPerSec * sample.acceptedDtSec,
      0,
    ) / durationSec;
  const tone =
    kernel.terminalAcceptedState.coronary.coronary
      .toneResistanceScaleByTerritoryLayer;
  const toneValues = CORONARY_TERRITORY_IDS_V2.flatMap((territoryId) =>
    CORONARY_LAYER_IDS_V2.map((layerId) => tone[territoryId][layerId]),
  );
  return deepFreeze({
    terminalTotalBloodVolumeMl: coronaryBloodVolumeMl(
      kernel.terminalAcceptedState,
    ),
    terminalCycleTimeWeightedMeanInletFlowMlPerSec: meanInletFlowMlPerSec,
    terminalCycleTimeWeightedMeanInletFlowMlPerMin: meanInletFlowMlPerSec * 60,
    terminalToneResistanceScaleMean:
      toneValues.reduce((sum, value) => sum + value, 0) / toneValues.length,
    terminalToneResistanceScaleByTerritoryLayer: tone,
  });
}

function pairedDelta(
  base: MainWireIntegratedModelTbvAttributionArmV1,
  current: MainWireIntegratedModelTbvAttributionArmV1,
): MainWireIntegratedModelTbvPairedDeltaV1 {
  return deepFreeze({
    direction: "base-ledger-minus-current-ledger" as const,
    fixedGlobalTotalBloodVolumeMl:
      base.ledger.fixedGlobalTotalBloodVolumeMl -
      current.ledger.fixedGlobalTotalBloodVolumeMl,
    hemodynamics: subtractHemodynamics(base.hemodynamics, current.hemodynamics),
    coronary: subtractCoronary(base.coronary, current.coronary),
  });
}

function subtractHemodynamics(
  left: MainWireIntegratedModelTbvHemodynamicsV1,
  right: MainWireIntegratedModelTbvHemodynamicsV1,
): MainWireIntegratedModelTbvHemodynamicsV1 {
  return mapNumericRecordDifference(
    left,
    right,
  ) as MainWireIntegratedModelTbvHemodynamicsV1;
}

function subtractCoronary(
  left: MainWireIntegratedModelTbvCoronaryV1,
  right: MainWireIntegratedModelTbvCoronaryV1,
): MainWireIntegratedModelTbvCoronaryV1 {
  return deepFreeze({
    terminalTotalBloodVolumeMl:
      left.terminalTotalBloodVolumeMl - right.terminalTotalBloodVolumeMl,
    terminalCycleTimeWeightedMeanInletFlowMlPerSec:
      left.terminalCycleTimeWeightedMeanInletFlowMlPerSec -
      right.terminalCycleTimeWeightedMeanInletFlowMlPerSec,
    terminalCycleTimeWeightedMeanInletFlowMlPerMin:
      left.terminalCycleTimeWeightedMeanInletFlowMlPerMin -
      right.terminalCycleTimeWeightedMeanInletFlowMlPerMin,
    terminalToneResistanceScaleMean:
      left.terminalToneResistanceScaleMean -
      right.terminalToneResistanceScaleMean,
    terminalToneResistanceScaleByTerritoryLayer: territoryLayerDifference(
      left.terminalToneResistanceScaleByTerritoryLayer,
      right.terminalToneResistanceScaleByTerritoryLayer,
    ),
  });
}

function mapNumericRecordDifference(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  return deepFreeze(
    Object.fromEntries(
      Object.keys(left).map((key) => [key, left[key]! - right[key]!] as const),
    ),
  );
}

function territoryLayerDifference(
  left: CoronaryTerritoryLayerRecordV2<number>,
  right: CoronaryTerritoryLayerRecordV2<number>,
): CoronaryTerritoryLayerRecordV2<number> {
  return deepFreeze(
    Object.fromEntries(
      CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
        territoryId,
        Object.fromEntries(
          CORONARY_LAYER_IDS_V2.map((layerId) => [
            layerId,
            left[territoryId][layerId] - right[territoryId][layerId],
          ]),
        ),
      ]),
    ),
  ) as CoronaryTerritoryLayerRecordV2<number>;
}

function coronaryBloodVolumeMl(
  state: MainWireIntegratedModelPeriodicKernelResultV3["terminalAcceptedState"],
): number {
  return CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.reduce(
    (sum, nodeId) => sum + state.coronary.coronary.volumeMlByNode[nodeId],
    0,
  );
}

function maximumCycleDiagnostic(
  kernel: MainWireIntegratedModelPeriodicKernelResultV3,
  key: keyof MainWireIntegratedModelPeriodicKernelResultV3["cycles"][number]["conservation"],
): number {
  const values = kernel.cycles.map((cycle) => cycle.conservation[key]);
  if (values.some((value) => typeof value !== "number")) {
    throw new Error(`TBV attribution diagnostic ${key} is not numeric`);
  }
  return Math.max(...(values as number[]));
}

function duration(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
): number {
  if (samples.length === 0) {
    throw new Error("TBV attribution requires a non-empty terminal trace");
  }
  const value = samples.reduce((sum, sample) => sum + sample.acceptedDtSec, 0);
  if (Math.abs(value - 1) > 1e-10) {
    throw new Error("TBV attribution terminal trace must span one second");
  }
  return value;
}

function weightedPressure(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  key: keyof MainWireIntegratedModelPeriodicTerminalTraceSampleV3["absolutePressureMmHg"],
  durationSec: number,
): number {
  return (
    samples.reduce(
      (sum, sample) =>
        sum + sample.absolutePressureMmHg[key] * sample.acceptedDtSec,
      0,
    ) / durationSec
  );
}

function maximumPressure(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  key: keyof MainWireIntegratedModelPeriodicTerminalTraceSampleV3["absolutePressureMmHg"],
): number {
  return Math.max(...samples.map((sample) => sample.absolutePressureMmHg[key]));
}

function minimumPressure(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  key: keyof MainWireIntegratedModelPeriodicTerminalTraceSampleV3["absolutePressureMmHg"],
): number {
  return Math.min(...samples.map((sample) => sample.absolutePressureMmHg[key]));
}

function resolveOptions(
  options: MainWireIntegratedModelTbvAttributionOptionsV1,
) {
  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    throw new Error("TBV attribution options must be an object");
  }
  const keys = Object.keys(options);
  if (
    keys.some((key) => !["executionPurpose", "maximumCycleCount"].includes(key))
  ) {
    throw new Error("TBV attribution options contain unexpected fields");
  }
  const executionPurpose =
    options.executionPurpose ?? "primary-attribution-evidence";
  if (
    executionPurpose !== "primary-attribution-evidence" &&
    executionPurpose !== "bounded-smoke"
  ) {
    throw new Error("unsupported TBV attribution execution purpose");
  }
  const maximumCycleCount =
    options.maximumCycleCount ??
    (executionPurpose === "bounded-smoke"
      ? 1
      : MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.primaryMaximumCycleCount);
  const maximumAllowed =
    executionPurpose === "bounded-smoke"
      ? MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.boundedSmokeMaximumCycleCount
      : MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.primaryMaximumCycleCount;
  if (
    !Number.isSafeInteger(maximumCycleCount) ||
    maximumCycleCount < 1 ||
    maximumCycleCount > maximumAllowed
  ) {
    throw new RangeError(
      `TBV attribution maximumCycleCount must be from 1 through ${maximumAllowed}`,
    );
  }
  if (
    executionPurpose === "primary-attribution-evidence" &&
    maximumCycleCount !==
      MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.primaryMaximumCycleCount
  ) {
    throw new Error(
      "primary TBV attribution must retain the predeclared maximum cycle count",
    );
  }
  return Object.freeze({
    executionPurpose,
    maximumCycleCount,
    nominalDtSec:
      MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.primaryNominalDtSec,
    evidenceRole:
      executionPurpose === "primary-attribution-evidence"
        ? MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.primaryClassifierEvidenceRole
        : MAIN_WIRE_INTEGRATED_MODEL_TBV_ATTRIBUTION_PROTOCOL_V1.boundedSmokeClassifierEvidenceRole,
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
  }
  return value;
}
