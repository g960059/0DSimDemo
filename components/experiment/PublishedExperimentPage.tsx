import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WorkbenchSession } from "@/components/workbench/WorkbenchSession";
import { PageLoadFailureV1 } from "@/components/ErrorBoundary";
import { usePreviousPageV1 } from "@/components/usePreviousPageV1";
import { homeHref } from "@/homeLinks";
import { isLocale } from "@/localeRouting";
import { createStudioSupabaseContentRepositoryV1 } from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";

/** Resolve each visit through the publication pointer; never share a replaceable Snapshot ID. */
export function PublishedExperimentPage() {
  const { publicSlug, locale } = useParams();
  const { t } = useTranslation();
  const goBack = usePreviousPageV1(homeHref(isLocale(locale) ? locale : undefined));
  const [state, setState] = React.useState<{ slug?: string; snapshotId?: string; error?: Error }>({});
  React.useEffect(() => {
    let active = true;
    setState({});
    const repository = createStudioSupabaseContentRepositoryV1();
    void (async () => {
      const snapshot = publicSlug && repository ? await repository.readPublicExperimentSnapshot(publicSlug) : null;
      if (!snapshot) throw new Error(t("workbench.editor.publication.unavailable"));
      if (active) setState({ slug: publicSlug, snapshotId: snapshot.snapshotId });
    })().catch(error => {
      if (active) setState({ slug: publicSlug, error: error instanceof Error ? error : new Error(String(error)) });
    });
    return () => { active = false; };
  }, [publicSlug, t]);
  if (state.slug === publicSlug && state.error) return <PageLoadFailureV1 error={state.error} onBack={goBack} />;
  if (state.slug !== publicSlug || !state.snapshotId) return <p className="p-5 text-sm text-wb-muted" role="status">{t("articleLibrary.loading")}</p>;
  return <WorkbenchSession key={state.snapshotId} initialExperimentId={null} sourceSnapshotId={state.snapshotId} />;
}
