import { Page } from "@playwright/test";    
export class leadWithNoTask{
    constructor(private page:Page){}

    async diffDropDown( ){
          await this.page.getByRole('combobox', { name: 'Rsoft IT' }).click();
          await this.page.getByRole('treeitem', { name: 'Admin Admin' }).click();
    }
    async diffValues(companyName:string, currency:string, alterPhoneNo:string )
    {
        await this.page.locator('input[name="leads_companyname"]').fill(companyName)
        await this.page.locator("[name='leads_currency']").fill(currency)
        await this.page.locator('input[name="leads_alternatphone"]').fill(alterPhoneNo)
    };
    async editFirstRow(){
          await this.page.locator('.cell-truncate-wrapper').first().click();
          await this.page.getByRole('button', { name: 'edit_square' }).click();
         // await this.page.getByRole('link', { name: 'edit_square Edit' }).click();
    }
    async editIconDetailView(){
                  await this.page.getByRole('button', { name: 'edit_square' }).click();

    }
    async againDropDown(){
         await this.page.getByRole('combobox', { name: 'Admin Admin' }).click();
         await this.page.getByRole('treeitem', { name: 'Rsoft IT' }).click();

    }
}