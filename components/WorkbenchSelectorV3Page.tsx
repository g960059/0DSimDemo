import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenText,
  Download,
  FlaskConical,
  Home,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  allocateOpaqueWorkbenchIdV3,
  classifyWorkbenchAvailabilityV3,
} from "@/studio/infrastructure/browser/StudioWorkbenchIdentityV3";
import { articlesHref, experimentDetailHref, homeHref } from "@/homeLinks";
import { isLocale, type Locale } from "@/localeRouting";
import {
  loadStudioDefaultClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import type { ExperimentWorkspaceV2 } from "@/studio/contracts/v2/content";
import {
  StudioBrowserContentStoreV3,
  type StudioBrowserExperimentExportV3,
} from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";
import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";

type WorkbenchSelectorStateV3 =
  | Readonly<{ kind: "loading" }>
  | Readonly<{
      kind: "ready";
      currentModelId: string;
      workspaces: readonly ExperimentWorkspaceV2[];
    }>
  | Readonly<{ kind: "error"; message: string }>;

export function WorkbenchSelectorV3Page() {
  const { t } = useTranslation();
  const { locale: localeParam } = useParams();
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const navigate = useNavigate();
  const store = React.useMemo(() => new StudioBrowserContentStoreV3(), []);
  const [state, setState] = React.useState<WorkbenchSelectorStateV3>({
    kind: "loading",
  });
  const [actionError, setActionError] = React.useState<string | null>(null);

  const loadSelector = React.useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const composition = await loadStudioDefaultClientCompositionV2();
      const workspaces = Object.freeze([...store.listWorkspaces()].sort(
        (left, right) => left.experimentId.localeCompare(right.experimentId),
      ));
      setState({
        kind: "ready",
        currentModelId: composition.defaultModelId,
        workspaces,
      });
    } catch (error) {
      setState({ kind: "error", message: errorMessageV3(error) });
    }
  }, [store]);

  React.useEffect(() => {
    void loadSelector();
  }, [loadSelector]);

  const startLatestWorkbench = React.useCallback(() => {
    if (state.kind !== "ready") return;
    setActionError(null);
    try {
      const experimentId = allocateOpaqueWorkbenchIdV3(
        state.workspaces.map(({ experimentId }) => experimentId),
      );
      navigate(experimentDetailHref({ experimentId, locale }));
    } catch (error) {
      setActionError(errorMessageV3(error));
    }
  }, [locale, navigate, state]);

  const exportWorkbench = React.useCallback((experimentId: string) => {
    setActionError(null);
    try {
      downloadWorkbenchExportV3(store.exportExperiment(experimentId));
    } catch (error) {
      setActionError(errorMessageV3(error));
    }
  }, [store]);

  const deleteWorkbench = React.useCallback((experimentId: string) => {
    if (!window.confirm(t("workbench.selector.deleteConfirm"))) return;
    setActionError(null);
    try {
      store.deleteExperiment(experimentId);
      void loadSelector();
    } catch (error) {
      setActionError(errorMessageV3(error));
    }
  }, [loadSelector, store, t]);

  return (
    <div
      className="h-full overflow-y-auto bg-wb-app text-wb-text"
      data-testid="workbench-selector-v3"
    >
      <header className="sticky top-0 z-10 flex min-h-12 items-center justify-between gap-3 border-b border-wb-line bg-wb-panel px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={homeHref(locale)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-wb-muted hover:bg-wb-hover hover:text-wb-text"
            aria-label={t("workbench.editor.home")}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
          </Link>
          <h1 className="truncate text-sm font-bold">
            {t("workbench.selector.title")}
          </h1>
        </div>
        <Link
          to={articlesHref(locale)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-muted hover:bg-wb-hover hover:text-wb-text"
        >
          <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
          {t("workbench.editor.articles")}
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-wb-line bg-wb-panel p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-wb-accent">
                {t("workbench.selector.eyebrow")}
              </p>
              <h2 className="mt-2 text-xl font-bold">
                {t("workbench.selector.newTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-wb-muted">
                {t("workbench.selector.newDescription")}
              </p>
            </div>
            <button
              type="button"
              onClick={startLatestWorkbench}
              disabled={state.kind !== "ready"}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-wb-accent px-4 text-sm font-bold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-40"
              data-testid="create-workbench-v3"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("workbench.selector.newAction")}
            </button>
          </div>
        </section>

        {actionError !== null && (
          <p
            className="rounded-lg border border-wb-danger/50 bg-wb-danger-soft p-3 text-sm text-wb-danger"
            role="alert"
          >
            {actionError}
          </p>
        )}

        <section aria-labelledby="saved-workbenches-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="saved-workbenches-heading" className="text-sm font-bold">
              {t("workbench.selector.savedTitle")}
            </h2>
            {state.kind === "ready" && (
              <span className="text-xs text-wb-subtle">
                {t("workbench.selector.savedCount", {
                  count: state.workspaces.length,
                })}
              </span>
            )}
          </div>

          {state.kind === "loading" && (
            <p className="rounded-xl border border-wb-line bg-wb-panel p-5 text-sm text-wb-muted" role="status">
              {t("workbench.selector.loading")}
            </p>
          )}
          {state.kind === "error" && (
            <div className="rounded-xl border border-wb-danger/50 bg-wb-danger-soft p-5 text-sm text-wb-danger" role="alert">
              <p className="font-bold">{t("workbench.selector.errorTitle")}</p>
              <p className="mt-2 font-mono text-xs">{state.message}</p>
              <button
                type="button"
                onClick={() => void loadSelector()}
                className="mt-4 rounded-lg border border-wb-danger/50 bg-wb-panel px-3 py-2 text-xs font-bold text-wb-text"
              >
                {t("workbench.selector.retry")}
              </button>
            </div>
          )}
          {state.kind === "ready" && state.workspaces.length === 0 && (
            <div className="rounded-xl border border-dashed border-wb-line bg-wb-panel p-8 text-center">
              <FlaskConical className="mx-auto h-6 w-6 text-wb-subtle" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold">
                {t("workbench.selector.emptyTitle")}
              </p>
              <p className="mt-1 text-xs text-wb-muted">
                {t("workbench.selector.emptyDescription")}
              </p>
            </div>
          )}
          {state.kind === "ready" && state.workspaces.length > 0 && (
            <ul className="grid gap-3">
              {state.workspaces.map((workspace) => {
                const availability = classifyWorkbenchAvailabilityV3(
                  workspace.content.modelId,
                  state.currentModelId,
                );
                return (
                  <li
                    key={workspace.experimentId}
                    className="rounded-xl border border-wb-line bg-wb-panel p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {availability === "unavailable-model" && (
                            <AlertTriangle className="h-4 w-4 shrink-0 text-wb-warning" aria-hidden="true" />
                          )}
                          <p className="truncate text-sm font-bold">
                            {workspace.content.scenarios[0]?.label
                              ?? t("workbench.selector.untitled")}
                          </p>
                        </div>
                        <p className="mt-1 truncate font-mono text-[11px] text-wb-subtle">
                          {workspace.experimentId}
                        </p>
                        <p className="mt-1 truncate font-mono text-[11px] text-wb-muted">
                          {workspace.content.modelId}
                        </p>
                        {availability === "unavailable-model" && (
                          <p className="mt-2 text-xs text-wb-warning">
                            {t("workbench.selector.unavailable")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => exportWorkbench(workspace.experimentId)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wb-muted hover:bg-wb-hover hover:text-wb-text"
                          aria-label={t("workbench.selector.export")}
                          title={t("workbench.selector.export")}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteWorkbench(workspace.experimentId)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wb-muted hover:bg-wb-danger-soft hover:text-wb-danger"
                          aria-label={t("workbench.selector.delete")}
                          title={t("workbench.selector.delete")}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <Link
                          to={experimentDetailHref({
                            experimentId: workspace.experimentId,
                            locale,
                          })}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-wb-line bg-wb-soft px-3 text-xs font-bold hover:bg-wb-hover"
                        >
                          {availability === "available"
                            ? t("workbench.selector.open")
                            : t("workbench.selector.inspect")}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function downloadWorkbenchExportV3(
  exported: StudioBrowserExperimentExportV3,
): void {
  const blob = new Blob([studioCanonicalJsonStringify(exported)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${exported.workspace.experimentId}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function errorMessageV3(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default WorkbenchSelectorV3Page;
