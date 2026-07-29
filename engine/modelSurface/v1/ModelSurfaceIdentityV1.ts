import {
  assertModelSurfaceExactKeysV1,
  modelSurfaceNonEmptyStringV1,
  modelSurfaceRecordV1,
  modelSurfaceSha256V1,
} from "@/engine/modelSurface/v1/validationV1";

export type ModelSurfaceLifecycleV1 =
  | "development"
  | "candidate"
  | "release";

export type ModelSurfaceEvidenceStatusV1 =
  | "unverified"
  | "numerical"
  | "research-verified";

export type ModelSurfaceModelRefV1 = Readonly<{
  modelId: string;
  modelVersion: string;
  modelContentSha256: string;
  lifecycle: ModelSurfaceLifecycleV1;
  evidenceStatus: ModelSurfaceEvidenceStatusV1;
}>;

const LIFECYCLES = new Set<ModelSurfaceLifecycleV1>([
  "development",
  "candidate",
  "release",
]);
const EVIDENCE_STATUSES = new Set<ModelSurfaceEvidenceStatusV1>([
  "unverified",
  "numerical",
  "research-verified",
]);

export function loadModelSurfaceModelRefV1(
  value: unknown,
): ModelSurfaceModelRefV1 {
  const record = modelSurfaceRecordV1(value, "modelRef");
  assertModelSurfaceExactKeysV1(
    record,
    [
      "modelId",
      "modelVersion",
      "modelContentSha256",
      "lifecycle",
      "evidenceStatus",
    ],
    [],
    "modelRef",
  );
  const lifecycle = modelSurfaceNonEmptyStringV1(
    record.lifecycle,
    "modelRef.lifecycle",
  ) as ModelSurfaceLifecycleV1;
  const evidenceStatus = modelSurfaceNonEmptyStringV1(
    record.evidenceStatus,
    "modelRef.evidenceStatus",
  ) as ModelSurfaceEvidenceStatusV1;
  if (!LIFECYCLES.has(lifecycle)) {
    throw new Error(`model surface schema rejected: unknown lifecycle ${lifecycle}`);
  }
  if (!EVIDENCE_STATUSES.has(evidenceStatus)) {
    throw new Error(
      `model surface schema rejected: unknown evidence status ${evidenceStatus}`,
    );
  }
  return Object.freeze({
    modelId: modelSurfaceNonEmptyStringV1(
      record.modelId,
      "modelRef.modelId",
    ),
    modelVersion: modelSurfaceNonEmptyStringV1(
      record.modelVersion,
      "modelRef.modelVersion",
    ),
    modelContentSha256: modelSurfaceSha256V1(
      record.modelContentSha256,
      "modelRef.modelContentSha256",
    ),
    lifecycle,
    evidenceStatus,
  });
}

export function sameModelSurfaceModelRefV1(
  left: ModelSurfaceModelRefV1,
  right: ModelSurfaceModelRefV1,
): boolean {
  return left.modelId === right.modelId
    && left.modelVersion === right.modelVersion
    && left.modelContentSha256 === right.modelContentSha256
    && left.lifecycle === right.lifecycle
    && left.evidenceStatus === right.evidenceStatus;
}

export function modelSurfaceModelRefStringV1(
  ref: ModelSurfaceModelRefV1,
): string {
  return `${ref.modelId}@${ref.modelVersion}:sha256:${ref.modelContentSha256}`;
}
