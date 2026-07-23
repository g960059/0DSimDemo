import {
  SCIENTIFIC_PRODUCT_ALLOWLISTED_RELEASE_REFS_V1,
  resolveScientificProductReleaseBundleV1,
} from "@/components/scientificProduct";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

const reports = await Promise.all(
  SCIENTIFIC_PRODUCT_ALLOWLISTED_RELEASE_REFS_V1.map(async (releaseRef) => {
    const bundle = resolveScientificProductReleaseBundleV1(releaseRef);
    const computed = Object.fromEntries(
      await Promise.all(
        (["cases", "controls", "observables", "ui"] as const).map(
          async (slot) => [
            slot,
            await sha256CanonicalJsonHex(bundle.catalogs[slot]),
          ],
        ),
      ),
    );
    return {
      releaseRef,
      pinned: Object.fromEntries(
        (["cases", "controls", "observables", "ui"] as const).map(
          (slot) => [slot, bundle.catalogRefs[slot].sha256],
        ),
      ),
      computed,
    };
  }),
);

process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`);

const mismatches = reports.flatMap(({ releaseRef, pinned, computed }) =>
  Object.keys(computed).flatMap((slot) =>
    pinned[slot] === computed[slot]
      ? []
      : [`${releaseRef.id}@${releaseRef.version}:${slot}`]));

if (mismatches.length > 0) {
  throw new Error(
    `scientific product catalog SHA-256 mismatch: ${mismatches.join(", ")}`,
  );
}
