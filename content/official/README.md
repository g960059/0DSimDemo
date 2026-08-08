# Official content source

This directory is reserved for reviewed, model-family-scoped CircleHeart
recipes. It intentionally contains no hand-authored Snapshot, exact `modelId`,
mutable release channel, checkpoint, or Snapshot-admission profile.

An official Experiment recipe contains stable Scenario identities, absolute
control assignments, an authored Experiment Surface, and optional model-owned
scientific assertion IDs. Validate a recipe with:

```sh
npm run verify:content:official-recipe -- --recipe content/official/<recipe>.json
```

Once a Standard exact-kernel manifest exists, resolve every authored control,
graph, capability, and assertion before starting expensive numerical work:

```sh
npm run verify:content:official-readiness -- \
  --recipe content/official/<recipe>.json \
  --kernel path/to/exact-kernel-or-client-descriptor.json \
  --surface path/to/model-surface.json
```

Readiness is not publication: it deliberately performs no settlement,
Snapshot admission, artifact emission, or database write.

The first Main Wire numerical runner is:

```sh
npm run build:content:official:main-wire -- \
  --recipe content/official/pv-loop-basics-v1.experiment.json \
  --output dist/official/pv-loop-basics-v1.build.json
```

It binds the validated recipe to the admitted local Standard exact model and
compatible Model Surface, starts from the release's registered default fixture,
settles and evaluates model-owned assertions, and passes the same Snapshot
admission service used by authoring. Build output and reports are generated
artifacts; recipe sources remain independent of the current `default` or
`research` pointer. It does not publish or write to the registry/database.

The first reviewed source is `pv-loop-basics-v1.experiment.json`. It is not a
published Snapshot and cannot be built against the legacy `development-36`
package because that package lacks the required primitive contractility
control. Its binding acceptance plan is
`docs/content/CONTENT-0001-pv-loop-basics-pilot.md`.

Recipe presence does not imply publication. A release is produced only after
the explicit Standard-ABI exact model, compatible Model Surface, executable
scientific assertions, and common Snapshot admission all pass.
