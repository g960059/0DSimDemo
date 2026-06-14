import React from "react";
import { renderToString } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import i18n from "@/i18n";
import {
  PublishStatusBadge,
  publishBadgeClassName,
  publishBadgeKind,
} from "@/components/workbench/PublishStatusBadge";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

describe("PublishStatusBadge", () => {
  it("maps missing or draft status to Draft", () => {
    expect(publishBadgeKind()).toBe("draft");
    expect(publishBadgeKind("draft", "private")).toBe("draft");
    expect(publishBadgeClassName("draft")).toContain("border-wb-line");
  });

  it("maps published visibility to Unlisted or Public", () => {
    expect(publishBadgeKind("published", "unlisted")).toBe("unlisted");
    expect(publishBadgeKind("published", "public")).toBe("public");
    expect(publishBadgeClassName("public")).toContain("border-wb-accent/40");
  });

  it("renders the localized badge label", () => {
    const html = renderToString(React.createElement(PublishStatusBadge, {
      status: "published",
      visibility: "unlisted",
      onClick: () => {},
    }));

    expect(html).toContain("Unlisted");
    expect(html).toContain("Publish settings");
  });
});
