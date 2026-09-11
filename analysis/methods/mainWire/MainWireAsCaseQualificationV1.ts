import { assessMainWireDiseaseCaseQualificationV1 as pair } from "./MainWireHfrefCaseQualificationV1";
export function assessMainWireAsCaseQualificationV1(input: { coarse: unknown; fine: unknown },
  referenceId: "as-high-gradient-valve-only-v1" | "as-low-flow-reduced-ef-v1" = "as-high-gradient-valve-only-v1") {
  return pair(input, { referenceId, anatomyId: referenceId === "as-low-flow-reduced-ef-v1" ? "dilated-lv-v1" : "baseline-v1",
    schemaId: "main-wire-as-paired-checks-v1",
    keys: ["lvef", "rvef", "lvedvi", "lvesvi", "ci", "meanAo", "meanLa", "meanRa", "meanPap",
      "avVmax", "avBernoulliMeanGradient", "avBernoulliPeakGradient", "avEffectiveAreaCm2", "forwardSvi",
      "etMs", "avAccelerationTimeMs", "avAtEt"] });
}
