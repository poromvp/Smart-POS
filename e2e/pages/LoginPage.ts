import { expect, type Page } from "@playwright/test";

export class LoginPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/login");
    await expect(this.page.getByRole("heading", { name: "Đăng nhập tài khoản" })).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.locator("#login-username").fill(username);
    await this.page.locator("#login-password").fill(password);
    await this.page.getByRole("button", { name: /ĐĂNG NHẬP/i }).click();
  }

  async expectError(pattern?: string | RegExp): Promise<void> {
    const alert = this.page.getByText("Đăng nhập không thành công").locator("..");
    await expect(alert).toBeVisible();
    if (pattern) {
      await expect(alert).toContainText(pattern);
    }
  }
}
