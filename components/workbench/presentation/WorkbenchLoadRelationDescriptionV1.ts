/** Second-layer copy: operational measurements, never a claim of a passive law. */
export function workbenchLoadRelationDescriptionV1(
  kind: "pv" | "pv-isochrone" | "pva" | "starling", language = "en",
): string {
  const ja = language.startsWith("ja");
  if (kind === "pv") return ja
    ? "ESPVRはTBV負荷試験の圧包絡線です。点は各負荷の最小容積に対応し、圧値は補間を含みます。EDPVRは最大容積時点の測定点をTBV順に結んだ補助線で、受動的な硬さだけを表すものではありません。測定範囲外には延長しません。凡例に触れると強調、クリックで表示を切り替えます。"
    : "ESPVR: pressure envelope of the TBV load family; dots mark each load's minimum volume with envelope pressure, including interpolation. EDPVR: maximum-volume measurements joined in TBV order, not a pure passive stiffness curve. No extrapolation. Hover/focus the legend to emphasize a trace; click to hide it.";
  if (kind === "pv-isochrone") return ja
    ? "ESPVRはPVA計算で選択された同時刻境界、EDPVRは指数近似です。TBV変更だけでも選択時刻や曲線が変化し、収縮力だけの違いを表すものではありません。"
    : "ESPVR: the common-time boundary selected for PVA; EDPVR: an exponential fit. Changing TBV alone can shift the selected time and curves without a change in contractility.";
  if (kind === "pva") return ja
    ? "PVA計算用の同時刻境界と指数近似EDPVRです。SWとPEは別々に示します。PEには未測定の低容積側の近似を含むことがあり、蓄えられた弾性エネルギーの実測ではありません。"
    : "PVA: common-time systolic boundary and fitted EDPVR. SW and PE are separate illustrations. PE can include an unmeasured low-volume construction; it is not measured stored energy.";
  return ja
    ? "点はTBV負荷試験の測定値、Starling曲線は測定点間だけの補間です。淡い実線のGuyton曲線は別の還流近似で、測定点列ではありません。凡例に触れるとscenarioを強調、クリックで表示を切り替えます。"
    : "Dots: simulated TBV load-test points. Starling interpolates measured support only. The fainter solid Guyton line is a separate venous-return approximation, not measured load points. Hover/focus a Scenario to emphasize it; click to hide it.";
}
