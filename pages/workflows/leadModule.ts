import { Page, expect } from "@playwright/test";

export class leadsModule {
  constructor(private page: Page) {}

  async menuIcon() {
    // await this.page.locator("#vertical_header_name").click();
    const sidebarMenu = this.page.locator('#vertical_header_name, #vertical_header_name_link').first();
  if (await sidebarMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
    await sidebarMenu.click();
    return;
  }
  await this.page.getByRole('button', { name: 'search' }).first().click({ timeout: 2000 }).catch(() => {});
  await this.page.locator('#vertical_header_name, #vertical_header_name_link').first().click();
  }
  async testMod(){
    await this.page.getByRole("link", { name: "Shopping_Bag Testing" }).click();
  }

  async addLead() {
    await this.page.getByRole("button", { name: "Add Testing" }).click();
  }

  async dataForInputFields() {
    await this.page.locator('input[name="testing_text"]').fill("Rsoft tech");
    await this.page.locator("[name='testing_currency']").fill("1000");
    await this.page.locator("[name='testing_name']").fill("Arjun");
    await this.page.locator('input[name="testing_phonenumber"]').fill("9182726352");
  }

  async saveBtn() {
    await this.page.getByRole("button", { name: "Save", exact: true }).click();
  }

      async updateTimeAndData(){
        const update = await this.page.locator('li.appendli').locator('div').nth(1).innerText();
        console.log( update);  
 
        const update1 = await this.page.locator('li.appendli').locator('div').nth(2).innerText();
        console.log( update1);

        //console.log("Only on the first save. Lead created and sms triggered to the given number.")
    }
}

