import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const args = new Set(process.argv.slice(2));
for (const argument of args) {
  if (argument !== "--summary" && argument !== "--write") {
    throw new Error(`Unsupported execution-plan compiler argument ${argument}`);
  }
}
const json = `${JSON.stringify(plan)}\n`;

// stdout is the deterministic build artifact. Human diagnostics belong on
// stderr so release tooling can redirect stdout without text filtering.
if (args.has("--write")) {
  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const outputPath = path.join(
    repositoryRoot,
    "studio/integrations/mainWireIntegratedV3/"
      + "MainWireIntegratedExecutionPlanV1.generated.json",
  );
  writeFileSync(outputPath, json, "utf8");
  process.stderr.write(`Wrote ${path.relative(repositoryRoot, outputPath)}\n`);
} else {
  process.stdout.write(json);
}
if (args.has("--summary")) {
  const [solve] = plan.solveGroups;
  process.stderr.write(
    `ExecutionPlan ${plan.definitionId} / ${plan.policyId}: `
      + `${plan.stateLayout.logicalSlotCount} logical slots, `
      + `${plan.hydraulicGraph.nodeIds.length} nodes, `
      + `${plan.hydraulicGraph.pathIds.length} paths, `
      + `${solve?.activeUnknownCount ?? 0} active unknowns\n`,
  );
}
