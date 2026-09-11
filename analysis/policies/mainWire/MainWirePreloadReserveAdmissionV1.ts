import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID as protocolId,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1 as base,
  type MainWireIntegratedModelFormalPreloadReserveMeasurementV2 as Measurement,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { validMainWireFixedToneSettlementEvidenceV2 } from "@/analysis/methods/mainWire/MainWireFixedToneSettlementV2";
import { screenMainWirePreloadReserveResponseV2 } from "./MainWirePreloadReserveResearchScreenV2";
import { MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 as standard } from "./MainWireStandard70PreloadReservePolicyV1";

export const MAIN_WIRE_PRELOAD_RESERVE_ADMISSION_V1 = Object.freeze({
  policyId: "main-wire-preload-reserve-admission-v1",
  source: { doi: "10.1097/01.CCM.0000114996.68110.C9", locator: "Kumar 2004, healthy-volunteer saline-loading study; method context only, not our fixed-tone thresholds" },
  rationale: "TBV is the controlled excitation, not atrial pressure. Positive pressure direction replaces the unsupported universal 1 mmHg amplitude. Remaining response floors are inherited engineering non-regression margins, not saline-response normal ranges.",
  numericalRationale: "Require both settled grids to pass and response margins to exceed the observed two-grid sensitivity. Sum individual center and endpoint differences for primitive contrasts, avoiding cancellation. This is a sensitivity screen, not a rigorous error bound or convergence-order proof.",
  regression: "__tests__/mainWireProspectiveBaselineAdmissionV1.test.ts",
});

/** Caller binds the same construction, fixed-tone protocol and dt-halving pair.
 * This re-evaluates observations, never upgrades or rewrites an old report. */
export function qualifyMainWirePreloadReserveAdmissionV1(coarse: Measurement, fine: Measurement) {
  const issues: string[] = [];
  const near = (a: number, b: number) => Number.isFinite(a) && Number.isFinite(b)
    && Math.abs(a - b) <= 64 * Number.EPSILON * Math.max(1, Math.abs(a), Math.abs(b));
  for (const [name, m] of [["coarse", coarse], ["fine", fine]] as const) {
    if (m.protocolId !== protocolId || m.endDiastolicDefinition !== "inlet-valve-closure"
      || !(m.sourceGlobalTbvMl > 0) || !Number.isFinite(m.sourceGlobalTbvMl)
      || m.hypovolemicGlobalTbvScale !== base.hypovolemicGlobalTbvScale
      || m.hypervolemicGlobalTbvScale !== base.hypervolemicGlobalTbvScale
      || !near(m.hypovolemicGlobalTbvMl, m.sourceGlobalTbvMl * m.hypovolemicGlobalTbvScale)
      || !near(m.hypervolemicGlobalTbvMl, m.sourceGlobalTbvMl * m.hypervolemicGlobalTbvScale)) issues.push(`${name}:protocol-or-TBV`);
    for (const phase of ["center", "hypovolemic", "hypervolemic"] as const) {
      if (!validMainWireFixedToneSettlementEvidenceV2(m.settlement?.[phase])) issues.push(`${name}:${phase}:settlement`);
    }
    for (const side of ["left", "right"] as const) {
      for (const field of ["baselineFillingPressureMmHg", "baselineCardiacOutputLPerMin",
        "baselineEndDiastolicVolumeMl", "baselineEndDiastolicTransmuralPressureMmHg"] as const) {
        if (!near(m[side].hypovolemic[field], m[side].hypervolemic[field])) issues.push(`${name}:${side}:center-mismatch:${field}`);
      }
    }
  }
  if (!near(coarse.sourceGlobalTbvMl, fine.sourceGlobalTbvMl)) issues.push("different-source-TBV");
  const responses = (["left", "right"] as const).flatMap(side =>
    (["hypovolemic", "hypervolemic"] as const).map(direction => {
      const a = coarse[side][direction], b = fine[side][direction];
      const sign = direction === "hypovolemic" ? -1 : 1;
      const screens = [screenMainWirePreloadReserveResponseV2(a), screenMainWirePreloadReserveResponseV2(b)];
      const primitives = [
        ["FillingPressureMmHg", "directionalFillingPressureChangeMmHg", 0],
        ["CardiacOutputLPerMin", "directionalCardiacOutputChangeLPerMin", base.minimumDirectionalCardiacOutputChangeLPerMin],
        ["EndDiastolicVolumeMl", "directionalEndDiastolicVolumeChangeMl", base.minimumDirectionalEndDiastolicVolumeChangeMl],
        ["EndDiastolicTransmuralPressureMmHg", "directionalEndDiastolicTransmuralPressureChangeMmHg", base.minimumDirectionalEndDiastolicTransmuralPressureChangeMmHg],
      ] as const;
      const margins = primitives.map(([field, delta, floor]) => {
        const baseline = `baseline${field}` as const, endpoint = `endpoint${field}` as const;
        const sensitivity = Math.abs(a[baseline] - b[baseline]) + Math.abs(a[endpoint] - b[endpoint]);
        const margin = Math.min(sign * (a[endpoint] - a[baseline]), sign * (b[endpoint] - b[baseline])) - floor;
        return { field: delta, floor, margin, sensitivity, passed: Number.isFinite(sensitivity) && sensitivity < margin };
      });
      // Work in primitive units for fractional/ratio floors too. Comparing
      // two already-divided ratios can hide common endpoint changes.
      const ratioMargins: { field: string; floor: number; margin: number; sensitivity: number; passed: boolean }[] = ([
        ["CardiacOutputLPerMin", standard.minimumDirectionalCardiacOutputChangeFraction01],
        ["EndDiastolicVolumeMl", standard.minimumDirectionalEndDiastolicVolumeChangeFraction01],
      ] as const).map(([field, floor]) => {
        const baseline = `baseline${field}` as const, endpoint = `endpoint${field}` as const;
        const residual = (r: typeof a) => sign * (r[endpoint] - r[baseline]) - floor * r[baseline];
        const sensitivity = Math.abs(a[endpoint] - b[endpoint]) + Math.abs(sign + floor) * Math.abs(a[baseline] - b[baseline]);
        const margin = Math.min(residual(a), residual(b));
        return { field: `${field}:fractional-floor-residual`, floor, margin, sensitivity,
          passed: Number.isFinite(sensitivity) && sensitivity < margin };
      });
      const slopeFloor = standard.minimumCardiacOutputSlopeLPerMinPerMmHg;
      const slopeMargin = Math.min(...[a, b].map(r => sign * (r.endpointCardiacOutputLPerMin - r.baselineCardiacOutputLPerMin)
        - slopeFloor * sign * (r.endpointFillingPressureMmHg - r.baselineFillingPressureMmHg)));
      const slopeSensitivity = margins[1]!.sensitivity + slopeFloor * margins[0]!.sensitivity;
      ratioMargins.push({ field: "CO-pressure-secant-residual", floor: slopeFloor, margin: slopeMargin,
        sensitivity: slopeSensitivity, passed: Number.isFinite(slopeSensitivity) && slopeSensitivity < slopeMargin });
      // Positive EDV/Ptm follows from separately resolved positive numerator
      // and denominator; no additional divided-ratio test is needed.
      const endpointDirectionsMatch = a.endpointDirection === direction && b.endpointDirection === direction;
      return { side, direction, endpointDirectionsMatch, screens, margins, ratioMargins,
        passed: endpointDirectionsMatch
          && screens.every(s => s.status === "directional-screen-passed")
          && [...margins, ...ratioMargins].every(m => m.passed) };
    }));
  return { policy: MAIN_WIRE_PRELOAD_RESERVE_ADMISSION_V1, issues, responses,
    status: issues.length ? "unresolved" as const : responses.every(r => r.passed) ? "passed" as const : "failed" as const,
    physiologicalNormalityClaimed: false, fullNumericalConvergenceClaimed: false };
}
