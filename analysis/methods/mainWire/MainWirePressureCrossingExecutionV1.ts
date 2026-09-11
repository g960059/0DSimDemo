import type { AnalysisExecutorV1 } from "@/analysis/contracts/AnalysisExecutionV1";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { MAIN_WIRE_STATIC_CASE_MODEL_ID_V1, MAIN_WIRE_STATIC_CASE_FIXTURE_SCHEMA_ID_V1 } from "@/domain/model/MainWireStaticCaseIdentityV1";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { studioCanonicalJsonStringify as canonical } from "@/domain/json/CanonicalJson";
import { validateStudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import { MAIN_WIRE_PRESSURE_CROSSING_PV_ANALYSIS_V1_ID as analysisId,
  MAIN_WIRE_PRESSURE_CROSSING_PV_PROTOCOL_V1_ID as protocolId,
  type MainWireIntegratedModelResponsiveStarlingPartitionV3 } from "./MainWireStructuralAnalysisContractV3";
import { runMainWireIntegratedModelFormalPressureVolumeProtocolV3 as protocol } from "./MainWirePressureVolumeProtocolsV3";
import { buildMainWireIntegratedModelGuytonStarlingOrientationV3 as orientation } from "./MainWireGuytonStarlingOrientationV3";
import { wrapMainWirePressureCrossingSessionV1 as wrap, MAIN_WIRE_SEMILUNAR_PRESSURE_CROSSING_V1_ID as measurementId } from "./MainWirePressureCrossingSessionV1";

// Exact-owner source compatibility is deliberately narrow. Changing this pin
// requires source/compiled continuation tests, not merely a matching modelId.
export const MAIN_WIRE_PRESSURE_CROSSING_SOURCE_ARTIFACT_V1 = "38e31e94e7b25e71d0bb99c1a7e9a27dc094985c3920d12c2fdf22afa34abce4";

// Read-only capture projection. The exact owner's restore signature determines
// the numerical input types; analysis does not depend on a Studio adapter.
type Restore = Parameters<typeof Session.restore>;
type Fixture = Readonly<{ schemaId: string; anatomyId: Restore[1];
  hemodynamicResearchInputs: Restore[2]; mechanismResearchInputs: Restore[4];
  rhythm: unknown; coronary: unknown; dynamicMechanicalSupport: unknown }>;

export const executeMainWirePressureCrossingPvV1: AnalysisExecutorV1["execute"] = async ({ source, request }) => {
  const frame = source.acceptedFrame;
  if (frame.modelId !== MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 || request.analysisId !== analysisId || !source.capture)
    throw new Error("Pressure-crossing analysis requires the supported static exact capture");
  if (request.scenarioId !== frame.scenarioId || request.runtimeSessionId !== frame.runtimeSessionId
    || request.expectedInputEpoch !== frame.inputEpoch || request.expectedAcceptedRevision !== frame.acceptedRevision
    || request.expectedAcceptedTimeSec !== frame.acceptedTimeSec) throw new Error("Pressure-crossing analysis source clocks differ");
  if (request.analysisPartition !== undefined && request.analysisPartition !== "hypovolemic" && request.analysisPartition !== "hypervolemic")
    throw new Error("Unknown pressure-volume analysis partition");
  const captured = await source.capture();
  if (captured.artifactRevisionId !== MAIN_WIRE_PRESSURE_CROSSING_SOURCE_ARTIFACT_V1)
    throw new Error("Pressure-crossing exact source artifact requires compatibility validation");
  const { checkpoint } = captured.scenario;
  if (!checkpoint || checkpoint.acceptedRevision !== frame.acceptedRevision || checkpoint.acceptedTimeSec !== frame.acceptedTimeSec)
    throw new Error("Pressure-crossing checkpoint clocks differ");
  const fixture = captured.scenario.fixture as unknown as Fixture;
  if (fixture.schemaId !== MAIN_WIRE_STATIC_CASE_FIXTURE_SCHEMA_ID_V1 || fixture.anatomyId === undefined
    || canonical(fixture.rhythm) !== canonical({ mode: "regular-sinus-v3" })
    || canonical(fixture.coronary) !== canonical({ topologyProfile: "coronary-network-v2" })
    || canonical(fixture.dynamicMechanicalSupport) !== canonical({ mode: "all-off-zero-inertance-v3" }))
    throw new Error("Unsupported pressure-crossing fixture construction");
  const previousTier = hotPathIntegrityTierV1();
  selectHotPathIntegrityTierV1("hot-path-lean");
  try {
    // Restore/checkpoint semantics remain in the exact owner, not the analysis.
    const session = await Session.restore(checkpoint.payload, fixture.anatomyId,
      fixture.hemodynamicResearchInputs, 1, fixture.mechanismResearchInputs);
    const accepted = session.currentAcceptedState();
    if (accepted.revision !== frame.acceptedRevision || accepted.acceptedTimeSec !== frame.acceptedTimeSec)
      throw new Error("Restored pressure-crossing source clocks differ");
    const toAnalysis = (result: Awaited<ReturnType<typeof protocol>>) => {
      const loci = Object.freeze({
        right: Object.freeze({ ...result.right, protocolId, exactAnatomy: session.anatomy }),
        left: Object.freeze({ ...result.left, protocolId, exactAnatomy: session.anatomy }),
      });
      const payload = orientation(result.anchorObservation, fixture.hemodynamicResearchInputs, loci);
      if (payload.status !== "available") throw new Error("Pressure-volume anchor has no accepted readback");
      return validateStudioSimulationAnalysisV2({ modelId: frame.modelId, runtimeSessionId: request.runtimeSessionId,
        scenarioId: frame.scenarioId, inputEpoch: frame.inputEpoch, sourceAcceptedRevision: frame.acceptedRevision,
        sourceAcceptedTimeSec: frame.acceptedTimeSec, analysisId,
        payload: { ...payload, measurement: { methodId: measurementId, protocolId,
          maximumStepSec: .002, interpolation: "signed-pressure-linear-bracket", pressureBasis: "transmural",
          exactNativeMetricsUnchanged: true } } });
    };
    const result = await protocol(wrap(session), fixture.hemodynamicResearchInputs,
      progress => request.onProgress?.(toAnalysis(progress)),
      request.analysisPartition as MainWireIntegratedModelResponsiveStarlingPartitionV3 | undefined);
    return toAnalysis(result);
  } finally { selectHotPathIntegrityTierV1(previousTier); }
};
