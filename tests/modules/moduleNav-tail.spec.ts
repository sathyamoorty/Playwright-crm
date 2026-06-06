import { test } from '@playwright/test';
import { LoginPage } from '@pages/auth/login';
import { navToModule } from '@pages/modules/navToMod';
import {
  runQuickActionsFromListView,
  detailView,
  submodule,
  globalSearch,
  SMSModalPage,
  goToLeadsModule,
} from '@pages/quick-actions/ActionPage';
import { runListViewFilter } from '@pages/modules/listViewFilter';

/**
 * Runs from moduleNav.spec.ts ~line 159 (Leads list quick actions through filter).
 * Use when debugging the global-search / list-filter tail without the full ~10m flow.
 */
test.describe('module tail', () => {
  test.describe.configure({ timeout: 20 * 60 * 1000 });

  test('from quick actions through list filter', async ({ page }, testInfo) => {
    const logIn = new LoginPage(page);
    await logIn.loginPage();
    await logIn.login('RSAUTOMATION', 'rsoft', 'RSoft@2026');

    const leadsModule = new navToModule(page);
    await leadsModule.waitForDashboardReady();
    await goToLeadsModule(page);
    await leadsModule.dynMicHeading('Leads');

    const sms = new SMSModalPage(page);
    await runQuickActionsFromListView(page);
    await detailView(page);
    await submodule(page);
    await globalSearch(page);
    await sms.clickX();
    await page.bringToFront();
    await page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await leadsModule.dynMicHeading('Leads');
    await runListViewFilter(page, 0);
  });
});
