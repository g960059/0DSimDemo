/**
 * V3-only browser limits. They are declared separately so changing this lane
 * cannot silently weaken the already-audited non-coronary runtime.
 */
export const MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1 =
  Object.freeze({
    maximumRequestCountPerLifetime: 100_000 as const,
    /**
     * V3 needs 500 ordinal-advance requests per simulated second, so 75,000
     * such requests correspond to 150 simulated seconds. Create, observe and
     * other lifecycle requests also count, so a real host reaches the
     * threshold slightly earlier. Checkpoint plus disposal at the threshold
     * leave 24,998 request slots. Browser clone cost, long-session memory
     * growth and perceived rotation latency still require browser measurement
     * before this becomes audited.
     */
    workerRotationRequestCount: 75_000 as const,
    maximumSessionIdentityCountPerLifetime: 4_096 as const,
    maximumSubstepCountPerPresentationCommand: 16 as const,
    maximumPendingRequestCount: 1 as const,
    maximumCommandJsonBytes: 2 * 1024 * 1024,
    maximumCommandJsonNodeCount: 200_000 as const,
    requestTimeoutMs: 60_000 as const,
  });
