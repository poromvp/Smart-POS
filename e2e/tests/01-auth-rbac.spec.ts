import { test, expect } from "../fixtures/authContexts";
import { BASE_URL, DEFAULT_PASSWORD, SEED_USERS, uniqueSuffix, type RoleKey } from "../fixtures/constants";
import { LoginPage } from "../pages/LoginPage";
import { PortalPage } from "../pages/PortalPage";
import { AdminStaffPage } from "../pages/AdminStaffPage";

test.describe("Suite 1: Auth, JWT Refresh & RBAC", () => {
  test("E2E-AUTH-01 @P0: Login & landing route per role + HttpOnly refresh cookie + reload persistence", async ({
    browser,
  }) => {
    const roles: RoleKey[] = ["admin", "manager", "cashier", "chef", "waiter", "parttime"];

    for (const roleKey of roles) {
      const cred = SEED_USERS[roleKey];
      const context = await browser.newContext({ baseURL: BASE_URL });
      const page = await context.newPage();

      try {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(cred.username, cred.password);

        await page.waitForURL(new RegExp(`${cred.expectedLanding}$`), { timeout: 15_000 });

        const cookies = await context.cookies(`${BASE_URL}/api/auth/refresh`);
        const refreshCookie = cookies.find((c) => c.name === "refreshToken");
        expect(refreshCookie, `Missing refreshToken cookie for ${cred.username}`).toBeDefined();
        expect(refreshCookie?.httpOnly).toBe(true);

        // Reload and verify session is restored via /api/auth/refresh + /api/auth/me
        const refreshPromise = page.waitForResponse(
          (res) => res.url().includes("/api/auth/refresh") && res.request().method() === "POST"
        );
        await page.reload({ waitUntil: "domcontentloaded" });
        const refreshRes = await refreshPromise;
        expect(refreshRes.status()).toBe(200);

        await page.waitForFunction(
          () => !document.body.innerText.includes("Đang kiểm tra quyền truy cập"),
          { timeout: 15_000 }
        );
        expect(page.url()).toContain(cred.expectedLanding);
      } finally {
        await context.close();
      }
    }
  });

  test("E2E-AUTH-02 @P0: Reject wrong password and locked account", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();

    try {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Wrong password
      await loginPage.login("cashier01", "wrong-pass-123");
      await loginPage.expectError();
      expect(page.url()).toContain("/login");

      // Locked account (active = false)
      await loginPage.login("locked_staff", DEFAULT_PASSWORD);
      await loginPage.expectError();
      expect(page.url()).toContain("/login");

      const cookies = await context.cookies(`${BASE_URL}/api/auth/refresh`);
      expect(cookies.find((c) => c.name === "refreshToken")?.value || "").toBe("");
    } finally {
      await context.close();
    }
  });

  test("E2E-AUTH-03 @P0: Unauthenticated redirects to /login and RoleGate blocks unauthorized roles with 403", async ({
    browser,
    openRole,
  }) => {
    // 1. Unauthenticated access to protected workspaces
    const guestContext = await browser.newContext({ baseURL: BASE_URL });
    const guestPage = await guestContext.newPage();
    try {
      for (const route of ["/pos", "/kds", "/admin", "/order-taking"]) {
        await guestPage.goto(route);
        await guestPage.waitForURL(/\/login/, { timeout: 15_000 });
      }
    } finally {
      await guestContext.close();
    }

    // 2. Cashier blocked on /admin and /kds
    const { page } = await openRole("cashier", "/admin");
    await expect(page.getByText("HTTP 403 • Forbidden")).toBeVisible();
    await expect(page.getByRole("button", { name: "Về Cổng phân hệ" })).toBeVisible();

    await page.goto("/kds");
    await expect(page.getByText("HTTP 403 • Forbidden")).toBeVisible();

    await page.getByRole("button", { name: "Về Cổng phân hệ" }).click();
    await page.waitForURL(`${BASE_URL}/`);
    await new PortalPage(page).expectLoaded();
  });

  test("E2E-AUTH-04 @P1: Dynamic RBAC custom role multi-workspace routing & system role protection", async ({
    browser,
    openRole,
  }) => {
    const suffix = uniqueSuffix();
    const roleName = `SHIFT_E2E_${suffix}`;
    const username = `e2eshift_${suffix.toLowerCase()}`;

    const { page: adminPage } = await openRole("admin", "/admin/staff");
    const staffPage = new AdminStaffPage(adminPage);

    // Verify system roles cannot be deleted
    await staffPage.switchTab("Vai trò & Phân quyền");
    const cashierRoleRow = adminPage.locator("tbody tr", { hasText: "CASHIER" }).first();
    await expect(cashierRoleRow.getByText("Hệ thống")).toBeVisible();
    await expect(cashierRoleRow.getByRole("button", { name: "Xóa" })).toHaveCount(0);

    // Create custom role and assign POS_ACCESS + KDS_VIEW + MENU_READ + ORDER_READ
    await staffPage.createRole(roleName, "E2E Multi-Workspace Role");
    await staffPage.configureRolePermissions(roleName, [
      "POS_ACCESS",
      "KDS_VIEW",
      "MENU_READ",
      "ORDER_READ",
    ]);

    await staffPage.createStaff({
      username,
      password: DEFAULT_PASSWORD,
      fullName: `Nhân viên ${suffix}`,
      phone: `098${String(Date.now()).slice(-7)}`,
      roleName,
    });

    // Login as the new user in a clean context
    const userContext = await browser.newContext({ baseURL: BASE_URL });
    const userPage = await userContext.newPage();
    try {
      const loginPage = new LoginPage(userPage);
      await loginPage.goto();
      await loginPage.login(username, DEFAULT_PASSWORD);

      // Multi-workspace without ADMIN_DASHBOARD lands on / Portal
      await userPage.waitForURL(`${BASE_URL}/`, { timeout: 15_000 });
      const portal = new PortalPage(userPage);
      await portal.expectLoaded();

      await expect(userPage.getByRole("heading", { name: "Quầy Thu ngân (POS)" })).toBeVisible();
      await expect(userPage.getByRole("heading", { name: "Điều phối Bếp (KDS)" })).toBeVisible();
      await expect(userPage.getByRole("heading", { name: "Quản trị hệ thống" })).toHaveCount(0);

      await userPage.goto("/pos");
      await expect(userPage.getByText("Màn hình thu ngân (POS)")).toBeVisible();

      await userPage.goto("/kds");
      await expect(userPage.getByText("Điều phối bếp (KDS)")).toBeVisible();

      await userPage.goto("/admin");
      await expect(userPage.getByText("HTTP 403 • Forbidden")).toBeVisible();
    } finally {
      await userContext.close();
    }
  });

  test("E2E-AUTH-05 @P1: Change password, logout session revocation & admin password reset", async ({
    browser,
    openRole,
  }) => {
    const newPass = "SmartPosNew99!";
    const staffContext = await browser.newContext({ baseURL: BASE_URL });
    const staffPage = await staffContext.newPage();

    try {
      const loginPage = new LoginPage(staffPage);
      await loginPage.goto();
      await loginPage.login("cashier03", DEFAULT_PASSWORD);
      await staffPage.waitForURL(/\/pos/, { timeout: 15_000 });

      // Change password via TopHeader modal -> forces re-login
      await staffPage.getByTitle("Đổi mật khẩu cá nhân").click();
      await expect(staffPage.getByRole("heading", { name: "Đổi mật khẩu cá nhân" })).toBeVisible();
      await staffPage.getByPlaceholder("Nhập mật khẩu đang dùng").fill(DEFAULT_PASSWORD);
      await staffPage.getByPlaceholder("Nhập mật khẩu mới").fill(newPass);
      await staffPage.getByPlaceholder("Nhập lại mật khẩu mới").fill(newPass);
      await staffPage.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
      await staffPage.waitForURL(/\/login/, { timeout: 15_000 });

      // Old password rejected
      await loginPage.login("cashier03", DEFAULT_PASSWORD);
      await loginPage.expectError();

      // New password succeeds
      await loginPage.login("cashier03", newPass);
      await staffPage.waitForURL(/\/pos/, { timeout: 15_000 });

      // Logout clears session and F5 on /pos redirects to /login
      await staffPage.getByRole("banner").getByRole("button", { name: /Đăng xuất/i }).click();
      await staffPage.waitForURL(/\/login/, { timeout: 15_000 });
      await staffPage.goto("/pos");
      await staffPage.waitForURL(/\/login/, { timeout: 15_000 });
    } finally {
      await staffContext.close();
    }

    // Admin resets cashier03 back to default password
    const { page: adminPage } = await openRole("admin", "/admin/staff");
    const adminStaff = new AdminStaffPage(adminPage);
    await adminStaff.resetUserPassword("cashier03", DEFAULT_PASSWORD);

    // Verify reset password works
    const verifyContext = await browser.newContext({ baseURL: BASE_URL });
    const verifyPage = await verifyContext.newPage();
    try {
      const loginPage = new LoginPage(verifyPage);
      await loginPage.goto();
      await loginPage.login("cashier03", DEFAULT_PASSWORD);
      await verifyPage.waitForURL(/\/pos/, { timeout: 15_000 });
    } finally {
      await verifyContext.close();
    }
  });
});
