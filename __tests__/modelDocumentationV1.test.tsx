import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { STANDARD71_DOCUMENTATION_SNAPSHOT_V1 as doc71,
  standard71BaselineRowsV1, standard71BaselineInfoV1 } from "@/studio/presentation/modelDocumentation/MainWireBaselineDocumentationV1";
import { MAIN_WIRE_MODEL_MODULES_V1, STANDARD71_MODULE_IDS_V1 } from "@/studio/presentation/modelDocumentation/MainWireModelModulesV1";
import { MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard71ControlsV1";
import { MAIN_WIRE_STANDARD71_DEFAULT_FIXTURE_V1 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard71ExactModelV1";
import equationData from "@/studio/presentation/modelDocumentation/standard71-equation-data-v1.json";
import { MAIN_WIRE_EQUATION_SPECIFICATION_V1 } from "@/studio/presentation/modelDocumentation/MainWireEquationSpecificationV1";
import { ModelInlineMathV1, ModelMathLabelV1 } from "@/components/model/ModelMathV1";
import { createMainWireIntegratedModelStandard71FixtureV1, MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import { stressedVolumeFromPtm, ptmFromStressedVolume, type VascularPvLaw } from "@/engine/vascularPv";
import { stepMainWireQuasiSteadyOrificeValveV2 } from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import { writeLand2017Rhs } from "@/engine/myocardium/myofilament/land2017/equations";
import { evaluateMoyer2015AtrialEquibiaxialPassiveV1 } from "@/engine/myocardium/mechanics/moyer2015AtrialEquibiaxialPassiveV1";
import { evaluateEquilibriumOneFiberPassiveV1 } from "@/engine/myocardium/mechanics/equilibriumOneFiberPassiveV1";
import { evaluateTriSegGeometryV1, evaluateEnergyConjugateTriSegV1 } from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";

import { ModelDocumentationPage } from
  "@/components/model/ModelDocumentationPage";
import { MainWireStandard66DocumentationV1 } from
  "@/components/model/MainWireStandard66DocumentationV1";
import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1,
} from "@/engine/valves/MainWireAorticRecoveredRootProfileV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import { modelDocumentationHref } from "@/homeLinks";
import selectedAorticOutflowStandard66SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v2.json";
import algebraicProximalRootsStandard67SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-algebraic-proximal-roots-standard67-v1.json";
import roundedEjectionStandard68SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionSurfaceV1";
import qualifiedBaselineStandard69SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioQualifiedBaselineSurfaceV1";
import algebraicPulmonaryRootStandard70SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";
import {
  resolveMainWireStandard66DocumentationFactsV1,
} from "@/studio/presentation/modelDocumentation/MainWireStandard66DocumentationFactsV1";
import {
  resolveMainWireStandard68DocumentationFactsV1,
} from "@/studio/presentation/modelDocumentation/MainWireStandard68DocumentationFactsV1";
import {
  resolveRegisteredModelDisclosureV1,
  resolveRegisteredModelDocumentationV1,
} from "@/studio/presentation/modelDocumentation/RegisteredModelDocumentationV1";

const MODEL_ID =
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1;
const SURFACE_RELEASE_ID =
  selectedAorticOutflowStandard66SurfaceV1.surfaceReleaseId;
const STANDARD67_MODEL_ID =
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1;
const STANDARD67_SURFACE_RELEASE_ID =
  algebraicProximalRootsStandard67SurfaceV1.surfaceReleaseId;
const STANDARD68_MODEL_ID =
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1;
const STANDARD68_SURFACE_RELEASE_ID =
  roundedEjectionStandard68SurfaceV1.surfaceReleaseId;
const STANDARD69_MODEL_ID =
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1;
const STANDARD69_SURFACE_RELEASE_ID =
  qualifiedBaselineStandard69SurfaceV1.surfaceReleaseId;
const STANDARD70_MODEL_ID =
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1;
const STANDARD70_SURFACE_RELEASE_ID =
  algebraicPulmonaryRootStandard70SurfaceV1.surfaceReleaseId;

describe("model documentation V1", () => {
  it("builds a locale-scoped URL from the exact model and Surface release", () => {
    expect(modelDocumentationHref({
      locale: "ja",
      modelId: "model/selected:aortic",
      surfaceReleaseId: "surface/release:1",
    })).toBe(
      "/ja/models/model%2Fselected%3Aaortic?surface=surface%2Frelease%3A1",
    );
  });

  it("resolves only the registered exact model and immutable Surface pair", () => {
    const resolved = resolveRegisteredModelDocumentationV1(
      MODEL_ID,
      SURFACE_RELEASE_ID,
    );
    expect(resolved).toEqual({
      kind: "main-wire-selected-aortic-outflow-standard66",
      modelId: MODEL_ID,
      surfaceReleaseId: SURFACE_RELEASE_ID,
      surfaceSeriesId:
        selectedAorticOutflowStandard66SurfaceV1.surfaceSeriesId,
    });
    expect(resolveRegisteredModelDocumentationV1(
      `${MODEL_ID}.other`,
      SURFACE_RELEASE_ID,
    )).toBeNull();
    expect(resolveRegisteredModelDocumentationV1(
      MODEL_ID,
      `${SURFACE_RELEASE_ID}.other`,
    )).toBeNull();
    expect(resolveRegisteredModelDocumentationV1(MODEL_ID, null)).toBeNull();

    expect(resolveRegisteredModelDisclosureV1(
      MODEL_ID,
      SURFACE_RELEASE_ID,
    )).toMatchObject({
      badgeLabel: "MW 66",
      shortLabel: "Main Wire Standard 66",
      limitationsTranslationKey: "modelLimitations.standard66Items",
    });
    expect(resolveRegisteredModelDisclosureV1(
      MODEL_ID,
      `${SURFACE_RELEASE_ID}.other`,
    )).toEqual({
      documentation: null,
      badgeLabel: "MW V3",
      shortLabel: null,
      limitationsTranslationKey: "modelLimitations.items",
    });
  });

  it("derives fixed aortic facts from exact owners and labels from the Surface", () => {
    const identity = resolveRegisteredModelDocumentationV1(
      MODEL_ID,
      SURFACE_RELEASE_ID,
    );
    expect(identity).not.toBeNull();
    const facts = resolveMainWireStandard66DocumentationFactsV1(identity!);
    expect(facts).not.toBeNull();

    const profile = MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1;
    expect(facts?.aortic).toMatchObject({
      referenceMaximumForwardEoaCm2:
        profile.referenceMaximumForwardEoaCm2,
      ascendingAorticDiameterCm: profile.ascendingAorticDiameterCm,
      ascendingAorticAreaCm2: profile.ascendingAorticAreaCm2,
      characteristicImpedanceResistanceMmHgSecPerMl:
        profile.characteristicImpedanceResistanceMmHgSecPerMl,
      residualDownstreamResistanceMmHgSecPerMl:
        profile.residualDownstreamResistanceMmHgSecPerMl,
      sourceTopologyResistanceMmHgSecPerMl:
        profile.sourceTopologyResistanceMmHgSecPerMl,
    });
    expect(facts?.stations).toEqual({
      aopOutputId:
        "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port",
      abpOutputId: "hemodynamics.pressure.absolute.SA",
      rawAoNodeOutputId: "hemodynamics.pressure.absolute.Ao",
      localHydraulicGradientOutputId:
        "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV",
      venaContractaGradientOutputId:
        "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV",
    });
    expect(facts?.runtime).toMatchObject({
      heartRateControlId: "rhythm.heart-rate-bpm",
      heartRateChangeSemantics: "cold-restart",
      fixtureChangeSemantics:
        "atomic-cold-restart-at-zero-clock-new-fixture-epoch",
    });
    expect(facts?.surface).toEqual({
      rawPressureVolumeLoop: true,
      formalPressureVolumeAnalysisExposed: true,
      structuralReturnAnalysisExposed: true,
    });
  });

  it("binds Standard67 documentation to its algebraic-root exact identity", () => {
    const identity = resolveRegisteredModelDocumentationV1(
      STANDARD67_MODEL_ID,
      STANDARD67_SURFACE_RELEASE_ID,
    );
    expect(identity).toEqual({
      kind: "main-wire-algebraic-proximal-roots-standard67",
      modelId: STANDARD67_MODEL_ID,
      surfaceReleaseId: STANDARD67_SURFACE_RELEASE_ID,
      surfaceSeriesId:
        algebraicProximalRootsStandard67SurfaceV1.surfaceSeriesId,
    });
    expect(resolveRegisteredModelDisclosureV1(
      STANDARD67_MODEL_ID,
      STANDARD67_SURFACE_RELEASE_ID,
    )).toMatchObject({
      badgeLabel: "MW 67",
      shortLabel: "Main Wire Standard 67",
      limitationsTranslationKey: "modelLimitations.standard67Items",
    });

    const facts = resolveMainWireStandard66DocumentationFactsV1(identity!);
    expect(facts).toMatchObject({
      generation: 67,
      proximalArterialRoots: {
        aorticRootEdgeId: "Ao_SA",
        pulmonaryRootEdgeId: "PA_PArt",
        flowLaw: "same-candidate-algebraic-linear-quadratic",
        inertanceMmHgSec2PerMl: 0,
        acceptedRootFlowRecordRole:
          "exact-accepted-algebraic-flow-readback-not-continuation-memory",
      },
    });
    expect(resolveRegisteredModelDocumentationV1(
      STANDARD67_MODEL_ID,
      SURFACE_RELEASE_ID,
    )).toBeNull();
  });

  it("binds Standard68 documentation to its rounded-ejection Surface", () => {
    const identity = resolveRegisteredModelDocumentationV1(
      STANDARD68_MODEL_ID,
      STANDARD68_SURFACE_RELEASE_ID,
    );
    expect(identity).toEqual({
      kind: "main-wire-rounded-ejection-standard68",
      modelId: STANDARD68_MODEL_ID,
      surfaceReleaseId: STANDARD68_SURFACE_RELEASE_ID,
      surfaceSeriesId: roundedEjectionStandard68SurfaceV1.surfaceSeriesId,
    });
    expect(resolveRegisteredModelDisclosureV1(
      STANDARD68_MODEL_ID,
      STANDARD68_SURFACE_RELEASE_ID,
    )).toMatchObject({
      badgeLabel: "MW 68",
      shortLabel: "Main Wire Standard 68",
      limitationsTranslationKey: "modelLimitations.standard68Items",
    });

    const facts = resolveMainWireStandard68DocumentationFactsV1(identity!);
    expect(facts).toMatchObject({
      generation: 68,
      stations: {
        aopRole: "source-aortic-root-compliance-node",
        localPressureRecoveryModeled: false,
      },
      dynamics: {
        aorticOutflowCirculationProfileId:
          "main-wire-source-aortic-outflow-topology-v3",
        proximalArterialRootMomentum: "source-inertance",
        newContinuousStateAdded: false,
        valveOpeningStateAdded: false,
      },
      runtime: {
        heartRateChangeSemantics: "accepted-state-warm-start",
        fixtureChangeSemantics:
          "atomic-accepted-state-warm-start-bounded-tbv-continuation-new-fixture-epoch",
      },
      surface: {
        rawPressureVolumeLoop: true,
        formalPressureVolumeAnalysisExposed: true,
        structuralReturnAnalysisExposed: true,
      },
    });
  });

  it("binds Standard69 documentation to the fully inherited qualified-baseline Surface", () => {
    const identity = resolveRegisteredModelDocumentationV1(
      STANDARD69_MODEL_ID,
      STANDARD69_SURFACE_RELEASE_ID,
    );
    expect(identity).toEqual({
      kind: "main-wire-qualified-baseline-standard69",
      modelId: STANDARD69_MODEL_ID,
      surfaceReleaseId: STANDARD69_SURFACE_RELEASE_ID,
      surfaceSeriesId: qualifiedBaselineStandard69SurfaceV1.surfaceSeriesId,
    });
    expect(resolveRegisteredModelDisclosureV1(
      STANDARD69_MODEL_ID,
      STANDARD69_SURFACE_RELEASE_ID,
    )).toMatchObject({
      badgeLabel: "MW 69",
      shortLabel: "Main Wire Standard 69",
      limitationsTranslationKey: "modelLimitations.standard68Items",
    });
    expect(resolveMainWireStandard68DocumentationFactsV1(identity!))
      .toMatchObject({ generation: 69 });
  });

  it("renders the station, measurement, wave, raw-PV, restart, and validation boundaries in both locales", () => {
    const identity = resolveRegisteredModelDocumentationV1(
      MODEL_ID,
      SURFACE_RELEASE_ID,
    )!;
    const facts = resolveMainWireStandard66DocumentationFactsV1(identity)!;

    const ja = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/ja"]}>
        <MainWireStandard66DocumentationV1 facts={facts} locale="ja" />
      </MemoryRouter>,
    );
    expect(ja).toContain("局所static pressure recovery");
    expect(ja).toContain("特定距離のcatheter tip");
    expect(ja).toContain("進行波");
    expect(ja).toContain("raw orbit");
    expect(ja).toContain("atomic cold restart");
    expect(ja).toContain("臨床的validation");
    expect(ja).toContain(MODEL_ID);
    expect(ja).toContain(SURFACE_RELEASE_ID);

    const en = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/en"]}>
        <MainWireStandard66DocumentationV1 facts={facts} locale="en" />
      </MemoryRouter>,
    );
    expect(en).toContain("after the valve law accounts for local static recovery");
    expect(en).toContain("catheter tip at a specified distance");
    expect(en).toContain("travelling wave");
    expect(en).toContain("raw PV orbit");
    expect(en).toContain("atomically replaces the accepted clock");
    expect(en).toContain("not physiological or clinical validation");
    expect(en).toContain(
      "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV",
    );
    expect(en).toContain(
      "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV",
    );
    expect(en).not.toContain("Pprox =");
    expect(en).not.toContain("ΔPlocal");
  });

  it("routes the registered pair and refuses to substitute a different Surface", () => {
    const validUrl = modelDocumentationHref({
      locale: "ja",
      modelId: MODEL_ID,
      surfaceReleaseId: SURFACE_RELEASE_ID,
    });
    const valid = renderDocumentationRoute(validUrl);
    expect(valid).toContain('data-testid="standard66-model-documentation-v1"');
    expect(valid).toContain("Main Wire Standard 66");

    const invalid = renderDocumentationRoute(
      `/ja/models/${encodeURIComponent(MODEL_ID)}?surface=other-surface`,
    );
    expect(invalid).toContain('data-testid="model-documentation-unavailable-v1"');
    expect(invalid).toContain("別のSurfaceの説明を代用することはありません");
  });

  it("renders Standard67 root semantics without substituting Standard66 copy", () => {
    const validUrl = modelDocumentationHref({
      locale: "ja",
      modelId: STANDARD67_MODEL_ID,
      surfaceReleaseId: STANDARD67_SURFACE_RELEASE_ID,
    });
    const valid = renderDocumentationRoute(validUrl);
    expect(valid).toContain('data-testid="standard67-model-documentation-v1"');
    expect(valid).toContain("Main Wire Standard 67");
    expect(valid).toContain("Ao–SAとPA–PArt");
    expect(valid).toContain("momentum memory");
    expect(valid).toContain(STANDARD67_MODEL_ID);
    expect(valid).not.toContain("Standard 67そのものの臨床validation evidenceではありません。Standard 66");
  });

  it("renders Standard68 rounded-ejection and warm-start boundaries", () => {
    const validUrl = modelDocumentationHref({
      locale: "ja",
      modelId: STANDARD68_MODEL_ID,
      surfaceReleaseId: STANDARD68_SURFACE_RELEASE_ID,
    });
    const valid = renderDocumentationRoute(validUrl);
    expect(valid).toContain('data-testid="standard68-model-documentation-v1"');
    expect(valid).toContain("Main Wire Standard 68");
    expect(valid).toContain("rounded-ejection assembly");
    expect(valid).toContain("atomic warm start");
    expect(valid).toContain(STANDARD68_MODEL_ID);
    expect(valid).not.toContain("新しいexact trajectoryを開始します");
  });

  it("renders Standard69 as the separately qualified baseline successor", () => {
    const valid = renderDocumentationRoute(modelDocumentationHref({
      locale: "ja",
      modelId: STANDARD69_MODEL_ID,
      surfaceReleaseId: STANDARD69_SURFACE_RELEASE_ID,
    }));
    expect(valid).toContain('data-testid="standard69-model-documentation-v1"');
    expect(valid).toContain("Main Wire Standard 69");
    expect(valid).toContain("Standard 68の数式構成を保ち");
    expect(valid).toContain(STANDARD69_MODEL_ID);
  });

  it("renders Standard70 with the asymmetric pulmonary-root limitation", () => {
    const identity = resolveRegisteredModelDocumentationV1(
      STANDARD70_MODEL_ID,
      STANDARD70_SURFACE_RELEASE_ID,
    );
    expect(identity).toMatchObject({
      kind: "main-wire-algebraic-pulmonary-root-standard70",
      modelId: STANDARD70_MODEL_ID,
    });
    expect(resolveRegisteredModelDisclosureV1(
      STANDARD70_MODEL_ID,
      STANDARD70_SURFACE_RELEASE_ID,
    )).toMatchObject({
      badgeLabel: "MW 70",
      limitationsTranslationKey: "modelLimitations.standard70Items",
    });
    expect(resolveMainWireStandard68DocumentationFactsV1(identity!))
      .toMatchObject({
        generation: 70,
        dynamics: {
          proximalArterialRootMomentum: "source-inertance",
          pulmonaryArterialRootMomentum: "algebraic-no-inertance",
        },
      });
    const valid = renderDocumentationRoute(modelDocumentationHref({
      locale: "ja",
      modelId: STANDARD70_MODEL_ID,
      surfaceReleaseId: STANDARD70_SURFACE_RELEASE_ID,
    }));
    expect(valid).toContain('data-testid="standard70-model-documentation-v1"');
    expect(valid).toContain("Main Wire Standard 70");
    expect(valid).toContain("PA–PArt間のみ");
    expect(valid).toContain(STANDARD70_MODEL_ID);
  });
});

function renderDocumentationRoute(initialEntry: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/:locale/models/:modelId" element={<ModelDocumentationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Standard71 mathematical specification", () => {
  const d=equationData;
  it("pins explanatory equations to the source and original launch state", () => {
    for(const s of d.sources) expect(createHash("sha256").update(readFileSync(s.path)).digest("hex"),s.path).toBe(s.sha256);
    expect(d.land.ventricular).toEqual(MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1);
    expect(d.land.atrial).toEqual(NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.atrialLand);
    expect(d.calcium).toEqual(doc71.calcium);
    expect(d.initial.totalBloodVolumeMl).toBe(doc71.fixtureIdentity.hemodynamicResearchInputs.totalBloodVolumeMl);
    expect(d.initial.rhythm.pendingCalciumDeposits).toEqual([]);
    expect(d.initial.rhythm.pendingDistalVentricularImpulses).toEqual([]);
    expect(d.initial.rhythm.pendingProximalAvOutputs).toEqual([]);
  });
  it("covers every active compartment, link and material module without nested disclosure", () => {
    expect(d.nodes).toHaveLength(15); expect(d.coronary.topology.nodes).toHaveLength(16);
    const nodes=new Set([...d.nodes.map(n=>n.id),...d.coronary.topology.nodes.map(n=>n.nodeId)]);
    expect(nodes.size).toBe(31);
    const edges=[...d.edges.map(e=>[e.upstream,e.downstream]),...d.coronary.topology.edges.map(e=>[e.upstreamNodeId,e.downstreamNodeId])];
    for(const [u,v] of edges){expect(nodes.has(u)).toBe(true);expect(nodes.has(v)).toBe(true);expect(u).not.toBe(v);}
    const volumes=[...Object.values(d.initial.volumesMl),...Object.values(d.initial.coronary.volumeMlByNode)];
    expect(volumes.reduce((a,b)=>a+b,0)).toBeCloseTo(4935,9);
    const html=renderDocumentationRoute(modelDocumentationHref({locale:"ja",modelId:doc71.modelId,surfaceReleaseId:doc71.surfaceReleaseId}));
    for(const id of STANDARD71_MODULE_IDS_V1.filter(id=>id!=="derived-pv-analysis-v3")){
      expect(MAIN_WIRE_EQUATION_SPECIFICATION_V1[id]?.length).toBeGreaterThan(0);
      expect(html).toContain(`data-equation-module="${id}"`);
    }
    expect(html).toContain('data-testid="equation-initial-state"');
    expect(html).not.toContain("再実装用の仕様書ではありません");
  });
  it("takes effective hydraulic parameters from the selected construction", () => {
    const f=createMainWireIntegratedModelStandard71FixtureV1();
    expect(d.valves).toEqual(f.runtime.valveResearchInput.valves);
    expect(d.pericardium).toEqual(f.pericardium);
    expect(d.respiratory).toEqual(f.runtime.respiratory);
    expect(f.runtime.vascular.aorticRootInertanceResearchScale).toBe(0);
    expect(f.runtime.vascular.algebraicPulmonaryArterialRootProfile).toBeDefined();
    expect(d.edges.every(e=>e.inertanceMmHgSec2PerMl===0)).toBe(true);
    expect(d.nodes.find(n=>n.id==="Ao")!.law!.VsEff).toBeCloseTo(150*.65/1.42,12);
    expect(d.nodes.find(n=>n.id==="PA")!.law!.VsEff).toBeCloseTo(60/1.42,12);
  });
  it("reconstructs vascular PV relations from the documented formulas", () => {
    const S=(z:number)=>Math.log1p(Math.exp(z));
    for(const node of d.nodes){
      if(!node.law)continue;
      const p=node.law as VascularPvLaw;
      for(const pressure of [-5,0,8,30]){
        let stressed:number;
        if(p.kind==="arterial")stressed=p.VsEff*Math.log1p(pressure/p.P0);
        else if(p.kind==="linear")stressed=p.C*pressure;
        else stressed=p.Ccoll*pressure+(p.Copen-p.Ccoll)*p.dOpen*(S((pressure-p.Popen)/p.dOpen)-S(-p.Popen/p.dOpen))-(p.Copen-p.Cdist)*p.dStiff*(S((pressure-p.Pstiff)/p.dStiff)-S(-p.Pstiff/p.dStiff));
        expect(stressed).toBeCloseTo(stressedVolumeFromPtm(p,pressure),9);
        expect(ptmFromStressedVolume(p,stressed)).toBeCloseTo(pressure,7);
      }
    }
  });
  it("reconstructs algebraic valve flow, including deadband and exact closure", () => {
    const f=createMainWireIntegratedModelStandard71FixtureV1();
    const positive=(z:number)=>z<=0?0:z<.1?z*z/.2:z-.05;
    for(const p of Object.values(f.runtime.valveResearchInput.valves)) for(const dp of [-8,0,.02,.7,4,30]){
      const previous=.2,dt=.002;
      const target=1-Math.exp(-p.openingGainPerMmHg*positive(dp-p.openingDriveDeadbandMmHg-p.openingPressureOffsetMmHg));
      const tau=target>previous?p.openingTimeConstantSec:p.closingTimeConstantSec;
      const xi=(previous+dt/tau*target)/(1+dt/tau);
      const A=dp>=0?p.closedReverseEroaCm2+xi*(p.maximumForwardEoaCm2-p.closedReverseEroaCm2):p.closedReverseEroaCm2;
      const B=A>0?1060/(2*133.322387415)*(1e-6/(1e-4*A))**2:0;
      const R=p.backgroundLinearResistanceMmHgSecPerMl;
      const Q=A===0||dp===0?0:Math.sign(dp)*2*Math.abs(dp)/(R+Math.sqrt(R*R+4*B*Math.abs(dp)));
      const actual=stepMainWireQuasiSteadyOrificeValveV2({leafletOpeningFraction01:previous},{dtSec:dt,upstreamPressureMmHg:dp,downstreamPressureMmHg:0},p);
      expect(actual.valid).toBe(true);expect(actual.flowMlPerSec).toBeCloseTo(Q,10);expect(actual.state.leafletOpeningFraction01).toBeCloseTo(xi,12);
    }
  });
  it("reconstructs all six Land state rates, atrial and extended ventricular", () => {
    for(const ps of [MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1,NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.atrialLand])for(const lam of [.8,1.05,1.25]){
      const p=ps.values;const [c,b,W,S,zw,zs]=[.06,.5,.1,.2,.12,-1.1];const ca=.4,ld=-.2,U=1-b-W-S;
      const kb=p.ku*p.TRPN50**p.nTm/((1-p.rs)*(1-p.rw));
      const kwu=p.kuw*(1/p.rw-1)-p.kws,ksu=p.kws*p.rw*(1/p.rs-1);
      const A=p.Aeff*p.rs/((1-p.rs)*p.rw+p.rs);
      const cw=p.phi*p.kuw*(1-p.rw)/p.rw,cs=p.phi*p.kws*(1-p.rs)*p.rw/p.rs;
      const exit=ps.strongBridgeDeactivationExit?ps.strongBridgeDeactivationExit.maximumRatePerSec*(p.TRPN50**p.nTm/(p.TRPN50**p.nTm+c**p.nTm))**ps.strongBridgeDeactivationExit.cooperativeGatePower*Math.max(S-p.kws/ksu*W,0):0;
      const expected=[p.kTRPN*((ca/(p.CaT50Ref+p.beta1*(Math.min(lam,1.2)-1)))**p.nTRPN*(1-c)-c),kb*Math.min(c**(-p.nTm/2),100)*U-p.ku*c**(p.nTm/2)*b,p.kuw*U-(kwu+p.kws+p.gammaW*Math.abs(zw))*W,p.kws*W-(ksu+p.gammaS*Math.max(-zs-1,zs,0))*S-exit,A*ld-cw*zw,A*ld-cs*zs];
      const actual=writeLand2017Rhs([c,b,W,S,zw,zs],{freeCalciumUM:ca,fiberEngineeringStrain:lam-1,fiberEngineeringStrainRatePerSec:ld},ps);
      actual.forEach((v,i)=>expect(v).toBeCloseTo(expected[i],8));
    }
  });
  it("reconstructs the distinct atrial and ventricular passive laws", () => {
    const a=d.passive.atrial,v=d.passive.ventricular;
    const positive=(e:number)=>e<=0?0:e>=v.transitionWidthStrain?e-v.transitionWidthStrain/2:v.transitionWidthStrain*((e/v.transitionWidthStrain)**3-.5*(e/v.transitionWidthStrain)**4);
    const energy=(e:number)=>.5*v.centralTangentPa*e*e+v.tensionScalePa/v.tensionExponent**2*(Math.expm1(v.tensionExponent*positive(e))-v.tensionExponent*positive(e))+.5*v.compressionAdditionalTangentPa*positive(-e)**2;
    for(const e of [-.1,.0005,.1,.2]){
      const l=Math.exp(e);
      const atrial=4*a.isotropicC1Pa*(l*l-l**-4)+4*a.isotropicC2Pa*(l**4-l**-2)+(e>0?a.fiberC3Pa*Math.expm1(a.fiberC4*(l-1)):0);
      expect(evaluateMoyer2015AtrialEquibiaxialPassiveV1(e,NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.atrial.compiled).equilibriumKirchhoffStressPa).toBeCloseTo(atrial,8);
      const actual=evaluateEquilibriumOneFiberPassiveV1(e,NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled);
      expect(actual.storedEnergyDensityJPerM3).toBeCloseTo(energy(e),8);
    }
  });
  it("reconstructs TriSeg geometry and virtual-work pressures without arbitrary pressure gain", () => {
    const input={leftVentricularCavityVolumeM3:d.initial.volumesMl.LV*1e-6,rightVentricularCavityVolumeM3:d.initial.volumesMl.RV*1e-6,coordinates:d.initial.mechanics.trisegCoordinates,walls:d.anatomy.triSeg.wallGeometryParameters};
    const g=evaluateTriSegGeometryV1(input);const stress={LVFW:50000,SEP:40000,RVFW:35000};
    for(const wall of Object.values(g.walls)){
      const h=wall.signedCapHeightM,y=input.coordinates.junctionRadiusM,M=wall.parameters.wallMaterialVolumeM3;
      expect(Math.PI*h*(h*h+3*y*y)/6).toBeCloseTo(wall.signedMidwallCapVolumeM3,12);
      const A=Math.PI*(h*h+y*y),k=2*h/(h*h+y*y),z=1.5*k*M/A;
      const e=.5*Math.log(A/wall.parameters.referenceMidwallAreaM2)-z*z/12-.019*z**4;
      expect(wall.fiberLogStrain).toBeCloseTo(e,12);
    }
    const actual=evaluateEnergyConjugateTriSegV1({geometry:g,fiberKirchhoffStressPaByWall:stress});
    const frozenVirtualPotential=(i:typeof input)=>Object.values(evaluateTriSegGeometryV1(i).walls).reduce((s,w)=>s+w.parameters.wallMaterialVolumeM3*stress[w.wallId]*w.fiberLogStrain,0);
    const dv=1e-9;
    for(const [key,side] of [["leftVentricularCavityVolumeM3","LV"],["rightVentricularCavityVolumeM3","RV"]] as const){
      const estimated=(frozenVirtualPotential({...input,[key]:input[key]+dv})-frozenVirtualPotential({...input,[key]:input[key]-dv}))/(2*dv);
      expect(estimated).toBeCloseTo(actual.cavityTransmuralPressuresPa[side],4);
    }
  });
});

describe("standalone Standard71 documentation", () => {
  const url = (locale = "ja", surfaceReleaseId = doc71.surfaceReleaseId) => modelDocumentationHref({
    locale: locale as "ja" | "en", modelId: doc71.modelId, surfaceReleaseId,
  });
  it("typesets every symbol definition with real subscripts, including table labels", () => {
    const wall = MAIN_WIRE_MODEL_MODULES_V1.find(m => m.id === "five-wall-energy-triseg-v1")!;
    for (const [symbol] of wall.symbols!) {
      const html = renderToStaticMarkup(<ModelInlineMathV1 expression={symbol} />);
      expect(html).toContain("<msub>");
      expect(html).toContain("katex-mathml");
    }
    expect(wall.symbols![2][0]).toBe(String.raw`P_{\mathrm{cavity}},\;P_{\mathrm{tm}},\;P_{\mathrm{ext}}`);
    const calcium = MAIN_WIRE_MODEL_MODULES_V1.find(m => m.id === "event-calcium-v1")!;
    expect(calcium.symbols![0][0]).toBe(String.raw`x_r,\;x_d`);
    const label = renderToStaticMarkup(<ModelMathLabelV1 label="Amax (cm²)" />);
    expect(label).toContain('data-math-plain="Amax"');
    expect(label).toContain("<msub>");
    expect(label).toContain(" (cm²)");
    expect(renderToStaticMarkup(<ModelMathLabelV1 label="左室自由壁 (LVFW)" />)).toBe("左室自由壁 (LVFW)");
  });
  it("resolves its pinned pair, without substituting a predecessor Surface", () => {
    expect(resolveRegisteredModelDocumentationV1(doc71.modelId, doc71.surfaceReleaseId)?.kind).toBe("saved-model-document");
    expect(renderDocumentationRoute(url("ja", STANDARD70_SURFACE_RELEASE_ID))).toContain("model-documentation-unavailable-v1");
    expect(resolveRegisteredModelDisclosureV1(doc71.modelId, doc71.surfaceReleaseId).limitationsTranslationKey).toBe("modelLimitations.standard71Items");
  });
  it.each(["ja", "en"])("renders standalone explanations, equations and history in %s", locale => {
    const html = renderDocumentationRoute(url(locale));
    expect(html).toContain('data-testid="model-documentation-v2"');
    expect(html).toContain('id="documentation-model-version"');
    expect(html).toContain('role="img"');
    expect(html).toContain("katex-mathml");
    expect(html).not.toContain("katex-error");
    expect(html.indexOf('id="overview"')).toBeLessThan(html.indexOf('id="baseline"'));
    expect(html.indexOf('id="baseline"')).toBeLessThan(html.indexOf('id="record"'));
    let depth = 0;
    for (const match of html.matchAll(/<details\b|<\/details>/g)) {
      depth += match[0].startsWith("</") ? -1 : 1;
      expect(depth).toBeLessThanOrEqual(1);
    }
    expect(depth).toBe(0);
  });
  it("uses the actual 52 baseline controls and complete fixture", () => {
    expect(doc71.settings).toEqual(MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1);
    expect(doc71.settings).toHaveLength(52);
    expect(doc71.fixtureIdentity).toEqual(MAIN_WIRE_STANDARD71_DEFAULT_FIXTURE_V1);
    expect(doc71.calcium.LVFW).toEqual(doc71.calcium.RVFW);
    expect(doc71.assembly.aorticRootInertanceScale).toBe(0);
  });
  it("pins the cold binding evidence and resolves module definitions", () => {
    const raw = readFileSync("studio/integrations/mainWireIntegratedV3/standard71-baseline-binding-evidence.json", "utf8");
    expect(createHash("sha256").update(raw).digest("hex")).toBe(doc71.provenance.bindingSha256);
    const binding = JSON.parse(raw);
    expect(doc71.provenance.admissionSource).toEqual(binding.sources.admission);
    expect(doc71.observations[0].rest).toEqual(binding.rest);
    for (const id of STANDARD71_MODULE_IDS_V1) {
      const module = MAIN_WIRE_MODEL_MODULES_V1.find(m => m.id === id);
      expect(module).toBeDefined();
      for (const owner of module!.owners) expect(existsSync(owner), owner).toBe(true);
    }
  });
  it.each([0, 1] as const)("distinguishes adopted ranges, source strata and historical warnings for grid %i", grid => {
    const rows = standard71BaselineRowsV1(grid, "ja");
    const byId = new Map(rows.map(r => [r.id, r]));
    expect(new Set(rows.map(r => r.id)).size).toBe(rows.length);
    expect(byId.get("aortic-pressure.maximum")).toMatchObject({ role: "guard", ranges: [{ lower: 90, upper: 140 }, ...doc71.observations[grid].rest.comparison.entries.find(c => c.metricId === "aortic-pressure.maximum")!.comparisons.map(c => c.range)] });
    expect(byId.get("aortic-pressure.maximum")!.ranges[1].label).toBe("女性 20-29 · 第10〜90百分位");
    // Wording may differ by locale; observations, decisions and bounds may not.
    const scientificFields = (r: ReturnType<typeof standard71BaselineRowsV1>[number]) => ({
      id: r.id, value: r.value, unit: r.unit, role: r.role, status: r.status,
      ranges: r.ranges.map(({ lower, upper }) => ({ lower, upper })),
      sources: r.sources.map(s => s.url),
    });
    expect(rows.map(scientificFields)).toEqual(standard71BaselineRowsV1(grid, "en").map(scientificFields));
    expect(byId.get("pulmonary-artery-pressure.minimum")).toMatchObject({ role: "reference", status: "warning", ranges: [{ lower: 4, upper: 12 }] });
    expect(byId.get("left-ventricle.maximum-dpdt")).toMatchObject({ role: "reference", status: "warning" });
    expect(byId.get("timing.tei-index")).toMatchObject({ role: "reference", status: "warning" });
    expect(byId.get("left-ventricle.ejection-fraction")!.ranges).toHaveLength(3);
    expect(byId.get("left-ventricle.ejection-fraction")!.ranges[0]).toMatchObject({ lower: .55, upper: .79 });
    expect(byId.get("pulmonary-valve.ejection-time")!.ranges).toEqual([]);
    expect(byId.get("lv.tau.weiss")!.ranges[0].upper).toBe(doc71.tauPolicy.referenceUpperMs);
    for (const row of rows) {
      expect(row.value).not.toBeNull();
      expect(row.meaning.length).toBeGreaterThan(20);
      if (row.role === "target") expect(row.sources.length).toBeGreaterThan(0);
    }
  });
  it("shares compact information with the full page only for the matching baseline", () => {
    const info = standard71BaselineInfoV1(doc71.modelId, doc71.surfaceReleaseId, doc71.fixtureIdentity, "ja");
    expect(info).toBeDefined();
    expect(info!.items.find(i => i.itemId === "timing.tei-index")?.status).toBe("warning");
    expect(info!.items.find(i => i.itemId === "reference-warnings")?.value)
      .toBe(String(standard71BaselineRowsV1(0, "ja").filter(r => r.status === "warning").length));
    expect(standard71BaselineInfoV1(doc71.modelId, doc71.surfaceReleaseId, null, "ja")).toBeUndefined();
    expect(standard71BaselineInfoV1(doc71.modelId, STANDARD70_SURFACE_RELEASE_ID, doc71.fixtureIdentity, "ja")).toBeUndefined();
    expect(standard71BaselineInfoV1(doc71.modelId, doc71.surfaceReleaseId, {
      ...doc71.fixtureIdentity, hemodynamicResearchInputs: { ...doc71.fixtureIdentity.hemodynamicResearchInputs, totalBloodVolumeMl: 4940 },
    }, "ja")).toBeUndefined();
  });
});
