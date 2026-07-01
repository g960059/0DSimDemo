export type PrescribedVolumeFixtureV1 = {
  readonly fixtureId: string;
  readonly chamber: "LV" | "RV";
  readonly sampleRateHz: number;
  readonly cycleLengthSec: number;
  readonly activationTimeSec: number;
  readonly timeSec: readonly number[];
  readonly volumeMl: readonly number[];
  readonly wallVolumeMl: number;
  readonly referenceCavityVolumeMl: number;
  readonly annotation: {
    readonly morphologyProfileId: "normal_sinus_default";
    readonly ownerRejected: boolean;
    readonly knownFailure?: readonly string[];
  };
};

export const REQUIRED_ONE_FIBER_CHAMBER_FIXTURE_IDS_V1 = [
  "onefiber-lv-normal-volume",
  "onefiber-rv-normal-volume",
  "onefiber-lv-wiggle-volume",
  "onefiber-rv-wiggle-volume",
] as const;

export type RequiredOneFiberChamberFixtureIdV1 =
  typeof REQUIRED_ONE_FIBER_CHAMBER_FIXTURE_IDS_V1[number];

export function buildPrescribedVolumeFixturesV1(): readonly PrescribedVolumeFixtureV1[] {
  const sampleRateHz = 240;
  const cycleLengthSec = 0.8;
  return [
    volumeFixture("onefiber-lv-normal-volume", "LV", sampleRateHz, cycleLengthSec, {
      edvMl: 132,
      esvMl: 66,
      wallVolumeMl: 120,
      activationTimeSec: 0.13,
      wiggleMl: 0,
      ownerRejected: false,
    }),
    volumeFixture("onefiber-rv-normal-volume", "RV", sampleRateHz, cycleLengthSec, {
      edvMl: 150,
      esvMl: 86,
      wallVolumeMl: 70,
      activationTimeSec: 0.12,
      wiggleMl: 0,
      ownerRejected: false,
    }),
    volumeFixture("onefiber-lv-wiggle-volume", "LV", sampleRateHz, cycleLengthSec, {
      edvMl: 132,
      esvMl: 66,
      wallVolumeMl: 120,
      activationTimeSec: 0.13,
      wiggleMl: 4.5,
      ownerRejected: true,
      knownFailure: ["synthetic-mid-ejection-volume-wiggle"],
    }),
    volumeFixture("onefiber-rv-wiggle-volume", "RV", sampleRateHz, cycleLengthSec, {
      edvMl: 150,
      esvMl: 86,
      wallVolumeMl: 70,
      activationTimeSec: 0.12,
      wiggleMl: 4.0,
      ownerRejected: true,
      knownFailure: ["synthetic-mid-ejection-volume-wiggle"],
    }),
  ];
}

export function validatePrescribedVolumeFixtureV1(fixture: PrescribedVolumeFixtureV1): readonly string[] {
  const errors: string[] = [];
  if (!REQUIRED_ONE_FIBER_CHAMBER_FIXTURE_IDS_V1.includes(fixture.fixtureId as RequiredOneFiberChamberFixtureIdV1)) {
    errors.push("unexpected fixtureId");
  }
  if (fixture.timeSec.length !== fixture.volumeMl.length) errors.push("timeSec/volumeMl length mismatch");
  if (fixture.timeSec.length < 16) errors.push("too few samples");
  if (!Number.isFinite(fixture.sampleRateHz) || fixture.sampleRateHz <= 0) errors.push("invalid sampleRateHz");
  if (!Number.isFinite(fixture.cycleLengthSec) || fixture.cycleLengthSec <= 0) errors.push("invalid cycleLengthSec");
  if (!Number.isFinite(fixture.wallVolumeMl) || fixture.wallVolumeMl <= 0) errors.push("invalid wallVolumeMl");
  if (!Number.isFinite(fixture.referenceCavityVolumeMl) || fixture.referenceCavityVolumeMl <= 0) {
    errors.push("invalid referenceCavityVolumeMl");
  }
  for (let i = 1; i < fixture.timeSec.length; i++) {
    if (!(fixture.timeSec[i]! > fixture.timeSec[i - 1]!)) {
      errors.push("timeSec must be strictly increasing");
      break;
    }
  }
  if (fixture.volumeMl.some((value) => !Number.isFinite(value) || value <= 0)) {
    errors.push("volumeMl must be finite and positive");
  }
  return errors;
}

function volumeFixture(
  fixtureId: RequiredOneFiberChamberFixtureIdV1,
  chamber: "LV" | "RV",
  sampleRateHz: number,
  cycleLengthSec: number,
  options: {
    readonly edvMl: number;
    readonly esvMl: number;
    readonly wallVolumeMl: number;
    readonly activationTimeSec: number;
    readonly wiggleMl: number;
    readonly ownerRejected: boolean;
    readonly knownFailure?: readonly string[];
  },
): PrescribedVolumeFixtureV1 {
  const n = Math.round(cycleLengthSec * sampleRateHz);
  const timeSec = Array.from({ length: n }, (_, i) => i / sampleRateHz);
  const strokeMl = options.edvMl - options.esvMl;
  const volumeMl = timeSec.map((time) => {
    const theta = time / cycleLengthSec;
    const ejection = smoothProgress(theta, 0.17, 0.48);
    const filling = smoothProgress(theta, 0.58, 0.94);
    const wiggle = options.wiggleMl * Math.sin(2 * Math.PI * 6.5 * theta)
      * raisedCosineWindow(theta, 0.20, 0.70);
    return round(options.edvMl - strokeMl * ejection + strokeMl * filling + wiggle);
  });
  return {
    fixtureId,
    chamber,
    sampleRateHz,
    cycleLengthSec,
    activationTimeSec: options.activationTimeSec,
    timeSec,
    volumeMl,
    wallVolumeMl: options.wallVolumeMl,
    referenceCavityVolumeMl: options.edvMl,
    annotation: {
      morphologyProfileId: "normal_sinus_default",
      ownerRejected: options.ownerRejected,
      knownFailure: options.knownFailure,
    },
  };
}

function smoothProgress(theta: number, start: number, end: number): number {
  if (theta <= start) return 0;
  if (theta >= end) return 1;
  const x = (theta - start) / Math.max(end - start, 1e-9);
  return x * x * (3 - 2 * x);
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  if (theta < start || theta > end) return 0;
  const x = (theta - start) / Math.max(end - start, 1e-9);
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
