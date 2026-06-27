import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json";
import {
  IDENTITY_FIBER_NOMINAL_V1_ID,
  IDENTITY_FIBER_NOMINAL_V1_PARAMS,
} from "@/engine/myocardium/homogenization";
import { runLandActiveStressReplacementReadinessReport } from "@/engine/myocardium/protocols/landActiveStressReplacementReadiness";
import {
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_ADAPTER_AUDIT_SCOPE,
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY,
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_PHASE,
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID,
  runTissueHomogenizationReadinessReport,
} from "@/engine/myocardium/protocols/tissueHomogenizationReadiness";
import {
  loadTissueHomogenizationReadinessValidationInput,
  validateTissueHomogenizationReadiness,
  type TextFileInput,
  type TissueHomogenizationReadinessValidationInput,
} from "@/tools/myocardium/verifyTissueHomogenizationReadiness";

describe("myocardium Phase 4B-B tissue homogenization readiness", () => {
  it("passes current audit artifacts without runtime replacement or production homogenization claims", () => {
    const input = fixture();
    const validation = validateTissueHomogenizationReadiness(input);
    const report = runTissueHomogenizationReadinessReport();
    const serialized = JSON.stringify({ descriptor: protocolDescriptor, report });

    expect(validation.pass).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(protocolDescriptor.protocolSetId).toBe(LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID);
    expect(protocolDescriptor.phase).toBe(LAND_TISSUE_HOMOGENIZATION_PHASE4B_PHASE);
    expect(protocolDescriptor.claimBoundary).toBe(LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY);
    expect(protocolDescriptor.adapterAuditScope).toBe(
      LAND_TISSUE_HOMOGENIZATION_PHASE4B_ADAPTER_AUDIT_SCOPE,
    );
    expect(protocolDescriptor.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(protocolDescriptor.decision4Status).toBe("PENDING OWNER");
    expect(protocolDescriptor.productionHomogenization).toBe("not-claimed");
    expect(protocolDescriptor.identifiabilityRankStatus).toBe("not-run");
    expect(report.readinessPass).toBe(true);
    expect(report.sections).toHaveLength(7);
    expect(report.sections.every((section) => section.status === "readiness-pass")).toBe(true);
    expect(report.auditedAdapterCandidateId).toBe(IDENTITY_FIBER_NOMINAL_V1_ID);
    expect(report.identityAdapterCandidate.params).toEqual(IDENTITY_FIBER_NOMINAL_V1_PARAMS);
    expect(report.identityAdapterCandidate.descriptorMatchesRuntimeParams).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "caseDoc.ts")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "features/workbench/casePublish.ts")).toBe(true);
    expect(input.runtimeIntegrationFiles.some((file) => file.path === "engine/previewWorker.ts")).toBe(true);
    expect(serialized).not.toMatch(
      /\bproductionHomogenizationCompleted\b|\bofficialMorphologyPass\b|"liveRuntimeReplacement":true|"calciumCyclingAlternansValidation":"(?:validated|accepted|claimed)"/i,
    );
  });

  it("fails when direct Phase 3B or Phase 3C provenance is missing", () => {
    const input = fixture();
    input.descriptor.sourceDocuments = input.descriptor.sourceDocuments.filter(
      (source: { path?: string }) =>
        source.path !== "data/myocardium/protocols/identity-force-phase3b-protocols.json"
        && source.path !== "data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json",
    );

    const validation = validateTissueHomogenizationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_direct_provenance")).toBe(true);
  });

  it("fails free homogenization gain or fitToPVLoop=true", () => {
    const input = fixture();
    input.descriptor.identityAdapterCandidate.parameters.allowFreeGain = true;
    input.descriptor.identityAdapterCandidate.parameters.fitToPVLoop = true;
    input.descriptor.protocolSettings.allowFreeHomogenizationGain = true;
    input.descriptor.protocolSettings.fitToPVLoop = true;
    input.report.identityAdapterCandidate.descriptorParams.allowFreeGain = true;
    input.report.identityAdapterCandidate.descriptorParams.fitToPVLoop = true;
    input.report.identityAdapterCandidate.descriptorMatchesRuntimeParams = false;

    const validation = validateTissueHomogenizationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_identity_params")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_descriptor_boundary")).toBe(true);
  });

  it("fails Decision 4 accepted or final owner acceptance overclaims", () => {
    const input = fixture();
    input.descriptor.ownerAcceptanceStatus = "final-owner-acceptance";
    input.descriptor.decision4Status = "ACCEPTED";
    input.descriptor.pendingOwnerDecisions[0].status = "ACCEPTED";
    input.report.ownerAcceptanceStatus = "final-owner-acceptance";
    input.report.decision4Status = "ACCEPTED";

    const validation = validateTissueHomogenizationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_decision4_boundary")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_forbidden_claim")).toBe(true);
  });

  it("fails production homogenization, official morphology, and live replacement overclaims", () => {
    const input = fixture();
    input.descriptor.artifact.purpose =
      "Production homogenization completed; official morphology pass accepted.";
    input.descriptor.claimExclusions.officialMorphologyOutcome = "claimed";
    input.descriptor.claimExclusions.liveRuntimeReplacement = "claimed";
    input.report.productionHomogenization = "complete";
    input.report.officialMorphologyPass = true;
    input.report.liveRuntimeReplacement = true;

    const validation = validateTissueHomogenizationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_forbidden_claim")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_scope_boundary")).toBe(true);
  });

  it("fails Phase 4B-B identifiers or live IdentityFiberNominalV1 usage in runtime and case targets", () => {
    const input = fixture();
    input.runtimeIntegrationFiles = [
      {
        path: "caseDoc.ts",
        text:
          '{"useProductionHomogenization": true, "useProductionMechanics": true, '
          + '"liveRuntimeReplacement": true}',
      },
      {
        path: "features/workbench/casePublish.ts",
        text:
          "import { IdentityFiberNominalV1, evaluateIdentityFiberNominalV1 } from '@/engine/myocardium/homogenization';\n"
          + "const id = 'land-tissue-homogenization-phase4b-protocols-v1';\n"
          + "const enabled = { useProductionHomogenization: true };\n"
          + "IdentityFiberNominalV1.evaluate(input, params); evaluateIdentityFiberNominalV1(input);",
      },
    ];

    const validation = validateTissueHomogenizationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_runtime_leak")).toBe(true);
  });

  it("fails missing future TriSeg path or RV/interdependence noncoverage", () => {
    const input = fixture();
    delete input.descriptor.futureTriSegPath;
    input.descriptor.nonCoverage = [];

    const validation = validateTissueHomogenizationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_future_triseg_path")).toBe(true);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_non_coverage")).toBe(true);
  });

  it("fails missing identity adapter limitation text", () => {
    const input = fixture();
    input.descriptor.currentChecks = [];
    input.descriptor.scientificLimitations = { limitationText: "identity adapter limitations unspecified" };
    input.report.scientificLimitations = { limitationText: "identity adapter limitations unspecified" };

    const validation = validateTissueHomogenizationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_identity_limitations")).toBe(true);
  });

  it("fails descriptor and report constant mismatch with IDENTITY_FIBER_NOMINAL_V1_PARAMS", () => {
    const input = fixture();
    input.descriptor.identityAdapterCandidate.parameters.activeTissueFraction = 0.75;
    input.descriptor.identityAdapterCandidate.parameters.orientationRuleId = "non-identity-orientation";
    input.report.identityAdapterCandidate.descriptorParams.activeTissueFraction = 0.75;
    input.report.identityAdapterCandidate.descriptorParams.orientationRuleId = "non-identity-orientation";
    input.report.identityAdapterCandidate.descriptorMatchesRuntimeParams = false;

    const validation = validateTissueHomogenizationReadiness(input);

    expect(validation.pass).toBe(false);
    expect(validation.errors.some((issue) => issue.code === "phase4bb_identity_params")).toBe(true);
  });

  it("keeps stabilization stiffness and optional algorithmic tangent distinct in the identity mapping smoke", () => {
    const report = runTissueHomogenizationReadinessReport();
    const smoke = report.identityMappingSmoke;

    expect(smoke.stressPassThrough).toBe(true);
    expect(smoke.stabilizationPassThrough).toBe(true);
    expect(smoke.algorithmicTangentPassThrough).toBe(true);
    expect(smoke.stabilizationAndAlgorithmicTangentDistinct).toBe(true);
    expect(smoke.wallStabilizationStiffnessPa).toBe(smoke.sourceStabilizationStiffnessPa);
    expect(smoke.wallAlgorithmicTangentPa).toBe(smoke.sourceAlgorithmicTangentPa);
    expect(smoke.wallStabilizationStiffnessPa).not.toBe(smoke.wallAlgorithmicTangentPa);
    expect(smoke.allowFreeGain).toBe(false);
    expect(smoke.fitToPVLoop).toBe(false);
  });

  it("does not alter the existing Phase 4B-A report output when the new report runs", () => {
    const before = runLandActiveStressReplacementReadinessReport();
    const beforeText = JSON.stringify(before);
    const phase4BB = runTissueHomogenizationReadinessReport();
    const after = runLandActiveStressReplacementReadinessReport();

    expect(JSON.stringify(after)).toBe(beforeText);
    expect(phase4BB.phase4BAReuse.status).toBe("read-only");
    expect(phase4BB.phase4BAReuse.stableSummaryHash).toBe(before.stableSummaryHash);
    expect(phase4BB.phase4BAReuse.stableSummaryHash).toBe(after.stableSummaryHash);
  });
});

type MutableValidationInput = TissueHomogenizationReadinessValidationInput & {
  descriptor: Record<string, any>;
  phase3BDescriptor: Record<string, any>;
  phase3CDescriptor: Record<string, any>;
  phase4BADescriptor: Record<string, any>;
  phase4BAReport: any;
  report: any;
  runtimeIntegrationFiles: TextFileInput[];
  docs: TextFileInput[];
};

function fixture(): MutableValidationInput {
  const input = loadTissueHomogenizationReadinessValidationInput(process.cwd());
  return {
    descriptor: clone(input.descriptor),
    phase3BDescriptor: clone(input.phase3BDescriptor),
    phase3CDescriptor: clone(input.phase3CDescriptor),
    phase4BADescriptor: clone(input.phase4BADescriptor),
    phase4BAReport: clone(input.phase4BAReport),
    report: clone(input.report),
    runtimeIntegrationFiles: input.runtimeIntegrationFiles.map((file) => ({ ...file })),
    docs: input.docs.map((file) => ({ ...file })),
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
