import * as React from "react";

/**
 * Reordering blocks by dragging their handle.
 *
 * Pointer events rather than HTML5 drag-and-drop: the article is one long
 * contenteditable surface, and native dragging would compete with selecting
 * and moving text. A drag starts only from the handle, so nothing else on the
 * page changes meaning while composing.
 *
 * Nothing moves until the pointer is released. Reordering under the pointer
 * would move the handle out from under the finger holding it, and an
 * experiment block would be re-laid-out — and re-measured by the playback
 * policy — on every frame of the drag.
 */
export type StudioBlockDragStateV1 = Readonly<{
  /** The block being carried, or null when no drag is in progress. */
  blockId: string | null;
  /** Index the block would land at, or null when it would not move. */
  dropIndex: number | null;
  /** True once the pointer has travelled far enough to be a drag. */
  active: boolean;
}>;

/** Pointer travel that separates a click on the handle from a drag. */
const DRAG_THRESHOLD_PX_V1 = 4;
/** How close to a scrollport edge the pointer keeps the article moving. */
const AUTOSCROLL_MARGIN_PX_V1 = 72;
const AUTOSCROLL_SPEED_PX_V1 = 14;

export type StudioBlockDragV1 = Readonly<{
  state: StudioBlockDragStateV1;
  registerBlock(blockId: string): (element: HTMLElement | null) => void;
  /**
   * Starts a potential drag. Returns whether it became one, so the handle can
   * fall back to opening its menu when the pointer never travelled.
   */
  startDrag(
    blockId: string,
    index: number,
    event: React.PointerEvent<HTMLElement>,
  ): void;
  /** Keyboard equivalent: pick up, move with arrows, drop with Enter. */
  moveByKeyboard(blockId: string, index: number, direction: -1 | 1): void;
}>;

export function useStudioBlockDragV1(
  input: Readonly<{
    blockIds: readonly string[];
    onDrop(blockId: string, toIndex: number): void;
    onClick(blockId: string): void;
  }>,
): StudioBlockDragV1 {
  const { blockIds, onDrop, onClick } = input;
  const [state, setState] = React.useState<StudioBlockDragStateV1>(
    () => ({ blockId: null, dropIndex: null, active: false }),
  );

  const elementsRef = React.useRef(new Map<string, HTMLElement>());
  const blockIdsRef = React.useRef(blockIds);
  blockIdsRef.current = blockIds;
  const onDropRef = React.useRef(onDrop);
  onDropRef.current = onDrop;
  const onClickRef = React.useRef(onClick);
  onClickRef.current = onClick;

  const registerCallbacksRef = React.useRef(
    new Map<string, (element: HTMLElement | null) => void>(),
  );
  const registerBlock = React.useCallback((blockId: string) => {
    const cached = registerCallbacksRef.current.get(blockId);
    if (cached !== undefined) return cached;
    const callback = (element: HTMLElement | null) => {
      if (element === null) elementsRef.current.delete(blockId);
      else elementsRef.current.set(blockId, element);
    };
    registerCallbacksRef.current.set(blockId, callback);
    return callback;
  }, []);

  /**
   * Where the carried block would land if the pointer were released here.
   *
   * Measured against each block's midpoint, and reported as null when the
   * result would put the block back where it already is — so releasing after
   * a small movement is a no-op rather than a revision.
   */
  const dropIndexAtV1 = React.useCallback((
    blockId: string,
    clientY: number,
  ): number | null => {
    const ids = blockIdsRef.current;
    const from = ids.indexOf(blockId);
    if (from < 0) return null;
    let target = ids.length;
    for (const [index, candidate] of ids.entries()) {
      const element = elementsRef.current.get(candidate);
      if (element === undefined) continue;
      const box = element.getBoundingClientRect();
      if (clientY < box.top + box.height / 2) {
        target = index;
        break;
      }
    }
    // Removing the block first shifts every later boundary up by one.
    const settled = target > from ? target - 1 : target;
    return settled === from ? null : settled;
  }, []);

  const startDrag = React.useCallback((
    blockId: string,
    index: number,
    event: React.PointerEvent<HTMLElement>,
  ) => {
    if (event.button !== 0) return;
    const handle = event.currentTarget;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const scrollport = elementsRef.current.get(blockId)
      ?.closest<HTMLElement>("[data-studio-scrollport]") ?? null;
    let active = false;
    let autoScrollId: number | null = null;
    let pointerY = startY;

    const stopAutoScroll = () => {
      if (autoScrollId === null) return;
      window.cancelAnimationFrame(autoScrollId);
      autoScrollId = null;
    };
    const stepAutoScroll = () => {
      autoScrollId = null;
      if (!active || scrollport === null) return;
      const box = scrollport.getBoundingClientRect();
      const above = pointerY - (box.top + AUTOSCROLL_MARGIN_PX_V1);
      const below = pointerY - (box.bottom - AUTOSCROLL_MARGIN_PX_V1);
      const delta = above < 0
        ? -AUTOSCROLL_SPEED_PX_V1
        : below > 0
        ? AUTOSCROLL_SPEED_PX_V1
        : 0;
      if (delta !== 0) {
        scrollport.scrollBy({ top: delta });
        setState({
          blockId,
          dropIndex: dropIndexAtV1(blockId, pointerY),
          active: true,
        });
      }
      autoScrollId = window.requestAnimationFrame(stepAutoScroll);
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      pointerY = moveEvent.clientY;
      if (
        !active
        && Math.abs(moveEvent.clientY - startY) < DRAG_THRESHOLD_PX_V1
      ) return;
      if (!active) {
        active = true;
        try {
          handle.setPointerCapture(pointerId);
        } catch {
          // Capture is an optimization — it keeps the handle receiving events
          // if the pointer leaves it. The drag is driven from window
          // listeners, so failing to take it must not end the drag.
        }
        if (scrollport !== null) {
          autoScrollId = window.requestAnimationFrame(stepAutoScroll);
        }
      }
      moveEvent.preventDefault();
      setState({
        blockId,
        dropIndex: dropIndexAtV1(blockId, moveEvent.clientY),
        active: true,
      });
    };

    const finish = (dropped: boolean, clientY: number) => {
      stopAutoScroll();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKeyDown, true);
      try {
        if (handle.hasPointerCapture(pointerId)) {
          handle.releasePointerCapture(pointerId);
        }
      } catch {
        // The handle may already be gone; the drag ends either way.
      }
      setState({ blockId: null, dropIndex: null, active: false });
      if (!active) {
        // The pointer never travelled, so the handle was clicked.
        onClickRef.current(blockId);
        return;
      }
      if (!dropped) return;
      const target = dropIndexAtV1(blockId, clientY);
      if (target !== null) onDropRef.current(blockId, target);
    };
    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      finish(true, upEvent.clientY);
    };
    const onCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      finish(false, cancelEvent.clientY);
    };
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== "Escape") return;
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      finish(false, pointerY);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKeyDown, true);
    void index;
  }, [dropIndexAtV1]);

  const moveByKeyboard = React.useCallback((
    blockId: string,
    index: number,
    direction: -1 | 1,
  ) => {
    const target = index + direction;
    if (target < 0 || target >= blockIdsRef.current.length) return;
    onDropRef.current(blockId, target);
  }, []);

  React.useEffect(() => () => {
    setState({ blockId: null, dropIndex: null, active: false });
  }, []);

  return React.useMemo(
    () => Object.freeze({ state, registerBlock, startDrag, moveByKeyboard }),
    [moveByKeyboard, registerBlock, startDrag, state],
  );
}
