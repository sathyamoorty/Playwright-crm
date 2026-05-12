import { Page } from "@playwright/test";

export class listView{
    constructor (private page:Page){}

    async listViewSMS(){
      const smsIcon=this.page.locator('.cell-truncate-wrapper').nth(3);
      smsIcon.hover();
      await this.page.locator('i.fa-solid.fa-message.sms_click:visible').click(); 
    }
    async clickFirstRowForSmsListview(){
      await this.page.locator('.cell-truncate-wrapper').first().click();
    }
}