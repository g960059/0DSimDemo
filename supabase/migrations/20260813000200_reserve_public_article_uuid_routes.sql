-- UUID-shaped slugs would make one Article's canonical slug indistinguishable
-- from another Article's legacy UUID alias. Reserve that namespace before the
-- dual-key resolver is exposed.

ALTER TABLE studio.article_publications
  DROP CONSTRAINT article_publications_slug;

ALTER TABLE studio.article_publications
  ADD CONSTRAINT article_publications_slug CHECK (
    public_slug ~ '^[a-z0-9][a-z0-9-]{2,95}$'
    AND public_slug !~
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );
