import React from "react";
import { createPortal } from "react-dom";

/** Shared pointer/keyboard tooltip, with an accessible name even on touch screens. */
export function SimulationIconButtonV3({ label, children, className = "", buttonRef, ...props }:
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> & { label: string; buttonRef?: React.RefObject<HTMLButtonElement | null> }) {
  const id = React.useId();
  const ref = React.useRef<HTMLButtonElement>(null);
  const [position, setPosition] = React.useState<{ left: number; top: number } | null>(null);
  React.useEffect(() => {
    if (!position) return;
    const hide = () => setPosition(null);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") hide(); };
    // A tooltip belongs to its control, not to the viewport position it once occupied.
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    window.addEventListener("pointerdown", hide, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      window.removeEventListener("pointerdown", hide, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [position]);
  const show = () => {
    const box = ref.current?.getBoundingClientRect();
    if (box) setPosition({ left: Math.min(window.innerWidth - 140, Math.max(140, box.left + box.width / 2)), top: box.bottom + 8 });
  };
  return <>
    <button {...props} ref={node => { ref.current = node; if (buttonRef) buttonRef.current = node; }} type="button" aria-label={label}
      aria-describedby={position ? id : undefined}
      className={`reader-icon-button inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:opacity-40 ${className}`}
      onPointerEnter={e => { if (e.pointerType === "mouse") show(); }}
      onPointerLeave={() => setPosition(null)}
      onFocus={e => { if (e.currentTarget.matches(":focus-visible")) show(); }}
      onBlur={() => setPosition(null)}
      onClick={e => { setPosition(null); props.onClick?.(e); }}>
      {children}
    </button>
    {position && typeof document !== "undefined" && createPortal(
      <span id={id} role="tooltip" className="reader-action-tooltip pointer-events-none fixed z-[150] max-w-64 -translate-x-1/2 rounded-md bg-wb-panel px-2.5 py-1.5 text-xs text-wb-text shadow-lg ring-1 ring-wb-line"
        style={position}>{label}</span>, document.body)}
  </>;
}
