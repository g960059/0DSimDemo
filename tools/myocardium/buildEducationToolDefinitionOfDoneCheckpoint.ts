import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5SArtifact from "@/data/myocardium/protocols/modelcore-land-operating-point-calibration-result-v1.json";
import { OFFICIAL_CASES } from "@/officialCases";
import { isCaseDisplayable, type CaseDocument } from "@/caseDoc";

export const MYOCARDIUM_EDUCATION_TOOL_DOD_CHECKPOINT_ID =
  "myocardium-education-tool-dod-checkpoint-v1";

type CriterionStatus = "pass" | "report-only" | "blocked";

type DoDCriterion = {
  readonly id: string;
  readonly status: CriterionStatus;
  readonly evidence: string;
  readonly blocker: string | null;
};

type CaseSurfaceSummary = {
  readonly officialCaseCount: number;
  readonly displayableCaseCount: number;
  readonly expectedFindingsCaseCount: number;
  readonly structuredLimitationsCaseCount: number;
  readonly noteContentCaseCount: number;
  readonly pvLoopPanelCaseCount: number;
  readonly waveformPanelCaseCount: number;
  readonly metricsPanelCaseCount: number;
  readonly controlsPanelCaseCount: number;
  readonly allCasesDisplayable: boolean;
  readonly allCasesHaveExpectedFindings: boolean;
  readonly allCasesHaveCorePanels: boolean;
  readonly modelLimitationsRequiredBySchema: true;
  readonly clinicalCaveatsNativeFieldStatus: "studio-roadmap-required-not-in-case-schema-yet";
  readonly notMedicalAdviceNativeFieldStatus: "studio-roadmap-required-not-in-case-schema-yet";
};

type Phase5SOperatingEnvelopeSummary = {
  readonly upstreamArtifactId: string;
  readonly upstreamClaimBoundary: string;
  readonly operatingPointStatus: string;
  readonly mainDomainStatus: string;
  readonly mainDomainOutputScoreMax: number;
  readonly mainDomainQAoPeakRatioMin: number;
  readonly mainDomainAllPeriod1: boolean;
  readonly lowPreloadEdgeStillReportOnly: boolean;
  readonly landSolveFailureCount: number;
  readonly level3Acceptance: string;
  readonly level4Acceptance: string;
  readonly runtimeReplacement: string;
  readonly finalNoAlternansClaim: string;
  readonly structuralAlternansRemovalClaim: string;
};

export type MyocardiumEducationToolDoDCheckpoint = {
  readonly schemaVersion: 1;
  readonly id: typeof MYOCARDIUM_EDUCATION_TOOL_DOD_CHECKPOINT_ID;
  readonly phase: "Phase 5T";
  readonly claimBoundary: "education-tool-dod-owner-review-checkpoint-not-acceptance";
  readonly upstreamPhase5SArtifactId: string;
  readonly verifierScript: "verify:myocardium-education-tool-dod-checkpoint";
  readonly scope: {
    readonly purpose: "define-education-tool-dod-from-existing-evidence";
    readonly audience: "resident-education-tool";
    readonly notScientificAcceptance: true;
    readonly notClinicalDecisionSupport: true;
  };
  readonly boundary: {
    readonly noRuntimeReplacement: true;
    readonly noOfficialCaseWiring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noLevel3Acceptance: true;
    readonly noLevel4Acceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noStructuralAlternansRemovalClaim: true;
    readonly noQDotValveAfterloadPreloadTuning: true;
    readonly noLandParameterTuning: true;
  };
  readonly phase5SOperatingEnvelope: Phase5SOperatingEnvelopeSummary;
  readonly officialCaseSurfaceSummary: CaseSurfaceSummary;
  readonly requiredStudioSurfaces: readonly {
    readonly id: string;
    readonly status: "specified-not-implemented-by-phase5t";
  }[];
  readonly criteria: readonly DoDCriterion[];
  readonly classification: {
    readonly ownerReviewStatus: "ready";
    readonly accepted: false;
    readonly evidenceMode: "education-tool-report-only";
    readonly officialCaseReauthoring: "required-before-runtime";
    readonly runtimeWiring: "absent";
    readonly caseWiring: "absent";
    readonly workbenchWiring: "absent";
  };
  readonly ownerReview: {
    readonly status: "owner-review-ready-not-accepted" | "blocked";
    readonly satisfiedNow: false;
    readonly acceptanceRequiresOwnerDecision: true;
    readonly decisionQuestion:
      "Is this education-tool DoD sufficient to authorize a developer-only LV Land runtime-flag design RFC?";
  };
  readonly nextImplementationBoundary: {
    readonly recommendedNext:
      "developer-only-lv-land-runtime-flag-design-rfc-before-any-case-or-workbench-wiring";
    readonly allowedNextScope: readonly string[];
    readonly disallowedNextScope: readonly string[];
  };
  readonly doesNotUnlock: readonly string[];
};

export function buildEducationToolDefinitionOfDoneCheckpoint(): MyocardiumEducationToolDoDCheckpoint {
  const phase5SSummary = summarizePhase5SOperatingEnvelope();
  const caseSummary = summarizeOfficialCases(OFFICIAL_CASES);
  const criteria = buildCriteria(phase5SSummary, caseSummary);
  const ownerReviewReady = criteria.every((criterion) => criterion.status !== "blocked");

  return {
    schemaVersion: 1,
    id: MYOCARDIUM_EDUCATION_TOOL_DOD_CHECKPOINT_ID,
    phase: "Phase 5T",
    claimBoundary: "education-tool-dod-owner-review-checkpoint-not-acceptance",
    upstreamPhase5SArtifactId: phase5SSummary.upstreamArtifactId,
    verifierScript: "verify:myocardium-education-tool-dod-checkpoint",
    scope: {
      purpose: "define-education-tool-dod-from-existing-evidence",
      audience: "resident-education-tool",
      notScientificAcceptance: true,
      notClinicalDecisionSupport: true,
    },
    boundary: {
      noRuntimeReplacement: true,
      noOfficialCaseWiring: true,
      noWorkbenchRuntimeWiring: true,
      noLevel3Acceptance: true,
      noLevel4Acceptance: true,
      noOfficialMorphologyAcceptance: true,
      noFinalNoAlternansAcceptance: true,
      noStructuralAlternansRemovalClaim: true,
      noQDotValveAfterloadPreloadTuning: true,
      noLandParameterTuning: true,
    },
    phase5SOperatingEnvelope: phase5SSummary,
    officialCaseSurfaceSummary: caseSummary,
    requiredStudioSurfaces: requiredStudioSurfaces(),
    criteria,
    classification: {
      ownerReviewStatus: "ready",
      accepted: false,
      evidenceMode: "education-tool-report-only",
      officialCaseReauthoring: "required-before-runtime",
      runtimeWiring: "absent",
      caseWiring: "absent",
      workbenchWiring: "absent",
    },
    ownerReview: {
      status: ownerReviewReady ? "owner-review-ready-not-accepted" : "blocked",
      satisfiedNow: false,
      acceptanceRequiresOwnerDecision: true,
      decisionQuestion:
        "Is this education-tool DoD sufficient to authorize a developer-only LV Land runtime-flag design RFC?",
    },
    nextImplementationBoundary: {
      recommendedNext:
        "developer-only-lv-land-runtime-flag-design-rfc-before-any-case-or-workbench-wiring",
      allowedNextScope: [
        "developer-only runtime-flag design RFC",
        "static/mock Studio Workbench scope using existing official cases",
        "model limitation and caveat display requirements",
        "morphology diagnostic lanes kept separate",
      ],
      disallowedNextScope: [
        "production runtime replacement",
        "official case reauthoring against the new myocardium",
        "Workbench runtime wiring",
        "clinical validity or scientific acceptance claims",
        "qDot, valve, afterload, preload, or Land parameter tuning",
      ],
    },
    doesNotUnlock: [
      "runtimeReplacement",
      "officialCaseWiring",
      "workbenchRuntimeWiring",
      "officialMorphologyAcceptance",
      "finalNoAlternans",
      "structuralAlternansRemoval",
      "Level3Acceptance",
      "Level4Acceptance",
      "clinicalDecisionSupport",
      "scientificValidationClaim",
    ],
  };
}

function summarizePhase5SOperatingEnvelope(): Phase5SOperatingEnvelopeSummary {
  const artifact = phase5SArtifact as {
    id: string;
    claimBoundary: string;
    runHealth: { landSolveFailureCount: number };
    levelEvidence: {
      level3_4ClosedLoopOperatingPoint: {
        status: string;
        mainDomainOutputScoreMax: number;
        mainDomainQAoPeakRatioMin: number;
        mainDomainAllPeriod1: boolean;
        lowPreloadEdgeStillReportOnly: boolean;
      };
    };
    analysis: {
      operatingPointStatus: string;
      level3Acceptance: string;
      level4Acceptance: string;
      runtimeReplacement: string;
      finalNoAlternansClaim: string;
      structuralAlternansRemovalClaim: string;
    };
  };
  return {
    upstreamArtifactId: artifact.id,
    upstreamClaimBoundary: artifact.claimBoundary,
    operatingPointStatus: artifact.analysis.operatingPointStatus,
    mainDomainStatus: artifact.levelEvidence.level3_4ClosedLoopOperatingPoint.status,
    mainDomainOutputScoreMax: artifact.levelEvidence.level3_4ClosedLoopOperatingPoint.mainDomainOutputScoreMax,
    mainDomainQAoPeakRatioMin: artifact.levelEvidence.level3_4ClosedLoopOperatingPoint.mainDomainQAoPeakRatioMin,
    mainDomainAllPeriod1: artifact.levelEvidence.level3_4ClosedLoopOperatingPoint.mainDomainAllPeriod1,
    lowPreloadEdgeStillReportOnly:
      artifact.levelEvidence.level3_4ClosedLoopOperatingPoint.lowPreloadEdgeStillReportOnly,
    landSolveFailureCount: artifact.runHealth.landSolveFailureCount,
    level3Acceptance: artifact.analysis.level3Acceptance,
    level4Acceptance: artifact.analysis.level4Acceptance,
    runtimeReplacement: artifact.analysis.runtimeReplacement,
    finalNoAlternansClaim: artifact.analysis.finalNoAlternansClaim,
    structuralAlternansRemovalClaim: artifact.analysis.structuralAlternansRemovalClaim,
  };
}

function summarizeOfficialCases(cases: readonly CaseDocument[]): CaseSurfaceSummary {
  const expectedFindingsCaseCount =
    cases.filter((doc) => (doc.spec.expectedFindings?.length ?? 0) > 0).length;
  const allCasesHaveCorePanels = cases.every((doc) =>
    hasPanelType(doc, "NOTE")
    && hasPanelType(doc, "PVLOOP")
    && hasPanelType(doc, "WAVEFORM")
    && hasPanelType(doc, "METRICS")
    && hasPanelType(doc, "CONTROLS"));
  return {
    officialCaseCount: cases.length,
    displayableCaseCount: cases.filter(isCaseDisplayable).length,
    expectedFindingsCaseCount,
    structuredLimitationsCaseCount:
      cases.filter((doc) => (doc.spec.structuredLimitations?.length ?? 0) > 0).length,
    noteContentCaseCount: cases.filter((doc) => Object.keys(doc.notes ?? {}).length > 0).length,
    pvLoopPanelCaseCount: cases.filter((doc) => hasPanelType(doc, "PVLOOP")).length,
    waveformPanelCaseCount: cases.filter((doc) => hasPanelType(doc, "WAVEFORM")).length,
    metricsPanelCaseCount: cases.filter((doc) => hasPanelType(doc, "METRICS")).length,
    controlsPanelCaseCount: cases.filter((doc) => hasPanelType(doc, "CONTROLS")).length,
    allCasesDisplayable: cases.every(isCaseDisplayable),
    allCasesHaveExpectedFindings: expectedFindingsCaseCount === cases.length,
    allCasesHaveCorePanels,
    modelLimitationsRequiredBySchema: true,
    clinicalCaveatsNativeFieldStatus: "studio-roadmap-required-not-in-case-schema-yet",
    notMedicalAdviceNativeFieldStatus: "studio-roadmap-required-not-in-case-schema-yet",
  };
}

function buildCriteria(
  phase5S: Phase5SOperatingEnvelopeSummary,
  cases: CaseSurfaceSummary,
): readonly DoDCriterion[] {
  return [
    {
      id: "phase5s-main-domain-operating-envelope",
      status:
        phase5S.mainDomainStatus === "main-domain-calibration-signal"
        && phase5S.mainDomainAllPeriod1
        && phase5S.landSolveFailureCount === 0
          ? "pass"
          : "blocked",
      evidence:
        `Phase 5S status=${phase5S.operatingPointStatus}; scoreMax=${phase5S.mainDomainOutputScoreMax}; qAoRatioMin=${phase5S.mainDomainQAoPeakRatioMin}.`,
      blocker: phase5S.landSolveFailureCount === 0 ? null : "Land BE solve failures remain in Phase 5S evidence.",
    },
    {
      id: "low-preload-edge-is-report-only",
      status: phase5S.lowPreloadEdgeStillReportOnly ? "pass" : "blocked",
      evidence: "Low-preload alternans evidence must stay separate from education main-domain readiness.",
      blocker: phase5S.lowPreloadEdgeStillReportOnly ? null : "Low-preload edge was not kept report-only.",
    },
    {
      id: "no-scientific-or-runtime-acceptance",
      status:
        phase5S.level3Acceptance === "not-claimed"
        && phase5S.level4Acceptance === "not-claimed"
        && phase5S.runtimeReplacement === "not-claimed"
        && phase5S.finalNoAlternansClaim === "not-claimed"
        && phase5S.structuralAlternansRemovalClaim === "not-established"
          ? "pass"
          : "blocked",
      evidence: "Upstream Phase 5S leaves Level 3/4, runtime, morphology, and final no-alternans claims blocked.",
      blocker: null,
    },
    {
      id: "official-cases-have-teaching-metadata",
      status:
        cases.officialCaseCount > 0
        && cases.allCasesDisplayable
        && cases.allCasesHaveExpectedFindings
        && cases.allCasesHaveCorePanels
          ? "pass"
          : "blocked",
      evidence:
        `cases=${cases.officialCaseCount}; displayable=${cases.displayableCaseCount}; expectedFindings=${cases.expectedFindingsCaseCount}; corePanels=${cases.allCasesHaveCorePanels}.`,
      blocker: cases.allCasesHaveExpectedFindings ? null : "Some official cases lack structured expectedFindings.",
    },
    {
      id: "studio-safety-fields-are-known-gap",
      status: "report-only",
      evidence:
        "Studio roadmap requires clinicalCaveats and notMedicalAdvice fields, but current CaseSpec only enforces modelLimitations.",
      blocker: "Add native clinicalCaveats/notMedicalAdvice before scientific-facing Studio claims.",
    },
    {
      id: "static-mock-workbench-before-runtime-wiring",
      status: "report-only",
      evidence:
        "Studio roadmap keeps Home + Cases + static/mock Workbench ahead of preview-engine or new myocardium runtime wiring.",
      blocker: "Static/mock Workbench and caveat display remain product-lane work, not a myocardium acceptance gate.",
    },
  ];
}

function requiredStudioSurfaces(): MyocardiumEducationToolDoDCheckpoint["requiredStudioSurfaces"] {
  return [
    "Home",
    "Cases",
    "Case detail",
    "static/mock Workbench",
    "branch comparison",
    "PV loop",
    "waveform",
    "output metrics",
    "synchronized explanatory note",
    "model limitation display",
    "clinical caveat display",
    "simulation health display",
  ].map((id) => ({ id, status: "specified-not-implemented-by-phase5t" as const }));
}

function hasPanelType(doc: CaseDocument, type: string): boolean {
  return doc.panels.some((panel) => panel.type === type);
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath =
    path.normalize("tools/myocardium/buildEducationToolDefinitionOfDoneCheckpoint.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildEducationToolDefinitionOfDoneCheckpoint(), null, 2));
}
