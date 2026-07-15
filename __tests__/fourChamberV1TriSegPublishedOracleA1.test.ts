import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  evaluateSignedSphericalCapVolumeV1,
  invertSignedSphericalCapVolumeV1,
} from "@/engine/myocardium/fourChamberV1/triseg/signedSphericalCapV1";
import {
  evaluatePublishedTriSegGeometryV1,
  evaluatePublishedTriSegWallGeometryV1,
  type PublishedTriSegGeometryInputV1,
  type PublishedTriSegWallGeometryV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID,
  classifyPublishedTriSegTaylorDomainV1,
  evaluatePublishedTriSegTaylorOracle2009V1,
  evaluatePublishedTriSegTaylorWallV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";
import {
  TRISEG_APPENDIX_AC_PRIMARY_SOURCE_CANDIDATE_V1_STATUS,
  evaluateTriSegAppendixAcPrimarySourceCandidateV1,
  evaluateTriSegAppendixAcPrimarySourceWallCandidateV1,
  evaluateTriSegAppendixCAtanhOverArgumentV1,
  evaluateTriSegAppendixCGMinusTwoV1,
} from "@/engine/myocardium/fourChamberV1/triseg/appendixAcPrimarySourceCandidateV1";
import {
  auditTriSegAppendixAcSeriesOverlapV1,
  evaluateTriSegAppendixCAtanhOverArgumentWithDiagnosticsV1,
  evaluateTriSegAppendixCGMinusTwoWithDiagnosticsV1,
  evaluateTriSegAppendixCZTimesGPrimeV1,
} from "@/engine/myocardium/fourChamberV1/triseg/appendixAcStableFunctionsV1";
import {
  STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SHA256,
  STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS,
  evaluateStabilizedTriSegAppendixAcKernelV1,
  evaluateStabilizedTriSegAppendixAcReferenceV1,
  evaluateStabilizedTriSegAppendixAcWallReferenceV1,
  validateStabilizedTriSegAppendixAcHighPrecisionPackV1,
} from "@/engine/myocardium/fourChamberV1/triseg/stabilizedAppendixAcReferenceV1";

describe("four-chamber v1 Phase A1 published TriSeg component", () => {
  it("inverts the signed spherical cap continuously and exposes both implicit derivatives", () => {
    const junctionRadiusM = 0.03;
    const samplesM3 = [-2e-4, -1e-8, -1e-12, 0, 1e-12, 1e-8, 2e-4];

    for (const signedVolumeM3 of samplesM3) {
      const inverse = invertSignedSphericalCapVolumeV1(signedVolumeM3, junctionRadiusM);
      const recovered = evaluateSignedSphericalCapVolumeV1(inverse.signedCapHeightM, junctionRadiusM);
      expect(Math.abs(recovered - signedVolumeM3)).toBeLessThanOrEqual(
        2e-15 * Math.max(Math.abs(signedVolumeM3), 1e-12),
      );

      const volumeStepM3 = Math.max(Math.abs(signedVolumeM3) * 2e-6, 1e-12);
      const finiteDifferenceByVolume = (
        invertSignedSphericalCapVolumeV1(signedVolumeM3 + volumeStepM3, junctionRadiusM).signedCapHeightM
        - invertSignedSphericalCapVolumeV1(signedVolumeM3 - volumeStepM3, junctionRadiusM).signedCapHeightM
      ) / (2 * volumeStepM3);
      expect(relativeError(
        finiteDifferenceByVolume,
        inverse.capHeightDerivativeByVolumePerM2,
      )).toBeLessThan(2e-8);

      const radiusStepM = junctionRadiusM * 1e-6;
      const finiteDifferenceByRadius = (
        invertSignedSphericalCapVolumeV1(signedVolumeM3, junctionRadiusM + radiusStepM).signedCapHeightM
        - invertSignedSphericalCapVolumeV1(signedVolumeM3, junctionRadiusM - radiusStepM).signedCapHeightM
      ) / (2 * radiusStepM);
      expect(Math.abs(
        finiteDifferenceByRadius - inverse.capHeightDerivativeByJunctionRadiusAtFixedVolume,
      )).toBeLessThan(2e-8 * Math.max(1, Math.abs(finiteDifferenceByRadius)));
    }

    const positive = invertSignedSphericalCapVolumeV1(4e-5, junctionRadiusM);
    const negative = invertSignedSphericalCapVolumeV1(-4e-5, junctionRadiusM);
    expect(negative.signedCapHeightM).toBe(-positive.signedCapHeightM);
    expect(invertSignedSphericalCapVolumeV1(0, junctionRadiusM)).toMatchObject({
      signedCapHeightM: 0,
      capHeightDerivativeByJunctionRadiusAtFixedVolume: 0,
    });
  });

  it("preserves the published common-axis normal signs and positive LV/RV cavity pressures", () => {
    const geometry = evaluatePublishedTriSegGeometryV1(physiologicalGeometryInput());
    expect(geometry.walls.LVFW.signedCapHeightM).toBeLessThan(0);
    expect(geometry.walls.LVFW.signedMidwallCurvaturePerM).toBeLessThan(0);
    expect(geometry.walls.SEP.signedCapHeightM).toBeGreaterThan(0);
    expect(geometry.walls.SEP.signedMidwallCurvaturePerM).toBeGreaterThan(0);
    expect(geometry.walls.RVFW.signedCapHeightM).toBeGreaterThan(0);
    expect(geometry.walls.RVFW.signedMidwallCurvaturePerM).toBeGreaterThan(0);
    expect(Object.values(geometry.walls).every((wall) => Number.isFinite(wall.fiberLogStrain))).toBe(true);

    const oracle = evaluatePublishedTriSegTaylorOracle2009V1(geometry, {
      LVFW: 80_000,
      SEP: 60_000,
      RVFW: 45_000,
    });
    expect(oracle.oracleId).toBe(PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID);
    expect(oracle.cavityTransmuralPressuresPa.LV).toBeGreaterThan(0);
    expect(oracle.cavityTransmuralPressuresPa.RV).toBeGreaterThan(0);
    expect(oracle.domainClassification).toBe("within_2pct_tension_error_domain");
    expect(oracle.taylorTensionErrorDomainEligible).toBe(true);
    // Domain eligibility is only a necessary gate. This arbitrary geometry is
    // intentionally not a converged TriSeg root and must not be called accepted.
    expect(oracle.equilibriumResidual.euclideanNPerM).toBeGreaterThan(1);
  });

  it("is continuous at a flat septum and through signed curvature reversal", () => {
    const junctionRadiusM = 0.03;
    const parameters = { wallMaterialVolumeM3: 4e-5, referenceMidwallAreaM2: Math.PI * junctionRadiusM ** 2 };
    const volumeStepM3 = 1e-12;
    const negative = evaluatePublishedTriSegWallGeometryV1("SEP", -volumeStepM3, junctionRadiusM, parameters);
    const flat = evaluatePublishedTriSegWallGeometryV1("SEP", 0, junctionRadiusM, parameters);
    const positive = evaluatePublishedTriSegWallGeometryV1("SEP", volumeStepM3, junctionRadiusM, parameters);

    expect(negative.signedCapHeightM).toBe(-positive.signedCapHeightM);
    expect(negative.signedMidwallCurvaturePerM).toBe(-positive.signedMidwallCurvaturePerM);
    expect(negative.thicknessCurvatureRatioZ).toBe(-positive.thicknessCurvatureRatioZ);
    expect(negative.midwallAreaM2).toBe(positive.midwallAreaM2);
    expect(negative.fiberLogStrain).toBe(positive.fiberLogStrain);
    expect(flat.signedCapHeightM).toBe(0);
    expect(flat.signedMidwallCurvaturePerM).toBe(0);
    expect(flat.thicknessCurvatureRatioZ).toBe(0);
    expect(flat.fiberLogStrain).toBeCloseTo(0, 15);

    const negativeTension = evaluatePublishedTriSegTaylorWallV1(negative, 50_000);
    const flatTension = evaluatePublishedTriSegTaylorWallV1(flat, 50_000);
    const positiveTension = evaluatePublishedTriSegTaylorWallV1(positive, 50_000);
    expect(negativeTension.axialJunctionTensionNPerM).toBe(-positiveTension.axialJunctionTensionNPerM);
    expect(negativeTension.radialJunctionTensionNPerM).toBe(positiveTension.radialJunctionTensionNPerM);
    expect(negativeTension.transmuralPressurePa).toBe(-positiveTension.transmuralPressurePa);
    expect(flatTension.transmuralPressurePa).toBe(0);
  });

  it("assembles the original two junction-force equilibrium residuals", () => {
    const junctionRadiusM = 0.03;
    const signedFreeWallHeightM = Math.sqrt(3) * junctionRadiusM;
    const signedFreeWallCapVolumeM3 = evaluateSignedSphericalCapVolumeV1(
      signedFreeWallHeightM,
      junctionRadiusM,
    );
    const wallMaterialVolumeM3 = 2e-5;
    const cavityVolumeM3 = signedFreeWallCapVolumeM3 - wallMaterialVolumeM3;
    const geometry = evaluatePublishedTriSegGeometryV1({
      leftVentricularCavityVolumeM3: cavityVolumeM3,
      rightVentricularCavityVolumeM3: cavityVolumeM3,
      septalMidwallCapVolumeM3: 0,
      junctionRadiusM,
      walls: {
        LVFW: wallParameters(wallMaterialVolumeM3, 4 * Math.PI * junctionRadiusM ** 2),
        SEP: wallParameters(wallMaterialVolumeM3, Math.PI * junctionRadiusM ** 2),
        RVFW: wallParameters(wallMaterialVolumeM3, 4 * Math.PI * junctionRadiusM ** 2),
      },
    });
    expect(geometry.walls.LVFW.signedCapHeightM).toBeCloseTo(-signedFreeWallHeightM, 14);
    expect(geometry.walls.SEP.signedCapHeightM).toBe(0);
    expect(geometry.walls.RVFW.signedCapHeightM).toBeCloseTo(signedFreeWallHeightM, 14);

    const targetTensionNPerM = 1_000;
    const oracle = evaluatePublishedTriSegTaylorOracle2009V1(geometry, {
      LVFW: stressForTargetTension(geometry.walls.LVFW, targetTensionNPerM),
      SEP: stressForTargetTension(geometry.walls.SEP, targetTensionNPerM),
      RVFW: stressForTargetTension(geometry.walls.RVFW, targetTensionNPerM),
    });
    expect(Math.abs(oracle.equilibriumResidual.axialNPerM)).toBeLessThan(2e-12 * targetTensionNPerM);
    expect(Math.abs(oracle.equilibriumResidual.radialNPerM)).toBeLessThan(2e-12 * targetTensionNPerM);
    expect(oracle.equilibriumResidual.euclideanNPerM).toBeLessThan(3e-12 * targetTensionNPerM);
  });

  it("regresses the closed-form x=plus-or-minus-y 2009 Taylor reference and the strict z envelope", () => {
    const junctionRadiusM = 0.03;
    const targetZ = 0.4;
    const freeWallMaterialVolumeM3 = (4 * Math.PI / 3) * junctionRadiusM ** 3 * targetZ;
    const septalWallMaterialVolumeM3 = freeWallMaterialVolumeM3 / 10;
    const capVolumeM3 = evaluateSignedSphericalCapVolumeV1(junctionRadiusM, junctionRadiusM);
    const cavityVolumeM3 = capVolumeM3
      - 0.5 * (freeWallMaterialVolumeM3 + septalWallMaterialVolumeM3);
    const freeWallAreaM2 = 2 * Math.PI * junctionRadiusM ** 2;
    const geometry = evaluatePublishedTriSegGeometryV1({
      leftVentricularCavityVolumeM3: cavityVolumeM3,
      rightVentricularCavityVolumeM3: cavityVolumeM3,
      septalMidwallCapVolumeM3: 0,
      junctionRadiusM,
      walls: {
        LVFW: wallParameters(freeWallMaterialVolumeM3, freeWallAreaM2),
        SEP: wallParameters(septalWallMaterialVolumeM3, Math.PI * junctionRadiusM ** 2),
        RVFW: wallParameters(freeWallMaterialVolumeM3, freeWallAreaM2),
      },
    });
    const stressPa = 80_000;
    const oracle = evaluatePublishedTriSegTaylorOracle2009V1(geometry, {
      LVFW: stressPa,
      SEP: 0,
      RVFW: stressPa,
    });
    // Frozen closed-form evaluation of Lumens et al. (2009), Eqs. 15-16,
    // for y=30 mm, x=+/-y, z=+/-0.4, and sigma_f=80 kPa.
    const publishedReference = {
      fiberLogStrain: -0.013819733333333336,
      representativeMidwallTensionNPerM: 338.7050666666666,
      rightTransmuralPressurePa: 22_580.337777777775,
    } as const;

    expect(geometry.walls.LVFW.signedCapHeightM).toBeCloseTo(-junctionRadiusM, 14);
    expect(geometry.walls.RVFW.signedCapHeightM).toBeCloseTo(junctionRadiusM, 14);
    expect(geometry.walls.LVFW.thicknessCurvatureRatioZ).toBeCloseTo(-targetZ, 14);
    expect(geometry.walls.RVFW.thicknessCurvatureRatioZ).toBeCloseTo(targetZ, 14);
    expect(geometry.walls.RVFW.fiberLogStrain).toBeCloseTo(publishedReference.fiberLogStrain, 14);
    expect(oracle.walls.LVFW.representativeMidwallTensionNPerM).toBeCloseTo(
      publishedReference.representativeMidwallTensionNPerM,
      12,
    );
    expect(oracle.walls.LVFW.axialJunctionTensionNPerM).toBeCloseTo(
      -publishedReference.representativeMidwallTensionNPerM,
      12,
    );
    expect(oracle.walls.RVFW.axialJunctionTensionNPerM).toBeCloseTo(
      publishedReference.representativeMidwallTensionNPerM,
      12,
    );
    expect(oracle.walls.LVFW.radialJunctionTensionNPerM).toBeCloseTo(0, 12);
    expect(oracle.walls.RVFW.transmuralPressurePa).toBeCloseTo(
      publishedReference.rightTransmuralPressurePa,
      10,
    );

    expect(classifyPublishedTriSegTaylorDomainV1(0.68)).toBe("within_2pct_tension_error_domain");
    expect(classifyPublishedTriSegTaylorDomainV1(0.7)).toBe(
      "within_0p8_diagnostic_envelope_but_exceeds_2pct_tension_error",
    );
    expect(classifyPublishedTriSegTaylorDomainV1(0.79)).toBe(
      "within_0p8_diagnostic_envelope_but_exceeds_2pct_tension_error",
    );
    expect(classifyPublishedTriSegTaylorDomainV1(0.8)).toBe("out_of_domain");
    expect(classifyPublishedTriSegTaylorDomainV1(1.2)).toBe("out_of_domain");
    expect(oracle.walls.RVFW.taylorTensionRelativeError).toBeCloseTo(
      (1.0591223254840045 - 1.0584533333333332) / 1.0591223254840045,
      14,
    );
  });

  it("freezes the stabilized Appendix-A/C reference and independent high-precision pack", () => {
    const pack = validateStabilizedTriSegAppendixAcHighPrecisionPackV1(sha256);
    expect(STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS).toMatchObject({
      status: "canonical-component-reference",
      normativeWithinOriginalSphericalOneFiberAssumptions: true,
      anatomicalTruthClaimed: false,
      physiologicalValidationClaimed: false,
      triSegRootAcceptanceImplied: false,
      closedLoopReleaseEligible: false,
      sourceDoi: "10.1007/s10439-009-9774-2",
    });
    expect(pack.vectors).toHaveLength(11);
    expect(STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SHA256).toBe(
      "c2ff9b98ebfc2015a13ccab399f8240790859515f90af061110a0aa69b4c7cee",
    );
    expect(pack.arithmetic).toMatchObject({
      precisionDecimalDigits: 180,
      precisionStabilityAuditDecimalDigits: 240,
      serializedSignificantDigits: 80,
      strainDerivativeEquationPath: "differentiate-normalized-c5a-via-direct-g-prime",
      tensionEquationPath: "appendix-a4-direct-atanh-over-z",
    });
    for (const vector of pack.vectors) {
      const output = evaluateStabilizedTriSegAppendixAcKernelV1({
        midwallAreaM2: Number(vector.input.midwallAreaM2),
        referenceMidwallAreaM2: Number(vector.input.referenceMidwallAreaM2),
        sourceSphereCurvatureVariableX: Number(vector.input.sourceSphereCurvatureVariableX),
        thicknessCurvatureRatioZ: Number(vector.input.thicknessCurvatureRatioZ),
      });
      expect(relativeError(output.gXMinusTwo.value, Number(vector.expected.gXMinusTwo)))
        .toBeLessThan(4e-14);
      expect(relativeError(output.gZMinusTwo.value, Number(vector.expected.gZMinusTwo)))
        .toBeLessThan(4e-14);
      expect(relativeError(output.atanhOverZ.value, Number(vector.expected.atanhOverZ)))
        .toBeLessThan(4e-14);
      expect(relativeError(output.fiberLogStrain, Number(vector.expected.fiberLogStrain)))
        .toBeLessThan(4e-14);
      expect(relativeError(
        output.strainDerivativeByMidwallAreaAtFixedCurvaturePerM2,
        Number(vector.expected.strainDerivativeByMidwallAreaAtFixedCurvaturePerM2),
      )).toBeLessThan(4e-14);
      expect(relativeError(
        output.tensionPerWallVolumeStressPerM2,
        Number(vector.expected.tensionPerWallVolumeStressPerM2),
      )).toBeLessThan(4e-14);
      expect(Math.abs(output.appendixA6WorkConjugacyResidualPerM2)
        / output.tensionPerWallVolumeStressPerM2).toBeLessThan(4e-14);
    }
  });

  it("rejects forged geometry and non-finite material inputs", () => {
    const geometry = evaluatePublishedTriSegGeometryV1(physiologicalGeometryInput());
    expect(() => evaluatePublishedTriSegTaylorOracle2009V1({ ...geometry }, {
      LVFW: 80_000,
      SEP: 60_000,
      RVFW: 45_000,
    })).toThrow(/must be produced/);
    expect(() => evaluatePublishedTriSegTaylorWallV1({ ...geometry.walls.LVFW }, 80_000)).toThrow(
      /must be produced/,
    );
    expect(() => evaluatePublishedTriSegTaylorWallV1(geometry.walls.LVFW, Number.NaN)).toThrow(
      /must be finite/,
    );
    expect(() => invertSignedSphericalCapVolumeV1(1e-5, 0)).toThrow(/junctionRadiusM/);
    expect(() => evaluatePublishedTriSegGeometryV1({
      ...physiologicalGeometryInput(),
      empiricalPressureGain: 2,
    } as never)).toThrow(/must contain exactly/);
    expect(() => evaluatePublishedTriSegGeometryV1({
      ...physiologicalGeometryInput(),
      walls: {
        ...physiologicalGeometryInput().walls,
        EXTRA: wallParameters(1e-5, 1e-3),
      },
    } as never)).toThrow(/input\.walls must contain exactly/);
    expect(() => evaluatePublishedTriSegTaylorOracle2009V1(geometry, {
      LVFW: 80_000,
      SEP: 60_000,
      RVFW: 45_000,
      empiricalStressGain: 2,
    } as never)).toThrow(/fiberKirchhoffStressPa must contain exactly/);
  });

  it("stabilizes the primary-source Appendix-C functions at zero against independent Decimal vectors", () => {
    expect(evaluateTriSegAppendixCGMinusTwoV1(0)).toBe(0);
    expect(evaluateTriSegAppendixCAtanhOverArgumentV1(0)).toBe(1);
    expect(evaluateTriSegAppendixCGMinusTwoV1(1e-20) / (-1e-40 / 3)).toBeCloseTo(1, 15);
    expect(evaluateTriSegAppendixCGMinusTwoV1(-1e-20)).toBe(
      evaluateTriSegAppendixCGMinusTwoV1(1e-20),
    );
    expect(evaluateTriSegAppendixCAtanhOverArgumentV1(-0.4)).toBe(
      evaluateTriSegAppendixCAtanhOverArgumentV1(0.4),
    );
    expect(evaluateTriSegAppendixCZTimesGPrimeV1(0)).toBe(0);
    expect(evaluateTriSegAppendixCZTimesGPrimeV1(-0.4)).toBe(
      evaluateTriSegAppendixCZTimesGPrimeV1(0.4),
    );
    expect(evaluateTriSegAppendixCGMinusTwoV1(0.4)).toBeCloseTo(
      -0.0561087361767687184256519197850347823,
      15,
    );
    expect(evaluateTriSegAppendixCAtanhOverArgumentV1(0.79)).toBeCloseTo(
      1.35624263804894430359316863902259287,
      14,
    );
    const switchValue = evaluateTriSegAppendixCGMinusTwoWithDiagnosticsV1(0.125);
    const directValue = evaluateTriSegAppendixCGMinusTwoWithDiagnosticsV1(0.125000000001);
    const atanhSwitch = evaluateTriSegAppendixCAtanhOverArgumentWithDiagnosticsV1(0.125);
    expect(switchValue.branch).toBe("even-power-series");
    expect(directValue.branch).toBe("direct-log1p");
    expect(switchValue.nextTermsAbsoluteRemainderUpperBound).toBeLessThan(5e-18);
    expect(atanhSwitch.nextTermsAbsoluteRemainderUpperBound).toBeLessThan(5e-18);
    expect(auditTriSegAppendixAcSeriesOverlapV1()).toMatchObject({ accepted: true });
  });

  it("keeps the Appendix-A/C reconstruction non-normative while matching high-precision x=0.2 z=0.4 vectors", () => {
    const junctionRadiusM = 0.03;
    const z = 0.4;
    const wallMaterialVolumeM3 = (4 * Math.PI / 3) * junctionRadiusM ** 3 * z;
    const wall = evaluatePublishedTriSegWallGeometryV1(
      "RVFW",
      evaluateSignedSphericalCapVolumeV1(junctionRadiusM, junctionRadiusM),
      junctionRadiusM,
      wallParameters(wallMaterialVolumeM3, 2 * Math.PI * junctionRadiusM ** 2),
    );
    const candidate = evaluateTriSegAppendixAcPrimarySourceWallCandidateV1(wall, 80_000);

    expect(TRISEG_APPENDIX_AC_PRIMARY_SOURCE_CANDIDATE_V1_STATUS).toMatchObject({
      evidenceStatus: "primary-source-reconstruction-only",
      normativeReleaseReference: false,
      canonicalReferenceBlockerRetained: false,
      canonicalReferencePromotionId:
        "lumens-2009-appendix-ac-stabilized-analytical-reference-v1",
    });
    expect(candidate.sourceSphereCurvatureVariableX).toBeCloseTo(0.2, 14);
    expect(candidate.analyticalFiberLogStrain).toBeCloseTo(
      -0.0129024795459060779677036892934608466,
      14,
    );
    expect(candidate.analyticalMidwallTensionNPerM).toBeCloseTo(
      338.91914415488144548404300260826161,
      12,
    );
    expect(candidate.transmuralPressurePa).toBeCloseTo(
      22_594.6096103254296989362001738841,
      10,
    );
    const referenceWall = evaluateStabilizedTriSegAppendixAcWallReferenceV1(wall, 80_000);
    expect(referenceWall.kernel.fiberLogStrain).toBeCloseTo(candidate.analyticalFiberLogStrain, 14);
    expect(referenceWall.analyticalMidwallTensionNPerM).toBeCloseTo(
      candidate.analyticalMidwallTensionNPerM,
      12,
    );
    expect(Math.abs(referenceWall.workConjugacyResidualNPerM)
      / Math.abs(referenceWall.analyticalMidwallTensionNPerM)).toBeLessThan(4e-14);

    const baseArea = wall.midwallAreaM2;
    const areaStep = baseArea * 1e-5;
    const baseZ = referenceWall.kernel.input.thicknessCurvatureRatioZ;
    const fixedCurvatureX = referenceWall.kernel.input.sourceSphereCurvatureVariableX;
    const strainAtArea = (areaM2: number) => evaluateStabilizedTriSegAppendixAcKernelV1({
      midwallAreaM2: areaM2,
      referenceMidwallAreaM2: wall.parameters.referenceMidwallAreaM2,
      sourceSphereCurvatureVariableX: fixedCurvatureX,
      thicknessCurvatureRatioZ: baseZ * baseArea / areaM2,
    }).fiberLogStrain;
    const finiteDifferenceDerivative = (
      strainAtArea(baseArea + areaStep) - strainAtArea(baseArea - areaStep)
    ) / (2 * areaStep);
    expect(relativeError(
      finiteDifferenceDerivative,
      referenceWall.kernel.strainDerivativeByMidwallAreaAtFixedCurvaturePerM2,
    )).toBeLessThan(2e-10);

    const flat = evaluatePublishedTriSegWallGeometryV1(
      "SEP",
      0,
      junctionRadiusM,
      wallParameters(4e-5, Math.PI * junctionRadiusM ** 2),
    );
    const flatCandidate = evaluateTriSegAppendixAcPrimarySourceWallCandidateV1(flat, 50_000);
    expect(flatCandidate.sourceSphereCurvatureVariableX).toBe(0);
    expect(flatCandidate.thicknessCurvatureRatioZ).toBe(0);
    expect(flatCandidate.analyticalFiberLogStrain).toBeCloseTo(0, 15);
    expect(flatCandidate.transmuralPressurePa).toBe(0);

    const wholeCandidate = evaluateTriSegAppendixAcPrimarySourceCandidateV1(
      evaluatePublishedTriSegGeometryV1(physiologicalGeometryInput()),
      { LVFW: 80_000, SEP: 60_000, RVFW: 45_000 },
    );
    expect(wholeCandidate.status.normativeReleaseReference).toBe(false);
    expect(wholeCandidate.cavityTransmuralPressuresPa.LV).toBeGreaterThan(0);
    expect(wholeCandidate.cavityTransmuralPressuresPa.RV).toBeGreaterThan(0);
    const wholeReference = evaluateStabilizedTriSegAppendixAcReferenceV1(
      evaluatePublishedTriSegGeometryV1(physiologicalGeometryInput()),
      { LVFW: 80_000, SEP: 60_000, RVFW: 45_000 },
    );
    expect(wholeReference.closedLoopReleaseEligible).toBe(false);
    expect(wholeReference.cavityTransmuralPressuresPa.LV).toBeGreaterThan(0);
    expect(wholeReference.cavityTransmuralPressuresPa.RV).toBeGreaterThan(0);
  });

  it("rejects analytical reconstruction outside the strict Appendix domain", () => {
    expect(() => evaluateTriSegAppendixCGMinusTwoV1(1)).toThrow(/abs\(value\) < 1/);
    expect(() => evaluateTriSegAppendixCAtanhOverArgumentV1(-1)).toThrow(/abs\(value\) < 1/);
    const junctionRadiusM = 0.03;
    const wall = evaluatePublishedTriSegWallGeometryV1(
      "RVFW",
      evaluateSignedSphericalCapVolumeV1(junctionRadiusM, junctionRadiusM),
      junctionRadiusM,
      wallParameters(
        (4 * Math.PI / 3) * junctionRadiusM ** 3,
        2 * Math.PI * junctionRadiusM ** 2,
      ),
    );
    expect(wall.thicknessCurvatureRatioZ).toBeCloseTo(1, 14);
    expect(() => evaluateTriSegAppendixAcPrimarySourceWallCandidateV1(wall, 80_000)).toThrow(
      /analytical domain/,
    );
  });
});

function physiologicalGeometryInput(): PublishedTriSegGeometryInputV1 {
  return {
    leftVentricularCavityVolumeM3: 1.2e-4,
    rightVentricularCavityVolumeM3: 1.4e-4,
    septalMidwallCapVolumeM3: 2e-5,
    junctionRadiusM: 0.03,
    walls: {
      LVFW: wallParameters(1.2e-4, 0.015),
      SEP: wallParameters(4e-5, 0.009),
      RVFW: wallParameters(6e-5, 0.012),
    },
  };
}

function wallParameters(wallMaterialVolumeM3: number, referenceMidwallAreaM2: number) {
  return { wallMaterialVolumeM3, referenceMidwallAreaM2 } as const;
}

function stressForTargetTension(
  geometry: PublishedTriSegWallGeometryV1,
  targetTensionNPerM: number,
): number {
  const zSquared = geometry.thicknessCurvatureRatioZ ** 2;
  const correction = 1 + zSquared / 3 + zSquared ** 2 / 5;
  return targetTensionNPerM
    * 2
    * geometry.midwallAreaM2
    / (geometry.parameters.wallMaterialVolumeM3 * correction);
}

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(Math.abs(actual), Math.abs(expected), Number.MIN_VALUE);
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
