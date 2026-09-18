import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WorkbenchSession } from "@/components/workbench/WorkbenchSession";
import { PageLoadFailureV1 } from "@/components/ErrorBoundary";
import { usePreviousPageV1 } from "@/components/usePreviousPageV1";
import { homeHref } from "@/homeLinks";
import { isLocale } from "@/localeRouting";
import { createStudioSupabaseContentRepositoryV1 } from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
import { BrowserExperimentIndex } from "@/studio/infrastructure/browser/BrowserExperimentIndex";
import { BrowserContentStore } from "@/studio/infrastructure/browser/BrowserContentStore";

/** Resolve each visit through the publication pointer; never share a replaceable Snapshot ID. */
export function PublishedExperimentPage() {
  const { publicSlug, locale } = useParams();
  const { t } = useTranslation();
  const goBack = usePreviousPageV1(homeHref(isLocale(locale) ? locale : undefined));
  const [state, setState] = React.useState<{ slug?: string; snapshotId?: string; unavailable?: boolean; error?: Error }>({});
  React.useEffect(() => {
    let active = true;
    setState({});
    const repository = createStudioSupabaseContentRepositoryV1();
    void (async () => {
      // Browser-only catalogs use their Experiment ID as the local publication alias.
      const localSnapshotId = !repository && publicSlug ? new BrowserExperimentIndex().read(publicSlug)?.publishedSnapshotId : null;
      const snapshot = publicSlug && repository ? await repository.readPublicExperimentSnapshot(publicSlug)
        : localSnapshotId ? new BrowserContentStore().readSnapshot(localSnapshotId) : null;
      if (active) setState(snapshot ? { slug: publicSlug, snapshotId: snapshot.snapshotId } : { slug: publicSlug, unavailable: true });
    })().catch(error => {
      if (active) setState({ slug: publicSlug, error: error instanceof Error ? error : new Error(String(error)) });
    });
    return () => { active = false; };
  }, [publicSlug]);
  if (state.slug === publicSlug && state.error) return <PageLoadFailureV1 error={state.error} onBack={goBack} />;
  if (state.slug === publicSlug && state.unavailable) return <main className="flex h-full min-h-72 items-center justify-center bg-wb-app px-5 py-12 text-wb-text" data-testid="publication-unavailable-v1">
    <section className="w-full max-w-md" role="status">
      <h1 className="text-xl font-semibold">{t("workbench.editor.publication.unavailableTitle")}</h1>
      <p className="mt-3 text-sm leading-7 text-wb-muted">{t("workbench.editor.publication.unavailable")}</p>
      <button type="button" onClick={goBack} className="mt-6 min-h-10 rounded-lg bg-wb-primary px-4 text-sm font-semibold text-white hover:bg-wb-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent">{t("common.back")}</button>
    </section>
  </main>;
  if (state.slug !== publicSlug || !state.snapshotId) return <p className="p-5 text-sm text-wb-muted" role="status">{t("snapshotReader.loading")}</p>;
  return <WorkbenchSession key={state.snapshotId} initialExperimentId={null} sourceSnapshotId={state.snapshotId} />;
}
