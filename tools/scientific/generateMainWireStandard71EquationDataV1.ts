import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { buildAuthoritativeCirculationGraphV1, vascularPvLawFromNodeV1, baseNonValveEdgeLossV1 } from "@/engine/core/circulationGraphKernelV1";
import { NON_CORONARY_NODE_NAMES_V1, NON_CORONARY_EDGE_NAMES_V1 } from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { createMainWireIntegratedModelStandard71FixtureV1, MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1, MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1 as ventricularMaterial } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 as prior } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import { buildCoronaryTopologyV2 } from "@/engine/coronary/topologyPriorV2";
import { NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1 } from "@/engine/coronary/intramyocardialPressureV1";
import { NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2 } from "@/engine/coronary/autoregulationV2";

// Presentation-only projection. No new dynamics, fitting, or admission decision.
const fixture = createMainWireIntegratedModelStandard71FixtureV1();
const graph = buildAuthoritativeCirculationGraphV1();
const launchPath = "studio/integrations/mainWireIntegratedV3/standard71-launch-checkpoint.json";
const launch = JSON.parse(await readFile(launchPath, "utf8"));
const numerical = launch.baseStandardCheckpointV2.numericalCheckpoint;
const base = numerical.coronary.baseCheckpointV2;
const cor = fixture.coronaryStepInput;
const coronaryTopology = buildCoronaryTopologyV2(cor.coronaryPrior);
const nodeIds = new Set<string>(NON_CORONARY_NODE_NAMES_V1);
const edgeIds = new Set<string>(NON_CORONARY_EDGE_NAMES_V1);
const sourcePaths = [
  "engine/core/topology.ts", "engine/core/circulationGraphKernelV1.ts", "engine/core/nonCoronaryCirculationBackwardEulerV1.ts", "engine/vascularPv.ts",
  "engine/valves/MainWireQuasiSteadyOrificeValveV2.ts", "engine/valves/MainWireFourValveDiseaseResearchBracketsV1.ts",
  "engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1.ts",
  "engine/myocardium/calcium/exactEventPrescribedCalciumV1.ts",
  "engine/myocardium/rhythm/acceptedVentricularIntervalStrengthOwnerV1.ts",
  "engine/myocardium/MainWireFiveWallCoronaryTransactionV2.ts",
  "engine/myocardium/myofilament/land2017/equations.ts", "engine/myocardium/myofilament/land2017/outputs.ts",
  "engine/myocardium/myofilament/land2017/parameterSets.ts", "engine/myocardium/myofilament/land2017/strongBridgeDeactivationExitV1.ts",
  "engine/myocardium/mechanics/normalAdultFiveWallPriorV1.ts", "engine/myocardium/mechanics/equilibriumOneFiberPassiveV1.ts",
  "engine/myocardium/mechanics/moyer2015AtrialEquibiaxialPassiveV1.ts", "engine/myocardium/mechanics/landSlsWallMaterialV1.ts",
  "engine/myocardium/mechanics/energyConjugateTriSegV1.ts", "engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1.ts",
  "engine/myocardium/mechanics/commonPericardiumV1.ts", "engine/coronary/topologyPriorV2.ts",
  "engine/coronary/backwardEulerCoronaryNetworkV2.ts", "engine/coronary/mainWireCoronaryBoundaryV2.ts",
  "engine/coronary/autoregulationV2.ts", "engine/coronary/acceptedAutoregulationWindowV3.ts", "engine/coronary/intramyocardialPressureV1.ts", "engine/physiology/oxygenTransportV1.ts",
  launchPath,
];
const data = {
  schemaId: "standard71-equation-data-v1",
  nodes: graph.nodes.filter(n => nodeIds.has(n.name)).map(n => ({
    id: n.name, external: n.ext ?? (n.chamber ? "heart" : "none"),
    law: n.chamber ? null : vascularPvLawFromNodeV1(n, fixture.runtime.vascular),
    unstressedReferenceMl: n.Vu ?? null, venousToneGainMl: n.venousToneGain ?? 0,
  })),
  edges: graph.edges.filter(e => edgeIds.has(e.name)).map(e => ({
    id: e.name, upstream: e.up, downstream: e.down, valve: e.kind === "valve",
    loss: e.kind === "valve" ? null : baseNonValveEdgeLossV1(e, fixture.runtime.losses),
    // Both root inertances are explicitly removed by this construction.
    inertanceMmHgSec2PerMl: 0,
    external: e.ext ?? "none", waterfall: e.waterfall ?? false,
    pressureThresholdMmHg: e.Pcrit ?? 0, collapsible: e.useChiResistance ?? false,
    referenceResistanceMmHgSecPerMl: e.R, resistanceGroup: e.group ?? "none",
  })),
  valves: fixture.runtime.valveResearchInput.valves,
  respiratory: fixture.runtime.respiratory,
  calcium: fixture.rhythm.configuration.calciumParametersByWall,
  rhythm: fixture.rhythm.configuration,
  land: { ventricular: MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1, atrial: prior.active.atrialLand },
  anatomy: prior.anatomy,
  passive: { ventricular: prior.passive.ventricular.compiled.params, atrial: prior.passive.atrial.compiled.prior },
  sls: { ventricular: { ...ventricularMaterial.sls, branchModulusPa: ventricularMaterial.sls.branchModulusPa * fixture.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall.LVFW }, atrial: prior.sls.atrial },
  pericardium: fixture.pericardium,
  coronary: { topology: coronaryTopology, collapse: cor.collapseHydraulics, prior: cor.coronaryPrior,
    imp: NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1, shortening: cor.shorteningImpPrior,
    autoregulation: NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2 },
  initial: { timeSec: launch.acceptedTimeSec, totalBloodVolumeMl: base.fixedGlobalTotalBloodVolumeMl,
    volumesMl: base.circulation.state.nodeVolumesMl, valveStates: base.circulation.state.valveStates,
    coronary: base.coronary.acceptedState, mechanics: base.mechanics.materialState,
    rhythm: numerical.composedRhythm.acceptedState,
    shorteningReference: base.mvcReferenceState,
    coronaryAutoregulation: numerical.coronary.coronaryAutoregulation,
  },
  sources: await Promise.all(sourcePaths.map(async path => ({ path, sha256: createHash("sha256").update(await readFile(path)).digest("hex") }))),
};
const target = "studio/presentation/modelDocumentation/standard71-equation-data-v1.json";
await writeFile(target, JSON.stringify(data, null, 2) + "\n");
console.log(JSON.stringify({ target, nodes: data.nodes.length, coronaryNodes: data.coronary.topology.nodes.length, bytes: JSON.stringify(data).length, initialFields: Object.keys(base) }));
