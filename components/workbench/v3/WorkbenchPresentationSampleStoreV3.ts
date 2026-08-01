import React from "react";

import {
  appendWorkbenchPresentationSamplesV3,
  type WorkbenchPresentationBufferOptionsV3,
} from "./WorkbenchPresentationSampleBufferV3";
import type { WorkbenchScalarSampleV3 } from "./WorkbenchScalarSampleV3";

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
