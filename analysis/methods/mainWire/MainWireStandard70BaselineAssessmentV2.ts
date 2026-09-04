import {
  buildMainWireIntegratedModelStandard70BaselineChecksV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import type { MainWireIntegratedModelStandard70BaselineQualificationV1,
  MainWireIntegratedModelStandard70TimingAndInletObserverV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { observeMainWireBaselineV2, type MainWireBaselineObservationV2 } from "./MainWireBaselineObservationV2";
import { evaluateMainWireIntegratedModelStandard70CandidateV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import type { MainWireIntegratedModelStandard68CheckpointV1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { mainWireBaselineCheckBlocksV1 } from
  "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { evaluateMainWireBaselinePressureRateQualityV1 } from "./MainWireBaselinePressureRateQualityV1";

/** Prospective analysis seam: old extractors are never prerequisites for V2. */
export const observeMainWireStandard70TimingAndInletV2: MainWireIntegratedModelStandard70TimingAndInletObserverV1 =
  ({ terminalTrace, completedBeat }) => projectTimingAndInletV2(observeMainWireBaselineV2({ samples: terminalTrace, completedBeat }));

/** Prospective mint path: do not run historical V1 normality gates first. */
export async function qualifyMainWireStandard70BaselineAssessmentV2(
  sourceCheckpoint: MainWireIntegratedModelStandard68CheckpointV1,
) {
  const candidate = {
    hemodynamicResearchInputs: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
    mechanismResearchInputs: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
    ventricularContractilityScale: 1,
  };
  const qualification = observeMainWireStandard70QualificationV2(
    await evaluateMainWireIntegratedModelStandard70CandidateV1({ ...candidate,
      timingAndInletObserver: observeMainWireStandard70TimingAndInletV2,
      initialization: { kind: "standard68-construction-continuation", sourceCheckpoint,
        sourceHemodynamicResearchInputs: MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
        sourceVentricularContractilityScale: 1,
        sourceMechanismResearchInputs: MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1 },
    }));
  const failed = qualification.checks.filter(mainWireBaselineCheckBlocksV1);
  if (failed.length) throw new Error(`Current baseline assessment rejected: ${failed.map(x => x.checkId).join(", ")}`);
  const fine = await evaluateMainWireIntegratedModelStandard70CandidateV1({ ...candidate,
    timingAndInletObserver: observeMainWireStandard70TimingAndInletV2,
    nominalDtSec: qualification.nominalDtSec / 2,
    initialization: { kind: "standard70-exact-checkpoint", checkpoint: qualification.checkpoint },
  });
  const candidateIdentitySha256 = await sha256CanonicalJsonHex(candidate);
  const pressureRateQuality = evaluateMainWireBaselinePressureRateQualityV1({
    coarse: { qualification, candidateIdentitySha256 }, fine: { qualification: fine, candidateIdentitySha256 },
  });
  if (pressureRateQuality.status !== "passed") throw new Error(`Baseline pressure-rate quality ${pressureRateQuality.status}: ${JSON.stringify(pressureRateQuality)}`);
  return Object.freeze({ qualification, pressureRateQuality });
}

/** Re-observe accepted evidence without changing or rehashing the exact state. */
export function observeMainWireStandard70QualificationV2(
  qualification: MainWireIntegratedModelStandard70BaselineQualificationV1,
) {
  const completedBeat = qualification.checkpoint.baseStandardCheckpointV2.completedBeatMetrics;
  if (completedBeat === null) throw new Error("Baseline observation requires a completed exact beat");
  const observation = observeMainWireBaselineV2({ samples: qualification.terminalTrace, completedBeat });
  const projected = projectTimingAndInletV2(observation);
  const measurements = Object.freeze({
    ...qualification.measurements,
    aorticValve: Object.freeze({ ...qualification.measurements.aorticValve,
      ejectionTimeSec: observation.left.timing.ejectionTimeSec }),
    pulmonaryValve: Object.freeze({ ...qualification.measurements.pulmonaryValve,
      ejectionTimeSec: observation.right.timing.ejectionTimeSec }),
    timing: projected.left.timing,
    rightTiming: projected.right.timing,
    mitralFlow: projected.left.inletFlow,
    tricuspidFlow: projected.right.inletFlow,
  });
  return Object.freeze({
    ...qualification,
    measurements,
    checks: buildMainWireIntegratedModelStandard70BaselineChecksV1(
      measurements, qualification.classification.status === "period1-converged"),
    observation,
    sourceObservation: Object.freeze({
      measurements: qualification.measurements,
      checks: qualification.checks,
    }),
  });
}

function projectTimingAndInletV2(observation: MainWireBaselineObservationV2) {
  const side = (value: typeof observation.left) => Object.freeze({
    ejectionTimeSec: value.timing.ejectionTimeSec,
    timing: Object.freeze({ ictSec: value.timing.ictSec, irtSec: value.timing.irtSec, teiIndex: value.timing.teiIndex }),
    inletFlow: Object.freeze({ peakEMlPerSec: value.inletFlow.peakEMlPerSec,
      peakAMlPerSec: value.inletFlow.peakAMlPerSec, peakEToA: value.inletFlow.peakEToA }),
  });
  return Object.freeze({ left: side(observation.left), right: side(observation.right) });
}
