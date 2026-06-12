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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-wb-line bg-wb-panel p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold tracking-tight text-wb-text">{t('workbench.dialogs.saveLesson.title')}</h2>
        <div className="space-y-4 mb-6">
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-wb-muted">{t('workbench.dialogs.saveLesson.lessonTitle')}</span>
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full rounded border border-wb-line bg-wb-input px-3 py-2 text-sm font-medium text-wb-text outline-none focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
              autoFocus
            />
          </label>
          <div className="rounded border border-wb-line bg-wb-strip p-3">
            <div className="mb-1 text-xs font-bold text-wb-muted">{t('workbench.dialogs.saveLesson.noteSpine')}</div>
            <div className="truncate text-sm text-wb-text">
              {noteExcerptText}
            </div>
          </div>
          <div className="rounded border border-wb-line bg-wb-strip p-3">
            <div className="mb-1 text-xs font-bold text-wb-muted">{t('workbench.dialogs.saveLesson.capturedSteps')}</div>
            <div className="text-sm text-wb-text">{t('workbench.dialogs.saveLesson.stepsCount', { count: stepsCount })}</div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-wb-muted transition-colors hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent">{t('common.cancel')}</button>
          <button onClick={onSave} className="rounded bg-wb-primary px-6 py-2 text-sm font-bold text-white shadow transition-colors hover:bg-wb-primary-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent">{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
}
