import {
  CORONARY_BOUNDARY_NODE_IDS_V2,
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_EDGE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_PERFUSED_WALL_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryConservedVolumeNodeIdV2,
  type CoronaryConservedVolumeRecordV2,
  type CoronaryEdgeIdV2,
  type CoronaryHydraulicNodeIdV2,
  type CoronaryLayerIdV2,
  type CoronaryLayerRecordV2,
  type CoronaryPerfusedWallIdV2,
  type CoronaryPerfusedWallRecordV2,
  type CoronaryTerritoryIdV2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
  type CoronaryToneStateV2,
} from "@/engine/coronary/typesV2";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  isTransitivelyFrozenPlainDataV1,
  validationStampIssuanceEligibleV1,
  validationStampReuseEligibleV1,
} from "@/engine/validationStampModeV1";

export const CORONARY_TOPOLOGY_ID_V2 =
  "main-wire-coronary-three-territory-two-layer-two-compliance-v2" as const;
export const CORONARY_CONSTRUCTION_SEED_SCHEMA_ID_V2 =
  "main-wire-coronary-network-construction-seed-v2" as const;

const coronaryTopologyByImmutablePriorV2 =
  new WeakMap<object, CoronaryTopologyV2>();

/**
 * Structural blood-volume ledger from porcine coronary morphometry.
 *
 * This is a cross-species allocation prior, not a fitted human pressure-volume
 * relation.  In particular, these blood volumes do not determine C1 or C2.
 */
export const KASSAB_CORONARY_BLOOD_VOLUME_PRIOR_V2 = Object.freeze({
  source: "Kassab et al. 1994 porcine coronary morphometry" as const,
  pubmedId: "7810711" as const,
  referenceSpecies: "porcine" as const,
  unit: "mL/100g-left-ventricular-mass" as const,
  wholeCoronary: 12.2,
  exclusiveNormalizedFraction01: Object.freeze({
    largeArterial: 0.274,
    microvascular: 0.355,
    largeVenous: 0.371,
  }),
  // Derived from 12.2 times the mutually exclusive morphometric fractions.
  // Rounded absolute component values are not independently summed.
  derivedVolumeMlPer100G: Object.freeze({
    largeArterial: 12.2 * 0.274,
    microvascular: 12.2 * 0.355,
    largeVenous: 12.2 * 0.371,
  }),
  reportedRoundedAbsoluteEvidenceOnlyMlPer100G: Object.freeze({
    arterial: 3.5,
    capillary: 3.8,
    venous: 4.9,
  }),
  evidenceBoundary:
    "porcine-lv-mass-denominator-cross-species-structural-prior-not-human-fit" as const,
});

/**
 * Effective two-compartment compliance prior from Spaan et al.'s canine
 * septal identification.  These are effective storage compliances and must
 * remain independent of the Kassab structural volume ledger.
 */
export const SPAAN_TWO_COMPARTMENT_COMPLIANCE_PRIOR_V2 = Object.freeze({
  source: "Spaan et al. 2000 two-compartment coronary model" as const,
  doi: "10.1152/ajpheart.2000.278.2.H383" as const,
  referenceSpecies: "canine" as const,
  unit: "mL/mmHg/100g-myocardium" as const,
  c1Proximal: Object.freeze({ center: 0.015, sensitivityLow: 0.01, sensitivityHigh: 0.03 }),
  c2Distal: Object.freeze({ center: 0.30, sensitivityLow: 0.15, sensitivityHigh: 0.50 }),
  centerRatioC2OverC1: 20,
  evidenceBoundary: "cross-species-effective-compliance-prior-not-human-fit" as const,
  bloodVolumeDeterminesCompliance: false as const,
});

/**
 * Explicit large-vessel local-slope staging prior.  The V1 arterial and sinus
 * compliance values are intentionally not inherited: these slopes are weak,
 * separately ablatable construction priors until a dedicated identification
 * protocol is accepted.
 */
export const LARGE_VESSEL_LOCAL_COMPLIANCE_PRIOR_V2 = Object.freeze({
  referenceRelativeCompliancePerMmHg: Object.freeze({
    largeArterial: Object.freeze({ center: 0.0025, sensitivityLow: 0.001, sensitivityHigh: 0.005 }),
    largeVenous: Object.freeze({ center: 0.02, sensitivityLow: 0.01, sensitivityHigh: 0.04 }),
  }),
  mappingRule: "C_ref=V_ref*relative_compliance" as const,
  evidenceBoundary:
    "explicit-computational-ablation-prior-not-literature-identified-and-not-v1-reuse" as const,
});

export type CrefAnchoredCollapsiblePvPriorV2 = Readonly<{
  referenceVolumeMl: number;
  referenceComplianceMlPerMmHg: number;
  pressureScaleMmHg: number;
  expansionExponent: number;
  collapseExponent: number;
  loadedSeedVolumeMl: number;
  loadedSeedTransmuralPressureMmHg: number;
  mappingRule: "P0=Vref/[Cref*(m+n)]";
}>;

export function compileCrefAnchoredCollapsiblePvPriorV2(input: Readonly<{
  referenceVolumeMl: number;
  referenceComplianceMlPerMmHg: number;
  expansionExponent?: number;
  collapseExponent?: number;
  loadedSeedVolumeMl?: number;
  loadedSeedTransmuralPressureMmHg?: number;
}>): CrefAnchoredCollapsiblePvPriorV2 {
  const expansionExponent = input.expansionExponent ?? 4;
  const collapseExponent = input.collapseExponent ?? 2;
  for (const [name, value] of [
    ["referenceVolumeMl", input.referenceVolumeMl],
    ["referenceComplianceMlPerMmHg", input.referenceComplianceMlPerMmHg],
    ["expansionExponent", expansionExponent],
    ["collapseExponent", collapseExponent],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite`);
    }
  }
  return Object.freeze({
    referenceVolumeMl: input.referenceVolumeMl,
    referenceComplianceMlPerMmHg: input.referenceComplianceMlPerMmHg,
    pressureScaleMmHg:
      input.referenceVolumeMl
      / (input.referenceComplianceMlPerMmHg * (expansionExponent + collapseExponent)),
    expansionExponent,
    collapseExponent,
    loadedSeedVolumeMl: input.loadedSeedVolumeMl ?? input.referenceVolumeMl,
    loadedSeedTransmuralPressureMmHg:
      input.loadedSeedTransmuralPressureMmHg ?? 0,
    mappingRule: "P0=Vref/[Cref*(m+n)]",
  });
}

export function compileCrefAnchoredCollapsiblePvFromLoadedSeedV2(
  input: Readonly<{
    loadedSeedVolumeMl: number;
    loadedSeedTransmuralPressureMmHg: number;
    referenceComplianceMlPerMmHg: number;
    expansionExponent?: number;
    collapseExponent?: number;
  }>,
): CrefAnchoredCollapsiblePvPriorV2 {
  const expansionExponent = input.expansionExponent ?? 4;
  const collapseExponent = input.collapseExponent ?? 2;
  for (const [name, value] of [
    ["loadedSeedVolumeMl", input.loadedSeedVolumeMl],
    ["referenceComplianceMlPerMmHg", input.referenceComplianceMlPerMmHg],
    ["expansionExponent", expansionExponent],
    ["collapseExponent", collapseExponent],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite`);
    }
  }
  if (
    !Number.isFinite(input.loadedSeedTransmuralPressureMmHg)
    || input.loadedSeedTransmuralPressureMmHg < 0
  ) {
    throw new RangeError(
      "loadedSeedTransmuralPressureMmHg must be finite and non-negative",
    );
  }
  let normalizedLoadedVolume = 1;
  if (input.loadedSeedTransmuralPressureMmHg > 0) {
    const pressureAt = (x: number): number =>
      input.loadedSeedVolumeMl
      / (input.referenceComplianceMlPerMmHg
        * (expansionExponent + collapseExponent))
      * (
        x ** (expansionExponent - 1)
        - x ** (-collapseExponent - 1)
      );
    let lower = 1;
    let upper = 2;
    while (pressureAt(upper) < input.loadedSeedTransmuralPressureMmHg) {
      upper *= 2;
    }
    for (let iteration = 0; iteration < 96; iteration += 1) {
      const midpoint = 0.5 * (lower + upper);
      if (pressureAt(midpoint) < input.loadedSeedTransmuralPressureMmHg) {
        lower = midpoint;
      } else {
        upper = midpoint;
      }
    }
    normalizedLoadedVolume = 0.5 * (lower + upper);
  }
  return compileCrefAnchoredCollapsiblePvPriorV2({
    referenceVolumeMl: input.loadedSeedVolumeMl / normalizedLoadedVolume,
    referenceComplianceMlPerMmHg: input.referenceComplianceMlPerMmHg,
    expansionExponent,
    collapseExponent,
    loadedSeedVolumeMl: input.loadedSeedVolumeMl,
    loadedSeedTransmuralPressureMmHg:
      input.loadedSeedTransmuralPressureMmHg,
  });
}

export function evaluateCrefAnchoredCollapsiblePvV2(
  volumeMl: number,
  prior: CrefAnchoredCollapsiblePvPriorV2,
): Readonly<{
  transmuralPressureMmHg: number;
  complianceMlPerMmHg: number;
}> {
  if (!Number.isFinite(volumeMl) || volumeMl <= 0) {
    throw new RangeError("volumeMl must be positive and finite");
  }
  const normalizedVolume = volumeMl / prior.referenceVolumeMl;
  const dPressureDNormalizedVolume = prior.pressureScaleMmHg * (
    prior.expansionExponent
      * normalizedVolume ** (prior.expansionExponent - 1)
    + prior.collapseExponent
      * normalizedVolume ** (-prior.collapseExponent - 1)
  );
  return Object.freeze({
    transmuralPressureMmHg: prior.pressureScaleMmHg * (
      normalizedVolume ** prior.expansionExponent
      - normalizedVolume ** (-prior.collapseExponent)
    ),
    complianceMlPerMmHg:
      prior.referenceVolumeMl / dPressureDNormalizedVolume,
  });
}

/**
 * Invert the strictly monotone, coercive Cref-anchored PV relation.
 *
 * The inverse is intentionally owned beside the constitutive law so hydraulic
 * initializers never substitute an unrelated linear compliance approximation.
 */
export function invertCrefAnchoredCollapsiblePvV2(
  transmuralPressureMmHg: number,
  prior: CrefAnchoredCollapsiblePvPriorV2,
): number {
  if (!Number.isFinite(transmuralPressureMmHg)) {
    throw new RangeError("transmuralPressureMmHg must be finite");
  }
  if (transmuralPressureMmHg === 0) return prior.referenceVolumeMl;

  const pressureAtNormalizedVolume = (x: number): number =>
    prior.pressureScaleMmHg * (
      x ** prior.expansionExponent - x ** (-prior.collapseExponent)
    );
  let lower: number;
  let upper: number;
  if (transmuralPressureMmHg < 0) {
    lower = 1;
    while (pressureAtNormalizedVolume(lower) > transmuralPressureMmHg) {
      lower *= 0.5;
      if (lower < Number.MIN_VALUE ** 0.25) {
        throw new RangeError("PV inverse could not bracket collapsed volume");
      }
    }
    upper = 1;
  } else {
    lower = 1;
    upper = 2;
    while (pressureAtNormalizedVolume(upper) < transmuralPressureMmHg) {
      upper *= 2;
      if (!Number.isFinite(upper)) {
        throw new RangeError("PV inverse could not bracket expanded volume");
      }
    }
  }
  for (let iteration = 0; iteration < 96; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    if (pressureAtNormalizedVolume(midpoint) < transmuralPressureMmHg) {
      lower = midpoint;
    } else {
      upper = midpoint;
    }
  }
  return prior.referenceVolumeMl * 0.5 * (lower + upper);
}

/**
 * Resting pressure-drop partition.  The 25:68:7 macro split is a literature
 * construction prior; the 60:30:10 subdivision inside the 68% microvascular
 * drop is deliberately labelled as a computational prior rather than a
 * directly identified biological measurement.
 */
export const CORONARY_RESISTANCE_PARTITION_PRIOR_V2 = Object.freeze({
  macroPathPressureDropFraction01: Object.freeze({
    largeArterial: 0.25,
    microvascular: 0.68,
    largeVenous: 0.07,
  }),
  microInternalFractionOfMicrovascularDrop01: Object.freeze({
    proximalArteriolar: 0.60,
    intermediateCapillary: 0.30,
    distalVenular: 0.10,
  }),
  macroEvidenceBoundary: "population-resting-resistance-construction-prior" as const,
  microInternalEvidenceBoundary:
    "computational-prior-not-directly-identified" as const,
});

export type CoronaryMicroInternalResistanceFractionV2 = Readonly<{
  proximalArteriolar: number;
  intermediateCapillary: number;
  distalVenular: number;
}>;

export const CHILIAN_1991_DIRECTIONAL_TRANSMURAL_REPARTITION_ABLATION_V2 =
  Object.freeze({
    // The published pressure measurements do not identify this exact 3-edge
    // reduction. The fractions encode only the reported direction: compared
    // with EPI, ENDO has greater arterial/venous and smaller intermediate
    // pressure loss under maximal dilation. This is an ablation, not a fit.
    subepicardial: Object.freeze({
      proximalArteriolar: 0.60,
      intermediateCapillary: 0.30,
      distalVenular: 0.10,
    }),
    subendocardial: Object.freeze({
      proximalArteriolar: 0.70,
      intermediateCapillary: 0.15,
      distalVenular: 0.15,
    }),
  }) satisfies CoronaryLayerRecordV2<CoronaryMicroInternalResistanceFractionV2>;

export const LOW_RM_70_15_15_REPARTITION_ABLATION_V2 = Object.freeze({
  // A mechanism probe, not a measured three-edge decomposition. It halves Rm
  // but raises R2 by 50%, so it must not be called a globally faster network.
  subepicardial: Object.freeze({
    proximalArteriolar: 0.70,
    intermediateCapillary: 0.15,
    distalVenular: 0.15,
  }),
  subendocardial: Object.freeze({
    proximalArteriolar: 0.70,
    intermediateCapillary: 0.15,
    distalVenular: 0.15,
  }),
}) satisfies CoronaryLayerRecordV2<CoronaryMicroInternalResistanceFractionV2>;

export type CoronaryIntramyocardialCompliancePriorV2 = Readonly<{
  coldSeedVolumeMl: number;
  effectiveComplianceMlPerMmHg: number;
  pressureVolume: CrefAnchoredCollapsiblePvPriorV2;
}>;

export type CoronaryLayerPriorV2 = Readonly<{
  layerId: CoronaryLayerIdV2;
  restingFlowFractionWithinTerritory01: number;
  structuralVolumeAllocationFractionWithinTerritory01: number;
  c1ProximalArterial: CoronaryIntramyocardialCompliancePriorV2;
  c2DistalVenous: CoronaryIntramyocardialCompliancePriorV2;
  proximalArteriolarResistanceMmHgSecPerMl: number;
  intermediateCapillaryResistanceMmHgSecPerMl: number;
  distalVenularResistanceMmHgSecPerMl: number;
}>;

export type CoronaryTerritoryPriorV2 = Readonly<{
  territoryId: CoronaryTerritoryIdV2;
  restingFlowFractionOfTotal01: number;
  structuralVolumeAllocationFractionOfTotal01: number;
  targetRestingFlowMlPerMin: number;
  initialToneResistanceScaleByLayer: CoronaryLayerRecordV2<number>;
  largeArterialColdSeedVolumeMl: number;
  largeArterialPressureVolume: CrefAnchoredCollapsiblePvPriorV2;
  largeArterialResistanceMmHgSecPerMl: number;
  layers: CoronaryLayerRecordV2<CoronaryLayerPriorV2>;
}>;

export type CoronaryBeatingReferenceR1CalibrationV2 = Readonly<{
  calibrationId: "beating-reference-r1-mean-qm-v1";
  /** Multipliers applied once to the static-pressure R1 construction prior. */
  proximalArteriolarScaleByTerritoryLayer:
    CoronaryTerritoryLayerRecordV2<number>;
  /** Stable identity of the accepted periodic boundary used for construction. */
  boundaryFingerprint: string;
  calibrationToneResistanceScale: 1;
  targetOwner: "mass-territory-layer-resting-flow-prior";
  objective: "accepted-cycle-mean-qm-only";
  waveformObjectiveUsed: false;
}>;

export type CoronaryTopologyPriorV2 = Readonly<{
  topologyId: typeof CORONARY_TOPOLOGY_ID_V2;
  constructionSeedSchemaId: typeof CORONARY_CONSTRUCTION_SEED_SCHEMA_ID_V2;
  schemaVersion: 2;
  units: Readonly<{
    time: "s";
    volume: "mL";
    pressure: "mmHg";
    flow: "mL/s";
    resistance: "mmHg*s/mL";
    compliance: "mL/mmHg";
  }>;
  externalBoundaries: Readonly<{ inlet: "Ao"; outlet: "RA" }>;
  construction: Readonly<{
    referenceVentricularMyocardialMassG: number;
    structuralBloodVolumeScale: Readonly<{
      kassabDenominatorMassG: number;
      massProxyDefinition: "LVFW-plus-SEP-wall-mass";
      wholeHeartAllocationEvidenceBoundary:
        "lv-normalized-porcine-volume-extrapolated-across-three-territories";
    }>;
    referencePerfusionPressureDropMmHg: number;
    restingMyocardialBloodFlowMlPerMinPerG: number;
    targetTotalRestingFlowMlPerMin: number;
    bloodVolumeMlPer100G: typeof KASSAB_CORONARY_BLOOD_VOLUME_PRIOR_V2;
    effectiveComplianceMlPerMmHgPer100G:
      typeof SPAAN_TWO_COMPARTMENT_COMPLIANCE_PRIOR_V2;
    /** Immutable literature/computational construction baseline, not active metadata after ablation. */
    baselineResistancePartition: typeof CORONARY_RESISTANCE_PARTITION_PRIOR_V2;
    /** Null for the static 85-mmHg construction; populated only by an explicit beating-reference solve. */
    beatingReferenceR1Calibration:
      CoronaryBeatingReferenceR1CalibrationV2 | null;
    /** Active local-slope scale relative to the immutable Spaan baseline. */
    intramyocardialComplianceScale: Readonly<{
      c1Proximal: number;
      c2Distal: number;
    }>;
    largeVesselLocalCompliance: typeof LARGE_VESSEL_LOCAL_COMPLIANCE_PRIOR_V2;
    referenceAbsolutePressureMmHg: Readonly<{
      rightAtrium: number;
      aorta: number;
      perivascularExternal: number;
      intramyocardialLoadedSeedPtm: number;
    }>;
    perfusedMyocardialMass: Readonly<{
      wallMassG: CoronaryPerfusedWallRecordV2<number>;
      wallToTerritoryAllocationFraction01:
        CoronaryPerfusedWallRecordV2<CoronaryTerritoryRecordV2<number>>;
      territoryMassG: CoronaryTerritoryRecordV2<number>;
      territoryLayerMassG: CoronaryTerritoryLayerRecordV2<number>;
      evidenceBoundary: "anatomic-construction-prior-not-target-flow-owner";
    }>;
    capillaryVolumeSplitBetweenC1AndC2: Readonly<{
      c1Fraction01: number;
      c2Fraction01: number;
      c1SensitivityLow01: number;
      c1SensitivityHigh01: number;
      evidenceBoundary: "identifiability-regularization-not-measurement";
    }>;
    bloodVolumeAndComplianceAreIndependentPriors: true;
  }>;
  territories: CoronaryTerritoryRecordV2<CoronaryTerritoryPriorV2>;
  commonCoronaryVein: Readonly<{
    coldSeedVolumeMl: number;
    pressureVolume: CrefAnchoredCollapsiblePvPriorV2;
    outletResistanceMmHgSecPerMl: number;
  }>;
  coldSeedCoronaryBloodVolumeMl: number;
  claims: Readonly<{
    conservedVolumeNodeCount: 16;
    signedEdgeCount: 22;
    acceptedToneStateCount: 6;
    toneStateGranularity: "territory-layer";
    inertanceIncluded: false;
    hydraulicSolverIncluded: true;
    simulationReady: false;
    largeVesselComplianceIdentificationComplete: false;
    totalBloodVolumeLedgerRequired: true;
    v1CheckpointCompatible: false;
  }>;
}>;

export type CoronaryConservedVolumeNodeSpecV2 = Readonly<{
  nodeId: CoronaryConservedVolumeNodeIdV2;
  kind:
    | "territory-large-arterial-storage"
    | "intramyocardial-c1-proximal-arterial"
    | "intramyocardial-c2-distal-venous"
    | "common-large-venous-storage";
  territoryId: CoronaryTerritoryIdV2 | null;
  layerId: CoronaryLayerIdV2 | null;
  structuralBloodVolumeBudgetClass:
    | "large-arterial"
    | "microvascular-c1"
    | "microvascular-c2"
    | "large-venous";
  coldSeedVolumeMl: number;
  effectiveComplianceMlPerMmHg: number;
  pressureVolume: CrefAnchoredCollapsiblePvPriorV2;
}>;

export type CoronaryEdgeSpecV2 = Readonly<{
  edgeId: CoronaryEdgeIdV2;
  upstreamNodeId: CoronaryHydraulicNodeIdV2;
  downstreamNodeId: CoronaryHydraulicNodeIdV2;
  territoryId: CoronaryTerritoryIdV2 | null;
  layerId: CoronaryLayerIdV2 | null;
  kind:
    | "large-arterial"
    | "micro-proximal-arteriolar"
    | "micro-intermediate-capillary"
    | "micro-distal-venular"
    | "large-venous-outlet";
  flowLawDirectionality: "signed";
  referencePathPressureDropFraction01: number;
  referenceResistanceMmHgSecPerMl: number;
  toneOwner: Readonly<{
    territoryId: CoronaryTerritoryIdV2;
    layerId: CoronaryLayerIdV2;
  }> | null;
  structuralCmdOwner: Readonly<{
    territoryId: CoronaryTerritoryIdV2;
    layerId: CoronaryLayerIdV2;
  }> | null;
  inertanceMmHgSec2PerMl: null;
}>;

export type CoronaryTopologyV2 = Readonly<{
  topologyId: typeof CORONARY_TOPOLOGY_ID_V2;
  constructionSeedSchemaId: typeof CORONARY_CONSTRUCTION_SEED_SCHEMA_ID_V2;
  nodes: readonly CoronaryConservedVolumeNodeSpecV2[];
  edges: readonly CoronaryEdgeSpecV2[];
  nodeIndexById: CoronaryConservedVolumeRecordV2<number>;
  edgeIndexById: Readonly<Record<CoronaryEdgeIdV2, number>>;
}>;

export type CoronaryColdConstructionSeedV2 = Readonly<{
  schemaId: typeof CORONARY_CONSTRUCTION_SEED_SCHEMA_ID_V2;
  schemaVersion: 2;
  topologyId: typeof CORONARY_TOPOLOGY_ID_V2;
  priorFingerprint: string;
  volumeMlByNode: CoronaryConservedVolumeRecordV2<number>;
  initialToneResistanceScaleByTerritoryLayer: CoronaryToneStateV2;
}>;

const REFERENCE_VENTRICULAR_MYOCARDIAL_MASS_G =
  Object.values(
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.wallGeometryParameters,
  ).reduce((sum, wall) => sum + wall.wallMaterialVolumeM3, 0)
  * NORMAL_ADULT_FIVE_WALL_PRIOR_V1.myocardialDensityKgPerM3
  * 1_000;
const REFERENCE_PERFUSION_PRESSURE_DROP_MMHG = 85;
const RESTING_MYOCARDIAL_BLOOD_FLOW_ML_PER_MIN_PER_G = 1;
const TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN =
  REFERENCE_VENTRICULAR_MYOCARDIAL_MASS_G
  * RESTING_MYOCARDIAL_BLOOD_FLOW_ML_PER_MIN_PER_G;

// Flow targeting and anatomic ownership deliberately have different owners.
// Equality or proximity at the normal seed must never make stenosis/CMD alter
// structural volume or compliance allocation.
const RESTING_FLOW_TERRITORY_ALLOCATION = Object.freeze({
  LAD: 0.42,
  LCx: 0.28,
  RCA: 0.30,
}) satisfies CoronaryTerritoryRecordV2<number>;

export const CORONARY_WALL_TO_TERRITORY_MASS_ALLOCATION_PRIOR_V2 =
  Object.freeze({
    LVFW: Object.freeze({ LAD: 0.45, LCx: 0.55, RCA: 0 }),
    SEP: Object.freeze({ LAD: 0.80, LCx: 0.05, RCA: 0.15 }),
    RVFW: Object.freeze({ LAD: 0, LCx: 0, RCA: 1 }),
  }) satisfies CoronaryPerfusedWallRecordV2<
    CoronaryTerritoryRecordV2<number>
  >;

const PERFUSED_WALL_MASS_G = Object.freeze(Object.fromEntries(
  CORONARY_PERFUSED_WALL_IDS_V2.map((wallId) => [
    wallId,
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg
      .wallGeometryParameters[wallId].wallMaterialVolumeM3
    * NORMAL_ADULT_FIVE_WALL_PRIOR_V1.myocardialDensityKgPerM3
    * 1_000,
  ]),
)) as CoronaryPerfusedWallRecordV2<number>;

const TERRITORY_PERFUSED_MASS_G = Object.freeze(Object.fromEntries(
  CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
    territoryId,
    CORONARY_PERFUSED_WALL_IDS_V2.reduce(
      (sum, wallId) => sum
        + PERFUSED_WALL_MASS_G[wallId]
        * CORONARY_WALL_TO_TERRITORY_MASS_ALLOCATION_PRIOR_V2[wallId][territoryId],
      0,
    ),
  ]),
)) as CoronaryTerritoryRecordV2<number>;

const RESTING_LAYER_FLOW_ALLOCATION = Object.freeze({
  subepicardial: 1 / 2.11,
  subendocardial: 1.11 / 2.11,
}) satisfies CoronaryLayerRecordV2<number>;

// A neutral 50:50 structural allocation prevents resting flow preference from
// being silently reinterpreted as a measured transmural blood-volume ratio.
const STRUCTURAL_LAYER_VOLUME_ALLOCATION = Object.freeze({
  subepicardial: 0.5,
  subendocardial: 0.5,
}) satisfies CoronaryLayerRecordV2<number>;

const TERRITORY_LAYER_PERFUSED_MASS_G = Object.freeze(Object.fromEntries(
  CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
    territoryId,
    Object.freeze(Object.fromEntries(
      CORONARY_LAYER_IDS_V2.map((layerId) => [
        layerId,
        TERRITORY_PERFUSED_MASS_G[territoryId]
        * STRUCTURAL_LAYER_VOLUME_ALLOCATION[layerId],
      ]),
    )) as CoronaryLayerRecordV2<number>,
  ]),
)) as CoronaryTerritoryLayerRecordV2<number>;

const CAPILLARY_VOLUME_SPLIT = Object.freeze({
  c1Fraction01: 0.5,
  c2Fraction01: 0.5,
  c1SensitivityLow01: 0.35,
  c1SensitivityHigh01: 0.65,
  evidenceBoundary: "identifiability-regularization-not-measurement" as const,
});

const KASSAB_LV_EQUIVALENT_MASS_PROXY_G =
  PERFUSED_WALL_MASS_G.LVFW + PERFUSED_WALL_MASS_G.SEP;
const KASSAB_STRUCTURAL_VOLUME_SCALE_PER_100_G =
  KASSAB_LV_EQUIVALENT_MASS_PROXY_G / 100;
const TOTAL_LARGE_ARTERIAL_VOLUME_ML =
  KASSAB_STRUCTURAL_VOLUME_SCALE_PER_100_G
  * KASSAB_CORONARY_BLOOD_VOLUME_PRIOR_V2
    .derivedVolumeMlPer100G.largeArterial;
const TOTAL_MICROVASCULAR_VOLUME_ML =
  KASSAB_STRUCTURAL_VOLUME_SCALE_PER_100_G
  * KASSAB_CORONARY_BLOOD_VOLUME_PRIOR_V2
    .derivedVolumeMlPer100G.microvascular;
const TOTAL_LARGE_VENOUS_VOLUME_ML =
  KASSAB_STRUCTURAL_VOLUME_SCALE_PER_100_G
  * KASSAB_CORONARY_BLOOD_VOLUME_PRIOR_V2
    .derivedVolumeMlPer100G.largeVenous;
const REFERENCE_RIGHT_ATRIAL_ABSOLUTE_PRESSURE_MMHG = 5;
const REFERENCE_PERIVASCULAR_EXTERNAL_PRESSURE_MMHG = 2;
const REFERENCE_AORTIC_ABSOLUTE_PRESSURE_MMHG =
  REFERENCE_RIGHT_ATRIAL_ABSOLUTE_PRESSURE_MMHG
  + REFERENCE_PERFUSION_PRESSURE_DROP_MMHG;
const INTRAMYOCARDIAL_LOADED_SEED_PTM_MMHG = 5;

function makeTerritoryPriorV2(
  territoryId: CoronaryTerritoryIdV2,
): CoronaryTerritoryPriorV2 {
  const flowFraction = RESTING_FLOW_TERRITORY_ALLOCATION[territoryId];
  const territoryMassG = TERRITORY_PERFUSED_MASS_G[territoryId];
  const structuralFraction =
    territoryMassG / REFERENCE_VENTRICULAR_MYOCARDIAL_MASS_G;
  const targetRestingFlowMlPerMin =
    TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN * flowFraction;
  const targetRestingFlowMlPerSec = targetRestingFlowMlPerMin / 60;
  const macro = CORONARY_RESISTANCE_PARTITION_PRIOR_V2
    .macroPathPressureDropFraction01;
  const micro = CORONARY_RESISTANCE_PARTITION_PRIOR_V2
    .microInternalFractionOfMicrovascularDrop01;
  const layers = Object.freeze(Object.fromEntries(
    CORONARY_LAYER_IDS_V2.map((layerId) => {
      const restingFlowFraction = RESTING_LAYER_FLOW_ALLOCATION[layerId];
      const volumeFraction = STRUCTURAL_LAYER_VOLUME_ALLOCATION[layerId];
      const layerMassG = TERRITORY_LAYER_PERFUSED_MASS_G[territoryId][layerId];
      const layerFlowMlPerSec = targetRestingFlowMlPerSec * restingFlowFraction;
      const c1ColdSeedVolumeMl =
        TOTAL_MICROVASCULAR_VOLUME_ML
        * layerMassG / REFERENCE_VENTRICULAR_MYOCARDIAL_MASS_G
        * CAPILLARY_VOLUME_SPLIT.c1Fraction01;
      const c2ColdSeedVolumeMl =
        TOTAL_MICROVASCULAR_VOLUME_ML
        * layerMassG / REFERENCE_VENTRICULAR_MYOCARDIAL_MASS_G
        * CAPILLARY_VOLUME_SPLIT.c2Fraction01;
      const c1ComplianceMlPerMmHg =
        layerMassG / 100
        * SPAAN_TWO_COMPARTMENT_COMPLIANCE_PRIOR_V2.c1Proximal.center;
      const c2ComplianceMlPerMmHg =
        layerMassG / 100
        * SPAAN_TWO_COMPARTMENT_COMPLIANCE_PRIOR_V2.c2Distal.center;
      return [layerId, Object.freeze({
        layerId,
        restingFlowFractionWithinTerritory01: restingFlowFraction,
        structuralVolumeAllocationFractionWithinTerritory01: volumeFraction,
        c1ProximalArterial: Object.freeze({
          coldSeedVolumeMl: c1ColdSeedVolumeMl,
          effectiveComplianceMlPerMmHg: c1ComplianceMlPerMmHg,
          pressureVolume: compileCrefAnchoredCollapsiblePvFromLoadedSeedV2({
            loadedSeedVolumeMl: c1ColdSeedVolumeMl,
            loadedSeedTransmuralPressureMmHg:
              INTRAMYOCARDIAL_LOADED_SEED_PTM_MMHG,
            referenceComplianceMlPerMmHg: c1ComplianceMlPerMmHg,
          }),
        }),
        c2DistalVenous: Object.freeze({
          coldSeedVolumeMl: c2ColdSeedVolumeMl,
          effectiveComplianceMlPerMmHg: c2ComplianceMlPerMmHg,
          pressureVolume: compileCrefAnchoredCollapsiblePvFromLoadedSeedV2({
            loadedSeedVolumeMl: c2ColdSeedVolumeMl,
            loadedSeedTransmuralPressureMmHg:
              INTRAMYOCARDIAL_LOADED_SEED_PTM_MMHG,
            referenceComplianceMlPerMmHg: c2ComplianceMlPerMmHg,
          }),
        }),
        proximalArteriolarResistanceMmHgSecPerMl:
          REFERENCE_PERFUSION_PRESSURE_DROP_MMHG
          * macro.microvascular * micro.proximalArteriolar
          / layerFlowMlPerSec,
        intermediateCapillaryResistanceMmHgSecPerMl:
          REFERENCE_PERFUSION_PRESSURE_DROP_MMHG
          * macro.microvascular * micro.intermediateCapillary
          / layerFlowMlPerSec,
        distalVenularResistanceMmHgSecPerMl:
          REFERENCE_PERFUSION_PRESSURE_DROP_MMHG
          * macro.microvascular * micro.distalVenular
          / layerFlowMlPerSec,
      })];
    }),
  )) as CoronaryLayerRecordV2<CoronaryLayerPriorV2>;
  return Object.freeze({
    territoryId,
    restingFlowFractionOfTotal01: flowFraction,
    structuralVolumeAllocationFractionOfTotal01: structuralFraction,
    targetRestingFlowMlPerMin,
    initialToneResistanceScaleByLayer: Object.freeze({
      subepicardial: 1,
      subendocardial: 1,
    }),
    largeArterialColdSeedVolumeMl:
      TOTAL_LARGE_ARTERIAL_VOLUME_ML * structuralFraction,
    largeArterialPressureVolume: compileCrefAnchoredCollapsiblePvFromLoadedSeedV2({
      loadedSeedVolumeMl: TOTAL_LARGE_ARTERIAL_VOLUME_ML * structuralFraction,
      loadedSeedTransmuralPressureMmHg:
        REFERENCE_AORTIC_ABSOLUTE_PRESSURE_MMHG
        - macro.largeArterial * REFERENCE_PERFUSION_PRESSURE_DROP_MMHG
        - REFERENCE_PERIVASCULAR_EXTERNAL_PRESSURE_MMHG,
      referenceComplianceMlPerMmHg:
        TOTAL_LARGE_ARTERIAL_VOLUME_ML * structuralFraction
        * LARGE_VESSEL_LOCAL_COMPLIANCE_PRIOR_V2
          .referenceRelativeCompliancePerMmHg.largeArterial.center,
    }),
    largeArterialResistanceMmHgSecPerMl:
      REFERENCE_PERFUSION_PRESSURE_DROP_MMHG * macro.largeArterial
      / targetRestingFlowMlPerSec,
    layers,
  });
}

export const NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2 = Object.freeze({
  topologyId: CORONARY_TOPOLOGY_ID_V2,
  constructionSeedSchemaId: CORONARY_CONSTRUCTION_SEED_SCHEMA_ID_V2,
  schemaVersion: 2 as const,
  units: Object.freeze({
    time: "s" as const,
    volume: "mL" as const,
    pressure: "mmHg" as const,
    flow: "mL/s" as const,
    resistance: "mmHg*s/mL" as const,
    compliance: "mL/mmHg" as const,
  }),
  externalBoundaries: Object.freeze({ inlet: "Ao" as const, outlet: "RA" as const }),
  construction: Object.freeze({
    referenceVentricularMyocardialMassG:
      REFERENCE_VENTRICULAR_MYOCARDIAL_MASS_G,
    structuralBloodVolumeScale: Object.freeze({
      kassabDenominatorMassG: KASSAB_LV_EQUIVALENT_MASS_PROXY_G,
      massProxyDefinition: "LVFW-plus-SEP-wall-mass" as const,
      wholeHeartAllocationEvidenceBoundary:
        "lv-normalized-porcine-volume-extrapolated-across-three-territories" as const,
    }),
    referencePerfusionPressureDropMmHg:
      REFERENCE_PERFUSION_PRESSURE_DROP_MMHG,
    restingMyocardialBloodFlowMlPerMinPerG:
      RESTING_MYOCARDIAL_BLOOD_FLOW_ML_PER_MIN_PER_G,
    targetTotalRestingFlowMlPerMin: TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN,
    bloodVolumeMlPer100G: KASSAB_CORONARY_BLOOD_VOLUME_PRIOR_V2,
    effectiveComplianceMlPerMmHgPer100G:
      SPAAN_TWO_COMPARTMENT_COMPLIANCE_PRIOR_V2,
    baselineResistancePartition: CORONARY_RESISTANCE_PARTITION_PRIOR_V2,
    beatingReferenceR1Calibration: null,
    intramyocardialComplianceScale: Object.freeze({
      c1Proximal: 1,
      c2Distal: 1,
    }),
    largeVesselLocalCompliance: LARGE_VESSEL_LOCAL_COMPLIANCE_PRIOR_V2,
    referenceAbsolutePressureMmHg: Object.freeze({
      rightAtrium: REFERENCE_RIGHT_ATRIAL_ABSOLUTE_PRESSURE_MMHG,
      aorta: REFERENCE_AORTIC_ABSOLUTE_PRESSURE_MMHG,
      perivascularExternal: REFERENCE_PERIVASCULAR_EXTERNAL_PRESSURE_MMHG,
      intramyocardialLoadedSeedPtm: INTRAMYOCARDIAL_LOADED_SEED_PTM_MMHG,
    }),
    perfusedMyocardialMass: Object.freeze({
      wallMassG: PERFUSED_WALL_MASS_G,
      wallToTerritoryAllocationFraction01:
        CORONARY_WALL_TO_TERRITORY_MASS_ALLOCATION_PRIOR_V2,
      territoryMassG: TERRITORY_PERFUSED_MASS_G,
      territoryLayerMassG: TERRITORY_LAYER_PERFUSED_MASS_G,
      evidenceBoundary:
        "anatomic-construction-prior-not-target-flow-owner" as const,
    }),
    capillaryVolumeSplitBetweenC1AndC2: CAPILLARY_VOLUME_SPLIT,
    bloodVolumeAndComplianceAreIndependentPriors: true as const,
  }),
  territories: Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      makeTerritoryPriorV2(territoryId),
    ]),
  )) as CoronaryTerritoryRecordV2<CoronaryTerritoryPriorV2>,
  commonCoronaryVein: Object.freeze({
    coldSeedVolumeMl: TOTAL_LARGE_VENOUS_VOLUME_ML,
    pressureVolume: compileCrefAnchoredCollapsiblePvFromLoadedSeedV2({
      loadedSeedVolumeMl: TOTAL_LARGE_VENOUS_VOLUME_ML,
      loadedSeedTransmuralPressureMmHg:
        REFERENCE_RIGHT_ATRIAL_ABSOLUTE_PRESSURE_MMHG
        + CORONARY_RESISTANCE_PARTITION_PRIOR_V2
          .macroPathPressureDropFraction01.largeVenous
          * REFERENCE_PERFUSION_PRESSURE_DROP_MMHG
        - REFERENCE_PERIVASCULAR_EXTERNAL_PRESSURE_MMHG,
      referenceComplianceMlPerMmHg:
        TOTAL_LARGE_VENOUS_VOLUME_ML
        * LARGE_VESSEL_LOCAL_COMPLIANCE_PRIOR_V2
          .referenceRelativeCompliancePerMmHg.largeVenous.center,
    }),
    outletResistanceMmHgSecPerMl:
      REFERENCE_PERFUSION_PRESSURE_DROP_MMHG
      * CORONARY_RESISTANCE_PARTITION_PRIOR_V2
        .macroPathPressureDropFraction01.largeVenous
      / (TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN / 60),
  }),
  coldSeedCoronaryBloodVolumeMl:
    KASSAB_STRUCTURAL_VOLUME_SCALE_PER_100_G
    * KASSAB_CORONARY_BLOOD_VOLUME_PRIOR_V2.wholeCoronary,
  claims: Object.freeze({
    conservedVolumeNodeCount: 16 as const,
    signedEdgeCount: 22 as const,
    acceptedToneStateCount: 6 as const,
    toneStateGranularity: "territory-layer" as const,
    inertanceIncluded: false as const,
    hydraulicSolverIncluded: true as const,
    simulationReady: false as const,
    largeVesselComplianceIdentificationComplete: false as const,
    totalBloodVolumeLedgerRequired: true as const,
    v1CheckpointCompatible: false as const,
  }),
}) satisfies CoronaryTopologyPriorV2;

/**
 * Apply a one-time normal-reference calibration to base R1 only.
 *
 * This is deliberately distinct from disease, accepted tone, hyperemia, and
 * waveform fitting. The descriptor records that the only construction target
 * was accepted-cycle mean Qm at fixed tone=1. A calibrated prior cannot be
 * calibrated a second time without returning to its uncalibrated source.
 */
export function applyBeatingReferenceR1CalibrationV2(
  prior: CoronaryTopologyPriorV2,
  calibration: CoronaryBeatingReferenceR1CalibrationV2,
): CoronaryTopologyPriorV2 {
  if (prior.construction.beatingReferenceR1Calibration !== null) {
    throw new Error("coronary V2 beating-reference R1 calibration is already applied");
  }
  validateBeatingReferenceR1CalibrationV2(calibration);
  const territories = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => {
      const territory = prior.territories[territoryId];
      const layers = Object.freeze(Object.fromEntries(
        CORONARY_LAYER_IDS_V2.map((layerId) => {
          const layer = territory.layers[layerId];
          return [layerId, Object.freeze({
            ...layer,
            proximalArteriolarResistanceMmHgSecPerMl:
              layer.proximalArteriolarResistanceMmHgSecPerMl
              * calibration.proximalArteriolarScaleByTerritoryLayer[
                territoryId
              ][layerId],
          })];
        }),
      )) as CoronaryLayerRecordV2<CoronaryLayerPriorV2>;
      return [territoryId, Object.freeze({ ...territory, layers })];
    }),
  )) as CoronaryTerritoryRecordV2<CoronaryTerritoryPriorV2>;
  const calibrated = Object.freeze({
    ...prior,
    construction: Object.freeze({
      ...prior.construction,
      beatingReferenceR1Calibration: calibration,
    }),
    territories,
  });
  validateCoronaryTopologyPriorV2(calibrated);
  return calibrated;
}

export function validateBeatingReferenceR1CalibrationV2(
  calibration: CoronaryBeatingReferenceR1CalibrationV2,
): void {
  if (calibration.calibrationId !== "beating-reference-r1-mean-qm-v1") {
    throw new RangeError("coronary V2 beating-reference calibration id is invalid");
  }
  if (
    calibration.calibrationToneResistanceScale !== 1
    || calibration.targetOwner !== "mass-territory-layer-resting-flow-prior"
    || calibration.objective !== "accepted-cycle-mean-qm-only"
    || calibration.waveformObjectiveUsed !== false
  ) {
    throw new RangeError("coronary V2 beating-reference calibration ownership is invalid");
  }
  if (calibration.boundaryFingerprint.trim().length === 0) {
    throw new RangeError("coronary V2 beating-reference boundary fingerprint is required");
  }
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      const scale = calibration
        .proximalArteriolarScaleByTerritoryLayer[territoryId][layerId];
      if (!Number.isFinite(scale) || scale <= 0) {
        throw new RangeError(
          `${territoryId}.${layerId} beating-reference R1 scale must be positive`,
        );
      }
    }
  }
}

/**
 * Preserve each layer's total reference resistance while moving pressure loss
 * between R1/Rm/R2. This supports a bounded mechanism ablation without
 * changing flow targets, vascular volumes, compliances, or disease/tone owners.
 */
export function repartitionCoronaryMicrovascularResistanceV2(
  prior: CoronaryTopologyPriorV2,
  fractionByLayer: CoronaryLayerRecordV2<
    CoronaryMicroInternalResistanceFractionV2
  >,
): CoronaryTopologyPriorV2 {
  requireUncalibratedConstructionPriorV2(prior, "resistance repartition");
  for (const layerId of CORONARY_LAYER_IDS_V2) {
    const fraction = fractionByLayer[layerId];
    const sum = fraction.proximalArteriolar
      + fraction.intermediateCapillary
      + fraction.distalVenular;
    for (const [name, value] of Object.entries(fraction)) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`${layerId}.${name} fraction must be positive`);
      }
    }
    if (Math.abs(sum - 1) > 1e-12) {
      throw new RangeError(`${layerId} resistance fractions must sum to one`);
    }
  }
  const territories = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => {
      const territory = prior.territories[territoryId];
      const layers = Object.freeze(Object.fromEntries(
        CORONARY_LAYER_IDS_V2.map((layerId) => {
          const layer = territory.layers[layerId];
          const total = layer.proximalArteriolarResistanceMmHgSecPerMl
            + layer.intermediateCapillaryResistanceMmHgSecPerMl
            + layer.distalVenularResistanceMmHgSecPerMl;
          const fraction = fractionByLayer[layerId];
          return [layerId, Object.freeze({
            ...layer,
            proximalArteriolarResistanceMmHgSecPerMl:
              total * fraction.proximalArteriolar,
            intermediateCapillaryResistanceMmHgSecPerMl:
              total * fraction.intermediateCapillary,
            distalVenularResistanceMmHgSecPerMl:
              total * fraction.distalVenular,
          })];
        }),
      )) as CoronaryLayerRecordV2<CoronaryLayerPriorV2>;
      return [territoryId, Object.freeze({ ...territory, layers })];
    }),
  )) as CoronaryTerritoryRecordV2<CoronaryTerritoryPriorV2>;
  const repartitioned = Object.freeze({ ...prior, territories });
  validateCoronaryTopologyPriorV2(repartitioned);
  return repartitioned;
}

/**
 * Move a specified part of the reference pressure loss from the shared
 * Ao-to-Art edge to each layer's precapillary R1 edge without changing the
 * static reference path resistance or target flow.
 *
 * The immutable 25% construction prior aggregates epicardial conduit and
 * prearterial loss. This bounded placement ablation lets the explicit Art
 * compliance sit downstream of only the low-loss epicardial conduit, while
 * the removed prearterial loss remains upstream of C1 and is therefore owned
 * by R1. No state, waveform source, or fitted phase parameter is introduced.
 */
export function redistributeCoronaryLargeArterialPressureDropToR1V2(
  prior: CoronaryTopologyPriorV2,
  targetLargeArterialPressureDropFraction01: number,
): CoronaryTopologyPriorV2 {
  requireUncalibratedConstructionPriorV2(
    prior,
    "large-arterial pressure-drop redistribution",
  );
  const baselineFraction = prior.construction.baselineResistancePartition
    .macroPathPressureDropFraction01.largeArterial;
  if (
    !Number.isFinite(targetLargeArterialPressureDropFraction01)
    || targetLargeArterialPressureDropFraction01 <= 0
    || targetLargeArterialPressureDropFraction01 > baselineFraction
  ) {
    throw new RangeError(
      `large-arterial pressure-drop fraction must be in (0, ${baselineFraction}]`,
    );
  }
  const referenceDrop = prior.construction.referencePerfusionPressureDropMmHg;
  const targetLargeArterialDropMmHg =
    referenceDrop * targetLargeArterialPressureDropFraction01;
  const referenceAorticPressure = prior.construction
    .referenceAbsolutePressureMmHg.aorta;
  const referencePerivascularPressure = prior.construction
    .referenceAbsolutePressureMmHg.perivascularExternal;
  const territories = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => {
      const territory = prior.territories[territoryId];
      const territoryFlowMlPerSec = territory.targetRestingFlowMlPerMin / 60;
      const existingLargeArterialDropMmHg =
        territory.largeArterialResistanceMmHgSecPerMl
        * territoryFlowMlPerSec;
      const movedDropMmHg =
        existingLargeArterialDropMmHg - targetLargeArterialDropMmHg;
      if (movedDropMmHg < -1e-10) {
        throw new RangeError(
          `${territoryId} target large-arterial loss exceeds active prior`,
        );
      }
      const layers = Object.freeze(Object.fromEntries(
        CORONARY_LAYER_IDS_V2.map((layerId) => {
          const layer = territory.layers[layerId];
          const layerFlowMlPerSec = territoryFlowMlPerSec
            * layer.restingFlowFractionWithinTerritory01;
          return [layerId, Object.freeze({
            ...layer,
            proximalArteriolarResistanceMmHgSecPerMl:
              layer.proximalArteriolarResistanceMmHgSecPerMl
              + movedDropMmHg / layerFlowMlPerSec,
          })];
        }),
      )) as CoronaryLayerRecordV2<CoronaryLayerPriorV2>;
      const pressureVolume = territory.largeArterialPressureVolume;
      return [territoryId, Object.freeze({
        ...territory,
        largeArterialResistanceMmHgSecPerMl:
          targetLargeArterialDropMmHg / territoryFlowMlPerSec,
        largeArterialPressureVolume:
          compileCrefAnchoredCollapsiblePvFromLoadedSeedV2({
            loadedSeedVolumeMl: pressureVolume.loadedSeedVolumeMl,
            loadedSeedTransmuralPressureMmHg:
              referenceAorticPressure
              - targetLargeArterialDropMmHg
              - referencePerivascularPressure,
            referenceComplianceMlPerMmHg:
              pressureVolume.referenceComplianceMlPerMmHg,
            expansionExponent: pressureVolume.expansionExponent,
            collapseExponent: pressureVolume.collapseExponent,
          }),
        layers,
      })];
    }),
  )) as CoronaryTerritoryRecordV2<CoronaryTerritoryPriorV2>;
  const redistributed = Object.freeze({ ...prior, territories });
  validateCoronaryTopologyPriorV2(redistributed);
  return redistributed;
}

/**
 * Scale only the local slope of the three epicardial Art storage laws while
 * preserving their loaded structural volumes and loaded pressures. This is a
 * compliance-owner ablation; it cannot silently move blood volume or change
 * R1/Rm/R2.
 */
export function scaleCoronaryLargeArterialComplianceV2(
  prior: CoronaryTopologyPriorV2,
  complianceScale: number,
): CoronaryTopologyPriorV2 {
  requireUncalibratedConstructionPriorV2(
    prior,
    "large arterial compliance scaling",
  );
  if (!Number.isFinite(complianceScale) || complianceScale <= 0) {
    throw new RangeError("large arterial compliance scale must be positive");
  }
  const territories = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => {
      const territory = prior.territories[territoryId];
      const pressureVolume = territory.largeArterialPressureVolume;
      return [territoryId, Object.freeze({
        ...territory,
        largeArterialPressureVolume:
          compileCrefAnchoredCollapsiblePvFromLoadedSeedV2({
            loadedSeedVolumeMl: pressureVolume.loadedSeedVolumeMl,
            loadedSeedTransmuralPressureMmHg:
              pressureVolume.loadedSeedTransmuralPressureMmHg,
            referenceComplianceMlPerMmHg:
              pressureVolume.referenceComplianceMlPerMmHg * complianceScale,
            expansionExponent: pressureVolume.expansionExponent,
            collapseExponent: pressureVolume.collapseExponent,
          }),
      })];
    }),
  )) as CoronaryTerritoryRecordV2<CoronaryTerritoryPriorV2>;
  const scaled = Object.freeze({ ...prior, territories });
  validateCoronaryTopologyPriorV2(scaled);
  return scaled;
}

/**
 * Scale C1/C2 local PV slopes without moving their structural loaded volume or
 * loaded pressure. This is a bounded time-constant mechanism ablation; it does
 * not change R1/Rm/R2, mass allocation, or flow targets.
 */
export function scaleCoronaryIntramyocardialComplianceV2(
  prior: CoronaryTopologyPriorV2,
  scale: Readonly<{ c1Proximal: number; c2Distal: number }>,
): CoronaryTopologyPriorV2 {
  requireUncalibratedConstructionPriorV2(
    prior,
    "intramyocardial compliance scaling",
  );
  for (const [name, value] of Object.entries(scale)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} compliance scale must be positive`);
    }
  }
  const territories = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => {
      const territory = prior.territories[territoryId];
      const layers = Object.freeze(Object.fromEntries(
        CORONARY_LAYER_IDS_V2.map((layerId) => {
          const layer = territory.layers[layerId];
          const scaleCompartment = (
            compartment: CoronaryIntramyocardialCompliancePriorV2,
            localScale: number,
          ): CoronaryIntramyocardialCompliancePriorV2 => Object.freeze({
            ...compartment,
            effectiveComplianceMlPerMmHg:
              compartment.effectiveComplianceMlPerMmHg * localScale,
            pressureVolume: compileCrefAnchoredCollapsiblePvFromLoadedSeedV2({
              loadedSeedVolumeMl:
                compartment.pressureVolume.loadedSeedVolumeMl,
              loadedSeedTransmuralPressureMmHg:
                compartment.pressureVolume.loadedSeedTransmuralPressureMmHg,
              referenceComplianceMlPerMmHg:
                compartment.pressureVolume.referenceComplianceMlPerMmHg
                * localScale,
              expansionExponent:
                compartment.pressureVolume.expansionExponent,
              collapseExponent:
                compartment.pressureVolume.collapseExponent,
            }),
          });
          return [layerId, Object.freeze({
            ...layer,
            c1ProximalArterial: scaleCompartment(
              layer.c1ProximalArterial,
              scale.c1Proximal,
            ),
            c2DistalVenous: scaleCompartment(
              layer.c2DistalVenous,
              scale.c2Distal,
            ),
          })];
        }),
      )) as CoronaryLayerRecordV2<CoronaryLayerPriorV2>;
      return [territoryId, Object.freeze({ ...territory, layers })];
    }),
  )) as CoronaryTerritoryRecordV2<CoronaryTerritoryPriorV2>;
  const scaled = Object.freeze({
    ...prior,
    construction: Object.freeze({
      ...prior.construction,
      intramyocardialComplianceScale: Object.freeze({
        c1Proximal:
          prior.construction.intramyocardialComplianceScale.c1Proximal
          * scale.c1Proximal,
        c2Distal:
          prior.construction.intramyocardialComplianceScale.c2Distal
          * scale.c2Distal,
      }),
    }),
    territories,
  });
  validateCoronaryTopologyPriorV2(scaled);
  return scaled;
}

function requireUncalibratedConstructionPriorV2(
  prior: CoronaryTopologyPriorV2,
  operation: string,
): void {
  if (prior.construction.beatingReferenceR1Calibration !== null) {
    throw new Error(
      `coronary V2 ${operation} must precede beating-reference R1 calibration`,
    );
  }
}

function territoryArterialNodeIdV2(
  territoryId: CoronaryTerritoryIdV2,
): CoronaryConservedVolumeNodeIdV2 {
  return `${territoryId}.Art` as CoronaryConservedVolumeNodeIdV2;
}

function intramyocardialNodeIdV2(
  territoryId: CoronaryTerritoryIdV2,
  side: "Art" | "Ven",
  layerId: CoronaryLayerIdV2,
): CoronaryConservedVolumeNodeIdV2 {
  return `${territoryId}.IM.${side}.${layerId}` as CoronaryConservedVolumeNodeIdV2;
}

function edgeIdV2(
  upstreamNodeId: CoronaryHydraulicNodeIdV2,
  downstreamNodeId: CoronaryHydraulicNodeIdV2,
): CoronaryEdgeIdV2 {
  return `${upstreamNodeId}_${downstreamNodeId}` as CoronaryEdgeIdV2;
}

export function buildCoronaryTopologyV2(
  prior: CoronaryTopologyPriorV2 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
): CoronaryTopologyV2 {
  if (
    validationStampReuseEligibleV1()
    && coronaryTopologyByImmutablePriorV2.has(prior)
  ) {
    return coronaryTopologyByImmutablePriorV2.get(prior)!;
  }
  validateCoronaryTopologyPriorV2(prior);
  const nodes: CoronaryConservedVolumeNodeSpecV2[] = [];
  const edges: CoronaryEdgeSpecV2[] = [];
  const macro = prior.construction.baselineResistancePartition
    .macroPathPressureDropFraction01;

  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    const territory = prior.territories[territoryId];
    const arterialNodeId = territoryArterialNodeIdV2(territoryId);
    nodes.push(Object.freeze({
      nodeId: arterialNodeId,
      kind: "territory-large-arterial-storage",
      territoryId,
      layerId: null,
      structuralBloodVolumeBudgetClass: "large-arterial",
      coldSeedVolumeMl: territory.largeArterialColdSeedVolumeMl,
      effectiveComplianceMlPerMmHg:
        territory.largeArterialPressureVolume.referenceComplianceMlPerMmHg,
      pressureVolume: territory.largeArterialPressureVolume,
    }));
    edges.push(Object.freeze({
      edgeId: edgeIdV2("Ao", arterialNodeId),
      upstreamNodeId: "Ao",
      downstreamNodeId: arterialNodeId,
      territoryId,
      layerId: null,
      kind: "large-arterial",
      flowLawDirectionality: "signed",
      referencePathPressureDropFraction01: macro.largeArterial,
      referenceResistanceMmHgSecPerMl:
        territory.largeArterialResistanceMmHgSecPerMl,
      toneOwner: null,
      structuralCmdOwner: null,
      inertanceMmHgSec2PerMl: null,
    }));

    for (const layerId of CORONARY_LAYER_IDS_V2) {
      const layer = territory.layers[layerId];
      const microvascularResistance =
        layer.proximalArteriolarResistanceMmHgSecPerMl
        + layer.intermediateCapillaryResistanceMmHgSecPerMl
        + layer.distalVenularResistanceMmHgSecPerMl;
      const micro = Object.freeze({
        proximalArteriolar:
          layer.proximalArteriolarResistanceMmHgSecPerMl / microvascularResistance,
        intermediateCapillary:
          layer.intermediateCapillaryResistanceMmHgSecPerMl / microvascularResistance,
        distalVenular:
          layer.distalVenularResistanceMmHgSecPerMl / microvascularResistance,
      });
      const imArterialNodeId = intramyocardialNodeIdV2(
        territoryId,
        "Art",
        layerId,
      );
      const imVenousNodeId = intramyocardialNodeIdV2(
        territoryId,
        "Ven",
        layerId,
      );
      nodes.push(
        Object.freeze({
          nodeId: imArterialNodeId,
          kind: "intramyocardial-c1-proximal-arterial",
          territoryId,
          layerId,
          structuralBloodVolumeBudgetClass: "microvascular-c1",
          coldSeedVolumeMl: layer.c1ProximalArterial.coldSeedVolumeMl,
          effectiveComplianceMlPerMmHg:
            layer.c1ProximalArterial.effectiveComplianceMlPerMmHg,
          pressureVolume: layer.c1ProximalArterial.pressureVolume,
        }),
        Object.freeze({
          nodeId: imVenousNodeId,
          kind: "intramyocardial-c2-distal-venous",
          territoryId,
          layerId,
          structuralBloodVolumeBudgetClass: "microvascular-c2",
          coldSeedVolumeMl: layer.c2DistalVenous.coldSeedVolumeMl,
          effectiveComplianceMlPerMmHg:
            layer.c2DistalVenous.effectiveComplianceMlPerMmHg,
          pressureVolume: layer.c2DistalVenous.pressureVolume,
        }),
      );
      edges.push(
        Object.freeze({
          edgeId: edgeIdV2(arterialNodeId, imArterialNodeId),
          upstreamNodeId: arterialNodeId,
          downstreamNodeId: imArterialNodeId,
          territoryId,
          layerId,
          kind: "micro-proximal-arteriolar",
          flowLawDirectionality: "signed",
          referencePathPressureDropFraction01:
            macro.microvascular * micro.proximalArteriolar,
          referenceResistanceMmHgSecPerMl:
            layer.proximalArteriolarResistanceMmHgSecPerMl,
          toneOwner: Object.freeze({ territoryId, layerId }),
          structuralCmdOwner: Object.freeze({ territoryId, layerId }),
          inertanceMmHgSec2PerMl: null,
        }),
        Object.freeze({
          edgeId: edgeIdV2(imArterialNodeId, imVenousNodeId),
          upstreamNodeId: imArterialNodeId,
          downstreamNodeId: imVenousNodeId,
          territoryId,
          layerId,
          kind: "micro-intermediate-capillary",
          flowLawDirectionality: "signed",
          referencePathPressureDropFraction01:
            macro.microvascular * micro.intermediateCapillary,
          referenceResistanceMmHgSecPerMl:
            layer.intermediateCapillaryResistanceMmHgSecPerMl,
          toneOwner: null,
          structuralCmdOwner: Object.freeze({ territoryId, layerId }),
          inertanceMmHgSec2PerMl: null,
        }),
        Object.freeze({
          edgeId: edgeIdV2(imVenousNodeId, "CV"),
          upstreamNodeId: imVenousNodeId,
          downstreamNodeId: "CV",
          territoryId,
          layerId,
          kind: "micro-distal-venular",
          flowLawDirectionality: "signed",
          referencePathPressureDropFraction01:
            macro.microvascular * micro.distalVenular,
          referenceResistanceMmHgSecPerMl:
            layer.distalVenularResistanceMmHgSecPerMl,
          toneOwner: null,
          structuralCmdOwner: null,
          inertanceMmHgSec2PerMl: null,
        }),
      );
    }
  }

  nodes.push(Object.freeze({
    nodeId: "CV",
    kind: "common-large-venous-storage",
    territoryId: null,
    layerId: null,
    structuralBloodVolumeBudgetClass: "large-venous",
    coldSeedVolumeMl: prior.commonCoronaryVein.coldSeedVolumeMl,
    effectiveComplianceMlPerMmHg:
      prior.commonCoronaryVein.pressureVolume.referenceComplianceMlPerMmHg,
    pressureVolume: prior.commonCoronaryVein.pressureVolume,
  }));
  edges.push(Object.freeze({
    edgeId: "CV_RA",
    upstreamNodeId: "CV",
    downstreamNodeId: "RA",
    territoryId: null,
    layerId: null,
    kind: "large-venous-outlet",
    flowLawDirectionality: "signed",
    referencePathPressureDropFraction01: macro.largeVenous,
    referenceResistanceMmHgSecPerMl:
      prior.commonCoronaryVein.outletResistanceMmHgSecPerMl,
    toneOwner: null,
    structuralCmdOwner: null,
    inertanceMmHgSec2PerMl: null,
  }));

  const nodeIndexById = Object.freeze(Object.fromEntries(
    nodes.map((node, index) => [node.nodeId, index]),
  )) as CoronaryConservedVolumeRecordV2<number>;
  const edgeIndexById = Object.freeze(Object.fromEntries(
    edges.map((edge, index) => [edge.edgeId, index]),
  )) as Readonly<Record<CoronaryEdgeIdV2, number>>;

  const topology = Object.freeze({
    topologyId: prior.topologyId,
    constructionSeedSchemaId: prior.constructionSeedSchemaId,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    nodeIndexById,
    edgeIndexById,
  });
  if (
    validationStampReuseEligibleV1()
    && isTransitivelyFrozenPlainDataV1(prior)
  ) {
    coronaryTopologyByImmutablePriorV2.set(prior, topology);
  }
  return topology;
}

export function initialCoronaryToneStateV2(
  prior: CoronaryTopologyPriorV2 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
): CoronaryToneStateV2 {
  return Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Object.freeze({
        subepicardial:
          prior.territories[territoryId]
            .initialToneResistanceScaleByLayer.subepicardial,
        subendocardial:
          prior.territories[territoryId]
            .initialToneResistanceScaleByLayer.subendocardial,
      }),
    ]),
  )) as CoronaryToneStateV2;
}

/**
 * Deterministic identity for checkpoint/model compatibility checks.
 *
 * This is a compact corruption/mismatch guard, not a cryptographic signature.
 * Canonical key ordering makes the identity independent of object insertion
 * order while retaining every numeric prior that changes the equations.
 */
export function coronaryConfigurationFingerprintV2(value: unknown): string {
  if (
    value !== null
    && typeof value === "object"
    && validationStampReuseEligibleV1()
    && coronaryConfigurationFingerprintProofsV2.has(value)
  ) {
    return coronaryConfigurationFingerprintProofsV2.get(value)!;
  }
  const canonical = canonicalJsonV2(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const fingerprint = `fnv1a32-${hash.toString(16).padStart(8, "0")}`;
  if (
    value !== null
    && typeof value === "object"
    && validationStampReuseEligibleV1()
    && isTransitivelyFrozenPlainDataV1(value)
  ) {
    coronaryConfigurationFingerprintProofsV2.set(value, fingerprint);
  }
  return fingerprint;
}

const coronaryConfigurationFingerprintProofsV2 = new WeakMap<object, string>();

export function coronaryTopologyPriorFingerprintV2(
  prior: CoronaryTopologyPriorV2,
): string {
  return coronaryConfigurationFingerprintV2(prior);
}

function canonicalJsonV2(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new RangeError("coronary configuration fingerprint requires finite numbers");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJsonV2).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Readonly<Record<string, unknown>>;
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJsonV2(record[key])}`).join(",")}}`;
  }
  throw new TypeError("coronary configuration fingerprint received unsupported data");
}

export function createColdCoronaryConstructionSeedV2(
  prior: CoronaryTopologyPriorV2 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
): CoronaryColdConstructionSeedV2 {
  const topology = buildCoronaryTopologyV2(prior);
  const volumeMlByNode = Object.freeze(Object.fromEntries(
    topology.nodes.map((node) => [node.nodeId, node.coldSeedVolumeMl]),
  )) as CoronaryConservedVolumeRecordV2<number>;
  return Object.freeze({
    schemaId: prior.constructionSeedSchemaId,
    schemaVersion: 2,
    topologyId: prior.topologyId,
    priorFingerprint: coronaryTopologyPriorFingerprintV2(prior),
    volumeMlByNode,
    initialToneResistanceScaleByTerritoryLayer:
      initialCoronaryToneStateV2(prior),
  });
}

export function coronaryColdSeedBloodVolumeMlV2(
  prior: CoronaryTopologyPriorV2 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
): number {
  return buildCoronaryTopologyV2(prior).nodes.reduce(
    (sum, node) => sum + node.coldSeedVolumeMl,
    0,
  );
}

export function validateCoronaryTopologyPriorV2(
  prior: CoronaryTopologyPriorV2,
): void {
  if (prior.topologyId !== CORONARY_TOPOLOGY_ID_V2) {
    throw new RangeError("coronary V2 topology id is invalid");
  }
  if (
    prior.constructionSeedSchemaId !== CORONARY_CONSTRUCTION_SEED_SCHEMA_ID_V2
    || prior.schemaVersion !== 2
  ) {
    throw new RangeError("coronary V2 construction-seed schema identity is invalid");
  }
  const construction = prior.construction;
  if (construction.beatingReferenceR1Calibration !== null) {
    validateBeatingReferenceR1CalibrationV2(
      construction.beatingReferenceR1Calibration,
    );
  }
  const budget = construction.bloodVolumeMlPer100G;
  const budgetFractions = budget.exclusiveNormalizedFraction01;
  if (
    Math.abs(
      budgetFractions.largeArterial
      + budgetFractions.microvascular
      + budgetFractions.largeVenous
      - 1,
    ) > 1e-12
  ) {
    throw new RangeError(
      "Kassab mutually exclusive structural fractions must sum to one",
    );
  }
  const derivedBudget = budget.derivedVolumeMlPer100G;
  const volumeComponentSum =
    derivedBudget.largeArterial
    + derivedBudget.microvascular
    + derivedBudget.largeVenous;
  if (Math.abs(volumeComponentSum - budget.wholeCoronary) > 1e-12) {
    throw new RangeError(
      "Kassab structural blood-volume classes must sum without overlap",
    );
  }
  const compliance = construction.effectiveComplianceMlPerMmHgPer100G;
  if (
    Math.abs(
      compliance.c2Distal.center / compliance.c1Proximal.center
      - compliance.centerRatioC2OverC1,
    ) > 1e-12
  ) {
    throw new RangeError("Spaan C2/C1 center compliance ratio is inconsistent");
  }
  const macro = construction.baselineResistancePartition
    .macroPathPressureDropFraction01;
  const micro = construction.baselineResistancePartition
    .microInternalFractionOfMicrovascularDrop01;
  if (Math.abs(macro.largeArterial + macro.microvascular + macro.largeVenous - 1) > 1e-12) {
    throw new RangeError("macro coronary resistance fractions must sum to one");
  }
  if (
    Math.abs(
      micro.proximalArteriolar
      + micro.intermediateCapillary
      + micro.distalVenular
      - 1,
    ) > 1e-12
  ) {
    throw new RangeError("internal microvascular resistance fractions must sum to one");
  }
  const capillarySplit = construction.capillaryVolumeSplitBetweenC1AndC2;
  if (Math.abs(capillarySplit.c1Fraction01 + capillarySplit.c2Fraction01 - 1) > 1e-12) {
    throw new RangeError("C1/C2 structural microvascular-volume fractions must sum to one");
  }
  for (const [name, value] of [
    ["reference ventricular myocardial mass", construction.referenceVentricularMyocardialMassG],
    ["Kassab LV-equivalent denominator mass", construction.structuralBloodVolumeScale.kassabDenominatorMassG],
    ["reference perfusion pressure drop", construction.referencePerfusionPressureDropMmHg],
    ["resting myocardial blood flow", construction.restingMyocardialBloodFlowMlPerMinPerG],
    ["target total resting flow", construction.targetTotalRestingFlowMlPerMin],
    ["C1 compliance", compliance.c1Proximal.center],
    ["C2 compliance", compliance.c2Distal.center],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite`);
    }
  }

  const perfusedMass = construction.perfusedMyocardialMass;
  for (const wallId of CORONARY_PERFUSED_WALL_IDS_V2) {
    const row = perfusedMass.wallToTerritoryAllocationFraction01[wallId];
    if (Math.abs(row.LAD + row.LCx + row.RCA - 1) > 1e-12) {
      throw new RangeError(`${wallId} territory mass weights must sum to one`);
    }
  }
  const wallMassSum = CORONARY_PERFUSED_WALL_IDS_V2.reduce(
    (sum, wallId) => sum + perfusedMass.wallMassG[wallId],
    0,
  );
  const territoryMassSum = CORONARY_TERRITORY_IDS_V2.reduce(
    (sum, territoryId) => sum + perfusedMass.territoryMassG[territoryId],
    0,
  );
  const territoryLayerMassSum = CORONARY_TERRITORY_IDS_V2.reduce(
    (territorySum, territoryId) => territorySum
      + CORONARY_LAYER_IDS_V2.reduce(
        (layerSum, layerId) => layerSum
          + perfusedMass.territoryLayerMassG[territoryId][layerId],
        0,
      ),
    0,
  );
  if (
    Math.abs(wallMassSum - construction.referenceVentricularMyocardialMassG) > 1e-12
    || Math.abs(territoryMassSum - wallMassSum) > 1e-12
    || Math.abs(territoryLayerMassSum - wallMassSum) > 1e-12
  ) {
    throw new RangeError("wall-to-territory-layer myocardial mass ledger is not closed");
  }

  let territoryFlowFractionSum = 0;
  let territoryVolumeFractionSum = 0;
  let targetFlowSum = 0;
  let coldSeedNodeVolumeSum = prior.commonCoronaryVein.coldSeedVolumeMl;
  let c1ComplianceSum = 0;
  let c2ComplianceSum = 0;
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    const territory = prior.territories[territoryId];
    if (territory.territoryId !== territoryId) {
      throw new RangeError(`${territoryId} prior has mismatched territory id`);
    }
    for (const [name, value] of [
      ["resting flow fraction", territory.restingFlowFractionOfTotal01],
      ["structural volume fraction", territory.structuralVolumeAllocationFractionOfTotal01],
      ["target resting flow", territory.targetRestingFlowMlPerMin],
      ["large arterial cold volume", territory.largeArterialColdSeedVolumeMl],
      ["large arterial resistance", territory.largeArterialResistanceMmHgSecPerMl],
      ["large arterial compliance", territory.largeArterialPressureVolume.referenceComplianceMlPerMmHg],
    ] as const) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`${territoryId} ${name} must be positive and finite`);
      }
    }
    territoryFlowFractionSum += territory.restingFlowFractionOfTotal01;
    territoryVolumeFractionSum += territory.structuralVolumeAllocationFractionOfTotal01;
    targetFlowSum += territory.targetRestingFlowMlPerMin;
    coldSeedNodeVolumeSum += territory.largeArterialColdSeedVolumeMl;
    let layerFlowFractionSum = 0;
    let layerVolumeFractionSum = 0;
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      const layer = territory.layers[layerId];
      if (layer.layerId !== layerId) {
        throw new RangeError(`${territoryId}.${layerId} prior has mismatched layer id`);
      }
      layerFlowFractionSum += layer.restingFlowFractionWithinTerritory01;
      layerVolumeFractionSum +=
        layer.structuralVolumeAllocationFractionWithinTerritory01;
      const tone = territory.initialToneResistanceScaleByLayer[layerId];
      if (!Number.isFinite(tone) || tone <= 0) {
        throw new RangeError(`${territoryId}.${layerId} initial tone must be positive`);
      }
      for (const [name, value] of [
        ["resting flow fraction", layer.restingFlowFractionWithinTerritory01],
        ["structural volume fraction", layer.structuralVolumeAllocationFractionWithinTerritory01],
        ["C1 cold volume", layer.c1ProximalArterial.coldSeedVolumeMl],
        ["C1 compliance", layer.c1ProximalArterial.effectiveComplianceMlPerMmHg],
        ["C2 cold volume", layer.c2DistalVenous.coldSeedVolumeMl],
        ["C2 compliance", layer.c2DistalVenous.effectiveComplianceMlPerMmHg],
        ["proximal arteriolar resistance", layer.proximalArteriolarResistanceMmHgSecPerMl],
        ["intermediate capillary resistance", layer.intermediateCapillaryResistanceMmHgSecPerMl],
        ["distal venular resistance", layer.distalVenularResistanceMmHgSecPerMl],
      ] as const) {
        if (!Number.isFinite(value) || value <= 0) {
          throw new RangeError(
            `${territoryId}.${layerId} ${name} must be positive and finite`,
          );
        }
      }
      coldSeedNodeVolumeSum +=
        layer.c1ProximalArterial.coldSeedVolumeMl
        + layer.c2DistalVenous.coldSeedVolumeMl;
      c1ComplianceSum +=
        layer.c1ProximalArterial.effectiveComplianceMlPerMmHg;
      c2ComplianceSum +=
        layer.c2DistalVenous.effectiveComplianceMlPerMmHg;
      for (const compartment of [
        layer.c1ProximalArterial,
        layer.c2DistalVenous,
      ]) {
        const evaluated = evaluateCrefAnchoredCollapsiblePvV2(
          compartment.coldSeedVolumeMl,
          compartment.pressureVolume,
        );
        if (
          Math.abs(
            evaluated.transmuralPressureMmHg
            - compartment.pressureVolume.loadedSeedTransmuralPressureMmHg,
          ) > 1e-10
        ) {
          throw new RangeError(
            `${territoryId}.${layerId} collapsible PV law misses its loaded seed`,
          );
        }
      }
    }
    if (Math.abs(layerFlowFractionSum - 1) > 1e-12) {
      throw new RangeError(`${territoryId} layer flow fractions must sum to one`);
    }
    if (Math.abs(layerVolumeFractionSum - 1) > 1e-12) {
      throw new RangeError(`${territoryId} layer volume fractions must sum to one`);
    }
  }
  for (const [name, value] of [
    ["territory resting flow", territoryFlowFractionSum],
    ["territory structural volume", territoryVolumeFractionSum],
  ] as const) {
    if (Math.abs(value - 1) > 1e-12) {
      throw new RangeError(`${name} fractions must sum to one`);
    }
  }
  if (Math.abs(targetFlowSum - construction.targetTotalRestingFlowMlPerMin) > 1e-12) {
    throw new RangeError("territory target flows must reproduce total resting flow");
  }
  if (Math.abs(coldSeedNodeVolumeSum - prior.coldSeedCoronaryBloodVolumeMl) > 1e-12) {
    throw new RangeError("V2 cold-seed volume ledger must equal Kassab total volume");
  }
  const expectedC1Compliance =
    construction.referenceVentricularMyocardialMassG / 100
    * compliance.c1Proximal.center
    * construction.intramyocardialComplianceScale.c1Proximal;
  const expectedC2Compliance =
    construction.referenceVentricularMyocardialMassG / 100
    * compliance.c2Distal.center
    * construction.intramyocardialComplianceScale.c2Distal;
  for (const [name, value] of Object.entries(
    construction.intramyocardialComplianceScale,
  )) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} construction compliance scale must be positive`);
    }
  }
  if (
    Math.abs(c1ComplianceSum - expectedC1Compliance) > 1e-12
    || Math.abs(c2ComplianceSum - expectedC2Compliance) > 1e-12
  ) {
    throw new RangeError("distributed C1/C2 compliances must reproduce Spaan totals");
  }
  for (const [name, value] of [
    ["common coronary vein cold volume", prior.commonCoronaryVein.coldSeedVolumeMl],
    ["common coronary vein resistance", prior.commonCoronaryVein.outletResistanceMmHgSecPerMl],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite`);
    }
  }
}

const validatedCoronaryTopologiesV2 = new WeakSet<CoronaryTopologyV2>();

export function validateCoronaryTopologyV2(topology: CoronaryTopologyV2): void {
  if (
    validationStampReuseEligibleV1()
    && validatedCoronaryTopologiesV2.has(topology)
  ) {
    return;
  }
  if (topology.topologyId !== CORONARY_TOPOLOGY_ID_V2) {
    throw new RangeError("coronary V2 topology identity is invalid");
  }
  if (
    topology.constructionSeedSchemaId
      !== CORONARY_CONSTRUCTION_SEED_SCHEMA_ID_V2
  ) {
    throw new RangeError("coronary V2 construction-seed schema identity is invalid");
  }
  if (topology.nodes.length !== CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length) {
    throw new RangeError("coronary V2 topology must own sixteen volumes");
  }
  if (topology.edges.length !== CORONARY_EDGE_IDS_V2.length) {
    throw new RangeError("coronary V2 topology must own twenty-two signed edges");
  }
  if (
    topology.nodes.some(
      (node, index) => node.nodeId !== CORONARY_CONSERVED_VOLUME_NODE_IDS_V2[index],
    )
  ) {
    throw new RangeError("coronary V2 conserved-volume node order is not canonical");
  }
  const edgeIds = new Set(topology.edges.map((edge) => edge.edgeId));
  if (
    edgeIds.size !== CORONARY_EDGE_IDS_V2.length
    || CORONARY_EDGE_IDS_V2.some((edgeId) => !edgeIds.has(edgeId))
  ) {
    throw new RangeError("coronary V2 topology edge identity set is invalid");
  }
  if (
    Object.keys(topology.edgeIndexById).length !== topology.edges.length
    || topology.edges.some(
      (edge, index) => topology.edgeIndexById[edge.edgeId] !== index,
    )
  ) {
    throw new RangeError("coronary V2 topology edge index is not canonical");
  }
  const hydraulicNodeIds = new Set<string>([
    ...CORONARY_BOUNDARY_NODE_IDS_V2,
    ...CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  ]);
  for (const edge of topology.edges) {
    if (
      !hydraulicNodeIds.has(edge.upstreamNodeId)
      || !hydraulicNodeIds.has(edge.downstreamNodeId)
    ) {
      throw new RangeError(`${edge.edgeId} has a dangling endpoint`);
    }
    if (
      edge.flowLawDirectionality !== "signed"
      || edge.inertanceMmHgSec2PerMl !== null
    ) {
      throw new RangeError(`${edge.edgeId} must be signed and inertance-free`);
    }
  }
  if (validationStampIssuanceEligibleV1(topology)) {
    validatedCoronaryTopologiesV2.add(topology);
  }
}
