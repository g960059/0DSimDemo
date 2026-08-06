import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { ModelDisclosureDialogV3 } from "./workbench/ModelDisclosureDialogV3";

const DEFAULT_ACKNOWLEDGEMENT_SCOPE =
  "circleheart.integrated-v3:disclosure-v1";

export function modelLimitationsAcknowledgementKey(scope: string): string {
  return `circleheart.modelLimitations.ack.${encodeURIComponent(scope)}`;
}

export function resolveModelLimitationsOpenState(
  input: Readonly<{
    acknowledged: boolean;
    dismissed: boolean;
    manuallyOpened: boolean;
    controlledOpen: boolean | undefined;
  }>,
): boolean {
  if (input.controlledOpen === true) return true;
  if (!input.acknowledged && !input.dismissed) return true;
  return input.controlledOpen === undefined && input.manuallyOpened;
}

function hasAck(scope: string): boolean {
  try {
    return (
      localStorage.getItem(modelLimitationsAcknowledgementKey(scope)) === "1"
    );
  } catch {
    return true; // if storage is unavailable, don't nag
  }
}

function setAck(scope: string) {
  try {
    localStorage.setItem(modelLimitationsAcknowledgementKey(scope), "1");
  } catch {
    /* ignore */
  }
}

/**
 * Model-limitations UX (ROADMAP S1): a one-time first-run modal that records
 * acknowledgement in localStorage, plus a tiny always-reachable info button.
 * Deliberately NOT a large always-on banner.
 */
export const ModelLimitations: React.FC<{
  compact?: boolean;
  limitations?: readonly string[];
  acknowledgementScope?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  autoOpenUnacknowledged?: boolean;
}> = ({
  compact = false,
  limitations,
  acknowledgementScope = DEFAULT_ACKNOWLEDGEMENT_SCOPE,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  autoOpenUnacknowledged = true,
}) => {
  const { t } = useTranslation();
  const defaultLimitations = t("modelLimitations.items", {
    returnObjects: true,
  }) as string[];
  const shownLimitations = limitations ?? defaultLimitations;
  const [acknowledged, setAcknowledged] = useState<boolean>(() =>
    hasAck(acknowledgementScope),
  );
  const [dismissed, setDismissed] = useState(false);
  const [manuallyOpened, setManuallyOpened] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const previousControlled = useRef<
    Readonly<{
      scope: string;
      open: boolean | undefined;
    }>
  >({ scope: acknowledgementScope, open: controlledOpen });
  const controlledCloseTransition =
    previousControlled.current.scope === acknowledgementScope &&
    previousControlled.current.open === true &&
    controlledOpen === false;
  const open = resolveModelLimitationsOpenState({
    acknowledged,
    dismissed:
      dismissed || controlledCloseTransition || !autoOpenUnacknowledged,
    manuallyOpened,
    controlledOpen,
  });

  useEffect(() => {
    setAcknowledged(hasAck(acknowledgementScope));
    setDismissed(false);
    setManuallyOpened(false);
  }, [acknowledgementScope]);

  useEffect(() => {
    const previous = previousControlled.current;
    if (
      previous.scope === acknowledgementScope &&
      previous.open === true &&
      controlledOpen === false
    ) {
      setDismissed(true);
      setManuallyOpened(false);
    }
    previousControlled.current = {
      scope: acknowledgementScope,
      open: controlledOpen,
    };
  }, [acknowledgementScope, controlledOpen]);

  const setOpen = (nextOpen: boolean) => {
    setManuallyOpened(nextOpen);
    if (nextOpen) setDismissed(false);
    else setDismissed(true);
    if (isControlled) onOpenChange?.(nextOpen);
  };

  const acknowledge = () => {
    setAck(acknowledgementScope);
    setAcknowledged(true);
    setDismissed(true);
    setManuallyOpened(false);
    if (isControlled) onOpenChange?.(false);
  };

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-9 items-center gap-1 rounded-md px-2 text-wb-muted transition-colors duration-150 hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          title={t("modelLimitations.buttonTitle")}
          aria-label={t("modelLimitations.titleShort")}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <Info className="h-4 w-4" aria-hidden="true" />
          {!compact && (
            <span className="hidden text-[10px] font-medium lg:inline">
              {t("modelLimitations.buttonShort")}
            </span>
          )}
        </button>
      )}

      <ModelDisclosureDialogV3
        open={open}
        onOpenChange={setOpen}
        onAcknowledge={acknowledge}
        title={t("modelLimitations.title")}
        closeLabel={t("common.close")}
        acknowledgeLabel={t("modelLimitations.understand")}
        limitations={shownLimitations}
      />
    </>
  );
};
