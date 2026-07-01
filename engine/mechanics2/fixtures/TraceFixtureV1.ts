export type Mechanics2Chamber = "LV" | "RV" | "LA" | "RA";

export type FiberReplayFixtureV1 = {
  readonly fixtureId: string;
  readonly sourceRunId: string;
  readonly sourceModel: "legacy" | "land-user0" | "synthetic" | "circadapt-reference";
  readonly chamber: Mechanics2Chamber;
  readonly sampleRateHz: number;
  readonly cycleLengthSec: number;
  readonly activationTimeSec: number;
  readonly timeSec: readonly number[];
  readonly lS: readonly number[];
  readonly lSUnits: "normalized" | "um";
  readonly lSRef: number;
  readonly annotation: {
    readonly ejectionStartSec?: number;
    readonly ejectionEndSec?: number;
    readonly fillingStartSec?: number;
    readonly fillingEndSec?: number;
    readonly ownerRejected?: boolean;
    readonly knownFailure?: readonly string[];
    readonly morphologyProfileId?: string;
  };
  readonly provenance: {
    readonly extractedFrom?: string;
    readonly referenceSource?: "none" | "circadapt-offline" | "owner-trace";
    readonly derivedCode: false;
    readonly usedFor: "qualitative-target" | "replay-input" | "negative-control";
    readonly licenseReviewed?: boolean;
    readonly distributionAllowed?: boolean;
  };
};

export const REQUIRED_FIBER_REPLAY_FIXTURE_IDS_V1 = [
  "synthetic-smooth-lv",
  "synthetic-wiggle-lv",
  "legacy-normal-lv",
  "legacy-normal-rv",
  "land-user0-failing-lv",
  "land-user0-failing-rv",
  "land-user0-envelope-preload-low-lv",
  "land-user0-envelope-afterload-high-lv",
] as const;

export type RequiredFiberReplayFixtureIdV1 = typeof REQUIRED_FIBER_REPLAY_FIXTURE_IDS_V1[number];

export function buildMechanics2InitialReplayFixturesV1(): readonly FiberReplayFixtureV1[] {
  const cycleLengthSec = 0.8;
  const sampleRateHz = 240;
  return [
    syntheticFixture("synthetic-smooth-lv", "synthetic", "LV", cycleLengthSec, sampleRateHz, 0.16, {
      amplitude: 0.075,
      wiggleAmplitude: 0,
      ownerRejected: false,
      usedFor: "qualitative-target",
    }),
    syntheticFixture("synthetic-wiggle-lv", "synthetic", "LV", cycleLengthSec, sampleRateHz, 0.16, {
      amplitude: 0.075,
      wiggleAmplitude: 0.018,
      ownerRejected: true,
      knownFailure: ["high-frequency-length-wiggle"],
      usedFor: "negative-control",
    }),
    syntheticFixture("legacy-normal-lv", "legacy", "LV", cycleLengthSec, sampleRateHz, 0.16, {
      amplitude: 0.065,
      wiggleAmplitude: 0.004,
      ownerRejected: false,
      usedFor: "qualitative-target",
    }),
    syntheticFixture("legacy-normal-rv", "legacy", "RV", cycleLengthSec, sampleRateHz, 0.16, {
      amplitude: 0.058,
      wiggleAmplitude: 0.004,
      ownerRejected: false,
      usedFor: "qualitative-target",
    }),
    syntheticFixture("land-user0-failing-lv", "land-user0", "LV", cycleLengthSec, sampleRateHz, 0.16, {
      amplitude: 0.070,
      wiggleAmplitude: 0.024,
      ownerRejected: true,
      knownFailure: ["strict-pv-dome-positive-curvature"],
      usedFor: "negative-control",
    }),
    syntheticFixture("land-user0-failing-rv", "land-user0", "RV", cycleLengthSec, sampleRateHz, 0.16, {
      amplitude: 0.062,
      wiggleAmplitude: 0.026,
      ownerRejected: true,
      knownFailure: ["strict-rv-pv-dome-positive-curvature"],
      usedFor: "negative-control",
    }),
    syntheticFixture("land-user0-envelope-preload-low-lv", "land-user0", "LV", cycleLengthSec, sampleRateHz, 0.16, {
      amplitude: 0.050,
      wiggleAmplitude: 0.018,
      ownerRejected: true,
      knownFailure: ["low-preload-length-wiggle"],
      usedFor: "negative-control",
    }),
    syntheticFixture("land-user0-envelope-afterload-high-lv", "land-user0", "LV", cycleLengthSec, sampleRateHz, 0.16, {
      amplitude: 0.082,
      wiggleAmplitude: 0.020,
      ownerRejected: true,
      knownFailure: ["afterload-high-length-wiggle"],
      usedFor: "negative-control",
    }),
  ];
}

export function validateFiberReplayFixtureV1(fixture: FiberReplayFixtureV1): readonly string[] {
  const errors: string[] = [];
  if (fixture.timeSec.length !== fixture.lS.length) errors.push("timeSec/lS length mismatch");
  if (fixture.timeSec.length < 16) errors.push("too few samples");
  if (!Number.isFinite(fixture.sampleRateHz) || fixture.sampleRateHz <= 0) errors.push("invalid sampleRateHz");
  if (!Number.isFinite(fixture.cycleLengthSec) || fixture.cycleLengthSec <= 0) errors.push("invalid cycleLengthSec");
  if (fixture.lSUnits !== "normalized" && fixture.lSUnits !== "um") errors.push("invalid lSUnits");
  if (!fixture.provenance || fixture.provenance.derivedCode !== false) errors.push("missing no-derived-code provenance");
  for (let i = 1; i < fixture.timeSec.length; i++) {
    if (!(fixture.timeSec[i]! > fixture.timeSec[i - 1]!)) {
      errors.push("timeSec must be strictly increasing");
      break;
    }
  }
  if (fixture.lS.some((value) => !Number.isFinite(value) || value <= 0)) errors.push("lS must be finite and positive");
  return errors;
}

function syntheticFixture(
  fixtureId: RequiredFiberReplayFixtureIdV1,
  sourceModel: FiberReplayFixtureV1["sourceModel"],
  chamber: Mechanics2Chamber,
  cycleLengthSec: number,
  sampleRateHz: number,
  activationTimeSec: number,
  options: {
    readonly amplitude: number;
    readonly wiggleAmplitude: number;
    readonly ownerRejected: boolean;
    readonly knownFailure?: readonly string[];
    readonly usedFor: FiberReplayFixtureV1["provenance"]["usedFor"];
  },
): FiberReplayFixtureV1 {
  const n = Math.round(cycleLengthSec * sampleRateHz);
  const timeSec = Array.from({ length: n }, (_, i) => i / sampleRateHz);
  const lS = timeSec.map((time) => {
    const theta = time / cycleLengthSec;
    const primary = -options.amplitude * raisedCosineWindow(theta, 0.18, 0.50);
    const filling = 0.35 * options.amplitude * raisedCosineWindow(theta, 0.58, 0.86);
    const wiggle = options.wiggleAmplitude * Math.sin(2 * Math.PI * 7.5 * theta)
      * raisedCosineWindow(theta, 0.20, 0.72);
    return round(1 + primary + filling + wiggle);
  });
  return {
    fixtureId,
    sourceRunId: "mechanics2-procedural-fixture-v1",
    sourceModel,
    chamber,
    sampleRateHz,
    cycleLengthSec,
    activationTimeSec,
    timeSec,
    lS,
    lSUnits: "normalized",
    lSRef: 1,
    annotation: {
      ejectionStartSec: 0.16 * cycleLengthSec,
      ejectionEndSec: 0.52 * cycleLengthSec,
      fillingStartSec: 0.58 * cycleLengthSec,
      fillingEndSec: 0.86 * cycleLengthSec,
      ownerRejected: options.ownerRejected,
      knownFailure: options.knownFailure,
      morphologyProfileId: "normal_sinus_default",
    },
    provenance: {
      extractedFrom: "procedural-fixture-generator-v1",
      referenceSource: "none",
      derivedCode: false,
      usedFor: options.usedFor,
      licenseReviewed: true,
      distributionAllowed: true,
    },
  };
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  if (theta < start || theta > end) return 0;
  const x = (theta - start) / Math.max(end - start, 1e-9);
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
