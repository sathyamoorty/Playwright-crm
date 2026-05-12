import {Page,expect} from '@playwright/test'
import relatedMod from '../data/relatedMod.json'
import { book } from './flows';
import { dataDr } from './uiTypeId';
export class relatedModule
{
    constructor (private page:Page){}

    async relModule(index:number){
    const moduleName = relatedMod[index];

    const moduleId = moduleName
        .trim()
        .split(/\s+/)
        .map((word, index) => index === 0 ? word : word.toLowerCase())
        .join("_");

    const moduleLink = this.page.locator(`[id="rsoft-${moduleId}"]`);
    await moduleLink.click();
}

    async editFirstRow(){
          await this.page.locator('.cell-truncate-wrapper').first().click();
    }
    async clkQuickAct(){
         await this.page.getByRole('button', { name: 'quickreply' }).click();
    }
    async selectDropdownByLabel(label: string, value: string) {
  const fieldRow = this.page.locator('.row').filter({
    has: this.page.locator('label', { hasText: new RegExp(`^\\s*${label}\\s*$`) }),
  }).first();
 
  await expect(fieldRow).toBeVisible();
 
  const dropdown = fieldRow.locator('.select2-selection');
  await expect(dropdown).toBeVisible();
  await dropdown.click();
 
  const option = this.page.getByRole('treeitem', {
    name: value,
    exact: true,
  });
 
  await expect(option).toBeVisible();
  await option.click();
 
  await expect(fieldRow.locator('.select2-selection__rendered')).toHaveText(value);
}
  

    async scrollView(){
        await this.page.locator("#qaheadattribute").scrollIntoViewIfNeeded();
    }
    async clickAddIconRelMod(){
        await this.page.getByRole('button').filter({hasText:/^$/}).first().click();
    }
     async clickTheSearchInQucikcreate(){
        const searchIcon=new book(this.page)
        // const randomData=new dataDr(this.page)
        // await randomData.fillCurrentModuleFields();

         searchIcon.clickSearchIconByLabel("Project Name");
         await this.page.locator(".hover-row").first().click();
         searchIcon.clickSearchIconByLabel("Unit");
        await this.page.locator("#fieldemptyunit_availablestatus").click();
        await this.page.getByRole('textbox', { name: 'Search here...' }).fill("Available");
        await this.page.getByTitle("Available").first().click();
        await this.page.getByRole('button',{name:"search Search"}).click();
         await this.page.locator(".hover-row").first().click();
         
    }
    async clickRelModRow(){
        await this.page.getByRole('cell',{name:'Rsoft IT'}).nth(1).click();
    }

    async nextIcon(){
        await this.page.getByRole('button',{name:"arrow_forward_ios"}).click();
    }
    async prevIcon(){
        await this.page.getByRole("button",{name:"arrow_back_ios_new"}).click();
    }
    
    
}