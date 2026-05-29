import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseSetup';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrors';

export const OfficialCases = () => {
  const { isAdmin } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
       try {
         const q = isAdmin 
            ? query(collection(db, 'cases'), orderBy('createdAt', 'desc'))
            : query(collection(db, 'cases'), where('status', '==', 'published'), orderBy('createdAt', 'desc'));
         
         const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCases(list);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'cases');
      } finally {
         setLoading(false);
       }
    };
    fetchCases();
  }, [isAdmin]);

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-8 bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Official Cases</h1>
          {isAdmin && (
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-bold shadow transition-colors">
               + New Case
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-slate-500 animate-pulse">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="text-slate-500 bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
             No cases available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {cases.map(c => (
               <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 transition-all hover:border-slate-700 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-slate-200 line-clamp-1">{c.title}</h2>
                      {isAdmin && c.status === 'draft' && (
                           <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 uppercase ml-2">Draft</span>
                      )}
                  </div>
                  <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-3">
                     {c.description}
                  </p>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold shadow transition-colors w-full">
                    Launch Scenario
                  </button>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
