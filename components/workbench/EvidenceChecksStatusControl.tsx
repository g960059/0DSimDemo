import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleAlert,
  LoaderCircle,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";

export type EvidenceChecksStatus =
  | "idle"
  | "passed"
  | "checking"
  | "findings"
  | "verification-error";

export interface EvidenceChecksScenarioSummary {
  id: string;
  name: string;
  status: EvidenceChecksStatus;
  /** Optional one-line context, for example "2 values outside the reference range". */
  message?: string;
  /** Optional scenario color used elsewhere in the Workbench. */
  color?: string;
}

export interface EvidenceChecksStatusControlProps {
  status?: EvidenceChecksStatus;
  scenarios?: readonly EvidenceChecksScenarioSummary[];
  /** Keeps the compact header wording overridable while defaulting to "Checks". */
  label?: string;
  fullReportHref?: string;
  onOpenFullReport?: () => void;
  fullReportLabel?: string;
  className?: string;
}

interface StatusAppearance {
  icon: LucideIcon;
  triggerLabelKey: string;
  rowLabelKey: string;
  triggerClassName: string;
  iconClassName: string;
  rowClassName: string;
}

const STATUS_APPEARANCE: Record<EvidenceChecksStatus, StatusAppearance> = {
  idle: {
    icon: Circle,
    triggerLabelKey: "workbench.evidenceChecks.checks",
    rowLabelKey: "workbench.evidenceChecks.notChecked",
    triggerClassName: "text-wb-subtle hover:bg-wb-hover hover:text-wb-muted",
    iconClassName: "text-wb-subtle",
    rowClassName: "text-wb-subtle",
  },
  passed: {
    icon: CheckCircle2,
    triggerLabelKey: "workbench.evidenceChecks.checks",
    rowLabelKey: "workbench.evidenceChecks.passed",
    triggerClassName: "text-wb-subtle hover:bg-wb-hover hover:text-wb-muted",
    iconClassName: "text-wb-accent",
    rowClassName: "text-wb-muted",
  },
  checking: {
    icon: LoaderCircle,
    triggerLabelKey: "workbench.evidenceChecks.checking",
    rowLabelKey: "workbench.evidenceChecks.checking",
    triggerClassName: "text-wb-muted hover:bg-wb-hover hover:text-wb-text",
    iconClassName: "animate-spin text-wb-muted motion-reduce:animate-none",
    rowClassName: "text-wb-muted",
  },
  findings: {
    icon: CircleAlert,
    triggerLabelKey: "workbench.evidenceChecks.findings",
    rowLabelKey: "workbench.evidenceChecks.findings",
    triggerClassName: "text-wb-subtle hover:bg-wb-hover hover:text-wb-muted",
    iconClassName: "text-wb-warning",
    rowClassName: "text-wb-warning",
  },
  "verification-error": {
    icon: TriangleAlert,
    triggerLabelKey: "workbench.evidenceChecks.error",
    rowLabelKey: "workbench.evidenceChecks.verificationError",
    triggerClassName: "text-wb-danger hover:bg-wb-danger-soft",
    iconClassName: "text-wb-danger",
    rowClassName: "text-wb-danger",
  },
};

export function evidenceChecksStatusAppearance(status: EvidenceChecksStatus): StatusAppearance {
  return STATUS_APPEARANCE[status];
}

export function EvidenceChecksStatusControl({
  status = "idle",
  scenarios = [],
  label,
  fullReportHref,
  onOpenFullReport,
  fullReportLabel,
  className = "",
}: EvidenceChecksStatusControlProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const popoverId = `evidence-checks-${generatedId.replace(/:/g, "")}`;
  const titleId = `${popoverId}-title`;
  const meta = evidenceChecksStatusAppearance(status);
  const StatusIcon = meta.icon;
  const visualLabel = label ?? t(meta.triggerLabelKey);
  const accessibleStatus = t(meta.rowLabelKey);
  const reportLabel = fullReportLabel ?? t("workbench.evidenceChecks.viewFullReport");

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
    };
  }, [open]);

  const closeAndReturnFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleFullReport = () => {
    setOpen(false);
    onOpenFullReport?.();
  };

  return (
    <div
      className={`relative shrink-0 ${className}`}
      data-evidence-checks-status={status}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent ${meta.triggerClassName}`}
        aria-controls={popoverId}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("workbench.evidenceChecks.triggerAria", { status: accessibleStatus })}
        title={t("workbench.evidenceChecks.triggerAria", { status: accessibleStatus })}
      >
        <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${meta.iconClassName}`} aria-hidden="true" />
        <span>{visualLabel}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {t("workbench.evidenceChecks.triggerAria", { status: accessibleStatus })}
      </span>

      <div
        ref={popoverRef}
        id={popoverId}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-hidden={!open}
        inert={!open}
        className={`absolute right-0 top-full z-[60] mt-2 w-80 max-w-[calc(100vw-1.5rem)] origin-top-right rounded-lg border border-wb-line bg-wb-panel p-3 text-left shadow-xl transition-[opacity,transform,visibility] duration-150 ease-out motion-reduce:transform-none motion-reduce:transition-opacity motion-reduce:duration-150 ${
          open
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible pointer-events-none -translate-y-0.5 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-xs font-semibold text-wb-text">
              {t("workbench.evidenceChecks.title")}
            </h2>
            <p className="mt-0.5 text-[10px] leading-4 text-wb-subtle">
              {t("workbench.evidenceChecks.scopeHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAndReturnFocus}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
            aria-label={t("workbench.evidenceChecks.close")}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div
          className="mt-2 divide-y divide-wb-line"
          role={scenarios.length > 0 ? "list" : undefined}
        >
          {scenarios.length === 0 ? (
            <p className="py-2 text-[11px] text-wb-subtle">
              {t("workbench.evidenceChecks.noScenarioDetails")}
            </p>
          ) : scenarios.map((scenario) => {
            const scenarioMeta = evidenceChecksStatusAppearance(scenario.status);
            const ScenarioStatusIcon = scenarioMeta.icon;
            const rowStatus = t(scenarioMeta.rowLabelKey);
            const rowTitle = scenario.message
              ? `${scenario.name}: ${scenario.message} (${rowStatus})`
              : `${scenario.name}: ${rowStatus}`;

            return (
              <div
                key={scenario.id}
                role="listitem"
                className="flex min-w-0 items-center gap-2 py-2"
                title={rowTitle}
              >
                {scenario.color && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: scenario.color }}
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-[11px] text-wb-muted">
                  <span className="font-medium text-wb-text">{scenario.name}</span>
                  {scenario.message && <span className="text-wb-subtle"> · {scenario.message}</span>}
                </span>
                <span className={`inline-flex shrink-0 items-center gap-1 text-[10px] font-medium ${scenarioMeta.rowClassName}`}>
                  <ScenarioStatusIcon
                    className={`h-3 w-3 ${scenarioMeta.iconClassName}`}
                    aria-hidden="true"
                  />
                  {rowStatus}
                </span>
              </div>
            );
          })}
        </div>

        {(fullReportHref || onOpenFullReport) && (
          <div className="mt-1 border-t border-wb-line pt-2">
            {fullReportHref ? (
              <a
                href={fullReportHref}
                onClick={handleFullReport}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-medium text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
              >
                {reportLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleFullReport}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-medium text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
              >
                {reportLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
