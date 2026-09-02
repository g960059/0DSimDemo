import {
  mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1,
  type MainWireIntegratedModelFormalPreloadReserveDirectionalResponseV1,
  type MainWireIntegratedModelFormalPreloadReserveQualificationV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";

export const MAIN_WIRE_STANDARD69_PRELOAD_RESERVE_POLICY_V1_ID =
  "main-wire-standard69-preload-reserve-policy-v1" as const;

/**
 * Standard69 non-regression floors around its fixed-control operating point.
 * These are construction margins, not clinical fluid-challenge thresholds.
 */
export const MAIN_WIRE_STANDARD69_PRELOAD_RESERVE_POLICY_V1 = Object.freeze({
  policyId: MAIN_WIRE_STANDARD69_PRELOAD_RESERVE_POLICY_V1_ID,
  minimumDirectionalCardiacOutputChangeFraction01: 0.03 as const,
  minimumCardiacOutputSlopeLPerMinPerMmHg: 0.02 as const,
  minimumDirectionalEndDiastolicVolumeChangeFraction01: 0.03 as const,
});

export function mainWireStandard69PreloadReserveDirectionalResponsePassedV1(
  response: MainWireIntegratedModelFormalPreloadReserveDirectionalResponseV1,
): boolean {
  const policy = MAIN_WIRE_STANDARD69_PRELOAD_RESERVE_POLICY_V1;
  return mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1(
    response,
  )
    && response.directionalCardiacOutputChangeFraction01
      >= policy.minimumDirectionalCardiacOutputChangeFraction01
    && response.cardiacOutputSlopeLPerMinPerMmHg
      >= policy.minimumCardiacOutputSlopeLPerMinPerMmHg
    && response.directionalEndDiastolicVolumeChangeFraction01
      >= policy.minimumDirectionalEndDiastolicVolumeChangeFraction01;
}

export function assertMainWireStandard69PreloadReservePassedV1(
  qualification: MainWireIntegratedModelFormalPreloadReserveQualificationV1,
): void {
  for (const [ventricle, side] of Object.entries({
    LV: qualification.left,
    RV: qualification.right,
  })) {
    for (const response of [side.hypovolemic, side.hypervolemic]) {
      if (!mainWireStandard69PreloadReserveDirectionalResponsePassedV1(response)) {
        throw new Error(
          `Standard69 ${ventricle} ${response.endpointDirection} preload reserve failed`,
        );
      }
    }
  }
}
