import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { build } from "vite";
import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { executeMainWireStandard72FittingCandidateV1 as execute,
  type MainWireStandard72BaselineCalibrationRequestV1 as Request } from "@/analysis/methods/mainWire/MainWireStandard72BaselineCalibrationEvaluatorV1";
import { observeMainWireHfrefV1 as observe } from "@/analysis/methods/mainWire/MainWireHfrefObservationV1";
import { assessMainWireHfrefRestV1 as assess } from "@/analysis/policies/mainWire/MainWireHfrefReferenceV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { MAIN_WIRE_FITTING_SEED_V1 as seed } from "@/analysis/registry/MainWireFittingSeedV1";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import { MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1 as template,
  createMainWireIntegratedStudioStandard72CoreReleaseV1 as factory } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioHfrefResearchSurfaceV1";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveMainWireAnalysisMethodsForSurfaceV1 as methods } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID, type ScenarioCaptureV2 } from "@/studio/contracts/v2/content";
import { importExactExecutableArtifactModuleV2 } from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import { runFittingJsonWorkersV1, readFittingWorkerStdinV1 } from "./runFittingJsonWorkersV1";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";
import { applyMainWireIntegratedStudioRoundedEjectionControlV1 as apply } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionControlsV1";
import { MAIN_WIRE_STANDARD71_CONTROL_BY_ID_V1 as controls } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard71ControlsV1";

selectHotPathIntegrityTierV1("hot-path-lean");
const group = "myocardium.lv-contractility";
const candidate = (active: number) => ({ ...seed.candidateInputs, mechanismResearchInputs: {
  ...seed.candidateInputs.mechanismResearchInputs, chamberMechanics: {
    ...seed.candidateInputs.mechanismResearchInputs.chamberMechanics, activeTensionScaleByWall: {
      ...seed.candidateInputs.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall, LVFW: active, SEP: active } } } });
const reference = resolveMainWireFittingReferenceV1("hfref-lv-systolic-v1");
async function evaluate(request: Request) {
  const evaluation = await execute({ ...request, retainTerminalDiagnostics: true, abortSignal: AbortSignal.timeout(180_000) });
  let observation = null, issue = null;
  if (evaluation.status === "accepted") try { observation = observe(evaluation); }
  catch (error) { issue = String(error); }
  return { evaluation, observation, issue, assessment: observation ? assess(observation.values) : null };
}
type Result = Awaited<ReturnType<typeof evaluate>>;
function accepted(result: Result) {
  if (result.evaluation.status !== "accepted" || !result.observation) throw new Error(`Exact candidate unavailable: ${result.issue ?? result.evaluation.status}`);
  return result.evaluation;
}
const same = (a: unknown, b: unknown, label: string) => { if (canonical(a) !== canonical(b)) throw new Error(`Parity failed: ${label}`); };

async function launch(result: Result): Promise<ScenarioCaptureV2> {
  const r = accepted(result), c = r.candidateInputs;
  const session = await Session.restoreStandard72ExactCheckpoint(r.checkpoint, c.hemodynamicResearchInputs, 1, undefined, c.mechanismResearchInputs);
  const before = session.currentAcceptedState().acceptedTimeSec, aligned = Math.ceil((before-1e-12)/.002)*.002;
  if (aligned > before + 1e-12) session.advanceToPresentationTimeWithSelectedOutputProjectionV1(aligned, []);
  const checkpoint = await session.checkpointStandard72Exact();
  same(checkpoint.baseStandardCheckpointV2.completedBeatMetrics, r.diagnostics!.completedBeat, "launch retained beat");
  return { fixture: { ...template, hemodynamicResearchInputs: c.hemodynamicResearchInputs,
    mechanismResearchInputs: c.mechanismResearchInputs }, checkpoint: { acceptedTimeSec: checkpoint.acceptedTimeSec,
    acceptedRevision: checkpoint.revision, payload: checkpoint as never } };
}

async function main() {
  if (process.argv.includes("--worker")) {
    process.stdout.write(JSON.stringify(await evaluate(await readFittingWorkerStdinV1() as Request))+"\n"); return;
  }
  const output = resolve(process.argv[2] ?? "artifacts/hfref-domain-v1/route-001"); await mkdir(output);
  const source = await beginFittingSourceSnapshotV1(join(output,"execution"));
  const files: string[] = [], started = performance.now();
  const save = async (name: string, value: unknown) => { const p=join(output,name); await writeFile(p,JSON.stringify(value,null,2)+"\n",{flag:"wx"});files.push(p); };
  const coldCases = [
    { name:"baseline-cold-2ms", request:{candidateInputs:candidate(1),nominalDtSec:.002 as const} },
    { name:"hfref-cold-2ms", request:{candidateInputs:candidate(.35),nominalDtSec:.002 as const} },
    { name:"hfref-cold-1ms", request:{candidateInputs:candidate(.35),nominalDtSec:.001 as const} },
  ];
  await save("plan.json", { coldCases, reference, referenceSha256:await hash(reference), sourceSha256:source.sourceSha256,
    operationRoutes:[[1,.35,1],[1,.75,.5,.35]], boundaryOperations:[group+"=.25",group+"=1.33","LVFW=.25","SEP=.25"],
    numericalComparison:{efPercentagePoints:.5,indexedVolumesAndCiFraction:.01,meanPressuresMmHg:.5},
    noClinicalValidation:true,noPublication:true });
  const cold = await runFittingJsonWorkersV1<Result>({concurrency:3,scriptPath:fileURLToPath(import.meta.url),
    jobs:coldCases.map(c=>({args:["--worker"],input:canonical(c.request)}))});
  for(let i=0;i<cold.length;i++) {accepted(cold[i]!);await save(`${coldCases[i]!.name}.json`,cold[i]);}
  if (!cold[1]!.assessment?.screenPassed || !cold[2]!.assessment?.screenPassed) throw new Error("Disease screen failed");
  const baselineCapture=await launch(cold[0]!), diseaseCapture=await launch(cold[1]!);
  const release=factory(), adapter=release.executables.simulationAdapter;
  const model=composeStandardModelContractV1(release.manifest,surface,methods(surface).capabilities).contract;
  const identity={runtimeSessionId:"research-route",scenarioId:"subject"};
  let sessionNumber=0;
  async function capture(epoch:number, fixture:ScenarioCaptureV2["fixture"], runtimeSessionId=identity.runtimeSessionId) {
    const r=await release.executables.experimentCapture.captureAcceptedCandidate({experimentId:"research/control-route",model,
      desiredContent:{modelId:model.modelId,surfaceSeriesId:surface.surfaceSeriesId,
        scenarios:[{scenarioId:identity.scenarioId,label:"route",fixture}],surface:{graphPanes:[],outputPanes:[],controlPanes:[],note:{text:""}}},
      correlation:{runtimeSessionId,scenarios:[{scenarioId:identity.scenarioId,expectedInputEpoch:epoch}]}});
    return r.content.scenarios[0]!.capture;
  }
  async function create(c:ScenarioCaptureV2, prefix?:string) {
    const runtimeSessionId=`${prefix??"research-route"}/${++sessionNumber}`;
    if(prefix===undefined)identity.runtimeSessionId=runtimeSessionId;
    await adapter.createSession({runtimeSessionId,scenarios:[{scenarioId:identity.scenarioId,...c}]});
    return runtimeSessionId;
  }
  const comparisons:unknown[]=[];
  function compare(a:Result,b:Result,name:string) {
    const av=a.observation!.values,bv=b.observation!.values;
    const rows=["lvef","rvef","lvedvi","lvesvi","rvedvi","rvesvi","ci","meanLa","meanRa","meanPap","meanAo"].map(key=>{
      const x=av[key]!,y=bv[key]!, tolerance=key.endsWith("ef")?.005:key.startsWith("mean")?.5:Math.abs(y)*.01;
      return {key,actual:x,reference:y,tolerance,difference:Math.abs(x-y),passed:Math.abs(x-y)<=tolerance}; });
    if(rows.some(r=>!r.passed))throw new Error(`Settled comparison failed: ${name}`);
    comparisons.push({name,rows,eventTimingMs:{actual:av.etMs,reference:bv.etMs},
      flowImbalanceLPerMin:av.pulmonaryMinusAorticNetFlowLPerMin});
  }
  compare(cold[2]!,cold[1]!,"independent-cold-half-step");
  await create(baselineCapture);
  let epoch=0, routeCapture=baselineCapture;
  for(const [active,name,referenceResult]of [[.35,"baseline-to-hfref",cold[1]],[1,"hfref-to-baseline",cold[0]]] as const) {
    const target=active===1?baselineCapture:diseaseCapture;
    const frame=await adapter.applyControl({...identity,controlId:group,value:active,expectedInputEpoch:epoch});epoch=frame.inputEpoch;
    routeCapture=await capture(epoch,target.fixture);
    same(routeCapture.fixture,target.fixture,`${name} fixture`);
    // JSON capture/reload through the real adapter preserves numerical history.
    const reloadId=await create(JSON.parse(JSON.stringify(routeCapture)),"reload");
    for(let k=0;k<12;k++) {
      const a=await adapter.advanceOnePresentationStep(identity),b=await adapter.advanceOnePresentationStep({...identity,runtimeSessionId:reloadId});
      same(a.outputs,b.outputs,`${name} reloaded outputs ${k}`);same(a.acceptedTimeSec,b.acceptedTimeSec,"reload clock");
    }
    adapter.disposeSession(reloadId);routeCapture=await capture(epoch,target.fixture);
    const r=await evaluate({candidateInputs:candidate(active),initialization:{kind:"standard72-exact-checkpoint",
      checkpoint:routeCapture.checkpoint.payload as never,sourceNominalDtSec:.002}});
    accepted(r);compare(r,referenceResult!,name);await save(`${name}.json`,r);
    adapter.disposeSession(identity.runtimeSessionId);routeCapture=await launch(r);await create(routeCapture);epoch=0;
  }
  adapter.disposeSession(identity.runtimeSessionId);
  // Each branch starts from an owned baseline; no partial input commit on rejection.
  const boundaryResults=[];
  for(const [id,value]of [[group,.25],[group,1.33],["myocardium.active-tension-scale.LVFW",.25],["myocardium.active-tension-scale.SEP",.25]] as const) {
    await create(baselineCapture);const before=adapter.currentFrame(identity);let outcome:string;
    try {await adapter.applyControl({...identity,controlId:id,value,expectedInputEpoch:0});
      for(let k=0;k<12;k++)await adapter.advancePresentationBatch({...identity,stepCount:200,presentationOutputIds:[]});
      outcome="evolved-4.8-s";
    }catch(error){same(adapter.currentFrame(identity),before,"rejected boundary preserves accepted owner");outcome=String(error);}
    boundaryResults.push({id,value,outcome});adapter.disposeSession(identity.runtimeSessionId);
  }
  await create(baselineCapture);
  for(const [i,value]of [.75,.5,.35].entries())await adapter.applyControl({...identity,controlId:group,value,expectedInputEpoch:i});
  same((await capture(3,diseaseCapture.fixture)).fixture,diseaseCapture.fixture,"intermediate route target");
  await adapter.applyControl({...identity,controlId:group,value:.35,expectedInputEpoch:3});
  const beforeInvalid=adapter.currentFrame(identity);
  for(const [value,expectedInputEpoch]of [[.35,0],[.355,4],[NaN,4],[.24,4],[1.34,4]]) {
    let rejected=false;try{await adapter.applyControl({...identity,controlId:group,value:value!,expectedInputEpoch:expectedInputEpoch!});}catch{rejected=true;}
    if(!rejected)throw new Error("Malformed/stale operation accepted");same(adapter.currentFrame(identity),beforeInvalid,"rejected operation preserves owner");
  }
  adapter.disposeSession(identity.runtimeSessionId);
  await save("boundary-results.json",boundaryResults);

  const built=await build({configFile:false,logLevel:"silent",resolve:{alias:{"@":process.cwd()}},
    define:{"import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY":JSON.stringify("hot-path-lean")},
    build:{target:"es2022",minify:false,sourcemap:false,write:false,lib:{entry:resolve("studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioHfrefResearchExactModelV1.entry.ts"),formats:["es"]},rollupOptions:{output:{inlineDynamicImports:true}}}});
  const outputs=Array.isArray(built)?built:[built], chunks="output" in outputs[0]! ? outputs[0].output.filter(o=>o.type==="chunk"):[];
  if(chunks.length!==1||chunks[0]!.imports.length||chunks[0]!.dynamicImports.length)throw new Error("Self-contained artifact required");
  const bytes=new TextEncoder().encode(chunks[0]!.code), artifactSha256=createHash("sha256").update(bytes).digest("hex");
  const imported=await importExactExecutableArtifactModuleV2(bytes);
  if(typeof imported.createCircleHeartExactModelReleaseV1!=="function")throw new Error("Artifact factory missing");
  const compiled=await imported.createCircleHeartExactModelReleaseV1() as ReturnType<typeof factory>;
  same(compiled.manifest,release.manifest,"source/artifact manifest");
  for(const [name,c]of [["baseline",baselineCapture],["hfref",diseaseCapture]] as const) {
    await create(c);const compiledAdapter=compiled.executables.simulationAdapter;
    await compiledAdapter.createSession({runtimeSessionId:identity.runtimeSessionId,scenarios:[{scenarioId:identity.scenarioId,...c}]});
    for(let k=0;k<1000;k++)same(await adapter.advanceOnePresentationStep(identity),await compiledAdapter.advanceOnePresentationStep(identity),`${name} compiled continuation ${k}`);
    adapter.disposeSession(identity.runtimeSessionId);compiledAdapter.disposeSession(identity.runtimeSessionId);
  }
  const preset=(id:string,title:string,description:string,capture:ScenarioCaptureV2)=>({schemaId:STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID,
    presetId:id,modelId:model.modelId,title,description,capture});
  const report={schemaId:"hfref-research-control-route-qualification-v1",modelId:model.modelId,sourceSha256:source.sourceSha256,
    referenceSha256:await hash(reference),comparisons,boundaryResults,fixtureIdentity:{baseline:await hash(baselineCapture.fixture),hfref:await hash(diseaseCapture.fixture)},
    captureReload:"12-exact-steps-per-route",sourceArtifactParityStepsPerCase:1000,artifactSha256,
    inheritedAnalysisPins:surface.derivedOutputCatalog.map(o=>({outputId:o.outputId,derivationId:o.derivationId})),
    formalPvaAndStarlingQualification:"browser-review-pending",healthyQualificationReissued:false,
    missedPreferredTargets:cold[1]!.assessment!.targets.filter(t=>t.status!=="passed"),
    limitations:["Fixed structural geometry and calcium timing; not chronic remodeling or AMI.",
      "Shared septum and circulation change RV physiology; RVFW inputs remain unchanged.",
      "ET/ICT/Tei direction is not universal HFrEF behavior.","Free-asymptote tau unresolved; retain quality metadata."],
    wallTimeMs:performance.now()-started,publicPromotionAuthorized:false};
  await save("report.json",report);
  const bundleBody={schemaId:"local-hfref-model-lab-bundle-v1",manifest:release.manifest,surface,
    artifactRevisionId:await hash({manifest:release.manifest,artifactSha256}),artifactSha256,
    baseline:preset("research/baseline","baseline","Unchanged physiological inputs; own-model cold checkpoint.",baselineCapture),
    presets:[preset("research/hfref-lv-systolic-v1","HFrEFデモ：LV収縮能低下",
      "LV自由壁＋共有中隔の能動張力0.35倍。他の設定はbaselineと同じ。うっ血を伴うデモで、慢性リモデリング・AMIは再現しない。EDVI推奨目標は未達。",diseaseCapture)],
    reference,assessment:cold[1]!.assessment,qualificationReportSha256:await hash(report)};
  const bundle={...bundleBody,recordSha256:await hash(bundleBody)};
  await save("bundle.json",bundle);const artifactFile=join(output,"artifact.mjs");await writeFile(artifactFile,bytes,{flag:"wx"});files.push(artifactFile);
  await source.finish(files);
  const publicDirectory=resolve("public/research/hfref-domain-v1");await mkdir(publicDirectory,{recursive:true});
  await writeFile(join(publicDirectory,"artifact.mjs"),bytes);await writeFile(join(publicDirectory,"bundle.json"),JSON.stringify(bundle)+"\n");
  process.stdout.write(JSON.stringify({output,status:"local-bundle-prepared",values:cold[1]!.observation!.values,boundaryResults,wallTimeMs:report.wallTimeMs})+"\n");
}
await main().catch(error=>{process.stderr.write(String(error instanceof Error?error.stack:error)+"\n");process.exitCode=1;});
