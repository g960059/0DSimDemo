import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  atrialLandCandidateAuditHashPayloadV1,
  atrialLandLiteratureReferenceHashPayloadV1,
  auditAtrialLandCandidateAgainstLiteratureV1,
  buildAtrialLandLiteratureReferenceV1,
  validateAtrialLandLiteratureReferenceV1,
  type AtrialLandLiteratureReferenceV1,
} from "@/engine/myocardium/fourChamberV1/land/atrialLandLiteratureReferenceV1";
import {
  ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  buildAtrialHumanPriorLandEquationParametersV1,
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import { computeCanonicalSha256 } from
  "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from
  "@/engine/myocardium/myofilament/land2017/parameterSets";
import { LAND2017_STATE_SIZE } from "@/engine/myocardium/myofilament/land2017/types";

describe("four-chamber atrial Land literature reference and candidate audit", () => {
  it("pins the primary-source experimental targets separately from the extended-model parameter snapshot", () => {
    const reference = buildAtrialLandLiteratureReferenceV1(sha256);

    expect(validateAtrialLandLiteratureReferenceV1(reference, sha256)).toBe(reference);
    expect(reference.contentSha256).toBe(
      computeCanonicalSha256(atrialLandLiteratureReferenceHashPayloadV1(reference), sha256),
    );
    expect(Object.isFrozen(reference)).toBe(true);
    expect(Object.isFrozen(reference.lewalle2026.leftAtrialTargets.bySarcomereLength)).toBe(true);
    expect(reference.land2017SourceBoundary).toMatchObject({
      currentRuntimeParameterSetId: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.parameterSetId,
      currentBaseClassification: "hybrid-whole-organ-kinetics-plus-skinned-cellular-tref",
      currentTref: {
        valuePa: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.Tref,
        sourceColumn: "skinned-cellular-force-pca-fit",
      },
      wholeOrganColumnTref: {
        valuePa: 120000,
        status: "unresolved-reduced-wall-scale-candidate-not-current-runtime-default",
      },
    });
    expect(reference.land2017SourceBoundary.wholeOrganColumnKineticsUsedByCurrentBase)
      .toEqual({
        calciumSensitivityCaT50UM: 0.805,
        tropomyosinHillCoefficientNTm: 5,
        unboundToWeakRateKuwPerSec: 182,
        weakToStrongRateKwsPerSec: 12,
      });
    expect(reference.gerach2021).toMatchObject({
      activeTopologyCompatibility: {
        sameSixStateLandActiveTopology: true,
        directRuntimeTransplantReady: false,
      },
      parameterChangesFromLandNiederer2018: {
        calciumSensitivityCaT50UM: 1.05,
        lengthSensitivityBeta1UM: -0.5,
        table7ShowsAtrialKuAndNTmUnchanged: true,
      },
      adjustedModelOutputContext: {
        timeToPeakSec: 0.0735,
        relaxationTime50Sec: 0.0781,
        acceptanceStatus: "context-only-not-independent-validation",
      },
    });
    expect(reference.strocchi2023).toMatchObject({
      atrialLandDefaultsAndBounds: {
        calciumSensitivityCa50UM: 0.86,
        lengthSensitivityBeta1UM: -2.4,
        weakToStrongRateScaleMu: 9,
        referenceTensionGsaDefaultPa: 120000,
        referenceTensionHistoryMatchingDefaultPa: 100000,
        referenceTensionHistoryMatchingBoundsPa: [80000, 120000],
      },
      ensembleContext: {
        finalWholeOrganEligibleSampleCount: 148527,
        singlePublishedAtrialParameterVectorForDirectUse: false,
        acceptanceStatus: "history-matched-ensemble-not-independent-calibration",
      },
    });
    expect(reference.lewalle2026.experimentalDesign).toMatchObject({
      donorCount: 9,
      leftAtrialPreparationCount: 59,
      leftVentricularPreparationCount: 67,
      temperatureC: 37,
    });
    expect(reference.lewalle2026.leftAtrialTargets.bySarcomereLength).toEqual([
      expect.objectContaining({
        nominalSarcomereLengthUM: 1.9,
        preparationCount: 29,
        maximumActiveForceKPa: {
          mean: 10.52,
          reportedUncertainty: 1.17,
          unit: "kPa",
        },
        slackRestretchResidualFraction: {
          mean: 0.76,
          reportedUncertainty: 0.07,
          unit: "dimensionless",
        },
      }),
      expect.objectContaining({
        nominalSarcomereLengthUM: 2.2,
        preparationCount: 30,
        maximumActiveForceKPa: {
          mean: 12.6,
          reportedUncertainty: 1.34,
          unit: "kPa",
        },
        slackRestretchResidualFraction: {
          mean: 0.77,
          reportedUncertainty: 0.06,
          unit: "dimensionless",
        },
      }),
    ]);
    expect(reference.lewalle2026.leftAtrialTargets.tensionRedevelopmentRateKtrPerSec)
      .toEqual({ mean: 40, reportedUncertainty: 13, unit: "1/s" });
    expect(reference.lewalle2026.leftAtrialTargets.reportedUncertaintyPolicy)
      .toBe("preserve-paper-reported-plus-minus-without-recasting-as-sem");
    expect(reference.lewalle2026.publicCode.commitSha)
      .toBe("6ce5c37cefe98376671a26bead2984b2c042315a");
    expect(reference.lewalle2026.publicCode.capturedLeftAtrialParameters.kws)
      .toBe(2256.842742545323);
    expect(reference.lewalle2026.publicCode.unresolvedSourceDiscrepancies[0])
      .toMatch(/ku=6639/);
    expect(reference.lewalle2026.publicCode.repositoryLicenseAtCapturedCommit)
      .toBe("no-license-declared");
    expect(reference.lewalle2026.modelTopology.additionalPopulationStates).toEqual(["Boff", "Uoff"]);
    expect(reference.lewalle2026.modelTopology.dropInCompatibleWithV1SixStateLand).toBe(false);
    expect(reference.usePolicy.directLewalleParameterTransplantation).toBe("prohibited");
    expect(reference.usePolicy.gerachParameterPairPromotion).toBe("component-protocol-required");
    expect(reference.usePolicy.strocchiEnsembleTransplantationAsSingleVector).toBe("prohibited");
    expect(reference.usePolicy.fitLandOrCalciumToAtrialPvLoop).toBe(false);
  });

  it("audits the current six-state candidate honestly instead of promoting the source-generated target pack", () => {
    const reference = buildAtrialLandLiteratureReferenceV1(sha256);
    const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
    const atrialParameters = buildAtrialHumanPriorLandEquationParametersV1();
    const calcium = ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1;
    const twitch = bundle.atrialTargetPack.isolatedTwitchTarget;
    const audit = auditAtrialLandCandidateAgainstLiteratureV1({
      candidateId: bundle.atrialManifest.familyId,
      activeEquationStateCount: LAND2017_STATE_SIZE,
      parameterSetStableHash: atrialParameters.parameterSetStableHash,
      targetPackSha256: bundle.atrialTargetPack.contentSha256,
      caT50RefUM: atrialParameters.values.CaT50Ref,
      ventricularKwsPerSec: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.kws,
      atrialKwsPerSec: atrialParameters.values.kws,
      calciumDiastolicUM: calcium.calciumDiastolicUM,
      calciumPeakUM: calcium.calciumDiastolicUM + calcium.calciumAmplitudeUM,
      calciumWaveformEvidence: "project-synthetic-biexponential-not-digitized-brixius",
      isolatedTwitch: {
        timeToPeakSec: twitch.timeToPeakSec,
        relaxationTime50Sec: twitch.relaxationTime50Sec,
        relaxationTime90Sec: twitch.relaxationTime90Sec,
      },
      absoluteSarcomereLengthMappingAvailable: false,
      quickLengthStepProtocolImplemented: false,
      slackRestretchKtrProtocolImplemented: false,
      fittedToAtrialPvLoop: bundle.atrialManifest.homogenization.fitToPVLoop,
    }, reference, sha256);

    expect(audit.contentSha256).toBe(
      computeCanonicalSha256(atrialLandCandidateAuditHashPayloadV1(audit), sha256),
    );
    expect(audit.legacySixStateMapping).toEqual({
      caT50MatchesLandNiederer2018: true,
      kwsMultiplierMatchesLandNiederer2018: true,
      calciumAmplitudeContextMatches: true,
      exactPrimitiveMappingPass: true,
    });
    expect(twitch.timeToPeakSec).toBeCloseTo(0.072, 12);
    expect(twitch.relaxationTime50Sec).toBeCloseTo(0.038, 12);
    expect(audit.legacyTwitchContextComparison.timeToPeakResidualSec).toBeCloseTo(-0.01, 12);
    expect(audit.legacyTwitchContextComparison.relaxationTime50ResidualSec).toBeCloseTo(-0.037, 12);
    expect(audit.lewalle2026Compatibility).toMatchObject({
      experimentalObservablesMayBeUsed: true,
      publishedParameterSnapshotMayBeImportedDirectly: false,
      activeTopologyCompatible: false,
      forceCalciumLengthGateReady: false,
      quickLengthStepGateReady: false,
      slackRestretchKtrGateReady: false,
    });
    expect(audit.ownership.pvLoopOwnershipPass).toBe(true);
    expect(audit.releaseGate.experimentalPromotionEligible).toBe(false);
    expect(audit.releaseGate.closedLoopReleaseEligible).toBe(false);
    expect(audit.releaseGate.blockers).toEqual(expect.arrayContaining([
      expect.stringMatching(/project-synthetic/),
      expect.stringMatching(/absolute sarcomere-length mapping/),
      expect.stringMatching(/quick-length-step/),
      expect.stringMatching(/ktr/),
      expect.stringMatching(/OFF states/),
      expect.stringMatching(/hybrid of Land 2017 whole-organ kinetics/),
      expect.stringMatching(/120 kPa/),
      expect.stringMatching(/Gerach 2021/),
      expect.stringMatching(/Strocchi 2023/),
    ]));
  });

  it("rejects provenance tampering and records PV fitting as an ownership violation", () => {
    const reference = buildAtrialLandLiteratureReferenceV1(sha256);
    const tampered = JSON.parse(JSON.stringify(reference)) as AtrialLandLiteratureReferenceV1;
    (tampered.lewalle2026.publicCode.capturedLeftAtrialParameters as Record<string, number>).kws = 12;
    expect(() => validateAtrialLandLiteratureReferenceV1(tampered, sha256)).toThrow(/contentSha256/);

    const audit = auditAtrialLandCandidateAgainstLiteratureV1({
      candidateId: "ownership-negative-control",
      activeEquationStateCount: 6,
      parameterSetStableHash: "parameter-hash",
      targetPackSha256: "target-hash",
      caT50RefUM: 0.86,
      ventricularKwsPerSec: 12,
      atrialKwsPerSec: 36,
      calciumDiastolicUM: 0.1,
      calciumPeakUM: 0.6,
      calciumWaveformEvidence: "digitized-independent-human-atrial-transient",
      isolatedTwitch: {
        timeToPeakSec: 0.082,
        relaxationTime50Sec: 0.075,
        relaxationTime90Sec: 0.15,
      },
      absoluteSarcomereLengthMappingAvailable: true,
      quickLengthStepProtocolImplemented: true,
      slackRestretchKtrProtocolImplemented: true,
      fittedToAtrialPvLoop: true,
    }, reference, sha256);
    expect(audit.ownership).toEqual({
      fittedToAtrialPvLoop: true,
      pvLoopOwnershipPass: false,
    });
    expect(audit.releaseGate.blockers).toContain(
      "Land or calcium parameters were fitted to the atrial PV-loop shape",
    );
  });
});

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
