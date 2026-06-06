import { Page, expect } from '@playwright/test';
import { formatErrorMessage } from '@utils/helpers/formatError';
import { Dashboardcount } from '@pages/dashboard/Dashboardcount';
import { TargetPage } from '@pages/dashboard/target';
import type { dashboardModules } from '@pages/dashboard/dashboardModules';
import type { DashboardModule } from '@pages/dashboard/dashboardModules';
import { DashboardLocators } from '../locators/dashboard.locators';
import { logFlowStep } from '../flow-logger';
import type { FlowOkState } from '../types';

/**
 * Step 4 — Actions: dashboard card interactions (uses `DashboardLocators`).
 */
export class DashboardCardActions {
  private readonly locators: DashboardLocators;

  constructor(
    private readonly dashboardPage: Page,
    private readonly dashModules: dashboardModules,
  ) {
    this.locators = new DashboardLocators(dashboardPage);
  }

  async clearfilter(): Promise<void> {
    await new Dashboardcount(this.dashboardPage)
      .clearDashboardFilter()
      .catch(() => {});
  }

  async safeClickModuleTab(
    mod: DashboardModule,
    targetData: TargetPage,
  ): Promise<void> {
    await targetData.dismissCustomizerOverlays();
    try {
      await this.dashModules.clickModuleTab(mod.modulename || mod.label);
    } catch (err) {
      console.log(
        `[flow][${mod.label}] Module tab click blocked — retrying after dismiss: ${formatErrorMessage(err)}`,
      );
      await targetData.dismissCustomizerOverlays();
      await this.dashModules
        .clickModuleTab(mod.modulename || mod.label)
        .catch(() => {});
    }
  }

  /** Wait for dashboard list cards on the active module tab. */
  async waitForModuleDashboardCards(moduleLabel: string): Promise<boolean> {
    const card = this.locators.firstDashboardCardBox();
    for (let attempt = 1; attempt <= 3; attempt++) {
      const visible = await card.isVisible({ timeout: 20_000 }).catch(() => false);
      if (visible) return true;
      console.log(
        `[flow][${moduleLabel}] No dashboard cards yet (attempt ${attempt}/3) — clearing filter and retrying`,
      );
      await this.clearfilter();
      await this.locators
        .livewireOverlay()
        .waitFor({ state: 'hidden', timeout: 30_000 })
        .catch(() => {});
    }
    return false;
  }

  async openFirstDashboardCard(page: Page = this.dashboardPage): Promise<Page> {
    const firstCard = this.locators.firstDashboardCardBody();

    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    const popupFromClick = page
      .context()
      .waitForEvent('page', { timeout: 15_000 })
      .catch(() => null);
    await firstCard.click();
    let listPage = await popupFromClick;

    if (!listPage) {
      const popupFromCtrlClick = page
        .context()
        .waitForEvent('page', { timeout: 15_000 })
        .catch(() => null);
      await firstCard.click({ modifiers: ['Control'] });
      listPage = await popupFromCtrlClick;
    }

    if (!listPage) {
      throw new Error('Dashboard card did not open a new tab.');
    }

    await listPage.waitForLoadState('domcontentloaded');
    await expect(new DashboardLocators(listPage).livewireOverlay()).toBeHidden({
      timeout: 80_000,
    });

    return listPage;
  }

  async runOpenListViewStep(
    mod: DashboardModule,
    flowOk: FlowOkState,
  ): Promise<Page> {
    logFlowStep(mod.label, 'openListView', 'start');
    const listPage = await this.openFirstDashboardCard(this.dashboardPage);
    await listPage.bringToFront();
    flowOk.openListView = true;
    logFlowStep(mod.label, 'openListView', 'done');
    return listPage;
  }
}

/** @deprecated Use `DashboardCardActions` — kept for internal compatibility. */
export const DashboardCardHelper = DashboardCardActions;
