import { describe, expect, it, vi } from "vitest";

import {
  ScientificProductReaderExperimentControllerV1,
  type ScientificProductReaderRuntimePortV1,
} from "@/components/scientificProduct/ScientificProductReaderExperimentControllerV1";
import {
  SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_AUTHOR_DRAFT_V1,
  SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
  SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SOURCE_ID_V1,
} from "@/components/scientificProduct/ScientificProductSampleAfterloadArticleV1";
import {
  projectRuntimeObservablePointToMainWireScientificObservableFrameV1,
} from "@/components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1";
import {
  resolveStudioReaderPreviewRuntimeBindingV1,
} from "@/components/studio/StudioReaderPreviewRuntimeBindingV1";
import {
  createScientificWorkbenchResearchControlStoreV0,
  type ScientificWorkbenchResearchControlOwnerActionRefV0,
  type ScientificWorkbenchResearchControlSnapshotInputV0,
  type ScientificWorkbenchResearchControlStoreV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import {
  createMainWireScientificResearchControlBaselineTargetStateV0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_RELEASE_REF_V0,
} from "@/engine/scientific/controls";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
  STUDIO_READER_BRIEF_V1_SCHEMA_ID,
  type ReaderPreviewManifestV1,
  type ReaderBriefV1,
  type StudioGraphPaneSpecV1,
} from "@/studio/contracts/v1/content";
import {
  StudioAuthorPreviewApplicationV1,
} from "@/studio/application/content";

const SCENARIO_ID_V1 = "reader-preview-scenario";
const SYSTEMIC_PARAMETER_KEY_V1 =
  "circulation.systemic-vascular-resistance-scale";
const AO_PRESSURE_SIGNAL_ID_V1 =
  "hemodynamics.pressure.absolute.Ao";
const LV_VOLUME_SIGNAL_ID_V1 = "hemodynamics.volume.LV";

describe("Scientific Product Reader experiment controller V1", () => {
  it("opens from one source point, then publishes only Reader-safe live state", async () => {
    const fixture = await readerRuntimeFixtureV1();
    const brief = readerBriefV1();
    const originalAllowedValues = brief.controls[0]!.allowedValues;
    const controller =
      ScientificProductReaderExperimentControllerV1.create({
        brief,
        runtime: fixture.runtime,
        resetToSource: fixture.resetToSource,
      });
    const initial = controller.getSnapshot();

    expect(initial).toMatchObject({
      phase: "seed",
      timeScale: 1,
      canonicalSeedPointCount: 1,
      startedFromOnePoint: true,
      targetGeneration: 0,
      strictActivity: "source-settled",
      evidence: "settled-snapshot-one-point",
    });
    expect(initial.selectedSignalSeries.points).toHaveLength(1);
    expect(initial.selectedSignalSeries.points[0]).toMatchObject({
      acceptedTimeSec: 0,
      values: {
        [AO_PRESSURE_SIGNAL_ID_V1]: 90,
      },
      availability: {
        [AO_PRESSURE_SIGNAL_ID_V1]: "available",
      },
    });
    expect(initial.instantaneousReadbacks[0]).toMatchObject({
      signalId: LV_VOLUME_SIGNAL_ID_V1,
      value: 120,
      availability: "available",
    });
    expect(initial.allowedControls[0]).toMatchObject({
      parameterKey: SYSTEMIC_PARAMETER_KEY_V1,
      value: 1,
      allowedValues: [1, 1.5, 2],
    });
    expect("controlStore" in initial).toBe(false);
    expect("candidate" in initial).toBe(false);

    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);
    controller.startPresentation();
    const started = controller.getSnapshot();
    expect(fixture.resumeLive).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(started).toMatchObject({
      phase: "running",
      targetGeneration: 3,
      strictActivity: "running",
      timeScale: 1,
    });
    expect(started.selectedSignalSeries.points).toHaveLength(2);
    expect(started.selectedSignalSeries.points[1]).toMatchObject({
      acceptedTimeSec: 1,
      values: {
        [AO_PRESSURE_SIGNAL_ID_V1]: 92,
      },
    });
    expect(started.instantaneousReadbacks[0]).toMatchObject({
      value: null,
      availability: "not-evaluated-at-accepted-state",
    });

    controller.commitControl(SYSTEMIC_PARAMETER_KEY_V1, 1.5);
    expect(fixture.commitControlValue).toHaveBeenCalledWith(
      SYSTEMIC_PARAMETER_KEY_V1,
      1.5,
    );
    expect(brief.controls[0]!.initialValue).toBe(1);
    expect(brief.controls[0]!.allowedValues).toBe(originalAllowedValues);
    expect(() =>
      controller.commitControl("circulation.venous-tone", 0.3)
    ).toThrow(/does not allow parameter/);
    expect(() =>
      controller.commitControl(SYSTEMIC_PARAMETER_KEY_V1, 1.25)
    ).toThrow(/is not allowed/);
    expect(() =>
      controller.commitControl(SYSTEMIC_PARAMETER_KEY_V1, Number.NaN)
    ).toThrow(/is not allowed/);

    fixture.publish(
      [fixture.seedFrame, fixture.currentFrame],
      {
        phase: "failed",
        errorMessage: "Studio presentation projection failed.",
      },
    );
    expect(controller.getSnapshot()).toMatchObject({
      phase: "failed",
      errorMessage: "Studio presentation projection failed.",
    });
    expect(controller.getSnapshot().selectedSignalSeries.points).toHaveLength(
      2,
    );

    const callsBeforeUnsubscribe = listener.mock.calls.length;
    unsubscribe();
    unsubscribe();
    fixture.publish([
      fixture.seedFrame,
      fixture.currentFrame,
      observableFrameV1(2, 3, {
        [AO_PRESSURE_SIGNAL_ID_V1]: 95,
      }),
    ]);
    expect(listener).toHaveBeenCalledTimes(callsBeforeUnsubscribe);
    expect(controller.getSnapshot().selectedSignalSeries.points).toHaveLength(
      3,
    );

    controller.stopPresentation();
    const frozen = controller.getSnapshot();
    fixture.publish([
      fixture.seedFrame,
      fixture.currentFrame,
      observableFrameV1(2, 3, {
        [AO_PRESSURE_SIGNAL_ID_V1]: 95,
      }),
      observableFrameV1(3, 4, {
        [AO_PRESSURE_SIGNAL_ID_V1]: 97,
      }),
    ]);
    expect(controller.getSnapshot()).toBe(frozen);

    controller.resetPresentation();
    expect(fixture.resetToSource).toHaveBeenCalledTimes(1);

    controller.dispose();
    expect(() => controller.startPresentation()).toThrow(/after disposal/);
    expect(() => controller.resetPresentation()).toThrow(/after disposal/);
  });

  it("rejects mismatched targets, scenario counts, and unknown mappings", async () => {
    const fixture = await readerRuntimeFixtureV1();
    const brief = readerBriefV1();

    expect(() =>
      ScientificProductReaderExperimentControllerV1.create({
        brief: withControlTargetV1(brief, ["another-scenario"]),
        runtime: fixture.runtime,
        resetToSource: fixture.resetToSource,
      })
    ).toThrow(/must target only scenario reader-preview-scenario/);

    expect(() =>
      ScientificProductReaderExperimentControllerV1.create({
        brief: withControlTargetV1(
          brief,
          [SCENARIO_ID_V1, "another-scenario"],
        ),
        runtime: fixture.runtime,
        resetToSource: fixture.resetToSource,
      })
    ).toThrow(/must target only scenario reader-preview-scenario/);

    expect(() =>
      ScientificProductReaderExperimentControllerV1.create({
        brief: withParameterKeyV1(
          brief,
          "circulation.not-supported",
        ),
        runtime: fixture.runtime,
        resetToSource: fixture.resetToSource,
      })
    ).toThrow(/no unique runtime mapping/);

    const readOnly = ScientificProductReaderExperimentControllerV1.create({
      brief: Object.freeze({
        ...brief,
        controls: Object.freeze([]),
      }),
      runtime: fixture.runtime,
      resetToSource: fixture.resetToSource,
    });
    expect(readOnly.getSnapshot().allowedControls).toEqual([]);
    readOnly.dispose();
  });

  it("accepts workspace PV ids and chamber aliases while rejecting forged items", async () => {
    const fixture = await readerRuntimeFixtureV1();
    for (const itemId of ["lv-primary", "la", "RA", "Lv", "rV"]) {
      const controller =
        ScientificProductReaderExperimentControllerV1.create({
          brief: withPvLoopItemV1(readerBriefV1(), itemId),
          runtime: fixture.runtime,
          resetToSource: fixture.resetToSource,
        });
      controller.dispose();
    }

    expect(() =>
      ScientificProductReaderExperimentControllerV1.create({
        brief: withPvLoopItemV1(
          readerBriefV1(),
          "forged-pressure-volume-trajectory",
        ),
        runtime: fixture.runtime,
        resetToSource: fixture.resetToSource,
      })
    ).toThrow(
      /PV-loop item forged-pressure-volume-trajectory is not supported/,
    );
  });

  it("drives every Reader control from the release-bound runtime catalog", async () => {
    const fixture = await readerRuntimeFixtureV1();
    const cases = [
      {
        parameterKey: "circulation.systemic-vascular-resistance-scale",
        initialValue: 1,
        nextValue: 1.5,
      },
      {
        parameterKey: "circulation.pulmonary-vascular-resistance-scale",
        initialValue: 1,
        nextValue: 2,
      },
      {
        parameterKey: "circulation.venous-tone",
        initialValue: 0.15,
        nextValue: 0.3,
      },
      {
        parameterKey: "circulation.arterial-stiffness",
        initialValue: 0.75,
        nextValue: 1,
      },
      {
        parameterKey: "ventilation.peep-cm-h2o",
        initialValue: 0,
        nextValue: 5,
      },
      {
        parameterKey: "pericardium.prescribed-fluid-volume-ml",
        initialValue: 0,
        nextValue: 25,
      },
    ] as const;

    for (const item of cases) {
      const controller =
        ScientificProductReaderExperimentControllerV1.create({
          brief: withControlV1(readerBriefV1(), {
            parameterKey: item.parameterKey,
            initialValue: item.initialValue,
            allowedValues: [item.initialValue, item.nextValue],
          }),
          runtime: fixture.runtime,
          resetToSource: fixture.resetToSource,
        });
      expect(controller.getSnapshot().allowedControls[0]).toMatchObject({
        parameterKey: item.parameterKey,
        value: item.initialValue,
      });
      controller.commitControl(item.parameterKey, item.nextValue);
      expect(fixture.commitControlValue).toHaveBeenLastCalledWith(
        item.parameterKey,
        item.nextValue,
      );
      controller.dispose();
    }

    expect(() =>
      ScientificProductReaderExperimentControllerV1.create({
        brief: withControlV1(readerBriefV1(), {
          parameterKey: "circulation.venous-tone",
          initialValue: 0.15,
          allowedValues: [0.15, 0.2],
        }),
        runtime: fixture.runtime,
        resetToSource: fixture.resetToSource,
      })
    ).toThrow(/invalid value allowlist/);
  });
});

describe("Studio Reader Preview runtime binding V1", () => {
  it("binds the publication-neutral Reader document to its exact preview source", () => {
    const manifest = readerPreviewManifestV1();

    const binding = resolveStudioReaderPreviewRuntimeBindingV1(manifest);

    expect(binding).toMatchObject({
      scenario: {
        scenarioId: SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1,
      },
      source: {
        kind: "preview-bootstrap",
        sourceId: SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SOURCE_ID_V1,
        qualification: "uncertified-preview-only",
      },
      caseEntry: {
        caseId: SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SOURCE_ID_V1,
      },
    });
    expect(
      "runtimeSource" in binding.placement.experiment.scenarios[0]!,
    ).toBe(false);
  });

  it("rejects a forged model identity or preview qualification before runtime allocation", () => {
    const wrongModel = mutableManifestV1(readerPreviewManifestV1());
    wrongModel.resolvedReaderDocument.placements[0]!.experiment.modelRef =
      "another-model@1:sha256:" + "a".repeat(64);
    expect(() =>
      resolveStudioReaderPreviewRuntimeBindingV1(
        wrongModel as unknown as ReaderPreviewManifestV1,
      )
    ).toThrow(/model identity does not match/);

    const wrongQualification = mutableManifestV1(readerPreviewManifestV1());
    wrongQualification.runtimeBindings[
      SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_SCENARIO_ID_V1
    ]!.qualification = "publication-certified";
    expect(() =>
      resolveStudioReaderPreviewRuntimeBindingV1(
        wrongQualification as unknown as ReaderPreviewManifestV1,
      )
    ).toThrow(/not qualified for an uncertified preview/);
  });
});

function readerPreviewManifestV1(): ReaderPreviewManifestV1 {
  const application = new StudioAuthorPreviewApplicationV1({
    initialDraft: SCIENTIFIC_PRODUCT_SAMPLE_AFTERLOAD_AUTHOR_DRAFT_V1,
    idFactory: () => "reader-binding-test",
  });
  return application.materializePreview({ expectedRevision: 0 });
}

function mutableManifestV1(
  manifest: ReaderPreviewManifestV1,
): {
  resolvedReaderDocument: {
    placements: Array<{
      experiment: {
        modelRef: string;
      };
    }>;
  };
  runtimeBindings: Record<
    string,
    {
      qualification: string;
    }
  >;
} {
  return JSON.parse(JSON.stringify(manifest)) as {
    resolvedReaderDocument: {
      placements: Array<{
        experiment: {
          modelRef: string;
        };
      }>;
    };
    runtimeBindings: Record<
      string,
      {
        qualification: string;
      }
    >;
  };
}

async function readerRuntimeFixtureV1(): Promise<Readonly<{
  runtime: ScientificProductReaderRuntimePortV1;
  commitControlValue: ReturnType<typeof vi.fn>;
  resumeLive: ReturnType<typeof vi.fn>;
  resetToSource: ReturnType<typeof vi.fn>;
  seedFrame: MainWireScientificObservableFrameV1;
  currentFrame: MainWireScientificObservableFrameV1;
  publish: (
    frames: readonly MainWireScientificObservableFrameV1[],
    options?: Readonly<{
      phase?: ScientificWorkbenchResearchControlSnapshotInputV0["phase"];
      errorMessage?: string | null;
    }>,
  ) => void;
}>> {
  const targetState =
    await createMainWireScientificResearchControlBaselineTargetStateV0();
  const seedFrame = observableFrameV1(0, 1, {
    [AO_PRESSURE_SIGNAL_ID_V1]: 90,
    [LV_VOLUME_SIGNAL_ID_V1]: 120,
  });
  const currentFrame = observableFrameV1(1, 2, {
    [AO_PRESSURE_SIGNAL_ID_V1]: 92,
  });
  const source = Object.freeze({
    sessionId: SCENARIO_ID_V1,
    context: Object.freeze({
      stateIdentity: Object.freeze({
        revision: 1,
        acceptedTimeSec: 0,
        totalBloodVolumeMl: 5_000,
      }),
      controlState: targetState,
      parameterEpoch: 0,
    }),
    frames: Object.freeze([seedFrame]),
  });
  const store = createScientificWorkbenchResearchControlStoreV0(
    source,
    Number.MAX_SAFE_INTEGER,
  );
  const ownerToken = Symbol("reader-facade-test-owner");
  const commitControlValue = vi.fn();
  const resumeLive = vi.fn();
  const resetToSource = vi.fn();
  const noOp = () => undefined;
  const actionRef: ScientificWorkbenchResearchControlOwnerActionRefV0 = {
    current: Object.freeze({
      setControlValue: noOp,
      commitControlValue,
      setSystemicScale: noOp,
      setPulmonaryScale: noOp,
      commitSystemicScale: noOp,
      commitPulmonaryScale: noOp,
      setMode: noOp,
      applyTransition: noOp,
      cancelSteady: noOp,
      pauseLive: noOp,
      resumeLive,
      resetLiveOrFailure: noOp,
    }),
  };
  store.connectOwner(ownerToken, actionRef);

  const publish = (
    frames: readonly MainWireScientificObservableFrameV1[],
    options: Readonly<{
      phase?: ScientificWorkbenchResearchControlSnapshotInputV0["phase"];
      errorMessage?: string | null;
    }> = {},
  ): void => publishFramesV1(
    store,
    ownerToken,
    frames,
    options,
  );
  publish([seedFrame, currentFrame]);
  const workspaceDocument = Object.freeze({
    content: Object.freeze({
      panels: Object.freeze([
        Object.freeze({
          view: Object.freeze({
            kind: "pressure-volume" as const,
            trajectories: Object.freeze([
              Object.freeze({
                trajectoryId: "lv-primary",
                label: "Primary LV trajectory",
                volumeObservableId: "hemodynamics.volume.LV" as const,
                pressureObservableId:
                  "hemodynamics.pressure.absolute.LV" as const,
              }),
            ]),
          }),
        }),
      ]),
    }),
  }) as unknown as ScientificProductReaderRuntimePortV1["workspaceDocument"];

  return Object.freeze({
    runtime: Object.freeze({
      scenarioId: SCENARIO_ID_V1,
      workspaceDocument,
      controlStore: store,
      controller: Object.freeze({
        status: Object.freeze({
          targetGeneration: 3,
          presentationRevision: 1,
          livePlayback: "running" as const,
          strictPhase: "running" as const,
          strictCandidateAvailable: false,
          strictCandidatePinned: false,
          pinnedRunCount: 0,
          promotionInFlight: false,
          pinInFlight: false,
          lastActionError: null,
          lastFailure: null,
        }),
      }),
    }),
    commitControlValue,
    resumeLive,
    resetToSource,
    seedFrame,
    currentFrame,
    publish,
  });
}

function publishFramesV1(
  store: ScientificWorkbenchResearchControlStoreV0,
  ownerToken: symbol,
  frames: readonly MainWireScientificObservableFrameV1[],
  options: Readonly<{
    phase?: ScientificWorkbenchResearchControlSnapshotInputV0["phase"];
    errorMessage?: string | null;
  }>,
): void {
  const current = store.getSnapshot();
  const input: ScientificWorkbenchResearchControlSnapshotInputV0 =
    Object.freeze({
      phase: options.phase ?? "live-running",
      mode: current.mode,
      source: current.source,
      candidate: null,
      frames: Object.freeze([...frames]),
      targetControlStateSha256: current.targetControlStateSha256,
      liveTransitionOriginAcceptedTimeSec: 0,
      inFlight: false,
      periodicStatus: "automatic-strict-running",
      completedBeatCount: 0,
      capturedStepCount: Math.max(0, frames.length - 1),
      sourceRetirementPending: false,
      remainingRegularRequestCount: Number.MAX_SAFE_INTEGER,
      message: options.errorMessage === undefined
        ? "Reader runtime is active."
        : "Reader runtime stopped.",
      errorMessage: options.errorMessage ?? null,
      draft: current.draft,
      busy: false,
      noChange: true,
      steadyActive: false,
      liveActive: true,
      requestCapacityExhausted: false,
      provenance: Object.freeze({
        ...current.provenance,
        displayedEvidence: "open-transient-no-periodic-claim",
      }),
    });
  store.publishOwnerSnapshot(ownerToken, input);
}

function observableFrameV1(
  acceptedTimeSec: number,
  sequence: number,
  values: Readonly<Record<string, number>>,
): MainWireScientificObservableFrameV1 {
  return projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
    point: Object.freeze({
      sequence,
      simulationTimeSec: acceptedTimeSec,
      phase01: null,
      values,
    }),
    releaseRef: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_RELEASE_REF_V0,
  });
}

function readerBriefV1(): ReaderBriefV1 {
  return Object.freeze({
    schemaId: STUDIO_READER_BRIEF_V1_SCHEMA_ID,
    briefId: "reader-brief/systemic-afterload",
    extent: "inflow",
    graphPanes: Object.freeze([
      Object.freeze({
        schemaId: STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
        paneId: "reader-brief/systemic-afterload/waveform",
        title: "Aortic pressure",
        kind: "waveform",
        scenarios: Object.freeze([
          Object.freeze({
            scenarioId: SCENARIO_ID_V1,
            label: "Reader scenario",
            color: "#38bdf8",
            items: Object.freeze([
              Object.freeze({
                itemId: AO_PRESSURE_SIGNAL_ID_V1,
                label: "Aortic pressure",
                unit: "mmHg",
                color: "#38bdf8",
              }),
            ]),
          }),
        ]),
        presentation: Object.freeze({
          showLegend: true,
          legendPosition: Object.freeze({ xPct: 0.65, yPct: 0.05 }),
          showGuides: false,
          timeWindowMs: 5_000,
          pvBeatHistoryCount: null,
          pvBeatHistoryMode: null,
          pvParameterHistoryCount: null,
          pvRelationDisplayMode: null,
          pvRelationPressureBasis: null,
          pvRelationShowSamplePoints: null,
          hemodynamicDetailMode: null,
          hemodynamicParameterHistoryCount: null,
          hemodynamicAllowNegativeFillingPressure: null,
        }),
      }),
    ]),
    instantaneousReadbacks: Object.freeze([
      Object.freeze({
        readbackId: "readback/lv-volume",
        signalId: LV_VOLUME_SIGNAL_ID_V1,
        label: "LV volume",
        unit: "mL",
        sampling: "instantaneous",
      }),
    ]),
    controls: Object.freeze([
      Object.freeze({
        controlId: "control/systemic-afterload",
        label: "Systemic resistance",
        unit: "× baseline",
        allowedValues: Object.freeze([1, 1.5, 2]),
        initialValue: 1,
        binding: Object.freeze({
          parameterKey: SYSTEMIC_PARAMETER_KEY_V1,
          readbackSignalId: AO_PRESSURE_SIGNAL_ID_V1,
          target: Object.freeze({
            scenarioIds: Object.freeze([SCENARIO_ID_V1]),
            application: "absolute",
          }),
        }),
      }),
    ]),
  });
}

function withControlTargetV1(
  brief: ReaderBriefV1,
  scenarioIds: readonly string[],
): ReaderBriefV1 {
  const control = brief.controls[0]!;
  return Object.freeze({
    ...brief,
    controls: Object.freeze([
      Object.freeze({
        ...control,
        binding: Object.freeze({
          ...control.binding,
          target: Object.freeze({
            ...control.binding.target,
            scenarioIds: Object.freeze([...scenarioIds]),
          }),
        }),
      }),
    ]),
  });
}

function withParameterKeyV1(
  brief: ReaderBriefV1,
  parameterKey: string,
): ReaderBriefV1 {
  const control = brief.controls[0]!;
  return Object.freeze({
    ...brief,
    controls: Object.freeze([
      Object.freeze({
        ...control,
        binding: Object.freeze({
          ...control.binding,
          parameterKey,
        }),
      }),
    ]),
  });
}

function withControlV1(
  brief: ReaderBriefV1,
  input: Readonly<{
    parameterKey: string;
    initialValue: number;
    allowedValues: readonly number[];
  }>,
): ReaderBriefV1 {
  const control = brief.controls[0]!;
  return Object.freeze({
    ...brief,
    controls: Object.freeze([
      Object.freeze({
        ...control,
        initialValue: input.initialValue,
        allowedValues: Object.freeze([...input.allowedValues]),
        binding: Object.freeze({
          ...control.binding,
          parameterKey: input.parameterKey,
        }),
      }),
    ]),
  });
}

function withPvLoopItemV1(
  brief: ReaderBriefV1,
  itemId: string,
): ReaderBriefV1 {
  const pane: StudioGraphPaneSpecV1 = Object.freeze({
    schemaId: STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
    paneId: "reader-brief/systemic-afterload/pv-loop",
    title: "Pressure–volume loop",
    kind: "pv-loop",
    scenarios: Object.freeze([
      Object.freeze({
        scenarioId: SCENARIO_ID_V1,
        label: "Reader scenario",
        color: "#38bdf8",
        items: Object.freeze([
          Object.freeze({
            itemId,
            label: `${itemId} pressure–volume loop`,
            unit: null,
            color: "#38bdf8",
          }),
        ]),
      }),
    ]),
    presentation: Object.freeze({
      showLegend: true,
      legendPosition: null,
      showGuides: true,
      timeWindowMs: null,
      pvBeatHistoryCount: 8,
      pvBeatHistoryMode: "fade",
      pvParameterHistoryCount: 6,
      pvRelationDisplayMode: "off",
      pvRelationPressureBasis: "intracavitary",
      pvRelationShowSamplePoints: false,
      hemodynamicDetailMode: null,
      hemodynamicParameterHistoryCount: null,
      hemodynamicAllowNegativeFillingPressure: null,
    }),
  });
  return Object.freeze({
    ...brief,
    graphPanes: Object.freeze([...brief.graphPanes, pane]),
  });
}
