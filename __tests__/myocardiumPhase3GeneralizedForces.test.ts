import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/identity-force-phase3b-protocols.json";
import {
  IDENTITY_FIBER_NOMINAL_V1_ID,
  IDENTITY_FIBER_NOMINAL_V1_PARAMS,
  IdentityFiberNominalV1,
  evaluateIdentityFiberNominalV1,
  type HomogenizationInput,
} from "@/engine/myocardium/homogenization";
import {
  THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
  ThickSphereSpikeV1,
} from "@/engine/myocardium/kinematics";
import type { LandSourceOutput } from "@/engine/myocardium/myofilament/land2017/types";
import {
  IDENTITY_FORCE_PHASE3B_CLAIM_BOUNDARY,
  IDENTITY_FORCE_PHASE3B_EVIDENCE_STATUS,
  runIdentityForcePhase3BReport,
} from "@/engine/myocardium/mechanics/identityForcePhase3BReport";
import {
  VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID,
  ZERO_PASSIVE_MATERIAL_FIXTURE_ID,
  ZERO_PASSIVE_MATERIAL_PHASE3B_FIXTURE,
  VirtualPowerNominalEngineeringV1,
} from "@/engine/myocardium/mechanics";
import type { PassiveMaterialOutput } from "@/engine/myocardium/mechanics";

describe("myocardium Phase 3B identity homogenization and generalized force", () => {
  it("declares a standalone identity-force boundary with pending owner Decisions 4, 5, 6, 8, and 19", () => {
    expect(protocolDescriptor.schemaVersion).toBe(1);
    expect(protocolDescriptor.protocolSetId).toBe("identity-force-phase3b-protocols-v1");
    expect(protocolDescriptor.artifact.id).toBe("identity-force-phase3b-protocols-v1");
    expect(protocolDescriptor.phase).toBe("Phase 3B");
    expect(protocolDescriptor.claimBoundary).toBe(IDENTITY_FORCE_PHASE3B_CLAIM_BOUNDARY);
    expect(protocolDescriptor.evidenceStatus).toBe(IDENTITY_FORCE_PHASE3B_EVIDENCE_STATUS);
    expect(protocolDescriptor.experimentalTargets).toBe("deferred");
    expect(protocolDescriptor.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(protocolDescriptor.pendingOwnerDecisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ decisionId: 4, status: "PENDING OWNER" }),
        expect.objectContaining({ decisionId: 5, status: "PENDING OWNER" }),
        expect.objectContaining({ decisionId: 6, status: "PENDING OWNER" }),
        expect.objectContaining({ decisionId: 8, status: "PENDING OWNER" }),
        expect.objectContaining({ decisionId: 19, status: "PENDING OWNER" }),
      ]),
    );
    expect(protocolDescriptor.modelIds).toMatchObject({
      homogenizationModelId: IDENTITY_FIBER_NOMINAL_V1_ID,
      generalizedForceModelId: VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID,
      passiveFixtureId: ZERO_PASSIVE_MATERIAL_FIXTURE_ID,
    });
  });

  it("passes Land source stress and stiffness through the identity homogenization adapter without free gain", () => {
    const source = sourceOutput({ stressPa: 34567, stiffnessPa: 45678, tangentPa: 56789 });
    const output = IdentityFiberNominalV1.evaluate(homogenizationInput(source), IDENTITY_FIBER_NOMINAL_V1_PARAMS);

    expect(output.wallActiveNominalStressPa).toBe(source.sourceActiveFiberStressPa);
    expect(output.wallStabilizationStiffnessPa).toBe(source.stabilizationStiffnessPa);
    expect(output.wallAlgorithmicTangentPa).toBe(source.algorithmicTangentPa);
    expect(output.activeTissueFraction).toBe(1);
    expect(output.orientationRuleId).toBe(IDENTITY_FIBER_NOMINAL_V1_ID);
    expect(IDENTITY_FIBER_NOMINAL_V1_PARAMS.allowFreeGain).toBe(false);
    expect(IDENTITY_FIBER_NOMINAL_V1_PARAMS.fitToPVLoop).toBe(false);

    expect(() =>
      evaluateIdentityFiberNominalV1(
        homogenizationInput({ ...source, sourceStressConvention: "bad" as "land2017-Ta" }),
      ),
    ).toThrow(/land2017-Ta/);
    expect(() =>
      evaluateIdentityFiberNominalV1(homogenizationInput({ ...source, sourceActiveFiberStressPa: Number.NaN })),
    ).toThrow(/sourceActiveFiberStressPa/);
    expect(() =>
      evaluateIdentityFiberNominalV1({ ...homogenizationInput(source), wallReferenceVolumeM3: 0 }),
    ).toThrow(/wallReferenceVolumeM3/);
  });

  it("maps active, passive, and viscous stress into single-coordinate generalized-force contributions", () => {
    const kinematics = kinematicsAtVolume(1.1e-4, -2e-4);
    const active = IdentityFiberNominalV1.evaluate(
      homogenizationInput(sourceOutput({ stressPa: 40000 })),
      IDENTITY_FIBER_NOMINAL_V1_PARAMS,
    );
    const passive: PassiveMaterialOutput = {
      passiveNominalStressPa: 1200,
      viscousNominalStressPa: -300,
      dPassiveStressDStrainPa: 0,
      storedEnergyDensityJPerM3: 0,
      dissipationDensityWPerM3: 0,
    };
    const output = VirtualPowerNominalEngineeringV1.evaluate({ kinematics, active, passive });
    const dStrainDVolume = kinematics.dStrainDCoordinate[0];
    const wallReferenceVolumeM3 = kinematics.wallReferenceVolumeM3;
    const expectedActive = wallReferenceVolumeM3 * active.wallActiveNominalStressPa * dStrainDVolume;
    const expectedPassive = wallReferenceVolumeM3 * passive.passiveNominalStressPa * dStrainDVolume;
    const expectedViscous = wallReferenceVolumeM3 * passive.viscousNominalStressPa * dStrainDVolume;

    expect(output.coordinateIds).toEqual([THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID]);
    expect(output.activeContributionsSI[0]).toBeCloseTo(expectedActive, 12);
    expect(output.passiveContributionsSI[0]).toBeCloseTo(expectedPassive, 12);
    expect(output.viscousContributionsSI[0]).toBeCloseTo(expectedViscous, 12);
    expect(output.conjugateForcesSI[0]).toBeCloseTo(expectedActive + expectedPassive + expectedViscous, 12);
    expect(output.volumeCoordinatePressurePa?.[THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID]).toBe(output.conjugateForcesSI[0]);
  });

  it("closes virtual power and finite-difference virtual work for the Phase 3A kinematics", () => {
    const kinematics = kinematicsAtVolume(9.5e-5, 1.8e-4);
    const active = IdentityFiberNominalV1.evaluate(
      homogenizationInput(sourceOutput({ stressPa: 37000 })),
      IDENTITY_FIBER_NOMINAL_V1_PARAMS,
    );
    const output = VirtualPowerNominalEngineeringV1.evaluate({
      kinematics,
      active,
      passive: ZERO_PASSIVE_MATERIAL_PHASE3B_FIXTURE,
    });
    const coordinateRateSI = kinematics.fiberEngineeringStrainRatePerSec / kinematics.dStrainDCoordinate[0];
    const expectedPower =
      kinematics.wallReferenceVolumeM3
      * active.wallActiveNominalStressPa
      * kinematics.fiberEngineeringStrainRatePerSec;
    expect(output.virtualPowerResidualW).toBeCloseTo(0, 14);
    expect(output.conjugateForcesSI[0] * coordinateRateSI).toBeCloseTo(expectedPower, 14);

    const h = 1e-9;
    const cavityVolumeM3 = 9.5e-5;
    const plus = kinematicsAtVolume(cavityVolumeM3 + h, 0);
    const minus = kinematicsAtVolume(cavityVolumeM3 - h, 0);
    const virtualWorkLeft = output.conjugateForcesSI[0] * (2 * h);
    const virtualWorkRight =
      kinematics.wallReferenceVolumeM3
      * active.wallActiveNominalStressPa
      * (plus.fiberEngineeringStrain - minus.fiberEngineeringStrain);
    expect(virtualWorkLeft).toBeCloseTo(virtualWorkRight, 5);
  });

  it("uses an explicit zero passive/viscous fixture without accepting a passive law", () => {
    expect(ZERO_PASSIVE_MATERIAL_PHASE3B_FIXTURE).toEqual({
      passiveNominalStressPa: 0,
      viscousNominalStressPa: 0,
      dPassiveStressDStrainPa: 0,
      storedEnergyDensityJPerM3: 0,
      dissipationDensityWPerM3: 0,
    });
    expect(protocolDescriptor.claimExclusions.passiveLawAcceptance).toBe("not-claimed");
    const report = runIdentityForcePhase3BReport();
    expect(report.samples.every((sample) => sample.passiveContributionSI === 0)).toBe(true);
    expect(report.samples.every((sample) => sample.viscousContributionSI === 0)).toBe(true);
  });

  it("builds a deterministic report and keeps forbidden positive claims out", () => {
    const first = runIdentityForcePhase3BReport();
    const second = runIdentityForcePhase3BReport();
    const text = JSON.stringify({ first, protocolDescriptor });

    expect(first.closurePass).toBe(true);
    expect(first.stableSummaryHash).toBe(second.stableSummaryHash);
    expect(first.stableSummaryHash).toMatch(/^[0-9a-f]{8}$/);
    expect(text).not.toMatch(/experimentalPass|targetPass|acceptancePass|validationPass|fitPass|morphologyPass/i);
    expect(protocolDescriptor.claimExclusions.loadedAfterloadFamily).toBe("not-claimed");
  });

  it("keeps Phase 3B out of runtime, afterload, Land implementation, and concrete kinematics engines", () => {
    const repoRoot = process.cwd();
    const engineRoots = [
      path.join(repoRoot, "engine/myocardium/homogenization"),
      path.join(repoRoot, "engine/myocardium/mechanics"),
    ];
    for (const root of engineRoots) {
      for (const file of listFiles(root)) {
        const text = readFileSync(file, "utf8");
        expect(text).not.toMatch(
          /^import\s+(?!type\b).*(@\/)?engine\/(?:ModelCore|chambers|myocardium\/myofilament\/land2017\/(?:equations|solver|residual|jacobian|outputs|protocols))/m,
        );
      }
    }
    const mapperText = readFileSync(
      path.join(repoRoot, "engine/myocardium/mechanics/virtualPowerNominalEngineeringV1.ts"),
      "utf8",
    );
    expect(mapperText).not.toMatch(/ThickSphereSpikeV1|thickSphereSpikeV1|thick-sphere-phase3a/);

    const integrationTargets = [
      path.join(repoRoot, "engine/ModelCore.ts"),
      path.join(repoRoot, "engine/chambers.ts"),
      path.join(repoRoot, "engine/harness.ts"),
      path.join(repoRoot, "engine/myocardium/myofilament/land2017"),
    ];
    for (const target of integrationTargets) {
      if (!existsSync(target)) continue;
      for (const file of listFiles(target)) {
        const text = readFileSync(file, "utf8");
        expect(text).not.toMatch(
          /identityForcePhase3B|runIdentityForcePhase3B|identity-force-phase3b|IdentityFiberNominalV1|VirtualPowerNominalEngineeringV1|identity-fiber-nominal-v1|virtual-power-nominal-engineering-v1/,
        );
      }
    }
  });
});

function sourceOutput({
  stressPa,
  stiffnessPa = 50000,
  tangentPa,
}: {
  readonly stressPa: number;
  readonly stiffnessPa?: number;
  readonly tangentPa?: number;
}): LandSourceOutput {
  return {
    sourceActiveFiberStressPa: stressPa,
    sourceStressConvention: "land2017-Ta",
    stabilizationStiffnessPa: stiffnessPa,
    ...(tangentPa === undefined ? {} : { algorithmicTangentPa: tangentPa }),
    sourceActivePowerDensityWPerM3: stressPa * 0.1,
    health: {
      finite: true,
      stateConservationResidual: 0,
      minimumPopulation: 0.01,
      projectionUsed: false,
    },
  };
}

function homogenizationInput(source: LandSourceOutput): HomogenizationInput {
  return {
    source,
    instance: { moduleId: "homogenization", instanceId: "phase3b-test" },
    wallReferenceVolumeM3: THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.wallReferenceVolumeM3,
  };
}

function kinematicsAtVolume(valueSI: number, rateSI: number) {
  return ThickSphereSpikeV1.evaluate(
    {
      coordinates: [
        {
          id: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
          valueSI,
          previousValueSI: valueSI,
          rateSI,
          unit: "m3",
        },
      ],
      instance: { moduleId: "kinematics", instanceId: "phase3b-test" },
    },
    THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
  );
}

function listFiles(target: string): string[] {
  const stats = statSync(target);
  if (stats.isFile()) return /\.(ts|tsx)$/.test(target) ? [target] : [];
  const out: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      out.push(fullPath);
    }
  }
  return out;
}
