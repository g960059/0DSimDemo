import React from "react";
import { Activity, Database, Radio, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  loadStudioDefaultClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import type {
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  StudioSimulationWorkerClientV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";

type WorkbenchStatusV2 =
  | { kind: "loading" }
  | {
      kind: "live";
      modelId: string;
      displayName: string;
      runtimeSessionId: string;
      frame: StudioSimulationFrameV2;
    }
  | { kind: "error"; message: string };

type GraphSampleV2 = Readonly<{
  acceptedTimeSec: number;
  lvPressureMmHg: number | null;
  aorticPressureMmHg: number | null;
  coronaryFlowMlPerSec: number | null;
  lvadFlowMlPerSec: number | null;
}>;

const SAMPLE_CAPACITY_V2 = 500;
const WORKER_STEPS_PER_RENDER_V2 = 3;
const WORKBENCH_SCENARIO_ID_V2 = "workbench-live-default";

export const WorkbenchV3Page = () => {
  const { t } = useTranslation();
  const [status, setStatus] = React.useState<WorkbenchStatusV2>({
    kind: "loading",
  });
  const [samples, setSamples] = React.useState<readonly GraphSampleV2[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    let nextTickTimer: ReturnType<typeof setTimeout> | undefined;
    let advancing = false;
    let client: StudioSimulationWorkerClientV2 | undefined;

    const start = async () => {
      const composition = await loadStudioDefaultClientCompositionV2();
      if (cancelled) return;
      const runtimeSessionId = `workbench-${randomPortableTokenV2()}`;
      client = new StudioSimulationWorkerClientV2();
      const initial = await client.initialize({
        runtimeSessionId,
        scenarioId: WORKBENCH_SCENARIO_ID_V2,
        fixture: composition.defaultFixture,
      });
      if (cancelled) {
        client.terminate();
        return;
      }
      appendFramesV2([initial], setSamples);
      setStatus({
        kind: "live",
        modelId: composition.defaultModelId,
        displayName: composition.contract.displayName,
        runtimeSessionId,
        frame: initial,
      });

      const tick = async () => {
        if (cancelled || client === undefined) return;
        if (!advancing) {
          advancing = true;
          try {
            const frames = await client.advance({
              runtimeSessionId,
              scenarioId: WORKBENCH_SCENARIO_ID_V2,
              stepCount: WORKER_STEPS_PER_RENDER_V2,
            });
            if (!cancelled) {
              appendFramesV2(frames, setSamples);
              const frame = frames.at(-1);
              if (frame !== undefined) {
                setStatus((current) => current.kind === "live"
                  ? { ...current, frame }
                  : current);
              }
            }
          } catch (error) {
            client.terminate();
            client = undefined;
            if (!cancelled) {
              setStatus({
                kind: "error",
                message: error instanceof Error
                  ? error.message
                  : String(error),
              });
            }
            return;
          } finally {
            advancing = false;
          }
        }
        if (!cancelled) nextTickTimer = setTimeout(tick, 16);
      };
      nextTickTimer = setTimeout(tick, 0);
    };

    void start().catch((error) => {
      if (cancelled) return;
      client?.terminate();
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    });

    return () => {
      cancelled = true;
      if (nextTickTimer !== undefined) clearTimeout(nextTickTimer);
      client?.terminate();
    };
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-wb-app px-4 py-5 text-wb-text sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <section className="rounded-2xl border border-wb-line bg-wb-panel p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-wb-accent/40 bg-wb-accent-soft px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-wb-accent">
                  <Radio className="h-3 w-3" />
                  {t("workbench.live.badge")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-wb-warning/40 bg-wb-warning-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-wb-warning">
                  <ShieldAlert className="h-3 w-3" />
                  {t("workbench.live.experimental")}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                {t("workbench.live.title")}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-wb-muted">
                {t("workbench.live.description")}
              </p>
            </div>
            <RuntimeStatus status={status} />
          </div>
        </section>

        {status.kind === "error" ? (
          <section
            className="rounded-2xl border border-wb-danger/50 bg-wb-danger-soft p-5 text-sm text-wb-danger"
            role="alert"
          >
            <p className="font-bold">{t("workbench.live.errorTitle")}</p>
            <p className="mt-2 font-mono text-xs">{status.message}</p>
          </section>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="grid gap-4">
              <SignalChart
                title={t("workbench.live.pressureChart")}
                unit="mmHg"
                samples={samples}
                signals={[
                  {
                    key: "lvPressureMmHg",
                    label: "LV",
                    color: "#ff6685",
                  },
                  {
                    key: "aorticPressureMmHg",
                    label: "Ao",
                    color: "#3ea8ff",
                  },
                ]}
              />
              <SignalChart
                title={t("workbench.live.flowChart")}
                unit="mL/s"
                samples={samples}
                signals={[
                  {
                    key: "coronaryFlowMlPerSec",
                    label: t("workbench.live.coronaryFlow"),
                    color: "#72d7b2",
                  },
                  {
                    key: "lvadFlowMlPerSec",
                    label: "LVAD",
                    color: "#ffc56d",
                  },
                ]}
              />
            </div>
            <aside className="grid content-start gap-4">
              <ReadoutPanel status={status} samples={samples} />
              <section className="rounded-2xl border border-wb-line bg-wb-panel p-5">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Database className="h-4 w-4 text-wb-accent" />
                  {t("workbench.live.contentBoundary")}
                </div>
                <p className="mt-3 text-sm leading-6 text-wb-muted">
                  {t("workbench.live.zeroContent")}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <CountCell
                    label={t("workbench.live.workspaces")}
                    value={0}
                  />
                  <CountCell
                    label={t("workbench.live.snapshots")}
                    value={0}
                  />
                </dl>
              </section>
              <section className="rounded-2xl border border-wb-warning/40 bg-wb-warning-soft p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-wb-warning">
                  <ShieldAlert className="h-4 w-4" />
                  {t("workbench.live.snapshotGateTitle")}
                </p>
                <p className="mt-2 text-sm leading-6 text-wb-muted">
                  {t("workbench.live.snapshotGateDescription")}
                </p>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

const RuntimeStatus = ({ status }: { status: WorkbenchStatusV2 }) => {
  const { t } = useTranslation();
  if (status.kind === "loading") {
    return (
      <div
        className="min-w-64 rounded-xl border border-wb-line bg-wb-soft px-4 py-3 text-sm text-wb-muted"
        role="status"
      >
        {t("workbench.live.loading")}
      </div>
    );
  }
  if (status.kind === "error") return null;
  return (
    <dl
      className="grid min-w-72 grid-cols-2 gap-x-5 gap-y-2 rounded-xl border border-wb-line bg-wb-soft px-4 py-3 text-xs"
      data-testid="v3-runtime-status"
    >
      <dt className="text-wb-subtle">{t("workbench.live.model")}</dt>
      <dd className="truncate text-right font-bold">{status.displayName}</dd>
      <dt className="text-wb-subtle">{t("workbench.live.modelTime")}</dt>
      <dd className="text-right font-mono">
        {status.frame.acceptedTimeSec.toFixed(3)} s
      </dd>
      <dt className="text-wb-subtle">{t("workbench.live.revision")}</dt>
      <dd className="text-right font-mono">
        {status.frame.acceptedRevision}
      </dd>
      <dt className="text-wb-subtle">{t("workbench.live.inputEpoch")}</dt>
      <dd className="text-right font-mono">{status.frame.inputEpoch}</dd>
    </dl>
  );
};

type SignalKeyV2 = Exclude<keyof GraphSampleV2, "acceptedTimeSec">;
type SignalSpecV2 = Readonly<{
  key: SignalKeyV2;
  label: string;
  color: string;
}>;

const SignalChart = ({
  title,
  unit,
  samples,
  signals,
}: {
  title: string;
  unit: string;
  samples: readonly GraphSampleV2[];
  signals: readonly SignalSpecV2[];
}) => {
  const finiteValues = samples.flatMap((sample) =>
    signals.map((signal) => sample[signal.key])
      .filter((value): value is number => value !== null && Number.isFinite(value))
  );
  const minimum = finiteValues.length === 0 ? 0 : Math.min(...finiteValues);
  const maximum = finiteValues.length === 0 ? 1 : Math.max(...finiteValues);
  const span = Math.max(maximum - minimum, Math.max(Math.abs(maximum), 1) * 0.08);
  const lower = minimum - span * 0.08;
  const upper = maximum + span * 0.08;

  return (
    <section className="rounded-2xl border border-wb-line bg-wb-panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-wb-subtle">
            {unit}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          {signals.map((signal) => (
            <span
              key={signal.key}
              className="flex items-center gap-1.5 text-xs text-wb-muted"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: signal.color }}
              />
              {signal.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 h-52 overflow-hidden rounded-xl border border-wb-line bg-wb-soft">
        <svg
          viewBox="0 0 800 220"
          className="h-full w-full"
          role="img"
          aria-label={`${title} live chart`}
          preserveAspectRatio="none"
        >
          {[0.25, 0.5, 0.75].map((fraction) => (
            <line
              key={fraction}
              x1="0"
              x2="800"
              y1={220 * fraction}
              y2={220 * fraction}
              stroke="var(--wb-border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {signals.map((signal) => (
            <path
              key={signal.key}
              d={pathForSignalV2(
                samples,
                signal.key,
                lower,
                upper,
              )}
              fill="none"
              stroke={signal.color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-wb-subtle">
        <span>{lower.toFixed(1)}</span>
        <span>{upper.toFixed(1)}</span>
      </div>
    </section>
  );
};

const ReadoutPanel = ({
  status,
  samples,
}: {
  status: WorkbenchStatusV2;
  samples: readonly GraphSampleV2[];
}) => {
  const { t } = useTranslation();
  const current = samples.at(-1);
  const values = [
    ["LV", current?.lvPressureMmHg, "mmHg"],
    ["Ao", current?.aorticPressureMmHg, "mmHg"],
    [t("workbench.live.coronaryFlow"), current?.coronaryFlowMlPerSec, "mL/s"],
    ["LVAD", current?.lvadFlowMlPerSec, "mL/s"],
  ] as const;
  return (
    <section className="rounded-2xl border border-wb-line bg-wb-panel p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <Activity className="h-4 w-4 text-wb-accent" />
        {t("workbench.live.acceptedReadback")}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {values.map(([label, value, unit]) => (
          <div key={label} className="rounded-xl border border-wb-line bg-wb-soft p-3">
            <p className="truncate text-[11px] text-wb-subtle">{label}</p>
            <p className="mt-1 font-mono text-lg font-bold">
              {typeof value === "number" ? value.toFixed(2) : "—"}
            </p>
            <p className="font-mono text-[9px] text-wb-subtle">{unit}</p>
          </div>
        ))}
      </div>
      {status.kind === "loading" && (
        <p className="mt-3 text-xs text-wb-muted">
          {t("workbench.live.firstAcceptedStep")}
        </p>
      )}
    </section>
  );
};

const CountCell = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-wb-line bg-wb-soft p-3 text-center">
    <dt className="text-[10px] uppercase tracking-wider text-wb-subtle">
      {label}
    </dt>
    <dd className="mt-1 font-mono text-xl font-bold">{value}</dd>
  </div>
);

function appendFramesV2(
  frames: readonly StudioSimulationFrameV2[],
  setSamples: React.Dispatch<React.SetStateAction<readonly GraphSampleV2[]>>,
): void {
  const projected = frames.map(projectFrameV2);
  setSamples((current) =>
    [...current, ...projected].slice(-SAMPLE_CAPACITY_V2));
}

function projectFrameV2(frame: StudioSimulationFrameV2): GraphSampleV2 {
  return Object.freeze({
    acceptedTimeSec: frame.acceptedTimeSec,
    lvPressureMmHg: scalarOutputV2(
      frame,
      "hemodynamics.pressure.absolute.LV",
    ),
    aorticPressureMmHg: scalarOutputV2(
      frame,
      "hemodynamics.pressure.absolute.Ao",
    ),
    coronaryFlowMlPerSec: scalarOutputV2(frame, "coronary.flow.total"),
    lvadFlowMlPerSec: scalarOutputV2(frame, "device.LVAD.flow"),
  });
}

function scalarOutputV2(
  frame: StudioSimulationFrameV2,
  outputId: string,
): number | null {
  const value = frame.outputs[outputId]?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pathForSignalV2(
  samples: readonly GraphSampleV2[],
  key: SignalKeyV2,
  lower: number,
  upper: number,
): string {
  if (samples.length < 2 || !(upper > lower)) return "";
  let segmentStarted = false;
  const commands: string[] = [];
  samples.forEach((sample, index) => {
    const value = sample[key];
    if (value === null) {
      segmentStarted = false;
      return;
    }
    const x = samples.length === 1
      ? 0
      : (index / (samples.length - 1)) * 800;
    const y = 220 - ((value - lower) / (upper - lower)) * 220;
    commands.push(
      `${segmentStarted ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`,
    );
    segmentStarted = true;
  });
  return commands.join(" ");
}

function randomPortableTokenV2(): string {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
