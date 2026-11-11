import { expect, type Page } from "@playwright/test";

export class AdminStaffPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/staff");
    await expect(this.page.getByRole("button", { name: "Nhân sự" })).toBeVisible();
  }

  async switchTab(tab: "Nhân sự" | "Vai trò & Phân quyền" | "Chi nhánh" | "Bàn & mã QR"): Promise<void> {
    await this.page.getByRole("button", { name: tab, exact: true }).click();
  }

  async createRole(name: string, description: string): Promise<void> {
    await this.switchTab("Vai trò & Phân quyền");
    await this.page.getByRole("button", { name: "Tạo vai trò mới" }).click();
    await this.page.getByPlaceholder(/VD: SHIFT_LEAD/i).fill(name);
    await this.page.getByPlaceholder(/VD: Trưởng ca/i).fill(description);
    await this.page.getByRole("button", { name: "Tạo vai trò", exact: true }).click();
    await expect(this.page.locator("tbody tr", { hasText: name })).toBeVisible({ timeout: 15_000 });
  }

  async configureRolePermissions(roleName: string, permissionCodes: string[]): Promise<void> {
    await this.switchTab("Vai trò & Phân quyền");
    const row = this.page.locator("tbody tr", { hasText: roleName }).first();
    await row.getByRole("button", { name: /Cấu hình quyền/ }).click();
    const modal = this.page.locator("div.fixed").filter({ hasText: `Phân quyền động: ${roleName}` });
    await expect(modal).toBeVisible();

    for (const code of permissionCodes) {
      const permLabel = modal.locator("label", { hasText: code }).first();
      const cb = permLabel.locator('input[type="checkbox"]');
      if (!(await cb.isChecked())) {
        await permLabel.click();
      }
    }
    await modal.getByRole("button", { name: /Lưu phân quyền/i }).click();
    await expect(this.page.getByText("Đã lưu phân quyền động")).toBeVisible({ timeout: 15_000 });
  }

  async createStaff(opts: {
    username: string;
    password: string;
    fullName: string;
    phone: string;
    roleName: string;
  }): Promise<void> {
    await this.switchTab("Nhân sự");
    await this.page.getByRole("button", { name: "+ Thêm nhân viên" }).click();
    const modal = this.page.locator("form").filter({ hasText: "Tên đăng nhập" }).locator("..");
    await modal.getByPlaceholder(/VD: cashier03/i).fill(opts.username);
    await modal.getByPlaceholder("Nhập mật khẩu khởi tạo").fill(opts.password);
    await modal.getByPlaceholder("VD: Nguyễn Văn A").fill(opts.fullName);
    await modal.getByPlaceholder("VD: 0912345678").fill(opts.phone);
    const select = modal.locator("select");
    await expect(select.locator("option", { hasText: opts.roleName }).first()).toBeAttached({
      timeout: 15_000,
    });
    const options = await select.locator("option").allTextContents();
    const match = options.find((o) => o.startsWith(`${opts.roleName} -`) || o.includes(opts.roleName));
    if (!match) {
      throw new Error(`Role "${opts.roleName}" not found in staff modal`);
    }
    await select.selectOption({ label: match });
    await modal.getByRole("button", { name: "Tạo nhân viên" }).click();
    await expect(this.page.locator("tbody tr", { hasText: opts.username })).toBeVisible({ timeout: 15_000 });
  }

  async resetUserPassword(username: string, newPassword: string): Promise<void> {
    await this.switchTab("Nhân sự");
    await this.page.getByPlaceholder(/Tìm nhân viên theo tên/).fill(username);
    const row = this.page.locator("tbody tr", { hasText: username }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Mật khẩu" }).click();
    await this.page.getByPlaceholder("Nhập mật khẩu mới").fill(newPassword);
    await this.page.getByRole("button", { name: "Xác nhận đặt lại" }).click();
    await expect(this.page.getByText(/Đã đặt lại mật khẩu|Đặt lại mật khẩu thành công/i)).toBeVisible({
      timeout: 15_000,
    });
  }
}
