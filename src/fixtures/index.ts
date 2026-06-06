import { test as base, expect } from '@playwright/test';
import { pageFixtures, type PageFixtures } from './pages.fixture';

/**
 * Extended Playwright test with framework fixtures.
 *
 * Flow:
 *   1. User Action     → CLI / npm script
 *   2. Test Spec       → tests/*.spec.ts
 *   3. Page Object     → pages/ (injected via fixtures)
 *   4. Locator+Action  → pages/capture-modules/locators + actions
 *   5. Fixtures        → this file (setup)
 *   6. UI Interaction  → page object methods
 *   7. Validation      → validators/
 *   8. Report          → utils/reporting/
 */
export const test = base.extend<PageFixtures>(pageFixtures);

export { expect };
