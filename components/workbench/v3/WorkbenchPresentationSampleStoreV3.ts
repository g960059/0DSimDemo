import React from "react";

import {
  appendWorkbenchPresentationSamplesV3,
  type WorkbenchPresentationBufferOptionsV3,
} from "./WorkbenchPresentationSampleBufferV3";
import type { WorkbenchScalarSampleV3 } from "./WorkbenchScalarSampleV3";

const EMPTY_WORKBENCH_PRESENTATION_SAMPLES_V3:
  readonly WorkbenchScalarSampleV3[] = Object.freeze([]);

export type WorkbenchScenarioPresentationSamplesV3 = Readonly<
  Record<string, readonly WorkbenchScalarSampleV3[]>
>;

/**
 * Chart-local external store. Live sample delivery invalidates only mounted
 * (therefore Dockview-visible) graph panes instead of the entire Workbench and
 * Scenario inspector tree.
 */
export class WorkbenchPresentationSampleStoreV3 {
  readonly #options: WorkbenchPresentationBufferOptionsV3;
  readonly #listeners = new Set<() => void>();
  #samples: readonly WorkbenchScalarSampleV3[] = Object.freeze([]);

  constructor(options: WorkbenchPresentationBufferOptionsV3 = {}) {
    this.#options = Object.freeze({ ...options });
  }

  readonly getSnapshot = (): readonly WorkbenchScalarSampleV3[] =>
    this.#samples;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  append(samples: readonly WorkbenchScalarSampleV3[]): void {
    if (samples.length === 0) return;
    this.#samples = appendWorkbenchPresentationSamplesV3(
      this.#samples,
      samples,
      this.#options,
    );
    this.#notify();
  }

  reset(): void {
    if (this.#samples.length === 0) return;
    this.#samples = Object.freeze([]);
    this.#notify();
  }

  get subscriberCount(): number {
    return this.#listeners.size;
  }

  #notify(): void {
    for (const listener of this.#listeners) listener();
  }
}

export function useWorkbenchPresentationSamplesV3(
  store: WorkbenchPresentationSampleStoreV3,
): readonly WorkbenchScalarSampleV3[] {
  return React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}

/**
 * Presentation-only cache for every Scenario currently available to graph
 * panes. Each Scenario owns an independently bounded sample window. The cache
 * never changes the exact accepted sample selected as a bucket terminal state
 * and is not a checkpoint, metric, or scientific evidence source.
 */
export class WorkbenchScenarioPresentationSampleStoreV3 {
  readonly #options: WorkbenchPresentationBufferOptionsV3;
  readonly #listeners = new Set<() => void>();
  #samplesByScenarioId: WorkbenchScenarioPresentationSamplesV3 =
    emptyScenarioPresentationSnapshotV3();

  constructor(options: WorkbenchPresentationBufferOptionsV3 = {}) {
    this.#options = Object.freeze({ ...options });
  }

  readonly getSnapshot = (): WorkbenchScenarioPresentationSamplesV3 =>
    this.#samplesByScenarioId;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  getScenarioSnapshot(
    scenarioId: string,
  ): readonly WorkbenchScalarSampleV3[] {
    return this.#samplesByScenarioId[scenarioId]
      ?? EMPTY_WORKBENCH_PRESENTATION_SAMPLES_V3;
  }

  append(
    scenarioId: string,
    samples: readonly WorkbenchScalarSampleV3[],
  ): void {
    if (samples.length === 0) return;
    const current = this.getScenarioSnapshot(scenarioId);
    const next = appendWorkbenchPresentationSamplesV3(
      current,
      samples,
      this.#options,
    );
    this.#replaceScenario(scenarioId, next);
  }

  /** Clears one Scenario while retaining its identity in the cache map. */
  resetScenario(scenarioId: string): boolean {
    if (!hasOwnScenarioV3(this.#samplesByScenarioId, scenarioId)) return false;
    if (this.#samplesByScenarioId[scenarioId]?.length === 0) return true;
    this.#replaceScenario(
      scenarioId,
      EMPTY_WORKBENCH_PRESENTATION_SAMPLES_V3,
    );
    return true;
  }

  reset(): void {
    if (this.scenarioCount === 0) return;
    this.#samplesByScenarioId = emptyScenarioPresentationSnapshotV3();
    this.#notify();
  }

  removeScenario(scenarioId: string): boolean {
    if (!hasOwnScenarioV3(this.#samplesByScenarioId, scenarioId)) return false;
    const next = createScenarioPresentationSnapshotV3(
      this.#samplesByScenarioId,
    );
    delete next[scenarioId];
    this.#samplesByScenarioId = Object.freeze(next);
    this.#notify();
    return true;
  }

  /**
   * Clones an immutable presentation window for an immediately useful visual
   * duplicate. Later appends replace only the target array, so source and
   * target cannot mutate one another.
   */
  cloneScenario(sourceScenarioId: string, targetScenarioId: string): boolean {
    const source = this.#samplesByScenarioId[sourceScenarioId];
    if (source === undefined) return false;
    if (
      sourceScenarioId === targetScenarioId
      || this.#samplesByScenarioId[targetScenarioId] === source
    ) return true;
    this.#replaceScenario(targetScenarioId, source);
    return true;
  }

  get scenarioCount(): number {
    return Object.keys(this.#samplesByScenarioId).length;
  }

  get subscriberCount(): number {
    return this.#listeners.size;
  }

  #replaceScenario(
    scenarioId: string,
    samples: readonly WorkbenchScalarSampleV3[],
  ): void {
    const next = createScenarioPresentationSnapshotV3(
      this.#samplesByScenarioId,
    );
    next[scenarioId] = samples;
    this.#samplesByScenarioId = Object.freeze(next);
    this.#notify();
  }

  #notify(): void {
    for (const listener of this.#listeners) listener();
  }
}

export function useWorkbenchScenarioPresentationSamplesV3(
  store: WorkbenchScenarioPresentationSampleStoreV3,
): WorkbenchScenarioPresentationSamplesV3 {
  return React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}

function emptyScenarioPresentationSnapshotV3():
  WorkbenchScenarioPresentationSamplesV3 {
  return Object.freeze(Object.create(null)) as
    WorkbenchScenarioPresentationSamplesV3;
}

function createScenarioPresentationSnapshotV3(
  current: WorkbenchScenarioPresentationSamplesV3,
): Record<string, readonly WorkbenchScalarSampleV3[]> {
  return Object.assign(Object.create(null), current) as
    Record<string, readonly WorkbenchScalarSampleV3[]>;
}

function hasOwnScenarioV3(
  snapshot: WorkbenchScenarioPresentationSamplesV3,
  scenarioId: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(snapshot, scenarioId);
}
