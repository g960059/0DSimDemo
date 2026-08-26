import React from "react";

import type { ExperimentSnapshotV2 } from
  "@/studio/contracts/v2/content";
import type {
  StudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import type {
  StudioSimulationAnalysisExecutionPlanResolverV2,
} from "@/studio/contracts/v2/simulation";
import type {
  MainWirePeriodicPvaDerivationV1,
} from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import type { ExactModelFixtureProjectionV1 } from
  "@/studio/application/model/ExactModelFixtureProjectionV1";
import {
  WorkbenchScenarioPresentationSampleStoreV3,
} from "@/components/workbench/v3/WorkbenchPresentationSampleStoreV3";
import {
  ArticleReaderLiveRuntimeV3,
  type ArticleReaderLiveRuntimeStateV3,
  type ArticleReaderStructuralAnalysisRequestV3,
  validatedArticleReaderVisibleScenarioIdsV3,
} from "./ArticleReaderLiveRuntimeV3";

export type UseArticleReaderLiveRuntimeResultV3 = Readonly<{
  state: ArticleReaderLiveRuntimeStateV3;
  sampleStore: WorkbenchScenarioPresentationSampleStoreV3;
  fixtureProjection: ExactModelFixtureProjectionV1;
  periodicPvaDerivation: MainWirePeriodicPvaDerivationV1 | null;
  play(): void;
  pause(): Promise<void>;
  setPlaybackRate(rate: number): void;
  selectScenario(scenarioId: string): void;
  requestAnalysis(input: Readonly<{
    analysisId: string;
    scenarioIds: readonly string[];
  }>): Promise<void>;
  applyControl(input: Readonly<{
    controlInstanceId: string;
    controlId: string;
    scenarioIds: readonly string[];
    value: number;
  }>): Promise<void>;
}>;

/**
 * React ownership boundary for the one Article Placement allowed to be live.
 * A fresh controller is created inside every effect lifetime, including the
 * development StrictMode setup/cleanup replay.
 */
export function useArticleReaderLiveRuntimeV3(
  snapshot: ExperimentSnapshotV2,
  exactModel: Readonly<{
    releaseTicket: StudioModelWorkerReleaseTicketV2;
    fixtureProjection: ExactModelFixtureProjectionV1;
    periodicPvaDerivation: MainWirePeriodicPvaDerivationV1 | null;
    resolveAnalysisExecutionPlan?:
      StudioSimulationAnalysisExecutionPlanResolverV2;
  }>,
  initialActiveScenarioId?: string,
  visibleScenarioIds?: readonly string[],
  structuralAnalyses: readonly ArticleReaderStructuralAnalysisRequestV3[] = [],
  presentationOutputIds?: ReadonlySet<string>,
): UseArticleReaderLiveRuntimeResultV3 {
  const requestedScopeKey = JSON.stringify(visibleScenarioIds ?? null);
  const validatedVisibleScenarioIds = React.useMemo(
    () => validatedArticleReaderVisibleScenarioIdsV3(
      snapshot,
      visibleScenarioIds,
    ),
    [requestedScopeKey, snapshot],
  );
  const visibleScopeKey = JSON.stringify(validatedVisibleScenarioIds);
  const structuralAnalysisKey = JSON.stringify(structuralAnalyses);
  const presentationOutputKey = JSON.stringify(
    presentationOutputIds === undefined
      ? null
      : [...presentationOutputIds].sort(),
  );
  const sampleStore = React.useMemo(
    () => new WorkbenchScenarioPresentationSampleStoreV3(),
    [presentationOutputKey, snapshot.snapshotId, visibleScopeKey],
  );
  const controllerRef = React.useRef<ArticleReaderLiveRuntimeV3 | null>(null);
  const [state, setState] = React.useState<ArticleReaderLiveRuntimeStateV3>(() =>
    initialStateV3(
      snapshot,
      initialActiveScenarioId,
      validatedVisibleScenarioIds,
    ));

  React.useEffect(() => {
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      ...(initialActiveScenarioId === undefined
        ? {}
        : { initialActiveScenarioId }),
      visibleScenarioIds: validatedVisibleScenarioIds,
      structuralAnalyses,
      ...(presentationOutputIds === undefined
        ? {}
        : { presentationOutputIds }),
      sampleStore,
      releaseTicket: exactModel.releaseTicket,
      ...(exactModel?.resolveAnalysisExecutionPlan === undefined
        ? {}
        : {
            resolveAnalysisExecutionPlan:
              exactModel.resolveAnalysisExecutionPlan,
          }),
    });
    controllerRef.current = controller;
    setState(controller.getSnapshot());
    const unsubscribe = controller.subscribe(() => {
      if (controllerRef.current === controller) {
        setState(controller.getSnapshot());
      }
    });
    const onVisibilityChange = () => {
      void controller.setDocumentVisible(!document.hidden);
    };
    if (typeof document !== "undefined") {
      void controller.setDocumentVisible(!document.hidden);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
    void controller.start();
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      unsubscribe();
      if (controllerRef.current === controller) controllerRef.current = null;
      void controller.dispose();
    };
  }, [
    initialActiveScenarioId,
    sampleStore,
    snapshot,
    structuralAnalysisKey,
    presentationOutputKey,
    visibleScopeKey,
    exactModel?.releaseTicket,
    exactModel?.resolveAnalysisExecutionPlan,
  ]);

  const play = React.useCallback(() => controllerRef.current?.play(), []);
  const pause = React.useCallback(async () => {
    await controllerRef.current?.pause();
  }, []);
  const setPlaybackRate = React.useCallback((rate: number) => {
    controllerRef.current?.setPlaybackRate(rate);
  }, []);
  const selectScenario = React.useCallback((scenarioId: string) => {
    controllerRef.current?.selectScenario(scenarioId);
  }, []);
  const requestAnalysis = React.useCallback(async (input: Readonly<{
    analysisId: string;
    scenarioIds: readonly string[];
  }>) => {
    const controller = controllerRef.current;
    if (controller === null) {
      throw new Error("Article Reader live runtime is unavailable");
    }
    await controller.requestAnalysis(input);
  }, []);
  const applyControl = React.useCallback(async (input: Readonly<{
    controlInstanceId: string;
    controlId: string;
    scenarioIds: readonly string[];
    value: number;
  }>) => {
    const controller = controllerRef.current;
    if (controller === null) {
      throw new Error("Article Reader live runtime is unavailable");
    }
    await controller.applyControl(input);
  }, []);

  return React.useMemo(() => Object.freeze({
    state,
    sampleStore,
    fixtureProjection: exactModel.fixtureProjection,
    periodicPvaDerivation: exactModel.periodicPvaDerivation,
    applyControl,
    play,
    pause,
    setPlaybackRate,
    requestAnalysis,
    selectScenario,
  }), [
    applyControl,
    exactModel.fixtureProjection,
    exactModel.periodicPvaDerivation,
    pause,
    play,
    requestAnalysis,
    sampleStore,
    selectScenario,
    setPlaybackRate,
    state,
  ]);
}

function initialStateV3(
  snapshot: ExperimentSnapshotV2,
  requestedScenarioId: string | undefined,
  visibleScenarioIds: readonly string[],
): ArticleReaderLiveRuntimeStateV3 {
  const activeScenarioId = requestedScenarioId ?? visibleScenarioIds[0] ?? "";
  if (!visibleScenarioIds.includes(activeScenarioId)) {
    throw new Error(
      "Article Reader active Scenario is not in the visible Scenario scope",
    );
  }
  return Object.freeze({
    status: "idle",
    snapshotId: snapshot.snapshotId,
    scenarioIds: visibleScenarioIds,
    activeScenarioId,
    pendingControlInstanceId: null,
    pendingAnalysisKeys: Object.freeze([]),
    committedControlValues: Object.freeze(Object.create(null)) as Readonly<
      Record<string, Readonly<Record<string, number>>>
    >,
    analysisByKey: Object.freeze(Object.create(null)) as Readonly<
      Record<string, never>
    >,
    analysisHistoryByKey: Object.freeze(Object.create(null)) as Readonly<
      Record<string, readonly never[]>
    >,
    analysisErrorByKey: Object.freeze(Object.create(null)) as Readonly<
      Record<string, string>
    >,
    controlErrorByInstanceId: Object.freeze(Object.create(null)) as Readonly<
      Record<string, string>
    >,
    error: null,
    playbackRate: Object.freeze({
      playbackRate: 0.5,
      maximumRate: null,
      calibrating: true,
      userSelected: false,
      performanceLimited: false,
    }),
  });
}
