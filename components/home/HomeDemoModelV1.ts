/** The Fable demo's illustrative elastance + two-element Windkessel model.
 * This presentation-only toy is not a production exact model, Surface or Snapshot.
 * Each input change solves eight short beats; the final two drive the animation.
 */
export type HomeDemoParametersV1 = Readonly<{
  pv: number;
  svr: number;
  ees: number;
}>;
export type HomeDemoPointV1 = Readonly<{
  t: number;
  V: number;
  Plv: number;
  Pao: number;
}>;
export const HOME_DEMO_BASE_V1: HomeDemoParametersV1 = {
  pv: 10,
  svr: 1,
  ees: 2.3,
};
export const HOME_DEMO_PRESETS_V1 = [
  { id: "base", params: HOME_DEMO_BASE_V1, ja: "基準", en: "Baseline" },
  {
    id: "afterload",
    params: { ...HOME_DEMO_BASE_V1, svr: 1.6 },
    ja: "後負荷↑",
    en: "Afterload ↑",
  },
  {
    id: "contractility",
    params: { ...HOME_DEMO_BASE_V1, ees: 1.3 },
    ja: "収縮性↓",
    en: "Contractility ↓",
  },
  {
    id: "preload",
    params: { ...HOME_DEMO_BASE_V1, pv: 15 },
    ja: "前負荷↑",
    en: "Preload ↑",
  },
] as const;
export function simulateHomeDemoV1(p: HomeDemoParametersV1) {
  if (
    !Number.isFinite(p.pv) ||
    p.pv < 4 ||
    p.pv > 18 ||
    !Number.isFinite(p.svr) ||
    p.svr < 0.5 ||
    p.svr > 2 ||
    !Number.isFinite(p.ees) ||
    p.ees < 0.8 ||
    p.ees > 4
  )
    throw new RangeError(
      "Home demo controls are outside their supported range",
    );
  const hr = 75,
    T = 60 / hr,
    dt = 0.0005,
    beats = 8;
  const V0 = 10,
    A = 0.6,
    k = 0.025,
    Rmv = 0.02,
    Rav = 0.01,
    C = 1.6,
    Ts = 0.3,
    Pout = 5;
  let V = 120,
    Pao = 80;
  const rec: HomeDemoPointV1[] = [];
  const n = Math.round((beats * T) / dt),
    startRec = (beats - 2) * T - 1e-9;
  for (let i = 0; i < n; i++) {
    const tt = i * dt,
      tc = tt % T;
    const e = tc < Ts ? 0.5 * (1 - Math.cos((2 * Math.PI * tc) / Ts)) : 0;
    const Vd = Math.max(V - V0, 0);
    const Plv = e * p.ees * Vd + (1 - e) * A * (Math.exp(k * Vd) - 1);
    const Qin = Plv < p.pv ? (p.pv - Plv) / Rmv : 0;
    const Qout = Plv > Pao ? (Plv - Pao) / Rav : 0;
    V += (Qin - Qout) * dt;
    Pao += ((Qout - (Pao - Pout) / p.svr) / C) * dt;
    if (tt >= startRec && i % 4 === 0)
      rec.push({ t: tt - (beats - 2) * T, V, Plv, Pao });
  }
  const last = rec.filter((r) => r.t >= T),
    Vs = last.map((r) => r.V),
    Ps = last.map((r) => r.Pao);
  const EDV = Math.max(...Vs),
    ESV = Math.min(...Vs),
    SV = EDV - ESV;
  return {
    rec,
    last,
    metrics: {
      EDV,
      ESV,
      SV,
      EF: (SV / EDV) * 100,
      CO: (SV * hr) / 1000,
      sys: Math.max(...Ps),
      dia: Math.min(...Ps),
      pmax: Math.max(...last.map((r) => r.Plv)),
      T,
    },
  };
}
