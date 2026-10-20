import type { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@example-app/api";
import { matchAllowedOrigin, parseOriginList } from "@example-app/shared";

import { auth } from "~/auth/server";
import { env } from "~/env";

/**
 * CORS allow-list for the tRPC endpoint: the app's own origin
 * (NEXT_PUBLIC_BASE_URL) plus any http(s) origins in TRUSTED_ORIGINS. Other
 * origins get no CORS headers, so browsers block cross-origin reads. Native
 * mobile clients don't send an Origin header and are unaffected.
 */
let allowedOrigins: string[] | undefined;
const getAllowedOrigins = () => {
  if (!allowedOrigins) {
    const origins = parseOriginList(env.TRUSTED_ORIGINS).filter((origin) =>
      /^https?:\/\/[^*]+$/i.test(origin),
    );
    try {
      origins.unshift(new URL(env.NEXT_PUBLIC_BASE_URL).origin);
    } catch {
      // NEXT_PUBLIC_BASE_URL unset/invalid (only possible with
      // SKIP_ENV_VALIDATION) — fall back to the TRUSTED_ORIGINS list.
    }
    allowedOrigins = origins;
  }
  return allowedOrigins;
};

const setCorsHeaders = (req: Request, res: Response) => {
  res.headers.append("Vary", "Origin");
  const origin = matchAllowedOrigin(
    req.headers.get("origin"),
    getAllowedOrigins(),
  );
  if (!origin) return;
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "content-type, authorization, trpc-accept, x-trpc-source",
  );
  res.headers.set("Access-Control-Max-Age", "600");
};

export const OPTIONS = (req: NextRequest) => {
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(req, response);
  return response;
};

const handler = async (req: NextRequest) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        auth: auth,
        headers: req.headers,
      }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

  setCorsHeaders(req, response);
  return response;
};

export { handler as GET, handler as POST };
