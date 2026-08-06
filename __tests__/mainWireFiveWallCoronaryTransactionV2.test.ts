import { describe, expect, it } from "vitest";

import {
  NON_CORONARY_NODE_NAMES_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { defaultParams } from "@/engine/core/params";
import {
  NORMAL_CORONARY_DISEASE_INPUT_V2,
  type CoronaryDiseaseInputV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_FINGERPRINT_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import {
  coronaryConfigurationFingerprintV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  createMechanicalSupportConfigV1,
  defaultMechanicalSupportConfigV1,
} from "@/engine/devices/defaultsV1";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V2,
  advanceMainWireCoronaryMvcReferenceV2,
  initializeMainWireFiveWallCoronaryV2,
  stepMainWireFiveWallCoronaryV2,
  type MainWireCoronaryMvcReferenceStateV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
  type MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  type WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

type TestState = Readonly<{ timeSec: number; volumeSumMl: number }>;

const base = defaultParams();
const PERICARDIUM = createMainWireNormalAdultCommonPericardiumV1("exact-off");
const RUNTIME = Object.freeze({
  vascular: Object.freeze({
    venousTone: base.venousTone,
    arterialStiffness: base.arterialStiffness,
  }),
  losses: Object.freeze({
    systemicResistance: base.systemicResistance,
    pulmonaryResistance: base.pulmonaryResistance,
  }),
  respiratory: Object.freeze({
    PEEP: 0,
    Pth0: -3,
    respAmpTh: 0,
    respAmpAlv: 0,
    respRate: 0,
  }),
  valveResearchInput: MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
});

describe("main-wire five-wall + sixteen-volume coronary atomic transaction V2", () => {
  it("cold-starts all 31 volume owners and six tone states on one exact 5600 mL ledger", () => {
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider: testLandReadbackProvider(false),
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const state = cold.acceptedState;
    const nonCoronaryVolumes = Object.keys(state.circulation.nodeVolumesMl);
    const coronaryVolumes = Object.keys(state.coronary.volumeMlByNode);
    const toneValues = CORONARY_TERRITORY_IDS_V2.flatMap(
      (territoryId) => CORONARY_LAYER_IDS_V2.map(
        (layerId) => state.coronary
          .toneResistanceScaleByTerritoryLayer[territoryId][layerId],
      ),
    );

    expect(nonCoronaryVolumes).toEqual([...NON_CORONARY_NODE_NAMES_V1]);
    expect(coronaryVolumes).toEqual([
      ...CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
    ]);
    expect(nonCoronaryVolumes).toHaveLength(15);
    expect(coronaryVolumes).toHaveLength(16);
    expect(nonCoronaryVolumes.length + coronaryVolumes.length).toBe(31);
    expect(toneValues).toHaveLength(6);
    expect(toneValues.every((value) => Number.isFinite(value) && value > 0))
      .toBe(true);
    expect(Object.values(state.coronary.volumeMlByNode)
      .every((volume) => Number.isFinite(volume) && volume > 0)).toBe(true);

    const coronaryVolume = coronaryBloodVolumeMl(state.coronary);
    expect(state.fixedGlobalTotalBloodVolumeMl).toBe(5600);
    expect(state.circulation.totalBloodVolumeMl + coronaryVolume)
      .toBeCloseTo(5600, 10);
    expect(state.revision).toBe(0);
    expect(state.circulation.revision).toBe(0);
    expect(state.coronary.revision).toBe(0);
    expect(state.mechanics.revision).toBe(0);
    expect(state.acceptedTimeSec).toBe(0);

    expect(cold.pressureLadderDiagnostics).not.toBeNull();
    expect(cold.pressureLadderDiagnostics?.converged).toBe(true);
    expect(cold.pressureLadderDiagnostics
      ?.maximumAbsoluteNodeContinuityResidualMlPerSec).toBeLessThan(1e-9);
    expect(cold.pressureLadderDiagnostics
      ?.pressureConsistentCoronaryBloodVolumeMl).toBeCloseTo(
        coronaryVolume,
        12,
      );

    expect(state.coronaryBinding).toEqual({
      topologyId: state.coronaryBinding.topologyId,
      priorFingerprint:
        MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_FINGERPRINT_V2,
      collapseHydraulicsFingerprint: coronaryConfigurationFingerprintV2(
        MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
      ),
      boundaryResolverId: MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
      impMechanism: "cep-shortening-induced",
      shorteningImpPriorFingerprint: coronaryConfigurationFingerprintV2(
        NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
      ),
      mvcReferenceSemantics:
        "previous-accepted-mitral-closure-fiber-strain-v1",
    });
    expect(state.mvcReferenceState.reference.referenceFiberLogStrainByWall)
      .toEqual({ LVFW: -0.12, SEP: -0.09, RVFW: -0.07 });
    expect(MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V2
      .toneUpdateInsideHydraulicNewton).toBe(false);
    expect(MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V2
      .mechanicsProbeContext).toBe(
        "one-audited-private-accepted-mechanics-snapshot-per-outer-step",
      );
    expect(MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V2
      .mechanicalSupportCoupling).toBe(
        "optional-same-candidate-algebraic-device-node-rates-inside-outer-be-residual",
      );
    expect(MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V2.outerJacobian)
      .toBe(
        "analytic-noncoronary-plus-implicit-coronary-directional-sensitivity-with-development-fd-shadow",
      );
  });

  it("latches an MVC strain reference only on an accepted mitral-flow true-to-false event", () => {
    const initial = Object.freeze({
      reference: Object.freeze({
        referenceFiberLogStrainByWall: Object.freeze({
          LVFW: 0.12,
          SEP: 0.10,
          RVFW: 0.08,
        }),
      }),
      referenceAcceptedTimeSec: 0,
      referenceRevision: 0,
      mitralForwardFlowActive: false,
      acceptedMitralClosureEventCount: 0,
    }) satisfies MainWireCoronaryMvcReferenceStateV2;
    const initialJson = JSON.stringify(initial);
    const opened = advanceMainWireCoronaryMvcReferenceV2(initial, {
      acceptedTimeSec: 0.1,
      acceptedRevision: 1,
      mitralForwardFlowMlPerSec: 5,
      effectiveFiberLogStrainByWall: Object.freeze({
        LVFW: 0.11,
        SEP: 0.09,
        RVFW: 0.07,
      }),
    });
    expect(opened.mitralForwardFlowActive).toBe(true);
    expect(opened.reference).toEqual(initial.reference);
    expect(opened.acceptedMitralClosureEventCount).toBe(0);

    const closureStrain = Object.freeze({
      LVFW: 0.09,
      SEP: 0.06,
      RVFW: 0.04,
    });
    const closed = advanceMainWireCoronaryMvcReferenceV2(opened, {
      acceptedTimeSec: 0.2,
      acceptedRevision: 2,
      // The contract is strictly greater than 1 mL/s for active flow.
      mitralForwardFlowMlPerSec: 1,
      effectiveFiberLogStrainByWall: closureStrain,
    });
    expect(closed.mitralForwardFlowActive).toBe(false);
    expect(closed.reference.referenceFiberLogStrainByWall)
      .toEqual(closureStrain);
    expect(closed.referenceAcceptedTimeSec).toBe(0.2);
    expect(closed.referenceRevision).toBe(2);
    expect(closed.acceptedMitralClosureEventCount).toBe(1);

    const stillClosed = advanceMainWireCoronaryMvcReferenceV2(closed, {
      acceptedTimeSec: 0.3,
      acceptedRevision: 3,
      mitralForwardFlowMlPerSec: -2,
      effectiveFiberLogStrainByWall: Object.freeze({
        LVFW: -0.2,
        SEP: -0.2,
        RVFW: -0.2,
      }),
    });
    expect(stillClosed.reference).toEqual(closed.reference);
    expect(stillClosed.acceptedMitralClosureEventCount).toBe(1);
    expect(JSON.stringify(initial)).toBe(initialJson);
  });

  it("rejects a step whose bound IMP mechanism differs before mutating accepted state", () => {
    const provider = testLandReadbackProvider(false);
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const before = JSON.stringify(cold.acceptedState);

    expect(() => stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
        impMechanism: "cep-only-control",
      },
    )).toThrow(/binding and step configuration differ/);
    expect(JSON.stringify(cold.acceptedState)).toBe(before);
  });

  it("commits circulation, coronary hydraulics, mechanics, and MVC memory exactly once", () => {
    const provider = testLandReadbackProvider(false);
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const previousCoronaryVolume = coronaryBloodVolumeMl(
      cold.acceptedState.coronary,
    );
    const stepped = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
      },
    );

    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    const next = stepped.acceptedState;
    const nextCoronaryVolume = coronaryBloodVolumeMl(next.coronary);
    expect(next.revision).toBe(1);
    expect(next.circulation.revision).toBe(1);
    expect(next.coronary.revision).toBe(1);
    expect(next.mechanics.revision).toBe(1);
    expect(next.acceptedTimeSec).toBeCloseTo(0.001, 14);
    expect(next.circulation.acceptedTimeSec).toBe(next.acceptedTimeSec);
    expect(next.coronary.acceptedTimeSec).toBe(next.acceptedTimeSec);
    expect(next.mechanics.acceptedTimeSec).toBe(next.acceptedTimeSec);
    expect(next.circulation.totalBloodVolumeMl + nextCoronaryVolume)
      .toBeCloseTo(5600, 9);
    expect(stepped.circulationTrial.diagnostics.totalBloodVolumeErrorMl)
      .toBeCloseTo(0, 9);
    expect(stepped.coronaryTrial.diagnostics.exactBloodVolumeLedgerResidualMl)
      .toBeCloseTo(0, 9);
    expect(stepped.circulationTrial.diagnostics.jacobianMode)
      .toBe("analytic-semismooth");
    expect(stepped.circulationTrial.diagnostics
      .analyticJacobianAssemblyCount).toBeGreaterThan(0);
    expect(stepped.circulationTrial.diagnostics
      .finiteDifferenceJacobianFallbackCount).toBe(0);
    expect(stepped.circulationTrial.diagnostics
      .finiteDifferenceJacobianFallbackReason).toBeNull();
    expect(
      next.circulation.totalBloodVolumeMl
        - cold.acceptedState.circulation.totalBloodVolumeMl,
    ).toBeCloseTo(-(nextCoronaryVolume - previousCoronaryVolume), 9);
    expect(stepped.circulationTrial.conservativeCompanion
      ?.outerBoundaryNetVolumeRateMlPerSec.Ao).toBeCloseTo(
        -stepped.coronaryTrial.diagnostics.hydraulics.totalInletFlowMlPerSec,
        12,
      );
    expect(stepped.circulationTrial.conservativeCompanion
      ?.outerBoundaryNetVolumeRateMlPerSec.RA).toBeCloseTo(
        stepped.coronaryTrial.diagnostics.hydraulics
          .commonCoronaryVenousOutletFlowMlPerSec,
        12,
      );
    expect(next.coronary.toneResistanceScaleByTerritoryLayer)
      .toEqual(cold.acceptedState.coronary
        .toneResistanceScaleByTerritoryLayer);
    expect(next.coronaryBinding).toEqual(cold.acceptedState.coronaryBinding);
  }, 60_000);

  it("is bit-exact when the combined coronary + MCS extension is all-off", () => {
    const provider = testLandReadbackProvider(false);
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const withoutDevices = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
      },
    );
    const allOff = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
        mechanicalSupport: {
          config: defaultMechanicalSupportConfigV1(),
          heartRateBpm: 60,
        },
      },
    );

    expect(withoutDevices.converged).toBe(true);
    expect(allOff.converged).toBe(true);
    if (!withoutDevices.converged || !allOff.converged) return;
    expect(allOff.acceptedState).toEqual(withoutDevices.acceptedState);
    expect(allOff.circulationTrial.candidateNodeVolumesMl)
      .toEqual(withoutDevices.circulationTrial.candidateNodeVolumesMl);
    expect(allOff.circulationTrial.nodeAbsolutePressuresMmHg)
      .toEqual(withoutDevices.circulationTrial.nodeAbsolutePressuresMmHg);
    expect(allOff.circulationTrial.edgeFlowsMlPerSec)
      .toEqual(withoutDevices.circulationTrial.edgeFlowsMlPerSec);
    expect(allOff.circulationTrial.mechanicalSupport).toBeDefined();
    expect(withoutDevices.circulationTrial.mechanicalSupport).toBeUndefined();
  }, 60_000);

  it("is bit-exact when an external owner supplies the same calcium candidate", () => {
    const provider = testLandReadbackProvider(false);
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const common = {
      dtSec: 0.001,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    } as const;
    const native = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      common,
    );
    const prescribed = evaluateFiveWallNormalCalciumDriveV1(
      0.001,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    );
    const external = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      {
        ...common,
        calciumDriveOverride: Object.freeze({
          freeCalciumUMByWall: prescribed.freeCalciumUMByWall,
        }),
      },
    );

    expect(native.converged).toBe(true);
    expect(external.converged).toBe(true);
    if (!native.converged || !external.converged) return;
    expect(external.calciumDrive).toEqual(native.calciumDrive);
    expect(external.acceptedState).toEqual(native.acceptedState);
    expect(external.circulationTrial.edgeFlowsMlPerSec)
      .toEqual(native.circulationTrial.edgeFlowsMlPerSec);
    expect(MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V2
      .calciumDriveStateOwnership).toBe(
        "none-external-owner-must-commit-or-rollback-with-this-transaction",
      );
  }, 60_000);

  it("couples LVAD and coronary hydraulics conservatively in one candidate", () => {
    const provider = testLandReadbackProvider(false);
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const stepped = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
        mechanicalSupport: {
          config: createMechanicalSupportConfigV1({
            lvad: { enabled: true, speedRpm: 4_500 },
          }),
          heartRateBpm: 60,
        },
        circulationNewtonOptions: {
          analyticJacobianFiniteDifferenceShadow: true,
        },
      },
    );

    expect(stepped.converged).toBe(true);
    if (!stepped.converged) return;
    const support = stepped.circulationTrial.mechanicalSupport!;
    expect(support.pump.LVAD.flowLMin).toBeGreaterThan(0);
    expect(support.nodeNetVolumeRateMlPerSec.LV).toBeLessThan(0);
    expect(support.nodeNetVolumeRateMlPerSec.Ao).toBeGreaterThan(0);
    expect(Math.abs(support.conservationResidualMlPerSec)).toBeLessThan(1e-12);
    expect(Math.abs(
      stepped.circulationTrial.diagnostics.totalBloodVolumeErrorMl,
    )).toBeLessThan(1e-8);
    expect(Math.abs(
      stepped.coronaryTrial.diagnostics.exactBloodVolumeLedgerResidualMl,
    )).toBeLessThan(1e-8);
    expect(stepped.circulationTrial.diagnostics.jacobianMode)
      .toBe("analytic-semismooth");
    expect(stepped.circulationTrial.diagnostics
      .finiteDifferenceJacobianFallbackReason).toBeNull();
    expect(stepped.circulationTrial.diagnostics
      .finiteDifferenceJacobianShadowCount).toBeGreaterThan(0);
    expect(stepped.circulationTrial.diagnostics
      .jacobianMaximumRelativeFrobeniusShadowDifference)
      .toBeLessThan(2e-5);
  }, 60_000);

  it("rolls back coronary, circulation, and mechanics on malformed MCS input", () => {
    const provider = testLandReadbackProvider(false);
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const before = JSON.stringify(cold.acceptedState);
    const defaults = defaultMechanicalSupportConfigV1();
    const malformed = {
      ...defaults,
      lvad: {
        ...defaults.lvad,
        enabled: true,
        speedRpm: Number.NaN,
      },
    } as ReturnType<typeof defaultMechanicalSupportConfigV1>;
    const stepped = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
        mechanicalSupport: { config: malformed, heartRateBpm: 60 },
      },
    );

    expect(stepped.converged).toBe(false);
    if (stepped.converged === true) throw new Error("expected rollback");
    expect(stepped.circulationFailureReason).toBe("invalid-input");
    expect(stepped.circulationCommitted).toBe(false);
    expect(stepped.coronaryCommitted).toBe(false);
    expect(stepped.mechanicsCommitted).toBe(false);
    expect(stepped.mvcReferenceCommitted).toBe(false);
    expect(JSON.stringify(stepped.rollbackState)).toBe(before);
    expect(JSON.stringify(cold.acceptedState)).toBe(before);
  }, 60_000);

  it("rolls back every owner when an invalid V2 disease input rejects the coupled trial", () => {
    const provider = testLandReadbackProvider(false);
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const before = JSON.stringify(cold.acceptedState);
    const invalidDisease = Object.freeze({
      ...NORMAL_CORONARY_DISEASE_INPUT_V2,
      LAD: Object.freeze({
        ...NORMAL_CORONARY_DISEASE_INPUT_V2.LAD,
        layers: Object.freeze({
          ...NORMAL_CORONARY_DISEASE_INPUT_V2.LAD.layers,
          subepicardial: Object.freeze({
            ...NORMAL_CORONARY_DISEASE_INPUT_V2.LAD.layers.subepicardial,
            structuralR1ResistanceScale: 0,
          }),
        }),
      }),
    }) satisfies CoronaryDiseaseInputV2;

    const stepped = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
        coronaryDisease: invalidDisease,
      },
    );

    expect(stepped.converged).toBe(false);
    if (stepped.converged === true) throw new Error("expected rollback");
    expect(stepped.circulationFailureReason).toBe("initial-evaluation-failed");
    expect(stepped.circulationCommitted).toBe(false);
    expect(stepped.coronaryCommitted).toBe(false);
    expect(stepped.mechanicsCommitted).toBe(false);
    expect(stepped.mvcReferenceCommitted).toBe(false);
    expect(JSON.stringify(stepped.rollbackState)).toBe(before);
    expect(JSON.stringify(cold.acceptedState)).toBe(before);
  }, 60_000);

  it("advances the canonical Moyer/Klotz + full Land/SLS + membrane TriSeg provider", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const stepped = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.002,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium,
      },
    );

    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    expect(stepped.mechanicsTrial.diagnostics.converged).toBe(true);
    expect(stepped.coronaryTrial.diagnostics.converged).toBe(true);
    expect(stepped.circulationTrial.diagnostics.totalBloodVolumeErrorMl)
      .toBeCloseTo(0, 9);
    expect(stepped.coronaryTrial.diagnostics.exactBloodVolumeLedgerResidualMl)
      .toBeCloseTo(0, 9);
    expect(Object.values(
      stepped.intramyocardialPressureMmHgByTerritoryLayer.LAD,
    ).every(Number.isFinite)).toBe(true);
    expect(stepped.circulationTrial.diagnostics.jacobianMode)
      .toBe("analytic-semismooth");
    expect(stepped.circulationTrial.diagnostics
      .finiteDifferenceJacobianFallbackCount).toBe(0);
    expect(Object.is(
      stepped.coronaryBoundary.absoluteRightAtrialPressureMmHg,
      -0,
    )).toBe(false);
  }, 60_000);

  it("matches the development full-FD shadow with the implicit coronary outer Jacobian", () => {
    const provider = testLandReadbackProvider(false);
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const stepped = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.001,
        runtime: RUNTIME,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium: PERICARDIUM,
        circulationNewtonOptions: Object.freeze({
          analyticJacobianFiniteDifferenceShadow: true,
        }),
      },
    );

    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    const diagnostics = stepped.circulationTrial.diagnostics;
    expect(diagnostics.jacobianMode).toBe("analytic-semismooth");
    expect(diagnostics.analyticJacobianAssemblyCount).toBeGreaterThan(0);
    expect(diagnostics.finiteDifferenceJacobianFallbackCount).toBe(0);
    expect(diagnostics.finiteDifferenceJacobianShadowCount).toBeGreaterThan(0);
    expect(diagnostics.jacobianMaximumAbsoluteShadowDifference)
      .not.toBeNull();
    expect(diagnostics.jacobianMaximumRelativeFrobeniusShadowDifference)
      .not.toBeNull();
    expect(diagnostics.jacobianMaximumAbsoluteShadowDifference!)
      .toBeLessThan(3e-6);
    // The analytic path and shadow use independent nested central differences;
    // keep a tight ppm-scale gate with headroom for platform roundoff.
    expect(diagnostics.jacobianMaximumRelativeFrobeniusShadowDifference!)
      .toBeLessThan(2e-6);
  }, 60_000);
});

function testLandReadbackProvider(
  rejectTrials: boolean,
): WholeHeartMechanicsProviderV1<
  TestState,
  MainWireFiveWallFreeCalciumDriveV1
> {
  const codec = Object.freeze({
    clone: (state: TestState) => Object.freeze({ ...state }),
    encode: (state: TestState) => Object.freeze({ ...state }),
    decode: (encoded: unknown) => Object.freeze({ ...(encoded as TestState) }),
  });
  const evaluate = (
    timeSec: number,
    volumes: Readonly<{ LA: number; LV: number; RA: number; RV: number }>,
    fail: boolean,
  ) => {
    const wall = (landActiveKirchhoffStressPa: number) => Object.freeze({
      adapterId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
      landActiveKirchhoffStressPa,
    });
    return Object.freeze({
      materialState: Object.freeze({
        timeSec,
        volumeSumMl: volumes.LA + volumes.LV + volumes.RA + volumes.RV,
      }),
      transmuralPressuresMmHg: Object.freeze({
        LA: 10 + 0.08 * (volumes.LA - 45),
        LV: 105 + 0.10 * (volumes.LV - 130),
        RA: 5 + 0.06 * (volumes.RA - 55),
        RV: 25 + 0.08 * (volumes.RV - 140),
      }),
      transmuralPressureVolumeTangentMmHgPerMl: Object.freeze({
        LA: Object.freeze({ LA: 0.08, LV: 0, RA: 0, RV: 0 }),
        LV: Object.freeze({ LA: 0, LV: 0.10, RA: 0, RV: 0 }),
        RA: Object.freeze({ LA: 0, LV: 0, RA: 0.06, RV: 0 }),
        RV: Object.freeze({ LA: 0, LV: 0, RA: 0, RV: 0.08 }),
      }),
      diagnostics: Object.freeze({
        converged: !fail,
        finite: true,
        iterationCount: 1,
        residualNorm: 0,
        errors: Object.freeze(fail ? ["intentional trial rejection"] : []),
        warnings: Object.freeze([]),
        readback: Object.freeze({
          providerModelId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
          effectiveFiberLogStrainByWall: Object.freeze({
            LA: -0.02,
            LVFW: -0.12,
            SEP: -0.09,
            RVFW: -0.07,
            RA: -0.01,
          }),
          wallMaterialReadbackByWall: Object.freeze({
            LA: null,
            LVFW: wall(120_000),
            SEP: wall(95_000),
            RVFW: wall(45_000),
            RA: null,
          }),
        }),
      }),
    });
  };
  return Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: `test-v2-land-readback-provider-${rejectTrials}`,
    parameterSetId: `test-v2-land-readback-prior-${rejectTrials}`,
    parameterIdentityHash: rejectTrials ? "reject" : "accept",
    stateSchemaVersion: 1,
    stateCodec: codec,
    initializeCold: (input) => evaluate(input.timeSec, input.volumesMl, false),
    evaluateTrial: (input) => evaluate(
      input.candidateTimeSec,
      input.candidateVolumesMl,
      rejectTrials,
    ),
  });
}

function coronaryBloodVolumeMl(
  state: Readonly<{ volumeMlByNode: Readonly<Record<string, number>> }>,
): number {
  return Object.values(state.volumeMlByNode).reduce(
    (sum, volume) => sum + volume,
    0,
  );
}
