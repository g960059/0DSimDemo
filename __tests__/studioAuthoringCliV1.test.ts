import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  createStudioAuthoringProfileV1,
  establishStudioAuthoringSessionV1,
  FileStudioAuthoringProfileStoreV1,
  MacOSKeychainAuthoringRefreshTokenStoreV1,
  readStudioAuthoringEnvironmentProjectV1,
  readStudioAuthoringHeadlessSessionV1,
  resolveStudioAuthoringProjectV1,
  revokeAndRemoveStudioAuthoringSessionV1,
  STUDIO_AUTHORING_KEYCHAIN_SERVICE_V1,
  type StudioAuthoringAuthSessionV1,
  type StudioAuthoringRefreshTokenStoreV1,
} from "@/studio/infrastructure/auth/StudioLocalAuthoringCredentialsV1";
import {
  assertStudioAuthoringAuthActionEnvironmentV1,
  classifyStudioAuthoringSignedOutReasonV1,
  parseStudioAuthoringAuthArgumentsV1,
  readStudioAuthoringProfileForAuthActionV1,
} from
  "@/tools/authoring/runStudioAuthoringAuthV1";
import { parseStudioAuthoringContentArgumentsV1 } from
  "@/tools/authoring/runStudioAuthoringCommandV1";
import { startStudioAuthoringLoopbackV1 } from
  "@/tools/authoring/StudioAuthoringLoopbackOAuthV1";
import { parseActiveModelBundleArgumentsV1 } from
  "@/tools/registry/activateModelBundleV1";

const SESSION_V1: StudioAuthoringAuthSessionV1 = Object.freeze({
  access_token: "access-token",
  refresh_token: "rotated-refresh-token",
  expires_at: 1_800_000_000,
  user: Object.freeze({
    id: "11111111-1111-4111-8111-111111111111",
    email: "author@example.com",
    is_anonymous: false,
  }),
});

describe("Studio authoring and release CLIs", () => {
  it("accepts only a publishable key for user-authorized authoring", () => {
    expect(readStudioAuthoringEnvironmentProjectV1({
      CIRCLEHEART_SUPABASE_URL: "https://example.supabase.co/path",
      CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    })).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    });

    for (const key of [
      "service_role",
      "sb_secret_example",
      "eyJhbGciOiJIUzI1NiJ9.legacy.service-role-jwt",
    ]) {
      expect(() => readStudioAuthoringEnvironmentProjectV1({
        CIRCLEHEART_SUPABASE_URL: "https://example.supabase.co",
        CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: key,
      })).toThrow(/sb_publishable_/);
    }
  });

  it("allows HTTPS and HTTP loopback projects but rejects other URL schemes", () => {
    for (const [url, expected] of [
      ["http://127.0.0.1:54321", "http://127.0.0.1:54321"],
      ["http://localhost:54321", "http://localhost:54321"],
      ["http://[::1]:54321", "http://[::1]:54321"],
    ] as const) {
      expect(readStudioAuthoringEnvironmentProjectV1({
        CIRCLEHEART_SUPABASE_URL: url,
        CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local",
      })?.url).toBe(expected);
    }
    expect(() => readStudioAuthoringEnvironmentProjectV1({
      CIRCLEHEART_SUPABASE_URL: "http://example.test",
      CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    })).toThrow(/HTTPS or loopback/);
    for (const url of ["ftp://127.0.0.1:54321", "ws://localhost:54321"]) {
      expect(() => readStudioAuthoringEnvironmentProjectV1({
        CIRCLEHEART_SUPABASE_URL: url,
        CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local",
      })).toThrow(/HTTPS or loopback/);
    }
  });

  it("requires headless access and refresh tokens as one explicit pair", () => {
    expect(readStudioAuthoringHeadlessSessionV1({})).toBeNull();
    expect(readStudioAuthoringHeadlessSessionV1({
      CIRCLEHEART_AUTHOR_ACCESS_TOKEN: "access",
      CIRCLEHEART_AUTHOR_REFRESH_TOKEN: "refresh",
    })).toEqual({ accessToken: "access", refreshToken: "refresh" });
    expect(() => readStudioAuthoringHeadlessSessionV1({
      CIRCLEHEART_AUTHOR_ACCESS_TOKEN: "access",
    })).toThrow(/both/);
  });

  it("round-trips non-secret profile metadata without storing a token", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "circleheart-author-"));
    try {
      const store = new FileStudioAuthoringProfileStoreV1(directory);
      const profile = createStudioAuthoringProfileV1({
        profileName: "official",
        project: {
          url: "https://example.supabase.co",
          publishableKey: "sb_publishable_example",
        },
        session: SESSION_V1,
        now: new Date("2026-08-11T00:00:00.000Z"),
      });
      store.write(profile);
      expect(store.read("official")).toEqual(profile);
      const raw = readFileSync(path.join(directory, "official.json"), "utf8");
      expect(raw).not.toContain(SESSION_V1.access_token);
      expect(raw).not.toContain(SESSION_V1.refresh_token);
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("puts the Keychain secret on stdin and never in command arguments", () => {
    const calls: Array<Readonly<{ args: readonly string[]; input?: string }>> = [];
    const store = new MacOSKeychainAuthoringRefreshTokenStoreV1((args, input) => {
      calls.push(Object.freeze({ args: [...args], input }));
      if (args[0] === "find-generic-password") {
        return { status: 0, stdout: "stored-refresh\n", stderr: "" };
      }
      return { status: 0, stdout: "", stderr: "" };
    });
    store.write("official", "new-refresh");
    expect(calls[0]?.args).toEqual([
      "add-generic-password",
      "-a", "official",
      "-s", STUDIO_AUTHORING_KEYCHAIN_SERVICE_V1,
      "-l", "CircleHeart authoring (official)",
      "-U",
      "-w",
    ]);
    expect(calls[0]?.args).not.toContain("new-refresh");
    expect(calls[0]?.input).toBe("new-refresh\nnew-refresh\n");
    expect(store.read("official")).toBe("stored-refresh");
    store.delete("official");
    const missing = new MacOSKeychainAuthoringRefreshTokenStoreV1(() => ({
      status: 44,
      stdout: "",
      stderr: "The specified item could not be found in the keychain.",
    }));
    expect(missing.read("official")).toBeNull();
  });

  it("rotates a Keychain refresh token before authoring may continue", async () => {
    const events: string[] = [];
    const refreshTokens: StudioAuthoringRefreshTokenStoreV1 = {
      read: () => {
        events.push("read");
        return "old-refresh";
      },
      write: (_profileName, value) => {
        events.push(`write:${value}`);
      },
      delete: () => undefined,
    };
    const auth = {
      setSession: vi.fn(),
      refreshSession: vi.fn(async () => {
        events.push("refresh");
        return { data: { session: SESSION_V1 }, error: null };
      }),
      signOut: vi.fn(),
    };
    const result = await establishStudioAuthoringSessionV1({
      auth,
      environment: {},
      profileName: "official",
      storedProfile: createStudioAuthoringProfileV1({
        profileName: "official",
        project: {
          url: "https://example.supabase.co",
          publishableKey: "sb_publishable_example",
        },
        session: SESSION_V1,
      }),
      refreshTokens,
    });
    expect(result.source).toBe("keychain");
    expect(events).toEqual([
      "read",
      "refresh",
      "write:rotated-refresh-token",
    ]);
    expect(auth.setSession).not.toHaveBeenCalled();
  });

  it("keeps the headless token pair as a non-persisted override", async () => {
    const refreshTokens = {
      read: vi.fn(),
      write: vi.fn(),
      delete: vi.fn(),
    };
    const auth = {
      setSession: vi.fn(async () => ({
        data: { session: SESSION_V1 },
        error: null,
      })),
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    };
    const result = await establishStudioAuthoringSessionV1({
      auth,
      environment: {
        CIRCLEHEART_AUTHOR_ACCESS_TOKEN: "headless-access",
        CIRCLEHEART_AUTHOR_REFRESH_TOKEN: "headless-refresh",
      },
      profileName: "default",
      storedProfile: null,
      refreshTokens,
    });
    expect(result.source).toBe("environment");
    expect(auth.setSession).toHaveBeenCalledWith({
      access_token: "headless-access",
      refresh_token: "headless-refresh",
    });
    expect(refreshTokens.read).not.toHaveBeenCalled();
    expect(refreshTokens.write).not.toHaveBeenCalled();
  });

  it("does not rotate a Keychain credential after a failed refresh", async () => {
    const refreshTokens = {
      read: () => "expired-refresh",
      write: vi.fn(),
      delete: vi.fn(),
    };
    await expect(establishStudioAuthoringSessionV1({
      auth: {
        setSession: vi.fn(),
        refreshSession: vi.fn(async () => ({
          data: { session: null },
          error: { message: "Invalid Refresh Token" },
        })),
        signOut: vi.fn(),
      },
      environment: {},
      profileName: "official",
      storedProfile: null,
      refreshTokens,
    })).rejects.toThrow(/author:login.*official/);
    expect(refreshTokens.write).not.toHaveBeenCalled();
  });

  it("rejects anonymous or profile-mismatched authoring sessions", async () => {
    const refreshTokens = {
      read: () => "refresh",
      write: vi.fn(),
      delete: vi.fn(),
    };
    await expect(establishStudioAuthoringSessionV1({
      auth: {
        setSession: vi.fn(),
        refreshSession: vi.fn(async () => ({
          data: {
            session: {
              ...SESSION_V1,
              user: { ...SESSION_V1.user, is_anonymous: true },
            },
          },
          error: null,
        })),
        signOut: vi.fn(),
      },
      environment: {},
      profileName: "default",
      storedProfile: null,
      refreshTokens,
    })).rejects.toThrow(/non-anonymous/);

    const profile = createStudioAuthoringProfileV1({
      profileName: "default",
      project: {
        url: "https://example.supabase.co",
        publishableKey: "sb_publishable_example",
      },
      session: SESSION_V1,
    });
    await expect(establishStudioAuthoringSessionV1({
      auth: {
        setSession: vi.fn(),
        refreshSession: vi.fn(async () => ({
          data: {
            session: {
              ...SESSION_V1,
              user: { ...SESSION_V1.user, id: "other-user" },
            },
          },
          error: null,
        })),
        signOut: vi.fn(),
      },
      environment: {},
      profileName: "default",
      storedProfile: profile,
      refreshTokens,
    })).rejects.toThrow(/does not match/);
  });

  it("resolves saved project metadata unless an explicit project conflicts", () => {
    const profile = createStudioAuthoringProfileV1({
      profileName: "official",
      project: {
        url: "https://example.supabase.co",
        publishableKey: "sb_publishable_example",
      },
      session: SESSION_V1,
    });
    expect(resolveStudioAuthoringProjectV1({
      environment: {},
      storedProfile: profile,
      allowProfileReplacement: false,
    })).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    });
    expect(() => resolveStudioAuthoringProjectV1({
      environment: {
        CIRCLEHEART_SUPABASE_URL: "https://other.supabase.co",
        CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_other",
      },
      storedProfile: profile,
      allowProfileReplacement: false,
    })).toThrow(/does not match/);
  });

  it("revokes the current CLI session and always removes its local credential", async () => {
    const events: string[] = [];
    const refreshTokens: StudioAuthoringRefreshTokenStoreV1 = {
      read: () => "refresh",
      write: vi.fn(),
      delete: () => events.push("delete"),
    };
    const profile = createStudioAuthoringProfileV1({
      profileName: "official",
      project: {
        url: "https://example.supabase.co",
        publishableKey: "sb_publishable_example",
      },
      session: SESSION_V1,
    });
    const revoked = await revokeAndRemoveStudioAuthoringSessionV1({
      auth: {
        setSession: vi.fn(),
        refreshSession: vi.fn(async () => {
          events.push("refresh");
          return { data: { session: SESSION_V1 }, error: null };
        }),
        signOut: vi.fn(async () => {
          events.push("signOut");
          return { error: null };
        }),
      },
      profileName: "official",
      storedProfile: profile,
      refreshTokens,
    });
    expect(revoked).toEqual({ remoteRevoked: true });
    expect(events).toEqual(["refresh", "signOut", "delete"]);

    const offlineEvents: string[] = [];
    const offline = await revokeAndRemoveStudioAuthoringSessionV1({
      auth: {
        setSession: vi.fn(),
        refreshSession: vi.fn(async () => {
          throw new Error("offline");
        }),
        signOut: vi.fn(),
      },
      profileName: "official",
      storedProfile: profile,
      refreshTokens: {
        read: () => "refresh",
        write: vi.fn(),
        delete: () => offlineEvents.push("delete"),
      },
    });
    expect(offline).toEqual({ remoteRevoked: false });
    expect(offlineEvents).toEqual(["delete"]);
  });

  it("parses auth and content profile selection without ambiguity", () => {
    expect(parseStudioAuthoringAuthArgumentsV1([
      "login", "--profile", "official", "--no-open",
    ])).toEqual({
      action: "login",
      profileName: "official",
      openBrowser: false,
    });
    expect(parseStudioAuthoringAuthArgumentsV1(["status"])).toEqual({
      action: "status",
      profileName: "default",
      openBrowser: true,
    });
    expect(() => parseStudioAuthoringAuthArgumentsV1([
      "status", "--no-open",
    ])).toThrow(/Usage/);
    expect(parseStudioAuthoringContentArgumentsV1([
      "--profile", "official", "--command", "command.json",
    ])).toEqual({
      commandPath: path.resolve(process.cwd(), "command.json"),
      profileName: "official",
    });
    expect(() => parseStudioAuthoringContentArgumentsV1([
      "--command", "a.json", "--command", "b.json",
    ])).toThrow(/Usage/);
    expect(() => parseStudioAuthoringContentArgumentsV1([
      "--command", "--profile",
    ])).toThrow(/Usage/);
  });

  it("fails before OAuth off macOS and never misreports headless logout", () => {
    expect(() => assertStudioAuthoringAuthActionEnvironmentV1(
      { action: "login", profileName: "default", openBrowser: true },
      {},
      "linux",
    )).toThrow(/requires macOS Keychain/);
    expect(() => assertStudioAuthoringAuthActionEnvironmentV1(
      { action: "login", profileName: "default", openBrowser: true },
      {},
      "darwin",
    )).not.toThrow();
    expect(() => assertStudioAuthoringAuthActionEnvironmentV1(
      { action: "logout", profileName: "default", openBrowser: true },
      {
        CIRCLEHEART_AUTHOR_ACCESS_TOKEN: "access",
        CIRCLEHEART_AUTHOR_REFRESH_TOKEN: "refresh",
      },
      "darwin",
    )).toThrow(/cannot revoke.*headless/);
    expect(() => assertStudioAuthoringAuthActionEnvironmentV1(
      { action: "login", profileName: "default", openBrowser: true },
      {
        CIRCLEHEART_AUTHOR_ACCESS_TOKEN: "access",
        CIRCLEHEART_AUTHOR_REFRESH_TOKEN: "refresh",
      },
      "darwin",
    )).toThrow(/headless token override is active/);
  });

  it("reports ordinary signed-out states without treating them as CLI failures", () => {
    expect(classifyStudioAuthoringSignedOutReasonV1({
      hasHeadlessSession: false,
      hasProfile: false,
      hasRefreshToken: false,
    })).toBe("profile-not-found");
    expect(classifyStudioAuthoringSignedOutReasonV1({
      hasHeadlessSession: false,
      hasProfile: true,
      hasRefreshToken: false,
    })).toBe("credential-not-found");
    expect(classifyStudioAuthoringSignedOutReasonV1({
      hasHeadlessSession: true,
      hasProfile: false,
      hasRefreshToken: false,
    })).toBeNull();
  });

  it("lets logout remove a credential even when profile metadata is corrupt", () => {
    const remove = vi.fn();
    expect(readStudioAuthoringProfileForAuthActionV1({
      action: "logout",
      profileName: "official",
      profiles: { read: () => { throw new Error("corrupt"); }, write: vi.fn() },
      refreshTokens: { read: vi.fn(), write: vi.fn(), delete: remove },
    })).toBeNull();
    expect(remove).toHaveBeenCalledWith("official");
    expect(() => readStudioAuthoringProfileForAuthActionV1({
      action: "status",
      profileName: "official",
      profiles: { read: () => { throw new Error("corrupt"); }, write: vi.fn() },
      refreshTokens: { read: vi.fn(), write: vi.fn(), delete: vi.fn() },
    })).toThrow(/corrupt/);
  });

  it("ignores other loopback paths before receiving the exact PKCE callback", async () => {
    const callback = await startStudioAuthoringLoopbackV1({
      port: 0,
      timeoutMs: 5_000,
    });
    const code = callback.waitForCode();
    const other = await fetch(new URL("/other?code=wrong", callback.redirectUrl));
    expect(other.status).toBe(404);
    const response = await fetch(`${callback.redirectUrl}?code=oauth-code`);
    expect(response.status).toBe(200);
    await expect(code).resolves.toBe("oauth-code");
  });

  it("keeps waiting after a no-code request to the exact callback path", async () => {
    const callback = await startStudioAuthoringLoopbackV1({
      port: 0,
      timeoutMs: 5_000,
    });
    const code = callback.waitForCode();
    expect((await fetch(callback.redirectUrl)).status).toBe(400);
    expect((await fetch(`${callback.redirectUrl}?code=real-code`)).status).toBe(200);
    await expect(code).resolves.toBe("real-code");
  });

  it("surfaces an OAuth callback error and closes the loopback listener", async () => {
    const callback = await startStudioAuthoringLoopbackV1({
      port: 0,
      timeoutMs: 5_000,
    });
    const code = callback.waitForCode().then(
      (value) => ({ value, error: null }),
      (error: unknown) => ({ value: null, error }),
    );
    const response = await fetch(
      `${callback.redirectUrl}?error_description=access_denied`,
    );
    expect(response.status).toBe(400);
    const result = await code;
    expect(result.value).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toMatch(/access_denied/);
  });

  it("removes terminal control characters from an OAuth callback error", async () => {
    const callback = await startStudioAuthoringLoopbackV1({
      port: 0,
      timeoutMs: 5_000,
    });
    const code = callback.waitForCode().catch((error: unknown) => error);
    const response = await fetch(
      `${callback.redirectUrl}?error_description=${encodeURIComponent("denied\u001b[31m")}`,
    );
    expect(response.status).toBe(400);
    await expect(code).resolves.toMatchObject({ message: "denied [31m" });
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
