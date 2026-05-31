import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OFFICIAL_CASES } from '../officialCases';

export const OfficialCases = () => {
  const navigate = useNavigate();
  const openCase = (id: string) => {
    navigate(`/workbench?case=${encodeURIComponent(id)}&from=cases`);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-8 bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Official Cases</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OFFICIAL_CASES.map((c) => (
            <div key={c.meta.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 transition-all hover:border-slate-700 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-200 line-clamp-1">{c.meta.title}</h2>
              </div>
              <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-3">
                {c.spec.description}
              </p>
              <button
                onClick={() => openCase(c.meta.id)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold shadow transition-colors w-full"
              >
                Open case
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
