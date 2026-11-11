import { expect, type Locator, type Page } from "@playwright/test";

export class PosPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/pos");
    await expect(this.page.getByText("Màn hình thu ngân (POS)")).toBeVisible();
  }

  tableButton(tableNum: number): Locator {
    return this.page
      .locator("button")
      .filter({ has: this.page.locator("span", { hasText: new RegExp(`^Bàn ${tableNum}$`) }) })
      .first();
  }

  async selectTable(tableNum: number): Promise<void> {
    await this.tableButton(tableNum).click();
    await expect(this.page.getByRole("heading", { name: `Bàn ${tableNum}` })).toBeVisible();
  }

  async addSimpleOrConfiguredItem(
    productName: string,
    options?: { sizeName?: string; modifiers?: string[]; quantity?: number }
  ): Promise<void> {
    const addBtn = this.page.getByRole("button", { name: "Thêm món", exact: true });
    if (await addBtn.isVisible()) {
      await addBtn.click();
    }
    await this.page.getByPlaceholder("Tìm tên món…").fill(productName);
    await this.page.getByRole("button", { name: new RegExp(productName) }).first().click();

    const dialog = this.page.getByRole("dialog");
    if (await dialog.isVisible({ timeout: 1500 }).catch(() => false)) {
      if (options?.sizeName) {
        await dialog.getByRole("button", { name: new RegExp(options.sizeName) }).click();
      }
      for (const mod of options?.modifiers ?? []) {
        await dialog.getByRole("button", { name: new RegExp(mod) }).click();
      }
      await dialog.getByRole("button", { name: /Thêm vào đơn/i }).click();
      await expect(dialog).toBeHidden();
    }

    const backBtn = this.page.getByRole("button", { name: "Về hóa đơn" });
    if (await backBtn.isVisible().catch(() => false)) {
      await backBtn.click();
    }
  }

  async sendToKitchen(): Promise<void> {
    await this.page.getByRole("button", { name: "Gửi bếp" }).click();
  }

  async lookupCustomer(phone: string): Promise<void> {
    await this.page.getByPlaceholder("Nhập SĐT khách hàng...").fill(phone);
    await this.page.getByRole("button", { name: "Tìm", exact: true }).click();
  }

  async quickRegisterCustomer(phone: string, fullName?: string): Promise<void> {
    await this.lookupCustomer(phone);
    await expect(this.page.getByRole("button", { name: /Đăng ký nhanh SĐT này/i })).toBeVisible();
    if (fullName) {
      await this.page.getByPlaceholder("Họ tên khách hàng (tùy chọn)...").fill(fullName);
    }
    await this.page.getByRole("button", { name: /Đăng ký nhanh SĐT này/i }).click();
  }

  async toggleUsePoints(): Promise<void> {
    await this.page.locator("label", { hasText: /Dùng \d+ điểm giảm/ }).locator("input[type='checkbox']").check();
  }

  async applyPromo(code: string): Promise<void> {
    await this.page.getByPlaceholder(/Nhập mã voucher/i).fill(code);
    await this.page.getByRole("button", { name: "Áp dụng" }).click();
  }

  async openPaymentModal(confirmKitchenWarning = true): Promise<void> {
    await this.page.getByRole("button", { name: /^Thanh toán(\s+Bếp chưa xong)?$/ }).click();
    const warningHeading = this.page.getByText("Bếp chưa hoàn tất món ăn!");
    if (confirmKitchenWarning && (await warningHeading.isVisible({ timeout: 1000 }).catch(() => false))) {
      await this.page.getByRole("button", { name: "Vẫn tiếp tục thanh toán" }).click();
    }
    await expect(this.page.locator("dialog[open]")).toBeVisible();
  }

  async payCash(cashReceived?: number): Promise<void> {
    const modal = this.page.locator("dialog[open]");
    await modal.getByRole("button", { name: "Tiền mặt", exact: true }).click();
    if (cashReceived !== undefined) {
      await modal.locator("#cash-received").fill(String(cashReceived));
    }
    await modal.getByRole("button", { name: "Hoàn tất thanh toán tiền mặt" }).click();
  }

  async payVietQr(): Promise<void> {
    const modal = this.page.locator("dialog[open]");
    await modal.getByRole("button", { name: "VietQR / Chuyển khoản", exact: true }).click();
    await modal.getByRole("button", { name: "Xác nhận đã nhận chuyển khoản" }).click();
  }

  async cancelOrder(): Promise<void> {
    await this.page.getByRole("button", { name: "Hủy đơn" }).click();
    await this.page.getByRole("button", { name: "Đồng ý hủy đơn" }).click();
  }
}
