/**
 * Pure accepted-interval mechanical-port and passive-energy ledger.
 *
 * The numerical owner consumes exact consecutive accepted endpoints. It does
 * not infer valve events, atrial phases, ATP use, active stored energy, PVA, or
 * myocardial oxygen consumption.
 */

import { canonicalJsonStringify } from "@/engine/integrity";

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID =
  "main-wire-five-wall-mechanical-port-ledger-engineering-v1" as const;

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM =
  Object.freeze({
    scientificInterpretation:
      "mechanical-port-passive-storage-and-dissipation-ledger-only" as const,
    source: "exact-consecutive-accepted-interval-readback" as const,
    acceptedEndpointProvenanceVerified: false as const,
    historicalQualificationTransferred: false as const,
    addsDynamicState: false as const,
    wallWorkIntegration: "backward-Euler-right-endpoint" as const,
    pressureConversion:
      "Integrated-V3-model-native-133.322-Pa-per-mmHg" as const,
    cavityWorkIntegrations: Object.freeze([
      "backward-Euler-right-endpoint",
      "accepted-endpoint-trapezoidal",
    ] as const),
    activeStressWorkSign:
      "positive-is-work-on-wall-negative-is-active-mechanical-delivery" as const,
    activeDeliveryAbsorptionSplit:
      "backward-Euler-accepted-interval-sign-split" as const,
    continuousPowerZeroCrossingResolved: false as const,
    instantaneousPowerEstablished: false as const,
    landThermodynamicStoredEnergyClaimed: false as const,
    cavityWorkSign: "positive-is-work-on-wall" as const,
    pericardialWorkSign: "positive-is-work-stored-in-common-bag" as const,
    pericardialWorkExcludedFromTransmuralWallWork: true as const,
    slsAcceptedStateStorageLineage: "exact-endpoint-equality" as const,
    materialBindingCarriesMechanicsProviderIdentity: true as const,
    canonicalEquilibriumPassiveStressSource:
      "derived-as-total-minus-active-minus-SLS" as const,
    stressAssemblyResidualOnCanonicalAdapter:
      "algebraic-input-consistency-only" as const,
    septalCavityAllocation: "combined-ventricular-walls-only" as const,
    valveEventsOwned: false as const,
    pressureVolumeAreaClaimed: false as const,
    myocardialOxygenConsumptionClaimed: false as const,
    atpHydrolysisOrHeatClaimed: false as const,
    officialQualificationEstablished: false as const,
    publicOutputEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
  });

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1 = Object.freeze([
  "LA",
  "LVFW",
  "SEP",
  "RVFW",
  "RA",
] as const);

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1 = Object.freeze(
  ["LA", "LV", "RA", "RV"] as const,
);

export type MainWireFiveWallMechanicalPortWallIdV1 =
  (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1)[number];

export type MainWireFiveWallMechanicalPortChamberIdV1 =
  (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1)[number];

export type MainWireFiveWallMechanicalPortWallRecordV1<T> = Readonly<
  Record<MainWireFiveWallMechanicalPortWallIdV1, T>
>;

export type MainWireFiveWallMechanicalPortChamberRecordV1<T> = Readonly<
  Record<MainWireFiveWallMechanicalPortChamberIdV1, T>
>;

export type MainWireFiveWallMechanicalPortDensityReadbackV1 = Readonly<{
  equilibriumPassiveStoredEnergyDensityJPerM3: number;
  slsPreviousStoredEnergyDensityJPerM3: number;
  slsNextStoredEnergyDensityJPerM3: number;
  slsPhysicalDissipationIncrementDensityJPerM3: number;
  slsBackwardEulerNumericalDissipationIncrementDensityJPerM3: number;
  slsDiscreteEnergyBalanceResidualJPerM3: number;
}>;

export type MainWireFiveWallMechanicalPortStressReadbackV1 = Readonly<{
  total: number;
  landActive: number;
  equilibriumPassive: number;
  parallelSls: number;
}>;

export type MainWireFiveWallMechanicalPortAcceptedEndpointV1 = Readonly<{
  acceptedRevision: number;
  acceptedTimeSec: number;
  nodeVolumeMl: MainWireFiveWallMechanicalPortChamberRecordV1<number>;
  chamberTransmuralPressureMmHg: MainWireFiveWallMechanicalPortChamberRecordV1<number>;
  commonPericardium: Readonly<{
    excessPressureMmHg: number;
    storedEnergyMilliJ: number;
  }>;
  wallStressPa: MainWireFiveWallMechanicalPortWallRecordV1<MainWireFiveWallMechanicalPortStressReadbackV1>;
  wallFiberLogStrain: MainWireFiveWallMechanicalPortWallRecordV1<number>;
  wallEnergyLedgerDensity: MainWireFiveWallMechanicalPortWallRecordV1<MainWireFiveWallMechanicalPortDensityReadbackV1>;
}>;

export type MainWireFiveWallMechanicalPortAcceptedIntervalV1 = Readonly<{
  previous: MainWireFiveWallMechanicalPortAcceptedEndpointV1;
  next: MainWireFiveWallMechanicalPortAcceptedEndpointV1;
}>;

export type MainWireFiveWallMechanicalPortMaterialBindingV1 = Readonly<{
  ownerId: string;
  parameterIdentityHash: string;
  mechanicsProviderIdentity: Readonly<{
    contractId: string;
    providerId: string;
    parameterSetId: string;
    parameterIdentityHash: string;
    stateSchemaVersion: number;
  }>;
  wallMaterialVolumeMlByWall: MainWireFiveWallMechanicalPortWallRecordV1<number>;
}>;

export type MainWireFiveWallMechanicalPortLedgerInputV1 = Readonly<{
  acceptedIntervals: readonly MainWireFiveWallMechanicalPortAcceptedIntervalV1[];
  materialBinding: MainWireFiveWallMechanicalPortMaterialBindingV1;
}>;

export type MainWireFiveWallMechanicalPortStressWorkComponentsV1 = Readonly<{
  total: number;
  landActive: number;
  equilibriumPassive: number;
  parallelSls: number;
}>;

export type MainWireFiveWallMechanicalPortWallLedgerV1 = Readonly<{
  backwardEulerStressWorkOnWallMilliJ: MainWireFiveWallMechanicalPortStressWorkComponentsV1;
  stressAssemblyResidualMilliJ: number;
  activeMechanical: Readonly<{
    workOnWallMilliJ: number;
    deliveryPositiveMilliJ: number;
    absorptionMagnitudeMilliJ: number;
    netDeliveryMilliJ: number;
    deliveryIntervalCount: number;
    absorptionIntervalCount: number;
    zeroIntervalCount: number;
  }>;
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

export type MainWireFiveWallMechanicalPortCavityWorkLedgerV1 = Readonly<{
  backwardEulerWorkOnWallMilliJ: MainWireFiveWallMechanicalPortChamberRecordV1<number>;
  trapezoidalWorkOnWallMilliJ: MainWireFiveWallMechanicalPortChamberRecordV1<number>;
  quadratureDifferenceMilliJ: MainWireFiveWallMechanicalPortChamberRecordV1<number>;
}>;

export type MainWireFiveWallMechanicalPortLedgerV1 = Readonly<{
  ledgerId: typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID;
  materialBinding: MainWireFiveWallMechanicalPortMaterialBindingV1;
  intervalCount: number;
  initialAcceptedRevision: number;
  terminalAcceptedRevision: number;
  initialAcceptedTimeSec: number;
  terminalAcceptedTimeSec: number;
  elapsedTimeSec: number;
  minimumAcceptedDtSec: number;
  maximumAcceptedDtSec: number;
  perWall: MainWireFiveWallMechanicalPortWallRecordV1<MainWireFiveWallMechanicalPortWallLedgerV1>;
  cavityWork: MainWireFiveWallMechanicalPortCavityWorkLedgerV1;
  commonPericardium: Readonly<{
    backwardEulerPressureWorkOnBagMilliJ: number;
    trapezoidalPressureWorkOnBagMilliJ: number;
    quadratureDifferenceMilliJ: number;
    storedEnergyChangeMilliJ: number;
    backwardEulerRemainderMilliJ: number;
    trapezoidalRemainderMilliJ: number;
  }>;
  backwardEulerWorkConjugacyResidualMilliJ: Readonly<{
    leftAtrium: number;
    rightAtrium: number;
    ventricularWallsCombined: number;
    allFiveWalls: number;
  }>;
  claim: typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM;
}>;

const MMHG_ML_TO_MILLIJ = 0.133322;

export function measureMainWireFiveWallMechanicalPortLedgerV1(
  input: MainWireFiveWallMechanicalPortLedgerInputV1,
): MainWireFiveWallMechanicalPortLedgerV1 {
  validateInput(input);

  const perWallMutable = wallRecord(() => mutableWallLedger()) as Readonly<
    Record<MainWireFiveWallMechanicalPortWallIdV1, MutableWallLedger>
  >;
  const cavityBackwardEuler = mutableChamberRecord();
  const cavityTrapezoidal = mutableChamberRecord();
  let pericardialBackwardEuler = 0;
  let pericardialTrapezoidal = 0;
  let minimumDtSec = Number.POSITIVE_INFINITY;
  let maximumDtSec = 0;

  for (const interval of input.acceptedIntervals) {
    const { previous, next } = interval;
    const dtSec = next.acceptedTimeSec - previous.acceptedTimeSec;
    minimumDtSec = Math.min(minimumDtSec, dtSec);
    maximumDtSec = Math.max(maximumDtSec, dtSec);

    for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1) {
      if (
        interval.next.wallEnergyLedgerDensity[wallId]
          .slsPreviousStoredEnergyDensityJPerM3 !==
        interval.previous.wallEnergyLedgerDensity[wallId]
          .slsNextStoredEnergyDensityJPerM3
      ) {
        throw new Error(
          `${wallId} SLS previous storage must equal the accepted prior endpoint`,
        );
      }
    }
    for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1) {
      const materialVolumeFactor =
        input.materialBinding.wallMaterialVolumeMlByWall[wallId] * 1e-3;
      const deltaStrain =
        next.wallFiberLogStrain[wallId] - previous.wallFiberLogStrain[wallId];
      const stress = next.wallStressPa[wallId];
      const target = perWallMutable[wallId];
      const totalWork = stress.total * deltaStrain * materialVolumeFactor;
      const activeWork = stress.landActive * deltaStrain * materialVolumeFactor;
      const passiveWork =
        stress.equilibriumPassive * deltaStrain * materialVolumeFactor;
      const slsWork = stress.parallelSls * deltaStrain * materialVolumeFactor;

      target.stress.total += totalWork;
      target.stress.landActive += activeWork;
      target.stress.equilibriumPassive += passiveWork;
      target.stress.parallelSls += slsWork;
      if (activeWork < 0) {
        target.activeDelivery += -activeWork;
        target.activeDeliveryIntervalCount += 1;
      } else if (activeWork > 0) {
        target.activeAbsorption += activeWork;
        target.activeAbsorptionIntervalCount += 1;
      } else {
        target.activeZeroIntervalCount += 1;
      }

      const energy = next.wallEnergyLedgerDensity[wallId];
      target.equilibriumPassiveStoredChange +=
        (energy.equilibriumPassiveStoredEnergyDensityJPerM3 -
          previous.wallEnergyLedgerDensity[wallId]
            .equilibriumPassiveStoredEnergyDensityJPerM3) *
        materialVolumeFactor;
      target.parallelSlsStoredChange +=
        (energy.slsNextStoredEnergyDensityJPerM3 -
          energy.slsPreviousStoredEnergyDensityJPerM3) *
        materialVolumeFactor;
      target.parallelSlsPhysical +=
        energy.slsPhysicalDissipationIncrementDensityJPerM3 *
        materialVolumeFactor;
      target.parallelSlsNumerical +=
        energy.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3 *
        materialVolumeFactor;
      target.parallelSlsReportedResidual +=
        energy.slsDiscreteEnergyBalanceResidualJPerM3 * materialVolumeFactor;
    }

    for (const chamberId of MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1) {
      const deltaVolumeMl =
        next.nodeVolumeMl[chamberId] - previous.nodeVolumeMl[chamberId];
      cavityBackwardEuler[chamberId] +=
        next.chamberTransmuralPressureMmHg[chamberId] *
        deltaVolumeMl *
        MMHG_ML_TO_MILLIJ;
      cavityTrapezoidal[chamberId] +=
        0.5 *
        (previous.chamberTransmuralPressureMmHg[chamberId] +
          next.chamberTransmuralPressureMmHg[chamberId]) *
        deltaVolumeMl *
        MMHG_ML_TO_MILLIJ;
    }

    const totalChamberVolumeChangeMl =
      next.nodeVolumeMl.LA -
      previous.nodeVolumeMl.LA +
      (next.nodeVolumeMl.LV - previous.nodeVolumeMl.LV) +
      (next.nodeVolumeMl.RA - previous.nodeVolumeMl.RA) +
      (next.nodeVolumeMl.RV - previous.nodeVolumeMl.RV);
    pericardialBackwardEuler +=
      next.commonPericardium.excessPressureMmHg *
      totalChamberVolumeChangeMl *
      MMHG_ML_TO_MILLIJ;
    pericardialTrapezoidal +=
      0.5 *
      (previous.commonPericardium.excessPressureMmHg +
        next.commonPericardium.excessPressureMmHg) *
      totalChamberVolumeChangeMl *
      MMHG_ML_TO_MILLIJ;
  }

  assertAccumulatedFinite(
    perWallMutable,
    cavityBackwardEuler,
    cavityTrapezoidal,
    {
      pericardialBackwardEuler,
      pericardialTrapezoidal,
    },
  );

  const perWall = wallRecord((wallId) =>
    freezeWallLedger(perWallMutable[wallId]),
  );
  const cavityQuadratureDifference = chamberRecord(
    (chamberId) =>
      cavityBackwardEuler[chamberId] - cavityTrapezoidal[chamberId],
  );
  const first = input.acceptedIntervals[0]!.previous;
  const last = input.acceptedIntervals.at(-1)!.next;
  const pericardialStoredEnergyChange =
    last.commonPericardium.storedEnergyMilliJ -
    first.commonPericardium.storedEnergyMilliJ;
  const ventricularWallWork =
    perWall.LVFW.backwardEulerStressWorkOnWallMilliJ.total +
    perWall.SEP.backwardEulerStressWorkOnWallMilliJ.total +
    perWall.RVFW.backwardEulerStressWorkOnWallMilliJ.total;
  const ventricularCavityWork = cavityBackwardEuler.LV + cavityBackwardEuler.RV;
  const allWallWork =
    perWall.LA.backwardEulerStressWorkOnWallMilliJ.total +
    perWall.LVFW.backwardEulerStressWorkOnWallMilliJ.total +
    perWall.SEP.backwardEulerStressWorkOnWallMilliJ.total +
    perWall.RVFW.backwardEulerStressWorkOnWallMilliJ.total +
    perWall.RA.backwardEulerStressWorkOnWallMilliJ.total;
  const allCavityWork =
    cavityBackwardEuler.LA +
    cavityBackwardEuler.LV +
    cavityBackwardEuler.RA +
    cavityBackwardEuler.RV;

  const result = Object.freeze({
    ledgerId: MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID,
    materialBinding: freezeMaterialBinding(input.materialBinding),
    intervalCount: input.acceptedIntervals.length,
    initialAcceptedRevision: first.acceptedRevision,
    terminalAcceptedRevision: last.acceptedRevision,
    initialAcceptedTimeSec: first.acceptedTimeSec,
    terminalAcceptedTimeSec: last.acceptedTimeSec,
    elapsedTimeSec: last.acceptedTimeSec - first.acceptedTimeSec,
    minimumAcceptedDtSec: minimumDtSec,
    maximumAcceptedDtSec: maximumDtSec,
    perWall,
    cavityWork: Object.freeze({
      backwardEulerWorkOnWallMilliJ: Object.freeze({
        ...cavityBackwardEuler,
      }),
      trapezoidalWorkOnWallMilliJ: Object.freeze({
        ...cavityTrapezoidal,
      }),
      quadratureDifferenceMilliJ: cavityQuadratureDifference,
    }),
    commonPericardium: Object.freeze({
      backwardEulerPressureWorkOnBagMilliJ: pericardialBackwardEuler,
      trapezoidalPressureWorkOnBagMilliJ: pericardialTrapezoidal,
      quadratureDifferenceMilliJ:
        pericardialBackwardEuler - pericardialTrapezoidal,
      storedEnergyChangeMilliJ: pericardialStoredEnergyChange,
      backwardEulerRemainderMilliJ:
        pericardialBackwardEuler - pericardialStoredEnergyChange,
      trapezoidalRemainderMilliJ:
        pericardialTrapezoidal - pericardialStoredEnergyChange,
    }),
    backwardEulerWorkConjugacyResidualMilliJ: Object.freeze({
      leftAtrium:
        perWall.LA.backwardEulerStressWorkOnWallMilliJ.total -
        cavityBackwardEuler.LA,
      rightAtrium:
        perWall.RA.backwardEulerStressWorkOnWallMilliJ.total -
        cavityBackwardEuler.RA,
      ventricularWallsCombined: ventricularWallWork - ventricularCavityWork,
      allFiveWalls: allWallWork - allCavityWork,
    }),
    claim: MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_CLAIM,
  });
  assertAllNumericLeavesFinite(result, "mechanical-port ledger output");
  return result;
}

type MutableStressWork = {
  total: number;
  landActive: number;
  equilibriumPassive: number;
  parallelSls: number;
};

type MutableWallLedger = {
  stress: MutableStressWork;
  activeDelivery: number;
  activeAbsorption: number;
  activeDeliveryIntervalCount: number;
  activeAbsorptionIntervalCount: number;
  activeZeroIntervalCount: number;
  equilibriumPassiveStoredChange: number;
  parallelSlsStoredChange: number;
  parallelSlsPhysical: number;
  parallelSlsNumerical: number;
  parallelSlsReportedResidual: number;
};

function mutableWallLedger(): MutableWallLedger {
  return {
    stress: {
      total: 0,
      landActive: 0,
      equilibriumPassive: 0,
      parallelSls: 0,
    },
    activeDelivery: 0,
    activeAbsorption: 0,
    activeDeliveryIntervalCount: 0,
    activeAbsorptionIntervalCount: 0,
    activeZeroIntervalCount: 0,
    equilibriumPassiveStoredChange: 0,
    parallelSlsStoredChange: 0,
    parallelSlsPhysical: 0,
    parallelSlsNumerical: 0,
    parallelSlsReportedResidual: 0,
  };
}

function freezeWallLedger(
  value: MutableWallLedger,
): MainWireFiveWallMechanicalPortWallLedgerV1 {
  const stress = Object.freeze({ ...value.stress });
  const reconstructedSlsResidual =
    stress.parallelSls -
    value.parallelSlsStoredChange -
    value.parallelSlsPhysical -
    value.parallelSlsNumerical;
  return Object.freeze({
    backwardEulerStressWorkOnWallMilliJ: stress,
    stressAssemblyResidualMilliJ:
      stress.total -
      stress.landActive -
      stress.equilibriumPassive -
      stress.parallelSls,
    activeMechanical: Object.freeze({
      workOnWallMilliJ: stress.landActive,
      deliveryPositiveMilliJ: value.activeDelivery,
      absorptionMagnitudeMilliJ: value.activeAbsorption,
      netDeliveryMilliJ: canonicalZero(-stress.landActive),
      deliveryIntervalCount: value.activeDeliveryIntervalCount,
      absorptionIntervalCount: value.activeAbsorptionIntervalCount,
      zeroIntervalCount: value.activeZeroIntervalCount,
    }),
    equilibriumPassiveStoredEnergyChangeMilliJ:
      value.equilibriumPassiveStoredChange,
    equilibriumPassiveBackwardEulerRemainderMilliJ:
      stress.equilibriumPassive - value.equilibriumPassiveStoredChange,
    parallelSls: Object.freeze({
      storedEnergyChangeMilliJ: value.parallelSlsStoredChange,
      physicalDissipationMilliJ: value.parallelSlsPhysical,
      backwardEulerNumericalDissipationMilliJ: value.parallelSlsNumerical,
      reportedDiscreteBalanceResidualMilliJ: value.parallelSlsReportedResidual,
      reconstructedDiscreteBalanceResidualMilliJ: reconstructedSlsResidual,
      readbackAgreementResidualMilliJ:
        reconstructedSlsResidual - value.parallelSlsReportedResidual,
    }),
  });
}

function mutableChamberRecord(): Record<
  MainWireFiveWallMechanicalPortChamberIdV1,
  number
> {
  return { LA: 0, LV: 0, RA: 0, RV: 0 };
}

function wallRecord<T>(
  build: (wallId: MainWireFiveWallMechanicalPortWallIdV1) => T,
): MainWireFiveWallMechanicalPortWallRecordV1<T> {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map((wallId) => [
        wallId,
        build(wallId),
      ]),
    ),
  ) as MainWireFiveWallMechanicalPortWallRecordV1<T>;
}

function chamberRecord<T>(
  build: (chamberId: MainWireFiveWallMechanicalPortChamberIdV1) => T,
): MainWireFiveWallMechanicalPortChamberRecordV1<T> {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1.map((chamberId) => [
        chamberId,
        build(chamberId),
      ]),
    ),
  ) as MainWireFiveWallMechanicalPortChamberRecordV1<T>;
}

function freezeMaterialBinding(
  binding: MainWireFiveWallMechanicalPortMaterialBindingV1,
): MainWireFiveWallMechanicalPortMaterialBindingV1 {
  return Object.freeze({
    ownerId: binding.ownerId,
    parameterIdentityHash: binding.parameterIdentityHash,
    mechanicsProviderIdentity: Object.freeze({
      ...binding.mechanicsProviderIdentity,
    }),
    wallMaterialVolumeMlByWall: Object.freeze({
      ...binding.wallMaterialVolumeMlByWall,
    }),
  });
}

function validateInput(
  input: MainWireFiveWallMechanicalPortLedgerInputV1,
): void {
  if (input.acceptedIntervals.length === 0) {
    throw new Error("mechanical-port ledger requires an accepted interval");
  }
  if (
    input.materialBinding.ownerId.length === 0 ||
    input.materialBinding.parameterIdentityHash.length === 0
  ) {
    throw new Error("mechanical-port material binding must be identified");
  }
  const provider = input.materialBinding.mechanicsProviderIdentity;
  if (
    provider.contractId.length === 0 ||
    provider.providerId.length === 0 ||
    provider.parameterSetId.length === 0 ||
    provider.parameterIdentityHash.length === 0 ||
    !Number.isSafeInteger(provider.stateSchemaVersion) ||
    provider.stateSchemaVersion < 1
  ) {
    throw new Error(
      "mechanical-port material binding must identify the mechanics provider",
    );
  }
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1) {
    const volume = input.materialBinding.wallMaterialVolumeMlByWall[wallId];
    if (!(volume > 0) || !Number.isFinite(volume)) {
      throw new Error(
        wallId + " wall material volume must be positive and finite",
      );
    }
  }

  let priorNext: MainWireFiveWallMechanicalPortAcceptedEndpointV1 | null = null;
  input.acceptedIntervals.forEach((interval, index) => {
    validateEndpoint(interval.previous, "interval " + index + " previous");
    validateEndpoint(interval.next, "interval " + index + " next");
    if (
      interval.next.acceptedRevision !==
      interval.previous.acceptedRevision + 1
    ) {
      throw new Error("accepted interval revisions must be consecutive");
    }
    if (!(interval.next.acceptedTimeSec > interval.previous.acceptedTimeSec)) {
      throw new Error("accepted interval time must increase");
    }
    if (
      priorNext !== null &&
      canonicalJsonStringify(interval.previous) !==
        canonicalJsonStringify(priorNext)
    ) {
      throw new Error("accepted intervals must form one contiguous lineage");
    }
    priorNext = interval.next;
  });
}

function validateEndpoint(
  endpoint: MainWireFiveWallMechanicalPortAcceptedEndpointV1,
  label: string,
): void {
  if (
    !Number.isSafeInteger(endpoint.acceptedRevision) ||
    endpoint.acceptedRevision < 0
  ) {
    throw new Error(label + " revision must be a nonnegative safe integer");
  }
  assertFinite(endpoint.acceptedTimeSec, label + " time");
  if (endpoint.acceptedTimeSec < 0) {
    throw new Error(label + " time must be nonnegative");
  }
  for (const chamberId of MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1) {
    assertFinite(
      endpoint.nodeVolumeMl[chamberId],
      label + " " + chamberId + " volume",
    );
    assertFinite(
      endpoint.chamberTransmuralPressureMmHg[chamberId],
      label + " " + chamberId + " transmural pressure",
    );
  }
  assertFinite(
    endpoint.commonPericardium.excessPressureMmHg,
    label + " pericardial excess pressure",
  );
  assertFinite(
    endpoint.commonPericardium.storedEnergyMilliJ,
    label + " pericardial stored energy",
  );
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1) {
    assertFinite(
      endpoint.wallFiberLogStrain[wallId],
      label + " " + wallId + " fiber strain",
    );
    const stress = endpoint.wallStressPa[wallId];
    assertFinite(stress.total, label + " " + wallId + " total stress");
    assertFinite(
      stress.landActive,
      label + " " + wallId + " Land active stress",
    );
    assertFinite(
      stress.equilibriumPassive,
      label + " " + wallId + " equilibrium-passive stress",
    );
    assertFinite(
      stress.parallelSls,
      label + " " + wallId + " parallel-SLS stress",
    );
    const energy = endpoint.wallEnergyLedgerDensity[wallId];
    for (const [field, value] of Object.entries(energy)) {
      assertFinite(value, label + " " + wallId + " " + field);
    }
  }
}

function assertAccumulatedFinite(
  perWall: Readonly<
    Record<MainWireFiveWallMechanicalPortWallIdV1, MutableWallLedger>
  >,
  cavityBackwardEuler: MainWireFiveWallMechanicalPortChamberRecordV1<number>,
  cavityTrapezoidal: MainWireFiveWallMechanicalPortChamberRecordV1<number>,
  pericardium: Readonly<{
    pericardialBackwardEuler: number;
    pericardialTrapezoidal: number;
  }>,
): void {
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1) {
    const wall = perWall[wallId];
    for (const [field, value] of Object.entries(wall.stress)) {
      assertFinite(value, wallId + " accumulated stress work " + field);
    }
    for (const [field, value] of Object.entries({
      activeDelivery: wall.activeDelivery,
      activeAbsorption: wall.activeAbsorption,
      activeDeliveryIntervalCount: wall.activeDeliveryIntervalCount,
      activeAbsorptionIntervalCount: wall.activeAbsorptionIntervalCount,
      activeZeroIntervalCount: wall.activeZeroIntervalCount,
      equilibriumPassiveStoredChange: wall.equilibriumPassiveStoredChange,
      parallelSlsStoredChange: wall.parallelSlsStoredChange,
      parallelSlsPhysical: wall.parallelSlsPhysical,
      parallelSlsNumerical: wall.parallelSlsNumerical,
      parallelSlsReportedResidual: wall.parallelSlsReportedResidual,
    })) {
      assertFinite(value, wallId + " accumulated ledger " + field);
    }
  }
  for (const chamberId of MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1) {
    assertFinite(
      cavityBackwardEuler[chamberId],
      chamberId + " accumulated BE cavity work",
    );
    assertFinite(
      cavityTrapezoidal[chamberId],
      chamberId + " accumulated trapezoidal cavity work",
    );
  }
  assertFinite(
    pericardium.pericardialBackwardEuler,
    "accumulated BE pericardial work",
  );
  assertFinite(
    pericardium.pericardialTrapezoidal,
    "accumulated trapezoidal pericardial work",
  );
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(label + " must be finite");
  }
}

function assertAllNumericLeavesFinite(value: unknown, label: string): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(label + " must contain only finite numbers");
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => assertAllNumericLeavesFinite(item, label));
    return;
  }
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach((item) =>
      assertAllNumericLeavesFinite(item, label),
    );
  }
}

function canonicalZero(value: number): number {
  return value === 0 ? 0 : value;
}
