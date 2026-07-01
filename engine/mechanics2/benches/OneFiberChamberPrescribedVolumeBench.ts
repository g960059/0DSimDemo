import {
  DEFAULT_ONE_FIBER_CHAMBER_PARAMS_V1,
  initialOneFiberChamberStateV1,
  stepOneFiberChamberV1,
  type OneFiberChamberOutputV1,
} from "@/engine/mechanics2/chamber/OneFiberChamberV1";
import {
  REQUIRED_ONE_FIBER_CHAMBER_FIXTURE_IDS_V1,
  buildPrescribedVolumeFixturesV1,
  validatePrescribedVolumeFixtureV1,
  type PrescribedVolumeFixtureV1,
} from "@/engine/mechanics2/fixtures/PrescribedVolumeFixtureV1";
import {
  computeShapeQualityMetricsV1,
  type ShapeQualityMetricsV1,
} from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";

export const ONE_FIBER_CHAMBER_PRESCRIBED_VOLUME_REPORT_ID_V1 =
  "one-fiber-chamber-prescribed-volume-report-v1" as const;

export type OneFiberChamberFixtureResultV1 = {
  readonly fixtureId: string;
  readonly chamber: "LV" | "RV";
  readonly status: "pass" | "fail" | "inconclusive";
  readonly fixtureErrors: readonly string[];
  readonly pressurePeakMmHg: number | null;
  readonly pressureMinMmHg: number | null;
  readonly pressurePulseMmHg: number | null;
  readonly maxActivePressureMmHg: number | null;
  readonly maxPassivePressureMmHg: number | null;
  readonly maxSeriesPressureMmHg: number | null;
  readonly maxWallTensionNPerM: number | null;
  readonly maxSeriesEnergyProxy: number | null;
  readonly pressureShape: ShapeQualityMetricsV1;
  readonly lSShape: ShapeQualityMetricsV1;
  readonly allFinite: boolean;
  readonly failureReasons: readonly string[];
};

export type OneFiberChamberPrescribedVolumeReportV1 = {
  readonly reportId: typeof ONE_FIBER_CHAMBER_PRESCRIBED_VOLUME_REPORT_ID_V1;
  readonly gateId: "oneFiberChamberPrescribedVolumeGateV1";
  readonly upstreamReplayGate: {
    readonly requiredGateId: "hillSeriesFiberReplayGateV1";
    readonly mayProceedRequired: true;
  };
  readonly fixtureResults: readonly OneFiberChamberFixtureResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
    readonly cleanNormalFixtureCount: number;
    readonly smoothedRejectedFixtureCount: number;
  };
  readonly decision: {
    readonly mayProceedToLeftHeartStrategicGate: boolean;
    readonly mayProceedToValveBench: boolean;
    readonly reason: string;
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly closedLoopMorphologyAcceptance: false;
    readonly circAdaptEquivalence: false;
    readonly patientScalePressureCalibration: false;
  };
};

export function runOneFiberChamberPrescribedVolumeBenchV1(
  fixtures: readonly PrescribedVolumeFixtureV1[] = buildPrescribedVolumeFixturesV1(),
): OneFiberChamberPrescribedVolumeReportV1 {
  const requiredIds = new Set(REQUIRED_ONE_FIBER_CHAMBER_FIXTURE_IDS_V1);
  const fixtureIds = new Set(fixtures.map((fixture) => fixture.fixtureId));
  const missing = [...requiredIds].filter((id) => !fixtureIds.has(id));
  const fixtureResults = fixtures.map(evaluateFixture);
  const pass = fixtureResults.filter((result) => result.status === "pass").length;
  const fail = fixtureResults.filter((result) => result.status === "fail").length + missing.length;
  const inconclusive = fixtureResults.filter((result) => result.status === "inconclusive").length;
  const total = fixtureResults.length + missing.length;
  const normalFixtures = fixtureResults.filter((result) => !result.fixtureId.includes("wiggle"));
  const rejectedFixtures = fixtureResults.filter((result) => result.fixtureId.includes("wiggle"));
  const cleanNormalFixtureCount = normalFixtures.filter((result) => result.status === "pass").length;
  const smoothedRejectedFixtureCount = rejectedFixtures.filter((result) =>
    result.status === "pass"
    && result.pressureShape.dominantPeakCount <= 1
    && result.pressureShape.c1ContinuityScore <= 0.28
  ).length;
  const mayProceedToLeftHeartStrategicGate =
    missing.length === 0
    && inconclusive === 0
    && cleanNormalFixtureCount === normalFixtures.length
    && smoothedRejectedFixtureCount === rejectedFixtures.length;
  return {
    reportId: ONE_FIBER_CHAMBER_PRESCRIBED_VOLUME_REPORT_ID_V1,
    gateId: "oneFiberChamberPrescribedVolumeGateV1",
    upstreamReplayGate: {
      requiredGateId: "hillSeriesFiberReplayGateV1",
      mayProceedRequired: true,
    },
    fixtureResults,
    summary: {
      total,
      pass,
      fail,
      inconclusive,
      cleanNormalFixtureCount,
      smoothedRejectedFixtureCount,
    },
    decision: {
      mayProceedToLeftHeartStrategicGate,
      mayProceedToValveBench: true,
      reason: mayProceedToLeftHeartStrategicGate
        ? "Prescribed-volume one-fiber chamber pressure mapping stayed finite, broad, and single-dome on the initial normal and wiggle fixtures."
        : "Prescribed-volume one-fiber chamber pressure mapping did not pass the initial sidecar fixture set.",
    },
    claimBoundary: {
      runtimeWiring: false,
      closedLoopMorphologyAcceptance: false,
      circAdaptEquivalence: false,
      patientScalePressureCalibration: false,
    },
  };
}

function evaluateFixture(fixture: PrescribedVolumeFixtureV1): OneFiberChamberFixtureResultV1 {
  const fixtureErrors = validatePrescribedVolumeFixtureV1(fixture);
  if (fixtureErrors.length > 0) return emptyResult(fixture, "inconclusive", fixtureErrors);
  const outputs = replayFixture(fixture);
  const pressure = outputs.map((output) => output.pressureRawMmHg);
  const lS = outputs.map((output) => output.lS);
  const pressureShape = computeShapeQualityMetricsV1(pressure);
  const lSShape = computeShapeQualityMetricsV1(lS);
  const allFinite = outputs.every((output) => Object.values(output).every((value) =>
    typeof value !== "number" || Number.isFinite(value)
  ));
  const result = {
    fixtureId: fixture.fixtureId,
    chamber: fixture.chamber,
    status: "pass" as const,
    fixtureErrors,
    pressurePeakMmHg: finiteMaxOrNull(pressure),
    pressureMinMmHg: finiteMinOrNull(pressure),
    pressurePulseMmHg: finiteRangeOrNull(pressure),
    maxActivePressureMmHg: finiteMaxOrNull(outputs.map((output) => output.activePressureMmHg)),
    maxPassivePressureMmHg: finiteMaxOrNull(outputs.map((output) => output.passivePressureMmHg)),
    maxSeriesPressureMmHg: finiteMaxOrNull(outputs.map((output) => output.seriesPressureMmHg)),
    maxWallTensionNPerM: finiteMaxOrNull(outputs.map((output) => output.wallTensionNPerM)),
    maxSeriesEnergyProxy: finiteMaxOrNull(outputs.map((output) => output.energyProxy)),
    pressureShape,
    lSShape,
    allFinite,
    failureReasons: [],
  };
  const failureReasons = failureReasonsFor(result, fixture);
  return { ...result, status: failureReasons.length === 0 ? "pass" : "fail", failureReasons };
}

function replayFixture(fixture: PrescribedVolumeFixtureV1): readonly OneFiberChamberOutputV1[] {
  const params = {
    ...DEFAULT_ONE_FIBER_CHAMBER_PARAMS_V1[fixture.chamber],
    wallVolumeMl: fixture.wallVolumeMl,
    referenceCavityVolumeMl: fixture.referenceCavityVolumeMl,
  };
  let state = initialOneFiberChamberStateV1(fixture.volumeMl[0]!, params);
  const outputs: OneFiberChamberOutputV1[] = [];
  for (let i = 0; i < fixture.timeSec.length; i++) {
    const tSec = fixture.timeSec[i]!;
    const dtSec = i === 0 ? 1 / fixture.sampleRateHz : tSec - fixture.timeSec[i - 1]!;
    const cavityVolumeMl = fixture.volumeMl[i]!;
    const previousCavityVolumeMl = fixture.volumeMl[Math.max(0, i - 1)] ?? cavityVolumeMl;
    const output = stepOneFiberChamberV1(state, {
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
  result: Omit<OneFiberChamberFixtureResultV1, "status" | "failureReasons">,
  fixture: PrescribedVolumeFixtureV1,
): readonly string[] {
  const failures: string[] = [];
  if (!result.allFinite) failures.push("non-finite-output");
  if ((result.pressurePulseMmHg ?? 0) < (fixture.chamber === "LV" ? 35 : 10)) failures.push("pressure-pulse-too-low");
  if ((result.pressurePeakMmHg ?? 0) > (fixture.chamber === "LV" ? 260 : 110)) failures.push("pressure-peak-too-high");
  if (result.pressureShape.dominantPeakCount > 1) failures.push("pressure-multipeak");
  if ((result.pressureShape.secondaryPeakProminenceRatio ?? 0) > 0.12) failures.push("secondary-pressure-peak-prominent");
  if ((result.pressureShape.fwhmFractionOfWindow ?? 0) < 0.08) failures.push("pressure-too-narrow");
  if ((result.pressureShape.fwhmFractionOfWindow ?? 1) > 0.48) failures.push("pressure-too-wide");
  if (result.pressureShape.c1ContinuityScore > (fixture.annotation.ownerRejected ? 0.32 : 0.24)) {
    failures.push("pressure-c1-rough");
  }
  if (result.pressureShape.dYdtSpikeRatio > 18) failures.push("pressure-derivative-spiky");
  return failures;
}

function emptyResult(
  fixture: PrescribedVolumeFixtureV1,
  status: OneFiberChamberFixtureResultV1["status"],
  fixtureErrors: readonly string[],
): OneFiberChamberFixtureResultV1 {
  const emptyShape = computeShapeQualityMetricsV1([]);
  return {
    fixtureId: fixture.fixtureId,
    chamber: fixture.chamber,
    status,
    fixtureErrors,
    pressurePeakMmHg: null,
    pressureMinMmHg: null,
    pressurePulseMmHg: null,
    maxActivePressureMmHg: null,
    maxPassivePressureMmHg: null,
    maxSeriesPressureMmHg: null,
    maxWallTensionNPerM: null,
    maxSeriesEnergyProxy: null,
    pressureShape: emptyShape,
    lSShape: emptyShape,
    allFinite: false,
    failureReasons: fixtureErrors,
  };
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function finiteMinOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.min(...finite)) : null;
}

function finiteRangeOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite) - Math.min(...finite)) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
