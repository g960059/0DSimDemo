import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createStudioPublicContentDataSourceV1,
  readStudioPublicContentServerConfigurationV1,
} from "@/server/StudioPublicContentDataSourceV1";
import {
  handleStudioPublicContentRequestV1,
} from "@/server/StudioPublicContentHandlerV1";

async function mainV1(): Promise<void> {
  const configuration = readStudioPublicContentServerConfigurationV1();
  const clientTemplate = await readFile(
    resolve(process.cwd(), process.env.CIRCLEHEART_CLIENT_TEMPLATE ?? "dist/index.html"),
    "utf8",
  );
  const dataSource = createStudioPublicContentDataSourceV1(configuration);
  const port = parsePortV1(process.env.PORT);

  const server = createServer(async (incoming, outgoing) => {
  try {
    const request = new Request(
      new URL(incoming.url ?? "/", `http://${incoming.headers.host ?? "localhost"}`),
      {
        method: incoming.method ?? "GET",
        headers: incomingHeadersV1(incoming.headers),
      },
    );
    const response = await handleStudioPublicContentRequestV1(request, {
      canonicalOrigin: configuration.canonicalOrigin,
      clientTemplate,
      dataSource,
    });
    outgoing.statusCode = response.status;
    response.headers.forEach((value, key) => outgoing.setHeader(key, value));
    if (request.method === "HEAD" || response.body === null) {
      outgoing.end();
      return;
    }
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("Public content request failed", error);
    outgoing.statusCode = 500;
    outgoing.setHeader("Content-Type", "text/plain; charset=utf-8");
    outgoing.setHeader("Cache-Control", "no-store");
    outgoing.end("Public content is temporarily unavailable.\n");
  }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`CircleHeart public content server listening on ${port}`);
  });
}

void mainV1().catch((error) => {
  console.error("Public content server failed to start", error);
  process.exitCode = 1;
});

function incomingHeadersV1(
  incoming: Readonly<Record<string, string | readonly string[] | undefined>>,
): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, item);
    } else {
      headers.set(name, value as string);
    }
  }
  return headers;
}

function parsePortV1(value: string | undefined): number {
  const port = value === undefined ? 8080 : Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer within [1, 65535]");
  }
  return port;
}
