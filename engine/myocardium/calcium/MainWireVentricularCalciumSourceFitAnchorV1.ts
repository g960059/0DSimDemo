export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_FIT_ANCHOR_V1_ID =
  "main-wire-ventricular-calcium-source-fit-anchor-v1" as const;

/**
 * Fixed output of the archived source-only whole-trace fit. The onset offset
 * belongs to the fit audit; it is not an additional electromechanical delay.
 */
export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_FIT_ANCHOR_V1 =
  Object.freeze({
    anchorId: MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_FIT_ANCHOR_V1_ID,
    sourceFitProfileId:
      "land2017-figure6-whole-trace-alpha-fit" as const,
    derivationMethodId:
      "main-wire-ventricular-calcium-source-trace-fit-v1" as const,
    sourceTraceId:
      "land2017-figure6-coppini-calcium-trace-v1" as const,
    sourceDoi: "10.1016/j.yjmcc.2017.03.008" as const,
    sourceFigure: "Figure 6 left panel" as const,
    amplitudePolicy: "source-digitized-extrema-locked" as const,
    ventricularDiastolicCalciumUM: 0.164321 as const,
    ventricularPeakCalciumUM: 0.592586 as const,
    ventricularAlphaTimeConstantSec: 0.1234750900275888 as const,
    sourceTraceOnsetOffsetSec: 0.007222906291484831 as const,
    sourceTraceOnsetOffsetChangesElectricalToCalciumDelay: false as const,
    ventricularElectricalToCalciumDelaySec: 0.012 as const,
    ventricularElectricalToCalciumDelaySource:
      "five-wall-normal-calcium-component-timing-prior-v1" as const,
    ventricularElectricalToCalciumDelayDerivedFromSourceFit: false as const,
    figureDigitizationUsed: true as const,
    originalNumericSourceTraceUsed: false as const,
    sourceMeasurementCovarianceAvailable: false as const,
    hemodynamicOutcomeUsedToDeriveFit: false as const,
    landTensionOutcomeUsedToDeriveFit: false as const,
  });

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_FIT_ANCHOR_CLAIM_V1 =
  Object.freeze({
    role: "fixed-source-whole-trace-alpha-limit-anchor" as const,
    waveformFamily:
      "periodic-normalized-biexponential-exact-alpha-limit" as const,
    sourceTraceAmplitudeConstraint:
      "digitized-minimum-and-maximum-locked" as const,
    sourceTraceTimingFit:
      "whole-trace-common-time-constant-and-source-onset-offset" as const,
    sourceOnsetOffsetIsElectricalDelay: false as const,
    ventricularElectricalToCalciumDelayChangedByFit: false as const,
    calciumOrMechanicsStateAdded: false as const,
    clinicalValidationClaimed: false as const,
  });
