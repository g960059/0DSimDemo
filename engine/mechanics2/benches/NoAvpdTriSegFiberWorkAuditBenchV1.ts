import type {
  NoAvpdFourChamberBenchResultV1,
  NoAvpdFourChamberBenchSampleV1,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import {
  NO_AVPD_TRISEG_FIBER_WORK_AUDIT_CLAIM_BOUNDARY_V1,
  NO_AVPD_TRISEG_FIBER_WORK_AUDIT_ID_V1,
  NO_AVPD_TRISEG_QUADRATIC_PASSIVE_MODULUS_PA_V1,
  NO_AVPD_TRISEG_WORK_COORDINATES_V1,
  evaluateNoAvpdTriSegFiberWorkAuditPointV1,
  evaluateNoAvpdTriSegQuadraticEnergyIdentityV1,
  type NoAvpdTriSegFiberWorkAuditPointV1,
  type NoAvpdTriSegQuadraticEnergyIdentityV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdTriSegFiberWorkAuditV1";
import {
  TRISEG_WALL_IDS_V1,
  evaluateTriSegGeometryV1,
  type TriSegGeometryCoordinateSIV1,
  type TriSegGeometryInputV1,
  type TriSegGeometryValidOutputV1,
  type TriSegWallFiberStressesPaV1,
  type TriSegWallIdV1,
  type TriSegWallParameterSetV1,
} from "@/engine/mechanics2/geometry/TriSegGeometryV1";

export const NO_AVPD_TRISEG_FIBER_WORK_AUDIT_BENCH_ID_V1 =
  "no-avpd-triseg-fiber-work-audit-bench-v1" as const;

export const NO_AVPD_TRISEG_PASSIVE_WORK_GRID_V1 = Object.freeze({
  leftVentricleCavityVolumeMl: [90, 140, 190] as const,
  rightVentricleCavityVolumeMl: [90, 150, 210] as const,
  septalCapVolumeMl: [-12, 12] as const,
  junctionRadiusCm: [3, 4] as const,
});

type NominalPointIdV1 = "systolic-peak" | "mvo50" | "e-peak" | "a-peak";

type NominalCycleRowV1 = {
  readonly pointId: NominalPointIdV1;
  readonly selectionMethod:
    | "raw-maximum-lv-pressure"
    | "nearest-raw-accepted-step-to-report-only-event";
  readonly targetPhase01: number;
  readonly sampleIndex: number;
  readonly samplePhase01: number;
  readonly phaseOffsetSec: number;
  readonly sourcePressureMmHg: {
    readonly leftVentricle: number;
    readonly rightVentricle: number;
  };
  readonly sourcePressureReconstructionResidualPa: {
    readonly leftVentricle: number;
    readonly rightVentricle: number;
  };
  readonly maximumAbsoluteFiberStrainReadbackResidual: number;
  readonly maximumAbsoluteTotalStressDecompositionResidualPa: number;
  readonly audit: NoAvpdTriSegFiberWorkAuditPointV1;
};

type PassiveGridRowV1 = {
  readonly gridIndex: number;
  readonly geometryInput: TriSegGeometryInputV1;
  readonly fiberStressesPa: TriSegWallFiberStressesPaV1;
  readonly audit: NoAvpdTriSegFiberWorkAuditPointV1;
  readonly quadraticEnergyIdentity: NoAvpdTriSegQuadraticEnergyIdentityV1;
};

export type NoAvpdTriSegFiberWorkAuditBenchResultV1 = ReturnType<
  typeof runNoAvpdTriSegFiberWorkAuditBenchV1
>;

export function runNoAvpdTriSegFiberWorkAuditBenchV1(
  report: NoAvpdFourChamberBenchResultV1,
) {
  assertUsableReport(report);
  const leftEvents = report.reportOnlyEventResolvedDiagnostics.left!;
  const mvo = leftEvents.valveTransitions.modelHalfOpen.opening!;
  const ePeak = leftEvents.inflowEvents.ePeak!;
  const aPeak = leftEvents.inflowEvents.aPeak!;
  const samples = report.lastBeatSamples;
  const systolicPeakIndex = samples.reduce(
    (best, sample, index) =>
      sample.pressuresMmHg.lv > samples[best]!.pressuresMmHg.lv ? index : best,
    0,
  );
  const nominalSelections: readonly {
    readonly pointId: NominalPointIdV1;
    readonly selectionMethod: NominalCycleRowV1["selectionMethod"];
    readonly targetPhase01: number;
    readonly sampleIndex: number;
  }[] = [
    {
      pointId: "systolic-peak",
      selectionMethod: "raw-maximum-lv-pressure",
      targetPhase01: samples[systolicPeakIndex]!.phase01,
      sampleIndex: systolicPeakIndex,
    },
    {
      pointId: "mvo50",
      selectionMethod: "nearest-raw-accepted-step-to-report-only-event",
      targetPhase01: mvo.phase01,
      sampleIndex: nearestPhaseSampleIndex(samples, mvo.phase01),
    },
    {
      pointId: "e-peak",
      selectionMethod: "nearest-raw-accepted-step-to-report-only-event",
      targetPhase01: ePeak.phase01,
      sampleIndex: nearestPhaseSampleIndex(samples, ePeak.phase01),
    },
    {
      pointId: "a-peak",
      selectionMethod: "nearest-raw-accepted-step-to-report-only-event",
      targetPhase01: aPeak.phase01,
      sampleIndex: nearestPhaseSampleIndex(samples, aPeak.phase01),
    },
  ];
  const nominalRows = nominalSelections.map((selection) =>
    nominalCycleRow(selection, samples[selection.sampleIndex]!, report),
  );
  const passiveRows = passiveGridRows(report);
  const nominalSummary = summarizeAuditRows(
    nominalRows.map((row) => row.audit),
  );
  const passiveSummary = summarizeAuditRows(
    passiveRows.map((row) => row.audit),
  );
  const identitySummary = summarizeIdentityRows(
    passiveRows.map((row) => row.quadraticEnergyIdentity),
  );
  return {
    benchId: NO_AVPD_TRISEG_FIBER_WORK_AUDIT_BENCH_ID_V1,
    auditId: NO_AVPD_TRISEG_FIBER_WORK_AUDIT_ID_V1,
    claimBoundary: NO_AVPD_TRISEG_FIBER_WORK_AUDIT_CLAIM_BOUNDARY_V1,
    evidenceStatus:
      "report-only-mapping-definition-comparison-no-equilibrium-or-parameter-change" as const,
    statusScope: "execution-availability-only-not-acceptance" as const,
    executionStatus: "complete" as const,
    sourceProtocol: {
      modelId: report.runProtocol.modelId,
      equationsVersionId: report.runProtocol.equationsVersionId,
      cycleLengthSec: report.runProtocol.cycleLengthSec,
      dtSec: report.dtSec,
      sampledIntervalSec: report.runProtocol.sampledIntervalSec,
      sourceStructuralStatus: report.status,
      sourceOneBeatNormalizedDrift:
        report.reportOnlyExactBeatBoundaryReturnMap.oneBeatMapResidual
          ?.normalizedFullStateDrift.maxAbsDimensionless ?? null,
    },
    comparisonDefinitions: {
      current:
        "lumens-2009-Eq15-Eq16-sum(representativeTriSegMidwallTensionFromFiberStress*dMidwallArea/dq)" as const,
      declaredHill:
        "opt-in-full-fiber-gradient-sum(wallVolumeM3*totalTransmittedFiberStressPa*dFiberNaturalStrain/dq)" as const,
      legacyFieldNamingBoundary:
        "declaredHill-fields-are-legacy-artifact-names-for-the-opt-in-full-fiber-gradient-not-a-canonical-Hill-or-Lumens-requirement" as const,
      signedMismatch: "full-fiber-gradient-minus-lumens-2009" as const,
      symmetricRelativeMismatch:
        "abs(mismatch)/max(abs(current),abs(declared),unit-numerical-floor)" as const,
      contributionScaleRelativeMismatch:
        "abs(mismatch)/max(sum-abs-current-wall-contributions,sum-abs-declared-wall-contributions,unit-numerical-floor)" as const,
      thresholdsApplied: false as const,
    },
    mappingInterpretation: {
      twoMappingsAreNumericallyDistinct: true as const,
      basis:
        "current-T-dA-and-declared-Vwall-sigma-dFiberStrain-are-numerically-distinct-at-all-four-nominal-points-and-all-passive-grid-points" as const,
      lumens2009MappingStatus:
        "literature-faithful-representative-tension-area-work-approximation-from-Eq15-Eq16" as const,
      fullFiberGradientStatus:
        "opt-in-variational-work-pair-alternative-not-a-correction" as const,
      activeStressStoredEnergyPotentialClaimed: false as const,
      numericalDifferenceIsBlockingStructuralFailure: false as const,
      equilibriumReplacementAuthorizedByThisAudit: false as const,
      winnerSelectionApplied: false as const,
      physiologyOrCalibrationDecisionMade: false as const,
    },
    nominalCycle: {
      availability: "available" as const,
      pointCount: nominalRows.length,
      rows: nominalRows,
      summary: nominalSummary,
    },
    passiveGrid: {
      availability: "available" as const,
      definition:
        "cartesian-geometry-grid-with-quadratic-fiber-potential-stress-K-times-fiber-strain" as const,
      physiologyBoundary:
        "mathematical-passive-work-grid-not-a-physiologic-edpvr-or-calibration" as const,
      grid: NO_AVPD_TRISEG_PASSIVE_WORK_GRID_V1,
      moduliPa: NO_AVPD_TRISEG_QUADRATIC_PASSIVE_MODULUS_PA_V1,
      pointCount: passiveRows.length,
      rows: passiveRows,
      currentVsDeclaredSummary: passiveSummary,
      quadraticEnergyIdentitySummary: identitySummary,
    },
  };
}

function nominalCycleRow(
  selection: {
    readonly pointId: NominalPointIdV1;
    readonly selectionMethod: NominalCycleRowV1["selectionMethod"];
    readonly targetPhase01: number;
    readonly sampleIndex: number;
  },
  sample: NoAvpdFourChamberBenchSampleV1,
  report: NoAvpdFourChamberBenchResultV1,
): NominalCycleRowV1 {
  const geometry = geometryForSample(sample, report);
  const stressesPa = stressesForSample(sample);
  const audit = evaluateNoAvpdTriSegFiberWorkAuditPointV1(geometry, stressesPa);
  return {
    ...selection,
    samplePhase01: sample.phase01,
    phaseOffsetSec:
      shortestPhaseDifference(sample.phase01, selection.targetPhase01) *
      report.runProtocol.cycleLengthSec,
    sourcePressureMmHg: {
      leftVentricle: sample.pressuresMmHg.lv,
      rightVentricle: sample.pressuresMmHg.rv,
    },
    sourcePressureReconstructionResidualPa: {
      leftVentricle:
        audit.coordinates.leftVentricleCavityVolumeM3
          .currentRepresentativeAreaWorkValue -
        sample.pressuresMmHg.lv * 133.322,
      rightVentricle:
        audit.coordinates.rightVentricleCavityVolumeM3
          .currentRepresentativeAreaWorkValue -
        sample.pressuresMmHg.rv * 133.322,
    },
    maximumAbsoluteFiberStrainReadbackResidual: Math.max(
      Math.abs(
        geometry.walls.leftFreeWall.fiberNaturalStrain -
          sample.wallReadback.lvFreeWall.totalStrain,
      ),
      Math.abs(
        geometry.walls.septum.fiberNaturalStrain -
          sample.wallReadback.septum.totalStrain,
      ),
      Math.abs(
        geometry.walls.rightFreeWall.fiberNaturalStrain -
          sample.wallReadback.rvFreeWall.totalStrain,
      ),
    ),
    maximumAbsoluteTotalStressDecompositionResidualPa: Math.max(
      stressDecompositionResidualPa(sample.wallReadback.lvFreeWall),
      stressDecompositionResidualPa(sample.wallReadback.septum),
      stressDecompositionResidualPa(sample.wallReadback.rvFreeWall),
    ),
    audit,
  };
}

function stressDecompositionResidualPa(
  wall: NoAvpdFourChamberBenchSampleV1["wallReadback"][
    "lvFreeWall" | "septum" | "rvFreeWall"],
): number {
  return (
    Math.abs(
      wall.totalStressKPa -
        wall.passiveStressKPa -
        wall.seriesTensionKPa -
        wall.slsOverstressKPa,
    ) * 1_000
  );
}

function passiveGridRows(
  report: NoAvpdFourChamberBenchResultV1,
): readonly PassiveGridRowV1[] {
  const walls = wallParameters(report);
  const rows: PassiveGridRowV1[] = [];
  for (const leftVentricleCavityVolumeMl of NO_AVPD_TRISEG_PASSIVE_WORK_GRID_V1.leftVentricleCavityVolumeMl) {
    for (const rightVentricleCavityVolumeMl of NO_AVPD_TRISEG_PASSIVE_WORK_GRID_V1.rightVentricleCavityVolumeMl) {
      for (const septalCapVolumeMl of NO_AVPD_TRISEG_PASSIVE_WORK_GRID_V1.septalCapVolumeMl) {
        for (const junctionRadiusCm of NO_AVPD_TRISEG_PASSIVE_WORK_GRID_V1.junctionRadiusCm) {
          const geometryInput: TriSegGeometryInputV1 = {
            leftVentricleCavityVolumeMl,
            rightVentricleCavityVolumeMl,
            walls,
            algebraic: { septalCapVolumeMl, junctionRadiusCm },
          };
          const geometry = requireValidGeometry(geometryInput);
          const fiberStressesPa = Object.fromEntries(
            TRISEG_WALL_IDS_V1.map((wallId) => [
              wallId,
              NO_AVPD_TRISEG_QUADRATIC_PASSIVE_MODULUS_PA_V1[wallId] *
                geometry.walls[wallId].fiberNaturalStrain,
            ]),
          ) as TriSegWallFiberStressesPaV1;
          rows.push({
            gridIndex: rows.length,
            geometryInput,
            fiberStressesPa,
            audit: evaluateNoAvpdTriSegFiberWorkAuditPointV1(
              geometry,
              fiberStressesPa,
            ),
            quadraticEnergyIdentity:
              evaluateNoAvpdTriSegQuadraticEnergyIdentityV1(
                geometryInput,
                NO_AVPD_TRISEG_QUADRATIC_PASSIVE_MODULUS_PA_V1,
              ),
          });
        }
      }
    }
  }
  return rows;
}

function geometryForSample(
  sample: NoAvpdFourChamberBenchSampleV1,
  report: NoAvpdFourChamberBenchResultV1,
): TriSegGeometryValidOutputV1 {
  return requireValidGeometry({
    leftVentricleCavityVolumeMl: sample.volumesMl.leftVentricleMl,
    rightVentricleCavityVolumeMl: sample.volumesMl.rightVentricleMl,
    walls: wallParameters(report),
    algebraic: {
      junctionRadiusCm: sample.triSeg.junctionRadiusCm,
      septalCapVolumeMl: sample.triSeg.septalCapVolumeMl,
    },
  });
}

function wallParameters(
  report: NoAvpdFourChamberBenchResultV1,
): TriSegWallParameterSetV1 {
  return Object.fromEntries(
    TRISEG_WALL_IDS_V1.map((wallId) => [
      wallId,
      {
        wallVolumeMl: report.parameterSnapshot.triSeg[wallId].wallVolumeMl,
        referenceMidwallAreaCm2:
          report.parameterSnapshot.triSeg[wallId].referenceMidwallAreaCm2,
      },
    ]),
  ) as TriSegWallParameterSetV1;
}

function stressesForSample(
  sample: NoAvpdFourChamberBenchSampleV1,
): TriSegWallFiberStressesPaV1 {
  return {
    leftFreeWall: sample.wallReadback.lvFreeWall.totalStressKPa * 1_000,
    septum: sample.wallReadback.septum.totalStressKPa * 1_000,
    rightFreeWall: sample.wallReadback.rvFreeWall.totalStressKPa * 1_000,
  };
}

function summarizeAuditRows(
  audits: readonly NoAvpdTriSegFiberWorkAuditPointV1[],
) {
  return Object.fromEntries(
    NO_AVPD_TRISEG_WORK_COORDINATES_V1.map((coordinateId) => {
      const rows = audits.map((audit) => audit.coordinates[coordinateId]);
      const absoluteMismatch = rows.map((row) => row.absoluteMismatch);
      const symmetricRelativeMismatch = rows.map(
        (row) => row.symmetricRelativeMismatch,
      );
      const contributionScaleRelativeMismatch = rows.map(
        (row) => row.contributionScaleRelativeMismatch,
      );
      return [
        coordinateId,
        {
          unit: rows[0]!.unit,
          pointCount: rows.length,
          absoluteMismatch: statistics(absoluteMismatch),
          symmetricRelativeMismatch: statistics(symmetricRelativeMismatch),
          contributionScaleRelativeMismatch: statistics(
            contributionScaleRelativeMismatch,
          ),
          pressureAbsoluteMismatchMmHg:
            rows[0]!.pressureReadbackMmHg == null
              ? null
              : statistics(
                  rows.map((row) => row.pressureReadbackMmHg!.absoluteMismatch),
                ),
          numericallyNonzeroMismatchCount: rows.filter((row) => {
            const scale = Math.max(
              1,
              Math.abs(row.currentRepresentativeAreaWorkValue),
              Math.abs(row.declaredHillFiberWorkValue),
            );
            return row.absoluteMismatch > 256 * Number.EPSILON * scale;
          }).length,
          numericalNonzeroDefinition:
            "abs-mismatch-greater-than-256-times-machine-epsilon-times-max(1,abs-current,abs-declared)" as const,
          changesAcceptanceStatus: false as const,
        },
      ];
    }),
  ) as Readonly<
    Record<
      TriSegGeometryCoordinateSIV1,
      {
        readonly unit: "Pa" | "N";
        readonly pointCount: number;
        readonly absoluteMismatch: ReturnType<typeof statistics>;
        readonly symmetricRelativeMismatch: ReturnType<typeof statistics>;
        readonly contributionScaleRelativeMismatch: ReturnType<
          typeof statistics
        >;
        readonly pressureAbsoluteMismatchMmHg: ReturnType<
          typeof statistics
        > | null;
        readonly numericallyNonzeroMismatchCount: number;
        readonly numericalNonzeroDefinition: string;
        readonly changesAcceptanceStatus: false;
      }
    >
  >;
}

function summarizeIdentityRows(
  identities: readonly NoAvpdTriSegQuadraticEnergyIdentityV1[],
) {
  return Object.fromEntries(
    NO_AVPD_TRISEG_WORK_COORDINATES_V1.map((coordinateId) => {
      const rows = identities.map(
        (identity) => identity.coordinates[coordinateId],
      );
      return [
        coordinateId,
        {
          unit: rows[0]!.unit,
          pointCount: rows.length,
          finiteDifferenceVsDirectAbsoluteResidual: statistics(
            rows.map((row) => row.absoluteResidual),
          ),
          finiteDifferenceVsDirectRelativeResidual: statistics(
            rows.map((row) => row.relativeResidual),
          ),
          currentAreaWorkMismatchFromEnergyGradient: statistics(
            rows.map((row) =>
              Math.abs(row.currentAreaWorkMismatchFromEnergyGradient),
            ),
          ),
          changesAcceptanceStatus: false as const,
        },
      ];
    }),
  ) as Readonly<
    Record<
      TriSegGeometryCoordinateSIV1,
      {
        readonly unit: "Pa" | "N";
        readonly pointCount: number;
        readonly finiteDifferenceVsDirectAbsoluteResidual: ReturnType<
          typeof statistics
        >;
        readonly finiteDifferenceVsDirectRelativeResidual: ReturnType<
          typeof statistics
        >;
        readonly currentAreaWorkMismatchFromEnergyGradient: ReturnType<
          typeof statistics
        >;
        readonly changesAcceptanceStatus: false;
      }
    >
  >;
}

function statistics(values: readonly number[]) {
  if (values.length === 0) throw new Error("statistics require values");
  return {
    minimum: Math.min(...values),
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    maximum: Math.max(...values),
  };
}

function requireValidGeometry(
  input: TriSegGeometryInputV1,
): TriSegGeometryValidOutputV1 {
  const geometry = evaluateTriSegGeometryV1(input);
  if (!geometry.valid) throw new Error(geometry.failureReason);
  return geometry;
}

function nearestPhaseSampleIndex(
  samples: readonly NoAvpdFourChamberBenchSampleV1[],
  phase01: number,
): number {
  return samples.reduce(
    (best, sample, index) =>
      Math.abs(shortestPhaseDifference(sample.phase01, phase01)) <
      Math.abs(shortestPhaseDifference(samples[best]!.phase01, phase01))
        ? index
        : best,
    0,
  );
}

function shortestPhaseDifference(later: number, earlier: number): number {
  let difference = later - earlier;
  while (difference > 0.5) difference -= 1;
  while (difference <= -0.5) difference += 1;
  return difference;
}

function assertUsableReport(report: NoAvpdFourChamberBenchResultV1): void {
  const left = report.reportOnlyEventResolvedDiagnostics.left;
  if (report.status !== "pass") {
    throw new Error(
      "nominal cycle source must pass structural-numerical gates",
    );
  }
  if (report.lastBeatSamples.length < 2) {
    throw new Error("nominal cycle source has no complete sampled beat");
  }
  if (
    left?.valveTransitions.modelHalfOpen.opening == null ||
    left.inflowEvents.ePeak == null ||
    left.inflowEvents.aPeak == null
  ) {
    throw new Error("nominal cycle source lacks MVO, E, or A event readbacks");
  }
}
