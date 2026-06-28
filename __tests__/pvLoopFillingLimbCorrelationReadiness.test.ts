import { describe, expect, it } from "vitest";
import {
  loadFillingLimbCorrelationReadinessValidationInput,
  validateFillingLimbCorrelationReadiness,
  type FillingLimbCorrelationReadinessValidationInput,
} from "@/tools/myocardium/verifyFillingLimbCorrelationReadiness";

const baseValidationInput =
  loadFillingLimbCorrelationReadinessValidationInput(process.cwd());

describe("PV-loop filling-limb correlation readiness boundary", () => {
  it("passes the current docs/data artifacts without runtime, default, official-case, or package-script wiring", () => {
    const input = fixture();
    const validation = validateFillingLimbCorrelationReadiness(input);

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.summary.protocolId).toBe("filling-limb-correlation-readiness-v1");
    expect(input.protocol.runtimeBoundary).toMatchObject({
      implementationStatus: "not-implemented",
      comparatorActivation: "off-by-default",
      defaultRuntimeWiring: "forbidden",
      officialCaseWiring: "forbidden",
      packageScriptWiring: "forbidden",
      modelEquationChange: "forbidden",
      solverBehaviorChange: "forbidden",
      officialCaseParameterChange: "forbidden",
      signalAvailabilityChange: "forbidden",
    });
    expect(input.protocol.claimExclusions).toMatchObject({
      acceptedRootCause: "not-claimed",
      fixAcceptance: "not-claimed",
      officialMorphologyPass: "not-claimed",
      valveQDotFixAccepted: "not-claimed",
      noForbiddenClaims: true,
    });
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "index.tsx")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "WorkbenchPage.tsx")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "controllerItems.ts")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "controllerCatalog.ts")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "workbenchLoad.ts")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "contexts/AuthContext.tsx")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "components/Charts.tsx")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "engine/ModelCore.ts")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => (
      file.path === "tools/myocardium/verifyPvLoopMorphologyQuality.ts"
    ))).toBe(true);
  });

  it("preserves the pinned runner-supported-correlation snapshot as non-acceptance context", () => {
    const snapshot = fixture().protocol.currentEvidenceSnapshot;
    const observations = Object.fromEntries(
      snapshot.observations.map((entry: any) => [entry.id, entry]),
    );
    const hypotheses = Object.fromEntries(
      snapshot.hypotheses.map((entry: any) => [entry.id, entry]),
    );

    expect(snapshot.source).toBe("runner-supported-correlation-baseline");
    expect(snapshot.snapshotRole).toBe("historical-non-acceptance-context");
    expect(snapshot.acceptanceStatus).toBe("non-acceptance-context");
    expect(snapshot.scoringProfile).toMatchObject({
      maxConfidence: "medium",
    });
    expect(snapshot.provenance).toMatchObject({
      baseCommit: "77d7cd7aa2ff4306a9a4841cb6c7d14d0f940251",
      runnerCommand: "npx vite-node tools/myocardium/verifyPvLoopMorphologyQuality.ts --out=artifacts/myocardium/pv-loop-morphology/filling-limb-correlation-baseline-2026-06-28",
      summaryArtifactPath: "artifacts/myocardium/pv-loop-morphology/filling-limb-correlation-baseline-2026-06-28/summary.json",
      summarySha256: "7e570a3116eadd4d51c2a64af9f383a45475c64b2a7c0e1b39997a4a90046338",
    });
    expect(observations["filling-limb-roughness"]).toMatchObject({
      lane: "filling-limb",
      score: 1,
      supportCount: 45,
      metricIds: [
        "lowerLimbKinkCount",
        "tvOpenLowerLimbRoughness",
        "valveOpenCloseChatterCount",
      ],
    });
    expect(observations["event-window-correlation"]).toMatchObject({
      lane: "filling-limb",
      score: 1,
      supportCount: 42,
      metricIds: [
        "eventCorrelationWindowHitFraction",
      ],
      labels: [
        "event-sensitive",
        "event-window-correlation",
      ],
    });
    expect(hypotheses["filling-event-window-correlation"]).toMatchObject({
      lane: "filling-limb",
      evidenceStatus: "supported-correlation",
      confidence: "medium",
      score: 1,
      observationIds: [
        "filling-limb-roughness",
        "event-window-correlation",
      ],
      nextEvidence: [
        "off-by-default valve/qDot diagnostic comparator with unchanged official defaults",
      ],
    });
    expect(hypotheses["rv-filling-valve-chatter-correlation"]).toMatchObject({
      lane: "filling-limb",
      evidenceStatus: "supported-correlation",
      confidence: "medium",
      score: 1,
      observationIds: [
        "filling-limb-roughness",
      ],
      nextEvidence: [
        "check TV marker density",
        "add per-sample dynamic clamp evidence before changing valve dynamics",
      ],
    });
  });

  it("requires off-by-default comparator evidence identity and anti-gaming readouts", () => {
    const requirements = fixture().protocol.futureComparatorRequirements;
    const readoutNames = requirements.antiGamingReadouts.map((entry: any) => entry.name);

    expect(requirements.activation).toMatchObject({
      mode: "off-by-default",
      defaultEnabled: false,
      requiresExplicitDiagnosticInvocation: true,
      noPackageJsonScript: true,
      noOfficialCaseDefaultRuntimeWiring: true,
      noDefaultRuntimeWiring: true,
      noUiProductionWiring: true,
    });
    expect(requirements.evidence).toMatchObject({
      rawBeforeResampled: true,
      comparativeRawVsResampledRequired: true,
      transitionInclusiveAndExcludedRequired: true,
      sameCaseBranchBeatChamberSamplingTransitionPolicyIdentityRequired: true,
      requiredIdentityFields: [
        "caseId",
        "branchId",
        "beatIndex",
        "chamber",
        "samplingMode",
        "transitionPolicy",
      ],
    });
    expect(requirements.candidateFieldPolicy)
      .toMatchObject({ candidateFieldsAloneMustNotPromoteRootCauseOrFixHypotheses: true });
    expect(readoutNames).toEqual(expect.arrayContaining([
      "endDiastolicVolumeM3",
      "strokeVolumeM3",
      "cardiacOutputM3PerSec",
      "meanLeftAtrialPressurePa",
      "meanRightAtrialPressurePa",
      "eaLikeInflowProxy",
      "inletForwardVolumeM3",
      "inletReverseVolumeM3",
      "qDotClampHitFraction",
      "valveDiodeClampHitFraction",
      "dynamicFlowClampHitFraction",
      "pressureFloorHitFraction",
      "atrialKickBoosterPreservation",
    ]));
  });

  it("rejects comparator-specific runtime, default, official-case, and package-script wiring", () => {
    const input = fixture();
    input.runtimeIntegrationFiles = [
      ...input.runtimeIntegrationFiles,
      {
        path: "controllerItems.ts",
        text: "const fillingLimbCorrelationComparator = true;",
      },
      {
        path: "controllerCatalog.ts",
        text: "const wired = 'filling-limb-correlation-readiness-v1';",
      },
      {
        path: "workbenchLoad.ts",
        text: "runFillingLimbCorrelationComparator();",
      },
      {
        path: "engine/ModelCore.ts",
        text: "const fillingLimbCorrelationComparator = true;",
      },
      {
        path: "index.tsx",
        text: "const wired = 'FillingLimbCorrelationComparator';",
      },
      {
        path: "tools/myocardium/verifyPvLoopMorphologyQuality.ts",
        text: "runFillingLimbCorrelationComparator();",
      },
      {
        path: "officialCases.ts",
        text: "case.meta.tags.push('filling-limb-correlation-readiness-v1');",
      },
    ];
    input.packageJsonText = JSON.stringify({
      scripts: {
        "verify:myocardium-filling-limb-correlation-readiness":
          "vite-node tools/myocardium/verifyFillingLimbCorrelationReadiness.ts",
        "verify:unrelated-existing-script": "vite-node tools/myocardium/verifyPhase0.ts",
      },
    });

    const validation = validateFillingLimbCorrelationReadiness(input);
    const codes = validation.errors.map((issue) => issue.code);

    expect(validation.pass).toBe(false);
    expect(codes).toContain("filling_limb_runtime_leak");
    expect(codes).toContain("filling_limb_package_script_leak");
  });

  it("rejects forbidden claims in protocol, doc, and README with sentence-local negation", () => {
    const input = fixture();
    input.protocol.claimExclusions.acceptedRootCause = "accepted";
    input.protocol.claimExclusions.officialMorphologyPass = "accepted";
    input.protocol.purpose = "The root cause is accepted. This is root-cause acceptance.";
    input.docs = input.docs.map((doc) => (
      doc.path.endsWith("filling-limb-correlation-readiness-v1.md")
        ? {
            ...doc,
            text: `${doc.text}\n\nThis boundary is not implementation, but this comparator is production ready. This boundary is not implementation, this comparator is production ready. This boundary is not implementation; this is root-cause acceptance. This is an official morphology pass. This constitutes root cause acceptance.\n`,
          }
        : doc.path.endsWith("README.md")
        ? {
            ...doc,
            text: `${doc.text}\n\nThe fix is accepted. This is fix acceptance. Current correlations are historical non-acceptance context only; this is fix acceptance. This is not a runtime change: this comparator is official-case ready. This boundary is not diagnostic-only, but this is root-cause acceptance. The comparator is official-case ready.\n`,
          }
        : doc
    ));

    const validation = validateFillingLimbCorrelationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.map((issue) => issue.code))
      .toContain("filling_limb_forbidden_claim");
  });

  it("rejects clause-separated positive claims after unrelated local negation", () => {
    for (const forbiddenText of [
      "This boundary is not implementation, this comparator is production ready.",
      "This boundary is not implementation; this is root-cause acceptance.",
      "Current correlations are historical non-acceptance context only; this is fix acceptance.",
      "This is not a runtime change: this comparator is official-case ready.",
      "This boundary is not implementation and this comparator is production ready.",
      "This boundary is not implementation while this comparator is production ready.",
      "This boundary is not implementation whereas this comparator is production ready.",
      "Although this boundary is not implementation this comparator is production ready.",
      "This boundary is not implementation (this comparator is production ready).",
      "This is not implementation / this comparator is production ready.",
      "This comparator is production ready, but root-cause acceptance is not claimed.",
      "This comparator is runtime ready and fix acceptance remains not claimed.",
      "This is root-cause acceptance; official morphology pass is not claimed.",
      "This comparator is official-case ready whereas fix acceptance is not claimed.",
      "This comparator is production ready / root-cause acceptance is not claimed.",
    ]) {
      const input = fixture();
      input.docs = input.docs.map((doc) => (
        doc.path.endsWith("filling-limb-correlation-readiness-v1.md")
          ? {
              ...doc,
              text: `${doc.text}\n\n${forbiddenText}\n`,
            }
          : doc
      ));

      const validation = validateFillingLimbCorrelationReadiness(input);

      expect(validation.pass).toBe(false);
      expect(validation.errors.map((issue) => issue.code))
        .toContain("filling_limb_forbidden_claim");
    }
  });

  it("allows claim-local negation and not-claimed suffixes", () => {
    const input = fixture();
    input.docs = input.docs.map((doc) => (
      doc.path.endsWith("filling-limb-correlation-readiness-v1.md")
        ? {
            ...doc,
            text: `${doc.text}\n\nThis is not root-cause acceptance. Root-cause acceptance is not claimed. Fix acceptance remains not claimed.\n`,
          }
        : doc
    ));

    const validation = validateFillingLimbCorrelationReadiness(input);

    expect(validation.pass).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it("rejects missing snapshot provenance and supported-correlation evidence", () => {
    const input = fixture();
    input.protocol.currentEvidenceSnapshot.provenance.summarySha256 = "missing";
    input.protocol.currentEvidenceSnapshot.scoringProfile.maxConfidence = "high";
    input.protocol.currentEvidenceSnapshot.observations =
      input.protocol.currentEvidenceSnapshot.observations.filter((entry: any) => (
        entry.id !== "filling-limb-roughness"
      ));
    input.protocol.currentEvidenceSnapshot.hypotheses["0"].confidence = "high";
    input.protocol.currentEvidenceSnapshot.hypotheses["0"].nextEvidence = [];
    input.protocol.currentEvidenceSnapshot.summaryInterpretation =
      "This accepts the filling-limb root cause.";

    const validation = validateFillingLimbCorrelationReadiness(input);
    const codes = validation.errors.map((issue) => issue.code);

    expect(validation.pass).toBe(false);
    expect(codes).toContain("filling_limb_evidence_snapshot");
    expect(codes).toContain("filling_limb_correlation_evidence");
  });

  it("rejects off-by-default, evidence identity, anti-gaming, and candidate-field gaps", () => {
    const input = fixture();
    input.protocol.futureComparatorRequirements.activation.defaultEnabled = true;
    input.protocol.futureComparatorRequirements.activation.noPackageJsonScript = false;
    input.protocol.futureComparatorRequirements.evidence.rawBeforeResampled = false;
    input.protocol.futureComparatorRequirements.evidence.comparativeRawVsResampledRequired = false;
    input.protocol.futureComparatorRequirements.evidence.requiredIdentityFields =
      input.protocol.futureComparatorRequirements.evidence.requiredIdentityFields.filter((field: string) => (
        field !== "samplingMode"
      ));
    input.protocol.futureComparatorRequirements.antiGamingReadouts =
      input.protocol.futureComparatorRequirements.antiGamingReadouts.filter((entry: any) => (
        entry.name !== "pressureFloorHitFraction"
      ));
    input.protocol.futureComparatorRequirements.candidateFieldPolicy
      .candidateFieldsAloneMustNotPromoteRootCauseOrFixHypotheses = false;

    const validation = validateFillingLimbCorrelationReadiness(input);
    const codes = validation.errors.map((issue) => issue.code);

    expect(validation.pass).toBe(false);
    expect(codes).toContain("filling_limb_off_by_default");
    expect(codes).toContain("filling_limb_evidence_requirements");
    expect(codes).toContain("filling_limb_anti_gaming_readouts");
    expect(codes).toContain("filling_limb_candidate_field_boundary");
  });
});

function fixture(): MutableValidationInput {
  return structuredClone(baseValidationInput) as MutableValidationInput;
}

type MutableValidationInput = FillingLimbCorrelationReadinessValidationInput & {
  protocol: any;
  docs: any[];
  runtimeIntegrationFiles: any[];
  packageJsonText: string;
};
