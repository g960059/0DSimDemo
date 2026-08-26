import {
  AlertTriangle,
  ArrowLeft,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

export function WorkbenchSaveErrorBannerV3({
  message,
}: Readonly<{ message: string }>) {
  return (
    <div
      role="alert"
      className="flex shrink-0 items-start gap-2 border-b border-wb-warning/25 bg-wb-warning-soft px-3 py-2 text-xs leading-5 text-wb-text"
      data-testid="workbench-save-error-v3"
    >
      <AlertTriangle
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-wb-warning"
        aria-hidden="true"
      />
      <span className="min-w-0 break-words">{message}</span>
    </div>
  );
}

export function WorkbenchSnapshotErrorBannerV3({
  closeLabel,
  login,
  message,
  onClose,
}: Readonly<{
  closeLabel: string;
  login: Readonly<{ href: string; label: string }> | null;
  message: string;
  onClose: () => void;
}>) {
  return (
    <div
      role="alert"
      className="flex shrink-0 items-start gap-2 border-b border-wb-warning/25 bg-wb-warning-soft px-3 py-2 text-xs leading-5 text-wb-text"
      data-testid="workbench-snapshot-error-v3"
    >
      <AlertTriangle
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-wb-warning"
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 break-words">{message}</span>
      {login !== null && (
        <Link
          to={login.href}
          className="shrink-0 font-semibold text-wb-accent hover:underline"
        >
          {login.label}
        </Link>
      )}
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text"
        aria-label={closeLabel}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function WorkbenchUnavailableModelV3({
  back,
  description,
  onStartLatest,
  preservedNotice,
  recoveryError,
  startLatestLabel,
  title,
}: Readonly<{
  back: Readonly<{ href: string; label: string }>;
  description: string;
  onStartLatest: () => void;
  preservedNotice: string;
  recoveryError: string | null;
  startLatestLabel: string;
  title: string;
}>) {
  return (
    <section
      className="m-4 max-w-3xl self-center rounded-xl border border-wb-warning/50 bg-wb-warning-soft p-6 text-sm"
      role="alert"
      data-testid="workbench-unavailable-model-v3"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-wb-warning"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h2 className="font-bold text-wb-text">{title}</h2>
          <p className="mt-2 leading-6 text-wb-muted">{description}</p>
          {recoveryError !== null && (
            <p className="mt-3 text-xs text-wb-danger" role="alert">
              {recoveryError}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to={back.href}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-wb-line bg-wb-panel px-3 text-xs font-bold text-wb-text hover:bg-wb-hover"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {back.label}
            </Link>
            <button
              type="button"
              onClick={onStartLatest}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-wb-accent px-3 text-xs font-bold text-white hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {startLatestLabel}
            </button>
          </div>
          <p className="mt-4 text-xs leading-5 text-wb-subtle">
            {preservedNotice}
          </p>
        </div>
      </div>
    </section>
  );
}

export function WorkbenchRuntimeErrorV3({
  message,
  onRestart,
  restartLabel,
  title,
}: Readonly<{
  message: string;
  onRestart: () => void;
  restartLabel: string;
  title: string;
}>) {
  return (
    <section
      className="m-4 rounded-lg border border-wb-danger/50 bg-wb-danger-soft p-5 text-sm text-wb-danger"
      role="alert"
    >
      <p className="font-bold">{title}</p>
      <p className="mt-2 font-mono text-xs">{message}</p>
      <button
        type="button"
        className="mt-4 inline-flex h-9 items-center gap-2 rounded border border-wb-danger/50 bg-wb-panel px-3 text-xs font-bold text-wb-text hover:bg-wb-hover"
        onClick={onRestart}
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        {restartLabel}
      </button>
    </section>
  );
}
