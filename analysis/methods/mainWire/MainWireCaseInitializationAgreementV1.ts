import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { readMainWireStaticCaseFittingResultV1 as read, type MainWireStaticCaseFittingResultV1 as Result } from "./MainWireStaticCaseFittingWorkflowV1";

/** Numerical reproducibility tolerances, not normal physiological ranges.
 * Phase is the existing controller-period boundary, never aligned to a fitted
 * pressure peak. No time warping, smoothing, or checkpoint-byte equality. */
export const MAIN_WIRE_CASE_INITIALIZATION_AGREEMENT_V1 = Object.freeze({
  methodId: "main-wire-same-input-initialization-observable-agreement-v1",
  phaseGrid: "union-of-native-period-phases-with-periodic-boundary" as const, relativeFullScaleTolerance: .01,
  pressureAbsoluteToleranceMmHg: .5, volumeAbsoluteToleranceMl: .5, flowAbsoluteToleranceMlPerSec: 1,
  periodDurationToleranceSec: 1e-8,
  claim: "same-input same-grid periodic observable agreement; not a proof of unique hidden state or physiological validity",
});
type Trace = Result["execution"]["diagnostics"]["terminalTrace"];
export function compareMainWireCasePeriodicTracesV1(warm: Trace, cold: Trace) {
  const p = MAIN_WIRE_CASE_INITIALIZATION_AGREEMENT_V1;
  const own = (samples: Trace) => {
    if (samples.length < 2) throw new Error("Incomplete periodic trace");
    const start = samples[0]!.acceptedTimeSec - samples[0]!.acceptedDtSec, duration = samples.at(-1)!.acceptedTimeSec - start;
    if (!(duration > 0) || samples.some((s, i) => !Number.isFinite(s.acceptedTimeSec) || !(s.acceptedDtSec > 0)
      || i > 0 && Math.abs(s.acceptedTimeSec - samples[i - 1]!.acceptedTimeSec - s.acceptedDtSec) > 1e-8))
      throw new Error("Non-contiguous native periodic trace");
    const phase = samples.map(s => (s.acceptedTimeSec - start) / duration);
    // The terminal endpoint represents phase zero of the verified period-1
    // cycle. Include it explicitly; do not extrapolate across the first step.
    return { samples: [samples.at(-1)!, ...samples], phase: [0, ...phase], duration };
  };
  const a = own(warm), b = own(cold);
  const phases = [...new Set([...a.phase, ...b.phase])].sort((x, y) => x - y);
  const groups = [
    ["absolutePressureMmHg", ["LA", "LV", "RA", "RV", "Ao", "PA", "PVein"], "mmHg", p.pressureAbsoluteToleranceMmHg],
    ["transmuralPressureMmHg", ["LV", "RV"], "mmHg", p.pressureAbsoluteToleranceMmHg],
    ["chamberVolumeMl", ["LA", "LV", "RA", "RV"], "mL", p.volumeAbsoluteToleranceMl],
    ["valveFlowMlPerSec", ["MV", "AoV", "TV", "PV"], "mL/s", p.flowAbsoluteToleranceMlPerSec],
  ] as const;
  const rows = groups.flatMap(([group, keys, unit, absolute]) => keys.map(key => {
    const at = (trace: typeof a, phase: number) => {
      const j = trace.phase.findIndex(x => x >= phase - 1e-12), i = Math.max(0, j - 1);
      if (j < 0) throw new Error("Missing periodic comparison endpoint");
      const value = (n: number) => (trace.samples[n]![group] as Record<string, number>)[key]!;
      const x = value(i), y = value(j), alpha = i === j ? 0 : (phase - trace.phase[i]!) / (trace.phase[j]! - trace.phase[i]!);
      return x + alpha * (y - x);
    };
    const points = phases.map(phase => ({ phase, warm: at(a, phase), cold: at(b, phase) }));
    const fullScale = Math.max(...points.map(x => Math.abs(x.cold)));
    const tolerance = Math.max(absolute, fullScale * p.relativeFullScaleTolerance);
    const maximumAbsoluteDifference = Math.max(...points.map(x => Math.abs(x.warm - x.cold)));
    return { metric: `${group}.${key}`, unit, maximumAbsoluteDifference, tolerance,
      passed: points.every(x => Number.isFinite(x.warm) && Number.isFinite(x.cold)) && maximumAbsoluteDifference <= tolerance };
  }));
  return { rows, phasePointCount: phases.length, period: { warmSec: a.duration, coldSec: b.duration,
    passed: Math.abs(a.duration - b.duration) <= p.periodDurationToleranceSec } };
}

export async function assessMainWireCaseInitializationAgreementV1(input: { warm: unknown; cold: unknown }) {
  const issues: string[] = [], results: Result[] = [];
  let comparison: ReturnType<typeof compareMainWireCasePeriodicTracesV1> | null = null;
  try {
    const a = await read(input.warm), b = await read(input.cold); results.push(a, b);
    if (a.sourceSha256 !== b.sourceSha256 || a.modelId !== b.modelId || a.rest.referenceId !== b.rest.referenceId
      || a.nominalDtSec !== .002 || b.nominalDtSec !== .002 || b.initialization.kind !== "cold"
      || a.policyIdentitySha256 !== b.policyIdentitySha256 || canonical(a.candidateInputs) !== canonical(b.candidateInputs))
      throw new Error("Same-input source/reference/grid binding required");
    comparison = compareMainWireCasePeriodicTracesV1(a.execution.diagnostics.terminalTrace, b.execution.diagnostics.terminalTrace);
    if (!comparison.period.passed) issues.push("initialization-period-duration");
    issues.push(...comparison.rows.filter(r => !r.passed).map(r => `initialization-dependent:${r.metric}`));
  } catch (error) { issues.push(`initialization-comparison-unavailable:${error instanceof Error ? error.message : String(error)}`); }
  const body = { policy: MAIN_WIRE_CASE_INITIALIZATION_AGREEMENT_V1, status: issues.length ? "held" as const : "passed" as const,
    sourceResults: results.map(r => r.resultSha256), comparison, issues, publicPromotionAuthorized: false };
  return { ...body, reportSha256: await hash(body) };
}

export function withMainWireInitializationAssessmentV1<A extends { status: "review-pending" | "held";
  qualification: { issues: readonly string[] }; searchHoldIssues: readonly string[] }>(assessment: A,
  check: { status: "passed" | "held"; issues: readonly string[] }) {
  return { ...assessment, initializationCheck: check, ...(check.status === "held" ? {
    status: "held" as const, qualification: { ...assessment.qualification, status: "held", issues: [...assessment.qualification.issues, ...check.issues] },
    searchHoldIssues: [...assessment.searchHoldIssues, ...check.issues],
  } : {}) };
}
