import { expect, type Page } from "@playwright/test";

export class MenuQrPage {
  constructor(readonly page: Page) {}

  async goto(table?: string | number): Promise<void> {
    const url = table !== undefined ? `/menu?table=${encodeURIComponent(String(table))}` : "/menu";
    await this.page.goto(url);
    await expect(this.page.getByRole("heading", { name: /Thực đơn/ })).toBeVisible();
  }

  async search(term: string): Promise<void> {
    await this.page.getByPlaceholder("Tìm kiếm món ăn, thức uống...").fill(term);
  }

  async selectCategory(categoryLabelPrefix: string): Promise<void> {
    await this.page.getByRole("button", { name: new RegExp(`^${categoryLabelPrefix}`, "i") }).click();
  }

  async openProductModal(productName: string): Promise<void> {
    await this.page
      .getByRole("button")
      .filter({ has: this.page.getByRole("heading", { name: productName, exact: true }) })
      .first()
      .click();
    await expect(this.page.getByRole("dialog")).toBeVisible();
  }

  async configureAndAddToCart(options: {
    sizeName?: string;
    modifiers?: string[];
    note?: string;
  }): Promise<void> {
    const dialog = this.page.getByRole("dialog");
    if (options.sizeName) {
      await dialog.getByRole("button", { name: new RegExp(options.sizeName) }).click();
    }
    for (const mod of options.modifiers ?? []) {
      await dialog.locator("label", { hasText: mod }).click();
    }
    if (options.note !== undefined) {
      await dialog.getByPlaceholder(/Ví dụ: Ít ngọt/).fill(options.note);
    }
    await dialog.getByRole("button", { name: /Thêm vào giỏ hàng/i }).click();
    await expect(dialog).toBeHidden();
  }

  async goToCart(): Promise<void> {
    await this.page.getByRole("button", { name: /Xem giỏ hàng/i }).click();
    await this.page.getByRole("button", { name: "Xem và xác nhận đơn" }).click();
    await this.page.waitForURL(/\/cart/);
  }
}
