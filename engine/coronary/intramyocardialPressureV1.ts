import {
  CORONARY_LAYER_IDS_V1,
  CORONARY_PERFUSED_WALL_IDS_V1,
  CORONARY_TERRITORY_IDS_V1,
  type CoronaryLayerIdV1,
  type CoronaryLayerRecordV1,
  type CoronaryPerfusedWallRecordV1,
  type CoronaryTerritoryIdV1,
  type CoronaryTerritoryLayerRecordV1,
  type CoronaryTerritoryRecordV1,
} from "@/engine/coronary/typesV1";
import {
  validationStampIssuanceEligibleV1,
  validationStampReuseEligibleV1,
} from "@/engine/validationStampModeV1";

export const PASCAL_PER_MMHG_V1 = 133.322;

/**
 * Mechanics-to-coronary coupling used by the V1 kernel.
 *
 * `depthFromEpicardium01` is the centroid of a transmural layer. The two-layer
 * reduction uses 1/4 and 3/4; the corresponding three-layer CircAdapt model
 * uses 1/6, 3/6, and 5/6. Wall weights represent perfused myocardial mass and
 * must sum to one for each territory.
 */
export type CoronaryImpCouplingPriorV1 = Readonly<{
  layerDepthFromEpicardium01: CoronaryLayerRecordV1<number>;
  perfusedWallWeightByTerritory:
    CoronaryTerritoryRecordV1<CoronaryPerfusedWallRecordV1<number>>;
  /** The endocardial surface approached by increasing local septal depth. */
  septalEndocardialSurfaceByTerritory:
    CoronaryTerritoryRecordV1<"LV" | "RV">;
  /** Dimensionless conversion from Land active fiber stress to IMP. */
  activeStressPressureGainByTerritory:
    CoronaryTerritoryRecordV1<number>;
}>;

export type CoronaryMechanicsInputV1 = Readonly<{
  /** Common absolute external pressure; normally pericardial pressure. */
  externalPressureMmHg: number;
  /** Cavity pressure relative to the same common external pressure. */
  chamberTransmuralPressureMmHg: Readonly<{
    LV: number;
    RV: number;
  }>;
  /** Accepted/trial Land active stress only, never total wall stress. */
  landActiveFiberStressPaByWall: CoronaryPerfusedWallRecordV1<number>;
}>;

export type CoronaryImpEvaluationV1 = Readonly<{
  territoryId: CoronaryTerritoryIdV1;
  layerId: CoronaryLayerIdV1;
  depthFromEpicardium01: number;
  cavityInducedExtracellularPressureMmHg: number;
  activeStressInducedPressureMmHg: number;
  intramyocardialPressureMmHg: number;
  derivative: Readonly<{
    dImpDExternalPressure: 1;
    dImpDChamberTransmuralPressure: Readonly<{
      LV: number;
      RV: number;
    }>;
    dImpDLandActiveFiberStressPaByWall:
      CoronaryPerfusedWallRecordV1<number>;
  }>;
}>;

export type CoronaryImpPressureComponentV1 =
  | "cavity-induced"
  | "intramyocardial";

export const NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1 = Object.freeze({
  layerDepthFromEpicardium01: Object.freeze({
    subepicardial: 0.25,
    subendocardial: 0.75,
  }),
  perfusedWallWeightByTerritory: Object.freeze({
    LAD: Object.freeze({ LVFW: 0.75, SEP: 0.25, RVFW: 0 }),
    LCx: Object.freeze({ LVFW: 1, SEP: 0, RVFW: 0 }),
    RCA: Object.freeze({ LVFW: 0, SEP: 0.20, RVFW: 0.80 }),
  }),
  septalEndocardialSurfaceByTerritory: Object.freeze({
    LAD: "LV" as const,
    LCx: "LV" as const,
    RCA: "RV" as const,
  }),
  activeStressPressureGainByTerritory: Object.freeze({
    LAD: 0.06,
    LCx: 0.06,
    RCA: 0.06,
  }),
}) satisfies CoronaryImpCouplingPriorV1;

/**
 * Evaluate one territory/layer IMP as CEP plus active-stress pressure.
 *
 * Free-wall CEP interpolates from the common external pressure at epicardium
 * to the corresponding absolute cavity pressure at endocardium. Septal CEP
 * interpolates from RV absolute pressure to LV absolute pressure. Because the
 * input cavity pressures are transmural, the common external offset is added
 * exactly once:
 *
 *   P_IM = P_ext + weighted(CEP_tm) + gamma * sigma_active / 133.322.
 */
export function evaluateCoronaryImpV1(
  territoryId: CoronaryTerritoryIdV1,
  layerId: CoronaryLayerIdV1,
  input: CoronaryMechanicsInputV1,
  prior: CoronaryImpCouplingPriorV1 =
    NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1,
): CoronaryImpEvaluationV1 {
  validateCoronaryImpPriorV1(prior);
  validateCoronaryMechanicsInputV1(input);
  const scratch = createCoronaryImpScratchV1();
  evaluateCoronaryImpIntoScratchV1(
    scratch,
    territoryId,
    layerId,
    input,
    prior,
  );

  const wallWeight = prior.perfusedWallWeightByTerritory[territoryId];
  const gamma = prior.activeStressPressureGainByTerritory[territoryId];
  const dImpDStress = {} as Record<
    keyof CoronaryPerfusedWallRecordV1<number>,
    number
  >;
  for (const wallId of CORONARY_PERFUSED_WALL_IDS_V1) {
    dImpDStress[wallId] = wallWeight[wallId] * gamma / PASCAL_PER_MMHG_V1;
  }

  return Object.freeze({
    territoryId,
    layerId,
    depthFromEpicardium01: scratch.depthFromEpicardium01,
    cavityInducedExtracellularPressureMmHg:
      scratch.cavityInducedExtracellularPressureMmHg,
    activeStressInducedPressureMmHg:
      scratch.activeStressInducedPressureMmHg,
    intramyocardialPressureMmHg: scratch.intramyocardialPressureMmHg,
    derivative: Object.freeze({
      dImpDExternalPressure: 1 as const,
      dImpDChamberTransmuralPressure: Object.freeze({
        LV: scratch.lvCoefficient,
        RV: scratch.rvCoefficient,
      }),
      dImpDLandActiveFiberStressPaByWall: Object.freeze(dImpDStress),
    }),
  });
}

/**
 * Project only the numeric IMP values consumed by the hydraulic solver.
 *
 * The detailed evaluator above remains the diagnostic authority. This bulk
 * path shares its scalar equation order, validates the input once, and avoids
 * allocating six derivative/readback trees for every mechanics candidate.
 */
export function evaluateAllCoronaryImpPressureV1(
  input: CoronaryMechanicsInputV1,
  component: CoronaryImpPressureComponentV1,
  prior: CoronaryImpCouplingPriorV1 =
    NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1,
): CoronaryTerritoryLayerRecordV1<number> {
  if (component !== "cavity-induced" && component !== "intramyocardial") {
    throw new RangeError(
      `unsupported coronary IMP pressure component: ${String(component)}`,
    );
  }
  validateCoronaryImpPriorV1(prior);
  validateCoronaryMechanicsInputV1(input);
  const scratch = createCoronaryImpScratchV1();
  const result = {
    LAD: { subepicardial: 0, subendocardial: 0 },
    LCx: { subepicardial: 0, subendocardial: 0 },
    RCA: { subepicardial: 0, subendocardial: 0 },
  };
  for (const territoryId of CORONARY_TERRITORY_IDS_V1) {
    for (const layerId of CORONARY_LAYER_IDS_V1) {
      evaluateCoronaryImpIntoScratchV1(
        scratch,
        territoryId,
        layerId,
        input,
        prior,
      );
      result[territoryId][layerId] = component === "cavity-induced"
        ? scratch.cavityInducedExtracellularPressureMmHg
        : scratch.intramyocardialPressureMmHg;
    }
    Object.freeze(result[territoryId]);
  }
  return Object.freeze(result);
}

type MutableCoronaryImpScratchV1 = {
  depthFromEpicardium01: number;
  lvCoefficient: number;
  rvCoefficient: number;
  cavityInducedExtracellularPressureMmHg: number;
  activeStressInducedPressureMmHg: number;
  intramyocardialPressureMmHg: number;
};

function createCoronaryImpScratchV1(): MutableCoronaryImpScratchV1 {
  return {
    depthFromEpicardium01: 0,
    lvCoefficient: 0,
    rvCoefficient: 0,
    cavityInducedExtracellularPressureMmHg: 0,
    activeStressInducedPressureMmHg: 0,
    intramyocardialPressureMmHg: 0,
  };
}

function evaluateCoronaryImpIntoScratchV1(
  scratch: MutableCoronaryImpScratchV1,
  territoryId: CoronaryTerritoryIdV1,
  layerId: CoronaryLayerIdV1,
  input: CoronaryMechanicsInputV1,
  prior: CoronaryImpCouplingPriorV1,
): void {
  const depth = prior.layerDepthFromEpicardium01[layerId];
  const wallWeight = prior.perfusedWallWeightByTerritory[territoryId];
  const septalDepthFromRvSurface01 =
    prior.septalEndocardialSurfaceByTerritory[territoryId] === "LV"
      ? depth
      : 1 - depth;
  const lvCoefficient =
    wallWeight.LVFW * depth
    + wallWeight.SEP * septalDepthFromRvSurface01;
  const rvCoefficient =
    wallWeight.RVFW * depth
    + wallWeight.SEP * (1 - septalDepthFromRvSurface01);
  const cepTransmuralMmHg =
    lvCoefficient * input.chamberTransmuralPressureMmHg.LV
    + rvCoefficient * input.chamberTransmuralPressureMmHg.RV;
  const cavityInducedExtracellularPressureMmHg =
    input.externalPressureMmHg + cepTransmuralMmHg;

  const gamma = prior.activeStressPressureGainByTerritory[territoryId];
  let weightedActiveStressPa = 0;
  for (const wallId of CORONARY_PERFUSED_WALL_IDS_V1) {
    weightedActiveStressPa +=
      wallWeight[wallId] * input.landActiveFiberStressPaByWall[wallId];
  }
  const activeStressInducedPressureMmHg =
    gamma * weightedActiveStressPa / PASCAL_PER_MMHG_V1;

  scratch.depthFromEpicardium01 = depth;
  scratch.lvCoefficient = lvCoefficient;
  scratch.rvCoefficient = rvCoefficient;
  scratch.cavityInducedExtracellularPressureMmHg =
    cavityInducedExtracellularPressureMmHg;
  scratch.activeStressInducedPressureMmHg =
    activeStressInducedPressureMmHg;
  scratch.intramyocardialPressureMmHg =
    cavityInducedExtracellularPressureMmHg
    + activeStressInducedPressureMmHg;
}

function validateCoronaryMechanicsInputV1(
  input: CoronaryMechanicsInputV1,
): void {
  assertFinite("externalPressureMmHg", input.externalPressureMmHg);
  assertFinite(
    "chamberTransmuralPressureMmHg.LV",
    input.chamberTransmuralPressureMmHg.LV,
  );
  assertFinite(
    "chamberTransmuralPressureMmHg.RV",
    input.chamberTransmuralPressureMmHg.RV,
  );
  for (const wallId of CORONARY_PERFUSED_WALL_IDS_V1) {
    const stressPa = input.landActiveFiberStressPaByWall[wallId];
    if (!Number.isFinite(stressPa) || stressPa < 0) {
      throw new RangeError(`${wallId} Land active stress must be finite and non-negative`);
    }
  }
}

export function evaluateAllCoronaryImpV1(
  input: CoronaryMechanicsInputV1,
  prior: CoronaryImpCouplingPriorV1 =
    NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1,
): CoronaryTerritoryLayerRecordV1<CoronaryImpEvaluationV1> {
  return Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V1.map((territoryId) => [
      territoryId,
      Object.freeze(Object.fromEntries(
        CORONARY_LAYER_IDS_V1.map((layerId) => [
          layerId,
          evaluateCoronaryImpV1(territoryId, layerId, input, prior),
        ]),
      )) as CoronaryLayerRecordV1<CoronaryImpEvaluationV1>,
    ]),
  )) as CoronaryTerritoryLayerRecordV1<CoronaryImpEvaluationV1>;
}

export function validateCoronaryImpPriorV1(
  prior: CoronaryImpCouplingPriorV1,
): void {
  if (
    validationStampReuseEligibleV1()
    && validatedCoronaryImpPriorsV1.has(prior)
  ) {
    return;
  }
  const epi = prior.layerDepthFromEpicardium01.subepicardial;
  const endo = prior.layerDepthFromEpicardium01.subendocardial;
  if (!(epi > 0 && epi < endo && endo < 1)) {
    throw new RangeError(
      "coronary layer depths must satisfy 0 < subepicardial < subendocardial < 1",
    );
  }
  for (const territoryId of CORONARY_TERRITORY_IDS_V1) {
    const septalSurface =
      prior.septalEndocardialSurfaceByTerritory[territoryId];
    if (septalSurface !== "LV" && septalSurface !== "RV") {
      throw new RangeError(
        `${territoryId} septal endocardial surface must be LV or RV`,
      );
    }
    const weights = prior.perfusedWallWeightByTerritory[territoryId];
    let sum = 0;
    for (const wallId of CORONARY_PERFUSED_WALL_IDS_V1) {
      const weight = weights[wallId];
      if (!Number.isFinite(weight) || weight < 0) {
        throw new RangeError(`${territoryId}.${wallId} weight must be non-negative`);
      }
      sum += weight;
    }
    if (Math.abs(sum - 1) > 1e-12) {
      throw new RangeError(`${territoryId} perfused-wall weights must sum to one`);
    }
    const gamma = prior.activeStressPressureGainByTerritory[territoryId];
    if (!Number.isFinite(gamma) || gamma < 0) {
      throw new RangeError(`${territoryId} active-stress pressure gain must be non-negative`);
    }
  }
  if (validationStampIssuanceEligibleV1(prior)) {
    validatedCoronaryImpPriorsV1.add(prior);
  }
}

const validatedCoronaryImpPriorsV1 =
  new WeakSet<CoronaryImpCouplingPriorV1>();

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
}
