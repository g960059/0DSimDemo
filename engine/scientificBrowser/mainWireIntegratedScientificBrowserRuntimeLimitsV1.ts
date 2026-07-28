/**
 * V3-only browser limits. They are declared separately so changing this lane
 * cannot silently weaken the already-audited non-coronary runtime.
 */
export const MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1 =
  Object.freeze({
    maximumRequestCountPerLifetime: 100_000 as const,
    /**
     * At the V3-only 16-ordinal advance bound, a full request covers 0.032
     * simulated seconds. Therefore 75,000 full requests cover 2,400 simulated
     * seconds: 75,000 * 16 / 500 = 2,400. Create, retry and lifecycle requests
     * make the real duration slightly shorter. The threshold remains
     * request-count based because the audited lifetime cap is request-count
     * based: it still leaves 25,000 ordinary slots, plus the two separately
     * reserved recovery slots, rather than inventing an unmeasured model-time
     * or cumulative-payload lifetime cap.
     *
     * Browser clone cost, long-session memory growth and perceived rotation
     * latency still require browser measurement before this becomes audited.
     */
    workerRotationRequestCount: 75_000 as const,
    maximumSessionIdentityCountPerLifetime: 4_096 as const,
    /**
     * One command may transport 16 consecutive 2 ms presentation ordinals,
     * or 32 ms of model time. This matches the established neighbouring
     * runtime command granularity while keeping the V3 limit independent.
     */
    maximumPresentationOrdinalCountPerAdvanceCommand: 16 as const,
    maximumSubstepCountPerPresentationCommand: 16 as const,
    maximumPendingRequestCount: 1 as const,
    maximumCommandJsonBytes: 2 * 1024 * 1024,
    maximumCommandJsonNodeCount: 200_000 as const,
    requestTimeoutMs: 60_000 as const,
  });
