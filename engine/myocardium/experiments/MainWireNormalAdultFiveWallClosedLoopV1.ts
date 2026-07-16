import { defaultParams } from "@/engine/core/params";
import type {
  NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  initializeMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
  type MainWireFiveWallNonCoronaryAcceptedStateV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireFiveWallLandTriSegReadbackV1,
  MainWireFiveWallLandTriSegStateV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_COLD_VOLUMES_ML_V1,
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultLaSlsModeV1,
  type MainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultWallMaterialReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import type {
  WholeHeartMechanicsSerializableValueV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CLOSED_LOOP_V1_ID =
  "main-wire-normal-adult-five-wall-closed-loop-v1" as const;

export type MainWireNormalAdultFiveWallExperimentModeV1 =
  "canonical";

export type MainWireNormalAdultFiveWallClosedLoopOptionsV1 = Readonly<{
  mode: MainWireNormalAdultFiveWallExperimentModeV1;
  laSlsMode?: MainWireNormalAdultLaSlsModeV1;
  dtSec: number;
  beatCount: number;
}>;

export type MainWireNormalAdultFiveWallClosedLoopSampleV1 = Readonly<{
  timeSec: number;
  cyclePhase01: number;
  nodeVolumeMl: Readonly<{ LA: number; LV: number; RA: number; RV: number }>;
  nodeAbsolutePressureMmHg: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
    Ao: number;
    PA: number;
    PVein: number;
  }>;
  chamberTransmuralPressureMmHg: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>;
  flowMlPerSec: Readonly<{
    MV: number;
    AoV: number;
    TV: number;
    PV: number;
    PVein_LA: number;
  }>;
  valveOpeningFraction01: Readonly<{
    MV: number;
    AoV: number;
    TV: number;
    PV: number;
  }>;
  freeCalciumUM: Readonly<{
    LA: number;
    LVFW: number;
    SEP: number;
    RVFW: number;
    RA: number;
  }>;
  internalCoordinates: Readonly<{
    septalMidwallCapVolumeMl: number;
    junctionRadiusM: number;
  }>;
  generalizedForce: Readonly<{
    septalScaledByOneJ: number;
    junctionScaledByOneJ: number;
  }>;
  wallStressPa: Readonly<Record<
    "LA" | "LVFW" | "SEP" | "RVFW" | "RA",
    Readonly<{
      total: number;
      active: number;
      passive: number;
      sls: number;
    }>
  >>;
  diagnostics: Readonly<{
    mechanicsResidualNorm: number;
    mechanicsIterations: number;
    circulationScaledResidualInfinityNorm: number;
    maximumContinuityResidualMl: number;
    totalBloodVolumeErrorMl: number;
    mechanicsCallbackCount: number;
    mechanicsCallbackCacheHits: number;
    symmetricJacobianMinimumEigenvalueByOneJ: number;
  }>;
}>;

export type MainWireNormalAdultFiveWallBeatClosureV1 = Readonly<{
  beatIndex: number;
  timeSec: number;
  period1MaximumRelativeStateDifference: number | null;
  period2MaximumRelativeStateDifference: number | null;
}>;

export type MainWireNormalAdultFiveWallClosedLoopResultV1 = Readonly<{
  experimentId: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CLOSED_LOOP_V1_ID;
  mode: MainWireNormalAdultFiveWallExperimentModeV1;
  laSlsMode: MainWireNormalAdultLaSlsModeV1;
  completed: boolean;
  requestedBeatCount: number;
  completedBeatCount: number;
  dtSec: number;
  stepsPerBeat: number;
  samples: readonly MainWireNormalAdultFiveWallClosedLoopSampleV1[];
  beatClosure: readonly MainWireNormalAdultFiveWallBeatClosureV1[];
  failure: null | Readonly<{
    stepIndex: number;
    timeSec: number;
    message: string;
  }>;
  claim: Readonly<{
    heartRateBpm: 60;
    circulation: "main-wire-derived-noncoronary-experimental";
    laaBodyCompartments: false;
    pericardialConstraint: false;
    parameterSearch: false;
    smoothingAppliedToSamples: false;
    laSlsExactOffIsPairedAblationOnly: boolean;
  }>;
}>;

type MechanicsState = MainWireFiveWallLandTriSegStateV1<
  LandSlsWallMaterialStateV1
>;
type AcceptedState = MainWireFiveWallNonCoronaryAcceptedStateV1<MechanicsState>;

const CYCLE_LENGTH_SEC = 1;

export function normalAdultMainWireRuntimeV1():
NonCoronaryCirculationRuntimeParamsV1 {
  const base = defaultParams();
  return Object.freeze({
    vascular: Object.freeze({
      venousTone: base.venousTone,
      arterialStiffness: base.arterialStiffness,
    }),
    losses: Object.freeze({
      systemicResistance: base.systemicResistance,
      pulmonaryResistance: base.pulmonaryResistance,
    }),
    respiratory: Object.freeze({
      PEEP: base.PEEP,
      Pth0: base.Pth0,
      respAmpTh: 0,
      respAmpAlv: 0,
      respRate: 0,
    }),
  });
}

export function runMainWireNormalAdultFiveWallClosedLoopV1(
  options: MainWireNormalAdultFiveWallClosedLoopOptionsV1,
): MainWireNormalAdultFiveWallClosedLoopResultV1 {
  validateOptions(options);
  const stepsPerBeat = Math.round(CYCLE_LENGTH_SEC / options.dtSec);
  const laSlsMode = options.laSlsMode ?? "on";
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1(laSlsMode);
  const cold = initializeMainWireFiveWallNonCoronaryV1({
    provider,
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    circulationInitial: Object.freeze({
      chamberVolumesMl: MAIN_WIRE_NORMAL_ADULT_COLD_VOLUMES_ML_V1,
    }),
  });
  let state = cold.acceptedState;
  const boundaryStates: AcceptedState[] = [state];
  const samples: MainWireNormalAdultFiveWallClosedLoopSampleV1[] = [];
  const beatClosure: MainWireNormalAdultFiveWallBeatClosureV1[] = [];
  let failure: MainWireNormalAdultFiveWallClosedLoopResultV1["failure"] = null;

  const requestedSteps = options.beatCount * stepsPerBeat;
  for (let stepIndex = 1; stepIndex <= requestedSteps; stepIndex += 1) {
    const stepped = stepMainWireFiveWallNonCoronaryV1(provider, state, {
      dtSec: options.dtSec,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    });
    if (stepped.converged === false) {
      failure = Object.freeze({
        stepIndex,
        timeSec: state.acceptedTimeSec + options.dtSec,
        message: stepped.message,
      });
      break;
    }
    state = stepped.acceptedState;
    samples.push(sampleFromStep(stepped));
    if (stepIndex % stepsPerBeat === 0) {
      boundaryStates.push(state);
      const beatIndex = boundaryStates.length - 1;
      beatClosure.push(Object.freeze({
        beatIndex,
        timeSec: state.acceptedTimeSec,
        period1MaximumRelativeStateDifference:
          maximumRelativeAcceptedStateDifference(
            provider,
            boundaryStates[beatIndex]!,
            boundaryStates[beatIndex - 1]!,
          ),
        period2MaximumRelativeStateDifference: beatIndex >= 2
          ? maximumRelativeAcceptedStateDifference(
            provider,
            boundaryStates[beatIndex]!,
            boundaryStates[beatIndex - 2]!,
          )
          : null,
      }));
    }
  }
  return Object.freeze({
    experimentId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CLOSED_LOOP_V1_ID,
    mode: options.mode,
    laSlsMode,
    completed: failure === null && beatClosure.length === options.beatCount,
    requestedBeatCount: options.beatCount,
    completedBeatCount: beatClosure.length,
    dtSec: options.dtSec,
    stepsPerBeat,
    samples: Object.freeze(samples),
    beatClosure: Object.freeze(beatClosure),
    failure,
    claim: Object.freeze({
      heartRateBpm: 60 as const,
      circulation: "main-wire-derived-noncoronary-experimental" as const,
      laaBodyCompartments: false as const,
      pericardialConstraint: false as const,
      parameterSearch: false as const,
      smoothingAppliedToSamples: false as const,
      laSlsExactOffIsPairedAblationOnly: laSlsMode === "exact-off",
    }),
  });
}

function sampleFromStep(
  step: Extract<
    ReturnType<typeof stepMainWireFiveWallNonCoronaryV1<MechanicsState>>,
    { converged: true }
  >,
): MainWireNormalAdultFiveWallClosedLoopSampleV1 {
  const circulation = step.circulationTrial;
  const mechanics = providerReadback(step.mechanicsTrial.diagnostics.readback);
  const force = mechanics.scaledAlgorithmicGeneralizedForceByOneJ;
  const wallStressPa = fiveWallRecord((wallId) => {
    const wall = wallReadback(mechanics.wallMaterialReadbackByWall[wallId]);
    const passive = wall.totalKirchhoffStressPa
      - wall.landActiveKirchhoffStressPa - wall.slsOverstressPa;
    return Object.freeze({
      total: wall.totalKirchhoffStressPa,
      active: wall.landActiveKirchhoffStressPa,
      passive,
      sls: wall.slsOverstressPa,
    });
  });
  return Object.freeze({
    timeSec: circulation.candidateTimeSec,
    cyclePhase01: positiveModulo(circulation.candidateTimeSec, CYCLE_LENGTH_SEC),
    nodeVolumeMl: Object.freeze({
      LA: circulation.candidateNodeVolumesMl.LA,
      LV: circulation.candidateNodeVolumesMl.LV,
      RA: circulation.candidateNodeVolumesMl.RA,
      RV: circulation.candidateNodeVolumesMl.RV,
    }),
    nodeAbsolutePressureMmHg: Object.freeze({
      LA: circulation.nodeAbsolutePressuresMmHg.LA,
      LV: circulation.nodeAbsolutePressuresMmHg.LV,
      RA: circulation.nodeAbsolutePressuresMmHg.RA,
      RV: circulation.nodeAbsolutePressuresMmHg.RV,
      Ao: circulation.nodeAbsolutePressuresMmHg.Ao,
      PA: circulation.nodeAbsolutePressuresMmHg.PA,
      PVein: circulation.nodeAbsolutePressuresMmHg.PVein,
    }),
    chamberTransmuralPressureMmHg: Object.freeze({
      ...step.mechanicsTrial.transmuralPressuresMmHg,
    }),
    flowMlPerSec: Object.freeze({
      MV: circulation.edgeFlowsMlPerSec.MV,
      AoV: circulation.edgeFlowsMlPerSec.AoV,
      TV: circulation.edgeFlowsMlPerSec.TV,
      PV: circulation.edgeFlowsMlPerSec.PV,
      PVein_LA: circulation.edgeFlowsMlPerSec.PVein_LA,
    }),
    valveOpeningFraction01: Object.freeze({
      MV: circulation.candidateValveStates.MV.leafletOpeningFraction01,
      AoV: circulation.candidateValveStates.AoV.leafletOpeningFraction01,
      TV: circulation.candidateValveStates.TV.leafletOpeningFraction01,
      PV: circulation.candidateValveStates.PV.leafletOpeningFraction01,
    }),
    freeCalciumUM: Object.freeze({
      ...step.calciumDrive.freeCalciumUMByWall,
    }),
    internalCoordinates: Object.freeze({
      septalMidwallCapVolumeMl:
        mechanics.internalCoordinates.septalMidwallCapVolumeM3 * 1e6,
      junctionRadiusM: mechanics.internalCoordinates.junctionRadiusM,
    }),
    generalizedForce: Object.freeze({
      septalScaledByOneJ: force[0]!,
      junctionScaledByOneJ: force[1]!,
    }),
    wallStressPa,
    diagnostics: Object.freeze({
      mechanicsResidualNorm: step.mechanicsTrial.diagnostics.residualNorm,
      mechanicsIterations: step.mechanicsTrial.diagnostics.iterationCount,
      circulationScaledResidualInfinityNorm:
        circulation.diagnostics.finalScaledResidualInfinityNorm,
      maximumContinuityResidualMl:
        circulation.diagnostics.finalMaximumContinuityResidualMl,
      totalBloodVolumeErrorMl: circulation.diagnostics.totalBloodVolumeErrorMl,
      mechanicsCallbackCount: circulation.diagnostics.mechanicsCallbackCallCount,
      mechanicsCallbackCacheHits:
        circulation.diagnostics.mechanicsCallbackCacheHitCount,
      symmetricJacobianMinimumEigenvalueByOneJ:
        mechanics.symmetricJacobianMinimumEigenvalueByOneJ,
    }),
  });
}

function maximumRelativeAcceptedStateDifference(
  provider: MainWireNormalAdultFiveWallProviderV1,
  a: AcceptedState,
  b: AcceptedState,
): number {
  const aValues = numericLeaves({
    circulation: physicalCirculationState(a),
    mechanics: provider.stateCodec.encode(a.mechanics.materialState),
  });
  const bValues = numericLeaves({
    circulation: physicalCirculationState(b),
    mechanics: provider.stateCodec.encode(b.mechanics.materialState),
  });
  if (aValues.length !== bValues.length) {
    throw new Error("accepted state numeric schemas differ across beat boundaries");
  }
  let maximum = 0;
  for (let index = 0; index < aValues.length; index += 1) {
    const av = aValues[index]!;
    const bv = bValues[index]!;
    maximum = Math.max(maximum, Math.abs(av - bv) / Math.max(1, Math.abs(av), Math.abs(bv)));
  }
  return maximum;
}

function physicalCirculationState(state: AcceptedState): Readonly<{
  nodeVolumesMl: AcceptedState["circulation"]["nodeVolumesMl"];
  dynamicEdgeFlowsMlPerSec:
    AcceptedState["circulation"]["dynamicEdgeFlowsMlPerSec"];
  valveOpeningFraction01: Readonly<Record<"MV" | "AoV" | "TV" | "PV", number>>;
}> {
  return Object.freeze({
    nodeVolumesMl: state.circulation.nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: state.circulation.dynamicEdgeFlowsMlPerSec,
    // Quasi-steady valve q is an algebraic readback, not a memory state. Only
    // leaflet opening belongs in the beat-boundary closure vector.
    valveOpeningFraction01: Object.freeze({
      MV: state.circulation.valveStates.MV.leafletOpeningFraction01,
      AoV: state.circulation.valveStates.AoV.leafletOpeningFraction01,
      TV: state.circulation.valveStates.TV.leafletOpeningFraction01,
      PV: state.circulation.valveStates.PV.leafletOpeningFraction01,
    }),
  });
}

function numericLeaves(value: unknown): readonly number[] {
  const output: number[] = [];
  const visit = (current: unknown): void => {
    if (typeof current === "number") {
      if (!Number.isFinite(current)) throw new Error("accepted state contains non-finite data");
      output.push(current);
      return;
    }
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (current !== null && typeof current === "object") {
      Object.keys(current as Record<string, unknown>).sort().forEach((key) =>
        visit((current as Record<string, unknown>)[key]));
    }
  };
  visit(value);
  return Object.freeze(output);
}

function providerReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireFiveWallLandTriSegReadbackV1 {
  return value as unknown as MainWireFiveWallLandTriSegReadbackV1;
}

function wallReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireNormalAdultWallMaterialReadbackV1 {
  return value as unknown as MainWireNormalAdultWallMaterialReadbackV1;
}

function fiveWallRecord<T>(
  build: (wallId: "LA" | "LVFW" | "SEP" | "RVFW" | "RA") => T,
): Readonly<Record<"LA" | "LVFW" | "SEP" | "RVFW" | "RA", T>> {
  return Object.freeze(Object.fromEntries(
    (["LA", "LVFW", "SEP", "RVFW", "RA"] as const)
      .map((wallId) => [wallId, build(wallId)]),
  )) as Readonly<Record<"LA" | "LVFW" | "SEP" | "RVFW" | "RA", T>>;
}

function validateOptions(
  options: MainWireNormalAdultFiveWallClosedLoopOptionsV1,
): void {
  if (options.mode !== "canonical") {
    throw new Error("unsupported five-wall experiment mode");
  }
  if (options.laSlsMode !== undefined &&
      options.laSlsMode !== "on" && options.laSlsMode !== "exact-off") {
    throw new Error("unsupported LA SLS mode");
  }
  if (!(options.dtSec > 0) || !Number.isFinite(options.dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  const steps = CYCLE_LENGTH_SEC / options.dtSec;
  if (!Number.isInteger(Math.round(steps)) ||
      Math.abs(steps - Math.round(steps)) > 1e-12) {
    throw new Error("dtSec must divide the fixed HR60 one-second cycle exactly");
  }
  if (!Number.isInteger(options.beatCount) || options.beatCount <= 0) {
    throw new Error("beatCount must be a positive integer");
  }
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}
