import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberIdV1,
  type AtrialFiberChamberOutputV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import {
  runFourChamberSourceReservoirContractReviewBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSourceReservoirContractReviewBench";
import {
  computeShapeQualityMetricsV1,
  type ShapeQualityMetricsV1,
} from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";

export const ATRIAL_FIBER_PACK_PRESCRIBED_VOLUME_REPORT_ID_V1 =
  "atrial-fiber-pack-prescribed-volume-report-v1" as const;

type FixtureIdV1 =
  | "la-normal-sinus-volume-v1"
  | "ra-normal-sinus-volume-v1"
  | "la-high-preload-volume-v1"
  | "ra-low-preload-volume-v1";

type AtrialVolumeFixtureV1 = {
  readonly fixtureId: FixtureIdV1;
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly cycleLengthSec: number;
  readonly sampleRateHz: number;
  readonly activationTimeSec: number;
  readonly volumeMl: readonly number[];
  readonly expectedPressurePeakRangeMmHg: readonly [number, number];
};

type AtrialFixtureResultV1 = {
  readonly fixtureId: FixtureIdV1;
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly status: "pass" | "fail";
  readonly pressurePeakMmHg: number;
  readonly pressureMinMmHg: number;
  readonly pressurePulseMmHg: number;
  readonly activePressurePeakMmHg: number;
  readonly passivePressurePeakMmHg: number;
  readonly seriesPressurePeakMmHg: number;
  readonly activePeakTheta: number;
  readonly maxAbsLSiVelocityNormPerSec: number;
  readonly pressureShape: ShapeQualityMetricsV1;
  readonly allFinite: boolean;
  readonly failureReasons: readonly string[];
};

export type AtrialFiberPackPrescribedVolumeReportV1 = {
  readonly reportId: typeof ATRIAL_FIBER_PACK_PRESCRIBED_VOLUME_REPORT_ID_V1;
  readonly gateId: "atrialFiberPackPrescribedVolumeV1";
  readonly upstreamSourceReservoirContract: {
    readonly requiredStatus: "source-reservoir-contract-review-signal";
    readonly observedStatus: ReturnType<
      typeof runFourChamberSourceReservoirContractReviewBenchV1
    >["decision"]["sourceReservoirContractStatus"];
    readonly mayProceedObserved: boolean;
  };
  readonly fixtureResults: readonly AtrialFixtureResultV1[];
  readonly summary: {
    readonly total: 4;
    readonly pass: number;
    readonly fail: number;
    readonly boundedPressureCount: number;
    readonly lateActivePeakCount: number;
    readonly finiteCount: number;
  };
  readonly decision: {
    readonly atrialFiberPackStatus:
      | "atrial-fiber-pack-prescribed-volume-signal"
      | "atrial-fiber-pack-prescribed-volume-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly closedLoopAtria: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneGeometry: false;
    readonly pistonVolumeMode: false;
    readonly LandAtrialUnlock: false;
  };
};

export function runAtrialFiberPackPrescribedVolumeBenchV1(): AtrialFiberPackPrescribedVolumeReportV1 {
  const upstream = runFourChamberSourceReservoirContractReviewBenchV1();
  const fixtureResults = buildFixtures().map(evaluateFixture);
  const pass = fixtureResults.filter((result) => result.status === "pass").length;
  const finiteCount = fixtureResults.filter((result) => result.allFinite).length;
  const boundedPressureCount = fixtureResults.filter((result) =>
    result.failureReasons.every((reason) => !reason.includes("pressure"))).length;
  const lateActivePeakCount = fixtureResults.filter((result) =>
    result.activePeakTheta >= 0.66 && result.activePeakTheta <= 0.9).length;
  const upstreamOk =
    upstream.decision.sourceReservoirContractStatus === "source-reservoir-contract-review-signal";
  const atrialFiberPackStatus = upstreamOk && pass === fixtureResults.length
    ? "atrial-fiber-pack-prescribed-volume-signal"
    : "atrial-fiber-pack-prescribed-volume-blocked";
  return {
    reportId: ATRIAL_FIBER_PACK_PRESCRIBED_VOLUME_REPORT_ID_V1,
    gateId: "atrialFiberPackPrescribedVolumeV1",
    upstreamSourceReservoirContract: {
      requiredStatus: "source-reservoir-contract-review-signal",
      observedStatus: upstream.decision.sourceReservoirContractStatus,
      mayProceedObserved: upstreamOk,
    },
    fixtureResults,
    summary: {
      total: 4,
      pass,
      fail: fixtureResults.length - pass,
      boundedPressureCount,
      lateActivePeakCount,
      finiteCount,
    },
    decision: {
      atrialFiberPackStatus,
      nextAction: atrialFiberPackStatus === "atrial-fiber-pack-prescribed-volume-signal"
        ? "Proceed to an AV-plane-off closed-loop atrial-fiber smoke. Keep AV-plane geometry, piston-volume mode, LandAtrial, and runtime wiring locked."
        : "Do not enter closed-loop atrial work. Fix the prescribed-volume atrial fiber pack or source/reservoir prerequisite first.",
      blockedClaims: [
        "runtime-wiring",
        "closed-loop-atria",
        "morphology-acceptance",
        "AV-plane-geometry",
        "AV-plane-piston-volume-mode",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      closedLoopAtria: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      pistonVolumeMode: false,
      LandAtrialUnlock: false,
    },
  };
}

function buildFixtures(): readonly AtrialVolumeFixtureV1[] {
  const cycleLengthSec = 0.8;
  const sampleRateHz = 200;
  const sampleCount = Math.round(cycleLengthSec * sampleRateHz);
  return [
    atrialFixture("la-normal-sinus-volume-v1", "LA", cycleLengthSec, sampleRateHz, 0.7, 1, [4, 20]),
    atrialFixture("ra-normal-sinus-volume-v1", "RA", cycleLengthSec, sampleRateHz, 0.68, 1, [2, 16]),
    atrialFixture("la-high-preload-volume-v1", "LA", cycleLengthSec, sampleRateHz, 0.7, 1.16, [5, 24]),
    atrialFixture("ra-low-preload-volume-v1", "RA", cycleLengthSec, sampleRateHz, 0.68, 0.86, [1.5, 14]),
  ].map((fixture) => ({
    ...fixture,
    volumeMl: Array.from({ length: sampleCount }, (_, i) =>
      volumeAtTheta(fixture.chamberId, fixture.scale, i / sampleCount)
    ),
  }));
}

function atrialFixture(
  fixtureId: FixtureIdV1,
  chamberId: AtrialFiberChamberIdV1,
  cycleLengthSec: number,
  sampleRateHz: number,
  activationTheta: number,
  scale: number,
  expectedPressurePeakRangeMmHg: readonly [number, number],
): Omit<AtrialVolumeFixtureV1, "volumeMl"> & { readonly scale: number } {
  return {
    fixtureId,
    chamberId,
    cycleLengthSec,
    sampleRateHz,
    activationTimeSec: activationTheta * cycleLengthSec,
    expectedPressurePeakRangeMmHg,
    scale,
  };
}

function evaluateFixture(fixture: AtrialVolumeFixtureV1): AtrialFixtureResultV1 {
  const outputs = replayFixture(fixture);
  const pressure = outputs.map((output) => output.pressureRawMmHg);
  const activePressure = outputs.map((output) => output.activePressureMmHg);
  const passivePressure = outputs.map((output) => output.passivePressureMmHg);
  const seriesPressure = outputs.map((output) => output.seriesPressureMmHg);
  const activePeakIndex = maxIndex(activePressure);
  const pressureShape = computeShapeQualityMetricsV1(pressure);
  const result = {
    fixtureId: fixture.fixtureId,
    chamberId: fixture.chamberId,
    status: "pass" as const,
    pressurePeakMmHg: round(Math.max(...pressure)),
    pressureMinMmHg: round(Math.min(...pressure)),
    pressurePulseMmHg: round(Math.max(...pressure) - Math.min(...pressure)),
    activePressurePeakMmHg: round(Math.max(...activePressure)),
    passivePressurePeakMmHg: round(Math.max(...passivePressure)),
    seriesPressurePeakMmHg: round(Math.max(...seriesPressure)),
    activePeakTheta: round(activePeakIndex / Math.max(outputs.length, 1)),
    maxAbsLSiVelocityNormPerSec: round(Math.max(...outputs.map((output) => Math.abs(output.fiber.lSiDot)))),
    pressureShape,
    allFinite: outputs.every((output) => Object.values(output).every((value) =>
      typeof value !== "number" || Number.isFinite(value)
    )),
    failureReasons: [] as readonly string[],
  };
  const failureReasons = failureReasonsFor(result, fixture);
  return { ...result, status: failureReasons.length === 0 ? "pass" : "fail", failureReasons };
}

function replayFixture(fixture: AtrialVolumeFixtureV1): readonly AtrialFiberChamberOutputV1[] {
  const params = DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1[fixture.chamberId];
  let state = initialAtrialFiberChamberStateV1(fixture.volumeMl[0]!, params);
  const outputs: AtrialFiberChamberOutputV1[] = [];
  for (let i = 0; i < fixture.volumeMl.length; i++) {
    const tSec = i / fixture.sampleRateHz;
    const dtSec = 1 / fixture.sampleRateHz;
    const cavityVolumeMl = fixture.volumeMl[i]!;
    const previousCavityVolumeMl = fixture.volumeMl[Math.max(0, i - 1)] ?? cavityVolumeMl;
    const output = stepAtrialFiberChamberV1(state, {
      tSec,
      dtSec,
      cycleLengthSec: fixture.cycleLengthSec,
      activationTimeSec: fixture.activationTimeSec,
      cavityVolumeMl,
      previousCavityVolumeMl,
    }, params);
    outputs.push(output);
    state = output.state;
  }
  return outputs;
}

function failureReasonsFor(
  result: Omit<AtrialFixtureResultV1, "status" | "failureReasons">,
  fixture: AtrialVolumeFixtureV1,
): readonly string[] {
  const failures: string[] = [];
  const [minPeak, maxPeak] = fixture.expectedPressurePeakRangeMmHg;
  if (!result.allFinite) failures.push("non-finite-output");
  if (result.pressurePeakMmHg < minPeak) failures.push("pressure-peak-too-low");
  if (result.pressurePeakMmHg > maxPeak) failures.push("pressure-peak-too-high");
  if (result.pressurePulseMmHg < (fixture.chamberId === "LA" ? 2.5 : 1.5)) failures.push("pressure-pulse-too-low");
  if (result.activePressurePeakMmHg < 0.75) failures.push("active-pressure-too-low");
  if (result.activePeakTheta < 0.66 || result.activePeakTheta > 0.9) failures.push("active-peak-not-late-diastolic");
  if (result.pressureShape.c1ContinuityScore > 0.34) failures.push("pressure-c1-rough");
  if (result.pressureShape.dYdtSpikeRatio > 20) failures.push("pressure-derivative-spiky");
  if (result.maxAbsLSiVelocityNormPerSec > 1.6) failures.push("intrinsic-length-velocity-too-high");
  return failures;
}

function volumeAtTheta(chamberId: AtrialFiberChamberIdV1, scale: number, theta: number): number {
  const points = chamberId === "LA"
    ? [[0, 38], [0.35, 56], [0.62, 44], [0.78, 35], [1, 38]]
    : [[0, 50], [0.35, 70], [0.62, 55], [0.78, 45], [1, 50]];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const next = points[i]!;
    if (theta <= next[0]!) {
      const local = (theta - prev[0]!) / Math.max(next[0]! - prev[0]!, 1e-9);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * local);
      return scale * (prev[1]! + eased * (next[1]! - prev[1]!));
    }
  }
  return scale * points.at(-1)![1]!;
}

function maxIndex(values: readonly number[]): number {
  let bestIndex = 0;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i++) {
    if (values[i]! > bestValue) {
      bestIndex = i;
      bestValue = values[i]!;
    }
  }
  return bestIndex;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
