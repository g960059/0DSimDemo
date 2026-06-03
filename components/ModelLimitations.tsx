import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';

const ACK_KEY = 'circleheart.modelLimitations.ack.v1';

const LIMITATIONS: string[] = [
  'Research & education only — not a medical device, and not for diagnosis, treatment, or any patient-specific decision.',
  '0D lumped-parameter model: it does not resolve spatial blood flow, local wall stress, or 3D hemodynamics.',
  'Parameters are calibration targets, not fixed physiological constants; outputs are approximate and not yet validated against clinical data.',
  'Several subsystems are not modeled yet (coronary circulation, renal/hepatic/portal beds, detailed baroreflex, fluid exchange).',
  'Use it to build intuition and explore hypotheses — not to predict a specific patient.',
];

function hasAck(): boolean {
  try {
    return localStorage.getItem(ACK_KEY) === '1';
  } catch {
    return true; // if storage is unavailable, don't nag
  }
}

function setAck() {
  try {
    localStorage.setItem(ACK_KEY, '1');
  } catch {
    /* ignore */
  }
}

const Body: React.FC<{ limitations?: string[] }> = ({ limitations = LIMITATIONS }) => (
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
export const ModelLimitations: React.FC<{ compact?: boolean; limitations?: string[] }> = ({ compact = false, limitations }) => {
  // First-run modal: open if not acknowledged. Manual reopen via the header icon.
  const [firstRun, setFirstRun] = useState<boolean>(() => !hasAck());
  const [reopened, setReopened] = useState(false);
  const open = firstRun || reopened;

  const close = () => {
    if (firstRun) setAck();
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
        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
        title="Model limitations (educational model)"
        aria-label="Model limitations"
      >
        <Info className="w-4 h-4" />
        {!compact && <span className="hidden lg:inline text-[10px] font-medium">Model limits</span>}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="model-limits-title" className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h2 id="model-limits-title" className="text-sm font-bold text-slate-200">Educational model — limitations</h2>
              </div>
              {!firstRun && (
                <button onClick={close} aria-label="Close" className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="px-5 py-4">
              <Body limitations={limitations} />
            </div>
            <div className="px-5 py-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={close}
                autoFocus
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold transition-colors"
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
