import { expect, type Locator, type Page } from "@playwright/test";

export class KdsPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/kds");
    await expect(this.page.getByText("Điều phối bếp (KDS)")).toBeVisible();
  }

  async switchStation(station: "Bếp nóng" | "Đồ lạnh" | "Quầy bar"): Promise<void> {
    await this.page.getByRole("button", { name: new RegExp(`^${station}`) }).click();
  }

  async switchMainView(view: "tasks" | "inventory"): Promise<void> {
    const label = view === "tasks" ? "Điều phối món" : "Kho nguyên liệu";
    await this.page.locator("header").getByRole("button", { name: new RegExp(label) }).click();
  }

  taskCard(orderCode: string, productName?: string): Locator {
    let cards = this.page.locator("section div.rounded-3xl, section div.rounded-2xl").filter({
      hasText: `#${orderCode}`,
    });
    if (productName) {
      cards = cards.filter({ hasText: productName });
    }
    return cards.first();
  }

  async completeTask(orderCode: string, productName?: string): Promise<void> {
    const card = this.taskCard(orderCode, productName);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole("button", { name: /Hoàn thành/i }).first().click();
  }
}
