import { createHash } from "node:crypto";
import { canonicalJsonStringify, cloneAndFreezeCanonicalJson, sha256CanonicalJsonHex } from "@/engine/integrity";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import { assessMainWireStandard72FittingQualificationV1 as assess } from "@/analysis/methods/mainWire/MainWireStandard72FittingQualificationV1";
import { assertUnaliasedMainWireFittingCandidateV1 } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { createCircleHeartExactModelReleaseV1 as sourceFactory } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1";
import descriptor from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1.client.json";
import lock from "@/studio/integrations/mainWireIntegratedV3/standard72-registry-admission-lock.json";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";
import { importExactExecutableArtifactModuleV2 } from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveMainWireAnalysisMethodsForSurfaceV1 } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID } from "@/studio/contracts/v2/content";
import { readPreparedBaselineCaseV1, type PreparedBaselineCaseV1 } from "@/studio/registry/PreparedBaselineCaseV1";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type { MainWireBaselineAssessmentReadbackV1 } from "@/studio/presentation/CurrentBaselinePresentationV1";

type Report = Awaited<ReturnType<typeof assess>>;
const same = (a: unknown, b: unknown, label: string) => {
  if (canonicalJsonStringify(a) !== canonicalJsonStringify(b)) throw new Error(`Prepared baseline mismatch: ${label}`);
};

/** Re-observe the final report, restore its exact state, then bind it to the
 * unchanged registered executable by actual continuation. No model mint,
 * default change, control-grid rounding or checkpoint JSON editing. */
export async function prepareMainWireBaselineCaseV1(input: Readonly<{
  qualification: unknown; executionSourceSha256: string; artifact: Uint8Array;
  presetId: string; title: string;
}>): Promise<PreparedBaselineCaseV1> {
  const report = cloneAndFreezeCanonicalJson(input.qualification) as Report;
  if (!report || report.schemaId !== "main-wire-standard72-fitted-candidate-qualification-v1") throw new Error("Final qualification report required");
  const { reportSha256, ...body } = report;
  if (reportSha256 !== await sha256CanonicalJsonHex(body)) throw new Error("Qualification report digest differs");
  const checked = await assess(report.grids);
  same(checked, report, "current qualification policy and primitive evidence");
  if (checked.status !== "qualified") throw new Error(`Candidate held: ${checked.issues.join(", ")}`);
  const grid = checked.grids.coarse;
  if (grid.status !== "grid-evaluated") throw new Error("Qualified coarse grid missing");
  const candidate = grid.evaluation.candidateInputs;
  assertUnaliasedMainWireFittingCandidateV1(candidate);
  const exact = await Session.restoreStandard72ExactCheckpoint(grid.evaluation.checkpoint,
    candidate.hemodynamicResearchInputs, 1, undefined, candidate.mechanismResearchInputs);
  const before = exact.currentAcceptedState().acceptedTimeSec;
  const launchTime = Math.ceil((before - 1e-12) / .002) * .002;
  if (launchTime > before + 1e-12) exact.advanceToPresentationTimeWithSelectedOutputProjectionV1(launchTime, []);
  const launch = await exact.checkpointStandard72Exact();
  same(launch.baseStandardCheckpointV2.completedBeatMetrics, grid.evaluation.diagnostics!.completedBeat,
    "launch alignment must retain the qualified complete beat");
  const fixture = { ...descriptor.defaultFixture, hemodynamicResearchInputs: candidate.hemodynamicResearchInputs,
    mechanismResearchInputs: candidate.mechanismResearchInputs };
  const capture = { fixture, checkpoint: { acceptedTimeSec: launch.acceptedTimeSec,
    acceptedRevision: launch.revision, payload: launch as unknown as StudioJsonValueV2 } };
  if (createHash("sha256").update(input.artifact).digest("hex") !== lock.artifactSha256) throw new Error("Registered artifact bytes differ");
  const module = await importExactExecutableArtifactModuleV2(input.artifact);
  if (typeof module.createCircleHeartExactModelReleaseV1 !== "function") throw new Error("Exact artifact factory missing");
  const artifact = await module.createCircleHeartExactModelReleaseV1() as ReturnType<typeof sourceFactory>;
  const source = sourceFactory();
  same(source.manifest, descriptor.manifest, "source manifest");
  same(artifact.manifest, descriptor.manifest, "artifact manifest");
  const model = composeStandardModelContractV1(artifact.manifest, surface,
    resolveMainWireAnalysisMethodsForSurfaceV1(surface).capabilities).contract;
  const runtimeSessionId = "baseline/preparation", scenarioId = "baseline";
  const finalCheckpoints = [];
  try {
    for (const release of [source, artifact]) {
      await release.executables.captureAdapter.validateCapture({ model, capture });
      await release.executables.simulationAdapter.createSession({ runtimeSessionId,
        scenarios: [{ scenarioId, fixture, checkpoint: capture.checkpoint }] });
    }
    for (let step = 0; step <= 1000; step++) {
      const frames = [];
      for (const release of [source, artifact]) frames.push(step === 0
        ? release.executables.simulationAdapter.currentFrame({ runtimeSessionId, scenarioId })
        : await release.executables.simulationAdapter.advanceOnePresentationStep({ runtimeSessionId, scenarioId }));
      same(frames[0], frames[1], `source/artifact continuation ${step}`);
    }
    for (const release of [source, artifact]) {
      const result = await release.executables.experimentCapture.captureAcceptedCandidate({ experimentId: "baseline/preparation", model,
        desiredContent: { modelId: model.modelId, surfaceSeriesId: surface.surfaceSeriesId,
          scenarios: [{ scenarioId, label: input.title, fixture }],
          surface: { graphPanes: [], outputPanes: [], controlPanes: [], note: { text: "" } } },
        correlation: { runtimeSessionId, scenarios: [{ scenarioId, expectedInputEpoch: 0 }] } });
      finalCheckpoints.push(result.content.scenarios[0]!.capture.checkpoint);
    }
    same(finalCheckpoints[0], finalCheckpoints[1], "source/artifact final checkpoint");
  } finally {
    source.executables.simulationAdapter.disposeSession(runtimeSessionId);
    artifact.executables.simulationAdapter.disposeSession(runtimeSessionId);
  }
  if (!grid.tau.weiss || !grid.tau.glantz) throw new Error("Measured relaxation estimates missing");
  const assessment = { rest: grid.evaluation.rest, native: grid.native, tau: {
    weiss: { tauMs: grid.tau.weiss.tauMs }, glantz: { tauMs: grid.tau.glantz.tauMs } },
    beat: { ventricularAbsolutePressureRateExtrema: grid.evaluation.diagnostics!.completedBeat.ventricularAbsolutePressureRateExtrema,
      valveForwardPressureGradients: grid.evaluation.diagnostics!.completedBeat.valveForwardPressureGradients },
    reserveVerified: checked.preloadReserve!.status === "passed" } satisfies MainWireBaselineAssessmentReadbackV1;
  const prepared = { schemaId: "prepared-main-wire-baseline-case-v1" as const,
    preset: { schemaId: STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID, presetId: input.presetId,
      modelId: model.modelId, title: input.title, description: "Locally qualified baseline candidate; not adopted or published.", capture },
    surfaceReleaseId: surface.surfaceReleaseId, artifactRevisionId: lock.artifactRevisionId, artifactSha256: lock.artifactSha256,
    fixtureSha256: await sha256CanonicalJsonHex(fixture), assessment,
    evidence: { qualificationReportSha256: report.reportSha256, qualificationPolicySha256: report.policyIdentitySha256,
      referenceSha256: report.referenceIdentitySha256, executionSourceSha256: input.executionSourceSha256,
      qualifiedCheckpointSha256: grid.evaluation.checkpoint.checkpointSha256,
      launchCheckpointSha256: launch.checkpointSha256, sourceArtifactContinuationSteps: 1000 },
    publicBaselinePromotionAuthorized: false as const };
  return readPreparedBaselineCaseV1({ ...prepared, recordSha256: await sha256CanonicalJsonHex(prepared) });
}
