import type {
  EcmoGasExchangeEvaluationV1,
  EcmoGasExchangeInputV1,
} from "@/engine/devices/typesV1";
import {
  oxygenContentMlPerDlV1,
  oxygenPo2FromContentV1,
  oxygenPo2FromSaturationV1,
  oxygenSaturationAtPo2V1 as sharedOxygenSaturationAtPo2V1,
} from "@/engine/physiology/oxygenTransportV1";

const DRY_GAS_PRESSURE_AT_SEA_LEVEL_MMHG = 760 - 47;

export function evaluateEcmoGasExchangeV1(
  input: EcmoGasExchangeInputV1,
): EcmoGasExchangeEvaluationV1 {
  validateEcmoGasExchangeConfigV1(input.config);
  if (
    input.mode === "VA" &&
    input.vaCannulation !== "peripheral" &&
    input.vaCannulation !== "central"
  ) {
    throw new Error("vaCannulation must be peripheral or central in VA mode");
  }
  const resolvedMixedVenousSaturation01 =
    input.config.venousOxygenMode === "fick-closed"
      ? solveFickMixedVenousSaturation(input)
      : input.config.mixedVenousSaturation01;
  return evaluateAtMixedVenousSaturation(
    input,
    resolvedMixedVenousSaturation01,
  );
}

function evaluateAtMixedVenousSaturation(
  input: EcmoGasExchangeInputV1,
  resolvedMixedVenousSaturation01: number,
): EcmoGasExchangeEvaluationV1 {
  const ecmoFlowLMin = nonnegative(input.ecmoFlowLMin, "ecmoFlowLMin");
  const nativeCardiacOutputLMin =
    input.mode === "VV"
      ? positive(input.nativeCardiacOutputLMin, "nativeCardiacOutputLMin")
      : nonnegative(input.nativeCardiacOutputLMin, "nativeCardiacOutputLMin");
  const config = input.config;
  const configuredRecirculationFraction =
    input.mode === "VV" ? clamp01(config.vvRecirculationFraction01) : 0;
  const configuredEffectiveFlowLMin =
    ecmoFlowLMin * (1 - configuredRecirculationFraction);
  const effectiveEcmoFlowLMin =
    input.mode === "VV"
      ? Math.min(configuredEffectiveFlowLMin, nativeCardiacOutputLMin)
      : ecmoFlowLMin;
  const recirculationFlowLMin = ecmoFlowLMin - effectiveEcmoFlowLMin;
  const recirculationFraction =
    ecmoFlowLMin > 0 ? recirculationFlowLMin / ecmoFlowLMin : 0;
  const mixedVenousSaturation01 = clamp01(resolvedMixedVenousSaturation01);
  const venousPo2MmHg = po2FromSaturation(mixedVenousSaturation01);
  const venousContent = oxygenContentMlPerDl(
    config.hemoglobinGPerDl,
    mixedVenousSaturation01,
    venousPo2MmHg,
  );
  const freshGasOxygenAvailability = 1 - Math.exp(-config.sweepGasLMin / 0.2);
  const residenceEfficiency =
    ecmoFlowLMin <= 0
      ? 0
      : freshGasOxygenAvailability *
        (1 -
          Math.exp(
            (-config.membraneOxygenTransferCoefficient *
              config.oxygenatorRatedFlowLMin) /
              ecmoFlowLMin,
          ));
  const equilibriumPostPo2MmHg =
    DRY_GAS_PRESSURE_AT_SEA_LEVEL_MMHG * config.fractionDeliveredOxygen01;
  const equilibriumPostSaturation01 = oxygenSaturationAtPo2V1(
    equilibriumPostPo2MmHg,
  );
  const equilibriumPostContent = oxygenContentMlPerDl(
    config.hemoglobinGPerDl,
    equilibriumPostSaturation01,
    equilibriumPostPo2MmHg,
  );
  let preOxygenatorContent = venousContent;
  let postContent = venousContent;
  if (ecmoFlowLMin > 0) {
    if (input.mode === "VV") {
      const unexchangedFraction = 1 - residenceEfficiency;
      const denominator = Math.max(
        1 - unexchangedFraction * recirculationFraction,
        1e-9,
      );
      postContent =
        (unexchangedFraction * (1 - recirculationFraction) * venousContent +
          residenceEfficiency * equilibriumPostContent) /
        denominator;
      preOxygenatorContent =
        (1 - recirculationFraction) * venousContent +
        recirculationFraction * postContent;
    } else {
      postContent =
        venousContent +
        residenceEfficiency * (equilibriumPostContent - venousContent);
    }
    const unconstrainedTransfer =
      ecmoFlowLMin * 10 * Math.max(postContent - preOxygenatorContent, 0);
    if (unconstrainedTransfer > config.maximumOxygenTransferMlPerMin) {
      if (input.mode === "VV" && recirculationFraction < 1 - 1e-9) {
        postContent =
          venousContent +
          config.maximumOxygenTransferMlPerMin /
            (ecmoFlowLMin * 10 * (1 - recirculationFraction));
        preOxygenatorContent =
          (1 - recirculationFraction) * venousContent +
          recirculationFraction * postContent;
      } else {
        postContent =
          preOxygenatorContent +
          config.maximumOxygenTransferMlPerMin / (ecmoFlowLMin * 10);
      }
    }
  }
  postContent = clamp(postContent, venousContent, equilibriumPostContent);
  preOxygenatorContent = clamp(
    preOxygenatorContent,
    venousContent,
    postContent,
  );
  const preOxygenatorPo2MmHg = po2FromContent(
    preOxygenatorContent,
    config.hemoglobinGPerDl,
  );
  const postOxygenatorPo2MmHg = po2FromContent(
    postContent,
    config.hemoglobinGPerDl,
  );
  const preOxygenatorSaturation01 =
    oxygenSaturationAtPo2V1(preOxygenatorPo2MmHg);
  const postOxygenatorSaturation01 = oxygenSaturationAtPo2V1(
    postOxygenatorPo2MmHg,
  );
  const nativeEndCapillaryPo2MmHg = po2FromSaturation(
    config.nativeEndCapillarySaturation01,
  );
  const capillaryContent = oxygenContentMlPerDl(
    config.hemoglobinGPerDl,
    config.nativeEndCapillarySaturation01,
    nativeEndCapillaryPo2MmHg,
  );
  const nativeArterialContent =
    venousContent +
    (1 - config.nativeLungShuntFraction01) * (capillaryContent - venousContent);
  const nativeArterialPo2MmHg = po2FromContent(
    nativeArterialContent,
    config.hemoglobinGPerDl,
  );
  const nativeArterialSaturation01 = oxygenSaturationAtPo2V1(
    nativeArterialPo2MmHg,
  );

  let estimatedArterialContent: number;
  let totalSystemicFlowLMin: number;
  if (input.mode === "VV") {
    const ecmoFractionOfOutput = clamp01(
      effectiveEcmoFlowLMin / nativeCardiacOutputLMin,
    );
    const venousAfterEcmo =
      venousContent + ecmoFractionOfOutput * (postContent - venousContent);
    estimatedArterialContent =
      venousAfterEcmo +
      (1 - config.nativeLungShuntFraction01) *
        (capillaryContent - venousAfterEcmo);
    totalSystemicFlowLMin = nativeCardiacOutputLMin;
  } else {
    totalSystemicFlowLMin = nativeCardiacOutputLMin + ecmoFlowLMin;
    estimatedArterialContent =
      totalSystemicFlowLMin <= 0
        ? nativeArterialContent
        : (nativeCardiacOutputLMin * nativeArterialContent +
            ecmoFlowLMin * postContent) /
          totalSystemicFlowLMin;
  }
  estimatedArterialContent = clamp(
    estimatedArterialContent,
    venousContent,
    Math.max(postContent, capillaryContent),
  );
  const estimatedSystemicArterialPo2MmHg = po2FromContent(
    estimatedArterialContent,
    config.hemoglobinGPerDl,
  );
  const estimatedSystemicArterialSaturation01 = oxygenSaturationAtPo2V1(
    estimatedSystemicArterialPo2MmHg,
  );
  let rightRadialContent = estimatedArterialContent;
  let femoralContent = estimatedArterialContent;
  let vaMixingRegime: EcmoGasExchangeEvaluationV1["vaMixingRegime"] =
    "not-applicable-vv";
  if (input.mode === "VA" && input.vaCannulation === "central") {
    vaMixingRegime = "central-return-well-mixed";
  } else if (input.mode === "VA") {
    const upperFlow =
      totalSystemicFlowLMin * clamp01(config.upperBodyFlowFraction01);
    if (nativeCardiacOutputLMin >= upperFlow) {
      vaMixingRegime = "native-flow-reaches-distal-aorta";
      rightRadialContent = nativeArterialContent;
      const lowerFlow = Math.max(totalSystemicFlowLMin - upperFlow, 1e-9);
      femoralContent =
        (Math.max(nativeCardiacOutputLMin - upperFlow, 0) *
          nativeArterialContent +
          ecmoFlowLMin * postContent) /
        lowerFlow;
    } else {
      vaMixingRegime = "ecmo-flow-reaches-aortic-arch";
      rightRadialContent =
        upperFlow > 0
          ? (nativeCardiacOutputLMin * nativeArterialContent +
              (upperFlow - nativeCardiacOutputLMin) * postContent) /
            upperFlow
          : estimatedArterialContent;
      femoralContent = postContent;
    }
  }
  const rightRadialArterialPo2MmHg = po2FromContent(
    rightRadialContent,
    config.hemoglobinGPerDl,
  );
  const femoralArterialPo2MmHg = po2FromContent(
    femoralContent,
    config.hemoglobinGPerDl,
  );
  const rightRadialArterialSaturation01 = oxygenSaturationAtPo2V1(
    rightRadialArterialPo2MmHg,
  );
  const femoralArterialSaturation01 = oxygenSaturationAtPo2V1(
    femoralArterialPo2MmHg,
  );
  const membraneOxygenTransferMlPerMin =
    ecmoFlowLMin * 10 * Math.max(postContent - preOxygenatorContent, 0);
  const bloodFlowCo2Efficiency = 1 - Math.exp(-ecmoFlowLMin / 0.8);
  const sweepGasResponse =
    (2 * config.sweepGasLMin) / (1 + config.sweepGasLMin);
  const membraneCo2RemovalMlPerMin =
    config.membraneCo2RemovalMlPerMinAtSweep1 *
    sweepGasResponse *
    bloodFlowCo2Efficiency;
  const estimatedSystemicOxygenDeliveryMlPerMin =
    totalSystemicFlowLMin * 10 * estimatedArterialContent;
  const impliedFickOxygenConsumptionMlPerMin =
    totalSystemicFlowLMin *
    10 *
    Math.max(estimatedArterialContent - venousContent, 0);
  const oxygenConsumptionResidualMlPerMin =
    impliedFickOxygenConsumptionMlPerMin - config.oxygenConsumptionMlPerMin;
  const oxygenDemandMetFraction01 = clamp01(
    impliedFickOxygenConsumptionMlPerMin /
      positive(config.oxygenConsumptionMlPerMin, "oxygenConsumptionMlPerMin"),
  );
  const oxygenDeliveryToConsumptionRatio =
    estimatedSystemicOxygenDeliveryMlPerMin /
    positive(config.oxygenConsumptionMlPerMin, "oxygenConsumptionMlPerMin");

  return Object.freeze({
    mode: input.mode,
    venousOxygenMode: config.venousOxygenMode,
    ecmoFlowLMin,
    effectiveEcmoFlowLMin,
    recirculationFlowLMin,
    configuredVvRecirculationFraction01: configuredRecirculationFraction,
    totalRecirculationFraction01: recirculationFraction,
    nativeCardiacOutputLMin,
    ecmoToCardiacOutputRatio:
      nativeCardiacOutputLMin > 0
        ? effectiveEcmoFlowLMin / nativeCardiacOutputLMin
        : null,
    preOxygenatorSaturation01,
    postOxygenatorSaturation01,
    resolvedMixedVenousSaturation01: mixedVenousSaturation01,
    resolvedMixedVenousPo2MmHg: venousPo2MmHg,
    preOxygenatorPo2MmHg,
    postOxygenatorPo2MmHg,
    nativeArterialSaturation01,
    estimatedSystemicArterialSaturation01,
    estimatedSystemicArterialPo2MmHg,
    rightRadialArterialSaturation01,
    femoralArterialSaturation01,
    rightRadialArterialPo2MmHg,
    femoralArterialPo2MmHg,
    preOxygenatorOxygenContentMlPerDl: preOxygenatorContent,
    postOxygenatorOxygenContentMlPerDl: postContent,
    mixedVenousOxygenContentMlPerDl: venousContent,
    estimatedArterialOxygenContentMlPerDl: estimatedArterialContent,
    rightRadialOxygenContentMlPerDl: rightRadialContent,
    femoralOxygenContentMlPerDl: femoralContent,
    membraneOxygenTransferMlPerMin,
    membraneCo2RemovalMlPerMin,
    estimatedSystemicOxygenDeliveryMlPerMin,
    oxygenDeliveryToConsumptionRatio,
    impliedFickOxygenConsumptionMlPerMin,
    oxygenConsumptionResidualMlPerMin,
    oxygenDemandMetFraction01,
    vaMixingRegime,
    assumptions: Object.freeze([
      "beat-mean well-mixed oxygen-content balance",
      config.venousOxygenMode === "fick-closed"
        ? "mixed-venous content is solved from a steady Fick oxygen-consumption closure"
        : "mixed-venous saturation is a prescribed measured boundary; VO2 is a comparison target",
      "native lung represented by a fixed shunt fraction",
      "VV effective flow is circuit flow times one minus recirculation, capped at systemic flow",
      "content and PO2 are linked by a fixed adult Hill dissociation curve",
      "peripheral VA uses a conservative two-territory steady mixer; central VA is well mixed",
      "fresh-gas availability suppresses sustained O2 transfer near zero sweep and is nearly one above 1 L/min",
      "CO2 removal is a saturating sweep-gas surrogate, not a blood-gas state",
    ]),
  });
}

function solveFickMixedVenousSaturation(input: EcmoGasExchangeInputV1): number {
  const residual = (saturation01: number) =>
    evaluateAtMixedVenousSaturation(input, saturation01)
      .oxygenConsumptionResidualMlPerMin;
  let lower = 0;
  let upper = 0.999;
  const lowerResidual = residual(lower);
  if (lowerResidual <= 0) return lower;
  const upperResidual = residual(upper);
  if (upperResidual >= 0) return upper;
  for (let iteration = 0; iteration < 56; iteration += 1) {
    const midpoint = (lower + upper) / 2;
    if (residual(midpoint) > 0) lower = midpoint;
    else upper = midpoint;
  }
  return (lower + upper) / 2;
}

export function validateEcmoGasExchangeConfigV1(
  config: EcmoGasExchangeInputV1["config"],
): void {
  fraction(config.fractionDeliveredOxygen01, "fractionDeliveredOxygen01");
  if (config.fractionDeliveredOxygen01 < 0.21) {
    throw new Error("fractionDeliveredOxygen01 must be in [0.21, 1]");
  }
  nonnegative(config.sweepGasLMin, "sweepGasLMin");
  positive(config.oxygenatorRatedFlowLMin, "oxygenatorRatedFlowLMin");
  positive(
    config.membraneOxygenTransferCoefficient,
    "membraneOxygenTransferCoefficient",
  );
  positive(
    config.maximumOxygenTransferMlPerMin,
    "maximumOxygenTransferMlPerMin",
  );
  nonnegative(
    config.membraneCo2RemovalMlPerMinAtSweep1,
    "membraneCo2RemovalMlPerMinAtSweep1",
  );
  positive(config.hemoglobinGPerDl, "hemoglobinGPerDl");
  if (
    config.venousOxygenMode !== "fick-closed" &&
    config.venousOxygenMode !== "prescribed-saturation"
  ) {
    throw new Error(
      "venousOxygenMode must be fick-closed or prescribed-saturation",
    );
  }
  fraction(config.mixedVenousSaturation01, "mixedVenousSaturation01");
  fraction(config.nativeLungShuntFraction01, "nativeLungShuntFraction01");
  fraction(
    config.nativeEndCapillarySaturation01,
    "nativeEndCapillarySaturation01",
  );
  positive(config.oxygenConsumptionMlPerMin, "oxygenConsumptionMlPerMin");
  fraction(config.vvRecirculationFraction01, "vvRecirculationFraction01");
  fraction(config.upperBodyFlowFraction01, "upperBodyFlowFraction01");
}

export function oxygenContentMlPerDl(
  hemoglobinGPerDl: number,
  saturation01: number,
  po2MmHg: number,
): number {
  positive(hemoglobinGPerDl, "hemoglobinGPerDl");
  return oxygenContentMlPerDlV1(
    hemoglobinGPerDl,
    clamp01(saturation01),
    nonnegative(po2MmHg, "po2MmHg"),
  );
}

export function oxygenSaturationAtPo2V1(po2MmHg: number): number {
  return sharedOxygenSaturationAtPo2V1(nonnegative(po2MmHg, "po2MmHg"));
}

function po2FromSaturation(saturation01: number): number {
  return oxygenPo2FromSaturationV1(clamp01(saturation01));
}

function po2FromContent(
  contentMlPerDl: number,
  hemoglobinGPerDl: number,
): number {
  return oxygenPo2FromContentV1(
    nonnegative(contentMlPerDl, "contentMlPerDl"),
    positive(hemoglobinGPerDl, "hemoglobinGPerDl"),
  );
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.min(upper, Math.max(lower, value));
}

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be positive and finite`);
  }
  return value;
}

function nonnegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be nonnegative and finite`);
  }
  return value;
}

function fraction(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be in [0, 1]`);
  }
  return value;
}
