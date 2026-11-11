import { expect, type Page } from "@playwright/test";

export class CartPage {
  constructor(readonly page: Page) {}

  async goto(table?: string | number): Promise<void> {
    const url = table !== undefined ? `/cart?table=${encodeURIComponent(String(table))}` : "/cart";
    await this.page.goto(url);
    await expect(this.page.getByRole("heading", { name: "Xác nhận đơn" })).toBeVisible();
  }

  async increaseQuantity(productName: string): Promise<void> {
    await this.page.getByRole("button", { name: `Tăng số lượng ${productName}` }).first().click();
  }

  async decreaseQuantity(productName: string): Promise<void> {
    await this.page.getByRole("button", { name: `Giảm số lượng ${productName}` }).first().click();
  }

  async applyPromo(code: string): Promise<void> {
    await this.page.getByPlaceholder(/Nhập mã voucher/i).fill(code);
    await this.page.getByRole("button", { name: "Áp dụng" }).click();
  }

  async submitOrder(): Promise<string> {
    await this.page.getByRole("button", { name: "Xác nhận gọi món" }).click();
    await expect(this.page.getByRole("heading", { name: "Đã gửi đơn hàng thành công!" })).toBeVisible({
      timeout: 15_000,
    });
    const orderCodeBadge = await this.page.getByText(/Mã đơn: #ORD-/).textContent();
    return (orderCodeBadge || "").replace("Mã đơn: #", "").trim();
  }
}
