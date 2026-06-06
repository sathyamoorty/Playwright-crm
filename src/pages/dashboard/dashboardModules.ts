import { Page, expect, Locator } from '@playwright/test';

export type DashboardModule = {
  label: string;
  modulename: string;
};

/** UI shows at most this many module tabs in `#homemenucard`; rest go under more_vert kebab. */
export const DASHBOARD_VISIBLE_MODULE_LIMIT = 5;

export type DashboardModuleTabs = {
  visibleInBar: DashboardModule[];
  inKebabMenu: DashboardModule[];
  all: DashboardModule[];
  kebabVisible: boolean;
};

export class dashboardModules {
  constructor(private page: Page) {}

  menuCard() {
    return this.page.locator('#homemenucard');
  }

  kebabButton() {
    return this.menuCard()
      .locator('#dropdownrelatedmodButton')
      .or(this.menuCard().getByText('more_vert', { exact: true }))
      .first();
  }

  /** Overflow tab lives in `li.nav-item.more`; menu is hidden until kebab is opened. */
  private kebabNavItem() {
    return this.menuCard().locator('li.nav-item.more').last();
  }

  private kebabDropdownMenu() {
    return this.kebabNavItem().locator('.dropdown-menu');
  }

  private async closeMenus() {
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  /** Click more_vert and wait for the overflow dropdown panel to be visible. */
  private async openKebabMenu(): Promise<Locator> {
    await this.closeMenus();
    await this.kebabButton().click();
    const menu = this.kebabDropdownMenu();
    await expect(menu).toBeVisible({ timeout: 8_000 });
    return menu;
  }

  private async readModuleLinks(links: Locator): Promise<DashboardModule[]> {
    const modules: DashboardModule[] = [];
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const modulename = (await link.getAttribute('modulename'))?.trim() ?? '';
      const label = (await link.locator('span').innerText()).trim();
      if (!modulename || !label) continue;
      if (modules.some((m) => m.modulename === modulename)) continue;
      modules.push({ label, modulename });
    }

    return modules;
  }

  private async waitAfterModuleClick() {
    await expect(this.page.locator('#livewireOverly')).toBeHidden({
      timeout: 80_000,
    });
  }

  /** Bar tabs only — never opens the kebab menu. */
  async getVisibleBarModules(): Promise<DashboardModule[]> {
    const menuCard = this.menuCard();
    await expect(menuCard).toBeVisible({ timeout: 30_000 });
    return this.readModuleLinks(
      menuCard.locator('li.nav-item:not(.more) a.filterlist[id^="MoreMod_"]'),
    );
  }

  async isKebabVisible(): Promise<boolean> {
    return this.kebabButton().isVisible().catch(() => false);
  }

  /**
   * Opens kebab once, reads overflow modules, then closes menu.
   * Call only after bar modules are finished (redirect / count / create flows).
   */
  async readKebabMenuModules(): Promise<DashboardModule[]> {
    if (!(await this.isKebabVisible())) {
      return [];
    }

    const menu = await this.openKebabMenu();
    const modules = await this.readModuleLinks(
      menu.locator('a.filterlist.more_value[id^="MoreMod_"]'),
    );
    await this.closeMenus();
    return modules;
  }

  /** Full picture; opens kebab only when `includeKebabOverflow` is true (default false). */
  async getModuleTabs(includeKebabOverflow = false): Promise<DashboardModuleTabs> {
    const visibleInBar = await this.getVisibleBarModules();
    const kebabVisible = await this.isKebabVisible();
    let inKebabMenu: DashboardModule[] = [];

    if (includeKebabOverflow && kebabVisible) {
      inKebabMenu = await this.readKebabMenuModules();
    }

    const all = [...visibleInBar];
    for (const mod of inKebabMenu) {
      if (!all.some((m) => m.modulename === mod.modulename)) {
        all.push(mod);
      }
    }

    return { visibleInBar, inKebabMenu, all, kebabVisible };
  }

  async expectKebabMenuRule() {
    const bar = await this.getVisibleBarModules();
    const kebabVisible = await this.isKebabVisible();

    if (kebabVisible) {
      expect(bar.length).toBe(DASHBOARD_VISIBLE_MODULE_LIMIT);
      const overflow = await this.readKebabMenuModules();
      expect(overflow.length).toBeGreaterThan(0);
    } else {
      expect(bar.length).toBeLessThanOrEqual(DASHBOARD_VISIBLE_MODULE_LIMIT);
    }
  }

  /** Login / listing: bar modules only — does not open kebab. */
  async captureModules(): Promise<DashboardModule[]> {
    const bar = await this.getVisibleBarModules();
    bar.forEach((m) => console.log(m.label));
    return bar;
  }

  /** Bar modules first, then kebab overflow (opens kebab once to read list). */
  async getAllDashboardModules(): Promise<Array<DashboardModule & { fromKebab: boolean }>> {
    const bar = await this.getVisibleBarModules();
    const all: Array<DashboardModule & { fromKebab: boolean }> = bar.map((m) => ({
      ...m,
      fromKebab: false,
    }));

    if (await this.isKebabVisible()) {
      for (const mod of await this.readKebabMenuModules()) {
        all.push({ ...mod, fromKebab: true });
      }
    }

    return all;
  }

  private resolveModule(
    modulenameOrLabel: string,
    modules: DashboardModule[],
  ): DashboardModule | undefined {
    return (
      modules.find((m) => m.modulename === modulenameOrLabel) ??
      modules.find((m) => m.label.toLowerCase() === modulenameOrLabel.toLowerCase()) ??
      modules.find((m) => `MoreMod_${m.modulename}` === modulenameOrLabel)
    );
  }

  private moduleLink(mod: DashboardModule, inKebab: boolean, menu?: Locator) {
    if (inKebab) {
      const root = menu ?? this.kebabDropdownMenu();
      return root.locator(`#MoreMod_${mod.modulename}`);
    }
    return this.menuCard().locator(`li.nav-item:not(.more) #MoreMod_${mod.modulename}`);
  }

  /** Click a module in the main bar (never opens kebab). */
  async clickBarModule(mod: DashboardModule): Promise<void> {
    await this.closeMenus();
    const link = this.moduleLink(mod, false);
    await expect(link).toBeVisible({ timeout: 15_000 });
    try {
      await link.click({ timeout: 10_000 });
    } catch {
      await link.click({ force: true });
    }
    await this.waitAfterModuleClick();
  }

  /** Open kebab and click one overflow module. */
  async clickKebabModule(mod: DashboardModule): Promise<void> {
    if (!(await this.isKebabVisible())) {
      throw new Error(
        `Cannot open kebab for "${mod.label}" — kebab is not visible on dashboard.`,
      );
    }
    const menu = await this.openKebabMenu();
    const link = this.moduleLink(mod, true, menu);
    await expect(link).toBeVisible({ timeout: 10_000 });
    await link.click();
    await this.waitAfterModuleClick();
    await this.closeMenus();
  }

  /**
   * Clicks by modulename or label: bar first; opens kebab only when the module is not in the bar.
   */
  async clickModuleTab(modulenameOrLabel: string): Promise<void> {
    const bar = await this.getVisibleBarModules();
    const fromId = modulenameOrLabel.startsWith('MoreMod_')
      ? modulenameOrLabel.replace(/^MoreMod_/, '')
      : modulenameOrLabel;

    const inBar = this.resolveModule(fromId, bar);
    if (inBar) {
      await this.clickBarModule(inBar);
      return;
    }

    if (!(await this.isKebabVisible())) {
      throw new Error(
        `Dashboard module "${modulenameOrLabel}" is not in the bar and kebab is hidden.`,
      );
    }

    const menu = await this.openKebabMenu();
    const overflow = await this.readModuleLinks(
      menu.locator('a.filterlist.more_value[id^="MoreMod_"]'),
    );
    const inKebab = this.resolveModule(fromId, overflow);
    if (!inKebab) {
      await this.closeMenus();
      throw new Error(
        `Dashboard module "${modulenameOrLabel}" not found. Bar: ${bar.map((m) => m.label).join(', ')}`,
      );
    }

    const link = this.moduleLink(inKebab, true, menu);
    await expect(link).toBeVisible({ timeout: 10_000 });
    await link.click();
    await this.waitAfterModuleClick();
    await this.closeMenus();
  }

  /**
   * Bar modules first, then kebab overflow one-by-one (kebab opens only per overflow module).
   */
  async forEachDashboardModule(
    onModule: (mod: DashboardModule, ctx: { fromKebab: boolean }) => Promise<void>,
  ): Promise<void> {
    const bar = await this.getVisibleBarModules();

    for (const mod of bar) {
      await this.clickBarModule(mod);
      await onModule(mod, { fromKebab: false });
    }

    if (!(await this.isKebabVisible())) {
      return;
    }

    const overflow = await this.readKebabMenuModules();
    for (const mod of overflow) {
      await this.clickKebabModule(mod);
      await onModule(mod, { fromKebab: true });
    }
  }
}
