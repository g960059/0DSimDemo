import {
  validateCoronaryAutoregulationPriorV1,
  type CoronaryAutoregulationPriorV1,
} from "@/engine/coronary/autoregulationV1";
import {
  validateCollapsibleIntramyocardialPvPriorV1,
  validateVolumeDependentCoronaryResistancePriorV1,
  type CollapsibleIntramyocardialPvPriorV1,
  type VolumeDependentCoronaryResistancePriorV1,
} from "@/engine/coronary/collapsibleIntramyocardialBedV1";
import {
  NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1,
  validateCoronaryImpPriorV1,
  type CoronaryImpCouplingPriorV1,
} from "@/engine/coronary/intramyocardialPressureV1";
import {
  CORONARY_LAYER_IDS_V1,
  CORONARY_TERRITORY_IDS_V1,
  type CoronaryLayerIdV1,
  type CoronaryLayerRecordV1,
  type CoronaryTerritoryIdV1,
  type CoronaryTerritoryRecordV1,
} from "@/engine/coronary/typesV1";
import {
  validateYoungTsaiGeometryV1,
  type YoungTsaiCoronaryStenosisGeometryV1,
} from "@/engine/coronary/youngTsaiStenosisV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const CORONARY_BOUNDARY_NODE_IDS_V1 = Object.freeze([
  "Ao",
  "RA",
] as const);
export type CoronaryBoundaryNodeIdV1 =
  (typeof CORONARY_BOUNDARY_NODE_IDS_V1)[number];

export const CORONARY_CONSERVED_VOLUME_NODE_IDS_V1 = Object.freeze([
  "LAD.Art",
  "LAD.IM.subepicardial",
  "LAD.IM.subendocardial",
  "LCx.Art",
  "LCx.IM.subepicardial",
  "LCx.IM.subendocardial",
  "RCA.Art",
  "RCA.IM.subepicardial",
  "RCA.IM.subendocardial",
  "CS",
] as const);
export type CoronaryConservedVolumeNodeIdV1 =
  (typeof CORONARY_CONSERVED_VOLUME_NODE_IDS_V1)[number];

export type CoronaryHydraulicNodeIdV1 =
  | CoronaryBoundaryNodeIdV1
  | CoronaryConservedVolumeNodeIdV1;

export const CORONARY_EDGE_IDS_V1 = Object.freeze([
  "Ao_LAD.Art",
  "LAD.Art_IM.subepicardial",
  "LAD.IM.subepicardial_CS",
  "LAD.Art_IM.subendocardial",
  "LAD.IM.subendocardial_CS",
  "Ao_LCx.Art",
  "LCx.Art_IM.subepicardial",
  "LCx.IM.subepicardial_CS",
  "LCx.Art_IM.subendocardial",
  "LCx.IM.subendocardial_CS",
  "Ao_RCA.Art",
  "RCA.Art_IM.subepicardial",
  "RCA.IM.subepicardial_CS",
  "RCA.Art_IM.subendocardial",
  "RCA.IM.subendocardial_CS",
  "CS_RA",
] as const);
export type CoronaryEdgeIdV1 = (typeof CORONARY_EDGE_IDS_V1)[number];

export type CoronaryDistalArterialNodePriorV1 = Readonly<{
  coldSeedVolumeMl: number;
  unstressedVolumeMl: number;
  complianceMlPerMmHg: number;
}>;

export type CoronaryIntramyocardialLayerPriorV1 = Readonly<{
  layerId: CoronaryLayerIdV1;
  restingFlowFractionWithinTerritory01: number;
  coldSeedVolumeMl: number;
  collapsiblePv: CollapsibleIntramyocardialPvPriorV1;
  arteriolarResistance: VolumeDependentCoronaryResistancePriorV1;
  venularResistance: VolumeDependentCoronaryResistancePriorV1;
}>;

export type CoronaryTerritoryPriorV1 = Readonly<{
  territoryId: CoronaryTerritoryIdV1;
  targetRestingFlowMlPerMin: number;
  referencePerfusionPressureDropMmHg: number;
  /**
   * Compliant terminal arterial storage downstream of the focal lesion and
   * distributed healthy arterial resistance.  This is not the pressure-wire
   * sampling point immediately distal to a focal lesion.
   */
  distalArterialNode: CoronaryDistalArterialNodePriorV1;
  /** Healthy small/medium arterial resistance downstream of post-lesion Pd. */
  healthyDistributedArterialResistanceMmHgSecPerMl: number;
  /**
   * Maps the accepted microvascular tone scale r onto the arterial scale
   * r^alpha.  Chilian et al.'s dipyridamole data give alpha ~= 0.43 from
   * (6/17) = (4/45)^alpha; venous resistance remains fixed.
   */
  distributedArterialToneExponent: number;
  stenosisGeometry: YoungTsaiCoronaryStenosisGeometryV1;
  autoregulation: CoronaryAutoregulationPriorV1;
  layers: CoronaryLayerRecordV1<CoronaryIntramyocardialLayerPriorV1>;
}>;

export type CoronaryTopologyPriorV1 = Readonly<{
  topologyId: "main-wire-coronary-three-territory-two-layer-v1";
  units: Readonly<{
    time: "s";
    volume: "mL";
    pressure: "mmHg";
    flow: "mL/s";
    resistance: "mmHg*s/mL";
    quadraticResistance: "mmHg*s^2/mL^2";
  }>;
  externalBoundaries: Readonly<{ inlet: "Ao"; outlet: "RA" }>;
  imp: CoronaryImpCouplingPriorV1;
  territories: CoronaryTerritoryRecordV1<CoronaryTerritoryPriorV1>;
  coronarySinus: Readonly<{
    coldSeedVolumeMl: number;
    unstressedVolumeMl: number;
    complianceMlPerMmHg: number;
    outletResistanceMmHgSecPerMl: number;
  }>;
  bloodVolumeAndFlowConstruction: Readonly<{
    referenceVentricularMyocardialMassG: number;
    wholeCoronaryBloodVolumeMlPer100G: 12;
    intramyocardialBloodVolumeMlPer100G: 4;
    loadedReferenceTransmuralPressureMmHg: number;
    /** Derived from the declared pressure and collapsible-PV exponents. */
    loadedToZeroTransmuralIntramyocardialVolumeRatio: number;
    measuredCoronarySinusColdSeedVolumeMl: 3.71;
    restingMyocardialBloodFlowMlPerMinPerG: 1;
    targetTotalRestingFlowMlPerMin: number;
    evidenceBoundary:
      "population-prior-and-model-mass-binding-not-one-subject-measurement";
  }>;
  /** Exact numerical cold-seed ledger; not a measured normal-adult CBV claim. */
  coldSeedCoronaryBloodVolumeMl: number;
  claims: Readonly<{
    conservedVolumeNodeCount: 10;
    acceptedToneStateCount: 3;
    inertanceIncluded: false;
    totalBloodVolumeLedgerRequired: true;
  }>;
}>;

export type CoronaryConservedVolumeNodeSpecV1 = Readonly<{
  nodeId: CoronaryConservedVolumeNodeIdV1;
  kind: "distal-arterial-storage" | "intramyocardial" | "coronary-sinus";
  territoryId: CoronaryTerritoryIdV1 | null;
  layerId: CoronaryLayerIdV1 | null;
  coldSeedVolumeMl: number;
}>;

export type CoronaryEdgeSpecV1 = Readonly<{
  edgeId: CoronaryEdgeIdV1;
  upstreamNodeId: CoronaryHydraulicNodeIdV1;
  downstreamNodeId: CoronaryHydraulicNodeIdV1;
  territoryId: CoronaryTerritoryIdV1 | null;
  layerId: CoronaryLayerIdV1 | null;
  kind:
    | "focal-lesion-and-distributed-arterial"
    | "regulated-volume-dependent-arteriolar"
    | "volume-dependent-venular"
    | "coronary-sinus-outlet";
}>;

export type CoronaryTopologyV1 = Readonly<{
  topologyId: CoronaryTopologyPriorV1["topologyId"];
  nodes: readonly CoronaryConservedVolumeNodeSpecV1[];
  edges: readonly CoronaryEdgeSpecV1[];
}>;

const RESISTANCE_DISTRIBUTION = Object.freeze({
  epicardialArterial: 0.28,
  intramyocardialArteriolar: 0.65,
  venularAndSinus: 0.07,
});

const REFERENCE_PERFUSION_PRESSURE_DROP_MMHG = 85;
const REFERENCE_VENTRICULAR_MYOCARDIAL_MASS_G =
  Object.values(
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.wallGeometryParameters,
  ).reduce((sum, wall) => sum + wall.wallMaterialVolumeM3, 0)
  * NORMAL_ADULT_FIVE_WALL_PRIOR_V1.myocardialDensityKgPerM3
  * 1_000;
const RESTING_MYOCARDIAL_BLOOD_FLOW_ML_PER_MIN_PER_G = 1;
const TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN =
  REFERENCE_VENTRICULAR_MYOCARDIAL_MASS_G
  * RESTING_MYOCARDIAL_BLOOD_FLOW_ML_PER_MIN_PER_G;
// The common coronary sinus is a conduit/sampling compartment, not the owner
// of the full venous resistance.  Keep its pressure close to RA and assign the
// remainder of Chilian's 7% venous budget to distributed layer venules.
const CORONARY_SINUS_OUTLET_RESISTANCE_MMHG_SEC_PER_ML = 0.1;

const WHOLE_CORONARY_BLOOD_VOLUME_ML_PER_100_G = 12;
const INTRAMYOCARDIAL_BLOOD_VOLUME_ML_PER_100_G = 4;
const INTRAMYOCARDIAL_PV_PRESSURE_SCALE_MMHG = 8;
const INTRAMYOCARDIAL_PV_EXPANSION_EXPONENT = 4;
const INTRAMYOCARDIAL_PV_COLLAPSE_EXPONENT = 2;
// A low-single-digit loaded local Ptm is a weak construction prior. Indermuhle
// et al. establish human pressure distensibility but do not identify this
// local coordinate. The ratio below is therefore derived, not fitted.
const INTRAMYOCARDIAL_LOADED_REFERENCE_PTM_MMHG = 5;
const LOADED_TO_ZERO_TRANSMURAL_IM_VOLUME_RATIO =
  normalizedVolumeAtTransmuralPressure(
    INTRAMYOCARDIAL_LOADED_REFERENCE_PTM_MMHG,
    INTRAMYOCARDIAL_PV_PRESSURE_SCALE_MMHG,
    INTRAMYOCARDIAL_PV_EXPANSION_EXPONENT,
    INTRAMYOCARDIAL_PV_COLLAPSE_EXPONENT,
  );
const CORONARY_SINUS_COLD_SEED_VOLUME_ML = 3.71;
const CORONARY_SINUS_COLD_SEED_COMPLIANCE_ML_PER_MMHG = 0.218;
const CORONARY_COLD_SEED_RIGHT_ATRIAL_PRESSURE_MMHG = 5;
const CORONARY_COLD_SEED_EXTERNAL_PRESSURE_MMHG = 2;
const TOTAL_CORONARY_COLD_SEED_VOLUME_ML =
  REFERENCE_VENTRICULAR_MYOCARDIAL_MASS_G
    * WHOLE_CORONARY_BLOOD_VOLUME_ML_PER_100_G / 100;
const TOTAL_INTRAMYOCARDIAL_COLD_SEED_VOLUME_ML =
  REFERENCE_VENTRICULAR_MYOCARDIAL_MASS_G
    * INTRAMYOCARDIAL_BLOOD_VOLUME_ML_PER_100_G / 100;
const TOTAL_DISTAL_ARTERIAL_COLD_SEED_VOLUME_ML =
  TOTAL_CORONARY_COLD_SEED_VOLUME_ML
    - TOTAL_INTRAMYOCARDIAL_COLD_SEED_VOLUME_ML
    - CORONARY_SINUS_COLD_SEED_VOLUME_ML;

/**
 * Chilian's 7% venous budget is shared by the layer venules and common CS
 * outlet.  Subtract the common-series CS drop before assigning each parallel
 * layer its venular drop; otherwise the same venous budget is counted twice.
 */
const REFERENCE_LAYER_VENULAR_PRESSURE_DROP_MMHG =
  RESISTANCE_DISTRIBUTION.venularAndSinus
    * REFERENCE_PERFUSION_PRESSURE_DROP_MMHG
  - TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN / 60
    * CORONARY_SINUS_OUTLET_RESISTANCE_MMHG_SEC_PER_ML;

const DEFAULT_AUTOREGULATION = Object.freeze({
  // Chilian et al. 1989: microvascular R fell from 45 to 4 under
  // dipyridamole.  This is a pharmacologic lower prior, not a fitted value.
  minimumResistanceScale: 4 / 45,
  maximumResistanceScale: 2,
  responseTimeConstantSec: 5,
  referencePerfusionPressureMmHg: 85,
  myogenicPressureGain: 0.25,
  metabolicFlowErrorGain: 1,
  minimumSignalFraction: 0.05,
}) satisfies CoronaryAutoregulationPriorV1;

const DEFAULT_LAYER_FRACTIONS = Object.freeze({
  // Endo/epi = 1.11 while the two fractions still sum to one.
  subepicardial: 1 / 2.11,
  subendocardial: 1.11 / 2.11,
}) satisfies CoronaryLayerRecordV1<number>;

const STENOSIS_COMMON = Object.freeze({
  lesionLengthMm: 10,
  bloodDynamicViscosityPaSec: 0.0035,
  bloodDensityKgPerM3: 1060,
  separationLossCoefficient: 1.52,
});

function makeTerritoryPrior(
  territoryId: CoronaryTerritoryIdV1,
  targetRestingFlowMlPerMin: number,
  healthyDiameterMm: number,
): CoronaryTerritoryPriorV1 {
  const pressureDropMmHg = REFERENCE_PERFUSION_PRESSURE_DROP_MMHG;
  const territoryFlowMlPerSec = targetRestingFlowMlPerMin / 60;
  const territoryFlowFraction =
    targetRestingFlowMlPerMin / TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN;
  const distalArterialColdSeedVolumeMl =
    TOTAL_DISTAL_ARTERIAL_COLD_SEED_VOLUME_ML * territoryFlowFraction;
  const distalArterialUnstressedVolumeMl =
    0.54 * distalArterialColdSeedVolumeMl;
  const distalArterialNode = Object.freeze({
    coldSeedVolumeMl: distalArterialColdSeedVolumeMl,
    unstressedVolumeMl: distalArterialUnstressedVolumeMl,
    complianceMlPerMmHg:
      (distalArterialColdSeedVolumeMl
        - distalArterialUnstressedVolumeMl) / pressureDropMmHg,
  });
  const inletResistance =
    RESISTANCE_DISTRIBUTION.epicardialArterial
    * pressureDropMmHg / territoryFlowMlPerSec;
  const layers = Object.freeze(Object.fromEntries(
    CORONARY_LAYER_IDS_V1.map((layerId) => {
      const layerFlowMlPerSec =
        territoryFlowMlPerSec * DEFAULT_LAYER_FRACTIONS[layerId];
      const loadedColdSeedVolumeMl =
        TOTAL_INTRAMYOCARDIAL_COLD_SEED_VOLUME_ML
        * territoryFlowFraction
        * DEFAULT_LAYER_FRACTIONS[layerId];
      const zeroTransmuralReferenceVolumeMl =
        loadedColdSeedVolumeMl
        / LOADED_TO_ZERO_TRANSMURAL_IM_VOLUME_RATIO;
      const commonVolumeLaw = Object.freeze({
        // Tone owns dilation; the collapse threshold is the loaded reference,
        // not the zero-transmural PV reference.
        referenceVolumeMl: loadedColdSeedVolumeMl,
        residualHydraulicAreaFraction: 0.10,
      });
      return [layerId, Object.freeze({
        layerId,
        restingFlowFractionWithinTerritory01:
          DEFAULT_LAYER_FRACTIONS[layerId],
        coldSeedVolumeMl: loadedColdSeedVolumeMl,
        collapsiblePv: Object.freeze({
          referenceVolumeMl: zeroTransmuralReferenceVolumeMl,
          pressureScaleMmHg: INTRAMYOCARDIAL_PV_PRESSURE_SCALE_MMHG,
          expansionExponent: INTRAMYOCARDIAL_PV_EXPANSION_EXPONENT,
          collapseExponent: INTRAMYOCARDIAL_PV_COLLAPSE_EXPONENT,
        }),
        arteriolarResistance: Object.freeze({
          ...commonVolumeLaw,
          referenceResistanceMmHgSecPerMl:
            RESISTANCE_DISTRIBUTION.intramyocardialArteriolar
            * pressureDropMmHg / layerFlowMlPerSec,
        }),
        venularResistance: Object.freeze({
          ...commonVolumeLaw,
          referenceResistanceMmHgSecPerMl:
            REFERENCE_LAYER_VENULAR_PRESSURE_DROP_MMHG
              / layerFlowMlPerSec,
        }),
      })];
    }),
  )) as CoronaryLayerRecordV1<CoronaryIntramyocardialLayerPriorV1>;
  return Object.freeze({
    territoryId,
    targetRestingFlowMlPerMin,
    referencePerfusionPressureDropMmHg: pressureDropMmHg,
    distalArterialNode,
    healthyDistributedArterialResistanceMmHgSecPerMl: inletResistance,
    distributedArterialToneExponent:
      Math.log(6 / 17) / Math.log(4 / 45),
    stenosisGeometry: Object.freeze({
      ...STENOSIS_COMMON,
      healthyDiameterMm,
    }),
    autoregulation: DEFAULT_AUTOREGULATION,
    layers,
  });
}

export const NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1 = Object.freeze({
  topologyId: "main-wire-coronary-three-territory-two-layer-v1" as const,
  units: Object.freeze({
    time: "s" as const,
    volume: "mL" as const,
    pressure: "mmHg" as const,
    flow: "mL/s" as const,
    resistance: "mmHg*s/mL" as const,
    quadraticResistance: "mmHg*s^2/mL^2" as const,
  }),
  externalBoundaries: Object.freeze({ inlet: "Ao" as const, outlet: "RA" as const }),
  imp: NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1,
  territories: Object.freeze({
    LAD: makeTerritoryPrior(
      "LAD",
      0.42 * TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN,
      3.2,
    ),
    LCx: makeTerritoryPrior(
      "LCx",
      0.28 * TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN,
      3.0,
    ),
    RCA: makeTerritoryPrior(
      "RCA",
      0.30 * TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN,
      3.2,
    ),
  }),
  coronarySinus: Object.freeze({
    coldSeedVolumeMl: CORONARY_SINUS_COLD_SEED_VOLUME_ML,
    unstressedVolumeMl:
      CORONARY_SINUS_COLD_SEED_VOLUME_ML
      - CORONARY_SINUS_COLD_SEED_COMPLIANCE_ML_PER_MMHG * (
        CORONARY_COLD_SEED_RIGHT_ATRIAL_PRESSURE_MMHG
        + TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN / 60
          * CORONARY_SINUS_OUTLET_RESISTANCE_MMHG_SEC_PER_ML
        - CORONARY_COLD_SEED_EXTERNAL_PRESSURE_MMHG
      ),
    complianceMlPerMmHg:
      CORONARY_SINUS_COLD_SEED_COMPLIANCE_ML_PER_MMHG,
    outletResistanceMmHgSecPerMl:
      CORONARY_SINUS_OUTLET_RESISTANCE_MMHG_SEC_PER_ML,
  }),
  bloodVolumeAndFlowConstruction: Object.freeze({
    referenceVentricularMyocardialMassG:
      REFERENCE_VENTRICULAR_MYOCARDIAL_MASS_G,
    wholeCoronaryBloodVolumeMlPer100G: 12 as const,
    intramyocardialBloodVolumeMlPer100G: 4 as const,
    loadedReferenceTransmuralPressureMmHg:
      INTRAMYOCARDIAL_LOADED_REFERENCE_PTM_MMHG,
    loadedToZeroTransmuralIntramyocardialVolumeRatio:
      LOADED_TO_ZERO_TRANSMURAL_IM_VOLUME_RATIO,
    measuredCoronarySinusColdSeedVolumeMl: 3.71 as const,
    restingMyocardialBloodFlowMlPerMinPerG: 1 as const,
    targetTotalRestingFlowMlPerMin: TARGET_TOTAL_RESTING_FLOW_ML_PER_MIN,
    evidenceBoundary:
      "population-prior-and-model-mass-binding-not-one-subject-measurement" as const,
  }),
  coldSeedCoronaryBloodVolumeMl: TOTAL_CORONARY_COLD_SEED_VOLUME_ML,
  claims: Object.freeze({
    conservedVolumeNodeCount: 10 as const,
    acceptedToneStateCount: 3 as const,
    inertanceIncluded: false as const,
    totalBloodVolumeLedgerRequired: true as const,
  }),
}) satisfies CoronaryTopologyPriorV1;

function normalizedVolumeAtTransmuralPressure(
  pressureMmHg: number,
  pressureScaleMmHg: number,
  expansionExponent: number,
  collapseExponent: number,
): number {
  let lower = 1;
  let upper = 2;
  const pressureAt = (x: number) => pressureScaleMmHg * (
    x ** expansionExponent - x ** (-collapseExponent)
  );
  while (pressureAt(upper) < pressureMmHg) upper *= 2;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    if (pressureAt(midpoint) < pressureMmHg) lower = midpoint;
    else upper = midpoint;
  }
  return 0.5 * (lower + upper);
}

export function buildCoronaryTopologyV1(
  prior: CoronaryTopologyPriorV1 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
): CoronaryTopologyV1 {
  validateCoronaryTopologyPriorV1(prior);
  const nodes: CoronaryConservedVolumeNodeSpecV1[] = [];
  const edges: CoronaryEdgeSpecV1[] = [];
  for (const territoryId of CORONARY_TERRITORY_IDS_V1) {
    const territory = prior.territories[territoryId];
    const arteryNodeId = `${territoryId}.Art` as CoronaryConservedVolumeNodeIdV1;
    nodes.push(Object.freeze({
      nodeId: arteryNodeId,
      kind: "distal-arterial-storage",
      territoryId,
      layerId: null,
      coldSeedVolumeMl: territory.distalArterialNode.coldSeedVolumeMl,
    }));
    edges.push(Object.freeze({
      edgeId: `Ao_${territoryId}.Art` as CoronaryEdgeIdV1,
      upstreamNodeId: "Ao",
      downstreamNodeId: arteryNodeId,
      territoryId,
      layerId: null,
      kind: "focal-lesion-and-distributed-arterial",
    }));
    for (const layerId of CORONARY_LAYER_IDS_V1) {
      const intramyocardialNodeId =
        `${territoryId}.IM.${layerId}` as CoronaryConservedVolumeNodeIdV1;
      nodes.push(Object.freeze({
        nodeId: intramyocardialNodeId,
        kind: "intramyocardial",
        territoryId,
        layerId,
        coldSeedVolumeMl: territory.layers[layerId].coldSeedVolumeMl,
      }));
      edges.push(
        Object.freeze({
          edgeId: `${territoryId}.Art_IM.${layerId}` as CoronaryEdgeIdV1,
          upstreamNodeId: arteryNodeId,
          downstreamNodeId: intramyocardialNodeId,
          territoryId,
          layerId,
          kind: "regulated-volume-dependent-arteriolar",
        }),
        Object.freeze({
          edgeId: `${territoryId}.IM.${layerId}_CS` as CoronaryEdgeIdV1,
          upstreamNodeId: intramyocardialNodeId,
          downstreamNodeId: "CS",
          territoryId,
          layerId,
          kind: "volume-dependent-venular",
        }),
      );
    }
  }
  nodes.push(Object.freeze({
    nodeId: "CS",
    kind: "coronary-sinus",
    territoryId: null,
    layerId: null,
    coldSeedVolumeMl: prior.coronarySinus.coldSeedVolumeMl,
  }));
  edges.push(Object.freeze({
    edgeId: "CS_RA",
    upstreamNodeId: "CS",
    downstreamNodeId: "RA",
    territoryId: null,
    layerId: null,
    kind: "coronary-sinus-outlet",
  }));
  return Object.freeze({
    topologyId: prior.topologyId,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
  });
}

export function coronaryColdSeedBloodVolumeMlV1(
  prior: CoronaryTopologyPriorV1 = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
): number {
  return buildCoronaryTopologyV1(prior).nodes.reduce(
    (sum, node) => sum + node.coldSeedVolumeMl,
    0,
  );
}

export function validateCoronaryTopologyPriorV1(
  prior: CoronaryTopologyPriorV1,
): void {
  validateCoronaryImpPriorV1(prior.imp);
  let targetFlowSum = 0;
  for (const territoryId of CORONARY_TERRITORY_IDS_V1) {
    const territory = prior.territories[territoryId];
    if (territory.territoryId !== territoryId) {
      throw new RangeError(`${territoryId} prior has mismatched territory id`);
    }
    for (const [name, value] of [
      ["targetRestingFlowMlPerMin", territory.targetRestingFlowMlPerMin],
      ["referencePerfusionPressureDropMmHg", territory.referencePerfusionPressureDropMmHg],
      ["healthyDistributedArterialResistanceMmHgSecPerMl", territory.healthyDistributedArterialResistanceMmHgSecPerMl],
      ["distributedArterialToneExponent", territory.distributedArterialToneExponent],
      ["distal arterial cold volume", territory.distalArterialNode.coldSeedVolumeMl],
      ["distal arterial compliance", territory.distalArterialNode.complianceMlPerMmHg],
    ] as const) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`${territoryId} ${name} must be positive and finite`);
      }
    }
    if (
      !Number.isFinite(territory.distalArterialNode.unstressedVolumeMl)
      || territory.distalArterialNode.unstressedVolumeMl < 0
    ) {
      throw new RangeError(
        `${territoryId} distal arterial unstressed volume must be finite and non-negative`,
      );
    }
    validateYoungTsaiGeometryV1(territory.stenosisGeometry);
    validateCoronaryAutoregulationPriorV1(territory.autoregulation);
    targetFlowSum += territory.targetRestingFlowMlPerMin;
    let layerFractionSum = 0;
    for (const layerId of CORONARY_LAYER_IDS_V1) {
      const layer = territory.layers[layerId];
      if (layer.layerId !== layerId) {
        throw new RangeError(`${territoryId}.${layerId} prior has mismatched layer id`);
      }
      if (
        !Number.isFinite(layer.restingFlowFractionWithinTerritory01)
        || layer.restingFlowFractionWithinTerritory01 <= 0
      ) {
        throw new RangeError(`${territoryId}.${layerId} flow fraction must be positive`);
      }
      if (!Number.isFinite(layer.coldSeedVolumeMl) || layer.coldSeedVolumeMl <= 0) {
        throw new RangeError(`${territoryId}.${layerId} cold volume must be positive`);
      }
      validateCollapsibleIntramyocardialPvPriorV1(layer.collapsiblePv);
      validateVolumeDependentCoronaryResistancePriorV1(
        layer.arteriolarResistance,
      );
      validateVolumeDependentCoronaryResistancePriorV1(
        layer.venularResistance,
      );
      layerFractionSum += layer.restingFlowFractionWithinTerritory01;
    }
    if (Math.abs(layerFractionSum - 1) > 1e-12) {
      throw new RangeError(`${territoryId} layer flow fractions must sum to one`);
    }
  }
  if (!(targetFlowSum > 0)) throw new RangeError("total coronary target flow must be positive");
  const construction = prior.bloodVolumeAndFlowConstruction;
  for (const [name, value] of [
    ["reference ventricular myocardial mass", construction.referenceVentricularMyocardialMassG],
    ["whole coronary blood volume per 100 g", construction.wholeCoronaryBloodVolumeMlPer100G],
    ["intramyocardial blood volume per 100 g", construction.intramyocardialBloodVolumeMlPer100G],
    ["loaded reference transmural pressure", construction.loadedReferenceTransmuralPressureMmHg],
    ["loaded-to-zero transmural volume ratio", construction.loadedToZeroTransmuralIntramyocardialVolumeRatio],
    ["measured coronary sinus cold volume", construction.measuredCoronarySinusColdSeedVolumeMl],
    ["resting myocardial blood flow", construction.restingMyocardialBloodFlowMlPerMinPerG],
    ["target total resting flow", construction.targetTotalRestingFlowMlPerMin],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite`);
    }
  }
  if (Math.abs(targetFlowSum - construction.targetTotalRestingFlowMlPerMin) > 1e-12) {
    throw new RangeError(
      "territory target flows must equal the declared total resting flow",
    );
  }
  if (
    Math.abs(
      construction.referenceVentricularMyocardialMassG
        * construction.restingMyocardialBloodFlowMlPerMinPerG
      - construction.targetTotalRestingFlowMlPerMin,
    ) > 1e-12
  ) {
    throw new RangeError(
      "declared myocardial mass and resting MBF must reproduce target flow",
    );
  }
  for (const [name, value] of [
    ["coronary sinus cold volume", prior.coronarySinus.coldSeedVolumeMl],
    ["coronary sinus compliance", prior.coronarySinus.complianceMlPerMmHg],
    ["coronary sinus outlet resistance", prior.coronarySinus.outletResistanceMmHgSecPerMl],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite`);
    }
  }
  if (
    !Number.isFinite(prior.coronarySinus.unstressedVolumeMl)
    || prior.coronarySinus.unstressedVolumeMl < 0
  ) {
    throw new RangeError(
      "coronary sinus unstressed volume must be finite and non-negative",
    );
  }
  const computedColdSeedBloodVolumeMl =
    CORONARY_TERRITORY_IDS_V1.reduce((territorySum, territoryId) => {
      const territory = prior.territories[territoryId];
      return territorySum
        + territory.distalArterialNode.coldSeedVolumeMl
        + CORONARY_LAYER_IDS_V1.reduce(
          (layerSum, layerId) =>
            layerSum + territory.layers[layerId].coldSeedVolumeMl,
          0,
        );
    }, 0) + prior.coronarySinus.coldSeedVolumeMl;
  if (!Number.isFinite(prior.coldSeedCoronaryBloodVolumeMl)
    || Math.abs(
      computedColdSeedBloodVolumeMl - prior.coldSeedCoronaryBloodVolumeMl
    ) > 1e-12) {
    throw new RangeError(
      "coronary cold-seed blood-volume ledger does not equal node seeds",
    );
  }
}
