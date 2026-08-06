import {
  STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
  type StudioArticleBlockV2,
  type StudioArticleDraftV2,
} from "@/studio/contracts/v2/article";
import {
  validateExperimentPlacementV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  cloneAndFreezeStudioJson,
} from "@/studio/infrastructure/json/StudioCanonicalJson";

const PORTABLE_ID_V2 = /^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/;

export class StudioArticleDataValidationErrorV2 extends Error {
  constructor(path: string, message: string) {
    super(`Studio Article V2 rejected ${path}: ${message}`);
    this.name = "StudioArticleDataValidationErrorV2";
  }
}

/** Validates, detaches, and deeply freezes one mutable Article draft. */
export function validateStudioArticleDraftV2(value: unknown): StudioArticleDraftV2 {
  const draft = cloneAndFreezeStudioJson<StudioArticleDraftV2>(value) as
    StudioArticleDraftV2;
  exactKeysV2(draft, [
    "schemaId",
    "articleId",
    "draftVersion",
    "visibility",
    "locale",
    "title",
    "blocks",
  ], "$.article");
  if (draft.schemaId !== STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID) {
    failV2("$.article.schemaId", "schema identity mismatch");
  }
  portableIdV2(draft.articleId, "$.article.articleId");
  nonnegativeIntegerV2(draft.draftVersion, "$.article.draftVersion");
  if (draft.visibility !== "draft" && draft.visibility !== "public") {
    failV2("$.article.visibility", "must be draft or public");
  }
  trimmedNonemptyV2(draft.locale, "$.article.locale", 64);
  trimmedNonemptyV2(draft.title, "$.article.title", 240);
  if (!Array.isArray(draft.blocks)) {
    failV2("$.article.blocks", "must be an array");
  }
  const blockIds = new Set<string>();
  const placementIds = new Set<string>();
  draft.blocks.forEach((block, index) => {
    const path = `$.article.blocks[${index}]`;
    assertArticleBlockV2(block, path);
    if (blockIds.has(block.blockId)) failV2(`${path}.blockId`, "duplicate block ID");
    blockIds.add(block.blockId);
    if (block.kind === "experiment") {
      const placement = validateExperimentPlacementV2(block.placement);
      if (placementIds.has(placement.placementId)) {
        failV2(`${path}.placement.placementId`, "duplicate Placement ID");
      }
      placementIds.add(placement.placementId);
    }
  });
  return draft;
}

function assertArticleBlockV2(block: StudioArticleBlockV2, path: string): void {
  recordV2(block, path);
  if (block.kind === "heading") {
    exactKeysV2(block, ["blockId", "kind", "level", "text"], path);
    portableIdV2(block.blockId, `${path}.blockId`);
    if (block.level !== 2 && block.level !== 3) {
      failV2(`${path}.level`, "must be 2 or 3");
    }
    trimmedNonemptyV2(block.text, `${path}.text`, 500);
    return;
  }
  if (block.kind === "paragraph") {
    exactKeysV2(block, ["blockId", "kind", "text"], path);
    portableIdV2(block.blockId, `${path}.blockId`);
    trimmedV2(block.text, `${path}.text`, 20_000);
    return;
  }
  if (block.kind === "experiment") {
    exactKeysV2(block, ["blockId", "kind", "placement"], path);
    portableIdV2(block.blockId, `${path}.blockId`);
    validateExperimentPlacementV2(block.placement);
    return;
  }
  failV2(`${path}.kind`, "has an invalid block kind");
}

function exactKeysV2(value: unknown, expected: readonly string[], path: string): void {
  recordV2(value, path);
  const actual = Object.keys(value).sort();
  const sorted = [...expected].sort();
  if (actual.length !== sorted.length || actual.some((key, index) => key !== sorted[index])) {
    failV2(path, `keys must be exactly ${sorted.join(", ")}`);
  }
}

function recordV2(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    failV2(path, "must be an object");
  }
}

function portableIdV2(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || !PORTABLE_ID_V2.test(value)) {
    failV2(path, "must be a portable opaque ID");
  }
}

function nonnegativeIntegerV2(value: unknown, path: string): void {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || Object.is(value, -0)) {
    failV2(path, "must be a nonnegative safe integer");
  }
}

function trimmedNonemptyV2(value: unknown, path: string, maximum: number): void {
  trimmedV2(value, path, maximum);
  if ((value as string).length === 0) failV2(path, "must not be empty");
}

function trimmedV2(value: unknown, path: string, maximum: number): void {
  if (
    typeof value !== "string"
    || value.trim() !== value
    || value.length > maximum
  ) {
    failV2(path, `must be a trimmed string of at most ${maximum} characters`);
  }
}

function failV2(path: string, message: string): never {
  throw new StudioArticleDataValidationErrorV2(path, message);
}
