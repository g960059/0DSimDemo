import { canonicalJsonStringify as canonical, cloneAndFreezeCanonicalJson as own, sha256CanonicalJsonHex as hash } from "@/engine/integrity";

type JsonObject = Readonly<Record<string, unknown>>;
const object = (v: unknown): v is JsonObject => v !== null && typeof v === "object" && !Array.isArray(v);
const digest = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const schemaId = "main-wire-case-input-record-v1";
/** Current CLI result envelopes only, not a numerical-version adapter. */
export function unwrapMainWireFittingEvidenceV1(input: unknown): unknown {
  if (!object(input)) throw new Error("Invalid fitting evidence envelope");
  if (input.schemaId === "main-wire-static-case-fitting-result-v1") return input;
  const grid = input.status === "completed" ? input.grid : input;
  if (object(grid) && ["saved-result-ready", "grid-evaluated", "grid-observation-held"].includes(String(grid.status))
    && object(grid.result)) return grid.result;
  throw new Error("No retained raw result in this fitting envelope");
}
export type MainWireCaseInputRecordV1 = Readonly<{
  schemaId: typeof schemaId; modelId: string; referenceId: string;
  candidateInputs: JsonObject;
  provenance: Readonly<{ kind: "adopted-case" | "historical-fitting" | "new-construction"; sourceRecordSha256: string; description: string }>;
  previousAssessment: unknown; recordSha256: string;
}>;

/** Inert scientific history: no Session import, model-ID match or checkpoint restore.
 * Integrity is not qualification; every target model must validate and run its inputs. */
export async function createMainWireCaseInputRecordV1(input: Omit<MainWireCaseInputRecordV1, "schemaId" | "recordSha256">) {
  const body = { schemaId, ...own(input) as typeof input };
  return readMainWireCaseInputRecordV1({ ...body, recordSha256: await hash(body) });
}
export async function readMainWireCaseInputRecordV1(input: unknown): Promise<MainWireCaseInputRecordV1> {
  const value = own(input) as MainWireCaseInputRecordV1;
  if (!value || value.schemaId !== schemaId || !text(value.modelId) || !text(value.referenceId)
    || !object(value.candidateInputs) || !digest(value.recordSha256) || !object(value.provenance)
    || !["adopted-case", "historical-fitting", "new-construction"].includes(value.provenance.kind)
    || !digest(value.provenance.sourceRecordSha256) || !text(value.provenance.description)
    || !Object.hasOwn(value, "previousAssessment")
    || Object.keys(value).sort().join() !== ["schemaId", "modelId", "referenceId", "candidateInputs", "provenance", "previousAssessment", "recordSha256"].sort().join())
    throw new Error("Invalid case input history");
  const { recordSha256, ...body } = value;
  if (await hash(body) !== recordSha256) throw new Error("Case input history digest differs");
  return value;
}

/** Read this saved evidence format independently of the retired numerical owner.
 * Raw evidence is retained as unknown until a compatible observer validates it. */
export async function readMainWireHistoricalFittingEvidenceV1(input: unknown) {
  const value = own(input) as JsonObject;
  if (!object(value) || value.schemaId !== "main-wire-static-case-fitting-result-v1"
    || !text(value.modelId) || !digest(value.sourceSha256) || !digest(value.resultSha256)
    || !object(value.candidateInputs) || !object(value.rest) || !text(value.rest.referenceId)
    || !object(value.execution) || value.execution.status !== "accepted" || !object(value.execution.diagnostics))
    throw new Error("Invalid historical fitting evidence");
  const { resultSha256, ...body } = value;
  if (await hash(body) !== resultSha256) throw new Error("Historical fitting result digest differs");
  const record = await createMainWireCaseInputRecordV1({ modelId: value.modelId, referenceId: value.rest.referenceId,
    candidateInputs: value.candidateInputs, previousAssessment: value.rest,
    provenance: { kind: "historical-fitting", sourceRecordSha256: resultSha256,
      description: "Historical inputs and observations only; checkpoint not restored or qualified." } });
  return { record, diagnostics: value.execution.diagnostics, numericalSourceSha256: value.sourceSha256,
    previousObservationContext: value.referenceContext, nominalDtSec: value.nominalDtSec,
    checkpointSha256: object(value.execution.checkpoint) && digest(value.execution.checkpoint.checkpointSha256)
      ? value.execution.checkpoint.checkpointSha256 : null };
}

export function compareMainWireCaseInputsV1(previous: unknown, current: unknown, path = ""): readonly Readonly<{
  path: string; kind: "added" | "removed" | "changed"; previous: unknown; current: unknown;
}>[] {
  if (canonical(previous) === canonical(current)) return [];
  if (object(previous) && object(current)) return [...new Set([...Object.keys(previous), ...Object.keys(current)])].sort().flatMap(key => {
    const p = `${path}/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`;
    if (!Object.hasOwn(previous, key)) return [{ path: p, kind: "added" as const, previous: null, current: current[key] }];
    if (!Object.hasOwn(current, key)) return [{ path: p, kind: "removed" as const, previous: previous[key], current: null }];
    return compareMainWireCaseInputsV1(previous[key], current[key], p);
  });
  return [{ path: path || "/", kind: "changed", previous, current }];
}

/** A caller must explicitly decide cross-model meaning, not just accept matching keys. */
export async function bindMainWireCaseInputRecordV1<T>(input: Readonly<{
  record: unknown; targetModelId: string; referenceId: string; interpretation: string;
  validate: (candidate: unknown) => T; mappedInputs?: unknown;
}>) {
  const record = await readMainWireCaseInputRecordV1(input.record);
  if (!text(input.targetModelId) || !text(input.interpretation) || record.referenceId !== input.referenceId)
    throw new Error("Explicit case/model input interpretation required");
  const proposed = input.mappedInputs === undefined ? record.candidateInputs : own(input.mappedInputs);
  const candidateInputs = input.validate(proposed);
  if (canonical(proposed) !== canonical(candidateInputs)) throw new Error("Target validation must not silently add or change inputs");
  return own({ recordSha256: record.recordSha256, sourceModelId: record.modelId, targetModelId: input.targetModelId,
    referenceId: input.referenceId, interpretation: input.interpretation, candidateInputs,
    changes: compareMainWireCaseInputsV1(record.candidateInputs, candidateInputs),
    initialization: "cold", priorCheckpointImported: false, publicPromotionAuthorized: false });
}
