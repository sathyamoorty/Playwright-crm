import { expect, Locator, Page } from '@playwright/test';
import allfieldsConfig from '@data/Allfields.json';
import {
  DATE_UI_TYPES,
  getFieldKind,
  getPicklistOptionIndex,
  isReadOnlyUiType,
} from '@utils/helpers/listScroll';
import {
  loadAllfieldsRow,
  operatorForField,
  valueForField,
  valueForFieldType,
} from '@utils/helpers/filterData';
 
const FILTER_FIELD_COUNT = 3;

/** Prefer these labels when present; any other fillable module field is used if fewer than 3 match. */
const PREFERRED_FILTER_LABELS = new Set(
  (allfieldsConfig as { fieldNames: string[] }).fieldNames.map((n) =>
    n.replace(/\s+/g, ' ').trim().toLowerCase(),
  ),
);

/** Dropdown fields excluded from random filter selection. */
const SKIP_FILTER_LABELS = new Set(['created by', 'modified by']);
/** Sequence, lookup (popup), etc. — unreliable in list filter UI. */
const SKIP_FIELD_TYPES = new Set(['10', '11']);

const DROPDOWN_FIELD_TYPES = new Set([
  '3', '9', '11', '13', '14', '15', '21', '23', '29', '30', '31',
]);
 
export type CapturedFilterField = {
  label: string;
  fieldType: string;
};
 
export class Listviewfilter {
  constructor(private page: Page) {}
 
  private async waitReady() {
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
  }
 
  private filterPanel() {
    return this.page.getByRole('heading', { name: 'Filter by Fields' }).locator('..').locator('..');
  }
 
  private filterRow(fieldName: string) {
    const title = this.filterPanel().locator(`[title="${fieldName}"]`).last();
    // Value input (Enter value / select) sits in the row wrapper, not inside the title cell.
    return title.locator('xpath=parent::*/parent::*');
  }
 
  /** Skip Created By, Modified By, and data-fieldtype 10 (sequence / audit fields). */
  private shouldSkipDropdownField(label: string, fieldType: string): boolean {
    const normalized = label.replace(/\s+/g, ' ').trim().toLowerCase();
    if (SKIP_FILTER_LABELS.has(normalized)) return true;
    if (SKIP_FIELD_TYPES.has(fieldType)) return true;
    if (isReadOnlyUiType(fieldType)) return true;
    const kind = getFieldKind(fieldType);
    if (kind === 'unknown' && !DROPDOWN_FIELD_TYPES.has(fieldType)) return true;
    return false;
  }

  private isPreferredFilterLabel(label: string): boolean {
    return PREFERRED_FILTER_LABELS.has(
      label.replace(/\s+/g, ' ').trim().toLowerCase(),
    );
  }
 
  /** Open list-view field filter drawer when toolbar chip is closed (new module tab). */
  async ensureFilterPanelOpen() {
    const heading = this.page.getByRole('heading', { name: 'Filter by Fields' });
    if (await heading.isVisible({ timeout: 2_000 }).catch(() => false)) {
      return;
    }

    const filterToolbarBtn = this.page
      .locator(
        'button.add-filter-btn, button.calendar-toolbar-filter-btn, button.field-filter',
      )
      .filter({
        has: this.page.locator('span.material-symbols-outlined', {
          hasText: /filter_list/i,
        }),
      })
      .first();

    if (await filterToolbarBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await filterToolbarBtn.click();
    } else {
      await this.page
        .locator('span.material-symbols-outlined')
        .filter({ hasText: /filter_list/i })
        .first()
        .click({ timeout: 10_000 })
        .catch(() => {});
    }

    await heading.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await this.waitReady();
  }

  async noFilter() {
    await this.ensureFilterPanelOpen();
    await this.page
      .getByRole('button', { name: 'No Filter' })
      .click({ timeout: 15_000 })
      .catch(() => {});
    await this.waitReady();
  }
 
  /** Open add-field dropdown (list view + button — same role as filter.ts addedFilter). */
  async addedFilter() {
    await this.page.locator('#add-trigger').click({ timeout: 15_000 });
    await expect(this.page.locator('#searchFieldData')).toBeVisible({ timeout: 10_000 });
    await expect(this.page.locator('.module-field-list')).toBeVisible({ timeout: 10_000 });
  }
 
  /** Capture dropdown options that expose data-fieldtype / data-field-type. */
  async captureDropdownFieldsWithType(): Promise<CapturedFilterField[]> {
    await this.addedFilter();
 
    const list = this.page.locator('.module-field-list');
    const items = list.locator(':scope > *');
    const seen = new Set<string>();
    const preferred: CapturedFilterField[] = [];
    const other: CapturedFilterField[] = [];
    const skipped: string[] = [];

    const addField = (label: string, fieldType: string) => {
      const key = `${label}|${fieldType}`;
      if (seen.has(key)) return;
      seen.add(key);
      const entry = { label, fieldType };
      if (this.isPreferredFilterLabel(label)) {
        preferred.push(entry);
      } else {
        other.push(entry);
      }
    };

    for (let pass = 0; pass < 12; pass++) {
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        const label = ((await item.innerText()) || '').trim().split('\n')[0]?.trim() ?? '';
        if (!label || /^search\s*fields?$/i.test(label)) continue;

        const fieldType =
          (await item.getAttribute('data-fieldtype')) ??
          (await item.getAttribute('data-field-type')) ??
          (await item.locator('[data-fieldtype], [data-field-type]').first().getAttribute('data-fieldtype')) ??
          (await item.locator('[data-fieldtype], [data-field-type]').first().getAttribute('data-field-type'));

        if (!fieldType || !/^\d+$/.test(fieldType)) continue;

        if (this.shouldSkipDropdownField(label, fieldType)) {
          skipped.push(`${label} (ui ${fieldType})`);
          continue;
        }

        addField(label, fieldType);
      }
 
      const scrolled = await list
        .evaluate((el) => {
          const before = el.scrollTop;
          el.scrollTop += Math.max(el.clientHeight, 80);
          return el.scrollTop > before;
        })
        .catch(() => false);
      if (!scrolled) break;
    }
 
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.waitReady();
 
    const captured = [...preferred, ...other];

    if (skipped.length > 0) {
      console.log(`Skipped filter fields: ${skipped.join(', ')}`);
    }
    console.log(
      'Eligible filter fields:',
      captured.map((f) => `${f.label} (ui ${f.fieldType})`).join(', '),
    );
    if (other.length > 0) {
      console.log(
        `[listViewFilter] ${preferred.length} preferred (Allfields.json), ${other.length} additional module field(s)`,
      );
    }
    return captured;
  }

  /** Pick up to fieldCount fields — preferred labels first, then any other eligible module fields. */
  private pickFilterFields(
    captured: CapturedFilterField[],
    fieldCount: number,
  ): CapturedFilterField[] {
    const preferred = captured.filter((f) => this.isPreferredFilterLabel(f.label));
    const other = captured.filter((f) => !this.isPreferredFilterLabel(f.label));
    const pool = [...preferred, ...other];
    const count = Math.min(fieldCount, pool.length);
    const randomIndexes = this.pickRandomIndexes(count, pool.length);
    return randomIndexes.map((i) => pool[i]!);
  }
 
  /** Random unique indexes (filter.ts chooseRandomFields pattern). */
  private pickRandomIndexes(fieldCount: number, poolSize: number): number[] {
    const selectedIndexes = new Set<number>();
    while (selectedIndexes.size < fieldCount) {
      selectedIndexes.add(Math.floor(Math.random() * poolSize));
    }
    return [...selectedIndexes];
  }
 
  async selectFieldFromDropdown(fieldName: string) {
    await this.addedFilter();
    await this.page.locator('#searchFieldData').fill(fieldName);
    await this.page
      .locator('.module-field-list')
      .getByText(fieldName, { exact: true })
      .first()
      .click();
    await this.waitReady();
  }
 
  /** Index of filter row by title attribute (matches order fields were added). */
  private async filterRowIndex(fieldName: string): Promise<number> {
    const titles = this.filterPanel().locator('[title]');
    const count = await titles.count();
    for (let i = 0; i < count; i++) {
      const title = (await titles.nth(i).getAttribute('title'))?.trim();
      if (title === fieldName) return i;
    }
    return -1;
  }
 
  /** Value from Allfields.json by data-fieldtype, with sensible defaults when key is missing. */
  private resolveValueFromAllfields(
    data: ReturnType<typeof loadAllfieldsRow>,
    fieldName: string,
    fieldType: string,
  ): string {
    const byType = valueForFieldType(data, fieldType);
    if (byType) return byType;

    const byLabel = valueForField(data, fieldName);
    if (byLabel) return byLabel;

    const kind = getFieldKind(fieldType);
    if (kind === 'email' && data['2'] != null) return String(data['2']);
    if (kind === 'phone' && data['4'] != null) return String(data['4']);
    if (kind === 'number' && data['24'] != null) return String(data['24']);
    if (kind === 'date' || DATE_UI_TYPES.has(fieldType)) {
      if (data[fieldType] != null && data[fieldType] !== '') {
        return String(data[fieldType]);
      }
      if (data['19'] != null) return String(data['19']);
      if (data['7'] != null) return String(data['7']);
      return this.defaultDateValue(fieldType);
    }
    if (kind === 'textarea' && data['5'] != null) return String(data['5']);
    if (kind === 'picklist') {
      const raw = data['3'] ?? data['9'] ?? data['29'];
      return raw !== undefined ? String(raw) : '1';
    }
    if (data['1'] != null) return String(data['1']);
    return 'Automation';
  }
 
  private defaultDateValue(fieldType: string): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    if (fieldType === '20') return '10:30';
    if (fieldType === '19') return `${dd}-${mm}-${yyyy} 10:30`;
    return `${dd}-${mm}-${yyyy}`;
  }

  private extractDayFromDateString(value: string): string {
    const part = value.split(/\s+/)[0] ?? value;
    const bits = part.split(/[-/]/);
    if (bits.length !== 3) return String(new Date().getDate());
    if (bits[0].length === 4) return String(parseInt(bits[2], 10));
    return String(parseInt(bits[0], 10));
  }

  private async clickDateTimePopupApply(): Promise<void> {
    await this.page.waitForTimeout(300);
    const pickerApply = this.page
      .locator(
        '.daterangepicker:visible button.applyBtn, .daterangepicker:visible .applyBtn, .daterangepicker:visible button:has-text("Apply"), .drp-buttons:visible button:has-text("Apply"), .clockpicker-popover:visible button:has-text("Apply"), .datepicker:visible button:has-text("Apply")',
      )
      .last();

    if ((await pickerApply.count()) > 0) {
      await pickerApply.click({ force: true, timeout: 5_000 }).catch(() => {});
      await this.page.waitForTimeout(300);
    }
  }

  /** Date / date-time list filters: click Enter value, pick calendar day, Apply picker. */
  private async fillDateFilterInRow(
    row: Locator,
    fieldType: string,
    value: string,
  ): Promise<boolean> {
    const dateValue = value.trim() || this.defaultDateValue(fieldType);
    const day = this.extractDayFromDateString(dateValue);

    const candidates = [
      row.getByRole('textbox', { name: /enter value/i }).first(),
      row.locator('input.filter-input:visible').first(),
      row.locator('input[type="text"]:visible:not([type="hidden"])').first(),
      row.locator('input:visible:not([type="hidden"])').first(),
    ];

    let input: Locator | null = null;
    for (const candidate of candidates) {
      if ((await candidate.count()) === 0) continue;
      if (await candidate.isVisible({ timeout: 1_500 }).catch(() => false)) {
        input = candidate;
        break;
      }
    }
    if (!input) return false;

    await input.scrollIntoViewIfNeeded();
    await input.click({ force: true });
    await this.page.waitForTimeout(500);

    const picker = this.page
      .locator('.daterangepicker:visible, .flatpickr-calendar.open')
      .last();
    if ((await picker.count()) > 0) {
      const dayCell = picker
        .locator(
          'td.available, td.weekend, td.active, .flatpickr-day:not(.flatpickr-disabled)',
        )
        .filter({ hasText: new RegExp(`^${day}$`) })
        .first();
      if ((await dayCell.count()) > 0) {
        await dayCell.click({ force: true });
      }
      await this.clickDateTimePopupApply();
    }

    let entered = ((await input.inputValue().catch(() => '')) || '').trim();
    if (!entered) {
      await input.evaluate((el, val) => {
        const inp = el as HTMLInputElement;
        inp.value = String(val ?? '');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }, dateValue);
      await this.page.waitForTimeout(300);
      await this.clickDateTimePopupApply();
      entered = ((await input.inputValue().catch(() => '')) || '').trim();
    }

    if (!entered) {
      await input.fill(dateValue);
      await this.page.waitForTimeout(300);
      await this.clickDateTimePopupApply();
      entered = ((await input.inputValue().catch(() => '')) || '').trim();
    }

    return entered.length > 0;
  }

  private async firstUsableSelectIndex(select: Locator): Promise<number> {
    return select.evaluate((el) => {
      const opts = Array.from((el as HTMLSelectElement).options);
      const idx = opts.findIndex(
        (o, i) =>
          i > 0 &&
          !o.disabled &&
          o.value &&
          o.text.trim() &&
          !/^select|--|none|choose/i.test(o.text.trim()),
      );
      return idx >= 0 ? idx : Math.min(1, opts.length - 1);
    });
  }
 
  async selectOperator(fieldName: string, fieldType: string, operator: string) {
    if (getFieldKind(fieldType) !== 'assignedTo') return;
 
    const row = this.filterRow(fieldName);
    await row.scrollIntoViewIfNeeded();
    if (((await row.innerText().catch(() => '')) || '').includes(operator)) return;
 
    await row.locator('.field-filter-condition, .fa-caret-down').first().click({ force: true });
    const search = this.page.locator('#searchConditionOption');
    if (await search.isVisible({ timeout: 1500 }).catch(() => false)) {
      await search.fill(operator);
    }
    await this.page.getByRole('treeitem', { name: operator, exact: true }).click({ timeout: 8000 });
  }
 
  private async selectAssignedToValue(fieldName: string, value: string) {
    const row = this.filterRow(fieldName);
    await row.scrollIntoViewIfNeeded();
 
    const circleInput = row.locator('.filter-circle-input').first();
    if (await circleInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await circleInput.click();
      await this.page.waitForTimeout(400);
 
      const userItems = row.locator('.user-item:visible');
      if ((await userItems.count()) > 0) {
        const byName = row.locator('.user-full-name').filter({ hasText: value });
        if ((await byName.count()) > 0) {
          await byName.first().click();
        } else {
          await userItems.first().click();
        }
        await row
          .locator('.filteraction-buttons .apply-btn:visible')
          .first()
          .click({ timeout: 5_000 })
          .catch(() => {});
        return;
      }
 
      const popupOptions = this.page.locator(
        '.select2-results__option[role="treeitem"]:visible:not(.select2-results__option--disabled)',
      );
      if ((await popupOptions.count()) > 0) {
        const match = popupOptions.filter({ hasText: value }).first();
        if ((await match.count()) > 0) {
          await match.click();
        } else {
          const n = await popupOptions.count();
          await popupOptions.nth(n > 1 ? 1 : 0).click();
        }
        await row
          .locator('.filteraction-buttons .apply-btn:visible')
          .first()
          .click({ timeout: 5_000 })
          .catch(() => {});
        return;
      }
    }
 
    if (await this.fillSelect2ByText(row, value)) {
      return;
    }

    const select = row.locator('select:visible').first();
    if ((await select.count()) > 0) {
      await select
        .selectOption({ label: value })
        .catch(() => select.selectOption({ index: 1 }));
      return;
    }

    throw new Error(`Could not select Assigned To value "${value}"`);
  }
 
  async selectValue(
    fieldName: string,
    fieldType: string,
    value: string,
    data: ReturnType<typeof loadAllfieldsRow>,
  ) {
    const row = this.filterRow(fieldName);
    await row.scrollIntoViewIfNeeded();
    const kind = getFieldKind(fieldType);
    const fillValue = value || 'Automation';
    const pickIndex =
      getPicklistOptionIndex(data, fieldType) ??
      (Number.isInteger(Number(fillValue)) ? Number(fillValue) : null);

    if (kind === 'assignedTo') {
      await this.selectAssignedToValue(fieldName, fillValue);
      console.log(`    ✓ ${fieldName}: assignedTo → ${fillValue}`);
      return;
    }

    if (
      (kind === 'date' || DATE_UI_TYPES.has(fieldType)) &&
      (await this.fillDateFilterInRow(row, fieldType, fillValue))
    ) {
      console.log(`    ✓ ${fieldName}: date → ${fillValue}`);
      return;
    }

    if (await this.fillNativeDropdownsInRow(row, pickIndex, fillValue, kind)) {
      console.log(`    ✓ ${fieldName}: native select`);
      return;
    }

    if (await this.fillSelect2InRow(row, pickIndex)) {
      console.log(`    ✓ ${fieldName}: select2`);
      return;
    }

    if (await this.fillCirclePopupInRow(row, fieldType, pickIndex, fillValue)) {
      console.log(`    ✓ ${fieldName}: circle popup`);
      return;
    }

    if (
      (kind === 'picklist' || DROPDOWN_FIELD_TYPES.has(fieldType)) &&
      pickIndex === null &&
      fillValue &&
      (await this.fillSelect2ByText(row, fillValue))
    ) {
      console.log(`    ✓ ${fieldName}: select2 by text → ${fillValue}`);
      return;
    }

    if (kind === 'phone' && (await this.fillSelect2ByText(row, fillValue))) {
      console.log(`    ✓ ${fieldName}: phone/select2 → ${fillValue}`);
      return;
    }

    const textInput = row.locator(
      'input:visible:not([type="hidden"]):not([type="checkbox"]):not([readonly]), textarea:visible:not([readonly])',
    ).first();
    if ((await textInput.count()) > 0) {
      await textInput.fill(fillValue);
      console.log(`    ✓ ${fieldName}: text input → ${fillValue}`);
      return;
    }

    const filterInput = row.locator('input.filter-input').first();
    if (await filterInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await filterInput.fill(fillValue);
      console.log(`    ✓ ${fieldName}: filter-input → ${fillValue}`);
      return;
    }

    const enterValue = row.getByRole('textbox', { name: /enter value/i });
    if ((await enterValue.count()) > 0) {
      await enterValue.first().fill(fillValue);
      console.log(`    ✓ ${fieldName}: Enter value → ${fillValue}`);
      return;
    }

    const idx = await this.filterRowIndex(fieldName);
    const panelInputs = this.filterPanel().getByRole('textbox', { name: /enter value/i });
    if (idx >= 0 && (await panelInputs.count()) > idx) {
      await panelInputs.nth(idx).fill(fillValue);
      console.log(`    ✓ ${fieldName}: panel Enter value [${idx}] → ${fillValue}`);
      return;
    }

    throw new Error(`Could not set value for filter field "${fieldName}" (ui ${fieldType})`);
  }

  private async fillNativeDropdownsInRow(
    row: Locator,
    pickIndex: number | null,
    fillValue: string,
    kind: ReturnType<typeof getFieldKind>,
  ): Promise<boolean> {
    const dropdowns = row.locator('select:visible:not([disabled])');
    const count = await dropdowns.count();
    if (count === 0) return false;

    for (let i = 0; i < count; i++) {
      const dropdown = dropdowns.nth(i);
      const optionCount = await dropdown.locator('option').count();
      if (optionCount === 0) continue;

      if (pickIndex !== null && kind === 'picklist') {
        const domIndex = Math.min(pickIndex, optionCount - 1);
        await dropdown.selectOption({ index: domIndex });
      } else {
        const fallback = await this.firstUsableSelectIndex(dropdown);
        await dropdown
          .selectOption({ label: fillValue })
          .catch(() => dropdown.selectOption({ index: fallback }));
      }
      await dropdown.dispatchEvent('change');
    }
    return true;
  }

  private async fillSelect2InRow(row: Locator, pickIndex: number | null): Promise<boolean> {
    const dropdowns = row.locator('.select2-selection:visible');
    if ((await dropdowns.count()) === 0) return false;

    await dropdowns.first().click();
    const options = this.page.locator(
      '.select2-results__option[role="treeitem"]:visible:not(.select2-results__option--disabled)',
    );
    await expect(options.first()).toBeVisible({ timeout: 15_000 });

    const n = await options.count();
    const idx =
      pickIndex !== null
        ? Math.max(0, Math.min(pickIndex - 1, n - 1))
        : n > 1
          ? 1
          : 0;
    await options.nth(idx).click();
    return true;
  }

  private async fillCirclePopupInRow(
    row: Locator,
    fieldType: string,
    pickIndex: number | null,
    fillValue: string,
  ): Promise<boolean> {
    const circle = row.locator('.filter-circle-input').first();
    if ((await circle.count()) === 0) return false;

    await circle.click();
    await this.page.waitForTimeout(400);

    const userItems = row.locator('.user-item:visible');
    if ((await userItems.count()) > 0) {
      const byName = row.locator('.user-full-name').filter({ hasText: fillValue });
      if ((await byName.count()) > 0) {
        await byName.first().click();
      } else {
        await userItems.first().click();
      }
      await row.locator('.filteraction-buttons .apply-btn:visible').first().click({ timeout: 5_000 }).catch(() => {});
      return true;
    }

    const popupOptions = row.locator(
      '.select2-results__option[role="treeitem"]:visible:not(.select2-results__option--disabled), .dropdown-item:visible, li:visible',
    );
    if ((await popupOptions.count()) > 0) {
      const n = await popupOptions.count();
      const idx =
        pickIndex !== null
          ? Math.max(0, Math.min(pickIndex - 1, n - 1))
          : n > 1
            ? 1
            : 0;
      await popupOptions.nth(idx).click();
      await row.locator('.filteraction-buttons .apply-btn:visible').first().click({ timeout: 5_000 }).catch(() => {});
      return true;
    }

    if (!DROPDOWN_FIELD_TYPES.has(fieldType)) return false;

    const selected = await row.evaluate((el, rawValue) => {
      const requestedIndex = Number(rawValue);
      const optionIndex = Number.isInteger(requestedIndex)
        ? Math.max(0, requestedIndex - 1)
        : 0;
      const blocked = new Set(['', 'clear', 'search', 'select all', 'cancel', 'apply']);
      const candidates = Array.from((el as HTMLElement).querySelectorAll<HTMLElement>('div, span, label, li'))
        .filter((node) => {
          const style = window.getComputedStyle(node);
          const text = node.innerText.trim().toLowerCase();
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            node.offsetParent !== null &&
            !blocked.has(text) &&
            !node.closest('.filter-content') &&
            !node.closest('.filteraction-buttons') &&
            node.children.length === 0
          );
        });
      const option = candidates[optionIndex] ?? candidates[0];
      if (!option) return false;
      option.click();
      return true;
    }, pickIndex ?? fillValue);

    if (selected) {
      await row.locator('.filteraction-buttons .apply-btn:visible').first().click({ timeout: 5_000 }).catch(() => {});
      return true;
    }

    return false;
  }

  private async fillSelect2ByText(row: Locator, text: string): Promise<boolean> {
    const dd = row.locator('.select2-selection:visible').first();
    if ((await dd.count()) === 0) return false;

    await dd.click();
    const search = this.page.locator('.select2-container--open .select2-search__field');
    if ((await search.count()) > 0) {
      await search.fill(text);
      await this.page.waitForTimeout(400);
    }

    const option = this.page
      .locator(
        '.select2-results__option[role="treeitem"]:visible:not(.select2-results__option--disabled)',
      )
      .filter({ hasText: text })
      .first();

    if ((await option.count()) > 0) {
      await option.click();
      return true;
    }

    const options = this.page.locator(
      '.select2-results__option[role="treeitem"]:visible:not(.select2-results__option--disabled)',
    );
    if ((await options.count()) === 0) return false;
    await options.nth((await options.count()) > 1 ? 1 : 0).click();
    return true;
  }

  /** Clears applied filter chip via toolbar close_small icon (material symbol span). */
  private async closeAppliedFilterChip() {
    const closeIcon = this.page
      .locator(
        'button.add-filter-btn .fields-filter-remove[data-field-filter="field_filter"], button.calendar-toolbar-filter-btn .fields-filter-remove',
      )
      .filter({ hasText: /close_small/i })
      .first();

    if (await closeIcon.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await closeIcon.click({ force: true });
      await this.waitReady();
      return;
    }

    const fallback = this.page
      .locator('.material-symbols-outlined.fields-filter-remove')
      .filter({ hasText: /close_small/i })
      .first();
    if (await fallback.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await fallback.click({ force: true });
      await this.waitReady();
    }
  }

  async Apply() {
    await this.page.getByRole('button', { name: 'Apply', exact: true }).click();
    await this.page.waitForTimeout(2_500);
    await this.waitReady();
    await this.closeAppliedFilterChip();
  }
 
  async applyThreeRandomFilters(rowIndex = 0) {
    const data = loadAllfieldsRow(rowIndex);

    const captured = await this.captureDropdownFieldsWithType();
    if (captured.length === 0) {
      throw new Error(
        'No eligible filter fields found for this module (check Allfields.json fieldNames).',
      );
    }

    const fieldCount = Math.min(FILTER_FIELD_COUNT, captured.length);
    if (fieldCount < FILTER_FIELD_COUNT) {
      console.log(
        `[listViewFilter] Applying ${fieldCount} filter(s) — only ${captured.length} eligible field(s) on this module`,
      );
    }

    const selected = this.pickFilterFields(captured, fieldCount);
 
    console.log(
      'Random filter fields:',
      selected.map((f) => `${f.label} (ui ${f.fieldType})`).join(', '),
    );
 
    for (let i = 0; i < selected.length; i++) {
      const field = selected[i]!;
      console.log(`  Add filter ${i + 1}/${fieldCount}: ${field.label}`);
      await this.selectFieldFromDropdown(field.label);
 
      const operator = operatorForField(field.label);
      const value = this.resolveValueFromAllfields(data, field.label, field.fieldType);
      console.log(`  ${field.label} (ui ${field.fieldType}): ${operator} → ${value}`);
      await this.selectOperator(field.label, field.fieldType, operator);
      await this.selectValue(field.label, field.fieldType, value, data);
      await this.waitReady();
    }
 
    console.log('Applying list view filters…');
    await this.Apply();
    return selected.map((f) => f.label);
  }
}
 
/** Open list filter panel, apply 3 random filters using Allfields.json values. */
export async function runListViewFilter(page: Page, rowIndex = 0) {
  await expect(page.locator('#livewireOverly')).toBeHidden({ timeout: 60_000 });
  await page
    .waitForURL(/AdvancedListView|view=AdvancedListView/i, { timeout: 30_000 })
    .catch(() => {});
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  const listFilter = new Listviewfilter(page);
  await listFilter.ensureFilterPanelOpen();
  await listFilter.noFilter();
  const fields = await listFilter.applyThreeRandomFilters(rowIndex);
  expect(fields.length).toBeGreaterThan(0);
  console.log(`[listViewFilter] Applied: ${fields.join(', ')}`);
  await expect(page.locator('#livewireOverly')).toBeHidden({ timeout: 30_000 });
  return fields;
}
 
 