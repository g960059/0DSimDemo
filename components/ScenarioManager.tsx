import React from 'react';

interface ScenarioManagerProps {
    isOpen: boolean;
    onClose: () => void;
    instances: any[];
    addInstance: (sourceId?: string) => void;
    removeInstance: (id: string) => void;
    updateInstanceName: (id: string, name: string) => void;
    updateInstanceColor: (id: string, color: string) => void;
}

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({
    isOpen, onClose, instances, addInstance, removeInstance, updateInstanceName, updateInstanceColor
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-2xl flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-xl font-bold text-slate-200 tracking-tight flex items-center gap-2">
                        <span className="text-blue-400">❖</span> Scenario Manager
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {instances.map(inst => (
                        <div key={inst.id} className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg flex items-center gap-4">
                            <div className="relative overflow-hidden w-6 h-6 rounded-full shadow-sm shrink-0 border-2 border-slate-600 focus-within:border-slate-400 transition-colors">
                                <div className="absolute inset-0" style={{backgroundColor: inst.color}}></div>
                                <input 
                                    type="color" 
                                    value={inst.color} 
                                    onChange={(e) => updateInstanceColor(inst.id, e.target.value)} 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    title="Change color"
                                />
                            </div>
                            
                            <input 
                                type="text"
                                value={inst.name}
                                onChange={(e) => updateInstanceName(inst.id, e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors font-medium"
                                placeholder="Scenario Name"
                            />

                            <div className="flex items-center gap-2 shrink-0">
                                <button 
                                    onClick={() => addInstance(inst.id)}
                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded transition-colors flex items-center gap-1"
                                    title="Duplicate this scenario"
                                >
                                    <span>⎘</span> Duplicate
                                </button>
                                
                                <button 
                                    onClick={() => removeInstance(inst.id)}
                                    disabled={instances.length <= 1}
                                    className={`px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1 ${instances.length <= 1 ? 'bg-red-950/20 text-red-900/50 cursor-not-allowed' : 'bg-red-950/50 hover:bg-red-900/80 text-red-400'}`}
                                    title="Delete scenario"
                                >
                                    <span>🗑️</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 shrink-0 flex justify-between items-center">
                    <button 
                        onClick={() => addInstance()}
                        className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded text-sm font-bold transition-colors flex items-center gap-2"
                    >
                        <span>+</span> New Default Scenario
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm font-bold transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
