import React from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  Copy,
  FlaskConical,
  ShieldCheck,
  X,
} from "lucide-react";

import type { ModelContractV2 } from "@/studio/contracts/v2/model";

export type WorkbenchModelOptionV3 = Readonly<{
  contract: ModelContractV2;
  shortLabel: string;
}>;

export function WorkbenchModelMenuV3({
  currentModelId,
  models,
  onOpenDisclosure,
  onSelectModel,
  strings,
}: Readonly<{
  currentModelId: string;
  models: readonly WorkbenchModelOptionV3[];
  onOpenDisclosure: () => void;
  onSelectModel?: (modelId: string) => void;
  strings: Readonly<{
    chooseModel: string;
    close: string;
    copyModelId: string;
    copied: string;
    details: string;
    exactModelId: string;
    fixtureSchema: string;
    checkpointCodec: string;
    snapshotGate: string;
    validationAndLimitations: string;
  }>;
}>) {
  const current = models.find(({ contract }) =>
    contract.modelId === currentModelId) ?? models[0];
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const dialogRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])",
      );
      if (focusable === undefined || focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      (previous ?? triggerRef.current)?.focus();
    };
  }, [open]);

  if (current === undefined) return null;

  const dialog = open && typeof document !== "undefined"
    ? createPortal(
      <div
        className="fixed inset-0 z-[85] flex items-end justify-center bg-black/20 sm:items-start sm:justify-end sm:bg-transparent sm:p-3"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="workbench-model-menu-title-v3"
          className="workbench-sheet-enter max-h-[82dvh] w-full overflow-y-auto rounded-t-2xl bg-wb-panel px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:mt-11 sm:w-[360px] sm:rounded-xl sm:border sm:border-wb-line sm:p-4"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-wb-subtle">
                {strings.details}
              </p>
              <h2
                id="workbench-model-menu-title-v3"
                className="mt-1 truncate text-sm font-semibold text-wb-text"
              >
                {current.contract.displayName}
              </h2>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              aria-label={strings.close}
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 rounded-lg bg-wb-soft px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-wb-text">
                  {current.shortLabel}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-wb-muted">
                  {current.contract.displayName}
                </p>
              </div>
            </div>
          </div>

          {models.length > 1 && (
            <div className="mt-2 grid gap-1" aria-label={strings.chooseModel}>
              {models.filter(({ contract }) =>
                contract.modelId !== currentModelId).map((option) => (
                <button
                  key={option.contract.modelId}
                  type="button"
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-left hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                  onClick={() => {
                    setOpen(false);
                    onSelectModel?.(option.contract.modelId);
                  }}
                >
                  <span className="h-2 w-2 rounded-full bg-wb-subtle" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-wb-text">
                      {option.shortLabel}
                    </span>
                    <span className="block truncate text-[10px] text-wb-muted">
                      {option.contract.displayName}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <dl className="mt-4 grid gap-2 text-[11px]">
            <TechnicalRowV3
              label={strings.exactModelId}
              value={current.contract.modelId}
              action={(
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                  aria-label={copied ? strings.copied : strings.copyModelId}
                  title={copied ? strings.copied : strings.copyModelId}
                  onClick={() => {
                    void navigator.clipboard?.writeText(current.contract.modelId)
                      .then(() => {
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1_500);
                      });
                  }}
                >
                  {copied
                    ? <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              )}
            />
            <TechnicalRowV3
              label={strings.fixtureSchema}
              value={current.contract.fixtureSchemaId}
            />
            <TechnicalRowV3
              label={strings.checkpointCodec}
              value={current.contract.checkpointCodecId}
            />
            <TechnicalRowV3
              label={strings.snapshotGate}
              value={current.contract.snapshotGateId}
            />
          </dl>

          <button
            type="button"
            className="mt-4 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-semibold text-wb-text hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            onClick={() => {
              setOpen(false);
              onOpenDisclosure();
            }}
          >
            <ShieldCheck className="h-4 w-4 text-wb-accent" aria-hidden="true" />
            {strings.validationAndLimitations}
          </button>
        </section>
      </div>,
      document.body,
    )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex min-h-9 max-w-[11rem] items-center gap-2 rounded-lg px-2 text-xs font-semibold text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:max-w-[15rem]"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        data-testid="workbench-model-menu-trigger-v3"
      >
        <FlaskConical className="h-3.5 w-3.5 shrink-0 text-wb-accent" aria-hidden="true" />
        <span className="truncate">{current.shortLabel}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-wb-subtle" aria-hidden="true" />
      </button>
      {dialog}
    </>
  );
}

function TechnicalRowV3({
  action,
  label,
  value,
}: Readonly<{
  action?: React.ReactNode;
  label: string;
  value: string;
}>) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)_auto] items-center gap-2 py-1">
      <dt className="text-wb-subtle">{label}</dt>
      <dd className="truncate font-mono text-[9px] text-wb-muted" title={value}>
        {value}
      </dd>
      {action ?? <span />}
    </div>
  );
}
