import { describe, expect, it } from "vitest";

import {
  NON_CORONARY_INDEPENDENT_NODE_NAMES_V1,
  NON_CORONARY_DYNAMIC_EDGE_NAMES_V1,
  NON_CORONARY_NODE_NAMES_V1,
  NON_CORONARY_VALVE_NAMES_V1,
  createNonCoronaryBackwardEulerScratchWorkspaceV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  buildAuthoritativeCirculationGraphV1,
  vascularPvLawFromNodeV1,
  vascularTransmuralPressureAndVolumeTangentFromLawV1,
} from "@/engine/core/circulationGraphKernelV1";
import { defaultParams } from "@/engine/core/params";
import {
  CORONARY_BOUNDARY_LINEARIZATION_COMPONENT_IDS_V2,
  NORMAL_CORONARY_DISEASE_INPUT_V2,
  createCoronaryBackwardEulerScratchWorkspaceV2,
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
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_ABSOLUTE_PRESSURE_ORDER_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_CHAMBER_ORDER_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VASCULAR_FLOW_ORDER_V1,
  advanceMainWireCoronaryMvcReferenceV2,
  evaluateMainWireFiveWallCoupledResidualShadowV1,
  initializeMainWireFiveWallCoronaryV2,
  prepareMainWireFiveWallCoupledResidualContextV1,
  prepareMainWireFiveWallPromotedMechanicsResidualContextV1,
  stepMainWireFiveWallCoronaryV2,
  type MainWireCoronaryMvcReferenceStateV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  mainWireFiveWallCoronaryBaseStateV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
  evaluateMainWireFiveWallNumericalMechanicsCandidateV1,
  tryPrepareMainWireFiveWallNumericalMechanicsStepV1,
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
import {
  advanceMainWireFiveWallCoupledNewtonV1,
  createMainWireFiveWallCoupledNewtonShadowWorkspaceV1,
  solveMainWireFiveWallCoupledNewtonPredictedV1,
  solveMainWireFiveWallCoupledNewtonShadowV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";
import {
  checkpointMainWireFiveWallCoupledPredictorV1,
  createMainWireFiveWallCoupledPredictorWorkspaceV1,
  prepareMainWireFiveWallCoupledPredictionV1,
  recordAcceptedMainWireFiveWallCoupledSolutionV1,
  reportMainWireFiveWallCoupledPredictorV1,
  resetMainWireFiveWallCoupledPredictorV1,
  restoreMainWireFiveWallCoupledPredictorV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledPredictorV1";
import {
  MainWireFlatCoupledAcceptedStateV1,
} from "@/engine/vnext/coupled/MainWireFlatCoupledAcceptedStateV1";
import {
  solveMainWireFiveWallCoupledCandidateV1,
} from "@/engine/vnext/coupled/MainWireIntegratedCoupledStepV1";
import {
  createMainWireFiveWallPromotedMechanicsNewtonShadowWorkspaceV1,
  solveMainWireFiveWallPromotedMechanicsNewtonShadowV1,
} from "@/engine/vnext/coupled/MainWireFiveWallPromotedMechanicsNewtonShadowV1";
import {
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1,
} from "@/engine/vnext/MainWireSolverReplacementCorpusV1";

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

  it("rolls back when selected-only sealing rejects unconsumed rich readback", () => {
    const baseProvider = testLandReadbackProvider(false);
    const provider = Object.freeze({
      ...baseProvider,
      evaluationResultOwnershipMode: "exclusive-result" as const,
      evaluateTrial: (
        input: Parameters<typeof baseProvider.evaluateTrial>[0],
      ) => {
        const result = baseProvider.evaluateTrial(input);
        return Object.freeze({
          ...result,
          diagnostics: Object.freeze({
            ...result.diagnostics,
            readback: Object.freeze({
              ...(result.diagnostics.readback as Readonly<
                Record<string, unknown>
              >),
              unconsumedInvalidValue: Number.NaN,
            }),
          }),
        });
      },
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const before = JSON.stringify(cold.acceptedState);

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

    expect(stepped.converged).toBe(false);
    if (stepped.converged === true) throw new Error("expected rollback");
    expect(stepped.reason).toBe("selected-candidate-finalization-failed");
    expect(stepped.circulationFailureReason)
      .toBe("selected-candidate-finalization-failed");
    expect(stepped.finalizationFailureStage).toBe("selected-mechanics-seal");
    expect(stepped.message).toMatch(/finite/);
    expect(stepped.circulationCommitted).toBe(false);
    expect(stepped.coronaryCommitted).toBe(false);
    expect(stepped.mechanicsCommitted).toBe(false);
    expect(stepped.mvcReferenceCommitted).toBe(false);
    expect(JSON.stringify(stepped.rollbackState)).toBe(before);
    expect(JSON.stringify(cold.acceptedState)).toBe(before);
  }, 60_000);

  it("advances the canonical Moyer/Klotz + full Land/SLS + membrane TriSeg provider", () => {
    const baseProvider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    let materialEncodeCount = 0;
    const provider = Object.freeze({
      ...baseProvider,
      stateCodec: Object.freeze({
        ...baseProvider.stateCodec,
        encode: (state: Parameters<typeof baseProvider.stateCodec.encode>[0]) => {
          materialEncodeCount += 1;
          return baseProvider.stateCodec.encode(state);
        },
      }),
    });
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
    materialEncodeCount = 0;
    const stepped = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      {
        dtSec: 0.002,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium,
        evaluationCounterCollection: "enabled",
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
    expect(stepped.circulationTrial.diagnostics.evaluationCounters?.mechanics
      .candidateCenterEvaluationCount).toBeGreaterThan(1);
    // One accepted-state audit, one selected-candidate seal, and one commit
    // audit. Rejected Newton candidates must not serialize material state.
    expect(materialEncodeCount).toBe(3);
    expect(Object.is(
      stepped.coronaryBoundary.absoluteRightAtrialPressureMmHg,
      -0,
    )).toBe(false);
  }, 60_000);

  it("solves the canonical provider's real 30-row coupled shadow", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const stepInput = Object.freeze({
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const context = prepareMainWireFiveWallCoupledResidualContextV1(
      provider,
      cold.acceptedState,
      stepInput,
    );
    const coupled = solveMainWireFiveWallCoupledNewtonShadowV1(context);
    const sharedWorkspace =
      createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
    const reusedJacobian = solveMainWireFiveWallCoupledNewtonShadowV1(
      context,
      { maximumAcceptedStepsPerJacobian: 2 },
      sharedWorkspace,
    );
    const repeatedWithSameWorkspace =
      solveMainWireFiveWallCoupledNewtonShadowV1(
        context,
        { maximumAcceptedStepsPerJacobian: 2 },
        sharedWorkspace,
      );
    const finiteDifferenceOnly = solveMainWireFiveWallCoupledNewtonShadowV1(
      context,
      { jacobianMode: "central-difference" },
    );
    const legacy = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      stepInput,
    );

    expect(coupled.result.status).toBe("converged");
    expect(reusedJacobian.result.status).toBe("converged");
    expect(repeatedWithSameWorkspace.result.status).toBe("converged");
    expect(finiteDifferenceOnly.result.status).toBe("converged");
    expect(legacy.converged).toBe(true);
    if (coupled.result.status !== "converged") {
      throw new Error(coupled.result.message);
    }
    if (reusedJacobian.result.status !== "converged") {
      throw new Error(reusedJacobian.result.message);
    }
    if (repeatedWithSameWorkspace.result.status !== "converged") {
      throw new Error(repeatedWithSameWorkspace.result.message);
    }
    if (finiteDifferenceOnly.result.status !== "converged") {
      throw new Error(finiteDifferenceOnly.result.message);
    }
    if (legacy.converged === false) throw new Error(legacy.message);
    const converged = coupled.result;
    const numericalReadback = context.withConvergedCandidate(
      converged.solution,
      (candidate) => candidate.acceptedNumericalReadback.slice(),
    );
    const finalized = context.finalizeConvergedSolution(
      converged.solution,
      Object.freeze({
        iterations: converged.iterations,
        lineSearchBacktracks: converged.lineSearchBacktrackCount,
      }),
    );
    expect(finalized.converged).toBe(true);
    if (finalized.converged === false) throw new Error(finalized.message);
    const readbackLayout =
      MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
    expect(numericalReadback[readbackLayout.timeSec]).toBe(
      finalized.acceptedState.acceptedTimeSec,
    );
    MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_CHAMBER_ORDER_V1.forEach(
      (chamber, index) => {
        expect(numericalReadback[readbackLayout.chamberVolumeMl + index]).toBe(
          finalized.circulationTrial.candidateNodeVolumesMl[chamber],
        );
        expect(
          numericalReadback[readbackLayout.transmuralPressureMmHg + index],
        ).toBe(finalized.mechanicsTrial.transmuralPressuresMmHg[chamber]);
      },
    );
    MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_ABSOLUTE_PRESSURE_ORDER_V1.forEach(
      (nodeId, index) => {
        expect(
          numericalReadback[readbackLayout.absolutePressureMmHg + index],
        ).toBe(finalized.circulationTrial.nodeAbsolutePressuresMmHg[nodeId]);
      },
    );
    MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VALVE_ORDER_V1.forEach(
      (valveId, index) => {
        expect(numericalReadback[readbackLayout.valveFlowMlPerSec + index])
          .toBe(finalized.circulationTrial.valveEvaluations[valveId]
            .flowMlPerSec);
      },
    );
    MAIN_WIRE_FIVE_WALL_ACCEPTED_READBACK_VASCULAR_FLOW_ORDER_V1.forEach(
      (edgeId, index) => {
        expect(
          numericalReadback[
            readbackLayout.systemicTissueFlowMlPerSec + index
          ],
        ).toBe(finalized.circulationTrial.edgeFlowsMlPerSec[edgeId]);
      },
    );
    expect(numericalReadback[readbackLayout.pericardialExcessPressureMmHg])
      .toBe(finalized.pericardium.excessPressureMmHg);
    const coronaryHydraulics = finalized.coronaryTrial.diagnostics.hydraulics;
    expect(numericalReadback[readbackLayout.coronaryFlowMlPerSec]).toBe(
      coronaryHydraulics.totalInletFlowMlPerSec,
    );
    CORONARY_TERRITORY_IDS_V2.forEach((territoryId, index) => {
      expect(numericalReadback[readbackLayout.coronaryFlowMlPerSec + 1 + index])
        .toBe(coronaryHydraulics.inletFlowMlPerSecByTerritory[territoryId]);
    });
    expect(
      numericalReadback[readbackLayout.coronaryVenousOutletFlowMlPerSec],
    ).toBe(coronaryHydraulics.commonCoronaryVenousOutletFlowMlPerSec);
    expect(reusedJacobian.result.jacobianEvaluationCount).toBeLessThan(
      converged.jacobianEvaluationCount,
    );
    expect(reusedJacobian.result.residualInfinityNorm).toBeLessThan(1e-8);
    for (let index = 0; index < converged.solution.length; index += 1) {
      expect(reusedJacobian.result.solution[index]).toBeCloseTo(
        converged.solution[index]!,
        8,
      );
      expect(repeatedWithSameWorkspace.result.solution[index]).toBe(
        reusedJacobian.result.solution[index],
      );
    }
    expect(coupled.coronaryAnalyticBlockAssemblyCount)
      .toBe(converged.jacobianEvaluationCount);
    expect(coupled.coronaryBoundaryAnalyticBlockAssemblyCount)
      .toBe(converged.jacobianEvaluationCount);
    expect(coupled.nonCoronaryAnalyticBlockAssemblyCount)
      .toBe(converged.jacobianEvaluationCount);
    expect(coupled.jacobianResidualEvaluationCount).toBe(0);
    expect(coupled.dependentSvContinuityResidualMl).not.toBeNull();
    expect(Math.abs(coupled.dependentSvContinuityResidualMl!))
      .toBeLessThan(1e-8);
    expect(finiteDifferenceOnly.coronaryAnalyticBlockAssemblyCount).toBe(0);
    expect(finiteDifferenceOnly.jacobianResidualEvaluationCount).toBe(
      2 * context.dimension
        * finiteDifferenceOnly.result.jacobianEvaluationCount,
    );
    for (let index = 0; index < converged.solution.length; index += 1) {
      expect(converged.solution[index]).toBeCloseTo(
        finiteDifferenceOnly.result.solution[index]!,
        8,
      );
    }
    expect(converged.residualInfinityNorm).toBeLessThan(1e-8);
    expect(converged.iterations).toBeLessThanOrEqual(8);
    NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.forEach((nodeId, index) => {
      expect(converged.solution[index]).toBeCloseTo(
        legacy.circulationTrial.candidateNodeVolumesMl[nodeId],
        6,
      );
    });
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.forEach((nodeId, index) => {
      expect(converged.solution[
        NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length + index
      ]).toBeCloseTo(
        legacy.coronaryTrial.candidateAcceptedState.volumeMlByNode[nodeId],
        6,
      );
    });
  }, 60_000);

  it("promotes the two TriSeg coordinates into the real 32-row shadow", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const stepInput = Object.freeze({
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const condensedContext = prepareMainWireFiveWallCoupledResidualContextV1(
      provider,
      cold.acceptedState,
      stepInput,
    );
    const condensed = solveMainWireFiveWallCoupledNewtonShadowV1(
      condensedContext,
    );
    expect(condensed.result.status).toBe("converged");
    if (condensed.result.status !== "converged") {
      throw new Error(condensed.result.message);
    }
    const condensedSolution = condensed.result.solution;
    const promotedContext =
      prepareMainWireFiveWallPromotedMechanicsResidualContextV1(
        provider,
        cold.acceptedState,
        stepInput,
      );
    const initialGuess = promotedContext.initialUnknowns.slice();
    initialGuess.set(condensedSolution, 0);
    const analyticVolumeJacobian = new Float64Array(
      promotedContext.dimension * promotedContext.dimension,
    );
    promotedContext.writeAnalyticJacobian(
      initialGuess,
      analyticVolumeJacobian,
    );
    const plus = initialGuess.slice();
    const minus = initialGuess.slice();
    const plusResidual = new Float64Array(promotedContext.dimension);
    const minusResidual = new Float64Array(promotedContext.dimension);
    let finiteDifferenceSquaredNorm = 0;
    let differenceSquaredNorm = 0;
    let maximumAbsoluteDifference = 0;
    for (let column = 0; column < promotedContext.dimension; column += 1) {
      plus.set(initialGuess);
      minus.set(initialGuess);
      const halfStep = column
          < NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length
        ? 1e-5 * Math.max(1, Math.abs(initialGuess[column]!))
        : column < promotedContext.dimension - 2
          ? 1e-3 * Math.max(1, Math.abs(initialGuess[column]!))
          : 1e-5;
      plus[column] += halfStep;
      minus[column] -= halfStep;
      promotedContext.evaluateResidual(plus, plusResidual);
      promotedContext.evaluateResidual(minus, minusResidual);
      for (let row = 0; row < promotedContext.dimension; row += 1) {
        const finiteDifference =
          (plusResidual[row]! - minusResidual[row]!) / (2 * halfStep);
        const analytic = analyticVolumeJacobian[
          row * promotedContext.dimension + column
        ]!;
        const difference = analytic - finiteDifference;
        finiteDifferenceSquaredNorm += finiteDifference * finiteDifference;
        differenceSquaredNorm += difference * difference;
        maximumAbsoluteDifference = Math.max(
          maximumAbsoluteDifference,
          Math.abs(difference),
        );
      }
    }
    expect(maximumAbsoluteDifference).toBeLessThan(2e-6);
    expect(Math.sqrt(
      differenceSquaredNorm / finiteDifferenceSquaredNorm,
    )).toBeLessThan(2e-5);
    const promoted = solveMainWireFiveWallPromotedMechanicsNewtonShadowV1(
      promotedContext,
      { initialGuess },
    );
    const finiteDifferenceOnly =
      solveMainWireFiveWallPromotedMechanicsNewtonShadowV1(
        promotedContext,
        { initialGuess, jacobianMode: "central-difference" },
      );
    const promotedFromContext =
      solveMainWireFiveWallPromotedMechanicsNewtonShadowV1(promotedContext);

    expect(promoted.result.status).toBe("converged");
    expect(finiteDifferenceOnly.result.status).toBe("converged");
    expect(promotedFromContext.result.status).toBe("converged");
    if (promoted.result.status !== "converged") {
      throw new Error(promoted.result.message);
    }
    if (promotedFromContext.result.status !== "converged") {
      throw new Error(promotedFromContext.result.message);
    }
    if (finiteDifferenceOnly.result.status !== "converged") {
      throw new Error(finiteDifferenceOnly.result.message);
    }
    expect(promoted.jacobianResidualEvaluationCount).toBe(
      0,
    );
    expect(promoted.analyticJacobianAssemblyCount).toBe(
      promoted.result.jacobianEvaluationCount,
    );
    expect(finiteDifferenceOnly.jacobianResidualEvaluationCount).toBe(
      2 * promotedContext.dimension
        * finiteDifferenceOnly.result.jacobianEvaluationCount,
    );
    expect(finiteDifferenceOnly.analyticJacobianAssemblyCount).toBe(0);
    expect(Math.abs(promoted.dependentSvContinuityResidualMl!))
      .toBeLessThan(1e-8);
    for (let index = 0; index < condensedSolution.length; index += 1) {
      expect(promoted.result.solution[index]).toBeCloseTo(
        condensedSolution[index]!,
        7,
      );
    }
    for (let index = 0; index < promoted.result.solution.length; index += 1) {
      expect(promoted.result.solution[index]).toBeCloseTo(
        finiteDifferenceOnly.result.solution[index]!,
        8,
      );
    }
    for (let index = 0; index < promoted.result.solution.length; index += 1) {
      expect(promotedFromContext.result.solution[index]).toBeCloseTo(
        promoted.result.solution[index]!,
        8,
      );
    }

    const chamberVolumes = Object.freeze(Object.fromEntries(
      (["LA", "LV", "RA", "RV"] as const).map((chamber) => {
        const index = NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.indexOf(chamber);
        if (index < 0) throw new Error(`${chamber} is not independent`);
        return [chamber, condensedSolution[index]!];
      }),
    )) as Readonly<{ LA: number; LV: number; RA: number; RV: number }>;
    const numericalStep = tryPrepareMainWireFiveWallNumericalMechanicsStepV1(
      provider,
      Object.freeze({
        previousAcceptedMaterialState:
          cold.acceptedState.mechanics.materialState,
        candidateTimeSec: stepInput.dtSec,
        stepDtSec: stepInput.dtSec,
        drivingInputs: Object.freeze({
          freeCalciumUMByWall: evaluateFiveWallNormalCalciumDriveV1(
            stepInput.dtSec,
            FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
          ).freeCalciumUMByWall,
        }),
      }),
    );
    expect(numericalStep).not.toBeNull();
    const locallyCondensedMechanics =
      evaluateMainWireFiveWallNumericalMechanicsCandidateV1(
        numericalStep!,
        chamberVolumes,
      );
    expect(promoted.result.solution[30]).toBeCloseTo(
      locallyCondensedMechanics.scaledInternalCoordinates[0],
      8,
    );
    expect(promoted.result.solution[31]).toBeCloseTo(
      locallyCondensedMechanics.scaledInternalCoordinates[1],
      8,
    );
    const residual = new Float64Array(32);
    promotedContext.evaluateResidual(promoted.result.solution, residual);
    expect(Math.abs(residual[30]!)).toBeLessThanOrEqual(
      promotedContext.mechanicsResidualInfinityToleranceByOneJ,
    );
    expect(Math.abs(residual[31]!)).toBeLessThanOrEqual(
      promotedContext.mechanicsResidualInfinityToleranceByOneJ,
    );
  }, 60_000);

  it("tracks the analytic 30-row root across the six-case one-second corpus", () => {
    const condensedOptions = Object.freeze({
      maximumAcceptedStepsPerJacobian: 2,
      analyticJacobianPolicy: "require-complete" as const,
    });

    for (const corpusCase of MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1) {
      const fixture =
        createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
          corpusCase.hemodynamicResearchInputs,
          corpusCase.ventricularContractilityScale,
        );
      const initial = mainWireFiveWallCoronaryBaseStateV2(
        fixture.cold.acceptedState.coronary,
      );
      const stepInput = Object.freeze({
        ...fixture.coronaryStepInput,
        dtSec: 0.002,
      });
      const authority = new MainWireFlatCoupledAcceptedStateV1(initial);
      const condensedWorkspace =
        createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
      const promotedWorkspace =
        createMainWireFiveWallPromotedMechanicsNewtonShadowWorkspaceV1();
      let maximumVolumeRootDifferenceMl = 0;
      let promotedResidualEvaluations = 0;
      let analyticJacobianShadowCount = 0;

      for (let stepIndex = 0; stepIndex < 500; stepIndex += 1) {
        const previous = authority.materializeAcceptedObjectBridge(
          fixture.provider,
        );
        const condensedContext = prepareMainWireFiveWallCoupledResidualContextV1(
          fixture.provider,
          previous,
          stepInput,
        );
        const promotedContext =
          prepareMainWireFiveWallPromotedMechanicsResidualContextV1(
            fixture.provider,
            previous,
            stepInput,
          );
        const condensed = solveMainWireFiveWallCoupledNewtonShadowV1(
          condensedContext,
          condensedOptions,
          condensedWorkspace,
        );
        if (condensed.result.status !== "converged") {
          throw new Error(
            `${corpusCase.caseId} condensed solve failed at step ${stepIndex}: `
              + condensed.result.message,
          );
        }
        const condensedSolution = condensed.result.solution;
        const promotedInitialGuess = promotedContext.initialUnknowns.slice();
        promotedInitialGuess.set(condensedSolution, 0);
        const chamberVolumes = Object.freeze(Object.fromEntries(
          (["LA", "LV", "RA", "RV"] as const).map((chamber) => {
            const index = NON_CORONARY_INDEPENDENT_NODE_NAMES_V1
              .indexOf(chamber);
            if (index < 0) throw new Error(`${chamber} is not independent`);
            return [chamber, condensedSolution[index]!];
          }),
        )) as Readonly<{ LA: number; LV: number; RA: number; RV: number }>;
        const numericalStep = tryPrepareMainWireFiveWallNumericalMechanicsStepV1(
          fixture.provider,
          Object.freeze({
            previousAcceptedMaterialState: previous.mechanics.materialState,
            candidateTimeSec: previous.acceptedTimeSec + stepInput.dtSec,
            stepDtSec: stepInput.dtSec,
            drivingInputs: Object.freeze({
              freeCalciumUMByWall: evaluateFiveWallNormalCalciumDriveV1(
                previous.acceptedTimeSec + stepInput.dtSec,
                stepInput.calciumDriveParams,
              ).freeCalciumUMByWall,
            }),
          }),
        );
        if (numericalStep === null) {
          throw new Error("corpus provider lost its numerical mechanics seam");
        }
        const localMechanics =
          evaluateMainWireFiveWallNumericalMechanicsCandidateV1(
            numericalStep,
            chamberVolumes,
          );
        promotedInitialGuess.set(
          localMechanics.scaledInternalCoordinates,
          condensedContext.dimension,
        );
        if (corpusCase.caseId === "baseline" && stepIndex === 18) {
          const eventSeed = promotedContext.initialUnknowns.slice();
          const eventChamberVolumes = Object.freeze(Object.fromEntries(
            (["LA", "LV", "RA", "RV"] as const).map((chamber) => {
              const index = NON_CORONARY_INDEPENDENT_NODE_NAMES_V1
                .indexOf(chamber);
              if (index < 0) throw new Error(`${chamber} is not independent`);
              return [chamber, eventSeed[index]!];
            }),
          )) as Readonly<{ LA: number; LV: number; RA: number; RV: number }>;
          eventSeed.set(
            evaluateMainWireFiveWallNumericalMechanicsCandidateV1(
              numericalStep,
              eventChamberVolumes,
            ).scaledInternalCoordinates,
            30,
          );
          const full = new Float64Array(32 * 32);
          promotedContext.writeAnalyticJacobian(eventSeed, full);
          const condensedFd = new Float64Array(30 * 30);
          const plus = eventSeed.slice(0, 30);
          const minus = eventSeed.slice(0, 30);
          const plusResidual = new Float64Array(30);
          const minusResidual = new Float64Array(30);
          for (let column = 0; column < 30; column += 1) {
            plus.set(eventSeed.subarray(0, 30));
            minus.set(eventSeed.subarray(0, 30));
            const halfStep = column < 14
              ? 1e-5 * Math.max(1, Math.abs(eventSeed[column]!))
              : 1e-3 * Math.max(1, Math.abs(eventSeed[column]!));
            plus[column] += halfStep;
            minus[column] -= halfStep;
            condensedContext.evaluateResidualMl(plus, plusResidual);
            condensedContext.evaluateResidualMl(minus, minusResidual);
            for (let row = 0; row < 30; row += 1) {
              condensedFd[row * 30 + column] =
                (plusResidual[row]! - minusResidual[row]!) / (2 * halfStep);
            }
          }
          const d00 = full[30 * 32 + 30]!;
          const d01 = full[30 * 32 + 31]!;
          const d10 = full[31 * 32 + 30]!;
          const d11 = full[31 * 32 + 31]!;
          const determinant = d00 * d11 - d01 * d10;
          expect(Math.abs(determinant)).toBeGreaterThan(1e-8);
          let maximumSchurDifference = 0;
          for (let row = 0; row < 30; row += 1) {
            const b0 = full[row * 32 + 30]!;
            const b1 = full[row * 32 + 31]!;
            for (let column = 0; column < 30; column += 1) {
              const c0 = full[30 * 32 + column]!;
              const c1 = full[31 * 32 + column]!;
              const eliminated = (
                b0 * (d11 * c0 - d01 * c1)
                + b1 * (-d10 * c0 + d00 * c1)
              ) / determinant;
              maximumSchurDifference = Math.max(
                maximumSchurDifference,
                Math.abs(
                  full[row * 32 + column]!
                    - eliminated
                    - condensedFd[row * 30 + column]!,
                ),
              );
            }
          }
          expect(maximumSchurDifference).toBeLessThan(2e-6);

          const armijoAtValveTransition =
            solveMainWireFiveWallPromotedMechanicsNewtonShadowV1(
              promotedContext,
              Object.freeze({ initialGuess: eventSeed }),
              promotedWorkspace,
            );
          expect(armijoAtValveTransition.result.status).toBe("failed");
          if (armijoAtValveTransition.result.status !== "failed") {
            throw new Error(
              "baseline valve-transition Armijo oracle unexpectedly converged",
            );
          }
          expect(armijoAtValveTransition.result.reason).toBe("line-search");

          const doglegAtValveTransition =
            solveMainWireFiveWallPromotedMechanicsNewtonShadowV1(
              promotedContext,
              Object.freeze({
                initialGuess: eventSeed,
                globalization: "scaled-powell-dogleg",
              }),
              promotedWorkspace,
            );
          expect(doglegAtValveTransition.globalizationId).toBe(
            "flat-coupled-scaled-powell-dogleg-v1",
          );
          if (doglegAtValveTransition.result.status !== "converged") {
            throw new Error(doglegAtValveTransition.result.message);
          }
          expect(doglegAtValveTransition.result.status).toBe("converged");
          expect(doglegAtValveTransition.result.iterations)
            .toBeLessThanOrEqual(32);
          expect(doglegAtValveTransition.rejectedTrustRegionTrialCount)
            .toBeGreaterThan(0);
          for (let index = 0; index < 30; index += 1) {
            expect(doglegAtValveTransition.result.solution[index])
              .toBeCloseTo(condensedSolution[index]!, 7);
          }
          expect(doglegAtValveTransition.result.solution[30])
            .toBeCloseTo(localMechanics.scaledInternalCoordinates[0], 7);
          expect(doglegAtValveTransition.result.solution[31])
            .toBeCloseTo(localMechanics.scaledInternalCoordinates[1], 7);
        }
        if (stepIndex % 125 === 0) {
          const analyticJacobian = new Float64Array(32 * 32);
          promotedContext.writeAnalyticJacobian(
            promotedInitialGuess,
            analyticJacobian,
          );
          const plus = promotedInitialGuess.slice();
          const minus = promotedInitialGuess.slice();
          const plusResidual = new Float64Array(32);
          const minusResidual = new Float64Array(32);
          let squaredDifference = 0;
          let squaredReference = 0;
          let maximumAbsoluteDifference = 0;
          for (const column of [0, 3, 14, 29, 30, 31]) {
            plus.set(promotedInitialGuess);
            minus.set(promotedInitialGuess);
            const halfStep = column < 14
              ? 1e-5 * Math.max(1, Math.abs(promotedInitialGuess[column]!))
              : column < 30
                ? 1e-3 * Math.max(1, Math.abs(promotedInitialGuess[column]!))
                : 1e-5;
            plus[column] += halfStep;
            minus[column] -= halfStep;
            promotedContext.evaluateResidual(plus, plusResidual);
            promotedContext.evaluateResidual(minus, minusResidual);
            for (let row = 0; row < 32; row += 1) {
              const reference =
                (plusResidual[row]! - minusResidual[row]!) / (2 * halfStep);
              const difference = analyticJacobian[row * 32 + column]!
                - reference;
              maximumAbsoluteDifference = Math.max(
                maximumAbsoluteDifference,
                Math.abs(difference),
              );
              squaredDifference += difference * difference;
              squaredReference += reference * reference;
            }
          }
          expect(maximumAbsoluteDifference).toBeLessThan(2e-6);
          expect(Math.sqrt(squaredDifference / squaredReference))
            .toBeLessThan(2e-5);
          analyticJacobianShadowCount += 1;
        }
        const promoted = solveMainWireFiveWallPromotedMechanicsNewtonShadowV1(
          promotedContext,
          Object.freeze({ initialGuess: promotedInitialGuess }),
          promotedWorkspace,
        );
        if (
          promoted.result.status !== "converged"
        ) {
          const seedResidual = new Float64Array(promotedContext.dimension);
          promotedContext.evaluateResidual(
            promotedInitialGuess,
            seedResidual,
          );
          throw new Error(
            `${corpusCase.caseId} promoted solve failed at step ${stepIndex}: `
              + `${promoted.result.message}; seedVolume=${Math.max(
                ...Array.from(seedResidual.slice(0, 30), Math.abs),
              )}; seedMechanics=${Math.max(
                Math.abs(seedResidual[30]!),
                Math.abs(seedResidual[31]!),
              )}`,
          );
        }
        expect(promoted.jacobianResidualEvaluationCount).toBe(0);
        expect(promoted.analyticJacobianAssemblyCount).toBe(
          promoted.result.jacobianEvaluationCount,
        );
        expect(Math.abs(promoted.dependentSvContinuityResidualMl!))
          .toBeLessThan(1e-8);
        promotedResidualEvaluations +=
          promoted.result.residualEvaluationCount;
        for (let index = 0; index < condensedContext.dimension; index += 1) {
          const difference = Math.abs(
            promoted.result.solution[index]!
              - condensedSolution[index]!,
          );
          maximumVolumeRootDifferenceMl = Math.max(
            maximumVolumeRootDifferenceMl,
            difference,
          );
          expect(promoted.result.solution[index]).toBeCloseTo(
            condensedSolution[index]!,
            7,
          );
        }
        authority.stageConvergedSolution(
          condensedContext,
          condensedSolution,
        );
        authority.promote();
      }

      expect(maximumVolumeRootDifferenceMl).toBeLessThan(1e-6);
      expect(analyticJacobianShadowCount).toBe(4);
      expect(promotedResidualEvaluations).toBeGreaterThan(0);
    }
  }, 60_000);

  it("promotes one admitted 30-row root by swapping a fixed flat image", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const stepInput = Object.freeze({
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const context = prepareMainWireFiveWallCoupledResidualContextV1(
      provider,
      cold.acceptedState,
      stepInput,
    );
    const coupled = solveMainWireFiveWallCoupledNewtonShadowV1(
      context,
      { maximumAcceptedStepsPerJacobian: 2 },
    );
    expect(coupled.result.status).toBe("converged");
    if (coupled.result.status !== "converged") {
      throw new Error(coupled.result.message);
    }
    const converged = coupled.result;

    const authority = new MainWireFlatCoupledAcceptedStateV1(
      cold.acceptedState,
    );
    const before = authority.snapshot();
    authority.stageConvergedSolution(context, converged.solution);
    const objectAuthority = context.finalizeConvergedSolution(
      converged.solution,
      Object.freeze({
        iterations: converged.iterations,
        lineSearchBacktracks: converged.lineSearchBacktrackCount,
      }),
    );
    expect(objectAuthority.converged).toBe(true);
    if (objectAuthority.converged === false) {
      throw new Error(objectAuthority.message);
    }

    expect(authority.report()).toEqual({
      authorityId: "main-wire-flat-coupled-accepted-state-v1",
      fixedBufferCount: 2,
      slotCount: 100,
      byteLengthPerBuffer: 100 * Float64Array.BYTES_PER_ELEMENT,
      activeBufferIndex: 0,
      commitCount: 0,
      staged: true,
    });
    expect(authority.snapshot()).toEqual(before);

    authority.promote();
    const accepted = authority.snapshot();
    expect(accepted.acceptedTimeSec).toBe(0.002);
    expect(accepted.revision).toBe(1);
    expect(accepted.fixedGlobalTotalBloodVolumeMl).toBe(5600);
    NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.forEach((nodeId) => {
      const nodeIndex = NON_CORONARY_NODE_NAMES_V1.indexOf(nodeId);
      expect(accepted.nonCoronaryNodeVolumesMl[nodeIndex]).toBe(
        objectAuthority.acceptedState.circulation.nodeVolumesMl[nodeId],
      );
    });
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.forEach((nodeId, index) => {
      expect(accepted.coronaryConservedVolumesMl[index]).toBe(
        objectAuthority.acceptedState.coronary.volumeMlByNode[nodeId],
      );
    });
    expect(Array.from(accepted.dynamicEdgeFlowsMlPerSec)).toEqual(
      NON_CORONARY_DYNAMIC_EDGE_NAMES_V1.map(
        (edgeId) => objectAuthority.acceptedState.circulation
          .dynamicEdgeFlowsMlPerSec[edgeId],
      ),
    );
    expect(Array.from(accepted.valveOpeningFractions01)).toEqual(
      NON_CORONARY_VALVE_NAMES_V1.map(
        (valveId) => objectAuthority.acceptedState.circulation
          .valveStates[valveId].leafletOpeningFraction01,
      ),
    );
    expect(accepted.coronaryToneResistanceScaleByTerritoryLayer).toEqual(
      objectAuthority.acceptedState.coronary
        .toneResistanceScaleByTerritoryLayer,
    );
    expect(accepted.mechanicsMaterialState).toEqual(
      objectAuthority.acceptedState.mechanics.materialState,
    );
    expect(accepted.mvcReferenceState).toEqual(
      objectAuthority.acceptedState.mvcReferenceState,
    );
    const unknowns = new Float64Array(30);
    authority.readCurrentUnknownsInto(unknowns);
    expect(Array.from(unknowns)).toEqual([
      ...NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.map(
        (nodeId) => objectAuthority.acceptedState.circulation
          .nodeVolumesMl[nodeId],
      ),
      ...CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map(
        (nodeId) => objectAuthority.acceptedState.coronary
          .volumeMlByNode[nodeId],
      ),
    ]);
    expect(authority.report()).toMatchObject({
      activeBufferIndex: 1,
      commitCount: 1,
      staged: false,
    });
    expect(() => authority.stageConvergedSolution(
      context,
      converged.solution,
    )).toThrow(/context differs from accepted authority/);
  }, 60_000);

  it("uses only admitted sequential roots to predict the next coupled solve", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const stepInput = Object.freeze({
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const authority = new MainWireFlatCoupledAcceptedStateV1(
      cold.acceptedState,
    );
    const predictor = createMainWireFiveWallCoupledPredictorWorkspaceV1();
    const predictedSolver =
      createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
    const baselineSolver =
      createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
    const options = Object.freeze({
      maximumAcceptedStepsPerJacobian: 2,
      analyticJacobianPolicy: "require-complete" as const,
    });
    let predictedJacobianEvaluations = 0;
    let baselineJacobianEvaluations = 0;
    let fallbackCount = 0;
    let contextPredictionCount = 0;
    let linearPredictionCount = 0;
    let quadraticPredictionCount = 0;

    for (let stepIndex = 0; stepIndex < 200; stepIndex += 1) {
      const previous = authority.materializeAcceptedObjectBridge(provider);
      const context = prepareMainWireFiveWallCoupledResidualContextV1(
        provider,
        previous,
        stepInput,
      );
      const predicted = solveMainWireFiveWallCoupledNewtonPredictedV1(
        context,
        options,
        predictedSolver,
        predictor,
        "quadratic",
      );
      const baseline = solveMainWireFiveWallCoupledNewtonShadowV1(
        context,
        options,
        baselineSolver,
      );
      expect(predicted.solver.result.status).toBe("converged");
      expect(baseline.result.status).toBe("converged");
      if (
        predicted.solver.result.status !== "converged"
        || baseline.result.status !== "converged"
      ) throw new Error(`coupled predictor failed at step ${stepIndex}`);
      fallbackCount += predicted.fallbackUsed ? 1 : 0;
      contextPredictionCount += predicted.predictionMode === "context" ? 1 : 0;
      linearPredictionCount += predicted.predictionMode
        === "linear-extrapolation" ? 1 : 0;
      quadraticPredictionCount += predicted.predictionMode
        === "quadratic-extrapolation" ? 1 : 0;
      predictedJacobianEvaluations +=
        predicted.solver.result.jacobianEvaluationCount;
      baselineJacobianEvaluations += baseline.result.jacobianEvaluationCount;
      for (let index = 0; index < context.dimension; index += 1) {
        expect(predicted.solver.result.solution[index]).toBeCloseTo(
          baseline.result.solution[index]!,
          7,
        );
      }
      authority.stageConvergedSolution(
        context,
        predicted.solver.result.solution,
      );
      authority.promote();
      recordAcceptedMainWireFiveWallCoupledSolutionV1(
        context,
        predicted.solver.result.solution,
        predictor,
      );
    }

    const report = reportMainWireFiveWallCoupledPredictorV1(predictor);
    expect(report.predictionCount).toBe(199);
    expect(report.contextFallbackCount).toBe(1);
    expect(fallbackCount).toBe(0);
    expect(contextPredictionCount).toBe(1);
    expect(linearPredictionCount).toBe(1);
    expect(quadraticPredictionCount).toBe(198);
    expect(report.historyDepth).toBe(3);
    expect(predictedJacobianEvaluations).toBeLessThan(
      baselineJacobianEvaluations,
    );

    const discontinuousContext = prepareMainWireFiveWallCoupledResidualContextV1(
      provider,
      cold.acceptedState,
      stepInput,
    );
    expect(prepareMainWireFiveWallCoupledPredictionV1(
      discontinuousContext,
      predictor,
    ).mode).toBe("context");
    expect(reportMainWireFiveWallCoupledPredictorV1(predictor)).toMatchObject({
      hasAcceptedPair: false,
      contextFallbackCount: 2,
      resetCount: 1,
    });
  }, 60_000);

  it("restores exact predictor history and rejects mismatched or accessor checkpoints", () => {
    const acceptedUnknowns = new Float64Array(30).fill(1);
    const checkpoint = Object.freeze({
      checkpointId:
        "circleheart-main-wire-five-wall-coupled-predictor-checkpoint-v1" as const,
      schemaVersion: 1 as const,
      historyDepth: 2 as const,
      expectedBaseRevision: 7,
      expectedBaseAcceptedTimeSec: 0.014,
      olderAcceptedMl: Object.freeze(new Array<number>(30).fill(0)),
      previousAcceptedMl: Object.freeze(new Array<number>(30).fill(0.9)),
      currentAcceptedMl: Object.freeze(new Array<number>(30).fill(1)),
    });
    const accepted = Object.freeze({
      revision: 7,
      acceptedTimeSec: 0.014,
      unknownsMl: acceptedUnknowns,
    });
    const workspace = createMainWireFiveWallCoupledPredictorWorkspaceV1();
    restoreMainWireFiveWallCoupledPredictorV1(
      checkpoint,
      accepted,
      workspace,
    );
    expect(reportMainWireFiveWallCoupledPredictorV1(workspace)).toMatchObject({
      hasAcceptedPair: true,
      historyDepth: 2,
      expectedBaseRevision: 7,
      expectedBaseAcceptedTimeSec: 0.014,
    });
    expect(checkpointMainWireFiveWallCoupledPredictorV1(workspace))
      .toEqual(checkpoint);
    resetMainWireFiveWallCoupledPredictorV1(workspace);
    expect(checkpointMainWireFiveWallCoupledPredictorV1(workspace))
      .toMatchObject({
        historyDepth: 0,
        expectedBaseRevision: null,
        expectedBaseAcceptedTimeSec: null,
        olderAcceptedMl: new Array<number>(30).fill(0),
        previousAcceptedMl: new Array<number>(30).fill(0),
        currentAcceptedMl: new Array<number>(30).fill(0),
      });

    const mismatchedCurrent = new Array<number>(30).fill(1);
    mismatchedCurrent[0] += 1e-6;
    expect(() => restoreMainWireFiveWallCoupledPredictorV1(
      Object.freeze({
        ...checkpoint,
        currentAcceptedMl: Object.freeze(mismatchedCurrent),
      }),
      accepted,
      createMainWireFiveWallCoupledPredictorWorkspaceV1(),
    )).toThrow(/root differs/);

    let getterCalls = 0;
    const accessorCheckpoint = { ...checkpoint } as Record<string, unknown>;
    Object.defineProperty(accessorCheckpoint, "currentAcceptedMl", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return checkpoint.currentAcceptedMl;
      },
    });
    expect(() => restoreMainWireFiveWallCoupledPredictorV1(
      Object.freeze(accessorCheckpoint),
      accepted,
      createMainWireFiveWallCoupledPredictorWorkspaceV1(),
    )).toThrow(/must be a data field/);
    expect(getterCalls).toBe(0);
  });

  it("reduces residual work without changing the admitted root branch across the six-case corpus", () => {
    const options = Object.freeze({
      maximumAcceptedStepsPerJacobian: 2,
      analyticJacobianPolicy: "require-complete" as const,
    });

    for (const corpusCase of MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1) {
      const fixture =
        createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
          corpusCase.hemodynamicResearchInputs,
          corpusCase.ventricularContractilityScale,
        );
      const initial = mainWireFiveWallCoronaryBaseStateV2(
        fixture.cold.acceptedState.coronary,
      );
      const stepInput = Object.freeze({
        ...fixture.coronaryStepInput,
        dtSec: 0.002,
      });
      const linearAuthority = new MainWireFlatCoupledAcceptedStateV1(initial);
      const quadraticAuthority =
        new MainWireFlatCoupledAcceptedStateV1(initial);
      const linearSolver =
        createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
      const quadraticSolver =
        createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
      const linearPredictor =
        createMainWireFiveWallCoupledPredictorWorkspaceV1();
      const quadraticPredictor =
        createMainWireFiveWallCoupledPredictorWorkspaceV1();
      let linearResidualEvaluations = 0;
      let quadraticResidualEvaluations = 0;
      let maximumRootDifferenceMl = 0;

      for (let stepIndex = 0; stepIndex < 500; stepIndex += 1) {
        const linearPrevious = linearAuthority
          .materializeAcceptedObjectBridge(fixture.provider);
        const quadraticPrevious = quadraticAuthority
          .materializeAcceptedObjectBridge(fixture.provider);
        const linearContext = prepareMainWireFiveWallCoupledResidualContextV1(
          fixture.provider,
          linearPrevious,
          stepInput,
        );
        const quadraticContext =
          prepareMainWireFiveWallCoupledResidualContextV1(
            fixture.provider,
            quadraticPrevious,
            stepInput,
          );
        const linear = solveMainWireFiveWallCoupledNewtonPredictedV1(
          linearContext,
          options,
          linearSolver,
          linearPredictor,
          "linear",
        );
        const quadratic = solveMainWireFiveWallCoupledNewtonPredictedV1(
          quadraticContext,
          options,
          quadraticSolver,
          quadraticPredictor,
          "quadratic",
        );
        expect(linear.solver.result.status).toBe("converged");
        expect(quadratic.solver.result.status).toBe("converged");
        if (
          linear.solver.result.status !== "converged"
          || quadratic.solver.result.status !== "converged"
        ) {
          throw new Error(`${corpusCase.caseId} predictor solve failed`);
        }
        linearResidualEvaluations +=
          linear.solver.result.residualEvaluationCount;
        quadraticResidualEvaluations +=
          quadratic.solver.result.residualEvaluationCount;
        for (let index = 0; index < linearContext.dimension; index += 1) {
          maximumRootDifferenceMl = Math.max(
            maximumRootDifferenceMl,
            Math.abs(
              linear.solver.result.solution[index]!
                - quadratic.solver.result.solution[index]!,
            ),
          );
        }
        linearAuthority.stageConvergedSolution(
          linearContext,
          linear.solver.result.solution,
        );
        quadraticAuthority.stageConvergedSolution(
          quadraticContext,
          quadratic.solver.result.solution,
        );
        linearAuthority.promote();
        quadraticAuthority.promote();
        recordAcceptedMainWireFiveWallCoupledSolutionV1(
          linearContext,
          linear.solver.result.solution,
          linearPredictor,
        );
        recordAcceptedMainWireFiveWallCoupledSolutionV1(
          quadraticContext,
          quadratic.solver.result.solution,
          quadraticPredictor,
        );
      }

      expect(maximumRootDifferenceMl).toBeLessThan(1e-5);
      expect(quadraticResidualEvaluations).toBeLessThan(
        linearResidualEvaluations,
      );
      expect(reportMainWireFiveWallCoupledPredictorV1(quadraticPredictor))
        .toMatchObject({
          historyDepth: 3,
          resetCount: 0,
        });
    }
  }, 60_000);

  it("keeps accepted flat bytes unchanged across rejection and abort", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const stepInput = Object.freeze({
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const context = prepareMainWireFiveWallCoupledResidualContextV1(
      provider,
      cold.acceptedState,
      stepInput,
    );
    const coupled = solveMainWireFiveWallCoupledNewtonShadowV1(
      context,
      { maximumAcceptedStepsPerJacobian: 2 },
    );
    expect(coupled.result.status).toBe("converged");
    if (coupled.result.status !== "converged") {
      throw new Error(coupled.result.message);
    }

    const authority = new MainWireFlatCoupledAcceptedStateV1(
      cold.acceptedState,
    );
    const before = authority.snapshot();
    const invalid = coupled.result.solution.slice();
    invalid[7] = Number.NaN;
    expect(() => authority.stageConvergedSolution(context, invalid))
      .toThrow(/outside its admitted domain/);
    expect(authority.snapshot()).toEqual(before);
    expect(authority.report()).toMatchObject({ commitCount: 0, staged: false });

    authority.stageConvergedSolution(context, coupled.result.solution);
    authority.abort();
    expect(authority.snapshot()).toEqual(before);
    expect(authority.report()).toMatchObject({ commitCount: 0, staged: false });
    expect(() => authority.promote()).toThrow(/no staged candidate/);
  }, 60_000);

  it("materializes the coupled solution through the canonical trial gates without retaining solver or probe scratch", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const stepInput = Object.freeze({
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const context = prepareMainWireFiveWallCoupledResidualContextV1(
      provider,
      cold.acceptedState,
      stepInput,
    );
    const coupled = solveMainWireFiveWallCoupledNewtonShadowV1(context);
    expect(coupled.result.status).toBe("converged");
    if (coupled.result.status !== "converged") {
      throw new Error(coupled.result.message);
    }
    const solution = coupled.result.solution.slice();

    const residualA = new Float64Array(context.dimension);
    const residualB = new Float64Array(context.dimension);
    const residualARepeated = new Float64Array(context.dimension);
    context.evaluateResidualMl(solution, residualA);
    const perturbed = solution.slice();
    perturbed[0] += 1e-4;
    context.evaluateResidualMl(perturbed, residualB);
    context.evaluateResidualMl(solution, residualARepeated);
    expect(Array.from(residualARepeated)).toEqual(Array.from(residualA));
    expect(Array.from(residualB)).not.toEqual(Array.from(residualA));

    const materialized = context.materializeCandidateTrial(
      solution,
      Object.freeze({
        iterations: coupled.result.iterations,
        lineSearchBacktracks: coupled.result.lineSearchBacktrackCount,
      }),
    );
    const detachedSnapshot = structuredClone(materialized);

    NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.forEach((nodeId, index) => {
      expect(materialized.circulationTrial.candidateNodeVolumesMl[nodeId])
        .toBeCloseTo(solution[index]!, 12);
    });
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.forEach((nodeId, index) => {
      expect(materialized.coronaryTrial.candidateAcceptedState
        .volumeMlByNode[nodeId]).toBeCloseTo(
          solution[NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length + index]!,
          12,
        );
    });
    expect(materialized.circulationTrial.diagnostics.iterations)
      .toBe(coupled.result.iterations);
    expect(materialized.coronaryTrial.diagnostics.newtonIterations).toBe(0);
    expect(materialized.coronaryTrial.diagnostics.totalLineSearchBacktracks)
      .toBe(0);
    expect(materialized.circulationTrial.diagnostics.totalBloodVolumeErrorMl)
      .toBeCloseTo(0, 9);
    expect(materialized.coronaryTrial.diagnostics
      .exactBloodVolumeLedgerResidualMl).toBeCloseTo(0, 9);

    solution.fill(1);
    context.evaluateResidualMl(perturbed, residualB);
    expect(materialized).toEqual(detachedSnapshot);
  }, 60_000);

  it("promotes one coupled solution through the same atomic finalizer as the nested solver", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const stepInput = Object.freeze({
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
      evaluationCounterCollection: "enabled" as const,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const legacy = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      stepInput,
    );
    const context = prepareMainWireFiveWallCoupledResidualContextV1(
      provider,
      cold.acceptedState,
      stepInput,
    );
    const coupled = solveMainWireFiveWallCoupledNewtonShadowV1(context);
    expect(coupled.result.status).toBe("converged");
    expect(legacy.converged).toBe(true);
    if (coupled.result.status !== "converged") {
      throw new Error(coupled.result.message);
    }
    if (legacy.converged === false) throw new Error(legacy.message);
    const coupledSolution = coupled.result.solution;

    const advanced = context.finalizeConvergedSolution(
      coupledSolution,
      Object.freeze({
        iterations: coupled.result.iterations,
        lineSearchBacktracks: coupled.result.lineSearchBacktrackCount,
      }),
    );
    expect(advanced.converged).toBe(true);
    if (advanced.converged === false) throw new Error(advanced.message);
    expect(advanced.acceptedState.acceptedTimeSec).toBe(
      legacy.acceptedState.acceptedTimeSec,
    );
    expect(advanced.acceptedState.revision).toBe(legacy.acceptedState.revision);
    NON_CORONARY_NODE_NAMES_V1.forEach((nodeId) => {
      expect(advanced.acceptedState.circulation.nodeVolumesMl[nodeId])
        .toBeCloseTo(
          legacy.acceptedState.circulation.nodeVolumesMl[nodeId],
          6,
        );
    });
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.forEach((nodeId) => {
      expect(advanced.acceptedState.coronary.volumeMlByNode[nodeId])
        .toBeCloseTo(
          legacy.acceptedState.coronary.volumeMlByNode[nodeId],
          6,
        );
    });
    expect(advanced.circulationTrial.diagnostics.evaluationCounters?.mechanics
      .candidateCenterEvaluationCount).toBeGreaterThan(1);
    expect(advanced.coronaryTrial.diagnostics.newtonIterations).toBe(0);
    expect(() => context.finalizeConvergedSolution(
      coupledSolution,
      Object.freeze({ iterations: 0, lineSearchBacktracks: 0 }),
    )).toThrow(/one-shot/i);
  }, 60_000);

  it("tracks the accepted nested trajectory for one full second without branch drift", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const stepInput = Object.freeze({
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const coupledWorkspace =
      createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
    const legacyCoronaryWorkspace =
      createCoronaryBackwardEulerScratchWorkspaceV2();
    const legacyNonCoronaryWorkspace =
      createNonCoronaryBackwardEulerScratchWorkspaceV1();
    let accepted = cold.acceptedState;
    let maximumAbsoluteVolumeDifferenceMl = 0;
    let maximumAbsoluteDependentSvResidualMl = 0;
    let maximumCoupledIterations = 0;

    for (let step = 0; step < 500; step += 1) {
      const context = prepareMainWireFiveWallCoupledResidualContextV1(
        provider,
        accepted,
        stepInput,
      );
      const coupled = solveMainWireFiveWallCoupledNewtonShadowV1(
        context,
        { maximumAcceptedStepsPerJacobian: 2 },
        coupledWorkspace,
      );
      const coupledResult = coupled.result;
      const legacy = stepMainWireFiveWallCoronaryV2(
        provider,
        accepted,
        stepInput,
        legacyCoronaryWorkspace,
        legacyNonCoronaryWorkspace,
      );

      expect(coupledResult.status).toBe("converged");
      expect(legacy.converged).toBe(true);
      if (coupledResult.status !== "converged") {
        throw new Error(`step ${step}: ${coupledResult.message}`);
      }
      if (legacy.converged === false) {
        throw new Error(`step ${step}: ${legacy.message}`);
      }
      maximumCoupledIterations = Math.max(
        maximumCoupledIterations,
        coupledResult.iterations,
      );
      maximumAbsoluteDependentSvResidualMl = Math.max(
        maximumAbsoluteDependentSvResidualMl,
        Math.abs(coupled.dependentSvContinuityResidualMl!),
      );
      NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.forEach((nodeId, index) => {
        maximumAbsoluteVolumeDifferenceMl = Math.max(
          maximumAbsoluteVolumeDifferenceMl,
          Math.abs(
            coupledResult.solution[index]!
              - legacy.circulationTrial.candidateNodeVolumesMl[nodeId],
          ),
        );
      });
      CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.forEach((nodeId, index) => {
        maximumAbsoluteVolumeDifferenceMl = Math.max(
          maximumAbsoluteVolumeDifferenceMl,
          Math.abs(
            coupledResult.solution[
              NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length + index
            ]! - legacy.coronaryTrial.candidateAcceptedState
              .volumeMlByNode[nodeId],
          ),
        );
      });
      accepted = legacy.acceptedState;
    }

    expect(accepted.acceptedTimeSec).toBeCloseTo(1, 12);
    expect(accepted.revision).toBe(500);
    expect(maximumCoupledIterations).toBeLessThanOrEqual(10);
    expect(maximumAbsoluteDependentSvResidualMl).toBeLessThan(1e-8);
    expect(maximumAbsoluteVolumeDifferenceMl).toBeLessThan(1e-6);
  }, 60_000);

  it("drives one second from its flat image through the cold object bridge beside the nested oracle", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const stepInput = Object.freeze({
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const coupledCold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const nestedCold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const coupledWorkspace =
      createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
    const legacyCoronaryWorkspace =
      createCoronaryBackwardEulerScratchWorkspaceV2();
    const legacyNonCoronaryWorkspace =
      createNonCoronaryBackwardEulerScratchWorkspaceV1();
    const flatAccepted = new MainWireFlatCoupledAcceptedStateV1(
      coupledCold.acceptedState,
    );
    let nestedAccepted = nestedCold.acceptedState;
    let maximumAbsoluteVolumeDifferenceMl = 0;

    for (let stepIndex = 0; stepIndex < 500; stepIndex += 1) {
      const coupledAccepted = flatAccepted.materializeAcceptedObjectBridge(
        provider,
      );
      const context = prepareMainWireFiveWallCoupledResidualContextV1(
        provider,
        coupledAccepted,
        stepInput,
      );
      const coupled = solveMainWireFiveWallCoupledNewtonShadowV1(
        context,
        { maximumAcceptedStepsPerJacobian: 2 },
        coupledWorkspace,
      );
      const nested = stepMainWireFiveWallCoronaryV2(
        provider,
        nestedAccepted,
        stepInput,
        legacyCoronaryWorkspace,
        legacyNonCoronaryWorkspace,
      );
      if (coupled.result.status !== "converged") {
        throw new Error(
          `coupled step ${stepIndex}: ${coupled.result.message}`,
        );
      }
      if (nested.converged === false) {
        throw new Error(`nested step ${stepIndex}: ${nested.message}`);
      }
      expect(coupled.result.status).toBe("converged");
      expect(nested.converged).toBe(true);
      flatAccepted.stageConvergedSolution(context, coupled.result.solution);
      flatAccepted.promote();
      const flatSnapshot = flatAccepted.snapshot();
      nestedAccepted = nested.acceptedState;
      NON_CORONARY_NODE_NAMES_V1.forEach((nodeId, nodeIndex) => {
        maximumAbsoluteVolumeDifferenceMl = Math.max(
          maximumAbsoluteVolumeDifferenceMl,
          Math.abs(
            flatSnapshot.nonCoronaryNodeVolumesMl[nodeIndex]!
              - nestedAccepted.circulation.nodeVolumesMl[nodeId],
          ),
        );
      });
      CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.forEach((nodeId, nodeIndex) => {
        maximumAbsoluteVolumeDifferenceMl = Math.max(
          maximumAbsoluteVolumeDifferenceMl,
          Math.abs(
            flatSnapshot.coronaryConservedVolumesMl[nodeIndex]!
              - nestedAccepted.coronary.volumeMlByNode[nodeId],
          ),
        );
      });
    }

    const flatTerminal = flatAccepted.snapshot();
    const bridgedTerminal = flatAccepted.materializeAcceptedObjectBridge(
      provider,
    );
    expect(flatTerminal.acceptedTimeSec).toBeCloseTo(1, 12);
    expect(flatTerminal.revision).toBe(500);
    expect(bridgedTerminal.acceptedTimeSec).toBeCloseTo(1, 12);
    expect(bridgedTerminal.revision).toBe(500);
    expect(nestedAccepted.acceptedTimeSec).toBeCloseTo(1, 12);
    expect(nestedAccepted.revision).toBe(500);
    expect(maximumAbsoluteVolumeDifferenceMl).toBeLessThan(1e-5);
  }, 60_000);

  it("matches every analytic non-coronary/coronary column against the full residual", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const stepInput = Object.freeze({
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const context = prepareMainWireFiveWallCoupledResidualContextV1(
      provider,
      cold.acceptedState,
      stepInput,
    );
    const nonCoronaryDimension =
      NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length;
    const coronaryDimension = CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length;
    const boundaryDimension =
      CORONARY_BOUNDARY_LINEARIZATION_COMPONENT_IDS_V2.length;
    const linearization = {
      residualMl: new Float64Array(coronaryDimension),
      dResidualDVolume:
        new Float64Array(coronaryDimension * coronaryDimension),
      dResidualDBoundary:
        new Float64Array(coronaryDimension * boundaryDimension),
      dTotalInletFlowDVolume: new Float64Array(coronaryDimension),
      dCommonVenousOutletFlowDVolume:
        new Float64Array(coronaryDimension),
      dTotalInletFlowDBoundary: new Float64Array(boundaryDimension),
      dCommonVenousOutletFlowDBoundary:
        new Float64Array(boundaryDimension),
    };
    const dependentSvColumn = new Float64Array(nonCoronaryDimension);
    const boundaryByNonCoronary = new Float64Array(
      boundaryDimension * nonCoronaryDimension,
    );
    const localNonCoronaryLinearization = new Float64Array(
      nonCoronaryDimension * nonCoronaryDimension,
    );
    expect(context.writeCoupledLinearizations(
      context.initialUnknownsMl,
      linearization,
      dependentSvColumn,
      localNonCoronaryLinearization,
      boundaryByNonCoronary,
    )).toBe(true);
    const plus = context.initialUnknownsMl.slice();
    const minus = context.initialUnknownsMl.slice();
    const plusResidual = new Float64Array(context.dimension);
    const minusResidual = new Float64Array(context.dimension);
    const aoRow = NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.indexOf("Ao");
    const raRow = NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.indexOf("RA");
    const dependentSvVolumeMl = cold.acceptedState
      .fixedGlobalTotalBloodVolumeMl
      - context.initialUnknownsMl.reduce((sum, volume) => sum + volume, 0);
    const graph = buildAuthoritativeCirculationGraphV1();
    const svNode = graph.nodes[graph.nodeIndex.get("SV")!]!;
    const svLaw = vascularPvLawFromNodeV1(svNode, runtime.vascular);
    const svPaired = vascularTransmuralPressureAndVolumeTangentFromLawV1(
      svLaw,
      dependentSvVolumeMl,
      "adaptive-volume-tolerance",
    );
    const svPressureHalfStepMl = 0.1;
    const svPressurePlus =
      vascularTransmuralPressureAndVolumeTangentFromLawV1(
        svLaw,
        dependentSvVolumeMl + svPressureHalfStepMl,
        "adaptive-volume-tolerance",
      ).transmuralPressureMmHg;
    const svPressureMinus =
      vascularTransmuralPressureAndVolumeTangentFromLawV1(
        svLaw,
        dependentSvVolumeMl - svPressureHalfStepMl,
        "adaptive-volume-tolerance",
      ).transmuralPressureMmHg;
    expect(svPaired.dTransmuralPressureDPhysicalVolumeMmHgPerMl).toBeCloseTo(
      (svPressurePlus - svPressureMinus) / (2 * svPressureHalfStepMl),
      7,
    );

    let maximumAbsoluteDifference = 0;
    let squaredDifference = 0;
    let squaredFiniteDifference = 0;
    for (let column = 0; column < coronaryDimension; column += 1) {
      plus.set(context.initialUnknownsMl);
      minus.set(context.initialUnknownsMl);
      const globalColumn = nonCoronaryDimension + column;
      // The venous PV primal uses adaptive bisection. A millilitre-scale
      // relative perturbation stays local while remaining well above its
      // pressure-quantization floor; the production analytic tangent itself
      // differentiates the constitutive law, not the finite bisection trace.
      const halfStep = 1e-3 * Math.max(
        1,
        Math.abs(context.initialUnknownsMl[globalColumn]!),
      );
      plus[globalColumn] += halfStep;
      minus[globalColumn] -= halfStep;
      context.evaluateResidualMl(plus, plusResidual);
      context.evaluateResidualMl(minus, minusResidual);
      for (let row = 0; row < nonCoronaryDimension; row += 1) {
        let analytic = -dependentSvColumn[row]!;
        if (row === aoRow) {
          analytic += context.stepDtSec
            * linearization.dTotalInletFlowDVolume[column]!;
        }
        if (row === raRow) {
          analytic -= context.stepDtSec
            * linearization.dCommonVenousOutletFlowDVolume[column]!;
        }
        const finiteDifference = (
          plusResidual[row]! - minusResidual[row]!
        ) / (2 * halfStep);
        const difference = Math.abs(analytic - finiteDifference);
        maximumAbsoluteDifference = Math.max(
          maximumAbsoluteDifference,
          difference,
        );
        squaredDifference += difference * difference;
        squaredFiniteDifference += finiteDifference * finiteDifference;
      }
    }
    expect(maximumAbsoluteDifference).toBeLessThan(1e-6);
    expect(Math.sqrt(squaredDifference / squaredFiniteDifference))
      .toBeLessThan(5e-6);

    let maximumBoundaryAbsoluteDifference = 0;
    let squaredBoundaryDifference = 0;
    let squaredBoundaryFiniteDifference = 0;
    for (let column = 0; column < nonCoronaryDimension; column += 1) {
      plus.set(context.initialUnknownsMl);
      minus.set(context.initialUnknownsMl);
      const halfStep = 2e-6 * Math.max(
        1,
        Math.abs(context.initialUnknownsMl[column]!),
      );
      plus[column] += halfStep;
      minus[column] -= halfStep;
      context.evaluateResidualMl(plus, plusResidual);
      context.evaluateResidualMl(minus, minusResidual);
      for (let row = 0; row < coronaryDimension; row += 1) {
        let analytic = 0;
        for (let boundary = 0; boundary < boundaryDimension; boundary += 1) {
          analytic += linearization.dResidualDBoundary[
            row * boundaryDimension + boundary
          ]! * boundaryByNonCoronary[
            boundary * nonCoronaryDimension + column
          ]!;
        }
        const finiteDifference = (
          plusResidual[nonCoronaryDimension + row]!
          - minusResidual[nonCoronaryDimension + row]!
        ) / (2 * halfStep);
        const difference = Math.abs(analytic - finiteDifference);
        maximumBoundaryAbsoluteDifference = Math.max(
          maximumBoundaryAbsoluteDifference,
          difference,
        );
        squaredBoundaryDifference += difference * difference;
        squaredBoundaryFiniteDifference +=
          finiteDifference * finiteDifference;
      }
    }
    expect(maximumBoundaryAbsoluteDifference).toBeLessThan(2e-6);
    expect(Math.sqrt(
      squaredBoundaryDifference / squaredBoundaryFiniteDifference,
    )).toBeLessThan(2e-5);

    let maximumNonCoronaryAbsoluteDifference = 0;
    let squaredNonCoronaryDifference = 0;
    let squaredNonCoronaryFiniteDifference = 0;
    for (let column = 0; column < nonCoronaryDimension; column += 1) {
      plus.set(context.initialUnknownsMl);
      minus.set(context.initialUnknownsMl);
      const halfStep = 1e-5 * Math.max(
        1,
        Math.abs(context.initialUnknownsMl[column]!),
      );
      plus[column] += halfStep;
      minus[column] -= halfStep;
      context.evaluateResidualMl(plus, plusResidual);
      context.evaluateResidualMl(minus, minusResidual);
      let inletDerivative = 0;
      let outletDerivative = 0;
      for (let boundary = 0; boundary < boundaryDimension; boundary += 1) {
        const boundaryDerivative = boundaryByNonCoronary[
          boundary * nonCoronaryDimension + column
        ]!;
        inletDerivative += linearization.dTotalInletFlowDBoundary[boundary]!
          * boundaryDerivative;
        outletDerivative +=
          linearization.dCommonVenousOutletFlowDBoundary[boundary]!
          * boundaryDerivative;
      }
      for (let row = 0; row < nonCoronaryDimension; row += 1) {
        let analytic = localNonCoronaryLinearization[
          row * nonCoronaryDimension + column
        ]!;
        if (row === aoRow) {
          analytic += context.stepDtSec * inletDerivative;
        }
        if (row === raRow) {
          analytic -= context.stepDtSec * outletDerivative;
        }
        const finiteDifference = (
          plusResidual[row]! - minusResidual[row]!
        ) / (2 * halfStep);
        const difference = Math.abs(analytic - finiteDifference);
        maximumNonCoronaryAbsoluteDifference = Math.max(
          maximumNonCoronaryAbsoluteDifference,
          difference,
        );
        squaredNonCoronaryDifference += difference * difference;
        squaredNonCoronaryFiniteDifference +=
          finiteDifference * finiteDifference;
      }
    }
    expect(maximumNonCoronaryAbsoluteDifference).toBeLessThan(2e-6);
    expect(Math.sqrt(
      squaredNonCoronaryDifference / squaredNonCoronaryFiniteDifference,
    )).toBeLessThan(2e-5);
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

  it("reassembles one real 30-row residual at the nested solver candidate", () => {
    const provider = testLandReadbackProvider(false);
    const stepInput = Object.freeze({
      dtSec: 0.001,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const stepped = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      stepInput,
    );

    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) throw new Error(stepped.message);
    const shadow = evaluateMainWireFiveWallCoupledResidualShadowV1(
      cold.acceptedState,
      stepInput,
      stepped,
    );

    expect(shadow.unknownCount).toBe(30);
    expect(shadow.residualMl).toHaveLength(30);
    expect(shadow.nonCoronaryMaximumAbsoluteResidualMl).toBeLessThan(1e-8);
    expect(shadow.coronaryMaximumAbsoluteResidualMl).toBeLessThan(1e-8);
    expect(shadow.maximumAbsoluteResidualMl).toBeLessThan(1e-8);
    expect(shadow.candidateCoronaryBoundary).toEqual(
      stepped.coronaryBoundary,
    );
  });

  it("borrows a converged 30-row candidate without public finalization", () => {
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({ ...RUNTIME.respiratory, Pth0: 0 }),
    });
    const pericardium = createMainWireNormalAdultCommonPericardiumV1();
    const stepInput = Object.freeze({
      dtSec: 0.002,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
    });
    const solved = solveMainWireFiveWallCoupledCandidateV1(
      provider,
      cold.acceptedState,
      stepInput,
    );
    expect(solved.status).toBe("converged");
    if (solved.status !== "converged") {
      throw new Error(solved.solver.result.status === "failed"
        ? solved.solver.result.message
        : "unexpected coupled solve state");
    }
    const result = solved.solver.result;
    if (result.status !== "converged") {
      throw new Error("coupled candidate result did not converge");
    }
    let firstAcceptedTimeSec = -1;
    solved.context.withConvergedCandidate(result.solution, (candidate) => {
      firstAcceptedTimeSec = candidate.candidateTimeSec;
      expect(candidate.candidateRevision).toBe(1);
      expect(candidate.acceptedNumericalReadback[0]).toBe(0.002);
    });
    expect(firstAcceptedTimeSec).toBe(0.002);

    // The borrow did not consume the one-shot public finalizer. Event/cold
    // callers can still materialize the exact legacy boundary afterward.
    const finalized = solved.context.finalizeConvergedSolution(
      result.solution,
      Object.freeze({
        iterations: result.iterations,
        lineSearchBacktracks: result.lineSearchBacktrackCount,
      }),
    );
    expect(finalized.converged).toBe(true);
    if (finalized.converged) {
      expect(finalized.acceptedState.acceptedTimeSec).toBe(0.002);
    }
  });

  it("solves the real 30-row residual without either nested Newton loop", () => {
    const provider = testLandReadbackProvider(false);
    const stepInput = Object.freeze({
      dtSec: 0.001,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const cold = initializeMainWireFiveWallCoronaryV2({
      provider,
      runtime: RUNTIME,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium: PERICARDIUM,
    });
    const context = prepareMainWireFiveWallCoupledResidualContextV1(
      provider,
      cold.acceptedState,
      stepInput,
    );
    const coupled = solveMainWireFiveWallCoupledNewtonShadowV1(context);
    const authorityAttempt = advanceMainWireFiveWallCoupledNewtonV1(context);
    const legacy = stepMainWireFiveWallCoronaryV2(
      provider,
      cold.acceptedState,
      stepInput,
    );

    const coupledResult = coupled.result;
    expect(coupledResult.status).toBe("converged");
    expect(authorityAttempt.status).toBe("solver-failed");
    if (
      authorityAttempt.status === "solver-failed"
      && authorityAttempt.solver.result.status === "failed"
    ) {
      expect(authorityAttempt.solver.result.message)
        .toMatch(/complete component-owned analytic Jacobian/i);
    }
    expect(legacy.converged).toBe(true);
    if (coupledResult.status !== "converged") {
      throw new Error(coupledResult.message);
    }
    if (legacy.converged === false) throw new Error(legacy.message);
    expect(coupledResult.residualInfinityNorm).toBeLessThan(1e-8);
    expect(coupled.dependentSvContinuityResidualMl).not.toBeNull();
    expect(Math.abs(coupled.dependentSvContinuityResidualMl!))
      .toBeLessThan(1e-8);
    expect(coupled.jacobianResidualEvaluationCount).toBeGreaterThan(0);
    expect(coupled.coronaryBoundaryAnalyticBlockAssemblyCount).toBe(0);
    expect(coupled.nonCoronaryAnalyticBlockAssemblyCount).toBe(0);
    expect(coupledResult.iterations).toBeLessThanOrEqual(8);
    NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.forEach((nodeId, index) => {
      expect(coupledResult.solution[index]).toBeCloseTo(
        legacy.circulationTrial.candidateNodeVolumesMl[nodeId],
        6,
      );
    });
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.forEach((nodeId, index) => {
      expect(coupledResult.solution[
        NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length + index
      ]).toBeCloseTo(
        legacy.coronaryTrial.candidateAcceptedState.volumeMlByNode[nodeId],
        6,
      );
    });
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
