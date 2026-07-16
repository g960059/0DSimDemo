import {
  mapFivePatchPhysiologyEnvelopeMitralHydraulicsV2,
  type FivePatchPhysiologyEnvelopeParameterVectorV2,
  type FivePatchPhysiologyEnvelopeScenarioV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeDefinitionV2";
import type {
  PeriodicPrescribedCalciumDriverParamsV2,
} from "@/engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2";
import type {
  LandActivePassiveSlsParamsV1,
} from "@/engine/mechanics2/constitutive/LandActivePassiveSlsV1";
import {
  createDefaultNoAvpdFivePatchLandTriSegParamsV1,
  initialNoAvpdFivePatchLandTriSegStateV1,
  totalBloodVolumeMl,
  type NoAvpdBloodVolumesV1,
  type NoAvpdFivePatchLandTriSegParamsV1,
  type NoAvpdFivePatchLandWallParamsV1,
  type NoAvpdTriSegWallParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_APPLICATION_ID_V2 =
  "five-patch-physiology-envelope-parameter-application-v2" as const;

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_BLOOD_VOLUME_ALLOCATION_V2 =
  Object.freeze({
    meaning:
      "exact-total-blood-volume-scale-with-fixed-60-to-13-compliant-venous-allocation" as const,
    mutableCompartments: Object.freeze([
      "systemicVeinMl",
      "pulmonaryVeinMl",
    ] as const),
    preservedCompartments: Object.freeze([
      "leftAtriumMl",
      "leftVentricleMl",
      "systemicArteryMl",
      "rightAtriumMl",
      "rightVentricleMl",
      "pulmonaryArteryMl",
    ] as const),
    systemicVeinWeight: 60 as const,
    pulmonaryVeinWeight: 13 as const,
  });

export type FivePatchPhysiologyEnvelopeAppliedConfigV2 = {
  readonly applicationId:
    typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_APPLICATION_ID_V2;
  readonly params: NoAvpdFivePatchLandTriSegParamsV1;
  readonly initialVolumeOverridesMl: Partial<NoAvpdBloodVolumesV1>;
  readonly effectiveAxisReadback: FivePatchPhysiologyEnvelopeParameterVectorV2;
  readonly provenance: {
    readonly base: "fresh-default-all-patch";
    readonly initialization: "independent-cold-start";
    readonly bloodVolumeApplication:
      "exact-total-scale-fixed-60-to-13-compliant-venous-allocation";
    readonly mitralHydraulicApplication:
      "area-and-leak-times-s-R-and-B-over-s2-L-over-s";
    readonly avDelayApplication:
      "real-time-LA-to-next-LV-preserve-within-group-offsets";
    readonly landCellularParametersChanged: false;
    readonly slsParametersChanged: false;
    readonly calciumPeakAmplitudesChanged: false;
  };
};

export type FivePatchPhysiologyEnvelopeScenarioConfigV2 = {
  readonly applicationId:
    typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_APPLICATION_ID_V2;
  readonly scenario: FivePatchPhysiologyEnvelopeScenarioV2;
  readonly params: NoAvpdFivePatchLandTriSegParamsV1;
  readonly initialVolumeOverridesMl: Partial<NoAvpdBloodVolumesV1>;
  /** Candidate readback before the independently declared scenario overlay. */
  readonly candidateEffectiveAxisReadback:
    FivePatchPhysiologyEnvelopeParameterVectorV2;
  /** Candidate and scenario blood-volume/systemic-R scales after composition. */
  readonly effectiveAxisReadback: FivePatchPhysiologyEnvelopeParameterVectorV2;
  readonly scenarioReadback: {
    readonly cycleLengthSec: number;
    readonly heartRateBpm: number;
    readonly combinedBloodVolumeScale: number;
    readonly combinedSystemicResistanceScale: number;
    readonly pulmonaryResistanceScale: number;
    readonly avDelaySec: number;
  };
  readonly provenance: {
    readonly base: "candidate-config-built-from-fresh-default-all-patch";
    readonly initialization: "independent-cold-start";
    readonly scenarioComposition:
      "scenario-scales-multiply-mapped-candidate-scales";
    readonly avDelayApplication:
      "physical-seconds-held-across-heart-rate-within-group-offsets-preserved";
  };
};

/**
 * Applies the physiology-envelope axes to a fresh all-patch default.  No
 * material, calcium, flow, or continuation state can enter this pure builder.
 */
export function buildFivePatchPhysiologyEnvelopeConfigV2(
  vector: FivePatchPhysiologyEnvelopeParameterVectorV2,
): FivePatchPhysiologyEnvelopeAppliedConfigV2 {
  validateVector(vector);
  const base = createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch");
  const params = applyVectorToFreshBase(base, vector);
  const initialVolumeOverridesMl =
    fivePatchPhysiologyEnvelopeVenousInitialVolumeOverridesV2(
      vector.bloodVolumeScale,
    );
  const effectiveAxisReadback =
    fivePatchPhysiologyEnvelopeEffectiveAxisReadbackV2(
      params,
      initialVolumeOverridesMl,
    );
  return Object.freeze({
    applicationId: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_APPLICATION_ID_V2,
    params,
    initialVolumeOverridesMl,
    effectiveAxisReadback,
    provenance: Object.freeze({
      base: "fresh-default-all-patch" as const,
      initialization: "independent-cold-start" as const,
      bloodVolumeApplication:
        "exact-total-scale-fixed-60-to-13-compliant-venous-allocation" as const,
      mitralHydraulicApplication:
        "area-and-leak-times-s-R-and-B-over-s2-L-over-s" as const,
      avDelayApplication:
        "real-time-LA-to-next-LV-preserve-within-group-offsets" as const,
      landCellularParametersChanged: false as const,
      slsParametersChanged: false as const,
      calciumPeakAmplitudesChanged: false as const,
    }),
  });
}

/**
 * Applies a fixed protocol scenario without accepting a state from any other
 * run. Candidate and scenario volume/afterload scales compose multiplicatively.
 */
export function applyFivePatchPhysiologyEnvelopeScenarioV2(
  config: FivePatchPhysiologyEnvelopeAppliedConfigV2,
  scenario: FivePatchPhysiologyEnvelopeScenarioV2,
): FivePatchPhysiologyEnvelopeScenarioConfigV2 {
  validateScenario(scenario);
  const candidate = config.effectiveAxisReadback;
  const cycleLengthSec = 60 / scenario.heartRateBpm;
  if (candidate.avDelaySec >= cycleLengthSec) {
    throw new Error(
      `avDelaySec ${candidate.avDelaySec} must be shorter than scenario cycle ` +
      `${cycleLengthSec}`,
    );
  }
  const calciumDrivers = rephaseCalciumDriversAtCycleLength(
    config.params,
    cycleLengthSec,
    candidate.avDelaySec,
  );
  const combinedBloodVolumeScale = candidate.bloodVolumeScale *
    scenario.bloodVolumeScale;
  const initialVolumeOverridesMl =
    fivePatchPhysiologyEnvelopeVenousInitialVolumeOverridesV2(
      combinedBloodVolumeScale,
    );
  const params = Object.freeze({
    ...config.params,
    cycleLengthSec,
    calciumDrivers,
    vascular: Object.freeze({
      ...config.params.vascular,
      systemicResistanceMmHgSecPerMl:
        config.params.vascular.systemicResistanceMmHgSecPerMl *
        scenario.systemicResistanceScale,
      pulmonaryResistanceMmHgSecPerMl:
        config.params.vascular.pulmonaryResistanceMmHgSecPerMl *
        scenario.pulmonaryResistanceScale,
    }),
  });
  const effectiveAxisReadback =
    fivePatchPhysiologyEnvelopeEffectiveAxisReadbackV2(
      params,
      initialVolumeOverridesMl,
    );
  return Object.freeze({
    applicationId: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PARAMETER_APPLICATION_ID_V2,
    scenario,
    params,
    initialVolumeOverridesMl,
    candidateEffectiveAxisReadback: candidate,
    effectiveAxisReadback,
    scenarioReadback: Object.freeze({
      cycleLengthSec,
      heartRateBpm: scenario.heartRateBpm,
      combinedBloodVolumeScale,
      combinedSystemicResistanceScale:
        candidate.systemicResistanceScale * scenario.systemicResistanceScale,
      pulmonaryResistanceScale: scenario.pulmonaryResistanceScale,
      avDelaySec: effectiveAxisReadback.avDelaySec,
    }),
    provenance: Object.freeze({
      base: "candidate-config-built-from-fresh-default-all-patch" as const,
      initialization: "independent-cold-start" as const,
      scenarioComposition:
        "scenario-scales-multiply-mapped-candidate-scales" as const,
      avDelayApplication:
        "physical-seconds-held-across-heart-rate-within-group-offsets-preserved" as const,
    }),
  });
}

/**
 * Reconstructs every effective axis from subsystem inputs rather than echoing
 * the requested vector.  This is the no-dead-axis audit surface.
 */
export function fivePatchPhysiologyEnvelopeEffectiveAxisReadbackV2(
  params: NoAvpdFivePatchLandTriSegParamsV1,
  initialVolumeOverridesMl: Partial<NoAvpdBloodVolumesV1> = {},
): FivePatchPhysiologyEnvelopeParameterVectorV2 {
  const base = referenceParams();
  // Read back the declared cold volume distribution without initializing the
  // candidate constitutive/TriSeg state. Parameter application must remain
  // available even when a candidate later proves numerically non-ready.
  const initialVolumes = Object.freeze({
    ...referenceInitialVolumes(),
    ...initialVolumeOverridesMl,
  });
  return Object.freeze({
    atrialActiveScale: commonRatio([
      ratio(
        params.atria.left.material.activeHomogenizationScale,
        base.atria.left.material.activeHomogenizationScale,
      ),
      ratio(
        params.atria.right.material.activeHomogenizationScale,
        base.atria.right.material.activeHomogenizationScale,
      ),
    ], "atrial active scale"),
    ventricularActiveScale: commonRatio([
      ratio(
        params.triSeg.leftFreeWall.material.activeHomogenizationScale,
        base.triSeg.leftFreeWall.material.activeHomogenizationScale,
      ),
      ratio(
        params.triSeg.septum.material.activeHomogenizationScale,
        base.triSeg.septum.material.activeHomogenizationScale,
      ),
      ratio(
        params.triSeg.rightFreeWall.material.activeHomogenizationScale,
        base.triSeg.rightFreeWall.material.activeHomogenizationScale,
      ),
    ], "ventricular active scale"),
    atrialCalciumDecayScale: commonCalciumDecayScale(
      params,
      base,
      ["leftAtrium", "rightAtrium"],
      "atrial calcium decay scale",
    ),
    ventricularCalciumDecayScale: commonCalciumDecayScale(
      params,
      base,
      ["leftFreeWall", "septum", "rightFreeWall"],
      "ventricular calcium decay scale",
    ),
    avDelaySec: forwardCycleDeltaSec(
      params.calciumDrivers.leftAtrium.eventOnsetSec,
      params.calciumDrivers.leftFreeWall.eventOnsetSec,
      params.cycleLengthSec,
    ),
    ventricularPassiveTangentScale: commonRatio([
      passiveTangentRatio(
        params.triSeg.leftFreeWall.material,
        base.triSeg.leftFreeWall.material,
      ),
      passiveTangentRatio(
        params.triSeg.septum.material,
        base.triSeg.septum.material,
      ),
      passiveTangentRatio(
        params.triSeg.rightFreeWall.material,
        base.triSeg.rightFreeWall.material,
      ),
    ], "ventricular passive tangent scale"),
    mitralHydraulicAreaScale: coupledMitralScale(params, base),
    pulmonaryVenousResistanceScale: ratio(
      params.vascular.pulmonaryVenousSegment.resistanceMmHgSecPerMl,
      base.vascular.pulmonaryVenousSegment.resistanceMmHgSecPerMl,
    ),
    pulmonaryVenousInertanceScale: ratio(
      params.vascular.pulmonaryVenousSegment.inertanceMmHgSec2PerMl,
      base.vascular.pulmonaryVenousSegment.inertanceMmHgSec2PerMl,
    ),
    pulmonaryVeinComplianceScale: ratio(
      params.vascular.pulmonaryVein.complianceMlPerMmHg,
      base.vascular.pulmonaryVein.complianceMlPerMmHg,
    ),
    bloodVolumeScale: ratio(
      totalBloodVolumeMl(initialVolumes),
      referenceTotalBloodVolumeMl(),
    ),
    systemicResistanceScale: ratio(
      params.vascular.systemicResistanceMmHgSecPerMl,
      base.vascular.systemicResistanceMmHgSecPerMl,
    ),
  });
}

/** Only the two compliant venous reservoirs own a blood-volume challenge. */
export function fivePatchPhysiologyEnvelopeVenousInitialVolumeOverridesV2(
  bloodVolumeScale: number,
): Partial<NoAvpdBloodVolumesV1> {
  requirePositiveFinite(bloodVolumeScale, "bloodVolumeScale");
  if (bloodVolumeScale === 1) return Object.freeze({});
  const reference = referenceInitialVolumes();
  const referenceTotal = totalBloodVolumeMl(reference);
  const targetTotal = referenceTotal * bloodVolumeScale;
  const totalDelta = targetTotal - referenceTotal;
  const systemicWeight =
    FIVE_PATCH_PHYSIOLOGY_ENVELOPE_BLOOD_VOLUME_ALLOCATION_V2
      .systemicVeinWeight;
  const pulmonaryWeight =
    FIVE_PATCH_PHYSIOLOGY_ENVELOPE_BLOOD_VOLUME_ALLOCATION_V2
      .pulmonaryVeinWeight;
  const systemicVeinMl = reference.systemicVeinMl + totalDelta *
    systemicWeight / (systemicWeight + pulmonaryWeight);
  const fixedTotal = referenceTotal - reference.systemicVeinMl -
    reference.pulmonaryVeinMl;
  // The pulmonary reservoir is the exact remainder, avoiding two-rounding
  // drift from the requested closed blood-volume total.
  const pulmonaryVeinMl = targetTotal - fixedTotal - systemicVeinMl;
  if (systemicVeinMl <= 0 || pulmonaryVeinMl <= 0) {
    throw new Error(
      "blood-volume allocation produced a nonpositive venous volume",
    );
  }
  return Object.freeze({ systemicVeinMl, pulmonaryVeinMl });
}

function applyVectorToFreshBase(
  base: NoAvpdFivePatchLandTriSegParamsV1,
  vector: FivePatchPhysiologyEnvelopeParameterVectorV2,
): NoAvpdFivePatchLandTriSegParamsV1 {
  const calciumDrivers = applyCalciumAndAvDelay(base, vector);
  const mitral = mapFivePatchPhysiologyEnvelopeMitralHydraulicsV2(
    base.valves.mitral,
    vector.mitralHydraulicAreaScale,
  );
  return Object.freeze({
    ...base,
    calciumDrivers,
    atria: Object.freeze({
      left: mapAtrialWall(base.atria.left, vector.atrialActiveScale),
      right: mapAtrialWall(base.atria.right, vector.atrialActiveScale),
    }),
    triSeg: Object.freeze({
      leftFreeWall: mapVentricularWall(
        base.triSeg.leftFreeWall,
        vector.ventricularActiveScale,
        vector.ventricularPassiveTangentScale,
      ),
      septum: mapVentricularWall(
        base.triSeg.septum,
        vector.ventricularActiveScale,
        vector.ventricularPassiveTangentScale,
      ),
      rightFreeWall: mapVentricularWall(
        base.triSeg.rightFreeWall,
        vector.ventricularActiveScale,
        vector.ventricularPassiveTangentScale,
      ),
    }),
    vascular: Object.freeze({
      ...base.vascular,
      pulmonaryVein: Object.freeze({
        ...base.vascular.pulmonaryVein,
        complianceMlPerMmHg:
          base.vascular.pulmonaryVein.complianceMlPerMmHg *
          vector.pulmonaryVeinComplianceScale,
      }),
      pulmonaryVenousSegment: Object.freeze({
        resistanceMmHgSecPerMl:
          base.vascular.pulmonaryVenousSegment.resistanceMmHgSecPerMl *
          vector.pulmonaryVenousResistanceScale,
        inertanceMmHgSec2PerMl:
          base.vascular.pulmonaryVenousSegment.inertanceMmHgSec2PerMl *
          vector.pulmonaryVenousInertanceScale,
      }),
      systemicResistanceMmHgSecPerMl:
        base.vascular.systemicResistanceMmHgSecPerMl *
        vector.systemicResistanceScale,
    }),
    valves: Object.freeze({ ...base.valves, mitral: Object.freeze(mitral) }),
  });
}

function mapAtrialWall(
  base: NoAvpdFivePatchLandWallParamsV1,
  activeScale: number,
): NoAvpdFivePatchLandWallParamsV1 {
  return Object.freeze({
    ...base,
    material: Object.freeze({
      ...base.material,
      activeHomogenizationScale:
        base.material.activeHomogenizationScale * activeScale,
    }),
  });
}

function mapVentricularWall(
  base: NoAvpdTriSegWallParamsV1,
  activeScale: number,
  passiveTangentScale: number,
): NoAvpdTriSegWallParamsV1 {
  return Object.freeze({
    ...base,
    material: Object.freeze({
      ...base.material,
      activeHomogenizationScale:
        base.material.activeHomogenizationScale * activeScale,
      passiveSls: Object.freeze({
        ...base.material.passiveSls,
        passive: Object.freeze({
          ...base.material.passiveSls.passive,
          tangentModulusPa:
            base.material.passiveSls.passive.tangentModulusPa *
            passiveTangentScale,
        }),
        // Keep the one-state SLS parameter pack fixed. In particular, its
        // modulus is not rescaled with the equilibrium passive tangent.
        sls: base.material.passiveSls.sls,
      }),
    }),
  });
}

function applyCalciumAndAvDelay(
  base: NoAvpdFivePatchLandTriSegParamsV1,
  vector: FivePatchPhysiologyEnvelopeParameterVectorV2,
): NoAvpdFivePatchLandTriSegParamsV1["calciumDrivers"] {
  const cycleLengthSec = base.cycleLengthSec;
  const targetLaOnsetSec = wrapSec(
    base.calciumDrivers.leftFreeWall.eventOnsetSec - vector.avDelaySec,
    cycleLengthSec,
  );
  const atrialShiftSec = signedCycleDifferenceSec(
    targetLaOnsetSec,
    base.calciumDrivers.leftAtrium.eventOnsetSec,
    cycleLengthSec,
  );
  return Object.freeze({
    leftAtrium: mapCalciumDriver(
      base.calciumDrivers.leftAtrium,
      vector.atrialCalciumDecayScale,
      atrialShiftSec,
    ),
    rightAtrium: mapCalciumDriver(
      base.calciumDrivers.rightAtrium,
      vector.atrialCalciumDecayScale,
      atrialShiftSec,
    ),
    leftFreeWall: mapCalciumDriver(
      base.calciumDrivers.leftFreeWall,
      vector.ventricularCalciumDecayScale,
      0,
    ),
    septum: mapCalciumDriver(
      base.calciumDrivers.septum,
      vector.ventricularCalciumDecayScale,
      0,
    ),
    rightFreeWall: mapCalciumDriver(
      base.calciumDrivers.rightFreeWall,
      vector.ventricularCalciumDecayScale,
      0,
    ),
  });
}

function rephaseCalciumDriversAtCycleLength(
  params: NoAvpdFivePatchLandTriSegParamsV1,
  cycleLengthSec: number,
  avDelaySec: number,
): NoAvpdFivePatchLandTriSegParamsV1["calciumDrivers"] {
  const previousCycleLengthSec = params.cycleLengthSec;
  const previous = params.calciumDrivers;
  const leftVentricularOnsetSec = wrapSec(
    previous.leftFreeWall.eventOnsetSec,
    cycleLengthSec,
  );
  const leftAtrialOnsetSec = wrapSec(
    leftVentricularOnsetSec - avDelaySec,
    cycleLengthSec,
  );
  const rightAtrialOffsetSec = signedCycleDifferenceSec(
    previous.rightAtrium.eventOnsetSec,
    previous.leftAtrium.eventOnsetSec,
    previousCycleLengthSec,
  );
  const septalOffsetSec = signedCycleDifferenceSec(
    previous.septum.eventOnsetSec,
    previous.leftFreeWall.eventOnsetSec,
    previousCycleLengthSec,
  );
  const rightVentricularOffsetSec = signedCycleDifferenceSec(
    previous.rightFreeWall.eventOnsetSec,
    previous.leftFreeWall.eventOnsetSec,
    previousCycleLengthSec,
  );
  return Object.freeze({
    leftAtrium: withCycleAndOnset(
      previous.leftAtrium,
      cycleLengthSec,
      leftAtrialOnsetSec,
    ),
    rightAtrium: withCycleAndOnset(
      previous.rightAtrium,
      cycleLengthSec,
      wrapSec(leftAtrialOnsetSec + rightAtrialOffsetSec, cycleLengthSec),
    ),
    leftFreeWall: withCycleAndOnset(
      previous.leftFreeWall,
      cycleLengthSec,
      leftVentricularOnsetSec,
    ),
    septum: withCycleAndOnset(
      previous.septum,
      cycleLengthSec,
      wrapSec(leftVentricularOnsetSec + septalOffsetSec, cycleLengthSec),
    ),
    rightFreeWall: withCycleAndOnset(
      previous.rightFreeWall,
      cycleLengthSec,
      wrapSec(
        leftVentricularOnsetSec + rightVentricularOffsetSec,
        cycleLengthSec,
      ),
    ),
  });
}

function withCycleAndOnset(
  driver: PeriodicPrescribedCalciumDriverParamsV2,
  cycleLengthSec: number,
  eventOnsetSec: number,
): PeriodicPrescribedCalciumDriverParamsV2 {
  return Object.freeze({ ...driver, cycleLengthSec, eventOnsetSec });
}

function mapCalciumDriver(
  base: PeriodicPrescribedCalciumDriverParamsV2,
  decayScale: number,
  onsetShiftSec: number,
): PeriodicPrescribedCalciumDriverParamsV2 {
  return Object.freeze({
    ...base,
    eventOnsetSec: wrapSec(
      base.eventOnsetSec + onsetShiftSec,
      base.cycleLengthSec,
    ),
    calcium: Object.freeze({
      ...base.calcium,
      rateTargets: Object.freeze(base.calcium.rateTargets.map((target) =>
        Object.freeze({
          ...target,
          // Amplitude is deliberately fixed in V2. Only the decay half-time
          // is an envelope axis.
          decayHalfTimeSec: target.decayHalfTimeSec * decayScale,
        })
      )),
    }),
  });
}

function commonCalciumDecayScale(
  params: NoAvpdFivePatchLandTriSegParamsV1,
  base: NoAvpdFivePatchLandTriSegParamsV1,
  wallIds: readonly (keyof NoAvpdFivePatchLandTriSegParamsV1["calciumDrivers"])[],
  label: string,
): number {
  return commonRatio(wallIds.flatMap((wallId) => {
    const currentTargets = params.calciumDrivers[wallId].calcium.rateTargets;
    const baseTargets = base.calciumDrivers[wallId].calcium.rateTargets;
    if (currentTargets.length !== baseTargets.length) {
      throw new Error(`${label} target count changed for ${wallId}`);
    }
    return currentTargets.map((target, index) =>
      ratio(target.decayHalfTimeSec, baseTargets[index]!.decayHalfTimeSec)
    );
  }), label);
}

function passiveTangentRatio(
  material: LandActivePassiveSlsParamsV1,
  base: LandActivePassiveSlsParamsV1,
): number {
  return ratio(
    material.passiveSls.passive.tangentModulusPa,
    base.passiveSls.passive.tangentModulusPa,
  );
}

function coupledMitralScale(
  params: NoAvpdFivePatchLandTriSegParamsV1,
  base: NoAvpdFivePatchLandTriSegParamsV1,
): number {
  const current = params.valves.mitral;
  const baseline = base.valves.mitral;
  const scale = commonRatio([
    ratio(current.openAreaCm2, baseline.openAreaCm2),
    ratio(current.leakAreaCm2, baseline.leakAreaCm2),
    Math.sqrt(ratio(
      baseline.openResistanceMmHgSecPerMl,
      current.openResistanceMmHgSecPerMl,
    )),
    ratio(
      baseline.openInertanceMmHgSec2PerMl,
      current.openInertanceMmHgSec2PerMl,
    ),
    Math.sqrt(ratio(
      baseline.openBernoulliMmHgSec2PerMl2,
      current.openBernoulliMmHgSec2PerMl2,
    )),
  ], "coupled mitral hydraulic scale");
  return scale;
}

function validateVector(
  vector: FivePatchPhysiologyEnvelopeParameterVectorV2,
): void {
  for (const [key, value] of Object.entries(vector)) {
    requirePositiveFinite(value, key);
  }
  const cycleLengthSec = referenceParams().cycleLengthSec;
  if (vector.avDelaySec >= cycleLengthSec) {
    throw new Error("avDelaySec must be shorter than the cardiac cycle");
  }
}

function validateScenario(
  scenario: FivePatchPhysiologyEnvelopeScenarioV2,
): void {
  requirePositiveFinite(scenario.heartRateBpm, "scenario.heartRateBpm");
  requirePositiveFinite(
    scenario.bloodVolumeScale,
    "scenario.bloodVolumeScale",
  );
  requirePositiveFinite(
    scenario.systemicResistanceScale,
    "scenario.systemicResistanceScale",
  );
  requirePositiveFinite(
    scenario.pulmonaryResistanceScale,
    "scenario.pulmonaryResistanceScale",
  );
}

function requirePositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be positive and finite`);
  }
}

function ratio(value: number, baseline: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(baseline) || baseline <= 0) {
    throw new Error("effective-axis ratio requires finite positive values");
  }
  return value / baseline;
}

function commonRatio(values: readonly number[], label: string): number {
  if (values.length === 0) throw new Error(`${label} has no owners`);
  const first = values[0]!;
  const tolerance = 1e-11 * Math.max(1, Math.abs(first));
  if (values.some((value) => Math.abs(value - first) > tolerance)) {
    throw new Error(`${label} is not shared consistently across its owners`);
  }
  return first;
}

function forwardCycleDeltaSec(
  fromSec: number,
  toSec: number,
  cycleLengthSec: number,
): number {
  return wrapSec(toSec - fromSec, cycleLengthSec);
}

function signedCycleDifferenceSec(
  targetSec: number,
  sourceSec: number,
  cycleLengthSec: number,
): number {
  const forward = wrapSec(targetSec - sourceSec, cycleLengthSec);
  return forward > cycleLengthSec / 2 ? forward - cycleLengthSec : forward;
}

function wrapSec(valueSec: number, cycleLengthSec: number): number {
  const wrapped = valueSec % cycleLengthSec;
  return wrapped < 0 ? wrapped + cycleLengthSec : wrapped;
}

let cachedReferenceParams: NoAvpdFivePatchLandTriSegParamsV1 | null = null;
let cachedReferenceInitialVolumes: NoAvpdBloodVolumesV1 | null = null;

function referenceParams(): NoAvpdFivePatchLandTriSegParamsV1 {
  cachedReferenceParams ??=
    createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch");
  return cachedReferenceParams;
}

function referenceInitialVolumes(): NoAvpdBloodVolumesV1 {
  if (cachedReferenceInitialVolumes == null) {
    cachedReferenceInitialVolumes = Object.freeze({
      ...initialNoAvpdFivePatchLandTriSegStateV1(referenceParams()).volumes,
    });
  }
  return cachedReferenceInitialVolumes;
}

function referenceTotalBloodVolumeMl(): number {
  return totalBloodVolumeMl(referenceInitialVolumes());
}
