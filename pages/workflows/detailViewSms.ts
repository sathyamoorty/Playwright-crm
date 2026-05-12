import { Page} from "@playwright/test";

export class detailView{
    constructor (private page:Page) {}

    async clickFirstRow(){
        await this.page.locator('.cell-truncate-wrapper').first().click();
        await this.page.getByRole('button', { name: 'aod' }).click();
    }
    async clickSmspopupDropDown1(){
        await this.page.getByRole('combobox', { name: 'Select an option' }).first().click();
        await this.page.getByRole('treeitem', { name: 'Alternat Phone (Leads)' }).click(); 
    }
    async clickSmsPopupDropDown2(){
        await this.page.getByRole('combobox', { name: 'Select an option' }).first().click();
        await this.page.getByRole('treeitem', { name: 'sample sms' }).click();
        await this.page.getByRole('button', { name: 'Save' }).click();
    }
}