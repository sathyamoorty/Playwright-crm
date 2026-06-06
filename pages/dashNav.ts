import { Page } from "@playwright/test";
import modulesNav from '../data/modules.json'

export class dashBoardNav{
    constructor (private page:Page){}
    
    async openCardInNewPage(index:number, title:string): Promise<Page> {
        const moduleName = modulesNav[index];

        if (!moduleName) {
            throw new Error(`Module index ${index} not found in modules.json`);
        }

        await this.page.locator('id=MoreMod_' + moduleName).click();

        const [newPage] = await Promise.all([
            this.page.context().waitForEvent('page'),
            this.page.getByText(title, { exact: true }).click(),
        ]);

        await newPage.waitForLoadState('domcontentloaded');
        this.page = newPage;
        return newPage;
    }
    async openModule(index:number){
        const moduleName = modulesNav[index];

        if (!moduleName) {
            throw new Error(`Module index ${index} not found in modules.json`);
        }

        await this.page.locator('id=MoreMod_' + moduleName).click();
    }
}
