import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import {
  ModelCore,
  type ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";
import {
  createModelCoreActiveSourcePressureAdapterInvocationCounts,
  modelCoreActiveSourcePressureAdapterProvider,
} from "@/tools/myocardium/modelCoreActiveSourcePressureAdapter";
import {
  ActiveStressChamberModel,
  defaultActiveLA,
  defaultActiveLV,
  defaultActiveRA,
  type ChamberCtx,
  type ChamberInternal,
} from "@/engine/chambers";
import {
  LANDATRIAL_SHADOW_PARAMETER_PACK,
  createAtrialLandShadowParameterSet,
  createAtrialLandShadowSourceProvider,
} from "@/engine/myocardium/atrialLandShadow";
import {
  calciumScaledLand2017LaSourceOnlyProvider,
  createModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017";

function lvCtx(phi: number): ChamberCtx {
  return {
    HR: 75,
    contractility: 1,
    relaxation: 1,
    phi,
    chamber: "LV",
    tmaxScale: 1,
    geomScale: 1,
    caReleaseScale: 1,
    pairedVentricleVolumeMl: 100,
    pairedVentricleShortening01: 0.35,
    pairedVentricleShorteningVelocity01PerSec: 0.2,
    inletValveOpen01: 0,
    outletValveOpen01: 1,
    side: "left",
  };
}

function laCtx(phi: number): ChamberCtx {
  return {
    HR: 75,
    contractility: 1,
    relaxation: 1,
    phi,
    chamber: "LA",
    avDelaySec: 0.16,
    atrialElectromechanicalDelaySec: 0,
    tmaxScale: 1,
    geomScale: 1,
    caReleaseScale: 1,
    pairedVentricleVolumeMl: 70,
    pairedVentricleShortening01: 0.6,
    pairedVentricleShorteningVelocity01PerSec: 1.2,
    inletValveOpen01: 0,
    outletValveOpen01: 1,
    side: "left",
  };
}

function modelCoreSourceOnlyProvider(
  sourceActiveStressPa: ModelCoreExperimentalActiveSourceProvider["sourceActiveStressPa"],
): ModelCoreExperimentalActiveSourceProvider {
  return {
    sourceProviderId: "test-source-only-active-provider-v1",
    initialInternal: ({ activeModel }) => activeModel.initialInternal(),
    sourceActiveStressPa,
    internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx }) =>
      activeModel.internalDerivatives(volumeMl, internal, chamberCtx),
    debugActiveStressTerms: ({ activeModel, volumeMl, internal, chamberCtx }) =>
      activeModel.debugActiveStressTerms(volumeMl, internal, chamberCtx),
  };
}

describe("ActiveStressChamberModel source active-fiber pressure adapter", () => {
  it("assembles the same pressure when supplied the model's own active fiber stress", () => {
    const model = new ActiveStressChamberModel(defaultActiveLV);
    const internal: ChamberInternal = {
      c: 0.55,
      a: 0.42,
      r: 0.1,
      tensionPa: 18000,
      lambdaAct: 1.02,
    };

    for (const [volumeMl, phi] of [[65, 0.18], [100, 0.32], [140, 0.47]] as const) {
      const ctx = lvCtx(phi);
      const directPressure = model.pressure(volumeMl, internal, ctx);
      const sourceStress = model.debugActiveStressTerms(volumeMl, internal, ctx).sigmaAct;
      const sourcePressure = model.pressureFromActiveFiberStress(volumeMl, internal, ctx, sourceStress);
      const sourceTerms = model.debugPressureTermsFromActiveFiberStress(volumeMl, internal, ctx, sourceStress);

      expect(sourcePressure).toBeCloseTo(directPressure, 12);
      expect(sourceTerms.pressureMmHg).toBeCloseTo(directPressure, 12);
      expect(sourceTerms.sigmaAct).toBeCloseTo(sourceStress, 12);
    }
  });

  it("rejects non-finite source active fiber stress", () => {
    const model = new ActiveStressChamberModel(defaultActiveLV);
    expect(() =>
      model.pressureFromActiveFiberStress(100, model.initialInternal(), lvCtx(0.25), Number.NaN)
    ).toThrow(/finite/);
  });

  it("rejects negative source active fiber stress instead of silently clamping it", () => {
    const model = new ActiveStressChamberModel(defaultActiveLV);
    expect(() =>
      model.pressureFromActiveFiberStress(100, model.initialInternal(), lvCtx(0.25), -1)
    ).toThrow(/nonnegative/);
  });

  it("exposes an explicit signed source-stress adapter without changing the source-only invariant", () => {
    const model = new ActiveStressChamberModel(defaultActiveLA);
    const internal: ChamberInternal = {
      c: 0.42,
      a: 0.34,
      r: 0,
      tensionPa: 0,
      lambdaAct: 1,
    };
    const ctx = laCtx(0.24);
    const volumeMl = 45;
    const signedTerms = model.debugPressureTermsFromSignedActiveFiberStress(volumeMl, internal, ctx, -1.5);

    expect(signedTerms.sigmaAct).toBeCloseTo(-1.5, 12);
    expect(Number.isFinite(signedTerms.pressureMmHg)).toBe(true);
    expect(() =>
      model.pressureFromActiveFiberStress(volumeMl, internal, ctx, -1.5)
    ).toThrow(/nonnegative/);
  });

  it("propagates negative source stress rejection through ModelCore pressure assembly", () => {
    expect(() =>
      new ModelCore(DEFAULT_PARAMS, {
        activeSourceProviders: {
          LV: modelCoreSourceOnlyProvider(() => -1),
        },
      })
    ).toThrow(/nonnegative/);
  });

  it("rejects source-only providers that also define pressure-like overrides", () => {
    const provider: ModelCoreExperimentalActiveSourceProvider = {
      ...modelCoreSourceOnlyProvider(() => 0),
      pressure: () => 0,
      passivePressure: () => 0,
      debugPressureTerms: ({ activeModel, volumeMl, internal, chamberCtx }) =>
        activeModel.debugPressureTerms(volumeMl, internal, chamberCtx),
    };

    expect(() =>
      new ModelCore(DEFAULT_PARAMS, { activeSourceProviders: { LV: provider } })
    ).toThrow(/must not define pressure, passivePressure, debugPressureTerms/);
  });

  it("rejects source-only providers without source-specific active-stress diagnostics", () => {
    const provider: ModelCoreExperimentalActiveSourceProvider = {
      sourceProviderId: "test-source-only-active-provider-without-debug-v1",
      initialInternal: ({ activeModel }) => activeModel.initialInternal(),
      sourceActiveStressPa: () => 0,
      internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx }) =>
        activeModel.internalDerivatives(volumeMl, internal, chamberCtx),
    };

    expect(() =>
      new ModelCore(DEFAULT_PARAMS, { activeSourceProviders: { LV: provider } })
    ).toThrow(/source-specific debugActiveStressTerms/);
  });

  it("uses the same AV-plane-adjusted atrial lambda for Land source input and pressure adaptation", () => {
    const model = new ActiveStressChamberModel(defaultActiveLA);
    const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const provider = calciumScaledLand2017LaSourceOnlyProvider(instrumentation, {
      calciumScale: 1,
      calciumInputMultiplier: "none",
    });
    const internal: ChamberInternal = {
      c: 0.42,
      a: 0.34,
      r: 0,
      tensionPa: 0,
      lambdaAct: 1,
    };
    const ctx = laCtx(0.24);
    const volumeMl = 45;
    const providerState = provider.initialProviderState?.({ chamber: "LA", activeModel: model });

    provider.sourceActiveStressPa?.({
      chamber: "LA",
      activeModel: model,
      volumeMl,
      internal,
      chamberCtx: ctx,
      providerState,
      providerStateVersion: 0,
    });

    const pressureAdapterStrain = model.debugPressureTerms(volumeMl, internal, ctx).lambda - 1;
    const rawDebugStrain = model.debugActiveStressTerms(volumeMl, internal, ctx).lambdaRaw - 1;
    expect(rawDebugStrain).not.toBeCloseTo(pressureAdapterStrain, 8);
    expect(instrumentation.sourcePathAudit.fiberEngineeringStrain.min)
      .toBeCloseTo(pressureAdapterStrain, 12);
    expect(instrumentation.sourcePathAudit.fiberEngineeringStrain.max)
      .toBeCloseTo(pressureAdapterStrain, 12);
  });

  it("exposes AV-plane effective wall geometry for atrial chamber readbacks", () => {
    const model = new ActiveStressChamberModel(defaultActiveLA);
    const ctx = laCtx(0.24);
    const geometry = model.debugGeometryTerms(45, ctx);
    const noDescent = model.debugGeometryTerms(45, {
      ...ctx,
      pairedVentricleShortening01: 0,
      pairedVentricleShorteningVelocity01PerSec: 0,
    });

    expect(geometry.avPlaneDescent01).toBeGreaterThan(0);
    expect(geometry.effectiveVolumeCorrectionMl).toBeGreaterThan(0);
    expect(geometry.wallVolumeMl).toBeLessThan(geometry.rawVolumeMl);
    expect(geometry.lambda).toBeLessThan(geometry.lambdaWithoutAvPlane);
    expect(noDescent.effectiveVolumeCorrectionMl).toBeCloseTo(0, 12);
  });

  it("defines a LandAtrial shadow parameter pack without changing source Tref", () => {
    const pack = LANDATRIAL_SHADOW_PARAMETER_PACK;
    expect(pack.sourceTrefUnchanged).toBe(true);
    expect(pack.chamberParameterSets.LA.values.Tref)
      .toBe(LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.Tref);
    expect(pack.chamberParameterSets.RA.values.Tref)
      .toBe(LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.Tref);
    expect(pack.chamberParameterSets.LA.values.ku)
      .not.toBe(LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.ku);
    expect(pack.chamberParameterSets.RA.values.CaT50Ref)
      .not.toBe(LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.CaT50Ref);
    expect(pack.chamberParameterSets.RA.values.CaT50Ref).toBe(0.90);
    expect(pack.chamberParameterSets.RA.values.ku).toBe(750);
  });

  it("creates deterministic atrial Land shadow parameter-set variants without Tref scaling", () => {
    const base = LANDATRIAL_SHADOW_PARAMETER_PACK.chamberParameterSets.RA;
    const variant = createAtrialLandShadowParameterSet("RA", {
      parameterSetIdSuffix: "test-desensitized",
      runtimeValueOverrides: { CaT50Ref: 0.95, ku: 700 },
    });

    expect(variant.parameterSetId).toContain("test-desensitized");
    expect(variant.values.Tref).toBe(LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.Tref);
    expect(variant.values.CaT50Ref).toBe(0.95);
    expect(variant.values.ku).toBe(700);
    expect(variant.parameterSetStableHash).not.toBe(base.parameterSetStableHash);
  });

  it("creates a signed LandAtrial shadow provider using atrial geometry", () => {
    const model = new ActiveStressChamberModel(defaultActiveRA);
    const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const provider = createAtrialLandShadowSourceProvider("RA", instrumentation, {
      commitScheme: "BE",
      calciumScale: 1,
      calciumInputMultiplier: "none",
    });
    const internal: ChamberInternal = {
      c: 0.42,
      a: 0.34,
      r: 0,
      tensionPa: 0,
      lambdaAct: 1,
    };
    const ctx: ChamberCtx = {
      ...laCtx(0.24),
      chamber: "RA",
      side: "right",
      pairedVentricleVolumeMl: 90,
      pairedVentricleShortening01: 0.5,
      pairedVentricleShorteningVelocity01PerSec: 0.8,
    };
    const providerState = provider.initialProviderState?.({ chamber: "RA", activeModel: model });
    const pressure = provider.pressure?.({
      chamber: "RA",
      activeModel: model,
      volumeMl: 45,
      internal,
      chamberCtx: ctx,
      providerState,
      providerStateVersion: 0,
    });

    expect(provider.sourceProviderId).toContain("landatrial-fast-lowpressure-shadow-v1");
    expect(Number.isFinite(pressure)).toBe(true);
    expect(instrumentation.sourcePathAudit.sampleCount).toBeGreaterThan(0);
  });

  it("source pressure adapter factory requires and invokes source-specific debug terms", () => {
    const counts = createModelCoreActiveSourcePressureAdapterInvocationCounts();
    const provider = modelCoreActiveSourcePressureAdapterProvider({
      sourceProviderId: "test-source-pressure-adapter-factory-v1",
      invocationCounts: counts,
      readSourceActiveStressPa: () => 0,
      debugActiveStressTerms: ({ activeModel, volumeMl, internal, chamberCtx }) =>
        activeModel.debugActiveStressTerms(volumeMl, internal, chamberCtx),
    });
    const core = new ModelCore(DEFAULT_PARAMS, { activeSourceProviders: { LV: provider } });

    expect(core.debugActiveStressDiagnostics().LV).toBeDefined();
    expect(counts.debugActiveStressTerms).toBeGreaterThan(0);
  });
});
