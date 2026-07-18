/**
 * Shared production limits for the long-lived browser scientific runtime.
 *
 * The kernel defaults are intentionally small protocol-test defaults. The
 * Workbench, however, advances an accepted live transition in real time and
 * therefore needs a substantially longer identity lifetime. These remain
 * bounded at the kernel's audited configured maxima; they do not relax queue,
 * command-size, or recovery-command admission.
 */
export const MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1 = Object.freeze({
  maximumRequestCountPerLifetime: 100_000 as const,
  maximumSessionIdentityCountPerLifetime: 4_096 as const,
  maximumTransientStepCountPerCommand: 16 as const,
  maximumOutputFrameCountPerCommand: 16 as const,
  requestTimeoutMs: 60_000 as const,
});
