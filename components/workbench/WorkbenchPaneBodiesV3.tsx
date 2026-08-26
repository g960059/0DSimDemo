import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  ExperimentNumericControlV3,
  ExperimentOutputGridV3,
  ExperimentPaneAddItemButtonV3,
} from "@/components/workbench/ExperimentPanePresentationV3";
import { WorkbenchPaneBindingButtonV3 } from "@/components/workbench/WorkbenchPaneBindingV3";
import {
  resolveWorkbenchControlPaneScenarioIdsV3,
} from "@/components/workbench/WorkbenchSurfaceV3";
import {
  materializeWorkbenchOutputPresentationItemsV3,
  resolveWorkbenchPaneItemLabelV3,
} from "@/components/workbench/WorkbenchItemPresentation";
import type { MainWirePeriodicPvaV1 } from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import type {
  ExperimentSurfaceControlPaneV2,
  ExperimentSurfaceOutputPaneV2,
} from "@/studio/contracts/v2/content";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import type { StudioSimulationFrameV2 } from "@/studio/contracts/v2/simulation";
import type { StudioSimulationWorkerScenarioDescriptorV2 } from "@/studio/workers/StudioSimulationWorkerProtocolV2";

export type WorkbenchStatusV3 =
  | Readonly<{ kind: "loading" }>
  | Readonly<{
      kind: "live";
      contract: ModelContractV2;
      frame: StudioSimulationFrameV2;
    }>
  | Readonly<{
      kind: "unavailable-model";
      savedModelId: string;
    }>
  | Readonly<{ kind: "error"; message: string }>;

export function RuntimeStatusV3({
  status,
}: Readonly<{ status: WorkbenchStatusV3 }>) {
  const { t } = useTranslation();
  if (status.kind === "loading") {
    return (
      <div className="text-xs text-wb-muted" role="status">
        {t("workbench.live.loading")}
      </div>
    );
  }
  return null;
}

export function OutputPaneBodyV3({
  contract,
  frame,
  locale,
  onAddItem,
  onOpenBindingSettings,
  pane,
  periodicPva,
  periodicPvaAnalysisError,
  scrollMode = "contained",
  showBinding,
  scenarioLabel,
}: Readonly<{
  contract: ModelContractV2;
  frame: StudioSimulationFrameV2 | null;
  locale: "en" | "ja";
  onAddItem: () => void;
  onOpenBindingSettings: () => void;
  pane: ExperimentSurfaceOutputPaneV2;
  periodicPva?: MainWirePeriodicPvaV1;
  periodicPvaAnalysisError?: string;
  scrollMode?: "contained" | "parent" | "section";
  showBinding: boolean;
  scenarioLabel: string;
}>) {
  const { t } = useTranslation();
  const bindingModeLabel =
    pane.binding.mode === "active-slot"
      ? t("workbench.live.paneBindingModeActive")
      : t("workbench.live.paneBindingModeFixed");
  const bindingLabel =
    pane.binding.mode === "active-slot"
      ? t("workbench.live.paneBindingActive", { scenario: scenarioLabel })
      : t("workbench.live.paneBindingFixed", { scenarios: scenarioLabel });
  const selected = materializeWorkbenchOutputPresentationItemsV3({
    contract,
    frame,
    locale,
    notAssessedNotice: t("workbench.live.outputNotAssessed"),
    pane,
    periodicPva,
    periodicPvaAnalysisError,
  });
  return (
    <div
      className={`workbench-output-pane flex min-h-0 flex-col bg-wb-aux ${
        scrollMode === "section" ? "" : "h-full"
      }`}
    >
      <WorkbenchPaneBindingButtonV3
        label={bindingLabel}
        modeLabel={bindingModeLabel}
        onClick={onOpenBindingSettings}
        targetLabel={scenarioLabel}
        testId={`output-pane-binding-${pane.paneId}`}
        visible={showBinding}
      />
      <ExperimentOutputGridV3
        addItemAction={{
          label: t("workbench.editor.addCatalogItem"),
          onClick: onAddItem,
          prominent: selected.length === 0,
        }}
        variant="pane"
        scrollMode={scrollMode === "contained" ? "contained" : "parent"}
        emptyMessage={t("workbench.live.noSelectedOutputs")}
        items={selected}
      />
    </div>
  );
}

export function ControlPaneBodyV3({
  activeScenarioId,
  contract,
  controlError,
  controlValuesByScenario,
  disabledByAnalysis,
  locale,
  onAddItem,
  onApplyControl,
  onOpenBindingSettings,
  pane,
  pendingControlId,
  scenarios,
  scrollMode = "contained",
}: Readonly<{
  activeScenarioId: string | null;
  contract: ModelContractV2;
  controlError: string | null;
  controlValuesByScenario: Readonly<
    Record<string, Readonly<Record<string, number>>>
  >;
  disabledByAnalysis: boolean;
  locale: "en" | "ja";
  onAddItem: () => void;
  onApplyControl: (
    scenarioIds: readonly string[],
    controlId: string,
    value: number,
  ) => Promise<boolean>;
  onOpenBindingSettings: () => void;
  pane: ExperimentSurfaceControlPaneV2;
  pendingControlId: string | null;
  scenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[];
  scrollMode?: "contained" | "parent" | "section";
}>) {
  const { t } = useTranslation();
  const targetScenarioIds = resolveWorkbenchControlPaneScenarioIdsV3(
    pane,
    activeScenarioId,
    scenarios,
  );
  const targetLabels = targetScenarioIds.map(
    (scenarioId) =>
      scenarios.find((scenario) => scenario.scenarioId === scenarioId)?.label ??
      scenarioId,
  );
  const bindingLabel =
    pane.binding.mode === "active-slot"
      ? t("workbench.live.paneBindingActive", {
          scenario: targetLabels[0] ?? "—",
        })
      : t("workbench.live.paneBindingFixed", {
          scenarios: targetLabels.join(" + "),
        });
  const bindingModeLabel =
    pane.binding.mode === "active-slot"
      ? t("workbench.live.paneBindingModeActive")
      : t("workbench.live.paneBindingModeFixed");
  const bindingTargetLabel = targetLabels.join(" + ") || "—";
  const selectedControls = [...pane.items]
    .sort((left, right) => left.order - right.order)
    .flatMap((item) => {
      const definition = contract.controlCatalog.find(
        (control) => control.controlId === item.controlId,
      );
      return definition === undefined ? [] : [{ definition, item }];
    });
  const presentedControls = selectedControls.map(({ definition, item }) => {
    const values = targetScenarioIds.map(
      (scenarioId) =>
        controlValuesByScenario[scenarioId]?.[definition.controlId] ??
        definition.defaultValue,
    );
    const value = values[0] ?? definition.defaultValue;
    const mixed = values.some((candidate) => candidate !== value);
    return { definition, item, value, mixed };
  });
  return (
    <section
      className={`workbench-control-pane flex min-w-0 flex-col bg-wb-aux ${
        scrollMode === "parent"
          ? "min-h-full"
          : scrollMode === "section"
            ? "min-h-0"
            : "h-full min-h-0"
      }`}
    >
      <WorkbenchPaneBindingButtonV3
        label={bindingLabel}
        modeLabel={bindingModeLabel}
        onClick={onOpenBindingSettings}
        targetLabel={bindingTargetLabel}
        testId={`control-pane-binding-${pane.paneId}`}
        visible={scenarios.length > 1}
      />
      <div
        className={`min-h-0 flex-1 px-2 pb-2 ${
          scrollMode === "contained" ? "overflow-y-auto" : "overflow-visible"
        }`}
      >
        {contract.controlCatalog.length === 0 ? (
          <p className="p-3 text-xs leading-5 text-wb-muted">
            {t("workbench.live.noRegisteredControls")}
          </p>
        ) : selectedControls.length === 0 ? (
          <p className="p-3 text-xs text-wb-subtle">
            {t("workbench.live.noSelectedControls")}
          </p>
        ) : (
          <div className="workbench-control-list">
            {presentedControls.map(
              ({ definition: control, item, value, mixed }) => {
                return (
                  <ExperimentNumericControlV3
                    key={control.controlId}
                    control={control}
                    disabled={
                      targetScenarioIds.length === 0 ||
                      pendingControlId !== null ||
                      disabledByAnalysis
                    }
                    label={resolveWorkbenchPaneItemLabelV3({
                      kind: "control",
                      itemId: control.controlId,
                      storedLabel: item.label,
                      locale,
                    })}
                    mixed={mixed}
                    pending={pendingControlId === control.controlId}
                    presentation={item.presentation}
                    value={value}
                    onCommit={(nextValue) =>
                      onApplyControl(
                        targetScenarioIds,
                        control.controlId,
                        nextValue,
                      )
                    }
                  />
                );
              },
            )}
          </div>
        )}
        {controlError !== null && (
          <p
            className="mt-3 rounded-lg bg-wb-danger-soft p-2 text-[10px] text-wb-danger"
            role="alert"
          >
            {controlError}
          </p>
        )}
        <ExperimentPaneAddItemButtonV3
          label={t("workbench.editor.addCatalogItem")}
          onClick={onAddItem}
          prominent={selectedControls.length === 0}
        />
      </div>
    </section>
  );
}

export function PaneLoadingV3() {
  const { t } = useTranslation();
  return (
    <div
      className="flex h-full items-center justify-center text-xs text-wb-muted"
      role="status"
    >
      <Activity className="mr-2 h-3.5 w-3.5 animate-pulse" />
      {t("workbench.live.loadingPane")}
    </div>
  );
}
