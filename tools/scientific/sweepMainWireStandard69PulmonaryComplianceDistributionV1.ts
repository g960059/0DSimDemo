import checkpointV1 from
  "@/studio/integrations/mainWireIntegratedV3/qualified-baseline-standard69-settled-baseline-checkpoint.json";

import {
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1,
  type MainWireAlgebraicPulmonaryArterialRootProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import {
  vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import { buildNodes } from "@/engine/core/topology";
import type {
  MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  warmStartMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
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
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";

type Sample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
type Fixture = ReturnType<typeof candidateFixtureV1>;
type Accepted = ReturnType<
  typeof MainWireIntegratedModelStandard68TypedAuthoritySessionV1.prototype.currentAcceptedState
>;

const startedAt = performance.now();
const hemodynamics =
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1;
const mechanism =
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1;
const sourceFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1(
  hemodynamics,
  1,
  mechanism,
);
const restored =
  await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    .restoreStandard68ExactCheckpoint(
      checkpointV1,
      hemodynamics,
      1,
      undefined,
      mechanism,
    );

const sourceAnchorCompliance = anchorComplianceV1(
  createProfileV1(1, 1),
);
const candidates = Object.freeze([
  candidateV1("source-distribution", 1),
  candidateV1("proximal-redistribution-0.75", 0.75),
  candidateV1("proximal-redistribution-0.60", 0.60),
  candidateV1("proximal-redistribution-0.50", 0.50),
]);
const results = [];
let priorAccepted = restored.currentAcceptedState();
let priorFixture: Fixture | typeof sourceFixture = sourceFixture;
for (const candidate of candidates) {
  const profile = createProfileV1(
    candidate.proximalPaStiffnessMultiplier,
    candidate.distalPArtStiffnessMultiplier,
  );
  const fixture = candidateFixtureV1(profile);
  const run = convergeV1({
    sourceAccepted: priorAccepted,
    sourceFixture: priorFixture,
    targetFixture: fixture,
  });
  results.push(Object.freeze({
    ...candidate,
    anchorCompliance: anchorComplianceV1(profile),
    convergence: run.convergence,
    metrics: summarizeV1(run.trace),
  }));
  priorAccepted = run.accepted;
  priorFixture = fixture;
}

process.stdout.write(`${JSON.stringify({
  sweepId:
    "main-wire-standard69-pulmonary-compliance-distribution-sweep-v1",
  purpose:
    "factor whether early PV-flow peaking after removal of pulmonary-root momentum memory is caused by too little compliance at the proximal PA observation node",
  modelForm: Object.freeze({
    newStateAdded: false,
    pulmonaryRootBaseResistanceMmHgSecPerMl: 0.024,
    pulmonaryRootEffectiveResistanceMmHgSecPerMl:
      0.024 * hemodynamics.pulmonaryResistance,
    pulmonaryRootInertanceMmHgSec2PerMl: 0,
    totalPaAndPArtAnchorTangentCompliance:
      "preserved algebraically at topology x0",
    individualPaAndPArtAnchorPressures:
      "preserved at topology x0 by compensating unstressed volume",
    downstreamPulmonaryResistance: "Standard69 fixed",
    valveAreasAndKinetics: "Standard69 fixed",
    ventricularMaterialAndCalcium: "Standard69 fixed",
  }),
  evidenceTargets: Object.freeze({
    pulmonaryAccelerationTime:
      "normal adult RVOT/main-PA Doppler is generally rounded with acceleration time above about 105 ms and reported means near 150-160 ms; model PV volume flow is only a morphology proxy",
    conservationConstraint:
      `source PA+PArt tangent compliance ${sourceAnchorCompliance.totalMlPerMmHg.toFixed(12)} mL/mmHg at topology anchors`,
  }),
  execution: Object.freeze({
    continuation:
      "ordered nearest-neighbor continuation from the settled Standard69 checkpoint",
    stopping:
      "three consecutive period-1 deltas <=0.001, checked every cycle",
    totalElapsedWallMs: performance.now() - startedAt,
  }),
  results,
}, null, 2)}\n`);

function candidateV1(id: string, proximalPaStiffnessMultiplier: number) {
  const proximalCompliance =
    sourceAnchorCompliance.paMlPerMmHg / proximalPaStiffnessMultiplier;
  const distalTarget =
    sourceAnchorCompliance.totalMlPerMmHg - proximalCompliance;
  if (distalTarget <= 0) {
    throw new Error(`${id} leaves no positive distal PArt compliance`);
  }
  return Object.freeze({
    id,
    proximalPaStiffnessMultiplier,
    distalPArtStiffnessMultiplier:
      sourceAnchorCompliance.pArtMlPerMmHg / distalTarget,
  });
}

function createProfileV1(
  proximalPaStiffnessMultiplier: number,
  distalPArtStiffnessMultiplier: number,
) {
  return createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1(
    0.024,
    0,
    { proximalPaStiffnessMultiplier, distalPArtStiffnessMultiplier },
  );
}

function candidateFixtureV1(
  profile: MainWireAlgebraicPulmonaryArterialRootProfileV1,
) {
  return createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1(
    hemodynamics,
    1,
    mechanism,
    profile,
  );
}

function anchorComplianceV1(
  profile: MainWireAlgebraicPulmonaryArterialRootProfileV1,
) {
  const runtime = Object.freeze({
    venousTone: hemodynamics.venousTone,
    arterialStiffness: hemodynamics.arterialStiffness,
    algebraicPulmonaryArterialRootProfile: profile,
  });
  const nodes = buildNodes();
  const compliance = (nodeId: "PA" | "PArt") => {
    const node = nodes.find((candidate) => candidate.name === nodeId);
    if (node === undefined) throw new Error(`${nodeId} node unavailable`);
    const tangent =
      vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1(
        node,
        node.x0,
        runtime,
        "fixed-32-iterations",
      );
    return Object.freeze({
      pressureMmHg: tangent.transmuralPressureMmHg,
      complianceMlPerMmHg:
        1 / tangent.dTransmuralPressureDPhysicalVolumeMmHgPerMl,
    });
  };
  const pa = compliance("PA");
  const pArt = compliance("PArt");
  return Object.freeze({
    paPressureMmHg: pa.pressureMmHg,
    pArtPressureMmHg: pArt.pressureMmHg,
    paMlPerMmHg: pa.complianceMlPerMmHg,
    pArtMlPerMmHg: pArt.complianceMlPerMmHg,
    totalMlPerMmHg:
      pa.complianceMlPerMmHg + pArt.complianceMlPerMmHg,
  });
}

function convergeV1(input: Readonly<{
  sourceAccepted: Accepted;
  sourceFixture: Fixture | typeof sourceFixture;
  targetFixture: Fixture;
}>) {
  const cellStartedAt = performance.now();
  let accepted = warmStartMainWireIntegratedModelV3({
    source: input.sourceAccepted,
    sourceRuntime:
      input.sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
    targetRuntime:
      input.targetFixture as unknown as MainWireIntegratedModelRuntimeV3,
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
      elapsedWallMs: performance.now() - cellStartedAt,
    }),
  });
}

function summarizeV1(samples: readonly Sample[]) {
  const validation = measureMainWireIntegratedModelBaselineValidationV1(samples);
  const pv = samples.map((sample) => sample.valveFlowMlPerSec.PV);
  const tv = samples.map((sample) => sample.valveFlowMlPerSec.TV);
  const pap = samples.map((sample) => sample.absolutePressureMmHg.PA);
  const pvGradient = samples.map((sample) =>
    sample.absolutePressureMmHg.RV - sample.absolutePressureMmHg.PA);
  const pvOpen = thresholdOpenV1(pv);
  const pvOpening = transitionV1(pvOpen, false, true);
  const pvClosure = nextTransitionV1(pvOpen, pvOpening, true, false);
  const tvOpen = thresholdOpenV1(tv);
  const tvClosure = previousTransitionV1(tvOpen, pvOpening, true, false);
  const tvOpening = nextTransitionV1(tvOpen, pvClosure, false, true);
  const pvIndices = cyclicIndicesV1(samples.length, pvOpening, pvClosure);
  const pvPeak = pvIndices.reduce((best, index) =>
    pv[index]! > pv[best]! ? index : best, pvIndices[0]!);
  const rvRate = samples.slice(1).map((sample, index) =>
    (sample.absolutePressureMmHg.RV
      - samples[index]!.absolutePressureMmHg.RV)
      / sample.acceptedDtSec);
  const ictSec = cyclicDurationV1(samples, tvClosure, pvOpening);
  const etSec = cyclicDurationV1(samples, pvOpening, pvClosure);
  const irtSec = cyclicDurationV1(samples, pvClosure, tvOpening);
  const accelerationTimeSec = cyclicDurationV1(samples, pvOpening, pvPeak);
  return Object.freeze({
    systemicCardiacIndexLPerMinPerM2:
      validation.cardiacSizeAndFunction.systemicForwardFlow
        .cardiacIndexLPerMinPerM2,
    rightVentricularEjectionFraction01:
      validation.cardiacSizeAndFunction.rightVentricle.ejectionFraction01,
    strokeVolumeMl:
      Math.max(...samples.map((sample) => sample.chamberVolumeMl.RV))
      - Math.min(...samples.map((sample) => sample.chamberVolumeMl.RV)),
    rvpMorphology: validation.RVP,
    rvDpDtMmHgPerSec: Object.freeze({
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
      accelerationTimeSec,
      peakPhaseWithinEjection01: accelerationTimeSec / etSec,
      meanGradientMmHg: pvIndices.reduce((sum, index) =>
        sum + pvGradient[index]! * samples[index]!.acceptedDtSec, 0) / etSec,
      peakGradientMmHg: Math.max(...pvIndices.map((index) =>
        pvGradient[index]!)),
    }),
    pulmonaryArtery: Object.freeze({
      minimumMmHg: Math.min(...pap),
      maximumMmHg: Math.max(...pap),
      prominentPeakCount: prominentPeakCountV1(pap),
      postClosureReboundMmHg: postClosureReboundV1(
        samples,
        pap,
        pvClosure,
        pvOpening,
      ),
    }),
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
