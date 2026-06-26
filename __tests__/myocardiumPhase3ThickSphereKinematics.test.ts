import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import protocolDescriptor from "@/data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json";
import {
  THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
  THICK_SPHERE_PHASE3A_CLAIM_BOUNDARY,
  THICK_SPHERE_PHASE3A_EVIDENCE_STATUS,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
  THICK_SPHERE_SPIKE_V1_ID,
  ThickSphereSpikeV1,
  assertValidThickSphereSpikeV1Params,
  computeThickSphereSpikeParameterSetStableHash,
  runThickSpherePhase3AKinematicsReport,
  type ThickSphereSpikeV1ParameterSet,
} from "@/engine/myocardium/kinematics";
import type { GeneralizedCoordinateState } from "@/engine/myocardium/kinematics";

describe("myocardium Phase 3A thick-sphere kinematics", () => {
  it("declares a fixed kinematics-only boundary with pending owner Decisions 5 and 19", () => {
    expect(protocolDescriptor.schemaVersion).toBe(1);
    expect(protocolDescriptor.protocolSetId).toBe("thick-sphere-phase3a-kinematics-protocols-v1");
    expect(protocolDescriptor.artifact.id).toBe("thick-sphere-phase3a-kinematics-protocols-v1");
    expect(protocolDescriptor.phase).toBe("Phase 3A");
    expect(protocolDescriptor.claimBoundary).toBe(THICK_SPHERE_PHASE3A_CLAIM_BOUNDARY);
    expect(protocolDescriptor.evidenceStatus).toBe(THICK_SPHERE_PHASE3A_EVIDENCE_STATUS);
    expect(protocolDescriptor.experimentalTargets).toBe("deferred");
    expect(protocolDescriptor.ownerAcceptanceStatus).toBe("not-owner-acceptance");
    expect(protocolDescriptor.pendingOwnerDecisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ decisionId: 5, status: "PENDING OWNER" }),
        expect.objectContaining({ decisionId: 19, status: "PENDING OWNER" }),
      ]),
    );
    expect(protocolDescriptor.sourceDocuments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "docs/myocardium/model-spec/myocardium-land-v1.md" }),
        expect.objectContaining({ path: "docs/myocardium/verification/myocardium-v1-verification.md" }),
        expect.objectContaining({ path: "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md" }),
      ]),
    );
    expect(protocolDescriptor.midwallConvention.id).toBe("arithmetic-mean-midwall-phase3a-only");
  });

  it("implements the fixed thick-sphere formulas and independent analytic dE/dV", () => {
    const params = THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET;
    const volume = 9.25e-5;
    const expected = independentFormula(volume, params);
    const output = ThickSphereSpikeV1.evaluate(inputAtVolume(volume, 1.5e-5), params);

    expect(ThickSphereSpikeV1.id).toBe(THICK_SPHERE_SPIKE_V1_ID);
    expect(output.coordinateIds).toEqual([THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID]);
    expect(output.wallReferenceVolumeM3).toBe(params.wallReferenceVolumeM3);
    expect(output.sarcomereLengthM).toBeCloseTo(expected.sarcomereLengthM, 15);
    expect(output.fiberStretchRatio).toBeCloseTo(expected.fiberStretchRatio, 15);
    expect(output.fiberEngineeringStrain).toBeCloseTo(expected.fiberEngineeringStrain, 15);
    expect(output.dStrainDCoordinate[0]).toBeCloseTo(expected.dStrainDVolume, 8);

    const h = volume * 1e-5;
    const finiteDifference =
      (
        independentFormula(volume + h, params).fiberEngineeringStrain
        - independentFormula(volume - h, params).fiberEngineeringStrain
      )
      / (2 * h);
    expect(output.dStrainDCoordinate[0]).toBeCloseTo(finiteDifference, 4);
  });

  it("keeps in-domain sweep outputs finite and strain monotonic with cavity volume", () => {
    const params = THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET;
    const volumes = Array.from({ length: 11 }, (_, index) =>
      params.sweepCavityVolumeMinM3
      + ((params.sweepCavityVolumeMaxM3 - params.sweepCavityVolumeMinM3) * index) / 10,
    );
    const outputs = volumes.map((volume) => ThickSphereSpikeV1.evaluate(inputAtVolume(volume, 0), params));

    expect(outputs.every((output) => output.geometryHealth.finite)).toBe(true);
    expect(outputs.every((output) => output.geometryHealth.inCalibrationDomain)).toBe(true);
    expect(outputs.every((output) => Number.isFinite(output.sarcomereLengthM))).toBe(true);
    expect(outputs.every((output) => Number.isFinite(output.dStrainDCoordinate[0]))).toBe(true);
    for (let index = 1; index < outputs.length; index += 1) {
      expect(outputs[index].fiberEngineeringStrain).toBeGreaterThan(outputs[index - 1].fiberEngineeringStrain);
    }
  });

  it("derives strain rate from coordinate rate and keeps dtSec out of the core contract", () => {
    const params = THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET;
    const rateSI = -3.2e-4;
    const input = inputAtVolume(params.anchorCavityVolumeM3, rateSI);
    const output = ThickSphereSpikeV1.evaluate(input, params);

    expect(output.fiberEngineeringStrainRatePerSec).toBeCloseTo(output.dStrainDCoordinate[0] * rateSI, 14);
    expect(Object.keys(input)).not.toContain("dtSec");
    expect(Object.keys(input.coordinates[0])).not.toContain("dtSec");
    expect(Object.keys(output)).not.toContain("dtSec");
  });

  it("throws for invalid parameter sets but reports bad per-evaluation coordinates through geometry health", () => {
    const params = THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET;
    const numericFields: (keyof ThickSphereSpikeV1ParameterSet)[] = [
      "wallReferenceVolumeM3",
      "anchorCavityVolumeM3",
      "slackSarcomereLengthM",
      "anchorSarcomereLengthM",
      "sweepCavityVolumeMinM3",
      "sweepCavityVolumeMaxM3",
    ];
    for (const field of numericFields) {
      expect(() => assertValidThickSphereSpikeV1Params({ ...params, [field]: 0 })).toThrow(String(field));
      expect(() => assertValidThickSphereSpikeV1Params({ ...params, [field]: Number.NaN })).toThrow(String(field));
    }
    expect(() =>
      assertValidThickSphereSpikeV1Params({
        ...params,
        sweepCavityVolumeMinM3: params.sweepCavityVolumeMaxM3,
      }),
    ).toThrow(/less than/);
    expect(() =>
      assertValidThickSphereSpikeV1Params({
        ...params,
        anchorCavityVolumeM3: params.sweepCavityVolumeMaxM3 * 2,
      }),
    ).toThrow(/inside/);

    expect(() =>
      ThickSphereSpikeV1.evaluate({ ...inputAtVolume(params.anchorCavityVolumeM3, 0), coordinates: [] }, params),
    ).toThrow(/exactly one/);
    expect(() =>
      ThickSphereSpikeV1.evaluate(
        { ...inputAtVolume(params.anchorCavityVolumeM3, 0), coordinates: [{ ...coordinateAt(params.anchorCavityVolumeM3, 0), id: "x" }] },
        params,
      ),
    ).toThrow(/cavity-volume/);
    expect(() =>
      ThickSphereSpikeV1.evaluate(
        { ...inputAtVolume(params.anchorCavityVolumeM3, 0), coordinates: [{ ...coordinateAt(params.anchorCavityVolumeM3, 0), unit: "m" }] },
        params,
      ),
    ).toThrow(/unit m3/);

    const belowDomain = ThickSphereSpikeV1.evaluate(inputAtVolume(params.sweepCavityVolumeMinM3 / 2, 0), params);
    expect(belowDomain.geometryHealth.finite).toBe(true);
    expect(belowDomain.geometryHealth.inCalibrationDomain).toBe(false);

    const aboveDomain = ThickSphereSpikeV1.evaluate(inputAtVolume(params.sweepCavityVolumeMaxM3 * 2, 0), params);
    expect(aboveDomain.geometryHealth.finite).toBe(true);
    expect(aboveDomain.geometryHealth.inCalibrationDomain).toBe(false);

    const negative = ThickSphereSpikeV1.evaluate(inputAtVolume(-1e-6, 0), params);
    expect(negative.geometryHealth.finite).toBe(false);
    expect(negative.geometryHealth.inCalibrationDomain).toBe(false);
    expect(Number.isNaN(negative.fiberEngineeringStrain)).toBe(true);

    const nonFinite = ThickSphereSpikeV1.evaluate(inputAtVolume(Number.NaN, 0), params);
    expect(nonFinite.geometryHealth.finite).toBe(false);
    expect(nonFinite.geometryHealth.inCalibrationDomain).toBe(false);

    const nonFiniteRate = ThickSphereSpikeV1.evaluate(inputAtVolume(params.anchorCavityVolumeM3, Number.NaN), params);
    expect(nonFiniteRate.geometryHealth.finite).toBe(false);
    expect(nonFiniteRate.geometryHealth.inCalibrationDomain).toBe(true);
    expect(Number.isFinite(nonFiniteRate.fiberEngineeringStrain)).toBe(true);
    expect(Number.isNaN(nonFiniteRate.fiberEngineeringStrainRatePerSec)).toBe(true);
  });

  it("builds a deterministic report and stable candidate parameter hash", () => {
    const first = runThickSpherePhase3AKinematicsReport();
    const second = runThickSpherePhase3AKinematicsReport();
    const parameterSetHash = computeThickSphereSpikeParameterSetStableHash();

    expect(first.closurePass).toBe(true);
    expect(first.stableSummaryHash).toBe(second.stableSummaryHash);
    expect(first.stableSummaryHash).toMatch(/^[0-9a-f]{8}$/);
    expect(parameterSetHash).toBe(second.parameterSet.parameterSetStableHash);
    expect(parameterSetHash).toBe(THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.parameterSetStableHash);
    expect(first.parameterSet.parameterSetId).toBe(THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID);
  });

  it("keeps forbidden imports, pass claims, and runtime references out of the Phase 3A artifact", () => {
    const reportText = JSON.stringify(runThickSpherePhase3AKinematicsReport());
    const descriptorText = JSON.stringify(protocolDescriptor);

    expect(reportText).not.toMatch(
      /experimentalPass|tier[A-Z0-9]*Pass|targetPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass|productionMechanicsPass|loadedPressurePass|chamberPass|valvePass|qDotPass|homogenizationPass|generalizedForcePass/i,
    );
    expect(descriptorText).not.toMatch(
      /experimentalPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass|loadedPressurePass|chamberPass|valvePass|qDotPass|homogenizationPass|generalizedForcePass/i,
    );

    const repoRoot = process.cwd();
    for (const file of listFiles(path.join(repoRoot, "engine/myocardium/kinematics"))) {
      const text = readFileSync(file, "utf8");
      expect(text).not.toMatch(
        /^import\s+.*(?:engine\/ModelCore|engine\/chambers|myofilament\/land2017|homogenization|generalized-force|generalizedForce)/m,
      );
    }

    const integrationTargets = [
      path.join(repoRoot, "engine/ModelCore.ts"),
      path.join(repoRoot, "engine/chambers.ts"),
      path.join(repoRoot, "engine/myocardium/myofilament/land2017"),
      path.join(repoRoot, "engine/myocardium/homogenization"),
      path.join(repoRoot, "engine/myocardium/generalized-force"),
    ];
    for (const target of integrationTargets) {
      if (!existsSync(target)) continue;
      for (const file of listFiles(target)) {
        const text = readFileSync(file, "utf8");
        expect(text).not.toMatch(
          /thickSpherePhase3A|runThickSpherePhase3A|thick-sphere-phase3a|ThickSphereSpikeV1|thickSphereSpikeV1/,
        );
      }
    }
  });
});

function inputAtVolume(valueSI: number, rateSI: number) {
  return {
    coordinates: [coordinateAt(valueSI, rateSI)],
    instance: { moduleId: "kinematics", instanceId: "phase3a-test" },
  };
}

function coordinateAt(valueSI: number, rateSI: number): GeneralizedCoordinateState {
  return {
    id: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
    valueSI,
    previousValueSI: valueSI,
    rateSI,
    unit: "m3",
  };
}

function independentFormula(volume: number, params: ThickSphereSpikeV1ParameterSet) {
  const innerRadiusM = Math.cbrt((3 * volume) / (4 * Math.PI));
  const outerRadiusM = Math.cbrt((3 * (volume + params.wallReferenceVolumeM3)) / (4 * Math.PI));
  const midwallRadiusM = (innerRadiusM + outerRadiusM) / 2;
  const anchorInnerRadiusM = Math.cbrt((3 * params.anchorCavityVolumeM3) / (4 * Math.PI));
  const anchorOuterRadiusM = Math.cbrt(
    (3 * (params.anchorCavityVolumeM3 + params.wallReferenceVolumeM3)) / (4 * Math.PI),
  );
  const anchorMidwallRadiusM = (anchorInnerRadiusM + anchorOuterRadiusM) / 2;
  const sarcomereLengthM = params.anchorSarcomereLengthM * midwallRadiusM / anchorMidwallRadiusM;
  const fiberStretchRatio = sarcomereLengthM / params.slackSarcomereLengthM;
  const fiberEngineeringStrain = fiberStretchRatio - 1;
  const dStrainDVolume =
    (params.anchorSarcomereLengthM / (params.slackSarcomereLengthM * anchorMidwallRadiusM))
    * 0.5
    * (1 / (4 * Math.PI * innerRadiusM ** 2) + 1 / (4 * Math.PI * outerRadiusM ** 2));

  return {
    sarcomereLengthM,
    fiberStretchRatio,
    fiberEngineeringStrain,
    dStrainDVolume,
  };
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
