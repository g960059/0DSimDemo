import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import sourcesRegistry from "@/data/myocardium/sources.json";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
  LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT,
  LAND2017_LOCAL_JACOBIAN_SIZE,
  LAND2017_SOURCE_DOI,
  LAND2017_SOURCE_ID,
  LAND2017_STATE_INDEX,
  LAND2017_STATE_SIZE,
  computeLand2017ActiveStiffnessPa,
  deriveLand2017StepKinematics,
  evaluateLand2017StepOutput,
  land2017CaTRPNUnblockingFactor,
  land2017ParameterSetHashInput,
  stableHash,
  writeLand2017BackwardEulerResidual,
  writeLand2017BackwardEulerResidualJacobian,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";

const checks: string[] = [];
const errors: string[] = [];

check("source registry and parameter metadata are deterministic", () => {
  const source = sourcesRegistry.sources.find((entry) => entry.id === LAND2017_SOURCE_ID);
  assert(source?.verificationStatus === "verified");
  assert(source?.doi === LAND2017_SOURCE_DOI);
  assert(source.roles.includes("equations"));
  assert(source.roles.includes("source-parameters"));

  const parameterSet = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
  assert(parameterSet.parameterSetId === LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID);
  assert(parameterSet.parameterSetStableHash === stableHash(land2017ParameterSetHashInput(parameterSet)));
  assert(Object.isFrozen(parameterSet));
  assert(Object.isFrozen(parameterSet.values));

  const runtimeParameters = Object.keys(parameterSet.values).sort();
  assertDeepEqual(parameterSet.sourceParameters.map((entry) => entry.parameter).sort(), runtimeParameters);
  assert(parameterSet.values.Tref === 40500);
  assert(!parameterSet.sourceParameters.map((entry) => entry.location).join("\n").toLowerCase().includes("whole-organ"));
  for (const entry of parameterSet.sourceParameters) {
    assert(entry.sourceId === LAND2017_SOURCE_ID);
    assert(entry.doi === LAND2017_SOURCE_DOI);
    assert(entry.location.includes("Appendix"));
    assert(entry.original.unit.length > 0);
    assert(entry.runtime.unit.length > 0);
    assert(Number.isFinite(entry.original.value));
    assert(Number.isFinite(entry.runtime.value));
  }
});

check("Eq 48 CaTRPN factor limit is explicit source behavior", () => {
  const state = Float64Array.from([0.05, 0.12, 0.08, 0.04, 0.06, 0.12]);
  const output = evaluateLand2017StepOutput(state, representativeStepInput());
  assert(
    land2017CaTRPNUnblockingFactor(
      state[LAND2017_STATE_INDEX.CaTRPN],
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values,
    ) === LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT,
  );
  assert(output.health.projectionUsed === false);
});

check("BE strain rate is derived and SDIRK2 is rejected", () => {
  const input = representativeStepInput();
  assertClose(deriveLand2017StepKinematics(input).stageFiberEngineeringStrainRatePerSec, 25, 1e-12);
  assertThrows(() =>
    deriveLand2017StepKinematics({
      ...input,
      stage: { scheme: "SDIRK2", stageIndex: 0, gamma: 0.292893218 },
    }),
  );
});

check("residual Jacobian matches finite-difference smoke", () => {
  const next = representativeState();
  const previous = Float64Array.from([0.52, 0.105, 0.07, 0.035, 0.045, 0.09]);
  const input = representativeStepInput();
  const analytic = writeLand2017BackwardEulerResidualJacobian(next, input);
  const epsilon = 1e-6;

  assert(analytic.length === LAND2017_LOCAL_JACOBIAN_SIZE);
  for (let column = 0; column < LAND2017_STATE_SIZE; column += 1) {
    const plus = Float64Array.from(next);
    const minus = Float64Array.from(next);
    plus[column] += epsilon;
    minus[column] -= epsilon;
    const residualPlus = writeLand2017BackwardEulerResidual(plus, previous, input);
    const residualMinus = writeLand2017BackwardEulerResidual(minus, previous, input);
    for (let row = 0; row < LAND2017_STATE_SIZE; row += 1) {
      const finiteDifference = (residualPlus[row] - residualMinus[row]) / (2 * epsilon);
      assertClose(analytic[row * LAND2017_STATE_SIZE + column], finiteDifference, 5e-5);
    }
  }
});

check("source output has no projection, source-grounded stabilization, and direct-output tangents absent", () => {
  const state = representativeState();
  const input = representativeStepInput();
  const output = evaluateLand2017StepOutput(state, input);
  assert(Number.isFinite(output.sourceActiveFiberStressPa));
  assert(output.sourceStressConvention === "land2017-Ta");
  assert(output.health.finite);
  assert(output.health.projectionUsed === false);
  assertClose(
    output.stabilizationStiffnessPa,
    computeLand2017ActiveStiffnessPa(state, { fiberEngineeringStrain: input.stageFiberEngineeringStrain }),
    1e-12,
  );
  assert(output.stabilizationStiffnessPa > 0);
  assert(!Object.hasOwn(output, "algorithmicTangentPa"));
  assert(!Object.hasOwn(output, "frozenStateTangentPa"));
});

check("Land source imports stay inside the Phase 1B boundary", () => {
  const disallowed: string[] = [];
  for (const file of landSourceFiles()) {
    const source = readFileSync(file, "utf8");
    for (const specifier of importSpecifiers(source)) {
      if (isDisallowedLandImport(specifier)) {
        disallowed.push(`${path.relative(process.cwd(), file)} -> ${specifier}`);
      }
    }
  }
  assertDeepEqual(disallowed, []);
});

if (errors.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`myocardium Phase 1B Land source FAIL checks=${checks.length} errors=${errors.length}`);
  for (const error of errors) {
    // eslint-disable-next-line no-console
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 1B Land source PASS checks=${checks.length}; ` +
      "source metadata grounded; BE residual/Jacobian smoke passed; projection disabled; " +
      "stabilizationStiffnessPa source-grounded; direct-output tangents absent",
  );
}

function representativeState(): Float64Array {
  return Float64Array.from([0.55, 0.12, 0.08, 0.04, 0.06, 0.12]);
}

function representativeStepInput(): LandStepInput {
  return {
    freeCalciumUM: 0.92,
    previousFiberEngineeringStrain: 0.015,
    stageFiberEngineeringStrain: 0.02,
    dtSec: 0.0002,
    stage: { scheme: "BE", stageIndex: 0 },
  };
}

function landSourceFiles(): string[] {
  const root = path.join(process.cwd(), "engine", "myocardium", "myofilament", "land2017");
  return collectTsFiles(root);
}

function collectTsFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTsFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".ts") ? [fullPath] : [];
  });
}

function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const importExportPattern = /\b(?:import|export)\b(?:\s+type)?(?:[^'"]*?\sfrom\s*)?["']([^"']+)["']/g;
  for (const match of source.matchAll(importExportPattern)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

function isDisallowedLandImport(specifier: string): boolean {
  if (specifier === "react" || specifier.startsWith("react/")) return true;
  if (specifier.includes("/myofilament/land2017/protocols")) return false;
  if (specifier.includes("/data/myocardium/protocols/")) return false;
  const disallowedFragments = [
    "/ModelCore",
    "/chambers",
    "/core/",
    "/protocol",
    "/runtime",
    "/schema",
    "/homogenization",
    "/coupling",
    "/calcium",
    "/activation",
    "/mechanics",
    "/material",
    "/generalizedForces",
    "/backends",
    "/components",
    "/ui",
  ];
  return disallowedFragments.some((fragment) => specifier.includes(fragment));
}

function check(label: string, fn: () => void): void {
  checks.push(label);
  try {
    fn();
  } catch (error) {
    errors.push(`${label}: ${(error as Error).message}`);
  }
}

function assert(condition: unknown): asserts condition {
  if (!condition) throw new Error("assertion failed");
}

function assertDeepEqual(left: unknown, right: unknown): void {
  const leftJson = JSON.stringify(left);
  const rightJson = JSON.stringify(right);
  if (leftJson !== rightJson) {
    throw new Error(`expected ${rightJson}, got ${leftJson}`);
  }
}

function assertClose(left: number, right: number, tolerance: number): void {
  if (Math.abs(left - right) > tolerance) {
    throw new Error(`expected ${left} to be within ${tolerance} of ${right}`);
  }
}

function assertThrows(fn: () => void): void {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error("expected function to throw");
}
