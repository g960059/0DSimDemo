import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5ABArtifact from "@/data/myocardium/protocols/arterial-root-inertance-closed-loop-phase5ab-result-v1.json";
import { defaultParams } from "@/engine/ModelCore";
import { buildEdges, buildNodes } from "@/engine/core/topology";
import type { CoreRuntimeParams } from "@/engine/protocol";

export const ARTERIAL_ROOT_ZC_IMPEDANCE_BENCH_PHASE5AC_ID =
  "arterial-root-zc-impedance-bench-phase5ac-result-v1";

export const ARTERIAL_ROOT_ZC_IMPEDANCE_BENCH_PHASE5AC_RESULT_PATH =
  "data/myocardium/protocols/arterial-root-zc-impedance-bench-phase5ac-result-v1.json";

const MMHG_TO_PA = 133.322;
const ML_TO_M3 = 1e-6;
const PA_SEC_PER_M3_PER_MMHG_SEC_PER_ML = MMHG_TO_PA / ML_TO_M3;
const DT_SEC = 0.0005 as const;
const SIM_DURATION_SEC = 1.2 as const;
const EJECTION_DURATION_SEC = 0.25 as const;
const STROKE_VOLUME_ML = 70 as const;
const INPUT_FREQUENCIES_HZ = [0.5, 1, 2, 3, 5, 8, 12, 16, 20] as const;

const ROOT_INERTANCE_CANDIDATES = [
  { id: "current-aov-l", effectiveAoVInertanceMultiple: 1, source: "phase5ab-current-closure" },
  { id: "phase5ab-pareto-total-2x-aov-l", effectiveAoVInertanceMultiple: 2, source: "phase5ab-lower-output-preserving-region" },
  { id: "phase5ab-pareto-total-3x-aov-l", effectiveAoVInertanceMultiple: 3, source: "phase5ab-lower-output-preserving-region" },
  { id: "phase5ab-pareto-total-4x-aov-l", effectiveAoVInertanceMultiple: 4, source: "phase5ab-lower-output-preserving-region" },
] as const;

type CandidateId = typeof ROOT_INERTANCE_CANDIDATES[number]["id"];

type Complex = {
  readonly re: number;
  readonly im: number;
};

type LinearizedArterialLoad = {
  readonly source: "ModelCore-default-topology-linearized-systemic-arterial-load";
  readonly arterialStiffness: number;
  readonly compliancesMlPerMmHg: {
    readonly Ao: number;
    readonly SA: number;
    readonly Art: number;
    readonly Cap: number;
  };
  readonly resistancesMmHgSecPerMl: {
    readonly Ao_SA: number;
    readonly SA_Art: number;
    readonly Art_Cap: number;
    readonly Cap_terminal: number;
  };
  readonly inertancesMmHgSec2PerMl: {
    readonly Ao_SA: number;
    readonly baseAoV_L: number;
  };
  readonly baselinePressuresMmHg: {
    readonly Ao: number;
    readonly SA: number;
    readonly Art: number;
    readonly Cap: number;
  };
};

export type ArterialRootZcImpedanceBenchPhase5ACSpectrumPoint = {
  readonly frequencyHz: number;
  readonly inputImpedanceMagnitudeMmHgSecPerMl: number;
  readonly inputImpedanceMagnitudePaSecPerM3: number;
  readonly inputImpedancePhaseRad: number;
  readonly treeImpedanceMagnitudeMmHgSecPerMl: number;
  readonly seriesInertanceMagnitudeMmHgSecPerMl: number;
};

export type ArterialRootZcImpedanceBenchPhase5ACTimeResponse = {
  readonly protocol: "half-sine-ejection-flow";
  readonly durationSec: typeof SIM_DURATION_SEC;
  readonly dtSec: typeof DT_SEC;
  readonly ejectionDurationSec: typeof EJECTION_DURATION_SEC;
  readonly strokeVolumeMl: typeof STROKE_VOLUME_ML;
  readonly peakInputFlowMlPerSec: number;
  readonly peakAoSaFlowMlPerSec: number;
  readonly peakInputPressureMmHg: number;
  readonly peakRootPressureMmHg: number;
  readonly pressurePeakTimeSec: number;
  readonly flowPeakTimeSec: number;
  readonly aoSaFlowPeakTimeSec: number;
  readonly pressurePeakDelayVsFlowPeakSec: number;
  readonly pressureFwhmSec: number | null;
  readonly rootPressureFwhmSec: number | null;
  readonly seriesInertivePeakEnergyProxyMmHgMl: number;
  readonly downstreamComplianceStoredEnergyProxyMmHgMl: number;
  readonly downstreamAoSaDissipatedEnergyProxyMmHgMl: number;
};

export type ArterialRootZcImpedanceBenchPhase5ACRun = {
  readonly candidateId: CandidateId;
  readonly source: typeof ROOT_INERTANCE_CANDIDATES[number]["source"];
  readonly effectiveAoVInertanceMultiple: number;
  readonly effectiveAoVInertanceMmHgSec2PerMl: number;
  readonly lowFrequencyResistanceEstimateMmHgSecPerMl: number;
  readonly lowFrequencyResistanceEstimatePaSecPerM3: number;
  readonly highFrequencyImpedanceEstimateMmHgSecPerMl: number;
  readonly highFrequencyImpedanceEstimatePaSecPerM3: number;
  readonly highFrequencyPhaseRad: number;
  readonly candidateCharacteristicImpedanceStatus: "available-direct-linear-bench";
  readonly candidateCharacteristicImpedancePaSecPerM3: number;
  readonly candidateReflectionCoefficientStatus: "unavailable-no-proxy";
  readonly candidateReflectionCoefficient: null;
  readonly pressureWaveTravelOrDelayProxyStatus: "available-time-response-proxy";
  readonly pressureWaveTravelOrDelayProxySec: number;
  readonly impedanceSpectrum: readonly ArterialRootZcImpedanceBenchPhase5ACSpectrumPoint[];
  readonly timeResponse: ArterialRootZcImpedanceBenchPhase5ACTimeResponse;
};

export type ArterialRootZcImpedanceBenchPhase5ACEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ARTERIAL_ROOT_ZC_IMPEDANCE_BENCH_PHASE5AC_ID;
  readonly phase: "Phase 5AC";
  readonly claimBoundary: "isolated-arterial-root-zc-impedance-bench-diagnostic-only";
  readonly upstreamPhase5ABArtifactId: typeof phase5ABArtifact.id;
  readonly verifierScript: "verify:myocardium-arterial-root-zc-impedance-bench";
  readonly protocol: {
    readonly benchMode: "linearized-current-systemic-arterial-load-with-prescribed-input-flow";
    readonly inputFrequenciesHz: typeof INPUT_FREQUENCIES_HZ;
    readonly timeResponse: {
      readonly dtSec: typeof DT_SEC;
      readonly durationSec: typeof SIM_DURATION_SEC;
      readonly ejectionDurationSec: typeof EJECTION_DURATION_SEC;
      readonly strokeVolumeMl: typeof STROKE_VOLUME_ML;
    };
    readonly candidateSet: typeof ROOT_INERTANCE_CANDIDATES;
  };
  readonly linearizedLoad: LinearizedArterialLoad;
  readonly runs: readonly ArterialRootZcImpedanceBenchPhase5ACRun[];
  readonly summary: {
    readonly runCount: number;
    readonly allRunsFinite: boolean;
    readonly currentLowFrequencyResistanceMmHgSecPerMl: number;
    readonly currentHighFrequencyImpedancePaSecPerM3: number;
    readonly paretoHighFrequencyImpedanceRangePaSecPerM3: {
      readonly min: number;
      readonly max: number;
    };
    readonly reflectionCoefficientAvailability: "unavailable-no-proxy";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly limitations: readonly string[];
  };
  readonly boundary: {
    readonly noModelCoreEquationChange: true;
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionRegistryIntegration: true;
    readonly noOfficialCaseWiring: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noQDotTuning: true;
    readonly noQDotClampRemoval: true;
    readonly noValveThresholdTuning: true;
    readonly noValveLossTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noTrefFudge: true;
    readonly noSourceStressScaling: true;
    readonly noDirectAoSAAdoption: true;
    readonly noReflectionCoefficientClaim: true;
    readonly noRootCauseAcceptance: true;
    readonly noFixAcceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildArterialRootZcImpedanceBenchPhase5ACEvidence():
ArterialRootZcImpedanceBenchPhase5ACEvidence {
  const params = defaultParams();
  const load = linearizedArterialLoad(params);
  const runs = ROOT_INERTANCE_CANDIDATES.map((candidate) => runCandidate(load, candidate));
  const current = runs[0];
  const paretoHighFrequency = runs.slice(1).map((run) => run.highFrequencyImpedanceEstimatePaSecPerM3);
  const evidenceWithoutHash: Omit<ArterialRootZcImpedanceBenchPhase5ACEvidence, "normalizedSha256"> = {
    schemaVersion: 1 as const,
    id: ARTERIAL_ROOT_ZC_IMPEDANCE_BENCH_PHASE5AC_ID,
    phase: "Phase 5AC" as const,
    claimBoundary: "isolated-arterial-root-zc-impedance-bench-diagnostic-only" as const,
    upstreamPhase5ABArtifactId: phase5ABArtifact.id,
    verifierScript: "verify:myocardium-arterial-root-zc-impedance-bench" as const,
    protocol: {
      benchMode: "linearized-current-systemic-arterial-load-with-prescribed-input-flow" as const,
      inputFrequenciesHz: INPUT_FREQUENCIES_HZ,
      timeResponse: {
        dtSec: DT_SEC,
        durationSec: SIM_DURATION_SEC,
        ejectionDurationSec: EJECTION_DURATION_SEC,
        strokeVolumeMl: STROKE_VOLUME_ML,
      },
      candidateSet: ROOT_INERTANCE_CANDIDATES,
    },
    linearizedLoad: load,
    runs,
    summary: {
      runCount: runs.length,
      allRunsFinite: runs.every(runIsFinite),
      currentLowFrequencyResistanceMmHgSecPerMl: current.lowFrequencyResistanceEstimateMmHgSecPerMl,
      currentHighFrequencyImpedancePaSecPerM3: current.highFrequencyImpedanceEstimatePaSecPerM3,
      paretoHighFrequencyImpedanceRangePaSecPerM3: {
        min: round(Math.min(...paretoHighFrequency)),
        max: round(Math.max(...paretoHighFrequency)),
      },
      reflectionCoefficientAvailability: "unavailable-no-proxy" as const,
      currentInterpretation:
        "Phase 5AC provides direct isolated-bench input impedance spectra for the current systemic arterial load plus Phase 5AB effective AoV/root inertance candidates. It makes characteristic-impedance-like high-frequency bench readouts available, but keeps reflection coefficient unavailable/no-proxy and does not adopt Ao_SA/Zc or remove qDot clamps.",
      recommendedNext: [
        "compare the Phase 5AC bench high-frequency impedance range against literature-informed physiological Zc ranges only in a separate sourced calibration PR",
        "if a root/Zc prototype is implemented next, keep it off by default and use Phase 5AC readouts as anti-gaming diagnostics rather than acceptance",
        "keep PVein_LA/filling inertance and atrial figure-eight work in a separate lane",
      ],
      limitations: [
        "This is a linearized isolated arterial bench, not a closed-loop runtime change.",
        "The bench uses prescribed input flow and current topology-derived compliance/resistance values; it is not external physiological calibration.",
        "Downstream root pressure, Ao_SA flow, and downstream energy controls are invariant across series inertance candidates by prescribed-flow construction; candidate sensitivity is carried by input pressure and series inertive energy.",
        "candidateCharacteristicImpedancePaSecPerM3 is a direct high-frequency bench readout, not a clinical Zc validation claim.",
        "candidateReflectionCoefficient remains unavailable-no-proxy because this 0D lumped bench does not model wave travel/reflection directly.",
      ],
    },
    boundary: {
      noModelCoreEquationChange: true,
      noRuntimeDefaultFlip: true,
      noProductionRegistryIntegration: true,
      noOfficialCaseWiring: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noQDotTuning: true,
      noQDotClampRemoval: true,
      noValveThresholdTuning: true,
      noValveLossTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noTrefFudge: true,
      noSourceStressScaling: true,
      noDirectAoSAAdoption: true,
      noReflectionCoefficientClaim: true,
      noRootCauseAcceptance: true,
      noFixAcceptance: true,
      noOfficialMorphologyAcceptance: true,
      noFinalNoAlternansAcceptance: true,
      noClinicalScientificValidationClaim: true,
    },
    doesNotUnlock: [
      "ModelCoreEquationChange",
      "runtimeDefaultFlip",
      "productionRegistryIntegration",
      "officialCaseWiring",
      "officialCaseReauthoring",
      "workbenchRuntimeWiring",
      "stateSchemaMigration",
      "qDotTuning",
      "qDotClampRemoval",
      "valveThresholdTuning",
      "valveLossTuning",
      "afterloadTuning",
      "preloadTuning",
      "LandParameterTuning",
      "TrefFudge",
      "sourceStressScaling",
      "directAoSAAdoption",
      "reflectionCoefficientClaim",
      "rootCauseAcceptance",
      "fixAcceptance",
      "officialMorphologyAcceptance",
      "finalNoAlternansAcceptance",
      "clinicalScientificValidationClaim",
    ],
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function linearizedArterialLoad(params: CoreRuntimeParams): LinearizedArterialLoad {
  const nodes = buildNodes();
  const edges = buildEdges();
  const node = (name: string) => {
    const found = nodes.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`Missing node ${name}`);
    return found;
  };
  const edge = (name: string) => {
    const found = edges.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`Missing edge ${name}`);
    return found;
  };
  const arterialStiffness = Math.max(params.arterialStiffness, 0.25);
  const compliance = (name: "Ao" | "SA" | "Art") => {
    const spec = node(name);
    if (spec.kind !== "arterial") throw new Error(`${name} is not arterial`);
    const baselinePressure = name === "Ao" ? 90 : name === "SA" ? 85 : 70;
    const vsEff = Math.max((spec.Vs ?? 100) / arterialStiffness, 1);
    return round(vsEff / Math.max((spec.P0 ?? 1) + baselinePressure, 1e-6));
  };
  const cap = node("Cap");
  if (cap.kind !== "linear") throw new Error("Cap is not linear");
  return {
    source: "ModelCore-default-topology-linearized-systemic-arterial-load",
    arterialStiffness: round(arterialStiffness),
    compliancesMlPerMmHg: {
      Ao: compliance("Ao"),
      SA: compliance("SA"),
      Art: compliance("Art"),
      Cap: round(cap.C ?? 15),
    },
    resistancesMmHgSecPerMl: {
      Ao_SA: round(edge("Ao_SA").R ?? 0),
      SA_Art: round(edge("SA_Art").R ?? 0),
      Art_Cap: round(edge("Art_Cap").R ?? 0),
      Cap_terminal: round(edge("Cap_SV").R ?? 0),
    },
    inertancesMmHgSec2PerMl: {
      Ao_SA: round(edge("Ao_SA").L ?? 0),
      baseAoV_L: round(params.AoV_L),
    },
    baselinePressuresMmHg: {
      Ao: 90,
      SA: 85,
      Art: 70,
      Cap: 25,
    },
  };
}

function runCandidate(
  load: LinearizedArterialLoad,
  candidate: typeof ROOT_INERTANCE_CANDIDATES[number],
): ArterialRootZcImpedanceBenchPhase5ACRun {
  const effectiveL = load.inertancesMmHgSec2PerMl.baseAoV_L * candidate.effectiveAoVInertanceMultiple;
  const impedanceSpectrum = INPUT_FREQUENCIES_HZ.map((frequencyHz) =>
    impedanceAtFrequency(load, effectiveL, frequencyHz)
  );
  const high = impedanceSpectrum[impedanceSpectrum.length - 1];
  const timeResponse = simulateTimeResponse(load, effectiveL);
  const dcResistance = dcResistanceEstimate(load);
  return {
    candidateId: candidate.id,
    source: candidate.source,
    effectiveAoVInertanceMultiple: candidate.effectiveAoVInertanceMultiple,
    effectiveAoVInertanceMmHgSec2PerMl: round(effectiveL),
    lowFrequencyResistanceEstimateMmHgSecPerMl: round(dcResistance),
    lowFrequencyResistanceEstimatePaSecPerM3: round(dcResistance * PA_SEC_PER_M3_PER_MMHG_SEC_PER_ML),
    highFrequencyImpedanceEstimateMmHgSecPerMl: high.inputImpedanceMagnitudeMmHgSecPerMl,
    highFrequencyImpedanceEstimatePaSecPerM3: high.inputImpedanceMagnitudePaSecPerM3,
    highFrequencyPhaseRad: high.inputImpedancePhaseRad,
    candidateCharacteristicImpedanceStatus: "available-direct-linear-bench",
    candidateCharacteristicImpedancePaSecPerM3: high.inputImpedanceMagnitudePaSecPerM3,
    candidateReflectionCoefficientStatus: "unavailable-no-proxy",
    candidateReflectionCoefficient: null,
    pressureWaveTravelOrDelayProxyStatus: "available-time-response-proxy",
    pressureWaveTravelOrDelayProxySec: timeResponse.pressurePeakDelayVsFlowPeakSec,
    impedanceSpectrum,
    timeResponse,
  };
}

function dcResistanceEstimate(load: LinearizedArterialLoad): number {
  const R = load.resistancesMmHgSecPerMl;
  return R.Ao_SA + R.SA_Art + R.Art_Cap + R.Cap_terminal;
}

function impedanceAtFrequency(
  load: LinearizedArterialLoad,
  effectiveAoVInertance: number,
  frequencyHz: number,
): ArterialRootZcImpedanceBenchPhase5ACSpectrumPoint {
  const omega = 2 * Math.PI * frequencyHz;
  const s = c(0, omega);
  const tree = arterialTreeImpedance(load, s);
  const series = mul(s, c(effectiveAoVInertance, 0));
  const total = add(tree, series);
  return {
    frequencyHz,
    inputImpedanceMagnitudeMmHgSecPerMl: round(abs(total)),
    inputImpedanceMagnitudePaSecPerM3: round(abs(total) * PA_SEC_PER_M3_PER_MMHG_SEC_PER_ML),
    inputImpedancePhaseRad: round(Math.atan2(total.im, total.re)),
    treeImpedanceMagnitudeMmHgSecPerMl: round(abs(tree)),
    seriesInertanceMagnitudeMmHgSecPerMl: round(abs(series)),
  };
}

function arterialTreeImpedance(load: LinearizedArterialLoad, s: Complex): Complex {
  const C = load.compliancesMlPerMmHg;
  const R = load.resistancesMmHgSecPerMl;
  const L = load.inertancesMmHgSec2PerMl;
  const matrix: Complex[][] = [
    [mul(s, c(C.Ao, 0)), c(0, 0), c(0, 0), c(0, 0), c(1, 0)],
    [c(-1, 0), c(1, 0), c(0, 0), c(0, 0), add(c(R.Ao_SA, 0), mul(s, c(L.Ao_SA, 0)))],
    [c(0, 0), add(mul(s, c(C.SA, 0)), c(1 / R.SA_Art, 0)), c(-1 / R.SA_Art, 0), c(0, 0), c(-1, 0)],
    [c(0, 0), c(-1 / R.SA_Art, 0), add(mul(s, c(C.Art, 0)), c((1 / R.SA_Art) + (1 / R.Art_Cap), 0)), c(-1 / R.Art_Cap, 0), c(0, 0)],
    [c(0, 0), c(0, 0), c(-1 / R.Art_Cap, 0), add(mul(s, c(C.Cap, 0)), c((1 / R.Art_Cap) + (1 / R.Cap_terminal), 0)), c(0, 0)],
  ];
  const rhs = [c(1, 0), c(0, 0), c(0, 0), c(0, 0), c(0, 0)];
  const solution = solveComplexLinearSystem(matrix, rhs);
  return solution[0];
}

function simulateTimeResponse(
  load: LinearizedArterialLoad,
  effectiveAoVInertance: number,
): ArterialRootZcImpedanceBenchPhase5ACTimeResponse {
  let state = [0, 0, 0, 0, 0]; // Pao, Psa, Part, Pcap, qAoSa.
  const pressure: number[] = [];
  const rootPressure: number[] = [];
  const flow: number[] = [];
  const aoSaFlow: number[] = [];
  const times: number[] = [];
  for (let t = 0; t <= SIM_DURATION_SEC + 1e-12; t += DT_SEC) {
    const qin = prescribedFlowMlPerSec(t);
    const pInput = state[0] + effectiveAoVInertance * prescribedFlowDerivativeMlPerSec2(t);
    times.push(round(t));
    pressure.push(pInput);
    rootPressure.push(state[0]);
    flow.push(qin);
    aoSaFlow.push(state[4]);
    state = rk4Step(state, t, DT_SEC, load);
  }
  const peakPressure = maxValue(pressure);
  const peakRootPressure = maxValue(rootPressure);
  const peakFlow = maxValue(flow);
  const peakAoSaFlow = maxValue(aoSaFlow);
  const pressurePeakTime = times[indexOfMax(pressure)];
  const flowPeakTime = times[indexOfMax(flow)];
  const aoSaFlowPeakTime = times[indexOfMax(aoSaFlow)];
  return {
    protocol: "half-sine-ejection-flow",
    durationSec: SIM_DURATION_SEC,
    dtSec: DT_SEC,
    ejectionDurationSec: EJECTION_DURATION_SEC,
    strokeVolumeMl: STROKE_VOLUME_ML,
    peakInputFlowMlPerSec: round(peakFlow),
    peakAoSaFlowMlPerSec: round(peakAoSaFlow),
    peakInputPressureMmHg: round(peakPressure),
    peakRootPressureMmHg: round(peakRootPressure),
    pressurePeakTimeSec: round(pressurePeakTime),
    flowPeakTimeSec: round(flowPeakTime),
    aoSaFlowPeakTimeSec: round(aoSaFlowPeakTime),
    pressurePeakDelayVsFlowPeakSec: round(pressurePeakTime - flowPeakTime),
    pressureFwhmSec: widthAtHalfMax(times, pressure),
    rootPressureFwhmSec: widthAtHalfMax(times, rootPressure),
    seriesInertivePeakEnergyProxyMmHgMl: round(0.5 * effectiveAoVInertance * peakFlow * peakFlow),
    downstreamComplianceStoredEnergyProxyMmHgMl: round(0.5 * load.compliancesMlPerMmHg.Ao * peakRootPressure * peakRootPressure),
    downstreamAoSaDissipatedEnergyProxyMmHgMl: round(integratePowerLoss(times, aoSaFlow, load)),
  };
}

function derivative(state: readonly number[], t: number, load: LinearizedArterialLoad): number[] {
  const [pao, psa, part, pcap, qAoSa] = state;
  const qin = prescribedFlowMlPerSec(t);
  const C = load.compliancesMlPerMmHg;
  const R = load.resistancesMmHgSecPerMl;
  const L = Math.max(load.inertancesMmHgSec2PerMl.Ao_SA, 1e-9);
  const qSaArt = (psa - part) / R.SA_Art;
  const qArtCap = (part - pcap) / R.Art_Cap;
  const qTerminal = pcap / R.Cap_terminal;
  return [
    (qin - qAoSa) / C.Ao,
    (qAoSa - qSaArt) / C.SA,
    (qSaArt - qArtCap) / C.Art,
    (qArtCap - qTerminal) / C.Cap,
    (pao - psa - R.Ao_SA * qAoSa) / L,
  ];
}

function rk4Step(state: readonly number[], t: number, h: number, load: LinearizedArterialLoad): number[] {
  const k1 = derivative(state, t, load);
  const k2 = derivative(addScaled(state, k1, h / 2), t + h / 2, load);
  const k3 = derivative(addScaled(state, k2, h / 2), t + h / 2, load);
  const k4 = derivative(addScaled(state, k3, h), t + h, load);
  return state.map((value, index) => value + (h / 6) * (k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index]));
}

function addScaled(state: readonly number[], derivativeValues: readonly number[], scale: number): number[] {
  return state.map((value, index) => value + scale * derivativeValues[index]);
}

function prescribedFlowMlPerSec(t: number): number {
  if (t < 0 || t > EJECTION_DURATION_SEC) return 0;
  return (STROKE_VOLUME_ML * Math.PI / (2 * EJECTION_DURATION_SEC)) * Math.sin(Math.PI * t / EJECTION_DURATION_SEC);
}

function prescribedFlowDerivativeMlPerSec2(t: number): number {
  if (t < 0 || t > EJECTION_DURATION_SEC) return 0;
  return (STROKE_VOLUME_ML * Math.PI * Math.PI / (2 * EJECTION_DURATION_SEC * EJECTION_DURATION_SEC))
    * Math.cos(Math.PI * t / EJECTION_DURATION_SEC);
}

function integratePowerLoss(times: readonly number[], aoSaFlow: readonly number[], load: LinearizedArterialLoad): number {
  let loss = 0;
  for (let i = 1; i < times.length; i++) {
    const t0 = times[i - 1];
    const t1 = times[i];
    const dt = t1 - t0;
    const q0 = aoSaFlow[i - 1] ?? 0;
    const q1 = aoSaFlow[i] ?? 0;
    loss += 0.5 * dt * load.resistancesMmHgSecPerMl.Ao_SA * (q0 * q0 + q1 * q1);
  }
  return loss;
}

function runIsFinite(run: ArterialRootZcImpedanceBenchPhase5ACRun): boolean {
  return [
    run.effectiveAoVInertanceMmHgSec2PerMl,
    run.lowFrequencyResistanceEstimateMmHgSecPerMl,
    run.highFrequencyImpedanceEstimatePaSecPerM3,
    run.timeResponse.peakInputPressureMmHg,
  ].every(Number.isFinite);
}

function solveComplexLinearSystem(matrixInput: readonly (readonly Complex[])[], rhsInput: readonly Complex[]): Complex[] {
  const n = rhsInput.length;
  const matrix = matrixInput.map((row, i) => [...row.map(copy), copy(rhsInput[i])]);
  for (let pivot = 0; pivot < n; pivot++) {
    let maxRow = pivot;
    for (let row = pivot + 1; row < n; row++) {
      if (abs(matrix[row][pivot]) > abs(matrix[maxRow][pivot])) maxRow = row;
    }
    if (abs(matrix[maxRow][pivot]) < 1e-12) throw new Error("Singular arterial impedance matrix");
    [matrix[pivot], matrix[maxRow]] = [matrix[maxRow], matrix[pivot]];
    const pivotValue = matrix[pivot][pivot];
    for (let col = pivot; col <= n; col++) matrix[pivot][col] = div(matrix[pivot][col], pivotValue);
    for (let row = 0; row < n; row++) {
      if (row === pivot) continue;
      const factor = matrix[row][pivot];
      for (let col = pivot; col <= n; col++) {
        matrix[row][col] = sub(matrix[row][col], mul(factor, matrix[pivot][col]));
      }
    }
  }
  return matrix.map((row) => row[n]);
}

function c(re: number, im: number): Complex {
  return { re, im };
}

function copy(value: Complex): Complex {
  return { re: value.re, im: value.im };
}

function add(a: Complex, b: Complex): Complex {
  return c(a.re + b.re, a.im + b.im);
}

function sub(a: Complex, b: Complex): Complex {
  return c(a.re - b.re, a.im - b.im);
}

function mul(a: Complex, b: Complex): Complex {
  return c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}

function div(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  return c((a.re * b.re + a.im * b.im) / denom, (a.im * b.re - a.re * b.im) / denom);
}

function abs(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

function maxValue(values: readonly number[]): number {
  return Math.max(...values.filter(Number.isFinite));
}

function indexOfMax(values: readonly number[]): number {
  let index = 0;
  for (let i = 1; i < values.length; i++) if (values[i] > values[index]) index = i;
  return index;
}

function widthAtHalfMax(times: readonly number[], values: readonly number[]): number | null {
  const peak = maxValue(values);
  if (!Number.isFinite(peak) || peak <= 0) return null;
  const half = peak / 2;
  const selected = times.filter((_, index) => values[index] >= half);
  if (selected.length < 2) return null;
  return round(selected[selected.length - 1] - selected[0]);
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1e6) / 1e6;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value == null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${stableStringify(record[key])}`
  ).join(",")}}`;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildArterialRootZcImpedanceBenchPhase5AC.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const evidence = buildArterialRootZcImpedanceBenchPhase5ACEvidence();
  if (process.argv.includes("--write")) {
    const outPath = path.join(process.cwd(), ARTERIAL_ROOT_ZC_IMPEDANCE_BENCH_PHASE5AC_RESULT_PATH);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
