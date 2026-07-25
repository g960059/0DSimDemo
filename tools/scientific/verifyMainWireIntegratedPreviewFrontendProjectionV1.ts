import type {
  MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MainWireIntegratedPreviewSessionV1,
  type MainWireIntegratedPreviewRunRecordV2,
} from "@/engine/scientific/integratedPreview";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

type Trace =
  readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];

const allOffSession =
  await MainWireIntegratedPreviewSessionV1.create("all-off");
const allOff = await allOffSession.seedRunRecord();
const heartMateIiSession = await MainWireIntegratedPreviewSessionV1.create(
  "lvad-hmii-9000-one-beat-transient",
);
const heartMateIi = await heartMateIiSession.runNextBeatRecord();

await verifyRunRecord(allOff, {
  expectedKind: "bundled-p1-seed",
  expectedFinalAcceptedTimeSec: 70,
  requireLvadFlow: false,
});
await verifyRunRecord(heartMateIi, {
  expectedKind: "one-beat-continuation",
  expectedFinalAcceptedTimeSec: 71,
  requireLvadFlow: true,
});

process.stdout.write(`${JSON.stringify({
  reportId: "main-wire-integrated-preview-frontend-projection-check-v1",
  interpretation: {
    allOff:
      "numerically-periodic construction reference; not independently physiologically validated",
    heartMateIi:
      "first unsteady beat after activation; not a steady-state or clinical comparison",
    waveformPolicy:
      "raw accepted endpoints; no smoothing or interpolation",
  },
  allOff: summarize(allOff),
  heartMateIiPostActivationBeat: summarize(heartMateIi),
}, null, 2)}\n`);

async function verifyRunRecord(
  runRecord: MainWireIntegratedPreviewRunRecordV2,
  expectation: Readonly<{
    expectedKind: MainWireIntegratedPreviewRunRecordV2["run"]["kind"];
    expectedFinalAcceptedTimeSec: number;
    requireLvadFlow: boolean;
  }>,
): Promise<void> {
  const { recordSha256, ...payload } = runRecord;
  if (await sha256CanonicalJsonHex(payload) !== recordSha256) {
    throw new Error("frontend run record SHA-256 is invalid");
  }
  const trace = runRecord.run.trace;
  if (
    runRecord.run.kind !== expectation.expectedKind
    || runRecord.terminalModelState.acceptedTimeSec
      !== expectation.expectedFinalAcceptedTimeSec
    || runRecord.startModelState.acceptedTimeSec
      !== runRecord.run.startAcceptedTimeSec
    || runRecord.terminalModelState.acceptedTimeSec
      !== runRecord.run.endAcceptedTimeSec
    || Math.abs(durationSec(trace) - 1) > 1e-12
    || runRecord.run.maximumTotalBloodVolumeErrorMl >= 1e-8
    || runRecord.run.maximumCoronaryBloodVolumeLedgerResidualMl >= 1e-8
    || runRecord.run.maximumDynamicMcsConservationResidualMlPerSec >= 1e-12
    || runRecord.replayCompleteness.standaloneReplayCompleteArtifactClaimed
      !== false
  ) throw new Error("frontend run record invariant failed");
  for (let index = 0; index < trace.length; index += 1) {
    const sample = trace[index]!;
    if (
      !(sample.acceptedDtSec > 0)
      || sample.cyclePhase01 < 0
      || sample.cyclePhase01 > 1 + 1e-12
      || (index > 0
        && sample.acceptedTimeSec <= trace[index - 1]!.acceptedTimeSec)
    ) throw new Error("frontend trace time coordinate is invalid");
  }
  const atrialCaptureCount = trace.filter((sample) =>
    sample.acceptedEventIdentity.atrialCapturedActivationId !== null).length;
  const ventricularCaptureCount = trace.filter((sample) =>
    sample.acceptedEventIdentity.ventricularCapturedActivationId !== null)
    .length;
  if (atrialCaptureCount !== 1 || ventricularCaptureCount !== 1) {
    throw new Error("frontend beat does not contain one captured A/V event");
  }
  const lvadFlows = trace.map(
    (sample) => sample.dynamicMcsAcceptedFlowMlPerSec.LVAD,
  );
  if (
    expectation.requireLvadFlow
      ? !lvadFlows.some((flow) => Math.abs(flow) > 1e-6)
      : lvadFlows.some((flow) => flow !== 0)
  ) throw new Error("frontend LVAD activation projection is invalid");
}

function summarize(runRecord: MainWireIntegratedPreviewRunRecordV2) {
  const trace = runRecord.run.trace;
  const lvVolumes = trace.map((sample) => sample.chamberVolumeMl.LV);
  const edv = Math.max(...lvVolumes);
  const esv = Math.min(...lvVolumes);
  const weighted = (
    read: (sample: Trace[number]) => number,
  ) => trace.reduce(
    (sum, sample) => sum + read(sample) * sample.acceptedDtSec,
    0,
  ) / durationSec(trace);
  const range = (
    read: (sample: Trace[number]) => number,
  ): readonly [number, number] => {
    const values = trace.map(read);
    return [Math.min(...values), Math.max(...values)];
  };
  const eventPhases = (
    read: (sample: Trace[number]) => string | null,
  ) => trace.filter((sample) => read(sample) !== null)
    .map((sample) => sample.cyclePhase01);
  return {
    runRecordSha256: runRecord.recordSha256,
    inputSpecSha256: runRecord.simulationInputSpecSha256,
    startCheckpointSha256: runRecord.startModelState.checkpointSha256,
    terminalCheckpointSha256:
      runRecord.terminalModelState.checkpointSha256,
    runKind: runRecord.run.kind,
    acceptedEndpointCount: trace.length,
    durationSec: durationSec(trace),
    lv: {
      endDiastolicVolumeMl: edv,
      endSystolicVolumeMl: esv,
      ejectionFraction01: (edv - esv) / edv,
      pressureRangeMmHg: range(
        (sample) => sample.absolutePressureMmHg.LV,
      ),
    },
    aorta: {
      pressureRangeMmHg: range(
        (sample) => sample.absolutePressureMmHg.Ao,
      ),
      timeWeightedMeanPressureMmHg: weighted(
        (sample) => sample.absolutePressureMmHg.Ao,
      ),
      nativeForwardOutputLPerMin: trace.reduce(
        (sum, sample) =>
          sum
          + Math.max(0, sample.valveFlowMlPerSec.AoV)
            * sample.acceptedDtSec,
        0,
      ) * 0.06,
    },
    pulmonaryArtery: {
      pressureRangeMmHg: range(
        (sample) => sample.absolutePressureMmHg.PA,
      ),
      localMaximumCount: localMaximumCount(
        trace,
        (sample) => sample.absolutePressureMmHg.PA,
      ),
    },
    coronary: {
      totalInletFlowRangeMlPerSec: range(
        (sample) => sample.coronary.totalInletFlowMlPerSec,
      ),
      timeWeightedMeanTotalInletFlowMlPerSec: weighted(
        (sample) => sample.coronary.totalInletFlowMlPerSec,
      ),
    },
    lvad: {
      flowRangeLPerMin: range(
        (sample) =>
          sample.dynamicMcsAcceptedFlowMlPerSec.LVAD * 0.06,
      ),
      timeWeightedMeanFlowLPerMin: weighted(
        (sample) =>
          sample.dynamicMcsAcceptedFlowMlPerSec.LVAD * 0.06,
      ),
      headRangeMmHg: range(
        (sample) =>
          sample.absolutePressureMmHg.Ao
          - sample.absolutePressureMmHg.LV,
      ),
    },
    rhythm: {
      atrialCapturePhases: eventPhases(
        (sample) =>
          sample.acceptedEventIdentity.atrialCapturedActivationId,
      ),
      ventricularCapturePhases: eventPhases(
        (sample) =>
          sample.acceptedEventIdentity.ventricularCapturedActivationId,
      ),
    },
    conservation: {
      maximumTotalBloodVolumeErrorMl:
        runRecord.run.maximumTotalBloodVolumeErrorMl,
      maximumCoronaryBloodVolumeLedgerResidualMl:
        runRecord.run.maximumCoronaryBloodVolumeLedgerResidualMl,
      maximumDynamicMcsConservationResidualMlPerSec:
        runRecord.run.maximumDynamicMcsConservationResidualMlPerSec,
    },
  };
}

function durationSec(trace: Trace): number {
  return trace.reduce(
    (sum, sample) => sum + sample.acceptedDtSec,
    0,
  );
}

function localMaximumCount(
  trace: Trace,
  read: (sample: Trace[number]) => number,
): number {
  let count = 0;
  for (let index = 1; index < trace.length - 1; index += 1) {
    if (
      read(trace[index]!) > read(trace[index - 1]!)
      && read(trace[index]!) >= read(trace[index + 1]!)
    ) count += 1;
  }
  return count;
}
