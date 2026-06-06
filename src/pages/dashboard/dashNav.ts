import { Page, expect } from "@playwright/test";
import modulesNav from '@data/modules.json';
import { dashboardModules } from '@pages/dashboard/dashboardModules';

export class dashBoardNav{
    constructor (private page:Page){}
    
    /**
     * Click a dashboard card like a user — opens list view in a new browser tab when the app spawns one.
     * Same behavior as moduleNav.spec.ts openCardInNewPage / captureModules.openFirstDashboardCard.
     */
    async clickCardInNewPage(cardTitle: string): Promise<Page> {
        await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});

        const cardInner = this.page
            .locator('.card-content .card_list_box')
            .filter({ hasText: cardTitle })
            .first()
            .locator('.card-body.card-body-inner');

        const clickTarget = (await cardInner.isVisible({ timeout: 5_000 }).catch(() => false))
            ? cardInner
            : this.page.getByText(cardTitle, { exact: true }).first();

        await expect(clickTarget).toBeVisible({ timeout: 30_000 });

        let listPage: Page;
        try {
            [listPage] = await Promise.all([
                this.page.context().waitForEvent('page', { timeout: 30_000 }),
                clickTarget.click(),
            ]);
        } catch {
            await clickTarget.click();
            listPage = this.page;
        }

        await listPage.bringToFront();
        await listPage.waitForLoadState('domcontentloaded');

        return listPage;
    }

    async openCardInNewPage(index:number, title:string): Promise<Page> {
        const moduleName = modulesNav[index];

        if (!moduleName) {
            throw new Error(`Module index ${index} not found in modules.json`);
        }

        await new dashboardModules(this.page).clickModuleTab(moduleName);
        return this.clickCardInNewPage(title);
    }
    async openModule(index:number){
        const moduleName = modulesNav[index];

        if (!moduleName) {
            throw new Error(`Module index ${index} not found in modules.json`);
        }

        await new dashboardModules(this.page).clickModuleTab(moduleName);
    }
}
