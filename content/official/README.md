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

The future build command binds a validated recipe to an explicitly selected
exact model and compatible Model Surface, starts from the release's registered
default fixture, captures through the normal Worker path, and passes the same
Snapshot admission service used by user authoring. Build output and reports are
generated artifacts; recipe sources remain independent of the current
`default` or `research` pointer.

No official Preset, Experiment, or Article is seeded here until its numerical
and editorial review is ready.
