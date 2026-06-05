import { DEFAULT_SETTLE_POLICY, PREVIEW_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";

export type VerificationMode = "preview" | "fitFast" | "verifyAccurate";

export type VerificationProfile = {
  mode: VerificationMode;
  label: string;
  description: string;
  targetTBV: number;
  dt: number;
  sampleHz: number;
  measureBeats: number;
  settlePolicy: SettlePolicy;
  requireProjectorQuiet: boolean;
};

const FIT_FAST_SETTLE_POLICY: SettlePolicy = {
  ...PREVIEW_SETTLE_POLICY,
  tolPrimary: 0.012,
  tolShape: 0.025,
  minBeats: 6,
  capSeconds: 35,
};

const VERIFY_ACCURATE_SETTLE_POLICY: SettlePolicy = {
  ...DEFAULT_SETTLE_POLICY,
  capSeconds: 120,
  postSettleBeats: 2,
};

export const VERIFICATION_PROFILES: Record<VerificationMode, VerificationProfile> = {
  preview: {
    mode: "preview",
    label: "Preview",
    description: "Interactive UI preview. Fast enough for controls, not for final acceptance.",
    targetTBV: 5600,
    dt: 0.002,
    sampleHz: 120,
    measureBeats: 2,
    settlePolicy: PREVIEW_SETTLE_POLICY,
    requireProjectorQuiet: false,
  },
  fitFast: {
    mode: "fitFast",
    label: "Fit fast",
    description: "Headless candidate triage with early rejection and coarse shape scoring.",
    targetTBV: 5600,
    dt: 0.002,
    sampleHz: 160,
    measureBeats: 3,
    settlePolicy: FIT_FAST_SETTLE_POLICY,
    requireProjectorQuiet: false,
  },
  verifyAccurate: {
    mode: "verifyAccurate",
    label: "Verify accurate",
    description: "Final acceptance profile with strict convergence, projector quieting, and full shape gates.",
    targetTBV: 5600,
    dt: 0.001,
    sampleHz: 240,
    measureBeats: 4,
    settlePolicy: VERIFY_ACCURATE_SETTLE_POLICY,
    requireProjectorQuiet: true,
  },
};

export function resolveVerificationProfile(
  profile: VerificationMode | VerificationProfile = "verifyAccurate",
): VerificationProfile {
  return typeof profile === "string" ? VERIFICATION_PROFILES[profile] : profile;
}
