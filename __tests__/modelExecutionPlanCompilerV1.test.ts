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
  assertBoundExecutionPlanV1,
  bindExecutionPlanV1,
  prepareBoundExecutionPlanSolveGroupV1,
  synchronizeBoundExecutionPlanAcceptedStateV1,
  validateAndOwnExecutionPlanDescriptorV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
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
import generatedExecutionPlan from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedExecutionPlanV1.generated.json";

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
    expect(solve?.workspace).toEqual({
      f64Count: 2 * 30 * 30 + 9 * 30,
      int32Count: 30,
      f64Segments: [
        { role: "current-unknowns", offset: 0, length: 30 },
        { role: "residual", offset: 30, length: 30 },
        { role: "jacobian", offset: 60, length: 900 },
        { role: "factors", offset: 960, length: 900 },
        { role: "right-hand-side", offset: 1_860, length: 30 },
        { role: "transformed-right-hand-side", offset: 1_890, length: 30 },
        { role: "update", offset: 1_920, length: 30 },
        { role: "trial-unknowns", offset: 1_950, length: 30 },
        { role: "trial-residual", offset: 1_980, length: 30 },
        { role: "unknown-scale", offset: 2_010, length: 30 },
        { role: "residual-scale", offset: 2_040, length: 30 },
      ],
      int32Segments: [
        { role: "pivots", offset: 0, length: 30 },
      ],
    });
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

  it("keeps the checked-in descriptor byte-semantically equal to compilation", () => {
    expect(validateAndOwnExecutionPlanDescriptorV1(generatedExecutionPlan))
      .toEqual(compileMainWire());
  });

  it("binds exact kernel IDs and allocates one nonaliasing Worker plan", () => {
    const descriptor = compileMainWire();
    const bound = bindExecutionPlanV1(descriptor, mainWireKernelCatalog());
    const [solve] = bound.solveGroups;

    expect(bound.definitionId).toBe(descriptor.definitionId);
    expect(bound.currentContinuousState).toHaveLength(99);
    expect(bound.candidateContinuousState).toHaveLength(99);
    expect(bound.currentBooleanState).toHaveLength(1);
    expect(bound.candidateBooleanState).toHaveLength(1);
    expect(bound.acceptedStateLogicalScratch).toHaveLength(100);
    expect(bound.graphUpstreamNodeIndices).toHaveLength(37);
    expect(bound.graphDownstreamNodeIndices).toHaveLength(37);
    expect(solve?.activeStateLogicalIndices).toHaveLength(30);
    expect(solve?.dependentStateLogicalIndices).toHaveLength(1);
    expect(solve?.workspaceF64).toHaveLength(2 * 30 * 30 + 9 * 30);
    expect(solve?.workspaceInt32).toHaveLength(30);
    expect(bound.allocatedBytes).toBeGreaterThan(0);
    expect(bound.currentContinuousState.buffer)
      .not.toBe(bound.candidateContinuousState.buffer);
    expect(() => assertBoundExecutionPlanV1(bound, descriptor)).not.toThrow();
  });

  it("synchronizes one complete accepted view atomically and checks its ledger", () => {
    const descriptor = compileMainWire();
    const bound = bindExecutionPlanV1(descriptor, mainWireKernelCatalog());
    const source = bound.acceptedStateLogicalScratch;
    source.forEach((_value, logicalIndex) => {
      source[logicalIndex] = logicalIndex + 1;
    });
    const [pool] = descriptor.hydraulicGraph.conservationPools;
    source[pool!.ledgerStateLogicalIndex] = pool!.memberStateLogicalIndices
      .reduce((total, logicalIndex) => total + source[logicalIndex]!, 0);
    source[98] = 1;

    expect(synchronizeBoundExecutionPlanAcceptedStateV1(bound)).toEqual({
      definitionId: descriptor.definitionId,
      synchronizedLogicalSlotCount: 100,
      conservationPoolCount: 1,
      maximumConservationAbsoluteError: 0,
    });
    expect([...bound.currentContinuousState.slice(0, 3)])
      .toEqual([1, 2, source[pool!.ledgerStateLogicalIndex]]);
    expect(bound.currentContinuousState[98]).toBe(100);
    expect([...bound.currentBooleanState]).toEqual([1]);
    const solveWorkspace = prepareBoundExecutionPlanSolveGroupV1(
      bound,
      "coupled-hemodynamics",
    );
    const activeLogicalIndices = descriptor.solveGroups[0]!.blocks
      .filter(({ disposition }) => disposition === "retained")
      .flatMap(({ stateLogicalIndices }) => stateLogicalIndices);
    expect([...solveWorkspace.currentUnknowns]).toEqual(
      activeLogicalIndices.map((logicalIndex) => source[logicalIndex]),
    );
    expect(solveWorkspace.jacobian).toHaveLength(900);
    expect(solveWorkspace.factors).toHaveLength(900);
    expect(solveWorkspace.jacobian.buffer)
      .toBe(solveWorkspace.factors.buffer);
    expect(solveWorkspace.jacobian.byteOffset)
      .not.toBe(solveWorkspace.factors.byteOffset);
    expect(solveWorkspace.pivots).toHaveLength(30);
    expect(prepareBoundExecutionPlanSolveGroupV1(
      bound,
      "coupled-hemodynamics",
    )).toBe(solveWorkspace);

    const admittedContinuous = new Float64Array(
      bound.currentContinuousState,
    );
    const admittedBoolean = new Uint8Array(bound.currentBooleanState);
    source[0] = Number.NaN;
    expect(() => synchronizeBoundExecutionPlanAcceptedStateV1(bound))
      .toThrow(/must be finite/);
    expect(bound.currentContinuousState).toEqual(admittedContinuous);
    expect(bound.currentBooleanState).toEqual(admittedBoolean);

    source[0] = 1;
    source[pool!.ledgerStateLogicalIndex] += 1;
    expect(() => synchronizeBoundExecutionPlanAcceptedStateV1(bound))
      .toThrow(/conservation ledger/);
    expect(bound.currentContinuousState).toEqual(admittedContinuous);
    expect(bound.currentBooleanState).toEqual(admittedBoolean);
    expect(() => synchronizeBoundExecutionPlanAcceptedStateV1({
      ...bound,
    })).toThrow(/requires a bound plan/);
    expect(() => prepareBoundExecutionPlanSolveGroupV1(
      { ...bound },
      "coupled-hemodynamics",
    )).toThrow(/requires a bound plan/);
    expect(() => prepareBoundExecutionPlanSolveGroupV1(
      bound,
      "missing-solve-group",
    )).toThrow(/is unavailable/);
  });

  it("fails closed on missing, extra, aliased, and descriptor-mismatched bindings", () => {
    const descriptor = compileMainWire();
    const catalog = mainWireKernelCatalog();
    const [descriptorGroup] = descriptor.solveGroups;
    expect(() => validateAndOwnExecutionPlanDescriptorV1({
      ...descriptor,
      solveGroups: [{
        ...descriptorGroup!,
        workspace: {
          ...descriptorGroup!.workspace,
          f64Segments: descriptorGroup!.workspace.f64Segments.map(
            (segment, index) => index === 0
              ? { ...segment, offset: 1 }
              : segment,
          ),
        },
      }],
    })).toThrow(/workspace segment is not canonical/);
    expect(() => bindExecutionPlanV1(descriptor, {
      ...catalog,
      componentKernelIds: catalog.componentKernelIds.slice(1),
    })).toThrow("component kernel bindings must match exactly");
    expect(() => bindExecutionPlanV1(descriptor, {
      ...catalog,
      hydraulicPathKernelIds: [
        ...catalog.hydraulicPathKernelIds,
        "synthetic-flow/unregistered",
      ],
    })).toThrow("hydraulic path kernel bindings must match exactly");

    const bound = bindExecutionPlanV1(descriptor, catalog);
    expect(() => assertBoundExecutionPlanV1({
      ...bound,
      candidateContinuousState: bound.currentContinuousState,
    }, descriptor)).toThrow("typed allocations must not alias");
    const wrongGraph = new Int32Array(bound.graphUpstreamNodeIndices);
    wrongGraph[0] = wrongGraph[0] === 0 ? 1 : 0;
    expect(() => assertBoundExecutionPlanV1({
      ...bound,
      graphUpstreamNodeIndices: wrongGraph,
    }, descriptor)).toThrow("values do not match descriptor");
    if (typeof SharedArrayBuffer !== "undefined") {
      const sharedState = new Float64Array(new SharedArrayBuffer(
        bound.candidateContinuousState.byteLength,
      ));
      expect(() => assertBoundExecutionPlanV1({
        ...bound,
        candidateContinuousState: sharedState,
      }, descriptor)).toThrow("must be one owned Float64Array");
    }

    let getterCalled = false;
    const boundDescriptors = Object.fromEntries(
      Object.entries(Object.getOwnPropertyDescriptors(bound))
        .filter(([key]) => key !== "candidateContinuousState"),
    );
    const accessorBound = Object.defineProperties(
      {},
      boundDescriptors,
    );
    Object.defineProperty(accessorBound, "candidateContinuousState", {
      enumerable: true,
      get: () => {
        getterCalled = true;
        return bound.candidateContinuousState;
      },
    });
    expect(() => assertBoundExecutionPlanV1(accessorBound, descriptor))
      .toThrow("must be an enumerable data property");
    expect(getterCalled).toBe(false);
  });

  it("owns descriptor data without invoking hostile accessors", () => {
    let getterCalled = false;
    const hostile = Object.defineProperties({}, {
      definitionId: {
        enumerable: true,
        get: () => {
          getterCalled = true;
          return "hostile";
        },
      },
      hydraulicGraph: { enumerable: true, value: {} },
      policyId: { enumerable: true, value: "policy" },
      schemaId: { enumerable: true, value: "schema" },
      solveGroups: { enumerable: true, value: [] },
      stateLayout: { enumerable: true, value: {} },
      updateGroups: { enumerable: true, value: [] },
    });

    expect(() => validateAndOwnExecutionPlanDescriptorV1(hostile))
      .toThrow("must be an enumerable data property");
    expect(getterCalled).toBe(false);

    const cyclic: Record<string, unknown> = { ...generatedExecutionPlan };
    cyclic.hydraulicGraph = cyclic;
    expect(() => validateAndOwnExecutionPlanDescriptorV1(cyclic))
      .toThrow("must not be cyclic");
  });

  it("rejects duplicate solve-block and residual identities at runtime admission", () => {
    const duplicateBlock = structuredClone(compileMainWire()) as unknown as
      MutableExecutionPlanForTestV1;
    duplicateBlock.solveGroups[0].blocks[1].blockId =
      duplicateBlock.solveGroups[0].blocks[0].blockId;
    expect(() => validateAndOwnExecutionPlanDescriptorV1(duplicateBlock))
      .toThrow("duplicate blockId");

    const duplicateResidual = structuredClone(compileMainWire()) as unknown as
      MutableExecutionPlanForTestV1;
    duplicateResidual.solveGroups[0].blocks[1].residualIds[0] =
      duplicateResidual.solveGroups[0].blocks[0].residualIds[0];
    expect(() => validateAndOwnExecutionPlanDescriptorV1(duplicateResidual))
      .toThrow("residualId is duplicated across solve blocks");
  });
});

type MutableExecutionPlanForTestV1 = {
  solveGroups: Array<{
    blocks: Array<{
      blockId: string;
      residualIds: string[];
    }>;
  }>;
};

function compileMainWire() {
  return compileExecutionPlanV1(
    createMainWireModelDefinitionV1(),
    createMainWireNumericalPolicyV1(),
  );
}

function mainWireKernelCatalog() {
  return Object.freeze({
    componentKernelIds: Object.freeze([
      "accepted-transaction-kernel-v1",
      "noncoronary-backward-euler-kernel-v1",
      "coronary-backward-euler-kernel-v2",
      "five-wall-land-triseg-kernel-v1",
    ]),
    hydraulicPathKernelIds: Object.freeze([
      "noncoronary-flow/resistive",
      "noncoronary-flow/valve",
      "noncoronary-flow/dynamic",
      "coronary-flow/large-arterial",
      "coronary-flow/micro-proximal-arteriolar",
      "coronary-flow/micro-intermediate-capillary",
      "coronary-flow/micro-distal-venular",
      "coronary-flow/large-venous-outlet",
    ]),
  });
}
