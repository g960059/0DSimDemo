import checkpointV1 from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json";

import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  warmStartMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
import type {
  MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  createMainWireIntegratedRegularSinusRhythmV3,
} from "@/engine/myocardium/MainWireIntegratedRegularSinusRhythmV3";
import {
  resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
import {
  measureMainWireIntegratedModelBaselineValidationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  prepareMainWireIntegratedModelFixtureInputsV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  createNormalAdultProviderFromMaterial,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1,
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1,
} from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import {
  deriveLand2017DerivedParameters,
  createLand2017StrongBridgeDeactivationExitV2,
  stableHash,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";

const sourceFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1();
const restored =
  await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    .restoreStandard68ExactCheckpoint(checkpointV1);
const sourceAccepted = restored.currentAcceptedState();
const candidates = [8, 12, 16].flatMap((exitGatePower) =>
  [30, 60, 120].map((exitRatePerSec) => Object.freeze({
    kuw: 104,
    kws: 4.8,
    exitRatePerSec,
    exitGatePower,
  })));
const rows = candidates.map(({ kuw, kws, exitRatePerSec, exitGatePower }) => {
  const fixture = candidateFixtureV1(
    kuw,
    kws,
    exitRatePerSec,
    exitGatePower,
  );
  let accepted = warmStartMainWireIntegratedModelV3({
    source: sourceAccepted,
    sourceRuntime: sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
    targetRuntime: fixture as unknown as MainWireIntegratedModelRuntimeV3,
  });
  let trace = [] as ReturnType<
    typeof runMainWireIntegratedModelRegularSinusAllOffCycleV3
  >["traceSamples"];
  for (let ordinal = 1; ordinal <= 8; ordinal += 1) {
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      fixture,
      accepted,
      136 + ordinal,
      0.002,
    );
    accepted = run.terminalAcceptedState;
    trace = run.traceSamples;
  }
  const measured = measureMainWireIntegratedModelBaselineValidationV1(trace);
  const lv = trace.map((sample) => sample.chamberVolumeMl.LV);
  const ao = trace.map((sample) => sample.absolutePressureMmHg.Ao);
  return Object.freeze({
    kuw,
    kws,
    exitRatePerSec,
    exitGatePower,
    etMs: 1_000 * measured.aorticValve.ejectionTimeSec,
    ictMs: 1_000 * measured.timing.ictSec,
    irtMs: 1_000 * measured.timing.irtSec,
    tei: measured.timing.teiIndex,
    meanGradient: measured.aorticValve.meanGradientMmHg,
    peakGradient: measured.aorticValve.peakGradientMmHg,
    lvPositiveDpDt: measured.leftVentricle.maximumDpDtMmHgPerSec,
    lvNegativeDpDt: measured.leftVentricle.minimumDpDtMmHgPerSec,
    eToA: measured.mitralFlow.peakEToA,
    lvpPeaks: measured.LVP.significantPeakCount,
    lvpVariation: measured.LVP.totalVariationRatio,
    lvpRoundness: measured.LVP.centralRangeFraction,
    rvpPeaks: measured.RVP.significantPeakCount,
    rvpVariation: measured.RVP.totalVariationRatio,
    rvpRoundness: measured.RVP.centralRangeFraction,
    strokeVolumeMl: Math.max(...lv) - Math.min(...lv),
    meanAoPressureMmHg: ao.reduce((sum, value) => sum + value, 0) / ao.length,
  });
});
process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);

function candidateFixtureV1(
  kuw: number,
  kws: number,
  exitRatePerSec: number,
  exitGatePower: number,
):
  MainWireIntegratedModelRegularSinusAllOffFixtureV3 {
  const prepared = prepareMainWireIntegratedModelFixtureInputsV3(
    MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    1,
    MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  );
  const wallMaterial = candidateWallMaterialV1(
    kuw,
    kws,
    exitRatePerSec,
    exitGatePower,
  );
  return assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    prepared,
    {
      createProvider: () => createNormalAdultProviderFromMaterial(
        "on",
        NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled,
        wallMaterial,
        `-rounded-relaxation-sweep-kuw-${kuw}-kws-${kws}`
          + `-exit-${exitRatePerSec}-power-${exitGatePower}`,
        MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1,
      ),
      createVascularRuntime: () => Object.freeze({
        venousTone: prepared.hemodynamicResearchInputs.venousTone,
        arterialStiffness:
          prepared.hemodynamicResearchInputs.arterialStiffness,
      }),
      createCalciumDriveParams: () =>
        resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(
          prepared.hemodynamicResearchInputs.heartRateBpm,
        ),
      createRhythm: (cycleLengthSec) =>
        createMainWireIntegratedRegularSinusRhythmV3(
          {
            idPrefix: "rounded-ejection-v1",
            parameterProvenanceSourceId:
              MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_ID,
            cycleLengthSec,
          },
          {
            profileId:
              "main-wire-integrated-matched-alpha-fixed-regular-sinus-profile-v1",
            heartRateBpm:
              prepared.hemodynamicResearchInputs.heartRateBpm,
          },
        ),
    },
  ) as unknown as MainWireIntegratedModelRegularSinusAllOffFixtureV3;
}

function candidateWallMaterialV1(
  kuw: number,
  kws: number,
  exitRatePerSec: number,
  exitGatePower: number,
) {
  const source =
    MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1
      .landEquationParameters;
  const values = Object.freeze({ ...source.values, kuw, kws });
  const input: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    ...source,
    parameterSetId:
      `rounded-relaxation-sweep-kuw-${kuw}-kws-${kws}`
        + `-exit-${exitRatePerSec}-power-${exitGatePower}`,
    values,
    derived: Object.freeze(deriveLand2017DerivedParameters(values)),
    sourceParameters: Object.freeze(source.sourceParameters.map((entry) =>
      Object.freeze({
        ...entry,
        original: Object.freeze({ ...entry.original }),
        runtime: Object.freeze({
          ...entry.runtime,
          value: values[entry.parameter],
        }),
      }))),
    derivedParameters: Object.freeze(source.derivedParameters.map((entry) =>
      Object.freeze({ ...entry }))),
    strongBridgeDeactivationExit:
      createLand2017StrongBridgeDeactivationExitV2(
        exitRatePerSec,
        exitGatePower,
      ),
  };
  const parameters = Object.freeze({
    ...input,
    parameterSetStableHash: stableHash(input),
  });
  return Object.freeze({
    ...MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1,
    parameterSetId: `${input.parameterSetId}-wall`,
    landEquationParameters: parameters,
  });
}
