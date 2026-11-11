import { expect, type Page } from "@playwright/test";

export class AdminOrdersPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/orders");
    await expect(this.page.getByRole("heading", { name: "Lịch sử hóa đơn bán hàng" })).toBeVisible();
  }

  async search(query: string): Promise<void> {
    await this.page.getByPlaceholder("Mã đơn, bàn, SĐT, tên...").fill(query);
  }

  async openOrderDetail(orderCode: string): Promise<void> {
    const row = this.page.locator("tbody tr", { hasText: `#${orderCode}` }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.getByRole("button", { name: "Xem & In" }).click();
    await expect(this.page.getByRole("heading", { name: "Chi tiết hóa đơn" })).toBeVisible();
  }

  async exportCsv(): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.getByRole("button", { name: /Xuất file Excel \/ CSV/i }).click(),
    ]);
    return download.suggestedFilename();
  }
}
