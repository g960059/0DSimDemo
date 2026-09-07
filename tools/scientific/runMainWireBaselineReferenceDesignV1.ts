import { execFileSync, spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { createHash } from "node:crypto";
import baseline from "@/data/model-baselines/standard70-launch-baseline.json";
import { measureMainWireEjectionShapeDiagnosticsV1 } from "@/analysis/methods/mainWire/MainWireEjectionShapeDiagnosticsV1";
import { readMainWireEjectionMaterialV1, recordMainWireFillingMaterialCycleV1 } from "@/analysis/methods/mainWire/MainWireEjectionMaterialReadbackV1";
import { MAIN_WIRE_BASELINE_REFERENCE_DESIGN_V1, currentMainWireBaselineHeadroomV1,
  mainWireBaselineReferenceScreenV1, baselineRelativeParameterDomainV1,
  assertMainWireBaselineReferenceJobFieldsV1 } from "@/analysis/policies/mainWire/MainWireBaselineReferenceDesignV1";
import { MAIN_WIRE_BASELINE_REFERENCE_RESEARCH_DOMAIN_V1,
  MAIN_WIRE_BASELINE_REFERENCE_INTERVENTION_DOMAIN_V1, MainWireBaselineReferenceResearchSessionV1,
  createMainWireBaselineReferenceResearchV1, type MainWireBaselineReferenceResearchParametersV1,
  type MainWireBaselineReferenceBridgeExitProbeV1,
  type MainWireBaselineReferenceRecruitmentDistortionProbeV1 } from "@/engine/myocardium/experiments/MainWireBaselineReferenceResearchV1";
import { measureMainWireIntegratedModelFormalPreloadReserveV2 } from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { mainWireStandard70PreloadReserveDirectionalResponsePassedV1 } from "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import { MAIN_WIRE_PRELOAD_RESERVE_RESEARCH_SCREEN_V2_ID, screenMainWirePreloadReserveResponseV2 } from "@/analysis/policies/mainWire/MainWirePreloadReserveResearchScreenV2";
import { observeMainWireStandard70TimingAndInletV2 } from "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { MainWireBaselineObservationUnavailableErrorV2 } from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import { MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID, mainWireBaselineCheckBlocksV1, mainWireBaselineCheckWarnsV1 } from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { measureMainWireRelaxationTauV1 } from "@/analysis/methods/mainWire/MainWireRelaxationTauV1";
import { readMainWireBaselinePressureFlowV1 } from "@/analysis/methods/mainWire/MainWireBaselinePressureFlowReadbackV1";
import { compareMainWireRestingReferencesV1 } from "@/analysis/methods/mainWire/MainWireRestingReferenceComparisonV1";
import { MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1_ID } from "@/analysis/registry/MainWireRestingReferenceProfileV1";
import { observeMainWireBaselineV2 } from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import { sha256CanonicalJsonHex, canonicalJsonStringify } from "@/engine/integrity";
import { checkpointMainWireIntegratedModelV3, restoreMainWireIntegratedModelV3 }
  from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { restoreMainWireIntegratedModelStandard70V1 } from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import { MainWireIntegratedModelBeatAccumulatorV3 } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { warmStartMainWireIntegratedModelV3 } from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
import type { MainWireIntegratedModelRuntimeV3 } from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import type { MainWireIntegratedModelMechanismResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import { createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1";
import { createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3 as Fixture,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3 as Sample } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { completeMainWireStandard70TimingAndInletTraceV1,
  measureMainWireIntegratedModelStandard70CandidateEvidenceV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { buildMainWireIntegratedModelStandard70BaselineChecksV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as policy } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 as scales } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { compareMainWireIntegratedModelAcceptedStatesV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { classifyMainWireIntegratedModelPeriodicityV3,
  type MainWireIntegratedModelPeriodicCycleObservationV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";

type Job = Readonly<{ id: string; role: "baseline-candidate" | "intervention";
  parameters: MainWireBaselineReferenceResearchParametersV1;
  heartRateBpm: 60 | 70; totalBloodVolumeMl?: number; systemicResistance?: number;
  ventricularPassiveScale?: number;
  leftAtrialActiveScale?: number;
  pericardialReferenceCapacityScale?: number;
  aorticRootInertanceScale?: 0 | 1;
  mechanismTrace?: boolean;
  ventricularCalciumTimeScale?: number;
  ventricularCalciumRiseFraction?: number;
  ventricularAeff?: 25 | 26.5;
  ventricularDiastolicCalciumUM?: .11 | .13 | .164321;
  ventricularPeakCalciumUM?: number;
  ventricularLandSlackStretch?: 1 | 1.06 | 1.07 | 1.09;
  ventricularKineticRestoration?: "none" | "kuw" | "kws" | "both";
  ventricularBridgeExit?: MainWireBaselineReferenceBridgeExitProbeV1;
  ventricularRecruitmentDistortion?: MainWireBaselineReferenceRecruitmentDistortionProbeV1;
  ventricularLengthSensitivityScale?: .8 | 1;
  ventricularAffinityCalibration?: Readonly<{ caT50RefUM: number; beta1UM: number }>;
  initialization?: "cold" | "published-reference-continuation"; preloadReserve?: boolean }>;
const { values } = parseArgs({ options: { output: { type: "string" }, job: { type: "string" },
  jobs: { type: "string" }, workers: { type: "string", default: "4" },
  "dt-sec": { type: "string", default: ".002" }, "max-cycles": { type: "string", default: "250" },
  tier: { type: "string", default: "hot-path-lean" } } });
const output = resolve(values.output ?? "");
const dt = Number(values["dt-sec"]), maxCycles = Number(values["max-cycles"]);
if (!values.output || ![.002, .001].includes(dt) || !Number.isInteger(maxCycles)
  || maxCycles < 3 || maxCycles > policy.maximumCycleCount
  || !["hot-path-lean", "full-invariant"].includes(values.tier!)) {
  throw new Error("--output NEW_PATH [--jobs JSON_ARRAY] [--workers 1..8] [--dt-sec .002|.001] [--max-cycles 3..250] [--tier hot-path-lean|full-invariant]");
}
selectHotPathIntegrityTierV1(values.tier as "hot-path-lean" | "full-invariant");
const sha = (x: string) => createHash("sha256").update(x).digest("hex");
const write = (path: string, x: unknown) => writeFile(path, `${JSON.stringify(x, null, 2)}\n`, { flag: "wx" });

async function evaluate(job: Job) {
  const started = performance.now();
  let completedCycleCount = 0;
  const sourceInputs = baseline.candidateInputs;
  const source = createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(
    sourceInputs.hemodynamicResearchInputs, 1,
    sourceInputs.mechanismResearchInputs as MainWireIntegratedModelMechanismResearchInputsV3);
  const restored = await restoreMainWireIntegratedModelStandard70V1({
    base: { ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(source),
      mechanismResearchInputs: source.mechanismResearchInputs },
    algebraicPulmonaryRootAssemblyId: source.algebraicPulmonaryRootAssemblyId,
  }, baseline.qualificationCheckpoint);
  const mechanics = sourceInputs.mechanismResearchInputs.chamberMechanics;
  const target = createMainWireBaselineReferenceResearchV1({
    hemodynamicResearchInputs: { ...sourceInputs.hemodynamicResearchInputs,
      heartRateBpm: job.heartRateBpm,
      totalBloodVolumeMl: job.totalBloodVolumeMl ?? sourceInputs.hemodynamicResearchInputs.totalBloodVolumeMl,
      systemicResistance: job.systemicResistance ?? sourceInputs.hemodynamicResearchInputs.systemicResistance },
    mechanismResearchInputs: { ...sourceInputs.mechanismResearchInputs,
      pericardium: { ...sourceInputs.mechanismResearchInputs.pericardium,
        ...(job.pericardialReferenceCapacityScale === undefined ? {} : {
          referenceCapacityScale: job.pericardialReferenceCapacityScale }) },
      chamberMechanics: { ...mechanics,
        activeTensionScaleByWall: { ...mechanics.activeTensionScaleByWall, LVFW: 1, SEP: 1, RVFW: 1,
          ...(job.leftAtrialActiveScale === undefined ? {} : { LA: job.leftAtrialActiveScale }) },
        passiveStiffnessScaleByWall: { ...mechanics.passiveStiffnessScaleByWall,
          ...(job.ventricularPassiveScale === undefined ? {} : {
            LVFW: job.ventricularPassiveScale, SEP: job.ventricularPassiveScale, RVFW: job.ventricularPassiveScale }) } },
    } as MainWireIntegratedModelMechanismResearchInputsV3,
    parameters: job.parameters,
    admissionRole: job.role,
    aorticRootInertanceScale: job.aorticRootInertanceScale,
    ventricularCalciumTimeScale: job.ventricularCalciumTimeScale,
    ventricularCalciumRiseFraction: job.ventricularCalciumRiseFraction,
    ventricularAeff: job.ventricularAeff,
    ventricularDiastolicCalciumUM: job.ventricularDiastolicCalciumUM,
    ventricularPeakCalciumUM: job.ventricularPeakCalciumUM,
    ventricularLandSlackStretch: job.ventricularLandSlackStretch,
    ventricularKineticRestoration: job.ventricularKineticRestoration,
    ventricularBridgeExit: job.ventricularBridgeExit,
    ventricularRecruitmentDistortion: job.ventricularRecruitmentDistortion,
    ventricularLengthSensitivityScale: job.ventricularLengthSensitivityScale,
    ventricularAffinityCalibration: job.ventricularAffinityCalibration,
  });
  const fixture = target as unknown as Fixture;
  const construction = { researchConstructionId: target.researchConstructionId,
    researchParameterIdentity: target.researchParameterIdentity, parameters: target.researchParameters,
    hemodynamicResearchInputs: target.hemodynamicResearchInputs,
    mechanismResearchInputs: target.mechanismResearchInputs, claim: target.researchClaim,
    providerParameterIdentityHash: target.provider.parameterIdentityHash,
    aorticRootInertanceScale: target.researchAorticRootInertanceScale,
    ventricularCalciumTimeScale: target.researchCalciumTimeScale,
    ventricularCalciumRiseFraction: target.researchCalciumRiseFraction,
    ventricularAeff: target.researchVentricularAeff,
    ventricularDiastolicCalciumUM: target.researchDiastolicCalciumUM,
    ...(target.researchPeakCalciumUM === undefined ? {} : { ventricularPeakCalciumUM: target.researchPeakCalciumUM }),
    ventricularLandSlackStretch: target.researchLandSlackStretch,
    ventricularKineticRestoration: target.researchKineticRestoration,
    ventricularBridgeExit: target.researchBridgeExit,
    ventricularRecruitmentDistortion: target.researchRecruitmentDistortion,
    ventricularLengthSensitivityScale: target.researchLengthSensitivityScale,
    ...(target.researchAffinityCalibration === undefined ? {} : {
      ventricularAffinityCalibration: target.researchAffinityCalibration }),
    landParameters: target.researchLandParameters,
    calciumDriveParams: target.coronaryStepInput.calciumDriveParams,
    calciumEventParametersByWall: target.rhythm.configuration.calciumParametersByWall,
    runtime: target.runtime };
  const calciumChanged = !target.researchClaim.calciumSourceFitRetained;
  const initialization = job.initialization ?? (calciumChanged ? "cold" : "published-reference-continuation");
  if (calciumChanged && initialization !== "cold") throw new Error("changed Ca source requires its own cold event-memory initialization");
  if (!["cold", "published-reference-continuation"].includes(initialization)) throw new Error("unsupported initialization");
  const protocolIdentityHash = await sha256CanonicalJsonHex({ construction, policy, scales, dt, initialization,
    reserveNumericalProtocol: "research-fork-inherits-requested-step-v2",
    reserveResearchScreenId: MAIN_WIRE_PRELOAD_RESERVE_RESEARCH_SCREEN_V2_ID,
    restingReferenceProfileId: MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1_ID,
    sourceCheckpointSha256: baseline.qualificationCheckpoint.checkpointSha256 });
  const classifierOptions = { period1NormalizedTolerance: policy.period1NormalizedTolerance,
    period2NormalizedTolerance: policy.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta: policy.period2MinimumPeriod1NormalizedDelta,
    consecutiveCycles: policy.consecutiveCycles };
  let accepted = initialization === "cold" ? target.cold.acceptedState : warmStartMainWireIntegratedModelV3({ source: restored.acceptedState,
    sourceRuntime: source as unknown as MainWireIntegratedModelRuntimeV3,
    targetRuntime: target as unknown as MainWireIntegratedModelRuntimeV3 });
  const initialAcceptedTimeSec = accepted.acceptedTimeSec;
  const boundaries = [accepted], observations: MainWireIntegratedModelPeriodicCycleObservationV3[] = [];
  const accumulator = new MainWireIntegratedModelBeatAccumulatorV3();
  let beat = initialization === "cold" ? null : restored.completedBeatMetrics;
  let trace: readonly Sample[] = [];
  let classification = classifyMainWireIntegratedModelPeriodicityV3([], classifierOptions);
  const cycleEvidence: unknown[] = [];
  try {
    for (let cycle = 1; cycle <= maxCycles; cycle++) {
      const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(fixture, accepted, cycle, dt,
        step => { beat = accumulator.accept(step) ?? beat; });
      accepted = run.terminalAcceptedState;
      const period1 = compareMainWireIntegratedModelAcceptedStatesV3(accepted, boundaries.at(-1)!, scales, fixture.config);
      const period2 = boundaries.length < 2 ? null
        : compareMainWireIntegratedModelAcceptedStatesV3(accepted, boundaries.at(-2)!, scales, fixture.config);
      observations.push({ cycleIndex: cycle, evidenceRole: "canonical-periodic-protocol", protocolIdentityHash, period1, period2 });
      classification = classifyMainWireIntegratedModelPeriodicityV3(observations, classifierOptions);
      if (observations.length > policy.consecutiveCycles) observations.shift();
      cycleEvidence.push({ cycle, period1: period1.overall.maximumNormalizedDelta,
        period2: period2?.overall.maximumNormalizedDelta ?? null,
        globalVolumeErrorMl: run.maximumGlobalTotalBloodVolumeErrorMl,
        coronaryLedgerErrorMl: run.maximumCoronaryBloodVolumeLedgerResidualMl,
        allOff: run.allDynamicMcsAcceptedFlowsExactlyZero,
        composedCalciumOwner: run.oneComposedCalciumOwnerOnly,
        atrialCaptureCount: run.acceptedAtrialCaptureIds.length,
        ventricularCaptureCount: run.acceptedVentricularCaptureIds.length });
      trace = run.traceSamples;
      boundaries.push(accepted); if (boundaries.length > 3) boundaries.shift();
      completedCycleCount = cycle;
      if (classification.status !== "not-converged") break;
    }
    if (beat === null || beat.endTimeSec <= initialAcceptedTimeSec) {
      throw new Error("research candidate has no own complete beat");
    }
    const timingWindow = completeMainWireStandard70TimingAndInletTraceV1({ terminalTrace: trace,
      completedBeatEndTimeSec: beat.endTimeSec,
      runLookaheadCycle: () => runMainWireIntegratedModelRegularSinusAllOffCycleV3(
        fixture, accepted, completedCycleCount + 1, dt).traceSamples });
    const measurements = measureMainWireIntegratedModelStandard70CandidateEvidenceV1({
      terminalTrace: trace, completedBeat: beat, ...timingWindow,
      timingAndInletObserver: observeMainWireStandard70TimingAndInletV2 });
    const checks = buildMainWireIntegratedModelStandard70BaselineChecksV1(measurements,
      classification.status === "period1-converged");
    const relaxationTau = measureMainWireRelaxationTauV1(timingWindow.timingAndInletTrace,
      observeMainWireBaselineV2({ samples: timingWindow.timingAndInletTrace, completedBeat: beat }).left.events);
    const restWallTimeMs = performance.now() - started;
    let ejectionShape: unknown;
    try { ejectionShape = { status: "measured", ...measureMainWireEjectionShapeDiagnosticsV1(trace) }; }
    catch (error) { ejectionShape = { status: "unresolved", error: String(error) }; }
    let mechanismReplay: unknown = { status: "not-requested" };
    if (job.mechanismTrace && classification.status === "period1-converged") {
      const details: ReturnType<typeof readMainWireEjectionMaterialV1>[] = [];
      const replay = runMainWireIntegratedModelRegularSinusAllOffCycleV3(fixture, accepted,
        completedCycleCount + 1, dt, step => {
          details.push(readMainWireEjectionMaterialV1(step, target.researchLandSlackStretch));
        });
      const closure = compareMainWireIntegratedModelAcceptedStatesV3(replay.terminalAcceptedState, accepted, scales, fixture.config);
      if (closure.overall.maximumNormalizedDelta > policy.period1NormalizedTolerance) {
        throw new Error("material diagnostic replay left the period-1 tolerance");
      }
      mechanismReplay = { status: "measured", role: "one-additional-settled-cycle-read-only-projection",
        period1Closure: closure.overall.maximumNormalizedDelta,
        samples: replay.traceSamples.map((sample, i) => {
          if (sample.acceptedTimeSec !== details[i]?.acceptedTimeSec) throw new Error("material readback clock mismatch");
          return { ...sample, material: details[i] };
        }) };
    }
    let preloadReserve: unknown = { status: "not-requested" };
    if (job.preloadReserve) {
      const reserveStarted = performance.now();
      if (classification.status !== "period1-converged") {
        preloadReserve = { status: "not-run-nonsettled-center" };
      } else try {
        const branches: MainWireBaselineReferenceResearchSessionV1[] = [];
        const measurement = await measureMainWireIntegratedModelFormalPreloadReserveV2(
          new MainWireBaselineReferenceResearchSessionV1(target, accepted,
            job.mechanismTrace ? branch => branches.push(branch) : undefined, dt), target.hemodynamicResearchInputs);
        const responseChecks = (["left", "right"] as const).flatMap(side =>
          (["hypovolemic", "hypervolemic"] as const).map(direction => ({ side, direction,
            passed: mainWireStandard70PreloadReserveDirectionalResponsePassedV1(measurement[side][direction]) })));
        let phaseReadback: unknown = { status: "not-requested" };
        if (job.mechanismTrace) {
          try {
            const endpoints = Object.fromEntries((["center", "hypovolemic", "hypervolemic"] as const).map(label => {
              const tbv = label === "center" ? measurement.sourceGlobalTbvMl
                : label === "hypovolemic" ? measurement.hypovolemicGlobalTbvMl : measurement.hypervolemicGlobalTbvMl;
              const branch = branches.slice().reverse().find(b => Math.abs(b.currentAcceptedState().coronary.fixedGlobalTotalBloodVolumeMl - tbv) < 1e-8
                && b.observe().completedBeatMetrics !== null);
              if (!branch) throw new Error(`qualified ${label} branch not retained`);
              const state = branch.currentAcceptedState();
              const before = researchReadbackStateDigest(state);
              const copy = new MainWireBaselineReferenceResearchSessionV1(target, state, undefined, dt);
              const readback = recordMainWireFillingMaterialCycleV1(copy, target.researchLandSlackStretch, target.cycleLengthSec, dt);
              if (researchReadbackStateDigest(branch.currentAcceptedState()) !== before) throw new Error("readback mutated its retained anchor");
              return [label, { globalTbvMl: tbv, sourceStateIdentity: before,
                qualifiedEndpointBeat: branch.observe().completedBeatMetrics, ...readback }];
            }));
            phaseReadback = { status: "measured", endpoints };
          } catch (error) { phaseReadback = { status: "unresolved", error: String(error) }; }
        }
        preloadReserve = { status: responseChecks.every(c => c.passed) ? "passed" : "failed-response",
          prospectiveResearchScreen: (["left", "right"] as const).flatMap(side =>
            (["hypovolemic", "hypervolemic"] as const).map(direction => ({ side, direction,
              ...screenMainWirePreloadReserveResponseV2(measurement[side][direction]) }))),
          phaseReadback,
          responseChecks, measurement, nominalDtSec: dt,
          numericalProtocol: "research-fork-inherits-requested-step-v2",
          wallTimeMs: performance.now() - reserveStarted,
          scope: "existing-reservoir-settled-fixed-coronary-tone-protocol-on-research-construction-not-published-model-admission" };
      } catch (error) {
        preloadReserve = { status: "unresolved", nominalDtSec: dt, wallTimeMs: performance.now() - reserveStarted,
          error: error instanceof Error ? error.message : String(error) };
      }
    }
    const checkpointContext = createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(fixture);
    const researchCheckpoint = await checkpointMainWireIntegratedModelV3(checkpointContext, accepted);
    const roundtrip = await restoreMainWireIntegratedModelV3(checkpointContext, researchCheckpoint);
    if (canonicalJsonStringify(researchCheckpoint) !== canonicalJsonStringify(
      await checkpointMainWireIntegratedModelV3(checkpointContext, roundtrip))) {
      throw new Error("research construction checkpoint roundtrip mismatch");
    }
    return { job, construction, protocolIdentityHash, nominalDtSec: dt,
      evaluationPolicyId: MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID,
      executionTier: values.tier, initialization, initialAcceptedTimeSec,
      status: classification.status === "period1-converged" ? "settled" : "nonsettled",
      completedCycleCount, restWallTimeMs, wallTimeMs: performance.now() - started, classification,
      measurements, checks, failedRestChecks: checks.filter(mainWireBaselineCheckBlocksV1).map(c => c.checkId),
      relaxationTau, supplementalPhysiologyStatus: relaxationTau.status === "measured" ? "observed" : "unresolved",
      pressureFlowReadback: readMainWireBaselinePressureFlowV1(beat, measurements.cardiacSizeAndFunction.bodySurfaceAreaM2),
      restingReferenceComparison: compareMainWireRestingReferencesV1(beat, measurements.cardiacSizeAndFunction.bodySurfaceAreaM2),
      referenceWarnings: checks.filter(mainWireBaselineCheckWarnsV1).map(c => c.checkId),
      restChecksAreInterventionAcceptance: false, completedBeat: beat, terminalTrace: trace,
      ejectionShape,
      mechanismReplay,
      ...timingWindow, cycleEvidence, preloadReserve,
      researchCheckpoint, checkpointExactRoundtripVerified: true,
      checkpointScope: "own research construction only; not a public Standard70 checkpoint",
      baselineAdopted: false, publishedCheckpointExported: false };
  } catch (error) {
    return { job, construction, protocolIdentityHash, nominalDtSec: dt,
      evaluationPolicyId: MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID, executionTier: values.tier,
      initialization, initialAcceptedTimeSec,
      status: error instanceof MainWireBaselineObservationUnavailableErrorV2 ? "observation-unresolved" : "numerical-or-observation-unresolved",
      observationFailure: error instanceof MainWireBaselineObservationUnavailableErrorV2
        ? { code: error.code, side: error.side } : null,
      completedCycleCount, classification, cycleEvidence, wallTimeMs: performance.now() - started,
      completedBeat: beat, terminalTrace: trace,
      partialEvidenceOnly: true, publishedCheckpointExported: false,
      error: error instanceof Error ? error.message : String(error), baselineAdopted: false };
  }
}

function researchReadbackStateDigest(state: unknown) {
  return sha(JSON.stringify(state, (_key, value) => ArrayBuffer.isView(value) ? Array.from(value as unknown as number[]) : value));
}

if (values.job) {
  const job = JSON.parse(await readFile(values.job, "utf8")) as Job;
  assertMainWireBaselineReferenceJobFieldsV1(job);
  const started = performance.now();
  const result = await evaluate(job).catch(error => ({ job, status: "initialization-rejected",
    completedCycleCount: 0, wallTimeMs: performance.now() - started,
    error: error instanceof Error ? error.message : String(error) }));
  await write(output, result);
  process.stdout.write(`${job.id}: ${result.status}; ${result.completedCycleCount} cycles; ${(result.wallTimeMs / 1000).toFixed(1)} s\n`);
} else {
  const workers = Number(values.workers);
  if (!Number.isInteger(workers) || workers < 1 || workers > 8) throw new Error("workers must be 1..8");
  const jobs: Job[] = values.jobs ? JSON.parse(await readFile(values.jobs, "utf8")) : mainWireBaselineReferenceScreenV1();
  if (!Array.isArray(jobs) || !jobs.length) throw new Error("jobs must be a nonempty array");
  jobs.forEach(assertMainWireBaselineReferenceJobFieldsV1);
  if (new Set(jobs.map(j => j.id)).size !== jobs.length
    || jobs.some(j => !/^[a-zA-Z0-9._-]+$/.test(j.id))) throw new Error("jobs need distinct safe IDs");
  await mkdir(output);
  const sources = ["tools/scientific/runMainWireBaselineReferenceDesignV1.ts",
    "analysis/policies/mainWire/MainWireBaselineReferenceDesignV1.ts",
    "engine/myocardium/experiments/MainWireBaselineReferenceResearchV1.ts",
    "engine/core/circulationGraphKernelV1.ts", "engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1.ts",
    "engine/core/nonCoronaryCirculationBackwardEulerV1.ts",
    "engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1.ts",
    "engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1.ts",
    "data/physiology/main-wire-normal-reference-evidence-v1.json",
    "analysis/policies/mainWire/MainWireBaselineGateRolesV1.ts",
    "analysis/methods/mainWire/MainWireBaselineConditioningAuditV1.ts"];
  sources.push("analysis/methods/mainWire/MainWireEjectionShapeDiagnosticsV1.ts");
  sources.push("analysis/methods/mainWire/MainWireBaselinePressureFlowReadbackV1.ts");
  sources.push("analysis/methods/mainWire/MainWireRestingReferenceComparisonV1.ts");
  sources.push("analysis/registry/MainWireRestingReferenceProfileV1.ts");
  sources.push("analysis/methods/mainWire/MainWireRelaxationTauV1.ts");
  sources.push("analysis/methods/mainWire/MainWireBaselineObservationV2.ts");
  sources.push("analysis/methods/mainWire/MainWireEjectionMaterialReadbackV1.ts");
  sources.push("analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3.ts");
  sources.push("analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1.ts");
  sources.push("analysis/policies/mainWire/MainWirePreloadReserveResearchScreenV2.ts");
  sources.push("engine/vnext/MainWireIntegratedTypedAuthoritySessionV1.ts");
  sources.push("engine/myocardium/myofilament/land2017/strongBridgeDeactivationExitV1.ts");
  sources.push("engine/myocardium/myofilament/land2017/parameterSets.ts");
  sources.push("engine/myocardium/calcium/fiveWallNormalCalciumDriveV1.ts");
  sources.push("engine/myocardium/calcium/exactEventPrescribedCalciumV1.ts");
  sources.push("engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1.ts");
  sources.push("engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1.ts");
  sources.push("engine/myocardium/calcium/MainWireVentricularCalciumSourceFitAnchorV1.ts");
  const sourceTexts: Record<string, string> = Object.fromEntries(
    await Promise.all(sources.map(async p => [p, await readFile(p, "utf8")] as const)));
  await write(`${output}/source-snapshot.json`, sourceTexts);
  await write(`${output}/protocol.json`, { policy: MAIN_WIRE_BASELINE_REFERENCE_DESIGN_V1, jobs,
    evaluationPolicyId: MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID,
    currentPublishedHeadroom: currentMainWireBaselineHeadroomV1(), nominalDtSec: dt, maxCycles,
    executionTier: values.tier, executionCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    workingTreeDirty: Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()),
    sourceCheckpointSha256: baseline.qualificationCheckpoint.checkpointSha256,
    sourceBaselineFileSha256: sha(await readFile("data/model-baselines/standard70-launch-baseline.json", "utf8")),
    sources: Object.fromEntries(Object.entries(sourceTexts).map(([p, t]) => [p, sha(t)])),
    myocardialProbeScope: "optional Ca time/rise-shape/floor, Land reference-stretch including removal of the extra multiplier, source-Aeff, isolated source-kuw/kws restorations, bounded kws/phi or fixed-reference length sensitivity and existing bridge-exit ablations are separate from the source-locked baseline fit policy; exact construction owns all changes",
    userClinicalNormalityClaimed: false, baselineAdoption: false });
  let cursor = 0;
  const failures: unknown[] = [];
  const started = performance.now();
  await Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++]!;
      await write(`${output}/${job.id}.request.json`, job);
      const exitCode = await new Promise<number | null>((resolveExit, reject) => {
        const child = spawn(process.execPath, [resolve("node_modules/vite-node/vite-node.mjs"), "--script",
          resolve("tools/scientific/runMainWireBaselineReferenceDesignV1.ts"),
          "--job", `${output}/${job.id}.request.json`, "--output", `${output}/${job.id}.result.json`,
          "--dt-sec", String(dt), "--max-cycles", String(maxCycles), "--tier", values.tier!], { stdio: "inherit" });
        child.on("error", reject); child.on("exit", resolveExit);
      });
      if (exitCode !== 0) failures.push({ job: job.id, exitCode });
    }
  }));
  const results = await Promise.all(jobs.map(async job => {
    try {
      const r = JSON.parse(await readFile(`${output}/${job.id}.result.json`, "utf8"));
      const m = r.measurements;
      const range = (job.role === "intervention" ? MAIN_WIRE_BASELINE_REFERENCE_INTERVENTION_DOMAIN_V1
        : MAIN_WIRE_BASELINE_REFERENCE_RESEARCH_DOMAIN_V1).ventricularTrefPa;
      return { job, status: r.status, cycles: r.completedCycleCount, wallTimeMs: r.wallTimeMs,
        failedRestChecks: r.failedRestChecks, referenceWarnings: r.referenceWarnings, error: r.error,
        preloadReserve: r.preloadReserve,
        ejectionShape: r.ejectionShape,
        researchDomainHeadroom: baselineRelativeParameterDomainV1(job.parameters.ventricularTrefPa, range.minimum, range.maximum),
        AoP: m?.hemodynamicPressure.aortic, AoMean: r.completedBeat?.meanAorticPressureMmHg,
        AoPulse: r.completedBeat?.pulseAorticPressureMmHg,
        CI: m?.cardiacSizeAndFunction.systemicForwardFlow.cardiacIndexLPerMinPerM2,
        CO: m?.cardiacSizeAndFunction.systemicForwardFlow.cardiacOutputLPerMin,
        LVEF: m?.cardiacSizeAndFunction.leftVentricle.ejectionFraction01,
        EDV: m?.cardiacSizeAndFunction.leftVentricle.endDiastolicVolumeMl,
        ESV: m?.cardiacSizeAndFunction.leftVentricle.endSystolicVolumeMl,
        PCWP: m?.hemodynamicPressure.pcwpSurrogateMeanMmHg,
        CVP: m?.hemodynamicPressure.centralVenousMeanMmHg, AV: m?.aorticValve,
        timing: m?.timing, EA: m?.mitralFlow.peakEToA, dpdt: m?.leftVentricle, LVP: m?.LVP, RVP: m?.RVP };
    } catch (error) { return { job, status: "operational-failure", error: String(error) }; }
  }));
  await write(`${output}/summary.json`, { wallTimeMs: performance.now() - started, failures, results,
    scope: "research-candidates-not-published-Standard70-evaluations; resting-corridors-are-reported-separately-for-interventions" });
  process.stdout.write(`${output}/summary.json\n`);
  // A gracefully terminated worker may exit0 without producing its result.
  // Do not let a missing/unreadable observation masquerade as batch success.
  if (failures.length || results.some(result => result.status === "operational-failure")) process.exitCode = 1;
}
