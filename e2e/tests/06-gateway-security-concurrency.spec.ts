import { Client } from "@stomp/stompjs";
import { test, expect } from "../fixtures/authContexts";
import {
  fetchInventoryTransactionsViaApi,
  fetchProductRecipeViaApi,
  loginViaGateway,
  postJsonEnvelope,
} from "../fixtures/apiHelper";
import { BASE_URL, GATEWAY_URL, SEED_USERS, WS_URL } from "../fixtures/constants";
import { MenuQrPage } from "../pages/MenuQrPage";
import { PosPage } from "../pages/PosPage";

interface StompProbeResult {
  connected: boolean;
  receivedMessage: boolean;
  stompError: string | null;
  disconnectedAfterSubscribe: boolean;
}

async function probeStompSubscription(opts: {
  token?: string;
  topic: string;
  trigger?: () => Promise<void>;
  timeoutMs?: number;
}): Promise<StompProbeResult> {
  const timeoutMs = opts.timeoutMs ?? 6000;
  return new Promise((resolve) => {
    let settled = false;
    let connected = false;
    let subscribed = false;
    let receivedMessage = false;
    let stompError: string | null = null;
    let disconnectedAfterSubscribe = false;

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: opts.token ? { Authorization: `Bearer ${opts.token}` } : {},
      reconnectDelay: 0,
      onConnect: async () => {
        connected = true;
        client.subscribe(opts.topic, () => {
          receivedMessage = true;
          finish();
        });
        subscribed = true;
        await new Promise((r) => setTimeout(r, 400));
        if (settled) return;
        if (opts.trigger) {
          await opts.trigger().catch(() => {});
        } else {
          await new Promise((r) => setTimeout(r, 600));
          finish();
        }
      },
      onStompError: (frame) => {
        stompError = frame.headers["message"] || frame.body || "STOMP_ERROR";
        finish();
      },
      onWebSocketClose: () => {
        if (!settled && subscribed && !receivedMessage) {
          disconnectedAfterSubscribe = true;
          setTimeout(finish, 150);
        }
      },
      onWebSocketError: () => {
        if (!stompError) stompError = "WS_ERROR";
      },
    });

    const timer = setTimeout(finish, timeoutMs);

    function finish() {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      client.deactivate().finally(() => {
        resolve({ connected, receivedMessage, stompError, disconnectedAfterSubscribe });
      });
    }

    client.activate();
  });
}

test.describe("Suite 6: Gateway Security, STOMP Auth, Concurrency & Rate Limit", () => {
  test("E2E-GW-01 @P0: Strip forged X-User-*/X-Internal-* headers, return 401 JSON with X-Correlation-Id & CORS", async ({
    request,
  }) => {
    const spoofedHeaders = {
      Origin: BASE_URL,
      "X-User-Id": "1",
      "X-User-Role": "ADMIN",
      "X-User-Name": "admin",
      "X-User-Permissions": "ADMIN_DASHBOARD,PAYMENT_PROCESS,INVENTORY_EXPORT",
      "X-Internal-Service": "sales-service",
      "X-Internal-Secret": "smartpos-internal-secret-2026",
    };

    const protectedChecks = [
      { method: "GET", path: "/api/sales/orders/statistics" },
      { method: "POST", path: "/api/catalog/inventory/deduct", data: { orderCode: "FAKE", items: [] } },
      { method: "GET", path: "/api/users" },
      { method: "GET", path: "/api/sales/orders?page=0" },
    ] as const;

    for (const check of protectedChecks) {
      const res =
        check.method === "GET"
          ? await request.get(`${GATEWAY_URL}${check.path}`, { headers: spoofedHeaders })
          : await request.post(`${GATEWAY_URL}${check.path}`, {
              headers: spoofedHeaders,
              data: check.data,
            });

      expect(res.status(), `Expected 401 for ${check.method} ${check.path}`).toBe(401);
      const headers = res.headers();
      expect(headers["x-correlation-id"]).toBeTruthy();
      expect(headers["access-control-allow-origin"]).toBe(BASE_URL);

      const body = (await res.json()) as { success: boolean; correlationId?: string };
      expect(body.success).toBe(false);
      expect(body.correlationId).toBeTruthy();
    }

    // Even WITH a valid low-privilege JWT, forged X-User-Role / X-User-Permissions must be stripped
    const waiterToken = await loginViaGateway(
      request,
      SEED_USERS.waiter.username,
      SEED_USERS.waiter.password
    );
    const spoofedWithWaiterJwt = await request.get(`${GATEWAY_URL}/api/sales/orders/statistics`, {
      headers: {
        ...spoofedHeaders,
        Authorization: `Bearer ${waiterToken}`,
      },
    });
    expect(spoofedWithWaiterJwt.status()).toBe(403);
  });

  test("E2E-GW-02 @P1: Enforce 403 Forbidden across all 3 microservices behind Gateway", async ({
    request,
  }) => {
    const waiterToken = await loginViaGateway(
      request,
      SEED_USERS.waiter.username,
      SEED_USERS.waiter.password
    );
    const chefToken = await loginViaGateway(
      request,
      SEED_USERS.chef.username,
      SEED_USERS.chef.password
    );

    // 1. Auth service (@PreAuthorize)
    const authUsersRes = await request.get(`${GATEWAY_URL}/api/users`, {
      headers: { Authorization: `Bearer ${waiterToken}` },
    });
    expect(authUsersRes.status()).toBe(403);

    const authDeleteRoleRes = await request.delete(`${GATEWAY_URL}/api/roles/1`, {
      headers: { Authorization: `Bearer ${waiterToken}` },
    });
    expect(authDeleteRoleRes.status()).toBe(403);

    // 2. Catalog-Inventory service (AuthorizationInterceptor)
    const catIngRes = await request.post(`${GATEWAY_URL}/api/catalog/ingredients`, {
      headers: { Authorization: `Bearer ${waiterToken}` },
      data: {
        name: "Unauthorized Ing",
        code: "UNAUTH-ING",
        unit: "kg",
        currentStock: 1,
        minThreshold: 0,
        costPerUnit: 1000,
      },
    });
    expect(catIngRes.status()).toBe(403);

    // 3. Sales service (AuthorizationInterceptor)
    const salesCheckoutRes = await request.post(`${GATEWAY_URL}/api/sales/orders/1/checkout`, {
      headers: { Authorization: `Bearer ${chefToken}` },
      data: { paymentMethod: "CASH" },
    });
    expect(salesCheckoutRes.status()).toBe(403);
  });

  test("E2E-GW-03 @P1: STOMP WebSocket channel authorization on /ws-pos", async ({ request }) => {
    const waiterToken = await loginViaGateway(
      request,
      SEED_USERS.waiter.username,
      SEED_USERS.waiter.password
    );
    const chefToken = await loginViaGateway(
      request,
      SEED_USERS.chef.username,
      SEED_USERS.chef.password
    );
    const cashierToken = await loginViaGateway(
      request,
      SEED_USERS.cashier.username,
      SEED_USERS.cashier.password
    );

    // 1. Anonymous can subscribe to public /topic/tables/11 and receive live order event
    const anonTableResult = await probeStompSubscription({
      topic: "/topic/tables/11",
      trigger: async () => {
        await postJsonEnvelope(request, "/api/sales/orders", {
          tableNumber: "11",
          orderType: "DINE_IN",
          items: [
            { productId: 6, name: "Cà Phê Sữa Đá", quantity: 1, basePrice: 35000, modifierTotal: 0 },
          ],
        });
      },
    });
    expect(anonTableResult.connected).toBe(true);
    expect(anonTableResult.receivedMessage).toBe(true);
    expect(anonTableResult.stompError).toBeNull();

    // 2. Anonymous is rejected when subscribing to /topic/kds and /topic/orders
    const anonKdsResult = await probeStompSubscription({ topic: "/topic/kds" });
    expect(anonKdsResult.receivedMessage).toBe(false);
    expect(Boolean(anonKdsResult.stompError || anonKdsResult.disconnectedAfterSubscribe)).toBe(true);

    const anonOrdersResult = await probeStompSubscription({ topic: "/topic/orders" });
    expect(anonOrdersResult.receivedMessage).toBe(false);
    expect(Boolean(anonOrdersResult.stompError || anonOrdersResult.disconnectedAfterSubscribe)).toBe(true);

    // 3. Waiter (lacks KDS_VIEW / KDS_UPDATE / ADMIN_DASHBOARD) is rejected from /topic/kds
    const waiterKdsResult = await probeStompSubscription({
      token: waiterToken,
      topic: "/topic/kds",
      trigger: async () => {
        await postJsonEnvelope(request, "/api/sales/orders", {
          orderType: "TAKEAWAY",
          items: [
            { productId: 6, name: "Cà Phê Sữa Đá", quantity: 1, basePrice: 35000, modifierTotal: 0 },
          ],
        });
      },
      timeoutMs: 3000,
    });
    expect(waiterKdsResult.receivedMessage).toBe(false);
    expect(Boolean(waiterKdsResult.stompError || waiterKdsResult.disconnectedAfterSubscribe)).toBe(true);

    // 4. Chef receives /topic/kds events; Cashier receives /topic/orders events
    const chefKdsResult = await probeStompSubscription({
      token: chefToken,
      topic: "/topic/kds",
      trigger: async () => {
        await postJsonEnvelope(request, "/api/sales/orders", {
          orderType: "TAKEAWAY",
          items: [
            { productId: 6, name: "Cà Phê Sữa Đá", quantity: 1, basePrice: 35000, modifierTotal: 0 },
          ],
        });
      },
    });
    expect(chefKdsResult.receivedMessage).toBe(true);
    expect(chefKdsResult.stompError).toBeNull();

    const cashierOrdersResult = await probeStompSubscription({
      token: cashierToken,
      topic: "/topic/orders",
      trigger: async () => {
        await postJsonEnvelope(request, "/api/sales/orders", {
          orderType: "TAKEAWAY",
          items: [
            { productId: 6, name: "Cà Phê Sữa Đá", quantity: 1, basePrice: 35000, modifierTotal: 0 },
          ],
        });
      },
    });
    expect(cashierOrdersResult.receivedMessage).toBe(true);
    expect(cashierOrdersResult.stompError).toBeNull();
  });

  test("E2E-EDGE-01 @P1: Concurrent checkout across two POS tabs avoids double inventory deduction", async ({
    browser,
    request,
  }) => {
    const adminToken = await loginViaGateway(
      request,
      SEED_USERS.admin.username,
      SEED_USERS.admin.password
    );

    // Seed an active order on Table 15 (1x Cà Phê Sữa Đá)
    const createdOrder = await postJsonEnvelope<{ id: number; orderCode: string }>(
      request,
      "/api/sales/orders",
      {
        tableNumber: "15",
        orderType: "DINE_IN",
        items: [
          { productId: 6, name: "Cà Phê Sữa Đá", quantity: 1, basePrice: 35000, modifierTotal: 0 },
        ],
      },
      adminToken
    );

    // Open 2 independent POS sessions (cashier01 & cashier02)
    const ctx1 = await browser.newContext({ baseURL: BASE_URL });
    const ctx2 = await browser.newContext({ baseURL: BASE_URL });
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    try {
      for (const [page, user] of [
        [page1, "cashier01"],
        [page2, "cashier02"],
      ] as const) {
        await page.goto("/login");
        await page.locator("#login-username").fill(user);
        await page.locator("#login-password").fill(SEED_USERS.cashier.password);
        await page.getByRole("button", { name: /ĐĂNG NHẬP/i }).click();
        await page.waitForURL(/\/pos/, { timeout: 15_000 });
      }

      const pos1 = new PosPage(page1);
      const pos2 = new PosPage(page2);

      await pos1.selectTable(15);
      await pos2.selectTable(15);
      await pos1.openPaymentModal(true);
      await pos2.openPaymentModal(true);

      const resPromise1 = page1.waitForResponse(
        (res) => res.url().includes(`/api/sales/orders/${createdOrder.id}/checkout`)
      );
      const resPromise2 = page2.waitForResponse(
        (res) => res.url().includes(`/api/sales/orders/${createdOrder.id}/checkout`)
      );

      // Trigger simultaneous cash checkout clicks
      await Promise.all([
        page1.locator("dialog[open]").getByRole("button", { name: "Hoàn tất thanh toán tiền mặt" }).click(),
        page2.locator("dialog[open]").getByRole("button", { name: "Hoàn tất thanh toán tiền mặt" }).click(),
      ]);

      const [r1, r2] = await Promise.all([resPromise1, resPromise2]);
      const statuses = [r1.status(), r2.status()].sort((a, b) => a - b);
      expect(statuses[0]).toBe(200);
      expect(statuses[1]).toBeGreaterThanOrEqual(400);

      const recipe6 = await fetchProductRecipeViaApi(request, adminToken, 6);
      const deductTxs = await fetchInventoryTransactionsViaApi(request, adminToken, {
        type: "SALE_DEDUCT",
        search: createdOrder.orderCode,
      });
      expect(deductTxs.length).toBe(recipe6.baseItems.length);
      expect(deductTxs.length).toBeGreaterThanOrEqual(2);
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });

  test("E2E-EDGE-02 @P2: Cart preserves items on 503 error & Gateway enforces 429 rate limit on login", async ({
    browser,
    request,
  }) => {
    // 1. Simulate 503 Service Unavailable on POST /api/sales/orders in /cart?table=14
    const guestCtx = await browser.newContext({ baseURL: BASE_URL });
    const guestPage = await guestCtx.newPage();

    try {
      const menu = new MenuQrPage(guestPage);
      await menu.goto(14);
      await menu.openProductModal("Cà Phê Sữa Đá");
      await menu.configureAndAddToCart({});
      await menu.goToCart();

      await guestPage.route("**/api/sales/orders", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({
              success: false,
              message: "Dịch vụ bán hàng tạm thời gián đoạn.",
            }),
          });
        } else {
          await route.continue();
        }
      });

      await guestPage.getByRole("button", { name: "Xác nhận gọi món" }).click();
      await expect(guestPage.locator("p[role='alert']")).toContainText(/gián đoạn|503/i);

      // Cart in localStorage for table 14 must NOT be cleared
      const preservedCart = await guestPage.evaluate(() =>
        window.localStorage.getItem("guest-cart-v1:14")
      );
      expect(JSON.parse(preservedCart || "[]")).toHaveLength(1);
    } finally {
      await guestCtx.close();
    }

    // 2. Gateway Rate Limiting (429 Too Many Requests) on POST /api/auth/login
    const configuredMax = Number(process.env.RATE_LIMIT_LOGIN_MAX_REQUESTS || "40");
    const maxAttempts = Math.max(configuredMax, 15) + 10;

    let rateLimitedResponse: Awaited<ReturnType<typeof request.post>> | null = null;
    for (let i = 0; i < maxAttempts; i++) {
      const res = await request.post(`${GATEWAY_URL}/api/auth/login`, {
        data: { username: "rate_limit_probe", password: "wrong_password" },
      });
      if (res.status() === 429) {
        rateLimitedResponse = res;
        break;
      }
    }

    expect(rateLimitedResponse, "Expected Gateway to return HTTP 429 Too Many Requests").not.toBeNull();
    const headers = rateLimitedResponse!.headers();
    expect(Number(headers["retry-after"])).toBeGreaterThanOrEqual(1);
    expect(headers["x-correlation-id"]).toBeTruthy();

    const body = (await rateLimitedResponse!.json()) as {
      success: boolean;
      message: string;
      correlationId?: string;
    };
    expect(body.success).toBe(false);
    expect(body.correlationId).toBeTruthy();
  });
});
