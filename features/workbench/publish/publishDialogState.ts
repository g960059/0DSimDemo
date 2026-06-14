import type { CaseDocument, CaseStatus, CaseVisibility } from "@/caseDoc";
import {
  applyPublishDraft,
  derivePublishDefaultEntry,
  isPublishable,
  validatePublishableCase,
  type PublishIssue,
} from "@/features/workbench/casePublish";
import { canUseReadExplore, type ReadExploreMode } from "@/features/workbench/readExplore";

export type PublishDialogVisibility = Extract<CaseVisibility, "unlisted" | "public">;

export type PublishDialogDraft = {
  visibility: PublishDialogVisibility;
  defaultEntry: ReadExploreMode;
};

export type PublishDialogState = {
  draft: PublishDialogDraft;
  reviewDoc: CaseDocument;
  canRead: boolean;
  readDisabled: boolean;
  reviewEnabled: true;
  blockers: PublishIssue[];
  warnings: PublishIssue[];
  issues: PublishIssue[];
  canPublish: boolean;
};

export function deriveInitialPublishDialogDraft(
  doc: CaseDocument,
  current?: { status?: CaseStatus; visibility?: CaseVisibility },
): PublishDialogDraft {
  const visibility = current?.status === "published" && (current.visibility === "public" || current.visibility === "unlisted")
    ? current.visibility
    : "unlisted";
  return {
    visibility,
    defaultEntry: doc.defaultEntry ?? derivePublishDefaultEntry(doc),
  };
}

export function derivePublishDialogState(baseDoc: CaseDocument, draft: PublishDialogDraft): PublishDialogState {
  const canRead = canUseReadExplore(baseDoc);
  const defaultEntry = draft.defaultEntry === "read" && !canRead ? "explore" : draft.defaultEntry;
  const reviewDoc = applyPublishDraft(baseDoc, {
    status: "published",
    visibility: draft.visibility,
    defaultEntry,
  });
  const issues = validatePublishableCase(reviewDoc);
  return {
    draft: { visibility: draft.visibility, defaultEntry },
    reviewDoc,
    canRead,
    readDisabled: !canRead,
    reviewEnabled: true,
    blockers: issues.filter((issue) => issue.severity === "blocker"),
    warnings: issues.filter((issue) => issue.severity === "warning"),
    issues,
    canPublish: isPublishable(issues),
  };
}
