import checkpointV1 from
  "@/studio/integrations/mainWireIntegratedV3/qualified-baseline-standard69-settled-baseline-checkpoint.json";

import {
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1,
  type MainWireAlgebraicPulmonaryArterialRootProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import type {
  MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  warmStartMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
import {
  MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
  createMainWireIntegratedRegularSinusRhythmV3,
} from "@/engine/myocardium/MainWireIntegratedRegularSinusRhythmV3";
import {
  resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
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
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";
import {
  createMaterialKernelsWithMechanicsResearchInputsV1,
  createNormalAdultProviderFromKernels,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1,
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1,
} from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";

type Sample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
type Fixture = ReturnType<typeof createFactorFixtureV1>;
type Accepted = ReturnType<
  typeof MainWireIntegratedModelStandard68TypedAuthoritySessionV1.prototype.currentAcceptedState
>;

const characteristicRoot =
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1(
    0.024,
    0,
  );
const sourceFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1(
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
);
const restored =
  await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    .restoreStandard68ExactCheckpoint(
      checkpointV1,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
      1,
      undefined,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
    );
const sourceAccepted = restored.currentAcceptedState();
const sourceCycle = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
  sourceFixture as unknown as MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  sourceAccepted,
  1,
  0.002,
);

const roundedCharacteristicFixture = createFactorFixtureV1(
  "rounded",
  characteristicRoot,
);
const roundedCharacteristic = convergeV1({
  sourceAccepted,
  sourceFixture,
  targetFixture: roundedCharacteristicFixture,
});
const hybridSourceFixture = createFactorFixtureV1("source-rv", null);
const hybridSource = convergeV1({
  sourceAccepted,
  sourceFixture,
  targetFixture: hybridSourceFixture,
});
const hybridCharacteristicFixture = createFactorFixtureV1(
  "source-rv",
  characteristicRoot,
);
const hybridCharacteristic = convergeV1({
  sourceAccepted: hybridSource.accepted,
  sourceFixture: hybridSourceFixture,
  targetFixture: hybridCharacteristicFixture,
});

const cells = Object.freeze([
  cellResultV1(
    "rounded-source-root",
    "rounded",
    "source-inertial",
    sourceCycle.traceSamples,
    null,
  ),
  cellResultV1(
    "rounded-characteristic-root",
    "rounded",
    "characteristic-algebraic",
    roundedCharacteristic.trace,
    roundedCharacteristic.convergence,
  ),
  cellResultV1(
    "source-rv-source-root",
    "source-rv",
    "source-inertial",
    hybridSource.trace,
    hybridSource.convergence,
  ),
  cellResultV1(
    "source-rv-characteristic-root",
    "source-rv",
    "characteristic-algebraic",
    hybridCharacteristic.trace,
    hybridCharacteristic.convergence,
  ),
]);

process.stdout.write(`${JSON.stringify({
  factorizationId:
    "main-wire-standard69-pulmonary-root-rv-material-factorization-v1",
  fixedFactors: Object.freeze({
    baseline: "qualified Standard69 hemodynamic and mechanism inputs",
    rhythmCalcium: "Standard69 matched-alpha exact owner",
    valveLawsAndAreas: "unchanged",
    leftVentricleAndSeptumMaterial: "rounded-ejection-v1",
    pulmonaryCharacteristicRoot: Object.freeze({
      baseResistanceMmHgSecPerMl: 0.024,
      effectiveResistanceAtBaselinePvrMmHgSecPerMl:
        0.024
        * MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1
          .pulmonaryResistance,
      inertanceMmHgSec2PerMl: 0,
    }),
  }),
  factorSemantics: Object.freeze({
    rvMaterial:
      "rounded-ejection RVFW versus historical source RVFW while LVFW and SEP remain rounded",
    pulmonaryRoot:
      "source PA_PArt R/L momentum edge versus zero-memory characteristic-resistance edge",
    limitation:
      "causal 2x2 screen, not a fitted candidate or clinical validation; the shared septum is held rounded",
  }),
  convergencePolicy:
    "settled Standard69 checkpoint or nearest factor continuation; stop immediately after three consecutive period-1 deltas <=0.001",
  cells,
  factorialContrasts: factorialContrastsV1(cells),
}, null, 2)}\n`);

function createFactorFixtureV1(
  rvMaterial: "rounded" | "source-rv",
  pulmonaryRoot: MainWireAlgebraicPulmonaryArterialRootProfileV1 | null,
) {
  const prepared = prepareMainWireIntegratedModelFixtureInputsV3(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
    1,
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
  );
  return assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    prepared,
    {
      createProvider: () => {
        const rounded = createMaterialKernelsWithMechanicsResearchInputsV1(
          prepared.chamberMechanics,
          MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1,
          MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1,
        );
        if (rvMaterial === "rounded") {
          return createNormalAdultProviderFromKernels(
            "on",
            rounded,
            "-standard69-rounded-rv-factor-v1",
          );
        }
        const source = createMaterialKernelsWithMechanicsResearchInputsV1(
          prepared.chamberMechanics,
        );
        return createNormalAdultProviderFromKernels(
          "on",
          Object.freeze({ ...rounded, RVFW: source.RVFW }),
          "-standard69-source-rv-factor-v1",
        );
      },
      createVascularRuntime: () => Object.freeze({
        venousTone: prepared.hemodynamicResearchInputs.venousTone,
        arterialStiffness:
          prepared.hemodynamicResearchInputs.arterialStiffness,
        ...(pulmonaryRoot === null
          ? {}
          : { algebraicPulmonaryArterialRootProfile: pulmonaryRoot }),
      }),
      createCalciumDriveParams: () =>
        resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(
          prepared.hemodynamicResearchInputs.heartRateBpm,
        ),
      createRhythm: (cycleLengthSec) =>
        createMainWireIntegratedRegularSinusRhythmV3(
          {
            idPrefix: "rounded-ejection-v1",
            parameterProvenanceSourceId:
              MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
            cycleLengthSec,
          },
          {
            profileId:
              MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
            heartRateBpm: prepared.hemodynamicResearchInputs.heartRateBpm,
          },
        ),
    },
  );
}

function convergeV1(input: Readonly<{
  sourceAccepted: Accepted;
  sourceFixture: Fixture | typeof sourceFixture;
  targetFixture: Fixture;
}>) {
  const startedAt = performance.now();
  let accepted = warmStartMainWireIntegratedModelV3({
    source: input.sourceAccepted,
    sourceRuntime: input.sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
    targetRuntime: input.targetFixture as unknown as MainWireIntegratedModelRuntimeV3,
  });
  let trace: readonly Sample[] = [];
  let maximumNormalizedDelta = Number.POSITIVE_INFINITY;
  let consecutivePasses = 0;
  let completedCycles = 0;
  for (let cycle = 1; cycle <= 80; cycle += 1) {
    const prior = accepted;
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      input.targetFixture as unknown as
        MainWireIntegratedModelRegularSinusAllOffFixtureV3,
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
      input.targetFixture.config,
    ).overall.maximumNormalizedDelta;
    consecutivePasses = maximumNormalizedDelta <= 0.001
      ? consecutivePasses + 1
      : 0;
    if (consecutivePasses >= 3) break;
  }
  return Object.freeze({
    accepted,
    trace,
    convergence: Object.freeze({
      completedCycles,
      consecutivePasses,
      maximumNormalizedDelta,
      elapsedWallMs: performance.now() - startedAt,
    }),
  });
}

function cellResultV1(
  cellId: string,
  rvMaterial: "rounded" | "source-rv",
  pulmonaryRoot: "source-inertial" | "characteristic-algebraic",
  trace: readonly Sample[],
  convergence: ReturnType<typeof convergeV1>["convergence"] | null,
) {
  return Object.freeze({
    cellId,
    rvMaterial,
    pulmonaryRoot,
    convergence,
    metrics: summarizeV1(trace),
  });
}

function summarizeV1(samples: readonly Sample[]) {
  const validation = measureMainWireIntegratedModelBaselineValidationV1(samples);
  const pv = samples.map((sample) => sample.valveFlowMlPerSec.PV);
  const tv = samples.map((sample) => sample.valveFlowMlPerSec.TV);
  const pap = samples.map((sample) => sample.absolutePressureMmHg.PA);
  const pvOpen = thresholdOpenV1(pv);
  const pvOpening = transitionV1(pvOpen, false, true);
  const pvClosure = nextTransitionV1(pvOpen, pvOpening, true, false);
  const tvOpen = thresholdOpenV1(tv);
  const tvClosure = previousTransitionV1(tvOpen, pvOpening, true, false);
  const tvOpening = nextTransitionV1(tvOpen, pvClosure, false, true);
  const pvIndices = cyclicIndicesV1(samples.length, pvOpening, pvClosure);
  const pvPeak = pvIndices.reduce((best, index) =>
    pv[index]! > pv[best]! ? index : best, pvIndices[0]!);
  const pvGradient = samples.map((sample) =>
    sample.absolutePressureMmHg.RV - sample.absolutePressureMmHg.PA);
  const pvDurationSec = cyclicDurationV1(samples, pvOpening, pvClosure);
  const rvRate = samples.slice(1).map((sample, index) =>
    (sample.absolutePressureMmHg.RV
      - samples[index]!.absolutePressureMmHg.RV)
      / sample.acceptedDtSec);
  const ictSec = cyclicDurationV1(samples, tvClosure, pvOpening);
  const etSec = pvDurationSec;
  const irtSec = cyclicDurationV1(samples, pvClosure, tvOpening);
  return Object.freeze({
    baselineValidation: validation,
    strokeVolumeMl:
      Math.max(...samples.map((sample) => sample.chamberVolumeMl.RV))
      - Math.min(...samples.map((sample) => sample.chamberVolumeMl.RV)),
    rvPressureRateMmHgPerSec: Object.freeze({
      maximum: Math.max(...rvRate),
      minimum: Math.min(...rvRate),
    }),
    rightTiming: Object.freeze({
      ictSec,
      ejectionTimeSec: etSec,
      irtSec,
      teiIndex: (ictSec + irtSec) / etSec,
    }),
    tricuspidPeakEToA: inletPeakRatioV1(samples, tvOpen, pvOpen),
    pulmonaryValve: Object.freeze({
      prominentPeakCount: prominentPeakCountV1(pv),
      peakFlowMlPerSec: pv[pvPeak],
      forwardVolumeMl: pvIndices.reduce((sum, index) =>
        sum + Math.max(0, pv[index]!) * samples[index]!.acceptedDtSec, 0),
      accelerationTimeSec: cyclicDurationV1(samples, pvOpening, pvPeak),
      peakPhaseWithinEjection01:
        cyclicDurationV1(samples, pvOpening, pvPeak) / etSec,
      meanGradientMmHg: pvIndices.reduce((sum, index) =>
        sum + pvGradient[index]! * samples[index]!.acceptedDtSec, 0)
        / pvDurationSec,
      peakGradientMmHg: Math.max(...pvIndices.map((index) =>
        pvGradient[index]!)),
    }),
    pulmonaryArtery: Object.freeze({
      prominentPeakCount: prominentPeakCountV1(pap),
      minimumMmHg: Math.min(...pap),
      maximumMmHg: Math.max(...pap),
      postClosureReboundMmHg: postClosureReboundV1(
        samples,
        pap,
        pvClosure,
        pvOpening,
      ),
    }),
  });
}

function factorialContrastsV1(cells: readonly ReturnType<typeof cellResultV1>[]) {
  const byId = Object.fromEntries(cells.map((cell) => [cell.cellId, cell]));
  const rr = scalarV1(byId["rounded-source-root"]!.metrics);
  const rc = scalarV1(byId["rounded-characteristic-root"]!.metrics);
  const sr = scalarV1(byId["source-rv-source-root"]!.metrics);
  const sc = scalarV1(byId["source-rv-characteristic-root"]!.metrics);
  return Object.freeze(Object.fromEntries(Object.keys(rr).map((key) => {
    const metric = key as keyof typeof rr;
    return [metric, Object.freeze({
      characteristicRootAtRoundedRv: rc[metric] - rr[metric],
      characteristicRootAtSourceRv: sc[metric] - sr[metric],
      sourceRvAtSourceRoot: sr[metric] - rr[metric],
      sourceRvAtCharacteristicRoot: sc[metric] - rc[metric],
      interaction: sc[metric] - sr[metric] - rc[metric] + rr[metric],
    })];
  })));
}

function scalarV1(metrics: ReturnType<typeof summarizeV1>) {
  return Object.freeze({
    strokeVolumeMl: metrics.strokeVolumeMl,
    rvMaximumDpDt: metrics.rvPressureRateMmHgPerSec.maximum,
    rvMinimumDpDt: metrics.rvPressureRateMmHgPerSec.minimum,
    rvIct: metrics.rightTiming.ictSec,
    rvEt: metrics.rightTiming.ejectionTimeSec,
    rvIrt: metrics.rightTiming.irtSec,
    rvTei: metrics.rightTiming.teiIndex,
    tvPeakEToA: metrics.tricuspidPeakEToA ?? Number.NaN,
    pvAccelerationTime: metrics.pulmonaryValve.accelerationTimeSec,
    pvPeakFlow: metrics.pulmonaryValve.peakFlowMlPerSec ?? Number.NaN,
    pvMeanGradient: metrics.pulmonaryValve.meanGradientMmHg,
    papMinimum: metrics.pulmonaryArtery.minimumMmHg,
    papMaximum: metrics.pulmonaryArtery.maximumMmHg,
    papPostClosureRebound: metrics.pulmonaryArtery.postClosureReboundMmHg,
  });
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

function thresholdOpenV1(values: readonly number[]) {
  const threshold = Math.max(1, 0.01 * Math.max(...values));
  return values.map((value) => value > threshold);
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
  pressure: readonly number[],
  closure: number,
  opening: number,
) {
  let runningMinimum = Number.POSITIVE_INFINITY;
  let rebound = 0;
  for (const index of cyclicIndicesV1(samples.length, closure, opening)) {
    runningMinimum = Math.min(runningMinimum, pressure[index]!);
    rebound = Math.max(rebound, pressure[index]! - runningMinimum);
  }
  return rebound;
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
