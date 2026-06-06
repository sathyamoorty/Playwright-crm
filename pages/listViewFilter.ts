import { expect, Page } from '@playwright/test';
import { getFieldKind } from '../utils/listScroll';
import {
  loadAllfieldsRow,
  operatorForField,
  pickRandomFilterFields,
  uiTypeForField,
  valueForField,
} from '../utils/filterData';

export class Listviewfilter {
  constructor(private page: Page) {}

  private async waitReady() {
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
  }

  private filterPanel() {
    return this.page.getByRole('heading', { name: 'Filter by Fields' }).locator('..').locator('..');
  }

  async noFilter() {
    await this.page.getByRole('button', { name: 'No Filter' }).click();
  }

  async addfilter(fieldName: string) {
    await this.page.locator('#add-trigger').click();
    await this.page.locator('#searchFieldData').fill(fieldName);
    await this.page.locator('.module-field-list').getByText(fieldName, { exact: true }).first().click();
  }

  async selectOperator(fieldName: string, operator: string) {
    if (getFieldKind(uiTypeForField(fieldName)) !== 'assignedTo') return;

    const row = this.filterPanel().locator(`[title="${fieldName}"]`).locator('..');
    await row.scrollIntoViewIfNeeded();
    if (((await row.innerText().catch(() => '')) || '').includes(operator)) return;

    await row.locator('.field-filter-condition, .fa-caret-down').first().click({ force: true });
    const search = this.page.locator('#searchConditionOption');
    if (await search.isVisible({ timeout: 1500 }).catch(() => false)) {
      await search.fill(operator);
    }
    await this.page.getByRole('treeitem', { name: operator, exact: true }).click({ timeout: 8000 });
  }

  async selectValue(fieldName: string, value: string) {
    const panel = this.filterPanel();
    const kind = getFieldKind(uiTypeForField(fieldName));

    if (kind === 'assignedTo') {
      await panel.locator('option', { hasText: value }).last().click({ force: true, timeout: 10_000 });
      return;
    }
    if (kind === 'picklist') {
      const idx = Number(value);
      await panel
        .locator('option:not([disabled])')
        .nth(Number.isNaN(idx) ? 0 : idx)
        .last()
        .click({ force: true, timeout: 8000 });
      return;
    }
    await panel.getByPlaceholder('Enter value').last().fill(value, { timeout: 10_000 });
  }

  async Apply() {
    await this.page.getByRole('button', { name: 'Apply', exact: true }).click();
  }

  async applyThreeRandomFilters(rowIndex = 0) {
    const data = loadAllfieldsRow(rowIndex);
    const fields = pickRandomFilterFields(3);
    console.log('Filter fields:', fields.map((f) => `${f} (ui ${uiTypeForField(f)})`).join(', '));

    for (const fieldName of fields) {
      await this.addfilter(fieldName);
      await this.waitReady();
      const operator = operatorForField(fieldName);
      const value = valueForField(data, fieldName);
      console.log(`  ${fieldName}: ${operator} → ${value}`);
      await this.selectOperator(fieldName, operator);
      await this.selectValue(fieldName, value);
      await this.waitReady();
    }

    await this.Apply();
    await this.waitReady();
    return fields;
  }
}

/** Open list filter panel, apply 3 random field filters from filterFieldTypeData.json. */
export async function runListViewFilter(page: Page, rowIndex = 0) {
  await expect(page.locator('#livewireOverly')).toBeHidden({ timeout: 60_000 });
  const listFilter = new Listviewfilter(page);
  await listFilter.noFilter();
  const fields = await listFilter.applyThreeRandomFilters(rowIndex);
  expect(fields.length).toBeGreaterThan(0);
  await expect(page.locator('#livewireOverly')).toBeHidden({ timeout: 30_000 });
  return fields;
}
