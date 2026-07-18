import React from "react";
import { useTranslation } from "react-i18next";
import type { AuthoredViewSpec } from "@/features/workbench/authoredViews";
import type { WorkbenchRuntimeRenderer } from "@/features/workbench/runtime/WorkbenchRuntimeRenderer";
import type { ClinicalKnobs } from "@/engine/knobs";
import type { SimulationHealth } from "@/engine/protocol";
import type { PhysicsRefState, SimInstance, SimulationParams } from "@/types";

const LegacyAuthoredViewBody = React.lazy(
  () => import("./LegacyAuthoredViewBody"),
);

export type AuthoredViewRuntime = {
  /** Workbench-wide renderer used by panes, authored views and note embeds. */
  runtimeRenderer?: WorkbenchRuntimeRenderer;
  activeScenarioId?: string;
  presentationMode?: "studio" | "reading";
  /** @deprecated Compatibility fields for adapters that have not moved to renderAuthoredView yet. */
  instances?: SimInstance[];
  /** @deprecated Compatibility fields for adapters that have not moved to renderAuthoredView yet. */
  physicsRefs?: React.MutableRefObject<Map<string, PhysicsRefState>>;
  /** @deprecated Compatibility fields for adapters that have not moved to renderAuthoredView yet. */
  instanceHealth?: Record<string, SimulationHealth>;
  /** @deprecated Use activeScenarioId. */
  activeInstanceId?: string;
  /** @deprecated Compatibility fields for adapters that have not moved to renderAuthoredView yet. */
  updateInstanceParams?: (id: string, params: Partial<SimulationParams>) => void;
  /** @deprecated Compatibility fields for adapters that have not moved to renderAuthoredView yet. */
  updateInstanceKnobs?: (id: string, knobs: ClinicalKnobs) => void;
  /** @deprecated Compatibility fields for adapters that have not moved to renderAuthoredView yet. */
  updateInstanceVolume?: (id: string, vol: number) => void;
};

export function AuthoredViewPlaceholder({ viewId }: { viewId: string }) {
  const { t } = useTranslation();
  return (
    <div className="my-3 rounded-md border border-dashed border-wb-line bg-wb-strip px-3 py-2 text-xs text-wb-subtle" contentEditable={false}>
      <div className="font-semibold text-wb-muted">{t("notes.viewRef.missingTitle")}</div>
      <div className="mt-1 font-mono">{viewId || t("notes.viewRef.unknownView")}</div>
    </div>
  );
}

export function AuthoredViewEmbed({
  viewId,
  authoredViews,
  runtime,
  className = "",
}: {
  viewId: string;
  authoredViews: readonly AuthoredViewSpec[];
  runtime?: AuthoredViewRuntime;
  className?: string;
}) {
  const view = authoredViews.find((candidate) => candidate.id === viewId);
  if (!view || !runtime) return <AuthoredViewPlaceholder viewId={viewId} />;

  const activeScenarioId = runtime.activeScenarioId
    ?? runtime.activeInstanceId
    ?? runtime.instances?.[0]?.id;
  const presentationMode = runtime.presentationMode ?? "reading";
  const body = runtime.runtimeRenderer
    ? runtime.runtimeRenderer.renderAuthoredView(view, {
        instances: runtime.instances ?? [],
        activeInstanceId: activeScenarioId,
        presentationMode,
      })
    : (
        <React.Suspense fallback={<div className="min-h-[180px] bg-wb-aux" />}>
          <LegacyAuthoredViewBody view={view} runtime={runtime} />
        </React.Suspense>
      );

  if (body === undefined || body === null) return <AuthoredViewPlaceholder viewId={viewId} />;

  return (
    <figure
      className={`workbench-authored-view-embed my-4 block w-full max-w-full overflow-hidden rounded-md border border-wb-line bg-wb-input text-wb-text ${className}`}
      contentEditable={false}
      data-authored-view-id={view.id}
      data-authored-view-kind={view.kind}
    >
      <figcaption className="border-b border-wb-line px-3 py-1.5 text-[11px] font-medium text-wb-subtle">
        {view.title}
      </figcaption>
      <div className={
        view.kind === "controller"
          ? "relative h-[360px] max-h-[58vh] w-full max-w-full overflow-y-auto"
          : view.kind === "graph"
            ? "relative h-[320px] min-h-[180px] w-full max-w-full"
            : "relative min-h-[180px] w-full max-w-full"
      }>
        {body}
      </div>
    </figure>
  );
}
