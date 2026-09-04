import { canonicalJsonStringify } from "@/engine/integrity";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 } from
  "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import type { MainWireIntegratedModelStandard70CheckpointV1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";

export const MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_V1_ID = "main-wire-baseline-pressure-rate-quality-v1" as const;
export const MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_POLICY_V1 = Object.freeze({
  provenance: "engineering-numerical-sensitivity-and-single-segment-spike-screen" as const,
  maximumTwoGridRelativeDifference: 0.05,
  minimumAdjacentSameSignMagnitudeFraction: 0.5,
  comparison: "two-grid-consistency-not-convergence-order-or-accuracy-proof" as const,
  physiologicalNormalityClaimed: false as const,
  fullBeatTraceCompletenessClaimed: false as const,
  peakPhaseBasis: "segment-midpoint-within-completed-atrial-beat" as const,
});
type BeatV1 = Pick<MainWireIntegratedModelCompletedBeatMetricsV3,
  "startTimeSec" | "endTimeSec" | "durationSec" | "ventricularAbsolutePressureRateExtrema">;
export type MainWireBaselinePressureRateQualificationV1 = Readonly<{
  nominalDtSec: number;
  classification: Readonly<{ status: string }>;
  checkpoint: Pick<MainWireIntegratedModelStandard70CheckpointV1, "modelIdentity" | "checkpointSha256"> &
    Readonly<{ baseStandardCheckpointV2: Readonly<{ completedBeatMetrics: BeatV1 | null }> }>;
  terminalTrace: readonly Readonly<{ acceptedTimeSec: number; acceptedDtSec: number;
    absolutePressureMmHg: Readonly<{ LV: number; RV: number }> }>[];
}>;
type GridV1 = Readonly<{ qualification: MainWireBaselinePressureRateQualificationV1;
  /** SHA-256 of the actual candidate parameters, including contractility and
   * mechanisms, excluding dt/initialization. Caller owns checkpoint binding. */
  candidateIdentitySha256: string }>;
type StatusV1 = "passed" | "failed" | "unresolved";
type PeakV1 = Readonly<{ status: StatusV1; issue: string | null; reportedMmHgPerSec: number | null;
  observedMmHgPerSec: number | null; peakStartTimeSec: number | null; peakEndTimeSec: number | null;
  peakPhase01: number | null; previousSameSignFraction: number | null; nextSameSignFraction: number | null }>;

/** Final/mint numerical screen only. Exact checkpoints must already be trusted
 * or validated; this observer neither restores nor changes their exact state. */
export function evaluateMainWireBaselinePressureRateQualityV1(input: Readonly<{ coarse: GridV1; fine: GridV1 }>) {
  const { coarse, fine } = input;
  const pair = [coarse, fine];
  const policy = MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_POLICY_V1;
  const grids = Object.fromEntries((["coarse", "fine"] as const).map((name) => [name, Object.freeze({
    nominalDtSec: Number.isFinite(input[name].qualification.nominalDtSec) ? input[name].qualification.nominalDtSec : null,
    checkpointSha256: input[name].qualification.checkpoint.checkpointSha256,
    modelIdentity: Object.freeze({ ...input[name].qualification.checkpoint.modelIdentity }),
    candidateIdentitySha256: input[name].candidateIdentitySha256,
  })]));
  const issue = pair.some(({ qualification: q, candidateIdentitySha256: id }) => !/^[0-9a-f]{64}$/.test(id)
    || !/^[0-9a-f]{64}$/.test(q.checkpoint.checkpointSha256)) ? "invalid-source-identity"
    : coarse.candidateIdentitySha256 !== fine.candidateIdentitySha256 ? "candidate-identity-mismatch"
      : canonicalJsonStringify(coarse.qualification.checkpoint.modelIdentity)
        !== canonicalJsonStringify(fine.qualification.checkpoint.modelIdentity) ? "exact-model-identity-mismatch"
        : pair.some(({ qualification: q }) => q.classification.status !== "period1-converged") ? "period1-required"
          : pair.some(({ qualification: q }) => !(q.nominalDtSec > 0) || !Number.isFinite(q.nominalDtSec))
            || fine.qualification.nominalDtSec !== coarse.qualification.nominalDtSec / 2 ? "dt-halving-required" : null;
  const checks = issue !== null ? [] : (["LV", "RV"] as const).flatMap((ventricle) =>
    (["maximum", "minimum"] as const).map((extremum) => {
      const left = observePeakV1(coarse.qualification, ventricle, extremum);
      const right = observePeakV1(fine.qualification, ventricle, extremum);
      const relativeDifference = left.reportedMmHgPerSec === null || right.reportedMmHgPerSec === null
        || Math.max(Math.abs(left.reportedMmHgPerSec), Math.abs(right.reportedMmHgPerSec)) === 0
        ? null : Math.abs(left.reportedMmHgPerSec - right.reportedMmHgPerSec)
          / Math.max(Math.abs(left.reportedMmHgPerSec), Math.abs(right.reportedMmHgPerSec));
      const status: StatusV1 = left.status === "unresolved" || right.status === "unresolved" ? "unresolved"
        : left.status === "failed" || right.status === "failed"
          || relativeDifference! > policy.maximumTwoGridRelativeDifference ? "failed" : "passed";
      return Object.freeze({ checkId: `${ventricle === "LV" ? "left" : "right"}-ventricle.${extremum}-dpdt`,
        status, relativeDifference, coarse: left, fine: right });
    }));
  const status: StatusV1 = issue !== null || checks.some((check) => check.status === "unresolved") ? "unresolved"
    : checks.some((check) => check.status === "failed") ? "failed" : "passed";
  return Object.freeze({ methodId: MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_V1_ID, status,
    policy, grids: Object.freeze(grids), issue, checks: Object.freeze(checks) });
}
export type MainWireBaselinePressureRateQualityV1 = ReturnType<typeof evaluateMainWireBaselinePressureRateQualityV1>;

/** Validate a persisted passed screen, not its externally bound source traces.
 * The consuming mint also binds both checkpoint hashes and candidate identity. */
export function assertMainWireBaselinePressureRateQualityV1(value: unknown): asserts value is MainWireBaselinePressureRateQualityV1 {
  const reject = (): never => { throw new Error("Pressure-rate quality report is not internally consistent passed V1 evidence"); };
  const record = (input: unknown): Record<string, unknown> => input !== null && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown> : reject();
  const finite = (input: unknown): input is number => typeof input === "number" && Number.isFinite(input);
  const sha = (input: unknown) => typeof input === "string" && /^[0-9a-f]{64}$/.test(input);
  const report = record(value), grids = record(report.grids);
  if (report.methodId !== MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_V1_ID || report.status !== "passed" || report.issue !== null
    || canonicalJsonStringify(report.policy) !== canonicalJsonStringify(MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_POLICY_V1)) reject();
  const coarse = record(grids.coarse), fine = record(grids.fine);
  for (const grid of [coarse, fine]) {
    const model = record(grid.modelIdentity);
    if (!sha(grid.checkpointSha256) || !sha(grid.candidateIdentitySha256) || !finite(grid.nominalDtSec) || !(grid.nominalDtSec > 0)
      || Object.keys(model).length === 0 || Object.values(model).some((field) => typeof field !== "string" || field.length === 0)) reject();
  }
  if (fine.nominalDtSec !== (coarse.nominalDtSec as number) / 2 || fine.candidateIdentitySha256 !== coarse.candidateIdentitySha256
    || canonicalJsonStringify(fine.modelIdentity) !== canonicalJsonStringify(coarse.modelIdentity)) reject();
  const expected = new Set(["left-ventricle.maximum-dpdt", "left-ventricle.minimum-dpdt", "right-ventricle.maximum-dpdt", "right-ventricle.minimum-dpdt"]);
  if (!Array.isArray(report.checks) || report.checks.length !== expected.size) reject();
  for (const raw of report.checks as unknown[]) {
    const check = record(raw), id = check.checkId;
    if (typeof id !== "string" || !expected.delete(id) || check.status !== "passed") reject();
    const sign = (id as string).includes(".maximum-") ? 1 : -1;
    const peaks = [record(check.coarse), record(check.fine)];
    peaks.forEach((peak, index) => {
      if (peak.status !== "passed" || peak.issue !== null || !finite(peak.reportedMmHgPerSec) || !(sign * peak.reportedMmHgPerSec > 0)
        || !finite(peak.observedMmHgPerSec) || !nearV1(peak.observedMmHgPerSec, peak.reportedMmHgPerSec)
        || !finite(peak.peakStartTimeSec) || !finite(peak.peakEndTimeSec) || !(peak.peakEndTimeSec > peak.peakStartTimeSec)
        || peak.peakEndTimeSec - peak.peakStartTimeSec > ([coarse, fine][index]!.nominalDtSec as number) + toleranceV1(peak.peakEndTimeSec)
        || !finite(peak.peakPhase01) || peak.peakPhase01 < 0 || peak.peakPhase01 > 1) reject();
      const neighbors = [peak.previousSameSignFraction, peak.nextSameSignFraction];
      if (neighbors.some((fraction) => fraction !== null && (!finite(fraction) || fraction < 0 || fraction > 1 + toleranceV1(fraction)))
        || Math.max(...neighbors.map((fraction) => fraction === null ? 0 : fraction as number))
          < MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_POLICY_V1.minimumAdjacentSameSignMagnitudeFraction) reject();
    });
    const a = peaks[0]!.reportedMmHgPerSec as number, b = peaks[1]!.reportedMmHgPerSec as number;
    const difference = Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b));
    if (!finite(check.relativeDifference) || check.relativeDifference !== difference
      || difference > MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_POLICY_V1.maximumTwoGridRelativeDifference) reject();
  }
}

function observePeakV1(q: MainWireBaselinePressureRateQualificationV1, ventricle: "LV" | "RV", extremum: "maximum" | "minimum"): PeakV1 {
  const beat = q.checkpoint.baseStandardCheckpointV2.completedBeatMetrics;
  const reported = beat?.ventricularAbsolutePressureRateExtrema[ventricle][`${extremum}MmHgPerSec`];
  const empty = (status: StatusV1, issue: string): PeakV1 => Object.freeze({ status, issue,
    reportedMmHgPerSec: Number.isFinite(reported) ? reported! : null, observedMmHgPerSec: null,
    peakStartTimeSec: null, peakEndTimeSec: null, peakPhase01: null,
    previousSameSignFraction: null, nextSameSignFraction: null });
  if (beat === null || !Number.isFinite(reported)) return empty("unresolved", "missing-finite-completed-beat-extremum");
  const sign = extremum === "maximum" ? 1 : -1;
  if (!(sign * reported! > 0)) return empty("failed", "invalid-pressure-rate-sign");
  if (![beat.startTimeSec, beat.endTimeSec, beat.durationSec].every(Number.isFinite)
    || !(beat.durationSec > 0) || !nearV1(beat.endTimeSec - beat.startTimeSec, beat.durationSec)) {
    return empty("unresolved", "invalid-beat-clock");
  }
  const samples = q.terminalTrace;
  if (samples.length < 3 || samples.some((sample, index) => {
    const dt = index === 0 ? sample.acceptedDtSec : sample.acceptedTimeSec - samples[index - 1]!.acceptedTimeSec;
    return !Number.isFinite(sample.acceptedTimeSec) || !Number.isFinite(sample.absolutePressureMmHg[ventricle])
      || !(dt > 0) || !nearV1(dt, sample.acceptedDtSec) || dt > q.nominalDtSec + toleranceV1(sample.acceptedTimeSec);
  })) return empty("unresolved", "invalid-or-incomplete-accepted-trace");
  const segments = samples.slice(1).flatMap((sample, index) => {
    const previous = samples[index]!;
    return previous.acceptedTimeSec < beat.startTimeSec || sample.acceptedTimeSec > beat.endTimeSec ? [] : [{
      start: previous.acceptedTimeSec, end: sample.acceptedTimeSec,
      rate: (sample.absolutePressureMmHg[ventricle] - previous.absolutePressureMmHg[ventricle])
        / (sample.acceptedTimeSec - previous.acceptedTimeSec),
    }];
  });
  if (segments.some(({ rate }) => !Number.isFinite(rate))) return empty("unresolved", "nonfinite-observed-pressure-rate");
  const index = segments.findIndex(({ rate }) => nearV1(rate, reported!));
  if (index < 0) return empty("unresolved", "reported-extremum-not-visible-no-periodic-seam-invented");
  if (segments.some(({ rate }) => sign * (rate - reported!) > toleranceV1(rate, reported!))) {
    return empty("failed", "observed-segment-exceeds-reported-extremum");
  }
  const peak = segments[index]!;
  const fraction = (at: number) => segments[at] === undefined ? null : Math.max(0, sign * segments[at]!.rate) / Math.abs(reported!);
  const previousSameSignFraction = fraction(index - 1), nextSameSignFraction = fraction(index + 1);
  const supported = Math.max(previousSameSignFraction ?? 0, nextSameSignFraction ?? 0)
    >= MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_POLICY_V1.minimumAdjacentSameSignMagnitudeFraction;
  const status: StatusV1 = supported ? "passed" : previousSameSignFraction === null || nextSameSignFraction === null ? "unresolved" : "failed";
  return Object.freeze({ status, issue: supported ? null : status === "unresolved" ? "peak-neighbor-not-observed" : "isolated-one-segment-excursion",
    reportedMmHgPerSec: reported!, observedMmHgPerSec: peak.rate, peakStartTimeSec: peak.start, peakEndTimeSec: peak.end,
    peakPhase01: ((peak.start + peak.end) / 2 - beat.startTimeSec) / beat.durationSec,
    previousSameSignFraction, nextSameSignFraction });
}
function toleranceV1(...values: number[]) { return 128 * Number.EPSILON * Math.max(1, ...values.map(Math.abs)); }
function nearV1(left: number, right: number) { return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= toleranceV1(left, right); }
