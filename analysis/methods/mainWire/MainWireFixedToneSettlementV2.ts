/** Numerical accuracy policy, independent of the physiological reserve floors. */
export const MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2 = Object.freeze({
  policyId: "main-wire-fixed-tone-reservoir-closure-v2" as const,
  consecutiveComparisonCount: 3,
  maximumRedistributedVolumePerBeatMl: 0.05,
  maximumNormalizedOutputDelta: 0.1,
  maximumCompleteBeatCount: 50,
  maximumMeasurementDurationSec: 54,
  maximumObservationGapSec: 0.010001,
});

export type MainWireFixedToneSettlementEvidenceV2 = Readonly<{
  policyId: typeof MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2.policyId;
  completedBeatCount: number;
  maximumRecentRedistributedVolumeMl: number;
  maximumRecentNormalizedOutputDelta: number;
  measurementDurationSec: number;
}>;

type Sample = Readonly<{ timeSec: number; volumesMl: Readonly<Record<string, number>> }>;

/**
 * Poincare volume closure across every systemic/pulmonary/coronary reservoir.
 * Interpolate only between adjacent accepted observations at the completed
 * atrial-capture boundary. Never compare samples at differing cardiac phases.
 * This is analysis sampling, not a change to the exact integrator's clock.
 *
 * Half the L1 volume difference measures redistribution at fixed total blood
 * volume. It cannot cancel between reservoirs, unlike total-volume closure,
 * and does not assume equality of LV/RV *forward* CO in regurgitation or MCS.
 */
export class MainWireFixedToneVolumeClosureV2 {
  private previous: Sample | null = null;
  private boundary: Sample | null = null;
  private recentRedistributionsMl: number[] = [];
  private lastBoundaryTimeSec = Number.NEGATIVE_INFINITY;

  accept(sample: Sample, completedBeatEndTimeSec: number | null): void {
    const keys = Object.keys(sample.volumesMl);
    if (!Number.isFinite(sample.timeSec) || !keys.length
      || keys.some((key) => !Number.isFinite(sample.volumesMl[key]))) {
      throw new Error("fixed-tone volume closure requires finite reservoir samples");
    }
    const previous = this.previous;
    this.previous = sample;
    if (previous === null) return;
    const dt = sample.timeSec - previous.timeSec;
    if (!(dt > 0) || dt > MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2.maximumObservationGapSec
      || keys.length !== Object.keys(previous.volumesMl).length
      || keys.some((key) => !Object.hasOwn(previous.volumesMl, key))) {
      throw new Error("fixed-tone volume closure lost its observation clock or reservoir identity");
    }
    if (completedBeatEndTimeSec === null || completedBeatEndTimeSec <= this.lastBoundaryTimeSec) return;
    if (!Number.isFinite(completedBeatEndTimeSec)) throw new Error("invalid completed-beat boundary");
    if (completedBeatEndTimeSec < previous.timeSec - 1e-9) return; // Restored partial beat.
    if (completedBeatEndTimeSec > sample.timeSec + 1e-9) throw new Error("future completed-beat boundary");
    const fraction = Math.max(0, Math.min(1, (completedBeatEndTimeSec - previous.timeSec) / dt));
    const volumesMl = Object.fromEntries(keys.map((key) => [key,
      previous.volumesMl[key]! + fraction * (sample.volumesMl[key]! - previous.volumesMl[key]!),
    ]));
    const boundary = { timeSec: completedBeatEndTimeSec, volumesMl };
    if (this.boundary !== null) {
      const redistributionMl = 0.5 * keys.reduce((sum, key) => sum
        + Math.abs(volumesMl[key]! - this.boundary!.volumesMl[key]!), 0);
      this.recentRedistributionsMl.push(redistributionMl);
      this.recentRedistributionsMl = this.recentRedistributionsMl.slice(
        -MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2.consecutiveComparisonCount,
      );
    }
    this.boundary = boundary;
    this.lastBoundaryTimeSec = completedBeatEndTimeSec;
  }

  maximumRecentRedistributedVolumeMl(): number {
    return this.recentRedistributionsMl.length === MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2.consecutiveComparisonCount
      ? Math.max(...this.recentRedistributionsMl) : Number.POSITIVE_INFINITY;
  }

  converged(): boolean {
    return this.maximumRecentRedistributedVolumeMl()
      <= MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2.maximumRedistributedVolumePerBeatMl;
  }
}
