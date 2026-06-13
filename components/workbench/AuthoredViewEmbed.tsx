import React from "react";
import { useTranslation } from "react-i18next";
import { Controls } from "@/components/Controls";
import { MetricsPanel } from "@/components/Charts";
import { resolveControllerTargetId } from "@/features/workbench/controllerBinding";
import { effectiveGlobalConfig } from "@/features/workbench/p1aStructuralHosts";
import { metricsViewConfig, type AuthoredViewSpec } from "@/features/workbench/authoredViews";
import type { ClinicalKnobs } from "@/engine/knobs";
import type { SimulationHealth } from "@/engine/protocol";
import type { PhysicsRefState, SimInstance, SimulationParams } from "@/types";

export type AuthoredViewRuntime = {
  instances: SimInstance[];
  physicsRefs: React.MutableRefObject<Map<string, PhysicsRefState>>;
  instanceHealth?: Record<string, SimulationHealth>;
  activeInstanceId?: string;
  updateInstanceParams?: (id: string, params: Partial<SimulationParams>) => void;
  updateInstanceKnobs?: (id: string, knobs: ClinicalKnobs) => void;
  updateInstanceVolume?: (id: string, vol: number) => void;
  presentationMode?: "studio" | "reading";
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

  const activeInstanceId = runtime.activeInstanceId ?? runtime.instances[0]?.id ?? "";
  const controllerTargetId = view.kind === "controller"
    ? resolveControllerTargetId(view.binding, activeInstanceId, runtime.instances)
    : activeInstanceId;
  const body = view.kind === "controller" ? (
    runtime.updateInstanceParams && runtime.updateInstanceKnobs && runtime.updateInstanceVolume ? (
      <Controls
        isPaneMode
        paneConfig={controllerTargetId ? { [controllerTargetId]: { visible: true, selectedSignals: ["clinical"] } } : {}}
        instances={runtime.instances.map((instance) => (instance.id === controllerTargetId ? { ...instance, isVisible: true } : instance))}
        instanceHealth={runtime.instanceHealth}
        activeInstanceId={controllerTargetId}
        updateInstanceParams={runtime.updateInstanceParams}
        updateInstanceKnobs={runtime.updateInstanceKnobs}
        updateInstanceVolume={runtime.updateInstanceVolume}
        presentationMode={runtime.presentationMode}
        controllerItems={view.items}
      />
    ) : null
  ) : (
    <MetricsPanel
      physicsRefs={runtime.physicsRefs}
      instances={runtime.instances}
      config={effectiveGlobalConfig(metricsViewConfig(view, runtime.instances), runtime.instances)}
    />
  );

  if (!body) return <AuthoredViewPlaceholder viewId={viewId} />;

  return (
    <figure className={`workbench-authored-view-embed my-4 block w-full max-w-full overflow-hidden rounded-md border border-wb-line bg-wb-input text-wb-text ${className}`} contentEditable={false}>
      <figcaption className="border-b border-wb-line px-3 py-1.5 text-[11px] font-medium text-wb-subtle">
        {view.title}
      </figcaption>
      <div className={view.kind === "controller" ? "relative h-[360px] max-h-[58vh] w-full max-w-full overflow-y-auto" : "relative min-h-[180px] w-full max-w-full"}>
        {body}
      </div>
    </figure>
  );
}
