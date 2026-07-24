/**
 * Portable, JSON-shaped authoring and Reader Preview contracts.
 *
 * These values deliberately contain no runtime handles, React nodes, engine
 * types, active bindings, or persistence capabilities. A preview manifest is
 * sufficient input for a Reader surface and is explicitly unfit for
 * publication or certification.
 */

export const STUDIO_EXPERIMENT_REVISION_V1_SCHEMA_ID =
  "circleheart-studio-experiment-revision-v1" as const;
export const STUDIO_READER_BRIEF_V1_SCHEMA_ID =
  "circleheart-studio-reader-brief-v1" as const;
export const STUDIO_DOCUMENT_REVISION_V1_SCHEMA_ID =
  "circleheart-studio-document-revision-v1" as const;
export const STUDIO_AUTHOR_DRAFT_V1_SCHEMA_ID =
  "circleheart-studio-author-draft-v1" as const;
export const STUDIO_RESOLVED_READER_EXPERIMENT_V1_SCHEMA_ID =
  "circleheart-studio-resolved-reader-experiment-v1" as const;
export const STUDIO_RESOLVED_READER_DOCUMENT_V1_SCHEMA_ID =
  "circleheart-studio-resolved-reader-document-v1" as const;
export const STUDIO_READER_PREVIEW_MANIFEST_V1_SCHEMA_ID =
  "circleheart-studio-reader-preview-manifest-v1" as const;

export type StudioContentRevisionV1 = number;
export type StudioDraftIdV1 = string;
export type StudioDocumentIdV1 = string;
export type StudioDocumentBlockIdV1 = string;
export type StudioExperimentIdV1 = string;
export type StudioReaderBriefIdV1 = string;
export type StudioReaderPreviewIdV1 = string;

/**
 * Author-side preview bootstrap metadata. It is deliberately kept outside
 * `ResolvedReaderDocumentV1`, whose shape is shared with future publication
 * resolution.
 */
export type ExperimentScenarioRuntimeSourceV1 = Readonly<{
  kind: "preview-bootstrap";
  sourceId: string;
  qualification: "uncertified-preview-only";
}>;

export type ExperimentScenarioV1 = Readonly<{
  scenarioId: string;
  label: string;
  runtimeSource: ExperimentScenarioRuntimeSourceV1;
}>;

export type ReaderSignalSpecV1 = Readonly<{
  signalId: string;
  label: string;
  unit: string;
}>;

export type ReaderInstantaneousReadbackSpecV1 = Readonly<{
  readbackId: string;
  signalId: string;
  label: string;
  unit: string;
  sampling: "instantaneous";
}>;

/**
 * `parameterKey` names the settable model input. `readbackSignalId` names an
 * optional observable and can never substitute for the parameter identity.
 * Explicit target scenario ids prevent an implicit "active scenario" binding.
 */
export type ReaderControlBindingV1 = Readonly<{
  parameterKey: string;
  readbackSignalId: string | null;
  target: Readonly<{
    scenarioIds: readonly string[];
    application: "absolute";
  }>;
}>;

export type ReaderControlSpecV1 = Readonly<{
  controlId: string;
  label: string;
  unit: string;
  allowedValues: readonly number[];
  initialValue: number;
  binding: ReaderControlBindingV1;
}>;

export type ReaderBriefV1 = Readonly<{
  schemaId: typeof STUDIO_READER_BRIEF_V1_SCHEMA_ID;
  briefId: StudioReaderBriefIdV1;
  extent: "inflow";
  graph: Readonly<{
    kind: "time-series";
    signals: readonly ReaderSignalSpecV1[];
  }>;
  instantaneousReadbacks: readonly ReaderInstantaneousReadbackSpecV1[];
  controls: readonly ReaderControlSpecV1[];
}>;

/**
 * An experiment revision selects exactly one model. Every scenario inherits
 * that selection and carries an explicit preview-only runtime source.
 */
export type ExperimentRevisionV1 = Readonly<{
  schemaId: typeof STUDIO_EXPERIMENT_REVISION_V1_SCHEMA_ID;
  experimentId: StudioExperimentIdV1;
  revision: StudioContentRevisionV1;
  modelRef: string;
  scenarios: readonly ExperimentScenarioV1[];
  readerBriefs: readonly ReaderBriefV1[];
}>;

export type StudioHeadingBlockV1 = Readonly<{
  blockId: StudioDocumentBlockIdV1;
  kind: "heading";
  level: 2 | 3;
  text: string;
}>;

export type StudioParagraphBlockV1 = Readonly<{
  blockId: StudioDocumentBlockIdV1;
  kind: "paragraph";
  text: string;
}>;

export type StudioExperimentPlacementBlockV1 = Readonly<{
  blockId: StudioDocumentBlockIdV1;
  kind: "experiment-placement";
  experimentId: StudioExperimentIdV1;
  readerBriefId: StudioReaderBriefIdV1;
}>;

export type StudioDocumentBlockV1 =
  | StudioHeadingBlockV1
  | StudioParagraphBlockV1
  | StudioExperimentPlacementBlockV1;

export type DocumentRevisionV1 = Readonly<{
  schemaId: typeof STUDIO_DOCUMENT_REVISION_V1_SCHEMA_ID;
  documentId: StudioDocumentIdV1;
  revision: StudioContentRevisionV1;
  locale: string;
  title: string;
  blocks: readonly StudioDocumentBlockV1[];
}>;

export type StudioAuthorDraftV1 = Readonly<{
  schemaId: typeof STUDIO_AUTHOR_DRAFT_V1_SCHEMA_ID;
  draftId: StudioDraftIdV1;
  revision: StudioContentRevisionV1;
  document: DocumentRevisionV1;
  experiments: readonly ExperimentRevisionV1[];
}>;

export type ResolvedReaderExperimentScenarioV1 = Readonly<{
  scenarioId: string;
  label: string;
}>;

/**
 * Publication-neutral resolved experiment content. Preview bootstrap sources
 * are transport bindings and therefore never travel inside this value.
 */
export type ResolvedReaderExperimentV1 = Readonly<{
  schemaId: typeof STUDIO_RESOLVED_READER_EXPERIMENT_V1_SCHEMA_ID;
  experimentId: StudioExperimentIdV1;
  revision: StudioContentRevisionV1;
  modelRef: string;
  scenarios: readonly ResolvedReaderExperimentScenarioV1[];
  readerBriefs: readonly ReaderBriefV1[];
}>;

export type ResolvedReaderExperimentPlacementV1 = Readonly<{
  placementBlockId: StudioDocumentBlockIdV1;
  experiment: ResolvedReaderExperimentV1;
  readerBrief: ReaderBriefV1;
}>;

/**
 * Join-complete, publication-neutral Reader input. A Reader does not need the
 * mutable author draft or a repository lookup to resolve experiment
 * placements, and future publication resolvers can produce the same shape
 * without carrying preview-only bootstrap metadata.
 */
export type ResolvedReaderDocumentV1 = Readonly<{
  schemaId: typeof STUDIO_RESOLVED_READER_DOCUMENT_V1_SCHEMA_ID;
  document: DocumentRevisionV1;
  placements: readonly ResolvedReaderExperimentPlacementV1[];
}>;

export type ReaderPreviewRuntimeBindingsV1 = Readonly<
  Record<string, ExperimentScenarioRuntimeSourceV1>
>;

export type ReaderPreviewManifestV1 = Readonly<{
  schemaId: typeof STUDIO_READER_PREVIEW_MANIFEST_V1_SCHEMA_ID;
  previewId: StudioReaderPreviewIdV1;
  trust: "draft-preview-uncertified";
  sharePolicy: "session-only";
  publicationManifestRef: null;
  source: Readonly<{
    kind: "draft-revision";
    draftId: StudioDraftIdV1;
    revision: StudioContentRevisionV1;
  }>;
  runtimeBindings: ReaderPreviewRuntimeBindingsV1;
  resolvedReaderDocument: ResolvedReaderDocumentV1;
}>;
