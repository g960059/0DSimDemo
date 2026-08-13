/** Re-owns untrusted or serialized data as one model-specific accepted state. */
export type AcceptedStateValidatorV1<TState> = (
  candidate: unknown,
) => TState;

/** Minimal transactional state-owner seam; hot kernels need no storage detail. */
export interface AcceptedStateAuthorityV1<TState> {
  current(): TState;
  /** Detached public view; it must not be able to mutate current authority. */
  snapshot(): TState;
  commit(candidate: TState): TState;
}
