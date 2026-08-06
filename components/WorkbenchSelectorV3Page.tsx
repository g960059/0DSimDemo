import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  FlaskConical,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  classifyExperimentAvailabilityV3,
} from "@/studio/infrastructure/browser/StudioExperimentIdentityV3";
import {
  experimentDetailHref,
  experimentSnapshotHref,
  newExperimentHref,
} from "@/homeLinks";
import { isLocale, type Locale } from "@/localeRouting";
import {
  loadStudioDefaultClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import type { ExperimentV2 } from "@/studio/contracts/v2/content";
import { StudioBrowserContentStoreV3 } from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";
import {
  StudioBrowserExperimentIndexV3,
  STUDIO_BROWSER_EXPERIMENT_RECORD_V3_SCHEMA_ID,
  type StudioBrowserExperimentRecordV3,
} from "@/studio/infrastructure/browser/StudioBrowserExperimentIndexV3";
import {
  createStudioSupabaseContentRepositoryV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";

type WorkbenchSelectorItemV3 = Readonly<{
  record: StudioBrowserExperimentRecordV3;
  experiment: ExperimentV2 | null;
}>;

type WorkbenchSelectorStateV3 =
  | Readonly<{ kind: "loading" }>
  | Readonly<{
      kind: "ready";
      currentModelId: string;
      items: readonly WorkbenchSelectorItemV3[];
    }>
  | Readonly<{ kind: "error"; message: string }>;

export function WorkbenchSelectorV3Page() {
  const { t } = useTranslation();
  const { locale: localeParam } = useParams();
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const navigate = useNavigate();
  const store = React.useMemo(() => new StudioBrowserContentStoreV3(), []);
  const remoteRepository = React.useMemo(
    createStudioSupabaseContentRepositoryV1,
    [],
  );
  const experimentIndex = React.useMemo(
    () => new StudioBrowserExperimentIndexV3(),
    [],
  );
  const [state, setState] = React.useState<WorkbenchSelectorStateV3>({
    kind: "loading",
  });
  const [actionError, setActionError] = React.useState<string | null>(null);

  const loadSelector = React.useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const composition = await loadStudioDefaultClientCompositionV2();
      if (remoteRepository !== null) {
        const resources = await remoteRepository.listMyExperiments();
        setState({
          kind: "ready",
          currentModelId: composition.defaultModelId,
          items: Object.freeze(resources.map((resource) => Object.freeze({
            record: Object.freeze({
              schemaId: STUDIO_BROWSER_EXPERIMENT_RECORD_V3_SCHEMA_ID,
              experimentId: resource.experiment.experimentId,
              title: resource.title,
              createdAt: resource.createdAt,
              updatedAt: resource.updatedAt,
              publishedSnapshotId: resource.publishedSnapshotId,
            }),
            experiment: resource.experiment,
          }))),
        });
        return;
      }
      const experiments = store.listExperiments();
      const nowIso = new Date().toISOString();
      for (const experiment of experiments) {
        experimentIndex.ensure({
          experimentId: experiment.experimentId,
          title: experiment.content.scenarios[0]?.label
            ?? t("workbench.selector.untitled"),
          nowIso,
        });
      }
      for (const record of experimentIndex.list()) {
        if (!experiments.some((experiment) =>
          experiment.experimentId === record.experimentId)) {
          experimentIndex.delete(record.experimentId);
          continue;
        }
        if (record.publishedSnapshotId === null) continue;
        const published = store.readSnapshot(record.publishedSnapshotId);
        if (published === null) {
          throw new Error(
            `Experiment publication pointer is invalid: ${record.experimentId}`,
          );
        }
      }
      const experimentById = new Map(experiments.map((experiment) => [
        experiment.experimentId,
        experiment,
      ]));
      const items = Object.freeze(experiments
        .map((experiment) => Object.freeze({
          record: experimentIndex.read(experiment.experimentId)!,
          experiment: experimentById.get(experiment.experimentId) ?? null,
        }))
        .sort((left, right) =>
          right.record.updatedAt.localeCompare(left.record.updatedAt)));
      setState({
        kind: "ready",
        currentModelId: composition.defaultModelId,
        items,
      });
    } catch (error) {
      setState({ kind: "error", message: errorMessageV3(error) });
    }
  }, [experimentIndex, remoteRepository, store, t]);

  React.useEffect(() => {
    void loadSelector();
  }, [loadSelector]);

  const startLatestWorkbench = React.useCallback(() => {
    if (state.kind !== "ready") return;
    setActionError(null);
    navigate(newExperimentHref(locale));
  }, [locale, navigate, state]);

  const deleteWorkbench = React.useCallback(async (
    experimentId: string,
    expectedVersion: number,
  ) => {
    if (!window.confirm(t("workbench.selector.deleteConfirm"))) return;
    setActionError(null);
    try {
      if (remoteRepository === null) {
        store.deleteExperiment(experimentId);
        experimentIndex.delete(experimentId);
      } else {
        await remoteRepository.deleteExperiment(experimentId, expectedVersion);
      }
      await loadSelector();
    } catch (error) {
      setActionError(errorMessageV3(error));
    }
  }, [experimentIndex, loadSelector, remoteRepository, store, t]);

  return (
    <div
      className="h-full overflow-y-auto bg-wb-app text-wb-text"
      data-testid="workbench-selector-v3"
    >
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-wb-accent">
            {t("workbench.selector.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            {t("workbench.selector.title")}
          </h1>
        </div>
        <section className="rounded-2xl border border-wb-line bg-wb-panel p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">
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
                  count: state.items.length,
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
          {state.kind === "ready" && state.items.length === 0 && (
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
          {state.kind === "ready" && state.items.length > 0 && (
            <ul className="divide-y divide-wb-line/80 border-y border-wb-line/80">
              {state.items.map(({ record, experiment }) => {
                const availability = experiment === null
                  ? "available"
                  : classifyExperimentAvailabilityV3(
                    experiment.content.modelId,
                    state.currentModelId,
                  );
                return (
                  <li
                    key={record.experimentId}
                    className="group flex min-h-16 items-center gap-3 px-1 py-3 sm:px-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {availability === "unavailable-model" && (
                          <AlertTriangle
                            className="h-3.5 w-3.5 shrink-0 text-wb-warning"
                            aria-hidden="true"
                          />
                        )}
                        <p className="truncate text-sm font-semibold tracking-tight">
                          {record.title}
                        </p>
                      </div>
                      <div className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-wb-subtle">
                        <span className={record.publishedSnapshotId === null
                          ? "text-wb-muted"
                          : "text-wb-accent"}
                        >
                          {record.publishedSnapshotId === null
                            ? t("workbench.selector.statusDraft")
                            : t("workbench.selector.statusPublished")}
                        </span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={record.updatedAt}>
                          {formatExperimentUpdatedAtV3(record.updatedAt, locale)}
                        </time>
                        {availability === "unavailable-model" && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate text-wb-warning">
                              {t("workbench.selector.unavailable")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Link
                        to={experimentDetailHref({
                          experimentId: record.experimentId,
                          locale,
                        })}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                        aria-label={availability === "available"
                          ? t("workbench.selector.open")
                          : t("workbench.selector.inspect")}
                        title={availability === "available"
                          ? t("workbench.selector.open")
                          : t("workbench.selector.inspect")}
                      >
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      {record.publishedSnapshotId !== null && (
                        <Link
                          to={experimentSnapshotHref({
                            locale,
                            snapshotId: record.publishedSnapshotId,
                          })}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-accent active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                          aria-label={t("workbench.selector.openPublished")}
                          title={t("workbench.selector.openPublished")}
                        >
                          <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => void deleteWorkbench(
                          record.experimentId,
                          experiment?.version ?? 0,
                        )}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-danger-soft hover:text-wb-danger active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-danger"
                        aria-label={t("workbench.selector.delete")}
                        title={t("workbench.selector.delete")}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
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

function formatExperimentUpdatedAtV3(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function errorMessageV3(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default WorkbenchSelectorV3Page;
