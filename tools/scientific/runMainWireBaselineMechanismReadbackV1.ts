import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireIntegratedModelStandard70TypedAuthoritySessionV1 as Standard70Session } from
  "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";
import { MainWireIntegratedTypedAuthoritySessionV1 } from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import { createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1";
import type { MainWireIntegratedModelRuntimeV3 } from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import type { MainWireFiveWallLandTriSegReadbackV1 } from
  "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type { MainWireNormalAdultWallMaterialReadbackV1 } from
  "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_LAND_SLACK_STRETCH_V1 } from
  "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import { buildNonCoronaryCirculationGraphV1 } from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1 } from "@/engine/core/circulationGraphKernelV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Inputs } from
  "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type { MainWireStandard70BaselineCalibrationEvaluationV1 as Evaluation } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";

type State = ReturnType<Standard70Session["currentAcceptedState"]>;
type Runtime = ReturnType<typeof createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1>;
type Observation = ReturnType<Standard70Session["observe"]>;
// The same typed analysis-fork constructor used by Standard70, restricted to
// this read-only research CLI. No new production restore or model-ID seam.
class AcceptedAuditStateSession extends MainWireIntegratedTypedAuthoritySessionV1 {
  constructor(runtime: Runtime, state: State) {
    super(runtime as unknown as MainWireIntegratedModelRuntimeV3, state,
      "fixed-tbv-protocol-fork", null, undefined, undefined, null, state);
  }
}
const walls = ["LVFW", "SEP", "RVFW"] as const;
const systemicArteries = ["Ao", "SA", "Art"] as const;
const graph = buildNonCoronaryCirculationGraphV1();
function sample(observation: Observation, runtime: Runtime) {
  const step = observation.lastAcceptedStep;
  if (!step) return null;
  const state = observation.acceptedState;
  const trial = step.coronaryStep.baseStep;
  const readback = trial.mechanicsTrial.diagnostics.readback as unknown as MainWireFiveWallLandTriSegReadbackV1;
  const material = state.coronary.mechanics.materialState.wallStateByWall;
  return {
    timeSec: state.acceptedTimeSec,
    nodeVolumesMl: state.coronary.circulation.nodeVolumesMl,
    nodePressuresMmHg: trial.circulationTrial.nodeAbsolutePressuresMmHg,
    ventricularTransmuralPressuresMmHg: trial.mechanicsTrial.transmuralPressuresMmHg,
    walls: Object.fromEntries(walls.map((wall) => {
      const stress = readback.wallMaterialReadbackByWall[wall] as unknown as MainWireNormalAdultWallMaterialReadbackV1;
      if (!stress || !Number.isFinite(stress.landActiveKirchhoffStressPa)) throw new Error("missing wall readback");
      return [wall, {
        landStretch: MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_LAND_SLACK_STRETCH_V1
          * Math.exp(material[wall].previousFiberLogStrain),
        activeStressPa: stress.landActiveKirchhoffStressPa,
        passiveStressPa: stress.totalKirchhoffStressPa - stress.landActiveKirchhoffStressPa - stress.slsOverstressPa,
        slsStressPa: stress.slsOverstressPa,
      }];
    })),
    systemicArterialComplianceMlPerMmHg: Object.fromEntries(systemicArteries.map((node) => {
      const spec = graph.nodes.find((row) => row.name === node)!;
      const tangent = vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1(spec,
        state.coronary.circulation.nodeVolumesMl[node], runtime.runtime.vascular, "fixed-32-iterations");
      return [node, 1 / tangent.dTransmuralPressureDPhysicalVolumeMmHgPerMl];
    })),
  };
}

function collect(session: MainWireIntegratedTypedAuthoritySessionV1, runtime: Runtime) {
  const origin = session.currentAcceptedState().acceptedTimeSec;
  const samples: NonNullable<ReturnType<typeof sample>>[] = [];
  for (let ordinal = 1; ordinal * 0.01 <= 4 * runtime.cycleLengthSec + 0.01; ordinal++) {
    const advance = session.advanceStructuralAnalysisToPresentationTimeV1(origin + ordinal * 0.01);
    if (advance.status !== "advanced") throw new Error(JSON.stringify(advance));
    const point = sample(advance.observation, runtime);
    if (point) samples.push(point);
  }
  const beat = session.observe().completedBeatMetrics!;
  const cycle = samples.filter((row) => row.timeSec >= beat.startTimeSec && row.timeSec < beat.endTimeSec);
  if (cycle.length < 50) throw new Error("incomplete mechanism cycle");
  const mean = (f: (row: typeof cycle[number]) => number) => cycle.reduce((sum, row) => sum + f(row), 0) / cycle.length;
  return { beat, cycle,
    summary: {
      meanSummedSystemicArterialComplianceMlPerMmHg: mean((row) => Object.values(row.systemicArterialComplianceMlPerMmHg).reduce((a, b) => a + b, 0)),
      strokeVolumeOverAoNodePulsePressureMlPerMmHg: beat.valveFlowVolumes.AoV.forwardVolumeMl / beat.pressureSummaries.Ao.pulseMmHg,
      walls: Object.fromEntries(walls.map((wall) => {
        const values = cycle.map((row) => row.walls[wall]!);
        const peak = values.reduce((a, b) => a.activeStressPa > b.activeStressPa ? a : b);
        const activeSum = values.reduce((sum, row) => sum + Math.max(0, row.activeStressPa), 0);
        return [wall, { minimumStretch: Math.min(...values.map((row) => row.landStretch)),
          maximumStretch: Math.max(...values.map((row) => row.landStretch)),
          sampledCycleFractionAtLengthCap: values.filter((row) => row.landStretch >= 1.2).length / values.length,
          activeStressWeightedFractionAtLengthCap: values.reduce((sum, row) => sum
            + (row.landStretch >= 1.2 ? Math.max(0, row.activeStressPa) : 0), 0) / activeSum,
          stretchAtPeakActiveStress: peak.landStretch, peakActiveStressPa: peak.activeStressPa,
        }];
      })),
    },
  };
}

const { values } = parseArgs({ options: { evaluation: { type: "string" }, request: { type: "string" },
  audit: { type: "string" }, output: { type: "string" } } });
if (!values.evaluation || !values.audit || !values.output) throw new Error("--evaluation FILE [--request FILE] --audit V2_AUDIT_RESULT --output NEW_DIRECTORY");
if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) throw new Error("mechanism audit needs committed code");
const raw = JSON.parse(await readFile(values.evaluation, "utf8")) as Evaluation & { evaluation?: Evaluation; inputs?: Inputs };
const evaluation = raw.evaluation ?? raw;
const inputs: Inputs = values.request ? JSON.parse(await readFile(values.request, "utf8")) : raw.inputs!;
const audit = JSON.parse(await readFile(values.audit, "utf8")) as { endState: State;
  protocol: { settlement: string; checkpointSha256: string; hemodynamicResearchInputs: Inputs["hemodynamicResearchInputs"];
    mechanismResearchInputs: Inputs["mechanismResearchInputs"]; ventricularContractilityScale: number } };
if (evaluation.status !== "accepted" || !inputs || ![60, 70].includes(inputs.hemodynamicResearchInputs.heartRateBpm)
  || audit.protocol.settlement !== "v2" || audit.protocol.checkpointSha256 !== evaluation.exactResult.checkpoint.checkpointSha256
  || await sha256CanonicalJsonHex(inputs.hemodynamicResearchInputs) !== await sha256CanonicalJsonHex(audit.protocol.hemodynamicResearchInputs)
  || await sha256CanonicalJsonHex(inputs.mechanismResearchInputs) !== await sha256CanonicalJsonHex(audit.protocol.mechanismResearchInputs)
  || inputs.ventricularContractilityScale !== audit.protocol.ventricularContractilityScale) throw new Error("mismatched accepted audit provenance");
selectHotPathIntegrityTierV1("full-invariant");
const runtime = createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(inputs.hemodynamicResearchInputs,
  inputs.ventricularContractilityScale, inputs.mechanismResearchInputs);
const fixedWindow = audit.endState.coronary.coronaryAutoregulationBinding.windowPolicy;
if (audit.endState.acceptedTimeSec + 4 * runtime.cycleLengthSec + 0.02 >= fixedWindow.originAcceptedTimeSec + fixedWindow.durationSec) {
  throw new Error("mechanism readback would leave the fixed-tone window");
}
const output = resolve(values.output);
await mkdir(output);
const protocol = { executionCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  studyId: "main-wire-standard70-heart-vascular-readback-v1", inputs,
  sourceCheckpointSha256: evaluation.exactResult.checkpoint.checkpointSha256,
  auditPath: resolve(values.audit), auditStateSha256: await sha256CanonicalJsonHex(audit.endState),
  executionTier: "full-invariant", sampleDtSec: 0.01,
  claim: "readback of existing accepted rest and extended high-preload states; not causal identification or an isolated ESPVR fit" };
await writeFile(resolve(output, "protocol.json"), JSON.stringify(protocol, null, 2), { flag: "wx" });
const source = await Standard70Session.restoreStandard70ExactCheckpoint(evaluation.exactResult.checkpoint,
  inputs.hemodynamicResearchInputs, inputs.ventricularContractilityScale, undefined, inputs.mechanismResearchInputs);
const rest = collect(source, runtime);
const high = collect(new AcceptedAuditStateSession(runtime, audit.endState), runtime);
await writeFile(resolve(output, "result.json"), JSON.stringify({ protocol, rest, high, baselineAdopted: false }), { flag: "wx" });
process.stdout.write(`${output}/result.json\n`);
