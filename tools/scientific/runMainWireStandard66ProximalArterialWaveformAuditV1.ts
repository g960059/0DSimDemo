import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import { buildEdges } from "@/engine/core/topology";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";

export const MAIN_WIRE_STANDARD66_PROXIMAL_ARTERIAL_WAVEFORM_AUDIT_V1_ID =
  "main-wire-standard66-proximal-arterial-waveform-audit-v1" as const;

const outputIds = Object.freeze([
  "hemodynamics.pressure.absolute.LV",
  "hemodynamics.pressure.absolute.Ao",
  "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port",
  "hemodynamics.pressure.absolute.RV",
  "hemodynamics.pressure.absolute.PA",
  "hemodynamics.flow.valve.AoV",
  "hemodynamics.flow.valve.PV",
  "hemodynamics.flow.pulmonary.PA_PArt",
] as const);

const terminalMetricIds = Object.freeze([
  "hemodynamics.pressure.mean.Ao",
  "hemodynamics.pressure.systolic.Ao",
  "hemodynamics.pressure.diastolic.Ao",
  "hemodynamics.pressure.mean.SA",
  "hemodynamics.pressure.mean.PA",
  "hemodynamics.pressure.systolic.PA",
  "hemodynamics.pressure.diastolic.PA",
  "hemodynamics.pressure.mean.LA",
  "hemodynamics.pressure.mean.RA",
  "hemodynamics.stroke-volume.LV-event-defined",
  "hemodynamics.stroke-volume.RV-event-defined",
  "hemodynamics.ejection-fraction.LV-event-defined",
  "hemodynamics.ejection-fraction.RV-event-defined",
  "hemodynamics.output.native-left",
  "hemodynamics.output.native-right",
  "hemodynamics.pressure-gradient.valve.mean-hydraulic-forward.AoV",
  "hemodynamics.pressure-gradient.valve.peak-hydraulic-forward.AoV",
  "hemodynamics.pressure-rate.maximum-accepted-step.absolute.LV",
  "hemodynamics.pressure-rate.minimum-accepted-step.absolute.LV",
  "hemodynamics.pressure-rate.maximum-accepted-step.absolute.RV",
  "hemodynamics.pressure-rate.minimum-accepted-step.absolute.RV",
] as const);

type SignalId = "LVP" | "AoNode" | "AoP" | "RVP" | "PAP"
  | "AoV" | "PV" | "PA_PArt";
type Sample = Readonly<Record<SignalId, number> & { timeSec: number }>;
type Extremum = Readonly<{
  kind: "maximum" | "minimum";
  timeSec: number;
  value: number;
}>;

const armId = argument("--arm");
const durationSec = numberArgument("--duration-sec", 20);
const outputPath = path.resolve(argument(
  "--output",
  `artifacts/proximal-arterial-ringing/${armId}.json`,
));
const stepCount = Math.round(durationSec / 0.002);
if (Math.abs(stepCount * 0.002 - durationSec) > 1e-12) {
  throw new Error("duration must be an exact multiple of 0.002 seconds");
}

const host = new MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1();
const runtimeSessionId = `proximal-arterial-waveform-audit/${armId}`;
const scenarioId = "baseline";
await host.createSession(runtimeSessionId, [{
  scenarioId,
  fixture: MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
}]);

const samples: Sample[] = [];
for (let offset = 0; offset < stepCount;) {
  const count = Math.min(256, stepCount - offset);
  const batch = host.advancePresentationBatch(
    runtimeSessionId,
    scenarioId,
    count,
    outputIds,
  );
  for (let index = 0; index < count; index += 1) {
    const value = (outputIndex: number): number => {
      const candidate = batch.outputValues[index * outputIds.length + outputIndex];
      if (!Number.isFinite(candidate)) {
        throw new Error(`unavailable value at ${offset + index}/${outputIndex}`);
      }
      return candidate;
    };
    samples.push(Object.freeze({
      timeSec: batch.acceptedTimesSec[index]!,
      LVP: value(0),
      AoNode: value(1),
      AoP: value(2),
      RVP: value(3),
      PAP: value(4),
      AoV: value(5),
      PV: value(6),
      PA_PArt: value(7),
    }));
  }
  offset += count;
}
const terminalFrame = host.currentFrame(runtimeSessionId, scenarioId);
host.closeSession(runtimeSessionId);

const aorticEjectionEpisodes = positiveEpisodes(samples, "AoV")
  .filter(([start, end]) => completeOneSecondBeat(samples, start, end));
const pulmonaryEjectionEpisodes = positiveEpisodes(samples, "PV")
  .filter(([start, end]) => completeOneSecondBeat(samples, start, end));
const completeBeatIndices = Array.from(
  { length: Math.max(0, Math.floor(durationSec) - 1) },
  (_, index) => index + 1,
);
const topology = buildEdges();
const aoSa = requiredEdge(topology, "Ao_SA");
const paPart = requiredEdge(topology, "PA_PArt");
const pArtPCap = requiredEdge(topology, "PArt_PCap");
const selected = MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1;

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_STANDARD66_PROXIMAL_ARTERIAL_WAVEFORM_AUDIT_V1_ID,
  armId,
  construction: Object.freeze({
    aorticRootEdgeKind: aoSa.kind,
    aorticCharacteristicImpedanceResistanceMmHgSecPerMl:
      selected.characteristicImpedanceResistanceMmHgSecPerMl,
    aorticResidualDownstreamResistanceMmHgSecPerMl:
      selected.residualDownstreamResistanceMmHgSecPerMl,
    aorticTotalProximalResistanceMmHgSecPerMl:
      selected.characteristicImpedanceResistanceMmHgSecPerMl
      + selected.residualDownstreamResistanceMmHgSecPerMl,
    aorticRootInertanceMmHgSec2PerMl:
      aoSa.kind === "dynamic"
        ? selected.ascendingAorticInertanceMmHgSec2PerMl
        : null,
    pulmonaryRootEdgeKind: paPart.kind,
    pulmonaryRootResistanceMmHgSecPerMl: paPart.R,
    pulmonaryRootInertanceMmHgSec2PerMl:
      paPart.kind === "dynamic" ? paPart.L ?? null : null,
    pulmonaryNextResistanceMmHgSecPerMl: pArtPCap.R,
    pulmonaryTwoEdgeResistanceSumMmHgSecPerMl: paPart.R + pArtPCap.R,
    sourceTopologyReadback: Object.freeze({
      aoSaResistanceMmHgSecPerMl: aoSa.R,
      aoSaInertanceMmHgSec2PerMl:
        aoSa.kind === "dynamic" ? aoSa.L ?? null : null,
    }),
  }),
  protocol: Object.freeze({
    durationSec,
    presentationIntervalSec: 0.002 as const,
    exactPresentationBoundaryCount: samples.length,
    coldStart: true as const,
    parameterSearchOrFitting: false as const,
    smoothingApplied: false as const,
  }),
  aorticEjection: Object.freeze(aorticEjectionEpisodes.map(
    ([start, end], index) => pressureEpisodeSummary(
      samples,
      start,
      end,
      aorticEjectionEpisodes[index - 1]?.[0] ?? null,
      "AoV",
      ["LVP", "AoP", "AoNode"],
    ),
  )),
  pulmonaryEjection: Object.freeze(pulmonaryEjectionEpisodes.map(
    ([start, end], index) => pressureEpisodeSummary(
      samples,
      start,
      end,
      pulmonaryEjectionEpisodes[index - 1]?.[0] ?? null,
      "PV",
      ["RVP", "PAP"],
    ),
  )),
  pulmonaryCycle: Object.freeze(completeBeatIndices.map((beatIndex) =>
    pulmonaryCycleSummary(samples, beatIndex))),
  terminalExactMetrics: Object.freeze(Object.fromEntries(
    terminalMetricIds.map((outputId) => [
      outputId,
      terminalMetricValue(terminalFrame.outputs[outputId], outputId),
    ]),
  )),
  interpretationBoundary: Object.freeze({
    rawAcceptedExactOutputsOnly: true as const,
    extremaUseStrictAdjacentSampleSignChange: true as const,
    morphologyAcceptanceThresholdApplied: false as const,
    clinicalValidationClaimed: false as const,
    intendedUse: "factorized-causal-mechanism-ablation" as const,
  }),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  experimentId: report.experimentId,
  armId,
  outputPath,
  byteLength: Buffer.byteLength(JSON.stringify(report)),
  terminalAorticEjection: report.aorticEjection.at(-1),
  terminalPulmonaryCycle: report.pulmonaryCycle.at(-1),
})}\n`);

function pressureEpisodeSummary(
  values: readonly Sample[],
  start: number,
  end: number,
  _previousStart: number | null,
  flowId: "AoV" | "PV",
  pressureIds: readonly SignalId[],
) {
  return Object.freeze({
    startTimeSec: values[start]!.timeSec,
    endTimeSec: values[end]!.timeSec,
    positiveFlowDurationSec:
      values[end]!.timeSec - values[start]!.timeSec + 0.002,
    flow: signalSummary(values, flowId, start, end),
    pressure: Object.freeze(Object.fromEntries(pressureIds.map((signalId) =>
      [signalId, signalSummary(values, signalId, start, end)]))),
  });
}

function pulmonaryCycleSummary(
  values: readonly Sample[],
  beatIndex: number,
) {
  const start = lowerBoundTime(values, beatIndex);
  const end = lowerBoundTime(values, beatIndex + 1) - 1;
  const pvEpisodes = positiveEpisodes(values, "PV", start, end);
  const pvClosureIndex = pvEpisodes.at(-1)?.[1] ?? start;
  const papExtrema = extrema(values, "PAP", start, end);
  const systolicMaximum = papExtrema.find((entry) =>
    entry.kind === "maximum" && entry.timeSec <= values[pvClosureIndex]!.timeSec)
    ?? null;
  const postClosure = papExtrema.filter((entry) =>
    entry.timeSec > values[pvClosureIndex]!.timeSec);
  const postClosureMinimum = postClosure.find((entry) =>
    entry.kind === "minimum") ?? null;
  const diastolicReboundMaximum = postClosureMinimum === null
    ? null
    : postClosure.find((entry) =>
      entry.kind === "maximum"
      && entry.timeSec > postClosureMinimum.timeSec) ?? null;
  const laterMinimum = diastolicReboundMaximum === null
    ? null
    : postClosure.find((entry) =>
      entry.kind === "minimum"
      && entry.timeSec > diastolicReboundMaximum.timeSec) ?? null;
  const negativeRootExchangeVolumeMl = integrateSignedPart(
    values,
    "PA_PArt",
    pvClosureIndex,
    end,
    "negative",
  );
  const positiveRootExchangeVolumeMl = integrateSignedPart(
    values,
    "PA_PArt",
    pvClosureIndex,
    end,
    "positive",
  );
  return Object.freeze({
    beatIndex,
    startTimeSec: beatIndex,
    endTimeSec: beatIndex + 1,
    pulmonaryValveClosureTimeSec: values[pvClosureIndex]!.timeSec,
    papExtrema,
    systolicMaximum,
    postClosureMinimum,
    diastolicReboundMaximum,
    laterMinimum,
    diastolicReboundRiseMmHg:
      postClosureMinimum === null || diastolicReboundMaximum === null
        ? null
        : diastolicReboundMaximum.value - postClosureMinimum.value,
    rootExchangeFlow: signalSummary(values, "PA_PArt", start, end),
    postClosureNegativeRootExchangeVolumeMl: negativeRootExchangeVolumeMl,
    postClosurePositiveRootExchangeVolumeMl: positiveRootExchangeVolumeMl,
  });
}

function signalSummary(
  values: readonly Sample[],
  signalId: SignalId,
  start: number,
  end: number,
) {
  const segment = values.slice(start, end + 1).map((entry) => entry[signalId]);
  return Object.freeze({
    minimum: Math.min(...segment),
    maximum: Math.max(...segment),
    extrema: extrema(values, signalId, start, end),
  });
}

function extrema(
  values: readonly Sample[],
  signalId: SignalId,
  start: number,
  end: number,
): readonly Extremum[] {
  const result: Extremum[] = [];
  for (
    let index = Math.max(start, 1);
    index <= Math.min(end, values.length - 2);
    index += 1
  ) {
    const previous = values[index - 1]![signalId];
    const current = values[index]![signalId];
    const next = values[index + 1]![signalId];
    if (current > previous && current >= next) {
      result.push(Object.freeze({
        kind: "maximum" as const,
        timeSec: values[index]!.timeSec,
        value: current,
      }));
    }
    if (current < previous && current <= next) {
      result.push(Object.freeze({
        kind: "minimum" as const,
        timeSec: values[index]!.timeSec,
        value: current,
      }));
    }
  }
  return Object.freeze(result);
}

function positiveEpisodes(
  values: readonly Sample[],
  signalId: "AoV" | "PV",
  firstIndex = 0,
  lastIndex = values.length - 1,
): readonly (readonly [number, number])[] {
  const result: Array<readonly [number, number]> = [];
  let start: number | null = null;
  for (let index = firstIndex; index <= lastIndex; index += 1) {
    if (values[index]![signalId] > 0 && start === null) start = index;
    if (values[index]![signalId] <= 0 && start !== null) {
      result.push(Object.freeze([start, index - 1] as const));
      start = null;
    }
  }
  if (start !== null) result.push(Object.freeze([start, lastIndex] as const));
  return Object.freeze(result);
}

function completeOneSecondBeat(
  values: readonly Sample[],
  start: number,
  end: number,
): boolean {
  return values[start]!.timeSec >= 1
    && values[end]!.timeSec <= values.at(-1)!.timeSec - 0.25;
}

function integrateSignedPart(
  values: readonly Sample[],
  signalId: SignalId,
  start: number,
  end: number,
  sign: "positive" | "negative",
): number {
  let total = 0;
  for (let index = start; index <= end; index += 1) {
    const flow = values[index]![signalId];
    total += 0.002 * (sign === "positive" ? Math.max(0, flow) : Math.min(0, flow));
  }
  return total;
}

function lowerBoundTime(values: readonly Sample[], target: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle]!.timeSec < target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function requiredEdge(
  edges: ReturnType<typeof buildEdges>,
  name: string,
) {
  const edge = edges.find((candidate) => candidate.name === name);
  if (edge === undefined) throw new Error(`missing topology edge ${name}`);
  return edge;
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

function numberArgument(name: string, fallback: number): number {
  const value = Number(argument(name, String(fallback)));
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be positive and finite`);
  }
  return value;
}

function terminalMetricValue(
  output: Readonly<{
    value: number | readonly number[] | null;
    availability: string;
  }> | undefined,
  outputId: string,
): number {
  if (
    output === undefined
    || output.availability !== "available"
    || typeof output.value !== "number"
    || !Number.isFinite(output.value)
  ) {
    throw new Error(`terminal metric ${outputId} is unavailable`);
  }
  return output.value;
}
