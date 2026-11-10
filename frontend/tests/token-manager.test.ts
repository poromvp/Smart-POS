import test from "node:test";
import assert from "node:assert/strict";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  parseJwtPayload,
  isTokenExpired,
} from "../src/lib/token-manager.ts";

test("TokenManager set, get and clear token in memory", () => {
  clearAccessToken();
  assert.equal(getAccessToken(), null);

  setAccessToken("test-token-123");
  assert.equal(getAccessToken(), "test-token-123");

  clearAccessToken();
  assert.equal(getAccessToken(), null);
});

test("TokenManager parseJwtPayload decodes payload claims correctly", () => {
  // Construct a standard JWT with { sub: "admin", userId: 1, role: "ADMIN", permissions: ["USER_READ"], exp: 2000000000 }
  const payloadObj = {
    sub: "admin",
    userId: 1,
    fullName: "System Admin",
    role: "ADMIN",
    permissions: ["USER_READ", "ORDER_READ"],
    exp: 2000000000,
  };
  const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const fakeJwt = `header.${base64Payload}.signature`;

  const parsed = parseJwtPayload(fakeJwt);
  assert.ok(parsed);
  assert.equal(parsed.sub, "admin");
  assert.equal(parsed.userId, 1);
  assert.equal(parsed.fullName, "System Admin");
  assert.equal(parsed.role, "ADMIN");
  assert.deepEqual(parsed.permissions, ["USER_READ", "ORDER_READ"]);
});

test("TokenManager isTokenExpired detects valid and expired tokens", () => {
  const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
  const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

  const validJwt = `h.${Buffer.from(JSON.stringify({ exp: futureExp })).toString("base64url")}.s`;
  const expiredJwt = `h.${Buffer.from(JSON.stringify({ exp: pastExp })).toString("base64url")}.s`;

  assert.equal(isTokenExpired(validJwt), false);
  assert.equal(isTokenExpired(expiredJwt), true);
  assert.equal(isTokenExpired("invalid-jwt"), true);
});
