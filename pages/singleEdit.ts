import filterFieldTypeData from '../data/filterFieldTypeData.json';
import { Page, expect, Locator } from '@playwright/test';

type FieldDataRow = Record<string, string | number | boolean>;

const DROPDOWN_FIELD_TYPES = new Set([
  '3', '13', '14', '15', '21', '23', '29', '30', '31',
]);
const PICKLIST_TYPE = '9';
/** Lookup fields: search icon → popup index 0 → tick */
const SEARCH_LOOKUP_TYPES = new Set(['11']);
const DATE_TIME_FIELD_TYPES = new Set(['7', '16', '17', '19', '33']);
const SKIP_TYPES = new Set(['20']);
const TEXT_FIELD_TYPES = new Set(['1', '2', '4', '5', '10', '12', '22', '24', '25', '26']);
const CHECKBOX_FIELD_TYPES = new Set(['6']);

function loadData(rowIndex = 0): FieldDataRow {
  const rows = filterFieldTypeData as FieldDataRow[];
  if (!rows[rowIndex]) throw new Error(`filterFieldTypeData.json missing row ${rowIndex}`);
  return rows[rowIndex];
}

function orderedTypes(data: FieldDataRow): string[] {
  return Object.keys(data)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b));
}

function skipValue(v: unknown): boolean {
  return v === undefined || v === null || v === '';
}

function todayDatePrefix(): string {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function resolveDate(value: unknown): string {
  return String(value ?? '').replace(/^\d{4}-\d{2}-\d{2}/, todayDatePrefix());
}

export class Book {
  constructor(private page: Page) {}

  private rows() {
    return this.page.locator('tr:visible').filter({
      has: this.page.locator('.rs_col_2'),
      hasNot: this.page.locator('.select2-results__option'),
    });
  }

  private cell(row: Locator) {
    return row.locator('.rs_col_2').first();
  }

  private async fieldType(row: Locator): Promise<string | null> {
    const c = this.cell(row);
    if ((await c.count()) > 0) {
      const t =
        (await c.getAttribute('data-att-fieldtype')) || (await c.getAttribute('data-fieldtype'));
      if (t) return t;
    }
    const icon = row.locator('.fa-edit').first();
    if ((await icon.count()) === 0) return null;
    return (
      (await icon.getAttribute('data-att-fieldtype')) ||
      (await icon.getAttribute('data-fieldtype')) ||
      null
    );
  }

  private async rowKey(row: Locator): Promise<string> {
    const id =
      (await this.cell(row).getAttribute('data-att-fieldid')) ||
      (await row.locator('.fa-edit').first().getAttribute('data_fieldid'));
    return id ? `id:${id}` : `row:${await row.innerText()}`;
  }

  private async waitOverlay() {
    await this.page.locator('#livewireOverly').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  }

  private async closePopup() {
    const modal = this.page.locator('#RelatedPopupAppend.modal.show, #RelatedPopupAppend:visible').last();
    if ((await modal.count()) === 0) return;
    const close = modal.locator('.btn-close, .close, [data-bs-dismiss="modal"]').first();
    if ((await close.count()) > 0) await close.click({ force: true });
    else await this.page.keyboard.press('Escape').catch(() => {});
    await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  private async openEdit(row: Locator): Promise<boolean> {
    await this.closePopup();
    const icon = row.locator('.fa-edit').first();
    if ((await icon.count()) === 0) return false;

    await row.scrollIntoViewIfNeeded();
    await this.cell(row).hover({ force: true }).catch(() => {});

    await icon.evaluate((el) => {
      const w = window as Window & { ClickPencilIcon?: (n: Element) => void };
      if (typeof w.ClickPencilIcon === 'function') w.ClickPencilIcon(el);
      else (el as HTMLElement).click();
    });

    const editor = this.cell(row).locator(
      '.select2-selection, select, [role="combobox"], textarea, input:not([type="hidden"])'
    ).first();
    await expect(editor).toBeVisible({ timeout: 10000 });
    return true;
  }

  private async tick(row: Locator) {
    await row
      .locator('.submiticonSummary, .submiticon, .fa-check, .saveIcon')
      .first()
      .click({ force: true, timeout: 8000 });
    await this.waitOverlay();
  }

  private searchIcon(scope: Locator, row: Locator): Locator {
    return scope
      .locator('.searchicon, [title="Search"], .fa-search, .related-link')
      .or(row.locator('.searchicon, [title="Search"], .fa-search, .related-link'))
      .last();
  }

  private async isAssignedToRow(row: Locator): Promise<boolean> {
    if ((await row.getByRole('cell', { name: /assigned\s*to/i }).count()) > 0) return true;
    if ((await row.locator('label', { hasText: /assigned\s*to/i }).count()) > 0) return true;
    const labelCell = row.locator('td').first();
    if ((await labelCell.count()) > 0) {
      return /assigned\s*to/i.test((await labelCell.innerText()) ?? '');
    }
    return /assigned\s*to/i.test(await row.innerText());
  }

  /** uiType 11 — lookup: search → first popup row → tick */
  private async fillType11(row: Locator): Promise<string | null> {
    const scope = this.cell(row);
    const search = this.searchIcon(scope, row);
    if ((await search.count()) === 0) return null;

    await search.click({ force: true });
    const modal = this.page.locator('#RelatedPopupAppend.modal.show, #RelatedPopupAppend:visible').last();
    await expect(modal).toBeVisible({ timeout: 10000 });

    const list = modal.locator('tbody tr:visible, .user-item:visible');
    await expect(list.first()).toBeVisible({ timeout: 10000 });

    let dataIdx = 0;
    for (let i = 0; i < (await list.count()); i++) {
      const item = list.nth(i);
      const text = (await item.textContent())?.trim() ?? '';
      if (!text || /no\s*data/i.test(text)) continue;
      if (dataIdx === 0) {
        await item.click({ force: true });
        await this.closePopup();
        return text;
      }
      dataIdx++;
    }

    await list.first().click({ force: true });
    await this.closePopup();
    return (await list.first().textContent())?.trim() ?? null;
  }

  /** uiType 9 — picklist: select2 / native by JSON index */
  private async fillType9(scope: Locator, index: number): Promise<boolean> {
    const dd = scope.locator('.select2-selection').first();
    if ((await dd.count()) > 0) {
      await dd.click({ force: true });
      const opts = this.page.locator(
        '.select2-container--open .select2-results__option[role="treeitem"]:not(.select2-results__option--disabled), .select2-container--open .select2-results__option:not(.select2-results__option--disabled)'
      );
      await expect(opts.first()).toBeVisible({ timeout: 10000 });
      const n = await opts.count();
      const pick = Math.min(Math.max(0, index), n - 1);
      await opts.nth(pick).click({ force: true });
      return true;
    }

    const sel = scope.locator('select:visible').first();
    if ((await sel.count()) > 0) {
      const n = await sel.locator('option').count();
      const pick = Math.min(Math.max(0, index), n - 1);
      await sel.selectOption({ index: pick });
      await sel.dispatchEvent('change');
      return true;
    }

    const combo = scope.getByRole('combobox').first();
    if ((await combo.count()) > 0) {
      await combo.click({ force: true });
      const items = this.page.getByRole('treeitem');
      await expect(items.first()).toBeVisible({ timeout: 10000 });
      await items.nth(Math.min(index, (await items.count()) - 1)).click({ force: true });
      return true;
    }

    return false;
  }

  private async fillSelect2(scope: Locator, index: number): Promise<boolean> {
    const dd = scope.locator('.select2-selection').first();
    if ((await dd.count()) === 0) return false;
    await dd.click({ force: true });

    const opts = this.page.locator(
      '.select2-container--open .select2-results__option:not(.select2-results__option--disabled)'
    );
    try {
      await expect(opts.first()).toBeVisible({ timeout: 5000 });
    } catch {
      return false;
    }

    const pick = Math.min(Math.max(0, index), (await opts.count()) - 1);
    await opts.nth(pick).click({ force: true });
    return true;
  }

  private async fillNative(scope: Locator, index: number): Promise<boolean> {
    const sel = scope.locator('select:visible').first();
    if ((await sel.count()) === 0) return false;
    const n = await sel.locator('option').count();
    if (n === 0) return false;
    const pick = Math.min(Math.max(0, index), n - 1);
    await sel.selectOption({ index: pick });
    await sel.dispatchEvent('change');
    return true;
  }

  private async fillText(scope: Locator, value: string): Promise<boolean> {
    const ta = scope.locator('textarea:visible').first();
    if ((await ta.count()) > 0) {
      await ta.fill(value);
      return true;
    }
    const inp = scope.locator('input:visible:not([type="hidden"]):not([type="checkbox"])').first();
    if ((await inp.count()) > 0) {
      await inp.fill(value);
      return true;
    }
    return false;
  }

  private async fillDate(scope: Locator, value: string): Promise<boolean> {
    const inp = scope.locator('input:visible').first();
    if ((await inp.count()) === 0) return false;
    await inp.click({ force: true });
    const part = value.split(/\s+/)[0];
    const day = String(parseInt(part.split('-')[2] ?? '1', 10));
    const picker = this.page.locator('.daterangepicker:visible').last();
    if ((await picker.count()) > 0) {
      const cell = picker.locator('td.available, td.weekend').filter({ hasText: new RegExp(`^${day}$`) }).first();
      if ((await cell.count()) > 0) {
        await cell.click({ force: true });
        const apply = picker.locator('button.applyBtn, .applyBtn').first();
        if ((await apply.count()) > 0) await apply.click({ force: true });
        return true;
      }
    }
    await inp.fill(part);
    return true;
  }

  private optionIndex(value: unknown): number {
    const n = Number(value);
    return Number.isInteger(n) ? n : 0;
  }

  private async fillRow(row: Locator, type: string, value: unknown): Promise<boolean> {
    if (!(await this.openEdit(row))) return false;

    const scope = this.cell(row);
    let ok = false;

    if (SEARCH_LOOKUP_TYPES.has(type)) {
      ok = (await this.fillType11(row)) !== null;
    } else if (type === PICKLIST_TYPE) {
      ok = await this.fillType9(scope, this.optionIndex(value));
    } else if (CHECKBOX_FIELD_TYPES.has(type)) {
      const cb = scope.locator('input[type="checkbox"]:visible').first();
      if ((await cb.count()) > 0) {
        await cb.setChecked(Boolean(value));
        ok = true;
      }
    } else if (DROPDOWN_FIELD_TYPES.has(type)) {
      const idx = this.optionIndex(value);
      ok =
        (await this.fillSelect2(scope, idx)) ||
        (await this.fillNative(scope, idx));
    } else if (DATE_TIME_FIELD_TYPES.has(type) || type === '33') {
      ok = await this.fillDate(scope, resolveDate(value));
    } else if (TEXT_FIELD_TYPES.has(type)) {
      ok = await this.fillText(scope, String(value));
    } else {
      ok = await this.fillText(scope, String(value));
    }

    if (!ok) {
      await this.page.keyboard.press('Escape').catch(() => {});
      await this.closePopup();
      return false;
    }

    await this.tick(row);
    return true;
  }

  /** Single-edit all summary fields from filterFieldTypeData.json */
  async runFromTestdata(rowIndex = 0): Promise<void> {
    const data = loadData(rowIndex);
    const allRows = this.rows();
    await expect(allRows.first()).toBeVisible({ timeout: 20000 });

    const count = await allRows.count();
    const seen = new Set<string>();
    let edited = 0;

    for (const type of orderedTypes(data)) {
      if (SKIP_TYPES.has(type)) continue;

      const value = data[type];
      if (skipValue(value)) continue;

      for (let i = 0; i < count; i++) {
        const row = allRows.nth(i);
        if ((await this.fieldType(row)) !== type) continue;
        if ((await row.locator('.fa-edit').count()) === 0) continue;

        const key = await this.rowKey(row);
        if (seen.has(key)) continue;
        seen.add(key);

        // Assigned To — never edit (JSON "9":2 / "11":2 was changing it to Admin)
        if (await this.isAssignedToRow(row)) continue;

        if (await this.fillRow(row, type, value)) edited++;
      }
    }

    if (edited === 0) {
      throw new Error('No fields updated from filterFieldTypeData.json on Leads detail view.');
    }
  }
}
