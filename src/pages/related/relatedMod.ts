import {Page,expect} from '@playwright/test'
import relatedMod from '@data/relatedMod.json'
import commentsData from '@data/comments.json'
import { book } from '@pages/modules/flows';
import { dataDr } from '@pages/modules/uiTypeId';

type CommentEntry = { comments: string };
const commentList = commentsData as CommentEntry[];

function pickRandomComment(): string {
  const index = Math.floor(Math.random() * commentList.length);
  return commentList[index].comments;
}
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
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
}

    async editFirstRow(){
          await this.page.locator('.cell-truncate-wrapper').first().click();
    }
    async clkQuickAct(){
         await this.page.getByRole('button', { name: 'quickreply' }).click();
    }
    async hasQuickActionPermission(): Promise<boolean> {
      const quickActionButton = this.page.getByRole('button', { name: 'quickreply' });
      return quickActionButton
        .isVisible({ timeout: 0 })
        .catch(() => false);
    }
    async selectDropdownByLabel1(label: string, value: string) {
      const labelText = label.trim();
      const valueText = value.trim();
      const labelPattern = labelText
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\s+/g, '\\s*');
      const labelRegex = new RegExp(`^\\s*${labelPattern}\\s*(?:\\*)?\\s*$`);

      const quickActionScope = this.page
        .locator('#qaheadattribute')
        .locator('xpath=ancestor::form[1]');

      const labels = quickActionScope.getByText(labelRegex);
      const labelCount = await labels.count();

      for (let i = 0; i < labelCount; i++) {
        const labelLocator = labels.nth(i);
        const dropdown = labelLocator.locator(
          'xpath=following::span[contains(@class, "select2-selection")][1]',
        );

        if (!(await dropdown.isVisible())) {
          continue;
        }

        await dropdown.click();

        const option = this.page.getByRole('treeitem', {
          name: valueText,
          exact: true,
        });

        await expect(option).toBeVisible({ timeout: 15000 });
        await option.click();
        await expect(dropdown.locator('.select2-selection__rendered')).toHaveText(valueText);
        return;
      }

      throw new Error(
        `No visible "${labelText}" dropdown found in Quick Action. Scroll to #qaheadattribute and confirm the field is on screen.`,
      );
    }
    async fillComments(value?: string): Promise<string> {
      const text = value?.trim() ? value : pickRandomComment();
      await this.page.locator("#rsoft-Comments").click();
      await this.page.locator("#basicTextarea").first().fill(text);
      await this.page.getByRole('button', { name: 'Post' }).click();
      return text;
    }

    async post(){
      await this.page.getByRole('button', { name: 'Post' }).click();
    }

async selectDropdownByLabel(label: string, value: string) {
  const labelText = label.trim();
  const valueText = value.trim();
  const labelPattern = labelText
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s*');

  const labelRegex = new RegExp(`^\\s*${labelPattern}\\s*(?:\\*)?\\s*$`);
  const labelLocator = this.page.getByText(labelRegex).first();
  await expect(labelLocator).toBeVisible({ timeout: 15000 });

  const dropdown = labelLocator.locator('xpath=following::span[contains(@class, "select2-selection")][1]');
  await expect(dropdown).toBeVisible();
  await dropdown.click();

  const option = this.page.getByRole('treeitem', {
    name: valueText,
    exact: true,
  });

  await expect(option).toBeVisible();
  await option.click();

  await expect(dropdown.locator('.select2-selection__rendered')).toHaveText(valueText);
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
        await searchIcon.fillEmail("vinoth@rsoft.in")
         await searchIcon.clickSearchIconByLabel("Project Name");
         await this.page.locator(".hover-row").first().click();
         await searchIcon.clickSearchIconByLabel("Unit");
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
    async pdfIcon(){
        await this.page.getByRole("button",{name:"picture_as_pdf"}).click();
        // await this.page.getByRole('link',{name:"Mail Emails"}).click();
       
    }
    async clickMail(){
       await this.page.getByTitle('Mail', { exact: true }).click();
    }
    
    
}
