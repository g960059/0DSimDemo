import { MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID } from "@/analysis/methods/mainWire/MainWireLeftVentricularFlowEventTimingV1";
import {
  MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID,
  mainWireLeftVentricularPressureRateConfigurationIdentityV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularPressureRateV1";
import { MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID } from "@/analysis/methods/mainWire/MainWireStandard66AorticOutflowShapeDiagnosticV1";
import { MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID } from "@/analysis/methods/mainWire/MainWireStandard66TerminalBeatValidationMeasurementsV1";
import {
  MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_V1_ID,
  assertMainWireStandard66ValidationRunArtifactV1,
  type MainWireStandard66ValidationRunArtifactV1,
} from "@/analysis/runtime/MainWireStandard66ValidationRunArtifactV1";
import {
  MAIN_WIRE_STANDARD66_VALIDATION_ARM_PROTOCOL_IDENTITY_V1_ID,
  MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID,
} from "@/analysis/runtime/MainWireStandard66ValidationArmRunnerV1";
import {
  canonicalJsonStringify,
  deepFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonValue,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
  type MainWireIntegratedModelStandard66ValidationClockArmIdV1,
  type MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

export const MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_V1_ID =
  "main-wire-standard66-preregistered-validation-envelope-summary-v1" as const;

export const MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_CLAIM_V1 =
  Object.freeze({
    scope: "descriptive-preregistered-envelope-only" as const,
    requiredCoverage: "exactly-all-seventeen-preregistered-cases" as const,
    source:
      "integrity-checked-completed-canonical-validation-artifacts" as const,
    commonClockArmRequired: true as const,
    commonMethodProtocolRequired: true as const,
    commonMechanismAndContractilityRequired: true as const,
    settledAndFreshConfirmedTerminalOutcomesRequired: true as const,
    partialEnvelopeReturned: false as const,
    extremaAreDescriptive: true as const,
    exactModelMutation: false as const,
    exactFrameOutputReserved: false as const,
    registryOrModelSurfaceChanged: false as const,
    clinicalThresholdsApplied: false as const,
    clinicalNormalityClaimed: false as const,
    physiologicalAcceptanceClaimed: false as const,
    numericalResolutionClaimed: false as const,
    releaseReadinessClaimed: false as const,
    causalAttributionClaimed: false as const,
    independenceClaimed: false as const,
  });

export const MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_METRICS_V1 =
  Object.freeze([
    metricV1("aortic-ejection-duration", "s"),
    metricV1("aortic-positive-flow-duration", "s"),
    metricV1("isovolumic-contraction-duration", "s"),
    metricV1("isovolumic-relaxation-duration", "s"),
    metricV1("model-flow-tei-like", "dimensionless"),
    metricV1("aortic-local-mean-gradient", "mmHg"),
    metricV1("aortic-local-peak-gradient", "mmHg"),
    metricV1("aortic-vena-contracta-mean-gradient", "mmHg"),
    metricV1("aortic-vena-contracta-peak-gradient", "mmHg"),
    metricV1("aortic-vmax", "m/s"),
    metricV1("stroke-volume-aortic-forward", "mL"),
    metricV1("mean-systemic-arterial-pressure", "mmHg"),
    metricV1("configured-maximum-forward-eoa", "cm2"),
    metricV1("active-eoa-maximum", "cm2"),
    metricV1("active-eoa-maximum-fraction-of-configured", "fraction"),
    metricV1("active-eoa-flow-weighted-mean", "cm2"),
    metricV1("active-eoa-flow-weighted-fraction-of-configured", "fraction"),
    metricV1("aortic-flow-time-weighted-mean", "mL/s"),
    metricV1("aortic-flow-time-weighted-rms", "mL/s"),
    metricV1("aortic-flow-peak", "mL/s"),
    metricV1("aortic-flow-peak-to-mean", "dimensionless"),
    metricV1("aortic-flow-rms-to-mean", "dimensionless"),
    metricV1("aortic-flow-mean-to-peak", "dimensionless"),
    metricV1("aortic-flow-time-opening-to-first-peak", "s"),
    metricV1("aortic-flow-time-opening-to-first-peak-fraction", "fraction"),
    metricV1("aortic-flow-centroid-from-opening", "s"),
    metricV1("aortic-flow-centroid-from-opening-fraction", "fraction"),
    metricV1("aortic-flow-episode-forward-volume", "mL"),
    metricV1("aortic-flow-episode-early-third-volume-fraction", "fraction"),
    metricV1("aortic-flow-episode-middle-third-volume-fraction", "fraction"),
    metricV1("aortic-flow-episode-late-third-volume-fraction", "fraction"),
    metricV1("lv-maximum-dp-dt-5ms", "mmHg/s"),
    metricV1("lv-minimum-dp-dt-5ms", "mmHg/s"),
    metricV1("lv-maximum-dp-dt-10ms", "mmHg/s"),
    metricV1("lv-minimum-dp-dt-10ms", "mmHg/s"),
    metricV1("lv-maximum-dp-dt-20ms", "mmHg/s"),
    metricV1("lv-minimum-dp-dt-20ms", "mmHg/s"),
    metricV1("lvp-waveform-minimum", "mmHg"),
    metricV1("lvp-waveform-maximum", "mmHg"),
    metricV1("lvp-waveform-pulse", "mmHg"),
    metricV1("aortic-proximal-port-pressure-waveform-minimum", "mmHg"),
    metricV1("aortic-proximal-port-pressure-waveform-maximum", "mmHg"),
    metricV1("aortic-proximal-port-pressure-waveform-pulse", "mmHg"),
    metricV1("systemic-arterial-pressure-waveform-minimum", "mmHg"),
    metricV1("systemic-arterial-pressure-waveform-maximum", "mmHg"),
    metricV1("systemic-arterial-pressure-waveform-pulse", "mmHg"),
    metricV1("historical-aortic-node-pressure-waveform-minimum", "mmHg"),
    metricV1("historical-aortic-node-pressure-waveform-maximum", "mmHg"),
    metricV1("historical-aortic-node-pressure-waveform-pulse", "mmHg"),
  ] as const);

export type MainWireStandard66ValidationEnvelopeMetricIdV1 =
  (typeof MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_METRICS_V1)[number]["metricId"];

type EnvelopeCaseIdV1 =
  MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1["caseId"];

export type MainWireStandard66ValidationEnvelopeSummaryUnavailableReasonCodeV1 =
  | "artifact-count-not-exact"
  | "artifact-invalid"
  | "study-kind-not-validation-envelope"
  | "unsupported-case-id"
  | "duplicate-case-id"
  | "missing-case-id"
  | "common-clock-arm-mismatch"
  | "execution-purpose-not-preregistered"
  | "common-protocol-identity-mismatch"
  | "common-mechanism-construction-mismatch"
  | "common-contractility-mismatch"
  | "terminal-analysis-not-complete"
  | "period1-settlement-unavailable"
  | "fresh-period1-confirmation-unavailable"
  | "terminal-outcomes-unavailable"
  | "method-identity-mismatch"
  | "measurement-unavailable-or-invalid";

export type MainWireStandard66ValidationEnvelopeSummaryUnavailableReasonV1 =
  Readonly<{
    code: MainWireStandard66ValidationEnvelopeSummaryUnavailableReasonCodeV1;
    inputIndex: number | null;
    caseId: string | null;
    /** Exact upstream message or availability reason when one exists. */
    sourceReason: string | null;
    message: string;
  }>;

export type MainWireStandard66ValidationEnvelopeCaseRowV1 = Readonly<{
  caseId: EnvelopeCaseIdV1;
  artifactPayloadSha256: string;
  armProtocolIdentityHash: string;
  comparisonCohortIdentityHash: string;
  values: Readonly<
    Record<MainWireStandard66ValidationEnvelopeMetricIdV1, number>
  >;
}>;

export type MainWireStandard66ValidationEnvelopeMetricExtremaV1 = Readonly<{
  metricId: MainWireStandard66ValidationEnvelopeMetricIdV1;
  unit: (typeof MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_METRICS_V1)[number]["unit"];
  minimum: number;
  minimumCaseIds: readonly EnvelopeCaseIdV1[];
  maximum: number;
  maximumCaseIds: readonly EnvelopeCaseIdV1[];
}>;

export type MainWireStandard66ValidationEnvelopeSummaryResultV1 =
  | Readonly<{
      evaluatorId: typeof MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_V1_ID;
      status: "unavailable";
      unavailableReasons: readonly MainWireStandard66ValidationEnvelopeSummaryUnavailableReasonV1[];
      common: null;
      caseRows: null;
      metricExtrema: null;
      claim: typeof MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_CLAIM_V1;
    }>
  | Readonly<{
      evaluatorId: typeof MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_V1_ID;
      status: "envelope-summarized";
      unavailableReasons: readonly [];
      common: Readonly<{
        preregistrationId: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID;
        artifactId: typeof MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_V1_ID;
        artifactProtocolManifestSha256: string;
        clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
        requestedBoundaryIntervalSec: number;
        comparisonProtocolIdentityHash: string;
        commonArmProtocolProjectionSha256: string;
        commonMechanismResearchInputsSha256: string;
        ventricularContractilityScale: number;
        configuredMaximumForwardEoaCm2: number;
      }>;
      caseOrder: "preregistered-validation-envelope-order";
      caseRows: readonly MainWireStandard66ValidationEnvelopeCaseRowV1[];
      metricExtrema: readonly MainWireStandard66ValidationEnvelopeMetricExtremaV1[];
      claim: typeof MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_CLAIM_V1;
    }>;

/**
 * Deterministic, model-free summarization of one completed clock arm across the
 * preregistered 17-case envelope. Integrity and eligibility are checked before
 * any descriptive extrema are returned; an invalid case therefore never
 * yields a partial envelope.
 */
export async function summarizeMainWireStandard66ValidationEnvelopeV1(
  artifacts: readonly unknown[],
): Promise<MainWireStandard66ValidationEnvelopeSummaryResultV1> {
  const reasons: MainWireStandard66ValidationEnvelopeSummaryUnavailableReasonV1[] =
    [];
  const expectedCases =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1;
  if (artifacts.length !== expectedCases.length) {
    reasons.push(
      reasonV1(
        "artifact-count-not-exact",
        null,
        null,
        null,
        `Standard66 envelope summary requires exactly ${expectedCases.length} artifacts`,
      ),
    );
  }

  const verified: Array<{
    inputIndex: number;
    artifact: MainWireStandard66ValidationRunArtifactV1;
  }> = [];
  for (const [inputIndex, candidate] of artifacts.entries()) {
    try {
      await assertMainWireStandard66ValidationRunArtifactV1(candidate);
      verified.push({
        inputIndex,
        artifact: candidate as MainWireStandard66ValidationRunArtifactV1,
      });
    } catch (error) {
      const sourceReason = errorMessageV1(error);
      reasons.push(
        reasonV1(
          "artifact-invalid",
          inputIndex,
          bestEffortCaseIdV1(candidate),
          sourceReason,
          `Standard66 envelope artifact ${inputIndex} failed canonical artifact validation`,
        ),
      );
    }
  }

  const byCase = new Map<
    string,
    {
      inputIndex: number;
      artifact: MainWireStandard66ValidationRunArtifactV1;
    }
  >();
  const expectedCaseIds = new Set(
    expectedCases.map((envelopeCase) => envelopeCase.caseId as string),
  );
  for (const item of verified) {
    const study = item.artifact.payload.study;
    if (study.studyKind !== "validation-envelope") {
      reasons.push(
        reasonV1(
          "study-kind-not-validation-envelope",
          item.inputIndex,
          null,
          null,
          "Standard66 envelope summary accepts only validation-envelope artifacts",
        ),
      );
      continue;
    }
    const caseId = String(study.caseId);
    if (!expectedCaseIds.has(caseId)) {
      reasons.push(
        reasonV1(
          "unsupported-case-id",
          item.inputIndex,
          caseId,
          null,
          `Standard66 envelope case ${caseId} is not preregistered`,
        ),
      );
      continue;
    }
    if (byCase.has(caseId)) {
      reasons.push(
        reasonV1(
          "duplicate-case-id",
          item.inputIndex,
          caseId,
          null,
          `Standard66 envelope case ${caseId} appears more than once`,
        ),
      );
      continue;
    }
    byCase.set(caseId, item);
  }
  for (const envelopeCase of expectedCases) {
    if (!byCase.has(envelopeCase.caseId)) {
      reasons.push(
        reasonV1(
          "missing-case-id",
          null,
          envelopeCase.caseId,
          null,
          `Standard66 envelope case ${envelopeCase.caseId} is missing`,
        ),
      );
    }
  }

  const orderedItems = expectedCases.flatMap((envelopeCase) => {
    const item = byCase.get(envelopeCase.caseId);
    return item === undefined ? [] : [item];
  });
  const reference = orderedItems[0];
  const caseRows: MainWireStandard66ValidationEnvelopeCaseRowV1[] = [];
  if (reference !== undefined) {
    const referenceArm = reference.artifact.payload.armResult;
    const referenceClockArmId = referenceArm.protocolIdentity.clock.armId;
    const referenceProtocolManifestSha256 =
      reference.artifact.protocolManifestSha256;
    const referenceComparisonProtocolIdentityHash =
      referenceArm.comparisonProtocolIdentityHash;
    const referenceProtocolProjection = commonProtocolProjectionV1(
      referenceArm.protocolIdentity,
    );
    const referenceMechanism =
      referenceArm.protocolIdentity.exactConstruction.mechanismResearchInputs;
    const referenceContractility =
      referenceArm.protocolIdentity.exactConstruction
        .ventricularContractilityScale;

    for (const item of orderedItems) {
      const artifact = item.artifact;
      const study = artifact.payload.study;
      if (study.studyKind !== "validation-envelope") continue;
      const arm = artifact.payload.armResult;
      const caseId = String(study.caseId);
      if (arm.protocolIdentity.clock.armId !== referenceClockArmId) {
        reasons.push(
          reasonV1(
            "common-clock-arm-mismatch",
            item.inputIndex,
            caseId,
            String(arm.protocolIdentity.clock.armId),
            "Standard66 envelope artifacts do not share one clock arm",
          ),
        );
      }
      if (arm.executionPurpose !== "preregistered-validation") {
        reasons.push(
          reasonV1(
            "execution-purpose-not-preregistered",
            item.inputIndex,
            caseId,
            arm.executionPurpose,
            "Standard66 envelope summary requires preregistered-validation execution",
          ),
        );
      }
      if (
        artifact.protocolManifestSha256 !== referenceProtocolManifestSha256 ||
        arm.comparisonProtocolIdentityHash !==
          referenceComparisonProtocolIdentityHash ||
        canonicalJsonStringify(
          commonProtocolProjectionV1(arm.protocolIdentity),
        ) !== canonicalJsonStringify(referenceProtocolProjection)
      ) {
        reasons.push(
          reasonV1(
            "common-protocol-identity-mismatch",
            item.inputIndex,
            caseId,
            arm.comparisonProtocolIdentityHash,
            "Standard66 envelope artifacts do not share one analysis protocol identity",
          ),
        );
      }
      if (
        canonicalJsonStringify(
          arm.protocolIdentity.exactConstruction.mechanismResearchInputs,
        ) !== canonicalJsonStringify(referenceMechanism)
      ) {
        reasons.push(
          reasonV1(
            "common-mechanism-construction-mismatch",
            item.inputIndex,
            caseId,
            null,
            "Standard66 envelope artifacts do not share one mechanism construction",
          ),
        );
      }
      if (
        arm.protocolIdentity.exactConstruction.ventricularContractilityScale !==
        referenceContractility
      ) {
        reasons.push(
          reasonV1(
            "common-contractility-mismatch",
            item.inputIndex,
            caseId,
            String(
              arm.protocolIdentity.exactConstruction
                .ventricularContractilityScale,
            ),
            "Standard66 envelope artifacts do not share one ventricular contractility scale",
          ),
        );
      }
      collectArmEligibilityReasonsV1(item.inputIndex, caseId, arm, reasons);
      if (arm.outcomes === null) continue;
      try {
        assertOutcomeMethodIdentitiesV1(arm.outcomes);
        caseRows.push(
          freezeCanonicalV1<MainWireStandard66ValidationEnvelopeCaseRowV1>({
            caseId: study.caseId,
            artifactPayloadSha256: artifact.payloadSha256,
            armProtocolIdentityHash: arm.protocolIdentityHash,
            comparisonCohortIdentityHash: arm.comparisonCohortIdentityHash,
            values: extractMetricValuesV1(arm),
          }),
        );
      } catch (error) {
        const sourceReason = errorMessageV1(error);
        reasons.push(
          reasonV1(
            sourceReason.startsWith("method:")
              ? "method-identity-mismatch"
              : "measurement-unavailable-or-invalid",
            item.inputIndex,
            caseId,
            sourceReason,
            `Standard66 envelope case ${caseId} cannot supply the complete measurement row`,
          ),
        );
      }
    }
  }

  if (reasons.length > 0 || reference === undefined) {
    return freezeCanonicalV1<MainWireStandard66ValidationEnvelopeSummaryResultV1>(
      {
        evaluatorId: MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_V1_ID,
        status: "unavailable",
        unavailableReasons: reasons,
        common: null,
        caseRows: null,
        metricExtrema: null,
        claim: MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_CLAIM_V1,
      },
    );
  }

  if (caseRows.length !== expectedCases.length) {
    throw new Error(
      "Standard66 envelope summary internal row count is inconsistent",
    );
  }
  const referenceArm = reference.artifact.payload.armResult;
  const referenceConstruction = referenceArm.protocolIdentity.exactConstruction;
  const [
    commonArmProtocolProjectionSha256,
    commonMechanismResearchInputsSha256,
  ] = await Promise.all([
    sha256CanonicalJsonHex(
      commonProtocolProjectionV1(referenceArm.protocolIdentity),
    ),
    sha256CanonicalJsonHex(referenceConstruction.mechanismResearchInputs),
  ]);

  return freezeCanonicalV1<MainWireStandard66ValidationEnvelopeSummaryResultV1>(
    {
      evaluatorId: MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_V1_ID,
      status: "envelope-summarized",
      unavailableReasons: [],
      common: {
        preregistrationId:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
        artifactId: MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_V1_ID,
        artifactProtocolManifestSha256:
          reference.artifact.protocolManifestSha256,
        clockArmId: referenceArm.protocolIdentity.clock.armId,
        requestedBoundaryIntervalSec:
          referenceArm.protocolIdentity.clock.requestedBoundaryIntervalSec,
        comparisonProtocolIdentityHash:
          referenceArm.comparisonProtocolIdentityHash,
        commonArmProtocolProjectionSha256,
        commonMechanismResearchInputsSha256,
        ventricularContractilityScale:
          referenceConstruction.ventricularContractilityScale,
        configuredMaximumForwardEoaCm2:
          referenceArm.configuredAorticValveAreaBinding.maximumForwardEoaCm2,
      },
      caseOrder: "preregistered-validation-envelope-order",
      caseRows,
      metricExtrema: metricExtremaV1(caseRows),
      claim: MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_CLAIM_V1,
    },
  );
}

function extractMetricValuesV1(
  arm: MainWireStandard66ValidationRunArtifactV1["payload"]["armResult"],
): Readonly<Record<MainWireStandard66ValidationEnvelopeMetricIdV1, number>> {
  if (arm.outcomes === null) {
    throw new Error("terminal outcomes are unavailable");
  }
  const terminal = arm.outcomes.terminalBeatMeasurements;
  const shape = arm.outcomes.aorticOutflowShapeDiagnostic;
  const episode = shape.modelFlowEjectionEpisode;
  if (episode.status !== "available") {
    throw new Error(episode.reason);
  }
  const ejection = availableValueV1(
    terminal.requiredFlowEventMeasurements.aorticEjectionDurationSec,
    "aortic ejection duration",
  );
  const ict = availableValueV1(
    terminal.requiredFlowEventMeasurements.isovolumicContractionDurationSec,
    "isovolumic contraction duration",
  );
  const ivrt = availableValueV1(
    terminal.requiredFlowEventMeasurements.isovolumicRelaxationDurationSec,
    "isovolumic relaxation duration",
  );
  const teiLike = availableValueV1(
    terminal.requiredFlowEventMeasurements.teiLike,
    "Tei-like metric",
  );
  const dpDt5 = pressureRateWindowV1(terminal.pressureRate.windows, 0.005);
  const dpDt10 = pressureRateWindowV1(terminal.pressureRate.windows, 0.01);
  const dpDt20 = pressureRateWindowV1(terminal.pressureRate.windows, 0.02);
  const completed = terminal.completedBeatMeasurements;
  const activeEoa = shape.reconstructedActiveEoa;
  const flow = shape.forwardFlowShape;
  const lvp = terminal.waveformAudit.absoluteLeftVentricularPressureMmHg;
  const proximal =
    terminal.waveformAudit.aorticProximalConstitutivePortPressureMmHg;
  const abp = terminal.waveformAudit.absoluteSystemicArterialPressureMmHg;
  const historicalAo =
    terminal.waveformAudit.absoluteHistoricalAorticNodePressureMmHg;
  const values = {
    "aortic-ejection-duration": ejection,
    "aortic-positive-flow-duration": finiteV1(
      terminal.aorticFlowDurationAudit.positiveFlowDurationSec,
      "aortic positive-flow duration",
    ),
    "isovolumic-contraction-duration": ict,
    "isovolumic-relaxation-duration": ivrt,
    "model-flow-tei-like": teiLike,
    "aortic-local-mean-gradient": finiteV1(
      completed.aorticLocalHydraulicForwardGradient.meanMmHg,
      "aortic local mean gradient",
    ),
    "aortic-local-peak-gradient": finiteV1(
      completed.aorticLocalHydraulicForwardGradient.peakMmHg,
      "aortic local peak gradient",
    ),
    "aortic-vena-contracta-mean-gradient": finiteV1(
      completed.aorticVenaContractaBernoulliForwardGradient.meanMmHg,
      "aortic vena-contracta mean gradient",
    ),
    "aortic-vena-contracta-peak-gradient": finiteV1(
      completed.aorticVenaContractaBernoulliForwardGradient.peakMmHg,
      "aortic vena-contracta peak gradient",
    ),
    "aortic-vmax": finiteV1(
      completed.primaryModeledAorticVmaxMPerSec,
      "aortic Vmax",
    ),
    "stroke-volume-aortic-forward": finiteV1(
      completed.primaryStrokeVolumeAoVForwardMl,
      "aortic forward stroke volume",
    ),
    "mean-systemic-arterial-pressure": finiteV1(
      completed.primaryMeanSystemicArterialPressureMmHg,
      "mean systemic arterial pressure",
    ),
    "configured-maximum-forward-eoa": finiteV1(
      shape.configuredMaximumForwardEoa.areaCm2,
      "configured maximum forward EOA",
    ),
    "active-eoa-maximum": finiteV1(
      activeEoa.maximumAcceptedEndpoint.areaCm2,
      "maximum active EOA",
    ),
    "active-eoa-maximum-fraction-of-configured": finiteV1(
      activeEoa.maximumAcceptedEndpoint.fractionOfConfiguredMaximum01,
      "maximum active EOA fraction",
    ),
    "active-eoa-flow-weighted-mean": finiteV1(
      activeEoa.flowWeightedMeanAreaCm2,
      "flow-weighted active EOA",
    ),
    "active-eoa-flow-weighted-fraction-of-configured": finiteV1(
      activeEoa.flowWeightedMeanFractionOfConfiguredMaximum01,
      "flow-weighted active EOA fraction",
    ),
    "aortic-flow-time-weighted-mean": finiteV1(
      flow.timeWeightedMeanFlowMlPerSec,
      "aortic flow mean",
    ),
    "aortic-flow-time-weighted-rms": finiteV1(
      flow.timeWeightedRmsFlowMlPerSec,
      "aortic flow RMS",
    ),
    "aortic-flow-peak": finiteV1(flow.peakFlowMlPerSec, "aortic flow peak"),
    "aortic-flow-peak-to-mean": finiteV1(
      flow.shapeFactors.peakToMean,
      "aortic flow peak-to-mean shape factor",
    ),
    "aortic-flow-rms-to-mean": finiteV1(
      flow.shapeFactors.rmsToMean,
      "aortic flow RMS-to-mean shape factor",
    ),
    "aortic-flow-mean-to-peak": finiteV1(
      flow.shapeFactors.meanToPeak,
      "aortic flow mean-to-peak shape factor",
    ),
    "aortic-flow-time-opening-to-first-peak": finiteV1(
      episode.timeFromOpeningToFirstPeakSec,
      "aortic flow time from opening to first peak",
    ),
    "aortic-flow-time-opening-to-first-peak-fraction": finiteV1(
      episode.timeFromOpeningToFirstPeakFraction01,
      "aortic flow time-to-peak fraction",
    ),
    "aortic-flow-centroid-from-opening": finiteV1(
      episode.flowCentroidFromOpeningSec,
      "aortic flow centroid",
    ),
    "aortic-flow-centroid-from-opening-fraction": finiteV1(
      episode.flowCentroidFromOpeningFraction01,
      "aortic flow centroid fraction",
    ),
    "aortic-flow-episode-forward-volume": finiteV1(
      episode.forwardVolumeWithinEpisodeMl,
      "aortic flow episode forward volume",
    ),
    "aortic-flow-episode-early-third-volume-fraction": finiteV1(
      episode.forwardVolumeFractions.earlyThird,
      "aortic flow early-third fraction",
    ),
    "aortic-flow-episode-middle-third-volume-fraction": finiteV1(
      episode.forwardVolumeFractions.middleThird,
      "aortic flow middle-third fraction",
    ),
    "aortic-flow-episode-late-third-volume-fraction": finiteV1(
      episode.forwardVolumeFractions.lateThird,
      "aortic flow late-third fraction",
    ),
    "lv-maximum-dp-dt-5ms": dpDt5.maximumPositiveMmHgPerSec,
    "lv-minimum-dp-dt-5ms": dpDt5.minimumNegativeMmHgPerSec,
    "lv-maximum-dp-dt-10ms": dpDt10.maximumPositiveMmHgPerSec,
    "lv-minimum-dp-dt-10ms": dpDt10.minimumNegativeMmHgPerSec,
    "lv-maximum-dp-dt-20ms": dpDt20.maximumPositiveMmHgPerSec,
    "lv-minimum-dp-dt-20ms": dpDt20.minimumNegativeMmHgPerSec,
    "lvp-waveform-minimum": finiteV1(lvp.minimum, "LVP waveform minimum"),
    "lvp-waveform-maximum": finiteV1(lvp.maximum, "LVP waveform maximum"),
    "lvp-waveform-pulse": finiteV1(lvp.pulse, "LVP waveform pulse"),
    "aortic-proximal-port-pressure-waveform-minimum": finiteV1(
      proximal.minimum,
      "aortic proximal-port pressure waveform minimum",
    ),
    "aortic-proximal-port-pressure-waveform-maximum": finiteV1(
      proximal.maximum,
      "aortic proximal-port pressure waveform maximum",
    ),
    "aortic-proximal-port-pressure-waveform-pulse": finiteV1(
      proximal.pulse,
      "aortic proximal-port pressure waveform pulse",
    ),
    "systemic-arterial-pressure-waveform-minimum": finiteV1(
      abp.minimum,
      "systemic arterial pressure waveform minimum",
    ),
    "systemic-arterial-pressure-waveform-maximum": finiteV1(
      abp.maximum,
      "systemic arterial pressure waveform maximum",
    ),
    "systemic-arterial-pressure-waveform-pulse": finiteV1(
      abp.pulse,
      "systemic arterial pressure waveform pulse",
    ),
    "historical-aortic-node-pressure-waveform-minimum": finiteV1(
      historicalAo.minimum,
      "historical aortic-node pressure waveform minimum",
    ),
    "historical-aortic-node-pressure-waveform-maximum": finiteV1(
      historicalAo.maximum,
      "historical aortic-node pressure waveform maximum",
    ),
    "historical-aortic-node-pressure-waveform-pulse": finiteV1(
      historicalAo.pulse,
      "historical aortic-node pressure waveform pulse",
    ),
  } satisfies Record<MainWireStandard66ValidationEnvelopeMetricIdV1, number>;
  return freezeCanonicalV1(values);
}

function assertOutcomeMethodIdentitiesV1(
  outcomes: NonNullable<
    MainWireStandard66ValidationRunArtifactV1["payload"]["armResult"]["outcomes"]
  >,
): void {
  const terminal = outcomes.terminalBeatMeasurements;
  const shape = outcomes.aorticOutflowShapeDiagnostic;
  if (
    terminal.evaluatorId !==
    MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID
  ) {
    throw new Error("method:terminal-beat-evaluator");
  }
  if (
    terminal.flowEventTiming.methodId !==
      MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID ||
    shape.flowEventTimingEvidence.methodId !==
      MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID
  ) {
    throw new Error("method:model-flow-event-timing");
  }
  if (
    shape.methodId !==
    MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID
  ) {
    throw new Error("method:aortic-outflow-shape-diagnostic");
  }
  for (const window of terminal.pressureRate.windows) {
    if (
      window.result.methodId !==
        MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID ||
      window.result.configurationIdentity !==
        mainWireLeftVentricularPressureRateConfigurationIdentityV1(
          window.windowSec,
        )
    ) {
      throw new Error(`method:lv-pressure-rate-${window.windowSec}s`);
    }
  }
}

function collectArmEligibilityReasonsV1(
  inputIndex: number,
  caseId: string,
  arm: MainWireStandard66ValidationRunArtifactV1["payload"]["armResult"],
  reasons: MainWireStandard66ValidationEnvelopeSummaryUnavailableReasonV1[],
): void {
  if (arm.status !== "terminal-analysis-complete") {
    reasons.push(
      reasonV1(
        "terminal-analysis-not-complete",
        inputIndex,
        caseId,
        arm.failure?.message ?? arm.status,
        `Standard66 envelope case ${caseId} lacks completed terminal analysis`,
      ),
    );
  }
  if (
    arm.settlement.status !== "period1-settled" ||
    !arm.settlement.numericalPeriod1Established
  ) {
    reasons.push(
      reasonV1(
        "period1-settlement-unavailable",
        inputIndex,
        caseId,
        arm.settlement.failure?.message ?? arm.settlement.status,
        `Standard66 envelope case ${caseId} lacks numerical P1 settlement`,
      ),
    );
  }
  if (
    arm.confirmation?.status !== "period1-confirmed" ||
    !arm.confirmation.numericalPeriod1Confirmed
  ) {
    reasons.push(
      reasonV1(
        "fresh-period1-confirmation-unavailable",
        inputIndex,
        caseId,
        arm.confirmation?.failure?.message ??
          arm.confirmation?.status ??
          "confirmation:not-run",
        `Standard66 envelope case ${caseId} lacks fresh same-session P1 confirmation`,
      ),
    );
  }
  if (arm.outcomes === null) {
    reasons.push(
      reasonV1(
        "terminal-outcomes-unavailable",
        inputIndex,
        caseId,
        arm.failure?.message ?? `terminal:${arm.status}`,
        `Standard66 envelope case ${caseId} has no terminal outcomes`,
      ),
    );
  }
}

function commonProtocolProjectionV1(
  protocol: MainWireStandard66ValidationRunArtifactV1["payload"]["armResult"]["protocolIdentity"],
): CanonicalJsonValue {
  return {
    identityId: protocol.identityId,
    runnerId: protocol.runnerId,
    executionPurpose: protocol.executionPurpose,
    clock: protocol.clock,
    componentIdentities: protocol.componentIdentities,
    settlingProtocolId: protocol.settlingProtocolId,
    comparisonProtocolIdentityHash: protocol.comparisonProtocolIdentityHash,
    configuredAorticValveAreaBinding: protocol.configuredAorticValveAreaBinding,
    outcomePolicy: protocol.outcomePolicy,
    expectedIdentityId:
      MAIN_WIRE_STANDARD66_VALIDATION_ARM_PROTOCOL_IDENTITY_V1_ID,
    expectedRunnerId: MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID,
  } as CanonicalJsonValue;
}

function pressureRateWindowV1(
  windows: MainWireStandard66ValidationRunArtifactV1["payload"]["armResult"]["outcomes"] extends infer _Ignored
    ? readonly unknown[]
    : never,
  targetWindowSec: 0.005 | 0.01 | 0.02,
): Readonly<{
  maximumPositiveMmHgPerSec: number;
  minimumNegativeMmHgPerSec: number;
}> {
  if (!Array.isArray(windows) || windows.length !== 3) {
    throw new Error("LV pressure-rate windows are incomplete");
  }
  const matches = windows.filter(
    (candidate) =>
      candidate !== null &&
      typeof candidate === "object" &&
      (candidate as { windowSec?: unknown }).windowSec === targetWindowSec,
  ) as Array<{
    windowSec: number;
    role: unknown;
    result: unknown;
    maximumPositiveMmHgPerSec: unknown;
    minimumNegativeMmHgPerSec: unknown;
  }>;
  if (matches.length !== 1) {
    throw new Error(
      `LV pressure-rate ${targetWindowSec}s window is unavailable`,
    );
  }
  const match = matches[0]!;
  const expectedRole = targetWindowSec === 0.01 ? "primary" : "sensitivity";
  if (match.role !== expectedRole) {
    throw new Error(`LV pressure-rate ${targetWindowSec}s role is invalid`);
  }
  return Object.freeze({
    maximumPositiveMmHgPerSec: finiteV1(
      match.maximumPositiveMmHgPerSec,
      `LV maximum dP/dt ${targetWindowSec}s`,
    ),
    minimumNegativeMmHgPerSec: finiteV1(
      match.minimumNegativeMmHgPerSec,
      `LV minimum dP/dt ${targetWindowSec}s`,
    ),
  });
}

function availableValueV1(candidate: unknown, label: string): number {
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    (candidate as { status?: unknown }).status !== "available"
  ) {
    const reason =
      candidate !== null && typeof candidate === "object"
        ? (candidate as { reason?: unknown }).reason
        : null;
    throw new Error(
      typeof reason === "string" ? reason : `${label} is unavailable`,
    );
  }
  return finiteV1((candidate as { value?: unknown }).value, label);
}

function metricExtremaV1(
  rows: readonly MainWireStandard66ValidationEnvelopeCaseRowV1[],
): readonly MainWireStandard66ValidationEnvelopeMetricExtremaV1[] {
  return Object.freeze(
    MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_METRICS_V1.map((metric) => {
      const observations = rows.map((row) => ({
        caseId: row.caseId,
        value: row.values[metric.metricId],
      }));
      const minimum = Math.min(...observations.map(({ value }) => value));
      const maximum = Math.max(...observations.map(({ value }) => value));
      return Object.freeze({
        metricId: metric.metricId,
        unit: metric.unit,
        minimum,
        minimumCaseIds: Object.freeze(
          observations
            .filter(({ value }) => value === minimum)
            .map(({ caseId }) => caseId),
        ),
        maximum,
        maximumCaseIds: Object.freeze(
          observations
            .filter(({ value }) => value === maximum)
            .map(({ caseId }) => caseId),
        ),
      });
    }),
  );
}

function metricV1<
  const MetricId extends string,
  const Unit extends
    | "s"
    | "mmHg"
    | "m/s"
    | "mL"
    | "cm2"
    | "fraction"
    | "mL/s"
    | "mmHg/s"
    | "dimensionless",
>(
  metricId: MetricId,
  unit: Unit,
): Readonly<{ metricId: MetricId; unit: Unit }> {
  return Object.freeze({ metricId, unit });
}

function reasonV1(
  code: MainWireStandard66ValidationEnvelopeSummaryUnavailableReasonCodeV1,
  inputIndex: number | null,
  caseId: string | null,
  sourceReason: string | null,
  message: string,
): MainWireStandard66ValidationEnvelopeSummaryUnavailableReasonV1 {
  return Object.freeze({ code, inputIndex, caseId, sourceReason, message });
}

function finiteV1(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function bestEffortCaseIdV1(candidate: unknown): string | null {
  try {
    const caseId = (
      candidate as {
        payload?: { study?: { caseId?: unknown } };
      }
    ).payload?.study?.caseId;
    return typeof caseId === "string" ? caseId : null;
  } catch {
    return null;
  }
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function freezeCanonicalV1<T>(value: unknown): T {
  return deepFreezeCanonicalJson(
    JSON.parse(canonicalJsonStringify(value)) as CanonicalJsonValue,
  ) as T;
}
