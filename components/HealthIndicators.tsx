import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { SimulationHealth, SimulationHealthStatus } from '../engine/protocol';
import type { MorphologyCheckStatus, MorphologyCheckSummary } from '../engine/verification/morphologyCheck';

// Low-noise health UX (ROADMAP S1): nothing is shown while healthy.
// warning = amber, failed/unstable = red. ok renders nothing.

export const STATUS_META: Record<SimulationHealthStatus, { color: string } | null> = {
  ok: null,
  warning: { color: '#fbbf24' },
  failed: { color: '#ef4444' },
};

/** Tiny per-instance dot. Renders nothing when ok (no noise in the steady state). */
export const HealthDot: React.FC<{ status: SimulationHealthStatus; title?: string }> = ({ status, title }) => {
  const { t } = useTranslation();
  const meta = STATUS_META[status];
  if (!meta) return null;
  const label = status === 'failed' ? t('health.unstable') : t('health.warning');
  return (
    <span
      title={title ?? label}
      aria-label={label}
      className={`inline-block w-2 h-2 rounded-full ${status === 'failed' ? 'animate-pulse' : ''}`}
      style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
    />
  );
};

export type HealthBadgeItem = { id: string; name: string; color: string; health: SimulationHealth };

/**
 * Aggregate, instance-aware badge for the header. Hidden entirely when every
 * instance is ok. Click to reveal which instance(s) and the failing checks.
 * `getLiveHealth` (optional) lets the popover show current detail rather than
 * the throttled snapshot, which can be several seconds stale.
 */
export const HealthBadge: React.FC<{
  items: HealthBadgeItem[];
  getLiveHealth?: (id: string) => SimulationHealth | undefined;
}> = ({ items, getLiveHealth }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const problems = items.filter((it) => it.health.status !== 'ok');
  useEffect(() => {
    if (problems.length === 0 && open) setOpen(false);
  }, [problems.length, open]);
  // Dismiss the popover on Escape and on outside click.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (problems.length === 0) return null;

  const anyFailed = problems.some((p) => p.health.status === 'failed');
  const meta = anyFailed ? STATUS_META.failed! : STATUS_META.warning!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2 sm:px-3 py-1.5 rounded text-[10px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors"
        style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
        title={t('health.simulationHealth')}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{anyFailed ? t('health.unstable') : t('health.warning')}</span>
        {problems.length > 1 && <span>({problems.length})</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label={t('health.simulationHealth')}
            className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 p-3 text-left custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">{t('health.simulationHealth')}</span>
              <button onClick={() => setOpen(false)} aria-label={t('common.close')} className="text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {problems.map((p) => {
              const live = getLiveHealth?.(p.id) ?? p.health;
              const pm = STATUS_META[live.status] ?? STATUS_META[p.health.status]!;
              return (
                <div key={p.id} className="mb-2 last:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs font-semibold text-slate-200">{p.name}</span>
                    <span className="text-[10px] font-bold uppercase" style={{ color: pm!.color }}>{live.status === 'failed' ? t('health.unstable') : t('health.warning')}</span>
                  </div>
                  <ul className="mt-1 pl-4 list-disc text-[11px] text-slate-400 space-y-0.5">
                    {live.messages.length === 0 ? (
                      <li>{t('health.noDetail')}</li>
                    ) : (
                      live.messages.map((m, i) => <li key={i}>{m}</li>)
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export type MorphologyBadgeItem = { id: string; name: string; color: string; morphology: MorphologyCheckSummary };

const MORPHOLOGY_STATUS_META: Record<MorphologyCheckStatus, { color: string; label: string }> = {
  ok: { color: '#22c55e', label: 'OK' },
  warning: { color: '#fbbf24', label: 'WARN' },
  failed: { color: '#ef4444', label: 'FAIL' },
  pending: { color: '#94a3b8', label: 'PENDING' },
};

const MORPHOLOGY_BADGE_LABELS: Record<keyof MorphologyCheckSummary['badges'], string> = {
  lvPv: 'LV PV',
  rvPv: 'RV PV',
  laPv: 'LA PV',
  raPv: 'RA PV',
  mvf: 'MVF',
  tvf: 'TVF',
  lapWaveform: 'LAP',
  rapWaveform: 'RAP',
};

export const MorphologyBadge: React.FC<{ items: MorphologyBadgeItem[] }> = ({ items }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (items.length === 0 && open) setOpen(false);
  }, [items.length, open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (items.length === 0) return null;

  const overallStatus: MorphologyCheckStatus = items.some((item) => item.morphology.status === 'failed')
    ? 'failed'
    : items.some((item) => item.morphology.status === 'warning')
      ? 'warning'
      : items.some((item) => item.morphology.status === 'pending')
        ? 'pending'
        : 'ok';
  const meta = MORPHOLOGY_STATUS_META[overallStatus];
  const Icon = overallStatus === 'ok' ? CheckCircle2 : Activity;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-2 sm:px-3 py-1.5 rounded text-[10px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors"
        style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
        title="Morphology check"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Morph {meta.label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label="Morphology check"
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 p-3 text-left custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">Morphology check</span>
              <button onClick={() => setOpen(false)} aria-label={t('common.close')} className="text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {items.map((item) => (
              <div key={item.id} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                  <span className="text-[10px] font-bold uppercase" style={{ color: MORPHOLOGY_STATUS_META[item.morphology.status].color }}>
                    {MORPHOLOGY_STATUS_META[item.morphology.status].label}
                  </span>
                </div>
                <div className="mt-1 grid grid-cols-4 gap-1 text-[10px]">
                  {(Object.entries(item.morphology.badges) as [keyof MorphologyCheckSummary['badges'], MorphologyCheckStatus][]).map(([key, status]) => (
                    <span
                      key={key}
                      className="rounded border px-1.5 py-1 font-semibold"
                      style={{
                        borderColor: `${MORPHOLOGY_STATUS_META[status].color}66`,
                        color: MORPHOLOGY_STATUS_META[status].color,
                        backgroundColor: `${MORPHOLOGY_STATUS_META[status].color}12`,
                      }}
                    >
                      {MORPHOLOGY_BADGE_LABELS[key]} {MORPHOLOGY_STATUS_META[status].label}
                    </span>
                  ))}
                </div>
                <ul className="mt-2 pl-4 list-disc text-[11px] text-slate-400 space-y-0.5">
                  {item.morphology.results
                    .filter((result) => result.status !== 'ok')
                    .slice(0, 6)
                    .map((result) => <li key={result.id}>{result.label}: {result.message}</li>)}
                  {item.morphology.status === 'ok' && <li>LV/RV/LA/RA PV loops and AV inflow checks are OK for the active morphology profile.</li>}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export type HealthToast = { id: string; name: string; status: SimulationHealthStatus; message: string };

const Toast: React.FC<{ toast: HealthToast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const { t } = useTranslation();
  // Keep onDismiss in a ref so the auto-dismiss timer is armed once per toast
  // and is NOT reset by parent re-renders (which recreate onDismiss).
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    const t = setTimeout(() => dismissRef.current(toast.id), 6000);
    return () => clearTimeout(t);
  }, [toast.id]);
  const meta = STATUS_META[toast.status] ?? STATUS_META.warning!;
  return (
    <div
      className="w-72 bg-slate-900 border rounded-lg shadow-2xl p-3 flex items-start gap-2 animate-[fadeIn_0.15s_ease-out]"
      style={{ borderColor: `${meta.color}66` }}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: meta.color }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold" style={{ color: meta.color }}>{toast.name}: {toast.status === 'failed' ? t('health.unstable') : t('health.warning')}</div>
        {toast.message && <div className="text-[11px] text-slate-400 mt-0.5 break-words">{toast.message}</div>}
      </div>
      <button onClick={() => onDismiss(toast.id)} aria-label={t('common.dismiss')} className="text-slate-500 hover:text-slate-300 shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/** Fixed bottom-right transient stack. Only mounted entries are visible. */
export const HealthToasts: React.FC<{ toasts: HealthToast[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
