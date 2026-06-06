import { Page } from "@playwright/test";
export class everyTimeModifiedRecord{
    constructor (private page:Page){}
    async everyTimeModified(){
        await this.page.getByRole('radio').nth(3).check();
    }


}