import protocolDescriptor from "@/data/myocardium/protocols/passive-energy-phase4c-protocols.json";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID,
  PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS,
  PASSIVE_EXPONENTIAL_ENERGY_V1_ID,
  evaluatePassiveExponentialEnergyV1,
  evaluateSmoothPositiveHingeC2,
  type PassiveExponentialEnergyV1Params,
} from "@/engine/myocardium/mechanics";
import { runIdentityForcePhase3BReport } from "@/engine/myocardium/mechanics/identityForcePhase3BReport";
import {
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID,
  runLandActiveStressReplacementReadinessReport,
} from "@/engine/myocardium/protocols/landActiveStressReplacementReadiness";
import {
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID,
  runTissueHomogenizationReadinessReport,
} from "@/engine/myocardium/protocols/tissueHomogenizationReadiness";

export const PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID =
  "passive-energy-phase4c-protocols-v1";
export const PASSIVE_ENERGY_PHASE4C_CLAIM_BOUNDARY =
  "passive-energy-readiness-candidate-only";
export const PASSIVE_ENERGY_PHASE4C_PHASE = "Phase 4C-A";
export const PASSIVE_ENERGY_PHASE4C_CANDIDATE_STATUS =
  "recommended-candidate-pending-decision-6";

export type PassiveEnergyReadinessStatus =
  | "readiness-candidate-ready"
  | "readiness-candidate-review";

export type PassiveEnergySectionStatus =
  | "readiness-pass"
  | "readiness-fail";

export type PassiveEnergyReadinessSection = {
  readonly id: string;
  readonly status: PassiveEnergySectionStatus;
  readonly metrics: Record<string, unknown>;
};

export type PassiveEnergyReadinessReport = {
  readonly protocolSetId: typeof PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID;
  readonly phase: typeof PASSIVE_ENERGY_PHASE4C_PHASE;
  readonly claimBoundary: typeof PASSIVE_ENERGY_PHASE4C_CLAIM_BOUNDARY;
  readonly readinessStatus: PassiveEnergyReadinessStatus;
  readonly ownerAcceptanceStatus: "not-owner-acceptance";
  readonly decision5Status: "PENDING OWNER";
  readonly decision6Status: "PENDING OWNER";
  readonly decision8Status: "PENDING OWNER";
  readonly passiveCandidateStatus: typeof PASSIVE_ENERGY_PHASE4C_CANDIDATE_STATUS;
  readonly productionPassiveLaw: "not-claimed";
  readonly passiveCandidate: {
    readonly modelId: typeof PASSIVE_EXPONENTIAL_ENERGY_V1_ID;
    readonly parameterSetId: typeof PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID;
    readonly params: PassiveExponentialEnergyV1Params;
    readonly descriptorParams: PassiveExponentialEnergyV1Params;
    readonly descriptorMatchesRuntimeParams: boolean;
    readonly claim: "candidate-fixture-only";
  };
  readonly passivePhysics: {
    readonly derivativeTangent: DerivativeTangentSummary;
    readonly convexity: ConvexitySummary;
    readonly hingeContinuity: HingeContinuitySummary;
    readonly slackCompression: SlackCompressionSummary;
    readonly viscousDissipation: ViscousDissipationSummary;
  };
  readonly priorGateEvidence: {
    readonly phase3BClosurePass: boolean;
    readonly phase3BStableSummaryHash: string;
    readonly phase4BAReadinessPass: boolean;
    readonly phase4BAStableSummaryHash: string;
    readonly phase4BBReadinessPass: boolean;
    readonly phase4BBStableSummaryHash: string;
  };
  readonly claimExclusions: {
    readonly productionPassiveLaw: "not-claimed";
    readonly officialMorphologyOutcome: "not-claimed";
    readonly liveRuntimeReplacement: "not-claimed";
    readonly multiCoordinateGeneralizedForceMapper: "not-claimed";
    readonly RVPressureOverloadCoverage: "not-claimed";
    readonly ventricularInterdependenceCoverage: "not-claimed";
    readonly rightHeartFailureCoverage: "not-claimed";
  };
  readonly futureTriSegPath: {
    readonly trisegLiteCandidateId: "triseg-lite-compatible";
    readonly fullTrisegCompatibleCandidateId: "full-triseg-compatible";
    readonly fullTriSegPath: string;
  };
  readonly requiredVerificationScripts: readonly string[];
  readonly sections: readonly PassiveEnergyReadinessSection[];
  readonly readinessPass: boolean;
  readonly stableSummaryHash: string;
};

export type DerivativeTangentSample = {
  readonly strain: number;
  readonly analyticStressPa: number;
  readonly finiteDifferenceStressPa: number;
  readonly stressErrorPa: number;
  readonly analyticTangentPa: number;
  readonly finiteDifferenceTangentPa: number;
  readonly tangentErrorPa: number;
};

export type DerivativeTangentSummary = {
  readonly samples: readonly DerivativeTangentSample[];
  readonly maxStressErrorPa: number;
  readonly maxTangentErrorPa: number;
  readonly stressTolerancePa: number;
  readonly tangentTolerancePa: number;
  readonly pass: boolean;
};

export type ConvexitySummary = {
  readonly strains: readonly number[];
  readonly minimumEnergyDensityJPerM3: number;
  readonly minimumStressPa: number;
  readonly minimumTangentPa: number;
  readonly compressionCovered: boolean;
  readonly nearHingeCovered: boolean;
  readonly highExtensionCovered: boolean;
  readonly pass: boolean;
};

export type HingeContinuitySummary = {
  readonly slackValueJump: number;
  readonly slackDerivativeJump: number;
  readonly widthValueJump: number;
  readonly widthDerivativeJump: number;
  readonly tolerance: number;
  readonly pass: boolean;
};

export type SlackCompressionSummary = {
  readonly compressionEnergyDensityJPerM3: number;
  readonly compressionStressPa: number;
  readonly compressionTangentPa: number;
  readonly slackEnergyDensityJPerM3: number;
  readonly slackStressPa: number;
  readonly slackTangentPa: number;
  readonly pass: boolean;
};

export type ViscousDissipationSummary = {
  readonly ratesPerSec: readonly number[];
  readonly viscousStressPa: readonly number[];
  readonly dissipationDensityWPerM3: readonly number[];
  readonly minimumDissipationDensityWPerM3: number;
  readonly pass: boolean;
};

const REQUIRED_DESCRIPTOR_SOURCE_PATHS = [
  "docs/myocardium/adr/ADR-MYO-001.md",
  "docs/myocardium/model-spec/myocardium-land-v1.md",
  "docs/myocardium/verification/myocardium-v1-verification.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
  "data/myocardium/protocols/identity-force-phase3b-protocols.json",
  "data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json",
  "data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json",
] as const;

export function runPassiveEnergyReadinessReport(): PassiveEnergyReadinessReport {
  const derivativeTangent = derivativeTangentSummary();
  const convexity = convexitySummary();
  const hingeContinuity = hingeContinuitySummary();
  const slackCompression = slackCompressionSummary();
  const viscousDissipation = viscousDissipationSummary();
  const phase3BReport = runIdentityForcePhase3BReport();
  const phase4BAReport = runLandActiveStressReplacementReadinessReport();
  const phase4BBReport = runTissueHomogenizationReadinessReport();

  const sections = [
    sourceDecisionBoundarySection(phase3BReport.closurePass, phase4BAReport.readinessPass, phase4BBReport.readinessPass),
    derivativeTangentSection(derivativeTangent),
    convexitySection(convexity),
    hingeContinuitySection(hingeContinuity),
    slackCompressionSection(slackCompression),
    viscousDissipationSection(viscousDissipation),
    legacyPressureFloorExclusionSection(),
    priorGateReadOnlySection(phase3BReport.closurePass, phase4BAReport.readinessPass, phase4BBReport.readinessPass),
    deterministicReplaySection(),
  ] as const;
  const readinessPass = sections.every((section) => section.status === "readiness-pass");
  const descriptorParams = descriptorPassiveParams();
  const reportWithoutHash = {
    protocolSetId: PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID,
    phase: PASSIVE_ENERGY_PHASE4C_PHASE,
    claimBoundary: PASSIVE_ENERGY_PHASE4C_CLAIM_BOUNDARY,
    readinessStatus: readinessPass ? "readiness-candidate-ready" : "readiness-candidate-review",
    ownerAcceptanceStatus: "not-owner-acceptance",
    decision5Status: "PENDING OWNER",
    decision6Status: "PENDING OWNER",
    decision8Status: "PENDING OWNER",
    passiveCandidateStatus: PASSIVE_ENERGY_PHASE4C_CANDIDATE_STATUS,
    productionPassiveLaw: "not-claimed",
    passiveCandidate: {
      modelId: PASSIVE_EXPONENTIAL_ENERGY_V1_ID,
      parameterSetId: PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID,
      params: PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS,
      descriptorParams,
      descriptorMatchesRuntimeParams: passiveParamsEqual(
        descriptorParams,
        PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS,
      ),
      claim: "candidate-fixture-only",
    },
    passivePhysics: {
      derivativeTangent,
      convexity,
      hingeContinuity,
      slackCompression,
      viscousDissipation,
    },
    priorGateEvidence: {
      phase3BClosurePass: phase3BReport.closurePass,
      phase3BStableSummaryHash: phase3BReport.stableSummaryHash,
      phase4BAReadinessPass: phase4BAReport.readinessPass,
      phase4BAStableSummaryHash: phase4BAReport.stableSummaryHash,
      phase4BBReadinessPass: phase4BBReport.readinessPass,
      phase4BBStableSummaryHash: phase4BBReport.stableSummaryHash,
    },
    claimExclusions: reportClaimExclusions(),
    futureTriSegPath: reportFutureTriSegPath(),
    requiredVerificationScripts: [...protocolDescriptor.requiredVerificationScripts],
    sections: sections.map((section) => ({
      id: section.id,
      status: section.status,
      metrics: section.metrics,
    })),
    readinessPass,
  };

  return {
    ...reportWithoutHash,
    stableSummaryHash: stableHash(sanitizeForStableHash(reportWithoutHash)),
  } as PassiveEnergyReadinessReport;
}

function sourceDecisionBoundarySection(
  phase3BClosurePass: boolean,
  phase4BAReadinessPass: boolean,
  phase4BBReadinessPass: boolean,
): PassiveEnergyReadinessSection {
  const sourcePaths = protocolDescriptor.sourceDocuments.map((source) => source.path);
  const sourceRefsComplete = REQUIRED_DESCRIPTOR_SOURCE_PATHS.every((sourcePath) =>
    sourcePaths.includes(sourcePath),
  );
  const decisions = protocolDescriptor.pendingOwnerDecisions;
  const decision5 = decisions.find((decision) => decision.decisionId === 5);
  const decision6 = decisions.find((decision) => decision.decisionId === 6);
  const decision8 = decisions.find((decision) => decision.decisionId === 8);
  const ok =
    protocolDescriptor.protocolSetId === PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID
    && protocolDescriptor.phase === PASSIVE_ENERGY_PHASE4C_PHASE
    && protocolDescriptor.claimBoundary === PASSIVE_ENERGY_PHASE4C_CLAIM_BOUNDARY
    && protocolDescriptor.ownerAcceptanceStatus === "not-owner-acceptance"
    && protocolDescriptor.decision5Status === "PENDING OWNER"
    && protocolDescriptor.decision6Status === "PENDING OWNER"
    && protocolDescriptor.decision8Status === "PENDING OWNER"
    && protocolDescriptor.passiveCandidateStatus === PASSIVE_ENERGY_PHASE4C_CANDIDATE_STATUS
    && decision5?.status === "PENDING OWNER"
    && decision6?.status === "PENDING OWNER"
    && decision8?.status === "PENDING OWNER"
    && sourceRefsComplete
    && phase3BClosurePass
    && phase4BAReadinessPass
    && phase4BBReadinessPass;
  return section("source-decision-boundary-v1", ok, {
    phase: protocolDescriptor.phase,
    claimBoundary: protocolDescriptor.claimBoundary,
    ownerAcceptanceStatus: protocolDescriptor.ownerAcceptanceStatus,
    decision5Status: protocolDescriptor.decision5Status,
    decision6Status: protocolDescriptor.decision6Status,
    decision8Status: protocolDescriptor.decision8Status,
    passiveCandidateStatus: protocolDescriptor.passiveCandidateStatus,
    sourceRefsComplete,
    phase3BClosurePass,
    phase4BAReadinessPass,
    phase4BBReadinessPass,
  });
}

function derivativeTangentSummary(): DerivativeTangentSummary {
  const params = PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS;
  const strains = [
    params.slackStrain - 0.02,
    params.slackStrain + 0.5 * params.smoothWidthStrain,
    params.slackStrain + params.smoothWidthStrain + 0.04,
  ];
  const h = 1e-6;
  const samples = strains.map((strain) => {
    const output = evaluatePassiveExponentialEnergyV1({
      fiberEngineeringStrain: strain,
      fiberEngineeringStrainRatePerSec: 0,
    });
    const energyPlus = passiveEnergyAt(strain + h);
    const energyMinus = passiveEnergyAt(strain - h);
    const finiteDifferenceStressPa = (energyPlus - energyMinus) / (2 * h);
    const stressPlus = passiveStressAt(strain + h);
    const stressMinus = passiveStressAt(strain - h);
    const finiteDifferenceTangentPa = (stressPlus - stressMinus) / (2 * h);
    return {
      strain,
      analyticStressPa: output.passiveNominalStressPa,
      finiteDifferenceStressPa,
      stressErrorPa: Math.abs(output.passiveNominalStressPa - finiteDifferenceStressPa),
      analyticTangentPa: output.dPassiveStressDStrainPa,
      finiteDifferenceTangentPa,
      tangentErrorPa: Math.abs(output.dPassiveStressDStrainPa - finiteDifferenceTangentPa),
    };
  });
  const maxStressErrorPa = Math.max(...samples.map((sample) => sample.stressErrorPa));
  const maxTangentErrorPa = Math.max(...samples.map((sample) => sample.tangentErrorPa));
  const stressTolerancePa = 5e-3;
  const tangentTolerancePa = 5;
  return {
    samples,
    maxStressErrorPa,
    maxTangentErrorPa,
    stressTolerancePa,
    tangentTolerancePa,
    pass: maxStressErrorPa <= stressTolerancePa && maxTangentErrorPa <= tangentTolerancePa,
  };
}

function derivativeTangentSection(summary: DerivativeTangentSummary): PassiveEnergyReadinessSection {
  return section("passive-derivative-tangent-fd-smoke-v1", summary.pass, summary);
}

function convexitySummary(): ConvexitySummary {
  const params = PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS;
  const strains = [
    params.slackStrain - 0.06,
    params.slackStrain - 0.005,
    params.slackStrain,
    params.slackStrain + 0.25 * params.smoothWidthStrain,
    params.slackStrain + 0.75 * params.smoothWidthStrain,
    params.slackStrain + params.smoothWidthStrain + 0.08,
  ];
  const outputs = strains.map((strain) =>
    evaluatePassiveExponentialEnergyV1({
      fiberEngineeringStrain: strain,
      fiberEngineeringStrainRatePerSec: 0,
    })
  );
  const minimumEnergyDensityJPerM3 = Math.min(...outputs.map((output) => output.storedEnergyDensityJPerM3));
  const minimumStressPa = Math.min(...outputs.map((output) => output.passiveNominalStressPa));
  const minimumTangentPa = Math.min(...outputs.map((output) => output.dPassiveStressDStrainPa));
  const compressionCovered = strains.some((strain) => strain < params.slackStrain);
  const nearHingeCovered = strains.some(
    (strain) => strain > params.slackStrain && strain < params.slackStrain + params.smoothWidthStrain,
  );
  const highExtensionCovered = strains.some((strain) => strain > params.slackStrain + params.smoothWidthStrain);
  return {
    strains,
    minimumEnergyDensityJPerM3,
    minimumStressPa,
    minimumTangentPa,
    compressionCovered,
    nearHingeCovered,
    highExtensionCovered,
    pass:
      minimumEnergyDensityJPerM3 >= -1e-12
      && minimumStressPa >= -1e-9
      && minimumTangentPa >= -1e-6
      && compressionCovered
      && nearHingeCovered
      && highExtensionCovered,
  };
}

function convexitySection(summary: ConvexitySummary): PassiveEnergyReadinessSection {
  return section("convexity-sweep-v1", summary.pass, summary);
}

function hingeContinuitySummary(): HingeContinuitySummary {
  const width = PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS.smoothWidthStrain;
  const eps = 1e-7;
  const leftSlack = evaluateSmoothPositiveHingeC2(-eps, width);
  const rightSlack = evaluateSmoothPositiveHingeC2(eps, width);
  const leftWidth = evaluateSmoothPositiveHingeC2(width - eps, width);
  const rightWidth = evaluateSmoothPositiveHingeC2(width + eps, width);
  const slackValueJump = Math.abs(rightSlack.valueStrain - leftSlack.valueStrain);
  const slackDerivativeJump = Math.abs(rightSlack.dValueDStrain - leftSlack.dValueDStrain);
  const widthValueJump = Math.abs(rightWidth.valueStrain - leftWidth.valueStrain);
  const widthDerivativeJump = Math.abs(rightWidth.dValueDStrain - leftWidth.dValueDStrain);
  const tolerance = 1e-4;
  return {
    slackValueJump,
    slackDerivativeJump,
    widthValueJump,
    widthDerivativeJump,
    tolerance,
    pass:
      slackValueJump <= tolerance
      && slackDerivativeJump <= tolerance
      && widthValueJump <= tolerance
      && widthDerivativeJump <= tolerance,
  };
}

function hingeContinuitySection(summary: HingeContinuitySummary): PassiveEnergyReadinessSection {
  return section("c1-hinge-continuity-v1", summary.pass, summary);
}

function slackCompressionSummary(): SlackCompressionSummary {
  const params = PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS;
  const compression = evaluatePassiveExponentialEnergyV1({
    fiberEngineeringStrain: params.slackStrain - 0.04,
    fiberEngineeringStrainRatePerSec: 0,
  });
  const slack = evaluatePassiveExponentialEnergyV1({
    fiberEngineeringStrain: params.slackStrain,
    fiberEngineeringStrainRatePerSec: 0,
  });
  const pass =
    compression.storedEnergyDensityJPerM3 === 0
    && compression.passiveNominalStressPa === 0
    && compression.dPassiveStressDStrainPa === 0
    && slack.storedEnergyDensityJPerM3 === 0
    && slack.passiveNominalStressPa === 0
    && slack.dPassiveStressDStrainPa === 0;
  return {
    compressionEnergyDensityJPerM3: compression.storedEnergyDensityJPerM3,
    compressionStressPa: compression.passiveNominalStressPa,
    compressionTangentPa: compression.dPassiveStressDStrainPa,
    slackEnergyDensityJPerM3: slack.storedEnergyDensityJPerM3,
    slackStressPa: slack.passiveNominalStressPa,
    slackTangentPa: slack.dPassiveStressDStrainPa,
    pass,
  };
}

function slackCompressionSection(summary: SlackCompressionSummary): PassiveEnergyReadinessSection {
  return section("slack-compression-behavior-v1", summary.pass, summary);
}

function viscousDissipationSummary(): ViscousDissipationSummary {
  const ratesPerSec = [-1.2, -0.05, 0, 0.07, 1.5] as const;
  const outputs = ratesPerSec.map((rate) =>
    evaluatePassiveExponentialEnergyV1({
      fiberEngineeringStrain: PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS.slackStrain + 0.08,
      fiberEngineeringStrainRatePerSec: rate,
    })
  );
  const viscousStressPa = outputs.map((output) => output.viscousNominalStressPa);
  const dissipationDensityWPerM3 = outputs.map((output) => output.dissipationDensityWPerM3);
  const minimumDissipationDensityWPerM3 = Math.min(...dissipationDensityWPerM3);
  return {
    ratesPerSec,
    viscousStressPa,
    dissipationDensityWPerM3,
    minimumDissipationDensityWPerM3,
    pass: minimumDissipationDensityWPerM3 >= -1e-12,
  };
}

function viscousDissipationSection(summary: ViscousDissipationSummary): PassiveEnergyReadinessSection {
  return section("viscous-dissipation-sign-v1", summary.pass, summary);
}

function legacyPressureFloorExclusionSection(): PassiveEnergyReadinessSection {
  const descriptorText = deepText(protocolDescriptor);
  const settings = protocolDescriptor.protocolSettings;
  const ok =
    settings.usePressureFloor === false
    && settings.useStressClamp === false
    && !/(sigmaPas0|bPas|lambdaPas0)/.test(descriptorText)
    && /pressure-floor and stress-clamp behavior is absent/i.test(descriptorText)
    && /not-used-as-free-waveform-filter/i.test(descriptorText);
  return section("legacy-pressure-floor-exclusion-v1", ok, {
    usePressureFloor: settings.usePressureFloor,
    useStressClamp: settings.useStressClamp,
    legacyParameterNamesAbsent: !/(sigmaPas0|bPas|lambdaPas0)/.test(descriptorText),
    waveformFilterStatus: protocolDescriptor.passiveCandidate.viscousDashpot.waveformFilterStatus,
  });
}

function priorGateReadOnlySection(
  phase3BClosurePass: boolean,
  phase4BAReadinessPass: boolean,
  phase4BBReadinessPass: boolean,
): PassiveEnergyReadinessSection {
  const ok =
    protocolDescriptor.protocolSettings.phase3BReusePolicy === "read-only"
    && protocolDescriptor.protocolSettings.phase4BAReusePolicy === "read-only"
    && protocolDescriptor.protocolSettings.phase4BBReusePolicy === "read-only"
    && phase3BClosurePass
    && phase4BAReadinessPass
    && phase4BBReadinessPass;
  return section("prior-gate-read-only-evidence-v1", ok, {
    phase3BReusePolicy: protocolDescriptor.protocolSettings.phase3BReusePolicy,
    phase4BAReusePolicy: protocolDescriptor.protocolSettings.phase4BAReusePolicy,
    phase4BBReusePolicy: protocolDescriptor.protocolSettings.phase4BBReusePolicy,
    phase3BClosurePass,
    phase4BAReadinessPass,
    phase4BBReadinessPass,
  });
}

function deterministicReplaySection(): PassiveEnergyReadinessSection {
  const firstHash = stableHash(sanitizeForStableHash(buildReplayPayload()));
  const secondHash = stableHash(sanitizeForStableHash(buildReplayPayload()));
  return section("deterministic-replay-v1", firstHash === secondHash, {
    firstHash,
    secondHash,
    deterministic: firstHash === secondHash,
  });
}

function buildReplayPayload(): unknown {
  return {
    passiveParams: PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS,
    derivativeTangent: derivativeTangentSummary(),
    convexity: convexitySummary(),
    hingeContinuity: hingeContinuitySummary(),
    slackCompression: slackCompressionSummary(),
    viscousDissipation: viscousDissipationSummary(),
  };
}

function passiveEnergyAt(strain: number): number {
  return evaluatePassiveExponentialEnergyV1({
    fiberEngineeringStrain: strain,
    fiberEngineeringStrainRatePerSec: 0,
  }).storedEnergyDensityJPerM3;
}

function passiveStressAt(strain: number): number {
  return evaluatePassiveExponentialEnergyV1({
    fiberEngineeringStrain: strain,
    fiberEngineeringStrainRatePerSec: 0,
  }).passiveNominalStressPa;
}

function descriptorPassiveParams(): PassiveExponentialEnergyV1Params {
  const params = protocolDescriptor.passiveCandidate.parameters;
  return {
    APa: params.APa,
    B: params.B,
    slackStrain: params.slackStrain,
    smoothWidthStrain: params.smoothWidthStrain,
    etaFPaSec: params.etaFPaSec,
  };
}

function passiveParamsEqual(
  left: PassiveExponentialEnergyV1Params,
  right: PassiveExponentialEnergyV1Params,
): boolean {
  return left.APa === right.APa
    && left.B === right.B
    && left.slackStrain === right.slackStrain
    && left.smoothWidthStrain === right.smoothWidthStrain
    && left.etaFPaSec === right.etaFPaSec;
}

function reportClaimExclusions(): PassiveEnergyReadinessReport["claimExclusions"] {
  return {
    productionPassiveLaw: "not-claimed",
    officialMorphologyOutcome: "not-claimed",
    liveRuntimeReplacement: "not-claimed",
    multiCoordinateGeneralizedForceMapper: "not-claimed",
    RVPressureOverloadCoverage: "not-claimed",
    ventricularInterdependenceCoverage: "not-claimed",
    rightHeartFailureCoverage: "not-claimed",
  };
}

function reportFutureTriSegPath(): PassiveEnergyReadinessReport["futureTriSegPath"] {
  return {
    trisegLiteCandidateId: "triseg-lite-compatible",
    fullTrisegCompatibleCandidateId: "full-triseg-compatible",
    fullTriSegPath:
      "A full TriSeg escalation path remains preserved before RV pressure overload, septal bowing, ventricular interdependence, or right-heart failure are claimed as covered primary mechanisms.",
  };
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, unknown>,
): PassiveEnergyReadinessSection {
  return {
    id,
    status: ok ? "readiness-pass" : "readiness-fail",
    metrics,
  };
}

function deepText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((entry) => deepText(entry)).join(" ");
  if (typeof value === "object" && value !== null) {
    return Object.values(value).map((entry) => deepText(entry)).join(" ");
  }
  return "";
}
