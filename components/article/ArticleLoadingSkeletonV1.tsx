import React from "react";
import { useTranslation } from "react-i18next";

/** Shared by route loading and article fetching, in the Reader's own column. */
export function ArticleLoadingSkeletonV1() {
  const { t } = useTranslation();
  return (
    <div className="h-full overflow-y-auto bg-wb-app text-wb-text" role="status"
      aria-label={t("articleReader.loading")} aria-busy="true" data-testid="article-loading-skeleton">
      <span className="sr-only">{t("articleReader.loading")}</span>
      <div className="article-document-shell" aria-hidden="true">
        <div className="article-loading-skeleton">
          <div className="article-document-header">
            <div className="article-skeleton-bar article-skeleton-title" style={{ width: "88%" }} />
            <div className="article-skeleton-bar article-skeleton-title mt-3" style={{ width: "62%" }} />
            <div className="mt-6 flex items-center gap-3">
              <div className="article-skeleton-bar h-7 w-7 rounded-full" />
              <div className="article-skeleton-bar h-3 w-28" />
              <div className="article-skeleton-bar ml-2 h-3 w-20" />
            </div>
          </div>
          <div className="space-y-4">
            {[100, 96, 100, 83].map((width, index) =>
              <div key={index} className="article-skeleton-bar h-3" style={{ width: `${width}%` }} />)}
          </div>
          <div className="article-skeleton-bar mb-7 mt-14 h-6 w-2/5" />
          <div className="space-y-4">
            {[100, 94, 100, 72].map((width, index) =>
              <div key={index} className="article-skeleton-bar h-3" style={{ width: `${width}%` }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
