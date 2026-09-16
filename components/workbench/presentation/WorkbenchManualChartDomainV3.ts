import type { ExperimentGraphAxisRangeV2 } from "@/studio/contracts/v2/content";
import type { WorkbenchNumericDomainV3 } from "./WorkbenchStableChartDomainV3";

/** Manual display ranges do not alter sampled values, analysis or auto-scale history. */
export function workbenchManualChartDomainV3(
  automatic: WorkbenchNumericDomainV3,
  range: ExperimentGraphAxisRangeV2 | undefined,
): WorkbenchNumericDomainV3 {
  return range !== undefined && Number.isFinite(range.minimum) && Number.isFinite(range.maximum)
    && range.maximum > range.minimum && Number.isFinite(range.maximum - range.minimum)
    ? [range.minimum, range.maximum] : automatic;
}
