import type { ActiveStressDebugTerms, ChamberPressureTerms } from "@/engine/chambers";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";

export type ActiveSourcePressureContractV2Mode =
  | "reference-geometry-active-pressure-v1";

export type ActiveSourcePressureContractV2Options = {
  readonly sourceProviderId: string;
  readonly mode: ActiveSourcePressureContractV2Mode;
  readonly referenceVolumeMode?: "active-model-vref";
};

export function activeSourcePressureContractV2Provider(
  base: ModelCoreExperimentalActiveSourceProvider,
  options: ActiveSourcePressureContractV2Options,
): ModelCoreExperimentalActiveSourceProvider {
  if (!base.sourceActiveStressPa) {
    throw new Error("ActiveSourcePressureContractV2 requires a sourceActiveStressPa base provider.");
  }
  if (!base.debugActiveStressTerms) {
    throw new Error("ActiveSourcePressureContractV2 requires base debugActiveStressTerms.");
  }
  return {
    sourceProviderId: options.sourceProviderId,
    initialInternal: base.initialInternal,
    initialProviderState: base.initialProviderState,
    cloneProviderState: base.cloneProviderState,
    debugProviderState: base.debugProviderState,
    commitProviderStateAfterStep: base.commitProviderStateAfterStep,
    internalDerivatives: base.internalDerivatives,
    passivePressure: (call) => passivePressure(call),
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
  options: ActiveSourcePressureContractV2Options,
): ChamberPressureTerms {
  if (options.mode !== "reference-geometry-active-pressure-v1") {
    throw new Error(`Unsupported ActiveSourcePressureContractV2 mode: ${options.mode}`);
  }
  const sourceStressPa = finiteNonnegative(base.sourceActiveStressPa!(call));
  const referenceVolumeMl = referenceVolume(call);
  const unitStressPa = 1000;
  const referencePassive = call.activeModel.debugPressureTermsFromActiveFiberStress(
    referenceVolumeMl,
    call.internal,
    call.chamberCtx,
    0,
  );
  const referenceUnit = call.activeModel.debugPressureTermsFromActiveFiberStress(
    referenceVolumeMl,
    call.internal,
    call.chamberCtx,
    unitStressPa,
  );
  const currentPassive = call.activeModel.debugPressureTermsFromActiveFiberStress(
    call.volumeMl,
    call.internal,
    call.chamberCtx,
    0,
  );
  const gainMmHgPerPa =
    (referenceUnit.pressureUnclampedMmHg - referencePassive.pressureUnclampedMmHg) / unitStressPa;
  const pressureUnclampedMmHg = currentPassive.pressureUnclampedMmHg + gainMmHgPerPa * sourceStressPa;
  const pressureFloor = call.activeModel.ap.pressureFloorMmHg ?? -5;
  const pressureMmHg = clamp(pressureUnclampedMmHg, pressureFloor, 260);
  return {
    ...currentPassive,
    sigmaActTarget: sourceStressPa,
    sigmaAct: sourceStressPa,
    pressureUnclampedMmHg,
    pressureMmHg,
    pressureFloorHit01: pressureUnclampedMmHg <= pressureFloor ? 1 : 0,
  };
}

function passivePressure(call: ModelCoreActiveSourceProviderCall): number {
  return call.activeModel.passivePressure(call.volumeMl, call.chamberCtx);
}

function referenceVolume(call: ModelCoreActiveSourceProviderCall): number {
  return Math.max(call.activeModel.ap.Vref, call.activeModel.ap.V0 + 1);
}

function finiteNonnegative(value: number): number {
  if (!Number.isFinite(value)) throw new Error("ActiveSourcePressureContractV2 source stress must be finite.");
  return Math.max(0, value);
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}
