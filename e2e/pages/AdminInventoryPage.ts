import { expect, type Page } from "@playwright/test";

export class AdminInventoryPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/inventory");
    await expect(this.page.getByText("Quản Lý Kho Hàng & Định Lượng")).toBeVisible();
  }

  async switchTab(tab: "stock" | "alerts" | "ledger"): Promise<void> {
    const labels = {
      stock: /Danh Mục Tồn Kho/,
      alerts: /Cảnh Báo Thiếu Hụt/,
      ledger: /Sổ Thẻ Kho/,
    };
    await this.page.getByRole("button", { name: labels[tab] }).click();
  }

  async createIngredient(opts: {
    name: string;
    code: string;
    unit: string;
    currentStock: number;
    minThreshold: number;
    costPerUnit: number;
  }): Promise<void> {
    await this.page.getByRole("button", { name: "Thêm nguyên liệu", exact: true }).click();
    const modal = this.page.locator("form").filter({ hasText: "Tên nguyên liệu" }).locator("..");
    await modal.getByPlaceholder(/VD: Cà phê hạt/).fill(opts.name);
    await modal.getByPlaceholder(/VD: NL-CF01/).fill(opts.code);
    await modal.getByPlaceholder(/VD: g, ml, kg/).fill(opts.unit);

    const nums = modal.locator('input[type="number"]');
    await nums.nth(0).fill(String(opts.currentStock));
    await nums.nth(1).fill(String(opts.minThreshold));
    await nums.nth(2).fill(String(opts.costPerUnit));

    await modal.getByRole("button", { name: "Tạo nguyên liệu" }).click();
    await expect(this.page.locator("tbody tr", { hasText: opts.code })).toBeVisible({ timeout: 15_000 });
  }

  async openAdjustmentModal(): Promise<void> {
    await this.page.getByRole("button", { name: "Cân bằng kho & Xuất hủy" }).click();
    await expect(this.page.getByRole("dialog")).toBeVisible();
  }

  async performAuditAdjust(ingredientNamePart: string, actualStock: number, reason: string): Promise<void> {
    await this.openAdjustmentModal();
    const dialog = this.page.getByRole("dialog");
    await dialog.getByRole("button", { name: /Kiểm kê thực tế/i }).click();

    const select = dialog.locator("select");
    await expect(select.locator("option", { hasText: ingredientNamePart }).first()).toBeAttached({
      timeout: 15_000,
    });
    const options = await select.locator("option").allTextContents();
    const match = options.find((o) => o.includes(ingredientNamePart));
    if (!match) throw new Error(`Ingredient "${ingredientNamePart}" not found in adjustment modal`);
    await select.selectOption({ label: match });

    await dialog.locator('input[type="number"]').fill(String(actualStock));
    await dialog.getByPlaceholder(/Kiểm kê định kỳ/i).fill(reason);
    await dialog.getByRole("button", { name: "Xác nhận điều chỉnh" }).click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });
  }

  async performSpoilage(ingredientNamePart: string, quantity: number, reason: string): Promise<void> {
    await this.openAdjustmentModal();
    const dialog = this.page.getByRole("dialog");
    await dialog.getByRole("button", { name: /Xuất hủy hàng hỏng/i }).click();

    const select = dialog.locator("select");
    await expect(select.locator("option", { hasText: ingredientNamePart }).first()).toBeAttached({
      timeout: 15_000,
    });
    const options = await select.locator("option").allTextContents();
    const match = options.find((o) => o.includes(ingredientNamePart));
    if (!match) throw new Error(`Ingredient "${ingredientNamePart}" not found in adjustment modal`);
    await select.selectOption({ label: match });

    await dialog.getByPlaceholder("Nhập số lượng hao hụt").fill(String(quantity));
    await dialog.getByPlaceholder(/Hết hạn sử dụng/i).fill(reason);
    await dialog.getByRole("button", { name: "Xác nhận điều chỉnh" }).click();
  }
}
