import {
  mainWireScientificCaseDocumentRefIssuesV1,
  type MainWireScientificCaseDocumentRefV1,
} from "@/engine/scientific/documents/MainWireScientificCaseDocumentV1";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  type MainWireScientificObservableIdV1,
} from "@/engine/scientific/observables/MainWireScientificObservableRegistryV1";
import {
  cloneAndFreezeCanonicalJson,
  type CanonicalJsonObject,
} from "@/engine/scientific/release/canonicalJson";
import {
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release/sha256";

export const MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_REF_V1_SCHEMA_ID =
  "circleheart-main-wire-scientific-workspace-document-ref-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_CONTENT_V1_SCHEMA_ID =
  "circleheart-main-wire-scientific-workspace-document-content-v1" as const;

export type MainWireScientificWorkspaceDocumentRefV1 = Readonly<{
  schemaId:
    typeof MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_REF_V1_SCHEMA_ID;
  sha256: string;
}>;

/** Host-neutral grid placement. Coordinates are zero-based grid units. */
export type MainWireScientificWorkspacePanelLayoutV1 = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type MainWireScientificWorkspaceTimeSeriesViewV1 = Readonly<{
  kind: "time-series";
  observableIds: readonly MainWireScientificObservableIdV1[];
}>;

export type MainWireScientificWorkspacePressureVolumeTrajectoryV1 = Readonly<{
  trajectoryId: string;
  label: string;
  volumeObservableId: MainWireScientificObservableIdV1;
  pressureObservableId: MainWireScientificObservableIdV1;
}>;

export type MainWireScientificWorkspacePressureVolumeViewV1 = Readonly<{
  kind: "pressure-volume";
  trajectories:
    readonly MainWireScientificWorkspacePressureVolumeTrajectoryV1[];
}>;

export type MainWireScientificWorkspaceNumericTableViewV1 = Readonly<{
  kind: "numeric-table";
  observableIds: readonly MainWireScientificObservableIdV1[];
}>;

export type MainWireScientificWorkspacePanelViewV1 =
  | MainWireScientificWorkspaceTimeSeriesViewV1
  | MainWireScientificWorkspacePressureVolumeViewV1
  | MainWireScientificWorkspaceNumericTableViewV1;

/**
 * Presentation-only panel selection. The discriminated view contains enough
 * semantics for a host to reconstruct the visualization without guessing.
 */
export type MainWireScientificWorkspacePanelV1 = Readonly<{
  panelId: string;
  title: string;
  view: MainWireScientificWorkspacePanelViewV1;
  layout: MainWireScientificWorkspacePanelLayoutV1;
}>;

export type MainWireScientificWorkspaceDocumentContentV1 = Readonly<{
  schemaId:
    typeof MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_CONTENT_V1_SCHEMA_ID;
  schemaVersion: 1;
  revision: number;
  caseDocumentRef: MainWireScientificCaseDocumentRefV1;
  panels: readonly MainWireScientificWorkspacePanelV1[];
  /** Null is the single canonical representation of absent workspace notes. */
  notes: string | null;
}>;

export type MainWireScientificWorkspaceDocumentV1 = Readonly<{
  ref: MainWireScientificWorkspaceDocumentRefV1;
  content: MainWireScientificWorkspaceDocumentContentV1;
}>;

export type MainWireScientificWorkspaceDocumentInputV1 = Readonly<{
  revision: number;
  caseDocumentRef: MainWireScientificCaseDocumentRefV1;
  panels: readonly MainWireScientificWorkspacePanelV1[];
  notes: string | null;
}>;

export class MainWireScientificWorkspaceDocumentValidationErrorV1
  extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutable = Object.freeze([...issues]);
    super(`main-wire scientific workspace document rejected: ${immutable.join("; ")}`);
    this.name = "MainWireScientificWorkspaceDocumentValidationErrorV1";
    this.issues = immutable;
  }
}

/**
 * Creates a content-addressed presentation revision. It does not inspect a
 * case, release, runtime, persistence store, or host environment.
 */
export async function createMainWireScientificWorkspaceDocumentV1(
  input: MainWireScientificWorkspaceDocumentInputV1,
): Promise<MainWireScientificWorkspaceDocumentV1> {
  const safeInput = cloneCandidate(input, "workspace document input");
  const inputIssues = exactObjectIssues(safeInput, [
    "revision",
    "caseDocumentRef",
    "panels",
    "notes",
  ], "workspace input");
  if (inputIssues.length > 0) {
    throw new MainWireScientificWorkspaceDocumentValidationErrorV1(inputIssues);
  }

  const content = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    schemaId: MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_CONTENT_V1_SCHEMA_ID,
    schemaVersion: 1,
    revision: safeInput.revision,
    caseDocumentRef: safeInput.caseDocumentRef,
    panels: safeInput.panels,
    notes: safeInput.notes,
  });
  const contentIssues = mainWireScientificWorkspaceDocumentContentIssuesV1(
    content,
  );
  if (contentIssues.length > 0) {
    throw new MainWireScientificWorkspaceDocumentValidationErrorV1(
      contentIssues,
    );
  }

  const document = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    ref: {
      schemaId: MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_REF_V1_SCHEMA_ID,
      sha256: await sha256CanonicalJsonHex(content),
    },
    content,
  });
  return document as unknown as MainWireScientificWorkspaceDocumentV1;
}

/** Validates content shape and identity, then returns a detached frozen copy. */
export async function loadMainWireScientificWorkspaceDocumentV1(
  value: unknown,
): Promise<MainWireScientificWorkspaceDocumentV1> {
  const safe = cloneCandidate(value, "workspace document");
  const issues = exactObjectIssues(safe, ["ref", "content"], "workspace");
  issues.push(...mainWireScientificWorkspaceDocumentRefIssuesV1(safe.ref));
  issues.push(...mainWireScientificWorkspaceDocumentContentIssuesV1(
    safe.content,
  ));
  if (issues.length > 0) {
    throw new MainWireScientificWorkspaceDocumentValidationErrorV1(issues);
  }

  const typed = safe as unknown as MainWireScientificWorkspaceDocumentV1;
  const expectedSha256 = await sha256CanonicalJsonHex(typed.content);
  if (typed.ref.sha256 !== expectedSha256) {
    throw new MainWireScientificWorkspaceDocumentValidationErrorV1([
      "workspace.ref.sha256 does not match the canonical content digest",
    ]);
  }
  return typed;
}

export function mainWireScientificWorkspaceDocumentRefIssuesV1(
  value: unknown,
  path = "workspace.ref",
): readonly string[] {
  const issues = exactObjectIssues(value, ["schemaId", "sha256"], path);
  if (!isRecord(value)) return Object.freeze(issues);
  if (
    value.schemaId
    !== MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_REF_V1_SCHEMA_ID
  ) {
    issues.push(`${path}.schemaId is unsupported`);
  }
  if (typeof value.sha256 !== "string" || !SHA256_HEX_PATTERN.test(value.sha256)) {
    issues.push(`${path}.sha256 must be a lowercase SHA-256 digest`);
  }
  return Object.freeze(issues);
}

export function mainWireScientificWorkspaceDocumentContentIssuesV1(
  value: unknown,
  path = "workspace.content",
): readonly string[] {
  const issues = exactObjectIssues(value, [
    "schemaId",
    "schemaVersion",
    "revision",
    "caseDocumentRef",
    "panels",
    "notes",
  ], path);
  if (!isRecord(value)) return Object.freeze(issues);

  if (
    value.schemaId
    !== MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_CONTENT_V1_SCHEMA_ID
  ) {
    issues.push(`${path}.schemaId is unsupported`);
  }
  if (value.schemaVersion !== 1) {
    issues.push(`${path}.schemaVersion must be 1`);
  }
  if (!Number.isSafeInteger(value.revision) || (value.revision as number) < 0) {
    issues.push(`${path}.revision must be a non-negative safe integer`);
  }
  issues.push(...mainWireScientificCaseDocumentRefIssuesV1(
    value.caseDocumentRef,
    `${path}.caseDocumentRef`,
  ));
  issues.push(...panelArrayIssues(value.panels, `${path}.panels`));
  if (
    value.notes !== null
    && (
      typeof value.notes !== "string"
      || value.notes.length === 0
      || value.notes.trim() !== value.notes
    )
  ) {
    issues.push(`${path}.notes must be null or a non-empty trimmed string`);
  }
  return Object.freeze(issues);
}

function panelArrayIssues(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) return [`${path} must be an array`];
  const issues: string[] = [];
  const panelIds = new Set<string>();
  value.forEach((panel, index) => {
    const panelPath = `${path}[${index}]`;
    issues.push(...panelIssues(panel, panelPath));
    if (isRecord(panel) && typeof panel.panelId === "string") {
      if (panelIds.has(panel.panelId)) {
        issues.push(`${panelPath}.panelId must be unique within the workspace`);
      }
      panelIds.add(panel.panelId);
    }
  });
  return issues;
}

function panelIssues(value: unknown, path: string): string[] {
  const issues = exactObjectIssues(value, [
    "panelId",
    "title",
    "view",
    "layout",
  ], path);
  if (!isRecord(value)) return issues;
  if (
    typeof value.panelId !== "string"
    || !PORTABLE_PANEL_ID_PATTERN.test(value.panelId)
  ) {
    issues.push(`${path}.panelId must be a stable portable identifier`);
  }
  if (
    typeof value.title !== "string"
    || value.title.length === 0
    || value.title.trim() !== value.title
  ) {
    issues.push(`${path}.title must be a non-empty trimmed string`);
  }
  issues.push(...viewIssues(value.view, `${path}.view`));
  issues.push(...layoutIssues(value.layout, `${path}.layout`));
  return issues;
}

function viewIssues(value: unknown, path: string): string[] {
  if (!isRecord(value)) return [`${path} must be an object`];
  if (value.kind === "time-series" || value.kind === "numeric-table") {
    const issues = exactObjectIssues(value, ["kind", "observableIds"], path);
    issues.push(...observableIdArrayIssues(
      value.observableIds,
      `${path}.observableIds`,
    ));
    return issues;
  }
  if (value.kind === "pressure-volume") {
    const issues = exactObjectIssues(value, ["kind", "trajectories"], path);
    issues.push(...pressureVolumeTrajectoryArrayIssues(
      value.trajectories,
      `${path}.trajectories`,
    ));
    return issues;
  }
  return [`${path}.kind is unsupported`];
}

function observableIdArrayIssues(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) return [`${path} must be an array`];
  if (value.length === 0) return [`${path} must contain at least one observable ID`];
  const issues: string[] = [];
  const seen = new Set<string>();
  value.forEach((observableId, index) => {
    const idPath = `${path}[${index}]`;
    if (
      typeof observableId !== "string"
      || !OBSERVABLE_IDS.has(observableId)
    ) {
      issues.push(`${idPath} is not in the scientific observable catalog`);
      return;
    }
    if (seen.has(observableId)) {
      issues.push(`${idPath} duplicates an observable ID in the same panel`);
    }
    seen.add(observableId);
  });
  return issues;
}

function pressureVolumeTrajectoryArrayIssues(
  value: unknown,
  path: string,
): string[] {
  if (!Array.isArray(value)) return [`${path} must be an array`];
  if (value.length === 0) return [`${path} must contain at least one trajectory`];
  const issues: string[] = [];
  const trajectoryIds = new Set<string>();
  const observableIds = new Set<string>();
  value.forEach((trajectory, index) => {
    const trajectoryPath = `${path}[${index}]`;
    issues.push(...pressureVolumeTrajectoryIssues(
      trajectory,
      trajectoryPath,
    ));
    if (!isRecord(trajectory)) return;
    if (typeof trajectory.trajectoryId === "string") {
      if (trajectoryIds.has(trajectory.trajectoryId)) {
        issues.push(`${trajectoryPath}.trajectoryId must be unique within the view`);
      }
      trajectoryIds.add(trajectory.trajectoryId);
    }
    for (const field of [
      "volumeObservableId",
      "pressureObservableId",
    ] as const) {
      const observableId = trajectory[field];
      if (typeof observableId !== "string" || !OBSERVABLE_DEFINITIONS.has(
        observableId,
      )) continue;
      if (observableIds.has(observableId)) {
        issues.push(
          `${trajectoryPath}.${field} must not reuse an observable ID across trajectories`,
        );
      }
      observableIds.add(observableId);
    }
  });
  return issues;
}

function pressureVolumeTrajectoryIssues(
  value: unknown,
  path: string,
): string[] {
  const issues = exactObjectIssues(value, [
    "trajectoryId",
    "label",
    "volumeObservableId",
    "pressureObservableId",
  ], path);
  if (!isRecord(value)) return issues;
  if (
    typeof value.trajectoryId !== "string"
    || !PORTABLE_PANEL_ID_PATTERN.test(value.trajectoryId)
  ) {
    issues.push(`${path}.trajectoryId must be a stable portable identifier`);
  }
  if (
    typeof value.label !== "string"
    || value.label.length === 0
    || value.label.trim() !== value.label
  ) {
    issues.push(`${path}.label must be a non-empty trimmed string`);
  }
  validateObservableQuantityKind(
    value.volumeObservableId,
    `${path}.volumeObservableId`,
    "volume",
    issues,
  );
  validateObservableQuantityKind(
    value.pressureObservableId,
    `${path}.pressureObservableId`,
    "pressure",
    issues,
  );
  return issues;
}

function validateObservableQuantityKind(
  value: unknown,
  path: string,
  expectedKind: "volume" | "pressure",
  issues: string[],
): void {
  if (typeof value !== "string") {
    issues.push(`${path} is not in the scientific observable catalog`);
    return;
  }
  const definition = OBSERVABLE_DEFINITIONS.get(value);
  if (!definition) {
    issues.push(`${path} is not in the scientific observable catalog`);
    return;
  }
  if (definition.quantityKind !== expectedKind) {
    issues.push(`${path} must reference a ${expectedKind} observable`);
  }
}

function layoutIssues(value: unknown, path: string): string[] {
  const issues = exactObjectIssues(value, [
    "x",
    "y",
    "width",
    "height",
  ], path);
  if (!isRecord(value)) return issues;
  validateGridInteger(value.x, `${path}.x`, 0, issues);
  validateGridInteger(value.y, `${path}.y`, 0, issues);
  validateGridInteger(value.width, `${path}.width`, 1, issues);
  validateGridInteger(value.height, `${path}.height`, 1, issues);
  return issues;
}

function validateGridInteger(
  value: unknown,
  path: string,
  minimum: number,
  issues: string[],
): void {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    issues.push(`${path} must be a safe integer greater than or equal to ${minimum}`);
  }
}

function cloneCandidate(value: unknown, label: string): CanonicalJsonObject {
  try {
    return cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new MainWireScientificWorkspaceDocumentValidationErrorV1([
      `${label} is not canonical JSON: ${error instanceof Error
        ? error.message
        : String(error)}`,
    ]);
  }
}

function exactObjectIssues(
  value: unknown,
  expectedKeys: readonly string[],
  path: string,
): string[] {
  if (!isRecord(value)) return [`${path} must be an object`];
  const expected = new Set(expectedKeys);
  const issues: string[] = [];
  for (const key of expectedKeys) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      issues.push(`${path}.${key} is required`);
    }
  }
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) issues.push(`${path}.${key} is not allowed`);
  }
  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const PORTABLE_PANEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const OBSERVABLE_DEFINITIONS = new Map<
  string,
  (typeof MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1)[number]
>(
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((definition) => [
    definition.observableId,
    definition,
  ]),
);
const OBSERVABLE_IDS = new Set(OBSERVABLE_DEFINITIONS.keys());
