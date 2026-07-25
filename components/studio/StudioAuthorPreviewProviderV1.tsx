import * as React from "react";

import {
  SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_AUTHOR_DRAFT_V1,
} from "@/components/scientificProduct/ScientificProductSampleAfterloadArticleV1";
import {
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
  SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1,
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  scientificProductCaseByIdV1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import {
  StudioAuthorPreviewApplicationV1,
  StudioAuthorPreviewRevisionConflictErrorV1,
  type ReplaceStudioAuthorDocumentContentCommandV1,
  type ReplaceStudioAuthorReaderBriefExtentCommandV1,
  type ReplaceStudioAuthorReaderBriefGraphPanesCommandV1,
  type ReplaceStudioAuthorReaderBriefSelectionCommandV1,
} from "@/studio/application/content";
import type {
  ReaderPreviewManifestV1,
  ResolvedReaderDocumentV1,
  StudioAuthorDraftV1,
  StudioDocumentBlockV1,
} from "@/studio/contracts/v1";

import type {
  ScientificProductReaderExperimentControllerV1,
} from "@/components/scientificProduct/ScientificProductReaderExperimentControllerV1";
import type {
  ScientificProductStudioScenarioRegistryV1,
  ScientificProductStudioScenarioRuntimeV1,
} from "@/components/scientificProduct/ScientificProductStudioScenarioRegistryV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "@/components/scientificProduct/ScientificProductRuntimeRegistryPortV1";
import {
  resolveStudioReaderPreviewRuntimeBindingV1,
} from "./StudioReaderPreviewRuntimeBindingV1";

export type StudioReaderPreviewSessionStateV1 =
  | Readonly<{ phase: "idle" }>
  | Readonly<{
    phase: "expired";
    previewId: string;
    message: string;
  }>
  | Readonly<{
    phase: "loading";
    previewId: string;
    manifest: ReaderPreviewManifestV1;
    message: string;
  }>
  | Readonly<{
    phase: "ready";
    previewId: string;
    manifest: ReaderPreviewManifestV1;
    readerController: ScientificProductReaderExperimentControllerV1;
    registry: ScientificProductRuntimeRegistryPortV1;
  }>
  | Readonly<{
    phase: "failed";
    previewId: string;
    manifest: ReaderPreviewManifestV1;
    message: string;
  }>;

type ActiveReaderPreviewEntryV1 = {
  previewId: string;
  placementBlockId: string;
  retainCount: number;
  resetInFlight: boolean;
  /** Monotonic use order; the least recently used bound session is evicted. */
  lastUsedOrdinal: number;
  manifest: ReaderPreviewManifestV1;
  abortController: AbortController;
  runtime: ScientificProductStudioScenarioRuntimeV1 | null;
  registry: ScientificProductStudioScenarioRegistryV1 | null;
  readerController: ScientificProductReaderExperimentControllerV1 | null;
};

/**
 * How many placements may hold a numerical session at once.
 *
 * A long article can carry more experiments than a browser should run Workers
 * for, and visibility alone bounds nothing: a reader can leave several on
 * screen. This is the only hard bound, so it is stated as one. Re-binding an
 * evicted placement costs a fresh bootstrap, which is why the limit is not 1.
 */
export const STUDIO_READER_BOUND_PLACEMENT_LIMIT_V1 = 3;

export type StudioAuthorPreviewContextValueV1 = Readonly<{
  draft: StudioAuthorDraftV1;
  /** The current draft resolved as Reader input, for the unified surface. */
  resolvedDocument: ResolvedReaderDocumentV1;
  lastPreviewId: string | null;
  /** Numerical session state per placement; absent means never bound. */
  readerSessions: ReadonlyMap<string, StudioReaderPreviewSessionStateV1>;
  updateTitle(title: string): StudioAuthorDraftV1;
  updateTextBlock(blockId: string, text: string): StudioAuthorDraftV1;
  replaceDocumentContent(
    command: ReplaceStudioAuthorDocumentContentCommandV1,
  ): StudioAuthorDraftV1;
  /**
   * Commits content against the freshest revision. A long-lived editor buffer
   * must not carry a stale `expectedRevision` from its render closure.
   */
  replaceDocumentContentLatest(
    title: string,
    blocks: readonly StudioDocumentBlockV1[],
    expectedDocumentRevision: number,
  ): StudioAuthorDraftV1;
  canUndoDocumentContent: boolean;
  canRedoDocumentContent: boolean;
  undoDocumentContent(): void;
  redoDocumentContent(): void;
  replaceReaderBriefGraphPanes(
    command: ReplaceStudioAuthorReaderBriefGraphPanesCommandV1,
  ): StudioAuthorDraftV1;
  replaceReaderBriefSelection(
    command: ReplaceStudioAuthorReaderBriefSelectionCommandV1,
  ): StudioAuthorDraftV1;
  replaceReaderBriefExtent(
    command: ReplaceStudioAuthorReaderBriefExtentCommandV1,
  ): StudioAuthorDraftV1;
  /**
   * Adds an experiment bound to this release and returns what an article
   * block needs to place it. Its Reader brief starts empty.
   */
  createExperiment(sourceId?: string): Readonly<{
    experimentId: string;
    readerBriefId: string;
  }>;
  /** Cases an experiment may read, for the surface that offers the choice. */
  experimentSources: readonly Readonly<{
    sourceId: string;
    label: string;
  }>[];
  /** Which case an experiment reads now, or null when it is unknown. */
  sourceForExperiment(experimentId: string): string | null;
  /** Repoints an experiment's scenario at another case. */
  replaceExperimentSource(experimentId: string, sourceId: string): void;
  materializePreview(): ReaderPreviewManifestV1;
  resolvePreview(previewId: string): ReaderPreviewManifestV1 | null;
  /**
   * Binds one placement's numerical session, or retains an existing one.
   * Returns the release. Binding is what a surface asks for when a placement
   * comes within reach of the reader, not when the document loads.
   */
  acquireReaderPlacement(
    previewId: string,
    placementBlockId: string,
  ): () => void;
  /** Marks a placement as most recently used, so eviction takes another. */
  noteReaderPlacementUse(placementBlockId: string): void;
}>;

const StudioAuthorPreviewContextV1 =
  React.createContext<StudioAuthorPreviewContextValueV1 | null>(null);

/**
 * Session-scoped owner for the first greenfield Author → Reader Preview slice.
 *
 * The provider survives localized child-route transitions, while every Reader
 * visit gets a fresh numerical session. A hard reload constructs a fresh
 * application and therefore cannot resolve an old preview URL.
 */
export function StudioAuthorPreviewProviderV1({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const applicationRef = React.useRef<StudioAuthorPreviewApplicationV1 | null>(
    null,
  );
  if (applicationRef.current === null) {
    applicationRef.current = new StudioAuthorPreviewApplicationV1({
      initialDraft: SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_AUTHOR_DRAFT_V1,
    });
  }
  const application = applicationRef.current;
  const [draft, setDraft] = React.useState(
    application.getDraftSnapshot(),
  );
  const [lastPreviewId, setLastPreviewId] = React.useState<string | null>(null);
  const [readerSessions, setReaderSessions] = React.useState<
    ReadonlyMap<string, StudioReaderPreviewSessionStateV1>
  >(() => new Map());
  const entriesRef = React.useRef(
    new Map<string, ActiveReaderPreviewEntryV1>(),
  );
  const useOrdinalRef = React.useRef(0);
  const setPlacementSession = React.useCallback((
    placementBlockId: string,
    state: StudioReaderPreviewSessionStateV1 | null,
  ) => {
    setReaderSessions((current) => {
      const next = new Map(current);
      if (state === null) next.delete(placementBlockId);
      else next.set(placementBlockId, state);
      return next;
    });
  }, []);

  const updateTitle = React.useCallback((title: string) => {
    const current = application.getDraftSnapshot();
    if (current.document.title === title) return current;
    const next = application.updateTitle({
      expectedRevision: current.revision,
      title,
    });
    setDraft(next);
    return next;
  }, [application]);

  const updateTextBlock = React.useCallback((
    blockId: string,
    text: string,
  ) => {
    const current = application.getDraftSnapshot();
    const block = current.document.blocks.find(
      (candidate) => candidate.blockId === blockId,
    );
    if (block?.kind !== "experiment-placement" && block?.text === text) {
      return current;
    }
    const next = application.updateTextBlock({
      expectedRevision: current.revision,
      blockId,
      text,
    });
    setDraft(next);
    return next;
  }, [application]);

  const replaceDocumentContent = React.useCallback((
    command: ReplaceStudioAuthorDocumentContentCommandV1,
  ) => {
    const next = application.replaceDocumentContent(command);
    setDraft(next);
    return next;
  }, [application]);

  const replaceDocumentContentLatest = React.useCallback((
    title: string,
    blocks: readonly StudioDocumentBlockV1[],
    expectedDocumentRevision: number,
  ) => {
    const current = application.getDraftSnapshot();
    // The editor buffer carries a whole-document replacement, so committing it
    // against a document another writer has advanced would silently restore
    // the older content. The draft revision may have moved for an unrelated
    // aggregate (a Reader brief), which is not a conflict.
    if (current.document.revision !== expectedDocumentRevision) {
      throw new StudioAuthorPreviewRevisionConflictErrorV1(
        expectedDocumentRevision,
        current.document.revision,
      );
    }
    const next = application.replaceDocumentContent({
      expectedRevision: current.revision,
      title,
      blocks,
    });
    setDraft(next);
    return next;
  }, [application]);

  const replaceReaderBriefGraphPanes = React.useCallback((
    command: ReplaceStudioAuthorReaderBriefGraphPanesCommandV1,
  ) => {
    const next = application.replaceReaderBriefGraphPanes(command);
    setDraft(next);
    return next;
  }, [application]);

  const undoDocumentContent = React.useCallback(() => {
    setDraft(application.undoDocumentContent());
  }, [application]);

  const redoDocumentContent = React.useCallback(() => {
    setDraft(application.redoDocumentContent());
  }, [application]);

  const replaceReaderBriefSelection = React.useCallback((
    command: ReplaceStudioAuthorReaderBriefSelectionCommandV1,
  ) => {
    const next = application.replaceReaderBriefSelection(command);
    setDraft(next);
    return next;
  }, [application]);

  const replaceReaderBriefExtent = React.useCallback((
    command: ReplaceStudioAuthorReaderBriefExtentCommandV1,
  ) => {
    const next = application.replaceReaderBriefExtent(command);
    setDraft(next);
    return next;
  }, [application]);

  const createExperiment = React.useCallback((sourceId?: string) => {
    const suffix = globalThis.crypto.randomUUID();
    const reference = Object.freeze({
      experimentId: `experiment/${suffix}`,
      readerBriefId: `reader-brief/${suffix}`,
    });
    // An unnamed case means the official baseline: the one case every article
    // can be read against without a research claim attached to it.
    const caseEntry = scientificProductCaseByIdV1(
      sourceId ?? SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1,
    );
    if (caseEntry === null) {
      throw new Error(`Unknown runtime source ${String(sourceId)}`);
    }
    setDraft(application.createExperiment({
      expectedRevision: application.getDraftSnapshot().revision,
      experimentId: reference.experimentId,
      modelRef: `${SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id}`
        + `@${SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version}`
        + `:sha256:${SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256}`,
      scenarioId: `scenario/${suffix}`,
      scenarioLabel: caseEntry.displayName,
      runtimeSource: Object.freeze({
        kind: "preview-bootstrap",
        sourceId: caseEntry.caseId,
        qualification: "uncertified-preview-only",
      }),
      readerBriefId: reference.readerBriefId,
    }));
    return reference;
  }, [application]);

  const experimentSources = React.useMemo(
    () => Object.freeze(SCIENTIFIC_PRODUCT_CASE_CATALOG_V1.map((entry) =>
      Object.freeze({ sourceId: entry.caseId, label: entry.displayName }))),
    [],
  );

  const sourceForExperiment = React.useCallback((experimentId: string) => {
    const experiment = application.getDraftSnapshot().experiments.find(
      (candidate) => candidate.experimentId === experimentId,
    );
    return experiment?.scenarios[0]?.runtimeSource.sourceId ?? null;
  }, [application]);

  const replaceExperimentSource = React.useCallback((
    experimentId: string,
    sourceId: string,
  ) => {
    const current = application.getDraftSnapshot();
    const experiment = current.experiments.find((candidate) =>
      candidate.experimentId === experimentId);
    const scenario = experiment?.scenarios[0];
    const caseEntry = scientificProductCaseByIdV1(sourceId);
    if (scenario === undefined || caseEntry === null) return;
    setDraft(application.replaceExperimentRuntimeSource({
      expectedRevision: current.revision,
      experimentId,
      scenarioId: scenario.scenarioId,
      scenarioLabel: caseEntry.displayName,
      runtimeSource: Object.freeze({
        kind: "preview-bootstrap",
        sourceId: caseEntry.caseId,
        qualification: "uncertified-preview-only",
      }),
    }));
  }, [application]);

  /**
   * The last manifest and the runtime binding it was minted for.
   *
   * A surface asks for a preview whenever it mounts, and minting a fresh one
   * each time would orphan every warm session the previous manifest owned —
   * a Workbench round trip would cost a full bootstrap per placement even
   * though nothing about what they run had changed.
   */
  const lastManifestRef = React.useRef<Readonly<{
    signature: string;
    manifest: ReaderPreviewManifestV1;
  }> | null>(null);

  const materializePreview = React.useCallback(() => {
    const signature = runtimeBindingSignatureV1(
      application.getDraftSnapshot(),
    );
    const cached = lastManifestRef.current;
    if (
      cached !== null
      && cached.signature === signature
      && application.resolvePreview(cached.manifest.previewId) !== null
    ) {
      setLastPreviewId(cached.manifest.previewId);
      return cached.manifest;
    }
    const manifest = application.materializePreview({
      expectedRevision: application.getDraftSnapshot().revision,
    });
    lastManifestRef.current = Object.freeze({ signature, manifest });
    setLastPreviewId(manifest.previewId);
    return manifest;
  }, [application]);

  const resolvePreview = React.useCallback(
    (previewId: string) => application.resolvePreview(previewId),
    [application],
  );

  const openEntry = React.useCallback(async (
    entry: ActiveReaderPreviewEntryV1,
  ): Promise<void> => {
    const entries = entriesRef.current;
    // Ownership is holding the slot, not being displayed. A reader can scroll
    // past while the session is still opening; abandoning the open there would
    // leave a cached entry that says "loading" forever, since re-acquiring it
    // finds the entry present and never opens it again. Eviction, not the
    // scroll position, is what ends an open.
    const owns = () => entries.get(entry.placementBlockId) === entry;
    if (!owns()) return;

    let binding: ReturnType<
      typeof resolveStudioReaderPreviewRuntimeBindingV1
    >;
    try {
      binding = resolveStudioReaderPreviewRuntimeBindingV1(
        entry.manifest,
        entry.placementBlockId,
      );
    } catch (error) {
      failReaderPreviewEntryV1(entry, owns, setPlacementSession, errorMessageV1(error));
      return;
    }
    const { placement, scenario, caseEntry } = binding;

    try {
      const [
        { InMemoryContentAddressedArtifactStoreV1 },
        {
          loadScientificProductStudioScenarioRuntimeV1,
          ScientificProductStudioScenarioRegistryV1,
        },
        {
          ScientificProductReaderExperimentControllerV1,
        },
      ] = await Promise.all([
        import(
          "@/studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1"
        ),
        import(
          "@/components/scientificProduct/ScientificProductStudioScenarioRegistryV1"
        ),
        import(
          "@/components/scientificProduct/ScientificProductReaderExperimentControllerV1"
        ),
      ]);
      const artifacts = new InMemoryContentAddressedArtifactStoreV1();
      const runtime = await loadScientificProductStudioScenarioRuntimeV1({
        scenarioId: scenario.scenarioId,
        caseEntry,
        artifacts,
        signal: entry.abortController.signal,
        // Reader must paint the canonical settled source as one point before
        // the shared graph registry can observe any live-transition frames.
        deferInitialLivePresentation: true,
        onProgress: (progress) => {
          if (!owns()) return;
          setPlacementSession(entry.placementBlockId, Object.freeze({
            phase: "loading",
            previewId: entry.previewId,
            manifest: entry.manifest,
            message: progress.message,
          }));
        },
      });
      if (!owns()) {
        await runtime.controller.dispose();
        return;
      }
      entry.runtime = runtime;
      const registry = new ScientificProductStudioScenarioRegistryV1(
        Object.freeze({
          requestedCaseId: caseEntry.caseId,
          canonicalCaseId: caseEntry.caseId,
          aliasApplied: null,
          caseEntry,
        }),
        runtime,
      );
      registry.connect();
      entry.registry = registry;
      const readerController =
        ScientificProductReaderExperimentControllerV1.create({
          brief: placement.readerBrief,
          runtime,
          resetToSource: () => {
            restartReaderPreviewEntryV1(
              entry,
              owns,
              setPlacementSession,
              () => openEntry(entry),
            );
          },
        });
      entry.readerController = readerController;
      setPlacementSession(entry.placementBlockId, Object.freeze({
        phase: "ready",
        previewId: entry.previewId,
        manifest: entry.manifest,
        readerController,
        registry,
      }));
    } catch (error) {
      await disposeReaderPreviewEntryV1(entry);
      failReaderPreviewEntryV1(entry, owns, setPlacementSession, errorMessageV1(error));
    }
  }, [setPlacementSession]);

  /**
   * Evicts the least recently used warm placement once the limit is passed.
   *
   * Only a session nobody is showing may be taken: a placement on screen is
   * never disposed under the reader. If every session is in use the cache
   * simply runs over the limit, which is the honest outcome — there is no
   * session here that could be dropped without breaking what is displayed.
   */
  const evictOverflowPlacementsV1 = React.useCallback(() => {
    const entries = entriesRef.current;
    while (entries.size > STUDIO_READER_BOUND_PLACEMENT_LIMIT_V1) {
      let victim: ActiveReaderPreviewEntryV1 | null = null;
      for (const candidate of entries.values()) {
        if (candidate.retainCount > 0) continue;
        if (
          victim === null
          || candidate.lastUsedOrdinal < victim.lastUsedOrdinal
        ) {
          victim = candidate;
        }
      }
      if (victim === null) return;
      entries.delete(victim.placementBlockId);
      setPlacementSession(victim.placementBlockId, null);
      void disposeReaderPreviewEntryV1(victim);
    }
  }, [setPlacementSession]);

  const noteReaderPlacementUse = React.useCallback((
    placementBlockId: string,
  ) => {
    const entry = entriesRef.current.get(placementBlockId);
    if (entry === undefined) return;
    entry.lastUsedOrdinal = ++useOrdinalRef.current;
  }, []);

  const acquireReaderPlacement = React.useCallback((
    previewId: string,
    placementBlockId: string,
  ) => {
    const entries = entriesRef.current;
    const manifest = application.resolvePreview(previewId);
    if (manifest === null) {
      const previous = entries.get(placementBlockId);
      if (previous !== undefined) {
        entries.delete(placementBlockId);
        void disposeReaderPreviewEntryV1(previous);
      }
      setPlacementSession(placementBlockId, Object.freeze({
        phase: "expired",
        previewId,
        message:
          "This preview belongs to another browser session or has expired.",
      }));
      return () => undefined;
    }

    const current = entries.get(placementBlockId);
    if (current !== undefined && current.previewId === previewId) {
      // A warm session: the reader came back to an experiment they left.
      current.retainCount += 1;
      current.lastUsedOrdinal = ++useOrdinalRef.current;
      return releaseReaderPreviewEntryV1(
        current,
        entriesRef,
        evictOverflowPlacementsV1,
      );
    }
    if (current !== undefined) {
      entries.delete(placementBlockId);
      void disposeReaderPreviewEntryV1(current);
    }

    const entry: ActiveReaderPreviewEntryV1 = {
      previewId,
      placementBlockId,
      retainCount: 1,
      resetInFlight: false,
      lastUsedOrdinal: ++useOrdinalRef.current,
      manifest,
      abortController: new AbortController(),
      runtime: null,
      registry: null,
      readerController: null,
    };
    entries.set(placementBlockId, entry);
    evictOverflowPlacementsV1();
    setPlacementSession(placementBlockId, Object.freeze({
      phase: "loading",
      previewId,
      manifest,
      message: "Opening the authored one-point source…",
    }));
    void openEntry(entry);
    return releaseReaderPreviewEntryV1(
      entry,
      entriesRef,
      evictOverflowPlacementsV1,
    );
  }, [application, evictOverflowPlacementsV1, openEntry, setPlacementSession]);

  const providerEffectGenerationRef = React.useRef(0);
  React.useEffect(() => {
    const effectGeneration = ++providerEffectGenerationRef.current;
    return () => {
      // React StrictMode replays effects without unmounting component state.
      // Defer ownership release by one microtask so the replayed setup can
      // supersede this cleanup. A real provider unmount has no later setup.
      globalThis.queueMicrotask(() => {
        if (providerEffectGenerationRef.current !== effectGeneration) return;
        const entries = entriesRef.current;
        const active = [...entries.values()];
        entries.clear();
        for (const entry of active) void disposeReaderPreviewEntryV1(entry);
      });
    };
  }, []);

  const resolvedDocument = React.useMemo(
    () => application.resolveDocument(),
    [application, draft],
  );

  const value = React.useMemo<StudioAuthorPreviewContextValueV1>(() =>
    Object.freeze({
      draft,
      resolvedDocument,
      lastPreviewId,
      readerSessions,
      updateTitle,
      updateTextBlock,
      replaceDocumentContent,
      replaceDocumentContentLatest,
      canUndoDocumentContent: application.canUndoDocumentContent(),
      canRedoDocumentContent: application.canRedoDocumentContent(),
      undoDocumentContent,
      redoDocumentContent,
      replaceReaderBriefGraphPanes,
      replaceReaderBriefSelection,
      replaceReaderBriefExtent,
      createExperiment,
      experimentSources,
      sourceForExperiment,
      replaceExperimentSource,
      materializePreview,
      resolvePreview,
      acquireReaderPlacement,
      noteReaderPlacementUse,
    }), [
    acquireReaderPlacement,
    createExperiment,
    draft,
    experimentSources,
    replaceExperimentSource,
    sourceForExperiment,
    lastPreviewId,
    materializePreview,
    noteReaderPlacementUse,
    readerSessions,
    replaceDocumentContent,
    redoDocumentContent,
    replaceDocumentContentLatest,
    replaceReaderBriefGraphPanes,
    replaceReaderBriefExtent,
    replaceReaderBriefSelection,
    resolvePreview,
    resolvedDocument,
    undoDocumentContent,
    updateTextBlock,
    updateTitle,
  ]);

  return (
    <StudioAuthorPreviewContextV1.Provider value={value}>
      {children}
    </StudioAuthorPreviewContextV1.Provider>
  );
}

export function useStudioAuthorPreviewV1():
StudioAuthorPreviewContextValueV1 {
  const value = React.useContext(StudioAuthorPreviewContextV1);
  if (value === null) {
    throw new Error(
      "Studio Author Preview context is not mounted",
    );
  }
  return value;
}

/**
 * Releasing a placement stops it integrating; it does not throw the session
 * away.
 *
 * A reader who scrolls past an experiment and comes back expects to find it
 * where they left it, and re-binding costs a full bootstrap. So a released
 * session stays warm and merely becomes evictable — the session limit, not
 * the scroll position, is what finally disposes one.
 */
function releaseReaderPreviewEntryV1(
  entry: ActiveReaderPreviewEntryV1,
  entriesRef: React.MutableRefObject<
    Map<string, ActiveReaderPreviewEntryV1>
  >,
  onReleased: (entry: ActiveReaderPreviewEntryV1) => void,
): () => void {
  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.retainCount = Math.max(0, entry.retainCount - 1);
    globalThis.queueMicrotask(() => {
      const entries = entriesRef.current;
      if (
        entries.get(entry.placementBlockId) !== entry
        || entry.retainCount !== 0
      ) return;
      // Nobody is showing it, so nobody should be paying for its integration.
      entry.readerController?.suspendPresentation();
      onReleased(entry);
    });
  };
}

async function disposeReaderPreviewEntryV1(
  entry: ActiveReaderPreviewEntryV1,
): Promise<void> {
  entry.abortController.abort();
  entry.readerController?.dispose();
  entry.readerController = null;
  const registry = entry.registry;
  entry.registry = null;
  const runtime = entry.runtime;
  entry.runtime = null;
  if (registry !== null) {
    await registry.dispose();
  } else if (runtime !== null) {
    await runtime.controller.dispose();
  }
}

/**
 * Reader Reset is a source restoration, not a parameter patch. Reusing the
 * preview-open path guarantees a fresh Worker session, the same immutable
 * manifest binding, and the same canonical one-point first paint.
 */
function restartReaderPreviewEntryV1(
  entry: ActiveReaderPreviewEntryV1,
  owns: () => boolean,
  setPlacementSession: (
    placementBlockId: string,
    state: StudioReaderPreviewSessionStateV1 | null,
  ) => void,
  reopen: () => Promise<void>,
): void {
  if (!owns() || entry.resetInFlight) return;
  entry.resetInFlight = true;
  setPlacementSession(entry.placementBlockId, Object.freeze({
    phase: "loading",
    previewId: entry.previewId,
    manifest: entry.manifest,
    message: "Returning the experiment to its reference point…",
  }));
  void (async () => {
    try {
      await disposeReaderPreviewEntryV1(entry);
      // Cleared before the ownership check: an entry that lost the slot
      // mid-reset must not be left marked as resetting, or a later acquire
      // would find a cached entry that can never reopen.
      entry.abortController = new AbortController();
      entry.resetInFlight = false;
      if (!owns()) return;
      await reopen();
    } catch (error) {
      entry.resetInFlight = false;
      failReaderPreviewEntryV1(
        entry,
        owns,
        setPlacementSession,
        errorMessageV1(error),
      );
    }
  })();
}

function failReaderPreviewEntryV1(
  entry: ActiveReaderPreviewEntryV1,
  owns: () => boolean,
  setPlacementSession: (
    placementBlockId: string,
    state: StudioReaderPreviewSessionStateV1 | null,
  ) => void,
  message: string,
): void {
  if (!owns()) return;
  setPlacementSession(entry.placementBlockId, Object.freeze({
    phase: "failed",
    previewId: entry.previewId,
    manifest: entry.manifest,
    message,
  }));
}

/**
 * What a preview manifest is bound to: the placements it carries and, for
 * each, the brief and runtime source behind it. Two drafts with the same
 * signature produce interchangeable manifests, so the previous one can be
 * reused rather than orphaning the sessions opened against it.
 */
function runtimeBindingSignatureV1(draft: StudioAuthorDraftV1): string {
  return JSON.stringify(
    draft.document.blocks
      .filter((block) => block.kind === "experiment-placement")
      .map((block) => {
        const experiment = draft.experiments.find(({ experimentId }) =>
          experimentId === block.experimentId);
        const brief = experiment?.readerBriefs.find(({ briefId }) =>
          briefId === block.readerBriefId);
        return JSON.stringify([
          block.blockId,
          block.experimentId,
          block.readerBriefId,
          block.inlineMode,
          block.localCaption,
          experiment?.modelRef ?? null,
          experiment?.scenarios ?? null,
          brief ?? null,
        ]);
      })
      .sort(),
  );
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
