import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
  FOUR_CHAMBER_INCIDENCE_MATRIX_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  BLOOD_COMPARTMENT_IDS,
  type BloodCompartmentId,
  type FourChamberFlowId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import type {
  PhaseB1EventFreeEndpointEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  validateNormalAdultTargetPackV1,
  type NormalAdultAtrialVolumeTargetsV1,
  type NormalAdultChamberVolumeTargetsV1,
  type NormalAdultTargetBandV1,
  type NormalAdultTargetPackV1,
} from "@/engine/myocardium/fourChamberV1/physiology/normalAdultTargetPackV1";
import type {
  PhaseB1TerminalWaveformSeriesV1,
} from "@/tools/myocardium/phaseB1TerminalWaveformArtifactV1";

export const PHASE_B1_PHYSIOLOGY_ENVELOPE_METRICS_V1_ID =
  "phase-b1-physiology-envelope-metrics-v1" as const;

const MMHG_TO_PA = 133.322387415;

export const PHASE_B1_PHYSIOLOGY_ENVELOPE_UNIMPLEMENTED_NORMAL_TARGET_PATHS_V1 =
  Object.freeze([
    "targets.globalHemodynamics.leftVentricularEndDiastolicPressureMmHg:event-local-LVEDP-requires-a-declared-valve-event-sample",
    "targets.valveAndVenousFlow.forwardGradientMmHg:requires-flow-conditioned-upstream-minus-downstream-pressure-observation",
    "targets.valveAndVenousFlow.atrioventricularInflow.tricuspidEToARatio:TV-phase-diagnostic-not-yet-owned",
  ] as const);

export const PHASE_B1_PHYSIOLOGY_ENVELOPE_CHAMBER_IDS_V1 = Object.freeze([
  "LA",
  "LV",
  "RA",
  "RV",
] as const);

export const PHASE_B1_PHYSIOLOGY_ENVELOPE_VALVE_FLOW_IDS_V1 = Object.freeze([
  "Q_MV",
  "Q_AoV",
  "Q_TV",
  "Q_PuV",
] as const);

export const PHASE_B1_PHYSIOLOGY_ENVELOPE_REQUIRED_NORMAL_TARGET_METRICS_V1 =
  Object.freeze([
    "cycle.heartRateBpm",
    "tbv.maximumRelativeDrift",
    "period.maximumNormalizedDistance",
    "circulation.left.signedOutflowCardiacOutputLPerMin",
    "circulation.right.signedOutflowCardiacOutputLPerMin",
    "circulation.leftRightSignedOutputMismatchFraction",
    "pressure.SA.minimumPa",
    "pressure.SA.maximumPa",
    "pressure.SA.meanPa",
    "pressure.PA.meanPa",
    "pressure.LA.meanPa",
    "pressure.RA.meanPa",
    "pressure.RV.maximumPa",
  ] as const);

export type PhaseB1PhysiologyEnvelopeChamberIdV1 =
  (typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_CHAMBER_IDS_V1)[number];

export type PhaseB1PhysiologyEnvelopeValveFlowIdV1 =
  (typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_VALVE_FLOW_IDS_V1)[number];

export type PhaseB1PhysiologyEnvelopeIntegrationSourceV1 =
  | "committed-backward-euler-left-limit-evaluations"
  | "terminal-waveform-right-continuous-projection";

export type PhaseB1PhysiologyEnvelopeMetricSampleV1 = Readonly<{
  absoluteTimeSec: number;
  phaseSec: number;
  bloodVolumesM3: Readonly<Partial<Record<BloodCompartmentId, number>>>;
  compartmentAbsolutePressurePa: Readonly<Record<BloodCompartmentId, number>>;
  allFlowsM3PerSec: Readonly<Record<FourChamberFlowId, number>>;
}>;

export type PhaseB1PhysiologyEnvelopePhaseWindowV1 = Readonly<{
  windowId: string;
  startPhaseSec: number;
  endPhaseSec: number;
}>;

export type PhaseB1PhysiologyEnvelopeFillingPhaseWindowsV1 = Readonly<{
  mitralEarly: PhaseB1PhysiologyEnvelopePhaseWindowV1;
  mitralAtrial: PhaseB1PhysiologyEnvelopePhaseWindowV1;
  pulmonaryVenousSystolic: PhaseB1PhysiologyEnvelopePhaseWindowV1;
  pulmonaryVenousDiastolic: PhaseB1PhysiologyEnvelopePhaseWindowV1;
  pulmonaryVenousAtrialReversal: PhaseB1PhysiologyEnvelopePhaseWindowV1;
}>;

export type PhaseB1PhysiologyEnvelopeNormalTargetMetricIdV1 =
  | "cycle.heartRateBpm"
  | "tbv.initialM3"
  | "tbv.maximumRelativeDrift"
  | "period.maximumNormalizedDistance"
  | "circulation.leftRightSignedOutputMismatchFraction"
  | `circulation.${"left" | "right"}.${
    | "volumeCardiacOutputLPerMin"
    | "forwardOutflowCardiacOutputLPerMin"
    | "signedOutflowCardiacOutputLPerMin"}`
  | `pressure.${BloodCompartmentId}.${"minimumPa" | "maximumPa" | "meanPa"}`
  | `volume.${PhaseB1PhysiologyEnvelopeChamberIdV1}.${
    | "minimumM3"
    | "maximumM3"
    | "strokeVolumeM3"
    | "ejectionFraction"}`
  | `flow.${FourChamberFlowId}.${
    | "peakForwardM3PerSec"
    | "peakReverseMagnitudeM3PerSec"
    | "signedVolumeM3"
    | "forwardVolumeM3"
    | "regurgitantVolumeM3"
    | "regurgitantToForwardRatio"}`
  | "filling.mitral.eToAPeakRatio"
  | "filling.mitral.eToAForwardVolumeRatio"
  | "filling.pulmonaryVenous.sToDPeakRatio"
  | "filling.pulmonaryVenous.sToDForwardVolumeRatio"
  | "filling.pulmonaryVenous.systolicForwardFraction"
  | "filling.pulmonaryVenous.atrialReversalToTotalForwardVolumeRatio"
  | "filling.pulmonaryVenous.atrialReversalPeakMagnitudeM3PerSec"
  | "filling.pulmonaryVenous.atrialReversalVolumeM3";

export type PhaseB1PhysiologyEnvelopeMetricUnitV1 =
  | "1"
  | "Pa"
  | "m3"
  | "m3/s"
  | "L/min"
  | "bpm";

export type PhaseB1PhysiologyEnvelopeNormalTargetV1 = Readonly<{
  gateId: string;
  metricId: PhaseB1PhysiologyEnvelopeNormalTargetMetricIdV1;
  unit: PhaseB1PhysiologyEnvelopeMetricUnitV1;
  lowerInclusive: number | null;
  upperInclusive: number | null;
  role: "hard" | "supportive";
  evidenceSourceId: string;
}>;

export type PhaseB1PhysiologyEnvelopeNormalTargetSetV1 = Readonly<{
  targetSetId: string;
  status: "prospective-targets-not-physiological-validation";
  targets: readonly PhaseB1PhysiologyEnvelopeNormalTargetV1[];
  scalarScoreOrRankingAllowed: false;
  atrialPvLoopMorphologyMaySelectOrGate: false;
}>;

export type PhaseB1PhysiologyEnvelopePressureSummaryV1 = Readonly<{
  minimumPa: number;
  maximumPa: number;
  timeWeightedMeanPa: number;
}>;

export type PhaseB1PhysiologyEnvelopeVolumeSummaryV1 = Readonly<{
  minimumM3: number;
  maximumM3: number;
  strokeVolumeM3: number;
  ejectionFractionFromExtrema: number;
}>;

export type PhaseB1PhysiologyEnvelopeFlowSummaryV1 = Readonly<{
  minimumSignedFlowM3PerSec: number;
  maximumSignedFlowM3PerSec: number;
  peakForwardM3PerSec: number;
  peakReverseMagnitudeM3PerSec: number;
  signedVolumeM3: number;
  forwardVolumeM3: number;
  regurgitantVolumeM3: number;
  signedDecompositionResidualM3: number;
  regurgitantToForwardRatio: number | null;
}>;

export type PhaseB1PhysiologyEnvelopeSideSummaryV1 = Readonly<{
  ventricle: "LV" | "RV";
  outflow: "Q_AoV" | "Q_PuV";
  volumeStrokeVolumeM3: number;
  volumeCardiacOutputLPerMin: number;
  forwardOutflowStrokeVolumeM3: number;
  forwardOutflowCardiacOutputLPerMin: number;
  signedOutflowStrokeVolumeM3: number;
  signedOutflowCardiacOutputLPerMin: number;
  forwardOutflowMinusVolumeStrokeVolumeM3: number;
}>;

export type PhaseB1PhysiologyEnvelopeTerminalCycleClosureV1 = Readonly<{
  status:
    | "complete-all-eight-compartments"
    | "partial-missing-endpoint-volume-compartments";
  integrationRule: "backward-euler-right-endpoint-rectangle";
  availableCompartmentIds: readonly BloodCompartmentId[];
  missingCompartmentIds: readonly BloodCompartmentId[];
  storageDeltaM3ByCompartment:
    Readonly<Partial<Record<BloodCompartmentId, number>>>;
  maximumAbsoluteStorageDeltaM3: number | null;
  incidenceIntegratedVolumeChangeM3ByCompartment:
    Readonly<Record<BloodCompartmentId, number>>;
  incidenceIntegralResidualM3ByCompartment:
    Readonly<Partial<Record<BloodCompartmentId, number>>>;
  maximumAbsoluteIncidenceIntegralResidualM3: number | null;
  summedStorageDeltaM3: number | null;
  summedIncidenceIntegratedVolumeChangeM3: number;
  summedIncidenceIntegralResidualM3: number | null;
}>;

export type PhaseB1PhysiologyEnvelopeWindowFlowDiagnosticV1 = Readonly<{
  window: PhaseB1PhysiologyEnvelopePhaseWindowV1;
  wrapsCycleBoundary: boolean;
  coveredDurationSec: number;
  positivePeakM3PerSec: number | null;
  positivePeakPhaseSec: number | null;
  reversePeakMagnitudeM3PerSec: number | null;
  reversePeakPhaseSec: number | null;
  signedVolumeM3: number;
  forwardVolumeM3: number;
  reverseVolumeM3: number;
}>;

export type PhaseB1PhysiologyEnvelopeNormalTargetGateResultV1 = Readonly<{
  gateId: string;
  metricId: PhaseB1PhysiologyEnvelopeNormalTargetMetricIdV1;
  role: "hard" | "supportive";
  unit: PhaseB1PhysiologyEnvelopeMetricUnitV1;
  observed: number | null;
  lowerInclusive: number | null;
  upperInclusive: number | null;
  evidenceSourceId: string;
  available: boolean;
  pass: boolean;
}>;

export type PhaseB1PhysiologyEnvelopeMetricsV1 = Readonly<{
  metricsId: typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_METRICS_V1_ID;
  cycle: Readonly<{
    startTimeSec: number;
    endTimeSec: number;
    durationSec: number;
    heartRateBpm: number;
    sampleCount: number;
    fullCycleCoveragePass: boolean;
    integrationSource: PhaseB1PhysiologyEnvelopeIntegrationSourceV1;
    committedLeftLimitIntegrationSource: boolean;
  }>;
  totalBloodVolume: Readonly<{
    status: "available" | "unavailable-missing-vascular-volumes";
    missingCompartmentIds: readonly BloodCompartmentId[];
    initialM3: number | null;
    finalM3: number | null;
    minimumM3: number | null;
    maximumM3: number | null;
    maximumRelativeDrift: number | null;
  }>;
  terminalCycleClosure: PhaseB1PhysiologyEnvelopeTerminalCycleClosureV1;
  pressureByCompartment: Readonly<Record<
    BloodCompartmentId,
    PhaseB1PhysiologyEnvelopePressureSummaryV1
  >>;
  volumeByChamber: Readonly<Record<
    PhaseB1PhysiologyEnvelopeChamberIdV1,
    PhaseB1PhysiologyEnvelopeVolumeSummaryV1
  >>;
  flowById: Readonly<Record<FourChamberFlowId, PhaseB1PhysiologyEnvelopeFlowSummaryV1>>;
  circulation: Readonly<{
    left: PhaseB1PhysiologyEnvelopeSideSummaryV1;
    right: PhaseB1PhysiologyEnvelopeSideSummaryV1;
    leftRightSignedOutputMismatchFraction: number | null;
  }>;
  filling: Readonly<{
    phaseWindows: PhaseB1PhysiologyEnvelopeFillingPhaseWindowsV1;
    mitral: Readonly<{
      early: PhaseB1PhysiologyEnvelopeWindowFlowDiagnosticV1;
      atrial: PhaseB1PhysiologyEnvelopeWindowFlowDiagnosticV1;
      eToAPeakRatio: number | null;
      eToAForwardVolumeRatio: number | null;
      resolved: boolean;
    }>;
    pulmonaryVenous: Readonly<{
      systolic: PhaseB1PhysiologyEnvelopeWindowFlowDiagnosticV1;
      diastolic: PhaseB1PhysiologyEnvelopeWindowFlowDiagnosticV1;
      atrialReversal: PhaseB1PhysiologyEnvelopeWindowFlowDiagnosticV1;
      sToDPeakRatio: number | null;
      sToDForwardVolumeRatio: number | null;
      systolicForwardFraction: number | null;
      atrialReversalToTotalForwardVolumeRatio: number | null;
      atrialReversalPeakMagnitudeM3PerSec: number | null;
      atrialReversalVolumeM3: number;
      resolved: boolean;
    }>;
  }>;
  periodicity: Readonly<{
    completeEndpointMetricSourceRequired: true;
    maximumNormalizedDistance: number | null;
    available: boolean;
  }>;
  normalTargetGate: Readonly<{
    targetSetId: string;
    targetResults: readonly PhaseB1PhysiologyEnvelopeNormalTargetGateResultV1[];
    requiredHardMetricIds:
      typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_REQUIRED_NORMAL_TARGET_METRICS_V1;
    missingRequiredHardMetricIds:
      readonly (typeof PHASE_B1_PHYSIOLOGY_ENVELOPE_REQUIRED_NORMAL_TARGET_METRICS_V1)[number][];
    requiredTargetCoveragePass: boolean;
    periodTargetPass: boolean;
    inputEligibilityPass: boolean;
    physiologyBandComparisonStatus:
      | "eligible-after-period-target-pass"
      | "provisional-period-target-not-passed"
      | "provisional-other-input-ineligible";
    physiologyBandComparisonsAreProvisional: boolean;
    everyHardTargetPass: boolean;
    everySupportiveTargetPass: boolean;
    pass: boolean;
    scalarScoreComputed: false;
    candidateRankingPerformed: false;
  }>;
  atrialPvLoopMorphology: Readonly<{
    status: "held-out-not-evaluated-by-operating-point-metrics";
    selectable: false;
    contributesToNormalTargetGate: false;
    contributesToScalarScore: false;
  }>;
  claimBoundary: Readonly<{
    oneCycleOperatingPointAndFillingDiagnosticsOnly: true;
    physiologicalValidationClaimed: false;
    atrialPvShapeFittingPerformed: false;
    atrialPvMorphologyCanSelectCandidate: false;
    stageOneHardCardiacOutputUsesSignedValveFlowIntegral: true;
    chamberVolumeAndEjectionFractionAreStageTwoSupportiveReadback: true;
    fixedFillingWindowReadbackIsSecondary: true;
    fixedFillingWindowClinicalDopplerMappingValidated: false;
    fixedFillingWindowReadbackContributesToGate: false;
  }>;
}>;

export type EvaluatePhaseB1PhysiologyEnvelopeMetricsInputV1 = Readonly<{
  cycleStartTimeSec: number;
  cycleLengthSec: number;
  samples: readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[];
  integrationSource: PhaseB1PhysiologyEnvelopeIntegrationSourceV1;
  phaseWindows: PhaseB1PhysiologyEnvelopeFillingPhaseWindowsV1;
  periodEndpointMaximumNormalizedDistance: number | null;
  normalTargets: PhaseB1PhysiologyEnvelopeNormalTargetSetV1;
}>;

export function evaluatePhaseB1PhysiologyEnvelopeMetricsV1(
  input: EvaluatePhaseB1PhysiologyEnvelopeMetricsInputV1,
): PhaseB1PhysiologyEnvelopeMetricsV1 {
  const cycleStartTimeSec = requireFinite(input.cycleStartTimeSec, "cycleStartTimeSec");
  const cycleLengthSec = requirePositiveFinite(input.cycleLengthSec, "cycleLengthSec");
  const cycleEndTimeSec = cycleStartTimeSec + cycleLengthSec;
  const samples = validateSamples(input.samples, cycleStartTimeSec, cycleLengthSec);
  const integrationSource = validateIntegrationSource(input.integrationSource);
  const phaseWindows = validatePhaseWindows(input.phaseWindows, cycleLengthSec);
  const periodDistance = input.periodEndpointMaximumNormalizedDistance === null
    ? null
    : requireNonNegativeFinite(
      input.periodEndpointMaximumNormalizedDistance,
      "periodEndpointMaximumNormalizedDistance",
    );
  const targets = validateTargetSet(input.normalTargets);
  const fullCycleCoveragePass = approximatelyEqual(
    samples[0]!.absoluteTimeSec,
    cycleStartTimeSec,
  ) && approximatelyEqual(
    samples[samples.length - 1]!.absoluteTimeSec,
    cycleEndTimeSec,
  );

  const pressureByCompartment = recordFromIds(
    BLOOD_COMPARTMENT_IDS,
    (compartmentId) => pressureSummary(
      samples,
      compartmentId,
      cycleLengthSec,
    ),
  );
  const volumeByChamber = recordFromIds(
    PHASE_B1_PHYSIOLOGY_ENVELOPE_CHAMBER_IDS_V1,
    (chamberId) => volumeSummary(samples, chamberId),
  );
  const flowById = recordFromIds(
    FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
    (flowId) => flowSummary(samples, flowId),
  );
  const totalBloodVolume = totalBloodVolumeSummary(samples);
  const terminalCycleClosure = terminalCycleClosureSummary(samples, flowById);
  const leftCirculation = sideSummary(
    "LV",
    "Q_AoV",
    volumeByChamber.LV,
    flowById.Q_AoV,
    cycleLengthSec,
  );
  const rightCirculation = sideSummary(
    "RV",
    "Q_PuV",
    volumeByChamber.RV,
    flowById.Q_PuV,
    cycleLengthSec,
  );
  const circulation = deepFreeze({
    left: leftCirculation,
    right: rightCirculation,
    leftRightSignedOutputMismatchFraction: symmetricRelativeMismatch(
      leftCirculation.signedOutflowStrokeVolumeM3,
      rightCirculation.signedOutflowStrokeVolumeM3,
    ),
  });
  const filling = fillingSummary(samples, phaseWindows, cycleLengthSec);
  const partial: Omit<PhaseB1PhysiologyEnvelopeMetricsV1,
    "metricsId" | "normalTargetGate" | "atrialPvLoopMorphology" | "claimBoundary"> =
    deepFreeze({
      cycle: {
        startTimeSec: cycleStartTimeSec,
        endTimeSec: cycleEndTimeSec,
        durationSec: cycleLengthSec,
        heartRateBpm: 60 / cycleLengthSec,
        sampleCount: samples.length,
        fullCycleCoveragePass,
        integrationSource,
        committedLeftLimitIntegrationSource:
          integrationSource === "committed-backward-euler-left-limit-evaluations",
      },
      totalBloodVolume,
      terminalCycleClosure,
      pressureByCompartment,
      volumeByChamber,
      flowById,
      circulation,
      filling,
      periodicity: {
        completeEndpointMetricSourceRequired: true,
        maximumNormalizedDistance: periodDistance,
        available: periodDistance !== null,
      },
    });
  const targetResults = deepFreeze(targets.targets.map((target) =>
    evaluateTarget(target, partial)));
  const hardTargetIds = new Set(targets.targets
    .filter((target) => target.role === "hard")
    .map((target) => target.metricId));
  const missingRequiredHardMetricIds = deepFreeze(
    PHASE_B1_PHYSIOLOGY_ENVELOPE_REQUIRED_NORMAL_TARGET_METRICS_V1.filter(
      (metricId) => !hardTargetIds.has(metricId),
    ),
  );
  const requiredTargetCoveragePass = missingRequiredHardMetricIds.length === 0;
  const everyHardTargetPass = targetResults
    .filter((target) => target.role === "hard")
    .every((target) => target.pass);
  const everySupportiveTargetPass = targetResults
    .filter((target) => target.role === "supportive")
    .every((target) => target.pass);
  const periodTargetPass = targetResults.some((target) =>
    target.role === "hard"
    && target.metricId === "period.maximumNormalizedDistance"
    && target.pass);
  const inputEligibilityPass = fullCycleCoveragePass
    && integrationSource === "committed-backward-euler-left-limit-evaluations"
    && totalBloodVolume.status === "available"
    && totalBloodVolume.maximumRelativeDrift !== null
    && periodTargetPass;
  const physiologyBandComparisonStatus = inputEligibilityPass
    ? "eligible-after-period-target-pass" as const
    : periodTargetPass
      ? "provisional-other-input-ineligible" as const
      : "provisional-period-target-not-passed" as const;
  const normalTargetGate = deepFreeze({
    targetSetId: targets.targetSetId,
    targetResults,
    requiredHardMetricIds:
      PHASE_B1_PHYSIOLOGY_ENVELOPE_REQUIRED_NORMAL_TARGET_METRICS_V1,
    missingRequiredHardMetricIds,
    requiredTargetCoveragePass,
    periodTargetPass,
    inputEligibilityPass,
    physiologyBandComparisonStatus,
    physiologyBandComparisonsAreProvisional: !inputEligibilityPass,
    everyHardTargetPass,
    everySupportiveTargetPass,
    pass: inputEligibilityPass && requiredTargetCoveragePass && everyHardTargetPass,
    scalarScoreComputed: false as const,
    candidateRankingPerformed: false as const,
  });

  return deepFreeze({
    metricsId: PHASE_B1_PHYSIOLOGY_ENVELOPE_METRICS_V1_ID,
    ...partial,
    normalTargetGate,
    atrialPvLoopMorphology: {
      status: "held-out-not-evaluated-by-operating-point-metrics" as const,
      selectable: false as const,
      contributesToNormalTargetGate: false as const,
      contributesToScalarScore: false as const,
    },
    claimBoundary: {
      oneCycleOperatingPointAndFillingDiagnosticsOnly: true as const,
      physiologicalValidationClaimed: false as const,
      atrialPvShapeFittingPerformed: false as const,
      atrialPvMorphologyCanSelectCandidate: false as const,
      stageOneHardCardiacOutputUsesSignedValveFlowIntegral: true as const,
      chamberVolumeAndEjectionFractionAreStageTwoSupportiveReadback: true as const,
      fixedFillingWindowReadbackIsSecondary: true as const,
      fixedFillingWindowClinicalDopplerMappingValidated: false as const,
      fixedFillingWindowReadbackContributesToGate: false as const,
    },
  });
}

export function phaseB1PhysiologyEnvelopeMetricSamplesFromTerminalWaveformV1(
  waveform: PhaseB1TerminalWaveformSeriesV1,
  cycleStartTimeSec: number,
): readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[] {
  const start = requireFinite(cycleStartTimeSec, "cycleStartTimeSec");
  const sampleCount = waveform.phaseSec.length;
  if (sampleCount < 2) {
    throw new Error("terminal waveform must contain at least two samples");
  }
  const columnLengths: number[] = [
    waveform.sampleIndex.length,
    waveform.nominalGridIndex.length,
    waveform.sourceKind.length,
    waveform.eventKeysAtEnd.length,
    ...PHASE_B1_PHYSIOLOGY_ENVELOPE_CHAMBER_IDS_V1.map((id) =>
      waveform.chamberBloodVolumeM3[id].length),
    ...BLOOD_COMPARTMENT_IDS.map((id) =>
      waveform.compartmentAbsolutePressurePa[id].length),
    ...FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((id) =>
      waveform.allClosedLoopFlowM3PerSec[id].length),
  ];
  if (columnLengths.some((length) => length !== sampleCount)) {
    throw new Error("terminal waveform columns must have one common sample count");
  }
  return deepFreeze(waveform.phaseSec.map((phaseSec, index) => ({
    absoluteTimeSec: start + requireNonNegativeFinite(
      phaseSec,
      `waveform.phaseSec[${index}]`,
    ),
    phaseSec,
    bloodVolumesM3: recordFromIds(
      PHASE_B1_PHYSIOLOGY_ENVELOPE_CHAMBER_IDS_V1,
      (chamberId) => requireNonNegativeFinite(
        waveform.chamberBloodVolumeM3[chamberId][index],
        `waveform.chamberBloodVolumeM3.${chamberId}[${index}]`,
      ),
    ),
    compartmentAbsolutePressurePa: recordFromIds(
      BLOOD_COMPARTMENT_IDS,
      (compartmentId) => requireFinite(
        waveform.compartmentAbsolutePressurePa[compartmentId][index],
        `waveform.compartmentAbsolutePressurePa.${compartmentId}[${index}]`,
      ),
    ),
    allFlowsM3PerSec: recordFromIds(
      FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
      (flowId) => requireFinite(
        waveform.allClosedLoopFlowM3PerSec[flowId][index],
        `waveform.allClosedLoopFlowM3PerSec.${flowId}[${index}]`,
      ),
    ),
  })));
}

export function phaseB1PhysiologyEnvelopeMetricSamplesFromCommittedEvaluationsV1(
  input: Readonly<{
    cycleStartTimeSec: number;
    cycleLengthSec: number;
    initialEvaluation: PhaseB1EventFreeEndpointEvaluationV1;
    acceptedEndLeftLimitEvaluations:
      readonly PhaseB1EventFreeEndpointEvaluationV1[];
  }>,
): readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[] {
  const cycleStartTimeSec = requireFinite(
    input.cycleStartTimeSec,
    "cycleStartTimeSec",
  );
  const cycleLengthSec = requirePositiveFinite(
    input.cycleLengthSec,
    "cycleLengthSec",
  );
  if (
    !Array.isArray(input.acceptedEndLeftLimitEvaluations)
    || input.acceptedEndLeftLimitEvaluations.length === 0
  ) throw new Error("committed evaluation adapter requires accepted end evaluations");
  const evaluations = [
    input.initialEvaluation,
    ...input.acceptedEndLeftLimitEvaluations,
  ];
  const projected = evaluations.map((evaluation, index) => {
    const absoluteTimeSec = requireFinite(
      evaluation.endpoint.timeSec,
      `evaluations[${index}].endpoint.timeSec`,
    );
    return deepFreeze({
      absoluteTimeSec,
      phaseSec: absoluteTimeSec - cycleStartTimeSec,
      bloodVolumesM3: recordFromIds(BLOOD_COMPARTMENT_IDS, (compartmentId) =>
        evaluation.endpoint.differentialState.bloodVolumesM3[compartmentId]),
      compartmentAbsolutePressurePa: recordFromIds(
        BLOOD_COMPARTMENT_IDS,
        (compartmentId) =>
          evaluation.closedLoop.compartmentAbsolutePressurePa[compartmentId],
      ),
      allFlowsM3PerSec: recordFromIds(
        FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
        (flowId) => evaluation.closedLoop.allFlowsM3PerSec[flowId],
      ),
    });
  });
  return validateSamples(projected, cycleStartTimeSec, cycleLengthSec);
}

export function evaluatePhaseB1PhysiologyEnvelopeMetricsFromCommittedEvaluationsV1(
  input: Readonly<{
    cycleStartTimeSec: number;
    cycleLengthSec: number;
    initialEvaluation: PhaseB1EventFreeEndpointEvaluationV1;
    acceptedEndLeftLimitEvaluations:
      readonly PhaseB1EventFreeEndpointEvaluationV1[];
    phaseWindows: PhaseB1PhysiologyEnvelopeFillingPhaseWindowsV1;
    periodEndpointMaximumNormalizedDistance: number | null;
    normalTargets: PhaseB1PhysiologyEnvelopeNormalTargetSetV1;
  }>,
): PhaseB1PhysiologyEnvelopeMetricsV1 {
  return evaluatePhaseB1PhysiologyEnvelopeMetricsV1({
    cycleStartTimeSec: input.cycleStartTimeSec,
    cycleLengthSec: input.cycleLengthSec,
    samples: phaseB1PhysiologyEnvelopeMetricSamplesFromCommittedEvaluationsV1({
      cycleStartTimeSec: input.cycleStartTimeSec,
      cycleLengthSec: input.cycleLengthSec,
      initialEvaluation: input.initialEvaluation,
      acceptedEndLeftLimitEvaluations: input.acceptedEndLeftLimitEvaluations,
    }),
    integrationSource: "committed-backward-euler-left-limit-evaluations",
    phaseWindows: input.phaseWindows,
    periodEndpointMaximumNormalizedDistance:
      input.periodEndpointMaximumNormalizedDistance,
    normalTargets: input.normalTargets,
  });
}

export function evaluatePhaseB1PhysiologyEnvelopeMetricsFromTerminalWaveformV1(
  input: Readonly<{
    waveform: PhaseB1TerminalWaveformSeriesV1;
    cycleStartTimeSec: number;
    cycleLengthSec: number;
    phaseWindows: PhaseB1PhysiologyEnvelopeFillingPhaseWindowsV1;
    normalTargets: PhaseB1PhysiologyEnvelopeNormalTargetSetV1;
  }>,
): PhaseB1PhysiologyEnvelopeMetricsV1 {
  return evaluatePhaseB1PhysiologyEnvelopeMetricsV1({
    cycleStartTimeSec: input.cycleStartTimeSec,
    cycleLengthSec: input.cycleLengthSec,
    samples: phaseB1PhysiologyEnvelopeMetricSamplesFromTerminalWaveformV1(
      input.waveform,
      input.cycleStartTimeSec,
    ),
    integrationSource: "terminal-waveform-right-continuous-projection",
    phaseWindows: input.phaseWindows,
    periodEndpointMaximumNormalizedDistance: null,
    normalTargets: input.normalTargets,
  });
}

export type BuildPhaseB1PhysiologyEnvelopeNormalTargetSetInputV1 = Readonly<{
  pack: NormalAdultTargetPackV1;
  numericalPolicy: Readonly<{
    maximumRelativeTotalBloodVolumeDrift: number;
    maximumPeriodEndpointNormalizedDistance: number;
  }>;
}>;

/**
 * Projects only observables that this one-cycle metric module actually owns.
 * Event-local LVEDP, flow-conditioned valve gradients, and atrial PV-loop
 * morphology remain in the source pack but are deliberately not fabricated
 * from pressure extrema or waveform shape.
 */
export function buildPhaseB1PhysiologyEnvelopeNormalTargetSetV1(
  input: BuildPhaseB1PhysiologyEnvelopeNormalTargetSetInputV1,
): PhaseB1PhysiologyEnvelopeNormalTargetSetV1 {
  const pack = validateNormalAdultTargetPackV1(input.pack);
  const maximumRelativeTotalBloodVolumeDrift = requireNonNegativeFinite(
    input.numericalPolicy.maximumRelativeTotalBloodVolumeDrift,
    "numericalPolicy.maximumRelativeTotalBloodVolumeDrift",
  );
  const maximumPeriodEndpointNormalizedDistance = requireNonNegativeFinite(
    input.numericalPolicy.maximumPeriodEndpointNormalizedDistance,
    "numericalPolicy.maximumPeriodEndpointNormalizedDistance",
  );
  const numericalSourceId = "project";
  const global = pack.targets.globalHemodynamics;
  const chambers = pack.targets.chamberVolumes;
  const flow = pack.targets.valveAndVenousFlow;
  const targets: PhaseB1PhysiologyEnvelopeNormalTargetV1[] = [
    targetFromBounds(
      "numerical-tbv-drift",
      "tbv.maximumRelativeDrift",
      "1",
      0,
      maximumRelativeTotalBloodVolumeDrift,
      "hard",
      numericalSourceId,
    ),
    targetFromBounds(
      "numerical-period-endpoint-distance",
      "period.maximumNormalizedDistance",
      "1",
      0,
      maximumPeriodEndpointNormalizedDistance,
      "hard",
      numericalSourceId,
    ),
    targetFromBand("heart-rate", "cycle.heartRateBpm", "bpm", global.heartRateBpm),
    targetFromBand(
      "left-cardiac-output",
      "circulation.left.signedOutflowCardiacOutputLPerMin",
      "L/min",
      global.cardiacOutputLPerMin,
    ),
    targetFromBand(
      "right-cardiac-output",
      "circulation.right.signedOutflowCardiacOutputLPerMin",
      "L/min",
      global.cardiacOutputLPerMin,
    ),
    targetFromBounds(
      "left-right-net-output-mismatch",
      "circulation.leftRightSignedOutputMismatchFraction",
      "1",
      0,
      global.leftRightNetOutputMismatchFraction.maximum,
      "hard",
      pack.packId,
    ),
    targetFromBand(
      "systemic-systolic-pressure",
      "pressure.SA.maximumPa",
      "Pa",
      global.systemicArterialPressureMmHg.systolic,
      MMHG_TO_PA,
    ),
    targetFromBand(
      "systemic-diastolic-pressure",
      "pressure.SA.minimumPa",
      "Pa",
      global.systemicArterialPressureMmHg.diastolic,
      MMHG_TO_PA,
    ),
    targetFromBand(
      "systemic-mean-pressure",
      "pressure.SA.meanPa",
      "Pa",
      global.systemicArterialPressureMmHg.mean,
      MMHG_TO_PA,
    ),
    targetFromBand(
      "pulmonary-systolic-pressure",
      "pressure.PA.maximumPa",
      "Pa",
      global.pulmonaryArterialPressureMmHg.systolic,
      MMHG_TO_PA,
      "supportive",
    ),
    targetFromBand(
      "pulmonary-diastolic-pressure",
      "pressure.PA.minimumPa",
      "Pa",
      global.pulmonaryArterialPressureMmHg.diastolic,
      MMHG_TO_PA,
      "supportive",
    ),
    targetFromBand(
      "pulmonary-mean-pressure",
      "pressure.PA.meanPa",
      "Pa",
      global.pulmonaryArterialPressureMmHg.mean,
      MMHG_TO_PA,
    ),
    targetFromBand(
      "right-atrial-mean-pressure",
      "pressure.RA.meanPa",
      "Pa",
      global.rightAtrialMeanPressureMmHg,
      MMHG_TO_PA,
    ),
    targetFromBand(
      "left-atrial-mean-pressure",
      "pressure.LA.meanPa",
      "Pa",
      global.leftAtrialMeanPressureMmHg,
      MMHG_TO_PA,
    ),
    targetFromBand(
      "right-ventricular-peak-pressure",
      "pressure.RV.maximumPa",
      "Pa",
      global.rightVentricularPeakPressureMmHg,
      MMHG_TO_PA,
    ),
    targetFromBand(
      "total-blood-volume-construction-context",
      "tbv.initialM3",
      "m3",
      global.totalBloodVolumeMl,
      1e-6,
    ),
    ...ventricularVolumeTargets("LV", chambers.leftVentricle),
    ...ventricularVolumeTargets("RV", chambers.rightVentricle),
    ...atrialVolumeTargets("LA", chambers.leftAtrium),
    ...atrialVolumeTargets("RA", chambers.rightAtrium),
  ];
  const netValveVolume = flow.valveCycleRequirement.netForwardVolumePerBeatMl;
  for (const [label, flowId] of [
    ["mitral", "Q_MV"],
    ["aortic", "Q_AoV"],
    ["tricuspid", "Q_TV"],
    ["pulmonary", "Q_PuV"],
  ] as const) {
    targets.push(targetFromBand(
      `${label}-net-forward-volume`,
      `flow.${flowId}.signedVolumeM3`,
      "m3",
      netValveVolume,
      1e-6,
      "supportive",
    ));
    targets.push(targetFromBounds(
      `${label}-reverse-fraction`,
      `flow.${flowId}.regurgitantToForwardRatio`,
      "1",
      0,
      flow.valveCycleRequirement.maximumReverseFraction,
      "supportive",
      sourceIdForBand(netValveVolume),
    ));
  }
  targets.push(targetFromBand(
    "mitral-e-to-a",
    "filling.mitral.eToAPeakRatio",
    "1",
    flow.atrioventricularInflow.mitralEToARatio,
    1,
    "supportive",
  ));
  targets.push(targetFromBand(
    "pulmonary-venous-systolic-forward-fraction",
    "filling.pulmonaryVenous.systolicForwardFraction",
    "1",
    flow.pulmonaryVenousFlow.systolicForwardFraction,
    1,
    "supportive",
  ));
  targets.push(targetFromBand(
    "pulmonary-venous-atrial-reversal-fraction",
    "filling.pulmonaryVenous.atrialReversalToTotalForwardVolumeRatio",
    "1",
    flow.pulmonaryVenousFlow.reverseToForwardVolumeFraction,
    1,
    "supportive",
  ));
  return validateTargetSet(deepFreeze({
    targetSetId: `${pack.packId}:phase-b1-one-cycle-projection-v1`,
    status: "prospective-targets-not-physiological-validation" as const,
    targets,
    scalarScoreOrRankingAllowed: false as const,
    atrialPvLoopMorphologyMaySelectOrGate: false as const,
  }));
}

function pressureSummary(
  samples: readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[],
  compartmentId: BloodCompartmentId,
  cycleLengthSec: number,
): PhaseB1PhysiologyEnvelopePressureSummaryV1 {
  const values = samples.map((sample) =>
    sample.compartmentAbsolutePressurePa[compartmentId]);
  let integralPaSec = 0;
  for (let index = 1; index < samples.length; index += 1) {
    integralPaSec += values[index]! * intervalDuration(samples, index);
  }
  return deepFreeze({
    minimumPa: Math.min(...values),
    maximumPa: Math.max(...values),
    timeWeightedMeanPa: integralPaSec / cycleLengthSec,
  });
}

function volumeSummary(
  samples: readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[],
  chamberId: PhaseB1PhysiologyEnvelopeChamberIdV1,
): PhaseB1PhysiologyEnvelopeVolumeSummaryV1 {
  const values = samples.map((sample) => sample.bloodVolumesM3[chamberId]!);
  const minimumM3 = Math.min(...values);
  const maximumM3 = Math.max(...values);
  const strokeVolumeM3 = maximumM3 - minimumM3;
  return deepFreeze({
    minimumM3,
    maximumM3,
    strokeVolumeM3,
    ejectionFractionFromExtrema: maximumM3 > 0
      ? strokeVolumeM3 / maximumM3
      : Number.NaN,
  });
}

function flowSummary(
  samples: readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[],
  flowId: FourChamberFlowId,
): PhaseB1PhysiologyEnvelopeFlowSummaryV1 {
  const values = samples.map((sample) => sample.allFlowsM3PerSec[flowId]);
  let signedVolumeM3 = 0;
  let forwardVolumeM3 = 0;
  let regurgitantVolumeM3 = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const dtSec = intervalDuration(samples, index);
    const flow = values[index]!;
    signedVolumeM3 += flow * dtSec;
    forwardVolumeM3 += Math.max(flow, 0) * dtSec;
    regurgitantVolumeM3 += Math.max(-flow, 0) * dtSec;
  }
  return deepFreeze({
    minimumSignedFlowM3PerSec: Math.min(...values),
    maximumSignedFlowM3PerSec: Math.max(...values),
    peakForwardM3PerSec: Math.max(0, ...values),
    peakReverseMagnitudeM3PerSec: Math.max(0, ...values.map((value) => -value)),
    signedVolumeM3,
    forwardVolumeM3,
    regurgitantVolumeM3,
    signedDecompositionResidualM3:
      signedVolumeM3 - (forwardVolumeM3 - regurgitantVolumeM3),
    regurgitantToForwardRatio: forwardVolumeM3 > 0
      ? regurgitantVolumeM3 / forwardVolumeM3
      : null,
  });
}

function totalBloodVolumeSummary(
  samples: readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[],
): PhaseB1PhysiologyEnvelopeMetricsV1["totalBloodVolume"] {
  const missing = BLOOD_COMPARTMENT_IDS.filter((compartmentId) =>
    samples.some((sample) => sample.bloodVolumesM3[compartmentId] === undefined));
  if (missing.length > 0) {
    return deepFreeze({
      status: "unavailable-missing-vascular-volumes" as const,
      missingCompartmentIds: missing,
      initialM3: null,
      finalM3: null,
      minimumM3: null,
      maximumM3: null,
      maximumRelativeDrift: null,
    });
  }
  const totals = samples.map((sample) => BLOOD_COMPARTMENT_IDS.reduce(
    (sum, compartmentId) => sum + sample.bloodVolumesM3[compartmentId]!,
    0,
  ));
  const initialM3 = totals[0]!;
  const maximumRelativeDrift = initialM3 > 0
    ? Math.max(...totals.map((total) => Math.abs(total - initialM3) / initialM3))
    : Number.POSITIVE_INFINITY;
  return deepFreeze({
    status: "available" as const,
    missingCompartmentIds: [],
    initialM3,
    finalM3: totals[totals.length - 1]!,
    minimumM3: Math.min(...totals),
    maximumM3: Math.max(...totals),
    maximumRelativeDrift,
  });
}

function terminalCycleClosureSummary(
  samples: readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[],
  flowById: Readonly<Record<FourChamberFlowId, PhaseB1PhysiologyEnvelopeFlowSummaryV1>>,
): PhaseB1PhysiologyEnvelopeTerminalCycleClosureV1 {
  const initial = samples[0]!.bloodVolumesM3;
  const final = samples[samples.length - 1]!.bloodVolumesM3;
  const availableCompartmentIds = BLOOD_COMPARTMENT_IDS.filter(
    (compartmentId) => initial[compartmentId] !== undefined
      && final[compartmentId] !== undefined,
  );
  const missingCompartmentIds = BLOOD_COMPARTMENT_IDS.filter(
    (compartmentId) => !availableCompartmentIds.includes(compartmentId),
  );
  const storageDeltaM3ByCompartment = deepFreeze(Object.fromEntries(
    availableCompartmentIds.map((compartmentId) => [
      compartmentId,
      requireFinite(
        final[compartmentId]! - initial[compartmentId]!,
        `terminalCycleClosure.storageDeltaM3ByCompartment.${compartmentId}`,
      ),
    ]),
  ) as Partial<Record<BloodCompartmentId, number>>);
  const incidenceIntegratedVolumeChangeM3ByCompartment = recordFromIds(
    BLOOD_COMPARTMENT_IDS,
    (compartmentId) => {
      const rowIndex = BLOOD_COMPARTMENT_IDS.indexOf(compartmentId);
      return requireFinite(
        FOUR_CHAMBER_INCIDENCE_MATRIX_V1[rowIndex]!.reduce(
          (sum, coefficient, columnIndex) => sum + coefficient
            * flowById[FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1[columnIndex]!]
              .signedVolumeM3,
          0,
        ),
        `terminalCycleClosure.incidenceIntegratedVolumeChangeM3ByCompartment.${compartmentId}`,
      );
    },
  );
  const incidenceIntegralResidualM3ByCompartment = deepFreeze(Object.fromEntries(
    availableCompartmentIds.map((compartmentId) => [
      compartmentId,
      requireFinite(
        storageDeltaM3ByCompartment[compartmentId]!
          - incidenceIntegratedVolumeChangeM3ByCompartment[compartmentId],
        `terminalCycleClosure.incidenceIntegralResidualM3ByCompartment.${compartmentId}`,
      ),
    ]),
  ) as Partial<Record<BloodCompartmentId, number>>);
  const storageDeltas = availableCompartmentIds.map((compartmentId) =>
    storageDeltaM3ByCompartment[compartmentId]!);
  const incidenceResiduals = availableCompartmentIds.map((compartmentId) =>
    incidenceIntegralResidualM3ByCompartment[compartmentId]!);
  const complete = missingCompartmentIds.length === 0;

  return deepFreeze({
    status: complete
      ? "complete-all-eight-compartments" as const
      : "partial-missing-endpoint-volume-compartments" as const,
    integrationRule: "backward-euler-right-endpoint-rectangle" as const,
    availableCompartmentIds,
    missingCompartmentIds,
    storageDeltaM3ByCompartment,
    maximumAbsoluteStorageDeltaM3: storageDeltas.length > 0
      ? Math.max(...storageDeltas.map(Math.abs))
      : null,
    incidenceIntegratedVolumeChangeM3ByCompartment,
    incidenceIntegralResidualM3ByCompartment,
    maximumAbsoluteIncidenceIntegralResidualM3: incidenceResiduals.length > 0
      ? Math.max(...incidenceResiduals.map(Math.abs))
      : null,
    summedStorageDeltaM3: complete
      ? storageDeltas.reduce((sum, delta) => sum + delta, 0)
      : null,
    summedIncidenceIntegratedVolumeChangeM3:
      BLOOD_COMPARTMENT_IDS.reduce((sum, compartmentId) =>
        sum + incidenceIntegratedVolumeChangeM3ByCompartment[compartmentId], 0),
    summedIncidenceIntegralResidualM3: complete
      ? incidenceResiduals.reduce((sum, residual) => sum + residual, 0)
      : null,
  });
}

function sideSummary(
  ventricle: "LV" | "RV",
  outflow: "Q_AoV" | "Q_PuV",
  volume: PhaseB1PhysiologyEnvelopeVolumeSummaryV1,
  flow: PhaseB1PhysiologyEnvelopeFlowSummaryV1,
  cycleLengthSec: number,
): PhaseB1PhysiologyEnvelopeSideSummaryV1 {
  return deepFreeze({
    ventricle,
    outflow,
    volumeStrokeVolumeM3: volume.strokeVolumeM3,
    volumeCardiacOutputLPerMin: cardiacOutputLPerMin(
      volume.strokeVolumeM3,
      cycleLengthSec,
    ),
    forwardOutflowStrokeVolumeM3: flow.forwardVolumeM3,
    forwardOutflowCardiacOutputLPerMin: cardiacOutputLPerMin(
      flow.forwardVolumeM3,
      cycleLengthSec,
    ),
    signedOutflowStrokeVolumeM3: flow.signedVolumeM3,
    signedOutflowCardiacOutputLPerMin: cardiacOutputLPerMin(
      flow.signedVolumeM3,
      cycleLengthSec,
    ),
    forwardOutflowMinusVolumeStrokeVolumeM3:
      flow.forwardVolumeM3 - volume.strokeVolumeM3,
  });
}

function fillingSummary(
  samples: readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[],
  windows: PhaseB1PhysiologyEnvelopeFillingPhaseWindowsV1,
  cycleLengthSec: number,
): PhaseB1PhysiologyEnvelopeMetricsV1["filling"] {
  const early = windowFlowDiagnostic(
    samples,
    "Q_MV",
    windows.mitralEarly,
    cycleLengthSec,
  );
  const atrial = windowFlowDiagnostic(
    samples,
    "Q_MV",
    windows.mitralAtrial,
    cycleLengthSec,
  );
  const systolic = windowFlowDiagnostic(
    samples,
    "Q_PV",
    windows.pulmonaryVenousSystolic,
    cycleLengthSec,
  );
  const diastolic = windowFlowDiagnostic(
    samples,
    "Q_PV",
    windows.pulmonaryVenousDiastolic,
    cycleLengthSec,
  );
  const atrialReversal = windowFlowDiagnostic(
    samples,
    "Q_PV",
    windows.pulmonaryVenousAtrialReversal,
    cycleLengthSec,
  );
  const eToAPeakRatio = positiveRatio(
    early.positivePeakM3PerSec,
    atrial.positivePeakM3PerSec,
  );
  const eToAForwardVolumeRatio = positiveRatio(
    early.forwardVolumeM3,
    atrial.forwardVolumeM3,
  );
  const sToDPeakRatio = positiveRatio(
    systolic.positivePeakM3PerSec,
    diastolic.positivePeakM3PerSec,
  );
  const sToDForwardVolumeRatio = positiveRatio(
    systolic.forwardVolumeM3,
    diastolic.forwardVolumeM3,
  );
  const pulmonaryVenousForwardVolumeM3 = samples.slice(1).reduce(
    (sum, sample, index) => sum + Math.max(
      sample.allFlowsM3PerSec.Q_PV,
      0,
    ) * intervalDuration(samples, index + 1),
    0,
  );
  const systolicPlusDiastolicForwardVolumeM3 =
    systolic.forwardVolumeM3 + diastolic.forwardVolumeM3;
  const systolicForwardFraction = systolicPlusDiastolicForwardVolumeM3 > 0
    ? systolic.forwardVolumeM3 / systolicPlusDiastolicForwardVolumeM3
    : null;
  const atrialReversalToTotalForwardVolumeRatio = pulmonaryVenousForwardVolumeM3 > 0
    ? atrialReversal.reverseVolumeM3 / pulmonaryVenousForwardVolumeM3
    : null;
  return deepFreeze({
    phaseWindows: windows,
    mitral: {
      early,
      atrial,
      eToAPeakRatio,
      eToAForwardVolumeRatio,
      resolved: eToAPeakRatio !== null && eToAForwardVolumeRatio !== null,
    },
    pulmonaryVenous: {
      systolic,
      diastolic,
      atrialReversal,
      sToDPeakRatio,
      sToDForwardVolumeRatio,
      systolicForwardFraction,
      atrialReversalToTotalForwardVolumeRatio,
      atrialReversalPeakMagnitudeM3PerSec:
        atrialReversal.reversePeakMagnitudeM3PerSec,
      atrialReversalVolumeM3: atrialReversal.reverseVolumeM3,
      resolved: sToDPeakRatio !== null
        && sToDForwardVolumeRatio !== null
        && atrialReversal.reversePeakMagnitudeM3PerSec !== null
        && atrialReversal.reverseVolumeM3 > 0,
    },
  });
}

function windowFlowDiagnostic(
  samples: readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[],
  flowId: FourChamberFlowId,
  window: PhaseB1PhysiologyEnvelopePhaseWindowV1,
  cycleLengthSec: number,
): PhaseB1PhysiologyEnvelopeWindowFlowDiagnosticV1 {
  let coveredDurationSec = 0;
  let signedVolumeM3 = 0;
  let forwardVolumeM3 = 0;
  let reverseVolumeM3 = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const overlapSec = phaseWindowOverlapSec(
      samples[index - 1]!.phaseSec,
      samples[index]!.phaseSec,
      window,
      cycleLengthSec,
    );
    const flow = samples[index]!.allFlowsM3PerSec[flowId];
    coveredDurationSec += overlapSec;
    signedVolumeM3 += flow * overlapSec;
    forwardVolumeM3 += Math.max(flow, 0) * overlapSec;
    reverseVolumeM3 += Math.max(-flow, 0) * overlapSec;
  }
  const pointSamples = samples.filter((sample) =>
    phaseInsideWindow(sample.phaseSec, window, cycleLengthSec));
  const positive = pointSamples
    .map((sample) => ({
      phaseSec: sample.phaseSec,
      value: sample.allFlowsM3PerSec[flowId],
    }))
    .filter((entry) => entry.value > 0)
    .sort((left, right) => right.value - left.value)[0] ?? null;
  const reverse = pointSamples
    .map((sample) => ({
      phaseSec: sample.phaseSec,
      value: -sample.allFlowsM3PerSec[flowId],
    }))
    .filter((entry) => entry.value > 0)
    .sort((left, right) => right.value - left.value)[0] ?? null;
  return deepFreeze({
    window,
    wrapsCycleBoundary: window.startPhaseSec > window.endPhaseSec,
    coveredDurationSec,
    positivePeakM3PerSec: positive?.value ?? null,
    positivePeakPhaseSec: positive?.phaseSec ?? null,
    reversePeakMagnitudeM3PerSec: reverse?.value ?? null,
    reversePeakPhaseSec: reverse?.phaseSec ?? null,
    signedVolumeM3,
    forwardVolumeM3,
    reverseVolumeM3,
  });
}

function phaseWindowOverlapSec(
  intervalStartPhaseSec: number,
  intervalEndPhaseSec: number,
  window: PhaseB1PhysiologyEnvelopePhaseWindowV1,
  cycleLengthSec: number,
): number {
  const ranges = window.startPhaseSec < window.endPhaseSec
    ? [[window.startPhaseSec, window.endPhaseSec] as const]
    : [
      [window.startPhaseSec, cycleLengthSec] as const,
      [0, window.endPhaseSec] as const,
    ];
  return ranges.reduce((sum, [start, end]) =>
    sum + Math.max(0, Math.min(intervalEndPhaseSec, end)
      - Math.max(intervalStartPhaseSec, start)), 0);
}

function phaseInsideWindow(
  phaseSec: number,
  window: PhaseB1PhysiologyEnvelopePhaseWindowV1,
  cycleLengthSec: number,
): boolean {
  if (window.startPhaseSec < window.endPhaseSec) {
    return phaseSec >= window.startPhaseSec && phaseSec <= window.endPhaseSec;
  }
  return (phaseSec >= window.startPhaseSec && phaseSec <= cycleLengthSec)
    || (phaseSec >= 0 && phaseSec <= window.endPhaseSec);
}

function evaluateTarget(
  target: PhaseB1PhysiologyEnvelopeNormalTargetV1,
  metrics: Omit<PhaseB1PhysiologyEnvelopeMetricsV1,
    "metricsId" | "normalTargetGate" | "atrialPvLoopMorphology" | "claimBoundary">,
): PhaseB1PhysiologyEnvelopeNormalTargetGateResultV1 {
  const resolved = resolveMetric(target.metricId, metrics);
  if (resolved.unit !== target.unit) {
    throw new Error(
      `normal target ${target.gateId} unit ${target.unit} does not match ${resolved.unit}`,
    );
  }
  const observed = resolved.value;
  const available = observed !== null && Number.isFinite(observed);
  const pass = available
    && (target.lowerInclusive === null || observed >= target.lowerInclusive)
    && (target.upperInclusive === null || observed <= target.upperInclusive);
  return deepFreeze({
    gateId: target.gateId,
    metricId: target.metricId,
    role: target.role,
    unit: target.unit,
    observed,
    lowerInclusive: target.lowerInclusive,
    upperInclusive: target.upperInclusive,
    evidenceSourceId: target.evidenceSourceId,
    available,
    pass,
  });
}

function resolveMetric(
  metricId: PhaseB1PhysiologyEnvelopeNormalTargetMetricIdV1,
  metrics: Omit<PhaseB1PhysiologyEnvelopeMetricsV1,
    "metricsId" | "normalTargetGate" | "atrialPvLoopMorphology" | "claimBoundary">,
): Readonly<{ value: number | null; unit: PhaseB1PhysiologyEnvelopeMetricUnitV1 }> {
  if (metricId === "cycle.heartRateBpm") {
    return { value: metrics.cycle.heartRateBpm, unit: "bpm" };
  }
  if (metricId === "tbv.initialM3") {
    return { value: metrics.totalBloodVolume.initialM3, unit: "m3" };
  }
  if (metricId === "tbv.maximumRelativeDrift") {
    return { value: metrics.totalBloodVolume.maximumRelativeDrift, unit: "1" };
  }
  if (metricId === "period.maximumNormalizedDistance") {
    return { value: metrics.periodicity.maximumNormalizedDistance, unit: "1" };
  }
  if (metricId === "circulation.leftRightSignedOutputMismatchFraction") {
    return {
      value: metrics.circulation.leftRightSignedOutputMismatchFraction,
      unit: "1",
    };
  }
  if (metricId === "filling.mitral.eToAPeakRatio") {
    return { value: metrics.filling.mitral.eToAPeakRatio, unit: "1" };
  }
  if (metricId === "filling.mitral.eToAForwardVolumeRatio") {
    return { value: metrics.filling.mitral.eToAForwardVolumeRatio, unit: "1" };
  }
  if (metricId === "filling.pulmonaryVenous.sToDPeakRatio") {
    return { value: metrics.filling.pulmonaryVenous.sToDPeakRatio, unit: "1" };
  }
  if (metricId === "filling.pulmonaryVenous.sToDForwardVolumeRatio") {
    return { value: metrics.filling.pulmonaryVenous.sToDForwardVolumeRatio, unit: "1" };
  }
  if (metricId === "filling.pulmonaryVenous.systolicForwardFraction") {
    return {
      value: metrics.filling.pulmonaryVenous.systolicForwardFraction,
      unit: "1",
    };
  }
  if (metricId
    === "filling.pulmonaryVenous.atrialReversalToTotalForwardVolumeRatio") {
    return {
      value: metrics.filling.pulmonaryVenous
        .atrialReversalToTotalForwardVolumeRatio,
      unit: "1",
    };
  }
  if (metricId === "filling.pulmonaryVenous.atrialReversalPeakMagnitudeM3PerSec") {
    return {
      value: metrics.filling.pulmonaryVenous.atrialReversalPeakMagnitudeM3PerSec,
      unit: "m3/s",
    };
  }
  if (metricId === "filling.pulmonaryVenous.atrialReversalVolumeM3") {
    return {
      value: metrics.filling.pulmonaryVenous.atrialReversalVolumeM3,
      unit: "m3",
    };
  }
  const parts = metricId.split(".");
  if (parts[0] === "circulation") {
    const side = parts[1] as "left" | "right";
    const field = parts[2] as
      | "volumeCardiacOutputLPerMin"
      | "forwardOutflowCardiacOutputLPerMin"
      | "signedOutflowCardiacOutputLPerMin";
    return { value: metrics.circulation[side][field], unit: "L/min" };
  }
  if (parts[0] === "pressure") {
    const compartmentId = parts[1] as BloodCompartmentId;
    const field = parts[2] as "minimumPa" | "maximumPa" | "meanPa";
    const pressure = metrics.pressureByCompartment[compartmentId];
    return {
      value: field === "meanPa" ? pressure.timeWeightedMeanPa : pressure[field],
      unit: "Pa",
    };
  }
  if (parts[0] === "volume") {
    const chamberId = parts[1] as PhaseB1PhysiologyEnvelopeChamberIdV1;
    const field = parts[2] as
      | "minimumM3"
      | "maximumM3"
      | "strokeVolumeM3"
      | "ejectionFraction";
    const volume = metrics.volumeByChamber[chamberId];
    return field === "ejectionFraction"
      ? { value: volume.ejectionFractionFromExtrema, unit: "1" }
      : { value: volume[field], unit: "m3" };
  }
  if (parts[0] === "flow") {
    const flowId = parts[1] as FourChamberFlowId;
    const field = parts[2] as
      | "peakForwardM3PerSec"
      | "peakReverseMagnitudeM3PerSec"
      | "signedVolumeM3"
      | "forwardVolumeM3"
      | "regurgitantVolumeM3"
      | "regurgitantToForwardRatio";
    const flow = metrics.flowById[flowId];
    if (field === "regurgitantToForwardRatio") {
      return { value: flow[field], unit: "1" };
    }
    return {
      value: flow[field],
      unit: field.endsWith("M3PerSec") ? "m3/s" : "m3",
    };
  }
  throw new Error(`unsupported normal target metric ${String(metricId)}`);
}

function ventricularVolumeTargets(
  chamberId: "LV" | "RV",
  targets: NormalAdultChamberVolumeTargetsV1,
): readonly PhaseB1PhysiologyEnvelopeNormalTargetV1[] {
  return deepFreeze([
    targetFromBand(
      `${chamberId.toLowerCase()}-end-diastolic-volume`,
      `volume.${chamberId}.maximumM3`,
      "m3",
      targets.endDiastolicVolumeMl,
      1e-6,
      "supportive",
    ),
    targetFromBand(
      `${chamberId.toLowerCase()}-end-systolic-volume`,
      `volume.${chamberId}.minimumM3`,
      "m3",
      targets.endSystolicVolumeMl,
      1e-6,
      "supportive",
    ),
    targetFromBand(
      `${chamberId.toLowerCase()}-stroke-volume`,
      `volume.${chamberId}.strokeVolumeM3`,
      "m3",
      targets.strokeVolumeMl,
      1e-6,
      "supportive",
    ),
    targetFromBand(
      `${chamberId.toLowerCase()}-ejection-fraction`,
      `volume.${chamberId}.ejectionFraction`,
      "1",
      targets.ejectionFraction,
      1,
      "supportive",
    ),
  ]);
}

function atrialVolumeTargets(
  chamberId: "LA" | "RA",
  targets: NormalAdultAtrialVolumeTargetsV1,
): readonly PhaseB1PhysiologyEnvelopeNormalTargetV1[] {
  return deepFreeze([
    targetFromBand(
      `${chamberId.toLowerCase()}-maximum-volume`,
      `volume.${chamberId}.maximumM3`,
      "m3",
      targets.maximumVolumeMl,
      1e-6,
      "supportive",
    ),
    targetFromBand(
      `${chamberId.toLowerCase()}-minimum-volume`,
      `volume.${chamberId}.minimumM3`,
      "m3",
      targets.minimumVolumeMl,
      1e-6,
      "supportive",
    ),
    targetFromBand(
      `${chamberId.toLowerCase()}-cyclic-emptying-volume`,
      `volume.${chamberId}.strokeVolumeM3`,
      "m3",
      targets.cyclicEmptyingVolumeMl,
      1e-6,
      "supportive",
    ),
    targetFromBand(
      `${chamberId.toLowerCase()}-total-emptying-fraction`,
      `volume.${chamberId}.ejectionFraction`,
      "1",
      targets.totalEmptyingFraction,
      1,
      "supportive",
    ),
  ]);
}

function targetFromBand(
  gateId: string,
  metricId: PhaseB1PhysiologyEnvelopeNormalTargetMetricIdV1,
  unit: PhaseB1PhysiologyEnvelopeMetricUnitV1,
  band: NormalAdultTargetBandV1,
  unitScale = 1,
  roleOverride?: "hard" | "supportive",
): PhaseB1PhysiologyEnvelopeNormalTargetV1 {
  const [minimum, maximum] = band.broadRange;
  return targetFromBounds(
    gateId,
    metricId,
    unit,
    minimum * unitScale,
    maximum * unitScale,
    roleOverride
      ?? (band.gateRole === "primary-operating-point" ? "hard" : "supportive"),
    sourceIdForBand(band),
  );
}

function targetFromBounds(
  gateId: string,
  metricId: PhaseB1PhysiologyEnvelopeNormalTargetMetricIdV1,
  unit: PhaseB1PhysiologyEnvelopeMetricUnitV1,
  lowerInclusive: number | null,
  upperInclusive: number | null,
  role: "hard" | "supportive",
  evidenceSourceId: string,
): PhaseB1PhysiologyEnvelopeNormalTargetV1 {
  return deepFreeze({
    gateId,
    metricId,
    unit,
    lowerInclusive,
    upperInclusive,
    role,
    evidenceSourceId,
  });
}

function sourceIdForBand(band: NormalAdultTargetBandV1): string {
  return band.sourceIds.join("+");
}

function validateSamples(
  input: readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[],
  cycleStartTimeSec: number,
  cycleLengthSec: number,
): readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[] {
  if (!Array.isArray(input) || input.length < 2) {
    throw new Error("physiology metrics require initial plus at least one end sample");
  }
  const cycleEndTimeSec = cycleStartTimeSec + cycleLengthSec;
  const samples = input.map((sample, index) => {
    if (!isPlainRecord(sample)) {
      throw new Error(`samples[${index}] must be a plain record`);
    }
    const absoluteTimeSec = requireFinite(
      sample.absoluteTimeSec,
      `samples[${index}].absoluteTimeSec`,
    );
    const phaseSec = requireNonNegativeFinite(
      sample.phaseSec,
      `samples[${index}].phaseSec`,
    );
    if (!approximatelyEqual(phaseSec, absoluteTimeSec - cycleStartTimeSec)) {
      throw new Error(
        `samples[${index}].phaseSec must equal absoluteTimeSec minus cycleStartTimeSec`,
      );
    }
    if (
      phaseSec > cycleLengthSec
      && !approximatelyEqual(phaseSec, cycleLengthSec)
    ) {
      throw new Error(`samples[${index}].phaseSec exceeds the cycle length`);
    }
    if (index > 0) {
      if (!(absoluteTimeSec > input[index - 1]!.absoluteTimeSec)) {
        throw new Error("sample absolute times must be strictly increasing");
      }
      if (!(phaseSec > input[index - 1]!.phaseSec)) {
        throw new Error("sample phases must be strictly increasing within one cycle");
      }
    }
    const volumeKeys = Object.keys(sample.bloodVolumesM3);
    if (volumeKeys.some((key) => !BLOOD_COMPARTMENT_IDS.includes(
      key as BloodCompartmentId,
    ))) {
      throw new Error(`samples[${index}].bloodVolumesM3 has an unknown key`);
    }
    for (const chamberId of PHASE_B1_PHYSIOLOGY_ENVELOPE_CHAMBER_IDS_V1) {
      if (sample.bloodVolumesM3[chamberId] === undefined) {
        throw new Error(`samples[${index}] is missing chamber volume ${chamberId}`);
      }
    }
    const bloodVolumesM3 = deepFreeze(Object.fromEntries(volumeKeys.map((key) => [
      key,
      requireNonNegativeFinite(
        sample.bloodVolumesM3[key as BloodCompartmentId],
        `samples[${index}].bloodVolumesM3.${key}`,
      ),
    ])) as Partial<Record<BloodCompartmentId, number>>);
    const compartmentAbsolutePressurePa = validateFiniteRecord(
      sample.compartmentAbsolutePressurePa,
      BLOOD_COMPARTMENT_IDS,
      `samples[${index}].compartmentAbsolutePressurePa`,
    );
    const allFlowsM3PerSec = validateFiniteRecord(
      sample.allFlowsM3PerSec,
      FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
      `samples[${index}].allFlowsM3PerSec`,
    );
    return deepFreeze({
      absoluteTimeSec,
      phaseSec,
      bloodVolumesM3,
      compartmentAbsolutePressurePa,
      allFlowsM3PerSec,
    });
  });
  if (
    (
      samples[0]!.absoluteTimeSec < cycleStartTimeSec
      && !approximatelyEqual(samples[0]!.absoluteTimeSec, cycleStartTimeSec)
    )
    || (
      samples[samples.length - 1]!.absoluteTimeSec > cycleEndTimeSec
      && !approximatelyEqual(
        samples[samples.length - 1]!.absoluteTimeSec,
        cycleEndTimeSec,
      )
    )
  ) {
    throw new Error("sample times must stay inside the declared cycle");
  }
  return deepFreeze(samples);
}

function validatePhaseWindows(
  input: PhaseB1PhysiologyEnvelopeFillingPhaseWindowsV1,
  cycleLengthSec: number,
): PhaseB1PhysiologyEnvelopeFillingPhaseWindowsV1 {
  if (!isPlainRecord(input)) throw new Error("phaseWindows must be a plain record");
  const keys = [
    "mitralEarly",
    "mitralAtrial",
    "pulmonaryVenousSystolic",
    "pulmonaryVenousDiastolic",
    "pulmonaryVenousAtrialReversal",
  ] as const;
  if (!sameKeys(input, keys)) throw new Error("phaseWindows keys are invalid");
  return recordFromIds(keys, (key) => validateWindow(input[key], key, cycleLengthSec));
}

function validateWindow(
  input: PhaseB1PhysiologyEnvelopePhaseWindowV1,
  field: string,
  cycleLengthSec: number,
): PhaseB1PhysiologyEnvelopePhaseWindowV1 {
  if (!isPlainRecord(input) || !sameKeys(input, [
    "windowId",
    "startPhaseSec",
    "endPhaseSec",
  ])) throw new Error(`${field} phase window is invalid`);
  if (typeof input.windowId !== "string" || input.windowId.trim() === "") {
    throw new Error(`${field}.windowId must be non-empty`);
  }
  const startPhaseSec = requireNonNegativeFinite(
    input.startPhaseSec,
    `${field}.startPhaseSec`,
  );
  const endPhaseSec = requireNonNegativeFinite(
    input.endPhaseSec,
    `${field}.endPhaseSec`,
  );
  if (
    startPhaseSec > cycleLengthSec
    || endPhaseSec > cycleLengthSec
    || Object.is(startPhaseSec, endPhaseSec)
  ) throw new Error(`${field} must define a non-empty window inside the cycle`);
  return deepFreeze({ windowId: input.windowId, startPhaseSec, endPhaseSec });
}

function validateTargetSet(
  input: PhaseB1PhysiologyEnvelopeNormalTargetSetV1,
): PhaseB1PhysiologyEnvelopeNormalTargetSetV1 {
  if (!isPlainRecord(input) || !sameKeys(input, [
    "targetSetId",
    "status",
    "targets",
    "scalarScoreOrRankingAllowed",
    "atrialPvLoopMorphologyMaySelectOrGate",
  ])) throw new Error("normalTargets must be an exact target-set record");
  if (
    typeof input.targetSetId !== "string"
    || input.targetSetId.trim() === ""
    || input.status !== "prospective-targets-not-physiological-validation"
    || input.scalarScoreOrRankingAllowed !== false
    || input.atrialPvLoopMorphologyMaySelectOrGate !== false
    || !Array.isArray(input.targets)
  ) throw new Error("normal target-set claim boundary is invalid");
  const gateIds = new Set<string>();
  const metricRoleKeys = new Set<string>();
  const targets = input.targets.map((target, index) => {
    if (!isPlainRecord(target) || !sameKeys(target, [
      "gateId",
      "metricId",
      "unit",
      "lowerInclusive",
      "upperInclusive",
      "role",
      "evidenceSourceId",
    ])) throw new Error(`normalTargets.targets[${index}] is invalid`);
    if (
      typeof target.gateId !== "string"
      || target.gateId.trim() === ""
      || gateIds.has(target.gateId)
    ) throw new Error("normal target gate IDs must be unique and non-empty");
    gateIds.add(target.gateId);
    if (target.role !== "hard" && target.role !== "supportive") {
      throw new Error(`normal target ${target.gateId} role is invalid`);
    }
    if (
      target.role === "hard"
      && !PHASE_B1_PHYSIOLOGY_ENVELOPE_REQUIRED_NORMAL_TARGET_METRICS_V1.some(
        (metricId) => metricId === target.metricId,
      )
    ) {
      throw new Error(
        `normal target ${target.gateId} cannot enter the Stage 1 hard gate`,
      );
    }
    const metricRoleKey = `${target.role}:${target.metricId}`;
    if (metricRoleKeys.has(metricRoleKey)) {
      throw new Error("normal targets cannot duplicate a metric within one role");
    }
    metricRoleKeys.add(metricRoleKey);
    if (typeof target.evidenceSourceId !== "string"
      || target.evidenceSourceId.trim() === "") {
      throw new Error(`normal target ${target.gateId} needs evidenceSourceId`);
    }
    const lowerInclusive = target.lowerInclusive === null
      ? null
      : requireFinite(target.lowerInclusive, `${target.gateId}.lowerInclusive`);
    const upperInclusive = target.upperInclusive === null
      ? null
      : requireFinite(target.upperInclusive, `${target.gateId}.upperInclusive`);
    if (
      lowerInclusive === null && upperInclusive === null
      || lowerInclusive !== null && upperInclusive !== null
        && lowerInclusive > upperInclusive
    ) throw new Error(`normal target ${target.gateId} bounds are invalid`);
    if (!isMetricUnit(target.unit)) {
      throw new Error(`normal target ${target.gateId} unit is invalid`);
    }
    return deepFreeze({
      gateId: target.gateId,
      metricId: target.metricId,
      unit: target.unit,
      lowerInclusive,
      upperInclusive,
      role: target.role,
      evidenceSourceId: target.evidenceSourceId,
    });
  });
  return deepFreeze({ ...input, targets });
}

function validateIntegrationSource(
  input: PhaseB1PhysiologyEnvelopeIntegrationSourceV1,
): PhaseB1PhysiologyEnvelopeIntegrationSourceV1 {
  if (
    input !== "committed-backward-euler-left-limit-evaluations"
    && input !== "terminal-waveform-right-continuous-projection"
  ) throw new Error("integrationSource is invalid");
  return input;
}

function validateFiniteRecord<K extends string>(
  input: Readonly<Record<K, number>>,
  ids: readonly K[],
  field: string,
): Readonly<Record<K, number>> {
  if (!isPlainRecord(input) || !sameKeys(input, ids)) {
    throw new Error(`${field} must contain the exact canonical keys`);
  }
  return recordFromIds(ids, (id) => requireFinite(input[id], `${field}.${id}`));
}

function recordFromIds<K extends string, V>(
  ids: readonly K[],
  value: (id: K) => V,
): Readonly<Record<K, V>> {
  return deepFreeze(Object.fromEntries(ids.map((id) => [id, value(id)])) as Record<K, V>);
}

function sameKeys(input: object, expected: readonly string[]): boolean {
  const keys = Object.keys(input).sort();
  const sorted = [...expected].sort();
  return keys.length === sorted.length
    && keys.every((key, index) => key === sorted[index]);
}

function intervalDuration(
  samples: readonly PhaseB1PhysiologyEnvelopeMetricSampleV1[],
  index: number,
): number {
  return samples[index]!.absoluteTimeSec - samples[index - 1]!.absoluteTimeSec;
}

function cardiacOutputLPerMin(strokeVolumeM3: number, cycleLengthSec: number): number {
  return strokeVolumeM3 * 1_000 * 60 / cycleLengthSec;
}

function positiveRatio(numerator: number | null, denominator: number | null): number | null {
  return numerator !== null && denominator !== null && numerator > 0 && denominator > 0
    ? numerator / denominator
    : null;
}

function isMetricUnit(value: unknown): value is PhaseB1PhysiologyEnvelopeMetricUnitV1 {
  return value === "1" || value === "Pa" || value === "m3"
    || value === "m3/s" || value === "L/min" || value === "bpm";
}

function symmetricRelativeMismatch(left: number, right: number): number | null {
  const denominator = 0.5 * (Math.abs(left) + Math.abs(right));
  return denominator > 0 ? Math.abs(left - right) / denominator : null;
}

function isPlainRecord(value: unknown): value is Record<string, any> {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype
      || Object.getPrototypeOf(value) === null);
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const resolved = requireFinite(value, field);
  if (resolved < 0) throw new Error(`${field} must be non-negative`);
  return resolved;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const resolved = requireFinite(value, field);
  if (resolved <= 0) throw new Error(`${field} must be positive`);
  return resolved;
}

function approximatelyEqual(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= 64 * Number.EPSILON * scale;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
