import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import runtimeFlagRfcArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-rfc-v1.json";
import runtimeFlagSuiteArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-suite-result-v1.json";
import phase5XArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import phase5AHArtifact from "@/data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json";
import phase5AIArtifact from "@/data/myocardium/protocols/land-normal-floor-lvedp-attribution-phase5ai-result-v1.json";

export const USER0_LV_LAND_DEFAULT_FLIP_RFC_PHASE5AJ_ID =
  "user0-lv-land-default-flip-rfc-phase5aj-result-v1";

export const USER0_LV_LAND_DEFAULT_FLIP_RFC_PHASE5AJ_RESULT_PATH =
  "data/myocardium/protocols/user0-lv-land-default-flip-rfc-phase5aj-result-v1.json";

const VERIFIER_SCRIPT = "verify:myocardium-user0-lv-land-default-flip-rfc" as const;

type UpstreamEvidence = {
  readonly id: string;
  readonly phase: string;
  readonly path: string;
  readonly stableHash: string;
  readonly role: string;
  readonly keyFacts: readonly string[];
};

export type User0LvLandDefaultFlipRfcPhase5AJEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof USER0_LV_LAND_DEFAULT_FLIP_RFC_PHASE5AJ_ID;
  readonly phase: "Phase 5AJ";
  readonly claimBoundary: "user0-lv-land-default-flip-rfc-owner-decision-needed";
  readonly verifierScript: typeof VERIFIER_SCRIPT;
  readonly upstreamEvidence: readonly UpstreamEvidence[];
  readonly ownerDecision: {
    readonly status: "rfc-draft-owner-decision-needed";
    readonly accepted: false;
    readonly decisionQuestion: string;
    readonly options: readonly string[];
    readonly recommendedPath: "owner-go-user0-staged-default-flip-next-pr";
  };
  readonly rfc: {
    readonly releasePosture: "users0-internal-staged-replacement";
    readonly proposedDefault: "LV Land runtime path";
    readonly legacyActiveStressRole: "frozen-reference-rollback-debug";
    readonly defaultFlipScope: "next-pr-if-owner-go";
    readonly rollbackConditions: readonly string[];
    readonly goCriteria: readonly string[];
    readonly noGoOrDeferCriteria: readonly string[];
  };
  readonly evidenceSummary: {
    readonly developerFlagRfcAccepted: false;
    readonly runtimeFlagSuiteStatus: string;
    readonly phase5XReadinessBeforeAttribution: string;
    readonly landSolveFailureCountPhase5X: number;
    readonly phase5AINormalFloorStatus: string;
    readonly landBaselineLVEDPApprox: number;
    readonly landBaselineLVEDPExcessMmHg: number;
    readonly landBaselineOtherFloorFailures: readonly string[];
    readonly lvedpResolvedDiagnosticRunIds: readonly string[];
    readonly boundaryRootStatus: string;
    readonly defaultFlipRecommendation: "rfc-ready-owner-decision-needed";
  };
  readonly separatedLanes: {
    readonly rootZcAdoption: "separate-blocked";
    readonly atrialFigureEight: "separate-not-lv-default-gate";
    readonly officialCaseTuning: "smoke-only-until-closures-stabilize";
    readonly alternansClosure: "parallel-science-not-product-gate";
    readonly passiveGeometryCalibration: "optional-separate-owner-choice";
  };
  readonly nextImplementationPrIfOwnerGo: {
    readonly include: readonly string[];
    readonly exclude: readonly string[];
    readonly requiredSafetyControls: readonly string[];
  };
  readonly boundary: {
    readonly noRuntimeDefaultFlipInThisPhase: true;
    readonly noLegacyActiveStressDeletion: true;
    readonly noRootZcAdoption: true;
    readonly noAtrialFigureEightGate: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noAcceptedPreloadTuning: true;
    readonly noAcceptedVenousToneTuning: true;
    readonly noAcceptedPassiveTuning: true;
    readonly noAcceptedGeometryTuning: true;
    readonly noAcceptedSourceCalciumScaling: true;
    readonly noTrefFudge: true;
    readonly noLandParameterTuning: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildUser0LvLandDefaultFlipRfcPhase5AJEvidence():
User0LvLandDefaultFlipRfcPhase5AJEvidence {
  const phase5AISummary = phase5AIArtifact.summary;
  const evidenceWithoutHash: Omit<User0LvLandDefaultFlipRfcPhase5AJEvidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: USER0_LV_LAND_DEFAULT_FLIP_RFC_PHASE5AJ_ID,
    phase: "Phase 5AJ",
    claimBoundary: "user0-lv-land-default-flip-rfc-owner-decision-needed",
    verifierScript: VERIFIER_SCRIPT,
    upstreamEvidence: upstreamEvidence(),
    ownerDecision: {
      status: "rfc-draft-owner-decision-needed",
      accepted: false,
      decisionQuestion: "Authorize a user-0 staged LV Land runtime default flip in a separate implementation PR, with legacy active-stress kept as frozen reference and rollback?",
      options: [
        "GO: accept the bounded Phase 5AI LVEDP excess and proceed to a staged default-flip implementation PR",
        "DEFER: require an explicit passive/geometry calibration PR before any default flip",
        "NO-GO: keep LV Land developer-only and continue morphology/operating-point work first",
      ],
      recommendedPath: "owner-go-user0-staged-default-flip-next-pr",
    },
    rfc: {
      releasePosture: "users0-internal-staged-replacement",
      proposedDefault: "LV Land runtime path",
      legacyActiveStressRole: "frozen-reference-rollback-debug",
      defaultFlipScope: "next-pr-if-owner-go",
      rollbackConditions: [
        "normal HR75/90 or preload-envelope solve failure",
        "non-settling or new period instability in the user-0 main domain",
        "severe PV-loop morphology artifact regression relative to current diagnostic baseline",
        "simulation health regression in baseline smoke or official teaching-surface smoke",
        "missing legacy active-stress rollback/reference path after implementation",
      ],
      goCriteria: [
        "Phase 5AI LVEDP excess remains bounded and owner-accepted as an RFC input",
        "legacy active-stress remains available as frozen reference and rollback",
        "root/Zc adoption, atrial figure-eight, and official-case tuning remain separate lanes",
        "no hidden Tref, source-stress, preload, venous-tone, passive, geometry, qDot, or valve tuning is bundled into the default flip",
      ],
      noGoOrDeferCriteria: [
        "owner requires numerical LVEDP correction before default",
        "implementation cannot keep legacy frozen reference/rollback",
        "implementation must bundle root/Zc, atrial, official-case, qDot, valve, or Tref changes to pass",
      ],
    },
    evidenceSummary: {
      developerFlagRfcAccepted: false,
      runtimeFlagSuiteStatus: runtimeFlagSuiteStatus(),
      phase5XReadinessBeforeAttribution: phase5XArtifact.preflight.readiness,
      landSolveFailureCountPhase5X: phase5XArtifact.preflight.landSolveFailureCount,
      phase5AINormalFloorStatus: phase5AISummary.defaultFlipBlockerStatus,
      landBaselineLVEDPApprox: phase5AISummary.landBaselineLVEDPApprox,
      landBaselineLVEDPExcessMmHg: phase5AISummary.landBaselineLVEDPExcessMmHg,
      landBaselineOtherFloorFailures: phase5AISummary.landBaselineOtherFloorFailures,
      lvedpResolvedDiagnosticRunIds: phase5AISummary.lvedpResolvedOutputPreservedRunIds,
      boundaryRootStatus: "Phase 5AH keeps boundary/root evidence diagnostic-only and does not unlock root/Zc adoption or qDot clamp removal.",
      defaultFlipRecommendation: "rfc-ready-owner-decision-needed",
    },
    separatedLanes: {
      rootZcAdoption: "separate-blocked",
      atrialFigureEight: "separate-not-lv-default-gate",
      officialCaseTuning: "smoke-only-until-closures-stabilize",
      alternansClosure: "parallel-science-not-product-gate",
      passiveGeometryCalibration: "optional-separate-owner-choice",
    },
    nextImplementationPrIfOwnerGo: {
      include: [
        "wire LV Land as the staged runtime default path behind explicit rollback/reference controls",
        "keep legacy active-stress selectable for frozen reference, debug, and rollback",
        "add baseline smoke/readback evidence proving the selected default and rollback path",
        "record user-0/no-clinical-validation UI or metadata boundary if a visible surface is touched",
      ],
      exclude: [
        "legacy active-stress deletion",
        "root/Zc or boundary/root inertance production adoption",
        "atrial figure-eight model selection",
        "official case reauthoring or per-case tuning",
        "accepted passive/geometry/source-calcium/preload/venous-tone tuning",
        "Tref, qDot, valve, or source-stress tuning",
        "official morphology, no-alternans, clinical, or scientific validation acceptance",
      ],
      requiredSafetyControls: [
        "one-command rollback to legacy active-stress default",
        "diagnostic artifact or smoke proving Land default and legacy rollback are both reachable",
        "no change to official-case numeric targets beyond smoke/readback metadata",
      ],
    },
    boundary: boundary(),
    doesNotUnlock: doesNotUnlock(),
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runtimeFlagSuiteStatus(): string {
  const health = runtimeFlagSuiteArtifact.runHealth;
  return `Phase 5V helper suite measured ${health.pointCount}/${health.pointCount} points, pointsCapOrNonOk=${health.pointsCapOrNonOk}, landSolveFailureCount=${health.landSolveFailureCount}, mainDomainOutputReproducesPhase5S=${health.mainDomainOutputReproducesPhase5S}.`;
}

function upstreamEvidence(): readonly UpstreamEvidence[] {
  return [
    {
      id: runtimeFlagRfcArtifact.id,
      phase: runtimeFlagRfcArtifact.phase,
      path: "data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-rfc-v1.json",
      stableHash: artifactHash(runtimeFlagRfcArtifact),
      role: "defines developer-only LV Land runtime flag contract",
      keyFacts: [
        "owner decision remained required",
        "no production runtime/case/workbench/schema wiring",
      ],
    },
    {
      id: runtimeFlagSuiteArtifact.id,
      phase: runtimeFlagSuiteArtifact.phase,
      path: "data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-suite-result-v1.json",
      stableHash: artifactHash(runtimeFlagSuiteArtifact),
      role: "measured developer-only runtime flag smoke suite",
      keyFacts: [
        "fixed Phase 5S operating suite reproduced through the helper",
        "production runtime replacement remained blocked",
      ],
    },
    {
      id: phase5XArtifact.id,
      phase: phase5XArtifact.phase,
      path: "data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json",
      stableHash: artifactHash(phase5XArtifact),
      role: "user-knob default-candidate preflight",
      keyFacts: [
        "14/14 preflight points completed",
        "Land solve failure count was zero",
        "normal-floor LVEDP blocker remained before Phase 5AI attribution",
      ],
    },
    {
      id: phase5AHArtifact.id,
      phase: phase5AHArtifact.phase,
      path: "data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json",
      stableHash: artifactHash(phase5AHArtifact),
      role: "discharge-path attribution boundary",
      keyFacts: [
        "Land output was preserved in 15/15 health-ok boundary/root comparisons",
        "root/Zc adoption and qDot clamp removal remained blocked",
      ],
    },
    {
      id: phase5AIArtifact.id,
      phase: phase5AIArtifact.phase,
      path: "data/myocardium/protocols/land-normal-floor-lvedp-attribution-phase5ai-result-v1.json",
      stableHash: artifactHash(phase5AIArtifact),
      role: "normal-floor LVEDP attribution",
      keyFacts: [
        "Land normal-floor LVEDP excess was 1.276729 mmHg",
        "blocker classified bounded-small-lvedp-excess-diagnostic-only",
        "no accepted tuning or runtime default flip",
      ],
    },
  ];
}

function boundary(): User0LvLandDefaultFlipRfcPhase5AJEvidence["boundary"] {
  return {
    noRuntimeDefaultFlipInThisPhase: true,
    noLegacyActiveStressDeletion: true,
    noRootZcAdoption: true,
    noAtrialFigureEightGate: true,
    noOfficialCaseReauthoring: true,
    noWorkbenchRuntimeWiring: true,
    noStateSchemaMigration: true,
    noAcceptedPreloadTuning: true,
    noAcceptedVenousToneTuning: true,
    noAcceptedPassiveTuning: true,
    noAcceptedGeometryTuning: true,
    noAcceptedSourceCalciumScaling: true,
    noTrefFudge: true,
    noLandParameterTuning: true,
    noQDotTuning: true,
    noValveTuning: true,
    noOfficialMorphologyAcceptance: true,
    noFinalNoAlternansAcceptance: true,
    noClinicalScientificValidationClaim: true,
  };
}

function doesNotUnlock(): readonly string[] {
  return [
    "runtimeDefaultFlipImplementation",
    "legacyActiveStressDeletion",
    "rootZcAdoption",
    "atrialFigureEightGate",
    "officialCaseReauthoring",
    "workbenchRuntimeWiring",
    "stateSchemaMigration",
    "acceptedPreloadTuning",
    "acceptedVenousToneTuning",
    "acceptedPassiveTuning",
    "acceptedGeometryTuning",
    "acceptedSourceCalciumScaling",
    "TrefFudge",
    "LandParameterTuning",
    "qDotTuning",
    "valveTuning",
    "officialMorphologyAcceptance",
    "finalNoAlternansAcceptance",
    "clinicalScientificValidationClaim",
  ];
}

function artifactHash(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return hashStable(value);
  const { normalizedSha256: _normalizedSha256, ...withoutHash } = value as Record<string, unknown>;
  return hashStable(withoutHash);
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, stable(object[key])]));
}

function main(): void {
  const evidence = buildUser0LvLandDefaultFlipRfcPhase5AJEvidence();
  const outPath = path.resolve(process.cwd(), USER0_LV_LAND_DEFAULT_FLIP_RFC_PHASE5AJ_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    `Wrote ${USER0_LV_LAND_DEFAULT_FLIP_RFC_PHASE5AJ_RESULT_PATH} `
    + `decision=${evidence.ownerDecision.status} `
    + `recommendation=${evidence.evidenceSummary.defaultFlipRecommendation}`,
  );
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildUser0LvLandDefaultFlipRfcPhase5AJ.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
