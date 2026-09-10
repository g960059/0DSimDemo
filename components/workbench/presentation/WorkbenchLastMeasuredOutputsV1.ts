import type { ExperimentOutputPresentationItemV3 as Item } from "../ExperimentPanePresentationV3";

/** View-only memory. Never supplies a simulation frame, saved capture or analysis. */
export class WorkbenchLastMeasuredOutputsV1 {
  readonly #last = new Map<string, Pick<Item, "value" | "displayValue" | "unit">>();

  project(items: readonly Item[], notice: string): readonly Item[] {
    return items.map(item => {
      if (measured(item)) return item;
      const prior = this.#last.get(item.itemId);
      if (prior === undefined || prior.unit !== item.unit) return item;
      return { ...item, ...prior, displayValue: prior.displayValue, staleNotice: item.qualityNotice
        ? `${notice} ${item.qualityNotice}` : notice };
    });
  }

  /** Commit only after React commits; speculative renders cannot update memory. */
  remember(items: readonly Item[]): void {
    const selected = new Set(items.map(item => item.itemId));
    for (const key of this.#last.keys()) if (!selected.has(key)) this.#last.delete(key);
    for (const item of items) if (measured(item)) this.#last.set(item.itemId, {
      value: item.value, unit: item.unit,
      ...(item.displayValue === undefined ? {} : { displayValue: item.displayValue }),
    });
  }
}

function measured(item: Item): boolean {
  return item.staleNotice === undefined && item.availability === "available"
    && item.quality !== "not-assessed"
    && (item.displayValue !== undefined
      ? item.displayValue.trim().length > 0 && !item.displayValue.includes("—")
      : typeof item.value === "number" && Number.isFinite(item.value));
}
