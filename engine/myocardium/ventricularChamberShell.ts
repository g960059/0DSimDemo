import {
  initialSeriesElasticFiberState,
  stepSeriesElasticLandFiberV1,
  type SeriesElasticFiberParameters,
  type SeriesElasticFiberState,
  type SeriesElasticFiberStepResult,
} from "@/engine/myocardium/seriesElasticFiberAdapter";
import {
  initialDynamicValveTransitionV1State,
  stepDynamicValveTransitionV1,
  type DynamicValveTransitionV1Parameters,
  type DynamicValveTransitionV1State,
  type DynamicValveTransitionV1StepResult,
} from "@/engine/valves/dynamicValveTransitionV1";

export const VENTRICULAR_CHAMBER_SHELL_V1_ID = "ventricular-chamber-shell-v1" as const;

export type VentricularChamberShellActiveMode =
  | "live-source-stress"
  | "source-state-series-elastic";

export type VentricularChamberShellState = {
  readonly volumeMl: number;
  readonly inletValveState: DynamicValveTransitionV1State;
  readonly outletValveState: DynamicValveTransitionV1State;
  readonly seriesElasticState: SeriesElasticFiberState | null;
};

export type VentricularChamberShellSourceState = {
  readonly previousLandState: readonly number[];
  readonly freeCalciumUM: number;
  readonly previousFreeCalciumUM: number;
  readonly previousFiberEngineeringStrain: number;
  readonly stageFiberEngineeringStrainAtVolumeMl: (volumeMl: number) => number;
};

export type VentricularChamberShellStepInput = {
  readonly dtSec: number;
  readonly liveVolumeMl: number;
  readonly livePassivePressureMmHg: number;
  readonly passiveSlopeMmHgPerMl: number;
  readonly atrialPressureMmHg: number;
  readonly arterialPressureMmHg: number;
  readonly liveSourceStressPa: number;
  readonly activePressurePerStressMmHgPerPa: number;
  readonly activeMode: VentricularChamberShellActiveMode;
  readonly sourceState: VentricularChamberShellSourceState | null;
  readonly volumeBracketMl: readonly [number, number];
};

export type VentricularChamberShellParameters = {
  readonly inletValve: DynamicValveTransitionV1Parameters;
  readonly outletValve: DynamicValveTransitionV1Parameters;
  readonly seriesElastic: SeriesElasticFiberParameters | null;
  readonly maxSolveIterations: number;
  readonly residualToleranceMl: number;
};

export type VentricularChamberShellStepResult = {
  readonly ok: boolean;
  readonly mechanismId: typeof VENTRICULAR_CHAMBER_SHELL_V1_ID;
  readonly activeMode: VentricularChamberShellActiveMode;
  readonly nextState: VentricularChamberShellState;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
  readonly passivePressureMmHg: number;
  readonly activePressureMmHg: number;
  readonly inletFlowMlPerSec: number;
  readonly outletFlowMlPerSec: number;
  readonly inletValveStep: DynamicValveTransitionV1StepResult;
  readonly outletValveStep: DynamicValveTransitionV1StepResult;
  readonly seriesElasticStep: SeriesElasticFiberStepResult | null;
  readonly residualMl: number;
  readonly iterations: number;
  readonly bracketed: boolean;
  readonly failureReason: string | null;
};

type Candidate = {
  readonly volumeMl: number;
  readonly pressureMmHg: number;
  readonly passivePressureMmHg: number;
  readonly activePressureMmHg: number;
  readonly inletValveStep: DynamicValveTransitionV1StepResult;
  readonly outletValveStep: DynamicValveTransitionV1StepResult;
  readonly seriesElasticStep: SeriesElasticFiberStepResult | null;
  readonly residualMl: number;
  readonly ok: boolean;
  readonly failureReason: string | null;
};

export function initialVentricularChamberShellState(
  volumeMl: number,
  inletFlowMlPerSec = 0,
  outletFlowMlPerSec = 0,
  inletOpen01 = 0,
  outletOpen01 = 0,
  sourceState: VentricularChamberShellSourceState | null = null,
): VentricularChamberShellState {
  return {
    volumeMl,
    inletValveState: initialDynamicValveTransitionV1State(inletFlowMlPerSec, inletOpen01),
    outletValveState: initialDynamicValveTransitionV1State(outletFlowMlPerSec, outletOpen01),
    seriesElasticState: sourceState
      ? initialSeriesElasticFiberState(
        sourceState.previousLandState,
        1 + sourceState.previousFiberEngineeringStrain,
      )
      : null,
  };
}

export function stepVentricularChamberShellV1(
  previous: VentricularChamberShellState,
  input: VentricularChamberShellStepInput,
  parameters: VentricularChamberShellParameters,
): VentricularChamberShellStepResult {
  const [rawLo, rawHi] = input.volumeBracketMl;
  const lo = Math.max(1, Math.min(rawLo, rawHi));
  const hi = Math.max(lo + 1e-6, Math.max(rawLo, rawHi));
  const left0 = evaluateCandidate(previous, input, parameters, lo);
  const right0 = evaluateCandidate(previous, input, parameters, hi);
  const candidates: Candidate[] = [left0, right0];
  let left = left0;
  let right = right0;
  let bracketed = left.ok && right.ok && Math.sign(left.residualMl) !== Math.sign(right.residualMl);
  let best = bestCandidate(candidates);
  let iterations = 2;

  if (bracketed) {
    for (; iterations < Math.max(2, parameters.maxSolveIterations); iterations += 1) {
      const midVolumeMl = 0.5 * (left.volumeMl + right.volumeMl);
      const mid = evaluateCandidate(previous, input, parameters, midVolumeMl);
      candidates.push(mid);
      best = bestCandidate(candidates);
      if (mid.ok && Math.abs(mid.residualMl) <= parameters.residualToleranceMl) {
        best = mid;
        break;
      }
      if (!mid.ok) break;
      if (Math.sign(mid.residualMl) === Math.sign(left.residualMl)) {
        left = mid;
      } else {
        right = mid;
      }
    }
  } else {
    let current = best;
    for (; iterations < Math.max(2, parameters.maxSolveIterations); iterations += 1) {
      const pressureSensitivity = Math.max(0.001, Math.abs(input.passiveSlopeMmHgPerMl));
      const correction = clamp(
        current.residualMl / (1 + pressureSensitivity),
        -10,
        10,
      );
      const nextVolumeMl = clamp(current.volumeMl - correction, lo, hi);
      const next = evaluateCandidate(previous, input, parameters, nextVolumeMl);
      candidates.push(next);
      best = bestCandidate(candidates);
      current = next.ok ? next : best;
      if (next.ok && Math.abs(next.residualMl) <= parameters.residualToleranceMl) break;
    }
  }

  const final = best;
  const nextState: VentricularChamberShellState = {
    volumeMl: final.volumeMl,
    inletValveState: final.inletValveStep.nextState,
    outletValveState: final.outletValveStep.nextState,
    seriesElasticState: final.seriesElasticStep?.ok
      ? final.seriesElasticStep.nextState
      : previous.seriesElasticState,
  };
  return {
    ok: final.ok && Math.abs(final.residualMl) <= Math.max(0.05, 5 * parameters.residualToleranceMl),
    mechanismId: VENTRICULAR_CHAMBER_SHELL_V1_ID,
    activeMode: input.activeMode,
    nextState,
    volumeMl: final.volumeMl,
    pressureMmHg: final.pressureMmHg,
    passivePressureMmHg: final.passivePressureMmHg,
    activePressureMmHg: final.activePressureMmHg,
    inletFlowMlPerSec: final.inletValveStep.flowMlPerSec,
    outletFlowMlPerSec: final.outletValveStep.flowMlPerSec,
    inletValveStep: final.inletValveStep,
    outletValveStep: final.outletValveStep,
    seriesElasticStep: final.seriesElasticStep,
    residualMl: final.residualMl,
    iterations,
    bracketed,
    failureReason: final.failureReason,
  };
}

function evaluateCandidate(
  previous: VentricularChamberShellState,
  input: VentricularChamberShellStepInput,
  parameters: VentricularChamberShellParameters,
  volumeMl: number,
): Candidate {
  const active = activePressureForCandidate(previous, input, parameters, volumeMl);
  const passivePressureMmHg =
    input.livePassivePressureMmHg
    + input.passiveSlopeMmHgPerMl * (volumeMl - input.liveVolumeMl);
  const pressureMmHg = passivePressureMmHg + active.activePressureMmHg;
  const inletValveStep = stepDynamicValveTransitionV1(
    previous.inletValveState,
    {
      dtSec: input.dtSec,
      upstreamPressureMmHg: input.atrialPressureMmHg,
      downstreamPressureMmHg: pressureMmHg,
    },
    parameters.inletValve,
  );
  const outletValveStep = stepDynamicValveTransitionV1(
    previous.outletValveState,
    {
      dtSec: input.dtSec,
      upstreamPressureMmHg: pressureMmHg,
      downstreamPressureMmHg: input.arterialPressureMmHg,
    },
    parameters.outletValve,
  );
  const predictedVolumeMl =
    previous.volumeMl
    + input.dtSec * (inletValveStep.flowMlPerSec - outletValveStep.flowMlPerSec);
  return {
    volumeMl,
    pressureMmHg,
    passivePressureMmHg,
    activePressureMmHg: active.activePressureMmHg,
    inletValveStep,
    outletValveStep,
    seriesElasticStep: active.seriesElasticStep,
    residualMl: volumeMl - predictedVolumeMl,
    ok: active.ok,
    failureReason: active.failureReason,
  };
}

function activePressureForCandidate(
  previous: VentricularChamberShellState,
  input: VentricularChamberShellStepInput,
  parameters: VentricularChamberShellParameters,
  volumeMl: number,
): {
  readonly ok: boolean;
  readonly activePressureMmHg: number;
  readonly seriesElasticStep: SeriesElasticFiberStepResult | null;
  readonly failureReason: string | null;
} {
  if (input.activeMode === "live-source-stress") {
    return {
      ok: true,
      activePressureMmHg: Math.max(0, input.liveSourceStressPa) * input.activePressurePerStressMmHgPerPa,
      seriesElasticStep: null,
      failureReason: null,
    };
  }
  if (!input.sourceState || !parameters.seriesElastic || !previous.seriesElasticState) {
    return {
      ok: false,
      activePressureMmHg: 0,
      seriesElasticStep: null,
      failureReason: "missing-source-state-or-series-elastic-state",
    };
  }
  const sourceState = input.sourceState;
  const result = stepSeriesElasticLandFiberV1(
    previous.seriesElasticState,
    {
      freeCalciumUM: sourceState.freeCalciumUM,
      previousFreeCalciumUM: sourceState.previousFreeCalciumUM,
      previousLambdaTotal: 1 + sourceState.previousFiberEngineeringStrain,
      stageLambdaTotal: 1 + sourceState.stageFiberEngineeringStrainAtVolumeMl(volumeMl),
      dtSec: input.dtSec,
    },
    parameters.seriesElastic,
  );
  return {
    ok: result.ok,
    activePressureMmHg: Math.max(0, result.sigmaSePa) * input.activePressurePerStressMmHgPerPa,
    seriesElasticStep: result,
    failureReason: result.ok ? null : result.failureReason ?? "series-elastic-step-failed",
  };
}

function bestCandidate(candidates: readonly Candidate[]): Candidate {
  return [...candidates].sort((a, b) => {
    if (a.ok !== b.ok) return a.ok ? -1 : 1;
    return Math.abs(a.residualMl) - Math.abs(b.residualMl);
  })[0];
}

function clamp(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value)) return lo;
  return Math.min(hi, Math.max(lo, value));
}
