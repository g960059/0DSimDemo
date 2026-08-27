import { Navigate, useParams } from "react-router-dom";

import { homeHref, myExperimentsHref } from "@/homeLinks";
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

/** One explicit local lab for an unreleased Standard model/Surface bundle. */
export function WorkbenchModelLabPage() {
  const { locale } = useParams();
  if (!modelLabEnabledV3()) {
    return (
      <Navigate to={homeHref(isLocale(locale) ? locale : undefined)} replace />
    );
  }
  return <WorkbenchSession initialExperimentId={null} modelLab />;
}

export default WorkbenchPage;
