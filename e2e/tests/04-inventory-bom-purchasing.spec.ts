import { test, expect } from "../fixtures/authContexts";
import {
  fetchCustomerByPhoneViaApi,
  fetchIngredientsViaApi,
  fetchInventoryTransactionsViaApi,
  fetchOrderByCodeViaApi,
  fetchOrdersViaApi,
  getJsonEnvelope,
  loginViaGateway,
  postJsonEnvelope,
} from "../fixtures/apiHelper";
import { GATEWAY_URL, SEED_USERS, uniqueSuffix } from "../fixtures/constants";
import { PosPage } from "../pages/PosPage";
import { AdminPurchasingPage } from "../pages/AdminPurchasingPage";
import { AdminInventoryPage } from "../pages/AdminInventoryPage";
import { AdminBomPage } from "../pages/AdminBomPage";
import { KdsPage } from "../pages/KdsPage";

test.describe("Suite 4: Inventory, 3-Layer BOM & Purchasing", () => {
  test("E2E-INV-01 @P0: Block checkout & rollback atomically on insufficient stock", async ({
    openRole,
    request,
  }) => {
    const suffix = uniqueSuffix();
    const adminToken = await loginViaGateway(
      request,
      SEED_USERS.admin.username,
      SEED_USERS.admin.password
    );

    // Create 2 test ingredients: one sufficient (stock=10), one insufficient (stock=1, recipe needs 2)
    const okIng = await postJsonEnvelope<{ id: number; code: string; currentStock: number }>(
      request,
      "/api/catalog/ingredients",
      {
        name: `E2E OK ${suffix}`,
        code: `E2E-OK-${suffix}`,
        unit: "kg",
        currentStock: 10,
        minThreshold: 1,
        costPerUnit: 10000,
        isActive: true,
      },
      adminToken
    );

    const shortIng = await postJsonEnvelope<{ id: number; code: string; currentStock: number }>(
      request,
      "/api/catalog/ingredients",
      {
        name: `E2E Short ${suffix}`,
        code: `E2E-SHORT-${suffix}`,
        unit: "kg",
        currentStock: 1,
        minThreshold: 0.5,
        costPerUnit: 20000,
        isActive: true,
      },
      adminToken
    );

    const categories = await getJsonEnvelope<{ id: number; name: string }[]>(
      request,
      "/api/catalog/categories",
      adminToken
    );

    const testProduct = await postJsonEnvelope<{ id: number; name: string }>(
      request,
      "/api/catalog/products",
      {
        categoryId: categories[0].id,
        name: `E2E Món Thiếu Kho ${suffix}`,
        code: `E2E-MK-${suffix}`,
        basePrice: 120000,
        isActive: true,
        variants: [],
        modifierGroupIds: [],
      },
      adminToken
    );

    await postJsonEnvelope(
      request,
      `/api/catalog/recipes/product/${testProduct.id}`,
      {
        items: [
          { ingredientId: okIng.id, quantityNeeded: 0.5 },
          { ingredientId: shortIng.id, quantityNeeded: 2.0 },
        ],
      },
      adminToken
    );

    const promoBefore = await getJsonEnvelope<{ usedCount: number }>(
      request,
      "/api/sales/promotions/code/OPENING",
      adminToken
    );
    const customerBefore = await fetchCustomerByPhoneViaApi(request, adminToken, "0988777666");

    // Cashier creates order on Table 19, sends to kitchen, applies loyalty + OPENING, attempts checkout
    const { page: cashierPage } = await openRole("cashier", "/pos");
    const pos = new PosPage(cashierPage);
    await pos.selectTable(19);
    await pos.addSimpleOrConfiguredItem(testProduct.name);
    await pos.sendToKitchen();
    await expect(cashierPage.getByText(/Đã gửi đơn #ORD-/)).toBeVisible({ timeout: 15_000 });

    const orders = await fetchOrdersViaApi(request, adminToken, "?tableNumber=19");
    const active = orders.find((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED")!;
    expect(active).toBeDefined();

    await pos.lookupCustomer("0988777666");
    await pos.toggleUsePoints();
    await pos.applyPromo("OPENING");

    const checkoutPromise = cashierPage.waitForResponse(
      (res) => res.url().includes(`/api/sales/orders/${active.id}/checkout`) && res.request().method() === "POST"
    );
    await pos.openPaymentModal(true);
    await pos.payCash();

    const checkoutRes = await checkoutPromise;
    expect(checkoutRes.status()).toBeGreaterThanOrEqual(400);
    await expect(cashierPage.getByText("Lỗi thanh toán")).toBeVisible({ timeout: 10_000 });

    // Close payment modal & verify full rollback across services
    await cashierPage.getByRole("button", { name: "Quay lại hóa đơn" }).click();

    const orderAfter = await fetchOrderByCodeViaApi(request, adminToken, active.orderCode);
    expect(orderAfter.status).not.toBe("COMPLETED");
    expect(orderAfter.paymentStatus).toBe("UNPAID");

    const ingsAfter = await fetchIngredientsViaApi(request, adminToken);
    expect(ingsAfter.find((i) => i.id === okIng.id)!.currentStock).toBeCloseTo(10, 3);
    expect(ingsAfter.find((i) => i.id === shortIng.id)!.currentStock).toBeCloseTo(1, 3);

    const promoAfter = await getJsonEnvelope<{ usedCount: number }>(
      request,
      "/api/sales/promotions/code/OPENING",
      adminToken
    );
    expect(promoAfter.usedCount).toBe(promoBefore.usedCount);

    const customerAfter = await fetchCustomerByPhoneViaApi(request, adminToken, "0988777666");
    expect(customerAfter.currentPoints).toBe(customerBefore.currentPoints);

    // Clean up pending order on Table 19
    await pos.cancelOrder();
    await expect(pos.tableButton(19)).toContainText("Trống");
  });

  test("E2E-INV-02 @P1: Create DRAFT purchase order and complete stock import (/admin/purchasing)", async ({
    openRole,
    request,
  }) => {
    const suffix = uniqueSuffix();
    const note = `E2E-PO-${suffix}`;

    const adminToken = await loginViaGateway(
      request,
      SEED_USERS.admin.username,
      SEED_USERS.admin.password
    );
    const ingsBefore = await fetchIngredientsViaApi(request, adminToken);
    const namBefore = ingsBefore.find((i) => i.code === "NL-NAM")!.currentStock;

    const { page: mgrPage } = await openRole("manager", "/admin/purchasing");
    const purchasing = new AdminPurchasingPage(mgrPage);

    await purchasing.createDraftPurchaseOrder({
      supplierNamePart: "Đà Lạt Xanh",
      ingredientNamePart: "Nấm kim châm",
      quantity: 5,
      unitPrice: 9000,
      note,
    });

    await purchasing.completePurchaseOrderByNoteOrPo(note);

    const ingsAfter = await fetchIngredientsViaApi(request, adminToken);
    const namAfter = ingsAfter.find((i) => i.code === "NL-NAM")!.currentStock;
    expect(namAfter).toBeCloseTo(namBefore + 5, 3);

    const importTxs = await fetchInventoryTransactionsViaApi(request, adminToken, {
      type: "IMPORT",
    });
    expect(importTxs.some((tx) => tx.ingredientCode === "NL-NAM" && tx.quantity === 5)).toBe(true);
  });

  test("E2E-INV-03 @P1: Audit adjust, spoilage, overflow guard & low-stock alerts sync across Admin & KDS", async ({
    openRole,
    request,
  }) => {
    const suffix = uniqueSuffix();
    const ingCode = `E2E-ADJ-${suffix}`;
    const ingName = `E2E Nguyên liệu ${suffix}`;

    // 1. Verify low-stock alert sync for NL-GA on /admin, /admin/inventory, and /kds
    const { page: adminDash } = await openRole("admin", "/admin");
    await expect(adminDash.getByText("Cảnh báo tồn kho")).toBeVisible({ timeout: 15_000 });
    await expect(
      adminDash.getByRole("heading", { name: /^[1-9]\d*\s+nguyên liệu$/ })
    ).toBeVisible({ timeout: 15_000 });

    const { page: kdsPage } = await openRole("chef", "/kds");
    const kds = new KdsPage(kdsPage);
    await kds.switchMainView("inventory");
    await expect(kdsPage.getByText("NL-GA")).toBeVisible({ timeout: 10_000 });
    await expect(kdsPage.getByText(/Sắp hết:/).first()).toBeVisible();

    // 2. On /admin/inventory: check alerts tab, create isolated ingredient, test AUDIT_ADJUST & SPOILAGE
    const { page: invPage } = await openRole("manager", "/admin/inventory");
    const inv = new AdminInventoryPage(invPage);

    await inv.switchTab("alerts");
    await expect(invPage.getByText("NL-GA")).toBeVisible();

    await inv.switchTab("stock");
    await inv.createIngredient({
      name: ingName,
      code: ingCode,
      unit: "kg",
      currentStock: 10,
      minThreshold: 5,
      costPerUnit: 50000,
    });

    // Audit adjust 10 -> 8.5
    await inv.performAuditAdjust(ingName, 8.5, `E2E Audit ${suffix}`);
    await expect(invPage.locator("tbody tr", { hasText: ingCode })).toContainText("8.5");

    // Attempt spoilage > current stock via UI (HTML5 max=8.5 blocks submit, stock stays 8.5)
    await inv.performSpoilage(ingName, 99, `E2E OverSpoil ${suffix}`);
    await expect(invPage.getByRole("dialog")).toBeVisible();
    await invPage.getByRole("dialog").getByRole("button", { name: "Hủy", exact: true }).click();

    // Also verify backend API rejects spoilage > stock with 4xx
    const managerToken = await loginViaGateway(
      request,
      SEED_USERS.manager.username,
      SEED_USERS.manager.password
    );
    const ingsNow = await fetchIngredientsViaApi(request, managerToken);
    const createdIng = ingsNow.find((i) => i.code === ingCode)!;
    const badSpoilRes = await request.post(`${GATEWAY_URL}/api/catalog/inventory/adjust`, {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: {
        ingredientId: createdIng.id,
        type: "SPOILAGE",
        quantity: 99,
        reason: "Over spoilage API guard",
      },
    });
    expect(badSpoilRes.status()).toBeGreaterThanOrEqual(400);

    // Valid spoilage 8.5 -> 7.0
    await inv.performSpoilage(ingName, 1.5, `E2E Spoil ${suffix}`);
    await expect(invPage.getByRole("dialog")).toBeHidden({ timeout: 15_000 });
    await expect(invPage.locator("tbody tr", { hasText: ingCode })).toContainText("7");

    // Verify ledger tab shows both transactions
    await inv.switchTab("ledger");
    await expect(invPage.getByText(`E2E Audit ${suffix}`)).toBeVisible();
    await expect(invPage.getByText(`E2E Spoil ${suffix}`)).toBeVisible();
  });

  test("E2E-BOM-01 @P1: Configure 3-layer BOM (/admin/menu-bom), persist across reload & deduct on checkout", async ({
    openRole,
    request,
  }) => {
    const suffix = uniqueSuffix();
    const adminToken = await loginViaGateway(
      request,
      SEED_USERS.admin.username,
      SEED_USERS.admin.password
    );

    const ing = await postJsonEnvelope<{ id: number; name: string; code: string }>(
      request,
      "/api/catalog/ingredients",
      {
        name: `E2E BOM Ing ${suffix}`,
        code: `E2EBOMI-${suffix}`,
        unit: "kg",
        currentStock: 20,
        minThreshold: 2,
        costPerUnit: 30000,
        isActive: true,
      },
      adminToken
    );

    const categories = await getJsonEnvelope<{ id: number; name: string }[]>(
      request,
      "/api/catalog/categories",
      adminToken
    );

    const product = await postJsonEnvelope<{
      id: number;
      name: string;
      variants: { id: number; sizeName: string }[];
    }>(
      request,
      "/api/catalog/products",
      {
        categoryId: categories[0].id,
        name: `E2E BOM Món ${suffix}`,
        code: `E2EBOMP-${suffix}`,
        basePrice: 60000,
        isActive: true,
        variants: [{ sizeName: "Size L", priceAdjustment: 10000, sku: `E2EBOML-${suffix}` }],
        modifierGroupIds: [],
      },
      adminToken
    );

    const { page: bomPage } = await openRole("admin", "/admin/menu-bom");
    const bom = new AdminBomPage(bomPage);

    await bom.selectProduct(product.name);
    await bom.selectScope("base");
    await bom.addIngredientRow(ing.name, 1.5);
    await bom.save();

    await bom.selectScope("variant");
    await bom.addIngredientRow(ing.name, 0.5);
    await bom.save();

    // Reload and verify persistence
    await bomPage.reload({ waitUntil: "domcontentloaded" });
    await bom.selectProduct(product.name);
    await expect(bomPage.getByRole("button", { name: /Công thức Món gốc/ })).toContainText("1");
    await bom.selectScope("variant");
    await expect(bomPage.getByText("Size L (1 nguyên liệu)")).toBeVisible();

    // Create & checkout 1 order for Size L -> expects 1.5 + 0.5 = 2.0 deducted (20 -> 18)
    const createdOrder = await postJsonEnvelope<{ id: number; orderCode: string }>(
      request,
      "/api/sales/orders",
      {
        orderType: "TAKEAWAY",
        items: [
          {
            productId: product.id,
            variantId: product.variants[0].id,
            name: `${product.name} (Size L)`,
            quantity: 1,
            basePrice: 70000,
            modifierTotal: 0,
            modifierOptionIds: [],
          },
        ],
      },
      adminToken
    );

    await postJsonEnvelope(
      request,
      `/api/sales/orders/${createdOrder.id}/checkout`,
      { paymentMethod: "CASH" },
      adminToken
    );

    const ingsAfter = await fetchIngredientsViaApi(request, adminToken);
    expect(ingsAfter.find((i) => i.id === ing.id)!.currentStock).toBeCloseTo(18, 3);
  });
});
