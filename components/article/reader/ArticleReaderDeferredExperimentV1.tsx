import React from "react";
import { useTranslation } from "react-i18next";
import type { ExperimentSnapshotV2 } from "@/studio/contracts/v2/content";
import type { StudioClientCompositionV2 } from "@/studio/composition/StudioDefaultCompositionV2";
import type { ArticleReaderExperimentV3Props } from "./ArticleReaderExperimentV3";

type Props = Omit<ArticleReaderExperimentV3Props, "snapshot" | "contract" | "contractAvailability" | "runtimeComposition"> & {
  loadSnapshot(snapshotId: string): Promise<ExperimentSnapshotV2 | null>;
};
type Prepared = {
  Component: React.ComponentType<ArticleReaderExperimentV3Props>;
  snapshot: ExperimentSnapshotV2;
  composition: StudioClientCompositionV2;
};

/** Prose never waits for Snapshot reads, model admission or graph JavaScript. */
export function ArticleReaderDeferredExperimentV1({ loadSnapshot, ...props }: Props) {
  const { t } = useTranslation();
  const root = React.useRef<HTMLDivElement>(null);
  const [near, setNear] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  const [prepared, setPrepared] = React.useState<Prepared | null>(null);
  const [error, setError] = React.useState(false);
  const { placement } = props.block;
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") { setNear(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); }
    }, { rootMargin: "400px 0px" });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  React.useEffect(() => {
    if (!near) return;
    let current = true;
    setError(false);
    const prepare = async () => {
      // Start the independent code and data reads together, only near this placement.
      const [snapshot, module, compositionModule] = await Promise.all([
        loadSnapshot(placement.snapshotId),
        import("./ArticleReaderExperimentV3"),
        import("@/studio/composition/StudioDefaultCompositionV2"),
      ]);
      if (!current) return;
      if (!snapshot) throw new Error("Unavailable snapshot");
      const composition = await compositionModule.loadStudioSnapshotClientCompositionV2(
        snapshot.content.modelId, snapshot.content.surfaceSeriesId, snapshot.surfaceReleaseId,
      );
      if (current) setPrepared({ Component: module.ArticleReaderExperimentV3, snapshot, composition });
    };
    void prepare().catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [near, attempt, placement.snapshotId, loadSnapshot]);
  const title = placement.titleOverride?.trim() || placement.briefing.defaultTitle;
  return <div ref={root}>
    {prepared ? <prepared.Component {...props} snapshot={prepared.snapshot}
      contract={prepared.composition.modelSurface.contract} contractAvailability="ready"
      runtimeComposition={prepared.composition} /> :
      <section id={`placement-${placement.placementId}`} className="article-reader-placement min-w-0 scroll-mt-24"
        data-reader-placement-id={placement.placementId} data-reader-model-loading={error ? undefined : "true"}>
        <p className="text-sm font-semibold text-wb-text">{title}</p>
        {error ? <div className="mt-3 text-sm text-wb-muted">
          <p role="alert">{t("articleReader.unavailableSnapshot")}</p>
          <button className="mt-2 rounded text-wb-accent focus-visible:outline focus-visible:outline-2"
            onClick={() => setAttempt(value => value + 1)}>{t("articleReader.retryLoading")}</button>
        </div> : <div className="mt-4" role="status" aria-label={t("articleReader.preparingSimulation")}>
          <div className="article-loading-skeleton space-y-3" aria-hidden="true">
            <div className="article-skeleton-bar h-2 w-36" />
            <div className="article-skeleton-bar h-2 w-24" />
          </div>
        </div>}
        {placement.caption && <p className="article-experiment-caption">{placement.caption}</p>}
      </section>}
  </div>;
}
