import React from 'react';

import type {
  MainWireScientificObservableFrameV1,
} from '@/engine/scientific/observables';
import {
  sameSimulationReleaseRef,
  type SimulationReleaseRef,
} from '@/engine/scientific/release';
import {
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
} from '@/engine/scientific/presets/officialHealthyPeriodicCheckpointPresetV1';
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
  type MainWireScientificResearchPresetIdV1,
} from '@/engine/scientific/presets/mainWireScientificResearchPresetCatalogV1';
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificSessionOriginV1,
} from '@/engine/scientific/worker';
import {
  MainWireScientificWorkerClientV1,
} from '@/engine/scientificBrowser';

import {
  ScientificAlphaPvTrajectories,
  ScientificAlphaWaveforms,
} from './ScientificRuntimeAlphaPlots';
import {
  SCIENTIFIC_ALPHA_CYCLE_LENGTH_SEC,
  SCIENTIFIC_ALPHA_DT_SEC,
  SCIENTIFIC_ALPHA_HISTORY_CAPACITY,
  SCIENTIFIC_ALPHA_STEPS_PER_CHUNK,
  SCIENTIFIC_ALPHA_TERMINAL_BEAT_CHUNK_COUNT,
  SCIENTIFIC_ALPHA_TERMINAL_WINDOW_SEC,
  appendBoundedScientificAlphaHistoryV1,
  planScientificAlphaPostPeriod1CaptureV1,
  scientificAlphaPeriodicDirectiveV1,
  selectTerminalScientificAlphaHistoryV1,
} from './scientificRuntimeAlphaHistoryV1';

const MAXIMUM_SIMULATION_COMMANDS_PER_ALPHA_SESSION = 7_600;
const ALPHA_RENDER_EVERY_TRANSIENT_COMMANDS = 8;

type AlphaPhase = 'starting' | 'ready' | 'running' | 'paused' | 'failed';
type AlphaBootstrapTarget =
  | Readonly<{ kind: 'official-healthy-periodic' }>
  | Readonly<{ kind: 'canonical-cold-start' }>
  | Readonly<{
    kind: 'research-preset';
    presetId: MainWireScientificResearchPresetIdV1;
    presetVersion: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION;
  }>;
type AlphaRunMode =
  | 'idle'
  | 'continuous'
  | 'single-beat'
  | 'settling-periodic'
  | 'period1-terminal-beat';
type AlphaPlotEvidence =
  | 'cold-start'
  | 'transient'
  | 'periodic-settling'
  | 'periodic-non-converged'
  | 'period1-terminal-acquiring'
  | 'period1-terminal-beat';

type AlphaPeriodicProgress = Readonly<{
  status: 'tracking' | 'period1-converged' | 'period2-suspect' | 'maximum-beats-reached';
  completedBeatCount: number;
  maximumBeatCount: number;
  latestPeriod1MaximumNormalizedDelta: number | null;
  latestPeriod2MaximumNormalizedDelta: number | null;
  latestWorstPath: string | null;
}>;

type AlphaState = Readonly<{
  phase: AlphaPhase;
  message: string;
  releaseRef: SimulationReleaseRef | null;
  sessionOrigin: ScientificSessionOriginV1 | null;
  history: readonly MainWireScientificObservableFrameV1[];
  simulationCommandCount: number;
  periodicProgress: AlphaPeriodicProgress | null;
  plotEvidence: AlphaPlotEvidence;
  terminalBeatCompletedChunkCount: number;
}>;

const OFFICIAL_HEALTHY_BOOTSTRAP = Object.freeze({
  kind: 'official-healthy-periodic' as const,
});
const CANONICAL_COLD_BOOTSTRAP = Object.freeze({
  kind: 'canonical-cold-start' as const,
});

function initialAlphaState(bootstrap: AlphaBootstrapTarget): AlphaState {
  return Object.freeze({
    phase: 'starting',
    message: bootstrap.kind === 'official-healthy-periodic'
      ? 'Verifying and restoring the bundled official healthy periodic checkpoint.'
      : bootstrap.kind === 'canonical-cold-start'
        ? 'Creating the canonical cold-start session.'
        : `Resolving ${researchPresetDisplayName(bootstrap.presetId)} into a release-bound cold-start session.`,
    releaseRef: null,
    sessionOrigin: null,
    history: Object.freeze([]),
    simulationCommandCount: 0,
    periodicProgress: null,
    plotEvidence: 'cold-start',
    terminalBeatCompletedChunkCount: 0,
  });
}

/**
 * Explicit, non-default integration seam for the release-bound scientific
 * runtime. This page owns one real module Worker and has no legacy ModelCore
 * import, backend selector, or fallback path.
 */
export default function ScientificRuntimeAlphaPage() {
  const [bootstrap, setBootstrap] = React.useState<Readonly<{
    target: AlphaBootstrapTarget;
    revision: number;
  }>>(() => Object.freeze({ target: OFFICIAL_HEALTHY_BOOTSTRAP, revision: 0 }));
  const [state, setState] = React.useState<AlphaState>(() =>
    initialAlphaState(OFFICIAL_HEALTHY_BOOTSTRAP));
  const [selectedResearchPresetId, setSelectedResearchPresetId] =
    React.useState<MainWireScientificResearchPresetIdV1>(
      MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries[0].presetId,
    );
  const [requestBusy, setRequestBusy] = React.useState(false);
  const clientRef = React.useRef<MainWireScientificWorkerClientV1 | null>(null);
  const generationRef = React.useRef(0);
  const requestSerialRef = React.useRef(0);
  const simulationCommandCountRef = React.useRef(0);
  const historyRef = React.useRef<readonly MainWireScientificObservableFrameV1[]>(
    Object.freeze([]),
  );
  const latestFrameRef = React.useRef<MainWireScientificObservableFrameV1 | null>(null);
  const runModeRef = React.useRef<AlphaRunMode>('idle');
  const beatTargetTimeSecRef = React.useRef<number | null>(null);
  const terminalBeatChunksRemainingRef = React.useRef(0);
  const requestInFlightRef = React.useRef(false);
  const pumpRef = React.useRef<(generation: number) => void>(() => undefined);

  const failClosed = React.useCallback((generation: number, error: unknown) => {
    if (generation !== generationRef.current) return;
    runModeRef.current = 'idle';
    beatTargetTimeSecRef.current = null;
    terminalBeatChunksRemainingRef.current = 0;
    setRequestBusy(false);
    setState((previous) => ({
      ...previous,
      phase: 'failed',
      message: error instanceof Error ? error.message : String(error),
    }));
  }, []);

  const pump = React.useCallback(async (generation: number): Promise<void> => {
    if (
      generation !== generationRef.current
      || runModeRef.current === 'idle'
      || requestInFlightRef.current
    ) return;
    const client = clientRef.current;
    if (client === null) return;
    const issuedMode = runModeRef.current;
    const remainingBudget = MAXIMUM_SIMULATION_COMMANDS_PER_ALPHA_SESSION
      - simulationCommandCountRef.current;
    const requiredBudget = issuedMode === 'settling-periodic'
      ? 1 + SCIENTIFIC_ALPHA_TERMINAL_BEAT_CHUNK_COUNT
      : issuedMode === 'period1-terminal-beat'
        ? terminalBeatChunksRemainingRef.current
        : 1;
    if (remainingBudget < requiredBudget) {
      runModeRef.current = 'idle';
      beatTargetTimeSecRef.current = null;
      setRequestBusy(false);
      setState((previous) => ({
        ...previous,
        phase: 'paused',
        message: issuedMode === 'settling-periodic'
          ? 'The bounded request budget cannot reserve a complete terminal beat. Reset before settling.'
          : 'Bounded request budget reached. Reset to start a fresh Worker session.',
        history: historyRef.current,
        simulationCommandCount: simulationCommandCountRef.current,
      }));
      return;
    }

    requestInFlightRef.current = true;
    const requestId = requestIdentity(generation, ++requestSerialRef.current);
    simulationCommandCountRef.current += 1;
    try {
      const response = issuedMode === 'settling-periodic'
        ? await client.request({
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: 'settlePeriodic',
          requestId,
          sessionId: sessionIdentity(generation),
        })
        : await client.request({
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: 'runTransient',
          requestId,
          sessionId: sessionIdentity(generation),
          dtSec: SCIENTIFIC_ALPHA_DT_SEC,
          stepCount: SCIENTIFIC_ALPHA_STEPS_PER_CHUNK,
          observationStride: 1,
        });
      if (generation !== generationRef.current) return;

      if (!response.ok) {
        const partialFrames = response.error.observableFrames;
        if (partialFrames.length > 0) {
          historyRef.current = appendBoundedScientificAlphaHistoryV1(
            historyRef.current,
            partialFrames,
          );
          setState((previous) => ({
            ...previous,
            history: historyRef.current,
            simulationCommandCount: simulationCommandCountRef.current,
          }));
          latestFrameRef.current = partialFrames.at(-1) ?? latestFrameRef.current;
        }
        throw new Error(`${response.error.code}: ${response.error.message}`);
      }

      if (issuedMode === 'settling-periodic') {
        if (
          response.commandKind !== 'settlePeriodic'
          || response.payload.kind !== 'periodic-settlement-progress'
        ) {
          throw new Error('scientific Worker returned an unexpected periodic payload');
        }
        const payload = response.payload;
        const finalFrame = payload.finalObservableFrame;
        latestFrameRef.current = finalFrame;
        historyRef.current = appendBoundedScientificAlphaHistoryV1(
          historyRef.current,
          [finalFrame],
        );
        const latestClosure = payload.retainedBeatClosure.at(-1);
        const periodicProgress: AlphaPeriodicProgress = Object.freeze({
          status: payload.status,
          completedBeatCount: payload.completedBeatCount,
          maximumBeatCount: payload.executionProtocol.maximumBeatCount,
          latestPeriod1MaximumNormalizedDelta:
            payload.periodicity.latestPeriod1MaximumNormalizedDelta,
          latestPeriod2MaximumNormalizedDelta:
            payload.periodicity.latestPeriod2MaximumNormalizedDelta,
          latestWorstPath: latestClosure?.period1?.worstPath ?? null,
        });
        const directive = scientificAlphaPeriodicDirectiveV1(
          payload.status,
          payload.periodicSteadyStateClaimed,
        );
        const settlingStillActive = runModeRef.current === 'settling-periodic';

        if (directive === 'capture-period1-terminal-beat') {
          const capturePlan = planScientificAlphaPostPeriod1CaptureV1(
            finalFrame,
            settlingStillActive,
          );
          historyRef.current = capturePlan.history;
          terminalBeatChunksRemainingRef.current = capturePlan.remainingChunkCount;
          beatTargetTimeSecRef.current = capturePlan.targetTimeSec;
          runModeRef.current = capturePlan.continueImmediately
            ? 'period1-terminal-beat'
            : 'idle';
          setState((previous) => ({
            ...previous,
            phase: capturePlan.continueImmediately ? 'running' : 'paused',
            message: capturePlan.continueImmediately
              ? 'P1 convergence established at the source boundary. Acquiring exactly one following beat for the plots.'
              : 'P1 convergence established at the source boundary. The following-beat acquisition is reserved and paused.',
            history: historyRef.current,
            simulationCommandCount: simulationCommandCountRef.current,
            periodicProgress,
            plotEvidence: 'period1-terminal-acquiring',
            terminalBeatCompletedChunkCount: 0,
          }));
        } else if (directive === 'stop-non-converged') {
          runModeRef.current = 'idle';
          beatTargetTimeSecRef.current = null;
          terminalBeatChunksRemainingRef.current = 0;
          setState((previous) => ({
            ...previous,
            phase: 'paused',
            message: payload.status === 'period2-suspect'
              ? 'Periodic settling stopped: P2 orbit suspected. No steady-state plot is claimed.'
              : 'Periodic settling stopped at the 32-beat limit without P1 convergence. No steady-state plot is claimed.',
            history: historyRef.current,
            simulationCommandCount: simulationCommandCountRef.current,
            periodicProgress,
            plotEvidence: 'periodic-non-converged',
            terminalBeatCompletedChunkCount: 0,
          }));
        } else {
          setState((previous) => ({
            ...previous,
            phase: settlingStillActive ? 'running' : 'paused',
            message: settlingStillActive
                ? `Periodic settling: completed beat ${payload.completedBeatCount}/${payload.executionProtocol.maximumBeatCount}.`
                : `Paused between periodic beats after beat ${payload.completedBeatCount}.`,
            history: historyRef.current,
            simulationCommandCount: simulationCommandCountRef.current,
            periodicProgress,
            plotEvidence: 'periodic-settling',
            terminalBeatCompletedChunkCount: 0,
          }));
        }
        return;
      }

      if (
        response.commandKind !== 'runTransient'
        || response.payload.kind !== 'transientCompleted'
      ) {
        throw new Error('scientific Worker returned an unexpected transient payload');
      }

      const frames = response.payload.observableFrames;
      const finalFrame = response.payload.finalObservableFrame;
      latestFrameRef.current = finalFrame;
      historyRef.current = appendBoundedScientificAlphaHistoryV1(
        historyRef.current,
        frames,
      );

      if (issuedMode === 'period1-terminal-beat') {
        if (response.payload.completedStepCount !== SCIENTIFIC_ALPHA_STEPS_PER_CHUNK) {
          throw new Error('terminal beat chunk did not complete exactly four accepted steps');
        }
        terminalBeatChunksRemainingRef.current -= 1;
        if (terminalBeatChunksRemainingRef.current < 0) {
          throw new Error('terminal beat exceeded its bounded chunk count');
        }
        const completedChunkCount = SCIENTIFIC_ALPHA_TERMINAL_BEAT_CHUNK_COUNT
          - terminalBeatChunksRemainingRef.current;
        if (terminalBeatChunksRemainingRef.current === 0) {
          const targetTimeSec = beatTargetTimeSecRef.current;
          if (
            targetTimeSec === null
            || Math.abs(finalFrame.acceptedTimeSec - targetTimeSec) > 1e-9
          ) {
            throw new Error('terminal beat did not end at its exact same-phase boundary');
          }
          runModeRef.current = 'idle';
          beatTargetTimeSecRef.current = null;
          setState((previous) => ({
            ...previous,
            phase: 'ready',
            message: 'One complete beat immediately following the P1-classified source boundary was acquired.',
            history: historyRef.current,
            simulationCommandCount: simulationCommandCountRef.current,
            plotEvidence: 'period1-terminal-beat',
            terminalBeatCompletedChunkCount: completedChunkCount,
          }));
        } else if (
          completedChunkCount % ALPHA_RENDER_EVERY_TRANSIENT_COMMANDS === 0
          || runModeRef.current !== 'period1-terminal-beat'
        ) {
          setState((previous) => ({
            ...previous,
            history: historyRef.current,
            simulationCommandCount: simulationCommandCountRef.current,
            terminalBeatCompletedChunkCount: completedChunkCount,
          }));
        }
        return;
      }

      const targetTimeSec = beatTargetTimeSecRef.current;
      const completedSingleBeat = (
        issuedMode === 'single-beat'
        && targetTimeSec !== null
        && finalFrame.acceptedTimeSec >= targetTimeSec - 1e-12
      );
      if (completedSingleBeat) {
        runModeRef.current = 'idle';
        beatTargetTimeSecRef.current = null;
        setState((previous) => ({
          ...previous,
          phase: 'ready',
          message: `Completed one ${SCIENTIFIC_ALPHA_CYCLE_LENGTH_SEC.toFixed(3)} s beat at an accepted chunk boundary.`,
          history: historyRef.current,
          simulationCommandCount: simulationCommandCountRef.current,
        }));
      } else if (
        !alphaRunModeIsActive(runModeRef.current)
        || simulationCommandCountRef.current
          % ALPHA_RENDER_EVERY_TRANSIENT_COMMANDS === 0
      ) {
        setState((previous) => ({
          ...previous,
          history: historyRef.current,
          simulationCommandCount: simulationCommandCountRef.current,
        }));
      }
    } catch (error: unknown) {
      failClosed(generation, error);
    } finally {
      if (generation !== generationRef.current) return;
      requestInFlightRef.current = false;
      if (alphaRunModeIsActive(runModeRef.current)) {
        window.setTimeout(() => pumpRef.current(generation), 0);
      } else {
        setRequestBusy(false);
      }
    }
  }, [failClosed]);
  pumpRef.current = (generation) => {
    void pump(generation);
  };

  React.useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    runModeRef.current = 'idle';
    beatTargetTimeSecRef.current = null;
    terminalBeatChunksRemainingRef.current = 0;
    requestSerialRef.current = 0;
    simulationCommandCountRef.current = 0;
    latestFrameRef.current = null;
    historyRef.current = Object.freeze([]);
    requestInFlightRef.current = false;
    setRequestBusy(false);
    setState(initialAlphaState(bootstrap.target));

    let mounted = true;
    let client: MainWireScientificWorkerClientV1;
    try {
      client = new MainWireScientificWorkerClientV1();
      clientRef.current = client;
    } catch (error: unknown) {
      failClosed(generation, error);
      return undefined;
    }

    const bootstrapCommand = bootstrap.target.kind === 'official-healthy-periodic'
      ? {
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: 'createOfficialPresetSession' as const,
        requestId: requestIdentity(generation, ++requestSerialRef.current),
        sessionId: sessionIdentity(generation),
        presetId: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
        presetVersion: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
      }
      : bootstrap.target.kind === 'canonical-cold-start'
        ? {
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: 'createCanonicalSession' as const,
          requestId: requestIdentity(generation, ++requestSerialRef.current),
          sessionId: sessionIdentity(generation),
        }
        : {
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: 'createResearchPresetSession' as const,
          requestId: requestIdentity(generation, ++requestSerialRef.current),
          sessionId: sessionIdentity(generation),
          presetId: bootstrap.target.presetId,
          presetVersion: bootstrap.target.presetVersion,
        };
    void client.request(bootstrapCommand).then((response) => {
      if (!mounted || generation !== generationRef.current) return;
      if (!response.ok) {
        throw new Error(`${response.error.code}: ${response.error.message}`);
      }
      const officialBootstrap = bootstrap.target.kind === 'official-healthy-periodic';
      const researchBootstrap = bootstrap.target.kind === 'research-preset';
      if (officialBootstrap) {
        if (
          response.commandKind !== 'createOfficialPresetSession'
          || response.payload.kind !== 'officialPresetSessionCreated'
          || response.payload.presetId
            !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID
          || response.payload.presetVersion
            !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION
          || response.sessionOrigin.kind
            !== 'official-preset-exact-checkpoint-restore'
          || response.sessionOrigin.presetId
            !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID
          || response.sessionOrigin.presetVersion
            !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION
          || response.payload.observableFrame.source !== 'exact-checkpoint-restore'
        ) throw new Error('scientific Worker returned an unexpected official preset payload');
      } else if (researchBootstrap) {
        if (
          response.commandKind !== 'createResearchPresetSession'
          || response.payload.kind !== 'researchPresetSessionCreated'
          || response.payload.presetId !== bootstrap.target.presetId
          || response.payload.presetVersion !== bootstrap.target.presetVersion
          || response.payload.classification !== 'research-bracket-not-clinical'
          || response.payload.officialTrustClaimed !== false
          || response.payload.clinicalDiagnosisClaimed !== false
          || response.payload.periodicSteadyStateClaimed !== false
          || response.sessionOrigin.kind !== 'research-preset-cold-start'
          || response.sessionOrigin.presetId !== bootstrap.target.presetId
          || response.sessionOrigin.presetVersion !== bootstrap.target.presetVersion
          || response.sessionOrigin.classification !== 'research-bracket-not-clinical'
          || response.sessionOrigin.officialTrustClaimed !== false
          || response.sessionOrigin.clinicalDiagnosisClaimed !== false
          || response.sessionOrigin.periodicSteadyStateClaimed !== false
          || response.sessionOrigin.sessionInputSha256
            !== response.payload.sessionInputSha256
          || !sameSimulationReleaseRef(
            response.sessionOrigin.releaseRef,
            response.releaseRef,
          )
          || response.payload.observableFrame.source !== 'cold-initialization'
        ) throw new Error('scientific Worker returned an unexpected research preset payload');
      } else if (
        response.commandKind !== 'createCanonicalSession'
        || response.payload.kind !== 'sessionCreated'
        || response.sessionOrigin.kind !== 'canonical-cold-start'
        || response.payload.observableFrame.source !== 'cold-initialization'
      ) throw new Error('scientific Worker returned an unexpected canonical session payload');
      const frame = response.payload.observableFrame;
      if (!sameSimulationReleaseRef(response.releaseRef, frame.releaseRef)) {
        throw new Error('scientific Worker session frame release does not match its response');
      }
      latestFrameRef.current = frame;
      historyRef.current = Object.freeze([frame]);
      runModeRef.current = officialBootstrap ? 'settling-periodic' : 'idle';
      setRequestBusy(officialBootstrap);
      setState({
        phase: officialBootstrap ? 'running' : 'ready',
        message: officialBootstrap
          ? 'Verified official P1 checkpoint restored. Confirming its stored closure before acquiring the following beat.'
          : researchBootstrap
            ? `${researchPresetDisplayName(bootstrap.target.presetId)} is ready as a cold research session. It is neither a clinical diagnosis nor a steady-state result.`
            : 'Canonical scientific Worker cold-start session is ready.',
        releaseRef: response.releaseRef,
        sessionOrigin: response.sessionOrigin,
        history: historyRef.current,
        simulationCommandCount: 0,
        periodicProgress: null,
        plotEvidence: officialBootstrap ? 'periodic-settling' : 'cold-start',
        terminalBeatCompletedChunkCount: 0,
      });
      if (officialBootstrap) {
        window.setTimeout(() => pumpRef.current(generation), 0);
      }
    }).catch((error: unknown) => {
      if (!mounted) return;
      failClosed(generation, error);
    });

    return () => {
      mounted = false;
      if (generationRef.current === generation) {
        generationRef.current += 1;
        runModeRef.current = 'idle';
        beatTargetTimeSecRef.current = null;
        terminalBeatChunksRemainingRef.current = 0;
      }
      if (clientRef.current === client) clientRef.current = null;
      client.terminate();
    };
  }, [bootstrap, failClosed]);

  const beginContinuous = () => {
    if (!alphaMayBeginRun(state.phase, runModeRef.current, requestInFlightRef.current)) return;
    runModeRef.current = 'continuous';
    beatTargetTimeSecRef.current = null;
    terminalBeatChunksRemainingRef.current = 0;
    setRequestBusy(true);
    setState((previous) => ({
      ...previous,
      phase: 'running',
      message: 'Running bounded four-step Worker chunks.',
      periodicProgress: null,
      plotEvidence: 'transient',
      terminalBeatCompletedChunkCount: 0,
    }));
    pumpRef.current(generationRef.current);
  };

  const runSingleBeat = () => {
    const latest = latestFrameRef.current;
    if (
      latest === null
      || !alphaMayBeginRun(state.phase, runModeRef.current, requestInFlightRef.current)
    ) return;
    runModeRef.current = 'single-beat';
    terminalBeatChunksRemainingRef.current = 0;
    beatTargetTimeSecRef.current =
      latest.acceptedTimeSec + SCIENTIFIC_ALPHA_CYCLE_LENGTH_SEC;
    setRequestBusy(true);
    setState((previous) => ({
      ...previous,
      phase: 'running',
      message: `Advancing one ${SCIENTIFIC_ALPHA_CYCLE_LENGTH_SEC.toFixed(3)} s beat in bounded Worker chunks.`,
      periodicProgress: null,
      plotEvidence: 'transient',
      terminalBeatCompletedChunkCount: 0,
    }));
    pumpRef.current(generationRef.current);
  };

  const settleToPeriodic = () => {
    if (!alphaMayBeginRun(state.phase, runModeRef.current, requestInFlightRef.current)) return;
    if (
      state.plotEvidence === 'period1-terminal-acquiring'
      && terminalBeatChunksRemainingRef.current > 0
      && beatTargetTimeSecRef.current !== null
    ) {
      runModeRef.current = 'period1-terminal-beat';
      setRequestBusy(true);
      setState((previous) => ({
        ...previous,
        phase: 'running',
        message: 'Resuming the bounded post-P1 beat acquisition.',
      }));
      pumpRef.current(generationRef.current);
      return;
    }
    runModeRef.current = 'settling-periodic';
    beatTargetTimeSecRef.current = null;
    terminalBeatChunksRemainingRef.current = 0;
    setRequestBusy(true);
    setState((previous) => ({
      ...previous,
      phase: 'running',
      message: 'Settling one bounded same-phase beat per Worker command.',
      periodicProgress: null,
      plotEvidence: 'periodic-settling',
      terminalBeatCompletedChunkCount: 0,
    }));
    pumpRef.current(generationRef.current);
  };

  const pause = () => {
    if (state.phase !== 'running') return;
    const pausedMode = runModeRef.current;
    runModeRef.current = 'idle';
    if (pausedMode !== 'period1-terminal-beat') {
      beatTargetTimeSecRef.current = null;
    }
    if (!requestInFlightRef.current) setRequestBusy(false);
    setState((previous) => ({
      ...previous,
      phase: 'paused',
      message: requestInFlightRef.current
        ? pausedMode === 'settling-periodic'
          ? 'Pause requested; the in-flight beat will finish and be retained.'
          : 'Pause requested; the in-flight four-step chunk will be retained.'
        : 'Paused at an accepted command boundary.',
      history: historyRef.current,
      simulationCommandCount: simulationCommandCountRef.current,
    }));
  };

  const restartWith = (target: AlphaBootstrapTarget) => {
    generationRef.current += 1;
    runModeRef.current = 'idle';
    beatTargetTimeSecRef.current = null;
    terminalBeatChunksRemainingRef.current = 0;
    requestInFlightRef.current = false;
    historyRef.current = Object.freeze([]);
    setRequestBusy(false);
    clientRef.current?.terminate();
    clientRef.current = null;
    setBootstrap((previous) => Object.freeze({
      target,
      revision: previous.revision + 1,
    }));
  };

  const loadSelectedResearchPreset = () => {
    restartWith(Object.freeze({
      kind: 'research-preset' as const,
      presetId: selectedResearchPresetId,
      presetVersion: MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_V1_VERSION,
    }));
  };

  return (
    <section
      className="h-full overflow-auto bg-slate-950 px-4 py-7 text-slate-100 sm:px-6"
      data-scientific-alpha-phase={state.phase}
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            Isolated browser integration
          </p>
          <h1 className="text-2xl font-semibold">Scientific runtime alpha</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Release-bound main-wire science in one module Worker. This explicit
            route is not the default Workbench runtime and has no legacy fallback.
            It starts from the digest-verified official healthy P1 checkpoint;
            canonical cold start and bounded valve-disease research brackets
            remain explicit cold-start alternatives.
          </p>
        </header>

        <section
          className="grid gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
          data-testid="scientific-alpha-research-preset-launcher"
        >
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-slate-100">
              Built-in research preset
            </span>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={selectedResearchPresetId}
              onChange={(event) => {
                const entry = MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries
                  .find(({ presetId }) => presetId === event.target.value);
                if (entry !== undefined) setSelectedResearchPresetId(entry.presetId);
              }}
            >
              {MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries.map((entry) => (
                <option key={entry.presetId} value={entry.presetId}>
                  {entry.displayName}
                </option>
              ))}
            </select>
            <span className="block text-xs leading-5 text-amber-200/80">
              Research bracket only — not an official preset, clinical diagnosis,
              patient fit, or steady-state result. Loading starts cold; periodic
              settling remains an explicit action.
            </span>
          </label>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={loadSelectedResearchPreset}
          >
            Load research cold start
          </button>
        </section>

        {state.phase === 'starting' && (
          <StatusPanel tone="pending" title="Starting real scientific Worker…">
            {state.message}
          </StatusPanel>
        )}

        {state.phase === 'failed' && state.releaseRef === null && (
          <>
            <StatusPanel tone="failed" title="Scientific Worker failed closed">
              {state.message}
            </StatusPanel>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => restartWith(bootstrap.target)}
            >
              Retry {bootstrapTargetLabel(bootstrap.target)}
            </button>
            {bootstrap.target.kind === 'official-healthy-periodic' && (
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => restartWith(CANONICAL_COLD_BOOTSTRAP)}
              >
                Start canonical cold
              </button>
            )}
          </>
        )}

        {state.releaseRef !== null && state.sessionOrigin !== null && (
          <ReadyPanel
            state={state}
            requestBusy={requestBusy}
            onStart={beginContinuous}
            onPause={pause}
            onSingleBeat={runSingleBeat}
            onSettlePeriodic={settleToPeriodic}
            bootstrapTarget={bootstrap.target}
            onReset={() => restartWith(bootstrap.target)}
            onSwitchBootstrap={() => restartWith(
              bootstrap.target.kind === 'official-healthy-periodic'
                ? CANONICAL_COLD_BOOTSTRAP
                : OFFICIAL_HEALTHY_BOOTSTRAP,
            )}
          />
        )}
      </div>
    </section>
  );
}

function ReadyPanel({
  state,
  requestBusy,
  onStart,
  onPause,
  onSingleBeat,
  onSettlePeriodic,
  onReset,
  bootstrapTarget,
  onSwitchBootstrap,
}: Readonly<{
  state: AlphaState & Readonly<{
    releaseRef: SimulationReleaseRef;
    sessionOrigin: ScientificSessionOriginV1;
  }>;
  requestBusy: boolean;
  onStart: () => void;
  onPause: () => void;
  onSingleBeat: () => void;
  onSettlePeriodic: () => void;
  onReset: () => void;
  bootstrapTarget: AlphaBootstrapTarget;
  onSwitchBootstrap: () => void;
}>) {
  const frame = state.history.at(-1);
  if (frame === undefined) return null;
  const postPeriod1Beat = state.plotEvidence === 'period1-terminal-beat';
  const terminalFrames = postPeriod1Beat
    ? state.history
    : selectTerminalScientificAlphaHistoryV1(state.history);
  const values = frame.values;
  const chamberRows = (['LA', 'RA', 'LV', 'RV'] as const).map((chamber) => ({
    chamber,
    volume: values[`hemodynamics.volume.${chamber}`],
    pressure: values[`hemodynamics.pressure.absolute.${chamber}`],
  }));
  const running = state.phase === 'running';
  const terminalBeatPaused = state.plotEvidence === 'period1-terminal-acquiring'
    && !running;

  return (
    <div
      className="space-y-7"
      data-testid="scientific-alpha-ready"
      data-scientific-alpha-plot-evidence={state.plotEvidence}
    >
      <StatusPanel
        tone={state.phase === 'failed' ? 'failed' : running ? 'running' : 'ready'}
        title={state.phase === 'failed'
          ? 'Scientific Worker failed closed'
          : state.plotEvidence === 'periodic-non-converged'
            ? 'Periodic result is non-converged'
            : postPeriod1Beat
              ? 'Post-P1 beat ready'
              : running
                ? 'Scientific Worker running'
                : 'Scientific Worker ready'}
      >
        {state.message}
      </StatusPanel>

      <div className="flex flex-wrap items-center gap-2" aria-label="Scientific simulation controls">
        <button
          type="button"
          className={primaryButtonClass}
          onClick={onStart}
          disabled={running || requestBusy || state.phase === 'failed'}
        >
          Start
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onPause}
          disabled={!running}
        >
          {state.plotEvidence === 'periodic-settling'
            ? 'Pause between beats'
            : 'Pause'}
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onSingleBeat}
          disabled={running || requestBusy || state.phase === 'failed'}
        >
          Run one beat
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onSettlePeriodic}
          disabled={running || requestBusy || state.phase === 'failed'}
        >
          {terminalBeatPaused ? 'Resume terminal beat' : 'Settle to periodic'}
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onReset}
        >
          {bootstrapTarget.kind === 'official-healthy-periodic'
            ? 'Reload healthy preset'
            : bootstrapTarget.kind === 'research-preset'
              ? 'Reload research preset'
              : 'Reset cold start'}
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onSwitchBootstrap}
        >
          {bootstrapTarget.kind === 'official-healthy-periodic'
            ? 'Start canonical cold'
            : 'Load healthy periodic'}
        </button>
        <span className="ml-auto text-xs text-slate-500" aria-live="polite">
          {requestBusy ? 'Bounded Worker loop active · ' : ''}
          {state.history.length}/{SCIENTIFIC_ALPHA_HISTORY_CAPACITY} retained · latest{' '}
          {SCIENTIFIC_ALPHA_TERMINAL_WINDOW_SEC.toFixed(1)} s plotted
        </span>
      </div>

      {state.periodicProgress !== null && (
        <PeriodicProgressPanel
          progress={state.periodicProgress}
          terminalBeatCompletedChunkCount={state.terminalBeatCompletedChunkCount}
          plotEvidence={state.plotEvidence}
        />
      )}

      <dl className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Metadata label="Accepted time" value={`${format(frame.acceptedTimeSec, 3)} s`} />
        <Metadata label="Revision" value={String(frame.revision)} />
        <Metadata
          label="Simulation commands"
          value={`${state.simulationCommandCount}/${MAXIMUM_SIMULATION_COMMANDS_PER_ALPHA_SESSION}`}
        />
        <Metadata label="Terminal samples" value={String(terminalFrames.length)} />
        <Metadata label="Plot evidence" value={alphaPlotEvidenceLabel(state.plotEvidence)} wide />
        <Metadata label="Release" value={`${state.releaseRef.id} v${state.releaseRef.version}`} wide />
        <Metadata label="Session origin" value={state.sessionOrigin.kind} wide />
        {state.sessionOrigin.kind === 'official-preset-exact-checkpoint-restore' && (
          <>
            <Metadata
              label="Official preset"
              value={`${state.sessionOrigin.presetId} v${state.sessionOrigin.presetVersion}`}
              wide
            />
            <Metadata
              label="Checkpoint SHA-256"
              value={state.sessionOrigin.checkpointSha256}
              full
            />
          </>
        )}
        {state.sessionOrigin.kind === 'research-preset-cold-start' && (
          <>
            <Metadata
              label="Research preset"
              value={`${state.sessionOrigin.presetId} v${state.sessionOrigin.presetVersion}`}
              wide
            />
            <Metadata
              label="Session input SHA-256"
              value={state.sessionOrigin.sessionInputSha256}
              full
            />
          </>
        )}
        <Metadata label="Release SHA-256" value={state.releaseRef.sha256} full />
      </dl>

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Chamber</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Absolute pressure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/40">
            {chamberRows.map(({ chamber, volume, pressure }) => (
              <tr key={chamber}>
                <th className="px-4 py-3 font-medium text-slate-200">{chamber}</th>
                <td className="px-4 py-3 font-mono text-slate-300">
                  {formatObservable(volume.value, volume.availability, 'mL')}
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">
                  {formatObservable(pressure.value, pressure.availability, 'mmHg')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={postPeriod1Beat
          ? 'rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100'
          : 'rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100'}
        data-testid="scientific-alpha-plot-provenance"
      >
        {postPeriod1Beat
          ? 'Provenance: one beat acquired immediately after a P1-classified source boundary; the acquired endpoint was not independently reclassified.'
          : 'These plots are not claimed as steady state.'}
      </div>

      <ScientificAlphaPvTrajectories frames={terminalFrames} />
      <ScientificAlphaWaveforms frames={terminalFrames} />
    </div>
  );
}

function PeriodicProgressPanel({
  progress,
  terminalBeatCompletedChunkCount,
  plotEvidence,
}: Readonly<{
  progress: AlphaPeriodicProgress;
  terminalBeatCompletedChunkCount: number;
  plotEvidence: AlphaPlotEvidence;
}>) {
  const acquiringTerminalBeat = plotEvidence === 'period1-terminal-acquiring';
  return (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-300"
      data-testid="scientific-alpha-periodic-progress"
      data-periodic-status={progress.status}
    >
      <span className="font-semibold text-slate-100">
        Periodic: {periodicStatusLabel(progress.status)}
      </span>
      <span>
        beat {progress.completedBeatCount}/{progress.maximumBeatCount}
      </span>
      <span>P1 Δ {formatNormalizedDelta(progress.latestPeriod1MaximumNormalizedDelta)}</span>
      <span>P2 Δ {formatNormalizedDelta(progress.latestPeriod2MaximumNormalizedDelta)}</span>
      {progress.latestWorstPath !== null && (
        <span className="max-w-xl truncate font-mono" title={progress.latestWorstPath}>
          worst {progress.latestWorstPath}
        </span>
      )}
      {acquiringTerminalBeat && (
        <span className="text-cyan-300">
          terminal beat {terminalBeatCompletedChunkCount}/
          {SCIENTIFIC_ALPHA_TERMINAL_BEAT_CHUNK_COUNT} chunks
        </span>
      )}
    </div>
  );
}

function StatusPanel({
  tone,
  title,
  children,
}: React.PropsWithChildren<Readonly<{
  tone: 'pending' | 'ready' | 'running' | 'failed';
  title: string;
}>>) {
  const toneClasses = {
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
    ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    running: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
    failed: 'border-red-500/30 bg-red-500/10 text-red-100',
  } as const;

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`} role="status">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm opacity-80">{children}</p>
    </div>
  );
}

function Metadata({
  label,
  value,
  wide = false,
  full = false,
}: Readonly<{
  label: string;
  value: string;
  wide?: boolean;
  full?: boolean;
}>) {
  const columnClass = full
    ? 'min-w-0 sm:col-span-2 lg:col-span-4'
    : wide
      ? 'min-w-0 sm:col-span-1 lg:col-span-2'
      : 'min-w-0';
  return (
    <div className={columnClass}>
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 break-all font-mono text-slate-200">{value}</dd>
    </div>
  );
}

const primaryButtonClass = [
  'rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950',
  'hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40',
].join(' ');

const secondaryButtonClass = [
  'rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200',
  'hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40',
].join(' ');

function requestIdentity(generation: number, serial: number): string {
  return `browser-scientific-alpha-g${generation}-request-${serial}`;
}

function sessionIdentity(generation: number): string {
  return `browser-scientific-alpha-session-g${generation}`;
}

function researchPresetDisplayName(
  presetId: MainWireScientificResearchPresetIdV1,
): string {
  const entry = MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries.find(
    (candidate) => candidate.presetId === presetId,
  );
  if (entry === undefined) {
    throw new Error(`unknown built-in research preset ${presetId}`);
  }
  return entry.displayName;
}

function bootstrapTargetLabel(target: AlphaBootstrapTarget): string {
  switch (target.kind) {
    case 'official-healthy-periodic': return 'healthy preset';
    case 'canonical-cold-start': return 'cold start';
    case 'research-preset': return researchPresetDisplayName(target.presetId);
  }
}

function alphaRunModeIsActive(runMode: AlphaRunMode): boolean {
  return runMode !== 'idle';
}

function alphaMayBeginRun(
  phase: AlphaPhase,
  runMode: AlphaRunMode,
  requestInFlight: boolean,
): boolean {
  return phase !== 'starting'
    && phase !== 'failed'
    && runMode === 'idle'
    && !requestInFlight;
}

function alphaPlotEvidenceLabel(evidence: AlphaPlotEvidence): string {
  switch (evidence) {
    case 'cold-start': return 'Cold start — not steady';
    case 'transient': return 'Transient window — not steady';
    case 'periodic-settling': return 'Periodic settling — not steady';
    case 'periodic-non-converged': return 'Periodic non-converged — not steady';
    case 'period1-terminal-acquiring': return 'P1 found; terminal beat incomplete';
    case 'period1-terminal-beat': return 'Post-P1 captured beat — source boundary classified';
  }
}

function periodicStatusLabel(status: AlphaPeriodicProgress['status']): string {
  switch (status) {
    case 'tracking': return 'tracking';
    case 'period1-converged': return 'P1 converged';
    case 'period2-suspect': return 'P2 suspected — non-converged';
    case 'maximum-beats-reached': return 'maximum 32 beats — non-converged';
  }
}

function formatNormalizedDelta(value: number | null): string {
  return value === null ? '—' : value.toExponential(2);
}

function formatObservable(
  value: number | null,
  availability: string,
  unit: string,
): string {
  return value === null ? availability : `${format(value, 2)} ${unit}`;
}

function format(value: number, digits: number): string {
  return value.toFixed(digits);
}
