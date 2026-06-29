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
  type ChamberCtx,
  type ChamberInternal,
} from "@/engine/chambers";
import {
  calciumScaledLand2017LaSourceOnlyProvider,
  createModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";

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
