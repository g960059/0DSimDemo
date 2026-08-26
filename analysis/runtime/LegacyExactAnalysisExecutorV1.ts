import type {
  AnalysisExecutorV1,
} from "@/analysis/contracts/AnalysisExecutionV1";

/**
 * Transitional executor for immutable artifacts whose analysis implementation
 * is still embedded in the exact adapter. Keeping the bridge here lets the
 * Worker and future method executors stop depending on that legacy ownership.
 */
export const LEGACY_EXACT_ANALYSIS_EXECUTOR_V1: AnalysisExecutorV1 =
  Object.freeze({
    execute({ source, request }) {
      if (source.legacyExact === null) {
        throw new Error(
          `Analysis ${request.analysisId} requires an unavailable legacy exact executor`,
        );
      }
      return source.legacyExact.request(request);
    },
  });
