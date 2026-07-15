import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BLOOD_COMPARTMENT_IDS,
  CONTRACT_DIAGNOSTIC_HASH_ALGORITHM,
  DIRECTED_CLOSED_LOOP_EDGES,
  DIRECTED_INERTIAL_EDGES,
  FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1,
  FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS,
  FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID,
  FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1,
  FOUR_CHAMBER_PHASE_A0_SCOPE,
  FOUR_CHAMBER_SI_UNITS,
  FOUR_CHAMBER_SIGN_CONVENTIONS,
  IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
  INERTIAL_FLOW_IDS,
  LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
  LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
  MMHG_TO_PASCAL,
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
  TRISEG_ALGEBRAIC_COORDINATES,
  TRISEG_WALL_IDS,
  WALL_IDS,
  buildFourChamberNewtonScaleRegistryV1,
  buildFourChamberStateLayoutV1,
  compileLandWallAdapterContextV1,
  canonicalizeJson,
  evaluateAbsoluteValueV1,
  evaluateLandCaTrpnInversePowerCapV1,
  evaluateLandGammaSuV1,
  evaluateLandLengthReferenceV1,
  evaluateLandLengthDependenceV1,
  evaluateLandNominalToKirchhoffV1,
  evaluatePositivePartV1,
  evaluateUpperMinimumV1,
  deriveOdeResidualScalePerSec,
  fourChamberNewtonScaleRegistryHashPayloadV1,
  scaleJacobianEntry,
  scaleResidual,
  scaleUnknown,
  unscaleUnknown,
  validateFourChamberNewtonScaleRegistryV1,
  type FourChamberNewtonScaleRegistryInput,
  type TissueManifestV1,
} from "@/engine/myocardium/fourChamberV1";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  land2017CaT50,
  land2017CaTRPNUnblockingFactorDerivative,
  land2017GammaSuDerivative,
  land2017GammaWuDerivative,
  land2017LengthFactor,
} from "@/engine/myocardium/myofilament/land2017";

describe("four-chamber TriSeg/Land Phase A0 contracts", () => {
  it("freezes SI, sign, topology, and runtime boundaries without hidden volume or AVPD state", () => {
    expect(FOUR_CHAMBER_SI_UNITS).toMatchObject({
      time: "s",
      volume: "m^3",
      flow: "m^3/s",
      pressure: "Pa",
      calciumAtLandInterface: "uM",
    });
    expect(FOUR_CHAMBER_SIGN_CONVENTIONS.edgePressureDrop).toBe("P_upstream - P_downstream");
    expect(FOUR_CHAMBER_PHASE_A0_SCOPE).toMatchObject({
      modelCoreIntegration: false,
      browserRuntimeAdopted: false,
      mechanics2Dependency: false,
      clinicalReleaseReady: false,
    });
    expect(FOUR_CHAMBER_ACUTE_WALL_CONSTRAINTS).toMatchObject({
      deformationJacobianJ: 1,
      currentWallMaterialVolumeEqualsReference: true,
      kirchhoffFiberStressEqualsCauchyFiberStress: true,
      wallMaterialVolumeRemodelingWithinAcuteBeat: false,
    });

    expect(DIRECTED_INERTIAL_EDGES.map((edge) => edge.flowId)).toEqual(INERTIAL_FLOW_IDS);
    expect(DIRECTED_CLOSED_LOOP_EDGES).toHaveLength(8);
    for (const edge of DIRECTED_CLOSED_LOOP_EDGES) {
      const incidence = Object.fromEntries(BLOOD_COMPARTMENT_IDS.map((id) => [id, 0]));
      incidence[edge.upstream] -= 1;
      incidence[edge.downstream] += 1;
      expect(Object.values(incidence).reduce((sum, value) => sum + value, 0)).toBe(0);
    }
  });

  it("publishes the canonical patch-ready 59-state layout and keeps TriSeg coordinates algebraic", () => {
    const layout = FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1;
    const rebuilt = buildFourChamberStateLayoutV1();

    expect(layout.size).toBe(59);
    expect(layout.states).toHaveLength(59);
    expect(layout.states.map((state) => state.offset)).toEqual(Array.from({ length: 59 }, (_, index) => index));
    expect(new Set(layout.states.map((state) => state.key)).size).toBe(59);
    expect(layout.states.slice(0, 8).map((state) => state.label)).toEqual(BLOOD_COMPARTMENT_IDS.map((id) => `V_${id}`));
    expect(layout.states.slice(8, 14).map((state) => state.label)).toEqual(INERTIAL_FLOW_IDS);
    expect(layout.states.slice(14, 23).map((state) => state.label)).toEqual([
      "r", "d", "CaTRPN", "B", "W", "S", "xiW", "xiS", "alphaV",
    ]);
    expect(layout.blocks.map((block) => block.equationsId)).toEqual(expect.arrayContaining([
      "eight-volume-conservative-ledger-v1",
      "six-inertial-flow-momentum-v1",
      "event-two-state-prescribed-calcium-v1",
      "land2017-active-only-rate-free-xi-v1",
      "one-state-wall-sls-v1",
    ]));
    expect(layout.blocks.filter((block) => block.wallId !== undefined).map((block) => block.wallId)).toEqual(
      WALL_IDS.flatMap((wallId) => [wallId, wallId, wallId]),
    );
    expect(layout.states.filter((state) => state.wallId !== undefined).every((state) => state.patchId === "patch-0")).toBe(true);
    expect(layout.algebraicCoordinatesExcludedFromState).toEqual(TRISEG_ALGEBRAIC_COORDINATES);
    for (const forbidden of ["V_m_S", "y_m", "AVPD"]) {
      expect(layout.states.map((state) => state.label)).not.toContain(forbidden);
    }
    expect(layout.avpdStatePresent).toBe(false);
    expect(layout.hiddenBloodVolumeStatePresent).toBe(false);
    expect(layout.layoutDiagnosticHash).toBe(rebuilt.layoutDiagnosticHash);
    expect(layout.diagnosticHashAlgorithm).toBe(CONTRACT_DIAGNOSTIC_HASH_ALGORITHM);
    expect(Object.isFrozen(layout)).toBe(true);
    expect(Object.isFrozen(layout.states)).toBe(true);
  });

  it("separates wall slack geometry from Land length and preserves the exact work map", () => {
    const context = wallAdapterContext({ lambdaLandSlack: 0.95, fViable: 0.8 });
    expect(Object.isFrozen(context)).toBe(true);
    const length = evaluateLandLengthReferenceV1(context, {
      fiberLogStrain: Math.log(1.1),
      fiberLogStrainRatePerSec: -0.4,
    });
    expect(length.geometryStretch).toBeCloseTo(1.1, 14);
    expect(length.landStretch).toBeCloseTo(1.045, 14);
    expect(length.landEngineeringStrain).toBeCloseTo(0.045, 14);
    expect(length.landStretchRatePerSec).toBeCloseTo(-0.418, 14);
    expect(length.landStretchDerivativeByLogStrain).toBe(length.landStretch);
    expect(length.passiveAndSlsLogStrain).toBeCloseTo(Math.log(1.1), 14);

    const output = evaluateLandNominalToKirchhoffV1(context, {
      sourceStressConvention: "land2017-Ta",
      landActiveNominalStressPa: 20_000,
      landActiveNominalAlgorithmicTangentPaPerLandStretch: 5_000,
      length,
    });
    expect(output.adapterId).toBe(LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID);
    expect(output.wallActiveKirchhoffStressPa).toBeCloseTo(1.045 * 0.8 * 20_000, 12);
    expect(output.wallActiveStressPowerDensityWPerM3).toBeLessThan(0);
    expect(output.wallActiveMechanicalOutputPowerDensityWPerM3).toBeGreaterThan(0);
    expect(output.adapterWorkClosureResidualWPerM3).toBeCloseTo(0, 10);
    expect(output.wallAlgorithmicTangentPaPerFiberLogStrain).toBeCloseTo(
      0.8 * (1.045 * 20_000 + 1.045 ** 2 * 5_000),
      10,
    );
    const epsilon = 1e-6;
    const sourceTangent = 5_000;
    const sourceAt = (landStretch: number) => 20_000 + sourceTangent * (landStretch - length.landStretch);
    const mappedStressAt = (fiberLogStrain: number) => {
      const trialLength = evaluateLandLengthReferenceV1(context, {
        fiberLogStrain,
        fiberLogStrainRatePerSec: -0.4,
      });
      return evaluateLandNominalToKirchhoffV1(context, {
        sourceStressConvention: "land2017-Ta",
        landActiveNominalStressPa: sourceAt(trialLength.landStretch),
        length: trialLength,
      }).wallActiveKirchhoffStressPa;
    };
    const finiteDifferenceTangent = (
      mappedStressAt(length.passiveAndSlsLogStrain + epsilon)
      - mappedStressAt(length.passiveAndSlsLogStrain - epsilon)
    ) / (2 * epsilon);
    expect(output.wallAlgorithmicTangentPaPerFiberLogStrain).toBeCloseTo(finiteDifferenceTangent, 5);
  });

  it("rejects invalid adapter domains and makes zero viability mechanically explicit", () => {
    expect(() => wallAdapterContext({ lambdaLandSlack: 0 })).toThrow(/lambdaLandSlack/);
    const zeroViabilityContext = wallAdapterContext({ fViable: 0 });
    const length = evaluateLandLengthReferenceV1(zeroViabilityContext, {
      fiberLogStrain: 0.1,
      fiberLogStrainRatePerSec: 0.2,
    });
    const input = {
      sourceStressConvention: "land2017-Ta" as const,
      landActiveNominalStressPa: 10_000,
      length,
    };
    expect(evaluateLandNominalToKirchhoffV1(zeroViabilityContext, input).wallActiveKirchhoffStressPa).toBe(0);
    expect(() => wallAdapterContext({ fViable: 1.01 })).toThrow(/fViable/);
    expect(() => wallAdapterContext({ chiOrient: 0 })).toThrow(/chiOrient/);
    expect(() => wallAdapterContext({
      orientationRuleId: "unregistered-gain",
    })).toThrow(/only permits/);
    expect(() => wallAdapterContext({ allowFreeGain: true })).toThrow(/free gain/);

    const overflowContext = wallAdapterContext();
    const overflowLength = evaluateLandLengthReferenceV1(overflowContext, {
      fiberLogStrain: Math.log(2),
      fiberLogStrainRatePerSec: 0,
    });
    expect(() => evaluateLandNominalToKirchhoffV1(overflowContext, {
      sourceStressConvention: "land2017-Ta",
      landActiveNominalStressPa: Number.MAX_VALUE,
      length: overflowLength,
    })).toThrow(/non-finite/);

    const forgedContext = { ...overflowContext, fViable: 0 } as typeof overflowContext;
    expect(() => evaluateLandNominalToKirchhoffV1(forgedContext, {
      sourceStressConvention: "land2017-Ta",
      landActiveNominalStressPa: 100,
      length: overflowLength,
    })).toThrow(/compiled from a verified tissue manifest/);
    const forgedLength = { ...overflowLength };
    expect(() => evaluateLandNominalToKirchhoffV1(overflowContext, {
      sourceStressConvention: "land2017-Ta",
      landActiveNominalStressPa: 100,
      length: forgedLength,
    })).toThrow(/must be produced/);
  });

  it("implements exact generalized derivatives and re-evaluates active branches at ties", () => {
    expect(evaluateUpperMinimumV1(1.2, 1.2)).toEqual({
      value: 1.2,
      generalizedDerivative: 0,
      activeBranch: "capped",
    });
    expect(evaluateUpperMinimumV1(1.2 - 1e-8, 1.2).activeBranch).toBe("uncapped");
    expect(evaluatePositivePartV1(0).generalizedDerivative).toBe(0);
    expect(evaluatePositivePartV1(1e-8).activeBranch).toBe("positive");
    expect(evaluateAbsoluteValueV1(0).generalizedDerivative).toBe(0);
    expect(evaluateAbsoluteValueV1(-1).generalizedDerivative).toBe(-1);
    expect(evaluateLandGammaSuV1(-1, 10).generalizedDerivative).toBe(0);
    expect(evaluateLandGammaSuV1(0, 10).generalizedDerivative).toBe(0);
    expect(evaluateLandGammaSuV1(-1 - 1e-8, 10).activeBranch).toBe("negative-unbinding");
    expect(evaluateLandGammaSuV1(1e-8, 10).activeBranch).toBe("positive-unbinding");
    expect(() => evaluateLandGammaSuV1(Number.MAX_VALUE, 2)).toThrow(/non-finite/);

    const capped = evaluateLandCaTrpnInversePowerCapV1(0.01, 2, 100);
    expect(capped).toEqual({ value: 100, generalizedDerivative: 0, activeBranch: "capped" });
    expect(evaluateLandCaTrpnInversePowerCapV1(0.02, 2, 100).activeBranch).toBe("uncapped");
    expect(() => evaluateLandCaTrpnInversePowerCapV1(
      Number.MIN_VALUE,
      Number.MIN_VALUE,
      100,
    )).toThrow(/non-finite/);

    const p = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values;
    expect(land2017GammaWuDerivative(0, p)).toBe(0);
    expect(land2017GammaSuDerivative(-1, p)).toBe(0);
    expect(land2017GammaSuDerivative(0, p)).toBe(0);
    expect(land2017CaTRPNUnblockingFactorDerivative(Math.pow(100, -2 / p.nTm), p)).toBe(0);

    const at087 = evaluateLandLengthDependenceV1(0.87, p.CaT50Ref, p.beta0, p.beta1);
    expect(at087.caT50UM).toBeCloseTo(land2017CaT50(0.87, p), 14);
    expect(at087.lengthFactor).toBeCloseTo(land2017LengthFactor(0.87, p), 14);
    expect(at087.inner087CapBranch).toBe("capped");
    expect(at087.lengthFactorDerivativeByLandStretch).toBeCloseTo(p.beta0, 14);
    const at12 = evaluateLandLengthDependenceV1(1.2, p.CaT50Ref, p.beta0, p.beta1);
    expect(at12.stretchCapBranch).toBe("capped");
    expect(at12.caT50DerivativeByLandStretchUM).toBe(0);
    expect(at12.lengthFactorDerivativeByLandStretch).toBe(0);
    const h0Root = (1.87 - 1 / p.beta0) / 2;
    const atH0 = evaluateLandLengthDependenceV1(h0Root, p.CaT50Ref, p.beta0, p.beta1);
    expect(atH0.lengthFactor).toBeCloseTo(0, 14);
    expect(atH0.lengthFactorDerivativeByLandStretch).toBe(0);
    expect(() => evaluateLandLengthDependenceV1(
      0.86,
      p.CaT50Ref,
      -Number.MAX_VALUE,
      p.beta1,
    )).toThrow(/non-finite/);
  });

  it("builds immutable SI Newton scales and preserves scale algebra", () => {
    const registry = buildFourChamberNewtonScaleRegistryV1(newtonScaleFixture(), sha256);
    expect(FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1.bloodVolumeFloorM3).toBe(1e-4);
    expect(FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1.inertialFlowM3PerSec).toBe(1e-4);
    expect(FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1.junctionRadiusM).toBe(0.03);
    expect(FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1.flowMomentumResidualPa).toBeCloseTo(10 * MMHG_TO_PASCAL, 12);
    expect(FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1.pressureScalePa).toBeCloseTo(100 * MMHG_TO_PASCAL, 12);
    expect(registry.unknownScales.bloodVolumeM3.LA).toBe(1e-4);
    expect(registry.unknownScales.bloodVolumeM3.LV).toBe(140e-6);
    expect(registry.unknownScales.landDistortionByWall.LA).toBe(0.4);
    expect(registry.residualScales.tissueStressByWallPa.LVFW).toBe(40_500);
    expect(registry.residualScales.publishedTriSegEquilibriumNPerM).toBeGreaterThan(0);
    expect(registry.registryDiagnosticHash).toBe(
      buildFourChamberNewtonScaleRegistryV1(newtonScaleFixture(), sha256).registryDiagnosticHash,
    );
    expect(registry.registryContentSha256).toBe(
      buildFourChamberNewtonScaleRegistryV1(newtonScaleFixture(), sha256).registryContentSha256,
    );
    expect(registry.registryContentSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(validateFourChamberNewtonScaleRegistryV1(registry, sha256)).toBe(registry);
    expect(() => validateFourChamberNewtonScaleRegistryV1({
      ...registry,
      unknownScales: { ...registry.unknownScales, fiberLogStrain: -0.1 },
    }, sha256)).toThrow(/positive/);
    expect(() => validateFourChamberNewtonScaleRegistryV1({
      ...registry,
      hiddenAdaptiveScale: 7,
    } as never, sha256)).toThrow(/unknown fields/);
    expect(registry.unknownOffsets).toEqual({
      default: 0,
      septalMidwallVolumeM3: 0,
      junctionRadiusM: 0,
      evidenceId: "zero-offset-v1",
    });
    expect(registry.unknownScales.calciumInterfaceUM).toBe(1);
    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.isFrozen(registry.unknownScales.bloodVolumeM3)).toBe(true);
    const hashPayload = fourChamberNewtonScaleRegistryHashPayloadV1(registry);
    expect(Object.isFrozen(hashPayload)).toBe(true);
    expect(hashPayload.unknownScales).toBe(registry.unknownScales);

    const scaled = scaleUnknown(3.2, 0.4, 1.2);
    expect(unscaleUnknown(scaled, 0.4, 1.2)).toBeCloseTo(3.2, 14);
    expect(scaleResidual(20, 5)).toBe(4);
    expect(deriveOdeResidualScalePerSec(0.1)).toBe(0.1);
    expect(scaleJacobianEntry(10, 0.4, 5)).toBeCloseTo(0.8, 14);
    expect(() => scaleUnknown(Number.MAX_VALUE, Number.MIN_VALUE, 0)).toThrow(/non-finite/);
    expect(() => unscaleUnknown(Number.MAX_VALUE, Number.MAX_VALUE, 0)).toThrow(/non-finite/);
    expect(() => scaleResidual(Number.MAX_VALUE, Number.MIN_VALUE)).toThrow(/non-finite/);
    expect(() => scaleJacobianEntry(Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE)).toThrow(
      /non-finite/,
    );

    const centered = buildFourChamberNewtonScaleRegistryV1({
      ...newtonScaleFixture(),
      referenceCenteredGeometryOffsets: {
        septalMidwallVolumeM3: 12e-6,
        junctionRadiusM: 0.004,
        evidenceId: "geometry-reference-center-v1",
      },
    }, sha256);
    expect(centered.unknownOffsets.septalMidwallVolumeM3).toBe(12e-6);
    expect(centered.registryContentSha256).not.toBe(registry.registryContentSha256);
  });

  it("keeps the new core isolated from ModelCore, mechanics2, UI, and legacy runtime", () => {
    const root = path.join(process.cwd(), "engine", "myocardium", "fourChamberV1");
    const disallowed = ["/ModelCore", "/chambers", "/mechanics2", "/components", "/runtime"];
    const leaks = collectTsFiles(root).flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return importSpecifiers(text)
        .filter((specifier) => disallowed.some((fragment) => specifier.includes(fragment)))
        .map((specifier) => `${path.relative(process.cwd(), file)} -> ${specifier}`);
    });
    expect(leaks).toEqual([]);
    expect(readFileSync(path.join(process.cwd(), "engine", "ModelCore.ts"), "utf8")).not.toContain(
      "fourChamberV1",
    );
    const inboundRuntimeReferences = ["engine", "components", "contexts", "features", "hooks"]
      .map((directory) => path.join(process.cwd(), directory))
      .filter(existsSync)
      .flatMap(collectRuntimeSourceFiles)
      .filter((file) => !file.includes(`${path.sep}engine${path.sep}myocardium${path.sep}fourChamberV1${path.sep}`))
      .filter((file) => readFileSync(file, "utf8").includes("fourChamberV1"));
    expect(inboundRuntimeReferences).toEqual([]);
  });
});

function newtonScaleFixture(): FourChamberNewtonScaleRegistryInput {
  const referenceBloodVolumesM3 = Object.fromEntries(
    BLOOD_COMPARTMENT_IDS.map((id, index) => [id, index === 0 ? 50e-6 : 140e-6]),
  ) as Record<(typeof BLOOD_COMPARTMENT_IDS)[number], number>;
  const landDistortionCoefficientsByWall = Object.fromEntries(
    WALL_IDS.map((id) => [id, { Aw: id === "LA" ? 0.4 : 0.2, As: 0.3 }]),
  ) as FourChamberNewtonScaleRegistryInput["landDistortionCoefficientsByWall"];
  const tissueStressInputsByWall = Object.fromEntries(WALL_IDS.map((id) => [id, {
    landReferenceTensionPa: id === "LVFW" ? 40_500 : 20_000,
    passiveTensileStressScalePa: 12_000,
    compressionStressScalePa: 8_000,
  }])) as FourChamberNewtonScaleRegistryInput["tissueStressInputsByWall"];
  const triSegInputsByWall = Object.fromEntries(TRISEG_WALL_IDS.map((id) => [id, {
    wallReferenceMaterialVolumeM3: 120e-6,
    midwallReferenceAreaM2: 0.012,
  }])) as FourChamberNewtonScaleRegistryInput["triSegInputsByWall"];
  return {
    referenceBloodVolumesM3,
    landDistortionCoefficientsByWall,
    tissueStressInputsByWall,
    triSegInputsByWall,
  };
}

function wallAdapterContext(overrides: {
  lambdaLandSlack?: number;
  fViable?: number;
  chiOrient?: number;
  orientationRuleId?: string;
  allowFreeGain?: boolean;
} = {}) {
  const payload = {
    schemaId: FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID,
    familyId: "fixture-wall-context-v1",
    tissueClass: "ventricular",
    status: "candidate-prior",
    temperatureK: 310.15,
    calciumUnitConvention: "uM",
    land: {
      modelId: "land2017-myofilament-v1",
      equationsVersion: "land2017-source-equations-appendix-a-v1",
      activeOnly: true,
      sourceStressConvention: "land2017-Ta",
      primitiveParameters: [manifestParameter("land.Tref", "primitive", 40_500)],
      derivedParameters: [manifestParameter("land.Aw", "derived", 0.25)],
    },
    prescribedCalcium: {
      modelId: "event-two-exponential-prescribed-calcium-v1",
      parameters: [manifestParameter("calcium.tauRiseSec", "primitive", 0.03)],
    },
    passiveSls: {
      equilibriumModelId: "four-chamber-passive-energy-v1",
      slsModelId: "one-state-wall-sls-v1",
      slsEnabled: true,
      parameters: [manifestParameter("sls.tauSec", "primitive", 0.08)],
    },
    lengthReference: {
      adapterId: LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
      lambdaLandSlack: overrides.lambdaLandSlack ?? 1,
      evidenceId: "v1-default-no-independent-prestrain-evidence",
      owner: "tissue-manifest",
    },
    homogenization: {
      orientationRuleId: overrides.orientationRuleId ?? IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
      stressWorkAdapterId: LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
      chiOrient: overrides.chiOrient ?? 1,
      allowFreeGain: overrides.allowFreeGain ?? false,
      fitToPVLoop: false,
    },
    viability: {
      fViable: overrides.fViable ?? 1,
      evidenceId: "healthy-default-v1",
      owner: "independent-scar-viability-evidence",
    },
    provenance: {
      sourceReferences: ["fixture-source-only"],
      transformationRules: ["fixture-identity-transform"],
    },
    targetPack: { id: "fixture-pack", sha256: "1".repeat(64) },
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
  };
  const manifest = {
    ...payload,
    contentSha256: sha256(canonicalizeJson(payload)),
  } as unknown as TissueManifestV1;
  return compileLandWallAdapterContextV1(manifest, sha256);
}

function manifestParameter(name: string, kind: "primitive" | "derived", runtimeValue: number) {
  return {
    name,
    kind,
    runtimeValue,
    runtimeUnit: "declared-unit",
    sourceValue: runtimeValue,
    sourceUnit: "source-unit",
    sourceId: "fixture-source-only",
    sourceLocation: "fixture-location",
    transformationRule: "fixture-identity-transform",
  };
}

function collectTsFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTsFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".ts") ? [fullPath] : [];
  });
}

function collectRuntimeSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") return [];
      return collectRuntimeSourceFiles(fullPath);
    }
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [fullPath] : [];
  });
}

function importSpecifiers(source: string): string[] {
  return [...source.matchAll(/\b(?:import|export)\b(?:\s+type)?(?:[^'\"]*?\sfrom\s*)?["']([^"']+)["']/g)]
    .map((match) => match[1]);
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
