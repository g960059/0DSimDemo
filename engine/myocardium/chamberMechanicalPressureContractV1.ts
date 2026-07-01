import {
  MMHG_TO_PA,
  ML_TO_M3,
  type ActiveStressDebugTerms,
  type ChamberPressureTerms,
} from "@/engine/chambers";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";

export type ChamberMechanicalPressureContractV1Mode =
  | "work-conjugate-log-strain-v1"
  | "work-conjugate-linear-strain-v1"
  | "work-conjugate-log-laplace-blend-v1";

export type ChamberMechanicalPressureContractV1Options = {
  readonly sourceProviderId: string;
  readonly mode: ChamberMechanicalPressureContractV1Mode;
  readonly finiteDifferenceVolumeMl?: number;
  readonly laplaceBlend01?: number;
};

export function chamberMechanicalPressureContractV1Provider(
  base: ModelCoreExperimentalActiveSourceProvider,
  options: ChamberMechanicalPressureContractV1Options,
): ModelCoreExperimentalActiveSourceProvider {
  if (!base.sourceActiveStressPa) {
    throw new Error("ChamberMechanicalPressureContractV1 requires a sourceActiveStressPa base provider.");
  }
  if (!base.debugActiveStressTerms) {
    throw new Error("ChamberMechanicalPressureContractV1 requires base debugActiveStressTerms.");
  }
  return {
    sourceProviderId: options.sourceProviderId,
    initialInternal: base.initialInternal,
    initialProviderState: base.initialProviderState,
    cloneProviderState: base.cloneProviderState,
    debugProviderState: base.debugProviderState,
    commitProviderStateAfterStep: base.commitProviderStateAfterStep,
    internalDerivatives: base.internalDerivatives,
    passivePressure: (call) => call.activeModel.passivePressure(call.volumeMl, call.chamberCtx),
    pressure: (call) => pressureTerms(call, base, options).pressureMmHg,
    debugPressureTerms: (call) => pressureTerms(call, base, options),
    debugActiveStressTerms: (call) => {
      const baseTerms = base.debugActiveStressTerms!(call);
      const adapted = pressureTerms(call, base, options);
      return {
        ...baseTerms,
        ...adapted,
        sigmaActTarget: adapted.sigmaActTarget,
        sigmaAct: adapted.sigmaAct,
      } satisfies ActiveStressDebugTerms;
    },
  };
}

function pressureTerms(
  call: ModelCoreActiveSourceProviderCall,
  base: ModelCoreExperimentalActiveSourceProvider,
  options: ChamberMechanicalPressureContractV1Options,
): ChamberPressureTerms {
  const sourceStressPa = finiteNonnegative(base.sourceActiveStressPa!(call));
  const currentPassive = call.activeModel.debugPressureTermsFromActiveFiberStress(
    call.volumeMl,
    call.internal,
    call.chamberCtx,
    0,
  );
  const laplaceGainMmHgPerPa = activePressureGainMmHgPerPa(call);
  const workGainMmHgPerPa = workConjugateGainMmHgPerPa(call, options);
  const blend = options.mode === "work-conjugate-log-laplace-blend-v1"
    ? clamp(options.laplaceBlend01 ?? 0.35, 0, 1)
    : 0;
  const selectedWorkGain = options.mode === "work-conjugate-linear-strain-v1"
    ? workGainMmHgPerPa
    : workGainMmHgPerPa;
  const gainMmHgPerPa = (1 - blend) * selectedWorkGain + blend * laplaceGainMmHgPerPa;
  const pressureUnclampedMmHg = currentPassive.pressureUnclampedMmHg + gainMmHgPerPa * sourceStressPa;
  const pressureFloor = call.activeModel.ap.pressureFloorMmHg ?? -5;
  return {
    ...currentPassive,
    sigmaActTarget: sourceStressPa,
    sigmaAct: sourceStressPa,
    pressureUnclampedMmHg,
    pressureMmHg: clamp(pressureUnclampedMmHg, pressureFloor, 260),
    pressureFloorHit01: pressureUnclampedMmHg <= pressureFloor ? 1 : 0,
  };
}

function activePressureGainMmHgPerPa(call: ModelCoreActiveSourceProviderCall): number {
  const unitStressPa = 1000;
  const passive = call.activeModel.debugPressureTermsFromActiveFiberStress(
    call.volumeMl,
    call.internal,
    call.chamberCtx,
    0,
  );
  const unit = call.activeModel.debugPressureTermsFromActiveFiberStress(
    call.volumeMl,
    call.internal,
    call.chamberCtx,
    unitStressPa,
  );
  return finiteNonnegative((unit.pressureUnclampedMmHg - passive.pressureUnclampedMmHg) / unitStressPa);
}

function workConjugateGainMmHgPerPa(
  call: ModelCoreActiveSourceProviderCall,
  options: ChamberMechanicalPressureContractV1Options,
): number {
  const epsMl = Math.max(options.finiteDifferenceVolumeMl ?? 0.35, 0.05);
  const loVolumeMl = Math.max(call.activeModel.ap.V0 + call.activeModel.ap.Vmin, call.volumeMl - epsMl);
  const hiVolumeMl = Math.max(loVolumeMl + 1e-4, call.volumeMl + epsMl);
  const lo = call.activeModel.debugPressureTermsFromActiveFiberStress(
    loVolumeMl,
    call.internal,
    call.chamberCtx,
    0,
  );
  const hi = call.activeModel.debugPressureTermsFromActiveFiberStress(
    hiVolumeMl,
    call.internal,
    call.chamberCtx,
    0,
  );
  const dVolumeM3 = (hiVolumeMl - loVolumeMl) * ML_TO_M3;
  const strainDerivativePerM3 = options.mode === "work-conjugate-linear-strain-v1"
    ? (hi.lambda - lo.lambda) / Math.max(dVolumeM3, 1e-12)
    : (Math.log(Math.max(hi.lambda, 1e-9)) - Math.log(Math.max(lo.lambda, 1e-9))) / Math.max(dVolumeM3, 1e-12);
  const gain =
    call.chamberCtx.geomScale
    * call.activeModel.ap.geomChi
    * call.activeModel.ap.Vw
    * ML_TO_M3
    * strainDerivativePerM3
    / MMHG_TO_PA;
  return finiteNonnegative(gain);
}

function finiteNonnegative(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("ChamberMechanicalPressureContractV1 value must be finite.");
  }
  return Math.max(0, value);
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}
