import { cloneAndFreezeStudioJson } from "@/domain/json/CanonicalJson";
import record from "./standard73-baseline-v1.json";
import selection from "./current-baseline-selection-v1.json";

// Local adoption metadata, not a new exact-model identity. Keep the selection
// small: document readers must not download a simulation checkpoint.
if (record.baselineId !== selection.baselineId || record.modelId !== selection.modelId
  || record.surfaceReleaseId !== selection.surfaceReleaseId || record.recordSha256 !== selection.recordSha256
  || record.document.documentId !== selection.document.documentId
  || record.document.contentSha256 !== selection.document.contentSha256) {
  throw new Error("Selected baseline and its saved document are not bound");
}
export const CURRENT_BASELINE_V1 = cloneAndFreezeStudioJson<typeof record>(record);
