import {
  evaluateDynamicMechanicalSupportHydraulicsV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  mainWireFiveWallCoronaryBaseStateV2,
  promoteMainWireFiveWallCoronaryBaseStepV3,
  type MainWireFiveWallCoronaryStepInputV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  prepareMainWireFiveWallCoupledResidualContextV1,
  type MainWireFiveWallCoupledAcceptedCandidateBorrowV1,
  type MainWireFiveWallCoronaryStepInputV2,
  type MainWireFiveWallCoronaryStepSuccessV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  stepMainWireIntegratedModelWithCoronaryExecutorV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepInputV3,
  type MainWireIntegratedModelStepResultV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type {
  WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  createMainWireFiveWallCoupledNewtonShadowWorkspaceV1,
  solveMainWireFiveWallCoupledNewtonShadowV1,
  type MainWireFiveWallCoupledNewtonShadowOptionsV1,
  type MainWireFiveWallCoupledNewtonShadowWorkspaceV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";

export const MAIN_WIRE_INTEGRATED_COUPLED_STEP_V1_ID =
  "main-wire-integrated-static-condensed-coupled-step-v1" as const;

export type MainWireIntegratedCoupledStepOptionsV1<TWallState> = Readonly<{
  solver?: MainWireFiveWallCoupledNewtonShadowOptionsV1;
  /**
   * Synchronous migration seam into the global inactive typed image. The
   * borrow is context-owned and must not escape this callback.
   */
  onConvergedCandidate?: (
    candidate: MainWireFiveWallCoupledAcceptedCandidateBorrowV1<TWallState>,
  ) => void;
  onAcceptedBaseStep?: (
    step: MainWireFiveWallCoronaryStepSuccessV2<TWallState>,
  ) => void;
}>;

/**
 * Device-off vertical slice for the 30-volume statically condensed solver.
 * The nonlinear candidate is component-admitted before the callback runs;
 * V3 autoregulation, rhythm, dynamic-device validation, and outer promotion
 * continue through their existing owners.
 */
export function stepMainWireIntegratedModelCoupledV1<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  input: MainWireIntegratedModelStepInputV3,
  workspace: MainWireFiveWallCoupledNewtonShadowWorkspaceV1 =
    createMainWireFiveWallCoupledNewtonShadowWorkspaceV1(),
  options: MainWireIntegratedCoupledStepOptionsV1<TWallState> =
    Object.freeze({}),
): MainWireIntegratedModelStepResultV3<TWallState> {
  return stepMainWireIntegratedModelWithCoronaryExecutorV3(
    previous,
    input,
    (coronaryPrevious, coronaryInput) => {
      assertDeviceOff(coronaryInput);
      const {
        dynamicMechanicalSupport,
        coronaryAutoregulationDrive: _autoregulationDrive,
        ...baseInput
      } = coronaryInput;
      const context = prepareMainWireFiveWallCoupledResidualContextV1(
        provider,
        mainWireFiveWallCoronaryBaseStateV2(coronaryPrevious),
        baseInput as MainWireFiveWallCoronaryStepInputV2,
      );
      const solver = solveMainWireFiveWallCoupledNewtonShadowV1(
        context,
        Object.freeze({
          ...options.solver,
          analyticJacobianPolicy: "require-complete" as const,
        }),
        workspace,
      );
      if (solver.result.status !== "converged") {
        throw new Error(
          "statically condensed coupled solve failed: "
            + `${solver.result.reason}: ${solver.result.message}`,
        );
      }
      if (options.onConvergedCandidate !== undefined) {
        context.withConvergedCandidate(
          solver.result.solution,
          options.onConvergedCandidate,
        );
      }
      const baseStep = context.finalizeConvergedSolution(
        solver.result.solution,
        Object.freeze({
          iterations: solver.result.iterations,
          lineSearchBacktracks: solver.result.lineSearchBacktrackCount,
        }),
      );
      if (baseStep.converged && options.onAcceptedBaseStep !== undefined) {
        options.onAcceptedBaseStep(baseStep);
      }
      const coronaryStep = promoteMainWireFiveWallCoronaryBaseStepV3(
        coronaryPrevious,
        coronaryInput,
        baseStep,
      );
      if (coronaryStep.converged === false) {
        return Object.freeze({ coronaryStep });
      }
      const dynamicMechanicalSupportTrial =
        evaluateDynamicMechanicalSupportHydraulicsV1(
          dynamicMechanicalSupport.config,
          dynamicMechanicalSupport.profile,
          dynamicMechanicalSupport.previousAcceptedState,
          dynamicHydraulicInput(
            coronaryStep,
            coronaryInput,
            dynamicMechanicalSupport.heartRateBpm,
          ),
        );
      return Object.freeze({
        coronaryStep,
        dynamicMechanicalSupportTrial,
      });
    },
  );
}

function assertDeviceOff(input: MainWireFiveWallCoronaryStepInputV3): void {
  const dynamic = input.dynamicMechanicalSupport;
  if (
    dynamic === undefined
    || dynamic.config.lvad.enabled
    || dynamic.config.impella.enabled
    || dynamic.config.vaEcmo.enabled
    || dynamic.config.vvEcmo.enabled
    || dynamic.config.iabp.enabled
    || input.mechanicalSupport !== undefined
    || input.protocolResistanceScaleByEdge !== undefined
  ) {
    throw new Error(
      "statically condensed integrated step supports only the device-off slice",
    );
  }
}

function dynamicHydraulicInput<TWallState>(
  step: Extract<
    ReturnType<typeof promoteMainWireFiveWallCoronaryBaseStepV3<TWallState>>,
    { converged: true }
  >,
  input: MainWireFiveWallCoronaryStepInputV3,
  heartRateBpm: number,
) {
  const candidateTimeSec = step.acceptedState.acceptedTimeSec;
  const beatPosition = candidateTimeSec * heartRateBpm / 60;
  if (!Number.isFinite(beatPosition) || heartRateBpm <= 0) {
    throw new RangeError("dynamic-device timing must be positive and finite");
  }
  const beatIndex = Math.floor(beatPosition);
  const pressure = step.baseStep.circulationTrial.nodeAbsolutePressuresMmHg;
  const volume = step.baseStep.circulationTrial.candidateNodeVolumesMl;
  return Object.freeze({
    dtSec: input.dtSec,
    timeSec: candidateTimeSec,
    cyclePhase01: beatPosition - beatIndex,
    beatIndex,
    heartRateBpm,
    nodeAbsolutePressureMmHg: Object.freeze({
      LV: pressure.LV,
      Ao: pressure.Ao,
      SA: pressure.SA,
      RA: pressure.RA,
      VC: pressure.VC,
    }),
    nodeVolumeMl: Object.freeze({
      LV: volume.LV,
      Ao: volume.Ao,
      SA: volume.SA,
      RA: volume.RA,
      VC: volume.VC,
    }),
  });
}
