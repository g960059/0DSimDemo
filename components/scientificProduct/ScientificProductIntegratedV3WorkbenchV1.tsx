import React from "react";
import { Link, useLocation } from "react-router-dom";

import { allCasesHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import {
  INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1,
  INTEGRATED_V3_LANE_KIND_V1,
  type StudioLaneCapabilitiesV1,
  type StudioLaneDescriptorV1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import {
  createMainWireStudioLiveLaneDriverV1,
} from "@/studio/adapters/mainWire/MainWireStudioLiveLaneFactoryV1";
import type {
  StudioIntegratedV3LiveLaneDriverV1,
  StudioIntegratedV3PresentationSampleV1,
} from "@/studio/adapters/mainWire/StudioLiveLaneV1";
import type {
  RuntimeLivePacingStateV1,
  RuntimePresentationSignalSubscriptionV1,
} from "@/studio/contracts/v1";

import {
  CatalogNeutralWaveformCanvasV1,
  type CatalogNeutralWaveformPointV1,
} from "./CatalogNeutralWaveformCanvasV1";
import type {
  ScientificProductIntegratedV3CaseV1,
} from "./ScientificProductIntegratedV3CaseV1";

const V3_HISTORY_WINDOW_SEC = 5;
const V3_HISTORY_MAXIMUM_SAMPLE_COUNT = 3_000;
const V3_PRESENTATION_REFRESH_MS = 40;

const CAPABILITY_LABELS_V1 = {
  liveWorkerExecution: "Browser-Worker execution",
  decimatedLivePresentation: "Live chart presentation",
  livePacingReporting: "Measured pacing",
  suspendResumePresentation: "Suspend or resume presentation",
  operationalWorkerRotationCheckpoint: "Operational Worker rotation",
  interactiveResearchControls: "Research controls",
  strictPeriodicSettlement: "Strict periodic settlement",
  steadyCandidatePromotion: "Promote steady candidate",
  candidatePinning: "Pin candidate",
  persistedWarmSnapshot: "Save or restore snapshot",
  exactSignalExport: "Exact signal export",
  presentationBeatEstimates: "Per-beat estimates",
  hemodynamicSideAnalysis: "Guyton / Starling analysis",
  pvRelationsSideAnalysis: "PV-relation analysis",
  tbvContinuationSeedPrediction: "TBV continuation analysis",
  externalAfRhythm: "External AF rhythm",
  iabpSupport: "IABP support",
  releaseOrCandidateIdentity: "Release or candidate identity",
} as const satisfies Record<keyof StudioLaneCapabilitiesV1, string>;

const PRESSURE_SERIES_V1 = Object.freeze([
  {
    signalId: "hemodynamics.pressure.absolute.LV",
    label: "LV pressure",
    unit: "mmHg",
    color: "#38bdf8",
  },
  {
    signalId: "hemodynamics.pressure.absolute.Ao",
    label: "Ao pressure",
    unit: "mmHg",
    color: "#f59e0b",
  },
]);

const LV_VOLUME_SERIES_V1 = Object.freeze([
  {
    signalId: "hemodynamics.volume.LV",
    label: "LV volume",
    unit: "mL",
    color: "#a78bfa",
  },
]);

const CORONARY_FLOW_SERIES_V1 = Object.freeze([
  {
    signalId: "coronary.flow.total",
    label: "Total coronary inlet",
    unit: "mL/s",
    color: "#f8fafc",
  },
  {
    signalId: "coronary.flow.inlet.LAD",
    label: "LAD inlet",
    unit: "mL/s",
    color: "#fb7185",
  },
  {
    signalId: "coronary.flow.inlet.LCx",
    label: "LCx inlet",
    unit: "mL/s",
    color: "#34d399",
  },
  {
    signalId: "coronary.flow.inlet.RCA",
    label: "RCA inlet",
    unit: "mL/s",
    color: "#60a5fa",
  },
]);

const LVAD_FLOW_SERIES_V1 = Object.freeze([
  {
    signalId: "device.LVAD.flow",
    label: "Accepted LVAD flow",
    unit: "mL/s",
    color: "#22d3ee",
  },
]);

type V3WorkbenchViewStateV1 =
  | Readonly<{ phase: "opening" }>
  | Readonly<{ phase: "failed"; message: string }>
  | Readonly<{
      phase: "ready";
      descriptor: StudioLaneDescriptorV1;
      history: readonly StudioIntegratedV3PresentationSampleV1[];
      sample: StudioIntegratedV3PresentationSampleV1;
      pacing: RuntimeLivePacingStateV1;
    }>;

export type ScientificProductIntegratedV3DriverFactoryV1 =
  () => StudioIntegratedV3LiveLaneDriverV1;

export function ScientificProductIntegratedV3WorkbenchV1({
  caseEntry,
  driverFactory = defaultDriverFactoryV1,
}: Readonly<{
  caseEntry: ScientificProductIntegratedV3CaseV1;
  driverFactory?: ScientificProductIntegratedV3DriverFactoryV1;
}>) {
  const [driver] = React.useState(driverFactory);
  const [state, setState] = React.useState<V3WorkbenchViewStateV1>({
    phase: "opening",
  });

  React.useEffect(() => {
    let active = true;
    let openedSessionId: string | null = null;
    let subscription: RuntimePresentationSignalSubscriptionV1 | null = null;
    let visibilityListener: (() => void) | null = null;
    let refreshTimer:
      ReturnType<typeof globalThis.setTimeout> | null = null;
    let history: StudioIntegratedV3PresentationSampleV1[] = [];
    let sample: StudioIntegratedV3PresentationSampleV1 | null = null;
    let pacing: RuntimeLivePacingStateV1 | null = null;
    const sessionId = nextIntegratedV3ProductSessionIdV1();
    const scenarioId = `${sessionId}:fixed-preset`;

    const publish = () => {
      refreshTimer = null;
      if (!active || sample === null || pacing === null) return;
      setState({
        phase: "ready",
        descriptor: driver.laneDescriptor,
        history: [...history],
        sample,
        pacing,
      });
    };
    const queuePublish = () => {
      if (refreshTimer !== null) return;
      refreshTimer = globalThis.setTimeout(
        publish,
        V3_PRESENTATION_REFRESH_MS,
      );
    };
    const receive = (
      event: Parameters<
        StudioIntegratedV3LiveLaneDriverV1[
          "subscribePresentationSignalChannel"
        ]
      >[1] extends (event: infer TEvent) => void ? TEvent : never,
    ) => {
      if (!active) return;
      if (event.kind === "failure") {
        setState({ phase: "failed", message: event.message });
        return;
      }
      history = trimHistoryV1([...history, ...event.samples]);
      sample = history.at(-1) ?? sample;
      pacing = event.livePacing;
      queuePublish();
    };

    void driver.openSession({
      laneKind: INTEGRATED_V3_LANE_KIND_V1,
      sessionId,
      branches: [{ scenarioId }],
    }).then((opened) => {
      openedSessionId = opened.sessionId;
      if (!active) {
        void driver.closeSession(opened.sessionId);
        return;
      }
      const branch = opened.branches[0];
      if (branch === undefined) {
        setState({
          phase: "failed",
          message: "The experimental lane opened without a presentation branch.",
        });
        return;
      }
      sample = branch.initialPresentation.sample;
      pacing = branch.initialPresentation.livePacing;
      history = [sample];
      publish();

      const synchronizeVisibility = () => {
        if (!active) return;
        if (document.hidden) {
          subscription?.unsubscribe();
          subscription = null;
          return;
        }
        subscription ??= driver.subscribePresentationSignalChannel(
          branch.presentationSignalChannelRef,
          receive,
        );
      };
      visibilityListener = synchronizeVisibility;
      document.addEventListener("visibilitychange", synchronizeVisibility);
      synchronizeVisibility();
    }).catch((error: unknown) => {
      if (!active) return;
      setState({
        phase: "failed",
        message: error instanceof Error ? error.message : String(error),
      });
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
      if (visibilityListener !== null) {
        document.removeEventListener("visibilitychange", visibilityListener);
      }
      if (refreshTimer !== null) globalThis.clearTimeout(refreshTimer);
      if (openedSessionId !== null) {
        void driver.closeSession(openedSessionId);
      }
    };
  }, [driver]);

  if (state.phase === "opening") {
    return (
      <main
        className="flex h-full items-center justify-center bg-wb-app p-4 text-wb-text"
        data-testid="integrated-v3-product-opening-v1"
      >
        Opening the fixed experimental browser lane…
      </main>
    );
  }
  if (state.phase === "failed") {
    return (
      <main className="flex h-full items-center justify-center bg-wb-app p-4 text-wb-text">
        <p
          className="max-w-xl rounded-lg border border-wb-danger bg-wb-panel p-5"
          role="alert"
          data-testid="integrated-v3-product-failed-v1"
        >
          {state.message}
        </p>
      </main>
    );
  }
  return (
    <ScientificProductIntegratedV3LaneSurfaceV1
      caseEntry={caseEntry}
      descriptor={state.descriptor}
      history={state.history}
      sample={state.sample}
      pacing={state.pacing}
    />
  );
}

export function ScientificProductIntegratedV3LaneSurfaceV1({
  caseEntry,
  descriptor,
  history,
  sample,
  pacing,
}: Readonly<{
  caseEntry: ScientificProductIntegratedV3CaseV1;
  descriptor: StudioLaneDescriptorV1;
  history: readonly StudioIntegratedV3PresentationSampleV1[];
  sample: StudioIntegratedV3PresentationSampleV1;
  pacing: RuntimeLivePacingStateV1;
}>) {
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const chartPoints = React.useMemo(
    () => history.map(integratedV3ChartPointV1),
    [history],
  );
  const pacingLabel = pacing.mode === "degraded" ? "degraded" : "measured";
  const achievedRate = pacing.recentAchievedRate === null
    ? "Measuring achieved rate…"
    : `${pacing.recentAchievedRate.toFixed(2)}× measured`;

  return (
    <main
      className="h-full overflow-y-auto bg-wb-app text-wb-text"
      data-testid="integrated-v3-product-surface-v1"
      data-presentation-coverage={sample.coverage}
      data-pacing-state={pacingLabel}
      data-achieved-rate={pacing.recentAchievedRate ?? ""}
      data-accepted-revision={sample.acceptedRevision}
      data-model-time-sec={sample.acceptedTimeSec}
    >
      <header className="border-b border-wb-line bg-wb-panel px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-wb-accent">
              Live browser lane
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              {caseEntry.displayName}
            </h1>
            <p className="mt-2 text-sm text-wb-muted">
              Fixed input · Regular sinus · HMII 9000
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="rounded border border-wb-warning/40 bg-wb-warning-soft px-2 py-1 text-xs font-bold text-wb-warning">
              {descriptor.badge}
            </span>
            <Link
              to={allCasesHref(locale)}
              className="text-sm font-semibold text-wb-accent hover:underline"
            >
              Back to case catalog
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8">
        <section
          className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
          aria-label="Lane status"
        >
          <StatusCellV1 label="Model time" value={`${sample.acceptedTimeSec.toFixed(3)} s`} />
          <StatusCellV1 label="Accepted revision" value={String(sample.acceptedRevision)} />
          <StatusCellV1 label="Internal substeps" value={String(sample.internalAcceptedSubstepCount)} />
          <StatusCellV1 label="Rhythm" value="Regular sinus" />
          <StatusCellV1 label="Mechanical support" value="HMII 9000" />
          <StatusCellV1
            label="Live pacing"
            value={`${pacingLabel} · ${achievedRate}`}
          />
        </section>

        <section
          className="grid gap-5 lg:grid-cols-2"
          aria-label="Integrated lane signals"
        >
          <CatalogNeutralWaveformCanvasV1
            title="LV and aortic pressure"
            points={chartPoints}
            series={PRESSURE_SERIES_V1}
          />
          <CatalogNeutralWaveformCanvasV1
            title="LV volume"
            points={chartPoints}
            series={LV_VOLUME_SERIES_V1}
          />
          <CatalogNeutralWaveformCanvasV1
            title="Coronary inlet flow"
            points={chartPoints}
            series={CORONARY_FLOW_SERIES_V1}
          />
          <CatalogNeutralWaveformCanvasV1
            title="LVAD flow"
            points={chartPoints}
            series={LVAD_FLOW_SERIES_V1}
          />
        </section>

        <section className="rounded-xl border border-wb-line bg-wb-panel p-5">
          <h2 className="text-base font-bold">Limitations</h2>
          <ol
            className="mt-3 grid gap-2 text-sm leading-6 text-wb-muted"
            data-testid="integrated-v3-limitations-v1"
          >
            {descriptor.limitations.map((limitation, index) => (
              <li key={index} data-limitation-index={index}>
                {limitation}
              </li>
            ))}
          </ol>
        </section>

        <section
          className="rounded-xl border border-wb-line bg-wb-panel p-5"
          aria-label="Unavailable actions"
        >
          <h2 className="text-base font-bold">Unavailable actions</h2>
          <p className="mt-1 text-sm text-wb-muted">
            These actions are disabled before invocation for this fixed lane.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1.flatMap((key) => {
              const capability = descriptor.capabilities[key];
              if (capability.available !== false) return [];
              const explanationId = `capability-${key}-explanation`;
              return [
                <div
                  key={key}
                  className="rounded-lg border border-wb-line bg-wb-soft p-3"
                  data-capability-key={key}
                  data-capability-available="false"
                >
                  <button
                    type="button"
                    disabled
                    aria-describedby={explanationId}
                    className="w-full cursor-not-allowed rounded border border-wb-line px-3 py-2 text-left text-sm font-semibold text-wb-subtle opacity-70"
                    data-capability-action={key}
                  >
                    {CAPABILITY_LABELS_V1[key]}
                  </button>
                  <p
                    id={explanationId}
                    className="mt-2 text-xs leading-5 text-wb-muted"
                    data-capability-explanation={key}
                  >
                    {capability.explanation}
                  </p>
                </div>,
              ];
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

export function integratedV3ChartPointV1(
  sample: StudioIntegratedV3PresentationSampleV1,
): CatalogNeutralWaveformPointV1 {
  return Object.freeze({
    timeSec: sample.presentationTimeSec,
    values: Object.freeze(Object.fromEntries(
      Object.entries(sample.observableFrame.values).map(
        ([observableId, value]) => [observableId, value.value],
      ),
    )),
  });
}

function StatusCellV1({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <dl className="rounded-xl border border-wb-line bg-wb-panel p-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-wb-subtle">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-sm text-wb-text">{value}</dd>
    </dl>
  );
}

function trimHistoryV1(
  samples: readonly StudioIntegratedV3PresentationSampleV1[],
): StudioIntegratedV3PresentationSampleV1[] {
  const lastTimeSec = samples.at(-1)?.presentationTimeSec ?? 0;
  const timeFloor = lastTimeSec - V3_HISTORY_WINDOW_SEC;
  return samples
    .filter(({ presentationTimeSec }) => presentationTimeSec >= timeFloor)
    .slice(-V3_HISTORY_MAXIMUM_SAMPLE_COUNT);
}

let integratedV3ProductSessionOrdinalV1 = 0;

function nextIntegratedV3ProductSessionIdV1(): string {
  integratedV3ProductSessionOrdinalV1 += 1;
  return `integrated-v3-product-${Date.now()}-${integratedV3ProductSessionOrdinalV1}`;
}

function defaultDriverFactoryV1(): StudioIntegratedV3LiveLaneDriverV1 {
  return createMainWireStudioLiveLaneDriverV1({
    laneKind: INTEGRATED_V3_LANE_KIND_V1,
  });
}
