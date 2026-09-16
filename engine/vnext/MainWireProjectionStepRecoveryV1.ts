import type { MainWireFlatSelectedOutputProjectionAdvanceV1 as Projection } from "./MainWireIntegratedTypedAuthoritySessionV1";

/** Only known Newton nonconvergence, never invariants or commit failures. */
export function isMainWireUncommittedSolveFailureV1(error: unknown): error is Error {
  return error instanceof Error && /^typed ordinary coupled solve failed: (maximum-iterations|line-search): /.test(error.message);
}

export function isMainWireUncommittedSolveRejectionV1(
  advance: Readonly<{ status: string; reason?: string; message?: string }>,
): boolean {
  return advance.status === "failed" && advance.reason === "outer-input-clock-binding-or-boundary-rejected"
    && /^statically condensed coupled solve failed: (maximum-iterations|line-search): /.test(advance.message ?? "");
}

export function advanceMainWireProjectionWithRecoveryV1(
  advance: (targetTimeSec: number) => Projection,
  accepted: () => Readonly<{ revision: number; acceptedTimeSec: number }>,
  targetTimeSec: number,
  resetPredictor: () => void = () => {},
): Projection {
  type Advanced = Extract<Projection["advance"], { status: "advanced" }>;
  const numericalFailure = (result: Projection): Error | null => {
    const a = result.advance;
    // The public event path may already have accepted a clipped boundary. Its
    // failed transaction is rolled back, but those earlier accepted steps stay.
    return a.status === "failed" && isMainWireUncommittedSolveRejectionV1(a)
      ? new Error(a.message) : null;
  };
  let first: Projection | null = null, failure: Error;
  try {
    first = advance(targetTimeSec);
    const error = numericalFailure(first);
    if (!error) return first; // Ordinary successful stepping has no extra state reads.
    failure = error;
  } catch (error) {
    if (!isMainWireUncommittedSolveFailureV1(error)) throw error;
    failure = error;
  }
  const origin = accepted();
  const firstCount = first?.advance.status === "failed" ? first.advance.internalAcceptedSubstepCount : 0;
  const originRevision = origin.revision - firstCount;
  let trials = 1, projectionMs = 0;
  const substeps: Advanced["substeps"][number][] = [];
  const record = (result: Projection) => {
    const a = result.advance, clock = accepted();
    if (a.acceptedRevision !== clock.revision || a.acceptedTimeSec !== clock.acceptedTimeSec)
      throw new Error("Projection recovery accepted clock differs");
    if (!("substeps" in a) || !a.substeps || a.substeps.length !== a.internalAcceptedSubstepCount)
      throw new Error("Projection recovery requires complete accepted substep metadata");
    substeps.push(...a.substeps);
    projectionMs += result.outputProjectionDurationMs;
  };
  if (first) record(first);
  const retry = (target: number, depth: number, error: Error): Projection => {
    const time = accepted().acceptedTimeSec;
    // Bounded work, including event-clipped attempts; no skipped model interval.
    if (depth >= 5 || trials >= 63 || (target - time) / 2 < .0000625 - 1e-12) throw error;
    const midpoint = time + (target - time) / 2;
    step(midpoint, depth + 1);
    return step(target, depth + 1);
  };
  const step = (target: number, depth: number): Projection => {
    if (trials >= 63) throw new Error("Bounded projection recovery exhausted its trial budget");
    // The predictor assumes equal spacing. Never train a variable-step retry
    // from that history or carry unequal-step history into the next normal tick.
    resetPredictor(); trials++;
    let result: Projection;
    try { result = advance(target); }
    catch (error) {
      if (!isMainWireUncommittedSolveFailureV1(error)) throw error;
      return retry(target, depth, error);
    }
    const error = numericalFailure(result);
    if (result.advance.status !== "advanced" && !error)
      throw new Error("Bounded projection recovery could not reach its target");
    record(result);
    return error ? retry(target, depth, error) : result;
  };
  try {
    const final = retry(targetTimeSec, 0, failure);
    if (final.advance.status !== "advanced") throw new Error("Projection recovery terminal status drifted");
    if (final.advance.acceptedTimeSec !== targetTimeSec || final.advance.acceptedRevision - originRevision !== substeps.length
      || substeps.some((s, i) => s.acceptedRevision !== originRevision + i + 1))
      throw new Error("Projection recovery requires a complete, ordered accepted trajectory");
    resetPredictor();
    return Object.freeze({ ...final, outputProjectionDurationMs: projectionMs,
      advance: Object.freeze({ ...final.advance,
        acceptedRevisionSpanFromPrevious: final.advance.acceptedRevision - originRevision,
        internalAcceptedSubstepCount: substeps.length,
        // Preserve the owner's contract: every accepted step short of this
        // outer presentation target is counted, including adaptive midpoints.
        boundaryClippedSubstepCount: substeps.filter(s => s.acceptedTimeSec !== targetTimeSec).length,
        substeps: Object.freeze(substeps.map(s => Object.freeze({ ...s, landedOnPresentationTarget: s.acceptedTimeSec === targetTimeSec }))),
      }),
    });
  } catch (error) {
    // A poisoned owner may reject all calls. Preserve the original failure.
    try { resetPredictor(); } catch { /* fatal owner will be discarded */ }
    throw error;
  }
}
