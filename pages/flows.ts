import { Locator, Page, expect } from "@playwright/test";

export class book {
  constructor(private page: Page) {}

  // async updateDetailPicklistByLabel(label: string, value: string) {
  //   const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  //   const row = this.page.locator("tr").filter({
  //     has: this.page.locator("label", {
  //       hasText: new RegExp(`^\\s*${escapedLabel}\\s*$`),
  //     }),
  //   });

  //   await expect(row).toBeVisible();

  //   const valueCell = row.locator(".rs_col_2");
  //   await row.scrollIntoViewIfNeeded();
  //   await row.hover();
  //   await valueCell.hover();

  //   const editIcon = row.locator(".fa-edit");
  //   await expect(editIcon).toBeAttached();
  //   if (await editIcon.isVisible()) {
  //     await editIcon.click();
  //   } else {
  //     await editIcon.evaluate((element: HTMLElement) => element.click());
  //   }

  //   const dropdown = row.locator(".select2-selection");
  //   await expect(dropdown).toBeVisible();
  //   await dropdown.click();

  //   await this.page.locator(".select2-container--open").getByRole("treeitem", {
  //     name: value,
  //     exact: true,
  //   }).click();

  //   await row.locator(/.submiticonSummary/).click();

  //   await expect(valueCell).toContainText(value);
  // }
  async updateDetailPicklistByLabel(label: string, value: string) {
    const row = this.page.locator("tr").filter({
      has: this.page.locator("label", {
        hasText: new RegExp(`^\\s*${label}\\s*$`),
      }),
    });
 
    await expect(row).toBeVisible();
 
    const valueCell = row.locator(".rs_col_2");
    await valueCell.hover();
 
    const editIcon = row.locator(".fa-edit");
    await editIcon.click({ force: true });
 
    const dropdown = row.locator(".select2-selection");
    await expect(dropdown).toBeVisible();
    await dropdown.click();
 
    await this.page.getByRole("treeitem", {
      name: value,
      exact: true,
    }).click();
 
    await this.clickSubmitIcon(row);
 
    await expect(valueCell).toContainText(value);
  }

  async clickSubmitIcon(scope: Locator = this.page.locator("body")) {
    const submitIcon = scope.locator(".submiticonSummary, .submiticon").first();
    await expect(submitIcon).toBeVisible();
    await submitIcon.click();
  }
 

async clickSearchIconByLabel(label: string) {
  const fieldGroup = this.page.locator(".form-group.row").filter({
    hasText: new RegExp(`^\\s*${label}\\s*`),
  });
  await expect(fieldGroup).toBeVisible();
  const searchIcon = fieldGroup.locator(".searchicon, [title='Search']").last();
  await expect(searchIcon).toBeVisible();
  await searchIcon.click();
}

// async editIcon(){
//               await this.page.getByRole('button', { name: 'edit_square' }).click();

// }

  async clickRelamodulEyeIcon(label:string){
    const row = this.page.locator("tr").filter({
      has: this.page.locator("label", {
        hasText: new RegExp(`^\\s*${label}\\s*$`),
      }),
    });
    await expect(row).toBeVisible();

    // const valueCell = row.locator(".related-link")
    // valueCell.click();
    const editIcon = row.locator(".related-link");
    await editIcon.click({ force: true });
  }
}
