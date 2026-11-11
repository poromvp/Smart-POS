import { test, expect } from "../fixtures/authContexts";
import {
  fetchCustomerByPhoneViaApi,
  fetchCustomerTransactionsViaApi,
  fetchIngredientsViaApi,
  fetchInventoryTransactionsViaApi,
  fetchOrderByCodeViaApi,
  fetchOrdersViaApi,
  fetchProductRecipeViaApi,
  loginViaGateway,
} from "../fixtures/apiHelper";
import { BASE_URL, SEED_USERS } from "../fixtures/constants";
import { MenuQrPage } from "../pages/MenuQrPage";
import { CartPage } from "../pages/CartPage";
import { KdsPage } from "../pages/KdsPage";
import { PosPage } from "../pages/PosPage";

test.describe("Suite 3: Core Realtime Flow QR -> KDS -> POS -> BOM -> Loyalty", () => {
  test("E2E-CORE-01 @P0: Multi-context QR -> KDS -> POS Cash Checkout -> 3-Layer BOM & Loyalty", async ({
    browser,
    openRole,
    request,
  }) => {
    const adminToken = await loginViaGateway(
      request,
      SEED_USERS.admin.username,
      SEED_USERS.admin.password
    );

    const ingredientsBefore = await fetchIngredientsViaApi(request, adminToken);
    const stockBeforeByCode = new Map(ingredientsBefore.map((i) => [i.code, i.currentStock]));
    const stockBeforeById = new Map(ingredientsBefore.map((i) => [i.id, i.currentStock]));

    const recipeMcBo = await fetchProductRecipeViaApi(request, adminToken, 1);
    const recipeTraDao = await fetchProductRecipeViaApi(request, adminToken, 4);

    const customerBefore = await fetchCustomerByPhoneViaApi(request, adminToken, "0988777666");
    const pointsBefore = customerBefore.currentPoints;

    // Open KDS (chef) and POS (cashier) contexts concurrently
    const { page: chefPage } = await openRole("chef", "/kds");
    const { page: cashierPage } = await openRole("cashier", "/pos");
    const kds = new KdsPage(chefPage);
    const pos = new PosPage(cashierPage);
    await expect(pos.tableButton(16)).toContainText("Trống");

    // Open Guest mobile context
    const guestCtx = await browser.newContext({
      baseURL: BASE_URL,
      viewport: { width: 390, height: 844 },
    });
    const guestPage = await guestCtx.newPage();

    let orderCode = "";
    try {
      const menuPage = new MenuQrPage(guestPage);
      await menuPage.goto(16);

      // Item 1: Mì Cay Bò Mỹ (75k) + Cấp 7 (+5k) + Thịt bò thêm (+25k) = 105k
      await menuPage.openProductModal("Mì Cay Bò Mỹ");
      await menuPage.configureAndAddToCart({
        sizeName: "Cấp 7",
        modifiers: ["Thịt bò thêm"],
        note: "E2E Core Bàn 16",
      });

      // Item 2: Trà Đào Cam Sả (45k) + Size L (+8k) = 53k
      await menuPage.openProductModal("Trà Đào Cam Sả");
      await menuPage.configureAndAddToCart({
        sizeName: "Size L",
      });

      await menuPage.goToCart();
      const cartPage = new CartPage(guestPage);
      // Increase Mì Cay Bò Mỹ to quantity 4 so subtotal = 4*105k + 53k = 473,000đ
      // After OPENING (-47,300đ) and 250 points (-250,000đ), total = 175,700đ -> earns 1 point too
      await cartPage.increaseQuantity("Mì Cay Bò Mỹ");
      await cartPage.increaseQuantity("Mì Cay Bò Mỹ");
      await cartPage.increaseQuantity("Mì Cay Bò Mỹ");

      orderCode = await cartPage.submitOrder();
      expect(orderCode).toMatch(/^ORD-/);
    } finally {
      await guestCtx.close();
    }

    // KDS receives realtime update via STOMP /topic/kds (no manual reload, < 10s)
    await expect(kds.taskCard(orderCode, "Mì Cay Bò Mỹ")).toBeVisible({ timeout: 10_000 });
    await kds.switchStation("Quầy bar");
    await expect(kds.taskCard(orderCode, "Trà Đào Cam Sả")).toBeVisible({ timeout: 10_000 });

    // POS receives realtime update via STOMP /topic/orders (no manual reload)
    await expect(pos.tableButton(16)).toContainText("Đang dùng", { timeout: 10_000 });
    await expect(pos.tableButton(16)).toContainText("Chờ bếp", { timeout: 10_000 });

    // Chef completes items across both stations
    await kds.switchStation("Bếp nóng");
    await kds.completeTask(orderCode, "Mì Cay Bò Mỹ");
    await kds.switchStation("Quầy bar");
    await kds.completeTask(orderCode, "Trà Đào Cam Sả");

    // POS updates Table 16 badge realtime to "Bếp đã xong"
    await expect(pos.tableButton(16)).toContainText("Bếp đã xong", { timeout: 10_000 });

    // Cashier performs checkout on Table 16 with Loyalty + OPENING + Cash
    await pos.selectTable(16);
    await pos.lookupCustomer("0988777666");
    await expect(cashierPage.getByText(`${pointsBefore} điểm`, { exact: true })).toBeVisible();
    await pos.toggleUsePoints();
    await pos.applyPromo("OPENING");
    await expect(cashierPage.getByText("175.700đ").last()).toBeVisible();

    await pos.openPaymentModal(false);
    const modal = cashierPage.locator("dialog[open]");
    await modal.locator("#cash-received").fill("200000");
    await expect(modal).toContainText("24.300đ"); // Tiền thừa trả khách
    await modal.getByRole("button", { name: "Hoàn tất thanh toán tiền mặt" }).click();

    await expect(cashierPage.getByText(/Thanh toán thành công Bàn 16/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(pos.tableButton(16)).toContainText("Trống", { timeout: 10_000 });

    // Verify in POS History tab
    await cashierPage.getByRole("button", { name: /Lịch sử hóa đơn/ }).first().click();
    await expect(cashierPage.getByRole("cell", { name: `#${orderCode}` })).toBeVisible({
      timeout: 10_000,
    });

    // Verify Backend API state (Order, 3-layer BOM deduction, SALE_DEDUCT ledger, Loyalty)
    const order = await fetchOrderByCodeViaApi(request, adminToken, orderCode);
    expect(order.status).toBe("COMPLETED");
    expect(order.paymentStatus).toBe("PAID");
    expect(order.paymentMethod).toBe("CASH");
    expect(order.promotionCode).toBe("OPENING");
    expect(order.discountAmount).toBe(47300);
    expect(order.pointsDiscountAmount).toBe(250000);
    expect(order.totalAmount).toBe(175700);

    // Compute exact expected BOM deduction from the live 3-layer recipe definitions
    const expectedDeductByIngId = new Map<number, number>();
    const addExpected = (ingId: number, qty: number) => {
      expectedDeductByIngId.set(ingId, (expectedDeductByIngId.get(ingId) ?? 0) + qty);
    };

    const mcBoItem = order.items.find((i) => i.productId === 1)!;
    for (const b of recipeMcBo.baseItems) addExpected(b.ingredientId, b.quantityNeeded * mcBoItem.quantity);
    const mcVariant = recipeMcBo.variants.find((v) => v.variantId === mcBoItem.variantId);
    for (const v of mcVariant?.items ?? []) addExpected(v.ingredientId, v.quantityNeeded * mcBoItem.quantity);
    for (const optId of mcBoItem.modifierOptionIds ?? []) {
      const mod = recipeMcBo.modifierOptions.find((m) => m.modifierOptionId === optId);
      for (const m of mod?.items ?? []) addExpected(m.ingredientId, m.quantityNeeded * mcBoItem.quantity);
    }

    const traDaoItem = order.items.find((i) => i.productId === 4)!;
    for (const b of recipeTraDao.baseItems) addExpected(b.ingredientId, b.quantityNeeded * traDaoItem.quantity);
    const traVariant = recipeTraDao.variants.find((v) => v.variantId === traDaoItem.variantId);
    for (const v of traVariant?.items ?? []) addExpected(v.ingredientId, v.quantityNeeded * traDaoItem.quantity);
    for (const optId of traDaoItem.modifierOptionIds ?? []) {
      const mod = recipeTraDao.modifierOptions.find((m) => m.modifierOptionId === optId);
      for (const m of mod?.items ?? []) addExpected(m.ingredientId, m.quantityNeeded * traDaoItem.quantity);
    }

    const ingredientsAfter = await fetchIngredientsViaApi(request, adminToken);
    for (const [ingId, deducted] of expectedDeductByIngId.entries()) {
      const after = ingredientsAfter.find((i) => i.id === ingId)!.currentStock;
      const before = stockBeforeById.get(ingId)!;
      expect(after).toBeCloseTo(before - deducted, 3);
    }

    // Sanity check 3-layer beef deduction specifically (4 * (0.150 base + 0.080 modifier) = 0.920)
    const beefAfter = ingredientsAfter.find((i) => i.code === "NL-BO")!.currentStock;
    expect(beefAfter).toBeCloseTo((stockBeforeByCode.get("NL-BO") ?? 0) - 0.92, 3);

    const txs = await fetchInventoryTransactionsViaApi(request, adminToken, {
      type: "SALE_DEDUCT",
      search: orderCode,
    });
    expect(txs.length).toBe(expectedDeductByIngId.size);
    expect(txs.every((t) => t.orderCode === orderCode && t.quantity < 0)).toBe(true);

    const customerAfter = await fetchCustomerByPhoneViaApi(request, adminToken, "0988777666");
    expect(customerAfter.currentPoints).toBe(pointsBefore - 250 + 1);
    const ptTxs = await fetchCustomerTransactionsViaApi(request, adminToken, customerAfter.id);
    const orderPtTxs = ptTxs.filter((pt) => pt.orderId === order.id);
    expect(orderPtTxs.some((pt) => pt.type === "REDEEM" && pt.pointsChange === -250)).toBe(true);
    expect(orderPtTxs.some((pt) => pt.type === "EARN" && pt.pointsChange === 1)).toBe(true);
  });

  test("E2E-CORE-02 @P0: Direct POS order -> KDS -> VietQR checkout & BOM deduction", async ({
    openRole,
    request,
  }) => {
    const adminToken = await loginViaGateway(
      request,
      SEED_USERS.admin.username,
      SEED_USERS.admin.password
    );
    const ingsBefore = await fetchIngredientsViaApi(request, adminToken);
    const gaBefore = ingsBefore.find((i) => i.code === "NL-GA")!.currentStock;

    const { page: chefPage } = await openRole("chef", "/kds");
    const { page: cashierPage } = await openRole("cashier", "/pos");
    const pos = new PosPage(cashierPage);
    const kds = new KdsPage(chefPage);

    await pos.selectTable(17);
    await pos.addSimpleOrConfiguredItem("Gà Sốt Cay Hàn Quốc", { sizeName: "Phần 4 miếng" });
    await pos.sendToKitchen();
    await expect(cashierPage.getByText(/Đã gửi đơn #ORD-/)).toBeVisible({ timeout: 15_000 });

    const orders = await fetchOrdersViaApi(request, adminToken, "?tableNumber=17");
    const active = orders.find((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED")!;
    expect(active).toBeDefined();

    // KDS sees order and marks ready
    await expect(kds.taskCard(active.orderCode, "Gà Sốt Cay Hàn Quốc")).toBeVisible({
      timeout: 10_000,
    });
    await kds.completeTask(active.orderCode, "Gà Sốt Cay Hàn Quốc");
    await expect(pos.tableButton(17)).toContainText("Bếp đã xong", { timeout: 10_000 });

    // POS pays via VietQR modal
    await pos.openPaymentModal(false);
    await pos.payVietQr();
    await expect(cashierPage.getByText(/Thanh toán thành công Bàn 17/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(pos.tableButton(17)).toContainText("Trống", { timeout: 10_000 });

    const paid = await fetchOrderByCodeViaApi(request, adminToken, active.orderCode);
    expect(paid.status).toBe("COMPLETED");
    expect(paid.paymentStatus).toBe("PAID");
    expect(paid.paymentMethod).toBe("VIETQR");

    const ingsAfter = await fetchIngredientsViaApi(request, adminToken);
    const gaAfter = ingsAfter.find((i) => i.code === "NL-GA")!.currentStock;
    expect(gaAfter).toBeCloseTo(gaBefore - 0.25, 3);
  });

  test("E2E-CORE-03 @P0: Cancel order on POS frees table, removes KDS task & preserves inventory", async ({
    openRole,
    request,
  }) => {
    const adminToken = await loginViaGateway(
      request,
      SEED_USERS.admin.username,
      SEED_USERS.admin.password
    );
    const ingsBefore = await fetchIngredientsViaApi(request, adminToken);
    const boBefore = ingsBefore.find((i) => i.code === "NL-BO")!.currentStock;
    const miBefore = ingsBefore.find((i) => i.code === "NL-MI")!.currentStock;

    const { page: chefPage } = await openRole("chef", "/kds");
    const { page: cashierPage } = await openRole("cashier", "/pos");
    const pos = new PosPage(cashierPage);
    const kds = new KdsPage(chefPage);

    await pos.selectTable(18);
    await pos.addSimpleOrConfiguredItem("Mì Cay Bò Mỹ", { sizeName: "Cấp 1" });
    await pos.sendToKitchen();
    await expect(cashierPage.getByText(/Đã gửi đơn #ORD-/)).toBeVisible({ timeout: 15_000 });

    const orders = await fetchOrdersViaApi(request, adminToken, "?tableNumber=18");
    const active = orders.find((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED")!;
    expect(active).toBeDefined();

    await expect(kds.taskCard(active.orderCode)).toBeVisible({ timeout: 10_000 });

    await pos.cancelOrder();
    await expect(cashierPage.getByText(/Đã hủy đơn Bàn 18/)).toBeVisible({ timeout: 15_000 });
    await expect(pos.tableButton(18)).toContainText("Trống", { timeout: 10_000 });
    await expect(kds.taskCard(active.orderCode)).toHaveCount(0, { timeout: 10_000 });

    const cancelled = await fetchOrderByCodeViaApi(request, adminToken, active.orderCode);
    expect(cancelled.status).toBe("CANCELLED");

    const ingsAfter = await fetchIngredientsViaApi(request, adminToken);
    expect(ingsAfter.find((i) => i.code === "NL-BO")!.currentStock).toBeCloseTo(boBefore, 3);
    expect(ingsAfter.find((i) => i.code === "NL-MI")!.currentStock).toBeCloseTo(miBefore, 3);

    const deductTxs = await fetchInventoryTransactionsViaApi(request, adminToken, {
      type: "SALE_DEDUCT",
      search: active.orderCode,
    });
    expect(deductTxs).toHaveLength(0);
  });
});
