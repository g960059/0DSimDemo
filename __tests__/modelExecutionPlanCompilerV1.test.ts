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
  bindExecutionPlanSolveSystemRuntimeV1,
  executionPlanBaseTickAtTimeV1,
  executionPlanPresentationBaseTickV1,
  executionPlanTimeAtBaseTickV1,
  executionPlanUpdateGroupIsDueAtBaseTickV1,
  prepareBoundExecutionPlanSolveGroupV1,
  resolveBoundExecutionPlanHydraulicDispatchV1,
  resolveBoundExecutionPlanStateDispatchV1,
  resolveBoundExecutionPlanSolveDispatchV1,
  resolveBoundExecutionPlanUpdateScheduleV1,
  validateAndOwnExecutionPlanDescriptorV1,
  validateAndOwnExecutionPlanKernelCatalogV1,
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
  MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
} from "@/engine/vnext/coupled/CoupledHemodynamicsLayoutV1";
import {
  bindMainWireFiveWallCoupledExecutionPlanRuntimeV1,
  resolveMainWireHydraulicExecutionPlanDispatchV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";
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
    expect(new Set(plan.stateLayout.slots.map(({ authorityPointer }) =>
      authorityPointer)).size).toBe(100);
    expect(plan.stateLayout.slots[0]?.authorityPointer)
      .toBe("/acceptedTimeSec");
    expect(plan.stateLayout.slots[
      MAIN_WIRE_ACCEPTED_TYPED_HEMODYNAMIC_LAYOUT_V1.mvcActive
    ]?.authorityPointer)
      .toBe("/coronary/mvcReferenceState/mitralForwardFlowActive");
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
    expect(solve?.systemKernelId)
      .toBe(MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID);
    expect(solve?.blocks.map(({
      blockId,
      componentId,
      kernelId,
      start,
      length,
      endExclusive,
    }) => ({
      blockId,
      componentId,
      kernelId,
      start,
      length,
      endExclusive,
    }))).toEqual([
      {
        blockId: "nonCoronary",
        componentId: "noncoronary-circulation",
        kernelId: "noncoronary-backward-euler-kernel-v1",
        ...COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.nonCoronary,
      },
      {
        blockId: "coronary",
        componentId: "coronary-circulation",
        kernelId: "coronary-backward-euler-kernel-v2",
        ...COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.coronary,
      },
      {
        blockId: "triSeg",
        componentId: "five-wall-mechanics",
        kernelId: "five-wall-land-triseg-kernel-v1",
        ...COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.triSeg,
      },
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
    expect(plan.updateSchedule).toEqual({
      baseTickSec: 0.002,
      presentationPeriodTicks: 1,
      presentationStepSec: 0.002,
      groups: [{
        updateGroupId: "coupled-hemodynamics-be-step",
        ordinal: 0,
        periodTicks: 1,
        phaseTicks: 0,
        effectiveStepSec: 0.002,
        integration: "fixed-step-backward-euler",
        solveGroupId: "coupled-hemodynamics",
        solveGroupIndex: 0,
      }],
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
    expect(plan.hydraulicGraph.nodeComponentBlockIndices.slice(0, 15))
      .toEqual(Array(15).fill(1));
    expect(plan.hydraulicGraph.nodeComponentBlockIndices.slice(15))
      .toEqual(Array(16).fill(2));
    const coronaryInlet = plan.hydraulicGraph.pathIds.indexOf("Ao_LAD.Art");
    expect(coronaryInlet).toBeGreaterThanOrEqual(0);
    expect(plan.hydraulicGraph.upstreamNodeIndices[coronaryInlet])
      .toBe(plan.hydraulicGraph.nodeIds.indexOf("Ao"));
    expect(plan.hydraulicGraph.downstreamNodeIndices[coronaryInlet])
      .toBe(plan.hydraulicGraph.nodeIds.indexOf("LAD.Art"));
    expect(plan.hydraulicGraph.pathComponentBlockIndices[coronaryInlet])
      .toBe(2);
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

  it("compiles a reviewable integer multirate schedule", () => {
    const policy = createMainWireNumericalPolicyV1();
    const compiled = compileExecutionPlanV1(
      createMainWireModelDefinitionV1(),
      Object.freeze({
        ...policy,
        timebase: Object.freeze({
          baseTickSec: 0.001,
          presentationPeriodTicks: 2,
        }),
        updateGroups: Object.freeze([
          Object.freeze({
            ...policy.updateGroups[0]!,
            periodTicks: 2,
          }),
          Object.freeze({
            ...policy.updateGroups[0]!,
            updateGroupId: "synthetic-slower-coupled-step",
            ordinal: 1,
            periodTicks: 10,
            phaseTicks: 5,
          }),
        ]),
      }),
    );

    expect(compiled.updateSchedule).toEqual({
      baseTickSec: 0.001,
      presentationPeriodTicks: 2,
      presentationStepSec: 0.002,
      groups: [
        expect.objectContaining({
          updateGroupId: "coupled-hemodynamics-be-step",
          periodTicks: 2,
          phaseTicks: 0,
          effectiveStepSec: 0.002,
          solveGroupIndex: 0,
        }),
        expect.objectContaining({
          updateGroupId: "synthetic-slower-coupled-step",
          periodTicks: 10,
          phaseTicks: 5,
          effectiveStepSec: 0.01,
          solveGroupIndex: 0,
        }),
      ],
    });
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
    expect(compiled.hydraulicGraph.pathComponentBlockIndices[bypassIndex])
      .toBe(1);
    const bound = bindExecutionPlanV1(compiled, {
      ...mainWireKernelCatalog(),
      hydraulicPathKernelIds: [
        ...mainWireKernelCatalog().hydraulicPathKernelIds,
        "synthetic-flow/resistive",
      ],
    });
    const hydraulicDispatch =
      resolveBoundExecutionPlanHydraulicDispatchV1(bound);
    expect(hydraulicDispatch.paths.at(-1))
      .toEqual({
        pathId: "synthetic.VC_LA-bypass",
        componentId: "noncoronary-circulation",
        componentKernelId: "noncoronary-backward-euler-kernel-v1",
        componentKernelBindingOrdinal: 1,
        upstreamNodeIndex: compiled.hydraulicGraph.nodeIds.indexOf("VC"),
        downstreamNodeIndex: compiled.hydraulicGraph.nodeIds.indexOf("LA"),
        pathKernelId: "synthetic-flow/resistive",
        pathKernelBindingOrdinal:
          mainWireKernelCatalog().hydraulicPathKernelIds.length,
      });
    expect(() => bindMainWireFiveWallCoupledExecutionPlanRuntimeV1({
      dispatch: resolveBoundExecutionPlanSolveDispatchV1(
        bound,
        "coupled-hemodynamics",
      ),
      hydraulicDispatch,
      workspace: prepareBoundExecutionPlanSolveGroupV1(
        bound,
        "coupled-hemodynamics",
      ),
    })).toThrow(/hydraulic execution-plan dimensions drifted/);
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

  it("rejects missing, duplicated, and malformed authority pointers", () => {
    const definition = createMainWireModelDefinitionV1();
    const policy = createMainWireNumericalPolicyV1();
    const mutable = structuredClone(definition) as unknown as {
      components: Array<{
        states: Array<{ authorityPointer?: string }>;
      }>;
    };
    delete mutable.components[0]!.states[0]!.authorityPointer;
    expect(() => compileExecutionPlanV1(
      mutable as unknown as ModelDefinitionV1,
      policy,
    )).toThrow(/fields must match exactly/);

    const duplicated = structuredClone(definition) as unknown as {
      components: Array<{
        states: Array<{ authorityPointer: string }>;
      }>;
    };
    duplicated.components[0]!.states[1]!.authorityPointer =
      duplicated.components[0]!.states[0]!.authorityPointer;
    expect(() => compileExecutionPlanV1(
      duplicated as unknown as ModelDefinitionV1,
      policy,
    )).toThrow(/duplicate model-state authority pointer/);

    const malformed = structuredClone(definition) as unknown as {
      components: Array<{
        states: Array<{ authorityPointer: string }>;
      }>;
    };
    malformed.components[0]!.states[0]!.authorityPointer = "relative/path";
    expect(() => compileExecutionPlanV1(
      malformed as unknown as ModelDefinitionV1,
      policy,
    )).toThrow(/absolute JSON pointer/);
  });

  it("rejects one solve block spanning multiple component owners", () => {
    const definition = createMainWireModelDefinitionV1();
    const policy = structuredClone(
      createMainWireNumericalPolicyV1(),
    ) as unknown as {
      solveGroups: Array<{
        unknownBlocks: Array<{
          stateIds: string[];
          residualIds: string[];
        }>;
      }>;
    };
    const blocks = policy.solveGroups[0]!.unknownBlocks;
    blocks[0]!.stateIds[0] = blocks[1]!.stateIds[0]!;

    expect(() => compileExecutionPlanV1(
      definition,
      policy as unknown as NumericalPolicyV1,
    )).toThrow("spans multiple component owners");
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

    const invalidPhase = structuredClone(policy) as unknown as {
      updateGroups: Array<{ periodTicks: number; phaseTicks: number }>;
    };
    invalidPhase.updateGroups[0]!.periodTicks = 4;
    invalidPhase.updateGroups[0]!.phaseTicks = 4;
    expect(() => compileExecutionPlanV1(
      definition,
      invalidPhase as unknown as NumericalPolicyV1,
    )).toThrow("phaseTicks must be below periodTicks");
  });

  it("keeps the checked-in descriptor byte-semantically equal to compilation", () => {
    expect(validateAndOwnExecutionPlanDescriptorV1(generatedExecutionPlan))
      .toEqual(compileMainWire());
  });

  it("reuses only privately owned immutable descriptor and kernel data", () => {
    const sourceDescriptor = structuredClone(compileMainWire());
    const ownedDescriptor = validateAndOwnExecutionPlanDescriptorV1(
      sourceDescriptor,
    );
    expect(ownedDescriptor).not.toBe(sourceDescriptor);
    expect(validateAndOwnExecutionPlanDescriptorV1(ownedDescriptor))
      .toBe(ownedDescriptor);

    const sourceCatalog = mainWireKernelCatalog();
    const ownedCatalog = validateAndOwnExecutionPlanKernelCatalogV1(
      sourceCatalog,
    );
    expect(ownedCatalog).not.toBe(sourceCatalog);
    expect(validateAndOwnExecutionPlanKernelCatalogV1(ownedCatalog))
      .toBe(ownedCatalog);

    const bound = bindExecutionPlanV1(ownedDescriptor, ownedCatalog);
    expect(() => assertBoundExecutionPlanV1(bound, ownedDescriptor))
      .not.toThrow();
    expect(() => assertBoundExecutionPlanV1({ ...bound }, ownedDescriptor))
      .not.toThrow();

    const changedDescriptor = {
      ...ownedDescriptor,
      definitionId: `${ownedDescriptor.definitionId}.other`,
    };
    expect(() => assertBoundExecutionPlanV1(bound, changedDescriptor))
      .toThrow(/descriptor identity mismatch/);
  });

  it("binds exact kernel IDs and allocates one nonaliasing Worker plan", () => {
    const descriptor = compileMainWire();
    const bound = bindExecutionPlanV1(descriptor, mainWireKernelCatalog());
    const [solve] = bound.solveGroups;

    expect(bound.definitionId).toBe(descriptor.definitionId);
    expect(Object.keys(bound)).not.toContain("currentContinuousState");
    expect(Object.keys(bound)).not.toContain("candidateContinuousState");
    expect(Object.keys(bound)).not.toContain("acceptedStateLogicalScratch");
    expect(bound.graphUpstreamNodeIndices).toHaveLength(37);
    expect(bound.graphDownstreamNodeIndices).toHaveLength(37);
    expect(solve?.activeStateLogicalIndices).toHaveLength(30);
    expect(solve?.dependentStateLogicalIndices).toHaveLength(1);
    expect(solve?.workspaceF64).toHaveLength(2 * 30 * 30 + 9 * 30);
    expect(solve?.workspaceInt32).toHaveLength(30);
    expect(bound.allocatedBytes).toBeGreaterThan(0);
    expect(solve?.workspaceF64.buffer)
      .not.toBe(solve?.workspaceInt32.buffer);
    expect(resolveBoundExecutionPlanSolveDispatchV1(
      bound,
      "coupled-hemodynamics",
    )).toEqual({
      solveGroupId: "coupled-hemodynamics",
      systemKernelId: MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
      solveSystemKernelBindingOrdinal: 0,
      totalUnknownCount: 32,
      activeUnknownCount: 30,
      blocks: [
        {
          blockId: "nonCoronary",
          componentId: "noncoronary-circulation",
          kernelId: "noncoronary-backward-euler-kernel-v1",
          componentKernelBindingOrdinal: 1,
          disposition: "retained",
          start: 0,
          length: 14,
          endExclusive: 14,
        },
        {
          blockId: "coronary",
          componentId: "coronary-circulation",
          kernelId: "coronary-backward-euler-kernel-v2",
          componentKernelBindingOrdinal: 2,
          disposition: "retained",
          start: 14,
          length: 16,
          endExclusive: 30,
        },
        {
          blockId: "triSeg",
          componentId: "five-wall-mechanics",
          kernelId: "five-wall-land-triseg-kernel-v1",
          componentKernelBindingOrdinal: 3,
          disposition: "statically-condensed",
          start: 30,
          length: 2,
          endExclusive: 32,
        },
      ],
    });
    const hydraulicDispatch =
      resolveBoundExecutionPlanHydraulicDispatchV1(bound);
    expect(hydraulicDispatch.nodes).toHaveLength(31);
    expect(hydraulicDispatch.paths).toHaveLength(37);
    expect(hydraulicDispatch.nodes[0]).toEqual({
      nodeId: "LV",
      componentId: "noncoronary-circulation",
      componentKernelId: "noncoronary-backward-euler-kernel-v1",
      componentKernelBindingOrdinal: 1,
      storageStateLogicalIndex: 3,
    });
    expect(hydraulicDispatch.paths[15]).toEqual({
      pathId: "Ao_LAD.Art",
      componentId: "coronary-circulation",
      componentKernelId: "coronary-backward-euler-kernel-v2",
      componentKernelBindingOrdinal: 2,
      upstreamNodeIndex: 4,
      downstreamNodeIndex: 15,
      pathKernelId: "coronary-flow/large-arterial",
      pathKernelBindingOrdinal: 3,
    });
    expect(() => resolveBoundExecutionPlanHydraulicDispatchV1({ ...bound }))
      .toThrow(/requires a bound plan/);
    const stateDispatch = resolveBoundExecutionPlanStateDispatchV1(bound);
    expect(stateDispatch.slots[0]).toEqual({
      stateId: "accepted.timeSec",
      authorityPointer: "/acceptedTimeSec",
      logicalIndex: 0,
      storageKind: "continuous-f64",
    });
    expect(stateDispatch.slots).toHaveLength(100);
    expect(() => resolveBoundExecutionPlanStateDispatchV1({ ...bound }))
      .toThrow(/requires a bound plan/);
    const updateSchedule = resolveBoundExecutionPlanUpdateScheduleV1(bound);
    expect(updateSchedule).toEqual({
      definitionId: descriptor.definitionId,
      policyId: descriptor.policyId,
      baseTickSec: 0.002,
      presentationPeriodTicks: 1,
      presentationStepSec: 0.002,
      groups: [{
        ...descriptor.updateSchedule.groups[0]!,
        systemKernelId: MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
        solveSystemKernelBindingOrdinal: 0,
      }],
    });
    expect(executionPlanBaseTickAtTimeV1(updateSchedule, 0.814)).toBe(407);
    expect(executionPlanPresentationBaseTickV1(updateSchedule, 407, 3))
      .toBe(410);
    expect(executionPlanTimeAtBaseTickV1(updateSchedule, 410))
      .toBeCloseTo(0.82, 15);
    expect(executionPlanUpdateGroupIsDueAtBaseTickV1(
      updateSchedule,
      updateSchedule.groups[0]!,
      410,
    )).toBe(true);
    expect(() => executionPlanUpdateGroupIsDueAtBaseTickV1(
      updateSchedule,
      { ...updateSchedule.groups[0]! },
      410,
    )).toThrow(/does not belong/);
    expect(() => executionPlanBaseTickAtTimeV1(updateSchedule, 0.813))
      .toThrow(/not on its base timebase/);
    expect(() => resolveBoundExecutionPlanUpdateScheduleV1({ ...bound }))
      .toThrow(/requires a bound plan/);
    expect(() => executionPlanTimeAtBaseTickV1(
      { ...updateSchedule },
      1,
    )).toThrow(/must be compiler-bound/);
    expect(() => assertBoundExecutionPlanV1(bound, descriptor)).not.toThrow();
  });

  it("binds one model-owned solve system by compiled ordinal", () => {
    const descriptor = compileMainWire();
    const bound = bindExecutionPlanV1(descriptor, mainWireKernelCatalog());
    const workspace = prepareBoundExecutionPlanSolveGroupV1(
      bound,
      "coupled-hemodynamics",
    );
    const boundInput = bindExecutionPlanSolveSystemRuntimeV1(
      bound,
      "coupled-hemodynamics",
      workspace,
      [Object.freeze({
        systemKernelId: MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
        bind: (input) => input,
      })],
    );

    expect(boundInput.workspace).toBe(workspace);
    expect(boundInput.hydraulicDispatch)
      .toBe(resolveBoundExecutionPlanHydraulicDispatchV1(bound));
    expect(boundInput.dispatch.systemKernelId)
      .toBe(MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID);
    expect(() => bindExecutionPlanSolveSystemRuntimeV1(
      bound,
      "coupled-hemodynamics",
      { ...workspace },
      [Object.freeze({
        systemKernelId: MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
        bind: (input) => input,
      })],
    )).toThrow(/requires its bound workspace/);
    expect(() => bindExecutionPlanSolveSystemRuntimeV1(
      bound,
      "coupled-hemodynamics",
      workspace,
      [Object.freeze({
        systemKernelId: "synthetic-solve-system-v1",
        bind: (input) => input,
      })],
    )).toThrow(/binding order drifted/);
  });

  it("admits exact Main Wire topology and rejects structural lookalikes", () => {
    const descriptor = compileMainWire();
    const bound = bindExecutionPlanV1(descriptor, mainWireKernelCatalog());
    const workspace = prepareBoundExecutionPlanSolveGroupV1(
      bound,
      "coupled-hemodynamics",
    );
    const dispatch = resolveBoundExecutionPlanSolveDispatchV1(
      bound,
      "coupled-hemodynamics",
    );
    const hydraulicDispatch =
      resolveBoundExecutionPlanHydraulicDispatchV1(bound);
    const admitted = bindMainWireFiveWallCoupledExecutionPlanRuntimeV1({
      dispatch,
      hydraulicDispatch,
      workspace,
    });

    expect(resolveMainWireHydraulicExecutionPlanDispatchV1(admitted))
      .toBe(hydraulicDispatch);
    expect(() => bindMainWireFiveWallCoupledExecutionPlanRuntimeV1({
      dispatch,
      hydraulicDispatch: {
        ...hydraulicDispatch,
        paths: hydraulicDispatch.paths.map((path, index) => index === 0
          ? { ...path, downstreamNodeIndex: 1 }
          : path),
      },
      workspace,
    })).toThrow(/must be compiler-bound/);
  });

  it("keeps state authority external while owning persistent solver scratch", () => {
    const descriptor = compileMainWire();
    const bound = bindExecutionPlanV1(descriptor, mainWireKernelCatalog());
    const dispatch = resolveBoundExecutionPlanStateDispatchV1(bound);
    expect(dispatch.logicalSlotCount).toBe(100);
    expect(dispatch.continuousSlotCount).toBe(99);
    expect(dispatch.booleanSlotCount).toBe(1);
    const solveWorkspace = prepareBoundExecutionPlanSolveGroupV1(
      bound,
      "coupled-hemodynamics",
    );
    expect([...solveWorkspace.currentUnknowns]).toEqual(
      Array.from({ length: 30 }, () => 0),
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

    expect(() => prepareBoundExecutionPlanSolveGroupV1(
      { ...bound },
      "coupled-hemodynamics",
    )).toThrow(/requires a bound plan/);
    expect(() => resolveBoundExecutionPlanSolveDispatchV1(
      { ...bound },
      "coupled-hemodynamics",
    )).toThrow(/requires a bound plan/);
    expect(() => prepareBoundExecutionPlanSolveGroupV1(
      bound,
      "missing-solve-group",
    )).toThrow(/is unavailable/);
  });

  it("fails closed on missing, extra, and descriptor-mismatched bindings", () => {
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
    expect(() => validateAndOwnExecutionPlanDescriptorV1({
      ...descriptor,
      solveGroups: [{
        ...descriptorGroup!,
        blocks: descriptorGroup!.blocks.map((block, index) => index === 0
          ? {
            ...block,
            componentId: "coronary-circulation",
            kernelId: "coronary-backward-euler-kernel-v2",
          }
          : block),
      }],
    })).toThrow(/component ownership mismatch/);
    expect(() => validateAndOwnExecutionPlanDescriptorV1({
      ...descriptor,
      hydraulicGraph: {
        ...descriptor.hydraulicGraph,
        nodeComponentBlockIndices:
          descriptor.hydraulicGraph.nodeComponentBlockIndices.map(
            (componentIndex, index) => index === 0 ? 2 : componentIndex,
          ),
      },
    })).toThrow(/node component ownership is inconsistent/);
    expect(() => validateAndOwnExecutionPlanDescriptorV1({
      ...descriptor,
      hydraulicGraph: {
        ...descriptor.hydraulicGraph,
        pathComponentBlockIndices:
          descriptor.hydraulicGraph.pathComponentBlockIndices.map(
            (componentIndex, index) => index === 0 ? 99 : componentIndex,
          ),
      },
    })).toThrow(/path endpoints or component ownership are invalid/);
    expect(() => validateAndOwnExecutionPlanDescriptorV1({
      ...descriptor,
      updateSchedule: {
        ...descriptor.updateSchedule,
        groups: descriptor.updateSchedule.groups.map((group, index) =>
          index === 0
            ? { ...group, effectiveStepSec: group.effectiveStepSec * 2 }
            : group),
      },
    })).toThrow(/does not match the timebase/);
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
    expect(() => bindExecutionPlanV1(descriptor, {
      ...catalog,
      solveSystemKernelIds: [],
    })).toThrow("solve system kernel bindings must match exactly");

    const bound = bindExecutionPlanV1(descriptor, catalog);
    expect(() => assertBoundExecutionPlanV1({
      ...bound,
      bindingCatalog: {
        ...bound.bindingCatalog,
        componentKernelIds: [
          ...bound.bindingCatalog.componentKernelIds,
          "synthetic-component/unregistered",
        ],
      },
    }, descriptor)).toThrow("component kernel bindings must match exactly");
    expect(() => assertBoundExecutionPlanV1({
      ...bound,
      bindingCatalog: {
        ...bound.bindingCatalog,
        hydraulicPathKernelIds: [
          ...bound.bindingCatalog.hydraulicPathKernelIds,
          "synthetic-flow/unregistered",
        ],
      },
    }, descriptor)).toThrow("hydraulic path kernel bindings must match exactly");
    expect(() => assertBoundExecutionPlanV1({
      ...bound,
      bindingCatalog: {
        ...bound.bindingCatalog,
        solveSystemKernelIds: [
          ...bound.bindingCatalog.solveSystemKernelIds,
          "synthetic-solve/unregistered",
        ],
      },
    }, descriptor)).toThrow("solve system kernel bindings must match exactly");
    const wrongGraph = new Int32Array(bound.graphUpstreamNodeIndices);
    wrongGraph[0] = wrongGraph[0] === 0 ? 1 : 0;
    expect(() => assertBoundExecutionPlanV1({
      ...bound,
      graphUpstreamNodeIndices: wrongGraph,
    }, descriptor)).toThrow("values do not match descriptor");
    if (typeof SharedArrayBuffer !== "undefined") {
      const sharedGraph = new Int32Array(new SharedArrayBuffer(
        bound.graphDownstreamNodeIndices.byteLength,
      ));
      expect(() => assertBoundExecutionPlanV1({
        ...bound,
        graphDownstreamNodeIndices: sharedGraph,
      }, descriptor)).toThrow("must be one owned Int32Array");
    }

    let getterCalled = false;
    const boundDescriptors = Object.fromEntries(
      Object.entries(Object.getOwnPropertyDescriptors(bound))
        .filter(([key]) => key !== "graphDownstreamNodeIndices"),
    );
    const accessorBound = Object.defineProperties(
      {},
      boundDescriptors,
    );
    Object.defineProperty(accessorBound, "graphDownstreamNodeIndices", {
      enumerable: true,
      get: () => {
        getterCalled = true;
        return bound.graphDownstreamNodeIndices;
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
      updateSchedule: { enumerable: true, value: {} },
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
    solveSystemKernelIds: Object.freeze([
      MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
    ]),
  });
}
