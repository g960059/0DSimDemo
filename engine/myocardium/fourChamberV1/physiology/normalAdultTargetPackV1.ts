/**
 * Literature-informed, broad normal-adult operating envelope for the
 * four-chamber Land--TriSeg research model.
 *
 * This is an outcome target pack, not a parameter set.  In particular it does
 * not turn a CMR, catheter, or Doppler reference interval into a unique set of
 * wall, vascular, valve, calcium, Land, or SLS parameters.
 */

export const NORMAL_ADULT_TARGET_PACK_V1_ID =
  "four-chamber-land-normal-adult-target-pack-v1" as const;

export type ClosedRangeV1 = readonly [minimum: number, maximum: number];

export type NormalAdultTargetBandV1 = {
  readonly unit: string;
  readonly broadRange: ClosedRangeV1;
  readonly preferredCenter: number | null;
  readonly gateRole:
    | "primary-operating-point"
    | "secondary-consistency"
    | "construction-context"
    | "exploratory-readback";
  readonly sourceIds: readonly string[];
  readonly measurementCaveats: readonly string[];
};

export type NormalAdultEvidenceSourceV1 = {
  readonly sourceId: string;
  readonly title: string;
  readonly sourceKind:
    | "primary-study"
    | "systematic-reference-review"
    | "professional-guideline"
    | "authoritative-review"
    | "project-regression";
  readonly url: string;
  readonly supports: readonly string[];
  readonly measurementCaveats: readonly string[];
};

export type NormalAdultOwnerStageV1 = {
  readonly stage: number;
  readonly ownerId:
    | "numerical-closure-and-initialization"
    | "vascular-operating-point"
    | "anatomical-wall-geometry"
    | "valve-hydraulics"
    | "activation-and-relaxation"
    | "held-out-observers";
  readonly mayChange: readonly string[];
  readonly mustAlreadyPass: readonly string[];
  readonly mayNotCompensate: readonly string[];
};

export type NormalAdultTargetPackV1 = {
  readonly packId: typeof NORMAL_ADULT_TARGET_PACK_V1_ID;
  readonly evidenceStatus:
    "literature-informed-broad-operating-envelope-not-calibration-or-patient-fit";
  readonly population: {
    readonly species: "human";
    readonly ageClass: "adult";
    readonly state: "resting";
    readonly rhythm: "sinus";
    readonly loadingContext: "euvolemic-reference";
    readonly posture: "source-dependent-supine-or-resting-seated";
    readonly bodySurfaceAreaContextM2: ClosedRangeV1;
    readonly exclusions: readonly string[];
  };
  readonly evidenceSources: readonly NormalAdultEvidenceSourceV1[];
  readonly gateOrder: readonly string[];
  readonly ownerOrder: readonly NormalAdultOwnerStageV1[];
  readonly targets: {
    readonly globalHemodynamics: {
      readonly heartRateBpm: NormalAdultTargetBandV1;
      readonly systemicArterialPressureMmHg: {
        readonly systolic: NormalAdultTargetBandV1;
        readonly diastolic: NormalAdultTargetBandV1;
        readonly mean: NormalAdultTargetBandV1;
      };
      readonly cardiacOutputLPerMin: NormalAdultTargetBandV1;
      readonly leftRightNetOutputMismatchFraction: {
        readonly maximum: number;
        readonly gateRole: "primary-operating-point";
        readonly rationale: string;
      };
      readonly rightAtrialMeanPressureMmHg: NormalAdultTargetBandV1;
      readonly leftAtrialMeanPressureMmHg: NormalAdultTargetBandV1;
      readonly pulmonaryArterialPressureMmHg: {
        readonly systolic: NormalAdultTargetBandV1;
        readonly diastolic: NormalAdultTargetBandV1;
        readonly mean: NormalAdultTargetBandV1;
      };
      readonly leftVentricularEndDiastolicPressureMmHg:
        NormalAdultTargetBandV1;
      readonly rightVentricularPeakPressureMmHg: NormalAdultTargetBandV1;
      readonly totalBloodVolumeMl: NormalAdultTargetBandV1;
    };
    readonly chamberVolumes: {
      readonly leftVentricle: NormalAdultChamberVolumeTargetsV1;
      readonly rightVentricle: NormalAdultChamberVolumeTargetsV1;
      readonly leftAtrium: NormalAdultAtrialVolumeTargetsV1;
      readonly rightAtrium: NormalAdultAtrialVolumeTargetsV1;
      readonly sharedCaveats: readonly string[];
    };
    readonly valveAndVenousFlow: {
      readonly fixedPhaseWindowReadback: {
        readonly status: "exploratory-secondary-readback-only";
        readonly clinicalDopplerMappingValidated: false;
        readonly contributesToNormalAcceptanceGate: false;
        readonly usedForParameterFit: false;
        readonly usedForCandidateRanking: false;
      };
      readonly valveCycleRequirement: {
        readonly valves: readonly ["mitral", "aortic", "tricuspid", "pulmonary"];
        readonly eachValveMustHaveForwardOpenAndClosedIntervals: true;
        readonly netForwardVolumePerBeatMl: NormalAdultTargetBandV1;
        readonly maximumReverseFraction: number;
      };
      readonly forwardGradientMmHg: {
        readonly definition: string;
        readonly mitralMean: NormalAdultTargetBandV1;
        readonly mitralPeak: NormalAdultTargetBandV1;
        readonly aorticMean: NormalAdultTargetBandV1;
        readonly aorticPeak: NormalAdultTargetBandV1;
        readonly tricuspidMean: NormalAdultTargetBandV1;
        readonly tricuspidPeak: NormalAdultTargetBandV1;
        readonly pulmonaryMean: NormalAdultTargetBandV1;
        readonly pulmonaryPeak: NormalAdultTargetBandV1;
      };
      readonly atrioventricularInflow: {
        readonly mitralEToARatio: NormalAdultTargetBandV1;
        readonly tricuspidEToARatio: NormalAdultTargetBandV1;
        readonly distinctEarlyAndLateForwardComponentsExpectedAtOrBelowBpm: number;
        readonly useAsSingleVariableNormalityTest: false;
      };
      readonly pulmonaryVenousFlow: {
        readonly componentsToReport: readonly ["S", "D", "Ar"];
        readonly systolicForwardFraction: NormalAdultTargetBandV1;
        readonly reverseToForwardVolumeFraction: NormalAdultTargetBandV1;
        readonly eligibilityRole: "exploratory-secondary-readback-only";
        readonly shapeOrPeakTimingUsedForParameterFit: false;
      };
    };
  };
  readonly heldOutObservables: {
    readonly atrialPressureVolumeLoops: {
      readonly chambers: readonly ["leftAtrium", "rightAtrium"];
      readonly status: "held-out-readback-only";
      readonly eligibleOnlyAfterGateIds: readonly string[];
      readonly usedForParameterFit: false;
      readonly usedForCandidateRanking: false;
      readonly requiredSelfIntersectionCount: null;
      readonly requiredLobeAreaMmHgMl: null;
      readonly requiredTopology: null;
      readonly report: readonly string[];
    };
    readonly avpdMapseTapseTissueDoppler: {
      readonly status: "future-observer-candidates-unrepresented-unavailable";
      readonly computableFromCurrentCoordinates: false;
      readonly representedByCurrentStateOrCoordinates: false;
      readonly clinicalMeasurementMappingAvailable: false;
      readonly dynamicAvPlaneStateRequiredByThisPack: false;
    };
  };
  readonly claimBoundary: {
    readonly runtimeAdoption: false;
    readonly patientFit: false;
    readonly normalHumanCalibrationAchieved: false;
    readonly uniqueParameterIdentification: false;
    readonly atrialPvLoopMorphologyAcceptance: false;
    readonly mockOrReferenceLoopUsedAsTarget: false;
    readonly landCellularParameterRetuningAuthorized: false;
    readonly slsParameterRetuningAuthorized: false;
    readonly dynamicAvPlaneStateIntroduced: false;
  };
};

export type NormalAdultChamberVolumeTargetsV1 = {
  readonly endDiastolicVolumeMl: NormalAdultTargetBandV1;
  readonly endSystolicVolumeMl: NormalAdultTargetBandV1;
  readonly strokeVolumeMl: NormalAdultTargetBandV1;
  readonly ejectionFraction: NormalAdultTargetBandV1;
};

export type NormalAdultAtrialVolumeTargetsV1 = {
  readonly maximumVolumeMl: NormalAdultTargetBandV1;
  readonly minimumVolumeMl: NormalAdultTargetBandV1;
  readonly cyclicEmptyingVolumeMl: NormalAdultTargetBandV1;
  readonly totalEmptyingFraction: NormalAdultTargetBandV1;
};

const CMR_SOURCE = "kawel-boehm-2020-cmr-reference";
const HEALTHY_PAP_SOURCE = "kovacs-2009-healthy-pap";
const HEALTHY_PAWP_SOURCE = "zeder-2024-healthy-pawp";
const RHC_SOURCE = "tea-2023-rhc-practice-review";
const DIASTOLIC_SOURCE = "ase-eacvi-2016-diastolic-function";
const VALVE_SOURCE = "acc-aha-2020-valvular-heart-disease";
const BP_SOURCE = "acc-aha-2017-blood-pressure";
const HEART_RATE_SOURCE = "aha-resting-heart-rate";
const BLOOD_VOLUME_SOURCE = "nadler-1962-blood-volume";
const PROJECT_BASELINE_SOURCE = "project-modelcore-normal-regression";

const primary = (
  unit: string,
  minimum: number,
  maximum: number,
  preferredCenter: number | null,
  sourceIds: readonly string[],
  ...measurementCaveats: readonly string[]
): NormalAdultTargetBandV1 => ({
  unit,
  broadRange: [minimum, maximum],
  preferredCenter,
  gateRole: "primary-operating-point",
  sourceIds,
  measurementCaveats,
});

const secondary = (
  unit: string,
  minimum: number,
  maximum: number,
  preferredCenter: number | null,
  sourceIds: readonly string[],
  ...measurementCaveats: readonly string[]
): NormalAdultTargetBandV1 => ({
  unit,
  broadRange: [minimum, maximum],
  preferredCenter,
  gateRole: "secondary-consistency",
  sourceIds,
  measurementCaveats,
});

const constructionContext = (
  unit: string,
  minimum: number,
  maximum: number,
  preferredCenter: number | null,
  sourceIds: readonly string[],
  ...measurementCaveats: readonly string[]
): NormalAdultTargetBandV1 => ({
  unit,
  broadRange: [minimum, maximum],
  preferredCenter,
  gateRole: "construction-context",
  sourceIds,
  measurementCaveats,
});

const exploratoryReadback = (
  unit: string,
  minimum: number,
  maximum: number,
  preferredCenter: number | null,
  sourceIds: readonly string[],
  ...measurementCaveats: readonly string[]
): NormalAdultTargetBandV1 => ({
  unit,
  broadRange: [minimum, maximum],
  preferredCenter,
  gateRole: "exploratory-readback",
  sourceIds,
  measurementCaveats,
});

const chamberVolumeSources = [CMR_SOURCE] as const;
const gradientSources = [VALVE_SOURCE, PROJECT_BASELINE_SOURCE] as const;

export const NORMAL_ADULT_TARGET_PACK_V1 = deepFreeze({
  packId: NORMAL_ADULT_TARGET_PACK_V1_ID,
  evidenceStatus:
    "literature-informed-broad-operating-envelope-not-calibration-or-patient-fit",
  population: {
    species: "human",
    ageClass: "adult",
    state: "resting",
    rhythm: "sinus",
    loadingContext: "euvolemic-reference",
    posture: "source-dependent-supine-or-resting-seated",
    bodySurfaceAreaContextM2: [1.5, 2.3],
    exclusions: [
      "pregnancy",
      "trained-athlete remodeling",
      "atrial fibrillation or paced non-sinus rhythm",
      "more-than-mild native valve disease",
      "known pulmonary hypertension",
      "congenital shunt or surgically altered circulation",
    ],
  },
  evidenceSources: [
    {
      sourceId: CMR_SOURCE,
      title: "Reference ranges (normal values) for cardiovascular magnetic resonance in adults and children: 2020 update",
      sourceKind: "systematic-reference-review",
      url: "https://doi.org/10.1186/s12968-020-00683-3",
      supports: [
        "adult LV and RV EDV, ESV, SV, and EF",
        "adult LA and RA maximum/minimum volumes and emptying fractions",
        "resting cardiac-output context",
      ],
      measurementCaveats: [
        "absolute volumes vary with sex, age, body surface area, acquisition plane, contour convention, and whether appendages or papillary muscles are included",
        "the target bands use a broad union of reported adult reference limits rather than a sex-specific patient reference interval",
      ],
    },
    {
      sourceId: HEALTHY_PAP_SOURCE,
      title: "Pulmonary arterial pressure during rest and exercise in healthy subjects: a systematic review",
      sourceKind: "systematic-reference-review",
      url: "https://doi.org/10.1183/09031936.00145608",
      supports: ["resting invasive mean pulmonary arterial pressure"],
      measurementCaveats: [
        "the pooled healthy resting mPAP was 14.0 +/- 3.3 mmHg; age and exercise alter pulmonary pressure",
        "catheter zero level, respiratory averaging, posture, and selection of healthy volunteers affect the estimate",
      ],
    },
    {
      sourceId: HEALTHY_PAWP_SOURCE,
      title: "Pulmonary arterial wedge pressure in healthy subjects: a meta-analysis",
      sourceKind: "systematic-reference-review",
      url: "https://doi.org/10.1183/13993003.00967-2024",
      supports: ["supine resting pulmonary arterial wedge pressure"],
      measurementCaveats: [
        "the pooled PAWP was 9.4 +/- 1.82 mmHg with an upper limit near 13 mmHg",
        "PAWP is an indirect LA-pressure surrogate and is not numerically identical to model mean LAP or LVEDP",
      ],
    },
    {
      sourceId: RHC_SOURCE,
      title: "Right heart catheterization in clinical practice: a review of basic physiology and interpretation",
      sourceKind: "authoritative-review",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10352814/",
      supports: [
        "RAP, RV, PA, PCWP, and cardiac-output broad clinical corridors",
        "pressure-wave measurement caveats",
      ],
      measurementCaveats: [
        "zeroing, damping, end-expiratory versus respiratory-mean reading, and catheter position materially alter measured pressures",
        "Fick and thermodilution cardiac-output estimates are method dependent",
      ],
    },
    {
      sourceId: DIASTOLIC_SOURCE,
      title: "2016 ASE/EACVI recommendations for evaluation of LV diastolic function",
      sourceKind: "professional-guideline",
      url: "https://doi.org/10.1016/j.echo.2016.01.011",
      supports: [
        "mitral E/A and pulmonary-venous S/D/Ar interpretation",
        "relationship of pulmonary-venous systolic filling fraction to LAP",
      ],
      measurementCaveats: [
        "Doppler velocity ratios are not identical to integrated 0D volume-flow ratios",
        "age, rhythm, loading, LVEF, mitral disease, and recording quality change E/A and pulmonary-venous flow; no single index establishes normality",
      ],
    },
    {
      sourceId: VALVE_SOURCE,
      title: "2020 ACC/AHA guideline for management of valvular heart disease",
      sourceKind: "professional-guideline",
      url: "https://doi.org/10.1161/CIR.0000000000000923",
      supports: ["anti-stenotic valve-gradient ceilings and regurgitation context"],
      measurementCaveats: [
        "guideline stenosis cut points are disease-severity thresholds, not healthy reference intervals",
        "Doppler gradients and the model same-time-level pressure drop are different observables; model corridors are deliberately conservative",
      ],
    },
    {
      sourceId: BP_SOURCE,
      title: "2017 ACC/AHA adult high-blood-pressure guideline",
      sourceKind: "professional-guideline",
      url: "https://doi.org/10.1161/HYP.0000000000000065",
      supports: ["resting systemic systolic and diastolic pressure context"],
      measurementCaveats: [
        "cuff pressure categories are not an invasive central-aortic reference interval",
        "the broad simulator corridor includes ordinary biological and measurement variation around the guideline normal category",
      ],
    },
    {
      sourceId: HEART_RATE_SOURCE,
      title: "American Heart Association resting heart-rate reference",
      sourceKind: "authoritative-review",
      url: "https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates",
      supports: ["adult resting heart-rate corridor"],
      measurementCaveats: [
        "the AHA describes 60-100 bpm as normal for most resting adults; physical activity and medication can place individuals outside that range and require an explicitly different context",
      ],
    },
    {
      sourceId: BLOOD_VOLUME_SOURCE,
      title: "Prediction of blood volume in normal human adults",
      sourceKind: "primary-study",
      url: "https://pubmed.ncbi.nlm.nih.gov/21936146/",
      supports: ["body-size- and sex-dependent total blood-volume construction context"],
      measurementCaveats: [
        "total blood volume is not a universal adult constant and must be conditioned on height, weight, sex, pregnancy, and hydration",
        "the broad band is an initialization context, not a physiology acceptance gate or a license for hidden volume projection",
      ],
    },
    {
      sourceId: PROJECT_BASELINE_SOURCE,
      title: "0DSimDemo legacy normal-baseline regression gates",
      sourceKind: "project-regression",
      url: "https://github.com/g960059/0DSimDemo/blob/main/engine/__tests__/baseline.test.ts",
      supports: [
        "continuity with existing MAP, CO, filling-pressure, valve-gradient, and right-heart smoke corridors",
      ],
      measurementCaveats: [
        "this is internal regression evidence, not biological or clinical validation",
        "its historical atrial figure-eight and loop-area checks are explicitly not imported into this target pack",
      ],
    },
  ],
  gateOrder: [
    "numerical-integrity",
    "blood-volume-conservation-and-period-1",
    "global-hemodynamics",
    "chamber-volume-envelope",
    "valve-and-pulmonary-venous-flow",
    "held-out-observers",
  ],
  ownerOrder: [
    {
      stage: 0,
      ownerId: "numerical-closure-and-initialization",
      mayChange: [
        "continuation path",
        "Newton scales and tolerances",
        "time step and event splitting",
        "phase-consistent initial state",
      ],
      mustAlreadyPass: [],
      mayNotCompensate: [
        "physiology target miss with numerical damping or blood-volume projection",
      ],
    },
    {
      stage: 1,
      ownerId: "vascular-operating-point",
      mayChange: [
        "declared total blood volume",
        "unstressed vascular volumes",
        "systemic and pulmonary resistance",
        "arterial and venous compliance",
        "initial blood-volume allocation",
      ],
      mustAlreadyPass: ["numerical-integrity"],
      mayNotCompensate: [
        "wall anatomy",
        "Land cellular kinetics",
        "SLS history",
        "atrial PV-loop topology",
      ],
    },
    {
      stage: 2,
      ownerId: "anatomical-wall-geometry",
      mayChange: [
        "LA and RA wall/reference cavity volumes",
        "LVFW, septal, and RVFW wall volumes/reference areas",
        "anatomy-owned pericardial reference volume",
      ],
      mustAlreadyPass: ["global-hemodynamics"],
      mayNotCompensate: [
        "vascular pressure target miss",
        "valve obstruction",
        "held-out atrial PV-loop morphology",
      ],
    },
    {
      stage: 3,
      ownerId: "valve-hydraulics",
      mayChange: [
        "valve effective open/leak areas",
        "valve resistance/inertance/loss coefficients",
        "opening and closing transition policy",
      ],
      mustAlreadyPass: ["global-hemodynamics", "chamber-volume-envelope"],
      mayNotCompensate: [
        "myocardial active capacity",
        "relaxation timing",
        "held-out atrial PV-loop morphology",
      ],
    },
    {
      stage: 4,
      ownerId: "activation-and-relaxation",
      mayChange: [
        "evidence-backed atrial/ventricular event timing",
        "independently constrained prescribed-calcium relaxation",
        "isolated-tissue-qualified macro active transmission",
      ],
      mustAlreadyPass: [
        "global-hemodynamics",
        "chamber-volume-envelope",
        "valve-forward-gradient-and-regurgitation",
      ],
      mayNotCompensate: [
        "wrong vascular resistance or compliance",
        "wrong wall anatomy",
        "held-out atrial PV-loop area or topology",
      ],
    },
    {
      stage: 5,
      ownerId: "held-out-observers",
      mayChange: [],
      mustAlreadyPass: [
        "blood-volume-conservation-and-period-1",
        "global-hemodynamics",
        "chamber-volume-envelope",
        "valve-and-pulmonary-venous-flow",
      ],
      mayNotCompensate: ["any model parameter or state equation"],
    },
  ],
  targets: {
    globalHemodynamics: {
      heartRateBpm: primary(
        "bpm", 60, 100, 75, [HEART_RATE_SOURCE],
        "the nominal 75 bpm center is a protocol anchor, not a population mean; lower rates require a declared activity or medication context rather than silently widening this primary corridor",
      ),
      systemicArterialPressureMmHg: {
        systolic: primary(
          "mmHg", 100, 130, 120, [BP_SOURCE, PROJECT_BASELINE_SOURCE],
          "compare with the model central systemic-artery waveform, not a literal brachial cuff trace",
        ),
        diastolic: primary(
          "mmHg", 60, 85, 80, [BP_SOURCE, PROJECT_BASELINE_SOURCE],
          "the upper corridor is a broad operating ceiling rather than the guideline definition of normal cuff pressure",
        ),
        mean: primary(
          "mmHg", 75, 100, 90, [PROJECT_BASELINE_SOURCE],
          "MAP is a cycle average of the model arterial pressure and must be assessed only after period-1 convergence",
        ),
      },
      cardiacOutputLPerMin: primary(
        "L/min", 4, 8, 5.5, [CMR_SOURCE, RHC_SOURCE, PROJECT_BASELINE_SOURCE],
        "absolute CO is body-size dependent; cardiac index should be added for patient-specific use",
      ),
      leftRightNetOutputMismatchFraction: {
        maximum: 0.05,
        gateRole: "primary-operating-point",
        rationale: "a closed period-1 circulation cannot sustain different left and right net outputs",
      },
      rightAtrialMeanPressureMmHg: primary(
        "mmHg", 0, 6, 3, [RHC_SOURCE, PROJECT_BASELINE_SOURCE],
        "catheter RAP uses an external zero reference; model pressure must declare its external/pericardial reference",
      ),
      leftAtrialMeanPressureMmHg: primary(
        "mmHg", 4, 13, 9, [HEALTHY_PAWP_SOURCE, RHC_SOURCE, PROJECT_BASELINE_SOURCE],
        "PAWP evidence supplies a broad surrogate corridor and is not an identity LAP=PAWP=LVEDP",
      ),
      pulmonaryArterialPressureMmHg: {
        systolic: primary(
          "mmHg", 15, 35, 25, [RHC_SOURCE],
          "allow a broader model corridor than a single catheter table because age and respiratory convention vary",
        ),
        diastolic: primary(
          "mmHg", 4, 15, 9, [RHC_SOURCE],
          "the model pulmonary artery is a lumped compartment rather than a catheter location",
        ),
        mean: primary(
          "mmHg", 10, 20, 14, [HEALTHY_PAP_SOURCE, RHC_SOURCE, PROJECT_BASELINE_SOURCE],
          "the 20 mmHg ceiling is an upper normal boundary, not a preferred tuning target",
        ),
      },
      leftVentricularEndDiastolicPressureMmHg: primary(
        "mmHg", 5, 15, 10, [HEALTHY_PAWP_SOURCE, RHC_SOURCE, PROJECT_BASELINE_SOURCE],
        "LVEDP is an event-local pressure and must not be replaced by cycle-mean LAP or PAWP",
      ),
      rightVentricularPeakPressureMmHg: primary(
        "mmHg", 15, 40, 25, [RHC_SOURCE, PROJECT_BASELINE_SOURCE],
        "peak pressure is phase-local and must be paired with pulmonary-valve opening/ejection",
      ),
      totalBloodVolumeMl: constructionContext(
        "mL", 4000, 7000, 5600, [BLOOD_VOLUME_SOURCE, PROJECT_BASELINE_SOURCE],
        "derive a subject-specific target from body size when available; 5600 mL is the project construction anchor",
      ),
    },
    chamberVolumes: {
      leftVentricle: {
        endDiastolicVolumeMl: primary(
          "mL", 78, 215, 135, chamberVolumeSources,
          "union of adult male/female CMR limits; index to BSA for patient use",
        ),
        endSystolicVolumeMl: primary(
          "mL", 21, 85, 50, chamberVolumeSources,
          "papillary-muscle contour convention changes absolute volume",
        ),
        strokeVolumeMl: primary(
          "mL/beat", 52, 145, 80, chamberVolumeSources,
          "must agree with integrated aortic forward-minus-reverse flow at period-1",
        ),
        ejectionFraction: primary(
          "fraction", 0.49, 0.79, 0.62, chamberVolumeSources,
          "EF is derived from the same EDV/ESV definition and is not an independent fitting degree of freedom",
        ),
      },
      rightVentricle: {
        endDiastolicVolumeMl: primary(
          "mL", 68, 244, 145, chamberVolumeSources,
          "union of adult male/female CMR limits; RV contouring is method sensitive",
        ),
        endSystolicVolumeMl: primary(
          "mL", 13, 117, 55, chamberVolumeSources,
          "papillary-muscle inclusion and basal-slice selection alter RV volume",
        ),
        strokeVolumeMl: primary(
          "mL/beat", 39, 146, 80, chamberVolumeSources,
          "at period-1 this must agree with both pulmonary-valve net flow and LV stroke volume within tolerance",
        ),
        ejectionFraction: primary(
          "fraction", 0.45, 0.80, 0.62, chamberVolumeSources,
          "the lower edge is deliberately broad across CMR methods and body sizes",
        ),
      },
      leftAtrium: {
        maximumVolumeMl: primary(
          "mL", 28, 115, 65, chamberVolumeSources,
          "LA appendage and pulmonary veins may be included or excluded across source methods",
        ),
        minimumVolumeMl: primary(
          "mL", 6, 50, 25, chamberVolumeSources,
          "minimum must remain a positive blood volume; no artificial volume clamp may create the pass",
        ),
        cyclicEmptyingVolumeMl: primary(
          "mL/beat", 19, 73, 42, chamberVolumeSources,
          "this is maximum-minus-minimum chamber blood volume, not booster-pump volume alone",
        ),
        totalEmptyingFraction: secondary(
          "fraction", 0.38, 0.78, 0.60, chamberVolumeSources,
          "CMR total emptying fraction combines reservoir, conduit, and booster contributions",
        ),
      },
      rightAtrium: {
        maximumVolumeMl: primary(
          "mL", 24, 158, 80, chamberVolumeSources,
          "RA appendage and caval-junction contour conventions materially change absolute volume",
        ),
        minimumVolumeMl: primary(
          "mL", 9, 84, 35, chamberVolumeSources,
          "minimum must remain a positive blood volume; no artificial volume clamp may create the pass",
        ),
        cyclicEmptyingVolumeMl: primary(
          "mL/beat", 23, 90, 50, chamberVolumeSources,
          "this is maximum-minus-minimum chamber blood volume, not booster-pump volume alone",
        ),
        totalEmptyingFraction: secondary(
          "fraction", 0.29, 0.77, 0.53, chamberVolumeSources,
          "the broad union reflects large method and sex differences in published CMR limits",
        ),
      },
      sharedCaveats: [
        "all absolute-volume bands are broad adult screening corridors, not patient-specific normal limits",
        "volume extrema must be taken from the same converged cycle and must respect the model blood-volume ledger",
        "a chamber can pass its volume range while still failing pressure, flow, timing, or constitutive plausibility",
      ],
    },
    valveAndVenousFlow: {
      fixedPhaseWindowReadback: {
        status: "exploratory-secondary-readback-only",
        clinicalDopplerMappingValidated: false,
        contributesToNormalAcceptanceGate: false,
        usedForParameterFit: false,
        usedForCandidateRanking: false,
      },
      valveCycleRequirement: {
        valves: ["mitral", "aortic", "tricuspid", "pulmonary"],
        eachValveMustHaveForwardOpenAndClosedIntervals: true,
        netForwardVolumePerBeatMl: primary(
          "mL/beat", 40, 145, 80, [CMR_SOURCE, VALVE_SOURCE],
          "net valve volume is integrated model flow and is not a Doppler velocity",
        ),
        maximumReverseFraction: 0.05,
      },
      forwardGradientMmHg: {
        definition:
          "cycle samples with forward flow; same-time-level upstream minus downstream model pressure, reported as both flow-weighted mean and peak",
        mitralMean: secondary(
          "mmHg", 0, 3, 1, gradientSources,
          "operational anti-stenotic corridor, not a healthy Doppler reference interval",
        ),
        mitralPeak: secondary(
          "mmHg", 0, 6.5, 3, gradientSources,
          "short numerical opening transients must be reported separately from sustained gradients",
        ),
        aorticMean: secondary(
          "mmHg", 0, 15, 5, gradientSources,
          "kept below stenotic disease thresholds; Doppler and lumped pressure-loss definitions differ",
        ),
        aorticPeak: secondary(
          "mmHg", 0, 25, 10, gradientSources,
          "peak must be paired with forward ejection rather than an isolated pressure spike",
        ),
        tricuspidMean: secondary(
          "mmHg", 0, 3, 1, gradientSources,
          "same-time-level model pressure drop, not continuous-wave Doppler",
        ),
        tricuspidPeak: secondary(
          "mmHg", 0, 7, 3, gradientSources,
          "short numerical opening transients must be reported separately from sustained gradients",
        ),
        pulmonaryMean: secondary(
          "mmHg", 0, 5, 2, gradientSources,
          "same-time-level model pressure drop, not Doppler-derived gradient",
        ),
        pulmonaryPeak: secondary(
          "mmHg", 0, 10, 4, gradientSources,
          "peak must be paired with forward ejection rather than an isolated pressure spike",
        ),
      },
      atrioventricularInflow: {
        mitralEToARatio: exploratoryReadback(
          "ratio", 0.6, 2.0, 1.2, [DIASTOLIC_SOURCE],
          "age and loading dependent; model peak flow is not Doppler tip velocity",
        ),
        tricuspidEToARatio: exploratoryReadback(
          "ratio", 0.6, 2.2, 1.3, [DIASTOLIC_SOURCE],
          "used only as a broad consistency readback because the cited guideline is LV/mitral focused",
        ),
        distinctEarlyAndLateForwardComponentsExpectedAtOrBelowBpm: 90,
        useAsSingleVariableNormalityTest: false,
      },
      pulmonaryVenousFlow: {
        componentsToReport: ["S", "D", "Ar"],
        systolicForwardFraction: exploratoryReadback(
          "fraction", 0.35, 0.75, 0.5, [DIASTOLIC_SOURCE],
          "below 0.40 can support raised LAP in reduced LVEF, but young healthy subjects can have S/D below one and normal-LVEF accuracy is limited",
        ),
        reverseToForwardVolumeFraction: exploratoryReadback(
          "fraction", 0, 0.10, 0.03, [DIASTOLIC_SOURCE, PROJECT_BASELINE_SOURCE],
          "integrated model Ar volume is not directly interchangeable with Doppler Ar peak velocity or duration",
        ),
        eligibilityRole: "exploratory-secondary-readback-only",
        shapeOrPeakTimingUsedForParameterFit: false,
      },
    },
  },
  heldOutObservables: {
    atrialPressureVolumeLoops: {
      chambers: ["leftAtrium", "rightAtrium"],
      status: "held-out-readback-only",
      eligibleOnlyAfterGateIds: [
        "blood-volume-conservation-and-period-1",
        "global-hemodynamics",
        "chamber-volume-envelope",
        "valve-and-pulmonary-venous-flow",
      ],
      usedForParameterFit: false,
      usedForCandidateRanking: false,
      requiredSelfIntersectionCount: null,
      requiredLobeAreaMmHgMl: null,
      requiredTopology: null,
      report: [
        "raw periodic blood-volume PV polyline",
        "signed and absolute projected areas",
        "self intersections with crossing angle",
        "matched-volume reservoir-minus-conduit pressure separation",
        "equilibrium-passive, Land-active, SLS, external/pericardial, and transport attribution",
      ],
    },
    avpdMapseTapseTissueDoppler: {
      status: "future-observer-candidates-unrepresented-unavailable",
      computableFromCurrentCoordinates: false,
      representedByCurrentStateOrCoordinates: false,
      clinicalMeasurementMappingAvailable: false,
      dynamicAvPlaneStateRequiredByThisPack: false,
    },
  },
  claimBoundary: {
    runtimeAdoption: false,
    patientFit: false,
    normalHumanCalibrationAchieved: false,
    uniqueParameterIdentification: false,
    atrialPvLoopMorphologyAcceptance: false,
    mockOrReferenceLoopUsedAsTarget: false,
    landCellularParameterRetuningAuthorized: false,
    slsParameterRetuningAuthorized: false,
    dynamicAvPlaneStateIntroduced: false,
  },
} satisfies NormalAdultTargetPackV1);

validateNormalAdultTargetPackV1(NORMAL_ADULT_TARGET_PACK_V1);

export function validateNormalAdultTargetPackV1(
  pack: NormalAdultTargetPackV1,
): NormalAdultTargetPackV1 {
  if (pack.packId !== NORMAL_ADULT_TARGET_PACK_V1_ID) {
    throw new Error("unexpected normal-adult target-pack id");
  }
  const sourceIds = new Set<string>();
  for (const source of pack.evidenceSources) {
    if (sourceIds.has(source.sourceId)) {
      throw new Error(`duplicate evidence source id: ${source.sourceId}`);
    }
    sourceIds.add(source.sourceId);
    if (!source.url.startsWith("https://")) {
      throw new Error(`evidence source URL must use https: ${source.sourceId}`);
    }
    if (source.supports.length === 0 || source.measurementCaveats.length === 0) {
      throw new Error(`evidence source must declare support and caveats: ${source.sourceId}`);
    }
  }
  const targetBands = collectTargetBands(pack.targets);
  for (const [path, band] of targetBands) {
    validateRange(band.broadRange, path);
    if (band.preferredCenter !== null &&
      (band.preferredCenter < band.broadRange[0] ||
        band.preferredCenter > band.broadRange[1])) {
      throw new Error(`${path}.preferredCenter must lie inside broadRange`);
    }
    if (band.sourceIds.length === 0) {
      throw new Error(`${path} must cite at least one evidence source`);
    }
    for (const sourceId of band.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(`${path} cites unknown source ${sourceId}`);
      }
    }
    if (band.measurementCaveats.length === 0) {
      throw new Error(`${path} must declare a measurement caveat`);
    }
  }
  pack.ownerOrder.forEach((owner, index) => {
    if (owner.stage !== index) throw new Error("owner stages must be contiguous and ordered");
  });
  if (pack.ownerOrder.at(-1)?.ownerId !== "held-out-observers" ||
    pack.ownerOrder.at(-1)?.mayChange.length !== 0) {
    throw new Error("held-out observers must be last and own no mutable parameters");
  }
  const heldOut = pack.heldOutObservables.atrialPressureVolumeLoops;
  if (heldOut.usedForParameterFit || heldOut.usedForCandidateRanking ||
    heldOut.requiredSelfIntersectionCount !== null ||
    heldOut.requiredLobeAreaMmHgMl !== null || heldOut.requiredTopology !== null) {
    throw new Error("atrial PV-loop morphology must remain held out");
  }
  const fixedWindows = pack.targets.valveAndVenousFlow.fixedPhaseWindowReadback;
  if (fixedWindows.status !== "exploratory-secondary-readback-only" ||
    fixedWindows.clinicalDopplerMappingValidated ||
    fixedWindows.contributesToNormalAcceptanceGate ||
    fixedWindows.usedForParameterFit || fixedWindows.usedForCandidateRanking) {
    throw new Error("fixed phase-window filling metrics must remain exploratory readback only");
  }
  const longitudinal = pack.heldOutObservables.avpdMapseTapseTissueDoppler;
  if (longitudinal.status !==
      "future-observer-candidates-unrepresented-unavailable" ||
    longitudinal.computableFromCurrentCoordinates ||
    longitudinal.representedByCurrentStateOrCoordinates ||
    longitudinal.clinicalMeasurementMappingAvailable ||
    longitudinal.dynamicAvPlaneStateRequiredByThisPack) {
    throw new Error("longitudinal observables must remain unavailable in the current coordinate set");
  }
  return pack;
}

function collectTargetBands(
  value: unknown,
  path = "targets",
  result: Array<readonly [string, NormalAdultTargetBandV1]> = [],
): Array<readonly [string, NormalAdultTargetBandV1]> {
  if (isTargetBand(value)) {
    result.push([path, value]);
    return result;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      collectTargetBands(child, `${path}.${key}`, result);
    }
  }
  return result;
}

function isTargetBand(value: unknown): value is NormalAdultTargetBandV1 {
  return value !== null && typeof value === "object" &&
    Object.prototype.hasOwnProperty.call(value, "broadRange") &&
    Object.prototype.hasOwnProperty.call(value, "gateRole") &&
    Object.prototype.hasOwnProperty.call(value, "sourceIds");
}

function validateRange(range: ClosedRangeV1, path: string): void {
  if (range.length !== 2 || !Number.isFinite(range[0]) ||
    !Number.isFinite(range[1]) || range[0] >= range[1]) {
    throw new Error(`${path}.broadRange must be a finite increasing pair`);
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
