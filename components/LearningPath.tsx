import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseSetup';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrors';

export const LearningPath = () => {
  const { isAdmin } = useAuth();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
       try {
         const q = isAdmin 
            ? query(collection(db, 'lessons'), orderBy('order', 'asc'))
            : query(collection(db, 'lessons'), where('status', '==', 'published'), orderBy('order', 'asc'));
         
         const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLessons(list);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'lessons');
      } finally {
         setLoading(false);
       }
    };
    fetchLessons();
  }, [isAdmin]);

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-8 bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Official Learning Path</h1>
          {isAdmin && (
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold shadow transition-colors">
               + New Lesson
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-slate-500 animate-pulse">Loading modules...</div>
        ) : lessons.length === 0 ? (
          <div className="text-slate-500 bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
             No lessons available right now.
          </div>
        ) : (
          <div className="space-y-4">
             {lessons.map(lesson => (
               <div key={lesson.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all hover:border-slate-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                           {lesson.order}
                        </span>
                        <h2 className="text-xl font-bold text-slate-200">{lesson.title}</h2>
                        {isAdmin && lesson.status === 'draft' && (
                           <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 uppercase">Draft</span>
                        )}
                    </div>
                    <p className="text-sm text-slate-400 pl-11">
                       Master the fundamentals of cardiovascular physiology.
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold shadow transition-colors w-full sm:w-auto">
                    Start Module
                  </button>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
