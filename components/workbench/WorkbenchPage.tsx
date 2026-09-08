import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";

import { homeHref, myExperimentsHref } from "@/homeLinks";
import { isLocale } from "@/localeRouting";
import { isOpaqueExperimentIdV3 } from "@/studio/infrastructure/browser/StudioExperimentIdentityV3";
import { WorkbenchSession } from "@/components/workbench/WorkbenchSession";
import { modelLabEnabledV3 } from "@/components/workbench/WorkbenchSessionPolicy";
import { readPreparedBaselineCaseV1, type PreparedBaselineCaseV1 } from "@/studio/registry/PreparedBaselineCaseV1";

export function WorkbenchPage() {
  const { experimentId, locale } = useParams();
  const selectedLocale = isLocale(locale) ? locale : undefined;
  if (experimentId === "new") {
    return <WorkbenchSession initialExperimentId={null} />;
  }
  if (!isOpaqueExperimentIdV3(experimentId)) {
    return <Navigate to={myExperimentsHref(selectedLocale)} replace />;
  }
  return <WorkbenchSession initialExperimentId={experimentId} />;
}

/** One explicit local lab for an unreleased Standard model/Surface bundle. */
export function WorkbenchModelLabPage() {
  const { locale } = useParams();
  const [search] = useSearchParams();
  const hfrefResearch = search.get("research") === "hfref";
  const [candidate, setCandidate] = useState<PreparedBaselineCaseV1 | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [launchNumber, setLaunchNumber] = useState(0);
  const ja = locale === "ja";
  if (!modelLabEnabledV3()) {
    return (
      <Navigate to={homeHref(isLocale(locale) ? locale : undefined)} replace />
    );
  }
  return <div className="flex h-full min-h-0 flex-col">
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-wb-border bg-wb-panel px-3 py-1.5 text-xs text-wb-text">
      {hfrefResearch && <details className="max-w-3xl">
        <summary className="cursor-pointer">{ja ? "研究候補：LV収縮能低下" : "Research: LV systolic dysfunction"}</summary>
        <p className="py-2">{ja
          ? "baselineのLV収縮性を1から0.35にすると、同じ設定の症例に到達します。シナリオの追加から、定常化済みのHFrEFデモも選べます。LV自由壁と共有中隔の能動張力のみを変え、右室自由壁は変えていません。うっ血と右室への波及を含むデモで、慢性リモデリングやAMIの再現ではありません。EDVIの推奨目標は未達です。Tei等の変化は一般的なHFrEFの方向と一致するとは限らず、Glantz τは短い観測区間で推定不良のため未確定です。操作後の過渡応答を定常値とは解釈しないでください。PV解析が時間上限に達した場合は、波形が落ち着いてからエラー詳細の「現在の状態で再計算」を使えます。"
          : "Set LV contractility from 1 to 0.35 to reach the same input configuration, or add the settled HFrEF demo from Scenarios. Only LV free-wall and shared-septal active tension changes. This congested systolic-dysfunction demo includes RV interaction, not chronic remodeling or AMI. Preferred EDVI is missed; timing changes are not universal HFrEF behavior and free-asymptote tau is unresolved. Outputs immediately after a change are transient. If PV analysis reaches its settlement limit, let the waveforms settle and use Recalculate from current state in the error details."}</p>
      </details>}
      {!hfrefResearch && <label className="cursor-pointer underline underline-offset-2">
        {loading ? (ja ? "確認中…" : "Checking…") : (ja ? "候補JSONから新規起動" : "New session from candidate JSON")}
        <input type="file" accept=".json,application/json" className="sr-only" disabled={loading}
          aria-label={ja ? "候補JSONから新規起動" : "New session from candidate JSON"}
          onChange={async event => {
            const file = event.currentTarget.files?.[0]; event.currentTarget.value = "";
            if (!file) return;
            setLoading(true); setError(null);
            try {
              if (file.size > 2 * 1024 * 1024) throw new Error(ja ? "候補ファイルは2 MiB以下にしてください。" : "Candidate file exceeds 2 MiB.");
              setCandidate(await readPreparedBaselineCaseV1(JSON.parse(await file.text())));
              setLaunchNumber(value => value + 1);
            } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
            finally { setLoading(false); }
          }} />
      </label>}
      {candidate && <>
        <span>{candidate.preset.title} · {ja ? "未採用の候補" : "Unadopted candidate"}</span>
        <button type="button" className="underline underline-offset-2" disabled={loading}
          onClick={() => { setCandidate(undefined); setError(null); setLaunchNumber(value => value + 1); }}>
          {ja ? "baselineから新規起動" : "New session from baseline"}
        </button>
      </>}
      {error && <span role="alert" className="text-wb-danger">{error}</span>}
    </div>
    <div className="min-h-0 flex-1">
      <WorkbenchSession key={launchNumber}
        initialExperimentId={null} modelLab preparedBaseline={candidate} />
    </div>
  </div>;
}

export default WorkbenchPage;
