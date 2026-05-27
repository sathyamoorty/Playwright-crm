import { expect, Page } from "@playwright/test";

export class creatEntity{
    constructor (private page:Page){}

    async workFlowStep3(){
        await this.page.getByRole("button", { name: "+ Add To Do" }).click();
        await this.page.getByText("library_addCreate Entity").click();
        await expect(this.page.getByRole('heading',{name:"Add Task for Workflow -> Create Entity"})).toBeVisible();
        await this.page.locator("input[name='notification_tasktitle']").fill("Create Entity Task");
    }
    async popupDropDown(){
        //  th  is.page.getByRole('combobox',{name:"Select an Option"}).nth(0).click()
        //  this.page.getByRole('treeitem',{name:"All UI Module"}).click();
          await this.page.locator('#modulename').getByRole('combobox', { name: 'Select an Option' }).click();
         await this.page.getByRole('treeitem', { name: 'Test Module' }).click();
    }
    async popDropDown2(){
         await this.page.getByRole('combobox', { name: '(Target) Assigned To' }).click();
        await this.page.getByRole('treeitem',{name:"(Source) Created By"}).click();
    }
    async popupDropDown3(){
        await this.page.getByRole('combobox', { name: 'Select an Option' }).first().click();
         await this.page.getByRole('treeitem', { name: 'Source' }).click();
  await this.page.getByRole('combobox', { name: 'Select An Option', exact: true }).click();
  await this.page.getByRole('treeitem', { name: 'Assigned To' }).click();
     }

    async targetModule(){
          await this.page.locator('#select2-SelectedValue1-container').click();

        await this.page.getByRole('treeitem',{name:"Name",exact:true}).click();
    }
    async sourceModule(){
         await this.page.locator('#select2-Currentvalue1-container').click();

          await this.page.getByLabel('Testing').getByRole('treeitem', { name: 'Name' }).click();
    }
    async addFieldBtn(){
        await this.page.getByRole('button',{name:"Add Field"}).click();
    }
    async mapTheFields(){
        await this.page.locator("#select2-SelectedValue2-container").click();
        await this.page.getByRole('treeitem',{name:"Related field",exact:true}).click();
    }
    async mapTheField2(){
        await this.page.locator("#select2-Currentvalue2-container").click();
        await this.page.getByLabel('Testing').getByRole('treeitem',{name:"Name",exact:true}).click();
    }
    async popupBtn(){
        await this.page.getByRole('button',{name:"Save"}).click();
    }
    async toggleTask(){
        await this.page.locator(".switchery.switchery-default").first().click();
       await this.page.getByRole("button", { name: "Submit" }).click();
    }
    async dataForLeads(name:string, email:string, currency?:string){
        await this.page.locator('input[name="testing_email"]').fill(email);
        await this.page.locator('input[name="testing_name"]').fill(name);
        // await this.page.locator("[name='leads_currency']").fill(currency);
    }
    async changeAssign(){
        await this.page.getByRole('combobox', { name: 'Rsoft IT' }).click();
        await this.page.getByRole('treeitem', { name: 'Admin' }).click();
    }
    async relatedModule(){
        await this.page.locator("#rsoft-Test_module").click();
        await this.page.getByRole('cell',{name:'Rsoft IT'}).nth(1).click();
    }   
}