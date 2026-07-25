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
export const STUDIO_GRAPH_PANE_V1_SCHEMA_ID =
  "circleheart-studio-graph-pane-v1" as const;
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

export type StudioGraphPaneKindV1 =
  | "waveform"
  | "pv-loop"
  | "guyton-left"
  | "guyton-right";

export type ReaderBriefExtentV1 = "inflow" | "peek" | "fullscreen";

export type StudioGraphPaneItemSpecV1 = Readonly<{
  /**
   * A waveform observable id or a portable pressure-volume trajectory id.
   * PV ids are resolved against each scenario's loaded workspace at capture
   * and Reader allocation boundaries; the content contract does not pretend
   * that the workspace catalog is globally fixed.
   */
  itemId: string;
  label: string;
  unit: string | null;
  color: string;
}>;

export type StudioGraphPaneScenarioSpecV1 = Readonly<{
  scenarioId: string;
  label: string;
  color: string;
  items: readonly StudioGraphPaneItemSpecV1[];
}>;

/**
 * A detached, renderer-neutral copy of the visible graph presentation.
 *
 * Every field is explicit so Reader output cannot silently inherit a later
 * Workbench default. Runtime frames, Worker jobs, settings-open state and
 * Dockview geometry never enter this value.
 */
export type StudioGraphPaneSpecV1 = Readonly<{
  schemaId: typeof STUDIO_GRAPH_PANE_V1_SCHEMA_ID;
  paneId: string;
  title: string;
  kind: StudioGraphPaneKindV1;
  scenarios: readonly StudioGraphPaneScenarioSpecV1[];
  presentation: Readonly<{
    showLegend: boolean;
    legendPosition: Readonly<{ xPct: number; yPct: number }> | null;
    showGuides: boolean;
    timeWindowMs: number | null;
    pvBeatHistoryCount: number | null;
    pvBeatHistoryMode: "fade" | "persistent" | null;
    pvParameterHistoryCount: 0 | 1 | 3 | 5 | 6 | null;
    pvRelationDisplayMode: "off" | "standard" | "research" | null;
    pvRelationPressureBasis: "intracavitary" | "transmural" | null;
    pvRelationShowSamplePoints: boolean | null;
    hemodynamicDetailMode:
      | "standard"
      | "settled-reference"
      | "compare"
      | null;
    hemodynamicParameterHistoryCount: 0 | 1 | 3 | 5 | null;
    hemodynamicAllowNegativeFillingPressure: boolean | null;
  }>;
}>;

export type ReaderBriefV1 = Readonly<{
  schemaId: typeof STUDIO_READER_BRIEF_V1_SCHEMA_ID;
  briefId: StudioReaderBriefIdV1;
  /**
   * Presentation extent is persisted as an explicit union from v1 onward.
   * The current Preview resolver intentionally accepts only `inflow` until
   * the peek and fullscreen interaction contracts are implemented.
   */
  extent: ReaderBriefExtentV1;
  graphPanes: readonly StudioGraphPaneSpecV1[];
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

/**
 * How one placement of an experiment behaves inside one article.
 *
 * This is a per-article decision, not a property of the experiment: the same
 * brief can read `compact` in a resident article and `live` in a specialist
 * one. `launch` shows the canonical seed point and opens on request only.
 */
export type ReaderPlacementInlineModeV1 = "live" | "compact" | "launch";

export type StudioExperimentPlacementBlockV1 = Readonly<{
  blockId: StudioDocumentBlockIdV1;
  kind: "experiment-placement";
  experimentId: StudioExperimentIdV1;
  readerBriefId: StudioReaderBriefIdV1;
  inlineMode: ReaderPlacementInlineModeV1;
  /** Article-local caption. The experiment itself never carries it. */
  localCaption: string | null;
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
  inlineMode: ReaderPlacementInlineModeV1;
  localCaption: string | null;
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
