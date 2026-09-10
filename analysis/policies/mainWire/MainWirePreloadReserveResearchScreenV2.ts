import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1 as base,
  type MainWireIntegratedModelFormalPreloadReserveDirectionalResponseV1 as Response,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 as standard } from "./MainWireStandard70PreloadReservePolicyV1";

export const MAIN_WIRE_PRELOAD_RESERVE_RESEARCH_SCREEN_V2_ID = "main-wire-preload-reserve-research-screen-v2" as const;

const finiteFields = ["baselineFillingPressureMmHg", "endpointFillingPressureMmHg", "directionalFillingPressureChangeMmHg",
  "baselineCardiacOutputLPerMin", "endpointCardiacOutputLPerMin", "directionalCardiacOutputChangeLPerMin",
  "directionalCardiacOutputChangeFraction01", "cardiacOutputSlopeLPerMinPerMmHg",
  "baselineEndDiastolicVolumeMl", "endpointEndDiastolicVolumeMl", "directionalEndDiastolicVolumeChangeMl",
  "directionalEndDiastolicVolumeChangeFraction01", "baselineEndDiastolicTransmuralPressureMmHg",
  "endpointEndDiastolicTransmuralPressureMmHg", "directionalEndDiastolicTransmuralPressureChangeMmHg",
  "endDiastolicVolumeResponseMlPerMmHg"] as const satisfies readonly (keyof Response)[];

/** Prospective research SCREEN only. A TBV-controlled excitation is not a
 * pressure-controlled experiment: require pressure direction, not a universal
 * 1 mmHg amplitude. Remaining response floors are historical engineering
 * margins, not clinical normality. Settlement and same-construction paired-step
 * evidence must be reviewed separately; this function cannot admit a baseline.
 * Method caution: Kumar 2004, doi:10.1097/01.CCM.0000114996.68110.C9
 * (healthy saline-loading study, not evidence for our fixed-tone TBV cutoffs). */
export function screenMainWirePreloadReserveResponseV2(response: Response) {
  const unresolved = finiteFields.filter(key => !Number.isFinite(response[key]));
  const sign = response.endpointDirection === "hypovolemic" ? -1 : 1;
  const dp = sign * (response.endpointFillingPressureMmHg - response.baselineFillingPressureMmHg);
  const dq = sign * (response.endpointCardiacOutputLPerMin - response.baselineCardiacOutputLPerMin);
  const dv = sign * (response.endpointEndDiastolicVolumeMl - response.baselineEndDiastolicVolumeMl);
  const dtm = sign * (response.endpointEndDiastolicTransmuralPressureMmHg - response.baselineEndDiastolicTransmuralPressureMmHg);
  const derived = { directionalFillingPressureChangeMmHg: dp, directionalCardiacOutputChangeLPerMin: dq,
    directionalCardiacOutputChangeFraction01: dq / response.baselineCardiacOutputLPerMin,
    cardiacOutputSlopeLPerMinPerMmHg: dq / dp,
    directionalEndDiastolicVolumeChangeMl: dv,
    directionalEndDiastolicVolumeChangeFraction01: dv / response.baselineEndDiastolicVolumeMl,
    directionalEndDiastolicTransmuralPressureChangeMmHg: dtm, endDiastolicVolumeResponseMlPerMmHg: dv / dtm };
  // Serialized redundant fields must agree with the endpoints. This is an
  // arithmetic tolerance, not a physiological or measurement-noise threshold.
  const inconsistentFields = (Object.keys(derived) as (keyof typeof derived)[]).filter(key => {
    const expected = derived[key], supplied = response[key];
    return !Number.isFinite(expected) || Math.sign(expected) !== Math.sign(supplied)
      || Math.abs(expected - supplied) > 64 * Number.EPSILON * Math.max(1, Math.abs(expected), Math.abs(supplied));
  });
  // Screen the endpoint-derived signs/ratios even if redundant data differ only
  // within floating-point tolerance. Tiny contradictory signs never become a pass.
  response = { ...response, ...derived };
  const invalidDomain = !["hypovolemic", "hypervolemic"].includes(response.endpointDirection)
    || !(response.baselineCardiacOutputLPerMin > 0 && response.endpointCardiacOutputLPerMin > 0
      && response.baselineEndDiastolicVolumeMl > 0 && response.endpointEndDiastolicVolumeMl > 0);
  const invalid = unresolved.length > 0 || inconsistentFields.length > 0 || invalidDomain;
  const failed = invalid ? [] : [
    ["filling-pressure-positive-direction", response.directionalFillingPressureChangeMmHg > 0],
    ["cardiac-output-absolute-response", response.directionalCardiacOutputChangeLPerMin >= base.minimumDirectionalCardiacOutputChangeLPerMin],
    ["cardiac-output-fractional-response", response.directionalCardiacOutputChangeFraction01 >= standard.minimumDirectionalCardiacOutputChangeFraction01],
    ["cardiac-output-pressure-secant", response.cardiacOutputSlopeLPerMinPerMmHg >= standard.minimumCardiacOutputSlopeLPerMinPerMmHg],
    ["edv-absolute-response", response.directionalEndDiastolicVolumeChangeMl >= base.minimumDirectionalEndDiastolicVolumeChangeMl],
    ["edv-fractional-response", response.directionalEndDiastolicVolumeChangeFraction01 >= standard.minimumDirectionalEndDiastolicVolumeChangeFraction01],
    ["ed-transmural-pressure-response", response.directionalEndDiastolicTransmuralPressureChangeMmHg >= base.minimumDirectionalEndDiastolicTransmuralPressureChangeMmHg],
    ["edv-transmural-pressure-positive-secant", response.endDiastolicVolumeResponseMlPerMmHg > 0],
  ].filter(([, passed]) => !passed).map(([name]) => name as string);
  return Object.freeze({ policyId: MAIN_WIRE_PRELOAD_RESERVE_RESEARCH_SCREEN_V2_ID,
    status: invalid ? "unresolved" as const
      : failed.length ? "response-not-supported" as const : "directional-screen-passed" as const,
    invalidDomain, nonfiniteFields: unresolved, inconsistentFields, failedCriteria: failed,
    historicalPressureAmplitude: { minimumMmHg: base.minimumDirectionalFillingPressureChangeMmHg,
      observedMmHg: Number.isFinite(response.directionalFillingPressureChangeMmHg) ? response.directionalFillingPressureChangeMmHg : null,
      passed: Number.isFinite(response.directionalFillingPressureChangeMmHg)
        && response.directionalFillingPressureChangeMmHg >= base.minimumDirectionalFillingPressureChangeMmHg },
    pressureCoordinateResolved: false as const, numericalQualificationEstablished: false as const,
    baselineAdmissionEstablished: false as const, physiologicalNormalityClaimed: false as const,
    requiredBeforeAdmission: "Separate settled-endpoint and same-construction coarse/fine review; inspect endpoint pressures, not only cancelling contrasts. Finite or large secant slope does not prove pressure-coordinate resolvability.",
  });
}
