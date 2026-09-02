import settledBaselineCheckpointJson from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json";
import {
  benchmarkMainWireBaselineContinuationV1,
} from "@/analysis/methods/mainWire/MainWireBaselineContinuationBenchmarkV1";
import {
  validateMainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";

const sourceCheckpoint =
  await validateMainWireIntegratedModelStandard68CheckpointV1(
    settledBaselineCheckpointJson,
  );
const targetHemodynamicResearchInputs =
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3({
    ...MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
    systemicResistance:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1
        .systemicResistance + 0.01,
  });
const benchmark = await benchmarkMainWireBaselineContinuationV1({
  sourceCheckpoint,
  targetHemodynamicResearchInputs,
  onProgress: (runLabel, phase) => {
    process.stderr.write(`[continuation] ${runLabel} ${phase}\n`);
  },
});
process.stdout.write(`${JSON.stringify(benchmark, null, 2)}\n`);
