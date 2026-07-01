export type PrescribedGradientValveFixtureV1 = {
  readonly fixtureId: string;
  readonly valveId: "MV" | "TV";
  readonly sampleRateHz: number;
  readonly cycleLengthSec: number;
  readonly timeSec: readonly number[];
  readonly upstreamPressureMmHg: readonly number[];
  readonly downstreamPressureMmHg: readonly number[];
  readonly expectedForwardPeakCount: 2;
  readonly annotation: {
    readonly morphologyProfileId: "normal_sinus_default";
    readonly profile: "normal" | "low-gradient";
  };
};

export const REQUIRED_PRESCRIBED_GRADIENT_VALVE_FIXTURE_IDS_V1 = [
  "flowstate-mv-normal-gradient",
  "flowstate-tv-normal-gradient",
  "flowstate-mv-low-gradient",
  "flowstate-tv-low-gradient",
] as const;

export type RequiredPrescribedGradientValveFixtureIdV1 =
  typeof REQUIRED_PRESCRIBED_GRADIENT_VALVE_FIXTURE_IDS_V1[number];

export function buildPrescribedGradientValveFixturesV1(): readonly PrescribedGradientValveFixtureV1[] {
  const sampleRateHz = 240;
  const cycleLengthSec = 0.8;
  return [
    fixture("flowstate-mv-normal-gradient", "MV", sampleRateHz, cycleLengthSec, 4.5, 2.1, "normal"),
    fixture("flowstate-tv-normal-gradient", "TV", sampleRateHz, cycleLengthSec, 2.8, 1.8, "normal"),
    fixture("flowstate-mv-low-gradient", "MV", sampleRateHz, cycleLengthSec, 2.7, 1.4, "low-gradient"),
    fixture("flowstate-tv-low-gradient", "TV", sampleRateHz, cycleLengthSec, 1.8, 1.1, "low-gradient"),
  ];
}

export function validatePrescribedGradientValveFixtureV1(
  fixture: PrescribedGradientValveFixtureV1,
): readonly string[] {
  const errors: string[] = [];
  if (!REQUIRED_PRESCRIBED_GRADIENT_VALVE_FIXTURE_IDS_V1.includes(
    fixture.fixtureId as RequiredPrescribedGradientValveFixtureIdV1,
  )) {
    errors.push("unexpected fixtureId");
  }
  if (fixture.timeSec.length !== fixture.upstreamPressureMmHg.length) errors.push("time/upstream length mismatch");
  if (fixture.timeSec.length !== fixture.downstreamPressureMmHg.length) errors.push("time/downstream length mismatch");
  if (fixture.timeSec.length < 16) errors.push("too few samples");
  for (let i = 1; i < fixture.timeSec.length; i++) {
    if (!(fixture.timeSec[i]! > fixture.timeSec[i - 1]!)) {
      errors.push("timeSec must be strictly increasing");
      break;
    }
  }
  if ([...fixture.upstreamPressureMmHg, ...fixture.downstreamPressureMmHg].some((value) => !Number.isFinite(value))) {
    errors.push("pressures must be finite");
  }
  return errors;
}

function fixture(
  fixtureId: RequiredPrescribedGradientValveFixtureIdV1,
  valveId: "MV" | "TV",
  sampleRateHz: number,
  cycleLengthSec: number,
  eWaveGradientMmHg: number,
  aWaveGradientMmHg: number,
  profile: PrescribedGradientValveFixtureV1["annotation"]["profile"],
): PrescribedGradientValveFixtureV1 {
  const n = Math.round(sampleRateHz * cycleLengthSec);
  const timeSec = Array.from({ length: n }, (_, i) => i / sampleRateHz);
  const downstreamPressureMmHg = timeSec.map((time) => {
    const theta = time / cycleLengthSec;
    const systolic = 0.8 * raisedCosineWindow(theta, 0.14, 0.32);
    return round(6 + systolic);
  });
  const upstreamPressureMmHg = timeSec.map((time, i) => {
    const theta = time / cycleLengthSec;
    const eWave = eWaveGradientMmHg * raisedCosineWindow(theta, 0.34, 0.58);
    const aWave = aWaveGradientMmHg * raisedCosineWindow(theta, 0.82, 0.98);
    const closureBias = -0.35 * raisedCosineWindow(theta, 0.62, 0.76);
    return round(downstreamPressureMmHg[i]! + eWave + aWave + closureBias);
  });
  return {
    fixtureId,
    valveId,
    sampleRateHz,
    cycleLengthSec,
    timeSec,
    upstreamPressureMmHg,
    downstreamPressureMmHg,
    expectedForwardPeakCount: 2,
    annotation: {
      morphologyProfileId: "normal_sinus_default",
      profile,
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
