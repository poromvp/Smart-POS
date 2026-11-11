import fs from "fs";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { test as base } from "@playwright/test";
import {
  BASE_URL,
  SEED_USERS,
  getAuthFilePath,
  type RoleKey,
} from "./constants";

export interface RoleSession {
  context: BrowserContext;
  page: Page;
}

async function seedRoleStorageFile(browser: Browser, role: RoleKey): Promise<string> {
  const filePath = getAuthFilePath(role);
  const cred = SEED_USERS[role];
  const tempContext = await browser.newContext({ baseURL: BASE_URL });
  try {
    const res = await tempContext.request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: cred.username, password: cred.password },
    });
    if (!res.ok()) {
      throw new Error(
        `Failed to seed auth storageState for ${role}: ${res.status()} ${await res.text()}`
      );
    }
    await tempContext.storageState({ path: filePath });
    return filePath;
  } finally {
    await tempContext.close();
  }
}

/**
 * Opens a BrowserContext authenticated as `role` using cached storageState,
 * and persists the rotated refreshToken cookie back to `e2e/.auth/<role>.json`
 * when closed so subsequent sequential tests remain authenticated despite refresh-token rotation.
 */
export async function openRoleContext(
  browser: Browser,
  role: RoleKey,
  options: { persistRotatedCookie?: boolean; viewport?: { width: number; height: number } } = {}
): Promise<BrowserContext> {
  const persist = options.persistRotatedCookie ?? true;
  const authPath = getAuthFilePath(role);

  if (!fs.existsSync(authPath)) {
    await seedRoleStorageFile(browser, role);
  }

  const context = await browser.newContext({
    baseURL: BASE_URL,
    storageState: authPath,
    ...(options.viewport ? { viewport: options.viewport } : {}),
  });

  if (persist) {
    const originalClose = context.close.bind(context);
    context.close = async () => {
      try {
        await context.storageState({ path: authPath });
      } catch {
        // Ignore if context already crashed/closed
      }
      await originalClose();
    };
  }

  return context;
}

/**
 * Navigates a role context to a protected page and ensures session recovery
 * if a previous aborted run left a stale rotated cookie in storageState.
 */
export async function gotoAsRole(
  browser: Browser,
  role: RoleKey,
  targetPath: string
): Promise<{ context: BrowserContext; page: Page }> {
  let context = await openRoleContext(browser, role);
  let page = await context.newPage();
  await page.goto(targetPath, { waitUntil: "domcontentloaded" });

  // Wait for AuthProvider / RoleGate loading spinners to resolve
  await page.waitForFunction(
    () =>
      !document.body.innerText.includes("Đang kiểm tra phiên đăng nhập") &&
      !document.body.innerText.includes("Đang kiểm tra quyền truy cập"),
    { timeout: 15_000 }
  );

  if (page.url().includes("/login")) {
    await context.close();
    await seedRoleStorageFile(browser, role);
    context = await openRoleContext(browser, role);
    page = await context.newPage();
    await page.goto(targetPath, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        !document.body.innerText.includes("Đang kiểm tra phiên đăng nhập") &&
        !document.body.innerText.includes("Đang kiểm tra quyền truy cập"),
      { timeout: 15_000 }
    );
  }

  return { context, page };
}

type RoleFixtures = {
  openRole: (role: RoleKey, path?: string) => Promise<RoleSession>;
};

export const test = base.extend<RoleFixtures>({
  openRole: async ({ browser }, use) => {
    const opened: BrowserContext[] = [];
    const launcher = async (role: RoleKey, path = "/"): Promise<RoleSession> => {
      const { context, page } = await gotoAsRole(browser, role, path);
      opened.push(context);
      return { context, page };
    };
    await use(launcher);
    for (const ctx of opened) {
      await ctx.close();
    }
  },
});

export { expect } from "@playwright/test";
