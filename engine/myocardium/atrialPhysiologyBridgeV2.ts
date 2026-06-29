import { clamp, frac } from "@/engine/math";
import type { Chamber, ChamberCtx, ChamberInternal, ChamberInternalDerivatives } from "@/engine/chambers";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";

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
    sourceProviderId: `${params.candidateId}:${chamber}:phase5ay-diagnostic`,
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
  const boosterGate = atrialBoosterGate(chamberCtx);
  const avPlaneDelta = terms.pressureUnclampedMmHg - noAvPlaneTerms.pressureUnclampedMmHg;
  const rawAdded =
    viscousConduitPressure(selfDvDt, inletOpen, params)
    + params.activeBoosterGain * Math.max(activePressure, 0) * boosterGate
    + params.avPlaneDeltaGain * avPlaneDelta;
  const totalAdded = clamp(rawAdded, -params.maxAbsAddedPressureMmHg, params.maxAbsAddedPressureMmHg);
  const pressure = clamp(basePressure + totalAdded, -20, 80);
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
    boosterGate01: boosterGate,
    viscousConduitPressureMmHg: viscousConduitPressure(selfDvDt, inletOpen, params),
    tensionBoosterPressureMmHg: params.activeBoosterGain * Math.max(activePressure, 0) * boosterGate,
    avPlaneExtraPressureMmHg: params.avPlaneDeltaGain * avPlaneDelta,
    totalAddedPressureMmHg: totalAdded,
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

function viscousConduitPressure(
  selfVolumeRateMlPerSec: number,
  inletValveOpen01: number,
  params: AtrialPhysiologyBridgeV2Params,
): number {
  const conduitGate = 0.35 + 0.65 * inletValveOpen01;
  return clamp(
    -params.viscousConduitGainMmHgPerMlPerSec * selfVolumeRateMlPerSec * conduitGate,
    -params.maxAbsAddedPressureMmHg,
    params.maxAbsAddedPressureMmHg,
  );
}

function atrialBoosterGate(ctx: ChamberCtx): number {
  const theta = frac(ctx.phi);
  return Math.max(
    raisedCosineWindow(theta, 0.88, 0.12),
    raisedCosineWindow(theta, 0.04, 0.10),
  );
}

function raisedCosineWindow(theta: number, center: number, halfWidth: number): number {
  const distance = Math.min(Math.abs(theta - center), 1 - Math.abs(theta - center));
  if (distance >= halfWidth) return 0;
  return 0.5 * (1 + Math.cos(Math.PI * distance / halfWidth));
}

function finiteOrZero(value: number | undefined): number {
  return value != null && Number.isFinite(value) ? value : 0;
}
