import React from "react";
import katex from "katex";

function useMathHtml(expression: string, displayMode: boolean) {
  return React.useMemo(() => katex.renderToString(expression, {
    displayMode, output: "htmlAndMathml", trust: false, throwOnError: true,
  }), [expression, displayMode]);
}

export function ModelEquationV1({ expression }: { expression: string }) {
  const html = useMathHtml(expression, true);
  return <div tabIndex={0} className="model-math-display my-5 overflow-x-auto rounded px-1 py-3 text-wb-text focus-visible:ring-2 focus-visible:ring-wb-accent"
    dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ModelInlineMathV1({ expression, plainText }: { expression: string; plainText?: string }) {
  const html = useMathHtml(expression, false);
  return <span className="model-math-inline" data-math-expression={expression} data-math-plain={plainText}
    dangerouslySetInnerHTML={{ __html: html }} />;
}

// Explicit notation for authored table labels, never inferred from arbitrary
// prose. Keep units as ordinary text and CSV labels free of duplicate MathML.
const tableSymbols: Readonly<Record<string, string>> = {
  kTRPN: String.raw`k_{\mathrm{TRPN}}`, nTRPN: String.raw`n_{\mathrm{TRPN}}`, CaT50Ref: String.raw`\mathrm{Ca}_{50,\mathrm{ref}}`,
  ku: String.raw`k_u`, nTm: String.raw`n_{\mathrm{Tm}}`, TRPN50: String.raw`\theta`,
  kuw: String.raw`k_{\mathrm{uw}}`, kws: String.raw`k_{\mathrm{ws}}`, kwu: String.raw`k_{\mathrm{wu}}`, ksu: String.raw`k_{\mathrm{su}}`, kb: String.raw`k_b`,
  rw: String.raw`r_w`, rs: String.raw`r_s`, gammaS: String.raw`\gamma_s`, gammaW: String.raw`\gamma_w`, phi: String.raw`\phi`,
  Aeff: String.raw`A_{\mathrm{eff}}`, beta0: String.raw`\beta_0`, beta1: String.raw`\beta_1`, Tref: String.raw`T_{\mathrm{ref}}`, temperatureK: "T",
  Aw: String.raw`A_w`, As: String.raw`A_s`, cw: String.raw`c_w`, cs: String.raw`c_s`,
  "τr": String.raw`\tau_r`, "τd": String.raw`\tau_d`, "Ca₀": String.raw`\mathrm{Ca}_0`,
  K0: "K_0", Kt: "K_t", Kc: "K_c", C1: "C_1", C2: "C_2", C3: "C_3", C4: "C_4", Ev: "E_v", "τv": String.raw`\tau_v`,
  Aref: String.raw`A_{\mathrm{ref}}`, Vref: String.raw`V_{\mathrm{ref}}`, Cref: String.raw`C_{\mathrm{ref}}`,
  V0: "V_0", Poffset: String.raw`P_{\mathrm{offset}}`, Vfluid: String.raw`V_{\mathrm{fluid}}`, "P*": "P_*", Vh: "V_h",
  Amax: String.raw`A_{\mathrm{max}}`, Ar: "A_r", ko: "k_o", "τopen": String.raw`\tau_{\mathrm{open}}`, "τclose": String.raw`\tau_{\mathrm{close}}`,
  Vu: "V_u", P0: "P_0", Vs: "V_s", "Cc / Co / Cd": "C_c / C_o / C_d", "po / ps": "p_o / p_s", "do / ds": "d_o / d_s",
  "wL / wS / wR": "w_L / w_S / w_R", "ζw": String.raw`\zeta_w`, "ζs": String.raw`\zeta_s`,
  "V(t₀)": "V(t_0)", "e(t₀)": "e(t_0)", "α(t₀)": String.raw`\alpha(t_0)`, "xr(t₀)": "x_r(t_0)", "xd(t₀)": "x_d(t_0)",
  vS: "v_S", "θ(t₀)": String.raw`\theta(t_0)`, "L(t₀)": "L(t_0)", "∫Qm dt": String.raw`\int Q_m\,dt`,
  "eMVC,LVFW": String.raw`e_{\mathrm{MVC},\mathrm{LVFW}}`, "eMVC,SEP": String.raw`e_{\mathrm{MVC},\mathrm{SEP}}`, "eMVC,RVFW": String.raw`e_{\mathrm{MVC},\mathrm{RVFW}}`,
  Pth: String.raw`P_{\mathrm{th}}`, Palv: String.raw`P_{\mathrm{alv}}`, "Pth + Pperi": String.raw`P_{\mathrm{th}}+P_{\mathrm{peri}}`,
};

export function ModelMathLabelV1({ label }: { label: string }) {
  const unitStart = label.indexOf(" (");
  const symbol = unitStart < 0 ? label : label.slice(0, unitStart);
  const expression = tableSymbols[symbol];
  if (!expression) return <>{label}</>;
  return <><ModelInlineMathV1 expression={expression} plainText={symbol} />{unitStart < 0 ? "" : label.slice(unitStart)}</>;
}
