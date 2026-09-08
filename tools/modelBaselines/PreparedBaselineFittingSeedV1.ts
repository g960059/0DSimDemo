import { readPreparedBaselineCaseV1 } from "@/studio/registry/PreparedBaselineCaseV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type { MainWireIntegratedModelStandard72CheckpointV1 } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";

/** This reuses only a case's inputs/state. Its prior qualification is never
 * carried into the next evaluation; the current reference owns that decision. */
export async function preparedBaselineFittingSeedV1(input: unknown) {
  const record = await readPreparedBaselineCaseV1(input);
  const fixture = record.preset.capture.fixture as Record<string, unknown>;
  return { candidateInputs: { hemodynamicResearchInputs: fixture.hemodynamicResearchInputs,
    mechanismResearchInputs: fixture.mechanismResearchInputs, ventricularContractilityScale: 1 } as MainWireBaselineCalibrationCandidateInputsV1,
    checkpoint: record.preset.capture.checkpoint.payload as unknown as MainWireIntegratedModelStandard72CheckpointV1 };
}
