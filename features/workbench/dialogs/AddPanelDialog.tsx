import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PanelInstanceConfig, PanelType, SimInstance } from '@/types';
import { ALL_CHAMBERS, ALL_CONTROL_GROUPS, ALL_METRICS, ALL_SIGNALS } from '@/features/workbench/workbenchDefaults';

type AddPanelDialogProps = {
  panelType: PanelType | null;
  instances: SimInstance[];
  config: Record<string, PanelInstanceConfig>;
  setConfig: React.Dispatch<React.SetStateAction<Record<string, PanelInstanceConfig>>>;
  onCancel: () => void;
  onConfirm: () => void;
};

export function AddPanelDialog({
  panelType,
  instances,
  config,
  setConfig,
  onCancel,
  onConfirm,
}: AddPanelDialogProps) {
  const { t } = useTranslation();
  if (!panelType) return null;

  const choices = panelType === 'PVLOOP'
    ? ALL_CHAMBERS
    : panelType === 'WAVEFORM'
      ? ALL_SIGNALS
      : panelType === 'METRICS'
        ? ALL_METRICS
        : ALL_CONTROL_GROUPS;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-bold text-slate-200 mb-4 tracking-tight">{t('workbench.dialogs.addPanel.title', { panelType })}</h2>

        <div className="max-h-[60vh] overflow-y-auto space-y-4 mb-6 custom-scrollbar pr-2">
          {instances.map(inst => (
            <div key={inst.id} className="bg-slate-800/50 p-3 rounded border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer accent-blue-500"
                    checked={config[inst.id]?.visible || false}
                    onChange={() => setConfig(prev => ({
                      ...prev, [inst.id]: { ...prev[inst.id], visible: !prev[inst.id]?.visible }
                    }))}
                  />
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: inst.color }}></span>
                    <span className="text-sm font-bold text-slate-300">{inst.name}</span>
                  </div>
                </div>
              </div>
              {config[inst.id]?.visible && ![
                'GUYTON_RIGHT',
                'GUYTON_LEFT',
                'GUYTON_3D',
              ].includes(panelType) && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-700/50">
                  {choices.map(sig => {
                    const isSelected = config[inst.id]?.selectedSignals.includes(sig);
                    return (
                      <button
                        key={sig}
                        onClick={() => {
                          setConfig(prev => {
                            const currentSigs = new Set(prev[inst.id].selectedSignals);
                            if (currentSigs.has(sig)) currentSigs.delete(sig); else currentSigs.add(sig);
                            return { ...prev, [inst.id]: { ...prev[inst.id], selectedSignals: Array.from(currentSigs) } };
                          });
                        }}
                        className={`py-1.5 px-2 text-xs rounded transition-colors text-center font-mono ${isSelected ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-600'}`}
                      >
                        {sig}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">{t('common.cancel')}</button>
          <button onClick={onConfirm} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded shadow transition-colors">{t('workbench.dialogs.addPanel.confirm')}</button>
        </div>
      </div>
    </div>
  );
}
