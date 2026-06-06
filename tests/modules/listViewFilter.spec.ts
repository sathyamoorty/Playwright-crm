import { test } from '@playwright/test';
import { LoginPage } from '@pages/auth/login';
import { navToModule } from '@pages/modules/navToMod';
import { runListViewFilter } from '@pages/modules/listViewFilter';

test.describe('list view filter', () => {
  test('apply three filters from Allfields.json', async ({ page }) => {
    const logIn = new LoginPage(page);
    const nav = new navToModule(page);

    await logIn.loginPage();
    await logIn.login('RSAUTOMATION', 'rsoft', 'RSoft@2026');
    await nav.waitForDashboardReady();
    await nav.menuIcon();
    await nav.dynMod(1);
    await nav.waitForAppReady();

    const fields = await runListViewFilter(page, 0);
    console.log('Applied filters:', fields.join(', '));
  });
});
