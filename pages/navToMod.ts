import { Page, expect } from '@playwright/test'
import modules from '../data/modules.json'

export class navToModule {
  constructor(private page: Page) {}

  async waitForAppReady() {
    await expect(this.page.locator("#livewireOverly")).toBeHidden({
      timeout: 80000,
    });
  }

  async waitForDashboardReady() {
    await expect(this.page).toHaveURL(/\/admin\/Dashboard/i);
    await expect(this.page.locator("#vertical_header_name")).toBeVisible();
    await this.waitForAppReady();
  }

  async menuIcon() {
    await this.waitForAppReady();
    await this.page.locator("#vertical_header_name").click();
  }

  async dynMod(index: number) {
      const moduleName = modules[index];

    if (!moduleName) {
      throw new Error(`Module index ${index} not found in modules.json`);
    }

    const moduleId = moduleName
      .trim()
      .split(/\s+/)
      .map((word, index) => index === 0 ? word : word.toLowerCase())
      .join("_");

    const moduleLink = this.page
      .locator(`a[href*="Module=${moduleId}"]`)
      .filter({ hasText: moduleName })
      .first();
    
    // await expect(moduleLink).toBeVisible();
    await this.waitForAppReady();
    await moduleLink.click();
    await expect(this.page).toHaveURL(new RegExp(`Module=${moduleId}`, 'i'));
  }

  async dynamicAddBtn() {
    await this.waitForAppReady();
    await this.page.getByRole('button', { name: /^Add\b(?! Column)/ }).click();
    await this.waitForAppReady();
  }

  /**
   * Wait for a page heading. Long titles (4+ words) match a regex prefix on the first two words
   * so truncated UI labels (e.g. "Booking Informa…") still match "Booking Information …".
   */
  async dynMicHeading(heading: string, options?: { timeout?: number }) {
    const timeout = options?.timeout ?? 25_000
    const normalized = heading.trim().replace(/\s+/g, ' ')
    const words = normalized.split(/\s+/)
    const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const name =
      words.length >= 4
        ? new RegExp(`^${esc(words[0]!)}\\s+${esc(words[1]!)}`)
        : new RegExp(`^${esc(normalized)}$`)

    await expect(this.page.getByRole('heading', { name })).toBeVisible({ timeout })
  }
  async saveBtn() {
    await this.page.getByRole("button", { name: "Save", exact: true }).click();
  }
  async manualModuleClk(){
    await this.page.getByRole("link",{name:"House Site Visit",exact:true}).click();
  }
}
