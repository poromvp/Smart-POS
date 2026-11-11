import test from "node:test";
import assert from "node:assert/strict";
import {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
} from "../src/lib/token-manager.ts";
import { customFetch } from "../src/lib/api.ts";
import { wsManager } from "../src/lib/websocket.ts";

// Set window global for node test environment
if (typeof (globalThis as any).window === "undefined") {
  (globalThis as any).window = globalThis;
}

test("customFetch automatically injects Authorization Bearer header", async () => {
  setAccessToken("my-access-token-123");

  const originalFetch = globalThis.fetch;
  let capturedHeaders: Headers | null = null;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedHeaders = new Headers(init?.headers);
    return new Response(JSON.stringify({ status: 200, data: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof globalThis.fetch;

  try {
    const res = await customFetch("/api/catalog/products/menu");
    assert.equal(res.status, 200);
    assert.ok(capturedHeaders);
    assert.equal(capturedHeaders.get("Authorization"), "Bearer my-access-token-123");
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test("customFetch intercepts HTTP 401, calls refresh, and replays request with new token", async () => {
  setAccessToken("expired-token");

  const originalFetch = globalThis.fetch;
  let callCount = 0;
  const recordedTokens: (string | null)[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString();
    const headers = new Headers(init?.headers);

    if (url.includes("/api/auth/refresh")) {
      // Refresh succeeds with new token
      return new Response(
        JSON.stringify({ accessToken: "fresh-new-token-456", expiresIn: 900 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    callCount++;
    recordedTokens.push(headers.get("Authorization"));

    if (callCount === 1) {
      // First attempt returns 401 Unauthorized
      return new Response(JSON.stringify({ message: "Expired JWT" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Replayed request returns 200 OK
    return new Response(JSON.stringify({ status: 200, data: "recovered" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof globalThis.fetch;

  try {
    const res = await customFetch("/api/catalog/categories");
    assert.equal(res.status, 200);
    assert.equal(callCount, 2);
    assert.equal(recordedTokens[0], "Bearer expired-token");
    assert.equal(recordedTokens[1], "Bearer fresh-new-token-456");
    assert.equal(getAccessToken(), "fresh-new-token-456");
    assert.equal(wsManager.getAuthToken(), "fresh-new-token-456");
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
    wsManager.setAuthToken(null);
  }
});

test("customFetch clears access token when refresh fails on 401", async () => {
  setAccessToken("invalid-token");
  wsManager.setAuthToken("invalid-token");

  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = input.toString();
    if (url.includes("/api/auth/refresh")) {
      return new Response(JSON.stringify({ message: "Session expired" }), {
        status: 401,
      });
    }
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }) as typeof globalThis.fetch;

  try {
    const res = await customFetch("/api/catalog/ingredients");
    assert.equal(res.status, 401);
    assert.equal(getAccessToken(), null);
    assert.equal(wsManager.getAuthToken(), null);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
    wsManager.setAuthToken(null);
  }
});
