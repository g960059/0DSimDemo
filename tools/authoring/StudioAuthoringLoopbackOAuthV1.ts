import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";

export const STUDIO_AUTHORING_LOGIN_PORT_V1 = 43921 as const;
export const STUDIO_AUTHORING_LOGIN_PATH_V1 = "/auth/callback" as const;

export type StudioAuthoringLoopbackV1 = Readonly<{
  redirectUrl: string;
  waitForCode(): Promise<string>;
  close(): Promise<void>;
}>;

export async function startStudioAuthoringLoopbackV1(input: Readonly<{
  port?: number;
  timeoutMs?: number;
}> = {}): Promise<StudioAuthoringLoopbackV1> {
  const port = input.port ?? STUDIO_AUTHORING_LOGIN_PORT_V1;
  const timeoutMs = input.timeoutMs ?? 5 * 60_000;
  if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) {
    throw new Error("Authoring login port must be a valid TCP port");
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000) {
    throw new Error("Authoring login timeout is invalid");
  }

  let resolveCode: ((value: string) => void) | undefined;
  let rejectCode: ((reason: Error) => void) | undefined;
  let consumed = false;
  const code = new Promise<string>((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });
  let callbackPort = port;
  const server = createServer((request, response) => {
    if (request.method !== "GET" || request.url === undefined) {
      response.writeHead(404).end();
      return;
    }
    const url = new URL(request.url, `http://127.0.0.1:${callbackPort}`);
    if (url.pathname !== STUDIO_AUTHORING_LOGIN_PATH_V1 || consumed) {
      response.writeHead(404).end();
      return;
    }
    const error = url.searchParams.get("error_description")
      ?? url.searchParams.get("error");
    const authCode = url.searchParams.get("code");
    if (error !== null) {
      consumed = true;
      response.writeHead(400, { "content-type": "text/html; charset=utf-8" });
      response.end(callbackHtmlV1(false));
      rejectCode?.(new Error(safeOAuthCallbackErrorV1(error)));
      return;
    }
    if (authCode === null || authCode.length === 0) {
      // A stray request to the known loopback URL must not cancel the real
      // PKCE callback that is still pending in the browser.
      response.writeHead(400, { "content-type": "text/html; charset=utf-8" });
      response.end(callbackHtmlV1(false));
      return;
    }
    consumed = true;
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
      "content-type": "text/html; charset=utf-8",
    });
    response.end(callbackHtmlV1(true));
    resolveCode?.(authCode);
  });
  callbackPort = await listenV1(server, port);
  const timer = setTimeout(() => {
    rejectCode?.(new Error("Authoring login timed out"));
    server.close();
  }, timeoutMs);
  timer.unref();
  const close = async () => {
    clearTimeout(timer);
    await closeServerV1(server);
  };
  return Object.freeze({
    redirectUrl: `http://127.0.0.1:${callbackPort}${STUDIO_AUTHORING_LOGIN_PATH_V1}`,
    waitForCode: () => code.finally(close),
    close,
  });
}

export function openStudioAuthoringBrowserV1(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Authoring login URL must be HTTP(S)");
  }
  if (process.platform !== "darwin") {
    throw new Error("Interactive authoring login currently supports macOS only");
  }
  const child = spawn("open", [parsed.href], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

function safeOAuthCallbackErrorV1(value: string): string {
  const printable = value.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").trim();
  return printable.length === 0
    ? "Authoring login was rejected"
    : printable.slice(0, 240);
}

function listenV1(server: Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(new Error(`Authoring login callback could not listen: ${error.message}`));
    };
    const onListening = () => {
      server.off("error", onError);
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("Authoring login callback has no TCP address"));
        return;
      }
      resolve(address.port);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "127.0.0.1");
  });
}

function closeServerV1(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server.listening) {
      resolve();
      return;
    }
    server.close((error) => error === undefined ? resolve() : reject(error));
  });
}

function callbackHtmlV1(success: boolean): string {
  return `<!doctype html><meta charset="utf-8"><title>CircleHeart authoring</title><style>body{font:16px system-ui;margin:48px;color:#202124}main{max-width:560px;margin:auto}h1{font-size:24px}</style><main><h1>${success ? "Authorization received" : "CircleHeart CLI sign-in failed"}</h1><p>${success ? "Return to the terminal while CircleHeart completes sign-in." : "Return to the terminal for details."}</p></main>`;
}
