import { Page } from "@playwright/test";    
export class leadWithNoTask{
    constructor(private page:Page){}

    async diffDropDown( ){
          await this.page.getByRole('combobox', { name: 'Rsoft IT' }).click();
          await this.page.getByRole('treeitem', { name: 'Admin' }).click();
    }
    async diffValues(companyName:string, currency:string, name:string, alterPhoneNo:string )
    {
        // await this.page.locator('input[name="testing_text"]').fill(companyName)` 
        // await this.page.locator("[name='testing_currency']").fill(currency)
        // await this.page.locator('input[name="leads_alternatphone"]').fill(alterPhoneNo)
        await this.page.locator('input[name="testing_text"]').fill(companyName);
       await this.page.locator("[name='testing_currency']").fill(currency);
        await this.page.locator("[name='testing_name']").fill(name);
        await this.page.locator('input[name="testing_phonenumber"]').fill(alterPhoneNo);
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
         await this.page.getByRole('combobox', { name: 'Admin' }).click();
         await this.page.getByRole('treeitem', { name: 'Rsoft IT' }).click();

    }
}