import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import saved from "@/studio/presentation/modelDocumentation/packages/standard72-document-v1.json";
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { readPreparedBaselineCaseV1 } from "@/studio/registry/PreparedBaselineCaseV1";
import { assessMainWireStandard72FittingQualificationV1 as qualify } from "@/analysis/methods/mainWire/MainWireStandard72FittingQualificationV1";
import { createMainWireIntegratedModelStandard71FixtureV1 as createFixture, MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1 as ventricularMaterial } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 as normalPrior } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import { buildNonCoronaryCirculationGraphV1 } from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { vascularPvLawFromNodeV1, baseNonValveEdgeLossV1 } from "@/engine/core/circulationGraphKernelV1";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1 as measure } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { observeMainWireStandard70TimingAndInletV2 as timing } from "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { mainWireBaselineGateRoleV1 as role } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineGateRolesV1";
import descriptor from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1.client.json";
import { mainWireIntegratedStudioFixtureProjectionV3 as projection } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import type { MainWireIntegratedModelStandard72CheckpointV1 } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import type { MainWireIntegratedModelStandardCheckpointV2 } from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type { MainWireEquationDataV1 } from "./MainWireEquationDetailsV1";
import type { MainWireDocumentContentV1 } from "./MainWireDocumentV1";

const same = (a: unknown, b: unknown, label: string) => {
  if (canonicalJsonStringify(a) !== canonicalJsonStringify(b)) throw new Error(`Fitted document binding differs: ${label}`);
};
const prior = saved.scientificRecord;

export function fittedBaselineSettingsV1(fixture: unknown) {
  return descriptor.manifest.primitiveControlCatalog.map(c => {
    const result = projection.controlValue(fixture, c.controlId);
    if (result.status === "unsupported") throw new Error(`Unobserved control: ${c.controlId}`);
    // A common knob may be mixed while every individual wall input is valid.
    // Never round/average those inputs or narrow cases to the common-knob space.
    return { ...c, defaultValue: result.status === "mixed" ? null : result.value };
  });
}

/** Rematerialize input-dependent coefficients from the exact owner's factory.
 * No integration/settling; fixed constitutive modules and their provenance stay
 * reusable. Wall multipliers are explicit, not hidden in a shared LV coefficient.
 */
export function fittedBaselineEquationDataV1(candidate: Candidate,
  launch: MainWireIntegratedModelStandard72CheckpointV1): MainWireEquationDataV1 {
  const f = createFixture(candidate.hemodynamicResearchInputs, 1, candidate.mechanismResearchInputs);
  // This authoring adapter covers the resting fitting profile, not arbitrary
  // disease mechanisms. Refuse substitutions instead of retaining stale tables.
  for (const key of ["valveAreas", "pericardium", "coronaryDisease", "oxygenTransport"] as const) {
    same(candidate.mechanismResearchInputs[key], prior.measurements.fixtureIdentity.mechanismResearchInputs[key], key);
  }
  return resolvedMainWireEquationDataV1(candidate, launch.baseStandardCheckpointV2, f);
}

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

/** One composition for all qualified resting cases of this physical model.
 * Measurements come only from this candidate's report. The original documents
 * are neither rewritten nor used as a substitute assessment.
 */
export async function composeFittedBaselineDocumentV1(input: Readonly<{
  preparedCase: unknown; qualification: unknown; documentId: string;
}>) {
  if (!/^[a-z0-9][a-z0-9.-]+$/.test(input.documentId) || input.documentId === saved.documentId) {
    throw new Error("Use a new, URL-safe document ID");
  }
  const prepared = await readPreparedBaselineCaseV1(input.preparedCase);
  const report = input.qualification as Awaited<ReturnType<typeof qualify>>;
  const checked = await qualify(report.grids);
  same(report, checked, "current qualification and primitive observations");
  if (checked.status !== "qualified" || checked.reportSha256 !== prepared.evidence.qualificationReportSha256) {
    throw new Error("Prepared case needs its own qualified report");
  }
  const coarse = checked.grids.coarse;
  if (coarse.status !== "grid-evaluated") throw new Error("Missing coarse result");
  const fixture = prepared.preset.capture.fixture as typeof prior.measurements.fixtureIdentity;
  const candidate = coarse.evaluation.candidateInputs;
  same(fixture.hemodynamicResearchInputs, candidate.hemodynamicResearchInputs, "hemodynamic inputs");
  same(fixture.mechanismResearchInputs, candidate.mechanismResearchInputs, "mechanism inputs");
  const launch = prepared.preset.capture.checkpoint.payload as unknown as MainWireIntegratedModelStandard72CheckpointV1;
  const equations = fittedBaselineEquationDataV1(candidate, launch);
  const observations = [checked.grids.coarse, checked.grids.fine].map(grid => {
    if (grid.status !== "grid-evaluated" || !grid.preloadReserve || !grid.tau.weiss || !grid.tau.glantz) throw new Error("Incomplete observation");
    const e = grid.evaluation, diagnostics = e.diagnostics!;
    return { dtSec: grid.nominalDtSec, cycles: e.completedCycleCount, rest: e.rest, native: grid.native, tau: grid.tau,
      beat: { ventricularAbsolutePressureRateExtrema: diagnostics.completedBeat.ventricularAbsolutePressureRateExtrema,
        valveForwardPressureGradients: diagnostics.completedBeat.valveForwardPressureGradients },
      checks: e.checks.map(c => ({ ...c, historicalRole: role(c.checkId) })),
      measurements: measure({ ...diagnostics, timingAndInletObserver: timing }),
      reserveMeasurement: grid.preloadReserve };
  });
  const qualified = coarse.evaluation.checkpoint;
  const measurements = {
    schemaId: "main-wire-fitted-baseline-documentation-v1",
    modelId: prepared.preset.modelId, surfaceReleaseId: prepared.surfaceReleaseId,
    surfaceSeriesId: saved.identity.surfaceSeriesId, baselineId: prepared.preset.presetId,
    releaseStatus: "local-candidate-not-registered", clinicalNormalityClaimed: false,
    fixtureIdentity: fixture,
    settings: fittedBaselineSettingsV1(fixture),
    material: prior.measurements.material, calcium: equations.calcium, assembly: prior.measurements.assembly,
    qualification: {
      cycles: coarse.evaluation.completedCycleCount, classification: coarse.evaluation.classification,
      checkpoint: { checkpointId: qualified.checkpointId, checkpointSha256: qualified.checkpointSha256,
        acceptedTimeSec: qualified.acceptedTimeSec, revision: qualified.revision },
      launchPreparation: {
        sourceCheckpointSha256: qualified.checkpointSha256, sourceAcceptedTimeSec: qualified.acceptedTimeSec,
        targetCheckpointSha256: launch.checkpointSha256, targetAcceptedTimeSec: launch.acceptedTimeSec,
        targetRevision: launch.revision, advancedDurationSec: launch.acceptedTimeSec - qualified.acceptedTimeSec,
        baseTickSec: .002, completedBeatUnchanged: true,
      },
      reportSha256: checked.reportSha256, policyIdentitySha256: checked.policyIdentitySha256,
      preparedCaseSha256: prepared.recordSha256, executionSourceSha256: prepared.evidence.executionSourceSha256,
      scope: checked.qualificationScope,
    },
    admission: { policy: checked.policy.restPolicy,
      constructionSha256: await sha256CanonicalJsonHex(candidate),
      constructionHashMeaning: "Exact typed candidate inputs, not a model or runtime identity",
      pressureRateQuality: checked.pressureRateQuality, reserve: checked.preloadReserve },
    observations,
    evidence: prior.measurements.evidence, morphologyPolicy: prior.measurements.morphologyPolicy,
    settlementPolicy: prior.measurements.settlementPolicy, tauPolicy: checked.policy.tauPolicy,
    physicalDocument: { documentId: saved.documentId, contentSha256: saved.contentSha256,
      scope: "Fixed constitutive explanations only; coefficients, initial state and assessment are rematerialized for this case." },
    surfaceDefinition: prior.measurements.surfaceDefinition,
    checkpointSemantics: { checkpointId: launch.checkpointId, coupledPredictor: launch.coupledPredictor },
  };
  // Reader projection intentionally excludes raw traces and obsolete admission
  // implementation details. The linked qualification archive retains those.
  const content = { ...measurements, title: saved.identity.title,
    equations, moduleIds: prior.modules.map(m => m.id),
    analysisMethods: prior.measurements.executableQualification.analysisCapabilities,
    copy: {
      release: { ja: "研究・教育用 · ローカル候補 · 臨床的妥当性は未確立", en: "Research and education · local candidate · not clinically validated" },
      changes: { ja: "数理モデルとModel Surfaceは変更せず、baselineの入力値・初期状態・評価をまとめた記録です。症例名：" + prepared.preset.title,
        en: "The exact model and Model Surface are unchanged. This record binds baseline inputs, initial state and assessment. Case: " + prepared.preset.title },
      provenance: { ja: "この候補を2 ms・1 msでそれぞれ初期状態から計算し、定常拍と固定制御下の低容量・高容量応答を評価しています。起動状態は同じexact modelから保存し、現行artifactでの継続を照合しています。評価はこの候補自身の記録です。",
        en: "This candidate was cold-run independently at 2 and 1 ms, assessing rest and fixed-control low/high preload responses. Its own-model launch state was continued against the current artifact. Assessments belong to this candidate." },
      assessment: { ja: "この候補の最終検証記録です。採用・公開は別の操作であり、臨床的な正常性を保証するものではありません。",
        en: "Final qualification for this candidate. Adoption/publication are separate actions, not clinical normality claims." },
      records: [{ ja: "2 ms · 独立した初期状態から検証", en: "2 ms · independent cold qualification" },
        { ja: "1 ms · 独立した初期状態から検証", en: "1 ms · independent cold qualification" }],
    },
  } satisfies MainWireDocumentContentV1;
  return { documentId: input.documentId, measurements, content };
}
