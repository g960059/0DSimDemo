import {
  baseNonValveEdgeLossV1,
  vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  buildNonCoronaryCirculationGraphV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  mainWireIntegratedModelPeriodicFixtureIdentityV3,
  runMainWireIntegratedModelPeriodicKernelV3,
  type MainWireIntegratedModelPeriodicKernelResultV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

export const MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_V1_ID =
  "main-wire-integrated-model-pulmonary-waveform-mechanism-audit-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1 =
  deepFreeze({
    protocolVersion: 1 as const,
    protocolStatus:
      "declared-after-observing-the-broad-PA-secondary-maximum-but-before-inspecting-expanded-pulmonary-internal-readback" as const,
    primaryNominalDtSec: 0.002,
    primaryMaximumCycleCount:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.maximumCycleCount,
    primaryClassifierEvidenceRole: "canonical-periodic-protocol" as const,
    boundedSmokeClassifierEvidenceRole: "bounded-exploration-only" as const,
    parameterChangesApplied: false as const,
    waveformFittingApplied: false as const,
    healthGateUsedAsFitObjective: false as const,
    retainedAcceptedEndpointReadback: {
      nodeVolumes: ["PA", "PArt", "PCap", "PVen", "PVein"] as const,
      nodeAbsolutePressures: ["PA", "PArt", "PCap", "PVen", "PVein"] as const,
      edgeFlows: [
        "PV",
        "PA_PArt",
        "PArt_PCap",
        "PCap_PVen",
        "PVen_PVein",
        "PVein_LA",
      ] as const,
      interpolationApplied: false as const,
      resamplingApplied: false as const,
      smoothingApplied: false as const,
    },
    eventDefinitions: {
      pulmonaryValveOpen:
        "accepted-endpoint-PV-flow-strictly-greater-than-zero" as const,
      ejectionComponent:
        "cyclic-contiguous-open-component-containing-maximum-PA-pressure-among-open-samples" as const,
      firstClosedEndpoint:
        "first-accepted-endpoint-after-that-component-with-PV-flow-exactly-zero" as const,
      postClosureInterval:
        "first-closed-endpoint-through-endpoint-before-next-cyclic-open-component" as const,
      secondaryMaximum:
        "maximum-PA-pressure-accepted-endpoint-in-post-closure-interval" as const,
      reboundTrough:
        "minimum-PA-pressure-from-first-closed-endpoint-through-secondary-maximum" as const,
    },
    numericalInterpretationTolerances: {
      materialPressureRiseMmHg: 1e-6,
      continuityResidualMl: 1e-7,
      dynamicEdgePressureBalanceResidualMmHg: 1e-8,
      purpose:
        "floating-point-mechanism-classification-only-not-physiological-acceptance" as const,
    },
    mechanismQuestionsInOrder: [
      "is-PV-inflow-zero-through-the-rebound",
      "does-PA-volume-rise-during-the-rebound",
      "does-PA_PArt-flow-reverse-from-distal-to-proximal",
      "does-accepted-BE-continuity-reconstruct-that-volume-rise",
      "does-the-PA_PArt-RL-pressure-balance-close",
      "is-the-observed-timing-compatible-with-the-local-linearized-two-node-RLC-timescale",
    ] as const,
    literatureContext: [
      {
        sourceId: "kheyfets-2016-zero-dimensional-rv-pa",
        url: "https://pubmed.ncbi.nlm.nih.gov/27684888/",
        role:
          "primary-modeling-context-three-element-0D-can-recover-summary-hemodynamics-while-specific-waveform-traits-such-as-reflections-remain-unvalidated",
      },
      {
        sourceId: "su-2017-pulmonary-wave-intensity",
        url: "https://pubmed.ncbi.nlm.nih.gov/29089339/",
        role:
          "primary-human-simultaneous-pressure-flow-context-wave-direction-and-reflection-require-both-signals-and-controls-showed-minimal-backward-wave-intensity",
      },
      {
        sourceId: "lankhaar-2006-three-element-afterload",
        url: "https://pubmed.ncbi.nlm.nih.gov/16699074/",
        role:
          "primary-human-context-RV-afterload-needs-resistance-compliance-and-characteristic-impedance-not-PVR-alone",
      },
      {
        sourceId: "tedford-2012-pulmonary-RC",
        url: "https://pubmed.ncbi.nlm.nih.gov/22131357/",
        role:
          "primary-clinical-context-PVR-compliance-inverse-relation-and-wedge-pressure-dependence-descriptive-only-for-this-unmatched-model",
      },
    ] as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_CLAIM_V1 =
  deepFreeze({
    purpose:
      "post-observation-mechanism-attribution-of-a-broad-PA-pressure-rebound-without-changing-the-model" as const,
    broadSecondaryMaximumWasKnownBeforeProtocol: true as const,
    expandedInternalPressureVolumeFlowReadbackInspectedBeforeProtocol: false as const,
    measurementStationAuditIncluded: true as const,
    localRlcTimescaleIsFullNetworkEigenanalysis: false as const,
    zeroDimensionalReverseFlowIsClinicalWaveReflection: false as const,
    proxyRcTimeIsMatchedClinicalValidation: false as const,
    parameterOrWaveformFittingApplied: false as const,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
    releaseAcceptanceEstablished: false as const,
  });

export type MainWireIntegratedModelPulmonaryWaveformAuditExecutionPurposeV1 =
  "primary-mechanism-audit" | "bounded-smoke";

export type MainWireIntegratedModelPulmonaryWaveformAuditOptionsV1 =
  Readonly<{
    executionPurpose?: MainWireIntegratedModelPulmonaryWaveformAuditExecutionPurposeV1;
    maximumCycleCount?: number;
  }>;

type PulmonaryNodeName = "PA" | "PArt" | "PCap" | "PVen" | "PVein";
type PulmonaryEdgeName =
  | "PV"
  | "PA_PArt"
  | "PArt_PCap"
  | "PCap_PVen"
  | "PVen_PVein"
  | "PVein_LA";
type TraceSample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;

export type MainWireIntegratedModelPulmonaryWaveformPointV1 = Readonly<{
  sampleIndex: number;
  acceptedTimeSec: number;
  cyclePhase01: number;
  timeFromEjectionOpenSec: number;
  paPressureMmHg: number;
  partPressureMmHg: number;
  paVolumeMl: number;
  partVolumeMl: number;
  pulmonaryValveFlowMlPerSec: number;
  paToPartFlowMlPerSec: number;
}>;

export type MainWireIntegratedModelPulmonaryWaveformDiagnosticsV1 =
  Readonly<{
    terminalTraceSampleCount: number;
    terminalTraceDurationSec: number;
    topology: Readonly<{
      proximalDynamicEdge: "PA_PArt";
      upstreamNode: "PA";
      downstreamNode: "PArt";
      downstreamResistiveEdge: "PArt_PCap";
      paAndPartShareExternalPressureKind: true;
      respiratoryExternalPressureIsTimeInvariant: true;
    }>;
    events: Readonly<{
      ejectionFirstOpenEndpoint: MainWireIntegratedModelPulmonaryWaveformPointV1;
      ejectionPrimaryPressureMaximum: MainWireIntegratedModelPulmonaryWaveformPointV1;
      ejectionFirstClosedEndpoint: MainWireIntegratedModelPulmonaryWaveformPointV1;
      postClosureSecondaryPressureMaximum: MainWireIntegratedModelPulmonaryWaveformPointV1;
      reboundPressureTrough: MainWireIntegratedModelPulmonaryWaveformPointV1;
      firstDistalToProximalPaPartFlowEndpoint:
        MainWireIntegratedModelPulmonaryWaveformPointV1 | null;
      ejectionOpenDurationSec: number;
      closureToSecondaryMaximumSec: number;
      troughToSecondaryMaximumSec: number;
    }>;
    pressureMorphology: Readonly<{
      primaryMaximumMmHg: number;
      secondaryMaximumMmHg: number;
      secondaryToPrimaryRatio: number;
      reboundTroughMmHg: number;
      reboundAmplitudeMmHg: number;
      postClosurePositiveVariationMmHg: number;
      postClosureNegativeVariationMagnitudeMmHg: number;
      largestAcceptedStepPressureRiseMmHg: number;
      postClosureNumericallyMonotoneNonincreasing: boolean;
    }>;
    reboundFlowVolumeAttribution: Readonly<{
      maximumAbsolutePulmonaryValveFlowDuringReboundMlPerSec: number;
      minimumPaToPartFlowDuringReboundMlPerSec: number;
      distalToProximalPaPartVolumeDuringReboundMl: number;
      forwardPaToPartVolumeDuringReboundMl: number;
      paVolumeIncreaseDuringReboundMl: number;
      backwardEulerPredictedPaVolumeIncreaseDuringReboundMl: number;
      paVolumeReconstructionResidualMl: number;
      postClosureDistalToProximalFlowDurationSec: number;
      directRvInflowDuringReboundExactlyZero: boolean;
      distalToProximalPaPartFlowDuringReboundPresent: boolean;
    }>;
    acceptedContinuityAudit: Readonly<{
      maximumAbsoluteResidualMlByNode: Readonly<
        Record<PulmonaryNodeName, number>
      >;
      maximumAbsoluteResidualMl: number;
      withinPredeclaredNumericalTolerance: boolean;
      firstTraceStepExcludedBecausePreviousEndpointIsNotRetained: true;
    }>;
    proximalDynamicEdgeAudit: Readonly<{
      resistanceMmHgSecPerMl: number;
      inertanceMmHgSec2PerMl: number;
      maximumAbsoluteBackwardEulerPressureBalanceResidualMmHg: number;
      withinPredeclaredNumericalTolerance: boolean;
      secondaryMaximumPressureBalanceAvailable: boolean;
      atSecondaryMaximum: Readonly<{
        pressureGradientMmHg: number;
        resistiveDropMmHg: number;
        inertiveDropMmHg: number;
        pressureBalanceResidualMmHg: number;
      }> | null;
      maximumStoredInertiveEnergyMmHgMl: number;
    }>;
    localLinearizedTwoNodeRlcContext: Readonly<{
      evaluatedAt: "post-closure-secondary-pressure-maximum";
      paIncrementalComplianceMlPerMmHg: number;
      partIncrementalComplianceMlPerMmHg: number;
      seriesEffectiveComplianceMlPerMmHg: number;
      undampedAngularFrequencyRadPerSec: number;
      undampedPeriodSec: number;
      localEdgeOnlyDampingRatio: number;
      closureToSecondaryMaximumAsFractionOfUndampedPeriod: number;
      interpretation:
        "local-two-node-timescale-only-downstream-network-and-heart-excluded";
    }>;
    wholeBedDescriptiveContext: Readonly<{
      pulmonaryForwardStrokeVolumeMl: number;
      pulmonaryArteryPulsePressureMmHg: number;
      pulmonaryArterialComplianceProxyMlPerMmHg: number;
      pulmonaryVascularResistanceProxyWoodUnits: number;
      proxyResistanceComplianceTimeSec: number;
      matchedClinicalValidationClaimed: false;
    }>;
    attributionClassification:
      | "distal-to-proximal-PA_PArt-inertial-rebound"
      | "post-closure-rise-without-resolved-proximal-inertial-reversal"
      | "no-material-post-closure-rise";
    graphShapeAcceptanceClaimed: false;
  }>;

export type MainWireIntegratedModelPulmonaryWaveformAuditResultV1 =
  Readonly<{
    experimentId: typeof MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_V1_ID;
    executionPurpose: MainWireIntegratedModelPulmonaryWaveformAuditExecutionPurposeV1;
    protocolIdentityHash: string;
    nominalDtSec: number;
    requestedMaximumCycleCount: number;
    completedCycleCount: number;
    classificationStatus: MainWireIntegratedModelPeriodicKernelResultV3["classification"]["status"];
    terminalPeriod1MaximumNormalizedDelta: number;
    allCyclesFiniteConservedAndEventExact: boolean;
    terminalCheckpointExactRoundTripVerified: true;
    primaryMechanismAttributionEstablished: boolean;
    diagnostics: MainWireIntegratedModelPulmonaryWaveformDiagnosticsV1;
    physiologicalAcceptanceEstablished: false;
    independentValidationEstablished: false;
    releaseAcceptanceEstablished: false;
    protocol: typeof MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1;
    claim: typeof MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_CLAIM_V1;
  }>;

export async function runMainWireIntegratedModelPulmonaryWaveformAuditV1(
  options: MainWireIntegratedModelPulmonaryWaveformAuditOptionsV1 = {},
): Promise<MainWireIntegratedModelPulmonaryWaveformAuditResultV1> {
  const resolved = resolveOptions(options);
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
  const protocolIdentityHash = await sha256CanonicalJsonHex({
    experimentId: MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_V1_ID,
    executionPurpose: resolved.executionPurpose,
    nominalDtSec: resolved.nominalDtSec,
    maximumCycleCount: resolved.maximumCycleCount,
    protocol:
      MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1,
    claim: MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_CLAIM_V1,
    fixtureIdentity: mainWireIntegratedModelPeriodicFixtureIdentityV3(fixture),
  });
  const kernel = await runMainWireIntegratedModelPeriodicKernelV3(fixture, {
    protocolIdentityHash,
    nominalDtSec: resolved.nominalDtSec,
    maximumCycleCount: resolved.maximumCycleCount,
    stopAfterClassification: true,
    evidenceRole: resolved.evidenceRole,
  });
  const terminalCycle = kernel.cycles.at(-1);
  if (terminalCycle === undefined) {
    throw new Error("pulmonary waveform audit has no completed cycle");
  }
  const diagnostics = pulmonaryWaveformDiagnostics(
    kernel.terminalCycleTrace.samples,
    fixture,
  );
  const primaryMechanismAttributionEstablished =
    resolved.executionPurpose === "primary-mechanism-audit" &&
    kernel.classification.status === "period1-converged" &&
    kernel.allCyclesFiniteConservedAndEventExact &&
    diagnostics.acceptedContinuityAudit.withinPredeclaredNumericalTolerance &&
    diagnostics.proximalDynamicEdgeAudit
      .withinPredeclaredNumericalTolerance &&
    diagnostics.attributionClassification ===
      "distal-to-proximal-PA_PArt-inertial-rebound";
  return deepFreeze({
    experimentId:
      MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_V1_ID,
    executionPurpose: resolved.executionPurpose,
    protocolIdentityHash,
    nominalDtSec: resolved.nominalDtSec,
    requestedMaximumCycleCount: resolved.maximumCycleCount,
    completedCycleCount: kernel.completedCycleCount,
    classificationStatus: kernel.classification.status,
    terminalPeriod1MaximumNormalizedDelta:
      terminalCycle.period1MaximumNormalizedDelta,
    allCyclesFiniteConservedAndEventExact:
      kernel.allCyclesFiniteConservedAndEventExact,
    terminalCheckpointExactRoundTripVerified:
      kernel.terminalCheckpointExactRoundTripVerified,
    primaryMechanismAttributionEstablished,
    diagnostics,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    protocol:
      MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1,
    claim: MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_CLAIM_V1,
  });
}

function pulmonaryWaveformDiagnostics(
  samples: readonly TraceSample[],
  fixture: ReturnType<
    typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
  >,
): MainWireIntegratedModelPulmonaryWaveformDiagnosticsV1 {
  const durationSec = traceDuration(samples);
  const graph = buildNonCoronaryCirculationGraphV1();
  const paNode = graph.nodes[graph.nodeIndex.get("PA")!];
  const partNode = graph.nodes[graph.nodeIndex.get("PArt")!];
  const dynamicEdge = graph.edges[graph.edgeIndex.get("PA_PArt")!];
  const downstreamEdge = graph.edges[graph.edgeIndex.get("PArt_PCap")!];
  if (
    paNode?.name !== "PA" ||
    partNode?.name !== "PArt" ||
    dynamicEdge?.kind !== "dynamic" ||
    dynamicEdge.up !== "PA" ||
    dynamicEdge.down !== "PArt" ||
    downstreamEdge?.up !== "PArt" ||
    downstreamEdge.down !== "PCap" ||
    paNode.ext !== "pth" ||
    partNode.ext !== "pth"
  ) {
    throw new Error("pulmonary waveform audit topology differs");
  }
  const respiratory = fixture.runtime.respiratory;
  if (
    respiratory.respAmpTh !== 0 ||
    respiratory.respAmpAlv !== 0 ||
    respiratory.respRate !== 0
  ) {
    throw new Error("pulmonary waveform audit requires static external pressure");
  }

  const open = samples.map(
    (sample) => sample.pulmonaryCirculation.edgeFlowMlPerSec.PV > 0,
  );
  if (!open.some(Boolean) || open.every(Boolean)) {
    throw new Error("pulmonary waveform audit requires open and closed PV samples");
  }
  const openPressureMaximumIndex = maximumIndex(
    samples,
    (sample, index) =>
      open[index]
        ? sample.pulmonaryCirculation.absolutePressureMmHg.PA
        : Number.NEGATIVE_INFINITY,
  );
  const openStartIndex = cyclicComponentStart(open, openPressureMaximumIndex);
  const firstClosedIndex = cyclicFirstFalseAfter(
    open,
    openPressureMaximumIndex,
  );
  const postClosureIndices = cyclicIndicesUntil(
    firstClosedIndex,
    openStartIndex,
    samples.length,
  );
  if (postClosureIndices.length === 0) {
    throw new Error("pulmonary waveform audit lacks a post-closure interval");
  }
  const secondaryIndex = maximumIndexWithin(
    samples,
    postClosureIndices,
    (sample) => sample.pulmonaryCirculation.absolutePressureMmHg.PA,
  );
  const secondaryPosition = postClosureIndices.indexOf(secondaryIndex);
  const preSecondaryIndices = postClosureIndices.slice(
    0,
    secondaryPosition + 1,
  );
  const troughIndex = minimumIndexWithin(
    samples,
    preSecondaryIndices,
    (sample) => sample.pulmonaryCirculation.absolutePressureMmHg.PA,
  );
  const troughPosition = postClosureIndices.indexOf(troughIndex);
  const reboundIndices = postClosureIndices.slice(
    troughPosition,
    secondaryPosition + 1,
  );
  if (reboundIndices.length === 0) {
    throw new Error("pulmonary waveform audit lacks a rebound interval");
  }
  const firstReverseIndex =
    postClosureIndices.find(
      (index) =>
        samples[index]!.pulmonaryCirculation.edgeFlowMlPerSec.PA_PArt < 0,
    ) ?? null;

  const point = (index: number) =>
    waveformPoint(samples, index, openStartIndex, durationSec);
  const primary = point(openPressureMaximumIndex);
  const secondary = point(secondaryIndex);
  const trough = point(troughIndex);
  const openStart = point(openStartIndex);
  const firstClosed = point(firstClosedIndex);
  const firstReverse = firstReverseIndex === null
    ? null
    : point(firstReverseIndex);

  const postClosureVariations = pressureVariations(
    samples,
    postClosureIndices,
  );
  const rebound = reboundAttribution(
    samples,
    reboundIndices,
    troughIndex,
    secondaryIndex,
  );
  const continuity = continuityAudit(samples);
  const loss = baseNonValveEdgeLossV1(dynamicEdge, fixture.runtime.losses);
  const resistance = loss.resistanceMmHgSecPerMl;
  const inertance = dynamicEdge.L ?? 0;
  if (!(inertance > 0)) {
    throw new Error("pulmonary waveform audit requires positive PA_PArt inertance");
  }
  const dynamicAudit = dynamicEdgeAudit(
    samples,
    secondaryIndex,
    resistance,
    inertance,
  );
  const paTangent =
    vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1(
      paNode,
      samples[secondaryIndex]!.pulmonaryCirculation.nodeVolumeMl.PA,
      fixture.runtime.vascular,
      "adaptive-volume-tolerance",
    );
  const partTangent =
    vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1(
      partNode,
      samples[secondaryIndex]!.pulmonaryCirculation.nodeVolumeMl.PArt,
      fixture.runtime.vascular,
      "adaptive-volume-tolerance",
    );
  const paCompliance =
    1 / paTangent.dTransmuralPressureDPhysicalVolumeMmHgPerMl;
  const partCompliance =
    1 / partTangent.dTransmuralPressureDPhysicalVolumeMmHgPerMl;
  const seriesCompliance =
    1 / (1 / paCompliance + 1 / partCompliance);
  const omega = Math.sqrt(1 / (inertance * seriesCompliance));
  const undampedPeriodSec = 2 * Math.PI / omega;
  const closureToSecondarySec =
    cyclicElapsedSec(
      samples[firstClosedIndex]!.cyclePhase01,
      samples[secondaryIndex]!.cyclePhase01,
      durationSec,
    );
  const wholeBed = wholeBedContext(samples, durationSec);
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1
      .numericalInterpretationTolerances;
  const materialRise =
    secondary.paPressureMmHg - trough.paPressureMmHg >
    tolerance.materialPressureRiseMmHg;
  const resolvedInertialReversal =
    materialRise &&
    rebound.directRvInflowDuringReboundExactlyZero &&
    rebound.distalToProximalPaPartFlowDuringReboundPresent &&
    continuity.withinPredeclaredNumericalTolerance &&
    dynamicAudit.withinPredeclaredNumericalTolerance;

  return deepFreeze({
    terminalTraceSampleCount: samples.length,
    terminalTraceDurationSec: durationSec,
    topology: {
      proximalDynamicEdge: "PA_PArt" as const,
      upstreamNode: "PA" as const,
      downstreamNode: "PArt" as const,
      downstreamResistiveEdge: "PArt_PCap" as const,
      paAndPartShareExternalPressureKind: true as const,
      respiratoryExternalPressureIsTimeInvariant: true as const,
    },
    events: {
      ejectionFirstOpenEndpoint: openStart,
      ejectionPrimaryPressureMaximum: primary,
      ejectionFirstClosedEndpoint: firstClosed,
      postClosureSecondaryPressureMaximum: secondary,
      reboundPressureTrough: trough,
      firstDistalToProximalPaPartFlowEndpoint: firstReverse,
      ejectionOpenDurationSec: cyclicElapsedSec(
        openStart.cyclePhase01,
        firstClosed.cyclePhase01,
        durationSec,
      ),
      closureToSecondaryMaximumSec: closureToSecondarySec,
      troughToSecondaryMaximumSec: cyclicElapsedSec(
        trough.cyclePhase01,
        secondary.cyclePhase01,
        durationSec,
      ),
    },
    pressureMorphology: {
      primaryMaximumMmHg: primary.paPressureMmHg,
      secondaryMaximumMmHg: secondary.paPressureMmHg,
      secondaryToPrimaryRatio:
        secondary.paPressureMmHg / primary.paPressureMmHg,
      reboundTroughMmHg: trough.paPressureMmHg,
      reboundAmplitudeMmHg:
        secondary.paPressureMmHg - trough.paPressureMmHg,
      postClosurePositiveVariationMmHg:
        postClosureVariations.positiveVariationMmHg,
      postClosureNegativeVariationMagnitudeMmHg:
        postClosureVariations.negativeVariationMagnitudeMmHg,
      largestAcceptedStepPressureRiseMmHg:
        postClosureVariations.largestRiseMmHg,
      postClosureNumericallyMonotoneNonincreasing:
        postClosureVariations.largestRiseMmHg <=
        tolerance.materialPressureRiseMmHg,
    },
    reboundFlowVolumeAttribution: rebound,
    acceptedContinuityAudit: continuity,
    proximalDynamicEdgeAudit: dynamicAudit,
    localLinearizedTwoNodeRlcContext: {
      evaluatedAt: "post-closure-secondary-pressure-maximum" as const,
      paIncrementalComplianceMlPerMmHg: paCompliance,
      partIncrementalComplianceMlPerMmHg: partCompliance,
      seriesEffectiveComplianceMlPerMmHg: seriesCompliance,
      undampedAngularFrequencyRadPerSec: omega,
      undampedPeriodSec,
      localEdgeOnlyDampingRatio:
        0.5 * resistance * Math.sqrt(seriesCompliance / inertance),
      closureToSecondaryMaximumAsFractionOfUndampedPeriod:
        closureToSecondarySec / undampedPeriodSec,
      interpretation:
        "local-two-node-timescale-only-downstream-network-and-heart-excluded" as const,
    },
    wholeBedDescriptiveContext: wholeBed,
    attributionClassification: !materialRise
      ? ("no-material-post-closure-rise" as const)
      : resolvedInertialReversal
        ? ("distal-to-proximal-PA_PArt-inertial-rebound" as const)
        : ("post-closure-rise-without-resolved-proximal-inertial-reversal" as const),
    graphShapeAcceptanceClaimed: false as const,
  });
}

function waveformPoint(
  samples: readonly TraceSample[],
  index: number,
  openStartIndex: number,
  durationSec: number,
): MainWireIntegratedModelPulmonaryWaveformPointV1 {
  const sample = samples[index]!;
  const pulmonary = sample.pulmonaryCirculation;
  return deepFreeze({
    sampleIndex: index,
    acceptedTimeSec: sample.acceptedTimeSec,
    cyclePhase01: sample.cyclePhase01,
    timeFromEjectionOpenSec: cyclicElapsedSec(
      samples[openStartIndex]!.cyclePhase01,
      sample.cyclePhase01,
      durationSec,
    ),
    paPressureMmHg: pulmonary.absolutePressureMmHg.PA,
    partPressureMmHg: pulmonary.absolutePressureMmHg.PArt,
    paVolumeMl: pulmonary.nodeVolumeMl.PA,
    partVolumeMl: pulmonary.nodeVolumeMl.PArt,
    pulmonaryValveFlowMlPerSec: pulmonary.edgeFlowMlPerSec.PV,
    paToPartFlowMlPerSec: pulmonary.edgeFlowMlPerSec.PA_PArt,
  });
}

function pressureVariations(
  samples: readonly TraceSample[],
  orderedIndices: readonly number[],
) {
  let positiveVariationMmHg = 0;
  let negativeVariationMagnitudeMmHg = 0;
  let largestRiseMmHg = Number.NEGATIVE_INFINITY;
  for (let position = 1; position < orderedIndices.length; position += 1) {
    const previous = samples[orderedIndices[position - 1]!]!
      .pulmonaryCirculation.absolutePressureMmHg.PA;
    const current = samples[orderedIndices[position]!]!
      .pulmonaryCirculation.absolutePressureMmHg.PA;
    const difference = current - previous;
    positiveVariationMmHg += Math.max(0, difference);
    negativeVariationMagnitudeMmHg += Math.max(0, -difference);
    largestRiseMmHg = Math.max(largestRiseMmHg, difference);
  }
  return {
    positiveVariationMmHg,
    negativeVariationMagnitudeMmHg,
    largestRiseMmHg:
      largestRiseMmHg === Number.NEGATIVE_INFINITY ? 0 : largestRiseMmHg,
  };
}

function reboundAttribution(
  samples: readonly TraceSample[],
  orderedIndices: readonly number[],
  troughIndex: number,
  secondaryIndex: number,
) {
  let distalToProximalVolumeMl = 0;
  let forwardVolumeMl = 0;
  let predictedPaVolumeChangeMl = 0;
  let reverseDurationSec = 0;
  let maximumAbsolutePvFlow = 0;
  let minimumPaPartFlow = Number.POSITIVE_INFINITY;
  for (let position = 0; position < orderedIndices.length; position += 1) {
    const sample = samples[orderedIndices[position]!]!;
    const flow = sample.pulmonaryCirculation.edgeFlowMlPerSec;
    maximumAbsolutePvFlow = Math.max(maximumAbsolutePvFlow, Math.abs(flow.PV));
    minimumPaPartFlow = Math.min(minimumPaPartFlow, flow.PA_PArt);
    if (position === 0) continue;
    distalToProximalVolumeMl +=
      Math.max(0, -flow.PA_PArt) * sample.acceptedDtSec;
    forwardVolumeMl +=
      Math.max(0, flow.PA_PArt) * sample.acceptedDtSec;
    predictedPaVolumeChangeMl +=
      (flow.PV - flow.PA_PArt) * sample.acceptedDtSec;
    if (flow.PA_PArt < 0) reverseDurationSec += sample.acceptedDtSec;
  }
  const paVolumeIncreaseMl =
    samples[secondaryIndex]!.pulmonaryCirculation.nodeVolumeMl.PA -
    samples[troughIndex]!.pulmonaryCirculation.nodeVolumeMl.PA;
  return deepFreeze({
    maximumAbsolutePulmonaryValveFlowDuringReboundMlPerSec:
      maximumAbsolutePvFlow,
    minimumPaToPartFlowDuringReboundMlPerSec: minimumPaPartFlow,
    distalToProximalPaPartVolumeDuringReboundMl:
      distalToProximalVolumeMl,
    forwardPaToPartVolumeDuringReboundMl: forwardVolumeMl,
    paVolumeIncreaseDuringReboundMl: paVolumeIncreaseMl,
    backwardEulerPredictedPaVolumeIncreaseDuringReboundMl:
      predictedPaVolumeChangeMl,
    paVolumeReconstructionResidualMl:
      paVolumeIncreaseMl - predictedPaVolumeChangeMl,
    postClosureDistalToProximalFlowDurationSec: reverseDurationSec,
    directRvInflowDuringReboundExactlyZero: maximumAbsolutePvFlow === 0,
    distalToProximalPaPartFlowDuringReboundPresent:
      distalToProximalVolumeMl > 0,
  });
}

function continuityAudit(samples: readonly TraceSample[]) {
  const maximumByNode: Record<PulmonaryNodeName, number> = {
    PA: 0,
    PArt: 0,
    PCap: 0,
    PVen: 0,
    PVein: 0,
  };
  const incidence: Readonly<
    Record<PulmonaryNodeName, readonly [PulmonaryEdgeName, PulmonaryEdgeName]>
  > = {
    PA: ["PV", "PA_PArt"],
    PArt: ["PA_PArt", "PArt_PCap"],
    PCap: ["PArt_PCap", "PCap_PVen"],
    PVen: ["PCap_PVen", "PVen_PVein"],
    PVein: ["PVen_PVein", "PVein_LA"],
  };
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    for (const node of Object.keys(maximumByNode) as PulmonaryNodeName[]) {
      const [inlet, outlet] = incidence[node];
      const residual =
        current.pulmonaryCirculation.nodeVolumeMl[node] -
        previous.pulmonaryCirculation.nodeVolumeMl[node] -
        current.acceptedDtSec *
          (current.pulmonaryCirculation.edgeFlowMlPerSec[inlet] -
            current.pulmonaryCirculation.edgeFlowMlPerSec[outlet]);
      maximumByNode[node] = Math.max(maximumByNode[node], Math.abs(residual));
    }
  }
  const maximum = Math.max(...Object.values(maximumByNode));
  return deepFreeze({
    maximumAbsoluteResidualMlByNode: maximumByNode,
    maximumAbsoluteResidualMl: maximum,
    withinPredeclaredNumericalTolerance:
      maximum <=
      MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1
        .numericalInterpretationTolerances.continuityResidualMl,
    firstTraceStepExcludedBecausePreviousEndpointIsNotRetained: true as const,
  });
}

function dynamicEdgeAudit(
  samples: readonly TraceSample[],
  secondaryIndex: number,
  resistance: number,
  inertance: number,
) {
  let maximumResidual = 0;
  let maximumEnergy = 0;
  let secondaryBalance:
    | {
        pressureGradientMmHg: number;
        resistiveDropMmHg: number;
        inertiveDropMmHg: number;
        pressureBalanceResidualMmHg: number;
      }
    | undefined;
  for (let index = 0; index < samples.length; index += 1) {
    const current = samples[index]!;
    const q = current.pulmonaryCirculation.edgeFlowMlPerSec.PA_PArt;
    maximumEnergy = Math.max(maximumEnergy, 0.5 * inertance * q * q);
    if (index === 0) continue;
    const previousQ =
      samples[index - 1]!.pulmonaryCirculation.edgeFlowMlPerSec.PA_PArt;
    const pressureGradient =
      current.pulmonaryCirculation.absolutePressureMmHg.PA -
      current.pulmonaryCirculation.absolutePressureMmHg.PArt;
    const resistiveDrop = resistance * q;
    const inertiveDrop =
      inertance * (q - previousQ) / current.acceptedDtSec;
    const residual = pressureGradient - resistiveDrop - inertiveDrop;
    maximumResidual = Math.max(maximumResidual, Math.abs(residual));
    if (index === secondaryIndex) {
      secondaryBalance = {
        pressureGradientMmHg: pressureGradient,
        resistiveDropMmHg: resistiveDrop,
        inertiveDropMmHg: inertiveDrop,
        pressureBalanceResidualMmHg: residual,
      };
    }
  }
  return deepFreeze({
    resistanceMmHgSecPerMl: resistance,
    inertanceMmHgSec2PerMl: inertance,
    maximumAbsoluteBackwardEulerPressureBalanceResidualMmHg: maximumResidual,
    withinPredeclaredNumericalTolerance:
      maximumResidual <=
      MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1
        .numericalInterpretationTolerances
        .dynamicEdgePressureBalanceResidualMmHg,
    secondaryMaximumPressureBalanceAvailable:
      secondaryBalance !== undefined,
    atSecondaryMaximum: secondaryBalance ?? null,
    maximumStoredInertiveEnergyMmHgMl: maximumEnergy,
  });
}

function wholeBedContext(
  samples: readonly TraceSample[],
  durationSec: number,
) {
  const strokeVolumeMl = samples.reduce(
    (sum, sample) =>
      sum +
      Math.max(
        0,
        sample.pulmonaryCirculation.edgeFlowMlPerSec.PV,
      ) *
        sample.acceptedDtSec,
    0,
  );
  const paPressures = samples.map(
    (sample) => sample.pulmonaryCirculation.absolutePressureMmHg.PA,
  );
  const pulsePressure = Math.max(...paPressures) - Math.min(...paPressures);
  const meanPa = timeWeightedMean(
    samples,
    (sample) => sample.pulmonaryCirculation.absolutePressureMmHg.PA,
    durationSec,
  );
  const meanLa = timeWeightedMean(
    samples,
    (sample) => sample.absolutePressureMmHg.LA,
    durationSec,
  );
  const outputLPerMin = strokeVolumeMl * 60 / (1000 * durationSec);
  const compliance = strokeVolumeMl / pulsePressure;
  const resistance = (meanPa - meanLa) / outputLPerMin;
  return deepFreeze({
    pulmonaryForwardStrokeVolumeMl: strokeVolumeMl,
    pulmonaryArteryPulsePressureMmHg: pulsePressure,
    pulmonaryArterialComplianceProxyMlPerMmHg: compliance,
    pulmonaryVascularResistanceProxyWoodUnits: resistance,
    proxyResistanceComplianceTimeSec: resistance * compliance * 0.06,
    matchedClinicalValidationClaimed: false as const,
  });
}

function timeWeightedMean(
  samples: readonly TraceSample[],
  value: (sample: TraceSample) => number,
  durationSec: number,
): number {
  return samples.reduce(
    (sum, sample) => sum + value(sample) * sample.acceptedDtSec,
    0,
  ) / durationSec;
}

function traceDuration(samples: readonly TraceSample[]): number {
  if (samples.length < 3) {
    throw new Error("pulmonary waveform audit requires at least three samples");
  }
  const durationSec = samples.reduce(
    (sum, sample) => sum + sample.acceptedDtSec,
    0,
  );
  if (Math.abs(durationSec - 1) > 1e-10) {
    throw new Error("pulmonary waveform audit trace must span one second");
  }
  return durationSec;
}

function cyclicComponentStart(
  open: readonly boolean[],
  memberIndex: number,
): number {
  let index = memberIndex;
  for (let count = 0; count < open.length; count += 1) {
    const previous = modulo(index - 1, open.length);
    if (!open[previous]) return index;
    index = previous;
  }
  throw new Error("pulmonary valve open component covers the whole cycle");
}

function cyclicFirstFalseAfter(
  open: readonly boolean[],
  memberIndex: number,
): number {
  let index = memberIndex;
  for (let count = 0; count < open.length; count += 1) {
    index = modulo(index + 1, open.length);
    if (!open[index]) return index;
  }
  throw new Error("pulmonary valve never closes");
}

function cyclicIndicesUntil(
  startInclusive: number,
  endExclusive: number,
  length: number,
): number[] {
  const indices: number[] = [];
  let index = startInclusive;
  for (let count = 0; count < length; count += 1) {
    if (index === endExclusive) return indices;
    indices.push(index);
    index = modulo(index + 1, length);
  }
  throw new Error("cyclic interval did not reach its end");
}

function cyclicElapsedSec(
  startPhase01: number,
  endPhase01: number,
  durationSec: number,
): number {
  return moduloReal(endPhase01 - startPhase01, 1) * durationSec;
}

function maximumIndex(
  samples: readonly TraceSample[],
  value: (sample: TraceSample, index: number) => number,
): number {
  let selected = 0;
  let maximum = Number.NEGATIVE_INFINITY;
  samples.forEach((sample, index) => {
    const candidate = value(sample, index);
    if (candidate > maximum) {
      maximum = candidate;
      selected = index;
    }
  });
  if (!Number.isFinite(maximum)) {
    throw new Error("pulmonary waveform audit maximum is nonfinite");
  }
  return selected;
}

function maximumIndexWithin(
  samples: readonly TraceSample[],
  indices: readonly number[],
  value: (sample: TraceSample) => number,
): number {
  return extremeIndexWithin(samples, indices, value, "maximum");
}

function minimumIndexWithin(
  samples: readonly TraceSample[],
  indices: readonly number[],
  value: (sample: TraceSample) => number,
): number {
  return extremeIndexWithin(samples, indices, value, "minimum");
}

function extremeIndexWithin(
  samples: readonly TraceSample[],
  indices: readonly number[],
  value: (sample: TraceSample) => number,
  kind: "maximum" | "minimum",
): number {
  if (indices.length === 0) {
    throw new Error(`pulmonary waveform audit ${kind} interval is empty`);
  }
  let selected = indices[0]!;
  let extreme = value(samples[selected]!);
  for (const index of indices.slice(1)) {
    const candidate = value(samples[index]!);
    if (
      (kind === "maximum" && candidate > extreme) ||
      (kind === "minimum" && candidate < extreme)
    ) {
      extreme = candidate;
      selected = index;
    }
  }
  if (!Number.isFinite(extreme)) {
    throw new Error(`pulmonary waveform audit ${kind} is nonfinite`);
  }
  return selected;
}

function modulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function moduloReal(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function resolveOptions(
  options: MainWireIntegratedModelPulmonaryWaveformAuditOptionsV1,
) {
  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    throw new Error("pulmonary waveform audit options must be an object");
  }
  if (
    Object.keys(options).some(
      (key) => !["executionPurpose", "maximumCycleCount"].includes(key),
    )
  ) {
    throw new Error(
      "pulmonary waveform audit options contain unexpected fields",
    );
  }
  const executionPurpose =
    options.executionPurpose ?? "primary-mechanism-audit";
  if (
    executionPurpose !== "primary-mechanism-audit" &&
    executionPurpose !== "bounded-smoke"
  ) {
    throw new Error("unsupported pulmonary waveform audit execution purpose");
  }
  const maximumCycleCount =
    options.maximumCycleCount ??
    (executionPurpose === "bounded-smoke"
      ? 1
      : MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1
          .primaryMaximumCycleCount);
  const maximumAllowed =
    executionPurpose === "bounded-smoke"
      ? MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3
          .boundedSmokeMaximumCycleCount
      : MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1
          .primaryMaximumCycleCount;
  if (
    !Number.isSafeInteger(maximumCycleCount) ||
    maximumCycleCount < 1 ||
    maximumCycleCount > maximumAllowed
  ) {
    throw new RangeError(
      `pulmonary waveform audit maximumCycleCount must be from 1 through ${maximumAllowed}`,
    );
  }
  if (
    executionPurpose === "primary-mechanism-audit" &&
    maximumCycleCount !==
      MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1
        .primaryMaximumCycleCount
  ) {
    throw new Error(
      "primary pulmonary waveform audit must retain the predeclared maximum cycle count",
    );
  }
  return Object.freeze({
    executionPurpose,
    maximumCycleCount,
    nominalDtSec:
      MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1
        .primaryNominalDtSec,
    evidenceRole:
      executionPurpose === "primary-mechanism-audit"
        ? MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1
            .primaryClassifierEvidenceRole
        : MAIN_WIRE_INTEGRATED_MODEL_PULMONARY_WAVEFORM_AUDIT_PROTOCOL_V1
            .boundedSmokeClassifierEvidenceRole,
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
