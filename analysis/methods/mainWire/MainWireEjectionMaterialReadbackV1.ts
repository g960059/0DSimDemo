import type { MainWireIntegratedModelStepSuccessV3 } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type { MainWireFiveWallLandTriSegReadbackV1 } from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type { MainWireNormalAdultWallMaterialReadbackV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1 as material } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import { evaluateTriSegGeometryV1, evaluateTriSegWallDerivativeV1 } from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 as prior } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import { LAND2017_STATE_INDEX as ix } from "@/engine/myocardium/myofilament/land2017/types";
import type { MainWireIntegratedModelStructuralAnalysisSessionV3 } from "./MainWirePressureVolumeProtocolsV3";

/** Read-only projection of accepted mechanics. Used for one terminal replay,
 * never during settlement; accounting on a trajectory is not a causal effect.
 * Restricted to the current rounded-ejection anatomy. Research constructions
 * changing Land slack stretch must pass their exact material value explicitly. */
export function readMainWireEjectionMaterialV1(
  step: MainWireIntegratedModelStepSuccessV3<MainWireNormalAdultFiveWallMechanicsStateV1>,
  landSlackStretch: number = material.landSlackStretch,
) {
  if (!Number.isFinite(landSlackStretch) || landSlackStretch <= 0) throw new Error("invalid material slack stretch");
  const base = step.coronaryStep.baseStep;
  const r = base.mechanicsTrial.diagnostics.readback as unknown as MainWireFiveWallLandTriSegReadbackV1;
  const states = step.acceptedState.coronary.mechanics.materialState.wallStateByWall;
  const geo = evaluateTriSegGeometryV1({
    leftVentricularCavityVolumeM3: base.mechanicsTrial.candidateVolumesMl.LV * 1e-6,
    rightVentricularCavityVolumeM3: base.mechanicsTrial.candidateVolumesMl.RV * 1e-6,
    coordinates: r.internalCoordinates, walls: prior.anatomy.triSeg.wallGeometryParameters });
  const g = -geo.walls.LVFW.parameters.wallMaterialVolumeM3
    * evaluateTriSegWallDerivativeV1(geo.walls.LVFW).dFiberLogStrainDCapVolumePerM3 / 133.322;
  const walls = Object.fromEntries((["LVFW", "SEP", "RVFW"] as const).map(wall => {
    const m = r.wallMaterialReadbackByWall[wall] as unknown as MainWireNormalAdultWallMaterialReadbackV1;
    const s = states[wall].landState;
    return [wall, { activeStressPa: m.landActiveKirchhoffStressPa,
      passiveStressPa: m.totalKirchhoffStressPa - m.landActiveKirchhoffStressPa - m.slsOverstressPa,
      slsStressPa: m.slsOverstressPa, totalStressPa: m.totalKirchhoffStressPa,
      fiberLogStrain: states[wall].previousFiberLogStrain,
      landStretch: landSlackStretch * Math.exp(states[wall].previousFiberLogStrain),
      caTRPN: s[ix.CaTRPN], B: s[ix.B], W: s[ix.W], S: s[ix.S], zetaW: s[ix.zetaW], zetaS: s[ix.zetaS] }];
  }));
  const reconstructionErrorMmHg = g * walls.LVFW!.totalStressPa - r.triseg.leftVentricularPressurePa / 133.322;
  if (!Number.isFinite(reconstructionErrorMmHg) || Math.abs(reconstructionErrorMmHg) > 1e-8) {
    throw new Error("accepted LV geometry/stress pressure reconstruction failed");
  }
  return { acceptedTimeSec: step.acceptedState.acceptedTimeSec, landSlackStretch, lvGeometryMmHgPerPa: g,
    lvPressureReconstructionErrorMmHg: reconstructionErrorMmHg, walls,
    aorticRootFlowMlPerSec: base.circulationTrial.edgeFlowsMlPerSec.Ao_SA,
    aorticOpeningFraction01: base.circulationTrial.valveEvaluations.AoV.state.leafletOpeningFraction01,
    aorticEffectiveAreaCm2: base.circulationTrial.valveEvaluations.AoV.activeEoaCm2,
    arterialPressureMmHg: { Ao: base.circulationTrial.nodeAbsolutePressuresMmHg.Ao,
      SA: base.circulationTrial.nodeAbsolutePressuresMmHg.SA },
    externalPressureMmHg: base.commonIntrathoracicPressureMmHg + base.pericardium.excessPressureMmHg };
}

/** Phase-resolved diagnostic on an independent copy of a qualified endpoint.
 * This advances the supplied copy. It is not a new settlement/qualification
 * protocol and must never be invoked on the live session or retained anchor. */
export function recordMainWireFillingMaterialCycleV1(
  copy: MainWireIntegratedModelStructuralAnalysisSessionV3,
  landSlackStretch: number,
  cycleLengthSec: number,
  sampleIntervalSec: number = .002,
) {
  if (!Number.isFinite(cycleLengthSec) || cycleLengthSec <= 0) throw new Error("invalid filling readback cycle length");
  if (![.001, .002].includes(sampleIntervalSec)) throw new Error("filling readback interval must be 1 or 2 ms");
  const origin = copy.currentAcceptedState().acceptedTimeSec;
  const samples = [];
  let previousTime = origin;
  let previousBeatId = copy.observe().completedBeatMetrics?.endAtrialCaptureId ?? null;
  const completeBeats = [];
  // A fresh accumulator at an atrial capture needs three future captures for
  // two complete beats. Include the final boundary when HR70's period is not
  // an integer number of sample ticks; flooring 3T drops that last capture.
  for (let i = 1; i <= Math.ceil(3 * cycleLengthSec / sampleIntervalSec) + 1; i++) {
    const advanced = copy.advanceToPresentationTime(origin + i * sampleIntervalSec);
    if (advanced.status !== "advanced") throw new Error(`filling readback failed: ${advanced.status}`);
    const observation = advanced.observation, step = observation.lastAcceptedStep;
    if (step === null || step.acceptedState.acceptedTimeSec !== observation.acceptedState.acceptedTimeSec) {
      throw new Error("filling material readback requires a clock-matched full accepted step");
    }
    const base = step.coronaryStep.baseStep, circulation = base.circulationTrial;
    const time = step.acceptedState.acceptedTimeSec;
    samples.push({ acceptedTimeSec: time, sampleDurationSec: time - previousTime,
      acceptedSubstepCount: advanced.internalAcceptedSubstepCount,
      chamberVolumeMl: Object.fromEntries((["LA", "LV", "RA", "RV"] as const)
        .map(id => [id, circulation.candidateNodeVolumesMl[id]])),
      absolutePressureMmHg: Object.fromEntries((["LA", "LV", "RA", "RV", "Ao", "PA", "PVein"] as const)
        .map(id => [id, circulation.nodeAbsolutePressuresMmHg[id]])),
      transmuralPressureMmHg: base.mechanicsTrial.transmuralPressuresMmHg,
      valveFlowMlPerSec: Object.fromEntries((["MV", "AoV", "TV", "PV"] as const)
        .map(id => [id, circulation.valveEvaluations[id].flowMlPerSec])),
      freeCalciumUMByWall: step.calciumDrive.freeCalciumUMByWall,
      material: readMainWireEjectionMaterialV1(step, landSlackStretch) });
    previousTime = time;
    const beat = observation.completedBeatMetrics;
    if (beat !== null && beat.endAtrialCaptureId !== previousBeatId) {
      previousBeatId = beat.endAtrialCaptureId;
      if (beat.startTimeSec >= origin) completeBeats.push(beat);
      if (completeBeats.length === 2) {
        return { role: "two-complete-beats-on-independent-settled-endpoint-copy",
          sampling: `${sampleIntervalSec * 1000}ms-presentation-endpoints; internal boundary substeps may be omitted; no smoothing`,
          sampleIntervalSec,
          dedicatedNumericalQualification: false,
          originAcceptedTimeSec: origin, completedBeats: completeBeats, samples };
      }
    }
  }
  throw new Error("filling readback did not retain two complete beats");
}
