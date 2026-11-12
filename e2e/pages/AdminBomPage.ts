import { expect, type Page } from "@playwright/test";

export class AdminBomPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/menu-bom");
    await expect(this.page.getByText("Cấu hình Định lượng (BOM) & Giá vốn")).toBeVisible();
  }

  async selectProduct(labelPart: string): Promise<void> {
    const select = this.page.locator("select").first();
    await expect(select.locator("option", { hasText: labelPart }).first()).toBeAttached({
      timeout: 15_000,
    });
    const options = await select.locator("option").allTextContents();
    const match = options.find((o) => o.includes(labelPart));
    if (!match) {
      throw new Error(`Product option containing "${labelPart}" not found in: ${options.join(", ")}`);
    }
    await select.selectOption({ label: match });
    await expect(this.page.getByText(/Định lượng Món gốc:/)).toBeVisible();
  }

  async selectScope(scope: "base" | "variant" | "modifier"): Promise<void> {
    const labels = {
      base: "Công thức Món gốc",
      variant: "Định lượng theo Size",
      modifier: "Định lượng Topping",
    };
    await this.page.getByRole("button", { name: new RegExp(labels[scope]) }).click();
  }

  async addIngredientRow(ingredientNamePart: string, quantityNeeded: number): Promise<void> {
    await this.page.getByRole("button", { name: "Thêm nguyên liệu", exact: true }).click();
    const lastRow = this.page.locator("tbody tr").last();
    const select = lastRow.locator("select");
    await expect(select.locator("option", { hasText: ingredientNamePart }).first()).toBeAttached({
      timeout: 15_000,
    });
    const options = await select.locator("option").allTextContents();
    const match = options.find((o) => o.includes(ingredientNamePart));
    if (!match) {
      throw new Error(`Ingredient option containing "${ingredientNamePart}" not found`);
    }
    await select.selectOption({ label: match });
    await lastRow.locator('input[type="number"]').fill(String(quantityNeeded));
  }

  async save(): Promise<void> {
    await this.page.getByRole("button", { name: "Lưu cấu hình" }).click();
    await expect(this.page.getByText("Đã lưu công thức định lượng!")).toBeVisible({ timeout: 15_000 });
  }
}
