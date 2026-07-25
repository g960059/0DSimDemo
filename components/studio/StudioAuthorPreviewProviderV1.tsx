import * as React from "react";

import {
  SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_AUTHOR_DRAFT_V1,
} from "@/components/scientificProduct/ScientificProductSampleAfterloadArticleV1";
import {
  StudioAuthorPreviewApplicationV1,
  type ReplaceStudioAuthorDocumentContentCommandV1,
  type ReplaceStudioAuthorReaderBriefGraphPanesCommandV1,
} from "@/studio/application/content";
import type {
  ReaderPreviewManifestV1,
  StudioAuthorDraftV1,
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
  retainCount: number;
  resetInFlight: boolean;
  manifest: ReaderPreviewManifestV1;
  abortController: AbortController;
  runtime: ScientificProductStudioScenarioRuntimeV1 | null;
  registry: ScientificProductStudioScenarioRegistryV1 | null;
  readerController: ScientificProductReaderExperimentControllerV1 | null;
};

export type StudioAuthorPreviewContextValueV1 = Readonly<{
  draft: StudioAuthorDraftV1;
  lastPreviewId: string | null;
  readerSession: StudioReaderPreviewSessionStateV1;
  updateTitle(title: string): StudioAuthorDraftV1;
  updateTextBlock(blockId: string, text: string): StudioAuthorDraftV1;
  replaceDocumentContent(
    command: ReplaceStudioAuthorDocumentContentCommandV1,
  ): StudioAuthorDraftV1;
  replaceReaderBriefGraphPanes(
    command: ReplaceStudioAuthorReaderBriefGraphPanesCommandV1,
  ): StudioAuthorDraftV1;
  materializePreview(): ReaderPreviewManifestV1;
  resolvePreview(previewId: string): ReaderPreviewManifestV1 | null;
  acquireReaderPreview(previewId: string): () => void;
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
  const [readerSession, setReaderSession] =
    React.useState<StudioReaderPreviewSessionStateV1>(
      Object.freeze({ phase: "idle" }),
    );
  const activeEntryRef = React.useRef<ActiveReaderPreviewEntryV1 | null>(null);

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

  const replaceReaderBriefGraphPanes = React.useCallback((
    command: ReplaceStudioAuthorReaderBriefGraphPanesCommandV1,
  ) => {
    const next = application.replaceReaderBriefGraphPanes(command);
    setDraft(next);
    return next;
  }, [application]);

  const materializePreview = React.useCallback(() => {
    const manifest = application.materializePreview({
      expectedRevision: application.getDraftSnapshot().revision,
    });
    setLastPreviewId(manifest.previewId);
    return manifest;
  }, [application]);

  const resolvePreview = React.useCallback(
    (previewId: string) => application.resolvePreview(previewId),
    [application],
  );

  const openEntry = React.useCallback(async (
    entry: ActiveReaderPreviewEntryV1,
    previous: ActiveReaderPreviewEntryV1 | null,
  ): Promise<void> => {
    if (previous !== null && previous !== entry) {
      await disposeReaderPreviewEntryV1(previous);
    }
    if (activeEntryRef.current !== entry || entry.retainCount === 0) return;

    let binding: ReturnType<
      typeof resolveStudioReaderPreviewRuntimeBindingV1
    >;
    try {
      binding = resolveStudioReaderPreviewRuntimeBindingV1(entry.manifest);
    } catch (error) {
      failReaderPreviewEntryV1(
        entry,
        activeEntryRef,
        setReaderSession,
        errorMessageV1(error),
      );
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
          if (activeEntryRef.current !== entry || entry.retainCount === 0) {
            return;
          }
          setReaderSession(Object.freeze({
            phase: "loading",
            previewId: entry.previewId,
            manifest: entry.manifest,
            message: progress.message,
          }));
        },
      });
      if (activeEntryRef.current !== entry || entry.retainCount === 0) {
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
              activeEntryRef,
              setReaderSession,
              () => openEntry(entry, null),
            );
          },
        });
      entry.readerController = readerController;
      setReaderSession(Object.freeze({
        phase: "ready",
        previewId: entry.previewId,
        manifest: entry.manifest,
        readerController,
        registry,
      }));
    } catch (error) {
      await disposeReaderPreviewEntryV1(entry);
      failReaderPreviewEntryV1(
        entry,
        activeEntryRef,
        setReaderSession,
        errorMessageV1(error),
      );
    }
  }, []);

  const acquireReaderPreview = React.useCallback((previewId: string) => {
    const manifest = application.resolvePreview(previewId);
    if (manifest === null) {
      const previous = activeEntryRef.current;
      activeEntryRef.current = null;
      if (previous !== null) void disposeReaderPreviewEntryV1(previous);
      setReaderSession(Object.freeze({
        phase: "expired",
        previewId,
        message:
          "This preview belongs to another browser session or has expired.",
      }));
      return () => undefined;
    }

    const current = activeEntryRef.current;
    if (current !== null && current.previewId === previewId) {
      current.retainCount += 1;
      return releaseReaderPreviewEntryV1(
        current,
        activeEntryRef,
        setReaderSession,
      );
    }

    const entry: ActiveReaderPreviewEntryV1 = {
      previewId,
      retainCount: 1,
      resetInFlight: false,
      manifest,
      abortController: new AbortController(),
      runtime: null,
      registry: null,
      readerController: null,
    };
    activeEntryRef.current = entry;
    setReaderSession(Object.freeze({
      phase: "loading",
      previewId,
      manifest,
      message: "Opening the authored one-point source…",
    }));
    void openEntry(entry, current);
    return releaseReaderPreviewEntryV1(
      entry,
      activeEntryRef,
      setReaderSession,
    );
  }, [application, openEntry]);

  const providerEffectGenerationRef = React.useRef(0);
  React.useEffect(() => {
    const effectGeneration = ++providerEffectGenerationRef.current;
    return () => {
      // React StrictMode replays effects without unmounting component state.
      // Defer ownership release by one microtask so the replayed setup can
      // supersede this cleanup. A real provider unmount has no later setup.
      globalThis.queueMicrotask(() => {
        if (providerEffectGenerationRef.current !== effectGeneration) return;
        const active = activeEntryRef.current;
        activeEntryRef.current = null;
        if (active !== null) void disposeReaderPreviewEntryV1(active);
      });
    };
  }, []);

  const value = React.useMemo<StudioAuthorPreviewContextValueV1>(() =>
    Object.freeze({
      draft,
      lastPreviewId,
      readerSession,
      updateTitle,
      updateTextBlock,
      replaceDocumentContent,
      replaceReaderBriefGraphPanes,
      materializePreview,
      resolvePreview,
      acquireReaderPreview,
    }), [
    acquireReaderPreview,
    draft,
    lastPreviewId,
    materializePreview,
    readerSession,
    replaceDocumentContent,
    replaceReaderBriefGraphPanes,
    resolvePreview,
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

function releaseReaderPreviewEntryV1(
  entry: ActiveReaderPreviewEntryV1,
  activeEntryRef: React.MutableRefObject<ActiveReaderPreviewEntryV1 | null>,
  setReaderSession: React.Dispatch<
    React.SetStateAction<StudioReaderPreviewSessionStateV1>
  >,
): () => void {
  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.retainCount = Math.max(0, entry.retainCount - 1);
    globalThis.queueMicrotask(() => {
      if (
        activeEntryRef.current !== entry
        || entry.retainCount !== 0
      ) return;
      activeEntryRef.current = null;
      setReaderSession(Object.freeze({ phase: "idle" }));
      void disposeReaderPreviewEntryV1(entry);
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
  activeEntryRef: React.MutableRefObject<ActiveReaderPreviewEntryV1 | null>,
  setReaderSession: React.Dispatch<
    React.SetStateAction<StudioReaderPreviewSessionStateV1>
  >,
  reopen: () => Promise<void>,
): void {
  if (
    activeEntryRef.current !== entry
    || entry.retainCount === 0
    || entry.resetInFlight
  ) return;
  entry.resetInFlight = true;
  setReaderSession(Object.freeze({
    phase: "loading",
    previewId: entry.previewId,
    manifest: entry.manifest,
    message: "Returning the experiment to its reference point…",
  }));
  void (async () => {
    try {
      await disposeReaderPreviewEntryV1(entry);
      if (
        activeEntryRef.current !== entry
        || entry.retainCount === 0
      ) return;
      entry.abortController = new AbortController();
      entry.resetInFlight = false;
      await reopen();
    } catch (error) {
      entry.resetInFlight = false;
      failReaderPreviewEntryV1(
        entry,
        activeEntryRef,
        setReaderSession,
        errorMessageV1(error),
      );
    }
  })();
}

function failReaderPreviewEntryV1(
  entry: ActiveReaderPreviewEntryV1,
  activeEntryRef: React.MutableRefObject<ActiveReaderPreviewEntryV1 | null>,
  setReaderSession: React.Dispatch<
    React.SetStateAction<StudioReaderPreviewSessionStateV1>
  >,
  message: string,
): void {
  if (activeEntryRef.current !== entry || entry.retainCount === 0) return;
  setReaderSession(Object.freeze({
    phase: "failed",
    previewId: entry.previewId,
    manifest: entry.manifest,
    message,
  }));
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
