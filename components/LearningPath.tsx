import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OFFICIAL_CASES } from '../officialCases';

export const LearningPath = () => {
  const navigate = useNavigate();
  const lessons = OFFICIAL_CASES.map((c, index) => ({
    id: c.meta.id,
    order: index + 1,
    title: c.meta.title,
    description: c.spec.description,
  }));
  const openLesson = (id: string) => {
    navigate(`/workbench?case=${encodeURIComponent(id)}&from=learning`);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-8 bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Official Learning Path</h1>
        </div>

        <div className="space-y-4">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all hover:border-slate-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                    {lesson.order}
                  </span>
                  <h2 className="text-xl font-bold text-slate-200">{lesson.title}</h2>
                </div>
                <p className="text-sm text-slate-400 pl-11">
                  {lesson.description}
                </p>
              </div>
              <button
                onClick={() => openLesson(lesson.id)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-bold shadow transition-colors w-full sm:w-auto"
              >
                Start lesson
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
