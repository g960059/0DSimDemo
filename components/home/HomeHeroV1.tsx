import React from "react";
import beats from "./HomeHeroBeatsV1.json";
export const HOME_HERO_PRESETS_V1 = beats;
const names = {
  ja: ["基準", "収縮性を下げる", "後負荷を上げる", "前負荷を上げる"],
  en: ["Baseline", "Lower contractility", "Higher afterload", "Higher preload"],
};
function trace(points: number[][], x: number, y: number, wave = false) {
  return (
    points
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${(26 + (p[x] / (wave ? 0.8 : 200)) * 224).toFixed(1)},${(155 - (p[y] / 180) * 137).toFixed(1)}`,
      )
      .join(" ") + (wave ? "" : "Z")
  );
}
export function HomeHeroV1({
  locale,
  preset = 0,
  onPreset,
}: {
  locale: "ja" | "en";
  preset?: number;
  onPreset?: (index: number) => void;
}) {
  const ja = locale === "ja",
    beat = beats[preset] ?? beats[0],
    base = beats[0];
  return (
    <div
      className="home-mini-demo"
      aria-label={ja ? "循環動態の簡易デモ" : "Simplified hemodynamics demo"}
    >
      <div className="home-demo-heading">
        <strong>
          {ja ? "動かして、確かめる" : "Change it. See what happens."}
        </strong>
        <span>{ja ? "簡易モデル" : "Simplified model"}</span>
      </div>
      <div className="home-demo-plots">
        <figure>
          <figcaption>
            {ja ? "左室 PVループ" : "LV pressure–volume"}
            <small>mmHg, mL</small>
          </figcaption>
          <svg
            viewBox="0 0 268 176"
            role="img"
            aria-label={
              ja
                ? "1拍分の左室圧容積ループ"
                : "One-beat LV pressure–volume loop"
            }
          >
            <Grid wave={false} />
            {preset !== 0 && (
              <path
                className="home-plot-reference"
                d={trace(base.points, 1, 2)}
              />
            )}
            <path
              className="home-plot-line home-lvp"
              d={trace(beat.points, 1, 2)}
            />
          </svg>
        </figure>
        <figure>
          <figcaption>
            {ja ? "圧波形 (mmHg, s)" : "Pressure (mmHg, s)"}
            <small>
              <i className="home-lvp">LVP</i> <i className="home-aop">AoP</i>{" "}
              <i className="home-lap">LAP</i>
            </small>
          </figcaption>
          <svg
            viewBox="0 0 268 176"
            role="img"
            aria-label={
              ja
                ? "1拍分の左室・大動脈・左房圧"
                : "One-beat LV, aortic and left atrial pressures"
            }
          >
            <Grid wave />
            {[3, 2, 4].map((key) => (
              <path
                key={key}
                className={
                  "home-plot-line " +
                  { 2: "home-lvp", 3: "home-aop", 4: "home-lap" }[key]
                }
                d={trace(beat.points, 0, key, true)}
              />
            ))}
          </svg>
        </figure>
      </div>
      <div
        className="home-demo-presets"
        role="group"
        aria-label={ja ? "比較する条件" : "Comparison condition"}
      >
        {beats.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-pressed={preset === i}
            disabled={!onPreset}
            onClick={() => onPreset?.(i)}
          >
            {names[locale][i]}
          </button>
        ))}
      </div>
      <div className="home-demo-metrics" aria-live="polite">
        <span>
          {ja ? "一回拍出量" : "Stroke volume"}{" "}
          <strong>{beat.strokeVolume}</strong> mL
          {preset !== 0 && (
            <small>
              {" "}
              ({beat.strokeVolume > base.strokeVolume ? "+" : ""}
              {beat.strokeVolume - base.strokeVolume})
            </small>
          )}
        </span>
        <span>
          {ja ? "駆出率" : "Ejection fraction"}{" "}
          <strong>{beat.ejectionFraction}</strong> %
        </span>
        {preset !== 0 && <span>{ja ? "破線：基準" : "Dashed: baseline"}</span>}
      </div>
      <p className="home-demo-note">
        {ja
          ? "説明用の簡易モデルの1拍分を比較しています。本体の計算結果ではありません。"
          : "Compare one cached beat from a simplified illustration model, not the full CircleHeart model."}{" "}
        <a href={`/${locale}/models`}>
          {ja ? "数理モデルについて" : "About the models"}
        </a>
      </p>
    </div>
  );
}
function Grid({ wave }: { wave: boolean }) {
  return (
    <g className="home-plot-grid">
      {[0, 60, 120, 180].map((p) => (
        <g key={p}>
          <path d={`M26 ${155 - (p / 180) * 137}H250`} />
          <text x="21" y={158 - (p / 180) * 137} textAnchor="end">
            {p}
          </text>
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <path d={`M${26 + i * 56} 18V155`} />
          <text x={26 + i * 56} y="166" textAnchor="middle">
            {wave ? (i * 0.2).toFixed(1) : i * 50}
          </text>
        </g>
      ))}
    </g>
  );
}
