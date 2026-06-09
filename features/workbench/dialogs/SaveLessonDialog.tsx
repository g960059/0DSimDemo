import { useTranslation } from 'react-i18next';

type SaveLessonDialogProps = {
  isOpen: boolean;
  lessonTitle: string;
  noteExcerptText: string;
  stepsCount: number;
  onTitleChange: (title: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function SaveLessonDialog({
  isOpen,
  lessonTitle,
  noteExcerptText,
  stepsCount,
  onTitleChange,
  onCancel,
  onSave,
}: SaveLessonDialogProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-slate-200 mb-4 tracking-tight">{t('workbench.dialogs.saveLesson.title')}</h2>
        <div className="space-y-4 mb-6">
          <label className="block">
            <span className="block text-xs font-bold text-slate-400 mb-2">{t('workbench.dialogs.saveLesson.lessonTitle')}</span>
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 outline-none focus:border-blue-500 rounded px-3 py-2 text-sm font-medium text-slate-100"
              autoFocus
            />
          </label>
          <div className="rounded border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-xs font-bold text-slate-400 mb-1">{t('workbench.dialogs.saveLesson.noteSpine')}</div>
            <div className="text-sm text-slate-200 truncate">
              {noteExcerptText}
            </div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-xs font-bold text-slate-400 mb-1">{t('workbench.dialogs.saveLesson.capturedSteps')}</div>
            <div className="text-sm text-slate-200">{t('workbench.dialogs.saveLesson.stepsCount', { count: stepsCount })}</div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">{t('common.cancel')}</button>
          <button onClick={onSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded shadow transition-colors">{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
}
