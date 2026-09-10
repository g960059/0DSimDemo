import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import saved from "@/studio/presentation/modelDocumentation/packages/standard72-document-v1.json";
import { createMainWireIntegratedModelStandard71FixtureV1 as createFixture, MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1 as ventricularMaterial } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 as normalPrior } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import { buildNonCoronaryCirculationGraphV1 } from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { vascularPvLawFromNodeV1, baseNonValveEdgeLossV1 } from "@/engine/core/circulationGraphKernelV1";
import type { MainWireIntegratedModelStandardCheckpointV2 } from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type { MainWireEquationDataV1 } from "./MainWireEquationDetailsV1";

const prior = saved.scientificRecord;

/** Rematerialize shared constitutive coefficients and initial states from an
 * owned fixture. A geometry-bearing caller must additionally provide its
 * resolved anatomy; the original baseline document is never a case assessment. */
export function resolvedMainWireEquationDataV1(candidate: Candidate,
  checkpoint: MainWireIntegratedModelStandardCheckpointV2,
  f: Pick<ReturnType<typeof createFixture>, "runtime" | "rhythm" | "pericardium">): MainWireEquationDataV1 {
  const graph = buildNonCoronaryCirculationGraphV1(), d = prior.equations;
  const numerical = checkpoint.numericalCheckpoint, base = numerical.coronary.baseCheckpointV2;
  return {
    ...d,
    nodes: d.nodes.map(node => ({ ...node, law: node.law === null ? null
      : vascularPvLawFromNodeV1(graph.nodes.find(n => n.name === node.id)!, f.runtime.vascular) })),
    edges: d.edges.map(edge => ({ ...edge, loss: edge.valve ? null
      : baseNonValveEdgeLossV1(graph.edges.find(e => e.name === edge.id)!, f.runtime.losses) })),
    respiratory: f.runtime.respiratory, rhythm: f.rhythm.configuration,
    calcium: f.rhythm.configuration.calciumParametersByWall,
    pericardium: f.pericardium,
    inputScales: { hemodynamic: candidate.hemodynamicResearchInputs,
      mechanics: candidate.mechanismResearchInputs.chamberMechanics,
      referencePassiveScales: prior.measurements.fixtureIdentity.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall },
    sls: { ventricular: ventricularMaterial.sls, atrial: normalPrior.active.wallMaterialByWall.LA.sls },
    effectiveWalls: (["LA", "LVFW", "SEP", "RVFW", "RA"] as const).map(wallId => {
      const material = wallId === "LA" || wallId === "RA" ? normalPrior.active.wallMaterialByWall[wallId] : ventricularMaterial;
      const mechanics = candidate.mechanismResearchInputs.chamberMechanics;
      return { wallId, activeScale: mechanics.activeTensionScaleByWall[wallId], passiveScale: mechanics.passiveStiffnessScaleByWall[wallId],
        trefPa: material.landEquationParameters.values.Tref * mechanics.activeTensionScaleByWall[wallId],
        slsModulusPa: material.sls.branchModulusPa * mechanics.passiveStiffnessScaleByWall[wallId],
        slsTimeSec: material.sls.relaxationTimeSec };
    }),
    initial: {
      timeSec: checkpoint.acceptedTimeSec, totalBloodVolumeMl: base.fixedGlobalTotalBloodVolumeMl,
      volumesMl: base.circulation.state.nodeVolumesMl, valveStates: base.circulation.state.valveStates,
      coronary: base.coronary.acceptedState, mechanics: base.mechanics.materialState,
      rhythm: numerical.composedRhythm.acceptedState, shorteningReference: base.mvcReferenceState,
      coronaryAutoregulation: numerical.coronary.coronaryAutoregulation,
    },
    sources: d.sources.filter(s => !s.path.endsWith("standard72-launch-checkpoint.json")).map(s => ({
      path: s.path, sha256: createHash("sha256").update(readFileSync(s.path)).digest("hex"),
    })),
  } as unknown as MainWireEquationDataV1;
}
