import type { Page } from '@playwright/test';
import { LoginPage } from '@pages/auth/login';
import { NavToModulePage } from '@pages/aliases';
import type { AuthCredentials } from './types';

/**
 * Step 6 — UI interaction: authenticate and land on the dashboard.
 */
export async function authenticateUser(
  page: Page,
  credentials: AuthCredentials,
): Promise<void> {
  const login = new LoginPage(page);
  await login.loginPage();
  await login.login(
    credentials.tenant,
    credentials.username,
    credentials.password,
  );
}

export async function waitForDashboardReady(page: Page): Promise<void> {
  await new NavToModulePage(page).waitForDashboardReady();
}
