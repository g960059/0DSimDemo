import { AlertCircle, AlertTriangle, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PublishIssue } from "@/features/workbench/casePublish";

function IssueRows({ issues }: { issues: PublishIssue[] }) {
  const { t } = useTranslation();
  return (
    <ul className="space-y-2">
      {issues.map((issue, index) => (
        <li key={`${issue.code}:${issue.path ?? ""}:${index}`} className="rounded-md border border-wb-line bg-wb-input px-3 py-2">
          <div className="text-xs font-semibold text-wb-text">{t(issue.code)}</div>
          {issue.path && <div className="mt-1 text-[11px] font-medium text-wb-subtle">{issue.path}</div>}
        </li>
      ))}
    </ul>
  );
}

export function PublishIssueList({
  blockers,
  warnings,
}: {
  blockers: PublishIssue[];
  warnings: PublishIssue[];
}) {
  const { t } = useTranslation();
  if (blockers.length === 0 && warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-wb-line bg-wb-input px-3 py-2 text-xs font-semibold text-wb-muted">
        <Check className="h-3.5 w-3.5 text-wb-accent" />
        <span>{t("publish.dialog.ready")}</span>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {blockers.length > 0 && (
        <section className="rounded-md border border-wb-danger bg-wb-danger-soft p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-wb-danger">
            <AlertCircle className="h-4 w-4" />
            <span>{t("publish.dialog.cannotPublish")}</span>
          </div>
          <IssueRows issues={blockers} />
        </section>
      )}
      {warnings.length > 0 && (
        <section className="rounded-md border border-wb-warning bg-wb-warning-soft p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-wb-warning">
            <AlertTriangle className="h-4 w-4" />
            <span>{t("publish.dialog.warnings")}</span>
          </div>
          <IssueRows issues={warnings} />
        </section>
      )}
    </div>
  );
}
