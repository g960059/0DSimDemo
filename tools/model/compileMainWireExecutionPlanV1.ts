import {
  compileExecutionPlanV1,
} from "@/engine/executionPlan/ExecutionPlanCompilerV1";
import {
  createMainWireModelDefinitionV1,
  createMainWireNumericalPolicyV1,
} from "@/engine/executionPlan/MainWireModelDefinitionV1";

const plan = compileExecutionPlanV1(
  createMainWireModelDefinitionV1(),
  createMainWireNumericalPolicyV1(),
);

// stdout is the deterministic build artifact. Human diagnostics belong on
// stderr so release tooling can redirect stdout without text filtering.
process.stdout.write(`${JSON.stringify(plan)}\n`);
if (process.argv.includes("--summary")) {
  const [solve] = plan.solveGroups;
  process.stderr.write(
    `ExecutionPlan ${plan.definitionId} / ${plan.policyId}: `
      + `${plan.stateLayout.logicalSlotCount} logical slots, `
      + `${plan.hydraulicGraph.nodeIds.length} nodes, `
      + `${plan.hydraulicGraph.pathIds.length} paths, `
      + `${solve?.activeUnknownCount ?? 0} active unknowns\n`,
  );
}
