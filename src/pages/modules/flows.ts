import { Locator, Page, expect } from "@playwright/test";

export class book {
  constructor(private page: Page) {}
  
  async updateDetailPicklistByLabel(label: string, value: string) {
    const row = this.page.locator("tr").filter({
      has: this.page.locator("label", {
        hasText: new RegExp(`^\\s*${label}\\s*$`),
      }),
    });
 
    const detailRow = row.first();
    await expect(detailRow).toBeVisible({ timeout: 25_000 });
    await this.page.locator("#livewireOverly").waitFor({ state: "hidden", timeout: 8_000 }).catch(() => {});

    const valueCell = detailRow.locator(".rs_col_2");
    await detailRow.scrollIntoViewIfNeeded();
    await valueCell.hover({ force: true });

    const editIcon = detailRow.locator(".fa-edit").first();
    await expect(editIcon).toHaveCount(1, { timeout: 25_000 });
    await editIcon.evaluate((el) => {
      const w = window as Window & { ClickPencilIcon?: (n: Element) => void };
      if (typeof w.ClickPencilIcon === "function") w.ClickPencilIcon(el);
      else (el as HTMLElement).click();
    });

    const dropdown = detailRow.locator(".select2-selection");
    await expect(dropdown).toBeVisible({ timeout: 10_000 });
    await dropdown.click();
 
    await this.page.getByRole("treeitem", {
      name: value,
      exact: true,
    }).click();
 
    await this.clickSubmitIcon(detailRow);
 
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
async fillEmail(value:string){{
  await this.page.locator('[fieldname="Email"]').fill(value);
}
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
