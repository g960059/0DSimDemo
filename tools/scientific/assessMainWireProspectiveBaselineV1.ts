import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { canonicalJsonStringify } from "@/engine/integrity";
import { MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 as policy, assessMainWireProspectiveRestV1 } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { qualifyMainWirePreloadReserveAdmissionV1 } from "@/analysis/policies/mainWire/MainWirePreloadReserveAdmissionV1";
import { compareMainWirePressureRateObservationsV1 } from "@/analysis/methods/mainWire/MainWireBaselinePressureRateQualityV1";
import { measureMainWireRelaxationTauV1, assertMainWireRelaxationTauMeasuredV1, assertMainWireRelaxationTraceReviewedV1 } from "@/analysis/methods/mainWire/MainWireRelaxationTauV1";
import { observeMainWireBaselineV2 } from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import { observeMainWireStandard70TimingAndInletV2 } from "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { buildMainWireIntegratedModelStandard70BaselineChecksV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as periodic,
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3 as numerical } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import type { MainWireIntegratedModelPeriodicTerminalTraceSampleV3 as Sample } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type { MainWireIntegratedModelFormalPreloadReserveMeasurementV2 as Reserve } from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";

// Read-only re-observation of our fixed-topology research runner's evidence.
// Not an untrusted-report certification API; exact restore/publish remains a
// separate boundary. Never reuse a Standard70 identity for research material.
type Result = {
  status: string; initialization: string; nominalDtSec: number; completedCycleCount: number;
  construction: { researchConstructionId: string; hemodynamicResearchInputs: { totalBloodVolumeMl: number; heartRateBpm: number };
    runtime: { respiratory: Record<string, number> } };
  classification: { status: string; acceptedEvidenceRole: string; evidenceCycleIndices: number[] };
  cycleEvidence: { cycle: number; period1: number; allOff: boolean; composedCalciumOwner: boolean;
    atrialCaptureCount: number; ventricularCaptureCount: number; globalVolumeErrorMl: number; coronaryLedgerErrorMl: number }[];
  completedBeat: Beat; terminalTrace: Sample[]; timingAndInletTrace: Sample[];
  timingAndInletObservationWindow: Parameters<typeof measureMainWireIntegratedModelStandard70CandidateEvidenceV1>[0]["timingAndInletObservationWindow"];
  preloadReserve: { nominalDtSec: number; numericalProtocol: string; measurement: Reserve; status: string };
  checkpointExactRoundtripVerified: boolean;
  researchCheckpoint: { checkpointSha256: string; acceptedTimeSec: number };
};
const { values } = parseArgs({ options: { coarse: { type: "string" }, fine: { type: "string" }, output: { type: "string" } } });
if (!values.coarse || !values.fine || !values.output) throw new Error("--coarse RESULT --fine RESULT --output NEW_JSON");
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const sourceFiles = [
  "tools/scientific/assessMainWireProspectiveBaselineV1.ts",
  "analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1.ts",
  "analysis/policies/mainWire/MainWirePreloadReserveAdmissionV1.ts",
  "analysis/policies/mainWire/MainWirePreloadReserveResearchScreenV2.ts",
  "analysis/policies/mainWire/MainWireBaselineGateRolesV1.ts",
  "analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1.ts",
  "analysis/methods/mainWire/MainWireFixedToneSettlementV2.ts",
  "analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3.ts",
  "analysis/methods/mainWire/MainWireBaselinePressureRateQualityV1.ts",
  "analysis/methods/mainWire/MainWireRelaxationTauV1.ts",
  "analysis/methods/mainWire/MainWireBaselineObservationV2.ts",
  "analysis/methods/mainWire/MainWireRestingReferenceComparisonV1.ts",
  "analysis/registry/MainWireRestingReferenceProfileV1.ts",
  "engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1.ts",
  "engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1.ts",
  "engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1.ts",
  "engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3.ts",
  "data/physiology/main-wire-normal-reference-evidence-v1.json",
];
const read = async (path: string) => { const raw = await readFile(path, "utf8");
  return { path, sha256: sha(raw), result: JSON.parse(raw) as Result }; };
const [coarse, fine] = await Promise.all([read(values.coarse), read(values.fine)]);
const constructionSha = (r: Result) => sha(canonicalJsonStringify(r.construction));
if (constructionSha(coarse.result) !== constructionSha(fine.result)
  || coarse.result.nominalDtSec !== .002 || fine.result.nominalDtSec !== .001) throw new Error("Same construction and independent 2ms/1ms evidence required");

function observe(r: Result) {
  const errors: string[] = [];
  const require = (condition: boolean, issue: string) => { if (!condition) errors.push(issue); };
  require(r.construction.researchConstructionId === "main-wire-baseline-reference-research-v1", "unsupported-construction-topology");
  // This runner's assembly has no shunt ports. Do not infer this from Qp/Qs.
  require([60, 70].includes(r.construction.hemodynamicResearchInputs.heartRateBpm), "unsupported-HR");
  require(["PEEP", "Pth0", "respAmpTh", "respAmpAlv", "respRate"].every(k => r.construction.runtime.respiratory[k] === 0), "pressure-zero-or-respiration");
  require(r.status === "settled" && r.classification.status === "period1-converged" && r.initialization === "cold", "independent-cold-period1-required");
  const recent = r.cycleEvidence.slice(-periodic.consecutiveCycles);
  require(recent.length === periodic.consecutiveCycles
    && r.classification.acceptedEvidenceRole === "canonical-periodic-protocol"
    && canonicalJsonStringify(recent.map(c => c.cycle)) === canonicalJsonStringify(r.classification.evidenceCycleIndices)
    && recent.at(-1)?.cycle === r.completedCycleCount
    && recent.every((c, i) => Number.isSafeInteger(c.cycle) && (i === 0 || c.cycle === recent[i - 1]!.cycle + 1)
      && Number.isFinite(c.period1) && c.period1 >= 0 && c.period1 <= periodic.period1NormalizedTolerance), "period1-evidence");
  require(r.cycleEvidence.length > 0 && r.cycleEvidence.every(c => c.allOff === true && c.composedCalciumOwner === true
    && c.atrialCaptureCount === 1 && c.ventricularCaptureCount === 1
    && Number.isFinite(c.globalVolumeErrorMl) && c.globalVolumeErrorMl >= 0 && c.globalVolumeErrorMl <= numerical.invariantTolerance.globalTotalBloodVolumeErrorMl
    && Number.isFinite(c.coronaryLedgerErrorMl) && c.coronaryLedgerErrorMl >= 0 && c.coronaryLedgerErrorMl <= numerical.invariantTolerance.coronaryBloodVolumeLedgerResidualMl), "numerical-conservation-or-all-off");
  require(r.checkpointExactRoundtripVerified === true && /^[0-9a-f]{64}$/.test(r.researchCheckpoint.checkpointSha256)
    && Math.abs(r.researchCheckpoint.acceptedTimeSec - r.terminalTrace.at(-1)!.acceptedTimeSec) < 1e-8, "own-checkpoint-evidence");
  require(Math.abs(r.preloadReserve.measurement.sourceGlobalTbvMl - r.construction.hemodynamicResearchInputs.totalBloodVolumeMl) < 1e-8
    && r.preloadReserve.nominalDtSec === r.nominalDtSec
    && r.preloadReserve.numericalProtocol === "research-fork-inherits-requested-step-v2", "reserve-construction-step-binding");
  require(r.terminalTrace.length > 3 && r.terminalTrace.every(s =>
    Object.values(s.dynamicMcsAcceptedFlowMlPerSec).every(q => q === 0)), "trace-all-off");
  const measurements = measureMainWireIntegratedModelStandard70CandidateEvidenceV1({
    terminalTrace: r.terminalTrace, completedBeat: r.completedBeat,
    timingAndInletTrace: r.timingAndInletTrace, timingAndInletObservationWindow: r.timingAndInletObservationWindow,
    timingAndInletObserver: observeMainWireStandard70TimingAndInletV2,
  });
  require(Math.abs(60 / r.completedBeat.durationSec - r.construction.hemodynamicResearchInputs.heartRateBpm) < 1e-7, "beat-HR-binding");
  const checks = buildMainWireIntegratedModelStandard70BaselineChecksV1(measurements, r.classification.status === "period1-converged");
  const rest = assessMainWireProspectiveRestV1(r.completedBeat, checks, measurements.cardiacSizeAndFunction.bodySurfaceAreaM2);
  const native = observeMainWireBaselineV2({ samples: r.timingAndInletTrace, completedBeat: r.completedBeat });
  const tau = measureMainWireRelaxationTauV1(r.timingAndInletTrace, native.left.events);
  try { assertMainWireRelaxationTauMeasuredV1(tau); assertMainWireRelaxationTraceReviewedV1(tau); }
  catch (error) { errors.push(String(error)); }
  return { rest, tau, native, errors };
}
const observations = [observe(coarse.result), observe(fine.result)];
const qualityInput = (r: Result) => ({ nominalDtSec: r.nominalDtSec, completedBeat: r.completedBeat, terminalTrace: r.terminalTrace });
const pressureRateQuality = compareMainWirePressureRateObservationsV1({ coarse: qualityInput(coarse.result), fine: qualityInput(fine.result) });
const reserve = qualifyMainWirePreloadReserveAdmissionV1(coarse.result.preloadReserve.measurement, fine.result.preloadReserve.measurement);
const eligible = observations.every(o => o.errors.length === 0 && o.rest.status === "passed")
  && pressureRateQuality.every(c => c.status === "passed") && reserve.status === "passed";
const referenceFlags = observations.flatMap((o, i) => {
  const grid = i === 0 ? "coarse" : "fine";
  return [
    ...o.rest.historicalWarnings.map(c => ({ grid, metricId: c.checkId, actual: c.actual,
      basis: "historical-method-context", sourceId: null, strata: [] as string[] })),
    ...o.rest.comparison.entries.flatMap(e => {
      const outside = e.comparisons.filter(c => ["outside-source-range", "above-source-upper-limit"].includes(c.status));
      return outside.length ? [{ grid, metricId: e.metricId, actual: e.actual,
        basis: e.role, sourceId: e.sourceId, strata: outside.map(c => c.stratum) }] : [];
    }),
  ];
});
const report = { policy, constructionSha256: constructionSha(fine.result),
  referenceFlags, referenceFlagMeaning: "Source/method context, not diagnoses. An outside age/sex stratum is not an assigned demographic or a universal abnormality; retain stratum labels and full comparisons below.",
  sources: [coarse, fine].map(s => ({ path: s.path, sha256: s.sha256, nominalDtSec: s.result.nominalDtSec,
    checkpointSha256: s.result.researchCheckpoint.checkpointSha256, historicalReserveStatus: s.result.preloadReserve.status })),
  implementation: await Promise.all(sourceFiles.map(async path => ({ path, sha256: sha(await readFile(path, "utf8")) }))),
  status: eligible ? "eligible-for-exact-model-promotion" : "held", observations, pressureRateQuality, reserve,
  evidenceTrustBoundary: "Locally produced fixed-topology research reports, raw results hashed and re-observed. This does not independently restore historical checkpoints, authenticate arbitrary JSON, or certify production release.",
  publicBaselineChanged: false, publicModelIdentityMinted: false, clinicalNormalityClaimed: false,
  remainingBeforePublicAdmission: ["Bind the reviewed construction to its own exact identity/checkpoint, latest compatible Surface and pinned analyses; verify live and analysis parity."] };
await writeFile(values.output, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ status: report.status, output: values.output,
  referenceFlags,
  rest: observations.map(o => ({ status: o.rest.status, errors: o.errors, retainedFailures: o.rest.invalidOrFailedRetained })),
  pressureRateQuality: pressureRateQuality.map(c => ({ id: c.checkId, status: c.status, relativeDifference: c.relativeDifference })),
  reserve: { status: reserve.status, issues: reserve.issues, responses: reserve.responses.map(r => ({ side: r.side, direction: r.direction, passed: r.passed })) } }, null, 2));
