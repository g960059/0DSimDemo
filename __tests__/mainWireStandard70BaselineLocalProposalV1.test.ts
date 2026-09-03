import { describe, expect, it } from "vitest";

import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  buildMainWireBaselineConditioningSingularValuesV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  buildMainWireStandard70BaselineLocalProposalV1,
  type MainWireStandard70BaselineLocalProposalInputV1,
  type MainWireStandard70BaselineLocalProposalObservationV1,
  type MainWireStandard70BaselineLocalProposalRowV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineLocalProposalV1";
import {
  transformMainWireBaselineCalibrationParameterV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

const TBV = "hemodynamics.total-blood-volume-ml" as const;
const ACTIVE =
  "myocardium.common-ventricular-active-tension-scale" as const;
const CENTER = [4_900, 1.24] as const;
const ONE_STEP_TRUTH = [4_950, 1.25] as const;

const ROW_FIXTURES = Object.freeze([
  Object.freeze({
    centerActual: 105,
    conditionId: "rest-hr60" as const,
    checkId: "aortic-pressure.maximum" as const,
    unit: "mmHg",
    minimum: 90,
    maximum: 130,
    weightDivisor: 1,
    halfStepNormalizedDerivatives: Object.freeze([1, 0.25] as const),
  }),
  Object.freeze({
    centerActual: 9,
    conditionId: "rest-hr60" as const,
    checkId: "pcwp-surrogate.mean" as const,
    unit: "mmHg",
    minimum: 6,
    maximum: 15,
    weightDivisor: 1,
    halfStepNormalizedDerivatives: Object.freeze([0.4, 1.2] as const),
  }),
  Object.freeze({
    centerActual: 3,
    conditionId: "rest-hr60" as const,
    checkId: "systemic-forward-flow.cardiac-index" as const,
    unit: "L/min/m2",
    minimum: 2.5,
    maximum: 4,
    weightDivisor: 1,
    halfStepNormalizedDerivatives: Object.freeze([0.2, 0.55] as const),
  }),
]);

const ROWS: readonly MainWireStandard70BaselineLocalProposalRowV1[] =
  Object.freeze(ROW_FIXTURES.map(({ centerActual: _centerActual, ...row }) =>
    Object.freeze(row)));
const MATRIX = ROWS.map((row) =>
  row.halfStepNormalizedDerivatives.map((value) =>
    value / row.weightDivisor));
const singularValues = buildMainWireBaselineConditioningSingularValuesV1(
  MATRIX,
  2,
);
const SINGULAR_VALUES = Object.freeze([
  singularValues[0]!,
  singularValues[1]!,
] as const);

describe("Standard70 baseline local proposal", () => {
  it("recovers non-orthogonal one-step truths in both active directions", async () => {
    const result = await buildMainWireStandard70BaselineLocalProposalV1(
      inputV1(),
    );

    expect(result.status).toBe("proposed");
    if (result.status !== "proposed") return;
    expect(result.coordinates.map(({ projectedValue }) => projectedValue))
      .toEqual(ONE_STEP_TRUTH);
    expect(result.coordinates.map(({ projectedOffsetInReleaseSteps }) =>
      projectedOffsetInReleaseSteps)).toEqual([1, 1]);
    expect(result.normalizedResidualFraction).toBeLessThan(1e-12);
    expect(result.projectedDeclaredTruthMatchStatus).toBe("matched");
    expect(result.claim).toEqual({
      artifactContentsVerified: false,
      exactReplayExecuted: false,
      localOneStepProposalOnly: true,
      optimizerExecuted: false,
      parameterUniquenessClaimed: false,
      inferentialUncertaintyClaimed: false,
      presetOrCaseFittingQualified: false,
    });

    const opposite = await buildMainWireStandard70BaselineLocalProposalV1(
      inputV1({ truth: [4_950, 1.23] }),
    );
    expect(opposite.status).toBe("proposed");
    if (opposite.status !== "proposed") return;
    expect(opposite.coordinates.map(({ projectedValue }) => projectedValue))
      .toEqual([4_950, 1.23]);
    expect(opposite.coordinates.map(({ projectedOffsetInReleaseSteps }) =>
      projectedOffsetInReleaseSteps)).toEqual([1, -1]);
    expect(opposite.projectedDeclaredTruthMatchStatus).toBe("matched");
  });

  it("refuses failed gates, non-local truth, and a zero response", async () => {
    const gated = inputV1();
    const gatedResult = await buildMainWireStandard70BaselineLocalProposalV1({
      ...gated,
      target: {
        ...gated.target,
        objectiveGateStatus: "failed",
        failedObjectiveCheckIds: ["aortic-pressure.maximum"],
      },
    });
    expect(gatedResult).toMatchObject({
      status: "refused",
      reason: "target-gates-failed",
    });

    const nonLocalResult =
      await buildMainWireStandard70BaselineLocalProposalV1(inputV1({
        truth: [5_000, 1.25],
      }));
    expect(nonLocalResult).toMatchObject({
      status: "refused",
      reason: "target-outside-local-radius",
    });

    const zero = inputV1();
    const zeroResult = await buildMainWireStandard70BaselineLocalProposalV1({
      ...zero,
      targetObservations: zero.centerObservations,
    });
    expect(zeroResult).toMatchObject({
      status: "refused",
      reason: "zero-target-response",
    });
  });

  it("refuses an unexplained response and an out-of-radius proposal", async () => {
    const inconsistent = inputV1();
    const perturbed = inconsistent.targetObservations.map(
      (observation, index) => index === 2
        ? Object.freeze({ ...observation, actual: observation.actual + 0.5 })
        : observation,
    );
    const residualResult =
      await buildMainWireStandard70BaselineLocalProposalV1({
        ...inconsistent,
        targetObservations: perturbed,
      });
    expect(residualResult).toMatchObject({
      status: "refused",
      reason: "residual-fraction-exceeded",
    });

    const radiusResult = await buildMainWireStandard70BaselineLocalProposalV1(
      inputV1({ responseAt: [5_000, 1.25] }),
    );
    expect(radiusResult).toMatchObject({
      status: "refused",
      reason: "proposal-outside-local-radius",
    });
  });

  it("fails closed on lattice, inventory, matrix, and provenance drift", async () => {
    const offLattice = inputV1();
    await expect(buildMainWireStandard70BaselineLocalProposalV1({
      ...offLattice,
      coordinates: [
        { ...offLattice.coordinates[0], syntheticTruthValue: 4_925 },
        offLattice.coordinates[1],
      ],
    })).rejects.toThrow(/off the release lattice/);

    const missing = inputV1();
    await expect(buildMainWireStandard70BaselineLocalProposalV1({
      ...missing,
      targetObservations: missing.targetObservations.slice(1),
    })).rejects.toThrow(/observation inventory differs/);

    const extra = inputV1();
    await expect(buildMainWireStandard70BaselineLocalProposalV1({
      ...extra,
      targetObservations: [
        ...extra.targetObservations,
        {
          ...extra.targetObservations[0]!,
          checkId: "aortic-pressure.minimum",
        },
      ],
    })).rejects.toThrow(/observation inventory differs/);

    const matrixDrift = inputV1();
    await expect(buildMainWireStandard70BaselineLocalProposalV1({
      ...matrixDrift,
      basis: {
        ...matrixDrift.basis,
        rows: matrixDrift.basis.rows.map((row, index) => index === 0
          ? {
              ...row,
              halfStepNormalizedDerivatives: [
                row.halfStepNormalizedDerivatives[0] + 0.1,
                row.halfStepNormalizedDerivatives[1],
              ],
            }
          : row),
      },
    })).rejects.toThrow(/matrix differs/);

    const stale = inputV1();
    await expect(buildMainWireStandard70BaselineLocalProposalV1({
      ...stale,
      target: { ...stale.target, exactModelIdentitySha256: digestV1("f") },
    })).rejects.toThrow(/source and target provenance differ/);

    const malformed = inputV1();
    await expect(buildMainWireStandard70BaselineLocalProposalV1({
      ...malformed,
      source: { ...malformed.source, studyIdentitySha256: "not-a-digest" },
    })).rejects.toThrow(/provenance digest is invalid/);
  });

  it("owns one immutable snapshot before the first digest await", async () => {
    const mutable = (
      JSON.parse(JSON.stringify(inputV1()))
    ) as MainWireStandard70BaselineLocalProposalInputV1;
    const expectedIdentity = await sha256CanonicalJsonHex(mutable);
    const pending = buildMainWireStandard70BaselineLocalProposalV1(mutable);
    const row = mutable.basis.rows[0] as unknown as {
      unit: string;
      halfStepNormalizedDerivatives: [number, number];
    };
    const center = mutable.centerObservations[0] as {
      unit: string;
      actual: number;
    };
    const target = mutable.targetObservations[0] as {
      unit: string;
      actual: number;
    };
    row.unit = "";
    row.halfStepNormalizedDerivatives[0] = 1_000;
    center.unit = "";
    target.unit = "";
    target.actual += 1_000;

    const result = await pending;
    expect(result.status).toBe("proposed");
    expect(result.inputIdentitySha256).toBe(expectedIdentity);
    if (result.status !== "proposed") return;
    expect(result.projectedDeclaredTruthMatchStatus).toBe("matched");
  });
});

function inputV1(options: Readonly<{
  truth?: readonly [number, number];
  responseAt?: readonly [number, number];
}> = {}): MainWireStandard70BaselineLocalProposalInputV1 {
  const truth = options.truth ?? ONE_STEP_TRUTH;
  const responseAt = options.responseAt ?? truth;
  const offsets = transformedOffsetsV1(responseAt);
  const centerObservations = observationsV1(
    ROW_FIXTURES.map(({ centerActual }) => centerActual),
  );
  const targetObservations = observationsV1(ROWS.map((row, index) => {
    const normalizedResponse = MATRIX[index]![0]! * offsets[0]
      + MATRIX[index]![1]! * offsets[1];
    return ROW_FIXTURES[index]!.centerActual
      + normalizedResponse
        * (row.maximum - row.minimum)
        * row.weightDivisor;
  }));
  return Object.freeze({
    source: Object.freeze({
      studyIdentitySha256: digestV1("a"),
      exactModelIdentitySha256: digestV1("b"),
      constructionPolicyIdentitySha256: digestV1("c"),
      objectiveAnalysisMethodId: "objective-v1",
      safetyAnalysisMethodId: "safety-v1",
      stagePolicyIdentitySha256: digestV1("d"),
      stageArtifactIdentitySha256: digestV1("e"),
      refinedArtifactIdentitySha256: digestV1("1"),
    }),
    target: Object.freeze({
      exactModelIdentitySha256: digestV1("b"),
      constructionPolicyIdentitySha256: digestV1("c"),
      objectiveAnalysisMethodId: "objective-v1",
      safetyAnalysisMethodId: "safety-v1",
      requestIdentitySha256: digestV1("2"),
      initializationKind: "cold" as const,
      constructionGateStatus: "passed" as const,
      objectiveGateStatus: "passed" as const,
      safetySentinelStatus: "passed" as const,
      failedConstructionCheckIds: Object.freeze([]),
      failedObjectiveCheckIds: Object.freeze([]),
      failedSafetySentinelCheckIds: Object.freeze([]),
    }),
    coordinates: Object.freeze([
      Object.freeze({
        parameterId: TBV,
        centerValue: CENTER[0],
        syntheticTruthValue: truth[0],
      }),
      Object.freeze({
        parameterId: ACTIVE,
        centerValue: CENTER[1],
        syntheticTruthValue: truth[1],
      }),
    ] as const),
    basis: Object.freeze({
      basisId: "rest-operating-point-identification" as const,
      basisRole: "primary-policy" as const,
      rowInventoryStatus: "complete" as const,
      compositionRobustnessStatus:
        "supported-across-reported-compositions" as const,
      practicalRank: 2 as const,
      practicalRankTolerance: 0.01,
      refinedSingularValues: SINGULAR_VALUES,
      rows: ROWS,
    }),
    centerObservations,
    targetObservations,
  });
}

function transformedOffsetsV1(
  values: readonly [number, number],
): readonly [number, number] {
  return Object.freeze([
    transformMainWireBaselineCalibrationParameterV1(TBV, values[0])
      - transformMainWireBaselineCalibrationParameterV1(TBV, CENTER[0]),
    transformMainWireBaselineCalibrationParameterV1(ACTIVE, values[1])
      - transformMainWireBaselineCalibrationParameterV1(ACTIVE, CENTER[1]),
  ]);
}

function observationsV1(
  actuals: readonly number[],
): readonly MainWireStandard70BaselineLocalProposalObservationV1[] {
  return Object.freeze(ROWS.map((row, index) => Object.freeze({
    conditionId: row.conditionId,
    checkId: row.checkId,
    unit: row.unit,
    minimum: row.minimum,
    maximum: row.maximum,
    actual: actuals[index]!,
  })));
}

function digestV1(character: string): string {
  return character.repeat(64);
}
