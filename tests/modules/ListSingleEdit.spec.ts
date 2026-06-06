/**
 * List view: capture first-row fields, then edit each in order (left → right) using Testdata.json.
 */
import { test } from '@playwright/test';
import { runListSingleEditFromLogin } from '@pages/modules/listsingleedit';

test.describe('List single edit', () => {
  test.describe.configure({ timeout: 800_000 });

  test('capture first row fields then edit each sequentially from JSON', async ({ page }) => {
    await runListSingleEditFromLogin(page, 'RSAUTOMATION', 'rsoft', 'RSoft@2026', 0);
  });
});
