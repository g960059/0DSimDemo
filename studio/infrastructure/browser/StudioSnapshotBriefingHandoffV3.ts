import {
  validateExperimentPlacementV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  type ExperimentPlacementBriefingV2,
} from "@/studio/contracts/v2/content";
import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";

export const STUDIO_SNAPSHOT_BRIEFING_HANDOFF_V3_SCHEMA_ID =
  "circleheart-studio-snapshot-briefing-handoff-v3" as const;
export const STUDIO_SNAPSHOT_BRIEFING_HANDOFF_V3_KEY_PREFIX =
  `${STUDIO_SNAPSHOT_BRIEFING_HANDOFF_V3_SCHEMA_ID}:` as const;

export type StudioSnapshotBriefingHandoffStoragePortV3 = Pick<
Storage,
"getItem" | "setItem" | "removeItem"
>;

type StudioSnapshotBriefingHandoffEnvelopeV3 = Readonly<{
  schemaId: typeof STUDIO_SNAPSHOT_BRIEFING_HANDOFF_V3_SCHEMA_ID;
  snapshotId: string;
  briefing: ExperimentPlacementBriefingV2;
}>;

/**
 * Browser-session-only bridge from Workbench composition to Article placement.
 *
 * The immutable Snapshot remains complete and owns no Briefing. A handoff is
 * stored under the exact Snapshot identity and merely supplies the initial
 * Placement projection when that Snapshot is inserted into an Article.
 */
export class StudioSnapshotBriefingHandoffV3 {
  readonly #storage: StudioSnapshotBriefingHandoffStoragePortV3;

  constructor(storage: StudioSnapshotBriefingHandoffStoragePortV3) {
    this.#storage = storage;
  }

  write(
    snapshotId: string,
    briefingValue: ExperimentPlacementBriefingV2,
  ): ExperimentPlacementBriefingV2 {
    const briefing = validateBriefingV3(snapshotId, briefingValue);
    const envelope: StudioSnapshotBriefingHandoffEnvelopeV3 = Object.freeze({
      schemaId: STUDIO_SNAPSHOT_BRIEFING_HANDOFF_V3_SCHEMA_ID,
      snapshotId,
      briefing,
    });
    this.#storage.setItem(
      handoffKeyV3(snapshotId),
      studioCanonicalJsonStringify(envelope),
    );
    return briefing;
  }

  /**
   * Corrupt, structurally stale, or cross-Snapshot values are discarded. The
   * Article layer still validates the returned Briefing against the actual
   * pinned Snapshot before constructing a Placement.
   */
  read(snapshotId: string): ExperimentPlacementBriefingV2 | null {
    const key = handoffKeyV3(snapshotId);
    try {
      const raw = this.#storage.getItem(key);
      if (raw === null) return null;
      const parsed: unknown = JSON.parse(raw);
      const envelope = validateEnvelopeV3(parsed, snapshotId);
      return envelope.briefing;
    } catch {
      discardInvalidHandoffV3(this.#storage, key);
      return null;
    }
  }

  clear(snapshotId: string): void {
    discardInvalidHandoffV3(this.#storage, handoffKeyV3(snapshotId));
  }
}

/** Optional browser capability: even reading the sessionStorage getter may throw. */
export function createBrowserStudioSnapshotBriefingHandoffV3():
StudioSnapshotBriefingHandoffV3 | null {
  if (typeof window === "undefined") return null;
  try {
    return new StudioSnapshotBriefingHandoffV3(window.sessionStorage);
  } catch {
    return null;
  }
}

export function studioSnapshotBriefingHandoffKeyV3(snapshotId: string): string {
  return handoffKeyV3(snapshotId);
}

function handoffKeyV3(snapshotId: string): string {
  const validatedId = validateSnapshotIdV3(snapshotId);
  return `${STUDIO_SNAPSHOT_BRIEFING_HANDOFF_V3_KEY_PREFIX}${
    encodeURIComponent(validatedId)
  }`;
}

function validateSnapshotIdV3(snapshotId: string): string {
  return validateExperimentPlacementV2({
    schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
    placementId: "placement/session-briefing-handoff-validation",
    snapshotId,
    caption: null,
  }).snapshotId;
}

function validateBriefingV3(
  snapshotId: string,
  briefing: unknown,
): ExperimentPlacementBriefingV2 {
  const placement = validateExperimentPlacementV2({
    schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
    placementId: "placement/session-briefing-handoff-validation",
    snapshotId,
    caption: null,
    briefing,
  });
  if (placement.briefing === undefined) {
    throw new Error("Snapshot Briefing handoff must contain a Briefing");
  }
  return placement.briefing;
}

function validateEnvelopeV3(
  value: unknown,
  expectedSnapshotId: string,
): StudioSnapshotBriefingHandoffEnvelopeV3 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Snapshot Briefing handoff must be an object");
  }
  const record = value as Record<string, unknown>;
  const actualKeys = Object.keys(record).sort();
  const expectedKeys = ["briefing", "schemaId", "snapshotId"];
  if (
    actualKeys.length !== expectedKeys.length
    || actualKeys.some((key, index) => key !== expectedKeys[index])
    || record.schemaId !== STUDIO_SNAPSHOT_BRIEFING_HANDOFF_V3_SCHEMA_ID
    || record.snapshotId !== expectedSnapshotId
  ) {
    throw new Error("Snapshot Briefing handoff schema or identity is stale");
  }
  return Object.freeze({
    schemaId: STUDIO_SNAPSHOT_BRIEFING_HANDOFF_V3_SCHEMA_ID,
    snapshotId: expectedSnapshotId,
    briefing: validateBriefingV3(expectedSnapshotId, record.briefing),
  });
}

function discardInvalidHandoffV3(
  storage: StudioSnapshotBriefingHandoffStoragePortV3,
  key: string,
): void {
  try {
    storage.removeItem(key);
  } catch {
    // A broken optional session handoff must not prevent Article authoring.
  }
}
