import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import {
  createMainWireIntegratedModelSelectedAorticOutflowFixtureV1,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

export const MAIN_WIRE_STANDARD66_PROXIMAL_ARTERIAL_DT_AUDIT_V1_ID =
  "main-wire-standard66-proximal-arterial-dt-audit-v1" as const;

type Trace = readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
type SignalId = "LVP" | "AoNode" | "AoP" | "RVP" | "PAP" | "AoV" | "PV";

const armId = argument("--arm");
const cycleCount = integerArgument("--cycles", 8);
const dtValuesSec = argument("--dt", "0.002,0.001,0.0005")
  .split(",")
  .map((value) => Number(value));
const outputPath = path.resolve(argument(
  "--output",
  `artifacts/proximal-arterial-ringing/${armId}-dt-audit.json`,
));

const runs = dtValuesSec.map((nominalDtSec) => {
  if (!(nominalDtSec > 0) || !Number.isFinite(nominalDtSec)) {
    throw new Error("all --dt values must be positive and finite");
  }
  const fixture = createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
  // The cycle executor's public parameter is inferred from the older regular
  // fixture factory even though it only reads the common assembled fields.
  // The selected Standard66 fixture is produced by that same assembler, and
  // this explicit research-boundary cast keeps the audit on the selected
  // construction rather than silently substituting the regular fixture.
  const cycleFixture = fixture as unknown as Parameters<
    typeof runMainWireIntegratedModelRegularSinusAllOffCycleV3
  >[0];
  let accepted = fixture.cold.acceptedState;
  let terminalTrace: Trace = Object.freeze([]);
  for (let cycleIndex = 1; cycleIndex <= cycleCount; cycleIndex += 1) {
    const cycle = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      cycleFixture,
      accepted,
      cycleIndex,
      nominalDtSec,
    );
    accepted = cycle.terminalAcceptedState;
    terminalTrace = cycle.traceSamples;
  }
  return Object.freeze({
    nominalDtSec,
    terminalAcceptedTimeSec: accepted.acceptedTimeSec,
    acceptedStepCount: terminalTrace.length,
    aorticEjection: ejectionSummary(terminalTrace, "AoV"),
    pulmonaryEjection: ejectionSummary(terminalTrace, "PV"),
    papCycle: signalSummary(terminalTrace, "PAP", 0, terminalTrace.length - 1),
  });
});

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_STANDARD66_PROXIMAL_ARTERIAL_DT_AUDIT_V1_ID,
  armId,
  construction: Object.freeze({
    characteristicImpedanceResistanceMmHgSecPerMl:
      MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1
        .characteristicImpedanceResistanceMmHgSecPerMl,
    residualDownstreamResistanceMmHgSecPerMl:
      MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1
        .residualDownstreamResistanceMmHgSecPerMl,
    aorticRootInertanceMmHgSec2PerMl:
      MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1
        .ascendingAorticInertanceMmHgSec2PerMl,
  }),
  design: Object.freeze({
    cycleCount,
    dtValuesSec: Object.freeze(dtValuesSec),
    independentColdStartAtEveryDt: true as const,
    identicalPhysicalHorizonAtEveryDt: true as const,
    smoothingApplied: false as const,
    parameterSearchOrFitting: false as const,
  }),
  runs: Object.freeze(runs),
});
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ outputPath, runs })}\n`);

function ejectionSummary(trace: Trace, flowId: "AoV" | "PV") {
  const episodes = positiveEpisodes(trace, flowId);
  const [start, end] = episodes.at(-1)
    ?? (() => { throw new Error(`${flowId} has no positive-flow episode`); })();
  const pressureIds: readonly SignalId[] = flowId === "AoV"
    ? ["LVP", "AoP", "AoNode"]
    : ["RVP", "PAP"];
  return Object.freeze({
    startTimeSec: trace[start]!.acceptedTimeSec,
    endTimeSec: trace[end]!.acceptedTimeSec,
    positiveFlowDurationSec: trace.slice(start, end + 1).reduce(
      (sum, sample) => sum + sample.acceptedDtSec,
      0,
    ),
    flow: signalSummary(trace, flowId, start, end),
    pressure: Object.freeze(Object.fromEntries(pressureIds.map((signalId) =>
      [signalId, signalSummary(trace, signalId, start, end)]))),
  });
}

function signalSummary(
  trace: Trace,
  signalId: SignalId,
  start: number,
  end: number,
) {
  const segment = trace.slice(start, end + 1).map((sample) =>
    signal(sample, signalId));
  return Object.freeze({
    minimum: Math.min(...segment),
    maximum: Math.max(...segment),
    extrema: Object.freeze(extrema(trace, signalId, start, end)),
  });
}

function extrema(
  trace: Trace,
  signalId: SignalId,
  start: number,
  end: number,
) {
  const result: Array<Readonly<{
    kind: "maximum" | "minimum";
    timeSec: number;
    value: number;
  }>> = [];
  for (
    let index = Math.max(1, start);
    index <= Math.min(end, trace.length - 2);
    index += 1
  ) {
    const previous = signal(trace[index - 1]!, signalId);
    const current = signal(trace[index]!, signalId);
    const next = signal(trace[index + 1]!, signalId);
    if (current > previous && current >= next) {
      result.push(Object.freeze({
        kind: "maximum" as const,
        timeSec: trace[index]!.acceptedTimeSec,
        value: current,
      }));
    }
    if (current < previous && current <= next) {
      result.push(Object.freeze({
        kind: "minimum" as const,
        timeSec: trace[index]!.acceptedTimeSec,
        value: current,
      }));
    }
  }
  return result;
}

function positiveEpisodes(trace: Trace, flowId: "AoV" | "PV") {
  const result: Array<readonly [number, number]> = [];
  let start: number | null = null;
  for (let index = 0; index < trace.length; index += 1) {
    const positive = signal(trace[index]!, flowId) > 0;
    if (positive && start === null) start = index;
    if (!positive && start !== null) {
      result.push(Object.freeze([start, index - 1] as const));
      start = null;
    }
  }
  if (start !== null) result.push(Object.freeze([start, trace.length - 1] as const));
  return result;
}

function signal(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  signalId: SignalId,
): number {
  switch (signalId) {
    case "LVP": return sample.absolutePressureMmHg.LV;
    case "AoNode": return sample.absolutePressureMmHg.Ao;
    case "AoP": return sample.absolutePressureMmHg.Ao
      + MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1
        .characteristicImpedanceResistanceMmHgSecPerMl
      * sample.valveFlowMlPerSec.AoV;
    case "RVP": return sample.absolutePressureMmHg.RV;
    case "PAP": return sample.absolutePressureMmHg.PA;
    case "AoV": return sample.valveFlowMlPerSec.AoV;
    case "PV": return sample.valveFlowMlPerSec.PV;
  }
}

function argument(name: string, fallback?: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) {
    if (fallback !== undefined) return fallback;
    throw new Error(`${name} is required`);
  }
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function integerArgument(name: string, fallback: number): number {
  const value = Number(argument(name, String(fallback)));
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}
