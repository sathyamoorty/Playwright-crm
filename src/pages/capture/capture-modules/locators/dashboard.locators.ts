import type { Page, Locator } from '@playwright/test';

/**
 * Step 4 — Locators: dashboard cards, overlays, and module menu.
 * Actions live in `actions/dashboard-card.actions.ts`.
 */
export class DashboardLocators {
  constructor(private readonly page: Page) {}

  livewireOverlay(): Locator {
    return this.page.locator('#livewireOverly');
  }

  menuCard(): Locator {
    return this.page.locator('#homemenucard');
  }

  firstDashboardCardBox(): Locator {
    return this.page.locator('.card-content .card_list_box').first();
  }

  firstDashboardCardBody(): Locator {
    return this.firstDashboardCardBox().locator('.card-body.card-body-inner');
  }
}
