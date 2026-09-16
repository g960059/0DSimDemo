/** Keep viewport selection independent of the numerical Reader bundle. */
export function articleReaderPlacementAfterViewportExitV3(
  activePlacementId: string | null,
  exitedPlacementId: string,
  remainingVisiblePlacementIds: readonly string[] = [],
): string | null {
  return activePlacementId === exitedPlacementId ? remainingVisiblePlacementIds.at(-1) ?? null : activePlacementId;
}
