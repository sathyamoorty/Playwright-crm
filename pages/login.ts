import {Page} from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async loginPage() {
    await this.page.goto('https://rdot.in');
  }
  async enterCompanyName(companyName: string) {
    await this.page.getByRole('textbox', { name: 'Company Name' }).nth(0).fill(companyName);
  }
  async enterUserName(userName: string) {
    await this.page.locator('#email').fill(userName);
  }
  async enterPassword(password: string) {
    await this.page.getByPlaceholder('Enter Password').nth(0).fill(password);
  }
  async clickLoginBtn(){
    await this.page.getByRole('button', { name: 'Login' }).click();
  }
  async login(companyName:string, userName:string, password:string){
    await this.enterCompanyName(companyName);
    await this.enterUserName(userName);
    await this.enterPassword(password);
    await this.clickLoginBtn();
  }
  
}