import React from "react";
import { Link, type LinkProps } from "react-router-dom";
import { prefetchStudioPublicArticleV1 } from "@/studio/infrastructure/browser/StudioPublicArticleLoaderV1";

/** Warm only an intended public article, never editors or unpublished previews. */
export function PublicArticleLinkV1({ onPointerEnter, onFocus, ...props }: LinkProps) {
  const warm = () => {
    const pathname = typeof props.to === "string" ? props.to.split(/[?#]/)[0] : props.to.pathname;
    const match = /^\/(?:ja|en)\/articles\/([^/]+)$/.exec(pathname ?? "");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (match && !connection?.saveData) prefetchStudioPublicArticleV1(match[1]);
  };
  return <Link {...props}
    onPointerEnter={event => { onPointerEnter?.(event); if (!event.defaultPrevented && event.pointerType === "mouse") warm(); }}
    onFocus={event => { onFocus?.(event); if (!event.defaultPrevented) warm(); }} />;
}
