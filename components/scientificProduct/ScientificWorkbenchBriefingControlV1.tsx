import * as React from "react";
import { createPortal } from "react-dom";
import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { authorPreviewHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import type { PanelDef } from "@/types";
import type {
  ExperimentRevisionV1,
  ReaderBriefExtentV1,
  ReaderBriefV1,
  ReaderControlSpecV1,
  ReaderInstantaneousReadbackSpecV1,
  StudioGraphPaneSpecV1,
} from "@/studio/contracts/v1";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1,
} from "./ScientificWorkbenchRuntimeRendererV1";
import {
  useStudioAuthorPreviewV1,
} from "@/components/studio/StudioAuthorPreviewProviderV1";
import {
  captureStudioGraphPaneSpecV1,
  studioGraphPaneCaptureDriftV1,
  type StudioGraphPaneCaptureDriftV1,
} from "@/components/studio/StudioGraphPaneProjectionV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "./ScientificProductRuntimeRegistryPortV1";
import {
  ScientificWorkbenchBriefingComposerV1,
} from "./ScientificWorkbenchBriefingComposerV1";
import type {
  StudioBriefingPickApiV1,
} from "./ScientificWorkbenchBriefingPickV1";

export type ScientificWorkbenchBriefingControlV1Props = Readonly<{
  panels: readonly PanelDef[];
  registry: ScientificProductRuntimeRegistryPortV1;
  activeScenarioId: string;
  target: Readonly<{
    experimentId: string;
    briefId: string;
    scenarioId: string;
  }>;
  /**
   * Compose is an authoring capability. A read/interact-only surface must not
   * render the entry point at all, so the clinical Workbench stays clean.
   */
  canCompose?: boolean;
  /** Reports open state so the host can reflow instead of being overlaid. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Publishes the pick API while compose is open, so the Workbench itself can
   * be the palette instead of a parallel list inside the drawer.
   */
  onPickApiChange?: (api: StudioBriefingPickApiV1 | null) => void;
}>;

/**
 * Workbench → Studio author-draft bridge for the session-only vertical slice.
 *
 * The control is the only authoring affordance that remains while compose is
 * closed. Pins are immutable presentation copies owned by ReaderBriefV1, so a
 * later Workbench edit is reported as drift rather than silently applied.
 */
export function ScientificWorkbenchBriefingControlV1({
  panels,
  registry,
  activeScenarioId,
  target: targetRef,
  canCompose = true,
  onOpenChange,
  onPickApiChange,
}: ScientificWorkbenchBriefingControlV1Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = localeFromPathname(location.pathname);
  const {
    draft,
    replaceReaderBriefGraphPanes,
    replaceReaderBriefSelection,
    replaceReaderBriefExtent,
  } = useStudioAuthorPreviewV1();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const target = readerBriefTargetV1(draft.experiments, targetRef);
  const pinnedPanes = target?.brief.graphPanes ?? [];

  const onOpenChangeRef = React.useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const setOpenV1 = React.useCallback((next: boolean) => {
    setOpen(next);
    onOpenChangeRef.current?.(next);
  }, []);

  React.useEffect(
    // Reporting closed must follow the layer's lifetime, not the identity of
    // an inline callback: a host rerender would otherwise collapse its reflow
    // while the composer is still open.
    () => () => onOpenChangeRef.current?.(false),
    [],
  );

  const captureScenarioIdMap = React.useMemo(
    () => new Map([[activeScenarioId, targetRef.scenarioId]]),
    [activeScenarioId, targetRef.scenarioId],
  );
  const previewScenarioIdMap = React.useMemo(
    () => new Map([[targetRef.scenarioId, activeScenarioId]]),
    [activeScenarioId, targetRef.scenarioId],
  );
  const panelByPaneId = React.useMemo(
    () => {
      const entries = new Map<string, PanelDef>();
      for (const panel of panels) {
        const paneId = panel.sourceViewId ?? panel.id;
        if (!entries.has(paneId)) entries.set(paneId, panel);
      }
      return entries;
    },
    [panels],
  );

  /**
   * Drift is derived, never author-maintained: re-capturing is pure, so the
   * pinned copy and its live source can always be compared by value.
   */
  const driftByPaneId = React.useMemo(
    () => {
      const drift = new Map<string, StudioGraphPaneCaptureDriftV1>();
      if (!open) return drift;
      for (const pane of pinnedPanes) {
        const panel = panelByPaneId.get(pane.paneId);
        drift.set(
          pane.paneId,
          panel === undefined
            ? Object.freeze({
              kind: "uncapturable",
              reason: t("studioAuthorPreview.briefing.errors.missingSource"),
            })
            : studioGraphPaneCaptureDriftV1(pane, {
              panel,
              registry,
              scenarioIdMap: captureScenarioIdMap,
            }),
        );
      }
      return drift;
    },
    [captureScenarioIdMap, open, panelByPaneId, pinnedPanes, registry, t],
  );

  /**
   * A Reader brief is referentially closed: every instantaneous readback and
   * every control readback signal must be backed by a pinned waveform item.
   * Unpinning is therefore not always legal, and the author is told why
   * before acting rather than after the command is rejected. Clearing the
   * last graph is legal — an empty brief is where every brief starts.
   */
  const unpinBlockedByPaneId = React.useMemo(() => {
    const blocked = new Map<string, string>();
    if (target === null) return blocked;
    const { brief } = target;
    // A per-beat metric is computed from a cycle, not read off a trace, so it
    // is not backed by a pinned waveform and must not hold a graph hostage.
    const requiredSignalIds = new Set<string>(
      brief.instantaneousReadbacks
        .filter(({ sampling }) => sampling !== "beat")
        .map(({ signalId }) => signalId),
    );
    for (const control of brief.controls) {
      if (control.binding.readbackSignalId !== null) {
        requiredSignalIds.add(control.binding.readbackSignalId);
      }
    }
    for (const pane of brief.graphPanes) {
      const remaining = new Set<string>();
      for (const other of brief.graphPanes) {
        if (other.paneId === pane.paneId || other.kind !== "waveform") continue;
        for (const scenario of other.scenarios) {
          for (const item of scenario.items) remaining.add(item.itemId);
        }
      }
      const missing = [...requiredSignalIds].filter(
        (signalId) => !remaining.has(signalId),
      );
      if (missing.length > 0) {
        blocked.set(
          pane.paneId,
          t("studioAuthorPreview.briefing.errors.backsReadbacks", {
            count: missing.length,
          }),
        );
      }
    }
    return blocked;
  }, [target, t]);

  /**
   * A readback can only exist where a pinned waveform carries its signal, so
   * the choices are derived from the pins rather than from a separate catalog.
   */
  const availableReadbacks = React.useMemo(() => {
    const options = new Map<string, ReaderInstantaneousReadbackSpecV1>();
    for (const pane of pinnedPanes) {
      if (pane.kind !== "waveform") continue;
      for (const scenario of pane.scenarios) {
        for (const item of scenario.items) {
          if (options.has(item.itemId)) continue;
          options.set(item.itemId, Object.freeze({
            readbackId: `readback-${item.itemId}`,
            signalId: item.itemId,
            label: item.label,
            unit: item.unit ?? "",
            sampling: "instantaneous",
          }));
        }
      }
    }
    return [...options.values()];
  }, [pinnedPanes]);

  const availableControls = React.useMemo(
    () => SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1.flatMap((item) => {
      const domain = MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
        item.paramKey as keyof
          typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0
      ];
      if (domain === undefined) return [];
      return [Object.freeze({
        controlId: `control-${item.paramKey}`,
        label: item.label,
        unit: domain.unit,
        allowedValues: [...domain.allowedValues],
        initialValue: domain.baseline,
        binding: Object.freeze({
          parameterKey: item.paramKey,
          readbackSignalId: null,
          target: Object.freeze({
            scenarioIds: [targetRef.scenarioId],
            application: "absolute" as const,
          }),
        }),
      }) as ReaderControlSpecV1];
    }),
    [targetRef.scenarioId],
  );

  const commitSelectionV1 = React.useCallback((
    readbacks: readonly ReaderInstantaneousReadbackSpecV1[],
    controls: readonly ReaderControlSpecV1[],
  ) => {
    if (target === null) {
      setError(t("studioAuthorPreview.briefing.errors.missingTarget"));
      return;
    }
    try {
      replaceReaderBriefSelection({
        expectedRevision: draft.revision,
        experimentId: target.experiment.experimentId,
        briefId: target.brief.briefId,
        instantaneousReadbacks: readbacks,
        controls,
      });
      setError(null);
    } catch (commitError) {
      setError(errorMessageV1(commitError));
    }
  }, [draft.revision, replaceReaderBriefSelection, target, t]);

  const commitExtentV1 = React.useCallback((
    extent: ReaderBriefExtentV1,
  ) => {
    if (target === null) {
      setError(t("studioAuthorPreview.briefing.errors.missingTarget"));
      return;
    }
    try {
      replaceReaderBriefExtent({
        expectedRevision: draft.revision,
        experimentId: target.experiment.experimentId,
        briefId: target.brief.briefId,
        extent,
      });
      setError(null);
    } catch (commitError) {
      setError(errorMessageV1(commitError));
    }
  }, [draft.revision, replaceReaderBriefExtent, target, t]);

  const toggleReadbackSpecV1 = React.useCallback((
    spec: ReaderInstantaneousReadbackSpecV1,
  ) => {
    if (target === null) return;
    const current = target.brief.instantaneousReadbacks;
    // A readback is identified by what it reads, not by the id this surface
    // would mint for it. A brief authored elsewhere carries its own ids, and
    // matching on those would both misreport the pick and append a duplicate
    // reading of the same signal.
    const next = current.some((readback) =>
        readbackIdentityV1(readback) === readbackIdentityV1(spec))
      ? current.filter((readback) =>
        readbackIdentityV1(readback) !== readbackIdentityV1(spec))
      : [...current, spec];
    commitSelectionV1(next, target.brief.controls);
  }, [commitSelectionV1, target]);

  const toggleControl = React.useCallback((parameterKey: string) => {
    if (target === null) return;
    const current = target.brief.controls;
    const next = current.some((control) =>
        control.binding.parameterKey === parameterKey)
      ? current.filter((control) =>
        control.binding.parameterKey !== parameterKey)
      : [
        ...current,
        ...availableControls.filter((option) =>
          option.binding.parameterKey === parameterKey),
      ];
    commitSelectionV1(target.brief.instantaneousReadbacks, next);
  }, [availableControls, commitSelectionV1, target]);

  const commitPanesV1 = React.useCallback((
    next: readonly StudioGraphPaneSpecV1[],
  ) => {
    if (target === null) {
      setError(t("studioAuthorPreview.briefing.errors.missingTarget"));
      return;
    }
    try {
      replaceReaderBriefGraphPanes({
        expectedRevision: draft.revision,
        experimentId: target.experiment.experimentId,
        briefId: target.brief.briefId,
        graphPanes: next,
      });
      setError(null);
    } catch (commitError) {
      setError(errorMessageV1(commitError));
    }
  }, [draft.revision, replaceReaderBriefGraphPanes, target, t]);

  const capturePaneV1 = React.useCallback((
    panelId: string,
  ): StudioGraphPaneSpecV1 | null => {
    if (activeScenarioId.length === 0) {
      setError(t("studioAuthorPreview.briefing.errors.missingScenario"));
      return null;
    }
    const panel = panels.find(({ id }) => id === panelId);
    if (panel === undefined) {
      setError(t("studioAuthorPreview.briefing.errors.unknownPane", {
        panelId,
      }));
      return null;
    }
    try {
      return captureStudioGraphPaneSpecV1({
        panel,
        registry,
        scenarioIdMap: captureScenarioIdMap,
      });
    } catch (captureError) {
      setError(errorMessageV1(captureError));
      return null;
    }
  }, [activeScenarioId, captureScenarioIdMap, panels, registry, t]);

  const pinPane = React.useCallback((panelId: string) => {
    const captured = capturePaneV1(panelId);
    if (captured === null) return;
    const withoutPane = pinnedPanes.filter(
      ({ paneId }) => paneId !== captured.paneId,
    );
    commitPanesV1(Object.freeze([...withoutPane, captured]));
  }, [capturePaneV1, commitPanesV1, pinnedPanes]);

  const unpinPane = React.useCallback((paneId: string) => {
    const blockedReason = unpinBlockedByPaneId.get(paneId);
    if (blockedReason !== undefined) {
      setError(blockedReason);
      return;
    }
    commitPanesV1(Object.freeze(
      pinnedPanes.filter((pane) => pane.paneId !== paneId),
    ));
  }, [commitPanesV1, pinnedPanes, unpinBlockedByPaneId]);

  const syncPane = React.useCallback((paneId: string) => {
    const panel = panelByPaneId.get(paneId);
    if (panel === undefined) {
      setError(t("studioAuthorPreview.briefing.errors.missingSource"));
      return;
    }
    const captured = capturePaneV1(panel.id);
    if (captured === null) return;
    commitPanesV1(Object.freeze(pinnedPanes.map((pane) =>
      pane.paneId === paneId ? captured : pane)));
  }, [capturePaneV1, commitPanesV1, panelByPaneId, pinnedPanes, t]);

  const movePane = React.useCallback((
    paneId: string,
    direction: -1 | 1,
  ) => {
    const from = pinnedPanes.findIndex((pane) => pane.paneId === paneId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= pinnedPanes.length) return;
    const next = [...pinnedPanes];
    const [moved] = next.splice(from, 1);
    if (moved === undefined) return;
    next.splice(to, 0, moved);
    commitPanesV1(Object.freeze(next));
  }, [commitPanesV1, pinnedPanes]);

  const pinnedPaneIdSet = React.useMemo(
    () => new Set(pinnedPanes.map(({ paneId }) => paneId)),
    [pinnedPanes],
  );
  const pinnedControlKeys = React.useMemo(
    () => new Set((target?.brief.controls ?? []).map((control) =>
      control.binding.parameterKey)),
    [target],
  );
  const onPickApiChangeRef = React.useRef(onPickApiChange);
  onPickApiChangeRef.current = onPickApiChange;
  const pinnedWaveformSignalIds = React.useMemo(
    () => new Set(availableReadbacks.map(({ signalId }) => signalId)),
    [availableReadbacks],
  );
  const pinnedReadbackIdentities = React.useMemo(
    () => new Set((target?.brief.instantaneousReadbacks ?? []).map(
      readbackIdentityV1,
    )),
    [target],
  );
  const readbackOptionBySignalId = React.useMemo(
    () => new Map(availableReadbacks.map((option) =>
      [option.signalId, option])),
    [availableReadbacks],
  );
  const pickApi = React.useMemo<StudioBriefingPickApiV1>(() => Object.freeze({
    isGraphPinned: (paneId: string) => pinnedPaneIdSet.has(paneId),
    toggleGraph: (panelId: string, paneId: string) => {
      if (pinnedPaneIdSet.has(paneId)) unpinPane(paneId);
      else pinPane(panelId);
    },
    isControlPinned: (parameterKey: string) =>
      pinnedControlKeys.has(parameterKey),
    toggleControl,
    isSignalPinned: (signalId: string) =>
      pinnedReadbackIdentities.has(`instantaneous|${signalId}`),
    toggleSignal: (signalId: string, label: string, unit: string) => {
      const pinned = pinnedReadbackIdentities.has(
        `instantaneous|${signalId}`,
      );
      // An instantaneous readback is only legal where a pinned waveform
      // carries the signal. Say so before the command is rejected.
      if (!pinned && !pinnedWaveformSignalIds.has(signalId)) {
        setError(t("studioAuthorPreview.briefing.errors.signalNeedsGraph", {
          label,
        }));
        return;
      }
      // A legend names a trace; it does not carry the unit. The pinned
      // waveform item does, and a readback without one is rejected.
      const option = readbackOptionBySignalId.get(signalId);
      toggleReadbackSpecV1(Object.freeze({
        readbackId: `readback-${signalId}`,
        signalId,
        label: label.length > 0 ? label : option?.label ?? signalId,
        unit: unit.length > 0 ? unit : option?.unit ?? "",
        sampling: "instantaneous",
      }));
    },
    isBeatMetricPinned: (metricId: string) =>
      pinnedReadbackIdentities.has(`beat|${metricId}`),
    toggleBeatMetric: (metricId: string, label: string, unit: string) =>
      toggleReadbackSpecV1(Object.freeze({
        readbackId: `beat-${metricId}`,
        signalId: metricId,
        label,
        unit,
        sampling: "beat",
      })),
  }), [
    pinPane,
    pinnedControlKeys,
    pinnedPaneIdSet,
    readbackOptionBySignalId,
    pinnedReadbackIdentities,
    pinnedWaveformSignalIds,
    t,
    toggleControl,
    toggleReadbackSpecV1,
    unpinPane,
  ]);
  React.useEffect(() => {
    onPickApiChangeRef.current?.(open ? pickApi : null);
  }, [open, pickApi]);
  React.useEffect(
    () => () => onPickApiChangeRef.current?.(null),
    [],
  );

  if (!canCompose) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenV1(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-wb-line bg-wb-panel px-2.5 text-xs font-bold text-wb-muted hover:bg-wb-hover hover:text-wb-text active:scale-[0.98]"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-testid="scientific-workbench-open-briefing-v1"
      >
        <ClipboardList className="h-3.5 w-3.5" />
        <span className="hidden md:inline">
          {t("studioAuthorPreview.briefing.button")}
        </span>
        {pinnedPanes.length > 0 && (
          <span className="rounded-full bg-wb-active px-1.5 py-0.5 text-[10px] text-wb-text">
            {pinnedPanes.length}
          </span>
        )}
      </button>
      {error !== null && !open && (
        <span className="sr-only" role="alert">{error}</span>
      )}
      {open && typeof document !== "undefined" && createPortal(
        <>
          <ScientificWorkbenchBriefingComposerV1
            open
            panels={panels}
            pinnedPanes={pinnedPanes}
            driftByPaneId={driftByPaneId}
            unpinBlockedByPaneId={unpinBlockedByPaneId}
            registry={registry}
            previewScenarioIdMap={previewScenarioIdMap}
            readbacks={target?.brief.instantaneousReadbacks ?? []}
            controls={target?.brief.controls ?? []}
            extent={target?.brief.extent ?? "inflow"}
            onExtentChange={commitExtentV1}
            onClose={() => setOpenV1(false)}
            onPin={pinPane}
            onUnpin={unpinPane}
            onSync={syncPane}
            onMove={movePane}
            onOpenDocumentEditor={() => {
              setOpenV1(false);
              navigate(authorPreviewHref(locale));
            }}
          />
          {error !== null && (
            <div
              role="alert"
              className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-lg border border-red-400/30 bg-red-950 px-4 py-3 text-xs leading-5 text-red-100 shadow-xl"
            >
              {error}
            </div>
          )}
        </>,
        document.body,
      )}
    </>
  );
}

function readerBriefTargetV1(
  experiments: readonly ExperimentRevisionV1[],
  target: ScientificWorkbenchBriefingControlV1Props["target"],
): Readonly<{
  experiment: ExperimentRevisionV1;
  brief: ReaderBriefV1;
}> | null {
  const experiment = experiments.find(
    ({ experimentId }) => experimentId === target.experimentId,
  );
  if (
    experiment === undefined
    || !experiment.scenarios.some(
      ({ scenarioId }) => scenarioId === target.scenarioId,
    )
  ) return null;
  const brief = experiment.readerBriefs.find(
    ({ briefId }) => briefId === target.briefId,
  );
  return brief === undefined ? null : { experiment, brief };
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * What a readback reads, which is what makes two of them the same reading.
 * The same signal sampled per-beat and instantaneously are different readings
 * and may both be pinned.
 */
function readbackIdentityV1(
  readback: ReaderInstantaneousReadbackSpecV1,
): string {
  return `${readback.sampling}|${readback.signalId}`;
}
