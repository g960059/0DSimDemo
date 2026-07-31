import type { CoreRuntimeParams } from "@/engine/protocol";

export function defaultParams(): CoreRuntimeParams {
  return {
    HR: 75,
    contractility: 1.0,
    relaxation: 1.0,
    // Calibrated operating point for the active-stress ventricle default.
    // M12-proper #1 Phase-1 plus 2026-06-05 review repair: the public systemic
    // multiplier is neutral, while the base systemic edge resistances are
    // slightly lower than the earlier graph to keep realised MAP/CO normal.
    systemicResistance: 1.0,
    pulmonaryResistance: 0.625,
    venousTone: 0.15,
    arterialStiffness: 0.75, // M12-proper #1 Phase-1: more arterial compliance to hold pulse pressure normal
    PEEP: 0,
    Pth0: 0,
    respAmpTh: 0,
    respAmpAlv: 0,
    respRate: 0.25,
    bleedRate: 0,
    fluidRate: 0,
    speed: 1,
    avDelaySec: 0.16,
    atrialElectromechanicalDelaySec: 0.00,
    ventricularElectromechanicalDelaySec: 0.05,
    // Canonical chamber mechanics mode for this runtime parameter set.
    heartModel: "activeStress",
    useChiResistance: false,
    projectTBV: true,
    // Contractility multiplier on the (now folded-in) chamber Tmax0. 1.0 = raw
    // fibre ceiling; default is lower so the normal LV does not out-run the
    // aortic root / dynamic-flow envelope and appear AS-like.
    lvTmaxScale: 0.70,
    rvTmaxScale: 1.0,
    lvGeomScale: 1,
    rvGeomScale: 1,
    caReleaseScale: 1,
    rvCaReleaseScale: 1,
    // Pericardial pressure and septal volume-shift coupling. The baseline is
    // deliberately light-touch (Ppc ~0 at average resting heart volume) so the
    // calibrated normal physiology remains stable, while effusion/constraint and
    // RV pressure overload have a real mechanical pathway.
    pericardiumEnabled: true,
    pericardialPressureScaleMmHg: 1.2,
    pericardialSlackVolumeMl: 340,
    pericardialVolumeScaleMl: 45,
    pericardialSoftnessMl: 8,
    pericardialBiasMmHg: 0,
    pericardialFluidMl: 0,
    septalCouplingEnabled: true,
    septalStiffnessScale: 1,
    septalK1MmHgPerMl: 1.4,
    septalK3MmHgPerMl3: 0.006,
    septalDampingMmHgSecPerMl: 4.0,
    septalMaxShiftMl: 25,
    septalLvPressureWeight: 0.28,
    coronaryEnabled: true,
    coronaryResistanceScale: 1,
    coronaryCompressionScale: 1.5,
    coronaryVasodilator: 0,
    coronaryReserveMax: 3.5,
    LADStenosis: 0,
    LCxStenosis: 0,
    RCAStenosis: 0,
    // Valve Defaults
    // MV
    MV_Aref: 5.0, MV_Amax: 5.5, MV_Aleak: 0, MV_kOpen: 2.0, MV_tauOpen: 0.024, MV_tauClose: 0.016, MV_R: 0.0027, MV_L: 0.0005, MV_B: 8e-6,
    // AoV
    AoV_Aref: 3.5, AoV_Amax: 3.5, AoV_Aleak: 0, AoV_kOpen: 3.0, AoV_tauOpen: 0.006, AoV_tauClose: 0.008, AoV_R: 0.0015, AoV_L: 0.00025, AoV_B: 1e-6,
    // TV
    TV_Aref: 8.0, TV_Amax: 8.0, TV_Aleak: 0, TV_kOpen: 2.0, TV_tauOpen: 0.018, TV_tauClose: 0.010, TV_R: 0.0035, TV_L: 0.0008, TV_B: 1e-5,
    // PV
    PV_Aref: 4.0, PV_Amax: 4.0, PV_Aleak: 0, PV_kOpen: 2.0, PV_tauOpen: 0.010, PV_tauClose: 0.006, PV_R: 0.005, PV_L: 0.001, PV_B: 2e-6
  };
}
