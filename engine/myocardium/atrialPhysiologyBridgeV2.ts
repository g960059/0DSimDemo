import { clamp } from "@/engine/math";
import type { Chamber, ChamberCtx, ChamberInternal, ChamberInternalDerivatives } from "@/engine/chambers";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";
import { computeAtrialReservoirConduitCoupling } from "@/engine/myocardium/atrialReservoirConduitCoupling";

export type AtrialPhysiologyBridgeV2CandidateId =
  | "atrial-a2-light-v1"
  | "atrial-a2-conduit-v1"
  | "atrial-a2-booster-v1";

export type AtrialPhysiologyBridgeV2Params = {
  readonly candidateId: AtrialPhysiologyBridgeV2CandidateId;
  readonly chamber: "LA" | "RA";
  readonly viscousConduitGainMmHgPerMlPerSec: number;
  readonly activeBoosterGain: number;
  readonly avPlaneDeltaGain: number;
  readonly maxAbsAddedPressureMmHg: number;
};

export type AtrialPhysiologyBridgeV2ContributionSample = {
  readonly chamber: "LA" | "RA";
  readonly candidateId: AtrialPhysiologyBridgeV2CandidateId;
  readonly phi: number;
  readonly selfVolumeRateMlPerSec: number;
  readonly inletValveOpen01: number;
  readonly basePressureMmHg: number;
  readonly passivePressureMmHg: number;
  readonly activePressureMmHg: number;
  readonly avPlanePressureDeltaMmHg: number;
  readonly boosterGate01: number;
  readonly viscousConduitPressureMmHg: number;
  readonly tensionBoosterPressureMmHg: number;
  readonly avPlaneExtraPressureMmHg: number;
  readonly totalAddedPressureMmHg: number;
  readonly pressureMmHg: number;
};

export type AtrialPhysiologyBridgeV2Instrumentation = {
  record?(sample: AtrialPhysiologyBridgeV2ContributionSample): void;
};

export function atrialPhysiologyBridgeV2CandidateParams(
  candidateId: AtrialPhysiologyBridgeV2CandidateId,
  chamber: "LA" | "RA",
): AtrialPhysiologyBridgeV2Params {
  const rightScale = chamber === "RA" ? 0.72 : 1;
  if (candidateId === "atrial-a2-conduit-v1") {
    return {
      candidateId,
      chamber,
      viscousConduitGainMmHgPerMlPerSec: 0.006 * rightScale,
      activeBoosterGain: 0.05 * rightScale,
      avPlaneDeltaGain: 0.35 * rightScale,
      maxAbsAddedPressureMmHg: 8,
    };
  }
  if (candidateId === "atrial-a2-booster-v1") {
    return {
      candidateId,
      chamber,
      viscousConduitGainMmHgPerMlPerSec: 0.0035 * rightScale,
      activeBoosterGain: 0.25 * rightScale,
      avPlaneDeltaGain: 0.2 * rightScale,
      maxAbsAddedPressureMmHg: 8,
    };
  }
  return {
    candidateId,
    chamber,
    viscousConduitGainMmHgPerMlPerSec: 0.0035 * rightScale,
    activeBoosterGain: 0.1 * rightScale,
    avPlaneDeltaGain: 0.25 * rightScale,
    maxAbsAddedPressureMmHg: 8,
  };
}

export function createAtrialPhysiologyBridgeV2SourceProvider(
  chamber: "LA" | "RA",
  params: AtrialPhysiologyBridgeV2Params,
  instrumentation: AtrialPhysiologyBridgeV2Instrumentation = {},
): ModelCoreExperimentalActiveSourceProvider {
  if (params.chamber !== chamber) {
    throw new Error(`AtrialPhysiologyBridgeV2 params chamber ${params.chamber} does not match provider chamber ${chamber}.`);
  }
  return {
    sourceProviderId: `${params.candidateId}:${chamber}:diagnostic-v1`,
    initialInternal: ({ activeModel }): ChamberInternal => activeModel.initialInternal(),
    pressure: (input): number => atrialPressure(input, params, instrumentation),
    passivePressure: ({ activeModel, volumeMl, chamberCtx }): number =>
      activeModel.passivePressure(volumeMl, chamberCtx),
    internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx }): ChamberInternalDerivatives =>
      activeModel.internalDerivatives(volumeMl, internal, chamberCtx),
  };
}

function atrialPressure(
  input: ModelCoreActiveSourceProviderCall,
  params: AtrialPhysiologyBridgeV2Params,
  instrumentation: AtrialPhysiologyBridgeV2Instrumentation,
): number {
  const { activeModel, volumeMl, internal, chamberCtx } = input;
  const basePressure = activeModel.pressure(volumeMl, internal, chamberCtx);
  const terms = activeModel.debugPressureTerms(volumeMl, internal, chamberCtx);
  const noAvPlaneTerms = activeModel.debugPressureTerms(volumeMl, internal, noAvPlaneCtx(chamberCtx));
  const sigmaTotal = terms.sigmaPas + terms.sigmaAct;
  const passivePressure = Math.abs(sigmaTotal) > 1e-12
    ? terms.pressureUnclampedMmHg * terms.sigmaPas / sigmaTotal
    : 0;
  const activePressure = Math.abs(sigmaTotal) > 1e-12
    ? terms.pressureUnclampedMmHg * terms.sigmaAct / sigmaTotal
    : 0;
  const selfDvDt = finiteOrZero(chamberCtx.selfChamberVolumeRateMlPerSec);
  const inletOpen = clamp(finiteOrZero(chamberCtx.inletValveOpen01), 0, 1);
  const avPlaneDelta = terms.pressureUnclampedMmHg - noAvPlaneTerms.pressureUnclampedMmHg;
  const coupling = computeAtrialReservoirConduitCoupling({
    phi: chamberCtx.phi,
    selfVolumeRateMlPerSec: selfDvDt,
    inletValveOpen01: inletOpen,
    activePressureMmHg: activePressure,
    avPlanePressureDeltaMmHg: avPlaneDelta,
    viscousConduitGainMmHgPerMlPerSec: params.viscousConduitGainMmHgPerMlPerSec,
    activeBoosterGain: params.activeBoosterGain,
    avPlaneDeltaGain: params.avPlaneDeltaGain,
    maxAbsAddedPressureMmHg: params.maxAbsAddedPressureMmHg,
  });
  const pressure = clamp(basePressure + coupling.totalAddedPressureMmHg, -20, 80);
  instrumentation.record?.({
    chamber: params.chamber,
    candidateId: params.candidateId,
    phi: chamberCtx.phi,
    selfVolumeRateMlPerSec: selfDvDt,
    inletValveOpen01: inletOpen,
    basePressureMmHg: basePressure,
    passivePressureMmHg: passivePressure,
    activePressureMmHg: activePressure,
    avPlanePressureDeltaMmHg: avPlaneDelta,
    boosterGate01: coupling.boosterGate01,
    viscousConduitPressureMmHg: coupling.viscousConduitPressureMmHg,
    tensionBoosterPressureMmHg: coupling.tensionBoosterPressureMmHg,
    avPlaneExtraPressureMmHg: coupling.avPlaneExtraPressureMmHg,
    totalAddedPressureMmHg: coupling.totalAddedPressureMmHg,
    pressureMmHg: pressure,
  });
  return pressure;
}

function noAvPlaneCtx(ctx: ChamberCtx): ChamberCtx {
  return {
    ...ctx,
    pairedVentricleShortening01: 0,
    pairedVentricleShorteningVelocity01PerSec: 0,
  };
}

function finiteOrZero(value: number | undefined): number {
  return value != null && Number.isFinite(value) ? value : 0;
}
