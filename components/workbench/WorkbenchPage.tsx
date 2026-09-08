import { Navigate, useParams } from "react-router-dom";
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
      <label className="cursor-pointer underline underline-offset-2">
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
      </label>
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
