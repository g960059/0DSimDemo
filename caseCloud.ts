import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  limit as queryLimit,
  query,
  serverTimestamp,
  setDoc,
  type QueryDocumentSnapshot,
  type QueryConstraint,
  where,
} from "firebase/firestore";
import {
  type CaseDocument,
  type CaseKind,
  type CaseSource,
  type CaseStatus,
  type CaseVisibility,
  WORKSPACE_SCHEMA_VERSION,
} from "./caseDoc";
import { parseCaseDocument, serializeCaseDocument } from "./casePersist";

const MAX_CONTENT_SIZE = 500000;
const CASE_ID_RE = /^[a-zA-Z0-9_-]+$/;

export type CaseDocFields = {
  title: string;
  description: string;
  kind: CaseKind;
  content: string;
  status: CaseStatus;
  visibility: CaseVisibility;
  ownerId: string;
  schemaVersion: number;
  engineVersion: string;
  knobMappingVersion: string;
  workspaceSchemaVersion: number;
  source?: string;
  derivedFrom?: string;
};

export type CaseSummary = {
  id: string;
  title: string;
  description: string;
  kind: CaseKind;
  status: CaseStatus;
  visibility: CaseVisibility;
  ownerId: string;
  schemaVersion: number;
  workspaceSchemaVersion: number;
  source?: string;
  derivedFrom?: string;
  updatedAt?: number;
};

export type SaveCaseResult =
  | { ok: true }
  | { ok: false; code?: string; message: string };

export function isValidCaseId(id: string): boolean {
  return id.length > 0 && id.length <= 128 && CASE_ID_RE.test(id);
}

export function slugifyCaseTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || "case";
}

function safeIdPart(value: string, fallback: string, maxLength: number): string {
  const safe = value.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, maxLength);
  return safe || fallback;
}

export function createUserCaseId(title: string, uid: string, now = Date.now(), nonce = Math.random().toString(36).slice(2, 8)): string {
  const slug = slugifyCaseTitle(title);
  const uidStem = safeIdPart(uid, "user", 12);
  const nonceStem = safeIdPart(nonce, "draft", 8);
  return `${slug}-${uidStem}-${now.toString(36)}-${nonceStem}`.slice(0, 128);
}

function caseSourceSummary(source?: CaseSource): string | undefined {
  if (!source) return undefined;
  if (source.kind === "authored") return "authored";
  if (source.kind === "official") return `official:${source.id}`.slice(0, 200);
  if (source.kind === "remix") return `remix:${source.caseId}`.slice(0, 200);
  return `prompt:${source.model ?? "llm"}`.slice(0, 200);
}

export function normalizeCaseForCloud(
  caseDoc: CaseDocument,
  ownerId: string,
  overrides: { status?: CaseStatus; visibility?: CaseVisibility; kind?: CaseKind } = {},
): CaseDocument {
  const kind = overrides.kind ?? caseDoc.kind ?? (caseDoc.lesson ? "lesson" : "case");
  const status = overrides.status ?? caseDoc.status ?? "draft";
  const visibility = overrides.visibility ?? caseDoc.visibility ?? "private";
  return {
    ...caseDoc,
    kind,
    status,
    visibility,
    ownerId,
    meta: {
      ...caseDoc.meta,
      id: caseDoc.meta.id,
      title: caseDoc.spec.title || caseDoc.meta.title,
    },
  };
}

export function caseDocFields(caseDoc: CaseDocument, ownerId: string, overrides: { status?: CaseStatus; visibility?: CaseVisibility; kind?: CaseKind } = {}): CaseDocFields {
  const normalized = normalizeCaseForCloud(caseDoc, ownerId, overrides);
  const content = serializeCaseDocument(normalized);
  const source = caseSourceSummary(normalized.source);
  if (content.length > MAX_CONTENT_SIZE) {
    throw new Error(`Case content is too large (${content.length}/${MAX_CONTENT_SIZE} characters).`);
  }
  return {
    title: (normalized.spec.title || normalized.meta.title).slice(0, 200),
    description: (normalized.spec.description ?? "").slice(0, 10000),
    kind: normalized.kind ?? "case",
    content,
    status: normalized.status ?? "draft",
    visibility: normalized.visibility ?? "private",
    ownerId,
    schemaVersion: normalized.schemaVersion,
    engineVersion: normalized.engineVersion,
    knobMappingVersion: normalized.knobMappingVersion,
    workspaceSchemaVersion: normalized.workspace?.schemaVersion ?? WORKSPACE_SCHEMA_VERSION,
    ...(source ? { source } : {}),
    ...(normalized.derivedFrom ? { derivedFrom: normalized.derivedFrom.slice(0, 128) } : {}),
  };
}

function errorCode(err: unknown): string | undefined {
  return err && typeof err === "object" && "code" in err && typeof (err as { code?: unknown }).code === "string"
    ? (err as { code: string }).code
    : undefined;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Case save failed.";
}

async function caseRef(id: string) {
  const { db } = await import("./firebaseSetup");
  return doc(db, "cases", id);
}

async function casesCollectionRef() {
  const { db } = await import("./firebaseSetup");
  return collection(db, "cases");
}

export async function saveCase(caseDoc: CaseDocument, ownerUid: string, opts: { publish?: boolean; visibility?: CaseVisibility; kind?: CaseKind } = {}): Promise<SaveCaseResult> {
  const caseId = caseDoc.meta.id;
  if (!isValidCaseId(caseId)) {
    return { ok: false, message: "Case id must contain only letters, numbers, underscores, or hyphens." };
  }

  try {
    const ref = await caseRef(caseId);
    const existing = await getDocFromServer(ref);
    const existingOwner = existing.exists() && typeof existing.data().ownerId === "string"
      ? existing.data().ownerId
      : ownerUid;
    const fields = caseDocFields(caseDoc, existingOwner, {
      status: opts.publish ? "published" : (caseDoc.status ?? "draft"),
      visibility: opts.visibility ?? caseDoc.visibility,
      kind: opts.kind,
    });

    if (!existing.exists()) {
      await setDoc(ref, {
        ...fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { ok: true };
    }

    const data = existing.data();
    await setDoc(ref, {
      ...fields,
      ownerId: existingOwner,
      createdAt: data.createdAt,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, code: errorCode(err), message: errorMessage(err) };
  }
}

export function docContentToCaseDocument(content: unknown, expectedId: string): CaseDocument | undefined {
  if (typeof content !== "string") return undefined;
  try {
    const parsed = parseCaseDocument(content);
    return parsed.meta.id === expectedId ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchCase(id: string): Promise<CaseDocument | undefined> {
  if (!isValidCaseId(id)) return undefined;
  try {
    const snapshot = await getDoc(await caseRef(id));
    if (!snapshot.exists()) return undefined;
    const data = snapshot.data();
    if (data.status !== "published" && data.status !== "draft") return undefined;
    return docContentToCaseDocument(data.content, id);
  } catch {
    return undefined;
  }
}

function timestampToMillis(value: unknown): number | undefined {
  return value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function"
    ? (value as { toMillis: () => number }).toMillis()
    : undefined;
}

function snapshotToCaseSummary(snapshot: QueryDocumentSnapshot): CaseSummary | undefined {
  const data = snapshot.data();
  if (
    typeof data.title !== "string" ||
    typeof data.description !== "string" ||
    typeof data.kind !== "string" ||
    typeof data.status !== "string" ||
    typeof data.visibility !== "string" ||
    typeof data.ownerId !== "string" ||
    typeof data.schemaVersion !== "number" ||
    typeof data.workspaceSchemaVersion !== "number"
  ) {
    return undefined;
  }
  return {
    id: snapshot.id,
    title: data.title,
    description: data.description,
    kind: data.kind as CaseKind,
    status: data.status as CaseStatus,
    visibility: data.visibility as CaseVisibility,
    ownerId: data.ownerId,
    schemaVersion: data.schemaVersion,
    workspaceSchemaVersion: data.workspaceSchemaVersion,
    ...(typeof data.source === "string" ? { source: data.source } : {}),
    ...(typeof data.derivedFrom === "string" ? { derivedFrom: data.derivedFrom } : {}),
    ...(timestampToMillis(data.updatedAt) ? { updatedAt: timestampToMillis(data.updatedAt) } : {}),
  };
}

export async function listCaseSummaries(opts: {
  ownerUid?: string;
  visibility?: Extract<CaseVisibility, "public" | "official">;
  max?: number;
} = {}): Promise<CaseSummary[]> {
  const constraints: QueryConstraint[] = [];
  if (opts.ownerUid) {
    constraints.push(where("ownerId", "==", opts.ownerUid));
  } else {
    constraints.push(where("status", "==", "published"));
    constraints.push(where("visibility", "==", opts.visibility ?? "public"));
  }
  constraints.push(queryLimit(opts.max ?? 24));

  try {
    const snapshot = await getDocs(query(await casesCollectionRef(), ...constraints));
    return snapshot.docs.map(snapshotToCaseSummary).filter((summary): summary is CaseSummary => Boolean(summary));
  } catch {
    return [];
  }
}
