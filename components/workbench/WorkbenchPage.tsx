import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";

import { homeHref, myExperimentsHref, modelDocumentationHref } from "@/homeLinks";
import hfrefDocument from "@/studio/presentation/modelDocumentation/packages/hfref-static-case-document-v4.index.json";
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
        <summary className="cursor-pointer">{ja ? "研究候補：慢性拡大型HFrEF" : "Research: chronic dilated HFrEF"}</summary>
        <p className="py-2">{ja
          ? "「Presetから追加」で定常化済みのHFrEF候補を選べます。LV自由壁と共有中隔の収縮性低下に、参照形状・心筋量の変更を組み合わせた一例です。LV収縮性だけを下げても同じ症例にはなりません。右室自由壁の設定は同じですが、中隔や循環を介して右室の動きも変わります。慢性期の状態を表すための研究候補で、リモデリングの進行過程やAMIは再現していません。冠血管床と酸素需要の基準はbaselineのままで、増えた心筋への灌流や酸素供給の十分さは未検証です。Glantz τは推定不良のため未確定。正式採用前であり、操作後すぐの値は定常値ではありません。"
          : "Add the settled HFrEF candidate from Presets. This case combines reduced LV free-wall and shared-septal contractility with changed reference geometry and tissue mass; lowering contractility alone does not reproduce it. RV free-wall inputs are unchanged, but septal and circulatory coupling affect RV behavior. It represents one chronic state, not evolving remodeling or AMI. The coronary bed and reference oxygen demand remain at baseline: perfusion and oxygen adequacy for the larger mass are unvalidated. Glantz tau is unresolved. Formal adoption is pending, and values immediately after an edit are transient."}</p>
      </details>}
      {hfrefResearch && !import.meta.env.PROD && <a target="_blank" rel="noreferrer"
        className="text-wb-accent underline underline-offset-2"
        href={modelDocumentationHref({ locale: ja ? "ja" : "en", ...hfrefDocument.identity, documentId: hfrefDocument.documentId, view: "presets" })}>
        {ja ? "症例の説明・検証" : "Case explanation and evidence"}
      </a>}
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
