import {
  createCoronaryAcceptedAutoregulationStateV3,
  createCoronaryAutoregulationWindowBindingV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  mainWireFiveWallCoronaryBaseStateV2,
  wrapMainWireFiveWallCoronaryAcceptedStateV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  forkMainWireIntegratedModelAtFixedTbvV3,
} from "@/engine/myocardium/MainWireIntegratedModelFixedTbvForkV3";
import type {
  MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  validateMainWireIntegratedModelAcceptedStateV3,
  wrapMainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  rebindWholeHeartMechanicsAcceptedStateV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  rebindAcceptedComposedRegularSinusStateV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";

export const MAIN_WIRE_INTEGRATED_MODEL_WARM_START_V3_ID =
  "main-wire-integrated-model-accepted-state-warm-start-v1" as const;

type AcceptedState = MainWireIntegratedModelAcceptedStateV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

/**
 * Adapts one accepted `(revision, t, state)` tuple to a new bounded research
 * input fixture without returning to the cold operating point.
 *
 * Vascular, resistance, and respiratory edits preserve the complete accepted
 * state. A TBV edit changes only the SV/VC reservoir volumes at the same
 * boundary. A mechanics-parameter edit rebinds the same material memory to the
 * compatible target provider. A heart-rate edit preserves the remaining sinus
 * phase and resets only the cycle-length-owned coronary measurement window at
 * that boundary.
 */
export function warmStartMainWireIntegratedModelV3(input: Readonly<{
  source: AcceptedState;
  sourceRuntime: MainWireIntegratedModelRuntimeV3;
  targetRuntime: MainWireIntegratedModelRuntimeV3;
}>): AcceptedState {
  const { source, sourceRuntime, targetRuntime } = input;
  validateMainWireIntegratedModelAcceptedStateV3(
    source,
    { configuration: sourceRuntime.rhythm.configuration },
    sourceRuntime.profile,
    sourceRuntime.config,
  );

  let adapted = source;
  const targetTbvMl =
    targetRuntime.hemodynamicResearchInputs.totalBloodVolumeMl;
  if (adapted.coronary.fixedGlobalTotalBloodVolumeMl !== targetTbvMl) {
    adapted = forkMainWireIntegratedModelAtFixedTbvV3({
      source: adapted,
      runtime: sourceRuntime,
      targetGlobalTotalBloodVolumeMl: targetTbvMl,
    });
  }

  const sourceCycleSec = sourceRuntime.cycleLengthSec;
  const targetCycleSec = targetRuntime.cycleLengthSec;
  let coronary = adapted.coronary;
  let composedRhythm = adapted.composedRhythm;
  if (
    coronary.mechanics.providerId !== targetRuntime.provider.providerId
    || coronary.mechanics.parameterSetId
      !== targetRuntime.provider.parameterSetId
    || coronary.mechanics.parameterIdentityHash
      !== targetRuntime.provider.parameterIdentityHash
    || coronary.mechanics.stateSchemaVersion
      !== targetRuntime.provider.stateSchemaVersion
  ) {
    const base = mainWireFiveWallCoronaryBaseStateV2(coronary);
    coronary = wrapMainWireFiveWallCoronaryAcceptedStateV3(
      Object.freeze({
        ...base,
        mechanics: rebindWholeHeartMechanicsAcceptedStateV1(
          sourceRuntime.provider,
          targetRuntime.provider,
          base.mechanics,
        ),
      }),
      coronary.coronaryAutoregulationBinding,
      coronary.coronaryAutoregulation,
    );
  }
  if (sourceCycleSec !== targetCycleSec) {
    composedRhythm = rebindAcceptedComposedRegularSinusStateV2(
      composedRhythm,
      targetRuntime.rhythm.configuration,
    );
    const binding = createCoronaryAutoregulationWindowBindingV3({
      originAcceptedTimeSec: adapted.acceptedTimeSec,
      durationSec: targetCycleSec,
      interpretation: "periodic-sinus-cycle-aligned",
    });
    const desiredControl =
      coronary.coronaryAutoregulation.desiredControl
      ?? coronary.coronaryAutoregulation.windowControl
      ?? undefined;
    const autoregulation = createCoronaryAcceptedAutoregulationStateV3(
      binding,
      {
        acceptedTimeSec: adapted.acceptedTimeSec,
        revision: adapted.revision,
        ...(desiredControl === undefined ? {} : { desiredControl }),
      },
    );
    coronary = wrapMainWireFiveWallCoronaryAcceptedStateV3(
      mainWireFiveWallCoronaryBaseStateV2(coronary),
      binding,
      autoregulation,
    );
  }

  const warmed = wrapMainWireIntegratedModelAcceptedStateV3(
    coronary,
    composedRhythm,
    adapted.dynamicMechanicalSupport,
    { configuration: targetRuntime.rhythm.configuration },
    targetRuntime.profile,
    targetRuntime.config,
  );
  if (
    warmed.revision !== source.revision
    || warmed.acceptedTimeSec !== source.acceptedTimeSec
  ) {
    throw new Error("integrated V3 warm start changed the accepted clock");
  }
  return warmed;
}
