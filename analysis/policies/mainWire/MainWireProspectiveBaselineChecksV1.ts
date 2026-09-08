import { buildMainWireIntegratedModelStandard70BaselineChecksV1,
  type MainWireIntegratedModelStandard70BaselineMeasurementsV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import { mainWireBaselineRangeIncludesWithRoundoffV1 as includes } from "./MainWireProspectiveBaselineGateRolesV1";

/** Reproduce the reviewed assessment's two observation corrections without
 * reinterpreting retained70 reports: roundoff-only range comparison and the
 * actual failed component of the compound pressure-contour observation. */
export function buildMainWireProspectiveBaselineChecksV1(measurements: MainWireIntegratedModelStandard70BaselineMeasurementsV1, settled: boolean) {
  return buildMainWireIntegratedModelStandard70BaselineChecksV1(measurements, settled).map(check => {
    if (check.checkId === "waveform.LVP.rounded-not-plateau" || check.checkId === "waveform.RVP.rounded-not-plateau") {
      const morphology = measurements[check.checkId.includes("LVP") ? "LVP" : "RVP"];
      const policy = MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1.pressureMorphology;
      if (morphology.centralRangeFraction >= policy.minimumCentralRangeFraction
        && morphology.centralRangeFraction <= policy.maximumCentralRangeFraction
        && !(morphology.peakPhase01 >= policy.minimumPeakPhase01 && morphology.peakPhase01 <= policy.maximumPeakPhase01)) {
        return { ...check, status: "failed" as const, actual: morphology.peakPhase01,
          minimum: policy.minimumPeakPhase01, maximum: policy.maximumPeakPhase01, unit: "ejection-peak-phase-fraction" };
      }
      return check;
    }
    if (!check.checkId.startsWith("waveform.") && check.checkId !== "settlement.period1") {
      return { ...check, status: includes(check.actual, check.minimum, check.maximum) ? "passed" as const : "failed" as const };
    }
    return check;
  });
}
