import type {
  MainWireFiveWallNonCoronaryStepSuccessV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  sampleMainWireNormalAdultFiveWallStepV1,
  type MainWireNormalAdultFiveWallClosedLoopSampleV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type {
  MainWireFiveWallLandTriSegReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type {
  MainWireNormalAdultWallEnergyLedgerV1,
  MainWireNormalAdultWallMaterialReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  WholeHeartMechanicsSerializableValueV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import type {
  MainWireQuasiSteadyOrificeValveDirectionV2,
} from "@/engine/mechanics2/valve/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_ID =
  "main-wire-normal-adult-five-wall-diagnostic-sample-v2" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_CLAIM =
  Object.freeze({
    baseSampleSchema: "unchanged-V1" as const,
    acceptedStepReadbackOnly: true as const,
    emitsAuthoritativeCommonIntrathoracicPressure: true as const,
    addsDynamicState: false as const,
    changesFixedV1RunnerJson: false as const,
  });

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_WALL_IDS_V2 =
  Object.freeze(["LA", "LVFW", "SEP", "RVFW", "RA"] as const);
export type MainWireNormalAdultFiveWallDiagnosticWallIdV2 =
  (typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_WALL_IDS_V2)[number];

export type MainWireNormalAdultFiveWallDiagnosticSampleV2 =
  MainWireNormalAdultFiveWallClosedLoopSampleV1 & Readonly<{
    diagnosticSampleId:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_ID;
    /** Authoritative accepted-step respiratory Pth used by the transaction. */
    commonIntrathoracicPressureMmHg: number;
    /** Accepted-step material strain; diagnostic readback, never a new state. */
    wallFiberLogStrain: Readonly<Record<
      MainWireNormalAdultFiveWallDiagnosticWallIdV2,
      number
    >>;
    /** Constitutive energy ledger copied from the accepted wall trial. */
    wallEnergyLedgerDensity: Readonly<Record<
      MainWireNormalAdultFiveWallDiagnosticWallIdV2,
      MainWireNormalAdultWallEnergyLedgerV1
    >>;
    /** Accepted mechanics solve audit; copied readback, never solver feedback. */
    acceptedMechanicsJacobianAudit: Readonly<{
      derivativeSource: "analytic-triseg-hessian";
      antisymmetricMaximumAbsoluteByOneJ: number;
      antisymmetricRelative: number;
      symmetricWithinTolerance: boolean;
      symmetricMinimumEigenvalueByOneJ: number;
      strictLocalStableEquilibrium: boolean;
    }>;
    /** Algebraic valve hydraulics at the accepted candidate, not valve memory. */
    valveHydraulics: Readonly<Record<
      "MV" | "AoV" | "TV" | "PV",
      Readonly<{
        /** Compatibility alias for the direction-selected active EOA. */
        physicalAreaCm2: number;
        forwardActiveEoaCm2: number;
        closedReverseEroaCm2: number;
        activeEoaCm2: number;
        pressureGradientMmHg: number;
        flowMlPerSec: number;
        activeDirection: MainWireQuasiSteadyOrificeValveDirectionV2;
        openingTarget01: number;
        openingEquationResidual01: number;
        resistanceMmHgSecPerMl: number;
        bernoulliMmHgSec2PerMl2: number;
        competentReverseClosureActive: boolean;
        subthresholdForwardSupportActive: boolean;
        competentReverseClosureReactionMmHg: number;
        subthresholdForwardSupportReactionMmHg: number;
        /** Compatibility alias for V2 dissipativePowerMmHgMlPerSec. */
        dissipativePowerProxyMmHgMlPerSec: number;
        powerBalanceResidualMmHgMlPerSec: number;
      }>
    >>;
  }>;

/**
 * Enriches the byte-stable V1 sample without changing its fixed runner schema.
 */
export function sampleMainWireNormalAdultFiveWallDiagnosticStepV2(
  step: MainWireFiveWallNonCoronaryStepSuccessV1<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >,
): MainWireNormalAdultFiveWallDiagnosticSampleV2 {
  const base = sampleMainWireNormalAdultFiveWallStepV1(step);
  const mechanics = providerReadback(step.mechanicsTrial.diagnostics.readback);
  const wallReadbackByWall = wallRecord((wallId) =>
    wallReadback(mechanics.wallMaterialReadbackByWall[wallId]));
  const circulation = step.circulationTrial;
  return Object.freeze({
    ...base,
    diagnosticSampleId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_ID,
    commonIntrathoracicPressureMmHg:
      step.commonIntrathoracicPressureMmHg,
    wallFiberLogStrain: Object.freeze({
      ...mechanics.effectiveFiberLogStrainByWall,
    }),
    wallEnergyLedgerDensity: wallRecord((wallId) =>
      Object.freeze({ ...wallReadbackByWall[wallId].energyLedger })),
    acceptedMechanicsJacobianAudit: Object.freeze({
      derivativeSource: mechanics.jacobianDerivativeSource,
      antisymmetricMaximumAbsoluteByOneJ:
        mechanics.jacobianAntisymmetricMaximumAbsoluteByOneJ,
      antisymmetricRelative: mechanics.jacobianAntisymmetricRelative,
      symmetricWithinTolerance: mechanics.jacobianSymmetricWithinTolerance,
      symmetricMinimumEigenvalueByOneJ:
        mechanics.symmetricJacobianMinimumEigenvalueByOneJ,
      strictLocalStableEquilibrium: mechanics.strictLocalStableEquilibrium,
    }),
    valveHydraulics: Object.freeze(Object.fromEntries(
      (["MV", "AoV", "TV", "PV"] as const).map((valveId) => {
        const valve = circulation.valveEvaluations[valveId];
        return [valveId, Object.freeze({
          physicalAreaCm2: valve.activeEoaCm2,
          forwardActiveEoaCm2: valve.forwardActiveEoaCm2,
          closedReverseEroaCm2: valve.reverseActiveEoaCm2,
          activeEoaCm2: valve.activeEoaCm2,
          pressureGradientMmHg: valve.pressureGradientMmHg,
          flowMlPerSec: valve.flowMlPerSec,
          activeDirection: valve.activeDirection,
          openingTarget01: valve.openingTarget01,
          openingEquationResidual01: valve.openingEquationResidual01,
          resistanceMmHgSecPerMl: valve.resistanceMmHgSecPerMl,
          bernoulliMmHgSec2PerMl2: valve.bernoulliMmHgSec2PerMl2,
          competentReverseClosureActive:
            valve.competentReverseClosureActive,
          subthresholdForwardSupportActive:
            valve.subthresholdForwardSupportActive,
          competentReverseClosureReactionMmHg:
            valve.competentReverseClosureReactionMmHg,
          subthresholdForwardSupportReactionMmHg:
            valve.subthresholdForwardSupportReactionMmHg,
          dissipativePowerProxyMmHgMlPerSec:
            valve.dissipativePowerMmHgMlPerSec,
          powerBalanceResidualMmHgMlPerSec:
            valve.powerBalanceResidualMmHgMlPerSec,
        })];
      }),
    )) as MainWireNormalAdultFiveWallDiagnosticSampleV2["valveHydraulics"],
  });
}

function providerReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireFiveWallLandTriSegReadbackV1 {
  return value as unknown as MainWireFiveWallLandTriSegReadbackV1;
}

function wallReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireNormalAdultWallMaterialReadbackV1 {
  return value as unknown as MainWireNormalAdultWallMaterialReadbackV1;
}

function wallRecord<T>(
  build: (wallId: MainWireNormalAdultFiveWallDiagnosticWallIdV2) => T,
): Readonly<Record<MainWireNormalAdultFiveWallDiagnosticWallIdV2, T>> {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_WALL_IDS_V2.map((wallId) =>
      [wallId, build(wallId)]),
  )) as Readonly<Record<MainWireNormalAdultFiveWallDiagnosticWallIdV2, T>>;
}
