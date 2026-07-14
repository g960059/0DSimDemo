import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { renderNoAvpdPassiveLvEdpvrV1 } from "@/tools/mechanics2/renderNoAvpdPassiveLvEdpvrV1";
import type { NoAvpdPassiveLvEdpvrArtifactV1 } from "@/tools/mechanics2/runNoAvpdPassiveLvEdpvrV1";

const artifactPath = resolve(
  process.cwd(),
  "data/mechanics2/reports/no-avpd-passive-lv-edpvr-v1.json",
);

describe("NoAvpdPassiveLvEdpvrV1 renderer", () => {
  it("renders four raw-point panels with explicit claim and RV warning boundaries", () => {
    const artifact = JSON.parse(
      readFileSync(artifactPath, "utf8"),
    ) as NoAvpdPassiveLvEdpvrArtifactV1;
    const rendered = renderNoAvpdPassiveLvEdpvrV1(artifact);

    expect(rendered).toContain('id="no-avpd-passive-lv-edpvr-v1"');
    for (const panel of ["lv-pv", "slope", "rv-volume", "septal-cap"]) {
      expect(rendered).toContain(`data-plot="${panel}"`);
    }
    expect(rendered).toContain("engineering-search-headroom-warning-only");
    expect(rendered).toContain("rawIndependentEquilibriumPoints");
    expect(rendered).toContain('"smoothingApplied":false');
    expect(rendered).toContain('"decimationApplied":false');
    expect(rendered).not.toContain("__NO_AVPD_PASSIVE_LV_EDPVR_DATA__");
  });

  it("rejects content changed after normalization", () => {
    const artifact = JSON.parse(
      readFileSync(artifactPath, "utf8"),
    ) as NoAvpdPassiveLvEdpvrArtifactV1;
    const changed = {
      ...artifact,
      artifactId: "changed-after-hash",
    } as unknown as NoAvpdPassiveLvEdpvrArtifactV1;

    expect(() => renderNoAvpdPassiveLvEdpvrV1(changed)).toThrow(
      /normalized hash/,
    );
  });
});
