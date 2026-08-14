import { performance } from "node:perf_hooks";

import {
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  buildCoronaryTopologyV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  createCoronaryBackwardEulerScratchWorkspaceV2,
  initializePressureLadderCoronaryStateV2,
  solveCoronaryBackwardEulerTrialV2,
  type CoronaryAcceptedHydraulicStateV2,
  type CoronaryHydraulicBoundaryInputV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";

const WARMUP_TICKS = 256;
const MEASURED_TICKS = 2_048;
const topology = buildCoronaryTopologyV2();
const initialBoundary = boundaryForTick(0);
const initial = initializePressureLadderCoronaryStateV2({
  boundary: initialBoundary,
});

const baseline = run("fresh", null);
const workspace = run(
  "workspace",
  createCoronaryBackwardEulerScratchWorkspaceV2(topology),
);
if (JSON.stringify(workspace.finalState) !== JSON.stringify(baseline.finalState)) {
  throw new Error("coronary scratch benchmark lost bit-exact state parity");
}

process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-coronary-backward-euler-scratch-benchmark-v2",
  claim: "local-development-diagnostic-not-supported-hardware-benchmark",
  warmupTicks: WARMUP_TICKS,
  measuredTicks: MEASURED_TICKS,
  baselineMeanMsPerTick: baseline.elapsedMs / MEASURED_TICKS,
  workspaceMeanMsPerTick: workspace.elapsedMs / MEASURED_TICKS,
  workspaceToBaselineRatio: workspace.elapsedMs / baseline.elapsedMs,
  finalAcceptedTimeSec: workspace.finalState.acceptedTimeSec,
  finalRevision: workspace.finalState.revision,
}, null, 2)}\n`);

function run(
  _label: "fresh" | "workspace",
  scratch: ReturnType<
    typeof createCoronaryBackwardEulerScratchWorkspaceV2
  > | null,
): Readonly<{
  elapsedMs: number;
  finalState: CoronaryAcceptedHydraulicStateV2;
}> {
  let state = initial.acceptedState;
  for (let tick = 1; tick <= WARMUP_TICKS; tick += 1) {
    state = advance(state, tick, scratch);
  }
  const startedAt = performance.now();
  for (
    let tick = WARMUP_TICKS + 1;
    tick <= WARMUP_TICKS + MEASURED_TICKS;
    tick += 1
  ) {
    state = advance(state, tick, scratch);
  }
  return Object.freeze({
    elapsedMs: performance.now() - startedAt,
    finalState: state,
  });
}

function advance(
  state: CoronaryAcceptedHydraulicStateV2,
  tick: number,
  scratch: ReturnType<
    typeof createCoronaryBackwardEulerScratchWorkspaceV2
  > | null,
): CoronaryAcceptedHydraulicStateV2 {
  return solveCoronaryBackwardEulerTrialV2(
    state,
    Object.freeze({
      dtSec: 0.002,
      boundary: boundaryForTick(tick),
    }),
    NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
    topology,
    scratch ?? undefined,
  ).candidateAcceptedState;
}

function boundaryForTick(tick: number): CoronaryHydraulicBoundaryInputV2 {
  const phase = tick * 0.002 * Math.PI * 2;
  return Object.freeze({
    absoluteAorticPressureMmHg: 95 + 8 * Math.sin(phase),
    absoluteRightAtrialPressureMmHg: 5 + 0.4 * Math.sin(phase - 0.3),
    perivascularExternalPressureMmHg: 2,
    intramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
      LAD: Object.freeze({
        subepicardial: 6 + 2 * Math.sin(phase + 0.1),
        subendocardial: 10 + 5 * Math.sin(phase + 0.1),
      }),
      LCx: Object.freeze({
        subepicardial: 6 + 2 * Math.sin(phase + 0.1),
        subendocardial: 10 + 5 * Math.sin(phase + 0.1),
      }),
      RCA: Object.freeze({
        subepicardial: 5 + 1.5 * Math.sin(phase + 0.2),
        subendocardial: 8 + 3.5 * Math.sin(phase + 0.2),
      }),
    }),
  });
}
