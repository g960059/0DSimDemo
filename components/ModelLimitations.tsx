import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, X } from 'lucide-react';

export const DEFAULT_MODEL_LIMITATIONS_ACK_KEY =
  'circleheart.modelLimitations.ack.v1';
export const MODEL_LIMITATIONS_ACKNOWLEDGED_EVENT =
  'circleheart:model-limitations-acknowledged';

const LIMITATIONS: string[] = [
  'Research & education only — not a medical device, and not for diagnosis, treatment, or any patient-specific decision.',
  '0D lumped-parameter model: it does not resolve spatial blood flow, local wall stress, or 3D hemodynamics.',
  'Parameters are calibration targets, not fixed physiological constants; outputs are approximate and not yet validated against clinical data.',
  'Several subsystems are not modeled yet (coronary circulation, renal/hepatic/portal beds, detailed baroreflex, fluid exchange).',
  'Use it to build intuition and explore hypotheses — not to predict a specific patient.',
];

export function hasModelLimitationsAcknowledgement(
  acknowledgementKey: string,
): boolean {
  try {
    return localStorage.getItem(acknowledgementKey) === '1';
  } catch {
    // A persistence failure is not evidence of acknowledgement. The modal
    // remains the trust boundary, while its explicit action can still
    // authorize the current in-memory session.
    return false;
  }
}

function setAck(acknowledgementKey: string) {
  try {
    localStorage.setItem(acknowledgementKey, '1');
  } catch {
    /* ignore */
  }
}

const Body: React.FC<{ limitations?: readonly string[] }> = ({ limitations = LIMITATIONS }) => (
  <ul className="space-y-2 text-sm text-slate-300">
    {limitations.map((l, i) => (
      <li key={i} className="flex gap-2">
        <span className="text-slate-500 mt-0.5">•</span>
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
  limitations?: readonly string[];
  acknowledgementKey?: string;
}> = ({
  compact = false,
  limitations,
  acknowledgementKey = DEFAULT_MODEL_LIMITATIONS_ACK_KEY,
}) => {
  const { t } = useTranslation();
  const defaultLimitations = t('modelLimitations.items', { returnObjects: true }) as string[];
  const shownLimitations = limitations ?? defaultLimitations;
  // First-run modal: open if not acknowledged. Manual reopen via the header icon.
  const [firstRun, setFirstRun] = useState<boolean>(
    () => !hasModelLimitationsAcknowledgement(acknowledgementKey),
  );
  const [reopened, setReopened] = useState(false);
  const open = firstRun || reopened;

  const close = () => {
    if (firstRun) {
      setAck(acknowledgementKey);
      window.dispatchEvent(new CustomEvent(
        MODEL_LIMITATIONS_ACKNOWLEDGED_EVENT,
        { detail: { acknowledgementKey } },
      ));
    }
    setFirstRun(false);
    setReopened(false);
  };

  // Escape may close a manually reopened informational dialog, but it must
  // never manufacture first-run acknowledgement.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !firstRun) close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [firstRun, open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <button
        onClick={() => setReopened(true)}
        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
        title={t('modelLimitations.buttonTitle')}
        aria-label={t('modelLimitations.titleShort')}
      >
        <Info className="w-4 h-4" />
        {!compact && <span className="hidden lg:inline text-[10px] font-medium">{t('modelLimitations.buttonShort')}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="model-limits-title" className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h2 id="model-limits-title" className="text-sm font-bold text-slate-200">{t('modelLimitations.title')}</h2>
              </div>
              {!firstRun && (
                <button onClick={close} aria-label={t('common.close')} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="px-5 py-4">
              <Body limitations={shownLimitations} />
            </div>
            <div className="px-5 py-3 border-t border-slate-800 flex justify-end">
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
