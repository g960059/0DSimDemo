import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  FlaskConical,
  PencilLine,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { ManagementPageHeaderV1 } from "@/components/management/ContentManagementV1";

import {
  resolveExperimentAvailabilityV3,
  type ExperimentAvailabilityV3,
} from "@/studio/infrastructure/browser/StudioExperimentIdentityV3";
import {
  experimentDetailHref,
  experimentSnapshotHref,
  publishedExperimentHref,
  newExperimentHref,
} from "@/homeLinks";
import { isLocale, type Locale } from "@/localeRouting";
import {
  loadStudioDefaultClientCompositionV2,
  loadStudioExperimentClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import { BrowserContentStore } from "@/studio/infrastructure/browser/BrowserContentStore";
import {
  BrowserExperimentIndex,
  BROWSER_EXPERIMENT_RECORD_SCHEMA_ID,
  type BrowserExperimentRecord,
} from "@/studio/infrastructure/browser/BrowserExperimentIndex";
import {
  createStudioSupabaseContentRepositoryV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";

type WorkbenchSelectorItemV3 = Readonly<{
  record: BrowserExperimentRecord;
  modelId: string;
  surfaceSeriesId: string;
  version: number;
}>;

type WorkbenchSelectorStateV3 =
  | Readonly<{ kind: "loading" }>
  | Readonly<{
      kind: "ready";
      items: readonly WorkbenchSelectorItemV3[];
      availabilityByExperimentId: ReadonlyMap<string, ExperimentAvailabilityV3>;
    }>
  | Readonly<{ kind: "error"; message: string }>;

export function WorkbenchSelectorPage() {
  const { t } = useTranslation();
  const { locale: localeParam } = useParams();
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const store = React.useMemo(() => new BrowserContentStore(), []);
  const remoteRepository = React.useMemo(
    createStudioSupabaseContentRepositoryV1,
    [],
  );
  const experimentIndex = React.useMemo(
    () => new BrowserExperimentIndex(),
    [],
  );
  const [state, setState] = React.useState<WorkbenchSelectorStateV3>({
    kind: "loading",
  });
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [deletingExperimentId, setDeletingExperimentId] = React.useState<string | null>(null);

  const loadSelector = React.useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const composition = await loadStudioDefaultClientCompositionV2();
      if (remoteRepository !== null) {
        const resources = (await remoteRepository.listMyExperiments()).items;
        const items = Object.freeze(resources.map((resource) => Object.freeze({
          record: Object.freeze({
            schemaId: BROWSER_EXPERIMENT_RECORD_SCHEMA_ID,
            experimentId: resource.experimentId,
            title: resource.title,
            createdAt: resource.createdAt,
            updatedAt: resource.updatedAt,
            publishedSnapshotId: resource.publishedSnapshotId,
            publicSlug: resource.publicSlug,
          }),
          modelId: resource.modelId,
          surfaceSeriesId: resource.surfaceSeriesId,
          version: resource.version,
        })));
        setState({
          kind: "ready",
          items,
          availabilityByExperimentId: await resolveExperimentAvailabilityV3(
            {
              savedExperiments: items.map((item) => ({
                experimentId: item.record.experimentId,
                modelId: item.modelId,
                surfaceSeriesId: item.surfaceSeriesId,
              })),
              activeModelId: composition.exactModel.modelId,
              resolveExperiment: loadStudioExperimentClientCompositionV2,
            },
          ),
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
      const items = Object.freeze(experiments
        .map((experiment) => Object.freeze({
          record: experimentIndex.read(experiment.experimentId)!,
          modelId: experiment.content.modelId,
          surfaceSeriesId: experiment.content.surfaceSeriesId,
          version: experiment.version,
        }))
        .sort((left, right) =>
          right.record.updatedAt.localeCompare(left.record.updatedAt)));
      setState({
        kind: "ready",
        items,
        availabilityByExperimentId: await resolveExperimentAvailabilityV3(
          {
            savedExperiments: items.map((item) => ({
              experimentId: item.record.experimentId,
              modelId: item.modelId,
              surfaceSeriesId: item.surfaceSeriesId,
            })),
            activeModelId: composition.exactModel.modelId,
            resolveExperiment: loadStudioExperimentClientCompositionV2,
          },
        ),
      });
    } catch (error) {
      setState({ kind: "error", message: errorMessageV3(error) });
    }
  }, [experimentIndex, remoteRepository, store, t]);

  React.useEffect(() => {
    void loadSelector();
  }, [loadSelector]);

  const deleteWorkbench = React.useCallback(async (
    experimentId: string,
    expectedVersion: number,
  ) => {
    if (deletingExperimentId !== null) return;
    if (!window.confirm(t("workbench.selector.deleteConfirm"))) return;
    setDeletingExperimentId(experimentId);
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
    } finally {
      setDeletingExperimentId(null);
    }
  }, [deletingExperimentId, experimentIndex, loadSelector, remoteRepository, store, t]);

  return (
    <div
      className="management-page"
      data-testid="workbench-selector-v3"
    >
      <main>
        <ManagementPageHeaderV1
          title={t("management.manageExperiments")}
          createHref={newExperimentHref(locale)}
          createLabel={t("workbench.selector.newAction")}
          createTestId="create-workbench-v3"
        />

        {actionError !== null && (
          <p className="mt-6 rounded-xl bg-wb-danger-soft p-4 text-sm text-wb-danger" role="alert">
            {actionError}
          </p>
        )}

        {state.kind === "loading" ? (
          <p className="mt-8 text-sm text-wb-muted" role="status">
            {t("workbench.selector.loading")}
          </p>
        ) : state.kind === "error" ? (
          <div className="mt-8 rounded-xl bg-wb-danger-soft p-4 text-sm text-wb-danger" role="alert">
            <p className="font-semibold">{t("workbench.selector.errorTitle")}</p>
            <p className="mt-2 text-xs">{state.message}</p>
            <button
              type="button"
              onClick={() => void loadSelector()}
              className="mt-4 rounded-lg border border-wb-line bg-wb-panel px-3 py-2 text-xs font-semibold text-wb-text"
            >
              {t("workbench.selector.retry")}
            </button>
          </div>
        ) : state.items.length === 0 ? (
          <section className="mt-12 py-12 text-center">
            <FlaskConical className="mx-auto h-7 w-7 text-wb-subtle" aria-hidden="true" />
            <h2 className="mt-4 text-sm font-semibold">
              {t("workbench.selector.emptyTitle")}
            </h2>
            <p className="mt-2 text-xs leading-6 text-wb-muted">
              {t("workbench.selector.emptyDescription")}
            </p>
          </section>
        ) : (
          <ul className="management-list" aria-label={t("workbench.selector.savedTitle")}>
            {state.items.map(({ record, version }) => {
              const availability = state.availabilityByExperimentId.get(record.experimentId)
                ?? "unavailable-model";
              const editHref = experimentDetailHref({ experimentId: record.experimentId, locale });
              return (
                <li key={record.experimentId} className="management-row">
                  <div className="management-row-content">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold tracking-tight">
                        <Link to={editHref} className="rounded hover:text-wb-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent">
                          {record.title}
                        </Link>
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-wb-subtle">
                        <span className={record.publishedSnapshotId === null ? "text-wb-muted" : "text-wb-accent"}>
                          {t(record.publishedSnapshotId === null
                            ? "workbench.selector.statusDraft"
                            : "workbench.selector.statusPublished")}
                        </span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={record.updatedAt}>
                          {t("workbench.selector.updated", {
                            date: formatExperimentUpdatedAtV3(record.updatedAt, locale),
                          })}
                        </time>
                        {record.publishedSnapshotId !== null && (
                          <>
                            <span aria-hidden="true">·</span>
                            <Link
                              to={record.publicSlug ? publishedExperimentHref({ locale, publicSlug: record.publicSlug }) : experimentSnapshotHref({ locale, snapshotId: record.publishedSnapshotId })}
                              className="inline-flex min-h-8 items-center gap-1 rounded text-wb-muted underline-offset-4 hover:text-wb-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                            >
                              {t("workbench.selector.openPublished")}
                              <ArrowRight className="h-3 w-3" aria-hidden="true" />
                            </Link>
                          </>
                        )}
                      </div>
                      {availability === "unavailable-model" && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-wb-warning">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {t("workbench.selector.unavailable")}
                        </p>
                      )}
                    </div>
                    <div className="management-row-actions">
                      <Link
                        to={editHref}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                      >
                        <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                        {t(availability !== "unavailable-model" ? "workbench.selector.edit" : "workbench.selector.inspect")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => void deleteWorkbench(record.experimentId, version)}
                        disabled={deletingExperimentId !== null}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-danger-soft hover:text-wb-danger active:scale-[0.97] disabled:cursor-wait disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-danger"
                        aria-label={t("workbench.selector.delete")}
                        title={t("workbench.selector.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
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

export default WorkbenchSelectorPage;
