import { describe, expect, it } from "vitest";
import reviewed from "@/data/model-baselines/standard72-reviewed-eligibility-v1.json";
import evidence from "@/data/physiology/main-wire-prospective-reference-evidence-v1.json";
import checkpoint from "@/studio/integrations/mainWireIntegratedV3/standard72-settled-baseline-checkpoint.json";
import { MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 as policy, assessMainWireProspectiveRestV1 as assess } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { mainWireBaselineGateRoleV1 as role } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineGateRolesV1";
import type { MainWireIntegratedModelStandard70BaselineCheckV1 as Check } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";

const beat = () => structuredClone(checkpoint.baseStandardCheckpointV2.completedBeatMetrics) as unknown as Beat;
const checks = () => evidence.checkGroups.flatMap(group => group.checkIds).map(checkId => ({ checkId,
  actual: checkId.endsWith("minimum-dpdt") ? -.5 : .5, minimum: -1, maximum: 1, status: "passed", unit: "synthetic" })) as Check[];

describe("reviewed current resting policy", () => {
  it("retains the already reviewed policy verbatim and its warning roles", () => {
    expect(policy).toEqual(reviewed.policy);
    expect(evidence.evaluationPolicyId).toBe("main-wire-standard70-baseline-evaluation-roles-v3");
    expect(role("waveform.LVP.rounded-not-plateau")).toBe("reference-warning");
    expect(role("timing.ict")).toBe("reference-warning");
    expect(role("waveform.LVP.single-peak-no-ringing")).toBe("construction-guard");
  });

  it("passes the reviewed beat with warning context without old all-pass requirements", () => {
    const synthetic = checks();
    const warning = synthetic.find(c => c.checkId === "timing.ict")!;
    Object.assign(warning, { actual: 2, status: "failed" });
    expect(assess(beat(), synthetic, 1.9)).toMatchObject({ status: "passed", historicalWarnings: [warning] });
    Object.assign(warning, { actual: NaN });
    expect(assess(beat(), synthetic, 1.9).status).toBe("failed");
  });

  it("retains construction holds and requires complete observations", () => {
    const synthetic = checks();
    Object.assign(synthetic.find(c => c.checkId === "waveform.PAP.post-PV-closure-rebound")!, { status: "failed", actual: 2 });
    expect(assess(beat(), synthetic, 1.9).status).toBe("failed");
    expect(() => assess(beat(), synthetic.slice(1), 1.9)).toThrow(/coverage/);
  });

  it("keeps strict operating and demographic comparisons independent of the selected output", () => {
    const value = structuredClone(beat());
    Object.assign(value.leftVentricularValveEventMetrics.endDiastolic!, { absolutePressureMmHg: 16.000001 });
    expect(assess(value, checks(), 1.9).status).toBe("failed");
    Object.assign(value.leftVentricularValveEventMetrics.endDiastolic!, { absolutePressureMmHg: 16 });
    expect(assess(value, checks(), 1.9).status).toBe("passed");
    Object.assign(value.leftVentricularValveEventMetrics.endSystolic!, { volumeMl: 70.3 });
    expect(assess(value, checks(), 1.9).status).toBe("demographic-review-required");
  });
});
