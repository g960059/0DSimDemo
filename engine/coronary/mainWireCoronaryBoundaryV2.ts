import type {
  CoronaryHydraulicBoundaryInputV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1,
  PASCAL_PER_MMHG_V1,
  evaluateAllCoronaryImpPressureV1,
  type CoronaryMechanicsInputV1,
} from "@/engine/coronary/intramyocardialPressureV1";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryIdV2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
} from "@/engine/coronary/typesV2";

export const MAIN_WIRE_CORONARY_BOUNDARY_V2_ID =
  "main-wire-coronary-fixed-normal-sip-boundary-v2" as const;

export type MainWireCoronaryWallNumbersV2 = Readonly<{
  LVFW: number;
  SEP: number;
  RVFW: number;
}>;

export type MainWireCoronaryImpMechanismV2 =
  | "source-cep-land-active"
  | "cep-only-control"
  | "cep-shortening-induced";

export type MainWireCoronaryShorteningReferenceV2 = Readonly<{
  referenceFiberLogStrainByWall: MainWireCoronaryWallNumbersV2;
}>;

export type MainWireCoronaryBoundarySampleV2 = Readonly<{
  absoluteAorticPressureMmHg: number;
  absoluteRightAtrialPressureMmHg: number;
  /**
   * Accepted source IMP, retained only for the historical Land-active control.
   * CEP and SIP mechanisms are always recomputed from `mechanicsInput`.
   */
  sourceIntramyocardialPressureMmHgByTerritoryLayer?:
    CoronaryTerritoryLayerRecordV2<number>;
  mechanicsInput: CoronaryMechanicsInputV1;
  effectiveFiberLogStrainByWall: MainWireCoronaryWallNumbersV2;
}>;

export type MainWireCoronaryBoundaryDirectionV2 = Readonly<{
  absoluteAorticPressureMmHg: number;
  absoluteRightAtrialPressureMmHg: number;
  mechanicsInput: CoronaryMechanicsInputV1;
  effectiveFiberLogStrainByWall: MainWireCoronaryWallNumbersV2;
}>;

export const MAIN_WIRE_CORONARY_BOUNDARY_DERIVATIVE_COMPONENT_IDS_V2 =
  Object.freeze([
    "absoluteAorticPressureMmHg",
    "absoluteRightAtrialPressureMmHg",
    "perivascularExternalPressureMmHg",
    "LAD.subepicardial",
    "LAD.subendocardial",
    "LCx.subepicardial",
    "LCx.subendocardial",
    "RCA.subepicardial",
    "RCA.subendocardial",
  ] as const);

export const MAIN_WIRE_CORONARY_MECHANICS_DIRECTION_COMPONENT_IDS_V2 =
  Object.freeze([
    "absoluteAorticPressureMmHg",
    "absoluteRightAtrialPressureMmHg",
    "externalPressureMmHg",
    "chamberTransmuralPressureMmHg.LV",
    "chamberTransmuralPressureMmHg.RV",
    "landActiveFiberStressPaByWall.LVFW",
    "landActiveFiberStressPaByWall.SEP",
    "landActiveFiberStressPaByWall.RVFW",
    "effectiveFiberLogStrainByWall.LVFW",
    "effectiveFiberLogStrainByWall.SEP",
    "effectiveFiberLogStrainByWall.RVFW",
  ] as const);

export type MainWireCoronaryShorteningImpGainPriorV2 = Readonly<{
  priorId: "normal-adult-fixed-shortening-imp-gain-v2";
  positivePartSmoothingWidthFraction: number;
  pressureGainMmHgPerUnitShorteningByTerritory:
    CoronaryTerritoryRecordV2<number>;
  normalReferenceCalibration: Readonly<{
    source: "accepted-normal-adult-dt2ms-terminal-cycle";
    referenceEvent: "accepted-mitral-closure";
    targetPeakShorteningPressureMmHg: 15;
    referenceFiberLogStrainByWall: MainWireCoronaryWallNumbersV2;
    peakWeightedFractionalShorteningByTerritory:
      CoronaryTerritoryRecordV2<number>;
    amplitudePriorOwner:
      "algranati-normal-peak-weak-prior-not-waveform-fit";
  }>;
}>;

/**
 * Fixed normal-adult SIP gain.
 *
 * These values are the exact gains produced by the accepted normal reference
 * cycle when its peak weighted shortening was mapped to the 15 mmHg weak SIP
 * amplitude prior. They are frozen here so a disease, load, or intervention
 * scenario changes SIP through its actual shortening rather than being
 * silently renormalized back to 15 mmHg on every run.
 */
export const NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2 =
  Object.freeze({
    priorId: "normal-adult-fixed-shortening-imp-gain-v2" as const,
    positivePartSmoothingWidthFraction: 0.005,
    pressureGainMmHgPerUnitShorteningByTerritory: Object.freeze({
      LAD: 81.1546499711951,
      LCx: 79.6541200248428,
      RCA: 84.2078441934158,
    }),
    normalReferenceCalibration: Object.freeze({
      source: "accepted-normal-adult-dt2ms-terminal-cycle" as const,
      referenceEvent: "accepted-mitral-closure" as const,
      targetPeakShorteningPressureMmHg: 15 as const,
      referenceFiberLogStrainByWall: Object.freeze({
        LVFW: 0.12376635825077181,
        SEP: 0.09958032653491095,
        RVFW: 0.10396159435405704,
      }),
      peakWeightedFractionalShorteningByTerritory: Object.freeze({
        LAD: 0.18483229248507727,
        LCx: 0.18831417628268005,
        RCA: 0.17813067349814482,
      }),
      amplitudePriorOwner:
        "algranati-normal-peak-weak-prior-not-waveform-fit" as const,
    }),
  }) satisfies MainWireCoronaryShorteningImpGainPriorV2;

/**
 * Pure same-candidate mechanics-to-coronary boundary resolver.
 *
 * It owns no cycle history. The caller supplies the accepted MVC fiber-strain
 * reference once per simulation (or beat, if explicitly intended). Crucially,
 * the default SIP gain is a fixed normal-reference coupling prior and is never
 * inferred from the current scenario's peak shortening.
 */
export function resolveMainWireCoronaryBoundaryV2(
  sample: MainWireCoronaryBoundarySampleV2,
  impMechanism: MainWireCoronaryImpMechanismV2,
  shorteningReference: MainWireCoronaryShorteningReferenceV2 | null,
  shorteningPrior: MainWireCoronaryShorteningImpGainPriorV2 =
    NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
): CoronaryHydraulicBoundaryInputV2 {
  validateImpMechanism(impMechanism);
  validateBoundarySample(sample, impMechanism);
  validateShorteningPrior(shorteningPrior);

  const cep = impMechanism !== "source-cep-land-active"
    ? evaluateAllCoronaryImpPressureV1({
      externalPressureMmHg: sample.mechanicsInput.externalPressureMmHg,
      chamberTransmuralPressureMmHg:
        sample.mechanicsInput.chamberTransmuralPressureMmHg,
      landActiveFiberStressPaByWall: Object.freeze({
        LVFW: 0,
        SEP: 0,
        RVFW: 0,
      }),
    }, "cavity-induced")
    : null;
  const shorteningPressure = impMechanism === "cep-shortening-induced"
    ? evaluateMainWireCoronaryShorteningImpV2(
      sample.effectiveFiberLogStrainByWall,
      shorteningReference,
      shorteningPrior,
    )
    : null;
  const intramyocardialPressure = cep === null
    ? copyLayers(sample.sourceIntramyocardialPressureMmHgByTerritoryLayer!)
    : copyLayers(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
      (territoryId) => [territoryId, Object.fromEntries(
        CORONARY_LAYER_IDS_V2.map((layerId) => [
          layerId,
          cep[territoryId][layerId]
          + (shorteningPressure?.[territoryId] ?? 0),
        ]),
      )],
    )) as CoronaryTerritoryLayerRecordV2<number>);

  return Object.freeze({
    absoluteAorticPressureMmHg: sample.absoluteAorticPressureMmHg,
    absoluteRightAtrialPressureMmHg: sample.absoluteRightAtrialPressureMmHg,
    perivascularExternalPressureMmHg:
      sample.mechanicsInput.externalPressureMmHg,
    intramyocardialPressureMmHgByTerritoryLayer: intramyocardialPressure,
  });
}

/**
 * Exact active-branch directional derivative of the pure mechanics-to-
 * coronary boundary resolver. The result reuses the boundary value shape but
 * every field is a derivative per unit caller coordinate.
 */
export function differentiateMainWireCoronaryBoundaryV2(
  sample: MainWireCoronaryBoundarySampleV2,
  direction: MainWireCoronaryBoundaryDirectionV2,
  impMechanism: MainWireCoronaryImpMechanismV2,
  shorteningReference: MainWireCoronaryShorteningReferenceV2 | null,
  shorteningPrior: MainWireCoronaryShorteningImpGainPriorV2 =
    NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
): CoronaryHydraulicBoundaryInputV2 {
  validateBoundaryDirection(direction);
  const matrix = new Float64Array(
    MAIN_WIRE_CORONARY_BOUNDARY_DERIVATIVE_COMPONENT_IDS_V2.length
      * MAIN_WIRE_CORONARY_MECHANICS_DIRECTION_COMPONENT_IDS_V2.length,
  );
  writeMainWireCoronaryBoundaryDerivativeMatrixV2(
    sample,
    impMechanism,
    shorteningReference,
    matrix,
    shorteningPrior,
  );
  const directionVector = Float64Array.of(
    direction.absoluteAorticPressureMmHg,
    direction.absoluteRightAtrialPressureMmHg,
    direction.mechanicsInput.externalPressureMmHg,
    direction.mechanicsInput.chamberTransmuralPressureMmHg.LV,
    direction.mechanicsInput.chamberTransmuralPressureMmHg.RV,
    direction.mechanicsInput.landActiveFiberStressPaByWall.LVFW,
    direction.mechanicsInput.landActiveFiberStressPaByWall.SEP,
    direction.mechanicsInput.landActiveFiberStressPaByWall.RVFW,
    direction.effectiveFiberLogStrainByWall.LVFW,
    direction.effectiveFiberLogStrainByWall.SEP,
    direction.effectiveFiberLogStrainByWall.RVFW,
  );
  const derivative = new Float64Array(
    MAIN_WIRE_CORONARY_BOUNDARY_DERIVATIVE_COMPONENT_IDS_V2.length,
  );
  for (let row = 0; row < derivative.length; row += 1) {
    let value = 0;
    for (let column = 0; column < directionVector.length; column += 1) {
      value += matrix[row * directionVector.length + column]!
        * directionVector[column]!;
    }
    derivative[row] = value;
  }
  const intramyocardialPressureMmHgByTerritoryLayer = Object.freeze({
    LAD: Object.freeze({
      subepicardial: derivative[3]!,
      subendocardial: derivative[4]!,
    }),
    LCx: Object.freeze({
      subepicardial: derivative[5]!,
      subendocardial: derivative[6]!,
    }),
    RCA: Object.freeze({
      subepicardial: derivative[7]!,
      subendocardial: derivative[8]!,
    }),
  });
  return Object.freeze({
    absoluteAorticPressureMmHg: derivative[0]!,
    absoluteRightAtrialPressureMmHg: derivative[1]!,
    perivascularExternalPressureMmHg: derivative[2]!,
    intramyocardialPressureMmHgByTerritoryLayer,
  });
}

/**
 * Writes the exact active-branch mapping from eleven mechanics directions to
 * the nine hydraulic boundary directions. Rows and columns follow the two
 * exported component-ID arrays. This is the allocation-free component writer
 * consumed by the coupled Newton assembler.
 */
export function writeMainWireCoronaryBoundaryDerivativeMatrixV2(
  sample: MainWireCoronaryBoundarySampleV2,
  impMechanism: MainWireCoronaryImpMechanismV2,
  shorteningReference: MainWireCoronaryShorteningReferenceV2 | null,
  rowMajorDestination: Float64Array,
  shorteningPrior: MainWireCoronaryShorteningImpGainPriorV2 =
    NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
): void {
  validateImpMechanism(impMechanism);
  validateBoundarySample(sample, impMechanism);
  validateShorteningPrior(shorteningPrior);
  const rowCount =
    MAIN_WIRE_CORONARY_BOUNDARY_DERIVATIVE_COMPONENT_IDS_V2.length;
  const columnCount =
    MAIN_WIRE_CORONARY_MECHANICS_DIRECTION_COMPONENT_IDS_V2.length;
  if (
    !(rowMajorDestination instanceof Float64Array)
    || rowMajorDestination.length !== rowCount * columnCount
  ) {
    throw new RangeError(
      `coronary boundary derivative matrix must contain ${rowCount * columnCount} f64 values`,
    );
  }
  rowMajorDestination.fill(0);
  rowMajorDestination[0 * columnCount + 0] = 1;
  rowMajorDestination[1 * columnCount + 1] = 1;
  rowMajorDestination[2 * columnCount + 2] = 1;
  if (impMechanism === "cep-shortening-induced" && shorteningReference === null) {
    throw new Error("shortening IMP derivative requires an MVC reference");
  }
  let row = 3;
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    const prior = NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1;
    const weights = prior.perfusedWallWeightByTerritory[territoryId];
    const shorteningGain =
      shorteningPrior.pressureGainMmHgPerUnitShorteningByTerritory[
        territoryId
      ];
    const activeStressGain =
      prior.activeStressPressureGainByTerritory[territoryId]
      / PASCAL_PER_MMHG_V1;
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      const depth = prior.layerDepthFromEpicardium01[layerId];
      const septalDepthFromRvSurface01 =
        prior.septalEndocardialSurfaceByTerritory[territoryId] === "LV"
          ? depth
          : 1 - depth;
      rowMajorDestination[row * columnCount + 2] = 1;
      rowMajorDestination[row * columnCount + 3] =
        weights.LVFW * depth
        + weights.SEP * septalDepthFromRvSurface01;
      rowMajorDestination[row * columnCount + 4] =
        weights.RVFW * depth
        + weights.SEP * (1 - septalDepthFromRvSurface01);
      if (impMechanism === "source-cep-land-active") {
        rowMajorDestination[row * columnCount + 5] =
          weights.LVFW * activeStressGain;
        rowMajorDestination[row * columnCount + 6] =
          weights.SEP * activeStressGain;
        rowMajorDestination[row * columnCount + 7] =
          weights.RVFW * activeStressGain;
      } else if (impMechanism === "cep-shortening-induced") {
        const reference = shorteningReference!;
        const walls = ["LVFW", "SEP", "RVFW"] as const;
        for (let wallIndex = 0; wallIndex < walls.length; wallIndex += 1) {
          const wallId = walls[wallIndex]!;
          const exponential = Math.exp(
            sample.effectiveFiberLogStrainByWall[wallId]
              - reference.referenceFiberLogStrainByWall[wallId],
          );
          const fractionalShortening = 1 - exponential;
          const positivePartDerivative = fractionalShortening <= 0
            ? 0
            : fractionalShortening
                >= shorteningPrior.positivePartSmoothingWidthFraction
              ? 1
              : fractionalShortening
                / shorteningPrior.positivePartSmoothingWidthFraction;
          rowMajorDestination[row * columnCount + 8 + wallIndex] =
            shorteningGain * weights[wallId]
            * positivePartDerivative * -exponential;
        }
      }
      row += 1;
    }
  }
}

function validateImpMechanism(
  value: MainWireCoronaryImpMechanismV2,
): void {
  if (
    value !== "source-cep-land-active"
    && value !== "cep-only-control"
    && value !== "cep-shortening-induced"
  ) {
    throw new Error(`unsupported coronary IMP mechanism: ${String(value)}`);
  }
}

export function evaluateMainWireCoronaryShorteningImpV2(
  currentFiberLogStrainByWall: MainWireCoronaryWallNumbersV2,
  reference: MainWireCoronaryShorteningReferenceV2 | null,
  prior: MainWireCoronaryShorteningImpGainPriorV2 =
    NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
): CoronaryTerritoryRecordV2<number> {
  if (reference === null) {
    throw new Error("shortening IMP requires an accepted MVC reference");
  }
  validateWallNumbers(
    "currentFiberLogStrainByWall",
    currentFiberLogStrainByWall,
  );
  validateWallNumbers(
    "referenceFiberLogStrainByWall",
    reference.referenceFiberLogStrainByWall,
  );
  validateShorteningPrior(prior);
  return copyTerritory(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [
      territoryId,
      prior.pressureGainMmHgPerUnitShorteningByTerritory[territoryId]
        * weightedMainWireCoronaryFractionalShorteningV2(
          currentFiberLogStrainByWall,
          reference.referenceFiberLogStrainByWall,
          territoryId,
          prior.positivePartSmoothingWidthFraction,
        ),
    ],
  )) as CoronaryTerritoryRecordV2<number>);
}

export function weightedMainWireCoronaryFractionalShorteningV2(
  current: MainWireCoronaryWallNumbersV2,
  reference: MainWireCoronaryWallNumbersV2,
  territoryId: CoronaryTerritoryIdV2,
  smoothingWidth: number =
    NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2
      .positivePartSmoothingWidthFraction,
): number {
  if (!Number.isFinite(smoothingWidth) || smoothingWidth <= 0) {
    throw new RangeError("SIP positive-part smoothing width must be positive");
  }
  const weights = NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1
    .perfusedWallWeightByTerritory[territoryId];
  return (Object.keys(weights) as (keyof MainWireCoronaryWallNumbersV2)[])
    .reduce(
      (sum, wallId) => sum + weights[wallId] * smoothPositivePart(
        1 - Math.exp(current[wallId] - reference[wallId]),
        smoothingWidth,
      ),
      0,
    );
}

function smoothPositivePart(value: number, width: number): number {
  if (value <= 0) return 0;
  if (value >= width) return value - width / 2;
  return value * value / (2 * width);
}

function validateBoundarySample(
  sample: MainWireCoronaryBoundarySampleV2,
  impMechanism: MainWireCoronaryImpMechanismV2,
): void {
  assertFinite("absoluteAorticPressureMmHg", sample.absoluteAorticPressureMmHg);
  assertFinite(
    "absoluteRightAtrialPressureMmHg",
    sample.absoluteRightAtrialPressureMmHg,
  );
  assertFinite(
    "mechanicsInput.externalPressureMmHg",
    sample.mechanicsInput.externalPressureMmHg,
  );
  assertFinite(
    "mechanicsInput.chamberTransmuralPressureMmHg.LV",
    sample.mechanicsInput.chamberTransmuralPressureMmHg.LV,
  );
  assertFinite(
    "mechanicsInput.chamberTransmuralPressureMmHg.RV",
    sample.mechanicsInput.chamberTransmuralPressureMmHg.RV,
  );
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    const stress = sample.mechanicsInput.landActiveFiberStressPaByWall[wallId];
    assertFinite(
      `mechanicsInput.landActiveFiberStressPaByWall.${wallId}`,
      stress,
    );
    if (stress < 0) {
      throw new RangeError(`${wallId} Land active stress must be non-negative`);
    }
  }
  validateWallNumbers(
    "effectiveFiberLogStrainByWall",
    sample.effectiveFiberLogStrainByWall,
  );
  if (impMechanism === "source-cep-land-active") {
    if (
      sample.sourceIntramyocardialPressureMmHgByTerritoryLayer === undefined
    ) {
      throw new Error(
        "source-cep-land-active requires source intramyocardial pressure",
      );
    }
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      for (const layerId of CORONARY_LAYER_IDS_V2) {
        assertFinite(
          `sourceIntramyocardialPressureMmHgByTerritoryLayer.${territoryId}.${layerId}`,
          sample.sourceIntramyocardialPressureMmHgByTerritoryLayer[territoryId][layerId],
        );
      }
    }
  }
}

function validateBoundaryDirection(
  direction: MainWireCoronaryBoundaryDirectionV2,
): void {
  assertFinite(
    "direction.absoluteAorticPressureMmHg",
    direction.absoluteAorticPressureMmHg,
  );
  assertFinite(
    "direction.absoluteRightAtrialPressureMmHg",
    direction.absoluteRightAtrialPressureMmHg,
  );
  assertFinite(
    "direction.mechanicsInput.externalPressureMmHg",
    direction.mechanicsInput.externalPressureMmHg,
  );
  assertFinite(
    "direction.mechanicsInput.chamberTransmuralPressureMmHg.LV",
    direction.mechanicsInput.chamberTransmuralPressureMmHg.LV,
  );
  assertFinite(
    "direction.mechanicsInput.chamberTransmuralPressureMmHg.RV",
    direction.mechanicsInput.chamberTransmuralPressureMmHg.RV,
  );
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    assertFinite(
      `direction.mechanicsInput.landActiveFiberStressPaByWall.${wallId}`,
      direction.mechanicsInput.landActiveFiberStressPaByWall[wallId],
    );
    assertFinite(
      `direction.effectiveFiberLogStrainByWall.${wallId}`,
      direction.effectiveFiberLogStrainByWall[wallId],
    );
  }
}

function validateShorteningPrior(
  prior: MainWireCoronaryShorteningImpGainPriorV2,
): void {
  if (
    !Number.isFinite(prior.positivePartSmoothingWidthFraction)
    || prior.positivePartSmoothingWidthFraction <= 0
  ) {
    throw new RangeError("SIP positive-part smoothing width must be positive");
  }
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    const gain = prior.pressureGainMmHgPerUnitShorteningByTerritory[territoryId];
    if (!Number.isFinite(gain) || gain < 0) {
      throw new RangeError(`${territoryId} SIP gain must be non-negative`);
    }
  }
}

function validateWallNumbers(
  name: string,
  value: MainWireCoronaryWallNumbersV2,
): void {
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    assertFinite(`${name}.${wallId}`, value[wallId]);
  }
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
}

function copyTerritory(
  input: CoronaryTerritoryRecordV2<number>,
): CoronaryTerritoryRecordV2<number> {
  return Object.freeze({ ...input });
}

function copyLayers(
  input: CoronaryTerritoryLayerRecordV2<number>,
): CoronaryTerritoryLayerRecordV2<number> {
  return Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Object.freeze({ ...input[territoryId] }),
    ]),
  )) as CoronaryTerritoryLayerRecordV2<number>;
}
