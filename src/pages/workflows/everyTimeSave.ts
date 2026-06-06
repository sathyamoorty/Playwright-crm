import { Page } from "@playwright/test";
export class everyTimeRecordSave{
    constructor (private page:Page){}
     async thirdWorkFlow(){
      await this.page.getByRole('radio').nth(2).check();
      }
}