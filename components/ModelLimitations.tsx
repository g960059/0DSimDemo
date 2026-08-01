import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, X } from 'lucide-react';

const DEFAULT_ACKNOWLEDGEMENT_SCOPE =
  'circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.development-8:disclosure-v1';

export function modelLimitationsAcknowledgementKey(scope: string): string {
  return `circleheart.modelLimitations.ack.${encodeURIComponent(scope)}`;
}

function hasAck(scope: string): boolean {
  try {
    return localStorage.getItem(modelLimitationsAcknowledgementKey(scope)) === '1';
  } catch {
    return true; // if storage is unavailable, don't nag
  }
}

function setAck(scope: string) {
  try {
    localStorage.setItem(modelLimitationsAcknowledgementKey(scope), '1');
  } catch {
    /* ignore */
  }
}

const Body: React.FC<{ limitations: string[] }> = ({ limitations }) => (
  <ul className="space-y-2 text-sm text-wb-muted">
    {limitations.map((l, i) => (
      <li key={i} className="flex gap-2">
        <span className="text-wb-subtle mt-0.5">•</span>
        <span>{l}</span>
      </li>
    ))}
  </ul>
);

/**
 * Model-limitations UX (ROADMAP S1): a one-time first-run modal that records
 * acknowledgement in localStorage, plus a tiny always-reachable info button.
 * Deliberately NOT a large always-on banner.
 */
export const ModelLimitations: React.FC<{
  compact?: boolean;
  limitations?: string[];
  acknowledgementScope?: string;
}> = ({
  compact = false,
  limitations,
  acknowledgementScope = DEFAULT_ACKNOWLEDGEMENT_SCOPE,
}) => {
  const { t } = useTranslation();
  const defaultLimitations = t('modelLimitations.items', { returnObjects: true }) as string[];
  const shownLimitations = limitations ?? defaultLimitations;
  // First-run modal: open if not acknowledged. Manual reopen via the header icon.
  const [firstRun, setFirstRun] = useState<boolean>(() =>
    !hasAck(acknowledgementScope));
  const [reopened, setReopened] = useState(false);
  const open = firstRun || reopened;

  const close = () => {
    if (firstRun) setAck(acknowledgementScope);
    setFirstRun(false);
    setReopened(false);
  };

  // Escape closes (and acknowledges, if first run).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <button
        onClick={() => setReopened(true)}
        className="p-1.5 text-wb-muted hover:text-wb-text hover:bg-wb-hover rounded transition-colors flex items-center gap-1"
        title={t('modelLimitations.buttonTitle')}
        aria-label={t('modelLimitations.titleShort')}
      >
        <Info className="w-4 h-4" />
        {!compact && <span className="hidden lg:inline text-[10px] font-medium">{t('modelLimitations.buttonShort')}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="model-limits-title" className="bg-wb-panel border border-wb-line-strong rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-3 border-b border-wb-line">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h2 id="model-limits-title" className="text-sm font-bold text-wb-text">{t('modelLimitations.title')}</h2>
              </div>
              {!firstRun && (
                <button onClick={close} aria-label={t('common.close')} className="text-wb-subtle hover:text-wb-muted">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="px-5 py-4">
              <Body limitations={shownLimitations} />
            </div>
            <div className="px-5 py-3 border-t border-wb-line flex justify-end">
              <button
                onClick={close}
                autoFocus
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold transition-colors"
              >
                {t('modelLimitations.understand')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
