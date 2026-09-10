import { Navigate, useParams, useSearchParams } from "react-router-dom";

import { homeHref, myExperimentsHref, modelDocumentationHref } from "@/homeLinks";
import hfrefDocument from "@/studio/presentation/modelDocumentation/packages/standard73-hfref-document-v2.index.json";
import { isLocale } from "@/localeRouting";
import { isOpaqueExperimentIdV3 } from "@/studio/infrastructure/browser/StudioExperimentIdentityV3";
import { WorkbenchSession } from "@/components/workbench/WorkbenchSession";
import { modelLabEnabledV3 } from "@/components/workbench/WorkbenchSessionPolicy";

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

/** Local Workbench for the checked-in model/Surface bundle. */
export function WorkbenchModelLabPage() {
  const { locale } = useParams();
  const [search] = useSearchParams();
  const hfrefResearch = search.get("research") === "hfref";
  const ja = locale === "ja";
  if (!modelLabEnabledV3()) {
    return (
      <Navigate to={homeHref(isLocale(locale) ? locale : undefined)} replace />
    );
  }
  return <div className="flex h-full min-h-0 flex-col">
    {hfrefResearch && <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-wb-border bg-wb-panel px-3 py-1.5 text-xs text-wb-text">
      <details className="max-w-3xl">
        <summary className="cursor-pointer">{ja ? "症例：慢性拡大型HFrEF" : "Case: chronic dilated HFrEF"}</summary>
        <p className="py-2">{ja
          ? "通常のworkbenchと同じbaseline・HFrEFを選べます。HFrEFは左室の形状・心筋量の変更と収縮性低下を組み合わせた一例で、収縮性だけを下げた状態とは異なります。リモデリングの進行過程やAMIを再現するものではありません。検証した範囲と限界は症例文書をご覧ください。"
          : "The same baseline and HFrEF presets are available in the ordinary workbench. HFrEF combines changed LV geometry and tissue mass with reduced contractility; lowering contractility alone is different. It does not simulate evolving remodeling or AMI. See the case document for qualification scope and limitations."}</p>
      </details>
      {!import.meta.env.PROD && <a target="_blank" rel="noreferrer"
        className="text-wb-accent underline underline-offset-2"
        href={modelDocumentationHref({ locale: ja ? "ja" : "en", ...hfrefDocument.identity, documentId: hfrefDocument.documentId, view: "presets" })}>
        {ja ? "症例の説明・検証" : "Case explanation and evidence"}
      </a>}
    </div>}
    <div className="min-h-0 flex-1">
      <WorkbenchSession initialExperimentId={null} modelLab />
    </div>
  </div>;
}

export default WorkbenchPage;
