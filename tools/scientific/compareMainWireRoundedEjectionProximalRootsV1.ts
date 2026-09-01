import checkpointV1 from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json";

import { buildEdges, buildNodes } from "@/engine/core/topology";
import {
  MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1,
} from "@/engine/core/MainWireAlgebraicProximalArterialRootsProfileV1";
import {
  MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
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
  measureMainWireIntegratedModelBaselineValidationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  createMainWireRoundedEjectionFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireRoundedEjectionFiveWallProviderV1";
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

const sourceFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1();
const pulmonaryOnlyFixture = createRoundedEjectionRootAblationFixtureV1(
  "pulmonary-only",
);
const bilateralFixture = createRoundedEjectionRootAblationFixtureV1(
  "bilateral-with-selected-aortic-outflow",
);
const sourceRootsHybridRvFixture = createRoundedEjectionRootAblationFixtureV1(
  "source-roots-hybrid-rv",
);
const pulmonaryOnlyHybridRvFixture =
  createRoundedEjectionRootAblationFixtureV1(
    "pulmonary-only-hybrid-rv",
  );
const restored =
  await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    .restoreStandard68ExactCheckpoint(checkpointV1);
const sourceAccepted = restored.currentAcceptedState();
const sourceRun = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
  sourceFixture as unknown as MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  sourceAccepted,
  135,
  0.002,
);
const pulmonaryOnly = runContinuationV1(pulmonaryOnlyFixture);
const bilateral = runContinuationV1(bilateralFixture);
const sourceRootsHybridRv = runContinuationV1(sourceRootsHybridRvFixture);
const pulmonaryOnlyHybridRv = runContinuationV1(
  pulmonaryOnlyHybridRvFixture,
);

process.stdout.write(`${JSON.stringify({
  comparisonId: "main-wire-rounded-ejection-proximal-roots-ablation-v1",
  interpretation: {
    source: "Standard68 rounded material with source root inertances",
    factorization:
      "pulmonary-only isolates PA_PArt L=0; bilateral reproduces the existing Standard67 root construction on the same rounded myocardium",
    evidenceRole:
      "causal characterization only; neither target is a minted model or clinical validation claim",
  },
  sourceLinearizedPulmonaryRootMode:
    linearizedPulmonaryRootModeV1(sourceRun.traceSamples),
  source: summarizeV1(sourceRun.traceSamples),
  pulmonaryOnly: Object.freeze({
    interpretation:
      "only PA_PArt momentum memory is removed; source aortic branch and all R/C/valve laws are unchanged",
    continuation: pulmonaryOnly.continuation,
    summary: summarizeV1(pulmonaryOnly.trace),
  }),
  sourceRootsHybridRv: Object.freeze({
    interpretation:
      "LVFW and SEP use rounded material, RVFW uses source material, and both arterial root inertances are retained",
    continuation: sourceRootsHybridRv.continuation,
    summary: summarizeV1(sourceRootsHybridRv.trace),
  }),
  pulmonaryOnlyHybridRv: Object.freeze({
    interpretation:
      "LVFW and SEP use rounded material, RVFW uses source material, and only PA_PArt momentum memory is removed",
    continuation: pulmonaryOnlyHybridRv.continuation,
    summary: summarizeV1(pulmonaryOnlyHybridRv.trace),
  }),
  bilateral: Object.freeze({
    interpretation:
      "existing Standard67 selected-aortic-outflow profile plus algebraic Ao_SA and PA_PArt roots",
    continuation: bilateral.continuation,
    summary: summarizeV1(bilateral.trace),
  }),
}, null, 2)}\n`);

function linearizedPulmonaryRootModeV1(samples: readonly Sample[]) {
  const paNode = buildNodes().find((node) => node.name === "PA");
  const partNode = buildNodes().find((node) => node.name === "PArt");
  const root = buildEdges().find((edge) => edge.name === "PA_PArt");
  if (
    paNode?.kind !== "arterial"
    || partNode?.kind !== "arterial"
    || paNode.P0 === undefined
    || paNode.Vs === undefined
    || partNode.P0 === undefined
    || partNode.Vs === undefined
    || root?.kind !== "dynamic"
    || root.L === undefined
  ) throw new Error("pulmonary root linearization prerequisites unavailable");
  const durationSec = samples.reduce(
    (sum, sample) => sum + sample.acceptedDtSec,
    0,
  );
  const mean = (nodeId: "PA" | "PArt") => samples.reduce(
    (sum, sample) =>
      sum + sample.absolutePressureMmHg[nodeId] * sample.acceptedDtSec,
    0,
  ) / durationSec;
  const meanPaMmHg = mean("PA");
  const meanPArtMmHg = mean("PArt");
  const paComplianceMlPerMmHg = paNode.Vs / (meanPaMmHg + paNode.P0);
  const partComplianceMlPerMmHg =
    partNode.Vs / (meanPArtMmHg + partNode.P0);
  const differentialModeComplianceMlPerMmHg =
    paComplianceMlPerMmHg * partComplianceMlPerMmHg
      / (paComplianceMlPerMmHg + partComplianceMlPerMmHg);
  const naturalAngularFrequencyPerSec = Math.sqrt(
    1 / (root.L * differentialModeComplianceMlPerMmHg),
  );
  const dampingRatio = root.R / 2 * Math.sqrt(
    differentialModeComplianceMlPerMmHg / root.L,
  );
  const dampedPeriodSec = 2 * Math.PI / (
    naturalAngularFrequencyPerSec * Math.sqrt(1 - dampingRatio ** 2)
  );
  return Object.freeze({
    approximation:
      "local two-compliance PA-PArt differential-mode linearization at time-weighted mean pressure; peripheral and ventricular coupling omitted",
    sourceResistanceMmHgSecPerMl: root.R,
    sourceInertanceMmHgSec2PerMl: root.L,
    meanPaMmHg,
    meanPArtMmHg,
    paComplianceMlPerMmHg,
    partComplianceMlPerMmHg,
    differentialModeComplianceMlPerMmHg,
    naturalAngularFrequencyPerSec,
    dampingRatio,
    dampedPeriodSec,
    criticalResistanceMmHgSecPerMl:
      2 * Math.sqrt(root.L / differentialModeComplianceMlPerMmHg),
    maximumInertanceForDampingRatio07AtSourceResistance:
      differentialModeComplianceMlPerMmHg
        * (root.R / (2 * 0.7)) ** 2,
  });
}

function createRoundedEjectionRootAblationFixtureV1(
  variant:
    | "pulmonary-only"
    | "bilateral-with-selected-aortic-outflow"
    | "source-roots-hybrid-rv"
    | "pulmonary-only-hybrid-rv",
) {
  const prepared = prepareMainWireIntegratedModelFixtureInputsV3(
    MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    1,
    MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  );
  return assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    prepared,
    {
      createProvider: () => variant.includes("hybrid-rv")
        ? createRoundedLvSeptumSourceRvProviderV1(
            prepared.chamberMechanics,
          )
        : createMainWireRoundedEjectionFiveWallProviderV1(
            prepared.chamberMechanics,
          ),
      createVascularRuntime: () => (
        variant === "pulmonary-only"
        || variant === "pulmonary-only-hybrid-rv"
      )
        ? Object.freeze({
            venousTone: prepared.hemodynamicResearchInputs.venousTone,
            arterialStiffness:
              prepared.hemodynamicResearchInputs.arterialStiffness,
            algebraicPulmonaryArterialRootProfile:
              MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
          })
        : variant === "bilateral-with-selected-aortic-outflow"
          ? Object.freeze({
            venousTone: prepared.hemodynamicResearchInputs.venousTone,
            arterialStiffness:
              prepared.hemodynamicResearchInputs.arterialStiffness,
            selectedAorticOutflowProfile:
              MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
            algebraicProximalArterialRootsProfile:
              MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1,
          })
          : Object.freeze({
              venousTone: prepared.hemodynamicResearchInputs.venousTone,
              arterialStiffness:
                prepared.hemodynamicResearchInputs.arterialStiffness,
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

function createRoundedLvSeptumSourceRvProviderV1(
  inputs: Parameters<
    typeof createMaterialKernelsWithMechanicsResearchInputsV1
  >[0],
) {
  const rounded = createMaterialKernelsWithMechanicsResearchInputsV1(
    inputs,
    MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1,
    MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1,
  );
  const source = createMaterialKernelsWithMechanicsResearchInputsV1(inputs);
  return createNormalAdultProviderFromKernels(
    "on",
    Object.freeze({
      ...rounded,
      RVFW: source.RVFW,
    }),
    "-rounded-lv-sep-source-rv-factor-ablation-v1",
  );
}

function runContinuationV1(
  targetFixture: ReturnType<
    typeof createRoundedEjectionRootAblationFixtureV1
  >,
) {
  let accepted = warmStartMainWireIntegratedModelV3({
    source: sourceAccepted,
    sourceRuntime:
      sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
    targetRuntime:
      targetFixture as unknown as MainWireIntegratedModelRuntimeV3,
  });
  let trace: readonly Sample[] = [];
  let latestPeriod1MaximumNormalizedDelta = Number.POSITIVE_INFINITY;
  let consecutivePeriod1Passes = 0;
  let completedCycles = 0;
  for (let cycle = 1; cycle <= 40; cycle += 1) {
    const prior = accepted;
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      targetFixture as unknown as
        MainWireIntegratedModelRegularSinusAllOffFixtureV3,
      accepted,
      cycle,
      0.002,
    );
    accepted = run.terminalAcceptedState;
    trace = run.traceSamples;
    completedCycles = cycle;
    latestPeriod1MaximumNormalizedDelta =
      compareMainWireIntegratedModelAcceptedStatesV3(
        accepted,
        prior,
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
        targetFixture.config,
      ).overall.maximumNormalizedDelta;
    consecutivePeriod1Passes = latestPeriod1MaximumNormalizedDelta <= 0.001
      ? consecutivePeriod1Passes + 1
      : 0;
    if (consecutivePeriod1Passes >= 3) break;
  }
  return Object.freeze({
    continuation: Object.freeze({
      completedCycles,
      consecutivePeriod1Passes,
      latestPeriod1MaximumNormalizedDelta,
    }),
    trace,
  });
}

function summarizeV1(samples: readonly Sample[]) {
  const pulmonaryFlow = samples.map((sample) => sample.valveFlowMlPerSec.PV);
  const paPressure = samples.map((sample) => sample.absolutePressureMmHg.PA);
  const timing = rightTimingV1(samples);
  const durationSec = samples.reduce(
    (sum, sample) => sum + sample.acceptedDtSec,
    0,
  );
  return Object.freeze({
    baselineValidation: measureMainWireIntegratedModelBaselineValidationV1(
      samples,
    ),
    rightVentricle: Object.freeze({
      pressureRateMmHgPerSec: pressureRateV1(samples, "RV"),
    }),
    rightTiming: timing,
    tricuspidValve: Object.freeze({
      ...rightValveHydraulicSummaryV1(samples, "TV"),
      peakEToA: inletPeakRatioV1(samples, "TV", "PV"),
    }),
    pulmonaryValve: Object.freeze({
      ...rightValveHydraulicSummaryV1(samples, "PV"),
      prominentPeaks: prominentPeaksV1(samples, pulmonaryFlow),
      accelerationTimeSec: accelerationTimeV1(samples, pulmonaryFlow),
      forwardDurationSec: timing.ejectionTimeSec,
      peakFlowMlPerSec: Math.max(...pulmonaryFlow),
    }),
    pulmonaryArtery: Object.freeze({
      minimumMmHg: Math.min(...paPressure),
      maximumMmHg: Math.max(...paPressure),
      timeWeightedMeanMmHg: samples.reduce(
        (sum, sample, index) =>
          sum + paPressure[index]! * sample.acceptedDtSec,
        0,
      ) / durationSec,
      prominentPeaks: prominentPeaksV1(samples, paPressure),
      postPulmonaryValveClosureReboundMmHg:
        postClosureReboundV1(samples, paPressure),
    }),
  });
}

function pressureRateV1(
  samples: readonly Sample[],
  pressureId: "RV",
) {
  const values = samples.slice(1).map((sample, index) =>
    (sample.absolutePressureMmHg[pressureId]
      - samples[index]!.absolutePressureMmHg[pressureId])
      / sample.acceptedDtSec);
  return Object.freeze({
    maximum: Math.max(...values),
    minimum: Math.min(...values),
  });
}

function rightValveHydraulicSummaryV1(
  samples: readonly Sample[],
  valveId: "TV" | "PV",
) {
  const flows = samples.map((sample) => sample.valveFlowMlPerSec[valveId]);
  const forward = flows.map((flow) => flow > 0);
  const morphologicalOpen = thresholdOpenV1(flows);
  const gradients = samples.map((sample) => valveId === "TV"
    ? sample.absolutePressureMmHg.RA - sample.absolutePressureMmHg.RV
    : sample.absolutePressureMmHg.RV - sample.absolutePressureMmHg.PA);
  const forwardDurationSec = samples.reduce((sum, sample, index) =>
    sum + (forward[index] ? sample.acceptedDtSec : 0), 0);
  return Object.freeze({
    forwardEpisodeCount: morphologicalOpen.filter((value, index) =>
      value
      && !morphologicalOpen[
        (index - 1 + morphologicalOpen.length) % morphologicalOpen.length
      ]).length,
    forwardDurationSec,
    meanHydraulicGradientMmHg: samples.reduce((sum, sample, index) =>
      sum + (forward[index]
        ? gradients[index]! * sample.acceptedDtSec
        : 0), 0) / forwardDurationSec,
    peakHydraulicGradientMmHg: Math.max(
      ...gradients.filter((_, index) => forward[index]),
    ),
  });
}

function inletPeakRatioV1(
  samples: readonly Sample[],
  inletId: "TV",
  outletId: "PV",
) {
  const inlet = thresholdOpenV1(
    samples.map((sample) => sample.valveFlowMlPerSec[inletId]),
  );
  const outlet = thresholdOpenV1(
    samples.map((sample) => sample.valveFlowMlPerSec[outletId]),
  );
  const outletClose = nextTransitionV1(
    outlet,
    transitionV1(outlet, false, true),
    true,
    false,
  );
  const inletClose = nextTransitionV1(
    inlet,
    outletClose,
    true,
    false,
  );
  const indices = cyclicIndicesV1(samples.length, outletClose, inletClose);
  const candidates = indices.filter((index, position) => {
    const prior = indices[(position - 1 + indices.length) % indices.length]!;
    const next = indices[(position + 1) % indices.length]!;
    const value = samples[index]!.valveFlowMlPerSec[inletId];
    return value > samples[prior]!.valveFlowMlPerSec[inletId]
      && value >= samples[next]!.valveFlowMlPerSec[inletId]
      && value > 1;
  });
  const separated = [...candidates]
    .sort((left, right) =>
      samples[right]!.valveFlowMlPerSec[inletId]
        - samples[left]!.valveFlowMlPerSec[inletId])
    .reduce<number[]>((selected, index) => selected.every((other) => {
      const distance = Math.min(
        Math.abs(index - other),
        samples.length - Math.abs(index - other),
      );
      return distance * 0.002 >= 0.08;
    }) ? [...selected, index] : selected, [])
    .slice(0, 2)
    .sort((left, right) =>
      ((left - outletClose + samples.length) % samples.length)
        - ((right - outletClose + samples.length) % samples.length));
  const early = separated[0];
  const late = separated[1];
  if (early === undefined || late === undefined) {
    return Object.freeze({ status: "two-peaks-not-resolved" as const });
  }
  const peakE = samples[early]!.valveFlowMlPerSec[inletId];
  const peakA = samples[late]!.valveFlowMlPerSec[inletId];
  return Object.freeze({
    status: "resolved" as const,
    peakEMlPerSec: peakE,
    peakAMlPerSec: peakA,
    ratio: peakE / peakA,
  });
}

function rightTimingV1(samples: readonly Sample[]) {
  const tricuspid = thresholdOpenV1(
    samples.map((sample) => sample.valveFlowMlPerSec.TV),
  );
  const pulmonary = thresholdOpenV1(
    samples.map((sample) => sample.valveFlowMlPerSec.PV),
  );
  const pulmonaryOpening = transitionV1(pulmonary, false, true);
  const pulmonaryClosure = nextTransitionV1(
    pulmonary,
    pulmonaryOpening,
    true,
    false,
  );
  const tricuspidClosure = previousTransitionV1(
    tricuspid,
    pulmonaryOpening,
    true,
    false,
  );
  const tricuspidOpening = nextTransitionV1(
    tricuspid,
    pulmonaryClosure,
    false,
    true,
  );
  const ictSec = cyclicDurationV1(
    samples,
    tricuspidClosure,
    pulmonaryOpening,
  );
  const ejectionTimeSec = cyclicDurationV1(
    samples,
    pulmonaryOpening,
    pulmonaryClosure,
  );
  const irtSec = cyclicDurationV1(
    samples,
    pulmonaryClosure,
    tricuspidOpening,
  );
  return Object.freeze({
    ictSec,
    ejectionTimeSec,
    irtSec,
    teiIndex: (ictSec + irtSec) / ejectionTimeSec,
  });
}

function accelerationTimeV1(
  samples: readonly Sample[],
  flow: readonly number[],
) {
  const open = thresholdOpenV1(flow);
  const opening = transitionV1(open, false, true);
  const closure = nextTransitionV1(open, opening, true, false);
  const systolicIndices = cyclicIndicesV1(samples.length, opening, closure);
  const peak = systolicIndices.reduce((best, index) =>
    flow[index]! > flow[best]! ? index : best, systolicIndices[0]!);
  return cyclicDurationV1(samples, opening, peak);
}

function postClosureReboundV1(
  samples: readonly Sample[],
  pressure: readonly number[],
) {
  const pulmonary = thresholdOpenV1(
    samples.map((sample) => sample.valveFlowMlPerSec.PV),
  );
  const opening = transitionV1(pulmonary, false, true);
  const closure = nextTransitionV1(pulmonary, opening, true, false);
  const diastolicIndices = cyclicIndicesV1(samples.length, closure, opening);
  let runningMinimum = Number.POSITIVE_INFINITY;
  let maximumRebound = 0;
  for (const index of diastolicIndices) {
    runningMinimum = Math.min(runningMinimum, pressure[index]!);
    maximumRebound = Math.max(
      maximumRebound,
      pressure[index]! - runningMinimum,
    );
  }
  return maximumRebound;
}

function thresholdOpenV1(values: readonly number[]): readonly boolean[] {
  const threshold = Math.max(1, 0.01 * Math.max(...values));
  return values.map((value) => value > threshold);
}

function prominentPeaksV1(
  samples: readonly Sample[],
  raw: readonly number[],
) {
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
    if (selected.every((other) => {
      const distance = Math.min(
        Math.abs(index - other),
        raw.length - Math.abs(index - other),
      );
      return distance * 0.002 >= 0.05;
    })) selected.push(index);
  }
  return Object.freeze(selected
    .sort((left, right) => left - right)
    .map((index) => Object.freeze({
      phase01: samples[index]!.cyclePhase01,
      value: raw[index],
    })));
}

function transitionV1(
  values: readonly boolean[],
  from: boolean,
  to: boolean,
): number {
  const index = values.findIndex((value, candidate) =>
    value === to
    && values[(candidate - 1 + values.length) % values.length] === from);
  if (index < 0) throw new Error("required cyclic transition is unavailable");
  return index;
}

function nextTransitionV1(
  values: readonly boolean[],
  start: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 1; offset <= values.length; offset += 1) {
    const index = (start + offset) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("required next cyclic transition is unavailable");
}

function previousTransitionV1(
  values: readonly boolean[],
  start: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 0; offset < values.length; offset += 1) {
    const index = (start - offset + values.length) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("required previous cyclic transition is unavailable");
}

function cyclicDurationV1(
  samples: readonly Sample[],
  start: number,
  end: number,
) {
  return cyclicIndicesV1(samples.length, start, end).reduce(
    (duration, index) => duration + samples[index]!.acceptedDtSec,
    0,
  );
}

function cyclicIndicesV1(
  length: number,
  start: number,
  end: number,
) {
  const indices: number[] = [];
  for (let offset = 0; offset < length; offset += 1) {
    const index = (start + offset) % length;
    if (index === end) break;
    indices.push(index);
  }
  return indices;
}
