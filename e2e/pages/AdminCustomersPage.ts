import { expect, type Page } from "@playwright/test";

export class AdminCustomersPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/customers");
    await expect(this.page.getByText("Khách hàng thân thiết & Điểm thưởng")).toBeVisible();
  }

  async search(query: string): Promise<void> {
    await this.page.getByPlaceholder("Tìm theo số điện thoại hoặc tên khách hàng...").fill(query);
    await this.page.getByRole("button", { name: "Tìm kiếm" }).click();
  }

  async openTransactions(phoneOrName: string): Promise<void> {
    const row = this.page.locator("tbody tr", { hasText: phoneOrName }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Lịch sử điểm" }).click();
  }
}
