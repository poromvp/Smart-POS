import { expect, type Page } from "@playwright/test";

export class AdminPurchasingPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/purchasing");
    await expect(this.page.getByRole("heading", { name: /Nhập Kho & Mua Hàng/ })).toBeVisible();
  }

  async createDraftPurchaseOrder(opts: {
    supplierNamePart?: string;
    ingredientNamePart: string;
    quantity: number;
    unitPrice: number;
    note?: string;
  }): Promise<void> {
    await this.page.getByRole("button", { name: "Lập phiếu nhập mới" }).click();
    await expect(this.page.getByText("Lập Phiếu Nhập Kho Mới")).toBeVisible();

    const modal = this.page.locator("form").filter({ hasText: "Chi tiết nguyên liệu nhập" }).locator("..");
    const supSelect = modal.locator("select").first();
    await expect(supSelect.locator("option").nth(1)).toBeAttached({ timeout: 15_000 });
    if (opts.supplierNamePart) {
      const supOpts = await supSelect.locator("option").allTextContents();
      const match = supOpts.find((o) => o.includes(opts.supplierNamePart!));
      if (!match) {
        throw new Error(`Supplier "${opts.supplierNamePart}" not found in PO modal`);
      }
      await supSelect.selectOption({ label: match });
    } else {
      await supSelect.selectOption({ index: 1 });
    }

    await modal.getByRole("button", { name: "Thêm dòng" }).click();

    const row = modal.locator("tbody tr").first();
    const ingSelect = row.locator("select");
    await expect(ingSelect.locator("option", { hasText: opts.ingredientNamePart }).first()).toBeAttached({
      timeout: 15_000,
    });
    const ingOpts = await ingSelect.locator("option").allTextContents();
    const ingMatch = ingOpts.find((o) => o.includes(opts.ingredientNamePart));
    if (!ingMatch) {
      throw new Error(`Ingredient "${opts.ingredientNamePart}" not found in PO modal`);
    }
    await ingSelect.selectOption({ label: ingMatch });
    const inputs = row.locator('input[type="number"]');
    await inputs.nth(0).fill(String(opts.quantity));
    await inputs.nth(1).fill(String(opts.unitPrice));

    if (opts.note) {
      await modal.getByPlaceholder(/Nhập thịt tươi/i).fill(opts.note);
    }

    await modal.locator('button[type="submit"]').click();
    await expect(this.page.getByText(/Đã tạo phiếu nhập kho mới/)).toBeVisible({ timeout: 15_000 });
  }

  async completePurchaseOrderByNoteOrPo(identifier: string): Promise<void> {
    this.page.once("dialog", (dialog) => dialog.accept());
    const row = this.page.locator("tbody tr", { hasText: identifier }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Duyệt nhập" }).click();
    await expect(this.page.getByText("Nhập kho thành công")).toBeVisible({ timeout: 15_000 });
  }
}
