import fs from "fs";
import { request } from "@playwright/test";
import {
  AUTH_DIR,
  BASE_URL,
  GATEWAY_URL,
  SEED_USERS,
  getAuthFilePath,
  type RoleKey,
} from "./fixtures/constants";

async function waitForUrl(url: string, label: string, timeoutMs = 90_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Timed out waiting for ${label} at ${url}`);
}

export default async function globalSetup(): Promise<void> {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await Promise.all([
    waitForUrl("http://localhost:8081/actuator/health", "auth-service"),
    waitForUrl("http://localhost:8082/actuator/health", "catalog-inventory-service"),
    waitForUrl("http://localhost:8083/actuator/health", "sales-service"),
    waitForUrl(`${GATEWAY_URL}/actuator/health`, "api-gateway"),
    waitForUrl(`${BASE_URL}/login`, "frontend"),
  ]);

  const roles: RoleKey[] = ["admin", "manager", "cashier", "chef", "waiter", "parttime"];

  for (const role of roles) {
    const cred = SEED_USERS[role];
    const apiContext = await request.newContext({ baseURL: BASE_URL });
    try {
      const res = await apiContext.post("/api/auth/login", {
        data: { username: cred.username, password: cred.password },
      });
      if (!res.ok()) {
        throw new Error(
          `globalSetup login failed for ${cred.username}: ${res.status()} ${await res.text()}`
        );
      }
      await apiContext.storageState({ path: getAuthFilePath(role) });
    } finally {
      await apiContext.dispose();
    }
  }
}
