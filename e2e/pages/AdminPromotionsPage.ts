import { expect, type Page } from "@playwright/test";

export class AdminPromotionsPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/promotions");
    await expect(this.page.getByText("Chương trình khuyến mãi & Voucher")).toBeVisible();
  }

  async createPromotion(opts: {
    code: string;
    name: string;
    discountPercent: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    usageLimit?: number;
  }): Promise<void> {
    await this.page.getByRole("button", { name: /Tạo mã voucher mới/i }).click();
    const modal = this.page.locator("form").filter({ hasText: "Mã Voucher" }).locator("..");
    await modal.getByPlaceholder(/VD: GIAM10/i).fill(opts.code);
    await modal.locator('input[type="number"][max="100"]').fill(String(opts.discountPercent));
    await modal.getByPlaceholder(/VD: Khai xuân/i).fill(opts.name);

    if (opts.maxDiscountAmount !== undefined) {
      await modal.getByPlaceholder("Không giới hạn").first().fill(String(opts.maxDiscountAmount));
    }
    if (opts.minOrderAmount !== undefined) {
      await modal.locator('input[type="number"][step="1000"]').nth(1).fill(String(opts.minOrderAmount));
    }
    if (opts.usageLimit !== undefined) {
      await modal.getByPlaceholder("Không giới hạn").last().fill(String(opts.usageLimit));
    }

    await modal.getByRole("button", { name: "Lưu & Kích hoạt" }).click();
    await expect(this.page.getByText("Tạo mã khuyến mãi thành công!")).toBeVisible({ timeout: 15_000 });
  }

  async toggleStatus(code: string): Promise<void> {
    const row = this.page.locator("tbody tr", { hasText: code }).first();
    await row.getByRole("button", { name: /Đang áp dụng|Tạm ngưng/ }).click();
  }
}
