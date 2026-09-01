import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
  createMainWireIntegratedRegularSinusRhythmV3,
} from "@/engine/myocardium/MainWireIntegratedRegularSinusRhythmV3";
import {
  resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  measureMainWireIntegratedModelBaselineValidationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  compareMainWireIntegratedModelAcceptedStatesV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import {
  assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  prepareMainWireIntegratedModelFixtureInputsV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireRoundedEjectionFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireRoundedEjectionFiveWallProviderV1";

type Sample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
type MaterialFactor = "source" | "rounded";
type RhythmCalciumFactor = "source" | "matched-alpha";

const prepared = prepareMainWireIntegratedModelFixtureInputsV3(
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  1,
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
);
const cells = Object.freeze([
  cellV1("source-source", "source", "source"),
  cellV1("rounded-source", "rounded", "source"),
  cellV1("source-matched-alpha", "source", "matched-alpha"),
  cellV1("rounded-matched-alpha", "rounded", "matched-alpha"),
]);
const results = cells.map((cell) => {
  const run = convergeV1(cell.fixture);
  return Object.freeze({
    cellId: cell.cellId,
    material: cell.material,
    rhythmCalcium: cell.rhythmCalcium,
    convergence: run.convergence,
    metrics: summarizeV1(run.trace),
  });
});
const scalarByCell = Object.fromEntries(results.map((result) => [
  result.cellId,
  scalarProjectionV1(result.metrics),
])) as Record<string, ReturnType<typeof scalarProjectionV1>>;

process.stdout.write(`${JSON.stringify({
  factorizationId: "main-wire-standard65-to-68-right-ventricle-factorization-v1",
  fixedFactors: Object.freeze({
    circulation: "source-root-topology-and-default-load",
    valveLawsAndAreas: "bit-identical-across-cells",
    heartRateBpm: prepared.hemodynamicResearchInputs.heartRateBpm,
    totalBloodVolumeMl:
      prepared.hemodynamicResearchInputs.totalBloodVolumeMl,
  }),
  factorSemantics: Object.freeze({
    material:
      "source ventricular Land/SLS material versus Standard68 rounded-ejection material on LVFW, SEP, and RVFW",
    rhythmCalcium:
      "source regular-sinus timing and source biexponential calcium versus the admitted matched-alpha regular-sinus/calcium bundle",
    limitation:
      "rhythm and calcium are bundled because their exact accepted owner configuration is atomic; this is a 2x2 causal screen, not clinical validation",
  }),
  results,
  factorialContrasts: factorialContrastsV1(scalarByCell),
}, null, 2)}\n`);

function cellV1(
  cellId: string,
  material: MaterialFactor,
  rhythmCalcium: RhythmCalciumFactor,
) {
  const cycleLengthSec = 60 /
    prepared.hemodynamicResearchInputs.heartRateBpm;
  const fixture = assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    prepared,
    {
      createProvider: () => material === "source"
        ? createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsV1(
            prepared.chamberMechanics,
          )
        : createMainWireRoundedEjectionFiveWallProviderV1(
            prepared.chamberMechanics,
          ),
      createVascularRuntime: () => Object.freeze({
        venousTone: prepared.hemodynamicResearchInputs.venousTone,
        arterialStiffness:
          prepared.hemodynamicResearchInputs.arterialStiffness,
      }),
      createCalciumDriveParams: () => rhythmCalcium === "source"
        ? Object.freeze({
            ...FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
            parameterSetId:
              `${FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.parameterSetId}`
              + "-right-factorization-v1",
            cycleLengthSec,
            decayTimeScaleByWall:
              prepared.chamberMechanics.calciumDecayTimeScaleByWall,
          })
        : resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(
            prepared.hemodynamicResearchInputs.heartRateBpm,
          ),
      createRhythm: () => createMainWireIntegratedRegularSinusRhythmV3(
        {
          idPrefix: `right-factor-${cellId}`,
          parameterProvenanceSourceId:
            `main-wire-standard65-to-68-right-factorization-${cellId}-v1`,
          cycleLengthSec,
        },
        rhythmCalcium === "source"
          ? undefined
          : {
              profileId:
                MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
              heartRateBpm:
                prepared.hemodynamicResearchInputs.heartRateBpm,
            },
      ),
    },
  );
  return Object.freeze({ cellId, material, rhythmCalcium, fixture });
}

function convergeV1(
  fixture: ReturnType<
    typeof assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3
  >,
) {
  let accepted = fixture.cold.acceptedState;
  let trace: readonly Sample[] = [];
  let maximumNormalizedDelta = Number.POSITIVE_INFINITY;
  let consecutivePasses = 0;
  let completedCycles = 0;
  for (let cycle = 1; cycle <= 200; cycle += 1) {
    const prior = accepted;
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      fixture as unknown as MainWireIntegratedModelRegularSinusAllOffFixtureV3,
      accepted,
      cycle,
      0.002,
    );
    accepted = run.terminalAcceptedState;
    trace = run.traceSamples;
    completedCycles = cycle;
    maximumNormalizedDelta = compareMainWireIntegratedModelAcceptedStatesV3(
      accepted,
      prior,
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
      fixture.config,
    ).overall.maximumNormalizedDelta;
    consecutivePasses = maximumNormalizedDelta <= 0.001
      ? consecutivePasses + 1
      : 0;
    if (consecutivePasses >= 3) break;
  }
  return Object.freeze({
    trace,
    convergence: Object.freeze({
      completedCycles,
      consecutivePasses,
      maximumNormalizedDelta,
    }),
  });
}

function summarizeV1(samples: readonly Sample[]) {
  const left = measureMainWireIntegratedModelBaselineValidationV1(samples);
  const pvFlow = samples.map((sample) => sample.valveFlowMlPerSec.PV);
  const tvFlow = samples.map((sample) => sample.valveFlowMlPerSec.TV);
  const pap = samples.map((sample) => sample.absolutePressureMmHg.PA);
  const pvOpen = thresholdOpenV1(pvFlow);
  const pvOpening = transitionV1(pvOpen, false, true);
  const pvClosure = nextTransitionV1(pvOpen, pvOpening, true, false);
  const tvOpen = thresholdOpenV1(tvFlow);
  const tvClosure = previousTransitionV1(tvOpen, pvOpening, true, false);
  const tvOpening = nextTransitionV1(tvOpen, pvClosure, false, true);
  const pvIndices = cyclicIndicesV1(samples.length, pvOpening, pvClosure);
  const peakFlowIndex = pvIndices.reduce((best, index) =>
    pvFlow[index]! > pvFlow[best]! ? index : best, pvIndices[0]!);
  const rvRate = samples.slice(1).map((sample, index) =>
    (sample.absolutePressureMmHg.RV
      - samples[index]!.absolutePressureMmHg.RV) / sample.acceptedDtSec);
  const ictSec = cyclicDurationV1(samples, tvClosure, pvOpening);
  const ejectionTimeSec = cyclicDurationV1(samples, pvOpening, pvClosure);
  const irtSec = cyclicDurationV1(samples, pvClosure, tvOpening);
  return Object.freeze({
    left,
    RVP: left.RVP,
    rightVentricle: Object.freeze({
      maximumDpDtMmHgPerSec: Math.max(...rvRate),
      minimumDpDtMmHgPerSec: Math.min(...rvRate),
    }),
    rightTiming: Object.freeze({
      ictSec,
      ejectionTimeSec,
      irtSec,
      teiIndex: (ictSec + irtSec) / ejectionTimeSec,
    }),
    tricuspidPeakEToA: inletPeakRatioV1(samples, tvOpen, pvOpen),
    pulmonaryValve: Object.freeze({
      forwardEpisodeCount: cyclicEpisodeCountV1(pvOpen),
      prominentPeakCount: prominentPeakCountV1(pvFlow),
      peakFlowMlPerSec: pvFlow[peakFlowIndex],
      accelerationTimeSec: cyclicDurationV1(
        samples,
        pvOpening,
        (peakFlowIndex + 1) % samples.length,
      ),
    }),
    pulmonaryArtery: Object.freeze({
      prominentPeakCount: prominentPeakCountV1(pap),
      minimumMmHg: Math.min(...pap),
      maximumMmHg: Math.max(...pap),
      postClosureReboundMmHg:
        postClosureReboundV1(samples, pap, pvClosure, pvOpening),
    }),
  });
}

function scalarProjectionV1(metrics: ReturnType<typeof summarizeV1>) {
  return Object.freeze({
    rvMaximumDpDt: metrics.rightVentricle.maximumDpDtMmHgPerSec,
    rvMinimumDpDt: metrics.rightVentricle.minimumDpDtMmHgPerSec,
    rvIct: metrics.rightTiming.ictSec,
    rvEt: metrics.rightTiming.ejectionTimeSec,
    rvIrt: metrics.rightTiming.irtSec,
    rvTei: metrics.rightTiming.teiIndex,
    pvAccelerationTime: metrics.pulmonaryValve.accelerationTimeSec,
    pvPeakFlow: metrics.pulmonaryValve.peakFlowMlPerSec,
    paMinimumPressure: metrics.pulmonaryArtery.minimumMmHg,
    paMaximumPressure: metrics.pulmonaryArtery.maximumMmHg,
    paPostClosureRebound: metrics.pulmonaryArtery.postClosureReboundMmHg,
  });
}

function factorialContrastsV1(
  values: Record<string, ReturnType<typeof scalarProjectionV1>>,
) {
  const ss = values["source-source"]!;
  const rs = values["rounded-source"]!;
  const sm = values["source-matched-alpha"]!;
  const rm = values["rounded-matched-alpha"]!;
  return Object.freeze(Object.fromEntries(Object.keys(ss).map((key) => {
    const metric = key as keyof typeof ss;
    return [key, Object.freeze({
      roundedMaterialAtSourceRhythmCalcium: rs[metric] - ss[metric],
      roundedMaterialAtMatchedAlphaRhythmCalcium: rm[metric] - sm[metric],
      matchedAlphaAtSourceMaterial: sm[metric] - ss[metric],
      matchedAlphaAtRoundedMaterial: rm[metric] - rs[metric],
      interaction: rm[metric] - rs[metric] - sm[metric] + ss[metric],
    })];
  })));
}

function inletPeakRatioV1(
  samples: readonly Sample[],
  inletOpen: readonly boolean[],
  outletOpen: readonly boolean[],
) {
  const outletClosure = nextTransitionV1(
    outletOpen,
    transitionV1(outletOpen, false, true),
    true,
    false,
  );
  const inletClosure = nextTransitionV1(
    inletOpen,
    outletClosure,
    true,
    false,
  );
  const indices = cyclicIndicesV1(samples.length, outletClosure, inletClosure);
  const peaks = indices.filter((index, position) => {
    const prior = indices[(position - 1 + indices.length) % indices.length]!;
    const next = indices[(position + 1) % indices.length]!;
    const value = samples[index]!.valveFlowMlPerSec.TV;
    return value > samples[prior]!.valveFlowMlPerSec.TV
      && value >= samples[next]!.valveFlowMlPerSec.TV
      && value > 1;
  }).sort((left, right) =>
    samples[right]!.valveFlowMlPerSec.TV
      - samples[left]!.valveFlowMlPerSec.TV)
    .reduce<number[]>((selected, index) => selected.every((other) =>
      Math.min(
        Math.abs(index - other),
        samples.length - Math.abs(index - other),
      ) * 0.002 >= 0.08) ? [...selected, index] : selected, [])
    .slice(0, 2)
    .sort((left, right) =>
      ((left - outletClosure + samples.length) % samples.length)
        - ((right - outletClosure + samples.length) % samples.length));
  return peaks.length < 2
    ? null
    : samples[peaks[0]!]!.valveFlowMlPerSec.TV
      / samples[peaks[1]!]!.valveFlowMlPerSec.TV;
}

function prominentPeakCountV1(raw: readonly number[]) {
  const smooth = raw.map((_, index) => {
    let total = 0;
    for (let offset = -2; offset <= 2; offset += 1) {
      total += raw[(index + offset + raw.length) % raw.length]!;
    }
    return total / 5;
  });
  const minimum = Math.min(...smooth)
    + 0.1 * (Math.max(...smooth) - Math.min(...smooth));
  const candidates = smooth.flatMap((value, index) => {
    const prior = smooth[(index - 1 + smooth.length) % smooth.length]!;
    const next = smooth[(index + 1) % smooth.length]!;
    return value > prior && value >= next && value >= minimum ? [index] : [];
  }).sort((left, right) => smooth[right]! - smooth[left]!);
  const selected: number[] = [];
  for (const index of candidates) {
    if (selected.every((other) => Math.min(
      Math.abs(index - other),
      raw.length - Math.abs(index - other),
    ) * 0.002 >= 0.05)) selected.push(index);
  }
  return selected.length;
}

function postClosureReboundV1(
  samples: readonly Sample[],
  values: readonly number[],
  closure: number,
  opening: number,
) {
  let minimum = Number.POSITIVE_INFINITY;
  let rebound = 0;
  for (const index of cyclicIndicesV1(samples.length, closure, opening)) {
    minimum = Math.min(minimum, values[index]!);
    rebound = Math.max(rebound, values[index]! - minimum);
  }
  return rebound;
}

function thresholdOpenV1(values: readonly number[]) {
  const threshold = Math.max(1, 0.01 * Math.max(...values));
  return values.map((value) => value > threshold);
}

function cyclicEpisodeCountV1(values: readonly boolean[]) {
  return values.filter((value, index) =>
    value && !values[(index - 1 + values.length) % values.length]).length;
}

function transitionV1(values: readonly boolean[], from: boolean, to: boolean) {
  const index = values.findIndex((value, candidate) =>
    value === to
    && values[(candidate - 1 + values.length) % values.length] === from);
  if (index < 0) throw new Error("required transition unavailable");
  return index;
}

function nextTransitionV1(
  values: readonly boolean[],
  start: number,
  from: boolean,
  to: boolean,
) {
  for (let offset = 1; offset <= values.length; offset += 1) {
    const index = (start + offset) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("required next transition unavailable");
}

function previousTransitionV1(
  values: readonly boolean[],
  start: number,
  from: boolean,
  to: boolean,
) {
  for (let offset = 0; offset < values.length; offset += 1) {
    const index = (start - offset + values.length) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("required previous transition unavailable");
}

function cyclicDurationV1(
  samples: readonly Sample[],
  start: number,
  end: number,
) {
  return cyclicIndicesV1(samples.length, start, end).reduce(
    (sum, index) => sum + samples[index]!.acceptedDtSec,
    0,
  );
}

function cyclicIndicesV1(length: number, start: number, end: number) {
  const result: number[] = [];
  for (let offset = 0; offset < length; offset += 1) {
    const index = (start + offset) % length;
    if (index === end) break;
    result.push(index);
  }
  return result;
}
