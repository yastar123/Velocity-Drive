import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import express from "express";
import { IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";

// Initialize ExpressJS application
const app = express();
app.use(express.json());

// Express API endpoint to check health & verify ExpressJS + PostgreSQL connectivity
app.get("/api/health", async (req, res) => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("profiles").select("id").limit(1);

    if (error) {
      throw error;
    }

    res.json({
      status: "healthy",
      frameworks: ["ReactJS", "ExpressJS"],
      database: "PostgreSQL (Connected)",
      verified: true,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Database connection check failed:", err);
    res.status(500).json({
      status: "unhealthy",
      frameworks: ["ReactJS", "ExpressJS"],
      database: "PostgreSQL (Connection Error)",
      error: errMsg,
      verified: false,
    });
  }
});

// Express API endpoint to fetch server-side stats from the PostgreSQL database
app.get("/api/stats", async (req, res) => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch count of users, deposits, and withdrawal requests
    const [profilesRes, depositsRes, withdrawsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("deposit_requests").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("withdraw_requests").select("id", { count: "exact", head: true }),
    ]);

    res.json({
      success: true,
      backend: "ExpressJS Server",
      database: "PostgreSQL via Drizzle/Supabase",
      stats: {
        total_investors: profilesRes.count ?? 0,
        total_deposits: depositsRes.count ?? 0,
        total_withdrawals: withdrawsRes.count ?? 0,
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch stats:", err);
    res.status(500).json({
      success: false,
      error: errMsg,
    });
  }
});

// Helper to convert Web API Request to Node.js IncomingMessage (for Express router)
function buildIncomingMessage(request: Request): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);

    req.method = request.method;
    const urlObj = new URL(request.url);
    req.url = urlObj.pathname + urlObj.search;

    request.headers.forEach((value, key) => {
      req.headers[key] = value;
    });

    if (request.body) {
      const reader = request.body.getReader();
      const push = async () => {
        try {
          const { done, value } = await reader.read();
          if (done) {
            req.push(null);
          } else {
            req.push(Buffer.from(value));
            await push();
          }
        } catch (err) {
          reject(err);
        }
      };
      push();
    } else {
      req.push(null);
    }

    resolve(req);
  });
}

// Helper to run Express router and capture response to return as Web API Response
function runExpress(req: IncomingMessage, res: ServerResponse): Promise<Response> {
  return new Promise((resolve) => {
    let responseStatus = 200;
    const responseHeaders: Record<string, string> = {};
    const responseChunks: (string | Buffer | Uint8Array)[] = [];

    res.writeHead = function (
      status: number,
      headers?: Record<string, string | string[] | undefined>,
    ) {
      responseStatus = status;
      if (headers) {
        Object.entries(headers).forEach(([k, v]) => {
          responseHeaders[k] = String(v ?? "");
        });
      }
      return this;
    };

    res.setHeader = function (name: string, value: string | string[] | number) {
      responseHeaders[name.toLowerCase()] = String(value);
      return this;
    };

    res.write = function (
      chunk: string | Uint8Array,
      encodingOrCb?: string | ((err?: Error | null) => void),
      cb?: (err?: Error | null) => void,
    ) {
      responseChunks.push(chunk);
      if (typeof encodingOrCb === "function") encodingOrCb();
      if (cb) cb();
      return true;
    };

    res.end = function (
      chunk?: string | Uint8Array,
      encodingOrCb?: string | (() => void),
      cb?: () => void,
    ) {
      if (chunk) {
        responseChunks.push(chunk);
      }
      if (typeof encodingOrCb === "function") encodingOrCb();
      if (cb) cb();

      const body = Buffer.concat(
        responseChunks.map((c) => (typeof c === "string" ? Buffer.from(c) : c)),
      );
      resolve(
        new Response(body, {
          status: responseStatus,
          headers: responseHeaders,
        }),
      );
      return this;
    };

    app(req, res);
  });
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (isH3SwallowedErrorBody(body)) {
    console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return response;
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    // Dispatch all /api/* requests to ExpressJS app
    if (url.pathname.startsWith("/api/")) {
      try {
        const req = await buildIncomingMessage(request);
        const res = new ServerResponse(req);
        return await runExpress(req, res);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("Express routing error:", err);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: errMsg }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // Delegate non-API requests to TanStack Start/ReactJS renderer
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
