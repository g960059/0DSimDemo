import type {
  MainWireFiveWallNonCoronaryStepSuccessV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  sampleMainWireNormalAdultFiveWallDiagnosticStepV2,
  type MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V3_ID =
  "main-wire-normal-adult-five-wall-diagnostic-sample-v3" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V3_CLAIM =
  Object.freeze({
    baseSampleSchema: "V2-preserved-as-projection" as const,
    acceptedStepReadbackOnly: true as const,
    commonPericardiumAddsDynamicState: false as const,
    pericardialFluidCountedAsBloodVolume: false as const,
  });

export type MainWireNormalAdultFiveWallDiagnosticSampleV3 =
  MainWireNormalAdultFiveWallDiagnosticSampleV2 & Readonly<{
    diagnosticSampleV3Id:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V3_ID;
    diagnosticSchemaVersion: 3;
    commonPericardium: Readonly<{
      heartVolumeMl: number;
      prescribedFluidVolumeMl: number;
      occupiedVolumeMl: number;
      storedEnergyMilliJ: number;
      excessPressurePa: number;
      excessPressureMmHg: number;
      pressureDerivativePaPerM3: number;
      smoothingBranch: "off" | "zero" | "transition" | "linear";
      elasticConstraintEngaged: boolean;
    }>;
  }>;

export function sampleMainWireNormalAdultFiveWallDiagnosticStepV3(
  step: MainWireFiveWallNonCoronaryStepSuccessV1<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >,
): MainWireNormalAdultFiveWallDiagnosticSampleV3 {
  const base = sampleMainWireNormalAdultFiveWallDiagnosticStepV2(step);
  const pericardium = step.pericardium;
  return Object.freeze({
    ...base,
    diagnosticSampleV3Id:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V3_ID,
    diagnosticSchemaVersion: 3 as const,
    commonPericardium: Object.freeze({
      heartVolumeMl: pericardium.heartVolumeM3 * 1e6,
      prescribedFluidVolumeMl:
        pericardium.prescribedPericardialFluidVolumeM3 * 1e6,
      occupiedVolumeMl: pericardium.totalOccupiedVolumeM3 * 1e6,
      storedEnergyMilliJ: pericardium.storedEnergyJ * 1e3,
      excessPressurePa: pericardium.excessPressurePa,
      excessPressureMmHg: pericardium.excessPressureMmHg,
      pressureDerivativePaPerM3: pericardium.pressureDerivativePaPerM3,
      smoothingBranch: pericardium.smoothingBranch,
      elasticConstraintEngaged: pericardium.elasticConstraintEngaged,
    }),
  });
}
