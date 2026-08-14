import { describe, expect, it } from "vitest";

import {
  NON_CORONARY_EDGE_NAMES_V1,
  NON_CORONARY_NODE_NAMES_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_EDGE_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  compileExecutionPlanV1,
} from "@/engine/executionPlan/ExecutionPlanCompilerV1";
import {
  createMainWireModelDefinitionV1,
  createMainWireNumericalPolicyV1,
} from "@/engine/executionPlan/MainWireModelDefinitionV1";
import type {
  ModelDefinitionV1,
  NumericalPolicyV1,
} from "@/engine/executionPlan/ModelDefinitionV1";
import {
  MAIN_WIRE_ACCEPTED_TYPED_HEMODYNAMIC_LAYOUT_V1,
} from "@/engine/vnext/MainWireAcceptedTypedHemodynamicV1";
import {
  COUPLED_HEMODYNAMICS_LAYOUT_V1,
} from "@/engine/vnext/coupled/CoupledHemodynamicsLayoutV1";

describe("ModelDefinition V1 execution-plan compiler", () => {
  it("reproduces the current hemodynamic state and coupled-solve layouts", () => {
    const plan = compileMainWire();
    const stateIndex = (stateId: string) => plan.stateLayout.slots.find(
      (slot) => slot.stateId === stateId,
    )?.logicalIndex;

    expect(plan.stateLayout.logicalSlotCount).toBe(100);
    expect(plan.stateLayout.continuousSlotCount).toBe(99);
    expect(plan.stateLayout.booleanSlotCount).toBe(1);
    expect(plan.stateLayout.blocks).toEqual([
      {
        componentId: "accepted-transaction",
        kernelId: "accepted-transaction-kernel-v1",
        logicalStart: 0,
        logicalLength: 3,
      },
      {
        componentId: "noncoronary-circulation",
        kernelId: "noncoronary-backward-euler-kernel-v1",
        logicalStart: 3,
        logicalLength: 21,
      },
      {
        componentId: "coronary-circulation",
        kernelId: "coronary-backward-euler-kernel-v2",
        logicalStart: 24,
        logicalLength: 22,
      },
      {
        componentId: "five-wall-mechanics",
        kernelId: "five-wall-land-triseg-kernel-v1",
        logicalStart: 46,
        logicalLength: 54,
      },
    ]);
    expect(stateIndex("noncoronary.volume.LV"))
      .toBe(MAIN_WIRE_ACCEPTED_TYPED_HEMODYNAMIC_LAYOUT_V1
        .nonCoronaryVolumes);
    expect(stateIndex("noncoronary.flow.Ao_SA"))
      .toBe(MAIN_WIRE_ACCEPTED_TYPED_HEMODYNAMIC_LAYOUT_V1.dynamicEdgeFlows);
    expect(stateIndex("noncoronary.valve.MV.openingFraction01"))
      .toBe(MAIN_WIRE_ACCEPTED_TYPED_HEMODYNAMIC_LAYOUT_V1.valveOpenings);
    expect(stateIndex("coronary.volume.LAD.Art"))
      .toBe(MAIN_WIRE_ACCEPTED_TYPED_HEMODYNAMIC_LAYOUT_V1.coronaryVolumes);
    expect(stateIndex("coronary.tone.LAD.subepicardial"))
      .toBe(MAIN_WIRE_ACCEPTED_TYPED_HEMODYNAMIC_LAYOUT_V1.coronaryTone);
    expect(stateIndex("mechanics.wall.LA.land.0"))
      .toBe(MAIN_WIRE_ACCEPTED_TYPED_HEMODYNAMIC_LAYOUT_V1.wallState);
    expect(stateIndex("TriSeg.septalMidwallCapVolume"))
      .toBe(MAIN_WIRE_ACCEPTED_TYPED_HEMODYNAMIC_LAYOUT_V1.triSeg);
    expect(stateIndex("mechanics.mvc.referenceFiberLogStrain.LVFW"))
      .toBe(MAIN_WIRE_ACCEPTED_TYPED_HEMODYNAMIC_LAYOUT_V1.mvc);
    expect(stateIndex("mechanics.mvc.mitralForwardFlowActive"))
      .toBe(MAIN_WIRE_ACCEPTED_TYPED_HEMODYNAMIC_LAYOUT_V1.mvcActive);

    const [solve] = plan.solveGroups;
    expect(solve?.blocks.map(({ blockId, start, length, endExclusive }) => ({
      blockId,
      start,
      length,
      endExclusive,
    }))).toEqual([
      { blockId: "nonCoronary", ...COUPLED_HEMODYNAMICS_LAYOUT_V1
        .blocks.nonCoronary },
      { blockId: "coronary", ...COUPLED_HEMODYNAMICS_LAYOUT_V1
        .blocks.coronary },
      { blockId: "triSeg", ...COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.triSeg },
    ]);
    expect(solve?.unknownStateIds)
      .toEqual(COUPLED_HEMODYNAMICS_LAYOUT_V1.unknownIds);
    expect(solve?.totalUnknownCount)
      .toBe(COUPLED_HEMODYNAMICS_LAYOUT_V1.totalUnknownCount);
    expect(solve?.activeUnknownCount)
      .toBe(COUPLED_HEMODYNAMICS_LAYOUT_V1.phase2aCondensedUnknownCount);
    expect(solve?.dependentStateIds)
      .toEqual([COUPLED_HEMODYNAMICS_LAYOUT_V1.dependentBloodVolumeUnknown]);
    expect(solve?.jacobianElementCount).toBe(30 * 30);
  });

  it("compiles the present circulation graph without executable bindings", () => {
    const plan = compileMainWire();

    expect(plan.hydraulicGraph.nodeIds).toEqual([
      ...NON_CORONARY_NODE_NAMES_V1,
      ...CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
    ]);
    expect(plan.hydraulicGraph.pathIds).toEqual([
      ...NON_CORONARY_EDGE_NAMES_V1,
      ...CORONARY_EDGE_IDS_V2,
    ]);
    expect(plan.hydraulicGraph.nodeIds.slice(0, 6))
      .toEqual(["LV", "LA", "RV", "RA", "Ao", "SA"]);
    const coronaryInlet = plan.hydraulicGraph.pathIds.indexOf("Ao_LAD.Art");
    expect(coronaryInlet).toBeGreaterThanOrEqual(0);
    expect(plan.hydraulicGraph.upstreamNodeIndices[coronaryInlet])
      .toBe(plan.hydraulicGraph.nodeIds.indexOf("Ao"));
    expect(plan.hydraulicGraph.downstreamNodeIndices[coronaryInlet])
      .toBe(plan.hydraulicGraph.nodeIds.indexOf("LAD.Art"));
    expect(JSON.stringify(plan)).not.toContain("function");
    expect(JSON.stringify(plan)).not.toContain("sha256");
    expect(JSON.stringify(plan)).not.toContain("moduleUrl");
    expect(new TextEncoder().encode(JSON.stringify(plan)).byteLength)
      .toBeLessThan(64 * 1_024);
  });

  it("is deterministic under declaration-order changes", () => {
    const definition = createMainWireModelDefinitionV1();
    const policy = createMainWireNumericalPolicyV1();
    const shuffledDefinition: ModelDefinitionV1 = Object.freeze({
      ...definition,
      components: Object.freeze([...definition.components].reverse().map(
        (component) => Object.freeze({
          ...component,
          states: Object.freeze([...component.states].reverse()),
        }),
      )),
      hydraulicTopology: Object.freeze({
        nodes: Object.freeze([...definition.hydraulicTopology.nodes].reverse()),
        paths: Object.freeze([...definition.hydraulicTopology.paths].reverse()),
        conservationPools: definition.hydraulicTopology.conservationPools,
      }),
    });
    const shuffledPolicy: NumericalPolicyV1 = Object.freeze({
      ...policy,
      solveGroups: Object.freeze([...policy.solveGroups].reverse().map(
        (group) => Object.freeze({
          ...group,
          unknownBlocks: Object.freeze([...group.unknownBlocks].reverse()),
        }),
      )),
      updateGroups: Object.freeze([...policy.updateGroups].reverse()),
    });

    expect(compileExecutionPlanV1(shuffledDefinition, shuffledPolicy))
      .toEqual(compileExecutionPlanV1(definition, policy));
  });

  it("admits a synthetic bypass path without renumbering state or solve slots", () => {
    const definition = createMainWireModelDefinitionV1();
    const baseline = compileExecutionPlanV1(
      definition,
      createMainWireNumericalPolicyV1(),
    );
    const withBypass: ModelDefinitionV1 = Object.freeze({
      ...definition,
      definitionId: "synthetic-bypass-model-definition-v1",
      hydraulicTopology: Object.freeze({
        ...definition.hydraulicTopology,
        paths: Object.freeze([
          ...definition.hydraulicTopology.paths,
          Object.freeze({
            pathId: "synthetic.VC_LA-bypass",
            ordinal: definition.hydraulicTopology.paths.length,
            componentId: "noncoronary-circulation",
            upstreamNodeId: "VC",
            downstreamNodeId: "LA",
            kernelId: "synthetic-flow/resistive",
          }),
        ]),
      }),
    });
    const compiled = compileExecutionPlanV1(
      withBypass,
      createMainWireNumericalPolicyV1(),
    );
    const bypassIndex = compiled.hydraulicGraph.pathIds.length - 1;

    expect(compiled.stateLayout).toEqual(baseline.stateLayout);
    expect(compiled.solveGroups).toEqual(baseline.solveGroups);
    expect(compiled.hydraulicGraph.pathIds[bypassIndex])
      .toBe("synthetic.VC_LA-bypass");
    expect(compiled.hydraulicGraph.upstreamNodeIndices[bypassIndex])
      .toBe(compiled.hydraulicGraph.nodeIds.indexOf("VC"));
    expect(compiled.hydraulicGraph.downstreamNodeIndices[bypassIndex])
      .toBe(compiled.hydraulicGraph.nodeIds.indexOf("LA"));
  });

  it("fails closed on broken topology and ordinal contracts", () => {
    const definition = createMainWireModelDefinitionV1();
    const policy = createMainWireNumericalPolicyV1();
    const brokenEndpoint: ModelDefinitionV1 = Object.freeze({
      ...definition,
      hydraulicTopology: Object.freeze({
        ...definition.hydraulicTopology,
        paths: Object.freeze(definition.hydraulicTopology.paths.map(
          (path, index) => index === 0
            ? Object.freeze({ ...path, downstreamNodeId: "missing-node" })
            : path,
        )),
      }),
    });
    const brokenOrdinal: NumericalPolicyV1 = Object.freeze({
      ...policy,
      solveGroups: Object.freeze(policy.solveGroups.map((group) =>
        Object.freeze({ ...group, ordinal: 1 }))),
    });

    expect(() => compileExecutionPlanV1(brokenEndpoint, policy))
      .toThrow("unknown endpoint");
    expect(() => compileExecutionPlanV1(definition, brokenOrdinal))
      .toThrow("ordinals must be contiguous from zero");
  });

  it("rejects unknown fields and accessors without invoking them", () => {
    const definition = createMainWireModelDefinitionV1();
    const policy = createMainWireNumericalPolicyV1();
    const firstComponent = definition.components[0]!;
    const withUnknownField = Object.freeze({
      ...firstComponent,
      implementation: "must-not-enter-a-data-plan",
    });
    const unknownFieldDefinition = Object.freeze({
      ...definition,
      components: Object.freeze([
        withUnknownField,
        ...definition.components.slice(1),
      ]),
    }) as unknown as ModelDefinitionV1;
    let getterCalled = false;
    const accessorComponent = Object.defineProperties({}, {
      componentId: {
        enumerable: true,
        get: () => {
          getterCalled = true;
          return firstComponent.componentId;
        },
      },
      kernelId: { value: firstComponent.kernelId, enumerable: true },
      ordinal: { value: firstComponent.ordinal, enumerable: true },
      states: { value: firstComponent.states, enumerable: true },
    });
    const accessorDefinition = Object.freeze({
      ...definition,
      components: Object.freeze([
        accessorComponent,
        ...definition.components.slice(1),
      ]),
    }) as unknown as ModelDefinitionV1;

    expect(() => compileExecutionPlanV1(unknownFieldDefinition, policy))
      .toThrow("model component fields must match exactly");
    expect(() => compileExecutionPlanV1(accessorDefinition, policy))
      .toThrow("componentId must be an enumerable data property");
    expect(getterCalled).toBe(false);
  });

  it("rejects unsupported numerical policy values at the data boundary", () => {
    const definition = createMainWireModelDefinitionV1();
    const policy = createMainWireNumericalPolicyV1();
    const unsupported = Object.freeze({
      ...policy,
      updateGroups: Object.freeze(policy.updateGroups.map((group) =>
        Object.freeze({ ...group, integration: "adaptive-runge-kutta" }))),
    }) as unknown as NumericalPolicyV1;

    expect(() => compileExecutionPlanV1(definition, unsupported))
      .toThrow("unsupported integration");
  });
});

function compileMainWire() {
  return compileExecutionPlanV1(
    createMainWireModelDefinitionV1(),
    createMainWireNumericalPolicyV1(),
  );
}
