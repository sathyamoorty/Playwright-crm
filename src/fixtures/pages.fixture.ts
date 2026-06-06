import type { Page } from '@playwright/test';
import { CaptureModulesPage } from '@pages/capture/capture-modules';
import { authenticateUser, waitForDashboardReady } from './auth.fixture';
import { DEFAULT_AUTH_CREDENTIALS, type AuthCredentials } from './types';

export type PageFixtures = {
  /** Step 5 — authenticated dashboard `Page` (login + dashboard ready). */
  dashboardPage: Page;
  /** Step 3 — ready-to-use `CaptureModulesPage` on an authenticated dashboard. */
  captureModulesPage: CaptureModulesPage;
  authCredentials: AuthCredentials;
};

export const pageFixtures = {
  authCredentials: [DEFAULT_AUTH_CREDENTIALS, { option: true }],

  dashboardPage: async (
    { page, authCredentials }: { page: Page; authCredentials: AuthCredentials },
    use: (page: Page) => Promise<void>,
  ) => {
    await authenticateUser(page, authCredentials);
    await waitForDashboardReady(page);
    await use(page);
  },

  captureModulesPage: async (
    { dashboardPage }: { dashboardPage: Page },
    use: (capture: CaptureModulesPage) => Promise<void>,
  ) => {
    await use(new CaptureModulesPage(dashboardPage));
  },
};
