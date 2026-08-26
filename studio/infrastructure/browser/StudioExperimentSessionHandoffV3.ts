import {
  studioCanonicalJsonStringify,
} from "@/domain/json/CanonicalJson";

export const STUDIO_EXPERIMENT_SESSION_HANDOFF_V3_KEY =
  "circleheart.studio.experiment-session-handoff.v1";
export const STUDIO_EXPERIMENT_SESSION_HANDOFF_V3_SCHEMA_ID =
  "circleheart-studio-experiment-session-handoff-v1" as const;

export type StudioExperimentSessionHandoffV3 = Readonly<{
  schemaId: typeof STUDIO_EXPERIMENT_SESSION_HANDOFF_V3_SCHEMA_ID;
  sessionToken: string;
  snapshotId: string;
  returnHref: string;
}>;

type SessionStorageV3 = Pick<Storage, "getItem" | "removeItem" | "setItem">;

/** One-tab context for opening a disposable ExperimentSession from Reader. */
export class StudioExperimentSessionHandoffStoreV3 {
  readonly #storage: SessionStorageV3;

  constructor(storage: SessionStorageV3 = window.sessionStorage) {
    this.#storage = storage;
  }

  begin(input: Omit<StudioExperimentSessionHandoffV3, "schemaId">):
    StudioExperimentSessionHandoffV3 {
    const handoff = validateStudioExperimentSessionHandoffV3({
      schemaId: STUDIO_EXPERIMENT_SESSION_HANDOFF_V3_SCHEMA_ID,
      ...input,
    });
    this.#storage.setItem(
      STUDIO_EXPERIMENT_SESSION_HANDOFF_V3_KEY,
      studioCanonicalJsonStringify(handoff),
    );
    return handoff;
  }

  read(): StudioExperimentSessionHandoffV3 | null {
    const raw = this.#storage.getItem(STUDIO_EXPERIMENT_SESSION_HANDOFF_V3_KEY);
    if (raw === null) return null;
    try {
      return validateStudioExperimentSessionHandoffV3(JSON.parse(raw));
    } catch {
      this.clear();
      return null;
    }
  }

  clear(): void {
    this.#storage.removeItem(STUDIO_EXPERIMENT_SESSION_HANDOFF_V3_KEY);
  }
}

export function createExperimentSessionTokenV3(): string {
  const token = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
  return portableIdV3(`session-${token}`, "sessionToken");
}

export function validateStudioExperimentSessionHandoffV3(
  value: unknown,
): StudioExperimentSessionHandoffV3 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("ExperimentSession handoff must be an object");
  }
  const record = value as Record<string, unknown>;
  const expected = ["returnHref", "schemaId", "sessionToken", "snapshotId"];
  const keys = Object.keys(record).sort();
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
    || record.schemaId !== STUDIO_EXPERIMENT_SESSION_HANDOFF_V3_SCHEMA_ID
  ) {
    throw new Error("ExperimentSession handoff schema is invalid");
  }
  const sessionToken = portableIdV3(record.sessionToken, "sessionToken");
  const snapshotId = portableIdV3(record.snapshotId, "snapshotId");
  if (
    typeof record.returnHref !== "string"
    || !record.returnHref.startsWith("/")
    || record.returnHref.startsWith("//")
  ) {
    throw new Error("ExperimentSession handoff returnHref is invalid");
  }
  return Object.freeze({
    schemaId: STUDIO_EXPERIMENT_SESSION_HANDOFF_V3_SCHEMA_ID,
    sessionToken,
    snapshotId,
    returnHref: record.returnHref,
  });
}

function portableIdV3(value: unknown, field: string): string {
  if (
    typeof value !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/.test(value)
  ) {
    throw new Error(`ExperimentSession handoff ${field} is invalid`);
  }
  return value;
}
