import {
  DEFAULT_FLOW_STATE_VALVE_PARAMS_V1,
  initialFlowStateValveStateV1,
  stepFlowStateValveV1,
  type FlowStateValveOutputV1,
} from "@/engine/mechanics2/valve/FlowStateValveV1";
import {
  REQUIRED_PRESCRIBED_GRADIENT_VALVE_FIXTURE_IDS_V1,
  buildPrescribedGradientValveFixturesV1,
  validatePrescribedGradientValveFixtureV1,
  type PrescribedGradientValveFixtureV1,
} from "@/engine/mechanics2/fixtures/PrescribedGradientValveFixtureV1";
import { computeShapeQualityMetricsV1, type ShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";

export const FLOW_STATE_VALVE_PRESCRIBED_GRADIENT_REPORT_ID_V1 =
  "flow-state-valve-prescribed-gradient-report-v1" as const;

export type FlowStateValveFixtureResultV1 = {
  readonly fixtureId: string;
  readonly valveId: "MV" | "TV";
  readonly status: "pass" | "fail" | "inconclusive";
  readonly fixtureErrors: readonly string[];
  readonly peakForwardFlowMlPerSec: number | null;
  readonly forwardPeakCount: number;
  readonly regurgitantFraction: number | null;
  readonly maxOpen01: number | null;
  readonly maxAbsPressureFlowResidualMmHg: number | null;
  readonly maxReverseProjectionMlPerSec: number | null;
  readonly flowShape: ShapeQualityMetricsV1;
  readonly openShape: ShapeQualityMetricsV1;
  readonly allFinite: boolean;
  readonly failureReasons: readonly string[];
};

export type FlowStateValvePrescribedGradientReportV1 = {
  readonly reportId: typeof FLOW_STATE_VALVE_PRESCRIBED_GRADIENT_REPORT_ID_V1;
  readonly gateId: "flowStateValvePrescribedGradientGateV1";
  readonly fixtureResults: readonly FlowStateValveFixtureResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
    readonly cleanBiphasicCount: number;
  };
  readonly decision: {
    readonly mayProceedToLeftHeartStrategicGate: boolean;
    readonly reason: string;
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly closedLoopMorphologyAcceptance: false;
    readonly valveTuning: false;
  };
};

export function runFlowStateValvePrescribedGradientBenchV1(
  fixtures: readonly PrescribedGradientValveFixtureV1[] = buildPrescribedGradientValveFixturesV1(),
): FlowStateValvePrescribedGradientReportV1 {
  const requiredIds = new Set(REQUIRED_PRESCRIBED_GRADIENT_VALVE_FIXTURE_IDS_V1);
  const fixtureIds = new Set(fixtures.map((fixture) => fixture.fixtureId));
  const missing = [...requiredIds].filter((id) => !fixtureIds.has(id));
  const fixtureResults = fixtures.map(evaluateFixture);
  const pass = fixtureResults.filter((result) => result.status === "pass").length;
  const fail = fixtureResults.filter((result) => result.status === "fail").length + missing.length;
  const inconclusive = fixtureResults.filter((result) => result.status === "inconclusive").length;
  const total = fixtureResults.length + missing.length;
  const cleanBiphasicCount = fixtureResults.filter((result) =>
    result.status === "pass" && result.forwardPeakCount === 2
  ).length;
  const mayProceedToLeftHeartStrategicGate =
    missing.length === 0 && inconclusive === 0 && cleanBiphasicCount === fixtureResults.length;
  return {
    reportId: FLOW_STATE_VALVE_PRESCRIBED_GRADIENT_REPORT_ID_V1,
    gateId: "flowStateValvePrescribedGradientGateV1",
    fixtureResults,
    summary: { total, pass, fail, inconclusive, cleanBiphasicCount },
    decision: {
      mayProceedToLeftHeartStrategicGate,
      reason: mayProceedToLeftHeartStrategicGate
        ? "FlowStateValveV1 produced clean finite E/A-like biphasic flow on all prescribed MV/TV gradient fixtures."
        : "FlowStateValveV1 did not produce clean finite biphasic flow on the initial prescribed-gradient fixture set.",
    },
    claimBoundary: {
      runtimeWiring: false,
      closedLoopMorphologyAcceptance: false,
      valveTuning: false,
    },
  };
}

function evaluateFixture(fixture: PrescribedGradientValveFixtureV1): FlowStateValveFixtureResultV1 {
  const fixtureErrors = validatePrescribedGradientValveFixtureV1(fixture);
  if (fixtureErrors.length > 0) return emptyResult(fixture, "inconclusive", fixtureErrors);
  const outputs = replayFixture(fixture);
  const flow = outputs.map((output) => output.qMlPerSec);
  const open = outputs.map((output) => output.open01);
  const activeOutputs = outputs.filter((output) => output.open01 > 0.15 || output.qMlPerSec > 10);
  const forwardPeakCount = positivePeakCount(flow);
  const forwardVolume = integrate(flow.map((value) => Math.max(0, value)), fixture);
  const reverseVolume = integrate(flow.map((value) => Math.max(0, -value)), fixture);
  const result = {
    fixtureId: fixture.fixtureId,
    valveId: fixture.valveId,
    status: "pass" as const,
    fixtureErrors,
    peakForwardFlowMlPerSec: finiteMaxOrNull(flow),
    forwardPeakCount,
    regurgitantFraction: forwardVolume > 1e-9 ? reverseVolume / forwardVolume : null,
    maxOpen01: finiteMaxOrNull(open),
    maxAbsPressureFlowResidualMmHg: finiteMaxOrNull(activeOutputs.map((output) => Math.abs(output.pressureFlowResidualMmHg))),
    maxReverseProjectionMlPerSec: finiteMaxOrNull(outputs.map((output) => Math.abs(output.reverseProjectionMlPerSec))),
    flowShape: computeShapeQualityMetricsV1(flow),
    openShape: computeShapeQualityMetricsV1(open),
    allFinite: outputs.every((output) => Object.values(output).every((value) =>
      typeof value !== "number" || Number.isFinite(value)
    )),
    failureReasons: [],
  };
  const failureReasons = failureReasonsFor(result, fixture);
  return { ...result, status: failureReasons.length === 0 ? "pass" : "fail", failureReasons };
}

function replayFixture(fixture: PrescribedGradientValveFixtureV1): readonly FlowStateValveOutputV1[] {
  let state = initialFlowStateValveStateV1();
  const outputs: FlowStateValveOutputV1[] = [];
  const params = DEFAULT_FLOW_STATE_VALVE_PARAMS_V1[fixture.valveId];
  for (let i = 0; i < fixture.timeSec.length; i++) {
    const dtSec = i === 0 ? 1 / fixture.sampleRateHz : fixture.timeSec[i]! - fixture.timeSec[i - 1]!;
    const output = stepFlowStateValveV1(state, {
      dtSec,
      upstreamPressureMmHg: fixture.upstreamPressureMmHg[i]!,
      downstreamPressureMmHg: fixture.downstreamPressureMmHg[i]!,
    }, params);
    outputs.push(output);
    state = output.state;
  }
  return outputs;
}

function failureReasonsFor(
  result: Omit<FlowStateValveFixtureResultV1, "status" | "failureReasons">,
  fixture: PrescribedGradientValveFixtureV1,
): readonly string[] {
  const failures: string[] = [];
  if (!result.allFinite) failures.push("non-finite-output");
  if (result.forwardPeakCount !== fixture.expectedForwardPeakCount) failures.push("forward-flow-not-biphasic");
  if ((result.peakForwardFlowMlPerSec ?? 0) < (fixture.valveId === "MV" ? 30 : 20)) failures.push("forward-flow-too-small");
  if ((result.regurgitantFraction ?? 1) > 0.02) failures.push("regurgitant-fraction-too-large");
  if ((result.maxOpen01 ?? 0) < 0.45) failures.push("valve-does-not-open");
  if ((result.maxAbsPressureFlowResidualMmHg ?? 999) > 1.2) failures.push("pressure-flow-residual-too-large");
  if (result.flowShape.c1ContinuityScore > 0.34) failures.push("flow-c1-kink");
  return failures;
}

function positivePeakCount(values: readonly number[]): number {
  const maxValue = Math.max(0, ...values);
  const threshold = Math.max(10, 0.12 * maxValue);
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur > threshold && cur > values[i - 1]! && cur >= values[i + 1]!) peaks.push(i);
  }
  return mergeNearbyPeaks(peaks, 10).length;
}

function mergeNearbyPeaks(indices: readonly number[], minSeparation: number): readonly number[] {
  const out: number[] = [];
  for (const index of indices) {
    const last = out.at(-1);
    if (last == null || index - last > minSeparation) out.push(index);
    else if (index > last) out[out.length - 1] = index;
  }
  return out;
}

function integrate(values: readonly number[], fixture: PrescribedGradientValveFixtureV1): number {
  let area = 0;
  for (let i = 1; i < values.length; i++) {
    const dt = fixture.timeSec[i]! - fixture.timeSec[i - 1]!;
    area += 0.5 * dt * (values[i - 1]! + values[i]!);
  }
  return area;
}

function emptyResult(
  fixture: PrescribedGradientValveFixtureV1,
  status: FlowStateValveFixtureResultV1["status"],
  fixtureErrors: readonly string[],
): FlowStateValveFixtureResultV1 {
  const emptyShape = computeShapeQualityMetricsV1([]);
  return {
    fixtureId: fixture.fixtureId,
    valveId: fixture.valveId,
    status,
    fixtureErrors,
    peakForwardFlowMlPerSec: null,
    forwardPeakCount: 0,
    regurgitantFraction: null,
    maxOpen01: null,
    maxAbsPressureFlowResidualMmHg: null,
    maxReverseProjectionMlPerSec: null,
    flowShape: emptyShape,
    openShape: emptyShape,
    allFinite: false,
    failureReasons: fixtureErrors,
  };
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
