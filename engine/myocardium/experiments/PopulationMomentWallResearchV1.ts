import { stableHash, sanitizeForStableHash } from "@/engine/integrity/stableHash";
import { evaluateEquilibriumOneFiberPassiveV1 } from "@/engine/myocardium/mechanics/equilibriumOneFiberPassiveV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 as prior } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import { initialParallelOneStateSlsStateV1, stepParallelOneStateSlsBackwardEulerV1,
  type ParallelOneStateSlsStateV1 } from "@/engine/myocardium/mechanics/parallelOneStateSlsV1";
import type { LandSlsWallMaterialParamsV1, LandSlsWallMaterialStateV1 } from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import type { MainWireFiveWallLandSlsMaterialKernelV1, MainWireFiveWallMaterialEvaluationV1,
  MainWireFiveWallVentricularWallIdV1 } from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type { WholeHeartMechanicsSerializableValueV1, WholeHeartMechanicsStateCodecV1 } from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import { stepPopulationMomentWithTangentV1, equilibratePopulationMomentWithTangentV1 } from "./LandPopulationMomentTangentResearchV1";
import { populationMomentRhsV1, validatePopulationMomentStateV1, type PopulationMomentStateV1,
  type PopulationMomentRecoveryV1 } from "./LandPopulationMomentResearchV1";
import { land2017CaT50, land2017CaTRPNUnblockingFactor, land2017GammaSu, land2017GammaWu } from "@/engine/myocardium/myofilament/land2017/equations";

export const POPULATION_MOMENT_WALL_RESEARCH_V1 = "population-moment-wall-research-v1";
export type PopulationMomentWallBodyV1 = Readonly<{
  moment: PopulationMomentStateV1; slsState: ParallelOneStateSlsStateV1;
  previousFiberLogStrain: number; previousFreeCalciumUM: number;
}>;
/** Distinct tagged states; no moment is stored in a Land zeta slot. */
export type PopulationMomentResearchWallStateV1 =
  | Readonly<{ law: "atrial-land"; body: LandSlsWallMaterialStateV1 }>
  | Readonly<{ law: "ventricular-moment"; body: PopulationMomentWallBodyV1 }>;

export function wrapAtrialLandKernelForMomentResearchV1(
  source: MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1>,
): MainWireFiveWallLandSlsMaterialKernelV1<PopulationMomentResearchWallStateV1> {
  const unwrap = (s: PopulationMomentResearchWallStateV1) => {
    if (s.law !== "atrial-land") throw new Error("atrial kernel rejected a non-Land wall state");
    return s.body;
  };
  const wrap = (body: LandSlsWallMaterialStateV1): PopulationMomentResearchWallStateV1 => Object.freeze({ law: "atrial-land", body });
  const convert = (r: MainWireFiveWallMaterialEvaluationV1<LandSlsWallMaterialStateV1>) => {
    const rb = r.readback as Readonly<Record<string, WholeHeartMechanicsSerializableValueV1>> | null;
    const claim = rb?.claim as Readonly<Record<string, WholeHeartMechanicsSerializableValueV1>> | undefined;
    return { ...r, state: wrap(r.state), readback: rb === null ? null : { ...rb,
      claim: { ...claim, fullLandKernelOnAllFiveWalls: false, reuseScope: "unchanged-atrial-Land-only" } } };
  };
  return Object.freeze({ ...source, stateCodec: {
    clone: s => wrap(source.stateCodec.clone(unwrap(s))),
    encode: s => source.stateCodec.encode(unwrap(s)),
    decode: s => wrap(source.stateCodec.decode(s)),
  }, initializeColdAtFixedInput: input => convert(source.initializeColdAtFixedInput(input)),
  evaluateTrialFromAccepted: input => convert(source.evaluateTrialFromAccepted({ ...input, previousAcceptedState: unwrap(input.previousAcceptedState) })),
  evaluateNumericalTrialFromAccepted: input => convert((source.evaluateNumericalTrialFromAccepted ?? source.evaluateTrialFromAccepted)
    ({ ...input, previousAcceptedState: unwrap(input.previousAcceptedState) })) });
}

export function createPopulationMomentWallKernelV1(input: Readonly<{
  wallId: MainWireFiveWallVentricularWallIdV1; material: LandSlsWallMaterialParamsV1;
  passiveScale: number; recovery: PopulationMomentRecoveryV1;
}>): MainWireFiveWallLandSlsMaterialKernelV1<PopulationMomentResearchWallStateV1> {
  // Own the constitutive parameters: caller mutation must not change a law
  // after its checkpoint identity has been established.
  const material = structuredClone(input.material);
  const { passiveScale, wallId, recovery } = input;
  if (!Number.isFinite(passiveScale) || passiveScale <= 0 || !Number.isFinite(material.landSlackStretch)
    || material.landSlackStretch <= 0 || ![material.orientationFraction01, material.viableActiveFraction01]
      .every(x => Number.isFinite(x) && x >= 0 && x <= 1)) throw new Error("invalid moment wall construction");
  // Validate the constitutive law at construction, including unsupported exits/recovery.
  const sanity = equilibratePopulationMomentWithTangentV1(.3, 1.1, material.landEquationParameters);
  stepPopulationMomentWithTangentV1(sanity.state, .3, 1.1, 1.1, .002, material.landEquationParameters, recovery);
  const identity = stableHash(sanitizeForStableHash({ model: POPULATION_MOMENT_WALL_RESEARCH_V1,
    wallId, material, passiveScale, recovery, passivePrior: prior.passive.ventricular.compiled,
    scheme: "first-order-frozen-detachment-implicit-flux-with-analytic-step-tangent" }));
  const scale = material.orientationFraction01 * material.viableActiveFraction01;
  const slsParams = Object.freeze({ ...material.sls, branchModulusPa: material.sls.branchModulusPa * passiveScale });
  const unwrap = (s: PopulationMomentResearchWallStateV1) => {
    if (s.law !== "ventricular-moment") throw new Error("moment kernel rejected a Land wall state");
    validateBody(s.body);
    return s.body;
  };
  const own = (b: PopulationMomentWallBodyV1): PopulationMomentResearchWallStateV1 => {
    validateBody(b);
    return Object.freeze({ law: "ventricular-moment", body: Object.freeze({ ...b,
      moment: Object.freeze({ ...b.moment }), slsState: Object.freeze({ ...b.slsState }) }) });
  };
  const stateCodec: WholeHeartMechanicsStateCodecV1<PopulationMomentResearchWallStateV1> = Object.freeze({
    clone: s => own(unwrap(s)),
    encode: s => {
      const b = unwrap(s);
      return { schemaId: POPULATION_MOMENT_WALL_RESEARCH_V1, parameterIdentityHash: identity, wallId,
        body: { moment: { ...b.moment }, slsState: { ...b.slsState }, previousFiberLogStrain: b.previousFiberLogStrain,
          previousFreeCalciumUM: b.previousFreeCalciumUM } };
    },
    decode: encoded => {
      const e = record(encoded, ["schemaId", "parameterIdentityHash", "wallId", "body"]);
      if (e.schemaId !== POPULATION_MOMENT_WALL_RESEARCH_V1 || e.parameterIdentityHash !== identity || e.wallId !== wallId) {
        throw new Error("moment wall checkpoint identity mismatch");
      }
      const b = record(e.body!, ["moment", "slsState", "previousFiberLogStrain", "previousFreeCalciumUM"]);
      const m = record(b.moment!, ["caTroponin", "blocked", "weak", "strong", "weakMoment", "strongMoment"]);
      const sls = record(b.slsState!, ["viscousLogStrain"]);
      return own({ moment: { caTroponin: number(m.caTroponin), blocked: number(m.blocked), weak: number(m.weak),
        strong: number(m.strong), weakMoment: number(m.weakMoment), strongMoment: number(m.strongMoment) },
        slsState: { viscousLogStrain: number(sls.viscousLogStrain) },
        previousFiberLogStrain: number(b.previousFiberLogStrain), previousFreeCalciumUM: number(b.previousFreeCalciumUM) });
    },
  });
  const passive = (e: number) => evaluateEquilibriumOneFiberPassiveV1(e, prior.passive.ventricular.compiled);
  const evaluate = (args: { previousAcceptedState: PopulationMomentResearchWallStateV1;
    candidateFiberLogStrain: number; candidateFreeCalciumUM: number; stepDtSec: number }, readback: boolean)
    : MainWireFiveWallMaterialEvaluationV1<PopulationMomentResearchWallStateV1> => {
    const b = unwrap(args.previousAcceptedState), e = args.candidateFiberLogStrain;
    const lambda = material.landSlackStretch * Math.exp(e), oldLambda = material.landSlackStretch * Math.exp(b.previousFiberLogStrain);
    const active = stepPopulationMomentWithTangentV1(b.moment, args.candidateFreeCalciumUM,
      oldLambda, lambda, args.stepDtSec, material.landEquationParameters, recovery);
    const sls = stepParallelOneStateSlsBackwardEulerV1(b.slsState,
      { previousFiberLogStrain: b.previousFiberLogStrain, nextFiberLogStrain: e, dtSec: args.stepDtSec }, slsParams);
    const equilibrium = passive(e), activeStress = scale * lambda * active.nominalStressPa;
    const activeTangent = scale * lambda * (active.nominalStressPa + lambda * active.dNominalStressDStretchPa);
    const residual = momentStepResidual(b.moment, active.state, args.candidateFreeCalciumUM, oldLambda, lambda,
      args.stepDtSec, material, recovery);
    if (!sls.passive || residual > 1e-10) throw new Error("moment/SLS step residual or passive-energy postcondition failed");
    const totalStress = passiveScale * equilibrium.equilibriumKirchhoffStressPa + sls.nextOverstressPa + activeStress;
    const totalTangent = passiveScale * equilibrium.dStressDFiberLogStrainPa + sls.dNextOverstressDNextFiberLogStrainPa + activeTangent;
    if (![activeStress, activeTangent, totalStress, totalTangent].every(Number.isFinite)) throw new Error("nonfinite moment wall stress/tangent");
    return { state: own({ moment: active.state, slsState: sls.state, previousFiberLogStrain: e,
      previousFreeCalciumUM: args.candidateFreeCalciumUM }), fiberLogStrain: e,
      fiberKirchhoffStressPa: totalStress, activeFiberKirchhoffStressPa: activeStress,
      algorithmicFiberTangentPa: totalTangent, activeFiberAlgorithmicTangentPa: activeTangent,
      iterationCount: 1, residualNorm: Math.max(residual, Math.abs(sls.stateResidual)), finite: true, valid: true,
      errors: [], warnings: [], readback: readback ? { modelId: POPULATION_MOMENT_WALL_RESEARCH_V1,
        recovery, parameterIdentityHash: identity, activeKirchhoffStressPa: activeStress,
        passiveKirchhoffStressPa: passiveScale * equilibrium.equilibriumKirchhoffStressPa,
        slsOverstressPa: sls.nextOverstressPa, totalKirchhoffStressPa: totalStress,
        activeThermodynamicEnergyClaimed: false, passiveStoredEnergyDensityJPerM3: passiveScale * equilibrium.storedEnergyDensityJPerM3,
        slsEnergyBalanceResidualJPerM3: sls.discreteEnergyBalanceResidualJPerM3 } : null };
  };
  return Object.freeze({ modelId: POPULATION_MOMENT_WALL_RESEARCH_V1, parameterSetId: `${POPULATION_MOMENT_WALL_RESEARCH_V1}-${wallId}-${identity}`,
    parameterIdentityHash: identity, topology: "population-moment-research-plus-equilibrium-passive-plus-parallel-one-state-SLS",
    stateCodec, acceptedStateInputMode: "trusted-read-only", evaluationStateOwnershipMode: "exclusive-result",
    initializeColdAtFixedInput: ({ fiberLogStrain: e, freeCalciumUM: ca }) => {
      const lambda = material.landSlackStretch * Math.exp(e), active = equilibratePopulationMomentWithTangentV1(ca, lambda, material.landEquationParameters);
      const equilibrium = passive(e), activeStress = scale * lambda * active.nominalStressPa;
      const activeTangent = scale * lambda * (active.nominalStressPa + lambda * active.dNominalStressDStretchPa);
      const residual = Math.max(...Object.values(populationMomentRhsV1(active.state,
        { calciumUM: ca, stretch: lambda, stretchRatePerSec: 0 }, material.landEquationParameters, recovery)).map(Math.abs));
      if (residual > 1e-10) throw new Error("moment cold equilibrium residual failed");
      return { state: own({ moment: active.state, slsState: initialParallelOneStateSlsStateV1(e),
        previousFiberLogStrain: e, previousFreeCalciumUM: ca }), fiberLogStrain: e,
        fiberKirchhoffStressPa: passiveScale * equilibrium.equilibriumKirchhoffStressPa + activeStress,
        activeFiberKirchhoffStressPa: activeStress, activeFiberAlgorithmicTangentPa: activeTangent,
        algorithmicFiberTangentPa: passiveScale * equilibrium.dStressDFiberLogStrainPa + activeTangent,
        iterationCount: 0, residualNorm: residual, finite: true, valid: true, errors: [], warnings: [],
        readback: { modelId: POPULATION_MOMENT_WALL_RESEARCH_V1, recovery, coldInitialization: "analytic-fixed-input-equilibrium",
          activeKirchhoffStressPa: activeStress, passiveKirchhoffStressPa: passiveScale * equilibrium.equilibriumKirchhoffStressPa,
          slsOverstressPa: 0, totalKirchhoffStressPa: passiveScale * equilibrium.equilibriumKirchhoffStressPa + activeStress,
          activeThermodynamicEnergyClaimed: false } };
    }, evaluateTrialFromAccepted: args => evaluate(args, true), evaluateNumericalTrialFromAccepted: args => evaluate(args, false) });
}

function momentStepResidual(a: PopulationMomentStateV1, b: PopulationMomentStateV1, ca: number,
  oldLambda: number, lambda: number, h: number, material: LandSlsWallMaterialParamsV1, recovery: PopulationMomentRecoveryV1) {
  const p = material.landEquationParameters.values, d = material.landEquationParameters.derived;
  const u = 1 - b.blocked - b.weak - b.strong, rate = (lambda - oldLambda) / h;
  const l = d.kwu + p.kws + land2017GammaWu(a.weak === 0 ? 0 : a.weakMoment / a.weak, p);
  const q = d.ksu + land2017GammaSu(a.strong === 0 ? 0 : a.strongMoment / a.strong, p);
  const extra = recovery === "flux-only" ? 0 : p.phi - 1;
  return Math.max(...[
    b.caTroponin - a.caTroponin - h * p.kTRPN * ((ca / land2017CaT50(lambda, p)) ** p.nTRPN * (1 - b.caTroponin) - b.caTroponin),
    b.blocked - a.blocked - h * (d.kb * land2017CaTRPNUnblockingFactor(b.caTroponin, p) * u - p.ku * b.caTroponin ** (p.nTm / 2) * b.blocked),
    b.weak - a.weak - h * (p.kuw * u - l * b.weak), b.strong - a.strong - h * (p.kws * b.weak - q * b.strong),
    b.weakMoment - a.weakMoment - h * (d.Aw * b.weak * rate - l * b.weakMoment - extra * p.kuw * u * (b.weak === 0 ? 0 : b.weakMoment / b.weak)),
    b.strongMoment - a.strongMoment - h * (d.As * b.strong * rate - q * b.strongMoment - extra * p.kws * b.weak * (b.strong === 0 ? 0 : b.strongMoment / b.strong)),
  ].map(Math.abs));
}
function validateBody(b: PopulationMomentWallBodyV1) {
  validatePopulationMomentStateV1(b.moment);
  if (![b.previousFiberLogStrain, b.previousFreeCalciumUM, b.slsState.viscousLogStrain].every(Number.isFinite)
    || b.previousFreeCalciumUM < 0) throw new Error("invalid population-moment wall history");
}
function record(x: WholeHeartMechanicsSerializableValueV1, keys: string[]) {
  if (x === null || typeof x !== "object" || Array.isArray(x)
    || Object.keys(x).sort().join(",") !== [...keys].sort().join(",")) throw new Error("invalid moment checkpoint record");
  return x as Record<string, WholeHeartMechanicsSerializableValueV1>;
}
function number(x: WholeHeartMechanicsSerializableValueV1 | undefined) {
  if (typeof x !== "number" || !Number.isFinite(x)) throw new Error("invalid moment checkpoint number");
  return x;
}
