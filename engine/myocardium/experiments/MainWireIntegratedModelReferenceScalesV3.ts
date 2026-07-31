import type {
  RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
  type MainWireFiveWallCoronaryPeriodicReferenceScalesV3,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV3";

/**
 * Fixed dimensional normalizers for the current integrated V3 comparator.
 * They are numerical scales, not fitting targets or physiological ranges.
 */
export type MainWireIntegratedModelPeriodicReferenceScalesV3 =
  MainWireFiveWallCoronaryPeriodicReferenceScalesV3 & Readonly<{
    dynamicMcsAcceptedFlowMlPerSecByDevice: Readonly<Record<
      RotarySupportDeviceIdV1,
      number
    >>;
    generatedCalciumRiseDrive: number;
    generatedCalciumDecayDrive: number;
    generatedAvRelativeTimingSec: number;
    generatedNextSourceRelativeTimingSec: number;
    generatedPendingRelativeTimingSec: number;
    generatedPendingActivationStrength01: number;
  }>;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 =
  Object.freeze({
    ...MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
    scaleSetId:
      "fixed-dimensional-reference-scales-integrated-composed-rhythm-v3" as const,
    dynamicMcsAcceptedFlowMlPerSecByDevice: Object.freeze({
      LVAD: 100,
      IMPELLA: 50,
      VA_ECMO: 100,
      VV_ECMO: 100,
    }),
    generatedCalciumRiseDrive: 1,
    generatedCalciumDecayDrive: 1,
    generatedAvRelativeTimingSec: 1,
    generatedNextSourceRelativeTimingSec: 1,
    generatedPendingRelativeTimingSec: 1,
    generatedPendingActivationStrength01: 1,
  }) satisfies MainWireIntegratedModelPeriodicReferenceScalesV3;
