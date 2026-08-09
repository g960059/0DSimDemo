import { describe, expect, it } from "vitest";

import { readAuthoringConfigurationV1 } from
  "@/tools/authoring/runStudioAuthoringCommandV1";
import { parseActiveModelBundleArgumentsV1 } from
  "@/tools/registry/activateModelBundleV1";

describe("Studio authoring and release CLIs", () => {
  it("accepts only a publishable key for user-authorized authoring", () => {
    expect(readAuthoringConfigurationV1({
      CIRCLEHEART_SUPABASE_URL: "https://example.supabase.co/path",
      CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      CIRCLEHEART_AUTHOR_ACCESS_TOKEN: "access-token",
      CIRCLEHEART_AUTHOR_REFRESH_TOKEN: "refresh-token",
    })).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    for (const key of [
      "service_role",
      "sb_secret_example",
      "eyJhbGciOiJIUzI1NiJ9.legacy.service-role-jwt",
    ]) {
      expect(() => readAuthoringConfigurationV1({
        CIRCLEHEART_SUPABASE_URL: "https://example.supabase.co",
        CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: key,
        CIRCLEHEART_AUTHOR_ACCESS_TOKEN: "access-token",
        CIRCLEHEART_AUTHOR_REFRESH_TOKEN: "refresh-token",
      })).toThrow(/sb_publishable_/);
    }
  });

  it("allows HTTPS and local development origins but rejects cleartext remote URLs", () => {
    expect(readAuthoringConfigurationV1({
      CIRCLEHEART_SUPABASE_URL: "http://127.0.0.1:54321",
      CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local",
      CIRCLEHEART_AUTHOR_ACCESS_TOKEN: "access-token",
      CIRCLEHEART_AUTHOR_REFRESH_TOKEN: "refresh-token",
    }).url).toBe("http://127.0.0.1:54321");
    expect(() => readAuthoringConfigurationV1({
      CIRCLEHEART_SUPABASE_URL: "http://example.test",
      CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      CIRCLEHEART_AUTHOR_ACCESS_TOKEN: "access-token",
      CIRCLEHEART_AUTHOR_REFRESH_TOKEN: "refresh-token",
    })).toThrow(/HTTPS or loopback/);
  });

  it("parses an atomic active-bundle CAS target", () => {
    const base = [
      "--project-ref", "abcdefghijklmnopqrst",
      "--model-id", "model/example-v1",
      "--surface-release-id", "surface/example-v1",
      "--expected-version",
    ] as const;
    expect(parseActiveModelBundleArgumentsV1([...base, "none"]))
      .toMatchObject({ expectedVersion: null });
    expect(parseActiveModelBundleArgumentsV1([...base, "7"]))
      .toMatchObject({ expectedVersion: 7 });
    expect(() => parseActiveModelBundleArgumentsV1([...base, "-1"]))
      .toThrow(/Usage/);
  });
});
