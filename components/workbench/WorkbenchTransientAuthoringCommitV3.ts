/**
 * Persists a result produced by an already-terminated authoring Worker.
 *
 * Unlike the removed single-Worker rollback path, failure has no runtime
 * cleanup callback: the independent live Scenario lanes remain the exact
 * unsaved authority and can retry against the unchanged durable version.
 */
export function commitWorkbenchTransientAuthoringResultV3<T>(input: Readonly<{
  persist(): T;
  adoptDurable(value: T): void;
}>): T {
  const durable = input.persist();
  input.adoptDurable(durable);
  return durable;
}
