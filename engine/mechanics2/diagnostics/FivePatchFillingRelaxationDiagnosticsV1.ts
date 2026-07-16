import {
  summarizeFivePatchRawCycleDiagnosticsV1,
  type FivePatchRawCycleDiagnosticSampleV1,
} from "@/engine/mechanics2/diagnostics/FivePatchRawCycleDiagnosticsV1";

export const FIVE_PATCH_FILLING_RELAXATION_DIAGNOSTICS_ID_V1 =
  "five-patch-filling-relaxation-diagnostics-v1" as const;

/**
 * Eligibility is deliberately narrower than the available readback.  In
 * particular, neither detailed filling morphology nor an LA V-loop metric may
 * promote, reject, rank, or select a candidate.
 */
export const FIVE_PATCH_FILLING_RELAXATION_GATE_POLICY_V1 = Object.freeze({
  eligibilityInputs: Object.freeze([
    "numerical",
    "broad-operating-point",
  ] as const),
  reportOnlyExcludedFromEligibility: Object.freeze([
    "detailed-physiology",
    "left-atrial-v-loop",
  ] as const),
  scalarWinnerScoreAllowed: false as const,
});

type OptionalPressureReadbackV1 = {
  readonly systemicArteryMmHg?: number;
  readonly systemicVeinMmHg?: number;
  readonly rightAtriumMmHg?: number;
  readonly rightVentricleMmHg?: number;
  readonly pulmonaryArteryMmHg?: number;
  readonly pulmonaryVeinMmHg?: number;
};

type OptionalVolumeReadbackV1 = {
  readonly systemicArteryMl?: number;
  readonly systemicVeinMl?: number;
  readonly pulmonaryArteryMl?: number;
  readonly pulmonaryVeinMl?: number;
};

type OptionalFlowReadbackV1 = {
  readonly aorticMlPerSec?: number;
  readonly systemicPeripheralMlPerSec?: number;
  readonly systemicVenousMlPerSec?: number;
  readonly tricuspidMlPerSec?: number;
  readonly pulmonaryValveMlPerSec?: number;
  readonly pulmonaryPeripheralMlPerSec?: number;
  readonly pulmonaryVenousMlPerSec?: number;
};

/**
 * Structural extension of the existing generic raw-cycle contract.
 *
 * Five-patch bench samples satisfy this type directly.  Optional velocity
 * channels allow a true Doppler-like VTI when a future bench owns one; volume
 * flow is never silently relabelled as velocity.
 */
export type FivePatchFillingRelaxationDiagnosticSampleV1 = Omit<
  FivePatchRawCycleDiagnosticSampleV1,
  "volumesMl" | "pressuresMmHg" | "flowsMlPerSec"
> & {
  readonly volumesMl:
    FivePatchRawCycleDiagnosticSampleV1["volumesMl"] &
    OptionalVolumeReadbackV1;
  readonly pressuresMmHg:
    FivePatchRawCycleDiagnosticSampleV1["pressuresMmHg"] &
    OptionalPressureReadbackV1;
  readonly flowsMlPerSec:
    FivePatchRawCycleDiagnosticSampleV1["flowsMlPerSec"] &
    OptionalFlowReadbackV1;
  readonly velocitiesCmPerSec?: {
    readonly mitral?: number;
    readonly pulmonaryVenous?: number;
  };
};

export type FivePatchBroadOperatingPointBoundsV1 = {
  readonly leftAtrialPressureMmHg: NumericRangeV1;
  readonly leftVentricularPeakPressureMmHg: NumericRangeV1;
  readonly aorticPressureMmHg: NumericRangeV1;
  readonly cardiacOutputLPerMin: NumericRangeV1;
  readonly leftVentricularEjectionFraction: NumericRangeV1;
  readonly pulmonaryVeinPressureMmHg: NumericRangeV1;
  readonly valveReverseFlow: {
    readonly valveIds: readonly ("MV" | "AoV" | "TV" | "PV")[];
    readonly maximumReverseVolumeMl: {
      readonly absoluteFloorMl: number;
      readonly forwardVolumeFraction: number;
    };
  };
};

export type FivePatchFillingRelaxationDiagnosticsOptionsV1 = {
  readonly periodicityEstablished: boolean;
  /** Caller-owned structural/numerical verdict; this module does not rerun it. */
  readonly numericalEligibility: {
    readonly eligible: boolean;
    readonly source: string;
    readonly failedChecks?: readonly string[];
  };
  /** Thresholds are protocol-owned and must be supplied explicitly. */
  readonly broadOperatingPointBounds: FivePatchBroadOperatingPointBoundsV1;
};

type NumericRangeV1 = {
  readonly minimum: number;
  readonly maximum: number;
};

type CyclePointV1 = {
  readonly phase: number;
  readonly sample: FivePatchFillingRelaxationDiagnosticSampleV1;
};

type PathPointV1 = {
  readonly phase: number;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
};

type PressureFitV1 = {
  readonly availability:
    | "available"
    | "insufficient-positive-points"
    | "nondecaying-fit"
    | "degenerate-time-grid";
  readonly validity:
    | "valid"
    | "insufficient-points"
    | "nondecaying"
    | "low-log-pressure-r-squared"
    | "asymptote-search-boundary-hit";
  readonly tauSec: number | null;
  readonly asymptoteMmHg: number;
  readonly amplitudeMmHg: number | null;
  readonly rSquaredLogPressure: number | null;
  readonly pointCount: number;
};

export type FivePatchFillingRelaxationDiagnosticsV1 = ReturnType<
  typeof summarizeFivePatchFillingRelaxationDiagnosticsV1
>;

/**
 * Pure diagnostics from one raw cycle with caller-owned steady-state status.
 *
 * This function applies no smoothing, physiology fit, reference-shape fit, or
 * candidate score.  The only eligibility inputs are the caller's numerical
 * verdict and protocol-owned broad operating-point bounds.
 */
export function summarizeFivePatchFillingRelaxationDiagnosticsV1(
  samples: readonly FivePatchFillingRelaxationDiagnosticSampleV1[],
  leftAtrialCalciumOnsetPhase01: number,
  options: FivePatchFillingRelaxationDiagnosticsOptionsV1,
) {
  const raw = summarizeFivePatchRawCycleDiagnosticsV1(
    samples,
    leftAtrialCalciumOnsetPhase01,
    { periodicityEstablished: options.periodicityEstablished },
  );
  const cycleValidation = validateOperatingPointCycle(samples);
  const numerical = Object.freeze({
    eligible: options.numericalEligibility.eligible,
    callerEligible: options.numericalEligibility.eligible,
    callerSource: options.numericalEligibility.source,
    callerFailedChecks: Object.freeze([
      ...(options.numericalEligibility.failedChecks ?? []),
    ]),
    operatingPointCycleAvailable: cycleValidation.valid,
    operatingPointCycleUnavailableReason:
      cycleValidation.valid === true ? null : cycleValidation.reason,
    eventAnchoredRawCycleAvailable: raw.availability === "available",
    periodicityEstablished: options.periodicityEstablished,
    periodicityInterpretation:
      "report-only-readback-caller-numerical-verdict-owns-phase-aware-periodicity-gate" as const,
  });
  const base = {
    diagnosticsId: FIVE_PATCH_FILLING_RELAXATION_DIAGNOSTICS_ID_V1,
    gatePolicy: FIVE_PATCH_FILLING_RELAXATION_GATE_POLICY_V1,
    sourceTreatment:
      "one-raw-cycle-caller-owned-periodicity-no-smoothing-no-reference-shape-fitting" as const,
    numericalEligibility: numerical,
    rawCycleDiagnostics: raw,
  };
  if (cycleValidation.valid === false) {
    return Object.freeze({
      ...base,
      availability: "unavailable-operating-point-cycle" as const,
      broadOperatingPointEligibility: unavailableOperatingPoint(
        cycleValidation.reason,
      ),
      eligibility: Object.freeze({
        eligible: false,
        inputs: FIVE_PATCH_FILLING_RELAXATION_GATE_POLICY_V1.eligibilityInputs,
        detailedPhysiologyUsed: false as const,
        leftAtrialVLoopUsed: false as const,
      }),
      operatingPoint: null,
      detailedPhysiologyUnavailableReason:
        "operating-point-cycle-unavailable" as const,
      detailedPhysiologyReportOnly: null,
      leftAtrialVLoopReportOnly: Object.freeze({
        affectsEligibility: false as const,
        rawLobeMeasurement: raw.leftAtrialPvLobes,
        strictMatchedVolume: null,
      }),
    });
  }

  const cycle = cycleValidation.cycle;
  const cycleLengthSec = cycleValidation.cycleLengthSec;
  const operatingPoint = summarizeOperatingPoint(cycle, cycleLengthSec);
  const broadOperatingPointEligibility = evaluateBroadOperatingPoint(
    operatingPoint,
    options.broadOperatingPointBounds,
  );
  const eligibility = Object.freeze({
    eligible: numerical.eligible && broadOperatingPointEligibility.eligible,
    inputs: FIVE_PATCH_FILLING_RELAXATION_GATE_POLICY_V1.eligibilityInputs,
    detailedPhysiologyUsed: false as const,
    leftAtrialVLoopUsed: false as const,
  });
  if (!options.periodicityEstablished) {
    return Object.freeze({
      ...base,
      availability: "available-operating-point-only" as const,
      broadOperatingPointEligibility,
      eligibility,
      operatingPoint,
      detailedPhysiologyUnavailableReason:
        "caller-reports-periodicity-not-established" as const,
      detailedPhysiologyReportOnly: null,
      leftAtrialVLoopReportOnly: Object.freeze({
        affectsEligibility: false as const,
        rawLobeMeasurement: raw.leftAtrialPvLobes,
        strictMatchedVolume: null,
      }),
    });
  }
  if (raw.availability !== "available" || raw.events == null) {
    return Object.freeze({
      ...base,
      availability: "available-operating-point-only" as const,
      broadOperatingPointEligibility,
      eligibility,
      operatingPoint,
      detailedPhysiologyUnavailableReason:
        "event-anchors-unavailable" as const,
      detailedPhysiologyReportOnly: null,
      leftAtrialVLoopReportOnly: Object.freeze({
        affectsEligibility: false as const,
        rawLobeMeasurement: raw.leftAtrialPvLobes,
        strictMatchedVolume: null,
      }),
    });
  }

  const activation = normalizePhase(leftAtrialCalciumOnsetPhase01);
  const mvo = unwrapBefore(
    raw.events.mitralOpeningGradientUpCrossingProxyPhase01,
    activation,
  );
  const mvc = unwrapAfter(
    raw.events.mitralClosureGradientDownCrossingProxyPhase01,
    activation,
  );
  const laPhasicVolumes = summarizeLaPhasicVolumes(
    cycle,
    mvo,
    activation,
    mvc,
  );
  const mitral = summarizeMitral(
    cycle,
    raw.mitralInflow,
    mvo,
    mvc,
    cycleLengthSec,
  );
  const pulmonaryVenous = summarizePulmonaryVenous(
    cycle,
    mvo,
    activation,
    mvc,
    cycleLengthSec,
  );
  const lvRelaxation = summarizeLvRelaxation(
    cycle,
    mvo,
    cycleLengthSec,
  );
  const strictMatchedVolume = summarizeStrictMatchedVolume(
    cycle,
    mvc - 1,
    mvo,
    activation,
    options.periodicityEstablished,
  );
  return Object.freeze({
    ...base,
    availability: "available" as const,
    broadOperatingPointEligibility,
    eligibility,
    operatingPoint,
    detailedPhysiologyUnavailableReason: null,
    detailedPhysiologyReportOnly: Object.freeze({
      affectsEligibility: false as const,
      mitral,
      pulmonaryVenous,
      leftAtrialPhasicVolumes: laPhasicVolumes,
      lvRelaxation,
    }),
    leftAtrialVLoopReportOnly: Object.freeze({
      affectsEligibility: false as const,
      rawLobeMeasurement: raw.leftAtrialPvLobes,
      strictMatchedVolume,
    }),
  });
}

function summarizeOperatingPoint(
  cycle: readonly CyclePointV1[],
  cycleLengthSec: number,
) {
  const pressure = {
    leftAtrium: scalarSummary(cycle, (point) =>
      point.sample.pressuresMmHg.leftAtriumMmHg),
    leftVentricle: scalarSummary(cycle, (point) =>
      point.sample.pressuresMmHg.leftVentricleMmHg),
    systemicArtery: optionalScalarSummary(cycle, (point) =>
      point.sample.pressuresMmHg.systemicArteryMmHg),
    systemicVein: optionalScalarSummary(cycle, (point) =>
      point.sample.pressuresMmHg.systemicVeinMmHg),
    rightAtrium: optionalScalarSummary(cycle, (point) =>
      point.sample.pressuresMmHg.rightAtriumMmHg),
    rightVentricle: optionalScalarSummary(cycle, (point) =>
      point.sample.pressuresMmHg.rightVentricleMmHg),
    pulmonaryArtery: optionalScalarSummary(cycle, (point) =>
      point.sample.pressuresMmHg.pulmonaryArteryMmHg),
    pulmonaryVein: optionalScalarSummary(cycle, (point) =>
      point.sample.pressuresMmHg.pulmonaryVeinMmHg),
  };
  const volume = {
    leftAtrium: scalarRange(cycle, (point) =>
      point.sample.volumesMl.leftAtriumMl),
    leftVentricle: scalarRange(cycle, (point) =>
      point.sample.volumesMl.leftVentricleMl),
    rightAtrium: scalarRange(cycle, (point) =>
      point.sample.volumesMl.rightAtriumMl),
    rightVentricle: scalarRange(cycle, (point) =>
      point.sample.volumesMl.rightVentricleMl),
    systemicArtery: optionalScalarRange(cycle, (point) =>
      point.sample.volumesMl.systemicArteryMl),
    systemicVein: optionalScalarRange(cycle, (point) =>
      point.sample.volumesMl.systemicVeinMl),
    pulmonaryArtery: optionalScalarRange(cycle, (point) =>
      point.sample.volumesMl.pulmonaryArteryMl),
    pulmonaryVein: optionalScalarRange(cycle, (point) =>
      point.sample.volumesMl.pulmonaryVeinMl),
  };
  const lvEdv = volume.leftVentricle.maximum;
  const lvEsv = volume.leftVentricle.minimum;
  const lvSv = lvEdv - lvEsv;
  const lvEf = lvEdv > 0 ? lvSv / lvEdv : null;
  const valveFlow = Object.freeze({
    MV: flowCycleSummary(cycle, cycleLengthSec, (point) =>
      point.sample.flowsMlPerSec.mitralMlPerSec),
    AoV: optionalFlowCycleSummary(cycle, cycleLengthSec, (point) =>
      point.sample.flowsMlPerSec.aorticMlPerSec),
    TV: optionalFlowCycleSummary(cycle, cycleLengthSec, (point) =>
      point.sample.flowsMlPerSec.tricuspidMlPerSec),
    PV: optionalFlowCycleSummary(cycle, cycleLengthSec, (point) =>
      point.sample.flowsMlPerSec.pulmonaryValveMlPerSec),
  });
  const aorticNetVolumeMl = valveFlow.AoV?.netVolumeMl ?? null;
  const cardiacOutputLPerMin =
    aorticNetVolumeMl == null
      ? null
      : (aorticNetVolumeMl * 60) / (cycleLengthSec * 1_000);
  return Object.freeze({
    evidenceStatus:
      "broad-operating-point-raw-cycle-readback-not-normal-human-calibration" as const,
    cycleLengthSec,
    heartRateBpm: 60 / cycleLengthSec,
    pressureMmHg: Object.freeze(pressure),
    volumeMl: Object.freeze(volume),
    leftVentricle: Object.freeze({
      endDiastolicVolumeProxyMl: lvEdv,
      endSystolicVolumeProxyMl: lvEsv,
      strokeVolumeProxyMl: lvSv,
      ejectionFractionProxy01: lvEf,
      eventBoundary:
        "cycle-maximum-and-minimum-volume-proxies-not-valve-event-edv-esv" as const,
    }),
    cardiacOutputLPerMin,
    cardiacOutputMethod:
      "integrated-net-aortic-volume-per-cycle" as const,
    valveFlow,
  });
}

function evaluateBroadOperatingPoint(
  operatingPoint: ReturnType<typeof summarizeOperatingPoint>,
  bounds: FivePatchBroadOperatingPointBoundsV1,
) {
  const checks: Array<{
    readonly id: string;
    readonly eligible: boolean;
    readonly observed: number | readonly [number, number] | null;
    readonly boundsOrLimit: NumericRangeV1 | number;
  }> = [];
  const rangeCheck = (
    id: string,
    observed: { readonly minimum: number; readonly maximum: number } | null,
    expected: NumericRangeV1,
  ) => checks.push({
    id,
    eligible:
      observed != null &&
      observed.minimum >= expected.minimum &&
      observed.maximum <= expected.maximum,
    observed: observed == null
      ? null
      : [observed.minimum, observed.maximum] as const,
    boundsOrLimit: expected,
  });
  const scalarCheck = (
    id: string,
    observed: number | null,
    expected: NumericRangeV1,
  ) => checks.push({
    id,
    eligible:
      observed != null &&
      observed >= expected.minimum &&
      observed <= expected.maximum,
    observed,
    boundsOrLimit: expected,
  });
  rangeCheck(
    "left-atrial-pressure-range",
    operatingPoint.pressureMmHg.leftAtrium,
    bounds.leftAtrialPressureMmHg,
  );
  scalarCheck(
    "left-ventricular-peak-pressure",
    operatingPoint.pressureMmHg.leftVentricle.maximum,
    bounds.leftVentricularPeakPressureMmHg,
  );
  rangeCheck(
    "aortic-pressure-range",
    operatingPoint.pressureMmHg.systemicArtery,
    bounds.aorticPressureMmHg,
  );
  scalarCheck(
    "cardiac-output",
    operatingPoint.cardiacOutputLPerMin,
    bounds.cardiacOutputLPerMin,
  );
  scalarCheck(
    "left-ventricular-ejection-fraction",
    operatingPoint.leftVentricle.ejectionFractionProxy01,
    bounds.leftVentricularEjectionFraction,
  );
  rangeCheck(
    "pulmonary-vein-pressure-range",
    operatingPoint.pressureMmHg.pulmonaryVein,
    bounds.pulmonaryVeinPressureMmHg,
  );
  for (const valveId of bounds.valveReverseFlow.valveIds) {
    const flow = operatingPoint.valveFlow[valveId];
    const limit = flow == null
      ? Number.NaN
      : Math.max(
          bounds.valveReverseFlow.maximumReverseVolumeMl.absoluteFloorMl,
          bounds.valveReverseFlow.maximumReverseVolumeMl.forwardVolumeFraction *
            flow.forwardVolumeMl,
        );
    checks.push({
      id: `${valveId}-reverse-volume`,
      eligible: flow != null && flow.reverseVolumeMl <= limit,
      observed: flow?.reverseVolumeMl ?? null,
      boundsOrLimit: limit,
    });
  }
  return Object.freeze({
    applied: true as const,
    role: "broad-plausibility-screen-not-detailed-physiology" as const,
    eligible: checks.every((check) => check.eligible),
    checks: Object.freeze(checks),
    reverseFlowDutyAffectsEligibility: false as const,
    detailedPhysiologyAffectsEligibility: false as const,
    leftAtrialVLoopAffectsEligibility: false as const,
  });
}

function unavailableOperatingPoint(reason: string) {
  return Object.freeze({
    applied: false as const,
    role: "broad-plausibility-screen-not-detailed-physiology" as const,
    eligible: false,
    unavailableReason: reason,
    checks: Object.freeze([]),
    reverseFlowDutyAffectsEligibility: false as const,
    detailedPhysiologyAffectsEligibility: false as const,
    leftAtrialVLoopAffectsEligibility: false as const,
  });
}

function summarizeLaPhasicVolumes(
  cycle: readonly CyclePointV1[],
  mvo: number,
  activation: number,
  mvc: number,
) {
  const vMvo = interpolate(cycle, mvo, (point) =>
    point.sample.volumesMl.leftAtriumMl);
  const vActivation = interpolate(cycle, activation, (point) =>
    point.sample.volumesMl.leftAtriumMl);
  const vMvc = interpolate(cycle, mvc, (point) =>
    point.sample.volumesMl.leftAtriumMl);
  const vPriorMvc = interpolate(cycle, mvc - 1, (point) =>
    point.sample.volumesMl.leftAtriumMl);
  if ([vMvo, vActivation, vMvc, vPriorMvc].some((value) => value == null)) {
    return Object.freeze({
      availability: "unavailable-anchor-interpolation" as const,
      reservoirFillingMl: null,
      conduitEmptyingMl: null,
      pumpEmptyingMl: null,
    });
  }
  return Object.freeze({
    availability: "available" as const,
    definition:
      "gradient-MVC-to-MVO-reservoir-MVO-to-Ca-conduit-Ca-to-MVC-pump" as const,
    anchorVolumesMl: Object.freeze({
      priorMvc: vPriorMvc!,
      mvo: vMvo!,
      calciumOnset: vActivation!,
      mvc: vMvc!,
    }),
    reservoirFillingMl: vMvo! - vPriorMvc!,
    conduitEmptyingMl: vMvo! - vActivation!,
    pumpEmptyingMl: vActivation! - vMvc!,
    conduitFractionOfTotalEmptying: safeRatio(
      vMvo! - vActivation!,
      vMvo! - vMvc!,
    ),
    pumpFractionOfTotalEmptying: safeRatio(
      vActivation! - vMvc!,
      vMvo! - vMvc!,
    ),
    periodicClosureResidualMl: vMvc! - vPriorMvc!,
  });
}

function summarizeMitral(
  cycle: readonly CyclePointV1[],
  inflow: NonNullable<
    ReturnType<typeof summarizeFivePatchRawCycleDiagnosticsV1>["mitralInflow"]
  >,
  mvo: number,
  mvc: number,
  cycleLengthSec: number,
) {
  const positiveFlowIntegralMl = integrateWindowPositive(
    cycle,
    mvo,
    mvc,
    cycleLengthSec,
    (point) => point.sample.flowsMlPerSec.mitralMlPerSec,
  );
  const velocityAvailable = cycle.every((point) =>
    Number.isFinite(point.sample.velocitiesCmPerSec?.mitral));
  const velocityTimeIntegralCm = velocityAvailable
    ? integrateWindowPositive(
        cycle,
        mvo,
        mvc,
        cycleLengthSec,
        (point) => point.sample.velocitiesCmPerSec!.mitral!,
      )
    : null;
  const ePeakToValleySec =
    inflow.ePeak == null || inflow.interpeakMinimum == null
      ? null
      : (inflow.interpeakMinimum.phase - inflow.ePeak.phase) * cycleLengthSec;
  return Object.freeze({
    evidenceStatus: "report-only-raw-flow-morphology" as const,
    ePeakMlPerSec: inflow.ePeak?.flowMlPerSec ?? null,
    aPeakMlPerSec: inflow.aPeak?.flowMlPerSec ?? null,
    eToA: inflow.eToAPeakRatio,
    interpeakValleyMlPerSec: inflow.interpeakMinimum?.flowMlPerSec ?? null,
    valleyOverE: safeRatio(
      inflow.interpeakMinimum?.flowMlPerSec ?? null,
      inflow.ePeak?.flowMlPerSec ?? null,
    ),
    valleyOverA: safeRatio(
      inflow.interpeakMinimum?.flowMlPerSec ?? null,
      inflow.aPeak?.flowMlPerSec ?? null,
    ),
    ePeakToInterpeakValleySec: ePeakToValleySec,
    eDecelerationSlopeProxyMlPerSec2:
      ePeakToValleySec == null ||
          !(ePeakToValleySec > 0) ||
          inflow.ePeak == null ||
          inflow.interpeakMinimum == null
        ? null
        : (inflow.ePeak.flowMlPerSec -
            inflow.interpeakMinimum.flowMlPerSec) / ePeakToValleySec,
    positiveFlowTimeIntegralMl: positiveFlowIntegralMl,
    velocityTimeIntegral: Object.freeze({
      availability: velocityAvailable
        ? ("available-velocity-channel" as const)
        : ("unavailable-flow-is-not-velocity" as const),
      valueCm: velocityTimeIntegralCm,
    }),
  });
}

function summarizePulmonaryVenous(
  cycle: readonly CyclePointV1[],
  mvo: number,
  activation: number,
  mvc: number,
  cycleLengthSec: number,
) {
  const available = cycle.every((point) =>
    Number.isFinite(point.sample.flowsMlPerSec.pulmonaryVenousMlPerSec));
  if (!available) {
    return Object.freeze({
      availability: "unavailable-no-pulmonary-venous-flow-channel" as const,
      interpretationBoundary:
        "total-volume-flow-is-not-pulsed-wave-doppler-velocity" as const,
      sPeakMlPerSec: null,
      dPeakMlPerSec: null,
      arPeakMlPerSec: null,
      sToD: null,
    });
  }
  const selector = (point: CyclePointV1) =>
    point.sample.flowsMlPerSec.pulmonaryVenousMlPerSec!;
  const sPeak = maximumInWindow(cycle, mvc - 1, mvo, selector);
  const dPeak = maximumInWindow(cycle, mvo, activation, selector);
  const arPeak = minimumInWindow(cycle, activation, mvc, selector);
  return Object.freeze({
    availability: "available-total-pulmonary-venous-flow" as const,
    evidenceStatus: "report-only-flow-wave-proxy" as const,
    interpretationBoundary:
      "total-volume-flow-S-D-Ar-proxies-are-not-doppler-velocity" as const,
    sPeakMlPerSec: sPeak,
    dPeakMlPerSec: dPeak,
    arPeakMlPerSec: arPeak != null && arPeak < 0 ? arPeak : null,
    sToD: safeRatio(sPeak, dPeak),
    reservoirWindowNetVolumeMl: integrateWindow(
      cycle,
      mvc - 1,
      mvo,
      cycleLengthSec,
      selector,
    ),
    conduitWindowNetVolumeMl: integrateWindow(
      cycle,
      mvo,
      activation,
      cycleLengthSec,
      selector,
    ),
    atrialSystoleReverseVolumeMl: integrateWindowNegativeMagnitude(
      cycle,
      activation,
      mvc,
      cycleLengthSec,
      selector,
    ),
  });
}

function summarizeLvRelaxation(
  cycle: readonly CyclePointV1[],
  mvo: number,
  cycleLengthSec: number,
) {
  const window = windowPoints(cycle, mvo - 1, mvo);
  const peakIndex = indexOfMaximum(window, (point) =>
    point.sample.pressuresMmHg.leftVentricleMmHg);
  if (peakIndex < 0 || peakIndex >= window.length - 2) {
    return Object.freeze({
      availability: "unavailable-no-pre-mvo-pressure-fall" as const,
      fitWindow: null,
      zeroAsymptoteFit: null,
      freeAsymptoteFit: null,
      preferredTauSec: null,
      preferredFitValidity: "unavailable" as const,
    });
  }
  let negativeDpDtIndex = -1;
  let negativeDpDt = Number.POSITIVE_INFINITY;
  for (let index = peakIndex + 1; index < window.length - 1; index += 1) {
    const left = window[index - 1]!;
    const right = window[index + 1]!;
    const dt = (right.phase - left.phase) * cycleLengthSec;
    if (!(dt > 0)) continue;
    const derivative =
      (right.sample.pressuresMmHg.leftVentricleMmHg -
        left.sample.pressuresMmHg.leftVentricleMmHg) / dt;
    if (derivative < negativeDpDt) {
      negativeDpDt = derivative;
      negativeDpDtIndex = index;
    }
  }
  if (negativeDpDtIndex < 0 || !(negativeDpDt < 0)) {
    return Object.freeze({
      availability: "unavailable-no-negative-dpdt" as const,
      fitWindow: null,
      zeroAsymptoteFit: null,
      freeAsymptoteFit: null,
      preferredTauSec: null,
      preferredFitValidity: "unavailable" as const,
    });
  }
  const originPhase = window[negativeDpDtIndex]!.phase;
  const fitPoints = window.slice(negativeDpDtIndex).map((point) => ({
    timeSec: (point.phase - originPhase) * cycleLengthSec,
    pressureMmHg: point.sample.pressuresMmHg.leftVentricleMmHg,
  }));
  const zero = exponentialFit(fitPoints, 0);
  const free = bestFreeAsymptoteFit(fitPoints);
  const mvoLap = interpolate(cycle, mvo, (point) =>
    point.sample.pressuresMmHg.leftAtriumMmHg);
  const mvoLvp = interpolate(cycle, mvo, (point) =>
    point.sample.pressuresMmHg.leftVentricleMmHg);
  return Object.freeze({
    availability: "available-fit-attempted" as const,
    interpretationBoundary:
      "model-pressure-decay-fit-is-not-clinical-catheter-Weiss-tau" as const,
    fitWindow: Object.freeze({
      definition: "peak-negative-dpdt-to-gradient-mvo" as const,
      startPhase01: normalizePhase(originPhase),
      endPhase01: normalizePhase(mvo),
      pointCount: fitPoints.length,
    }),
    peakNegativeDpDtMmHgPerSec: negativeDpDt,
    mvoPressureMmHg: Object.freeze({
      leftAtrium: mvoLap,
      leftVentricle: mvoLvp,
      gradient: mvoLap == null || mvoLvp == null ? null : mvoLap - mvoLvp,
    }),
    zeroAsymptoteFit: zero,
    freeAsymptoteFit: free,
    preferredTauSec: free.validity === "valid" ? free.tauSec : null,
    preferredFitValidity: free.validity,
  });
}

function summarizeStrictMatchedVolume(
  cycle: readonly CyclePointV1[],
  reservoirStart: number,
  mvo: number,
  conduitEnd: number,
  periodicityEstablished: boolean,
) {
  const reservoir = pathWindow(cycle, reservoirStart, mvo);
  const conduit = pathWindow(cycle, mvo, conduitEnd);
  const reservoirMonotonicity = strictMonotonicity(reservoir, "increasing");
  const conduitMonotonicity = strictMonotonicity(conduit, "decreasing");
  const common = {
    evidenceStatus:
      "report-only-strict-monotone-matched-volume-no-isotonic-regression" as const,
    affectsEligibility: false as const,
    steadyStateInterpretationEligible: periodicityEstablished,
    steadyStateInterpretationUnavailableReason: periodicityEstablished
      ? null
      : ("caller-reports-periodicity-not-established" as const),
    gapDefinition: "reservoir-minus-conduit" as const,
    reservoirMonotonicity,
    conduitMonotonicity,
  };
  if (!reservoirMonotonicity.strict || !conduitMonotonicity.strict) {
    return Object.freeze({
      ...common,
      availability: "ambiguous-nonmonotone-branch" as const,
      ambiguityReasons: Object.freeze([
        ...(!reservoirMonotonicity.strict
          ? ["reservoir-not-strictly-increasing" as const]
          : []),
        ...(!conduitMonotonicity.strict
          ? ["conduit-not-strictly-decreasing" as const]
          : []),
      ]),
      overlapVolumeMl: null,
      normalizedOverlapWidth01: null,
      gapMmHg: null,
      normalizedMeanGap: null,
      integratedGapMmHgMl: null,
      normalizedIntegratedGap: null,
      gapTrace: Object.freeze([]),
    });
  }
  const low = Math.max(
    reservoir[0]!.volumeMl,
    conduit[conduit.length - 1]!.volumeMl,
  );
  const high = Math.min(
    reservoir[reservoir.length - 1]!.volumeMl,
    conduit[0]!.volumeMl,
  );
  if (!(high > low)) {
    return Object.freeze({
      ...common,
      availability: "unavailable-no-volume-overlap" as const,
      ambiguityReasons: Object.freeze([]),
      overlapVolumeMl: 0,
      normalizedOverlapWidth01: 0,
      gapMmHg: null,
      normalizedMeanGap: null,
      integratedGapMmHgMl: null,
      normalizedIntegratedGap: null,
      gapTrace: Object.freeze([]),
    });
  }
  const targets = Array.from(
    { length: 41 },
    (_, index) => low + ((high - low) * (index + 1)) / 42,
  );
  const gapTrace = targets.map((volumeMl) => {
    const reservoirPressure = interpolateMonotonePath(reservoir, volumeMl);
    const conduitPressure = interpolateMonotonePath(conduit, volumeMl);
    return Object.freeze({
      volumeMl,
      reservoirPressureMmHg: reservoirPressure,
      conduitPressureMmHg: conduitPressure,
      gapMmHg: reservoirPressure - conduitPressure,
    });
  });
  const gaps = gapTrace.map((point) => point.gapMmHg);
  const integrationTrace = [low, ...targets, high].map((volumeMl) => {
    const reservoirPressure = interpolateMonotonePath(reservoir, volumeMl);
    const conduitPressure = interpolateMonotonePath(conduit, volumeMl);
    return [volumeMl, reservoirPressure - conduitPressure] as const;
  });
  const integratedGap = trapezoid(
    integrationTrace,
  );
  const totalExcursion = Math.max(
    ...cycle.map((point) => point.sample.volumesMl.leftAtriumMl),
  ) - Math.min(
    ...cycle.map((point) => point.sample.volumesMl.leftAtriumMl),
  );
  const pressureScale = Math.max(
    ...cycle.map((point) => point.sample.pressuresMmHg.leftAtriumMmHg),
  ) - Math.min(
    ...cycle.map((point) => point.sample.pressuresMmHg.leftAtriumMmHg),
  );
  return Object.freeze({
    ...common,
    availability: "available" as const,
    ambiguityReasons: Object.freeze([]),
    overlapVolumeMl: high - low,
    normalizedOverlapWidth01: safeRatio(high - low, totalExcursion),
    gapMmHg: Object.freeze({
      minimum: Math.min(...gaps),
      mean: mean(gaps),
      median: median(gaps),
      maximum: Math.max(...gaps),
      positiveFraction01:
        gaps.filter((value) => value > 0).length / gaps.length,
    }),
    normalizedMeanGap: safeRatio(mean(gaps), pressureScale),
    integratedGapMmHgMl: integratedGap,
    normalizedIntegratedGap: safeRatio(
      integratedGap,
      totalExcursion * pressureScale,
    ),
    integrationIncludesExactOverlapEndpoints: true as const,
    gapTrace: Object.freeze(gapTrace),
  });
}

function strictMonotonicity(
  path: readonly PathPointV1[],
  direction: "increasing" | "decreasing",
) {
  if (path.length < 2) {
    return Object.freeze({
      strict: false,
      direction,
      reversalMl: null,
      plateauSegmentCount: null,
      violatingSegmentCount: null,
    });
  }
  const scale = Math.max(
    1,
    ...path.map((point) => Math.abs(point.volumeMl)),
  );
  const tolerance = 1e-10 * scale;
  let reversalMl = 0;
  let plateauSegmentCount = 0;
  let violatingSegmentCount = 0;
  for (let index = 1; index < path.length; index += 1) {
    const raw = path[index]!.volumeMl - path[index - 1]!.volumeMl;
    const directed = direction === "increasing" ? raw : -raw;
    if (Math.abs(directed) <= tolerance) plateauSegmentCount += 1;
    else if (directed < 0) {
      reversalMl -= directed;
      violatingSegmentCount += 1;
    }
  }
  return Object.freeze({
    strict: plateauSegmentCount === 0 && violatingSegmentCount === 0,
    direction,
    reversalMl,
    plateauSegmentCount,
    violatingSegmentCount,
  });
}

type OperatingPointCycleValidationV1 =
  | {
      readonly valid: true;
      readonly cycle: readonly CyclePointV1[];
      readonly cycleLengthSec: number;
    }
  | { readonly valid: false; readonly reason: string };

/**
 * Minimal cycle validation for operating-point readback.  This intentionally
 * has no valve-event or wave-topology requirement.
 */
function validateOperatingPointCycle(
  samples: readonly FivePatchFillingRelaxationDiagnosticSampleV1[],
): OperatingPointCycleValidationV1 {
  if (samples.length < 4) {
    return { valid: false, reason: "insufficient-raw-cycle-samples" };
  }
  if (samples.some((sample) => !finiteOperatingPointSample(sample))) {
    return { valid: false, reason: "non-finite-raw-cycle-sample" };
  }
  const tolerance = 1e-10;
  if (samples.some((sample) =>
    sample.phase01 < -tolerance || sample.phase01 > 1 + tolerance
  )) {
    return { valid: false, reason: "phase-outside-unit-cycle" };
  }
  for (let index = 1; index < samples.length; index += 1) {
    if (
      !(samples[index]!.phase01 > samples[index - 1]!.phase01) ||
      !(samples[index]!.timeSec > samples[index - 1]!.timeSec)
    ) {
      return {
        valid: false,
        reason: "raw-cycle-time-and-phase-must-be-strictly-increasing",
      };
    }
  }
  const hasZero = samples.some((sample) => Math.abs(sample.phase01) <= tolerance);
  const hasOne = samples.some((sample) =>
    Math.abs(sample.phase01 - 1) <= tolerance);
  if (hasZero && hasOne) {
    return {
      valid: false,
      reason: "duplicate-cycle-boundary-endpoints-zero-and-one",
    };
  }
  const phases = samples.map((sample) =>
    Math.abs(sample.phase01 - 1) <= tolerance ? 0 : sample.phase01
  ).sort((left, right) => left - right);
  const phaseSteps = phases.map((phase, index) => {
    const next = phases[(index + 1) % phases.length]!;
    return index + 1 < phases.length ? next - phase : next + 1 - phase;
  });
  const meanPhaseStep = mean(phaseSteps);
  if (
    !(meanPhaseStep > 0) ||
    Math.max(...phaseSteps.map((step) =>
      Math.abs(step - meanPhaseStep) / meanPhaseStep)) > 0.05
  ) {
    return {
      valid: false,
      reason: "nonuniform-or-incomplete-cycle-phase-grid",
    };
  }
  const timeSteps = samples.slice(1).map((sample, index) =>
    sample.timeSec - samples[index]!.timeSec);
  const meanTimeStep = mean(timeSteps);
  if (
    !(meanTimeStep > 0) ||
    Math.max(...timeSteps.map((step) =>
      Math.abs(step - meanTimeStep) / meanTimeStep)) > 0.05
  ) {
    return { valid: false, reason: "nonuniform-cycle-time-grid" };
  }
  const slopes = samples.slice(1).map((sample, index) =>
    (sample.timeSec - samples[index]!.timeSec) /
      (sample.phase01 - samples[index]!.phase01));
  const cycleLengthSec = mean(slopes);
  if (
    !(cycleLengthSec > 0) ||
    !Number.isFinite(cycleLengthSec) ||
    Math.max(...slopes.map((slope) =>
      Math.abs(slope - cycleLengthSec) / cycleLengthSec)) > 0.05
  ) {
    return { valid: false, reason: "inconsistent-time-to-phase-grid-slope" };
  }
  return Object.freeze({
    valid: true as const,
    cycle: canonicalCycle(samples),
    cycleLengthSec,
  });
}

function finiteOperatingPointSample(
  sample: FivePatchFillingRelaxationDiagnosticSampleV1,
): boolean {
  const required = [
    sample.timeSec,
    sample.phase01,
    sample.volumesMl.leftAtriumMl,
    sample.volumesMl.leftVentricleMl,
    sample.volumesMl.rightAtriumMl,
    sample.volumesMl.rightVentricleMl,
    sample.pressuresMmHg.leftAtriumMmHg,
    sample.pressuresMmHg.leftVentricleMmHg,
    sample.pressuresMmHg.systemicArteryMmHg,
    sample.pressuresMmHg.pulmonaryVeinMmHg,
    sample.flowsMlPerSec.mitralMlPerSec,
    sample.flowsMlPerSec.aorticMlPerSec,
    sample.flowsMlPerSec.tricuspidMlPerSec,
    sample.flowsMlPerSec.pulmonaryValveMlPerSec,
  ];
  return required.every(Number.isFinite);
}

function canonicalCycle(
  samples: readonly FivePatchFillingRelaxationDiagnosticSampleV1[],
): readonly CyclePointV1[] {
  return Object.freeze(
    samples
      .map((sample) => ({
        phase: Math.abs(sample.phase01 - 1) <= 1e-10 ? 0 : sample.phase01,
        sample,
      }))
      .sort((left, right) => left.phase - right.phase),
  );
}

function repeatedCycle(
  cycle: readonly CyclePointV1[],
): readonly CyclePointV1[] {
  return [-2, -1, 0, 1, 2].flatMap((offset) =>
    cycle.map((point) => ({ ...point, phase: point.phase + offset }))
  );
}

function windowPoints(
  cycle: readonly CyclePointV1[],
  start: number,
  end: number,
): readonly CyclePointV1[] {
  const repeated = repeatedCycle(cycle);
  const selected = repeated.filter((point) =>
    point.phase > start + 1e-12 && point.phase < end - 1e-12);
  const startPoint = interpolatedPoint(cycle, start);
  const endPoint = interpolatedPoint(cycle, end);
  return [
    ...(startPoint == null ? [] : [startPoint]),
    ...selected,
    ...(endPoint == null ? [] : [endPoint]),
  ].sort((left, right) => left.phase - right.phase);
}

function pathWindow(
  cycle: readonly CyclePointV1[],
  start: number,
  end: number,
): readonly PathPointV1[] {
  return windowPoints(cycle, start, end).map((point) => ({
    phase: point.phase,
    volumeMl: point.sample.volumesMl.leftAtriumMl,
    pressureMmHg: point.sample.pressuresMmHg.leftAtriumMmHg,
  }));
}

function interpolatedPoint(
  cycle: readonly CyclePointV1[],
  phase: number,
): CyclePointV1 | null {
  const repeated = repeatedCycle(cycle);
  for (let index = 1; index < repeated.length; index += 1) {
    const left = repeated[index - 1]!;
    const right = repeated[index]!;
    if (!(left.phase <= phase && phase <= right.phase)) continue;
    const width = right.phase - left.phase;
    const fraction = width <= 1e-15 ? 0 : (phase - left.phase) / width;
    const sample = left.sample;
    return {
      phase,
      sample: {
        ...sample,
        timeSec: sample.timeSec + fraction * (right.sample.timeSec - sample.timeSec),
        phase01: normalizePhase(phase),
        volumesMl: {
          leftAtriumMl: lerp(
            sample.volumesMl.leftAtriumMl,
            right.sample.volumesMl.leftAtriumMl,
            fraction,
          ),
          leftVentricleMl: lerp(
            sample.volumesMl.leftVentricleMl,
            right.sample.volumesMl.leftVentricleMl,
            fraction,
          ),
          rightAtriumMl: lerp(
            sample.volumesMl.rightAtriumMl,
            right.sample.volumesMl.rightAtriumMl,
            fraction,
          ),
          rightVentricleMl: lerp(
            sample.volumesMl.rightVentricleMl,
            right.sample.volumesMl.rightVentricleMl,
            fraction,
          ),
        },
        pressuresMmHg: interpolateRecord(
          sample.pressuresMmHg,
          right.sample.pressuresMmHg,
          fraction,
        ),
        flowsMlPerSec: interpolateRecord(
          sample.flowsMlPerSec,
          right.sample.flowsMlPerSec,
          fraction,
        ),
        velocitiesCmPerSec:
          sample.velocitiesCmPerSec == null ||
              right.sample.velocitiesCmPerSec == null
            ? undefined
            : interpolateRecord(
                sample.velocitiesCmPerSec,
                right.sample.velocitiesCmPerSec,
                fraction,
              ),
      },
    };
  }
  return null;
}

function interpolateRecord<T extends Readonly<Record<string, number | undefined>>>(
  left: T,
  right: T,
  fraction: number,
): T {
  return Object.fromEntries(
    Object.keys(left).map((key) => {
      const a = left[key];
      const b = right[key];
      return [key, a == null || b == null ? undefined : lerp(a, b, fraction)];
    }),
  ) as T;
}

function interpolate(
  cycle: readonly CyclePointV1[],
  phase: number,
  selector: (point: CyclePointV1) => number,
): number | null {
  const repeated = repeatedCycle(cycle);
  for (let index = 1; index < repeated.length; index += 1) {
    const left = repeated[index - 1]!;
    const right = repeated[index]!;
    if (!(left.phase <= phase && phase <= right.phase)) continue;
    const fraction = (phase - left.phase) /
      Math.max(right.phase - left.phase, 1e-15);
    return lerp(selector(left), selector(right), fraction);
  }
  return null;
}

function flowCycleSummary(
  cycle: readonly CyclePointV1[],
  cycleLengthSec: number,
  selector: (point: CyclePointV1) => number,
) {
  const values = cycle.map(selector);
  const forwardVolumeMl = integratePeriodicPart(
    cycle,
    cycleLengthSec,
    selector,
    "positive",
  );
  const reverseVolumeMl = integratePeriodicPart(
    cycle,
    cycleLengthSec,
    selector,
    "negative-magnitude",
  );
  return Object.freeze({
    minimumMlPerSec: Math.min(...values),
    meanMlPerSec: mean(values),
    maximumMlPerSec: Math.max(...values),
    forwardVolumeMl,
    reverseVolumeMl,
    netVolumeMl: forwardVolumeMl - reverseVolumeMl,
    reverseFlowDutyFraction01:
      values.filter((value) => value < 0).length / values.length,
    reverseFlowDutyAffectsEligibility: false as const,
  });
}

function optionalFlowCycleSummary(
  cycle: readonly CyclePointV1[],
  cycleLengthSec: number,
  selector: (point: CyclePointV1) => number | undefined,
) {
  if (!cycle.every((point) => Number.isFinite(selector(point)))) return null;
  return flowCycleSummary(
    cycle,
    cycleLengthSec,
    (point) => selector(point)!,
  );
}

function integratePeriodicPart(
  cycle: readonly CyclePointV1[],
  cycleLengthSec: number,
  selector: (point: CyclePointV1) => number,
  mode: "positive" | "negative-magnitude",
): number {
  const closed = [
    ...cycle,
    { ...cycle[0]!, phase: cycle[0]!.phase + 1 },
  ];
  let integral = 0;
  for (let index = 1; index < closed.length; index += 1) {
    const left = selector(closed[index - 1]!);
    const right = selector(closed[index]!);
    const dt = (closed[index]!.phase - closed[index - 1]!.phase) *
      cycleLengthSec;
    integral += mode === "positive"
      ? piecewiseLinearPositiveArea(left, right, dt)
      : piecewiseLinearPositiveArea(-left, -right, dt);
  }
  return integral;
}

function integrateWindowPositive(
  cycle: readonly CyclePointV1[],
  start: number,
  end: number,
  cycleLengthSec: number,
  selector: (point: CyclePointV1) => number,
): number {
  const points = windowPoints(cycle, start, end);
  let integral = 0;
  for (let index = 1; index < points.length; index += 1) {
    integral += piecewiseLinearPositiveArea(
      selector(points[index - 1]!),
      selector(points[index]!),
      (points[index]!.phase - points[index - 1]!.phase) * cycleLengthSec,
    );
  }
  return integral;
}

function integrateWindowNegativeMagnitude(
  cycle: readonly CyclePointV1[],
  start: number,
  end: number,
  cycleLengthSec: number,
  selector: (point: CyclePointV1) => number,
): number {
  return integrateWindowPositive(
    cycle,
    start,
    end,
    cycleLengthSec,
    (point) => -selector(point),
  );
}

function integrateWindow(
  cycle: readonly CyclePointV1[],
  start: number,
  end: number,
  cycleLengthSec: number,
  selector: (point: CyclePointV1) => number,
): number {
  const points = windowPoints(cycle, start, end);
  let integral = 0;
  for (let index = 1; index < points.length; index += 1) {
    integral += 0.5 *
      (selector(points[index - 1]!) + selector(points[index]!)) *
      (points[index]!.phase - points[index - 1]!.phase) *
      cycleLengthSec;
  }
  return integral;
}

function maximumInWindow(
  cycle: readonly CyclePointV1[],
  start: number,
  end: number,
  selector: (point: CyclePointV1) => number,
): number | null {
  const points = windowPoints(cycle, start, end);
  return points.length === 0 ? null : Math.max(...points.map(selector));
}

function minimumInWindow(
  cycle: readonly CyclePointV1[],
  start: number,
  end: number,
  selector: (point: CyclePointV1) => number,
): number | null {
  const points = windowPoints(cycle, start, end);
  return points.length === 0 ? null : Math.min(...points.map(selector));
}

function scalarRange(
  cycle: readonly CyclePointV1[],
  selector: (point: CyclePointV1) => number,
) {
  const values = cycle.map(selector);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return Object.freeze({ minimum, maximum, excursion: maximum - minimum });
}

function scalarSummary(
  cycle: readonly CyclePointV1[],
  selector: (point: CyclePointV1) => number,
) {
  const range = scalarRange(cycle, selector);
  return Object.freeze({ ...range, mean: mean(cycle.map(selector)) });
}

function optionalScalarSummary(
  cycle: readonly CyclePointV1[],
  selector: (point: CyclePointV1) => number | undefined,
) {
  if (!cycle.every((point) => Number.isFinite(selector(point)))) return null;
  return scalarSummary(cycle, (point) => selector(point)!);
}

function optionalScalarRange(
  cycle: readonly CyclePointV1[],
  selector: (point: CyclePointV1) => number | undefined,
) {
  if (!cycle.every((point) => Number.isFinite(selector(point)))) return null;
  return scalarRange(cycle, (point) => selector(point)!);
}

function exponentialFit(
  points: readonly {
    readonly timeSec: number;
    readonly pressureMmHg: number;
  }[],
  asymptoteMmHg: number,
): PressureFitV1 {
  const transformed = points.flatMap((point) => {
    const shifted = point.pressureMmHg - asymptoteMmHg;
    return shifted > 0 && Number.isFinite(shifted)
      ? [{ x: point.timeSec, y: Math.log(shifted) }]
      : [];
  });
  if (transformed.length < 5) {
    return {
      availability: "insufficient-positive-points",
      validity: "insufficient-points",
      tauSec: null,
      asymptoteMmHg,
      amplitudeMmHg: null,
      rSquaredLogPressure: null,
      pointCount: transformed.length,
    };
  }
  const regression = linearRegression(transformed);
  if (regression == null) {
    return {
      availability: "degenerate-time-grid",
      validity: "insufficient-points",
      tauSec: null,
      asymptoteMmHg,
      amplitudeMmHg: null,
      rSquaredLogPressure: null,
      pointCount: transformed.length,
    };
  }
  if (!(regression.slope < 0)) {
    return {
      availability: "nondecaying-fit",
      validity: "nondecaying",
      tauSec: null,
      asymptoteMmHg,
      amplitudeMmHg: Math.exp(regression.intercept),
      rSquaredLogPressure: regression.rSquared,
      pointCount: transformed.length,
    };
  }
  return {
    availability: "available",
    validity: regression.rSquared >= 0.95
      ? "valid"
      : "low-log-pressure-r-squared",
    tauSec: -1 / regression.slope,
    asymptoteMmHg,
    amplitudeMmHg: Math.exp(regression.intercept),
    rSquaredLogPressure: regression.rSquared,
    pointCount: transformed.length,
  };
}

function bestFreeAsymptoteFit(
  points: readonly {
    readonly timeSec: number;
    readonly pressureMmHg: number;
  }[],
): PressureFitV1 & {
  readonly searchBoundsMmHg: readonly [number, number];
  readonly searchBoundaryHit: "lower" | "upper" | null;
} {
  if (points.length < 5) {
    return {
      ...exponentialFit(points, 0),
      searchBoundsMmHg: [0, 0],
      searchBoundaryHit: null,
    };
  }
  const pressures = points.map((point) => point.pressureMmHg);
  const lowPressure = Math.min(...pressures);
  const span = Math.max(Math.max(...pressures) - lowPressure, 1);
  const lowBound = lowPressure - 2 * span;
  const highBound = lowPressure - 1e-6;
  let best = exponentialFit(points, lowBound);
  let bestIndex = 0;
  for (let index = 1; index <= 400; index += 1) {
    const asymptote = lowBound + ((highBound - lowBound) * index) / 400;
    const fit = exponentialFit(points, asymptote);
    if (
      fit.rSquaredLogPressure != null &&
      (best.rSquaredLogPressure == null ||
        fit.rSquaredLogPressure > best.rSquaredLogPressure)
    ) {
      best = fit;
      bestIndex = index;
    }
  }
  const searchBoundaryHit = bestIndex === 0
    ? ("lower" as const)
    : bestIndex === 400
      ? ("upper" as const)
      : null;
  return {
    ...best,
    validity: searchBoundaryHit == null
      ? best.validity
      : ("asymptote-search-boundary-hit" as const),
    searchBoundsMmHg: [lowBound, highBound],
    searchBoundaryHit,
  };
}

function linearRegression(
  points: readonly { readonly x: number; readonly y: number }[],
) {
  const meanX = mean(points.map((point) => point.x));
  const meanY = mean(points.map((point) => point.y));
  let xx = 0;
  let xy = 0;
  let yy = 0;
  for (const point of points) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  }
  if (!(xx > 0)) return null;
  const slope = xy / xx;
  const intercept = meanY - slope * meanX;
  const residual = points.reduce((sum, point) => {
    const error = point.y - (intercept + slope * point.x);
    return sum + error * error;
  }, 0);
  return { slope, intercept, rSquared: yy > 0 ? 1 - residual / yy : 1 };
}

function interpolateMonotonePath(
  path: readonly PathPointV1[],
  targetVolumeMl: number,
): number {
  for (let index = 1; index < path.length; index += 1) {
    const left = path[index - 1]!;
    const right = path[index]!;
    const low = Math.min(left.volumeMl, right.volumeMl);
    const high = Math.max(left.volumeMl, right.volumeMl);
    if (targetVolumeMl < low - 1e-12 || targetVolumeMl > high + 1e-12) continue;
    const fraction = (targetVolumeMl - left.volumeMl) /
      (right.volumeMl - left.volumeMl);
    return lerp(left.pressureMmHg, right.pressureMmHg, fraction);
  }
  return Number.NaN;
}

function indexOfMaximum<T>(
  values: readonly T[],
  selector: (value: T) => number,
): number {
  if (values.length === 0) return -1;
  let best = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (selector(values[index]!) > selector(values[best]!)) best = index;
  }
  return best;
}

function piecewiseLinearPositiveArea(
  left: number,
  right: number,
  durationSec: number,
): number {
  if (!(durationSec > 0)) return 0;
  if (left <= 0 && right <= 0) return 0;
  if (left >= 0 && right >= 0) return 0.5 * (left + right) * durationSec;
  if (left > 0) {
    const fraction = left / (left - right);
    return 0.5 * left * fraction * durationSec;
  }
  const fraction = -left / (right - left);
  return 0.5 * right * (1 - fraction) * durationSec;
}

function trapezoid(points: readonly (readonly [number, number])[]): number {
  let integral = 0;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1]!;
    const right = points[index]!;
    integral += 0.5 * (left[1] + right[1]) * (right[0] - left[0]);
  }
  return integral;
}

function safeRatio(
  numerator: number | null,
  denominator: number | null,
): number | null {
  return numerator != null &&
      denominator != null &&
      Number.isFinite(numerator) &&
      Number.isFinite(denominator) &&
      Math.abs(denominator) > 1e-15
    ? numerator / denominator
    : null;
}

function unwrapBefore(phase01: number, reference: number): number {
  const phase = normalizePhase(phase01);
  return phase < reference ? phase : phase - 1;
}

function unwrapAfter(phase01: number, reference: number): number {
  const phase = normalizePhase(phase01);
  return phase > reference ? phase : phase + 1;
}

function normalizePhase(phase: number): number {
  const wrapped = phase - Math.floor(phase);
  return wrapped === 1 ? 0 : wrapped;
}

function lerp(left: number, right: number, fraction: number): number {
  return left + (right - left) * fraction;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: readonly number[]): number {
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? 0.5 * (ordered[middle - 1]! + ordered[middle]!)
    : ordered[middle]!;
}
