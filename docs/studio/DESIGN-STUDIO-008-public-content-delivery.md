# DESIGN-STUDIO-008: Public content delivery boundary

Status: active cross-cutting contract

Public educational content has a server-readable boundary. Private authoring,
the Workbench, and numerical Workers remain client-owned. Source configuration
owns current routes, regions, cache durations, cookies, and deployment
commands.

## One content authority

Canonical HTML, machine-readable representations, and the interactive Reader
must derive from the same validated published Article content. They carry the
same immutable content identity and cannot maintain parallel editorial models.

Interactive Experiment Placements have a semantic static representation in the
first response. Client hydration may replace that representation with the live
Reader only after the interactive projection is ready; a slow or failed bundle
must not erase readable public content.

## Trust boundary

The public render tier uses anonymous, publication-filtered reads only. It
cannot use service-role authority, expose drafts, perform numerical admission,
or mutate content. Publication and anonymous visibility remain database
decisions.

Locale negotiation, canonical redirects, cache keys, and alternate
representations are delivery concerns. They must preserve query intent where
appropriate, distinguish missing/unpublished content from canonical redirects,
and never use an authentication credential as a locale hint.

## Cache and rendering invariants

- Cached bytes are a projection of immutable published content, not content
  authority.
- Representation and renderer revisions participate in cache invalidation.
- Account-specific chrome may appear only after browser authentication and
  must not change the public Article body.
- Public rendering must not execute the numerical model merely to make prose
  discoverable.
- Private editor and preview routes must never be admitted by the anonymous
  public renderer.

Future pre-rendering or immutable object materialization may replace
on-demand rendering, but it must reuse the same validated block renderer and
content identity. It must not introduce another Article schema, publication
state, or Snapshot reference model.
