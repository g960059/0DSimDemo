import {
  createCoronaryAcceptedAutoregulationStateV3,
  createCoronaryAutoregulationWindowBindingV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  buildNonCoronaryCirculationGraphV1,
  type NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  vascularPvLawFromNodeV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  mainWireFiveWallCoronaryBaseStateV2,
  wrapMainWireFiveWallCoronaryAcceptedStateV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  wrapMainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type {
  MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import { stressedVolumeFromPtm } from "@/engine/vascularPv";

export const MAIN_WIRE_INTEGRATED_MODEL_FIXED_TBV_FORK_V3_ID =
  "main-wire-integrated-model-fixed-tbv-shared-sv-vc-fork-v1" as const;

type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireIntegratedModelAcceptedStateV3<WallState>;
type FixedTbvForkRuntime = Pick<
  MainWireIntegratedModelRuntimeV3,
  "runtime" | "rhythm" | "profile" | "config"
>;

const TARGET_TOLERANCE_ML_V3 = 1e-6;
const RESPONSIVE_STARLING_FROZEN_TONE_WINDOW_SEC_V3 = 60;

/**
 * Creates an independent protocol seed at a new global TBV while preserving
 * cardiac phase, chamber/mechanics state, coronary state, valve memory,
 * rhythm state, and MCS state. Only the systemic venous SV/VC reservoirs are
 * moved, using one shared transmural-pressure offset as in the prior
 * scientific continuation protocol.
 */
export function forkMainWireIntegratedModelAtFixedTbvV3(input: Readonly<{
  source: AcceptedState;
  runtime: FixedTbvForkRuntime;
  targetGlobalTotalBloodVolumeMl: number;
}>): AcceptedState {
  const { source, runtime, targetGlobalTotalBloodVolumeMl } = input;
  if (
    !Number.isFinite(targetGlobalTotalBloodVolumeMl)
    || !(targetGlobalTotalBloodVolumeMl > 0)
  ) {
    throw new Error("integrated V3 protocol global TBV must be positive and finite");
  }
  const sourceGlobalTotalBloodVolumeMl =
    source.coronary.fixedGlobalTotalBloodVolumeMl;
  const deltaMl = targetGlobalTotalBloodVolumeMl
    - sourceGlobalTotalBloodVolumeMl;
  if (Math.abs(deltaMl) <= 1e-10) return source;

  const sourceCirculation = source.coronary.circulation;
  const targetNonCoronaryTotalBloodVolumeMl =
    sourceCirculation.totalBloodVolumeMl + deltaMl;
  const nodeVolumesMl = forkVenousReservoirVolumesV3(
    sourceCirculation.nodeVolumesMl,
    runtime.runtime,
    deltaMl,
  );
  const resolvedNonCoronaryTotalBloodVolumeMl = Object.values(nodeVolumesMl)
    .reduce((sum, volumeMl) => sum + volumeMl, 0);
  if (
    Math.abs(
      resolvedNonCoronaryTotalBloodVolumeMl
        - targetNonCoronaryTotalBloodVolumeMl,
    ) > TARGET_TOLERANCE_ML_V3
  ) {
    throw new Error("integrated V3 protocol fork missed its non-coronary TBV target");
  }

  const circulation = Object.freeze({
    ...sourceCirculation,
    totalBloodVolumeMl: targetNonCoronaryTotalBloodVolumeMl,
    nodeVolumesMl,
  });
  const base = Object.freeze({
    ...mainWireFiveWallCoronaryBaseStateV2(source.coronary),
    fixedGlobalTotalBloodVolumeMl: targetGlobalTotalBloodVolumeMl,
    circulation,
  });
  const coronary = wrapMainWireFiveWallCoronaryAcceptedStateV3(
    base,
    source.coronary.coronaryAutoregulationBinding,
    source.coronary.coronaryAutoregulation,
  );
  return wrapMainWireIntegratedModelAcceptedStateV3(
    coronary,
    source.composedRhythm,
    source.dynamicMechanicalSupport,
    { configuration: runtime.rhythm.configuration },
    runtime.profile,
    runtime.config,
  );
}

/**
 * Ephemeral fast-response protocol seed. The accepted coronary tone is kept,
 * while its slow 25-second controller is rebound to a window beyond the
 * bounded responsive sweep. This makes the locus a fixed-tone preload
 * response instead of a mixture of fast mechanics and slow regulation.
 */
export function forkMainWireIntegratedModelResponsiveStarlingV3(input:
Readonly<{
  source: AcceptedState;
  runtime: FixedTbvForkRuntime;
  targetGlobalTotalBloodVolumeMl: number;
}>): AcceptedState {
  const forked = forkMainWireIntegratedModelAtFixedTbvV3(input);
  const binding = createCoronaryAutoregulationWindowBindingV3({
    originAcceptedTimeSec: forked.acceptedTimeSec,
    durationSec: RESPONSIVE_STARLING_FROZEN_TONE_WINDOW_SEC_V3,
    interpretation: "irregular-rhythm-stationary",
  });
  const previousAutoregulation = forked.coronary.coronaryAutoregulation;
  const desiredControl = previousAutoregulation.desiredControl
    ?? previousAutoregulation.windowControl
    ?? undefined;
  const autoregulation = createCoronaryAcceptedAutoregulationStateV3(
    binding,
    {
      acceptedTimeSec: forked.acceptedTimeSec,
      revision: forked.revision,
      ...(desiredControl === undefined ? {} : { desiredControl }),
    },
  );
  const coronary = wrapMainWireFiveWallCoronaryAcceptedStateV3(
    mainWireFiveWallCoronaryBaseStateV2(forked.coronary),
    binding,
    autoregulation,
  );
  return wrapMainWireIntegratedModelAcceptedStateV3(
    coronary,
    forked.composedRhythm,
    forked.dynamicMechanicalSupport,
    { configuration: input.runtime.rhythm.configuration },
    input.runtime.profile,
    input.runtime.config,
  );
}

function forkVenousReservoirVolumesV3(
  sourceVolumesMl: AcceptedState["coronary"]["circulation"]["nodeVolumesMl"],
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  targetDeltaMl: number,
): AcceptedState["coronary"]["circulation"]["nodeVolumesMl"] {
  const graph = buildNonCoronaryCirculationGraphV1();
  const reservoirs = (["SV", "VC"] as const).map((nodeName) => {
    const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
    const law = vascularPvLawFromNodeV1(node, runtime.vascular);
    const sourceVolumeMl = sourceVolumesMl[nodeName];
    const sourcePtmMmHg = vascularTransmuralPressureFromPhysicalVolumeV1(
      node,
      sourceVolumeMl,
      runtime.vascular,
      "adaptive-volume-tolerance",
    );
    return Object.freeze({
      nodeName,
      law,
      sourceVolumeMl,
      sourcePtmMmHg,
    });
  });
  const residualMl = (offsetMmHg: number): number => reservoirs.reduce(
    (sum, reservoir) => sum
      + reservoir.law.Vu
      + stressedVolumeFromPtm(
        reservoir.law,
        reservoir.sourcePtmMmHg + offsetMmHg,
      )
      - reservoir.sourceVolumeMl,
    -targetDeltaMl,
  );

  let lowerMmHg = -1;
  let upperMmHg = 1;
  for (
    let expansion = 0;
    expansion < 32 && residualMl(lowerMmHg) > 0;
    expansion += 1
  ) lowerMmHg *= 2;
  for (
    let expansion = 0;
    expansion < 32 && residualMl(upperMmHg) < 0;
    expansion += 1
  ) upperMmHg *= 2;
  if (!(residualMl(lowerMmHg) <= 0 && residualMl(upperMmHg) >= 0)) {
    throw new Error("integrated V3 protocol TBV target is outside the SV/VC bracket");
  }
  for (let iteration = 0; iteration < 96; iteration += 1) {
    const midpointMmHg = 0.5 * (lowerMmHg + upperMmHg);
    if (residualMl(midpointMmHg) < 0) lowerMmHg = midpointMmHg;
    else upperMmHg = midpointMmHg;
  }
  const offsetMmHg = 0.5 * (lowerMmHg + upperMmHg);
  const changed = Object.fromEntries(reservoirs.map((reservoir) => [
    reservoir.nodeName,
    reservoir.law.Vu + stressedVolumeFromPtm(
      reservoir.law,
      reservoir.sourcePtmMmHg + offsetMmHg,
    ),
  ])) as Readonly<Record<"SV" | "VC", number>>;
  if (
    !Number.isFinite(changed.SV)
    || !Number.isFinite(changed.VC)
    || !(changed.SV > 0)
    || !(changed.VC > 0)
  ) {
    throw new Error("integrated V3 protocol fork produced invalid venous volumes");
  }
  return Object.freeze({
    ...sourceVolumesMl,
    SV: changed.SV,
    VC: changed.VC,
  });
}
