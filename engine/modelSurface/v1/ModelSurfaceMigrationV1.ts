import {
  assertModelSurfaceExactKeysV1,
  modelSurfaceArrayV1,
  modelSurfaceNonEmptyStringV1,
  modelSurfacePositiveIntegerV1,
  modelSurfaceRecordV1,
  modelSurfaceSha256V1,
} from "@/engine/modelSurface/v1/validationV1";

export type MappingEntryV1 = Readonly<{
  sourceId: string;
  targetId: string;
  mappingKind: "identity" | "renamed" | "transformed";
  interpretationBoundary: string;
}>;

export type PresetMappingV1 = Readonly<{
  sourcePresetId: string;
  targetPresetId: string;
  mappingKind: "identity" | "renamed" | "reparameterized";
  interpretationBoundary: string;
}>;

export type ModelSurfaceMigrationV1 = Readonly<{
  migrationId: string;
  fromModelRef: string;
  toModelRef: string;
  observableMappings: readonly MappingEntryV1[];
  controlMappings: readonly MappingEntryV1[];
  presetMappings: readonly PresetMappingV1[];
  unmapped: readonly Readonly<{
    sourceId: string;
    reason: string;
  }>[];
}>;

export type ModelSurfaceMigrationRefV1 = Readonly<{
  migrationId: string;
  fromModelRef: string;
  toModelRef: string;
  schemaVersion: number;
  contentSha256: string;
}>;

export function loadModelSurfaceMigrationRefV1(
  value: unknown,
): ModelSurfaceMigrationRefV1 {
  const record = modelSurfaceRecordV1(value, "migration ref");
  assertModelSurfaceExactKeysV1(
    record,
    [
      "migrationId",
      "fromModelRef",
      "toModelRef",
      "schemaVersion",
      "contentSha256",
    ],
    [],
    "migration ref",
  );
  const result = Object.freeze({
    migrationId: modelSurfaceNonEmptyStringV1(
      record.migrationId,
      "migrationRef.migrationId",
    ),
    fromModelRef: modelSurfaceNonEmptyStringV1(
      record.fromModelRef,
      "migrationRef.fromModelRef",
    ),
    toModelRef: modelSurfaceNonEmptyStringV1(
      record.toModelRef,
      "migrationRef.toModelRef",
    ),
    schemaVersion: modelSurfacePositiveIntegerV1(
      record.schemaVersion,
      "migrationRef.schemaVersion",
    ),
    contentSha256: modelSurfaceSha256V1(
      record.contentSha256,
      "migrationRef.contentSha256",
    ),
  });
  if (result.fromModelRef === result.toModelRef) {
    throw new Error(
      "model surface schema rejected: migration must be pairwise between distinct exact model refs",
    );
  }
  return result;
}

export function loadModelSurfaceMigrationV1(
  value: unknown,
): ModelSurfaceMigrationV1 {
  const record = modelSurfaceRecordV1(value, "migration");
  assertModelSurfaceExactKeysV1(
    record,
    [
      "migrationId",
      "fromModelRef",
      "toModelRef",
      "observableMappings",
      "controlMappings",
      "presetMappings",
      "unmapped",
    ],
    [],
    "migration",
  );
  const migrationId = modelSurfaceNonEmptyStringV1(
    record.migrationId,
    "migration.migrationId",
  );
  const fromModelRef = modelSurfaceNonEmptyStringV1(
    record.fromModelRef,
    "migration.fromModelRef",
  );
  const toModelRef = modelSurfaceNonEmptyStringV1(
    record.toModelRef,
    "migration.toModelRef",
  );
  if (fromModelRef === toModelRef) {
    throw new Error(
      "model surface schema rejected: migration must be pairwise between distinct exact model refs",
    );
  }
  return Object.freeze({
    migrationId,
    fromModelRef,
    toModelRef,
    observableMappings: Object.freeze(
      loadMappingEntriesV1(record.observableMappings, "observableMappings"),
    ),
    controlMappings: Object.freeze(
      loadMappingEntriesV1(record.controlMappings, "controlMappings"),
    ),
    presetMappings: Object.freeze(
      modelSurfaceArrayV1(
        record.presetMappings,
        "migration.presetMappings",
      ).map((entry, index) => loadPresetMappingV1(entry, index)),
    ),
    unmapped: Object.freeze(
      modelSurfaceArrayV1(record.unmapped, "migration.unmapped")
        .map((entry, index) => {
          const unmapped = modelSurfaceRecordV1(
            entry,
            `migration.unmapped[${index}]`,
          );
          assertModelSurfaceExactKeysV1(
            unmapped,
            ["sourceId", "reason"],
            [],
            `migration.unmapped[${index}]`,
          );
          return Object.freeze({
            sourceId: modelSurfaceNonEmptyStringV1(
              unmapped.sourceId,
              `migration.unmapped[${index}].sourceId`,
            ),
            reason: modelSurfaceNonEmptyStringV1(
              unmapped.reason,
              `migration.unmapped[${index}].reason`,
            ),
          });
        }),
    ),
  });
}

function loadMappingEntriesV1(
  value: unknown,
  label: string,
): MappingEntryV1[] {
  return modelSurfaceArrayV1(value, `migration.${label}`)
    .map((entry, index) => {
      const mapping = modelSurfaceRecordV1(
        entry,
        `migration.${label}[${index}]`,
      );
      assertModelSurfaceExactKeysV1(
        mapping,
        [
          "sourceId",
          "targetId",
          "mappingKind",
          "interpretationBoundary",
        ],
        [],
        `migration.${label}[${index}]`,
      );
      const mappingKind = modelSurfaceNonEmptyStringV1(
        mapping.mappingKind,
        `migration.${label}[${index}].mappingKind`,
      );
      if (!["identity", "renamed", "transformed"].includes(mappingKind)) {
        throw new Error(
          `model surface schema rejected: unknown mapping kind ${mappingKind}`,
        );
      }
      return Object.freeze({
        sourceId: modelSurfaceNonEmptyStringV1(
          mapping.sourceId,
          `migration.${label}[${index}].sourceId`,
        ),
        targetId: modelSurfaceNonEmptyStringV1(
          mapping.targetId,
          `migration.${label}[${index}].targetId`,
        ),
        mappingKind: mappingKind as MappingEntryV1["mappingKind"],
        interpretationBoundary: modelSurfaceNonEmptyStringV1(
          mapping.interpretationBoundary,
          `migration.${label}[${index}].interpretationBoundary`,
        ),
      });
    });
}

function loadPresetMappingV1(
  value: unknown,
  index: number,
): PresetMappingV1 {
  const mapping = modelSurfaceRecordV1(
    value,
    `migration.presetMappings[${index}]`,
  );
  assertModelSurfaceExactKeysV1(
    mapping,
    [
      "sourcePresetId",
      "targetPresetId",
      "mappingKind",
      "interpretationBoundary",
    ],
    [],
    `migration.presetMappings[${index}]`,
  );
  const mappingKind = modelSurfaceNonEmptyStringV1(
    mapping.mappingKind,
    `migration.presetMappings[${index}].mappingKind`,
  );
  if (!["identity", "renamed", "reparameterized"].includes(mappingKind)) {
    throw new Error(
      `model surface schema rejected: unknown preset mapping kind ${mappingKind}`,
    );
  }
  return Object.freeze({
    sourcePresetId: modelSurfaceNonEmptyStringV1(
      mapping.sourcePresetId,
      `migration.presetMappings[${index}].sourcePresetId`,
    ),
    targetPresetId: modelSurfaceNonEmptyStringV1(
      mapping.targetPresetId,
      `migration.presetMappings[${index}].targetPresetId`,
    ),
    mappingKind: mappingKind as PresetMappingV1["mappingKind"],
    interpretationBoundary: modelSurfaceNonEmptyStringV1(
      mapping.interpretationBoundary,
      `migration.presetMappings[${index}].interpretationBoundary`,
    ),
  });
}
