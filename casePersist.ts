// Local persistence + portability for CaseDocuments (milestone #3-c). No
// network, no Firebase: a `.circleheart.json` file export/import (the offline
// "share") plus a localStorage working draft. Firestore publishing is a later,
// sensitive, admin-gated milestone.

import type { CaseDocument } from "@/caseDoc";
import { normalizeCaseI18n } from "@/contentI18n";

export const DRAFT_KEY = "circleheart:workbench-draft";
const FILE_EXT = ".circleheart.json";

/** Validate the on-the-wire shape of a parsed JSON value as a CaseDocument.
 *  This is a structural gate (fail fast with a clear message); the deep
 *  version/baseline checks happen in caseDocumentToSimInstances on load. */
export function parseCaseDocument(text: string): CaseDocument {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Not a valid JSON file.");
  }
  if (!raw || typeof raw !== "object") throw new Error("Not a CircleHeart case file.");
  const d = raw as Record<string, unknown>;
  if (typeof d.schemaVersion !== "number") throw new Error("Missing schemaVersion — not a CircleHeart case file.");
  if (typeof d.knobMappingVersion !== "string") throw new Error("Missing knobMappingVersion — not a CircleHeart case file.");
  if (!Array.isArray(d.instances)) throw new Error("Case file has no instances.");
  if (d.instances.length === 0) throw new Error("Case file has no instances (would wipe the scene).");
  if (!Array.isArray(d.panels)) throw new Error("Case file has no panels.");
  if (d.notes !== undefined) {
    if (!d.notes || typeof d.notes !== "object" || Array.isArray(d.notes)) {
      delete d.notes;
    } else {
      const notes = Object.fromEntries(
        Object.entries(d.notes as Record<string, unknown>).filter(([, value]) => Array.isArray(value)),
      );
      if (Object.keys(notes).length > 0) d.notes = notes;
      else delete d.notes;
    }
  }
  return normalizeCaseI18n(d as unknown as CaseDocument);
}

/** Reject implausibly large files before reading them into memory (DoS guard). */
const MAX_CASE_FILE_BYTES = 5 * 1024 * 1024;

/** Serialize a CaseDocument to pretty JSON. */
export function serializeCaseDocument(doc: CaseDocument): string {
  return JSON.stringify(doc, null, 2);
}

/** Trigger a browser download of the document as `<title>.circleheart.json`. */
export function exportCaseFile(doc: CaseDocument): void {
  if (typeof document === "undefined") return; // SSR / headless guard
  const safe = (doc.meta?.title || "case").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
  const blob = new Blob([serializeCaseDocument(doc)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}${FILE_EXT}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Read + parse a user-selected file into a CaseDocument (rejects on bad shape). */
export function readCaseFile(file: File): Promise<CaseDocument> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_CASE_FILE_BYTES) {
      reject(new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB); CircleHeart case files are tiny.`));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      try {
        resolve(parseCaseDocument(String(reader.result ?? "")));
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsText(file);
  });
}

// ----- localStorage working draft (survives a refresh; not a share artifact) --

export function saveDraft(doc: CaseDocument): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, serializeCaseDocument(doc));
  } catch {
    /* quota / private mode — a draft is best-effort, never fatal */
  }
}

export function loadDraft(): CaseDocument | null {
  if (typeof localStorage === "undefined") return null;
  const text = localStorage.getItem(DRAFT_KEY);
  if (!text) return null;
  try {
    return parseCaseDocument(text);
  } catch {
    return null; // a corrupt draft is silently ignored, not surfaced
  }
}

export function clearDraft(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}
