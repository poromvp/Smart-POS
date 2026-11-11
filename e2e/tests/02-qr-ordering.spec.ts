import { test, expect } from "../fixtures/authContexts";
import { loginViaGateway, fetchOrderByCodeViaApi } from "../fixtures/apiHelper";
import { SEED_USERS } from "../fixtures/constants";
import { MenuQrPage } from "../pages/MenuQrPage";
import { CartPage } from "../pages/CartPage";

test.describe("Suite 2: Guest QR Ordering (/menu & /cart)", () => {
  test("E2E-QR-01 @P0: Load real menu via Gateway, filter category & search on mobile viewport", async ({
    page,
  }) => {
    const menuPromise = page.waitForResponse(
      (res) => res.url().includes("/api/catalog/products/menu") && res.request().method() === "GET"
    );

    const menuPage = new MenuQrPage(page);
    await menuPage.goto(11);

    const menuRes = await menuPromise;
    expect(menuRes.status()).toBe(200);
    await expect(page.getByText("Bàn 11")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mì Cay Bò Mỹ", exact: true })).toBeVisible();

    // Filter by category
    await menuPage.selectCategory("Trà & Thức Uống");
    await expect(page.getByRole("heading", { name: "Trà Đào Cam Sả", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mì Cay Bò Mỹ", exact: true })).toHaveCount(0);

    // Switch back to All and search by name and code
    await menuPage.selectCategory("Tất cả");
    await menuPage.search("Bò Mỹ");
    await expect(page.getByRole("heading", { name: "Mì Cay Bò Mỹ", exact: true })).toBeVisible();

    await menuPage.search("MC-BO");
    await expect(page.getByRole("heading", { name: "Mì Cay Bò Mỹ", exact: true })).toBeVisible();
  });

  test("E2E-QR-02 @P0: Select variant & modifier, update cart quantities & persist across reload", async ({
    page,
  }) => {
    const menuPage = new MenuQrPage(page);
    await menuPage.goto(11);

    await menuPage.openProductModal("Mì Cay Bò Mỹ");
    await menuPage.configureAndAddToCart({
      sizeName: "Cấp 7",
      modifiers: ["Thịt bò thêm"],
      note: "Không hành E2E",
    });

    await menuPage.goToCart();

    const cartPage = new CartPage(page);
    await expect(page.getByText("105.000đ").first()).toBeVisible();

    // Increase & decrease quantity
    await cartPage.increaseQuantity("Mì Cay Bò Mỹ");
    await expect(page.getByText("210.000đ")).toBeVisible();

    await cartPage.decreaseQuantity("Mì Cay Bò Mỹ");
    await expect(page.getByText("105.000đ").last()).toBeVisible();

    // Reload and verify localStorage persistence for table 11
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Mì Cay Bò Mỹ" })).toBeVisible();
    await expect(page.getByText("105.000đ").last()).toBeVisible();
    const saved = await page.evaluate(() => window.localStorage.getItem("guest-cart-v1:11"));
    expect(saved).toBeTruthy();
    expect(JSON.parse(saved!)).toHaveLength(1);
  });

  test("E2E-QR-03 @P0: Submit new QR order returns 201 and clears table cart", async ({ page }) => {
    const menuPage = new MenuQrPage(page);
    await menuPage.goto(11);
    await menuPage.openProductModal("Mì Cay Bò Mỹ");
    await menuPage.configureAndAddToCart({
      sizeName: "Cấp 7",
      modifiers: ["Thịt bò thêm"],
      note: "Đơn test QR-03",
    });
    await menuPage.goToCart();

    const createOrderPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/sales/orders") &&
        !res.url().includes("/items") &&
        res.request().method() === "POST"
    );

    const cartPage = new CartPage(page);
    const orderCode = await cartPage.submitOrder();
    const createRes = await createOrderPromise;
    expect(createRes.status()).toBe(201);
    expect(orderCode).toMatch(/^ORD-/);

    const cartAfter = await page.evaluate(() => window.localStorage.getItem("guest-cart-v1:11"));
    expect(JSON.parse(cartAfter || "[]")).toHaveLength(0);
  });

  test("E2E-QR-04 @P1: Add items to existing active seed order on Table 5 transitions READY -> PREPARING", async ({
    page,
    request,
  }) => {
    const menuPage = new MenuQrPage(page);
    await menuPage.goto(5);
    await menuPage.openProductModal("Trà Đào Cam Sả");
    await menuPage.configureAndAddToCart({
      sizeName: "Size L",
      note: "Gọi thêm bàn 5",
    });
    await menuPage.goToCart();

    const addItemsPromise = page.waitForResponse(
      (res) => /\/api\/sales\/orders\/\d+\/items$/.test(res.url()) && res.request().method() === "POST"
    );

    const cartPage = new CartPage(page);
    const orderCode = await cartPage.submitOrder();
    const addRes = await addItemsPromise;
    expect(addRes.status()).toBe(200);
    expect(orderCode).toBe("ORD-DEMO-ACT-04");

    const token = await loginViaGateway(request, SEED_USERS.cashier.username, SEED_USERS.cashier.password);
    const updatedOrder = await fetchOrderByCodeViaApi(request, token, "ORD-DEMO-ACT-04");
    expect(updatedOrder.status).toBe("PREPARING");
    expect(updatedOrder.items.some((i) => i.name.includes("Trà Đào Cam Sả"))).toBe(true);
  });

  test("E2E-QR-05 @P1: Validate exhausted/expired vouchers and apply valid OPENING voucher", async ({
    page,
    request,
  }) => {
    const menuPage = new MenuQrPage(page);
    await menuPage.goto(12);

    // 75k + 25k = 100k (meets minOrderAmount 100k of LIMITED10 & 50k of OPENING)
    await menuPage.openProductModal("Mì Cay Bò Mỹ");
    await menuPage.configureAndAddToCart({
      sizeName: "Cấp 1",
      modifiers: ["Thịt bò thêm"],
    });
    await menuPage.goToCart();

    const cartPage = new CartPage(page);

    // 1. Exhausted voucher
    await cartPage.applyPromo("LIMITED10");
    await expect(page.getByText(/đạt giới hạn số lượt sử dụng/i)).toBeVisible();

    // 2. Inactive / expired voucher
    await cartPage.applyPromo("EXPIRED_OLD");
    await expect(page.getByText(/tạm ngưng áp dụng|hết hạn/i)).toBeVisible();

    // 3. Valid OPENING voucher (10% of 100,000 = 10,000)
    await cartPage.applyPromo("OPENING");
    await expect(page.getByText(/Mã OPENING \(-10%\)/)).toBeVisible();
    await expect(page.getByText("-10.000đ").first()).toBeVisible();
    await expect(page.getByText("90.000đ").last()).toBeVisible();

    const orderCode = await cartPage.submitOrder();
    const token = await loginViaGateway(request, SEED_USERS.cashier.username, SEED_USERS.cashier.password);
    const created = await fetchOrderByCodeViaApi(request, token, orderCode);
    expect(created.promotionCode).toBe("OPENING");
    expect(created.discountAmount).toBe(10000);
    expect(created.totalAmount).toBe(90000);
  });

  test("E2E-QR-06 @P1: View-only mode on /menu and disabled submit on /cart without table query", async ({
    page,
  }) => {
    const menuPage = new MenuQrPage(page);
    await menuPage.goto();
    await expect(page.getByText(/Chế độ xem thực đơn/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mì Cay Bò Mỹ", exact: true })).toBeVisible();

    // Clicking product card in view-only mode does not open modal
    await page.getByRole("heading", { name: "Mì Cay Bò Mỹ", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const cartPage = new CartPage(page);
    await cartPage.goto();
    await expect(page.getByText("Chưa xác định bàn")).toBeVisible();
    const submitBtn = page.getByRole("button", { name: "Quét mã QR để xác nhận đơn" });
    await expect(submitBtn).toBeDisabled();
  });
});
