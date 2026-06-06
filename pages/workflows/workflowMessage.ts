import { Locator, Page, expect } from "@playwright/test";

export class WorkflowMessagePage {
  constructor(private page: Page) {}

  private async pickSelect2Option(trigger: Locator, optionName: string) {
    await trigger.click();
    const option = this.page
      .locator(".select2-container--open")
      .getByRole("treeitem", { name: optionName, exact: true })
      .first();
    await expect(option).toBeVisible({ timeout: 15000 });
    await option.click();
    await this.page.locator(".select2-container--open").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }

  async otherSettings() {
     await this.page.locator('span').filter({ hasText: 'Other Settings' }).click();
  //   const otherSettings = this.page
  // .locator("label.name.tstclr")
  // .filter({ hasText: /Other Settings/i })
  // .first();

  // await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  // await expect(otherSettings).toBeVisible({ timeout: 15000 });
  // await otherSettings.click();


  }

  async workFlowSettings() {
    const workflowLink = this.page.getByRole("link", { name: /^Workflow$/i });
    await workflowLink.click();
    await expect(
      this.page.getByRole("button", { name: /Creating\s+Workflow/i })
    ).toBeVisible({ timeout: 15000 });
  }

  async createBtn() {
    await this.page.getByRole("button", { name: /Creating\s+Workflow/i }).click();
  }

  async step1(searchTerm: string, workflowName: string) {
    await this.page.getByRole("textbox", { name: "All", exact: true }).click();

    const moduleSearch = this.page.locator("input.select2-search__field").last();
    await moduleSearch.fill(searchTerm);
    await moduleSearch.press("Enter");

    await this.page.locator('[name="summary"]').fill(workflowName);
    await this.page.getByRole("button", { name: "Next" }).click();
  }

  async step2() {
    const allConditions = this.page.locator("#content-andcon");
    // await expect(allConditions).toBeVisible({ timeout: 15000 });
    await allConditions.getByRole("button", { name: "Add Condition" }).click();

    const fieldDropdown = allConditions
      .getByRole("textbox", { name: "Select an option", exact: true })
      .first();
    await this.pickSelect2Option(fieldDropdown, "Assigned To");

    const conditionRow = allConditions
      .getByRole("row")
      .filter({ has: this.page.getByRole("textbox", { name: "Assigned To", exact: true }) })
      .first();
    const operatorDropdown = conditionRow.getByRole("textbox", {
      name: "Select an option",
      exact: true,
    });
    await this.pickSelect2Option(operatorDropdown, "Is");

    await this.page.getByRole("button", { name: "Next" }).click();
  }

  async step3() {
    await this.page.getByRole("button", { name: "+ Add To Do" }).click();
    await this.page.getByText("sms SMS").click();
    await this.page.locator("input[name='smstasktitle']").fill("Test SMS Task");

   
   
    
    
    // await this.page.getByRole("textbox", { name: "Select an Option", exact: true }).click();
    // await this.page.locator('#select2-7hyb-container').click();
    await this.page.locator('#generate_Workflow_sms').getByRole('combobox', { name: 'Select an Option', exact: true }).click();
    await this.page.getByRole('treeitem', { name: '(Testing) Testing: (Phone' }).click();
    // await this.page.getByRole("treeitem", { name: /Testing: (Phone number)/i }).click();

    // await this.page.getByRole("combobox", { name: "Select an option" }).first().click();
    // await this.page.getByRole("treeitem", { name: "001" }).click();
    await this.page.getByRole('combobox', { name: 'Select an option' }).first().click();
    await this.page.getByRole('treeitem', { name: '001' }).click();
 

    await this.page.getByRole("button", { name: "Save" }).click();
    await expect(this.page.getByRole("button", { name: "Submit" })).toBeVisible();

    await this.page.locator(".switchery.switchery-default").first().click();  
    await this.page.getByRole("button", { name: "Submit" }).click();

   
  }
  //      async lastWorkFlow() 
  // {
  //         const lastRow = this.page.locator('[class*="Removerow_"]').last();
  //         const toggle = lastRow.locator('span.switchery.switchery-default');

  //         await toggle.scrollIntoViewIfNeeded();
  //         await toggle.click();
  //         console.log('Last workflow toggle clicked');
  //  }
  async enableToggleByWorkflowName(workflowName: string) {
  const workflowRow = this.page
    .locator('[class*="Removerow_"]')
    .filter({
      has: this.page.getByText(workflowName, { exact: true }),
    })
    .first();

  await expect(workflowRow).toBeVisible({ timeout: 15000 });
  await workflowRow.scrollIntoViewIfNeeded();

  const toggle = workflowRow.locator('span.switchery.switchery-default');
  await expect(toggle).toBeVisible();
  await toggle.click();
}
  async clickEditIcon(workflowName: string) {
  const workflowRow = this.page
    .locator('[class*="Removerow_"]')
    .filter({
      has: this.page.getByText(workflowName, { exact: true }),
    })
    .first();

  await expect(workflowRow).toBeVisible({ timeout: 15000 });
  await workflowRow.scrollIntoViewIfNeeded();

  const editIcon = workflowRow.locator('span').filter({ hasText: 'edit_square' });
  await expect(editIcon).toBeVisible();
  await editIcon.click();
}

//          async clickEditIcon1() {
//       const lastRow = this.page.locator('[class*="Removerow_"]').last();
//     const editIcon = lastRow.locator('span').filter({ hasText: 'edit_square' }).last();

//       await expect(editIcon).toBeVisible();
//       await editIcon.click();
// } 

  async whenToExecuteWorkFlow1() {
        await this.page.locator("input[type='radio'][value='2']").check();
  }

  async editNext() {
    await this.page.getByRole("button", { name: "Next" }).click();
  }

  async editSubBtn() {
    await this.page.getByRole("button", { name: "Submit" }).click();
  }
}
