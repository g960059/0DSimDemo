import {
  settleFormalPressureVolumeSourceV3 as settle,
  measureFormalPressureVolumeBranchV3 as measure,
  runFormalHypovolemicCoverageChainV3 as low,
  runFormalHypervolemicStarlingChainV3 as high,
  formalExpectedPointCountV3 as expected,
  formalPressureVolumeLocusV3 as locus,
  formalPairQualifiedV3 as qualified,
  FIXED_TBV_TOLERANCE_ML_V3 as tbvTolerance,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID as protocolId,
  type AcceptedBranchV3 as Center,
  type StarlingPairV3 as Pair,
  type MainWireIntegratedModelStructuralAnalysisSessionV3 as Session,
  type MainWireIntegratedModelFormalPressureVolumeResultV3 as Result,
  type MainWireIntegratedModelResponsiveStarlingPartitionV3 as Partition,
} from "./MainWirePressureVolumeProtocolsV3";
import type { MainWireIntegratedModelHemodynamicResearchInputsV3 as Inputs } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";

export type MainWireSharedPressureVolumeAnchorV1 = Pick<Center, "branch" | "pair">;
type Loci = Omit<Result, "anchorObservation">;

export function mainWirePressureVolumeAnchorLociV1(center: MainWireSharedPressureVolumeAnchorV1, partition: Partition): Loci {
  return { protocolId,
    right: locus([center.pair.right], false, expected(partition)),
    left: locus([center.pair.left], false, expected(partition)) };
}

/** One ephemeral, settled source shared by independent directional forks.
 * Uses exactly the qualification gates of the unpartitioned formal protocol. */
export async function prepareMainWirePressureVolumeAnchorV1(source: Session, inputs: Inputs): Promise<Center> {
  const tbv = source.currentAcceptedState().coronary.fixedGlobalTotalBloodVolumeMl;
  if (Math.abs(tbv - inputs.totalBloodVolumeMl) > tbvTolerance)
    throw new Error("formal PVA source and Scenario TBV differ");
  const settled = settle(source, tbv);
  if (settled.status === "rejected") throw new Error(`formal pressure-volume source rejected: ${settled.reason}`);
  const center = await measure(settled.branch, tbv, "operating-anchor");
  if (center.status === "rejected" || !qualified(center.pair)) throw new Error(center.status === "rejected"
    ? `formal pressure-volume center rejected: ${center.reason}`
    : "formal pressure-volume center did not establish periodic closure");
  return center;
}

export async function runMainWirePressureVolumeFromAnchorV1(
  center: MainWireSharedPressureVolumeAnchorV1, inputs: Inputs, partition: Partition,
  onProgress?: (result: Loci) => void,
): Promise<Loci> {
  if (partition !== "hypovolemic" && partition !== "hypervolemic") throw new Error("Unknown pressure-volume partition");
  const pairs: Pair[] = [];
  const result = (complete = false): Loci => Object.freeze({ protocolId,
    right: locus(pairs.map(p => p.right), complete, expected(partition)),
    left: locus(pairs.map(p => p.left), complete, expected(partition)) });
  const append = (pair: Pair) => { pairs.push(pair); onProgress?.(result()); };
  append(center.pair);
  await (partition === "hypovolemic" ? low : high)(center.branch, center.pair, inputs.totalBloodVolumeMl, append);
  return result(true);
}
