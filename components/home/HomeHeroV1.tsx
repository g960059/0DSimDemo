import React from "react";
import { Pause, Play } from "lucide-react";
import {
  HOME_DEMO_BASE_V1,
  HOME_DEMO_PRESETS_V1,
  simulateHomeDemoV1,
  type HomeDemoParametersV1,
  type HomeDemoPointV1,
} from "./HomeDemoModelV1";

const baseline = simulateHomeDemoV1(HOME_DEMO_BASE_V1);
const X = (v: number, max: number) => 30 + (v / max) * 278;
const Y = (v: number, max: number) => 193 - (v / max) * 177;
const niceMax = (v: number, base: number) =>
  Math.max(base, Math.ceil((v + 10) / 20) * 20);
function trace(
  points: readonly HomeDemoPointV1[],
  x: "V" | "t",
  y: "Plv" | "Pao",
  xmax: number,
  ymax: number,
) {
  return points
    .map(
      (p, i) =>
        `${i ? "L" : "M"}${X(p[x], xmax).toFixed(1)},${Y(p[y], ymax).toFixed(1)}`,
    )
    .join(" ");
}
const controls = [
  {
    key: "pv",
    min: 4,
    max: 18,
    step: 0.5,
    digits: 1,
    ja: "前負荷",
    en: "Preload",
    unit: "mmHg",
  },
  {
    key: "svr",
    min: 0.5,
    max: 2,
    step: 0.05,
    digits: 2,
    ja: "後負荷",
    en: "Afterload",
    unit: "mmHg·s/mL",
  },
  {
    key: "ees",
    min: 0.8,
    max: 4,
    step: 0.1,
    digits: 1,
    ja: "収縮性",
    en: "Contractility",
    unit: "mmHg/mL",
  },
] as const;
export function HomeHeroV1({
  locale,
  interactive = true,
}: {
  locale: "ja" | "en";
  interactive?: boolean;
}) {
  const ja = locale === "ja";
  const [params, setParams] =
    React.useState<HomeDemoParametersV1>(HOME_DEMO_BASE_V1);
  const [paused, setPaused] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const result = React.useMemo(
    () =>
      params === HOME_DEMO_BASE_V1 ? baseline : simulateHomeDemoV1(params),
    [params],
  );
  const { metrics: m } = result;
  const isBase = controls.every(
    (c) => params[c.key] === HOME_DEMO_BASE_V1[c.key],
  );
  const xmax = niceMax(Math.max(m.EDV, baseline.metrics.EDV) + 10, 160);
  const ymax = niceMax(Math.max(m.pmax, baseline.metrics.pmax) + 10, 140);
  const dot = React.useRef<SVGCircleElement>(null),
    cursor = React.useRef<SVGLineElement>(null),
    panel = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  React.useEffect(() => {
    if (!interactive || paused || reduced) return;
    let frame = 0,
      visible = false,
      previous = 0,
      elapsed = 0;
    const tick = (now: number) => {
      if (previous) elapsed += Math.min(now - previous, 80);
      previous = now;
      const phase = (elapsed / 1000) % (2 * m.T);
      const wave =
        result.rec[
          Math.min(
            result.rec.length - 1,
            Math.floor((phase / (2 * m.T)) * result.rec.length),
          )
        ];
      const pv =
        result.last[
          Math.min(
            result.last.length - 1,
            Math.floor(((phase % m.T) / m.T) * result.last.length),
          )
        ];
      dot.current?.setAttribute("cx", String(X(pv.V, xmax)));
      dot.current?.setAttribute("cy", String(Y(pv.Plv, ymax)));
      cursor.current?.setAttribute("x1", String(X(wave.t, 2 * m.T)));
      cursor.current?.setAttribute("x2", String(X(wave.t, 2 * m.T)));
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    if (panel.current) observer.observe(panel.current);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [interactive, paused, reduced, result, m.T, xmax, ymax]);
  const espvrEnd = Math.min(xmax, 10 + ymax / params.ees);
  return (
    <div
      className="home-mini-demo"
      ref={panel}
      aria-label={ja ? "循環動態の簡易デモ" : "Simplified hemodynamics demo"}
    >
      <div className="home-demo-heading">
        <strong>
          {ja ? "左室 PVループ／圧波形" : "LV PV loop / pressure waveforms"}
        </strong>
        <span>{ja ? "簡易モデル" : "Simplified model"}</span>
        <button
          className="home-demo-play"
          type="button"
          aria-label={
            paused || reduced
              ? ja
                ? "アニメーションを再生"
                : "Play animation"
              : ja
                ? "アニメーションを一時停止"
                : "Pause animation"
          }
          aria-pressed={!paused && !reduced}
          disabled={!interactive}
          onClick={() => {
            if (reduced) {
              setReduced(false);
              setPaused(false);
            } else setPaused((p) => !p);
          }}
        >
          {paused || reduced ? <Play /> : <Pause />}
        </button>
      </div>
      <div className="home-demo-plots">
        <figure>
          <figcaption className="home-plot-meta">
            <span>mmHg / mL</span>
          </figcaption>
          <svg
            viewBox="0 0 320 214"
            role="img"
            aria-label={
              ja ? "動く左室圧容積ループ" : "Animated LV pressure–volume loop"
            }
          >
            <Grid xmax={xmax} ymax={ymax} />
            <line
              className="home-espvr"
              x1={X(10, xmax)}
              y1={Y(0, ymax)}
              x2={X(espvrEnd, xmax)}
              y2={Y(params.ees * (espvrEnd - 10), ymax)}
            />
            <text
              className="home-espvr-label"
              x={X(espvrEnd, xmax) - 4}
              y={Y(params.ees * (espvrEnd - 10), ymax) + 13}
              textAnchor="end"
            >
              ESPVR
            </text>
            {!isBase && (
              <path
                className="home-plot-reference"
                d={trace(baseline.last, "V", "Plv", xmax, ymax)}
              />
            )}
            <path
              className="home-plot-line home-lvp"
              d={trace(result.last, "V", "Plv", xmax, ymax)}
            />
            <circle
              className="home-pv-dot"
              ref={dot}
              r="4"
              cx={X(result.last[0].V, xmax)}
              cy={Y(result.last[0].Plv, ymax)}
            />
          </svg>
        </figure>
        <figure>
          <figcaption className="home-plot-meta">
            <span>mmHg</span>
            <span className="home-plot-legend">
              <i className="home-lvp">LVP</i> <i className="home-aop">AoP</i>
            </span>
          </figcaption>
          <svg
            viewBox="0 0 320 214"
            role="img"
            aria-label={
              ja
                ? "2拍分の左室圧と大動脈圧"
                : "Two beats of LV and aortic pressure"
            }
          >
            <Grid xmax={2 * m.T} ymax={ymax} wave />
            {!isBase && (
              <path
                className="home-plot-reference"
                d={trace(baseline.rec, "t", "Pao", 2 * m.T, ymax)}
              />
            )}
            <path
              className="home-plot-line home-lvp"
              d={trace(result.rec, "t", "Plv", 2 * m.T, ymax)}
            />
            <path
              className="home-plot-line home-aop"
              d={trace(result.rec, "t", "Pao", 2 * m.T, ymax)}
            />
            <line
              className="home-wave-cursor"
              ref={cursor}
              x1={X(0, 2 * m.T)}
              x2={X(0, 2 * m.T)}
              y1="16"
              y2="193"
            />
          </svg>
        </figure>
      </div>
      <div className="home-demo-controls">
        {controls.map((c) => (
          <label key={c.key} className="home-demo-slider">
            <span className="home-slider-label">{c[locale]}</span>
            <input
              type="range"
              min={c.min}
              max={c.max}
              step={c.step}
              value={params[c.key]}
              aria-label={c[locale]}
              aria-valuetext={`${params[c.key].toFixed(c.digits)} ${c.unit}`}
              disabled={!interactive}
              onChange={(e) =>
                setParams((p) => ({ ...p, [c.key]: Number(e.target.value) }))
              }
              style={
                {
                  "--range-fill": `${((params[c.key] - c.min) / (c.max - c.min)) * 100}%`,
                } as React.CSSProperties
              }
            />
            <output>
              {params[c.key].toFixed(c.digits)} <small>{c.unit}</small>
            </output>
          </label>
        ))}
      </div>
      <div
        className="home-demo-presets"
        role="group"
        aria-label={ja ? "条件プリセット" : "Condition presets"}
      >
        {HOME_DEMO_PRESETS_V1.map((p) => (
          <button
            type="button"
            key={p.id}
            disabled={!interactive}
            aria-pressed={controls.every(
              (c) => params[c.key] === p.params[c.key],
            )}
            onClick={() => setParams(p.params)}
          >
            {p[locale]}
          </button>
        ))}
        {!isBase && <small>{ja ? "破線：基準" : "Dashed: baseline"}</small>}
      </div>
      <dl className="home-demo-readouts" aria-live="polite" aria-atomic="true">
        {[
          [ja ? "一回拍出量" : "Stroke volume", m.SV.toFixed(0), "mL"],
          [ja ? "駆出率" : "Ejection fraction", m.EF.toFixed(0), "%"],
          [ja ? "心拍出量" : "Cardiac output", m.CO.toFixed(1), "L/min"],
          [
            ja ? "大動脈圧" : "Aortic pressure",
            `${m.sys.toFixed(0)}/${m.dia.toFixed(0)}`,
            "mmHg",
          ],
        ].map(([label, value, unit]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {value}
              <small>{unit}</small>
            </dd>
          </div>
        ))}
      </dl>
      <p className="home-demo-note">
        {ja
          ? "時変エラスタンス＋Windkessel · 75拍/分"
          : "Elastance + Windkessel · 75 bpm"}
      </p>
    </div>
  );
}
function Grid({
  xmax,
  ymax,
  wave = false,
}: {
  xmax: number;
  ymax: number;
  wave?: boolean;
}) {
  const xticks = wave
    ? [0, 0.8, 1.6]
    : Array.from({ length: Math.floor(xmax / 40) + 1 }, (_, i) => i * 40);
  const yticks = Array.from(
    { length: Math.floor(ymax / 40) + 1 },
    (_, i) => i * 40,
  );
  return (
    <g className="home-plot-grid">
      {yticks.map((p) => (
        <g key={p}>
          <path d={`M30 ${Y(p, ymax)}H308`} />
          <text x="25" y={Y(p, ymax) + 3} textAnchor="end">
            {p}
          </text>
        </g>
      ))}
      {xticks.map((v) => (
        <g key={v}>
          <path d={`M${X(v, xmax)} 16V193`} />
          <text x={X(v, xmax)} y="208" textAnchor="middle">
            {wave ? `${v.toFixed(1)}s` : v}
          </text>
        </g>
      ))}
    </g>
  );
}
