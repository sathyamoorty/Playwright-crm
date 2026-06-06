import {Page, expect} from "@playwright/test";
export class ProfilePage {

    constructor(private page: Page) {} 
    async createBtn(){
        await this.page.getByRole('button', { name: 'Creating Profile' }).click();
    }
    async profileField(profile:string){
        const proVar = this.page.locator("[name='profilename']");
        await proVar.waitFor({ state: 'visible' });
        await proVar.fill(profile);
        return proVar;
    }
    async descField(description:string){
        const descVar = this.page.locator("[name='description']");
        await descVar.waitFor({ state: 'visible' });
        await descVar.fill(description);
        return descVar;
    }
    async subBtn(){
        await this.page.getByRole("button",{name:"Save"}).click();
    };
  
    

 }
