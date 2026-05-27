import { test } from '@playwright/test';
import { LoginPage } from '../pages/login';
import { navToModule } from '../pages/navToMod';
import { relatedModule } from '../pages/relatedMod';
import { Book } from '../pages/singleEdit';

test('single-edit summary fields from uidata.json', async ({ page }) => {
  const logIn = new LoginPage(page);
  const nav = new navToModule(page);
  const relMod = new relatedModule(page);

  await logIn.loginPage();
  await logIn.login('RSAUTOMATION', 'rsoft', 'RSoft@2026');
  await nav.waitForDashboardReady();
  await nav.menuIcon();
  await nav.dynMod(1);
  await relMod.editFirstRow();

  await new Book(page).runFromTestdata();
});
