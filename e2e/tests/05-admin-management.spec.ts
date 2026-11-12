import { test, expect } from "../fixtures/authContexts";
import {
  fetchOrdersViaApi,
  getJsonEnvelope,
  loginViaGateway,
} from "../fixtures/apiHelper";
import { BASE_URL, GATEWAY_URL, SEED_USERS, uniqueSuffix } from "../fixtures/constants";
import { AdminProductsPage } from "../pages/AdminProductsPage";
import { AdminPromotionsPage } from "../pages/AdminPromotionsPage";
import { AdminOrdersPage } from "../pages/AdminOrdersPage";
import { AdminCustomersPage } from "../pages/AdminCustomersPage";
import { AdminStaffPage } from "../pages/AdminStaffPage";
import { MenuQrPage } from "../pages/MenuQrPage";
import { CartPage } from "../pages/CartPage";
import { PosPage } from "../pages/PosPage";

// Minimal valid 1x1 opaque red RGBA PNG
const TINY_PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

test.describe("Suite 5: Admin Management (Products, Promotions, Customers, Orders, QR, Waiter)", () => {
  test("E2E-ADM-01 @P1: Product CRUD, image upload via Gateway /uploads/** & toggle active visibility on /menu", async ({
    browser,
    openRole,
    request,
  }) => {
    const suffix = uniqueSuffix();
    const catName = `E2E Cat ${suffix}`;
    const prodCode = `E2EIMG${suffix}`;
    const prodName = `E2E Món Ảnh ${suffix}`;

    const { page: adminPage } = await openRole("admin", "/admin/products");
    const productsPage = new AdminProductsPage(adminPage);

    await productsPage.createCategory(catName, 99);
    await productsPage.openCreateProductModal();

    // Create product with uploaded image
    await productsPage.fillAndSubmitProduct({
      categoryName: catName,
      code: prodCode,
      name: prodName,
      basePrice: 65000,
      description: "Món test upload ảnh",
      variants: [{ sizeName: "Size L", priceAdjustment: 15000, sku: `${prodCode}-L` }],
      modifierGroupNames: ["Topping Mì Cay"],
    });

    // Also upload image directly via modal edit or initial create: wait — fillAndSubmitProduct supports imagePath!
    // Let's upload via edit or create a second check? Wait: let's test upload on edit OR create with temp file!
    // Let's test upload during create right here using a second product or edit `prodName`!
    // Actually, let's edit `prodName` right now to upload the image via ProductModal's input[type=file] so we test image upload + /uploads/** cleanly!
    await productsPage.search(prodCode);
    const prodRow = adminPage.locator("tbody tr", { hasText: prodCode }).first();
    await expect(prodRow).toBeVisible();
    await prodRow.getByTitle("Chỉnh sửa món ăn").click();

    const editModal = adminPage.locator("form").filter({ hasText: "Tên món ăn" }).locator("..");
    const uploadPromise = adminPage.waitForResponse(
      (res) => res.url().includes("/api/catalog/files/upload") && res.request().method() === "POST"
    );
    await editModal.locator('input[type="file"]').setInputFiles({
      name: `e2e-${suffix}.png`,
      mimeType: "image/png",
      buffer: TINY_PNG_BUFFER,
    });
    const uploadRes = await uploadPromise;
    expect(uploadRes.status()).toBe(201);
    const uploadJson = (await uploadRes.json()) as { data: { fileUrl: string } };
    const fileUrl = uploadJson.data.fileUrl;
    expect(fileUrl).toMatch(/^\/uploads\/products\/.+\.png$/);

    // Verify image URL is served directly by Gateway (:8088/uploads/**)
    const gwImgRes = await request.get(`${GATEWAY_URL}${fileUrl}`);
    expect(gwImgRes.status()).toBe(200);

    await editModal.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(adminPage.getByText("Cập nhật thành công")).toBeVisible({ timeout: 15_000 });

    // Check guest /menu?table=14 shows the new product with working image
    const guestCtx = await browser.newContext({ baseURL: BASE_URL });
    const guestPage = await guestCtx.newPage();
    try {
      const menu = new MenuQrPage(guestPage);
      await menu.goto(14);
      await menu.search(prodCode);
      await expect(guestPage.getByRole("heading", { name: prodName, exact: true })).toBeVisible();
      const img = guestPage.locator(`img[alt="${prodName}"]`);
      await expect(img).toBeVisible();
      await expect
        .poll(async () => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true);

      // Toggle isActive = false in Admin -> hidden from /menu
      await productsPage.toggleProductActive(prodName);
      await expect(adminPage.getByText(/Đã tạm ngưng món/)).toBeVisible({ timeout: 10_000 });

      await guestPage.reload({ waitUntil: "domcontentloaded" });
      await menu.search(prodCode);
      await expect(guestPage.getByRole("heading", { name: prodName, exact: true })).toHaveCount(0);
    } finally {
      await guestCtx.close();
    }
  });

  test("E2E-ADM-02 @P1: Promotions CRUD, minOrder & maxDiscount enforcement, and pause toggle", async ({
    browser,
    openRole,
  }) => {
    const suffix = uniqueSuffix();
    const promoCode = `E2EV${suffix}`;

    const { page: adminPage } = await openRole("admin", "/admin/promotions");
    const promos = new AdminPromotionsPage(adminPage);

    await promos.createPromotion({
      code: promoCode,
      name: `Voucher E2E ${suffix}`,
      discountPercent: 50,
      maxDiscountAmount: 20000,
      minOrderAmount: 100000,
      usageLimit: 10,
    });

    // Test on guest /cart?table=14
    const guestCtx = await browser.newContext({ baseURL: BASE_URL });
    const guestPage = await guestCtx.newPage();
    try {
      const menu = new MenuQrPage(guestPage);
      await menu.goto(14);
      await menu.openProductModal("Trà Đào Cam Sả");
      await menu.configureAndAddToCart({ sizeName: "Size M" }); // 45,000đ < 100,000đ
      await menu.goToCart();

      const cart = new CartPage(guestPage);
      await cart.applyPromo(promoCode);
      await expect(guestPage.getByText(/chưa đạt giá trị tối thiểu/i)).toBeVisible();

      // Add Mì Cay Bò Mỹ (75,000đ) -> subtotal = 120,000đ -> 50% = 60,000đ capped at 20,000đ
      await menu.goto(14);
      await menu.openProductModal("Mì Cay Bò Mỹ");
      await menu.configureAndAddToCart({ sizeName: "Cấp 1" });
      await menu.goToCart();

      await cart.applyPromo(promoCode);
      await expect(guestPage.getByText(`Mã ${promoCode} (-50%)`)).toBeVisible();
      await expect(guestPage.getByText("-20.000đ").first()).toBeVisible();

      // Pause voucher in Admin -> verify /cart & /pos reject it
      await promos.toggleStatus(promoCode);
      await expect(adminPage.getByText("Đã tạm dừng khuyến mãi")).toBeVisible({ timeout: 10_000 });

      await guestPage.reload({ waitUntil: "domcontentloaded" });
      await cart.applyPromo(promoCode);
      await expect(guestPage.getByText(/tạm ngưng áp dụng/i)).toBeVisible();
    } finally {
      await guestCtx.close();
    }

    // Verify /pos also rejects paused promo
    const { page: posPage } = await openRole("cashier", "/pos");
    const pos = new PosPage(posPage);
    await pos.selectTable(14);
    await pos.addSimpleOrConfiguredItem("Mì Cay Bò Mỹ", { sizeName: "Cấp 1" });
    await pos.applyPromo(promoCode);
    await expect(posPage.getByText(/tạm ngưng áp dụng/i)).toBeVisible();
  });

  test("E2E-ADM-03 @P1: POS quick-register customer on Table 20, Dashboard KPI, Orders CSV & Customer point history", async ({
    openRole,
    request,
  }) => {
    const suffix = uniqueSuffix();
    const newPhone = `099${String(Date.now()).slice(-7)}`;
    const newName = `Khách E2E ${suffix}`;

    const adminToken = await loginViaGateway(
      request,
      SEED_USERS.admin.username,
      SEED_USERS.admin.password
    );
    const statsBefore = await getJsonEnvelope<{ totalOrders: number; totalRevenue: number }>(
      request,
      "/api/sales/orders/statistics?period=today",
      adminToken
    );

    // 1. Cashier checks out Table 20 with new customer registration (149,000đ -> earns 1 point)
    const { page: posPage } = await openRole("cashier", "/pos");
    const pos = new PosPage(posPage);
    await pos.selectTable(20);
    await pos.addSimpleOrConfiguredItem("Gà Sốt Cay Hàn Quốc", { sizeName: "Phần 8 miếng" });
    await pos.quickRegisterCustomer(newPhone, newName);
    await expect(posPage.getByText(newName)).toBeVisible();

    await pos.openPaymentModal(false);
    await pos.payCash(150000);
    await expect(posPage.getByText(/Thanh toán thành công Bàn 20/)).toBeVisible({ timeout: 15_000 });

    const completedOrders = await fetchOrdersViaApi(request, adminToken, "?status=COMPLETED");
    const createdOrder = completedOrders.find((o) => o.customerPhone === newPhone)!;
    expect(createdOrder).toBeDefined();
    expect(createdOrder.totalAmount).toBe(149000);

    // 2. Verify Dashboard KPI reflects +1 order & +149,000 revenue
    const { page: adminDash } = await openRole("admin", "/admin");
    const statsAfter = await getJsonEnvelope<{ totalOrders: number; totalRevenue: number }>(
      request,
      "/api/sales/orders/statistics?period=today",
      adminToken
    );
    expect(statsAfter.totalOrders).toBe(statsBefore.totalOrders + 1);
    expect(statsAfter.totalRevenue).toBe(statsBefore.totalRevenue + 149000);
    await expect(adminDash.getByText(createdOrder.orderCode)).toBeVisible({ timeout: 10_000 });

    // 3. Verify /admin/orders search, detail modal & CSV export
    const { page: ordersRawPage } = await openRole("admin", "/admin/orders");
    const ordersPage = new AdminOrdersPage(ordersRawPage);
    await ordersPage.search(createdOrder.orderCode);
    await ordersPage.openOrderDetail(createdOrder.orderCode);
    const detailModal = ordersRawPage.locator("div.fixed").filter({ hasText: "Chi tiết hóa đơn" });
    await expect(detailModal).toContainText(newPhone);
    await detailModal.getByRole("button", { name: "Đóng", exact: true }).click();

    const csvFilename = await ordersPage.exportCsv();
    expect(csvFilename).toMatch(/^Bao_Cao_Hoa_Don_SmartPOS_.*\.csv$/);

    // 4. Verify /admin/customers shows new customer with 1 point and EARN transaction
    const { page: custRawPage } = await openRole("admin", "/admin/customers");
    const custPage = new AdminCustomersPage(custRawPage);
    await custPage.search(newPhone);
    await expect(custRawPage.locator("tbody tr", { hasText: newPhone })).toContainText("1 điểm");
    await custPage.openTransactions(newPhone);
    await expect(custRawPage.getByText(/\+1 điểm|EARN/i).first()).toBeVisible();
  });

  test("E2E-ADM-04 @P2: Admin Staff QR & Branches tabs + Waiter /order-taking flow", async ({
    openRole,
  }) => {
    const { page: staffRawPage } = await openRole("admin", "/admin/staff");
    const staffPage = new AdminStaffPage(staffRawPage);

    // Branches tab
    await staffPage.switchTab("Chi nhánh");
    await staffRawPage.getByPlaceholder("Địa chỉ chi nhánh").fill("456 Lê Lợi, Q.1, TP.HCM");
    await staffRawPage.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(staffRawPage.getByText("Đã lưu cấu hình chi nhánh")).toBeVisible();

    // QR tab
    await staffPage.switchTab("Bàn & mã QR");
    await staffRawPage.locator("select").nth(1).selectOption("Bàn 15");
    await expect(staffRawPage.locator("[data-qr-preview] svg")).toBeVisible();
    await expect(staffRawPage.getByText(/\/menu\?table=15/).first()).toBeVisible();

    const [popup] = await Promise.all([
      staffRawPage.waitForEvent("popup"),
      staffRawPage.getByRole("button", { name: "Mở trang gọi món" }).click(),
    ]);
    await popup.waitForLoadState("domcontentloaded");
    expect(popup.url()).toContain("/menu?table=15");
    await popup.close();

    // Waiter /order-taking -> /menu
    const { page: waiterPage } = await openRole("waiter", "/order-taking");
    await expect(
      waiterPage.getByRole("heading", { level: 1, name: "Phục vụ & Ghi nhận đơn" })
    ).toBeVisible();
    await waiterPage.getByRole("link", { name: "Mở thực đơn gọi món" }).click();
    await waiterPage.waitForURL(/\/menu/, { timeout: 15_000 });
    await expect(waiterPage.getByRole("heading", { name: "Mì Cay Bò Mỹ", exact: true })).toBeVisible();
  });
});
