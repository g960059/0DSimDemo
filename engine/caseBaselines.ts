// Named baseline registry (milestone #3-a). A baseline is a full raw param set
// + default TBV that official cases are authored on top of (deviations live in
// the clinical knobs). Kept tiny and engine-pure on purpose.

import type { BaselineDef } from "@/engine/caseResolve";
import { defaultParams } from "@/engine/core/params";

export const ACTIVE_NORMAL_OFFICIAL_TARGET_BLOOD_VOLUME_ML = 5600 as const;

/**
 * The single canonical baseline for the first lesson slice: the active-stress
 * default operating point (a roughly-physiological normal adult) with a 5600 mL
 * TBV. Every official #3 case resolves against this and expresses its pathology
 * purely through knobs/interventions.
 */
export const OFFICIAL_BASELINES: Record<string, BaselineDef> = {
  "active-normal": {
    params: defaultParams(),
    targetVolume: ACTIVE_NORMAL_OFFICIAL_TARGET_BLOOD_VOLUME_ML,
    label: "Normal adult (active-stress)",
  },
};
