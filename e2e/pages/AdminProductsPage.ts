import { expect, type Page } from "@playwright/test";

export class AdminProductsPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/products");
    await expect(this.page.getByText("Quản Lý Món Ăn & Thực Đơn")).toBeVisible();
  }

  async createCategory(name: string, order?: number): Promise<void> {
    await this.page.getByRole("button", { name: /Danh mục \(/i }).click();
    const catModal = this.page.locator("div.fixed").filter({ hasText: "Quản lý Danh mục Thực đơn" });
    await expect(catModal.getByRole("heading", { name: "Quản lý Danh mục Thực đơn" })).toBeVisible();
    await catModal.getByPlaceholder(/Tên danh mục/i).fill(name);
    if (order !== undefined) {
      await catModal.getByTitle("Thứ tự hiển thị").first().fill(String(order));
    }
    await catModal.getByRole("button", { name: "Thêm", exact: true }).click();
    await expect(catModal.getByText(name, { exact: true })).toBeVisible();
    await catModal.locator("button:has(svg.lucide-x)").first().click();
  }

  async openCreateProductModal(): Promise<void> {
    await this.page.getByRole("button", { name: "Thêm Món Mới" }).click();
    await expect(this.page.getByRole("heading", { name: "Thêm món ăn mới" })).toBeVisible();
  }

  async fillAndSubmitProduct(opts: {
    categoryName: string;
    code: string;
    name: string;
    basePrice: number;
    description?: string;
    imagePath?: string;
    variants?: { sizeName: string; priceAdjustment: number; sku?: string }[];
    modifierGroupNames?: string[];
  }): Promise<void> {
    const modal = this.page.locator("form").filter({ hasText: "Tên món ăn" }).locator("..");

    if (opts.imagePath) {
      const fileInput = modal.locator('input[type="file"]');
      await fileInput.setInputFiles(opts.imagePath);
      await expect(this.page.getByText("Tải ảnh thành công")).toBeVisible({ timeout: 15_000 });
    }

    await modal.locator("select").selectOption({ label: opts.categoryName });
    await modal.getByPlaceholder(/VD: MC-BO/i).fill(opts.code);
    await modal.getByPlaceholder(/VD: Mì Cay Bò Mỹ/i).fill(opts.name);
    await modal.locator('input[type="number"][step="1000"]').first().fill(String(opts.basePrice));

    if (opts.description) {
      await modal.getByPlaceholder(/Thành phần nổi bật/i).fill(opts.description);
    }

    for (let i = 0; i < (opts.variants?.length ?? 0); i++) {
      const v = opts.variants![i];
      await modal.getByRole("button", { name: "Thêm Size" }).click();
      const row = modal.locator('input[placeholder*="Tên size"]').nth(i).locator("../..");
      await row.locator('input[placeholder*="Tên size"]').fill(v.sizeName);
      await row.locator('input[type="number"]').fill(String(v.priceAdjustment));
      if (v.sku) {
        await row.locator('input[placeholder="SKU size"]').fill(v.sku);
      }
    }

    for (const grp of opts.modifierGroupNames ?? []) {
      await modal.locator("label", { hasText: grp }).first().click();
    }

    await modal.getByRole("button", { name: "Tạo món ăn" }).click();
    await expect(this.page.getByRole("heading", { name: "Thêm món ăn mới" })).toBeHidden({
      timeout: 15_000,
    });
  }

  async search(term: string): Promise<void> {
    await this.page.getByPlaceholder("Tìm theo tên món hoặc mã SKU...").fill(term);
  }

  async toggleProductActive(productName: string): Promise<void> {
    const row = this.page.locator("tbody tr", { hasText: productName }).first();
    await row.locator('input[type="checkbox"]').locator("..").click();
  }
}
