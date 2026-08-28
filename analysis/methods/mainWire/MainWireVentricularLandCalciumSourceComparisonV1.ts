import type {
  MainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import type {
  MainWireVentricularCalciumSourceProtocolIdV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceProtocolsV1";

export const MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_COMPARISON_V1_ID =
  "main-wire-ventricular-land-calcium-source-comparison-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_INPUT_IDS_V1 =
  Object.freeze([
    "current-analytic-biexponential",
    "land2015-coppini-metric-hunter-construction",
    "land2017-figure6-coppini-digitized",
  ] as const);

export const MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_STRETCH_CONTEXTS_V1 =
  Object.freeze([
    Object.freeze({
      contextId: "Land-source-resting-extension-ratio" as const,
      fixedLandStretch: 1 as const,
    }),
    Object.freeze({
      contextId: "normal-prior-loaded-reference-stretch" as const,
      fixedLandStretch: 1.1 as const,
    }),
  ] as const);

export type MainWireVentricularLandCalciumSourceInputIdV1 =
  | "current-analytic-biexponential"
  | MainWireVentricularCalciumSourceProtocolIdV1;

export type MainWireVentricularLandCalciumSourceStretchContextIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_STRETCH_CONTEXTS_V1)[number]["contextId"];

export const MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_COMPARISON_CLAIM_V1 =
  Object.freeze({
    role: "offline-prescribed-calcium-to-Land-source-audit" as const,
    currentExactModelChanged: false as const,
    commonLandParametersAcrossInputs: true as const,
    commonIntegrationPolicyAcrossInputs: true as const,
    independentPeriodicClosurePerArm: true as const,
    sourceTraceReproductionClaimed: false as const,
    digitizedTraceIsOriginalNumericSourceData: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireVentricularLandCalciumSourceArmInputV1 = Readonly<{
  inputId: MainWireVentricularLandCalciumSourceInputIdV1;
  stretchContextId: MainWireVentricularLandCalciumSourceStretchContextIdV1;
  audit: MainWireVentricularLandIsometricTwitchAuditV1;
}>;

export type MainWireVentricularLandCalciumSourceArmSummaryV1 = Readonly<{
  inputId: MainWireVentricularLandCalciumSourceInputIdV1;
  stretchContextId: MainWireVentricularLandCalciumSourceStretchContextIdV1;
  calciumInputKind:
    MainWireVentricularLandIsometricTwitchAuditV1["calciumInput"]["kind"];
  fixedLandStretch: number;
  periodicClosureConverged: boolean;
  maximumLandStateClosureResidual: number;
  calciumMinimumUM: number;
  calciumPeakUM: number;
  calciumTimeToPeakSec: number;
  calciumRelaxationTime50Sec: number | null;
  calciumRelaxationTime95Sec: number | null;
  calciumLocalPeakCountAboveFivePercentAmplitude: number;
  activeTwitchMinimumKPa: number;
  activeTwitchPeakKPa: number;
  activeTwitchTimeToPeakSec: number;
  activeTwitchRelaxationTime50Sec: number | null;
  activeTwitchRelaxationTime95Sec: number | null;
  activeTwitchLocalPeakCountAboveFivePercentAmplitude: number;
}>;

export type MainWireVentricularLandCalciumSourceContrastV1 = Readonly<{
  inputId: Exclude<
    MainWireVentricularLandCalciumSourceInputIdV1,
    "current-analytic-biexponential"
  >;
  stretchContextId: MainWireVentricularLandCalciumSourceStretchContextIdV1;
  calciumPeakRatioToCurrent: number;
  activeTwitchPeakRatioToCurrent: number;
  activeTwitchTimeToPeakDifferenceSec: number;
  activeTwitchRelaxationTime50DifferenceSec: number | null;
  activeTwitchRelaxationTime95DifferenceSec: number | null;
}>;

export type MainWireVentricularLandCalciumSourceComparisonV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_COMPARISON_V1_ID;
  arms: readonly MainWireVentricularLandCalciumSourceArmSummaryV1[];
  contrastsToCurrent: readonly MainWireVentricularLandCalciumSourceContrastV1[];
  Land2017Figure6RestingStretchTargetResiduals: Readonly<{
    cyclePhasePeakTimeMinusPublishedTptSec: number;
    publishedTptTimeOriginReconciled: false;
    activeTwitchRelaxationTime50Sec: number | null;
    activeTwitchRelaxationTime95Sec: number | null;
    activeTwitchPeakKPa: number;
    activeTwitchMinimumKPa: number;
  }>;
  allArmsPeriodicallyClosed: boolean;
  allProtocolIdentitiesDistinct: boolean;
  claim:
    typeof MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_COMPARISON_CLAIM_V1;
}>;

export function compareMainWireVentricularLandCalciumSourcesV1(
  inputs: readonly MainWireVentricularLandCalciumSourceArmInputV1[],
): MainWireVentricularLandCalciumSourceComparisonV1 {
  const byKey = new Map<string, MainWireVentricularLandIsometricTwitchAuditV1>();
  for (const input of inputs) {
    const key = armKey(input.inputId, input.stretchContextId);
    if (byKey.has(key)) throw new Error(`duplicate calcium-source arm: ${key}`);
    byKey.set(key, input.audit);
  }
  const expectedCount =
    MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_INPUT_IDS_V1.length
    * MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_STRETCH_CONTEXTS_V1.length;
  if (byKey.size !== expectedCount) {
    throw new Error(`calcium-source comparison requires exactly ${expectedCount} arms`);
  }
  for (const inputId of
    MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_INPUT_IDS_V1) {
    for (const stretch of
      MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_STRETCH_CONTEXTS_V1) {
      const audit = byKey.get(armKey(inputId, stretch.contextId));
      if (audit === undefined) {
        throw new Error(`missing calcium-source arm: ${inputId}/${stretch.contextId}`);
      }
      if (audit.protocol.fixedLandStretch !== stretch.fixedLandStretch) {
        throw new Error(`calcium-source stretch mismatch: ${inputId}/${stretch.contextId}`);
      }
    }
  }
  const arms = Object.freeze(inputs.map(({ inputId, stretchContextId, audit }) =>
    summarizeArm(inputId, stretchContextId, audit)));
  const contrasts = Object.freeze(
    MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_STRETCH_CONTEXTS_V1.flatMap(
      (stretch) => {
        const current = armByKey(
          arms,
          "current-analytic-biexponential",
          stretch.contextId,
        );
        return ([
          "land2015-coppini-metric-hunter-construction",
          "land2017-figure6-coppini-digitized",
        ] as const).map((inputId) => contrastToCurrent(
          inputId,
          stretch.contextId,
          armByKey(arms, inputId, stretch.contextId),
          current,
        ));
      },
    ),
  );
  const figureResting = armByKey(
    arms,
    "land2017-figure6-coppini-digitized",
    "Land-source-resting-extension-ratio",
  );
  const published = inputs[0]!.audit.sourceContext.publishedFinalModel;
  return Object.freeze({
    methodId:
      MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_COMPARISON_V1_ID,
    arms,
    contrastsToCurrent: contrasts,
    Land2017Figure6RestingStretchTargetResiduals: Object.freeze({
      cyclePhasePeakTimeMinusPublishedTptSec:
        figureResting.activeTwitchTimeToPeakSec - published.timeToPeakSec,
      publishedTptTimeOriginReconciled: false as const,
      activeTwitchRelaxationTime50Sec: nullableDifference(
        figureResting.activeTwitchRelaxationTime50Sec,
        published.relaxationTime50Sec,
      ),
      activeTwitchRelaxationTime95Sec: nullableDifference(
        figureResting.activeTwitchRelaxationTime95Sec,
        published.relaxationTime95Sec,
      ),
      activeTwitchPeakKPa:
        figureResting.activeTwitchPeakKPa - published.peakTensionKPa,
      activeTwitchMinimumKPa:
        figureResting.activeTwitchMinimumKPa - published.minimumTensionKPa,
    }),
    allArmsPeriodicallyClosed: arms.every((arm) =>
      arm.periodicClosureConverged),
    allProtocolIdentitiesDistinct:
      new Set(inputs.map(({ audit }) =>
        `${audit.identities.calciumInputId}/${audit.protocol.fixedLandStretch}`))
        .size === expectedCount,
    claim:
      MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_COMPARISON_CLAIM_V1,
  });
}

function summarizeArm(
  inputId: MainWireVentricularLandCalciumSourceInputIdV1,
  stretchContextId: MainWireVentricularLandCalciumSourceStretchContextIdV1,
  audit: MainWireVentricularLandIsometricTwitchAuditV1,
): MainWireVentricularLandCalciumSourceArmSummaryV1 {
  return Object.freeze({
    inputId,
    stretchContextId,
    calciumInputKind: audit.calciumInput.kind,
    fixedLandStretch: audit.protocol.fixedLandStretch,
    periodicClosureConverged: audit.periodicClosure.converged,
    maximumLandStateClosureResidual:
      audit.periodicClosure.maximumLandStateClosureResidual,
    calciumMinimumUM: audit.calcium.minimum,
    calciumPeakUM: audit.calcium.maximum,
    calciumTimeToPeakSec: audit.calcium.timeToPeakSec,
    calciumRelaxationTime50Sec: audit.calcium.relaxationTime50Sec,
    calciumRelaxationTime95Sec: audit.calcium.relaxationTime95Sec,
    calciumLocalPeakCountAboveFivePercentAmplitude:
      audit.calcium.localPeakCountAboveFivePercentAmplitude,
    activeTwitchMinimumKPa: audit.activeTwitch.minimumKPa,
    activeTwitchPeakKPa: audit.activeTwitch.peakKPa,
    activeTwitchTimeToPeakSec: audit.activeTwitch.timeToPeakSec,
    activeTwitchRelaxationTime50Sec:
      audit.activeTwitch.relaxationTime50Sec,
    activeTwitchRelaxationTime95Sec:
      audit.activeTwitch.relaxationTime95Sec,
    activeTwitchLocalPeakCountAboveFivePercentAmplitude:
      audit.activeTwitch.localPeakCountAboveFivePercentAmplitude,
  });
}

function contrastToCurrent(
  inputId: MainWireVentricularLandCalciumSourceContrastV1["inputId"],
  stretchContextId: MainWireVentricularLandCalciumSourceStretchContextIdV1,
  arm: MainWireVentricularLandCalciumSourceArmSummaryV1,
  current: MainWireVentricularLandCalciumSourceArmSummaryV1,
): MainWireVentricularLandCalciumSourceContrastV1 {
  return Object.freeze({
    inputId,
    stretchContextId,
    calciumPeakRatioToCurrent: arm.calciumPeakUM / current.calciumPeakUM,
    activeTwitchPeakRatioToCurrent:
      arm.activeTwitchPeakKPa / current.activeTwitchPeakKPa,
    activeTwitchTimeToPeakDifferenceSec:
      arm.activeTwitchTimeToPeakSec - current.activeTwitchTimeToPeakSec,
    activeTwitchRelaxationTime50DifferenceSec: nullableDifference(
      arm.activeTwitchRelaxationTime50Sec,
      current.activeTwitchRelaxationTime50Sec,
    ),
    activeTwitchRelaxationTime95DifferenceSec: nullableDifference(
      arm.activeTwitchRelaxationTime95Sec,
      current.activeTwitchRelaxationTime95Sec,
    ),
  });
}

function armByKey(
  arms: readonly MainWireVentricularLandCalciumSourceArmSummaryV1[],
  inputId: MainWireVentricularLandCalciumSourceInputIdV1,
  stretchContextId: MainWireVentricularLandCalciumSourceStretchContextIdV1,
): MainWireVentricularLandCalciumSourceArmSummaryV1 {
  const arm = arms.find((candidate) =>
    candidate.inputId === inputId
    && candidate.stretchContextId === stretchContextId);
  if (arm === undefined) throw new Error("calcium-source arm lookup failed");
  return arm;
}

function nullableDifference(
  value: number | null,
  reference: number | null,
): number | null {
  return value === null || reference === null ? null : value - reference;
}

function armKey(
  inputId: MainWireVentricularLandCalciumSourceInputIdV1,
  stretchContextId: MainWireVentricularLandCalciumSourceStretchContextIdV1,
): string {
  return `${inputId}/${stretchContextId}`;
}
