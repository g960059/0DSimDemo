import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { canonicalJsonStringify } from "@/engine/integrity";
import { validateMainWireIntegratedModelStandard70CheckpointV1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_QUALIFICATION_V1_ID,
  type MainWireIntegratedModelStandard70BaselineQualificationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { observeMainWireStandard70QualificationV2 } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { MAIN_WIRE_BASELINE_OBSERVATION_V2_ID } from
  "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import {
  MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID,
  assertMainWireBaselineCheckCoverageV1,
  mainWireBaselineCheckBlocksV1,
  mainWireBaselineCheckWarnsV1,
} from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";

type SourceKindV2 = "wrapped-evaluation" | "evaluation" | "qualification";
type QualificationV2 = MainWireIntegratedModelStandard70BaselineQualificationV1;

/** Read existing exact evidence only; no exact runner, restore or state mint. */
export async function reviewMainWireBaselineEvidenceSourceV2(source: unknown) {
  let sourceKind: SourceKindV2 | null = null;
  let old: ReturnType<typeof summarizeV2> | null = null;
  let checkpointSha256: string | null = null;
  try {
    const root = recordV2(source, "source");
    let candidate: Record<string, unknown> = root;
    if ("evaluation" in root) {
      if ("exactResult" in root || "qualificationId" in root) throw new Error("ambiguous source envelope");
      sourceKind = "wrapped-evaluation";
      candidate = recordV2(root.evaluation, "wrapped evaluation");
    }
    if ("exactResult" in candidate) {
      if ("qualificationId" in candidate || candidate.status !== "accepted") throw new Error("source evaluation is not an unambiguous accepted result");
      sourceKind ??= "evaluation";
      candidate = recordV2(candidate.exactResult, "exact qualification");
    } else if (sourceKind !== null) throw new Error("wrapped evaluation has no exact result");
    sourceKind ??= "qualification";
    if (candidate.qualificationId !== MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_QUALIFICATION_V1_ID
      || !Array.isArray(candidate.terminalTrace) || !Array.isArray(candidate.checks)
      || typeof candidate.nominalDtSec !== "number" || !(candidate.nominalDtSec > 0) || !Number.isFinite(candidate.nominalDtSec)
      || !["period1-converged", "period2-suspect", "not-converged"].includes(String(recordV2(candidate.classification, "classification").status))) {
      throw new Error("source does not contain a supported qualification with an accepted terminal trace");
    }
    for (const raw of candidate.checks) {
      const check = recordV2(raw, "check");
      if (typeof check.checkId !== "string" || !["passed", "failed"].includes(String(check.status))
        || [check.actual, check.minimum, check.maximum].some((value) => typeof value !== "number" || !Number.isFinite(value))) {
        throw new Error("source contains an unavailable or malformed numeric check");
      }
    }
    const qualification = candidate as unknown as QualificationV2;
    assertMainWireBaselineCheckCoverageV1(qualification.checks);
    old = summarizeV2(qualification);
    await validateMainWireIntegratedModelStandard70CheckpointV1(qualification.checkpoint);
    checkpointSha256 = qualification.checkpoint.checkpointSha256;
    const before = canonicalJsonStringify(qualification.checkpoint);
    const observed = observeMainWireStandard70QualificationV2(qualification);
    if (observed.checkpoint !== qualification.checkpoint || canonicalJsonStringify(observed.checkpoint) !== before) {
      throw new Error("re-observation changed the exact checkpoint");
    }
    return Object.freeze({ status: "reobserved" as const, sourceKind, checkpointSha256,
      error: null, old, new: summarizeV2(observed), observation: observed.observation });
  } catch (error) {
    return Object.freeze({ status: "unavailable" as const, sourceKind, checkpointSha256,
      error: error instanceof Error ? error.message : String(error), old, new: null, observation: null });
  }
}

function summarizeV2(qualification: QualificationV2) {
  return Object.freeze({
    measurements: qualification.measurements,
    checks: qualification.checks,
    asStoredFailedCheckIds: Object.freeze(qualification.checks.filter(({ status }) => status === "failed").map(({ checkId }) => checkId)),
    blockingCheckIdsUnderCurrentRoles: Object.freeze(qualification.checks.filter(mainWireBaselineCheckBlocksV1).map(({ checkId }) => checkId)),
    warningCheckIdsUnderCurrentRoles: Object.freeze(qualification.checks.filter(mainWireBaselineCheckWarnsV1).map(({ checkId }) => checkId)),
  });
}

function recordV2(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be a JSON object`);
  return value as Record<string, unknown>;
}

async function mainV2() {
  const { values } = parseArgs({ options: { input: { type: "string", multiple: true }, output: { type: "string" } } });
  if (!values.input?.length || !values.output) throw new Error("--input FILE [--input FILE ...] --output NEW_FILE is required");
  const inputs = values.input.map((path) => resolve(path)), output = resolve(values.output);
  if (inputs.includes(output)) throw new Error("output must not be an input source");
  const sources = await Promise.all(inputs.map(async (sourcePath) => {
    const bytes = await readFile(sourcePath);
    return Object.freeze({ sourcePath, sourceSha256: createHash("sha256").update(bytes).digest("hex"),
      ...await reviewMainWireBaselineEvidenceSourceV2(JSON.parse(bytes.toString("utf8"))) });
  }));
  const report = {
    reviewId: "main-wire-baseline-evidence-reobservation-v2", reviewedAt: new Date().toISOString(),
    reobservationOnly: true, baselineAdopted: false, numericalExecutionPerformed: false,
    sourceCheckpointsModified: false,
    rolePolicyId: MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID, observationMethodId: MAIN_WIRE_BASELINE_OBSERVATION_V2_ID,
    roleEvaluationBasis: "current-role-policy-applied-independently-to-each-observation",
    sources,
  };
  await writeFile(output, JSON.stringify(report, null, 2), { flag: "wx" });
  process.stdout.write(`${output}\n`);
  if (sources.some(({ status }) => status !== "reobserved")) process.exitCode = 1;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await mainV2();
