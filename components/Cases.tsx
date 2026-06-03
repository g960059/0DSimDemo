import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCaseSummaries, type CaseSummary } from '../caseCloud';
import { useAuth } from '../contexts/AuthContext';
import { OFFICIAL_CASES } from '../officialCases';
import { caseHref } from '../homeLinks';

export const OfficialCases = () => {
  const { user } = useAuth();
  const [myCases, setMyCases] = useState<CaseSummary[]>([]);
  const [communityCases, setCommunityCases] = useState<CaseSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setMyCases([]);
      return;
    }
    listCaseSummaries({ ownerUid: user.uid, max: 24 }).then((cases) => {
      if (!cancelled) setMyCases(cases);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    listCaseSummaries({ visibility: 'public', max: 24 }).then((cases) => {
      if (!cancelled) setCommunityCases(user ? cases.filter((c) => c.ownerId !== user.uid) : cases);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const renderCaseCard = (c: { id: string; title: string; description?: string; badge?: string }) => (
    <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 transition-all hover:border-slate-700 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-lg font-bold text-slate-200 line-clamp-1">{c.title}</h2>
        {c.badge && <span className="shrink-0 rounded bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-400">{c.badge}</span>}
      </div>
      <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-3">
        {c.description}
      </p>
      <Link
        to={caseHref(c.id)}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold shadow transition-colors w-full text-center"
      >
        Open case
      </Link>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-8 bg-slate-950 text-slate-200">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Cases</h1>
        </div>

        {user && (
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-100">My cases</h2>
            {myCases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCases.map((c) => renderCaseCard({
                  id: c.id,
                  title: c.title,
                  description: c.description,
                  badge: c.status === 'published' ? c.visibility : 'draft',
                }))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">No saved cases yet.</div>
            )}
          </section>
        )}

        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-100">Official cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OFFICIAL_CASES.map((c) => renderCaseCard({
              id: c.meta.id,
              title: c.meta.title,
              description: c.spec.description,
              badge: 'official',
            }))}
          </div>
        </section>

        {communityCases.length > 0 && (
          <section className="pb-6">
            <h2 className="mb-4 text-xl font-bold text-slate-100">Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {communityCases.map((c) => renderCaseCard({
                id: c.id,
                title: c.title,
                description: c.description,
                badge: c.kind,
              }))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
