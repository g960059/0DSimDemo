import fs from "node:fs";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import net from "node:net";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "demo-hemosim-rules";
const RULES = fs.readFileSync("firestore.rules", "utf8");

let testEnv: RulesTestEnvironment;
let emulatorReady = false;

function emulatorHostAndPort() {
  const value = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
  const index = value.lastIndexOf(":");
  if (index < 0) return { host: value, port: 8080 };
  return { host: value.slice(0, index), port: Number(value.slice(index + 1)) };
}

function canConnectToEmulator(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(250);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

function rulesIt(name: string, fn: () => Promise<void>) {
  it(name, async (ctx) => {
    if (!emulatorReady) ctx.skip();
    await fn();
  });
}

function signedInDb(uid: string, emailVerified = true, email = `${uid}@example.com`) {
  return testEnv.authenticatedContext(uid, { email, email_verified: emailVerified }).firestore();
}

function anonymousDb() {
  return testEnv.unauthenticatedContext().firestore();
}

function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

function storedTimestamp(ms = 1) {
  return firebase.firestore.Timestamp.fromMillis(ms);
}

function caseData(ownerId: string, overrides: Record<string, unknown> = {}) {
  const now = serverTimestamp();
  return {
    title: "Normal vs AMI",
    description: "Compare baseline with AMI.",
    kind: "case",
    content: JSON.stringify({ meta: { id: "case-1" }, workspace: { schemaVersion: 2, hosts: { note: { open: false }, rightRail: { open: true }, metrics: { open: false }, main: {} } } }),
    status: "draft",
    visibility: "private",
    ownerId,
    schemaVersion: 1,
    defaultLocale: "en",
    availableLocales: ["en"],
    engineVersion: "hemosim-0d@0.0.0",
    knobMappingVersion: "knobs@1",
    workspaceSchemaVersion: 2,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function storedCaseData(ownerId: string, overrides: Record<string, unknown> = {}) {
  return caseData(ownerId, {
    createdAt: storedTimestamp(1),
    updatedAt: storedTimestamp(2),
    ...overrides,
  });
}

async function seedCase(id: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("cases").doc(id).set(data);
  });
}

beforeAll(async () => {
  const emulator = emulatorHostAndPort();
  emulatorReady = await canConnectToEmulator(emulator.host, emulator.port);
  if (!emulatorReady) return;
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { ...emulator, rules: RULES },
  });
});

beforeEach(async () => {
  if (!emulatorReady) return;
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

describe("firestore.rules cases collection", () => {
  rulesIt("allows a verified owner to create and update their private draft case", async () => {
    const owner = signedInDb("owner");
    const ref = owner.collection("cases").doc("case-1");

    await assertSucceeds(ref.set(caseData("owner")));

    const createdAt = (await ref.get()).data()?.createdAt;
    await assertSucceeds(ref.set(caseData("owner", {
      title: "Updated case",
      createdAt,
      updatedAt: serverTimestamp(),
    })));
  });

  rulesIt("rejects unverified users, invalid IDs, malformed cases, and oversized content", async () => {
    const missingWorkspaceSchemaVersion = caseData("owner");
    delete (missingWorkspaceSchemaVersion as Record<string, unknown>).workspaceSchemaVersion;
    const missingLocaleFields = caseData("owner");
    delete (missingLocaleFields as Record<string, unknown>).availableLocales;

    await assertFails(signedInDb("owner", false).collection("cases").doc("case-1").set(caseData("owner")));
    await assertFails(signedInDb("owner").collection("cases").doc("bad id").set(caseData("owner")));
    await assertFails(signedInDb("owner").collection("cases").doc("missing-field").set(missingWorkspaceSchemaVersion));
    await assertFails(signedInDb("owner").collection("cases").doc("missing-locale").set(missingLocaleFields));
    await assertFails(signedInDb("owner").collection("cases").doc("bad-locale").set(caseData("owner", {
      defaultLocale: "en",
      availableLocales: ["ja"],
    })));
    await assertFails(signedInDb("owner").collection("cases").doc("too-large").set(caseData("owner", {
      content: "x".repeat(500001),
    })));
  });

  rulesIt("prevents non-owners from reading or mutating private drafts", async () => {
    await seedCase("private-case", storedCaseData("owner"));

    await assertSucceeds(signedInDb("owner").collection("cases").doc("private-case").get());
    await assertFails(signedInDb("stranger").collection("cases").doc("private-case").get());
    await assertFails(anonymousDb().collection("cases").doc("private-case").get());
    await assertFails(signedInDb("stranger").collection("cases").doc("private-case").set(caseData("owner", {
      createdAt: storedTimestamp(1),
      updatedAt: serverTimestamp(),
    })));
    await assertFails(signedInDb("stranger").collection("cases").doc("private-case").delete());
  });

  rulesIt("rejects extra top-level fields and client-chosen timestamps", async () => {
    const owner = signedInDb("owner");

    await assertFails(owner.collection("cases").doc("extra-key").set(caseData("owner", {
      unexpected: true,
    })));
    await assertFails(owner.collection("cases").doc("bad-created-at").set(caseData("owner", {
      createdAt: storedTimestamp(100),
    })));
    await assertFails(owner.collection("cases").doc("bad-updated-at").set(caseData("owner", {
      updatedAt: storedTimestamp(100),
    })));

    await seedCase("timestamp-case", storedCaseData("owner"));
    await assertFails(owner.collection("cases").doc("timestamp-case").set(storedCaseData("owner", {
      updatedAt: storedTimestamp(100),
    })));
  });

  rulesIt("keeps ownerId and createdAt immutable on updates", async () => {
    const owner = signedInDb("owner");
    await seedCase("immutable-case", storedCaseData("owner"));

    await assertFails(owner.collection("cases").doc("immutable-case").set(storedCaseData("owner", {
      createdAt: storedTimestamp(999),
      updatedAt: serverTimestamp(),
    })));
    await assertFails(owner.collection("cases").doc("immutable-case").set(storedCaseData("other-owner", {
      createdAt: storedTimestamp(1),
      updatedAt: serverTimestamp(),
    })));
  });

  rulesIt("allows public published cases to be listed but keeps unlisted cases out of list queries", async () => {
    await seedCase("public-case", storedCaseData("owner", { status: "published", visibility: "public" }));
    await seedCase("unlisted-case", storedCaseData("owner", { status: "published", visibility: "unlisted" }));

    await assertSucceeds(anonymousDb().collection("cases").doc("public-case").get());
    await assertSucceeds(anonymousDb().collection("cases").doc("unlisted-case").get());
    await assertSucceeds(anonymousDb().collection("cases").where("visibility", "==", "public").where("status", "==", "published").get());
    await assertFails(anonymousDb().collection("cases").where("visibility", "==", "unlisted").where("status", "==", "published").get());
  });

  rulesIt("prevents non-owners from mutating public published cases", async () => {
    await seedCase("public-case", storedCaseData("owner", { status: "published", visibility: "public" }));

    await assertSucceeds(signedInDb("stranger").collection("cases").doc("public-case").get());
    await assertFails(signedInDb("stranger").collection("cases").doc("public-case").set(storedCaseData("owner", {
      status: "published",
      visibility: "public",
      createdAt: storedTimestamp(1),
      updatedAt: serverTimestamp(),
    })));
    await assertFails(signedInDb("stranger").collection("cases").doc("public-case").delete());
  });

  rulesIt("reserves official visibility for admins", async () => {
    await assertFails(signedInDb("owner").collection("cases").doc("official-case").set(caseData("owner", {
      status: "published",
      visibility: "official",
    })));

    await seedCase("private-case", storedCaseData("owner"));
    await assertFails(signedInDb("owner").collection("cases").doc("private-case").set(storedCaseData("owner", {
      status: "published",
      visibility: "official",
      createdAt: storedTimestamp(1),
      updatedAt: serverTimestamp(),
    })));

    const superAdmin = signedInDb("admin", true, "g960059@gmail.com");
    const officialRef = superAdmin.collection("cases").doc("official-case");
    await assertSucceeds(officialRef.set(caseData("admin", {
      status: "published",
      visibility: "official",
    })));

    const officialCreatedAt = (await officialRef.get()).data()?.createdAt;
    await assertSucceeds(officialRef.set(caseData("admin", {
      title: "Admin updated official case",
      status: "published",
      visibility: "official",
      createdAt: officialCreatedAt,
      updatedAt: serverTimestamp(),
    })));
  });
});
