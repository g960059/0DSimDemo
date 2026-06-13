import React from 'react';

type WorkbenchEmptyStateAction = {
  label: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  ariaLabel?: string;
  title?: string;
};

interface WorkbenchEmptyStateProps {
  description: React.ReactNode;
  primaryAction?: WorkbenchEmptyStateAction;
  secondaryAction?: WorkbenchEmptyStateAction;
  className?: string;
}

function EmptyStateButton({
  action,
  primary = false,
}: {
  action: WorkbenchEmptyStateAction;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      className={`inline-flex h-8 min-w-0 items-center justify-center gap-2 rounded border border-wb-line bg-transparent px-2.5 text-xs transition-colors hover:border-wb-line-strong hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent ${
        primary ? 'font-bold text-wb-text' : 'font-semibold text-wb-muted'
      }`}
      aria-label={action.ariaLabel}
      title={action.title}
    >
      {action.icon}
      <span className="truncate">{action.label}</span>
    </button>
  );
}

export function WorkbenchEmptyState({
  description,
  primaryAction,
  secondaryAction,
  className = '',
}: WorkbenchEmptyStateProps) {
  return (
    <div className={`flex h-full min-h-0 items-center justify-center px-4 text-center ${className}`}>
      <div className="flex max-w-full flex-col items-center gap-3">
        <p className="max-w-full truncate text-xs text-wb-subtle">{description}</p>
        {(primaryAction || secondaryAction) && (
          <div className="flex max-w-full flex-wrap justify-center gap-2">
            {primaryAction && <EmptyStateButton action={primaryAction} primary />}
            {secondaryAction && <EmptyStateButton action={secondaryAction} />}
          </div>
        )}
      </div>
    </div>
  );
}
