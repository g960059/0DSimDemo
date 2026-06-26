import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sourcesRegistry from "@/data/myocardium/sources.json";
import { buildDynamicStateLayout } from "@/engine/myocardium/state/StateLayoutBuilder";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
  LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT,
  LAND2017_LOCAL_JACOBIAN_SIZE,
  LAND2017_SOURCE_DOI,
  LAND2017_SOURCE_ID,
  LAND2017_STABILIZATION_STIFFNESS_PLACEHOLDER_PA,
  LAND2017_STATE_INDEX,
  LAND2017_STATE_LABELS,
  LAND2017_STATE_SIZE,
  deriveLand2017StepKinematics,
  evaluateLand2017StepOutput,
  land2017CaTRPNUnblockingFactor,
  land2017ParameterSetHashInput,
  makeLand2017StateBlockDescriptor,
  stableHash,
  writeLand2017BackwardEulerResidual,
  writeLand2017BackwardEulerResidualJacobian,
  writeLand2017Rhs,
  type LandContinuousInput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";

describe("myocardium Phase 1B Land 2017 source", () => {
  it("has deterministic source parameter ID, hash, registry grounding, and provenance", () => {
    const parameterSet = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
    const source = sourcesRegistry.sources.find((entry) => entry.id === LAND2017_SOURCE_ID);

    expect(parameterSet.parameterSetId).toBe(LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID);
    expect(parameterSet.sourceId).toBe(LAND2017_SOURCE_ID);
    expect(parameterSet.doi).toBe(LAND2017_SOURCE_DOI);
    expect(source).toMatchObject({
      id: LAND2017_SOURCE_ID,
      verificationStatus: "verified",
      doi: LAND2017_SOURCE_DOI,
    });
    expect(source?.roles).toEqual(expect.arrayContaining(["equations", "source-parameters"]));
    expect(Object.isFrozen(parameterSet)).toBe(true);
    expect(Object.isFrozen(parameterSet.values)).toBe(true);
    expect(parameterSet.parameterSetStableHash).toBe(stableHash(land2017ParameterSetHashInput(parameterSet)));
    expect(stableHash(land2017ParameterSetHashInput(parameterSet))).toBe(
      stableHash(land2017ParameterSetHashInput(parameterSet)),
    );

    const runtimeParameters = Object.keys(parameterSet.values).sort();
    expect(parameterSet.sourceParameters.map((entry) => entry.parameter).sort()).toEqual(runtimeParameters);
    for (const entry of parameterSet.sourceParameters) {
      expect(entry.sourceId).toBe(LAND2017_SOURCE_ID);
      expect(entry.doi).toBe(LAND2017_SOURCE_DOI);
      expect(entry.location).toMatch(/Appendix/);
      expect(entry.original.unit.length).toBeGreaterThan(0);
      expect(entry.runtime.unit.length).toBeGreaterThan(0);
      expect(Number.isFinite(entry.original.value)).toBe(true);
      expect(Number.isFinite(entry.runtime.value)).toBe(true);
    }
    expect(parameterSet.values.kTRPN).toBe(100);
    expect(parameterSet.values.gammaW).toBe(615);
    expect(parameterSet.values.Tref).toBe(40500);
    expect(parameterSet.sourceParameters.map((entry) => entry.location).join("\n")).not.toMatch(/whole-organ/i);
    expect(parameterSet.derivedParameters.map((entry) => entry.location)).toEqual(
      expect.arrayContaining([expect.stringContaining("Eq 61"), expect.stringContaining("Eq 58")]),
    );
  });

  it("publishes the six Land states in spec order and deterministic layout hashes", () => {
    const descriptor = makeLand2017StateBlockDescriptor(
      { chamber: "LV", wallId: "free-wall", moduleId: "myofilament", instanceId: "lv-global" },
      "myofilament.lv.land2017",
    );
    const layoutA = buildDynamicStateLayout([descriptor]);
    const layoutB = buildDynamicStateLayout([{ ...descriptor }]);
    const relabeled = buildDynamicStateLayout([
      { ...descriptor, labels: ["CaTRPN", "B", "W", "S", "zetaS", "zetaW"] },
    ]);

    expect(descriptor.owner).toBe("myofilament");
    expect(descriptor.labels).toEqual(["CaTRPN", "B", "W", "S", "zetaW", "zetaS"]);
    expect(descriptor.labels).toEqual(LAND2017_STATE_LABELS);
    expect(descriptor.size).toBe(LAND2017_STATE_SIZE);
    expect(layoutA.layoutHash).toBe(layoutB.layoutHash);
    expect(layoutA.layoutHash).not.toBe(relabeled.layoutHash);
  });

  it("derives BE strain rate from discrete strain history and rejects SDIRK2 for now", () => {
    const input: LandStepInput = {
      freeCalciumUM: 0.9,
      previousFiberEngineeringStrain: 0.01,
      stageFiberEngineeringStrain: 0.04,
      dtSec: 0.003,
      stage: { scheme: "BE", stageIndex: 0 },
    };

    expect(Object.keys(input)).not.toContain("fiberEngineeringStrainRatePerSec");
    expect(deriveLand2017StepKinematics(input).stageFiberEngineeringStrainRatePerSec).toBeCloseTo(10);
    expect(() =>
      deriveLand2017StepKinematics({
        ...input,
        fiberEngineeringStrainRatePerSec: 0,
      } as LandStepInput),
    ).toThrow(/derive strain rate/);
    expect(() =>
      deriveLand2017StepKinematics({
        ...input,
        stage: { scheme: "SDIRK2", stageIndex: 0, gamma: 0.292893218 },
      }),
    ).toThrow(/SDIRK2.*unsupported/);
  });

  it("computes BE residual as next - previous - dt * rhs(next, input)", () => {
    const next = representativeState();
    const previous = Float64Array.from([0.52, 0.105, 0.07, 0.035, 0.045, 0.09]);
    const input = representativeStepInput();
    const rate = deriveLand2017StepKinematics(input).stageFiberEngineeringStrainRatePerSec;
    const rhsInput: LandContinuousInput = {
      freeCalciumUM: input.freeCalciumUM,
      fiberEngineeringStrain: input.stageFiberEngineeringStrain,
      fiberEngineeringStrainRatePerSec: rate,
    };
    const rhs = writeLand2017Rhs(next, rhsInput);
    const residual = writeLand2017BackwardEulerResidual(next, previous, input);

    for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
      expect(residual[index]).toBeCloseTo(next[index] - previous[index] - input.dtSec * rhs[index], 12);
    }
  });

  it("matches analytic local residual Jacobian against finite-difference residual derivatives", () => {
    const next = representativeState();
    const previous = Float64Array.from([0.52, 0.105, 0.07, 0.035, 0.045, 0.09]);
    const input = representativeStepInput();
    const analytic = writeLand2017BackwardEulerResidualJacobian(next, input);
    const epsilon = 1e-6;

    expect(analytic.length).toBe(LAND2017_LOCAL_JACOBIAN_SIZE);
    for (let column = 0; column < LAND2017_STATE_SIZE; column += 1) {
      const plus = Float64Array.from(next);
      const minus = Float64Array.from(next);
      plus[column] += epsilon;
      minus[column] -= epsilon;
      const residualPlus = writeLand2017BackwardEulerResidual(plus, previous, input);
      const residualMinus = writeLand2017BackwardEulerResidual(minus, previous, input);

      for (let row = 0; row < LAND2017_STATE_SIZE; row += 1) {
        const finiteDifference = (residualPlus[row] - residualMinus[row]) / (2 * epsilon);
        expect(analytic[row * LAND2017_STATE_SIZE + column]).toBeCloseTo(finiteDifference, 5);
      }
    }
  });

  it("implements the Eq 48 source factor limit explicitly without projection", () => {
    const cappedState = Float64Array.from([0.05, 0.12, 0.08, 0.04, 0.06, 0.12]);
    const input = representativeStepInput();
    const rate = deriveLand2017StepKinematics(input).stageFiberEngineeringStrainRatePerSec;
    const rhsInput: LandContinuousInput = {
      freeCalciumUM: input.freeCalciumUM,
      fiberEngineeringStrain: input.stageFiberEngineeringStrain,
      fiberEngineeringStrainRatePerSec: rate,
    };
    const parameterSet = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
    const rhs = writeLand2017Rhs(cappedState, rhsInput);
    const U = 1 - cappedState[1] - cappedState[2] - cappedState[3];

    expect(land2017CaTRPNUnblockingFactor(cappedState[0], parameterSet.values)).toBe(
      LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT,
    );
    expect(rhs[LAND2017_STATE_INDEX.B]).toBeCloseTo(
      parameterSet.derived.kb * LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT * U -
        parameterSet.values.ku * Math.pow(cappedState[0], parameterSet.values.nTm / 2) * cappedState[1],
      12,
    );

    const previous = Float64Array.from([0.049, 0.11, 0.075, 0.035, 0.045, 0.09]);
    const analytic = writeLand2017BackwardEulerResidualJacobian(cappedState, input);
    const epsilon = 1e-6;
    const plus = Float64Array.from(cappedState);
    const minus = Float64Array.from(cappedState);
    plus[LAND2017_STATE_INDEX.CaTRPN] += epsilon;
    minus[LAND2017_STATE_INDEX.CaTRPN] -= epsilon;
    const residualPlus = writeLand2017BackwardEulerResidual(plus, previous, input);
    const residualMinus = writeLand2017BackwardEulerResidual(minus, previous, input);
    const finiteDifference =
      (residualPlus[LAND2017_STATE_INDEX.B] - residualMinus[LAND2017_STATE_INDEX.B]) / (2 * epsilon);

    expect(analytic[LAND2017_STATE_INDEX.B * LAND2017_STATE_SIZE + LAND2017_STATE_INDEX.CaTRPN]).toBeCloseTo(
      finiteDifference,
      5,
    );
    expect(evaluateLand2017StepOutput(cappedState, input).health.projectionUsed).toBe(false);
  });

  it("emits valid source output semantics without projection or PR 1C tangents", () => {
    const output = evaluateLand2017StepOutput(representativeState(), representativeStepInput());

    expect(Number.isFinite(output.sourceActiveFiberStressPa)).toBe(true);
    expect(output.sourceStressConvention).toBe("land2017-Ta");
    expect(Number.isFinite(output.sourceActivePowerDensityWPerM3)).toBe(true);
    expect(output.health.finite).toBe(true);
    expect(output.health.projectionUsed).toBe(false);
    expect(output.stabilizationStiffnessPa).toBe(LAND2017_STABILIZATION_STIFFNESS_PLACEHOLDER_PA);
    expect(output.stabilizationStiffnessPa).toBe(0);
    expect(Object.hasOwn(output, "algorithmicTangentPa")).toBe(false);
    expect(Object.hasOwn(output, "frozenStateTangentPa")).toBe(false);
  });

  it("does not silently clamp invalid domains or populations", () => {
    const input = representativeStepInput();

    expect(() => writeLand2017BackwardEulerResidual(invalidCaTRPNState(), representativeState(), input)).toThrow(
      /CaTRPN/,
    );

    const negativePopulation = Float64Array.from([0.55, -0.01, 0.08, 0.04, 0.06, 0.12]);
    const negativeOutput = evaluateLand2017StepOutput(negativePopulation, input);
    expect(negativeOutput.health.finite).toBe(false);
    expect(negativeOutput.health.minimumPopulation).toBeLessThan(0);
    expect(negativeOutput.health.projectionUsed).toBe(false);
    expect(negativePopulation[1]).toBe(-0.01);

    const overfullPopulation = Float64Array.from([0.55, 0.7, 0.2, 0.2, 0.06, 0.12]);
    const overfullOutput = evaluateLand2017StepOutput(overfullPopulation, input);
    expect(overfullOutput.health.finite).toBe(false);
    expect(overfullOutput.health.minimumPopulation).toBeLessThan(0);
    expect(overfullOutput.health.projectionUsed).toBe(false);

    const zeroCaTRPNOutput = evaluateLand2017StepOutput(invalidCaTRPNState(), input);
    expect(zeroCaTRPNOutput.health.finite).toBe(false);
    expect(zeroCaTRPNOutput.health.minimumPopulation).toBe(0);
    expect(zeroCaTRPNOutput.health.projectionUsed).toBe(false);
  });

  it("keeps the Land source module boundary independent of runtime and coupling layers", () => {
    const files = landSourceFiles();
    const disallowedImports: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const specifier of importSpecifiers(source)) {
        if (isDisallowedLandImport(specifier)) {
          disallowedImports.push(`${path.relative(process.cwd(), file)} -> ${specifier}`);
        }
      }
    }

    expect(disallowedImports).toEqual([]);
  });
});

function representativeState(): Float64Array {
  return Float64Array.from([0.55, 0.12, 0.08, 0.04, 0.06, 0.12]);
}

function invalidCaTRPNState(): Float64Array {
  return Float64Array.from([0, 0.12, 0.08, 0.04, 0.06, 0.12]);
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
