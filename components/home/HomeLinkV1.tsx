import React from "react";
import { useInRouterContext } from "react-router-dom";
import { PublicArticleLinkV1 } from "@/components/article/PublicArticleLinkV1";

/** Crawlable static links; route transitions and article warming in the app. */
export function HomeLinkV1({ href, ...props }: React.ComponentProps<"a">) {
  const inRouter = useInRouterContext();
  return inRouter && href?.startsWith("/") && !href.startsWith("//")
    ? <PublicArticleLinkV1 {...props} to={href} />
    : <a {...props} href={href} />;
}
