import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";

export const ATRIAL_LAND_LITERATURE_REFERENCE_SCHEMA_V1_ID =
  "atrial-land-literature-reference-v1" as const;
export const ATRIAL_LAND_CANDIDATE_AUDIT_SCHEMA_V1_ID =
  "atrial-land-candidate-literature-audit-v1" as const;

type MeanReportedUncertaintyV1 = {
  readonly mean: number;
  readonly reportedUncertainty: number;
  readonly unit: string;
};

type SarcomereLengthTargetV1 = {
  readonly nominalSarcomereLengthUM: 1.9 | 2.2;
  readonly measuredSarcomereLengthUM: MeanReportedUncertaintyV1;
  readonly preparationCount: number;
  readonly maximumActiveForceKPa: MeanReportedUncertaintyV1;
  readonly minimumPassiveForceKPa: MeanReportedUncertaintyV1;
  readonly hillCoefficient: MeanReportedUncertaintyV1;
  readonly pCa50: MeanReportedUncertaintyV1;
  readonly slackRestretchResidualFraction: MeanReportedUncertaintyV1;
};

export type AtrialLandLiteratureReferenceV1 = {
  readonly schemaId: typeof ATRIAL_LAND_LITERATURE_REFERENCE_SCHEMA_V1_ID;
  readonly referenceId: "human-atrial-land-evidence-2018-2026-v1";
  readonly status: "literature-reference-not-runtime-parameter-set";
  readonly land2017SourceBoundary: {
    readonly title: string;
    readonly doi: "10.1016/j.yjmcc.2017.03.008";
    readonly url: string;
    readonly currentRuntimeParameterSetId: "land2017-intact-human-37c-source-v1";
    readonly currentBaseClassification:
      "hybrid-whole-organ-kinetics-plus-skinned-cellular-tref";
    readonly wholeOrganColumnKineticsUsedByCurrentBase: {
      readonly calciumSensitivityCaT50UM: 0.805;
      readonly tropomyosinHillCoefficientNTm: 5;
      readonly unboundToWeakRateKuwPerSec: 182;
      readonly weakToStrongRateKwsPerSec: 12;
    };
    readonly currentTref: {
      readonly valuePa: 40500;
      readonly sourceColumn: "skinned-cellular-force-pca-fit";
    };
    readonly wholeOrganColumnTref: {
      readonly valuePa: 120000;
      readonly status:
        "unresolved-reduced-wall-scale-candidate-not-current-runtime-default";
    };
    readonly interpretation: readonly string[];
  };
  readonly landNiederer2018: {
    readonly title: string;
    readonly doi: "10.1002/cnm.2931";
    readonly url: string;
    readonly role: "legacy-six-state-atrial-candidate-context";
    readonly atrialMapping: {
      readonly calciumSensitivityCaT50UM: 0.86;
      readonly ventricularToAtrialKwsMultiplier: 3;
      readonly independentlyScaledPrimitiveRates: readonly ["kws"];
      readonly derivedRatesMustBeRecomputed: readonly ["kwu", "ksu", "cs"];
    };
    readonly calciumContext: {
      readonly diastolicCalciumUM: 0.1;
      readonly peakCalciumUM: 0.6;
      readonly waveformSource: string;
      readonly currentV1BiexponentialTimingIsDigitizedSourceWaveform: false;
    };
    readonly adjustedModelOutputContext: {
      readonly timeToPeakSec: 0.082;
      readonly relaxationTime50Sec: 0.075;
      readonly acceptanceStatus: "context-only-not-independent-validation";
    };
    readonly limitations: readonly string[];
  };
  readonly gerach2021: {
    readonly title: string;
    readonly doi: "10.3390/math9111247";
    readonly url: string;
    readonly role: "topology-compatible-competing-six-state-atrial-candidate-context";
    readonly activeTopologyCompatibility: {
      readonly sameSixStateLandActiveTopology: true;
      readonly directRuntimeTransplantReady: false;
    };
    readonly parameterChangesFromLandNiederer2018: {
      readonly calciumSensitivityCaT50UM: 1.05;
      readonly lengthSensitivityBeta1UM: -0.5;
      readonly table7ShowsAtrialKuAndNTmUnchanged: true;
    };
    readonly coupledModelContext: {
      readonly calciumModel: "Courtemanche-1998";
      readonly bidirectionalCalciumTroponinCoupling: true;
      readonly wholeHeartElectromechanicsWithAvpd: true;
      readonly reparameterizationMotivation: string;
    };
    readonly adjustedModelOutputContext: {
      readonly timeToPeakSec: 0.0735;
      readonly relaxationTime50Sec: 0.0781;
      readonly acceptanceStatus: "context-only-not-independent-validation";
    };
    readonly limitations: readonly string[];
  };
  readonly strocchi2023: {
    readonly title: string;
    readonly doi: "10.1371/journal.pcbi.1011257";
    readonly url: string;
    readonly role: "six-state-courtemanche-land-ensemble-context-only";
    readonly atrialLandDefaultsAndBounds: {
      readonly calciumSensitivityCa50UM: 0.86;
      readonly lengthSensitivityBeta1UM: -2.4;
      readonly weakToStrongRateScaleMu: 9;
      readonly referenceTensionGsaDefaultPa: 120000;
      readonly referenceTensionHistoryMatchingDefaultPa: 100000;
      readonly referenceTensionHistoryMatchingBoundsPa: readonly [80000, 120000];
    };
    readonly ensembleContext: {
      readonly finalWholeOrganEligibleSampleCount: 148527;
      readonly singlePublishedAtrialParameterVectorForDirectUse: false;
      readonly acceptanceStatus: "history-matched-ensemble-not-independent-calibration";
    };
    readonly limitations: readonly string[];
  };
  readonly lewalle2026: {
    readonly title: string;
    readonly doi: "10.1016/j.yjmcc.2025.12.001";
    readonly publication: "J Mol Cell Cardiol. 2026;211:64-77";
    readonly paperUrl: string;
    readonly supplementUrl: string;
    readonly publicCode: {
      readonly repositoryUrl: string;
      readonly commitSha: "6ce5c37cefe98376671a26bead2984b2c042315a";
      readonly sourceFile: "LA_LV_models.py";
      readonly repositoryLicenseAtCapturedCommit: "no-license-declared";
      readonly capturedLeftAtrialParameters: Readonly<Record<string, number>>;
      readonly sourceUnitNotes: readonly string[];
      readonly unresolvedSourceDiscrepancies: readonly string[];
    };
    readonly experimentalDesign: {
      readonly donorCount: 9;
      readonly leftAtrialPreparationCount: 59;
      readonly leftVentricularPreparationCount: 67;
      readonly preparation: "chemically-permeabilized-human-muscle-fiber";
      readonly temperatureC: 37;
      readonly pCaValues: readonly number[];
    };
    readonly leftAtrialTargets: {
      readonly reportedUncertaintyPolicy:
        "preserve-paper-reported-plus-minus-without-recasting-as-sem";
      readonly bySarcomereLength: readonly [SarcomereLengthTargetV1, SarcomereLengthTargetV1];
      readonly centralMixedEffectsAtSarcomereLengthUM: {
        readonly sarcomereLengthUM: 2.05;
        readonly maximumActiveForceKPa: MeanReportedUncertaintyV1;
        readonly minimumPassiveForceKPa: MeanReportedUncertaintyV1;
        readonly hillCoefficient: MeanReportedUncertaintyV1;
        readonly pCa50: MeanReportedUncertaintyV1;
        readonly maximumActiveForceGradientKPaPerUM: MeanReportedUncertaintyV1;
        readonly minimumPassiveForceGradientKPaPerUM: MeanReportedUncertaintyV1;
        readonly pCa50GradientPerUM: MeanReportedUncertaintyV1;
      };
      readonly tensionRedevelopmentRateKtrPerSec: MeanReportedUncertaintyV1;
      readonly tensionRedevelopmentProtocol: {
        readonly nominalSarcomereLengthUM: 2.2;
        readonly slackFraction: 0.2;
        readonly slackDurationSec: 0.02;
      };
      readonly comparisonToLeftVentricle: {
        readonly leftVentricularKtrPerSec: MeanReportedUncertaintyV1;
        readonly qualitativeLengthDependentActivation: "left-atrium-weaker-than-left-ventricle";
        readonly pCa50Difference: "not-statistically-resolved";
        readonly hillCoefficientDifference: "not-statistically-resolved";
      };
    };
    readonly modelTopology: {
      readonly originalLandInherited: true;
      readonly additionalPopulationStates: readonly ["Boff", "Uoff"];
      readonly forceDependentOffOnTransition: true;
      readonly passiveElement: "linear-parallel-spring";
      readonly dropInCompatibleWithV1SixStateLand: false;
    };
  };
  readonly usePolicy: {
    readonly currentV1ActiveTopology: "land2017-six-state-active-only";
    readonly directLewalleParameterTransplantation: "prohibited";
    readonly gerachParameterPairPromotion: "component-protocol-required";
    readonly strocchiEnsembleTransplantationAsSingleVector: "prohibited";
    readonly fitLandOrCalciumToAtrialPvLoop: false;
    readonly permittedUses: readonly string[];
    readonly hardGatePrerequisites: readonly string[];
    readonly topologyEscalationRule: string;
  };
  readonly hashAlgorithm: "sha256-canonical-json-v1";
  readonly contentSha256: string;
};

export type AtrialLandCandidateAuditInputV1 = {
  readonly candidateId: string;
  readonly activeEquationStateCount: number;
  readonly parameterSetStableHash: string;
  readonly targetPackSha256: string;
  readonly caT50RefUM: number;
  readonly ventricularKwsPerSec: number;
  readonly atrialKwsPerSec: number;
  readonly calciumDiastolicUM: number;
  readonly calciumPeakUM: number;
  readonly calciumWaveformEvidence:
    | "digitized-independent-human-atrial-transient"
    | "project-synthetic-biexponential-not-digitized-brixius";
  readonly isolatedTwitch: {
    readonly timeToPeakSec: number;
    readonly relaxationTime50Sec: number;
    readonly relaxationTime90Sec: number;
  };
  readonly absoluteSarcomereLengthMappingAvailable: boolean;
  readonly quickLengthStepProtocolImplemented: boolean;
  readonly slackRestretchKtrProtocolImplemented: boolean;
  readonly fittedToAtrialPvLoop: boolean;
};

export type AtrialLandCandidateLiteratureAuditV1 = {
  readonly schemaId: typeof ATRIAL_LAND_CANDIDATE_AUDIT_SCHEMA_V1_ID;
  readonly auditId: string;
  readonly referenceSha256: string;
  readonly input: AtrialLandCandidateAuditInputV1;
  readonly legacySixStateMapping: {
    readonly caT50MatchesLandNiederer2018: boolean;
    readonly kwsMultiplierMatchesLandNiederer2018: boolean;
    readonly calciumAmplitudeContextMatches: boolean;
    readonly exactPrimitiveMappingPass: boolean;
  };
  readonly legacyTwitchContextComparison: {
    readonly timeToPeakResidualSec: number;
    readonly relaxationTime50ResidualSec: number;
    readonly interpretation: "diagnostic-context-only";
  };
  readonly lewalle2026Compatibility: {
    readonly experimentalObservablesMayBeUsed: true;
    readonly publishedParameterSnapshotMayBeImportedDirectly: false;
    readonly activeTopologyCompatible: false;
    readonly forceCalciumLengthGateReady: boolean;
    readonly quickLengthStepGateReady: boolean;
    readonly slackRestretchKtrGateReady: boolean;
  };
  readonly ownership: {
    readonly fittedToAtrialPvLoop: boolean;
    readonly pvLoopOwnershipPass: boolean;
  };
  readonly releaseGate: {
    readonly experimentalPromotionEligible: false;
    readonly closedLoopReleaseEligible: false;
    readonly blockers: readonly string[];
  };
  readonly hashAlgorithm: "sha256-canonical-json-v1";
  readonly contentSha256: string;
};

export function buildAtrialLandLiteratureReferenceV1(
  sha256Hex: CanonicalSha256HexProvider,
): AtrialLandLiteratureReferenceV1 {
  const payload = atrialLandLiteratureReferencePayloadV1();
  const result = deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  assertCanonicalSha256(payload, result.contentSha256, sha256Hex);
  return result;
}

export function validateAtrialLandLiteratureReferenceV1(
  reference: AtrialLandLiteratureReferenceV1,
  sha256Hex: CanonicalSha256HexProvider,
): AtrialLandLiteratureReferenceV1 {
  const { contentSha256, ...payload } = reference;
  assertCanonicalSha256(payload, contentSha256, sha256Hex);
  if (canonicalizeJson(payload) !== canonicalizeJson(atrialLandLiteratureReferencePayloadV1())) {
    throw new Error("Atrial Land literature reference differs from its canonical V1 payload");
  }
  return reference;
}

export function auditAtrialLandCandidateAgainstLiteratureV1(
  input: AtrialLandCandidateAuditInputV1,
  reference: AtrialLandLiteratureReferenceV1,
  sha256Hex: CanonicalSha256HexProvider,
): AtrialLandCandidateLiteratureAuditV1 {
  validateAtrialLandLiteratureReferenceV1(reference, sha256Hex);
  validateAuditInput(input);
  const expected = reference.landNiederer2018;
  const caT50Matches = nearlyEqual(input.caT50RefUM, expected.atrialMapping.calciumSensitivityCaT50UM);
  const kwsMultiplierMatches = nearlyEqual(
    input.atrialKwsPerSec / input.ventricularKwsPerSec,
    expected.atrialMapping.ventricularToAtrialKwsMultiplier,
  );
  const calciumAmplitudeMatches = nearlyEqual(
    input.calciumDiastolicUM,
    expected.calciumContext.diastolicCalciumUM,
  ) && nearlyEqual(input.calciumPeakUM, expected.calciumContext.peakCalciumUM);
  const blockers = [
    ...(input.calciumWaveformEvidence === "digitized-independent-human-atrial-transient"
      ? []
      : ["prescribed atrial calcium timing is project-synthetic rather than an independently digitized human atrial transient"]),
    ...(input.absoluteSarcomereLengthMappingAvailable
      ? []
      : ["absolute sarcomere-length mapping is absent, so the 1.9/2.2 um force-calcium targets are not yet a hard gate"]),
    ...(input.quickLengthStepProtocolImplemented
      ? []
      : ["protocol-matched +/-1% quick-length-step component evidence is absent"]),
    ...(input.slackRestretchKtrProtocolImplemented
      ? []
      : ["protocol-matched 20% slack-restretch ktr component evidence is absent"]),
    ...(input.fittedToAtrialPvLoop
      ? ["Land or calcium parameters were fitted to the atrial PV-loop shape"]
      : []),
    "Lewalle 2026 uses additional thick-filament OFF states and force feedback, so its fitted parameters are not drop-in values for V1",
    "the public Lewalle code ku value and the paper's fixed-parameter table must be reconciled before parameter-level reproduction",
    "the current base is a hybrid of Land 2017 whole-organ kinetics and the 40.5 kPa skinned-cellular Tref rather than one intact whole-organ source column",
    "the Land 2017 whole-organ-column Tref of 120 kPa has not been independently mapped to the reduced one-fiber wall scale and is not a runtime default",
    "the completed controlled Gerach 2021 comparison changes CaT50 and beta1 together, lowers absolute force under the current calcium input, and does not establish normalized length sensitivity or runtime suitability",
    "the Strocchi 2023 result is a history-matched ensemble and cannot be transplanted as one atrial parameter vector",
    "held-out experimental parameter estimation and closed-loop physiological validation remain incomplete",
  ];
  const payload: Omit<AtrialLandCandidateLiteratureAuditV1, "contentSha256"> = {
    schemaId: ATRIAL_LAND_CANDIDATE_AUDIT_SCHEMA_V1_ID,
    auditId: `${input.candidateId}:human-atrial-literature-audit-v1`,
    referenceSha256: reference.contentSha256,
    input,
    legacySixStateMapping: {
      caT50MatchesLandNiederer2018: caT50Matches,
      kwsMultiplierMatchesLandNiederer2018: kwsMultiplierMatches,
      calciumAmplitudeContextMatches: calciumAmplitudeMatches,
      exactPrimitiveMappingPass: caT50Matches && kwsMultiplierMatches,
    },
    legacyTwitchContextComparison: {
      timeToPeakResidualSec:
        input.isolatedTwitch.timeToPeakSec - expected.adjustedModelOutputContext.timeToPeakSec,
      relaxationTime50ResidualSec:
        input.isolatedTwitch.relaxationTime50Sec - expected.adjustedModelOutputContext.relaxationTime50Sec,
      interpretation: "diagnostic-context-only",
    },
    lewalle2026Compatibility: {
      experimentalObservablesMayBeUsed: true,
      publishedParameterSnapshotMayBeImportedDirectly: false,
      activeTopologyCompatible: false,
      forceCalciumLengthGateReady: input.absoluteSarcomereLengthMappingAvailable,
      quickLengthStepGateReady: input.quickLengthStepProtocolImplemented,
      slackRestretchKtrGateReady: input.slackRestretchKtrProtocolImplemented,
    },
    ownership: {
      fittedToAtrialPvLoop: input.fittedToAtrialPvLoop,
      pvLoopOwnershipPass: !input.fittedToAtrialPvLoop,
    },
    releaseGate: {
      experimentalPromotionEligible: false,
      closedLoopReleaseEligible: false,
      blockers,
    },
    hashAlgorithm: "sha256-canonical-json-v1",
  };
  const result = deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  assertCanonicalSha256(payload, result.contentSha256, sha256Hex);
  return result;
}

export function atrialLandLiteratureReferenceHashPayloadV1(
  reference: AtrialLandLiteratureReferenceV1,
): Omit<AtrialLandLiteratureReferenceV1, "contentSha256"> {
  const { contentSha256: _contentSha256, ...payload } = reference;
  return payload;
}

export function atrialLandCandidateAuditHashPayloadV1(
  audit: AtrialLandCandidateLiteratureAuditV1,
): Omit<AtrialLandCandidateLiteratureAuditV1, "contentSha256"> {
  const { contentSha256: _contentSha256, ...payload } = audit;
  return payload;
}

function atrialLandLiteratureReferencePayloadV1(): Omit<
  AtrialLandLiteratureReferenceV1,
  "contentSha256"
> {
  return {
    schemaId: ATRIAL_LAND_LITERATURE_REFERENCE_SCHEMA_V1_ID,
    referenceId: "human-atrial-land-evidence-2018-2026-v1",
    status: "literature-reference-not-runtime-parameter-set",
    land2017SourceBoundary: {
      title: "A model of cardiac contraction based on novel measurements of tension development in human cardiomyocytes",
      doi: "10.1016/j.yjmcc.2017.03.008",
      url: "https://doi.org/10.1016/j.yjmcc.2017.03.008",
      currentRuntimeParameterSetId: "land2017-intact-human-37c-source-v1",
      currentBaseClassification:
        "hybrid-whole-organ-kinetics-plus-skinned-cellular-tref",
      wholeOrganColumnKineticsUsedByCurrentBase: {
        calciumSensitivityCaT50UM: 0.805,
        tropomyosinHillCoefficientNTm: 5,
        unboundToWeakRateKuwPerSec: 182,
        weakToStrongRateKwsPerSec: 12,
      },
      currentTref: {
        valuePa: 40500,
        sourceColumn: "skinned-cellular-force-pca-fit",
      },
      wholeOrganColumnTref: {
        valuePa: 120000,
        status: "unresolved-reduced-wall-scale-candidate-not-current-runtime-default",
      },
      interpretation: [
        "the current runtime ID and values are retained for reproducibility, but the source provenance is hybrid rather than a complete intact or whole-organ Appendix B column",
        "Land 2017 reports Tref=40.5 kPa from skinned-cellular force-pCa fits and Tref=120 kPa in the whole-organ column",
        "120 kPa is not promoted merely because it occupies the whole-organ source column; mapping cellular reference stress into the reduced one-fiber wall remains an independent gate",
      ],
    },
    landNiederer2018: {
      title: "Influence of atrial contraction dynamics on cardiac function",
      doi: "10.1002/cnm.2931",
      url: "https://doi.org/10.1002/cnm.2931",
      role: "legacy-six-state-atrial-candidate-context",
      atrialMapping: {
        calciumSensitivityCaT50UM: 0.86,
        ventricularToAtrialKwsMultiplier: 3,
        independentlyScaledPrimitiveRates: ["kws"],
        derivedRatesMustBeRecomputed: ["kwu", "ksu", "cs"],
      },
      calciumContext: {
        diastolicCalciumUM: 0.1,
        peakCalciumUM: 0.6,
        waveformSource: "Brixius et al. human right-atrial twitch calcium trace, digitized and smoothed by Land and Niederer",
        currentV1BiexponentialTimingIsDigitizedSourceWaveform: false,
      },
      adjustedModelOutputContext: {
        timeToPeakSec: 0.082,
        relaxationTime50Sec: 0.075,
        acceptanceStatus: "context-only-not-independent-validation",
      },
      limitations: [
        "most parameters were inherited from the ventricular Land 2017 model",
        "the authors explicitly reported limited human atrial data",
        "the adjusted-model twitch timings are outputs in a modeling context, not an independent validation dataset",
      ],
    },
    gerach2021: {
      title: "Electro-Mechanical Whole-Heart Digital Twins: A Fully Coupled Multi-Physics Approach",
      doi: "10.3390/math9111247",
      url: "https://doi.org/10.3390/math9111247",
      role: "topology-compatible-competing-six-state-atrial-candidate-context",
      activeTopologyCompatibility: {
        sameSixStateLandActiveTopology: true,
        directRuntimeTransplantReady: false,
      },
      parameterChangesFromLandNiederer2018: {
        calciumSensitivityCaT50UM: 1.05,
        lengthSensitivityBeta1UM: -0.5,
        table7ShowsAtrialKuAndNTmUnchanged: true,
      },
      coupledModelContext: {
        calciumModel: "Courtemanche-1998",
        bidirectionalCalciumTroponinCoupling: true,
        wholeHeartElectromechanicsWithAvpd: true,
        reparameterizationMotivation:
          "reduce the unphysiological atrial tension rise caused when ventricular contraction and AV-plane displacement stretch the atria",
      },
      adjustedModelOutputContext: {
        timeToPeakSec: 0.0735,
        relaxationTime50Sec: 0.0781,
        acceptanceStatus: "context-only-not-independent-validation",
      },
      limitations: [
        "the candidate was tuned with a Courtemanche calcium transient and bidirectional CaTRPN coupling rather than the current prescribed V1 calcium drive",
        "the reported twitch timings followed 1000 paced cycles at a 1 s basic cycle length and are model outputs rather than held-out human atrial observations",
        "the parameter pair must compete under predeclared force-calcium, length-step, and stretched-twitch protocols before any runtime promotion",
      ],
    },
    strocchi2023: {
      title: "Cell to whole organ global sensitivity analysis on a four-chamber heart electromechanics model using Gaussian processes emulators",
      doi: "10.1371/journal.pcbi.1011257",
      url: "https://doi.org/10.1371/journal.pcbi.1011257",
      role: "six-state-courtemanche-land-ensemble-context-only",
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
      limitations: [
        "the study reports sensitivity and a history-matched plausible ensemble, not one experimentally identified atrial parameter vector",
        "the atrial peak-tension and duration constraints partly rely on ventricular data, prior modeling, and whole-organ numerical stability because atrial measurements were sparse",
        "the Courtemanche calcium model and organ-scale filtering differ from the current V1 prescribed-calcium component context",
      ],
    },
    lewalle2026: {
      title: "Human atrial skinned muscle fibers exhibit reduced length-dependent activation but show faster force development kinetics than ventricular muscle",
      doi: "10.1016/j.yjmcc.2025.12.001",
      publication: "J Mol Cell Cardiol. 2026;211:64-77",
      paperUrl: "https://doi.org/10.1016/j.yjmcc.2025.12.001",
      supplementUrl: "https://ars.els-cdn.com/content/image/1-s2.0-S0022282825002214-mmc1.pdf",
      publicCode: {
        repositoryUrl: "https://github.com/AlexLewalle/LA_LV_models",
        commitSha: "6ce5c37cefe98376671a26bead2984b2c042315a",
        sourceFile: "LA_LV_models.py",
        repositoryLicenseAtCapturedCommit: "no-license-declared",
        capturedLeftAtrialParameters: {
          a: 3944.579512607371,
          k_trpn_on: 100,
          k_trpn_off: 100,
          ntrpn: 1.6735202109766065,
          pCa50ref: 6.017725401600836,
          ku: 6639.855493797335,
          nTm: 2.064889784164744,
          trpn50: 0.31226239147656054,
          kuw: 20871.073171061344,
          kws: 2256.842742545323,
          rw: 0.29202163492516864,
          rs: 0.5989815526257909,
          gs: 409.14004765513255,
          gw: 113344.22470909117,
          phi: 0.9322824447377062,
          Aeff: 2.8763491517852593,
          Tref: 168520.6692885566,
          Koff: 0.0034645566650656464,
          k1: 2434.5156919521987,
          koffon: 0.0005337470361252135,
          SL0: 1.4482986498025123,
        },
        sourceUnitNotes: [
          "rates are declared in 1/s, Tref and passive a in Pa, and SL0 in um",
          "Koff is dimensionless, k1 is in 1/s, and koffon is in 1/Pa because the source code multiplies it by total force in Pa",
          "pCa50ref is stored as pCa rather than the CaT50 micromolar convention used by V1",
        ],
        unresolvedSourceDiscrepancies: [
          "public code ku=6639.855493797335 1/s differs from the paper table statement that kU=1000 1/s was fixed from Land",
        ],
      },
      experimentalDesign: {
        donorCount: 9,
        leftAtrialPreparationCount: 59,
        leftVentricularPreparationCount: 67,
        preparation: "chemically-permeabilized-human-muscle-fiber",
        temperatureC: 37,
        pCaValues: [9, 6.6, 6.4, 6.2, 6, 5.8, 5.6, 5.4, 5, 4.5],
      },
      leftAtrialTargets: {
        reportedUncertaintyPolicy:
          "preserve-paper-reported-plus-minus-without-recasting-as-sem",
        bySarcomereLength: [
          {
            nominalSarcomereLengthUM: 1.9,
            measuredSarcomereLengthUM: { mean: 1.94, reportedUncertainty: 0.03, unit: "um" },
            preparationCount: 29,
            maximumActiveForceKPa: { mean: 10.52, reportedUncertainty: 1.17, unit: "kPa" },
            minimumPassiveForceKPa: { mean: 1.4, reportedUncertainty: 0.19, unit: "kPa" },
            hillCoefficient: { mean: 2.25, reportedUncertainty: 0.1, unit: "dimensionless" },
            pCa50: { mean: 5.8, reportedUncertainty: 0.02, unit: "dimensionless" },
            slackRestretchResidualFraction: { mean: 0.76, reportedUncertainty: 0.07, unit: "dimensionless" },
          },
          {
            nominalSarcomereLengthUM: 2.2,
            measuredSarcomereLengthUM: { mean: 2.23, reportedUncertainty: 0.03, unit: "um" },
            preparationCount: 30,
            maximumActiveForceKPa: { mean: 12.6, reportedUncertainty: 1.34, unit: "kPa" },
            minimumPassiveForceKPa: { mean: 2.07, reportedUncertainty: 0.21, unit: "kPa" },
            hillCoefficient: { mean: 2, reportedUncertainty: 0.11, unit: "dimensionless" },
            pCa50: { mean: 5.82, reportedUncertainty: 0.02, unit: "dimensionless" },
            slackRestretchResidualFraction: { mean: 0.77, reportedUncertainty: 0.06, unit: "dimensionless" },
          },
        ],
        centralMixedEffectsAtSarcomereLengthUM: {
          sarcomereLengthUM: 2.05,
          maximumActiveForceKPa: { mean: 11.6, reportedUncertainty: 0.9, unit: "kPa" },
          minimumPassiveForceKPa: { mean: 1.68, reportedUncertainty: 0.15, unit: "kPa" },
          hillCoefficient: { mean: 2.141, reportedUncertainty: 0.065, unit: "dimensionless" },
          pCa50: { mean: 5.807, reportedUncertainty: 0.011, unit: "dimensionless" },
          maximumActiveForceGradientKPaPerUM: { mean: 7.2, reportedUncertainty: 6.3, unit: "kPa/um" },
          minimumPassiveForceGradientKPaPerUM: { mean: 2.32, reportedUncertainty: 1.05, unit: "kPa/um" },
          pCa50GradientPerUM: { mean: 0.061, reportedUncertainty: 0.077, unit: "1/um" },
        },
        tensionRedevelopmentRateKtrPerSec: { mean: 40, reportedUncertainty: 13, unit: "1/s" },
        tensionRedevelopmentProtocol: {
          nominalSarcomereLengthUM: 2.2,
          slackFraction: 0.2,
          slackDurationSec: 0.02,
        },
        comparisonToLeftVentricle: {
          leftVentricularKtrPerSec: { mean: 15, reportedUncertainty: 3, unit: "1/s" },
          qualitativeLengthDependentActivation: "left-atrium-weaker-than-left-ventricle",
          pCa50Difference: "not-statistically-resolved",
          hillCoefficientDifference: "not-statistically-resolved",
        },
      },
      modelTopology: {
        originalLandInherited: true,
        additionalPopulationStates: ["Boff", "Uoff"],
        forceDependentOffOnTransition: true,
        passiveElement: "linear-parallel-spring",
        dropInCompatibleWithV1SixStateLand: false,
      },
    },
    usePolicy: {
      currentV1ActiveTopology: "land2017-six-state-active-only",
      directLewalleParameterTransplantation: "prohibited",
      gerachParameterPairPromotion: "component-protocol-required",
      strocchiEnsembleTransplantationAsSingleVector: "prohibited",
      fitLandOrCalciumToAtrialPvLoop: false,
      permittedUses: [
        "protocol-matched steady force-calcium and length-dependent-activation targets",
        "protocol-matched quick-restretch response targets",
        "protocol-matched tension-redevelopment ktr targets",
        "chamber-ratio and qualitative model-discrimination evidence",
      ],
      hardGatePrerequisites: [
        "absolute sarcomere-length mapping owned outside the PV loop fit",
        "cellular Tref to reduced one-fiber wall-stress mapping owned outside the PV loop fit",
        "temperature and preparation protocol match",
        "independent calcium-transient evidence for intact-twitch timing",
        "quick-restretch and ktr component protocols implemented without closed-loop fitting",
      ],
      topologyEscalationRule: "retain the six-state V1 model unless it fails predeclared held-out component data; add OFF states only as an explicit competing topology",
    },
    hashAlgorithm: "sha256-canonical-json-v1",
  };
}

function validateAuditInput(input: AtrialLandCandidateAuditInputV1): void {
  const positive = [
    input.activeEquationStateCount,
    input.caT50RefUM,
    input.ventricularKwsPerSec,
    input.atrialKwsPerSec,
    input.calciumDiastolicUM,
    input.calciumPeakUM,
    input.isolatedTwitch.timeToPeakSec,
    input.isolatedTwitch.relaxationTime50Sec,
    input.isolatedTwitch.relaxationTime90Sec,
  ];
  if (!input.candidateId || !input.parameterSetStableHash || !input.targetPackSha256) {
    throw new Error("Atrial Land audit requires candidate and provenance identifiers");
  }
  if (!positive.every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("Atrial Land audit numeric inputs must be positive and finite");
  }
  if (!(input.calciumPeakUM > input.calciumDiastolicUM)) {
    throw new Error("Atrial Land audit calcium peak must exceed diastolic calcium");
  }
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 1e-12 * Math.max(1, Math.abs(left), Math.abs(right));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
