import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/passive-energy-phase4c-protocols.json";
import {
  PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID,
  PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS,
  PASSIVE_EXPONENTIAL_ENERGY_V1_ID,
  evaluatePassiveExponentialEnergyV1,
  evaluateSmoothPositiveHingeC2,
} from "@/engine/myocardium/mechanics";
import { runLandActiveStressReplacementReadinessReport } from "@/engine/myocardium/protocols/landActiveStressReplacementReadiness";
import {
  PASSIVE_ENERGY_PHASE4C_CANDIDATE_STATUS,
  PASSIVE_ENERGY_PHASE4C_CLAIM_BOUNDARY,
  PASSIVE_ENERGY_PHASE4C_PHASE,
  PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID,
  runPassiveEnergyReadinessReport,
} from "@/engine/myocardium/protocols/passiveEnergyReadiness";
import {
  loadPassiveEnergyReadinessValidationInput,
  validatePassiveEnergyReadiness,
  type TextFileInput,
} from "@/tools/myocardium/verifyPassiveEnergyReadiness";

describe("myocardium Phase 4C-A passive energy readiness", () => {
  it("passes current candidate artifacts without owner acceptance, production passive law, or runtime wiring", () => {
    const input = fixture();
    const validation = validatePassiveEnergyReadiness(input);
    const report = runPassiveEnergyReadinessReport();
    const serialized = JSON.stringify({ descriptor: protocolDescriptor, report });

    expect(validation.pass).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(protocolDescriptor.protocolSetId).toBe(PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID);
    expect(protocolDescriptor.phase).toBe(PASSIVE_ENERGY_PHASE4C_PHASE);
    expect(protocolDescriptor.claimBoundary).toBe(PASSIVE_ENERGY_PHASE4C_CLAIM_BOUNDARY);
    expect(protocolDescriptor.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(protocolDescriptor.decision5Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.decision6Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.decision8Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.passiveCandidateStatus).toBe(PASSIVE_ENERGY_PHASE4C_CANDIDATE_STATUS);
    expect(report.readinessPass).toBe(true);
    expect(report.sections).toHaveLength(9);
    expect(report.sections.every((section) => section.status === "readiness-pass")).toBe(true);
    expect(report.passiveCandidate.modelId).toBe(PASSIVE_EXPONENTIAL_ENERGY_V1_ID);
    expect(report.passiveCandidate.parameterSetId).toBe(
      PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID,
    );
    expect(report.passiveCandidate.params).toEqual(PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS);
    expect(report.passiveCandidate.descriptorMatchesRuntimeParams).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "caseDoc.ts")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "features/workbench/casePublish.ts")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "engine/previewController.ts")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "engine/steadyJob.ts")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "engine/guytonStarlingChainProtocol.ts")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "engine/transitionSteadyProtocol.ts")).toBe(true);
    expect(serialized).not.toMatch(/\b(?:sigmaPas0|bPas|lambdaPas0)\b/i);
    expect(serialized).not.toMatch(/\bdefault\b[^.]{0,120}(?:passive|candidate|energy|law)/i);
  });

  it("derives passive stress from energy and tangent from passive-stress derivative", () => {
    const report = runPassiveEnergyReadinessReport();
    const derivative = report.passivePhysics.derivativeTangent;
    const highExtension = evaluatePassiveExponentialEnergyV1({
      fiberEngineeringStrain:
        PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS.slackStrain
        + PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS.smoothWidthStrain
        + 0.05,
      fiberEngineeringStrainRatePerSec: 0,
    });

    expect(derivative.pass).toBe(true);
    expect(derivative.maxStressErrorPa).toBeLessThanOrEqual(derivative.stressTolerancePa);
    expect(derivative.maxTangentErrorPa).toBeLessThanOrEqual(derivative.tangentTolerancePa);
    expect(highExtension.passiveStressDerivativeSource).toBe("energy-derivative");
    expect(highExtension.tangentDerivativeSource).toBe("passive-stress-derivative");
    expect(highExtension.storedEnergyDensityJPerM3).toBeGreaterThan(0);
    expect(highExtension.passiveNominalStressPa).toBeGreaterThan(0);
    expect(highExtension.dPassiveStressDStrainPa).toBeGreaterThan(0);
  });

  it("keeps the convex exponential candidate nonnegative across compression, near-hinge, and high-extension samples", () => {
    const convexity = runPassiveEnergyReadinessReport().passivePhysics.convexity;

    expect(convexity.pass).toBe(true);
    expect(convexity.minimumEnergyDensityJPerM3).toBeGreaterThanOrEqual(-1e-12);
    expect(convexity.minimumStressPa).toBeGreaterThanOrEqual(-1e-9);
    expect(convexity.minimumTangentPa).toBeGreaterThanOrEqual(-1e-6);
    expect(convexity.compressionCovered).toBe(true);
    expect(convexity.nearHingeCovered).toBe(true);
    expect(convexity.highExtensionCovered).toBe(true);
  });

  it("defines slack/compression behavior and C1 hinge continuity without a pressure floor", () => {
    const report = runPassiveEnergyReadinessReport();
    const compression = report.passivePhysics.slackCompression;
    const hinge = report.passivePhysics.hingeContinuity;
    const width = PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS.smoothWidthStrain;
    const belowSlack = evaluateSmoothPositiveHingeC2(-1e-4, width);

    expect(compression.pass).toBe(true);
    expect(compression.compressionEnergyDensityJPerM3).toBe(0);
    expect(compression.compressionStressPa).toBe(0);
    expect(compression.compressionTangentPa).toBe(0);
    expect(hinge.pass).toBe(true);
    expect(hinge.slackDerivativeJump).toBeLessThanOrEqual(hinge.tolerance);
    expect(hinge.widthDerivativeJump).toBeLessThanOrEqual(hinge.tolerance);
    expect(belowSlack.valueStrain).toBe(0);
    expect(belowSlack.dValueDStrain).toBe(0);
  });

  it("keeps viscous dashpot dissipation nonnegative for positive and negative strain rates", () => {
    const viscous = runPassiveEnergyReadinessReport().passivePhysics.viscousDissipation;

    expect(viscous.pass).toBe(true);
    expect(viscous.minimumDissipationDensityWPerM3).toBeGreaterThanOrEqual(0);
    expect(viscous.ratesPerSec.some((rate) => rate < 0)).toBe(true);
    expect(viscous.ratesPerSec.some((rate) => rate > 0)).toBe(true);
    expect(viscous.viscousStressPa[0]).toBeLessThan(0);
    expect(viscous.viscousStressPa.at(-1)).toBeGreaterThan(0);
  });

  it("fails legacy passive parameter names and pressure-floor or stress-clamp additions in candidate artifacts", () => {
    const input = fixture();
    input.candidateFiles = input.candidateFiles.map((file) =>
      file.path.endsWith("passiveExponentialEnergyV1.ts")
        ? {
          ...file,
          text: `${file.text}\nconst sigmaPas0 = 1;\nconst pressureFloor = true;\n`,
        }
        : file
    );

    const validation = validatePassiveEnergyReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4c_candidate_legacy_params")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4c_candidate_pressure_floor")).toBe(true);
  });

  it("fails default wording, Decision 5/6/8 acceptance, and production passive-law overclaims", () => {
    const input = fixture();
    input.descriptor.passiveCandidate.candidateLabel = "default passive law";
    input.descriptor.ownerAcceptanceStatus = "final-owner-acceptance";
    input.descriptor.decision5Status = "ACCEPTED";
    input.descriptor.decision6Status = "ACCEPTED";
    input.descriptor.decision8Status = "ACCEPTED";
    input.descriptor.claimExclusions.productionPassiveLaw = "claimed";
    input.report.productionPassiveLaw = "accepted";
    input.report.ownerAcceptanceStatus = "final-owner-acceptance";
    input.report.decision6Status = "ACCEPTED";

    const validation = validatePassiveEnergyReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4c_forbidden_claim")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4c_decision_boundary")).toBe(true);
  });

  it("fails passive candidate identifiers or production flags leaking into runtime and official-case targets", () => {
    const input = fixture();
    input.runtimeIntegrationFiles = [
      {
        path: "caseDoc.ts",
        text:
          '{"useProductionPassiveLaw": true, "enablePassiveExponentialInRuntime": true, '
          + '"liveRuntimeReplacement": true}',
      },
      {
        path: "engine/previewController.ts",
        text:
          "import { evaluatePassiveExponentialEnergyV1 } from '@/engine/myocardium/mechanics';\n"
          + "const protocol = 'passive-energy-phase4c-protocols-v1';\n"
          + "const model = 'passive-exponential-energy-v1';\n"
          + "evaluatePassiveExponentialEnergyV1(input);",
      },
    ];

    const validation = validatePassiveEnergyReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4c_runtime_leak")).toBe(true);
  });

  it("fails RV/interdependence positive coverage overclaims even when the mechanism names are present", () => {
    const input = fixture();
    input.descriptor.nonCoverage = [
      "RV pressure overload is covered by this Phase 4C-A gate.",
      "Septal bowing is covered by this Phase 4C-A gate.",
      "Ventricular interdependence is claimed by this Phase 4C-A gate.",
      "Right-heart failure is validated by this Phase 4C-A gate.",
    ];
    input.docs = input.docs.map((file) => ({
      ...file,
      text: `${file.text}\nRV pressure overload is covered by this Phase 4C-A gate.`,
    }));

    const validation = validatePassiveEnergyReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4c_coverage_overclaim")).toBe(true);
  });

  it("fails missing source provenance or pending owner-decision records", () => {
    const input = fixture();
    input.descriptor.sourceDocuments = input.descriptor.sourceDocuments.filter(
      (source: { path?: string }) =>
        source.path !== "docs/myocardium/adr/ADR-MYO-001.md"
        && source.path !== "data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json",
    );
    input.descriptor.pendingOwnerDecisions = input.descriptor.pendingOwnerDecisions.filter(
      (decision: { decisionId?: number }) => decision.decisionId !== 6,
    );

    const validation = validatePassiveEnergyReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4c_direct_provenance")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4c_decision_boundary")).toBe(true);
  });

  it("fails missing RV/interdependence noncoverage or future TriSeg path", () => {
    const input = fixture();
    delete input.descriptor.futureTriSegPath;
    input.descriptor.nonCoverage = [];
    input.descriptor.claimExclusions.RVPressureOverloadCoverage = "claimed";
    input.descriptor.claimExclusions.septalBowingCoverage = "claimed";
    input.descriptor.claimExclusions.ventricularInterdependenceCoverage = "claimed";
    input.descriptor.claimExclusions.rightHeartFailureCoverage = "claimed";
    input.docs = input.docs.map((file) =>
      ({
        ...file,
        text: file.text
          .replace(/RV pressure overload/gi, "RV mechanism")
          .replace(/septal bowing/gi, "septal mechanism")
          .replace(/ventricular interdependence/gi, "interdependence mechanism")
          .replace(/right[- ]heart failure/gi, "right-sided mechanism")
          .replace(/triseg-lite-compatible/gi, "future-lite")
          .replace(/full-triseg-compatible/gi, "future-compatible")
          .replace(/full TriSeg/gi, "future escalation"),
      })
    );

    const validation = validatePassiveEnergyReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4c_non_coverage")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4c_future_triseg_path")).toBe(true);
  });

  it("fails if prior gate evidence is no longer passing and hash-backed", () => {
    const input = fixture();
    input.report.priorGateEvidence.phase3BClosurePass = false;
    input.report.priorGateEvidence.phase4BAReadinessPass = false;
    input.report.priorGateEvidence.phase4BBReadinessPass = false;
    input.report.priorGateEvidence.phase3BStableSummaryHash = "";

    const validation = validatePassiveEnergyReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4c_prior_gate_evidence")).toBe(true);
  });

  it("does not alter the existing Phase 4B-A report output when the passive readiness report runs", () => {
    const before = runLandActiveStressReplacementReadinessReport();
    const beforeText = JSON.stringify(before);
    const passive = runPassiveEnergyReadinessReport();
    const after = runLandActiveStressReplacementReadinessReport();

    expect(JSON.stringify(after)).toBe(beforeText);
    expect(passive.priorGateEvidence.phase4BAReadinessPass).toBe(true);
    expect(passive.priorGateEvidence.phase4BAStableSummaryHash).toBe(before.stableSummaryHash);
    expect(passive.priorGateEvidence.phase4BAStableSummaryHash).toBe(after.stableSummaryHash);
  });
});

type MutableValidationInput = {
  descriptor: Record<string, any>;
  report: any;
  candidateFiles: TextFileInput[];
  runtimeIntegrationFiles: TextFileInput[];
  docs: TextFileInput[];
};

function fixture(): MutableValidationInput {
  const input = loadPassiveEnergyReadinessValidationInput(process.cwd());
  return {
    descriptor: clone(input.descriptor),
    report: clone(input.report),
    candidateFiles: input.candidateFiles.map((file) => ({ ...file })),
    runtimeIntegrationFiles: input.runtimeIntegrationFiles.map((file) => ({ ...file })),
    docs: input.docs.map((file) => ({ ...file })),
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
