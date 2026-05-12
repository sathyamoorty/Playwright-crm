import { expect, Page } from "@playwright/test";

export class DashboardPage {

    constructor(private page: Page) {}  

    async profileIcon(){
        await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
          //await expect(this.page).toHaveURL(/\/admin\/Dashboard/i);
        await this.page.locator('.dropdown-toggle.nav-link.dropdown-user-link').first().click();
         // await this.page.getByText('settings', { exact: true }).click();
  //          const profileMenu = this.page
  //   .getByRole("listitem")
  //   .filter({ hasText: "rsoft My Profile" })
  //   .getByRole("link");

  // await profileMenu.click();

    }

    async crmSettings(){
       // await this.page.getByText(" CRM Setting").nth(1).click();
        // await this.page.waitForTimeout(2000);
          await this.page.getByRole('link', { name: ' CRM Setting' }).click();

    }

    async userAccessCtrl(){
        await this.page.getByRole("button", { name: "User & Access Control" }).click();
        }   
    async profileSettings(){
        await this.page.locator("label:has-text('Profile')").click();
        const profileText = this.page.locator("h3:has-text('Profiles')");
        await expect(profileText).toBeVisible();
    }
}
