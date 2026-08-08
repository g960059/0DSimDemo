import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { routeOwnsApplicationChrome } from "@/components/Layout";
import { SiteAccountSessionProviderV3 } from "@/components/site/SiteAccountSessionV3";
import { SiteHeaderV3 } from "@/components/site/SiteHeaderV3";
import "@/i18n";

describe("site shell V3", () => {
  it("uses global chrome for discovery and Reader routes only", () => {
    expect(routeOwnsApplicationChrome("/")).toBe(false);
    expect(routeOwnsApplicationChrome("/articles")).toBe(false);
    expect(routeOwnsApplicationChrome("/articles/article-one")).toBe(false);
    expect(routeOwnsApplicationChrome("/me/articles")).toBe(false);
    expect(routeOwnsApplicationChrome("/me/experiments")).toBe(false);
    expect(routeOwnsApplicationChrome("/dev")).toBe(false);
    expect(routeOwnsApplicationChrome("/articles/new/edit")).toBe(true);
    expect(routeOwnsApplicationChrome("/articles/article-one/edit")).toBe(true);
    expect(routeOwnsApplicationChrome("/experiments/new")).toBe(true);
    expect(routeOwnsApplicationChrome("/experiments/experiment-one")).toBe(true);
    expect(routeOwnsApplicationChrome("/dev/model-lab")).toBe(true);
    expect(routeOwnsApplicationChrome("/dev/model-lab/")).toBe(true);
    expect(routeOwnsApplicationChrome("/snapshots/snapshot-one")).toBe(true);
  });

  it("shows the language switch only to anonymous visitors", () => {
    const anonymous = renderHeader(null);
    const authenticated = renderHeader({
      accountId: "account-one",
      displayName: "A. Author",
    });

    expect(anonymous).toContain('data-testid="anonymous-language-switch-v3"');
    expect(anonymous).toContain('data-testid="site-start-simulation-v3"');
    expect(anonymous).not.toContain('data-testid="site-create-trigger-v3"');
    expect(anonymous).toContain("/ja/login");
    expect(authenticated).not.toContain('data-testid="anonymous-language-switch-v3"');
    expect(authenticated).not.toContain('data-testid="site-start-simulation-v3"');
    expect(authenticated).toContain('data-testid="site-create-trigger-v3"');
    expect(authenticated).toContain('data-testid="site-profile-trigger-v3"');
  });
});

function renderHeader(
  account: Readonly<{
    accountId: string;
    displayName: string;
  }> | null,
): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={["/ja"]}>
      <SiteAccountSessionProviderV3 session={{ account }}>
        <SiteHeaderV3 />
      </SiteAccountSessionProviderV3>
    </MemoryRouter>,
  );
}
