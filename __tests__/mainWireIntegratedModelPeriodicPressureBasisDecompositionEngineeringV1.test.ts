import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_POLICY_V1,
  pressureBasisPathPointCandidateFromAcceptedTraceSampleV1,
  projectMainWireIntegratedModelPeriodicPressureBasisDecompositionEngineeringV1,
  type MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPressureBasisDecompositionEngineeringV1";
import type { MainWireIntegratedModelPeriodicTerminalTraceSampleV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

type PointValues = Readonly<{
  lvVolumeMl: number;
  lvTransmuralPressureMmHg: number;
  lvExternalConstraintPressureMmHg: number;
  rvVolumeMl?: number;
  rvTransmuralPressureMmHg?: number;
  rvExternalConstraintPressureMmHg?: number;
}>;

describe("periodic pressure-basis decomposition Engineering projection V1", () => {
  it("decomposes cavity work into transmural boundary work and external-constraint exchange", () => {
    const result = project(
      squarePath((volumeMl, transmuralPressureMmHg) => ({
        lvVolumeMl: volumeMl,
        lvTransmuralPressureMmHg: transmuralPressureMmHg,
        lvExternalConstraintPressureMmHg: 0.5 * transmuralPressureMmHg,
      })),
    );

    expect(result).toMatchObject({
      status: "projection-computed-biventricular",
      pathSegmentCandidateCount: 4,
      biventricularPressureBasisBoundaryWorkComputed: true,
      syntheticEndToStartClosingSegmentApplied: false,
      engineeringProjectionOnly: true,
      acceptedEndpointIdentityVerified: false,
      periodicityEstablished: false,
      sourceProvenanceVerified: false,
      historicalQualificationTransferred: false,
      officialQualificationEstablished: false,
      publicOutputEstablished: false,
      commonPericardiumStoredEnergyEstablished: false,
      perChamberPericardialEnergyAllocationEstablished: false,
      wholeHeartExternalConstraintWorkEstablished: false,
      pvaEstablished: false,
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
      leftVentricle: {
        cavityAbsoluteBoundaryWorkMmHgMl: 1.5,
        ventricularTransmuralBoundaryWorkMmHgMl: 1,
        externalConstraintExchangeMmHgMl: 0.5,
        decompositionResidualMmHgMl: 0,
        decompositionResidualWithinNumericalTolerance: true,
        pressureBasisBoundaryWorkComputed: true,
        failureReasons: [],
      },
    });
    expect(result.leftVentricle.pathWorkMmHgMl).toEqual({
      "cavity-absolute-pressure": 1.5,
      "ventricular-transmural-pressure": 1,
      "external-constraint-pressure": 0.5,
    });
    expect(result.leftVentricle.pathWorkDirection).toEqual({
      "cavity-absolute-pressure": "net-work-by-ventricle",
      "ventricular-transmural-pressure": "net-work-by-ventricle",
      "external-constraint-pressure": "net-work-by-ventricle",
    });
    expect(result.policy).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_POLICY_V1,
    );
  });

  it("assigns zero exchange to a constant external pressure on a closed path", () => {
    const result = project(
      squarePath((volumeMl, transmuralPressureMmHg) => ({
        lvVolumeMl: volumeMl,
        lvTransmuralPressureMmHg: transmuralPressureMmHg,
        lvExternalConstraintPressureMmHg: 50,
      })),
    );

    expect(result.leftVentricle).toMatchObject({
      cavityAbsoluteBoundaryWorkMmHgMl: 1,
      ventricularTransmuralBoundaryWorkMmHgMl: 1,
      externalConstraintExchangeMmHgMl: 0,
      decompositionResidualMmHgMl: 0,
      pathWorkDirection: {
        "external-constraint-pressure": "zero-net-work",
      },
    });
  });

  it("preserves a negative external-constraint exchange and its algebraic sign", () => {
    const result = project(
      squarePath((volumeMl, transmuralPressureMmHg) => ({
        lvVolumeMl: volumeMl,
        lvTransmuralPressureMmHg: transmuralPressureMmHg,
        lvExternalConstraintPressureMmHg: -0.5 * transmuralPressureMmHg,
      })),
    );

    expect(result.leftVentricle).toMatchObject({
      cavityAbsoluteBoundaryWorkMmHgMl: 0.5,
      ventricularTransmuralBoundaryWorkMmHgMl: 1,
      externalConstraintExchangeMmHgMl: -0.5,
      decompositionResidualMmHgMl: 0,
      pathWorkDirection: {
        "external-constraint-pressure": "net-work-on-ventricle",
      },
    });
  });

  it("retains raw path integrals but withholds all boundary work when a pressure basis does not close", () => {
    const points = squarePath((volumeMl, transmuralPressureMmHg) => ({
      lvVolumeMl: volumeMl,
      lvTransmuralPressureMmHg: transmuralPressureMmHg,
      lvExternalConstraintPressureMmHg: 0.5 * transmuralPressureMmHg,
    }));
    const final = points.at(-1)!;
    const openFinal: MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1 =
      Object.freeze({
        ...final,
        absolutePressureMmHg: Object.freeze({
          LV: final.absolutePressureMmHg.LV + 1,
          RV: final.absolutePressureMmHg.RV,
        }),
      });
    const result = project([...points.slice(0, -1), openFinal]);

    expect(result.status).toBe("projection-computed-right-ventricular-only");
    expect(result.leftVentricle.pathWorkMmHgMl).toEqual({
      "cavity-absolute-pressure": 1.5,
      "ventricular-transmural-pressure": 1,
      "external-constraint-pressure": 0.5,
    });
    expect(result.leftVentricle.boundaryWorkMmHgMl).toEqual({
      "cavity-absolute-pressure": null,
      "ventricular-transmural-pressure": null,
      "external-constraint-pressure": null,
    });
    expect(result.leftVentricle).toMatchObject({
      cavityAbsoluteBoundaryWorkMmHgMl: null,
      ventricularTransmuralBoundaryWorkMmHgMl: null,
      externalConstraintExchangeMmHgMl: null,
      pressureBasisBoundaryWorkComputed: false,
      failureReasons: ["pressure-volume-boundary-not-closed"],
      endpointClosure: {
        "cavity-absolute-pressure": { withinTolerance: false },
        "ventricular-transmural-pressure": { withinTolerance: true },
        "external-constraint-pressure": { withinTolerance: false },
      },
    });
  });

  it("contains finite-input path-work overflow to one chamber", () => {
    const result = project([
      pathPoint({
        lvVolumeMl: 0,
        lvTransmuralPressureMmHg: 0,
        lvExternalConstraintPressureMmHg: 0,
      }),
      pathPoint({
        lvVolumeMl: Number.MAX_VALUE,
        lvTransmuralPressureMmHg: Number.MAX_VALUE,
        lvExternalConstraintPressureMmHg: 0,
        rvVolumeMl: 1,
        rvTransmuralPressureMmHg: 0,
      }),
      pathPoint({
        lvVolumeMl: Number.MAX_VALUE,
        lvTransmuralPressureMmHg: Number.MAX_VALUE,
        lvExternalConstraintPressureMmHg: 0,
        rvVolumeMl: 1,
        rvTransmuralPressureMmHg: 1,
        rvExternalConstraintPressureMmHg: 0.5,
      }),
      pathPoint({
        lvVolumeMl: 0,
        lvTransmuralPressureMmHg: 0,
        lvExternalConstraintPressureMmHg: 0,
        rvVolumeMl: 0,
        rvTransmuralPressureMmHg: 1,
        rvExternalConstraintPressureMmHg: 0.5,
      }),
      pathPoint({
        lvVolumeMl: 0,
        lvTransmuralPressureMmHg: 0,
        lvExternalConstraintPressureMmHg: 0,
      }),
    ]);

    expect(result.status).toBe("projection-computed-right-ventricular-only");
    expect(result.leftVentricle).toMatchObject({
      pathWorkMmHgMl: {
        "cavity-absolute-pressure": null,
        "ventricular-transmural-pressure": null,
        "external-constraint-pressure": 0,
      },
      decompositionResidualMmHgMl: null,
      pressureBasisBoundaryWorkComputed: false,
      failureReasons: ["pressure-volume-path-non-finite"],
    });
    expect(result.rightVentricle).toMatchObject({
      cavityAbsoluteBoundaryWorkMmHgMl: 1.5,
      ventricularTransmuralBoundaryWorkMmHgMl: 1,
      externalConstraintExchangeMmHgMl: 0.5,
      pressureBasisBoundaryWorkComputed: true,
    });
  });

  it("fails closed when finite absolute and transmural pressures produce an infinite constraint pressure", () => {
    const regular = squarePath((volumeMl, transmuralPressureMmHg) => ({
      lvVolumeMl: volumeMl,
      lvTransmuralPressureMmHg: transmuralPressureMmHg,
      lvExternalConstraintPressureMmHg: 0,
    }));
    const overflowStart = Object.freeze({
      ...regular[0]!,
      absolutePressureMmHg: Object.freeze({
        LV: Number.MAX_VALUE,
        RV: regular[0]!.absolutePressureMmHg.RV,
      }),
      transmuralPressureMmHg: Object.freeze({
        LV: -Number.MAX_VALUE,
        RV: regular[0]!.transmuralPressureMmHg.RV,
      }),
    });
    const result = project([overflowStart, ...regular.slice(1)]);

    expect(result.status).toBe("projection-computed-right-ventricular-only");
    expect(result.leftVentricle).toMatchObject({
      pathWorkMmHgMl: {
        "external-constraint-pressure": null,
      },
      pressureBasisBoundaryWorkComputed: false,
      failureReasons: [
        "pressure-volume-path-non-finite",
        "pressure-volume-boundary-not-closed",
      ],
    });
  });

  it("reports missing path boundaries without manufacturing a closing segment", () => {
    const noStart =
      projectMainWireIntegratedModelPeriodicPressureBasisDecompositionEngineeringV1(
        {
          startPoint: null,
          orderedEndpointCandidates: [
            pathPoint({
              lvVolumeMl: 1,
              lvTransmuralPressureMmHg: 1,
              lvExternalConstraintPressureMmHg: 0,
            }),
          ],
        },
      );
    const noEndpoints =
      projectMainWireIntegratedModelPeriodicPressureBasisDecompositionEngineeringV1(
        {
          startPoint: pathPoint({
            lvVolumeMl: 0,
            lvTransmuralPressureMmHg: 0,
            lvExternalConstraintPressureMmHg: 0,
          }),
          orderedEndpointCandidates: [],
        },
      );

    expect(noStart).toMatchObject({
      status: "projection-not-computed",
      pathSegmentCandidateCount: 0,
      syntheticEndToStartClosingSegmentApplied: false,
      leftVentricle: { failureReasons: ["start-point-not-provided"] },
    });
    expect(noEndpoints).toMatchObject({
      status: "projection-not-computed",
      pathSegmentCandidateCount: 0,
      leftVentricle: {
        failureReasons: ["ordered-endpoint-candidates-empty"],
      },
    });
  });

  it("maps an accepted trace sample without conferring accepted-endpoint provenance", () => {
    const candidate = pressureBasisPathPointCandidateFromAcceptedTraceSampleV1({
      chamberVolumeMl: { LV: 100, RV: 120 },
      absolutePressureMmHg: { LV: 12, RV: 5 },
      transmuralPressureMmHg: { LV: 10, RV: 4 },
    } as MainWireIntegratedModelPeriodicTerminalTraceSampleV3);

    expect(candidate).toEqual({
      source: "caller-projected-pressure-basis-point",
      chamberVolumeMl: { LV: 100, RV: 120 },
      absolutePressureMmHg: { LV: 12, RV: 5 },
      transmuralPressureMmHg: { LV: 10, RV: 4 },
    });
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PRESSURE_BASIS_DECOMPOSITION_ENGINEERING_POLICY_V1.acceptedEndpointIdentityVerifiedByProjector,
    ).toBe(false);
  });

  it("rejects nonfinite source values and derived constraint pressure in the trace-sample helper", () => {
    expect(() =>
      pressureBasisPathPointCandidateFromAcceptedTraceSampleV1({
        chamberVolumeMl: { LV: Number.NaN, RV: 120 },
        absolutePressureMmHg: { LV: 12, RV: 5 },
        transmuralPressureMmHg: { LV: 10, RV: 4 },
      } as MainWireIntegratedModelPeriodicTerminalTraceSampleV3),
    ).toThrow("nonfinite value");
    expect(() =>
      pressureBasisPathPointCandidateFromAcceptedTraceSampleV1({
        chamberVolumeMl: { LV: 100, RV: 120 },
        absolutePressureMmHg: { LV: Number.MAX_VALUE, RV: 5 },
        transmuralPressureMmHg: { LV: -Number.MAX_VALUE, RV: 4 },
      } as MainWireIntegratedModelPeriodicTerminalTraceSampleV3),
    ).toThrow("nonfinite external-constraint pressure");
  });
});

function project(
  points: readonly MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1[],
) {
  if (points.length < 2) throw new Error("test path requires two points");
  return projectMainWireIntegratedModelPeriodicPressureBasisDecompositionEngineeringV1(
    {
      startPoint: points[0]!,
      orderedEndpointCandidates: points.slice(1),
    },
  );
}

function squarePath(
  valueAt: (volumeMl: number, transmuralPressureMmHg: number) => PointValues,
): readonly MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1[] {
  return [
    pathPoint(valueAt(0, 0)),
    pathPoint(valueAt(1, 0)),
    pathPoint(valueAt(1, 1)),
    pathPoint(valueAt(0, 1)),
    pathPoint(valueAt(0, 0)),
  ];
}

function pathPoint(
  values: PointValues,
): MainWireIntegratedModelPeriodicPressureBasisPathPointCandidateV1 {
  const rvVolumeMl = values.rvVolumeMl ?? values.lvVolumeMl;
  const rvTransmuralPressureMmHg =
    values.rvTransmuralPressureMmHg ?? values.lvTransmuralPressureMmHg;
  const rvExternalConstraintPressureMmHg =
    values.rvExternalConstraintPressureMmHg ??
    values.lvExternalConstraintPressureMmHg;
  return Object.freeze({
    source: "caller-projected-pressure-basis-point" as const,
    chamberVolumeMl: Object.freeze({
      LV: values.lvVolumeMl,
      RV: rvVolumeMl,
    }),
    absolutePressureMmHg: Object.freeze({
      LV:
        values.lvTransmuralPressureMmHg +
        values.lvExternalConstraintPressureMmHg,
      RV: rvTransmuralPressureMmHg + rvExternalConstraintPressureMmHg,
    }),
    transmuralPressureMmHg: Object.freeze({
      LV: values.lvTransmuralPressureMmHg,
      RV: rvTransmuralPressureMmHg,
    }),
  });
}
