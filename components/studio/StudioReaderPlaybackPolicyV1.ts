import * as React from "react";

import { useDocumentVisible } from "@/hooks/useOnscreen";

/**
 * Which placements are worth a numerical session, and which one is being read.
 *
 * Reading is a single-focus activity, so at most one experiment integrates at
 * a time: 1x physiological playback only means anything to someone looking at
 * it, and binding "everything visible" makes the cost of an article grow with
 * its length. A suspended placement is not frozen — it keeps showing its
 * validated cycle — so handing the live lane to the experiment under the
 * reader's eye costs the others nothing.
 */
export type StudioReaderPlaybackV1 = Readonly<{
  /** Close enough to the reader to be worth allocating a session. */
  bound: boolean;
  /** The single placement the reader is actually reading. */
  live: boolean;
}>;

/** How far ahead of the viewport a placement starts warming its session. */
const BIND_MARGIN_PX_V1 = 800;
/** Visible fraction that makes a placement a candidate for the live lane. */
const PROMOTE_RATIO_V1 = 0.4;
/**
 * A candidate must hold still before it takes the lane, and a placement keeps
 * it for a while after leaving. Without both, a single flick of the wheel
 * starts and stops several sessions, and every start pays the canonical
 * one-point paint boundary again.
 */
const PROMOTE_DWELL_MS_V1 = 300;
const DEMOTE_GRACE_MS_V1 = 2_500;

export type StudioReaderPlaybackPolicyV1 = Readonly<{
  observe(placementBlockId: string): (element: HTMLElement | null) => void;
  playbackFor(placementBlockId: string): StudioReaderPlaybackV1;
}>;

export function useStudioReaderPlaybackPolicyV1(
  options: Readonly<{
    /** Composing is writing, not watching: nothing takes the live lane. */
    autoLive: boolean;
    /** Placements whose author asked for live; others never auto-play. */
    autoLivePlacementIds: ReadonlySet<string>;
  }>,
): StudioReaderPlaybackPolicyV1 {
  const { autoLive, autoLivePlacementIds } = options;
  const documentVisible = useDocumentVisible();
  const [bound, setBound] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [focused, setFocused] = React.useState<string | null>(null);

  const elementsRef = React.useRef(new Map<string, HTMLElement>());
  const ratiosRef = React.useRef(new Map<string, number>());
  const centerOffsetsRef = React.useRef(new Map<string, number>());
  const focusedRef = React.useRef<string | null>(null);
  focusedRef.current = focused;
  const pendingRef = React.useRef<Readonly<{
    target: string | null;
    timer: ReturnType<typeof setTimeout>;
  }> | null>(null);
  const autoLivePlacementIdsRef = React.useRef(autoLivePlacementIds);
  autoLivePlacementIdsRef.current = autoLivePlacementIds;

  const observersRef = React.useRef<Readonly<{
    bindObserver: IntersectionObserver;
    focusObserver: IntersectionObserver;
  }> | null>(null);

  const settleFocusV1 = React.useCallback(() => {
    let candidate: string | null = null;
    let bestOffset = Number.POSITIVE_INFINITY;
    for (const [placementBlockId, ratio] of ratiosRef.current) {
      if (ratio < PROMOTE_RATIO_V1) continue;
      if (!autoLivePlacementIdsRef.current.has(placementBlockId)) continue;
      const offset = centerOffsetsRef.current.get(placementBlockId)
        ?? Number.POSITIVE_INFINITY;
      if (offset < bestOffset) {
        bestOffset = offset;
        candidate = placementBlockId;
      }
    }
    const current = focusedRef.current;
    if (candidate === current) {
      // Still the one being read: cancel a demotion that had been scheduled.
      if (pendingRef.current !== null) {
        clearTimeout(pendingRef.current.timer);
        pendingRef.current = null;
      }
      return;
    }
    if (pendingRef.current?.target === candidate) return;
    if (pendingRef.current !== null) clearTimeout(pendingRef.current.timer);
    const delay = candidate === null
      ? DEMOTE_GRACE_MS_V1
      : PROMOTE_DWELL_MS_V1;
    pendingRef.current = Object.freeze({
      target: candidate,
      timer: setTimeout(() => {
        pendingRef.current = null;
        setFocused(candidate);
      }, delay),
    });
  }, []);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      // Without an observer every placement is treated as reachable, which
      // keeps the surface usable rather than silently never binding.
      setBound(new Set(elementsRef.current.keys()));
      return undefined;
    }
    const idFor = (element: Element): string | null => {
      for (const [placementBlockId, candidate] of elementsRef.current) {
        if (candidate === element) return placementBlockId;
      }
      return null;
    };

    const bindObserver = new IntersectionObserver((entries) => {
      setBound((current) => {
        const next = new Set(current);
        let changed = false;
        for (const entry of entries) {
          const placementBlockId = idFor(entry.target);
          if (placementBlockId === null) continue;
          // Leaving only gives the session back; it does not throw it away.
          // The owner keeps a released session warm until the session limit
          // needs the room, so scrolling away and returning is free.
          const has = next.has(placementBlockId);
          if (entry.isIntersecting === has) continue;
          if (entry.isIntersecting) next.add(placementBlockId);
          else next.delete(placementBlockId);
          changed = true;
        }
        return changed ? next : current;
      });
    }, { rootMargin: `${BIND_MARGIN_PX_V1}px 0px`, threshold: 0 });

    const focusObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const placementBlockId = idFor(entry.target);
        if (placementBlockId === null) continue;
        ratiosRef.current.set(placementBlockId, entry.intersectionRatio);
        const root = entry.rootBounds;
        const box = entry.boundingClientRect;
        centerOffsetsRef.current.set(
          placementBlockId,
          root === null
            ? Number.POSITIVE_INFINITY
            : Math.abs(
              (box.top + box.height / 2) - (root.top + root.height / 2),
            ),
        );
      }
      settleFocusV1();
    }, { threshold: [0, 0.2, PROMOTE_RATIO_V1, 0.75, 1] });

    for (const element of elementsRef.current.values()) {
      bindObserver.observe(element);
      focusObserver.observe(element);
    }
    observersRef.current = { bindObserver, focusObserver };
    return () => {
      observersRef.current = null;
      bindObserver.disconnect();
      focusObserver.disconnect();
      if (pendingRef.current !== null) {
        clearTimeout(pendingRef.current.timer);
        pendingRef.current = null;
      }
    };
  }, [settleFocusV1]);

  // A ref callback with a new identity on every render would detach and
  // reattach the element each time, which the observers would see as the
  // placement leaving and returning.
  const observeCallbacksRef = React.useRef(
    new Map<string, (element: HTMLElement | null) => void>(),
  );
  const observe = React.useCallback((placementBlockId: string) => {
    const cached = observeCallbacksRef.current.get(placementBlockId);
    if (cached !== undefined) return cached;
    const callback = (element: HTMLElement | null) => {
      const elements = elementsRef.current;
      const previous = elements.get(placementBlockId);
      if (previous === element) return;
      const observers = observersRef.current;
      if (previous !== undefined) {
        observers?.bindObserver.unobserve(previous);
        observers?.focusObserver.unobserve(previous);
      }
      if (element === null) {
        elements.delete(placementBlockId);
        ratiosRef.current.delete(placementBlockId);
        centerOffsetsRef.current.delete(placementBlockId);
        return;
      }
      elements.set(placementBlockId, element);
      if (observers === null) {
        // Mounted before the observers exist; the effect observes it.
        return;
      }
      observers.bindObserver.observe(element);
      observers.focusObserver.observe(element);
    };
    observeCallbacksRef.current.set(placementBlockId, callback);
    return callback;
  }, []);

  React.useEffect(() => {
    // The author's declaration outranks the viewport: a placement that opted
    // out of in-flow playback never takes the lane by being looked at.
    if (focused !== null && !autoLivePlacementIds.has(focused)) {
      setFocused(null);
    }
  }, [autoLivePlacementIds, focused]);

  const playbackFor = React.useCallback((
    placementBlockId: string,
  ): StudioReaderPlaybackV1 =>
    Object.freeze({
      bound: bound.has(placementBlockId),
      live: autoLive
        && documentVisible
        && focused === placementBlockId
        && autoLivePlacementIds.has(placementBlockId),
    }), [autoLive, autoLivePlacementIds, bound, documentVisible, focused]);

  return React.useMemo(
    () => Object.freeze({ observe, playbackFor }),
    [observe, playbackFor],
  );
}
