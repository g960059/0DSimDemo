import React from "react";

/**
 * Protects authored browser state at the boundaries available to the current
 * BrowserRouter shell. The native beforeunload prompt covers reload/close;
 * the capture listener covers ordinary Link/anchor navigation before React
 * Router consumes the click.
 *
 * A backend-backed data router may later replace this with a route blocker,
 * but callers should keep deriving `enabled` from semantic unsaved state rather
 * than from whether a resource happens to exist.
 */
export function useUnsavedChangesGuardV3(input: Readonly<{
  enabled: boolean;
  message: string;
  onConfirmedDiscard?: () => void;
}>): void {
  const { enabled, message, onConfirmedDiscard } = input;

  React.useEffect(() => {
    if (!enabled) return undefined;
    const confirmBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", confirmBeforeUnload);
    return () => window.removeEventListener(
      "beforeunload",
      confirmBeforeUnload,
    );
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled) return undefined;
    const confirmAnchorNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (
        anchor === null
        || anchor.hasAttribute("download")
        || (anchor.target !== "" && anchor.target !== "_self")
      ) return;
      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (
        destination.origin === current.origin
        && destination.pathname === current.pathname
        && destination.search === current.search
      ) return;
      if (window.confirm(message)) {
        onConfirmedDiscard?.();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    document.addEventListener("click", confirmAnchorNavigation, true);
    return () => document.removeEventListener(
      "click",
      confirmAnchorNavigation,
      true,
    );
  }, [enabled, message, onConfirmedDiscard]);
}
