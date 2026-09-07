import { stableHash, sanitizeForStableHash } from "@/engine/integrity/stableHash";
import { MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1 } from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import type { MainWireIntegratedModelHemodynamicResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import type { MainWireIntegratedModelMechanismResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import { MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
  createMainWireIntegratedRegularSinusRhythmV3 } from "@/engine/myocardium/MainWireIntegratedRegularSinusRhythmV3";
import { resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
import { createMaterialKernelsWithMechanicsResearchInputsV1, createNormalAdultProviderFromKernels,
  scaledWallLandTrefForScaleV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1,
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1 } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import { assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  prepareMainWireIntegratedModelFixtureInputsV3 } from "./MainWireIntegratedModelPeriodicSteadyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID } from "./MainWireIntegratedModelRoundedEjectionFixtureV1";
import { MainWireIntegratedTypedAuthoritySessionV1 } from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import { forkMainWireIntegratedModelAtFixedTbvV3,
  forkMainWireIntegratedModelResponsiveStarlingV3 } from "@/engine/myocardium/MainWireIntegratedModelFixedTbvForkV3";
import type { MainWireIntegratedModelRuntimeV3 } from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import { canonicalizeDerivedExactEventCalciumParameterV1, convertPeriodicBiexponentialToExactEventCalciumV1 } from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import { createAcceptedComposedRhythmTransactionConfigurationV2, initializeAcceptedComposedRhythmTransactionStateV2 } from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import { createLand2017StrongBridgeDeactivationExitV2, deriveLand2017DerivedParameters, stableHash as stableLandHash,
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1 as sourceLand } from "@/engine/myocardium/myofilament/land2017/parameterSets";

export type MainWireBaselineReferenceKineticRestorationV1 = "none" | "kuw" | "kws" | "both";
/** Research-only joint affinity transfer. The interval is an admissible
 * experiment domain, NOT a measured normal population interval. */
export type MainWireBaselineReferenceAffinityCalibrationV1 = Readonly<{
  caT50RefUM: number;
  beta1UM: number;
}>;
export type MainWireBaselineReferenceBridgeExitProbeV1 = "none" | Readonly<{
  maximumRatePerSec: 15 | 30 | 60 | 120;
  cooperativeGatePower: 8 | 16;
}>;
export type MainWireBaselineReferenceRecruitmentDistortionProbeV1 = Readonly<{
  /** Applied once to selected kws=4.8/s; 5 and7.5 give24 and36/s, not source multiples. */
  kwsScale: .8 | 1 | 5 | 7.5;
  phiScale: 0.13333333333333333 | .2 | .4 | .6 | 1 | 1.2;
}>;

export const MAIN_WIRE_BASELINE_REFERENCE_RESEARCH_V1_ID = "main-wire-baseline-reference-research-v1";

/** Bounded research domain, not population normal limits or a published control
 * domain. Tref covers the current 158.4 kPa reference +/- 25%. */
export const MAIN_WIRE_BASELINE_REFERENCE_RESEARCH_DOMAIN_V1 = Object.freeze({
  ventricularTrefPa: Object.freeze({ minimum: 118_800, maximum: 198_000, unit: "Pa" }),
  systemicArterialComplianceScale: Object.freeze({ minimum: 0.75, maximum: 1.25, unit: "1" }),
  provenance: "bounded-local-constitutive-intervention-around-selected-baseline-not-clinical-reference",
});

/** Endpoint experiments around the calibration domain, not an expanded fit
 * domain or a qualified public control range. Admission is not validation. */
export const MAIN_WIRE_BASELINE_REFERENCE_INTERVENTION_DOMAIN_V1 = Object.freeze({
  ventricularTrefPa: Object.freeze({ minimum: 95_040, maximum: 320_000, unit: "Pa" }),
  systemicArterialComplianceScale: Object.freeze({ minimum: 0.6, maximum: 1.5, unit: "1" }),
  provenance: "explicit-intervention-only; 320000 Pa permits prespecified +/-20% amplitude response tests around the 238817 Pa research reference; not a measured normal range or public fit-domain expansion",
});

export type MainWireBaselineReferenceResearchParametersV1 = Readonly<{
  ventricularTrefPa: number;
  systemicArterialComplianceScale: number;
}>;

/** Distinct exact construction, sharing source equations and memory schemas.
 * These fixtures must not be checkpointed/admitted as published Standard70. */
export function createMainWireBaselineReferenceResearchV1(input: Readonly<{
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3;
  parameters: MainWireBaselineReferenceResearchParametersV1;
  admissionRole?: "baseline-candidate" | "intervention";
  aorticRootInertanceScale?: 0 | 1;
  ventricularCalciumTimeScale?: number;
  ventricularCalciumRiseFraction?: number;
  ventricularAeff?: 25 | 26.5;
  ventricularDiastolicCalciumUM?: .11 | .13 | .164321;
  ventricularPeakCalciumUM?: number;
  ventricularLandSlackStretch?: 1 | 1.06 | 1.07 | 1.09;
  ventricularKineticRestoration?: MainWireBaselineReferenceKineticRestorationV1;
  ventricularBridgeExit?: MainWireBaselineReferenceBridgeExitProbeV1;
  ventricularRecruitmentDistortion?: MainWireBaselineReferenceRecruitmentDistortionProbeV1;
  ventricularLengthSensitivityScale?: .8 | 1;
  ventricularAffinityCalibration?: MainWireBaselineReferenceAffinityCalibrationV1;
}>) {
  const { parameters } = input;
  const aorticRootInertanceScale = input.aorticRootInertanceScale ?? 1;
  if (![0, 1].includes(aorticRootInertanceScale)) {
    throw new Error("aortic root causal ablation admits only source L or L=0");
  }
  const admissionRole = input.admissionRole ?? "baseline-candidate";
  const calciumTimeScale = input.ventricularCalciumTimeScale ?? 1;
  // A shape counterfactual within the existing two-state Ca law. A faster rise
  // does not assert that uptake kinetics or the source-data fit are preserved.
  const calciumRiseFraction = input.ventricularCalciumRiseFraction ?? 1;
  const aeff = input.ventricularAeff ?? 26.5;
  const source = MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1;
  const sourceCalcium = resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(
    input.hemodynamicResearchInputs.heartRateBpm);
  const sourceFloor = sourceCalcium.ventricular.diastolicCalciumUM;
  const calciumFloor = input.ventricularDiastolicCalciumUM ?? sourceFloor;
  const sourcePeak = sourceFloor + sourceCalcium.ventricular.peakAmplitudeUM;
  const calciumPeak = input.ventricularPeakCalciumUM ?? sourcePeak;
  if (!Number.isFinite(calciumPeak) || calciumPeak < .4 || calciumPeak > 1.2 || calciumPeak <= calciumFloor) {
    throw new Error("unsupported research Ca peak or nonpositive pulse amplitude");
  }
  const landSlackStretch = input.ventricularLandSlackStretch ?? source.landSlackStretch;
  const kineticRestoration = input.ventricularKineticRestoration ?? "none";
  const lengthSensitivityScale = input.ventricularLengthSensitivityScale === undefined
    ? 1 : input.ventricularLengthSensitivityScale;
  if (![.8, 1].includes(lengthSensitivityScale)) {
    throw new Error("unsupported bounded fixed-reference length-sensitivity probe");
  }
  const lengthSensitivityChanged = lengthSensitivityScale !== 1;
  const affinity = input.ventricularAffinityCalibration;
  if (affinity !== undefined) {
    if (affinity === null || typeof affinity !== "object"
      || Object.keys(affinity).sort().join(",") !== "beta1UM,caT50RefUM"
      || !Number.isFinite(affinity.caT50RefUM) || !Number.isFinite(affinity.beta1UM)
      || affinity.caT50RefUM < .5 || affinity.caT50RefUM > 1.2
      || affinity.beta1UM < -2.4 || affinity.beta1UM > 0
      || affinity.caT50RefUM + .2 * affinity.beta1UM <= 0) {
      throw new Error("unsupported research affinity calibration or nonpositive capped CaT50");
    }
    if (input.ventricularLengthSensitivityScale !== undefined) {
      throw new Error("affinity calibration and length-sensitivity scaling are duplicate owners");
    }
  }
  const recruitmentProbe = input.ventricularRecruitmentDistortion === undefined
    ? { kwsScale: 1, phiScale: 1 } : input.ventricularRecruitmentDistortion;
  if (recruitmentProbe === null || typeof recruitmentProbe !== "object"
    || Object.keys(recruitmentProbe).sort().join(",") !== "kwsScale,phiScale"
    || ![.8, 1, 5, 7.5].includes(recruitmentProbe.kwsScale)
    || ![.4 / 3, .2, .4, .6, 1, 1.2].includes(recruitmentProbe.phiScale)) {
    throw new Error("unsupported bounded recruitment/distortion causal probe");
  }
  const recruitmentChanged = recruitmentProbe.kwsScale !== 1 || recruitmentProbe.phiScale !== 1;
  if (recruitmentProbe.kwsScale !== 1 && ["kws", "both"].includes(kineticRestoration)) {
    throw new Error("kws restoration and scaling are duplicate primitive owners");
  }
  const bridgeProbe = input.ventricularBridgeExit;
  if (bridgeProbe !== undefined && bridgeProbe !== "none"
    && (bridgeProbe === null || typeof bridgeProbe !== "object"
      || Object.keys(bridgeProbe).sort().join(",") !== "cooperativeGatePower,maximumRatePerSec"
      || ![15, 30, 60, 120].includes(bridgeProbe.maximumRatePerSec)
      || ![8, 16].includes(bridgeProbe.cooperativeGatePower))) {
    throw new Error("unsupported bounded bridge-exit causal probe");
  }
  const sourceBridge = source.landEquationParameters.strongBridgeDeactivationExit;
  const bridgeChanged = bridgeProbe === "none" || (bridgeProbe !== undefined
    && (bridgeProbe.maximumRatePerSec !== sourceBridge?.maximumRatePerSec
      || bridgeProbe.cooperativeGatePower !== sourceBridge?.cooperativeGatePower));
  const calciumChanged = calciumTimeScale !== 1 || calciumFloor !== sourceFloor || calciumRiseFraction !== 1
    || calciumPeak !== sourcePeak;
  if (!Number.isFinite(calciumTimeScale) || calciumTimeScale < .9 || calciumTimeScale > 1.2
    || !Number.isFinite(calciumRiseFraction) || calciumRiseFraction < .3 || calciumRiseFraction > 1
    || ![25, 26.5].includes(aeff) || ![.11, .13, sourceFloor].includes(calciumFloor)
    || ![1, 1.06, 1.07, source.landSlackStretch].includes(landSlackStretch)
    || !["none", "kuw", "kws", "both"].includes(kineticRestoration)) {
    throw new Error("unsupported bounded myocardial causal probe");
  }
  if ((calciumChanged || aeff !== 26.5 || landSlackStretch !== source.landSlackStretch || kineticRestoration !== "none" || bridgeChanged || recruitmentChanged || lengthSensitivityChanged || affinity !== undefined)
    && admissionRole !== "intervention") {
    throw new Error("myocardial causal probes are not admitted baseline fit coordinates");
  }
  if (!["baseline-candidate", "intervention"].includes(admissionRole)) {
    throw new Error("baseline reference research requires an explicit supported admission role");
  }
  const domain = admissionRole === "intervention"
    ? MAIN_WIRE_BASELINE_REFERENCE_INTERVENTION_DOMAIN_V1
    : MAIN_WIRE_BASELINE_REFERENCE_RESEARCH_DOMAIN_V1;
  if (Object.keys(parameters).sort().join(",") !== "systemicArterialComplianceScale,ventricularTrefPa") {
    throw new Error("baseline reference research requires the two declared parameters");
  }
  for (const key of ["ventricularTrefPa", "systemicArterialComplianceScale"] as const) {
    const range = domain[key], value = parameters[key];
    if (!Number.isFinite(value) || value < range.minimum || value > range.maximum) {
      throw new Error(`baseline reference research ${key} outside declared domain`);
    }
  }
  const prepared = prepareMainWireIntegratedModelFixtureInputsV3(
    input.hemodynamicResearchInputs, 1, input.mechanismResearchInputs);
  if (![60, 70].includes(prepared.hemodynamicResearchInputs.heartRateBpm)
    || Object.values(prepared.chamberMechanics.calciumDecayTimeScaleByWall).some(x => x !== 1)
    || (["LVFW", "SEP", "RVFW"] as const).some(w => prepared.chamberMechanics.activeTensionScaleByWall[w] !== 1)) {
    throw new Error("baseline reference research requires HR60/70, unit Ca and a single absolute ventricular Tref owner");
  }
  const ownedParameters = Object.freeze({ ...parameters });
  let land = scaledWallLandTrefForScaleV1(source.landEquationParameters,
    `${MAIN_WIRE_BASELINE_REFERENCE_RESEARCH_V1_ID}-${parameters.ventricularTrefPa}`,
    parameters.ventricularTrefPa / source.landEquationParameters.values.Tref,
    "explicit absolute-Tref research construction; not independently measured maximal human tension");
  if (aeff !== 26.5 || kineticRestoration !== "none") {
    const { parameterSetStableHash: _oldHash, ...baseLand } = land;
    const values = Object.freeze({ ...land.values, Aeff: aeff,
      ...(["kuw", "both"].includes(kineticRestoration) ? { kuw: sourceLand.values.kuw } : {}),
      ...(["kws", "both"].includes(kineticRestoration) ? { kws: sourceLand.values.kws } : {}) });
    const changed = { ...baseLand, parameterSetId: `${baseLand.parameterSetId}-source-Aeff-${aeff}`
        + (kineticRestoration === "none" ? "" : `-restore-${kineticRestoration}`),
      values, derived: Object.freeze(deriveLand2017DerivedParameters(values)),
      sourceParameters: Object.freeze(land.sourceParameters.map(entry => values[entry.parameter] === land.values[entry.parameter] ? entry :
        Object.freeze({ ...entry, location: `${entry.location}; isolated source primitive restoration, other selected primitives retained`,
          runtime: Object.freeze({ ...entry.runtime, value: values[entry.parameter] }) }))) };
    land = Object.freeze({ ...changed, parameterSetStableHash: stableLandHash(changed) });
  }
  if (bridgeChanged) {
    const { parameterSetStableHash: _oldHash, strongBridgeDeactivationExit: _oldExit, ...baseLand } = land;
    const extension = bridgeProbe === "none" ? undefined
      : createLand2017StrongBridgeDeactivationExitV2(bridgeProbe!.maximumRatePerSec, bridgeProbe!.cooperativeGatePower);
    const changed = { ...baseLand,
      parameterSetId: `${baseLand.parameterSetId}-bridge-exit-`
        + (extension === undefined ? "none" : `${extension.maximumRatePerSec}-power-${extension.cooperativeGatePower}`),
      ...(extension === undefined ? {} : { strongBridgeDeactivationExit: extension }) };
    land = Object.freeze({ ...changed, parameterSetStableHash: stableLandHash(changed) });
  }
  if (recruitmentChanged) {
    const { parameterSetStableHash: _oldHash, ...baseLand } = land;
    const values = Object.freeze({ ...land.values, kws: land.values.kws * recruitmentProbe.kwsScale,
      phi: land.values.phi * recruitmentProbe.phiScale });
    const changed = { ...baseLand,
      parameterSetId: `${baseLand.parameterSetId}-kws-scale-${recruitmentProbe.kwsScale}-phi-scale-${recruitmentProbe.phiScale}`,
      values, derived: Object.freeze(deriveLand2017DerivedParameters(values)),
      sourceParameters: Object.freeze(land.sourceParameters.map(entry => values[entry.parameter] === land.values[entry.parameter] ? entry :
        Object.freeze({ ...entry, location: `${entry.location}; bounded whole-organ recruitment/distortion sensitivity, not a source restoration or measured human normal interval`,
          runtime: Object.freeze({ ...entry.runtime, value: values[entry.parameter] }) }))) };
    land = Object.freeze({ ...changed, parameterSetStableHash: stableLandHash(changed) });
  }
  if (lengthSensitivityChanged || affinity !== undefined) {
    const { parameterSetStableHash: _oldHash, ...baseLand } = land;
    const values = Object.freeze({ ...land.values,
      CaT50Ref: affinity?.caT50RefUM ?? land.values.CaT50Ref,
      beta1: affinity?.beta1UM ?? land.values.beta1 * lengthSensitivityScale });
    const changed = { ...baseLand, parameterSetId: affinity === undefined
      ? `${baseLand.parameterSetId}-fixed-reference-length-slope-${lengthSensitivityScale}`
      : `${baseLand.parameterSetId}-affinity-${values.CaT50Ref}-${values.beta1}`,
      values, derived: Object.freeze(deriveLand2017DerivedParameters(values)),
      sourceParameters: Object.freeze(land.sourceParameters.map(entry => !(affinity === undefined
        ? entry.parameter === "beta1" : ["beta1", "CaT50Ref"].includes(entry.parameter)) ? entry
        : Object.freeze({ ...entry, location: affinity === undefined
          ? `${entry.location}; fixed-CaT50Ref intact/organ transfer sensitivity, not a refit of the source skinned-cell dataset`
          : `${entry.location}; research intact/organ affinity transfer; joint reference and slope; not a refit of human data`,
          runtime: Object.freeze({ ...entry.runtime, value: values[entry.parameter] }) }))) };
    land = Object.freeze({ ...changed, parameterSetStableHash: stableLandHash(changed) });
  }
  const tau = canonicalizeDerivedExactEventCalciumParameterV1(sourceCalcium.ventricular.riseTimeConstantSec * calciumTimeScale);
  const calciumProbeId = `${MAIN_WIRE_BASELINE_REFERENCE_RESEARCH_V1_ID}-Ca-time-${calciumTimeScale}`
    + (calciumRiseFraction === 1 ? "" : `-rise-fraction-${calciumRiseFraction}`)
    + (calciumFloor === sourceFloor ? "" : `-floor-${calciumFloor}`)
    + (calciumPeak === sourcePeak ? "" : `-peak-${calciumPeak}`);
  const calcium = !calciumChanged ? sourceCalcium : Object.freeze({ ...sourceCalcium,
    parameterSetId: calciumProbeId,
    ventricular: Object.freeze({ ...sourceCalcium.ventricular,
      riseTimeConstantSec: canonicalizeDerivedExactEventCalciumParameterV1(tau * calciumRiseFraction), decayTimeConstantSec: tau,
      ...(calciumFloor === sourceFloor && calciumPeak === sourcePeak ? {} : { diastolicCalciumUM: calciumFloor,
        peakAmplitudeUM: calciumPeak - calciumFloor }) }) });
  const material = Object.freeze({ ...source,
    parameterSetId: `${source.parameterSetId}-reference-${parameters.ventricularTrefPa}`,
    landSlackStretch,
    landEquationParameters: land });
  const identity = stableHash(sanitizeForStableHash({ parameters: ownedParameters,
    ...(aorticRootInertanceScale === 1 ? {} : { aorticRootInertanceScale }),
    ...(!calciumChanged ? {} : { calcium }),
    hemodynamicResearchInputs: prepared.hemodynamicResearchInputs,
    mechanismResearchInputs: prepared.mechanismResearchInputs, material }));
  const fixture = assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3(prepared, {
    createProvider: () => createNormalAdultProviderFromKernels("on",
      createMaterialKernelsWithMechanicsResearchInputsV1(prepared.chamberMechanics, material,
        MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1),
      `-${MAIN_WIRE_BASELINE_REFERENCE_RESEARCH_V1_ID}-${identity}`),
    createVascularRuntime: () => Object.freeze({
      venousTone: prepared.hemodynamicResearchInputs.venousTone,
      arterialStiffness: prepared.hemodynamicResearchInputs.arterialStiffness,
      systemicArterialComplianceResearchScale: parameters.systemicArterialComplianceScale,
      ...(input.aorticRootInertanceScale === undefined ? {} : {
        aorticRootInertanceResearchScale: aorticRootInertanceScale }),
      algebraicPulmonaryArterialRootProfile: MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
    }),
    createCalciumDriveParams: () => calcium,
    createRhythm: cycleLengthSec => {
      const baseRhythm = createMainWireIntegratedRegularSinusRhythmV3({
        idPrefix: "rounded-ejection-v1",
        parameterProvenanceSourceId: MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
        cycleLengthSec,
      }, { profileId: MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
        heartRateBpm: prepared.hemodynamicResearchInputs.heartRateBpm });
      if (!calciumChanged) return baseRhythm;
      const ventricular = convertPeriodicBiexponentialToExactEventCalciumV1(calcium.ventricular, cycleLengthSec);
      const { configurationSchemaId: _schema, schemaVersion: _version, ...baseConfiguration } = baseRhythm.configuration;
      const configuration = createAcceptedComposedRhythmTransactionConfigurationV2({ ...baseConfiguration,
        configurationId: calciumProbeId,
        calciumParametersByWall: { ...baseConfiguration.calciumParametersByWall,
          LVFW: ventricular.parameters, SEP: ventricular.parameters, RVFW: ventricular.parameters } });
      const history = baseRhythm.state;
      const atrial = history.electricalCaptureState.atrialGate;
      if (atrial.lastCapturedActivationId === null || atrial.lastCapturedActivationTimeSec === null) {
        throw new Error("research calcium requires the source periodic capture history");
      }
      const state = initializeAcceptedComposedRhythmTransactionStateV2(configuration, {
        acceptedTimeSec: 0, regularFirstFutureActivationTimeSec: history.regularAtrialSourceState!.nextActivationTimeSec,
        regularFirstSourceSequence: 0,
        priorAcceptedAtrialCapture: { capturedActivationId: atrial.lastCapturedActivationId,
          activationTimeSec: atrial.lastCapturedActivationTimeSec },
        priorAcceptedVentricularActivation: history.ventricularIntervalStrengthState.initialPriorAcceptedVentricularActivation,
        initialNormalizedSrLoadState: history.ventricularIntervalStrengthState.initialNormalizedSrLoadState,
        calciumStateByWall: { ...history.calciumStateByWall,
          LVFW: ventricular.periodicStateImmediatelyAfterEvent, SEP: ventricular.periodicStateImmediatelyAfterEvent,
          RVFW: ventricular.periodicStateImmediatelyAfterEvent } });
      return Object.freeze({ configuration, state });
    },
  });
  return Object.freeze({ ...fixture, researchConstructionId: MAIN_WIRE_BASELINE_REFERENCE_RESEARCH_V1_ID,
    researchParameterIdentity: identity, researchParameters: ownedParameters,
    researchAorticRootInertanceScale: aorticRootInertanceScale,
    researchCalciumTimeScale: calciumTimeScale, researchVentricularAeff: aeff,
    researchCalciumRiseFraction: calciumRiseFraction,
    researchDiastolicCalciumUM: calciumFloor, researchLandSlackStretch: landSlackStretch,
    ...(input.ventricularPeakCalciumUM === undefined ? {} : { researchPeakCalciumUM: calciumPeak }),
    researchKineticRestoration: kineticRestoration,
    researchBridgeExit: land.strongBridgeDeactivationExit ?? null,
    researchRecruitmentDistortion: Object.freeze({ ...recruitmentProbe }),
    researchLengthSensitivityScale: lengthSensitivityScale,
    ...(affinity === undefined ? {} : { researchAffinityCalibration: Object.freeze({ ...affinity }) }),
    researchLandParameters: land,
    researchClaim: Object.freeze({ productionModel: false, clinicalNormality: false, admissionRole,
      newContinuousState: false, calciumOrKineticsChanged: calciumChanged || aeff !== 26.5 || kineticRestoration !== "none" || bridgeChanged || recruitmentChanged,
      geometryToLandStretchCouplingChanged: landSlackStretch !== source.landSlackStretch,
      lengthDependentCalciumSensitivityChanged: lengthSensitivityChanged || affinity !== undefined,
      calciumSourceFitRetained: !calciumChanged,
      calciumProbeRole: "time-shape-or-floor-counterfactual-not-source-calibration-or-physiological-normal-range",
      primitiveOwners: "absolute-common-ventricular-Tref-and-systemic-arterial-PV-amplitude",
      additionalCausalProbes: Object.freeze({ aorticRootInertanceScale,
        ventricularCalciumTimeScale: calciumTimeScale, ventricularAeff: aeff,
        ventricularCalciumRiseFraction: calciumRiseFraction,
        ventricularDiastolicCalciumUM: calciumFloor, ventricularLandSlackStretch: landSlackStretch,
        ...(input.ventricularPeakCalciumUM === undefined ? {} : { ventricularPeakCalciumUM: calciumPeak }),
        ventricularKineticRestoration: kineticRestoration,
        ventricularBridgeExit: land.strongBridgeDeactivationExit ?? null,
        ventricularRecruitmentDistortion: Object.freeze({ ...recruitmentProbe }),
        ventricularLengthSensitivityScale: lengthSensitivityScale,
        ...(affinity === undefined ? {} : { ventricularAffinityCalibration: Object.freeze({ ...affinity }) }) }),
      unsupportedPublishedCheckpointExport: true }) });
}

/** Reuse the existing exact stepping and fixed-tone analysis seams without
 * creating or restoring a published Standard70 session under new parameters. */
export class MainWireBaselineReferenceResearchSessionV1 extends MainWireIntegratedTypedAuthoritySessionV1 {
  constructor(private readonly researchRuntime: ReturnType<typeof createMainWireBaselineReferenceResearchV1>,
    acceptedState: ReturnType<typeof forkMainWireIntegratedModelAtFixedTbvV3>,
    private readonly onResearchFork?: (branch: MainWireBaselineReferenceResearchSessionV1) => void,
    readonly researchNumericalStepSec: number = .002) {
    super(researchRuntime as unknown as MainWireIntegratedModelRuntimeV3, acceptedState,
      "hemodynamic-input-warm-start", null, undefined, undefined, null, acceptedState);
    if (![.001, .002].includes(researchNumericalStepSec)) throw new Error("research numerical step must be 1 or 2 ms");
  }

  /** Research-only resolution qualification. The formal protocol may request
   * coarser observations; every accepted solver interval is still <= this step.
   * This numerical setting is carried by forks, never by a published identity. */
  override advanceStructuralAnalysisToPresentationTimeV1(targetTimeSec: number) {
    const initial = this.currentAcceptedState();
    if (this.researchNumericalStepSec === .002 || !Number.isFinite(targetTimeSec)
      || targetTimeSec <= initial.acceptedTimeSec) return super.advanceStructuralAnalysisToPresentationTimeV1(targetTimeSec);
    let count = 0, clipped = 0;
    const substeps = [];
    let ordinal = 1;
    while (this.currentAcceptedState().acceptedTimeSec < targetTimeSec) {
      const next = Math.min(targetTimeSec, initial.acceptedTimeSec + ordinal * this.researchNumericalStepSec);
      const advance = super.advanceStructuralAnalysisToPresentationTimeV1(next);
      if (advance.status === "failed") return Object.freeze({ ...advance,
        requestedPresentationTimeSec: targetTimeSec,
        partiallyAdvanced: count > 0 || advance.partiallyAdvanced,
        internalAcceptedSubstepCount: count + advance.internalAcceptedSubstepCount,
        boundaryClippedSubstepCount: clipped + (advance.boundaryClippedSubstepCount ?? 0),
        substeps: Object.freeze([...substeps, ...(advance.substeps ?? [])]) });
      if (advance.status !== "advanced") throw new Error("research subinterval unexpectedly did not advance");
      count += advance.internalAcceptedSubstepCount;
      clipped += advance.boundaryClippedSubstepCount;
      substeps.push(...advance.substeps);
      if (next === targetTimeSec) return Object.freeze({ ...advance,
        acceptedRevisionSpanFromPrevious: advance.acceptedRevision - initial.revision,
        internalAcceptedSubstepCount: count, boundaryClippedSubstepCount: clipped,
        substeps: Object.freeze(substeps) });
      ordinal++;
    }
    throw new Error("research numerical advance lost its target");
  }

  forkAtFixedGlobalTotalBloodVolume(targetGlobalTotalBloodVolumeMl: number) {
    const branch = new MainWireBaselineReferenceResearchSessionV1(this.researchRuntime,
      forkMainWireIntegratedModelAtFixedTbvV3({ source: this.currentAcceptedState(),
        runtime: this.researchRuntime, targetGlobalTotalBloodVolumeMl }), this.onResearchFork, this.researchNumericalStepSec);
    this.onResearchFork?.(branch);
    return branch;
  }

  forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(targetGlobalTotalBloodVolumeMl: number) {
    const branch = new MainWireBaselineReferenceResearchSessionV1(this.researchRuntime,
      forkMainWireIntegratedModelResponsiveStarlingV3({ source: this.currentAcceptedState(),
        runtime: this.researchRuntime, targetGlobalTotalBloodVolumeMl }), this.onResearchFork, this.researchNumericalStepSec);
    this.onResearchFork?.(branch);
    return branch;
  }
}
