import React from "react";
import { useTranslation } from "react-i18next";

import {
  INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1,
  INTEGRATED_V3_LANE_KIND_V1,
  type StudioLaneCapabilitiesV1,
  type StudioLaneDescriptorV1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import {
  MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1,
} from "@/studio/adapters/mainWire/MainWireIntegratedV3LiveLaneDriverV1";
import {
  STUDIO_NONCORONARY_LANE_DESCRIPTOR_V1,
  STUDIO_NONCORONARY_LANE_KIND_V1,
  type StudioLiveLaneKindV1,
} from "@/studio/adapters/mainWire/StudioLiveLaneV1";

export const SCIENTIFIC_PRODUCT_LANE_PREFERENCE_KEY_V1 =
  "circleheart.workbench.lanePreference.v1" as const;
export const SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1 =
  INTEGRATED_V3_LANE_KIND_V1;

export const SCIENTIFIC_PRODUCT_LANE_CAPABILITY_LABELS_V1 = Object.freeze({
  liveWorkerExecution: "Browser-Worker execution",
  decimatedLivePresentation: "Live chart presentation",
  livePacingReporting: "Measured pacing",
  suspendResumePresentation: "Suspend or resume presentation",
  operationalWorkerRotationCheckpoint: "Operational Worker rotation",
  interactiveResearchControls: "Research controls",
  strictPeriodicSettlement: "Strict periodic settlement",
  steadyCandidatePromotion: "Promote steady candidate",
  candidatePinning: "Pin candidate",
  persistedWarmSnapshot: "Save or restore snapshot",
  exactSignalExport: "Exact signal export",
  presentationBeatEstimates: "Per-beat estimates",
  hemodynamicSideAnalysis: "Guyton / Starling analysis",
  pvRelationsSideAnalysis: "PV-relation analysis",
  tbvContinuationSeedPrediction: "TBV continuation analysis",
  externalAfRhythm: "External AF rhythm",
  iabpSupport: "IABP support",
  releaseOrCandidateIdentity: "Release or candidate identity",
} as const satisfies Record<keyof StudioLaneCapabilitiesV1, string>);

export const SCIENTIFIC_PRODUCT_LANE_DESCRIPTORS_V1 = Object.freeze([
  MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1,
  STUDIO_NONCORONARY_LANE_DESCRIPTOR_V1,
] as const satisfies readonly StudioLaneDescriptorV1[]);

export const SCIENTIFIC_PRODUCT_LANE_DESCRIPTOR_BY_KIND_V1 =
  Object.freeze({
    [INTEGRATED_V3_LANE_KIND_V1]:
      MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1,
    [STUDIO_NONCORONARY_LANE_KIND_V1]:
      STUDIO_NONCORONARY_LANE_DESCRIPTOR_V1,
  } satisfies Record<StudioLiveLaneKindV1, StudioLaneDescriptorV1>);

const SCIENTIFIC_PRODUCT_LANE_KINDS_V1 = new Set<string>(
  SCIENTIFIC_PRODUCT_LANE_DESCRIPTORS_V1.map(
    (descriptor) => descriptor.laneKind,
  ),
);

type ScientificProductLanePreferenceStorageV1 =
  Pick<Storage, "getItem" | "setItem">;

export function readScientificProductLanePreferenceV1(
  storage: ScientificProductLanePreferenceStorageV1 | null =
    browserLanePreferenceStorageV1(),
): StudioLiveLaneKindV1 {
  if (storage === null) return SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1;
  try {
    const stored = storage.getItem(
      SCIENTIFIC_PRODUCT_LANE_PREFERENCE_KEY_V1,
    );
    return typeof stored === "string"
        && SCIENTIFIC_PRODUCT_LANE_KINDS_V1.has(stored)
      ? stored as StudioLiveLaneKindV1
      : SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1;
  } catch {
    return SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1;
  }
}

/**
 * Bare-route precedence is deliberate: URL > stored preference > product
 * default. A present but invalid URL value is an explicit malformed choice,
 * so it fails to the default instead of silently consulting or mutating
 * storage.
 */
export function resolveScientificProductLaneKindV1(
  search: string,
  storage: ScientificProductLanePreferenceStorageV1 | null =
    browserLanePreferenceStorageV1(),
): StudioLiveLaneKindV1 {
  try {
    const laneValues = new URLSearchParams(search).getAll("lane");
    if (laneValues.length > 0) {
      const laneValue = laneValues.length === 1 ? laneValues[0] : null;
      return laneValue !== null
          && SCIENTIFIC_PRODUCT_LANE_KINDS_V1.has(laneValue)
        ? laneValue as StudioLiveLaneKindV1
        : SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1;
    }
  } catch {
    return SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1;
  }
  return readScientificProductLanePreferenceV1(storage);
}

export function writeScientificProductLanePreferenceV1(
  laneKind: StudioLiveLaneKindV1,
  storage: ScientificProductLanePreferenceStorageV1 | null =
    browserLanePreferenceStorageV1(),
): void {
  if (storage === null) return;
  try {
    storage.setItem(SCIENTIFIC_PRODUCT_LANE_PREFERENCE_KEY_V1, laneKind);
  } catch {
    // A blocked local-storage write must not prevent an in-session choice.
  }
}

export function ScientificProductLaneSelectorV1({
  selectedDescriptor,
  onSelectLane,
}: Readonly<{
  selectedDescriptor: StudioLaneDescriptorV1;
  onSelectLane: (laneKind: StudioLiveLaneKindV1) => void;
}>) {
  const { t } = useTranslation();

  return (
    <section
      className="shrink-0 border-b border-wb-line bg-wb-header px-4 py-3 text-wb-text"
      aria-labelledby="scientific-product-lane-selector-title-v1"
      data-testid="scientific-product-lane-selector-v1"
      data-selected-lane-kind={selectedDescriptor.laneKind}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p
              id="scientific-product-lane-selector-title-v1"
              className="text-xs font-bold uppercase tracking-[0.16em] text-wb-accent"
            >
              {t("workbench.laneSelector.title")}
            </p>
            <h2 className="mt-1 text-base font-bold">
              {selectedDescriptor.displayName}
            </h2>
          </div>
          <span
            className="rounded border border-wb-warning/40 bg-wb-warning-soft px-2 py-1 text-xs font-bold text-wb-warning"
            data-testid="scientific-product-selected-lane-badge-v1"
          >
            {selectedDescriptor.badge}
          </span>
        </div>

        <ol
          className="mt-3 grid gap-1 text-xs leading-5 text-wb-muted md:grid-cols-2"
          data-testid="scientific-product-selected-lane-limitations-v1"
        >
          {selectedDescriptor.limitations.map((limitation, index) => (
            <li key={index} data-selected-lane-limitation-index={index}>
              {limitation}
            </li>
          ))}
        </ol>

        <div
          className="mt-3 grid gap-2 sm:grid-cols-2"
          role="group"
          aria-label={t("workbench.laneSelector.chooseLane")}
          data-testid="scientific-product-lane-choices-v1"
        >
          {SCIENTIFIC_PRODUCT_LANE_DESCRIPTORS_V1.map((descriptor) => {
            const selected =
              descriptor.laneId === selectedDescriptor.laneId;
            return (
              <button
                key={descriptor.laneKind}
                type="button"
                disabled={selected}
                aria-pressed={selected}
                onClick={() => onSelectLane(descriptor.laneKind)}
                className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-wb-line bg-wb-panel px-3 py-2 text-left text-sm font-bold text-wb-text disabled:cursor-default disabled:border-wb-accent disabled:bg-wb-active"
                data-select-lane={descriptor.laneKind}
              >
                <span>{descriptor.displayName}</span>
                <span className="shrink-0 text-xs text-wb-accent">
                  {selected
                    ? t("workbench.laneSelector.currentLane")
                    : t("workbench.laneSelector.useLane")}
                </span>
              </button>
            );
          })}
        </div>

        <details
          className="mt-3 rounded-lg border border-wb-line bg-wb-panel"
          data-testid="scientific-product-lane-comparison-v1"
        >
          <summary className="cursor-pointer px-3 py-2 text-sm font-bold text-wb-accent">
            {t("workbench.laneSelector.compareCapabilities")}
          </summary>
          <div className="grid gap-4 border-t border-wb-line p-3 xl:grid-cols-2">
            {SCIENTIFIC_PRODUCT_LANE_DESCRIPTORS_V1.map((descriptor) => {
              const selected =
                descriptor.laneId === selectedDescriptor.laneId;
              return (
                <article
                  key={descriptor.laneKind}
                  className="rounded-lg border border-wb-line bg-wb-soft p-4"
                  data-lane-option={descriptor.laneKind}
                  data-lane-selected={selected}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{descriptor.displayName}</h3>
                      <p className="mt-1 text-xs font-semibold text-wb-muted">
                        {descriptor.badge}
                      </p>
                    </div>
                  </div>

                  <ol
                    className="mt-3 grid gap-1 text-xs leading-5 text-wb-muted"
                    aria-label={t(
                      "workbench.laneSelector.limitationsAria",
                      { lane: descriptor.displayName },
                    )}
                    data-lane-limitations={descriptor.laneKind}
                  >
                    {descriptor.limitations.map((limitation, index) => (
                      <li key={index}>{limitation}</li>
                    ))}
                  </ol>

                  <dl
                    className="mt-4 grid gap-2"
                    aria-label={t(
                      "workbench.laneSelector.capabilitiesAria",
                      { lane: descriptor.displayName },
                    )}
                    data-lane-capabilities={descriptor.laneKind}
                  >
                    {INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1.map((key) => {
                      const capability = descriptor.capabilities[key];
                      return (
                        <div
                          key={key}
                          className="rounded border border-wb-line bg-wb-panel px-3 py-2"
                          data-lane-capability={key}
                          data-capability-available={capability.available}
                        >
                          <dt className="text-xs font-bold text-wb-text">
                            {t(
                              `workbench.laneSelector.capabilities.${key}`,
                              {
                                defaultValue:
                                  SCIENTIFIC_PRODUCT_LANE_CAPABILITY_LABELS_V1[
                                    key
                                  ],
                              },
                            )}
                          </dt>
                          <dd className="mt-1 text-xs leading-5 text-wb-muted">
                            {capability.available === false
                              ? (
                                <>
                                  <span
                                    className="block font-semibold text-wb-warning"
                                    data-capability-reason={capability.reason}
                                  >
                                    {t("workbench.laneSelector.unavailable")}
                                    {" · "}
                                    {capability.reason}
                                  </span>
                                  <span data-capability-explanation={key}>
                                    {capability.explanation}
                                  </span>
                                </>
                              )
                              : t("workbench.laneSelector.available")}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </article>
              );
            })}
          </div>
        </details>
      </div>
    </section>
  );
}

function browserLanePreferenceStorageV1():
ScientificProductLanePreferenceStorageV1 | null {
  try {
    return typeof window === "undefined"
      ? null
      : window.localStorage;
  } catch {
    return null;
  }
}
