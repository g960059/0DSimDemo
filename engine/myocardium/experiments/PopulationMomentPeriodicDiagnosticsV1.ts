import type { MainWireIntegratedModelAcceptedStateV3 } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type { MainWirePopulationMomentMechanicsStateV1 } from "./MainWirePopulationMomentResearchV1";
import type { MechanicalSupportConfigV1 } from "@/engine/devices/typesV1";
import { MAIN_WIRE_FIVE_WALL_IDS_V1 } from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type { LandSlsWallMaterialStateV1 } from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import { compareMainWireIntegratedModelAcceptedStatesV3,
  type MainWireIntegratedModelPeriodicAcceptedStateV3 } from "./MainWireIntegratedModelPeriodicClosureV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 } from "./MainWireIntegratedModelReferenceScalesV3";
import { validatePopulationMomentStateV1 } from "./LandPopulationMomentResearchV1";

type State = MainWireIntegratedModelAcceptedStateV3<MainWirePopulationMomentMechanicsStateV1>;

/** Reuse the existing complete clock/lineage/circulation/coronary/SLS checks
 * through a READ-ONLY observable view C,B,W,S,Mw/W,Ms/S. This view is never an
 * accepted material state and must NEVER be advanced, persisted or restored.
 * Also compare the actual moments directly, with predeclared unit scales.
 * Population + mean is bijective for nonempty pools; empty moments must be 0.
 * Returned evidence is explicitly research diagnostics, not Land qualification. */
export function comparePopulationMomentPeriodicDiagnosticsV1(current: State, reference: State, config: MechanicalSupportConfigV1) {
  const shared = compareMainWireIntegratedModelAcceptedStatesV3(
    observableView(current), observableView(reference), MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3, config);
  const moments = (["LVFW", "SEP", "RVFW"] as const).flatMap(wall => {
    const a = current.coronary.mechanics.materialState.wallStateByWall[wall];
    const b = reference.coronary.mechanics.materialState.wallStateByWall[wall];
    if (a.law !== "ventricular-moment" || b.law !== "ventricular-moment") throw new Error("moment closure wall law mismatch");
    return (["weakMoment", "strongMoment"] as const).map(key => ({ path: `${wall}.${key}`,
      currentValue: a.body.moment[key], referenceValue: b.body.moment[key], referenceScale: 1,
      normalizedDelta: Math.abs(a.body.moment[key] - b.body.moment[key]) }));
  });
  const worst = moments.reduce((a, b) => b.normalizedDelta > a.normalizedDelta ? b : a);
  return Object.freeze({ diagnosticId: "population-moment-full-periodic-observable-diagnostics-v1",
    qualificationOfPublishedModel: false, diagnosticProjectionOnlyNeverCheckpointed: true,
    sharedClockCirculationCoronaryCalciumAndMaterialObservableDelta: shared.overall.maximumNormalizedDelta,
    directMomentEntries: moments, directMomentReferenceScaleProvenance: "predeclared-unit-population-times-dimensionless-distortion-not-clinical-tolerance",
    maximumNormalizedDelta: Math.max(shared.overall.maximumNormalizedDelta, worst.normalizedDelta),
    worstPath: worst.normalizedDelta > shared.overall.maximumNormalizedDelta ? worst.path
      : shared.overall.worstPath.replace(/\.landState\.zetaW/g, ".observableMeanWeakDistortion")
        .replace(/\.landState\.zetaS/g, ".observableMeanStrongDistortion"),
    inheritedCompatibilityGates: shared.gates });
}

function observableView(s: State): MainWireIntegratedModelPeriodicAcceptedStateV3 {
  const walls = Object.fromEntries(MAIN_WIRE_FIVE_WALL_IDS_V1.map(id => {
    const wall = s.coronary.mechanics.materialState.wallStateByWall[id];
    if (id === "LA" || id === "RA") {
      if (wall.law !== "atrial-land") throw new Error("moment diagnostics expected unchanged atrial Land law");
      return [id, wall.body];
    }
    if (wall.law !== "ventricular-moment") throw new Error("moment diagnostics expected own ventricular state");
    const b = wall.body, m = b.moment;
    validatePopulationMomentStateV1(m);
    return [id, { slsState: b.slsState, previousFiberLogStrain: b.previousFiberLogStrain,
      previousFreeCalciumUM: b.previousFreeCalciumUM,
      landState: new Float64Array([m.caTroponin, m.blocked, m.weak, m.strong,
        m.weak === 0 ? 0 : m.weakMoment / m.weak, m.strong === 0 ? 0 : m.strongMoment / m.strong]) }];
  })) as Record<typeof MAIN_WIRE_FIVE_WALL_IDS_V1[number], LandSlsWallMaterialStateV1>;
  return { ...s, coronary: { ...s.coronary, mechanics: { ...s.coronary.mechanics,
    materialState: { ...s.coronary.mechanics.materialState, wallStateByWall: walls } } } };
}
