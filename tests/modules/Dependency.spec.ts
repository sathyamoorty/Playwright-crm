import { test } from '@playwright/test';
import { LoginPage } from '@pages/auth/login';
import { navToModule } from '@pages/modules/navToMod';
import { Dependency } from '@pages/modules/Dependency';

test('Picklist dependency – State to City in Quick Action', async ({ page }) => {
  test.setTimeout(180_000);

  const logIn = new LoginPage(page);
  await logIn.loginPage();
  await logIn.login('RSAUTOMATION', 'rsoft', 'RSoft@2026');

  const nav = new navToModule(page);
  await nav.waitForDashboardReady();
  await nav.menuIcon();
  await nav.dynMod(1);

  await new Dependency(page).runPicklistDependencyFlow();
});
