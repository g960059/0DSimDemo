import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildAtrialHumanPriorLandEquationParametersV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  buildAtrialLandLiteratureReferenceV1,
} from "@/engine/myocardium/fourChamberV1/land/atrialLandLiteratureReferenceV1";
import {
  ATRIAL_LAND_GERACH_CANDIDATE_CLAIM_BOUNDARY_V1,
  ATRIAL_LAND_GERACH_CANDIDATE_PARAMETER_SET_V1_ID,
  ATRIAL_LAND_GERACH_CONTROLLED_PRIMITIVE_DIFF_V1,
  atrialLandGerachCandidateProtocolHashPayloadV1,
  buildAtrialLandGerachControlledCandidateParameterSetV1,
  runAtrialLandGerachCandidateProtocolV1,
  type AtrialLandGerachCandidateProtocolReportV1,
} from "@/engine/myocardium/fourChamberV1/protocols/atrialLandGerachCandidateProtocolV1";
import {
  ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1,
  runAtrialLandLateStretchComponentProtocolV1,
} from "@/engine/myocardium/fourChamberV1/protocols/atrialLandLateStretchComponentProtocolV1";
import type {
  Land2017RuntimeParameters,
} from "@/engine/myocardium/myofilament/land2017";

describe("controlled Gerach 2021 atrial Land candidate protocol v1", () => {
  it("changes exactly CaT50Ref and beta1 while fixing Tref and all other primitives", () => {
    const reference = buildAtrialLandLiteratureReferenceV1(sha256);
    const legacy = buildAtrialHumanPriorLandEquationParametersV1();
    const candidate = buildAtrialLandGerachControlledCandidateParameterSetV1(sha256);
    const names = Object.keys(legacy.values) as Array<keyof Land2017RuntimeParameters>;
    const changed = names.filter((name) => !Object.is(legacy.values[name], candidate.values[name]));

    expect(changed).toEqual(Array.from(ATRIAL_LAND_GERACH_CONTROLLED_PRIMITIVE_DIFF_V1));
    expect(candidate.parameterSetId).toBe(ATRIAL_LAND_GERACH_CANDIDATE_PARAMETER_SET_V1_ID);
    expect(candidate.values.CaT50Ref)
      .toBe(reference.gerach2021.parameterChangesFromLandNiederer2018.calciumSensitivityCaT50UM);
    expect(candidate.values.beta1)
      .toBe(reference.gerach2021.parameterChangesFromLandNiederer2018.lengthSensitivityBeta1UM);
    expect(candidate.values.Tref).toBe(legacy.values.Tref);
    expect(candidate.derived).toEqual(legacy.derived);
    expect(candidate.parameterSetStableHash).not.toBe(legacy.parameterSetStableHash);
    expect(Object.isFrozen(candidate)).toBe(true);
  });

  it("uses identical calcium, strain trajectories, wall adapter, Tref scale, and dt family", () => {
    const report = protocolReport();

    expect(report.controlledProtocol.prescribedCalciumBitExact).toBe(true);
    expect(report.controlledProtocol.strainTrajectoriesBitExact).toBe(true);
    expect(report.controlledProtocol.wallAdapterBitExact).toBe(true);
    expect(report.candidateDefinition.sourceTrefAndWallStressScaleFixed).toBe(true);
    expect(report.candidateDefinition.allOtherPrimitiveValuesBitExact).toBe(true);
    expect(report.candidateDefinition.derivedValuesBitExact).toBe(true);
    expect(report.controlledProtocol.dtFamilySec)
      .toEqual(Array.from(ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1));
    expect(report.controlledProtocol.candidateSpecificDiastolicBurnInRequired).toBe(true);
    expect(report.numericalAudit.controlledInputsPassed).toBe(true);
  });

  it("reports isometric twitch and shortening-hold/restretch components at all three dts", () => {
    const report = protocolReport();

    expect(report.comparisons).toHaveLength(3);
    expect(report.comparisons.map((entry) => entry.dtSec))
      .toEqual(Array.from(ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1));
    for (const comparison of report.comparisons) {
      for (const candidate of [comparison.currentLegacy, comparison.gerach2021Pair]) {
        expect(candidate.isometric.primaryPeakAboveBaselinePa).toBeGreaterThan(0);
        expect(candidate.isometric.primaryPeakTimeAfterCalciumDriveMs).toBeGreaterThanOrEqual(0);
        expect(candidate.shorteningHold.primaryPeakAboveBaselinePa).toBeGreaterThan(0);
        expect(candidate.shorteningRestretch.primaryPeakAboveBaselinePa).toBeGreaterThan(0);
        expect(candidate.matchedRestretchMinusHold.available).toBe(true);
        expect(candidate.matchedRestretchMinusHold.peakRestretchMinusMatchedHoldPa)
          .not.toBeNull();
        expect(candidate.matchedRestretchMinusHold.positiveRestretchMinusMatchedHoldImpulsePaSec)
          .not.toBeNull();
        expect(candidate.matchedRestretchMinusHold.morphologyUsedAsGate).toBe(false);
      }
      expect(comparison.gerachMinusLegacy.isometricPrimaryPeakAmplitudeRatio).not.toBeNull();
      expect(comparison.gerachMinusLegacy.matchedComponentPeakPa).not.toBeNull();
      expect(comparison.gerachMinusLegacy.matchedComponentNormalizedPeak).not.toBeNull();
      expect(comparison.gerachMinusLegacy.matchedComponentNormalizedPeakRatio).not.toBeNull();
    }
    expect(report.numericalAudit.completeTwoByThreeCandidateMatrix).toBe(true);
    expect(report.numericalAudit.bothProtocolNumericalGatesPassed).toBe(true);
    expect(report.numericalAudit.allReportedMetricsFiniteOrDeclaredNullable).toBe(true);
    expect(report.numericalAudit.pass).toBe(true);
  });

  it("does not confuse a smaller absolute restretch component with lower normalized sensitivity", () => {
    const fine = protocolReport().comparisons.find((entry) => entry.dtSec === 0.00025);
    expect(fine).toBeDefined();
    expect(fine!.gerachMinusLegacy.matchedComponentPeakPa).toBeLessThan(0);
    expect(fine!.gerachMinusLegacy.matchedComponentPeakRatio).toBeLessThan(1);
    expect(fine!.gerachMinusLegacy.matchedComponentNormalizedPeak).toBeGreaterThan(0);
    expect(fine!.gerachMinusLegacy.matchedComponentNormalizedPeakRatio).toBeGreaterThan(1);
  });

  it("keeps the existing default protocol bit-identical when no isolated override is supplied", () => {
    const report = protocolReport();
    const defaultProtocol = runAtrialLandLateStretchComponentProtocolV1(sha256);

    expect(report.provenance.currentLegacyProtocolInputSha256)
      .toBe(defaultProtocol.provenance.protocolInputSha256);
    expect(report.provenance.currentLegacyResultSummarySha256)
      .toBe(defaultProtocol.resultSummarySha256);
    expect(defaultProtocol.modelBinding.atrialLandParameterSetId)
      .toBe("atrial-human-prior-v1:land2017-equation-parameters");
  });

  it("canonicalizes all candidate, protocol, result, and report provenance deterministically", () => {
    const first = protocolReport();
    const second = runAtrialLandGerachCandidateProtocolV1(sha256);
    const hashes = [
      first.candidateDefinition.literatureReferenceSha256,
      first.provenance.candidateDefinitionSha256,
      first.provenance.controlledProtocolSha256,
      first.provenance.currentLegacyProtocolInputSha256,
      first.provenance.gerachCandidateProtocolInputSha256,
      first.provenance.currentLegacyResultSummarySha256,
      first.provenance.gerachCandidateResultSummarySha256,
      first.provenance.pairedAuditInputSha256,
      first.contentSha256,
    ];

    expect(hashes.every((hash) => /^[0-9a-f]{64}$/.test(hash))).toBe(true);
    expect(first.candidateDefinition.currentLegacyParameterSetStableHash)
      .toMatch(/^[0-9a-f]{8}$/);
    expect(first.candidateDefinition.gerachCandidateParameterSetStableHash)
      .toMatch(/^[0-9a-f]{8}$/);
    expect(first.contentSha256).toBe(computeCanonicalSha256(
      atrialLandGerachCandidateProtocolHashPayloadV1(first),
      sha256,
    ));
    expect(second.contentSha256).toBe(first.contentSha256);
    expect(second.comparisons).toEqual(first.comparisons);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.comparisons)).toBe(true);
  });

  it("states that Gerach values are model-context values and cannot promote runtime", () => {
    const report = protocolReport();
    const serialized = JSON.stringify(report);

    expect(report.claimBoundary).toBe(ATRIAL_LAND_GERACH_CANDIDATE_CLAIM_BOUNDARY_V1);
    expect(report.candidateDefinition.evidenceClassification)
      .toBe("published-coupled-model-parameter-pair-not-independent-human-measurement");
    expect(report.gerachValuesIndependentlyMeasured).toBe(false);
    expect(report.runtimeDefaultChanged).toBe(false);
    expect(report.runtimePromotionEligible).toBe(false);
    expect(report.physiologicalValidationClaimed).toBe(false);
    expect(report.pvLoopFitUsed).toBe(false);
    expect(report.pvLoopGateUsed).toBe(false);
    expect(report.numericalAudit.morphologyOrPvLoopUsedAsGate).toBe(false);
    expect(serialized).not.toMatch(/runtimePromotionEligible":true/);
    expect(serialized).not.toMatch(/pvLoop(?:Fit|Gate)Used":true/);
  });
});

let cachedReport: AtrialLandGerachCandidateProtocolReportV1 | undefined;

function protocolReport(): AtrialLandGerachCandidateProtocolReportV1 {
  cachedReport ??= runAtrialLandGerachCandidateProtocolV1(sha256);
  return cachedReport;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
