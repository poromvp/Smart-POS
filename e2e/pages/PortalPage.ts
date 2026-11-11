import { expect, type Page } from "@playwright/test";

export class PortalPage {
  constructor(readonly page: Page) {}

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByText("Cổng phân hệ làm việc")).toBeVisible();
  }

  async openChangePasswordModal(): Promise<void> {
    await this.page.getByRole("button", { name: /Đổi mật khẩu/i }).click();
    await expect(this.page.getByRole("heading", { name: "Đổi mật khẩu cá nhân" })).toBeVisible();
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.openChangePasswordModal();
    await this.page.getByPlaceholder("Nhập mật khẩu đang dùng").fill(oldPassword);
    await this.page.getByPlaceholder("Nhập mật khẩu mới").fill(newPassword);
    await this.page.getByPlaceholder("Nhập lại mật khẩu mới").fill(newPassword);
    await this.page.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
  }

  async logout(): Promise<void> {
    await this.page.getByRole("button", { name: /Đăng xuất/i }).click();
    await this.page.waitForURL(/\/login/);
  }
}
