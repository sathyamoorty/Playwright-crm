import { Page, expect } from "@playwright/test";

export class leadsModule {
  constructor(private page: Page) {}

  async menuIcon() {
    await this.page.locator("#vertical_header_name").click();
    await this.page.getByRole("link", { name: "Contact_Mail Leads" }).click();
  }

  async addLead() {
    await this.page.getByRole("button", { name: "Add Leads" }).click();
  }

  async dataForInputFields() {
    await this.page.locator('input[name="leads_companyname"]').fill("Rsoft tech");
    await this.page.locator("[name='leads_currency']").fill("1000");
    await this.page.locator('input[name="leads_alternatphone"]').fill("9182726352");
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

