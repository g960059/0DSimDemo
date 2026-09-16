/** Second-layer copy: operational measurements, never a claim of a passive law. */
export function workbenchLoadRelationDescriptionV1(
  kind: "pv" | "pv-isochrone" | "pva" | "starling", language = "en",
): string {
  const ja = language.startsWith("ja");
  if (kind === "pv") return ja
    ? "ESPVR（収縮末期圧容積関係）は、総血液量を変えた各条件の圧波形の上縁から求めます。点は最小容積とその容積での上縁の圧を示します。EDPVR（拡張末期圧容積関係）は、各条件の最大容積時の圧と容積を結んだ線です。どちらも評価した容積範囲で示し、心筋の性質と負荷条件の影響を含みます。"
    : "ESPVR (end-systolic pressure–volume relation) follows the upper pressure envelope across total-blood-volume conditions. Dots show minimum volume and its envelope pressure. EDPVR (end-diastolic pressure–volume relation) joins pressure and volume at maximum volume in each condition. Both cover the evaluated volume range and reflect myocardial properties and loading conditions.";
  if (kind === "pv-isochrone") return ja
    ? "ESPVR（収縮末期圧容積関係）は、異なる負荷条件の圧と容積を心周期内の同じ時点で結んだ線です。EDPVR（拡張末期圧容積関係）は拡張期の測定点から近似します。曲線は心筋の性質と負荷条件の両方に応じて変化します。"
    : "ESPVR (end-systolic pressure–volume relation) connects pressure and volume across loading conditions at the same point in the cardiac cycle. EDPVR (end-diastolic pressure–volume relation) is fitted to diastolic measurements. Both myocardial properties and loading conditions influence these curves.";
  if (kind === "pva") return ja
    ? "PVA（圧容積面積）は、外的仕事SWとポテンシャルエネルギーPEの和です。SWはPVループ内の面積、PEは収縮期・拡張期の圧容積関係で囲まれる推定面積として別々に示します。PEの推定には、低容積側への曲線の延長を含む場合があります。"
    : "PVA (pressure–volume area) is the sum of external stroke work (SW) and potential energy (PE). SW is the area within the PV loop; PE is estimated from the systolic and diastolic pressure–volume boundaries. They are shown separately. Estimating PE may require extending the curves toward lower volumes.";
  return ja
    ? "Starling曲線は、充満圧に対する心拍出量の変化を示します。点は総血液量を変えたシミュレーションの測定値で、その間を線で結んでいます。淡いGuyton曲線は、心房圧に応じた静脈還流量の近似です。両曲線の交点が、心拍出量と静脈還流量の釣り合う状態を示します。"
    : "The Starling curve shows how cardiac output changes with filling pressure. Dots are simulated measurements at different total blood volumes, joined between measured conditions. The fainter Guyton curve approximates venous return as atrial pressure changes. Their intersection represents the balance between cardiac output and venous return.";
}
