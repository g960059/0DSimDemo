import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json";
import { THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET } from "@/engine/myocardium/kinematics";
import {
  MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS,
  MINIMAL_LOADED_AFTERLOAD_FIXED_PROTOCOL_SETTINGS,
  MINIMAL_LOADED_AFTERLOAD_PHASE3C_CLAIM_BOUNDARY,
  MINIMAL_LOADED_AFTERLOAD_PHASE3C_EVIDENCE_STATUS,
  TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID,
  runMinimalLoadedAfterloadFamily,
  runMinimalLoadedAfterloadFamilyPhase3CReport,
  type MinimalLoadedAfterloadFixedProtocolSettings,
  type MinimalLoadedAfterloadMemberDefinition,
} from "@/engine/myocardium/protocols/minimalLoadedAfterloadFamily";

describe("myocardium Phase 3C minimal loaded afterload family", () => {
  it("declares a D0 smoke-only afterload-family boundary with required pending decisions", () => {
    expect(protocolDescriptor.schemaVersion).toBe(1);
    expect(protocolDescriptor.protocolSetId).toBe("minimal-loaded-phase3c-afterload-protocols-v1");
    expect(protocolDescriptor.artifact.id).toBe("minimal-loaded-phase3c-afterload-protocols-v1");
    expect(protocolDescriptor.phase).toBe("Phase 3C");
    expect(protocolDescriptor.claimBoundary).toBe(MINIMAL_LOADED_AFTERLOAD_PHASE3C_CLAIM_BOUNDARY);
    expect(protocolDescriptor.evidenceStatus).toBe(MINIMAL_LOADED_AFTERLOAD_PHASE3C_EVIDENCE_STATUS);
    expect(protocolDescriptor.experimentalTargets).toBe("deferred");
    expect(protocolDescriptor.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(protocolDescriptor.phaseOwnerGateStatus).toBe("not-recorded");
    expect(protocolDescriptor.pendingOwnerDecisions.map((decision) => decision.decisionId)).toEqual([
      4,
      5,
      6,
      8,
      10,
      12,
      19,
    ]);
    expect(protocolDescriptor.pendingOwnerDecisions.every((decision) => decision.status === "PENDING OWNER")).toBe(true);
    expect(protocolDescriptor.protocolSettings.memberIds).toEqual([
      ...MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS,
    ]);
    expect(protocolDescriptor.phase0DecisionBoundary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ decisionId: 14, status: "Phase 0 accepted governance input" }),
        expect.objectContaining({ decisionId: 15, status: "Phase 0 accepted governance input" }),
      ]),
    );
    expect(protocolDescriptor.protocolSettings).toMatchObject({
      afterloadFlowLaw: "bidirectional-linear-resistor",
      useDynamicValve: false,
      useQDotClamp: false,
      useTBVProjection: false,
      allowFreeGeometryScale: false,
      allowFreeHomogenizationGain: false,
      useProductionMechanics: false,
      usePassiveLawAcceptance: false,
      useSeptalPericardialCoupling: false,
      useClosedLoopSteadyState: false,
      phaseOwnerGateStatus: "not-recorded",
    });
  });

  it("builds a deterministic three-member closure report without downstream pass claims", () => {
    const first = runMinimalLoadedAfterloadFamilyPhase3CReport();
    const second = runMinimalLoadedAfterloadFamilyPhase3CReport();
    const closureSections = first.sections.filter((section) => section.status !== "deferred-target");
    const text = JSON.stringify({
      protocolDescriptor,
      report: {
        claimBoundary: first.claimBoundary,
        evidenceStatus: first.evidenceStatus,
        experimentalTargets: first.experimentalTargets,
        ownerAcceptanceStatus: first.ownerAcceptanceStatus,
        phaseOwnerGateStatus: first.phaseOwnerGateStatus,
        modelIds: first.modelIds,
        fixedProtocolSettings: first.fixedProtocolSettings,
        familyMembers: first.familyMembers,
        memberMetrics: first.memberResults.map((member) => ({
          id: member.id,
          ok: member.ok,
          metrics: member.metrics,
          finalCavityVolumeM3: member.finalCavityVolumeM3,
          finalAfterloadPressurePa: member.finalAfterloadPressurePa,
        })),
      },
    });

    expect(first.closurePass).toBe(true);
    expect(closureSections).toHaveLength(7);
    expect(closureSections.every((section) => section.status === "closure-pass")).toBe(true);
    expect(first.stableSummaryHash).toBe(second.stableSummaryHash);
    expect(first.stableSummaryHash).toMatch(/^[0-9a-f]{8}$/);
    expect(first.memberResults.map((member) => member.id)).toEqual([...MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS]);
    expect(first.memberResults.every((member) => member.ok)).toBe(true);
    expect(text).not.toMatch(
      /experimentalPass|targetPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass|ownerGOPass|ownerGatePass|downstreamPass|morphologyPass|production(?:Mechanics|Homogenization|Loaded)?Pass|singleChamberSolverPass|dynamicValveState|qDotClampState|tbvProjectionState/i,
    );
  });

  it("asserts family members differ only in afterload parameters", () => {
    const report = runMinimalLoadedAfterloadFamilyPhase3CReport();
    const fixedSettings = report.familyMembers.map((member) => JSON.stringify(member.fixedProtocolSettings));
    const afterloadParameterKeys = report.familyMembers.map((member) => Object.keys(member.parameters).sort());
    const afterloadParameterTuples = report.familyMembers.map((member) => JSON.stringify(member.parameters));
    const familySection = report.sections.find((section) => section.id === "protocol-family-completion-v1");

    expect(new Set(fixedSettings).size).toBe(1);
    expect(report.familyMembers.every((member) => member.afterloadModelId === TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID))
      .toBe(true);
    expect(afterloadParameterKeys).toEqual(
      report.familyMembers.map(() => [
        "complianceM3PerPa",
        "initialAfterloadPressurePa",
        "resistancePaSecPerM3",
      ]),
    );
    expect(new Set(afterloadParameterTuples).size).toBe(report.familyMembers.length);
    expect(familySection?.metrics.memberDifferenceInvariant).toBe(true);
    expect(familySection?.metrics.allowedDifferingAfterloadFields).toEqual([
      "resistancePaSecPerM3",
      "complianceM3PerPa",
      "initialAfterloadPressurePa",
    ]);
  });

  it("uses the exact bidirectional linear resistor update and stays in the Phase 3A volume domain", () => {
    const report = runMinimalLoadedAfterloadFamilyPhase3CReport();
    const minVolume = THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.sweepCavityVolumeMinM3;
    const maxVolume = THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.sweepCavityVolumeMaxM3;

    for (const member of report.memberResults) {
      const params = member.definition.parameters;
      for (const sample of member.samples) {
        const expectedFlow =
          (sample.internalPressurePa - sample.afterloadPressurePa) / params.resistancePaSecPerM3;
        const expectedVolume = sample.cavityVolumeM3 - sample.resistorFlowM3PerSec * sample.dtSec;
        const expectedAfterloadPressure =
          sample.afterloadPressurePa
          + (sample.resistorFlowM3PerSec * sample.dtSec) / params.complianceM3PerPa;

        expect(sample.resistorFlowM3PerSec).toBeCloseTo(expectedFlow, 15);
        expect(sample.nextCavityVolumeM3).toBeCloseTo(expectedVolume, 15);
        expect(sample.nextAfterloadPressurePa).toBeCloseTo(expectedAfterloadPressure, 9);
        expect(sample.cavityVolumeM3).toBeGreaterThanOrEqual(minVolume);
        expect(sample.cavityVolumeM3).toBeLessThanOrEqual(maxVolume);
        expect(sample.nextCavityVolumeM3).toBeGreaterThanOrEqual(minVolume);
        expect(sample.nextCavityVolumeM3).toBeLessThanOrEqual(maxVolume);
      }
    }
  });

  it("fails the member when the loaded update leaves the Phase 3A volume domain", () => {
    const fixedSettings: MinimalLoadedAfterloadFixedProtocolSettings = {
      ...MINIMAL_LOADED_AFTERLOAD_FIXED_PROTOCOL_SETTINGS,
      initialCavityVolumeM3: THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.sweepCavityVolumeMinM3 + 1e-12,
      durationSec: 0.002,
    };
    const family: readonly MinimalLoadedAfterloadMemberDefinition[] = [
      {
        id: "afterload-low",
        afterloadModelId: TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID,
        parameters: {
          resistancePaSecPerM3: 1e5,
          complianceM3PerPa: 1e-8,
          initialAfterloadPressurePa: -1e9,
        },
        fixedProtocolSettings: fixedSettings,
      },
    ];
    const [result] = runMinimalLoadedAfterloadFamily({ fixedProtocolSettings: fixedSettings, family });

    expect(result.ok).toBe(false);
    expect(result.failureReason).toBe("volume-domain-failure");
    expect(result.failureMessage).toMatch(/Phase 3A sweep domain/);
  });

  it("keeps Phase 3C out of runtime, schema, official cases, and old active-stress wiring", () => {
    const repoRoot = process.cwd();
    const phase3cEngineText = readFileSync(
      path.join(repoRoot, "engine/myocardium/protocols/minimalLoadedAfterloadFamily.ts"),
      "utf8",
    );
    expect(phase3cEngineText).not.toMatch(
      /\bfrom\s+["']@\/engine\/(?:ModelCore|chambers|harness|runtime|protocol|stateContract|core\/stateLayout)/m,
    );
    expect(phase3cEngineText).not.toMatch(/ActiveStressChamberModel|legacyActiveStress|oldActiveStress/);

    const integrationTargets = [
      path.join(repoRoot, "engine/ModelCore.ts"),
      path.join(repoRoot, "engine/chambers.ts"),
      path.join(repoRoot, "engine/harness.ts"),
      path.join(repoRoot, "engine/protocol.ts"),
      path.join(repoRoot, "engine/stateContract.ts"),
      path.join(repoRoot, "officialCases.ts"),
      path.join(repoRoot, "data/cases"),
      path.join(repoRoot, "public/cases"),
    ];
    const phase3cReferencePattern =
      /minimalLoadedAfterload|runMinimalLoadedAfterload|minimal-loaded-phase3c|afterload-family-phase3c|TWO_ELEMENT_AFTERLOAD_PHASE3C|minimal-loaded-afterload-family-smoke-only/;
    for (const target of integrationTargets) {
      if (!existsSync(target)) continue;
      for (const file of listFiles(target)) {
        const text = readFileSync(file, "utf8");
        expect(text).not.toMatch(phase3cReferencePattern);
      }
    }
  });
});

function listFiles(target: string): string[] {
  if (!existsSync(target)) return [];
  const stats = statSync(target);
  if (stats.isFile()) return /\.(ts|tsx|json)$/.test(target) ? [target] : [];
  const out: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|json)$/.test(entry.name)) {
      out.push(fullPath);
    }
  }
  return out;
}
