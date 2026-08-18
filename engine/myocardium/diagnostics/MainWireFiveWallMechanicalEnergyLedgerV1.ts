/**
 * Pure mechanical-energy ledger over committed five-wall accepted steps.
 *
 * Each accepted sample is the endpoint of one backward-Euler segment. The
 * optional preceding sample must be the exact accepted endpoint immediately
 * before acceptedStepSamples[0]. Time, revision, and provider identity are
 * deliberately outside this numerical kernel and remain evidence-layer data.
 *
 * Active-stress work is reported only as mechanical work. It is not a Land
 * stored-energy, chemical-energy, ATP-use, PVA, or myocardial-O2 claim.
 */

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_LEDGER_V1_ID =
  "main-wire-five-wall-mechanical-energy-ledger-v1" as const;

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_LEDGER_CLAIM_V1 =
  Object.freeze({
    input: "committed-accepted-step-readback-only" as const,
    addsDynamicState: false as const,
    integration: "backward-Euler-endpoint" as const,
    landThermodynamicStoredEnergyClaimed: false as const,
    cavityWorkSign: "positive-is-work-on-wall" as const,
    pericardialWorkSign: "positive-is-work-stored-in-common-bag" as const,
    pericardialWorkExcludedFromTransmuralWallWork: true as const,
    septalCavityAllocation: "combined-ventricular-walls-only" as const,
  });

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1 = Object.freeze([
  "LA",
  "LVFW",
  "SEP",
  "RVFW",
  "RA",
] as const);

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1 =
  Object.freeze(["LA", "LV", "RA", "RV"] as const);

export type MainWireFiveWallMechanicalEnergyWallIdV1 =
  (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1)[number];

export type MainWireFiveWallMechanicalEnergyChamberIdV1 =
  (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1)[number];

export type MainWireFiveWallMechanicalEnergyPhaseV1 =
  "reservoir" | "conduit" | "pumping";

export type MainWireFiveWallMechanicalEnergyWallRecordV1<T> = Readonly<
  Record<MainWireFiveWallMechanicalEnergyWallIdV1, T>
>;

export type MainWireFiveWallMechanicalEnergyChamberRecordV1<T> = Readonly<
  Record<MainWireFiveWallMechanicalEnergyChamberIdV1, T>
>;

export type MainWireFiveWallMechanicalEnergyDensityReadbackV1 = Readonly<{
  equilibriumPassiveStoredEnergyDensityJPerM3: number;
  slsPreviousStoredEnergyDensityJPerM3: number;
  slsNextStoredEnergyDensityJPerM3: number;
  slsPhysicalDissipationIncrementDensityJPerM3: number;
  slsBackwardEulerNumericalDissipationIncrementDensityJPerM3: number;
  slsDiscreteEnergyBalanceResidualJPerM3: number;
}>;

export type MainWireFiveWallMechanicalEnergyStressReadbackV1 = Readonly<{
  total: number;
  landActive: number;
  equilibriumPassive: number;
  parallelSls: number;
}>;

export type MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1 =
  Readonly<{
    nodeVolumeMl: MainWireFiveWallMechanicalEnergyChamberRecordV1<number>;
    chamberTransmuralPressureMmHg: MainWireFiveWallMechanicalEnergyChamberRecordV1<number>;
    commonPericardium: Readonly<{
      excessPressureMmHg: number;
      storedEnergyMilliJ: number;
    }>;
    wallStressPa: MainWireFiveWallMechanicalEnergyWallRecordV1<MainWireFiveWallMechanicalEnergyStressReadbackV1>;
    wallFiberLogStrain: MainWireFiveWallMechanicalEnergyWallRecordV1<number>;
    wallEnergyLedgerDensity: MainWireFiveWallMechanicalEnergyWallRecordV1<MainWireFiveWallMechanicalEnergyDensityReadbackV1>;
  }>;

export type MainWireFiveWallMechanicalEnergyLedgerInputV1 = Readonly<{
  acceptedStepSamples: readonly MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1[];
  /** Exact committed endpoint immediately before acceptedStepSamples[0]. */
  precedingAcceptedStepSample?: MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1 | null;
  wallMaterialVolumeMlByWall: MainWireFiveWallMechanicalEnergyWallRecordV1<number>;
  /** Optional event-owned phase projection; it does not gate the base ledger. */
  leftAtrialPhaseByAcceptedStep?:
    readonly MainWireFiveWallMechanicalEnergyPhaseV1[] | null;
}>;

export type MainWireFiveWallMechanicalEnergyStressWorkComponentsV1 = Readonly<{
  total: number;
  landActive: number;
  equilibriumPassive: number;
  parallelSls: number;
}>;

export type MainWireFiveWallMechanicalEnergyWallLedgerV1 = Readonly<{
  stressWorkOnWallMilliJ: MainWireFiveWallMechanicalEnergyStressWorkComponentsV1;
  stressAssemblyResidualMilliJ: number;
  equilibriumPassiveStoredEnergyChangeMilliJ: number;
  equilibriumPassiveBackwardEulerRemainderMilliJ: number;
  parallelSls: Readonly<{
    storedEnergyChangeMilliJ: number;
    physicalDissipationMilliJ: number;
    backwardEulerNumericalDissipationMilliJ: number;
    reportedDiscreteBalanceResidualMilliJ: number;
    reconstructedDiscreteBalanceResidualMilliJ: number;
    readbackAgreementResidualMilliJ: number;
  }>;
}>;

export type MainWireFiveWallMechanicalEnergyLedgerV1 = Readonly<{
  ledgerId: typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_LEDGER_V1_ID;
  acceptedStepSampleCount: number;
  pairedAcceptedStepCount: number;
  stressWorkCoverageFraction: number;
  perWall: MainWireFiveWallMechanicalEnergyWallRecordV1<MainWireFiveWallMechanicalEnergyWallLedgerV1>;
  leftAtrialStressWorkOnWallByPhaseMilliJ: Readonly<
    Record<
      MainWireFiveWallMechanicalEnergyPhaseV1,
      MainWireFiveWallMechanicalEnergyStressWorkComponentsV1
    >
  > | null;
  cavityWorkOnWallMilliJ: MainWireFiveWallMechanicalEnergyChamberRecordV1<number>;
  commonPericardium: Readonly<{
    pressureWorkOnBagMilliJ: number;
    storedEnergyChangeMilliJ: number;
    backwardEulerRemainderMilliJ: number;
  }>;
  workConjugacyResidualMilliJ: Readonly<{
    leftAtrium: number;
    rightAtrium: number;
    ventricularWallsCombined: number;
    allFiveWalls: number;
  }>;
  claim: typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_LEDGER_CLAIM_V1;
}>;

const MMHG_ML_TO_MILLIJ = 133.322 * 1e-3;

export function measureMainWireFiveWallMechanicalEnergyLedgerV1(
  input: MainWireFiveWallMechanicalEnergyLedgerInputV1,
): MainWireFiveWallMechanicalEnergyLedgerV1 {
  validateInput(input);
  const samples = input.acceptedStepSamples;
  const precedingSample = input.precedingAcceptedStepSample ?? null;
  const firstPairedIndex = precedingSample ? 0 : 1;
  const perWallMutable = wallRecord(() => mutableWallLedger()) as Readonly<
    Record<MainWireFiveWallMechanicalEnergyWallIdV1, MutableWallLedger>
  >;
  const phaseByAcceptedStep = input.leftAtrialPhaseByAcceptedStep ?? null;
  const leftAtrialByPhase =
    phaseByAcceptedStep === null
      ? null
      : {
          reservoir: mutableStressWork(),
          conduit: mutableStressWork(),
          pumping: mutableStressWork(),
        };
  const cavityWork: Record<
    MainWireFiveWallMechanicalEnergyChamberIdV1,
    number
  > = {
    LA: 0,
    LV: 0,
    RA: 0,
    RV: 0,
  };
  let pericardialPressureWorkMilliJ = 0;

  for (let index = firstPairedIndex; index < samples.length; index += 1) {
    const next = samples[index]!;
    const previous = index === 0 ? precedingSample! : samples[index - 1]!;
    for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
      const factor = input.wallMaterialVolumeMlByWall[wallId] * 1e-3;
      const deltaStrain =
        next.wallFiberLogStrain[wallId] - previous.wallFiberLogStrain[wallId];
      const stress = next.wallStressPa[wallId];
      const target = perWallMutable[wallId];
      target.stress.total += stress.total * deltaStrain * factor;
      target.stress.landActive += stress.landActive * deltaStrain * factor;
      target.stress.equilibriumPassive +=
        stress.equilibriumPassive * deltaStrain * factor;
      target.stress.parallelSls += stress.parallelSls * deltaStrain * factor;
      const energy = next.wallEnergyLedgerDensity[wallId];
      target.equilibriumPassiveStoredChange +=
        (energy.equilibriumPassiveStoredEnergyDensityJPerM3 -
          previous.wallEnergyLedgerDensity[wallId]
            .equilibriumPassiveStoredEnergyDensityJPerM3) *
        factor;
      target.parallelSlsStoredChange +=
        (energy.slsNextStoredEnergyDensityJPerM3 -
          energy.slsPreviousStoredEnergyDensityJPerM3) *
        factor;
      target.parallelSlsPhysical +=
        energy.slsPhysicalDissipationIncrementDensityJPerM3 * factor;
      target.parallelSlsNumerical +=
        energy.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3 *
        factor;
      target.parallelSlsReportedResidual +=
        energy.slsDiscreteEnergyBalanceResidualJPerM3 * factor;
    }

    if (leftAtrialByPhase !== null && phaseByAcceptedStep !== null) {
      const phase = phaseByAcceptedStep[index]!;
      const factor = input.wallMaterialVolumeMlByWall.LA * 1e-3;
      const deltaStrain =
        next.wallFiberLogStrain.LA - previous.wallFiberLogStrain.LA;
      for (const component of [
        "total",
        "landActive",
        "equilibriumPassive",
        "parallelSls",
      ] as const) {
        leftAtrialByPhase[phase][component] +=
          next.wallStressPa.LA[component] * deltaStrain * factor;
      }
    }

    for (const chamber of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1) {
      cavityWork[chamber] +=
        next.chamberTransmuralPressureMmHg[chamber] *
        (next.nodeVolumeMl[chamber] - previous.nodeVolumeMl[chamber]) *
        MMHG_ML_TO_MILLIJ;
    }
    const totalChamberVolumeChangeMl =
      next.nodeVolumeMl.LA -
      previous.nodeVolumeMl.LA +
      (next.nodeVolumeMl.LV - previous.nodeVolumeMl.LV) +
      (next.nodeVolumeMl.RA - previous.nodeVolumeMl.RA) +
      (next.nodeVolumeMl.RV - previous.nodeVolumeMl.RV);
    pericardialPressureWorkMilliJ +=
      next.commonPericardium.excessPressureMmHg *
      totalChamberVolumeChangeMl *
      MMHG_ML_TO_MILLIJ;
  }

  const perWall = wallRecord((wallId) =>
    freezeWallLedger(perWallMutable[wallId]),
  );
  const ventricularWallWork =
    perWall.LVFW.stressWorkOnWallMilliJ.total +
    perWall.SEP.stressWorkOnWallMilliJ.total +
    perWall.RVFW.stressWorkOnWallMilliJ.total;
  const ventricularCavityWork = cavityWork.LV + cavityWork.RV;
  const totalWallWork =
    MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.reduce(
      (sum, wallId) => sum + perWall[wallId].stressWorkOnWallMilliJ.total,
      0,
    );
  const totalCavityWork =
    cavityWork.LA + cavityWork.LV + cavityWork.RA + cavityWork.RV;
  const initialSample = precedingSample ?? samples[0]!;
  const finalSample = samples.at(-1)!;
  const pericardialStoredEnergyChangeMilliJ =
    finalSample.commonPericardium.storedEnergyMilliJ -
    initialSample.commonPericardium.storedEnergyMilliJ;
  const pairedAcceptedStepCount = samples.length - firstPairedIndex;

  return Object.freeze({
    ledgerId: MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_LEDGER_V1_ID,
    acceptedStepSampleCount: samples.length,
    pairedAcceptedStepCount,
    stressWorkCoverageFraction: pairedAcceptedStepCount / samples.length,
    perWall,
    leftAtrialStressWorkOnWallByPhaseMilliJ:
      freezeOptionalPhaseLedger(leftAtrialByPhase),
    cavityWorkOnWallMilliJ: Object.freeze({ ...cavityWork }),
    commonPericardium: Object.freeze({
      pressureWorkOnBagMilliJ: pericardialPressureWorkMilliJ,
      storedEnergyChangeMilliJ: pericardialStoredEnergyChangeMilliJ,
      backwardEulerRemainderMilliJ:
        pericardialPressureWorkMilliJ - pericardialStoredEnergyChangeMilliJ,
    }),
    workConjugacyResidualMilliJ: Object.freeze({
      leftAtrium: perWall.LA.stressWorkOnWallMilliJ.total - cavityWork.LA,
      rightAtrium: perWall.RA.stressWorkOnWallMilliJ.total - cavityWork.RA,
      ventricularWallsCombined: ventricularWallWork - ventricularCavityWork,
      allFiveWalls: totalWallWork - totalCavityWork,
    }),
    claim: MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_LEDGER_CLAIM_V1,
  });
}

type MutableStressWork = {
  total: number;
  landActive: number;
  equilibriumPassive: number;
  parallelSls: number;
};

type MutableWallLedger = {
  stress: MutableStressWork;
  equilibriumPassiveStoredChange: number;
  parallelSlsStoredChange: number;
  parallelSlsPhysical: number;
  parallelSlsNumerical: number;
  parallelSlsReportedResidual: number;
};

function mutableStressWork(): MutableStressWork {
  return {
    total: 0,
    landActive: 0,
    equilibriumPassive: 0,
    parallelSls: 0,
  };
}

function mutableWallLedger(): MutableWallLedger {
  return {
    stress: mutableStressWork(),
    equilibriumPassiveStoredChange: 0,
    parallelSlsStoredChange: 0,
    parallelSlsPhysical: 0,
    parallelSlsNumerical: 0,
    parallelSlsReportedResidual: 0,
  };
}

function freezeWallLedger(
  value: MutableWallLedger,
): MainWireFiveWallMechanicalEnergyWallLedgerV1 {
  const stress = Object.freeze({ ...value.stress });
  const reconstructed =
    stress.parallelSls -
    value.parallelSlsStoredChange -
    value.parallelSlsPhysical -
    value.parallelSlsNumerical;
  return Object.freeze({
    stressWorkOnWallMilliJ: stress,
    stressAssemblyResidualMilliJ:
      stress.total -
      stress.landActive -
      stress.equilibriumPassive -
      stress.parallelSls,
    equilibriumPassiveStoredEnergyChangeMilliJ:
      value.equilibriumPassiveStoredChange,
    equilibriumPassiveBackwardEulerRemainderMilliJ:
      stress.equilibriumPassive - value.equilibriumPassiveStoredChange,
    parallelSls: Object.freeze({
      storedEnergyChangeMilliJ: value.parallelSlsStoredChange,
      physicalDissipationMilliJ: value.parallelSlsPhysical,
      backwardEulerNumericalDissipationMilliJ: value.parallelSlsNumerical,
      reportedDiscreteBalanceResidualMilliJ: value.parallelSlsReportedResidual,
      reconstructedDiscreteBalanceResidualMilliJ: reconstructed,
      readbackAgreementResidualMilliJ:
        reconstructed - value.parallelSlsReportedResidual,
    }),
  });
}

function freezeOptionalPhaseLedger(
  value: Readonly<
    Record<MainWireFiveWallMechanicalEnergyPhaseV1, MutableStressWork>
  > | null,
): MainWireFiveWallMechanicalEnergyLedgerV1["leftAtrialStressWorkOnWallByPhaseMilliJ"] {
  if (value === null) return null;
  return Object.freeze({
    reservoir: Object.freeze({ ...value.reservoir }),
    conduit: Object.freeze({ ...value.conduit }),
    pumping: Object.freeze({ ...value.pumping }),
  });
}

function wallRecord<T>(
  build: (wallId: MainWireFiveWallMechanicalEnergyWallIdV1) => T,
): MainWireFiveWallMechanicalEnergyWallRecordV1<T> {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.map((wallId) => [
        wallId,
        build(wallId),
      ]),
    ),
  ) as MainWireFiveWallMechanicalEnergyWallRecordV1<T>;
}

function validateInput(
  input: MainWireFiveWallMechanicalEnergyLedgerInputV1,
): void {
  if (input.acceptedStepSamples.length === 0) {
    throw new Error(
      "mechanical-energy ledger requires an accepted-step sample",
    );
  }
  const phaseByAcceptedStep = input.leftAtrialPhaseByAcceptedStep ?? null;
  if (
    phaseByAcceptedStep !== null &&
    phaseByAcceptedStep.length !== input.acceptedStepSamples.length
  ) {
    throw new Error(
      "left-atrial phase ownership must cover every accepted-step sample",
    );
  }
  if (phaseByAcceptedStep !== null) {
    for (const phase of phaseByAcceptedStep) {
      if (phase !== "reservoir" && phase !== "conduit" && phase !== "pumping") {
        throw new Error(`unsupported left-atrial phase: ${String(phase)}`);
      }
    }
  }
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
    const volume = input.wallMaterialVolumeMlByWall[wallId];
    if (!(volume > 0) || !Number.isFinite(volume)) {
      throw new Error(
        `${wallId} wall material volume must be positive and finite`,
      );
    }
  }
  if (input.precedingAcceptedStepSample) {
    validateSample(
      input.precedingAcceptedStepSample,
      "preceding accepted step",
    );
  }
  input.acceptedStepSamples.forEach((sample, index) =>
    validateSample(sample, `accepted step ${index}`),
  );
}

function validateSample(
  sample: MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1,
  label: string,
): void {
  for (const chamber of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1) {
    assertFinite(sample.nodeVolumeMl[chamber], `${label} ${chamber} volume`);
    assertFinite(
      sample.chamberTransmuralPressureMmHg[chamber],
      `${label} ${chamber} transmural pressure`,
    );
  }
  assertFinite(
    sample.commonPericardium.excessPressureMmHg,
    `${label} pericardial excess pressure`,
  );
  assertFinite(
    sample.commonPericardium.storedEnergyMilliJ,
    `${label} pericardial stored energy`,
  );
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
    assertFinite(
      sample.wallFiberLogStrain[wallId],
      `${label} ${wallId} fiber strain`,
    );
    const stress = sample.wallStressPa[wallId];
    assertFinite(stress.total, `${label} ${wallId} total stress`);
    assertFinite(stress.landActive, `${label} ${wallId} Land active stress`);
    assertFinite(
      stress.equilibriumPassive,
      `${label} ${wallId} equilibrium-passive stress`,
    );
    assertFinite(stress.parallelSls, `${label} ${wallId} parallel-SLS stress`);
    const energy = sample.wallEnergyLedgerDensity[wallId];
    assertFinite(
      energy.equilibriumPassiveStoredEnergyDensityJPerM3,
      `${label} ${wallId} equilibrium-passive stored-energy density`,
    );
    assertFinite(
      energy.slsPreviousStoredEnergyDensityJPerM3,
      `${label} ${wallId} previous SLS stored-energy density`,
    );
    assertFinite(
      energy.slsNextStoredEnergyDensityJPerM3,
      `${label} ${wallId} next SLS stored-energy density`,
    );
    assertFinite(
      energy.slsPhysicalDissipationIncrementDensityJPerM3,
      `${label} ${wallId} SLS physical-dissipation density`,
    );
    assertFinite(
      energy.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3,
      `${label} ${wallId} SLS BE-dissipation density`,
    );
    assertFinite(
      energy.slsDiscreteEnergyBalanceResidualJPerM3,
      `${label} ${wallId} SLS balance-residual density`,
    );
  }
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}
