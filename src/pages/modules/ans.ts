import { Locator, Page, expect } from '@playwright/test';

const DROPDOWN_FIELD_TYPES = new Set(['3', '9', '29', '30', '31']);

export class ans {
  constructor(private page: Page) {}

  private async getRowFieldType(row: Locator): Promise<string | null> {
    const fieldWithType = row.locator('[data-fieldtype]').first();

    if ((await fieldWithType.count()) > 0) {
      const fieldType = await fieldWithType.getAttribute('data-fieldtype');

      if (fieldType) {
        return fieldType;
      }
    }

    const hiddenFieldType = row.locator('xpath=.//input[contains(@name, "_Fieldtype")]').first();

    if ((await hiddenFieldType.count()) === 0) {
      return null;
    }

    return hiddenFieldType.getAttribute('value');
  }

  private getRandomIndex(optionCount: number): number {
    if (optionCount <= 0) {
      throw new Error('Dropdown does not have any options.');
    }

    const startIndex = optionCount > 1 ? 1 : 0;
    return Math.floor(Math.random() * (optionCount - startIndex)) + startIndex;
  }

  private async chooseRandomNativeSelect(row: Locator): Promise<boolean> {
    const select = row.locator('select:visible').first();

    if ((await select.count()) === 0) {
      return false;
    }

    const optionCount = await select.locator('option').count();
    await select.selectOption({ index: this.getRandomIndex(optionCount) });
    await select.dispatchEvent('change');
    return true;
  }

  private async chooseRandomSelect2(row: Locator): Promise<boolean> {
    const dropdown = row.locator('.select2-selection').first();

    if ((await dropdown.count()) === 0) {
      return false;
    }

    await expect(dropdown).toBeVisible({ timeout: 15000 });
    await dropdown.click();

    const options = this.page.locator('.select2-results__option[role="treeitem"]:visible');
    await expect(options.first()).toBeVisible({ timeout: 15000 });

    await options.nth(this.getRandomIndex(await options.count())).click();
    return true;
  }

  private async submitSingleEdit(row: Locator) {
    const submitIcon = row.locator('.submiticonSummary, .submiticon').first();

    await expect(submitIcon).toBeVisible({ timeout: 15000 });
    await submitIcon.click();
  }

  async updateRandomPicklistsOneByOne(maxUpdates?: number) {
    const rows = this.page.locator('tr:visible').filter({
      has: this.page.locator('.rs_col_2'),
      hasNot: this.page.locator('.select2-results__option'),
    });
    const rowCount = await rows.count();
    let updatedCount = 0;

    if (rowCount === 0) {
      throw new Error('No visible single-edit detail rows found. Open a record detail view before calling updateRandomPicklistsOneByOne().');
    }

    for (let i = 0; i < rowCount; i++) {
      if (maxUpdates !== undefined && updatedCount >= maxUpdates) {
        break;
      }

      const row = rows.nth(i);
      const editIcon = row.locator('.fa-edit:visible').first();

      if ((await editIcon.count()) === 0) {
        continue;
      }

      const fieldType = await this.getRowFieldType(row);

      if (!fieldType || !DROPDOWN_FIELD_TYPES.has(fieldType)) {
        continue;
      }

      await row.scrollIntoViewIfNeeded();
      await row.locator('.rs_col_2').hover();
      await editIcon.click({ force: true });

      const selected = await this.chooseRandomNativeSelect(row) || await this.chooseRandomSelect2(row);

      if (!selected) {
        await this.page.keyboard.press('Escape');
        continue;
      }

      await this.submitSingleEdit(row);
      updatedCount++;
    }

    if (updatedCount === 0) {
      throw new Error('No visible dropdown single-edit rows were updated. Make sure the current detail view has field types 3, 9, 29, 30, or 31.');
    }

    return updatedCount;
  }
}
