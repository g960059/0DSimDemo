export const PVA_RESEARCH_REFERENCE_IDS_V1 = Object.freeze([
  "dynamic-maximum-volume",
  "intrinsic-passive-center-slice",
] as const);

export const PVA_RESEARCH_VENTRICLE_IDS_V1 = Object.freeze([
  "LV",
  "RV",
] as const);

export const PVA_RESEARCH_METHOD_IDS_V1 = Object.freeze([
  "baseline-anchored-isochronal",
  "minimum-volume",
  "sampled-common-support-envelope",
  "semilunar-closure",
] as const);

export const PVA_RESEARCH_CLASSIFICATIONS_V1 = Object.freeze([
  "domain-supported-pva",
  "transient-pva-like-area",
  "out-of-domain",
  "method-unavailable",
] as const);

export type PvaResearchReferenceIdV1 =
  (typeof PVA_RESEARCH_REFERENCE_IDS_V1)[number];
export type PvaResearchVentricleIdV1 =
  (typeof PVA_RESEARCH_VENTRICLE_IDS_V1)[number];
export type PvaResearchMethodIdV1 = (typeof PVA_RESEARCH_METHOD_IDS_V1)[number];
export type PvaResearchClassificationV1 =
  (typeof PVA_RESEARCH_CLASSIFICATIONS_V1)[number];

type PvaResearchDirectionIdV1 = "occlusion" | "release";

type PvaGeometryReferenceDiagnosticInputV2 = Readonly<{
  classification: Exclude<PvaResearchClassificationV1, "method-unavailable">;
  endpointDomainStatus: string;
  observedDomainAreaStrip: Readonly<{
    lowerVolumeMl: number;
    upperVolumeMl: number;
    signedSystolicMinusPassiveAreaJ: number;
  }> | null;
  reasons: readonly string[];
  supportedVolumeRangeMl: readonly [number, number];
}>;

type PvaGeometryDiagnosedRowInputV2 = Readonly<{
  status: "diagnosed";
  ventricleId: PvaResearchVentricleIdV1;
  beatOrdinal: number;
  directionId: PvaResearchDirectionIdV1;
  systolicMethodId: PvaResearchMethodIdV1;
  systolicGeometry: Readonly<{
    lineAreaOutsideMeasuredVolumeRangeFraction: number;
  }>;
  dynamicMaximumVolume: PvaGeometryReferenceDiagnosticInputV2;
  intrinsicPassiveCenterSlice: PvaGeometryReferenceDiagnosticInputV2;
}>;

type PvaGeometryUnavailableRowInputV2 = Readonly<{
  status: "method-unavailable";
  ventricleId: PvaResearchVentricleIdV1;
  beatOrdinal: number;
  directionId: PvaResearchDirectionIdV1;
  systolicMethodId: PvaResearchMethodIdV1;
  reason: string;
}>;

export type PvaGeometryDomainArtifactInputV2 = Readonly<{
  studyId: string;
  status: string;
  scope: string;
  pressureBasis: string;
  beatWorkDiagnostics: readonly Readonly<{
    ventricleId: PvaResearchVentricleIdV1;
    beatOrdinal: number;
    acceptedOpenPathJ: number;
    syntheticStraightClosureJ: number;
    syntheticClosureAbsoluteFractionOfAcceptedOpenPath: number;
    exactlyClosedByRetainedEndpoints: boolean;
  }>[];
  rows: readonly (
    PvaGeometryDiagnosedRowInputV2 | PvaGeometryUnavailableRowInputV2
  )[];
  summary: Readonly<{
    attemptedRowCount: number;
    sourceAvailableRowCount: number;
    sourceUnavailableRowCount: number;
    byReference: readonly Readonly<{
      referenceId: PvaResearchReferenceIdV1;
      domainSupportedPvaRowCount: number;
      transientPvaLikeAreaRowCount: number;
      outOfDomainRowCount: number;
      methodUnavailableRowCount: number;
      observedDomainAreaStripRowCount: number;
      supportedIntersectionRowCount: number;
    }>[];
    uniqueBeatWorkCount: number;
    exactlyClosedBeatWorkCount: number;
    syntheticClosureFraction: Readonly<{
      minimum: number;
      median: number;
      maximum: number;
      aboveOnePercentCount: number;
      aboveFivePercentCount: number;
    }>;
    systolicLineOutsideMeasuredRangeFraction: Readonly<{
      minimum: number;
      median: number;
      maximum: number;
      aboveHalfCount: number;
      aboveThreeQuartersCount: number;
    }>;
  }>;
  interpretation: Readonly<{
    existingAbsolutePvaReadyForProductDisplay: false;
    genericPvaEstablished: false;
    closedPeriodicLoopEstablishedForTransientRows: boolean;
    domainSupportedSystolicPassiveIntersectionEstablishedForEveryRow: boolean;
  }>;
}>;

export type PvaResearchReferenceResultV1 = Readonly<{
  classification: PvaResearchClassificationV1;
  endpointDomainStatus: string | null;
  observedDomainAreaJ: number | null;
  observedDomainVolumeRangeMl: readonly [number, number] | null;
  supportedVolumeRangeMl: readonly [number, number] | null;
  reasons: readonly string[];
}>;

export type PvaResearchRowV1 = Readonly<{
  rowId: string;
  ventricleId: PvaResearchVentricleIdV1;
  beatOrdinal: number;
  directionId: PvaResearchDirectionIdV1;
  systolicMethodId: PvaResearchMethodIdV1;
  acceptedOpenPathJ: number;
  syntheticStraightClosureJ: number;
  syntheticClosureFraction: number;
  exactlyClosedByRetainedEndpoints: boolean;
  systolicLineOutsideMeasuredRangeFraction: number | null;
  references: Readonly<
    Record<PvaResearchReferenceIdV1, PvaResearchReferenceResultV1>
  >;
}>;

export type PvaResearchReferenceSummaryV1 = Readonly<{
  referenceId: PvaResearchReferenceIdV1;
  counts: Readonly<Record<PvaResearchClassificationV1, number>>;
  observedDomainAreaStripRowCount: number;
  supportedIntersectionRowCount: number;
}>;

export type PvaResearchDatasetV1 = Readonly<{
  studyId: string;
  pressureBasis: string;
  attemptedRowCount: number;
  sourceAvailableRowCount: number;
  sourceUnavailableRowCount: number;
  uniqueBeatWorkCount: number;
  exactlyClosedBeatWorkCount: number;
  closureFraction: PvaGeometryDomainArtifactInputV2["summary"]["syntheticClosureFraction"];
  systolicExtrapolationFraction: PvaGeometryDomainArtifactInputV2["summary"]["systolicLineOutsideMeasuredRangeFraction"];
  referenceSummaries: readonly PvaResearchReferenceSummaryV1[];
  rows: readonly PvaResearchRowV1[];
  productDisplayReady: false;
  genericPvaEstablished: false;
}>;

export type PvaResearchFiltersV1 = Readonly<{
  referenceId: PvaResearchReferenceIdV1;
  ventricleId: PvaResearchVentricleIdV1 | "all";
  systolicMethodId: PvaResearchMethodIdV1 | "all";
  classification: PvaResearchClassificationV1 | "all";
}>;

export type PvaResearchDisplayRowV1 = PvaResearchRowV1 &
  Readonly<{
    referenceId: PvaResearchReferenceIdV1;
    reference: PvaResearchReferenceResultV1;
  }>;

/**
 * Presentation-only projection of the checked-in V2 result. It deliberately
 * carries no model runner, qualification, admission, or artifact-writing seam.
 */
export function projectPvaResearchDatasetV1(
  artifact: PvaGeometryDomainArtifactInputV2,
): PvaResearchDatasetV1 {
  if (
    artifact.interpretation.existingAbsolutePvaReadyForProductDisplay ||
    artifact.interpretation.genericPvaEstablished
  ) {
    throw new Error(
      "PVA research view cannot project a product-qualified claim",
    );
  }
  const workByBeat = new Map(
    artifact.beatWorkDiagnostics.map((work) => [
      beatKeyV1(work.ventricleId, work.beatOrdinal),
      work,
    ]),
  );
  const rows = artifact.rows
    .map((row): PvaResearchRowV1 => {
      const work = workByBeat.get(beatKeyV1(row.ventricleId, row.beatOrdinal));
      if (work === undefined) {
        throw new Error("PVA research projection requires retained beat work");
      }
      const references =
        row.status === "diagnosed"
          ? Object.freeze({
              "dynamic-maximum-volume": referenceResultV1(
                row.dynamicMaximumVolume,
              ),
              "intrinsic-passive-center-slice": referenceResultV1(
                row.intrinsicPassiveCenterSlice,
              ),
            })
          : Object.freeze({
              "dynamic-maximum-volume": unavailableReferenceV1(row.reason),
              "intrinsic-passive-center-slice": unavailableReferenceV1(
                row.reason,
              ),
            });
      return Object.freeze({
        rowId: [
          row.ventricleId,
          row.beatOrdinal,
          row.directionId,
          row.systolicMethodId,
        ].join(":"),
        ventricleId: row.ventricleId,
        beatOrdinal: row.beatOrdinal,
        directionId: row.directionId,
        systolicMethodId: row.systolicMethodId,
        acceptedOpenPathJ: work.acceptedOpenPathJ,
        syntheticStraightClosureJ: work.syntheticStraightClosureJ,
        syntheticClosureFraction:
          work.syntheticClosureAbsoluteFractionOfAcceptedOpenPath,
        exactlyClosedByRetainedEndpoints: work.exactlyClosedByRetainedEndpoints,
        systolicLineOutsideMeasuredRangeFraction:
          row.status === "diagnosed"
            ? row.systolicGeometry.lineAreaOutsideMeasuredVolumeRangeFraction
            : null,
        references,
      });
    })
    .sort(compareResearchRowsV1);
  const referenceSummaries = artifact.summary.byReference.map((summary) =>
    Object.freeze({
      referenceId: summary.referenceId,
      counts: Object.freeze({
        "domain-supported-pva": summary.domainSupportedPvaRowCount,
        "transient-pva-like-area": summary.transientPvaLikeAreaRowCount,
        "out-of-domain": summary.outOfDomainRowCount,
        "method-unavailable": summary.methodUnavailableRowCount,
      }),
      observedDomainAreaStripRowCount: summary.observedDomainAreaStripRowCount,
      supportedIntersectionRowCount: summary.supportedIntersectionRowCount,
    }),
  );

  return Object.freeze({
    studyId: artifact.studyId,
    pressureBasis: artifact.pressureBasis,
    attemptedRowCount: artifact.summary.attemptedRowCount,
    sourceAvailableRowCount: artifact.summary.sourceAvailableRowCount,
    sourceUnavailableRowCount: artifact.summary.sourceUnavailableRowCount,
    uniqueBeatWorkCount: artifact.summary.uniqueBeatWorkCount,
    exactlyClosedBeatWorkCount: artifact.summary.exactlyClosedBeatWorkCount,
    closureFraction: Object.freeze({
      ...artifact.summary.syntheticClosureFraction,
    }),
    systolicExtrapolationFraction: Object.freeze({
      ...artifact.summary.systolicLineOutsideMeasuredRangeFraction,
    }),
    referenceSummaries: Object.freeze(referenceSummaries),
    rows: Object.freeze(rows),
    productDisplayReady: false,
    genericPvaEstablished: false,
  });
}

export function filterPvaResearchRowsV1(
  dataset: PvaResearchDatasetV1,
  filters: PvaResearchFiltersV1,
): readonly PvaResearchDisplayRowV1[] {
  return Object.freeze(
    dataset.rows.flatMap((row) => {
      const reference = row.references[filters.referenceId];
      if (
        filters.ventricleId !== "all" &&
        row.ventricleId !== filters.ventricleId
      )
        return [];
      if (
        filters.systolicMethodId !== "all" &&
        row.systolicMethodId !== filters.systolicMethodId
      )
        return [];
      if (
        filters.classification !== "all" &&
        reference.classification !== filters.classification
      )
        return [];
      return [
        Object.freeze({
          ...row,
          referenceId: filters.referenceId,
          reference,
        }),
      ];
    }),
  );
}

export function summarizePvaResearchRowsV1(
  rows: readonly PvaResearchDisplayRowV1[],
): Readonly<Record<PvaResearchClassificationV1, number>> {
  const counts: Record<PvaResearchClassificationV1, number> = {
    "domain-supported-pva": 0,
    "transient-pva-like-area": 0,
    "out-of-domain": 0,
    "method-unavailable": 0,
  };
  for (const row of rows) counts[row.reference.classification] += 1;
  return Object.freeze(counts);
}

function referenceResultV1(
  input: PvaGeometryReferenceDiagnosticInputV2,
): PvaResearchReferenceResultV1 {
  return Object.freeze({
    classification: input.classification,
    endpointDomainStatus: input.endpointDomainStatus,
    observedDomainAreaJ:
      input.observedDomainAreaStrip?.signedSystolicMinusPassiveAreaJ ?? null,
    observedDomainVolumeRangeMl:
      input.observedDomainAreaStrip === null
        ? null
        : Object.freeze([
            input.observedDomainAreaStrip.lowerVolumeMl,
            input.observedDomainAreaStrip.upperVolumeMl,
          ] as const),
    supportedVolumeRangeMl: Object.freeze([
      input.supportedVolumeRangeMl[0],
      input.supportedVolumeRangeMl[1],
    ] as const),
    reasons: Object.freeze([...input.reasons]),
  });
}

function unavailableReferenceV1(reason: string): PvaResearchReferenceResultV1 {
  return Object.freeze({
    classification: "method-unavailable",
    endpointDomainStatus: null,
    observedDomainAreaJ: null,
    observedDomainVolumeRangeMl: null,
    supportedVolumeRangeMl: null,
    reasons: Object.freeze([reason]),
  });
}

function beatKeyV1(
  ventricleId: PvaResearchVentricleIdV1,
  beatOrdinal: number,
): string {
  return `${ventricleId}:${beatOrdinal}`;
}

function compareResearchRowsV1(
  left: PvaResearchRowV1,
  right: PvaResearchRowV1,
): number {
  return (
    left.beatOrdinal - right.beatOrdinal ||
    PVA_RESEARCH_VENTRICLE_IDS_V1.indexOf(left.ventricleId) -
      PVA_RESEARCH_VENTRICLE_IDS_V1.indexOf(right.ventricleId) ||
    PVA_RESEARCH_METHOD_IDS_V1.indexOf(left.systolicMethodId) -
      PVA_RESEARCH_METHOD_IDS_V1.indexOf(right.systolicMethodId)
  );
}
